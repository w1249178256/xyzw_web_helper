/**
 * WebSocket连接管理器
 */

// 全局连接队列控制 - 限制并发连接数
export const connectionQueue = { active: 0 };

/**
 * 创建连接管理器
 * @param {object} options - 配置选项
 * @param {object} options.tokenStore - Token存储
 * @param {object} options.batchSettings - 批量设置
 * @param {function} options.addLog - 日志添加函数
 * @returns {object} - 连接管理器对象
 */
export function createConnectionManager({ tokenStore, batchSettings, addLog }) {
  /**
   * 等待连接槽位
   */
  const waitForConnectionSlot = async () => {
    while (connectionQueue.active >= batchSettings.maxActive) {
      await new Promise((r) => setTimeout(r, 1000));
    }
    connectionQueue.active++;
  };

  /**
   * 释放连接槽位
   */
  const releaseConnectionSlot = () => {
    if (connectionQueue.active > 0) {
      connectionQueue.active--;
    }
  };

  /**
   * 等待连接建立
   * @param {string} tokenId - Token ID
   * @param {number} timeout - 超时时间
   */
  const waitForConnection = async (tokenId, timeout = batchSettings.connectionTimeout) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const status = tokenStore.getWebSocketStatus(tokenId);
      if (status === "connected") return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  };

  /**
   * 确保连接建立
   * @param {string} tokenId - Token ID
   * @param {object} tokens - Tokens列表
   * @param {number} maxRetries - 最大重试次数
   */
  const ensureConnection = async (tokenId, tokens, maxRetries = 2) => {
    const latestToken = tokens.find((t) => t.id === tokenId);
    if (!latestToken) {
      throw new Error(`Token not found: ${tokenId}`);
    }

    let status = tokenStore.getWebSocketStatus(tokenId);
    let connected = status === "connected";

    if (!connected) {
      // 等待连接槽位，限制并发连接数
      await waitForConnectionSlot();

      addLog({
        time: new Date().toLocaleTimeString(),
        message: `正在连接... (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
        type: "info",
      });

      tokenStore.createWebSocketConnection(
        tokenId,
        latestToken.token,
        latestToken.wsUrl
      );
      connected = await waitForConnection(tokenId);

      if (!connected && maxRetries > 0) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `连接超时，尝试重连...`,
          type: "warning",
        });

        tokenStore.closeWebSocketConnection(tokenId);
        await new Promise((r) => setTimeout(r, batchSettings.reconnectDelay));

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `正在重连...`,
          type: "info",
        });

        const refreshedToken = tokens.find((t) => t.id === tokenId);
        tokenStore.createWebSocketConnection(
          tokenId,
          refreshedToken.token,
          refreshedToken.wsUrl
        );

        connected = await waitForConnection(tokenId);
      }

      if (!connected) {
        // 连接失败，释放槽位
        releaseConnectionSlot();
        throw new Error("连接失败 (重试后仍超时)");
      }
    }

    // 连接成功，槽位保持占用，直到任务完成后手动释放

    // Initialize Game Data (Critical for Battle Version and Session)
    try {
      // Fetch Role Info first (Standard flow)
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "role_getroleinfo",
        {},
        5000
      );

      // Fetch Battle Version
      const res = await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_startlevel",
        {},
        5000
      );
      if (res?.battleData?.version) {
        tokenStore.setBattleVersion(res.battleData.version);
      }
    } catch (e) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `初始化数据失败: ${e.message}`,
        type: "warning",
      });
    }

    return true;
  };

  /**
   * 关闭连接并释放槽位
   * @param {string} tokenId - Token ID
   * @param {string} tokenName - Token名称
   */
  const closeConnection = (tokenId, tokenName) => {
    tokenStore.closeWebSocketConnection(tokenId);
    releaseConnectionSlot();
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `${tokenName} 连接已关闭  (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
      type: "info",
    });
  };

  return {
    connectionQueue,
    waitForConnectionSlot,
    releaseConnectionSlot,
    waitForConnection,
    ensureConnection,
    closeConnection,
  };
}

/**
 * 活动状态辅助函数
 * @returns {object} - 活动状态
 */
export const getActivityStatus = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // 计算当前活动周
  const start = new Date("2025-12-12T12:00:00"); // 起始时间：黑市周开始
  const weekDuration = 7 * 24 * 60 * 60 * 1000; // 一周毫秒数
  const cycleDuration = 3 * weekDuration; // 三周期毫秒数

  const elapsed = now - start;
  let currentActivityWeek = null;
  
  if (elapsed >= 0) {
    const cyclePosition = elapsed % cycleDuration;
    if (cyclePosition < weekDuration) {
      currentActivityWeek = "黑市周";
    } else if (cyclePosition < 2 * weekDuration) {
      currentActivityWeek = "招募周";
    } else {
      currentActivityWeek = "宝箱周";
    }
  }

  return {
    // 车活动开放 (周一到周三)
    isCarActivityOpen: day >= 1 && day <= 3,
    // 梦境活动开放 (周日、周一、周三、周四)
    ismengjingActivityOpen: day === 0 || day === 1 || day === 3 || day === 4,
    // 宝库活动开放 (非周一、周二)
    isbaokuActivityOpen: day !== 1 && day !== 2,
    // 竞技场活动开放 (6点到22点)
    isarenaActivityOpen: hour >= 6 && hour < 22,
    // 当前活动周
    currentActivityWeek,
    // 怪异塔活动开放 (黑市周)
    isWeirdTowerActivityOpen: currentActivityWeek === "黑市周",
  };
};

/**
 * 日期辅助函数
 * @returns {number} - 今日开始时间戳（秒）
 */
export const getTodayStartSec = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

/**
 * 检查今日是否可用
 * @param {number} lastTimeSec - 上次使用时间戳（秒）
 * @returns {boolean} - 今日是否可用
 */
export const isTodayAvailable = (lastTimeSec) => {
  if (!lastTimeSec || typeof lastTimeSec !== "number") return true;
  return lastTimeSec < getTodayStartSec();
};

/**
 * 计算月度任务进度
 * @returns {number} - 进度百分比（0-1）
 */
export const calculateMonthProgress = () => {
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = now.getDate();
  return Math.min(1, Math.max(0, dayOfMonth / daysInMonth));
};

/**
 * 竞技场目标ID选择
 * @param {object} targets - 目标列表
 * @returns {number|null} - 目标ID
 */
export const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0];

  if (candidate?.roleId) return candidate.roleId;
  if (candidate?.id) return candidate.id;
  return targets?.roleId || targets?.id;
};
