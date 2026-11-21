import { PEACH_TASKS } from "@/utils/PeachTaskIds";

/**
 * 开箱、钓鱼、招募类任务
 * 包含: batchOpenBox, batchClaimBoxPointReward, batchFish, batchRecruit
 */

/** 升星单次请求间隔（毫秒）：服务端对 hero_/book_ 有节流，太快会触发限流 */
const STAR_REQUEST_DELAY_MS = 500;

/**
 * 英雄升星碎片消耗（按阶段）。
 * 阶段来源：游戏内星级划分（用户提供，2026-11-20 确认）
 *   黄星 1-5：8/星｜紫星 6-10：40/星｜橙星 11-15：80/星
 *   红星 16-20：200/星｜皇冠 21-25：400/星｜紫晶 26-30：400/星
 * 抓包核对：1~4 星 8、5~9 星 40、16~18 星 200，与表一致。
 */
const HERO_STAR_TIERS = [
  { from: 1, to: 5, cost: 8, name: "黄星" },
  { from: 6, to: 10, cost: 40, name: "紫星" },
  { from: 11, to: 15, cost: 80, name: "橙星" },
  { from: 16, to: 20, cost: 200, name: "红星" },
  { from: 21, to: 25, cost: 400, name: "皇冠" },
  { from: 26, to: 30, cost: 400, name: "紫晶" },
];

/** 满星（紫晶 30 星） */
const HERO_MAX_STAR = 30;

/** 当前星级升下一星需要的碎片；超出表范围返回 undefined（交给服务端判定） */
function heroStarCost(star) {
  const tier = HERO_STAR_TIERS.find((t) => star >= t.from && star <= t.to);
  return tier ? tier.cost : undefined;
}

/**
 * 创建物品类任务执行器
 * @param {object} deps - 依赖项
 * @returns {object} 任务函数集合
 */
