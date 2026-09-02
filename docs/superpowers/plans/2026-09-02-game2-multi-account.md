# Game2 Multi-Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Token-management batch selection flow that opens the selected accounts in an isolated, horizontally scrollable `/game2` page without changing the existing single-account `/game` behavior.

**Architecture:** A pure launcher service prepares one localStorage namespace per selected Token and stores a non-secret launch manifest in sessionStorage. Each iframe loads a dedicated `game2.html`; its first blocking script virtualizes localStorage for that iframe realm before reusing the existing Cocos files and protected login injector. A standalone Vue page renders and monitors the iframe sessions, while TokenImport owns the independent checkbox selection UI.

**Tech Stack:** Vue 3.5, Vue Router 4, Pinia, Naive UI, Vite 5, `lz4js`, browser Storage APIs, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-02-game2-multi-account-design.md`

## Global Constraints

- Preserve `/game`, `src/views/GamePlayer.vue`, and the existing single-account “打开游戏” behavior.
- Do not modify or de-obfuscate `public/game/sh1.js`; install isolation before it runs.
- Never put Token text or BIN contents in a route or iframe URL.
- Scope IDs must match `^g2-[a-f0-9]{32}$` and come from `crypto.randomUUID()`.
- Storage bridge failure is fatal for that iframe; never fall back to unscoped localStorage.
- Only localStorage is virtualized. Browser verification must show that shared sessionStorage, IndexedDB, and BroadcastChannel do not break account login isolation.
- Keep existing user changes and accept generated declaration changes only when directly caused by this feature.
- Use TDD for every new JavaScript function: add one focused failing test, observe the expected failure, add minimal implementation, and observe it pass.

---

## File Structure

- Create `src/utils/gameLauncher.js`: BIN conversion, launch lifecycle, scoped seed data, manifest parsing, and iframe URL construction.
- Create `test/gameLauncher.test.js`: real launcher behavior against in-memory Storage objects.
- Create `src/utils/gameSelection.js`: immutable helpers for the Token-management batch selection set.
- Create `test/gameSelection.test.js`: selection toggle, select-all order, and deleted-Token pruning behavior.
- Create `public/game/game2-storage-bridge.js`: classic-script API for scoped localStorage and iframe-realm installation.
- Create `test/game2StorageBridge.test.js`: namespace adapter and simulated realm behavior.
- Create `public/game/game2.html`: dedicated Cocos bootstrap that refuses to load game scripts unless isolation is ready.
- Create `src/views/GameMultiPlayer.vue`: full-screen horizontal session renderer and validated child-message handling.
- Modify `src/router/index.js`: register `/game2` outside `DefaultLayout` with the existing Token guard.
- Modify `src/views/TokenImport/index.vue`: independent checkboxes, select-all/clear controls, and batch launch action.
- Potentially modify generated `components.d.ts`, `src/auto-imports.d.ts`, and `src/typed-router.d.ts` only if Vite legitimately regenerates entries for the new SFC.

---

### Task 1: Game2 Launch Session Service

**Files:**
- Create: `src/utils/gameLauncher.js`
- Create: `test/gameLauncher.test.js`

**Interfaces:**
- Consumes: Token objects shaped as `{ id: string, name?: string }`, `getArrayBuffer(id): Promise<ArrayBuffer | null>`, Web Storage-compatible `localStorage` and `sessionStorage`, `randomUUID(): string`, and `now(): number`.
- Produces: `GAME2_ACTIVE_LAUNCH_KEY`, `convertBinToLx(buffer, random?)`, `prepareGame2Launch(options)`, `readActiveGame2Launch(storage)`, `clearGame2Launch(options)`, and `buildGame2FrameSrc(baseUrl, session)`.
- `prepareGame2Launch` returns `{ launch: { version: 1, id, createdAt, sessions, failures }, failures }`; every session is `{ tokenId, name, scopeId, order }`, and every failure is `{ tokenId, name, reason }` where reason is `missing-bin`, `read-failed`, or `convert-failed`.

- [ ] **Step 1: Write the failing URL and manifest tests**

Create `test/gameLauncher.test.js` with a Web Storage-compatible memory implementation and literal expectations:

```js
import assert from "node:assert/strict";
import test from "node:test";

const launcher = await import("../src/utils/gameLauncher.js").catch(() => ({}));

class MemoryStorage {
  #values = new Map();

  get length() {
    return this.#values.size;
  }

