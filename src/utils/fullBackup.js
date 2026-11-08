/**
 * XYZW Web Helper — full backup / restore.
 *
 * Coverage:
 *  - localStorage: all business config (token list, batch settings, scheduled
 *    tasks, task templates, per-account daily-settings, groups, sort/display
 *    preferences, theme, etc.)
 *  - IndexedDB `xyzw_token_db`: userToken + gameTokens (legacy token storage)
 *  - IndexedDB `xyzw`: tokens (BIN login credentials as ArrayBuffer)
 *
 * Not backed up: regenerable/derived data and transient connection state
 * (bin_data_* hex, ws_connection_*, activeConnections, changelogs cache, etc.).
 */

const BACKUP_APP = "xyzw-web-helper";
const BACKUP_KIND = "xyzw-full-backup";
const BACKUP_VERSION = 1;

/** localStorage keys excluded from backup (by prefix or exact name) */
const SKIP_PREFIXES = ["ws_connection_", "bin_data_"];
const SKIP_KEYS = new Set([
  "activeConnections",
  "multi-game_active_launch_v1",
  "FORCE_LOGIN",
  "test",
  "changelogs",
  "xyzw_chat_msg_list",
]);

/** localStorage JSON arrays merged by primary key on import */
const MERGE_ARRAY_KEYS = {
  gameTokens: "id",
  tokenGroups: "id",
};

/** IndexedDB layout used by the app (recreated on import when missing) */
const IDB_SCHEMA = {
  xyzw: {
    stores: {
      tokens: {
        keyPath: "id",
        indexes: [{ name: "by-created", keyPath: "createdAt" }],
      },
    },
  },
  xyzw_token_db: {
    stores: {
      kv: { keyPath: "key" },
      // `touchLastUsed`: these rows are aged out after 24h of inactivity, so a
      // restored one must be stamped as used now or it is deleted immediately.
      gameTokens: { keyPath: "roleId", touchLastUsed: true },
    },
  },
};

function shouldSkipKey(key) {
  if (SKIP_KEYS.has(key)) return true;
  return SKIP_PREFIXES.some((prefix) => key.startsWith(prefix));
}

// ==================== Value serialization (ArrayBuffer / Date) ====================

// Chunked ArrayBuffer -> base64. Avoids "Maximum call stack size exceeded"
// from spreading large byte arrays into String.fromCharCode.
function abToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + CHUNK, bytes.length)),
    );
  }
  return btoa(binary);
}

function base64ToAb(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function encodeValue(value) {
  // Primitives are JSON-safe as-is.
  if (value === null || value === undefined) return value;
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean")
    return value;
  // Tag non-JSON types so decodeValue() can rebuild them exactly.
  if (value instanceof Date)
    return { __xyzwType: "Date", value: value.toISOString() };
  if (value instanceof ArrayBuffer)
    return { __xyzwType: "ArrayBuffer", b64: abToBase64(value) };
  if (ArrayBuffer.isView(value)) {
    // Copy only the view's own range so shared backing buffers stay intact.
    const buffer = value.buffer.slice(
      value.byteOffset,
      value.byteOffset + value.byteLength,
    );
    return {
      __xyzwType: "TypedArray",
      ctor: value.constructor.name,
      b64: abToBase64(buffer),
    };
  }
  if (Array.isArray(value)) return value.map(encodeValue);
  if (type === "object") {
    const out = {};
    for (const key of Object.keys(value)) out[key] = encodeValue(value[key]);
    return out;
  }
  return value;
}

function decodeValue(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(decodeValue);

  // Rebuild tagged types produced by encodeValue().
  if (value.__xyzwType === "Date") return new Date(value.value);
  if (value.__xyzwType === "ArrayBuffer") return base64ToAb(value.b64);
  if (value.__xyzwType === "TypedArray") {
    const buffer = base64ToAb(value.b64);
    const Ctor = globalThis[value.ctor];
    return Ctor ? new Ctor(buffer) : buffer;
  }

  const out = {};
  for (const key of Object.keys(value)) out[key] = decodeValue(value[key]);
  return out;
}

// ==================== IndexedDB read / write ====================

// Wrapper around indexedDB.open that also handles the blocked/error cases.
function openRawDB(name, version, onCreateStores) {
  return new Promise((resolve, reject) => {
    const req = version ? indexedDB.open(name, version) : indexedDB.open(name);
    req.onupgradeneeded = () => {
      if (onCreateStores) onCreateStores(req.result);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(new Error(`Database ${name} is locked by another tab`));
  });
}

// Create any missing object stores / indexes declared in the schema.
function ensureStores(db, stores) {
  for (const [storeName, cfg] of Object.entries(stores)) {
    if (db.objectStoreNames.contains(storeName)) continue;
    const store = db.createObjectStore(storeName, { keyPath: cfg.keyPath });
    for (const index of cfg.indexes || []) {
      store.createIndex(index.name, index.keyPath);
    }
  }
}

/**
 * Open one of the app's IndexedDB databases.
 *
 * Always opens with version 1 (the version the rest of the app uses): when the
 * DB does not exist yet this creates it together with its stores; when it
 * already exists we do not bump the version, otherwise the app's own
 * `open(db, 1)` calls would throw VersionError.
 * If the stored version is higher and required stores are missing, we give up
 * on this DB (return null) and leave it to the app's own code.
 */
async function openAppDB(dbName, schema) {
  try {
    return await openRawDB(dbName, 1, (db) => ensureStores(db, schema.stores));
  } catch (error) {
    if (error?.name !== "VersionError") throw error;
  }

  const db = await openRawDB(dbName);
  const missing = Object.keys(schema.stores).some(
    (storeName) => !db.objectStoreNames.contains(storeName),
  );
  if (missing) {
    console.warn(`[backup] ${dbName} version mismatch, skipping`);
    db.close();
    return null;
  }
  return db;
}

// Read every object store of a DB and encode the values for JSON output.
// `schema` is used only when the DB does not exist yet: opening without a
// version would otherwise create an EMPTY database, which later makes the
// app's own `open(db, 1)` skip the upgrade and fail with NotFoundError.
function readAllStores(dbName, schema) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onupgradeneeded = () => {
      // DB is being created now: create the stores the app expects.
      if (schema) ensureStores(req.result, schema.stores);
    };
    req.onsuccess = () => {
      const db = req.result;
      const storeNames = Array.from(db.objectStoreNames);
      if (storeNames.length === 0) {
        db.close();
        resolve({});
        return;
      }
      const tx = db.transaction(storeNames, "readonly");
      const result = {};
      let pending = storeNames.length;
      storeNames.forEach((storeName) => {
        const getAllReq = tx.objectStore(storeName).getAll();
        getAllReq.onsuccess = () => {
          result[storeName] = (getAllReq.result || []).map(encodeValue);
          pending -= 1;
          if (pending === 0) {
            db.close();
            resolve(result);
          }
        };
        getAllReq.onerror = () => {
          db.close();
          reject(getAllReq.error);
        };
      });
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error(`Reading ${dbName} was blocked`));
  });
}

