import assert from "node:assert/strict";
import { test } from "node:test";
import * as stateHelpers from "../src/utils/dailyTaskState.js";
import { loadModule } from "./helpers/loadModule.js";

const { DailyTaskRunner } = await loadModule(
  new URL("../src/utils/dailyTaskRunner.js", import.meta.url),
  { "@/utils/dailyTaskState": stateHelpers },
);
const definitions = [
  [1, 1, 1],
  [2, 2, 1],
  [3, 3, 3],
  [4, 4, 2],
  [5, 5, 5],
  [6, 6, 3],
  [7, 7, 3],
  [8, 13, 1],
  [9, 12, 1],
  [10, 14, 1],
].map(([id, completeCondition, completeValue]) => ({
  id,
  completeCondition,
  completeValue,
}));
const config = {
  tasks: definitions,
  dailyRewards: [
    { id: 1, limit: 20 },
    { id: 2, limit: 40 },
  ],
  weeklyRewards: [
    { id: 1, limit: 100 },
    { id: 2, limit: 200 },
  ],
};
const settings = {
  arenaFormation: 1,
  bossFormation: 1,
  payRecruit: true,
  claimHangUp: false,
  openBox: true,
  arenaEnable: false,
  claimBottle: false,
  claimEmail: false,
  blackMarketPurchase: true,
  bossTimes: 0,
  freeGachaEnable: false,
};
function fixture(progress = {}) {
  const calls = [];
  let connected = true;
  let readFailure = false;
  const role = {
    dailyTask: {
      dailyTime: 1700000000,
      complete: {
        ...Object.fromEntries(
          definitions.map((d) => [d.completeCondition, -1]),
        ),
        ...progress,
      },
      dailyPoint: 0,
      dailyReward: {},
      weekPoint: 0,
      weekReward: {},
    },
    statistics: {
      "artifact:normal:lottery:time": 1700000010,
      "genie:sweep:buy": 3,
    },
    statisticsTime: {
      "genie:sweep:buy": 1700000010,
      "legion:sign:in": 1700000010,
      ...Object.fromEntries(
        [1, 2, 3, 4, 5].map((id) => [`genie:daily:free:${id}`, 1700000010]),
      ),
    },
  };
  const store = {
    gameTokens: [{ id: "account-a", name: "Test account" }],
    getWebSocketStatus: () => (connected ? "connected" : "disconnected"),
    async sendGetRoleInfo() {
      calls.push({ cmd: "role_getroleinfo" });
      if (readFailure) throw new Error("Cannot read server state");
      return { role: structuredClone(role) };
    },
    async sendMessageWithPromise(id, cmd, params) {
      calls.push({ cmd, params });
      if (cmd === "presetteam_getinfo")
        return { presetTeamInfo: { useTeamId: 1 } };
      if (cmd === "arena_getareatarget")
        return { roleList: [{ roleId: 999 }] };
      if (cmd === "fight_startareaarena") {
        role.statistics["area:arena:reward:cnt"] =
          (role.statistics["area:arena:reward:cnt"] || 0) + 1;
        role.statisticsTime["area:arena:reward:cnt"] = 1700000010;
        role.dailyTask.complete[13] =
          (role.dailyTask.complete[13] === -1
            ? -1
            : (role.dailyTask.complete[13] || 0) + 1);
      }
      if (cmd === "system_buygold") role.dailyTask.complete[6]++;
      if (cmd === "item_openbox") role.dailyTask.complete[7] += params.number;
      if (cmd === "hero_recruit")
        role.dailyTask.complete[4] += params.recruitNumber;
      if (cmd === "task_claimdailypoint") {
        const definition = definitions.find((d) => d.id === params.taskId);
        role.dailyTask.complete[definition.completeCondition] = -1;
        role.dailyTask.dailyPoint += 5;
      }
      if (cmd === "task_claimdailyreward")
        role.dailyTask.dailyReward[params.rewardId] = true;
      if (cmd === "task_claimweekreward")
        role.dailyTask.weekReward[params.rewardId] = true;
      return {};
    },
  };
  const runner = () =>
    new DailyTaskRunner(
      store,
      { commandDelay: 0, taskDelay: 0 },
      {
        loadConfig: async () => config,
        sleep: async () => {},
      },
    );
  return {
    role,
    calls,
    store,
    runner,
    disconnect: () => {
      connected = false;
    },
    reconnect: () => {
      connected = true;
    },
    failReads: () => {
      readFailure = true;
    },
  };
}

