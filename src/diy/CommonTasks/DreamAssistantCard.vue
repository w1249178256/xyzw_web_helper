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
        
        <!-- 阵容操作按钮 -->
        <CustomizedCard mode="container">
          <CustomizedCard mode="button" name="批量升级一" :disabled="tokenStore.gameTokens.length === 0" @button-click="batchUpgradeOne" />
          <CustomizedCard mode="button" name="批量升级二" :disabled="tokenStore.gameTokens.length === 0" @button-click="batchUpgradeTwo" />
          <CustomizedCard mode="button" :name="isBatchSwitchTowerRunning ? '批量切换爬塔中...' : '批量切换爬塔'" :disabled="isBatchSwitchTowerRunning" @button-click="batchSwitchTower" />
          <CustomizedCard mode="button" :name="isBatchSwitchStoryRunning ? '批量切换推图中...' : '批量切换推图'" :disabled="isBatchSwitchStoryRunning" @button-click="batchSwitchStory" />
          
          <CustomizedCard mode="execution-range" name="执行范围" v-model:inputValue="upgradeTokens" placeholder="留空执行全部，或输入 1-20 或 1,2,3" @update:inputValue="handleUpgradeTokensInput" />
        </CustomizedCard>

        <!-- 梦境操作按钮 -->
        <div class="dream-actions-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <CustomizedCard 
              mode="execution-range"
              name="梦境执行范围"
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
            <CustomizedCard 
              mode="button-number-input"
              name="批量扭蛋"
              :disabled="isBatchGachaRunning || !tokenStore.hasTokens"
              v-model:input-value="batchGachaCount"
              @button-click="handleBatchGacha"
            />
            <CustomizedCard 
              mode="button"
              name="批量开卡"
              :disabled="isBatchOpenCardRunning || !tokenStore.hasTokens"
              @button-click="handleBatchOpenCard"
            />
            <CustomizedCard 
              mode="button-with-input"
              name="批量竞猜"
              :disabled="isBatchBetRunning || !tokenStore.hasTokens"
              v-model:input-value="betInput"
              @button-click="handleBatchBet"
            />
          </CustomizedCard>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="梦境助手"
        :filter-operations="['武将升级', '批量升级阵容1', '批量升级阵容2', '梦境选择', '梦境出战']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref, watch, onMounted, computed, inject } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import { logOperation } from '@/utils/operationLogger'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { Moon } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'
import { HERO_DICT } from '@/utils/HeroList.js'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

// 本地存储键名
const STORAGE_KEYS = {
  executionRange: 'dream_assistant_execution_range',
  selectedHeroForSelect: 'dream_assistant_selected_hero_for_select',
  selectedHeroForFight: 'dream_assistant_selected_hero_for_fight',
  upgradeTokens: 'dream_assistant_upgrade_tokens'
}

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 20,
  connectionTimeout: 3000,
  maxRetries: 2
})

// 梦境操作状态
const isRunning = ref(false)
const executionRange = ref('')
const selectedHeroForSelect = ref('107')
const selectedHeroForFight = ref('107')
const isBatchGachaRunning = ref(false)
const batchGachaCount = ref(localStorage.getItem('batchGachaCount') || '1')
watch(batchGachaCount, (val) => {
  localStorage.setItem('batchGachaCount', val)
})
const isBatchOpenCardRunning = ref(false)
const isBatchBetRunning = ref(false)
const betInput = ref('')

// 英雄选项（红将及指定橙将）
const heroOptions = computed(() => {
  if (!HERO_DICT || typeof HERO_DICT !== 'object') {
    return []
  }
  const allowedHeroIds = ['202', '206', '209', '210', '213', '217', '220', '312']
  return Object.entries(HERO_DICT)
    .filter(([id]) => String(id).startsWith('1') || allowedHeroIds.includes(id))
    .map(([id, hero]) => ({
      label: hero.name,
      value: id
    })).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
})

// 阵容选择状态
const selectedHeroes = ref(['', '', '', '', ''])

// 根据英雄id获取头像路径
const getHeroAvatar = (heroId) => {
  if (!heroId) return ''
  const hero = HERO_DICT[heroId]
  return hero ? hero.avatar : ''
}

// 武将信息相关状态
const upgradeTokens = ref('')
const isSwitchTowerRunning = ref(false)
const isSwitchStoryRunning = ref(false)
const isBatchSwitchTowerRunning = ref(false)
const isBatchSwitchStoryRunning = ref(false)

// 注入执行间隔
const commandDelay = inject('commandDelay', ref(800))

// 辅助函数：等待执行间隔
const waitCommandDelay = () => new Promise(resolve => setTimeout(resolve, commandDelay.value))

// 阵容信息
const teamInfo = ref({})
const currentUseTeamId = ref(1)

