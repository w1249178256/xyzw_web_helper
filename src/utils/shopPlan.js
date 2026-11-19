/**
 * 黑市购买计划：按账户（tokenId）各存一套，放在 localStorage。
 *
 * 结构：
 *   {
 *     items: { "1": 250, "10": 700 },  // goodsId → 心理价（有键即为勾选）
 *     maxRefresh: 0                    // 自动刷新次数上限（0~15，0 = 只买当前批次不刷新）
 *   }
 *
 * 心理价的含义：现价 ≤ 心理价才买，原价只作为参考展示。
 */

const KEY_PREFIX = "shop_plan_";
export const MAX_REFRESH_LIMIT = 15;
export const DEFAULT_MAX_REFRESH = 0;

function storageKey(tokenId) {
  return `${KEY_PREFIX}${tokenId ?? "default"}`;
}

/** 读取某账户的计划；没有或损坏时返回默认空计划 */
export function loadShopPlan(tokenId) {
  const fallback = { items: {}, maxRefresh: DEFAULT_MAX_REFRESH };
  try {
    const raw = localStorage.getItem(storageKey(tokenId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const items = {};
    for (const [goodsId, price] of Object.entries(parsed?.items || {})) {
      const num = Number(price);
      if (Number.isFinite(num) && num > 0) items[String(goodsId)] = Math.round(num);
    }
    let maxRefresh = Number(parsed?.maxRefresh);
    if (!Number.isFinite(maxRefresh)) maxRefresh = DEFAULT_MAX_REFRESH;
    maxRefresh = Math.min(MAX_REFRESH_LIMIT, Math.max(0, Math.round(maxRefresh)));
    return { items, maxRefresh };
  } catch {
    return fallback;
  }
}

/** 保存计划；会自动过滤非法价格并把刷新次数夹到 0~15 */
export function saveShopPlan(tokenId, plan) {
  const items = {};
  for (const [goodsId, price] of Object.entries(plan?.items || {})) {
    const num = Number(price);
    if (Number.isFinite(num) && num > 0) items[String(goodsId)] = Math.round(num);
  }
  let maxRefresh = Number(plan?.maxRefresh);
  if (!Number.isFinite(maxRefresh)) maxRefresh = DEFAULT_MAX_REFRESH;
  maxRefresh = Math.min(MAX_REFRESH_LIMIT, Math.max(0, Math.round(maxRefresh)));
  const payload = { items, maxRefresh };
  try {
    localStorage.setItem(storageKey(tokenId), JSON.stringify(payload));
  } catch {
    /* 存储失败不影响本次使用 */
  }
  return payload;
}

/** 列出本地保存过计划的所有 tokenId（用于「复制其他账户计划」） */
export function listSavedPlanTokenIds(storage = globalThis.localStorage) {
  const ids = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        ids.push(key.slice(KEY_PREFIX.length));
      }
    }
  } catch {
    /* 存储不可用时返回空 */
  }
  return ids;
}

/** 清空某账户的计划 */
export function clearShopPlan(tokenId) {
  try {
    localStorage.removeItem(storageKey(tokenId));
  } catch {
    /* 忽略 */
  }
}

/** 勾选了哪些商品（按 goodsId 升序） */
export function planGoodsIds(plan) {
  return Object.keys(plan?.items || {})
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
    .sort((a, b) => a - b);
}
