<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <TrendingUp />
      </n-icon>
    </template>
    <template #title>
      <h3>怪异塔</h3>
    </template>
    <template #badge>
      <span>{{ isRunning ? '执行中' : '就绪' }}</span>
    </template>
    <template #default>
      <div class="weird-tower-content">
        <!-- 怪异塔信息显示 -->
        <div class="tower-info-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <CustomizedCard mode="name-count" name="当前层数" :count="displayFloor" />
            <CustomizedCard mode="name-count" name="爬塔能量" :count="String(towerEnergy)" />
          </CustomizedCard>
        </div>

        <!-- 所有怪异塔操作按钮 -->
        <div class="tower-actions-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <CustomizedCard 
              mode="execution-range" 
              name="执行范围" 
              v-model:inputValue="batchTokens" 
              placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
              @update:inputValue="handleBatchTokensInput" 
            />
            <CustomizedCard 
              mode="button-number-input" 
              name="执行间隔(ms)" 
              v-model:inputValue="commandDelay" 
              placeholder="输入间隔毫秒" 
              @update:inputValue="handleCommandDelayInput" 
            />
            <CustomizedCard 
              mode="button" 
              name="开始爬塔" 
              :disabled="!selectedTokenId || isRunning || towerEnergy <= 0"
              :loading="isRunning"
              @button-click="startTowerClimb" 
            />
            <CustomizedCard 
              mode="button" 
              name="停止爬塔" 
              :disabled="!selectedTokenId || !isRunning"
              @button-click="stopTowerClimb" 
            />
            <CustomizedCard 
              mode="button" 
              name="刷新信息" 
              :disabled="!selectedTokenId || isRunning"
              @button-click="refreshTowerInfo" 
            />
            <CustomizedCard 
              mode="button" 
              name="一键使用道具" 
              :disabled="!selectedTokenId || isRunning || isUsingItems || isMerging"
              @button-click="startUseItems" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isMerging ? '合成中...' : '一键合成'" 
              :disabled="!selectedTokenId || isRunning || isUsingItems || isMerging"
              @button-click="autoMergeItems" 
            />
            <CustomizedCard 
              v-if="isUsingItems"
              mode="button" 
              name="停止使用"
              :disabled="!selectedTokenId"
              @button-click="stopUsingItems" 
            />
            <CustomizedCard 
              v-if="isMerging"
              mode="button" 
              name="停止合成"
              :disabled="!selectedTokenId"
              @button-click="stopAutoMerge" 
            />
            <CustomizedCard 
              mode="button" 
              name="领取任务奖励" 
              :disabled="!selectedTokenId || isRunning"
              @button-click="claimTaskReward" 
            />
            <CustomizedCard 
              mode="button" 
              name="批量特权领取" 
              :disabled="isBatchPrivilegeRunning"
              @button-click="batchClaimLegionPrivilege" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isBatchClaimingFreeKey ? '批量领取中...' : '批量领取免费钥匙'" 
              :disabled="tokenStore.gameTokens.length === 0 || isBatchClaimingFreeKey" 
              @button-click="handleBatchClaimFreeKey" 
            />
            <CustomizedCard 
              mode="button" 
              name="批量怪异塔" 
              :disabled="!selectedTokenId || isRunning"
              @button-click="batchWeirdTower" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isBatchRunning ? '批量爬塔中...' : '批量爬塔'" 
              :disabled="tokenStore.gameTokens.length === 0 || isBatchRunning" 
              @button-click="handleBatchClimb" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isBatchQuickClimbing ? '批量开启爬塔中...' : '批量开启爬塔'" 
              :disabled="tokenStore.gameTokens.length === 0 || isBatchQuickClimbing" 
              @button-click="handleBatchQuickClimb" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isExportingTowerInfo ? '导出中...' : '批量导出爬塔信息'" 
              :disabled="tokenStore.gameTokens.length === 0 || isExportingTowerInfo" 
              @button-click="handleExportTowerInfo" 
            />
          </CustomizedCard>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="怪异塔"
        :filter-operations="['开始爬塔', '停止爬塔', '刷新信息', '一键使用道具', '一键合成', '领取任务奖励', '批量特权领取', '批量怪异塔', '批量爬塔', '批量开启爬塔', '批量导出爬塔信息', '批量领取免费钥匙']"
      />
    </template>
  </MyCard>
</template>

<script setup>
// @unocss-include
// uno-css-ignore-file
import { defineProps, ref, computed, watch, onUnmounted } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { TrendingUp } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 20,
  connectionTimeout: 3000,
  maxRetries: 2
})

// 辅助函数：获取token的序号（基于名称排序后的顺序）
const getTokenIndex = (token) => {
  const gameTokens = [...tokenStore.gameTokens]
  const sortedTokens = gameTokens.sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  const index = sortedTokens.findIndex(t => t.id === token.id)
  return index + 1
}