// 按token昵称排序的token列表
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB, 'zh-CN')
  })
})

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 组件挂载时从本地存储读取
onMounted(() => {
  try {
    const savedExecutionRange = localStorage.getItem(STORAGE_KEYS.executionRange)
    if (savedExecutionRange) {
      executionRange.value = savedExecutionRange
    }
    
    const savedHeroForSelect = localStorage.getItem(STORAGE_KEYS.selectedHeroForSelect)
    if (savedHeroForSelect && String(savedHeroForSelect).startsWith('1')) {
      selectedHeroForSelect.value = savedHeroForSelect
    }
    
    const savedHeroForFight = localStorage.getItem(STORAGE_KEYS.selectedHeroForFight)
    if (savedHeroForFight && String(savedHeroForFight).startsWith('1')) {
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

watch(upgradeTokens, (newValue) => {
  try {
    localStorage.setItem(STORAGE_KEYS.upgradeTokens, newValue)
  } catch (error) {
    console.error('保存升级执行范围到本地存储失败:', error)
  }
})

// 辅助函数：获取token的序号（基于名称排序后的顺序）
const getTokenIndex = (token) => {
  const index = sortedTokens.value.findIndex(t => t.id === token.id)
  return index + 1
}

// ========== 武将信息相关函数 ==========

// 获取金币数量
const getGold = (tokenId) => {
  if (!tokenId) return '0'
  
  if (tokenStore.selectedTokenId === tokenId && tokenStore.gameData?.roleInfo) {
    const roleInfo = tokenStore.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.gold !== undefined) {
      return String(roleInfo.role.gold || 0)
    }
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (token && token.gameData && token.gameData.roleInfo) {
    const roleInfo = token.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.gold !== undefined) {
      return String(roleInfo.role.gold || 0)
    }
  }
  
  if (token && token.gameData) {
    return String(token.gameData.gold || 0)
  }
  
  return '0'
}

// 获取进阶石数量
const getUpgradeStone = (tokenId) => {
  if (!tokenId) return '0'
  
  if (tokenStore.selectedTokenId === tokenId && tokenStore.gameData?.roleInfo) {
    const roleInfo = tokenStore.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.items) {
      const items = roleInfo.role.items
      const stoneItem = items[String(1003)] || items[1003]
      if (stoneItem) {
        if (typeof stoneItem === 'object' && stoneItem !== null) {
          return String(stoneItem.quantity || 0)
        } else if (typeof stoneItem === 'number') {
          return String(stoneItem)
        }
      }
    }
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (token && token.gameData && token.gameData.roleInfo) {
    const roleInfo = token.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.items) {
      const items = roleInfo.role.items
      const stoneItem = items[String(1003)] || items[1003]
      if (stoneItem) {
        if (typeof stoneItem === 'object' && stoneItem !== null) {
          return String(stoneItem.quantity || stoneItem.count || stoneItem.num || 0)
        } else if (typeof stoneItem === 'number') {
          return String(stoneItem)
        }
      }
    }
  }
  
  if (token && token.gameData) {
    return String(token.gameData.upgradeStone || 0)
  }
  
  return '0'
}

// 获取武将名称
const getHeroName = (heroId) => {
  const heroInfo = HERO_DICT[heroId]
  return heroInfo ? heroInfo.name : `武将${heroId}`
}

// 获取星级显示
const getStarDisplay = (star) => {
  if (star < 1) return '无'
  if (star <= 5) return `黄星${star}`
  if (star <= 10) return `紫星${star - 5}`
  if (star <= 15) return `橙星${star - 10}`
  if (star <= 20) return `红星${star - 15}`
  if (star <= 25) return `黄冠${star - 20}`
  if (star <= 30) return `紫冠${star - 25}`
  return `未知(${star})`
}

// 刷新阵容信息
const refreshTeamInfo = async () => {
  if (!tokenStore.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenStore.selectedTokenId)
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
    message.info('正在刷新阵容信息...')
    
    await waitCommandDelay()
    await tokenStore.sendGetRoleInfo(token.id)
    await waitCommandDelay()
    
    await waitCommandDelay()
    const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
    await waitCommandDelay()
    
    let battleTeam = null
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      battleTeam = fightResult.battleData.leftTeam.team
    } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
      battleTeam = fightResult.leftTeam.team
    }
    
    await waitCommandDelay()
    const teamInfoRes = await tokenStore.sendPresetteamGetInfo(token.id, {})
    await waitCommandDelay()
    
    if (teamInfoRes && teamInfoRes.presetTeamInfo) {
      const presetTeamInfo = teamInfoRes.presetTeamInfo.presetTeamInfo || teamInfoRes.presetTeamInfo
      
      const extractedTeamInfo = {}
      
      if (battleTeam) {
        const currentBattleTeam = []
        for (let i = 0; i < 5; i++) {
          const hero = battleTeam[String(i)] || battleTeam[i]
          if (hero && hero.id) {
            currentBattleTeam.push({
              heroId: hero.id,
              level: hero.level,
              star: hero.star,
              order: hero.order,
              color: hero.color,
              power: hero.power || 0
            })
          } else {
            currentBattleTeam.push(null)
          }
        }
        extractedTeamInfo[0] = currentBattleTeam
      }
      
      if (presetTeamInfo[1] && presetTeamInfo[1].teamInfo) {
        const team1Info = presetTeamInfo[1].teamInfo
        extractedTeamInfo[1] = []
        for (let i = 0; i < 5; i++) {
          const hero = team1Info[String(i)] || team1Info[i]
          if (hero && hero.heroId) {
            extractedTeamInfo[1].push(hero)
          } else {
            extractedTeamInfo[1].push(null)
          }
        }
      }
      
      if (presetTeamInfo[2] && presetTeamInfo[2].teamInfo) {
        const team2Info = presetTeamInfo[2].teamInfo
        extractedTeamInfo[2] = []
        for (let i = 0; i < 5; i++) {
          const hero = team2Info[String(i)] || team2Info[i]
          if (hero && hero.heroId) {
            extractedTeamInfo[2].push(hero)
          } else {
            extractedTeamInfo[2].push(null)
          }
        }
      }
      
      teamInfo.value = extractedTeamInfo
      
      if (presetTeamInfo.currentUseTeamId !== undefined) {
        currentUseTeamId.value = presetTeamInfo.currentUseTeamId
      } else if (presetTeamInfo.useTeamId !== undefined) {
        currentUseTeamId.value = presetTeamInfo.useTeamId
      }
    }
    
    message.success('阵容信息刷新成功')
  } catch (error) {
    console.error('刷新阵容信息失败:', error)
    message.error(`刷新阵容信息失败: ${error.message || '未知错误'}`)
  }
}

