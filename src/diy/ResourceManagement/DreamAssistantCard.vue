<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Moon />
      </n-icon>
    </template>
    <template #title>
      <h3>梦境助手</h3>
    </template>
    <template #badge>
      <span>{{ isRunning ? '执行中' : '就绪' }}</span>
    </template>
    <template #default>
      <div class="dream-assistant-content">
        <!-- 梦境操作按钮 -->
        <div class="dream-actions-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <CustomizedCard 
              mode="execution-range"
              name="执行范围"
              v-model:inputValue="executionRange"
              placeholder="留空执行全部，或输入 1-20 或 1,2,3"
            />
            <CustomizedCard 
              mode="button-with-select"
              :button-text="isRunning ? '梦境选择中...' : '梦境选择'"
              :select-value="selectedHeroForSelect"
              @update:select-value="(val) => selectedHeroForSelect = val"
              :select-options="heroOptions"
              placeholder="选择英雄"
              @button-click="handleDreamSelect"
              :disabled="isRunning || !tokenStore.hasTokens"
              :loading="isRunning"
            />
            <CustomizedCard 
              mode="button-with-select"
              :button-text="isRunning ? '梦境出战中...' : '梦境出战'"
              :select-value="selectedHeroForFight"
              @update:select-value="(val) => selectedHeroForFight = val"
              :select-options="heroOptions"
              placeholder="选择英雄"
              @button-click="handleDreamFight"
              :disabled="isRunning || !tokenStore.hasTokens"
              :loading="isRunning"
            />
          </CustomizedCard>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="梦境助手"
        :filter-operations="['梦境选择', '梦境出战']"
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
import { Moon } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

// 本地存储键名
const STORAGE_KEYS = {
  executionRange: 'dream_assistant_execution_range',
  selectedHeroForSelect: 'dream_assistant_selected_hero_for_select',
  selectedHeroForFight: 'dream_assistant_selected_hero_for_fight'
}

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 20,
  connectionTimeout: 3000,
  maxRetries: 2
})

// 操作状态
const isRunning = ref(false)
const executionRange = ref('')
const selectedHeroForSelect = ref('107')
const selectedHeroForFight = ref('107')

// 英雄选项
const heroOptions = [
  { label: '吕布', value: '107' },
  { label: '赵云', value: '118' }
]

// 组件挂载时从本地存储读取
onMounted(() => {
  try {
    const savedExecutionRange = localStorage.getItem(STORAGE_KEYS.executionRange)
    if (savedExecutionRange) {
      executionRange.value = savedExecutionRange
    }
    
    const savedHeroForSelect = localStorage.getItem(STORAGE_KEYS.selectedHeroForSelect)
    if (savedHeroForSelect) {
      selectedHeroForSelect.value = savedHeroForSelect
    }
    
    const savedHeroForFight = localStorage.getItem(STORAGE_KEYS.selectedHeroForFight)
    if (savedHeroForFight) {
      selectedHeroForFight.value = savedHeroForFight
    }
  } catch (error) {
    console.error('读取本地存储失败:', error)
  }
})

// 监听变化并保存到本地存储
watch(executionRange, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEYS.executionRange, newValue)
  } catch (error) {
    console.error('保存执行范围到本地存储失败:', error)
  }
})

watch(selectedHeroForSelect, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEYS.selectedHeroForSelect, newValue)
  } catch (error) {
    console.error('保存梦境选择英雄到本地存储失败:', error)
  }
})

