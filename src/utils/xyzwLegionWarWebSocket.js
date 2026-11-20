import { g_utils } from "./bonProtocol.js";
/**
 * XYZW WebSocket 客户端
 * 基于 readable-xyzw-ws.js 重构，适配本项目架构
 */
import { sleep } from "./helperTaskRunner.js";
import { gameLogger, wsLogger } from "./logger.js";

/** 为日志生成安全的 body 预览，避免控制台再次解析原始对象 */
const formatBodyForLog = (body) => {
  if (!body) return "";

  if (body instanceof Uint8Array) {
    return `[BON:${body.length}b]`;
  }

  if (Array.isArray(body)) {
    return `[Array:${body.length}]`;
  }

  if (typeof body === "object") {
    const isNumericObject = Object.keys(body).every(
      (key) => !Number.isNaN(Number.parseInt(key)),
    );
    if (isNumericObject) {
      return `[BON:Object:${Object.keys(body).length}]`;
    }
    try {
      return JSON.stringify(body);
    } catch {
      return "[Object]";
    }
  }

  return String(body);
};

/**
 * 命令注册器：保存每个 cmd 的默认体，发送时与 params 合并
 */
class CommandRegistry {
  constructor(encoder, enc, hint) {
    this.encoder = encoder;
    this.enc = enc;
    this.hint = hint;
    this.commands = new Map();
  }

  /** 注册命令 */
  register(cmd, defaultBody = {}) {
    this.commands.set(cmd, (ack = 0, seq = 0, params = {}) => ({
      cmd,
      ack,
      seq,
      hint: this.hint,
      time: Date.now(),
      body: this.encoder?.bon?.encode
        ? this.encoder.bon.encode({ ...defaultBody, ...params })
        : { ...defaultBody, ...params },
    }));
    return this;
  }

  /** 特例：系统心跳的 ack 用的是 "war_ping" */
  registerHeartbeat() {
    this.commands.set("heart_beat", (ack, seq) => ({
      cmd: "war_ping",
      ack,
      seq,
      hint: this.hint,
      time: Date.now(),
      body: { battlefieldId: this.hint },
    }));
    return this;
  }

  /** 生成最终可发送的二进制 */
  encodePacket(raw) {
    if (this.encoder?.encode && this.enc) {
      return this.encoder.encode(raw, this.enc);
    } else {
      return JSON.stringify(raw);
    }
  }

  /** 构造报文 */
  build(cmd, ack, seq, params) {
    const fn = this.commands.get(cmd);
    if (!fn) throw new Error(`Unknown cmd: ${cmd}`);
    return fn(ack, seq, params);
  }
}

/** 预注册游戏命令 */
function registerDefaultCommands(reg) {
  const registry = reg
    .registerHeartbeat()
    .register("war_getbattlefieldinfo")
    .register("war_enterbattlefield")
    .register("war_startbattle")
    .register("war_startattackbuilding")
    .register("war_startmarch")
    .register("war_setbattleteam")
    .register("war_suicide")
    .register("war_speedup")
    .register("war_getteaminfo");

  return registry;
}

/**
 * XYZW WebSocket 盐场客户端
 */
export class XyzwLegionWarWebSocketClient {
  constructor({ url, utils, hint, heartbeatMs = 5000 }) {
    this.url = url;
    this.utils = utils || g_utils;
    this.enc = this.utils?.getEnc ? this.utils.getEnc("auto") : undefined;

    this.socket = null;
    this.ack = 0;
    this.seq = 0;
    this.wireSeq = 0;
    this.hint = hint;
    this.sendQueue = [];
    this.sendQueueTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatStartTimer = null;
    this.reconnectTimer = null;
    this.reconnectResetTimer = null;
    this.dialogResetTimer = null;
    this.heartbeatInterval = heartbeatMs;

    this.dialogStatus = false;
    this.messageListener = null;
    this._pushWaiters = []; // 等待指定命令推送的私有等待队列（盐场阵容功能使用）
    this.showMsg = false;
    this.connected = false;
    this.isReconnecting = false; // 重连状态标志

    this.promises = Object.create(null);
    this.registry = registerDefaultCommands(
      new CommandRegistry(this.utils, this.enc, this.hint),
    );

    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
  }

