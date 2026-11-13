/**
 * 黑市商品固定原价表
 *
 * 依据：黑市商品种类与排序固定，每天只有「折扣」随机（每日 0 点刷新）。
 * 数据来源：
 *   · 原价：用户 2026-11-06 提供的 3 张实机截图 + 同时刻 store_goodslist 返回的折扣交叉核对，
 *     16 个 goodsId 的折扣逐项吻合，确认顺序固定。
 *   · 名称：用户按格子顺序提供（第一排→第六排，每排 3 个，共 16 个）。
 *
 * 推导方式：原价 = 截图现价 ÷ 当时折扣
 *   1 号 200 ÷ 0.5 = 400      2 号 113 ÷ 0.3 ≈ 375（112.5，游戏内四舍五入显示 113）
 *   3 号 500 ÷ 0.8 = 625      4 号 240 ÷ 0.8 = 300
 *   10 号 700 ÷ 0.7 = 1000    11 号 800 ÷ 0.8 = 1000
 *   12 号 2000 ÷ 0.8 = 2500   其余均为原价直读
 *
 * 注意：2 号原价由 113 ÷ 0.3 反推，整数区间为 374~376，取最可能的值 375。
 * 若实机显示原价不是 375，改这一行即可。
 *
 * qty 是商品内容数量（截图上的 xN），暂时只作参考，不参与计算。
 */
export const BLACK_MARKET_GOODS = {
  1: { name: "青铜宝箱", base: 400, qty: 1 },
  2: { name: "黄金宝箱", base: 375, qty: 1 },
  3: { name: "铂金宝箱", base: 625, qty: 1 },
  4: { name: "进阶石", base: 300, qty: 1 },
  5: { name: "精铁", base: 200, qty: 1 },
  6: { name: "招募令", base: 2500, qty: 1 },
  7: { name: "随机红将碎片", base: 400, qty: 1 },
  8: { name: "随机橙将碎片", base: 300, qty: 1 },
  9: { name: "随机紫将碎片", base: 200, qty: 1 },
  10: { name: "梦魇晶石", base: 1000, qty: 1 },
  11: { name: "普通鱼竿", base: 1000, qty: 1 },
  12: { name: "黄金鱼竿", base: 2500, qty: 1 },
  13: { name: "咸神门票", base: 300, qty: 1 },
  14: { name: "白玉", base: 1600, qty: 1 },
  15: { name: "彩玉", base: 500, qty: 1 },
  16: { name: "扳手", base: 800, qty: 1 },
};

/**
 * 取某个商品位的名称。
 * @param {number|string} goodsId 商品位 ID
 * @returns {string} 名称；未知商品返回空串
 */
export function getGoodsName(goodsId) {
  return BLACK_MARKET_GOODS[Number(goodsId)]?.name ?? "";
}

/**
 * 取某个商品位的原价。
 * @param {number|string} goodsId 商品位 ID
 * @returns {number|null} 原价；未知商品返回 null
 */
export function getGoodsBasePrice(goodsId) {
  return BLACK_MARKET_GOODS[Number(goodsId)]?.base ?? null;
}

/**
 * 按折扣算现价。折扣为 0/缺失时按原价处理。
 * @param {number|string} goodsId 商品位 ID
 * @param {number} discount 0~1 的折扣率
 * @returns {number|null} 现价；未知商品返回 null
 */
export function getGoodsFinalPrice(goodsId, discount) {
  const base = getGoodsBasePrice(goodsId);
  if (base === null) return null;
  const rate = Number(discount);
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
  return Math.round(base * safeRate);
}
