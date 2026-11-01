/**
 * 蟠桃战场服实时连接客户端
 *
 * 协议（逆向自客户端 LegionPayloadNetworkData / PayloadService）：
 * 1. 主服 `legion_getpayloadbf` → { info: { domainName, sid, bfId, phase, ... }, ended, roleBfState }
 * 2. 战场 URL = `${domainName}?<主服 wsUrl 的查询串>&sid2=<sid>`
 * 3. 进场：`payload_enterbf { bfId }`（仅活动时间内成功，否则 12100036）
 * 4. 心跳：`payload_ping { bfId }`（业务心跳，与协议层 heart_beat 并行）
 * 5. 实时命令（均带 bfId，方法名小写化）：payload_startmarch / payload_useskill /
 *    payload_useitem / payload_setbattleteam / payload_startchangepath /
 *    payload_startpickitem / payload_updateflag / payload_getteaminfo
 * 错误码：[-1] 命令不存在；[12100036] 战场未开放/已结束
 */
import { XyzwWebSocketClient } from "@/utils/xyzwWebSocket";

const PING_INTERVAL_MS = 30_000;

export class PayloadBattleClient {
  /**
   * @param {object} opts
   * @param {string} opts.mainWsUrl 主服完整 wsUrl（含 p= 查询串，会话一致性关键）
   * @param {object} opts.bfInfo legion_getpayloadbf 的 info 字段（domainName/sid/bfId）
   * @param {(level: string, msg: string) => void} [opts.onLog]
   * @param {(msg: object) => void} [opts.onMessage] 战场服推送回调
   * @param {() => void} [opts.onDisconnect] 非人为断线回调（用于自动重连）
   */
  constructor({ mainWsUrl, bfInfo, onLog, onMessage, onDisconnect }) {
    this.mainWsUrl = mainWsUrl;
    this.bfInfo = bfInfo;
    this.onLog = onLog || (() => {});
    this.onMessage = onMessage || (() => {});
    this.onDisconnectCb = onDisconnect || null;
    this.client = null;
    this.pingTimer = null;
    this.closed = false;
  }

  /** 战场 URL = 战场域名 + 主服 wsUrl 的查询串 + &sid2= */
  static buildUrl(mainWsUrl, bfInfo) {
    const query = mainWsUrl.split("?")[1] || "";
    return `${bfInfo.domainName}?${query}&sid2=${encodeURIComponent(bfInfo.sid)}`;
  }

  _log(msg, level = "info") {
    this.onLog(level, msg);
  }

  /** 连接战场服并进场。成功返回 enter 响应；战场未开放抛出 12100036 错误 */
  async connect() {
    if (!this.bfInfo?.domainName || !this.bfInfo?.sid) {
      throw new Error("缺少 domainName/sid，请先查询战场信息");
    }
    const url = PayloadBattleClient.buildUrl(this.mainWsUrl, this.bfInfo);
    this._log(`连接战场服: ${this.bfInfo.domainName.split("//")[1]}`);

    this.client = new XyzwWebSocketClient({ url, heartbeatMs: 5000 });
    this.client.setMessageListener((msg) => this.onMessage(msg));
    // 非人为断线 → 通知 runner 自动重连
    this.client.onDisconnect = () => {
      if (this.closed) return;
      this._log("战场连接断开", "warning");
      this._stopPing();
      this.onDisconnectCb?.();
    };

    const connected = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 12000);
      this.client.onConnect = () => {
        clearTimeout(timer);
        resolve(true);
      };
      this.client.onError = () => {
        clearTimeout(timer);
        resolve(false);
      };
      this.client.onDisconnect = () => {
        clearTimeout(timer);
        resolve(false);
      };
      this.client.init();
    });

    if (!connected) {
      throw new Error("战场服连接失败");
    }
    this._log("战场服已连接");

    // 进场
    const enterRes = await this.client.sendWithPromise(
      "payload_enterbf",
      { bfId: this.bfInfo.bfId },
      10000,
    );
    this._log(`payload_enterbf 成功：${JSON.stringify(enterRes ?? {}).slice(0, 200)}`);

    // 业务心跳
    this.pingTimer = setInterval(() => {
      if (this.closed) return;
      this.sendAction("ping");
    }, PING_INTERVAL_MS);

    return enterRes;
  }

  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /** 实时命令透传，自动带 bfId；action 不含前缀时自动补 payload_（方法名小写化） */
  sendAction(action, params = {}) {
    if (!this.client || this.closed) return;
    const cmd = action.startsWith("payload_") ? action : `payload_${action.toLowerCase()}`;
    try {
      this.client.send(cmd, { bfId: this.bfInfo.bfId, ...params });
    } catch (e) {
      this._log(`发送 ${cmd} 失败: ${e.message}`, "warning");
    }
  }

  close() {
    this.closed = true;
    this._stopPing();
    if (this.client) {
      try {
        this.client.disconnect();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
    this._log("战场连接已关闭");
  }
}