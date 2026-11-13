<template>
  <div class="pushing-levels-page">
    <div class="pl-header">
      <div>
        <h2>战斗推关</h2>
        <p>主线推图</p>
      </div>
      <div class="pl-header-actions">
        <n-switch v-model:value="autoContinue" size="small">
          <template #checked>自动继续</template>
          <template #unchecked>手动停止</template>
        </n-switch>
        <n-input-number
          v-model:value="maxRetries"
          :min="1"
          :max="999999"
          size="small"
          class="retry-input"
        />
        <span class="retry-label">最大重试</span>
      </div>
    </div>

    <!-- 账号列表（上方，勾选模式，4个一行，简洁） -->
    <n-card class="account-card-top" :content-style="{ padding: '12px 16px' }">
      <div class="account-toolbar">
        <n-input
          v-model:value="searchKeyword"
          clearable
          size="tiny"
          placeholder="搜索账号"
          class="search-input"
        />
        <n-checkbox
          :checked="allVisibleSelected"
          :indeterminate="someVisibleSelected"
          @update:checked="toggleAllVisible"
        >
          全选
        </n-checkbox>
        <div v-if="tokenGroups.length" class="group-list-inline">
          <button
            v-for="group in tokenGroups"
            :key="group.id"
            class="group-chip"
            :class="{ selected: selectedGroupIds.includes(group.id) }"
            :style="groupChipStyle(group)"
            @click="toggleGroup(group)"
          >
            {{ group.name }}
          </button>
        </div>
      </div>

      <div v-if="filteredTokens.length" class="token-grid">
        <div
          v-for="gameToken in filteredTokens"
          :key="gameToken.id"
          class="token-cell"
          :class="{ selected: selectedTokenIds.includes(gameToken.id) }"
        >
          <n-checkbox
            :checked="selectedTokenIds.includes(gameToken.id)"
            @update:checked="(checked) => toggleToken(gameToken.id, checked)"
            @click.stop
          />
          <span class="token-server" :title="gameToken.server || '未知区服'">
            {{ gameToken.server || "未知区服" }}
          </span>
          <span class="token-sep">-</span>
          <span class="token-name" :title="gameToken.name || gameToken.id">
            {{ gameToken.name || gameToken.id }}
          </span>
          <span
            class="status-dot"
            :class="getStatusClass(gameToken.id)"
            :title="getStatusTitle(gameToken.id)"
          ></span>
        </div>
      </div>
      <n-empty v-else description="暂无账号" size="small" />
    </n-card>

    <!-- 操作区：火把配置 + 控制按钮（同行） -->
    <n-card class="control-card" :content-style="{ padding: '12px 16px' }">
      <div class="control-row">
        <div class="torch-field">
          <span class="torch-label">火把类型</span>
          <n-select
            v-model:value="torchItemId"
            :options="torchOptions"
            size="small"
            class="torch-select"
          />
        </div>
        <div class="torch-field">
          <span class="torch-label">使用数量（1-999）</span>
          <n-input-number
            v-model:value="torchQuantity"
            :min="1"
            :max="999"
            size="small"
            class="torch-input"
          />
        </div>
        <n-button
          size="small"
          type="primary"
          :disabled="!selectedTokenIds.length || !hasAnyRunning"
          :loading="torchRunning"
          @click="useTorchForSelected"
        >
          使用火把
        </n-button>
        <n-button
          type="primary"
          size="small"
          :disabled="!selectedTokenIds.length || allSelectedRunning"
          @click="startSelected"
        >
          开始推图
        </n-button>
        <n-button
          type="error"
          size="small"
          :disabled="!hasSelectedRunning"
          @click="stopSelected"
        >
          全部停止
        </n-button>
        <div class="control-spacer"></div>
        <span class="status-text"
          >已选择 {{ selectedTokenIds.length }} 个账号，正在推图
          {{ runningCount }} 个账号</span
        >
        <n-button size="small" @click="clearSelection">清除选择</n-button>
      </div>
    </n-card>

    <!-- 推图卡片区 -->
    <div v-if="runningCards.length" class="running-section">
      <n-card
        v-for="card in runningCards"
        :key="card.tokenId"
        class="running-card"
        :class="{ active: card.running }"
      >
        <div class="running-head">
          <div class="card-title">
            <strong :title="card.tokenName">{{ card.tokenName }}</strong>
            <span
              class="status-dot small"
              :class="getStatusClass(card.tokenId)"
              :title="getStatusTitle(card.tokenId)"
            ></span>
          </div>
          <n-space size="small">
            <n-tag size="small" type="success">{{ card.wins }}胜</n-tag>
            <n-tag size="small" type="error">{{ card.losses }}负</n-tag>
            <n-tag
              size="small"
              type="warning"
              title="连续失败次数：自上次胜利起累计，达到最大失败次数后自动停止推图"
            >
              连败 {{ card.retries }}
            </n-tag>
          </n-space>
        </div>
        <div class="level-line">
          当前关卡：{{ card.level > 0 ? `${card.level}关` : "--" }}
        </div>
        <div class="level-line">boss：{{ card.bossName || "--" }}</div>
        <div class="level-line torch-line">{{ card.torchLabel }}</div>
        <div class="running-body">
          <template v-if="card.running">
            <div class="countdown-row">
              <span class="countdown-text"
                >战斗剩余 {{ formatDuration(card.countdown) }}</span
              >
              <n-progress
                class="inline-progress"
                type="line"
                :percentage="progressPercent(card)"
                :show-indicator="false"
                :height="8"
                status="success"
              />
            </div>
            <div class="card-actions">
              <span>已战斗 {{ card.battles }} 场</span>
              <n-button size="tiny" type="error" @click="stopOne(card.tokenId)"
                >停止</n-button
              >
            </div>
          </template>
          <template v-else>
            <div class="waiting-line">等待推图</div>
            <div class="card-actions">
              <span class="err-text" :title="card.lastError || '无'">
                最近错误：{{ card.lastError || "无" }}
              </span>
              <n-button
                size="tiny"
                type="primary"
                @click="startOne(card.tokenId)"
                >启动</n-button
              >
            </div>
          </template>
        </div>
      </n-card>
    </div>

    <!-- 推图日志区 -->
    <n-card class="log-card" :content-style="{ padding: '12px 16px' }">
      <template #header>
        <div class="log-header">
          <div>
            推图日志
            <n-tag size="small">{{ logs.length }}/2000 条</n-tag>
          </div>
          <div class="log-actions">
            <n-checkbox v-model:checked="autoScroll" size="small"
              >自动滚动</n-checkbox
            >
            <n-checkbox v-model:checked="onlyErrors" size="small"
              >只看错误</n-checkbox
            >
            <n-button size="tiny" @click="clearLogs">清空</n-button>
          </div>
        </div>
      </template>
      <div class="log-filter">
        <span class="log-filter-label">筛选账号：</span>
        <n-select
          v-model:value="logFilterTokenId"
          :options="logFilterOptions"
          size="small"
          clearable
          placeholder="全部账号"
          class="log-filter-select"
        />
        <n-button
          size="tiny"
          :disabled="!logFilterTokenId"
          @click="logFilterTokenId = null"
        >
          清除筛选
        </n-button>
        <span class="log-filter-count">共 {{ visibleLogs.length }} 条</span>
      </div>
      <div ref="logsContainer" class="log-container">
        <div
          v-for="(log, logIndex) in visibleLogs"
          :key="logIndex"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-name">[{{ log.tokenName }}]</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        <n-empty
          v-if="!visibleLogs.length"
          description="暂无日志"
          size="small"
        />
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { useMessage } from "naive-ui";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import {
  bgSleep,
  startAudioKeepAlive,
  startBgTicker,
  stopAudioKeepAlive,
} from "@/utils/bgTicker";
import { BOSS_NAMES } from "./boss_names.js";

