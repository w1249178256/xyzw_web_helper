/**
 * 车辆类任务
 * 包含: batchSmartSendCar, batchClaimCars
 */

import { CarresearchItem } from "./constants.js";

/**
 * 创建车辆类任务执行器
 * @param {Object} deps - 依赖项
 * @returns {Object} 任务函数集合
 */
export function createTasksCar(deps) {
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
    normalizeCars,
    gradeLabel,
    shouldSendCar,
    canClaim,
    isBigPrize,
    countRacingRefreshTickets,
    delayConfig,
  } = deps;

  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

  /**
   * 智能发车
   */
  const batchSmartSendCar = async () => {
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
          message: `=== 开始智能发车: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        // 1. Fetch Car Info
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 获取车辆信息...`,
          type: "info",
        });
        const res = await tokenStore.sendMessageWithPromise(
          tokenId,
          "car_getrolecar",
          {},
          10000,
        );
        let carList = normalizeCars(res?.body ?? res);

        // 2. Fetch Tickets
        let refreshTickets = 0;
        try {
          const roleRes = await tokenStore.sendMessageWithPromise(
            tokenId,
            "role_getroleinfo",
            {},
            10000,
          );
          const qty = roleRes?.role?.items?.[35002]?.quantity;
          refreshTickets = Number(qty || 0);
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 剩余刷新次数: ${refreshTickets}`,
            type: "info",
          });
        } catch (_) {}

        // 3. Process Cars
        for (const car of carList) {
          if (shouldStop.value) break;

          if (Number(car.sendAt || 0) !== 0) continue;

          try {
            if (shouldSendCar(car, refreshTickets)) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 车辆[${gradeLabel(car.color)}]满足条件，直接发车`,
                type: "info",
              });
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "car_send",
                {
                  carId: String(car.id),
                  helperId: 0,
                  text: "",
                  isUpgrade: false,
                },
                10000,
              );
              await new Promise((r) => setTimeout(r, delayConfig.action));
              continue;
            }

            let shouldRefresh = false;
            const free = Number(car.refreshCount ?? 0) === 0;
            if (refreshTickets >= 6) shouldRefresh = true;
            else if (free) shouldRefresh = true;
            else {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 车辆[${gradeLabel(car.color)}]不满足条件且无刷新次数，直接发车`,
                type: "warning",
              });
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "car_send",
                {
                  carId: String(car.id),
                  helperId: 0,
                  text: "",
                  isUpgrade: false,
                },
                10000,
              );
              await new Promise((r) => setTimeout(r, delayConfig.action));
              continue;
            }

            while (shouldRefresh && !shouldStop.value) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 车辆[${gradeLabel(car.color)}]尝试刷新...`,
                type: "info",
              });
              const resp = await tokenStore.sendMessageWithPromise(
                tokenId,
                "car_refresh",
                { carId: String(car.id) },
                10000,
              );
              const data = resp?.car || resp?.body?.car || resp;

              if (data && typeof data === "object") {
                if (data.color != null) car.color = Number(data.color);
                if (data.refreshCount != null)
                  car.refreshCount = Number(data.refreshCount);
                if (data.rewards != null) car.rewards = data.rewards;
              }

              try {
                const roleRes = await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "role_getroleinfo",
                  {},
                  5000,
                );
                refreshTickets = Number(
                  roleRes?.role?.items?.[35002]?.quantity || 0,
                );
              } catch (_) {}

              if (shouldSendCar(car, refreshTickets)) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 刷新后车辆[${gradeLabel(car.color)}]满足条件，发车`,
                  type: "success",
                });
                await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "car_send",
                  {
                    carId: String(car.id),
                    helperId: 0,
                    text: "",
                    isUpgrade: false,
                  },
                  10000,
                );
                await new Promise((r) => setTimeout(r, delayConfig.action));
                break;
              }

              const freeNow = Number(car.refreshCount ?? 0) === 0;
              if (refreshTickets >= 6) shouldRefresh = true;
              else if (freeNow) shouldRefresh = true;
              else {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 刷新后车辆[${gradeLabel(car.color)}]仍不满足条件且无刷新次数，发车`,
                  type: "warning",
                });
                await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "car_send",
                  {
                    carId: String(car.id),
                    helperId: 0,
                    text: "",
                    isUpgrade: false,
                  },
                  10000,
                );
                await new Promise((r) => setTimeout(r, delayConfig.action));
                break;
              }

              await new Promise((r) => setTimeout(r, delayConfig.refresh));
            }
          } catch (carError) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 车辆[${gradeLabel(car.color)}]处理失败: ${carError.message}，跳过该车辆`,
              type: "error",
            });
            continue;
          }
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 智能发车完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `智能发车失败: ${error.message}`,
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
    message.success("批量智能发车结束");
  };

  /**
   * 一键收车
   */
  const batchClaimCars = async () => {
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
          message: `=== 开始一键收车: ${token.name} ===`,
          type: "info",
        });

        await ensureConnection(tokenId);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 获取车辆信息...`,
          type: "info",
        });
        const res = await tokenStore.sendMessageWithPromise(
          tokenId,
          "car_getrolecar",
          {},
          10000,
        );
        let carList = normalizeCars(res?.body ?? res);
        let refreshlevel = res?.roleCar?.research?.[1] || 0;

        let claimedCount = 0;
        for (const car of carList) {
          if (shouldStop.value) break;
          if (canClaim(car)) {
            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "car_claim",
                { carId: String(car.id) },
                10000,
              );
              claimedCount++;
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 收车成功: ${gradeLabel(car.color)}`,
                type: "success",
              });
              const roleRes = await tokenStore.sendMessageWithPromise(
                tokenId,
                "role_getroleinfo",
                {},
                5000,
              );
              let refreshpieces = Number(
                roleRes?.role?.items?.[35009]?.quantity || 0,
              );
              while (
                refreshlevel < CarresearchItem.length &&
                refreshpieces >= CarresearchItem[refreshlevel] &&
                !shouldStop.value
              ) {
                try {
                  await tokenStore.sendMessageWithPromise(
                    tokenId,
                    "car_research",
                    { researchId: 1 },
                    5000,
                  );
                  refreshlevel++;

                  const updatedRoleRes = await tokenStore.sendMessageWithPromise(
                    tokenId,
                    "role_getroleinfo",
                    {},
                    5000,
                  );
                  refreshpieces = Number(
                    updatedRoleRes?.role?.items?.[35009]?.quantity || 0,
                  );

                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 执行车辆改装升级，当前等级: ${refreshlevel}`,
                    type: "success",
                  });

                  await new Promise((r) => setTimeout(r, delayConfig.action));
                } catch (e) {
                  addLog({
                    time: new Date().toLocaleTimeString(),
                    message: `${token.name} 车辆改装升级失败: ${e.message}`,
                    type: "error",
                  });
                  break;
                }
              }
            } catch (e) {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 收车失败: ${e.message}`,
                type: "warning",
              });
            }
            await new Promise((r) => setTimeout(r, delayConfig.action));
          }
        }

        if (claimedCount === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 没有可收取的车辆`,
            type: "info",
          });
        }

        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 收车完成，共收取 ${claimedCount} 辆 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        tokenStatus.value[tokenId] = "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 收车失败: ${error.message}`,
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
    message.success("批量一键收车结束");
  };

  return {
    batchSmartSendCar,
    batchClaimCars,
  };
}
