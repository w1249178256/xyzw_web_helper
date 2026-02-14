/**
 * 爬塔类任务
 * 包含: climbTower, climbWeirdTower, batchClaimFreeEnergy
 */

/**
 * 创建爬塔类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
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
        if (currentFormation === currentSettings.towerFormation) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前已是阵容${currentSettings.towerFormation}，无需切换`,
            type: "info",
          });
        } else {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: currentSettings.towerFormation },
            5000,
          );
          Isswitching = true;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `成功切换到阵容${currentSettings.towerFormation}`,
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

            await new Promise((r) => setTimeout(r, 2000));

            // Refresh energy
            tokenStore.sendMessage(tokenId, "tower_getinfo");
            roleInfo = await tokenStore.sendGetRoleInfo(tokenId);

            const storeRoleInfo = tokenStore.gameData?.roleInfo;
            energy =
              storeRoleInfo?.role?.tower?.energy ??
              roleInfo?.role?.tower?.energy ??
              0;
          } catch (err) {
            if (err.message && err.message.includes("200400")) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 爬塔次数已用完 (200400)`,
                type: "info",
              });
              break;
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
        if (currentFormation === currentSettings.towerFormation) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `当前已是阵容${currentSettings.towerFormation}，无需切换`,
            type: "info",
          });
        } else {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_saveteam",
            { teamId: currentSettings.towerFormation },
            5000,
          );
          Isswitching = true;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `成功切换到阵容${currentSettings.towerFormation}`,
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

        let count = 0;
        const MAX_CLIMB = 100;
        let consecutiveFailures = 0;

        while (currentEnergy > 0 && count < MAX_CLIMB && !shouldStop.value) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "evotower_readyfight",
              {},
              5000,
            );

            const fightResult = await tokenStore.sendMessageWithPromise(
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

            // 检查是否刚通关10层
            const evotowerinfo2 = await tokenStore.sendMessageWithPromise(
              tokenId,
              "evotower_getinfo",
              {},
              5000,
            );
            const towerId = evotowerinfo2?.evoTower?.towerId || 0;
            const floor = (towerId % 10) + 1;
            if (
              fightResult &&
              fightResult.winList &&
              fightResult.winList[0] === true &&
              floor === 1
            ) {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "evotower_claimreward",
                {},
                5000,
              );
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 成功领取第${Math.floor(towerId / 10)}章通关奖励！`,
                type: "success",
              });
              await new Promise((r) => setTimeout(r, 1000));
            }

            // 刷新能量
            try {
              const evotowerinfoRefresh1 = await tokenStore.sendMessageWithPromise(
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
              const evotowerinfoRefresh2 = await tokenStore.sendMessageWithPromise(
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

  return {
    climbTower,
    climbWeirdTower,
    batchClaimFreeEnergy,
  };
}