// 组件卸载前清理连接池
onUnmounted(async () => {
  try {
    await connectionPool.destroy()
    console.log('[WeirdTowerCard] 连接池已清理')
  } catch (error) {
    console.error('[WeirdTowerCard] 清理连接池失败:', error)
  }
})

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 操作状态
const isRunning = ref(false)
const isBatchRunning = ref(false)
const isUsingItems = ref(false)
const isMerging = ref(false)
const batchTokens = ref('')
const commandDelay = ref(localStorage.getItem('weirdTowerCommandDelay') || '1200')
const stopFlag = ref(false)
const stopItemFlag = ref(false)
const stopMergeFlag = ref(false)
const climbTimeout = ref(null)
const itemTimeout = ref(null)
const mergeTimeout = ref(null)
const isBatchPrivilegeRunning = ref(false)
const isBatchQuickClimbing = ref(false)
const isExportingTowerInfo = ref(false)
const isBatchClaimingFreeKey = ref(false)

// 计算属性：怪异塔信息
const evoTowerInfo = computed(() => {
  // 优先从全局 gameData 获取
  const globalData = tokenStore.gameData?.evoTowerInfo
  if (globalData) {
    return globalData
  }
  
  // 从 token.gameData 获取
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (token && token.gameData && token.gameData.evoTowerInfo) {
    return token.gameData.evoTowerInfo
  }
  
  return null
})

const weirdTowerData = computed(() => {
  return evoTowerInfo.value?.evoTower || null
})

const currentTowerId = computed(() => {
  return weirdTowerData.value?.towerId || 0
})

const displayFloor = computed(() => {
  const towerId = currentTowerId.value
  if (towerId === 0) {
    return "1-1"
  } else {
    // 计算章节和层数
    // 每章10层，0-9为第1章，10-19为第2章，20-29为第3章，以此类推
    const chapter = Math.floor(towerId / 10) + 1
    const floor = (towerId % 10) + 1
    return `${chapter}-${floor}`
  }
})

const towerEnergy = computed(() => {
  return weirdTowerData.value?.energy || 0
})

// 计算当前活动周
const getCurrentActivityWeek = computed(() => {
  const now = new Date()
  const start = new Date('2025-12-12T12:00:00') // 起始时间：黑市周开始
  const weekDuration = 7 * 24 * 60 * 60 * 1000 // 一周毫秒数
  const cycleDuration = 3 * weekDuration // 三周期毫秒数
  
  const elapsed = now - start
  if (elapsed < 0) return null // 活动开始前
  
  const cyclePosition = elapsed % cycleDuration
  
  if (cyclePosition < weekDuration) {
    return '黑市周'
  } else if (cyclePosition < 2 * weekDuration) {
    return '招募周'
  } else {
    return '宝箱周'
  }
})

const isWeirdTowerActivityOpen = computed(() => {
  return getCurrentActivityWeek.value === '黑市周'
})

// 处理执行范围输入
const handleBatchTokensInput = (value) => {
  batchTokens.value = value
}

const handleCommandDelayInput = (value) => {
  commandDelay.value = value
  localStorage.setItem('weirdTowerCommandDelay', value)
}

const waitCommandDelay = () => new Promise(resolve => setTimeout(resolve, parseInt(commandDelay.value) || 1200))

// 解析执行范围
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null // null表示执行全部
  }
  
  const tokens = []
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      // 处理范围格式：1-3
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tokens.push(i)
        }
      }
    } else {
      // 处理单个数字：1
      const num = Number(trimmed)
      if (!isNaN(num)) {
        tokens.push(num)
      }
    }
  }
  
  return tokens.length > 0 ? tokens : null
}

// 获取怪异塔信息
const getTowerInfo = async (tokenId) => {
  if (!tokenId) {
    tokenId = props.selectedTokenId
  }
  
  if (!tokenId) {
    return
  }

  try {
    const status = tokenStore.getWebSocketStatus(tokenId)
    if (status !== 'connected') {
      return
    }
    
    // 获取怪异塔信息
    await tokenStore.sendMessageWithPromise(
      tokenId,
      'evotower_getinfo',
      {},
      5000
    )
    
    // 更新角色信息
    await tokenStore.sendGameMessage(tokenId, 'role_getroleinfo', {})
  } catch (error) {
    console.error('获取怪异塔信息失败:', error)
  }
}

