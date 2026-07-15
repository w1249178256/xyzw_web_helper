<template>
  <MyCard class="hero-management" status-class="active">
    <template #icon>
      <n-icon size="24">
        <People />
      </n-icon>
    </template>
    <template #title>
      <h3>武将</h3>
    </template>
    <template #default>
      <div class="hero-management-content">
        <!-- 阵容选择区域 -->
        <div class="team-select-container">
          <div class="team-slots">
            <div v-for="i in 5" :key="'slot-' + i" class="hero-slot-wrapper">
              <select v-model="selectedHeroes[i-1]" class="hero-select">
                <option value="">空位</option>
                <option v-for="option in heroOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <img v-if="selectedHeroes[i-1]" :src="getHeroAvatar(selectedHeroes[i-1])" class="hero-avatar" />
              <div v-else class="hero-avatar-placeholder">空位</div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮区域 -->
        <CustomizedCard mode="container">
          <CustomizedCard 
            mode="button-switch"
            name="阵容一"
            :switch-value="team1Enabled"
            @update:switch-value="(val) => team1Enabled = val"
          />
          <CustomizedCard 
            mode="button-switch"
            name="阵容二"
            :switch-value="team2Enabled"
            @update:switch-value="(val) => team2Enabled = val"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchReplacingHero ? '批量换将中...' : '批量换将'"
            @button-click="handleBatchReplaceHero"
            :disabled="isBatchReplacingHero"
            :loading="isBatchReplacingHero"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchHeroBattle ? '批量上阵中...' : '批量上阵'"
            @button-click="handleBatchHeroBattle"
            :disabled="isBatchHeroBattle"
            :loading="isBatchHeroBattle"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUnloadingHeroes ? '批量下阵中...' : '批量下阵'"
            @button-click="handleBatchUnloadHeroes"
            :disabled="isBatchUnloadingHeroes"
            :loading="isBatchUnloadingHeroes"
          />
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
            mode="button-with-select"
            :button-text="isUpgradingLuBuStar ? '批量升星中...' : '批量升星'"
            :select-value="selectedUpgradeStarHero"
            @update:select-value="(val) => selectedUpgradeStarHero = val"
            :select-options="upgradeStarHeroOptions"
            placeholder="选择英雄"
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
            mode="button-with-select"
            :button-text="isUpgradingChiYu ? '购买升级鱼灵中...' : '购买升级鱼灵'"
            :select-value="selectedFishSpiritAction"
            @update:select-value="(val) => selectedFishSpiritAction = val"
            :select-options="fishSpiritOptions"
            placeholder="选择操作"
            @button-click="handleUpgradeChiYu"
            :disabled="isUpgradingChiYu"
            :loading="isUpgradingChiYu"
          />
          <CustomizedCard 
            mode="button-with-select"
            :button-text="isBatchAwakingSkill ? '批量觉醒中...' : '批量觉醒'"
            :select-value="selectedAwakenHero"
            @update:select-value="(val) => selectedAwakenHero = val"
            :select-options="heroOptions"
            placeholder="选择英雄"
            @button-click="handleBatchAwakeSkill"
            :disabled="isBatchAwakingSkill"
            :loading="isBatchAwakingSkill"
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
            mode="button-with-select"
            :button-text="isBatchUpgradingToys ? '批量升级玩具中...' : '批量升级玩具'"
            :select-value="selectedToyUpgradeMode"
            @update:select-value="(val) => selectedToyUpgradeMode = val"
            :select-options="[
              { label: '激活', value: 'activate' },
              { label: '主动', value: 'active' },
              { label: '被动一', value: 'passive1' },
              { label: '被动二', value: 'passive2' },
              { label: '被动三', value: 'passive3' },
              { label: '被动四', value: 'passive4' }
            ]"
            placeholder="选择模式"
            @button-click="handleBatchUpgradeToys"
            :disabled="isBatchUpgradingToys"
            :loading="isBatchUpgradingToys"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchUpgrading900 ? '批量升级中...' : '批量升级'"
            @button-click="handleBatchUpgrade900"
            :disabled="isBatchUpgrading900"
            :loading="isBatchUpgrading900"
          />
          <CustomizedCard 
            mode="button"
            :name="isExportingDetails ? '导出详情中...' : '导出详情'"
            @button-click="handleExportDetails"
            :disabled="isExportingDetails"
            :loading="isExportingDetails"
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
            mode="button-number-input" 
            name="执行间隔(ms)" 
            v-model:inputValue="commandDelay" 
            placeholder="输入间隔毫秒" 
            @update:inputValue="handleCommandDelayInput" 
          />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="武将"
      />
    </template>
  </MyCard>
</template>

<script setup>
// @unocss-include
// uno-css-ignore-file
import { ref, computed } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { People } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'
import { HERO_DICT, STAR_DICT, weapon } from '@/utils/HeroList'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

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

// 根据英雄id获取英雄名称
const getHeroName = (heroId) => {
  if (!heroId) return '无英雄'
  const hero = HERO_DICT[heroId]
  return hero ? hero.name : `英雄${heroId}`
}

// 根据英雄id获取头像路径
const getHeroAvatar = (heroId) => {
  if (!heroId) return ''
  const hero = HERO_DICT[heroId]
  return hero ? hero.avatar : ''
}

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

// 计算升级数量
const calculateUpgradeNum = (currentLevel) => {
  if (currentLevel === 1) {
    return 49
  } else if (currentLevel >= 51 && currentLevel < 100) {
    const remaining = 100 - currentLevel
    if (remaining >= 10) {
      return 10
    } else if (remaining >= 5) {
      return 5
    } else {
      return 1
    }
  } else if (currentLevel >= 100) {
    return 50
  } else {
    return 50
  }
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

// 操作状态
const isExportingDetails = ref(false)
const isUsingUniversalRed = ref(false)
const isUpgradingCrystal = ref(false)
const isUpgradingLuBuStar = ref(false)
const isBatchHeroSynthetic = ref(false)
const isUpgradingChiYu = ref(false)
const isBatchAwakingSkill = ref(false)
const isBatchUpgradingLord = ref(false)
const isBatchActivatingToyTeam = ref(false)
const isBatchUpgradingToys = ref(false)
const isBatchUpgrading900 = ref(false)
const isBatchHeroBattle = ref(false)
const isBatchUnloadingHeroes = ref(false)
const isBatchReplacingHero = ref(false)

// 阵容切换开关
const team1Enabled = ref(false)
const team2Enabled = ref(false)

// 下拉选择状态
const selectedUniversalRedHero = ref(null)
const selectedCrystalHero = ref(null)
const selectedUpgradeStarHero = ref(null)
const selectedSyntheticHero = ref('lvbu')
const selectedAwakenHero = ref(null)
const selectedToyUpgradeMode = ref('activate')
const selectedUpgradeMode = ref('story')
const selectedBatchHero = ref('107')
const selectedUnloadHero = ref('all')
const selectedSingleHero = ref('107')
const selectedFishSpiritAction = ref('equip_shigu')

// 鱼灵操作选项
const fishSpiritOptions = [
  { label: '装备蚀骨', value: 'equip_shigu' },
  { label: '升级蚀骨', value: 'upgrade_shigu' },
  { label: '升级赤羽', value: 'upgrade_chiyu' }
]

// 阵容选择状态
const selectedHeroes = ref(['', '', '', '', ''])

// 英雄选项（从HERO_DICT生成，红将及指定橙将）
const heroOptions = computed(() => {
  const allowedHeroIds = ['202', '204', '206', '209', '210', '213', '217', '220', '312']
  return Object.entries(HERO_DICT)
    .filter(([id, hero]) => id.startsWith('1') || allowedHeroIds.includes(id))
    .map(([id, hero]) => ({
      label: hero.name,
      value: parseInt(id)
    })).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
})

// 升星英雄选项（包含被动紫将选项）
const upgradeStarHeroOptions = computed(() => {
  const redHeroes = Object.entries(HERO_DICT)
    .filter(([id, hero]) => id.startsWith('1'))
    .map(([id, hero]) => ({
      label: hero.name,
      value: parseInt(id)
    })).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
  
  return [
    ...redHeroes,
    { label: '被动紫将', value: 'passive' }
  ]
})

// 英雄合成下拉选项
const syntheticHeroOptions = computed(() => {
  return [
    { label: '吕布', value: 'lvbu' },
    { label: '张飞', value: 'zhangfei' },
    { label: '合太史慈', value: 'hetaishici' },
    { label: '合郭嘉', value: 'heguojia' },
    { label: '全部', value: 'all' }
  ]
})

// 被动紫将列表（关平到陆绩10个紫将）
const passiveHeroes = [
  { id: 306, name: '关平' },
  { id: 302, name: '许攸' },
  { id: 311, name: '潘凤' },
  { id: 301, name: '周泰' },
  { id: 312, name: '邢道荣' },
  { id: 307, name: '程普' },
  { id: 215, name: '许褚' },
  { id: 303, name: '于禁' },
  { id: 308, name: '张昭' },
  { id: 309, name: '陆绩' }
]

// 单个英雄升星
const upgradeSingleHero = async (token, tokenIndex, heroId, heroName) => {
  try {
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    if (!roleInfo || !roleInfo.role || !roleInfo.role.heroes) {
      throw new Error('获取角色信息失败')
    }

    let heroStar = 0
    const heroIdStr = String(heroId)
    if (roleInfo.role.heroes[heroIdStr]) {
      heroStar = roleInfo.role.heroes[heroIdStr].star || 0
    }

    message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}星级：${heroStar}`)

    message.info(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}等待 1 秒后开始升星...`)
    await waitCommandDelay()

    if (heroStar >= 30) {
      message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}已 30 星，跳过`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升星',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}已 30 星，跳过`
      })
      return
    }

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

        await waitCommandDelay()
      } catch (error) {
        const errorMsg = error.message || String(error)
        if (errorMsg.includes('物品数量不足') || errorMsg.includes('400010')) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}万能红碎片不足，停止升星`)
          break
        }
        message.error(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}第${upgradeAttempt}次升星失败：${errorMsg}`)
        break
      }
    }

    message.success(`[序号${tokenIndex}] ${token.name || token.id} - ${heroName}升星完成，共升星${upgradeCount}次`)

    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
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
      cardType: '武将',
      operation: '批量升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升星失败：${error.message || '未知错误'}`
    })
  }
}