test("completed-but-unclaimed tasks only claim their configured task IDs", async () => {
  const f = fixture({ 6: 3, 7: 20, 12: 1 });
  await f.runner().run("account-a", {}, settings);
  assert.equal(
    f.calls.filter((c) =>
      ["system_buygold", "item_openbox", "store_purchase"].includes(c.cmd),
    ).length,
    0,
  );
  assert.deepEqual(
    f.calls
      .filter((c) => c.cmd === "task_claimdailypoint")
      .map((c) => c.params.taskId),
    [6, 7, 9],
  );
});

test("partial progress skips completed actions and preserves the original box batch", async () => {
  const f = fixture({ 6: 2, 7: 2 });
  const result = await f.runner().run("account-a", {}, settings);
  assert.equal(f.calls.filter((c) => c.cmd === "system_buygold").length, 1);
  assert.equal(f.calls.find((c) => c.cmd === "item_openbox").params.number, 10);
  assert.equal(result.deferred, 0);
});

test("a new runner skips claimed actions using new server data, without local progress", async () => {
  const f = fixture({ 6: 2 });
  await f.runner().run("account-a", {}, settings);
  f.calls.length = 0;
  await f.runner().run("account-a", {}, settings);
  assert.equal(
    f.calls.filter(
      (c) => c.cmd === "system_buygold" || c.cmd === "task_claimdailypoint",
    ).length,
    0,
  );
  assert.ok(f.calls.some((c) => c.cmd === "role_getroleinfo"));
});

test("a successful write followed by disconnect does not cause replay on reconnect", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  let interrupted = false;
  f.store.sendMessageWithPromise = async (...args) => {
    const result = await send(...args);
    if (args[1] === "system_buygold" && !interrupted) {
      interrupted = true;
      f.disconnect();
    }
    return result;
  };
  await assert.rejects(
    f.runner().run("account-a", {}, settings),
    /WebSocket 已断开/,
  );
  f.reconnect();
  await f.runner().run("account-a", {}, settings);
  assert.equal(f.calls.filter((c) => c.cmd === "system_buygold").length, 1);
  assert.equal(
    f.calls.filter((c) => c.cmd === "task_claimdailypoint").length,
    1,
  );
});

test("a transport failure before execution leaves the server deficit available on retry", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  let failed = false;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "system_buygold" && !failed) {
      failed = true;
      throw new Error("Network timeout");
    }
    return send(...args);
  };
  await assert.rejects(
    f.runner().run("account-a", {}, settings),
    /Network timeout/,
  );
  await f.runner().run("account-a", {}, settings);
  assert.equal(f.calls.filter((c) => c.cmd === "system_buygold").length, 1);
});

test("failed phase verification prevents all reward claims", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    const result = await send(...args);
    if (args[1] === "system_buygold") f.failReads();
    return result;
  };
  await assert.rejects(
    f.runner().run("account-a", {}, settings),
    /Cannot read server state/,
  );
  assert.equal(f.calls.filter((c) => c.cmd === "system_buygold").length, 1);
  assert.equal(
    f.calls.filter((c) => c.cmd === "task_claimdailypoint").length,
    0,
  );
});

test("server day rollover stops the old run instead of assuming its tasks are complete", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    const result = await send(...args);
    if (args[1] === "system_buygold") f.role.dailyTask.dailyTime++;
    return result;
  };
  await assert.rejects(
    f.runner().run("account-a", {}, settings),
    /服务器每日任务已重置/,
  );
  assert.equal(
    f.calls.filter((c) => c.cmd === "task_claimdailypoint").length,
    0,
  );
});

