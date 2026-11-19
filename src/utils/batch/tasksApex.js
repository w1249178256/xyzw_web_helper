/**
 * 逐鹿盐山竞猜任务
 * 包含: 一键批量竞猜（自动选助威最高队伍）
 *
 * 开放判定复用 utils/apexRules.js（1:1 移植客户端规则）：
 *   · 仅淘汰赛阶段（stage 4~10）且状态为 Unlocked / Locked 的场次可押；
 *   · 每阶段可押队伍数上限 = 该阶段 advanceNum（季军赛恒为 1）；
 *   · 分页 idx = 已加载条数，以响应 last 终止。
 */

import {
  ApexAction,
  apexCooldownLeft,
  isApexRateLimited,
  runApexAction,
} from "@/utils/apexRateLimit";
import {
  ApexScheduleStatus,
  calibrateServerTime,
  getAdvanceNum,
  getCurrentRounds,
  getCurrentSeason,
  getGuessTabs,
} from "@/utils/apexRules";

/** 单次请求超时（ms） */
const TIMEOUT_MS = 8000;

/** 单阶段分页拉取的最大页数（防御 last 异常导致死循环） */
const MAX_PAGES = 12;

/** 只读拉取遇到 200400 时的自动重试次数 */
const READ_MAX_RETRY = 1;

/**
 * 经自适应限流器发送一条 apex 命令。
 *
 * 服务器对 apex_* 有频控（200400「操作太快」），固定 sleep 无法适配真实冷却，
 * 统一走 utils/apexRateLimit.js：串行排队 + AIMD 自适应间隔。
 * @param {string} action 动作类型（ApexAction）
 * @param {Function} task 实际发送函数；入参为排队耗时（ms），应叠加到响应超时上
 * @param {number} [maxRetry] 200400 自动重试次数
 * @returns {Promise<*>} 命令响应
 */
const sendApex = (action, task, maxRetry) =>
  runApexAction(action, task, { maxRetry });

/**
 * 解析当前赛季「竞猜开放中」的阶段页签。
 *
 * 逐期扫描所有「进行中」的期（历史期已全部结束，不含开放场次）：
 * 报名期与淘汰赛期在时间上是重叠的，只取默认一期会漏掉另一期已开押的阶段
 * （例：第 5 期报名中、第 4 期淘汰赛已开押）。期号与阶段全部由配置推导。
 *
 * @param {number} nowMs 服务端时间
 * @returns {Array<{season: number, round: number, tabs: Array}>} 所有开放期次；无开放场次时为空数组
 */
const resolveOpenGuesses = (nowMs) => {
  const season = getCurrentSeason(nowMs);
  if (season <= 0) return [];
  const openRounds = [];
  for (const round of getCurrentRounds(season, nowMs)) {
    const tabs = getGuessTabs(round, season, nowMs).filter(
      (t) =>
        t.state === ApexScheduleStatus.Unlocked ||
        t.state === ApexScheduleStatus.Locked,
    );
    if (tabs.length) openRounds.push({ season, round, tabs });
  }
  return openRounds;
};

/**
 * 创建逐鹿盐山竞猜任务执行器
 * @param {object} deps - 依赖项
 * @returns {object} 任务函数集合
 */
/**
 * 赛事（逐鹿盐山）每周任务配置 —— 从客户端任务界面反推（2026-11-18 22:32 截图）：
 *   胜出1场 / 胜出2场 / 胜出4场 / 参与1次盐场 / 助威1次 / 活跃度50 / 活跃度100
 *
 * 注意 `taskProgress` 的 key 是「进度类型」，不是 confId：
 *   1 = 本周胜场数，2 = 本周活跃度，3 = 盐场参与次数，4 = 助威次数（没出现即 0）
 * 实测：活跃度 330 时 confId 4、5 可领（奖励 16001x5 / x10，与界面一致）；
 * 胜场 0 时 confId 2 会被服务端回 200020 —— 说明不能拿 progress[confId] 直接比。
 */