// 开始爬塔
const startTowerClimb = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  if (!isWeirdTowerActivityOpen.value) {
    message.warning('怪异塔活动未开始或已结束')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  if (towerEnergy.value <= 0) {
    message.warning('爬塔能量不足')
    return
  }

  // 清除之前的超时
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }

  isRunning.value = true
  stopFlag.value = false
  let climbCount = 0
  const maxClimb = 100 // 最多批量次数，防止死循环
  
  // 设置超时保护，60秒后自动重置状态
  climbTimeout.value = setTimeout(() => {
    isRunning.value = false
    climbTimeout.value = null
    stopFlag.value = true
    message.info('批量爬塔已超时自动停止')
  }, 60000)

  try {
    const tokenId = token.id
    for (let i = 0; i < maxClimb; i++) {
      if (stopFlag.value) break

      // 检查当前能量
      await getTowerInfo(tokenId)
      const currentEnergy = towerEnergy.value
      if (currentEnergy <= 0) break

      // 准备战斗
      await tokenStore.sendMessageWithPromise(
        tokenId,
        'evotower_readyfight',
        {},
        5000
      )

      // 执行战斗
      const fightResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        'evotower_fight',
        {
          battleNum: 1,
          winNum: 1
        },
        10000
      )

      climbCount++
      message.info(`第${climbCount}次爬塔命令已发送`)

      // 更新爬塔信息
      await getTowerInfo(tokenId)

      // 检查是否刚通关10层（即当前层是1-1, 2-1, 3-1等）
      const towerId = currentTowerId.value
      const floor = (towerId % 10) + 1
      if (
        fightResult &&
        fightResult.winList &&
        fightResult.winList[0] === true &&
        floor === 1
      ) {
        // 领取通关奖励
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'evotower_claimreward',
          {},
          5000
        )
        message.success(`成功领取第${Math.floor(towerId / 10)}章通关奖励！`)
      }

      await waitCommandDelay() // 每次间隔
    }
    
    // 获取免费道具数量
    try {
      const freeEnergyResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        'mergebox_getinfo',
        {
          actType: 1
        },
        5000
      )
      if (freeEnergyResult && freeEnergyResult.mergeBox && freeEnergyResult.mergeBox.freeEnergy > 0) {
        // 领取免费道具
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'mergebox_claimfreeenergy',
          {
            actType: 1
          },
          5000
        )
        message.success(`成功领取免费道具${freeEnergyResult.mergeBox.freeEnergy}个！`)
      }
    } catch (error) {
      // 忽略免费道具领取失败
    }
    
    await waitCommandDelay()
    
    // 获取最终状态
    const finalTowerId = currentTowerId.value
    const finalChapter = Math.floor(finalTowerId / 10) + 1
    const finalFloor = (finalTowerId % 10) + 1
    const finalDisplayFloor = `${finalChapter}-${finalFloor}`
    const finalEnergy = towerEnergy.value
    
    message.success(`已自动爬塔${climbCount}次，当前层数${finalDisplayFloor}，剩余能量${finalEnergy}。`)
    
    // 添加操作日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${tokenIndex}、${token.name || token.id}、爬塔完成，共${climbCount}次，当前层数${finalDisplayFloor}，剩余能量${finalEnergy}`,
      details: {
        climbCount,
        currentFloor: finalDisplayFloor,
        currentTowerId: finalTowerId,
        remainingEnergy: finalEnergy
      }
    })
  } catch (error) {
    console.error('批量爬塔失败:', error)
    message.error('批量爬塔失败: ' + (error.message || '未知错误'))
    
    // 添加错误日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${tokenIndex}、${token.name || token.id}、爬塔失败: ${error.message || '未知错误'}`
    })
  }

  // 清除超时并重置状态
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }
  isRunning.value = false
}

// 停止爬塔
const stopTowerClimb = () => {
  stopFlag.value = true
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }
  isRunning.value = false
  message.info('已手动停止批量爬塔')
}

// 刷新怪异塔信息
const refreshTowerInfo = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在刷新怪异塔信息...')
    await getTowerInfo(token.id)
    message.success('怪异塔信息刷新成功')
  } catch (error) {
    console.error('刷新怪异塔信息失败:', error)
    message.error('刷新怪异塔信息失败')
  }
}

// 领取怪异塔奖励
const claimTowerReward = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在领取怪异塔奖励...')
    await tokenStore.sendMessageWithPromise(
      token.id,
      'evotower_claimreward',
      {},
      5000
    )
    message.success('领取奖励成功')
    // 刷新信息
    await getTowerInfo(token.id)
  } catch (error) {
    console.error('领取怪异塔奖励失败:', error)
    message.error('领取怪异塔奖励失败')
  }
}

// 批量领取军团特权
const batchClaimLegionPrivilege = async () => {
  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(batchTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    // 留空执行全部
    targetTokens = sortedTokensList
  } else {
    // 根据执行范围获取目标token
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  try {
    isBatchPrivilegeRunning.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量领取军团特权（${rangeText}），共${targetTokens.length}个Token...`)
    
    // 定义特权领取操作函数
    const privilegeOperation = async (token, globalIndex) => {
      const tokenIndex = globalIndex + 1
      let successCount = 0
      
      try {
        // 最多领取4次，如果提示错误则跳过剩余领取
        for (let i = 0; i < 4; i++) {
          try {
            await tokenStore.sendEvotowerClaimLegionPrivilege(token.id, {})
            successCount++
            await waitCommandDelay()
          } catch (error) {
            // 如果领取失败（如已领取过），跳过剩余领取
            console.log(`序号 ${tokenIndex} ${token.name || token.id} 第${i+1}次领取失败，跳过剩余领取:`, error.message)
            break
          }
        }
        
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 军团特权领取完成，成功${successCount}次`)
        
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量特权领取',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、军团特权领取完成，成功${successCount}次`,
          details: {
            successCount
          }
        })
        
        return { successCount }
      } catch (error) {
        console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量特权领取失败:`, error)
        message.error(`序号 ${tokenIndex} ${token.name || token.id}: 特权领取失败 - ${error.message || '未知错误'}`)
        
        // 添加错误日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量特权领取',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `${tokenIndex}、${token.name || token.id}、特权领取失败: ${error.message || '未知错误'}`
        })
        
        throw error
      }
    }
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      privilegeOperation,
      {
        batchSize: 20,
        delayBetween: 100,
        keepConnections: true,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`[序号${progress.globalIndex}] ${progress.tokenName} 正在连接...`)
          } else if (progress.type === 'token-success' && progress.message === '连接成功') {
            message.success(`[序号${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error' && progress.message === '连接失败，跳过') {
            message.warning(`[序号${progress.globalIndex}] ${progress.tokenName} 连接失败，跳过`)
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量特权领取完成（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('批量特权领取失败:', error)
    message.error('批量特权领取失败: ' + (error.message || '未知错误'))
  } finally {
    isBatchPrivilegeRunning.value = false
  }
}

// 开箱
const openBox = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在开箱...')
    await tokenStore.sendMergeboxOpenBox(token.id, {})
    message.success('开箱完成')
    // 刷新信息
    await getTowerInfo(token.id)
  } catch (error) {
    console.error('开箱失败:', error)
    message.error('开箱失败: ' + (error.message || '未知错误'))
  }
}

