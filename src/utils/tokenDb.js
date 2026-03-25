// Lightweight IndexedDB wrapper for token persistence

const DB_NAME = "xyzw_token_db";
const DB_VERSION = 1;
const STORE_KV = "kv";
const STORE_GAME_TOKENS = "gameTokens";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_GAME_TOKENS)) {
        db.createObjectStore(STORE_GAME_TOKENS, { keyPath: "roleId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// KV helpers
export async function getKV(key) {
  return withStore(STORE_KV, "readonly", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function setKV(key, value) {
  return withStore(STORE_KV, "readwrite", (store) => {
    store.put({ key, value });
  });
}

export async function deleteKV(key) {
  return withStore(STORE_KV, "readwrite", (store) => {
    store.delete(key);
  });
}

// User token
export async function getUserToken() {
  return getKV("userToken");
}
export async function setUserToken(token) {
  return setKV("userToken", token);
}
export async function clearUserToken() {
  return deleteKV("userToken");
}

// Game tokens (per role)
export async function getAllGameTokens() {
  return withStore(STORE_GAME_TOKENS, "readonly", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const arr = req.result || [];
        const map = {};
        arr.forEach((t) => {
          if (t && t.roleId) map[t.roleId] = t;
        });
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function putGameToken(roleId, tokenData) {
  return withStore(STORE_GAME_TOKENS, "readwrite", (store) => {
    store.put({ ...tokenData, roleId });
  });
}

export async function deleteGameToken(roleId) {
  return withStore(STORE_GAME_TOKENS, "readwrite", (store) => {
    store.delete(roleId);
  });
}

export async function clearGameTokens() {
  return withStore(STORE_GAME_TOKENS, "readwrite", (store) => {
    store.clear();
  });
}

// Migration from localStorage for backward compatibility
export async function migrateFromLocalStorageIfNeeded() {
  try {
    const existing = await getAllGameTokens();
    const hasAny = existing && Object.keys(existing).length > 0;
    const userTok = await getUserToken();
    const hasUser = !!userTok;

    // If DB already has data, skip
    if (hasAny || hasUser) return { migrated: false };

    // Try migrate from localStorage
    const lsUser = localStorage.getItem("userToken");
    const lsGameTokensRaw = localStorage.getItem("gameTokens");
    let lsGameTokens = {};
    try {
      lsGameTokens = lsGameTokensRaw ? JSON.parse(lsGameTokensRaw) : {};
    } catch {
      lsGameTokens = {};
    }

    const lsHasAny =
      lsUser || (lsGameTokens && Object.keys(lsGameTokens).length > 0);
    if (!lsHasAny) return { migrated: false };

    if (lsUser) await setUserToken(lsUser);
    for (const [roleId, tokenData] of Object.entries(lsGameTokens || {})) {
      await putGameToken(roleId, tokenData);
    }

    // Optional: do not remove localStorage to avoid surprises
    return { migrated: true };
  } catch (e) {
    console.warn("Token DB migration skipped:", e);
    return { migrated: false, error: e?.message };
  }
}