// ==================== 12个主要功能函数 ====================

// 1. 批量升级水晶
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

              if (i < 19) {
                await waitCommandDelay()
              }
            } catch (error) {
              console.error(`[序号${tokenIndex}] ${token.name || token.id} - 第${i + 1}次升级水晶失败:`, error)
              failCount++
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 第${i + 1}次升级水晶失败: ${error.message}，跳过剩余次数`)
              break
            }
          }

          message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升级水晶完成：成功${successCount}次，失败${failCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
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
            cardType: '武将',
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

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    message.success(`批量升级水晶完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '升级水晶',
      status: 'success',
      message: `批量升级水晶完成：成功 ${successCount} 个，失败 ${failureCount} 个`
    })

  } catch (error) {
    console.error('批量升级水晶失败:', error)
    message.error(`批量升级水晶失败: ${error.message}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '升级水晶',
      status: 'error',
      message: `批量升级水晶失败: ${error.message}`
    })
  } finally {
    isUpgradingCrystal.value = false
  }
}

// 2. 批量使用万能红
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

        // 确定目标星级：吕布(107)最多30星，其他红将最多28星
        const targetStar = heroId === 107 ? 30 : 28

        // 在控制台和操作日志中显示获取的信息
        console.log(`[序号${tokenIndex}] 获取的信息：${selectedHeroName}：${heroStar}星，碎片：${heroFragmentCount}，万能红：${universalRedCount}，目标：${targetStar}星`)
        message.info(`[序号${tokenIndex}] ${token.name || token.id} - 获取的信息：${selectedHeroName}：${heroStar}星，碎片：${heroFragmentCount}，万能红：${universalRedCount}，目标：${targetStar}星`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
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
          cardType: '武将',
          operation: '使用万能红',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]计算结果：升${targetStar}星需${totalFragmentNeeded}碎片，缺${universalRedNeeded}万能红，实际使用${actualUseCount}个`
        })

        // 判断是否是吕布
        const isSpecialHero = selectedUniversalRedHero.value === 107

        // 条件判断：吕布>=30星停止，其他红将>=28星停止
        if (isSpecialHero && heroStar >= 30) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${selectedHeroName}已${heroStar}星（>=30星），停止使用万能红`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
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
            cardType: '武将',
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
            cardType: '武将',
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
            cardType: '武将',
            operation: '使用万能红',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红${totalUsed}个（原${heroStar}星）`
          })

          // 动态判断：总碎片（原碎片 + 使用的万能红）是否足够升到下一星
          let currentStar = heroStar
          let remainingFragments = heroFragmentCount + totalUsed
          let totalUpgradeCount = 0

          while (currentStar < targetStar) {
            const costForNextStar = STAR_DICT[currentStar]?.cost || 0
            
            if (remainingFragments >= costForNextStar) {
              // 碎片足够，执行升星
              remainingFragments -= costForNextStar
              
              try {
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 第${totalUpgradeCount + 1}次升星（${currentStar}→${currentStar + 1}星，消耗${costForNextStar}碎片）...`)
                
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradestar',
                  { heroId: selectedUniversalRedHero.value },
                  8000
                )

                totalUpgradeCount++
                currentStar++
                message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升星成功：${currentStar}星`)

                await waitCommandDelay()
              } catch (error) {
                const errorMsg = error.message || String(error)
                if (errorMsg.includes('物品数量不足') || errorMsg.includes('400010')) {
                  message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 碎片不足，停止升星`)
                  break
                }
                message.error(`[序号${tokenIndex}] ${token.name || token.id} - 升星失败：${errorMsg}`)
                break
              }
            } else {
              // 碎片不足以升到下一星
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 剩余碎片${remainingFragments}，不足以升到${currentStar + 1}星（需要${costForNextStar}碎片），停止升星`)
              break
            }
          }

          if (totalUpgradeCount > 0) {
            message.success(`[序号${tokenIndex}] ${token.name || token.id} - 升星完成，共升星${totalUpgradeCount}次（${heroStar}→${currentStar}星）`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '使用万能红',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红${totalUsed}个，升星${totalUpgradeCount}次（${heroStar}→${currentStar}星）`
            })
          } else {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '使用万能红',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]使用万能红${totalUsed}个（碎片不足以升星，原${heroStar}星）`
            })
          }
        }

      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} - 使用万能红失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id} - 使用万能红失败: ${error.message || '未知错误'}`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
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
      cardType: '武将',
      operation: '使用万能红',
      status: 'success',
      message: `批量使用万能红完成，目标英雄: ${selectedHeroName}，共处理${targetTokens.length}个Token`
    })

  } catch (error) {
    console.error('批量使用万能红失败:', error)
    message.error(`批量使用万能红失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '使用万能红',
      status: 'error',
      message: `批量使用万能红失败: ${error.message || '未知错误'}`
    })
  } finally {
    isUsingUniversalRed.value = false
  }
}

