<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <TrendingUp />
      </n-icon>
    </template>
    <template #title>
      <h3>爬塔升星</h3>
    </template>
    <template #badge>
      <span>{{ isRunning ? '执行中' : '就绪' }}</span>
    </template>
    <template #default>
      <div class="tower-star-upgrade-content">
        <!-- 爬塔信息显示 -->
        <div class="tower-info-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <CustomizedCard mode="name-count" name="当前层数" :count="currentFloor" />
            <CustomizedCard mode="name-count" name="爬塔能量" :count="String(towerEnergy)" />
          </CustomizedCard>
        </div>

        <!-- 爬塔操作按钮 -->
        <div class="tower-actions-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
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
              name="领取奖励" 
              :disabled="!selectedTokenId || isRunning"
              @button-click="claimTowerReward" 
            />
          </CustomizedCard>
        </div>

        <!-- 升星操作按钮 -->
        <div class="star-upgrade-actions-section">
          <CustomizedCard mode="container">
            <CustomizedCard 
              mode="button" 
              name="英雄升星" 
              :disabled="!selectedTokenId || isRunning"
              :loading="isRunning"
              @button-click="startHeroUpgrade" 
            />
            <CustomizedCard 
              mode="button" 
              name="图鉴升星" 
              :disabled="!selectedTokenId || isRunning"
              :loading="isRunning"
              @button-click="startBookUpgrade" 
            />
            <CustomizedCard 
              mode="button" 
              name="领取图鉴奖励" 
              :disabled="!selectedTokenId || isRunning"
              :loading="isRunning"
              @button-click="claimBookReward" 
            />
          </CustomizedCard>
          
          <!-- 批量执行区域 -->
          <div class="batch-execution-section" style="margin-top: 1rem;">
            <CustomizedCard mode="container">
              <CustomizedCard 
                mode="execution-range" 
                name="执行范围" 
                v-model:inputValue="batchTokens" 
                placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
                @update:inputValue="handleBatchTokensInput" 
              />
              <CustomizedCard 
                mode="button" 
                :name="isBatchRunning ? '批量执行中...' : '批量执行'" 
                :disabled="tokenStore.gameTokens.length === 0 || isBatchRunning" 
                @button-click="handleBatchUpgrade" 
              />
            </CustomizedCard>
          </div>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        :filter-operations="['开始爬塔', '停止爬塔', '刷新信息', '领取奖励', '英雄升星', '图鉴升星', '领取图鉴奖励', '批量执行']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { TrendingUp } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 操作状态
const isRunning = ref(false)
const isBatchRunning = ref(false)
const batchTokens = ref('')

// 计算属性：当前层数（从FishHelper.vue复制）
const currentFloor = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.gameData || !token.gameData.roleInfo) return '0 - 0'
  const tower = token.gameData.roleInfo.role?.tower
  if (!tower || tower.id === undefined) return '0 - 0'
  const floor = Math.floor(tower.id / 10) + 1
  const layer = (tower.id % 10) + 1
  return `${floor} - ${layer}`
})

// 计算属性：爬塔能量（从FishHelper.vue复制）
const towerEnergy = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.gameData || !token.gameData.roleInfo) return 0
  const tower = token.gameData.roleInfo.role?.tower
  return tower?.energy || 0
})

// 开始爬塔（从FishHelper.vue复制）
const startTowerClimb = async () => {
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
  if (towerEnergy.value <= 0) {
    message.warning('爬塔能量不足')
    return
  }
  
  try {
    isRunning.value = true
    message.info('开始爬塔...')
    // 这里调用实际的爬塔API
    await tokenStore.sendGameMessage(token.id, 'fight_starttower', {})
    message.success('爬塔命令已发送')
  } catch (error) {
    console.error('爬塔失败:', error)
    message.error('爬塔失败')
  } finally {
    setTimeout(() => {
      isRunning.value = false
    }, 2000)
  }
}

// 停止爬塔（从FishHelper.vue复制）
const stopTowerClimb = () => {
  isRunning.value = false
  message.info('已停止爬塔')
}

// 刷新爬塔信息（从FishHelper.vue复制）
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
    message.info('正在刷新爬塔信息...')
    await tokenStore.sendGameMessage(token.id, 'tower_getinfo', {})
    await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    message.success('爬塔信息刷新成功')
  } catch (error) {
    console.error('刷新爬塔信息失败:', error)
    message.error('刷新爬塔信息失败')
  }
}

// 领取爬塔奖励（从FishHelper.vue复制）
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
    message.info('正在领取爬塔奖励...')
    const roleInfo = token.gameData?.roleInfo
    const tower = roleInfo?.role?.tower
    if (tower && tower.reward) {
      // 遍历所有可领取的奖励
      for (let i = 0; i < 100; i++) {
        if (!tower.reward[i]) {
          await tokenStore.sendGameMessage(token.id, 'tower_claimreward', { rewardId: i })
          message.success(`成功领取第${i}章通关奖励`)
        }
      }
    } else {
      message.warning('没有可领取的奖励')
    }
  } catch (error) {
    console.error('领取爬塔奖励失败:', error)
    message.error('领取爬塔奖励失败')
  }
}

