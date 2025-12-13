/**
 * 盐场匹配数据函数
 */


import * as XLSX from 'xlsx';

/**
 * 获取今天日期
 * @returns {string} 格式化的日期字符串 YYYY/MM/DD
 */
export function gettoday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`
}

/**
 * 格式化盐场匹配数据用于导出
 * @param {Array} legionRankList - 成员详情列表
 * @param {string} queryDate - 查询日期
 * @returns {string} 格式化的文本
 */
export function formatWarrankRecordsForExport(legionRankList, queryDate) {
  if (!legionRankList || legionRankList.length === 0) {
    return '暂无战绩数据'
  }
  // 构造工作表数据
  const worksheetData = [
    ['排名', 'ID' , '区服', '俱乐部名', '战力', '红淬','前三红淬', '积分', '联盟','公告'],
    ...legionRankList
      .sort((a, b) => (b.redQuench || 0) - (a.redQuench || 0))
      .map((member, index) => [
        index + 1,
	   member.id,
	   member.serverId,
        member.name,
        formatPower(member.power),
        member.redQuench,
        connectstr(member.redno1,member.redno2,member.redno3),
        formatScore(member.sRScore),
        allianceincludes(member.announcement),
        member.announcement
      ])
  ];
  
  // 初始化统计变量
let totalmeng = 0, totalbig = 0, totalzhengyi = 0, totallong = 0, totalweizhi = 0;

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
    default:
      totalweizhi++;
  }
});

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // 添加总计行
  XLSX.utils.sheet_add_aoa(worksheet, [
    ['总计', 
     '梦盟：' + totalmeng + '家',
     '大联盟：' + totalbig + '家',
     '正义联盟：' + totalzhengyi + '家',
     '龙盟：' + totallong + '家',
     '未知：' + totalweizhi + '家'
    ]
  ], { origin: -1 });
  // 设置列宽
  worksheet['!cols'] = [{wch:8}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:80}];

  // 添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '盐场匹配详情');

  // 生成文件名
  const fileName = `盐场匹配详情_${queryDate.replace(/\//g, '-')}.xlsx`;

  // 触发下载
  XLSX.writeFile(workbook, fileName);
  return ('')
}

const formatPower = (power) => {
  if (!power) return '0'
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + '亿'
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + '万'
  }
  return power.toString()
}

const formatScore = (score) => {
return score.toFixed(0).toString()
}


const connectstr = (str1,str2,str3) => {
  return str1 + ',' + str2 + ',' +str3
}

const allianceConfig = [
  {
    keywords: ['梦盟', '梦想之盟', '梦'], 
    value: '梦盟'
  },
  {
    keywords: ['大联盟'], 
    value: '大联盟'
  },
  {
    keywords: ['正义'], 
    value: '正义联盟'
  },
  {
    keywords: ['龙盟', '龍盟'], 
    value: '龙盟'
  }
];

export const allianceincludes = (str1) => {
  const matchedItem = allianceConfig.find(item => {
    return item.keywords.some(keyword => str1.includes(keyword));
  });

  return matchedItem ? matchedItem.value : "未知";
	// if (str1.includes("梦盟") || str1.includes("梦想之盟") || str1.includes("梦")){
	// 	return ("梦盟")
	// }
	// else if(str1.includes("大联盟")){
	// 	return ("大联盟")
	// }
	// else if(str1.includes("正义")){
	// 	return ("正义联盟")
	// }
	// else if(str1.includes("龙盟") || str1.includes("龍盟")){
	// 	return ("龙盟")
	// }
	// else { return ("未知") }
}