export function createTasksItem(deps) {
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
    helperSettings,
    delayConfig,
  } = deps;

  const boxNames = {
    2001: "木质宝箱",
    2002: "青铜宝箱",
    2003: "黄金宝箱",
    2004: "铂金宝箱",
  };

  const fishNames = { 1: "普通鱼竿", 2: "黄金鱼竿" };

  const normalizeRedeemCodes = (codes) => {
    const rawCodes = Array.isArray(codes)
      ? codes
      : String(codes || "").split(/[\s,，;；]+/);

    return [
      ...new Set(rawCodes.map((code) => String(code).trim()).filter(Boolean)),
    ];
  };

  const getResponseRole = (res) =>
    res?.role || res?.body?.role || res?.data?.role || res;

  const hasRedeemedCode = (role, code) => {
    const statistics = role?.statistics || {};
    return Boolean(statistics[`cdk:${code}_0`]);
  };

  const getRewardCount = (res) => {
    const reward = res?.reward || res?.body?.reward || res?.data?.reward;
    return Array.isArray(reward) ? reward.length : 0;
  };

  /**
   * 批量使用兑换码
   */
  const batchRedeemCodes = async () => {
    const redeemCodes = normalizeRedeemCodes(batchSettings.cdkCodes);
    const platformType =
      String(batchSettings.cdkPlatformType || "h5").trim() || "h5";

    if (selectedTokens.value.length === 0) return;

    if (redeemCodes.length === 0) {
      message.warning("请先配置兑换码");
      return;
    }

    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);
      const tokenName = token?.name || tokenId;

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始使用兑换码 ${tokenName}，共 ${redeemCodes.length} 个 ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        let role = null;
        try {
          const roleInfo = await tokenStore.sendMessageWithPromise(
            tokenId,
            "role_getroleinfo",
            {},
            8000,
          );
          role = getResponseRole(roleInfo);
        } catch (error) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${tokenName} 获取已兑换记录失败，将直接尝试兑换: ${error.message}`,
            type: "warning",
          });
        }

        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const code of redeemCodes) {
          if (shouldStop.value) break;

          if (role && hasRedeemedCode(role, code)) {
            skippedCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${tokenName} 兑换码 ${code} 已使用，跳过`,
              type: "info",
            });
            continue;
          }

          try {
            const res = await tokenStore.sendMessageWithPromise(
              tokenId,
              "system_claimcdkreward",
              { key: code, platformType },
              8000,
            );
            successCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${tokenName} 兑换码 ${code} 使用成功，奖励 ${getRewardCount(res)} 项`,
              type: "success",
            });

            const responseRole = getResponseRole(res);
            if (responseRole?.statistics) {
              role = responseRole;
            }
          } catch (error) {
            failedCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${tokenName} 兑换码 ${code} 使用失败: ${error.message}`,
              type: "warning",
            });
          }

          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${tokenName} === 兑换码处理完成：成功 ${successCount}，跳过 ${skippedCount}，失败 ${failedCount} ===`,
          type: failedCount > 0 ? "warning" : "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${tokenName} 兑换码任务失败: ${error.message}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${tokenName} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);

    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量使用兑换码结束");
  };

  /**
   * 批量英雄升星
   */
  /**
   * 批量英雄升星（hero_heroupgradestar）
   *
   * 抓包（2026-11-20 12:57）：`hero_heroupgradestar { heroId: 107 }`
   *   ← syncrewardresp { role: { heroes: { "107": { star: 17, power, ... } } } }
   * 注意：成功时**没有** `<cmd>resp`，回执是 syncrewardresp（resp=请求 seq）；
   * 旧实现用 `res.code === 0` 判成功，而 promise 只回 body，导致每次都判失败并静默 break。
   */
  const batchHeroUpgrade = async () => {
    if (selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    const label = "英雄升星";
    const MAX_PER_HERO = 30; // 覆盖 1 星 → 30 星整段

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

      try {
        await ensureConnection(tokenId);

        // gameData 是全局单份的，批量时必须按账号重新拉一次，否则会拿别人的英雄表
        let roleInfo = null;
        try {
          roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
        } catch (error) {
          log(`读取角色信息失败：${error.message || error}`, "warning");
        }
        const role =
          roleInfo?.role || tokenStore.gameData?.roleInfo?.role || {};
        const heroes = role.heroes || {};
        const items = role.items || {};
        const ids = Object.keys(heroes)
          .map(Number)
          .filter((id) => Number.isFinite(id) && id > 0);
        if (!ids.length) {
          tokenStatus.value[tokenId] = "completed";
          log("没有读取到英雄数据，请先刷新角色信息", "warning");
          return;
        }
        log(`共 ${ids.length} 个英雄，开始升星`);

        let totalUp = 0;
        let skippedByShard = 0;
        let cappedCount = 0;
        let errorCount = 0;

        for (const heroId of ids) {
          if (shouldStop.value) break;
          let star = Number(heroes[heroId]?.star) || 0;
          let shards = Number(items[String(heroId)]?.quantity) || 0;
          let up = 0;
          let reason = "";

          if (star >= HERO_MAX_STAR) {
            // 已经满星，一个请求都不用发
            skippedByShard += 1;
            continue;
          }

          for (let i = 0; i < MAX_PER_HERO; i++) {
            if (shouldStop.value) break;

            // 先本地判断碎片够不够：够才发请求，不够直接跳到下一个英雄
            const cost = heroStarCost(star);
            if (cost !== undefined && shards < cost) {
              reason = "shard";
              break;
            }

            try {
              const res = await tokenStore.sendMessageWithPromise(
                tokenId,
                "hero_heroupgradestar",
                { heroId },
                8000,
              );
              up += 1;
              totalUp += 1;
              const nextStar = Number(res?.role?.heroes?.[heroId]?.star);
              const nextShard = Number(
                res?.role?.items?.[String(heroId)]?.quantity,
              );
              if (nextStar > 0) star = nextStar;
              if (Number.isFinite(nextShard)) shards = nextShard;
              else if (cost !== undefined) shards = Math.max(0, shards - cost);
            } catch (error) {
              const text = String(error.message || error);
              if (/不足|满星|已满|上限|满级|材料|碎片/.test(text)) {
                reason = "shard";
                cappedCount += 1;
              } else {
                errorCount += 1;
                log(
                  `英雄 ${heroId} 升星失败：${text.replace(/^服务器错误:\s*\d+\s*-\s*/, "")}`,
                  "warning",
                );
              }
              break;
            }
            await new Promise((r) =>
              setTimeout(
                r,
                Math.max(delayConfig.action, STAR_REQUEST_DELAY_MS),
              ),
            );
          }

          if (up > 0) {
            log(`英雄 ${heroId} 升星 +${up} → ${star} 星`, "success");
          } else if (reason === "shard") {
            const cost = heroStarCost(star);
            // 未走请求就判定不够的，单独计数，避免日志刷屏
            if (up === 0 && cost !== undefined && shards < cost) {
              skippedByShard += 1;
            }
          }
        }

        tokenStatus.value[tokenId] = totalUp ? "completed" : "pending";
        const skipText = skippedByShard
          ? `，${skippedByShard} 个英雄碎片不足已跳过`
          : "";
        log(
          totalUp
            ? `完成：升星 ${totalUp} 次${skipText}`
            : `没有可升星的英雄（${skippedByShard} 个碎片不足${cappedCount ? `，${cappedCount} 个已满/不足` : ""}${errorCount ? `，${errorCount} 个异常` : ""}）`,
          totalUp ? "success" : "warning",
        );
      } catch (error) {
        tokenStatus.value[tokenId] = "failed";
        log(`${label}失败: ${error.message || "未知错误"}`, "error");
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success(`批量${label}结束`);
  };

  /**
   * 批量图鉴升星
   */
  /**
   * 批量图鉴升星（book_batchupgrade）
   *
   * 抓包（2026-11-20 13:01）：`book_batchupgrade { club: 1, isArtifact: false, isSkin: false }`
   *   ← book_batchupgraderesp { role: { book: { bookPoint }, heroes: { "101": { bookStar: 6 } ... } } }
   * 一条命令就是"把这批能升的都升掉"，返回里带所有被提升的英雄，需要循环到没有提升为止。
   */
  const batchBookUpgrade = async () => {
    if (selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    const label = "图鉴升星";

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

      try {
        await ensureConnection(tokenId);

        let rounds = 0;
        let heroTouched = 0;
        for (let i = 0; i < 50; i++) {
          if (shouldStop.value) break;
          try {
            const res = await tokenStore.sendMessageWithPromise(
              tokenId,
              "book_batchupgrade",
              { club: 1, isArtifact: false, isSkin: false },
              8000,
            );
            rounds += 1;
            const heroes = res?.role?.heroes || {};
            let changed = 0;
            for (const hero of Object.values(heroes)) {
              if (hero && hero.bookStar !== undefined) changed += 1;
            }
            heroTouched += changed;
            if (!changed) break; // 没有提升，说明没材料了
            log(`第 ${rounds} 轮：${changed} 个英雄图鉴星级提升`, "success");
          } catch (error) {
            const text = String(error.message || error);
            if (rounds === 0) {
              log(
                `图鉴升星失败：${text.replace(/^服务器错误:\s*\d+\s*-\s*/, "")}`,
                "warning",
              );
            } else {
              log(`图鉴升星结束（已进行 ${rounds} 轮）`);
            }
            break;
          }
          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        tokenStatus.value[tokenId] = rounds ? "completed" : "pending";
        log(
          rounds
            ? `完成：${rounds} 轮，累计提升 ${heroTouched} 次`
            : "没有可升星的图鉴",
          rounds ? "success" : "warning",
        );
      } catch (error) {
        tokenStatus.value[tokenId] = "failed";
        log(`${label}失败: ${error.message || "未知错误"}`, "error");
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success(`批量${label}结束`);
  };

  /**
   * 批量领取图鉴奖励
   */
  const batchClaimStarRewards = async () => {
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
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始领取图鉴奖励: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        for (let i = 1; i <= 10; i++) {
          if (shouldStop.value) break;
          try {
            const res = await tokenStore.sendMessageWithPromise(
              tokenId,
              "book_claimpointreward",
              {},
              5000,
            );
            const ok =
              res &&
              (res.code === 0 || res.success === true || res.result === 0);

            if (ok) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 领取图鉴奖励成功`,
                type: "success",
              });
            } else {
              // 如果领取失败（比如没有奖励可领了），停止尝试
              throw new Error("领取奖励失败");
            }
          } catch (err) {
            // 失败则停止尝试
            break;
          }
          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 领取图鉴奖励完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `领取图鉴奖励失败: ${error.message}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量领取图鉴奖励结束");
  };

  /**
   * 领取宝箱积分
   */
  const batchClaimBoxPointReward = async () => {
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
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始领取宝箱积分: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        await tokenStore.sendMessageWithPromise(
          tokenId,
          "item_batchclaimboxpointreward",
          {},
          5000,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 宝箱积分领取成功`,
          type: "success",
        });

        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 领取完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `领取失败: ${error.message}`,
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
    message.success("批量领取宝箱积分结束");
  };

  /**
   * 批量领取蟠桃园任务
   */
  const batchClaimPeachTasks = async () => {
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
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始领取蟠桃园任务奖励: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        const res = await tokenStore.sendMessageWithPromise(
          tokenId,
          "legion_getpayloadtask",
          {},
          5000,
        );

        const payloadTask = res?.payloadTask || res?.data?.payloadTask;

        if (payloadTask && payloadTask.taskMap) {
          const taskMap = payloadTask.taskMap;
          const tasks = [];
          Object.values(taskMap).forEach((item) => {
            const availableTasks = PEACH_TASKS.filter(
              (t) =>
                t.type === item.typ &&
                item.progress >= t.target &&
                item.claimedProgress < t.target,
            );
            tasks.push(...availableTasks);
          });

          let claimedCount = 0;

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 获取到 ${tasks.length} 个任务奖励`,
            type: "info",
          });

          for (const task of tasks) {
            if (shouldStop.value) break;
            // status not reliable or not present, try claim all
            try {
              const claimRes = await tokenStore.sendMessageWithPromise(
                tokenId,
                "legion_claimpayloadtask",
                { taskId: task.id },
                5000,
              );
              const ok = claimRes && claimRes.payloadTask;
              if (ok) {
                claimedCount++;
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 领取${task.desc}任务奖励成功`,
                  type: "success",
                });
              }
            } catch (err) {
              // ignore
            }
            await new Promise((r) => setTimeout(r, delayConfig.action));
          }

          // Check and claim point rewards (Moved out of loop to ensure execution)
          try {
            const progressMapres = await tokenStore.sendMessageWithPromise(
              tokenId,
              "legion_getpayloadtask",
              {},
              5000,
            );

            if (progressMapres && progressMapres.payloadTask) {
              const legionPoint = progressMapres.payloadTask.legionPoint || 0;
              const selfPoint = progressMapres.payloadTask.selfPoint || 0;
              // progressMap key might be string or number, handle both safely
              const progressMap = progressMapres.payloadTask.progressMap || {};
              const taskGroupprogressMap =
                progressMap[1] || progressMap["1"] || 0;
              const selfPointprogressMap =
                progressMap[2] || progressMap["2"] || 0;

              // Club Rewards - Claim all if progress is greater than claimed progress
              if (
                legionPoint > taskGroupprogressMap &&
                taskGroupprogressMap < 25
              ) {
                try {
                  await tokenStore.sendMessageWithPromise(
                    tokenId,
                    "legion_claimpayloadtaskprogress",
                    { taskGroup: 1 },
                    5000,
                  );
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 领取俱乐部任务奖励 (当前积分: ${legionPoint})`,
                    type: "success",
                  });
                  await new Promise((r) => setTimeout(r, 1000));
                } catch (e) {
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 领取俱乐部任务奖励失败: ${e.message}`,
                    type: "error",
                  });
                }
              }

              // Personal Rewards - Claim all if progress is greater than claimed progress
              if (
                selfPoint > selfPointprogressMap &&
                selfPointprogressMap < 25
              ) {
                try {
                  await tokenStore.sendMessageWithPromise(
                    tokenId,
                    "legion_claimpayloadtaskprogress",
                    { taskGroup: 2 },
                    5000,
                  );
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 领取个人任务奖励 (当前积分: ${selfPoint})`,
                    type: "success",
                  });
                  await new Promise((r) => setTimeout(r, 1000));
                } catch (e) {
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 领取个人任务奖励失败: ${e.message}`,
                    type: "error",
                  });
                }
              }
            }
          } catch (err) {
            console.error("领取蟠桃园积分奖励异常:", err);
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 领取积分奖励异常: ${err.message}`,
              type: "error",
            });
          }

          if (claimedCount === 0) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 没有可领取的任务奖励`,
              type: "info",
            });
          }
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 未获取到任务奖励列表`,
            type: "warning",
          });
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 领取蟠桃园任务奖励完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 领取蟠桃园任务奖励失败: ${error.message}`,
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
    message.success("批量领取蟠桃园任务奖励结束");
  };

  /**
   * 一键灯神扫荡
   */
  const batchGenieSweep = async () => {
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
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始灯神扫荡: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // 获取最新角色信息
        const roleInfoRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          5000,
        );

        // 解析灯神进度和扫荡券
        const role = roleInfoRes?.role || roleInfoRes?.data?.role || {};
        const genieData = role.genie || {};
        // 扫荡券 ID 1021
        const sweepTicketCount = role.items?.[1021]?.quantity || 0;

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 当前扫荡券数量: ${sweepTicketCount}`,
          type: "info",
        });

        if (sweepTicketCount <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 扫荡券不足，停止扫荡`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        // 计算最高层数
        // 1-4: 魏蜀吴群 (0-16 -> 1-17层)
        // 5: 深海 (0-9 -> 1-10层)
        let maxLayer = -1;
        let bestGenieId = -1;

        // 检查魏蜀吴群 (1-4)
        for (let i = 1; i <= 4; i++) {
          if (genieData[i] !== undefined) {
            // 数据值 0 代表 1 层? 用户说 0-16 代表 1-17 层
            // 假设 genieData[i] 是已通过的层数索引
            const currentLayer = genieData[i] + 1;
            if (currentLayer > maxLayer) {
              maxLayer = currentLayer;
              bestGenieId = i;
            }
          }
        }

        if (bestGenieId === -1) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 未找到可扫荡的灯神关卡`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        const genieNames = {
          1: "魏国",
          2: "蜀国",
          3: "吴国",
          4: "群雄",
          5: "深海",
        };
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 扫荡: ${genieNames[bestGenieId]}灯神 (第${maxLayer}层)`,
          type: "info",
        });

        // 开始扫荡
        let remainingTickets = sweepTicketCount;

        while (remainingTickets > 0 && !shouldStop.value) {
          const sweepCnt = Math.min(remainingTickets, 20);

          try {
            const res = await tokenStore.sendMessageWithPromise(
              tokenId,
              "genie_sweep",
              {
                genieId: bestGenieId,
                sweepCnt,
              },
              5000,
            );

            const ok = res && (res.role || res.role.items);

            if (ok) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 扫荡成功 ${sweepCnt} 次`,
                type: "success",
              });
              remainingTickets = res.role.items?.[1021]?.quantity || 0;
            } else {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 扫荡失败: ${res.hint || "未知错误"}`,
                type: "error",
              });
              break; // 失败则停止
            }
          } catch (err) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 扫荡请求异常: ${err.message}`,
              type: "error",
            });
            break;
          }

          if (remainingTickets > 0) {
            await new Promise((r) => setTimeout(r, delayConfig.action));
          }
        }

        // 刷新信息
        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 灯神扫荡完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `灯神扫荡失败: ${error.message}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
      }
    });

    await Promise.all(taskPromises);

    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("一键灯神扫荡结束");
  };

  const batchOpenBox = async (isScheduledTask = false) => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    const boxType = isScheduledTask
      ? batchSettings.defaultBoxType
      : helperSettings.boxType;
    const totalCount = isScheduledTask
      ? batchSettings.boxCount
      : helperSettings.count;
    const batches = Math.floor(totalCount / 10);
    const remainder = totalCount % 10;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始批量开箱: ${token.name} ===`,
          type: "info",
        });
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 宝箱类型: ${boxNames[boxType]}, 数量: ${totalCount}`,
          type: "info",
        });

        await ensureConnection(tokenId);

        for (let i = 0; i < batches && !shouldStop.value; i++) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "item_openbox",
            { itemId: boxType, number: 10 },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 开箱进度: ${(i + 1) * 10}/${totalCount}`,
            type: "info",
          });
          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        if (remainder > 0 && !shouldStop.value) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "item_openbox",
            { itemId: boxType, number: remainder },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 开箱进度: ${totalCount}/${totalCount}`,
            type: "info",
          });
        }
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "item_batchclaimboxpointreward",
        );
        await new Promise((r) => setTimeout(r, delayConfig.action));
        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 开箱完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `开箱失败: ${error.message}`,
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
    message.success("批量开箱结束");
  };

  /**
   * 批量钓鱼
   */
  const batchFish = async (isScheduledTask = false) => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    const fishType = isScheduledTask
      ? batchSettings.defaultFishType
      : helperSettings.fishType;
    const totalCount = isScheduledTask
      ? batchSettings.fishCount
      : helperSettings.count;
    Math.floor(totalCount / 10);

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始批量钓鱼: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // 检查鱼竿数量
        let role = tokenStore.gameData?.roleInfo?.role;
        if (!role) {
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
            role = roleInfo?.role;
          } catch {}
        }
        // 普通鱼竿: 1011, 黄金鱼竿: 1012
        const rodId = fishType === 1 ? 1011 : 1012;
        const rodCount = role?.items?.[rodId]?.quantity || 0;

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 鱼竿类型: ${fishNames[fishType]}, 目标数量: ${totalCount}, 当前库存: ${rodCount}`,
          type: "info",
        });

        let availableCount = totalCount;
        if (rodCount < totalCount) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 库存不足 (${rodCount} < ${totalCount})，将仅消耗现有库存`,
            type: "warning",
          });
          availableCount = rodCount;
        }

        if (availableCount <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 没有可用的鱼竿，停止任务`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        const batches = Math.floor(availableCount / 10);
        const remainder = availableCount % 10;

        for (let i = 0; i < batches && !shouldStop.value; i++) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "artifact_lottery",
            { type: fishType, lotteryNumber: 10, newFree: true },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 钓鱼进度: ${(i + 1) * 10}/${availableCount}`,
            type: "info",
          });

          // 每5轮（50次）后，重新校验鱼竿数量
          if ((i + 1) % 5 === 0 && i < batches - 1) {
            try {
              const roleRes = await tokenStore.sendMessageWithPromise(
                tokenId,
                "role_getroleinfo",
                {},
                5000,
              );
              const currentRole = roleRes?.role || roleRes?.data?.role;
              if (currentRole) {
                const currentRodCount =
                  currentRole.items?.[rodId]?.quantity || 0;

                // 剩余需要的次数 (不包括当前这轮，因为i已经执行完了，所以剩余次数是 (batches - 1 - i) * 10 + remainder)
                // 但实际上我们只需要知道下一轮是否有足够的鱼竿
                // 如果当前库存少于10，说明下一轮可能不够，或者整个任务不够
                // 重新计算 availableCount 可能会比较复杂，因为循环是基于 batches

                if (currentRodCount < 10) {
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 同步后发现鱼竿不足 (${currentRodCount} < 10)，停止后续批量任务`,
                    type: "warning",
                  });
                  // 强制停止
                  break;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        if (remainder > 0 && !shouldStop.value) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "artifact_lottery",
            { type: fishType, lotteryNumber: remainder, newFree: true },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 钓鱼进度: ${availableCount}/${availableCount}`,
            type: "info",
          });
        }
        // 自动领取鱼竿累计奖励
        try {
          const roleRes = await tokenStore.sendMessageWithPromise(
            tokenId,
            "role_getroleinfo",
            {},
            5000,
          );
          const currentRole = roleRes?.role || roleRes?.data?.role;
          if (currentRole) {
            const points = currentRole.statistics?.["artifact:point"] || 0;
            const exchangeCount = Math.floor(points / 20);

            if (exchangeCount > 0) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 检测到鱼竿累计使用 ${points}，开始领取 ${exchangeCount} 次累计奖励`,
                type: "info",
              });

              for (let k = 0; k < exchangeCount && !shouldStop.value; k++) {
                try {
                  await tokenStore.sendMessageWithPromise(
                    tokenId,
                    "artifact_exchange",
                    {},
                    3000,
                  );
                  // 稍微延迟，避免请求过快
                  await new Promise((r) => setTimeout(r, 500));
                } catch (err) {
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 领取累计奖励失败 (第${k + 1}次): ${err.message}`,
                    type: "warning",
                  });
                  break; // 如果出错可能是不满足条件，停止领取
                }
              }
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 累计奖励领取结束`,
                type: "success",
              });
            }
          }
        } catch (e) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 检查累计奖励失败: ${e.message}`,
            type: "warning",
          });
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 钓鱼完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `钓鱼失败: ${error.message}`,
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
    message.success("批量钓鱼结束");
  };

  /**
   * 批量招募
   */
  const batchRecruit = async (isScheduledTask = false) => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    const totalCount = isScheduledTask
      ? batchSettings.recruitCount
      : helperSettings.count;
    const batches = Math.floor(totalCount / 10);
    const remainder = totalCount % 10;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始批量招募: ${token.name} ===`,
          type: "info",
        });
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 招募数量: ${totalCount}`,
          type: "info",
        });

        await ensureConnection(tokenId);

        for (let i = 0; i < batches && !shouldStop.value; i++) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "hero_recruit",
            { recruitType: 1, recruitNumber: 10 },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `招募进度: ${(i + 1) * 10}/${totalCount}`,
            type: "info",
          });
          await new Promise((r) => setTimeout(r, delayConfig.action));
        }

        if (remainder > 0 && !shouldStop.value) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "hero_recruit",
            { recruitType: 1, recruitNumber: remainder },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `招募进度: ${totalCount}/${totalCount}`,
            type: "info",
          });
        }

        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 招募完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `招募失败: ${error.message}`,
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
    message.success("批量招募结束");
  };

  const batchOpenBoxByPoints = async (isScheduledTask = false) => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    const targetPoints = isScheduledTask
      ? batchSettings.targetBoxPoints
      : helperSettings.targetPoints;

    const boxPriority = [
      { id: 2001, name: "木质宝箱", points: 1, reserve: 200 },
      { id: 2002, name: "青铜宝箱", points: 10, reserve: 0 },
      { id: 2003, name: "黄金宝箱", points: 20, reserve: 0 },
      { id: 2004, name: "铂金宝箱", points: 50, reserve: 0 },
    ];

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始按积分开箱: ${token.name} ===`,
          type: "info",
        });
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 目标积分: ${targetPoints}`,
          type: "info",
        });

        await ensureConnection(tokenId);

        const roleInfoRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          5000,
        );
        const role = roleInfoRes?.role || roleInfoRes?.data?.role || {};
        const items = role.items || {};

        const boxInventory = {};
        let totalAvailablePoints = 0;

        for (const box of boxPriority) {
          const count = items[box.id]?.quantity || 0;
          boxInventory[box.id] = count;
          totalAvailablePoints += count * box.points;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 箱子库存: 木质=${boxInventory[2001]}, 青铜=${boxInventory[2002]}, 黄金=${boxInventory[2003]}, 铂金=${boxInventory[2004]}`,
          type: "info",
        });
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 可获得总积分: ${totalAvailablePoints}`,
          type: "info",
        });

        if (totalAvailablePoints < targetPoints) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 积分不足! 需要 ${targetPoints}, 可获得 ${totalAvailablePoints}`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
          return;
        }

        const boxToOpen = {};
        let remainingPoints = targetPoints;

        const woodenAvailable = boxInventory[2001] - 200;
        if (woodenAvailable >= 10) {
          const woodenPoints = woodenAvailable * 1;
          const pointsNeeded = Math.min(woodenPoints, remainingPoints);
          let woodenToOpen = Math.min(pointsNeeded, woodenAvailable);
          woodenToOpen = Math.floor(woodenToOpen / 10) * 10;
          if (woodenToOpen === 0 && woodenAvailable >= 10 && pointsNeeded > 0) {
            woodenToOpen = 10;
          }

          if (woodenToOpen >= 10) {
            boxToOpen[2001] = woodenToOpen;
            remainingPoints -= woodenToOpen * 1;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 计划开 木质宝箱: ${woodenToOpen} 个 (积分: ${woodenToOpen})`,
              type: "info",
            });
          }
        }

        if (remainingPoints > 0) {
          const bronzeAvailable = Math.floor(boxInventory[2002] / 10) * 10;
          const goldAvailable = Math.floor(boxInventory[2003] / 10) * 10;
          const platinumAvailable = Math.floor(boxInventory[2004] / 10) * 10;
          const woodenTotal = Math.floor(boxInventory[2001] / 10) * 10;

          let bestResult = null;
          let minWaste = Infinity;

          for (let bronze = 0; bronze <= bronzeAvailable; bronze += 10) {
            const bronzePoints = bronze * 10;
            if (bronzePoints > remainingPoints) break;

            for (let gold = 0; gold <= goldAvailable; gold += 10) {
              const goldPoints = gold * 20;
              if (bronzePoints + goldPoints > remainingPoints) break;

              const afterBronzeGold =
                remainingPoints - bronzePoints - goldPoints;

              for (
                let platinum = 0;
                platinum <= platinumAvailable;
                platinum += 10
              ) {
                const platinumPoints = platinum * 50;
                if (platinumPoints > afterBronzeGold) break;

                const afterPlatinum = afterBronzeGold - platinumPoints;

                let wooden = 0;
                if (afterPlatinum > 0) {
                  wooden = Math.ceil(afterPlatinum / 10) * 10;
                  if (wooden > woodenTotal || wooden > 100) continue;
                }

                const totalPoints =
                  bronzePoints + goldPoints + platinumPoints + wooden;
                const waste = totalPoints - targetPoints;

                if (waste >= 0 && waste < minWaste) {
                  minWaste = waste;
                  bestResult = { bronze, gold, platinum, wooden, totalPoints };
                  if (waste === 0) break;
                }
              }
              if (minWaste === 0) break;
            }
            if (minWaste === 0) break;
          }

          if (bestResult) {
            if (bestResult.bronze > 0) {
              boxToOpen[2002] = bestResult.bronze;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 计划开 青铜宝箱: ${bestResult.bronze} 个 (积分: ${bestResult.bronze * 10})`,
                type: "info",
              });
            }
            if (bestResult.gold > 0) {
              boxToOpen[2003] = bestResult.gold;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 计划开 黄金宝箱: ${bestResult.gold} 个 (积分: ${bestResult.gold * 20})`,
                type: "info",
              });
            }
            if (bestResult.platinum > 0) {
              boxToOpen[2004] = bestResult.platinum;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 计划开 铂金宝箱: ${bestResult.platinum} 个 (积分: ${bestResult.platinum * 50})`,
                type: "info",
              });
            }
            if (bestResult.wooden > 0) {
              boxToOpen[2001] = (boxToOpen[2001] || 0) + bestResult.wooden;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 计划开 木质宝箱: ${bestResult.wooden} 个 (积分: ${bestResult.wooden})`,
                type: "info",
              });
            }
            remainingPoints = 0;
          }
        }

        for (const box of boxPriority) {
          if (shouldStop.value) break;

          const count = boxToOpen[box.id] || 0;
          if (count <= 0) continue;

          const batches = Math.floor(count / 10);
          const remainder = count % 10;

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 开始开 ${box.name}: ${count} 个`,
            type: "info",
          });

          for (let i = 0; i < batches && !shouldStop.value; i++) {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "item_openbox",
              { itemId: box.id, number: 10 },
              5000,
            );
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${box.name} 开箱进度: ${(i + 1) * 10}/${count}`,
              type: "info",
            });
            await new Promise((r) => setTimeout(r, delayConfig.action));
          }

          if (remainder > 0 && !shouldStop.value) {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "item_openbox",
              { itemId: box.id, number: remainder },
              5000,
            );
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${box.name} 开箱进度: ${count}/${count}`,
              type: "info",
            });
          }
        }

        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 按积分开箱完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `按积分开箱失败: ${error.message}`,
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
    message.success("按积分开箱结束");
  };

  return {
    batchOpenBox,
    batchOpenBoxByPoints,
    batchClaimBoxPointReward,
    batchFish,
    batchRecruit,
    batchHeroUpgrade,
    batchBookUpgrade,
    batchClaimStarRewards,
    batchClaimPeachTasks,
    batchGenieSweep,
    batchRedeemCodes,
  };
}
