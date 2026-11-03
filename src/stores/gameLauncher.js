import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, onScopeDispose, reactive, ref, watch } from "vue";
import {
  acquireGameToken,
  gameReservations,
  isGameTokenRunning,
  refreshGameToken,
  releaseGameToken,
} from "@/utils/gameReservations";
import {
  cacheGameScript,
  gameScriptCacheKey,
  readGameScript,
} from "@/utils/gameResourceCache";
import { proxyGameResource } from "@/utils/linkGameResource";
import { loadGameRuntime } from "@/utils/linkGameRuntime";
import { useTokenStore } from "./tokenStore";

const CHANNEL = "xyzw-game-runtime-v1";

export const useGameLauncherStore = defineStore("gameLauncher", () => {
  const tokens = useTokenStore();
  let owner;
  const windows = ref([]);
  const notice = ref("");
  const focusId = ref("");
  const revealRequest = ref(null);
  const lastActivity = ref(0);
  const muted = useLocalStorage("xyzw_gameMuted", true);
  const defaults = useLocalStorage("xyzw_gameWindowDefaults", {
    width: 360,
    height: 640,
    fps: 30,
    speed: 1.2,
    layout: "manual",
    columns: 3,
  });
  const savedSettings = useLocalStorage("xyzw_gameWindowSettings", {});
  const frames = new Map();
  const accounts = new Map();
  const proxyRequests = new Map();
  const startupTimers = new Map();
  let nextOrder = 0;
  let stopRevision = 0;
  const activeCount = computed(() => windows.value.length);

  function post(win, type, values = {}, transfer = []) {
    frames.get(win.id)?.contentWindow?.postMessage(
      {
        channel: CHANNEL,
        id: win.id,
        generation: win.generation,
        type,
        ...values,
      },
      location.origin,
      transfer,
    );
  }

  watch(
    muted,
    (value) => {
      for (const win of windows.value) {
        // Same-origin direct call preserves the click gesture for audio resume on mobile.
        try {
          frames.get(win.id)?.contentWindow?.__multi?.setMuted(value);
        } catch {}
        post(win, "audio", { muted: value });
      }
    },
    { flush: "sync" },
  );

  function attachFrame(id, element) {
    if (element) frames.set(id, element);
    else frames.delete(id);
  }

  function revealWindow(win) {
    // Opening an account must never silently hide other running windows.
    focusId.value = "";
    revealRequest.value = { id: win.id };
  }

  function abortProxies(id) {
    for (const [key, request] of proxyRequests) {
      if (request.id === id) {
        request.controller.abort();
        proxyRequests.delete(key);
      }
    }
  }

  function stop(id) {
    const win = windows.value.find((item) => item.id === id);
    if (!win) return;
    win.cancelled = true;
    post(win, "dispose");
    // Dispose synchronously while the iframe is still mounted, then Vue removes it.
    try {
      frames.get(id)?.contentWindow?.__multi?.dispose();
    } catch {
      /* frame not ready */
    }
    abortProxies(id);
    clearTimeout(startupTimers.get(id));
    startupTimers.delete(id);
    windows.value = windows.value.filter((item) => item !== win);
    frames.delete(id);
    accounts.delete(id);
    if (focusId.value === id) focusId.value = "";
    if (revealRequest.value?.id === id) revealRequest.value = null;
    releaseGameToken(win.tokenId, win.leaseOwner);
  }

  function stopAll() {
    stopRevision++;
    for (const win of [...windows.value]) stop(win.id);
  }

  async function start(tokenId) {
    const revision = stopRevision;
    notice.value = "";
    const existing = windows.value.find((win) => win.tokenId === tokenId);
    if (existing) {
      revealWindow(existing);
      return;
    }
    let win;
    try {
      const core = await loadGameRuntime();
      if (revision !== stopRevision) return;
      owner ||= core.createInstanceId();
      const record = tokens.gameTokens.find((token) => token.id === tokenId);
      const account = core.parseGameToken(record);
      const duplicate = windows.value.find(
        (item) =>
          item.identity === account.identity || item.tokenId === tokenId,
      );
      if (duplicate) {
        revealWindow(duplicate);
        if (duplicate.tokenId !== tokenId)
          notice.value = `「${account.name}」与已开启的「${duplicate.name}」对应同一角色，请使用已有窗口`;
        return;
      }
      if (isGameTokenRunning(tokenId))
        throw new Error("该账号已在其他游戏窗口中运行");
      win = reactive({
        id: `m_${core.createInstanceId()}`,
        generation: core.createInstanceId(),
        tokenId,
        order: nextOrder++,
        name: account.name,
        server: account.server,
        identity: account.identity,
        settings: core.settings(savedSettings.value[tokenId] || defaults.value),
        status: "preparing",
        detail: "正在检查账号占用…",
        fps: 0,
        mounted: false,
        cancelled: false,
      });
      windows.value.push(win);
      revealWindow(win);
      win.leaseOwner = `${owner}:${win.id}`;
      await acquireGameToken(tokenId, win.leaseOwner, account.identity);
      if (win.cancelled) {
        releaseGameToken(tokenId, win.leaseOwner);
        return;
      }
      await tokens.closeWebSocketConnectionAsync(tokenId);
      for (
        let retry = 0;
        retry < 60 &&
        ["connected", "connecting", "disconnecting"].includes(
          tokens.getWebSocketStatus(tokenId),
        );
        retry++
      ) {
        if (win.cancelled) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (win.cancelled) return;
      if (
        ["connected", "connecting", "disconnecting"].includes(
          tokens.getWebSocketStatus(tokenId),
        )
      )
        throw new Error("助手连接尚未停止，请稍后重新进入游戏");
      if (!refreshGameToken(tokenId, win.leaseOwner))
        throw new Error("账号已在其他窗口运行，请关闭该窗口后重试");
      accounts.set(win.id, account);
      win.status = "loading";
      win.detail = "正在加载游戏…";
      win.mounted = true;
      startupTimers.set(
        win.id,
        setTimeout(() => {
          if (
            !win.cancelled &&
            ["loading", "authenticating", "connected"].includes(win.status)
          ) {
            win.detail =
              "游戏仍在加载，手机处理资源可能较慢，请保持页面前台并继续等待";
          }
        }, 120000),
      );
    } catch (error) {
      if (win) stop(win.id);
      notice.value =
        error?.error || error?.message || "启动游戏失败，请检查 Token 和网络";
    }
  }

  async function restart(id) {
    const win = windows.value.find((item) => item.id === id);
    if (!win || !win.mounted || win.restarting) return;
    win.restarting = true;
    try {
      const core = await loadGameRuntime();
      const account = core.parseGameToken(
        tokens.gameTokens.find((token) => token.id === win.tokenId),
      );
      if (account.identity !== win.identity)
        throw new Error("账号角色已变化，请关闭窗口后重新进入");
      if (!refreshGameToken(win.tokenId, win.leaseOwner))
        throw new Error("账号占用已失效，请关闭窗口后重新进入");
      if (win.cancelled) return;
      post(win, "dispose");
      try {
        frames.get(id)?.contentWindow?.__multi?.dispose();
      } catch {}
      abortProxies(id);
      clearTimeout(startupTimers.get(id));
      accounts.set(id, account);
      win.generation = core.createInstanceId();
      win.name = account.name;
      win.server = account.server;
      win.identity = account.identity;
      win.status = "loading";
      win.detail = "正在重新登录…";
      win.fps = 0;
      startupTimers.set(
        id,
        setTimeout(() => {
          if (
            !win.cancelled &&
            ["loading", "authenticating", "connected"].includes(win.status)
          ) {
            win.detail =
              "游戏仍在加载，手机处理资源可能较慢，请保持页面前台并继续等待";
          }
        }, 120000),
      );
    } catch (error) {
      notice.value = error?.error || error?.message || "重新登录失败";
    } finally {
      win.restarting = false;
    }
  }

  async function configure(id, values) {
    const core = await loadGameRuntime();
    const win = windows.value.find((item) => item.id === id);
    if (!win) return;
    win.settings = core.settings(values);
    savedSettings.value = {
      ...savedSettings.value,
      [win.tokenId]: win.settings,
    };
    post(win, "configure", { settings: { ...win.settings } });
  }

  async function applyDefaults() {
    for (const win of windows.value) {
      await configure(
        win.id,
        defaults.value.layout === "auto"
          ? {
              ...win.settings,
              fps: defaults.value.fps,
              speed: defaults.value.speed,
            }
          : defaults.value,
      );
    }
  }

  function move(id, direction) {
    const index = windows.value.findIndex((win) => win.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= windows.value.length) return;
    [windows.value[index], windows.value[target]] = [
      windows.value[target],
      windows.value[index],
    ];
  }

  async function proxy(win, message) {
    if (
      typeof message.requestId !== "string" ||
      message.requestId.length > 50 ||
      proxyRequests.size >= 80
    )
      return;
    const key = `${win.id}:${message.requestId}`;
    const generation = win.generation;
    if (proxyRequests.has(key)) return;
    const controller = new AbortController();
    proxyRequests.set(key, { id: win.id, controller });
    try {
      let request = message;
      let result;
      const cacheKey = gameScriptCacheKey(message);
      if (cacheKey) result = await readGameScript(cacheKey);
      if (
        controller.signal.aborted ||
        win.cancelled ||
        win.generation !== generation
      )
        return;
      const cached = Boolean(result);
      if (!cached) {
        for (let redirects = 0; redirects <= 5; redirects++) {
          result = await proxyGameResource(request, controller.signal);
          if (
            ![301, 302, 303, 307, 308].includes(result.status) ||
            !result.redirect
          )
            break;
          if (redirects === 5) throw new Error("游戏资源重定向次数过多");
          request = {
            ...request,
            url: new URL(result.redirect, request.url).href,
          };
          if (
            result.status === 303 ||
            ([301, 302].includes(result.status) && request.method === "POST")
          )
            request = { ...request, method: "GET", body: null };
        }
      }
      if (cacheKey && !cached && !controller.signal.aborted)
        void cacheGameScript(cacheKey, result);
      if (!win.cancelled && win.generation === generation)
        post(win, "proxy-result", { ...result, requestId: message.requestId }, [
          result.body,
        ]);
    } catch (error) {
      if (!win.cancelled && win.generation === generation)
        post(win, "proxy-result", {
          requestId: message.requestId,
          error: error.message || "游戏资源请求失败",
        });
    } finally {
      proxyRequests.delete(key);
    }
  }

  const handleMessage = (event) => {
    const m = event.data;
    if (event.origin !== location.origin || m?.channel !== CHANNEL) return;
    const win = windows.value.find((item) => item.id === m.id);
    if (
      !win ||
      win.cancelled ||
      win.generation !== m.generation ||
      event.source !== frames.get(win.id)?.contentWindow
    )
      return;
    // Settings contain only numbers; snapshot them so postMessage never receives a Vue Proxy.
    if (m.type === "ready")
      post(win, "initialize", {
        account: accounts.get(win.id),
        settings: { ...win.settings },
        muted: muted.value,
      });
    if (m.type === "status") {
      if (
        [
          "loading",
          "authenticating",
          "connected",
          "online",
          "disconnected",
          "error",
        ].includes(m.state)
      )
        win.status = m.state;
      win.detail = String(m.detail || "").slice(0, 300);
      win.fps = Math.max(0, Math.min(240, Number(m.fps) || 0));
      if (win.status === "online") {
        clearTimeout(startupTimers.get(win.id));
        startupTimers.delete(win.id);
      }
    }
    if (m.type === "role" && m.name) win.name = String(m.name).slice(0, 100);
    if (m.type === "restart") restart(win.id);
    if (m.type === "activity") lastActivity.value = Date.now();
    if (m.type === "proxy-request") proxy(win, m);
    if (m.type === "proxy-abort")
      proxyRequests.get(`${win.id}:${m.requestId}`)?.controller.abort();
  };

  function heartbeat() {
    for (const win of [...windows.value]) {
      if (win.mounted && !refreshGameToken(win.tokenId, win.leaseOwner)) {
        notice.value = `${win.name}：账号占用已失效，请重新进入`;
        stop(win.id);
      }
    }
  }
  const heartbeatTimer = setInterval(heartbeat, 30000);
  window.addEventListener("message", handleMessage);
  window.addEventListener("focus", heartbeat);
  window.addEventListener("pagehide", stopAll);
  watch(
    gameReservations,
    () => {
      for (const win of [...windows.value]) {
        const lease = gameReservations.value[win.tokenId];
        if (win.mounted && (!lease || lease.owner !== win.leaseOwner)) {
          notice.value = `${win.name}：账号占用已变化，请重新进入`;
          stop(win.id);
        }
      }
    },
    { deep: true },
  );
  watch(
    () => tokens.gameTokens.map((token) => token.id),
    (ids) => {
      for (const win of [...windows.value]) {
        if (!ids.includes(win.tokenId)) stop(win.id);
      }
    },
  );
  onScopeDispose(() => {
    stopAll();
    clearInterval(heartbeatTimer);
    window.removeEventListener("message", handleMessage);
    window.removeEventListener("focus", heartbeat);
    window.removeEventListener("pagehide", stopAll);
  });

  return {
    windows,
    notice,
    defaults,
    focusId,
    revealRequest,
    lastActivity,
    muted,
    activeCount,
    start,
    stop,
    stopAll,
    restart,
    configure,
    applyDefaults,
    move,
    attachFrame,
  };
});