  key(index) {
    return [...this.#values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#values.has(String(key)) ? this.#values.get(String(key)) : null;
  }

  setItem(key, value) {
    this.#values.set(String(key), String(value));
  }

  removeItem(key) {
    this.#values.delete(String(key));
  }

  clear() {
    this.#values.clear();
  }
}

test("buildGame2FrameSrc encodes scope and account without exposing token data", () => {
  assert.equal(typeof launcher.buildGame2FrameSrc, "function");
  assert.equal(
    launcher.buildGame2FrameSrc("/helper/", {
      scopeId: "g2-0123456789abcdef0123456789abcdef",
      tokenId: "account / 一号",
    }),
    "/helper/game/game2.html?scope=g2-0123456789abcdef0123456789abcdef&bin_id=account%20%2F%20%E4%B8%80%E5%8F%B7",
  );
});

test("readActiveGame2Launch rejects malformed and wrong-version manifests", () => {
  const storage = new MemoryStorage();
  storage.setItem("game2_active_launch_v1", "not-json");
  assert.equal(launcher.readActiveGame2Launch(storage), null);
  storage.setItem("game2_active_launch_v1", JSON.stringify({ version: 2, sessions: [] }));
  assert.equal(launcher.readActiveGame2Launch(storage), null);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/gameLauncher.test.js`

Expected: FAIL on the explicit `typeof launcher.buildGame2FrameSrc` assertion because the module/API does not exist.

- [ ] **Step 3: Implement URL construction and strict manifest parsing**

Create `src/utils/gameLauncher.js` with these exact public constants and validation boundaries:

```js
import lz4 from "lz4js";

export const GAME2_ACTIVE_LAUNCH_KEY = "game2_active_launch_v1";
const SCOPE_PATTERN = /^g2-[a-f0-9]{32}$/;

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "/").replace(/\/?$/, "/");
}

function isSession(value) {
  return Boolean(
    value &&
      typeof value.tokenId === "string" &&
      value.tokenId.length > 0 &&
      typeof value.name === "string" &&
      SCOPE_PATTERN.test(value.scopeId) &&
      Number.isInteger(value.order) &&
      value.order >= 0,
  );
}

export function buildGame2FrameSrc(baseUrl, session) {
  const scope = encodeURIComponent(session.scopeId);
  const tokenId = encodeURIComponent(session.tokenId);
  return `${normalizeBaseUrl(baseUrl)}game/game2.html?scope=${scope}&bin_id=${tokenId}`;
}

export function readActiveGame2Launch(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(GAME2_ACTIVE_LAUNCH_KEY) || "null");
    if (
      parsed?.version !== 1 ||
      typeof parsed.id !== "string" ||
      typeof parsed.createdAt !== "number" ||
      !Array.isArray(parsed.sessions) ||
      !parsed.sessions.every(isSession) ||
      !Array.isArray(parsed.failures)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/gameLauncher.test.js`

Expected: PASS for both URL and manifest tests.

- [ ] **Step 5: Add failing launch preparation and cleanup tests**

Append focused tests that use two literal `pl` buffers, one missing buffer, deterministic UUID values, and two Storage instances:

```js
test("prepareGame2Launch seeds isolated accounts in display order and records failures", async () => {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const uuids = [
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
  ];
  const buffers = new Map([
    ["a", Uint8Array.from([112, 108, 1, 2, 3]).buffer],
    ["b", Uint8Array.from([112, 108, 4, 5, 6]).buffer],
  ]);

  const result = await launcher.prepareGame2Launch({
    tokens: [
      { id: "a", name: "账号 A" },
      { id: "missing", name: "缺失账号" },
      { id: "b", name: "账号 B" },
    ],
    getArrayBuffer: async (id) => buffers.get(id) ?? null,
    localStorage: local,
    sessionStorage: session,
    randomUUID: () => uuids.shift(),
    now: () => 1_788_343_200_000,
  });

  assert.deepEqual(
    result.launch.sessions.map(({ tokenId, scopeId, order }) => ({ tokenId, scopeId, order })),
    [
      { tokenId: "a", scopeId: "g2-11111111111111111111111111111111", order: 0 },
      { tokenId: "b", scopeId: "g2-22222222222222222222222222222222", order: 1 },
    ],
  );
  assert.deepEqual(result.failures, [
    { tokenId: "missing", name: "缺失账号", reason: "missing-bin" },
  ]);
  assert.equal(
    local.getItem("game2:g2-11111111111111111111111111111111:bin_data_a"),
    "706c010203",
  );
  assert.equal(
    local.getItem("game2:g2-22222222222222222222222222222222:current_bin_id"),
    "b",
  );
  assert.deepEqual(
    JSON.parse(local.getItem("game2:g2-11111111111111111111111111111111:bin_file_list")),
    [{ id: "a", name: "账号 A", byteLength: 5, size: "0.0 KB", order: 0 }],
  );
  assert.deepEqual(
    JSON.parse(session.getItem("game2_active_launch_v1")),
    result.launch,
  );
});

test("clearGame2Launch removes only scopes named by the active manifest", () => {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const scope = "g2-33333333333333333333333333333333";
  local.setItem(`game2:${scope}:current_bin_id`, "a");
  local.setItem("bin_data_single-game", "keep");
  session.setItem(
    "game2_active_launch_v1",
    JSON.stringify({
      version: 1,
      id: "launch-44444444444444444444444444444444",
      createdAt: 1,
      sessions: [{ tokenId: "a", name: "A", scopeId: scope, order: 0 }],
      failures: [],
    }),
  );

  launcher.clearGame2Launch({ localStorage: local, sessionStorage: session });

  assert.equal(local.getItem(`game2:${scope}:current_bin_id`), null);
  assert.equal(local.getItem("bin_data_single-game"), "keep");
  assert.equal(session.getItem("game2_active_launch_v1"), null);
});
```

- [ ] **Step 6: Run the focused test and verify RED**

Run: `node --test test/gameLauncher.test.js`

Expected: FAIL because `prepareGame2Launch` and `clearGame2Launch` are not functions.

- [ ] **Step 7: Implement conversion, scoped seeding, failure isolation, and cleanup**

Add the current `extractKey`, `encodeKey`, `xDecrypt`, and LZ4 conversion algorithm from `src/views/TokenImport/index.vue:1516-1577` to the launcher module. Export `convertBinToLx(buffer, random = Math.random)` and make the random source injectable. Add these exact lifecycle rules:

```js
function uuidHex(randomUUID) {
  const value = randomUUID().replaceAll("-", "").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(value)) throw new Error("invalid UUID source");
  return value;
}

function storageKeys(storage) {
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null) keys.push(key);
  }
  return keys;
}