// 武将升级
const heroUpgrade = async () => {
  if (!tokenStore.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenStore.selectedTokenId)
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
    message.info('正在执行武将升级...')
    
    await waitCommandDelay()
    const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
    await waitCommandDelay()
    
    let battleTeam = null
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      battleTeam = fightResult.battleData.leftTeam.team
    } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
      battleTeam = fightResult.leftTeam.team
    }
    
    const heroes = []
    if (battleTeam) {
      for (let i = 4; i >= 0; i--) {
        const hero = battleTeam[String(i)] || battleTeam[i]
        if (hero && hero.id) {
          heroes.push({
            heroId: hero.id,
            position: i,
            level: hero.level || 1
          })
        }
      }
    } else {
      message.warning('无法获取当前阵容信息')
      return
    }
    
    if (heroes.length === 0) {
      message.warning('当前阵容中没有武将')
      return
    }
    
    let upgradeCount = 0
    let shouldStop = false
    
    for (const hero of heroes) {
      if (shouldStop) break
      if (hero.level >= 6000) continue
      
      try {
        let currentLevel = hero.level
        
        while (currentLevel < 6000 && !shouldStop) {
          try {
            let upgradeRes
            try {
              await waitCommandDelay()
              upgradeRes = await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_heroupgradelevel',
                { heroId: hero.heroId, upgradeNum: 50 },
                5000
              )
            } catch (upgradeError) {
              const errorMsg = String(upgradeError.message || upgradeError.hint || upgradeError.error || '').toLowerCase()
              
              if (errorMsg.includes('400060') || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
                try {
                  await waitCommandDelay()
                  await tokenStore.sendMessageWithPromise(token.id, 'hero_heroupgradeorder', { heroId: hero.heroId }, 5000)
                  message.info(`武将${hero.heroId}已执行升阶，继续升级...`)
                  await waitCommandDelay()
                  continue
                } catch (orderError) {
                  const orderErrorMsg = String(orderError.message || orderError.hint || orderError.error || '').toLowerCase()
                  if (orderErrorMsg.includes('物品数量不足')) {
                    message.error('物品数量不足')
                    shouldStop = true
                    break
                  }
                  if (orderErrorMsg.includes('400060') || orderErrorMsg.includes('未进阶') || orderErrorMsg.includes('不能升级主公')) break
                  if (orderErrorMsg.includes('出了点小问题') || orderErrorMsg.includes('请尝试重启游戏')) {
                    await waitCommandDelay()
                    continue
                  }
                  break
                }
              } else if (errorMsg.includes('物品数量不足')) {
                message.error('物品数量不足')
                shouldStop = true
                break
              } else {
                console.error(`武将${hero.heroId}升级失败:`, upgradeError)
                break
              }
              continue
            }
            
            const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
            const errorMsgStr = String(errorMsg).toLowerCase()
            
            if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
              try {
                await tokenStore.sendMessageWithPromise(token.id, 'hero_heroupgradeorder', { heroId: hero.heroId }, 5000)
                message.info(`武将${hero.heroId}已执行升阶，继续升级...`)
                await waitCommandDelay()
                continue
              } catch (orderError) {
                const orderErrorMsg = String(orderError.message || '').toLowerCase()
                if (orderErrorMsg.includes('物品数量不足')) {
                  message.error('物品数量不足')
                  shouldStop = true
                  break
                }
                if (orderErrorMsg.includes('400060') || orderErrorMsg.includes('未进阶') || orderErrorMsg.includes('不能升级主公')) break
                if (orderErrorMsg.includes('出了点小问题') || orderErrorMsg.includes('请尝试重启游戏')) {
                  await waitCommandDelay()
                  continue
                }
                break
              }
            }
            
            if (errorMsgStr.includes('物品数量不足')) {
              message.error('物品数量不足')
              shouldStop = true
              break
            }
            
            if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
              let updatedHero = null
              if (Array.isArray(upgradeRes.role.heroes)) {
                updatedHero = upgradeRes.role.heroes.find(h => h.heroId === hero.heroId)
              } else if (typeof upgradeRes.role.heroes === 'object') {
                updatedHero = upgradeRes.role.heroes[hero.heroId] || 
                             Object.values(upgradeRes.role.heroes).find(h => h && h.heroId === hero.heroId)
              }
              
              if (updatedHero && updatedHero.level > currentLevel) {
                currentLevel = updatedHero.level
                upgradeCount++
              } else {
                break
              }
            } else {
              break
            }
            
            await waitCommandDelay()
          } catch (error) {
            const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
            
            if (errorMsg.includes('400060') || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
              try {
                await tokenStore.sendMessageWithPromise(token.id, 'hero_heroupgradeorder', { heroId: hero.heroId }, 5000)
                message.info(`武将${hero.heroId}已执行升阶，继续升级...`)
                await waitCommandDelay()
                continue
              } catch (orderError) {
                const orderErrorMsg = String(orderError.message || '').toLowerCase()
                if (orderErrorMsg.includes('物品数量不足')) {
                  message.error('物品数量不足')
                  shouldStop = true
                  break
                }
                break
              }
            } else if (errorMsg.includes('物品数量不足')) {
              message.error('物品数量不足')
              shouldStop = true
              break
            } else {
              console.error(`武将${hero.heroId}升级失败:`, error)
              break
            }
          }
        }
      } catch (error) {
        console.error(`武将${hero.heroId}处理失败:`, error)
        const errorMsg = String(error.message || '').toLowerCase()
        if (errorMsg.includes('物品数量不足')) {
          message.error('物品数量不足')
          shouldStop = true
          break
        }
      }
    }
    
    if (shouldStop) {
      message.warning('升级已停止：物品数量不足')
    } else if (upgradeCount > 0) {
      message.success(`武将升级完成，共升级${upgradeCount}次`)
      const tokenIndex = token ? getTokenIndex(token) : '?'
      logOperation('shidian', '武将升级', {
        cardType: '梦境助手',
        tokenId: token.id,
        tokenName: token?.name,
        status: 'success',
        message: `【序号${tokenIndex}】[${token?.name || token.id}]武将升级完成，共升级${upgradeCount}次`
      })
    } else {
      if (heroes.length > 0) {
        const allMaxLevel = heroes.every(hero => hero.level >= 6000)
        if (allMaxLevel) {
          message.info('所有武将均已达到满级(6000级)，无需升级')
        } else {
          message.warning('检测到有未满级武将，但升级未执行，请检查日志')
        }
      } else {
        message.info('当前阵容中没有武将')
      }
    }
    
    await waitCommandDelay()
    await tokenStore.sendGetRoleInfo(token.id)
    await waitCommandDelay()
    await refreshTeamInfo()
  } catch (error) {
    console.error('武将升级失败:', error)
    const errorMsg = String(error.message || '').toLowerCase()
    if (errorMsg.includes('物品数量不足')) {
      message.error('物品数量不足')
    } else {
      message.error(`武将升级失败: ${error.message || '未知错误'}`)
      const tokenIndex = token ? getTokenIndex(token) : '?'
      logOperation('shidian', '武将升级', {
        cardType: '梦境助手',
        tokenId: token.id,
        tokenName: token?.name,
        status: 'error',
        message: `【序号${tokenIndex}】[${token?.name || token.id}]武将升级失败: ${error.message || '未知错误'}`
      })
    }
  }
}