test("point rewards only include server-confirmed eligible unclaimed IDs", async () => {
  const f = fixture();
  f.role.dailyTask.dailyPoint = 40;
  f.role.dailyTask.dailyReward[1] = true;
  f.role.dailyTask.weekPoint = 150;
  await f.runner().run("account-a", {}, settings);
  assert.deepEqual(
    f.calls
      .filter((c) => c.cmd === "task_claimdailyreward")
      .map((c) => c.params.rewardId),
    [2],
  );
  assert.deepEqual(
    f.calls
      .filter((c) => c.cmd === "task_claimweekreward")
      .map((c) => c.params.rewardId),
    [1],
  );
});

test("stopping and missing server task data produce no game writes", async () => {
  const f = fixture();
  await assert.rejects(
    f.runner().run("account-a", { shouldStop: () => true }, settings),
    /任务已停止/,
  );
  assert.equal(f.calls.length, 0);
  delete f.role.dailyTask.complete;
  await assert.rejects(f.runner().run("account-a", {}, settings), /列表不完整/);
  assert.equal(f.calls.filter((c) => c.cmd !== "role_getroleinfo").length, 0);
});

test("a command acknowledgement without changed server progress is not completion", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    const result = await send(...args);
    if (args[1] === "system_buygold") f.role.dailyTask.complete[6] = 2;
    return result;
  };
  const result = await f.runner().run("account-a", {}, settings);
  assert.equal(result.deferred, 1);
  assert.equal(
    f.calls.filter((c) => c.cmd === "task_claimdailypoint").length,
    0,
  );
});

test("lost acknowledgement after server execution is resolved by a fresh list on retry", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  let failed = false;
  f.store.sendMessageWithPromise = async (...args) => {
    const result = await send(...args);
    if (args[1] === "system_buygold" && !failed) {
      failed = true;
      throw new Error("Acknowledgement lost");
    }
    return result;
  };
  await assert.rejects(
    f.runner().run("account-a", {}, settings),
    /Acknowledgement lost/,
  );
  await f.runner().run("account-a", {}, settings);
  assert.equal(f.calls.filter((c) => c.cmd === "system_buygold").length, 1);
});

test("a role response arriving after disconnect is discarded before game operations", async () => {
  const f = fixture({ 6: 2 });
  const read = f.store.sendGetRoleInfo;
  f.store.sendGetRoleInfo = async () => {
    const response = await read();
    f.disconnect();
    return response;
  };
  await assert.rejects(
    f.runner().run("account-a", {}, settings),
    /WebSocket 已断开/,
  );
  assert.equal(f.calls.filter((c) => c.cmd !== "role_getroleinfo").length, 0);
});

test("different accounts are judged by their own server response", async () => {
  const a = fixture();
  const b = fixture({ 6: 2 });
  await Promise.all([
    a.runner().run("account-a", {}, settings),
    b.runner().run("account-b", {}, settings),
  ]);
  assert.equal(a.calls.filter((c) => c.cmd === "system_buygold").length, 0);
  assert.equal(b.calls.filter((c) => c.cmd === "system_buygold").length, 1);
});

test("two entry points cannot execute the same account concurrently", async () => {
  const f = fixture();
  const original = f.store.sendGetRoleInfo;
  let release;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  let entered;
  const reading = new Promise((resolve) => {
    entered = resolve;
  });
  f.store.sendGetRoleInfo = async () => {
    entered();
    await blocked;
    return original();
  };
  const first = f.runner().run("account-a", {}, settings);
  await reading;
  await assert.rejects(f.runner().run("account-a", {}, settings), /正在执行中/);
  release();
  await first;
});

