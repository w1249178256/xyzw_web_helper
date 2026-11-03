import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";
import {
  computed,
  effectScope,
  onScopeDispose,
  reactive,
  ref,
  watch,
} from "vue";
import {
  createInstanceId,
  parseGameToken,
  settings,
} from "../public/game-runtime/core.js";
import {
  claimGameLease,
  removeGameLease,
  renewGameLease,
} from "../src/utils/gameLease.js";
import { gameResourcePath } from "../src/utils/linkGameResource.js";
import { gameResourceTarget, handleGameResource } from "../worker.js";
import { loadModule } from "./helpers/loadModule.js";

const credential = {
  roleToken: "mock-role-token",
  roleId: "123",
  serverId: 456,
};
const record = { id: "a", name: "测试角色", token: JSON.stringify(credential) };

test("launcher accepts existing JSON, Base64 and nested Tokens without mutating them", () => {
  for (const token of [
    record.token,
    Buffer.from(record.token).toString("base64"),
    JSON.stringify({ gameToken: record.token }),
  ]) {
    const input = { ...record, token };
    const before = JSON.stringify(input);
    const account = parseGameToken(input);
    assert.equal(account.auth.roleToken, credential.roleToken);
    assert.equal(account.identity, "role:456:123");
    assert.equal(JSON.stringify(input), before);
  }
  assert.throws(() =>
    parseGameToken({ ...record, token: "<html>error</html>" }),
  );
  assert.notEqual(
    parseGameToken({ ...record, token: JSON.stringify({ roleToken: "x" }) })
      .identity,
    parseGameToken({
      ...record,
      id: "b",
      token: JSON.stringify({ roleToken: "x" }),
    }).identity,
  );
});

test("leases reject duplicate identities and stale owners cannot renew or release replacements", () => {
  const first = claimGameLease({}, "a", "owner-1", "role:1", 0);
  assert.throws(() => claimGameLease(first, "b", "owner-2", "role:1", 10));
  const two = claimGameLease(first, "b", "owner-2", "role:2", 10);
  assert.equal(Object.keys(two).length, 2);
  assert.equal(renewGameLease(two, "a", "wrong", 20), null);
  assert.equal(removeGameLease(two, "a", "wrong"), two);
  assert.equal(renewGameLease(two, "a", "owner-1", 20).a.expiresAt, 120020);
  const next = claimGameLease(two, "a", "owner-3", "role:1", 120011);
  assert.equal(removeGameLease(next, "a", "owner-1").a.owner, "owner-3");
});

test("resource routes support the manifest and fixed game origins", () => {
  for (const [url, method] of [
    ["https://xxz-xyzw.hortorgames.com/login/manifest?platform=hortor", "POST"],
    ["https://xxz-xyzw-res.hortorgames.com/remote/game/index.abcde.jsc", "GET"],
    ["https://xxz-xyzw-alires.hortorgames.com/image.png", "HEAD"],
    ["https://xyzw11001.baby/file.js", "GET"],
  ]) {
    const local = gameResourcePath(url, method);
    assert.equal(
      gameResourceTarget(`https://helper.example${local}`, method).href,
      url,
    );
  }
  for (const url of [
    "http://xxz-xyzw-res.hortorgames.com/file",
    "https://evil.example/file",
    "https://user:pass@xyzw11001.baby/file",
    "https://xxz-xyzw.hortorgames.com/login/authuser",
    "https://xyzw11001.baby:8443/file",
  ]) {
    assert.throws(() => gameResourcePath(url));
  }
  assert.throws(() =>
    gameResourceTarget(
      "https://helper.example/api/link-games/assets/file",
      "POST",
    ),
  );
  assert.throws(() =>
    gameResourceTarget(
      "https://helper.example/api/link-games/toString/file",
      "GET",
    ),
  );
  assert.throws(() =>
    gameResourceTarget(
      "https://helper.example/api/link-games/unknown/file",
      "GET",
    ),
  );
});