// 切换到阵容1
const switchToTeam1 = async () => {
  if (!tokenStore.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenStore.selectedTokenId)
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
    message.info('正在切换阵容1...')
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
    currentUseTeamId.value = 1
    await refreshTeamInfo()
    message.success('已切换到阵容1')
  } catch (error) {
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('200020')) {
      console.warn('切换阵容1遇到服务器错误200020，但继续执行:', error)
      await refreshTeamInfo()
      message.warning('切换阵容1遇到服务器错误200020，但操作可能已成功')
    } else {
      console.error('切换阵容失败:', error)
      message.error(`切换阵容失败: ${error.message || '未知错误'}`)
    }
  }
}

// 切换到阵容2
const switchToTeam2 = async () => {
  if (!tokenStore.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenStore.selectedTokenId)
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
    message.info('正在切换阵容2...')
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
    currentUseTeamId.value = 2
    await refreshTeamInfo()
    message.success('已切换到阵容2')
  } catch (error) {
    console.error('切换阵容失败:', error)
    message.error(`切换阵容失败: ${error.message || '未知错误'}`)
  }
}

// 切换爬塔（功能待实现）
const switchTower = async () => {
  if (!tokenStore.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    isSwitchTowerRunning.value = true
    message.info('切换爬塔功能待实现')
  } catch (error) {
    console.error('切换爬塔失败:', error)
    message.error(`切换爬塔失败: ${error.message || '未知错误'}`)
  } finally {
    isSwitchTowerRunning.value = false
  }
}

// 切换推图（功能待实现）
const switchStory = async () => {
  if (!tokenStore.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    isSwitchStoryRunning.value = true
    message.info('切换推图功能待实现')
  } catch (error) {
    console.error('切换推图失败:', error)
    message.error(`切换推图失败: ${error.message || '未知错误'}`)
  } finally {
    isSwitchStoryRunning.value = false
  }
}

// 处理执行范围输入
const handleUpgradeTokensInput = (value) => {
  upgradeTokens.value = value
}

// 内部函数：切换到阵容1（不显示消息）
const switchToTeam1Internal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) throw new Error('Token不存在')
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') throw new Error('WebSocket未连接，请先连接Token')
  
  try {
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
    currentUseTeamId.value = 1
    await waitCommandDelay()
    await refreshTeamInfoInternal(token.id)
  } catch (error) {
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('200020')) {
      console.warn('切换阵容1遇到服务器错误200020，但继续执行:', error)
      await refreshTeamInfoInternal(token.id)
    } else {
      console.error('切换阵容1失败:', error)
      throw error
    }
  }
}

