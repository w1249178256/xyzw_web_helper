<template>
  <ScheduledTasksCard />
  
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <GameController />
      </n-icon>
    </template>
    <template #title>
      <h3>养号</h3>
    </template>
    <template #default>
      <div class="account-maintenance">
        <!-- 操作按钮区域 -->
        <CustomizedCard mode="container">
          <CustomizedCard 
            mode="button"
            :name="isBatchMayDayExchange ? '批量五一万能兑换中...' : '批量五一万能兑换'"
            @button-click="handleBatchMayDayExchange"
            :disabled="isBatchMayDayExchange"
            :loading="isBatchMayDayExchange"
          />
          <CustomizedCard 
            mode="button"
            :name="isUsingTorch ? '批量使用火把中...' : '批量使用火把'"
            @button-click="handleUseTorch"
            :disabled="isUsingTorch"
            :loading="isUsingTorch"
          />
          <CustomizedCard 
            mode="button"
            :name="isBuyingWrench ? '黑市购买扳手中...' : '黑市购买扳手'"
            @button-click="handleBuyWrench"
            :disabled="isBuyingWrench"
            :loading="isBuyingWrench"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchClaimingBoxRewards ? '批量领取宝箱奖励中...' : '批量领取宝箱奖励'"
            @button-click="handleBatchClaimBoxRewards"
            :disabled="isBatchClaimingBoxRewards"
            :loading="isBatchClaimingBoxRewards"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchClaimingEmails ? '批量领取邮件中...' : '批量领取邮件'"
            @button-click="handleBatchClaimEmails"
            :disabled="isBatchClaimingEmails"
            :loading="isBatchClaimingEmails"
          />
          <CustomizedCard 
            mode="name-input"
            name="基准宝箱分"
            v-model:inputValue="baseBoxScore"
            placeholder="输入基准宝箱分"
          />
          <CustomizedCard 
            mode="execution-range" 
            name="执行范围" 
            v-model:inputValue="executionTokens" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            @update:inputValue="handleExecutionTokensInput" 
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
            :name="isBatchUpgradingEquipment ? '批量升级装备中...' : '批量升级装备'"
            @button-click="handleBatchUpgradeEquipment"
            :disabled="isBatchUpgradingEquipment"
            :loading="isBatchUpgradingEquipment"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUpgradingHangup ? '批量升级挂机中...' : '批量升级挂机'"
            @button-click="handleBatchUpgradeHangup"
            :disabled="isBatchUpgradingHangup"
            :loading="isBatchUpgradingHangup"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchClaimingHangupReward ? '批量领取推图层数奖励中...' : '批量领取推图层数奖励'"
            @button-click="handleBatchClaimHangupReward"
            :disabled="isBatchClaimingHangupReward"
            :loading="isBatchClaimingHangupReward"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchRenaming ? '批量重命名中...' : '批量重命名'"
            @button-click="handleBatchRename"
            :disabled="isBatchRenaming"
            :loading="isBatchRenaming"
          />
          <CustomizedCard 
            mode="button"
            name="导出详情"
            @button-click="handleExportDetails"
            :disabled="isExportingDetails"
            :loading="isExportingDetails"
          />
          <CustomizedCard 
            mode="button"
            name="批量宝箱周"
            @button-click="handleBatchBoxWeek"
            :disabled="isAnyOperationRunning"
            :loading="isBatchBoxWeekRunning"
          />
          <CustomizedCard 
            mode="button-switch"
            :name="isBatchRecruitWeekRunning ? '批量招募周中...' : '批量招募周'"
            :switch-value="enableRecruitWeek"
            @update:switch-value="(val) => enableRecruitWeek = val"
            @button-click="handleBatchRecruitWeek"
            :disabled="isBatchRecruitWeekRunning"
            :loading="isBatchRecruitWeekRunning"
          />
          <CustomizedCard 
            mode="button"
            :name="isExportingTeam ? '导出阵容中...' : '导出阵容'"
            @button-click="handleExportTeam"
            :disabled="isExportingTeam"
            :loading="isExportingTeam"
          />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="养号"
      />
    </template>
  </MyCard>
</template>

<script setup>
// @unocss-include
// uno-css-ignore-file
import { ref, computed } from 'vue'
import { useTokenStore, selectedTokenId } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import ScheduledTasksCard from '@/diy/OneClickGoldFish/ScheduledTasksCard.vue'
import { GameController } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'
import { HERO_DICT, STAR_DICT } from '@/utils/HeroList'

const tokenStore = useTokenStore()

// 属性配置
const ATTRIBUTES = [
  { id: 1, name: '攻击' },
  { id: 2, name: '血量' },
  { id: 3, name: '防御' },
  { id: 4, name: '速度' },
  { id: 5, name: '破甲' },
  { id: 6, name: '破甲抵抗' },
  { id: 7, name: '精准' },
  { id: 8, name: '格挡' },
  { id: 9, name: '减伤' },
  { id: 10, name: '暴击' },
  { id: 11, name: '暴击抵抗' },
  { id: 12, name: '爆伤' },
  { id: 13, name: '爆伤抵抗' },
  { id: 14, name: '技能伤害' },
  { id: 15, name: '免控' },
  { id: 16, name: '眩晕免疫' },
  { id: 17, name: '冰冻免疫' },
  { id: 18, name: '沉默免疫' },
  { id: 19, name: '流血免疫' },
  { id: 20, name: '中毒免疫' },
  { id: 21, name: '灼烧免疫' }
]

// 颜色配置
const COLORS = [
  { id: 1, name: '白色' },
  { id: 2, name: '绿色' },
  { id: 3, name: '蓝色' },
  { id: 4, name: '紫色' },
  { id: 5, name: '橙色' },
  { id: 6, name: '红色' }
]

// 部位配置
const PARTS = [
  { value: 1, text: '武器' },
  { value: 2, text: '铠甲' },
  { value: 3, text: '头盔' },
  { value: 4, text: '坐骑' }
]
const logStore = useOperationLogStore()
const message = useMessage()

// 根据英雄id获取英雄名称
const getHeroName = (heroId) => {
  if (!heroId) return '无英雄'
  const hero = HERO_DICT[heroId]
  return hero ? hero.name : `英雄${heroId}`
}

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 30000,
  reconnectDelay: 1000,
  maxRetries: 3
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

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 操作状态
const isUsingTorch = ref(false)
const isBuyingWrench = ref(false)
const isBatchUpgradingEquipment = ref(false)
const isBatchUpgradingHangup = ref(false)
const isBatchClaimingHangupReward = ref(false)
const isBatchRenaming = ref(false)
const isRecruitWeekRunning = ref(false)
const isExportingDetails = ref(false)
const isBatchBoxWeekRunning = ref(false)
const isBatchBoxWeekCancelled = ref(false)
const isBatchRecruitWeekRunning = ref(false)
const enableRecruitWeek = ref(false)

// 计算是否有任何操作正在运行
const isAnyOperationRunning = computed(() => {
  return isBatchMayDayExchange.value || 
         isUsingTorch.value || isBuyingWrench.value || 
         isBatchBoxWeekRunning.value || isBatchRecruitWeekRunning.value ||
         isBatchUpgradingEquipment.value || isBatchUpgradingHangup.value ||
         isBatchClaimingHangupReward.value || isBatchRenaming.value || isRecruitWeekRunning.value ||
         isExportingDetails.value
})

// 新增状态
const isBatchClaimingBoxRewards = ref(false)
const isBatchClaimingEmails = ref(false)
const baseBoxScore = ref('')

// 新功能状态
const isExportingTeam = ref(false)
const isBatchMayDayExchange = ref(false)

// 执行范围
const executionTokens = ref('')
const commandDelay = ref(localStorage.getItem('accountMaintenanceCommandDelay') || '600')

// 按token昵称排序的token列表
const sortedTokens = [...tokenStore.gameTokens].sort((a, b) => {
  const nameA = (a.name || '未命名').toLowerCase()
  const nameB = (b.name || '未命名').toLowerCase()
  return nameA.localeCompare(nameB)
})

// 处理执行范围输入
const handleExecutionTokensInput = (value) => {
  executionTokens.value = value
}

// 处理执行间隔输入
const handleCommandDelayInput = (value) => {
  commandDelay.value = value
  localStorage.setItem('accountMaintenanceCommandDelay', value)
}

// 辅助函数：等待执行间隔
const waitCommandDelay = () => new Promise(resolve => setTimeout(resolve, parseInt(commandDelay.value) || 600))

// 解析执行范围
const parseExecutionRange = (rangeStr) => {
  if (!rangeStr || rangeStr.trim() === '') {
    return null // 执行全部
  }
  
  const result = new Set()
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed === '') continue
    
    if (trimmed.includes('-')) {
      // 处理范围，如 1-5
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          result.add(i)
        }
      }
    } else {
      // 处理单个数字，如 1
      const num = Number(trimmed)
      if (!isNaN(num)) {
        result.add(num)
      }
    }
  }
  
  return Array.from(result).sort((a, b) => a - b)
}

// 解析Token范围
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

// 获取目标Token列表
const getTargetTokens = (tokenIndices) => {
  if (sortedTokens.length === 0) {
    return []
  }
  
  if (tokenIndices === null) {
    return sortedTokens
  }
  
  return tokenIndices
    .map(index => {
      const arrayIndex = index - 1
      const token = sortedTokens[arrayIndex]
      return token ? { token, index } : null
    })
    .filter(item => item !== null)
    .sort((a, b) => a.index - b.index)
    .map(item => item.token)
}

// 将星级数字转换为显示文本
// 1-5: 黄星1-黄星5, 6-10: 紫星1-紫星5, 11-15: 橙星1-橙星5
// 16-20: 红星1-红星5, 21-25: 黄冠1-黄冠5, 26-30: 紫冠1-紫冠5
const formatStarLevel = (star) => {
  if (star < 1) return '无'
  if (star <= 5) return `黄星${star}`
  if (star <= 10) return `紫星${star - 5}`
  if (star <= 15) return `橙星${star - 10}`
  if (star <= 20) return `红星${star - 15}`
  if (star <= 25) return `黄冠${star - 20}`
  if (star <= 30) return `紫冠${star - 25}`
  return `未知(${star})`
}

// 批量使用火把
const handleUseTorch = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  
  try {
    isUsingTorch.value = true
    
    message.info(`开始批量使用火把（${rangeText}），共${targetTokens.length}个Token...`)
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始使用火把...`)
          
          let successCount = 0
          let failCount = 0
          let torchQuantity = 0
          
          // 先获取火把数量
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
            torchQuantity = roleInfo?.role?.items?.[1008]?.quantity || 0
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 当前火把数量: ${torchQuantity}`)
          } catch (error) {
            console.error(`获取火把数量失败:`, error)
          }
          
          // 根据火把数量决定每次使用的数量
          const getUseQuantity = (remaining) => {
            if (remaining >= 50) return 50
            if (remaining >= 10) return 10
            return remaining // 不足10个，使用剩余全部
          }
          
          // 执行使用火把命令
          while (torchQuantity > 0) {
            const quantity = getUseQuantity(torchQuantity)
            if (quantity <= 0) break
            
            try {
              await tokenStore.sendItemConsume(token.id, { itemId: 1008, quantity })
              await waitCommandDelay()
              successCount++
              torchQuantity -= quantity
            } catch (error) {
              console.error(`使用火把失败:`, error)
              failCount++
              // 如果服务器错误，跳过执行剩余次数
              if (error.message && error.message.includes('服务器错误')) {
                message.warning(`${token.name} - 使用火把失败: ${error.message}，跳过剩余次数`)
                break
              }
              // 其他错误也继续尝试
              torchQuantity -= quantity
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 使用火把完成：成功${successCount}次，失败${failCount}次`)

          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用火把',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]使用火把完成：成功${successCount}次，失败${failCount}次`
          })

          return { success: true, tokenId: token.id, successCount, failCount }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 使用火把失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 使用火把失败: ${error.message}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用火把',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]使用火把失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    message.success(`批量使用火把完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '使用火把',
      status: 'success',
      message: `批量使用火把完成：成功 ${successCount} 个，失败 ${failureCount} 个`
    })
    
  } catch (error) {
    console.error('批量使用火把失败:', error)
    message.error(`批量使用火把失败: ${error.message}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '使用火把',
      status: 'error',
      message: `批量使用火把失败: ${error.message}`
    })
  } finally {
    isUsingTorch.value = false
  }
}

// 黑市购买扳手
const handleBuyWrench = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  
  try {
    isBuyingWrench.value = true
    
    message.info(`开始黑市购买扳手（${rangeText}），共${targetTokens.length}个Token...`)
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始黑市购买扳手...`)
          
          let successCount = 0
          
          // 执行4次黑市购买扳手
          for (let i = 0; i < 4; i++) {
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'activity_buystoregoods',
                { activityId: 9, goodsIndex: 9, buyNum: 1 },
                5000
              )
              await waitCommandDelay()
              successCount++
            } catch (error) {
              console.error(`第${i + 1}次黑市购买扳手失败:`, error)
              // 如果购买失败，跳过剩余次数
              if (error.message && error.message.includes('服务器错误')) {
                message.warning(`${token.name} - 第${i + 1}次黑市购买扳手失败: ${error.message}，跳过剩余次数`)
                break
              }
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 黑市购买扳手完成：成功${successCount}次`)

          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '黑市购买扳手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]黑市购买扳手完成：成功${successCount}次`
          })

          return { success: true, tokenId: token.id, successCount }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 黑市购买扳手失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 黑市购买扳手失败: ${error.message}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '黑市购买扳手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、黑市购买扳手失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    message.success(`黑市购买扳手完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '黑市购买扳手',
      status: 'success',
      message: `黑市购买扳手完成：成功 ${successCount} 个，失败 ${failureCount} 个`
    })
    
  } catch (error) {
    console.error('黑市购买扳手失败:', error)
    message.error(`黑市购买扳手失败: ${error.message}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '黑市购买扳手',
      status: 'error',
      message: `黑市购买扳手失败: ${error.message}`
    })
  } finally {
    isBuyingWrench.value = false
  }
}

// 批量升级水晶
const handleUpgradeCrystal = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  if (!selectedCrystalHero.value) {
    message.warning('请先选择英雄')
    return
  }

  const selectedHeroName = HERO_DICT[selectedCrystalHero.value]?.name || '未知英雄'
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isUpgradingCrystal.value = true

    message.info(`开始批量升级水晶（${rangeText}），目标英雄: ${selectedHeroName}，共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始升级水晶...`)

          let successCount = 0
          let failCount = 0

          // 循环执行trump_upgrade命令最多20次
          for (let i = 0; i < 20; i++) {
            try {
              const response = await tokenStore.sendMessageWithPromise(
                token.id,
                'trump_upgrade',
                {
                  heroId: selectedCrystalHero.value,
                  isLocked: true,
                  isTrans: false
                },
                10000
              )

              if (response && (response.code === 0 || response.code === undefined)) {
                successCount++
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${i + 1}次升级水晶成功`)
              } else {
                const errorMsg = response?.msg || response?.message || '未知错误'
                throw new Error(errorMsg)
              }

              // 每次升级后等待500ms
              if (i < 19) {
                await waitCommandDelay()
              }
            } catch (error) {
              console.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${i + 1}次升级水晶失败:`, error)
              failCount++
              // 如果报错，跳过剩余执行次数
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 第${i + 1}次升级水晶失败: ${error.message}，跳过剩余次数`)
              break
            }
          }

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升级水晶完成：成功${successCount}次，失败${failCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '升级水晶',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级水晶完成：成功${successCount}次，失败${failCount}次（目标英雄: ${selectedHeroName}）`
          })
          return { success: true, tokenId: token.id, successCount, failCount }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级水晶失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级水晶失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '升级水晶',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级水晶失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    message.success(`批量升级水晶完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级水晶',
      status: 'success',
      message: `批量升级水晶完成，目标英雄: ${selectedHeroName}，成功 ${successCount} 个，失败 ${failureCount} 个`
    })

  } catch (error) {
    console.error('批量升级水晶失败:', error)
    message.error(`批量升级水晶失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级水晶',
      status: 'error',
      message: `批量升级水晶失败: ${error.message || '未知错误'}`
    })
  } finally {
    isUpgradingCrystal.value = false
  }
}

// 批量升级装备
const handleBatchUpgradeEquipment = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchUpgradingEquipment.value = true

    message.info(`开始批量升级装备（${rangeText}），共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始升级装备...`)

          // 执行equipment_batchupgradelevel命令升级装备
          const response = await tokenStore.sendEquipmentBatchUpgradeLevel(token.id, {
            heroId: 107
          })

          if (response && (response.code === 0 || response.code === undefined)) {
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升级装备成功`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '升级装备',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]升级装备成功`
            })
            return { success: true, tokenId: token.id }
          } else {
            const errorMsg = response?.msg || response?.message || '未知错误'
            throw new Error(errorMsg)
          }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级装备失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级装备失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '升级装备',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级装备失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    message.success(`批量升级装备完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级装备',
      status: 'success',
      message: `批量升级装备完成，成功 ${successCount} 个，失败 ${failureCount} 个`
    })

    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '升级装备')
    })

  } catch (error) {
    console.error('批量升级装备失败:', error)
    message.error(`批量升级装备失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级装备',
      status: 'error',
      message: `批量升级装备失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgradingEquipment.value = false
  }
}

// 批量觉醒
const handleBatchAwakeSkill = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  if (!selectedAwakenHero.value) {
    message.warning('请先选择英雄')
    return
  }

  const selectedHeroName = HERO_DICT[selectedAwakenHero.value]?.name || '未知英雄'
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchAwakingSkill.value = true

    message.info(`开始批量觉醒（${rangeText}），目标英雄: ${selectedHeroName}，共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        const tokenIndex = getTokenIndex(token)
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始觉醒...`)

        // 对 index -1, 0, 1, 2 各执行一次觉醒
        const indices = [-1, 0, 1, 2]
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < indices.length; i++) {
          const index = indices[i]
          
          try {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 执行觉醒 (index: ${index})...`)
            
            const response = await tokenStore.sendHeroSkillAwake(token.id, {
              heroId: selectedAwakenHero.value,
              index: index
            })

            if (response && (response.code === 0 || response.code === undefined)) {
              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 觉醒成功 (index: ${index})`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '觉醒',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `【序号${tokenIndex}】[${token.name || token.id}]觉醒成功 (index: ${index})`
              })
              successCount++
            } else {
              const errorMsg = response?.msg || response?.message || '未知错误'
              throw new Error(errorMsg)
            }
          } catch (error) {
            console.error(`[序号${tokenIndex}] ${token.name || token.id} - 觉醒失败 (index: ${index}):`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 觉醒失败 (index: ${index}): ${error.message}，继续执行下一个`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '觉醒',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `【序号${tokenIndex}】[${token.name || token.id}]觉醒失败 (index: ${index}): ${error.message}，继续执行`
            })
            failCount++
            // 失败也继续执行下一个 index
          }

          // 每次执行后等待 500ms
          if (i < indices.length - 1) {
            await waitCommandDelay()
          }
        }

        message.success(`[序号${tokenIndex}] ${token.name || token.id} - 觉醒完成 (成功：${successCount}/4, 失败：${failCount}/4)`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '觉醒',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]觉醒完成 (成功：${successCount}/4, 失败：${failCount}/4)`
        })
        
        return { success: true, tokenId: token.id, successCount, failCount }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    // 统计总结果
    const totalSuccess = results.reduce((sum, r) => sum + (r.successCount || 0), 0)
    const totalFail = results.reduce((sum, r) => sum + (r.failCount || 0), 0)

    message.success(`批量觉醒完成：共执行 ${totalSuccess + totalFail} 次，成功 ${totalSuccess} 次，失败 ${totalFail} 次`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '觉醒',
      status: 'success',
      message: `批量觉醒完成，共执行 ${totalSuccess + totalFail} 次，成功 ${totalSuccess} 次，失败 ${totalFail} 次`
    })

    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '觉醒')
    })

  } catch (error) {
    console.error('批量觉醒失败:', error)
    message.error(`批量觉醒失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '觉醒',
      status: 'error',
      message: `批量觉醒失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchAwakingSkill.value = false
  }
}

