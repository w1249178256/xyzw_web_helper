import { CHANNEL, authResponse, createInstanceId, normalizeGameId, settings } from "./core.js?v=20261028.3";
import { createAudioControl } from "./audio.js?v=20261028.1";

const params = new URLSearchParams(location.hash.slice(1));
const id = params.get("id"), generation = params.get("generation");
const status = document.getElementById("local-status");
if (parent === window || !/^m_[\w-]{6,64}$/.test(id || "") || !/^[\da-f-]{36}$/.test(generation || "")) {
  status.textContent = "请从前端的“在线游戏”页面打开";
  throw new Error("Missing game instance");
}

let disposed = false, initialized = false, account, config = settings(), authAccepted = false;
let actualFPS = 0, rendered = 0, lastSample = performance.now(), state = "loading", detail = "";
let startedAt = null;
let loginSignal = null, loginRole = null;
const loginObserver = {};
const diagnostics = [];
const audio = createAudioControl(window);
const sockets = new Set(), timers = new Set(), intervals = new Set(), requests = new Map();
const nativeTimeout = window.setTimeout.bind(window), nativeInterval = window.setInterval.bind(window);
const nativeClearTimeout = window.clearTimeout.bind(window), nativeClearInterval = window.clearInterval.bind(window);
const nativeFetch = window.fetch.bind(window), NativeWebSocket = window.WebSocket;
const nativeLocalStorage = window.localStorage, nativeSessionStorage = window.sessionStorage;

function post(type, values = {}, transfer = []) {
  if (!disposed) parent.postMessage({ channel: CHANNEL, id, generation, type, ...values }, location.origin, transfer);
}
function report(next, message = "") {
  if (state === "online" && next === "loading") return;
  state = next; detail = message;
  publishStatus();
}
function publishStatus() {
  let message = detail;
  if (startedAt !== null && ["loading", "authenticating", "connected"].includes(state)) {
    const elapsed = Math.floor((performance.now() - startedAt) / 1000);
    message = `${detail || "正在加载游戏"} · ${elapsed} 秒`;
    if (elapsed >= 120) message += "；手机处理资源可能较慢，请保持页面前台并继续等待";
  }
  post("status", { state, detail: message, fps: actualFPS });
}
function recordStartupError(event, rejection = false) {
  if (disposed || state === "online") return;
  let file = "";
  try { file = new URL(event.filename).pathname.split("/").pop(); } catch {}
  diagnostics.push({ stage: detail, seconds: Math.floor((performance.now() - (startedAt ?? performance.now())) / 1000),
    type: String((rejection ? event.reason?.name : event.error?.name) || (rejection ? "PromiseRejection" : "ScriptError")),
    file, line: Number(event.lineno) || 0 });
  if (diagnostics.length > 10) diagnostics.shift();
  // Optional SDK/audio errors are not evidence that cached login credentials are invalid.
  // Explicit loader callbacks still report fatal download/scene errors.
  publishStatus();
}
function fail(message) {
  const text = typeof message === "string" ? message : "游戏加载失败，请重登或返回 Tokens 刷新凭据";
  status.textContent = text; status.style.display = "block";
  report("error", text);
}

window.setTimeout = (fn, delay, ...args) => {
  if (disposed) return 0;
  const timer = nativeTimeout(typeof fn === "function" ? () => { timers.delete(timer); fn(...args); } : fn, delay);
  timers.add(timer); return timer;
};
window.clearTimeout = timer => { timers.delete(timer); nativeClearTimeout(timer); };
window.setInterval = (...args) => {
  if (disposed) return 0;
  const timer = nativeInterval(...args); intervals.add(timer); return timer;
};
window.clearInterval = timer => { intervals.delete(timer); nativeClearInterval(timer); };

function isolateStorage(tokenId) {
  const prefix = `xyzw:game:${encodeURIComponent(tokenId)}:`;
  Object.defineProperty(window, "localStorage", { configurable: true, value: MultiCore.scopeStorage(nativeLocalStorage, prefix) });
  Object.defineProperty(window, "sessionStorage", { configurable: true, value: MultiCore.scopeStorage(nativeSessionStorage, prefix) });
  const db = window.indexedDB;
  Object.defineProperty(window, "indexedDB", { configurable: true, value: {
    open: (name, ...args) => db.open(prefix + name, ...args),
    deleteDatabase: name => db.deleteDatabase(prefix + name),
    cmp: db.cmp.bind(db),
    databases: async () => (await db.databases()).filter(item => item.name?.startsWith(prefix)).map(item => ({ ...item, name: item.name.slice(prefix.length) })),
  } });
  // Only the facade's own session data is cleared. Parent Tokens are never touched.
  sessionStorage.clear();
  if (account.auth.serverId != null) localStorage.setItem("serverId", String(account.auth.serverId));
}