// 内部函数：切换到阵容2（不显示消息）
const switchToTeam2Internal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) throw new Error('Token不存在')
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') throw new Error('WebSocket未连接，请先连接Token')
  
  try {
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
    currentUseTeamId.value = 2
    await waitCommandDelay()
    await refreshTeamInfoInternal(token.id)
  } catch (error) {
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('200020')) {
      console.warn('切换阵容2遇到服务器错误200020，但继续执行:', error)
      await refreshTeamInfoInternal(token.id)
    } else {
      console.error('切换阵容2失败:', error)
      throw error
    }
  }
}

// 内部函数：刷新阵容信息（不显示消息）
const refreshTeamInfoInternal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) throw new Error('Token不存在')
  
  await waitCommandDelay()
  await tokenStore.sendGetRoleInfo(token.id)
  await waitCommandDelay()
  
  await waitCommandDelay()
  const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
  await waitCommandDelay()
  
  let battleTeam = null
  if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
    battleTeam = fightResult.battleData.leftTeam.team
  } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
    battleTeam = fightResult.leftTeam.team
  }
  
  await waitCommandDelay()
  const teamInfoRes = await tokenStore.sendPresetteamGetInfo(token.id, {})
  await waitCommandDelay()
  
  if (teamInfoRes && teamInfoRes.presetTeamInfo) {
    const presetTeamInfo = teamInfoRes.presetTeamInfo.presetTeamInfo || teamInfoRes.presetTeamInfo
    const extractedTeamInfo = {}
    
    if (battleTeam) {
      const currentBattleTeam = []
      for (let i = 0; i < 5; i++) {
        const hero = battleTeam[String(i)] || battleTeam[i]
        if (hero && hero.id) {
          currentBattleTeam.push({
            heroId: hero.id, level: hero.level, star: hero.star,
            order: hero.order, color: hero.color, power: hero.power || 0
          })
        } else {
          currentBattleTeam.push(null)
        }
      }
      extractedTeamInfo[0] = currentBattleTeam
    }
    
    if (presetTeamInfo[1] && presetTeamInfo[1].teamInfo) {
      const team1Info = presetTeamInfo[1].teamInfo
      extractedTeamInfo[1] = []
      for (let i = 0; i < 5; i++) {
        const hero = team1Info[String(i)] || team1Info[i]
        if (hero && hero.heroId) extractedTeamInfo[1].push(hero)
        else extractedTeamInfo[1].push(null)
      }
    }
    
    if (presetTeamInfo[2] && presetTeamInfo[2].teamInfo) {
      const team2Info = presetTeamInfo[2].teamInfo
      extractedTeamInfo[2] = []
      for (let i = 0; i < 5; i++) {
        const hero = team2Info[String(i)] || team2Info[i]
        if (hero && hero.heroId) extractedTeamInfo[2].push(hero)
        else extractedTeamInfo[2].push(null)
      }
    }
    
    teamInfo.value = extractedTeamInfo
    
    if (presetTeamInfo.currentUseTeamId !== undefined) {
      currentUseTeamId.value = presetTeamInfo.currentUseTeamId
    } else if (presetTeamInfo.useTeamId !== undefined) {
      currentUseTeamId.value = presetTeamInfo.useTeamId
    }
  }
}