// 批量升级挂机
const handleBatchUpgradeHangup = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchUpgradingHangup.value = true

    message.info(`开始批量升级挂机（${rangeText}），共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始升级挂机...`)

          let remainingCount = 0
          let totalUpgradeCount = 0

          const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 5000)
          console.log('role_getroleinfo 响应:', roleInfo)
          
          // 参照身份卡的findItemCount函数实现
          const findItemCount = (items, itemId) => {
            if (!items) {
              return 0
            }
            if (Array.isArray(items)) {
              const item = items.find(i => Number(i.id ?? i.itemId) === itemId)
              return item ? Number(item.num ?? item.count ?? item.quantity ?? 0) : 0
            }
            const item = items[String(itemId)] ?? items[itemId]
            if (item == null) {
              const found = Object.values(items).find(i => Number(i?.itemId ?? i?.id) === itemId)
              return found ? Number(found.num ?? found.count ?? found.quantity ?? 0) : 0
            }
            return typeof item === 'number' ? Number(item) : typeof item === 'object' ? Number(item.quantity ?? item.num ?? item.count ?? 0) : Number(item) || 0
          }
          
          if (roleInfo) {
            const items = roleInfo.items || roleInfo.role?.items
            console.log('items 来源:', items ? (roleInfo.items ? 'roleInfo.items' : 'roleInfo.role.items') : '无')
            console.log('items 结构:', items)
            remainingCount = findItemCount(items, 1024)
            console.log('remainingCount:', remainingCount)
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 当前挂机升级道具数量: ${remainingCount}`)
          } else {
            console.log('roleInfo 不存在:', roleInfo)
          }

          await waitCommandDelay()

          console.log('开始进入while循环，remainingCount:', remainingCount)
          while (remainingCount > 0) {
            console.log('进入while循环，remainingCount:', remainingCount)
            let upgradeNum = 1

            if (remainingCount >= 50) {
              upgradeNum = 50
            } else if (remainingCount >= 10) {
              upgradeNum = 10
            }

            console.log('准备执行system_hangupupgrade，upgradeNum:', upgradeNum)
            
            // 添加重试逻辑处理操作过快错误，一直等待直到成功
            let upgradeSuccess = false
            
            while (!upgradeSuccess) {
              try {
                const response = await tokenStore.sendSystemHangupUpgrade(token.id, {
                  upgradeNum: upgradeNum
                })
                console.log('system_hangupupgrade 响应:', response)

                if (response && (response.code === 0 || response.code === undefined)) {
                  remainingCount -= upgradeNum
                  totalUpgradeCount += upgradeNum
                  console.log('升级成功，剩余数量:', remainingCount, '总使用数量:', totalUpgradeCount)
                  message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升级挂机成功，使用${upgradeNum}个道具，剩余${remainingCount}个`)
                  upgradeSuccess = true
                } else {
                  const errorMsg = response?.msg || response?.message || '未知错误'
                  console.log('升级失败:', errorMsg)
                  throw new Error(errorMsg)
                }
              } catch (error) {
                const errorMsg = String(error.message || '').toLowerCase()
                
                if (errorMsg.includes('操作过快')) {
                  message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 操作过快，等待2分钟后重试...`)
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '升级挂机',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]操作过快，等待2分钟后重试`
                  })
                  await new Promise(resolve => setTimeout(resolve, 120000)) // 等待2分钟
                } else {
                  throw error
                }
              }
            }

            await waitCommandDelay()
          }
          console.log('退出while循环，remainingCount:', remainingCount, 'totalUpgradeCount:', totalUpgradeCount)

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升级挂机完成，共使用${totalUpgradeCount}个道具`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '升级挂机',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级挂机完成，共使用${totalUpgradeCount}个道具`
          })
          return { success: true, tokenId: token.id, totalUpgradeCount }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级挂机失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级挂机失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '升级挂机',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级装备失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    const totalUsed = results.filter(r => r.success).reduce((sum, r) => sum + (r.totalUpgradeCount || 0), 0)

    message.success(`批量升级挂机完成：成功 ${successCount} 个，失败 ${failureCount} 个，共使用${totalUsed}个道具`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级挂机',
      status: 'success',
      message: `批量升级挂机完成，成功 ${successCount} 个，失败 ${failureCount} 个，共使用${totalUsed}个道具`
    })

    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '升级挂机')
    })

  } catch (error) {
    console.error('批量升级挂机失败:', error)
    message.error(`批量升级挂机失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级挂机',
      status: 'error',
      message: `批量升级挂机失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgradingHangup.value = false
  }
}

const handleBatchClaimHangupReward = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchClaimingHangupReward.value = true

    message.info(`开始批量领取推图层数奖励（${rangeText}），共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始领取推图层数奖励...`)

          await tokenStore.sendClaimHangupOrder(token.id, {})
          await waitCommandDelay()

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 领取推图层数奖励完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '领取推图层数奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]领取推图层数奖励完成`
          })
          return { success: true, tokenId: token.id }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 领取推图层数奖励失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 领取推图层数奖励失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '领取推图层数奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]领取推图层数奖励失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    message.success(`批量领取推图层数奖励完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取推图层数奖励',
      status: 'success',
      message: `批量领取推图层数奖励完成，成功 ${successCount} 个，失败 ${failureCount} 个`
    })

    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '领取推图层数奖励')
    })

  } catch (error) {
    console.error('批量领取推图层数奖励失败:', error)
    message.error(`批量领取推图层数奖励失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取推图层数奖励',
      status: 'error',
      message: `批量领取推图层数奖励失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchClaimingHangupReward.value = false
  }
}

// 批量重命名
const handleBatchRename = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchRenaming.value = true

    message.info(`开始批量重命名（${rangeText}），共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始重命名...`)

          // 获取角色信息
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
          await waitCommandDelay()

          const currentName = roleInfo?.role?.name || ''

          // 解析token名称获取服和区
          // 格式如: G8901服-0-721083389-相符 或 D-8901服-0-153241293-相符001
          const tokenName = token.name || ''
          const match = tokenName.match(/(\d+)服-(\d+)/)
          
          if (!match) {
            throw new Error('无法解析Token名称中的服和区信息')
          }

          const serverNum = parseInt(match[1])
          const areaNum = match[2]
          
          // 获取服的后两位
          const serverLastTwo = String(serverNum).slice(-2).padStart(2, '0')
          
          // 构造期望的名称：相符+服后两位+区
          const expectedName = `相符${serverLastTwo}-${areaNum}`

          // 如果名称相同，跳过
          if (currentName === expectedName) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 名称已是"${expectedName}"，无需修改`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量重命名',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]名称已是"${expectedName}"，无需修改`
            })
            return { success: true, tokenId: token.id, skipped: true }
          }

          // 执行重命名
          await tokenStore.sendSystemEditName(token.id, { name: expectedName })
          await waitCommandDelay()

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 重命名成功："${currentName}" -> "${expectedName}"`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量重命名',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]重命名成功："${currentName}" -> "${expectedName}"`
          })
          return { success: true, tokenId: token.id, oldName: currentName, newName: expectedName }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 重命名失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 重命名失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量重命名',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]重命名失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    const successCount = results.filter(r => r.success && !r.skipped).length
    const skippedCount = results.filter(r => r.skipped).length
    const failureCount = results.filter(r => !r.success).length

    message.success(`批量重命名完成：成功 ${successCount} 个，跳过 ${skippedCount} 个，失败 ${failureCount} 个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量重命名',
      status: 'success',
      message: `批量重命名完成，成功 ${successCount} 个，跳过 ${skippedCount} 个，失败 ${failureCount} 个`
    })

  } catch (error) {
    console.error('批量重命名失败:', error)
    message.error(`批量重命名失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量重命名',
      status: 'error',
      message: `批量重命名失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchRenaming.value = false
  }
}

// 批量使用万能红
const handleUseUniversalRed = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  if (!selectedUniversalRedHero.value) {
    message.warning('请先选择英雄')
    return
  }

  const selectedHeroName = HERO_DICT[selectedUniversalRedHero.value]?.name || '未知英雄'
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isUsingUniversalRed.value = true

    message.info(`开始批量使用万能红（${rangeText}），目标英雄: ${selectedHeroName}，共${targetTokens.length}个Token...`)

    // 逐个处理Token
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始使用万能红...`)

      try {
        // 连接Token
        const status = tokenStore.getWebSocketStatus(token.id)
        if (status !== 'connected') {
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在连接Token`)
          await tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
          let retryCount = 0
          while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 30) {
            await waitCommandDelay()
            retryCount++
          }

          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            throw new Error('Token连接失败')
          }
        }

        // 获取角色信息，获取万能红数量和目标英雄星级、碎片数量
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在获取角色信息...`)
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        if (!roleInfo || !roleInfo.role || !roleInfo.role.items) {
          throw new Error('获取角色信息失败')
        }

        const universalRedCount = roleInfo.role.items['3201']?.quantity || 0

        // 获取目标英雄星级
        let heroStar = 0
        const heroId = selectedUniversalRedHero.value
        if (roleInfo.role.heroes && roleInfo.role.heroes[heroId]) {
          heroStar = roleInfo.role.heroes[heroId].star || 0
        }

        // 获取英雄碎片数量（碎片itemId与heroId相同）
        let heroFragmentCount = 0
        if (roleInfo.role.items && roleInfo.role.items[heroId]) {
          heroFragmentCount = roleInfo.role.items[heroId].quantity || 0
        } else if (roleInfo.role.items && roleInfo.role.items[String(heroId)]) {
          heroFragmentCount = roleInfo.role.items[String(heroId)].quantity || 0
        }

        // 确定目标星级：吕布(107)、太史慈(120)、郭嘉(102)最多30星，其他红将最多28星
        const targetStar = (heroId === 107 || heroId === 120 || heroId === 102) ? 30 : 28

        // 在控制台和操作日志中显示获取的信息
        console.log(`[序号${tokenIndex}] 获取的信息：${selectedHeroName}：${heroStar}星，碎片：${heroFragmentCount}，万能红：${universalRedCount}，目标：${targetStar}星`)
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 获取的信息：${selectedHeroName}：${heroStar}星，碎片：${heroFragmentCount}，万能红：${universalRedCount}，目标：${targetStar}星`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '使用万能红',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]获取的信息：${selectedHeroName}：${heroStar}星，碎片：${heroFragmentCount}，万能红：${universalRedCount}，目标：${targetStar}星`
        })

        // 计算从当前星级升到目标星级需要的总碎片
        let totalFragmentNeeded = 0
        for (let star = heroStar; star < targetStar; star++) {
          const cost = STAR_DICT[star]?.cost || 0
          totalFragmentNeeded += cost
        }

        // 计算缺少的万能红数量 = 所需碎片总数 - 现有碎片数量
        const universalRedNeeded = Math.max(0, totalFragmentNeeded - heroFragmentCount)
        const actualUseCount = Math.min(universalRedCount, universalRedNeeded)

        // 在控制台和操作日志中显示计算结果
        console.log(`[序号${tokenIndex}] 计算结果：升${targetStar}星需${totalFragmentNeeded}碎片，缺${universalRedNeeded}万能红，实际使用${actualUseCount}个`)
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 计算结果：升${targetStar}星需${totalFragmentNeeded}碎片，缺${universalRedNeeded}万能红，实际使用${actualUseCount}个`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '使用万能红',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]计算结果：升${targetStar}星需${totalFragmentNeeded}碎片，缺${universalRedNeeded}万能红，实际使用${actualUseCount}个`
        })

        // 判断是否是吕布、太史慈或郭嘉
        const isSpecialHero = selectedUniversalRedHero.value === 107 || selectedUniversalRedHero.value === 120 || selectedUniversalRedHero.value === 102

        // 条件判断：吕布/太史慈/郭嘉>=30星停止，非吕布>=28星停止
        if (isSpecialHero && heroStar >= 30) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${selectedHeroName}已${heroStar}星（>=30星），停止使用万能红`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用万能红',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${selectedHeroName}已${heroStar}星（>=30星），停止使用万能红`
          })
        } else if (!isSpecialHero && heroStar >= 28) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${selectedHeroName}已${heroStar}星（>=28星），停止使用万能红`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用万能红',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${selectedHeroName}已${heroStar}星（>=28星），停止使用万能红`
          })
        } else if (universalRedCount === 0) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 没有万能红，跳过`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用万能红',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]没有万能红，跳过`
          })
        } else {
          // 使用计算出的实际使用数量
          // 分批使用万能红，每次最多999个
          let remainingCount = actualUseCount
          let totalUsed = 0
          let batchCount = 0

          while (remainingCount > 0) {
            const useCount = Math.min(remainingCount, 999)
            batchCount++

            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${batchCount}批使用万能红: ${useCount}个`)

            try {
              await tokenStore.sendItemOpenPack(token.id, {
                index: selectedUniversalRedHero.value - 101,
                itemId: 3201,
                number: useCount
              })

              remainingCount -= useCount
              totalUsed += useCount

              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 第${batchCount}批使用万能红成功: ${useCount}个`)

              // 每批之间等待500ms
              if (remainingCount > 0) {
                await waitCommandDelay()
              }
            } catch (error) {
              message.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${batchCount}批使用万能红失败: ${error.message || '未知错误'}`)
              throw error
            }
          }

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 使用万能红完成，共使用${totalUsed}个`)

          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用万能红',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红${totalUsed}个（原${heroStar}星）`
          })

          // 只有在使用了 400 个万能红（升了一星）的情况下才执行升星操作
          if (totalUsed >= 400) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 已使用${totalUsed}个万能红，开始执行升星操作...`)
            
            // 等待 1 秒后开始升星
            await waitCommandDelay()

            // 开始升星，最多 10 次
            let upgradeCount = 0
            for (let upgradeAttempt = 1; upgradeAttempt <= 10; upgradeAttempt++) {
              try {
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${upgradeAttempt}次升星...`)
                
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradestar',
                  { heroId: selectedUniversalRedHero.value },
                  8000
                )

                upgradeCount++
                message.success(`[序号${tokenIndex}] ${token.name || token.id} - 第${upgradeAttempt}次升星成功`)

                // 升星后等待 1 秒
                await waitCommandDelay()
              } catch (error) {
                const errorMsg = error.message || String(error)
                // 检查是否是物品数量不足的错误
                if (errorMsg.includes('物品数量不足') || errorMsg.includes('400010')) {
                  message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 万能红碎片不足，停止升星`)
                  break
                }
                // 其他错误也停止
                message.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${upgradeAttempt}次升星失败：${errorMsg}`)
                break
              }
            }

            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升星完成，共升星${upgradeCount}次`)

            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '使用万能红',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红${totalUsed}个，升星${upgradeCount}次（原${heroStar}星）`
            })
          } else {
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '使用万能红',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红${totalUsed}个（未满 400，不升星，原${heroStar}星）`
            })
          }
        }

      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} - 使用万能红失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id} - 使用万能红失败: ${error.message || '未知错误'}`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '使用万能红',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红失败: ${error.message || '未知错误'}`
        })
      } finally {
        // 关闭WebSocket连接
        if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
          await tokenStore.closeWebSocketConnection(token.id)
        }
      }

      // 处理完一个 Token 后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待 1 秒后处理下一个 Token...`)
        await waitCommandDelay()
      }
    }

    message.success(`批量使用万能红完成，共处理${targetTokens.length}个Token`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '使用万能红',
      status: 'success',
      message: `批量使用万能红完成，目标英雄: ${selectedHeroName}，共处理${targetTokens.length}个Token`
    })

  } catch (error) {
    console.error('批量使用万能红失败:', error)
    message.error(`批量使用万能红失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '使用万能红',
      status: 'error',
      message: `批量使用万能红失败: ${error.message || '未知错误'}`
    })
  } finally {
    isUsingUniversalRed.value = false
  }
}

// 单个英雄升星
const upgradeSingleHero = async (token, tokenIndex, heroId, heroName) => {
  try {
    // 获取角色信息，获取目标英雄星级
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    if (!roleInfo || !roleInfo.role || !roleInfo.role.heroes) {
      throw new Error('获取角色信息失败')
    }

    // 获取目标英雄星级
    let heroStar = 0
    const heroIdStr = String(heroId)
    if (roleInfo.role.heroes[heroIdStr]) {
      heroStar = roleInfo.role.heroes[heroIdStr].star || 0
    }

    message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}星级：${heroStar}`)

    // 等待 1 秒后开始升星
    message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}等待 1 秒后开始升星...`)
    await waitCommandDelay()

    // 如果目标英雄 30 星，跳过
    if (heroStar >= 30) {
      message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}已 30 星，跳过`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升星',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}已 30 星，跳过`
      })
      return
    }

    // 开始升星，最多 10 次
    let upgradeCount = 0
    for (let upgradeAttempt = 1; upgradeAttempt <= 10; upgradeAttempt++) {
      try {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}第${upgradeAttempt}次升星...`)
        
        await tokenStore.sendMessageWithPromise(
          token.id,
          'hero_heroupgradestar',
          { heroId: heroId },
          8000
        )

        upgradeCount++
        message.success(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}第${upgradeAttempt}次升星成功`)

        // 升星后等待 1 秒
        await waitCommandDelay()
      } catch (error) {
        const errorMsg = error.message || String(error)
        // 检查是否是物品数量不足的错误
        if (errorMsg.includes('物品数量不足') || errorMsg.includes('400010')) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}万能红碎片不足，停止升星`)
          break
        }
        // 其他错误也停止
        message.error(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}第${upgradeAttempt}次升星失败：${errorMsg}`)
        break
      }
    }

    message.success(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}升星完成，共升星${upgradeCount}次`)

    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升星完成，共升星${upgradeCount}次（原${heroStar}星）`
    })
  } catch (error) {
    console.error(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}升星失败:`, error)
    message.error(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}升星失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升星失败：${error.message || '未知错误'}`
    })
  }
}

// 批量升星（只升星，不使用万能红）
const handleUpgradeLuBuStar = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的 Token')
    return
  }

  if (!selectedUpgradeStarHero.value) {
    message.warning('请先选择英雄')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isUpgradingLuBuStar.value = true

    // 判断是否选择了被动紫将
    const isPassive = selectedUpgradeStarHero.value === 'passive'
    
    if (isPassive) {
      message.info(`开始批量升星被动紫将（${rangeText}），共${targetTokens.length}个 Token...`)
    } else {
      const selectedHeroName = HERO_DICT[selectedUpgradeStarHero.value]?.name || '未知英雄'
      message.info(`开始批量升星（${rangeText}），目标英雄: ${selectedHeroName}，共${targetTokens.length}个 Token...`)
    }

    // 逐个处理 Token
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      if (isPassive) {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始被动紫将升星...`)
      } else {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始升星...`)
      }

      try {
        // 连接 Token
        const status = tokenStore.getWebSocketStatus(token.id)
        if (status !== 'connected') {
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在连接 Token`)
          await tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
          let retryCount = 0
          while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 30) {
            await waitCommandDelay()
            retryCount++
          }

          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            throw new Error('Token 连接失败')
          }
        }

        if (isPassive) {
          // 对10个被动紫将依次升星
          for (const hero of passiveHeroes) {
            await upgradeSingleHero(token, tokenIndex, hero.id, hero.name)
            // 每个英雄升星后等待1秒
            await waitCommandDelay()
          }
        } else {
          const selectedHeroName = HERO_DICT[selectedUpgradeStarHero.value]?.name || '未知英雄'
          await upgradeSingleHero(token, tokenIndex, selectedUpgradeStarHero.value, selectedHeroName)
        }

      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} - 升星失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id} - 升星失败：${error.message || '未知错误'}`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]升星失败：${error.message || '未知错误'}`
        })
      } finally {
        // 关闭 WebSocket 连接
        if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
          await tokenStore.closeWebSocketConnection(token.id)
        }
      }

      // 处理完一个 Token 后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待 1 秒后处理下一个 Token...`)
        await waitCommandDelay()
      }
    }

    if (isPassive) {
      message.success(`批量升星被动紫将完成，共处理${targetTokens.length}个 Token`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升星',
        status: 'success',
        message: `批量升星被动紫将完成，共处理${targetTokens.length}个 Token`
      })
    } else {
      const selectedHeroName = HERO_DICT[selectedUpgradeStarHero.value]?.name || '未知英雄'
      message.success(`批量升星完成，共处理${targetTokens.length}个 Token`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升星',
        status: 'success',
        message: `批量升星${selectedHeroName}完成，共处理${targetTokens.length}个 Token`
      })
    }

  } catch (error) {
    if (isPassive) {
      console.error('批量升星被动紫将失败:', error)
      message.error(`批量升星被动紫将失败：${error.message || '未知错误'}`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升星',
        status: 'error',
        message: `批量升星被动紫将失败：${error.message || '未知错误'}`
      })
    } else {
      console.error('批量升星失败:', error)
      message.error(`批量升星失败：${error.message || '未知错误'}`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升星',
        status: 'error',
        message: `批量升星失败：${error.message || '未知错误'}`
      })
    }
  } finally {
    isUpgradingLuBuStar.value = false
  }
}

