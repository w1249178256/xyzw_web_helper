<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <People />
      </n-icon>
    </template>
    <template #title>
      <h3>十殿 TeamID</h3>
    </template>
    <template #default>
      <CustomizedCard mode="container">
        <div style="grid-column: 1 / -1; font-size: 12px; color: #666; padding: 4px 0; margin-bottom: 4px;">
          💡 提示：点击按钮可清空对应 TeamID
        </div>
        <CustomizedCard 
          v-for="i in 5" 
          :key="i"
          mode="button-with-input"
          :name="`十殿${['一', '二', '三', '四', '五'][i-1]}`"
          :input-value="teamIds[i-1]"
          @update:input-value="(value) => handleTeamIdChange(i-1, value)"
          :placeholder="`输入十殿${['一', '二', '三', '四', '五'][i-1]}的 TeamID`"
          button-text="清除"
          :disabled="!teamIds[i-1]"
          @button-click="() => clearSingleTeamId(i-1)"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="自动加入十殿"
          :disabled="!teamIds?.some(id => id) || isAutoJoinRunning"
          @button-click="autoJoinShiDian"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="停止"
          :disabled="!isAutoJoinRunning"
          @button-click="stopAutoJoinShiDian"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="清空十殿标签"
          :disabled="!tokenStore.hasTokens"
          @button-click="clearAllNightmareLabels"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="加入成员"
          :disabled="!teamIds?.some(id => id) || isAddingMembers"
          @button-click="addMembersToTeams"
        />
        <!-- 十殿 8 按钮 -->
        <CustomizedCard 
          mode="button-with-input"
          name="十殿 8"
          button-text="十殿 8"
          :disabled="isExecutingNightmare8 || !teamIdForDian8"
          :inputValue="teamIdForDian8"
          @update:inputValue="(value) => teamIdForDian8 = value"
          placeholder="输入队伍号"
          @button-click="executeNightmare8()"
        />
      </CustomizedCard>
      
      <!-- 导出资源和批量领取 -->
      <CustomizedCard mode="container">
        <CustomizedCard 
          mode="execution-range"
          name="执行范围"
          v-model:inputValue="resourceExportRange"
          placeholder="留空执行全部，或输入 1-20 或 1,2,3"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="导出资源"
          :disabled="isExportingResources"
          @button-click="exportResources()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="批量领取"
          :disabled="tokenStore.gameTokens.length === 0 || isBatchClaiming"
          @button-click="batchClaimNightmareRewards()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="刷新枕头"
          :disabled="tokenStore.gameTokens.length === 0 || isRefreshingPillow"
          @button-click="batchRefreshPillowCount()"
        />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="十殿 TeamID"
        :filter-operations="['导出资源', '批量领取']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, toRaw, inject } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { People } from '@vicons/ionicons5'
import { logOperation } from '@/utils/operationLogger'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import MyCard from '@/components/Common/MyCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import ConnectionPoolManager from '@/utils/connectionPoolManager.js'
import { PET_DICT } from '@/utils/herolist'

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update-pillow-count', 'join-token', 'auto-join-shidian', 'clear-nightmare-labels'])

const tokenStore = useTokenStore()
const message = useMessage()

// 注入执行间隔
const commandDelay = inject('commandDelay', ref(800))

// 辅助函数：等待执行间隔
const waitCommandDelay = () => new Promise(resolve => setTimeout(resolve, commandDelay.value))

// 辅助函数：获取 token 的序号（基于名称排序后的顺序）
const getTokenIndex = (token) => {
  const gameTokens = toRaw(tokenStore.gameTokens)
  const sortedTokens = [...gameTokens].sort((a, b) => {
    const nameA = a.name || a.id || ''
    const nameB = b.name || b.id || ''
    return nameA.localeCompare(nameB, 'zh-CN')
  })
  const index = sortedTokens.findIndex(t => t.id === token.id)
  return index >= 0 ? index + 1 : '?'
}

// 辅助函数：解析执行范围（如果为空则执行全部）
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

