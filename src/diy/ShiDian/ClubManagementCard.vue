<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <People />
      </n-icon>
    </template>
    <template #title>
      <h3>俱乐部</h3>
    </template>
    <template #badge>
      <span>{{ hasClub ? '已加入' : '未加入' }}</span>
    </template>
    <template #default>
      <div class="club-management-content">
        <!-- 功法图鉴信息表格 - 移到上方 -->
        <div class="legacy-book-table-container" v-if="legacyBookInfo.books || legacyBookInfo.storage">
          <table class="legacy-book-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>金卡</th>
                <th>红卡</th>
                <th>橙卡</th>
                <th>蓝卡</th>
                <th>紫卡</th>
                <th>绿卡</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>图鉴</td>
                <td>{{ legacyBookInfo.books['501'] || 0 }}</td>
                <td>{{ legacyBookInfo.books['401'] || 0 }}<br>{{ legacyBookInfo.books['402'] || 0 }}<br>{{ legacyBookInfo.books['403'] || 0 }}</td>
                <td>{{ legacyBookInfo.books['301'] || 0 }}<br>{{ legacyBookInfo.books['302'] || 0 }}</td>
                <td>{{ legacyBookInfo.books['201'] || 0 }}<br>{{ legacyBookInfo.books['202'] || 0 }}</td>
                <td>{{ legacyBookInfo.books['101'] || 0 }}<br>{{ legacyBookInfo.books['102'] || 0 }}</td>
                <td>{{ legacyBookInfo.books['1'] || 0 }}<br>{{ legacyBookInfo.books['2'] || 0 }}</td>
              </tr>
              <tr>
                <td>仓库</td>
                <td>{{ legacyBookInfo.storage['501'] || 0 }}</td>
                <td>{{ legacyBookInfo.storage['401'] || 0 }}<br>{{ legacyBookInfo.storage['402'] || 0 }}<br>{{ legacyBookInfo.storage['403'] || 0 }}</td>
                <td>{{ legacyBookInfo.storage['301'] || 0 }}<br>{{ legacyBookInfo.storage['302'] || 0 }}</td>
                <td>{{ legacyBookInfo.storage['201'] || 0 }}<br>{{ legacyBookInfo.storage['202'] || 0 }}</td>
                <td>{{ legacyBookInfo.storage['101'] || 0 }}<br>{{ legacyBookInfo.storage['102'] || 0 }}</td>
                <td>{{ legacyBookInfo.storage['1'] || 0 }}<br>{{ legacyBookInfo.storage['2'] || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 俱乐部功能显示 - 使用一个CustomizedCard容器容纳主要操作按钮 -->
        <CustomizedCard mode="container">
          <!-- 功法挂机功能区域 - 直接放在容器中，自动两个一行 -->
          <CustomizedCard mode="button-number-input" name="赠送目标" v-model:inputValue="legacyTargetId" placeholder="输入赠送目标ID" @update:inputValue="handleLegacyTargetIdInput" :disabled="isLegacyCollectRunning" />
          <CustomizedCard mode="button-number-input" name="密码" v-model:inputValue="legacyPassword" placeholder="输入密码" @update:inputValue="handleLegacyPasswordInput" :disabled="isLegacyCollectRunning" />
          <CustomizedCard mode="button" name="功法挂机" :disabled="!selectedTokenId" @button-click="handleLegacyHangup" />
          <!-- 收集功法功能区域 -->
          <CustomizedCard mode="button" name="收集功法" :disabled="!selectedTokenId || isLegacyCollectRunning" @button-click="handleLegacyCollect" />
          <CustomizedCard mode="button" :name="isAcceptGiftRunning ? '接受礼物中...' : '接受礼物'" :disabled="isAcceptGiftRunning || !selectedTokenId" @button-click="handleAcceptGift" />
          <CustomizedCard mode="button" :name="isExportLegacyDetailsRunning ? '导出中...' : '导出功法详情'" :disabled="isExportLegacyDetailsRunning || !selectedTokenId" @button-click="handleExportLegacyDetails" />
          <!-- 功法图鉴功能区域 -->
          <CustomizedCard mode="button" name="刷新图鉴信息" :disabled="!selectedTokenId || isRefreshLegacyInfoRunning" @button-click="handleRefreshLegacyInfo" />
          <CustomizedCard mode="button" name="激活功法图鉴" :disabled="!selectedTokenId || isLegacyBookRunning" @button-click="handleLegacyBook" />
          
          <!-- 俱乐部基本功能按钮 -->
          <CustomizedCard 
            mode="button" 
            name="获取俱乐部信息" 
            :disabled="!selectedTokenId || isRunning"
            @button-click="fetchClubInfo"
          />
          <CustomizedCard 
            mode="button" 
            :name="isRunning ? '批量加入中...' : '批量加入俱乐部'" 
            :disabled="isRunning"
            @button-click="batchFetchClubInfo"
          />
          <CustomizedCard 
            mode="button-number-input" 
            name="加入俱乐部" 
            v-model:inputValue="legionId" 
            placeholder="输入俱乐部ID" 
            @update:inputValue="handleLegionIdInput" 
            @button-click="joinLegion" 
            :disabled="!legionId"
          />
        </CustomizedCard>
        
        <!-- 新增容器：执行范围及批量操作 -->
        <CustomizedCard mode="container">
          <CustomizedCard mode="execution-range" name="执行范围" v-model:inputValue="legionTokens" placeholder="留空执行全部，或输入 1-20 或 1,2,3" @update:inputValue="handleLegionTokensInput" />
          <CustomizedCard 
            mode="button" 
            :name="isExportClubInfoRunning ? '导出中...' : '导出俱乐部信息'" 
            :disabled="isExportClubInfoRunning"
            @button-click="handleExportClubInfo"
          />
          <CustomizedCard mode="button" :name="isLegacyClaimGiftRunning ? '批量领取中...' : '批量领取功法礼物'" :disabled="isLegacyClaimGiftRunning" @button-click="handleBatchLegacyClaimGift" />
          <CustomizedCard mode="button" :name="isBatchLegacyBookRunning ? '批量功法图鉴中...' : '批量功法图鉴'" :disabled="isBatchLegacyBookRunning" @button-click="handleBatchLegacyBook" />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="俱乐部管理"
        :filter-operations="['功法挂机', '收集功法', '批量领取功法礼物', '接受礼物', '导出功法详情', '导出俱乐部信息', '刷新图鉴信息', '激活功法图鉴', '批量功法图鉴']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onBeforeUnmount } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { logOperation } from '@/utils/operationLogger'
import ConnectionPoolManager from '@/utils/connectionPoolManager.js'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/ShiDian/OperationLogCard.vue'
import { People } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()

const legionTokens = ref('')
const exportClubInfoTokens = ref('')
const legionId = ref('')
const legacyTargetId = ref('111582820') // 默认赠送目标
const legacyPassword = ref('946215') // 默认密码
const isLegacyHangupRunning = ref(false)
const isLegacyCollectRunning = ref(false)
const isLegacyClaimGiftRunning = ref(false)
const isAcceptGiftRunning = ref(false)
const isBatchAcceptGiftRunning = ref(false)
const isExportLegacyDetailsRunning = ref(false)
const isExportClubInfoRunning = ref(false)
const isLegacyBookRunning = ref(false)
const isBatchLegacyBookRunning = ref(false)
const isRefreshLegacyInfoRunning = ref(false)
const legacyBookInfo = ref({
  books: {},
  storage: {}
})

// 按token昵称排序的token列表（与页面显示顺序一致）
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 30000,
  idleTimeout: 60000,
  queueTimeout: 120000,
  reconnectDelay: 1000,
  maxRetries: 3
})

