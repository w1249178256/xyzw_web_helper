/**
 * 俱乐部战斗工具函数
 */

/**
 * 获取最近的周六日期
 * 如果今天是周六，返回今天的日期；否则返回上周六的日期
 * @returns {string} 格式化的日期字符串 YYYY/MM/DD
 */
import * as XLSX from 'xlsx';
 
export function getLastSaturday() {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=周日, 1=周一, ..., 6=周六

  let daysToSubtract = 0
  if (dayOfWeek === 6) {
    // 今天是周六
    daysToSubtract = 0
  } else if (dayOfWeek === 0) {
    // 今天是周日，返回昨天（周六）
    daysToSubtract = 1
  } else {
    // 周一到周五，计算距离上周六的天数
    daysToSubtract = dayOfWeek + 1
  }

  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() - daysToSubtract)

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')

  return `${year}/${month}/${day}`
}

export function formatTimestamp1(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// 获取战斗情况
const getBattleWinFlag = (newWinFlag) => {
  if (newWinFlag === 2) {
    return('胜利')
  } else {
    return('失败')
  }
}

// 获取进攻防守方情况
const getBattleAttackType = (attackType) => {
  if (attackType === 0) {
    return('进攻方')
  } else {
    return('防守方')
  }
}
// 使用示例
/**
 * 格式化时间戳为可读时间
 * @param {number} timestamp - Unix时间戳（秒）
 * @returns {string} 格式化的时间字符串
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 解析战斗结果标志
 * @param {number} newWinFlag - 战斗结果标志 (1=败, 2=胜)
 * @returns {string} "胜利" 或 "失败"
 */
export function parseBattleResult(newWinFlag) {
  return newWinFlag === 2 ? '胜利' : '失败'
}

/**
 * 解析攻击类型
 * @param {number} attackType - 攻击类型 (0=进攻, 1=防守)
 * @returns {string} "进攻" 或 "防守"
 */
export function parseAttackType(attackType) {
  return attackType === 0 ? '进攻' : '防守'
}

/**
 * 格式化成员战绩数据用于导出
 * @param {Array} roleDetailsList - 成员详情列表
 * @param {string} queryDate - 查询日期
 * @returns {string} 格式化的文本
 */
export function formatBattleRecordsForExport(roleDetailsList, queryDate) {
  if (!roleDetailsList || roleDetailsList.length === 0) {
    return '暂无战绩数据'
  }

  const lines = [
    `俱乐部盐场战绩 - ${queryDate}`,
    `参战人数: ${roleDetailsList.length}`,
    '─'.repeat(40),
    ''
  ]
  // 按击杀数排序
  const sortedMembers = [...roleDetailsList].sort((a, b) => (b.winCnt || 0) - (a.winCnt || 0))

  // 计算总计
  let totalKills = 0
  let totalDeaths = 0
  let totalSieges = 0
  let totalResurrection = 0

  sortedMembers.forEach((member, index) => {
    const { name, winCnt, loseCnt, buildingCnt} = member
    const Resurrection = Math.max(loseCnt - 6, 0)
    totalKills += winCnt || 0
    totalDeaths += loseCnt || 0
    totalSieges += buildingCnt || 0
    totalResurrection += Resurrection || 0

    lines.push(
      `${index + 1}. ${name}  击杀${winCnt || 0}  死亡${loseCnt || 0}  攻城${buildingCnt || 0}  复活丹${Resurrection || 0}`
    )
  })

  lines.push('')
  lines.push('─'.repeat(40))
  lines.push(`总计  击杀${totalKills}  死亡${totalDeaths}  攻城${totalSieges}  复活丹${totalResurrection}`)
  lines.push('')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)

  // 构造盐场数据工作表
  const worksheetData = [
    ['排名', 'ID' , '成员名称', '击杀数', '死亡数', '攻城数', 'K/D', '复活丹'],
    ...roleDetailsList
      .sort((a, b) => (b.winCnt || 0) - (a.winCnt || 0))
      .map((member, index) => [
        index + 1,
        member.roleId || 0,
        member.name || '',
        member.winCnt || 0,
        member.loseCnt || 0,
        member.buildingCnt || 0,
        (member.winCnt / member.loseCnt).toFixed(2),
        Math.max(member.loseCnt - 6, 0),
      ])
  ];


  // 构造战斗数据工作表
  const processedData = roleDetailsList.map((member, index) => {  
  const targetRoleList = member.targetRoleList || [];
  return targetRoleList
    .filter(battle => battle !== null)
    .map((battle, battleIndex) => {  
  	const targetRoleInfo = battle.targetRoleInfo || {};
    return [  
      battle.roleInfo.roleId || 0,  
      battle.roleInfo.name || '',  
      targetRoleInfo.roleId || 0,  
      targetRoleInfo.name || '',
      battle.attackType || 0,
      battle.newWinFlag || 0,
      battle.timestamp || 0
    ];  
  });  
}).flat();  // 将成员的战斗记录数组“扁平化”为单个大数组
const keys = ["roleId", "roleName", "targetRoleId", "targetRoleName","attackType","newWinFlag","timestamp"];
const processedDataWithKeys = processedData.map(subArray => {
  const obj = {};
  for (let i = 0; i < subArray.length; i++) {
    obj[keys[i]] = subArray[i]; // 用键名映射字段值
  }
  return obj;
});

  console.log(processedDataWithKeys);
  const worksheetData1 = [
    ['玩家ID', '玩家名称' , '对手ID', '对手名称', '对战方' , '战斗结果' , '战斗时间'],
    ...processedDataWithKeys
      .map((battle, index) => [
        battle.roleId || 0,
        battle.roleName || '',
        battle.targetRoleId || 0,
        battle.targetRoleName || '',
        parseAttackType(battle.attackType || 0),
        parseBattleResult(battle.newWinFlag || 0),
        formatTimestamp(battle.timestamp || 0)
      ])
  ];
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const worksheet1 = XLSX.utils.aoa_to_sheet(worksheetData1);
  // 添加总计行
  XLSX.utils.sheet_add_aoa(worksheet, [
    ['总计', '', '',
     roleDetailsList.reduce((sum, m) => sum + (m.winCnt || 0), 0),
     roleDetailsList.reduce((sum, m) => sum + (m.loseCnt || 0), 0),
     roleDetailsList.reduce((sum, m) => sum + (m.buildingCnt || 0), 0),
     roleDetailsList.reduce((sum, m) => sum + (Math.max(m.loseCnt - 6, 0) || 0), 0)
    ]
  ], { origin: -1 });

  // 设置列宽
  worksheet['!cols'] = [{wch:8}, {wch:15}, {wch:15}, {wch:8}, {wch:8}, {wch:8}];
  worksheet1['!cols'] = [{wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}];

  // 添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '战绩数据');
  XLSX.utils.book_append_sheet(workbook, worksheet1, '战斗数据');

  // 生成文件名
  const fileName = `俱乐部战绩_${queryDate.replace(/\//g, '-')}.xlsx`;

  // 触发下载
  XLSX.writeFile(workbook, fileName);
  return lines.join('\n')
}
/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // 现代浏览器
    await navigator.clipboard.writeText(text)
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
    } catch (err) {
      throw new Error('复制失败')
    } finally {
      textArea.remove()
    }
  }
}
