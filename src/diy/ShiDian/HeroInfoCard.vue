<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Home />
      </n-icon>
    </template>
    <template #title>
      <h3>武将信息</h3>
    </template>
    <template #default>
      <!-- 阵容信息表格 - 单独一行 -->
      <div class="team-table-container">
        <table class="team-table">
          <thead>
            <tr>
              <th>阵容</th>
              <th v-for="i in 5" :key="i">位置{{ i }}</th>
              <th>资源</th>
            </tr>
          </thead>
          <tbody>
            <tr :class="{ 'current-team': currentUseTeamId === 1 }">
              <td>阵容1</td>
              <td v-for="i in 5" :key="i">
                <div v-if="teamInfo[1] && teamInfo[1][i-1]">
                  <div class="hero-info">
                    <div class="hero-level">{{ teamInfo[1][i-1].level }}级</div>
                    <div class="hero-name">{{ getHeroName(teamInfo[1][i-1].heroId) }}</div>
                    <div class="hero-star">{{ getStarDisplay(teamInfo[1][i-1].star) }}</div>
                  </div>
                </div>
                <div v-else class="empty-slot">空位</div>
              </td>
              <td class="resource-cell">
                <div class="resource-info">
                  <div class="resource-item">
                    <span class="resource-label">金币:</span>
                  </div>
                  <div class="resource-value">{{ getGold(selectedTokenId) }}</div>
                </div>
              </td>
            </tr>
            <tr :class="{ 'current-team': currentUseTeamId === 2 }">
              <td>阵容2</td>
              <td v-for="i in 5" :key="i">
                <div v-if="teamInfo[2] && teamInfo[2][i-1]">
                  <div class="hero-info">
                    <div class="hero-level">{{ teamInfo[2][i-1].level }}级</div>
                    <div class="hero-name">{{ getHeroName(teamInfo[2][i-1].heroId) }}</div>
                    <div class="hero-star">{{ getStarDisplay(teamInfo[2][i-1].star) }}</div>
                  </div>
                </div>
                <div v-else class="empty-slot">空位</div>
              </td>
              <td class="resource-cell">
                <div class="resource-info">
                  <div class="resource-item">
                    <span class="resource-label">进阶石:</span>
                  </div>
                  <div class="resource-value">{{ getUpgradeStone(selectedTokenId) }}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 阵容操作按钮 - 另起一行 -->
      <CustomizedCard mode="container">
        <!-- 阵容信息显示 -->
        <CustomizedCard mode="button" name="刷新阵容" :disabled="!selectedTokenId" @button-click="refreshTeamInfo" />
        <CustomizedCard mode="button" name="武将升级" :disabled="!selectedTokenId" @button-click="heroUpgrade" />
        
        <CustomizedCard mode="button" name="切换阵1" :disabled="!selectedTokenId" @button-click="switchToTeam1" />
        <CustomizedCard mode="button" name="切换阵2" :disabled="!selectedTokenId" @button-click="switchToTeam2" />
        
        <CustomizedCard mode="button" name="切换爬塔" :disabled="!selectedTokenId || isSwitchTowerRunning" @button-click="switchTower" />
        <CustomizedCard mode="button" name="切换推图" :disabled="!selectedTokenId || isSwitchStoryRunning" @button-click="switchStory" />
        
        <CustomizedCard mode="button" name="批量升级一" :disabled="tokenStore.gameTokens.length === 0" @button-click="batchUpgradeOne" />
        <CustomizedCard mode="button" name="批量升级二" :disabled="tokenStore.gameTokens.length === 0" @button-click="batchUpgradeTwo" />
        <CustomizedCard mode="button" :name="isBatchSwitchTowerRunning ? '批量切换爬塔中...' : '批量切换爬塔'" :disabled="isBatchSwitchTowerRunning" @button-click="batchSwitchTower" />
        <CustomizedCard mode="button" :name="isBatchSwitchStoryRunning ? '批量切换推图中...' : '批量切换推图'" :disabled="isBatchSwitchStoryRunning" @button-click="batchSwitchStory" />
        
        <!-- 执行范围输入框 -->
        <CustomizedCard mode="execution-range" name="执行范围" v-model:inputValue="upgradeTokens" placeholder="留空执行全部，或输入 1-20 或 1,2,3" @update:inputValue="handleUpgradeTokensInput" />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="武将信息"
        :filter-operations="['武将升级', '批量升级阵容1', '批量升级阵容2']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { defineProps, ref, computed, watch } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { logOperation } from '@/utils/operationLogger'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/ShiDian/OperationLogCard.vue'
import { Home } from '@vicons/ionicons5'
import { HERO_DICT } from '@/utils/HeroList.js'
import ConnectionPoolManager from '@/utils/connectionPoolManager'

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

const tokenStore = useTokenStore()
const message = useMessage()
const upgradeTokens = ref('')
const isSwitchTowerRunning = ref(false)
const isSwitchStoryRunning = ref(false)
const isBatchSwitchTowerRunning = ref(false)
const isBatchSwitchStoryRunning = ref(false)

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 30000,
  reconnectDelay: 1000,
  maxRetries: 3
});

// 阵容信息
const teamInfo = ref({})
const currentUseTeamId = ref(1)

// 按token昵称排序的token列表（与页面显示顺序一致）
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// 获取金币数量
// 根据 api采集/黑市/role_getroleinfo.txt，金币在 role.gold 字段
const getGold = (tokenId) => {
  if (!tokenId) return '0'
  
  // 优先从全局 gameData.roleInfo 获取（如果当前选中的是这个token）
  if (tokenStore.selectedTokenId === tokenId && tokenStore.gameData?.roleInfo) {
    const roleInfo = tokenStore.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.gold !== undefined) {
      return String(roleInfo.role.gold || 0)
    }
  }
  
  // 兼容：从 token.gameData.roleInfo 获取
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (token && token.gameData && token.gameData.roleInfo) {
    const roleInfo = token.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.gold !== undefined) {
      return String(roleInfo.role.gold || 0)
    }
  }
  
  // 兼容旧格式：从 token.gameData.gold 获取
  if (token && token.gameData) {
    return String(token.gameData.gold || 0)
  }
  
  return '0'
}

