import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface OperationLog {
  id: string
  timestamp: string
  page: 'shidian' | 'fish-helper'
  cardType?: string // 子卡片类型，如"武将信息"、"灯神信息"、"暑期活动"等
  operation: string // 操作名称，如"一键十殿"、"批量十殿"等
  tokenId?: string
  tokenName?: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: any // 详细信息
  command?: string // 执行的命令名称
  commandParams?: any // 命令参数
  response?: any // 命令返回结果
}

export const useOperationLogStore = defineStore('operationLog', () => {
  const logs = ref<OperationLog[]>([])
  const maxLogs = 1000 // 最多保存1000条日志

  // 添加日志
  const addLog = (log: Omit<OperationLog, 'id' | 'timestamp'>) => {
    const newLog: OperationLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      ...log
    }
    
    logs.value.unshift(newLog)
    
    // 限制日志数量
    if (logs.value.length > maxLogs) {
      logs.value = logs.value.slice(0, maxLogs)
    }
  }

  // 获取指定页面的日志
  const getLogsByPage = (page: 'shidian' | 'fish-helper') => {
    return computed(() => {
      const filteredLogs = logs.value.filter(log => log.page === page)
      // 最多显示50条日志
      return filteredLogs.slice(0, 50)
    })
  }

  // 获取指定页面和卡片类型的日志
  const getLogsByPageAndCardType = (page: 'shidian' | 'fish-helper', cardType?: string) => {
    return computed(() => {
      let filteredLogs
      if (!cardType) {
        filteredLogs = logs.value.filter(log => log.page === page)
      } else {
        filteredLogs = logs.value.filter(log => log.page === page && log.cardType === cardType)
      }
      // 最多显示50条日志
      return filteredLogs.slice(0, 50)
    })
  }

  // 清空指定页面的日志
  const clearLogsByPage = (page: 'shidian' | 'fish-helper', cardType?: string) => {
    if (!cardType) {
      logs.value = logs.value.filter(log => log.page !== page)
    } else {
      logs.value = logs.value.filter(log => !(log.page === page && log.cardType === cardType))
    }
  }

  // 清空所有日志
  const clearAllLogs = () => {
    logs.value = []
  }

  // 导出日志
  const exportLogs = (page?: 'shidian' | 'fish-helper', cardType?: string) => {
    let logsToExport
    if (page) {
      if (cardType) {
        logsToExport = logs.value.filter(log => log.page === page && log.cardType === cardType)
      } else {
        logsToExport = logs.value.filter(log => log.page === page)
      }
    } else {
      logsToExport = logs.value
    }
    const lines = []
    lines.push('='.repeat(60))
    const pageTitle = page ? (page === 'shidian' ? '十殿' : '一键金鱼') : '操作'
    const cardTitle = cardType ? `-${cardType}` : ''
    lines.push(`${pageTitle}${cardTitle}操作日志`)
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`总记录数: ${logsToExport.length}`)
    lines.push('='.repeat(60))
    lines.push('')

    logsToExport.forEach((log, index) => {
      lines.push(`[${index + 1}] ${log.timestamp}`)
      lines.push(`  页面: ${log.page === 'shidian' ? '十殿' : '一键金鱼'}`)
      if (log.cardType) {
        lines.push(`  卡片: ${log.cardType}`)
      }
      lines.push(`  操作: ${log.operation}`)
      if (log.tokenName) {
        lines.push(`  Token: ${log.tokenName}${log.tokenId ? ` (${log.tokenId})` : ''}`)
      }
      lines.push(`  状态: ${log.status === 'success' ? '成功' : log.status === 'error' ? '失败' : log.status === 'warning' ? '警告' : '信息'}`)
      lines.push(`  消息: ${log.message}`)
      if (log.command) {
        lines.push(`  命令: ${log.command}`)
        if (log.commandParams) {
          lines.push(`  命令参数: ${JSON.stringify(log.commandParams, null, 2)}`)
        }
        if (log.response) {
          lines.push(`  返回结果: ${JSON.stringify(log.response, null, 2)}`)
        }
      }
      if (log.details) {
        lines.push(`  详情: ${JSON.stringify(log.details, null, 2)}`)
      }
      lines.push('')
    })

    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const fileName = `${pageTitle}${cardTitle}_日志_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.txt`
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    logs,
    addLog,
    getLogsByPage,
    getLogsByPageAndCardType,
    clearLogsByPage,
    clearAllLogs,
    exportLogs
  }
})