function installLoginGate() {
  if (!initialized || disposed || typeof window.__require !== "function") return;
  installLoginObserver();
  let service;
  try { service = window.__require("data-index")?.LoginService; } catch { return; }
  if (!service?.authUser || service.authUser.__frontendToken) return;
  // LoginManager consumes code, rawData.roleToken and getData(), not a BIN request.
  const authUser = async () => {
    if (disposed) throw new Error("游戏窗口已关闭");
    authAccepted = true; loginRole = null;
    startedAt ??= performance.now();
    report("authenticating", "正在使用本地 Token 进入游戏");
    return authResponse(account.auth);
  };
  authUser.__frontendToken = true;
  authUser.isSelfCreate = true;
  service.authUser = authUser;
}

function attachEngine() {
  const cc = window.cc;
  if (!cc?.game?.config) return;
  if (cc.game.getFrameRate() !== config.fps) {
    const paused = cc.game.isPaused(); cc.game.setFrameRate(config.fps);
    if (paused) cc.game.pause();
  }
  const scheduler = cc.director?.getScheduler?.();
  if (scheduler && scheduler.getTimeScale?.() !== config.speed) scheduler.setTimeScale(config.speed);
  window.__currentSpeed = config.speed; window.__speedMultiplier = config.speed;
  if (cc.renderer?.render && !cc.renderer.render.__frontendCounter) {
    const render = cc.renderer.render;
    const wrapped = function (...args) { const result = render.apply(this, args); rendered++; return result; };
    wrapped.__frontendCounter = true; cc.renderer.render = wrapped;
  }
}

function hasGameConnection(received = false) {
  return [...sockets].some(socket => socket.__gameConnection && socket.readyState === NativeWebSocket.OPEN && (!received || socket.__received));
}

function readRole(role) {
  // Runtime IDs can also be integer objects whose toString preserves all digits.
  const normalize = value => normalizeGameId(value && typeof value === "object" ? String(value) : value);
  const roleId = normalize(role?.roleId) || normalize(role?.id);
  return roleId ? { role, roleId } : null;
}

function currentRole() {
  // createServerData publishes these globals for game scripts. Module aliases
  // can be unavailable after another remote bundle replaces __require.
  const globalRole = readRole(window.ROLE) || readRole(window.SERVER_DATA?.role);
  if (globalRole) return globalRole;
  for (const name of ["ServerData", "../orange/data/ServerData", "../../orange/data/ServerData"]) {
    try {
      const current = readRole(window.__require(name)?.ROLE);
      if (current) return current;
    } catch {}
  }
  return null;
}

function markOnline(current) {
  state = "online"; detail = ""; startedAt = null; status.style.display = "none";
  post("role", { roleId: current.roleId, name: String(current.role.name || current.role.roleName || account.name) });
}

function onGameLogin(reconnected, role) {
  if (disposed || !authAccepted || !hasGameConnection(true)) return;
  const current = readRole(role);
  if (!current) return;
  // LoginManager emits EventLogin(reconnected, response.role) only after a
  // successful getRoleInfo response. Cached Token metadata is not authoritative.
  loginRole = current;
  markOnline(current); publishStatus();
}

function installLoginObserver() {
  let signal;
  try { signal = window.__require("GlobalSignal")?.GlobalSignal?.EventLogin; } catch { return; }
  if (signal === loginSignal || typeof signal?.on !== "function" || typeof signal?.off !== "function") return;
  loginSignal?.off(onGameLogin, loginObserver);
  signal.on(onGameLogin, loginObserver);
  loginSignal = signal;
}

window.WebSocket = class extends NativeWebSocket {
  constructor(url, ...args) {
    if (disposed) throw new Error("游戏窗口已关闭");
    const target = new URL(url);
    if (account?.wsUrl && target.pathname === "/agent") {
      const custom = new URL(account.wsUrl);
      for (const [key, value] of target.searchParams) custom.searchParams.set(key, value);
      url = custom.href;
    }
    super(url, ...args); sockets.add(this);
    this.__gameConnection = target.pathname === "/agent";
    this.addEventListener("open", () => {
      if (authAccepted && this.__gameConnection) {
        loginRole = null;
        startedAt ??= performance.now();
        report("connected", "已连接游戏服务器，正在同步角色");
      }
    });
    this.addEventListener("message", () => { this.__received = true; });
    this.addEventListener("close", () => {
      sockets.delete(this);
      if (!disposed && this.__gameConnection && !hasGameConnection()) {
        loginRole = null;
        report("disconnected", "连接已断开；若重登仍失败，请返回 Tokens 刷新凭据");
      }
    });
  }
};