// 组件卸载前清理连接池
onBeforeUnmount(async () => {
  try {
    await connectionPool.destroy()
    console.log('[ClubManagementCard] 连接池已清理')
  } catch (error) {
    console.error('[ClubManagementCard] 清理连接池失败:', error)
  }
})

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  hasClub: {
    type: Boolean,
    default: false
  },
  clubName: {
    type: String,
    default: '未加入'
  },
  memberCount: {
    type: Number,
    default: 0
  },
  clubPower: {
    type: [String, Number],
    default: 0
  },
  isSignedIn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'refresh-club-info',
  'sign-in-club',
  'view-club-details',
  'batch-fetch-club-info',
  'fetch-club-info',
  'handle-legion-tokens-input',
  'handle-legion-id-input',
  'join-legion'
])


const refreshClubInfo = () => {
  emit('refresh-club-info')
}

const signInClub = () => {
  emit('sign-in-club')
}

const viewClubDetails = () => {
  emit('view-club-details')
}

const fetchClubInfo = () => {
  emit('fetch-club-info')
}

const batchFetchClubInfo = () => {
  emit('batch-fetch-club-info')
}

// 处理俱乐部执行范围输入
const handleLegionTokensInput = (value) => {
  legionTokens.value = value
  emit('handle-legion-tokens-input', value)
}

// 处理俱乐部ID输入
const handleLegionIdInput = (value) => {
  legionId.value = value
  emit('handle-legion-id-input', value)
}

// 处理赠送目标ID输入
const handleLegacyTargetIdInput = (value) => {
  legacyTargetId.value = value
}

// 处理密码输入
const handleLegacyPasswordInput = (value) => {
  legacyPassword.value = value
}

// 加入俱乐部
const joinLegion = () => {
  emit('join-legion', legionTokens.value, legionId.value)
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

// 功法挂机（单个）
const handleLegacyHangup = async () => {
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
    isLegacyHangupRunning.value = true
    
    // 检查连接状态
    let status = tokenStore.getWebSocketStatus(token.id)
    
    // 如果未连接，尝试连接（最多5次）
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
        
        if (status !== 'connected') {
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
    
    // 执行领取挂机命令
    message.info('正在领取功法挂机奖励...')
    
    try {
      const res = await tokenStore.sendMessageWithPromise(
        token.id,
        'legacy_claimhangup',
        {},
        5000
      )
      
      // 检查响应结果
      console.log('功法挂机响应:', res)
      
      // 检查是否有错误码
      if (res && res.code !== undefined && res.code !== 0) {
        const errorMsg = res.msg || res.message || `错误码: ${res.code}`
        console.error('功法挂机失败 - 错误码:', res.code, '错误信息:', errorMsg)
        message.error(`功法挂机失败: ${errorMsg} (错误码: ${res.code})`)
        return
      }
      
      // 检查响应数据
      if (!res) {
        console.error('功法挂机失败 - 响应为空')
        message.error('功法挂机失败: 服务器未返回响应')
        return
      }
      
      // 检查是否成功领取
      if (res.reward && res.reward.length > 0) {
        const rewardInfo = res.reward.map(r => {
          // 如果奖励是功法残卷（itemId: 37007），显示为"功法残卷"
          const itemName = (r.itemId === 37007 || r.id === 37007) ? '功法残卷' : (r.name || '未知')
          return `${itemName} x${r.value || r.count || 0}`
        }).join(', ')
        console.log('功法挂机成功 - 奖励:', rewardInfo)
        message.success(`功法挂机奖励领取成功: ${rewardInfo}`)
      logOperation('shidian', '功法挂机', {
        cardType: '俱乐部管理',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `功法挂机奖励领取成功: ${rewardInfo}`
      })
      } else if (res.role && res.role.items) {
        // 检查是否有物品更新
        const item37007 = res.role.items[37007]
        if (item37007) {
          console.log('功法挂机成功 - 功法残卷数量:', item37007.quantity)
          message.success(`功法挂机奖励领取成功，功法残卷: ${item37007.quantity}`)
          logOperation('shidian', '功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `功法挂机奖励领取成功，功法残卷: ${item37007.quantity}`
          })
        } else {
          console.log('功法挂机成功 - 但无奖励信息')
          message.success('功法挂机奖励领取成功')
          logOperation('shidian', '功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '功法挂机奖励领取成功'
          })
        }
      } else {
        console.log('功法挂机成功 - 但响应格式异常:', res)
        message.success('功法挂机奖励领取成功')
        logOperation('shidian', '功法挂机', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: '功法挂机奖励领取成功'
        })
      }
      
      // 刷新角色信息
      await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    } catch (error) {
      console.error('功法挂机失败 - 异常详情:', {
        error,
        message: error.message,
        stack: error.stack,
        response: error.response || error.data
      })
      
      // 检查错误类型
      let errorMessage = '未知错误'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.code) {
        errorMessage = `错误码: ${error.code}`
        if (error.msg) {
          errorMessage += ` - ${error.msg}`
        }
      } else if (error.response) {
        errorMessage = `响应错误: ${JSON.stringify(error.response)}`
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // 常见错误提示
      if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接'
      } else if (errorMessage.includes('未连接') || errorMessage.includes('disconnected')) {
        errorMessage = 'WebSocket未连接，请先连接Token'
      } else if (errorMessage.includes('已领取') || errorMessage.includes('already')) {
        errorMessage = '今日已领取功法挂机奖励'
      } else if (errorMessage.includes('没有') || errorMessage.includes('不足')) {
        errorMessage = '没有可领取的功法挂机奖励'
      }
      
      message.error(`功法挂机失败: ${errorMessage}`)
      logOperation('shidian', '功法挂机', {
        cardType: '俱乐部管理',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `功法挂机失败: ${errorMessage}`
      })
    } finally {
      isLegacyHangupRunning.value = false
    }
  } catch (error) {
    console.error('功法挂机失败 - 外层异常:', error)
    message.error('功法挂机失败: ' + (error.message || '未知错误'))
    logOperation('shidian', '功法挂机', {
      cardType: '俱乐部管理',
      tokenId: token?.id,
      tokenName: token?.name,
      status: 'error',
      message: `功法挂机失败: ${error.message || '未知错误'}`
    })
    isLegacyHangupRunning.value = false
  }
}

