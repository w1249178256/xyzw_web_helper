import { isDungeonOpen, merchantConfig } from "@/utils/dreamConstants";

/**
 * 梦境类任务
 * 包含: batchmengjing, batchBuyDreamItems
 */

/**
 * 创建梦境类任务执行器
 * @param {object} deps - 依赖项
 * @returns {object} 任务函数集合
 */
export function createTasksDungeon(deps) {
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
   * 一键梦境
   */
  const batchmengjing = async () => {
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
          message: `=== 开始咸王梦境: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);
        if (shouldStop.value) return;
        const mjbattleTeam = { 0: 107 };
        const dayOfWeek = new Date().getDay();
        if (
          dayOfWeek === 0 ||
          dayOfWeek === 1 ||
          dayOfWeek === 3 ||
          dayOfWeek === 4
        ) {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "dungeon_selecthero",
            { battleTeam: mjbattleTeam },
            5000,
          );
          await new Promise((r) => setTimeout(r, 500));
          tokenStatus.value[tokenId] = "completed";
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 咸王梦境已完成 ===`,
            type: "success",
          });
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 当前未在开放时间 ===`,
            type: "error",
          });
        }
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 咸王梦境失败: ${error.message || "未知错误"}`,
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
    message.success("批量梦境结束");
  };

  /**
   * 一键购买梦境商品
   */
  const batchBuyDreamItems = async () => {
    if (selectedTokens.value.length === 0) return;

    if (!isDungeonOpen()) {
      message.warning("当前不是梦境开放时间（周三/周四/周日/周一）");
      return;
    }

    const purchaseList = batchSettings.dreamPurchaseList || [];
    if (purchaseList.length === 0) {
      message.warning("请先在设置中配置购买清单");
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
      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始梦境购买: ${token.name} ===`,
          type: "info",
        });
        await ensureConnection(tokenId);

        // 1. 获取角色信息以获得商店数据
        const roleInfo = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          15000,
        );

        if (
          !roleInfo ||
          !roleInfo.role ||
          !roleInfo.role.dungeon ||
          !roleInfo.role.dungeon.merchant
        ) {
          throw new Error("无法获取梦境商店数据");
        }

        const merchantData = roleInfo.role.dungeon.merchant;
        const levelId = roleInfo.role.levelId || 0;
        let successCount = 0;
        let failCount = 0;

        const operations = [];

        for (const itemKey of purchaseList) {
          const [targetMerchantId, targetItemIndex] = itemKey
            .split("-")
            .map(Number);

          const merchantItems = merchantData[targetMerchantId];
          if (merchantItems) {
            for (let pos = 0; pos < merchantItems.length; pos++) {
              if (merchantItems[pos] === targetItemIndex) {
                operations.push({
                  merchantId: targetMerchantId,
                  index: targetItemIndex,
                  pos,
                });
              }
            }
          }
        }
        operations.sort((a, b) => {
          if (a.merchantId !== b.merchantId) return a.merchantId - b.merchantId;
          return b.pos - a.pos;
        });

        for (const op of operations) {
          if (shouldStop.value) break;

          if (levelId < 4000) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 关卡数小于4000，无法购买`,
              type: "warning",
            });
            return;
          }

          try {
            const response = await tokenStore.sendMessageWithPromise(
              tokenId,
              "dungeon_buymerchant",
              {
                id: op.merchantId,
                index: op.index,
                pos: op.pos,
              },
              5000,
            );

            if (response && response.reward) {
              successCount++;
              const merchantName = merchantConfig[op.merchantId]
                ? merchantConfig[op.merchantId].name
                : `商人${op.merchantId}`;
              const itemName =
                merchantConfig[op.merchantId] &&
                merchantConfig[op.merchantId].items[op.index]
                  ? merchantConfig[op.merchantId].items[op.index]
                  : `商品${op.index}`;

              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 购买成功: ${merchantName} - ${itemName}`,
                type: "success",
              });
            } else {
              failCount++;
            }
          } catch (err) {
            failCount++;
          }
          await new Promise((r) => setTimeout(r, 500));
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 梦境购买完成: 成功${successCount}, 失败${failCount} ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 梦境购买失败: ${error.message || "未知错误"}`,
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
    message.success("批量梦境购买结束");
  };

  return {
    batchmengjing,
    batchBuyDreamItems,
  };
}