// The parent fetches public resources through the current deployment; credentials stay in the frame.
async function proxyFetch(input, options = {}, force = false) {
  const request = new Request(input, options), target = new URL(request.url);
  const hosts = ["xxz-xyzw.hortorgames.com", "xyzw11001.baby", "xxz-xyzw-res.hortorgames.com", "wxmini-resource.hortorgames.com"];
  if (target.origin === location.origin || (!force && !hosts.includes(target.hostname))) return nativeFetch(request);
  if (disposed || request.signal.aborted) throw new DOMException("Aborted", "AbortError");
  const body = ["GET", "HEAD"].includes(request.method) ? null : await request.arrayBuffer();
  if (disposed || request.signal.aborted) throw new DOMException("Aborted", "AbortError");
  const requestId = createInstanceId();
  return new Promise((resolve, reject) => {
    const abort = () => {
      post("proxy-abort", { requestId }); finish(); reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => { abort(); }, 70000);
    const finish = () => { clearTimeout(timer); requests.delete(requestId); request.signal.removeEventListener("abort", abort); };
    requests.set(requestId, { resolve, reject, finish });
    request.signal.addEventListener("abort", abort, { once: true });
    if (request.signal.aborted) return abort();
    post("proxy-request", { requestId, url: target.href, method: request.method, headers: Object.fromEntries(request.headers), body }, body ? [body] : []);
  });
}
window.fetch = (input, options) => proxyFetch(input, options);
window.__multiNetwork = { fetch: (input, options) => proxyFetch(input, options, true), dispose };

function dispose() {
  if (disposed) return;
  disposed = true;
  loginSignal?.off(onGameLogin, loginObserver);
  loginSignal = null; loginRole = null;
  for (const request of [...requests.values()]) { request.finish(); request.reject(new DOMException("Aborted", "AbortError")); }
  for (const timer of timers) nativeClearTimeout(timer);
  for (const timer of intervals) nativeClearInterval(timer);
  timers.clear(); intervals.clear();
  for (const socket of sockets) { try { socket.close(1000, "Window closed"); } catch {} }
  sockets.clear();
  audio.dispose();
  try { window.cc?.game?.pause(); window.cc?.director?.stopAnimation(); } catch {}
}

// Compatibility points used by the preserved loader and scripts.
window.__multi = {
  get settings() { return config; }, get disposed() { return disposed; },
  get diagnostics() { return diagnostics.map(item => ({ ...item })); },
  installLoginGate, report, setMuted: value => audio.setMuted(value), restart: () => post("restart"), dispose,
};

async function boot() {
  for (const src of ["patch.js", "src/settings.js", "game-defines.js", "utils/boot.js", "gm-support.js", "xyzw.ready.js", "1.js", "4.js", "cocos2d-js-min.js", "main.js"]) {
    if (disposed) return;
    report("loading", src === "cocos2d-js-min.js" ? "正在加载游戏引擎" : "正在准备游戏启动脚本");
    await new Promise((resolve, reject) => {
      const script = document.createElement("script"); script.src = src + "?v=20261028.1"; script.charset = "utf-8";
      script.onload = resolve; script.onerror = () => reject(new Error("脚本加载失败：" + src));
      document.body.append(script);
    });
  }
  if (disposed) return;
  cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
    document.getElementById("splash").style.display = "none"; status.style.display = "none";
  });
  status.textContent = "正在加载游戏资源…";
  await window.boot();
}

window.addEventListener("message", event => {
  const m = event.data;
  if (disposed || event.source !== parent || event.origin !== location.origin || m?.channel !== CHANNEL || m.id !== id || m.generation !== generation) return;
  if (m.type === "initialize" && !initialized) {
    try {
      if (!m.account?.auth?.roleToken || !m.account.tokenId) throw new Error("缺少账号凭据");
      account = m.account; config = settings(m.settings); isolateStorage(account.tokenId);
      initialized = true; startedAt = performance.now(); audio.setMuted(m.muted);
      post("initialized"); boot().catch(error => { if (!disposed) fail(error?.message || "游戏资源加载失败，请检查网络后重登"); });
    } catch { fail("无法初始化游戏，请检查浏览器存储权限和 Token"); }
  }
  if (m.type === "configure") { config = settings(m.settings); attachEngine(); }
  if (m.type === "audio") audio.setMuted(m.muted);
  if (m.type === "dispose") dispose();
  if (m.type === "proxy-result") {
    const request = requests.get(m.requestId);
    if (!request) return;
    request.finish();
    if (m.error) request.reject(new Error(m.error));
    else {
      const response = new Response([204, 205, 304].includes(m.status) ? null : m.body, { status: m.status, headers: m.headers });
      Object.defineProperty(response, "url", { value: m.url }); request.resolve(response);
    }
  }
});
window.addEventListener("pagehide", dispose);
let lastActivity = -Infinity;
for (const event of ["pointerdown", "keydown", "wheel"]) {
  window.addEventListener(event, () => {
    if (performance.now() - lastActivity < 3000) return;
    lastActivity = performance.now(); post("activity");
  }, { passive: true, capture: true });
}
window.addEventListener("error", event => recordStartupError(event));
window.addEventListener("unhandledrejection", event => recordStartupError(event, true));
setInterval(() => {
  if (!initialized) return post("ready");
  installLoginGate(); attachEngine();
  const now = performance.now(); actualFPS = Math.round(rendered * 1000 / (now - lastSample)); rendered = 0; lastSample = now;
  if (authAccepted && hasGameConnection(true)) {
    const current = loginSignal ? loginRole : currentRole();
    const expectedRoleId = normalizeGameId(account.auth.roleId);
    if (current && (loginRole || !expectedRoleId || current.roleId === expectedRoleId)) {
      markOnline(current);
    }
  }
  publishStatus();
}, 1000);
post("ready");