test("used free recruitment is not repeated when only one server recruitment remains", async () => {
  const f = fixture({ 4: 1 });
  f.role.statistics["recruit:one:free"] = f.role.dailyTask.dailyTime + 10;
  await f.runner().run("account-a", {}, settings);
  const recruitment = f.calls.filter((call) => call.cmd === "hero_recruit");
  assert.equal(recruitment.length, 1);
  assert.equal(recruitment[0].params.recruitType, 1);
  assert.equal(recruitment[0].params.recruitNumber, 1);
});

test("disabled actions remain visibly unfinished according to the server", async () => {
  const f = fixture({ 5: 2 });
  const result = await f.runner().run("account-a", {}, settings);
  assert.equal(result.remainingTasks, 1);
  assert.equal(result.unclaimedTasks, 0);
  assert.equal(
    f.calls.filter((call) => call.cmd === "system_claimhangupreward").length,
    0,
  );
});

test("claimed tasks do not cause one role query per skipped reward", async () => {
  const f = fixture();
  await f.runner().run("account-a", {}, settings);
  assert.equal(f.calls.filter((c) => c.cmd === "role_getroleinfo").length, 3);
});

test("server-claimed sign-in, cards and free gacha are not requested again", async () => {
  const f = fixture();
  const stamp = f.role.dailyTask.dailyTime + 10;
  f.role.signInReward = { 1: stamp };
  f.role.cardTime = {
    1: { lastClaimTime: stamp },
    4003: { lastClaimTime: stamp },
  };
  f.role.statistics["gacha:free"] = stamp;
  await f.runner().run("account-a", {}, { ...settings, freeGachaEnable: true });
  for (const cmd of [
    "system_signinreward",
    "card_claimreward",
    "gacha_drawreward",
  ])
    assert.equal(f.calls.filter((c) => c.cmd === cmd).length, 0);
  assert.equal(
    f.calls.filter((c) => c.cmd === "collection_claimfreereward").length,
    1,
  );
});

test("a failed formation query never triggers a forced switch", async () => {
  const f = fixture();
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "presetteam_getinfo") throw new Error("Network timeout");
    return send(...args);
  };
  await assert.rejects(
    f.runner().switchToFormationIfNeeded("account-a", 2, "Test"),
    /Network timeout/,
  );
  assert.equal(
    f.calls.filter((c) => c.cmd === "presetteam_saveteam").length,
    0,
  );
});

test("unchanged formations are not queried again just to restore them", async () => {
  const f = fixture();
  await f.runner().run("account-a", {}, settings);
  assert.equal(f.calls.filter((c) => c.cmd === "presetteam_getinfo").length, 1);
  assert.equal(
    f.calls.filter((c) => c.cmd === "presetteam_saveteam").length,
    0,
  );
});

test("hang-up resumes from the server deficit and never substitutes share commands", async () => {
  const f = fixture({ 5: 3 });
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    const result = await send(...args);
    if (args[1] === "system_claimhangupreward") f.role.dailyTask.complete[5]++;
    return result;
  };
  const progress = [];
  await f
    .runner()
    .run(
      "account-a",
      { onProgress: (value) => progress.push(value) },
      { ...settings, claimHangUp: true },
    );
  assert.equal(
    f.calls.filter((c) => c.cmd === "system_claimhangupreward").length,
    2,
  );
  assert.equal(
    f.calls.filter((c) => c.cmd === "system_mysharecallback").length,
    0,
  );
  assert.equal(f.role.dailyTask.complete[5], -1);
  assert.deepEqual(progress, [90, 100]);
  f.calls.length = 0;
  await f.runner().run("account-a", {}, { ...settings, claimHangUp: true });
  assert.equal(
    f.calls.filter((c) => c.cmd === "system_claimhangupreward").length,
    0,
  );
});

