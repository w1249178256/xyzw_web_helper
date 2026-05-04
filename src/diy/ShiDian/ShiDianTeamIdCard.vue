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
          button-text="全部清除"
          :disabled="!teamIds?.some(id => id)"
          @button-click="clearAllTeamIds"
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
        <CustomizedCard 
          mode="button-placeholder"
          button-text="批量切换阵2"
          :disabled="isSwitchingTeam2 || !tokenStore.hasTokens"
          @button-click="batchSwitchTeam2"
        />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="十殿 TeamID"
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
const commandDelay = inject('commandDelay', ref(600))

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

// TeamID 相关变量
const teamIds = ref(['', '', '', '', ''])
const isAutoJoinRunning = ref(false)
const stopAutoJoinFlag = ref(false)
const isAddingMembers = ref(false)

// 十殿 8 相关变量
const teamIdForDian8 = ref('')
const isExecutingNightmare8 = ref(false)
const connectingTokens = ref(new Set())

// 批量切换阵2相关变量
const isSwitchingTeam2 = ref(false)

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
    console.log('TeamID 已保存到 localStorage:', settings.teamIds)
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
            message: `${token.name} 已加入十殿${dianLabels[teamIdx]}，队伍号：${currentTeamId}`
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
            message: `${token.name} 加入失败：${error.message}`
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

  // 触发事件，让父组件执行自动加入十殿
  emit('auto-join-shidian')
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
      message: `${tokenIndex}、${dian87Token.name || dian87Token.id}、十殿 8 执行完成，队伍号：${teamIdForDian8.value}`
    })
    
  } catch (error) {
    console.error('十殿 8 执行失败:', error)
    message.error(`十殿 8 执行失败：${error.message || '未知错误'}`)
  } finally {
    isExecutingNightmare8.value = false
  }
}

// 批量切换阵2
const batchSwitchTeam2 = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }

  isSwitchingTeam2.value = true
  
  try {
    message.info('开始批量切换阵2...')
    
    const gameTokens = toRaw(tokenStore.gameTokens)
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < gameTokens.length; i++) {
      const token = gameTokens[i]
      if (!token || !token.id) continue
      
      try {
        const connectionAcquired = await connectionPool.acquire(token.id)
        
        if (!connectionAcquired) {
          message.warning(`${token.name} 连接失败`)
          failCount++
          continue
        }
        
        await waitCommandDelay()
        
        if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
          message.warning(`${token.name} WebSocket未连接`)
          await connectionPool.release(token.id, false)
          failCount++
          continue
        }
        
        message.info(`正在切换 ${token.name} 到阵2...`)
        
        await tokenStore.sendGameMessage(token.id, 'presetteam_saveteam', { 
          teamId: 2 
        })
        
        message.success(`${token.name} 已切换到阵2`)
        successCount++
        
        await connectionPool.release(token.id, true)
        
      } catch (error) {
        console.error(`${token.name} 切换阵2失败:`, error)
        message.error(`${token.name} 切换阵2失败：${error.message}`)
        failCount++
        try {
          await connectionPool.release(token.id, false)
        } catch (releaseError) {
          console.error('释放连接失败:', releaseError)
        }
      }
      
      if (i < gameTokens.length - 1) {
        await waitCommandDelay()
      }
    }
    
    message.success(`批量切换阵2完成！成功: ${successCount}，失败: ${failCount}`)
    
    logOperation('shidian', '批量切换阵2', {
      cardType: '十殿 TeamID',
      status: 'success',
      message: `批量切换阵2完成，成功: ${successCount}，失败: ${failCount}`
    })
    
  } catch (error) {
    console.error('批量切换阵2失败:', error)
    message.error(`批量切换阵2失败：${error.message || '未知错误'}`)
    logOperation('shidian', '批量切换阵2', {
      cardType: '十殿 TeamID',
      status: 'error',
      message: `批量切换阵2失败：${error.message}`
    })
  } finally {
    isSwitchingTeam2.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  autoJoinShiDian,
  stopAutoJoinShiDian,
  addMembersToTeams,
  executeNightmare8,
  batchSwitchTeam2
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