// 获取进阶石数量
// 根据 api采集/黑市/role_getroleinfo.txt，进阶石的itemId是1003
const getUpgradeStone = (tokenId) => {
  if (!tokenId) return '0'
  
  // 优先从全局 gameData.roleInfo 获取（如果当前选中的是这个token）
  if (tokenStore.selectedTokenId === tokenId && tokenStore.gameData?.roleInfo) {
    const roleInfo = tokenStore.gameData.roleInfo
    if (roleInfo.role && roleInfo.role.items) {
      const items = roleInfo.role.items
      const stoneItem = items[String(1003)] || items[1003]
      if (stoneItem) {
        // 根据API文件，结构是 { itemId: 1003, quantity: number, ext: null }
        if (typeof stoneItem === 'object' && stoneItem !== null) {
          return String(stoneItem.quantity || 0)
        } else if (typeof stoneItem === 'number') {
          return String(stoneItem)
        }
      }
    }
  }
  
  // 兼容：从 token.gameData.roleInfo 获取
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
  
  // 兼容旧格式：从 token.gameData.upgradeStone 获取
  if (token && token.gameData) {
    return String(token.gameData.upgradeStone || 0)
  }
  
  return '0'
}

// 获取武将名称
const getHeroName = (heroId) => {
  // 使用完整的武将字典
  const heroInfo = HERO_DICT[heroId]
  return heroInfo ? heroInfo.name : `武将${heroId}`
}

// 获取星级显示
const getStarDisplay = (star) => {
  return `${star}星`
}

