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
            mode="button-with-select"
            button-text="批量升级水晶"
            :select-value="selectedCrystalHero"
            @update:select-value="(val) => selectedCrystalHero = val"
            :select-options="heroOptions"
            placeholder="选择英雄"
            :disabled="isUpgradingCrystal"
            :loading="isUpgradingCrystal"
            @button-click="handleUpgradeCrystal"
          />
          <CustomizedCard 
            mode="button-with-select"
            button-text="批量使用万能红"
            :select-value="selectedUniversalRedHero"
            @update:select-value="(val) => selectedUniversalRedHero = val"
            :select-options="heroOptions"
            placeholder="选择英雄"
            :disabled="isUsingUniversalRed"
            :loading="isUsingUniversalRed"
            @button-click="handleUseUniversalRed"
          />
          <CustomizedCard 
            mode="button"
            :name="isUpgradingLuBuStar ? '批量升星吕布中...' : '批量升星吕布'"
            @button-click="handleUpgradeLuBuStar"
            :disabled="isUpgradingLuBuStar"
            :loading="isUpgradingLuBuStar"
          />
          <CustomizedCard 
            mode="button-with-select"
            :button-text="isBatchHeroSynthetic ? '批量英雄合成中...' : '批量英雄合成'"
            :select-value="selectedSyntheticHero"
            @update:select-value="(val) => selectedSyntheticHero = val"
            :select-options="syntheticHeroOptions"
            placeholder="选择英雄"
            :disabled="isBatchHeroSynthetic"
            :loading="isBatchHeroSynthetic"
            @button-click="handleBatchHeroSynthetic"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchHeroBattle ? '批量上阵吕布中...' : '批量上阵吕布'"
            @button-click="handleBatchHeroBattle"
            :disabled="isBatchHeroBattle"
            :loading="isBatchHeroBattle"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchHeroZhangFei ? '批量上阵张飞中...' : '批量上阵张飞'"
            @button-click="handleBatchHeroZhangFei"
            :disabled="isBatchHeroZhangFei"
            :loading="isBatchHeroZhangFei"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchStoryTeam ? '批量上阵推图中...' : '批量上阵推图'"
            @button-click="handleBatchStoryTeam"
            :disabled="isBatchStoryTeam"
            :loading="isBatchStoryTeam"
          />
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
            :name="isUpgradingChiYu ? '购买升级赤羽中...' : '购买升级赤羽'"
            @button-click="handleUpgradeChiYu"
            :disabled="isUpgradingChiYu"
            :loading="isUpgradingChiYu"
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
          <!-- 领取宝箱周奖励和一键宝箱周按钮已移除 -->
          <CustomizedCard 
            mode="name-input"
            name="基准宝箱分"
            v-model:inputValue="baseBoxScore"
            placeholder="输入基准宝箱分"
          />
          <CustomizedCard 
            mode="button-count"
            name="宝箱总分"
            :count="boxTotalScore"
            @button-click="handleCalculateBoxScore"
            :disabled="!selectedTokenId || isCalculatingBoxScore"
            :loading="isCalculatingBoxScore"
          />
          <CustomizedCard 
            mode="button-count"
            name="已用宝箱分"
            :count="usedBoxScore"
            @button-click="handleCalculateUsedBoxScore"
            :disabled="!selectedTokenId || isCalculatingUsedBoxScore"
            :loading="isCalculatingUsedBoxScore"
          />
        </CustomizedCard>
        
        <!-- 批量操作区域 -->
        <CustomizedCard mode="container">
          <CustomizedCard 
            mode="execution-range" 
            name="执行范围" 
            v-model:inputValue="executionTokens" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            @update:inputValue="handleExecutionTokensInput" 
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
            :name="isBatchAwakingSkill ? '批量觉醒中...' : '批量觉醒'"
            @button-click="handleBatchAwakeSkill"
            :disabled="isBatchAwakingSkill"
            :loading="isBatchAwakingSkill"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchQuenching ? '批量洗练减伤中...' : '批量洗练减伤'"
            @button-click="handleBatchQuench"
            :disabled="isBatchQuenching"
            :loading="isBatchQuenching"
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
            name="导出详情"
            @button-click="handleExportDetails"
            :disabled="isExportingDetails"
            :loading="isExportingDetails"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchBoxWeekRunning ? '批量宝箱周中...' : '批量宝箱周'"
            @button-click="handleBatchBoxWeek"
            :disabled="isBatchBoxWeekRunning"
            :loading="isBatchBoxWeekRunning"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchSettingStoryTeam ? '批量设置推图阵容中...' : '批量设置推图阵容'"
            @button-click="handleBatchSetStoryTeam"
            :disabled="isBatchSettingStoryTeam"
            :loading="isBatchSettingStoryTeam"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchSettingTowerTeam ? '批量设置爬塔阵容中...' : '批量设置爬塔阵容'"
            @button-click="handleBatchSetTowerTeam"
            :disabled="isBatchSettingTowerTeam"
            :loading="isBatchSettingTowerTeam"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUnloadingHeroes ? '批量下阵武将中...' : '批量下阵武将'"
            @button-click="handleBatchUnloadHeroes"
            :disabled="isBatchUnloadingHeroes"
            :loading="isBatchUnloadingHeroes"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUpgrading900 ? '批量升级 900 级中...' : '批量升级 900 级'"
            @button-click="handleBatchUpgrade900"
            :disabled="isBatchUpgrading900"
            :loading="isBatchUpgrading900"
          />
          <CustomizedCard 
            mode="button"
            :name="isExportingTeam ? '导出阵容中...' : '导出阵容'"
            @button-click="handleExportTeam"
            :disabled="isExportingTeam"
            :loading="isExportingTeam"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchActivatingToys ? '批量激活玩具中...' : '批量激活玩具'"
            @button-click="handleBatchActivateToys"
            :disabled="isBatchActivatingToys"
            :loading="isBatchActivatingToys"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUpgradingLord ? '批量升级主公武将中...' : '批量升级主公武将'"
            @button-click="handleBatchUpgradeLord"
            :disabled="isBatchUpgradingLord"
            :loading="isBatchUpgradingLord"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchActivatingToyTeam ? '批量激活玩具阵容中...' : '批量激活玩具阵容'"
            @button-click="handleBatchActivateToyTeam"
            :disabled="isBatchActivatingToyTeam"
            :loading="isBatchActivatingToyTeam"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUpgradingToyTeamStar ? '批量玩具阵容升星中...' : '批量玩具阵容升星'"
            @button-click="handleBatchUpgradeToyTeamStar"
            :disabled="isBatchUpgradingToyTeamStar"
            :loading="isBatchUpgradingToyTeamStar"
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
import { HERO_DICT } from '@/utils/HeroList'

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
const isUpgradingCrystal = ref(false)
const isUsingUniversalRed = ref(false)
const isUpgradingLuBuStar = ref(false)
const isUpgradingChiYu = ref(false)
const isBatchUpgradingEquipment = ref(false)
const isBatchAwakingSkill = ref(false)
const isBatchQuenching = ref(false)
const isBatchUpgradingHangup = ref(false)
const isBatchClaimingHangupReward = ref(false)
const isBoxWeekRunning = ref(false)
const isRecruitWeekRunning = ref(false)
const isExportingDetails = ref(false)
const isBatchBoxWeekRunning = ref(false)

// 下拉选择状态
const selectedUniversalRedHero = ref(null)
const selectedCrystalHero = ref(null)
const selectedSyntheticHero = ref('lvbu')

// 英雄选项（从HERO_DICT生成，只保留红色武将，即ID以1开头的）
const heroOptions = computed(() => {
  return Object.entries(HERO_DICT)
    .filter(([id, hero]) => id.startsWith('1'))
    .map(([id, hero]) => ({
      label: hero.name,
      value: parseInt(id)
    })).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
})

// 英雄合成下拉选项
const syntheticHeroOptions = computed(() => {
  return [
    { label: '吕布', value: 'lvbu' },
    { label: '张飞', value: 'zhangfei' },
    { label: '全部', value: 'all' }
  ]
})

// 新增状态
const isBatchClaimingBoxRewards = ref(false)
const isBatchClaimingEmails = ref(false)
const isCalculatingBoxScore = ref(false)
const isCalculatingUsedBoxScore = ref(false)
const isClaimingBoxWeekReward = ref(false)
const baseBoxScore = ref('')
const boxTotalScore = ref('0')
const usedBoxScore = ref('0')

// 新功能状态
const isBatchSettingStoryTeam = ref(false)
const isBatchSettingTowerTeam = ref(false)
const isBatchUnloadingHeroes = ref(false)
const isBatchUpgrading900 = ref(false)
const isExportingTeam = ref(false)
const isBatchUpgradingLord = ref(false)
const isBatchActivatingToyTeam = ref(false)
const isBatchUpgradingToyTeamStar = ref(false)
const isBatchHeroSynthetic = ref(false)
const isBatchHeroBattle = ref(false)
const isBatchHeroZhangFei = ref(false)
const isBatchStoryTeam = ref(false)
const isBatchMayDayExchange = ref(false)

