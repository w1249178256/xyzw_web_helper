/**
 * 后台保活工具：Worker 节拍器 + 静音音频。
 *
 * 为什么需要：
 *   浏览器对后台 tab 有节能策略——定时器最慢会被压到每分钟一次。
 *   推关循环（sleep）、WebSocket 心跳（setInterval 5s）都靠定时器，
 *   一旦切到别的窗口，心跳发不出去就会断联，sleep(2s) 也会变成 60s。
 *
 * 两个手段互相兜底：
 *   1) Worker 节拍器：每 1 秒 postMessage 一次。Worker 的定时器不受后台节流，
 *      主线程收到消息后立刻执行（消息事件也不被节流）。
 *   2) 静音音频：AudioContext 播放极小音量振荡器，让浏览器认为页面在出声，
 *      从整体上放宽该 tab 的节流策略。需要用户手势解锁（点击按钮时调用）。
 */

let worker = null;
const tickListeners = new Set();
let lastTickAt = 0;

function ensureWorker() {
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./bgTicker.worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.type !== "tick") return;
      lastTickAt = data.now || Date.now();
      for (const fn of tickListeners) {
        try {
          fn(lastTickAt);
        } catch {
          /* 单个回调异常不影响其它 */
        }
      }
    };
    worker.postMessage({ type: "start" });
  } catch {
    worker = null;
  }
  return worker;
}

/** 启动节拍器（可重复调用，幂等） */
export function startBgTicker() {
  ensureWorker();
}

export function stopBgTicker() {
  if (worker) {
    worker.postMessage({ type: "stop" });
    worker.terminate();
    worker = null;
  }
}

/** 最近一次 tick 的时间戳，用于判断节拍器是否还活着 */
export function getLastTickAt() {
  return lastTickAt;
}

/**
 * 订阅 tick，返回取消函数。
 * @param {(now: number) => void} fn
 */
export function onBgTick(fn) {
  tickListeners.add(fn);
  ensureWorker();
  return () => tickListeners.delete(fn);
}

/**
 * 不受后台节流的 sleep。
 * 前台靠 setTimeout 唤醒，后台 setTimeout 被压后由 tick 补上。
 */
export function bgSleep(ms) {
  return new Promise((resolve) => {
    let done = false;
    const startedAt = Date.now();
    const finish = () => {
      if (done) return;
      done = true;
      offTick();
      clearTimeout(fallback);
      resolve();
    };
    const offTick = onBgTick((now) => {
      if (now - startedAt >= ms) finish();
    });
    const fallback = setTimeout(finish, ms);
  });
}

/* ---------------- 静音音频保活 ---------------- */

let audioCtx = null;
let oscillator = null;
let audioGain = null;

/**
 * 启动静音音频（必须在用户点击等手势里调用，否则会被浏览器拦截）。
 * @returns {Promise<boolean>} 是否成功运行
 */
export async function startAudioKeepAlive() {
  try {
    if (audioCtx && audioCtx.state === "running") return true;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    audioCtx = audioCtx || new Ctor();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    if (!oscillator) {
      oscillator = audioCtx.createOscillator();
      audioGain = audioCtx.createGain();
      // 音量压到几乎不可闻，但足以让浏览器认为页面在出声
      audioGain.gain.value = 0.0001;
      oscillator.frequency.value = 440;
      oscillator.connect(audioGain);
      audioGain.connect(audioCtx.destination);
      oscillator.start();
    }
    return audioCtx.state === "running";
  } catch {
    return false;
  }
}

/** 停止静音音频 */
export function stopAudioKeepAlive() {
  try {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    if (audioGain) {
      audioGain.disconnect();
      audioGain = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  } catch {
    /* 忽略 */
  }
}

/** 音频是否在运行 */
export function isAudioKeepAliveRunning() {
  return Boolean(audioCtx && audioCtx.state === "running");
}
