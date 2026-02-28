<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Settings />
      </n-icon>
    </template>
    <template #title>
      <h3>资源管理</h3>
    </template>
    <template #badge>
      <span>已就绪</span>
    </template>
    <template #default>
      <div class="resource-management-list">
        <!-- 资源管理按钮区域 -->
        <CustomizedCard mode="container">
          <CustomizedCard mode="button" name="使用" @click="useAllResources" :loading="isUsingResources" />
          <CustomizedCard mode="button" name="批量使用" @click="batchUseResources" :loading="isBatchUsingResources" />
          <CustomizedCard mode="button" name="刷新" @click="refreshItemCounts" :loading="isRefreshingItems" />
          
          <!-- 执行范围输入框 -->
          <CustomizedCard 
            mode="execution-range" 
            name="执行范围" 
            v-model:inputValue="resourceTokens" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            @update:inputValue="handleResourceTokensInput" 
          />
        
          <!-- 资源项列表 -->
          <CustomizedCard 
            v-for="item in itemTypes" 
            :key="item.id" 
            mode="name-count" 
            :name="item.name" 
            :count="String(getItemCount(item.id))"
            @click="handleUseBag(item.id)"
            style="cursor: pointer;"
          />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        :filter-operations="[]"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { defineProps, ref } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { Settings } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 操作状态
const isUsingResources = ref(false)
const isBatchUsingResources = ref(false)
const isRefreshingItems = ref(false)

// 执行范围
const resourceTokens = ref('')

// 处理执行范围输入
const handleResourceTokensInput = (value) => {
  resourceTokens.value = value
}

// 解析执行范围（如果为空则执行全部）
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

// 资源类型定义（袋子类型）
const itemTypes = ref([
  { id: 3001, name: '金币袋子' },
  { id: 3002, name: '金砖袋子' },
  { id: 3005, name: '紫色随机碎片' },
  { id: 3006, name: '橙色随机碎片' },
  { id: 3007, name: '红色随机碎片' },
  { id: 3008, name: '精铁袋子' },
  { id: 3009, name: '进阶袋子' },
  { id: 3010, name: '梦魇袋子' },
  { id: 3011, name: '白玉袋子' },
  { id: 3012, name: '扳手袋子' },
  { id: 35011, name: '赛车礼盒' }
])

// 获取指定token的物品数量（用于批量操作）
const getItemCountForToken = (tokenId, itemId) => {
  // 优先从全局 gameData.roleInfo 获取（如果当前选中的是这个token）
  if (tokenStore.selectedTokenId === tokenId) {
    const roleInfo = tokenStore.gameData?.roleInfo
    if (roleInfo && roleInfo.role && roleInfo.role.items) {
      const items = roleInfo.role.items
      if (items && typeof items === 'object') {
        const item = items[String(itemId)] || items[itemId]
        if (item) {
          if (typeof item === 'object' && item !== null) {
            return Number(item.quantity || item.count || item.num || 0)
          }
          if (typeof item === 'number') {
            return item
          }
        }
      }
    }
  }
  
  // 从 token.gameData.roleInfo 获取
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (token && token.gameData && token.gameData.roleInfo) {
    const tokenRoleInfo = token.gameData.roleInfo
    if (tokenRoleInfo.role && tokenRoleInfo.role.items) {
      const items = tokenRoleInfo.role.items
      if (items && typeof items === 'object') {
        const item = items[String(itemId)] || items[itemId]
        if (item) {
          if (typeof item === 'object' && item !== null) {
            return Number(item.quantity || item.count || item.num || 0)
          }
          if (typeof item === 'number') {
            return item
          }
        }
      }
    }
  }
  
  return 0
}

// 获取物品数量（用于当前选中的token）
// 根据 api采集/role_getinfo.txt 中的格式：
// items: {
//   "3001": { itemId: 3001, quantity: 127, ext: null },
//   "3002": { itemId: 3002, quantity: 2, ext: null }
// }
const getItemCount = (itemId) => {
  if (!props.selectedTokenId) {
    return 0
  }
  return getItemCountForToken(props.selectedTokenId, itemId)
}