  /** 初始化连接 */
  init() {
    wsLogger.info(`连接: ${this.url.split("?")[0]}`);

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.isReconnecting = false;
    }
    if (this.socket) this.disconnect();
    const socket = new WebSocket(this.url);
    this.socket = socket;
    this.wireSeq = 0;
    this.ack = 0;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      wsLogger.info("连接成功");
      this.connected = true;
      this._setupHeartbeat();
      this._processQueueLoop();
      if (this.onConnect) this.onConnect();
    };

    socket.onmessage = (evt) => {
      if (this.socket !== socket) return;
      try {
        let packet;
        if (typeof evt.data === "string") {
          packet = JSON.parse(evt.data);
        } else if (evt.data instanceof ArrayBuffer) {
          packet = this.utils?.parse
            ? this.utils.parse(evt.data, "auto", true)
            : evt.data;
        } else if (evt.data instanceof Blob) {
          evt.data
            .arrayBuffer()
            .then((buffer) => {
              if (this.socket !== socket) return;
              try {
                packet = this.utils?.parse
                  ? this.utils.parse(buffer, "auto", true)
                  : buffer;
                if (packet instanceof Object && packet.rawData !== undefined) {
                  gameLogger.verbose(
                    "ProtoMsg Blob消息，使用rawData:",
                    packet.rawData,
                  );
                } else if (packet.body && this.shouldDecodeBody(packet.body)) {
                  try {
                    if (this.utils && this.utils.bon && this.utils.bon.decode) {
                      const bodyBytes = this.convertToUint8Array(packet.body);
                      if (bodyBytes) {
                        const decodedBody = this.utils.bon.decode(bodyBytes);
                        gameLogger.debug(
                          "BON Blob解码成功:",
                          packet.cmd,
                          decodedBody,
                        );
                        packet.decodedBody = decodedBody;
                      }
                    } else {
                      gameLogger.warn("BON解码器不可用 (Blob)");
                    }
                  } catch (error) {
                    gameLogger.error(
                      "BON Blob消息体解码失败:",
                      error.message,
                      packet.cmd,
                    );
                  }
                }
                const actualPacket = packet._raw || packet;
                const incomingSeq =
                  typeof actualPacket?.seq === "number"
                    ? actualPacket.seq
                    : typeof packet?.seq === "number"
                      ? packet.seq
                      : undefined;
                if (typeof incomingSeq === "number" && incomingSeq >= 0) {
                  this.ack = incomingSeq;
                }

                this._notifyPushWaiters(packet);
                if (this.messageListener) {
                  this.messageListener(packet);
                }
                if (this.socket === socket) this._handlePromiseResponse(packet);
              } catch (error) {
                gameLogger.error("Blob解析失败:", error.message);
              }
            })
            .catch((error) => {
              if (this.socket === socket) {
                gameLogger.error("Blob读取失败:", error.message);
              }
            });
          return; // 异步处理，直接返回
        } else {
          gameLogger.warn("未知数据类型:", typeof evt.data, evt.data);
          packet = evt.data;
        }

        if (this.showMsg) {
          gameLogger.verbose("收到消息:", packet);
        }

        if (packet instanceof Object && packet.rawData !== undefined) {
          gameLogger.verbose("ProtoMsg消息，使用rawData:", packet.rawData);
        } else {
          const actualPacket = packet._raw || packet;
          const incomingSeq =
            typeof actualPacket.seq === "number"
              ? actualPacket.seq
              : typeof packet.seq === "number"
                ? packet.seq
                : undefined;
          if (typeof incomingSeq === "number" && incomingSeq >= 0) {
            this.ack = incomingSeq;
          }

          if (actualPacket.body && this.shouldDecodeBody(actualPacket.body)) {
            try {
              if (this.utils && this.utils.bon && this.utils.bon.decode) {
                const bodyBytes = this.convertToUint8Array(actualPacket.body);
                if (bodyBytes) {
                  const decodedBody = this.utils.bon.decode(bodyBytes);
                  gameLogger.debug(
                    "BON解码成功:",
                    actualPacket.cmd || packet.cmd,
                    decodedBody,
                  );
                  packet.decodedBody = decodedBody;
                  if (packet._raw) {
                    packet._raw.decodedBody = decodedBody;
                  }
                }
              } else {
                gameLogger.warn("BON解码器不可用");
              }
            } catch (error) {
              gameLogger.error(
                "BON消息体解码失败:",
                error.message,
                actualPacket.cmd || packet.cmd,
              );
            }
          }
        }

        this._notifyPushWaiters(packet);
        if (this.messageListener) {
          this.messageListener(packet);
        }
        if (this.socket === socket) this._handlePromiseResponse(packet);
      } catch (error) {
        gameLogger.error("消息处理失败:", error.message);
      }
    };

    socket.onclose = (evt) => {
      if (this.socket !== socket) return;
      this.socket = null;
      wsLogger.info(`WebSocket 连接关闭: ${evt.code} ${evt.reason || ""}`);
      wsLogger.debug("关闭详情:", {
        code: evt.code,
        reason: evt.reason || "未提供原因",
        wasClean: evt.wasClean,
        timestamp: new Date().toISOString(),
      });
      this.connected = false;
      this._clearTimers();
      if (this.onDisconnect) this.onDisconnect(evt);
    };

    socket.onerror = (error) => {
      if (this.socket !== socket) return;
      wsLogger.error("WebSocket 错误:", error);
      this.connected = false;
      this._clearTimers();
      if (this.onError) this.onError(error);
    };
  }

  /** 注册消息回调 */
  setMessageListener(fn) {
    this.messageListener = fn;
  }

  /** 控制台消息开关 */
  setShowMsg(val) {
    this.showMsg = !!val;
  }

  /** 判断是否需要解码body */
  shouldDecodeBody(body) {
    if (!body) return false;

    if (body instanceof Uint8Array || Array.isArray(body)) {
      return true;
    }

    if (typeof body === "object" && body.constructor === Object) {
      const keys = Object.keys(body);
      return (
        keys.length > 0 &&
        keys.every((key) => !Number.isNaN(+Number.parseInt(key)))
      );
    }

    return false;
  }

  /** 转换body为Uint8Array */
  convertToUint8Array(body) {
    if (!body) return null;

    if (body instanceof Uint8Array) {
      return body;
    }

    if (Array.isArray(body)) {
      return new Uint8Array(body);
    }

    if (typeof body === "object" && body.constructor === Object) {
      const keys = Object.keys(body)
        .map((k) => Number.parseInt(k))
        .sort((a, b) => a - b);
      if (keys.length > 0) {
        const maxIndex = Math.max(...keys);
        const arr = Array.from({ length: maxIndex + 1 }, () => 0);
        for (const [key, value] of Object.entries(body)) {
          const index = Number.parseInt(key);
          if (!Number.isNaN(+index) && typeof value === "number") {
            arr[index] = value;
          }
        }
        gameLogger.debug("转换对象格式body为Uint8Array:", arr.length, "bytes");
        return new Uint8Array(arr);
      }
    }

    return null;
  }

  /** 尝试为日志解码BON体，成功返回对象 */
  decodeBodyForLog(body) {
    if (!body) return null;
    const decoder = this.utils?.bon?.decode;
    if (typeof decoder !== "function") return null;

    let bytes = null;
    if (body instanceof Uint8Array) {
      bytes = body;
    } else if (Array.isArray(body)) {
      bytes = new Uint8Array(body);
    } else if (this.shouldDecodeBody(body)) {
      bytes = this.convertToUint8Array(body);
    }

    if (!bytes) return null;

    try {
      return decoder(bytes);
    } catch (error) {
      gameLogger.warn("日志解析BON失败:", error.message);
      return null;
    }
  }

  /** 重连（防重复连接版本） */
  reconnect() {
    if (this.isReconnecting) {
      wsLogger.debug("重连已在进行中，跳过此次重连请求");
      return;
    }

    wsLogger.info("开始WebSocket重连...");

    this.disconnect();
    this.isReconnecting = true;

    const reconnectTimer = setTimeout(() => {
      if (this.reconnectTimer !== reconnectTimer) return;
      this.reconnectTimer = null;
      try {
        this.init();
      } finally {
        const resetTimer = setTimeout(() => {
          if (this.reconnectResetTimer !== resetTimer) return;
          this.reconnectResetTimer = null;
          this.isReconnecting = false;
        }, 2000); // 2秒后允许下次重连
        this.reconnectResetTimer = resetTimer;
      }
    }, 1000);
    this.reconnectTimer = reconnectTimer;
  }

  /** 断开连接 */
  disconnect() {
    const socket = this.socket;
    this.socket = null;
    this.connected = false;
    this._clearTimers();
    socket?.close();
  }

  /**
   * 等待下一条指定命令的推送。
   * 战场服务器的部分响应（如 war_getteaminforesp）以推送形式到达且不回显请求 seq，
   * 无法用 sendWithPromise 匹配，需按命令名捕获下一条推送。
   * @param {string} cmd 响应命令名（如 "war_getteaminforesp"）
   * @param {number} timeoutMs 超时毫秒
   * @returns {Promise<object>} 推送负载（rawData / decodedBody / body）
   */
  waitForPush(cmd, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const waiter = {
        cmd,
        resolve: null,
        timer: null,
      };
      waiter.resolve = (payload) => {
        clearTimeout(waiter.timer);
        resolve(payload);
      };
      waiter.timer = setTimeout(() => {
        this._pushWaiters = this._pushWaiters.filter((w) => w !== waiter);
        reject(new Error(`推送超时: ${cmd} (${timeoutMs}ms)`));
      }, timeoutMs);
      this._pushWaiters.push(waiter);
    });
  }

  /** 将解析后的包分发给按命令名等待的私有等待者 */
  _notifyPushWaiters(packet) {
    const cmd = packet?.cmd;
    if (!cmd || !this._pushWaiters?.length) return;
    const hit = this._pushWaiters.find((w) => w.cmd === cmd);
    if (!hit) return;
    this._pushWaiters = this._pushWaiters.filter((w) => w !== hit);
    const body =
      packet.rawData !== undefined
        ? packet.rawData
        : packet.decodedBody !== undefined
          ? packet.decodedBody
          : packet.body;
    hit.resolve(body ?? packet);
  }

  /** 发送消息 */
  send(cmd, params = {}, options = {}) {
    if (!this.connected) {
      wsLogger.warn(`WebSocket 未连接，消息已入队: ${cmd}`);
      if (!this.dialogStatus && !this.isReconnecting) {
        this.dialogStatus = true;
        wsLogger.info("自动触发重连...");
        this.reconnect();
        const dialogTimer = setTimeout(() => {
          if (this.dialogResetTimer !== dialogTimer) return;
          this.dialogResetTimer = null;
          this.dialogStatus = false;
        }, 2000);
        this.dialogResetTimer = dialogTimer;
      }
    }

    const assignedSeq = options.request
      ? options.request.seq
      : cmd === "heart_beat"
        ? 0
        : ++this.seq;
    const task = {
      cmd,
      params,
      seq: assignedSeq,
      hint: this.hint,
      respKey: options.respKey || cmd,
      sleep: options.sleep || 0,
      onSent: options.onSent,
      request: options.request,
    };
    this.sendQueue.push(task);
    return task;
  }

  /**
   * Queue a command and wait for its sequence or legacy command response.
   * @param {string} cmd Registered protocol command.
   * @param {object} params Command body.
   * @param {number} timeoutMs Timeout measured from queue admission, in milliseconds.
   * @returns {Promise<unknown>} Response body; rejects on a server error or timeout.
   */
  sendWithPromise(cmd, params = {}, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.connected || this.socket?.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket 连接已关闭"));
      }
      const requestSeq = ++this.seq;
      const request = { resolve, reject, originalCmd: cmd, seq: requestSeq };
      this.promises[requestSeq] = request;

      const timer = setTimeout(() => {
        this._rejectRequest(
          request.seq,
          new Error(`请求超时: ${cmd} (${timeoutMs}ms)`),
        );
      }, timeoutMs);
      request.timer = timer;

      try {
        this.send(cmd, params, { request });
      } catch (error) {
        this._rejectRequest(requestSeq, error);
      }
    });
  }

  /** 发送心跳 */
  sendHeartbeat() {
    wsLogger.verbose("发送心跳消息");
    this.send("heart_beat", {}, { respKey: "war_ping" });
  }

  /** =============== 内部方法 =============== */

  /** 设置心跳 */
  _setupHeartbeat() {
    const socket = this.socket;
    const heartbeatTimer = setTimeout(() => {
      if (this.heartbeatStartTimer !== heartbeatTimer) return;
      this.heartbeatStartTimer = null;
      if (
        this.socket === socket &&
        this.connected &&
        socket?.readyState === WebSocket.OPEN
      ) {
        wsLogger.debug("开始发送首次心跳");
        this.sendHeartbeat();
      }
    }, 3000);
    this.heartbeatStartTimer = heartbeatTimer;

    this.heartbeatTimer = setInterval(() => {
      if (
        this.socket === socket &&
        this.connected &&
        socket?.readyState === WebSocket.OPEN
      ) {
        this.sendHeartbeat();
      } else {
        wsLogger.warn("心跳检查失败: 连接状态异常");
      }
    }, this.heartbeatInterval);
  }

  /** 队列处理循环 */
  _processQueueLoop() {
    if (this.sendQueueTimer) clearInterval(this.sendQueueTimer);

    const socket = this.socket;
    this.sendQueueTimer = setInterval(async () => {
      if (!this.sendQueue.length) return;
      if (
        this.socket !== socket ||
        !this.connected ||
        socket?.readyState !== WebSocket.OPEN
      )
        return;

      const task = this.sendQueue.shift();
      if (!task) return;
      const request = task.request;
      if (request && this.promises[request.seq] !== request) return;
      const wireSeq =
        task.cmd === "heart_beat" && !request ? 0 : this.wireSeq + 1;

      try {
        const raw = this.registry.build(
          task.cmd,
          this.ack,
          wireSeq,
          task.params,
        );
        if (raw && raw.cmd !== "war_ping") {
          const decodedBody = this.decodeBodyForLog(raw.body);
          wsLogger.info("📤 发送报文", {
            cmd: raw.cmd,
            hint: raw.hint ?? 0,
            ack: raw.ack ?? 0,
            seq: raw.seq ?? 0,
            time: raw.time,
            body: decodedBody ?? formatBodyForLog(raw.body),
          });
        }

        const bin = this.registry.encodePacket(raw);
        if (
          this.socket !== socket ||
          !this.connected ||
          socket.readyState !== WebSocket.OPEN
        ) {
          throw new Error("WebSocket 连接已关闭");
        }
        if (request) {
          delete this.promises[request.seq];
          request.seq = wireSeq;
          this.promises[wireSeq] = request;
        }
        socket.send(bin);
        if (wireSeq !== 0) this.wireSeq = wireSeq;
        if (this.showMsg || task.cmd === "heart_beat") {
          wsLogger.wsMessage("local", task.cmd, false);
          if (this.showMsg) {
            wsLogger.verbose("原始数据:", raw);
            wsLogger.verbose("编码后数据:", bin);
            wsLogger.verbose(
              "编码类型:",
              typeof bin,
              bin instanceof Uint8Array ? "Uint8Array (加密)" : "String (明文)",
            );
            if (bin instanceof Uint8Array && bin.length > 0) {
              wsLogger.verbose(
                `加密验证: 前8字节 [${Array.from(bin.slice(0, 8)).join(", ")}]`,
              );
            }
          }
        }

        if (task.onSent) {
          try {
            const meta = {
              respKey: task.respKey,
              cmd: task.cmd,
              seq: raw?.seq ?? task.seq,
              ack: raw?.ack ?? this.ack,
              time: raw?.time ?? Date.now(),
            };
            task.onSent(meta);
          } catch (error) {
            wsLogger.warn("发送回调执行失败:", error);
          }
        }

        if (task.sleep) await sleep(task.sleep);
      } catch (error) {
        if (request) this._rejectRequest(request.seq, error);
        wsLogger.error(`发送消息失败: ${task.cmd}`, error);
      }
    }, 50);
  }

  /** 处理 Promise 响应 */
  _handlePromiseResponse(packet) {
    const responseId = packet.resp;
    const hasSequence =
      typeof responseId === "number" ||
      (typeof responseId === "string" && /^\d+$/.test(responseId));
    if (hasSequence && !this.promises[responseId]) return;

    if (packet.resp !== undefined && this.promises[packet.resp]) {
      const promiseData = this.promises[packet.resp];
      clearTimeout(promiseData.timer);
      delete this.promises[packet.resp];

      const responseBody =
        packet.rawData !== undefined
          ? packet.rawData
          : packet.decodedBody !== undefined
            ? packet.decodedBody
            : packet.body;

      if (packet.code === 0 || packet.code === undefined) {
        promiseData.resolve(responseBody || packet);
      } else {
        promiseData.reject(
          new Error(
            `服务器错误: ${packet.code} - ${packet.hint || "未知错误"}`,
          ),
        );
      }
      return;
    }

    const cmd =
      packet.cmd || (typeof responseId === "string" ? responseId : undefined);
    if (!cmd) return;
    const respCmdKey =
      typeof cmd === "string" ? cmd.toLowerCase() : String(cmd);
    const strippedCmdKey = respCmdKey.endsWith("resp")
      ? respCmdKey.slice(0, -4)
      : respCmdKey;

    for (const [requestId, promiseData] of Object.entries(this.promises)) {
      const origCmd = promiseData.originalCmd?.toLowerCase();
      if (
        origCmd === respCmdKey ||
        origCmd === strippedCmdKey ||
        `${origCmd}resp` === respCmdKey
      ) {
        clearTimeout(promiseData.timer);
        delete this.promises[requestId];

        const responseBody =
          packet.rawData !== undefined
            ? packet.rawData
            : packet.decodedBody !== undefined
              ? packet.decodedBody
              : packet.body;

        if (packet.code === 0 || packet.code === undefined) {
          promiseData.resolve(responseBody || packet);
        } else {
          promiseData.reject(
            new Error(
              `服务器错误: ${packet.code} - ${packet.hint || "未知错误"}`,
            ),
          );
        }
        break;
      }
    }
  }

  /**
   * Cancel an outstanding request and remove its unsent queue entry.
   * @param {number} requestSeq Current request key, remapped to the wire sequence on send.
   * @param {Error} error Failure delivered to the caller; sent packets cannot be recalled.
   */
  _rejectRequest(requestSeq, error) {
    const request = this.promises[requestSeq];
    if (!request) return;
    clearTimeout(request.timer);
    delete this.promises[requestSeq];
    this.sendQueue = this.sendQueue.filter((task) => task.seq !== requestSeq);
    request.reject(error);
  }

  /** Cancel the connection's requests, unsent commands and scheduled callbacks. */
  _clearTimers() {
    this.sendQueue.length = 0;
    for (const field of [
      "heartbeatStartTimer",
      "reconnectTimer",
      "reconnectResetTimer",
      "dialogResetTimer",
    ]) {
      clearTimeout(this[field]);
      this[field] = null;
    }
    this.isReconnecting = false;
    this.dialogStatus = false;
    for (const [id, request] of Object.entries(this.promises)) {
      clearTimeout(request.timer);
      delete this.promises[id];
      request.reject(new Error("WebSocket 连接已关闭"));
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.sendQueueTimer) {
      clearInterval(this.sendQueueTimer);
      this.sendQueueTimer = null;
    }
  }
}

/** 默认导出 */
export default XyzwLegionWarWebSocketClient;
