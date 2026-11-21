<template>
  <NCard class="pushing-backend" :bordered="false">
    <template #header>
      <div class="pb-header">
        <span class="pb-title">后台推关</span>
        <span class="pb-sub">推关跑在本地服务里，切走页面也不影响；连续失败 10 次会自动暂停该账号</span>
      </div>
    </template>
    <template #header-extra>
      <NButton size="tiny" quaternary :loading="refreshing" @click="refreshNow">
        刷新
      </NButton>
    </template>

    <div class="pb-toolbar">
      <NButton
        type="primary"
        size="small"
        :loading="starting"
        :disabled="!tokens.length"
        @click="handleStart"
      >
        开始后台推关（{{ tokens.length }} 个账号）
      </NButton>
      <NButton
        size="small"
        :disabled="!hasRunning"
        :loading="stoppingAll"
        @click="handleStopAll"
      >
        全部停止
      </NButton>
      <span v-if="!tokens.length" class="pb-hint">
        请先在上方勾选账号
      </span>
      <span v-else-if="error" class="pb-error">{{ error }}</span>
    </div>

    <NDataTable
      :columns="columns"
      :data="rows"
      :bordered="false"
      size="small"
      :row-props="rowProps"
      :row-class-name="rowClassName"
      :max-height="260"
      virtual-scroll
    >
      <template #empty>
        <NEmpty description="还没有后台推关任务" size="small" />
      </template>
    </NDataTable>

    <div class="pb-logs">
      <div class="pb-logs-head">
        <span>执行日志</span>
        <span v-if="logTokenName" class="pb-logs-for">{{ logTokenName }}</span>
        <NButton
          v-if="logTokenId"
          size="tiny"
          quaternary
          @click="logTokenId = ''; logs = []"
        >
          收起
        </NButton>
      </div>
      <div class="pb-logs-body">
        <p v-if="!logs.length" class="pb-logs-empty">
          {{ logTokenId ? "暂无日志" : "点击上方账号行查看该账号日志" }}
        </p>
        <p
          v-for="log in logs"
          :key="log.seq"
          class="pb-log-line"
          :class="`is-${log.level}`"
        >
          <span class="pb-log-time">{{ formatTime(log.time) }}</span>
          <span>{{ log.text }}</span>
        </p>
      </div>
    </div>
  </NCard>
</template>

<script setup>
import { NButton, NCard, NDataTable, NEmpty, NTag, useMessage } from "naive-ui";
import { computed, h, onMounted, onUnmounted, ref } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import {
  getPushingLogs,
  getPushingStatus,
  startPushing,
  stopAllPushing,
  stopPushing,
} from "@/utils/pushingApi.js";

const props = defineProps({
  /** 页面当前勾选的账号（直接传给后端，由后端解析 token） */
  tokens: {
    type: Array,
    default: () => [],
  },
});

const message = useMessage();
const tokenStore = useTokenStore();

const rows = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const starting = ref(false);
const stoppingAll = ref(false);
const error = ref("");
const logTokenId = ref("");
const logs = ref([]);
let lastSeq = 0;
let timer = null;
/** 每秒更新一次，用于「已用 / 剩余」实时跳动 */
const now = ref(Date.now());
let clockTimer = null;

const STATUS_MAP = {
  running: { text: "运行中", type: "success" },
  connecting: { text: "连接中", type: "info" },
  stopped: { text: "已停止", type: "default" },
  paused: { text: "已暂停", type: "warning" },
  done: { text: "已完成", type: "info" },
  error: { text: "异常", type: "error" },
};

const hasRunning = computed(() =>
  rows.value.some((row) => row.status === "running" || row.status === "connecting"),
);

const logTokenName = computed(
  () => rows.value.find((row) => row.tokenId === logTokenId.value)?.name || "",
);

/** 秒 → 易读时长 */
function formatElapsed(ms) {
  const total = Math.max(0, Math.round((ms || 0) / 1000));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  if (hh > 0) return `${hh}h${mm}m`;
  if (mm > 0) return `${mm}m${ss}s`;
  return `${ss}s`;
}

