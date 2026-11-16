/**
 * 后台推关接口封装。
 *
 * 后端跑在 render-backend（默认 3001），前端通过 vite 代理 `/api/pushing` 访问，
 * 所以这里只用相对路径，dev / 打包后都能用。
 */

const BASE = "/api/pushing";

/**
 * 发请求并统一处理错误。
 * @param {string} path 相对路径，如 "/status"
 * @param {object} options fetch 配置
 * @returns {Promise<any>} 后端返回的 JSON
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `请求失败（${res.status}）`);
  }
  return data;
}

/**
 * 拉推关状态列表。
 * @returns {Promise<{rows: Array<object>}>} rows 为各账号的运行态
 */
export function getPushingStatus() {
  return request("/status");
}

/**
 * 开始后台推关。
 * @param {Array<object>} tokens 账号列表（前端直传，后端自行解析 token）
 * @param {object} [options] 推关参数（maxRetries / maxLevel）
 * @returns {Promise<{ok: boolean, started?: Array<object>, error?: string}>} 启动结果
 */
export function startPushing(tokens, options = {}) {
  return request("/start", {
    method: "POST",
    body: JSON.stringify({ tokens, options }),
  });
}

/**
 * 停止指定账号的推关。
 * @param {string} tokenId 账号 id
 * @returns {Promise<{ok: boolean, error?: string}>} 停止结果
 */
export function stopPushing(tokenId) {
  return request("/stop", {
    method: "POST",
    body: JSON.stringify({ tokenId }),
  });
}

/**
 * 停止全部账号。
 * @returns {Promise<{ok: boolean, count?: number}>} 停止结果
 */
export function stopAllPushing() {
  return request("/stop", {
    method: "POST",
    body: JSON.stringify({ all: true }),
  });
}

/**
 * 增量拉日志。
 * @param {string} tokenId 账号 id
 * @param {number} after 上次拿到的最大 seq
 * @returns {Promise<{ok: boolean, status?: string, logs: Array<object>}>} 增量日志
 */
export function getPushingLogs(tokenId, after = 0) {
  const query = `?tokenId=${encodeURIComponent(tokenId)}&after=${after}`;
  return request(`/logs${query}`);
}
