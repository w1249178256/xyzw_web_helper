import { runWithDailyTaskLock } from "@/utils/dailyTaskState";
/**
 * 十殿罗盘（Nightmare）周奖励一键领取
 *
 * 协议来自实机抓包（2026-11-17 / 11-25）：
 *   nightmare_getroleinfo {}        → { weekAward:{ maxLevel, levelReward, turntableReward, turntableCnt, turntableLeftCnt }, nightMareData:{ turnRewardTime, ... } }
 *   nightmare_claimweekreward {}    → 领取本周铃铛（8 组 1037x5），回执带 weekAward.turntableLeftCnt = 8
 *   nightmare_clickturntable {}     → roll 一次，回执给 reward + confIdList，turntableLeftCnt 递减
 *   nightmare_claimturnrewardtimes {} → 领取额外次数，**回执复用 clickturntableresp**，turntableLeftCnt +1
 *
 * 流程：领铃铛 → 把剩余次数全部 roll 掉 → 尝试领额外次数 → 领到就继续 roll → 领不到就结束。
 * 判定完全以服务端回执为准，不硬编码“5 次”规则（服务端拒绝就当成没有可领次数）。
 */
import { formatRewardNames } from "@/utils/itemNames";

/** 单次 roll 之间的间隔（ms）。实测服务端没有强制 CD，界面那圈是纯客户端动画 */
const ROLL_DELAY_MS = 1000;

/** 外层循环上限，防止服务端异常时死循环 */
const MAX_TURNS = 30;

/** 去掉 "服务器错误: 12345 - " 前缀，只留服务端文案 */
function shortError(error) {
  return String(error?.message || error).replace(
    /^服务器错误:\s*\d+\s*-\s*/,
    "",
  );
}

/**
 * 创建十殿奖励任务执行器
 * @param {object} deps - 批量任务依赖
 * @returns {object} 任务函数集合
 */
export function createTasksNightmareReward(deps) {
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
   * 一键领取十殿奖励：领铃铛 → roll → 领额外次数 → 继续 roll → 结束
   * @returns {Promise<void>} 全部账号处理完或用户停止后 resolve
   */
  const batchNightmareReward = async () => {
    if (isRunning.value || selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    const label = "十殿奖励";

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;
      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);
      const log = (text, type = "info") =>
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token?.name || tokenId}: ${text}`,
          type,
        });

      let ownsSlot = false;
      try {
        await runWithDailyTaskLock(tokenId, async () => {
          await ensureConnection(tokenId, 2, (owned) => {
            ownsSlot = owned;
          });

          const send = (cmd, params = {}, timeout = 12000) =>
            tokenStore.sendMessageWithPromise(tokenId, cmd, params, timeout);
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

          // 1) 先读一次状态，拿到剩余次数与已 roll 记录
          let left = 0;
          try {
            const info = await send("nightmare_getroleinfo", {});
            left = Number(info?.weekAward?.turntableLeftCnt ?? 0);
            const rolled = Object.keys(
              info?.weekAward?.turntableReward || {},
            ).length;
            log(`当前状态：剩余 ${left} 次，本周已 roll ${rolled} 次`);
          } catch (error) {
            log(`读取十殿状态失败：${shortError(error)}`, "warning");
          }

          // 2) 领铃铛（本周已领会报错，按“已领过”处理）
          try {
            const res = await send("nightmare_claimweekreward", {});
            left = Number(res?.weekAward?.turntableLeftCnt ?? left);
            log(
              `领取铃铛：${formatRewardNames(res?.reward)}｜可 roll ${left} 次`,
              "success",
            );
          } catch (error) {
            log(`铃铛未领取：${shortError(error)}`);
          }

          // 3) roll + 领次数的循环
          let rolls = 0;
          let extraTurns = 0;
          for (let turn = 0; turn < MAX_TURNS; turn++) {
            if (shouldStop.value) break;

            while (left > 0 && !shouldStop.value) {
              try {
                const res = await send("nightmare_clickturntable", {});
                left = Number(res?.weekAward?.turntableLeftCnt ?? left - 1);
                rolls += 1;
                const conf =
                  res?.confIdList && res.confIdList.length
                    ? `（conf ${res.confIdList.join(",")}）`
                    : "";
                log(
                  `Roll #${rolls}${conf}：${formatRewardNames(res?.reward)}｜剩余 ${left}`,
                );
              } catch (error) {
                log(`Roll 失败：${shortError(error)}`, "warning");
                left = 0;
                break;
              }
              await sleep(ROLL_DELAY_MS);
            }

            if (shouldStop.value || left > 0) break;

            // 4) 尝试领取额外次数；服务端拒绝就说明没有可领的了
            try {
              const res = await send("nightmare_claimturnrewardtimes", {});
              const newLeft = Number(
                res?.weekAward?.turntableLeftCnt ?? left + 1,
              );
              extraTurns += 1;
              log(
                `领取额外次数：${formatRewardNames(res?.reward)}｜可 roll ${newLeft} 次`,
                "success",
              );
              left = newLeft;
              if (left <= 0) break;
            } catch (error) {
              log(
                `没有可领取的次数了（挑战阎罗可获得寻宝次数）：${shortError(error)}`,
              );
              break;
            }
          }

          tokenStatus.value[tokenId] = rolls ? "completed" : "pending";
          log(
            rolls
              ? `完成：roll ${rolls} 次，领额外次数 ${extraTurns} 次`
              : "没有可执行的 roll（铃铛未领取或已用完）",
            rolls ? "success" : "warning",
          );
        });
      } catch (error) {
        tokenStatus.value[tokenId] = error.interrupted ? "stopped" : "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token?.name || tokenId} ${label}失败: ${shortError(error)}`,
          type: error.interrupted ? "warning" : "error",
        });
      } finally {
        if (ownsSlot) {
          try {
            tokenStore.closeWebSocketConnection(tokenId);
          } finally {
            releaseConnectionSlot();
          }
        }
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token?.name || tokenId} 连接清理结束 (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
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

  return { batchNightmareReward };
}