watch(selectedHeroForFight, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEYS.selectedHeroForFight, newValue)
  } catch (error) {
    console.error('保存梦境出战英雄到本地存储失败:', error)
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

// 梦境选择
const handleDreamSelect = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(executionRange.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const heroId = parseInt(selectedHeroForSelect.value)
  const heroName = heroOptions.find(h => h.value === selectedHeroForSelect.value)?.label || '未知'
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  message.info(`开始梦境选择-${heroName}（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '梦境助手',
    operation: '梦境选择',
    status: 'info',
    message: `开始梦境选择-${heroName}，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行梦境选择-${heroName}...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '梦境选择',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] ${token.name || token.id} 开始执行梦境选择-${heroName}`
          })
          
          await tokenStore.sendDungeonSelectHero(token.id, { battleTeam: { "0": heroId } })
          
          await waitCommandDelay()
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '梦境选择',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] ${token.name || token.id} 梦境选择-${heroName}成功`
          })
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 梦境选择-${heroName}成功`)
          
          return { success: true }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 梦境选择失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 梦境选择失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '梦境选择',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] ${token.name || token.id} 梦境选择失败：${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            message.info(`${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`梦境选择-${heroName}完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '梦境选择',
      status: 'success',
      message: `梦境选择-${heroName}完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('梦境选择出错:', error)
    message.error(`梦境选择出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '梦境选择',
      status: 'error',
      message: `梦境选择出错：${error.message || error}`
    })
  } finally {
    isRunning.value = false
  }
}

// 梦境出战
const handleDreamFight = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(executionRange.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  const heroId = parseInt(selectedHeroForFight.value)
  const heroName = heroOptions.find(h => h.value === selectedHeroForFight.value)?.label || '未知'
  message.info(`开始梦境出战-${heroName}（${rangeText}），共${targetTokens.length}个Token，最多执行200次...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '梦境助手',
    operation: '梦境出战',
    status: 'info',
    message: `开始梦境出战，${rangeText}，共${targetTokens.length}个Token，最多执行200次`
  })
  
  try {
    isRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行梦境出战...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '梦境出战',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] ${token.name || token.id} 开始执行梦境出战，最多200次`
          })
          
          let fightCount = 0
          let successCount = 0
          let failCount = 0
          
          for (let i = 0; i < 200; i++) {
            try {
              const result = await tokenStore.sendMessageWithPromise(
                token.id,
                'fight_startdungeon',
                { heroId: heroId },
                10000
              )
              
              fightCount++
              successCount++
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '梦境助手',
                operation: '梦境出战',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `[序号${tokenIndex}] ${token.name || token.id} - 梦境出战第${i + 1}次成功`
              })
              
              await waitCommandDelay()
            } catch (error) {
              const errorMsg = error.message || ''
              
              // 包含"操作过快"或"未知错误" → 等待 5 分钟后继续
              if (errorMsg.includes('操作过快') || (errorMsg.includes('未知错误') && errorMsg.includes('400340'))) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '梦境助手',
                  operation: '梦境出战',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 操作过快 (400340)，等待 2 分钟后继续`
                })
                message.warning(`${token.name || token.id} 操作过快 (400340)，等待 2 分钟后继续`)
                
                // 等待 2 分钟 (120000ms)
                await new Promise(resolve => setTimeout(resolve, 120000))
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '梦境助手',
                  operation: '梦境出战',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 等待完成，继续出战`
                })
                message.info(`${token.name || token.id} 等待完成，继续出战`)
                continue
              }
              
              // 包含"武将已阵亡"或"2600080" → 停止出战
              if (errorMsg.includes('武将已阵亡') || errorMsg.includes('2600080')) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '梦境助手',
                  operation: '梦境出战',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 武将已阵亡 (2600080)，停止出战`
                })
                message.warning(`${token.name || token.id} 武将已阵亡 (2600080)，停止出战`)
                await waitCommandDelay()
                break
              }
              
              failCount++
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '梦境助手',
                operation: '梦境出战',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `[序号${tokenIndex}] ${token.name || token.id} - 梦境出战第${i + 1}次失败：${error.message || '未知错误'}，停止出战`
              })
              
              await waitCommandDelay()
              break
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 梦境出战完成，共执行${fightCount}次，成功${successCount}次，失败${failCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '梦境出战',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] ${token.name || token.id} - 梦境出战完成，共执行${fightCount}次，成功${successCount}次，失败${failCount}次`
          })
          
          return { success: true, fightCount, successCount, failCount }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 梦境出战出错:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 梦境出战出错：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '梦境出战',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] ${token.name || token.id} 梦境出战出错：${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            message.info(`${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`梦境出战完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '梦境出战',
      status: 'success',
      message: `梦境出战完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('梦境出战出错:', error)
    message.error(`梦境出战出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '梦境出战',
      status: 'error',
      message: `梦境出战出错：${error.message || error}`
    })
  } finally {
    isRunning.value = false
  }
}

</script>

<style scoped>
.dream-assistant-content {
  width: 100%;
}
</style>