// 刷新阵容信息
const refreshTeamInfo = async () => {
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
    message.info('正在刷新阵容信息...')
    
    // 获取角色信息
    await tokenStore.sendGetRoleInfo(token.id)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 1. 使用fight_startlevel获取当前实际阵容
    const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 2. 从fight_startlevel结果中提取当前阵容
    let battleTeam = null
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      battleTeam = fightResult.battleData.leftTeam.team
    } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
      // 备选结构
      battleTeam = fightResult.leftTeam.team
    }
    
    // 3. 使用presetteam_getinfo获取预设阵容和useTeamId
    const teamInfoRes = await tokenStore.sendPresetteamGetInfo(token.id, {})
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (teamInfoRes && teamInfoRes.presetTeamInfo) {
      const presetTeamInfo = teamInfoRes.presetTeamInfo.presetTeamInfo || teamInfoRes.presetTeamInfo
      
      // 提取阵容信息
      // teamInfo 是一个对象，键是位置（"0", "1", "2", "3", "4"），需要转换为数组
      const extractedTeamInfo = {}
      
      // 处理从fight_startlevel获取的当前实际阵容（存储在索引0中）
      if (battleTeam) {
        const currentBattleTeam = []
        for (let i = 0; i < 5; i++) {
          const hero = battleTeam[String(i)] || battleTeam[i]
          if (hero && hero.id) {
            // 转换格式以兼容现有代码
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
        // 将当前实际阵容存储在索引0中
        extractedTeamInfo[0] = currentBattleTeam
      }
      
      // 处理阵容1
      if (presetTeamInfo[1] && presetTeamInfo[1].teamInfo) {
        const team1Info = presetTeamInfo[1].teamInfo
        extractedTeamInfo[1] = []
        // 位置可能是字符串 "0", "1", "2", "3", "4" 或数字 0, 1, 2, 3, 4
        for (let i = 0; i < 5; i++) {
          const hero = team1Info[String(i)] || team1Info[i]
          if (hero && hero.heroId) {
            extractedTeamInfo[1].push(hero)
          } else {
            extractedTeamInfo[1].push(null)
          }
        }
      }
      
      // 处理阵容2
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
      
      // 获取当前使用的阵容ID
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
    message.info('正在执行武将升级...')
    
    // 1. 使用fight_startlevel获取当前阵容
    const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 2. 从fight_startlevel结果中提取当前阵容
    let battleTeam = null
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      battleTeam = fightResult.battleData.leftTeam.team
    } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
      // 备选结构
      battleTeam = fightResult.leftTeam.team
    }
    
    // 从 fight_startlevel 获取的当前实际阵容
    const heroes = []
    if (battleTeam) {
      for (let i = 0; i < 5; i++) {
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
      console.warn('无法从 fight_startlevel 响应中提取阵容，响应结构:', fightResult)
      message.warning('无法获取当前阵容信息')
      return
    }
    
    if (heroes.length === 0) {
      console.log('DEBUG: 从 fight_startlevel 获取的阵容中没有武将', { battleTeam, fightResult })
      message.warning('当前阵容中没有武将')
      return
    }
    
    // 输出调试信息
    console.log('DEBUG: 从 fight_startlevel 检测到的武将信息', heroes.map(h => ({ heroId: h.heroId, level: h.level })))
    
    // 3. 对每个武将循环升级（每次50级），达到6000级换下一个武将
    let upgradeCount = 0
    let shouldStop = false
    
    for (const hero of heroes) {
      if (shouldStop) {
        break
      }
      
      // 如果武将已经达到6000级，跳过并继续下一个武将
      if (hero.level >= 6000) {
        continue
      }
      
      try {
        let currentLevel = hero.level
        
        // 循环升级，直到达到6000级或遇到错误
        while (currentLevel < 6000 && !shouldStop) {
          try {
            // 尝试执行武将升级
            let upgradeRes
            try {
              upgradeRes = await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_heroupgradelevel',
                {
                  heroId: hero.heroId,
                  upgradeNum: 50
                },
                5000
              )
            } catch (upgradeError) {
              // 捕获升级命令的错误
              const errorMsg = String(upgradeError.message || upgradeError.hint || upgradeError.error || '').toLowerCase()
              
              // 检查错误代码 400060（对应"未进阶，不能升级主公"）
              // 错误消息格式可能是: "服务器错误: 400060 - 未知错误"
              const hasErrorCode400060 = errorMsg.includes('400060') || 
                                        (upgradeError.message && upgradeError.message.includes('400060'))
              
              // 检查是否包含"未进阶，不能升级主公"或错误代码 400060
              if (hasErrorCode400060 || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
                // 执行升阶命令
                try {
                  await tokenStore.sendMessageWithPromise(
                    token.id,
                    'hero_heroupgradeorder',
                    {
                      heroId: hero.heroId
                    },
                    5000
                  )
                  message.info(`武将${hero.heroId}已执行升阶，继续升级...`)
                  await new Promise(resolve => setTimeout(resolve, 200))
                  // 升阶后继续升级循环
                  continue
                } catch (orderError) {
                  console.error(`武将${hero.heroId}升阶失败:`, orderError)
                  const orderErrorMsg = String(orderError.message || orderError.hint || orderError.error || '').toLowerCase()
                  
                  // 检查错误代码 400060（对应"未进阶，不能升级主公"）
                  const orderHasErrorCode400060 = orderErrorMsg.includes('400060') || 
                                                  (orderError.message && orderError.message.includes('400060'))
                  const orderHasServerError = orderErrorMsg.includes('出了点小问题') || 
                                              orderErrorMsg.includes('请尝试重启游戏')
                  
                  // 检查升阶命令是否也返回"未进阶"错误
                  const orderHasNotUpgradeError = orderErrorMsg.includes('未进阶') || 
                                                  orderErrorMsg.includes('不能升级主公')
                  
                  if (orderHasErrorCode400060 || orderHasNotUpgradeError) {
                    // 升阶命令也返回"未进阶"错误，说明无法升阶，跳过这个武将
                    break
                  } else if (orderHasServerError) {
                    // 服务器错误，忽视并继续执行操作
                    await new Promise(resolve => setTimeout(resolve, 200))
                    // 继续升级循环
                    continue
                  } else if (orderErrorMsg.includes('物品数量不足')) {
                    message.error('物品数量不足')
                    shouldStop = true
                    break
                  } else {
                    // 其他升阶错误，跳过这个武将
                    break
                  }
                }
              } else if (errorMsg.includes('物品数量不足')) {
                message.error('物品数量不足')
                shouldStop = true
                break
              } else {
                // 其他错误，跳过这个武将
                console.error(`武将${hero.heroId}升级失败:`, upgradeError)
                break
              }
              continue
            }
            
            // 检查响应中是否有错误消息
            const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
            const errorMsgStr = String(errorMsg).toLowerCase()
            
            // 检查是否包含"未进阶，不能升级主公"或错误代码400060
            if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
              // 执行升阶命令
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradeorder',
                  {
                    heroId: hero.heroId
                  },
                  5000
                )
                message.info(`武将${hero.heroId}已执行升阶，继续升级...`)
                await new Promise(resolve => setTimeout(resolve, 200))
                // 升阶后继续升级循环
                continue
              } catch (orderError) {
                console.error(`武将${hero.heroId}升阶失败:`, orderError)
                const orderErrorMsg = String(orderError.message || '').toLowerCase()
                
                // 检查错误代码 400060（对应"未进阶，不能升级主公"）
                const orderHasErrorCode400060 = orderErrorMsg.includes('400060') || 
                                                (orderError.message && orderError.message.includes('400060'))
                const orderHasServerError = orderErrorMsg.includes('出了点小问题') || 
                                            orderErrorMsg.includes('请尝试重启游戏')
                
                // 检查升阶命令是否也返回"未进阶"错误
                const orderHasNotUpgradeError = orderErrorMsg.includes('未进阶') || 
                                                orderErrorMsg.includes('不能升级主公')
                
                if (orderHasErrorCode400060 || orderHasNotUpgradeError) {
                  // 升阶命令也返回"未进阶"错误，说明无法升阶，跳过这个武将
                  break
                } else if (orderHasServerError) {
                  // 服务器错误，忽视并继续执行操作
                  await new Promise(resolve => setTimeout(resolve, 200))
                  // 继续升级循环
                  continue
                } else if (orderErrorMsg.includes('物品数量不足')) {
                  message.error('物品数量不足')
                  shouldStop = true
                  break
                } else {
                  // 其他升阶错误，跳过这个武将
                  break
                }
              }
            }
            
            // 检查是否包含"物品数量不足"
            if (errorMsgStr.includes('物品数量不足')) {
              message.error('物品数量不足')
              shouldStop = true
              break
            }
            
            // 更新武将等级
            if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
              // heroes 可能是数组或对象（以 heroId 为键）
              let updatedHero = null
              if (Array.isArray(upgradeRes.role.heroes)) {
                updatedHero = upgradeRes.role.heroes.find(h => h.heroId === hero.heroId)
              } else if (typeof upgradeRes.role.heroes === 'object') {
                // 如果是对象，尝试通过 heroId 查找
                updatedHero = upgradeRes.role.heroes[hero.heroId] || 
                             Object.values(upgradeRes.role.heroes).find(h => h && h.heroId === hero.heroId)
              }
              
              if (updatedHero && updatedHero.level > currentLevel) {
                currentLevel = updatedHero.level
                upgradeCount++
              } else {
                // 等级没有变化，可能已达到上限或无法继续升级
                break
              }
            } else {
              // 响应格式异常，停止升级这个武将
              break
            }
            
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            // 捕获升级命令的错误
            const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
            
            // 检查错误代码 400060（对应"未进阶，不能升级主公"）
            const hasErrorCode400060 = errorMsg.includes('400060') || 
                                      (error.message && error.message.includes('400060'))
            
            // 检查是否包含"未进阶，不能升级主公"或错误代码 400060
            if (hasErrorCode400060 || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
              // 执行升阶命令
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradeorder',
                  {
                    heroId: hero.heroId
                  },
                  5000
                )
                message.info(`武将${hero.heroId}已执行升阶，继续升级...`)
                await new Promise(resolve => setTimeout(resolve, 200))
                // 升阶后继续升级循环
                continue
              } catch (orderError) {
                console.error(`武将${hero.heroId}升阶失败:`, orderError)
                const orderErrorMsg = String(orderError.message || '').toLowerCase()
                if (orderErrorMsg.includes('物品数量不足')) {
                  message.error('物品数量不足')
                  shouldStop = true
                  break
                }
                // 升阶失败，跳过这个武将
                break
              }
            } else if (errorMsg.includes('物品数量不足')) {
              message.error('物品数量不足')
              shouldStop = true
              break
            } else {
              // 其他错误，跳过这个武将
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
      const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
      logOperation('shidian', '武将升级', {
        cardType: '武将信息',
        tokenId: props.selectedTokenId,
        tokenName: token?.name,
        status: 'success',
        message: `武将升级完成，共升级${upgradeCount}次`
      })
    } else {
      // 检查是否有武将但未进行升级
      if (heroes.length > 0) {
        // 检查是否所有武将都已经是满级
        const allMaxLevel = heroes.every(hero => hero.level >= 6000)
        if (allMaxLevel) {
          message.info('所有武将均已达到满级(6000级)，无需升级')
        } else {
          // 有武将未满级但未进行升级，可能遇到其他问题
          message.warning('检测到有未满级武将，但升级未执行，请检查日志')
          console.log('DEBUG: 有武将未满级但升级未执行', heroes.filter(hero => hero.level < 6000))
        }
      } else {
        message.info('当前阵容中没有武将')
      }
    }
    
    // 5. 刷新角色信息
    await tokenStore.sendGetRoleInfo(token.id)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 6. 刷新阵容信息
    await refreshTeamInfo()
  } catch (error) {
    console.error('武将升级失败:', error)
    const errorMsg = String(error.message || '').toLowerCase()
    if (errorMsg.includes('物品数量不足')) {
      message.error('物品数量不足')
    } else {
      message.error(`武将升级失败: ${error.message || '未知错误'}`)
      const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
      logOperation('shidian', '武将升级', {
        cardType: '武将信息',
        tokenId: props.selectedTokenId,
        tokenName: token?.name,
        status: 'error',
        message: `武将升级失败: ${error.message || '未知错误'}`
      })
    }
  }
}