// 3. 批量升星
const handleUpgradeLuBuStar = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  if (!selectedUpgradeStarHero.value) {
    message.warning('请先选择英雄')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  const isPassive = selectedUpgradeStarHero.value === 'passive'

  try {
    isUpgradingLuBuStar.value = true

    if (isPassive) {
      message.info(`开始批量升星被动紫将（${rangeText}），共${targetTokens.length}个Token...`)
    } else {
      const selectedHeroName = HERO_DICT[selectedUpgradeStarHero.value]?.name || '未知英雄'
      message.info(`开始批量升星（${rangeText}），目标英雄: ${selectedHeroName}，共${targetTokens.length}个Token...`)
    }

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      if (isPassive) {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始被动紫将升星...`)
      } else {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始升星...`)
      }

      try {
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

        if (isPassive) {
          for (const hero of passiveHeroes) {
            await upgradeSingleHero(token, tokenIndex, hero.id, hero.name)
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
          cardType: '武将',
          operation: '批量升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]升星失败：${error.message || '未知错误'}`
        })
      } finally {
        if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
          await tokenStore.closeWebSocketConnection(token.id)
        }
      }

      if (i < targetTokens.length - 1) {
        message.info(`等待 1 秒后处理下一个Token...`)
        await waitCommandDelay()
      }
    }

    if (isPassive) {
      message.success(`批量升星被动紫将完成，共处理${targetTokens.length}个Token`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升星',
        status: 'success',
        message: `批量升星被动紫将完成，共处理${targetTokens.length}个Token`
      })
    } else {
      const selectedHeroName = HERO_DICT[selectedUpgradeStarHero.value]?.name || '未知英雄'
      message.success(`批量升星完成，共处理${targetTokens.length}个Token`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升星',
        status: 'success',
        message: `批量升星完成，目标英雄: ${selectedHeroName}，共处理${targetTokens.length}个Token`
      })
    }

  } catch (error) {
    console.error('批量升星失败:', error)
    message.error(`批量升星失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升星',
      status: 'error',
      message: `批量升星失败: ${error.message || '未知错误'}`
    })
  } finally {
    isUpgradingLuBuStar.value = false
  }
}

// 4. 批量英雄合成
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
  
  if (!selectedSyntheticHero.value) {
    message.warning('请先选择英雄')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量英雄合成（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
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
          
          // 根据选择确定itemId
          let itemId
          if (selectedSyntheticHero.value === 'lvbu') {
            // 选择吕布，执行参数107
            itemId = 107
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成吕布...`)
          } else if (selectedSyntheticHero.value === 'zhangfei') {
            // 选择张飞，执行参数204
            itemId = 204
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成张飞...`)
          } else if (selectedSyntheticHero.value === 'hetaishici') {
            // 选择合太史慈，执行参数120
            itemId = 120
            message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在合成太史慈...`)
          } else if (selectedSyntheticHero.value === 'heguojia') {
            // 选择合郭嘉，执行参数102
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
              cardType: '武将',
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
            cardType: '武将',
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
            cardType: '武将',
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
    
    message.success(`批量英雄合成完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量英雄合成',
      status: 'success',
      message: `批量英雄合成完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量英雄合成出错:', error)
    message.error(`批量英雄合成出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量英雄合成',
      status: 'error',
      message: `批量英雄合成出错：${error.message || error}`
    })
  } finally {
    isBatchHeroSynthetic.value = false
  }
}

// 5. 购买升级鱼灵
const handleUpgradeChiYu = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  const rangeText = tokenIndices === null ? '全部' : `范围${executionTokens.value}`
  const action = selectedFishSpiritAction.value
  const actionLabel = fishSpiritOptions.find(opt => opt.value === action)?.label || '未知操作'

  try {
    isUpgradingChiYu.value = true

    message.info(`开始${actionLabel}（${rangeText}），共${targetTokens.length}个Token...`)

    // 逐个处理Token
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始${actionLabel}...`)

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
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} - Token连接失败，跳过`)
            continue
          }
        }

        // 根据选择的操作执行不同的命令
        if (action === 'equip_shigu') {
          // 购买并装备蚀骨
          // 1. 购买蚀骨
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 购买蚀骨`)
          try {
            await tokenStore.sendActivityBuyGoods(token.id, {
              type: 1,
              goodsId: 8212
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 购买蚀骨成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 购买蚀骨失败:`, error.message)
          }
          await waitCommandDelay()

          // 2. 装备蚀骨
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 装备蚀骨`)
          try {
            await tokenStore.sendArtifactLoad(token.id, {
              heroId: 107,
              itemId: 12121,
              targetHeroId: -1,
              pearlId: 0
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 装备蚀骨成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 装备蚀骨失败:`, error.message)
          }
        } else if (action === 'upgrade_shigu') {
          // 购买并升级蚀骨
          // 1. 购买蚀骨
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 购买蚀骨`)
          try {
            await tokenStore.sendActivityBuyGoods(token.id, {
              type: 1,
              goodsId: 8212
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 购买蚀骨成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 购买蚀骨失败:`, error.message)
          }
          await waitCommandDelay()

          // 2. 升级蚀骨
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 升级蚀骨`)
          try {
            await tokenStore.sendArtifactUpgradeStar(token.id, {
              heroId: 107,
              itemId: 12121
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 升级蚀骨成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 升级蚀骨失败:`, error.message)
          }
        } else if (action === 'upgrade_chiyu') {
          // 购买并升级赤羽
          // 1. 购买赤羽
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 购买赤羽`)
          try {
            await tokenStore.sendActivityBuyGoods(token.id, {
              type: 1,
              goodsId: 8304
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 购买赤羽成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 购买赤羽失败:`, error.message)
          }
          await waitCommandDelay()

          // 2. 升级赤羽
          message.info(`[序号${tokenIndex}] ${token.name || token.id} - 升级赤羽`)
          try {
            await tokenStore.sendArtifactUpgradeStar(token.id, {
              heroId: 107,
              itemId: 13041
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 升级赤羽成功`)
          } catch (error) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} - 升级赤羽失败:`, error.message)
          }
        }

        message.success(`[序号${tokenIndex}] ${token.name || token.id} - ${actionLabel}完成`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '购买升级鱼灵',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${actionLabel}完成`
        })

      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} - ${actionLabel}失败:`, error)
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} - ${actionLabel}失败：${error.message || '未知错误'}`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '购买升级鱼灵',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: `【序号${tokenIndex}】[${token.name || token.id}]${actionLabel}失败：${error.message || '未知错误'}`
        })
      } finally {
        // 关闭WebSocket连接
        if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
          await tokenStore.closeWebSocketConnection(token.id)
        }
      }

      // 处理完一个Token后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待1秒后处理下一个Token...`)
        await waitCommandDelay()
      }
    }

    message.success(`${actionLabel}完成，共处理${targetTokens.length}个Token`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '购买升级鱼灵',
      status: 'success',
      message: `${actionLabel}完成，共处理${targetTokens.length}个Token`
    })

  } catch (error) {
    console.error(`${actionLabel}失败:`, error)
    message.error(`${actionLabel}失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '购买升级鱼灵',
      status: 'error',
      message: `${actionLabel}失败：${error.message || '未知错误'}`
    })
  } finally {
    isUpgradingChiYu.value = false
  }
}

// 6. 批量觉醒
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

        // 对index -1, 0, 1, 2各执行一次觉醒
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
                cardType: '武将',
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
              cardType: '武将',
              operation: '觉醒',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `【序号${tokenIndex}】[${token.name || token.id}]觉醒失败 (index: ${index}): ${error.message}，继续执行`
            })
            failCount++
            // 失败也继续执行下一个index
          }

          // 每次执行后等待500ms
          if (i < indices.length - 1) {
            await waitCommandDelay()
          }
        }

        message.success(`[序号${tokenIndex}] ${token.name || token.id} - 觉醒完成 (成功：${successCount}/4, 失败：${failCount}/4)`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
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
      cardType: '武将',
      operation: '觉醒',
      status: 'success',
      message: `批量觉醒完成，共执行 ${totalSuccess + totalFail} 次，成功 ${totalSuccess} 次，失败 ${totalFail} 次`
    })

  } catch (error) {
    console.error('批量觉醒失败:', error)
    message.error(`批量觉醒失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '觉醒',
      status: 'error',
      message: `批量觉醒失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchAwakingSkill.value = false
  }
}

// 辅助函数：计算主公升级数量
const calculateLordUpgradeNum = (currentLevel) => {
  if (currentLevel === 4000) {
    return 1
  }

  const lastTwoDigits = currentLevel % 100

  if (lastTwoDigits === 0 || lastTwoDigits === 50) {
    return 50
  } else {
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

// 获取下一个升级等级
const getNextUpgradeLevel = (currentLevel, upgradeLevels) => {
  for (const level of upgradeLevels) {
    if (level > currentLevel) {
      return level
    }
  }
  return null
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

// 主公升级
const upgradeLord = async (token, tokenIndex, upgradeNum) => {
  try {
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradelevel命令: 升级${upgradeNum}级`
    })

    await tokenStore.sendHeroLordUpgradeLevel(token.id, {
      upgradeNum: upgradeNum
    })

    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级成功: +${upgradeNum}级`
    })
  } catch (error) {
    const errorMsg = String(error.message || '').toLowerCase()
    if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级失败: 需要升阶，准备执行升阶命令`
      })

      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradeorder命令: 升阶`
        })

        await tokenStore.sendHeroLordUpgradeOrder(token.id, {})

        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶成功`
        })

        await tokenStore.sendHeroLordUpgradeLevel(token.id, {
          upgradeNum: upgradeNum
        })

        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: +${upgradeNum}级`
        })
      } catch (orderError) {
        const orderErrorMsg = String(orderError.message || '').toLowerCase()
        if (orderErrorMsg.includes('物品数量不足') || orderErrorMsg.includes('金币数量不足')) {
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶失败: 物品数量不足，停止执行`
          })
          throw new Error('主公升级失败: 物品数量不足')
        } else {
          throw orderError
        }
      }
    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
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