// 内部函数：执行武将升级（不显示消息）
const heroUpgradeInternal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) throw new Error('Token不存在')
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') throw new Error('WebSocket未连接，请先连接Token')
  
  const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
  await waitCommandDelay()
  
  let battleTeam = null
  if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
    battleTeam = fightResult.battleData.leftTeam.team
  } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
    battleTeam = fightResult.leftTeam.team
  }
  
  const heroes = []
  if (battleTeam) {
    for (let i = 4; i >= 0; i--) {
      const hero = battleTeam[String(i)] || battleTeam[i]
      if (hero && hero.id) {
        heroes.push({ heroId: hero.id, position: i, level: hero.level || 1 })
      }
    }
  } else {
    throw new Error('无法获取当前阵容信息')
  }
  
  if (heroes.length === 0) return
  
  let upgradeCount = 0
  let shouldStop = false
  
  for (const hero of heroes) {
    if (shouldStop) break
    if (hero.level >= 6000) continue
    
    try {
      let currentLevel = hero.level
      
      while (currentLevel < 6000 && !shouldStop) {
        try {
          let upgradeRes
          try {
            upgradeRes = await tokenStore.sendMessageWithPromise(
              token.id, 'hero_heroupgradelevel',
              { heroId: hero.heroId, upgradeNum: 50 }, 5000
            )
          } catch (upgradeError) {
            const errorMsg = String(upgradeError.message || upgradeError.hint || upgradeError.error || '').toLowerCase()
            
            if (errorMsg.includes('操作过快')) {
              await new Promise(resolve => setTimeout(resolve, 2000))
              continue
            }
            
            if (errorMsg.includes('400060') || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
              try {
                await tokenStore.sendMessageWithPromise(token.id, 'hero_heroupgradeorder', { heroId: hero.heroId }, 5000)
                await waitCommandDelay()
                continue
              } catch (orderError) {
                const orderErrorMsg = String(orderError.message || orderError.hint || orderError.error || '').toLowerCase()
                if (orderErrorMsg.includes('物品数量不足')) { shouldStop = true; break }
                if (orderErrorMsg.includes('400060') || orderErrorMsg.includes('未进阶') || orderErrorMsg.includes('不能升级主公')) break
                if (orderErrorMsg.includes('出了点小问题') || orderErrorMsg.includes('请尝试重启游戏')) {
                  await waitCommandDelay()
                  continue
                }
                break
              }
            } else if (errorMsg.includes('物品数量不足')) {
              shouldStop = true
              break
            } else {
              break
            }
            continue
          }
          
          const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
          const errorMsgStr = String(errorMsg).toLowerCase()
          
          if (errorMsgStr.includes('操作过快')) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          
          if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
            try {
              await tokenStore.sendMessageWithPromise(token.id, 'hero_heroupgradeorder', { heroId: hero.heroId }, 5000)
              await waitCommandDelay()
              continue
            } catch (orderError) {
              const orderErrorMsg = String(orderError.message || '').toLowerCase()
              if (orderErrorMsg.includes('物品数量不足')) { shouldStop = true; break }
              if (orderErrorMsg.includes('400060') || orderErrorMsg.includes('未进阶') || orderErrorMsg.includes('不能升级主公')) break
              if (orderErrorMsg.includes('出了点小问题') || orderErrorMsg.includes('请尝试重启游戏')) {
                await waitCommandDelay()
                continue
              }
              break
            }
          }
          
          if (errorMsgStr.includes('物品数量不足')) { shouldStop = true; break }
          
          if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
            let updatedHero = null
            if (Array.isArray(upgradeRes.role.heroes)) {
              updatedHero = upgradeRes.role.heroes.find(h => h.heroId === hero.heroId)
            } else if (typeof upgradeRes.role.heroes === 'object') {
              updatedHero = upgradeRes.role.heroes[hero.heroId] || 
                           Object.values(upgradeRes.role.heroes).find(h => h && h.heroId === hero.heroId)
            }
            
            if (updatedHero && updatedHero.level > currentLevel) {
              currentLevel = updatedHero.level
              upgradeCount++
            } else {
              break
            }
          } else {
            break
          }
          
          await waitCommandDelay()
        } catch (error) {
          const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
          
          if (errorMsg.includes('操作过快')) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          
          if (errorMsg.includes('400060') || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
            try {
              const orderRes = await tokenStore.sendMessageWithPromise(token.id, 'hero_heroupgradeorder', { heroId: hero.heroId }, 5000)
              const orderResError = orderRes?.hint || orderRes?.message || orderRes?.error || ''
              const orderResErrorMsg = String(orderResError).toLowerCase()
              
              if (orderResErrorMsg.includes('未进阶') || orderResErrorMsg.includes('不能升级主公') || orderResErrorMsg.includes('400060')) break
              if (orderResErrorMsg.includes('出了点小问题') || orderResErrorMsg.includes('请尝试重启游戏')) {
                await waitCommandDelay()
                continue
              }
              if (orderResErrorMsg.includes('物品数量不足')) { shouldStop = true; break }
              break
            } catch (orderError) {
              const orderErrorMsg = String(orderError.message || '').toLowerCase()
              if (orderErrorMsg.includes('物品数量不足')) { shouldStop = true; break }
              break
            }
          } else if (errorMsg.includes('物品数量不足')) {
            shouldStop = true
            break
          } else {
            break
          }
        }
      }
    } catch (error) {
      console.error(`武将${hero.heroId}处理失败:`, error)
      const errorMsg = String(error.message || '').toLowerCase()
      if (errorMsg.includes('物品数量不足')) { shouldStop = true; break }
    }
  }
}

