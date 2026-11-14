import { isSameGameValue } from "@/utils/gameValue.js";
import { getTowerActId } from "../towerActId.js";

/**
 * 爬塔类任务
 * 包含: climbTower, climbWeirdTower, batchClaimFreeEnergy
 */
import { normalizeWeirdTowerMaxClimb } from "../towerClimbLimit.js";

/**
 * 补领怪异塔未领取的章节通关奖励
 *
 * evoTower.towerId 是层号（如 240 表示已通关第 24 章），rewardTowerId 是已领取到的章号。
 * 两者不一致说明有章节奖励未领取，此时游戏服会拒绝 evotower_readyfight 并返回 12200020，
 * 导致爬塔无法开始。故需在爬塔前按 rewardTowerId 主动补齐。
 *
 * @param {object} tokenStore - token store
 * @param {string} tokenId - token id
 * @param {object} evoTower - evotower_getinfo 返回的 evoTower 对象
 * @param {Function} onLog - 日志回调 (message, type) => void
 * @returns {Promise<number>} 实际补领的章节数
 */
async function claimPendingEvoTowerRewards(
  tokenStore,
  tokenId,
  evoTower,
  onLog,
) {
  const towerId = Number(evoTower?.towerId ?? 0);
  const rewardTowerId = Number(evoTower?.rewardTowerId ?? 0);
  if (!towerId) {
    return 0;
  }

  const clearedChapter = Math.floor(towerId / 10);
  let pending = clearedChapter - rewardTowerId;
  if (pending <= 0) {
    return 0;
  }

  onLog?.(
    `检测到 ${pending} 个未领取的章节通关奖励（已通关第 ${clearedChapter} 章，已领至第 ${rewardTowerId} 章），先行补领`,
    "warning",
  );

  let claimed = 0;
  while (pending > 0) {
    try {
      const res = await tokenStore.sendMessageWithPromise(
        tokenId,
        "evotower_claimreward",
        {},
        5000,
      );
      claimed++;
      pending--;
      onLog?.(
        `已领取第 ${res?.evoTower?.rewardTowerId ?? rewardTowerId + claimed} 章通关奖励`,
        "success",
      );
      await new Promise((r) => setTimeout(r, 300));
    } catch (error) {
      // 领奖失败则停止：继续爬塔只会持续返回 12200020
      onLog?.(
        `领取章节奖励失败，已补领 ${claimed}/${claimed + pending} 个：${error?.message || error}`,
        "error",
      );
      break;
    }
  }
  return claimed;
}

/**
 * 创建爬塔类任务执行器
 * @param {object} deps - 依赖项
 * @returns {object} 任务函数集合
 */