test("public resource proxy strips credentials and exposes redirects for validation", async () => {
  let called = 0;
  const response = await handleGameResource(
    new Request("https://helper.example/api/link-games/assets/file", {
      headers: {
        authorization: "private",
        cookie: "private",
        accept: "application/octet-stream",
      },
    }),
    async (url, options) => {
      called++;
      assert.equal(url.hostname, "xxz-xyzw-res.hortorgames.com");
      assert.equal(options.headers.has("authorization"), false);
      assert.equal(options.headers.has("cookie"), false);
      assert.equal(options.headers.get("accept"), "application/octet-stream");
      assert.equal(options.redirect, "manual");
      return new Response(null, {
        status: 302,
        headers: {
          location: "https://evil.example/file",
          "set-cookie": "private",
        },
      });
    },
  );
  assert.equal(called, 1);
  assert.equal(response.headers.get("x-game-status"), "302");
  assert.equal(response.headers.has("location"), false);
  assert.equal(response.headers.has("set-cookie"), false);
  assert.throws(() =>
    gameResourcePath(response.headers.get("x-game-location")),
  );
  await response.arrayBuffer();
});

test("resource proxy preserves binary bytes and rejects invalid requests before fetching", async () => {
  const binary = new Uint8Array([0, 255, 128, 1]);
  const response = await handleGameResource(
    new Request("https://helper.example/api/link-games/assets/file"),
    async () => new Response(binary),
  );
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), binary);
  const invalid = await handleGameResource(
    new Request("https://helper.example/api/link-games/unknown/file"),
    () => {
      throw new Error("must not fetch");
    },
  );
  assert.equal(invalid.status, 400);
  const oversized = await handleGameResource(
    new Request("https://helper.example/api/link-games/manifest", {
      method: "POST",
      body: new Uint8Array(65537),
    }),
    () => {
      throw new Error("must not fetch");
    },
  );
  assert.equal(oversized.status, 502);
});

async function launcherHarness({ loadCore, acquire } = {}) {
  const reservations = ref({});
  const handlers = new Map();
  const releases = [];
  const scope = effectScope();
  let sequence = 0;
  const core = {
    parseGameToken,
    settings,
    createInstanceId: () => `test-${++sequence}`,
  };
  const tokens = {
    gameTokens: [record],
    closeWebSocketConnectionAsync: async () => {},
    getWebSocketStatus: () => "disconnected",
  };
  const exported = await loadModule(
    new URL("../src/stores/gameLauncher.js", import.meta.url),
    {
      vue: { ref, reactive, computed, watch, onScopeDispose },
      pinia: { defineStore: (_id, setup) => setup },
      "@vueuse/core": { useLocalStorage: (_key, value) => ref(value) },
      "./tokenStore": { useTokenStore: () => tokens },
      "@/utils/linkGameResource": {
        proxyGameResource: async () => {
          throw new Error("unexpected network");
        },
      },
      "@/utils/linkGameRuntime": {
        loadGameRuntime: loadCore || (async () => core),
      },
      "@/utils/gameResourceCache": { gameScriptCacheKey: () => null },
      "@/utils/gameReservations": {
        gameReservations: reservations,
        isGameTokenRunning: () => false,
        acquireGameToken:
          acquire ||
          (async (id, owner) => {
            reservations.value = { [id]: { owner } };
          }),
        refreshGameToken: () => true,
        releaseGameToken: (id, owner) => releases.push({ id, owner }),
      },
    },
    {
      location: { origin: "https://helper.example" },
      window: {
        addEventListener: (name, fn) => handlers.set(name, fn),
        removeEventListener: (name) => handlers.delete(name),
      },
      setInterval: () => 1,
      clearInterval() {},
      setTimeout: () => 2,
      clearTimeout() {},
    },
  );
  const store = scope.run(() => exported.useGameLauncherStore());
  return { store, scope, releases, handlers, core };
}

