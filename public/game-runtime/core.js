// Shared by the Vue launcher, the isolated runtime and offline checks.
export const CHANNEL = "xyzw-game-runtime-v1";

export function normalizeGameId(value) {
  if (typeof value === "bigint") return value > 0n ? String(value) : null;
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return null;
  return value.trim().replace(/^0+/, "") || null;
}

export function createInstanceId(cryptoSource = globalThis.crypto) {
  if (typeof cryptoSource?.randomUUID === "function") return cryptoSource.randomUUID();
  // randomUUID requires HTTPS/localhost; getRandomValues is also available on HTTP IP addresses.
  if (typeof cryptoSource?.getRandomValues !== "function") throw new Error("当前浏览器不支持生成游戏窗口标识，请更新浏览器");
  const bytes = cryptoSource.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function parseGameToken(record) {
  if (!record || !record.id) throw new Error("账号不存在，请返回 Tokens 页面同步");
  const decode = (input) => {
    if (typeof input !== "string") return input;
    const text = input.replace(/^data:.*base64,/, "").trim();
    try { return JSON.parse(text); } catch {}
    try { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)))); } catch {}
    if (/^[\w+/=:.\-]{10,8192}$/.test(text)) return { roleToken: text };
    throw new Error("Token 格式不完整，请在 Tokens 页面刷新该账号");
  };
  let value = decode(record.token);
  for (let depth = 0; depth < 3 && value && !value.roleToken && (value.token || value.gameToken); depth++) {
    value = { ...value, ...decode(value.token || value.gameToken) };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Token 格式无效");
  const roleToken = value.roleToken || value.token;
  if (typeof roleToken !== "string" || !roleToken.trim()) throw new Error("Token 缺少游戏登录凭据，请返回 Tokens 页面刷新");
  const roleId = value.roleId ?? record.roleId;
  const serverId = value.serverId ?? record.serverId;
  // Imported records may have roleId=""/0 and no server ID. Those are not shared identities.
  const roleKey = normalizeGameId(value.roleId) || normalizeGameId(record.roleId);
  const serverKey = normalizeGameId(value.serverId) || normalizeGameId(record.serverId);
  const auth = { ...value, roleToken };
  if (roleId != null) auth.roleId = String(roleId);
  if (serverId != null) auth.serverId = serverId;
  let wsUrl = record.wsUrl || "";
  if (wsUrl) {
    const url = new URL(wsUrl);
    if (url.protocol !== "wss:" && !(url.protocol === "ws:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new Error("游戏连接地址必须使用 WSS");
    }
    // The engine creates fresh session/connection IDs; never reuse a cached p parameter.
    url.searchParams.delete("p");
    wsUrl = url.href;
  }
  return {
    tokenId: String(record.id), name: String(record.name || "未命名账号"),
    server: String(record.server || ""), auth, wsUrl,
    identity: roleKey && serverKey ? `role:${serverKey}:${roleKey}` : `token:${record.id}`,
  };
}

export function authResponse(auth) {
  const rawData = { ...auth };
  return { code: 0, error: "", rawData, getData: () => rawData };
}

export function settings(value = {}) {
  const number = (key, fallback, min, max) => {
    const n = Number(value[key]);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  return {
    width: Math.round(number("width", 360, 240, 1920)),
    height: Math.round(number("height", 640, 320, 2160)),
    fps: Math.round(number("fps", 30, 10, 60)), speed: number("speed", 1.2, 1, 20),
  };
}
