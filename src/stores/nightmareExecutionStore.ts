import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface WeekExecutionRecord {
  weekKey: string // 格式: YYYY-WW (例如: 2025-03)
  executions: Record<string, number> // tokenId -> 执行次数
  lastResetDate: string // 最后重置日期 YYYY-MM-DD
}

export const useNightmareExecutionStore = defineStore('nightmareExecution', () => {
  const records = ref<WeekExecutionRecord[]>([])

  // 获取当前周的key
  const getCurrentWeekKey = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    return `${year}-${weekNumber.toString().padStart(2, '0')}`
  }

  // 获取当前日期字符串 YYYY-MM-DD
  const getCurrentDateString = (): string => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
  }

  // 检查是否需要重置（新的一周）
  const checkAndResetIfNeeded = () => {
    const currentWeekKey = getCurrentWeekKey()
    const currentDate = getCurrentDateString()
    
    // 查找当前周的记录
    let currentWeekRecord = records.value.find(r => r.weekKey === currentWeekKey)
    
    if (!currentWeekRecord) {
      // 如果没有当前周的记录，创建新记录
      currentWeekRecord = {
        weekKey: currentWeekKey,
        executions: {},
        lastResetDate: currentDate
      }
      records.value.push(currentWeekRecord)
    } else {
      // 如果存在记录，检查是否需要重置
      const lastResetDate = new Date(currentWeekRecord.lastResetDate)
      const today = new Date(currentDate)
      
      // 计算两个日期之间的天数差
      const daysDiff = Math.floor((today.getTime() - lastResetDate.getTime()) / (24 * 60 * 60 * 1000))
      
      // 如果超过7天，说明是新的一周，重置执行次数
      if (daysDiff >= 7) {
        currentWeekRecord.executions = {}
        currentWeekRecord.lastResetDate = currentDate
      }
    }
    
    // 清理旧记录（保留最近4周的记录）
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    records.value = records.value.filter(r => {
      const [year, week] = r.weekKey.split('-')
      const recordDate = new Date(parseInt(year), 0, 1)
      recordDate.setDate(recordDate.getDate() + (parseInt(week) - 1) * 7)
      return recordDate >= fourWeeksAgo
    })
  }

  // 记录执行次数（仅对殿2/5/7的token）
  const recordExecution = (tokenId: string, dianLevel: number | null) => {
    // 只记录殿2、5、7的token
    if (!dianLevel || ![2, 5, 7].includes(dianLevel)) {
      return
    }
    
    checkAndResetIfNeeded()
    
    const currentWeekKey = getCurrentWeekKey()
    let currentWeekRecord = records.value.find(r => r.weekKey === currentWeekKey)
    
    if (!currentWeekRecord) {
      currentWeekRecord = {
        weekKey: currentWeekKey,
        executions: {},
        lastResetDate: getCurrentDateString()
      }
      records.value.push(currentWeekRecord)
    }
    
    if (!currentWeekRecord.executions[tokenId]) {
      currentWeekRecord.executions[tokenId] = 0
    }
    
    currentWeekRecord.executions[tokenId]++
  }

  // 获取token的本周执行次数
  const getExecutionCount = (tokenId: string): number => {
    checkAndResetIfNeeded()
    
    const currentWeekKey = getCurrentWeekKey()
    const currentWeekRecord = records.value.find(r => r.weekKey === currentWeekKey)
    
    if (!currentWeekRecord) {
      return 0
    }
    
    return currentWeekRecord.executions[tokenId] || 0
  }

  // 获取所有token的本周执行次数
  const getAllExecutionCounts = (): Record<string, number> => {
    checkAndResetIfNeeded()
    
    const currentWeekKey = getCurrentWeekKey()
    const currentWeekRecord = records.value.find(r => r.weekKey === currentWeekKey)
    
    if (!currentWeekRecord) {
      return {}
    }
    
    return { ...currentWeekRecord.executions }
  }

  // 清空指定token的执行次数
  const clearExecutionCount = (tokenId: string) => {
    checkAndResetIfNeeded()
    
    const currentWeekKey = getCurrentWeekKey()
    const currentWeekRecord = records.value.find(r => r.weekKey === currentWeekKey)
    
    if (currentWeekRecord && currentWeekRecord.executions[tokenId]) {
      delete currentWeekRecord.executions[tokenId]
    }
  }

  // 清空所有执行次数
  const clearAllExecutionCounts = () => {
    checkAndResetIfNeeded()
    
    const currentWeekKey = getCurrentWeekKey()
    const currentWeekRecord = records.value.find(r => r.weekKey === currentWeekKey)
    
    if (currentWeekRecord) {
      currentWeekRecord.executions = {}
    }
  }

  return {
    records,
    recordExecution,
    getExecutionCount,
    getAllExecutionCounts,
    clearExecutionCount,
    clearAllExecutionCounts,
    checkAndResetIfNeeded
  }
})
