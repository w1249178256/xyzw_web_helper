/**
 * 蟠桃战场自动参战流程（挂在"打开游戏"入口）
 *
 * 流程：主服临时连接 → legion_getpayloadbf →
 *   - 战场未开放/已结束 → 断开临时连接，跳过（不打扰进游戏）
 *   - 战场开放 → 连战场服（sid2）→ payload_enterbf → 断开主服临时连接 → 保持战场长连
 *
 * 链接保持：战场连接断开时自动重连（刷新 sid → 重连 → 重新 enterbf），
 * 退避 10s/20s/40s/60s，最多 5 次；战场未开放（12100036）则停止重连。
 *
 * 战场连接独立于主服会话（sid2 鉴权），不影响 iframe 游戏的正常登录与游玩。
 */
import { PayloadBattleClient } from "./payloadBattleClient";

const MAX_RECONNECT = 5;
const RECONNECT_BASE_MS = 10_000;

let activeClient = null;
let running = false;
let reconnectAttempts = 0;
let reconnectTimer = null;

/** 是否为"战场未开放/已结束"类错误（此类错误不重连） */
function isNotOpenError(err) {
  return /12100036/.test(String(err?.message || ""));
}

/**
 * @param {object} tokenStore token store 实例
 * @param {string} tokenId 账号 id
 * @param {(level: string, msg: string) => void} [log]
 * @returns {Promise<{status: string, detail?: string}>}
 */
export async function startPayloadBattleFlow(tokenStore, tokenId, log = () => {}) {
  if (running) return { status: "busy" };
  if (activeClient) return { status: "already" };
  running = true;
  let tempMain = false;
  try {
    const tokens = tokenStore.gameTokens || [];
    const token = tokens.find((t) => t.id === tokenId);
    if (!token?.token) return { status: "no-token" };

    // 1) 主服临时连接（拿 bfInfo 用）
    if (tokenStore.getWebSocketStatus(tokenId) !== "connected") {
      tokenStore.createWebSocketConnection(tokenId, token.token, token.wsUrl);
      tempMain = true;
      const start = Date.now();
      while (
        tokenStore.getWebSocketStatus(tokenId) !== "connected" &&
        Date.now() - start < 12000
      ) {
        await new Promise((r) => setTimeout(r, 400));
      }
      if (tokenStore.getWebSocketStatus(tokenId) !== "connected") {
        tokenStore.closeWebSocketConnection(tokenId);
        return { status: "main-connect-failed" };
      }
    }

    // 2) 查询战场信息
    const bfResp = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getpayloadbf",
      {},
      10000,
    );
    const info = bfResp?.info || {};

    // 3) 未开放/已结束 → 收尾跳过
    if (!info.domainName || !info.sid || bfResp?.ended) {
      if (tempMain) tokenStore.closeWebSocketConnection(tokenId);
      log(
        "info",
        bfResp?.ended
          ? "本场蟠桃战场已结束，跳过实时参战"
          : "蟠桃战场尚未开放，跳过实时参战",
      );
      return { status: bfResp?.ended ? "ended" : "not-open" };
    }

    // 4) 战场连接（复用主服 wsUrl 查询串 + sid2）
    const conns = tokenStore.wsConnections?.value || tokenStore.wsConnections || {};
    const mainWsUrl = conns[tokenId]?.wsUrl;
    if (!mainWsUrl) {
      if (tempMain) tokenStore.closeWebSocketConnection(tokenId);
      return { status: "no-wsurl" };
    }

    const client = new PayloadBattleClient({
      mainWsUrl,
      bfInfo: info,
      onLog: (level, msg) => log(level, `[蟠桃] ${msg}`),
      onDisconnect: () => scheduleReconnect(tokenStore, tokenId, log),
    });
    await client.connect(); // 内部完成 payload_enterbf + payload_ping 心跳
    activeClient = client;
    reconnectAttempts = 0;

    // 5) 断开主服临时连接：战场连接（sid2）独立鉴权，不影响参战；
    //    也避免与 iframe 游戏的主服会话互踢
    if (tempMain) tokenStore.closeWebSocketConnection(tokenId);

    log("success", "蟠桃战场已连接并进场，实时参战中");
    return { status: "entered" };
  } finally {
    running = false;
  }
}

/** 断线自动重连：刷新 sid（sid 会过期）→ 重连 → 重新 enterbf */
function scheduleReconnect(tokenStore, tokenId, log) {
  activeClient = null;
  if (reconnectTimer) return;
  if (reconnectAttempts >= MAX_RECONNECT) {
    reconnectAttempts = 0;
    log("error", `[蟠桃] 战场连接重试 ${MAX_RECONNECT} 次仍失败，停止重连`);
    return;
  }
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, 60_000);
  reconnectAttempts += 1;
  log("info", `[蟠桃] ${delay / 1000}s 后自动重连战场（第 ${reconnectAttempts}/${MAX_RECONNECT} 次）`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      const r = await startPayloadBattleFlow(tokenStore, tokenId, log);
      if (r.status === "entered") return;
      if (r.status === "ended" || r.status === "not-open") {
        reconnectAttempts = 0;
        return; // 战场关闭，不重连
      }
      // 其他失败（如主服连接失败）继续退避重试
      scheduleReconnect(tokenStore, tokenId, log);
    } catch (e) {
      if (isNotOpenError(e)) {
        reconnectAttempts = 0;
        log("info", "[蟠桃] 战场未开放，停止重连");
        return;
      }
      scheduleReconnect(tokenStore, tokenId, log);
    }
  }, delay);
}