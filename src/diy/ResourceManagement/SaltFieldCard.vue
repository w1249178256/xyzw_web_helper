<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Shield />
      </n-icon>
    </template>
    <template #title>
      <h3>盐场</h3>
    </template>
    <template #badge>
      <span>{{ isRunning ? '执行中' : '就绪' }}</span>
    </template>
    <template #default>
      <div class="salt-field-content">
        <!-- 盐场操作按钮 -->
        <div class="salt-field-actions-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <CustomizedCard 
              mode="execution-range"
              name="团长"
              v-model:inputValue="legionLeader"
              placeholder="留空执行全部，或输入 1-20 或 1,2,3"
            />
            <CustomizedCard 
              mode="button"
              name="盐场报名"
              :disabled="isRunning || !tokenStore.hasTokens"
              @button-click="handleSaltFieldSignup"
            />
            <CustomizedCard 
              mode="execution-range"
              name="执行范围"
              v-model:inputValue="executionRange"
              placeholder="留空执行全部，或输入 1-20 或 1,2,3"
            />
            <CustomizedCard 
              mode="button"
              name="盐场布阵"
              :disabled="isRunning || !tokenStore.hasTokens"
              @button-click="handleSaltFieldFormation"
            />
            <CustomizedCard 
              mode="button"
              name="批量切换阵1"
              :disabled="isRunning || !tokenStore.hasTokens"
              @button-click="batchSwitchTeam1"
            />
            <CustomizedCard 
              mode="button"
              name="批量切换阵2"
              :disabled="isRunning || !tokenStore.hasTokens"
              @button-click="batchSwitchTeam2"
            />
          </CustomizedCard>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="盐场"
        :filter-operations="['盐场报名', '盐场布阵', '批量切换阵1', '批量切换阵2']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { Shield } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

// 本地存储键名
const STORAGE_KEYS = {
  legionLeader: 'saltfield_legion_leader',
  executionRange: 'saltfield_execution_range'
}

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 20,
  connectionTimeout: 3000,
  maxRetries: 2
})

// 操作状态
const isRunning = ref(false)
const legionLeader = ref('')
const executionRange = ref('')

// 组件挂载时从本地存储读取
onMounted(() => {
  try {
    const savedLegionLeader = localStorage.getItem(STORAGE_KEYS.legionLeader)
    if (savedLegionLeader) {
      legionLeader.value = savedLegionLeader
    }
    
    const savedExecutionRange = localStorage.getItem(STORAGE_KEYS.executionRange)
    if (savedExecutionRange) {
      executionRange.value = savedExecutionRange
    }
  } catch (error) {
    console.error('读取本地存储失败:', error)
  }
})

// 监听变化并保存到本地存储
watch(legionLeader, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEYS.legionLeader, newValue)
  } catch (error) {
    console.error('保存团长到本地存储失败:', error)
  }
})

watch(executionRange, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEYS.executionRange, newValue)
  } catch (error) {
    console.error('保存执行范围到本地存储失败:', error)
  }
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

// 辅助函数：等待执行间隔
const waitCommandDelay = () => new Promise(resolve => setTimeout(resolve, 800))

// 辅助函数：解析执行范围（如果为空则执行全部）
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null
  }
  
  const tokens = []
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tokens.push(i)
        }
      }
    } else {
      const num = Number(trimmed)
      if (!isNaN(num)) {
        tokens.push(num)
      }
    }
  }
  
  return tokens.length > 0 ? tokens : null
}

