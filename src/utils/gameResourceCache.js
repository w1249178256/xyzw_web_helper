// Only immutable, public, versioned game scripts are eligible; never manifest/login responses.
import { openDB } from "idb";

const MAX_BYTES = 64 * 1024 * 1024;
const MAX_ITEM_BYTES = 24 * 1024 * 1024;
const memory = new Map();
let database;

export function gameScriptCacheKey(request) {
  if (String(request.method || "GET").toUpperCase() !== "GET" || request.body)
    return null;
  try {
    const url = new URL(request.url);
    if (
      url.origin !== "https://xxz-xyzw-res.hortorgames.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    return /^\/remote\/(?:game|launcher|TEST_REMOTE_MODULE)\/index\.[\da-f]{5,64}\.jsc$/i.test(
      url.pathname,
    )
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function getDatabase() {
  return (database ||= openDB("xyzw-public-game-scripts", 1, {
    upgrade(db) {
      db.createObjectStore("scripts", { keyPath: "url" });
      db.createObjectStore("metadata", { keyPath: "url" });
    },
  }).catch(() => null));
}

function remember(entry) {
  memory.delete(entry.url);
  memory.set(entry.url, entry);
  let bytes = [...memory.values()].reduce(
    (sum, item) => sum + item.body.byteLength,
    0,
  );
  for (const [key, item] of memory) {
    if (bytes <= MAX_BYTES) break;
    bytes -= item.body.byteLength;
    memory.delete(key);
  }
}

export async function readGameScript(url) {
  let entry = memory.get(url);
  if (!entry) {
    let timer;
    try {
      entry = await Promise.race([
        (async () => (await getDatabase())?.get("scripts", url))(),
        new Promise((resolve) => {
          timer = setTimeout(resolve, 1000, null);
        }),
      ]);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  if (
    entry?.url !== url ||
    !(entry.body instanceof ArrayBuffer) ||
    !entry.body.byteLength ||
    entry.body.byteLength > MAX_ITEM_BYTES
  )
    return null;
  remember(entry);
  // postMessage transfers detach buffers; every consumer needs its own copy.
  return {
    status: 200,
    headers: entry.headers,
    body: entry.body.slice(0),
    url,
  };
}

export async function cacheGameScript(url, response) {
  if (
    response.status !== 200 ||
    !response.body?.byteLength ||
    response.body.byteLength > MAX_ITEM_BYTES
  )
    return;
  const entry = {
    url,
    headers: { ...response.headers },
    body: response.body.slice(0),
    savedAt: Date.now(),
  };
  remember(entry);
  try {
    const db = await getDatabase();
    if (!db) return;
    const tx = db.transaction(["scripts", "metadata"], "readwrite");
    const scripts = tx.objectStore("scripts");
    const metadata = tx.objectStore("metadata");
    await scripts.put(entry);
    await metadata.put({
      url,
      size: entry.body.byteLength,
      savedAt: entry.savedAt,
    });
    // Prune using small metadata records instead of deserializing every large script on mobile.
    const entries = (await metadata.getAll()).sort(
      (a, b) => b.savedAt - a.savedAt,
    );
    let bytes = 0;
    for (const item of entries) {
      bytes += item.size;
      if (bytes > MAX_BYTES) {
        await scripts.delete(item.url);
        await metadata.delete(item.url);
      }
    }
    await tx.done;
  } catch {
    /* Private mode/quota failures must not prevent entering the game. */
  }
}
