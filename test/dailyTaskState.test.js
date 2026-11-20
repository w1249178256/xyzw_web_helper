import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getClaimablePointRewards,
  getDailyTaskStates,
  loadDailyTaskConfig,
  validateDailyTaskConfig,
} from "../src/utils/dailyTaskState.js";

function officialConfig() {
  return {
    DailyTaskConf: {
      1: { id: 1, completeCondition: 6, completeValue: 3 },
      8: { id: 8, completeCondition: 13, completeValue: 1 },
      9: { id: 9, completeCondition: 12, completeValue: 1 },
    },
    DayLimitConf: { 1: { id: 1, limit: 20 }, 2: { id: 2, limit: 40 } },
    WeekLimitConf: { 1: { id: 1, limit: 100 }, 2: { id: 2, limit: 200 } },
  };
}
function role(complete = {}) {
  return { dailyTask: { dailyTime: 1700000000, complete } };
}

test("server counters distinguish unfinished, completed-unclaimed and claimed", () => {
  const config = validateDailyTaskConfig(officialConfig());
  const states = getDailyTaskStates(role({ 6: 2, 13: 1, 12: -1 }), config);
  assert.equal(states[0].status, "pending");
  assert.equal(states[0].remaining, 1);
  assert.equal(states[1].status, "claimable");
  assert.equal(states[1].id, 8);
  assert.equal(states[2].status, "claimed");
  assert.equal(states[2].id, 9);
});

test("progress above target requires claiming, not repeating the action", () => {
  const states = getDailyTaskStates(
    role({ 6: 20 }),
    validateDailyTaskConfig(officialConfig()),
  );
  assert.equal(states[0].status, "claimable");
  assert.equal(states[0].remaining, 0);
});

test("an absent counter in a valid server map means zero; null does not", () => {
  const config = validateDailyTaskConfig(officialConfig());
  assert.equal(getDailyTaskStates(role(), config)[0].remaining, 3);
  assert.throws(
    () => getDailyTaskStates(role({ 6: null }), config),
    /进度无效/,
  );
});

test("missing or malformed server task data cannot be treated as completed", () => {
  const config = validateDailyTaskConfig(officialConfig());
  for (const input of [
    {},
    { dailyTask: {} },
    { dailyTask: { dailyTime: 1, complete: [] } },
  ]) {
    assert.throws(() => getDailyTaskStates(input, config), /列表不完整/);
  }
  for (const count of [-2, "3", 1.5])
    assert.throws(
      () => getDailyTaskStates(role({ 6: count }), config),
      /进度无效/,
    );
});

test("official targets are used instead of client hardcoded thresholds", () => {
  const raw = officialConfig();
  raw.DailyTaskConf[1].completeValue = 5;
  assert.equal(
    getDailyTaskStates(role({ 6: 3 }), validateDailyTaskConfig(raw))[0]
      .remaining,
    2,
  );
});

test("invalid or duplicate configuration stops execution", () => {
  const raw = officialConfig();
  raw.DailyTaskConf[8].completeCondition = 6;
  assert.throws(() => validateDailyTaskConfig(raw), /配置无效/);
  assert.throws(() => validateDailyTaskConfig({}), /配置无效/);
});

test("point reward selection uses server points and claimed map for daily and weekly rewards", () => {
  const config = validateDailyTaskConfig(officialConfig());
  const daily = {
    dailyPoint: 40,
    dailyReward: { 1: true },
    weekPoint: 150,
    weekReward: {},
  };
  assert.deepEqual(getClaimablePointRewards(daily, config.dailyRewards), [2]);
  assert.deepEqual(
    getClaimablePointRewards(daily, config.weeklyRewards, true),
    [1],
  );
  assert.throws(
    () => getClaimablePointRewards({ dailyPoint: 40 }, config.dailyRewards),
    /不完整/,
  );
  assert.throws(
    () =>
      getClaimablePointRewards(
        { dailyPoint: 40, dailyReward: { 1: "true" } },
        config.dailyRewards,
      ),
    /不完整/,
  );
});