// 合成物品
const mergeItem = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在合成物品...')
    await tokenStore.sendMergeboxMergeItem(token.id, {})
    message.success('合成完成')
    // 刷新信息
    await getTowerInfo(token.id)
  } catch (error) {
    console.error('合成失败:', error)
    message.error('合成失败: ' + (error.message || '未知错误'))
  }
}

// 领取消耗进度奖励
const claimCostProgress = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在领取奖励钥匙...')
    await tokenStore.sendMergeboxClaimCostProgress(token.id, {})
    message.success('领取奖励钥匙完成')
    // 刷新信息
    await getTowerInfo(token.id)
  } catch (error) {
    console.error('领取奖励钥匙失败:', error)
    message.error('领取奖励钥匙失败: ' + (error.message || '未知错误'))
  }
}

// 领取任务奖励
const claimTaskReward = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在领取任务奖励...')
    await tokenStore.sendEvotowerClaimTask(token.id, {})
    message.success('领取任务奖励完成')
    
    // 添加操作日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '领取任务奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${tokenIndex}、${token.name || token.id}、领取任务奖励完成`
    })
    
    // 刷新信息
    await getTowerInfo(token.id)
  } catch (error) {
    console.error('领取任务奖励失败:', error)
    message.error('领取任务奖励失败: ' + (error.message || '未知错误'))
    
    // 添加错误日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '领取任务奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${tokenIndex}、${token.name || token.id}、领取任务奖励失败: ${error.message || '未知错误'}`
    })
  }
}

// 领取合成进度奖励
const claimMergeProgress = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在领取合成奖励...')
    await tokenStore.sendMergeboxClaimMergeProgress(token.id, {})
    message.success('领取合成奖励完成')
    // 刷新信息
    await getTowerInfo(token.id)
  } catch (error) {
    console.error('领取合成奖励失败:', error)
    message.error('领取合成奖励失败: ' + (error.message || '未知错误'))
  }
}

// 停止操作的函数
const stopUsingItems = () => {
  stopItemFlag.value = true
  if (itemTimeout.value) {
    clearTimeout(itemTimeout.value)
    itemTimeout.value = null
  }
  isUsingItems.value = false
  message.info('已手动停止使用道具')
}

const stopAutoMerge = () => {
  stopMergeFlag.value = true
  if (mergeTimeout.value) {
    clearTimeout(mergeTimeout.value)
    mergeTimeout.value = null
  }
  isMerging.value = false
  message.info('已手动停止一键合成')
}

// 一键使用道具
const startUseItems = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  isUsingItems.value = true
  stopItemFlag.value = false
  
  // 设置超时保护，60秒后自动重置状态
  itemTimeout.value = setTimeout(() => {
    isUsingItems.value = false
    itemTimeout.value = null
    stopItemFlag.value = true
    message.info('一键使用道具已超时自动停止')
  }, 60000)
  
  try {
    const tokenId = token.id
    
    // 1. 获取活动信息
    const infoRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "mergebox_getinfo",
      { actType: 1 },
      5000
    )

    // 获取怪异塔信息以读取剩余道具数量
    const towerInfoRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "evotower_getinfo",
      {},
      5000
    )

    if (!infoRes || !infoRes.mergeBox) {
      throw new Error("获取活动信息失败")
    }

    let costTotalCnt = infoRes.mergeBox.costTotalCnt || 0
    let lotteryLeftCnt = towerInfoRes?.evoTower?.lotteryLeftCnt || 0

    if (lotteryLeftCnt <= 0) {
      message.info("没有剩余道具可使用")
      isUsingItems.value = false
      if (itemTimeout.value) clearTimeout(itemTimeout.value)
      return
    }

    message.success(`开始使用道具，剩余：${lotteryLeftCnt}，已用：${costTotalCnt}`)
    let processedCount = 0

    while (lotteryLeftCnt > 0 && !stopItemFlag.value) {
      let pos = {}
      if (costTotalCnt < 2) {
        pos = { gridX: 4, gridY: 5 }
      } else if (costTotalCnt < 102) {
        pos = { gridX: 7, gridY: 3 }
      } else {
        pos = { gridX: 6, gridY: 3 }
      }

      // 2. 使用道具
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "mergebox_openbox",
        {
          actType: 1,
          pos: pos
        },
        5000
      )

      costTotalCnt++
      lotteryLeftCnt--
      processedCount++

      await waitCommandDelay()
    }

    // 领取累计奖励
    await tokenStore.sendMessageWithPromise(
      tokenId,
      "mergebox_claimcostprogress",
      { actType: 1 },
      5000
    ).catch(() => {})

    message.success(`已使用道具 ${processedCount} 次`)
    
    // 添加操作日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '一键使用道具',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${tokenIndex}、${token.name || token.id}、已使用道具 ${processedCount} 次`,
      details: {
        processedCount,
        remainingItems: lotteryLeftCnt
      }
    })
    
    // 刷新一下
    await getTowerInfo(tokenId)

  } catch (error) {
    message.error("使用道具失败: " + (error.message || "未知错误"))
    
    // 添加错误日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '一键使用道具',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${tokenIndex}、${token.name || token.id}、使用道具失败: ${error.message || '未知错误'}`
    })
  } finally {
    if (itemTimeout.value) {
      clearTimeout(itemTimeout.value)
      itemTimeout.value = null
    }
    isUsingItems.value = false
  }
}

