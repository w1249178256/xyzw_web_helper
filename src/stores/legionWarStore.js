import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { XyzwLegionWarWebSocketClient } from "@/utils/xyzwLegionWarWebSocket";
import { extractValidData } from "@/utils/legionWar";
import { getCurrentTimeByFormat } from "@/utils/DateTimeUtils";

export const useLegionWarStore = defineStore("legionWar", () => {
  const tokenStore = useTokenStore();

  // 状态
  const isConnected = ref(false);
  const connecting = ref(false);
  const battlefieldId = ref(null);
  const validData = ref(null);
  const legionDetails = ref({});
  const lastUpdateTime = ref("");
  const isJoined = ref(false); // 是否已进入战场

  // 引用计数，用于管理连接生命周期
  const subscriberCount = ref(0);
  let disconnectTimer = null;

  // WebSocket 实例
  let legionWarWebSocket = null;
  // 消息提示实例（需要在组件中使用，这里先用 console 或者简单的 error throwing，或者在 action 中传入 message）
  // 由于 pinia 中不能直接使用 useMessage，我们可以在 action 中接收 message 对象，或者只抛出错误让组件处理
  // 但为了统一管理，简单的 toast 可以在这里处理，或者通过 global properties，或者不处理 UI 反馈只处理逻辑。
  // 最佳实践：Store 处理逻辑和状态，UI 反馈由组件根据 Store 状态变化或 Action 返回结果来处理。
  // 但为了方便，我们可以返回 Promise，组件 catch 错误显示。

  // 连接 WebSocket
  const connect = async () => {
    subscriberCount.value++;

    // 如果有待执行的断开操作，取消它
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }

    if (!tokenStore.selectedToken) {
      // 如果没有token，减少计数并抛出错误
      subscriberCount.value--;
      throw new Error("请先选择一个Token");
    }

    if (isConnected.value) {
      // 已经连接，如果还没进入战场（可能是之前的连接还在但状态不对），尝试重新进入
      if (!isJoined.value && !connecting.value) {
        tryJoinBattlefield();
      }
      return;
    }

    if (connecting.value) {
      return; // 正在连接中
    }

    connecting.value = true;
    try {
      const tokenId = tokenStore.selectedToken.id;

      // 1. 获取战场信息
      // 如果已经有 battlefieldId 且 token 没变，是否需要重新获取？
      // 为了安全起见，每次连接前重新获取 sid 和 battlefieldId
      const getbattlefield = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getbattlefield",
        {},
        10000,
      );

      if (!getbattlefield || !getbattlefield.info) {
        throw new Error("无法获取战场信息");
      }

      battlefieldId.value = getbattlefield.info.battlefieldId;

      // 2. 构建 WS URL
      const baseWsUrl =
        "wss://xxz-xyzw-new.hortorgames.com/agent" +
        `?p=${encodeURIComponent(tokenStore.selectedToken.token)}` +
        `&e=x&sid2=${getbattlefield.info.sid}&lang=chinese` +
        `&sid2=${getbattlefield.info.sid}`;

      // 3. 建立连接
      legionWarWebSocket = new XyzwLegionWarWebSocketClient({
        url: baseWsUrl,
        utils: null,
        hint: battlefieldId.value,
        heartbeatMs: 5000,
      });

      legionWarWebSocket.onConnect = () => {
        console.log("战场WebSocket连接成功");
        isConnected.value = true;
        connecting.value = false;

        // 延迟发送进入战场指令
        setTimeout(() => {
          tryJoinBattlefield();
        }, 1000);
      };

      legionWarWebSocket.setMessageListener((msg) => {
        const cmd = msg?.cmd || "unknown";
        // 1. war_getbattlefieldinfo: 完整的战场快照
        if (cmd.includes("war_getbattlefieldinfo")) {
          // 更新数据
          const extracted = extractValidData(msg.rawData);
          if (extracted) {
            validData.value = extracted;
            lastUpdateTime.value = getCurrentTimeByFormat("HH:mm:ss");

            // 获取俱乐部详情以获取公告
            Object.values(extracted.legionInfo).forEach((legion) => {
              // 如果还没有该俱乐部的详情，则发送请求
              if (!legionDetails.value[legion.id]) {
                fetchLegionDetail(legion.id);
              }
            });
          }
        }
      });

      legionWarWebSocket.onDisconnect = (event) => {
        console.log("战场WebSocket断开", event);
        isConnected.value = false;
        isJoined.value = false;
        connecting.value = false;
        // 不清除 validData，以便在断开后仍能看到最后的数据？或者清除？
        // 原组件中没有清除 validData (Map)，但 Statistics 组件也没有清除。
        // 为了体验，断开后保留最后数据比较好。
      };

      legionWarWebSocket.onError = (error) => {
        console.error("战场WebSocket错误", error);
        isConnected.value = false;
        isJoined.value = false;
        connecting.value = false;
      };

      legionWarWebSocket.init();
    } catch (error) {
      console.error("连接失败:", error);
      connecting.value = false;
      subscriberCount.value--; // 连接失败，回滚计数
      throw error;
    }
  };

  const tryJoinBattlefield = () => {
    if (legionWarWebSocket && isConnected.value) {
      legionWarWebSocket.send("war_enterbattlefield", {
        battlefieldId: battlefieldId.value,
        useGzip: true,
      });
      isJoined.value = true;

      // 主动请求一次数据
      refreshData();
    }
  };

  const disconnect = (force = false) => {
    if (subscriberCount.value > 0) {
      subscriberCount.value--;
    }

    if (force) {
      // 强制断开，重置计数
      subscriberCount.value = 0;
      performDisconnect();
    } else if (subscriberCount.value <= 0) {
      // 延迟断开，防止页面切换时频繁断连
      if (disconnectTimer) clearTimeout(disconnectTimer);

      disconnectTimer = setTimeout(() => {
        if (subscriberCount.value <= 0) {
          performDisconnect();
        }
      }, 3000); // 3秒缓冲期
    }
  };

  const performDisconnect = () => {
    if (legionWarWebSocket) {
      legionWarWebSocket.disconnect();
      legionWarWebSocket = null;
    }
    isConnected.value = false;
    isJoined.value = false;
    connecting.value = false;
    // validData.value = null; // 可选：是否清空数据
    battlefieldId.value = null;
    disconnectTimer = null;
  };

  const refreshData = () => {
    if (!isConnected.value || !legionWarWebSocket) {
      // 如果未连接，尝试连接
      // 但 refreshData 通常由用户手动触发，这里还是抛错比较合适，或者静默失败
      console.warn("请先连接到战场");
      return;
    }

    if (!battlefieldId.value) {
      console.warn("未获取到战场ID");
      return;
    }

    legionWarWebSocket.send("war_getbattlefieldinfo", {
      battlefieldId: battlefieldId.value,
    });
  };

  const fetchLegionDetail = async (legionId) => {
    if (!tokenStore.selectedToken) return;
    try {
      const response = await tokenStore.sendMessageWithPromise(
        tokenStore.selectedToken.id,
        "legion_getinfobyid",
        { legionId: legionId },
      );

      if (response && (response.legionData || response.info)) {
        legionDetails.value[legionId] = response.legionData || response.info;
      }
    } catch (error) {
      console.error(`获取俱乐部[${legionId}]详情失败`, error);
    }
  };

  return {
    // State
    isConnected,
    connecting,
    battlefieldId,
    validData,
    legionDetails,
    lastUpdateTime,
    isJoined,

    // Actions
    connect,
    disconnect,
    refreshData,
    fetchLegionDetail,
  };
});
