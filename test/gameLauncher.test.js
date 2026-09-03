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

class FailingStorage extends MemoryStorage {
  constructor(failOnWrite) {
    super();
    this.failOnWrite = failOnWrite;
    this.writeCount = 0;
  }

  setItem(key, value) {
    this.writeCount += 1;
    if (this.writeCount === this.failOnWrite) {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    }
    super.setItem(key, value);
  }
}

test("createCompatibleRandomUUID falls back to getRandomValues on HTTP", () => {
  assert.equal(typeof launcher.createCompatibleRandomUUID, "function");
  const cryptoSource = {
    getRandomValues(bytes) {
      bytes.set(Array.from({ length: 16 }, (_, index) => index));
      return bytes;
    },
  };

  assert.equal(
    launcher.createCompatibleRandomUUID(cryptoSource),
    "00010203-0405-4607-8809-0a0b0c0d0e0f",
  );
});

test("buildMultiGameFrameSrc encodes scope and account without exposing token data", () => {
  assert.equal(typeof launcher.buildMultiGameFrameSrc, "function");
  assert.equal(
    launcher.buildMultiGameFrameSrc("/helper/", {
      scopeId: "mg-0123456789abcdef0123456789abcdef",
      tokenId: "account / 一号",
    }),
    "/helper/game/multi-game.html?scope=mg-0123456789abcdef0123456789abcdef&bin_id=account%20%2F%20%E4%B8%80%E5%8F%B7",
  );
});

test("readActiveMultiGameLaunch rejects malformed and wrong-version manifests", () => {
  assert.equal(typeof launcher.readActiveMultiGameLaunch, "function");
  const storage = new MemoryStorage();
  storage.setItem("multi-game_active_launch_v1", "not-json");
  assert.equal(launcher.readActiveMultiGameLaunch(storage), null);
  storage.setItem(
    "multi-game_active_launch_v1",
    JSON.stringify({ version: 2, sessions: [], failures: [] }),
  );
  assert.equal(launcher.readActiveMultiGameLaunch(storage), null);
});

test("readActiveMultiGameLaunch rejects duplicate scopes and inconsistent order", () => {
  const storage = new MemoryStorage();
  const scope = "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const manifest = {
    version: 1,
    id: "launch-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    createdAt: 1,
    sessions: [
      { tokenId: "a", name: "A", scopeId: scope, order: 0 },
      { tokenId: "b", name: "B", scopeId: scope, order: 1 },
    ],
    failures: [],
  };
  storage.setItem("multi-game_active_launch_v1", JSON.stringify(manifest));
  assert.equal(launcher.readActiveMultiGameLaunch(storage), null);

  manifest.sessions[1].scopeId = "mg-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  manifest.sessions[1].order = 2;
  storage.setItem("multi-game_active_launch_v1", JSON.stringify(manifest));
  assert.equal(launcher.readActiveMultiGameLaunch(storage), null);
});

test("readActiveMultiGameLaunch rejects malformed failure entries", () => {
  const storage = new MemoryStorage();
  const manifest = {
    version: 1,
    id: "launch-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    createdAt: 1,
    sessions: [],
    failures: [null],
  };
  storage.setItem("multi-game_active_launch_v1", JSON.stringify(manifest));
  assert.equal(launcher.readActiveMultiGameLaunch(storage), null);

  manifest.failures = [
    { tokenId: "a", name: "A", reason: "unexpected-failure" },
  ];
  storage.setItem("multi-game_active_launch_v1", JSON.stringify(manifest));
  assert.equal(launcher.readActiveMultiGameLaunch(storage), null);
});

test("convertBinToLx preserves lx data and converts x data", () => {
  assert.equal(typeof launcher.convertBinToLx, "function");

  const lx = Uint8Array.from([112, 108, 1, 2, 3]);
  assert.deepEqual(launcher.convertBinToLx(lx.buffer), lx);

  const converted = launcher.convertBinToLx(
    Uint8Array.from([112, 120, 0, 0, 1, 2, 3, 4]).buffer,
    () => 0,
  );
  assert.equal(converted[0], 112);
  assert.equal(converted[1], 108);
  assert.ok(converted.length > 4);
});