// 批量功法挂机
const handleBatchLegacyHangup = async () => {
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
  // 获取目标Token列表（根据执行范围过滤）
  const targetTokens = connectionPool.getTargetTokens(tokens, tokenIndices)
  
  if (targetTokens.length === 0) {
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.warning(`执行范围${rangeText}内没有找到Token`)
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
  message.info(`开始批量功法挂机（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  try {
    isLegacyHangupRunning.value = true
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const res = await tokenStore.sendMessageWithPromise(
            token.id,
            'legacy_claimhangup',
            {},
            5000
          )
          
          console.log(`[${globalIndex + 1}] 功法挂机响应:`, res)
          
          if (res && res.code !== undefined && res.code !== 0) {
            const errorMsg = res.msg || res.message || `错误码: ${res.code}`
            console.error(`[${globalIndex + 1}] 功法挂机失败 - 错误码:`, res.code, '错误信息:', errorMsg)
            message.error(`[${globalIndex + 1}] ${token.name || token.id}: ${errorMsg} (错误码: ${res.code})`)
            logOperation('shidian', '批量功法挂机', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `${token.name || token.id}: ${errorMsg} (错误码: ${res.code})`
            })
            return { success: false, error: errorMsg }
          }
          
          if (!res) {
            console.error(`[${globalIndex + 1}] 功法挂机失败 - 响应为空`)
            message.error(`[${globalIndex + 1}] ${token.name || token.id}: 服务器未返回响应`)
            logOperation('shidian', '批量功法挂机', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `${token.name || token.id}: 服务器未返回响应`
            })
            return { success: false, error: '服务器未返回响应' }
          }
          
          let successMsg = `[${globalIndex + 1}] ${token.name || token.id} 功法挂机奖励领取成功`
          if (res.reward && res.reward.length > 0) {
            const rewardInfo = res.reward.map(r => {
              const itemName = (r.itemId === 37007 || r.id === 37007) ? '功法残卷' : (r.name || '未知')
              return `${itemName} x${r.value || r.count || 0}`
            }).join(', ')
            successMsg += `: ${rewardInfo}`
          } else if (res.role && res.role.items && res.role.items[37007]) {
            const item37007 = res.role.items[37007]
            successMsg += `，功法残卷: ${item37007.quantity}`
          }
          
          await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
          
          message.success(successMsg)
          logOperation('shidian', '批量功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: successMsg.replace(`[${globalIndex + 1}] `, '')
          })
          
          return { success: true, result: res }
        } catch (error) {
          console.error(`[${globalIndex + 1}] 功法挂机失败 - 异常详情:`, {
            token: token.name || token.id,
            error,
            message: error.message,
            stack: error.stack,
            response: error.response || error.data
          })
          
          let errorMessage = '未知错误'
          
          if (error.message) {
            errorMessage = error.message
          } else if (error.code) {
            errorMessage = `错误码: ${error.code}`
            if (error.msg) {
              errorMessage += ` - ${error.msg}`
            }
          } else if (error.response) {
            errorMessage = `响应错误: ${JSON.stringify(error.response)}`
          } else if (typeof error === 'string') {
            errorMessage = error
          }
          
          if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
            errorMessage = '请求超时，请检查网络连接'
          } else if (errorMessage.includes('未连接') || errorMessage.includes('disconnected')) {
            errorMessage = 'WebSocket未连接'
          } else if (errorMessage.includes('已领取') || errorMessage.includes('already')) {
            errorMessage = '今日已领取功法挂机奖励'
          } else if (errorMessage.includes('没有') || errorMessage.includes('不足')) {
            errorMessage = '没有可领取的功法挂机奖励'
          }
          
          message.error(`[${globalIndex + 1}] ${token.name || token.id}: ${errorMessage}`)
          logOperation('shidian', '批量功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${token.name || token.id}: ${errorMessage}`
          })
          
          return { success: false, error: errorMessage }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量功法挂机完成')
    logOperation('shidian', '批量功法挂机', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量功法挂机完成'
    })
  } catch (error) {
    console.error('批量功法挂机失败:', error)
    message.error('批量功法挂机失败')
  } finally {
    isLegacyHangupRunning.value = false
  }
}

// 收集功法（单个）
const handleLegacyCollect = async () => {
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
    isLegacyCollectRunning.value = true
    
    // 检查连接状态
    let status = tokenStore.getWebSocketStatus(token.id)
    
    // 如果未连接，尝试连接（最多5次）
    if (status !== 'connected') {
      message.info('Token未连接，正在尝试连接...')
      
      let retryCount = 0
      const maxRetries = 5
      
      while (status !== 'connected' && retryCount < maxRetries) {
        tokenStore.selectToken(token.id, true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        status = tokenStore.getWebSocketStatus(token.id)
        retryCount++
        
        if (status !== 'connected' && retryCount < maxRetries) {
          message.info(`连接尝试 ${retryCount}/${maxRetries}...`)
        }
      }
      
      if (status !== 'connected') {
        message.error('连接失败，请手动连接Token后再试')
        return
      }
      
      message.success('Token连接成功')
    }
    
    // 1. 使用 role_getroleinfo 获取 items:37007 数量
    message.info('正在获取功法残卷数量...')
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    const legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
    
    if (legacyFragmentCount === 0) {
      message.warning('功法残卷数量为0，无法收集')
      return
    }
    
    console.log(`功法残卷数量: ${legacyFragmentCount}`)
    message.success(`获取到功法残卷数量: ${legacyFragmentCount}`)
    
    // 2. 使用 role_commitpassword 命令
    message.info('正在提交密码...')
    try {
      await tokenStore.sendRoleCommitPassword(token.id, {
        password: legacyPassword.value ? parseInt(legacyPassword.value) : 946215
      })
      message.success('密码提交成功')
      
      // 提交密码后需要等待一段时间使其生效
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error('提交密码失败:', error)
      message.warning('提交密码失败，但继续执行')
    }
    
    // 3. 使用 legacy_sendgift 命令，itemCnt 设为获取的 items:37007 数量
    message.info(`正在赠送功法残卷，数量: ${legacyFragmentCount}...`)
    try {
      const giftRes = await tokenStore.sendLegacySendGift(token.id, {
        itemCnt: legacyFragmentCount,
        targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820
      })
      
      console.log('赠送功法残卷响应:', giftRes)
      
      if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
        const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
        message.error(`收集功法失败: ${errorMsg} (错误码: ${giftRes.code})`)
        return
      }
      
      message.success(`收集功法成功，已赠送 ${legacyFragmentCount} 个功法残卷`)
    } catch (error) {
      console.error('赠送功法残卷失败:', error)
      let errorMessage = error.message || '未知错误'
      
      if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接'
      } else if (errorMessage.includes('未连接') || errorMessage.includes('disconnected')) {
        errorMessage = 'WebSocket未连接，请先连接Token'
      }
      
      message.error(`收集功法失败: ${errorMessage}`)
    }
  } catch (error) {
    console.error('收集功法失败:', error)
    message.error('收集功法失败: ' + (error.message || '未知错误'))
  } finally {
    isLegacyCollectRunning.value = false
  }
}