// Collect all app databases; a failing DB is skipped instead of aborting.
async function collectIndexedDB() {
  const result = {};
  for (const [dbName, schema] of Object.entries(IDB_SCHEMA)) {
    try {
      const stores = await readAllStores(dbName, schema);
      if (Object.keys(stores).length > 0) result[dbName] = stores;
    } catch (error) {
      console.warn(`[backup] Failed to read ${dbName}, skipping:`, error);
    }
  }
  return result;
}

function collectLocalStorage() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || shouldSkipKey(key)) continue;
    data[key] = localStorage.getItem(key);
  }
  return data;
}

// ==================== Export ====================

// Snapshot everything that matters into a single serializable object.
export async function collectFullBackup() {
  return {
    app: BACKUP_APP,
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    origin: typeof location === "undefined" ? "" : location.origin,
    localStorage: collectLocalStorage(),
    indexedDB: await collectIndexedDB(),
  };
}

// Trigger a browser download of the backup as a dated JSON file.
export function downloadBackupFile(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `xyzw_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== Import ====================

function parseJson(raw) {
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Merge two JSON arrays by primary key; existing local items win.
function mergeJsonArray(existingRaw, incomingRaw, idField) {
  const existing = Array.isArray(parseJson(existingRaw))
    ? parseJson(existingRaw)
    : [];
  const incoming = Array.isArray(parseJson(incomingRaw))
    ? parseJson(incomingRaw)
    : [];
  const seen = new Set(existing.map((item) => item?.[idField]).filter(Boolean));
  const merged = [...existing];
  for (const item of incoming) {
    const id = item?.[idField];
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }
  return merged;
}

// localStorage keys whose array items are aged out after 24h of inactivity.
// Restored items are stamped as used now, otherwise the app's cleanup would
// delete tokens that were just migrated from an older backup.
const TOUCH_LAST_USED_KEYS = new Set(["gameTokens"]);

// Bump `lastUsed` on every item of a JSON array, keeping all other fields.
function touchLastUsedItems(raw, now) {
  const items = parseJson(raw);
  if (!Array.isArray(items)) return raw;
  return JSON.stringify(
    items.map((item) =>
      item && typeof item === "object" ? { ...item, lastUsed: now } : item,
    ),
  );
}

// Apply a batch of writes to localStorage atomically. Every touched key is
// snapshotted first and restored if any write throws, so a failure such as
// QuotaExceededError can never leave the storage half-cleared/half-written
// (which would be worse than not restoring at all).
function applyLocalStorageWrites(entries, keysToClear) {
  const snapshot = new Map();
  const remember = (key) => {
    if (!snapshot.has(key)) snapshot.set(key, localStorage.getItem(key));
  };

  try {
    for (const key of keysToClear) remember(key);
    for (const key of keysToClear) localStorage.removeItem(key);

    for (const [key, value] of entries) {
      remember(key);
      localStorage.setItem(key, value);
    }
  } catch (error) {
    // Best-effort rollback to the pre-restore snapshot. A rollback write can
    // itself fail (e.g. quota), so it must never mask the original error.
    for (const key of snapshot.keys()) {
      const oldValue = snapshot.get(key);
      try {
        if (oldValue === null) localStorage.removeItem(key);
        else localStorage.setItem(key, oldValue);
      } catch {
        // Ignore: report the original failure below.
      }
    }
    throw error;
  }

  return entries.length;
}

// Write backup keys into localStorage. Returns the number of keys written.
function restoreLocalStorage(backupData, mode) {
  const now = new Date().toISOString();
  const incoming = Object.entries(backupData || {})
    .filter(([key]) => !shouldSkipKey(key))
    .map(([key, raw]) => [
      key,
      TOUCH_LAST_USED_KEYS.has(key) ? touchLastUsedItems(raw, now) : raw,
    ]);

  if (mode === "replace") {
    // Clear every existing business key, then write the backup as a unit.
    const keysToClear = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !shouldSkipKey(key)) keysToClear.push(key);
    }
    return applyLocalStorageWrites(incoming, keysToClear);
  }

  // Merge mode: keep local values; arrays are merged item-by-item.
  const entries = [];
  for (const [key, raw] of incoming) {
    const current = localStorage.getItem(key);
    if (current === null) {
      entries.push([key, raw]);
      continue;
    }
    const idField = MERGE_ARRAY_KEYS[key];
    if (idField) {
      entries.push([
        key,
        JSON.stringify(mergeJsonArray(current, raw, idField)),
      ]);
    }
    // Otherwise keep the local value and skip this key.
  }
  return applyLocalStorageWrites(entries, []);
}

// Restore one object store in a single transaction. Returns rows written.
// `touchLastUsed` marks restored token rows as freshly used: the app's cleanup
// routines drop anything unused for 24h, which would otherwise delete tokens
// that were just migrated from an older backup.
async function restoreStore(
  db,
  storeName,
  keyPath,
  records,
  mode,
  options = {},
) {
  if (!Array.isArray(records) || records.length === 0) return 0;

  const { touchLastUsed = false } = options;
  const now = new Date().toISOString();
  const prepare = (record) => {
    const value = decodeValue(record);
    if (touchLastUsed && value && typeof value === "object") {
      value.lastUsed = now;
    }
    return value;
  };

  if (mode === "replace") {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.clear();
      let count = 0;
      for (const record of records) {
        store.put(prepare(record));
        count += 1;
      }
      tx.oncomplete = () => resolve(count);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // Merge mode: skip records whose primary key already exists.
  const existingKeys = await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAllKeys();
    req.onsuccess = () => resolve(new Set(req.result || []));
    req.onerror = () => reject(req.error);
  });

  const missing = records.filter((record) => {
    const key = record?.[keyPath];
    return key !== undefined && !existingKeys.has(key);
  });
  if (missing.length === 0) return 0;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const record of missing) store.put(prepare(record));
    tx.oncomplete = () => resolve(missing.length);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Restore every known DB; returns a per-store count of written records.
async function restoreIndexedDB(backupData, mode) {
  const stats = {};
  const incoming = backupData || {};

  for (const [dbName, schema] of Object.entries(IDB_SCHEMA)) {
    const storesData = incoming[dbName];
    if (!storesData || typeof storesData !== "object") continue;

    let db;
    try {
      db = await openAppDB(dbName, schema);
    } catch (error) {
      console.warn(`[backup] Failed to open ${dbName}, skipping:`, error);
      continue;
    }
    if (!db) continue;

    try {
      for (const [storeName, cfg] of Object.entries(schema.stores)) {
        const count = await restoreStore(
          db,
          storeName,
          cfg.keyPath,
          storesData[storeName],
          mode,
          { touchLastUsed: cfg.touchLastUsed === true },
        );
        if (count > 0) stats[`${dbName}.${storeName}`] = count;
      }
    } finally {
      db.close();
    }
  }

  return stats;
}

// Returns an error message when `data` is not a valid backup, otherwise null.
// Messages are surfaced directly in the UI, so they stay in Chinese.
export function validateBackup(data) {
  if (!data || typeof data !== "object") return "备份文件内容无效";
  if (data.app !== BACKUP_APP || data.kind !== BACKUP_KIND)
    return "这不是本项目的全量备份文件";
  if (!data.localStorage && !data.indexedDB) return "备份文件不包含任何数据";
  return null;
}

/**
 * Restore a full backup.
 * @param {object} data Backup object produced by collectFullBackup().
 * @param {"replace"|"merge"} mode Replace existing data, or only add missing.
 */
export async function restoreFullBackup(data, mode = "replace") {
  const error = validateBackup(data);
  if (error) throw new Error(error);

  const localCount = restoreLocalStorage(data.localStorage, mode);
  const idbStats = await restoreIndexedDB(data.indexedDB, mode);

  return {
    localStorageKeys: localCount,
    indexedDB: idbStats,
  };
}
