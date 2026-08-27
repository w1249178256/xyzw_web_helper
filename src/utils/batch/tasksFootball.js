/**
 * 盐杯竞猜任务
 * 包含: 一键批量竞猜
 */

/**
 * 创建盐杯竞猜任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
 */
export function createTasksFootball(deps) {
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
   * 一键批量竞猜
   * @param {number} pick - 1=主胜, 2=平局, 3=客胜
   */
  const batchFootballBet = async (pick = 3) => {
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
          message: `=== 开始盐杯竞猜: ${token.name} ===`,
          type: "info",
        });

        // 1. 获取比赛信息
        const betInfoResp = await tokenStore.sendMessageWithPromise(
          tokenId,
          "saltcup26_getbetinfo",
          {},
          8000,
        );
        const matchList = betInfoResp?.matchList;
        const betRecord = betInfoResp?.roleData?.betRecord || {};

        // 2. 通过 betRecord 最后一个 key 获取待竞猜 matchId
        const scheduleIds = Object.keys(betRecord);
        if (scheduleIds.length === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 没有可竞猜的比赛`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        const lastScheduleId = scheduleIds[scheduleIds.length - 1];
        const scheduleBets = betRecord[lastScheduleId] || {};

        // 3. 筛选未下注比赛 (pick === 0)
        const unbetMatchIds = Object.keys(scheduleBets).filter(
          (matchId) => scheduleBets[matchId].pick === 0,
        );

        if (unbetMatchIds.length === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 所有比赛已下注，无需操作`,
            type: "success",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} ${unbetMatchIds.length} 场待竞猜`,
          type: "info",
        });

        // 4. 逐场下注
        let successCount = 0;
        let failCount = 0;
        const pickLabel =
          { 1: "主胜", 2: "平局", 3: "客胜" }[pick] || `选项${pick}`;

        for (const matchId of unbetMatchIds) {
          if (shouldStop.value) break;

          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "saltcup26_placebet",
              { matchId, pick },
              8000,
            );
            successCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${matchId} → ${pickLabel} ✓`,
              type: "success",
            });
          } catch (err) {
            failCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${matchId} 下注失败: ${err.message}`,
              type: "error",
            });
          }

          // 下注间隔
          await new Promise((r) => setTimeout(r, 500));
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 竞猜完成: 成功${successCount} 失败${failCount} ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 盐杯竞猜失败: ${error.message}`,
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
    message.success("批量盐杯竞猜结束");
  };

  return {
    batchFootballBet,
  };
}