// 武将升级
const upgradeHero = async (token, tokenIndex, heroId, upgradeNum) => {
  try {
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_upgradelevel命令: 英雄${heroId}升级${upgradeNum}级`
    })

    await tokenStore.sendHeroUpgradeLevel(token.id, {
      heroId: heroId,
      upgradeNum: upgradeNum
    })

    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升级成功: +${upgradeNum}级`
    })
  } catch (error) {
    const errorMsg = String(error.message || '').toLowerCase()
    if (errorMsg.includes('升阶') || errorMsg.includes('进阶') || errorMsg.includes('400060')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升级失败: 需要升阶，准备执行升阶命令`
      })

      try {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_upgradeorder命令: 英雄${heroId}升阶`
        })

        await tokenStore.sendHeroUpgradeOrder(token.id, {
          heroId: heroId
        })

        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升阶成功`
        })

        await tokenStore.sendHeroUpgradeLevel(token.id, {
          heroId: heroId,
          upgradeNum: upgradeNum
        })

        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升阶后升级成功: +${upgradeNum}级`
        })
      } catch (orderError) {
        const orderErrorMsg = String(orderError.message || '').toLowerCase()
        if (orderErrorMsg.includes('物品数量不足') || orderErrorMsg.includes('金币数量不足')) {
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升阶失败: 物品数量不足，停止执行`
          })
          throw new Error('武将升级失败: 物品数量不足')
        } else {
          throw orderError
        }
      }
    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'warning',
        message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升级失败: 物品数量不足，停止执行`
      })
      throw new Error('武将升级失败: 物品数量不足')
    } else {
      throw error
    }
  }
}

// 检查并执行升阶
const checkAndUpgradeOrder = async (token, tokenIndex, type, level, heroId = null) => {
  const upgradeLevels = [100, 200, 300, 500, 700, 900, 1100, 1300, 1500, 1800, 2100, 2400, 2800, 3200, 3600, 4000, 4500, 5000, 5500, 6000]
  
  if (upgradeLevels.includes(level)) {
    try {
      if (type === 'lord') {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公达到${level}级，执行升阶命令`
        })

        await tokenStore.sendHeroLordUpgradeOrder(token.id, {})

        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶成功`
        })
      } else if (type === 'hero' && heroId) {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}达到${level}级，执行升阶命令`
        })

        await tokenStore.sendHeroUpgradeOrder(token.id, {
          heroId: heroId
        })

        logStore.addLog({
          page: 'fish-helper',
          cardType: '武将',
          operation: '批量升级主公武将',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]武将${heroId}升阶成功`
        })
      }
    } catch (error) {
      console.error(`升阶失败:`, error)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '武将',
        operation: '批量升级主公武将',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `【序号${tokenIndex}】[${token.name || token.id}]升阶失败: ${error.message}`
      })
    }
  }
}

// 执行主公升阶命令
const upgradeLordOrder = async (token, tokenIndex) => {
  try {
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `【序号${tokenIndex}】[${token.name || token.id}]执行hero_lordupgradeorder命令进行升阶`
    })

    await tokenStore.sendHeroLordUpgradeOrder(token.id, {})

    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
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
        cardType: '武将',
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
      cardType: '武将',
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
      cardType: '武将',
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
      cardType: '武将',
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
        cardType: '武将',
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
      cardType: '武将',
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