const MAX_LOGS = 2000;
const KNOWLEDGE_COIN_ITEM_ID = 1024;
// 火把信息刷新间隔（毫秒）
const TORCH_REFRESH_INTERVAL = 30000;

const message = useMessage();
const tokenStore = useTokenStore();

const selectedTokenIds = ref([]);
const selectedGroupIds = ref([]);
const searchKeyword = ref("");
const autoContinue = ref(true);
const maxRetries = ref(999999);
const autoScroll = ref(true);
const onlyErrors = ref(false);
const logsContainer = ref(null);
const logs = ref([]);
const runningStates = reactive({});
const torchRunning = ref(false);
const torchItemId = ref(1008);
const torchQuantity = ref(150);
const logFilterTokenId = ref(null);
// 倒计时刷新（用于火把时间），每秒更新一次显示
const tickNow = ref(Date.now());
let tickTimer = null;

const torchOptions = [
  { label: "木材火把", value: 1008 },
  { label: "青铜火把", value: 1009 },
  { label: "咸神火把", value: 1010 },
];

const tokens = computed(() => tokenStore.gameTokens || []);
const tokenGroups = computed(() => tokenStore.tokenGroups || []);

const filteredTokens = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const list = [...tokens.value].sort((a, b) => {
    const left = new Date(
      a.lastUsed || a.updatedAt || a.createdAt || 0,
    ).getTime();
    const right = new Date(
      b.lastUsed || b.updatedAt || b.createdAt || 0,
    ).getTime();
    return left - right;
  });

  if (!keyword) return list;
  return list.filter((token) => {
    return [token.name, token.server, token.remark, token.id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const runningCount = computed(() => {
  return Object.values(runningStates).filter(
    (state) => state?.running && !state.stopFlag,
  ).length;
});

const allVisibleSelected = computed(() => {
  return (
    filteredTokens.value.length > 0 &&
    filteredTokens.value.every((token) =>
      selectedTokenIds.value.includes(token.id),
    )
  );
});

const someVisibleSelected = computed(() => {
  return (
    filteredTokens.value.some((token) =>
      selectedTokenIds.value.includes(token.id),
    ) && !allVisibleSelected.value
  );
});

const allSelectedRunning = computed(() => {
  return (
    selectedTokenIds.value.length > 0 &&
    selectedTokenIds.value.every((tokenId) => isRunning(tokenId))
  );
});

const hasSelectedRunning = computed(() => {
  return selectedTokenIds.value.some((tokenId) => isRunning(tokenId));
});

const hasAnyRunning = computed(() => {
  return Object.values(runningStates).some(
    (state) => state?.running && !state.stopFlag,
  );
});

function getTorchLabel(state) {
  if (!state) return "火把 无";
  const remaining = computeTorchRemaining(state);
  if (state.torchType > 0 && remaining > 0) {
    const name = state.torchTypeName || getTorchName(state.torchType);
    return `${name} ${formatTorchTime(remaining)}`;
  }
  return "火把 无";
}

const runningCards = computed(() => {
  const ids = new Set(selectedTokenIds.value);
  Object.values(runningStates).forEach((state) => {
    if (state?.tokenId) ids.add(state.tokenId);
  });

  return [...ids]
    .filter((tokenId) => tokens.value.some((token) => token.id === tokenId))
    .map((tokenId) => {
      const token = getToken(tokenId);
      const state = runningStates[tokenId] || {};
      const level = Number(state.level || 0);
      return {
        tokenId,
        tokenName: token?.name || tokenId,
        running: Boolean(state.running && !state.stopFlag),
        level,
        bossName:
          state.bossName && Number(state.bossLevel || 0) === level
            ? state.bossName
            : getBossName(level),
        wins: state.wins || 0,
        losses: state.losses || 0,
        battles: state.battles || 0,
        // 连续失败次数：自上次胜利起累计（胜利清零、失败与异常累加）
        retries: state.retries || 0,
        countdown: state.countdown || 0,
        totalTime: state.totalTime || 0,
        lastError: state.lastError || "",
        torchLabel: getTorchLabel(state),
      };
    });
});

const visibleLogs = computed(() => {
  let list = logs.value;
  if (logFilterTokenId.value) {
    list = list.filter((log) => log.tokenId === logFilterTokenId.value);
  }
  if (onlyErrors.value) {
    list = list.filter((log) => log.type === "error");
  }
  return list;
});

const logFilterOptions = computed(() => {
  const map = new Map();
  logs.value.forEach((log) => {
    if (!map.has(log.tokenId)) {
      map.set(log.tokenId, { label: log.tokenName, value: log.tokenId });
    }
  });
  selectedTokenIds.value.forEach((id) => {
    if (!map.has(id)) {
      const t = getToken(id);
      map.set(id, { label: t?.name || id, value: id });
    }
  });
  Object.values(runningStates).forEach((state) => {
    if (state?.tokenId && !map.has(state.tokenId)) {
      map.set(state.tokenId, {
        label: state.tokenName || state.tokenId,
        value: state.tokenId,
      });
    }
  });
  return Array.from(map.values());
});

watch(
  () => [visibleLogs.value.length, onlyErrors.value, logFilterTokenId.value],
  () => {
    if (!autoScroll.value) return;
    nextTick(() => {
      const el = logsContainer.value;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  },
);

function getToken(tokenId) {
  return tokens.value.find((token) => token.id === tokenId);
}

function getTokenName(tokenId) {
  return getToken(tokenId)?.name || tokenId;
}

function getWebSocketStatus(tokenId) {
  return tokenStore.getWebSocketStatus(tokenId) || "disconnected";
}

function isConnected(tokenId) {
  return getWebSocketStatus(tokenId) === "connected";
}

function isRunning(tokenId) {
  const state = runningStates[tokenId];
  return Boolean(state?.running && !state.stopFlag);
}

function getStatusClass(tokenId) {
  const status = getWebSocketStatus(tokenId);
  if (status === "connected") return "status-green";
  if (status === "connecting") return "status-blue";
  if (status === "error") return "status-red";
  return "status-gray";
}

function getStatusTitle(tokenId) {
  const status = getWebSocketStatus(tokenId);
  const map = {
    connected: "已连接",
    connecting: "连接中",
    disconnected: "未连接",
    error: "连接异常",
    disconnecting: "断开中",
  };
  return map[status] || "未连接";
}

function toggleToken(tokenId, checked) {
  if (checked) {
    selectedTokenIds.value = [...new Set([...selectedTokenIds.value, tokenId])];
  } else {
    selectedTokenIds.value = selectedTokenIds.value.filter(
      (id) => id !== tokenId,
    );
  }
}

function toggleAllVisible(checked) {
  const visibleIds = filteredTokens.value.map((token) => token.id);
  if (checked) {
    selectedTokenIds.value = [
      ...new Set([...selectedTokenIds.value, ...visibleIds]),
    ];
    return;
  }

  const visibleSet = new Set(visibleIds);
  selectedTokenIds.value = selectedTokenIds.value.filter(
    (id) => !visibleSet.has(id),
  );
}

function toggleGroup(group) {
  const index = selectedGroupIds.value.indexOf(group.id);
  const validIds = (group.tokenIds || []).filter((tokenId) =>
    getToken(tokenId),
  );

  if (index >= 0) {
    selectedGroupIds.value.splice(index, 1);
    const groupSet = new Set(validIds);
    selectedTokenIds.value = selectedTokenIds.value.filter(
      (tokenId) => !groupSet.has(tokenId),
    );
  } else {
    selectedGroupIds.value.push(group.id);
    selectedTokenIds.value = [
      ...new Set([...selectedTokenIds.value, ...validIds]),
    ];
  }
}

function groupChipStyle(group) {
  const selected = selectedGroupIds.value.includes(group.id);
  return selected
    ? { backgroundColor: group.color, borderColor: group.color, color: "#fff" }
    : { borderColor: group.color, color: group.color };
}

function clearSelection() {
  Object.keys(runningStates).forEach((tokenId) => {
    stopOne(tokenId);
  });
  Object.keys(runningStates).forEach((tokenId) => {
    delete runningStates[tokenId];
  });
  selectedTokenIds.value = [];
  selectedGroupIds.value = [];
}

function initState(tokenId, tokenName) {
  runningStates[tokenId] = {
    tokenId,
    tokenName,
    running: true,
    stopFlag: false,
    level: 0,
    bossName: "",
    bossLevel: 0, // bossName 对应的关卡，用于判断名称是否过期
    wins: 0,
    losses: 0,
    retries: 0,
    maxRetries: maxRetries.value || 999999,
    battles: 0,
    countdown: 0,
    totalTime: 0,
    lastError: "",
    startTime: Date.now(),
    consecutiveErrors: 0,
    maxConsecutiveErrors: 5,
    // 火把相关
    torchType: 0,
    torchTypeName: "",
    torchRemaining: 0,
    torchSettleTime: 0,
    torchActive: false,
    torchBaseTimestamp: 0,
    torchBaseRemaining: 0,
    lastTorchFetch: 0,
  };
}

function addLog(tokenId, tokenName, msg, type = "info") {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    tokenId,
    tokenName,
    msg,
    type,
  });

  if (logs.value.length > MAX_LOGS) {
    const overflow = logs.value.length - MAX_LOGS;
    logs.value.splice(0, overflow);
  }
}

function clearLogs() {
  logs.value = [];
}

function sanitizeError(error) {
  return String(error?.message || error || "")
    .replace(/请求超时: \w+(\s*\(\d+ms\))?/g, "请求超时")
    .replace(/\b\w[\dA-Za-z]*_\w+\b(\s*\(\d+ms\))?/g, "")
    .trim();
}

function pickNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function responseBody(response) {
  if (response?.body && typeof response.body === "object") return response.body;
  return response || {};
}

function getTorchName(torchType) {
  if (!torchType || torchType === 0) return "";
  const option = torchOptions.find((item) => item.value === torchType);
  return option ? option.label : `火把(${torchType})`;
}

function applyTorchInfo(state, info) {
  if (!state || !info) return;
  const type = Number(info.torchType || 0);
  const remaining = Number(info.torchRemaining || 0);
  const settleTime = Number(info.torchSettleTime || 0);

  state.torchType = type;
  state.torchTypeName = getTorchName(type);
  state.torchRemaining = remaining;
  state.torchSettleTime = settleTime;
  state.torchActive = type > 0 && remaining > 0;
  state.torchBaseTimestamp = Date.now();
  state.torchBaseRemaining = remaining;
  state.lastTorchFetch = Date.now();
}

function readTorchFromResponse(response) {
  const body = responseBody(response);
  const role = body.role || body.body?.role || {};
  return {
    torchType: pickNumber(role.autoClickType, body.autoClickType) || 0,
    torchRemaining: pickNumber(role.autoClickTime, body.autoClickTime) || 0,
    torchSettleTime:
      pickNumber(role.autoClickSettleTime, body.autoClickSettleTime) || 0,
  };
}

function computeTorchRemaining(state) {
  if (!state) return 0;
  // settleTime 是绝对时间戳时才使用它计算倒计时
  if (state.torchSettleTime > 0) {
    const settleMs =
      state.torchSettleTime < 1e12
        ? state.torchSettleTime * 1000
        : state.torchSettleTime;
    if (settleMs > tickNow.value) {
      return Math.max(0, Math.floor((settleMs - tickNow.value) / 1000));
    }
  }
  // 否则用基础值做本地倒计时
  if (state.torchBaseTimestamp && state.torchBaseRemaining) {
    const diff =
      state.torchBaseRemaining -
      Math.floor((tickNow.value - state.torchBaseTimestamp) / 1000);
    return Math.max(0, diff);
  }
  return Number(state.torchRemaining || 0);
}

function formatTorchTime(seconds) {
  if (!seconds || seconds <= 0) return "0分钟";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

function getBossName(level) {
  if (!level || level <= 0) return "";
  return BOSS_NAMES[level] || "";
}

/**
 * 更新关卡并同步 BOSS 名称。
 * 服务器返回名称时优先使用，否则按当前关卡从 BOSS_NAMES 重新取值，
 * 避免关卡推进后仍显示启动时那一关的 BOSS。
 */
function applyLevel(state, level, serverBossName = "") {
  if (!state) return;
  const nextLevel = Number(level) || 0;
  if (nextLevel > 0) state.level = nextLevel;

  if (serverBossName) {
    state.bossName = serverBossName;
    state.bossLevel = state.level;
    return;
  }
  if (state.bossLevel !== state.level || !state.bossName) {
    state.bossName = getBossName(state.level);
    state.bossLevel = state.level;
  }
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m${rest}s` : `${rest}s`;
}

function progressPercent(card) {
  if (!card.totalTime) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((1 - card.countdown / card.totalTime) * 100)),
  );
}

/**
 * 等待指定毫秒。
 * 用 bgSleep 而不是原生 setTimeout：切到后台时原生定时器会被压到每分钟一次，
 * 推关循环就会卡死；bgSleep 由 Worker 节拍驱动，后台依旧按秒唤醒。
 */
function sleep(ms) {
  return bgSleep(ms);
}

async function waitConnected(tokenId, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isConnected(tokenId)) return true;
    await sleep(200);
  }
  return isConnected(tokenId);
}

async function ensureConnected(tokenId, retryCount = 2) {
  if (isConnected(tokenId)) return true;

  const token = getToken(tokenId);
  const tokenName = token?.name || tokenId;
  if (!token) {
    addLog(tokenId, tokenName, "重连失败：未找到账号数据", "error");
    return false;
  }

  for (let attempt = 0; attempt < retryCount; attempt++) {
    if (attempt > 0) {
      addLog(
        tokenId,
        tokenName,
        `重连尝试 ${attempt}/${retryCount}，等待 3 秒...`,
        "warning",
      );
      await sleep(3000);
    } else {
      addLog(tokenId, tokenName, "WebSocket 断开，尝试连接...", "info");
    }

    try {
      await tokenStore.createWebSocketConnection(
        tokenId,
        token.token,
        token.wsUrl,
      );
      if (await waitConnected(tokenId, 3000)) {
        addLog(tokenId, tokenName, "WebSocket 连接成功", "success");
        return true;
      }
    } catch (error) {
      addLog(tokenId, tokenName, `连接失败：${sanitizeError(error)}`, "error");
    }
  }

  addLog(
    tokenId,
    tokenName,
    `WebSocket 连接失败，已重试 ${retryCount} 次，放弃`,
    "error",
  );
  return false;
}

async function fetchTorchInfo(tokenId, tokenName, { silent = false } = {}) {
  if (!isConnected(tokenId)) return null;
  try {
    const response = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
      10000,
    );
    const info = readTorchFromResponse(response);
    const state = runningStates[tokenId] || initState(tokenId, tokenName);
    if (state !== runningStates[tokenId]) runningStates[tokenId] = state;
    applyTorchInfo(state, info);
    if (!silent) {
      if (info.torchType > 0) {
        addLog(
          tokenId,
          tokenName,
          `火把状态：${state.torchTypeName} ${formatTorchTime(state.torchRemaining)}`,
          "info",
        );
      } else {
        addLog(tokenId, tokenName, "当前没有使用中的火把", "info");
      }
    }
    return state;
  } catch (error) {
    if (!silent) {
      addLog(
        tokenId,
        tokenName,
        `获取火把信息失败：${sanitizeError(error)}`,
        "warning",
      );
    }
    return null;
  }
}

async function initializeBattleData(tokenId, tokenName) {
  try {
    await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
      10000,
    );
    const response = await tokenStore.sendMessageWithPromise(
      tokenId,
      "fight_startlevel",
      {},
      10000,
    );
    const version =
      response?.battleData?.version || response?.body?.battleData?.version;
    if (version) {
      tokenStore.setBattleVersion(version);
      addLog(tokenId, tokenName, `battleVersion: ${version}`, "info");
    }
  } catch (error) {
    addLog(
      tokenId,
      tokenName,
      `初始化战斗数据失败：${sanitizeError(error)}`,
      "warning",
    );
  }
}

async function upgradeHangupReward(tokenId, tokenName) {
  try {
    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
      5000,
    );
    const items =
      roleInfo?.role?.items ||
      roleInfo?.body?.role?.items ||
      roleInfo?.items ||
      [];
    let coinCount = 0;

    if (Array.isArray(items)) {
      const coin = items.find(
        (entry) => Number(entry.id ?? entry.itemId) === KNOWLEDGE_COIN_ITEM_ID,
      );
      coinCount = Number(coin?.num ?? coin?.count ?? coin?.quantity ?? 0);
    } else if (items && typeof items === "object") {
      coinCount = Number(
        items[KNOWLEDGE_COIN_ITEM_ID]?.num ??
          items[KNOWLEDGE_COIN_ITEM_ID] ??
          0,
      );
    }

    if (coinCount <= 0) {
      addLog(tokenId, tokenName, "知识币不足，跳过升级挂机奖励", "info");
      return;
    }

    addLog(
      tokenId,
      tokenName,
      `知识币剩余：${coinCount}，开始升级挂机奖励`,
      "info",
    );
    let used = 0;
    while (coinCount > 0) {
      const state = runningStates[tokenId];
      if (!state || state.stopFlag) break;

      const upgradeNum = coinCount >= 50 ? 50 : coinCount >= 10 ? 10 : 1;
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "system_hangupupgrade",
          { upgradeNum },
          5000,
        );
        coinCount -= upgradeNum;
        used += upgradeNum;
        addLog(
          tokenId,
          tokenName,
          `升级挂机 +${upgradeNum}，剩余 ${coinCount}`,
          "success",
        );
      } catch (error) {
        addLog(
          tokenId,
          tokenName,
          `升级挂机失败 (${upgradeNum})：${sanitizeError(error)}`,
          "warning",
        );
        break;
      }
      await sleep(1200);
    }

    if (used > 0) {
      addLog(
        tokenId,
        tokenName,
        `升级挂机奖励完成，共用 ${used} 个知识币`,
        "success",
      );
    }
  } catch (error) {
    addLog(
      tokenId,
      tokenName,
      `升级挂机奖励异常：${sanitizeError(error)}`,
      "warning",
    );
  }
}

async function runOneBattle(tokenId, tokenName) {
  const state = runningStates[tokenId];
  if (!state || state.stopFlag) return { stopped: true };

  let battleTime = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_calcleveltime",
        {},
        15000,
      );
      const body = responseBody(response);
      battleTime = pickNumber(body.battleTime, body.body?.battleTime) || 0;
      const syncedLevel = pickNumber(
        body.currLevel,
        body.levelId,
        body.body?.currLevel,
      );
      const syncedBossName =
        body.bossName || body.body?.bossName || body.role?.bossName || "";

      if (syncedLevel !== null && syncedLevel !== state.level) {
        applyLevel(state, syncedLevel, syncedBossName);
        addLog(tokenId, tokenName, `等级同步：${syncedLevel}`, "info");
        if (state.bossName) {
          addLog(tokenId, tokenName, `BOSS：${state.bossName}`, "info");
        }
      } else if (syncedBossName && syncedBossName !== state.bossName) {
        applyLevel(state, state.level, syncedBossName);
        addLog(tokenId, tokenName, `BOSS同步：${syncedBossName}`, "info");
      } else {
        applyLevel(state, state.level);
      }
      if (battleTime > 0) break;

      state.losses += 1;
      state.retries += 1;
      state.lastError = "服务器未返回战斗时间";
      addLog(
        tokenId,
        tokenName,
        `服务器未返回有效战斗时间，重试 ${state.retries}`,
        "warning",
      );
    } catch (error) {
      if (String(error?.message || "").includes("WebSocket") && attempt === 0) {
        if (await ensureConnected(tokenId)) continue;
      }

      state.losses += 1;
      state.retries += 1;
      state.lastError = sanitizeError(error);
      addLog(
        tokenId,
        tokenName,
        `计算战斗时间失败，重试 ${state.retries}：${state.lastError}`,
        "error",
      );
      return { success: false, error: state.lastError };
    }
  }

  if (battleTime <= 0) {
    if (state.retries >= state.maxRetries) state.stopFlag = true;
    return { success: false, error: state.lastError };
  }

  state.totalTime = battleTime;
  state.countdown = battleTime;
  state.battles += 1;
  addLog(
    tokenId,
    tokenName,
    `开始关卡 ${state.level || 0}，预计 ${battleTime}s`,
    "info",
  );

  if (state.level > 0 && state.level % 100 === 1) {
    addLog(
      tokenId,
      tokenName,
      `通过逢100关卡 ${state.level - 1}，自动升级挂机奖励`,
      "info",
    );
    await upgradeHangupReward(tokenId, tokenName);
  }

  const startedAt = Date.now();
  let tick = 0;
  while (state.countdown > 0 && !state.stopFlag) {
    await sleep(1000);
    tick += 1;
    state.countdown = Math.max(
      0,
      Math.ceil((battleTime * 1000 - (Date.now() - startedAt)) / 1000),
    );
    if (tick % 25 === 0) {
      try {
        tokenStore.sendMessage(tokenId, "heart_beat");
      } catch {}
    }
  }

  if (state.stopFlag) return { stopped: true };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_level",
        {},
        15000,
      );
      const body = responseBody(response);
      const success = Boolean(body.success || body.isWin);
      const nextLevel = pickNumber(
        body.currLevel,
        body.nextLevel,
        body.levelId,
      );
      const nextBossName =
        body.bossName || body.body?.bossName || body.role?.bossName || "";

      if (success) {
        state.wins += 1;
        state.retries = 0;
        state.consecutiveErrors = 0;
        applyLevel(state, nextLevel || state.level + 1, nextBossName);
        addLog(
          tokenId,
          tokenName,
          `胜利，当前关卡 ${state.level}${state.bossName ? `，BOSS：${state.bossName}` : ""}`,
          "success",
        );
        // 战斗结束后刷新火把状态
        fetchTorchInfo(tokenId, tokenName, { silent: true }).catch(() => {});
        return { success: true };
      }

      state.losses += 1;
      state.retries += 1;
      state.lastError = body.code || body.msg || "服务器判定失败";
      if (state.retries >= state.maxRetries) {
        state.stopFlag = true;
        addLog(
          tokenId,
          tokenName,
          `连续失败 ${state.retries} 次，停止推图`,
          "error",
        );
      } else {
        addLog(tokenId, tokenName, `失败，重试 ${state.retries} 次`, "warning");
      }
      return { success: false, error: state.lastError };
    } catch (error) {
      const errorMessage = sanitizeError(error);
      if (String(error?.message || "").includes("WebSocket") && attempt === 0) {
        if (await ensureConnected(tokenId)) continue;
      }

      state.losses += 1;
      state.retries += 1;
      state.consecutiveErrors += 1;
      state.lastError = errorMessage;

      if (state.consecutiveErrors >= state.maxConsecutiveErrors) {
        addLog(
          tokenId,
          tokenName,
          `连续战斗异常 ${state.consecutiveErrors} 次，尝试断开重连...`,
          "warning",
        );
        if (await ensureConnected(tokenId)) {
          state.consecutiveErrors = 0;
          addLog(tokenId, tokenName, "重连成功，继续推图", "success");
          if (attempt === 0) continue;
        }
      }

      if (state.retries >= state.maxRetries) {
        state.stopFlag = true;
        addLog(
          tokenId,
          tokenName,
          `连续失败 ${state.retries} 次，停止`,
          "error",
        );
      } else {
        addLog(
          tokenId,
          tokenName,
          `战斗异常，重试 ${state.retries} 次：${errorMessage}`,
          "error",
        );
      }
      return { success: false, error: errorMessage };
    }
  }

  return { success: false, error: "未知战斗异常" };
}

async function startOne(tokenId) {
  const tokenName = getTokenName(tokenId);
  if (isRunning(tokenId)) {
    addLog(tokenId, tokenName, "该账号已在推图中", "warning");
    return;
  }

  initState(tokenId, tokenName);
  addLog(tokenId, tokenName, "开始推图", "success");

  // 后台保活：Worker 节拍器保证定时器不被节流；静音音频让浏览器放宽节流策略。
  // 必须在用户点击的同步上下文里调用，否则 AudioContext 会被拦截。
  startBgTicker();
  startAudioKeepAlive().then((ok) => {
    addLog(
      tokenId,
      tokenName,
      ok
        ? "已开启后台保活，可放心切到其它窗口"
        : "后台保活未生效（浏览器拦截了静音音频），切后台仍可能断线",
      ok ? "success" : "warning",
    );
  });

  if (!(await ensureConnected(tokenId))) {
    runningStates[tokenId].running = false;
    runningStates[tokenId].lastError = "WebSocket 未连接";
    return;
  }

  await initializeBattleData(tokenId, tokenName);

  try {
    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
      10000,
    );
    const body = responseBody(roleInfo);
    const level = pickNumber(body.levelId, body.body?.levelId, body.currLevel);
    if (level !== null) {
      applyLevel(runningStates[tokenId], level);
      addLog(tokenId, tokenName, `当前关卡：${level}`, "info");

      try {
        const levelInfo = await tokenStore.sendMessageWithPromise(
          tokenId,
          "fight_level",
          {},
          10000,
        );
        const bossName =
          levelInfo?.bossName ||
          levelInfo?.body?.bossName ||
          levelInfo?.role?.bossName ||
          "";
        applyLevel(runningStates[tokenId], level, bossName);
        if (runningStates[tokenId].bossName) {
          addLog(
            tokenId,
            tokenName,
            `BOSS：${runningStates[tokenId].bossName}`,
            "info",
          );
        }
      } catch (levelError) {
        addLog(
          tokenId,
          tokenName,
          `获取BOSS信息失败：${sanitizeError(levelError)}`,
          "info",
        );
      }
    }
    // 启动时查询火把状态
    await fetchTorchInfo(tokenId, tokenName, { silent: true });
  } catch (error) {
    addLog(
      tokenId,
      tokenName,
      `获取当前关卡失败：${sanitizeError(error)}`,
      "warning",
    );
  }

  try {
    while (runningStates[tokenId] && !runningStates[tokenId].stopFlag) {
      const state = runningStates[tokenId];
      // 周期性刷新火把
      if (Date.now() - (state.lastTorchFetch || 0) > TORCH_REFRESH_INTERVAL) {
        fetchTorchInfo(tokenId, tokenName, { silent: true }).catch(() => {});
      }

      const result = await runOneBattle(tokenId, tokenName);
      if (result.stopped) break;

      if (!state || state.stopFlag) break;

      if (!result.success) {
        if (state.retries >= state.maxRetries) break;
        await sleep(3000);
      } else if (!autoContinue.value) {
        addLog(tokenId, tokenName, "自动继续已关闭，推图暂停", "warning");
        state.stopFlag = true;
        break;
      }

      await sleep(2000);
    }
  } catch (error) {
    addLog(tokenId, tokenName, `推图异常：${sanitizeError(error)}`, "error");
  } finally {
    const state = runningStates[tokenId];
    if (state) {
      state.running = false;
      state.countdown = 0;
      const elapsed = Math.round((Date.now() - state.startTime) / 1000);
      addLog(
        tokenId,
        tokenName,
        `推图结束：${state.wins}胜 ${state.losses}败，共 ${state.battles} 场，耗时 ${elapsed}s`,
        state.wins > 0 ? "success" : "warning",
      );
      // 推图结束后再次查询火把状态
      try {
        if (isConnected(tokenId)) {
          await fetchTorchInfo(tokenId, tokenName, { silent: true });
        }
      } catch {}
    }
  }
}

async function startSelected() {
  for (const tokenId of selectedTokenIds.value) {
    if (!isRunning(tokenId)) {
      startOne(tokenId);
      await sleep(2000);
    }
  }
}

function stopOne(tokenId) {
  const tokenName = getTokenName(tokenId);
  const state = runningStates[tokenId];
  if (state) {
    state.stopFlag = true;
    addLog(tokenId, tokenName, "手动停止推图", "warning");
  }
  try {
    tokenStore.closeWebSocketConnection(tokenId);
  } catch {}
}

function stopSelected() {
  selectedTokenIds.value.forEach((tokenId) => {
    if (isRunning(tokenId)) stopOne(tokenId);
  });
}

async function useTorchForSelected() {
  if (!selectedTokenIds.value.length) return;

  const option = torchOptions.find((item) => item.value === torchItemId.value);
  const itemName = option?.label || `#${torchItemId.value}`;
  const quantity = torchQuantity.value || 1;
  torchRunning.value = true;

  let successCount = 0;
  let failCount = 0;

  for (const tokenId of selectedTokenIds.value) {
    const tokenName = getTokenName(tokenId);
    addLog(tokenId, tokenName, `开始使用 ${itemName} x${quantity}`, "info");
    try {
      if (!(await ensureConnected(tokenId))) {
        addLog(tokenId, tokenName, `连接失败，跳过使用 ${itemName}`, "error");
        failCount += 1;
        continue;
      }

      // 1. 使用火把
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "item_consume",
        { itemId: torchItemId.value, quantity },
        10000,
      );
      // 2. 同一连接下立刻查询最新火把状态（不关闭连接）
      try {
        const state = runningStates[tokenId] || initState(tokenId, tokenName);
        if (state !== runningStates[tokenId]) runningStates[tokenId] = state;
        const roleInfo = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          10000,
        );
        applyTorchInfo(state, readTorchFromResponse(roleInfo));
      } catch (fetchError) {
        addLog(
          tokenId,
          tokenName,
          `刷新火把状态失败：${sanitizeError(fetchError)}`,
          "warning",
        );
      }

      addLog(
        tokenId,
        tokenName,
        `使用 ${itemName} x${quantity} 完成`,
        "success",
      );
      successCount += 1;
    } catch (error) {
      addLog(
        tokenId,
        tokenName,
        `使用 ${itemName} 失败：${sanitizeError(error)}`,
        "error",
      );
      failCount += 1;
    } finally {
      try {
        tokenStore.closeWebSocketConnection(tokenId);
      } catch {}
    }
  }

  torchRunning.value = false;
  message.success(
    `使用 ${itemName} 完成：成功 ${successCount} 个，失败 ${failCount} 个`,
  );
}

onMounted(() => {
  tickTimer = setInterval(() => {
    tickNow.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  // 离开页面就停掉静音音频，避免一直占着音频输出
  stopAudioKeepAlive();
  Object.values(runningStates).forEach((state) => {
    if (state?.running) {
      state.stopFlag = true;
      try {
        tokenStore.closeWebSocketConnection(state.tokenId);
      } catch {}
    }
  });
});
</script>

<style scoped>
.pushing-levels-page {
  height: 100%;
  min-height: 0;
  padding: 16px;
  background: #f6f8fb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pl-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 22px;
  font-weight: 700;
}

.pl-header p {
  margin: 2px 0 0;
  color: #667085;
  font-size: 13px;
}

.pl-header-actions,
.account-toolbar,
.log-header,
.log-actions,
.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.retry-input {
  width: 110px;
}

.retry-label {
  color: #667085;
  font-size: 13px;
}

.account-card-top,
.control-card,
.log-card,
.running-card {
  border-radius: 8px;
}

.account-card-top :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
}

.search-input {
  width: 180px;
}

.group-list-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.group-chip {
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 8px;
  background: #fff;
  font-size: 11px;
  cursor: pointer;
  line-height: 1.4;
}

.token-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 1100px) {
  .token-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .token-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .token-grid {
    grid-template-columns: 1fr;
  }
}

.token-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #e4e7ec;
  background: #fff;
  font-size: 12px;
  line-height: 1.4;
  transition:
    border-color 0.2s,
    background 0.2s;
  cursor: pointer;
  min-height: 0;
}

.token-cell:hover {
  border-color: #98a2b3;
}

.token-cell.selected {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.token-server {
  color: #667085;
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.token-sep {
  color: #98a2b3;
}

.token-name {
  color: #101828;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d0d5dd;
  display: inline-block;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.2s;
}

.status-dot.small {
  width: 10px;
  height: 10px;
}

.status-gray {
  background: #d0d5dd;
}

.status-green {
  background: #12b76a;
}

.status-red {
  background: #f04438;
}

.status-blue {
  background: #2e90fa;
  box-shadow: 0 0 0 3px rgba(46, 144, 250, 0.2);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(46, 144, 250, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(46, 144, 250, 0.05);
  }
}

.control-row {
  align-items: flex-end;
}

.torch-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #344054;
  font-size: 11px;
}

.torch-label {
  color: #667085;
}

.torch-select,
.torch-input {
  width: 120px;
}

.control-spacer {
  flex: 1;
}

.status-text {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.running-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.running-card {
  min-height: 160px;
  border: 1px solid #e4e7ec;
}

.running-card.active {
  border-color: #12b76a;
}

.running-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.card-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.level-line,
.waiting-line,
.countdown-text,
.card-actions {
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}

.level-line {
  color: #344054;
}

.torch-line {
  color: #b54708;
  font-weight: 500;
}

.running-body {
  margin-top: 8px;
}

.countdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.countdown-text {
  color: #1d2939;
  font-weight: 600;
  white-space: nowrap;
}

.inline-progress {
  flex: 1;
  min-width: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}

.err-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.log-card {
  min-height: 320px;
}

.log-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.log-filter-label {
  color: #667085;
  font-size: 12px;
  flex-shrink: 0;
}

.log-filter-select {
  width: 200px;
}

.log-filter-count {
  color: #98a2b3;
  font-size: 11px;
}

.log-container {
  height: 300px;
  overflow-y: auto;
  padding: 2px;
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
}

.log-item {
  display: grid;
  grid-template-columns: 74px minmax(110px, 180px) minmax(0, 1fr);
  gap: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  color: #344054;
}

.log-item.success {
  color: #047857;
}

.log-item.warning {
  color: #b54708;
}

.log-item.error {
  background: #fff1f3;
  color: #b42318;
}

.log-name,
.log-msg {
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .pushing-levels-page {
    padding: 10px;
  }

  .pl-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .log-item {
    grid-template-columns: 64px minmax(80px, 110px) minmax(0, 1fr);
  }

  .torch-select,
  .torch-input,
  .log-filter-select {
    width: 100px;
  }
}
</style>
