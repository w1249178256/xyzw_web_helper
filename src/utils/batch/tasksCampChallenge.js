/**
 * 营地挑战类任务
 * 包含: batchCampChallenge, batchCampChallengePet, batchCampClaimTasks
 */

/**
 * 创建营地挑战类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
 */
export function createTasksCampChallenge(deps) {
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
    loadSettings,
  } = deps;

  /**
   * 一键营地挑战
   */
  const batchCampChallenge = async () => {
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
          message: `=== 开始营地挑战: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        if (shouldStop.value) return;

        // 1. 获取我方阵容配置（参考 QuenchAnalysisCard.refreshHeroes）
        const [presetTeamResult, roleInfoResult] = await Promise.all([
          tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_getinfo",
            {},
            5000,
          ),
          tokenStore.sendMessageWithPromise(
            tokenId,
            "role_getroleinfo",
            {},
            15000,
          ),
        ]);

        const lordWeaponId = roleInfoResult?.role?.lordWeaponId || 0;

        // 解析阵容数据，优先使用竞技场阵容
        const tokenSettings = loadSettings ? loadSettings(tokenId) : {};
        const formationId = String(tokenSettings?.arenaFormation || 1);
        const root = presetTeamResult?.presetTeamInfo?.presetTeamInfo || presetTeamResult?.presetTeamInfo || {};
        const teamInfoData = root[formationId]?.teamInfo || root["1"]?.teamInfo || {};

        const battleTeam = {};
        for (const [pos, hero] of Object.entries(teamInfoData)) {
          const hid = hero?.heroId ?? hero?.id;
          if (hid) {
            battleTeam[pos] = Number(hid);
          }
        }

        if (Object.keys(battleTeam).length === 0) {
          throw new Error(`无法获取阵容${formationId}数据`);
        }

        const teamSetParams = {
          lordWeaponId,
          petUId: "",
          battleTeam,
        };

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 使用阵容${formationId}: ${Object.values(battleTeam).join(", ")}`,
          type: "info",
        });

        // 2. 获取营地信息和挑战目标
        const res = await tokenStore.sendMessageWithPromise(
          tokenId,
          "club_getinfo",
          {},
          8000,
        );

        // 检查今日挑战次数
        const now = new Date();
        const todayKey =
          String(now.getFullYear() % 100).padStart(2, "0") +
          String(now.getMonth() + 1).padStart(2, "0") +
          String(now.getDate()).padStart(2, "0");
        const siege = res?.siege || {};
        const attackMap = siege.attackMap || {};
        const todayAttack = attackMap[todayKey] || {};
        const attackCnt = todayAttack.attackCnt || 0;
        const maxAttacks = 10;

        if (attackCnt >= maxAttacks) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 今日挑战次数已达上限(${attackCnt}/${maxAttacks})`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 今日已挑战 ${attackCnt}/${maxAttacks} 次`,
          type: "info",
        });

        const oppoMap = res?.club?.oppoMap || {};
        const opponents = Object.entries(oppoMap).sort(
          ([a], [b]) => Number(a) - Number(b),
        );

        if (opponents.length === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 没有可挑战的目标`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        // 3. 收集所有可挑战的防守者，随机顺序挑战（最多3次）
        const remainingAttacks = Math.min(maxAttacks - attackCnt, 3);
        let attackCount = 0;

        // 收集所有未击败的防守者到一个池子
        const availableTargets = [];
        for (const [oppoKey, opponent] of opponents) {
          const defenders = opponent.defenders || {};
          for (const [nodeId, defender] of Object.entries(defenders)) {
            if (!defender.defeated) {
              availableTargets.push({
                oppoKey,
                opponentName: opponent.name,
                nodeId,
                defender,
              });
            }
          }
        }

        if (availableTargets.length === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 所有目标均已击败或无可挑战目标`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        // 随机打乱顺序
        for (let i = availableTargets.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableTargets[i], availableTargets[j]] = [
            availableTargets[j],
            availableTargets[i],
          ];
        }

        for (const target of availableTargets) {
          if (shouldStop.value || attackCount >= remainingAttacks) break;

          const { opponentName, nodeId, defender } = target;

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 挑战目标(${attackCount + 1}/${remainingAttacks}): ${opponentName} - ${defender.name} (节点${nodeId})`,
            type: "info",
          });

          try {
            // 获取目标阵容
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "club_gettargetteam",
              { targetId: defender.roleId },
              5000,
            );

            // 发起挑战
            const attackRes = await tokenStore.sendMessageWithPromise(
              tokenId,
              "club_attack",
              {
                nodeId: Number(nodeId),
                targetId: defender.roleId,
                challengeCnt: defender.challengeCnt || 0,
                failCnt: defender.failCnt || 0,
                useItem: false,
                teamSetParams,
              },
              8000,
            );

            // 判断战斗结果
            const battleResult =
              attackRes?.battleData?.result?.accept?.ext?.curHP;
            const isWin = battleResult === 0;
            const rewardCount = attackRes?.reward?.length || 0;

            attackCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} ${isWin ? "胜利" : "失败"}: ${opponentName} - ${defender.name}${rewardCount > 0 ? ` (获得${rewardCount}个奖励)` : ""}`,
              type: isWin ? "success" : "error",
            });

            if (isWin) {
              defender.defeated = true;
            }
          } catch (err) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 挑战 ${defender.name} 失败: ${err.message || "未知错误"}`,
              type: "error",
            });
          }
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 营地挑战完成，共挑战 ${attackCount} 次`,
          type: "info",
        });

        tokenStatus.value[tokenId] = "completed";
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 营地挑战失败: ${error.message || "未知错误"}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量营地挑战结束");

    // 领取任务奖励
    await batchCampClaimTasks();
  };

  /**
   * 一键营地挑战宠物
   */
  const batchCampChallengePet = async () => {
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
          message: `=== 开始营地挑战宠物: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        if (shouldStop.value) return;

        // 获取我方阵容配置
        const [presetTeamResult, roleInfoResult] = await Promise.all([
          tokenStore.sendMessageWithPromise(
            tokenId,
            "presetteam_getinfo",
            {},
            5000,
          ),
          tokenStore.sendMessageWithPromise(
            tokenId,
            "role_getroleinfo",
            {},
            15000,
          ),
        ]);

        const lordWeaponId = roleInfoResult?.role?.lordWeaponId || 0;

        // 解析阵容数据，优先使用竞技场阵容
        const tokenSettings = loadSettings ? loadSettings(tokenId) : {};
        const formationId = String(tokenSettings?.arenaFormation || 1);
        const root = presetTeamResult?.presetTeamInfo?.presetTeamInfo || presetTeamResult?.presetTeamInfo || {};
        const teamInfoData = root[formationId]?.teamInfo || root["1"]?.teamInfo || {};

        const battleTeam = {};
        for (const [pos, hero] of Object.entries(teamInfoData)) {
          const hid = hero?.heroId ?? hero?.id;
          if (hid) {
            battleTeam[pos] = Number(hid);
          }
        }

        if (Object.keys(battleTeam).length === 0) {
          throw new Error(`无法获取阵容${formationId}数据`);
        }

        const teamSetParams = {
          lordWeaponId,
          petUId: "",
          battleTeam,
        };

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 使用阵容${formationId}: ${Object.values(battleTeam).join(", ")}`,
          type: "info",
        });

        // 挑战宠物
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 开始挑战营地宠物`,
          type: "info",
        });

        const attackRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "club_attackmonster",
          {
            useItem: false,
            teamSetParams,
          },
          8000,
        );

        const battleResult =
          attackRes?.battleData?.result?.accept?.ext?.curHP;
        const isWin = battleResult === 0;
        const rewardCount = attackRes?.reward?.length || 0;

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 挑战宠物${isWin ? "胜利" : "失败"}${rewardCount > 0 ? ` (获得${rewardCount}个奖励)` : ""}`,
          type: isWin ? "success" : "error",
        });

        tokenStatus.value[tokenId] = "completed";
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 营地挑战宠物失败: ${error.message || "未知错误"}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量营地挑战宠物结束");

    // 领取任务奖励
    await batchCampClaimTasks();
  };

  /**
   * 领取营地挑战任务奖励
   * 通过 role_getroleinfo 获取 siege.taskProgress 和 siege.taskClaimedMap
   * taskProgress: 1/2/3 是3个区域(值为1可领取), 4是挑战3次(值>=3可领取)
   * taskClaimedMap 中已有的 key 表示已领取
   */
  const batchCampClaimTasks = async () => {
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
          message: `=== 开始领取营地任务奖励: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        if (shouldStop.value) return;

        const roleInfoResult = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          15000,
        );

        const siege = roleInfoResult?.siege || {};
        const taskProgress = siege.taskProgress || {};
        const taskClaimedMap = siege.taskClaimedMap || {};

        // 可领取的 confId 列表
        // confId 与 taskClaimedMap key 的映射: 1→3, 2→2, 3→1, 4→4
        const claimedKeyMap = { 1: "3", 2: "2", 3: "1", 4: "4" };
        const claimableIds = [];
        // 1/2/3 区域: taskProgress 值为 1 表示可领取
        for (const id of [1, 2, 3]) {
          if (taskProgress[String(id)] === 1 && !taskClaimedMap[claimedKeyMap[id]]) {
            claimableIds.push(id);
          }
        }
        // 4 挑战3次: taskProgress 值 >= 3 表示可领取
        if (
          (taskProgress["4"] || 0) >= 3 &&
          !taskClaimedMap[claimedKeyMap[4]]
        ) {
          claimableIds.push(4);
        }

        if (claimableIds.length === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 没有可领取的营地任务奖励`,
            type: "warning",
          });
          tokenStatus.value[tokenId] = "completed";
          return;
        }

        let claimedCount = 0;
        for (const confId of claimableIds) {
          if (shouldStop.value) break;
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "club_taskclaim",
              { confId },
              5000,
            );
            claimedCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 成功领取任务 ${confId} 奖励`,
              type: "success",
            });
          } catch (err) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 领取任务 ${confId} 失败: ${err.message || "未知错误"}`,
              type: "error",
            });
          }
        }

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 营地任务奖励领取完成，共领取 ${claimedCount} 个`,
          type: "info",
        });

        tokenStatus.value[tokenId] = "completed";
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 领取营地任务奖励失败: ${error.message || "未知错误"}`,
          type: "error",
        });
      } finally {
        tokenStore.closeWebSocketConnection(tokenId);
        releaseConnectionSlot();
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 连接已关闭`,
          type: "info",
        });
      }
    });

    await Promise.all(taskPromises);
    isRunning.value = false;
    currentRunningTokenId.value = null;
    message.success("批量领取营地任务奖励结束");
  };

  return {
    batchCampChallenge,
    batchCampChallengePet,
    batchCampClaimTasks,
  };
}
