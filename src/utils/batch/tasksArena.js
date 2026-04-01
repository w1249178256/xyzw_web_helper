/**
 * 竞技场、补齐类任务
 * 包含: batcharenafight, batchTopUpFish, batchTopUpArena
 */

import { FISH_TARGET, ARENA_TARGET } from "./constants.js";

/**
 * 创建竞技场、补齐类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
 */
export function createTasksArena(deps) {
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
    pickArenaTargetId,
    getTodayStartSec,
    isTodayAvailable,
    calculateMonthProgress,
    delayConfig,
    loadSettings,
  } = deps;

  /**
   * 一键竞技场战斗3次
   */
  const batcharenafight = async () => {
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
      // 加载该Token的独立配置，如果未找到则回退到currentSettings(虽然可能不准确，但作为最后的兜底)
      const tokenSettings = loadSettings ? (loadSettings(tokenId) || currentSettings) : currentSettings;
      
      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始一键竞技场战斗: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        if (shouldStop.value) return;

        // 检查咸神门票 (ID: 1007)
        let role = tokenStore.gameData?.roleInfo?.role;
        if (!role) {
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
            role = roleInfo?.role;
          } catch {}
        }
        const ticketCount = role?.items?.[1007]?.quantity || 0;
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 当前咸神门票: ${ticketCount}`,
          type: "info",
        });

        if (ticketCount <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 咸神门票不足，无法进行竞技场战斗`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

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
        if (currentFormation === tokenSettings.arenaFormation) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前已是阵容${tokenSettings.arenaFormation}，无需切换`,
            type: "info",
          });
        } else {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: tokenSettings.arenaFormation },
            5000,
          );
          Isswitching = true;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `成功切换到阵容${tokenSettings.arenaFormation}`,
            type: "info",
          });
        }
        
        const fights = Math.min(3, ticketCount);
        if (fights < 3) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 咸神门票仅剩 ${ticketCount} 张，将执行 ${fights} 次战斗`,
            type: "warning",
          });
        }

        for (let i = 0; i < fights; i++) {
          if (shouldStop.value) break;
          await tokenStore.sendMessageWithPromise(tokenId, "arena_startarea", {});
          let targets;
          try {
            targets = await tokenStore.sendMessageWithPromise(
              tokenId,
              "arena_getareatarget",
              {},
            );
          } catch (err) {
            message.error(`获取竞技场目标失败：${err.message}`);
            break;
          }
          const targetId = pickArenaTargetId(targets);
          if (!targetId) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 未找到可用的竞技场目标`,
              type: "error",
            });
            break;
          }
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "fight_startareaarena",
              { targetId },
            );
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 竞技场战斗 ${i + 1}/3`,
              type: "info",
            });
            await new Promise((r) => setTimeout(r, delayConfig.battle));
          } catch (e) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 竞技场对决失败: ${e.message || "未知错误"}`,
              type: "error",
            });
          }
        }
        await new Promise((r) => setTimeout(r, delayConfig.battle));
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
          message: `=== ${token.name} 竞技场战斗已完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 一键竞技场战斗失败: ${error.message || "未知错误"}`,
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
    message.success("批量竞技场战斗结束");
  };

  /**
   * 批量钓鱼补齐
   */
  const batchTopUpFish = async () => {
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
          message: `=== 开始钓鱼补齐: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 获取月度任务进度...`,
          type: "info",
        });
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_get",
          {},
          10000,
        );
        const act = result?.activity || result?.body?.activity || result;

        if (!act) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 获取月度任务进度失败`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
          return;
        }
        const myMonthInfo = act.myMonthInfo || {};
        const fishNum = Number(myMonthInfo?.["2"]?.num || 0);

        const monthProgress = calculateMonthProgress();
        const now = new Date();
        const daysInMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        ).getDate();
        const dayOfMonth = now.getDate();
        const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
        const shouldBe =
          remainingDays === 0
            ? FISH_TARGET
            : Math.min(FISH_TARGET, Math.ceil(monthProgress * FISH_TARGET));
        const need = Math.max(0, shouldBe - fishNum);
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 当前进度: ${fishNum}/${FISH_TARGET}，需要补齐: ${need}次`,
          type: "info",
        });
        if (need <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前进度已达标，无需补齐`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 开始执行钓鱼补齐...`,
          type: "info",
        });

        let role = tokenStore.gameData?.roleInfo?.role;
        if (!role) {
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
            role = roleInfo?.role;
          } catch {}
        }
        let freeUsed = 0;
        const lastFreeTime = Number(
          role?.statisticsTime?.["artifact:normal:lottery:time"] || 0,
        );
        if (isTodayAvailable(lastFreeTime)) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 检测到今日免费钓鱼次数，开始消耗 3 次`,
            type: "info",
          });
          for (let i = 0; i < 3 && need > freeUsed && !shouldStop.value; i++) {
            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "artifact_lottery",
                { lotteryNumber: 1, newFree: true, type: 1 },
                8000,
              );
              freeUsed++;
              await new Promise((r) => setTimeout(r, delayConfig.action));
            } catch (e) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 免费钓鱼失败: ${e.message}`,
                type: "error",
              });
              break;
            }
          }
        }

        const updatedResult = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_get",
          {},
          10000,
        );
        const updatedAct =
          updatedResult?.activity ||
          updatedResult?.body?.activity ||
          updatedResult;
        const updatedMyMonthInfo = updatedAct.myMonthInfo || {};
        const updatedFishNum = Number(updatedMyMonthInfo?.["2"]?.num || 0);
        let remaining = Math.max(0, shouldBe - updatedFishNum);
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 免费次数后进度: ${updatedFishNum}/${FISH_TARGET}，还需补齐: ${remaining}次`,
          type: "info",
        });
        if (remaining <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `已通过免费次数完成目标`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 开始付费钓鱼补齐: 共需 ${remaining} 次（每次最多10）`,
          type: "info",
        });

        // 检查普通鱼竿 (ID: 1011)
        const rodCount = role?.items?.[1011]?.quantity || 0;
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 当前普通鱼竿: ${rodCount}`,
          type: "info",
        });

        if (rodCount < remaining) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 普通鱼竿不足 (${rodCount} < ${remaining})，将仅使用现有鱼竿`,
            type: "warning",
          });
          remaining = rodCount;
        }

        while (remaining > 0 && !shouldStop.value) {
          const batch = Math.min(10, remaining);
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "artifact_lottery",
              { lotteryNumber: batch, newFree: true, type: 1 },
              12000,
            );
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 完成 ${batch} 次付费钓鱼`,
              type: "info",
            });
            remaining -= batch;
            
            // 每钓鱼5轮（50次）后，重新获取角色信息，校验鱼竿数量
            if (remaining > 0 && batch >= 10 && remaining % 50 === 0) {
                 try {
                     const roleRes = await tokenStore.sendMessageWithPromise(
                         tokenId,
                         "role_getroleinfo",
                         {},
                         5000,
                     );
                     const currentRole = roleRes?.role || roleRes?.data?.role;
                     if (currentRole) {
                         const currentRodCount = currentRole.items?.[1011]?.quantity || 0;
                         if (currentRodCount < remaining) {
                             addLog({
                                 time: new Date().toLocaleTimeString(),
                                 message: `${token.name} 同步后发现鱼竿不足 (${currentRodCount} < ${remaining})，调整目标`,
                                 type: "warning",
                             });
                             remaining = currentRodCount;
                         }
                     }
                 } catch (e) {
                     // ignore
                 }
            }

            await new Promise((r) => setTimeout(r, delayConfig.battle));
          } catch (e) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 付费钓鱼失败: ${e.message}`,
              type: "error",
            });
            break;
          }
        }

        const finalResult = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_get",
          {},
          10000,
        );
        const finalAct =
          finalResult?.activity || finalResult?.body?.activity || finalResult;
        const finalMyMonthInfo = finalAct.myMonthInfo || {};
        const finalFishNum = Number(finalMyMonthInfo?.["2"]?.num || 0);
        if (finalFishNum >= shouldBe || finalFishNum >= FISH_TARGET) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 钓鱼补齐完成，最终进度: ${finalFishNum}/${FISH_TARGET}`,
            type: "success",
          });
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 钓鱼补齐已停止，未达到目标，最终进度: ${finalFishNum}/${FISH_TARGET}`,
            type: "warning",
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
                         3000
                       );
                       await new Promise((r) => setTimeout(r, 500)); 
                    } catch (err) {
                       addLog({
                          time: new Date().toLocaleTimeString(),
                          message: `${token.name} 领取累计奖励失败 (第${k+1}次): ${err.message}`,
                          type: "warning",
                       });
                       break;
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
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 钓鱼补齐失败: ${error.message}`,
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
    message.success("批量钓鱼补齐结束");
  };

  /**
   * 批量竞技场补齐
   */
  const batchTopUpArena = async () => {
    if (selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;
      tokenStatus.value[tokenId] = "running";
      
      // 加载该Token的独立配置，如果未找到则回退到currentSettings
      const tokenSettings = loadSettings ? (loadSettings(tokenId) || currentSettings) : currentSettings;
      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始竞技场补齐: ${token.name} ===`,
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
        if (currentFormation === tokenSettings.arenaFormation) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前已是阵容${tokenSettings.arenaFormation}，无需切换`,
            type: "info",
          });
        } else {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: tokenSettings.arenaFormation },
            5000,
          );
          Isswitching = true;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `成功切换到阵容${tokenSettings.arenaFormation}`,
            type: "info",
          });
        }
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 获取月度任务进度...`,
          type: "info",
        });
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_get",
          {},
          10000,
        );
        const act = result?.activity || result?.body?.activity || result;

        if (!act) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 获取月度任务进度失败`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
          return;
        }
        const myArenaInfo = act.myArenaInfo || {};
        const arenaNum = Number(myArenaInfo?.num || 0);

        const monthProgress = calculateMonthProgress();
        const now = new Date();
        const daysInMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        ).getDate();
        const dayOfMonth = now.getDate();
        const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
        const shouldBe =
          remainingDays === 0
            ? ARENA_TARGET
            : Math.min(ARENA_TARGET, Math.ceil(monthProgress * ARENA_TARGET));
        const need = Math.max(0, shouldBe - arenaNum);
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 当前进度: ${arenaNum}/${ARENA_TARGET}，需要补齐: ${need}次`,
          type: "info",
        });
        if (need <= 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 当前进度已达标，无需补齐`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 开始执行竞技场补齐...`,
          type: "info",
        });

        // 检查咸神门票 (ID: 1007)
        let role = tokenStore.gameData?.roleInfo?.role;
        if (!role) {
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
            role = roleInfo?.role;
          } catch {}
        }
        const ticketCount = role?.items?.[1007]?.quantity || 0;
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 当前咸神门票: ${ticketCount}`,
          type: "info",
        });

        if (ticketCount < need) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 咸神门票不足 (${ticketCount} < ${need})，将仅使用现有门票`,
            type: "warning",
          });
        }

        let ticketsLeft = ticketCount;
        let remaining = Math.min(need, ticketsLeft);

        if (remaining <= 0) {
           addLog({
             time: new Date().toLocaleTimeString(),
             message: `${token.name} 没有可用的咸神门票`,
             type: "warning",
           });
           tokenStatus.value[tokenId] = "completed";
           return;
        }

        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "arena_startarea",
            {},
            6000,
          );
        } catch (error) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 开始竞技场失败: ${error.message}`,
            type: "warning",
          });
        }

        let safetyCounter = 0;
        const safetyMaxFights = 100;
        let round = 1;
        while (
          remaining > 0 &&
          ticketsLeft > 0 &&
          safetyCounter < safetyMaxFights &&
          !shouldStop.value
        ) {
          const planFights = Math.min(Math.ceil(remaining / 2), ticketsLeft);
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 第${round}轮：计划战斗 ${planFights} 场 (剩余门票: ${ticketsLeft})`,
            type: "info",
          });

          let actualFights = 0;
          for (
            let i = 0;
            i < planFights &&
            safetyCounter < safetyMaxFights &&
            !shouldStop.value;
            i++
          ) {
            let targets;
            try {
              targets = await tokenStore.sendMessageWithPromise(
                tokenId,
                "arena_getareatarget",
                {},
                8000,
              );
            } catch (err) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 获取竞技场目标失败：${err.message}`,
                type: "error",
              });
              break;
            }

            const targetId = pickArenaTargetId(targets);
            if (!targetId) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 未找到可用的竞技场目标`,
                type: "warning",
              });
              break;
            }

            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "fight_startareaarena",
                { targetId },
                15000,
              );
              actualFights++;
              ticketsLeft--;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 竞技场战斗 ${i + 1}/${planFights} 完成`,
                type: "info",
              });
            } catch (e) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 竞技场对决失败：${e.message}`,
                type: "error",
              });
            }

            safetyCounter++;
            await new Promise((r) => setTimeout(r, delayConfig.refresh));
          }

          const updatedResult = await tokenStore.sendMessageWithPromise(
            tokenId,
            "activity_get",
            {},
            10000,
          );
          const updatedAct =
            updatedResult?.activity ||
            updatedResult?.body?.activity ||
            updatedResult;
          const updatedMyArenaInfo = updatedAct.myArenaInfo || {};
          const updatedArenaNum = Number(updatedMyArenaInfo?.num || 0);
          
          // Re-calculate remaining needed for target, but don't exceed ticketsLeft
          const neededForTarget = Math.max(0, shouldBe - updatedArenaNum);
          
          // 每轮战斗后重新获取角色信息以更新门票数量
          try {
             const roleRes = await tokenStore.sendMessageWithPromise(
               tokenId,
               "role_getroleinfo",
               {},
               5000,
             );
             const currentRole = roleRes?.role || roleRes?.data?.role;
             if (currentRole) {
                 const newTickets = currentRole.items?.[1007]?.quantity || 0;
                 if (newTickets !== ticketsLeft) {
                    addLog({
                        time: new Date().toLocaleTimeString(),
                        message: `${token.name} 同步最新门票数量: ${newTickets} (原记录: ${ticketsLeft})`,
                        type: "info",
                    });
                    ticketsLeft = newTickets;
                 }
             }
          } catch (e) {
              // ignore error, use local calculation
          }

          remaining = Math.min(neededForTarget, ticketsLeft);

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 第${round}轮后进度: ${updatedArenaNum}/${ARENA_TARGET}，还需补齐: ${remaining}次`,
            type: "info",
          });

          round++;
        }

        const finalResult = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_get",
          {},
          10000,
        );
        const finalAct =
          finalResult?.activity || finalResult?.body?.activity || finalResult;
        const finalMyArenaInfo = finalAct.myArenaInfo || {};
        const finalArenaNum = Number(finalMyArenaInfo?.num || 0);
        if (finalArenaNum >= shouldBe || finalArenaNum >= ARENA_TARGET) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 竞技场补齐完成，最终进度: ${finalArenaNum}/${ARENA_TARGET}`,
            type: "success",
          });
        } else if (safetyCounter >= safetyMaxFights) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `达到安全上限，竞技场补齐已停止，最终进度: ${finalArenaNum}/${ARENA_TARGET}`,
            type: "warning",
          });
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 竞技场补齐已停止，未达到目标，最终进度: ${finalArenaNum}/${ARENA_TARGET}`,
            type: "warning",
          });
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
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 竞技场补齐失败: ${error.message}`,
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
    message.success("批量竞技场补齐结束");
  };

  return {
    batcharenafight,
    batchTopUpFish,
    batchTopUpArena,
  };
}
