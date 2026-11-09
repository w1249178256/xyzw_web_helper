import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import {
  collectFullBackup,
  restoreFullBackup,
} from "../src/utils/fullBackup.js";

const originalStorage = globalThis.localStorage;
const originalIndexedDB = globalThis.indexedDB;

function createStorage(entries = {}, quota = Infinity) {
  const values = new Map(Object.entries(entries));
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      const next = new Map(values).set(key, String(value));
      const size = [...next].reduce(
        (total, [name, raw]) => total + name.length + raw.length,
        0,
      );
      if (size > quota)
        throw new DOMException("Storage is full", "QuotaExceededError");
      values.set(key, String(value));
    },
  };
}

function backup(localStorage = {}, indexedDB = {}) {
  return {
    app: "xyzw-web-helper",
    kind: "xyzw-full-backup",
    version: 1,
    localStorage,
    indexedDB,
  };
}

async function openDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (name === "xyzw") db.createObjectStore("tokens", { keyPath: "id" });
      else {
        db.createObjectStore("kv", { keyPath: "key" });
        db.createObjectStore("gameTokens", { keyPath: "roleId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function seedDatabase(name, stores) {
  const db = await openDatabase(name);
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(Object.keys(stores), "readwrite");
      for (const [store, records] of Object.entries(stores)) {
        for (const record of records) tx.objectStore(store).put(record);
      }
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function readStore(name, storeName) {
  const db = await openDatabase(name);
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

beforeEach(() => {
  globalThis.localStorage = createStorage();
  globalThis.indexedDB = new IDBFactory();
});

after(() => {
  globalThis.localStorage = originalStorage;
  globalThis.indexedDB = originalIndexedDB;
});

test("failed replace frees incoming values before restoring original storage", async () => {
  const original = { first: "1234567890", other: "1234567890" };
  globalThis.localStorage = createStorage(original, 30);
  await assert.rejects(
    restoreFullBackup(
      backup({ n: "12345678901234567890", next: "1234567890" }),
    ),
    { name: "QuotaExceededError" },
  );
  assert.equal(localStorage.getItem("first"), original.first);
  assert.equal(localStorage.getItem("other"), original.other);
  assert.equal(localStorage.getItem("n"), null);
});

test("credential database open errors reject without replacing local settings", async () => {
  localStorage.setItem("gameTokens", "old accounts");
  globalThis.indexedDB = {
    open() {
      throw new DOMException("Database unavailable", "UnknownError");
    },
  };
  await assert.rejects(
    restoreFullBackup(
      backup({ gameTokens: "new accounts" }, { xyzw: { tokens: [] } }),
    ),
    /Database unavailable/,
  );
  assert.equal(localStorage.getItem("gameTokens"), "old accounts");
});

test("full export rejects when credential databases cannot be read", async () => {
  localStorage.setItem(
    "gameTokens",
    JSON.stringify([{ id: "bin", importMethod: "bin" }]),
  );
  globalThis.indexedDB = {
    open() {
      throw new DOMException("Database unavailable", "UnknownError");
    },
  };
  await assert.rejects(collectFullBackup(), /Database unavailable/);
});

test("a failed database write rolls back already restored credential stores", async () => {
  await seedDatabase("xyzw", { tokens: [{ id: "old-bin", data: "original" }] });
  await seedDatabase("xyzw_token_db", {
    kv: [{ key: "userToken", value: "old-user" }],
    gameTokens: [{ roleId: "old-role", lastUsed: "2020-01-01" }],
  });
  localStorage.setItem("config", "original");
  await assert.rejects(
    restoreFullBackup(
      backup(
        { config: "incoming" },
        {
          xyzw: { tokens: [{ id: "new-bin", data: "incoming" }] },
          xyzw_token_db: {
            kv: [],
            gameTokens: [{ invalid: "missing roleId" }],
          },
        },
      ),
    ),
    { name: "DataError" },
  );
  assert.deepEqual(await readStore("xyzw", "tokens"), [
    { id: "old-bin", data: "original" },
  ]);
  assert.deepEqual(await readStore("xyzw_token_db", "kv"), [
    { key: "userToken", value: "old-user" },
  ]);
  assert.deepEqual(await readStore("xyzw_token_db", "gameTokens"), [
    { roleId: "old-role", lastUsed: "2020-01-01" },
  ]);
  assert.equal(localStorage.getItem("config"), "original");
});

test("a localStorage quota failure also rolls back restored BIN credentials", async () => {
  await seedDatabase("xyzw", { tokens: [{ id: "original" }] });
  globalThis.localStorage = createStorage({ config: "old" }, 10);
  await assert.rejects(
    restoreFullBackup(
      backup(
        { config: "too large to fit" },
        { xyzw: { tokens: [{ id: "incoming" }] } },
      ),
    ),
    { name: "QuotaExceededError" },
  );
  assert.equal(localStorage.getItem("config"), "old");
  assert.deepEqual(await readStore("xyzw", "tokens"), [{ id: "original" }]);
});

test("replace clears stores represented by empty arrays", async () => {
  await seedDatabase("xyzw", { tokens: [{ id: "old-bin" }] });
  await seedDatabase("xyzw_token_db", {
    kv: [{ key: "userToken", value: "old-user" }],
    gameTokens: [{ roleId: "old-role" }],
  });
  await restoreFullBackup(
    backup(
      {},
      { xyzw: { tokens: [] }, xyzw_token_db: { kv: [], gameTokens: [] } },
    ),
  );
  assert.deepEqual(await readStore("xyzw", "tokens"), []);
  assert.deepEqual(await readStore("xyzw_token_db", "kv"), []);
  assert.deepEqual(await readStore("xyzw_token_db", "gameTokens"), []);
});

test("merge unions account memberships while keeping local group metadata", async () => {
  localStorage.setItem(
    "tokenGroups",
    JSON.stringify([{ id: "group", name: "Local", tokenIds: ["t1"] }]),
  );
  await restoreFullBackup(
    backup({
      tokenGroups: JSON.stringify([
        { id: "group", name: "Incoming", tokenIds: ["t1", "t2"] },
      ]),
    }),
    "merge",
  );
  assert.deepEqual(JSON.parse(localStorage.getItem("tokenGroups")), [
    { id: "group", name: "Local", tokenIds: ["t1", "t2"] },
  ]);
});

test("full backups round-trip binary credentials and refresh restored token age", async () => {
  const bytes = new Uint8Array([0, 255, 3, 17]);
  const createdAt = new Date("2020-01-01T00:00:00Z");
  await seedDatabase("xyzw", {
    tokens: [
      { id: "bin", data: bytes.buffer, createdAt, view: bytes.subarray(1, 3) },
    ],
  });
  await seedDatabase("xyzw_token_db", {
    gameTokens: [{ roleId: "role", lastUsed: createdAt.toISOString() }],
  });
  localStorage.setItem(
    "gameTokens",
    JSON.stringify([{ id: "token", lastUsed: createdAt.toISOString() }]),
  );
  const exported = JSON.parse(JSON.stringify(await collectFullBackup()));
  const restoredAt = Date.now();
  await restoreFullBackup(exported);
  const [credential] = await readStore("xyzw", "tokens");
  assert.deepEqual(new Uint8Array(credential.data), bytes);
  assert.deepEqual(credential.view, bytes.subarray(1, 3));
  assert.deepEqual(credential.createdAt, createdAt);
  const [token] = await readStore("xyzw_token_db", "gameTokens");
  assert.ok(Date.parse(token.lastUsed) >= restoredAt);
  assert.ok(
    Date.parse(JSON.parse(localStorage.getItem("gameTokens"))[0].lastUsed) >=
      restoredAt,
  );
});

test("merge keeps existing credential rows and adds only missing keys", async () => {
  await seedDatabase("xyzw", { tokens: [{ id: "existing", data: "local" }] });
  await restoreFullBackup(
    backup(
      {},
      {
        xyzw: {
          tokens: [
            { id: "existing", data: "incoming" },
            { id: "new", data: "new" },
          ],
        },
      },
    ),
    "merge",
  );
  assert.deepEqual(await readStore("xyzw", "tokens"), [
    { id: "existing", data: "local" },
    { id: "new", data: "new" },
  ]);
});