// 7. 批量升级主公武将
const handleBatchUpgradeLord = async () => {
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

  const upgradeLevels = [100, 200, 300, 500, 700, 900, 1100, 1300, 1500, 1800, 2100, 2400, 2800, 3200, 3600, 4000, 4500, 5000, 5500, 6000]

  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量升级主公武将（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
    operation: '批量升级主公武将',
    status: 'info',
    message: `开始批量升级主公武将，${rangeText}，共${targetTokens.length}个Token`
  })

  try {
    isBatchUpgradingLord.value = true

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行升级主公武将...`)

          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]执行role_getroleinfo命令，获取主公和吕布等级`
          })

          const roleResult = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()

          // 从响应中获取主公等级和阶数
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

          // 从响应中获取吕布等级和阶数
          let luBuLevel = 0
          let luBuOrder = 0
          if (roleResult && roleResult.role && roleResult.role.heroes) {
            const luBu = roleResult.role.heroes['107'] || roleResult.role.heroes[107]
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          } else if (roleResult && roleResult._raw && roleResult._raw.body && roleResult._raw.body.role && roleResult._raw.body.role.heroes) {
            const luBu = roleResult._raw.body.role.heroes['107'] || roleResult._raw.body.role.heroes[107]
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          } else if (roleResult && roleResult.body && roleResult.body.role && roleResult.body.role.heroes) {
            const luBu = roleResult.body.role.heroes['107'] || roleResult.body.role.heroes[107]
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          } else if (roleResult && roleResult.heroes) {
            const luBu = roleResult.heroes['107'] || roleResult.heroes[107]
            if (luBu) {
              luBuLevel = luBu.level || 0
              luBuOrder = luBu.order || 0
            }
          }

          if (luBuLevel === 0) {
            throw new Error('无法获取吕布等级')
          }

          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]获取等级成功: 主公${lordLevel}级，吕布${luBuLevel}级`
          })

          // 检查主公和吕布是否都已满级（6000级）
          if (lordLevel >= 6000 && luBuLevel >= 6000) {
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '批量升级主公武将',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]主公和吕布都已满级（6000级），不再执行升级`
            })
            message.info(`[序号${tokenIndex}] ${token.name || token.id} - 主公和吕布都已满级（6000级），跳过升级`)
            return { success: true, token: token, skipped: true, reason: '已满级' }
          }

          // 比较并升级，根据阶数决定升级顺序
          let currentLordLevel = lordLevel
          let currentLuBuLevel = luBuLevel
          let currentLordOrder = lordOrder
          let currentLuBuOrder = luBuOrder
          let upgradeCount = 0
          const maxUpgrades = 100

          // 检查是否需要升阶
          await checkAndUpgradeOrder(token, tokenIndex, 'lord', currentLordLevel)
          await checkAndUpgradeOrder(token, tokenIndex, 'hero', currentLuBuLevel, 107)

          while (upgradeCount < maxUpgrades) {
            // 比较阶数
            if (currentLordOrder > currentLuBuOrder) {
              // 主公阶数高，升级吕布
              logStore.addLog({
                page: 'fish-helper',
                cardType: '武将',
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
                  cardType: '武将',
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
                  cardType: '武将',
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
                    cardType: '武将',
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
                      cardType: '武将',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升阶后升级成功: 4000 → 4001`
                    })
                  } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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
                  cardType: '武将',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级成功: ${currentLuBuLevel - upgradeNum} → ${currentLuBuLevel}`
                })

                // 到达指定等级后，执行一次升阶命令
                await checkAndUpgradeOrder(token, tokenIndex, 'hero', currentLuBuLevel, 107)

                // 升级后更新阶数
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
                    cardType: '武将',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升阶后升级成功: ${currentLuBuLevel - upgradeNum} → ${currentLuBuLevel}`
                  })

                  if (upgradeLevels.includes(currentLuBuLevel)) {
                    currentLuBuOrder = await getHeroOrder(token, tokenIndex, 107)
                  }
                } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '武将',
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
              // 同阶，先升级主公到下一阶级等级
              const nextLordLevel = getNextUpgradeLevel(currentLordLevel, upgradeLevels)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '武将',
                operation: '批量升级主公武将',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]主公和吕布同阶${currentLordOrder}，先升级主公到下一阶级等级${nextLordLevel}级，再升级吕布。`
              })

              if (nextLordLevel === null) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '武将',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]主公已达到最高等级${currentLordLevel}，停止升级`
                })
                break
              }

              // 循环升级，直到达到下一阶级等级
              while (currentLordLevel < nextLordLevel) {
                const upgradeNum = calculateLordUpgradeNum(currentLordLevel)

                // 特别处理4000级
                if (currentLordLevel === 4000) {
                  try {
                    await upgradeLord(token, tokenIndex, 1)
                    currentLordLevel = 4001
                    upgradeCount++
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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
                        cardType: '武将',
                        operation: '批量升级主公武将',
                        tokenId: token.id,
                        tokenName: token.name,
                        status: 'success',
                        message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: 4000 → 4001`
                      })
                    } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                      logStore.addLog({
                        page: 'fish-helper',
                        cardType: '武将',
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
                    cardType: '武将',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
                  })

                  // 到达指定等级后，执行一次升阶命令
                  await checkAndUpgradeOrder(token, tokenIndex, 'lord', currentLordLevel)

                  // 升级后更新阶数
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
                      cardType: '武将',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
                    })

                    if (upgradeLevels.includes(currentLordLevel)) {
                      currentLordOrder = await getLordOrder(token, tokenIndex)
                    }
                  } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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
                cardType: '武将',
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
                    cardType: '武将',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升级成功: ${currentLuBuLevel - actualUpgradeNum} → ${currentLuBuLevel}`
                  })

                  // 到达指定等级后，执行一次升阶命令
                  await checkAndUpgradeOrder(token, tokenIndex, 'hero', currentLuBuLevel, 107)

                  // 升级后更新阶数
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
                      cardType: '武将',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]吕布升阶后升级成功: ${currentLuBuLevel - actualUpgradeNum} → ${currentLuBuLevel}`
                    })

                    if (upgradeLevels.includes(currentLuBuLevel)) {
                      currentLuBuOrder = await getHeroOrder(token, tokenIndex, 107)
                    }
                  } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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
            } else {
              // 吕布阶数高，升级主公
              logStore.addLog({
                page: 'fish-helper',
                cardType: '武将',
                operation: '批量升级主公武将',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]吕布阶数${currentLuBuOrder}高于主公阶数${currentLordOrder}，升级主公`
              })

              const nextLevel = getNextUpgradeLevel(currentLordLevel, upgradeLevels)
              if (nextLevel === null) {
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '武将',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]主公已达到最高等级${currentLordLevel}，停止升级`
                })
                break
              }

              // 特别处理4000级
              if (currentLordLevel === 4000) {
                try {
                  await upgradeLord(token, tokenIndex, 1)
                  currentLordLevel = 4001
                  upgradeCount++
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '武将',
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
                      cardType: '武将',
                      operation: '批量升级主公武将',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'success',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: 4000 → 4001`
                    })
                  } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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

              const upgradeNum = calculateLordUpgradeNum(currentLordLevel)
              try {
                await upgradeLord(token, tokenIndex, upgradeNum)
                currentLordLevel = currentLordLevel + upgradeNum
                upgradeCount++
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '武将',
                  operation: '批量升级主公武将',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]主公升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
                })

                // 到达指定等级后，执行一次升阶命令
                await checkAndUpgradeOrder(token, tokenIndex, 'lord', currentLordLevel)

                // 升级后更新阶数
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
                    cardType: '武将',
                    operation: '批量升级主公武将',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]主公升阶后升级成功: ${currentLordLevel - upgradeNum} → ${currentLordLevel}`
                  })

                  if (upgradeLevels.includes(currentLordLevel)) {
                    currentLordOrder = await getLordOrder(token, tokenIndex)
                  }
                } else if (errorMsg.includes('物品数量不足') || errorMsg.includes('金币数量不足')) {
                  logStore.addLog({
                    page: 'fish-helper',
                    cardType: '武将',
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
          }

          message.success(`[序号${tokenIndex}] ${token.name || token.id} 升级主公武将完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级主公武将完成: 主公${currentLordLevel}级，吕布${currentLuBuLevel}级`
          })
          return { success: true, tokenId: token.id }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级主公武将失败:`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 升级主公武将失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量升级主公武将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级主公武将失败: ${error.message}`
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
    
    message.success(`批量升级主公武将完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      status: 'success',
      message: `批量升级主公武将完成：成功 ${successCount} 个，失败 ${failureCount} 个`
    })

  } catch (error) {
    console.error('批量升级主公武将失败:', error)
    message.error(`批量升级主公武将失败: ${error.message}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级主公武将',
      status: 'error',
      message: `批量升级主公武将失败: ${error.message}`
    })
  } finally {
    isBatchUpgradingLord.value = false
  }
}

