<template>
  <div class="multi-game-page">
    <header class="multi-game-toolbar">
      <button class="toolbar-button" type="button" @click="goToTokens">
        ← 返回 Token 管理
      </button>
      <strong class="toolbar-title">批量游戏</strong>
      <span class="toolbar-count">{{ frames.length }} 个窗口</span>
      <span
        v-if="skippedSummary"
        class="toolbar-skipped"
        :title="skippedDetails"
      >
        {{ skippedSummary }}
      </span>
      <span class="toolbar-warning">
        在窗口标题栏滚动可横向浏览；按住 Ctrl + 滚轮缩放页面，可同时查看更多账号
      </span>
      <n-popover trigger="hover" placement="bottom-end" :width="360">
        <template #trigger>
          <button class="crash-help-trigger" type="button">页面崩溃？</button>
        </template>
        <div class="crash-help-content">
          <strong>多开内存提示</strong>
          <p>
            同时开启多个游戏会占用大量内存。若系统仍有可用内存但页面提示
            Out of Memory，可能是 32 位浏览器的进程内存限制，建议升级到 64
            位浏览器。
          </p>
          <p>
            查看方法：在 Chrome 地址栏输入 <code>chrome://version</code>，检查版本或操作系统信息是否显示 64 位。
          </p>
          <a
            href="https://support.google.com/chrome/a/answer/7650032?hl=zh-Hans"
            target="_blank"
            rel="noopener noreferrer"
          >
            下载 Chrome 官方 Windows 64 位捆绑包
          </a>
        </div>
      </n-popover>
    </header>

    <main
      v-if="frames.length"
      ref="gameStrip"
      class="game-strip"
      @wheel="handleStripWheel"
    >
      <article
        v-for="frame in frames"
        :key="frame.scopeId"
        class="game-panel"
        :style="{ order: frame.order }"
      >
        <header class="game-panel-header">
          <span class="account-name" :title="frame.name">{{ frame.name }}</span>
          <span
            class="frame-status"
            :class="`is-${frameStates[frame.scopeId]?.status || 'loading'}`"
          >
            {{ statusLabel(frame.scopeId) }}
          </span>
          <button
            class="move-button move-button-first"
            type="button"
            title="将窗口向左移动"
            :aria-label="`将 ${frame.name} 的游戏窗口向左移动`"
            :disabled="movingFrame || !canMoveFrame(frame.scopeId, -1)"
            @click="moveFrame(frame.scopeId, -1, $event)"
          >
            ←
          </button>
          <button
            class="move-button"
            type="button"
            title="将窗口向右移动"
            :aria-label="`将 ${frame.name} 的游戏窗口向右移动`"
            :disabled="movingFrame || !canMoveFrame(frame.scopeId, 1)"
            @click="moveFrame(frame.scopeId, 1, $event)"
          >
            →
          </button>
          <n-popconfirm
            :show-icon="false"
            positive-text="确认重新加载"
            negative-text="取消"
            @positive-click="reloadFrame(frame.scopeId)"
          >
            <template #trigger>
              <button
                class="reload-button"
                type="button"
                :title="`重新加载 ${frame.name} 的游戏窗口`"
              >
                重新加载
              </button>
            </template>
            确定重新加载“{{ frame.name }}”的游戏窗口吗？
          </n-popconfirm>
          <n-popconfirm
            :show-icon="false"
            positive-text="确认关闭"
            negative-text="取消"
            @positive-click="closeFrame(frame)"
          >
            <template #trigger>
              <button
                class="close-button"
                type="button"
                :title="`关闭 ${frame.name} 的游戏窗口`"
              >
                关闭
              </button>
            </template>
            确定关闭“{{ frame.name }}”的游戏窗口吗？
          </n-popconfirm>
        </header>

        <div class="game-frame-shell">
          <iframe
            :key="`${frame.scopeId}:${frameStates[frame.scopeId].revision}`"
            :ref="(element) => setFrameElement(frame.scopeId, element)"
            :src="frame.src"
            :title="`${frame.name} 的游戏窗口`"
            class="game-frame"
            allow="fullscreen; autoplay"
            @error="markFrameFatal(frame.scopeId)"
          />
          <div
            v-if="frameStates[frame.scopeId]?.status === 'fatal'"
            class="frame-error"
          >
            <strong>该账号加载失败</strong>
            <span>其他游戏窗口不受影响</span>
            <button type="button" @click="reloadFrame(frame.scopeId)">
              重试
            </button>
          </div>
        </div>
      </article>
    </main>

    <main v-else class="empty-state">
      <div class="empty-card">
        <h1>还没有待打开的游戏账号</h1>
        <p>请先到 Token 管理页面勾选账号，再使用“批量进入游戏”。</p>
        <button type="button" @click="goToTokens">前往 Token 管理</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { NPopover } from "naive-ui";
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from "vue";
import { useRouter } from "vue-router";
import {
  buildMultiGameFrameSrc,
  closeMultiGameSession,
  moveMultiGameSession,
  readActiveMultiGameLaunch,
  resolveMultiGameFrameMessage,
} from "@/utils/gameLauncher";