// 批量英雄合成
const handleBatchHeroSynthetic = async () => {
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量英雄合成（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量英雄合成',
    status: 'info',
    message: `开始批量英雄合成（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroSynthetic.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          
          // 根据选择确定 itemId
          let itemId
          if (selectedSyntheticHero.value === 'lvbu') {
            // 选择吕布，执行参数 107
            itemId = 107
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成吕布...`)
          } else if (selectedSyntheticHero.value === 'zhangfei') {
            // 选择张飞，执行参数 204
            itemId = 204
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成张飞...`)
          } else if (selectedSyntheticHero.value === 'hetaishici') {
            // 选择合太史慈，执行参数 120
            itemId = 120
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成太史慈...`)
          } else if (selectedSyntheticHero.value === 'heguojia') {
            // 选择合郭嘉，执行参数 102
            itemId = 102
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成郭嘉...`)
          } else {
            // 选择全部，参照英雄升星执行全部红将、橙将、紫将
            // 红将：101-120，橙将：201-228，紫将：301-314
            const allHeroes = []
            
            // 红将
            for (let i = 101; i <= 120; i++) {
              allHeroes.push(i)
            }
            // 橙将
            for (let i = 201; i <= 228; i++) {
              allHeroes.push(i)
            }
            // 紫将
            for (let i = 301; i <= 314; i++) {
              allHeroes.push(i)
            }
            
            // 逐个执行英雄合成
            for (const heroId of allHeroes) {
              try {
                await tokenStore.sendHeroSynthetic(token.id, { itemId: heroId })
                await waitCommandDelay()
              } catch (error) {
                // 忽略单个英雄合成失败
              }
            }
            
            message.success(`[${tokenIndex}] ${token.name || token.id} 全部英雄合成完成`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量英雄合成',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]全部英雄合成完成`
            })
            
            return { success: true }
          }
          
          // 执行英雄合成
          await tokenStore.sendHeroSynthetic(token.id, { itemId: itemId })
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 英雄合成成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量英雄合成',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]英雄合成成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 英雄合成失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 英雄合成失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量英雄合成',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、英雄合成失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量英雄合成完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量英雄合成',
      status: 'success',
      message: `批量英雄合成完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量英雄合成出错:', error)
    message.error(`批量英雄合成出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量英雄合成',
      status: 'error',
      message: `批量英雄合成出错：${error.message || error}`
    })
  } finally {
    isBatchHeroSynthetic.value = false
  }
}

// 批量上阵吕布（2吕布/0吕布）
const handleBatchLuBuBattle = async (slotType) => {
  const slot = slotType === '107_slot2' ? 2 : 0
  const slotText = slotType === '107_slot2' ? '2号位' : '0号位'
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量上阵吕布（${slotText}，${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量上阵',
    status: 'info',
    message: `开始批量上阵吕布（${slotText}，${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroBattle.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵吕布（${slotText}）...`)
          
          // 步骤1: 获取当前上阵阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          let currentTeam = {}
          if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            currentTeam = fightResult.battleData.leftTeam.team
          } else if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            currentTeam = fightResult.body.battleData.leftTeam.team
          }
          
          // 步骤2: 获取角色信息，找到等级最高的英雄
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          let heroes = null
          if (roleInfo && roleInfo.role && roleInfo.role.heroes) {
            heroes = roleInfo.role.heroes
          } else if (roleInfo && roleInfo._raw && roleInfo._raw.body && roleInfo._raw.body.role && roleInfo._raw.body.role.heroes) {
            heroes = roleInfo._raw.body.role.heroes
          } else if (roleInfo && roleInfo.body && roleInfo.body.role && roleInfo.body.role.heroes) {
            heroes = roleInfo.body.role.heroes
          }
          
          if (!heroes) {
            throw new Error('无法获取英雄信息')
          }
          
          // 找到等级最高的英雄
          let maxLevel = 0
          let maxLevelHeroId = null
          
          for (const [heroId, heroInfo] of Object.entries(heroes)) {
            const level = heroInfo.level || 0
            if (level > maxLevel) {
              maxLevel = level
              maxLevelHeroId = parseInt(heroId)
            }
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]等级最高英雄: ${HERO_DICT[maxLevelHeroId]?.name || maxLevelHeroId} (等级${maxLevel})`
          })
          
          // 步骤3: 如果等级最高不是吕布，执行替换
          if (maxLevelHeroId !== 107) {
            message.info(`[${tokenIndex}] ${token.name || token.id} 正在替换吕布...`)
            
            await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_exchange',
              {
                heroId: maxLevelHeroId,
                targetHeroId: 107
              },
              10000
            )
            await waitCommandDelay()
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]替换吕布成功: ${HERO_DICT[maxLevelHeroId]?.name || maxLevelHeroId} → 吕布`
            })
          } else {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]等级最高已是吕布，无需替换`
            })
          }
          
          // 步骤4: 检查目标位置是否已有吕布
          const targetSlotHero = currentTeam[String(slot)] || currentTeam[slot]
          const targetSlotHeroId = targetSlotHero && targetSlotHero.id ? targetSlotHero.id : 0
          
          if (targetSlotHeroId === 107) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]${slotText}已有吕布，无需上阵`
            })
          } else {
            // 步骤5: 上阵吕布到指定位置
            await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 107, slot })
            await waitCommandDelay()
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]上阵吕布成功（${slotText}）`
            })
          }
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵吕布成功（${slotText}）`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]上阵吕布成功（${slotText}）`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵吕布失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵吕布失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `上阵吕布失败（${slotText}）：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    const failedTokens = results
      .filter(r => !r.success)
      .map(r => r.token?.name || r.token?.id || '未知')
    
    let summaryMsg = `批量上阵吕布（${slotText}）完成，成功${successCount}个，失败${failCount}个`
    if (failedTokens.length > 0) {
      summaryMsg += `，失败账号：${failedTokens.join('、')}`
    }
    
    message.success(summaryMsg)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵',
      status: 'success',
      message: summaryMsg
    })
  } catch (error) {
    console.error('批量上阵吕布出错:', error)
    message.error(`批量上阵吕布出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵',
      status: 'error',
      message: `批量上阵吕布出错：${error.message || error}`
    })
  } finally {
    isBatchHeroBattle.value = false
  }
}

// 批量上阵（吕布/张飞/魏延）
const handleBatchHeroBattle = async () => {
  const selectedValue = selectedBatchHero.value
  let heroId, heroName, slot
  
  if (selectedValue === 'story') {
    return await handleBatchStoryTeamInternal()
  }
  
  if (selectedValue === 'tower') {
    return await handleBatchTowerTeamInternal()
  }
  
  // 处理2吕布和0吕布
  if (selectedValue === '107_slot2' || selectedValue === '107_slot0') {
    return await handleBatchLuBuBattle(selectedValue)
  }
  
  heroId = parseInt(selectedValue)
  
  if (heroId === 107) {
    heroName = '吕布'
    slot = 0
  } else if (heroId === 204) {
    heroName = '张飞'
    slot = 1
  } else if (heroId === 217) {
    heroName = '魏延'
    slot = 4
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量上阵${heroName}（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量上阵',
    status: 'info',
    message: `开始批量上阵${heroName}（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroBattle.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵${heroName}...`)
          
          if (heroId === 217) {
            const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
            await waitCommandDelay()
            
            let heroes = null
            if (roleInfo && roleInfo.role && roleInfo.role.heroes) {
              heroes = roleInfo.role.heroes
            } else if (roleInfo && roleInfo._raw && roleInfo._raw.body && roleInfo._raw.body.role && roleInfo._raw.body.role.heroes) {
              heroes = roleInfo._raw.body.role.heroes
            } else if (roleInfo && roleInfo.body && roleInfo.body.role && roleInfo.body.role.heroes) {
              heroes = roleInfo.body.role.heroes
            }
            
            const weiYanHero = heroes ? (heroes['217'] || heroes[217]) : null
            const weiYanLevel = weiYanHero?.level || 0
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `魏延等级: ${weiYanLevel}`
            })
            
            if (weiYanLevel < 400) {
              await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 217, slot: 4 })
              await waitCommandDelay()
              
              message.success(`[${tokenIndex}] ${token.name || token.id} 上阵魏延成功`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量上阵',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `上阵魏延成功`
              })
            } else {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量上阵',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `魏延等级${weiYanLevel}≥400，先下阵再重生`
              })
              
              await tokenStore.sendHeroGoBackBattle(token.id, { heroId: 217, slot: 4 })
              await waitCommandDelay()
              
              await tokenStore.sendHeroRebirth(token.id, { heroId: 217 })
              await waitCommandDelay()
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量上阵',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `开始升级魏延到250级`
              })
              
              let currentLevel = 1
              while (currentLevel < 250) {
                const upgradeNum = calculateUpgradeNum(currentLevel)
                
                try {
                  const upgradeRes = await tokenStore.sendMessageWithPromise(
                    token.id,
                    'hero_heroupgradelevel',
                    {
                      heroId: 217,
                      upgradeNum: upgradeNum
                    },
                    5000
                  )
                  
                  const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
                  const errorMsgStr = String(errorMsg).toLowerCase()
                  
                  if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060') || errorMsgStr.includes('需要升阶')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量上阵',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `魏延需要升阶，执行进阶命令`
                    })
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: 217
                      },
                      5000
                    )
                    await waitCommandDelay()
                    continue
                  }
                  
                  if (errorMsgStr.includes('物品数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量上阵',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `升级魏延失败: 物品数量不足`
                    })
                    break
                  }
                  
                  let heroesData = null
                  if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
                    heroesData = upgradeRes.role.heroes
                  } else if (upgradeRes && upgradeRes._raw && upgradeRes._raw.body && upgradeRes._raw.body.role && upgradeRes._raw.body.role.heroes) {
                    heroesData = upgradeRes._raw.body.role.heroes
                  } else if (upgradeRes && upgradeRes.body && upgradeRes.body.role && upgradeRes.body.role.heroes) {
                    heroesData = upgradeRes.body.role.heroes
                  }
                  
                  if (heroesData) {
                    let updatedHero = null
                    if (Array.isArray(heroesData)) {
                      updatedHero = heroesData.find(h => Number(h.heroId) === 217)
                    } else if (typeof heroesData === 'object') {
                      updatedHero = heroesData[217] || heroesData['217'] ||
                                   Object.values(heroesData).find(h => h && Number(h.heroId) === 217)
                    }
                    
                    if (updatedHero && updatedHero.level > currentLevel) {
                      const oldLevel = currentLevel
                      currentLevel = updatedHero.level
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量上阵',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'success',
                        message: `【序号${tokenIndex}】[${token.name || token.id}]魏延升级成功: ${oldLevel} → ${currentLevel}`
                      })
                    } else {
                      break
                    }
                  } else {
                    break
                  }
                } catch (error) {
                  const errorMsg = String(error.message || error || '').toLowerCase()
                  if (errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公') || errorMsg.includes('400060') || errorMsg.includes('需要升阶')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量上阵',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `魏延需要升阶(异常)，执行进阶命令`
                    })
                    try {
                      await tokenStore.sendMessageWithPromise(
                        token.id,
                        'hero_heroupgradeorder',
                        {
                          heroId: 217
                        },
                        5000
                      )
                      await waitCommandDelay()
                      continue
                    } catch (orderError) {
                      console.error(`进阶魏延失败:`, orderError)
                      break
                    }
                  }
                  console.error(`升级魏延失败:`, error)
                  break
                }
              }
              
              await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 217, slot: 4 })
              await waitCommandDelay()
              
              message.success(`[${tokenIndex}] ${token.name || token.id} 上阵魏延成功`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量上阵',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `上阵魏延成功`
              })
            }
          } else {
            await tokenStore.sendHeroGoIntoBattle(token.id, { heroId, slot })
            
            message.success(`[${tokenIndex}] ${token.name || token.id} 上阵${heroName}成功`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `上阵${heroName}成功`
            })
          }
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵${heroName}失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵${heroName}失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `上阵${heroName}失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量上阵${heroName}完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵',
      status: 'success',
      message: `批量上阵${heroName}完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量上阵出错:', error)
    message.error(`批量上阵出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵',
      status: 'error',
      message: `批量上阵出错：${error.message || error}`
    })
  } finally {
    isBatchHeroBattle.value = false
  }
}

// 批量上阵爬塔
const handleBatchTowerTeamInternal = async () => {
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量上阵爬塔（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量上阵爬塔',
    status: 'info',
    message: `开始批量上阵爬塔（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroBattle.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵爬塔武将...`)
          
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          let currentTeam = {}
          if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            currentTeam = fightResult.battleData.leftTeam.team
          } else if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            currentTeam = fightResult.body.battleData.leftTeam.team
          }
          
          const currentHeroes = {}
          for (let pos = 0; pos < 5; pos++) {
            const hero = currentTeam[String(pos)] || currentTeam[pos]
            currentHeroes[pos] = hero && hero.id ? hero.id : 0
          }
          
          const targetTeam = [
            { slot: 0, heroId: 116 },
            { slot: 1, heroId: 102 },
            { slot: 2, heroId: 107 },
            { slot: 3, heroId: 104 },
            { slot: 4, heroId: 112 }
          ]
          
          const changedHeroes = []
          const skippedHeroes = []
          
          for (const target of targetTeam) {
            if (currentHeroes[target.slot] !== target.heroId) {
              await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: target.heroId, slot: target.slot })
              await waitCommandDelay()
              changedHeroes.push(`${getHeroName(target.heroId)}(位置${target.slot})`)
            } else {
              skippedHeroes.push(`${getHeroName(target.heroId)}(位置${target.slot})`)
            }
          }
          
          const changeLog = changedHeroes.length > 0 ? `更换: ${changedHeroes.join(', ')}` : '无更换'
          const skipLog = skippedHeroes.length > 0 ? `跳过: ${skippedHeroes.join(', ')}` : '无跳过'
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵爬塔武将成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]上阵爬塔武将成功，${changeLog}，${skipLog}`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵爬塔武将失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵爬塔武将失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、上阵爬塔武将失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量上阵爬塔完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵爬塔',
      status: 'success',
      message: `批量上阵爬塔完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量上阵爬塔出错:', error)
    message.error(`批量上阵爬塔出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵爬塔',
      status: 'error',
      message: `批量上阵爬塔出错：${error.message || error}`
    })
  } finally {
    isBatchHeroBattle.value = false
  }
}

// 批量上阵推图
const handleBatchStoryTeamInternal = async () => {
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量上阵推图（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量上阵推图',
    status: 'info',
    message: `开始批量上阵推图（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroBattle.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵推图武将...`)
          
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          let currentTeam = {}
          if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            currentTeam = fightResult.battleData.leftTeam.team
          } else if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            currentTeam = fightResult.body.battleData.leftTeam.team
          }
          
          const currentHeroes = {}
          for (let pos = 0; pos < 5; pos++) {
            const hero = currentTeam[String(pos)] || currentTeam[pos]
            currentHeroes[pos] = hero && hero.id ? hero.id : 0
          }
          
          const targetTeam = [
            { slot: 0, heroId: 107 },
            { slot: 1, heroId: 204 },
            { slot: 2, heroId: 110 },
            { slot: 3, heroId: 106 },
            { slot: 4, heroId: 217 }
          ]
          
          const changedHeroes = []
          const skippedHeroes = []
          
          for (const target of targetTeam) {
            if (currentHeroes[target.slot] !== target.heroId) {
              await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: target.heroId, slot: target.slot })
              await waitCommandDelay()
              changedHeroes.push(`${getHeroName(target.heroId)}(位置${target.slot})`)
            } else {
              skippedHeroes.push(`${getHeroName(target.heroId)}(位置${target.slot})`)
            }
          }
          
          const changeLog = changedHeroes.length > 0 ? `更换: ${changedHeroes.join(', ')}` : '无更换'
          const skipLog = skippedHeroes.length > 0 ? `跳过: ${skippedHeroes.join(', ')}` : '无跳过'
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵推图武将成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵推图',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]上阵推图武将成功，${changeLog}，${skipLog}`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵推图武将失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵推图武将失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵推图',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、上阵推图武将失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量上阵推图完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵推图',
      status: 'success',
      message: `批量上阵推图完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量上阵推图出错:', error)
    message.error(`批量上阵推图出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵推图',
      status: 'error',
      message: `批量上阵推图出错：${error.message || error}`
    })
  } finally {
    isBatchHeroBattle.value = false
  }
}

// 批量五一万能兑换
const handleBatchMayDayExchange = async () => {
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量五一万能兑换（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量五一万能兑换',
    status: 'info',
    message: `开始批量五一万能兑换（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchMayDayExchange.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在执行五一万能兑换...`)
          
          const exchangeList = [
            { goodsId: 260501424, count: 1 },
            { goodsId: 260501427, count: 1 },
            { goodsId: 260501428, count: 2 },
            { goodsId: 260501432, count: 2 }
          ]
          
          for (const exchange of exchangeList) {
            for (let i = 0; i < exchange.count; i++) {
              try {
                await tokenStore.sendActivityExchange(token.id, {
                  activityId: 2605014,
                  goodsId: exchange.goodsId,
                  quantity: 1
                })
              } catch (error) {
                // 执行失败也不停止
              }
              await waitCommandDelay()
            }
          }
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 五一万能兑换成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量五一万能兑换',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]五一万能兑换成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 五一万能兑换失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 五一万能兑换失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量五一万能兑换',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、五一万能兑换失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量五一万能兑换完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量五一万能兑换',
      status: 'success',
      message: `批量五一万能兑换完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量五一万能兑换出错:', error)
    message.error(`批量五一万能兑换出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量五一万能兑换',
      status: 'error',
      message: `批量五一万能兑换出错：${error.message || error}`
    })
  } finally {
    isBatchMayDayExchange.value = false
  }
}