// 处理点击使用袋子
const handleUseBag = async (itemId) => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const count = getItemCount(itemId)
  if (count === 0) {
    message.warning('该袋子数量为0')
    return
  }
  
  const itemName = getItemName(itemId)
  try {
    isUsingResources.value = true
    message.info(`正在使用 ${itemName}...`)
    await useBag(itemId, count)
    // 刷新物品信息
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (token && token.id) {
      await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    }
    message.success(`${itemName} 使用完成`)
  } catch (error) {
    console.error(`使用 ${itemName} 失败:`, error)
    message.error(`使用 ${itemName} 失败`)
  } finally {
    isUsingResources.value = false
  }
}

// 使用袋子（支持分多次使用，每次最多999）
const useBag = async (itemId, count) => {
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.id) return
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.warning('WebSocket未连接，请先连接Token')
    return
  }
  
  // 如果数量超过999，分多次使用
  if (count > 999) {
    const batches = Math.floor(count / 999)
    const remainder = count % 999
    
    // 先使用完整的999批次
    for (let i = 0; i < batches; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'item_openpack',
          { itemId: itemId || 0, number: 999, index: 0 },
          5000
        )
        message.info(`使用 ${getItemName(itemId)}: ${(i + 1) * 999}/${count}`)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (批次 ${i + 1}):`, error)
        message.error(`使用 ${getItemName(itemId)} 失败 (批次 ${i + 1})`)
      }
    }
    
    // 使用剩余数量
    if (remainder > 0) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'item_openpack',
          { itemId: itemId || 0, number: remainder, index: 0 },
          5000
        )
        message.info(`使用 ${getItemName(itemId)}: ${count}/${count}`)
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (剩余):`, error)
        message.error(`使用 ${getItemName(itemId)} 失败 (剩余)`)
      }
    }
  } else {
    // 数量不超过999，直接使用
    try {
      await tokenStore.sendMessageWithPromise(
        token.id,
        'item_openpack',
        { itemId: itemId || 0, number: count || 0, index: 0 },
        5000
      )
      message.success(`使用 ${getItemName(itemId)}: ${count} 个`)
    } catch (error) {
      console.error(`使用 ${getItemName(itemId)} 失败:`, error)
      message.error(`使用 ${getItemName(itemId)} 失败`)
    }
  }
}

// 获取物品名称
const getItemName = (itemId) => {
  const item = itemTypes.value.find(item => item.id === itemId)
  return item ? item.name : `物品${itemId}`
}