// 切换到阵容1
const switchToTeam1 = async () => {
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
    message.info('正在切换阵容1...')
    
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
    currentUseTeamId.value = 1
    
    // 刷新阵容信息
    await refreshTeamInfo()
    
    message.success('已切换到阵容1')
  } catch (error) {
    // 检查错误消息是否包含"200020"，如果是，则仍然提示成功
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('200020')) {
      console.warn('切换阵容1遇到服务器错误200020，但继续执行:', error)
      // 仍刷新阵容信息
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
    message.info('正在切换阵容2...')
    
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
    currentUseTeamId.value = 2
    
    // 刷新阵容信息
    await refreshTeamInfo()
    
    message.success('已切换到阵容2')
  } catch (error) {
    console.error('切换阵容失败:', error)
    message.error(`切换阵容失败: ${error.message || '未知错误'}`)
  }
}

// 切换爬塔（功能待实现）
const switchTower = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    isSwitchTowerRunning.value = true
    message.info('切换爬塔功能待实现')
    // TODO: 实现切换爬塔功能
  } catch (error) {
    console.error('切换爬塔失败:', error)
    message.error(`切换爬塔失败: ${error.message || '未知错误'}`)
  } finally {
    isSwitchTowerRunning.value = false
  }
}

// 切换推图（功能待实现）
const switchStory = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  try {
    isSwitchStoryRunning.value = true
    message.info('切换推图功能待实现')
    // TODO: 实现切换推图功能
  } catch (error) {
    console.error('切换推图失败:', error)
    message.error(`切换推图失败: ${error.message || '未知错误'}`)
  } finally {
    isSwitchStoryRunning.value = false
  }
}

// 批量切换爬塔（功能待实现）
const batchSwitchTower = async () => {
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
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量切换爬塔（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量切换爬塔', {
    cardType: '武将信息',
    status: 'info',
    message: `开始批量切换爬塔，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchSwitchTowerRunning.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行切换爬塔...`)
          
          // TODO: 实现切换爬塔功能
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 切换爬塔功能待实现`)
          
          logOperation('shidian', '批量切换爬塔', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: '切换爬塔功能待实现'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量切换爬塔失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 批量切换爬塔失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量切换爬塔', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `批量切换爬塔失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量切换爬塔完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量切换爬塔', {
      cardType: '武将信息',
      status: 'success',
      message: `批量切换爬塔完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量切换爬塔失败:', error)
    message.error(`批量切换爬塔失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '批量切换爬塔', {
      cardType: '武将信息',
      status: 'error',
      message: `批量切换爬塔失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchSwitchTowerRunning.value = false
  }
}

// 批量切换推图（功能待实现）
const batchSwitchStory = async () => {
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
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量切换推图（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量切换推图', {
    cardType: '武将信息',
    status: 'info',
    message: `开始批量切换推图，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    isBatchSwitchStoryRunning.value = true
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行切换推图...`)
          
          // TODO: 实现切换推图功能
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 切换推图功能待实现`)
          
          logOperation('shidian', '批量切换推图', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: '切换推图功能待实现'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量切换推图失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 批量切换推图失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量切换推图', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `批量切换推图失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量切换推图完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量切换推图', {
      cardType: '武将信息',
      status: 'success',
      message: `批量切换推图完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量切换推图失败:', error)
    message.error(`批量切换推图失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '批量切换推图', {
      cardType: '武将信息',
      status: 'error',
      message: `批量切换推图失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchSwitchStoryRunning.value = false
  }
}

// 处理执行范围输入
const handleUpgradeTokensInput = (value) => {
  upgradeTokens.value = value
}

// 解析Token范围（如果为空则返回null，表示执行全部）
// 支持两种输入方式：
// 1. 逗号分隔：1,2,3 -> [1, 2, 3]
// 2. 范围：1-3 -> [1, 2, 3]
// 3. 混合使用：1,3-5 -> [1, 3, 4, 5] 或 1-3,5 -> [1, 2, 3, 5]
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

// 批量升级一
const batchUpgradeOne = async () => {
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
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量升级阵容1（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量升级阵容1', {
    cardType: '武将信息',
    status: 'info',
    message: `开始批量升级阵容1，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行批量升级阵容1...`)
          
          // 切换到阵容1
          await switchToTeam1Internal(token.id)
          
          // 执行武将升级
          await heroUpgradeInternal(token.id)
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 阵容1升级完成`)
          logOperation('shidian', '批量升级阵容1', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '阵容1升级完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量升级阵容1失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 批量升级阵容1失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量升级阵容1', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `批量升级阵容1失败: ${error.message || '未知错误'}`
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
    
    message.success(`批量升级阵容1完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量升级阵容1', {
      cardType: '武将信息',
      status: 'success',
      message: `批量升级阵容1完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量升级阵容1失败:', error)
    message.error('批量升级阵容1失败: ' + (error.message || '未知错误'))
    logOperation('shidian', '批量升级阵容1', {
      cardType: '武将信息',
      status: 'error',
      message: `批量升级阵容1失败: ${error.message || '未知错误'}`
    })
  }
}

// 内部函数：切换到阵容1（不显示消息）
const switchToTeam1Internal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) {
    throw new Error('Token不存在')
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接，请先连接Token')
  }
  
  try {
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
    currentUseTeamId.value = 1
    
    // 刷新阵容信息
    await refreshTeamInfoInternal(token.id)
  } catch (error) {
    // 检查错误消息是否包含"200020"，如果是，则仍然认为成功
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('200020')) {
      console.warn('切换阵容1遇到服务器错误200020，但继续执行:', error)
      // 仍尝试刷新阵容信息
      await refreshTeamInfoInternal(token.id)
    } else {
      console.error('切换阵容1失败:', error)
      throw error
    }
  }
}

