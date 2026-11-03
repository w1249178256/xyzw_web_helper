<template>
  <section v-show="active" class="game-workspace">
    <header class="workspace-heading">
      <div>
        <h1>在线游戏</h1>
        <p>选择已导入的账号，独立开启游戏窗口</p>
      </div>
      <NSpace>
        <NTag :type="launcher.activeCount ? 'success' : 'default'"
          >{{ launcher.activeCount }} 个窗口</NTag
        >
        <label class="sound-control"
          ><NSwitch
            aria-label="全部游戏静音"
            v-model:value="launcher.muted"
          ></NSwitch
          ><span>静音</span></label
        >
        <NButton @click="showDefaults = true">窗口设置</NButton>
        <NButton :disabled="!launcher.activeCount" @click="launcher.stopAll"
          >全部停止</NButton
        >
      </NSpace>
    </header>
    <NAlert
      v-if="launcher.notice"
      closable
      type="warning"
      @close="launcher.notice = ''"
      >{{ launcher.notice }}</NAlert
    >
    <div class="workspace-body">
      <aside class="account-list">
        <div class="account-heading">
          <strong>账号 · {{ accounts.length }}</strong
          ><NButton text type="primary" @click="router.push('/tokens')"
            >管理 Tokens</NButton
          >
        </div>
        <NInput
          clearable
          placeholder="搜索名称、区服或备注"
          v-model:value="search"
        ></NInput>
        <div class="account-scroll">
          <NEmpty
            v-if="!accounts.length"
            description="暂无账号，请先在 Token 管理中导入"
          ></NEmpty>
          <NEmpty
            v-else-if="!filteredAccounts.length"
            description="没有匹配的账号"
          ></NEmpty>
          <article
            v-for="token in filteredAccounts"
            :key="token.id"
            class="account-row"
          >
            <div class="account-name">
              <span
                class="account-dot"
                :class="{ running: running(token.id) }"
              ></span
              ><strong :title="token.name">{{
                token.name || "未命名账号"
              }}</strong>
            </div>
            <div class="account-meta">
              <span>{{ token.server || "未知区服" }}</span
              ><NButton
                size="small"
                :loading="running(token.id)?.status === 'preparing'"
                :type="running(token.id) ? 'error' : 'primary'"
                @click="toggle(token.id)"
                >{{ running(token.id) ? "停止" : "进入游戏" }}</NButton
              >
            </div>
            <small v-if="token.remark">{{ token.remark }}</small>
          </article>
        </div>
      </aside>
      <div ref="gameArea" class="game-area">
        <div v-if="launcher.focusId" class="focus-bar">
          <NButton size="small" @click="launcher.focusId = ''"
            >显示全部窗口</NButton
          >
        </div>
        <NEmpty
          v-if="!launcher.activeCount"
          class="workspace-empty"
          description="选择左侧账号开始游戏；切换页面时已开启窗口会继续保留"
        ></NEmpty>
        <div
          class="game-grid"
          :class="{ automatic: automatic && !launcher.focusId }"
          :style="gridStyle"
        >
          <!-- Stable DOM order preserves iframe documents when the visual order changes. -->
          <article
            v-for="win in stableWindows"
            :key="win.id"
            :ref="(element) => attachPanel(win.id, element)"
            v-show="!launcher.focusId || launcher.focusId === win.id"
            class="game-panel"
            :style="panelStyle(win)"
          >
            <div class="panel-heading">
              <strong :title="`${win.name} ${win.server}`"
                >{{ win.name }} <small>{{ win.server }}</small></strong
              ><NTag
                size="small"
                :type="
                  win.status === 'online'
                    ? 'success'
                    : win.status === 'error'
                      ? 'error'
                      : 'default'
                "
                >{{ labels[win.status] || "加载中" }}</NTag
              >
            </div>
            <div class="panel-toolbar">
              <NButton size="tiny" @click="editSettings(win)">设置</NButton>
              <NButton
                size="tiny"
                :disabled="win.status === 'preparing'"
                @click="launcher.restart(win.id)"
                >重登</NButton
              >
              <NButton
                size="tiny"
                title="向前排列"
                @click="launcher.move(win.id, -1)"
                >←</NButton
              >
              <NButton
                size="tiny"
                title="向后排列"
                @click="launcher.move(win.id, 1)"
                >→</NButton
              >
              <NButton
                size="tiny"
                @click="
                  launcher.focusId = launcher.focusId === win.id ? '' : win.id
                "
                >聚焦</NButton
              >
              <span class="fps">{{ win.fps }}/{{ win.settings.fps }} FPS</span>
              <NButton size="tiny" type="error" @click="launcher.stop(win.id)"
                >关闭</NButton
              >
            </div>
            <div
              class="game-screen"
              :style="{
                aspectRatio: automatic
                  ? '9 / 16'
                  : `${win.settings.width} / ${win.settings.height}`,
              }"
            >
              <iframe
                :ref="(element) => launcher.attachFrame(win.id, element)"
                v-if="win.mounted"
                allow="autoplay; fullscreen"
                referrerpolicy="no-referrer"
                :src="frameUrl(win)"
                :title="`${win.name}的游戏窗口`"
              ></iframe>
              <span v-else class="preparing">正在准备账号…</span>
            </div>
            <p v-if="win.detail" class="panel-detail">{{ win.detail }}</p>
          </article>
        </div>
      </div>
    </div>

    <NModal
      class="game-settings-modal"
      preset="card"
      title="新窗口默认设置"
      v-model:show="showDefaults"
    >
      <div class="settings-form">
        <label
          >布局<NSelect
            v-model:value="launcher.defaults.layout"
            :options="layoutOptions"
          ></NSelect
        ></label>
        <label v-if="automatic"
          >每行窗口数<NInputNumber
            v-model:value="launcher.defaults.columns"
            :max="12"
            :min="1"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >画面宽度<NInputNumber
            v-model:value="launcher.defaults.width"
            :disabled="automatic"
            :max="1920"
            :min="240"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >画面高度<NInputNumber
            v-model:value="launcher.defaults.height"
            :disabled="automatic"
            :max="2160"
            :min="320"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >目标 FPS<NInputNumber
            v-model:value="launcher.defaults.fps"
            :max="60"
            :min="10"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >游戏倍速<NInputNumber
            v-model:value="launcher.defaults.speed"
            :max="20"
            :min="1"
            :step="0.1"
          ></NInputNumber
        ></label>
      </div>
      <p class="settings-hint">
        自动保存。尺寸、FPS 和倍速用于新窗口；自适应布局立即生效。
      </p>
      <NSpace justify="end"
        ><NButton @click="launcher.applyDefaults">应用到全部窗口</NButton
        ><NButton type="primary" @click="showDefaults = false"
          >完成</NButton
        ></NSpace
      >
    </NModal>
    <NModal
      class="game-settings-modal"
      preset="card"
      title="游戏窗口设置"
      v-model:show="showWindowSettings"
    >
      <div class="settings-form">
        <label
          >画面宽度<NInputNumber
            v-model:value="editing.width"
            :disabled="automatic"
            :max="1920"
            :min="240"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >画面高度<NInputNumber
            v-model:value="editing.height"
            :disabled="automatic"
            :max="2160"
            :min="320"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >目标 FPS<NInputNumber
            v-model:value="editing.fps"
            :max="60"
            :min="10"
            :precision="0"
          ></NInputNumber
        ></label>
        <label
          >游戏倍速<NInputNumber
            v-model:value="editing.speed"
            :max="20"
            :min="1"
            :step="0.1"
          ></NInputNumber
        ></label>
      </div>
      <NSpace justify="end"
        ><NButton @click="showWindowSettings = false">取消</NButton
        ><NButton type="primary" @click="saveSettings">应用</NButton></NSpace
      >
    </NModal>
  </section>
