/**
 * 前端埋点日志
 *
 * 用途：把前端运行时的关键事件 / 异常上报到本地后端（render-backend），
 *      由后端写入 render-backend/logs/frontend-YYYY-MM-DD.log（JSONL），
 *      方便排查线上问题、分析操作路径。
 *
 * 设计要点：
 *  - 批量 + 定时上报，避免每次打点都发请求；页面隐藏/卸载时用 sendBeacon 兜底。
 *  - 任何失败都静默（打点不能影响业务），最多在控制台 debug 一下。
 *  - 全局只初始化一次；未初始化时调用 logEvent 也能缓存后再发。
 *  - 上报地址默认走 vite 代理 /api/frontend-log，可用 VITE_LOG_ENDPOINT 覆盖。
 */

const ENDPOINT = import.meta.env?.VITE_LOG_ENDPOINT || "/api/frontend-log";
const MAX_BUFFER = 20;
const FLUSH_INTERVAL = 3000;
const MAX_MESSAGE_LEN = 2000;

const buffer = [];
let timer = null;
let initialized = false;
let sessionId = "";
let seq = 0;

function genSessionId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}`;
}

function currentPage() {
  if (typeof window === "undefined") return "";
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`.slice(0, 300);
}

/** 把任意值安全地转成可 JSON 序列化的形式（截断过长内容） */
function safeMeta(meta) {
  if (meta === undefined || meta === null) return undefined;
  try {
    const seen = new WeakSet();
    const text = JSON.stringify(meta, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      if (typeof value === "string" && value.length > 800) {
        return `${value.slice(0, 800)}…`;
      }
      if (typeof value === "function") return "[Function]";
      return value;
    });
    if (!text) return undefined;
    return text.length > 4000 ? { truncated: text.slice(0, 4000) } : JSON.parse(text);
  } catch {
    return { parseError: String(meta).slice(0, 200) };
  }
}

function normalizeError(err) {
  if (!err) return {};
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: (err.stack || "").slice(0, 1500) };
  }
  return { message: String(err).slice(0, 500) };
}

function flush(useBeacon = false) {
  if (!buffer.length) return;
  const logs = buffer.splice(0, buffer.length);
  const payload = JSON.stringify({ logs });

  try {
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      // 页面正在卸载，fetch 可能被中断，用 beacon 更可靠
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* 上报失败静默 */
    });
  } catch {
    /* 忽略 */
  }
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL);
}

/**
 * 记一条日志。
 * @param {"debug"|"info"|"warn"|"error"} level
 * @param {string} message
 * @param {object} [meta] 附加信息（会自动 JSON 化并截断）
 */
export function logEvent(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message: String(message ?? "").slice(0, MAX_MESSAGE_LEN),
    page: currentPage(),
    sessionId,
    seq: (seq += 1),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : undefined,
    meta: safeMeta(meta),
  };
  buffer.push(entry);
  if (buffer.length >= MAX_BUFFER) {
    flush();
    return;
  }
  schedule();
}

export const logDebug = (message, meta) => logEvent("debug", message, meta);
export const logInfo = (message, meta) => logEvent("info", message, meta);
export const logWarn = (message, meta) => logEvent("warn", message, meta);
export const logError = (message, meta) => logEvent("error", message, meta);

/** 记录一次异常（自动带上 name/message/stack） */
export function logException(error, meta) {
  logEvent("error", `异常：${error?.message || error}`, {
    ...normalizeError(error),
    ...(meta || {}),
  });
}

/**
 * 初始化全局采集：未捕获异常、Promise 未处理拒绝、页面隐藏时兜底上报。
 * 重复调用无副作用。
 */
export function initFrontendLog() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  sessionId = genSessionId();

  window.addEventListener("error", (event) => {
    logEvent("error", `未捕获异常：${event.message || "unknown"}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: (event.error?.stack || "").slice(0, 1500),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logEvent("error", "未处理的 Promise 拒绝", normalizeError(event.reason));
  });

  // 页面进入后台/关闭时，把还没发出去的日志补发
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));

  logEvent("info", "前端埋点已启动", {
    endpoint: ENDPOINT,
    href: window.location.href,
  });
}