// 批量兑换码
const handleBatchClaimCDK = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  const cdkCodes = [
    { key: 'happy666', platformType: 'h5' },
    { key: 'HAPPY666', platformType: 'h5' }
  ]

  try {
    isBatchClaimingCDK.value = true

    message.info(`开始批量兑换码（${rangeText}），共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        const tokenIndex = getTokenIndex(token)
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < cdkCodes.length; i++) {
          const cdk = cdkCodes[i]
          try {
            message.info(`【序号${tokenIndex}】${token.name || token.id} 正在兑换第${i + 1}个兑换码: ${cdk.key}...`)
            
            await tokenStore.sendSystemClaimCdkReward(token.id, { key: cdk.key, platformType: cdk.platformType })
            
            successCount++
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量兑换码',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]兑换码${cdk.key}领取成功`
            })
          } catch (error) {
            failCount++
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量兑换码',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `【序号${tokenIndex}】[${token.name || token.id}]兑换码${cdk.key}领取失败: ${error.message}`
            })
          }
          
          // 每个兑换码之间间隔
          if (i < cdkCodes.length - 1) {
            await waitCommandDelay()
          }
        }

        return { success: successCount > 0, tokenId: token.id, successCount, failCount }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    message.success(`批量兑换码完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量兑换码',
      status: 'success',
      message: `批量兑换码完成，成功 ${successCount} 个，失败 ${failureCount} 个`
    })

  } catch (error) {
    console.error('批量兑换码失败:', error)
    message.error(`批量兑换码失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量兑换码',
      status: 'error',
      message: `批量兑换码失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchClaimingCDK.value = false
  }
}

// 购买升级赤羽
const handleUpgradeChiYu = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的 Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isUpgradingChiYu.value = true

    message.info(`开始购买升级赤羽（${rangeText}），共${targetTokens.length}个 Token...`)

    // 逐个处理 Token
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始购买升级赤羽...`)

      try {
        // 连接 Token
        const status = tokenStore.getWebSocketStatus(token.id)
        if (status !== 'connected') {
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在连接 Token`)
          await tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
          let retryCount = 0
          while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 30) {
            await waitCommandDelay()
            retryCount++
          }

          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} - Token 连接失败，跳过`)
            continue
          }
        }

        // 执行 activity_buygoods 2 次
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 执行 activity_buygoods 2 次`)
        for (let j = 0; j < 2; j++) {
          try {
            await tokenStore.sendActivityBuyGoods(token.id, {
              type: 1,
              goodsId: 8304
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${j + 1}次购买赤羽成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 第${j + 1}次购买赤羽失败:`, error.message)
            // 失败也继续执行
          }
          // 每次执行间隔 500ms
          if (j < 1) {
            await waitCommandDelay()
          }
        }

        // 执行 artifact_upgradestar 2 次
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 执行 artifact_upgradestar 2 次`)
        for (let j = 0; j < 2; j++) {
          try {
            await tokenStore.sendArtifactUpgradeStar(token.id, {
              heroId: 107,
              itemId: 13041
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${j + 1}次升级赤羽成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 第${j + 1}次升级赤羽失败:`, error.message)
            // 失败也继续执行
          }
          // 每次执行间隔 500ms
          if (j < 1) {
            await waitCommandDelay()
          }
        }

        message.success(`[序号${tokenIndex}] ${token.name || token.id} - 购买升级赤羽完成`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '购买升级赤羽',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]购买升级赤羽完成`
        })

      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} - 购买升级赤羽失败:`, error)
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 购买升级赤羽失败：${error.message || '未知错误'}`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '购买升级赤羽',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: `【序号${tokenIndex}】[${token.name || token.id}]购买升级赤羽失败：${error.message || '未知错误'}`
        })
      } finally {
        // 关闭 WebSocket 连接
        if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
          await tokenStore.closeWebSocketConnection(token.id)
        }
      }

      // 处理完一个 Token 后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待 1 秒后处理下一个 Token...`)
        await waitCommandDelay()
      }
    }

    message.success(`购买升级赤羽完成，共处理${targetTokens.length}个 Token`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '购买升级赤羽',
      status: 'success',
      message: `购买升级赤羽完成，共处理${targetTokens.length}个 Token`
    })

  } catch (error) {
    console.error('购买升级赤羽失败:', error)
    message.error(`购买升级赤羽失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '购买升级赤羽',
      status: 'error',
      message: `购买升级赤羽失败：${error.message || '未知错误'}`
    })
  } finally {
    isUpgradingChiYu.value = false
  }
}

// 导出详情
const handleExportDetails = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isExportingDetails.value = true

    message.info(`开始导出详情（${rangeText}），共${targetTokens.length}个Token...`)

    const detailsList = []
    let successCount = 0
    let failCount = 0
    const failedTokens = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = sortedTokens.findIndex(t => t.id === token.id) + 1

      try {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在连接...`)
        
        // 使用连接池获取连接
        const connectionAcquired = await connectionPool.acquire(token.id)
        
        if (!connectionAcquired) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          failCount++
          failedTokens.push(token.name || token.id)
          continue
        }
        
        // 检查 WebSocket 连接状态
        if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} WebSocket未连接，跳过`)
          await connectionPool.release(token.id, false)
          failCount++
          failedTokens.push(token.name || token.id)
          continue
        }

        // 发送命令，遇到"操作过快"错误时等待2秒后重试
        let result = null
        let retryCount = 0
        const maxRetries = 5
        while (retryCount < maxRetries) {
          try {
            result = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {})
            break
          } catch (error) {
            const errorMsg = error?.message || error || ''
            if (errorMsg.includes('400340') || errorMsg.includes('操作过快')) {
              retryCount++
              if (retryCount < maxRetries) {
                message.info(`[序号${tokenIndex}] ${token.name || token.id} 操作过快，等待2秒后重试 (${retryCount}/${maxRetries})...`)
                await new Promise(resolve => setTimeout(resolve, 2000))
              } else {
                throw new Error('操作过快，重试次数已达上限')
              }
            } else {
              throw error
            }
          }
        }

        if (result && result.role) {
          const role = result.role

          const levelId = role.levelId || 0

          let lvbuStar = 0
          if (role.heroes && role.heroes['107']) {
            lvbuStar = role.heroes['107'].star || 0
          }
          const lvbuStarDisplay = formatStarLevel(lvbuStar)

          let boxScore = 0
          if (role.items) {
            const woodBox = role.items['2001']?.quantity || 0
            const bronzeBox = role.items['2002']?.quantity || 0
            const goldenBox = role.items['2003']?.quantity || 0
            const platinumBox = role.items['2004']?.quantity || 0
            boxScore = woodBox + bronzeBox * 10 + goldenBox * 20 + platinumBox * 50
          }

          const lordLevel = role.lord?.level || 0

          const lordWeaponId = role.lordWeaponId || 0

          const activatedWeapons = []
          if (role.lordWeapon) {
            for (const key in role.lordWeapon) {
              if (key !== '0' && role.lordWeapon.hasOwnProperty(key)) {
                activatedWeapons.push(key)
              }
            }
          }
          const activatedWeaponsStr = activatedWeapons.join(',')

          // 使用activity_get获取宝箱周执行轮次
          let boxWeekRounds = '获取失败'
          try {
            await waitCommandDelay()
            // 发送命令，遇到"操作过快"错误时等待2秒后重试
            let activityResult = null
            let activityRetryCount = 0
            const activityMaxRetries = 5
            while (activityRetryCount < activityMaxRetries) {
              try {
                activityResult = await tokenStore.sendActivityGet(token.id)
                break
              } catch (error) {
                const errorMsg = error?.message || error || ''
                if (errorMsg.includes('400340') || errorMsg.includes('操作过快')) {
                  activityRetryCount++
                  if (activityRetryCount < activityMaxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000))
                  } else {
                    throw new Error('操作过快，重试次数已达上限')
                  }
                } else {
                  throw error
                }
              }
            }
            if (activityResult && activityResult.activity && activityResult.activity.myTotalInfo && activityResult.activity.myTotalInfo['2']) {
              const info = activityResult.activity.myTotalInfo['2']
              const rounds = info.rounds || 1
              const num = info.num || 0
              // 计算已用宝箱分，每轮8000分
              const usedScore = (rounds - 1) * 8000 + num
              // 计算执行轮次（每轮8000分）
              boxWeekRounds = Math.floor(usedScore / 8000).toString()
            }
          } catch (error) {
            console.error(`[序号${tokenIndex}] 获取activity_get失败:`, error)
          }

          detailsList.push({
            序号: tokenIndex,
            Token名称: token.name || '未命名',
            推图层数: levelId,
            吕布星级: lvbuStarDisplay,
            宝箱总分: boxScore,
            主公等级: lordLevel,
            使用玩具: lordWeaponId,
            已激活玩具: activatedWeaponsStr,
            宝箱周执行轮次: boxWeekRounds
          })

          successCount++
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 获取成功`)
          connectionPool.release(token.id, true)
        } else {
          failCount++
          failedTokens.push(token.name || token.id)
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取数据失败`)
          connectionPool.release(token.id, false)
        }

        if (i < targetTokens.length - 1) {
          await waitCommandDelay()
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] 获取Token ${token.name || token.id} 详情失败:`, error)
        failCount++
        failedTokens.push(token.name || token.id)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 获取失败`)
        connectionPool.release(token.id, false)
      }
    }

    if (detailsList.length > 0) {
      const lines = []
      lines.push('序号,Token名称,推图层数,吕布星级,宝箱总分,主公等级,使用玩具,已激活玩具,宝箱周执行轮次')
      detailsList.forEach(item => {
        lines.push(`${item.序号},${item.Token名称},${item.推图层数},${item.吕布星级},${item.宝箱总分},${item.主公等级},${item.使用玩具},${item.已激活玩具},${item.宝箱周执行轮次}`)
      })

      const content = lines.join('\n')
      const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      const fileName = `养号详情_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.csv`
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.success(`导出完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)

      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '导出详情',
        status: failCount > 0 ? 'warning' : 'success',
        message: `导出完成（${rangeText}）: 成功 ${successCount} 个, 失败 ${failCount} 个${failedTokens.length > 0 ? `，失败Token: ${failedTokens.join(', ')}` : ''}`
      })
    } else {
      message.error('没有成功获取任何Token的详情')

      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '导出详情',
        status: 'error',
        message: '导出失败: 没有成功获取任何Token的详情'
      })
    }
  } catch (error) {
    console.error('导出详情失败:', error)
    message.error(`导出详情失败: ${error.message || '未知错误'}`)

    logStore.addLog({
      operation: '导出详情',
      message: `导出详情失败: ${error.message || '未知错误'}`
    })
  } finally {
    isExportingDetails.value = false
  }
}

// 批量宝箱周
// 执行单个Token的宝箱周操作
const executeBoxWeekForToken = async (token) => {
  let boxWeekRounds = 0
  let successfulClaimCount = 0
  
  try {
    // 连接Token
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      message.info(`${token.name} - 正在连接Token`)
      // 创建WebSocket连接
      await tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
      // 等待连接成功
      let retryCount = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 30) {
        await waitCommandDelay()
        retryCount++
      }
      
      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        throw new Error('Token连接失败')
      }
    }
    
    message.info(`${token.name} - 开始执行宝箱周操作`)
    
    // 1. 准备阶段
    // 获取角色信息，获取宝箱数量
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    if (!roleInfo || !roleInfo.role || !roleInfo.role.items) {
      throw new Error('获取角色信息失败')
    }
    
    const items = roleInfo.role.items
    let M = items['2001']?.quantity || 0 // 木质宝箱
    let Q = items['2002']?.quantity || 0 // 青铜宝箱
    let H = items['2003']?.quantity || 0 // 黄金宝箱
    let B = items['2004']?.quantity || 0 // 铂金宝箱
    
    // 获取已用宝箱分Y
    let Y = 0
    const activityInfo = await tokenStore.sendActivityGet(token.id)
    if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
      const info = activityInfo.activity.myTotalInfo['2']
      const rounds = info.rounds || 1
      const num = info.num || 0
      Y = (rounds - 1) * 8000 + num
    }
    
    // 2. 计算阶段
    // 计算宝箱总分Z（新积分规则：铂金50分/个，黄金20分/个，青铜10分/个，木质1分/个）
    const Z = (M + Q * 10 + H * 20 + B * 50) + Y * 0.43
    
    // 获取基准宝箱分J
    const J = parseInt(baseBoxScore.value) || 0
    
    // 计算开箱轮数l
    let l = 0
    if (Z - J > 4200) {
      l = 1 + Math.floor((Z - J - 4200) / 3500)
    }
    if (l > 4) l = 4
    if (l < 0) l = 0
    
    boxWeekRounds = l
    
    // 计算目标分数ZY
    const ZY = 8000 * l
    
    message.info(`${token.name} - 宝箱总分: ${Z}, 基准宝箱分: ${J}, 已用宝箱分: ${Y}, 开箱轮数: ${l}, 目标分数ZY: ${ZY}`)
    
    // 辅助函数：获取服务器真实Y值
    const fetchRealY = async () => {
      try {
        const actInfo = await tokenStore.sendActivityGet(token.id)
        if (actInfo && actInfo.activity && actInfo.activity.myTotalInfo && actInfo.activity.myTotalInfo['2']) {
          const info = actInfo.activity.myTotalInfo['2']
          const rounds = info.rounds || 1
          const num = info.num || 0
          Y = (rounds - 1) * 8000 + num
          message.info(`${token.name} - 已用宝箱分Y=${Y} (轮数:${rounds}, 当前轮分数:${num})`)
          return Y
        }
      } catch (error) {
        console.error('获取Y值失败:', error)
      }
      return Y
    }
    
    // 辅助函数：计算铂金宝箱开箱数量（10的倍数，最多100个）
    const calculatePlatinumOpenCount = (boxCount, diff) => {
      if (diff <= 0) return 0
      const maxCount = Math.min(Math.floor(boxCount / 10) * 10, 100)
      if (maxCount === 0) return 0
      
      const needBoxes = Math.ceil(diff / 50)
      const needBoxesRounded = Math.ceil(needBoxes / 10) * 10
      
      const count = Math.min(needBoxesRounded, maxCount)
      return count >= 10 ? count : 0
    }
    
    // 辅助函数：计算青铜/黄金宝箱开箱数量（10的倍数，最多100个）
    const calculateNormalOpenCount = (boxCount, diff, scorePerBox = 10) => {
      if (diff <= 0) return 0
      const maxCount = Math.min(Math.floor(boxCount / 10) * 10, 100)
      if (maxCount === 0) return 0
      
      const needBoxes = Math.ceil(diff / scorePerBox)
      const needBoxesRounded = Math.ceil(needBoxes / 10) * 10
      
      const count = Math.min(needBoxesRounded, maxCount)
      return count >= 10 ? count : 0
    }
    
    // 辅助函数：开箱并检查分数
    const openBoxAndCheck = async (itemId, count, boxTypeName) => {
      // 记录开箱前的Y值
      const yBefore = Y
      
      await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId, number: count })
      
      // 每次开箱后获取真实的Y值
      await fetchRealY()
      
      // 计算实际增加的分数
      const actualIncrease = Y - yBefore
      
      const diff = ZY - Y
      
      const openBoxLog = `${token.name} - 开${boxTypeName}宝箱${count}个，已用宝箱分Y: ${Y}，实际增加: +${actualIncrease}，距离目标差值: ${diff}，累计开箱：木质${MK}个，青铜${QK}个，黄金${HK}个，铂金${BK}个`
      
      message.info(openBoxLog)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '开箱操作',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: openBoxLog
      })
      
      await waitCommandDelay()
      
      // 检查是否达到目标
      if (Y >= ZY || Y > 32000) {
        message.info(`${token.name} - 已用宝箱分Y ${Y} 达到目标${Y > 32000 ? '或超过最大限制' : ''}，停止开箱`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '跳出循环',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `已用宝箱分Y ${Y} ${Y > 32000 ? '超过最大限制32000' : '达到目标' + ZY}`
        })
        return 'break'
      }
      
      // Y小于ZY，继续开箱
      return 'continue'
    }
    
    // 3. 开宝箱阶段
    let roundCount = 0
    let shouldBreak = false
    
    // 初始化开箱数量
    let MK = 0 // 木质开箱数量
    let QK = 0 // 青铜开箱数量
    let HK = 0 // 黄金开箱数量
    let BK = 0 // 铂金开箱数量
    
    while (!shouldBreak) {
      roundCount++
      message.info(`${token.name} - 执行第 ${roundCount} 轮开宝箱`)
      
      const currentDiff = ZY - Y
      
      // 当差值 < 500 时，优先检查青铜和黄金
      if (currentDiff < 500) {
        // 计算青铜和黄金可开的分数（只能开10的倍数）
        const bronzeCount = Q >= 10 ? Math.floor(Q / 10) * 10 : 0
        const goldCount = H >= 10 ? Math.floor(H / 10) * 10 : 0
        const bronzeScore = bronzeCount * 10
        const goldScore = goldCount * 20
        const totalBronzeGoldScore = bronzeScore + goldScore
        
        // 如果青铜+黄金分数 > 500，只开青铜和黄金宝箱
        if (totalBronzeGoldScore > 500) {
          // 黄金宝箱开箱（itemId: 2003，20分/个）
          while (H >= 10 && !shouldBreak) {
            const diff = ZY - Y
            if (diff <= 0) {
              message.info(`${token.name} - 已超过目标分数，停止开箱`)
              shouldBreak = true
              break
            }
            const count = calculateNormalOpenCount(H, diff, 20)
            if (count === 0) break
            
            const result = await openBoxAndCheck(2003, count, '黄金')
            H -= count
            HK += count
            if (result === 'break') {
              shouldBreak = true
              break
            }
          }
          if (shouldBreak) break
          
          // 青铜宝箱开箱（itemId: 2002，10分/个）
          while (Q >= 10 && !shouldBreak) {
            const diff = ZY - Y
            if (diff <= 0) {
              message.info(`${token.name} - 已超过目标分数，停止开箱`)
              shouldBreak = true
              break
            }
            const count = calculateNormalOpenCount(Q, diff, 10)
            if (count === 0) break
            
            const result = await openBoxAndCheck(2002, count, '青铜')
            Q -= count
            QK += count
            if (result === 'break') {
              shouldBreak = true
              break
            }
          }
          if (shouldBreak) break
        } else {
          // 青铜+黄金分数 <= 500，按正常顺序开箱（铂金→黄金→青铜）
          // 铂金宝箱开箱（itemId: 2004，50分/个）
          while (B >= 10 && !shouldBreak) {
            const diff = ZY - Y
            if (diff <= 0) {
              message.info(`${token.name} - 已超过目标分数，停止开箱`)
              shouldBreak = true
              break
            }
            const count = calculatePlatinumOpenCount(B, diff)
            if (count === 0) break
            
            const result = await openBoxAndCheck(2004, count, '铂金')
            B -= count
            BK += count
            if (result === 'break') {
              shouldBreak = true
              break
            }
          }
          if (shouldBreak) break
          
          // 黄金宝箱开箱（itemId: 2003，20分/个）
          while (H >= 10 && !shouldBreak) {
            const diff = ZY - Y
            if (diff <= 0) {
              message.info(`${token.name} - 已超过目标分数，停止开箱`)
              shouldBreak = true
              break
            }
            const count = calculateNormalOpenCount(H, diff, 20)
            if (count === 0) break
            
            const result = await openBoxAndCheck(2003, count, '黄金')
            H -= count
            HK += count
            if (result === 'break') {
              shouldBreak = true
              break
            }
          }
          if (shouldBreak) break
          
          // 青铜宝箱开箱（itemId: 2002，10分/个）
          while (Q >= 10 && !shouldBreak) {
            const diff = ZY - Y
            if (diff <= 0) {
              message.info(`${token.name} - 已超过目标分数，停止开箱`)
              shouldBreak = true
              break
            }
            const count = calculateNormalOpenCount(Q, diff, 10)
            if (count === 0) break
            
            const result = await openBoxAndCheck(2002, count, '青铜')
            Q -= count
            QK += count
            if (result === 'break') {
              shouldBreak = true
              break
            }
          }
          if (shouldBreak) break
        }
      } else {
        // 差值 >= 500，按正常顺序开箱（铂金→黄金→青铜）
        
        // 铂金宝箱开箱（itemId: 2004，50分/个）
        while (B >= 10) {
          const diff = ZY - Y
          if (diff <= 0) {
            message.info(`${token.name} - 已超过目标分数，停止开箱`)
            shouldBreak = true
            break
          }
          const count = calculatePlatinumOpenCount(B, diff)
          if (count === 0) break
          
          const result = await openBoxAndCheck(2004, count, '铂金')
          B -= count
          BK += count
          if (result === 'break') {
            shouldBreak = true
            break
          }
        }
        if (shouldBreak) break
        
        // 黄金宝箱开箱（itemId: 2003，20分/个）
        while (H >= 10) {
          const diff = ZY - Y
          if (diff <= 0) {
            message.info(`${token.name} - 已超过目标分数，停止开箱`)
            shouldBreak = true
            break
          }
          const count = calculateNormalOpenCount(H, diff, 20)
          if (count === 0) break
          
          const result = await openBoxAndCheck(2003, count, '黄金')
          H -= count
          HK += count
          if (result === 'break') {
            shouldBreak = true
            break
          }
        }
        if (shouldBreak) break
        
        // 青铜宝箱开箱（itemId: 2002，10分/个）
        while (Q >= 10) {
          const diff = ZY - Y
          if (diff <= 0) {
            message.info(`${token.name} - 已超过目标分数，停止开箱`)
            shouldBreak = true
            break
          }
          const count = calculateNormalOpenCount(Q, diff, 10)
          if (count === 0) break
          
          const result = await openBoxAndCheck(2002, count, '青铜')
          Q -= count
          QK += count
          if (result === 'break') {
            shouldBreak = true
            break
          }
        }
        if (shouldBreak) break
      }
      
      // 木质宝箱开箱（itemId: 2001，1分/个）
      while (M >= 10) {
        const diff = ZY - Y
        if (diff <= 0) {
          message.info(`${token.name} - 已超过目标分数，停止开箱`)
          shouldBreak = true
          break
        }
        const count = calculateNormalOpenCount(M, diff, 1)
        if (count === 0) break
        
        const result = await openBoxAndCheck(2001, count, '木质')
        M -= count
        MK += count
        if (result === 'break') {
          shouldBreak = true
          break
        }
      }
      if (shouldBreak) break
      
      // 检查是否还需要继续开箱
      if (Y >= ZY) {
        // 获取服务器真实Y值
        await fetchRealY()
        if (Y < ZY) {
          // Y小于ZY，宝箱分数不够了，领取宝箱奖励后继续开箱
          message.info(`${token.name} - 已用宝箱分Y ${Y} 小于目标 ${ZY}，领取宝箱奖励后继续开箱`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '领取宝箱奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `已用宝箱分Y ${Y} 小于目标 ${ZY}，领取宝箱奖励后继续开箱`
          })
          await tokenStore.sendBatchClaimBoxPointReward(token.id)
          await waitCommandDelay()
          // 继续下一轮开箱
          continue
        }
        
        message.info(`${token.name} - 已用宝箱分Y ${Y} 达到目标 ${ZY}，进入最终阶段`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '跳出循环',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `已用宝箱分Y ${Y} 达到目标 ${ZY}`
        })
        break
      }
      
      // 重新获取宝箱数量
      const newRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (newRoleInfo && newRoleInfo.role && newRoleInfo.role.items) {
        const newItems = newRoleInfo.role.items
        M = newItems['2001']?.quantity || 0
        Q = newItems['2002']?.quantity || 0
        H = newItems['2003']?.quantity || 0
        B = newItems['2004']?.quantity || 0
      }
      
      // 如果没有宝箱了，但Y还没达到ZY，循环领取宝箱奖励和邮件直到有宝箱或Y达到目标
      if (M < 10 && Q < 10 && H < 10 && B < 10) {
        if (Y < ZY) {
          let claimAttempt = 0
          const maxClaimAttempts = 5 // 最多尝试领取5次
          
          while (Y < ZY && claimAttempt < maxClaimAttempts) {
            claimAttempt++
            message.info(`${token.name} - 宝箱数量不足，Y(${Y})<ZY(${ZY})，第${claimAttempt}次领取宝箱奖励和邮件`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '领取宝箱奖励',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `宝箱数量不足，Y(${Y})<ZY(${ZY})，第${claimAttempt}次领取宝箱奖励和邮件`
            })
            
            // 领取宝箱奖励
            await tokenStore.sendBatchClaimBoxPointReward(token.id)
            await waitCommandDelay()
            
            // 领取邮件
            message.info(`${token.name} - 领取邮件`)
            await tokenStore.sendMailClaimAllAttachment(token.id, { category: 0 })
            await waitCommandDelay()
            
            // 重新获取Y值
            await fetchRealY()
            
            // 检查Y是否达到目标
            if (Y >= ZY) {
              message.info(`${token.name} - 领取奖励后Y(${Y})达到目标ZY(${ZY})，进入最终阶段`)
              break
            }
            
            // 重新获取宝箱数量
            const newRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
            if (newRoleInfo && newRoleInfo.role && newRoleInfo.role.items) {
              const newItems = newRoleInfo.role.items
              M = newItems['2001']?.quantity || 0
              Q = newItems['2002']?.quantity || 0
              H = newItems['2003']?.quantity || 0
              B = newItems['2004']?.quantity || 0
            }
            
            // 如果有宝箱了，退出领取循环，继续开箱
            if (M >= 10 || Q >= 10 || H >= 10 || B >= 10) {
              message.info(`${token.name} - 领取奖励后获得宝箱，继续开箱`)
              break
            }
            
            // 如果达到最大尝试次数，退出循环
            if (claimAttempt >= maxClaimAttempts) {
              message.info(`${token.name} - 已尝试${maxClaimAttempts}次领取奖励，仍无宝箱可开，进入最终阶段`)
              break
            }
            
            message.info(`${token.name} - 领取后仍无宝箱且Y(${Y})<ZY(${ZY})，继续领取...`)
          }
          
          // 如果有宝箱，继续下一轮开箱
          if (M >= 10 || Q >= 10 || H >= 10 || B >= 10) {
            continue
          }
          // 否则进入最终阶段
          message.info(`${token.name} - 宝箱数量不足，进入最终阶段`)
          break
        }
        message.info(`${token.name} - 宝箱数量不足，进入最终阶段`)
        break
      }
    }
    
    // 4. 领取奖励阶段
    // 领取宝箱奖励
    message.info(`${token.name} - 领取宝箱奖励`)
    await tokenStore.sendBatchClaimBoxPointReward(token.id)
    message.info(`${token.name} - 领取宝箱奖励成功`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取宝箱奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `领取宝箱奖励成功`,
      command: 'item_batchclaimboxpointreward'
    })
    await waitCommandDelay()
    
    // 领取邮件
    message.info(`${token.name} - 领取邮件`)
    await tokenStore.sendMailClaimAllAttachment(token.id, { category: 0 })
    message.info(`${token.name} - 领取邮件成功`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取邮件',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `领取邮件成功`,
      command: 'mail_claimallattachment',
      commandParams: { category: 0 }
    })
    await waitCommandDelay()
    
    // 5. 开钻石宝箱阶段（领取宝箱周奖励前）
    message.info(`${token.name} - 开始开钻石宝箱`)
    const diamondRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
    if (diamondRoleInfo && diamondRoleInfo.role && diamondRoleInfo.role.items) {
      const diamondItems = diamondRoleInfo.role.items
      let D = diamondItems['2005']?.quantity || 0 // 钻石宝箱
      
      message.info(`${token.name} - 钻石宝箱数量: ${D}`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '钻石宝箱数量',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `钻石宝箱数量: ${D}`
      })
      
      // 每次开10的倍数，最多100个
      let diamondOpenCount = 0
      while (D >= 10) {
        // 计算每次开箱数量：10的倍数，最多100个
        const openCount = Math.min(Math.floor(D / 10) * 10, 100)
        if (openCount < 10) break
        
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2005, number: openCount })
        D -= openCount
        diamondOpenCount++
        message.info(`${token.name} - 开钻石宝箱第${diamondOpenCount}次，${openCount}个，剩余${D}个`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开钻石宝箱',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `开钻石宝箱第${diamondOpenCount}次，${openCount}个，剩余${D}个`
        })
        await waitCommandDelay()
      }
      
      message.info(`${token.name} - 钻石宝箱开启完成，共开启${diamondOpenCount}次`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '钻石宝箱完成',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `钻石宝箱开启完成，共开启${diamondOpenCount}次`
      })
    }
    
    // 6. 领取宝箱周奖励
    
    // 领取宝箱周奖励
    for (let i = 0; i < l + 1; i++) {
      try {
        await tokenStore.sendActivityClaimWeekActReward(token.id)
        successfulClaimCount++
        message.info(`${token.name} - 第 ${i + 1} 次领取宝箱周奖励成功`)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '领取宝箱周奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `第 ${i + 1} 次领取宝箱周奖励成功`,
          command: 'activity_claimweekactreward'
        })
      } catch (error) {
        message.warning(`${token.name} - 第 ${i + 1} 次领取宝箱周奖励失败: ${error.message || '未知错误'}，继续执行下一次领取`)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '领取宝箱周奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: `第 ${i + 1} 次领取宝箱周奖励失败: ${error.message || '未知错误'}`,
          command: 'activity_claimweekactreward'
        })
        // 继续执行下一次领取，不停止
      }
      await waitCommandDelay()
    }
    
    message.success(`${token.name} - 一键宝箱周完成，执行了 ${boxWeekRounds} 轮开箱`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键宝箱周',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `一键宝箱周完成，执行了 ${boxWeekRounds} 轮开箱`,
      details: {
        boxWeekRounds: boxWeekRounds,
        successfulClaimCount: successfulClaimCount
      }
    })
    
    // 记录执行开箱的token、token执行宝箱周轮次，成功领取宝箱周奖励次数
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '宝箱周执行总结',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `执行开箱的token，执行宝箱周轮次: ${boxWeekRounds}，成功领取宝箱周奖励次数: ${successfulClaimCount}`,
      details: {
        tokenName: token.name,
        boxWeekRounds: boxWeekRounds,
        successfulClaimCount: successfulClaimCount
      }
    })
    
  } catch (error) {
    console.error(`${token.name} - 一键宝箱周失败:`, error)
    message.error(`${token.name} - 一键宝箱周失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键宝箱周',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `一键宝箱周失败: ${error.message || '未知错误'}`
    })
  } finally {
    // 断开Token连接
    message.info(`${token.name} - 正在断开连接`)
    tokenStore.closeWebSocketConnection(token.id)
  }
  
  return { boxWeekRounds, successfulClaimCount }
}

// 停止批量宝箱周
const stopBatchBoxWeek = () => {
  isBatchBoxWeekCancelled.value = true
  message.info('已停止批量宝箱周')
}

// 批量宝箱周
const handleBatchBoxWeek = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  
  try {
    isBatchBoxWeekRunning.value = true
    isBatchBoxWeekCancelled.value = false
    
    message.info(`开始批量宝箱周（${rangeText}），共${targetTokens.length}个Token...`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量宝箱周',
      status: 'info',
      message: `开始批量宝箱周（${rangeText}），共${targetTokens.length}个Token`
    })
    
    // 逐个处理Token
    for (let i = 0; i < targetTokens.length; i++) {
      // 检查是否已取消
      if (isBatchBoxWeekCancelled.value) {
        message.info('批量宝箱周已停止')
        break
      }
      
      const token = targetTokens[i]
      message.info(`处理第 ${i + 1}/${targetTokens.length} 个Token: ${token.name}`)
      
      await executeBoxWeekForToken(token)
      
      // 处理完一个 Token 后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待 1 秒后处理下一个 Token...`)
        await waitCommandDelay()
      }
    }
    
    message.success(`批量宝箱周完成，共处理${targetTokens.length}个Token`)
    
    // 添加批量宝箱周完成日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量宝箱周',
      status: 'success',
      message: `批量宝箱周完成，共处理${targetTokens.length}个Token`
    })
    
  } catch (error) {
    console.error('批量宝箱周失败:', error)
    message.error(`批量宝箱周失败: ${error.message || '未知错误'}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量宝箱周',
      status: 'error',
      message: `批量宝箱周失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchBoxWeekRunning.value = false
  }
}