</template>

<script setup>
import {
  NAlert,
  NButton,
  NEmpty,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
} from "naive-ui";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGameLauncherStore } from "@/stores/gameLauncher";
import { useTokenStore } from "@/stores/tokenStore";

const props = defineProps({ active: Boolean });
const launcher = useGameLauncherStore();
const tokens = useTokenStore();
const router = useRouter();
const route = useRoute();
const search = ref("");
const gameArea = ref(null);
const panels = new Map();
const showDefaults = ref(false);
const showWindowSettings = ref(false);
const editingId = ref("");
const editing = reactive({ width: 360, height: 640, fps: 30, speed: 1.2 });
const labels = {
  preparing: "准备中",
  loading: "加载中",
  authenticating: "登录中",
  connected: "已连接",
  online: "在线",
  disconnected: "已断开",
  error: "需要处理",
};
const layoutOptions = [
  { label: "手动尺寸", value: "manual" },
  { label: "按每行数量自适应", value: "auto" },
];
const accounts = computed(() => tokens.gameTokens || []);
const filteredAccounts = computed(() => {
  const value = search.value.trim().toLowerCase();
  return accounts.value.filter((token) =>
    `${token.name} ${token.server} ${token.remark || ""}`
      .toLowerCase()
      .includes(value),
  );
});
// Creation order stays stable when visual order changes.
const stableWindows = computed(() =>
  [...launcher.windows].sort((a, b) => a.order - b.order),
);
const automatic = computed(() => launcher.defaults.layout === "auto");
const gridStyle = computed(() => ({
  "--columns": Math.max(
    1,
    Math.min(12, Math.round(Number(launcher.defaults.columns) || 3)),
  ),
}));
const panelStyle = (win) => ({
  order: launcher.windows.findIndex((item) => item.id === win.id),
  width:
    automatic.value && !launcher.focusId
      ? undefined
      : `${win.settings.width + 2}px`,
});
// A fragment-only change would keep the disposed document alive on restart.
const frameUrl = (win) =>
  `${import.meta.env.BASE_URL}game-runtime/index.html?instance=${encodeURIComponent(win.generation)}#id=${encodeURIComponent(win.id)}&generation=${encodeURIComponent(win.generation)}`;
