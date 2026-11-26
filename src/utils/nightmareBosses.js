/**
 * 十殿试炼 boss 配置（来自游戏官方配置表 `NightMareMonster`，dataBundleVer=359abd1cc2）。
 *
 * 这些数据不会随房间推送下发，客户端只拿到怪物 id / 等级 / 血量，
 * 名称与战力只能从配置表取，所以在这里固化一份。
 *
 * `units[].pos` 是站位：13 / 26 为主将，10 / 11 / 12 为左中右副将。
 */
export const NIGHTMARE_BOSSES = {
  1: {
    name: "秦广王",
    power: 90337477527,
    integral: 1,
    units: [
      { id: 10001, pos: 13 },
      { id: 1000101, pos: 10 },
      { id: 1000102, pos: 11 },
    ],
  },
  2: {
    name: "楚江王",
    power: 111395550613,
    integral: 1,
    units: [
      { id: 10002, pos: 13 },
      { id: 1000201, pos: 10 },
      { id: 1000202, pos: 11 },
    ],
  },
  3: {
    name: "宋帝王",
    power: 64199348337,
    integral: 1,
    units: [{ id: 10003, pos: 26 }],
  },
  4: {
    name: "五官王",
    power: 70811731633,
    integral: 2,
    units: [{ id: 10004, pos: 26 }],
  },
  5: {
    name: "阎罗王",
    power: 121395550613,
    integral: 3,
    units: [
      { id: 10005, pos: 13 },
      { id: 1000501, pos: 10 },
      { id: 1000502, pos: 11 },
    ],
  },
  6: {
    name: "卞城王",
    power: 312431321,
    integral: 4,
    units: [{ id: 10006, pos: 13 }],
  },
  7: {
    name: "泰山王",
    power: 212431321889,
    integral: 4,
    units: [{ id: 10007, pos: 26 }],
  },
  8: {
    name: "都市王",
    power: 192431321889,
    integral: 4,
    units: [{ id: 10008, pos: 13 }],
  },
  11: {
    name: "平等王",
    power: 88699926999,
    integral: 0,
    units: [
      { id: 1000901, pos: 10 },
      { id: 1000901, pos: 11 },
      { id: 1000901, pos: 12 },
      { id: 1000901, pos: 13 },
      { id: 1000901, pos: 14 },
    ],
  },
  12: {
    name: "平等王",
    power: 36206450106,
    integral: 0,
    units: [{ id: 1000902, pos: 26 }],
  },
};

/** 站位 → 中文标签 */
export const BOSS_POS_LABEL = {
  10: "左将",
  11: "右将",
  12: "副将",
  13: "主将",
  14: "副将",
  26: "主将",
};

export function getBossOfLayer(layer) {
  return NIGHTMARE_BOSSES[Number(layer)] || null;
}
