<template>
  <div class="websocket-tester">
    <n-card title="WebSocket连接测试" class="mb-4">
      <n-space direction="vertical" size="large">
        <!-- 连接状态 -->
        <n-card title="连接状态" size="small">
          <n-space align="center">
            <n-tag :type="getStatusType(status)" size="large">
              {{ getStatusText(status) }}
            </n-tag>
            <n-button
              v-if="selectedRoleId && status !== 'connected'"
              type="primary"
              :loading="status === 'connecting'"
              @click="connectWebSocket"
            >
              连接WebSocket
            </n-button>
            <n-button
              v-if="status === 'connected'"
              type="error"
              @click="disconnectWebSocket"
            >
              断开连接
            </n-button>
          </n-space>
        </n-card>

        <!-- 角色选择 -->
        <n-form-item label="选择角色">
          <n-select
            v-model:value="selectedRoleId"
            placeholder="请选择要测试的角色"
            :options="roleOptions"
            @update:value="onRoleChange"
          />
        </n-form-item>

        <!-- 连接详情 -->
        <n-card v-if="connectionDetails" title="连接详情" size="small">
          <n-descriptions :column="2" bordered size="small">
            <n-descriptions-item label="角色ID">
              {{ connectionDetails.roleId }}
            </n-descriptions-item>
            <n-descriptions-item label="状态">
              <n-tag :type="getStatusType(connectionDetails.status)">
                {{ getStatusText(connectionDetails.status) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="WebSocket URL">
              <n-text code style="font-size: 12px">
                {{ connectionDetails.wsUrl }}
              </n-text>
            </n-descriptions-item>
            <n-descriptions-item label="连接时间">
              {{ formatTime(connectionDetails.connectedAt) }}
            </n-descriptions-item>
            <n-descriptions-item
              v-if="connectionDetails.lastError"
              label="最后错误"
            >
              <n-text type="error">
                {{ connectionDetails.lastError }}
              </n-text>
            </n-descriptions-item>
            <n-descriptions-item
              v-if="connectionDetails.reconnectAttempt > 0"
              label="重连次数"
            >
              {{ connectionDetails.reconnectAttempt }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- 游戏命令测试 -->
        <n-card v-if="status === 'connected'" title="游戏命令测试" size="small">
          <n-space direction="vertical">
            <n-form-item label="选择命令">
              <n-select
                v-model:value="selectedCommand"
                placeholder="请选择要测试的命令"
                :options="commandOptions"
              />
            </n-form-item>

            <n-form-item v-if="selectedCommand" label="命令参数 (JSON)">
              <n-input
                v-model:value="commandParams"
                type="textarea"
                placeholder='例如: {"roleId": 123456}'
                :rows="3"
              />
            </n-form-item>

            <n-space>
              <n-button
                type="primary"
                :disabled="!selectedCommand"
                :loading="sendingCommand"
                @click="sendCommand"
              >
                发送命令
              </n-button>
              <n-button
                type="success"
                :disabled="!selectedCommand"
                :loading="waitingResponse"
                @click="sendCommandWithPromise"
              >
                发送并等待响应
              </n-button>
              <n-button
                type="warning"
                :disabled="!selectedCommand"
                :loading="testingConcurrency"
                @click="testConcurrentRequests"
              >
                测试并发请求
              </n-button>
            </n-space>
          </n-space>
        </n-card>

        <!-- 消息日志 -->
        <n-card title="消息日志" size="small">
          <template #header-extra>
            <n-button size="small" @click="clearLog"> 清空日志 </n-button>
          </template>

          <div class="message-log">
            <div
              v-for="(msg, index) in messageLog"
              :key="index"
              class="message-item"
              :class="`message-${msg.type}`"
            >
              <div class="message-header">
                <n-tag
                  :type="msg.type === 'sent' ? 'info' : 'success'"
                  size="small"
                >
                  {{ msg.type === "sent" ? "发送" : "接收" }}
                </n-tag>
                <n-text depth="3" style="font-size: 12px">
                  {{ formatTime(msg.timestamp) }}
                </n-text>
              </div>
              <div class="message-content">
                <pre>{{ JSON.stringify(msg.data, null, 2) }}</pre>
              </div>
            </div>
            <div v-if="messageLog.length === 0" class="no-messages">
              暂无消息日志
            </div>
          </div>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@stores/tokenStore";

const message = useMessage();
const tokenStore = useTokenStore();

// 响应式数据
const selectedRoleId = ref(null);
const status = ref("disconnected");
const connectionDetails = ref(null);
const selectedCommand = ref(null);
const commandParams = ref("{}");
const sendingCommand = ref(false);
const waitingResponse = ref(false);
const testingConcurrency = ref(false);
const messageLog = ref([]);

// Token选项
const roleOptions = computed(() => {
  return tokenStore.gameTokens.map((token) => ({
    label: `${token.name} (${token.server})`,
    value: token.id,
  }));
});

// 命令选项
const commandOptions = [
  { label: "获取角色信息", value: "role_getroleinfo" },
  { label: "获取数据包版本", value: "system_getdatabundlever" },
  { label: "签到奖励", value: "system_signinreward" },
  { label: "领取每日任务奖励", value: "task_claimdailyreward" },
  { label: "获取邮件列表", value: "mail_getlist" },
  { label: "领取所有邮件附件", value: "mail_claimallattachment" },
  { label: "获取军团信息", value: "legion_getinfo" },
  { label: "英雄招募", value: "hero_recruit" },
  { label: "领取挂机奖励", value: "system_claimhangupreward" },
];

// 方法
const getStatusType = (statusValue) => {
  const typeMap = {
    connected: "success",
    connecting: "warning",
    disconnected: "default",
    reconnecting: "info",
    error: "error",
  };
  return typeMap[statusValue] || "default";
};

const getStatusText = (statusValue) => {
  const textMap = {
    connected: "已连接",
    connecting: "连接中",
    disconnected: "已断开",
    reconnecting: "重连中",
    error: "连接错误",
  };
  return textMap[statusValue] || "未知状态";
};

const formatTime = (timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("zh-CN");
};

const onRoleChange = () => {
  updateStatus();
};

const updateStatus = () => {
  if (!selectedRoleId.value) {
    status.value = "disconnected";
    connectionDetails.value = null;
    return;
  }

  status.value = tokenStore.getWebSocketStatus(selectedRoleId.value);
  const connection = tokenStore.wsConnections[selectedRoleId.value];
  if (connection) {
    connectionDetails.value = {
      roleId: selectedRoleId.value,
      status: connection.status,
      connectedAt: connection.connectedAt,
      wsUrl: connection.wsUrl,
    };
  } else {
    connectionDetails.value = null;
  }
};

const connectWebSocket = async () => {
  if (!selectedRoleId.value) {
    message.error("请先选择Token");
    return;
  }

  try {
    status.value = "connecting";
    const token = tokenStore.gameTokens.find(
      (t) => t.id === selectedRoleId.value,
    );

    if (!token) {
      message.error("未找到Token数据");
      return;
    }

    tokenStore.createWebSocketConnection(
      selectedRoleId.value,
      token.token,
      token.wsUrl,
    );

    // 监听消息
    startMessageListener();

    message.success("WebSocket连接已启动");
  } catch (error) {
    console.error("WebSocket连接失败:", error);
    message.error("WebSocket连接失败: " + error.message);
  } finally {
    setTimeout(updateStatus, 1000); // 延迟更新状态以等待连接建立
  }
};

const disconnectWebSocket = () => {
  if (!selectedRoleId.value) return;

  tokenStore.closeWebSocketConnection(selectedRoleId.value);
  status.value = "disconnected";
  connectionDetails.value = null;
  message.info("WebSocket连接已断开");
};

const sendCommand = async () => {
  if (!selectedCommand.value) {
    message.error("请选择要发送的命令");
    return;
  }

  try {
    sendingCommand.value = true;

    let params = {};
    if (commandParams.value.trim()) {
      params = JSON.parse(commandParams.value);
    }

    const success = tokenStore.sendMessage(
      selectedRoleId.value,
      selectedCommand.value,
      params,
    );

    if (success) {
      addToLog("sent", {
        command: selectedCommand.value,
        params,
      });
      message.success("命令发送成功");
    } else {
      message.error("命令发送失败");
    }
  } catch (error) {
    console.error("发送命令失败:", error);
    message.error("发送命令失败: " + error.message);
  } finally {
    sendingCommand.value = false;
  }
};

const sendCommandWithPromise = async () => {
  if (!selectedCommand.value) {
    message.error("请选择要发送的命令");
    return;
  }

  try {
    waitingResponse.value = true;

    let params = {};
    if (commandParams.value.trim()) {
      params = JSON.parse(commandParams.value);
    }

    const response = await tokenStore.sendMessageWithPromise(
      selectedRoleId.value,
      selectedCommand.value,
      params,
    );

    addToLog("sent", {
      command: selectedCommand.value,
      params,
    });

    addToLog("received", response);

    message.success("命令执行成功，已收到响应");
  } catch (error) {
    console.error("发送命令失败:", error);
    message.error("发送命令失败: " + error.message);
  } finally {
    waitingResponse.value = false;
  }
};

const testConcurrentRequests = async () => {
  if (!selectedCommand.value) {
    message.error("请选择要发送的命令");
    return;
  }

  try {
    testingConcurrency.value = true;

    let params = {};
    if (commandParams.value.trim()) {
      params = JSON.parse(commandParams.value);
    }

    addToLog("sent", {
      message: "开始并发测试：同时发送5个相同命令",
      command: selectedCommand.value,
      params,
    });

    // 同时发送5个相同的命令
    const promises = [];
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      const promise = tokenStore
        .sendMessageWithPromise(selectedRoleId.value, selectedCommand.value, {
          ...params,
          requestIndex: i + 1,
        })
        .then((response) => ({
          requestIndex: i + 1,
          response,
          success: true,
        }))
        .catch((error) => ({
          requestIndex: i + 1,
          error: error.message,
          success: false,
        }));

      promises.push(promise);
    }

    // 等待所有请求完成
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();

    // 记录结果
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;
    const failCount = results.length - successCount;

    addToLog("received", {
      message: "并发测试完成",
      totalRequests: 5,
      successCount,
      failCount,
      duration: `${endTime - startTime}ms`,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: r.reason },
      ),
    });

    if (successCount === 5) {
      message.success(
        `并发测试成功！5个请求全部正确响应，耗时${endTime - startTime}ms`,
      );
    } else if (successCount > 0) {
      message.warning(
        `并发测试部分成功：${successCount}个成功，${failCount}个失败`,
      );
    } else {
      message.error("并发测试失败：所有请求都失败了");
    }
  } catch (error) {
    console.error("并发测试失败:", error);
    message.error("并发测试失败: " + error.message);
    addToLog("received", {
      message: "并发测试异常",
      error: error.message,
    });
  } finally {
    testingConcurrency.value = false;
  }
};

const startMessageListener = () => {
  // 这里简化处理，实际应该通过WebSocket客户端的onMessage事件来接收消息
  // 由于消息处理在store中，这里只是演示
};

const addToLog = (type, data) => {
  messageLog.value.unshift({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  // 限制日志条数
  if (messageLog.value.length > 100) {
    messageLog.value = messageLog.value.slice(0, 100);
  }
};

const clearLog = () => {
  messageLog.value = [];
};

// 定时更新状态
let statusTimer = null;

onMounted(() => {
  // 定时更新连接状态
  statusTimer = setInterval(() => {
    if (selectedRoleId.value) {
      updateStatus();
    }
  }, 1000);
});

onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer);
  }
});
</script>

<style scoped>
.websocket-tester {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.message-log {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}

.message-item {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  background-color: white;
}

.message-sent {
  border-left: 3px solid #2080f0;
}

.message-received {
  border-left: 3px solid #18a058;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-content pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-messages {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