// 批量切换爬塔（功能待实现）
const batchSwitchTower = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB, 'zh-CN')
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndexForBatch = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量切换爬塔（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量切换爬塔', {
    cardType: '梦境助手',
    status: 'info',
    message: `开始批量切换爬塔，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchSwitchTowerRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndexForBatch(token)
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 正在执行切换爬塔...`)
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 切换爬塔功能待实现`)
          logOperation('shidian', '批量切换爬塔', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]切换爬塔功能待实现`
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndexForBatch(token)
          console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量切换爬塔失败:`, error)
          message.error(`序号 ${tokenIndex} ${token.name || token.id} 批量切换爬塔失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量切换爬塔', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]批量切换爬塔失败: ${error.message || '未知错误'}`
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
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.info(`序号 ${tokenIndex} ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.success(`序号 ${tokenIndex} ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量切换爬塔完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量切换爬塔', {
      cardType: '梦境助手',
      status: 'success',
      message: `批量切换爬塔完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量切换爬塔失败:', error)
    message.error(`批量切换爬塔失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '批量切换爬塔', {
      cardType: '梦境助手',
      status: 'error',
      message: `批量切换爬塔失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchSwitchTowerRunning.value = false
  }
}

// 批量切换推图（功能待实现）
const batchSwitchStory = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB, 'zh-CN')
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndexForBatch = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量切换推图（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量切换推图', {
    cardType: '梦境助手',
    status: 'info',
    message: `开始批量切换推图，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchSwitchStoryRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndexForBatch(token)
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 正在执行切换推图...`)
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 切换推图功能待实现`)
          logOperation('shidian', '批量切换推图', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]切换推图功能待实现`
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndexForBatch(token)
          console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量切换推图失败:`, error)
          message.error(`序号 ${tokenIndex} ${token.name || token.id} 批量切换推图失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量切换推图', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]批量切换推图失败: ${error.message || '未知错误'}`
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
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.info(`序号 ${tokenIndex} ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.success(`序号 ${tokenIndex} ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量切换推图完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量切换推图', {
      cardType: '梦境助手',
      status: 'success',
      message: `批量切换推图完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量切换推图失败:', error)
    message.error(`批量切换推图失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '批量切换推图', {
      cardType: '梦境助手',
      status: 'error',
      message: `批量切换推图失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchSwitchStoryRunning.value = false
  }
}

// 批量升级一
const batchUpgradeOne = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB, 'zh-CN')
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndexForBatch = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量升级阵容1（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量升级阵容1', {
    cardType: '梦境助手',
    status: 'info',
    message: `开始批量升级阵容1，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndexForBatch(token)
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 正在执行批量升级阵容1...`)
          
          await switchToTeam1Internal(token.id)
          await heroUpgradeInternal(token.id)
          
          message.success(`序号 ${tokenIndex} ${token.name || token.id} 阵容1升级完成`)
          logOperation('fish-helper', '批量升级阵容1', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]阵容1升级完成`
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndexForBatch(token)
          console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量升级阵容1失败:`, error)
          message.error(`序号 ${tokenIndex} ${token.name || token.id} 批量升级阵容1失败: ${error.message || '未知错误'}`)
          logOperation('fish-helper', '批量升级阵容1', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]批量升级阵容1失败: ${error.message || '未知错误'}`
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
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.info(`序号 ${tokenIndex} ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.success(`序号 ${tokenIndex} ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级阵容1完成：成功${successCount}个，失败${failCount}个`)
    logOperation('fish-helper', '批量升级阵容1', {
      cardType: '梦境助手',
      status: 'success',
      message: `批量升级阵容1完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量升级阵容1失败:', error)
    message.error('批量升级阵容1失败: ' + (error.message || '未知错误'))
    logOperation('fish-helper', '批量升级阵容1', {
      cardType: '梦境助手',
      status: 'error',
      message: `批量升级阵容1失败: ${error.message || '未知错误'}`
    })
  }
}

// 批量升级二
const batchUpgradeTwo = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB, 'zh-CN')
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndexForBatch = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量升级阵容2（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量升级阵容2', {
    cardType: '梦境助手',
    status: 'info',
    message: `开始批量升级阵容2，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndexForBatch(token)
          message.info(`序号 ${tokenIndex} ${token.name || token.id} 正在执行批量升级阵容2...`)
          
          await switchToTeam2Internal(token.id)
          await heroUpgradeInternal(token.id)
          
          message.success(`序号 ${tokenIndex} ${token.name || token.id} 阵容2升级完成`)
          logOperation('fish-helper', '批量升级阵容2', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '阵容2升级完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndexForBatch(token)
          console.error(`序号 ${tokenIndex} ${token.name || token.id} 批量升级阵容2失败:`, error)
          message.error(`序号 ${tokenIndex} ${token.name || token.id} 批量升级阵容2失败: ${error.message || '未知错误'}`)
          logOperation('fish-helper', '批量升级阵容2', {
            cardType: '梦境助手',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `批量升级阵容2失败: ${error.message || '未知错误'}`
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
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.info(`序号 ${tokenIndex} ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            message.success(`序号 ${tokenIndex} ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId)
            const tokenIndex = token ? getTokenIndexForBatch(token) : progress.globalIndex + 1
            if (progress.status === 'warning') {
              message.warning(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`序号 ${tokenIndex} ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量升级阵容2完成：成功${successCount}个，失败${failCount}个`)
    logOperation('fish-helper', '批量升级阵容2', {
      cardType: '梦境助手',
      status: 'success',
      message: `批量升级阵容2完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量升级阵容2失败:', error)
    message.error('批量升级阵容2失败: ' + (error.message || '未知错误'))
    logOperation('fish-helper', '批量升级阵容2', {
      cardType: '梦境助手',
      status: 'error',
      message: `批量升级阵容2失败: ${error.message || '未知错误'}`
    })
  }
}

// ========== 梦境相关函数 ==========

// 梦境选择
const handleDreamSelect = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const heroId = parseInt(selectedHeroForSelect.value)
  const heroName = HERO_DICT[selectedHeroForSelect.value]?.name || '未知'
  
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
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  const heroId = parseInt(selectedHeroForFight.value)
  const heroName = HERO_DICT[selectedHeroForFight.value]?.name || '未知'
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