// 8. 批量激活玩具阵容 - 获取红将和紫将星级最高的4个武将上阵到slot1-slot4
const handleBatchActivateToyTeam = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量激活玩具阵容（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
    operation: '批量激活玩具阵容',
    status: 'info',
    message: `开始批量激活玩具阵容，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchActivatingToyTeam.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在激活玩具阵容...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量激活玩具阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 开始激活玩具阵容`
          })
          
          // 0. 先切换到阵容1
          try {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 切换到阵容1...`)
            await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
            await waitCommandDelay()
          } catch (switchError) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} 切换阵容失败，继续执行:`, switchError)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 切换阵容失败，继续执行`)
          }
          
          // 1. 使用 role_getroleinfo 获取角色信息
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          await waitCommandDelay()
          
          // 2. 解析武将数据（兼容多种响应格式）
          let heroesData = null
          if (roleInfo && roleInfo.role && roleInfo.role.heroes) {
            heroesData = roleInfo.role.heroes
          } else if (roleInfo && roleInfo._raw && roleInfo._raw.body && roleInfo._raw.body.role && roleInfo._raw.body.role.heroes) {
            heroesData = roleInfo._raw.body.role.heroes
          } else if (roleInfo && roleInfo.body && roleInfo.body.role && roleInfo.body.role.heroes) {
            heroesData = roleInfo.body.role.heroes
          } else if (roleInfo && roleInfo.heroes) {
            heroesData = roleInfo.heroes
          }
          
          if (!heroesData) {
            throw new Error('获取角色信息失败')
          }
          
          // 3. 收集红将(101-121，排除吕布107)和紫将(301-314)的星级
          const heroStars = []
          
          // 红将：101-121，排除吕布(107)
          for (let i = 101; i <= 121; i++) {
            if (i === 107) continue // 排除吕布
            const hero = heroesData[String(i)] || heroesData[i]
            if (hero) {
              const star = hero.star || 0
              const heroName = HERO_DICT[i]?.name || `武将${i}`
              heroStars.push({ heroId: i, heroName, star })
            }
          }
          
          // 紫将：301-314
          for (let i = 301; i <= 314; i++) {
            const hero = heroesData[String(i)] || heroesData[i]
            if (hero) {
              const star = hero.star || 0
              const heroName = HERO_DICT[i]?.name || `武将${i}`
              heroStars.push({ heroId: i, heroName, star })
            }
          }
          
          // 4. 按星级降序排序，选出星级最高的4个
          heroStars.sort((a, b) => b.star - a.star)
          const top4Heroes = heroStars.slice(0, 4)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量激活玩具阵容',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 星级最高的4个武将：${top4Heroes.map((h, i) => `${h.heroName}(${h.star}星)→slot${i+1}`).join('，')}`
          })
          
          // 5. 对每个武将执行 hero_gointobattle 命令，上阵到 slot1-slot4
          for (let i = 0; i < top4Heroes.length; i++) {
            const hero = top4Heroes[i]
            const slot = i + 1
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '批量激活玩具阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `[序号${tokenIndex}] 上阵${hero.heroName}(${hero.star}星)到slot${slot}`
            })
            
            await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_gointobattle',
              { heroId: hero.heroId, slot: slot },
              5000
            )
            await waitCommandDelay()
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '批量激活玩具阵容',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `[序号${tokenIndex}] ${hero.heroName}上阵到slot${slot}成功`
            })
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 玩具阵容激活完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
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
            cardType: '武将',
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
    
    message.success(`批量激活玩具阵容完成：成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量激活玩具阵容',
      status: 'success',
      message: `批量激活玩具阵容完成：成功${successCount}个，失败${failCount}个`
    })
    
  } catch (error) {
    console.error('批量激活玩具阵容失败:', error)
    message.error(`批量激活玩具阵容失败：${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量激活玩具阵容',
      status: 'error',
      message: `批量激活玩具阵容失败：${error.message || '未知错误'}`
    })
  } finally {
    isBatchActivatingToyTeam.value = false
  }
}

// 9. 批量升级玩具
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
  
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
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
  else if (upgradeMode === 'passive4') modeName = '被动四'
  
  message.info(`开始批量升级玩具-${modeName}（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
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
            cardType: '武将',
            operation: '批量升级玩具',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]开始升级玩具-${modeName}`
          })
          
          // 先执行 lordweapon_get 获取玩具信息
          await tokenStore.sendMessageWithPromise(
            token.id,
            'lordweapon_get',
            {},
            5000
          )
          await waitCommandDelay()
          
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
              cardType: '武将',
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
                  cardType: '武将',
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
                  cardType: '武将',
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
              cardType: '武将',
              operation: '批量升级玩具',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `玩具主动升级完成，共执行${upgradeCount}次`
            })
          } else if (upgradeMode === 'passive1' || upgradeMode === 'passive2' || upgradeMode === 'passive3' || upgradeMode === 'passive4') {
            let skillId = 9
            let skillName = '被动一'
            if (upgradeMode === 'passive2') {
              skillId = 10
              skillName = '被动二'
            } else if (upgradeMode === 'passive3') {
              skillId = 11
              skillName = '被动三'
            } else if (upgradeMode === 'passive4') {
              skillId = 12
              skillName = '被动四'
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
                  cardType: '武将',
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
                  cardType: '武将',
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
              cardType: '武将',
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
            cardType: '武将',
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
      cardType: '武将',
      operation: '批量升级玩具',
      status: 'success',
      message: `批量升级玩具-${modeName}完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量升级玩具出错:', error)
    message.error(`批量升级玩具出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级玩具',
      status: 'error',
      message: `批量升级玩具出错：${error.message || error}`
    })
  } finally {
    isBatchUpgradingToys.value = false
  }
}

// 10. 批量升级（推图模式）
const handleBatchUpgrade900 = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 从武将子卡片表格中获取要升级的武将（slot 0-4）
  const upgradeHeroes = []
  for (let slot = 0; slot < 5; slot++) {
    const heroId = selectedHeroes.value[slot] ? parseInt(selectedHeroes.value[slot]) : null
    if (heroId) {
      const heroName = HERO_DICT[heroId]?.name || heroId
      // 魏延升到250级，其他升到900级
      const maxLevel = heroId === 217 ? 250 : 900
      upgradeHeroes.push({ heroId, name: heroName, maxLevel })
    }
  }
  
  if (upgradeHeroes.length === 0) {
    message.warning('请先在武将子卡片表格中选择要升级的武将')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  const heroNames = upgradeHeroes.map(h => `${h.name}(${h.maxLevel}级)`).join('、')
  message.info(`开始批量升级（${rangeText}），共${targetTokens.length}个Token，升级武将：${heroNames}`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
    operation: '批量升级',
    status: 'info',
    message: `开始批量升级，${rangeText}，共${targetTokens.length}个Token，升级武将：${heroNames}`
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
          
          // 使用武将子卡片表格中的武将列表
          const storyHeroes = upgradeHeroes
          
          for (const storyHero of storyHeroes) {
            const hero = heroesData[String(storyHero.heroId)] || heroesData[storyHero.heroId]
            if (!hero) {
              logStore.addLog({
                page: 'fish-helper',
                cardType: '武将',
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
                cardType: '武将',
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
              cardType: '武将',
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
                  cardType: '武将',
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
                    cardType: '武将',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'warning',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${storyHero.name}升级失败: 未进阶，准备执行升阶命令`
                  })
                  try {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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
                      cardType: '武将',
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
                      cardType: '武将',
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
                    cardType: '武将',
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
                      cardType: '武将',
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
                    cardType: '武将',
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
              cardType: '武将',
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
            cardType: '武将',
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
            cardType: '武将',
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
      cardType: '武将',
      operation: '批量升级',
      status: 'success',
      message: `批量升级完成：成功${successCount}个，失败${failCount}个`
    })
    
  } catch (error) {
    console.error('批量升级失败:', error)
    message.error(`批量升级失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级',
      status: 'error',
      message: `批量升级失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgrading900.value = false
  }
}

// 10.5 批量升级单个英雄
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
  
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
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
    cardType: '武将',
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
              cardType: '武将',
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
              cardType: '武将',
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
            cardType: '武将',
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
                cardType: '武将',
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
                  cardType: '武将',
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
                    cardType: '武将',
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
                    cardType: '武将',
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
                  cardType: '武将',
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
                    cardType: '武将',
                    operation: '批量升级',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'success',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]${heroName}升级成功: ${oldLevel} → ${level}`
                  })
                  if (level > 750) {
                    logStore.addLog({
                      page: 'fish-helper',
                      cardType: '武将',
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
                    cardType: '武将',
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
                  cardType: '武将',
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
            cardType: '武将',
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
            cardType: '武将',
            operation: '批量升级',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]升级${heroName}失败: ${error.message || '未知错误'}`
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
      cardType: '武将',
      operation: '批量升级',
      status: 'success',
      message: `批量升级${heroName}完成：成功${successCount}个，失败${failCount}个`
    })
    
  } catch (error) {
    console.error('批量升级单个英雄失败:', error)
    message.error(`批量升级单个英雄失败: ${error.message || '未知错误'}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量升级',
      status: 'error',
      message: `批量升级单个英雄失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchUpgrading900.value = false
  }
}

// 从fight_startlevel响应中提取当前阵容（slot 0-4 -> heroId）
const extractCurrentTeamFromFight = (fightResult) => {
  let battleTeam = null
  if (fightResult?.battleData?.leftTeam?.team) {
    battleTeam = fightResult.battleData.leftTeam.team
  } else if (fightResult?.leftTeam?.team) {
    battleTeam = fightResult.leftTeam.team
  }
  
  const team = {}
  if (battleTeam) {
    for (let i = 0; i < 5; i++) {
      const hero = battleTeam[String(i)] || battleTeam[i]
      team[i] = hero?.id ? Number(hero.id) : null
    }
  }
  return team
}

// 10. 批量换将 - 通过fight_startlevel获取当前阵容，对不同的执行hero_exchange
const handleBatchReplaceHero = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices.map(i => sortedTokensList[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 检查是否有选择武将
  const hasSelection = selectedHeroes.value.some(h => h !== '' && h !== null)
  if (!hasSelection) {
    message.warning('请先在阵容选择区域选择要替换的武将')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量换将（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
    operation: '批量换将',
    status: 'info',
    message: `开始批量换将（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchReplacingHero.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          
          // 根据阵容切换开关切换阵容
          try {
            if (team1Enabled.value) {
              message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在切换到阵容一...`)
              await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
              await waitCommandDelay()
            } else if (team2Enabled.value) {
              message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在切换到阵容二...`)
              await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
              await waitCommandDelay()
            }
          } catch (switchError) {
            console.warn(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 切换阵容失败，继续执行:`, switchError)
            message.warning(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 切换阵容失败，继续执行`)
          }
          
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在获取当前阵容...`)
          
          // 获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          const currentTeam = extractCurrentTeamFromFight(fightResult)
          
          let exchangeCount = 0
          
          // 检查每个slot
          for (let slot = 0; slot < 5; slot++) {
            const targetHeroId = selectedHeroes.value[slot] ? parseInt(selectedHeroes.value[slot]) : null
            if (!targetHeroId) continue
            
            const currentHeroId = currentTeam[slot]
            
            if (currentHeroId === targetHeroId) {
              // heroId相同，跳过
              logStore.addLog({
                page: 'fish-helper',
                cardType: '武将',
                operation: '批量换将',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]位置${slot}武将相同(${HERO_DICT[targetHeroId]?.name || targetHeroId})，跳过`
              })
              continue
            }
            
            // heroId不同，执行hero_exchange
            const currentName = currentHeroId ? (HERO_DICT[currentHeroId]?.name || currentHeroId) : '空'
            const targetName = HERO_DICT[targetHeroId]?.name || targetHeroId
            
            message.info(`[${tokenIndex}] ${token.name || token.id} 位置${slot}: ${currentName} → ${targetName}`)
            
            await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_exchange',
              { heroId: currentHeroId, targetHeroId: targetHeroId },
              5000
            )
            await waitCommandDelay()
            exchangeCount++
            
            // 更新currentTeam，反映换将后的实际阵容
            // hero_exchange会交换两个武将的位置，需要找到targetHeroId在currentTeam中的位置
            let targetHeroSlot = -1
            for (let s = 0; s < 5; s++) {
              if (currentTeam[s] === targetHeroId) {
                targetHeroSlot = s
                break
              }
            }
            if (targetHeroSlot !== -1) {
              // 交换slot和targetHeroSlot的武将
              currentTeam[slot] = targetHeroId
              currentTeam[targetHeroSlot] = currentHeroId
            }
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '批量换将',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]位置${slot}: ${currentName} → ${targetName}`
            })
          }
          
          message.success(`【序号${tokenIndex}】[${token.name || token.id}]换将完成，共换${exchangeCount}个`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量换将',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]换将完成，共换${exchangeCount}个`
          })
          
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 换将失败:`, error)
          throw error
        }
      }
    )
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    message.success(`批量换将完成！成功：${successCount}，失败：${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量换将',
      status: 'success',
      message: `批量换将完成，成功：${successCount}，失败：${failCount}`
    })
    
  } catch (error) {
    console.error('批量换将失败:', error)
    message.error('批量换将失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量换将',
      status: 'error',
      message: `批量换将失败：${error.message}`
    })
  } finally {
    isBatchReplacingHero.value = false
  }
}

