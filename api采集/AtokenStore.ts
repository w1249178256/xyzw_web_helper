import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { g_utils, ProtoMsg } from "@/utils/bonProtocol";
import { gameLogger, tokenLogger, wsLogger } from "@/utils/logger";
import { XyzwWebSocketClient } from "@/utils/xyzwWebSocket";

import { emitPlus } from "./events/index.js";
import useIndexedDB from "@/hooks/useIndexedDB";
import { transformToken } from "@/utils/token";
import { generateRandomSeed } from "@/utils/randomSeed";

const { getArrayBuffer } = useIndexedDB();

declare interface TokenData {
  id: string;
  name: string;
  token: string; // 原始Base64 token
  wsUrl: string | null; // 可选的自定义WebSocket URL
  server: string;
  remark?: string; // 备注信息
  importMethod?: 'manual' | 'bin' | 'url' | 'wxQrcode'; // 导入方式：manual（手动）、bin文件、url链接或微信二维码
  sourceUrl?: string; // 当importMethod为url时，存储url链接
  upgradedToPermanent?: boolean; // 是否升级为长期有效
  upgradedAt?: string; // 升级时间
  updatedAt?: string; // 更新时间
  base64Token?: string; // 存储原始的Base64 token用于重连
  originalStorageKey?: string; // 原始存储到IndexedDB时使用的key，对于bin/wxQrcode导入是MD5哈希值
}

declare interface WebSocketConnection {
  status: "connecting" | "connected" | "disconnected" | "error";
  client: XyzwWebSocketClient | null;
  lastError: { timestamp: string; error: string } | null;
  tokenId: string;
  sessionId: string;
  createdAt: string;
  lastMessageAt: string | null;
  randomSeedSynced?: boolean;
  lastRandomSeedSource?: number | null;
  lastRandomSeed?: number | null;
}

declare type WebCtx = Record<string, Partial<WebSocketConnection>>;

declare interface ConnectLock {
  tokenId: string;
  operation: "connect" | "disconnect";
  timestamp: number;
  sessionId: string;
}
declare type LockCtx = Record<string, Partial<ConnectLock>>;

export const gameTokens = useLocalStorage<TokenData[]>("gameTokens", []);
export const hasTokens = computed(() => gameTokens.value.length > 0);
export const selectedTokenId = useLocalStorage("selectedTokenId", "");
export const selectedToken = computed(() => {
  return gameTokens.value?.find((token) => token.id === selectedTokenId.value);
});
export const selectedRoleInfo = useLocalStorage<any>("selectedRoleInfo", null);

// 跨标签页连接协调
const activeConnections = useLocalStorage("activeConnections", {});

/**
 * 重构后的Token管理存储
 * 以名称-token列表形式管理多个游戏角色
 */