// 执行范围
const executionTokens = ref('')

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
          
          // 执行100次 item_consume 命令
          for (let i = 0; i < 100; i++) {
            try {
              await tokenStore.sendItemConsume(token.id, { itemId: 1008, quantity: 50 })
              await new Promise(resolve => setTimeout(resolve, 500))
              successCount++
            } catch (error) {
              console.error(`第${i + 1}次使用火把失败:`, error)
              failCount++
              // 如果服务器错误，跳过执行剩余次数
              if (error.message && error.message.includes('服务器错误')) {
                message.warning(`${token.name} - 第${i + 1}次使用火把失败: ${error.message}，跳过剩余次数`)
                break
              }
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 使用火把完成：成功${successCount}次，失败${failCount}次（每次使用50个）`)

          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用火把',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、使用火把完成：成功${successCount}次，失败${failCount}次（每次使用50个）`
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
            message: `${tokenIndex}、${token.name || token.id}、使用火把失败: ${error.message}`
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
                await new Promise(resolve => setTimeout(resolve, 500))
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
            message: `${tokenIndex}、${token.name || token.id}、升级水晶完成：成功${successCount}次，失败${failCount}次（目标英雄: ${selectedHeroName}）`
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
            message: `${tokenIndex}、${token.name || token.id}、升级水晶失败: ${error.message}`
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
              message: `${tokenIndex}、${token.name || token.id}、升级装备成功`
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
            message: `${tokenIndex}、${token.name || token.id}、升级装备失败: ${error.message}`
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

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchAwakingSkill.value = true

    message.info(`开始批量觉醒（${rangeText}），共${targetTokens.length}个Token...`)

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
              heroId: 107,
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
                message: `${tokenIndex}、${token.name || token.id}、觉醒成功 (index: ${index})`
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
              message: `${tokenIndex}、${token.name || token.id}、觉醒失败 (index: ${index}): ${error.message}，继续执行`
            })
            failCount++
            // 失败也继续执行下一个 index
          }

          // 每次执行后等待 500ms
          if (i < indices.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
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
          message: `${tokenIndex}、${token.name || token.id}、觉醒完成 (成功：${successCount}/4, 失败：${failCount}/4)`
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

// 批量洗练减伤
const handleBatchQuench = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isBatchQuenching.value = true

    message.info(`开始批量洗练减伤（${rangeText}），共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始洗练减伤...`)
          
          // 添加开始日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '洗练减伤',
            tokenId: token.id,
            tokenName: token.name || token.id,
            status: 'info',
            message: `${tokenIndex}、${token.name || token.id}、开始洗练减伤`
          })

          let allPartsCompleted = false
          let totalQuenchCount = 0
          let maxQuenchCount = 0 // 最大洗练次数，根据白玉数量计算（白玉数量/100）
          const heroId = 107
          const completedParts = new Set() // 记录已完成的部位
          const partQuenches = {} // 存储各部位的 quenches 数据
          let whiteJadeCount = 0 // 白玉数量

          // 首先获取白玉数量，计算最大洗练次数
          try {
            const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 5000)
            const role = roleInfo?.role || roleInfo
            
            // 获取白玉数量（物品 ID 1022）- 参考身份卡片代码
            const items = role?.items
            console.log(`[序号${tokenIndex}] role?.items 是否存在:`, !!items)
            console.log(`[序号${tokenIndex}] items 类型:`, typeof items, Array.isArray(items) ? 'Array' : 'Object')
            
            if (items) {
              // 复制身份卡片的 getItemCount 函数逻辑
              const getItemCount = (items, id) => {
                if (!items) {
                  return 0
                }
                if (Array.isArray(items)) {
                  const found = items.find(i => Number(i.id ?? i.itemId) === id)
                  if (found) {
                    return Number(found.num ?? found.count ?? found.quantity ?? 0)
                  }
                  return 0
                }
                // 对象结构：{ '1011': 3 } 或 { '1011': { num:3 } }
                const node = items[String(id)] ?? items[id]
                console.log(`[序号${tokenIndex}] 物品${id} 直接访问结果:`, node)
                
                if (node == null) {
                  // 兼容值对象中含有 itemId/quantity 的结构
                  const match = Object.values(items).find(v => Number(v?.itemId ?? v?.id) === id)
                  console.log(`[序号${tokenIndex}] 物品${id} 遍历查找结果:`, match)
                  if (match) {
                    return Number(match.num ?? match.count ?? match.quantity ?? 0)
                  }
                  return 0
                }
                if (typeof node === 'number') return Number(node)
                if (typeof node === 'object') {
                  return Number(node.num ?? node.count ?? node.quantity ?? 0)
                }
                return Number(node) || 0
              }
              
              whiteJadeCount = getItemCount(items, 1022)
              console.log(`[序号${tokenIndex}] 白玉数量:`, whiteJadeCount)
              
              // 根据白玉数量计算最大洗练次数（每洗练一次消耗 100 白玉）
              maxQuenchCount = Math.floor(whiteJadeCount / 100)
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 当前白玉数量：${whiteJadeCount}，最大洗练次数：${maxQuenchCount}`)
              
              // 添加白玉数量日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '洗练减伤',
                tokenId: token.id,
                tokenName: token.name || token.id,
                status: 'info',
                message: `${tokenIndex}、${token.name || token.id}、当前白玉数量：${whiteJadeCount}，最大洗练次数：${maxQuenchCount}`
              })
            }
          } catch (error) {
            console.error(`[序号${tokenIndex}] 获取白玉数量失败:`, error)
            maxQuenchCount = 10 // 如果获取失败，使用默认值 10
          }

          // 遍历每个部位，一直洗练直到满足条件
          for (let part = 1; part <= 4; part++) {
            if (totalQuenchCount >= maxQuenchCount) {
              break
            }

            // 跳过已完成的部位
            if (completedParts.has(part)) {
              continue
            }

            const partName = PARTS.find(p => p.value === part)?.text || '未知'
            let partCompleted = false

            // 如果没有该部位的 quenches 数据，通过 role_getroleinfo 获取
            if (!partQuenches[part]) {
              try {
                const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 5000)
                const role = roleInfo?.role || roleInfo
                
                if (role && role.heroes && role.heroes[heroId] && role.heroes[heroId].equipment && role.heroes[heroId].equipment[part]) {
                  partQuenches[part] = role.heroes[heroId].equipment[part].quenches || {}
                  console.log(`[序号${tokenIndex}] ${partName}部位初始 quenches:`, partQuenches[part])
                }
              } catch (error) {
                console.error(`[序号${tokenIndex}] 获取${partName}部位装备信息失败:`, error)
              }
            }

            // 一直洗练当前部位，直到满足条件或达到最大次数
            while (!partCompleted && totalQuenchCount < maxQuenchCount) {
              try {
                // 检查是否有高属性孔位（attrNum > 50 且未锁定）
                const currentQuenches = partQuenches[part] || {}
                const highAttrSlots = Object.values(currentQuenches).filter(slot => 
                  slot.attrNum > 50 && !slot.isLocked
                )
                const hasHighAttrSlot = highAttrSlots.length > 0
                
                // 如果有高属性孔位，先发送 equipment_confirm 获取 seed
                let seedFromConfirm = 0
                if (hasHighAttrSlot) {
                  try {
                    const confirmParams = {
                      heroId: heroId,
                      part: part,
                      quenchId: 0,
                      quenches: currentQuenches
                    }
                    
                    console.log(`[序号${tokenIndex}] ${partName}部位检测到高属性孔位，正在发送 equipment_confirm...`)
                    
                    const confirmResult = await tokenStore.sendMessageWithPromise(
                      token.id,
                      'equipment_confirm',
                      confirmParams,
                      15000
                    )
                    
                    // 从确认响应中提取 seed 值
                    if (confirmResult?.seed) {
                      seedFromConfirm = confirmResult.seed
                    } else if (confirmResult?.equipment?.seed) {
                      seedFromConfirm = confirmResult.equipment.seed
                    } else if (confirmResult?.role?.heroes) {
                      const hero = confirmResult.role.heroes[String(heroId)]
                      if (hero?.equipment?.[part]?.seed) {
                        seedFromConfirm = hero.equipment[part].seed
                      }
                    }
                    
                    console.log(`[序号${tokenIndex}] ${partName}部位获取 seed:`, seedFromConfirm)
                  } catch (confirmError) {
                    console.error(`[序号${tokenIndex}] 获取 seed 失败:`, confirmError)
                  }
                }
                
                // 构建淬炼制请求参数，使用该部位的 quenches
                const quenchParams = {
                  heroId: heroId,
                  part: part,
                  quenchId: 0,
                  quenches: partQuenches[part] || {},
                  seed: seedFromConfirm,
                  skipOrange: false
                }
                
                console.log(`[序号${tokenIndex}] ${partName}部位洗练参数:`, quenchParams)

                const response = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'equipment_quench',
                  quenchParams,
                  15000
                )

                totalQuenchCount++

                if (response && (response.code === 0 || response.code === undefined)) {
                  let updatedEquipment = null
                  
                  // 从响应中获取更新后的装备信息
                  if (response.equipment) {
                    updatedEquipment = response.equipment
                  } else if (response.role && response.role.heroes && response.role.heroes[heroId] && response.role.heroes[heroId].equipment) {
                    updatedEquipment = response.role.heroes[heroId].equipment[part]
                  }

                  if (updatedEquipment) {
                    // 更新该部位的quenches数据
                    partQuenches[part] = updatedEquipment.quenches || {}
                    console.log(`[序号${tokenIndex}] ${partName}部位更新后quenches:`, partQuenches[part])
                    
                    const quenches = partQuenches[part]

                    let quenchResults = []
                    let hasRedOrOrangeDamageReduction = false
                    let redArmorPenCount = 0
                    let redAttackCount = 0

                    for (const [slot, quench] of Object.entries(quenches)) {
                      const attrName = ATTRIBUTES.find(a => a.id === quench.attrId)?.name || '未知'
                      const colorName = COLORS.find(c => c.id === quench.colorId)?.name || '未知'
                      quenchResults.push(`${slot}号位:${attrName}${quench.attrNum || 0}${colorName}`)

                      if (quench.attrId === 9 && (quench.colorId === 5 || quench.colorId === 6)) {
                        hasRedOrOrangeDamageReduction = true
                      }
                      
                      // 统计红色破甲数量（属性ID 5，颜色ID 6）
                      if (quench.attrId === 5 && quench.colorId === 6) {
                        redArmorPenCount++
                      }
                      
                      // 统计红色攻击数量（属性ID 1，颜色ID 6）
                      if (quench.attrId === 1 && quench.colorId === 6) {
                        redAttackCount++
                      }
                    }

                    if (quenchResults.length > 0) {
                      message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${partName}洗练结果: ${quenchResults.join(', ')}`)
                    }

                    if (hasRedOrOrangeDamageReduction) {
                      message.success(`[序号${tokenIndex}] ${token.name || token.id} - ${partName}部位已获得红色或橙色减伤`)
                    }
                    
                    // 判断是否完成该部位
                    const totalRedAttributes = redArmorPenCount + redAttackCount
                    const hasBothRedAttributes = redArmorPenCount >= 1 && redAttackCount >= 1
                    
                    if (hasRedOrOrangeDamageReduction || hasBothRedAttributes) {
                      // 已获得红色或橙色减伤，或者同时有红攻击和红破甲，完成该部位
                      partCompleted = true
                      completedParts.add(part)
                      if (hasRedOrOrangeDamageReduction) {
                        message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${partName}部位已获得红色或橙色减伤，完成该部位`)
                        
                        // 添加部位完成日志（获得减伤）
                        logStore.addLog({
                          page: 'fish-helper',
                          cardType: '养号',
                          operation: '洗练减伤',
                          tokenId: token.id,
                          tokenName: token.name || token.id,
                          status: 'success',
                          message: `${tokenIndex}、${token.name || token.id}、${partName}部位已获得红色或橙色减伤，完成该部位，洗练结果：${quenchResults.join(', ')}`
                        })
                      } else if (hasBothRedAttributes) {
                        message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${partName}部位已获得红攻击和红破甲，完成该部位`)
                        
                        // 添加部位完成日志（红攻击 + 红破甲）
                        logStore.addLog({
                          page: 'fish-helper',
                          cardType: '养号',
                          operation: '洗练减伤',
                          tokenId: token.id,
                          tokenName: token.name || token.id,
                          status: 'success',
                          message: `${tokenIndex}、${token.name || token.id}、${partName}部位已获得红攻击和红破甲，完成该部位，洗练结果：${quenchResults.join(', ')}`
                        })
                      }
                    } else if (totalRedAttributes === 1) {
                      // 只有 1 个红色破甲或红色攻击，完成该部位
                      partCompleted = true
                      completedParts.add(part)
                      message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${partName}部位已获得 1 个红色破甲或攻击，完成该部位`)
                      
                      // 添加部位完成日志（1 个红色）
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '洗练减伤',
                        tokenId: token.id,
                        tokenName: token.name || token.id,
                        status: 'success',
                        message: `${tokenIndex}、${token.name || token.id}、${partName}部位已获得 1 个红色破甲或攻击，完成该部位，洗练结果：${quenchResults.join(', ')}`
                      })
                    } else {
                      // totalRedAttributes === 0 或 > 1，但没有同时满足红攻击和红破甲
                      // 不完成该部位，继续洗练
                      partCompleted = false
                      message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${partName}部位未满足完成条件（红减伤：${hasRedOrOrangeDamageReduction}, 红攻击：${redAttackCount}, 红破甲：${redArmorPenCount}），继续洗练`)
                    }
                  }
                } else {
                  const errorMsg = response?.msg || response?.message || '未知错误'
                  throw new Error(errorMsg)
                }

                await new Promise(resolve => setTimeout(resolve, 500))
              } catch (error) {
                console.error(`[序号${tokenIndex}] ${partName}部位洗练失败:`, error)
                break
              }
            }
          }

          // 检查是否所有部位都已完成
          if (completedParts.size === 4) {
            allPartsCompleted = true
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 所有部位已获得目标属性`)
          }

          if (allPartsCompleted) {
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 洗练减伤完成，共洗练${totalQuenchCount}次`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '洗练减伤',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${tokenIndex}、${token.name || token.id}、洗练减伤完成，共洗练${totalQuenchCount}次`
            })
            return { success: true, tokenId: token.id, quenchCount: totalQuenchCount }
          } else {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 洗练减伤未完成，已洗练${totalQuenchCount}次`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '洗练减伤',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `${tokenIndex}、${token.name || token.id}、洗练减伤未完成，已洗练${totalQuenchCount}次`
            })
            return { success: true, tokenId: token.id, quenchCount: totalQuenchCount, completed: false }
          }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 洗练减伤失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 洗练减伤失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '洗练减伤',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${tokenIndex}、${token.name || token.id}、洗练减伤失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 3,
        delayBetweenBatches: 2000
      }
    )

    const successCount = results.filter(r => r.success).length
    const completedCount = results.filter(r => r.success && r.completed !== false).length
    const failureCount = results.filter(r => !r.success).length

    // 生成详细的洗练结果日志
    const successResults = results.filter(r => r.success && r.completed !== false)
    const incompleteResults = results.filter(r => r.success && r.completed === false)
    const failureResults = results.filter(r => !r.success)

    message.success(`批量洗练减伤完成：完成 ${completedCount} 个，未完成 ${successCount - completedCount} 个，失败 ${failureCount} 个`)
    
    // 添加总览日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '洗练减伤',
      status: 'success',
      message: `批量洗练减伤完成，完成 ${completedCount} 个，未完成 ${successCount - completedCount} 个，失败 ${failureCount} 个`
    })

    // 添加每个 Token 的详细洗练结果
    successResults.forEach(result => {
      const tokenId = result.tokenId || result.token?.id
      const token = targetTokens.find(t => t.id === tokenId) || result.token
      const tokenIndex = token ? getTokenIndex(token) : '未知'
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '洗练减伤',
        tokenId: tokenId,
        tokenName: token?.name || token?.id || tokenId,
        status: 'success',
        message: `${tokenIndex}、${token?.name || token?.id || tokenId}、洗练完成，洗练${result.quenchCount || 0}次`
      })
    })

    incompleteResults.forEach(result => {
      const tokenId = result.tokenId || result.token?.id
      const token = targetTokens.find(t => t.id === tokenId) || result.token
      const tokenIndex = token ? getTokenIndex(token) : '未知'
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '洗练减伤',
        tokenId: tokenId,
        tokenName: token?.name || token?.id || tokenId,
        status: 'warning',
        message: `${tokenIndex}、${token?.name || token?.id || tokenId}、洗练未完成，已洗练${result.quenchCount || 0}次`
      })
    })

    failureResults.forEach(result => {
      const tokenId = result.tokenId || result.token?.id
      const token = targetTokens.find(t => t.id === tokenId) || result.token
      const tokenIndex = token ? getTokenIndex(token) : '未知'
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '洗练减伤',
        tokenId: tokenId,
        tokenName: token?.name || token?.id || tokenId,
        status: 'error',
        message: `${tokenIndex}、${token?.name || token?.id || tokenId}、洗练失败：${result.error || '未知错误'}`
      })
    })

    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '洗练减伤')
    })

  } catch (error) {
    console.error('批量洗练减伤失败:', error)
    message.error(`批量洗练减伤失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '洗练减伤',
      status: 'error',
      message: `批量洗练减伤失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchQuenching.value = false
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
            const response = await tokenStore.sendSystemHangupUpgrade(token.id, {
              upgradeNum: upgradeNum
            })
            console.log('system_hangupupgrade 响应:', response)

            if (response && (response.code === 0 || response.code === undefined)) {
              remainingCount -= upgradeNum
              totalUpgradeCount += upgradeNum
              console.log('升级成功，剩余数量:', remainingCount, '总使用数量:', totalUpgradeCount)
              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升级挂机成功，使用${upgradeNum}个道具，剩余${remainingCount}个`)
            } else {
              const errorMsg = response?.msg || response?.message || '未知错误'
              console.log('升级失败:', errorMsg)
              throw new Error(errorMsg)
            }

            await new Promise(resolve => setTimeout(resolve, 500))
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
            message: `${tokenIndex}、${token.name || token.id}、升级挂机完成，共使用${totalUpgradeCount}个道具`
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
            message: `${tokenIndex}、${token.name || token.id}、升级挂机失败: ${error.message}`
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
          await new Promise(resolve => setTimeout(resolve, 300))

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 领取推图层数奖励完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '领取推图层数奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、领取推图层数奖励完成`
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
            message: `${tokenIndex}、${token.name || token.id}、领取推图层数奖励失败: ${error.message}`
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
            await new Promise(resolve => setTimeout(resolve, 500))
            retryCount++
          }

          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            throw new Error('Token连接失败')
          }
        }

        // 获取角色信息，获取万能红数量和目标英雄星级
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在获取角色信息...`)
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        if (!roleInfo || !roleInfo.role || !roleInfo.role.items) {
          throw new Error('获取角色信息失败')
        }

        const universalRedCount = roleInfo.role.items['3201']?.quantity || 0

        // 获取目标英雄星级
        let heroStar = 0
        const heroId = String(selectedUniversalRedHero.value)
        if (roleInfo.role.heroes && roleInfo.role.heroes[heroId]) {
          heroStar = roleInfo.role.heroes[heroId].star || 0
        }

        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 万能红数量: ${universalRedCount}, ${selectedHeroName}星级: ${heroStar}`)

        // 如果目标英雄30星，跳过使用万能红
        if (heroStar >= 30) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${selectedHeroName}已30星，跳过使用万能红`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '使用万能红',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、${selectedHeroName}已30星，跳过使用万能红`
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
            message: `${tokenIndex}、${token.name || token.id}、没有万能红，跳过`
          })
        } else {
          // 29星特殊处理：每次使用100万能红，然后升星，最多执行4次
          if (heroStar === 29) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 当前29星，执行100+升星循环，最多4次`)
            
            let totalUsed = 0
            let totalUpgrades = 0
            let maxCycles = 4
            
            for (let cycle = 1; cycle <= maxCycles; cycle++) {
              // 检查万能红数量
              const currentRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
              const currentUniversalRedCount = currentRoleInfo.role.items['3201']?.quantity || 0
              
              if (currentUniversalRedCount < 100) {
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 万能红不足100个，停止循环`)
                break
              }
              
              // 使用100万能红
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${cycle}次使用100万能红`)
              try {
                await tokenStore.sendItemOpenPack(token.id, {
                  index: 6,
                  itemId: 3201,
                  number: 100
                })
                totalUsed += 100
                message.success(`[序号${tokenIndex}] ${token.name || token.id} - 第${cycle}次使用100万能红成功`)
              } catch (error) {
                message.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${cycle}次使用万能红失败: ${error.message}`)
                break
              }
              
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // 执行升星
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${cycle}次升星`)
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradestar',
                  { heroId: selectedUniversalRedHero.value },
                  8000
                )
                totalUpgrades++
                message.success(`[序号${tokenIndex}] ${token.name || token.id} - 第${cycle}次升星成功`)
              } catch (error) {
                const errorMsg = error.message || String(error)
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 第${cycle}次升星失败: ${errorMsg}，继续下一次`)
              }
              
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 29星循环完成，共使用${totalUsed}万能红，升星${totalUpgrades}次`)
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '使用万能红',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${tokenIndex}、${token.name || token.id}、29星循环完成，使用${totalUsed}万能红，升星${totalUpgrades}次（原${heroStar}星）`
            })
          } else {
            // 非29星：原有逻辑
            // 计算最多可使用的万能红数量：400*(30-当前星级）
            const maxUseCount = 400 * (30 - heroStar)
            const actualUseCount = Math.min(universalRedCount, maxUseCount)

            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 最多可使用${actualUseCount}个万能红（400*(30-${heroStar})）`)

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
                  index: 6,
                  itemId: 3201,
                  number: useCount
                })

                remainingCount -= useCount
                totalUsed += useCount

                message.success(`[序号${tokenIndex}] ${token.name || token.id} - 第${batchCount}批使用万能红成功: ${useCount}个`)

                // 每批之间等待500ms
                if (remainingCount > 0) {
                  await new Promise(resolve => setTimeout(resolve, 500))
                }
              } catch (error) {
                message.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${batchCount}批使用万能红失败: ${error.message || '未知错误'}`)
                throw error
              }
            }

            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 使用万能红完成，共使用${totalUsed}个`)

            // 只有在使用了 400 个万能红（升了一星）的情况下才执行升星操作
            if (totalUsed >= 400) {
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 已使用${totalUsed}个万能红，开始执行升星操作...`)
              
              // 等待 1 秒后开始升星
              await new Promise(resolve => setTimeout(resolve, 500))

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
                  await new Promise(resolve => setTimeout(resolve, 500))
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
                message: `${tokenIndex}、${token.name || token.id}、使用万能红${totalUsed}个，升星${upgradeCount}次（原${heroStar}星）`
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
                message: `${tokenIndex}、${token.name || token.id}、使用万能红${totalUsed}个（未满 400，不升星，原${heroStar}星）`
              })
            }
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
          message: `${tokenIndex}、${token.name || token.id}、使用万能红失败: ${error.message || '未知错误'}`
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
        await new Promise(resolve => setTimeout(resolve, 500))
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