// 11. 批量上阵 - 通过fight_startlevel获取当前阵容，对空白位置执行hero_gointobattle
const handleBatchHeroBattle = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices.map(i => sortedTokensList[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量上阵（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
    operation: '批量上阵',
    status: 'info',
    message: `开始批量上阵（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchHeroBattle.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          
          // 根据阵容切换开关切换阵容
          try {
            if (team1Enabled.value) {
              message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在切换到阵容一...`)
              await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
              await waitCommandDelay()
            } else if (team2Enabled.value) {
              message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在切换到阵容二...`)
              await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
              await waitCommandDelay()
            }
          } catch (switchError) {
            console.warn(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 切换阵容失败，继续执行:`, switchError)
            message.warning(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 切换阵容失败，继续执行`)
          }
          
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在获取当前阵容...`)
          
          // 获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          const currentTeam = extractCurrentTeamFromFight(fightResult)
          
          let battleCount = 0
          
          // 检查每个slot
          for (let slot = 0; slot < 5; slot++) {
            const targetHeroId = selectedHeroes.value[slot] ? parseInt(selectedHeroes.value[slot]) : null
            const currentHeroId = currentTeam[slot]
            
            if (!targetHeroId) {
              // 表格为空 → 下阵该位置武将
              if (currentHeroId) {
                const heroName = HERO_DICT[currentHeroId]?.name || currentHeroId
                message.info(`[${tokenIndex}] ${token.name || token.id} 下阵${heroName}从位置${slot}`)
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_gobackbattle',
                  { heroId: currentHeroId, slot: slot },
                  5000
                )
                await waitCommandDelay()
                battleCount++
                logStore.addLog({
                  page: 'fish-helper',
                  cardType: '武将',
                  operation: '批量上阵',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `[${tokenIndex}] ${token.name || token.id} 下阵${heroName}从位置${slot}`
                })
              }
              continue
            }
            
            if (currentHeroId === targetHeroId) {
              // 表格有武将且匹配 → 跳过
              continue
            }
            
            // 表格有武将但不匹配 → 上阵表格武将
            // 表格有武将但实际该位置没有武将 → 上阵表格武将
            const targetName = HERO_DICT[targetHeroId]?.name || targetHeroId
            message.info(`[${tokenIndex}] ${token.name || token.id} 上阵${targetName}到位置${slot}`)
            
            await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_gointobattle',
              { heroId: targetHeroId, slot: slot },
              5000
            )
            await waitCommandDelay()
            battleCount++
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '批量上阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `[${tokenIndex}] ${token.name || token.id} 上阵${targetName}到位置${slot}`
            })
          }
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 上阵完成，共上阵${battleCount}个`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量上阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `上阵完成，共上阵${battleCount}个`
          })
          
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 上阵失败:`, error)
          throw error
        }
      }
    )
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    message.success(`批量上阵完成！成功：${successCount}，失败：${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量上阵',
      status: 'success',
      message: `批量上阵完成，成功：${successCount}，失败：${failCount}`
    })
    
  } catch (error) {
    console.error('批量上阵失败:', error)
    message.error('批量上阵失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量上阵',
      status: 'error',
      message: `批量上阵失败：${error.message}`
    })
  } finally {
    isBatchHeroBattle.value = false
  }
}

// 12. 批量下阵
const handleBatchUnloadHeroes = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let targetTokens
  if (tokenIndices === null) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices.map(i => sortedTokensList[i - 1]).filter(Boolean)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionTokens.value ? `范围${executionTokens.value}` : "全部"
  message.info(`开始批量下阵（${rangeText}），共${targetTokens.length}个Token...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '武将',
    operation: '批量下阵',
    status: 'info',
    message: `开始批量下阵（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isBatchUnloadingHeroes.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          
          // 根据阵容切换开关切换阵容
          try {
            if (team1Enabled.value) {
              message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在切换到阵容一...`)
              await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
              await waitCommandDelay()
            } else if (team2Enabled.value) {
              message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在切换到阵容二...`)
              await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
              await waitCommandDelay()
            }
          } catch (switchError) {
            console.warn(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 切换阵容失败，继续执行:`, switchError)
            message.warning(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 切换阵容失败，继续执行`)
          }
          
          message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在获取当前阵容...`)
          
          // 获取当前阵容
          const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
          await waitCommandDelay()
          
          const currentTeam = extractCurrentTeamFromFight(fightResult)
          
          let unloadCount = 0
          
          // 检查每个slot
          for (let slot = 0; slot < 5; slot++) {
            const targetHeroId = selectedHeroes.value[slot] ? parseInt(selectedHeroes.value[slot]) : null
            const currentHeroId = currentTeam[slot]
            
            if (!targetHeroId) {
              // 表格为空 → 跳过
              continue
            }
            
            if (!currentHeroId) {
              // 该位置没有武将 → 跳过
              continue
            }
            
            // 表格有武将（无论是否匹配）→ 下阵该位置武将
            const heroName = HERO_DICT[currentHeroId]?.name || currentHeroId
            message.info(`[${tokenIndex}] ${token.name || token.id} 下阵${heroName}从位置${slot}`)
            
            await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_gobackbattle',
              { heroId: currentHeroId, slot: slot },
              5000
            )
            await waitCommandDelay()
            unloadCount++
            
            logStore.addLog({
              page: 'fish-helper',
              cardType: '武将',
              operation: '批量下阵',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `下阵${heroName}从位置${slot}`
            })
          }
          
          message.success(`[${tokenIndex}] ${token.name || token.id} 下阵完成，共下阵${unloadCount}个`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '武将',
            operation: '批量下阵',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `下阵完成，共下阵${unloadCount}个`
          })
          
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 下阵失败:`, error)
          throw error
        }
      }
    )
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    
    message.success(`批量下阵完成！成功：${successCount}，失败：${failCount}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量下阵',
      status: 'success',
      message: `批量下阵完成，成功：${successCount}，失败：${failCount}`
    })
    
  } catch (error) {
    console.error('批量下阵失败:', error)
    message.error('批量下阵失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '批量下阵',
      status: 'error',
      message: `批量下阵失败：${error.message}`
    })
  } finally {
    isBatchUnloadingHeroes.value = false
  }
}