export const useTokenStore = defineStore("tokens", () => {
  const wsConnections = ref<WebCtx>({}); // WebSocket连接状态
  const connectionLocks = ref<LockCtx>({}); // 连接操作锁，防止竞态条件

  // 连接限流相关状态
  const connectionQueue = ref<string[]>([]); // 连接请求队列
  const activeConnectionCount = ref(0); // 当前活跃连接数
  const maxConcurrentConnections = ref(5); // 最大并发连接数（最多保持5个连接）
  const connectionDelay = ref(500); // 连接间隔时间(ms)
  const connectionQueuePositions = ref<Record<string, number>>({}); // 每个token在队列中的位置
  const connectionQueueTimestamps = ref<Record<string, number>>({}); // 每个token加入队列的时间

  // 任务执行状态跟踪
  const runningTasksCount = ref(0); // 当前运行的任务数量
  const scheduledTasksQueue = ref<number>(0); // 排队的定时任务数量
  const isTasksRunning = ref(false); // 是否有任务正在执行
  const shouldCloseConnectionsAfterTasks = ref(false); // 任务完成后是否关闭连接

  // 计算属性：获取排队中的token列表
  const queuedTokens = computed(() => {
    return [...connectionQueue.value];
  });

  // 计算属性：获取预计等待时间
  const getEstimatedWaitTime = (tokenId: string) => {
    const position = connectionQueuePositions.value[tokenId];
    if (position === undefined || position < 0) return 0;

    // 预计等待时间 = (当前活跃连接数 + 队列位置) * 连接间隔时间
    return (activeConnectionCount.value + position) * connectionDelay.value;
  };

  // 游戏数据存储
  const gameData = ref({
    roleInfo: null,
    legionInfo: null,
    commonActivityInfo: null, // 消耗活动进度
    bossTowerInfo: null, //宝库
    evoTowerInfo: null, //怪异塔
    presetTeam: null,
    battleVersion: null as number | null, // 战斗版本号
    studyStatus: {
      isAnswering: false,
      questionCount: 0,
      answeredCount: 0,
      status: "", // '', 'starting', 'answering', 'claiming_rewards', 'completed'
      timestamp: null,
    },
    lastUpdated: null as string | null,
  });

  // 获取当前选中token的角色信息
  const selectedTokenRoleInfo = computed(() => {
    return gameData.value.roleInfo;
  });

  const readStatisticsValue = (stats: any, key: string) => {
    if (!stats) return undefined;
    try {
      if (typeof stats.get === "function") {
        return stats.get(key);
      }
      if (Object.prototype.hasOwnProperty.call(stats, key)) {
        return stats[key];
      }
    } catch (error) {
      gameLogger.warn("读取统计数据失败:", error);
    }
    return undefined;
  };

  const extractLastLoginTimestamp = (payload: any) => {
    if (!payload) return null;

    const candidateSources = [
      payload?.role?.statistics,
      payload?.statistics,
      payload?.role?.statisticsTime,
      payload?.statisticsTime,
    ];

    const candidateKeys = [
      "last:login:time",
      "lastLoginTime",
      "last_login_time",
    ];

    for (const stats of candidateSources) {
      if (!stats) continue;
      for (const key of candidateKeys) {
        const value = readStatisticsValue(stats, key);
        if (value !== undefined && value !== null) {
          const numeric = Number(value);
          if (!Number.isNaN(numeric) && numeric > 0) {
            return numeric;
          }
        }
      }
    }
    return null;
  };

  const syncRandomSeedFromStatistics = (
    tokenId: string,
    rolePayload: any,
    client: XyzwWebSocketClient | null,
  ) => {
    if (!client) return;
    const connection = wsConnections.value[tokenId];
    if (!connection || connection.status !== "connected") {
      return;
    }

    const lastLoginTime = extractLastLoginTimestamp(rolePayload);
    if (!lastLoginTime) {
      return;
    }

    if (
      connection.randomSeedSynced &&
      connection.lastRandomSeedSource === lastLoginTime
    ) {
      return;
    }

    const randomSeed = generateRandomSeed(lastLoginTime);

    try {
      client.send("system_custom", {
        key: "randomSeed",
        value: randomSeed,
      });
      connection.randomSeedSynced = true;
      connection.lastRandomSeedSource = lastLoginTime;
      connection.lastRandomSeed = randomSeed;
      wsLogger.info(`同步 randomSeed [${tokenId}]`, {
        lastLoginTime,
        randomSeed,
      });
    } catch (error) {
      wsLogger.error(`发送 randomSeed 失败 [${tokenId}]`, error);
    }
  };

  // Token管理
  const addToken = (tokenData: TokenData) => {
    const newToken = {
      id: "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      name: tokenData.name,
      token: tokenData.token, // 保存原始Base64 token
      wsUrl: tokenData.wsUrl || null, // 可选的自定义WebSocket URL
      server: tokenData.server || "",
      remark: tokenData.remark || "", // 备注信息
      level: tokenData.level || 1,
      profession: tokenData.profession || "",
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      isActive: true,
      // URL获取相关信息
      sourceUrl: tokenData.sourceUrl || null, // Token来源URL（用于刷新）
      importMethod: tokenData.importMethod || "manual", // 导入方式：manual 或 url
      base64Token: tokenData.token, // 存储原始的Base64 token用于重连
      originalStorageKey: tokenData.originalStorageKey, // 保存原始存储到IndexedDB时使用的key
    };

    gameTokens.value.push(newToken);
    return newToken;
  };

  const updateToken = (tokenId: string, updates: Partial<TokenData>) => {
    const index = gameTokens.value.findIndex((token) => token.id === tokenId);
    if (index !== -1) {
      gameTokens.value[index] = {
        ...gameTokens.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return true;
    }
    return false;
  };

  const removeToken = (tokenId: string) => {
    gameTokens.value = gameTokens.value.filter((token) => token.id !== tokenId);

    // 关闭对应的WebSocket连接
    if (wsConnections.value[tokenId]) {
      closeWebSocketConnection(tokenId);
    }

    // 如果删除的是当前选中token，清除选中状态
    if (selectedTokenId.value === tokenId) {
      selectedTokenId.value = null;
    }

    return true;
  };

  const selectToken = (tokenId: string, forceReconnect = false) => {
    const token = gameTokens.value.find((t) => t.id === tokenId);
    if (!token) {
      return null;
    }

    // 检查是否已经是当前选中的token
    const isAlreadySelected = selectedTokenId.value === tokenId;
    const existingConnection = wsConnections.value[tokenId];
    const isConnected = existingConnection?.status === "connected";
    const isConnecting = existingConnection?.status === "connecting";

    tokenLogger.debug(`选择Token: ${tokenId}`, {
      isAlreadySelected,
      isConnected,
      isConnecting,
      forceReconnect,
    });

    // 更新选中状态
    selectedTokenId.value = tokenId;

    // 更新最后使用时间
    updateToken(tokenId, { lastUsed: new Date().toISOString() });
    //避免点击断开链接
    if (isConnected) {
      return token;
    }
    // 智能连接判断
    const shouldCreateConnection =
      forceReconnect || // 强制重连
      !isAlreadySelected || // 首次选择此token
      !existingConnection || // 没有现有连接
      existingConnection.status === "disconnected" || // 连接已断开
      existingConnection.status === "error"; // 连接出错

    if (shouldCreateConnection) {
      if (isAlreadySelected && !forceReconnect) {
        wsLogger.info(`Token已选中但无连接，创建新连接: ${tokenId}`);
      } else if (!isAlreadySelected) {
        wsLogger.info(`切换到新Token，创建连接: ${tokenId}`);
      } else if (forceReconnect) {
        wsLogger.info(`强制重连Token: ${tokenId}`);
      }

      // 创建WebSocket连接
      createWebSocketConnection(tokenId, token.token, token.wsUrl);
    } else {
      if (isConnected) {
        wsLogger.debug(`Token已连接，跳过连接创建: ${tokenId}`);
      } else if (isConnecting) {
        wsLogger.debug(`Token连接中，跳过连接创建: ${tokenId}`);
      } else {
        wsLogger.debug(`Token已选中且有连接，跳过连接创建: ${tokenId}`);
      }
    }

    return token;
  };

  // 游戏消息处理
  const handleGameMessage = async (
    tokenId: string,
    message: ProtoMsg,
    client: any,
  ) => {
    try {
      if (!message) {
        gameLogger.warn(`消息处理跳过 [${tokenId}]: 无效消息`);
        return;
      }
      if (message.error) {
        const errText = String(message.error).toLowerCase();
        gameLogger.warn(`消息处理跳过 [${tokenId}]:`, message.error);

        // 特殊处理internal error
        if (errText.includes("internal error")) {
          gameLogger.error(`🚨 服务器内部错误 [${tokenId}]: 这通常表示服务器端出现问题`);
          gameLogger.error(`可能的原因:`, {
            '服务器负载过高': '请稍后再试',
            '服务器维护中': '检查游戏官方公告',
            'Token问题': '尝试重新导入Token',
            '网络问题': '检查网络连接'
          });

          // 设置连接状态为错误
          const conn = wsConnections.value[tokenId];
          if (conn) {
            conn.status = "error";
            conn.lastError = {
              timestamp: new Date().toISOString(),
              error: "internal error",
              description: "服务器内部错误，可能是服务器过载或维护中"
            };
          }
          return;
        }

        if (errText.includes("token") && errText.includes("expired")) {
          const conn = wsConnections.value[tokenId];
          if (conn) {
            conn.status = "error";
            conn.lastError = {
              timestamp: new Date().toISOString(),
              error: "token expired",
            };
          }

          const gameToken = gameTokens.value.find((t) => t.id === tokenId);
          console.log(gameToken);
          if (gameToken) {
            if (gameToken.importMethod === "url" && gameToken.sourceUrl) {
              // URL形式token刷新
              try {
                const response = await fetch(gameToken.sourceUrl);
                if (response.ok) {
                  const data = await response.json();
                  if (data.token) {
                    // 直接使用返回的token，无需transformToken
                    updateToken(tokenId, { ...gameToken, token: data.token });
                    console.log("从URL获取token成功:", gameToken.name);
                  }
                }
              } catch (error) {
                console.error("从URL获取token失败:", error);
              }
            } else if (
              gameToken.importMethod === "bin" ||
              gameToken.importMethod === "wxQrcode"
            ) {
              // Bin形式token刷新（原有逻辑）
              const storageKey = gameToken.originalStorageKey || gameToken.name;
              const userToken: ArrayBuffer | null = await getArrayBuffer(
                storageKey,
              );
              console.log("读取到的ArrayBuffer:", storageKey, userToken);
              if (userToken) {
                const token = await transformToken(userToken);
                updateToken(tokenId, { ...gameToken, token });
                console.log(gameToken);
              }
            }
          }
          // 忽视token过期提示，不记录错误日志
        }
        return;
      }

      const cmd = message.cmd?.toLowerCase();
      const body = message.getData();

      if (cmd === "role_getroleinforesp") {
        syncRandomSeedFromStatistics(tokenId, body, client);
      }

      emitPlus(cmd, {
        tokenId,
        body,
        message,
        client,
        gameData,
      });

      gameLogger.gameMessage(tokenId, cmd, !!body);
    } catch (error) {
      gameLogger.error(`处理消息失败 [${tokenId}]:`, error);
    }
  };

  // 验证token有效性
  const validateToken = (token: any) => {
    if (!token) return false;
    if (typeof token !== "string") return false;
    if (token.trim().length === 0) return false;
    // 简单检查：token应该至少有一定长度
    if (token.trim().length < 10) return false;
    return true;
  };

  // Base64解析功能（增强版）
  const parseBase64Token = (base64String: string) => {
    try {
      // 输入验证
      if (!base64String || typeof base64String !== "string") {
        throw new Error("Token字符串无效");
      }

      // 移除可能的前缀和空格
      const cleanBase64 = base64String.replace(/^data:.*base64,/, "").trim();

      if (cleanBase64.length === 0) {
        throw new Error("Token字符串为空");
      }

      // 解码base64
      let decoded;
      try {
        decoded = atob(cleanBase64);
      } catch (decodeError) {
        // 如果不是有效的Base64，作为纯文本token处理
        decoded = base64String.trim();
      }

      // 尝试解析为JSON
      let tokenData;
      try {
        tokenData = JSON.parse(decoded);
      } catch {
        // 不是JSON格式，作为纯token处理
        tokenData = { token: decoded };
      }

      // 提取实际token
      const actualToken = tokenData.token || tokenData.gameToken || decoded;

      // 验证token有效性
      if (!validateToken(actualToken)) {
        throw new Error(`提取的token无效: "${actualToken}"`);
      }

      return {
        success: true,
        data: {
          ...tokenData,
          actualToken, // 添加提取出的实际token
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "解析失败：" + error.message,
      };
    }
  };

  const importBase64Token = (
    name: string,
    base64String: string,
    additionalInfo = {},
  ) => {
    const parseResult = parseBase64Token(base64String);

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
        message: `Token "${name}" 导入失败: ${parseResult.error}`,
      };
    }

    const tokenData = {
      name,
      token: parseResult.data.actualToken, // 使用验证过的实际token
      base64Token: base64String, // 保存原始的base64字符串用于重连
      ...additionalInfo,
      ...parseResult.data, // 解析出的数据覆盖手动输入
    };

    try {
      const newToken = addToken(tokenData);

      // 添加更多验证信息到成功消息
      const tokenInfo = parseResult.data.actualToken;
      const displayToken =
        tokenInfo.length > 20
          ? `${tokenInfo.substring(0, 10)}...${tokenInfo.substring(tokenInfo.length - 6)}`
          : tokenInfo;

      return {
        success: true,
        token: newToken,
        tokenName: name,
        message: `Token "${name}" 导入成功`,
        details: `实际Token: ${displayToken}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Token "${name}" 添加失败: ${error.message}`,
      };
    }
  };

  // 连接管理辅助函数
  const generateSessionId = () =>
    "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  const currentSessionId = generateSessionId();

  // 获取连接锁
  const acquireConnectionLock = async (
    tokenId: string,
    operation = "connect",
  ) => {
    const lockKey = `${tokenId}_${operation}`;
    const connect = connectionLocks.value;
    if (connect[lockKey]) {
      wsLogger.debug(`等待连接锁释放: ${tokenId} (${operation})`);
      // 等待现有操作完成，最多等待10秒
      let attempts = 0;
      while (connect[lockKey] && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (connect[lockKey]) {
        wsLogger.warn(`连接锁等待超时: ${tokenId} (${operation})`);
        return false;
      }
    }
    connect[lockKey] = {
      tokenId,
      operation,
      timestamp: Date.now(),
      sessionId: currentSessionId,
    };
    wsLogger.connectionLock(tokenId, operation, true);
    return true;
  };

  // 释放连接锁
  const releaseConnectionLock = (tokenId: string, operation = "connect") => {
    const lockKey = `${tokenId}_${operation}`;
    if (connectionLocks.value[lockKey]) {
      delete connectionLocks.value[lockKey];
      wsLogger.connectionLock(tokenId, operation, false);
    }
  };

  // 更新跨标签页连接状态
  const updateCrossTabConnectionState = (
    tokenId: string,
    action: string,
    sessionId: string = currentSessionId,
  ) => {
    let state = useLocalStorage(`ws_connection_${tokenId}`, {
      action, // 'connecting', 'connected', 'disconnecting', 'disconnected'
      sessionId,
      timestamp: Date.now(),
      url: window.location.href,
    });

    if (activeConnections.value) {
      activeConnections.value[tokenId] = state.value;
    }
  };

  // 检查是否有其他标签页的活跃连接
  const checkCrossTabConnection = (tokenId: string) => {
    const storageKey = `ws_connection_${tokenId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const state = JSON.parse(stored);
        const isRecent = Date.now() - state.timestamp < 30000; // 30秒内的状态认为是活跃的
        const isDifferentSession = state.sessionId !== currentSessionId;

        if (
          isRecent &&
          isDifferentSession &&
          (state.action === "connecting" || state.action === "connected")
        ) {
          wsLogger.debug(`检测到其他标签页的活跃连接: ${tokenId}`);
          return state;
        }
      }
    } catch (error) {
      wsLogger.warn("检查跨标签页连接状态失败:", error);
    }
    return null;
  };

  // WebSocket连接管理（内部实现 - 实际创建连接）
  const createWebSocketConnectionInternal = async (
    tokenId: string,
    base64Token: string,
    customWsUrl = null,
  ) => {
    wsLogger.info(`开始创建连接: ${tokenId}`);

    // 1. 获取连接锁，防止竞态条件
    const lockAcquired = await acquireConnectionLock(tokenId, "connect");
    if (!lockAcquired) {
      wsLogger.error(`无法获取连接锁: ${tokenId}`);
      return null;
    }

    try {
      // 2. 检查跨标签页连接状态
      const crossTabState = checkCrossTabConnection(tokenId);
      if (crossTabState) {
        wsLogger.debug(`跳过创建，其他标签页已有连接: ${tokenId}`);
        releaseConnectionLock(tokenId, "connect");
        return null;
      }

      // 3. 更新跨标签页状态为连接中
      updateCrossTabConnectionState(tokenId, "connecting");

      // 4. 如果存在现有连接，先优雅关闭
      if (wsConnections.value[tokenId]) {
        wsLogger.debug(`优雅关闭现有连接: ${tokenId}`);
        await closeWebSocketConnectionAsync(tokenId);
      }

      // 5. 解析token
      const parseResult = parseBase64Token(base64Token);
      let actualToken;
      if (parseResult.success) {
        actualToken = parseResult.data.actualToken;
      } else {
        if (validateToken(base64Token)) {
          actualToken = base64Token;
        } else {
          throw new Error(`Token无效: ${parseResult.error}`);
        }
      }

      // 6. 构建WebSocket URL
      const baseWsUrl = `wss://xxz-xyzw.hortorgames.com/agent?p=${encodeURIComponent(actualToken)}&e=x&lang=chinese`;

      const wsUrl = customWsUrl || baseWsUrl;

      wsLogger.debug(
        `Token: ${actualToken.substring(0, 10)}...${actualToken.slice(-4)}`,
      );

      // 7. 创建新的WebSocket客户端（增强版）
      const wsClient = new XyzwWebSocketClient({
        url: wsUrl,
        utils: g_utils,
        heartbeatMs: 5000,
      });

      // 8. 设置连接状态（带会话ID）
      wsConnections.value[tokenId] = {
        client: wsClient,
        status: "connecting",
        tokenId,
        wsUrl,
        actualToken,
        sessionId: currentSessionId,
        connectedAt: null,
        lastMessage: null,
        lastError: null,
        reconnectAttempts: 0,
        randomSeedSynced: false,
        lastRandomSeedSource: null,
        lastRandomSeed: null,
      };

      // 9. 设置事件监听（增强版）
      wsClient.onConnect = () => {
        wsLogger.wsConnect(tokenId);
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].status = "connected";
          wsConnections.value[tokenId].connectedAt = new Date().toISOString();
        // 只有在成功维持连接一段时间后才重置重连计数器
        // 在token过期导致的快速断开重连场景中，不重置重连计数器
        // wsConnections.value[tokenId].reconnectAttempts = 0;
        wsConnections.value[tokenId].randomSeedSynced = false;
        wsConnections.value[tokenId].lastRandomSeedSource = null;
        wsConnections.value[tokenId].lastRandomSeed = null;
        }
        updateCrossTabConnectionState(tokenId, "connected");
        releaseConnectionLock(tokenId, "connect");
        localStorage.removeItem("xyzw_chat_msg_list");
        try {
          wsClient.send("role_getroleinfo");
        } catch (error) {
          wsLogger.warn(`初始化角色信息请求失败 [${tokenId}]`, error);
        }
      };

      wsClient.onDisconnect = (event) => {
        const reason = event.code === 1006 ? "异常断开" : event.reason || "";
        wsLogger.wsDisconnect(tokenId, reason);
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].status = "disconnected";
          wsConnections.value[tokenId].randomSeedSynced = false;
          
          // 记录断开次数
          if (!wsConnections.value[tokenId].disconnectCount) {
            wsConnections.value[tokenId].disconnectCount = 0;
          }
          wsConnections.value[tokenId].disconnectCount++;
          wsConnections.value[tokenId].lastDisconnectTime = new Date().toISOString();
        }
        updateCrossTabConnectionState(tokenId, "disconnected");
        
        // 自动重连逻辑（仅对异常断开1006）
        if (event.code === 1006) {
          const connection = wsConnections.value[tokenId];
          const maxReconnectAttempts = 3; // 最大重连次数
          const reconnectDelay = 3000; // 重连延迟（毫秒）
          
          // 检查是否需要重连（连续失败次数未超过限制）
          if (connection && 
              (!connection.reconnectAttempts || connection.reconnectAttempts < maxReconnectAttempts)) {
            
            // 增加重连尝试计数
            if (!connection.reconnectAttempts) {
              connection.reconnectAttempts = 0;
            }
            connection.reconnectAttempts++;
            
            wsLogger.info(
              `计划自动重连 [${tokenId}] (${connection.reconnectAttempts}/${maxReconnectAttempts})，延迟 ${reconnectDelay}ms`
            );
            
            setTimeout(() => {
              // 检查是否仍然需要重连（可能用户已手动重连）
              if (
                wsConnections.value[tokenId] &&
                wsConnections.value[tokenId].status === "disconnected"
              ) {
                wsLogger.info(`开始自动重连 [${tokenId}]`);
                
                // 重新创建连接
                const token = gameTokens.value.find((t) => t.id === tokenId);
                if (token && token.base64Token) {
                  // 使用现有的连接方法重新连接
                  createWebSocketConnectionInternal(
                    tokenId,
                    token.base64Token,
                    null,
                  ).catch((error) => {
                    wsLogger.error(`自动重连失败 [${tokenId}]:`, error);
                  });
                } else {
                  wsLogger.warn(`无法自动重连 [${tokenId}]: Token不存在或无效`);
                }
              } else {
                wsLogger.debug(`跳过自动重连 [${tokenId}]: 连接状态已改变`);
              }
            }, reconnectDelay);
          } else if (connection && connection.reconnectAttempts >= maxReconnectAttempts) {
            wsLogger.warn(
              `达到最大重连次数，停止自动重连 [${tokenId}] (${connection.reconnectAttempts}/${maxReconnectAttempts})`
            );
          }
        }
      };

      wsClient.onError = (error) => {
        wsLogger.wsError(tokenId, error);
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].status = "error";
          wsConnections.value[tokenId].lastError = {
            timestamp: new Date().toISOString(),
            error: error.toString(),
            url: wsUrl,
          };
        }
        releaseConnectionLock(tokenId, "connect");
      };

      // 10. 设置消息监听
      wsClient.setMessageListener((message: ProtoMsg) => {
        const cmd = message?.cmd || "unknown";
        wsLogger.wsMessage(tokenId, cmd, true);

        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].lastMessage = {
            timestamp: new Date().toISOString(),
            data: message,
            cmd: message?.cmd,
          };
          handleGameMessage(tokenId, message, wsClient);
        }
      });

      // 11. 初始化连接
      wsClient.init();

      wsLogger.verbose(`WebSocket客户端创建成功: ${tokenId}`);
      return wsClient;
    } catch (error) {
      wsLogger.error(`创建连接失败 [${tokenId}]:`, error);
      updateCrossTabConnectionState(tokenId, "disconnected");
      releaseConnectionLock(tokenId, "connect");
      return null;
    }
  };

  // 异步版本的关闭连接（优雅关闭）
  const closeWebSocketConnectionAsync = async (tokenId: string) => {
    const lockAcquired = await acquireConnectionLock(tokenId, "disconnect");
    if (!lockAcquired) {
      wsLogger.warn(`无法获取断开连接锁: ${tokenId}`);
      return;
    }

    try {
      const connection = wsConnections.value[tokenId];
      if (connection && connection.client) {
        wsLogger.debug(`开始优雅关闭连接: ${tokenId}`);

        connection.status = "disconnecting";
        updateCrossTabConnectionState(tokenId, "disconnecting");

        connection.client.disconnect();

        // 等待连接完全关闭
        await new Promise((resolve) => {
          const checkDisconnected = () => {
            if (!connection.client.connected) {
              resolve();
            } else {
              setTimeout(checkDisconnected, 100);
            }
          };
          setTimeout(resolve, 5000); // 最多等待5秒
          checkDisconnected();
        });

        delete wsConnections.value[tokenId];
        updateCrossTabConnectionState(tokenId, "disconnected");
        wsLogger.info(`连接已优雅关闭: ${tokenId}`);
      }
    } catch (error) {
      wsLogger.error(`关闭连接失败 [${tokenId}]:`, error);
    } finally {
      releaseConnectionLock(tokenId, "disconnect");
    }
  };

  // 获取当前已连接的连接数（只统计 connected 状态的连接）
  const getConnectedCount = () => {
    return Object.values(wsConnections.value).filter(
      (conn) => conn.status === "connected"
    ).length;
  };

  // 断开最旧的连接（按连接时间排序，优先断开非当前选中的Token）
  const disconnectOldestConnection = async () => {
    const connectedConnections = Object.entries(wsConnections.value)
      .filter(([_, conn]) => conn.status === "connected")
      .map(([tokenId, conn]) => ({
        tokenId,
        connectedAt: conn.connectedAt || "0",
        connection: conn,
        isSelected: tokenId === selectedTokenId.value, // 标记是否为当前选中的Token
      }))
      .sort((a, b) => {
        // 优先断开非当前选中的Token
        if (a.isSelected !== b.isSelected) {
          return a.isSelected ? 1 : -1; // 选中的排在后面
        }
        // 如果都是选中或都不是选中，按连接时间排序，最早的在前
        return new Date(a.connectedAt).getTime() - new Date(b.connectedAt).getTime();
      });

    if (connectedConnections.length > 0) {
      const oldestConnection = connectedConnections[0];
      wsLogger.info(
        `连接数已达上限(${maxConcurrentConnections.value})，断开最旧连接: ${oldestConnection.tokenId} (连接时间: ${oldestConnection.connectedAt}, 是否选中: ${oldestConnection.isSelected})`
      );
      await closeWebSocketConnectionAsync(oldestConnection.tokenId);
      return true;
    }
    return false;
  };

  // WebSocket连接管理（外部调用 - 带连接数限制和自动断开最旧连接）
  const createWebSocketConnection = async (
    tokenId: string,
    base64Token: string,
    customWsUrl = null,
  ) => {
    // 检查当前已连接的连接数
    const currentConnectedCount = getConnectedCount();
    
    // 如果当前要连接的token已经连接，直接返回
    if (wsConnections.value[tokenId]?.status === "connected") {
      wsLogger.debug(`Token已连接，跳过: ${tokenId}`);
      return wsConnections.value[tokenId]?.client || null;
    }

    // 如果连接数已达上限，断开最旧的连接
    if (currentConnectedCount >= maxConcurrentConnections.value) {
      wsLogger.info(
        `当前连接数: ${currentConnectedCount}/${maxConcurrentConnections.value}，需要断开最旧连接以创建新连接: ${tokenId}`
      );
      const disconnected = await disconnectOldestConnection();
      if (!disconnected) {
        wsLogger.warn(`无法断开旧连接，新连接可能失败: ${tokenId}`);
      }
      // 等待一小段时间确保旧连接已关闭
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // 检查当前活跃连接数（包括正在连接的）
    if (activeConnectionCount.value < maxConcurrentConnections.value) {
      // 直接创建连接
      activeConnectionCount.value++;
      try {
        const client = await createWebSocketConnectionInternal(tokenId, base64Token, customWsUrl);
        return client;
      } catch (error) {
        wsLogger.error(`创建连接失败 [${tokenId}]:`, error);
        return null;
      } finally {
        activeConnectionCount.value--;
        // 连接完成后，检查队列中是否还有等待的连接请求
        setTimeout(processConnectionQueue, connectionDelay.value);
      }
    } else {
      // 加入连接队列
      enqueueConnection(tokenId);
      return null;
    }
  };

  /**
   * 建立WebSocket连接 (供外部管理器调用)
   * @param tokenId Token ID
   */
  const connectWebSocket = async (tokenId: string) => {
    const token = gameTokens.value.find((t) => t.id === tokenId);
    if (!token) {
      wsLogger.error(`connectWebSocket: Token not found [${tokenId}]`);
      return null;
    }
    return createWebSocketConnection(tokenId, token.token, token.wsUrl);
  };

  /**
   * 断开WebSocket连接 (供外部管理器调用)
   * @param tokenId Token ID
   */
  const disconnectWebSocket = async (tokenId: string) => {
    return closeWebSocketConnectionAsync(tokenId);
  };

  // 同步版本的关闭连接（保持向后兼容）
  const closeWebSocketConnection = (tokenId: string) => {
    closeWebSocketConnectionAsync(tokenId).catch((error) => {
      wsLogger.error(`关闭连接异步操作失败 [${tokenId}]:`, error);
    });
  };

  const getWebSocketStatus = (tokenId: string) => {
    return wsConnections.value[tokenId]?.status || "disconnected";
  };

  // 获取WebSocket客户端
  const getWebSocketClient = (tokenId: string) => {
    return wsConnections.value[tokenId]?.client || null;
  };

  // 设置消息监听器
  const setMessageListener = (listener: any) => {
    if (selectedToken.value) {
      const connection = wsConnections.value[selectedToken.value.id];
      if (connection && connection.client) {
        connection.client.setMessageListener(listener);
      }
    }
  };

  // 设置是否显示消息
  const setShowMsg = (show: any) => {
    if (selectedToken.value) {
      const connection = wsConnections.value[selectedToken.value.id];
      if (connection && connection.client) {
        connection.client.setShowMsg(show);
      }
    }
  };

  // 发送消息到WebSocket
  const sendMessage = (
    tokenId: string,
    cmd: string,
    params = {},
    options = {},
  ) => {
    const connection = wsConnections.value[tokenId];
    if (!connection || connection.status !== "connected") {
      wsLogger.error(`WebSocket未连接，无法发送消息 [${tokenId}]`);
      return false;
    }

    try {
      const client = connection.client;
      if (!client) {
        wsLogger.error(`WebSocket客户端不存在 [${tokenId}]`);
        return false;
      }

      client.send(cmd, params, options);
      wsLogger.wsMessage(tokenId, cmd, false);

      return true;
    } catch (error) {
      wsLogger.error(`发送失败 [${tokenId}] ${cmd}:`, error.message);
      return false;
    }
  };

  // Promise版发送消息
  const sendMessageWithPromise = async (
    tokenId: string,
    cmd: string,
    params = {},
    timeout = 5000,
  ) => {
    const connection = wsConnections.value[tokenId];
    
    // 如果连接不存在或已断开，尝试自动连接
    if (!connection || connection.status === "disconnected" || connection.status === "error") {
      const token = gameTokens.value.find((t) => t.id === tokenId);
      if (token) {
        wsLogger.info(`连接未建立，自动连接Token: ${tokenId}`);
        selectToken(tokenId, false);
        // 等待连接建立（最多等待5秒）
        let waitCount = 0;
        const maxWait = 50; // 50次 * 100ms = 5秒
        while (waitCount < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const newConnection = wsConnections.value[tokenId];
          if (newConnection && newConnection.status === "connected") {
            break;
          }
          if (newConnection && newConnection.status === "error") {
            return Promise.reject(new Error(`WebSocket连接失败 [${tokenId}]`));
          }
          waitCount++;
        }
        // 检查最终连接状态
        const finalConnection = wsConnections.value[tokenId];
        if (!finalConnection || finalConnection.status !== "connected") {
          return Promise.reject(new Error(`WebSocket连接超时 [${tokenId}]`));
        }
      } else {
        return Promise.reject(new Error(`WebSocket未连接，且Token不存在 [${tokenId}]`));
      }
    }
    
    // 如果正在连接中，等待连接完成
    if (connection.status === "connecting") {
      wsLogger.info(`WebSocket连接中，等待连接完成 [${tokenId}]`);
      let waitCount = 0;
      const maxWait = 50; // 50次 * 100ms = 5秒
      while (waitCount < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const currentConnection = wsConnections.value[tokenId];
        if (currentConnection && currentConnection.status === "connected") {
          break;
        }
        if (currentConnection && currentConnection.status === "error") {
          return Promise.reject(new Error(`WebSocket连接失败 [${tokenId}]`));
        }
        waitCount++;
      }
      // 检查最终连接状态
      const finalConnection = wsConnections.value[tokenId];
      if (!finalConnection || finalConnection.status !== "connected") {
        return Promise.reject(new Error(`WebSocket连接超时 [${tokenId}]`));
      }
    }
    
    // 只有连接成功才能发送
    const finalConnection = wsConnections.value[tokenId];
    if (!finalConnection || finalConnection.status !== "connected") {
      return Promise.reject(new Error(`WebSocket未连接 [${tokenId}]，状态: ${finalConnection?.status || "unknown"}`));
    }

    const client = finalConnection.client;
    if (!client) {
      return Promise.reject(new Error(`WebSocket客户端不存在 [${tokenId}]`));
    }

    // 为战斗相关命令自动注入 battleVersion
    const battleCommands = [
      "fight_startareaarena",
      "fight_startpvp",
      "fight_starttower",
      "fight_startboss",
      "fight_startlegionboss",
      "fight_startdungeon",
    ];
    if (battleCommands.includes(cmd)) {
      const battleVersion = gameData.value.battleVersion;
      params = { battleVersion, ...params };
      wsLogger.info(
        `⚔️ [战斗命令] 注入 battleVersion: ${battleVersion} [${cmd}]`,
      );
    }

    try {
      const result = await client.sendWithPromise(cmd, params, timeout);

      // 特殊日志：fight_starttower 响应
      if (cmd === "fight_starttower") {
        wsLogger.info(`🗼 [咸将塔] 收到爬塔响应 [${tokenId}]:`, result);
      }

      return result;
    } catch (error) {
      // 特殊日志：fight_starttower 错误
      if (cmd === "fight_starttower") {
        wsLogger.error(`🗼 [咸将塔] 爬塔请求失败 [${tokenId}]:`, error.message);
      }
      return Promise.reject(error);
    }
  };

  // 发送心跳消息
  const sendHeartbeat = (tokenId: string) => {
    return sendMessage(tokenId, "heart_beat");
  };

  // 发送获取角色信息请求（异步处理）
  const sendGetRoleInfo = async (tokenId: string, params = {}, retryCount = 0) => {
    try {
      // 增加超时时间到15秒，并添加重试机制
      const timeout = 15000;
      const roleInfo = await sendMessageWithPromise(
        tokenId,
        "role_getroleinfo",
        params,
        timeout,
      );

      // 手动更新游戏数据（因为响应可能不会自动触发消息处理）
      if (roleInfo) {
        gameData.value.roleInfo = roleInfo;
        gameData.value.lastUpdated = new Date().toISOString();
        gameLogger.verbose("角色信息已通过 Promise 更新");
      }

      return roleInfo;
    } catch (error) {
      gameLogger.error(`获取角色信息失败 [${tokenId}]:`, error.message);

      // 重试机制：最多重试2次，每次间隔1秒
      if (retryCount < 2) {
        gameLogger.info(`正在重试获取角色信息 [${tokenId}]，重试次数: ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return sendGetRoleInfo(tokenId, params, retryCount + 1);
      }

      throw error;
    }
  };

  // 发送获取数据版本请求
  const sendGetDataBundleVersion = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "system_getdatabundlever", params);
  };

  // 发送签到请求
  const sendSignIn = (tokenId: string) => {
    return sendMessageWithPromise(tokenId, "system_signinreward");
  };

  // 发送领取日常任务奖励
  const sendClaimDailyReward = (tokenId: string, rewardId = 0) => {
    return sendMessageWithPromise(tokenId, "task_claimdailyreward", {
      rewardId,
    });
  };

  // 发送获取队伍信息
  const sendGetTeamInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "presetteam_getinfo", params);
  };

  // 发送军团商店购买商品
  const sendLegionStoreBuyGoods = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legion_storebuygoods", params);
  };

  // 发送领取珍宝阁每日免费奖励
  const sendCollectionClaimFreeReward = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "collection_claimfreereward", params);
  };

  // 发送领取功法挂机奖励
  const sendLegacyClaimHangup = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legacy_claimhangup", params);
  };

  // 发送领取功法礼物
  const sendLegacyClaimGift = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legacy_claimgift", params);
  };

  // 发送提交密码
  const sendRoleCommitPassword = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "role_commitpassword", params);
  };

  // 发送赠送功法
  const sendLegacySendGift = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legacy_sendgift", params);
  };

  // 发送获取功法赠送详情
  const sendLegacyGetGifts = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legacy_getgifts", params);
  };

  // 发送获取功法详情
  const sendLegacyGetInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legacy_getinfo", params);
  };

  // 发送激活功法图鉴
  const sendLegacyActivate = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legacy_activatebook", params);
  };

  // 发送获取军团信息
  const sendLegionGetInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legion_getinfo", params);
  };

  // 发送获取噩梦信息
  const sendNightmareGetRoleInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_getroleinfo", params);
  };

  // 发送十殿转盘
  const sendNightmareClickTurntable = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_clickturntable", params);
  };

  // 发送十殿转盘奖励次数
  const sendNightmareClaimTurnRewardTimes = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_claimturnrewardtimes", params);
  };

  // 发送十殿战斗
  const sendNightmareFight = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_fight", params);
  };

  // 发送设置十殿出战人员
  const sendNightmareSetFighter = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_setfighter", params);
  };

  // 发送十殿恢复
  const sendNightmareRestore = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_restore", params);
  };

  // 发送十殿图鉴奖励领取
  const sendNightmareClaimBook = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_claimbook", params);
  };

  // 发送十殿周奖励领取
  const sendNightmareClaimWeekReward = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "nightmare_claimweekreward", params);
  };

  // 发送获取角色队伍信息
  const sendMatchteamGetRoleTeamInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "matchteam_getroleteaminfo", params);
  };

  // 发送踢出队伍成员
  const sendMatchteamKick = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "matchteam_kick", params);
  };

  // 发送打开队伍
  const sendMatchteamOpenTeam = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "matchteam_openteam", params);
  };

  // 发送离开队伍
  const sendMatchteamLeave = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "matchteam_leave", params);
  };

  // 发送保存预设队伍（切换阵容）
  const sendPresetteamSaveTeam = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "presetteam_saveteam", params);
  };

  // 发送开始灯神战斗
  const sendFightStartGenie = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "fight_startgenie", params);
  };

  // 发送开始关卡战斗（用于获取当前阵容信息）
  const sendFightStartLevel = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "fight_startlevel", params);
  };

  // 发送英雄交换
  const sendHeroExchange = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "hero_exchange", params);
  };

  // 发送计算英雄战力
  const sendHeroCalcpowerbyteam = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "hero_calcpowerbyteam", params);
  };

  // 发送灯神扫荡
  const sendGenieSweep = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "genie_sweep", params);
  };

  // 发送科技交换
  const sendLegionExchangeResearch = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legion_exchangeresearch", params);
  };

  // 发送军团研究
  const sendLegionResearch = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legion_research", params);
  };

  // 发送重置军团研究
  const sendLegionResetResearch = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "legion_resetresearch", params);
  };

  // 发送获取预设队伍信息
  const sendPresetteamGetInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "presetteam_getinfo", params);
  };

  // 发送获取黑市购买设置
  const sendStoreGetPurchase = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "store_getpurchase", params);
  };

  // 发送领取宝箱奖励
  const sendItemClaimBoxPointReward = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "item_claimboxpointreward", params);
  };

  // 发送领取任务奖励
  const sendActivityClaimTaskReward = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "activity_claimtaskreward", params);
  };

  // 发送获取活动游戏信息
  const sendActivityGetActeGameInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "activity_getactegameinfo", params);
  };

  // 发送领取活动游戏阶段奖励
  const sendActivityActeGameStageClaim = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "activity_actegamestageclaim", params);
  };

  // 发送开始活动游戏
  const sendActivityStarteGame = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "activity_startegame", params);
  };

  // 发送活动通用购买商品
  const sendActivityCommonBuyGoods = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "activity_commonbuygoods", params);
  };

  // 发送五一抽奖活动
  const sendActivityMaydaylottery = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "activity_maydaylottery", params);
  };

  // 发送融合盒领取融合进度
  const sendMergeboxClaimMergeProgress = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "mergebox_claimmergeprogress", params);
  };

  // 发送融合盒领取消耗进度
  const sendMergeboxClaimCostProgress = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "mergebox_claimcostprogress", params);
  };

  // 发送进化塔领取任务
  const sendEvotowerClaimTask = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "evotower_claimtask", params);
  };

  // 发送进化塔领取军团特权
  const sendEvotowerClaimLegionPrivilege = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "evotower_claimlegionprivilege", params);
  };

  // 发送融合盒合并物品
  const sendMergeboxMergeItem = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "mergebox_mergeitem", params);
  };

  // 发送融合盒开盒
  const sendMergeboxOpenBox = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "mergebox_openbox", params);
  };

  // 发送塔开始
  const sendTowersStart = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "towers_start", params);
  };

  // 发送塔战斗
  const sendTowersFight = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "towers_fight", params);
  }

  // 发送塔信息获取
  const sendTowersGetInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "towers_getinfo", params);
  };

  // 发送领取所有邮件附件
  const sendMailClaimAllAttachment = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "mail_claimallattachment", params);
  };

  // 发送打开道具包
  const sendItemOpenPack = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "item_openpack", params);
  };

  // 发送购买咸鱼币订单
  const sendChargeCreateOrder = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "charge_createorder", params);
  };

  // 发送宝库Boss战斗
  const sendBossTowerStartBoss = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "bosstower_startboss", params);
  };

  // 发送获取宝库信息
  const sendBossTowerGetInfo = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "bosstower_getinfo", params);
  };

  // 发送搜索宝库队伍
  const sendBossTowerSearchTeam = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "bosstower_searchteam", params);
  };

  // 发送领取宝库奖励
  const sendBossTowerClaimReward = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "bosstower_claimreward", params);
  };

  // 发送宝库使用钥匙
  const sendBossTowerStartBox = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "bosstower_startbox", params);
  };

  // 发送宝库使用boom
  const sendBossTowerBoom = (tokenId: string, params = {}) => {
    return sendMessageWithPromise(tokenId, "bosstower_boom", params);
  };

  // 发送自定义游戏消息
  const sendGameMessage = (
    tokenId: string,
    cmd: string,
    params = {},
    options = {},
  ) => {
    if (options.usePromise) {
      return sendMessageWithPromise(tokenId, cmd, params, options.timeout);
    } else {
      return sendMessage(tokenId, cmd, params, options);
    }
  };

  // 获取当前塔层数
  const getCurrentTowerLevel = () => {
    try {
      // 从游戏数据中获取塔信息
      const roleInfo = gameData.value.roleInfo;
      if (!roleInfo || !roleInfo.role) {
        gameLogger.warn("角色信息不存在");
        return null;
      }

      const tower = roleInfo.role.tower;
      if (!tower) {
        gameLogger.warn("塔信息不存在");
        return null;
      }

      // 可能的塔层数字段（根据实际数据结构调整）
      const level =
        tower.level || tower.currentLevel || tower.floor || tower.stage;

      // 当前塔层数
      return level;
    } catch (error) {
      gameLogger.error("获取塔层数失败:", error);
      return null;
    }
  };

  // 获取详细塔信息
  const getTowerInfo = () => {
    try {
      const roleInfo = gameData.value.roleInfo;
      if (!roleInfo || !roleInfo.role) {
        return null;
      }

      return roleInfo.role.tower || null;
    } catch (error) {
      gameLogger.error("获取塔信息失败:", error);
      return null;
    }
  };

  // 工具方法
  const exportTokens = () => {
    return {
      tokens: gameTokens.value,
      exportedAt: new Date().toISOString(),
      version: "2.0",
    };
  };

  const importTokens = (data: any) => {
    try {
      if (data.tokens && Array.isArray(data.tokens)) {
        gameTokens.value = data.tokens;
        return {
          success: true,
          message: `成功导入 ${data.tokens.length} 个Token`,
        };
      } else {
        return { success: false, message: "导入数据格式错误" };
      }
    } catch (error) {
      return { success: false, message: "导入失败：" + error.message };
    }
  };

  const clearAllTokens = () => {
    // 关闭所有WebSocket连接
    Object.keys(wsConnections.value).forEach((tokenId) => {
      closeWebSocketConnection(tokenId);
    });

    gameTokens.value = [];
    selectedTokenId.value = null;
  };

  const cleanExpiredTokens = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cleanedTokens = gameTokens.value.filter((token) => {
      // URL和bin文件导入的token设为长期有效，不会过期
      // 升级为长期有效的token也不会过期
      if (token.importMethod === "url" || token.importMethod === "bin" || token.upgradedToPermanent) {
        return true;
      }
      // 手动导入的token按原逻辑处理（24小时过期）
      const lastUsed = new Date(token.lastUsed || token.createdAt);
      return lastUsed > oneDayAgo;
    });
    const cleanedCount = gameTokens.value.length - cleanedTokens.length;
    gameTokens.value = cleanedTokens;
    return cleanedCount;
  };

  // 将现有token升级为长期有效
  const upgradeTokenToPermanent = (tokenId: string) => {
    const token = gameTokens.value.find((t) => t.id === tokenId);
    if (token && !token.upgradedToPermanent && token.importMethod !== "url" && token.importMethod !== "bin") {
      updateToken(tokenId, {
        upgradedToPermanent: true,
        upgradedAt: new Date().toISOString(),
      });
      return true;
    }
    return false;
  };

  // 连接唯一性验证和监控
  const validateConnectionUniqueness = (tokenId: string) => {
    const connections = Object.values(wsConnections.value).filter(
      (conn) =>
        conn.tokenId === tokenId &&
        (conn.status === "connecting" || conn.status === "connected"),
    );

    if (connections.length > 1) {
      wsLogger.warn(
        `检测到重复连接: ${tokenId}, 连接数: ${connections.length}`,
      );
      // 保留最新的连接，关闭旧连接
      const sortedConnections = connections.sort(
        (a, b) => new Date(b.connectedAt || 0) - new Date(a.connectedAt || 0),
      );

      for (let i = 1; i < sortedConnections.length; i++) {
        const oldConnection = sortedConnections[i];
        wsLogger.debug(`关闭重复连接: ${tokenId}`);
        closeWebSocketConnectionAsync(oldConnection.tokenId);
      }

      return false; // 检测到重复连接
    }

    return true; // 连接唯一
  };

  // 连接监控和清理
  const connectionMonitor = {
    // 定期检查连接状态
    startMonitoring: () => {
      setInterval(() => {
        const now = Date.now();

        console.log("ws连接监控运行中...", wsConnections.value);
        console.log("co连接监控运行中...", connectionLocks.value);
        console.log("ac连接监控运行中...", activeConnections.value);

        // 检查连接超时（超过30秒未活动）
        Object.entries(wsConnections.value).forEach(([tokenId, connection]) => {
          const lastActivity =
            connection.lastMessage?.timestamp || connection.connectedAt;
          if (lastActivity) {
            const timeSinceActivity = now - new Date(lastActivity).getTime();
            if (
              timeSinceActivity > 30000 &&
              connection.status === "connected"
            ) {
              wsLogger.warn(`检测到连接可能已断开: ${tokenId}`);
              // 发送心跳检测
              if (connection.client) {
                connection.client.sendHeartbeat();
              }
            }
          }
        });

        // 清理过期的连接锁（超过10分钟）
        Object.entries(connectionLocks.value).forEach(([tokenId, lock]) => {
          if (now - lock.timestamp > 600000) {
            delete connectionLocks.value[tokenId];
            wsLogger.debug(`清理过期连接锁: ${tokenId}`);
          }
        });

        // 清理过期的跨标签页状态（超过5分钟）
        Object.entries(activeConnections.value).forEach(([tokenId, state]) => {
          if (now - state.timestamp > 300000) {
            wsLogger.debug(`清理过期跨标签页状态: ${tokenId}`);
            delete activeConnections.value[tokenId];
            localStorage.removeItem(`ws_connection_${tokenId}`);
          }
        });
      }, 10000); // 每10秒检查一次
    },

    // 获取连接统计信息
    getStats: () => {
      const duplicateTokens: string[] = [];
      const stats = {
        totalConnections: Object.keys(wsConnections.value).length,
        connectedCount: 0,
        connectingCount: 0,
        disconnectedCount: 0,
        errorCount: 0,
        duplicateTokens,
        activeLocks: Object.keys(connectionLocks.value).length,
        crossTabStates: Object.keys(activeConnections.value).length,
      };

      // 统计连接状态
      const tokenCounts = new Map();
      Object.values(wsConnections.value).forEach((connection) => {
        stats[connection.status + "Count"]++;

        // 检测重复token
        const count = tokenCounts.get(connection.tokenId) || 0;
        tokenCounts.set(connection.tokenId, count + 1);

        if (count > 0) {
          stats.duplicateTokens.push(connection.tokenId);
        }
      });

      return stats;
    },

    // 强制清理所有连接
    forceCleanup: async () => {
      wsLogger.info("开始强制清理所有连接...");

      const cleanupPromises = Object.keys(wsConnections.value).map((tokenId) =>
        closeWebSocketConnectionAsync(tokenId),
      );

      await Promise.all(cleanupPromises);

      // TODO:
      // 清理所有锁和状态
      // connectionLocks.value.clear()
      // activeConnections.value.clear()

      // 清理localStorage中的跨标签页状态
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("ws_connection_")) {
          localStorage.removeItem(key);
        }
      });

      wsLogger.info("强制清理完成");
    },
  };

  // 监听localStorage变化（跨标签页通信）
  const setupCrossTabListener = () => {
    window.addEventListener("storage", (event) => {
      if (event.key?.startsWith("ws_connection_")) {
        const tokenId = event.key.replace("ws_connection_", "");
        wsLogger.debug(
          `检测到跨标签页连接状态变化: ${tokenId}`,
          event.newValue,
        );

        // 如果其他标签页建立了连接，考虑关闭本标签页的连接
        if (event.newValue) {
          try {
            const newState = JSON.parse(event.newValue);
            const localConnection = wsConnections.value[tokenId];

            if (
              newState.action === "connected" &&
              newState.sessionId !== currentSessionId &&
              localConnection?.status === "connected"
            ) {
              wsLogger.info(
                `检测到其他标签页已连接同一token，关闭本地连接: ${tokenId}`,
              );
              closeWebSocketConnectionAsync(tokenId);
            }
          } catch (error) {
            wsLogger.warn("解析跨标签页状态失败:", error);
          }
        }
      }
    });
  };

  // 处理连接队列
  const processConnectionQueue = async () => {
    // 如果当前活跃连接数已经达到最大值，或者队列为空，直接返回
    if (activeConnectionCount.value >= maxConcurrentConnections.value || connectionQueue.value.length === 0) {
      return;
    }

    // 从队列中取出第一个token
    const tokenId = connectionQueue.value.shift();
    if (!tokenId) return;

    // 更新队列位置
    updateConnectionQueuePositions();

    try {
      // 查找对应的token
      const token = gameTokens.value.find(t => t.id === tokenId);
      if (!token) {
        wsLogger.error(`Token not found: ${tokenId}`);
        return;
      }

      // 增加活跃连接数
      activeConnectionCount.value++;
      wsLogger.info(`开始处理队列中的连接: ${tokenId}，当前活跃连接数: ${activeConnectionCount.value}`);

      // 创建连接
      await createWebSocketConnectionInternal(tokenId, token.token, token.wsUrl);
    } catch (error) {
      wsLogger.error(`处理队列连接失败: ${tokenId}`, error);
    } finally {
      // 减少活跃连接数
      activeConnectionCount.value--;
      wsLogger.info(`队列连接处理完成: ${tokenId}，当前活跃连接数: ${activeConnectionCount.value}`);

      // 延迟后继续处理队列
      setTimeout(processConnectionQueue, connectionDelay.value);
    }
  };

  // 更新连接队列位置
  const updateConnectionQueuePositions = () => {
    const newPositions: Record<string, number> = {};
    connectionQueue.value.forEach((tokenId, index) => {
      newPositions[tokenId] = index;
    });
    connectionQueuePositions.value = newPositions;
  };

  // 将连接请求加入队列
  const enqueueConnection = (tokenId: string) => {
    // 如果token已经在队列中，不重复添加
    if (connectionQueue.value.includes(tokenId)) {
      wsLogger.debug(`Token already in queue: ${tokenId}`);
      return;
    }

    // 如果token已经连接或正在连接，不加入队列
    const connection = wsConnections.value[tokenId];
    if (connection && (connection.status === "connected" || connection.status === "connecting")) {
      wsLogger.debug(`Token already connected or connecting: ${tokenId}`);
      return;
    }

    // 添加到队列
    connectionQueue.value.push(tokenId);
    connectionQueueTimestamps.value[tokenId] = Date.now();
    updateConnectionQueuePositions();

    const position = connectionQueuePositions.value[tokenId];
    const waitTime = getEstimatedWaitTime(tokenId);
    wsLogger.info(`Token added to connection queue: ${tokenId}, position: ${position + 1}, estimated wait: ${waitTime}ms`);

    // 触发队列处理
    setTimeout(processConnectionQueue, 0);
  };

  // 从队列中移除token
  const dequeueConnection = (tokenId: string) => {
    const index = connectionQueue.value.indexOf(tokenId);
    if (index > -1) {
      connectionQueue.value.splice(index, 1);
      delete connectionQueueTimestamps.value[tokenId];
      updateConnectionQueuePositions();
      wsLogger.info(`Token removed from connection queue: ${tokenId}`);
    }
  };

  // 标记任务开始
  const startTask = () => {
    runningTasksCount.value++;
    isTasksRunning.value = true;
    wsLogger.info(`任务开始，当前运行任务数: ${runningTasksCount.value}`);
  };

  // 标记任务结束
  const finishTask = () => {
    runningTasksCount.value = Math.max(0, runningTasksCount.value - 1);
    wsLogger.info(`任务结束，当前运行任务数: ${runningTasksCount.value}`);

    // 检查是否所有任务都已完成
    if (runningTasksCount.value === 0 && scheduledTasksQueue.value === 0) {
      isTasksRunning.value = false;
      wsLogger.info(`所有任务执行完成`);

      // 如果需要，关闭所有连接
      if (shouldCloseConnectionsAfterTasks.value) {
        closeAllConnections();
        shouldCloseConnectionsAfterTasks.value = false;
      }
    }
  };

  // 标记定时任务排队
  const scheduleTask = () => {
    scheduledTasksQueue.value++;
    isTasksRunning.value = true;
    wsLogger.info(`定时任务排队，当前排队数: ${scheduledTasksQueue.value}`);
  };

  // 标记定时任务完成
  const finishScheduledTask = () => {
    scheduledTasksQueue.value = Math.max(0, scheduledTasksQueue.value - 1);
    wsLogger.info(`定时任务完成，当前排队数: ${scheduledTasksQueue.value}`);

    // 检查是否所有任务都已完成
    if (runningTasksCount.value === 0 && scheduledTasksQueue.value === 0) {
      isTasksRunning.value = false;
      wsLogger.info(`所有定时任务执行完成`);

      // 如果需要，关闭所有连接
      if (shouldCloseConnectionsAfterTasks.value) {
        closeAllConnections();
        shouldCloseConnectionsAfterTasks.value = false;
      }
    }
  };

  // 关闭所有WebSocket连接
  const closeAllConnections = async () => {
    wsLogger.info(`开始关闭所有WebSocket连接`);

    // 清空连接队列
    connectionQueue.value = [];
    updateConnectionQueuePositions();

    // 关闭所有连接
    const connectionIds = Object.keys(wsConnections.value);
    wsLogger.info(`需要关闭的连接数: ${connectionIds.length}`);

    // 逐个关闭连接
    for (const tokenId of connectionIds) {
      try {
        await closeWebSocketConnectionAsync(tokenId);
        wsLogger.info(`连接已关闭: ${tokenId}`);
      } catch (error) {
        wsLogger.error(`关闭连接失败: ${tokenId}`, error);
      }
    }

    wsLogger.info(`所有WebSocket连接关闭完成`);
  };

  // 标记任务完成后关闭连接
  const closeAllConnectionsAfterTasks = () => {
    shouldCloseConnectionsAfterTasks.value = true;
    wsLogger.info(`已标记：所有任务完成后关闭连接`);

    // 如果当前没有任务正在执行，立即关闭连接
    if (!isTasksRunning.value) {
      closeAllConnections();
      shouldCloseConnectionsAfterTasks.value = false;
    }
  };

  // 初始化
  const initTokenStore = () => {
    // 清理过期token
    cleanExpiredTokens();
    // 启动连接监控
    connectionMonitor.startMonitoring();

    // 设置跨标签页监听
    setupCrossTabListener();
    tokenLogger.info("Token Store 初始化完成，连接监控已启动");
  };
  const setBattleVersion = (version: number | null) => {
    gameData.value.battleVersion = version;
    gameData.value.lastUpdated = new Date().toISOString();
  };

  const getBattleVersion = () => {
    return gameData.value.battleVersion;
  };

  return {
    // 状态
    gameTokens,
    selectedTokenId,
    wsConnections,
    gameData,

    // 计算属性
    hasTokens,
    selectedToken,
    selectedTokenRoleInfo,

    // 连接限流相关状态
    connectionQueue,
    activeConnectionCount,
    maxConcurrentConnections,
    queuedTokens,

    // Token管理方法
    addToken,
    updateToken,
    removeToken,
    selectToken,

    // Base64解析方法
    parseBase64Token,
    importBase64Token,

    // WebSocket方法
    createWebSocketConnection,
    connectWebSocket,
    disconnectWebSocket,
    closeWebSocketConnection,
    getWebSocketStatus,
    getWebSocketClient,
    sendMessage,
    sendMessageWithPromise,
    setMessageListener,
    setShowMsg,
    sendHeartbeat,
    sendGetRoleInfo,
    sendGetDataBundleVersion,
    sendSignIn,
    sendClaimDailyReward,
    sendGetTeamInfo,
    sendLegionStoreBuyGoods,
    sendCollectionClaimFreeReward,
    sendLegacyClaimHangup,
    sendLegacyClaimGift,
    sendRoleCommitPassword,
    sendLegacySendGift,
    sendLegacyGetGifts,
    sendLegacyGetInfo,
    sendLegacyActivate,
    sendLegionGetInfo,
    sendNightmareGetRoleInfo,
    sendNightmareClickTurntable,
    sendNightmareClaimTurnRewardTimes,
    sendNightmareFight,
    sendNightmareSetFighter,
    sendNightmareRestore,
    sendNightmareClaimBook,
    sendNightmareClaimWeekReward,
    sendMatchteamGetRoleTeamInfo,
    sendMatchteamKick,
    sendMatchteamOpenTeam,
    sendMatchteamLeave,
    sendPresetteamSaveTeam,
    sendPresetteamGetInfo,
    sendFightStartGenie,
    sendFightStartLevel,
    sendHeroExchange,
    sendHeroCalcpowerbyteam,
    sendGenieSweep,
    sendLegionExchangeResearch,
    sendLegionResearch,
    sendLegionResetResearch,
    sendStoreGetPurchase,
    sendItemClaimBoxPointReward,
    sendActivityClaimTaskReward,
    sendActivityGetActeGameInfo,
    sendActivityActeGameStageClaim,
    sendActivityStarteGame,
    sendActivityCommonBuyGoods,
    sendActivityMaydaylottery,
    sendMergeboxClaimMergeProgress,
    sendMergeboxClaimCostProgress,
    sendEvotowerClaimTask,
    sendEvotowerClaimLegionPrivilege,
    sendMergeboxMergeItem,
    sendMergeboxOpenBox,
    sendTowersStart,
    sendTowersFight,
    sendTowersGetInfo,
    sendMailClaimAllAttachment,
    sendItemOpenPack,
    sendChargeCreateOrder,
    sendBossTowerStartBoss,
    sendBossTowerGetInfo,
    sendBossTowerSearchTeam,
    sendBossTowerClaimReward,
    sendBossTowerStartBox,
    sendBossTowerBoom,
    sendGameMessage,

    // 连接限流相关方法
    getEstimatedWaitTime,
    enqueueConnection,
    dequeueConnection,
    processConnectionQueue,

    // 任务执行管理方法
    startTask,
    finishTask,
    scheduleTask,
    finishScheduledTask,
    closeAllConnections,
    closeAllConnectionsAfterTasks,

    // 任务状态
    runningTasksCount,
    scheduledTasksQueue,
    isTasksRunning,

    // 工具方法
    exportTokens,
    importTokens,
    clearAllTokens,
    cleanExpiredTokens,
    upgradeTokenToPermanent,
    initTokenStore,

    // 塔信息方法
    getCurrentTowerLevel,
    getTowerInfo,

    // battleVersion
    setBattleVersion,
    getBattleVersion,

    // 调试工具方法
    validateToken,
    debugToken: (tokenString: string) => {
      console.log("🔍 Token调试信息:");
      console.log("原始Token:", tokenString);
      const parseResult = parseBase64Token(tokenString);
      console.log("解析结果:", parseResult);
      if (parseResult.success) {
        console.log("实际Token:", parseResult.data.actualToken);
        console.log(
          "Token有效性:",
          validateToken(parseResult.data.actualToken),
        );
      }
      return parseResult;
    },

    // 连接管理增强功能
    validateConnectionUniqueness,
    connectionMonitor,
    currentSessionId: () => currentSessionId,

    // 开发者工具
    devTools: {
      getConnectionStats: () => connectionMonitor.getStats(),
      forceCleanup: () => connectionMonitor.forceCleanup(),
      showConnectionLocks: () => Object.keys(connectionLocks.value),
      showCrossTabStates: () => Object.keys(activeConnections.value),
      testDuplicateConnection: (tokenId: string) => {
        // 降噪
        const token = gameTokens.value.find((t) => t.id === tokenId);
        if (token) {
          // 故意创建第二个连接进行测试
          createWebSocketConnection(tokenId + "_test", token.token);
        }
      },
    },
  };
});