test("three unfinished gold operations do not query role info between actions", async () => {
  const f = fixture({ 6: 0 });
  await f.runner().run("account-a", {}, settings);
  const gold = f.calls
    .map((c, i) => (c.cmd === "system_buygold" ? i : -1))
    .filter((i) => i >= 0);
  assert.equal(gold.length, 3);
  assert.equal(
    f.calls
      .slice(gold[0] + 1, gold[2])
      .filter((c) => c.cmd === "role_getroleinfo").length,
    0,
  );
  assert.equal(f.calls.filter((c) => c.cmd === "role_getroleinfo").length, 4);
});

test("rate limits stop once without retries, polling or subsequent writes", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  let attempts = 0;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "system_buygold") {
      attempts++;
      throw new Error("200400 操作太快");
    }
    return send(...args);
  };
  await assert.rejects(f.runner().run("account-a", {}, settings), /200400/);
  assert.equal(attempts, 1);
  assert.equal(f.calls.filter((c) => c.cmd === "role_getroleinfo").length, 1);
  assert.equal(
    f.calls.filter((c) => c.cmd === "task_claimdailypoint").length,
    0,
  );
});

test("a failed initial query is not retried and does not start game operations", async () => {
  const f = fixture();
  let reads = 0;
  f.store.sendGetRoleInfo = async (id, params, retryCount) => {
    assert.equal(retryCount, 2);
    reads++;
    throw new Error("200400 操作太快");
  };
  await assert.rejects(f.runner().run("account-a", {}, settings), /200400/);
  assert.equal(reads, 1);
  assert.equal(f.calls.length, 0);
});

test("free and paid recruitment together never exceed the initial server deficit", async () => {
  const f = fixture({ 4: 0 });
  await f.runner().run("account-a", {}, settings);
  const calls = f.calls.filter((c) => c.cmd === "hero_recruit");
  assert.equal(calls.length, 2);
  assert.equal(
    calls.reduce((total, c) => total + c.params.recruitNumber, 0),
    2,
  );
});

test("an explicit unavailable-card response does not interrupt remaining daily tasks", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "card_claimreward")
      throw new Error("服务器错误: 1400010 - 没有购买月卡");
    return send(...args);
  };
  await f.runner().run("account-a", {}, settings);
  assert.equal(f.role.dailyTask.complete[6], -1);
});

test("box business error 400122 fails only that task and leaves it pending on the server", async () => {
  const f = fixture({ 7: 0 });
  const send = f.store.sendMessageWithPromise;
  let boxRequests = 0;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "item_openbox") {
      boxRequests++;
      assert.equal(args[2].itemId, 2001);
      assert.equal(args[2].number, 10);
      throw new Error("服务器错误: 400122 - 未知错误");
    }
    return send(...args);
  };
  const result = await f.runner().run("account-a", {}, settings);
  assert.equal(boxRequests, 1);
  assert.ok(f.calls.some((c) => c.cmd === "presetteam_getinfo"));
  assert.equal(f.role.dailyTask.complete[7], 0);
  assert.equal(result.failed, 1);
  assert.equal(result.remainingTasks, 1);
  assert.equal(result.incomplete, 1);
  assert.equal(
    f.calls.filter(
      (c) => c.cmd === "task_claimdailypoint" && c.params.taskId === 7,
    ).length,
    0,
  );
});

test("logs update execution immediately and only confirm completion from server checkpoints", async () => {
  const f = fixture({ 6: 2 });
  const logs = [];
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "system_buygold") {
      assert.ok(logs.some((log) => log.includes("执行中: 免费点金")));
      assert.ok(!logs.some((log) => log.includes("点金: 3/3")));
    }
    return send(...args);
  };
  await f
    .runner()
    .run("account-a", { onLog: (log) => logs.push(log.message) }, settings);
  const initial = logs.findIndex((log) => log.includes("点金: 2/3 · 未完成"));
  const claimable = logs.findIndex((log) =>
    log.includes("点金: 3/3 · 已完成，待领奖"),
  );
  const claimed = logs.findIndex((log) =>
    log.includes("点金: 3/3 · 已完成并领奖"),
  );
  assert.ok(initial >= 0 && claimable > initial && claimed > claimable);
  assert.ok(logs.some((log) => log.includes("请求成功，待服务器确认任务状态")));
  assert.ok(logs.some((log) => log.includes("本轮步骤处理进度:")));
  assert.equal(f.calls.filter((c) => c.cmd === "role_getroleinfo").length, 4);
});