// 批量招募周
const handleBatchRecruitWeek = async () => {
  if (!enableRecruitWeek.value) {
    message.warning('请先打开招募周开关')
    return
  }

  try {
    isBatchRecruitWeekRunning.value = true
    message.info('开始批量招募周...')
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量招募周',
      status: 'info',
      message: '开始批量招募周'
    })

    const tokenIndices = parseTokenRange(executionTokens.value)
    const targetTokens = getTargetTokens(tokenIndices)
    
    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到 Token`)
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
    message.info(`开始批量招募周，共 ${targetTokens.length} 个 Token（${rangeText}）`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量招募周',
      status: 'info',
      message: `开始批量招募周，共 ${targetTokens.length} 个 Token（${rangeText}）`
    })

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在获取活动详情...`)
          
          let usedRecruitCount = 0
          try {
            const activityInfo = await tokenStore.sendMessageWithPromise(
              token.id,
              'activity_get',
              { },
              5000
            )
            
            if (activityInfo?.activity?.myTotalInfo?.['1']?.num !== undefined) {
              usedRecruitCount = activityInfo.activity.myTotalInfo['1'].num
              console.log(`[批量招募周] activity.myTotalInfo['1'].num = ${usedRecruitCount}`)
            } else {
              console.warn('[批量招募周] 未找到 activity.myTotalInfo[\'1\'].num')
            }
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 已用招募令数量：${usedRecruitCount}`)
          } catch (error) {
            console.error(`获取活动详情失败：${error.message}`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取活动详情失败，继续执行`)
          }
          
          let currentRecruitCount = 0
          let towerFloor = 0
          try {
            const roleInfo = await tokenStore.sendMessageWithPromise(
              token.id,
              'role_getroleinfo',
              {},
              5000
            )
            
            const items = roleInfo?.role?.items || {}
            if (items['1001']) {
              currentRecruitCount = items['1001'].quantity || items['1001'].num || 0
            }
            
            // 获取爬塔层数
            const tower = roleInfo?.role?.tower
            if (tower && tower.id) {
              towerFloor = Math.floor(tower.id / 10)
            }
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 现有招募令数量：${currentRecruitCount}`)
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 当前爬塔层数：${towerFloor}层`)
          } catch (error) {
            console.error(`获取角色信息失败：${error.message}`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取角色信息失败，继续执行`)
          }
          
          // 检查爬塔层数是否超过100层
          if (towerFloor > 100) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 爬塔层数${towerFloor}层超过100层，跳过招募周操作`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量招募周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]爬塔层数${towerFloor}层超过100层，跳过招募周操作`
            })
            return { success: false, reason: 'tower_floor_exceeded', towerFloor }
          }
          
          await waitCommandDelay()
          
          const totalRecruitCount = Math.floor(usedRecruitCount * 0.8 + currentRecruitCount)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 总招募令数量：${totalRecruitCount} (公式：${usedRecruitCount} * 0.8 + ${currentRecruitCount})`)
          console.log(`[批量招募周] 总招募令数量：${totalRecruitCount}, 已用：${usedRecruitCount}, 现有：${currentRecruitCount}`)
          
          const maxRounds = Math.floor(totalRecruitCount / 400)
          console.log(`[批量招募周] 计划轮数：${maxRounds}`)
          
          const theoreticalUsed = maxRounds * 400
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 招募令对比：计划使用${maxRounds}轮，理论使用${theoreticalUsed}个，已用${usedRecruitCount}个`)
          console.log(`[批量招募周] 招募令对比：理论使用=${theoreticalUsed}, 已用=${usedRecruitCount}`)
          
          if (usedRecruitCount >= theoreticalUsed && theoreticalUsed > 0) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 已用招募令数量已达理论值，不再执行招募，直接领取奖励`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量招募周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]已用招募令数量已达理论值，不再执行招募`
            })
          }
          
          if (maxRounds === 0) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 招募令数量不足，无法完成一轮招募周（需要 400 个）`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量招募周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `【序号${tokenIndex}】[${token.name || token.id}]招募令数量不足，无法完成一轮招募周`
            })
            return { success: false, reason: 'insufficient_recruits' }
          }
          
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 计划执行 ${maxRounds} 轮招募周`)
          
          let completedRounds = 0
          let totalRecruits = 0
          let mailClaimCount = 0
          let remainingRecruits = currentRecruitCount
          
          // 阶段3：执行招募 - 使用验证逻辑确保Y刚刚超过SY
          const SY = maxRounds * 400
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行招募，目标已用招募令数量：${SY}`)
          
          let recruitLoop = 0
          const MAX_RECRUIT_LOOPS = maxRounds + 2 // 最大循环轮数+2次
          
          while (recruitLoop < MAX_RECRUIT_LOOPS) {
            recruitLoop++
            
            // 3.1 获取活动信息
            let currentUsedCount = 0
            try {
              const activityInfo = await tokenStore.sendMessageWithPromise(
                token.id,
                'activity_get',
                {},
                5000
              )
              
              if (activityInfo?.activity?.myTotalInfo?.['1']?.num !== undefined) {
                currentUsedCount = activityInfo.activity.myTotalInfo['1'].num
              }
              
              message.info(`[序号${tokenIndex}] ${token.name || token.id} 招募第${recruitLoop}次：已用招募令数量 ${currentUsedCount}，目标 ${SY}`)
            } catch (error) {
              console.error(`获取活动信息失败：${error.message}`, error)
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取活动信息失败，跳过招募`)
              break
            }
            
            // 3.2 验证已用招募数量
            if (currentUsedCount >= SY) {
              message.info(`[序号${tokenIndex}] ${token.name || token.id} 招募完成：已用招募令数量 ${currentUsedCount} >= 目标 ${SY}`)
              completedRounds = maxRounds
              break
            }
            
            // 3.3 执行招募
            const diff = SY - currentUsedCount
            const recruitCount = Math.min(40 * maxRounds, Math.floor(diff / 10) + 1) // 每次最多招募40*轮数次
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 需要招募 ${recruitCount} 次（${recruitCount * 10}个）`)
            
            for (let i = 0; i < recruitCount; i++) {
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_recruit',
                  {
                    byClub: false,
                    recruitNumber: 10,
                    recruitType: 1
                  },
                  5000
                )
                
                totalRecruits += 10
                remainingRecruits -= 10
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量招募周',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]第${recruitLoop}轮第${i + 1}次招募，已招募${totalRecruits}个`
                })
                
                // 每使用100个招募令，领取一次邮件附件
                if ((i + 1) % 10 === 0) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'mail_claimallattachment',
                      {},
                      5000
                    )
                    mailClaimCount++
                    message.success(`[序号${tokenIndex}] ${token.name || token.id} 领取邮件附件成功（第${mailClaimCount}次）`)
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量招募周',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]领取邮件附件成功（第${mailClaimCount}次）`
                    })
                  } catch (mailError) {
                    console.error(`领取邮件失败：${mailError.message}`, mailError)
                  }
                }
                
                await waitCommandDelay()
              } catch (recruitError) {
                console.error(`招募失败：${recruitError.message}`, recruitError)
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} 招募失败：${recruitError.message}`)
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量招募周',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]招募失败：${recruitError.message}`
                })
                break
              }
            }
            
            // 跳转回3.1重新获取活动信息验证
            await waitCommandDelay()
          }
          
          if (recruitLoop >= MAX_RECRUIT_LOOPS) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 招募阶段达到最大循环次数(${MAX_RECRUIT_LOOPS})，停止招募`)
          }
          
          // 阶段6：领取招募周奖励
          let claimSuccessRounds = 0
          const claimTimes = maxRounds + 1
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始领取招募周奖励，执行${claimTimes}次`)
          console.log(`[批量招募周] 开始领取奖励，执行${claimTimes}次`)
          
          for (let i = 0; i < claimTimes; i++) {
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'activity_claimweekactreward',
                {
                  selectRewardsMap: {
                    '1': 1
                  },
                  typ: 1
                },
                5000
              )
              claimSuccessRounds++
              message.success(`[序号${tokenIndex}] ${token.name || token.id} 领取第 ${i + 1} 次奖励成功`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量招募周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `【序号${tokenIndex}】[${token.name || token.id}]领取第 ${i + 1} 次奖励成功`
              })
              await waitCommandDelay()
            } catch (claimError) {
              console.error(`领取第 ${i + 1} 次奖励失败：${claimError.message}`, claimError)
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} 领取第 ${i + 1} 次奖励失败：${claimError.message || '服务器错误'}，继续执行`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量招募周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `【序号${tokenIndex}】[${token.name || token.id}]领取第 ${i + 1} 次奖励失败：${claimError.message || '服务器错误'}`
              })
              await waitCommandDelay()
            }
          }
          
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 领取奖励完成，成功${claimSuccessRounds}/${claimTimes}次`)
          
          const successMsg = `${token.name || token.id} 招募周完成，计划${maxRounds}轮，完成${completedRounds}轮，领取奖励${claimSuccessRounds}轮，共招募${totalRecruits}个，领取邮件${mailClaimCount}次，剩余招募令${remainingRecruits}个`
          message.success(successMsg)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量招募周',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]${successMsg}`
          })
          
          return { 
            success: true, 
            plannedRounds: maxRounds,
            completedRounds, 
            claimSuccessRounds,
            totalRecruits, 
            mailClaimCount,
            remainingRecruits
          }
        } catch (error) {
          console.error(`招募周失败：${error.message}`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 招募周失败：${error.message}`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量招募周',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、招募周失败：${error.message}`
          })
          
          return { success: false, error: error.message }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        keepConnections: false,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
          } else if (progress.type === 'token-start') {
            message.info(`[${progress.globalIndex}/${progress.totalTokens}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`[${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const totalTokens = results.length
    const successCount = results.filter(r => r.success && !r.skipped).length
    const skippedCount = results.filter(r => r.skipped).length
    const towerFloorSkippedCount = results.filter(r => r.reason === 'tower_floor_exceeded').length
    const failureCount = results.filter(r => !r.success).length
    const totalCompletedRounds = results.reduce((sum, r) => sum + (r.completedRounds || 0), 0)
    const totalClaimSuccessRounds = results.reduce((sum, r) => sum + (r.claimSuccessRounds || 0), 0)
    const totalRecruits = results.reduce((sum, r) => sum + (r.totalRecruits || 0), 0)
    const totalMailClaims = results.reduce((sum, r) => sum + (r.mailClaimCount || 0), 0)
    
    let summaryMessage = `批量招募周完成，共处理${totalTokens}个 Token，成功${successCount}个，跳过${skippedCount}个（爬塔超100层${towerFloorSkippedCount}个），失败${failureCount}个`
    if (totalCompletedRounds > 0) {
      summaryMessage += `，共完成${totalCompletedRounds}轮`
    }
    if (totalClaimSuccessRounds > 0) {
      summaryMessage += `，领取奖励${totalClaimSuccessRounds}轮`
    }
    if (totalRecruits > 0) {
      summaryMessage += `，共招募${totalRecruits}个`
    }
    if (totalMailClaims > 0) {
      summaryMessage += `，领取邮件${totalMailClaims}次`
    }
    
    message.success(summaryMessage)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量招募周',
      status: 'success',
      message: summaryMessage
    })
  } catch (error) {
    console.error('批量招募周失败:', error)
    message.error(`批量招募周失败：${error.message}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量招募周',
      status: 'error',
      message: `批量招募周失败：${error.message}`
    })
  } finally {
    isBatchRecruitWeekRunning.value = false
  }
}

// 计算升级参数
// 如果武将等级1级，使用参数49，升到50级，再使用50
// 51-100级：先用10，100-当前<10用5，100-当前<5用1
// 100级以上循环使用50
const calculateUpgradeNum = (currentLevel) => {
  if (currentLevel === 1) {
    return 49
  } else if (currentLevel >= 51 && currentLevel < 100) {
    // 51-100级之间，根据剩余等级动态计算
    const remaining = 100 - currentLevel
    if (remaining >= 10) {
      return 10
    } else if (remaining >= 5) {
      return 5
    } else {
      return 1
    }
  } else if (currentLevel >= 100) {
    // 100级以上，循环使用50
    return 50
  } else {
    // 其他情况（2-50级），使用50
    return 50
  }
}

// 批量升级900级
// 批量下阵武将（1-4 号位）
const handleBatchUnloadHeroes = async () => {
  // 按 token 昵称排序的 token 列表
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的 Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的 Token')
    return
  }
  
  // 获取每个 token 在 sortedTokens 中的序号
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  const selectedValue = selectedUnloadHero.value
  const heroMap = {
    'back': '后排',
    '107': '吕布',
    '204': '张飞',
    '217': '魏延'
  }
  const heroText = heroMap[selectedValue] || '全部'
  message.info(`开始批量下阵（${rangeText}），共${targetTokens.length}个 Token，下阵武将：${heroText}`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量下阵',
    status: 'info',
    message: `开始批量下阵，${rangeText}，共${targetTokens.length}个 Token，下阵武将：${heroText}`
  })
  
  try {
    isBatchUnloadingHeroes.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在下阵武将...`)
          
          // 下阵 2-4 号位（slot: 2-4）
          const unloadSlots = [
            { slot: 2, positionName: '2 号位' },
            { slot: 3, positionName: '3 号位' },
            { slot: 4, positionName: '4 号位' }
          ]
          
          for (const { slot, positionName } of unloadSlots) {
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_gobackbattle',
                {
                  slot: slot
                },
                5000
              )
              await waitCommandDelay()
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量下阵',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `下阵${positionName}成功`
              })
            } catch (error) {
              // 如果该位置没有武将，会返回错误，忽略继续执行
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量下阵',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `${positionName}没有武将或下阵失败：${error.message}`
              })
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 下阵完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量下阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '下阵完成'
          })
          
        } catch (error) {
          console.error(`[序号${getTokenIndex(token)}] ${token.name || token.id} 下阵失败:`, error)
          throw error
        }
      }
    )
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    message.success(`批量下阵完成！成功：${successCount}，失败：${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量下阵',
      status: 'success',
      message: `批量下阵完成，成功：${successCount}，失败：${failCount}`
    })
    
  } catch (error) {
    console.error('批量下阵失败:', error)
    message.error('批量下阵失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量下阵',
      status: 'error',
      message: `批量下阵失败：${error.message}`
    })
  } finally {
    isBatchUnloadingHeroes.value = false
  }
}


const handleBatchUpgrade900 = async () => {
  const upgradeMode = selectedUpgradeMode.value
  
  if (upgradeMode === 'single') {
    await handleBatchUpgradeSingleHero()
    return
  }
  
  if (upgradeMode === 'qunxiong') {
    await handleBatchUpgradeQunxiong()
    return
  }
  
  if (upgradeMode === 'tower') {
    await handleBatchUpgradeTower()
    return
  }
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级',
    status: 'info',
    message: `开始批量升级（推图模式），${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgrading900.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行升级...`)
          
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          let heroesData = null
          if (roleInfo && roleInfo.role && roleInfo.role.heroes) {
            heroesData = roleInfo.role.heroes
          } else if (roleInfo && roleInfo._raw && roleInfo._raw.body && roleInfo._raw.body.role && roleInfo._raw.body.role.heroes) {
            heroesData = roleInfo._raw.body.role.heroes
          } else if (roleInfo && roleInfo.body && roleInfo.body.role && roleInfo.body.role.heroes) {
            heroesData = roleInfo.body.role.heroes
          }
          
          if (!heroesData) {
            throw new Error('无法获取武将数据')
          }
          
          const storyHeroes = [
            { heroId: 107, name: '吕布' },
            { heroId: 204, name: '张飞' },
            { heroId: 110, name: '黄月英' },
            { heroId: 106, name: '太史慈' },
            { heroId: 217, name: '魏延', maxLevel: 250 }
          ]
          
          for (const storyHero of storyHeroes) {
            const hero = heroesData[String(storyHero.heroId)] || heroesData[storyHero.heroId]
            if (!hero) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `没有找到${storyHero.name}`
              })
              continue
            }
            
            const currentLevel = hero.level || 1
            const maxLevel = storyHero.maxLevel || 900
            
            if (currentLevel >= maxLevel) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}当前等级${currentLevel}，已达到${maxLevel}级，跳过`
              })
              continue
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `开始升级${storyHero.name}，当前等级${currentLevel}，目标${maxLevel}级`
            })
            
            let level = currentLevel
            while (level < maxLevel) {
              try {
                const upgradeNum = calculateUpgradeNum(level)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradelevel命令: ${storyHero.name}，当前等级${level}，升级${upgradeNum}级`
                })
                const upgradeRes = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradelevel',
                  {
                    heroId: storyHero.heroId,
                    upgradeNum: upgradeNum
                  },
                  5000
                )
                
                const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
                const errorMsgStr = String(errorMsg).toLowerCase()
                
                if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}升级失败: 未进阶，准备执行升阶命令`
                  })
                  try {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradeorder命令: ${storyHero.name}`
                    })
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: storyHero.heroId
                      },
                      5000
                    )
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}升阶成功`
                    })
                    await waitCommandDelay()
                    continue
                  } catch (orderError) {
                    console.error(`${storyHero.name}升阶失败:`, orderError)
                    const orderErrorMsg = String(orderError.message || '').toLowerCase()
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'error',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}升阶失败: ${orderError.message || '未知错误'}`
                    })
                    if (orderErrorMsg.includes('物品数量不足')) {
                      break
                    }
                    break
                  }
                }
                
                if (errorMsgStr.includes('物品数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}升级失败: 物品数量不足`
                  })
                  break
                }
                
                let heroesData = null
                if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
                  heroesData = upgradeRes.role.heroes
                } else if (upgradeRes && upgradeRes._raw && upgradeRes._raw.body && upgradeRes._raw.body.role && upgradeRes._raw.body.role.heroes) {
                  heroesData = upgradeRes._raw.body.role.heroes
                } else if (upgradeRes && upgradeRes.body && upgradeRes.body.role && upgradeRes.body.role.heroes) {
                  heroesData = upgradeRes.body.role.heroes
                }
                
                if (heroesData) {
                  let updatedHero = null
                  if (Array.isArray(heroesData)) {
                    updatedHero = heroesData.find(h => Number(h.heroId) === storyHero.heroId)
                  } else if (typeof heroesData === 'object') {
                    updatedHero = heroesData[storyHero.heroId] || heroesData[String(storyHero.heroId)] ||
                                 Object.values(heroesData).find(h => h && Number(h.heroId) === storyHero.heroId)
                  }
                  
                  if (updatedHero && updatedHero.level > level) {
                    const oldLevel = level
                    level = updatedHero.level
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}升级成功: ${oldLevel} → ${level}`
                    })
                  } else {
                    break
                  }
                } else {
                  break
                }
              } catch (error) {
                const errorMsg = String(error.message || error || '').toLowerCase()
                if (errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公') || errorMsg.includes('400060')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'info',
                    message: `${storyHero.name}需要升阶(异常)，执行进阶命令`
                  })
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: storyHero.heroId
                      },
                      5000
                    )
                    await waitCommandDelay()
                    continue
                  } catch (orderError) {
                    console.error(`进阶${storyHero.name}失败:`, orderError)
                    break
                  }
                }
                console.error(`升级${storyHero.name}失败:`, error)
                break
              }
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${storyHero.name}升级结束: ${currentLevel} → ${level}`
            })
          }
          
          await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 升级完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '升级完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 升级失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 升级失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'success',
      message: `批量升级完成：成功${successCount}个，失败${failCount}个`
    })
    
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量升级')
    })
  } catch (error) {
    console.error('批量升级失败:', error)
    message.error(`批量升级失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'error',
      message: `【序号${tokenIndex}】[${token.name || token.id}]批量升级失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgrading900.value = false
  }
}

