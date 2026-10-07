import WebSocket from "ws";
import { bon, encode, getEnc, parse } from "./bonProtocol.js";

/**
 * XYZW 游戏客户端 - Node.js 简化版
 * 基于 xyzwWebSocket.js 改造，适配 ws + ES Module
 */

// 错误码映射
const errorCodeMap = {
  700010: "任务未达成完成条件",
  1400010: "没有购买月卡",
  12000116: "今日已领取免费奖励",
  3300060: "扫荡条件不满足",
  200400: "操作太快",
  2300190: "今天已签到",
  1000020: "今天已领取",
  700020: "已领取过",
  400010: "物品不足",
  1500020: "能量不足",
  3500020: "没有可领取的奖励",
  200160: "模块未开启",
  200020: "出了点小问题",
};

// 预注册命令模板
const CMD_DEFAULTS = {
  role_getroleinfo: {
    clientVersion: "2.21.2-fa918e1997301834-wx",
    inviteUid: 0,
    platform: "hortor",
    platformExt: "mix",
    scene: "",
  },
  system_claimhangupreward: {},
  system_signinreward: {},
  task_claimdailyreward: { rewardId: 0 },
  task_claimdailypoint: { taskId: 1 },
  system_getdatabundlever: { isAudit: false },
  system_buygold: { buyNum: 1 },
  system_custom: { key: "", value: 0 },
  tower_getinfo: {},
  tower_claimreward: {},
  evotower_getinfo: {},
  evotower_fight: {},
  evotower_claimreward: {},
  arena_startarea: {},
  arena_getareatarget: { refresh: false },
  arena_getarearank: {},
  item_openbox: { itemId: 2001, number: 10 },
  bottlehelper_start: { bottleType: -1 },
  bottlehelper_claim: {},
  legacy_getinfo: {},
  legacy_claimhangup: {},
  hero_recruit: { byClub: false, recruitNumber: 1, recruitType: 3 },
  study_startgame: {},
  fight_startlevel: {},
  fight_starttower: {},
  fight_startboss: {},
  fight_startpvp: {},
  fight_startdungeon: {},
  matchteam_getroleteaminfo: {},
  bosstower_getinfo: {},
  bosstower_startboss: {},
  bosstower_startbox: {},
  legion_getinfo: {},
  legion_signin: {},
  mail_getlist: { category: [0, 4, 5], lastId: 0, size: 60 },
  mail_claimallattachment: { category: 0 },
  presetteam_getinfo: {},
  artifact_lottery: { lotteryNumber: 1, newFree: true, type: 1 },
  genie_sweep: { genieId: 1 },
  mergebox_getinfo: {},
  mergebox_claimfreeenergy: {},
  mergebox_openbox: {},
  discount_claimreward: { discountId: 1 },
  collection_claimfreereward: {},
};

// 响应→请求命令映射
const RESP_MAP = {
  role_getroleinforesp: "role_getroleinfo",
  system_claimhanguprewardresp: "system_claimhangupreward",
  system_signinrewardresp: "system_signinreward",
  system_getdatabundleverresp: "system_getdatabundlever",
  task_claimdailyrewardresp: "task_claimdailyreward",
  tower_getinforesp: "tower_getinfo",
  tower_claimrewardresp: "tower_claimreward",
  evotowerinforesp: "evotower_getinfo",
  evotower_fightresp: "evotower_fight",
  evotower_claimrewardresp: "evotower_claimreward",
  arena_startarearesp: "arena_startarea",
  arena_getareatargetresp: "arena_getareatarget",
  arena_getarearankresp: "arena_getarearank",
  item_openboxresp: "item_openbox",
  bottlehelper_claimresp: "bottlehelper_claim",
  bottlehelper_startresp: "bottlehelper_start",
  legacy_getinforesp: "legacy_getinfo",
  legacy_claimhangupresp: "legacy_claimhangup",
  hero_recruitresp: "hero_recruit",
  studyresp: "study_startgame",
  fight_startlevelresp: "fight_startlevel",
  fight_starttowerresp: "fight_starttower",
  fight_startbossresp: "fight_startboss",
  fight_startpvpresp: "fight_startpvp",
  matchteam_getroleteaminforesp: "matchteam_getroleteaminfo",
  bosstower_getinforesp: "bosstower_getinfo",
  bosstower_startbossresp: "bosstower_startboss",
  bosstower_startboxresp: "bosstower_startbox",
  legion_getinforesp: "legion_getinfo",
  legion_signinresp: "legion_signin",
  mail_claimallattachmentresp: "mail_claimallattachment",
  presetteam_getinforesp: "presetteam_getinfo",
  artifact_lotteryresp: "artifact_lottery",
  genie_sweepresp: "genie_sweep",
  mergeboxinforesp: "mergebox_getinfo",
  mergebox_claimfreeenergyresp: "mergebox_claimfreeenergy",
  mergebox_openboxresp: "mergebox_openbox",
  discount_claimrewardresp: "discount_claimreward",
  collection_claimfreerewardresp: "collection_claimfreereward",
  syncrewardresp: [
    "system_buygold",
    "system_signinreward",
    "discount_claimreward",
  ],
  syncpushresp: ["system_mysharecallback"],
};