// 批量升星吕布（只升星，不使用万能红）
const handleUpgradeLuBuStar = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的 Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`

  try {
    isUpgradingLuBuStar.value = true

    message.info(`开始批量升星吕布（${rangeText}），共${targetTokens.length}个 Token...`)

    // 逐个处理 Token
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始升星吕布...`)

      try {
        // 连接 Token
        const status = tokenStore.getWebSocketStatus(token.id)
        if (status !== 'connected') {
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在连接 Token`)
          await tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
          let retryCount = 0
          while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 30) {
            await new Promise(resolve => setTimeout(resolve, 500))
            retryCount++
          }

          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            throw new Error('Token 连接失败')
          }
        }

        // 获取角色信息，获取吕布星级
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 正在获取角色信息...`)
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        if (!roleInfo || !roleInfo.role || !roleInfo.role.heroes) {
          throw new Error('获取角色信息失败')
        }

        // 获取吕布星级
        let luBuStar = 0
        if (roleInfo.role.heroes['107']) {
          luBuStar = roleInfo.role.heroes['107'].star || 0
        }

        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 吕布星级：${luBuStar}`)

        // 等待 1 秒后开始升星
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 等待 1 秒后开始升星吕布...`)
        await new Promise(resolve => setTimeout(resolve, 500))

        // 如果吕布 30 星，跳过
        if (luBuStar >= 30) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 吕布已 30 星，跳过`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升星吕布',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、吕布已 30 星，跳过`
          })
        } else {
          // 开始升星吕布，最多 10 次
          let luBuUpgradeCount = 0
          for (let upgradeAttempt = 1; upgradeAttempt <= 10; upgradeAttempt++) {
            try {
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${upgradeAttempt}次升星吕布...`)
              
              await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_heroupgradestar',
                { heroId: 107 },
                8000
              )

              luBuUpgradeCount++
              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 第${upgradeAttempt}次升星吕布成功`)

              // 升星后等待 1 秒
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              const errorMsg = error.message || String(error)
              // 检查是否是物品数量不足的错误
              if (errorMsg.includes('物品数量不足') || errorMsg.includes('400010')) {
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 万能红碎片不足，停止升星`)
                break
              }
              // 其他错误也停止
              message.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${upgradeAttempt}次升星吕布失败：${errorMsg}`)
              break
            }
          }

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升星吕布完成，共升星${luBuUpgradeCount}次`)

          // 添加操作日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升星吕布',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、升星吕布完成，共升星${luBuUpgradeCount}次（原${luBuStar}星）`
          })
        }

      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} - 升星吕布失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id} - 升星吕布失败：${error.message || '未知错误'}`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升星吕布',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `${tokenIndex}、${token.name || token.id}、升星吕布失败：${error.message || '未知错误'}`
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
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    message.success(`批量升星吕布完成，共处理${targetTokens.length}个 Token`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升星吕布',
      status: 'success',
      message: `批量升星吕布完成，共处理${targetTokens.length}个 Token`
    })

  } catch (error) {
    console.error('批量升星吕布失败:', error)
    message.error(`批量升星吕布失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升星吕布',
      status: 'error',
      message: `批量升星吕布失败：${error.message || '未知错误'}`
    })
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
                await new Promise(resolve => setTimeout(resolve, 500))
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
              message: `${tokenIndex}、${token.name || token.id}、全部英雄合成完成`
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
            message: `${tokenIndex}、${token.name || token.id}、英雄合成成功`
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
            message: `${globalIndex + 1}、${token.name || token.id}、英雄合成失败：${error.message || error}`
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

// 批量上阵吕布
const handleBatchHeroBattle = async () => {
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
  message.info(`开始批量上阵吕布（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量上阵吕布',
    status: 'info',
    message: `开始批量上阵吕布（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroBattle.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵吕布...`)
          
          await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 107, slot: 0 })
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵吕布成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵吕布',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、上阵吕布成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵吕布失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵吕布失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵吕布',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、${token.name || token.id}、上阵吕布失败：${error.message || error}`
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
    
    message.success(`批量上阵吕布完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵吕布',
      status: 'success',
      message: `批量上阵吕布完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量上阵吕布出错:', error)
    message.error(`批量上阵吕布出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵吕布',
      status: 'error',
      message: `批量上阵吕布出错：${error.message || error}`
    })
  } finally {
    isBatchHeroBattle.value = false
  }
}

// 批量上阵张飞
const handleBatchHeroZhangFei = async () => {
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
  message.info(`开始批量上阵张飞（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量上阵张飞',
    status: 'info',
    message: `开始批量上阵张飞（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroZhangFei.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵张飞...`)
          
          await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 204, slot: 1 })
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵张飞成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵张飞',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、上阵张飞成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵张飞失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 上阵张飞失败：${error.message || error}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵张飞',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、${token.name || token.id}、上阵张飞失败：${error.message || error}`
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
    
    message.success(`批量上阵张飞完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵张飞',
      status: 'success',
      message: `批量上阵张飞完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量上阵张飞出错:', error)
    message.error(`批量上阵张飞出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量上阵张飞',
      status: 'error',
      message: `批量上阵张飞出错：${error.message || error}`
    })
  } finally {
    isBatchHeroZhangFei.value = false
  }
}