// 批量升级爬塔
const handleBatchUpgradeTower = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const towerHeroes = [
    { heroId: 116, name: '公孙瓒' },
    { heroId: 102, name: '郭嘉' },
    { heroId: 104, name: '诸葛亮' },
    { heroId: 112, name: '贾诩' }
  ]
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级爬塔（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级',
    status: 'info',
    message: `开始批量升级爬塔（公孙瓒、郭嘉、诸葛亮、贾诩），${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgrading900.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行爬塔升级...`)
          
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          let heroesData = null
          if (roleInfo && roleInfo.role && roleInfo.role.heroes) {
            heroesData = roleInfo.role.heroes
          } else if (roleInfo && roleInfo._raw && roleInfo._raw.body && roleInfo._raw.body.role && roleInfo._raw.body.role.heroes) {
            heroesData = roleInfo._raw.body.role.heroes
          } else if (roleInfo && roleInfo.body && roleInfo.body.role && roleInfo.body.role.heroes) {
            heroesData = roleInfo.body.role.heroes
          }
          
          for (const towerHero of towerHeroes) {
            let currentLevel = 1
            if (heroesData) {
              const hero = heroesData[String(towerHero.heroId)] || heroesData[towerHero.heroId]
              if (hero && hero.level) {
                currentLevel = hero.level
              }
            }
            
            if (currentLevel >= 900) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${towerHero.name}已${currentLevel}级，跳过升级`
              })
              continue
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `开始升级${towerHero.name}: ${currentLevel} → 900`
            })
            
            let level = currentLevel
            while (level < 900) {
              const upgradeNum = calculateUpgradeNum(level)
              
              try {
                const upgradeRes = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradelevel',
                  {
                    heroId: towerHero.heroId,
                    upgradeNum: upgradeNum
                  },
                  5000
                )
                
                const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
                const errorMsgStr = String(errorMsg).toLowerCase()
                
                if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060') || errorMsgStr.includes('需要升阶')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'info',
                    message: `${towerHero.name}需要升阶，执行进阶命令`
                  })
                  await tokenStore.sendMessageWithPromise(
                    token.id,
                    'hero_heroupgradeorder',
                    {
                      heroId: towerHero.heroId
                    },
                    5000
                  )
                  await waitCommandDelay()
                  continue
                }
                
                if (errorMsgStr.includes('物品数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `升级${towerHero.name}失败: 物品数量不足`
                  })
                  break
                }
                
                let heroesData = null
                if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
                  heroesData = upgradeRes.role.heroes
                } else if (upgradeRes && upgradeRes._raw && upgradeRes._raw.body && upgradeRes._raw.body.role && upgradeRes._raw.body.role.heroes) {
                  heroesData = upgradeRes._raw.body.role.heroes
                } else if (upgradeRes && upgradeRes.body && upgradeRes.body.role && upgradeRes.body.role.heroes) {
                  heroesData = upgradeRes.body.role.heroes
                }
                
                if (heroesData) {
                  let updatedHero = null
                  if (Array.isArray(heroesData)) {
                    updatedHero = heroesData.find(h => Number(h.heroId) === towerHero.heroId)
                  } else if (typeof heroesData === 'object') {
                    updatedHero = heroesData[towerHero.heroId] || heroesData[String(towerHero.heroId)] ||
                                 Object.values(heroesData).find(h => h && Number(h.heroId) === towerHero.heroId)
                  }
                  
                  if (updatedHero && updatedHero.level > level) {
                    const oldLevel = level
                    level = updatedHero.level
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${towerHero.name}升级成功: ${oldLevel} → ${level}`
                    })
                  } else {
                    break
                  }
                } else {
                  break
                }
              } catch (error) {
                const errorMsg = String(error.message || error || '').toLowerCase()
                if (errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公') || errorMsg.includes('400060') || errorMsg.includes('需要升阶')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'info',
                    message: `${towerHero.name}需要升阶(异常)，执行进阶命令`
                  })
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: towerHero.heroId
                      },
                      5000
                    )
                    await waitCommandDelay()
                    continue
                  } catch (orderError) {
                    console.error(`进阶${towerHero.name}失败:`, orderError)
                    break
                  }
                }
                console.error(`升级${towerHero.name}失败:`, error)
                break
              }
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${towerHero.name}升级结束: ${currentLevel} → ${level}`
            })
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 爬塔升级完成`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 爬塔升级失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 爬塔升级失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]爬塔升级失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级爬塔完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'success',
      message: `批量升级爬塔完成：成功${successCount}个，失败${failCount}个`
    })
    
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量升级')
    })
  } catch (error) {
    console.error('批量升级爬塔失败:', error)
    message.error(`批量升级爬塔失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'error',
      message: `批量升级爬塔失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgrading900.value = false
  }
}

const handleBatchUpgradeSingleHero = async () => {
  const heroId = parseInt(selectedSingleHero.value)
  const heroName = getHeroName(heroId)
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级${heroName}（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级',
    status: 'info',
    message: `开始批量升级${heroName}，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgrading900.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在升级${heroName}...`)
          
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          const heroes = roleInfo?.role?.heroes || {}
          const heroData = heroes[String(heroId)] || heroes[heroId]
          
          if (!heroData) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `没有找到${heroName}`
            })
            return { success: false, reason: `没有找到${heroName}` }
          }
          
          const currentLevel = heroData.level || 1
          
          if (currentLevel >= 900) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}当前等级${currentLevel}，已达到900级，跳过`
            })
            return { success: true, token: token }
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `开始升级${heroName}，当前等级${currentLevel}`
          })
          
          let level = currentLevel
          while (level < 900) {
            try {
              const upgradeNum = calculateUpgradeNum(level)
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradelevel命令: ${heroName}，当前等级${level}，升级${upgradeNum}级`
              })
              const upgradeRes = await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_heroupgradelevel',
                {
                  heroId: heroId,
                  upgradeNum: upgradeNum
                },
                5000
              )
              
              const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
              const errorMsgStr = String(errorMsg).toLowerCase()
              
              if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升级失败: 未进阶，准备执行升阶命令`
                })
                try {
                  await tokenStore.sendMessageWithPromise(
                    token.id,
                    'hero_heroupgradeorder',
                    {
                      heroId: heroId
                    },
                    5000
                  )
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升阶成功`
                  })
                  await waitCommandDelay()
                  continue
                } catch (orderError) {
                  const orderErrorMsg = String(orderError.message || '').toLowerCase()
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'error',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升阶失败: ${orderError.message || '未知错误'}`
                  })
                  if (orderErrorMsg.includes('物品数量不足')) {
                    break
                  }
                  break
                }
              }
              
              if (errorMsgStr.includes('物品数量不足')) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升级失败: 物品数量不足`
                })
                break
              }
              
              let heroesData = null
              if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
                heroesData = upgradeRes.role.heroes
              } else if (upgradeRes && upgradeRes._raw && upgradeRes._raw.body && upgradeRes._raw.body.role && upgradeRes._raw.body.role.heroes) {
                heroesData = upgradeRes._raw.body.role.heroes
              } else if (upgradeRes && upgradeRes.body && upgradeRes.body.role && upgradeRes.body.role.heroes) {
                heroesData = upgradeRes.body.role.heroes
              }
              
              if (heroesData) {
                let updatedHero = null
                if (Array.isArray(heroesData)) {
                  updatedHero = heroesData.find(h => Number(h.heroId) === Number(heroId))
                } else if (typeof heroesData === 'object') {
                  updatedHero = heroesData[heroId] || heroesData[String(heroId)] ||
                               Object.values(heroesData).find(h => h && Number(h.heroId) === Number(heroId))
                }
                
                if (updatedHero && updatedHero.level > level) {
                  const oldLevel = level
                  level = updatedHero.level
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升级成功: ${oldLevel} → ${level}`
                  })
                  if (level > 750) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `${heroName}等级超过750，停止升级`
                    })
                    break
                  }
                } else {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}等级没有变化，可能已达到上限`
                  })
                  break
                }
              } else {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'error',
                  message: `${heroName}升级响应格式异常`
                })
                break
              }
              
              await waitCommandDelay()
            } catch (error) {
              const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
              
              if (errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公') || errorMsg.includes('400060')) {
                try {
                  await tokenStore.sendMessageWithPromise(
                    token.id,
                    'hero_heroupgradeorder',
                    {
                      heroId: heroId
                    },
                    5000
                  )
                  await waitCommandDelay()
                  continue
                } catch (orderError) {
                  const orderErrorMsg = String(orderError.message || '').toLowerCase()
                  if (orderErrorMsg.includes('物品数量不足')) {
                    break
                  }
                  break
                }
              } else if (errorMsg.includes('物品数量不足')) {
                break
              } else {
                break
              }
            }
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${heroName}升级结束: ${currentLevel} → ${level}`
          })
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} ${heroName}升级完成`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 升级${heroName}失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 升级${heroName}失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `升级${heroName}失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级${heroName}完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'success',
      message: `批量升级${heroName}完成：成功${successCount}个，失败${failCount}个`
    })
    
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量升级')
    })
  } catch (error) {
    console.error(`批量升级${heroName}失败:`, error)
    message.error(`批量升级${heroName}失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'error',
      message: `批量升级${heroName}失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgrading900.value = false
  }
}

const handleBatchUpgradeQunxiong = async () => {
  const qunxiongHeroes = [
    { heroId: 116, name: '公孙瓒' },
    { heroId: 112, name: '贾诩' },
    { heroId: 312, name: '邢道荣' }
  ]
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级群雄（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级',
    status: 'info',
    message: `开始批量升级群雄（公孙瓒、贾诩、邢道荣），${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgrading900.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在升级群雄...`)
          
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          const heroes = roleInfo?.role?.heroes || {}
          
          for (const qunxiongHero of qunxiongHeroes) {
            const heroData = heroes[String(qunxiongHero.heroId)] || heroes[qunxiongHero.heroId]
            
            if (!heroData) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `没有找到${qunxiongHero.name}`
              })
              continue
            }
            
            const currentLevel = heroData.level || 1
            
            if (currentLevel >= 900) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}当前等级${currentLevel}，已达到900级，跳过`
              })
              continue
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `开始升级${qunxiongHero.name}，当前等级${currentLevel}`
            })
            
            let level = currentLevel
            while (level < 900) {
              try {
                const upgradeNum = calculateUpgradeNum(level)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradelevel命令: ${qunxiongHero.name}，当前等级${level}，升级${upgradeNum}级`
                })
                const upgradeRes = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradelevel',
                  {
                    heroId: qunxiongHero.heroId,
                    upgradeNum: upgradeNum
                  },
                  5000
                )
                
                const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
                const errorMsgStr = String(errorMsg).toLowerCase()
                
                if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}升级失败: 未进阶，准备执行升阶命令`
                  })
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: qunxiongHero.heroId
                      },
                      5000
                    )
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}升阶成功`
                    })
                    await waitCommandDelay()
                    continue
                  } catch (orderError) {
                    const orderErrorMsg = String(orderError.message || '').toLowerCase()
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'error',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}升阶失败: ${orderError.message || '未知错误'}`
                    })
                    if (orderErrorMsg.includes('物品数量不足')) {
                      break
                    }
                    break
                  }
                }
                
                if (errorMsgStr.includes('物品数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}升级失败: 物品数量不足`
                  })
                  break
                }
                
                let heroesData = null
                if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
                  heroesData = upgradeRes.role.heroes
                } else if (upgradeRes && upgradeRes._raw && upgradeRes._raw.body && upgradeRes._raw.body.role && upgradeRes._raw.body.role.heroes) {
                  heroesData = upgradeRes._raw.body.role.heroes
                } else if (upgradeRes && upgradeRes.body && upgradeRes.body.role && upgradeRes.body.role.heroes) {
                  heroesData = upgradeRes.body.role.heroes
                }
                
                if (heroesData) {
                  let updatedHero = null
                  if (Array.isArray(heroesData)) {
                    updatedHero = heroesData.find(h => Number(h.heroId) === Number(qunxiongHero.heroId))
                  } else if (typeof heroesData === 'object') {
                    updatedHero = heroesData[qunxiongHero.heroId] || heroesData[String(qunxiongHero.heroId)] ||
                                 Object.values(heroesData).find(h => h && Number(h.heroId) === Number(qunxiongHero.heroId))
                  }
                  
                  if (updatedHero && updatedHero.level > level) {
                    const oldLevel = level
                    level = updatedHero.level
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}升级成功: ${oldLevel} → ${level}`
                    })
                    if (level > 750) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量升级',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'info',
                        message: `${qunxiongHero.name}等级超过750，停止升级`
                      })
                      break
                    }
                  } else {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]${qunxiongHero.name}等级没有变化，可能已达到上限`
                    })
                    break
                  }
                } else {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'error',
                    message: `${qunxiongHero.name}升级响应格式异常`
                  })
                  break
                }
                
                await waitCommandDelay()
              } catch (error) {
                const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
                
                if (errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公') || errorMsg.includes('400060')) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: qunxiongHero.heroId
                      },
                      5000
                    )
                    await waitCommandDelay()
                    continue
                  } catch (orderError) {
                    const orderErrorMsg = String(orderError.message || '').toLowerCase()
                    if (orderErrorMsg.includes('物品数量不足')) {
                      break
                    }
                    break
                  }
                } else if (errorMsg.includes('物品数量不足')) {
                  break
                } else {
                  break
                }
              }
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${qunxiongHero.name}升级结束: ${currentLevel} → ${level}`
            })
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 群雄升级完成`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 群雄升级失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 群雄升级失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]群雄升级失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级群雄完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'success',
      message: `批量升级群雄完成：成功${successCount}个，失败${failCount}个`
    })
    
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量升级')
    })
  } catch (error) {
    console.error('批量升级群雄失败:', error)
    message.error(`批量升级群雄失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级',
      status: 'error',
      message: `批量升级群雄失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgrading900.value = false
  }
}