// 一键合成
const autoMergeItems = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  isMerging.value = true
  stopMergeFlag.value = false
  
  // 设置超时保护，60秒后自动重置状态
  mergeTimeout.value = setTimeout(() => {
    isMerging.value = false
    mergeTimeout.value = null
    stopMergeFlag.value = true
    message.info('一键合成已超时自动停止')
  }, 60000)
  
  try {
    const tokenId = token.id
    message.loading('正在执行一键合成...')

    let loopCount = 0
    const MAX_LOOPS = 20

    while (loopCount < MAX_LOOPS && !stopMergeFlag.value) {
      loopCount++

      // 获取当前信息
      const infoRes = await tokenStore.sendMessageWithPromise(
        tokenId,
        "mergebox_getinfo",
        { actType: 1 },
        5000
      )

      if (!infoRes || !infoRes.mergeBox) {
         throw new Error("返回数据缺少 mergeBox")
      }

      // 领取合成奖励
      if (infoRes.mergeBox.taskMap) {
        const taskMap = infoRes.mergeBox.taskMap
        const taskClaimMap = infoRes.mergeBox.taskClaimMap || {}

        for (const taskId in taskMap) {
          if (stopMergeFlag.value) break
          if (taskMap[taskId] !== 0 && !taskClaimMap[taskId]) {
             await tokenStore.sendMessageWithPromise(
               tokenId,
               "mergebox_claimmergeprogress",
               { actType: 1, taskId: parseInt(taskId) },
               2000
             ).catch(() => {})
             await waitCommandDelay()
            }
          }
      }

      // 解析 gridMap
      const gridMap = infoRes.mergeBox.gridMap || {}
      const items = []

      // 收集所有 gridConfId === 0 的物品
      for (const xStr in gridMap) {
        for (const yStr in gridMap[xStr]) {
          const item = gridMap[xStr][yStr]
          if (item.gridConfId == 0 && item.gridItemId > 0 && !item.isLock) {
            items.push({
              x: parseInt(xStr),
              y: parseInt(yStr),
              id: item.gridItemId
            })
          }
        }
      }

      // 按 gridItemId 分组
      const groupedItems = {}
      items.forEach(item => {
        if (!groupedItems[item.id]) {
          groupedItems[item.id] = []
        }
        groupedItems[item.id].push(item)
      })

      // 检查是否有可合成项
      let hasPotentialMerge = false
      for (const id in groupedItems) {
        if (groupedItems[id].length >= 2) {
          hasPotentialMerge = true
          break
        }
      }

      if (!hasPotentialMerge) {
        if (loopCount === 1) {
          message.info("当前没有可合成的物品")
        }
        break
      }

      const isLevel8OrAbove = infoRes.mergeBox.taskMap && infoRes.mergeBox.taskMap["251212208"] && infoRes.mergeBox.taskMap["251212208"] !== 0

      if (isLevel8OrAbove) {
        // 8级以上使用智能合成
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "mergebox_automergeitem",
          { actType: 1 },
          10000 
        )
        await waitCommandDelay()
      } else {
        // 8级以下手动合成
        for (const id in groupedItems) {
          if (stopMergeFlag.value) break
          const group = groupedItems[id]
          // 两两合成
          while (group.length >= 2) {
            if (stopMergeFlag.value) break
            const source = group.shift()
            const target = group.shift()

            await tokenStore.sendMessageWithPromise(
              tokenId,
              "mergebox_mergeitem",
              {
                actType: 1,
                sourcePos: { gridX: source.x, gridY: source.y },
                targetPos: { gridX: target.x, gridY: target.y }
              },
              1000
            ).catch(() => {})
            await waitCommandDelay()
          }
        }
      }
      
      // 继续下一轮循环
      await waitCommandDelay()
    }

    message.success("一键合成操作完成")
    
    // 添加操作日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '一键合成',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${tokenIndex}、${token.name || token.id}、一键合成操作完成`,
      details: {
        loopCount
      }
    })
    
    // 刷新一下
    await getTowerInfo(token.id)

  } catch (error) {
    message.error("一键合成失败: " + (error.message || "未知错误"))
    
    // 添加错误日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '一键合成',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${tokenIndex}、${token.name || token.id}、一键合成失败: ${error.message || '未知错误'}`
    })
  } finally {
    if (mergeTimeout.value) {
      clearTimeout(mergeTimeout.value)
      mergeTimeout.value = null
    }
    isMerging.value = false
  }
}