// 辅助函数：获取目标Token列表（根据执行范围或全部）
const getTargetTokens = (tokenIndices) => {
  const gameTokens = [...tokenStore.gameTokens]
  const sortedTokens = gameTokens.sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    return sortedTokens
  }
  
  return tokenIndices
    .map(index => {
      const arrayIndex = index - 1
      return sortedTokens[arrayIndex]
    })
    .filter(token => token !== undefined)
}

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 盐场报名
const handleSaltFieldSignup = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }

  isRunning.value = true
  
  try {
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    if (sortedTokensList.length === 0) {
      message.warning('没有可用的Token')
      return
    }
    
    // 解析团长的执行范围
    const leaderTokenIndices = parseTokenRange(legionLeader.value)
    const leaderTokens = getTargetTokens(leaderTokenIndices)
    
    if (leaderTokens.length === 0) {
      message.warning('团长执行范围内没有有效的Token')
      return
    }
    
    const rangeText = legionLeader.value ? `范围${legionLeader.value}` : '全部'
    message.info(`开始盐场报名，团长：${rangeText}，共${leaderTokens.length}个Token...`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '盐场报名',
      status: 'info',
      message: `开始盐场报名，团长：${rangeText}，共${leaderTokens.length}个Token`
    })
    
    let successCount = 0
    let failCount = 0
    
    // 使用连接池逐个执行
    for (let i = 0; i < leaderTokens.length; i++) {
      const token = leaderTokens[i]
      if (!token || !token.id) continue
      
      try {
        const connectionAcquired = await connectionPool.acquire(token.id)
        
        if (!connectionAcquired) {
          const tokenIndex = getTokenIndex(token)
          message.warning(`${tokenIndex}、${token.name} 连接失败`)
          failCount++
          logStore.addLog({
            page: 'fish-helper',
            cardType: '盐场',
            operation: '盐场报名',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 连接失败`
          })
          continue
        }
        
        await waitCommandDelay()
        
        if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
          const tokenIndex = getTokenIndex(token)
          message.warning(`${tokenIndex}、${token.name} WebSocket未连接`)
          await connectionPool.release(token.id, false)
          failCount++
          logStore.addLog({
            page: 'fish-helper',
            cardType: '盐场',
            operation: '盐场报名',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} WebSocket未连接`
          })
          continue
        }
        
        const tokenIndex = getTokenIndex(token)
        message.info(`正在处理 ${tokenIndex}、${token.name} 盐场报名...`)
        
        await tokenStore.sendLegionSignup(token.id, {})
        await waitCommandDelay()
        
        message.success(`${tokenIndex}、${token.name} 盐场报名成功`)
        successCount++
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '盐场报名',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 盐场报名成功`
        })
        
        await connectionPool.release(token.id, true)
      } catch (error) {
        console.error(`${token.name} 盐场报名失败:`, error)
        const tokenIndex = getTokenIndex(token)
        message.error(`${tokenIndex}、${token.name} 盐场报名失败：${error.message}`)
        failCount++
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '盐场报名',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 盐场报名失败：${error.message}`
        })
        
        try {
          await connectionPool.release(token.id, false)
        } catch (releaseError) {
          console.error('释放连接失败:', releaseError)
        }
      }
      
      if (i < leaderTokens.length - 1) {
        await waitCommandDelay()
      }
    }
    
    message.success(`盐场报名完成！成功: ${successCount}，失败: ${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '盐场报名',
      status: 'success',
      message: `盐场报名完成（团长：${rangeText}），成功: ${successCount}，失败: ${failCount}`
    })
  } catch (error) {
    console.error('盐场报名失败:', error)
    message.error(`盐场报名失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '盐场报名',
      status: 'error',
      message: `盐场报名失败：${error.message}`
    })
  } finally {
    isRunning.value = false
  }
}