// 批量扭蛋
const handleBatchGacha = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  message.info(`开始批量扭蛋（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '梦境助手',
    operation: '批量扭蛋',
    status: 'info',
    message: `开始批量扭蛋，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchGachaRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在扭蛋...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量扭蛋',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 开始扭蛋`
          })
          
          const gachaCount = parseInt(batchGachaCount.value) || 1
          for (let i = 0; i < gachaCount; i++) {
            await tokenStore.sendGachaDrawReward(token.id, {})
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 扭蛋完成，共${gachaCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量扭蛋',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] 扭蛋完成`
          })
          
          return { success: true }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 扭蛋失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 扭蛋失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量扭蛋',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] 扭蛋失败：${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
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
    
    message.success(`批量扭蛋完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '批量扭蛋',
      status: 'success',
      message: `批量扭蛋完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量扭蛋出错:', error)
    message.error(`批量扭蛋出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '批量扭蛋',
      status: 'error',
      message: `批量扭蛋出错：${error.message || error}`
    })
  } finally {
    isBatchGachaRunning.value = false
  }
}

// 批量开卡
const handleBatchOpenCard = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  message.info(`开始批量开卡（${rangeText}），共${targetTokens.length}个Token...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '梦境助手',
    operation: '批量开卡',
    status: 'info',
    message: `开始批量开卡，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchOpenCardRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          let openCount = 0
          
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始开卡...`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量开卡',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 开始开卡`
          })
          
          // 循环执行直到失败
          while (true) {
            try {
              await tokenStore.sendSaltcup26OpenStarPack(token.id, {})
              openCount++
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              // 失败时停止循环
              break
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 开卡完成，共开${openCount}次`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量开卡',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] 开卡完成，共开${openCount}次`
          })
          
          return { success: true, openCount }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 开卡失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 开卡失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量开卡',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] 开卡失败：${error.message || '未知错误'}`
          })
          
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.tokenName) {
            if (progress.status === 'success') {
              message.success(`${progress.tokenName} ${progress.message}`)
            } else if (progress.status === 'warning') {
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
    
    message.success(`批量开卡完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '批量开卡',
      status: 'success',
      message: `批量开卡完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量开卡出错:', error)
    message.error(`批量开卡出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '批量开卡',
      status: 'error',
      message: `批量开卡出错：${error.message || error}`
    })
  } finally {
    isBatchOpenCardRunning.value = false
  }
}

// 批量竞猜
const handleBatchBet = async () => {
  if (!betInput.value) {
    message.warning('请输入竞猜参数，格式：matchId,pick')
    return
  }
  
  const parts = betInput.value.split(',')
  if (parts.length !== 2) {
    message.warning('输入格式错误，请使用英文逗号分隔，格式：matchId,pick')
    return
  }
  
  const matchId = parts[0].trim()
  const pick = parseInt(parts[1].trim())
  
  if (!matchId || isNaN(pick)) {
    message.warning('参数格式错误，matchId为字符串，pick为数字')
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
  
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  message.info(`开始批量竞猜（${rangeText}），共${targetTokens.length}个Token，matchId=${matchId}，pick=${pick}...`)
  logStore.addLog({
    page: 'fish-helper',
    cardType: '梦境助手',
    operation: '批量竞猜',
    status: 'info',
    message: `开始批量竞猜，${rangeText}，共${targetTokens.length}个Token，matchId=${matchId}，pick=${pick}`
  })
  
  try {
    isBatchBetRunning.value = true
    
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在竞猜...`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量竞猜',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `[序号${tokenIndex}] 开始竞猜，matchId=${matchId}，pick=${pick}`
          })
          
          await tokenStore.sendSaltcup26PlaceBet(token.id, { matchId, pick })
          await new Promise(resolve => setTimeout(resolve, 500))
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 竞猜完成`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量竞猜',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `[序号${tokenIndex}] 竞猜完成`
          })
          
          return { success: true }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 竞猜失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 竞猜失败：${error.message || '未知错误'}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '梦境助手',
            operation: '批量竞猜',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `[序号${tokenIndex}] 竞猜失败：${error.message || '未知错误'}`
          })
          
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.tokenName) {
            if (progress.status === 'success') {
              message.success(`${progress.tokenName} ${progress.message}`)
            } else if (progress.status === 'warning') {
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
    
    message.success(`批量竞猜完成，成功${successCount}个，失败${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '批量竞猜',
      status: 'success',
      message: `批量竞猜完成，成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量竞猜出错:', error)
    message.error(`批量竞猜出错：${error.message || error}`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '梦境助手',
      operation: '批量竞猜',
      status: 'error',
      message: `批量竞猜出错：${error.message || error}`
    })
  } finally {
    isBatchBetRunning.value = false
  }
}

</script>

<style scoped>
.dream-assistant-content {
  width: 100%;
}

.team-grid-container {
  margin-bottom: 16px;
  width: 100%;
}

.team-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.team-row {
  display: grid;
  grid-template-columns: 60px 100px 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.team-header {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.team-resource {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.resource-label {
  font-size: 11px;
  color: #666;
}

.resource-value {
  font-size: 13px;
  font-weight: 500;
  color: #16a34a;
}

.team-heroes {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.hero-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background-color: #f5f5f5;
  border-radius: 4px;
  min-height: 60px;
  justify-content: center;
}

.hero-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-level {
  font-size: 11px;
  color: #666;
}

.hero-name {
  font-size: 12px;
  font-weight: 500;
}

.hero-star {
  font-size: 11px;
  color: #f59e0b;
}

.empty-slot {
  color: #999;
  font-style: italic;
  font-size: 12px;
}

/* 阵容选择区域样式 */
.team-select-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
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