// 批量上阵推图
const handleBatchStoryTeam = async () => {
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
  
  isBatchStoryTeam.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在上阵推图武将...`)
          
          // 黄月英(110)位置2，太史慈(106)位置3，魏延(217)位置4
          await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 110, slot: 2 })
          await new Promise(resolve => setTimeout(resolve, 600))
          
          await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 106, slot: 3 })
          await new Promise(resolve => setTimeout(resolve, 600))
          
          await tokenStore.sendHeroGoIntoBattle(token.id, { heroId: 217, slot: 4 })
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵推图武将成功`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量上阵推图',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、上阵推图武将成功`
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
            message: `${globalIndex + 1}、${token.name || token.id}、上阵推图武将失败：${error.message || error}`
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
    isBatchStoryTeam.value = false
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
              await new Promise(resolve => setTimeout(resolve, 500))
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
            message: `${tokenIndex}、${token.name || token.id}、五一万能兑换成功`
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
            message: `${globalIndex + 1}、${token.name || token.id}、五一万能兑换失败：${error.message || error}`
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
            await new Promise(resolve => setTimeout(resolve, 500))
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
            await new Promise(resolve => setTimeout(resolve, 500))
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
            await new Promise(resolve => setTimeout(resolve, 500))
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
          message: `${tokenIndex}、${token.name || token.id}、购买升级赤羽完成`
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
          message: `${tokenIndex}、${token.name || token.id}、购买升级赤羽失败：${error.message || '未知错误'}`
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
        await new Promise(resolve => setTimeout(resolve, 500))
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

// 一键招募周
const handleOneClickRecruitWeek = async () => {
  try {
    isRecruitWeekRunning.value = true
    
    // TODO: 实现一键招募周功能
    message.info('一键招募周功能开发中...')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键招募周',
      status: 'info',
      message: '功能开发中，敬请期待'
    })
  } catch (error) {
    console.error('一键招募周失败:', error)
    message.error(`一键招募周失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键招募周',
      status: 'error',
      message: `一键招募周失败: ${error.message || '未知错误'}`
    })
  } finally {
    isRecruitWeekRunning.value = false
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
        tokenStore.selectToken(token.id, true)

        let retryCount = 0
        const maxRetries = 5
        let status = tokenStore.getWebSocketStatus(token.id)

        while (status !== 'connected' && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500))
          status = tokenStore.getWebSocketStatus(token.id)
          retryCount++

          if (status !== 'connected' && retryCount < maxRetries) {
            message.info(`[序号${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
            tokenStore.selectToken(token.id, true)
          }
        }

        if (status !== 'connected') {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          failCount++
          failedTokens.push(token.name || token.id)
          continue
        }

        const result = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {})

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
            const activityResult = await tokenStore.sendActivityGet(token.id)
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
        } else {
          failCount++
          failedTokens.push(token.name || token.id)
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取数据失败`)
        }

        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] 获取Token ${token.name || token.id} 详情失败:`, error)
        failCount++
        failedTokens.push(token.name || token.id)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 获取失败`)
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
        await new Promise(resolve => setTimeout(resolve, 500))
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
    // 计算宝箱总分Z
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
    
    message.info(`${token.name} - 宝箱总分: ${Z}, 基准宝箱分: ${J}, 已用宝箱分: ${Y}, 开箱轮数: ${l}`)
    
    // 3. 开宝箱阶段
    let roundCount = 0
    let shouldBreak = false
    while (true) {
      roundCount++
      message.info(`${token.name} - 执行第 ${roundCount} 轮开宝箱`)
      
      // 初始化开箱次数
      let MK = 0 // 木质开箱次数
      let QK = 0 // 青铜开箱次数
      let HK = 0 // 黄金开箱次数
      let BK = 0 // 铂金开箱次数
      
      // 铂金宝箱，每次10个（开箱顺序：铂金、黄金、青铜、木质）
      const platinumTimes = Math.floor(B / 10)
      for (let i = 0; i < platinumTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2004, count: 10 })
        B -= 10
        BK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开铂金宝箱: ${BK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num,
                calculatedYY: YY,
                MK: MK,
                QK: QK,
                HK: HK,
                BK: BK,
                remainingM: remainingM,
                remainingQ: remainingQ,
                remainingH: remainingH,
                remainingB: remainingB
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              shouldBreak = true
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              shouldBreak = true
              break
            }
          }
        }
      }
      
      if (shouldBreak) break
      
      // 黄金宝箱，每次10个
      const goldTimes = Math.floor(H / 10)
      for (let i = 0; i < goldTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2003, count: 10 })
        H -= 10
        HK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开黄金宝箱: ${HK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num,
                calculatedYY: YY,
                MK: MK,
                QK: QK,
                HK: HK,
                BK: BK,
                remainingM: remainingM,
                remainingQ: remainingQ,
                remainingH: remainingH,
                remainingB: remainingB
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              shouldBreak = true
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              shouldBreak = true
              break
            }
          }
        }
      }
      
      if (shouldBreak) break
      
      // 青铜宝箱，每次10个
      const bronzeTimes = Math.floor(Q / 10)
      for (let i = 0; i < bronzeTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2002, count: 10 })
        Q -= 10
        QK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开青铜宝箱: ${QK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num,
                calculatedYY: YY,
                MK: MK,
                QK: QK,
                HK: HK,
                BK: BK,
                remainingM: remainingM,
                remainingQ: remainingQ,
                remainingH: remainingH,
                remainingB: remainingB
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              break
            }
          }
        }
      }
      
      if (shouldBreak) break
      
      // 木质宝箱，每次100个
      const woodTimes = Math.floor(M / 100)
      for (let i = 0; i < woodTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2001, count: 100 })
        M -= 100
        MK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 100
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 100 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开木质宝箱: ${MK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num,
                calculatedYY: YY,
                MK: MK,
                QK: QK,
                HK: HK,
                BK: BK,
                remainingM: remainingM,
                remainingQ: remainingQ,
                remainingH: remainingH,
                remainingB: remainingB
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              break
            }
          }
        }
      }
      
      // 4. 领取奖励阶段（开宝箱阶段内）
      // 开宝箱阶段内领取宝箱奖励
      message.info(`${token.name} - 开宝箱阶段内领取宝箱奖励`)
      await tokenStore.sendBatchClaimBoxPointReward(token.id)
      message.info(`${token.name} - 开宝箱阶段内领取宝箱奖励成功`)
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '开宝箱阶段领取宝箱奖励',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `${token.name} - 开宝箱阶段内领取宝箱奖励成功`,
        command: 'item_batchclaimboxpointreward'
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 开宝箱阶段内领取邮件
      message.info(`${token.name} - 开宝箱阶段内领取邮件`)
      await tokenStore.sendMailClaimAllAttachment(token.id, { category: 0 })
      message.info(`${token.name} - 开宝箱阶段内领取邮件成功`)
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '开宝箱阶段领取邮件',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `${token.name} - 开宝箱阶段内领取邮件成功`,
        command: 'mail_claimallattachment',
        commandParams: { category: 0 }
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 领取邮件后，重新获取宝箱数量
      message.info(`${token.name} - 开宝箱阶段内重新获取宝箱数量`)
      const boxRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (boxRoleInfo && boxRoleInfo.role && boxRoleInfo.role.items) {
        const boxItems = boxRoleInfo.role.items
        M = boxItems['2001']?.quantity || 0
        Q = boxItems['2002']?.quantity || 0
        H = boxItems['2003']?.quantity || 0
        B = boxItems['2004']?.quantity || 0
        message.info(`${token.name} - 开宝箱阶段内重新获取宝箱数量成功：木质${M}，青铜${Q}，黄金${H}，铂金${B}`)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开宝箱阶段重新获取宝箱数量',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${token.name} - 开宝箱阶段内重新获取宝箱数量：木质${M}，青铜${Q}，黄金${H}，铂金${B}`
        })
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 5. 检查阶段
      const activityInfoCheck = await tokenStore.sendActivityGet(token.id)
      if (activityInfoCheck && activityInfoCheck.activity && activityInfoCheck.activity.myTotalInfo && activityInfoCheck.activity.myTotalInfo['2']) {
        const info = activityInfoCheck.activity.myTotalInfo['2']
        const rounds = info.rounds || 1
        const num = info.num || 0
        Y = (rounds - 1) * 8000 + num
        
        const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
        message.info(scoreLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '分数获取',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: scoreLog,
          details: {
            Y: Y,
            rounds: rounds,
            num: num
          }
        })
        
        if (Y > l * 8000) {
          message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
          // 添加跳出循环日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '跳出循环',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
          })
          break
        }
        // 额外检查：如果已用宝箱分已经很高，及时停止
        if (Y > 8000 * 4) {
          message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
          // 添加跳出循环日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '跳出循环',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
          })
          break
        }
      }
      
      // 检查阶段重置MK/QK/HK/BK为0
      MK = 0
      QK = 0
      HK = 0
      BK = 0
      
      // 重新获取宝箱数量
      const newRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (newRoleInfo && newRoleInfo.role && newRoleInfo.role.items) {
        const newItems = newRoleInfo.role.items
        M = newItems['2001']?.quantity || 0
        Q = newItems['2002']?.quantity || 0
        H = newItems['2003']?.quantity || 0
        B = newItems['2004']?.quantity || 0
      }
      
      // 判断是否继续下一轮开箱：基于YY计算值
      const currentYY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
      if (currentYY >= l * 8000) {
        message.info(`${token.name} - 已用宝箱分YY ${currentYY} 达到目标 ${l * 8000}，进入最终阶段`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '跳出循环',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${token.name} - 已用宝箱分YY ${currentYY} 达到目标 ${l * 8000}`
        })
        break
      }
    }
    
    // 6. 最终阶段
    // 领取邮件
    await tokenStore.sendMessageWithPromise(token.id, 'mail_claimallattachment', { category: 0 })
    await new Promise(resolve => setTimeout(resolve, 500))
    
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
          message: `${token.name} - 第 ${i + 1} 次领取宝箱周奖励成功`,
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
          message: `${token.name} - 第 ${i + 1} 次领取宝箱周奖励失败: ${error.message || '未知错误'}`,
          command: 'activity_claimweekactreward'
        })
        // 继续执行下一次领取，不停止
      }
      await new Promise(resolve => setTimeout(resolve, 500))
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
      message: `${token.name} - 一键宝箱周完成，执行了 ${boxWeekRounds} 轮开箱`,
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
      message: `${token.name} - 执行开箱的token: ${token.name}，执行宝箱周轮次: ${boxWeekRounds}，成功领取宝箱周奖励次数: ${successfulClaimCount}`,
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
      message: `${token.name} - 一键宝箱周失败: ${error.message || '未知错误'}`
    })
  } finally {
    // 断开Token连接
    message.info(`${token.name} - 正在断开连接`)
    tokenStore.closeWebSocketConnection(token.id)
  }
  
  return { boxWeekRounds, successfulClaimCount }
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
      const token = targetTokens[i]
      message.info(`处理第 ${i + 1}/${targetTokens.length} 个Token: ${token.name}`)
      
      await executeBoxWeekForToken(token)
      
      // 处理完一个 Token 后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待 1 秒后处理下一个 Token...`)
        await new Promise(resolve => setTimeout(resolve, 500))
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
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  
  try {
    isBatchRecruitWeekRunning.value = true
    
    message.info(`开始批量招募周（${rangeText}），共${targetTokens.length}个Token...`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量招募周',
      status: 'info',
      message: `功能开发中，敬请期待（${rangeText}，共${targetTokens.length}个Token）`
    })
    
    message.info('批量招募周功能开发中...')
    
  } catch (error) {
    console.error('批量招募周失败:', error)
    message.error(`批量招募周失败: ${error.message || '未知错误'}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量招募周',
      status: 'error',
      message: `批量招募周失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchRecruitWeekRunning.value = false
  }
}