const APEX_TASK_RULES = [
  { confId: 1, name: "本周胜出1场", type: "1", need: 1 },
  { confId: 2, name: "本周胜出2场", type: "1", need: 2 },
  { confId: 3, name: "本周胜出4场", type: "1", need: 4 },
  { confId: 4, name: "本周活跃度50", type: "2", need: 50 },
  { confId: 5, name: "本周活跃度100", type: "2", need: 100 },
  { confId: 6, name: "参与1次盐场", type: "3", need: 1 },
  { confId: 7, name: "本周助威1次", type: "4", need: 1 },
];

export function createTasksApex(deps) {
  const {
    selectedTokens,
    tokens,
    tokenStatus,
    isRunning,
    shouldStop,
    ensureConnection,
    releaseConnectionSlot,
    connectionQueue,
    batchSettings,
    tokenStore,
    addLog,
    message,
    currentRunningTokenId,
  } = deps;

  /**
   * 一键批量逐鹿盐山竞猜
   * 自动选每组对阵中助威数最高的队伍
   */
  const batchApexGuess = async () => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        await ensureConnection(tokenId);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始逐鹿盐山竞猜: ${token.name} ===`,
          type: "info",
        });

        // 1. 获取角色信息（resetTime.day 用于服务端时间校准）
        const roleResp = await sendApex(
          ApexAction.READ,
          // 排队耗时补偿进超时：本命令排在串行链尾时，冷却等待会吃掉预算，
          // 不补偿就会出现「还没等到响应先报超时」的假故障
          (queuedMs) =>
            tokenStore.sendMessageWithPromise(
              tokenId,
              "apex_getroleinfo",
              {},
              TIMEOUT_MS + queuedMs,
            ),
          READ_MAX_RETRY,
        );
        const apexInfo = roleResp?.apexRoleInfo || {};
        const guessMap = apexInfo.guessMap || {};

        // 2. 依据真实规则解析当前开放的竞猜阶段
        const openRounds = resolveOpenGuesses(
          calibrateServerTime(Date.now(), apexInfo.resetTime?.day),
        );
        if (!openRounds.length) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 当前无开放的竞猜阶段（竞猜仅在淘汰赛段开放）`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        // 3. 逐阶段分页拉取对阵并竞猜
        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;
        /** 连续被 200400 打回后置位：中止该账号剩余竞猜，避免持续轰炸服务器 */
        let abortedByRateLimit = false;

        for (const open of openRounds) {
          if (shouldStop.value || abortedByRateLimit) break;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 第${open.season}赛季 第${open.round}期，开放竞猜 ${open.tabs.length} 个阶段`,
            type: "info",
          });
          for (const tab of open.tabs) {
            if (shouldStop.value) break;
            if (abortedByRateLimit) break;

            const advanceNum = getAdvanceNum(
              open.round,
              open.season,
              tab.stage,
            );
            const guessedTeamIds = new Set(guessMap[tab.scheduleId] || []);
            if (advanceNum > 0 && guessedTeamIds.size >= advanceNum) {
              skipCount++;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} ${tab.title} 已押满 ${advanceNum} 队，跳过`,
                type: "info",
              });
              continue;
            }

            // 分页拉取该阶段全部对阵：idx = 已加载条数，以 last 终止
            const allGroups = [];
            let last = false;
            for (let p = 0; p < MAX_PAGES && !last; p++) {
              if (shouldStop.value) break;
              const resp = await sendApex(
                ApexAction.READ,
                // 同上：分页循环每页都要重新等冷却，补偿后才不会误判超时
                (queuedMs) =>
                  tokenStore.sendMessageWithPromise(
                    tokenId,
                    "apex_getguesslist",
                    { scheduleId: tab.scheduleId, idx: allGroups.length },
                    TIMEOUT_MS + queuedMs,
                  ),
                READ_MAX_RETRY,
              );
              const groups = resp?.apexGuessList || [];
              if (groups.length === 0) break;
              allGroups.push(...groups);
              last = resp?.last === true;
            }

            if (allGroups.length === 0) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} ${tab.title} 没有对阵数据`,
                type: "warning",
              });
              continue;
            }
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${tab.title} 共 ${allGroups.length} 组对阵`,
              type: "info",
            });

            for (const group of allGroups) {
              if (shouldStop.value) break;
              if (abortedByRateLimit) break;
              if (advanceNum > 0 && guessedTeamIds.size >= advanceNum) break;

              const [team0, team1] = group;
              if (!team0 || !team1) continue;

              // 两队都已竞猜则跳过
              if (
                guessedTeamIds.has(team0.teamId) &&
                guessedTeamIds.has(team1.teamId)
              ) {
                skipCount++;
                continue;
              }

              // 选助威数更高的队伍
              let pick;
              if (guessedTeamIds.has(team0.teamId)) {
                pick = team1;
              } else if (guessedTeamIds.has(team1.teamId)) {
                pick = team0;
              } else {
                pick = team0.cheerCnt >= team1.cheerCnt ? team0 : team1;
              }

              try {
                await runApexAction(
                  ApexAction.GUESS,
                  (queuedMs) =>
                    tokenStore.sendMessageWithPromise(
                      tokenId,
                      "apex_guess",
                      { teamId: pick.teamId },
                      TIMEOUT_MS + queuedMs,
                    ),
                  {
                    // 等待服务器冷却时给出可见反馈，避免界面像卡死
                    onWait: (ms) =>
                      addLog({
                        time: new Date().toLocaleTimeString(),
                        message: `${token.name} 竞猜遇到服务器限流，等待 ${Math.ceil(ms / 1000)}s 后重试`,
                        type: "warning",
                      }),
                  },
                );
                guessedTeamIds.add(pick.teamId);
                successCount++;
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} ${tab.title} 竞猜 ${pick.name} (${pick.teamId}) 助威:${pick.cheerCnt} ✓`,
                  type: "success",
                });
              } catch (err) {
                failCount++;
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} ${tab.title} 竞猜 ${pick.name} 失败: ${err.message}`,
                  type: "error",
                });
                if (isApexRateLimited(err)) {
                  // 重试仍被限流：停止该账号后续竞猜，等待自适应间隔恢复
                  abortedByRateLimit = true;
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 连续被服务器限流（200400），约 ${Math.ceil(apexCooldownLeft(ApexAction.GUESS) / 1000)}s 后可继续，本次中止剩余竞猜`,
                    type: "warning",
                  });
                }
              }
            }
          }
        }

        if (abortedByRateLimit) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 因服务器限流提前结束，未完成部分稍后重跑即可续押`,
            type: "warning",
          });
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 竞猜完成: 成功${successCount} 跳过${skipCount} 失败${failCount} ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 逐鹿盐山竞猜失败: ${error.message}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);

    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量逐鹿盐山竞猜结束");
  };

  /**
   * 赛事每日任务领奖（apex_taskclaim）。
   *
   * 抓包（2026-11-18 22:15，账号 89072645）：
   *   apex_taskclaim { confId: 4 } → { reward:[{type:3,itemId:16001,value:5}],
   *                                   apexRoleInfo:{ taskClaimedMap:{"4":true}, voteItemCnt:50 } }
   *   apex_getroleinfo {}          → apexRoleInfo.taskClaimedMap / taskProgress / resetTime.day
   *
   * 任务配置表不在本地，confId 只能按序号尝试；已领/未完成都会返回错误码，
   * 这里按文案区分「跳过」和「失败」，不会中断其它任务。
   */
  const batchApexClaimTasks = async () => {
    if (isRunning.value || selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    const label = "领取赛事每日奖励";

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;
      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);
      if (!token) {
        tokenStatus.value[tokenId] = "failed";
        return;
      }

      const log = (text, type = "info") =>
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name}: ${text}`,
          type,
        });

      try {
        await ensureConnection(tokenId);

        // 1) 已领取状态 + 进度（resetTime.day 也用于时间校准）
        const roleResp = await sendApex(ApexAction.READ, (queuedMs) =>
          tokenStore.sendMessageWithPromise(
            tokenId,
            "apex_getroleinfo",
            {},
            TIMEOUT_MS + queuedMs,
          ),
        );
        const apexInfo = roleResp?.apexRoleInfo || {};
        const claimed = apexInfo.taskClaimedMap || {};
        const progress = apexInfo.taskProgress || {};
        log(
          `赛事任务进度 ${JSON.stringify(apexInfo.taskProgress || {})}｜已领取 ${
            Object.keys(claimed).join(",") || "无"
          }`,
        );

        let got = 0;
        for (const rule of APEX_TASK_RULES) {
          const confId = rule.confId;
          if (shouldStop.value) break;
          if (claimed[String(confId)]) {
            log(`任务 ${confId}（${rule.name}）已领取，跳过`);
            continue;
          }
          // 只领真正达标的：进度取自 taskProgress[进度类型]，不是 taskProgress[confId]
          const value = Number(progress[rule.type] || 0);
          if (value < rule.need) {
            log(
              `任务 ${confId}（${rule.name}）未达成：${value}/${rule.need}，跳过`,
            );
            continue;
          }
          try {
            const res = await sendApex(ApexAction.READ, (queuedMs) =>
              tokenStore.sendMessageWithPromise(
                tokenId,
                "apex_taskclaim",
                { confId },
                TIMEOUT_MS + queuedMs,
              ),
            );
            const rewards = res?.reward || [];
            if (rewards.length) {
              got += 1;
              claimed[String(confId)] = true;
              log(
                `任务 ${confId}（${rule.name}）领取成功：${rewards
                  .map((item) => `${item.itemId}x${item.value}`)
                  .join(" ")}`,
                "success",
              );
            } else {
              log(`任务 ${confId} 已处理（无可领奖励）`, "warning");
            }
          } catch (error) {
            const text = String(error.message || error);
            const code = Number(error.code) || 0;
            const clean = text.replace(/^服务器错误:\s*\d+\s*-\s*/, "");
            if (code === 200020) {
              // 服务端把“条件未满足”也回成 200020（出了点小问题），当软失败处理
              log(`任务 ${confId} 未达领取条件（200020），跳过`, "warning");
            } else if (
              /已领取|已经领取|已完成|不存在|未完成|未达成|不满足|条件|不足/.test(
                text,
              )
            ) {
              log(`任务 ${confId} 暂不可领：${clean}`);
            } else {
              log(
                `任务 ${confId} 领取失败${code ? `（${code}）` : ""}：${clean}`,
                "error",
              );
            }
          }
          // apex_* 有频控（200400 操作太快），逐条之间留间隔
          await new Promise((resolve) => setTimeout(resolve, 700));
        }

        tokenStatus.value[tokenId] = "completed";
        log(
          got ? `领取完成，共 ${got} 个任务奖励` : "没有可领取的任务奖励",
          got ? "success" : "warning",
        );
      } catch (error) {
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} ${label}失败: ${error.message || "未知错误"}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    try {
      await Promise.all(taskPromises);
    } finally {
      isRunning.value = false;
      currentRunningTokenId.value = null;
    }
    message.success(`批量${label}结束`);
  };

  /**
   * 一键助威：给「第1组票数第1名」的队伍投出全部剩余助威票。
   *
   * 抓包（2026-11-18 22:38，账号 89072645）：
   *   apex_getvotelist { groupId:1, idx:0, round:7 }
   *     → apexVoteList:[{ teamId:"A10000409", name:"助威别投", cheerCnt, power, isOut... }]
   *   apex_vote { teamId:"A10000409", round:7, voteCnt:30 }
   *     → { apexRoleInfo:{ voteMap:{ "7":{ "A10000409":{cnt:30} } }, taskProgress:{"4":1}, voteItemCnt:0 },
   *         newVoteCnt:15970544, reward:[ 1006x150, 0x100, 1022x20, 1003x40, 1016x40 ] }
   * 助威会消耗全部余票（voteItemCnt），并把「本周助威1次」的进度 taskProgress["4"] 置 1。
   */
  const batchApexVote = async (rank = 1) => {
    if (isRunning.value || selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    const label = "一键助威";

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;
      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);
      if (!token) {
        tokenStatus.value[tokenId] = "failed";
        return;
      }

      const log = (text, type = "info") =>
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name}: ${text}`,
          type,
        });

      try {
        await ensureConnection(tokenId);

        const roleResp = await sendApex(
          ApexAction.READ,
          (queuedMs) =>
            tokenStore.sendMessageWithPromise(
              tokenId,
              "apex_getroleinfo",
              {},
              TIMEOUT_MS + queuedMs,
            ),
          READ_MAX_RETRY,
        );
        const apexInfo = roleResp?.apexRoleInfo || {};
        const votes = Number(apexInfo.voteItemCnt || 0);
        log(`本周剩余助威票 ${votes}`);
        if (votes <= 0) {
          tokenStatus.value[tokenId] = "completed";
          log("没有助威票，跳过", "warning");
          return;
        }

        const nowMs = calibrateServerTime(Date.now(), apexInfo.resetTime?.day);
        const season = getCurrentSeason(nowMs);
        const rounds = getCurrentRounds(season, nowMs);
        if (!rounds.length) {
          tokenStatus.value[tokenId] = "completed";
          log("当前没有进行中的赛段，跳过", "warning");
          return;
        }

        // 逐个赛期试第1组，取第一个有队伍的
        let picked = null;
        for (const round of rounds) {
          if (shouldStop.value) break;
          const resp = await sendApex(ApexAction.VOTE, (queuedMs) =>
            tokenStore.sendMessageWithPromise(
              tokenId,
              "apex_getvotelist",
              { groupId: 1, idx: 0, round },
              TIMEOUT_MS + queuedMs,
            ),
          );
          const teams = resp?.apexVoteList || [];
          if (teams.length) {
            picked = { round, teams };
            break;
          }
        }
        if (!picked) {
          tokenStatus.value[tokenId] = "completed";
          log("第1组当前没有可助威的队伍", "warning");
          return;
        }

        // 按票数倒序，取用户选的第 N 名（默认第 1 名）
        const ranked = [...picked.teams].sort(
          (a, b) => Number(b.cheerCnt || 0) - Number(a.cheerCnt || 0),
        );
        const wantIndex = Math.max(1, Number(rank) || 1) - 1;
        const target = ranked[wantIndex] || ranked[0];
        if (wantIndex + 1 > ranked.length) {
          log(
            `第${wantIndex + 1}名不存在（第1组只有 ${ranked.length} 支），改投第1名`,
            "warning",
          );
        }
        log(
          `第${picked.round}期 第1组第${ranked.indexOf(target) + 1}名：${target.name}（票数 ${target.cheerCnt}），投入 ${votes} 票`,
        );

        const res = await sendApex(ApexAction.VOTE, (queuedMs) =>
          tokenStore.sendMessageWithPromise(
            tokenId,
            "apex_vote",
            { teamId: target.teamId, round: picked.round, voteCnt: votes },
            TIMEOUT_MS + queuedMs,
          ),
        );
        const rewards = res?.reward || [];
        const rewardText = rewards.length
          ? `｜奖励 ${rewards.map((item) => `${item.itemId}x${item.value}`).join(" ")}`
          : "";
        tokenStatus.value[tokenId] = "completed";
        log(
          `助威成功，队伍总票数 → ${res?.newVoteCnt ?? "?"}${rewardText}`,
          "success",
        );
      } catch (error) {
        const text = String(error.message || error);
        const code = Number(error.code) || 0;
        tokenStatus.value[tokenId] = "failed";
        if (code === 200400) {
          log(`操作过快被限流（200400），稍后再试`, "warning");
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} ${label}失败: ${text}`,
            type: "error",
          });
        }
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    try {
      await Promise.all(taskPromises);
    } finally {
      isRunning.value = false;
      currentRunningTokenId.value = null;
    }
    message.success(`批量${label}结束`);
  };

  return {
    batchApexGuess,
    batchApexClaimTasks,
    batchApexVote,
  };
}