test("prepareMultiGameLaunch seeds isolated accounts in display order and records failures", async () => {
  assert.equal(typeof launcher.prepareMultiGameLaunch, "function");
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

  const result = await launcher.prepareMultiGameLaunch({
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
    result.launch.sessions.map(({ tokenId, scopeId, order }) => ({
      tokenId,
      scopeId,
      order,
    })),
    [
      {
        tokenId: "a",
        scopeId: "mg-11111111111111111111111111111111",
        order: 0,
      },
      {
        tokenId: "b",
        scopeId: "mg-22222222222222222222222222222222",
        order: 1,
      },
    ],
  );
  assert.deepEqual(result.failures, [
    { tokenId: "missing", name: "缺失账号", reason: "missing-bin" },
  ]);
  assert.deepEqual(result.launch.failures, result.failures);
  assert.equal(
    local.getItem(
      "multi-game:mg-11111111111111111111111111111111:bin_data_a",
    ),
    "706c010203",
  );
  assert.equal(
    local.getItem(
      "multi-game:mg-22222222222222222222222222222222:current_bin_id",
    ),
    "b",
  );
  assert.deepEqual(
    JSON.parse(
      local.getItem(
        "multi-game:mg-11111111111111111111111111111111:bin_file_list",
      ),
    ),
    [
      {
        id: "a",
        name: "账号 A",
        byteLength: 5,
        size: "0.0 KB",
        order: 0,
      },
    ],
  );
  assert.deepEqual(
    JSON.parse(session.getItem("multi-game_active_launch_v1")),
    result.launch,
  );
});

test("prepareMultiGameLaunch isolates a BIN read error from other accounts", async () => {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const uuids = [
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "11111111-1111-1111-1111-111111111111",
  ];

  const result = await launcher.prepareMultiGameLaunch({
    tokens: [
      { id: "broken", name: "读取失败" },
      { id: "ready", name: "可用账号" },
    ],
    getArrayBuffer: async (id) => {
      if (id === "broken") throw new Error("IndexedDB failed");
      return Uint8Array.from([112, 108, 7, 8]).buffer;
    },
    localStorage: local,
    sessionStorage: session,
    randomUUID: () => uuids.shift(),
    now: () => 1,
  });

  assert.deepEqual(result.launch.sessions.map((item) => item.tokenId), [
    "ready",
  ]);
  assert.deepEqual(result.failures, [
    { tokenId: "broken", name: "读取失败", reason: "read-failed" },
  ]);
});

test("prepareMultiGameLaunch rolls back every new scope when localStorage writes fail", async () => {
  for (let failOnWrite = 1; failOnWrite <= 6; failOnWrite += 1) {
    const local = new FailingStorage(failOnWrite);
    const session = new MemoryStorage();
    const uuids = [
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ];

    await assert.rejects(
      launcher.prepareMultiGameLaunch({
        tokens: [
          { id: "a", name: "账号 A" },
          { id: "b", name: "账号 B" },
        ],
        getArrayBuffer: async () =>
          Uint8Array.from([112, 108, 1, 2, 3]).buffer,
        localStorage: local,
        sessionStorage: session,
        randomUUID: () => uuids.shift(),
        now: () => 1,
      }),
      { name: "QuotaExceededError" },
    );

    assert.equal(local.length, 0, `failed write ${failOnWrite}`);
    assert.equal(session.getItem("multi-game_active_launch_v1"), null);
  }
});

test("prepareMultiGameLaunch rolls back new scopes when the manifest write fails", async () => {
  const local = new MemoryStorage();
  const session = new FailingStorage(1);
  const uuids = [
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "11111111-1111-1111-1111-111111111111",
  ];

  await assert.rejects(
    launcher.prepareMultiGameLaunch({
      tokens: [{ id: "a", name: "账号 A" }],
      getArrayBuffer: async () =>
        Uint8Array.from([112, 108, 1, 2, 3]).buffer,
      localStorage: local,
      sessionStorage: session,
      randomUUID: () => uuids.shift(),
      now: () => 1,
    }),
    { name: "QuotaExceededError" },
  );

  assert.equal(local.length, 0);
  assert.equal(session.getItem("multi-game_active_launch_v1"), null);
});

test("clearMultiGameLaunch removes only scopes named by the active manifest", () => {
  assert.equal(typeof launcher.clearMultiGameLaunch, "function");
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const scope = "mg-33333333333333333333333333333333";
  local.setItem(`multi-game:${scope}:current_bin_id`, "a");
  local.setItem("bin_data_single-game", "keep");
  session.setItem(
    "multi-game_active_launch_v1",
    JSON.stringify({
      version: 1,
      id: "launch-44444444444444444444444444444444",
      createdAt: 1,
      sessions: [{ tokenId: "a", name: "A", scopeId: scope, order: 0 }],
      failures: [],
    }),
  );

  launcher.clearMultiGameLaunch({
    localStorage: local,
    sessionStorage: session,
  });

  assert.equal(local.getItem(`multi-game:${scope}:current_bin_id`), null);
  assert.equal(local.getItem("bin_data_single-game"), "keep");
  assert.equal(session.getItem("multi-game_active_launch_v1"), null);
});

test("closeMultiGameSession removes only the target scope and persists remaining order", () => {
  assert.equal(typeof launcher.closeMultiGameSession, "function");
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const scopes = [
    "mg-11111111111111111111111111111111",
    "mg-22222222222222222222222222222222",
    "mg-33333333333333333333333333333333",
  ];
  const launch = {
    version: 1,
    id: "launch-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    createdAt: 1,
    sessions: scopes.map((scopeId, order) => ({
      tokenId: String.fromCharCode(97 + order),
      name: `账号 ${order + 1}`,
      scopeId,
      order,
    })),
    failures: [
      { tokenId: "missing", name: "缺失账号", reason: "missing-bin" },
    ],
  };
  session.setItem("multi-game_active_launch_v1", JSON.stringify(launch));
  for (const [index, scope] of scopes.entries()) {
    local.setItem(`multi-game:${scope}:current_bin_id`, launch.sessions[index].tokenId);
    local.setItem(`multi-game:${scope}:setting`, `value-${index}`);
  }
  local.setItem("outside", "keep");

  const result = launcher.closeMultiGameSession({
    scopeId: scopes[1],
    localStorage: local,
    sessionStorage: session,
  });

  assert.deepEqual(
    result.sessions.map(({ tokenId, scopeId, order }) => ({
      tokenId,
      scopeId,
      order,
    })),
    [
      { tokenId: "a", scopeId: scopes[0], order: 0 },
      { tokenId: "c", scopeId: scopes[2], order: 1 },
    ],
  );
  assert.deepEqual(result.failures, launch.failures);
  assert.deepEqual(
    JSON.parse(session.getItem("multi-game_active_launch_v1")),
    result,
  );
  assert.equal(local.getItem(`multi-game:${scopes[1]}:current_bin_id`), null);
  assert.equal(local.getItem(`multi-game:${scopes[1]}:setting`), null);
  assert.equal(local.getItem(`multi-game:${scopes[0]}:setting`), "value-0");
  assert.equal(local.getItem(`multi-game:${scopes[2]}:setting`), "value-2");
  assert.equal(local.getItem("outside"), "keep");
});

test("closeMultiGameSession keeps scoped data when the updated manifest cannot be saved", () => {
  const local = new MemoryStorage();
  const session = new FailingStorage(2);
  const scopeId = "mg-11111111111111111111111111111111";
  const launch = {
    version: 1,
    id: "launch-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    createdAt: 1,
    sessions: [{ tokenId: "a", name: "账号 A", scopeId, order: 0 }],
    failures: [],
  };
  session.setItem("multi-game_active_launch_v1", JSON.stringify(launch));
  local.setItem(`multi-game:${scopeId}:current_bin_id`, "a");

  assert.throws(
    () =>
      launcher.closeMultiGameSession({
        scopeId,
        localStorage: local,
        sessionStorage: session,
      }),
    { name: "QuotaExceededError" },
  );

  assert.deepEqual(
    JSON.parse(session.getItem("multi-game_active_launch_v1")),
    launch,
  );
  assert.equal(local.getItem(`multi-game:${scopeId}:current_bin_id`), "a");
});

test("moveMultiGameSession swaps adjacent sessions and persists their order", () => {
  const session = new MemoryStorage();
  const scopes = [
    "mg-11111111111111111111111111111111",
    "mg-22222222222222222222222222222222",
    "mg-33333333333333333333333333333333",
  ];
  session.setItem(
    "multi-game_active_launch_v1",
    JSON.stringify({
      version: 1,
      id: "launch-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      createdAt: 1,
      sessions: scopes.map((scopeId, order) => ({
        tokenId: String.fromCharCode(97 + order),
        name: `账号 ${order + 1}`,
        scopeId,
        order,
      })),
      failures: [],
    }),
  );

  const result = launcher.moveMultiGameSession({
    scopeId: scopes[1],
    direction: 1,
    sessionStorage: session,
  });

  assert.deepEqual(
    result.sessions.map(({ scopeId, order }) => ({ scopeId, order })),
    [
      { scopeId: scopes[0], order: 0 },
      { scopeId: scopes[2], order: 1 },
      { scopeId: scopes[1], order: 2 },
    ],
  );
  assert.deepEqual(
    JSON.parse(session.getItem("multi-game_active_launch_v1")),
    result,
  );
  assert.equal(
    launcher.moveMultiGameSession({
      scopeId: scopes[1],
      direction: 1,
      sessionStorage: session,
    }),
    null,
  );
});

test("resolveMultiGameFrameMessage accepts only the matching same-origin iframe", () => {
  assert.equal(typeof launcher.resolveMultiGameFrameMessage, "function");
  const expectedSource = {};
  const frames = [
    { scopeId: "mg-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  ];
  const frameElements = new Map([
    [frames[0].scopeId, { contentWindow: expectedSource }],
  ]);
  const baseEvent = {
    origin: "https://helper.example",
    source: expectedSource,
    data: {
      channel: "multi-game",
      version: 1,
      type: "ready",
      scope: frames[0].scopeId,
    },
  };

  assert.deepEqual(
    launcher.resolveMultiGameFrameMessage({
      event: baseEvent,
      expectedOrigin: "https://helper.example",
      frames,
      frameElements,
    }),
    { scopeId: frames[0].scopeId, status: "ready" },
  );
  assert.equal(
    launcher.resolveMultiGameFrameMessage({
      event: { ...baseEvent, origin: "https://attacker.example" },
      expectedOrigin: "https://helper.example",
      frames,
      frameElements,
    }),
    null,
  );
  assert.equal(
    launcher.resolveMultiGameFrameMessage({
      event: { ...baseEvent, source: {} },
      expectedOrigin: "https://helper.example",
      frames,
      frameElements,
    }),
    null,
  );
  assert.equal(
    launcher.resolveMultiGameFrameMessage({
      event: { ...baseEvent, data: { ...baseEvent.data, type: "unknown" } },
      expectedOrigin: "https://helper.example",
      frames,
      frameElements,
    }),
    null,
  );
});

export { MemoryStorage };