// 批量设置推图阵容
const handleBatchSetStoryTeam = async () => {
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
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量设置推图阵容（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量设置推图阵容',
    status: 'info',
    message: `开始批量设置推图阵容，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchSettingStoryTeam.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在设置推图阵容...`)
          
          // 1. 使用fight_startlevel获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 2. 检查0-4位置是否有缺失的英雄，如果有则使用未上阵英雄填充
          let battleTeam = null
          if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            battleTeam = fightResult.body.battleData.leftTeam.team
          } else if (fightResult && fightResult._raw && fightResult._raw.body && fightResult._raw.body.battleData && fightResult._raw.body.battleData.leftTeam && fightResult._raw.body.battleData.leftTeam.team) {
            battleTeam = fightResult._raw.body.battleData.leftTeam.team
          } else if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            battleTeam = fightResult.battleData.leftTeam.team
          }
          
          // 记录当前阵容信息
          const currentTeamInfo = []
          for (let i = 0; i < 5; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (hero && hero.id) {
              currentTeamInfo.push(`位置${i}: ${getHeroName(hero.id)}, level=${hero.level || '未知'}`)
            } else {
              currentTeamInfo.push(`位置${i}: 无英雄`)
            }
          }
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置推图阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `获取当前阵容成功，当前阵容: ${currentTeamInfo.join(', ')}`
          })
          
          // 获取所有英雄信息（包括未上阵的）
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 过滤出未上阵的英雄
          const 上阵英雄Ids = new Set()
          for (let i = 0; i < 5; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (hero && hero.id) {
              上阵英雄Ids.add(hero.id)
            }
          }
          
          // 直接从101到120中选择未上阵的英雄id
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置推图阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `从101到120中选择未上阵的英雄id`
          })
          
          // 从101到120中生成未上阵的英雄id
          const 未上阵英雄 = []
          for (let heroId = 101; heroId <= 120; heroId++) {
            if (!上阵英雄Ids.has(heroId)) {
              未上阵英雄.push({ id: heroId })
            }
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置推图阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `生成候选英雄数量: ${未上阵英雄.length}`
          })
          
          // 填充缺失的位置
          let currentIndex = 0
          for (let i = 0; i < 5; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (!hero || !hero.id) {
              // 位置i缺少英雄，使用未上阵英雄填充
              if (未上阵英雄.length > currentIndex) {
                const fillHero = 未上阵英雄[currentIndex]
                if (fillHero && fillHero.id) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_gointobattle',
                      {
                        heroId: fillHero.id,
                        slot: i
                      },
                      5000
                    )
                    await new Promise(resolve => setTimeout(resolve, 500))
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量设置推图阵容',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `填充位置${i}英雄成功: ${getHeroName(fillHero.id)}`
                    })
                    currentIndex++
                  } catch (error) {
                    // 处理hero_gointobattle服务器错误200020，不停止执行任务
                    if (error.message.includes('200020')) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量设置推图阵容',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'warning',
                        message: `填充位置${i}英雄时遇到服务器错误200020，继续执行任务: ${getHeroName(fillHero.id)}`
                      })
                    } else {
                      throw error
                    }
                  }
                }
              }
            }
          }
          
          // 重新获取阵容信息
          const updatedFightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 3. 获取最高等级英雄heroid为A
          let highestLevelHero = null
          let highestLevel = 0
          
          // 尝试从不同的结构中获取阵容数据
          let teamData = null
          if (updatedFightResult && updatedFightResult.body && updatedFightResult.body.battleData && updatedFightResult.body.battleData.leftTeam && updatedFightResult.body.battleData.leftTeam.team) {
            teamData = updatedFightResult.body.battleData.leftTeam.team
          } else if (updatedFightResult && updatedFightResult._raw && updatedFightResult._raw.body && updatedFightResult._raw.body.battleData && updatedFightResult._raw.body.battleData.leftTeam && updatedFightResult._raw.body.battleData.leftTeam.team) {
            teamData = updatedFightResult._raw.body.battleData.leftTeam.team
          } else if (updatedFightResult && updatedFightResult.battleData && updatedFightResult.battleData.leftTeam && updatedFightResult.battleData.leftTeam.team) {
            teamData = updatedFightResult.battleData.leftTeam.team
          }
          
          if (teamData) {
            // 遍历teamData中的所有英雄，找到最高等级的
            for (const key in teamData) {
              if (teamData.hasOwnProperty(key)) {
                const hero = teamData[key]
                if (hero && hero.id && hero.level > highestLevel) {
                  highestLevel = hero.level
                  highestLevelHero = hero.id
                }
              }
            }
          }
          
          if (!highestLevelHero) {
            throw new Error('无法获取最高等级英雄')
          }
          
          // 检查1号位是否已经是最高等级英雄
          const slot0Hero = teamData?.['0'] || teamData?.[0]
          if (slot0Hero && slot0Hero.id === highestLevelHero) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量设置推图阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `1号位已经是最高等级英雄${getHeroName(highestLevelHero)}，跳过设置`
            })
          } else {
            // 3. 执行hero_gointobattle，参数heroId使用最高等级英雄heroid即A, 参数slot: 0
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_gointobattle',
                {
                  heroId: highestLevelHero,
                  slot: 0
                },
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量设置推图阵容',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `设置最高等级英雄到1号位: ${getHeroName(highestLevelHero)}`
              })
            } catch (error) {
              // 处理hero_gointobattle服务器错误200020，不停止执行任务
              if (error.message.includes('200020')) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量设置推图阵容',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `设置最高等级英雄到1号位时遇到服务器错误200020，继续执行任务: ${getHeroName(highestLevelHero)}`
                })
              } else {
                throw error
              }
            }
          }
          
          // 4. 再次使用fight_startlevel获取当前阵容
          const finalFightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置推图阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: '再次获取当前阵容成功'
          })
          
          // 5. 0-4heroid,逐个执行hero_exchange命令，更换阵容为吕布、太史慈、黄月英、张飞、魏延
          const targetHeroes = [107, 106, 110, 204, 217] // 吕布、太史慈、黄月英、张飞、魏延
          
          // 尝试从不同的结构中获取阵容数据
          let finalTeamData = null
          if (finalFightResult && finalFightResult.body && finalFightResult.body.battleData && finalFightResult.body.battleData.leftTeam && finalFightResult.body.battleData.leftTeam.team) {
            finalTeamData = finalFightResult.body.battleData.leftTeam.team
          } else if (finalFightResult && finalFightResult._raw && finalFightResult._raw.body && finalFightResult._raw.body.battleData && finalFightResult._raw.body.battleData.leftTeam && finalFightResult._raw.body.battleData.leftTeam.team) {
            finalTeamData = finalFightResult._raw.body.battleData.leftTeam.team
          } else if (finalFightResult && finalFightResult.battleData && finalFightResult.battleData.leftTeam && finalFightResult.battleData.leftTeam.team) {
            finalTeamData = finalFightResult.battleData.leftTeam.team
          }
          
          if (finalTeamData) {
            // 记录当前阵容信息
            const currentTeamInfo = []
            for (let i = 0; i < 5; i++) {
              const hero = finalTeamData?.[String(i)] || finalTeamData?.[i]
              if (hero && hero.id) {
                currentTeamInfo.push(`位置${i}: heroId=${hero.id}, level=${hero.level || '未知'}`)
              } else {
                currentTeamInfo.push(`位置${i}: 无英雄`)
              }
            }
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量设置推图阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `当前阵容: ${currentTeamInfo.join(', ')}`
            })
            
            // 遍历finalTeamData中的所有英雄
            for (const key in finalTeamData) {
              if (finalTeamData.hasOwnProperty(key)) {
                const currentHero = finalTeamData[key]
                if (currentHero && currentHero.id) {
                  const index = parseInt(key)
                  if (index >= 0 && index < 5) {
                    // 如果目标英雄和当前英雄id一样，跳过执行
                    if (currentHero.id === targetHeroes[index]) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量设置推图阵容',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'info',
                        message: `位置${index}英雄已经是${getHeroName(currentHero.id)}，跳过更换`
                      })
                      continue
                    }
                    
                    // 从gameCommands.js获取hero_exchange的正确参数：heroId和targetHeroId
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量设置推图阵容',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `执行hero_exchange命令: ${getHeroName(currentHero.id)} → ${getHeroName(targetHeroes[index])}`
                    })
                    try {
                      await tokenStore.sendMessageWithPromise(
                        token.id,
                        'hero_exchange',
                        {
                          heroId: currentHero.id,
                          targetHeroId: targetHeroes[index]
                        },
                        5000
                      )
                      await new Promise(resolve => setTimeout(resolve, 500))
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量设置推图阵容',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'info',
                        message: `更换位置${index}英雄成功: ${getHeroName(currentHero.id)} → ${getHeroName(targetHeroes[index])}`
                      })
                      
                      // 执行fight_startlevel获取更新后的阵容
                      const updatedResult = await tokenStore.sendFightStartLevel(token.id, {})
                      await new Promise(resolve => setTimeout(resolve, 500))
                      
                      // 更新finalTeamData
                      if (updatedResult && updatedResult.body && updatedResult.body.battleData && updatedResult.body.battleData.leftTeam && updatedResult.body.battleData.leftTeam.team) {
                        finalTeamData = updatedResult.body.battleData.leftTeam.team
                      } else if (updatedResult && updatedResult._raw && updatedResult._raw.body && updatedResult._raw.body.battleData && updatedResult._raw.body.battleData.leftTeam && updatedResult._raw.body.battleData.leftTeam.team) {
                        finalTeamData = updatedResult._raw.body.battleData.leftTeam.team
                      } else if (updatedResult && updatedResult.battleData && updatedResult.battleData.leftTeam && updatedResult.battleData.leftTeam.team) {
                        finalTeamData = updatedResult.battleData.leftTeam.team
                      }
                      
                      // 记录更新后的阵容信息
                      if (finalTeamData) {
                        const updatedTeamInfo = []
                        for (let i = 0; i < 5; i++) {
                          const hero = finalTeamData?.[String(i)] || finalTeamData?.[i]
                          if (hero && hero.id) {
                            updatedTeamInfo.push(`位置${i}: ${getHeroName(hero.id)}`)
                          } else {
                            updatedTeamInfo.push(`位置${i}: 无英雄`)
                          }
                        }
                        logStore.addLog({
                          page: 'fish-helper',
                          cardType: '养号',
                          operation: '批量设置推图阵容',
                          tokenId: token.id,
                          tokenName: token.name,
                          status: 'info',
                          message: `更新后阵容: ${updatedTeamInfo.join(', ')}`
                        })
                      }
                    } catch (error) {
                      // 处理hero_exchange服务器错误200020，不停止执行任务
                      if (error.message.includes('200020')) {
                        logStore.addLog({
                          page: 'fish-helper',
                          cardType: '养号',
                          operation: '批量设置推图阵容',
                          tokenId: token.id,
                          tokenName: token.name,
                          status: 'warning',
                          message: `更换位置${index}英雄时遇到服务器错误200020，继续执行任务: ${getHeroName(currentHero.id)} → ${getHeroName(targetHeroes[index])}`
                        })
                      } else {
                        throw error
                      }
                    }
                  }
                }
              }
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 推图阵容设置完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置推图阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '推图阵容设置完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 推图阵容设置失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 推图阵容设置失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置推图阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `推图阵容设置失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量设置推图阵容完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量设置推图阵容',
      status: 'success',
      message: `批量设置推图阵容完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量设置推图阵容')
    })
  } catch (error) {
    console.error('批量设置推图阵容失败:', error)
    message.error(`批量设置推图阵容失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量设置推图阵容',
      status: 'error',
      message: `批量设置推图阵容失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchSettingStoryTeam.value = false
  }
}

// 批量设置爬塔阵容
const handleBatchSetTowerTeam = async () => {
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
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量设置爬塔阵容（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量设置爬塔阵容',
    status: 'info',
    message: `开始批量设置爬塔阵容，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchSettingTowerTeam.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在设置爬塔阵容...`)
          
          // 1. 使用fight_startlevel获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 2. 检查0-4位置是否有缺失的英雄，如果有则使用未上阵英雄填充
          let battleTeam = null
          if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            battleTeam = fightResult.body.battleData.leftTeam.team
          } else if (fightResult && fightResult._raw && fightResult._raw.body && fightResult._raw.body.battleData && fightResult._raw.body.battleData.leftTeam && fightResult._raw.body.battleData.leftTeam.team) {
            battleTeam = fightResult._raw.body.battleData.leftTeam.team
          } else if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            battleTeam = fightResult.battleData.leftTeam.team
          }
          
          // 记录当前阵容信息
          const currentTeamInfo = []
          for (let i = 0; i < 5; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (hero && hero.id) {
              currentTeamInfo.push(`位置${i}: ${getHeroName(hero.id)}, level=${hero.level || '未知'}`)
            } else {
              currentTeamInfo.push(`位置${i}: 无英雄`)
            }
          }
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `获取当前阵容成功，当前阵容: ${currentTeamInfo.join(', ')}`
          })
          
          // 获取所有英雄信息（包括未上阵的）
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 过滤出未上阵的英雄
          const 上阵英雄Ids = new Set()
          for (let i = 0; i < 5; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (hero && hero.id) {
              上阵英雄Ids.add(hero.id)
            }
          }
          
          // 直接从101到120中选择未上阵的英雄id
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `从101到120中选择未上阵的英雄id`
          })
          
          // 从101到120中生成未上阵的英雄id
          const 未上阵英雄 = []
          for (let heroId = 101; heroId <= 120; heroId++) {
            if (!上阵英雄Ids.has(heroId)) {
              未上阵英雄.push({ id: heroId })
            }
          }
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `生成候选英雄数量: ${未上阵英雄.length}`
          })
          
          // 填充缺失的位置
          let currentIndex = 0
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `开始填充缺失位置，未上阵英雄数量: ${未上阵英雄.length}`
          })
          for (let i = 0; i < 5; i++) {
            const hero = battleTeam?.[String(i)] || battleTeam?.[i]
            if (!hero || !hero.id) {
              // 位置i缺少英雄，使用未上阵英雄填充
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量设置爬塔阵容',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `位置${i}缺少英雄，未上阵英雄数量: ${未上阵英雄.length}，currentIndex: ${currentIndex}`
              })
              if (未上阵英雄.length > currentIndex) {
                const fillHero = 未上阵英雄[currentIndex]
                if (fillHero && fillHero.id) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_gointobattle',
                      {
                        heroId: fillHero.id,
                        slot: i
                      },
                      5000
                    )
                    await new Promise(resolve => setTimeout(resolve, 500))
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量设置爬塔阵容',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `填充位置${i}英雄成功: ${getHeroName(fillHero.id)}`
                    })
                    currentIndex++
                  } catch (error) {
                    // 处理hero_gointobattle服务器错误200020，不停止执行任务
                    if (error.message.includes('200020')) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量设置爬塔阵容',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'warning',
                        message: `填充位置${i}英雄时遇到服务器错误200020，继续执行任务: ${getHeroName(fillHero.id)}`
                      })
                    } else {
                      throw error
                    }
                  }
                }
              }
            }
          }
          
          // 重新获取阵容信息
          const updatedFightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 尝试从不同的结构中获取阵容数据
          let teamData = null
          if (updatedFightResult && updatedFightResult.body && updatedFightResult.body.battleData && updatedFightResult.body.battleData.leftTeam && updatedFightResult.body.battleData.leftTeam.team) {
            teamData = updatedFightResult.body.battleData.leftTeam.team
          } else if (updatedFightResult && updatedFightResult._raw && updatedFightResult._raw.body && updatedFightResult._raw.body.battleData && updatedFightResult._raw.body.battleData.leftTeam && updatedFightResult._raw.body.battleData.leftTeam.team) {
            teamData = updatedFightResult._raw.body.battleData.leftTeam.team
          } else if (updatedFightResult && updatedFightResult.battleData && updatedFightResult.battleData.leftTeam && updatedFightResult.battleData.leftTeam.team) {
            teamData = updatedFightResult.battleData.leftTeam.team
          }
          
          // 记录重新获取的阵容信息
          const updatedTeamInfo = []
          for (let i = 0; i < 5; i++) {
            const hero = teamData?.[String(i)] || teamData?.[i]
            if (hero && hero.id) {
              updatedTeamInfo.push(`位置${i}: ${getHeroName(hero.id)}, level=${hero.level || '未知'}`)
            } else {
              updatedTeamInfo.push(`位置${i}: 无英雄`)
            }
          }
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `重新获取阵容信息成功，当前阵容: ${updatedTeamInfo.join(', ')}`
          })
          
          // 3. 获取最高等级英雄heroid为A
          let highestLevelHero = null
          let highestLevel = 0
          
          if (teamData) {
            // 遍历teamData中的所有英雄，找到最高等级的
            for (const key in teamData) {
              if (teamData.hasOwnProperty(key)) {
                const hero = teamData[key]
                if (hero && hero.id && hero.level > highestLevel) {
                  highestLevel = hero.level
                  highestLevelHero = hero.id
                }
              }
            }
          }
          
          if (highestLevelHero) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量设置爬塔阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `找到最高等级英雄: ${getHeroName(highestLevelHero)}, level=${highestLevel}`
            })
          }
          
          if (!highestLevelHero) {
            throw new Error('无法获取最高等级英雄')
          }
          
          // 检查3号位是否已经是最高等级英雄
          const slot2Hero = teamData?.['2'] || teamData?.[2]
          if (slot2Hero && slot2Hero.id === highestLevelHero) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量设置爬塔阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `3号位已经是最高等级英雄${getHeroName(highestLevelHero)}，跳过设置`
            })
          } else {
            // 3. 执行hero_gointobattle，参数heroId使用最高等级英雄heroid即A, 参数slot: 2
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_gointobattle',
                {
                  heroId: highestLevelHero,
                  slot: 2
                },
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量设置爬塔阵容',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `设置最高等级英雄到3号位: ${getHeroName(highestLevelHero)}`
              })
            } catch (error) {
              // 处理hero_gointobattle服务器错误200020，不停止执行任务
              if (error.message.includes('200020')) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量设置爬塔阵容',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `设置最高等级英雄到3号位时遇到服务器错误200020，继续执行任务: ${getHeroName(highestLevelHero)}`
                })
              } else {
                throw error
              }
            }
          }
          
          // 4. 再次使用fight_startlevel获取当前阵容
          const finalFightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: '再次获取当前阵容成功'
          })
          
          // 5. 0-4heroid,逐个执行hero_exchange命令，更换阵容为公孙瓒、郭嘉、吕布、诸葛、贾诩
          const targetHeroes = [116, 102, 107, 104, 112] // 公孙瓒、郭嘉、吕布、诸葛、贾诩
          
          // 尝试从不同的结构中获取阵容数据
          let finalTeamData = null
          if (finalFightResult && finalFightResult.body && finalFightResult.body.battleData && finalFightResult.body.battleData.leftTeam && finalFightResult.body.battleData.leftTeam.team) {
            finalTeamData = finalFightResult.body.battleData.leftTeam.team
          } else if (finalFightResult && finalFightResult._raw && finalFightResult._raw.body && finalFightResult._raw.body.battleData && finalFightResult._raw.body.battleData.leftTeam && finalFightResult._raw.body.battleData.leftTeam.team) {
            finalTeamData = finalFightResult._raw.body.battleData.leftTeam.team
          } else if (finalFightResult && finalFightResult.battleData && finalFightResult.battleData.leftTeam && finalFightResult.battleData.leftTeam.team) {
            finalTeamData = finalFightResult.battleData.leftTeam.team
          }
          
          if (finalTeamData) {
            // 记录当前阵容信息
            const currentTeamInfo = []
            for (let i = 0; i < 5; i++) {
              const hero = finalTeamData?.[String(i)] || finalTeamData?.[i]
              if (hero && hero.id) {
                currentTeamInfo.push(`位置${i}: heroId=${hero.id}, level=${hero.level || '未知'}`)
              } else {
                currentTeamInfo.push(`位置${i}: 无英雄`)
              }
            }
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量设置爬塔阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `当前阵容: ${currentTeamInfo.join(', ')}`
            })
            
            // 遍历finalTeamData中的所有英雄
            for (const key in finalTeamData) {
              if (finalTeamData.hasOwnProperty(key)) {
                const currentHero = finalTeamData[key]
                if (currentHero && currentHero.id) {
                  const index = parseInt(key)
                  if (index >= 0 && index < 5) {
                    // 如果目标英雄和当前英雄id一样，跳过执行
                    if (currentHero.id === targetHeroes[index]) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量设置爬塔阵容',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'info',
                        message: `位置${index}英雄已经是${getHeroName(currentHero.id)}，跳过更换`
                      })
                      continue
                    }
                    
                    // 从gameCommands.js获取hero_exchange的正确参数：heroId和targetHeroId
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量设置爬塔阵容',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `执行hero_exchange命令: ${getHeroName(currentHero.id)} → ${getHeroName(targetHeroes[index])}`
                    })
                    try {
                      await tokenStore.sendMessageWithPromise(
                        token.id,
                        'hero_exchange',
                        {
                          heroId: currentHero.id,
                          targetHeroId: targetHeroes[index]
                        },
                        5000
                      )
                      await new Promise(resolve => setTimeout(resolve, 500))
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量设置爬塔阵容',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'info',
                        message: `更换位置${index}英雄成功: ${getHeroName(currentHero.id)} → ${getHeroName(targetHeroes[index])}`
                      })
                      
                      // 执行fight_startlevel获取更新后的阵容
                      const updatedResult = await tokenStore.sendFightStartLevel(token.id, {})
                      await new Promise(resolve => setTimeout(resolve, 500))

                      // 更新finalTeamData
                      if (updatedResult && updatedResult.body && updatedResult.body.battleData && updatedResult.body.battleData.leftTeam && updatedResult.body.battleData.leftTeam.team) {
                        finalTeamData = updatedResult.body.battleData.leftTeam.team
                      } else if (updatedResult && updatedResult._raw && updatedResult._raw.body && updatedResult._raw.body.battleData && updatedResult._raw.body.battleData.leftTeam && updatedResult._raw.body.battleData.leftTeam.team) {
                        finalTeamData = updatedResult._raw.body.battleData.leftTeam.team
                      } else if (updatedResult && updatedResult.battleData && updatedResult.battleData.leftTeam && updatedResult.battleData.leftTeam.team) {
                        finalTeamData = updatedResult.battleData.leftTeam.team
                      }

                      // 记录更新后的阵容信息
                      if (finalTeamData) {
                        const updatedTeamInfo = []
                        for (let i = 0; i < 5; i++) {
                          const hero = finalTeamData?.[String(i)] || finalTeamData?.[i]
                          if (hero && hero.id) {
                            updatedTeamInfo.push(`位置${i}: ${getHeroName(hero.id)}`)
                          } else {
                            updatedTeamInfo.push(`位置${i}: 无英雄`)
                          }
                        }
                        logStore.addLog({
                          page: 'fish-helper',
                          cardType: '养号',
                          operation: '批量设置爬塔阵容',
                          tokenId: token.id,
                          tokenName: token.name,
                          status: 'info',
                          message: `更新后阵容: ${updatedTeamInfo.join(', ')}`
                        })
                      }
                    } catch (error) {
                      // 处理hero_exchange服务器错误200020，不停止执行任务
                      if (error.message.includes('200020')) {
                        logStore.addLog({
                          page: 'fish-helper',
                          cardType: '养号',
                          operation: '批量设置爬塔阵容',
                          tokenId: token.id,
                          tokenName: token.name,
                          status: 'warning',
                          message: `更换位置${index}英雄时遇到服务器错误200020，继续执行任务: ${getHeroName(currentHero.id)} → ${getHeroName(targetHeroes[index])}`
                        })
                      } else {
                        throw error
                      }
                    }
                  }
                }
              }
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 爬塔阵容设置完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '爬塔阵容设置完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 爬塔阵容设置失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 爬塔阵容设置失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量设置爬塔阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `爬塔阵容设置失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量设置爬塔阵容完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量设置爬塔阵容',
      status: 'success',
      message: `批量设置爬塔阵容完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量设置爬塔阵容')
    })
  } catch (error) {
    console.error('批量设置爬塔阵容失败:', error)
    message.error(`批量设置爬塔阵容失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量设置爬塔阵容',
      status: 'error',
      message: `批量设置爬塔阵容失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchSettingTowerTeam.value = false
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
  message.info(`开始批量下阵武将（${rangeText}），共${targetTokens.length}个 Token，下阵位置：2-4 号位`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量下阵武将',
    status: 'info',
    message: `开始批量下阵武将，${rangeText}，共${targetTokens.length}个 Token`
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
              await new Promise(resolve => setTimeout(resolve, 300))
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量下阵武将',
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
                operation: '批量下阵武将',
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
            operation: '批量下阵武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '下阵武将完成'
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
      operation: '批量下阵武将',
      status: 'success',
      message: `批量下阵完成，成功：${successCount}，失败：${failCount}`
    })
    
  } catch (error) {
    console.error('批量下阵武将失败:', error)
    message.error('批量下阵武将失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量下阵武将',
      status: 'error',
      message: `批量下阵失败：${error.message}`
    })
  } finally {
    isBatchUnloadingHeroes.value = false
  }
}


const handleBatchUpgrade900 = async () => {
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
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级900级（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量升级900级',
    status: 'info',
    message: `开始批量升级900级，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchUpgrading900.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行升级900级...`)
          
          // 1. 使用fight_startlevel获取当前阵容
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级900级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: '执行fight_startlevel命令，获取当前阵容'
          })
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 2. 获取heroid和level
          const heroes = []
          
          // 尝试从不同的结构中获取阵容数据
          let teamData = null
          if (fightResult && fightResult.body && fightResult.body.battleData && fightResult.body.battleData.leftTeam && fightResult.body.battleData.leftTeam.team) {
            teamData = fightResult.body.battleData.leftTeam.team
          } else if (fightResult && fightResult._raw && fightResult._raw.body && fightResult._raw.body.battleData && fightResult._raw.body.battleData.leftTeam && fightResult._raw.body.battleData.leftTeam.team) {
            teamData = fightResult._raw.body.battleData.leftTeam.team
          } else if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
            teamData = fightResult.battleData.leftTeam.team
          }
          
          if (teamData) {
            // 遍历teamData中的所有英雄
            for (const key in teamData) {
              if (teamData.hasOwnProperty(key)) {
                const hero = teamData[key]
                if (hero && hero.id) {
                  heroes.push({
                    heroId: hero.id,
                    level: hero.level || 1
                  })
                }
              }
            }
          }
          
          // 记录获取到的阵容信息
          if (heroes.length > 0) {
            const teamInfo = heroes.map((hero, index) => `位置${index}: ${getHeroName(hero.heroId)}(等级${hero.level})`).join(', ')
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级900级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `获取当前阵容成功: ${teamInfo}`
            })
          }
          
          if (heroes.length === 0) {
            throw new Error('无法获取阵容中的武将')
          }
          
          // 3. 对每个武将进行升级
          for (const hero of heroes) {
            // 如果level大于900跳过
            if (hero.level >= 900) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级900级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `武将${getHeroName(hero.heroId)}当前等级${hero.level}，已达到900级，跳过`
              })
              continue
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量升级900级',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `开始升级武将${getHeroName(hero.heroId)}，当前等级${hero.level}`
            })
            
            // 如果level小于900级，循环升级
            let currentLevel = hero.level
            while (currentLevel < 900) {
              try {
                // 根据当前等级计算升级参数
                const upgradeNum = calculateUpgradeNum(currentLevel)
                
                // 执行武将升级
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级900级',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `执行hero_heroupgradelevel命令: ${getHeroName(hero.heroId)}，当前等级${currentLevel}，升级${upgradeNum}级`
                })
                const upgradeRes = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradelevel',
                  {
                    heroId: hero.heroId,
                    upgradeNum: upgradeNum
                  },
                  5000
                )
                
                // 检查响应中是否有错误消息
                const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
                const errorMsgStr = String(errorMsg).toLowerCase()
                
                // 检查是否包含"未进阶"错误
                if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级900级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `武将${getHeroName(hero.heroId)}升级失败: 未进阶，准备执行升阶命令`
                  })
                  // 执行升阶命令
                  try {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `执行hero_heroupgradeorder命令: ${getHeroName(hero.heroId)}`
                    })
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: hero.heroId
                      },
                      5000
                    )
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `武将${getHeroName(hero.heroId)}升阶成功`
                    })
                    await new Promise(resolve => setTimeout(resolve, 500))
                    // 升阶后继续升级循环
                    continue
                  } catch (orderError) {
                    console.error(`武将${hero.heroId}升阶失败:`, orderError)
                    const orderErrorMsg = String(orderError.message || '').toLowerCase()
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'error',
                      message: `武将${getHeroName(hero.heroId)}升阶失败: ${orderError.message || '未知错误'}`
                    })
                    if (orderErrorMsg.includes('物品数量不足')) {
                      break
                    }
                    // 升阶失败，跳过这个武将
                    break
                  }
                }
                
                // 检查是否包含"物品数量不足"
                if (errorMsgStr.includes('物品数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级900级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `武将${getHeroName(hero.heroId)}升级失败: 物品数量不足`
                  })
                  break
                }
                
                // 更新武将等级
                // 尝试从不同的路径获取heroes数据
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
                    updatedHero = heroesData.find(h => Number(h.heroId) === Number(hero.heroId))
                  } else if (typeof heroesData === 'object') {
                    // 尝试直接通过键获取
                    updatedHero = heroesData[hero.heroId] || heroesData[String(hero.heroId)] ||
                                 // 尝试遍历对象值查找
                                 Object.values(heroesData).find(h => h && Number(h.heroId) === Number(hero.heroId))
                  }
                  
                  if (updatedHero && updatedHero.level > currentLevel) {
                    const oldLevel = currentLevel
                    currentLevel = updatedHero.level
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `武将${getHeroName(hero.heroId)}升级成功: ${oldLevel} → ${currentLevel}`
                    })
                    // 检查level是否大于750，如果是则跳出升级循环
                    if (currentLevel > 750) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量升级900级',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'info',
                        message: `武将${getHeroName(hero.heroId)}等级超过750，停止升级`
                      })
                      break
                    }
                  } else {
                    // 等级没有变化，可能已达到上限或无法继续升级
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `武将${getHeroName(hero.heroId)}等级没有变化，可能已达到上限`
                    })
                    break
                  }
                } else {
                  // 响应格式异常，停止升级这个武将
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级900级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'error',
                    message: `武将${getHeroName(hero.heroId)}升级响应格式异常`
                  })
                  break
                }
                
                await new Promise(resolve => setTimeout(resolve, 500))
              } catch (error) {
                // 捕获升级命令的错误
                const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
                
                // 检查是否包含"未进阶"错误
                if (errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公') || errorMsg.includes('400060')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级900级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `武将${getHeroName(hero.heroId)}升级失败: 未进阶，准备执行升阶命令`
                  })
                  // 执行升阶命令
                  try {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `执行hero_heroupgradeorder命令: ${getHeroName(hero.heroId)}`
                    })
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: hero.heroId
                      },
                      5000
                    )
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `武将${getHeroName(hero.heroId)}升阶成功`
                    })
                    await new Promise(resolve => setTimeout(resolve, 500))
                    // 升阶后继续升级循环
                    continue
                  } catch (orderError) {
                    console.error(`武将${hero.heroId}升阶失败:`, orderError)
                    const orderErrorMsg = String(orderError.message || '').toLowerCase()
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级900级',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'error',
                      message: `武将${getHeroName(hero.heroId)}升阶失败: ${orderError.message || '未知错误'}`
                    })
                    if (orderErrorMsg.includes('物品数量不足')) {
                      break
                    }
                    // 升阶失败，跳过这个武将
                    break
                  }
                } else if (errorMsg.includes('物品数量不足')) {
                  // 物品数量不足，停止这个武将的升级
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级900级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `武将${getHeroName(hero.heroId)}升级失败: 物品数量不足`
                  })
                  break
                } else {
                  // 其他错误，跳过这个武将
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '养号',
                    operation: '批量升级900级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'error',
                    message: `武将${getHeroName(hero.heroId)}升级失败: ${error.message || '未知错误'}`
                  })
                  break
                }
              }
            }
            
            // 记录武将升级完成
            if (currentLevel >= 900) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级900级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `武将${getHeroName(hero.heroId)}升级完成: ${hero.level} → ${currentLevel}`
              })
            } else {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量升级900级',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `武将${getHeroName(hero.heroId)}升级结束: ${hero.level} → ${currentLevel}`
              })
            }
          }
          
          // 刷新角色信息
          await tokenStore.sendGetRoleInfo(token.id)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 升级900级完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级900级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '升级900级完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 升级900级失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 升级900级失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级900级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `升级900级失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量升级 900 级完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级 900 级',
      status: 'success',
      message: `批量升级 900 级完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量升级 900 级')
    })
  } catch (error) {
    console.error('批量升级900级失败:', error)
    message.error(`批量升级900级失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级900级',
      status: 'error',
      message: `批量升级900级失败: ${error.message || '未知错误'}`
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 开始获取阵容`
          })
          
          // 执行fight_startlevel获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 阵容获取成功: ${heroSummary || '无英雄'}`
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 阵容获取失败: ${error.message || '未知错误'}`
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
            message: `${tokenIndex}、${token.name || token.id}、领取宝箱奖励成功`
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
            message: `${globalIndex + 1}、${token.name || token.id}、领取宝箱奖励失败：${error.message || error}`
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
            message: `${tokenIndex}、${token.name || token.id}、领取邮件成功`
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
            message: `${globalIndex + 1}、${token.name || token.id}、领取邮件失败：${error.message || error}`
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

// 领取宝箱周奖励
const handleClaimBoxWeekReward = async () => {
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
    isClaimingBoxWeekReward.value = true
    
    const result = await tokenStore.sendActivityClaimWeekActReward(token.id)
    
    message.success('领取宝箱周奖励成功')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取宝箱周奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '领取宝箱周奖励成功'
    })
  } catch (error) {
    console.error('领取宝箱周奖励失败:', error)
    message.error(`领取宝箱周奖励失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取宝箱周奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `领取宝箱周奖励失败: ${error.message || '未知错误'}`
    })
  } finally {
    isClaimingBoxWeekReward.value = false
  }
}