test("already completed actions omitted from the plan still appear as skipped in logs", async () => {
  const f = fixture();
  const logs = [];
  await f
    .runner()
    .run("account-a", { onLog: (log) => logs.push(log.message) }, settings);
  assert.equal(
    logs.filter((log) => log === "点金: 3/3 · 已完成并领奖，跳过").length,
    1,
  );
  assert.ok(!logs.some((log) => log.includes("执行中: 免费点金")));
  assert.equal(f.calls.filter((c) => c.cmd === "role_getroleinfo").length, 3);
});

test("a reward acknowledgement without a server claim remains pending in the final result", async () => {
  const f = fixture();
  f.role.dailyTask.dailyPoint = 40;
  f.role.dailyTask.weekPoint = 100;
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    if (["task_claimdailyreward", "task_claimweekreward"].includes(args[1]))
      return {};
    return send(...args);
  };
  const result = await f.runner().run("account-a", {}, settings);
  assert.equal(result.remainingRewards, 3);
  assert.equal(result.incomplete, 3);
});

test("arena runs all 3 free fights when none have been done today", async () => {
  const arenaSettings = { ...settings, arenaEnable: true };
  const f = fixture({ 13: 0 }); // condition 13 未完成
  // area:arena:reward:cnt 不存在 → 今日0次
  const result = await f.runner().run("account-a", {}, arenaSettings);
  const arenaCalls = f.calls.filter((c) => c.cmd === "fight_startareaarena");
  assert.equal(arenaCalls.length, 3, "免费3次全部打出");
  assert.equal(result.failed, 0);
});

test("arena skips if all 3 free fights already done today", async () => {
  const arenaSettings = { ...settings, arenaEnable: true };
  const f = fixture({ 13: -1 }); // condition 13 已领奖
  f.role.statistics["area:arena:reward:cnt"] = 3;
  f.role.statisticsTime["area:arena:reward:cnt"] = 1700000010; // 在 dailyTime 之后
  const result = await f.runner().run("account-a", {}, arenaSettings);
  const arenaCalls = f.calls.filter((c) => c.cmd === "fight_startareaarena");
  assert.equal(arenaCalls.length, 0, "今日已打满3次，不应再发起战斗");
  assert.equal(result.failed, 0);
});

test("arena runs only remaining free fights when 1 already done today", async () => {
  const arenaSettings = { ...settings, arenaEnable: true };
  const f = fixture({ 13: 1 }); // condition 13 已打1次未领奖
  f.role.statistics["area:arena:reward:cnt"] = 1;
  f.role.statisticsTime["area:arena:reward:cnt"] = 1700000010;
  const result = await f.runner().run("account-a", {}, arenaSettings);
  const arenaCalls = f.calls.filter((c) => c.cmd === "fight_startareaarena");
  assert.equal(arenaCalls.length, 2, "今日已打1次，应补足剩余2次");
  assert.equal(result.failed, 0);
});

test("pending counts include distinct supplemental failures without counting a failed daily goal twice", async () => {
  const f = fixture({ 6: 2 });
  const send = f.store.sendMessageWithPromise;
  f.store.sendMessageWithPromise = async (...args) => {
    if (args[1] === "system_buygold")
      throw new Error("服务器错误: 400010 - 物品不足");
    if (args[1] === "discount_claimreward")
      throw new Error("服务器错误: 1000020 - 今天已经领取过奖励了");
    return send(...args);
  };
  const result = await f.runner().run("account-a", {}, settings);
  assert.equal(result.failed, 2);
  assert.equal(result.remainingTasks, 1);
  assert.equal(result.incomplete, 2);
});
