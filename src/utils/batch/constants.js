/**
 * 批量日常任务常量配置
 */

// 宝箱类型选项
export const boxTypeOptions = [
  { label: "木质宝箱", value: 2001 },
  { label: "青铜宝箱", value: 2002 },
  { label: "黄金宝箱", value: 2003 },
  { label: "铂金宝箱", value: 2004 },
];

// 鱼竿类型选项
export const fishTypeOptions = [
  { label: "普通鱼竿", value: 1 },
  { label: "黄金鱼竿", value: 2 },
];

// 阵容选项
export const formationOptions = [1, 2, 3, 4, 5, 6].map((v) => ({
  label: `阵容${v}`,
  value: v,
}));

// BOSS次数选项
export const bossTimesOptions = [0, 1, 2, 3, 4].map((v) => ({
  label: `${v}次`,
  value: v,
}));

// 可用的定时任务列表
export const availableTasks = [
  { label: "日常任务", value: "startBatch" },
  { label: "领取挂机", value: "claimHangUpRewards" },
  { label: "一键加钟", value: "batchAddHangUpTime" },
  { label: "重置罐子", value: "resetBottles" },
  { label: "一键领取罐子", value: "batchlingguanzi" },
  { label: "一键爬塔", value: "climbTower" },
  { label: "一键爬怪异塔", value: "climbWeirdTower" },
  { label: "一键答题", value: "batchStudy" },
  { label: "智能发车", value: "batchSmartSendCar" },
  { label: "一键收车", value: "batchClaimCars" },
  { label: "批量开箱", value: "batchOpenBox" },
  { label: "领取宝箱积分", value: "batchClaimBoxPointReward" },
  { label: "批量钓鱼", value: "batchFish" },
  { label: "批量招募", value: "batchRecruit" },
  { label: "一键宝库前3层", value: "batchbaoku13" },
  { label: "一键宝库4,5层", value: "batchbaoku45" },
  { label: "一键梦境", value: "batchmengjing" },
  { label: "一键俱乐部签到", value: "batchclubsign" },
  { label: "一键竞技场战斗3次", value: "batcharenafight" },
  { label: "一键钓鱼补齐", value: "batchTopUpFish" },
  { label: "一键竞技场补齐", value: "batchTopUpArena" },
  { label: "一键领取怪异塔免费道具", value: "batchClaimFreeEnergy" },
  { label: "一键换皮闯关", value: "skinChallenge" },
  { label: "一键购买四圣碎片", value: "legion_storebuygoods" },
  { label: "一键黑市采购", value: "store_purchase" },
  { label: "免费领取珍宝阁", value: "collection_claimfreereward" },
  { label: "批量领取功法残卷", value: "batchLegacyClaim" },
  { label: "批量赠送功法残卷", value: "batchLegacyGiftSendEnhanced" },
  { label: "一键使用怪异塔道具", value: "batchUseItems" },
  { label: "一键怪异塔合成", value: "batchMergeItems" },
  { label: "一键领取蟠桃园任务", value: "batchClaimPeachTasks" },
  { label: "一键扫荡灯神", value: "batchGenieSweep" },
  { label: "一键购买梦境商品", value: "batchBuyDreamItems" },
];

// 车辆研究消耗表
export const CarresearchItem = [
  20, 21, 22, 23, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 47, 50, 53, 56,
  59, 62, 65, 68, 71, 74, 78, 82, 86, 90, 94, 99, 104, 109, 114, 119, 126, 133,
  140, 147, 154, 163, 172, 181, 190, 199, 210, 221, 232, 243, 369, 393, 422,
  457, 498, 548, 607, 678, 763, 865, 1011,
];

// 月度任务目标
export const FISH_TARGET = 320;
export const ARENA_TARGET = 240;

// 任务表列配置
export const taskColumns = [
  { title: "任务名称", key: "name", width: 150 },
  { title: "运行类型", key: "runType", width: 100 },
  {
    title: "运行时间",
    key: "runTime",
    width: 150,
    render: (row) => {
      return row.runType === "daily" ? row.runTime : row.cronExpression;
    },
  },
  {
    title: "选中账号",
    key: "selectedTokens",
    width: 150,
    render: (row) => `${row.selectedTokens.length} 个`,
  },
  {
    title: "选中任务",
    key: "selectedTasks",
    width: 150,
    render: (row) => `${row.selectedTasks.length} 个`,
  },
  {
    title: "状态",
    key: "enabled",
    width: 80,
    render: (row) => (row.enabled ? "启用" : "禁用"),
  },
  { title: "操作", key: "actions", width: 150 },
];

// 默认设置
export const defaultSettings = {
  arenaFormation: 1,
  towerFormation: 1,
  bossFormation: 1,
  bossTimes: 2,
  claimBottle: true,
  payRecruit: true,
  openBox: true,
  arenaEnable: true,
  claimHangUp: true,
  claimEmail: true,
  blackMarketPurchase: true,
};

// 默认批量设置
export const defaultBatchSettings = {
  boxCount: 100,
  fishCount: 100,
  recruitCount: 100,
  defaultBoxType: 2001,
  defaultFishType: 1,
  receiverId: "",
  password: "",
  useGoldRefreshFallback: false,
  tokenListColumns: 2,
  commandDelay: 500,
  taskDelay: 500,
  maxActive: 2,
  carMinColor: 4,
  connectionTimeout: 10000,
  reconnectDelay: 1000,
  maxLogEntries: 1000,
  // 智能发车阈值设置
  smartDepartureGoldThreshold: 0,
  smartDepartureRecruitThreshold: 0,
  smartDepartureJadeThreshold: 0,
  smartDepartureTicketThreshold: 0,
  smartDepartureMatchAll: false,
};

// 默认模板
export const defaultTemplate = {
  arenaFormation: 1,
  towerFormation: 1,
  bossFormation: 1,
  bossTimes: 2,
  claimBottle: true,
  payRecruit: true,
  openBox: true,
  arenaEnable: true,
  claimHangUp: true,
  claimEmail: true,
  blackMarketPurchase: true,
};

// 默认任务表单
export const defaultTaskForm = {
  name: "",
  runType: "daily",
  runTime: undefined,
  cronExpression: "",
  selectedTokens: [],
  selectedTasks: [],
  enabled: true,
};

// 默认助手设置
export const defaultHelperSettings = {
  boxType: 2001,
  fishType: 1,
  count: 100,
};