// 批量收集功法
const handleBatchLegacyCollect = async () => {
  // 查找标签为"功法"的token（通过remark字段判断）
  // 支持格式：包含"功法"的remark，如"殿0 功法"、"功法"等
  const allLegacyTokens = sortedTokens.value.filter(t => {
    if (!t.remark) return false
    const remark = t.remark.trim()
    // 检查是否包含"功法"
    return remark.includes('功法')
  })
  
  // 调试信息：显示所有token的remark
  console.log('所有Token的remark:', sortedTokens.value.map(t => ({
    id: t.id,
    name: t.name,
    remark: t.remark || '(无)'
  })))
  console.log('找到的功法Token:', allLegacyTokens.map(t => ({
    id: t.id,
    name: t.name,
    remark: t.remark
  })))
  
  if (allLegacyTokens.length === 0) {
    const allRemarks = sortedTokens.value.map(t => t.remark || '(无)').join(', ')
    message.warning(`没有找到标签为"功法"的Token。当前所有Token的标签: ${allRemarks}`)
    return
  }
  
  try {
    isLegacyCollectRunning.value = true
    message.info(`开始批量收集功法，找到${allLegacyTokens.length}个标签为"功法"的Token...`)
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      allLegacyTokens,
      async (token, globalIndex) => {
        try {
          message.info(`[${globalIndex + 1}] ${token.name || token.id} 正在获取功法残卷数量...`)
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          const legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
          
          if (legacyFragmentCount === 0) {
            message.warning(`[${globalIndex + 1}] ${token.name || token.id}: 功法残卷数量为0，跳过`)
            logOperation('shidian', '批量收集功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `功法残卷数量为0，跳过`
            })
            return { collected: false, fragmentCount: 0 }
          }
          
          console.log(`[${globalIndex + 1}] ${token.name || token.id} 功法残卷数量: ${legacyFragmentCount}`)
          
          try {
            await tokenStore.sendRoleCommitPassword(token.id, {})
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 提交密码失败:`, error)
          }
          
          try {
            message.info(`[${globalIndex + 1}] ${token.name || token.id} 正在赠送功法残卷，数量: ${legacyFragmentCount}...`)
            const giftRes = await tokenStore.sendLegacySendGift(token.id, {
              itemCnt: legacyFragmentCount
            })
            
            if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
              const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
              message.error(`[${globalIndex + 1}] ${token.name || token.id}: ${errorMsg}`)
              logOperation('shidian', '批量收集功法', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `收集功法失败: ${errorMsg}`
              })
              return { collected: false, error: errorMsg }
            }
            
            message.success(`[${globalIndex + 1}] ${token.name || token.id}: 收集功法成功，已赠送 ${legacyFragmentCount} 个功法残卷`)
            logOperation('shidian', '批量收集功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `收集功法成功，已赠送 ${legacyFragmentCount} 个功法残卷`
            })
            return { collected: true, fragmentCount: legacyFragmentCount }
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 赠送功法残卷失败:`, error)
            message.error(`[${globalIndex + 1}] ${token.name || token.id}: 赠送失败 - ${error.message || '未知错误'}`)
            logOperation('shidian', '批量收集功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `赠送功法失败: ${error.message || '未知错误'}`
            })
            return { collected: false, error: error.message || '未知错误' }
          }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 收集功法失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id}: 收集功法失败`)
          logOperation('shidian', '批量收集功法', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `收集功法失败: ${error.message || '未知错误'}`
          })
          return { collected: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量收集功法完成')
  } catch (error) {
    console.error('批量收集功法失败:', error)
    message.error('批量收集功法失败')
  } finally {
    isLegacyCollectRunning.value = false
  }
}

// 批量领取功法礼物
const handleBatchLegacyClaimGift = async () => {
  try {
    isLegacyClaimGiftRunning.value = true
    message.info('开始批量领取功法礼物...')
    logOperation('shidian', '批量领取功法礼物', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量领取功法礼物...'
    })

    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    
    // 获取目标Token列表（根据执行范围过滤）
    const legacyTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (legacyTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量领取功法礼物', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到${legacyTokens.length}个Token（${rangeText}）`)
    logOperation('shidian', '批量领取功法礼物', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `找到${legacyTokens.length}个Token（${rangeText}）`
    })

    const allTokens = sortedTokens.value
    const passportToken = allTokens.find(t => {
      if (!t.remark) return false
      return t.remark.trim().includes('通行证')
    })
    
    if (!passportToken) {
      message.warning('没有找到标签为"通行证"的Token，将跳过接受礼物步骤')
      logOperation('shidian', '批量领取功法礼物', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: '没有找到标签为"通行证"的Token，将跳过接受礼物步骤'
      })
    } else {
      console.log(`找到${legacyTokens.length}个Token，通行证Token: ${passportToken.name || passportToken.id}`)
      logOperation('shidian', '批量领取功法礼物', {
        cardType: '俱乐部管理',
        status: 'info',
        message: `找到通行证Token: ${passportToken.name || passportToken.id}`
      })
    }

    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      legacyTokens,
      async (token, globalIndex) => {
        // 执行领取功法操作
        await tokenStore.sendLegacyClaimHangup(token.id, {})
        logOperation('shidian', '批量领取功法礼物', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: '收集功法成功'
        })
        await new Promise(resolve => setTimeout(resolve, 300))

        let legacyFragmentCount = 0
        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
          console.info(`[${globalIndex + 1}] ${token.name || token.id} 当前功法残卷数量: ${legacyFragmentCount}`)
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 获取角色信息失败:`, error)
        }

        if (legacyFragmentCount < 100) {
          console.info(`[${globalIndex + 1}] ${token.name || token.id} 功法残卷数量(${legacyFragmentCount})小于100，跳过收集功法按钮`)
          logOperation('shidian', '批量领取功法礼物', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `功法残卷数量(${legacyFragmentCount})小于100，跳过收集功法按钮`
          })
          return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount }
        }

        if (legacyFragmentCount > 0) {
          const sendCount = legacyFragmentCount > 9999 ? 9999 : legacyFragmentCount
          
          try {
            await tokenStore.sendRoleCommitPassword(token.id, {
              password: legacyPassword.value ? parseInt(legacyPassword.value) : 946215
            })
            console.info(`[${globalIndex + 1}] ${token.name || token.id} 提交密码成功`)
            
            // 提交密码后需要等待一段时间使其生效
            await new Promise(resolve => setTimeout(resolve, 300))
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 提交密码失败:`, error)
            console.info(`[${globalIndex + 1}] ${token.name || token.id} 提交密码失败，但继续执行`)
          }
          
          try {
            const giftRes = await tokenStore.sendLegacySendGift(token.id, {
              itemCnt: sendCount,
              targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820,
              legacyUIds: []
            })
            
            if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
              const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
              console.error(`[${globalIndex + 1}] ${token.name || token.id} 赠送功法残卷失败: ${errorMsg}`)
              logOperation('shidian', '批量领取功法礼物', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `赠送功法残卷失败: ${errorMsg}`
              })
              return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount, error: errorMsg }
            } else {
              console.info(`[${globalIndex + 1}] ${token.name || token.id} 模拟点击收集功法按钮完成，已赠送 ${sendCount} 个功法残卷`)
              logOperation('shidian', '批量领取功法礼物', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `模拟点击收集功法按钮完成，已赠送 ${sendCount} 个功法残卷`
              })
              return { collected: true, sentGift: true, fragmentCount: legacyFragmentCount, sendCount: sendCount }
            }
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 执行legacy_sendgift失败:`, error)
            logOperation('shidian', '批量领取功法礼物', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `执行legacy_sendgift失败: ${error.message || error}`
            })
            return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount, error: error.message || error }
          }
        } else {
          console.info(`[${globalIndex + 1}] ${token.name || token.id} 功法残卷数量为0，跳过`)
          logOperation('shidian', '批量领取功法礼物', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: '功法残卷数量为0，跳过'
          })
          return { collected: true, sentGift: false, fragmentCount: 0 }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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

    if (passportToken) {
      message.info(`连接通行证Token ${passportToken.name || passportToken.id}...`)
      
      // 连接通行证Token并接受礼物
      const passportResults = await connectionPool.batchOperate(
        [passportToken],
        async (token, index) => {
          for (let j = 0; j < 2; j++) {
            if (!isLegacyClaimGiftRunning.value) break

            try {
              await tokenStore.sendLegacyClaimGift(token.id, {})
              message.success(`通行证Token ${token.name || token.id} 第${j + 1}次接受礼物成功`)
              logOperation('shidian', '批量领取功法礼物', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `通行证Token 第${j + 1}次接受礼物成功`
              })
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              console.error(`通行证Token ${token.name || token.id} 第${j + 1}次接受礼物失败:`, error)
              message.error(`通行证Token ${token.name || token.id} 第${j + 1}次接受礼物失败: ${error.message || error}`)
              logOperation('shidian', '批量领取功法礼物', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `通行证Token 第${j + 1}次接受礼物失败: ${error.message || error}`
              })
            }
          }
          return { success: true }
        },
        {
          batchSize: 1,
          delayBetween: 300,
          onProgress: (progress) => {
            if (progress.type === 'token-success') {
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
    }

    message.success('批量领取功法礼物已完成')
    logOperation('shidian', '批量领取功法礼物', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量领取功法礼物已完成'
    })
  } catch (error) {
    console.error('批量领取功法礼物失败:', error)
    message.error(`批量领取功法礼物失败: ${error.message || error}`)
    logOperation('shidian', '批量领取功法礼物', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `批量领取功法礼物失败: ${error.message || error}`
    })
  } finally {
    isLegacyClaimGiftRunning.value = false
  }
}

// 接受礼物（执行legacy_claimgift）
const handleAcceptGift = async () => {
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
    isAcceptGiftRunning.value = true
    message.info('正在接受礼物...')

    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.info('正在连接游戏...')
      tokenStore.selectToken(token.id, true)

      let count = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        count++
      }

      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.error('WebSocket连接失败，请稍后重试')
        return
      }
      message.success('游戏连接成功')
    }

    // 执行legacy_claimgift
    await tokenStore.sendLegacyClaimGift(token.id, {})
    message.success('接受礼物成功')
    logOperation('shidian', '接受礼物', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '接受礼物成功'
    })
  } catch (error) {
    console.error('接受礼物失败:', error)
    message.error(`接受礼物失败: ${error.message || error}`)
    logOperation('shidian', '接受礼物', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `接受礼物失败: ${error.message || error}`
    })
  } finally {
    isAcceptGiftRunning.value = false
  }
}

// 批量接受礼物
const handleBatchAcceptGift = async () => {
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
  // 获取目标Token列表（根据执行范围过滤）
  const targetTokens = connectionPool.getTargetTokens(tokens, tokenIndices)
  
  if (targetTokens.length === 0) {
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.warning(`执行范围${rangeText}内没有找到Token`)
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
  message.info(`开始批量接受礼物（${rangeText}），共${targetTokens.length}个Token...`)
  
  try {
    isBatchAcceptGiftRunning.value = true
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          await tokenStore.sendLegacyClaimGift(token.id, {})
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 接受礼物成功`)
          logOperation('shidian', '批量接受礼物', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `接受礼物成功`
          })
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 接受礼物失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 接受礼物失败: ${error.message || error}`)
          logOperation('shidian', '批量接受礼物', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `接受礼物失败: ${error.message || error}`
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
    
    message.success('批量接受礼物完成')
    logOperation('shidian', '批量接受礼物', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量接受礼物完成'
    })
  } catch (error) {
    console.error('批量接受礼物失败:', error)
    message.error('批量接受礼物失败')
    logOperation('shidian', '批量接受礼物', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `批量接受礼物失败: ${error.message || error}`
    })
  } finally {
    isBatchAcceptGiftRunning.value = false
  }
}

// 导出功法详情
const handleExportLegacyDetails = async () => {
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
    isExportLegacyDetailsRunning.value = true
    message.info('正在导出功法详情...')

    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.info('正在连接游戏...')
      tokenStore.selectToken(token.id, true)

      let count = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        count++
      }

      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.error('WebSocket连接失败，请稍后重试')
        return
      }
      message.success('游戏连接成功')
    }

    // 获取赠送数据（typ=1）
    const sendData = await tokenStore.sendLegacyGetGifts(token.id, { typ: 1 })
    console.log('赠送数据:', sendData)

    // 获取接受数据（typ=2）
    const receiveData = await tokenStore.sendLegacyGetGifts(token.id, { typ: 2 })
    console.log('接受数据:', receiveData)

    // 统计函数：根据legacyId判断卡片类型
    const getCardType = (legacyId) => {
      if (legacyId === 501) return '金卡'
      if ([401, 402, 403].includes(legacyId)) return '红卡'
      if ([301, 302].includes(legacyId)) return '橙卡'
      if ([201, 202].includes(legacyId)) return '蓝卡'
      if ([101, 102].includes(legacyId)) return '紫卡'
      if ([1, 2].includes(legacyId)) return '绿卡'
      return '未知'
    }

    // 统计结果，按roleId分组，分开统计赠送和接收
    const sendStats = {}   // 赠送数据统计
    const receiveStats = {} // 接收数据统计

    // 处理赠送数据（typ=1）
    // 赠送数据中的targetInfo是接收方的信息，legacyList是赠送的卡片，itemCnt是赠送的功法残卷数量
    // 注意：同一roleId的多次赠送会累加计算（功法残卷累加，卡片数量累加）
    if (sendData && sendData.gifts && Array.isArray(sendData.gifts)) {
      sendData.gifts.forEach(gift => {
        const targetInfo = gift.targetInfo
        const roleId = targetInfo?.roleId || '未知'
        const name = targetInfo?.name || '未知'
        const itemCnt = gift.itemCnt || 0 // 功法残卷数量
        
        // 如果该roleId第一次出现，初始化统计对象
        if (!sendStats[roleId]) {
          sendStats[roleId] = {
            name,
            roleId,
            金卡: 0,
            红卡: 0,
            橙卡: 0,
            蓝卡: 0,
            紫卡: 0,
            绿卡: 0,
            功法残卷: 0
          }
        }

        // 累加功法残卷数量（同一roleId多次赠送会累加）
        sendStats[roleId].功法残卷 += itemCnt

        // 统计卡片数量（同一roleId多次赠送会累加）
        if (gift.legacyList && Array.isArray(gift.legacyList)) {
          gift.legacyList.forEach(legacy => {
            let legacyId = null
            if (legacy.legacyId) {
              legacyId = legacy.legacyId
            } else {
              const numericKeys = Object.keys(legacy).filter(k => {
                const num = parseInt(k)
                return !isNaN(num) && num > 0 && num < 1000
              })
              if (numericKeys.length > 0) {
                legacyId = parseInt(numericKeys[0])
              }
            }
            
            if (legacyId) {
              const cardType = getCardType(legacyId)
              if (cardType !== '未知' && sendStats[roleId][cardType] !== undefined) {
                // 累加卡片数量（同一roleId多次赠送会累加）
                sendStats[roleId][cardType]++
              }
            }
          })
        }
      })
    }

    // 处理接受数据（typ=2）
    // 注意：接收数据中的targetInfo是发送方的信息，itemCnt是接收到的功法残卷数量
    // 注意：同一roleId的多次接收会累加计算（功法残卷累加，卡片数量累加）
    if (receiveData && receiveData.gifts && Array.isArray(receiveData.gifts)) {
      receiveData.gifts.forEach(gift => {
        const targetInfo = gift.targetInfo
        const roleId = targetInfo?.roleId || '未知'
        const name = targetInfo?.name || '未知'
        const itemCnt = gift.itemCnt || 0 // 功法残卷数量
        
        // 如果该roleId第一次出现，初始化统计对象
        if (!receiveStats[roleId]) {
          receiveStats[roleId] = {
            name,
            roleId,
            金卡: 0,
            红卡: 0,
            橙卡: 0,
            蓝卡: 0,
            紫卡: 0,
            绿卡: 0,
            功法残卷: 0
          }
        }

        // 累加功法残卷数量（同一roleId多次接收会累加）
        receiveStats[roleId].功法残卷 += itemCnt

        // 如果legacyList存在，也统计卡片（虽然接收数据中legacyList通常为null）
        // 同一roleId多次接收会累加卡片数量
        if (gift.legacyList && Array.isArray(gift.legacyList)) {
          gift.legacyList.forEach(legacy => {
            let legacyId = null
            if (legacy.legacyId) {
              legacyId = legacy.legacyId
            } else {
              const numericKeys = Object.keys(legacy).filter(k => {
                const num = parseInt(k)
                return !isNaN(num) && num > 0 && num < 1000
              })
              if (numericKeys.length > 0) {
                legacyId = parseInt(numericKeys[0])
              }
            }
            
            if (legacyId) {
              const cardType = getCardType(legacyId)
              if (cardType !== '未知' && receiveStats[roleId][cardType] !== undefined) {
                // 累加卡片数量（同一roleId多次接收会累加）
                receiveStats[roleId][cardType]++
              }
            }
          })
        }
      })
    }

    // 生成导出内容
    const lines = []
    
    // 赠送数据部分
    lines.push('========== 赠送数据 ==========')
    lines.push('昵称\troleId\t金卡数量\t红卡数量\t橙卡数量\t蓝卡数量\t紫卡数量\t绿卡数量\t功法残卷数量')
    Object.values(sendStats).forEach(stat => {
      lines.push(
        `${stat.name}\t${stat.roleId}\t${stat.金卡}\t${stat.红卡}\t${stat.橙卡}\t${stat.蓝卡}\t${stat.紫卡}\t${stat.绿卡}\t${stat.功法残卷}`
      )
    })
    
    // 空行分隔
    lines.push('')
    
    // 接收数据部分
    lines.push('========== 接收数据 ==========')
    lines.push('昵称\troleId\t金卡数量\t红卡数量\t橙卡数量\t蓝卡数量\t紫卡数量\t绿卡数量\t功法残卷数量')
    Object.values(receiveStats).forEach(stat => {
      lines.push(
        `${stat.name}\t${stat.roleId}\t${stat.金卡}\t${stat.红卡}\t${stat.橙卡}\t${stat.蓝卡}\t${stat.紫卡}\t${stat.绿卡}\t${stat.功法残卷}`
      )
    })

    // 导出文件
    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `功法详情_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('功法详情已导出成功')
  } catch (error) {
    console.error('导出功法详情失败:', error)
    message.error(`导出功法详情失败: ${error.message || error}`)
  } finally {
    isExportLegacyDetailsRunning.value = false
  }
}