// 导出阵容
const handleExportTeam = async () => {
  console.log('handleExportTeam clicked')
  // 按token昵称排序的token列表
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始导出阵容（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  // 添加开始日志
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '导出阵容',
    status: 'info',
    message: `开始导出阵容，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isExportingTeam.value = true
    
    const teamDataList = []
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在获取阵容...`)
          
          // 添加开始获取阵容日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '导出阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]开始获取阵容`
          })
          
          // 执行fight_startlevel获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          // 尝试从不同的结构中获取阵容数据
          let teamData = null
          if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            teamData = fightResult.body.battleData.leftTeam.team
          } else if (fightResult && fightResult._raw && fightResult._raw.body && fightResult._raw.body.battleData && fightResult._raw.body.battleData.leftTeam && fightResult._raw.body.battleData.leftTeam.team) {
            teamData = fightResult._raw.body.battleData.leftTeam.team
          } else if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            teamData = fightResult.battleData.leftTeam.team
          }
          
          const heroes = []
          if (teamData) {
            for (let i = 0; i < 5; i++) {
              let hero = null
              if (Array.isArray(teamData)) {
                // 如果是数组，直接通过索引获取
                hero = teamData[i]
              } else {
                // 如果是对象，尝试通过字符串或数字键获取
                hero = teamData?.[String(i)] || teamData?.[i]
              }
              if (hero && hero.id) {
                heroes.push({
                  position: i,
                  heroId: hero.id,
                  heroName: getHeroName(hero.id),
                  level: hero.level || 1
                })
              } else {
                heroes.push({
                  position: i,
                  heroId: null,
                  heroName: '无英雄',
                  level: 0
                })
              }
            }
          }
          
          teamDataList.push({
            tokenIndex: tokenIndex,
            tokenName: token.name || token.id,
            tokenId: token.id,
            heroes: heroes
          })
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 阵容获取成功`)
          
          // 添加成功日志
          const heroSummary = heroes.filter(h => h.heroId).map(h => `${h.heroName}(${h.level}级)`).join(', ')
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '导出阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]阵容获取成功: ${heroSummary || '无英雄'}`
          })
          
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 阵容获取失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 阵容获取失败: ${error.message || '未知错误'}`)
          
          // 添加失败日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '导出阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]阵容获取失败: ${error.message || '未知错误'}`
          })
          
          teamDataList.push({
            tokenIndex: tokenIndex,
            tokenName: token.name || token.id,
            tokenId: token.id,
            heroes: [],
            error: error.message || '未知错误'
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '导出阵容',
              status: 'info',
              message: `正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）`
            })
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '导出阵容',
              tokenId: progress.tokenId,
              tokenName: progress.tokenName,
              status: 'info',
              message: `[序号${tokenIndex}] ${progress.tokenName} 正在获取连接`
            })
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '导出阵容',
              tokenId: progress.tokenId,
              tokenName: progress.tokenName,
              status: 'success',
              message: `[序号${tokenIndex}] ${progress.tokenName} 连接成功`
            })
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '导出阵容',
                tokenId: progress.tokenId,
                tokenName: progress.tokenName,
                status: 'warning',
                message: `[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`
              })
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '导出阵容',
                tokenId: progress.tokenId,
                tokenName: progress.tokenName,
                status: 'error',
                message: `[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`
              })
            }
          }
        }
      }
    )
    
    // 生成CSV内容
    // CSV表头：序号,Token名称,位置0,位置1,位置2,位置3,位置4,状态
    let csvContent = '\uFEFF' // 添加BOM以支持中文
    csvContent += `序号,Token名称,位置0,位置1,位置2,位置3,位置4,状态\n`
    
    // 按token序号排序
    teamDataList.sort((a, b) => a.tokenIndex - b.tokenIndex)
    
    for (const data of teamDataList) {
      const row = [data.tokenIndex, data.tokenName]
      
      if (data.error) {
        // 错误情况，位置列为空，状态列显示错误
        row.push('', '', '', '', '', `错误: ${data.error}`)
      } else if (data.heroes.length === 0) {
        // 无阵容数据
        row.push('', '', '', '', '', '无阵容数据')
      } else {
        // 正常情况，填充5个位置的英雄信息
        for (let i = 0; i < 5; i++) {
          const hero = data.heroes.find(h => h.position === i)
          if (hero && hero.heroId) {
            row.push(`${hero.heroName}(${hero.level}级)`)
          } else {
            row.push('')
          }
        }
        row.push('成功')
      }
      
      // 转义CSV特殊字符并添加到内容
      const escapedRow = row.map(cell => {
        const cellStr = String(cell)
        // 如果包含逗号、换行或引号，需要用引号包裹并转义内部引号
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      })
      csvContent += escapedRow.join(',') + '\n'
    }
    
    // 添加统计信息
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount
    csvContent += `\n统计信息,,,,,,,\n`
    csvContent += `总Token数,${results.length},,,,,,\n`
    csvContent += `成功,${successCount},,,,,,\n`
    csvContent += `失败,${failCount},,,,,,\n`
    
    // 下载CSV文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `阵容导出_${new Date().toISOString().slice(0, 10)}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '-')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success(`阵容导出完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '导出阵容',
      status: 'success',
      message: `阵容导出完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('导出阵容失败:', error)
    message.error(`导出阵容失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '导出阵容',
      status: 'error',
      message: `导出阵容失败: ${error.message || '未知错误'}`
    })
  } finally {
    isExportingTeam.value = false
  }
}

// 批量领取宝箱奖励
const handleBatchClaimBoxRewards = async () => {
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量领取宝箱奖励（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量领取宝箱奖励',
    status: 'info',
    message: `开始批量领取宝箱奖励（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchClaimingBoxRewards.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在领取宝箱奖励...`)
          
          await tokenStore.sendBatchClaimBoxPointReward(token.id)
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 领取宝箱奖励成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量领取宝箱奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]领取宝箱奖励成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 领取宝箱奖励失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 领取宝箱奖励失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量领取宝箱奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、领取宝箱奖励失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量领取宝箱奖励完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量领取宝箱奖励',
      status: 'success',
      message: `批量领取宝箱奖励完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量领取宝箱奖励出错:', error)
    message.error(`批量领取宝箱奖励出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量领取宝箱奖励',
      status: 'error',
      message: `批量领取宝箱奖励出错：${error.message || error}`
    })
  } finally {
    isBatchClaimingBoxRewards.value = false
  }
}

// 批量领取邮件
const handleBatchClaimEmails = async () => {
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const allTokens = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = allTokens
  } else {
    targetTokens = tokenIndices.map(i => allTokens[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量领取邮件（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量领取邮件',
    status: 'info',
    message: `开始批量领取邮件（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchClaimingEmails.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在领取邮件...`)
          
          await tokenStore.sendMessageWithPromise(token.id, 'mail_claimallattachment', { category: 0 })
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 领取邮件成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量领取邮件',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]领取邮件成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 领取邮件失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 领取邮件失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量领取邮件',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、领取邮件失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
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
    
    message.success(`批量领取邮件完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量领取邮件',
      status: 'success',
      message: `批量领取邮件完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量领取邮件出错:', error)
    message.error(`批量领取邮件出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量领取邮件',
      status: 'error',
      message: `批量领取邮件出错：${error.message || error}`
    })
  } finally {
    isBatchClaimingEmails.value = false
  }
}

// 计算宝箱总分
const handleCalculateBoxScore = async () => {
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
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  try {
    isCalculatingBoxScore.value = true
    
    const result = await tokenStore.sendGetRoleInfo(token.id)
    
    if (result && result.role && result.role.items) {
      const items = result.role.items
      const M = items['2001']?.quantity || 0 // 木质宝箱
      const Q = items['2002']?.quantity || 0 // 青铜宝箱
      const H = items['2003']?.quantity || 0 // 黄金宝箱
      const B = items['2004']?.quantity || 0 // 铂金宝箱
      
      const Z = M + Q * 10 + H * 20 + B * 50
      boxTotalScore.value = Z.toString()
      
      message.success('计算宝箱总分成功')
      
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '计算宝箱总分',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `宝箱总分: ${Z} (木质: ${M}, 青铜: ${Q}, 黄金: ${H}, 铂金: ${B})`
      })
    } else {
      message.error('获取角色信息失败')
      
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '计算宝箱总分',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: '获取角色信息失败'
      })
    }
  } catch (error) {
    console.error('计算宝箱总分失败:', error)
    message.error(`计算宝箱总分失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '计算宝箱总分',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `计算宝箱总分失败: ${error.message || '未知错误'}`
    })
  } finally {
    isCalculatingBoxScore.value = false
  }
}

// 计算已用宝箱分
const handleCalculateUsedBoxScore = async () => {
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
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  try {
    isCalculatingUsedBoxScore.value = true
    
    const result = await tokenStore.sendActivityGet(token.id)
    
    if (result && result.activity && result.activity.myTotalInfo && result.activity.myTotalInfo['2']) {
      const info = result.activity.myTotalInfo['2']
      const rounds = info.rounds || 1
      const num = info.num || 0
      
      const usedScore = (rounds - 1) * 8000 + num
      usedBoxScore.value = usedScore.toString()
      
      message.success('计算已用宝箱分成功')
      
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '计算已用宝箱分',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `已用宝箱分: ${usedScore} (rounds: ${rounds}, num: ${num})`
      })
    } else {
      message.error('获取活动信息失败')
      
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '计算已用宝箱分',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: '获取活动信息失败'
      })
    }
  } catch (error) {
    console.error('计算已用宝箱分失败:', error)
    message.error(`计算已用宝箱分失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '计算已用宝箱分',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `计算已用宝箱分失败: ${error.message || '未知错误'}`
    })
  } finally {
    isCalculatingUsedBoxScore.value = false
  }
}

// 批量升级玩具
const isBatchUpgradingToys = ref(false)
const selectedToyUpgradeMode = ref('activate')

const handleBatchUpgradeToys = async () => {
  const upgradeMode = selectedToyUpgradeMode.value
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  
  let modeName = ''
  if (upgradeMode === 'activate') modeName = '激活'
  else if (upgradeMode === 'active') modeName = '主动'
  else if (upgradeMode === 'passive1') modeName = '被动一'
  else if (upgradeMode === 'passive2') modeName = '被动二'
  else if (upgradeMode === 'passive3') modeName = '被动三'
  
  message.info(`开始批量升级玩具-${modeName}（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级玩具',
    status: 'info',
    message: `开始批量升级玩具-${modeName}，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgradingToys.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在升级玩具-${modeName}...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级玩具',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]开始升级玩具-${modeName}`
          })
          
          if (upgradeMode === 'activate') {
            await tokenStore.sendMessageWithPromise(
              token.id,
              'lordweapon_unlock',
              { weaponId: 3 },
              5000
            )
            await waitCommandDelay()
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]激活玩具成功`
            })
            message.success(`[序号${tokenIndex}] ${token.name || token.id} 激活玩具成功`)
          } else if (upgradeMode === 'active') {
            let upgradeCount = 0
            for (let i = 0; i < 60; i++) {
              try {
                await tokenStore.sendLordWeaponUpgradeActiveSkillLevel(token.id, {
                  weaponId: 3
                })
                upgradeCount++
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `玩具主动升级第${i + 1}次成功`
                })
                
                if (i < 59) {
                  await new Promise(resolve => setTimeout(resolve, 600))
                }
              } catch (error) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `玩具主动升级第${i + 1}次失败：${error.message || '未知错误'}，停止主动升级`
                })
                break
              }
            }
            
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级完成，共执行${upgradeCount}次`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `玩具主动升级完成，共执行${upgradeCount}次`
            })
          } else if (upgradeMode === 'passive1' || upgradeMode === 'passive2' || upgradeMode === 'passive3') {
            let skillId = 9
            let skillName = '被动一'
            if (upgradeMode === 'passive2') {
              skillId = 10
              skillName = '被动二'
            } else if (upgradeMode === 'passive3') {
              skillId = 11
              skillName = '被动三'
            }
            
            let upgradeCount = 0
            for (let i = 0; i < 60; i++) {
              try {
                await tokenStore.sendLordWeaponUpgradePassiveSkillLevel(token.id, {
                  weaponId: 3,
                  skillId: skillId
                })
                upgradeCount++
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]玩具${skillName}升级第${i + 1}次成功`
                })
                
                if (i < 59) {
                  await new Promise(resolve => setTimeout(resolve, 600))
                }
              } catch (error) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]玩具${skillName}升级第${i + 1}次失败：${error.message || '未知错误'}，停止升级`
                })
                break
              }
            }
            
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 玩具${skillName}升级完成，共执行${upgradeCount}次`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]玩具${skillName}升级完成，共执行${upgradeCount}次`
            })
          }
          
          return { success: true }
        } catch (error) {
          console.error(`[序号${getTokenIndex(token)}] ${token.name || token.id} 升级玩具失败:`, error)
          message.error(`[序号${getTokenIndex(token)}] ${token.name || token.id} 升级玩具失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级玩具',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `升级玩具失败：${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || error }
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
    
    message.success(`批量升级玩具-${modeName}完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级玩具',
      status: 'success',
      message: `批量升级玩具-${modeName}完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量升级玩具出错:', error)
    message.error(`批量升级玩具出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级玩具',
      status: 'error',
      message: `批量升级玩具出错：${error.message || error}`
    })
  } finally {
    isBatchUpgradingToys.value = false
  }
}

// 批量激活玩具阵容
// 流程说明：
// 1. 按 token 昵称排序，获取目标 tokens
// 2. 对每个 token 执行以下操作：
//    a. 使用 hero_exchange 命令切换阵容 1-4 的武将
//    b. 阵容配置：陆绩、于禁、张昭、邢道荣
// 3. 统计结果并显示
const handleBatchActivateToyTeam = async () => {
  // 按 token 昵称排序的 token 列表
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的 Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的 Token')
    return
  }
  
  // 获取每个 token 在 sortedTokens 中的序号
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量激活玩具阵容（${rangeText}），共${targetTokens.length}个 Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量激活玩具阵容',
    status: 'info',
    message: `开始批量激活玩具阵容，${rangeText}，共${targetTokens.length}个 Token`
  })
  
  try {
    isBatchActivatingToyTeam.value = true
    
    // 玩具阵容配置：阵容 1-4 对应的武将（位置 1-4，不换 0 号的吕布）
    const toyTeamConfig = [
      { team: 1, heroId: 309, heroName: '陆绩' },    // 陆绩 ID: 309
      { team: 2, heroId: 303, heroName: '于禁' },    // 于禁 ID: 303
      { team: 3, heroId: 308, heroName: '张昭' },    // 张昭 ID: 308
      { team: 4, heroId: 312, heroName: '邢道荣' }   // 邢道荣 ID: 312
    ]
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在激活玩具阵容...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量激活玩具阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 开始激活玩具阵容`
          })
          
          // 1. 使用 fight_startlevel 获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          // 2. 解析阵容数据（兼容多种响应格式）
          let battleTeam = null
          if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            battleTeam = fightResult.body.battleData.leftTeam.team
          } else if (fightResult && fightResult._raw && fightResult._raw.body && fightResult._raw.body.battleData && fightResult._raw.body.battleData.leftTeam && fightResult._raw.body.battleData.leftTeam.team) {
            battleTeam = fightResult._raw.body.battleData.leftTeam.team
          } else if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            battleTeam = fightResult.battleData.leftTeam.team
          }
          
          // 获取阵容 1-4 的武将 ID（位置 1-4，不换 0 号的吕布）
          let currentTeamHeroes = []
          for (let i = 1; i <= 4; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (hero && hero.id) {
              currentTeamHeroes.push(hero.id)
            } else {
              currentTeamHeroes.push(0)  // 如果位置为空，使用 0 作为占位符
            }
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量激活玩具阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 当前阵容武将：${JSON.stringify(currentTeamHeroes)}`
          })
          
          // 2. 对每个阵容执行 hero_exchange 命令
          for (const config of toyTeamConfig) {
            // 获取当前阵容的原武将 ID
            const currentHeroId = currentTeamHeroes[config.team - 1] || config.heroId
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `[序号${tokenIndex}] 切换阵容${config.team}：${currentHeroId} → ${config.heroName}(ID:${config.heroId})`
            })
            
            await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_exchange',
              {
                heroId: currentHeroId,        // 原武将 ID
                targetHeroId: config.heroId   // 目标武将 ID
              },
              5000
            )
            await waitCommandDelay()
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `[序号${tokenIndex}] 阵容${config.team}切换为${config.heroName}成功`
            })
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容激活完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量激活玩具阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] 玩具阵容激活完成`
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容激活失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容激活失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量激活玩具阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] 玩具阵容激活失败：${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量激活玩具阵容完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量激活玩具阵容',
      status: 'success',
      message: `批量激活玩具阵容完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量激活玩具阵容')
    })
  } catch (error) {
    console.error('批量激活玩具阵容失败:', error)
    message.error(`批量激活玩具阵容失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量激活玩具阵容',
      status: 'error',
      message: `批量激活玩具阵容失败：${error.message || '未知错误'}`
    })
  } finally {
    isBatchActivatingToyTeam.value = false
  }
}

// 计算主公升级数量
// 逻辑：
// - 4000级：每次升级1级
// - 4001级及以上：使用50/10/5/1规则
// - 最后两位为00：升级50级
// - 其他情况：根据剩余等级选择10/5/1级
const calculateLordUpgradeNum = (currentLevel) => {
  // 当主公等级达到4000级时，每次只升级1级
  if (currentLevel === 4000) {
    return 1
  }
  
  const lastTwoDigits = currentLevel % 100
  
  if (lastTwoDigits === 0 || lastTwoDigits === 50) {
    // 最后两位为00或50，使用50
    return 50
  } else {
    // 最后两位不为00或50，计算需要多少级才能到50或00
    const remaining = 100 - lastTwoDigits
    if (remaining >= 10) {
      return 10
    } else if (remaining >= 5) {
      return 5
    } else {
      return 1
    }
  }
}

// 计算武将升级数量（与主公相同逻辑）
const calculateHeroUpgradeNum = calculateLordUpgradeNum

