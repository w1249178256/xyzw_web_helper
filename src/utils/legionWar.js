import { isSameGameValue } from "./gameValue.js";

/**
 * 官方建筑类型定义（对齐游戏客户端 types-tiled: BuildingType）
 */
export const BuildingType = Object.freeze({
  None: 0,
  Bronze: 1, // 铜矿（小矿，30分）
  Silver: 2, // 银矿（中矿，50分）
  Gold: 3, // 金矿（大矿，80分）
  Home: 4, // 大本营
  Fort: 5, // 要塞 / 箭塔（100分）
  SaltPan: 6, // 决战盐山 / 核心盐场
  Road: 9, // 道路
});

/**
 * 官方 24 战队颜色列表（对齐游戏客户端 types-legionWar: WarLegionNameColor）
 */
export const WarLegionNameColor = Object.freeze([
  "",
  "#ffc43e",
  "#00abff",
  "#e5740f",
  "#03832e",
  "#0087ff",
  "#1b57ce",
  "#db2e69",
  "#ff9c00",
  "#c300aa",
  "#a5af33",
  "#009a64",
  "#00e0d3",
  "#7d3af9",
  "#c7657e",
  "#d881d9",
  "#ef6452",
  "#918900",
  "#19939f",
  "#3a1cd8",
  "#a954c7",
  "#969e71",
  "#6de850",
  "#ff6236",
]);

/**
 * 建筑类型固有基础颜色（中立或未占领时显示）
 */
export const BuildingTypeColor = Object.freeze({
  [BuildingType.Bronze]: "#ff9c00",
  [BuildingType.Silver]: "#e5c158",
  [BuildingType.Gold]: "#8a9ba8",
  [BuildingType.Home]: "#d03050",
  [BuildingType.Fort]: "#18a058",
  [BuildingType.SaltPan]: "#1bd7d7",
  [BuildingType.Road]: "#4080ff",
});

/** 核心盐盘中心坐标 */
export const CORE_PAN_CENTER = "20_17";

/** 核心盐盘环绕 6 节点坐标（对齐游戏客户端 MapGroupPositionMap） */
export const CORE_SURROUNDING_POINTS = Object.freeze([
  "19_16",
  "19_17",
  "20_16",
  "20_18",
  "21_16",
  "21_17",
]);

/**
 * 静态地图 323 个紧凑点位定义元组 [id, type]
 */