const router = useRouter();
const FRAME_LOAD_TIMEOUT_MS = 45_000;
const launch = ref(readLaunchSafely());
const gameStrip = ref(null);
const movingFrame = ref(false);
let stripScrollTarget = 0;
let stripScrollAnimationId = 0;
const frameDomOrder = (launch.value?.sessions || []).map(
  (session) => session.scopeId,
);
const frames = computed(() => {
  const sessionsByScope = new Map(
    (launch.value?.sessions || []).map((session) => [session.scopeId, session]),
  );
  return frameDomOrder
    .map((scopeId) => sessionsByScope.get(scopeId))
    .filter(Boolean)
    .map((session) => ({
      ...session,
      src: buildMultiGameFrameSrc(import.meta.env.BASE_URL, session),
    }));
});
const frameElements = new Map();
const frameTimeouts = new Map();
const frameStates = reactive(
  Object.fromEntries(
    frames.value.map((frame) => [
      frame.scopeId,
      { status: "loading", revision: 0 },
    ]),
  ),
);

const skippedDetails = computed(() =>
  (launch.value?.failures || [])
    .map((failure) => `${failure.name}（${failureReason(failure.reason)}）`)
    .join("、"),
);
const skippedSummary = computed(() => {
  const failures = launch.value?.failures || [];
  if (!failures.length) return "";
  const preview = failures
    .slice(0, 2)
    .map((failure) => failure.name)
    .join("、");
  return `已跳过 ${failures.length} 个账号：${preview}${
    failures.length > 2 ? "…" : ""
  }`;
});

function failureReason(reason) {
  return {
    "missing-bin": "缺少 BIN 数据",
    "read-failed": "读取 BIN 失败",
    "convert-failed": "转换 BIN 失败",
  }[reason] || "准备失败";
}

function readLaunchSafely() {
  try {
    return readActiveMultiGameLaunch(window.sessionStorage);
  } catch {
    return null;
  }
}

function statusLabel(scopeId) {
  return {
    loading: "加载中",
    ready: "已启动",
    fatal: "加载失败",
  }[frameStates[scopeId]?.status || "loading"];
}

function setFrameElement(scopeId, element) {
  if (element) frameElements.set(scopeId, element);
  else frameElements.delete(scopeId);
}

function clearFrameTimeout(scopeId) {
  const timeoutId = frameTimeouts.get(scopeId);
  if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  frameTimeouts.delete(scopeId);
}

function armFrameTimeout(scopeId) {
  clearFrameTimeout(scopeId);
  const state = frameStates[scopeId];
  if (!state || state.status !== "loading") return;
  const revision = state.revision;
  const timeoutId = window.setTimeout(() => {
    if (
      frameStates[scopeId]?.status === "loading" &&
      frameStates[scopeId]?.revision === revision
    ) {
      frameStates[scopeId].status = "fatal";
    }
    frameTimeouts.delete(scopeId);
  }, FRAME_LOAD_TIMEOUT_MS);
  frameTimeouts.set(scopeId, timeoutId);
}

function markFrameFatal(scopeId) {
  clearFrameTimeout(scopeId);
  if (frameStates[scopeId]) frameStates[scopeId].status = "fatal";
}

function reloadFrame(scopeId) {
  const state = frameStates[scopeId];
  if (!state) return;
  frameElements.delete(scopeId);
  state.status = "loading";
  state.revision += 1;
  armFrameTimeout(scopeId);
}