class GameClient {
  constructor(tokenData, wsUrl) {
    this.token = tokenData;
    this._wsUrl =
      wsUrl ||
      `wss://xxz-xyzw.hortorgames.com/agent?p=${encodeURIComponent(
        JSON.stringify({
          roleToken: tokenData.roleToken,
          roleId: tokenData.roleId,
          sessId: tokenData.sessId,
          connId: tokenData.connId,
          isRestore: tokenData.isRestore,
        }),
      )}&e=x&lang=chinese`;

    this.ws = null;
    this.connected = false;
    this.ack = 0;
    this.seq = 0;
    this.promises = {};
    this.connectionTimer = null;
    this.connectionReject = null;
    this.heartbeatStartTimer = null;
    this.heartbeatTimer = null;
    this.lastMsgAt = Date.now();
    this._log = (...args) =>
      console.log(
        `[${tokenData.name || "?"}]`,
        new Date().toISOString().slice(11, 19),
        ...args,
      );
  }

  log(...args) {
    this._log(...args);
  }

  connect(timeoutMs = 15000) {
    this.disconnect();
    return new Promise((resolve, reject) => {
      this.log("连接中:", this._wsUrl.split("?")[0]);

      let socket;
      try {
        socket = new WebSocket(this._wsUrl);
      } catch (err) {
        reject(err);
        return;
      }
      this.ws = socket;
      // Each new transport starts a fresh server-side sequence space.
      this.seq = 0;
      this.ack = 0;
      socket.binaryType = "arraybuffer";

      let timer;
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this.connectionReject === finish) {
          this.connectionReject = null;
          this.connectionTimer = null;
        }
        if (error) reject(error);
        else resolve();
      };
      this.connectionReject = finish;
      if (timeoutMs) {
        timer = setTimeout(() => {
          if (this.ws !== socket || this.connectionTimer !== timer) return;
          finish(new Error("连接超时"));
          this.disconnect();
        }, timeoutMs);
        this.connectionTimer = timer;
      }

      socket.on("open", () => {
        if (this.ws !== socket) return;
        this.connected = true;
        this.log("连接成功");
        finish();
        this._startHeartbeat();
      });

      socket.on("message", (data) => {
        if (this.ws !== socket) return;
        this._handleMessage(data);
      });

      socket.on("close", (code, reason) => {
        finish(new Error("连接在建立前已关闭"));
        if (this.ws !== socket) return;
        this.ws = null;
        this.connected = false;
        this._stopHeartbeat();
        this.log("连接关闭:", code, reason.toString());
        this._rejectPendingRequests();
      });

      socket.on("error", (err) => {
        if (this.ws !== socket) return;
        this.log("错误:", err.message);
        if (!this.connected) finish(err);
      });
    });
  }

  disconnect() {
    const socket = this.ws;
    this.ws = null;
    this.connected = false;
    this._stopHeartbeat();
    clearTimeout(this.connectionTimer);
    this.connectionTimer = null;
    const rejectConnection = this.connectionReject;
    this.connectionReject = null;
    rejectConnection?.(new Error("连接已关闭"));
    this._rejectPendingRequests();
    socket?.close();
  }

  /** Reject the previous transport's requests before its sequence space is reset. */
  _rejectPendingRequests() {
    for (const [id, request] of Object.entries(this.promises)) {
      clearTimeout(request.timer);
      delete this.promises[id];
      request.reject(new Error("连接已关闭"));
    }
  }

  send(cmd, params = {}) {
    if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) {
      this.log("未连接，无法发送:", cmd);
      return;
    }
    const assignedSeq = cmd === "heart_beat" ? 0 : this.seq + 1;
    const defaultBody = CMD_DEFAULTS[cmd] || {};
    const mergedParams = { ...defaultBody, ...params };
    const rawMsg = {
      cmd,
      ack: this.ack,
      seq: assignedSeq,
      time: Date.now(),
      body: bon.encode(mergedParams),
    };
    const encoded = encode(rawMsg, getEnc("x"));
    this.ws.send(encoded);
    // Unsent commands must not create sequence gaps rejected by the server.
    if (cmd !== "heart_beat") this.seq = assignedSeq;
    this.log("发送:", cmd, "seq:", assignedSeq);
    return assignedSeq;
  }

  /**
   * Send a command and wait for its response, releasing pending state on failure.
   * @param {string} cmd Protocol command name.
   * @param {object} params Command parameters merged with protocol defaults.
   * @param {number} timeoutMs Maximum response wait in milliseconds.
   * @returns {Promise<object>} Decoded server response.
   */
  sendWithPromise(cmd, params = {}, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) {
        return reject(new Error("未连接"));
      }
      const requestSeq = this.seq + 1;
      const timer = setTimeout(() => {
        delete this.promises[requestSeq];
        reject(new Error(`请求超时: ${cmd} (${timeoutMs}ms)`));
      }, timeoutMs);
      this.promises[requestSeq] = { resolve, reject, originalCmd: cmd, timer };
      try {
        const defaultBody = CMD_DEFAULTS[cmd] || {};
        const mergedParams = { ...defaultBody, ...params };
        const rawMsg = {
          cmd,
          ack: this.ack,
          seq: requestSeq,
          time: Date.now(),
          body: bon.encode(mergedParams),
        };
        const encoded = encode(rawMsg, getEnc("x"));
        this.ws.send(encoded);
        this.seq = requestSeq;
        this.log("发送并等待:", cmd, "seq:", requestSeq);
      } catch (error) {
        clearTimeout(timer);
        delete this.promises[requestSeq];
        reject(error);
      }
    });
  }

  async executeBatch(commands, delayMs = 500) {
    const results = [];
    for (const { cmd, params, timeout } of commands) {
      try {
        const r = await this.sendWithPromise(cmd, params, timeout || 8000);
        results.push({ cmd, success: true, data: r });
        this.log("成功:", cmd);
      } catch (err) {
        results.push({ cmd, success: false, error: err.message });
        this.log("失败:", cmd, err.message);
      }
      if (delayMs > 0) await sleep(delayMs);
    }
    return results;
  }

  // ===== 便捷任务封装 =====
  async signIn() {
    return this.sendWithPromise("system_signinreward");
  }
  async claimHangUp() {
    return this.sendWithPromise("system_claimhangupreward");
  }
  async getRoleInfo() {
    return this.sendWithPromise("role_getroleinfo");
  }
  async getTowerInfo() {
    return this.sendWithPromise("tower_getinfo");
  }
  async claimTowerReward() {
    return this.sendWithPromise("tower_claimreward");
  }
  async sendAndWait(cmd, params = {}) {
    return this.sendWithPromise(cmd, params);
  }

  _handleMessage(data) {
    this.lastMsgAt = Date.now();
    let protoMsg;
    try {
      protoMsg = parse(data, getEnc("auto"));
    } catch (err) {
      this.log("解析消息失败:", err.message);
      return;
    }

    const msg = protoMsg._raw;
    if (!msg) return;
    if (typeof msg.seq === "number" && msg.seq >= 0) this.ack = msg.seq;

    const respKey = msg.resp !== undefined ? msg.resp : msg.cmd;
    const respCmdKey = respKey?.toLowerCase?.() || respKey;

    if (msg.resp !== undefined && this.promises[msg.resp]) {
      const p = this.promises[msg.resp];
      clearTimeout(p.timer);
      delete this.promises[msg.resp];
      if (msg.code === 0 || msg.code === undefined) {
        p.resolve(protoMsg.rawData || msg);
      } else {
        p.reject(
          new Error(
            `[${msg.code}] ${errorCodeMap[msg.code] || msg.hint || "未知错误"}`,
          ),
        );
      }
      return;
    }

    let requestCmd = RESP_MAP[respCmdKey];
    if (!requestCmd) return;
    if (typeof requestCmd === "string") requestCmd = [requestCmd];

    for (const [id, p] of Object.entries(this.promises)) {
      if (requestCmd.includes(p.originalCmd)) {
        clearTimeout(p.timer);
        delete this.promises[id];
        if (msg.code === 0 || msg.code === undefined) {
          p.resolve(protoMsg.rawData || msg);
        } else {
          p.reject(
            new Error(
              `[${msg.code}] ${errorCodeMap[msg.code] || msg.hint || "未知错误"}`,
            ),
          );
        }
        break;
      }
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    const socket = this.ws;
    const startTimer = setTimeout(() => {
      if (this.heartbeatStartTimer !== startTimer) return;
      this.heartbeatStartTimer = null;
      if (this.ws === socket && this.connected) this._sendHeartbeat();
    }, 3000);
    this.heartbeatStartTimer = startTimer;
    const heartbeatTimer = setInterval(() => {
      if (
        this.heartbeatTimer === heartbeatTimer &&
        this.ws === socket &&
        this.connected
      ) {
        this._sendHeartbeat();
      }
    }, 5000);
    this.heartbeatTimer = heartbeatTimer;
  }

  _stopHeartbeat() {
    clearTimeout(this.heartbeatStartTimer);
    this.heartbeatStartTimer = null;
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _sendHeartbeat() {
    if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) return;
    try {
      const rawMsg = {
        cmd: "_sys/ack",
        ack: this.ack,
        seq: 0,
        time: Date.now(),
        body: undefined,
      };
      const encoded = encode(rawMsg, getEnc("x"));
      this.ws.send(encoded);
    } catch (e) {
      /* ignore */
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export { GameClient };
