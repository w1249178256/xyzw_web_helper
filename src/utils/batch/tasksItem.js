import { HERO_DICT } from "@/utils/HeroList";
import { PEACH_TASKS } from "@/utils/PeachTaskIds";

/**
 * 开箱、钓鱼、招募类任务
 * 包含: batchOpenBox, batchClaimBoxPointReward, batchFish, batchRecruit
 */

/**
 * 创建物品类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
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

  const heroIds = Object.keys(HERO_DICT).map(Number);

  /**
   * 批量英雄升星
   */
  const batchHeroUpgrade = async () => {
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
          message: `=== 开始英雄升星: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        for (const heroId of heroIds) {
          if (shouldStop.value) break;

          // 每个英雄尝试最多10次升星（只要成功就继续，失败则跳过该英雄）
          for (let i = 1; i <= 10; i++) {
            if (shouldStop.value) break;

            try {
              const res = await tokenStore.sendMessageWithPromise(
                tokenId,
                "hero_heroupgradestar",
                { heroId },
                5000,
              );
              const ok =
                res &&
                (res.code === 0 || res.success === true || res.result === 0);

              if (ok) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 英雄ID:${heroId} 升星成功 (第${i}次)`,
                  type: "success",
                });
                // 成功了继续尝试下一级，直到失败或达到10次
              } else {
                // 失败说明无法继续升星（碎片不足或满星），跳出循环处理下一个英雄
                throw new Error("升星失败");
              }
            } catch (err) {
              // 失败则停止当前英雄的升星尝试
              break;
            }
            await new Promise((r) => setTimeout(r, delayConfig.action));
          }
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 英雄升星完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `英雄升星失败: ${error.message}`,
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
    message.success("批量英雄升星结束");
  };

  /**
   * 批量图鉴升星
   */
  const batchBookUpgrade = async () => {
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
          message: `=== 开始图鉴升星: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        for (const heroId of heroIds) {
          if (shouldStop.value) break;

          // 每个英雄尝试最多10次图鉴升星（只要成功就继续，失败则跳过该英雄）
          for (let i = 1; i <= 10; i++) {
            if (shouldStop.value) break;

            try {
              const res = await tokenStore.sendMessageWithPromise(
                tokenId,
                "book_upgrade",
                { heroId },
                5000,
              );
              const ok =
                res &&
                (res.code === 0 || res.success === true || res.result === 0);

              if (ok) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 英雄ID:${heroId} 图鉴升星成功 (第${i}次)`,
                  type: "success",
                });
                // 成功了继续尝试下一级，直到失败或达到10次
              } else {
                // 失败说明无法继续图鉴升星（碎片不足或满星），跳出循环处理下一个英雄
                throw new Error("图鉴升星失败");
              }
            } catch (err) {
              // 失败则停止当前英雄的图鉴升星尝试
              break;
            }
            await new Promise((r) => setTimeout(r, delayConfig.action));
          }
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} === 图鉴升星完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `图鉴升星失败: ${error.message}`,
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
    message.success("批量图鉴升星结束");
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
              res && (res.code === 0 || res.success === true || res.result === 0);

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
          5000
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
                5000
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
              5000
            );
            
            if (progressMapres && progressMapres.payloadTask) {
                const legionPoint = progressMapres.payloadTask.legionPoint || 0;
                const selfPoint = progressMapres.payloadTask.selfPoint || 0;
                // progressMap key might be string or number, handle both safely
                const progressMap = progressMapres.payloadTask.progressMap || {};
                const taskGroupprogressMap = progressMap[1] || progressMap["1"] || 0;
                const selfPointprogressMap = progressMap[2] || progressMap["2"] || 0;

                // Club Rewards - Claim all if progress is greater than claimed progress
                if (legionPoint > taskGroupprogressMap && taskGroupprogressMap < 25) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      tokenId,
                      "legion_claimpayloadtaskprogress",
                      { taskGroup: 1 },
                      5000
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
                if (selfPoint > selfPointprogressMap && selfPointprogressMap < 25) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      tokenId,
                      "legion_claimpayloadtaskprogress",
                      { taskGroup: 2 },
                      5000
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
          5000
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

        const genieNames = { 1: "魏国", 2: "蜀国", 3: "吴国", 4: "群雄", 5: "深海" };
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
                sweepCnt: sweepCnt 
              },
              5000
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
                    const currentRodCount = currentRole.items?.[rodId]?.quantity || 0;
                    
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
                         3000
                       );
                       // 稍微延迟，避免请求过快
                       await new Promise((r) => setTimeout(r, 500)); 
                    } catch (err) {
                       addLog({
                          time: new Date().toLocaleTimeString(),
                          message: `${token.name} 领取累计奖励失败 (第${k+1}次): ${err.message}`,
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

  return {
    batchOpenBox,
    batchClaimBoxPointReward,
    batchFish,
    batchRecruit,
    batchHeroUpgrade,
    batchBookUpgrade,
    batchClaimStarRewards,
    batchClaimPeachTasks,
    batchGenieSweep,
  };
}