/** 时间戳 → HH:mm:ss */
function formatTime(ts) {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

const columns = computed(() => [
  { title: "账号", key: "name", width: 140, ellipsis: { tooltip: true } },
  {
    title: "状态",
    key: "status",
    width: 80,
    render: (row) => {
      const meta = STATUS_MAP[row.status] || { text: row.status, type: "default" };
      return h(NTag, { size: "small", type: meta.type, bordered: false }, () => meta.text);
    },
  },
  {
    title: "关卡",
    key: "level",
    width: 90,
    render: (row) => (row.level ? `第 ${row.level} 关` : "-"),
  },
  {
    title: "本场预计",
    key: "battleTime",
    width: 90,
    render: (row) => (row.battleTime ? `${row.battleTime}s` : "-"),
  },
  {
    title: "剩余时间",
    key: "battleRemain",
    width: 95,
    render: (row) => {
      if (!row.battleStartedAt || !row.battleTime) return "-";
      const elapsed = Math.max(
        0,
        Math.round((now.value - row.battleStartedAt) / 1000),
      );
      return `${Math.max(0, row.battleTime - elapsed)}s`;
    },
  },
  {
    title: "效率",
    key: "efficiency",
    width: 95,
    render: (row) => {
      // 按「通关数 / 运行小时」算，保留一位小数
      const endedAt = row.stoppedAt || now.value;
      const hours = (endedAt - row.startedAt) / 3600000;
      if (!hours || hours <= 0) return "-";
      return `${(row.wins / hours).toFixed(1)}/h`;
    },
  },
  { title: "场次", key: "battles", width: 70 },
  {
    title: "胜 / 负",
    key: "score",
    width: 90,
    render: (row) => `${row.wins} / ${row.losses}`,
  },
  {
    title: "耗时",
    key: "elapsed",
    width: 90,
    render: (row) => formatElapsed(row.elapsedMs),
  },
  {
    title: "操作",
    key: "action",
    width: 80,
    render: (row) => {
      const running = row.status === "running" || row.status === "connecting";
      return h(
        NButton,
        {
          size: "tiny",
          quaternary: true,
          disabled: !running,
          onClick: (e) => {
            e.stopPropagation();
            handleStop(row);
          },
        },
        () => (running ? "停止" : "-"),
      );
    },
  },
]);

/** 点击行：切换日志查看的账号 */
function rowProps(row) {
  return {
    style: "cursor: pointer;",
    onClick: () => {
      if (logTokenId.value === row.tokenId) return;
      logTokenId.value = row.tokenId;
      logs.value = [];
      lastSeq = 0;
      pullLogs();
    },
  };
}

function rowClassName(row) {
  return row.tokenId === logTokenId.value ? "pb-row-active" : "";
}

/** 拉状态（2 秒轮询一次） */
async function refresh() {
  try {
    const data = await getPushingStatus();
    rows.value = data.rows || [];
    error.value = "";
  } catch (err) {
    error.value = `连接后端失败：${err.message}`;
  }
}

async function refreshNow() {
  refreshing.value = true;
  await refresh();
  refreshing.value = false;
}

/** 拉当前选中账号的增量日志 */
async function pullLogs() {
  if (!logTokenId.value) return;
  try {
    const data = await getPushingLogs(logTokenId.value, lastSeq);
    if (data.logs?.length) {
      logs.value.push(...data.logs);
      lastSeq = data.logs[data.logs.length - 1].seq;
      // 只保留最近 300 条，避免 DOM 过大
      if (logs.value.length > 300) logs.value.splice(0, logs.value.length - 300);
    }
  } catch {
    /* 日志拉取失败静默，下次轮询会重试 */
  }
}

/** 一次轮询：状态 + 日志 */
async function tick() {
  if (loading.value) return;
  loading.value = true;
  try {
    await refresh();
    await pullLogs();
  } finally {
    loading.value = false;
  }
}

async function handleStart() {
  if (!props.tokens.length) {
    message.warning("请先勾选账号");
    return;
  }
  starting.value = true;
  try {
    // 同一个角色服务端只允许一端在线：先把浏览器端的连接让出去，
    // 否则后台刚连上就会被踢（表现为「连接已关闭」后无限失败）。
    let closed = 0;
    for (const token of props.tokens) {
      try {
        tokenStore.closeWebSocketConnection(token.id);
        closed += 1;
      } catch {
        /* 没有连接时忽略 */
      }
    }
    if (closed) {
      message.info(`已断开浏览器端 ${closed} 个账号的连接，交给后台接管`);
      await new Promise((resolve) => setTimeout(resolve, 900));
    }

    const data = await startPushing(props.tokens);
    if (!data.ok) {
      message.error(data.error || "启动失败");
      return;
    }
    const skipped = (data.started || []).filter((item) => item.skipped).length;
    message.success(
      skipped
        ? `已启动 ${data.started.length - skipped} 个账号（${skipped} 个已在运行）`
        : `已启动 ${data.started.length} 个账号`,
    );
    await refresh();
  } catch (err) {
    message.error(`启动失败：${err.message}`);
  } finally {
    starting.value = false;
  }
}

async function handleStop(row) {
  try {
    const data = await stopPushing(row.tokenId);
    if (!data.ok) {
      message.warning(data.error || "停止失败");
      return;
    }
    message.info(`${row.name} 将在当前这场结束后停止`);
    await refresh();
  } catch (err) {
    message.error(`停止失败：${err.message}`);
  }
}

async function handleStopAll() {
  stoppingAll.value = true;
  try {
    const data = await stopAllPushing();
    message.info(`已通知 ${data.count || 0} 个账号停止`);
    await refresh();
  } catch (err) {
    message.error(`停止失败：${err.message}`);
  } finally {
    stoppingAll.value = false;
  }
}

onMounted(() => {
  tick();
  timer = setInterval(tick, 2000);
  clockTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<style scoped>
.pushing-backend {
  margin-top: 16px;
  border: 1px solid var(--border-light, #e5e6eb);
  border-radius: 8px;
}

.pb-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.pb-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1d2129);
}

.pb-sub {
  font-size: 12px;
  color: var(--text-secondary, #86909c);
}

.pb-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.pb-hint {
  font-size: 12px;
  color: var(--text-secondary, #86909c);
}

.pb-error {
  font-size: 12px;
  color: #cb2634;
}

.pb-logs {
  margin-top: 12px;
  border-top: 1px solid var(--border-light, #e5e6eb);
  padding-top: 8px;
}

.pb-logs-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #4e5969);
  margin-bottom: 6px;
}

.pb-logs-for {
  font-weight: normal;
  color: var(--text-secondary, #86909c);
}

.pb-logs-body {
  max-height: 200px;
  overflow-y: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.7;
  background: var(--bg-secondary, #f7f8fa);
  border-radius: 6px;
  padding: 8px 10px;
}

.pb-logs-empty {
  margin: 0;
  color: var(--text-secondary, #86909c);
}

.pb-log-line {
  margin: 0;
  display: flex;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

.pb-log-time {
  color: #a8abb2;
  flex-shrink: 0;
}

.pb-log-line.is-success {
  color: #18a058;
}
.pb-log-line.is-warning {
  color: #d97706;
}
.pb-log-line.is-error {
  color: #cb2634;
}

:deep(.pb-row-active) {
  background: rgba(24, 160, 88, 0.06);
}
</style>
