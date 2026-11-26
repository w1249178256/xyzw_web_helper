/**
 * 物品/货币名称表
 *
 * 来源：游戏内黑市商品清单（src/utils/batch/blackMarketConfig.js）+ 实机抓包核对。
 * 游戏远端 config.json 的 ItemConf 只存 i18n key（ItemConf_name_1022），
 * 语言包里也没有这些常用消耗品的中文名，所以这里维护一份常用 id 对照表；
 * 表里没有的 id 统一显示成「物品{id}」，不会抛错。
 */

/** 物品类型：reward 里的 type 字段 */
export const REWARD_TYPE_NAMES = {
  1: "道具",
  2: "货币",
  3: "道具",
};

export const ITEM_NAMES = {
  1001: "招募令",
  1011: "普通鱼竿",
  1012: "黄金鱼竿",
  1013: "珍珠",
  1019: "盐锭",
  1020: "皮肤币",
  1021: "扫荡令",
  1022: "白玉",
  1023: "彩玉",
  // 十殿罗盘每周铃铛奖励（8 组 1037x5），游戏内名称待确认
  1037: "铃铛",
  2001: "木质宝箱",
  2002: "青铜宝箱",
  2003: "黄金宝箱",
  2004: "铂金宝箱",
  2005: "钻石宝箱",
};

/**
 * 取物品中文名
 * @param {number|string} itemId 物品 id
 * @returns {string} 中文名，未知时返回「物品{id}」
 */
export function itemName(itemId) {
  const id = Number(itemId);
  if (!Number.isFinite(id)) return String(itemId);
  return ITEM_NAMES[id] || `物品${id}`;
}

/**
 * 把 reward 数组格式化成可读文本，例如「彩玉x50、白玉x5000」
 * @param {Array<{type?:number,itemId:number,value:number}>} reward 服务端 reward 字段
 * @param {string} [sep] 分隔符
 * @returns {string} 可读文本，空数组返回「无奖励」
 */
export function formatRewardNames(reward, sep = "、") {
  if (!Array.isArray(reward) || reward.length === 0) return "无奖励";

  // 同 id 合并数量（服务端偶尔会拆成多条）
  const merged = new Map();
  for (const item of reward) {
    const id = Number(item?.itemId ?? 0);
    const value = Number(item?.value ?? 0);
    if (!value) continue;
    merged.set(id, (merged.get(id) || 0) + value);
  }
  if (merged.size === 0) return "无奖励";

  return [...merged.entries()]
    .map(([id, value]) => `${id === 0 ? "钻石" : itemName(id)}x${value}`)
    .join(sep);
}