// 一键宝箱周
const handleOneClickBoxWeek = async () => {
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
  
  let boxWeekRounds = 0
  
  try {
    isBoxWeekRunning.value = true
    
    message.info(`${token.name} - 开始一键宝箱周...`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键宝箱周',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `${token.name} - 开始一键宝箱周...`
    })
    
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
    // 计算宝箱总分Z
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
    
    message.info(`${token.name} - 宝箱总分: ${Z}, 基准宝箱分: ${J}, 已用宝箱分: ${Y}, 开箱轮数: ${l}`)
    
    // 3. 开宝箱阶段
    let roundCount = 0
    let shouldBreak = false
    while (true) {
      roundCount++
      message.info(`${token.name} - 执行第 ${roundCount} 轮开宝箱`)
      
      // 初始化开箱次数
      let MK = 0 // 木质开箱次数
      let QK = 0 // 青铜开箱次数
      let HK = 0 // 黄金开箱次数
      let BK = 0 // 铂金开箱次数
      
      // 铂金宝箱，每次10个（开箱顺序：铂金、黄金、青铜、木质）
      const platinumTimes = Math.floor(B / 10)
      for (let i = 0; i < platinumTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2004, count: 10 })
        B -= 10
        BK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开铂金宝箱: ${BK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              shouldBreak = true
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              shouldBreak = true
              break
            }
          }
        }
      }
      
      if (shouldBreak) break
      
      // 黄金宝箱，每次10个
      const goldTimes = Math.floor(H / 10)
      for (let i = 0; i < goldTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2003, count: 10 })
        H -= 10
        HK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开黄金宝箱: ${HK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              shouldBreak = true
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              shouldBreak = true
              break
            }
          }
        }
      }
      
      if (shouldBreak) break
      
      // 青铜宝箱，每次10个
      const bronzeTimes = Math.floor(Q / 10)
      for (let i = 0; i < bronzeTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2002, count: 10 })
        Q -= 10
        QK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开青铜宝箱: ${QK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              shouldBreak = true
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              shouldBreak = true
              break
            }
          }
        }
      }
      
      if (shouldBreak) break
      
      // 木质宝箱，每次100个
      const woodTimes = Math.floor(M / 100)
      for (let i = 0; i < woodTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2001, count: 100 })
        M -= 100
        MK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 100
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 100 + QK * 100 + HK * 200 + BK * 500
        const openBoxLog = `${token.name} - 已用宝箱积分YY: ${YY}，已开木质宝箱: ${MK}次，累计开箱：木质${MK}次，青铜${QK}次，黄金${HK}次，铂金${BK}次。剩余木质${remainingM}个，青铜${remainingQ}个，黄金${remainingH}个，铂金${remainingB}个`
        message.info(openBoxLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开箱操作',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: openBoxLog
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查YY是否超过目标，如果超过则获取Y进行验证
        if (YY > l * 8000) {
          // 直接获取已用宝箱分Y
          const activityInfo = await tokenStore.sendActivityGet(token.id)
          if (activityInfo && activityInfo.activity && activityInfo.activity.myTotalInfo && activityInfo.activity.myTotalInfo['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
            
            const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
            message.info(scoreLog)
            // 添加操作日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '分数获取',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: scoreLog,
              details: {
                Y: Y,
                rounds: rounds,
                num: num
              }
            })
            
            if (Y > l * 8000) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
              })
              break
            }
            // 额外检查：如果已用宝箱分已经很高，及时停止
            if (Y > 8000 * 4) {
              message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
              // 添加跳出循环日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '跳出循环',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
              })
              break
            }
          }
        }
      }
      
      // 4. 领取奖励阶段（开宝箱阶段内）
      // 开宝箱阶段内领取宝箱奖励
      message.info(`${token.name} - 开宝箱阶段内领取宝箱奖励`)
      await tokenStore.sendBatchClaimBoxPointReward(token.id)
      message.info(`${token.name} - 开宝箱阶段内领取宝箱奖励成功`)
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '开宝箱阶段领取宝箱奖励',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `${token.name} - 开宝箱阶段内领取宝箱奖励成功`,
        command: 'item_batchclaimboxpointreward'
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 开宝箱阶段内领取邮件
      message.info(`${token.name} - 开宝箱阶段内领取邮件`)
      await tokenStore.sendMailClaimAllAttachment(token.id, { category: 0 })
      message.info(`${token.name} - 开宝箱阶段内领取邮件成功`)
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '开宝箱阶段领取邮件',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `${token.name} - 开宝箱阶段内领取邮件成功`,
        command: 'mail_claimallattachment',
        commandParams: { category: 0 }
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 领取邮件后，重新获取宝箱数量
      message.info(`${token.name} - 开宝箱阶段内重新获取宝箱数量`)
      const boxRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (boxRoleInfo && boxRoleInfo.role && boxRoleInfo.role.items) {
        const boxItems = boxRoleInfo.role.items
        M = boxItems['2001']?.quantity || 0
        Q = boxItems['2002']?.quantity || 0
        H = boxItems['2003']?.quantity || 0
        B = boxItems['2004']?.quantity || 0
        message.info(`${token.name} - 开宝箱阶段内重新获取宝箱数量成功：木质${M}，青铜${Q}，黄金${H}，铂金${B}`)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '开宝箱阶段重新获取宝箱数量',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${token.name} - 开宝箱阶段内重新获取宝箱数量：木质${M}，青铜${Q}，黄金${H}，铂金${B}`
        })
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 5. 检查阶段
      const activityInfoCheck = await tokenStore.sendActivityGet(token.id)
      if (activityInfoCheck && activityInfoCheck.activity && activityInfoCheck.activity.myTotalInfo && activityInfoCheck.activity.myTotalInfo['2']) {
        const info = activityInfoCheck.activity.myTotalInfo['2']
        const rounds = info.rounds || 1
        const num = info.num || 0
        Y = (rounds - 1) * 8000 + num
        
        const scoreLog = `${token.name} - 已用宝箱分：Y=${Y}`
        message.info(scoreLog)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '分数获取',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: scoreLog,
          details: {
            Y: Y,
            rounds: rounds,
            num: num
          }
        })
        
        if (Y > l * 8000) {
          message.info(`${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}，进入最终阶段`)
          // 添加跳出循环日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '跳出循环',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${token.name} - 已用宝箱分Y ${Y} 超过目标 ${l * 8000}`
          })
          break
        }
        // 额外检查：如果已用宝箱分已经很高，及时停止
        if (Y > 8000 * 4) {
          message.info(`${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000，进入最终阶段`)
          // 添加跳出循环日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '跳出循环',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${token.name} - 已用宝箱分Y ${Y} 超过最大限制 32000`
          })
          break
        }
      }
      
      // 检查阶段重置MK/QK/HK/BK为0
      MK = 0
      QK = 0
      HK = 0
      BK = 0
      
      // 重新获取宝箱数量
      const newRoleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (newRoleInfo && newRoleInfo.role && newRoleInfo.role.items) {
        const newItems = newRoleInfo.role.items
        M = newItems['2001']?.quantity || 0
        Q = newItems['2002']?.quantity || 0
        H = newItems['2003']?.quantity || 0
        B = newItems['2004']?.quantity || 0
      }
      
      // 判断是否继续下一轮开箱：基于YY计算值
      const currentYY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
      if (currentYY >= l * 8000) {
        message.info(`${token.name} - 已用宝箱分YY ${currentYY} 达到目标 ${l * 8000}，进入最终阶段`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '跳出循环',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${token.name} - 已用宝箱分YY ${currentYY} 达到目标 ${l * 8000}`
        })
        break
      }
    }
    
    // 6. 最终阶段
    // 领取邮件
    await tokenStore.sendMessageWithPromise(token.id, 'mail_claimallattachment', { category: 0 })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 领取宝箱周奖励
    for (let i = 0; i < l + 1; i++) {
      try {
        await tokenStore.sendActivityClaimWeekActReward(token.id)
        message.info(`${token.name} - 第 ${i + 1} 次领取宝箱周奖励成功`)
        // 添加操作日志
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '领取宝箱周奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${token.name} - 第 ${i + 1} 次领取宝箱周奖励成功`,
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
          message: `${token.name} - 第 ${i + 1} 次领取宝箱周奖励失败: ${error.message || '未知错误'}`,
          command: 'activity_claimweekactreward'
        })
        // 继续执行下一次领取，不停止
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    message.success('一键宝箱周完成')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键宝箱周',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `一键宝箱周完成，执行了 ${l} 轮开箱`
    })
  } catch (error) {
    console.error('一键宝箱周失败:', error)
    message.error(`一键宝箱周失败: ${error.message || '未知错误'}`)
    
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
    isBoxWeekRunning.value = false
  }
}

