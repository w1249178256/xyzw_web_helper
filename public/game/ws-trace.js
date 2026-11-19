/*
 * 游戏页 WebSocket 报文埋点（本地调试用）
 *
 * 目的：实机演示「十殿试炼」时，把游戏 H5 真实收发的报文原样录下来，
 * 由 render-backend 落到 render-backend/logs/frontend-YYYY-MM-DD.log，
 * 再用 tools/decode-frontend-ws.mjs 离线解码，得到真实的命令名与消息体。
 *
 * 走的是项目自带的 /frontend-log 通道（vite 代理到 3001），
 * 所以不需要额外起服务；页面和 dev server 同源，也没有跨域问题。
 *
 * 必须在任何游戏脚本之前执行，因此写在 index.html 的 <head> 里。
 */
(function () {
  "use strict";

  var ENDPOINT = "/frontend-log";
  var VERSION = "v4";
  var FLUSH_MS = 2000;
  var MAX_BATCH_ITEMS = 8;
  var MAX_BATCH_CHARS = 55000; // 单次请求 base64 累计上限（express.json 默认 100kb）
  var MAX_FRAME_CHARS = 600000; // 单帧 base64 上限（后端已放宽到 1mb，正常帧远小于此）
  var MAX_BUFFER = 600;
  var ALIVE_MS = 30000;

  var Native = window.WebSocket;
  if (!Native || window.__XYZW_WS_TRACE__) return;
  window.__XYZW_WS_TRACE__ = VERSION;

  var queue = [];
  var stats = { captured: 0, sent: 0, dropped: 0, failed: 0 };

  function toBase64(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    var binary = "";
    var CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }

  function frameChars(rec) {
    return rec.b64 ? rec.b64.length : (rec.text || "").length || 32;
  }

  function push(rec) {
    if (queue.length >= MAX_BUFFER) {
      queue.shift();
      stats.dropped += 1;
    }
    queue.push(rec);
    stats.captured += 1;
  }

  function sanitizeUrl(url) {
    try {
      var u = new URL(String(url), location.href);
      return u.origin + u.pathname;
    } catch (e) {
      return "unknown";
    }
  }

  function record(dir, data, ws) {
    var base = { t: Date.now(), dir: dir, ws: ws };
    if (typeof data === "string") {
      base.kind = "text";
      base.text =
        data.length > MAX_FRAME_CHARS ? data.slice(0, MAX_FRAME_CHARS) : data;
      if (data.length > MAX_FRAME_CHARS) base.truncated = true;
      push(base);
      return;
    }
    if (data instanceof ArrayBuffer) {
      base.kind = "bin";
      base.b64 = clipBase64(toBase64(data));
      push(base);
      return;
    }
    if (data && data.buffer instanceof ArrayBuffer) {
      base.kind = "bin";
      base.b64 = clipBase64(
        toBase64(
          data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
        ),
      );
      push(base);
      return;
    }
    if (typeof Blob !== "undefined" && data instanceof Blob) {
      data
        .arrayBuffer()
        .then(function (buf) {
          base.kind = "bin";
          base.b64 = clipBase64(toBase64(buf));
          push(base);
        })
        .catch(function () {});
    }
  }

  /** 超大帧截断，避免单条日志超过后端 100kb 限制后永久卡住队列 */
  function clipBase64(b64) {
    return b64.length > MAX_FRAME_CHARS ? b64.slice(0, MAX_FRAME_CHARS) : b64;
  }

  function WrappedWebSocket(url, protocols) {
    var ws =
      protocols === undefined ? new Native(url) : new Native(url, protocols);
    var wsName = sanitizeUrl(url);

    try {
      ws.addEventListener("message", function (event) {
        record("in", event.data, wsName);
      });
    } catch (e) {
      // 忽略
    }

    var nativeSend = ws.send;
    if (typeof nativeSend === "function") {
      ws.send = function (data) {
        record("out", data, wsName);
        return nativeSend.apply(ws, arguments);
      };
    }

    return ws;
  }

  WrappedWebSocket.prototype = Native.prototype;
  ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function (key) {
    try {
      WrappedWebSocket[key] = Native[key];
    } catch (e) {}
  });
  window.WebSocket = WrappedWebSocket;

  /** 把帧打包成 /frontend-log 需要的 logs 数组 */
  function takeBatch() {
    var items = [];
    var chars = 0;
    while (queue.length && items.length < MAX_BATCH_ITEMS) {
      var rec = queue[0];
      var size = frameChars(rec);
      if (items.length && chars + size > MAX_BATCH_CHARS) break;
      queue.shift();
      chars += size;
      items.push({
        ts: new Date(rec.t).toISOString(),
        level: "debug",
        message:
          "ws:" + rec.dir + ":" + (rec.kind === "text" ? "text" : size) + "b",
        page: location.pathname,
        meta: rec,
      });
    }
    return items;
  }

  /** 单条小日志直发（用于自诊断，失败就放弃，不重试） */
  function postSingle(message, meta) {
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: [
            {
              ts: new Date().toISOString(),
              level: "info",
              message: message,
              page: location.pathname + location.search,
              meta: meta,
            },
          ],
        }),
      }).catch(function () {});
    } catch (e) {}
  }

  function flush(useBeacon) {
    if (!queue.length) return;
    var items = takeBatch();
    if (!items.length) return;
    var body = JSON.stringify({ logs: items });

    if (useBeacon && navigator.sendBeacon) {
      try {
        var ok = navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: "application/json" }),
        );
        if (ok) {
          stats.sent += items.length;
          return;
        }
      } catch (e) {}
    }

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        stats.sent += items.length;
      })
      .catch(function (err) {
        stats.failed += 1;
        if (items.length === 1) {
          // 单条还失败，说明这条数据本身有问题（通常是被代理/后端拒绝的超大包），
          // 直接丢弃并上报一次，避免它把整个队列永久堵死。
          stats.dropped += 1;
          postSingle("ws-trace-drop", {
            reason: String((err && err.message) || err),
            size: frameChars(items[0].meta),
            dir: items[0].meta.dir,
          });
          return;
        }
        queue = items
          .map(function (it) {
            return it.meta;
          })
          .concat(queue);
        if (queue.length > MAX_BUFFER) {
          queue = queue.slice(-MAX_BUFFER);
          stats.dropped += 1;
        }
      });
  }

  setInterval(function () {
    flush(false);
  }, FLUSH_MS);

  // 存活心跳：能区分「脚本没加载」和「录到了但发不出去」
  setInterval(function () {
    postSingle("ws-trace-alive", {
      v: VERSION,
      captured: stats.captured,
      sent: stats.sent,
      buffered: queue.length,
      failed: stats.failed,
      dropped: stats.dropped,
    });
  }, ALIVE_MS);

  window.addEventListener("pagehide", function () {
    flush(true);
  });
  window.addEventListener("beforeunload", function () {
    flush(true);
  });

  window.__XYZW_WS_TRACE_STATS__ = function () {
    return {
      version: VERSION,
      buffered: queue.length,
      captured: stats.captured,
      sent: stats.sent,
      failed: stats.failed,
      dropped: stats.dropped,
    };
  };

  console.info("[ws-trace] " + VERSION + " 已安装，报文会随前端埋点写入后端 logs/");

  // 安装即上报一次，便于确认这个 iframe 到底有没有加载到脚本
  postSingle("ws-trace-installed", { v: VERSION });
})();