// 使用所有资源（使用所有袋子）
const useAllResources = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  try {
    isUsingResources.value = true
    message.info('正在使用所有袋子...')
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (token && token.id) {
      const status = tokenStore.getWebSocketStatus(token.id)
      if (status !== 'connected') {
        message.warning('WebSocket未连接，请先连接Token')
        return
      }
      
      // 遍历所有袋子类型，使用每个袋子
      for (const itemType of itemTypes.value) {
        const count = getItemCount(itemType.id)
        if (count > 0) {
          await useBag(itemType.id, count)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // 刷新物品信息
      await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    }
    message.success('所有袋子使用完成')
  } catch (error) {
    console.error('使用资源失败:', error)
    message.error('使用资源失败')
  } finally {
    isUsingResources.value = false
  }
}

// 批量使用资源（按照执行范围执行）
const batchUseResources = async () => {
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
  const tokenIndices = parseTokenRange(resourceTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    // 留空执行全部
    targetTokens = sortedTokensList
  } else {
    // 根据执行范围获取目标token
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  try {
    isBatchUsingResources.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量使用资源（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
    
    let successCount = 0
    let failCount = 0
    
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
          failCount++
          continue
        }
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 连接成功`)
        
        // 先刷新物品信息，确保获取最新的物品数量
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在刷新物品信息...`)
        await tokenStore.sendGetRoleInfo(token.id)
        // 等待数据更新，确保数据已经同步到token对象和全局状态
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 重新获取token数据（刷新后）
        const refreshedToken = tokenStore.gameTokens.find(t => t.id === token.id)
        if (!refreshedToken) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} Token不存在，跳过`)
          failCount++
          continue
        }
        
        // 遍历所有袋子类型，使用每个袋子
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在使用所有袋子...`)
        for (const itemType of itemTypes.value) {
          // 每次使用前重新获取token数据，确保获取最新的物品数量
          const currentToken = tokenStore.gameTokens.find(t => t.id === token.id)
          if (!currentToken) {
            continue
          }
          
          // 获取当前token的物品数量
          // 优先从token对象获取最新数据
          let count = 0
          const tokenRoleInfo = currentToken.gameData?.roleInfo
          if (tokenRoleInfo && tokenRoleInfo.role && tokenRoleInfo.role.items) {
            const items = tokenRoleInfo.role.items
            if (items && typeof items === 'object') {
              const item = items[String(itemType.id)] || items[itemType.id]
              if (item) {
                if (typeof item === 'object' && item !== null) {
                  count = Number(item.quantity || item.count || item.num || 0)
                } else if (typeof item === 'number') {
                  count = item
                }
              }
            }
          }
          
          // 如果从token对象获取不到，尝试从全局获取
          if (count === 0) {
            count = getItemCountForToken(token.id, itemType.id)
          }
          
          if (count > 0) {
            try {
              message.info(`[序号${tokenIndex}] 使用 ${getItemName(itemType.id)}: ${count} 个`)
              await useBagForToken(token.id, itemType.id, count)
              // 使用后等待，确保数据已更新到token对象
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              console.error(`[序号${tokenIndex}] 使用 ${getItemName(itemType.id)} 失败:`, error)
              message.warning(`[序号${tokenIndex}] 使用 ${getItemName(itemType.id)} 失败: ${error.message || '未知错误'}`)
              // 继续处理下一个袋子
            }
          }
        }
        
        // 最后刷新物品信息
        await tokenStore.sendGetRoleInfo(token.id)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 资源使用完成`)
        successCount++
        
        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量使用资源失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 使用失败 - ${error.message || '未知错误'}`)
        failCount++
      }
    }
    
    message.success(`批量使用资源完成（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('批量使用资源失败:', error)
    message.error('批量使用资源失败: ' + (error.message || '未知错误'))
  } finally {
    isBatchUsingResources.value = false
  }
}

// 为指定token使用袋子（支持分多次使用，每次最多999）
const useBagForToken = async (tokenId, itemId, count) => {
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接')
  }
  
  // 如果数量超过999，分多次使用
  if (count > 999) {
    const batches = Math.floor(count / 999)
    const remainder = count % 999
    
    // 先使用完整的999批次
    for (let i = 0; i < batches; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'item_openpack',
          { itemId: itemId || 0, number: 999, index: 0 },
          5000
        )
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (批次 ${i + 1}):`, error)
        throw error
      }
    }
    
    // 使用剩余数量
    if (remainder > 0) {
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'item_openpack',
          { itemId: itemId || 0, number: remainder, index: 0 },
          5000
        )
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (剩余):`, error)
        throw error
      }
    }
  } else {
    // 数量不超过999，直接使用
    try {
      await tokenStore.sendMessageWithPromise(
        tokenId,
        'item_openpack',
        { itemId: itemId || 0, number: count || 0, index: 0 },
        5000
      )
    } catch (error) {
      console.error(`使用 ${getItemName(itemId)} 失败:`, error)
      throw error
    }
  }
}

// 刷新物品数量
const refreshItemCounts = async () => {
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
    isRefreshingItems.value = true
    message.info('正在刷新物品数量...')
    
    // 调用 role_getroleinfo 获取最新的角色信息和物品数据
    await tokenStore.sendGetRoleInfo(token.id)
    
    // 等待一下确保数据已更新
    await new Promise(resolve => setTimeout(resolve, 500))
    
    message.success('刷新物品数量成功')
  } catch (error) {
    console.error('刷新物品数量失败:', error)
    message.error('刷新物品数量失败: ' + (error.message || '未知错误'))
  } finally {
    isRefreshingItems.value = false
  }
}

// 购买黑市商品（从FishHelper.vue复制）
const handleBuyBlackMarket = async (data) => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  try {
    message.info('正在购买黑市商品...')
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (token && token.id) {
      const status = tokenStore.getWebSocketStatus(token.id)
      if (status !== 'connected') {
        message.warning('WebSocket未连接，请先连接Token')
        return
      }
      // 这里调用实际的API方法
      // await tokenStore.sendGameMessage(token.id, 'blackmarket_buy', data)
    }
    message.success('黑市商品购买成功')
  } catch (error) {
    console.error('购买黑市商品失败:', error)
    message.error('购买黑市商品失败')
  }
}

// 批量购买黑市商品（从FishHelper.vue复制）
const handleBatchBuyBlackMarket = async (data) => {
  if (!data || !data.tokenIds || data.tokenIds.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  try {
    message.info(`正在批量购买黑市商品，共${data.tokenIds.length}个Token...`)
    
    for (let i = 0; i < data.tokenIds.length; i++) {
      const tokenId = data.tokenIds[i]
      const token = tokenStore.gameTokens.find(t => t.id === tokenId)
      if (!token) continue
      
      try {
        tokenStore.selectToken(token.id)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const status = tokenStore.getWebSocketStatus(token.id)
        if (status !== 'connected') {
          message.warning(`${token.name || token.id} 未连接，跳过`)
          continue
        }
        
        // 购买黑市商品
        // await tokenStore.sendGameMessage(token.id, 'blackmarket_buy', data.params)
        message.success(`${token.name || token.id} 黑市商品购买成功`)
        
        if (i < data.tokenIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Token ${token.name || token.id} 购买失败:`, error)
        message.error(`${token.name || token.id}: 购买失败`)
      }
    }
    
    message.success('批量购买黑市商品完成')
  } catch (error) {
    console.error('批量购买黑市商品失败:', error)
    message.error('批量购买黑市商品失败')
  }
}