// 处理导出俱乐部信息执行范围输入
const handleExportClubInfoTokensInput = (value) => {
  exportClubInfoTokens.value = value
}

// 导出俱乐部信息
const handleExportClubInfo = async () => {
  try {
    isExportClubInfoRunning.value = true
    message.info('开始导出俱乐部信息...')

    // 获取执行范围的token索引
    const tokenIndices = parseTokenRange(legionTokens.value)
    // 使用getTargetTokens获取token列表，如果tokenIndices为null，则返回全部token
    const targetTokens = getTargetTokens(tokenIndices)
    
    if (targetTokens.length === 0) {
      message.warning('执行范围内没有有效的Token')
      return
    }

    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到 ${targetTokens.length} 个Token（${rangeText}），开始处理...`)

    const clubInfoList = []

    // 逐个连接token并获取俱乐部信息
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = i + 1

      try {
        message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在连接...`)

        // 连接token
        let retryCount = 0
        const maxRetries = 5
        let status = tokenStore.getWebSocketStatus(token.id)

        while (status !== 'connected' && retryCount < maxRetries) {
          tokenStore.selectToken(token.id, true)
          await new Promise(resolve => setTimeout(resolve, 1000))
          status = tokenStore.getWebSocketStatus(token.id)
          retryCount++

          if (status !== 'connected' && retryCount < maxRetries) {
            message.info(`[${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
          }
        }

        if (status !== 'connected') {
          message.warning(`[${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          clubInfoList.push({
            nickname: token.name || token.id,
            clubName: '连接失败',
            roleId: '连接失败'
          })
          continue
        }

        message.success(`[${tokenIndex}] ${token.name || token.id} 连接成功`)

        // 模拟点击获取俱乐部信息（调用legion_getinfo）
        try {
          const result = await tokenStore.sendLegionGetInfo(token.id, {})
          
          const nickname = token.name || token.id
          const clubName = result?.info?.name || '未加入俱乐部'
          
          // 获取roleId
          let roleId = '获取失败'
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
            roleId = roleInfo?.role?.roleId || '未获取到'
          } catch (roleError) {
            console.error(`[${tokenIndex}] ${token.name || token.id} 获取roleId失败:`, roleError)
            roleId = '获取失败'
          }

          clubInfoList.push({
            nickname,
            clubName,
            roleId
          })

          message.success(`[${tokenIndex}] ${nickname} 获取俱乐部信息成功: ${clubName}, roleId: ${roleId}`)
        } catch (error) {
          console.error(`[${tokenIndex}] ${token.name || token.id} 获取俱乐部信息失败:`, error)
          
          // 即使获取俱乐部信息失败，也尝试获取roleId
          let roleId = '获取失败'
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
            roleId = roleInfo?.role?.roleId || '未获取到'
          } catch (roleError) {
            console.error(`[${tokenIndex}] ${token.name || token.id} 获取roleId失败:`, roleError)
          }
          
          clubInfoList.push({
            nickname: token.name || token.id,
            clubName: '获取失败',
            roleId
          })
        }

        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`[${tokenIndex}] ${token.name || token.id} 处理失败:`, error)
        clubInfoList.push({
          nickname: token.name || token.id,
          clubName: '处理失败',
          roleId: '处理失败'
        })
      }
    }

    // 生成导出内容
    const lines = []
    // 标题行
    lines.push('昵称\t俱乐部名称\troleId')
    
    // 数据行
    clubInfoList.forEach(info => {
      lines.push(`${info.nickname}\t${info.clubName}\t${info.roleId || '未获取到'}`)
    })

    // 导出文件
    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `俱乐部信息_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success(`俱乐部信息已导出成功，共 ${clubInfoList.length} 条记录`)
    
    // 记录日志
    logOperation('shidian', '导出俱乐部信息', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'success',
      message: `导出俱乐部信息成功，共 ${clubInfoList.length} 条记录（${rangeText}）`
    })
  } catch (error) {
    console.error('导出俱乐部信息失败:', error)
    message.error(`导出俱乐部信息失败: ${error.message || error}`)
    
    // 记录错误日志
    logOperation('shidian', '导出俱乐部信息', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'error',
      message: `导出俱乐部信息失败: ${error.message || error}`
    })
  } finally {
    isExportClubInfoRunning.value = false
  }
}

// 图鉴升星和领取奖励（单个）
const handleBookUpgrade = async () => {
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
    isBookUpgradeRunning.value = true
    message.info('正在执行图鉴升星和领取奖励...')
    
    // 英雄ID列表（101-120, 201-228, 301-314）
    const heroIds = [
      ...Array.from({ length: 20 }, (_, i) => 101 + i),
      ...Array.from({ length: 28 }, (_, i) => 201 + i),
      ...Array.from({ length: 14 }, (_, i) => 301 + i)
    ]
    
    // 1. 图鉴升星：对每个英雄执行10次
    for (const heroId of heroIds) {
      for (let i = 1; i <= 10; i++) {
        try {
          const res = await tokenStore.sendMessageWithPromise(
            token.id,
            'book_upgrade',
            { heroId },
            8000
          )
          const ok = res && (res.code === 0 || res.success === true || res.result === 0)
          if (!ok) break
        } catch (err) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // 2. 领取图鉴奖励：执行10次
    for (let i = 1; i <= 10; i++) {
      try {
        const res = await tokenStore.sendMessageWithPromise(
          token.id,
          'book_claimpointreward',
          {},
          8000
        )
        const ok = res && (res.code === 0 || res.success === true || res.result === 0)
        if (!ok) break
      } catch (err) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    message.success('图鉴升星和领取奖励完成')
    logOperation('shidian', '图鉴', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '图鉴升星和领取奖励完成'
    })
  } catch (error) {
    console.error('图鉴升星失败:', error)
    message.error(`图鉴升星失败: ${error.message || '未知错误'}`)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    logOperation('shidian', '图鉴', {
      cardType: '俱乐部管理',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `图鉴升星失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBookUpgradeRunning.value = false
  }
}

