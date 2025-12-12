/**
 * 俱乐部战斗工具函数
 */

/**
 * 获取最近的周六日期
 * 如果今天是周六，返回今天的日期；否则返回上周六的日期
 * @returns {string} 格式化的日期字符串 YYYY/MM/DD
 */
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

  sortedMembers.forEach((member, index) => {
    const { name, winCnt, loseCnt, buildingCnt } = member
    totalKills += winCnt || 0
    totalDeaths += loseCnt || 0
    totalSieges += buildingCnt || 0

    lines.push(
      `${index + 1}. ${name}  击杀${winCnt || 0}  死亡${loseCnt || 0}  攻城${buildingCnt || 0}`
    )
  })

  lines.push('')
  lines.push('─'.repeat(40))
  lines.push(`总计  击杀${totalKills}  死亡${totalDeaths}  攻城${totalSieges}`)
  lines.push('')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)

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