function canMoveFrame(scopeId, direction) {
  const sessions = launch.value?.sessions || [];
  const index = sessions.findIndex((session) => session.scopeId === scopeId);
  const targetIndex = index + direction;
  return index >= 0 && targetIndex >= 0 && targetIndex < sessions.length;
}

function stopStripScrollAnimation(strip = gameStrip.value) {
  if (stripScrollAnimationId) {
    window.cancelAnimationFrame(stripScrollAnimationId);
    stripScrollAnimationId = 0;
  }
  if (strip) stripScrollTarget = strip.scrollLeft;
}

function animateStripScroll() {
  const strip = gameStrip.value;
  if (!strip) {
    stripScrollAnimationId = 0;
    return;
  }

  const distance = stripScrollTarget - strip.scrollLeft;
  if (Math.abs(distance) <= 0.5) {
    strip.scrollLeft = stripScrollTarget;
    stripScrollAnimationId = 0;
    return;
  }

  strip.scrollLeft += distance * 0.24;
  stripScrollAnimationId = window.requestAnimationFrame(animateStripScroll);
}

function handleStripWheel(event) {
  const strip = gameStrip.value;
  if (!strip || !event.deltaY) return;
  if (event.ctrlKey || event.metaKey) {
    stopStripScrollAnimation(strip);
    return;
  }
  if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
    stopStripScrollAnimation(strip);
    return;
  }

  let delta = event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
  else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= strip.clientWidth;
  }

  const maxScrollLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
  if (!stripScrollAnimationId) stripScrollTarget = strip.scrollLeft;
  const nextScrollTarget = Math.min(
    maxScrollLeft,
    Math.max(0, stripScrollTarget + delta),
  );
  if (nextScrollTarget === stripScrollTarget) {
    if (stripScrollAnimationId) event.preventDefault();
    return;
  }

  event.preventDefault();
  stripScrollTarget = nextScrollTarget;
  if (!stripScrollAnimationId) {
    stripScrollAnimationId = window.requestAnimationFrame(animateStripScroll);
  }
}

async function moveFrame(scopeId, direction, event) {
  if (movingFrame.value) return;

  const button = event.currentTarget;
  const strip = gameStrip.value;
  stopStripScrollAnimation(strip);
  const previousLeft = button.getBoundingClientRect().left;
  movingFrame.value = true;

  try {
    const updatedLaunch = moveMultiGameSession({
      scopeId,
      direction,
      sessionStorage: window.sessionStorage,
    });
    if (!updatedLaunch) return;

    launch.value = updatedLaunch;
    await nextTick();
    if (!strip || !button.isConnected) return;

    const desiredScrollLeft =
      strip.scrollLeft + button.getBoundingClientRect().left - previousLeft;
    const maxScrollLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
    strip.scrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, desiredScrollLeft),
    );
    stripScrollTarget = strip.scrollLeft;
  } catch (error) {
    console.error("Unable to move MultiGame frame:", error);
    window.alert("移动游戏窗口失败，请重试");
  } finally {
    movingFrame.value = false;
  }
}

function closeFrame(frame) {
  try {
    const updatedLaunch = closeMultiGameSession({
      scopeId: frame.scopeId,
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage,
    });
    clearFrameTimeout(frame.scopeId);
    frameElements.delete(frame.scopeId);
    delete frameStates[frame.scopeId];
    launch.value = updatedLaunch;
  } catch (error) {
    console.error("Unable to close MultiGame frame:", error);
    window.alert("关闭游戏窗口失败，请重试");
  }
}

function handleMessage(event) {
  const result = resolveMultiGameFrameMessage({
    event,
    expectedOrigin: window.location.origin,
    frames: frames.value,
    frameElements,
  });
  if (result && frameStates[result.scopeId]) {
    clearFrameTimeout(result.scopeId);
    frameStates[result.scopeId].status = result.status;
  }
}

function goToTokens() {
  router.push("/tokens");
}

onBeforeMount(() => window.addEventListener("message", handleMessage));
onMounted(() => frames.value.forEach((frame) => armFrameTimeout(frame.scopeId)));
onUnmounted(() => {
  window.removeEventListener("message", handleMessage);
  stopStripScrollAnimation();
  for (const scopeId of frameTimeouts.keys()) clearFrameTimeout(scopeId);
});
</script>

