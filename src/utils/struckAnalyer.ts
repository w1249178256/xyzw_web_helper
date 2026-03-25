declare interface TermData {
  path: string; // 对象路径
  key: string; // 键名
  value: any; // 键值
  type: string; // 数据类型
  isArray: boolean; // 是否为数组
}

/**
 * 扫描对象以查找特定词条
 *
 * @param obj 要扫描的对象
 * @param record 收集器
 * @param terms 词条列表（正则表达式）
 * @param path 父级路径
 * @returns
 */
const scanForTermData = (
  obj: Object,
  record: TermData[],
  terms: RegExp[],
  path: string = "",
) => {
  if (!obj || typeof obj !== "object") return;

  if (!terms || terms.length === 0) return;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (terms.find((term) => term.test(key))) {
      record.push({
        path: currentPath,
        key: key,
        value: value,
        type: typeof value,
        isArray: Array.isArray(value),
      });
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      scanForTermData(value, record, terms, currentPath);
    }
  }
};

// 辅助函数：分析数据结构
const analyzeDataStructure = (
  obj: Object,
  depth: number = 0,
  maxDepth: number = 3,
) => {
  if (depth > maxDepth || !obj || typeof obj !== "object") {
    return typeof obj;
  }

  const structure: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      structure[key] =
        `Array[${value.length}]${value.length > 0 ? `: ${analyzeDataStructure(value[0], depth + 1, maxDepth)}` : ""}`;
    } else if (typeof value === "object" && value !== null) {
      structure[key] = analyzeDataStructure(value, depth + 1, maxDepth);
    } else {
      structure[key] = typeof value;
    }
  }
  return structure;
};

// 辅助函数：尝试解析队伍数据
const tryParseTeamData = (data: Object, result: any, cmd) => {
  // 查找队伍相关字段
  const teamFields: TermData[] = [];
  scanForTermData(data, teamFields, [
    /team/i,
    /preset/i,
    /formation/i,
    /lineup/i,
  ]);
  if (teamFields.length > 0) {
    // 尝试更新游戏数据
    teamFields.forEach((field) => {
      if (
        field.key === "presetTeamInfo" ||
        field.path.includes("presetTeamInfo")
      ) {
        if (!result.presetTeam) {
          result.presetTeam = {};
        }
        result.presetTeam.presetTeamInfo = field.value;
        result.lastUpdated = new Date().toISOString();
      }
    });
  } else {
    // 未找到队伍数据
  }
};

export default {
  scanForTermData,
  analyzeDataStructure,
  tryParseTeamData,
};
