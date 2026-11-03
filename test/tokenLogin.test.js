import assert from "node:assert/strict";
import test from "node:test";
import { computed, ref } from "vue";
import { prepareBinToken, saveBinToken } from "../src/utils/binTokenImport.js";
import {
  getAuthUserData,
  getTokenErrorMessage,
} from "../src/utils/tokenLogin.js";
import { loadModule } from "./helpers/loadModule.js";

test("authentication rejects server errors and missing credentials", () => {
  for (const data of [undefined, {}, { roleToken: "" }, { token: " " }]) {
    assert.throws(
      () => getAuthUserData({ getData: () => data }),
      /没有有效 Token/,
    );
  }
  assert.throws(
    () =>
      getAuthUserData({ code: 400340, getData: () => ({ token: "stale" }) }),
    /频繁/,
  );
  assert.throws(() => getAuthUserData({ error: "token expired" }), /已过期/);
  const valid = { roleToken: "valid", roleId: 10 };
  assert.equal(getAuthUserData({ code: 0, getData: () => valid }), valid);
});

test("login failures distinguish expiry, invalid credentials, transport and throttling", () => {
  assert.match(getTokenErrorMessage(new Error("token expired")), /已过期/);
  assert.match(getTokenErrorMessage(new Error("invalid token")), /无效/);
  assert.match(getTokenErrorMessage({ code: "ECONNABORTED" }), /超时/);
  assert.match(getTokenErrorMessage({}), /检查网络/);
  assert.match(getTokenErrorMessage("", 403), /认证失败/);
  assert.match(getTokenErrorMessage("", 400340), /频繁/);
  assert.equal(
    getTokenErrorMessage("上座塔的奖励未领取", 1500040),
    "上座塔的奖励未领取（错误码：1500040）",
  );
});

test("token validation failures retain the received code without guessing expiry from the number", () => {
  const message = getTokenErrorMessage("check token error", 200250);
  assert.match(message, /校验失败.*可能已失效/);
  assert.match(message, /错误码：200250/);
  assert.equal(getTokenErrorMessage(message), message);
  assert.equal(getTokenErrorMessage(message, 200250), message);
  assert.equal(
    getTokenErrorMessage("其他认证失败", 200250),
    "其他认证失败（错误码：200250）",
  );
  assert.equal(getTokenErrorMessage("认证失败", 0), "认证失败");
  assert.match(
    getTokenErrorMessage("token expired", 123456),
    /已过期.*错误码：123456/,
  );
});

test("BIN auth errors retain their code and original reason through a catch", () => {
  assert.throws(
    () => getAuthUserData({ error: "check token error", code: 200250 }),
    (error) => {
      assert.equal(error.code, 200250);
      assert.equal(error.rawMessage, "check token error");
      assert.match(error.message, /可能已失效.*错误码：200250/);
      assert.equal(getTokenErrorMessage(error), error.message);
      return true;
    },
  );
});

const options = () => ({
  name: "",
  server: "",
  wsUrl: "",
  pendingIds: new Set(),
});
const file = (name = "account.bin", bytes = [1, 2, 3]) => ({
  name,
  arrayBuffer: async () => Uint8Array.from(bytes).buffer,
});
const dependencies = () => ({
  getTokenId: () => "original-byte-id",
  onAuthenticating() {},
  transformToken: async () => "authenticated-token",
});

test("BIN preparation preserves original bytes and parses role metadata", async () => {
  const deps = dependencies();
  deps.transformToken = async (bytes) => {
    new Uint8Array(bytes)[0] = 99;
    return "valid";
  };
  const role = await prepareBinToken(
    file("bin-12服-1-123456-角色.bin"),
    options(),
    deps,
  );
  assert.deepEqual([...new Uint8Array(role.binData)], [1, 2, 3]);
  assert.equal(role.id, "original-byte-id");
  assert.equal(role.name, "角色");
  assert.equal(role.server, "121");
  const other = await prepareBinToken(file("other.dmp"), options(), deps);
  assert.equal(other.name, "other");
  assert.equal(other.server, "");
});