export function clearGame2Launch({ localStorage, sessionStorage }) {
  const previous = readActiveGame2Launch(sessionStorage);
  if (previous) {
    for (const gameSession of previous.sessions) {
      const prefix = `game2:${gameSession.scopeId}:`;
      for (const key of storageKeys(localStorage)) {
        if (key.startsWith(prefix)) localStorage.removeItem(key);
      }
    }
  }
  sessionStorage.removeItem(GAME2_ACTIVE_LAUNCH_KEY);
}

export async function prepareGame2Launch({
  tokens,
  getArrayBuffer,
  localStorage,
  sessionStorage,
  randomUUID = () => crypto.randomUUID(),
  now = () => Date.now(),
}) {
  clearGame2Launch({ localStorage, sessionStorage });
  const launchId = `launch-${uuidHex(randomUUID)}`;
  const prepared = await Promise.all(
    tokens.map(async (token) => {
      let buffer;
      try {
        buffer = await getArrayBuffer(token.id);
      } catch {
        return { failure: { tokenId: token.id, name: token.name || "Token", reason: "read-failed" } };
      }
      if (!buffer) {
        return { failure: { tokenId: token.id, name: token.name || "Token", reason: "missing-bin" } };
      }
      try {
        return { token, originalSize: buffer.byteLength, bytes: convertBinToLx(buffer) };
      } catch {
        return { failure: { tokenId: token.id, name: token.name || "Token", reason: "convert-failed" } };
      }
    }),
  );

  const sessions = [];
  const failures = [];
  for (const result of prepared) {
    if (result.failure) {
      failures.push(result.failure);
      continue;
    }
    const scopeId = `g2-${uuidHex(randomUUID)}`;
    const order = sessions.length;
    const name = result.token.name || "Token";
    const prefix = `game2:${scopeId}:`;
    const hex = Array.from(result.bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(`${prefix}bin_data_${result.token.id}`, hex);
    localStorage.setItem(`${prefix}current_bin_id`, result.token.id);
    localStorage.setItem(
      `${prefix}bin_file_list`,
      JSON.stringify([
        {
          id: result.token.id,
          name,
          byteLength: result.originalSize,
          size: `${(result.originalSize / 1024).toFixed(1)} KB`,
          order: 0,
        },
      ]),
    );
    sessions.push({ tokenId: result.token.id, name, scopeId, order });
  }

  const launch = { version: 1, id: launchId, createdAt: now(), sessions, failures };
  sessionStorage.setItem(GAME2_ACTIVE_LAUNCH_KEY, JSON.stringify(launch));
  return { launch, failures };
}
```

- [ ] **Step 8: Run launcher and existing tests**

Run: `node --test test/gameLauncher.test.js test/towerClimbLimit.test.js test/helperTaskRunner.test.js`

Expected: all tests PASS with no uncaught errors.

- [ ] **Step 9: Commit the launcher service**

```bash
git add src/utils/gameLauncher.js test/gameLauncher.test.js
git commit -m "feat: add isolated game launch sessions"
```

---

### Task 2: Iframe-Scoped localStorage Bridge

**Files:**
- Create: `public/game/game2-storage-bridge.js`
- Create: `test/game2StorageBridge.test.js`

**Interfaces:**
- Consumes: a scope matching `^g2-[a-f0-9]{32}$`, a Web Storage backing object, and a browser-like `window` with `Storage`, `localStorage`, `sessionStorage`, `location`, and `document`.
- Produces: classic global `globalThis.Game2StorageBridge` with `validateScope(scope)`, `createScopedStorageAdapter(backing, scope)`, and `install(win, scope)`.
- On browser auto-install, produces `window.__GAME2_BRIDGE_READY__ = { scope, binId }` or `window.__GAME2_BRIDGE_ERROR__ = { code }` and sends only the documented `fatal` message on failure.

- [ ] **Step 1: Write failing adapter isolation tests**

Create `test/game2StorageBridge.test.js`. Import the classic script for its global API, and use a fresh memory backing store per test:

```js
import assert from "node:assert/strict";
import test from "node:test";

delete globalThis.Game2StorageBridge;
await import("../public/game/game2-storage-bridge.js").catch(() => undefined);
const bridge = globalThis.Game2StorageBridge || {};

class MemoryStorage {
  constructor(entries = []) {
    this.values = new Map(entries);
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

test("scoped adapters isolate identity and ordinary game keys", () => {
  assert.equal(typeof bridge.createScopedStorageAdapter, "function");
  const backing = new MemoryStorage([["outside", "keep"]]);
  const a = bridge.createScopedStorageAdapter(backing, "g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  const b = bridge.createScopedStorageAdapter(backing, "g2-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
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
  const a = bridge.createScopedStorageAdapter(backing, "g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  const b = bridge.createScopedStorageAdapter(backing, "g2-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  a.setItem("current_bin_id", "a");
  a.setItem("actual_login_bin_id", "a");
  b.setItem("current_bin_id", "b");
  assert.equal(a.length, 2);
  assert.deepEqual([a.key(0), a.key(1)].sort(), ["actual_login_bin_id", "current_bin_id"]);
  a.clear();
  assert.equal(a.length, 0);
  assert.equal(b.getItem("current_bin_id"), "b");
  assert.equal(backing.getItem("outside"), "keep");
});

test("invalid scopes are rejected before a storage key is touched", () => {
  const backing = new MemoryStorage();
  assert.throws(
    () => bridge.createScopedStorageAdapter(backing, "../shared"),
    /Invalid Game2 scope/,
  );
  assert.equal(backing.length, 0);
});
```

- [ ] **Step 2: Run bridge tests and verify RED**

Run: `node --test test/game2StorageBridge.test.js`

Expected: FAIL on the explicit API type assertion because the bridge script does not exist.

- [ ] **Step 3: Implement the pure scoped adapter**

Create a classic IIFE in `public/game/game2-storage-bridge.js`. The factory must expose the API on `globalThis.Game2StorageBridge`; do not use ESM syntax because the browser must execute it synchronously before classic game scripts:

```js
(function initializeGame2StorageBridge(root) {
  "use strict";

  const SCOPE_PATTERN = /^g2-[a-f0-9]{32}$/;

  function validateScope(scope) {
    return SCOPE_PATTERN.test(String(scope || ""));
  }

  function createScopedStorageAdapter(backing, scope) {
    if (!validateScope(scope)) throw new Error("Invalid Game2 scope");
    const prefix = `game2:${scope}:`;
    const scopedKeys = () => {
      const keys = [];
      for (let index = 0; index < backing.length; index += 1) {
        const key = backing.key(index);
        if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
      }
      return keys;
    };
    const normalizeKey = (key) => {
      const value = String(key);
      if (value.startsWith("game2:")) throw new Error("Nested Game2 scope is not allowed");
      return value;
    };
    return {
      get length() { return scopedKeys().length; },
      key(index) { return scopedKeys()[Number(index)] ?? null; },
      getItem(key) { return backing.getItem(prefix + normalizeKey(key)); },
      setItem(key, value) { backing.setItem(prefix + normalizeKey(key), String(value)); },
      removeItem(key) { backing.removeItem(prefix + normalizeKey(key)); },
      clear() {
        for (const key of scopedKeys()) backing.removeItem(prefix + key);
      },
    };
  }

  const api = { validateScope, createScopedStorageAdapter };
  root.Game2StorageBridge = api;
})(globalThis);
```

- [ ] **Step 4: Run adapter tests and verify GREEN**

Run: `node --test test/game2StorageBridge.test.js`

Expected: all adapter tests PASS.

- [ ] **Step 5: Add failing simulated-realm installation tests**

Append tests that create a fresh `RealmStorage` class inside each test. Seed namespaced keys through the raw instance before installation, then assert localStorage is virtualized while sessionStorage still uses native keys:

```js
test("install virtualizes only the iframe localStorage object", () => {
  const localStorage = new MemoryStorage([
    ["game2:g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:current_bin_id", "account-a"],
    ["game2:g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:bin_data_account-a", "706c0102"],
  ]);
  const sessionStorage = new MemoryStorage([["shared", "session-value"]]);
  const win = { Storage: MemoryStorage, localStorage, sessionStorage };

  bridge.install(win, "g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

  assert.equal(win.localStorage.getItem("current_bin_id"), "account-a");
  win.localStorage.setItem("actual_login_bin_id", "account-a");
  assert.equal(
    localStorage.values.get(
      "game2:g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:actual_login_bin_id",
    ),
    "account-a",
  );
  assert.equal(win.sessionStorage.getItem("shared"), "session-value");
  assert.equal(win.sessionStorage.length, 1);
});
```

- [ ] **Step 6: Run bridge tests and verify RED**

Run: `node --test test/game2StorageBridge.test.js`

Expected: FAIL because `bridge.install` is not a function.

- [ ] **Step 7: Implement guarded prototype installation and browser auto-install**

Extend the bridge factory with `install(win, scope)`. Capture `rawLocalStorage`, native descriptors, and bound backing methods before `Object.defineProperties`. Reject duplicate installation, missing descriptors, inaccessible storage, and invalid scope before mutation. Each wrapper must branch on `this === rawLocalStorage`; calls on sessionStorage use the original method/getter. Implement the following observable contract:

```js
function install(win, scope) {
  if (!validateScope(scope)) throw new Error("Invalid Game2 scope");
  if (win.__GAME2_STORAGE_SCOPE__) throw new Error("Game2 storage bridge already installed");
  const rawLocalStorage = win.localStorage;
  const prototype = win.Storage?.prototype;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(prototype, "length");
  const native = {
    getItem: prototype?.getItem,
    setItem: prototype?.setItem,
    removeItem: prototype?.removeItem,
    key: prototype?.key,
    clear: prototype?.clear,
    getLength: lengthDescriptor?.get,
  };
  if (
    !prototype ||
    !lengthDescriptor?.configurable ||
    Object.values(native).some((member) => typeof member !== "function")
  ) {
    throw new Error("Game2 storage bridge is not supported");
  }
  const backing = {
    get length() { return native.getLength.call(rawLocalStorage); },
    key(index) { return native.key.call(rawLocalStorage, index); },
    getItem(key) { return native.getItem.call(rawLocalStorage, key); },
    setItem(key, value) { native.setItem.call(rawLocalStorage, key, value); },
    removeItem(key) { native.removeItem.call(rawLocalStorage, key); },
  };
  const scoped = createScopedStorageAdapter(backing, scope);
  Object.defineProperties(prototype, {
    getItem: { configurable: true, writable: true, value(key) {
      return this === rawLocalStorage ? scoped.getItem(key) : native.getItem.call(this, key);
    } },
    setItem: { configurable: true, writable: true, value(key, value) {
      return this === rawLocalStorage
        ? scoped.setItem(key, value)
        : native.setItem.call(this, key, value);
    } },
    removeItem: { configurable: true, writable: true, value(key) {
      return this === rawLocalStorage
        ? scoped.removeItem(key)
        : native.removeItem.call(this, key);
    } },
    key: { configurable: true, writable: true, value(index) {
      return this === rawLocalStorage ? scoped.key(index) : native.key.call(this, index);
    } },
    clear: { configurable: true, writable: true, value() {
      return this === rawLocalStorage ? scoped.clear() : native.clear.call(this);
    } },
    length: { configurable: true, get() {
      return this === rawLocalStorage ? scoped.length : native.getLength.call(this);
    } },
  });
  win.__GAME2_STORAGE_SCOPE__ = scope;
  return scoped;
}
```

Add `install` to the global API. When `root.window === root && root.document` is true, parse exactly one `scope` and one `bin_id` from `root.location.search`, run `install`, and verify the scoped `current_bin_id` and `bin_data_<binId>` exist. On success set `__GAME2_BRIDGE_READY__`; on failure set `__GAME2_BRIDGE_ERROR__`, render a short fatal message, and send `{ channel: "game2", version: 1, type: "fatal", scope, code: "bridge-install-failed" }` to the same-origin parent. Never include the thrown message or stack in the postMessage payload.

- [ ] **Step 8: Run bridge and launcher tests**

Run: `node --test test/game2StorageBridge.test.js test/gameLauncher.test.js`

Expected: all tests PASS.

- [ ] **Step 9: Commit the storage bridge**

```bash
git add public/game/game2-storage-bridge.js test/game2StorageBridge.test.js
git commit -m "feat: isolate game2 iframe storage"
```

---

### Task 3: Dedicated Game2 Cocos Bootstrap

**Files:**
- Create: `public/game/game2.html`

**Interfaces:**
- Consumes: `game2-storage-bridge.js`, the existing Cocos files referenced by `public/game/index.html`, and query parameters `scope` plus `bin_id`.
- Produces: an isolated game document that sends a validated-shape `ready` or `fatal` message to its parent.

- [ ] **Step 1: Create the dedicated document with the bridge as the first script**

Copy the head, canvas, and splash markup from `public/game/index.html`. Do not copy the existing static game `<script>` tags. The body script order must be:

```html
<script src="game2-storage-bridge.js" charset="utf-8"></script>
<script type="text/javascript">
  (function loadGame2Runtime() {
    "use strict";
    if (!window.__GAME2_BRIDGE_READY__) return;
    const runtime = [
      "patch.decrypted_readable.js",
      "src/settings.da7ef.js",
      "game-defines.a175e.js",
      "main.2a00e.js",
      "cocos2d-js-min.a5841.js",
      "xh.js",
      "sh1.js",
      "diagnose_require.js",
    ];
    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.charset = "utf-8";
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Unable to load ${src}`));
        document.head.appendChild(script);
      });
    const notify = (type, code) => {
      const { scope } = window.__GAME2_BRIDGE_READY__;
      window.parent.postMessage(
        { channel: "game2", version: 1, type, scope, ...(code ? { code } : {}) },
        window.location.origin,
      );
    };
    (async () => {
      for (const src of runtime) await loadScript(src);
      window.HtmlIsLoaded = true;
      document.getElementById("splash").style.display = "none";
      window.boot();
      notify("ready");
    })().catch(() => {
      document.getElementById("splash").textContent = "游戏资源加载失败";
      notify("fatal", "runtime-load-failed");
    });
  })();
</script>
```

This keeps the exact existing runtime order but guarantees no runtime file executes until the bridge has installed.

- [ ] **Step 2: Run focused tests and a production build**

Run: `node --test test/game2StorageBridge.test.js test/gameLauncher.test.js`

Expected: all tests PASS.

Run: `npm.cmd run build`

Expected: Vite exits 0 and `dist/game/game2.html` plus `dist/game/game2-storage-bridge.js` exist.

Run: `Test-Path dist/game/game2.html; Test-Path dist/game/game2-storage-bridge.js`

Expected: both lines are `True`.

- [ ] **Step 3: Commit the dedicated bootstrap**

```bash
git add public/game/game2.html
git commit -m "feat: add isolated game2 bootstrap"
```

---

### Task 4: Full-Screen Multi-Game Route

**Files:**
- Create: `src/views/GameMultiPlayer.vue`
- Modify: `src/router/index.js:35-47`
- Modify if generated: `src/typed-router.d.ts`

**Interfaces:**
- Consumes: `readActiveGame2Launch(sessionStorage)`, `buildGame2FrameSrc(import.meta.env.BASE_URL, session)`, child messages, and Vue Router.
- Produces: `/game2`, one iframe panel per manifest session, per-panel `loading`, `ready`, or `fatal` state, isolated reload, and navigation back to `/tokens`.

- [ ] **Step 1: Add the route and an empty-state-first page**

Register this manual route immediately after `/game` and outside `DefaultLayout`:

```js
{
  path: "/game2",
  name: "GameMultiPlayer",
  component: () => import("@/views/GameMultiPlayer.vue"),
  meta: {
    title: "批量游戏",
    requiresToken: true,
  },
},
```

Create the SFC with a fixed full-screen root, toolbar, and an empty state that appears when `readActiveGame2Launch(window.sessionStorage)` returns null or has no sessions. The empty-state action must call `router.push("/tokens")`.

- [ ] **Step 2: Render horizontal sessions and validated status messages**

In `<script setup>`, derive frames without copying secret data:

```js
const launch = ref(readActiveGame2Launch(window.sessionStorage));
const frames = computed(() =>
  (launch.value?.sessions || []).map((session) => ({
    ...session,
    src: buildGame2FrameSrc(import.meta.env.BASE_URL, session),
  })),
);
const frameElements = new Map();
const frameStates = reactive(
  Object.fromEntries(frames.value.map((frame) => [frame.scopeId, { status: "loading", revision: 0 }])),
);

function handleMessage(event) {
  if (event.origin !== window.location.origin) return;
  const payload = event.data;
  if (payload?.channel !== "game2" || payload.version !== 1) return;
  const frame = frames.value.find((item) => item.scopeId === payload.scope);
  const element = frameElements.get(payload.scope);
  if (!frame || !element || event.source !== element.contentWindow) return;
  if (payload.type === "ready") frameStates[payload.scope].status = "ready";
  if (payload.type === "fatal") frameStates[payload.scope].status = "fatal";
}
```

Register and remove the `message` listener in `onMounted`/`onUnmounted`. A retry button increments only that scope's `revision` and uses it as the iframe `:key`, leaving siblings mounted.

The main CSS contract is:

```css
.game-strip {
  display: flex;
  flex-flow: row nowrap;
  gap: 12px;
  height: calc(100dvh - 52px);
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px;
}
.game-panel {
  flex: 0 0 clamp(360px, 32vw, 480px);
  min-width: 0;
  height: 100%;
}
.game-frame {
  width: 100%;
  height: calc(100% - 36px);
  border: 0;
  display: block;
}
```

Show the account name and reload button in the 36px panel header. The toolbar displays the number of frames, `launch.failures` as a skipped-account summary, and the Cocos/WebGL resource warning.

- [ ] **Step 3: Build and verify route compilation**

Run: `npm.cmd run build`

Expected: Vite exits 0, lazy-loads `GameMultiPlayer`, and reports no unresolved imports or SFC errors.

- [ ] **Step 4: Commit the route page**

```bash
git add src/views/GameMultiPlayer.vue src/router/index.js src/typed-router.d.ts
git commit -m "feat: add horizontal multi-game page"
```

Only include `src/typed-router.d.ts` if its diff contains the generated GameMultiPlayer route and no unrelated changes.

---

### Task 5: Token Management Batch Selection and Launch Entry

**Files:**
- Modify: `src/views/TokenImport/index.vue:84-163`
- Modify: `src/views/TokenImport/index.vue:165-177`
- Modify: `src/views/TokenImport/index.vue:358-375`
- Modify: `src/views/TokenImport/index.vue:621-706`
- Modify: `src/views/TokenImport/index.vue:1512-1613`
- Create: `src/utils/gameSelection.js`
- Create: `test/gameSelection.test.js`
- Modify if generated: `components.d.ts`, `src/auto-imports.d.ts`

**Interfaces:**
- Consumes: `sortedTokens`, `getArrayBuffer`, `prepareGame2Launch`, browser local/session storage, router, and Naive UI messages.
- Produces: immutable `toggleTokenSelection`, `selectAllTokenIds`, and `pruneTokenSelection` helpers; independent `game2SelectedTokenIds`; list/card checkboxes; select-all/clear buttons; selected count; and `openSelectedGames()`.

- [ ] **Step 1: Write and run failing selection behavior tests**

Create `test/gameSelection.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";

const selection = await import("../src/utils/gameSelection.js").catch(() => ({}));

test("toggleTokenSelection returns a new set without mutating the current selection", () => {
  assert.equal(typeof selection.toggleTokenSelection, "function");
  const current = new Set(["a"]);
  const added = selection.toggleTokenSelection(current, "b", true);
  const removed = selection.toggleTokenSelection(added, "a", false);
  assert.deepEqual([...current], ["a"]);
  assert.deepEqual([...added], ["a", "b"]);
  assert.deepEqual([...removed], ["b"]);
});

test("selectAllTokenIds and pruneTokenSelection follow the displayed token list", () => {
  const tokens = [{ id: "b" }, { id: "a" }];
  assert.deepEqual([...selection.selectAllTokenIds(tokens)], ["b", "a"]);
  assert.deepEqual(
    [...selection.pruneTokenSelection(new Set(["missing", "a"]), tokens)],
    ["a"],
  );
});
```

Run: `node --test test/gameSelection.test.js`

Expected: FAIL on the explicit `typeof selection.toggleTokenSelection` assertion because the helper module does not exist.

- [ ] **Step 2: Implement immutable selection helpers and verify GREEN**

Create `src/utils/gameSelection.js`:

```js
export function toggleTokenSelection(current, tokenId, checked) {
  const next = new Set(current);
  if (checked) next.add(tokenId);
  else next.delete(tokenId);
  return next;
}

export function selectAllTokenIds(tokens) {
  return new Set(tokens.map((token) => token.id));
}

export function pruneTokenSelection(current, tokens) {
  const available = new Set(tokens.map((token) => token.id));
  return new Set([...current].filter((tokenId) => available.has(tokenId)));
}
```

Run: `node --test test/gameSelection.test.js`

Expected: both tests PASS.

- [ ] **Step 3: Add independent reactive selection state**

Import `prepareGame2Launch` from `@/utils/gameLauncher` and the three selection helpers from `@/utils/gameSelection`. Add:

```js
const game2SelectedTokenIds = ref(new Set());
const isOpeningGame2 = ref(false);
const selectedGame2Tokens = computed(() =>
  sortedTokens.value.filter((token) => game2SelectedTokenIds.value.has(token.id)),
);
const allGame2TokensSelected = computed(
  () => sortedTokens.value.length > 0 && selectedGame2Tokens.value.length === sortedTokens.value.length,
);

function setGame2TokenSelected(tokenId, checked) {
  game2SelectedTokenIds.value = toggleTokenSelection(
    game2SelectedTokenIds.value,
    tokenId,
    checked,
  );
}

function selectAllGame2Tokens() {
  game2SelectedTokenIds.value = selectAllTokenIds(sortedTokens.value);
}

function clearGame2TokenSelection() {
  game2SelectedTokenIds.value = new Set();
}
```

Watch `tokenStore.gameTokens.map(token => token.id)` and assign `pruneTokenSelection(game2SelectedTokenIds.value, tokenStore.gameTokens)` so deleted Tokens cannot be launched.

- [ ] **Step 4: Add list and card checkboxes without changing single selection**

Place an `n-checkbox` at the start of both the card title area and list info row:

```vue
<n-checkbox
  :checked="game2SelectedTokenIds.has(token.id)"
  :aria-label="`选择 ${token.name} 批量进入游戏`"
  @click.stop
  @update:checked="(checked) => setGame2TokenSelected(token.id, checked)"
/>
```

The `.stop` modifier is required so checking an account does not invoke the existing card/list `selectToken(token)` handler.

- [ ] **Step 5: Add header controls and the launch action**

Insert controls next to the existing “打开游戏” button:

```vue
<n-button size="small" @click="selectAllGame2Tokens">
  {{ allGame2TokensSelected ? "已全选" : "全选" }}
</n-button>
<n-button size="small" :disabled="game2SelectedTokenIds.size === 0" @click="clearGame2TokenSelection">
  清空
</n-button>
<n-button
  type="warning"
  :disabled="game2SelectedTokenIds.size === 0"
  :loading="isOpeningGame2"
  @click="openSelectedGames"
>
  批量进入游戏（{{ game2SelectedTokenIds.size }}）
</n-button>
```

Implement the action with partial-failure behavior:

```js
async function openSelectedGames() {
  if (selectedGame2Tokens.value.length === 0 || isOpeningGame2.value) return;
  isOpeningGame2.value = true;
  try {
    const { launch, failures } = await prepareGame2Launch({
      tokens: selectedGame2Tokens.value,
      getArrayBuffer,
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage,
    });
    if (failures.length > 0) {
      const failedNames = failures.map((failure) => failure.name).join("、");
      message.warning(`已跳过 ${failures.length} 个账号：${failedNames}`);
    }
    if (launch.sessions.length === 0) {
      message.error("所选账号均没有可用的 BIN 数据");
      return;
    }
    await router.push("/game2");
  } catch (error) {
    console.error("Batch game launch failed:", error);
    message.error("批量进入游戏失败，请重试");
  } finally {
    isOpeningGame2.value = false;
  }
}
```

- [ ] **Step 6: Make header controls responsive**

Allow `.section-header` and `.header-actions` to wrap with an 8px gap. Do not change card/list sizing or existing action semantics.

- [ ] **Step 7: Run tests and build**

Run: `node --test test/gameLauncher.test.js test/game2StorageBridge.test.js test/gameSelection.test.js test/towerClimbLimit.test.js test/helperTaskRunner.test.js`

Expected: all tests PASS.

Run: `npm.cmd run build`

Expected: Vite exits 0 with no template, import, or router errors.

- [ ] **Step 8: Review generated declarations and commit**

Run: `git diff -- components.d.ts src/auto-imports.d.ts src/typed-router.d.ts`

Keep only entries caused by `GameMultiPlayer.vue` or components newly used in this change. Then:

```bash
git add src/views/TokenImport/index.vue src/utils/gameSelection.js test/gameSelection.test.js components.d.ts src/auto-imports.d.ts src/typed-router.d.ts
git commit -m "feat: launch selected tokens in game2"
```

Omit unchanged generated files from `git add`.

---

### Task 6: End-to-End Verification and Documentation Check

**Files:**
- Modify only if a verified defect is found: files introduced or modified in Tasks 1-5.

**Interfaces:**
- Consumes: the complete Game2 feature and a local browser session.
- Produces: test/build evidence, visual interaction evidence, and an explicit record of whether two valid accounts were available for login isolation verification.

- [ ] **Step 1: Run the complete automated test suite**

Run: `node --test test/*.test.js`

Expected: every Node test passes; no skipped Game2 test and no uncaught rejection.

- [ ] **Step 2: Run the production build and whitespace validation**

Run: `npm.cmd run build`

Expected: exit code 0.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 3: Start the local app for browser verification**

Run: `npm.cmd run dev -- --host 127.0.0.1`

Keep the returned session running only for the browser checks, then stop it with Ctrl+C.

- [ ] **Step 4: Verify Token management interactions in a real browser**

Open `/tokens` and verify both list and card modes:

1. Checking a batch checkbox changes only the Game2 count and does not change the existing active Token highlight.
2. “全选” and “清空” update every visible Token correctly.
3. “批量进入游戏” stays disabled at zero and navigates only when at least one BIN is ready.
4. Missing BIN accounts produce one summary warning while valid accounts still open.

- [ ] **Step 5: Verify real iframe realm isolation**

With two prepared scopes, inspect both iframe windows from the same-origin parent:

1. Both iframe documents report `__GAME2_BRIDGE_READY__` with their own scope.
2. Setting `current_bin_id`, `actual_login_bin_id`, and a neutral key such as `smoke_setting` in iframe A does not change the values read in iframe B.
3. Each iframe's `key()` and `length` expose only its own namespace.
4. Calling `localStorage.clear()` in iframe A leaves iframe B keys and the parent's ordinary `/game` keys intact.
5. Reloading only iframe A leaves iframe B mounted and returns iframe A to the same Token identity.

- [ ] **Step 6: Verify layout and account behavior**

Confirm panels remain on one row, the page scrolls horizontally, account names remain visible, and per-panel retry/reload affects only one iframe. If two valid BIN accounts are available, verify both initially log in to different expected roles and that refreshing/relogging either one never changes the other. If two valid BIN accounts are unavailable, record that the final login isolation check could not be performed; do not claim it passed based only on storage inspection.

- [ ] **Step 7: Run final repository checks and commit verified fixes only**

Run: `git status --short`, `git diff --check`, `node --test test/*.test.js`, and `npm.cmd run build` once more after any browser-found correction.

If browser verification required a fix, commit the tested correction with:

```bash
git add src public/game test
git commit -m "fix: harden game2 browser integration"
```

If no correction was needed, create no empty commit.
