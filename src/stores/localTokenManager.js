import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getUserToken as dbGetUserToken,
  setUserToken as dbSetUserToken,
  clearUserToken as dbClearUserToken,
  getAllGameTokens as dbGetAllGameTokens,
  putGameToken as dbPutGameToken,
  deleteGameToken as dbDeleteGameToken,
  clearGameTokens as dbClearGameTokens,
  migrateFromLocalStorageIfNeeded,
} from "@/utils/tokenDb";

/**
 * 本地Token管理器
 * 用于管理用户认证token和游戏角色token的本地存储
 */
export const useLocalTokenStore = defineStore("localToken", () => {
  // 状态（内存态，实际持久化到 IndexedDB）
  const userToken = ref(null);
  const gameTokens = ref({});
  const wsConnections = ref({}); // WebSocket连接状态

  // 计算属性
  const isUserAuthenticated = computed(() => !!userToken.value);
  const hasGameTokens = computed(
    () => Object.keys(gameTokens.value).length > 0,
  );

  // 用户认证token管理
  const setUserToken = (token) => {
    userToken.value = token;
    // 持久化到 IndexedDB（异步，不阻塞 UI）
    dbSetUserToken(token).catch((e) => console.warn("保存用户Token失败:", e));
  };

  const clearUserToken = () => {
    userToken.value = null;
    dbClearUserToken().catch((e) => console.warn("清除用户Token失败:", e));
  };

  // 游戏token管理
  const addGameToken = (roleId, tokenData) => {
    const newTokenData = {
      ...tokenData,
      roleId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    gameTokens.value[roleId] = newTokenData;
    dbPutGameToken(roleId, newTokenData).catch((e) =>
      console.warn("保存游戏Token失败:", e),
    );

    return newTokenData;
  };

  const getGameToken = (roleId) => {
    const token = gameTokens.value[roleId];
    if (token) {
      // 更新最后使用时间
      token.lastUsed = new Date().toISOString();
      dbPutGameToken(roleId, token).catch((e) =>
        console.warn("更新游戏Token失败:", e),
      );
    }
    return token;
  };

  const updateGameToken = (roleId, updates) => {
    if (gameTokens.value[roleId]) {
      gameTokens.value[roleId] = {
        ...gameTokens.value[roleId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      dbPutGameToken(roleId, gameTokens.value[roleId]).catch((e) =>
        console.warn("更新游戏Token失败:", e),
      );
    }
  };

  const removeGameToken = (roleId) => {
    delete gameTokens.value[roleId];
    dbDeleteGameToken(roleId).catch((e) =>
      console.warn("删除游戏Token失败:", e),
    );

    // 同时断开对应的WebSocket连接
    if (wsConnections.value[roleId]) {
      closeWebSocketConnection(roleId);
    }
  };

  const clearAllGameTokens = () => {
    // 关闭所有WebSocket连接
    Object.keys(wsConnections.value).forEach((roleId) => {
      closeWebSocketConnection(roleId);
    });

    gameTokens.value = {};
    dbClearGameTokens().catch((e) => console.warn("清空游戏Token失败:", e));
  };

  // WebSocket连接管理 - 使用新的WsAgent
  const createWebSocketConnection = async (
    roleId,
    base64Token,
    customWsUrl = null,
  ) => {
    if (wsConnections.value[roleId]) {
      closeWebSocketConnection(roleId);
    }

    try {
      // 动态导入WebSocket客户端
      const { WsAgent } = await import("../utils/wsAgent.js");
      const { gameCommands } = await import("../utils/gameCommands.js");

      // 解析Base64获取实际Token
      let actualToken = base64Token;

      // 尝试解析Base64获取实际token
      try {
        const cleanBase64 = base64Token.replace(/^data:.*base64,/, "").trim();
        const decoded = atob(cleanBase64);

        // 尝试解析为JSON获取token字段
        try {
          const tokenData = JSON.parse(decoded);
          actualToken = tokenData.token || tokenData.gameToken || decoded;
        } catch {
          // 如果不是JSON，直接使用解码后的字符串
          actualToken = decoded;
        }
      } catch (error) {
        console.warn("Base64解析失败，使用原始token:", error.message);
        actualToken = base64Token;
      }

      // 创建WebSocket客户端实例
      const wsAgent = new WsAgent({
        heartbeatInterval: 2000,
        queueInterval: 50,
        channel: "x", // 使用x通道
        autoReconnect: true,
        maxReconnectAttempts: 5,
      });

      // 设置事件监听器
      wsAgent.onOpen = () => {
        // 降噪

        // 更新连接状态
        wsConnections.value[roleId].status = "connected";
        wsConnections.value[roleId].connectedAt = new Date().toISOString();

        // 发送初始化命令
        setTimeout(() => {
          // 获取角色信息
          wsAgent.send(gameCommands.role_getroleinfo(0, 0, { roleId }));

          // 获取数据包版本
          wsAgent.send(gameCommands.system_getdatabundlever());
        }, 1000);
      };

      wsAgent.onMessage = (message) => {
        // 降噪

        // 处理不同类型的消息
        if (message.cmd) {
          handleGameMessage(roleId, message);
        }
      };

      wsAgent.onError = (error) => {
        console.error(`❌ WebSocket错误 [${roleId}]:`, error);
        if (wsConnections.value[roleId]) {
          wsConnections.value[roleId].status = "error";
          wsConnections.value[roleId].lastError = error.message;
        }
      };

      wsAgent.onClose = (event) => {
        // 降噪
        if (wsConnections.value[roleId]) {
          wsConnections.value[roleId].status = "disconnected";
        }
      };

      wsAgent.onReconnect = (attempt) => {
        // 降噪
        if (wsConnections.value[roleId]) {
          wsConnections.value[roleId].status = "reconnecting";
          wsConnections.value[roleId].reconnectAttempt = attempt;
        }
      };

      // 构建WebSocket URL
      const baseWsUrl = "wss://xxz-xyzw.hortorgames.com/agent";
      const wsUrl =
        customWsUrl ||
        WsAgent.buildUrl(baseWsUrl, {
          p: actualToken,
          e: "x",
          lang: "chinese",
        });

      // 保存连接信息
      wsConnections.value[roleId] = {
        agent: wsAgent,
        gameCommands,
        status: "connecting",
        roleId,
        wsUrl,
        actualToken,
        createdAt: new Date().toISOString(),
        lastError: null,
        reconnectAttempt: 0,
      };

      // 建立连接
      await wsAgent.connect(wsUrl);

      return wsAgent;
    } catch (error) {
      console.error(`创建WebSocket连接失败 [${roleId}]:`, error);
      if (wsConnections.value[roleId]) {
        wsConnections.value[roleId].status = "error";
        wsConnections.value[roleId].lastError = error.message;
      }
      return null;
    }
  };

  // 处理游戏消息
  const handleGameMessage = (roleId, message) => {
    const { cmd, body } = message;

    switch (cmd) {
      case "role_getroleinfo":
        // 降噪
        break;

      case "system_getdatabundlever":
        // 降噪
        break;

      case "task_claimdailyreward":
        // 降噪
        break;

      case "system_signinreward":
        // 降噪
        break;

      default:
      // 降噪
    }
  };

  const closeWebSocketConnection = (roleId) => {
    const connection = wsConnections.value[roleId];
    if (connection) {
      // 如果是新的WsAgent实例
      if (connection.agent && typeof connection.agent.close === "function") {
        connection.agent.close();
      }
      // 如果是旧的WebSocket实例
      else if (
        connection.connection &&
        typeof connection.connection.close === "function"
      ) {
        connection.connection.close();
      }

      delete wsConnections.value[roleId];
    }
  };

  const getWebSocketStatus = (roleId) => {
    return wsConnections.value[roleId]?.status || "disconnected";
  };

  // 发送游戏命令
  const sendGameCommand = (roleId, commandName, params = {}) => {
    const connection = wsConnections.value[roleId];
    if (!connection || !connection.agent) {
      // 降噪
      return false;
    }

    if (connection.status !== "connected") {
      // 降噪
      return false;
    }

    try {
      const { gameCommands } = connection;

      if (typeof gameCommands[commandName] === "function") {
        const command = gameCommands[commandName](0, 0, params);
        connection.agent.send(command);
        // 降噪
        return true;
      } else {
        console.error(`未知的游戏命令: ${commandName}`);
        return false;
      }
    } catch (error) {
      console.error(`发送游戏命令失败 [${roleId}] ${commandName}:`, error);
      return false;
    }
  };

  // 发送游戏命令并等待响应
  const sendGameCommandWithPromise = async (
    roleId,
    commandName,
    params = {},
    timeout = 8000,
  ) => {
    const connection = wsConnections.value[roleId];
    if (!connection || !connection.agent) {
      throw new Error(`角色 ${roleId} 的WebSocket连接不存在`);
    }

    if (connection.status !== "connected") {
      throw new Error(`角色 ${roleId} 的WebSocket未连接`);
    }

    try {
      const { gameCommands } = connection;

      if (typeof gameCommands[commandName] === "function") {
        const response = await connection.agent.sendWithPromise({
          cmd: commandName,
          body: params,
          timeout,
        });
        // 降噪
        return response;
      } else {
        throw new Error(`未知的游戏命令: ${commandName}`);
      }
    } catch (error) {
      console.error(`发送游戏命令失败 [${roleId}] ${commandName}:`, error);
      throw error;
    }
  };

  // 获取连接详细状态
  const getWebSocketDetails = (roleId) => {
    const connection = wsConnections.value[roleId];
    if (!connection) {
      return {
        status: "disconnected",
        roleId,
        error: "连接不存在",
      };
    }

    return {
      status: connection.status,
      roleId: connection.roleId,
      wsUrl: connection.wsUrl,
      connectedAt: connection.connectedAt,
      createdAt: connection.createdAt,
      lastError: connection.lastError,
      reconnectAttempt: connection.reconnectAttempt,
      agentStatus: connection.agent ? connection.agent.getStatus() : null,
    };
  };

  // 批量导入/导出功能
  const exportTokens = () => {
    return {
      userToken: userToken.value,
      gameTokens: gameTokens.value,
      exportedAt: new Date().toISOString(),
    };
  };

  const importTokens = (tokenData) => {
    try {
      if (tokenData.userToken) {
        setUserToken(tokenData.userToken);
      }

      if (tokenData.gameTokens) {
        gameTokens.value = tokenData.gameTokens;
        // 持久化到 DB
        Object.entries(gameTokens.value).forEach(([rid, data]) => {
          dbPutGameToken(rid, { ...data, roleId: rid }).catch(() => {});
        });
      }

      return { success: true, message: "Token导入成功" };
    } catch (error) {
      console.error("Token导入失败:", error);
      return { success: false, message: "导入失败：数据格式错误" };
    }
  };

  // 清理过期token
  const cleanExpiredTokens = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const cleanedTokens = {};
    let cleanedCount = 0;

    Object.entries(gameTokens.value).forEach(([roleId, tokenData]) => {
      const lastUsed = new Date(tokenData.lastUsed || tokenData.createdAt);
      if (lastUsed > oneDayAgo) {
        cleanedTokens[roleId] = tokenData;
      } else {
        cleanedCount++;
        // 关闭对应的WebSocket连接
        if (wsConnections.value[roleId]) {
          closeWebSocketConnection(roleId);
        }
        // 从 DB 删除
        dbDeleteGameToken(roleId).catch(() => {});
      }
    });

    gameTokens.value = cleanedTokens;

    return cleanedCount;
  };

  // 初始化
  const initTokenManager = async () => {
    try {
      // 一次性迁移旧 localStorage 数据（如有）
      await migrateFromLocalStorageIfNeeded();

      // 从 IndexedDB 恢复
      const [dbUser, dbTokens] = await Promise.all([
        dbGetUserToken(),
        dbGetAllGameTokens(),
      ]);

      if (dbUser) userToken.value = dbUser;
      gameTokens.value = dbTokens || {};

      // 清理过期token（会同步更新 DB）
      cleanExpiredTokens();
    } catch (e) {
      console.warn("初始化Token管理器失败，回退为空:", e);
      userToken.value = null;
      gameTokens.value = {};
    }
  };

  return {
    // 状态
    userToken,
    gameTokens,
    wsConnections,

    // 计算属性
    isUserAuthenticated,
    hasGameTokens,

    // 用户token方法
    setUserToken,
    clearUserToken,

    // 游戏token方法
    addGameToken,
    getGameToken,
    updateGameToken,
    removeGameToken,
    clearAllGameTokens,

    // WebSocket方法
    createWebSocketConnection,
    closeWebSocketConnection,
    getWebSocketStatus,
    getWebSocketDetails,
    sendGameCommand,
    sendGameCommandWithPromise,

    // 工具方法
    exportTokens,
    importTokens,
    cleanExpiredTokens,
    initTokenManager,
  };
});
