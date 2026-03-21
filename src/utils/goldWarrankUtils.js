/**
 * 盐场匹配数据函数
 */

import * as XLSX from "xlsx";

/**
 * 获取今天日期
 * @returns {string} 格式化的日期字符串 YYYY/MM/DD
 */
export function gettoday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/**
 * 格式化盐场匹配数据用于导出
 * @param {Array} legionRankList - 成员详情列表
 * @param {string} queryDate - 查询日期
 * @returns {string} 格式化的文本
 */
export function formatWarrankRecordsForExport(legionRankList, queryDate) {
  if (!legionRankList || legionRankList.length === 0) {
    return "暂无战绩数据";
  }
  // 构造工作表数据
  const worksheetData = [
    [
      "排名",
      "ID",
      "区服",
      "俱乐部名",
      "战力",
      "红淬",
      "前三红淬",
      "黄金积分",
      "联盟",
      "公告",
    ],
    ...legionRankList
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((member, index) => [
        index + 1,
        member.id,
        member.serverId || member.ServerId,
        member.name || member.Clubname,
        formatPower(member.power),
        member.redQuench,
        connectstr(member.redno1, member.redno2, member.redno3),
        formatScore(member.score),
        allianceincludes(member.announcement),
        member.announcement,
      ]),
  ];

  // 初始化统计变量
  let totalmeng = 0,
    totalbig = 0,
    totalzhengyi = 0,
    totallong = 0,
    totalxi = 0,
    totalweizhi = 0;

  legionRankList.forEach((member) => {
    const alliance = allianceincludes(member.announcement);
    switch (alliance) {
      case "梦盟":
        totalmeng++;
        break;
      case "大联盟":
        totalbig++;
        break;
      case "正义联盟":
        totalzhengyi++;
        break;
      case "龙盟":
        totallong++;
        break;
      case "曦盟":
        totalxi++;
        break;
      default:
        totalweizhi++;
    }
  });

  // 联盟统计信息
  const allianceStats = {
    梦盟: totalmeng,
    大联盟: totalbig,
    正义联盟: totalzhengyi,
    龙盟: totallong,
    曦盟: totalxi,
    未知: totalweizhi,
  };

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 添加空白行分隔数据和统计信息
  XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: -1 });

  // 添加联盟统计标题行
  XLSX.utils.sheet_add_aoa(worksheet, [["联盟名称", "俱乐部数量", "占比"]], {
    origin: -1,
  });

  // 添加各联盟统计数据
  const totalClubs = legionRankList.length;
  for (const [alliance, count] of Object.entries(allianceStats)) {
    const percentage =
      totalClubs > 0 ? ((count / totalClubs) * 100).toFixed(1) + "%" : "0%";
    XLSX.utils.sheet_add_aoa(worksheet, [[alliance, count, percentage]], {
      origin: -1,
    });
  }

  // 添加总计行
  XLSX.utils.sheet_add_aoa(worksheet, [["总计", totalClubs, "100.0%"]], {
    origin: -1,
  });

  // 设置列宽
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 80 },
  ];

  // 添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, "黄金积分详情");

  // 生成文件名
  const fileName = `黄金积分详情_${queryDate.replace(/\//g, "-")}.xlsx`;

  // 触发下载
  XLSX.writeFile(workbook, fileName);
  return "";
}

const formatPower = (power) => {
  if (!power) return "0";
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + "亿";
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + "万";
  }
  return power.toString();
};

const formatScore = (score) => {
  return score.toFixed(0).toString();
};

const connectstr = (str1, str2, str3) => {
  return str1 + "," + str2 + "," + str3;
};

const allianceConfig = [
  {
    keywords: ["大联盟"],
    value: "大联盟",
  },
  {
    keywords: ["正义"],
    value: "正义联盟",
  },
  {
    keywords: ["龙盟", "龍盟"],
    value: "龙盟",
  },
  {
    keywords: ["梦", "梦盟", "梦想之盟"],
    value: "梦盟",
  },
  {
    keywords: ["曦盟"],
    value: "曦盟",
  },
];

export const allianceincludes = (str1) => {
  const matchedItem = allianceConfig.find((item) => {
    return item.keywords.some((keyword) => str1.includes(keyword));
  });

  return matchedItem ? matchedItem.value : "未知联盟";
};