const running = (tokenId) =>
  launcher.windows.find((win) => win.tokenId === tokenId);
const toggle = (tokenId) =>
  running(tokenId)
    ? launcher.stop(running(tokenId).id)
    : launcher.start(tokenId);

function attachPanel(id, element) {
  if (element) panels.set(id, element);
  else panels.delete(id);
}
watch(
  () => [props.active, launcher.revealRequest],
  async ([active, request]) => {
    if (!active || !request) return;
    await nextTick();
    if (
      !props.active ||
      launcher.revealRequest !== request ||
      (launcher.focusId && launcher.focusId !== request.id)
    )
      return;
    const area = gameArea.value;
    const panel = panels.get(request.id);
    if (!area || !panel) return;
    const bounds = panel.getBoundingClientRect();
    const viewport = area.getBoundingClientRect();
    area.scrollTo({
      top: Math.max(0, area.scrollTop + bounds.top - viewport.top),
      left: Math.max(0, area.scrollLeft + bounds.left - viewport.left),
      behavior: "auto",
    });
  },
  { flush: "post" },
);

function editSettings(win) {
  editingId.value = win.id;
  Object.assign(editing, win.settings);
  showWindowSettings.value = true;
}
async function saveSettings() {
  await launcher.configure(editingId.value, editing);
  showWindowSettings.value = false;
}
watch(
  () => props.active,
  (active) => {
    if (!active) {
      showDefaults.value = false;
      showWindowSettings.value = false;
    }
  },
);
watch(
  () => [props.active, route.query.tokenId],
  async ([active, tokenId]) => {
    if (!active || typeof tokenId !== "string") return;
    const requestedPath = route.path;
    await launcher.start(tokenId);
    if (
      !props.active ||
      route.path !== requestedPath ||
      route.query.tokenId !== tokenId
    )
      return;
    const query = { ...route.query };
    delete query.tokenId;
    if (props.active) router.replace({ path: route.path, query });
  },
  { immediate: true },
);
</script>

<style>
.game-settings-modal {
  width: min(440px, 94vw);
}
</style>

<style scoped>
.game-workspace {
  position: fixed;
  inset: 64px 0 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.workspace-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sound-control {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  font-size: 13px;
}
h1 {
  margin: 0;
  font-size: 23px;
  font-weight: 700;
}
.workspace-heading p {
  margin: 4px 0 0;
  color: #758197;
  font-size: 12px;
}
.workspace-body {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}
.account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 228px;
  flex-shrink: 0;
  padding: 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 12px;
}
.account-heading,
.account-meta,
.account-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.account-scroll {
  min-height: 0;
  overflow-y: auto;
  flex: 1;
}
.account-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}
.account-name {
  justify-content: flex-start;
  margin-bottom: 8px;
}
.account-name strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.account-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}
.account-dot.running {
  background: #22a06b;
}
.account-meta,
.account-row small {
  color: #758197;
  font-size: 12px;
}
.game-area {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
.game-grid {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 14px;
}
.game-grid.automatic {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
}
.game-panel {
  min-width: 0;
  max-width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 12px #26344d08;
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 9px 10px;
}
.panel-heading strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.panel-heading small {
  font-weight: normal;
  color: #758197;
}
.panel-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 8px 8px;
}
.fps {
  margin-left: auto;
  font-size: 10px;
  color: #7b8799;
  white-space: nowrap;
}
.game-screen {
  position: relative;
  width: 100%;
  background: #12151b;
}
iframe {
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0;
}
.preparing {
  position: absolute;
  inset: 45% 0 auto;
  text-align: center;
  color: #adb5c4;
  font-size: 12px;
}
.panel-detail {
  padding: 7px 10px;
  margin: 0;
  color: #986521;
  font-size: 11px;
}
.workspace-empty {
  margin-top: 100px;
  padding: 20px;
}
.focus-bar {
  margin-bottom: 12px;
}
.settings-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.settings-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.settings-hint {
  color: #758197;
  font-size: 12px;
}
@media (max-width: 768px) {
  .game-workspace {
    top: 56px;
    padding: 12px;
  }
  .account-list {
    width: 190px;
  }
}
@media (max-width: 640px) {
  .workspace-body {
    flex-direction: column;
  }
  .account-list {
    width: auto;
    max-height: 220px;
  }
  .account-scroll {
    display: flex;
    gap: 12px;
    overflow: auto;
  }
  .account-row {
    min-width: 180px;
  }
  .game-grid.automatic {
    grid-template-columns: 1fr;
  }
  .workspace-heading p {
    display: none;
  }
}
</style>