// 批量图鉴升星和领取奖励
const handleBatchBookUpgrade = async () => {
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  try {
    isBatchBookUpgradeRunning.value = true
    message.info(`开始批量图鉴，共 ${tokens.length} 个Token`)
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          const heroIds = [
            ...Array.from({ length: 20 }, (_, i) => 101 + i),
            ...Array.from({ length: 28 }, (_, i) => 201 + i),
            ...Array.from({ length: 14 }, (_, i) => 301 + i)
          ]
          
          for (const heroId of heroIds) {
            for (let j = 1; j <= 10; j++) {
              try {
                const res = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'book_upgrade',
                  { heroId },
                  8000
                )
                const ok = res && (res.code === 0 || res.success === true || res.result === 0)
                if (!ok) break
              } catch (err) {
                break
              }
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
          
          for (let j = 1; j <= 10; j++) {
            try {
              const res = await tokenStore.sendMessageWithPromise(
                token.id,
                'book_claimpointreward',
                {},
                8000
              )
              const ok = res && (res.code === 0 || res.success === true || res.result === 0)
              if (!ok) break
            } catch (err) {
              break
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 图鉴完成`)
          logOperation('shidian', '批量图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: '图鉴升星和领取奖励完成'
          })
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 图鉴失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 图鉴失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `图鉴失败: ${error.message || '未知错误'}`
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
    
    message.success('批量图鉴完成')
  } catch (error) {
    console.error('批量图鉴失败:', error)
    message.error(`批量图鉴失败: ${error.message || '未知错误'}`)
  } finally {
    isBatchBookUpgradeRunning.value = false
  }
}

// 刷新图鉴信息
const handleRefreshLegacyInfo = async () => {
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
    isRefreshLegacyInfoRunning.value = true
    message.info('正在刷新图鉴信息...')
    
    const legacyInfo = await tokenStore.sendLegacyGetInfo(token.id, {})
    
    if (!legacyInfo) {
      message.warning('获取功法信息失败')
      return
    }
    
    const roleLegacy = legacyInfo.roleLegacy || {}
    const books = roleLegacy.books || {}
    const legacyStorage = roleLegacy.legacyStorage || {}
    
    const booksCount = {}
    const storageCount = {}
    
    const allLegacyIds = [1, 2, 101, 102, 201, 202, 301, 302, 401, 402, 403, 501]
    
    for (const legacyId of allLegacyIds) {
      const legacyIdStr = String(legacyId)
      booksCount[legacyIdStr] = 0
      storageCount[legacyIdStr] = 0
    }
    
    for (const key of Object.keys(books)) {
      const legacyId = books[key].legacyId
      const legacyIdStr = String(legacyId)
      if (booksCount[legacyIdStr] !== undefined) {
        booksCount[legacyIdStr]++
      }
    }
    
    for (const key of Object.keys(legacyStorage)) {
      const legacyId = legacyStorage[key].legacyId
      const legacyIdStr = String(legacyId)
      if (storageCount[legacyIdStr] !== undefined) {
        storageCount[legacyIdStr]++
      }
    }
    
    legacyBookInfo.value = {
      books: booksCount,
      storage: storageCount
    }
    
    message.success('图鉴信息刷新成功')
    logOperation('shidian', '刷新图鉴信息', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '图鉴信息刷新成功'
    })
  } catch (error) {
    console.error('刷新图鉴信息失败:', error)
    message.error(`刷新图鉴信息失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '刷新图鉴信息', {
      cardType: '俱乐部管理',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `刷新图鉴信息失败: ${error.message || '未知错误'}`
    })
  } finally {
    isRefreshLegacyInfoRunning.value = false
  }
}

// 功法图鉴激活
const handleLegacyBook = async () => {
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
    isLegacyBookRunning.value = true
    message.info('正在执行功法图鉴激活...')
    
    // 获取功法信息
    const legacyInfo = await tokenStore.sendLegacyGetInfo(token.id, {})
    
    if (!legacyInfo) {
      message.warning('获取功法信息失败')
      return
    }
    
    const roleLegacy = legacyInfo.roleLegacy || {}
    const legacyStorage = roleLegacy.legacyStorage || {}
    const books = roleLegacy.books || {}
    
    console.log('获取到的功法信息:', {
      books,
      legacyStorage
    })
    
    // 所有可能的legacyId列表
    const allLegacyIds = [1, 2, 101, 102, 201, 202, 301, 302, 401, 402, 403, 501]
    
    let activatedCount = 0
    
    // 遍历所有legacyId
    for (const legacyId of allLegacyIds) {
      // 检查books中是否已有该legacyId
      const bookKeys = Object.keys(books)
      let hasInBooks = false
      for (const key of bookKeys) {
        if (books[key].legacyId === legacyId) {
          hasInBooks = true
          break
        }
      }
      
      console.log(`检查legacyId ${legacyId}: hasInBooks = ${hasInBooks}`)
      
      // 如果books中已有，跳过
      if (hasInBooks) {
        continue
      }
      
      // 检查legacyStorage中是否有该legacyId
      const storageKeys = Object.keys(legacyStorage)
      let foundUId = null
      for (const key of storageKeys) {
        if (legacyStorage[key].legacyId === legacyId) {
          foundUId = legacyStorage[key].uId
          break
        }
      }
      
      console.log(`检查legacyId ${legacyId}: foundUId = ${foundUId}`)
      
      // 如果legacyStorage中有，执行激活
      if (foundUId) {
        try {
          console.log(`执行激活: legacyId = ${legacyId}, uId = ${foundUId}`)
          const res = await tokenStore.sendLegacyActivate(token.id, {
            uId: foundUId
          })
          
          console.log(`激活响应: legacyId = ${legacyId}, res =`, res)
          
          if (res && (res.code === 0 || res.success === true || res.role || res.roleLegacy)) {
            activatedCount++
            message.success(`激活图鉴 ${legacyId} 成功`)
          } else {
            message.warning(`激活图鉴 ${legacyId} 失败: ${res?.message || '未知错误'}`)
          }
        } catch (err) {
          console.error(`激活图鉴 ${legacyId} 失败:`, err)
          message.error(`激活图鉴 ${legacyId} 失败: ${err.message || '未知错误'}`)
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 400))
      }
    }
    
    message.success(`功法图鉴激活完成，共激活 ${activatedCount} 个图鉴`)
    logOperation('shidian', '激活功法图鉴', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `功法图鉴激活完成，共激活 ${activatedCount} 个图鉴`
    })
  } catch (error) {
    console.error('功法图鉴激活失败:', error)
    message.error(`功法图鉴激活失败: ${error.message || '未知错误'}`)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    logOperation('shidian', '激活功法图鉴', {
      cardType: '俱乐部管理',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `功法图鉴激活失败: ${error.message || '未知错误'}`
    })
  } finally {
    isLegacyBookRunning.value = false
  }
}