test("stopping a pending launch releases the eventual lease without creating an iframe", async () => {
  let resolveAcquire;
  let enteredAcquire;
  const acquired = new Promise((resolve) => {
    enteredAcquire = resolve;
  });
  const pending = new Promise((resolve) => {
    resolveAcquire = resolve;
  });
  const h = await launcherHarness({
    acquire: () => {
      enteredAcquire();
      return pending;
    },
  });
  try {
    const start = h.store.start("a");
    await acquired;
    const win = h.store.windows.value[0];
    assert.ok(win);
    h.store.stop(win.id);
    resolveAcquire();
    await start;
    assert.equal(h.store.windows.value.length, 0);
    assert.equal(win.mounted, false);
    assert.ok(h.releases.some((item) => item.owner === win.leaseOwner));
  } finally {
    h.scope.stop();
  }
});

test("stop all cancels a launch whose runtime is still loading", async () => {
  let resolveCore;
  const pending = new Promise((resolve) => {
    resolveCore = resolve;
  });
  const h = await launcherHarness({ loadCore: () => pending });
  try {
    const start = h.store.start("a");
    h.store.stopAll();
    resolveCore(h.core);
    await start;
    assert.equal(h.store.windows.value.length, 0);
  } finally {
    h.scope.stop();
  }
});

test("duplicate launches share one window; messages from stale or foreign frames are ignored", async () => {
  const h = await launcherHarness();
  try {
    await Promise.all([h.store.start("a"), h.store.start("a")]);
    assert.equal(h.store.windows.value.length, 1);
    const win = h.store.windows.value[0];
    assert.equal(win.mounted, true);
    const frame = { postMessage() {} };
    h.store.attachFrame(win.id, { contentWindow: frame });
    const message = {
      channel: "xyzw-game-runtime-v1",
      id: win.id,
      generation: win.generation,
      type: "status",
      state: "online",
    };
    h.handlers.get("message")({
      origin: "https://other.example",
      source: frame,
      data: message,
    });
    h.handlers.get("message")({
      origin: "https://helper.example",
      source: {},
      data: message,
    });
    h.handlers.get("message")({
      origin: "https://helper.example",
      source: frame,
      data: { ...message, generation: "old" },
    });
    assert.equal(win.status, "loading");
    h.handlers.get("message")({
      origin: "https://helper.example",
      source: frame,
      data: message,
    });
    assert.equal(win.status, "online");
    h.store.stopAll();
    assert.equal(h.store.windows.value.length, 0);
  } finally {
    h.scope.stop();
  }
  assert.equal(h.handlers.size, 0);
});

test("runtime identifiers work on HTTP without crypto.randomUUID", () => {
  const id = createInstanceId({
    getRandomValues: (array) => {
      array.fill(19);
      return array;
    },
  });
  assert.match(
    id,
    /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/,
  );
});

test("assistant transport cannot open or reconnect while an online game owns the account", async () => {
  let allowed = false;
  let opened = 0;
  let nextTimer = 0;
  const timers = new Map();
  const logger = { info() {}, debug() {}, warn() {}, error() {} };
  const exported = await loadModule(
    new URL("../src/utils/xyzwWebSocket.js", import.meta.url),
    {
      "@/stores/cache": { $CacheManager: { getCache: () => ({}) } },
      "./bonProtocol.js": { g_utils: {} },
      "./helperTaskRunner.js": { sleep: async () => {} },
      "./logger.js": { gameLogger: logger, wsLogger: logger },
    },
    {
      WebSocket: class {
        constructor() {
          opened++;
        }
        close() {}
      },
      setTimeout: (fn) => {
        timers.set(++nextTimer, fn);
        return nextTimer;
      },
      clearTimeout: (id) => timers.delete(id),
      clearInterval() {},
    },
  );
  const client = new exported.XyzwWebSocketClient({
    url: "wss://example.invalid/agent",
    canConnect: () => allowed,
  });
  client.init();
  client.reconnect();
  assert.equal(opened, 0);
  assert.equal(timers.size, 0);
  allowed = true;
  client.init();
  assert.equal(opened, 1);
  client.reconnect();
  const reconnect = timers.get(client.reconnectTimer);
  assert.ok(reconnect);
  allowed = false;
  reconnect();
  assert.equal(opened, 1);
  client.disconnect();
});