// 开始英雄升星
const startHeroUpgrade = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  try {
    isRunning.value = true
    
    // 检查连接状态，如果未连接则尝试连接
    let status = tokenStore.getWebSocketStatus(token.id)
    
    if (status !== 'connected') {
      message.info('Token未连接，正在尝试连接...')
      
      let retryCount = 0
      const maxRetries = 5
      
      while (status !== 'connected' && retryCount < maxRetries) {
        // 模拟点击token昵称（选择并连接token）
        tokenStore.selectToken(token.id, true)
        
        // 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 检查连接状态
        status = tokenStore.getWebSocketStatus(token.id)
        retryCount++
        
        if (status !== 'connected' && retryCount < maxRetries) {
          message.info(`连接尝试 ${retryCount}/${maxRetries}...`)
        }
      }
      
      // 如果仍未连接，提示错误
      if (status !== 'connected') {
        message.error('连接失败，请手动连接Token后再试')
        return
      }
      
      message.success('Token连接成功')
    }
    
    message.info('开始英雄升星...')
    
    // 英雄ID列表（101-120, 201-228, 301-314）
    const heroIds = [
      ...Array.from({ length: 20 }, (_, i) => 101 + i),
      ...Array.from({ length: 28 }, (_, i) => 201 + i),
      ...Array.from({ length: 14 }, (_, i) => 301 + i),
    ]
    
    let totalUpgrades = 0
    let successCount = 0
    let failCount = 0
    
    for (const heroId of heroIds) {
      let heroUpgradeCount = 0
      
      // 对每个英雄尝试升星，最多10次
      for (let i = 1; i <= 10; i++) {
        let shouldBreak = false
        try {
          const res = await tokenStore.sendMessageWithPromise(
            token.id,
            'hero_heroupgradestar',
            { heroId },
            8000
          )
          
          // 检查响应结果
          if (res && (res.code === 0 || res.code === undefined || res.success === true)) {
            heroUpgradeCount++
            successCount++
            totalUpgrades++
          } else {
            // 升星失败（可能是已达到最大星级或其他原因）
            shouldBreak = true
          }
        } catch (err) {
          // 升星失败，跳过该英雄的剩余次数
          failCount++
          shouldBreak = true
        }
        
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (shouldBreak) {
          break
        }
      }
      
      if (heroUpgradeCount > 0) {
        console.log(`英雄ID ${heroId} 升星 ${heroUpgradeCount} 次`)
      }
    }
    
    message.success(`英雄升星完成！共升星 ${totalUpgrades} 次（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('英雄升星失败:', error)
    message.error('英雄升星失败: ' + (error.message || '未知错误'))
  } finally {
    isRunning.value = false
  }
}

// 开始图鉴升星（从FishHelper.vue复制）
const startBookUpgrade = async () => {
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
    isRunning.value = true
    message.info('开始图鉴升星...')
    const heroIds = [
      ...Array.from({ length: 20 }, (_, i) => 101 + i),
      ...Array.from({ length: 28 }, (_, i) => 201 + i),
      ...Array.from({ length: 14 }, (_, i) => 301 + i),
    ]
    
    for (const heroId of heroIds) {
      for (let i = 1; i <= 10; i++) {
        try {
          await tokenStore.sendMessageWithPromise(
            token.id,
            'book_upgrade',
            { heroId },
            8000
          )
        } catch (err) {
          // 失败后也执行延迟1秒
          await new Promise(resolve => setTimeout(resolve, 1000))
          break
        }
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    message.success('图鉴升星完成')
  } catch (error) {
    console.error('图鉴升星失败:', error)
    message.error('图鉴升星失败')
  } finally {
    isRunning.value = false
  }
}

// 领取图鉴奖励（从FishHelper.vue复制）
const claimBookReward = async () => {
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
    message.info('正在领取图鉴奖励...')
    for (let i = 1; i <= 10; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'book_claimpointreward',
          {},
          8000
        )
      } catch (err) {
        // 失败后也执行延迟1秒
        await new Promise(resolve => setTimeout(resolve, 1000))
        break
      }
      // 每次领取后延迟1秒（无论成功还是失败）
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    message.success('图鉴奖励领取完成')
  } catch (error) {
    console.error('领取图鉴奖励失败:', error)
    message.error('领取图鉴奖励失败')
  }
}

// 解析Token范围（如果为空则返回null，表示执行全部）
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null // null表示执行全部
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

// 按token昵称排序的token列表（与页面显示顺序一致）
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// 获取目标Token列表（根据执行范围或全部）
const getTargetTokens = (tokenIndices) => {
  const tokens = sortedTokens.value // 使用排序后的token列表（与页面显示顺序一致）
  if (tokens.length === 0) {
    return []
  }
  
  // 如果tokenIndices为null，返回所有token（已按sortedTokens顺序排序）
  if (tokenIndices === null) {
    return tokens // sortedTokens已经是按名称排序的
  }
  
  // 否则根据索引范围返回指定token（按sortedTokens中的序号排序）
  return tokenIndices
    .map(index => {
      const arrayIndex = index - 1
      const token = tokens[arrayIndex]
      return token ? { token, index } : null
    })
    .filter(item => item !== null)
    .sort((a, b) => a.index - b.index)
    .map(item => item.token)
}

// 处理批量执行范围输入
const handleBatchTokensInput = (value) => {
  batchTokens.value = value
}

// 连接Token（模拟点击token昵称，最多重试5次）
const connectTokenWithRetry = async (token, tokenIndex) => {
  let status = tokenStore.getWebSocketStatus(token.id)
  
  if (status === 'connected') {
    return true
  }
  
  message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在连接...`)
  
  let retryCount = 0
  const maxRetries = 5
  
  while (status !== 'connected' && retryCount < maxRetries) {
    // 模拟点击token昵称（选择并连接token）
    tokenStore.selectToken(token.id, true)
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 检查连接状态
    status = tokenStore.getWebSocketStatus(token.id)
    retryCount++
    
    if (status !== 'connected' && retryCount < maxRetries) {
      message.info(`[序号${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
    }
  }
  
  if (status !== 'connected') {
    message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败`)
    return false
  }
  
  message.success(`[序号${tokenIndex}] ${token.name || token.id} 连接成功`)
  return true
}

// 执行英雄升星（单个token）
const executeHeroUpgrade = async (token) => {
  const heroIds = [
    ...Array.from({ length: 20 }, (_, i) => 101 + i),
    ...Array.from({ length: 28 }, (_, i) => 201 + i),
    ...Array.from({ length: 14 }, (_, i) => 301 + i),
  ]
  
  for (const heroId of heroIds) {
    for (let i = 1; i <= 10; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'hero_heroupgradestar',
          { heroId },
          8000
        )
        } catch (err) {
          // 失败后也执行延迟1秒
          await new Promise(resolve => setTimeout(resolve, 1000))
          break
        }
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// 执行图鉴升星（单个token）
const executeBookUpgrade = async (token) => {
  const heroIds = [
    ...Array.from({ length: 20 }, (_, i) => 101 + i),
    ...Array.from({ length: 28 }, (_, i) => 201 + i),
    ...Array.from({ length: 14 }, (_, i) => 301 + i),
  ]
  
  for (const heroId of heroIds) {
    for (let i = 1; i <= 10; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'book_upgrade',
          { heroId },
          8000
        )
        } catch (err) {
          // 失败后也执行延迟1秒
          await new Promise(resolve => setTimeout(resolve, 1000))
          break
        }
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// 执行领取图鉴奖励（单个token）
const executeClaimBookReward = async (token) => {
  for (let i = 1; i <= 10; i++) {
    try {
      await tokenStore.sendMessageWithPromise(
        token.id,
        'book_claimpointreward',
        {},
        8000
      )
    } catch (err) {
      // 失败后也执行延迟1秒
      await new Promise(resolve => setTimeout(resolve, 1000))
      break
    }
    // 每次领取后延迟1秒（无论成功还是失败）
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// 批量执行升星操作
const handleBatchUpgrade = async () => {
  const tokens = sortedTokens.value // 使用排序后的token列表
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(batchTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示和排序，与页面显示序号一致）
  const getTokenIndex = (token) => {
    const index = tokens.findIndex(t => t.id === token.id)
    return index + 1 // 序号从1开始，与页面显示序号一致
  }
  
  // 按照token在sortedTokens中的序号排序（与页面显示顺序一致）
  const sortedTargetTokens = targetTokens
    .map(token => ({ token, index: getTokenIndex(token) }))
    .sort((a, b) => a.index - b.index)
    .map(item => item.token)
  
  try {
    isBatchRunning.value = true
    const rangeText = tokenIndices === null ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量升星操作（${rangeText}），共${sortedTargetTokens.length}个Token，按序号顺序执行...`)
    
    for (let i = 0; i < sortedTargetTokens.length; i++) {
      const token = sortedTargetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      try {
        // 1. 连接Token（模拟点击token昵称，最多重试5次）
        const connected = await connectTokenWithRetry(token, tokenIndex)
        if (!connected) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          continue
        }
        
        // 2. 执行英雄升星
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始英雄升星...`)
        await executeHeroUpgrade(token)
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 英雄升星完成`)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 3. 执行图鉴升星
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始图鉴升星...`)
        await executeBookUpgrade(token)
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 图鉴升星完成`)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 4. 执行领取图鉴奖励
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始领取图鉴奖励...`)
        await executeClaimBookReward(token)
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 图鉴奖励领取完成`)
        
        if (i < sortedTargetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Token [序号${tokenIndex}] ${token.name || token.id} 批量升星失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 批量升星失败`)
      }
    }
    
    message.success('批量升星操作完成')
  } catch (error) {
    console.error('批量升星操作失败:', error)
    message.error('批量升星操作失败')
  } finally {
    isBatchRunning.value = false
  }
}
</script>

<style scoped>
.tower-star-upgrade-content {
  width: 100%;
}

.tower-info-section {
  margin-bottom: 1rem;
}

.tower-actions-section,
.star-upgrade-actions-section {
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
