/**
 * 车辆相关工具函数
 */

// 四小时毫秒数
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/**
 * 标准化车辆数据
 * @param {object} raw - 原始车辆数据
 * @returns {Array} - 标准化后的车辆列表
 */
export const normalizeCars = (raw) => {
  const r = raw || {};
  const body = r.body || r;
  const roleCar = body.roleCar || body.rolecar || {};

  // 优先从 roleCar.carDataMap 解析（id -> info）
  const carMap = roleCar.carDataMap || roleCar.cardatamap;
  if (carMap && typeof carMap === "object") {
    return Object.entries(carMap).map(([id, info], idx) => ({
      key: idx,
      id,
      ...(info || {}),
    }));
  }

  // 兜底
  let arr =
    body.cars || body.list || body.data || body.carList || body.vehicles || [];
  if (!Array.isArray(arr) && typeof arr === "object" && arr !== null)
    arr = Object.values(arr);
  if (Array.isArray(body) && arr.length === 0) arr = body;
  return (Array.isArray(arr) ? arr : []).map((it, idx) => ({
    key: idx,
    ...it,
  }));
};

/**
 * 获取品质标签
 * @param {number} color - 颜色等级
 * @returns {string} - 品质标签
 */
export const gradeLabel = (color) => {
  const map = {
    1: "绿·普通",
    2: "蓝·稀有",
    3: "紫·史诗",
    4: "橙·传说",
    5: "红·神话",
    6: "金·传奇",
  };
  return map[color] || "未知";
};

/**
 * 大奖配置
 */
const bigPrizes = [
  { type: 3, itemId: 3201, value: 10 },
  { type: 3, itemId: 1001, value: 10 },
  { type: 3, itemId: 1022, value: 2000 },
  { type: 2, itemId: 0, value: 2000 },
  { type: 3, itemId: 1023, value: 5 },
  { type: 3, itemId: 1022, value: 2500 },
  { type: 3, itemId: 1001, value: 12 },
];

/**
 * 判断是否是大奖
 * @param {Array} rewards - 奖励列表
 * @returns {boolean} - 是否是大奖
 */
export const isBigPrize = (rewards) => {
  if (!Array.isArray(rewards)) return false;
  return bigPrizes.some((p) =>
    rewards.find(
      (r) =>
        r.type === p.type &&
        r.itemId === p.itemId &&
        Number(r.value || 0) >= p.value
    )
  );
};

/**
 * 计算赛车刷新票数量
 * @param {Array} rewards - 奖励列表
 * @returns {number} - 刷新票数量
 */
export const countRacingRefreshTickets = (rewards) => {
  if (!Array.isArray(rewards)) return 0;
  return rewards.reduce(
    (acc, r) =>
      acc + (r.type === 3 && r.itemId === 35002 ? Number(r.value || 0) : 0),
    0
  );
};

/**
 * 判断是否应该发车
 * @param {object} car - 车辆对象
 * @param {number} tickets - 刷新票数量
 * @param {number} minColor - 最小颜色等级
 * @returns {boolean} - 是否应该发车
 */
export const shouldSendCar = (car, tickets, minColor = 4) => {
  const color = Number(car?.color || 0);
  const rewards = Array.isArray(car?.rewards) ? car.rewards : [];
  const racingTickets = countRacingRefreshTickets(rewards);
  if (tickets >= 6) {
    return (
      color >= minColor &&
      (color >= 5 || racingTickets >= 4 || isBigPrize(rewards))
    );
  }
  return color >= minColor || racingTickets >= 2 || isBigPrize(rewards);
};

/**
 * 判断是否可以收取
 * @param {object} car - 车辆对象
 * @returns {boolean} - 是否可以收取
 */
export const canClaim = (car) => {
  const t = Number(car?.sendAt || 0);
  if (!t) return false;
  const tsMs = t < 1e12 ? t * 1000 : t;
  return Date.now() - tsMs >= FOUR_HOURS_MS;
};

/**
 * 创建车辆操作管理器
 * @param {object} options - 配置选项
 * @param {object} options.tokenStore - Token存储
 * @param {object} options.connectionManager - 连接管理器
 * @param {object} options.batchSettings - 批量设置
 * @param {function} options.addLog - 日志添加函数
 * @returns {object} - 车辆操作管理器对象
 */