const MAP_POINT_DEFINITIONS = [
  ["20_16", 9], ["20_18", 9], ["19_16", 9], ["19_17", 9], ["21_17", 9], ["21_16", 9],
  ["22_17", 9], ["23_16", 9], ["23_14", 9], ["24_15", 9], ["24_13", 9], ["25_13", 9],
  ["26_15", 9], ["27_15", 9], ["29_14", 9], ["30_14", 9], ["30_15", 9], ["32_14", 9],
  ["32_15", 9], ["33_14", 9], ["34_16", 9], ["34_17", 9], ["35_16", 9], ["37_15", 9],
  ["37_16", 9], ["38_16", 9], ["36_14", 9], ["35_13", 9], ["36_12", 9], ["37_11", 9],
  ["36_10", 9], ["35_9", 9], ["34_11", 9], ["34_12", 9], ["33_11", 9], ["33_9", 9],
  ["32_11", 2], ["32_9", 9], ["30_8", 9], ["29_8", 9], ["29_10", 9], ["28_11", 9],
  ["26_10", 9], ["26_9", 9], ["24_9", 9], ["23_9", 9], ["21_9", 9], ["21_8", 9],
  ["21_6", 9], ["21_4", 9], ["21_3", 9], ["19_3", 9], ["19_4", 9], ["27_23", 9],
  ["18_6", 9], ["21_11", 9], ["22_11", 9], ["19_11", 9], ["18_12", 9], ["19_13", 9],
  ["20_13", 9], ["20_7", 9], ["21_14", 9], ["21_15", 9], ["21_18", 9], ["22_19", 9],
  ["24_19", 9], ["24_18", 9], ["26_18", 9], ["26_19", 9], ["25_20", 9], ["25_21", 9],
  ["26_23", 9], ["26_24", 9], ["28_25", 9], ["28_26", 9], ["27_25", 9], ["30_26", 9],
  ["31_26", 9], ["32_28", 9], ["32_29", 9], ["31_28", 9], ["29_28", 9], ["28_28", 9],
  ["27_29", 9], ["27_30", 9], ["25_30", 9], ["24_30", 9], ["25_28", 9], ["25_27", 9],
  ["26_28", 9], ["24_26", 9], ["25_25", 9], ["22_28", 9], ["23_28", 9], ["23_27", 9],
  ["21_29", 9], ["21_30", 9], ["19_29", 9], ["19_30", 9], ["19_27", 9], ["20_27", 9],
  ["19_25", 9], ["19_24", 9], ["19_22", 9], ["18_23", 9], ["21_22", 9], ["22_22", 9],
  ["21_20", 9], ["20_21", 9], ["19_18", 9], ["19_19", 9], ["17_19", 9], ["16_19", 9],
  ["17_17", 9], ["18_17", 9], ["19_15", 9], ["18_15", 9], ["15_20", 9], ["16_21", 9],
  ["14_19", 9], ["13_18", 9], ["11_19", 9], ["10_19", 9], ["10_20", 9], ["8_19", 9],
  ["8_20", 9], ["5_17", 9], ["9_17", 9], ["10_17", 9], ["12_15", 9], ["12_16", 9],
  ["12_14", 9], ["12_13", 9], ["11_11", 9], ["11_10", 9], ["12_9", 9], ["12_8", 9],
  ["13_8", 9], ["14_10", 9], ["14_11", 9], ["13_10", 9], ["10_8", 9], ["9_5", 9],
  ["15_13", 9], ["15_12", 9], ["14_15", 9], ["14_16", 9], ["16_15", 9], ["16_16", 9],
  ["8_24", 9], ["8_25", 9], ["10_26", 9], ["11_25", 9], ["9_22", 9], ["9_21", 9],
  ["11_23", 9], ["12_23", 9], ["14_24", 9], ["14_25", 9], ["16_25", 9], ["17_24", 9],
  ["31_25", 9], ["32_23", 9], ["32_24", 9], ["33_23", 9], ["31_21", 9], ["31_20", 9],
  ["33_18", 9], ["33_19", 9], ["34_19", 9], ["31_16", 9], ["30_17", 9], ["28_18", 9],
  ["28_19", 9], ["28_20", 9], ["28_21", 9], ["30_20", 9], ["29_22", 9], ["29_23", 9],
  ["9_13", 9], ["9_12", 9], ["8_11", 9], ["8_10", 9], ["9_8", 9], ["10_14", 9],
  ["11_5", 9], ["12_6", 9], ["13_4", 9], ["13_3", 9], ["15_3", 9], ["16_4", 9],
  ["15_5", 9], ["15_6", 9], ["14_6", 9], ["17_5", 9], ["17_6", 9], ["16_8", 9],
  ["15_8", 9], ["31_12", 9], ["31_11", 9], ["2_18", 9], ["3_18", 9], ["3_17", 9],
  ["3_22", 9], ["4_20", 9], ["4_22", 9], ["4_24", 9], ["5_20", 9], ["5_24", 9],
  ["6_15", 9], ["6_18", 9], ["6_17", 9], ["6_22", 9], ["6_23", 9], ["7_10", 9],
  ["7_14", 9], ["7_15", 9], ["7_19", 9], ["7_22", 9], ["7_24", 9], ["8_5", 9],
  ["8_6", 9], ["8_7", 1], ["9_7", 9], ["10_5", 1], ["13_5", 1], ["16_5", 1],
  ["29_21", 1], ["16_7", 2], ["11_7", 3], ["9_9", 1], ["8_12", 1], ["8_14", 1],
  ["8_15", 9], ["7_16", 1], ["6_19", 3], ["4_17", 1], ["3_19", 1], ["5_21", 1],
  ["6_24", 1], ["8_23", 2], ["9_25", 1], ["11_12", 1], ["11_14", 2], ["11_16", 1],
  ["11_24", 1], ["12_10", 1], ["7_4", 4], ["6_10", 4], ["5_14", 4], ["1_18", 4],
  ["3_23", 4], ["13_23", 4], ["12_19", 4], ["14_3", 4], ["14_12", 4], ["21_5", 4],
  ["19_28", 4], ["26_31", 4], ["33_29", 4], ["34_23", 4], ["35_19", 4], ["39_16", 4],
  ["37_10", 4], ["27_10", 4], ["28_15", 4], ["26_22", 4], ["14_9", 1], ["14_14", 1],
  ["14_20", 1], ["15_16", 1], ["15_25", 1], ["16_18", 2], ["17_14", 2], ["17_20", 1],
  ["18_24", 5], ["19_5", 1], ["20_3", 1], ["20_8", 1], ["22_10", 5], ["20_11", 1],
  ["18_13", 1], ["21_13", 1], ["20_17", 6], ["9_18", 1], ["9_20", 1], ["20_23", 1],
  ["22_21", 1], ["19_20", 1], ["20_26", 1], ["20_31", 1], ["21_28", 1], ["24_27", 2],
  ["24_29", 1], ["26_25", 1], ["28_24", 1], ["29_26", 3], ["31_24", 1], ["32_27", 1],
  ["30_29", 1], ["27_28", 1], ["32_22", 1], ["29_19", 2], ["32_20", 1], ["33_17", 1],
  ["34_15", 3], ["31_13", 1], ["31_15", 1], ["29_17", 1], ["26_14", 1], ["23_13", 1],
  ["24_16", 2], ["26_20", 1], ["25_17", 1], ["23_19", 2], ["36_17", 1], ["36_15", 1],
  ["35_12", 1], ["34_10", 1], ["31_8", 1], ["29_9", 1], ["25_8", 1],
];