test("invalid, empty and duplicate files do not reach authentication", async () => {
  let calls = 0;
  const deps = {
    ...dependencies(),
    transformToken: async () => {
      calls++;
    },
  };
  await assert.rejects(
    prepareBinToken(file("bad.txt"), options(), deps),
    /仅支持/,
  );
  await assert.rejects(
    prepareBinToken(file("empty.bin", []), options(), deps),
    /为空/,
  );
  const duplicate = options();
  duplicate.pendingIds.add("original-byte-id");
  await assert.rejects(prepareBinToken(file(), duplicate, deps), /重复/);
  assert.equal(calls, 0);
});

test("BIN authentication failure produces no pending token", async () => {
  const deps = {
    ...dependencies(),
    transformToken: async () => {
      throw new Error("token expired");
    },
  };
  await assert.rejects(prepareBinToken(file(), options(), deps), /expired/);
});

test("confirmed BIN updates keep the account ID, groups and unrelated metadata", async () => {
  const role = await prepareBinToken(file(), options(), dependencies());
  const old = { id: role.id, remark: "keep", createdAt: "original" };
  const groups = [{ tokenIds: [old.id] }];
  const store = {
    gameTokens: [old],
    updateToken(id, data) {
      assert.equal(id, old.id);
      Object.assign(old, data);
      return true;
    },
    addToken() {
      assert.fail("must update instead of adding a duplicate");
    },
  };
  assert.equal(
    await saveBinToken(role, store, async (id, bytes) => {
      assert.equal(id, old.id);
      assert.equal(bytes, role.binData);
      return true;
    }),
    "updated",
  );
  assert.equal(old.remark, "keep");
  assert.equal(old.createdAt, "original");
  assert.equal(groups[0].tokenIds[0], old.id);
  assert.equal(old.binData, undefined);
});

test("failed BIN persistence leaves the token list unchanged for retry", async () => {
  const role = await prepareBinToken(file(), options(), dependencies());
  const tokens = [];
  const store = { gameTokens: tokens, addToken: (data) => tokens.push(data) };
  await assert.rejects(
    saveBinToken(role, store, async () => false),
    /保存 BIN 失败/,
  );
  assert.equal(tokens.length, 0);
  assert.equal(await saveBinToken(role, store, async () => true), "added");
  assert.equal(tokens.length, 1);
});