// 盐场布阵
const handleSaltFieldFormation = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }

  isRunning.value = true
  
  try {
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    if (sortedTokensList.length === 0) {
      message.warning('没有可用的Token')
      return
    }
    
    const tokenIndices = parseTokenRange(executionRange.value)
    const targetTokens = getTargetTokens(tokenIndices)
    
    if (targetTokens.length === 0) {
      message.warning('执行范围内没有有效的Token')
      return
    }
    
    const rangeText = executionRange.value ? `范围${executionRange.value}` : '全部'
    message.info(`开始盐场布阵（${rangeText}），共${targetTokens.length}个Token...`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '盐场布阵',
      status: 'info',
      message: `开始盐场布阵，${rangeText}，共${targetTokens.length}个Token`
    })
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      if (!token || !token.id) continue
      
      try {
        const tokenIndex = getTokenIndex(token)
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在盐场布阵...`)
        
        await tokenStore.sendWarSetBattleTeam(token.id, {})
        await waitCommandDelay()
        
        message.success(`${tokenIndex}、${token.name || token.id} 盐场布阵成功`)
        successCount++
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '盐场布阵',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name || token.id} 盐场布阵成功`
        })
      } catch (error) {
        console.error(`${token.name} 盐场布阵失败:`, error)
        const tokenIndex = getTokenIndex(token)
        message.error(`${tokenIndex}、${token.name || token.id} 盐场布阵失败：${error.message}`)
        failCount++
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '盐场布阵',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name || token.id} 盐场布阵失败：${error.message}`
        })
      }
      
      if (i < targetTokens.length - 1) {
        await waitCommandDelay()
      }
    }
    
    message.success(`盐场布阵完成！成功: ${successCount}，失败: ${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '盐场布阵',
      status: 'success',
      message: `盐场布阵完成（${rangeText}），成功: ${successCount}，失败: ${failCount}`
    })
  } catch (error) {
    console.error('盐场布阵失败:', error)
    message.error(`盐场布阵失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '盐场布阵',
      status: 'error',
      message: `盐场布阵失败：${error.message}`
    })
  } finally {
    isRunning.value = false
  }
}
// 批量切换阵1
const batchSwitchTeam1 = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }

  isRunning.value = true
  
  try {
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    if (sortedTokensList.length === 0) {
      message.warning('没有可用的Token')
      return
    }
    
    const tokenIndices = parseTokenRange(executionRange.value)
    const targetTokens = getTargetTokens(tokenIndices)
    
    if (targetTokens.length === 0) {
      message.warning('执行范围内没有有效的Token')
      return
    }
    
    const rangeText = executionRange.value ? `范围${executionRange.value}` : '全部'
    message.info(`开始批量切换阵1（${rangeText}），共${targetTokens.length}个Token...`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '批量切换阵1',
      status: 'info',
      message: `开始批量切换阵1，${rangeText}，共${targetTokens.length}个Token`
    })
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      if (!token || !token.id) continue
      
      try {
        const connectionAcquired = await connectionPool.acquire(token.id)
        
        if (!connectionAcquired) {
          const tokenIndex = getTokenIndex(token)
          message.warning(`${tokenIndex}、${token.name} 连接失败`)
          failCount++
          logStore.addLog({
            page: 'fish-helper',
            cardType: '盐场',
            operation: '批量切换阵1',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 连接失败`
          })
          continue
        }
        
        await waitCommandDelay()
        
        if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
          const tokenIndex = getTokenIndex(token)
          message.warning(`${tokenIndex}、${token.name} WebSocket未连接`)
          await connectionPool.release(token.id, false)
          failCount++
          logStore.addLog({
            page: 'fish-helper',
            cardType: '盐场',
            operation: '批量切换阵1',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} WebSocket未连接`
          })
          continue
        }
        
        const tokenIndex = getTokenIndex(token)
        message.info(`正在切换 ${tokenIndex}、${token.name} 到阵1...`)
        
        await tokenStore.sendPresetteamSaveTeam(token.id, { 
          teamId: 1 
        })
        
        message.success(`${tokenIndex}、${token.name} 已切换到阵1`)
        successCount++
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '批量切换阵1',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 已切换到阵1`
        })
        
        await connectionPool.release(token.id, true)
        
      } catch (error) {
        console.error(`${token.name} 切换阵1失败:`, error)
        const tokenIndex = getTokenIndex(token)
        message.error(`${tokenIndex}、${token.name} 切换阵1失败：${error.message}`)
        failCount++
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '批量切换阵1',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 切换阵1失败：${error.message}`
        })
        try {
          await connectionPool.release(token.id, false)
        } catch (releaseError) {
          console.error('释放连接失败:', releaseError)
        }
      }
      
      if (i < targetTokens.length - 1) {
        await waitCommandDelay()
      }
    }
    
    message.success(`批量切换阵1完成！成功: ${successCount}，失败: ${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '批量切换阵1',
      status: 'success',
      message: `批量切换阵1完成（${rangeText}），成功: ${successCount}，失败: ${failCount}`
    })
  } catch (error) {
    console.error('批量切换阵1失败:', error)
    message.error(`批量切换阵1失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '批量切换阵1',
      status: 'error',
      message: `批量切换阵1失败：${error.message}`
    })
  } finally {
    isRunning.value = false
  }
}

// 批量切换阵2
const batchSwitchTeam2 = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }

  isRunning.value = true
  
  try {
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    if (sortedTokensList.length === 0) {
      message.warning('没有可用的Token')
      return
    }
    
    const tokenIndices = parseTokenRange(executionRange.value)
    const targetTokens = getTargetTokens(tokenIndices)
    
    if (targetTokens.length === 0) {
      message.warning('执行范围内没有有效的Token')
      return
    }
    
    const rangeText = executionRange.value ? `范围${executionRange.value}` : '全部'
    message.info(`开始批量切换阵2（${rangeText}），共${targetTokens.length}个Token...`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '批量切换阵2',
      status: 'info',
      message: `开始批量切换阵2，${rangeText}，共${targetTokens.length}个Token`
    })
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      if (!token || !token.id) continue
      
      try {
        const connectionAcquired = await connectionPool.acquire(token.id)
        
        if (!connectionAcquired) {
          const tokenIndex = getTokenIndex(token)
          message.warning(`${tokenIndex}、${token.name} 连接失败`)
          failCount++
          logStore.addLog({
            page: 'fish-helper',
            cardType: '盐场',
            operation: '批量切换阵2',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 连接失败`
          })
          continue
        }
        
        await waitCommandDelay()
        
        if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
          const tokenIndex = getTokenIndex(token)
          message.warning(`${tokenIndex}、${token.name} WebSocket未连接`)
          await connectionPool.release(token.id, false)
          failCount++
          logStore.addLog({
            page: 'fish-helper',
            cardType: '盐场',
            operation: '批量切换阵2',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} WebSocket未连接`
          })
          continue
        }
        
        const tokenIndex = getTokenIndex(token)
        message.info(`正在切换 ${tokenIndex}、${token.name} 到阵2...`)
        
        await tokenStore.sendPresetteamSaveTeam(token.id, { 
          teamId: 2 
        })
        
        message.success(`${tokenIndex}、${token.name} 已切换到阵2`)
        successCount++
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '批量切换阵2',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 已切换到阵2`
        })
        
        await connectionPool.release(token.id, true)
        
      } catch (error) {
        console.error(`${token.name} 切换阵2失败:`, error)
        const tokenIndex = getTokenIndex(token)
        message.error(`${tokenIndex}、${token.name} 切换阵2失败：${error.message}`)
        failCount++
        logStore.addLog({
          page: 'fish-helper',
          cardType: '盐场',
          operation: '批量切换阵2',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${token.name} 切换阵2失败：${error.message}`
        })
        try {
          await connectionPool.release(token.id, false)
        } catch (releaseError) {
          console.error('释放连接失败:', releaseError)
        }
      }
      
      if (i < targetTokens.length - 1) {
        await waitCommandDelay()
      }
    }
    
    message.success(`批量切换阵2完成！成功: ${successCount}，失败: ${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '批量切换阵2',
      status: 'success',
      message: `批量切换阵2完成（${rangeText}），成功: ${successCount}，失败: ${failCount}`
    })
  } catch (error) {
    console.error('批量切换阵2失败:', error)
    message.error(`批量切换阵2失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '盐场',
      operation: '批量切换阵2',
      status: 'error',
      message: `批量切换阵2失败：${error.message}`
    })
  } finally {
    isRunning.value = false
  }
}
</script>

<style scoped>
.salt-field-content {
  width: 100%;
}
</style>