/**
 * 完整道路与据点节点列表
 */
export const roadPointList = MAP_POINT_DEFINITIONS.map(([id, type]) => ({
  id,
  type,
  belongsLegionId: -1,
  hP: 0,
  maxHP: 0,
  point: 0,
}));

/**
 * 六边形地图图结构模型
 */
export class HexGraph {
  static instance = null;

  /** 存储所有节点映射 key: col_row, value: Node */
  nodes = {};

  /** 偶数列 6 方向邻接偏移（对齐官方 TMAStar.DIR[0]） */
  evenQDirs = [
    { q: -1, r: -1 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 0 },
  ];

  /** 奇数列 6 方向邻接偏移（对齐官方 TMAStar.DIR[1]） */
  oddQDirs = [
    { q: 1, r: 0 },
    { q: 1, r: 1 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
  ];

  /**
   * 初始化 HexGraph 实例
   */
  constructor() {
    if (HexGraph.instance) {
      throw new Error("请使用 HexGraph.getInstance() 获取单例");
    }
    this.loadStaticNodes();
    HexGraph.instance = this;
  }

  /**
   * 获取 HexGraph 单例
   *
   * Returns:
   *   HexGraph 实例
   */
  static getInstance() {
    if (!HexGraph.instance) {
      HexGraph.instance = new HexGraph();
    }
    return HexGraph.instance;
  }

  /**
   * 载入静态基础节点
   */
  loadStaticNodes() {
    roadPointList.forEach((item) => {
      this.addNode(item);
    });
  }

  /**
   * 清空并重新加载所有静态节点
   */
  removeAllNode() {
    this.nodes = {};
    this.loadStaticNodes();
  }

  /**
   * 添加或增量更新节点
   *
   * Args:
   *   item: 节点属性对象
   *   item.id: 坐标标识，形如 'col_row'
   *   item.type: 建筑类型
   *   item.belongsLegionId: 所属俱乐部 ID
   *   item.hP: 当前血量
   *   item.maxHP: 最大血量
   *   item.point: 点位分数
   *   item.belongsLegionInfo: 所属公会完整信息
   */
  addNode(item) {
    const nodeId = item.id;
    if (this.nodes[nodeId]) {
      const existing = this.nodes[nodeId];
      if (item.type !== undefined) {
        existing.type = item.type;
        existing.typeName = typeName(item.type);
      }
      if (item.belongsLegionId !== undefined) {
        existing.belongsLegionId = item.belongsLegionId;
      }
      if (item.hP !== undefined) existing.hP = item.hP;
      if (item.maxHP !== undefined) existing.maxHP = item.maxHP;
      if (item.point !== undefined) existing.point = item.point;
      if (item.belongsLegionInfo) {
        existing.belongsLegionInfo = item.belongsLegionInfo;
        existing.colorBg = item.belongsLegionInfo.color || existing.colorBg;
      } else if (item.colorBg) {
        existing.colorBg = item.colorBg;
      }
      return;
    }

    const [colStr, rowStr] = `${item.id}`.split("_");
    this.nodes[nodeId] = {
      id: item.id,
      type: item.type,
      belongsLegionId: item.belongsLegionId,
      hP: item.hP,
      maxHP: item.maxHP,
      point: item.point,
      colorBg: item?.belongsLegionInfo?.color || typeBg(item.type),
      typeName: typeName(item.type),
      position: {
        x: colStr,
        y: rowStr,
      },
      neighbors: [],
    };

    this.buildAdjacency(this.nodes[nodeId]);
  }

  /**
   * 批量添加节点
   *
   * Args:
   *   arrObject: 节点对象列表
   */
  addNodeList(arrObject) {
    arrObject.forEach((item) => {
      this.addNode(item);
    });
  }

  /**
   * 为指定节点构建与邻居节点的邻接连接
   *
   * Args:
   *   node: 待构建邻接关系的节点
   */
  buildAdjacency(node) {
    const col = Number.parseInt(node.position.x, 10);
    const row = Number.parseInt(node.position.y, 10);
    const dirs = col % 2 === 0 ? this.evenQDirs : this.oddQDirs;

    dirs.forEach(({ q: dq, r: dr }) => {
      const neighborId = `${col + dq}_${row + dr}`;
      const neighborNode = this.nodes[neighborId];
      if (neighborNode) {
        if (!node.neighbors.includes(neighborNode)) {
          node.neighbors.push(neighborNode);
        }
        if (!neighborNode.neighbors.includes(node)) {
          neighborNode.neighbors.push(node);
        }
      }
    });
  }

  /**
   * 根据坐标串获取指定节点
   *
   * Args:
   *   nodeStr: 'col_row' 坐标字符串
   *
   * Returns:
   *   匹配的节点对象，若不存在则为 undefined
   */
  getNodeByCoords(nodeStr) {
    return this.nodes[nodeStr];
  }

  /**
   * 获取所有节点数组
   *
   * Returns:
   *   所有节点数组
   */
  getAllNodes() {
    return Object.values(this.nodes);
  }

  /**
   * 计算两点之间基于军团占领状态的最短可行路径（BFS 寻路）
   *
   * Args:
   *   start: 起点坐标字符串
   *   end: 终点坐标字符串
   *   legionId: 目标军团 ID（非道路节点必须归属该军团）
   *
   * Returns:
   *   成功返回从起点到终点的节点数组，若不可达返回 false
   */
  findShortestPath(start, end, legionId) {
    if (!start?.includes("_") || !end?.includes("_") || start === end) {
      return false;
    }

    const startNode = this.getNodeByCoords(start);
    const endNode = this.getNodeByCoords(end);
    if (!startNode || !endNode) {
      return false;
    }

    const queue = [startNode];
    const predecessors = new Map();
    predecessors.set(startNode.id, null);

    let found = false;
    while (queue.length > 0 && !found) {
      const current = queue.shift();
      if (
        !isSameGameValue(current.type, BuildingType.Road) &&
        !isSameGameValue(current.belongsLegionId, legionId)
      ) {
        continue;
      }

      for (const neighbor of current.neighbors) {
        if (!predecessors.has(neighbor.id)) {
          predecessors.set(neighbor.id, current);
          queue.push(neighbor);

          if (neighbor.id === endNode.id) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) return false;

    const path = [];
    let curr = endNode;
    while (curr) {
      path.push(curr);
      curr = predecessors.get(curr.id);
    }
    path.reverse();
    return path;
  }
}

/**
 * 根据颜色索引获取官方战队颜色（1-based 对齐游戏官方色谱）
 *
 * Args:
 *   colorIndex: 军团颜色索引
 *
 * Returns:
 *   HEX 颜色字符串
 */
export const getLegionColor = (colorIndex) => {
  const idx = Number(colorIndex);
  if (idx >= 1 && idx < WarLegionNameColor.length) {
    return WarLegionNameColor[idx];
  }
  if (idx >= 0 && idx + 1 < WarLegionNameColor.length) {
    return WarLegionNameColor[idx + 1];
  }
  return "#667eea";
};

/**
 * 提取盐场 WebSocket 返回消息体的有效战况数据
 *
 * Args:
 *   result: 原始战场数据报文
 *
 * Returns:
 *   清洗后的战况对象，若数据无效则返回 false
 */
export const extractValidData = (result) => {
  if (!result || !result.battlefield) {
    return false;
  }

  const raw = result.battlefield;
  const buildingData = raw.buildingData || {};
  const legionInfo = Object.fromEntries(
    Object.values(raw.legions || {}).map((item) => {
      const buildings = item.buildings || {};
      const calculatedScore =
        Object.keys(buildings)
          .map((bId) => buildingData[bId]?.point ?? 0)
          .reduce((total, cur) => total + cur, 0) + (item.blessingScore || 0);

      return [
        item.id,
        {
          id: item.id,
          name: item.name,
          level: item.level,
          serverId: item.serverId,
          color: getLegionColor(item.color),
          redCount: item.custom?.["red:quench"] || 0,
          power: item.power || 0,
          point: item.point || 0,
          score: calculatedScore,
          killCnt: item.killCnt || 0,
          blessingCount: item.blessingIdList?.length || 0,
          blessingScore: item.blessingScore || 0,
          buildings,
          memberCount: Object.keys(item.membersV2 || {}).length,
          position: item.position,
          strongholdId: item.strongholdId,
          OnlineCount: 0,
          participantsCount: 0,
          danCount: 0,
          reviveCount: 0,
        },
      ];
    }),
  );

  const memberInfo = Object.values(raw.roles || {}).map((item) => {
    const legion = legionInfo[`${item.legionID}`];
    if (legion) {
      legion.participantsCount++;
      if (item.isOnline) legion.OnlineCount++;
      legion.reviveCount += item.revive || 0;
      legion.danCount += (item.d || 0) - 6 > 0 ? item.d - 6 : 0;
    }

    return {
      name: item.name,
      codeId: item.codeIdV2,
      legionName: legion?.name || "未知战队",
      legionId: item.legionID,
      lastState: formatState(item.state),
      digGround: item.aB || 0,
      kill: item.killCnt || 0,
      revive: item.revive || 0,
      die: item.d || 0,
      dan: (item.d || 0) - 6 > 0 ? item.d - 6 : 0,
      score: item.point || 0,
    };
  });

  return {
    buildingData,
    memberInfo,
    legionInfo,
  };
};

/**
 * 格式化成员状态
 *
 * Args:
 *   state: 游戏内部状态字符串
 *
 * Returns:
 *   中文状态说明
 */
export const formatState = (state) => {
  switch (state) {
    case "idle":
      return "空闲";
    case "march":
      return "行进";
    case "watching":
      return "观看";
    case "over":
      return "死亡";
    default:
      return "未知";
  }
};

/**
 * 获取建筑基础类型背景色
 *
 * Args:
 *   type: BuildingType 类型数值
 *
 * Returns:
 *   HEX 颜色字符串
 */
export const typeBg = (type) => {
  return BuildingTypeColor[type] || "#666666";
};

/**
 * 获取建筑类型全称
 *
 * Args:
 *   type: BuildingType 类型数值
 *
 * Returns:
 *   建筑全称
 */
export const typeName = (type) => {
  switch (type) {
    case BuildingType.Bronze:
      return "30分铜矿";
    case BuildingType.Silver:
      return "50分银矿";
    case BuildingType.Gold:
      return "80分金矿";
    case BuildingType.Home:
      return "大本营";
    case BuildingType.Fort:
      return "100分要塞";
    case BuildingType.SaltPan:
      return "决战盐山";
    case BuildingType.Road:
      return "道路";
    default:
      return "未知";
  }
};

/**
 * 获取建筑在六边形格子中的单字缩写标签
 *
 * Args:
 *   type: BuildingType 类型数值
 *
 * Returns:
 *   单字缩写
 */
export const typeLabel = (type) => {
  switch (type) {
    case BuildingType.Bronze:
      return "铜";
    case BuildingType.Silver:
      return "银";
    case BuildingType.Gold:
      return "金";
    case BuildingType.Home:
      return "本";
    case BuildingType.Fort:
      return "城";
    case BuildingType.SaltPan:
      return "核";
    default:
      return "";
  }
};

/**
 * 格式化战力展示
 *
 * Args:
 *   power: 原始战力数值
 *
 * Returns:
 *   带“亿”或“万”的格式化字符串
 */
export const formatPower = (power) => {
  if (!power) return "0";
  const num = Number(power);
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`;
  }
  return power.toString();
};