// 13. 导出详情
const handleExportDetails = async () => {
  const tokenIndices = parseTokenRange(executionTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)

  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  try {
    isExportingDetails.value = true
    message.info(`开始导出详情，共${targetTokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        const tokenIndex = getTokenIndex(token)
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在获取信息...`)

        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          
          if (!roleInfo || !roleInfo.role) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取角色信息失败`)
            return { success: false, tokenId: token.id, error: '获取角色信息失败' }
          }

          const role = roleInfo.role
          
          // 获取玩具被动激活情况 - lordWeapon 是对象，包含多个玩具
          const lordWeapon = role.lordWeapon || {}
          const toyPassiveInfo = []
          
          // 遍历所有玩具
          for (const [toyIndex, toyData] of Object.entries(lordWeapon)) {
            if (!toyData || !toyData.weaponId) continue
            
            const passiveSkill = toyData.passiveSkill || {}
            const passiveEntries = Object.entries(passiveSkill)
            
            // 找出最后一个被动技能（skillId最大的）
            let maxPassiveSkillId = 0
            let maxPassiveLevel = 0
            for (const [skillIndex, skillData] of passiveEntries) {
              const skillId = skillData.skillId || parseInt(skillIndex)
              if (skillId > maxPassiveSkillId) {
                maxPassiveSkillId = skillId
                maxPassiveLevel = skillData.level || 0
              }
            }
            
            // 计算被动序号：skillId 9=被动一, 10=被动二, 11=被动三...
            const passiveIndex = maxPassiveSkillId >= 9 ? maxPassiveSkillId - 8 : 0
            const passiveIndexName = passiveIndex > 0 ? `被动${passiveIndex}` : '无'
            
            const passiveActivated = maxPassiveLevel > 0
            
            toyPassiveInfo.push({
              toyId: toyData.weaponId || 0,
              toyName: getToyName(toyData.weaponId || 0),
              maxPassiveName: passiveIndexName,
              passiveLevel: maxPassiveLevel,
              passiveActivated: passiveActivated
            })
          }

          // 获取所有武将及其星级
          const heroes = role.heroes || {}
          const heroStars = []
          
          for (const [heroId, heroData] of Object.entries(heroes)) {
            const star = heroData.star || 0
            heroStars.push({
              heroId: parseInt(heroId),
              heroName: getHeroName(parseInt(heroId)),
              star: star
            })
          }

          // 按星级排序，取前5个
          heroStars.sort((a, b) => b.star - a.star)
          const top5Heroes = heroStars.slice(0, 5)
          
          // 计算星级之和
          const totalStars = top5Heroes.reduce((sum, h) => sum + h.star, 0)

          message.success(`[序号${tokenIndex}] ${token.name || token.id} 信息获取成功`)
          
          return {
            success: true,
            tokenId: token.id,
            tokenName: token.name || token.id,
            tokenIndex: tokenIndex,
            toyPassiveInfo: toyPassiveInfo,
            top5Heroes: top5Heroes,
            totalStars: totalStars
          }
        } catch (error) {
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 获取信息失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 获取信息失败: ${error.message}`)
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )

    // 过滤成功的结果（batchOperate返回格式：{success, result: {实际数据}}）
    const successResults = results.filter(r => r.success && r.result)
    const failureCount = results.filter(r => !r.success).length

    // 生成CSV内容
    let csvContent = '\uFEFF' // BOM for Excel UTF-8
    csvContent += '账号,序号,玩具名称,最高被动,被动等级,是否激活,最高星级武将1,星级1,最高星级武将2,星级2,最高星级武将3,星级3,最高星级武将4,星级4,最高星级武将5,星级5,星级之和\n'

    for (const r of successResults) {
      // 从 r.result 中获取实际数据
      const result = r.result
      // 玩具被动信息（可能有多个玩具）
      const toyPassiveInfo = result.toyPassiveInfo || []
      const top5Heroes = result.top5Heroes || []
      const totalStars = result.totalStars || 0
      
      if (toyPassiveInfo.length > 0) {
        for (const toy of toyPassiveInfo) {
          csvContent += `${result.tokenName},${result.tokenIndex},${toy.toyName},${toy.maxPassiveName},${toy.passiveLevel},${toy.passiveActivated ? '已激活' : '未激活'},`
          // 添加武将信息
          for (let i = 0; i < 5; i++) {
            if (top5Heroes[i]) {
              csvContent += `${top5Heroes[i].heroName},${top5Heroes[i].star},`
            } else {
              csvContent += ',,'
            }
          }
          csvContent += `${totalStars}\n`
        }
      } else {
        csvContent += `${result.tokenName},${result.tokenIndex},无玩具数据,,,,,`
        for (let i = 0; i < 5; i++) {
          if (top5Heroes[i]) {
            csvContent += `${top5Heroes[i].heroName},${top5Heroes[i].star},`
          } else {
            csvContent += ',,'
          }
        }
        csvContent += `${totalStars}\n`
      }
    }

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `账号详情_${new Date().getTime()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success(`导出详情完成：成功 ${successResults.length} 个，失败 ${failureCount} 个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '导出详情',
      status: 'success',
      message: `导出详情完成：成功 ${successResults.length} 个，失败 ${failureCount} 个`
    })

  } catch (error) {
    console.error('导出详情失败:', error)
    message.error(`导出详情失败: ${error.message}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '武将',
      operation: '导出详情',
      status: 'error',
      message: `导出详情失败: ${error.message}`
    })
  } finally {
    isExportingDetails.value = false
  }
}

// 辅助函数：获取玩具名称
const getToyName = (toyId) => {
  return weapon[toyId] || `玩具${toyId}`
}
</script>

<style scoped>
.hero-management-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 阵容选择区域样式 */
.team-select-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.team-slots {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.hero-slot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hero-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 12px;
  cursor: pointer;
}

.hero-select:hover {
  border-color: #1890ff;
}

.hero-avatar {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
}

.hero-avatar-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
  color: #999;
  font-size: 14px;
}
</style>