// loadDailyTaskConfig no longer talks to the game server: the version comes
// from the CDN's version.json, so every fetch mock routes by URL.
const VERSION_URL = "xxz-xyzw-res.hortorgames.com/data/version.json";

function fetchMock({ version = "test-config", configResults = [] } = {}) {
  let versionReads = 0;
  let configReads = 0;
  const fetchConfig = async (url) => {
    if (url.includes(VERSION_URL)) {
      versionReads++;
      return {
        ok: true,
        json: async () => ({
          version: typeof version === "function" ? version(versionReads) : version,
        }),
      };
    }
    const result = configResults[Math.min(configReads, configResults.length - 1)];
    configReads++;
    if (typeof result === "function") return result(configReads);
    if (result) return result;
    return { ok: true, json: async () => officialConfig() };
  };
  return {
    fetchConfig,
    reads: () => ({ versionReads, configReads }),
  };
}

test("config version comes from the CDN while immutable configuration requests are merged", async () => {
  const mock = fetchMock();
  const [a, b] = await Promise.all([
    loadDailyTaskConfig({}, "a", mock.fetchConfig),
    loadDailyTaskConfig({}, "b", mock.fetchConfig),
  ]);
  assert.equal(a, b);
  // One version.json read per call, but only one config.json download.
  assert.deepEqual(mock.reads(), { versionReads: 2, configReads: 1 });
});

test("failed config reads can be retried and unsafe versions are rejected", async () => {
  // A distinct version per test: configsByVersion is module-scoped and shared.
  const failingThenWorking = fetchMock({
    version: "test-config-retry",
    configResults: [
      { ok: false, json: async () => ({}) },
      { ok: true, json: async () => officialConfig() },
    ],
  });
  await assert.rejects(
    loadDailyTaskConfig({}, "a", failingThenWorking.fetchConfig),
    /读取失败/,
  );
  await loadDailyTaskConfig({}, "a", failingThenWorking.fetchConfig);
  assert.deepEqual(failingThenWorking.reads(), {
    versionReads: 2,
    configReads: 2,
  });
  const unsafe = fetchMock({ version: "../invalid" });
  await assert.rejects(
    loadDailyTaskConfig({}, "a", unsafe.fetchConfig),
    /有效/,
  );
});

test("duplicate point-reward IDs are rejected before duplicate claims can be scheduled", () => {
  for (const name of ["DayLimitConf", "WeekLimitConf"]) {
    const config = officialConfig();
    config[name][2].id = config[name][1].id;
    assert.throws(() => validateDailyTaskConfig(config), /无效/);
  }
});

test("an evicted failed config request cannot remove a newer cached request for a new version", async () => {
  let rejectFirst;
  let entered;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const versions = ["cache-race-a", "cache-race-b"];
  let versionCalls = 0;
  let configReadsA = 0;
  const fetchConfig = async (url) => {
    if (url.includes(VERSION_URL)) {
      const current = versions[Math.min(versionCalls, versions.length - 1)];
      versionCalls++;
      return { ok: true, json: async () => ({ version: current }) };
    }
    if (url.includes("cache-race-a") && ++configReadsA === 1) {
      entered();
      return new Promise((resolve, reject) => {
        rejectFirst = reject;
      });
    }
    return { ok: true, json: async () => officialConfig() };
  };
  const first = loadDailyTaskConfig({}, "a", fetchConfig);
  const rejected = assert.rejects(first, /first request failed/);
  await started;
  // A newer CDN version arrives while the first download is still pending.
  const second = await loadDailyTaskConfig({}, "a", fetchConfig);
  rejectFirst(new Error("first request failed"));
  await rejected;
  // The evicted failure must not drop the cached newer-version config.
  const third = await loadDailyTaskConfig({}, "a", fetchConfig);
  assert.equal(third, second);
  assert.equal(configReadsA, 1);
});