async function createStore() {
  const timers = new Map();
  const storage = new Map();
  let nextTimer = 0;
  const logger = new Proxy({}, { get: () => () => {} });
  class Client {
    constructor() {
      this.socket = { readyState: 3 };
    }
    init() {}
    send() {}
    disconnect() {
      this.closed = true;
      this.socket = null;
    }
    setMessageListener(listener) {
      this.receive = listener;
    }
  }
  const exports = await loadModule(
    new URL("../src/stores/tokenStore.ts", import.meta.url),
    {
      "@vueuse/core": { useLocalStorage: (_key, value) => ref(value) },
      pinia: { defineStore: (_name, setup) => setup },
      vue: { computed, ref },
      "@/hooks/useIndexedDB": {
        default: () => ({ getArrayBuffer: async () => null }),
      },
      "@/router": { default: { currentRoute: ref({ path: "/tokens" }) } },
      "@/utils/bonProtocol": { g_utils: {} },
      "@/utils/logger": {
        gameLogger: logger,
        tokenLogger: logger,
        wsLogger: logger,
      },
      "@/utils/randomSeed": { generateRandomSeed: () => 1 },
      "@/utils/token": { setAuthUserRateLimiterCallback() {} },
      "@/utils/tokenLogin": { getTokenErrorMessage },
      "@/utils/wechatForceLogout": {},
      "@/utils/xyzwWebSocket": { XyzwWebSocketClient: Client },
      "./events/index.js": { $emit: { emit() {} }, emitPlus() {} },
    },
    {
      atob,
      window: {
        location: { href: "http://localhost/tokens" },
        addEventListener() {},
      },
      localStorage: {
        getItem: (key) => storage.get(key) || null,
        removeItem: (key) => storage.delete(key),
      },
      setTimeout: (callback) => {
        timers.set(++nextTimer, callback);
        return nextTimer;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  const store = exports.useTokenStore();
  const token = {
    id: "test-account",
    name: "Test",
    token: "test-credential-value",
    importMethod: "manual",
  };
  store.addToken(token);
  return { store, token, timers, storage };
}

test("socket open is pending login until a successful role response arrives", async () => {
  const { store, token, timers } = await createStore();
  const client = await store.createWebSocketConnection(token.id, token.token);
  client.onConnect();
  const connection = store.wsConnections.value[token.id];
  assert.equal(connection.authenticated, false);
  assert.equal(timers.size, 1);
  client.receive({
    cmd: "role_getroleinforesp",
    code: 0,
    getData: () => ({ role: {} }),
  });
  assert.equal(connection.authenticated, true);
  assert.equal(connection.lastError, null);
  assert.equal(timers.size, 0);
});

test("expiry is retained after disconnect and cleared on a successful retry", async () => {
  const { store, token } = await createStore();
  const first = await store.createWebSocketConnection(token.id, token.token);
  first.onConnect();
  first.receive({ error: "token expired", code: 0 });
  await Promise.resolve();
  assert.match(store.wsConnections.value[token.id].lastError.error, /已过期/);
  await first.onDisconnect({ code: 1000 });
  assert.match(store.wsConnections.value[token.id].lastError.error, /已过期/);
  const second = await store.createWebSocketConnection(token.id, token.token);
  second.onConnect();
  second.receive({
    cmd: "role_getroleinforesp",
    getData: () => ({ role: {} }),
  });
  assert.equal(store.wsConnections.value[token.id].lastError, null);
  first.onError(new Error("old connection"));
  assert.equal(store.wsConnections.value[token.id].lastError, null);
});

test("login timeout closes the client, releases locks and remains visible", async () => {
  const { store, token, timers } = await createStore();
  const client = await store.createWebSocketConnection(token.id, token.token);
  const timeout = [...timers.values()][0];
  timeout();
  assert.equal(client.closed, true);
  assert.match(store.wsConnections.value[token.id].lastError.error, /超时/);
  assert.equal(timers.size, 0);
  assert.equal(store.devTools.showConnectionLocks().length, 0);
});

test("WebSocket login errors preserve the raw reason and code after disconnect", async () => {
  for (const detail of [
    { error: "check token error" },
    { hint: "check token error" },
  ]) {
    const { store, token } = await createStore();
    const client = await store.createWebSocketConnection(token.id, token.token);
    client.onConnect();
    client.receive({ ...detail, code: 200250 });
    await client.onDisconnect({ code: 1000 });
    const error = store.wsConnections.value[token.id].lastError;
    assert.equal(error.code, 200250);
    assert.equal(error.rawMessage, "check token error");
    assert.match(error.error, /可能已失效.*错误码：200250/);
  }
});

test("invalid tokens and cross-tab conflicts produce visible failure reasons", async () => {
  const { store, token, storage } = await createStore();
  assert.equal(await store.createWebSocketConnection(token.id, ""), null);
  assert.match(store.wsConnections.value[token.id].lastError.error, /无效/);
  storage.set(
    `ws_connection_${token.id}`,
    JSON.stringify({
      sessionId: "other-tab",
      timestamp: Date.now(),
      action: "connected",
    }),
  );
  assert.equal(
    await store.createWebSocketConnection(token.id, token.token),
    null,
  );
  assert.match(
    store.wsConnections.value[token.id].lastError.error,
    /其他标签页/,
  );
});

test("gameplay errors after login do not mark valid credentials as expired", async () => {
  const { store, token } = await createStore();
  const client = await store.createWebSocketConnection(token.id, token.token);
  client.onConnect();
  client.receive({
    cmd: "role_getroleinforesp",
    getData: () => ({ role: {} }),
  });
  client.receive({ cmd: "task_claimresp", code: 700010, error: "任务未完成" });
  assert.equal(store.wsConnections.value[token.id].authenticated, true);
  assert.equal(store.wsConnections.value[token.id].lastError, null);
});