// 完成任务（从FishHelper.vue复制）
const handleCompleteTask = async (data) => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  try {
    message.info('正在完成任务...')
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (token && token.id) {
      const status = tokenStore.getWebSocketStatus(token.id)
      if (status !== 'connected') {
        message.warning('WebSocket未连接，请先连接Token')
        return
      }
      // 这里调用实际的API方法
      // await tokenStore.sendGameMessage(token.id, 'task_complete', data)
    }
    message.success('任务完成成功')
  } catch (error) {
    console.error('完成任务失败:', error)
    message.error('完成任务失败')
  }
}

// 批量完成任务（从FishHelper.vue复制）
const handleBatchCompleteTask = async (data) => {
  if (!data || !data.tokenIds || data.tokenIds.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  try {
    message.info(`正在批量完成任务，共${data.tokenIds.length}个Token...`)
    
    for (let i = 0; i < data.tokenIds.length; i++) {
      const tokenId = data.tokenIds[i]
      const token = tokenStore.gameTokens.find(t => t.id === tokenId)
      if (!token) continue
      
      try {
        tokenStore.selectToken(token.id)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const status = tokenStore.getWebSocketStatus(token.id)
        if (status !== 'connected') {
          message.warning(`${token.name || token.id} 未连接，跳过`)
          continue
        }
        
        // 完成任务
        // await tokenStore.sendGameMessage(token.id, 'task_complete', data.params)
        message.success(`${token.name || token.id} 任务完成成功`)
        
        if (i < data.tokenIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Token ${token.name || token.id} 任务完成失败:`, error)
        message.error(`${token.name || token.id}: 任务完成失败`)
      }
    }
    
    message.success('批量任务完成成功')
  } catch (error) {
    console.error('批量完成任务失败:', error)
    message.error('批量完成任务失败')
  }
}
</script>

<style scoped>
.resource-management-list {
  width: 100%;
}
</style>