// 批量升级主公武将
// 流程说明：
// 1. 按token昵称排序，获取目标tokens
// 2. 对每个token执行以下操作：
//    a. 使用role_getroleinfo获取当前主公和吕布等级、阶数
//    b. 检查并执行升阶（如果需要）
//    c. 进入循环升级：
//       i. 比较阶数：
//          - 主公阶数高 → 升级吕布
//          - 同阶 → 先升级主公，再升级吕布
//       ii. 升级参数：只能是50/10/5/1
//       iii. 升级后检查并执行升阶
//       iv. 循环直到物品数量不足或达到最大升级次数
// 3. 统计结果并显示
const handleBatchUpgradeLord = async () => {
  // 按token昵称排序的token列表
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(executionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  // 升阶等级列表
  const upgradeLevels = [100, 200, 300, 500, 700, 900, 1100, 1300, 1500, 1800, 2100, 2400, 2800, 3200, 3600, 4000, 4500, 5000, 5500, 6000]
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级主公武将（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级主公武将',
    status: 'info',
    message: `开始批量升级主公武将，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgradingLord.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行升级主公武将...`)
          
          // 1. 使用role_getroleinfo获取当前主公和吕布等级
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]执行role_getroleinfo命令，获取主公和吕布等级`
          })
          
          const roleResult = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          // 调试日志：查看roleResult的结构
          console.log('[批量升级主公武将] roleResult结构:', JSON.stringify(roleResult, null, 2).substring(0, 2000))
          
          // 2. 从响应中获取主公等级和阶数
          let lordLevel = 0
          let lordOrder = 0
          if (roleResult && roleResult.role && roleResult.role.lord) {
            lordLevel = roleResult.role.lord.level || 0
            lordOrder = roleResult.role.lord.order || 0
          } else if (roleResult && roleResult._raw && roleResult._raw.body && roleResult._raw.body.role && roleResult._raw.body.role.lord) {
            lordLevel = roleResult._raw.body.role.lord.level || 0
            lordOrder = roleResult._raw.body.role.lord.order || 0
          } else if (roleResult && roleResult.body && roleResult.body.role && roleResult.body.role.lord) {
            lordLevel = roleResult.body.role.lord.level || 0
            lordOrder = roleResult.body.role.lord.order || 0
          }
          
          if (lordLevel === 0) {
            throw new Error('无法获取主公等级')
          }
          
          // 3. 从响应中获取吕布等级和阶数
          console.log('[批量升级主公武将] 检查heroes结构...')
          
          let luBuLevel = 0
          let luBuOrder = 0
          // 注意：字段名是heroes而不是heros
          if (roleResult && roleResult.role && roleResult.role.heroes) {
            console.log('[批量升级主公武将] roleResult.role.heroes:', JSON.stringify(roleResult.role.heroes).substring(0, 500))
            // heroes是对象，直接通过键获取
            const luBu = roleResult.role.heroes['107'] || roleResult.role.heroes[107]
            console.log('[批量升级主公武将] 从roleResult.role.heroes获取的luBu:', luBu)
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          } else if (roleResult && roleResult._raw && roleResult._raw.body && roleResult._raw.body.role && roleResult._raw.body.role.heroes) {
            console.log('[批量升级主公武将] roleResult._raw.body.role.heroes:', JSON.stringify(roleResult._raw.body.role.heroes).substring(0, 500))
            // heroes是对象，直接通过键获取
            const luBu = roleResult._raw.body.role.heroes['107'] || roleResult._raw.body.role.heroes[107]
            console.log('[批量升级主公武将] 从roleResult._raw.body.role.heroes获取的luBu:', luBu)
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          } else if (roleResult && roleResult.body && roleResult.body.role && roleResult.body.role.heroes) {
            console.log('[批量升级主公武将] roleResult.body.role.heroes:', JSON.stringify(roleResult.body.role.heroes).substring(0, 500))
            // heroes是对象，直接通过键获取
            const luBu = roleResult.body.role.heroes['107'] || roleResult.body.role.heroes[107]
            console.log('[批量升级主公武将] 从roleResult.body.role.heroes获取的luBu:', luBu)
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          } else if (roleResult && roleResult.heroes) {
            // 顶层也有可能
            console.log('[批量升级主公武将] roleResult.heroes:', JSON.stringify(roleResult.heroes).substring(0, 500))
            const luBu = roleResult.heroes['107'] || roleResult.heroes[107]
            console.log('[批量升级主公武将] 从roleResult.heroes获取的luBu:', luBu)
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          }
          
          console.log('[批量升级主公武将] 获取到的luBuLevel:', luBuLevel, 'luBuOrder:', luBuOrder)
          
          if (luBuLevel === 0) {
            throw new Error('无法获取吕布等级')
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]获取等级成功: 主公${lordLevel}级，吕布${luBuLevel}级`
          })
          
          // 4. 比较并升级，根据阶数决定升级顺序
          let currentLordLevel = lordLevel
          let currentLuBuLevel = luBuLevel
          let currentLordOrder = lordOrder
          let currentLuBuOrder = luBuOrder
          let upgradeCount = 0
          const maxUpgrades = 100 // 最多升级次数，防止死循环
          
          // 检查是否需要升阶
          await checkAndUpgradeOrder(token, tokenIndex, 'lord', currentLordLevel)
          await checkAndUpgradeOrder(token, tokenIndex, 'hero', currentLuBuLevel, 107)
          
          while (upgradeCount < maxUpgrades) {
            // 比较阶数
            if (currentLordOrder > currentLuBuOrder) {
              // 主公阶数高，升级吕布
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级主公武将',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]主公阶数${currentLordOrder}高于吕布阶数${currentLuBuOrder}，升级吕布`
              })
              
              const nextLevel = getNextUpgradeLevel(currentLuBuLevel, upgradeLevels)
              if (nextLevel === null) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]吕布已达到最高等级${currentLuBuLevel}，停止升级`
                })
                break
              }
              
              // 确保吕布等级不超过主公等级
              if (currentLuBuLevel >= currentLordLevel) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]吕布等级${currentLuBuLevel}已达到主公等级${currentLordLevel}，等待主公升级`
                })
                upgradeCount++
                continue
              }
              
              // 特别处理4000级
              if (currentLuBuLevel === 4000) {
                try {
                  await upgradeHero(token, tokenIndex, 107, 1)
                  currentLuBuLevel = 4001
                  upgradeCount++
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级成功: 4000 → 4001`
                  })
                } catch (error) {
                  const errorMsg = String(error.message || '').toLowerCase()
                  if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
                    await upgradeHeroOrder(token, tokenIndex, 107)
                    await upgradeHero(token, tokenIndex, 107, 1)
                    currentLuBuLevel = 4001
                    upgradeCount++
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升阶后升级成功: 4000 → 4001`
                    })
                  } else if (errorMsg.includes('物品数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级失败: 物品数量不足，停止执行`
                    })
                    throw new Error('吕布升级失败: 物品数量不足')
                  } else {
                    throw error
                  }
                }
                break
              }
              
              const upgradeNum = calculateHeroUpgradeNum(currentLuBuLevel)
              try {
                await upgradeHero(token, tokenIndex, 107, upgradeNum)
                currentLuBuLevel = currentLuBuLevel + upgradeNum
                upgradeCount++
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级成功: ${currentLuBuLevel - upgradeNum} → ${currentLuBuLevel}`
                })
                
                // 到达指定等级后，执行一次升阶命令
                await checkAndUpgradeOrder(token, tokenIndex, 'hero', currentLuBuLevel, 107)
                
                // 升级后更新阶数（只在开始时获取一次，之后使用计算值）
                // 如果升级到了新的阶数等级，更新阶数
                if (upgradeLevels.includes(currentLuBuLevel)) {
                  currentLuBuOrder = await getHeroOrder(token, tokenIndex, 107)
                }
              } catch (error) {
                const errorMsg = String(error.message || '').toLowerCase()
                if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
                  await upgradeHeroOrder(token, tokenIndex, 107)
                  await upgradeHero(token, tokenIndex, 107, upgradeNum)
                  currentLuBuLevel = currentLuBuLevel + upgradeNum
                  upgradeCount++
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升阶后升级成功: ${currentLuBuLevel - upgradeNum} → ${currentLuBuLevel}`
                  })
                  
                  // 升级后更新阶数（只在开始时获取一次，之后使用计算值）
                  // 如果升级到了新的阶数等级，更新阶数
                  if (upgradeLevels.includes(currentLuBuLevel)) {
                    currentLuBuOrder = await getHeroOrder(token, tokenIndex, 107)
                  }
                } else if (errorMsg.includes('物品数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级失败: 物品数量不足，停止执行`
                  })
                  throw new Error('吕布升级失败: 物品数量不足')
                } else {
                  throw error
                }
              }
            } else if (currentLordOrder === currentLuBuOrder) {
              // 同阶，先升级主公到下一阶等级
              const nextLordLevel = getNextUpgradeLevel(currentLordLevel, upgradeLevels)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级主公武将',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]主公和吕布同阶${currentLordOrder}，先升级主公到下一阶等级${nextLordLevel}级，再升级吕布。`
              })
              
              if (nextLordLevel === null) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]主公已达到最高等级${currentLordLevel}，停止升级`
                })
                break
              }
              
              // 循环升级，直到达到下一阶等级
              while (currentLordLevel < nextLordLevel) {
                // 计算需要升级的级数（使用原来的升级规则）
                const upgradeNum = calculateLordUpgradeNum(currentLordLevel)
                
                // 特别处理4000级
                if (currentLordLevel === 4000) {
                  try {
                    await upgradeLord(token, tokenIndex, 1)
                    currentLordLevel = 4001
                    upgradeCount++
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级成功: 4000 → 4001`
                    })
                  } catch (error) {
                    const errorMsg = String(error.message || '').toLowerCase()
                    if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
                      await upgradeLordOrder(token, tokenIndex)
                      await upgradeLord(token, tokenIndex, 1)
                      currentLordLevel = 4001
                      upgradeCount++
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量升级主公武将',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'success',
                        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: 4000 → 4001`
                      })
                    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量升级主公武将',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'warning',
                        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: 物品数量不足，停止执行`
                      })
                      throw new Error('主公升级失败: 物品数量不足')
                    } else {
                      throw error
                    }
                  }
                  continue
                }
                
                try {
                  await upgradeLord(token, tokenIndex, upgradeNum)
                  currentLordLevel = currentLordLevel + upgradeNum
                  upgradeCount++
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
                  })
                  
                  // 到达指定等级后，执行一次升阶命令
                  await checkAndUpgradeOrder(token, tokenIndex, 'lord', currentLordLevel)
                  
                  // 升级后更新阶数（只在开始时获取一次，之后使用计算值）
                  // 如果升级到了新的阶数等级，更新阶数
                  if (upgradeLevels.includes(currentLordLevel)) {
                    currentLordOrder = await getLordOrder(token, tokenIndex)
                  }
                } catch (error) {
                  const errorMsg = String(error.message || '').toLowerCase()
                  if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
                    await upgradeLordOrder(token, tokenIndex)
                    await upgradeLord(token, tokenIndex, upgradeNum)
                    currentLordLevel = currentLordLevel + upgradeNum
                    upgradeCount++
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
                    })
                    
                    // 升级后更新阶数（只在开始时获取一次，之后使用计算值）
                    // 如果升级到了新的阶数等级，更新阶数
                    if (upgradeLevels.includes(currentLordLevel)) {
                      currentLordOrder = await getLordOrder(token, tokenIndex)
                    }
                  } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: 物品数量不足，停止执行`
                    })
                    throw new Error('主公升级失败: 物品数量不足')
                  } else {
                    throw error
                  }
                }
              }
              
              // 主公升级完成后，升级吕布到与主公同等级
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级主公武将',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级完成，现在升级吕布到与主公同等级${currentLordLevel}级`
              })
              
              // 循环升级，直到吕布达到主公等级
              while (currentLuBuLevel < currentLordLevel) {
                const luBuUpgradeNum = calculateHeroUpgradeNum(currentLuBuLevel)
                
                // 确保不超过主公等级
                const actualUpgradeNum = Math.min(luBuUpgradeNum, currentLordLevel - currentLuBuLevel)
                
                try {
                  await upgradeHero(token, tokenIndex, 107, actualUpgradeNum)
                  currentLuBuLevel = currentLuBuLevel + actualUpgradeNum
                  upgradeCount++
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级成功: ${currentLuBuLevel - actualUpgradeNum} → ${currentLuBuLevel}`
                  })
                  
                  // 到达指定等级后，执行一次升阶命令
                  await checkAndUpgradeOrder(token, tokenIndex, 'hero', currentLuBuLevel, 107)
                  
                  // 升级后更新阶数（只在开始时获取一次，之后使用计算值）
                  // 如果升级到了新的阶数等级，更新阶数
                  if (upgradeLevels.includes(currentLuBuLevel)) {
                    currentLuBuOrder = await getHeroOrder(token, tokenIndex, 107)
                  }
                } catch (error) {
                  const errorMsg = String(error.message || '').toLowerCase()
                  if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
                    await upgradeHeroOrder(token, tokenIndex, 107)
                    await upgradeHero(token, tokenIndex, 107, actualUpgradeNum)
                    currentLuBuLevel = currentLuBuLevel + actualUpgradeNum
                    upgradeCount++
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升阶后升级成功: ${currentLuBuLevel - actualUpgradeNum} → ${currentLuBuLevel}`
                    })
                    
                    // 升级后更新阶数（只在开始时获取一次，之后使用计算值）
                    // 如果升级到了新的阶数等级，更新阶数
                    if (upgradeLevels.includes(currentLuBuLevel)) {
                      currentLuBuOrder = await getHeroOrder(token, tokenIndex, 107)
                    }
                  } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级失败: 物品数量不足，停止执行`
                    })
                    throw new Error('吕布升级失败: 物品数量不足')
                  } else {
                    throw error
                  }
                }
              }






            }
            
            await waitCommandDelay()
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 升级主公武将完成，共升级${upgradeCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级主公武将完成，共升级${upgradeCount}次，最终等级：主公${currentLordLevel}级，吕布${currentLuBuLevel}级`
          })
          
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 升级主公武将失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 升级主公武将失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级主公武将失败: ${error.message || '未知错误'}`
          })
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级主公武将完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      status: 'success',
      message: `批量升级主公武将完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.token.tokenId || r.token.id, '批量升级主公武将')
    })
  } catch (error) {
    console.error('批量升级主公武将失败:', error)
    message.error(`批量升级主公武将失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      status: 'error',
      message: `批量升级主公武将失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgradingLord.value = false
  }
}

// 获取下一个升级等级
const getNextUpgradeLevel = (currentLevel, upgradeLevels) => {
  for (const level of upgradeLevels) {
    if (level > currentLevel) {
      return level
    }
  }
  return null
}

// 升级主公
const upgradeLord = async (token, tokenIndex, upgradeNum) => {
  try {
    // 执行主公升级
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradelevel命令: 升级${upgradeNum}级`
    })
    
    const upgradeRes = await tokenStore.sendHeroLordUpgradeLevel(
      token.id,
      {
        upgradeNum: upgradeNum
      }
    )
    
    // 检查响应中是否有错误消息
    const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
    const errorMsgStr = String(errorMsg).toLowerCase()
    
    // 检查是否包含"升阶"错误
    if (errorMsgStr.includes('升阶') || errorMsgStr.includes('进阶') || errorMsgStr.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: 需要升阶，准备执行升阶命令`
      })
      
      // 执行升阶命令
      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradeorder命令进行升阶`
        })
        
        await tokenStore.sendHeroLordUpgradeOrder(token.id, {})
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶成功`
        })
        
        await waitCommandDelay()
        // 升阶后重新执行升级
        await upgradeLord(token, tokenIndex, upgradeNum)
      } catch (orderError) {
        console.error(`主公升阶失败:`, orderError)
        const orderErrorMsg = String(orderError.message || '').toLowerCase()
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶失败: ${orderError.message || '未知错误'}`
        })
        
        // 如果升阶失败是因为物品数量不足，停止升级
        if (orderErrorMsg.includes('物品数量不足')) {
          throw new Error('主公升阶失败: 物品数量不足')
        }
        
        throw orderError
      }
    }
    
    // 检查是否包含"物品数量不足"
    if (errorMsgStr.includes('物品数量不足')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: 物品数量不足`
      })
      throw new Error('主公升级失败: 物品数量不足')
    }
    
    return upgradeRes
  } catch (error) {
    const errorMsg = String(error.message || '').toLowerCase()
    
    // 检查是否包含"升阶"错误
    if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: 需要升阶，准备执行升阶命令`
      })
      
      // 执行升阶命令
      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradeorder命令进行升阶`
        })
        
        await tokenStore.sendHeroLordUpgradeOrder(token.id, {})
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶成功`
        })
        
        await waitCommandDelay()
        // 升阶后重新执行升级
        return await upgradeLord(token, tokenIndex, upgradeNum)
      } catch (orderError) {
        console.error(`主公升阶失败:`, orderError)
        const orderErrorMsg = String(orderError.message || '').toLowerCase()
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶失败: ${orderError.message || '未知错误'}`
        })
        
        if (orderErrorMsg.includes('物品数量不足') || orderErrorMsg.includes('金币数量不足')) {
          throw new Error('主公升阶失败: 物品数量不足')
        }
        
        throw orderError
      }
    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
      // 物品数量不足或金币不足，停止升级
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: ${error.message || '物品数量不足'}`
      })
      throw new Error(`主公升级失败: ${error.message || '物品数量不足'}`)
    } else {
      // 其他错误，记录并继续
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: ${error.message || '未知错误'}`
      })
      throw error
    }
  }
}

// 升级武将
const upgradeHero = async (token, tokenIndex, heroId, upgradeNum) => {
  try {
    // 执行武将升级
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradelevel命令: 武将ID${heroId}，升级${upgradeNum}级`
    })
    
    const upgradeRes = await tokenStore.sendHeroUpgradeLevel(
      token.id,
      {
        heroId: heroId,
        upgradeNum: upgradeNum
      }
    )
    
    // 检查响应中是否有错误消息
    const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
    const errorMsgStr = String(errorMsg).toLowerCase()
    
    // 检查是否包含"升阶"错误
    if (errorMsgStr.includes('升阶') || errorMsgStr.includes('进阶') || errorMsgStr.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将升级失败: 需要升阶，准备执行升阶命令`
      })
      
      // 执行升阶命令
      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradeorder命令进行升阶`
        })
        
        await tokenStore.sendHeroUpgradeOrder(token.id, {
          heroId: heroId
        })
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将升阶成功`
        })
        
        await waitCommandDelay()
        // 升阶后重新执行升级
        await upgradeHero(token, tokenIndex, heroId, upgradeNum)
      } catch (orderError) {
        console.error(`武将升阶失败:`, orderError)
        const orderErrorMsg = String(orderError.message || '').toLowerCase()
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将升阶失败: ${orderError.message || '未知错误'}`
        })
        
        // 如果升阶失败是因为物品数量不足，停止升级
        if (orderErrorMsg.includes('物品数量不足')) {
          throw new Error('武将升阶失败: 物品数量不足')
        }
        
        throw orderError
      }
    }
    
    // 检查是否包含"物品数量不足"
    if (errorMsgStr.includes('物品数量不足')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将升级失败: 物品数量不足`
      })
      throw new Error('武将升级失败: 物品数量不足')
    }
    
    return upgradeRes
  } catch (error) {
    const errorMsg = String(error.message || '').toLowerCase()
    
    // 检查是否包含"升阶"错误
    if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将升级失败: 需要升阶，准备执行升阶命令`
      })
      
      // 执行升阶命令
      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradeorder命令进行升阶`
        })
        
        await tokenStore.sendHeroUpgradeOrder(token.id, {
          heroId: heroId
        })
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将升阶成功`
        })
        
        await waitCommandDelay()
        // 升阶后重新执行升级
        return await upgradeHero(token, tokenIndex, heroId, upgradeNum)
      } catch (orderError) {
        console.error(`武将升阶失败:`, orderError)
        const orderErrorMsg = String(orderError.message || '').toLowerCase()
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将升阶失败: ${orderError.message || '未知错误'}`
        })
        
        if (orderErrorMsg.includes('物品数量不足') || orderErrorMsg.includes('金币数量不足')) {
          throw new Error('武将升阶失败: 物品数量不足')
        }
        
        throw orderError
      }
    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
      // 物品数量不足或金币不足，停止升级
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将升级失败: ${error.message || '物品数量不足'}`
      })
      throw new Error(`武将升级失败: ${error.message || '物品数量不足'}`)
    } else {
      // 其他错误，记录并继续
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将升级失败: ${error.message || '未知错误'}`
      })
      throw error
    }
  }
}

// 检查并执行升阶命令
const checkAndUpgradeOrder = async (token, tokenIndex, type, level, heroId = null) => {
  // 升阶等级列表
  const upgradeLevels = [100, 200, 300, 500, 700, 900, 1100, 1300, 1500, 1800, 2100, 2400, 2800, 3200, 3600, 4000, 4500, 5000, 5500, 6000]
  
  // 检查是否到达升阶等级
  if (upgradeLevels.includes(level)) {
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]${type === 'lord' ? '主公' : '吕布'}达到${level}级，准备执行升阶命令`
    })
    
    if (type === 'lord') {
      await upgradeLordOrder(token, tokenIndex)
    } else if (type === 'hero' && heroId) {
      await upgradeHeroOrder(token, tokenIndex, heroId)
    }
  }
}

// 执行主公升阶命令
const upgradeLordOrder = async (token, tokenIndex) => {
  try {
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradeorder命令进行升阶`
    })
    
    await tokenStore.sendHeroLordUpgradeOrder(token.id, {})
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶成功`
    })
    
    await waitCommandDelay()
  } catch (error) {
    console.error(`主公升阶失败:`, error)
    const errorMsg = String(error.message || '').toLowerCase()
    
    // 如果提示"未进阶"或错误码400060，说明已经进阶过了，不需要再次升阶
    if (errorMsg.includes('未进阶') || errorMsg.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公已进阶，跳过升阶，继续执行升级`
      })
      // 不抛出错误，继续执行升级
      return
    }
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'warning',
      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶失败: ${error.message || '未知错误'}`
    })
    
    // 物品数量不足，停止执行
    if (errorMsg.includes('物品数量不足')) {
      throw new Error('主公升阶失败: 物品数量不足')
    }
    
    // 其他错误不抛出，继续执行升级
  }
}

// 执行武将升阶命令
const upgradeHeroOrder = async (token, tokenIndex, heroId) => {
  try {
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_heroupgradeorder命令进行升阶`
    })
    
    await tokenStore.sendHeroUpgradeOrder(token.id, {
      heroId: heroId
    })
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]武将升阶成功`
    })
    
    await waitCommandDelay()
  } catch (error) {
    console.error(`武将升阶失败:`, error)
    const errorMsg = String(error.message || '').toLowerCase()
    
    // 如果提示"未进阶"或错误码400060，说明已经进阶过了，不需要再次升阶
    if (errorMsg.includes('未进阶') || errorMsg.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将已进阶，跳过升阶，继续执行升级`
      })
      // 不抛出错误，继续执行升级
      return
    }
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'warning',
      message: `【序号${tokenIndex}】[${token.name || token.id}]武将升阶失败: ${error.message || '未知错误'}`
    })
    
    // 物品数量不足，停止执行
    if (errorMsg.includes('物品数量不足')) {
      throw new Error('武将升阶失败: 物品数量不足')
    }
    
    // 其他错误不抛出，继续执行升级
  }
}

// 获取主公阶数
const getLordOrder = async (token, tokenIndex) => {
  try {
    const roleResult = await tokenStore.sendGetRoleInfo(token.id)
    await waitCommandDelay()
    
    if (roleResult && roleResult.role && roleResult.role.lord) {
      return roleResult.role.lord.order || 0
    } else if (roleResult && roleResult._raw && roleResult._raw.body && roleResult._raw.body.role && roleResult._raw.body.role.lord) {
      return roleResult._raw.body.role.lord.order || 0
    } else if (roleResult && roleResult.body && roleResult.body.role && roleResult.body.role.lord) {
      return roleResult.body.role.lord.order || 0
    }
    
    return 0
  } catch (error) {
    console.error(`获取主公阶数失败:`, error)
    return 0
  }
}

// 获取武将阶数
const getHeroOrder = async (token, tokenIndex, heroId) => {
  try {
    const roleResult = await tokenStore.sendGetRoleInfo(token.id)
    await waitCommandDelay()
    
    // 注意：字段名是heroes而不是heros
    if (roleResult && roleResult.role && roleResult.role.heroes) {
      const hero = roleResult.role.heroes[String(heroId)] || roleResult.role.heroes[heroId]
      if (hero) {
        return hero.order || 0
      }
    } else if (roleResult && roleResult._raw && roleResult._raw.body && roleResult._raw.body.role && roleResult._raw.body.role.heroes) {
      const hero = roleResult._raw.body.role.heroes[String(heroId)] || roleResult._raw.body.role.heroes[heroId]
      if (hero) {
        return hero.order || 0
      }
    } else if (roleResult && roleResult.body && roleResult.body.role && roleResult.body.role.heroes) {
      const hero = roleResult.body.role.heroes[String(heroId)] || roleResult.body.role.heroes[heroId]
      if (hero) {
        return hero.order || 0
      }
    } else if (roleResult && roleResult.heroes) {
      const hero = roleResult.heroes[String(heroId)] || roleResult.heroes[heroId]
      if (hero) {
        return hero.order || 0
      }
    }
    
    return 0
  } catch (error) {
    console.error(`获取武将阶数失败:`, error)
    return 0
  }
}
</script>

<style scoped>
.account-maintenance {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scheduled-tasks {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.task-item :deep(.customized-card) {
  flex: 1;
}

.task-item :deep(.n-switch) {
  margin-left: 10px;
}
</style>