// 批量升级二
const batchUpgradeTwo = async () => {
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
  const tokenIndices = connectionPool.parseTokenRange(upgradeTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = upgradeTokens.value ? `范围${upgradeTokens.value}` : "全部"
  message.info(`开始批量升级阵容2（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  logOperation('shidian', '批量升级阵容2', {
    cardType: '武将信息',
    status: 'info',
    message: `开始批量升级阵容2，${rangeText}，共${targetTokens.length}个Token`
  })
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行批量升级阵容2...`)
          
          // 切换到阵容2
          await switchToTeam2Internal(token.id)
          
          // 执行武将升级
          await heroUpgradeInternal(token.id)
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 阵容2升级完成`)
          logOperation('shidian', '批量升级阵容2', {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '阵容2升级完成'
          })
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量升级阵容2失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 批量升级阵容2失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量升级阵容2', {
            cardType: '武将信息',
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
    
    message.success(`批量升级阵容2完成：成功${successCount}个，失败${failCount}个`)
    logOperation('shidian', '批量升级阵容2', {
      cardType: '武将信息',
      status: 'success',
      message: `批量升级阵容2完成：成功${successCount}个，失败${failCount}个`
    })
  } catch (error) {
    console.error('批量升级阵容2失败:', error)
    message.error('批量升级阵容2失败: ' + (error.message || '未知错误'))
    logOperation('shidian', '批量升级阵容2', {
      cardType: '武将信息',
      status: 'error',
      message: `批量升级阵容2失败: ${error.message || '未知错误'}`
    })
  }
}

// 内部函数：切换到阵容2（不显示消息）
const switchToTeam2Internal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) {
    throw new Error('Token不存在')
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接，请先连接Token')
  }
  
  try {
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
    currentUseTeamId.value = 2
    
    // 刷新阵容信息
    await refreshTeamInfoInternal(token.id)
  } catch (error) {
    // 检查错误消息是否包含"200020"，如果是，则仍然认为成功
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('200020')) {
      console.warn('切换阵容2遇到服务器错误200020，但继续执行:', error)
      // 仍尝试刷新阵容信息
      await refreshTeamInfoInternal(token.id)
    } else {
      console.error('切换阵容2失败:', error)
      throw error
    }
  }
}

// 内部函数：执行武将升级（不显示消息）
const heroUpgradeInternal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) {
    throw new Error('Token不存在')
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接，请先连接Token')
  }
  
  // 使用fight_startlevel获取当前阵容
  const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 从fight_startlevel结果中提取当前阵容
  let battleTeam = null
  if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
    battleTeam = fightResult.battleData.leftTeam.team
  } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
    // 备选结构
    battleTeam = fightResult.leftTeam.team
  }
  
  // 提取当前阵容中的武将列表
  const heroes = []
  if (battleTeam) {
    for (let i = 0; i < 5; i++) {
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
    console.warn('无法从 fight_startlevel 响应中提取阵容，响应结构:', fightResult)
    throw new Error('无法获取当前阵容信息')
  }
  
  if (heroes.length === 0) {
    console.log('DEBUG: 从 fight_startlevel 获取的阵容中没有武将', { battleTeam, fightResult })
    return // 没有武将就不执行升级
  }
  
  // 对每个武将进行升级
  let upgradeCount = 0
  let shouldStop = false
  
  for (const hero of heroes) {
    if (shouldStop) {
      break
    }
    
    // 如果武将已经达到6000级，跳过并继续下一个武将
    if (hero.level >= 6000) {
      continue
    }
    
    try {
      let currentLevel = hero.level
      
      // 循环升级，直到达到6000级或遇到错误
      while (currentLevel < 6000 && !shouldStop) {
        try {
          // 尝试执行武将升级
          let upgradeRes
          try {
            upgradeRes = await tokenStore.sendMessageWithPromise(
              token.id,
              'hero_heroupgradelevel',
              {
                heroId: hero.heroId,
                upgradeNum: 50
              },
              5000
            )
          } catch (upgradeError) {
            // 捕获升级命令的错误
            const errorMsg = String(upgradeError.message || upgradeError.hint || upgradeError.error || '').toLowerCase()
            
            // 检查错误代码 400060（对应"未进阶，不能升级主公"）
            const hasErrorCode400060 = errorMsg.includes('400060') || 
                                      (upgradeError.message && upgradeError.message.includes('400060'))
            
            // 检查是否包含"未进阶，不能升级主公"或错误代码 400060
            if (hasErrorCode400060 || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
              // 执行升阶命令
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradeorder',
                  {
                    heroId: hero.heroId
                  },
                  5000
                )
                await new Promise(resolve => setTimeout(resolve, 200))
                // 升阶后继续升级循环
                continue
              } catch (orderError) {
                console.error(`武将${hero.heroId}升阶失败:`, orderError)
                const orderErrorMsg = String(orderError.message || orderError.hint || orderError.error || '').toLowerCase()
                if (orderErrorMsg.includes('物品数量不足')) {
                  shouldStop = true
                  break
                }
                // 升阶失败，跳过这个武将
                break
              }
            } else if (errorMsg.includes('物品数量不足')) {
              shouldStop = true
              break
            } else {
              // 其他错误，跳过这个武将
              break
            }
            continue
          }
          
          // 检查响应中是否有错误消息
          const errorMsg = upgradeRes?.hint || upgradeRes?.message || upgradeRes?.error || ''
          const errorMsgStr = String(errorMsg).toLowerCase()
          
          // 检查是否包含"未进阶，不能升级主公"或错误代码400060
          if (errorMsgStr.includes('未进阶') || errorMsgStr.includes('不能升级主公') || errorMsgStr.includes('400060')) {
            // 执行升阶命令
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_heroupgradeorder',
                {
                  heroId: hero.heroId
                },
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 200))
              // 升阶后继续升级循环
              continue
            } catch (orderError) {
              console.error(`武将${hero.heroId}升阶失败:`, orderError)
              const orderErrorMsg = String(orderError.message || '').toLowerCase()
              
              // 检查错误代码 400060（对应"未进阶，不能升级主公"）
              const orderHasErrorCode400060 = orderErrorMsg.includes('400060') || 
                                              (orderError.message && orderError.message.includes('400060'))
              const orderHasServerError = orderErrorMsg.includes('出了点小问题') || 
                                          orderErrorMsg.includes('请尝试重启游戏')
              
              // 检查升阶命令是否也返回"未进阶"错误
              const orderHasNotUpgradeError = orderErrorMsg.includes('未进阶') || 
                                              orderErrorMsg.includes('不能升级主公')
              
              if (orderHasErrorCode400060 || orderHasNotUpgradeError) {
                // 升阶命令也返回"未进阶"错误，说明无法升阶，跳过这个武将
                break
              } else if (orderHasServerError) {
                // 服务器错误，忽视并继续执行操作
                await new Promise(resolve => setTimeout(resolve, 200))
                // 继续升级循环
                continue
              } else if (orderErrorMsg.includes('物品数量不足')) {
                shouldStop = true
                break
              } else {
                // 其他升阶错误，跳过这个武将
                break
              }
            }
          }
          
          // 检查是否包含"物品数量不足"
          if (errorMsgStr.includes('物品数量不足')) {
            shouldStop = true
            break
          }
          
          // 更新武将等级
          if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
            // heroes 可能是数组或对象（以 heroId 为键）
            let updatedHero = null
            if (Array.isArray(upgradeRes.role.heroes)) {
              updatedHero = upgradeRes.role.heroes.find(h => h.heroId === hero.heroId)
            } else if (typeof upgradeRes.role.heroes === 'object') {
              // 如果是对象，尝试通过 heroId 查找
              updatedHero = upgradeRes.role.heroes[hero.heroId] || 
                           Object.values(upgradeRes.role.heroes).find(h => h && h.heroId === hero.heroId)
            }
            
            if (updatedHero && updatedHero.level > currentLevel) {
              currentLevel = updatedHero.level
              upgradeCount++
            } else {
              // 等级没有变化，可能已达到上限或无法继续升级
              break
            }
          } else {
            // 响应格式异常，停止升级这个武将
            break
          }
          
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          // 捕获升级命令的错误
          const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
          
          // 检查错误代码 400060（对应"未进阶，不能升级主公"）
          const hasErrorCode400060 = errorMsg.includes('400060') || 
                                    (error.message && error.message.includes('400060'))
          
          // 检查是否包含"未进阶，不能升级主公"或错误代码 400060
          if (hasErrorCode400060 || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
            // 执行升阶命令
            try {
              const orderRes = await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_heroupgradeorder',
                {
                  heroId: hero.heroId
                },
                5000
              )
              
              // 检查升阶命令的响应中是否有错误
              const orderResError = orderRes?.hint || orderRes?.message || orderRes?.error || ''
              const orderResErrorMsg = String(orderResError).toLowerCase()
              
              // 如果响应中仍然包含"未进阶"错误，说明升阶失败，跳过这个武将
              if (orderResErrorMsg.includes('未进阶') || orderResErrorMsg.includes('不能升级主公') || orderResErrorMsg.includes('400060')) {
                // 升阶失败，跳过这个武将
                break
              }
              
              await new Promise(resolve => setTimeout(resolve, 200))
              // 升阶成功，继续升级循环
              continue
            } catch (orderError) {
              const orderErrorMsg = String(orderError.message || orderError.hint || orderError.error || '').toLowerCase()
              
              // 检查升阶命令的错误代码200020
              const orderHasErrorCode200020 = orderErrorMsg.includes('200020') || 
                                              (orderError.message && orderError.message.includes('200020'))
              const orderHasServerError = orderErrorMsg.includes('出了点小问题') || 
                                          orderErrorMsg.includes('请尝试重启游戏')
              
              // 检查升阶命令是否也返回"未进阶"错误
              const orderHasErrorCode400060 = orderErrorMsg.includes('400060') || 
                                              (orderError.message && orderError.message.includes('400060'))
              const orderHasNotUpgradeError = orderErrorMsg.includes('未进阶') || 
                                              orderErrorMsg.includes('不能升级主公')
              
              if (orderHasErrorCode200020 || orderHasServerError) {
                // 错误代码200020，忽视并继续执行操作
                await new Promise(resolve => setTimeout(resolve, 200))
                continue
              } else if (orderHasErrorCode400060 || orderHasNotUpgradeError) {
                // 升阶命令也返回"未进阶"错误，说明无法升阶，跳过这个武将
                break
              } else if (orderErrorMsg.includes('物品数量不足')) {
                // 物品数量不足，停止这个武将的升级
                break
              } else {
                // 其他升阶错误，跳过这个武将
                break
              }
            }
          } else if (errorMsg.includes('物品数量不足')) {
            // 物品数量不足，停止这个武将的升级
            break
          } else {
            // 其他错误，跳过这个武将
            break
          }
        }
      }
    } catch (error) {
      console.error(`武将${hero.heroId}处理失败:`, error)
      const errorMsg = String(error.message || '').toLowerCase()
      if (errorMsg.includes('物品数量不足')) {
        shouldStop = true
        break
      }
    }
  }
  
  // 刷新角色信息
  await tokenStore.sendGetRoleInfo(token.id)
  await new Promise(resolve => setTimeout(resolve, 500))
}

// 内部函数：刷新阵容信息（不显示消息）
const refreshTeamInfoInternal = async (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token) {
    throw new Error('Token不存在')
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接，请先连接Token')
  }
  
  // 获取角色信息
  await tokenStore.sendGetRoleInfo(token.id)
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 使用fight_startlevel获取当前实际阵容
  const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 使用presetteam_getinfo获取预设阵容和useTeamId
  const teamInfoRes = await tokenStore.sendPresetteamGetInfo(token.id, {})
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (teamInfoRes && teamInfoRes.presetTeamInfo) {
    const presetTeamInfo = teamInfoRes.presetTeamInfo.presetTeamInfo || teamInfoRes.presetTeamInfo
    
    // 提取阵容信息
    // teamInfo 是一个对象，键是位置（"0", "1", "2", "3", "4"），需要转换为数组
    const extractedTeamInfo = {}
    
    // 处理从fight_startlevel获取的当前实际阵容（存储在索引0中）
    let battleTeam = null
    if (fightResult && fightResult.battleData && fightResult.battleData.leftTeam && fightResult.battleData.leftTeam.team) {
      battleTeam = fightResult.battleData.leftTeam.team
    } else if (fightResult && fightResult.leftTeam && fightResult.leftTeam.team) {
      // 备选结构
      battleTeam = fightResult.leftTeam.team
    }
    
    if (battleTeam) {
      const currentBattleTeam = []
      for (let i = 0; i < 5; i++) {
        const hero = battleTeam[String(i)] || battleTeam[i]
        if (hero && hero.id) {
          // 转换格式以兼容现有代码
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
      // 将当前实际阵容存储在索引0中
      extractedTeamInfo[0] = currentBattleTeam
    }
    
    // 处理阵容1
    if (presetTeamInfo[1] && presetTeamInfo[1].teamInfo) {
      const team1Info = presetTeamInfo[1].teamInfo
      extractedTeamInfo[1] = []
      // 位置可能是字符串 "0", "1", "2", "3", "4" 或数字 0, 1, 2, 3, 4
      for (let i = 0; i < 5; i++) {
        const hero = team1Info[String(i)] || team1Info[i]
        if (hero && hero.heroId) {
          extractedTeamInfo[1].push(hero)
        } else {
          extractedTeamInfo[1].push(null)
        }
      }
    }
    
    // 处理阵容2
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
    
    // 只更新当前token的teamInfo，不影响UI显示
    // 这里我们只是刷新内部数据
  }
}

// 批量升级（通用函数）
const batchUpgrade = async (teamId) => {
  const tokenIndices = parseTokenRange(upgradeTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  try {
    const rangeText = tokenIndices === null ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量升级阵容${teamId}（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
    
    // 按token昵称排序的token列表（与页面显示顺序一致）
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    // 获取每个token在sortedTokens中的序号（用于显示）
    const getTokenIndex = (token) => {
      const index = sortedTokensList.findIndex(t => t.id === token.id)
      return index + 1
    }
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      try {
        // 连接Token
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在连接...`)
        tokenStore.selectToken(token.id, true)
        
        // 等待连接，最多重试5次
        let retryCount = 0
        const maxRetries = 5
        let status = tokenStore.getWebSocketStatus(token.id)
        
        while (status !== 'connected' && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          status = tokenStore.getWebSocketStatus(token.id)
          retryCount++
          
          if (status !== 'connected' && retryCount < maxRetries) {
            message.info(`[序号${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
            tokenStore.selectToken(token.id, true)
          }
        }
        
        if (status !== 'connected') {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          continue
        }
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 连接成功`)
        
        // 切换阵容
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在切换阵容${teamId}...`)
        await tokenStore.sendPresetteamSaveTeam(token.id, { teamId })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 获取阵容信息
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在获取阵容${teamId}信息...`)
        const teamInfoRes = await tokenStore.sendPresetteamGetInfo(token.id, {})
        
        if (!teamInfoRes || !teamInfoRes.presetTeamInfo) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id}: 无法获取阵容信息，跳过`)
          continue
        }
        
        const presetTeamInfo = teamInfoRes.presetTeamInfo.presetTeamInfo || teamInfoRes.presetTeamInfo
        const teamInfoData = presetTeamInfo[teamId]?.teamInfo || {}
        
        if (!teamInfoData || Object.keys(teamInfoData).length === 0) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id}: 阵容${teamId}为空，跳过`)
          continue
        }
        
        // 获取阵容中的武将列表
        const heroes = []
        for (const [pos, hero] of Object.entries(teamInfoData)) {
          if (hero && hero.heroId) {
            heroes.push({
              heroId: hero.heroId,
              position: pos,
              level: hero.level || 1
            })
          }
        }
        
        if (heroes.length === 0) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id}: 阵容${teamId}中没有武将，跳过`)
          continue
        }
        
        message.info(`[序号${tokenIndex}] ${token.name || token.id}: 找到${heroes.length}个武将，开始升级...`)
        
        // 对每个武将进行升级
        let upgradeCount = 0
        for (const hero of heroes) {
          try {
            // 如果武将已经达到6000级，跳过
            if (hero.level >= 6000) {
              continue
            }
            
            let currentLevel = hero.level
            
            // 循环升级，直到达到6000级或遇到错误
            while (currentLevel < 6000) {
              try {
                const upgradeRes = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_heroupgradelevel',
                  {
                    heroId: hero.heroId,
                    upgradeNum: 50
                  },
                  5000
                )
                
                // heroes 可能是数组或对象（以 heroId 为键）
                let updatedHero = null
                if (upgradeRes && upgradeRes.role && upgradeRes.role.heroes) {
                  if (Array.isArray(upgradeRes.role.heroes)) {
                    updatedHero = upgradeRes.role.heroes.find(h => h.heroId === hero.heroId)
                  } else if (typeof upgradeRes.role.heroes === 'object') {
                    updatedHero = upgradeRes.role.heroes[hero.heroId] || 
                                 Object.values(upgradeRes.role.heroes).find(h => h && h.heroId === hero.heroId)
                  }
                }
                
                if (updatedHero && updatedHero.level > currentLevel) {
                  currentLevel = updatedHero.level
                  upgradeCount++
                } else {
                  // 等级没有变化，可能已达到上限或无法继续升级
                  break
                }
                
                await new Promise(resolve => setTimeout(resolve, 200))
              } catch (upgradeError) {
                // 捕获升级命令的错误
                const errorMsg = String(upgradeError.message || upgradeError.hint || upgradeError.error || '').toLowerCase()
                
                // 检查错误代码 200020（"出了点小问题，请尝试重启游戏解决～"）- 忽视并继续执行
                const hasErrorCode200020 = errorMsg.includes('200020') || 
                                          (upgradeError.message && upgradeError.message.includes('200020'))
                const hasServerError = errorMsg.includes('出了点小问题') || 
                                      errorMsg.includes('请尝试重启游戏')
                
                if (hasErrorCode200020 || hasServerError) {
                  // 错误代码200020，忽视并继续执行操作
                  await new Promise(resolve => setTimeout(resolve, 200))
                  continue
                }
                
                // 检查错误代码 400060（对应"未进阶，不能升级主公"）
                const hasErrorCode400060 = errorMsg.includes('400060') || 
                                          (upgradeError.message && upgradeError.message.includes('400060'))
                
                // 检查是否包含"未进阶，不能升级主公"或错误代码 400060
                if (hasErrorCode400060 || errorMsg.includes('未进阶') || errorMsg.includes('不能升级主公')) {
                  // 执行升阶命令
                  try {
                    const orderRes = await tokenStore.sendMessageWithPromise(
                      token.id,
                      'hero_heroupgradeorder',
                      {
                        heroId: hero.heroId
                      },
                      5000
                    )
                    
                    // 检查升阶命令的响应中是否有错误
                    const orderResError = orderRes?.hint || orderRes?.message || orderRes?.error || ''
                    const orderResErrorMsg = String(orderResError).toLowerCase()
                    
                    // 如果响应中仍然包含"未进阶"错误，说明升阶失败，跳过这个武将
                    if (orderResErrorMsg.includes('未进阶') || orderResErrorMsg.includes('不能升级主公') || orderResErrorMsg.includes('400060')) {
                      // 升阶失败，跳过这个武将
                      break
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200))
                    // 升阶成功，继续升级循环
                    continue
                  } catch (orderError) {
                    const orderErrorMsg = String(orderError.message || orderError.hint || orderError.error || '').toLowerCase()
                    
                    // 检查升阶命令的错误代码200020
                    const orderHasErrorCode200020 = orderErrorMsg.includes('200020') || 
                                                    (orderError.message && orderError.message.includes('200020'))
                    const orderHasServerError = orderErrorMsg.includes('出了点小问题') || 
                                                orderErrorMsg.includes('请尝试重启游戏')
                    
                    // 检查升阶命令是否也返回"未进阶"错误
                    const orderHasErrorCode400060 = orderErrorMsg.includes('400060') || 
                                                    (orderError.message && orderError.message.includes('400060'))
                    const orderHasNotUpgradeError = orderErrorMsg.includes('未进阶') || 
                                                    orderErrorMsg.includes('不能升级主公')
                    
                    if (orderHasErrorCode200020 || orderHasServerError) {
                      // 错误代码200020，忽视并继续执行操作
                      await new Promise(resolve => setTimeout(resolve, 200))
                      continue
                    } else if (orderHasErrorCode400060 || orderHasNotUpgradeError) {
                      // 升阶命令也返回"未进阶"错误，说明无法升阶，跳过这个武将
                      break
                    } else if (orderErrorMsg.includes('物品数量不足')) {
                      // 物品数量不足，停止这个武将的升级
                      break
                    } else {
                      // 其他升阶错误，跳过这个武将
                      break
                    }
                  }
                } else if (errorMsg.includes('物品数量不足')) {
                  // 物品数量不足，停止这个武将的升级
                  break
                } else {
                  // 其他错误，跳过这个武将
                  break
                }
              }
            }
          } catch (error) {
            console.error(`[序号${tokenIndex}] 武将${hero.heroId}升级失败:`, error)
            // 继续处理下一个武将
          }
        }
        
        if (upgradeCount > 0) {
          message.success(`[序号${tokenIndex}] ${token.name || token.id}: 阵容${teamId}升级完成，共升级${upgradeCount}次`)
          logOperation('shidian', `批量升级阵容${teamId}`, {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `阵容${teamId}升级完成，共升级${upgradeCount}次`
          })
        } else {
          message.info(`[序号${tokenIndex}] ${token.name || token.id}: 阵容${teamId}无需升级`)
        }
        
        // 刷新角色信息
        await tokenStore.sendGetRoleInfo(token.id)
        
        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量升级失败:`, error)
        
        // 检查错误代码和消息
        const errorMsg = String(error.message || error.hint || error.error || '').toLowerCase()
        const hasErrorCode200020 = errorMsg.includes('200020') || 
                                  (error.message && error.message.includes('200020'))
        const hasServerError = errorMsg.includes('出了点小问题') || 
                              errorMsg.includes('请尝试重启游戏')
        
        // 如果是服务器错误（200020），忽视并继续执行操作（不显示错误，静默处理）
        if (hasErrorCode200020 || hasServerError) {
          // 错误代码200020，忽视并继续执行操作，不中断流程
          // 不显示错误消息，静默继续
        } else {
          message.error(`[序号${tokenIndex}] ${token.name || token.id}: 批量升级失败 - ${error.message || '未知错误'}`)
          logOperation('shidian', `批量升级阵容${teamId}`, {
            cardType: '武将信息',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `批量升级失败: ${error.message || '未知错误'}`
          })
        }
        
        // 继续处理下一个token，不中断整个流程
      }
    }
    
    message.success(`批量升级阵容${teamId}完成`)
    logOperation('shidian', `批量升级阵容${teamId}`, {
      cardType: '武将信息',
      status: 'success',
      message: `批量升级阵容${teamId}完成`
    })
  } catch (error) {
    console.error('批量升级失败:', error)
    message.error('批量升级失败: ' + (error.message || '未知错误'))
    logOperation('shidian', `批量升级阵容${teamId}`, {
      cardType: '武将信息',
      status: 'error',
      message: `批量升级失败: ${error.message || '未知错误'}`
    })
  }
}


</script>

<style scoped>
.team-table-container {
  margin-bottom: 16px;
  width: 100%;
}

.team-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.team-table th,
.team-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: center;
}

.team-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.team-table td {
  background-color: white;
}

.current-team {
  background-color: #f0f9ff;
}

.hero-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-level {
  font-size: 12px;
  color: #666;
}

.hero-name {
  font-size: 14px;
  font-weight: 500;
}

.hero-star {
  font-size: 12px;
  color: #f59e0b;
}

.empty-slot {
  color: #999;
  font-style: italic;
}

.resource-cell {
  min-width: 120px;
}

.resource-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.resource-label {
  font-size: 12px;
  color: #666;
}

.resource-value {
  font-size: 14px;
  font-weight: 500;
  color: #16a34a;
}
</style>