// 辅助函数：获取目标Token列表（根据执行范围或全部）
const getTargetTokens = (tokenIndices) => {
  const gameTokens = toRaw(tokenStore.gameTokens)
  const sortedTokens = [...gameTokens].sort((a, b) => {
    const nameA = a.name || a.id || ''
    const nameB = b.name || b.id || ''
    return nameA.localeCompare(nameB, 'zh-CN')
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

// TeamID 相关变量
const teamIds = ref(['', '', '', '', ''])
const isAutoJoinRunning = ref(false)
const stopAutoJoinFlag = ref(false)
const isAddingMembers = ref(false)

// 十殿 8 相关变量
const teamIdForDian8 = ref('')
const isExecutingNightmare8 = ref(false)
const connectingTokens = ref(new Set())

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 3000,
  idleTimeout: 60000,
  queueTimeout: 120000,
  reconnectDelay: 1000,
  maxRetries: 3
})

// 组件卸载前清理连接池
onBeforeUnmount(async () => {
  try {
    await connectionPool.destroy()
    console.log('[ShiDianTeamIdCard] 连接池已清理')
  } catch (error) {
    console.error('[ShiDianTeamIdCard] 清理连接池失败:', error)
  }
})

// 处理 TeamID 输入变化
const handleTeamIdChange = async (index, value) => {
  const stringValue = String(value || '')
  teamIds.value[index] = stringValue
  
  console.log(`TeamID[${index}] 变化：${stringValue}`)
  
  // 保存到 localStorage
  try {
    await saveDropdownSettings()
    console.log('TeamID 已保存到 localStorage')
  } catch (error) {
    console.error('保存 TeamID 失败:', error)
  }
}

// 保存下拉框设置
const saveDropdownSettings = async () => {
  try {
    const settings = {
      teamIds: [...teamIds.value]
    }
    localStorage.setItem('shidian_teamIds', JSON.stringify(settings))
    console.log('设置已保存到 localStorage:', settings)
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

// 加载下拉框设置
const loadDropdownSettings = async () => {
  try {
    const saved = localStorage.getItem('shidian_teamIds')
    if (saved) {
      const settings = JSON.parse(saved)
      if (settings.teamIds && Array.isArray(settings.teamIds)) {
        teamIds.value = settings.teamIds
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 清空单个 TeamID
const clearSingleTeamId = async (index) => {
  teamIds.value[index] = ''
  await saveDropdownSettings()
}

// 清空所有 TeamID
const clearAllTeamIds = async () => {
  teamIds.value = ['', '', '', '', '']
  await saveDropdownSettings()
  message.success('已清空所有 TeamID')
}

// 清空十殿标签
const clearAllNightmareLabels = async () => {
  try {
    const allTokens = toRaw(tokenStore.gameTokens)
    
    let resetCount = 0
    
    console.log('总Token数量:', allTokens.length)
    
    // 读取当前的十殿标签数据
    const savedData = localStorage.getItem('pageTokenData_shidian')
    let pageData = savedData ? JSON.parse(savedData) : {}
    let tokenNightmareTeam = pageData.dropdownSettings?.tokenNightmareTeam || {}
    
    console.log('当前十殿标签数据:', tokenNightmareTeam)
    
    for (const token of allTokens) {
      const name = token.name || ''
      
      console.log(`Token: ${name}, 当前标签: ${tokenNightmareTeam[token.id]}`)
      
      // 跳过昵称开头为 02、05 和 07 的 token
      if (name.startsWith('02') || name.startsWith('05') || name.startsWith('07')) {
        console.log(`跳过 ${name} (前缀02/05/07)`)
        continue
      }
      
      // 如果该token有十殿标签（0-5），则清空
      if (tokenNightmareTeam[token.id] !== null && tokenNightmareTeam[token.id] !== undefined) {
        console.log(`清空 ${name} 的十殿标签: ${tokenNightmareTeam[token.id]}`)
        delete tokenNightmareTeam[token.id]
        resetCount++
      }
    }
    
    // 保存更新后的数据
    if (!pageData.dropdownSettings) {
      pageData.dropdownSettings = {}
    }
    pageData.dropdownSettings.tokenNightmareTeam = tokenNightmareTeam
    localStorage.setItem('pageTokenData_shidian', JSON.stringify(pageData))
    
    // 通知父组件更新 tokenNightmareTeam
    emit('clear-nightmare-labels')
    
    console.log('清空完成，数量:', resetCount)
    console.log('更新后的十殿标签数据:', tokenNightmareTeam)
    
    message.success(`已清空 ${resetCount} 个 Token 的十殿标签`)
    logOperation('shidian', '清空十殿标签', {
      cardType: '十殿 TeamID',
      status: 'success',
      message: `已清空 ${resetCount} 个 Token 的十殿标签`
    })
  } catch (error) {
    console.error('清空十殿标签失败:', error)
    message.error('清空十殿标签失败')
    logOperation('shidian', '清空十殿标签', {
      cardType: '十殿 TeamID',
      status: 'error',
      message: `清空十殿标签失败：${error.message}`
    })
  }
}

// 加入成员到各个队伍
const addMembersToTeams = async () => {
  if (!teamIds.value?.some(id => id)) {
    message.warning('请先输入至少一个 TeamID')
    return
  }

  isAddingMembers.value = true
  
  try {
    message.info('开始加入成员...')
    
    const gameTokens = toRaw(tokenStore.gameTokens)
    const dianLabels = ['一', '二', '三', '四', '五']
    
    // 记录已分配的 token ID，避免重复分配
    const assignedTokenIds = new Set()
    
    // 为每个十殿队伍添加成员
    for (let teamIdx = 0; teamIdx < 5; teamIdx++) {
      const currentTeamId = teamIds.value[teamIdx]
      if (!currentTeamId) continue
      
      message.info(`正在处理十殿${dianLabels[teamIdx]}...`)
      
      // 查找名称前缀为 02 和 05 的 token（排除已加入任何殿的）
      const prefix2Token = gameTokens.find(t => {
        const name = t.name || ''
        // 排除已分配的 token，以及 remark 中包含任何殿标签的 token
        if (assignedTokenIds.has(t.id)) return false
        if (t.remark && /殿[一二三四五]/.test(t.remark)) return false
        return name.startsWith('02')
      })
      
      const prefix5Token = gameTokens.find(t => {
        const name = t.name || ''
        // 排除已分配的 token，以及 remark 中包含任何殿标签的 token
        if (assignedTokenIds.has(t.id)) return false
        if (t.remark && /殿[一二三四五]/.test(t.remark)) return false
        return name.startsWith('05')
      })
      
      const tokensToAdd = [prefix2Token, prefix5Token].filter(Boolean)
      
      if (tokensToAdd.length === 0) {
        message.warning(`十殿${dianLabels[teamIdx]}：未找到合适的 token（前缀 02 和 05）`)
        continue
      }
      
      for (const token of tokensToAdd) {
        try {
          connectingTokens.value.add(token.id)
          assignedTokenIds.add(token.id)
          message.info(`${token.name} 正在加入十殿${dianLabels[teamIdx]}...`)
          
          // 触发事件，让父组件调用 joinShiDian
          emit('join-token', token, teamIdx + 1)
          
          message.success(`${token.name} 已成功加入十殿${dianLabels[teamIdx]}`)
          
          logOperation('shidian', '加入成员', {
            cardType: '十殿 TeamID',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]已加入十殿${dianLabels[teamIdx]}，队伍号：${currentTeamId}`
          })
          
          connectingTokens.value.delete(token.id)
          
          if (tokensToAdd.indexOf(token) < tokensToAdd.length - 1) {
            await waitCommandDelay()
          }
        } catch (error) {
          console.error(`${token.name} 加入失败:`, error)
          message.error(`${token.name} 加入失败：${error.message}`)
          connectingTokens.value.delete(token.id)
          logOperation('shidian', '加入成员', {
            cardType: '十殿 TeamID',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]加入失败：${error.message}`
          })
        }
      }
      
      if (teamIdx < 4) {
        await waitCommandDelay()
      }
    }
    
    message.success('加入成员完成！')
    
  } catch (error) {
    console.error('加入成员失败:', error)
    message.error('加入成员失败')
  } finally {
    isAddingMembers.value = false
  }
}

// 自动加入十殿
const autoJoinShiDian = async () => {
  if (!teamIds.value?.some(id => id)) {
    message.warning('请先选择十殿队伍（一到五）')
    return
  }

  // 触发事件，让父组件执行自动加入十殿，传递执行范围
  emit('auto-join-shidian', resourceExportRange.value)
}

// 停止自动加入十殿
const stopAutoJoinShiDian = () => {
  stopAutoJoinFlag.value = true
  message.info('正在停止自动加入十殿...')
}

// 十殿 8 执行函数
const executeNightmare8 = async () => {
  if (!teamIdForDian8.value) {
    message.warning('请输入队伍号')
    return
  }

  isExecutingNightmare8.value = true
  
  try {
    message.info('开始执行十殿 8...')
    
    // 第一步：查找 1 个名称带 8#7 的 token
    const gameTokens = toRaw(tokenStore.gameTokens)
    const dian87Token = gameTokens.find(t => {
      const name = t.name || ''
      return name.includes('8#7')
    })

    if (!dian87Token) {
      message.warning('未找到名称带 8#7 的 Token')
      return
    }

    message.info(`找到 8#7 Token: ${dian87Token.name}`)
    
    // 连接游戏并检查枕头数量
    connectingTokens.value.add(dian87Token.id)
    await tokenStore.selectToken(dian87Token.id)
    await waitCommandDelay()
    
    // 模拟点击十殿枕头按钮获取枕头数量
    try {
      // 使用 role_getroleinfo 获取角色信息
      const roleInfo = await tokenStore.sendGetRoleInfo(dian87Token.id)
      console.log('8#7 Token 角色信息:', roleInfo)
      
      const pillowItem = roleInfo?.role?.items?.['5054']
      const pillowCount = pillowItem?.quantity ?? 0
      
      console.log(`${dian87Token.name} 枕头数量：${pillowCount}, roleInfo:`, roleInfo?.role?.items?.['5054'])
      
      if (pillowCount !== 5) {
        message.warning(`${dian87Token.name} 枕头数量为${pillowCount}，不等于 5，跳过`)
        connectingTokens.value.delete(dian87Token.id)
        return
      }
      
      message.info(`${dian87Token.name} 枕头数量为 5，正在加入十殿...`)
      
      // 加入十殿
      await tokenStore.sendGameMessage(dian87Token.id, 'matchteam_join', { 
        teamId: parseInt(teamIdForDian8.value) 
      })
      
      message.success(`${dian87Token.name} 已成功加入十殿`)
      connectingTokens.value.delete(dian87Token.id)
    } catch (error) {
      console.error(`${dian87Token.name} 获取枕头数量失败:`, error)
      message.error(`${dian87Token.name} 获取枕头数量失败：${error.message}`)
      connectingTokens.value.delete(dian87Token.id)
      return
    }

    // 第二步：查找 3 个名称带 8# 的 token
    const dian8Tokens = gameTokens.filter(t => {
      const name = t.name || ''
      return name.includes('8#') && !name.includes('8#7')
    }).slice(0, 3)

    if (dian8Tokens.length === 0) {
      message.warning('未找到名称带 8# 的 Token')
      return
    }

    message.info(`找到 ${dian8Tokens.length} 个 8# Token，开始处理...`)

    for (let i = 0; i < dian8Tokens.length; i++) {
      const dian8Token = dian8Tokens[i]
      
      try {
        connectingTokens.value.add(dian8Token.id)
        message.info(`处理 ${dian8Token.name} (${i + 1}/${dian8Tokens.length})...`)
        
        await tokenStore.selectToken(dian8Token.id)
        await waitCommandDelay()
        
        // 模拟点击十殿枕头按钮获取枕头数量
        const roleInfo = await tokenStore.sendGetRoleInfo(dian8Token.id)
        console.log(`${dian8Token.name} 角色信息:`, roleInfo)
        
        const pillowItem = roleInfo?.role?.items?.['5054']
        const pillowCount = pillowItem?.quantity ?? 0
        
        console.log(`${dian8Token.name} 枕头数量：${pillowCount}, roleInfo:`, roleInfo?.role?.items?.['5054'])
        
        if (pillowCount !== 5) {
          message.warning(`${dian8Token.name} 枕头数量为${pillowCount}，不等于 5，跳过`)
          connectingTokens.value.delete(dian8Token.id)
          continue
        }

        message.info(`${dian8Token.name} 枕头数量为 5，正在加入十殿...`)
        
        // 加入十殿
        await tokenStore.sendGameMessage(dian8Token.id, 'matchteam_join', { 
          teamId: parseInt(teamIdForDian8.value) 
        })
        
        message.success(`${dian8Token.name} 已成功加入十殿`)
        connectingTokens.value.delete(dian8Token.id)
      } catch (error) {
        console.error(`${dian8Token.name} 处理失败:`, error)
        message.error(`${dian8Token.name} 处理失败：${error.message}`)
        connectingTokens.value.delete(dian8Token.id)
        continue
      }

      if (i < dian8Tokens.length - 1) {
        await waitCommandDelay()
      }
    }
    
    message.success('十殿 8 执行完成！')
    
    // 记录日志
    const tokenIndex = getTokenIndex(dian87Token)
    logOperation('shidian', '十殿 8', {
      cardType: '十殿 TeamID',
      tokenId: dian87Token.id,
      tokenName: dian87Token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${dian87Token.name || dian87Token.id}]十殿 8 执行完成，队伍号：${teamIdForDian8.value}`
    })
    
  } catch (error) {
    console.error('十殿 8 执行失败:', error)
    message.error(`十殿 8 执行失败：${error.message || '未知错误'}`)
  } finally {
    isExecutingNightmare8.value = false
  }
}

// ========== 导出资源和批量领取相关 ==========

// 状态变量
const resourceExportRange = ref(localStorage.getItem('shidian_resourceExportRange') || '')
const isExportingResources = ref(false)
const isBatchClaiming = ref(false)
const isRefreshingPillow = ref(false)

// 监听执行范围变化，持久化保存
watch(resourceExportRange, (newValue) => {
  localStorage.setItem('shidian_resourceExportRange', newValue)
})

// 辅助函数：格式化数值
const formatValue = (value) => {
  return value > 0 ? value : '-'
}

// 辅助函数：查找物品数量
const findItemCount = (items, itemId) => {
  if (!items) return 0
  if (Array.isArray(items)) {
    const item = items.find(i => i.itemId === itemId || i.id === itemId)
    return item ? (item.quantity || item.count || 0) : 0
  }
  const item = items[itemId]
  if (!item) {
    const found = Object.values(items).find(i => i && (i.itemId === itemId || i.id === itemId))
    return found ? (found.quantity || found.count || 0) : 0
  }
  const result = item.quantity || item.count || 0
  return result
}

// 领取十殿奖励
const claimNightmareRewardsForCard = async (token) => {
  try {
    // 连接池会自动建立WebSocket连接，无需手动检查
    
    // 获取角色信息
    let roleId = null
    try {
      await waitCommandDelay()
      const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
        roleId = roleInfo.role.roleId
      }
    } catch (error) {
      console.warn('获取角色信息失败:', error)
    }

    // 领取转盘奖励次数
    if (roleId) {
      try {
        await waitCommandDelay()
        await tokenStore.sendNightmareClaimTurnRewardTimes(token.id, {})
      } catch (error) {
        console.warn('转盘奖励次数领取失败:', error)
      }
    }

    // 获取十殿角色信息
    if (roleId) {
      try {
        await waitCommandDelay()
        await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId })
      } catch (error) {
        console.warn('获取十殿角色信息失败:', error)
      }
    }
    
    // 领取十殿图鉴奖励
    try {
      await waitCommandDelay()
      await tokenStore.sendNightmareClaimBook(token.id)
    } catch (error) {
      console.warn('十殿图鉴奖励领取失败:', error)
    }
    
    // 领取十殿周奖励
    try {
      await waitCommandDelay()
      await tokenStore.sendNightmareClaimWeekReward(token.id)
    } catch (error) {
      console.warn('十殿周奖励领取失败:', error)
    }
    
    // 转盘逻辑
    if (roleId) {
      try {
        await waitCommandDelay()
        const initialNightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId })
        
        let bookScore = 0
        if (initialNightmareInfo?.nightMareData?.bookScore !== undefined) {
          bookScore = initialNightmareInfo.nightMareData.bookScore
        } else if (initialNightmareInfo?.bookScore !== undefined) {
          bookScore = initialNightmareInfo.bookScore
        }
        
        let maxIterations = 100
        let iteration = 0
        
        while (iteration < maxIterations) {
          await waitCommandDelay()
          const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId })
          
          if (!nightmareInfo) break
          
          const turntableLeftCnt = nightmareInfo.turntableLeftCnt || 
                                   nightmareInfo.weekAward?.turntableLeftCnt || 0
          
          if (turntableLeftCnt === 0) break
          
          if (bookScore > 0 && bookScore % 5 === 0) {
            try {
              await waitCommandDelay()
              await tokenStore.sendNightmareClaimTurnRewardTimes(token.id, {})
            } catch (error) {
              console.warn('转盘奖励次数领取失败:', error)
            }
          }
          
          if (bookScore === 50) {
            try {
              await waitCommandDelay()
              await tokenStore.sendNightmareClaimBook(token.id)
            } catch (error) {
              console.warn('十殿图鉴奖励领取失败:', error)
            }
          }
          
          try {
            await waitCommandDelay()
            await tokenStore.sendNightmareClickTurntable(token.id, {})
            bookScore++
          } catch (error) {
            console.warn('转盘执行失败:', error)
          }
          
          await waitCommandDelay()
          iteration++
        }
      } catch (error) {
        console.warn('转盘操作失败:', error)
      }
    }
    
    const tokenIndex = getTokenIndex(token)
    logOperation('shidian', '批量领取', {
      cardType: '十殿 TeamID',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]十殿奖励领取完成`
    })
  } catch (error) {
    const tokenIndex = getTokenIndex(token)
    logOperation('shidian', '批量领取', {
      cardType: '十殿 TeamID',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `【序号${tokenIndex}】[${token.name || token.id}]领取十殿奖励失败: ${error.message}`
    })
    throw error
  }
}

// 批量领取十殿奖励
const batchClaimNightmareRewards = async () => {
  if (isBatchClaiming.value) {
    message.warning('批量领取正在进行中，请稍候...')
    return
  }
  
  const gameTokens = toRaw(tokenStore.gameTokens)
  if (gameTokens.length === 0) {
    message.warning('请先导入Token')
    return
  }

  isBatchClaiming.value = true
  message.info('开始批量领取十殿奖励...')
  
  try {
    // 先按名称排序
    const sortedTokens = [...gameTokens].sort((a, b) => {
      const nameA = a.name || a.id || ''
      const nameB = b.name || b.id || ''
      return nameA.localeCompare(nameB, 'zh-CN')
    })
    
    // 获取执行范围
    const tokenIndices = parseTokenRange(resourceExportRange.value)
    let tokens = getTargetTokens(tokenIndices)
    
    if (tokens.length === 0) {
      message.warning('没有符合执行范围的Token')
      isBatchClaiming.value = false
      return
    }
    
    // 使用连接池批量操作
    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          message.info(`处理Token ${globalIndex + 1}/${tokens.length}: ${token.name || token.id}`)
          await claimNightmareRewardsForCard(token)
          return { success: true, message: '领取成功' }
        } catch (error) {
          return { success: false, message: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetween: 1000,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`正在处理: ${progress.tokenName} (${progress.globalIndex}/${progress.totalTokens})`)
          } else if (progress.type === 'token-success') {
            message.success(`${progress.tokenName} 处理成功`)
          } else if (progress.type === 'token-error') {
            message.error(`${progress.tokenName} 处理失败: ${progress.message}`)
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量领取完成！成功: ${successCount}个，失败: ${failCount}个`)
    logOperation('shidian', '批量领取', {
      cardType: '十殿 TeamID',
      status: 'success',
      message: `【批量】批量领取完成！成功: ${successCount}个，失败: ${failCount}个`
    })
  } catch (error) {
    console.error('批量领取过程中发生错误:', error)
    message.error(`批量领取失败: ${error.message}`)
    logOperation('shidian', '批量领取', {
      cardType: '十殿 TeamID',
      status: 'error',
      message: `【批量】批量领取失败: ${error.message}`
    })
  } finally {
    isBatchClaiming.value = false
  }
}

// 批量刷新枕头数量
const batchRefreshPillowCount = async () => {
  if (isRefreshingPillow.value) {
    message.warning('刷新正在进行中，请稍候...')
    return
  }

  isRefreshingPillow.value = true
  try {
    const gameTokens = toRaw(tokenStore.gameTokens)
    const tokenIndices = parseTokenRange(resourceExportRange.value)
    let tokens = getTargetTokens(tokenIndices)

    if (tokens.length === 0) {
      message.warning('没有符合执行范围的Token')
      isRefreshingPillow.value = false
      return
    }

    message.info(`开始刷新枕头数量，共${tokens.length}个Token...`)

    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          message.info(`处理Token ${globalIndex + 1}/${tokens.length}: ${token.name || token.id}`)

          // 获取角色信息
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)

          if (roleInfo && roleInfo.role && roleInfo.role.items) {
            const pillowItem = roleInfo.role.items['5054']

            if (pillowItem && pillowItem.quantity !== undefined) {
              // 发送事件更新枕头数量
              emit('update-pillow-count', token.id, pillowItem.quantity)
              return { success: true, message: `枕头数量: ${pillowItem.quantity}` }
            } else {
              emit('update-pillow-count', token.id, 0)
              return { success: false, message: '未找到枕头信息' }
            }
          } else {
            emit('update-pillow-count', token.id, 0)
            return { success: false, message: '未获取到角色信息' }
          }
        } catch (error) {
          return { success: false, message: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetween: 1000,
        onProgress: (progress) => {
          if (progress.type === 'token-start') {
            message.info(`正在处理: ${progress.tokenName} (${progress.globalIndex}/${progress.totalTokens})`)
          } else if (progress.type === 'token-success') {
            message.success(`${progress.tokenName} 处理成功`)
          } else if (progress.type === 'token-error') {
            message.error(`${progress.tokenName} 处理失败: ${progress.message}`)
          }
        }
      }
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    message.success(`刷新枕头数量完成！成功: ${successCount}个，失败: ${failCount}个`)
    logOperation('shidian', '刷新枕头', {
      cardType: '十殿 TeamID',
      status: 'success',
      message: `【批量】刷新枕头数量完成！成功: ${successCount}个，失败: ${failCount}个`
    })
  } catch (error) {
    console.error('刷新枕头数量过程中发生错误:', error)
    message.error(`刷新枕头数量失败: ${error.message}`)
    logOperation('shidian', '刷新枕头', {
      cardType: '十殿 TeamID',
      status: 'error',
      message: `【批量】刷新枕头数量失败: ${error.message}`
    })
  } finally {
    isRefreshingPillow.value = false
  }
}

// 导出资源
const exportResources = async () => {
  if (isExportingResources.value) {
    message.warning('导出正在进行中，请稍候...')
    return
  }

  isExportingResources.value = true
  try {
    const tokenIndices = parseTokenRange(resourceExportRange.value)
    const targetTokens = getTargetTokens(tokenIndices)

    if (targetTokens.length === 0) {
      message.warning('没有符合执行范围的Token')
      isExportingResources.value = false
      return
    }

    message.info(`开始导出资源，共${targetTokens.length}个Token...`)

    const results = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]

      try {
        message.info(`正在处理Token ${i + 1}/${targetTokens.length}: ${token.name || token.id}`)

        // 连接token
        const connectionStatus = tokenStore.getWebSocketStatus(token.id)
        if (connectionStatus !== 'connected') {
          tokenStore.selectToken(token.id)
          let retryCount = 0
          while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 10) {
            await waitCommandDelay()
            retryCount++
          }
          
          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            message.warning(`Token ${token.name || token.id} 连接失败，跳过`)
            results.push({
              tokenId: token.id, tokenName: token.name || token.id,
              whiteJade: '-', colorJade: '-', spiritShell: '-', goldBrick: '-',
              goldenRod: '-', chestScore: '-', recruitOrder: '-',
              roleId: '连接失败', maxNightmareLevel: '-', petName: '-', success: false, error: '连接失败'
            })
            continue
          }
        }

        // 执行getroleinfo获取资源
        await waitCommandDelay()
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        
        const items = roleInfo?.role?.items || null
        const whiteJade = formatValue(findItemCount(items, 1022))
        const colorJade = formatValue(findItemCount(items, 1023))
        const spiritShell = formatValue(findItemCount(items, 1033))
        const goldBrick = formatValue(roleInfo?.role?.diamond || 0)
        const goldenRod = formatValue(findItemCount(items, 1012))
        const recruitOrder = formatValue(findItemCount(items, 1001))

        // 宝箱总分数
        let chestScore = 0
        if (items) {
          const woodBox = items['2001']?.quantity || 0
          const bronzeBox = items['2002']?.quantity || 0
          const goldenBox = items['2003']?.quantity || 0
          const platinumBox = items['2004']?.quantity || 0
          chestScore = woodBox + bronzeBox * 10 + goldenBox * 20 + platinumBox * 50
        }
        const chestScoreDisplay = chestScore > 0 ? chestScore : '-'
        const roleId = roleInfo?.role?.roleId || '未获取到'
        
        // 获取宠物名称
        const petId = roleInfo?.role?.pet?.petId
        const petName = petId && PET_DICT[petId] ? PET_DICT[petId].name : '-'
        
        // 获取十殿最高殿级
        let maxNightmareLevel = '-'  
        try {
          await waitCommandDelay()
          const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) || token.id })
          
          if (nightmareInfo && nightmareInfo.killAward) {
            const killAward = nightmareInfo.killAward
            const trueKeys = Object.keys(killAward).filter(key => killAward[key] === true)
            if (trueKeys.length > 0) {
              maxNightmareLevel = Math.max(...trueKeys.map(key => parseInt(key)))
            }
          } else if (nightmareInfo && nightmareInfo.nightMareData && nightmareInfo.nightMareData.killAward) {
            const killAward = nightmareInfo.nightMareData.killAward
            const trueKeys = Object.keys(killAward).filter(key => killAward[key] === true)
            if (trueKeys.length > 0) {
              maxNightmareLevel = Math.max(...trueKeys.map(key => parseInt(key)))
            }
          }
        } catch (error) {
          console.warn(`Token ${token.name || token.id} 获取十殿信息失败:`, error)
        }

        results.push({
          tokenId: token.id, tokenName: token.name || token.id,
          whiteJade, colorJade, spiritShell, goldBrick, goldenRod,
          chestScore: chestScoreDisplay, recruitOrder, roleId,
          maxNightmareLevel, petName, success: true
        })

        message.success(`Token ${token.name || token.id} 资源获取成功 (${i + 1}/${targetTokens.length})`)
        const tokenIndex = getTokenIndex(token)
        logOperation('shidian', '导出资源', {
          cardType: '十殿 TeamID',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]资源获取成功: 白玉${whiteJade}, 彩玉${colorJade}, 灵贝${spiritShell}, 金砖${goldBrick}, 金竿${goldenRod}, 宝箱总分数${chestScoreDisplay}, 招募令${recruitOrder}`
        })
      } catch (error) {
        console.error(`Token ${token.name || token.id} 处理失败:`, error)
        
        let roleId = '获取失败'
        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          roleId = roleInfo?.role?.roleId || '未获取到'
        } catch (roleError) {
          console.error(`Token ${token.name || token.id} 获取roleId失败:`, roleError)
        }
        
        results.push({
          tokenId: token.id, tokenName: token.name || token.id,
          whiteJade: '-', colorJade: '-', spiritShell: '-', goldBrick: '-',
          goldenRod: '-', chestScore: '-', recruitOrder: '-',
          roleId, maxNightmareLevel: '-', petName: '-', success: false, error: error.message || '未知错误'
        })
        message.warning(`Token ${token.name || token.id} 处理失败: ${error.message || '未知错误'}`)
        const tokenIndex = getTokenIndex(token)
        logOperation('shidian', '导出资源', {
          cardType: '十殿 TeamID',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]资源获取失败: ${error.message || '未知错误'}`
        })
      }

      if (i < targetTokens.length - 1) {
        await waitCommandDelay()
      }
    }

    // 生成导出文件
    const lines = []
    lines.push("=".repeat(80))
    lines.push("资源导出")
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`执行范围: ${resourceExportRange.value || '全部Token'}`)
    lines.push(`Token数量: ${targetTokens.length}`)
    lines.push("=".repeat(80))
    lines.push("")
    lines.push("序号,Token名称,roleId,白玉,彩玉,灵贝,金砖,金竿,宝箱总分数,招募令,宠物名称,十殿最高殿级,状态")
    lines.push("-".repeat(80))

    results.forEach((result, index) => {
      const status = result.success ? '成功' : `失败: ${result.error || '未知错误'}`
      lines.push(`${index + 1},${result.tokenName},${result.roleId || '未获取到'},${result.whiteJade},${result.colorJade},${result.spiritShell},${result.goldBrick},${result.goldenRod},${result.chestScore},${result.recruitOrder},${result.petName || '-'},${result.maxNightmareLevel},${status}`)
    })

    lines.push("")
    lines.push("=".repeat(80))
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    lines.push(`总计: 成功 ${successCount} 个，失败 ${failCount} 个`)
    lines.push("=".repeat(80))

    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const fileName = `资源导出_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.csv`
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success(`资源导出完成！成功: ${successCount}个，失败: ${failCount}个`)
    logOperation('shidian', '导出资源', {
      cardType: '十殿 TeamID',
      status: 'success',
      message: `资源导出完成！成功: ${successCount}个，失败: ${failCount}个`
    })
  } catch (error) {
    console.error('导出资源失败:', error)
    message.error(`导出资源失败: ${error.message || error}`)
    logOperation('shidian', '导出资源', {
      cardType: '十殿 TeamID',
      status: 'error',
      message: `导出资源失败: ${error.message || error}`
    })
  } finally {
    isExportingResources.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  autoJoinShiDian,
  stopAutoJoinShiDian,
  addMembersToTeams,
  executeNightmare8,
  batchClaimNightmareRewards,
  exportResources,
  batchRefreshPillowCount
})

// 组件挂载时加载设置
onMounted(() => {
  loadDropdownSettings()
})
</script>

<style scoped>
.helper {
  grid-column: span 1;
}
</style>