export function createCarManager({ tokenStore, connectionManager, batchSettings, addLog }) {
  const { ensureConnection, closeConnection } = connectionManager;

  /**
   * 智能发车
   * @param {string} tokenId - Token ID
   * @param {object} token - Token对象
   * @param {Array} tokens - Tokens列表
   * @param {object} tokenStatus - Token状态对象
   * @param {object} shouldStop - 停止标志ref
   */
  const smartSendCar = async (tokenId, token, tokens, tokenStatus, shouldStop) => {
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始智能发车: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId, tokens);

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
        10000
      );
      let carList = normalizeCars(res?.body ?? res);

      // 2. Fetch Tickets
      let refreshTickets = 0;
      try {
        const roleRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          10000
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

        if (Number(car.sendAt || 0) !== 0) continue; // Already sent

        try {
          // Check if we should send immediately
          // 当启用金砖保底时，强制使用高票数的判断逻辑（严格模式），避免因票数不足而提前发车
          const effectiveTickets = batchSettings.useGoldRefreshFallback ? 999 : refreshTickets;

          if (shouldSendCar(car, effectiveTickets, batchSettings.carMinColor)) {
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
              10000
            );
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }

          // Try to refresh
          let shouldRefresh = false;
          const free = Number(car.refreshCount ?? 0) === 0;
          // 启用金砖刷新保底：当且仅当设置了保底且无免费次数、无刷新券时，允许继续刷新
          const useGoldFallback = batchSettings.useGoldRefreshFallback && !free && refreshTickets < 6;

          if (refreshTickets >= 6) shouldRefresh = true;
          else if (free) shouldRefresh = true;
          else if (useGoldFallback) {
            shouldRefresh = true;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 车辆[${gradeLabel(car.color)}]启用金砖刷新保底`,
              type: "warning",
            });
          }
          else {
            // No tickets and not free, just send
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
              10000
            );
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }

          // Refresh loop
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
              10000
            );
            const data = resp?.car || resp?.body?.car || resp;

            // Update local car info
            if (data && typeof data === "object") {
              if (data.color != null) car.color = Number(data.color);
              if (data.refreshCount != null)
                car.refreshCount = Number(data.refreshCount);
              if (data.rewards != null) car.rewards = data.rewards;
            }

            // Update tickets
            try {
              const roleRes = await tokenStore.sendMessageWithPromise(
                tokenId,
                "role_getroleinfo",
                {},
                5000
              );
              refreshTickets = Number(
                roleRes?.role?.items?.[35002]?.quantity || 0
              );
            } catch (_) {}

            // Check if good enough now
            if (shouldSendCar(car, batchSettings.useGoldRefreshFallback ? 999 : refreshTickets, batchSettings.carMinColor)) {
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
                10000
              );
              await new Promise((r) => setTimeout(r, 500));
              break;
            }

            // Check if we should continue refreshing
            const freeNow = Number(car.refreshCount ?? 0) === 0;
            // 金砖保底：如果开启了金砖保底，则允许在无票时继续刷新
            const useGoldFallbackNow = batchSettings.useGoldRefreshFallback && !freeNow && refreshTickets < 6;

            if (refreshTickets >= 6) shouldRefresh = true;
            else if (freeNow) shouldRefresh = true;
            else if (useGoldFallbackNow) shouldRefresh = true;
            else {
              addLog({
                time: new Date().toLocaleTimeString(),
                message: `${token.name} 车辆[${gradeLabel(car.color)}]刷新结束（无票），直接发车`,
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
                10000
              );
              await new Promise((r) => setTimeout(r, 500));
              break;
            }

            await new Promise((r) => setTimeout(r, 1000));
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

      tokenStatus[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 智能发车完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `智能发车失败: ${error.message}`,
        type: "error",
      });
    } finally {
      closeConnection(tokenId, token.name);
    }
  };

  /**
   * 一键收车
   * @param {string} tokenId - Token ID
   * @param {object} token - Token对象
   * @param {Array} tokens - Tokens列表
   * @param {object} tokenStatus - Token状态对象
   * @param {object} shouldStop - 停止标志ref
   * @param {Array} CarresearchItem - 车辆研究配置
   */
  const claimCars = async (tokenId, token, tokens, tokenStatus, shouldStop, CarresearchItem) => {
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键收车: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId, tokens);

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
        10000
      );
      let carList = normalizeCars(res?.body ?? res);
      let refreshlevel = res?.roleCar?.research?.[1] || 0;

      // 2. Claim Cars
      let claimedCount = 0;
      for (const car of carList) {
        if (shouldStop.value) break;
        if (canClaim(car)) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "car_claim",
              { carId: String(car.id) },
              10000
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
              5000
            );
            let refreshpieces = Number(
              roleRes?.role?.items?.[35009]?.quantity || 0
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
                  5000
                );
                refreshlevel++;

                // 更新refreshpieces数量
                const updatedRoleRes = await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "role_getroleinfo",
                  {},
                  5000
                );
                refreshpieces = Number(
                  updatedRoleRes?.role?.items?.[35009]?.quantity || 0
                );

                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 执行车辆改装升级，当前等级: ${refreshlevel}`,
                  type: "success",
                });

                await new Promise((r) => setTimeout(r, 300));
              } catch (e) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `${token.name} 车辆改装升级失败: ${e.message}`,
                  type: "error",
                });
                break; // 升级失败时跳出循环
              }
            }
          } catch (e) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name} 收车失败: ${e.message}`,
              type: "warning",
            });
          }
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (claimedCount === 0) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} 没有可收取的车辆`,
          type: "info",
        });
      }

      tokenStatus[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 收车完成，共收取 ${claimedCount} 辆 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `${token.name} 收车失败: ${error.message}`,
        type: "error",
      });
    } finally {
      closeConnection(tokenId, token.name);
    }
  };

  return {
    smartSendCar,
    claimCars,
  };
}
