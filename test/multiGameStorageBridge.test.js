import assert from "node:assert/strict";
import test from "node:test";

delete globalThis.MultiGameStorageBridge;
await import("../public/game/multi-game-storage-bridge.js").catch(() => undefined);
const bridge = globalThis.MultiGameStorageBridge || {};

class MemoryStorage {
  constructor(entries = []) {
    this.values = new Map(entries);
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.values.has(String(key)) ? this.values.get(String(key)) : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(String(key));
  }

  clear() {
    this.values.clear();
  }
}

function createRealmStorageClass() {
  class RealmStorage extends MemoryStorage {}
  const descriptors = Object.getOwnPropertyDescriptors(MemoryStorage.prototype);
  delete descriptors.constructor;
  Object.defineProperties(RealmStorage.prototype, descriptors);
  return RealmStorage;
}

test("scoped adapters isolate identity and ordinary game keys", () => {
  assert.equal(typeof bridge.createScopedStorageAdapter, "function");
  const backing = new MemoryStorage([["outside", "keep"]]);
  const a = bridge.createScopedStorageAdapter(
    backing,
    "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  const b = bridge.createScopedStorageAdapter(
    backing,
    "mg-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  );

  a.setItem("current_bin_id", "account-a");
  b.setItem("current_bin_id", "account-b");
  a.setItem("setting", "left");
  b.setItem("setting", "right");

  assert.equal(a.getItem("current_bin_id"), "account-a");
  assert.equal(b.getItem("current_bin_id"), "account-b");
  assert.equal(a.getItem("setting"), "left");
  assert.equal(b.getItem("setting"), "right");
  assert.equal(backing.getItem("outside"), "keep");
});

test("key length and clear expose only one scope", () => {
  const backing = new MemoryStorage([["outside", "keep"]]);
  const a = bridge.createScopedStorageAdapter(
    backing,
    "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  const b = bridge.createScopedStorageAdapter(
    backing,
    "mg-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  );

  a.setItem("current_bin_id", "a");
  a.setItem("actual_login_bin_id", "a");
  b.setItem("current_bin_id", "b");

  assert.equal(a.length, 2);
  assert.deepEqual([a.key(0), a.key(1)].sort(), [
    "actual_login_bin_id",
    "current_bin_id",
  ]);
  a.clear();
  assert.equal(a.length, 0);
  assert.equal(b.getItem("current_bin_id"), "b");
  assert.equal(backing.getItem("outside"), "keep");
});

test("invalid and nested scopes are rejected before shared keys are touched", () => {
  const backing = new MemoryStorage();
  assert.throws(
    () => bridge.createScopedStorageAdapter(backing, "../shared"),
    /Invalid MultiGame scope/,
  );
  assert.equal(backing.length, 0);

  const scoped = bridge.createScopedStorageAdapter(
    backing,
    "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  assert.throws(() => scoped.setItem("multi-game:other:key", "value"), /Nested/);
  assert.equal(backing.length, 0);
});

test("install virtualizes method and named-property access on iframe localStorage", () => {
  assert.equal(typeof bridge.install, "function");
  const RealmStorage = createRealmStorageClass();
  const localStorage = new RealmStorage([
    [
      "multi-game:mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:current_bin_id",
      "account-a",
    ],
    [
      "multi-game:mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:bin_data_account-a",
      "706c0102",
    ],
  ]);
  const sessionStorage = new RealmStorage([["shared", "session-value"]]);
  const win = { Storage: RealmStorage, localStorage, sessionStorage };

  bridge.install(win, "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

  assert.equal(win.localStorage.getItem("current_bin_id"), "account-a");
  assert.equal(win.localStorage.getItem("bin_data_account-a"), "706c0102");
  assert.equal(win.localStorage.current_bin_id, "account-a");
  assert.equal(win.localStorage["bin_data_account-a"], "706c0102");
  assert.equal(win.localStorage.length, 2);
  win.localStorage.actual_login_bin_id = "account-a";
  assert.equal(
    localStorage.values.get(
      "multi-game:mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:actual_login_bin_id",
    ),
    "account-a",
  );
  assert.equal(
    win.localStorage.getItem("actual_login_bin_id"),
    "account-a",
  );
  assert.equal(win.localStorage.actual_login_bin_id, "account-a");
  assert.deepEqual(Object.keys(win.localStorage).sort(), [
    "actual_login_bin_id",
    "bin_data_account-a",
    "current_bin_id",
  ]);
  assert.equal("current_bin_id" in win.localStorage, true);
  delete win.localStorage.actual_login_bin_id;
  assert.equal(win.localStorage.getItem("actual_login_bin_id"), null);
  assert.equal(win.localStorage.actual_login_bin_id, undefined);
  assert.throws(
    () => Object.defineProperty(win.localStorage, "non_configurable", {
      value: "must-not-be-written",
    }),
    TypeError,
  );
  assert.equal(win.localStorage.getItem("non_configurable"), null);
  assert.equal(win.sessionStorage.getItem("shared"), "session-value");
  assert.equal(win.sessionStorage.length, 1);
});

test("install rolls back earlier descriptors when a later method cannot be replaced", () => {
  const RealmStorage = createRealmStorageClass();
  const prototype = RealmStorage.prototype;
  const originalGetItem = prototype.getItem;
  const originalClear = prototype.clear;
  Object.defineProperty(prototype, "clear", {
    configurable: false,
    writable: true,
    value: originalClear,
  });
  const win = {
    Storage: RealmStorage,
    localStorage: new RealmStorage(),
    sessionStorage: new RealmStorage(),
  };

  assert.throws(
    () => bridge.install(win, "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    /not supported/,
  );
  assert.equal(prototype.getItem, originalGetItem);
  assert.equal(win.__MULTI_GAME_STORAGE_SCOPE__, undefined);
});

export { MemoryStorage };
