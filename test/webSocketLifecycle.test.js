import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/loadModule.js";

/** Load either real client with deterministic timers and no network access. */
async function createClient(file, exportName) {
  let nextId = 0;
  const timers = new Map();
  const intervals = new Map();
  const errors = [];
  const logger = {
    info() {},
    verbose() {},
    wsMessage() {},
    warn() {},
    error(...args) {
      errors.push(args);
    },
  };
  const utils = {
    bon: {
      encode(value) {
        return value;
      },
    },
  };
  const dependencies = {
    "@/stores/cache": {
      $CacheManager: {
        getCache() {
          return {};
        },
      },
    },
    "./bonProtocol.js": { g_utils: utils },
    "./logger.js": { gameLogger: logger, wsLogger: logger },
    "./helperTaskRunner.js": { sleep: async () => {} },
    // 后台心跳兜底：单测里不需要真实 Worker，返回一个空的取消函数
    "./bgTicker.js": { onBgTick: () => () => {} },
  };
  const globals = {
    WebSocket: { OPEN: 1 },
    setTimeout(callback) {
      const id = ++nextId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    setInterval(callback) {
      const id = ++nextId;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
  };
  const exports = await loadModule(
    new URL(`../src/utils/${file}`, import.meta.url),
    dependencies,
    globals,
  );
  const client = new exports[exportName]({
    url: "ws://example.invalid",
    utils,
  });
  client.connected = true;
  client.socket = { readyState: 1, send() {} };
  return { client, timers, intervals, errors };
}

for (const [file, name] of [
  ["xyzwWebSocket.js", "XyzwWebSocketClient"],
  ["xyzwLegionWarWebSocket.js", "XyzwLegionWarWebSocketClient"],
]) {
  test(`${name} clears request timers for sequence and legacy command responses`, async () => {
    const { client, timers } = await createClient(file, name);
    const first = client.sendWithPromise("role_getroleinfo");
    assert.equal(timers.size, 1);
    client._handlePromiseResponse({ resp: client.seq, code: 0, body: "first" });
    assert.equal(await first, "first");
    assert.equal(timers.size, 0);
    const second = client.sendWithPromise("role_getroleinfo");
    client._handlePromiseResponse({
      cmd: "role_getroleinforesp",
      code: 0,
      body: "second",
    });
    assert.equal(await second, "second");
    assert.equal(timers.size, 0);
  });

  test(`${name} rejects outstanding requests and clears timers on connection cleanup`, async () => {
    const { client, timers } = await createClient(file, name);
    const pending = client.sendWithPromise("role_getroleinfo");
    const rejected = assert.rejects(pending, /连接已关闭/);
    client._clearTimers();
    await rejected;
    assert.equal(timers.size, 0);
    assert.equal(Object.keys(client.promises).length, 0);
  });

  test(`${name} processes a delayed queue entry without an undefined sleep`, async () => {
    const { client, intervals, errors } = await createClient(file, name);
    client.send("heart_beat", {}, { sleep: 1 });
    client._processQueueLoop();
    await intervals.get(client.sendQueueTimer)();
    assert.equal(client.sendQueue.length, 0);
    assert.deepEqual(errors, []);
  });
}
