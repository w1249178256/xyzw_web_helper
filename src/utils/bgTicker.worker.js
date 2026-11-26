/**
 * 后台节拍器（Web Worker 版）
 *
 * 浏览器会把后台 tab 的定时器节流到每分钟一次，导致心跳发不出去、推关循环卡住。
 * Web Worker 里的定时器不受这个限制，所以把"节拍"放到 Worker 里，
 * 主线程收到 tick 后再发心跳 / 推进一步。
 */

let timer = null;

globalThis.onmessage = (event) => {
  const { type } = event.data || {};
  if (type === "start") {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      globalThis.postMessage({ type: "tick", now: Date.now() });
    }, 1000);
  } else if (type === "stop") {
    if (timer) clearInterval(timer);
    timer = null;
  }
};