<style scoped>
.multi-game-page {
  position: fixed;
  inset: 0;
  z-index: 1000;
  color: #e5e7eb;
  background: #080b12;
}

.multi-game-toolbar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 8px 12px;
  overflow-x: auto;
  white-space: nowrap;
  border-bottom: 1px solid #273244;
  background: #111827;
}

.toolbar-button,
.move-button,
.reload-button,
.close-button,
.empty-card button,
.frame-error button {
  border: 1px solid #475569;
  border-radius: 6px;
  color: #f8fafc;
  background: #1e293b;
  cursor: pointer;
}

.toolbar-button {
  padding: 7px 11px;
}

.toolbar-button:hover,
.move-button:hover:not(:disabled),
.reload-button:hover,
.close-button:hover,
.empty-card button:hover,
.frame-error button:hover {
  background: #334155;
}

.toolbar-title {
  color: #f8fafc;
  font-size: 16px;
}

.toolbar-count {
  color: #93c5fd;
}

.toolbar-skipped {
  color: #fbbf24;
}

.toolbar-warning {
  margin-left: auto;
  color: #94a3b8;
  font-size: 12px;
}


.crash-help-trigger {
  flex: none;
  padding: 3px 7px;
  border: 1px solid #92400e;
  border-radius: 6px;
  color: #fbbf24;
  background: #451a03;
  cursor: help;
}

.crash-help-trigger:hover,
.crash-help-trigger:focus-visible {
  background: #78350f;
  outline: none;
}

.crash-help-content {
  line-height: 1.6;
  white-space: normal;
}

.crash-help-content p {
  margin: 8px 0;
}

.crash-help-content a {
  color: #2563eb;
  text-decoration: underline;
}
.game-strip {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  flex-flow: row nowrap;
  gap: 12px;
  height: calc(100dvh - 52px);
  padding: 12px;
  overflow-x: auto;
  overflow-y: hidden;
}

.game-panel {
  box-sizing: border-box;
  flex: 0 0
    min(clamp(360px, 32vw, 480px), calc((100dvh - 112px) * 9 / 16));
  min-width: 0;
  height: auto;
  overflow: hidden;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #000;
  box-shadow: 0 10px 28px rgb(0 0 0 / 35%);
}

.game-panel-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 4px 8px;
  background: #172033;
}

.account-name {
  min-width: 0;
  overflow: hidden;
  color: #f8fafc;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.frame-status {
  flex: none;
  font-size: 12px;
}

.frame-status.is-loading {
  color: #fbbf24;
}

.frame-status.is-ready {
  color: #4ade80;
}

.frame-status.is-fatal {
  color: #f87171;
}

.move-button {
  flex: none;
  width: 28px;
  height: 24px;
  padding: 0;
  font-size: 16px;
  line-height: 22px;
}

.move-button-first {
  margin-left: auto;
}

.move-button:disabled {
  color: #64748b;
  background: #111827;
  cursor: not-allowed;
  opacity: 0.65;
}

.reload-button {
  flex: none;
  padding: 3px 7px;
  font-size: 12px;
}

.close-button {
  flex: none;
  padding: 3px 7px;
  border-color: #7f1d1d;
  color: #fecaca;
  background: #450a0a;
  font-size: 12px;
}

.close-button:hover {
  background: #7f1d1d;
}

.game-frame-shell {
  position: relative;
  height: auto;
  aspect-ratio: 9 / 16;
}

.game-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.frame-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: #fecaca;
  background: rgb(15 23 42 / 92%);
}

.frame-error span {
  color: #94a3b8;
  font-size: 13px;
}

.frame-error button {
  padding: 7px 16px;
}

.empty-state {
  display: grid;
  height: calc(100dvh - 52px);
  padding: 24px;
  place-items: center;
}

.empty-card {
  max-width: 480px;
  padding: 32px;
  text-align: center;
  border: 1px solid #334155;
  border-radius: 12px;
  background: #111827;
}

.empty-card h1 {
  margin: 0 0 12px;
  color: #f8fafc;
  font-size: 22px;
}

.empty-card p {
  margin: 0 0 20px;
  color: #94a3b8;
}

.empty-card button {
  padding: 9px 18px;
}
</style>