// 批量功法图鉴激活
const handleBatchLegacyBook = async () => {
  try {
    isBatchLegacyBookRunning.value = true
    message.info('开始批量功法图鉴...')
    logOperation('shidian', '批量功法图鉴', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量功法图鉴...'
    })

    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    
    // 获取目标Token列表（根据执行范围过滤）
    const tokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (tokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量功法图鉴', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`开始批量功法图鉴，共 ${tokens.length} 个Token（${rangeText}）`)
    logOperation('shidian', '批量功法图鉴', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `开始批量功法图鉴，共 ${tokens.length} 个Token（${rangeText}）`
    })
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          message.info(`[${globalIndex + 1}/${tokens.length}] ${token.name || token.id} 正在刷新图鉴信息...`)
          
          const legacyInfo = await tokenStore.sendLegacyGetInfo(token.id, {})
          
          if (!legacyInfo) {
            message.warning(`[${globalIndex + 1}] ${token.name || token.id} 获取功法信息失败，跳过`)
            logOperation('shidian', '批量功法图鉴', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `获取功法信息失败，跳过`
            })
            return { success: false, error: '获取功法信息失败' }
          }
          
          const roleLegacy = legacyInfo.roleLegacy || {}
          const books = roleLegacy.books || {}
          const legacyStorage = roleLegacy.legacyStorage || {}
          
          const booksCount = {}
          const storageCount = {}
          
          const allLegacyIds = [1, 2, 101, 102, 201, 202, 301, 302, 401, 402, 403, 501]
          
          for (const legacyId of allLegacyIds) {
            const legacyIdStr = String(legacyId)
            booksCount[legacyIdStr] = 0
            storageCount[legacyIdStr] = 0
          }
          
          for (const key of Object.keys(books)) {
            const legacyId = books[key].legacyId
            const legacyIdStr = String(legacyId)
            if (booksCount[legacyIdStr] !== undefined) {
              booksCount[legacyIdStr]++
            }
          }
          
          for (const key of Object.keys(legacyStorage)) {
            const legacyId = legacyStorage[key].legacyId
            const legacyIdStr = String(legacyId)
            if (storageCount[legacyIdStr] !== undefined) {
              storageCount[legacyIdStr]++
            }
          }
          
          legacyBookInfo.value = {
            books: booksCount,
            storage: storageCount
          }
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 图鉴信息刷新成功`)
          
          message.info(`[${globalIndex + 1}] ${token.name || token.id} 正在激活功法图鉴...`)
          
          let activatedCount = 0
          
          for (const legacyId of allLegacyIds) {
            const legacyIdStr = String(legacyId)
            
            const bookKeys = Object.keys(books)
            let hasInBooks = false
            for (const key of bookKeys) {
              if (books[key].legacyId === legacyId) {
                hasInBooks = true
                break
              }
            }
            
            if (hasInBooks) {
              continue
            }
            
            const storageKeys = Object.keys(legacyStorage)
            let foundUId = null
            for (const key of storageKeys) {
              if (legacyStorage[key].legacyId === legacyId) {
                foundUId = legacyStorage[key].uId
                break
              }
            }
            
            if (foundUId) {
              try {
                const res = await tokenStore.sendLegacyActivate(token.id, {
                  legacyId: legacyId,
                  uId: foundUId
                })
                
                if (res && (res.code === 0 || res.success === true)) {
                  activatedCount++
                }
              } catch (err) {
                console.error(`[${globalIndex + 1}] 激活图鉴 ${legacyId} 失败:`, err)
              }
              
              await new Promise(resolve => setTimeout(resolve, 400))
            }
          }
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 功法图鉴完成，激活 ${activatedCount} 个`)
          logOperation('shidian', '批量功法图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `功法图鉴激活完成，共激活 ${activatedCount} 个图鉴`
          })
          return { success: true, activatedCount }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 功法图鉴失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 功法图鉴失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量功法图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `功法图鉴失败: ${error.message || '未知错误'}`
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
    
    message.success('批量功法图鉴完成')
  } catch (error) {
    console.error('批量功法图鉴失败:', error)
    message.error(`批量功法图鉴失败: ${error.message || '未知错误'}`)
  } finally {
    isBatchLegacyBookRunning.value = false
  }
}
</script>

<style scoped>
.club-management-content {
  width: 100%;
}

.legacy-book-table-container {
  margin-bottom: 16px;
  width: 100%;
  overflow-x: auto;
}

.legacy-book-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.legacy-book-table th,
.legacy-book-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: center;
  min-width: 60px;
}

.legacy-book-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.legacy-book-table td {
  background-color: white;
}
</style>