// 批量怪异塔（暂时空白）
const batchWeirdTower = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('批量怪异塔功能待实现...')
    // TODO: 实现批量怪异塔逻辑
    message.warning('批量怪异塔功能暂未实现')
  } catch (error) {
    console.error('批量怪异塔失败:', error)
    message.error('批量怪异塔失败: ' + (error.message || '未知错误'))
  }
}

// 批量爬塔
const handleBatchClimb = async () => {
  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(batchTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    // 留空执行全部
    targetTokens = sortedTokensList
  } else {
    // 根据执行范围获取目标token
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  try {
    isBatchRunning.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量爬塔（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
    
    // 定义爬塔操作函数
    const towerClimbOperation = async (token, globalIndex) => {
      const tokenIndex = globalIndex + 1
      
      try {
        // 添加开始日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、开始爬塔`
        })
        
        // 获取怪异塔信息（直接从响应获取）
        const towerInfoRes = await tokenStore.sendMessageWithPromise(
          token.id,
          'evotower_getinfo',
          {},
          5000
        )
        
        // 从响应中直接获取能量
        let currentEnergy = towerInfoRes?.evoTower?.energy || 0
        let currentTowerId = towerInfoRes?.evoTower?.towerId || 0
        
        // 计算初始层数
        const initChapter = Math.floor(currentTowerId / 10) + 1
        const initFloor = (currentTowerId % 10) + 1
        const initDisplayFloor = `${initChapter}-${initFloor}`
        
        await waitCommandDelay()
        
        // 记录初始信息
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、初始层数：${initDisplayFloor}，能量：${currentEnergy}`
        })
        
        // 执行爬塔逻辑（模拟点击开始爬塔按钮）
        let climbCount = 0
        const maxClimb = 400
        
        if (currentEnergy <= 0) {
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 能量不足，跳过爬塔`)
          
          // 添加操作日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '怪异塔',
            operation: '批量爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、能量不足，跳过爬塔`,
            details: {
              remainingEnergy: 0
            }
          })
          
          return { climbCount: 0, currentFloor: initDisplayFloor, remainingEnergy: 0 }
        }
        
        for (let j = 0; j < maxClimb; j++) {
          // 检查当前能量
          if (currentEnergy <= 0) break

          // 准备战斗
          await tokenStore.sendMessageWithPromise(
            token.id,
            'evotower_readyfight',
            {},
            5000
          )

          // 执行战斗
          const fightResult = await tokenStore.sendMessageWithPromise(
            token.id,
            'evotower_fight',
            {
              battleNum: 1,
              winNum: 1
            },
            10000
          )

          climbCount++

          // 更新爬塔信息和能量
          const updatedTowerInfo = await tokenStore.sendMessageWithPromise(
            token.id,
            'evotower_getinfo',
            {},
            5000
          )
          currentEnergy = updatedTowerInfo?.evoTower?.energy || 0
          currentTowerId = updatedTowerInfo?.evoTower?.towerId || 0

          // 检查是否刚通关 10 层
          const floor = (currentTowerId % 10) + 1
          if (
            fightResult &&
            fightResult.winList &&
            fightResult.winList[0] === true &&
            floor === 1
          ) {
            // 领取通关奖励
            await tokenStore.sendMessageWithPromise(
              token.id,
              'evotower_claimreward',
              {},
              5000
            )
            
            // 记录奖励领取日志
            const currentChapter = Math.floor(currentTowerId / 10)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '怪异塔',
              operation: '批量爬塔',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${tokenIndex}、${token.name || token.id}、领取通关奖励，当前层数：${currentChapter}`
            })
          }

          await waitCommandDelay()
        }
        
        // 计算显示层数
        const chapter = Math.floor(currentTowerId / 10) + 1
        const floor = (currentTowerId % 10) + 1
        const displayFloor = `${chapter}-${floor}`
        
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 爬塔完成，共${climbCount}次，当前层数${displayFloor}，剩余能量${currentEnergy}`)

        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、爬塔完成，共${climbCount}次，当前层数${displayFloor}，剩余能量${currentEnergy}`,
          details: {
            climbCount,
            currentFloor: displayFloor,
            currentTowerId,
            remainingEnergy: currentEnergy
          }
        })

        return { climbCount, currentFloor: displayFloor, remainingEnergy: currentEnergy }
      } catch (error) {
        console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量爬塔失败:`, error)
        message.error(`序号 ${tokenIndex} ${token.name || token.id}: 爬塔失败 - ${error.message || '未知错误'}`)

        // 添加错误日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `${tokenIndex}、${token.name || token.id}、爬塔失败: ${error.message || '未知错误'}`
        })
        
        throw error
      }
    }
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      towerClimbOperation,
      {
        batchSize: 20,
        delayBetween: 100,
        keepConnections: true,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`[序号${progress.globalIndex}] ${progress.tokenName} 正在连接...`)
          } else if (progress.type === 'token-success' && progress.message === '连接成功') {
            message.success(`[序号${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error' && progress.message === '连接失败，跳过') {
            message.warning(`[序号${progress.globalIndex}] ${progress.tokenName} 连接失败，跳过`)
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量爬塔完成（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('批量爬塔失败:', error)
    message.error('批量爬塔失败: ' + (error.message || '未知错误'))
  } finally {
    isBatchRunning.value = false
  }
}

const handleBatchQuickClimb = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(batchTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  try {
    isBatchQuickClimbing.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量开启爬塔（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
    
    const towerClimbOperation = async (token, globalIndex) => {
      const tokenIndex = globalIndex + 1
      
      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量开启爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、开始爬塔`
        })
        
        const towerInfoRes = await tokenStore.sendMessageWithPromise(
          token.id,
          'evotower_getinfo',
          {},
          5000
        )
        
        let currentEnergy = towerInfoRes?.evoTower?.energy || 0
        let currentTowerId = towerInfoRes?.evoTower?.towerId || 0
        
        const initChapter = Math.floor(currentTowerId / 10) + 1
        const initFloor = (currentTowerId % 10) + 1
        const initDisplayFloor = `${initChapter}-${initFloor}`
        
        await waitCommandDelay()
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量开启爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、初始层数：${initDisplayFloor}，能量：${currentEnergy}`
        })
        
        let climbCount = 0
        const maxClimb = 10
        
        if (currentEnergy <= 0) {
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 能量不足，跳过爬塔`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '怪异塔',
            operation: '批量开启爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、能量不足，跳过爬塔`,
            details: {
              remainingEnergy: 0
            }
          })
          
          return { climbCount: 0, currentFloor: initDisplayFloor, remainingEnergy: 0 }
        }
        
        for (let j = 0; j < maxClimb; j++) {
          if (currentEnergy <= 0) break

          await tokenStore.sendMessageWithPromise(
            token.id,
            'evotower_readyfight',
            {},
            5000
          )

          const fightResult = await tokenStore.sendMessageWithPromise(
            token.id,
            'evotower_fight',
            {
              battleNum: 1,
              winNum: 1
            },
            10000
          )

          climbCount++

          const updatedTowerInfo = await tokenStore.sendMessageWithPromise(
            token.id,
            'evotower_getinfo',
            {},
            5000
          )
          currentEnergy = updatedTowerInfo?.evoTower?.energy || 0
          currentTowerId = updatedTowerInfo?.evoTower?.towerId || 0

          const floor = (currentTowerId % 10) + 1
          if (
            fightResult &&
            fightResult.winList &&
            fightResult.winList[0] === true &&
            floor === 1
          ) {
            await tokenStore.sendMessageWithPromise(
              token.id,
              'evotower_claimreward',
              {},
              5000
            )
            
            const currentChapter = Math.floor(currentTowerId / 10)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '怪异塔',
              operation: '批量开启爬塔',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${tokenIndex}、${token.name || token.id}、领取通关奖励，当前层数：${currentChapter}`
            })
          }

          await waitCommandDelay()
        }
        
        const chapter = Math.floor(currentTowerId / 10) + 1
        const floor = (currentTowerId % 10) + 1
        const displayFloor = `${chapter}-${floor}`
        
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 爬塔完成，共${climbCount}次，当前层数${displayFloor}，剩余能量${currentEnergy}`)

        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量开启爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、爬塔完成，共${climbCount}次，当前层数${displayFloor}，剩余能量${currentEnergy}`,
          details: {
            climbCount,
            currentFloor: displayFloor,
            currentTowerId,
            remainingEnergy: currentEnergy
          }
        })

        return { climbCount, currentFloor: displayFloor, remainingEnergy: currentEnergy }
      } catch (error) {
        console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量开启爬塔失败:`, error)
        message.error(`序号 ${tokenIndex} ${token.name || token.id}: 爬塔失败 - ${error.message || '未知错误'}`)

        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量开启爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `${tokenIndex}、${token.name || token.id}、爬塔失败: ${error.message || '未知错误'}`
        })
        
        throw error
      }
    }
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      towerClimbOperation,
      {
        batchSize: 20,
        delayBetween: 100,
        keepConnections: true,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`[序号${progress.globalIndex}] ${progress.tokenName} 正在连接...`)
          } else if (progress.type === 'token-success' && progress.message === '连接成功') {
            message.success(`[序号${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error' && progress.message === '连接失败，跳过') {
            message.warning(`[序号${progress.globalIndex}] ${progress.tokenName} 连接失败，跳过`)
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量开启爬塔完成（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('批量开启爬塔失败:', error)
    message.error('批量开启爬塔失败: ' + (error.message || '未知错误'))
  } finally {
    isBatchQuickClimbing.value = false
  }
}

const handleExportTowerInfo = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(batchTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  try {
    isExportingTowerInfo.value = true
    message.info(`开始导出爬塔信息，共${targetTokens.length}个Token...`)
    
    const towerInfoList = []
    
    const exportOperation = async (token, globalIndex) => {
      const tokenIndex = globalIndex + 1
      
      try {
        const towerInfoRes = await tokenStore.sendMessageWithPromise(
          token.id,
          'evotower_getinfo',
          {},
          5000
        )
        
        const currentTowerId = towerInfoRes?.evoTower?.towerId || 0
        const chapter = Math.floor(currentTowerId / 10) + 1
        const floor = (currentTowerId % 10) + 1
        const displayFloor = `${chapter}-${floor}`
        
        towerInfoList.push({
          index: tokenIndex,
          name: token.name || token.id,
          floor: displayFloor
        })
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 爬塔层数：${displayFloor}`)
        
        await waitCommandDelay()
        
        return { success: true, tokenId: token.id }
      } catch (error) {
        console.error(`获取 ${token.name || token.id} 爬塔信息失败:`, error)
        towerInfoList.push({
          index: tokenIndex,
          name: token.name || token.id,
          floor: '获取失败'
        })
        
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取失败`)
        
        return { success: false, tokenId: token.id }
      }
    }
    
    await connectionPool.batchOperate(
      targetTokens,
      exportOperation,
      {
        batchSize: 1,
        delayBetween: 100,
        keepConnections: true,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`[序号${progress.globalIndex}] ${progress.tokenName} 正在连接...`)
          } else if (progress.type === 'token-success' && progress.message === '连接成功') {
            message.success(`[序号${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error' && progress.message === '连接失败，跳过') {
            message.warning(`[序号${progress.globalIndex}] ${progress.tokenName} 连接失败，跳过`)
          }
        }
      }
    )
    
    let csvContent = '\uFEFF序号,昵称,爬塔层数\n'
    towerInfoList.forEach(item => {
      csvContent += `${item.index},${item.name},${item.floor}\n`
    })
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `怪异塔爬塔信息_${new Date().toLocaleDateString()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success(`爬塔信息导出完成，共${towerInfoList.length}个Token`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '批量导出爬塔信息',
      tokenId: '',
      tokenName: '',
      status: 'success',
      message: `导出爬塔信息完成，共${towerInfoList.length}个Token`
    })
  } catch (error) {
    console.error('导出爬塔信息失败:', error)
    message.error('导出爬塔信息失败: ' + (error.message || '未知错误'))
  } finally {
    isExportingTowerInfo.value = false
  }
}

const handleBatchClaimFreeKey = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(batchTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  try {
    isBatchClaimingFreeKey.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量领取免费钥匙（${rangeText}），共${targetTokens.length}个Token...`)
    
    let successCount = 0
    let failCount = 0
    
    const claimOperation = async (token, globalIndex) => {
      const tokenIndex = globalIndex + 1
      
      try {
        await tokenStore.sendMergeboxClaimFreeEnergy(token.id, { actType: 1 })
        
        successCount++
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 领取免费钥匙成功`)
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量领取免费钥匙',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、领取免费钥匙成功`
        })
        
        await waitCommandDelay()
        
        return { success: true, tokenId: token.id }
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 领取免费钥匙失败:`, error)
        failCount++
        
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} 领取免费钥匙失败: ${error.message}`)
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '怪异塔',
          operation: '批量领取免费钥匙',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: `${tokenIndex}、${token.name || token.id}、领取免费钥匙失败: ${error.message}`
        })
        
        await waitCommandDelay()
        
        return { success: false, tokenId: token.id }
      }
    }
    
    await connectionPool.batchOperate(
      targetTokens,
      claimOperation,
      {
        batchSize: 1,
        delayBetween: 100,
        keepConnections: true,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`[序号${progress.globalIndex}] ${progress.tokenName} 正在连接...`)
          } else if (progress.type === 'token-success' && progress.message === '连接成功') {
            message.success(`[序号${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error' && progress.message === '连接失败，跳过') {
            message.warning(`[序号${progress.globalIndex}] ${progress.tokenName} 连接失败，跳过`)
          }
        }
      }
    )
    
    message.success(`批量领取免费钥匙完成（成功: ${successCount}, 失败: ${failCount}）`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '怪异塔',
      operation: '批量领取免费钥匙',
      tokenId: '',
      tokenName: '',
      status: 'success',
      message: `批量领取免费钥匙完成（成功: ${successCount}, 失败: ${failCount}）`
    })
  } catch (error) {
    console.error('批量领取免费钥匙失败:', error)
    message.error('批量领取免费钥匙失败: ' + (error.message || '未知错误'))
  } finally {
    isBatchClaimingFreeKey.value = false
  }
}

// 监听选中Token变化，自动刷新信息
watch(() => props.selectedTokenId, (newTokenId, oldTokenId) => {
  if (newTokenId && newTokenId !== oldTokenId) {
    const status = tokenStore.getWebSocketStatus(newTokenId)
    if (status === 'connected') {
      setTimeout(() => {
        getTowerInfo(newTokenId)
      }, 1000)
    }
  }
})

// 监听WebSocket连接状态变化
watch(() => {
  if (!props.selectedTokenId) return 'disconnected'
  return tokenStore.getWebSocketStatus(props.selectedTokenId)
}, (newStatus, oldStatus) => {
  if (newStatus === 'connected' && oldStatus !== 'connected' && props.selectedTokenId) {
    setTimeout(() => {
      getTowerInfo(props.selectedTokenId)
    }, 1000)
  }
})
</script>

<style scoped>
.weird-tower-content {
  width: 100%;
}
</style>