// 批量激活玩具
const isBatchActivatingToys = ref(false)

const handleBatchActivateToys = async () => {
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
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量激活玩具（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量激活玩具',
    status: 'info',
    message: `开始批量激活玩具，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchActivatingToys.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在激活玩具...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量激活玩具',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] ${token.name || token.id} 开始激活玩具`
          })
          
          // 1. 获取角色信息，获取领主武器信息（lordWeapon就是玩具）
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          if (!roleInfo || !roleInfo.role) {
            throw new Error('获取角色信息失败')
          }
          
          // 只查找lordWeapon字段，lordWeapon就是玩具
          const lordWeapon = roleInfo.role.lordWeapon || {}
          const weaponId = '3' // 只激活武器ID为3的武器
          
          // 检查lordWeapon中是否包含武器ID为3的武器
          const hasWeapon3 = lordWeapon && (lordWeapon[weaponId] || lordWeapon.weaponId === parseInt(weaponId))
          
          let activateSuccess = true
          
          if (hasWeapon3) {
            // 武器已经激活，跳过解锁命令
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `[序号${tokenIndex}] ${token.name || token.id} 武器 ID: ${weaponId} 已经激活，跳过解锁`
            })
          } else {
            // 武器未激活，执行解锁命令
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `[序号${tokenIndex}] ${token.name || token.id} 准备解锁武器 ID: ${weaponId}`
            })
            
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'lordweapon_unlock',
                {
                  weaponId: weaponId
                },
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `[序号${tokenIndex}] ${token.name || token.id} 解锁武器 ${weaponId} 成功`
              })
            } catch (error) {
              // 记录错误，设置激活失败标志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `[序号${tokenIndex}] ${token.name || token.id} 解锁武器 ${weaponId} 失败: ${error.message || '未知错误'}`
              })
              activateSuccess = false
            }
          }
          
          if (activateSuccess) {
            message.success(`[序号${tokenIndex}] ${token.name || token.id} 武器激活完成，开始执行玩具升级`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `[序号${tokenIndex}] ${token.name || token.id} 武器激活完成，开始执行玩具升级`
            })
            
            // 执行 lordweapon_get 命令，获取玩具信息
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 执行 lordweapon_get 获取玩具信息`)
            try {
              const lordWeaponInfo = await tokenStore.sendLordWeaponGet(token.id, {})
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `[序号${tokenIndex}] ${token.name || token.id} - lordweapon_get 执行成功`
              })
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - lordweapon_get 执行成功`)
            } catch (error) {
              console.warn(`[序号${tokenIndex}] ${token.name || token.id} - lordweapon_get 执行失败:`, error.message)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `[序号${tokenIndex}] ${token.name || token.id} - lordweapon_get 执行失败：${error.message || '未知错误'}`
              })
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} - lordweapon_get 执行失败，继续执行升级`)
            }
            
            // 执行玩具主动升级，最多 60 次
            const weaponId = 3
            let activeUpgradeCount = 0
            let activeUpgradeSuccess = true
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行玩具主动升级 (weaponId:${weaponId})，最多 60 次`)
            
            for (let i = 0; i < 60; i++) {
              try {
                await tokenStore.sendLordWeaponUpgradeActiveSkillLevel(token.id, {
                  weaponId: weaponId
                })
                
                activeUpgradeCount++
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级第${i + 1}次成功`)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量激活玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级第${i + 1}次成功`
                })
                
                // 每次执行间隔 300ms
                if (i < 59) {
                  await new Promise(resolve => setTimeout(resolve, 300))
                }
              } catch (error) {
                console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级第${i + 1}次失败:`, error.message)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量激活玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级第${i + 1}次失败：${error.message || '未知错误'}，停止主动升级`
                })
                
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级第${i + 1}次失败，停止主动升级`)
                activeUpgradeSuccess = false
                break
              }
            }
            
            if (activeUpgradeSuccess) {
              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级完成，共执行${activeUpgradeCount}次`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具主动升级完成，共执行${activeUpgradeCount}次`
              })
            }
            
            // 执行玩具被动升级 skillId 9，最多 60 次
            let passiveSkill9UpgradeCount = 0
            let passiveSkill9UpgradeSuccess = true
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行玩具被动升级 (weaponId:${weaponId}, skillId:9)，最多 60 次`)
            
            for (let i = 0; i < 60; i++) {
              try {
                await tokenStore.sendLordWeaponUpgradePassiveSkillLevel(token.id, {
                  weaponId: weaponId,
                  skillId: 9
                })
                
                passiveSkill9UpgradeCount++
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 第${i + 1}次成功`)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量激活玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 第${i + 1}次成功`
                })
                
                // 每次执行间隔 300ms
                if (i < 59) {
                  await new Promise(resolve => setTimeout(resolve, 300))
                }
              } catch (error) {
                console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 第${i + 1}次失败:`, error.message)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量激活玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 第${i + 1}次失败：${error.message || '未知错误'}，停止 skillId:9 升级`
                })
                
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 第${i + 1}次失败，停止 skillId:9 升级`)
                passiveSkill9UpgradeSuccess = false
                break
              }
            }
            
            if (passiveSkill9UpgradeSuccess) {
              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 完成，共执行${passiveSkill9UpgradeCount}次`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:9 完成，共执行${passiveSkill9UpgradeCount}次`
              })
            }
            
            // 执行玩具被动升级 skillId 10，最多 60 次
            let passiveSkill10UpgradeCount = 0
            let passiveSkill10UpgradeSuccess = true
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行玩具被动升级 (weaponId:${weaponId}, skillId:10)，最多 60 次`)
            
            for (let i = 0; i < 60; i++) {
              try {
                await tokenStore.sendLordWeaponUpgradePassiveSkillLevel(token.id, {
                  weaponId: weaponId,
                  skillId: 10
                })
                
                passiveSkill10UpgradeCount++
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 第${i + 1}次成功`)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量激活玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 第${i + 1}次成功`
                })
                
                // 每次执行间隔 300ms
                if (i < 59) {
                  await new Promise(resolve => setTimeout(resolve, 300))
                }
              } catch (error) {
                console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 第${i + 1}次失败:`, error.message)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量激活玩具',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 第${i + 1}次失败：${error.message || '未知错误'}，停止 skillId:10 升级`
                })
                
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 第${i + 1}次失败，停止 skillId:10 升级`)
                passiveSkill10UpgradeSuccess = false
                break
              }
            }
            
            if (passiveSkill10UpgradeSuccess) {
              message.success(`[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 完成，共执行${passiveSkill10UpgradeCount}次`)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '养号',
                operation: '批量激活玩具',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `[序号${tokenIndex}] ${token.name || token.id} - 玩具被动升级 skillId:10 完成，共执行${passiveSkill10UpgradeCount}次`
              })
            }
            
            message.success(`[序号${tokenIndex}] ${token.name || token.id} 玩具激活和升级全部完成`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `[序号${tokenIndex}] ${token.name || token.id} 玩具激活和升级全部完成`
            })
            return { success: true, token: token }
          } else {
            message.error(`[序号${tokenIndex}] ${token.name || token.id} 武器激活失败`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `[序号${tokenIndex}] ${token.name || token.id} 武器激活失败`
            })
            return { success: false, token: token, error: '武器激活失败' }
          }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 武器激活失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 武器激活失败: ${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量激活玩具',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] ${token.name || token.id} 武器激活失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量激活玩具完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量激活玩具',
      status: 'success',
      message: `批量激活玩具完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量激活玩具')
    })
  } catch (error) {
    console.error('批量激活玩具失败:', error)
    message.error(`批量激活玩具失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量激活玩具',
      status: 'error',
      message: `批量激活玩具失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchActivatingToys.value = false
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 开始激活玩具阵容`
          })
          
          // 1. 使用 fight_startlevel 获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 当前阵容武将：${JSON.stringify(currentTeamHeroes)}`
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
              message: `[序号${tokenIndex}] ${token.name || token.id} 切换阵容${config.team}：${currentHeroId} → ${config.heroName}(ID:${config.heroId})`
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
            await new Promise(resolve => setTimeout(resolve, 500))
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '养号',
              operation: '批量激活玩具阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `[序号${tokenIndex}] ${token.name || token.id} 阵容${config.team}切换为${config.heroName}成功`
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 玩具阵容激活完成`
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
            message: `[序号${tokenIndex}] ${token.name || token.id} 玩具阵容激活失败：${error.message || '未知错误'}`
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

// 批量玩具阵容升星
const handleBatchUpgradeToyTeamStar = async () => {
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
  message.info(`开始批量玩具阵容升星（${rangeText}），共${targetTokens.length}个 Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '养号',
    operation: '批量玩具阵容升星',
    status: 'info',
    message: `开始批量玩具阵容升星，${rangeText}，共${targetTokens.length}个 Token`
  })
  
  try {
    isBatchUpgradingToyTeamStar.value = true
    
    // 玩具阵容武将配置：四个紫将（与批量激活玩具阵容一致）
    const toyTeamHeroes = [
      { heroId: 309, heroName: '陆绩' },    // 陆绩 ID: 309
      { heroId: 303, heroName: '于禁' },    // 于禁 ID: 303
      { heroId: 308, heroName: '张昭' },    // 张昭 ID: 308
      { heroId: 312, heroName: '邢道荣' }   // 邢道荣 ID: 312
    ]
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始玩具阵容升星...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量玩具阵容升星',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] ${token.name || token.id} 开始玩具阵容升星`
          })
          
          // 对每个紫将执行武将升星操作，每个英雄最多执行 10 次
          for (const hero of toyTeamHeroes) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始为${hero.heroName}(ID:${hero.heroId})执行升星，最多 10 次`)
            
            let successCount = 0
            let errorCount = 0
            
            // 每个英雄最多执行 10 次升星
            for (let i = 0; i < 10; i++) {
              try {
                await tokenStore.sendHeroUpgradeStar(token.id, {
                  heroId: hero.heroId
                })
                
                successCount++
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${hero.heroName} 第${i + 1}次升星成功`)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量玩具阵容升星',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - ${hero.heroName} 第${i + 1}次升星成功`
                })
                
                // 每次执行间隔 300ms
                if (i < 9) {
                  await new Promise(resolve => setTimeout(resolve, 300))
                }
              } catch (error) {
                errorCount++
                console.warn(`[序号${tokenIndex}] ${token.name || token.id} - ${hero.heroName} 第${i + 1}次升星失败:`, error.message)
                
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量玩具阵容升星',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `[序号${tokenIndex}] ${token.name || token.id} - ${hero.heroName} 第${i + 1}次升星失败：${error.message || '未知错误'}`
                })
                
                // 执行错误，继续执行下一个武将
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${hero.heroName} 第${i + 1}次升星失败，继续执行下一个武将`)
                break
              }
            }
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${hero.heroName} 升星完成：成功${successCount}次，失败${errorCount}次`)
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容升星完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量玩具阵容升星',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] ${token.name || token.id} 玩具阵容升星完成`
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容升星失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容升星失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量玩具阵容升星',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] ${token.name || token.id} 玩具阵容升星失败：${error.message || '未知错误'}`
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
    
    message.success(`批量玩具阵容升星完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量玩具阵容升星',
      status: 'success',
      message: `批量玩具阵容升星完成：成功${successCount}个，失败${failCount}个`
    })
    
    // 清空过程日志，只保留结果日志
    results.forEach(r => {
      logStore.clearLogsByToken(r.tokenId, '批量玩具阵容升星')
    })
  } catch (error) {
    console.error('批量玩具阵容升星失败:', error)
    message.error(`批量玩具阵容升星失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量玩具阵容升星',
      status: 'error',
      message: `批量玩具阵容升星失败：${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgradingToyTeamStar.value = false
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
            message: '执行role_getroleinfo命令，获取主公和吕布等级'
          })
          
          const roleResult = await tokenStore.sendGetRoleInfo(token.id)
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
            message: `获取等级成功: 主公${lordLevel}级，吕布${luBuLevel}级`
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
                message: `主公阶数${currentLordOrder}高于吕布阶数${currentLuBuOrder}，升级吕布`
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
                  message: `吕布已达到最高等级${currentLuBuLevel}，停止升级`
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
                  message: `吕布等级${currentLuBuLevel}已达到主公等级${currentLordLevel}，等待主公升级`
                })
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
                    message: `吕布升级成功: 4000 → 4001`
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
                      message: `吕布升阶后升级成功: 4000 → 4001`
                    })
                  } else if (errorMsg.includes('物品数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '养号',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'warning',
                      message: `吕布升级失败: 物品数量不足，停止执行`
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
                  message: `吕布升级成功: ${currentLuBuLevel - upgradeNum} → ${currentLuBuLevel}`
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
                    message: `吕布升阶后升级成功: ${currentLuBuLevel - upgradeNum} → ${currentLuBuLevel}`
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
                    message: `吕布升级失败: 物品数量不足，停止执行`
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
                message: `主公和吕布同阶${currentLordOrder}，先升级主公到下一阶等级${nextLordLevel}级，再升级吕布。`
              })
              
              if (nextLordLevel === null) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '养号',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `主公已达到最高等级${currentLordLevel}，停止升级`
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
                      message: `主公升级成功: 4000 → 4001`
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
                        message: `主公升阶后升级成功: 4000 → 4001`
                      })
                    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '养号',
                        operation: '批量升级主公武将',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'warning',
                        message: `主公升级失败: 物品数量不足，停止执行`
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
                    message: `主公升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
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
                      message: `主公升阶后升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
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
                      message: `主公升级失败: 物品数量不足，停止执行`
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
                message: `主公升级完成，现在升级吕布到与主公同等级${currentLordLevel}级`
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
                    message: `吕布升级成功: ${currentLuBuLevel - actualUpgradeNum} → ${currentLuBuLevel}`
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
                      message: `吕布升阶后升级成功: ${currentLuBuLevel - actualUpgradeNum} → ${currentLuBuLevel}`
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
                      message: `吕布升级失败: 物品数量不足，停止执行`
                    })
                    throw new Error('吕布升级失败: 物品数量不足')
                  } else {
                    throw error
                  }
                }
              }






            }
            
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 升级主公武将完成，共升级${upgradeCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '养号',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `升级主公武将完成，共升级${upgradeCount}次，最终等级：主公${currentLordLevel}级，吕布${currentLuBuLevel}级`
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
            message: `升级主公武将失败: ${error.message || '未知错误'}`
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
      message: `执行hero_lordupgradelevel命令: 升级${upgradeNum}级`
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
        message: `主公升级失败: 需要升阶，准备执行升阶命令`
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
          message: `执行hero_lordupgradeorder命令进行升阶`
        })
        
        await tokenStore.sendHeroLordUpgradeOrder(token.id, {})
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `主公升阶成功`
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
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
          message: `主公升阶失败: ${orderError.message || '未知错误'}`
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
        message: `主公升级失败: 物品数量不足`
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
        message: `主公升级失败: 需要升阶，准备执行升阶命令`
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
          message: `执行hero_lordupgradeorder命令进行升阶`
        })
        
        await tokenStore.sendHeroLordUpgradeOrder(token.id, {})
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `主公升阶成功`
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
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
          message: `主公升阶失败: ${orderError.message || '未知错误'}`
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
        message: `主公升级失败: ${error.message || '物品数量不足'}`
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
        message: `主公升级失败: ${error.message || '未知错误'}`
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
      message: `执行hero_heroupgradelevel命令: 武将ID${heroId}，升级${upgradeNum}级`
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
        message: `武将升级失败: 需要升阶，准备执行升阶命令`
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
          message: `执行hero_heroupgradeorder命令进行升阶`
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
          message: `武将升阶成功`
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
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
          message: `武将升阶失败: ${orderError.message || '未知错误'}`
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
        message: `武将升级失败: 物品数量不足`
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
        message: `武将升级失败: 需要升阶，准备执行升阶命令`
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
          message: `执行hero_heroupgradeorder命令进行升阶`
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
          message: `武将升阶成功`
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
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
          message: `武将升阶失败: ${orderError.message || '未知错误'}`
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
        message: `武将升级失败: ${error.message || '物品数量不足'}`
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
        message: `武将升级失败: ${error.message || '未知错误'}`
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
      message: `${type === 'lord' ? '主公' : '吕布'}达到${level}级，准备执行升阶命令`
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
      message: `执行hero_lordupgradeorder命令进行升阶`
    })
    
    await tokenStore.sendHeroLordUpgradeOrder(token.id, {})
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `主公升阶成功`
    })
    
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error(`主公升阶失败:`, error)
    const errorMsg = String(error.message || '').toLowerCase()
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'warning',
      message: `主公升阶失败: ${error.message || '未知错误'}，继续执行升级`
    })
    
    // 只有物品数量不足才停止执行
    if (errorMsg.includes('物品数量不足')) {
      throw new Error('主公升阶失败: 物品数量不足')
    }
    
    // 其他错误（如400060）不抛出，继续执行升级
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
      message: `执行hero_heroupgradeorder命令进行升阶`
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
      message: `武将升阶成功`
    })
    
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error(`武将升阶失败:`, error)
    const errorMsg = String(error.message || '').toLowerCase()
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'warning',
      message: `武将升阶失败: ${error.message || '未知错误'}，继续执行升级`
    })
    
    // 只有物品数量不足才停止执行
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
    await new Promise(resolve => setTimeout(resolve, 500))
    
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
    await new Promise(resolve => setTimeout(resolve, 500))
    
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