export function createTasksTower(deps) {
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
    currentSettings,
    loadSettings,
    weirdTowerMaxClimb,
  } = deps;

  /**
   * 爬塔
   */
  const climbTower = async () => {
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
      // 加载该Token的独立配置，如果未找到则回退到currentSettings
      const tokenSettings = loadSettings
        ? loadSettings(tokenId) || currentSettings
        : currentSettings;

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始爬塔: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        const teamInfo = await tokenStore.sendMessageWithPromise(
          tokenId,
          "presetteam_getinfo",
          {},
          5000,
        );
        if (!teamInfo || !teamInfo.presetTeamInfo) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `阵容信息异常: ${JSON.stringify(teamInfo)}`,
            type: "warning",
          });
        }

        const currentFormation = teamInfo?.presetTeamInfo?.useTeamId;
        let Isswitching = false;
        if (currentFormation === tokenSettings.towerFormation) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前已是阵容${tokenSettings.towerFormation}，无需切换`,
            type: "info",
          });
        } else {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: tokenSettings.towerFormation },
            5000,
          );
          Isswitching = true;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `成功切换到阵容${tokenSettings.towerFormation}`,
            type: "info",
          });
        }

        // Initial check
        await tokenStore
          .sendMessageWithPromise(tokenId, "tower_getinfo", {}, 5000)
          .catch(() => {});
        let roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
        let energy = roleInfo?.role?.tower?.energy || 0;
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 初始体力: ${energy}`,
          type: "info",
        });

        let count = 0;
        const MAX_CLIMB = 100;
        let consecutiveFailures = 0;

        while (energy > 0 && count < MAX_CLIMB && !shouldStop.value) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "fight_starttower",
              {},
              5000,
            );
            count++;
            consecutiveFailures = 0;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 爬塔第 ${count} 次`,
              type: "info",
            });

            await new Promise((r) => setTimeout(r, 1000));

            // Refresh energy
            // 默认每5次刷新一次，或体力不足时刷新
            if (count % 5 === 0) {
              try {
                roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
                energy = roleInfo?.role?.tower?.energy || 0;
              } catch (e) {
                // 忽略刷新失败
              }
            } else {
              // 尝试从本地缓存获取最新的体力信息（如果其他地方更新了）
              const storeRoleInfo = tokenStore.gameData?.roleInfo;
              const storeEnergy = storeRoleInfo?.role?.tower?.energy;

              // 如果store中的体力大于当前预计剩余体力，说明可能有额外恢复/奖励，使用store的值
              if (storeEnergy !== undefined && storeEnergy > energy - 1) {
                energy = storeEnergy;
              } else {
                // 本地扣除体力
                energy--;
              }
            }
          } catch (err) {
            if (err.message && err.message.includes("200400")) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 操作过快 (200400)，等待5秒后重试...`,
                type: "warning",
              });
              await new Promise((r) => setTimeout(r, 5000));
              continue;
            }

            // 处理"上座塔奖励未领取"错误 (1500040)
            if (err.message && err.message.includes("1500040")) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 上座塔奖励未领取，尝试自动领取并等待...`,
                type: "warning",
              });

              // 尝试获取当前塔层数
              try {
                // 如果本地没有roleInfo，尝试获取一次
                if (!roleInfo) {
                  roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
                }
                const towerId = roleInfo?.role?.tower?.id;

                if (towerId !== undefined) {
                  const rewardFloor = Math.floor(towerId / 10);
                  if (rewardFloor > 0) {
                    addLog({
                      time: new Date().toLocaleTimeString(),
                      message: `${token.name} 尝试领取第 ${rewardFloor} 层奖励`,
                      type: "info",
                    });
                    // 发送领取请求，不等待响应，因为可能通过事件处理了
                    tokenStore.sendMessage(tokenId, "tower_claimreward", {
                      rewardId: rewardFloor,
                    });
                  }
                }
              } catch (e) {
                // 忽略获取信息失败
              }

              // 等待较长时间让领取生效
              await new Promise((r) => setTimeout(r, 3000));

              // 刷新角色信息以更新状态
              try {
                roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
                energy = roleInfo?.role?.tower?.energy || 0;
              } catch (e) {}

              // 重置连续失败计数，因为这是一个可恢复的错误
              consecutiveFailures = 0;
              continue;
            }

            consecutiveFailures++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `战斗出错: ${err.message} (重试 ${consecutiveFailures}/3)`,
              type: "warning",
            });

            if (consecutiveFailures >= 3) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 连续失败次数过多，停止爬塔`,
                type: "error",
              });
              break;
            }

            await new Promise((r) => setTimeout(r, 2000));

            try {
              roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
              energy = roleInfo?.role?.tower?.energy || 0;
            } catch (e) {
              // 忽略刷新失败
            }
          }
        }
        if (Isswitching) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: currentFormation },
            5000,
          );
        }
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 爬塔结束，共 ${count} 次 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 爬塔失败: ${error.message}`,
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
    message.success("批量爬塔结束");
  };

  /**
   * 爬怪异塔
   */
  const climbWeirdTower = async () => {
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
      // 加载该Token的独立配置，如果未找到则回退到currentSettings
      const tokenSettings = loadSettings
        ? loadSettings(tokenId) || currentSettings
        : currentSettings;

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始爬怪异塔: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        const teamInfo = await tokenStore.sendMessageWithPromise(
          tokenId,
          "presetteam_getinfo",
          {},
          5000,
        );
        if (!teamInfo || !teamInfo.presetTeamInfo) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `阵容信息异常: ${JSON.stringify(teamInfo)}`,
            type: "warning",
          });
        }

        const currentFormation = teamInfo?.presetTeamInfo?.useTeamId;
        let Isswitching = false;
        if (currentFormation === tokenSettings.towerFormation) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前已是阵容${tokenSettings.towerFormation}，无需切换`,
            type: "info",
          });
        } else {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: tokenSettings.towerFormation },
            5000,
          );
          Isswitching = true;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `成功切换到阵容${tokenSettings.towerFormation}`,
            type: "info",
          });
        }

        // 获取怪异塔信息
        const evotowerinfo1 = await tokenStore.sendMessageWithPromise(
          tokenId,
          "evotower_getinfo",
          {},
          5000,
        );

        let currentEnergy = evotowerinfo1?.evoTower?.energy;

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 初始能量: ${currentEnergy}`,
          type: "info",
        });

        // 爬塔前先补领未领取的章节奖励，否则 evotower_readyfight 会被拒绝（12200020）
        await claimPendingEvoTowerRewards(
          tokenStore,
          tokenId,
          evotowerinfo1?.evoTower,
          (message, type) =>
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${message}`,
              type,
            }),
        );

        let count = 0;
        const MAX_CLIMB = normalizeWeirdTowerMaxClimb(
          weirdTowerMaxClimb?.value ?? weirdTowerMaxClimb,
        );
        let consecutiveFailures = 0;

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 本次最多爬怪异塔 ${MAX_CLIMB} 次`,
          type: "info",
        });

        while (currentEnergy > 0 && count < MAX_CLIMB && !shouldStop.value) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "evotower_readyfight",
              {},
              5000,
            );

            await tokenStore.sendMessageWithPromise(
              tokenId,
              "evotower_fight",
              {
                battleNum: 1,
                winNum: 1,
              },
              10000,
            );

            count++;
            consecutiveFailures = 0;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 爬怪异塔第 ${count} 次`,
              type: "info",
            });

            await new Promise((r) => setTimeout(r, 500));

            const evotowerinfo2 = await tokenStore.sendMessageWithPromise(
              tokenId,
              "evotower_getinfo",
              {},
              5000,
            );

            // 检查并领取每日任务奖励
            if (
              evotowerinfo2 &&
              evotowerinfo2.evoTower &&
              evotowerinfo2.evoTower.taskClaimMap
            ) {
              const now = new Date();
              const year = now.getFullYear().toString().slice(2);
              const month = (now.getMonth() + 1).toString().padStart(2, "0");
              const day = now.getDate().toString().padStart(2, "0");
              const dateKey = `${year}${month}${day}`;

              const dailyTasks =
                evotowerinfo2.evoTower.taskClaimMap[dateKey] || {};
              const taskIds = [1, 2, 3];

              for (const taskId of taskIds) {
                if (!dailyTasks[taskId]) {
                  await tokenStore
                    .sendMessageWithPromise(
                      tokenId,
                      "evotower_claimtask",
                      { taskId },
                      2000,
                    )
                    .then(() => {
                      addLog({
                        time: new Date().toLocaleTimeString(),
                        message: `${token.name} 领取每日任务奖励 ${taskId} 成功`,
                        type: "success",
                      });
                    })
                    .catch(() => {});
                  await new Promise((r) => setTimeout(r, 200));
                }
              }
            }

            // 通关章节奖励：以 rewardTowerId 为准判断是否有未领取的章节
            // （原按 (towerId % 10) + 1 === 1 判断，towerId 为 10 的整数倍时恒成立，
            //   会重复发送领奖命令，且无法感知历史未领取的章节）
            await claimPendingEvoTowerRewards(
              tokenStore,
              tokenId,
              evotowerinfo2?.evoTower,
              (message, type) =>
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} ${message}`,
                  type,
                }),
            );

            // 刷新能量
            try {
              const evotowerinfoRefresh1 =
                await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "evotower_getinfo",
                  {},
                  5000,
                );
              currentEnergy = evotowerinfoRefresh1?.evoTower?.energy || 0;
            } catch (e) {
              // 忽略刷新失败
            }
          } catch (err) {
            consecutiveFailures++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `战斗出错: ${err.message} (重试 ${consecutiveFailures}/3)`,
              type: "warning",
            });

            if (consecutiveFailures >= 3) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 连续失败次数过多，停止爬怪异塔`,
                type: "error",
              });
              break;
            }

            await new Promise((r) => setTimeout(r, 1000));

            try {
              const evotowerinfoRefresh2 =
                await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "evotower_getinfo",
                  {},
                  5000,
                );
              currentEnergy = evotowerinfoRefresh2?.evoTower?.energy || 0;
            } catch (e) {
              // 忽略刷新失败
            }
          }
        }
        if (Isswitching) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: currentFormation },
            5000,
          );
        }
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 爬怪异塔结束，共 ${count} 次 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 爬怪异塔失败: ${error.message}`,
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
    message.success("批量爬怪异塔结束");
  };

  /**
   * 领取怪异塔免费道具
   */
  const batchClaimFreeEnergy = async () => {
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
          message: `=== 开始领取怪异塔免费道具: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        const freeEnergyResult = await tokenStore.sendMessageWithPromise(
          tokenId,
          "mergebox_getinfo",
          {
            actType: 1,
          },
          5000,
        );

        if (freeEnergyResult && freeEnergyResult.mergeBox.freeEnergy > 0) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "mergebox_claimfreeenergy",
            {
              actType: 1,
            },
            5000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 成功领取免费道具${freeEnergyResult.mergeBox.freeEnergy}个`,
            type: "success",
          });
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `===  ${token.name} 暂无免费道具可领取`,
            type: "success",
          });
        }

        tokenStatus.value[tokenId] = "completed";
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 领取免费道具失败: ${error.message || "未知错误"}`,
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
    message.success("批量领取怪异塔免费道具结束");
  };

  /**
   * 换皮闯关
   */
  const skinChallenge = async () => {
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
          message: `=== 开始换皮闯关: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // 获取活动信息
        let res = await tokenStore.sendMessageWithPromise(
          tokenId,
          "towers_getinfo",
          { actId: getTowerActId() },
          5000,
        );

        let towerData = res.actId
          ? res
          : res.towerData && res.towerData.actId
            ? res.towerData
            : res;

        // 检查活动是否有效
        if (!towerData.actId) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 换皮闯关活动信息获取失败`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "failed";
          return;
        }

        const actId = String(towerData.actId);
        if (actId.length >= 6) {
          const year = `20${actId.substring(0, 2)}`;
          const month = actId.substring(2, 4);
          const day = actId.substring(4, 6);
          const startDate = new Date(`${year}-${month}-${day}T00:00:00`);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          const now = new Date();
          if (now < startDate || now >= endDate) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 换皮闯关活动已结束`,
              type: "warning",
            });
            tokenStatus.value[tokenId] = "completed";
            return;
          }
        }

        let levelRewardMap = towerData.levelRewardMap || {};

        // 计算今日开放的BOSS
        const todayWeekDay = new Date().getDay(); // 0-6 (Sun-Sat)
        const openTowerMap = {
          5: [1], // Friday
          6: [2], // Saturday
          0: [3], // Sunday
          1: [4], // Monday
          2: [5], // Tuesday
          3: [6], // Wednesday
          4: [1, 2, 3, 4, 5, 6], // Thursday (All open)
        };
        const todayOpenTowers = openTowerMap[todayWeekDay] || [];

        // 辅助函数：判断是否已通关
        const isTowerCleared = (type, map) => {
          const key1 = `${type}008`;
          const key2 = Number(key1);
          return !!(map[key1] || map[key2]);
        };

        // 辅助函数：获取当前层数
        const getTowerLevel = (type, map) => {
          for (let i = 8; i >= 1; i--) {
            const key1 = `${type}00${i}`;
            const key2 = Number(key1);
            if (map[key1] || map[key2]) {
              if (i === 8) return 8;
              return i + 1;
            }
          }
          return 1;
        };

        // 筛选未通关的BOSS
        const targetTowers = todayOpenTowers.filter(
          (type) => !isTowerCleared(type, levelRewardMap),
        );

        if (todayWeekDay === 4) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 周四全开放，检测到需补打BOSS: ${targetTowers.length > 0 ? targetTowers.join(", ") : "无"}`,
            type: "info",
          });
        } else if (targetTowers.length === 0 && todayOpenTowers.length > 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 今日BOSS ${todayOpenTowers[0]} 已通关`,
            type: "info",
          });
        }

        if (targetTowers.length === 0) {
          tokenStatus.value[tokenId] = "completed";
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 换皮闯关结束 (无需挑战) ===`,
            type: "success",
          });
          return;
        }

        for (const type of targetTowers) {
          if (shouldStop.value) break;

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 开始挑战 BOSS ${type}`,
            type: "info",
          });

          let needStart = true;
          let loop = true;
          let failCount = 0;

          while (loop && !shouldStop.value) {
            if (needStart) {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "towers_start",
                { actId: getTowerActId(), towerType: type },
                5000,
              );
              // 稍微等待一下
              await new Promise((r) => setTimeout(r, 500));
            }

            const fightRes = await tokenStore.sendMessageWithPromise(
              tokenId,
              "towers_fight",
              { actId: getTowerActId(), towerType: type },
              5000,
            );
            const battleData = fightRes?.battleData;
            const curHP = battleData?.result?.accept?.ext?.curHP;

            const currentLevel = getTowerLevel(type, levelRewardMap);

            if (curHP === 0) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} BOSS ${type} 第 ${currentLevel} 层挑战成功`,
                type: "success",
              });

              needStart = false;
              failCount = 0;

              // 刷新数据
              res = await tokenStore.sendMessageWithPromise(
                tokenId,
                "towers_getinfo",
                { actId: getTowerActId() },
                5000,
              );
              towerData = res.actId
                ? res
                : res.towerData && res.towerData.actId
                  ? res.towerData
                  : res;
              levelRewardMap = towerData.levelRewardMap || {};

              if (isTowerCleared(type, levelRewardMap)) {
                loop = false;
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} BOSS ${type} 全部通关`,
                  type: "success",
                });
              } else {
                await new Promise((r) => setTimeout(r, 1000));
              }
            } else {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} BOSS ${type} 第 ${currentLevel} 层挑战失败`,
                type: "warning",
              });

              needStart = true;
              failCount++;

              if (failCount >= 3) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} BOSS ${type} 连续失败3次，跳过`,
                  type: "error",
                });
                loop = false;
              } else {
                await new Promise((r) => setTimeout(r, 1000));
              }
            }
          }
        }

        // 闯关结束后循环领取奖励
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 闯关结束，开始领取奖励`,
          type: "info",
        });
        let claimCount = 0;
        const claimActId =
          Number(actId) % 10 === 1 ? Number(actId) + 1 : Number(actId);
        try {
          while (!shouldStop.value) {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "activity_startactegame",
              { actId: claimActId },
              5000,
            );
            claimCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 活动 ${claimActId} 领取奖励第 ${claimCount} 次`,
              type: "success",
            });
            await new Promise((r) => setTimeout(r, 300));
          }
        } catch (e) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 活动 ${claimActId} 领取结束（共 ${claimCount} 次）`,
            type: claimCount > 0 ? "success" : "info",
          });
        }
        if (claimCount > 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 领取奖励 ${claimCount} 次`,
            type: "success",
          });
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 换皮闯关结束 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";

        let errorMessage = error.message;
        if (errorMessage && errorMessage.includes("200330")) {
          errorMessage = "存在未完成的挑战，需要手动处理";
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 换皮闯关失败: ${errorMessage}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 断开连接`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
  };

  /**
   * 批量使用道具
   */
  const batchUseItems = async () => {
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
          message: `=== 开始使用道具: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // 1. 获取活动信息
        const infoRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "mergebox_getinfo",
          { actType: 1 },
          5000,
        );

        // 获取怪异塔信息以读取剩余道具数量
        const towerInfoRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "evotower_getinfo",
          {},
          5000,
        );

        if (!infoRes || !infoRes.mergeBox) {
          throw new Error("获取活动信息失败");
        }

        let costTotalCnt = infoRes.mergeBox.costTotalCnt || 0;
        let lotteryLeftCnt = towerInfoRes?.evoTower?.lotteryLeftCnt || 0;

        if (lotteryLeftCnt <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 没有剩余道具可使用`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 开始使用道具，剩余：${lotteryLeftCnt}，已用：${costTotalCnt}`,
          type: "info",
        });

        let processedCount = 0;

        while (lotteryLeftCnt > 0 && !shouldStop.value) {
          let pos = {};
          if (costTotalCnt < 2) {
            pos = { gridX: 4, gridY: 5 };
          } else if (costTotalCnt < 102) {
            pos = { gridX: 7, gridY: 3 };
          } else {
            pos = { gridX: 6, gridY: 3 };
          }

          // 2. 使用道具
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "mergebox_openbox",
            {
              actType: 1,
              pos,
            },
            5000,
          );

          costTotalCnt++;
          lotteryLeftCnt--;
          processedCount++;

          await new Promise((res) => setTimeout(res, 500));
        }

        // 领取累计奖励
        await tokenStore
          .sendMessageWithPromise(
            tokenId,
            "mergebox_claimcostprogress",
            { actType: 1 },
            5000,
          )
          .catch(() => {});
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 尝试领取累计使用奖励`,
          type: "info",
        });

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 使用道具结束，共使用 ${processedCount} 次 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 使用道具失败: ${error.message}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 断开连接`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量使用道具结束");
  };

  // Reward names/descriptions for merge-progress tasks, keyed by task level
  // (last two digits of taskId). Used for log messages only.
  const mergeRewardMapping = {
    2: { name: "短裙手套", reward: "10随机红色碎片" },
    3: { name: "拽拽菜篮", reward: "2黄金鱼竿" },
    4: { name: "狂野菜板", reward: "2招募令" },
    5: { name: "大胃锅", reward: "2珍珠" },
    6: { name: "幽影茶壶", reward: "5皮肤币" },
    7: { name: "愤怒面包机", reward: "2珍珠" },
    8: { name: "惊讶榨汁机", reward: "1四圣宝珠碎片" },
    9: { name: "动感电饭锅", reward: "5000白玉" },
    10: { name: "迅捷烤炉", reward: "12珍珠" },
    11: { name: "至尊打蛋机", reward: "15彩玉" },
    12: { name: "完美烤炉", reward: "24珍珠" },
  };

  /**
   * Run a single merge round against the merge box:
   * 1. claim finished merge-progress (level) rewards,
   * 2. merge same-id item pairs on the grid (server auto-merge at level 8+).
   *
   * Extracted from batchMergeItems so the combined "use + merge" task can
   * reuse it to free up grid slots when the board is full.
   *
   * @param {string} tokenId - token id
   * @param {string} tokenName - token display name (for logs)
   * @returns {Promise<{ok: boolean, merged: boolean, claimed: boolean}>}
   *   ok      - false when the board state could not be read (caller decides
   *             whether to retry or fail; do not treat as "nothing to merge")
   *   merged  - a merge command actually succeeded (real grid progress)
   *   claimed - at least one level reward was claimed successfully
   */
  const runMergeRound = async (tokenId, tokenName) => {
    const failed = { ok: false, merged: false, claimed: false };
    let claimed = false;

    let infoRes = null;
    try {
      infoRes = await tokenStore.sendMessageWithPromise(
        tokenId,
        "mergebox_getinfo",
        { actType: 1 },
        5000,
      );
    } catch (err) {
      // Treat like other commands: a transient failure here should not kill
      // the whole token; the caller's dead-loop guard handles the fallout.
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `${tokenName} 获取活动信息失败: ${err?.message || err}`,
        type: "error",
      });
      return failed;
    }

    if (!infoRes || !infoRes.mergeBox) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `${tokenName} 返回数据缺少 mergeBox`,
        type: "warning",
      });
      return failed;
    }

    // Claim finished merge-progress (level) rewards
    if (infoRes.mergeBox.taskMap) {
      const taskMap = infoRes.mergeBox.taskMap;
      const taskClaimMap = infoRes.mergeBox.taskClaimMap || {};

      for (const taskId in taskMap) {
        if (shouldStop.value) break;
        if (taskMap[taskId] !== 0 && !taskClaimMap[taskId]) {
          // Only count/log on success so callers can tell claimed rewards
          // apart from real grid progress.
          const claimRes = await tokenStore
            .sendMessageWithPromise(
              tokenId,
              "mergebox_claimmergeprogress",
              { actType: 1, taskId: Number.parseInt(taskId) },
              2000,
            )
            .catch(() => null);
          if (claimRes === null) continue;

          const idStr = String(taskId);
          const lastTwo = Number.parseInt(idStr.slice(-2));
          const taskInfo = mergeRewardMapping[lastTwo];
          const taskDesc = taskInfo
            ? `${lastTwo}级 ${taskInfo.reward ? ` 奖励${taskInfo.reward}` : ""}`
            : `任务${taskId}`;

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${tokenName} 领取合成奖励: ${taskDesc}`,
            type: "success",
          });
          claimed = true;
          await new Promise((res) => setTimeout(res, 500));
        }
      }
    }

    // Parse gridMap and merge same-id items pairwise
    const gridMap = infoRes.mergeBox.gridMap || {};
    const items = [];

    // Collect all items with gridConfId === 0
    for (const xStr in gridMap) {
      for (const yStr in gridMap[xStr]) {
        const item = gridMap[xStr][yStr];
        if (
          isSameGameValue(item.gridConfId, 0) &&
          item.gridItemId > 0 &&
          !item.isLock
        ) {
          items.push({
            x: Number.parseInt(xStr),
            y: Number.parseInt(yStr),
            id: item.gridItemId,
          });
        }
      }
    }

    // Group by gridItemId
    const groupedItems = {};
    items.forEach((item) => {
      if (!groupedItems[item.id]) {
        groupedItems[item.id] = [];
      }
      groupedItems[item.id].push(item);
    });

    // Check whether any merge is possible
    let hasPotentialMerge = false;
    for (const id in groupedItems) {
      if (groupedItems[id].length >= 2) {
        hasPotentialMerge = true;
        break;
      }
    }

    if (!hasPotentialMerge) {
      return { ok: true, merged: false, claimed };
    }

    const isLevel8OrAbove =
      infoRes.mergeBox.taskMap &&
      infoRes.mergeBox.taskMap["251212208"] &&
      infoRes.mergeBox.taskMap["251212208"] !== 0;

    if (isLevel8OrAbove) {
      // Level 8+: one server-side auto-merge call handles the whole board
      // Only report progress when the call actually succeeds.
      const autoRes = await tokenStore
        .sendMessageWithPromise(
          tokenId,
          "mergebox_automergeitem",
          { actType: 1 },
          10000,
        )
        .catch(() => null);
      await new Promise((res) => setTimeout(res, 1500));
      return { ok: true, merged: autoRes !== null, claimed };
    }

    // Below level 8: merge pairs client-side
    let merged = false;
    for (const id in groupedItems) {
      if (shouldStop.value) break;
      const group = groupedItems[id];
      // Merge two at a time
      while (group.length >= 2) {
        if (shouldStop.value) break;
        const source = group.shift();
        const target = group.shift();

        // Only count successful merges so the caller's dead-loop guard
        // reflects real server-side grid progress.
        const mergeRes = await tokenStore
          .sendMessageWithPromise(
            tokenId,
            "mergebox_mergeitem",
            {
              actType: 1,
              sourcePos: { gridX: source.x, gridY: source.y },
              targetPos: { gridX: target.x, gridY: target.y },
            },
            1000,
          )
          .catch(() => null);
        if (mergeRes !== null) {
          merged = true;
        }
        await new Promise((res) => setTimeout(res, 300));
      }
    }

    return { ok: true, merged, claimed };
  };

  /**
   * 批量合成
   */
  const batchMergeItems = async () => {
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
          message: `=== 开始一键合成: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        let loopCount = 0;
        const MAX_LOOPS = 20;

        while (loopCount < MAX_LOOPS && !shouldStop.value) {
          loopCount++;

          // One round: claim level rewards + merge same-id pairs
          const round = await runMergeRound(tokenId, token.name);

          // Board state could not be read: surface it as a task failure
          // instead of disguising it as "nothing to merge".
          if (!round.ok) {
            throw new Error("获取合成盒子信息失败");
          }

          // Nothing claimed and nothing merged -> nothing left to do
          if (!round.merged && !round.claimed) {
            if (loopCount === 1) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 当前没有可合成的物品`,
                type: "info",
              });
            }
            break;
          }

          // Continue to the next round
          await new Promise((res) => setTimeout(res, 500));
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 一键合成完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 一键合成失败: ${error.message}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 断开连接`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量一键合成结束");
  };

  /**
   * 一键怪异塔领取+使用+合成（组合任务）
   *
   * Full pipeline per token:
   * 1. claim free merge-box items (freeEnergy),
   * 2. loop: use keys (mergebox_openbox) until keys run out or the grid is
   *    full (server error 12300040), then run one merge round to free slots,
   *    then claim the cumulative-cost reward; repeat while keys remain,
   * 3. final summary log.
   *
   * Guards: consecutive rounds without any successful open and without real
   * merge progress abort the task; unreadable board state is retried; a hard
   * cap on outer iterations bounds the whole run.
   */
  const batchUseAndMergeItems = async () => {
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
          message: `=== 开始怪异塔领取+使用+合成: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // ---- Step 1: claim free merge-box items (best-effort) ----
        try {
          const freeRes = await tokenStore.sendMessageWithPromise(
            tokenId,
            "mergebox_getinfo",
            { actType: 1 },
            5000,
          );
          const freeEnergy = freeRes?.mergeBox?.freeEnergy || 0;
          if (freeEnergy > 0) {
            const claimRes = await tokenStore
              .sendMessageWithPromise(
                tokenId,
                "mergebox_claimfreeenergy",
                { actType: 1 },
                5000,
              )
              .catch(() => null);
            if (claimRes !== null) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 领取免费道具 ${freeEnergy} 个`,
                type: "success",
              });
            }
          } else {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 暂无免费道具可领取`,
              type: "info",
            });
          }
        } catch {
          // Free-item claim is best-effort; the main loop re-fetches state
          // anyway, so a transient failure here should not abort the run.
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 查询免费道具失败，继续主流程`,
            type: "warning",
          });
        }

        // ---- Step 2: use/merge main loop ----
        let totalUsed = 0;
        let mergeRounds = 0;
        let consecutiveErrors = 0;
        let stallRounds = 0; // consecutive rounds with zero successful opens
        const MAX_ROUNDS = 50;
        const MAX_CONSECUTIVE_ERRORS = 3;
        let aborted = false;
        let costRewardClaimed = false;

        while (!shouldStop.value && !aborted) {
          // Re-fetch remaining keys every round: claiming free items and
          // merging may both change lotteryLeftCnt server-side.
          let lotteryLeftCnt = 0;
          try {
            const towerInfoRes = await tokenStore.sendMessageWithPromise(
              tokenId,
              "evotower_getinfo",
              {},
              5000,
            );
            lotteryLeftCnt = towerInfoRes?.evoTower?.lotteryLeftCnt || 0;
            consecutiveErrors = 0;
          } catch (err) {
            // Treat info fetch like openbox: retry, abort after repeated failures
            consecutiveErrors++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 获取怪异塔信息失败(${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${err?.message || err}`,
              type: "error",
            });
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              aborted = true;
              break;
            }
            await new Promise((res) => setTimeout(res, 500));
            continue;
          }

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 第 ${mergeRounds + 1} 轮，剩余钥匙 ${lotteryLeftCnt}`,
            type: "info",
          });

          // Inner loop: use keys until exhausted or grid full
          let usedThisRound = 0;
          let costTotalCnt = null; // fetched lazily for pos selection
          let openFailed = false; // an openbox call failed this round
          let gridFullThisRound = false; // server reported 12300040 this round

          while (lotteryLeftCnt > 0 && !shouldStop.value) {
            // Fetch cumulative use count once per round for pos selection
            if (costTotalCnt === null) {
              try {
                const infoRes = await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "mergebox_getinfo",
                  { actType: 1 },
                  5000,
                );
                costTotalCnt = infoRes?.mergeBox?.costTotalCnt || 0;
              } catch (err) {
                consecutiveErrors++;
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 获取活动信息失败(${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${err?.message || err}`,
                  type: "error",
                });
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                  aborted = true;
                  break;
                }
                await new Promise((res) => setTimeout(res, 500));
                continue;
              }
            }

            // Hard-coded open positions, same as batchUseItems
            let pos = {};
            if (costTotalCnt < 2) {
              pos = { gridX: 4, gridY: 5 };
            } else if (costTotalCnt < 102) {
              pos = { gridX: 7, gridY: 3 };
            } else {
              pos = { gridX: 6, gridY: 3 };
            }

            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "mergebox_openbox",
                { actType: 1, pos },
                5000,
              );
              costTotalCnt++;
              lotteryLeftCnt--;
              totalUsed++;
              usedThisRound++;
              consecutiveErrors = 0;
              openFailed = false;
              await new Promise((res) => setTimeout(res, 500));
            } catch (err) {
              const msg = String(err?.message || err);
              openFailed = true;
              if (msg.includes("12300040")) {
                // Grid full: leave the inner loop so the merge round can
                // free slots, then retry.
                gridFullThisRound = true;
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 棋盘已满，执行合成腾位`,
                  type: "warning",
                });
                break;
              }
              // Any other failure may also be slot-related, so merge first and
              // retry. The stall counter bounds repeated failures.
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 使用道具失败，合成后重试: ${msg}`,
                type: "error",
              });
              break;
            }
          }

          if (aborted) break;

          // Merge round: claim level rewards + free grid slots
          mergeRounds++;
          const round = await runMergeRound(tokenId, token.name);

          // Track rounds without any successful open: this bounds both
          // "board full" retries and repeated openbox failures. Reset as soon
          // as a key is actually used.
          if (usedThisRound > 0) {
            stallRounds = 0;
          } else {
            stallRounds++;
          }

          // Dead-loop guard: nothing used and no real merge happened.
          // A failed openbox still gets a few merge-and-retry attempts.
          if (usedThisRound === 0 && !round.merged) {
            if (!openFailed) {
              // No keys left (or never had any) and the board is settled.
              addLog({
                time: new Date().toLocaleTimeString(),
                message: gridFullThisRound
                  ? `${token.name} 棋盘已满且无可合成物品，停止任务`
                  : `${token.name} 无钥匙可用且无可合成物品，停止任务`,
                type: "warning",
              });
              break;
            }
            if (stallRounds >= MAX_CONSECUTIVE_ERRORS) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 连续 ${stallRounds} 轮无法使用道具且合成无进展，停止任务`,
                type: "error",
              });
              aborted = true;
              break;
            }
          }

          // Board state unreadable: skip reward claims, retry next round.
          if (!round.ok) {
            await new Promise((res) => setTimeout(res, 500));
            continue;
          }

          // Claim cumulative-cost reward (idempotent, ignore failures).
          // Always send the request — later rounds may unlock new milestones —
          // but log only the first success to avoid per-round noise.
          const costRes = await tokenStore
            .sendMessageWithPromise(
              tokenId,
              "mergebox_claimcostprogress",
              { actType: 1 },
              5000,
            )
            .catch(() => null);
          if (costRes !== null && !costRewardClaimed) {
            costRewardClaimed = true;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 已领取累计消耗奖励`,
              type: "success",
            });
          }

          // Opportunistic: claim newly regenerated free items
          try {
            const freeCheck = await tokenStore.sendMessageWithPromise(
              tokenId,
              "mergebox_getinfo",
              { actType: 1 },
              5000,
            );
            if ((freeCheck?.mergeBox?.freeEnergy || 0) > 0) {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "mergebox_claimfreeenergy",
                { actType: 1 },
                5000,
              );
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 补领免费道具 ${freeCheck.mergeBox.freeEnergy} 个`,
                type: "success",
              });
            }
          } catch {
            // Free-item top-up is best-effort; ignore failures
          }

          // Hard cap on outer iterations
          if (mergeRounds >= MAX_ROUNDS) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 已达最大轮次 ${MAX_ROUNDS}，停止任务`,
              type: "warning",
            });
            break;
          }

          await new Promise((res) => setTimeout(res, 500));
        }

        tokenStatus.value[tokenId] = aborted ? "failed" : "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 怪异塔领取+使用+合成完成: 使用钥匙 ${totalUsed} 个，合成 ${mergeRounds} 轮 ===`,
          type: aborted ? "error" : "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 怪异塔领取+使用+合成失败: ${error.message || "未知错误"}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 断开连接`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量怪异塔领取+使用+合成结束");
  };

  return {
    climbTower,
    climbWeirdTower,
    batchClaimFreeEnergy,
    skinChallenge,
    batchUseItems,
    batchMergeItems,
    batchUseAndMergeItems,
  };
}

/**
 * 批量使用道具
 * @param {object} deps
 */
