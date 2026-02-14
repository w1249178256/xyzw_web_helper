/**
 * 挂机、答题、签到类任务
 * 包含: claimHangUpRewards, batchAddHangUpTime, batchStudy, batchclubsign
 */

/**
 * 创建挂机、答题、签到类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
 */
export function createTasksHangUp(deps) {
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
   * 领取挂机奖励
   */
  const claimHangUpRewards = async () => {
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
          message: `=== 开始领取挂机: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // 1. Claim reward
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 领取挂机奖励`,
          type: "info",
        });
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "system_claimhangupreward",
          {},
          5000,
        );
        await new Promise((r) => setTimeout(r, 500));

        // 2. Add time 4 times
        for (let i = 0; i < 4; i++) {
          if (shouldStop.value) break;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 挂机加钟 ${i + 1}/4`,
            type: "info",
          });
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "system_mysharecallback",
            { isSkipShareCard: true, type: 2 },
            5000,
          );
          await new Promise((r) => setTimeout(r, 500));
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 领取挂机奖励完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 领取挂机奖励失败: ${error.message}`,
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
    message.success("批量领取挂机结束");
  };

  /**
   * 一键加钟
   */
  const batchAddHangUpTime = async () => {
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
          message: `=== 开始一键加钟: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        for (let i = 0; i < 4; i++) {
          if (shouldStop.value) break;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 执行加钟 ${i + 1}/4`,
            type: "info",
          });
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "system_mysharecallback",
            { isSkipShareCard: true, type: 2 },
            5000,
          );
          await new Promise((r) => setTimeout(r, 500));
        }
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 加钟完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 加钟失败: ${error.message || "未知错误"}`,
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
    message.success("批量加钟结束");
  };

  /**
   * 一键答题
   */
  const batchStudy = async () => {
    if (selectedTokens.value.length === 0) return;

    isRunning.value = true;
    shouldStop.value = false;

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    // Preload questions
    const { preloadQuestions } = await import("@/utils/studyQuestionsFromJSON.js");
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `正在加载题库...`,
      type: "info",
    });
    await preloadQuestions();

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;

      tokenStatus.value[tokenId] = "running";

      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始答题: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // Reset local study status
        tokenStore.gameData.studyStatus = {
          isAnswering: false,
          questionCount: 0,
          answeredCount: 0,
          status: "",
          timestamp: null,
        };

        // Send start command
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "study_startgame",
          {},
          5000,
        );

        // Wait for completion
        let maxWait = 90;
        let completed = false;
        let lastStatus = "";

        while (maxWait > 0 && !shouldStop.value) {
          const status = tokenStore.gameData.studyStatus;

          if (status.status !== lastStatus) {
            lastStatus = status.status;
            if (status.status === "answering") {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 开始答题...`,
                type: "info",
              });
            } else if (status.status === "claiming_rewards") {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 领取奖励...`,
                type: "info",
              });
            }
          }

          if (status.status === "completed") {
            completed = true;
            break;
          }

          await new Promise((r) => setTimeout(r, 1000));
          maxWait--;
        }

        if (completed) {
          tokenStatus.value[tokenId] = "completed";
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 答题完成 ===`,
            type: "success",
          });
        } else {
          if (shouldStop.value) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 已停止`,
              type: "warning",
            });
          } else {
            tokenStatus.value[tokenId] = "failed";
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 答题超时或未开始`,
              type: "error",
            });
          }
        }
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `答题失败: ${error.message}`,
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
    message.success("批量答题结束");
  };

  /**
   * 一键俱乐部签到
   */
  const batchclubsign = async () => {
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
          message: `=== 开始一键俱乐部签到: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        if (shouldStop.value) return;
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "legion_signin",
          {},
          5000,
        );
        await new Promise((r) => setTimeout(r, 500));
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 俱乐部签到已完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 俱乐部签到失败: ${error.message || "未知错误"}`,
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
    message.success("批量俱乐部签到结束");
  };

  return {
    claimHangUpRewards,
    batchAddHangUpTime,
    batchStudy,
    batchclubsign,
  };
}
