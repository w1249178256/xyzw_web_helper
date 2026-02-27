<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Settings />
      </n-icon>
    </template>
    <template #title>
      <h3>黑市购买设置</h3>
    </template>
    <template #default>
      <div class="purchase-settings">
        <!-- 输入框区域 - 使用CustomizedCard容器模式 -->
        <CustomizedCard mode="container">
          <!-- 次数设置 -->
          <CustomizedCard 
            mode="name-input"
            name="次数"
            v-model:inputValue="purchaseCount"
            placeholder="0-999"
          />
          
          <!-- 折扣设置 -->
          <CustomizedCard 
            mode="name-input"
            name="青铜"
            v-model:inputValue="bronzeBoxDiscount"
            placeholder="0-10"
          />
          
          <CustomizedCard 
            mode="name-input"
            name="黄金"
            v-model:inputValue="goldenBoxDiscount"
            placeholder="0-10"
          />
          
          <CustomizedCard 
            mode="name-input"
            name="铂金"
            v-model:inputValue="platinumBoxDiscount"
            placeholder="0-10"
          />
          
          <CustomizedCard 
            mode="name-input"
            name="金竿"
            v-model:inputValue="goldenRodDiscount"
            placeholder="0-10"
          />
        </CustomizedCard>
        
        <!-- 按钮区域 - 使用CustomizedCard容器模式 -->
        <CustomizedCard mode="container">
          <CustomizedCard 
            mode="button"
            name="确认设置"
            @button-click="handleSetBlackMarket"
            :disabled="!selectedTokenId || isSetting"
            :loading="isSetting"
          />
          <CustomizedCard 
            mode="button"
            name="批量设置"
            @button-click="handleBatchSetBlackMarket"
            :disabled="isBatchSetting"
            :loading="isBatchSetting"
          />
          
          <!-- 执行范围输入框 -->
          <CustomizedCard 
            mode="execution-range" 
            name="执行范围" 
            v-model:inputValue="blackMarketTokens" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            @update:inputValue="handleBlackMarketTokensInput" 
          />
          
          <!-- 导出按钮 -->
          <CustomizedCard 
            mode="button"
            name="导出黑市设置"
            @button-click="exportBlackMarketSettings"
            :disabled="isExportingBlackMarket"
            :loading="isExportingBlackMarket"
          />
          <CustomizedCard 
            mode="button"
            name="导出资源信息"
            @button-click="exportResourceInfo"
            :disabled="isExportingResourceInfo"
            :loading="isExportingResourceInfo"
          />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="黑市购买设置"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTokenStore, selectedTokenId } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { Settings } from '@vicons/ionicons5'
import { savePageTokenCards, loadPageTokenCards } from '@/utils/pageTokenStorage'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 黑市购买设置状态
const purchaseCount = ref('0')
const bronzeBoxDiscount = ref('0')
const goldenBoxDiscount = ref('0')
const platinumBoxDiscount = ref('0')
const goldenRodDiscount = ref('0')

// 操作状态
const isSetting = ref(false)
const isBatchSetting = ref(false)
const isExportingBlackMarket = ref(false)
const isExportingResourceInfo = ref(false)

// 执行范围
const blackMarketTokens = ref('')

// 处理执行范围输入
const handleBlackMarketTokensInput = (value) => {
  blackMarketTokens.value = value
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

// 保存设置到服务器
const saveSettings = async () => {
  await savePageTokenCards('fish-helper', {
    blackMarketSettings: {
      purchaseCount: Number(purchaseCount.value) || 0,
      bronzeBoxDiscount: Number(bronzeBoxDiscount.value) || 0,
      goldenBoxDiscount: Number(goldenBoxDiscount.value) || 0,
      platinumBoxDiscount: Number(platinumBoxDiscount.value) || 0,
      goldenRodDiscount: Number(goldenRodDiscount.value) || 0
    }
  })
}

// 从服务器加载设置
const loadSettings = async () => {
  const data = await loadPageTokenCards('fish-helper')
  if (data.blackMarketSettings) {
    purchaseCount.value = String(data.blackMarketSettings.purchaseCount ?? 0)
    bronzeBoxDiscount.value = String(data.blackMarketSettings.bronzeBoxDiscount ?? 0)
    goldenBoxDiscount.value = String(data.blackMarketSettings.goldenBoxDiscount ?? 0)
    platinumBoxDiscount.value = String(data.blackMarketSettings.platinumBoxDiscount ?? 0)
    goldenRodDiscount.value = String(data.blackMarketSettings.goldenRodDiscount ?? 0)
  }
}

// 页面加载时恢复设置
onMounted(() => {
  loadSettings()
})



// 设置黑市购买
const handleSetBlackMarket = async () => {
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
  
  // 验证输入
  const purchaseCountNum = Number(purchaseCount.value)
  const bronzeBoxDiscountNum = Number(bronzeBoxDiscount.value)
  const goldenBoxDiscountNum = Number(goldenBoxDiscount.value)
  const platinumBoxDiscountNum = Number(platinumBoxDiscount.value)
  const goldenRodDiscountNum = Number(goldenRodDiscount.value)
  
  if (isNaN(purchaseCountNum) || purchaseCountNum < 0 || purchaseCountNum > 999) {
    message.error('购买次数必须在0-999之间')
    return
  }
  
  if (isNaN(bronzeBoxDiscountNum) || bronzeBoxDiscountNum < 0 || bronzeBoxDiscountNum > 10 ||
      isNaN(goldenBoxDiscountNum) || goldenBoxDiscountNum < 0 || goldenBoxDiscountNum > 10 ||
      isNaN(platinumBoxDiscountNum) || platinumBoxDiscountNum < 0 || platinumBoxDiscountNum > 10 ||
      isNaN(goldenRodDiscountNum) || goldenRodDiscountNum < 0 || goldenRodDiscountNum > 10) {
    message.error('折扣值必须在0-10之间')
    return
  }
  
  try {
    isSetting.value = true
    

    
    // 构建购买清单
    const purchaseItemList = [
      { discount: bronzeBoxDiscountNum, itemId: 2002 }, // 青铜宝箱
      { discount: goldenBoxDiscountNum, itemId: 2003 }, // 黄金宝箱
      { discount: platinumBoxDiscountNum, itemId: 2004 }, // 铂金宝箱
      { discount: goldenRodDiscountNum, itemId: 1012 }  // 金鱼竿
    ]
    
    // 发送设置黑市购买命令
    const result = await tokenStore.sendStoreSetPurchase(
      token.id,
      {
        purchaseCnt: purchaseCountNum,
        purchaseItemList: purchaseItemList
      }
    )
    
    if (result && (result.code === 0 || result.code === undefined || result.success === true)) {
      message.success('黑市购买设置成功')
      
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '黑市购买设置',
        operation: '确认设置',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: '黑市购买设置成功'
      })
      
      await saveSettings()
    } else {
      const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
      message.error(`黑市购买设置失败: ${errorMsg}`)
      
      // 添加操作日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '黑市购买设置',
        operation: '确认设置',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `黑市购买设置失败: ${errorMsg}`
      })
    }
  } catch (error) {
    console.error('设置黑市购买失败:', error)
    message.error(`设置失败: ${error.message || '未知错误'}`)
  } finally {
    isSetting.value = false
  }
}

// 批量设置黑市购买（按照执行范围执行）
const handleBatchSetBlackMarket = async () => {
  // 验证输入
  const purchaseCountNum = Number(purchaseCount.value)
  const bronzeBoxDiscountNum = Number(bronzeBoxDiscount.value)
  const goldenBoxDiscountNum = Number(goldenBoxDiscount.value)
  const platinumBoxDiscountNum = Number(platinumBoxDiscount.value)
  const goldenRodDiscountNum = Number(goldenRodDiscount.value)
  
  if (isNaN(purchaseCountNum) || purchaseCountNum < 0 || purchaseCountNum > 999) {
    message.error('购买次数必须在0-999之间')
    return
  }
  
  if (isNaN(bronzeBoxDiscountNum) || bronzeBoxDiscountNum < 0 || bronzeBoxDiscountNum > 10 ||
      isNaN(goldenBoxDiscountNum) || goldenBoxDiscountNum < 0 || goldenBoxDiscountNum > 10 ||
      isNaN(platinumBoxDiscountNum) || platinumBoxDiscountNum < 0 || platinumBoxDiscountNum > 10 ||
      isNaN(goldenRodDiscountNum) || goldenRodDiscountNum < 0 || goldenRodDiscountNum > 10) {
    message.error('折扣值必须在0-10之间')
    return
  }
  
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
  const tokenIndices = parseTokenRange(blackMarketTokens.value)
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
  
  if (isBatchSetting.value) {
    isBatchSetting.value = false
    message.info('批量设置已停止')
    return
  }
  
  try {
    isBatchSetting.value = true
    
    // 获取每个token在sortedTokens中的序号（用于显示）
    const getTokenIndex = (token) => {
      const index = sortedTokensList.findIndex(t => t.id === token.id)
      return index + 1
    }
    
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量设置黑市购买（${rangeText}），共${targetTokens.length}个Token...`)
    
    let successCount = 0
    let failCount = 0
    const failedTokens = [] // 记录失败的token
    
    // 构建购买清单
    const purchaseItemList = [
      { discount: bronzeBoxDiscountNum, itemId: 2002 },
      { discount: goldenBoxDiscountNum, itemId: 2003 },
      { discount: platinumBoxDiscountNum, itemId: 2004 },
      { discount: goldenRodDiscountNum, itemId: 1012 }
    ]
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      if (!isBatchSetting.value) break
      
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
        

        
        // 发送设置黑市购买命令
        const result = await tokenStore.sendStoreSetPurchase(
          token.id,
          {
            purchaseCnt: purchaseCountNum,
            purchaseItemList: purchaseItemList
          }
        )
        
        if (result && (result.code === 0 || result.code === undefined || result.success === true)) {
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 设置成功`)
          successCount++
          
          // 添加操作日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '黑市购买设置',
            operation: '批量设置',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `黑市购买设置成功`
          })
        } else {
          failCount++
          failedTokens.push(token.name || token.id) // 记录失败的token
          const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 设置失败: ${errorMsg}`)
          
          // 添加操作日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '黑市购买设置',
            operation: '批量设置',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `黑市购买设置失败: ${errorMsg}`
          })
        }
        
        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] 设置Token ${token.name || token.id} 失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 设置失败`)
        failCount++
      }
    }
    
    // 批量设置完成，添加汇总日志
    if (failedTokens.length > 0) {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '黑市购买设置',
        operation: '批量设置',
        status: 'error',
        message: `批量设置完成，失败的Token: ${failedTokens.join(', ')}`
      })
    }
    
    message.success(`批量设置完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
    await saveSettings()
  } catch (error) {
    console.error('批量设置失败:', error)
    message.error(`批量设置失败: ${error.message || '未知错误'}`)
  } finally {
    isBatchSetting.value = false
  }
}

// 导出黑市设置
const exportBlackMarketSettings = async () => {
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
  const tokenIndices = parseTokenRange(blackMarketTokens.value)
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
  
  isExportingBlackMarket.value = true
  const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
  message.info(`开始导出黑市设置（${rangeText}），共${targetTokens.length}个Token...`)
  
  try {
    const results = []
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      
      try {
        // 连接Token
        message.info(`[${i + 1}/${targetTokens.length}] 正在连接 ${token.name || token.id}...`)
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
            tokenStore.selectToken(token.id, true)
          }
        }
        
        if (status !== 'connected') {
          results.push({
            nickname: token.name || token.id,
            purchaseCnt: '连接失败',
            bronzeDiscount: '连接失败',
            goldenDiscount: '连接失败',
            platinumDiscount: '连接失败',
            rodDiscount: '连接失败'
          })
          continue
        }
        
        // 获取黑市购买设置
        const purchaseInfo = await tokenStore.sendStoreGetPurchase(token.id, {})
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!purchaseInfo || !purchaseInfo.purchaseItemList) {
          results.push({
            nickname: token.name || token.id,
            purchaseCnt: '获取失败',
            bronzeDiscount: '获取失败',
            goldenDiscount: '获取失败',
            platinumDiscount: '获取失败',
            rodDiscount: '获取失败'
          })
          continue
        }
        
        // 提取数据
        const purchaseCnt = purchaseInfo.purchaseCnt || 0
        const purchaseItemList = purchaseInfo.purchaseItemList || []
        
        // 查找各物品的折扣值
        const findDiscount = (itemId) => {
          const item = purchaseItemList.find(item => item.itemId === itemId)
          return item ? (item.discount || 0) : 0
        }
        
        const bronzeDiscount = findDiscount(2002) // 青铜宝箱
        const goldenDiscount = findDiscount(2003) // 黄金宝箱
        const platinumDiscount = findDiscount(2004) // 铂金宝箱
        const rodDiscount = findDiscount(1012) // 金鱼竿
        
        results.push({
          nickname: token.name || token.id,
          purchaseCnt: String(purchaseCnt),
          bronzeDiscount: String(bronzeDiscount),
          goldenDiscount: String(goldenDiscount),
          platinumDiscount: String(platinumDiscount),
          rodDiscount: String(rodDiscount)
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`导出Token ${token.name || token.id} 黑市设置失败:`, error)
        results.push({
          nickname: token.name || token.id,
          purchaseCnt: '获取失败',
          bronzeDiscount: '获取失败',
          goldenDiscount: '获取失败',
          platinumDiscount: '获取失败',
          rodDiscount: '获取失败'
        })
      }
    }
    
    // 生成TXT文件
    const header = '昵称\t购买次数\t青铜折扣\t黄金折扣\t铂金折扣\t金竿折扣\n'
    const content = results.map(r => 
      `${r.nickname}\t${r.purchaseCnt}\t${r.bronzeDiscount}\t${r.goldenDiscount}\t${r.platinumDiscount}\t${r.rodDiscount}`
    ).join('\n')
    
    const fullContent = header + content
    const blob = new Blob(['\ufeff' + fullContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().split('T')[0]
    link.download = `黑市设置_${date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('黑市设置导出完成')
  } catch (error) {
    console.error('导出黑市设置失败:', error)
    message.error(`导出黑市设置失败: ${error.message || '未知错误'}`)
  } finally {
    isExportingBlackMarket.value = false
  }
}

// 导出资源信息
const exportResourceInfo = async () => {
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
  const tokenIndices = parseTokenRange(blackMarketTokens.value)
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
  
  isExportingResourceInfo.value = true
  const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
  message.info(`开始导出资源信息（${rangeText}），共${targetTokens.length}个Token...`)
  
  try {
    const results = []
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      
      try {
        // 连接Token
        message.info(`[${i + 1}/${targetTokens.length}] 正在连接 ${token.name || token.id}...`)
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
            tokenStore.selectToken(token.id, true)
          }
        }
        
        if (status !== 'connected') {
          results.push({
            nickname: token.name || token.id,
            diamond: '连接失败',
            recruit: '连接失败',
            goldRod: '连接失败',
            boxPoints: '连接失败'
          })
          continue
        }
        
        // 刷新角色信息
        await tokenStore.sendGetRoleInfo(token.id)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 优先从全局gameData获取（如果当前选中的是这个token）
        // 否则从token.gameData获取
        let roleInfo = null
        if (tokenStore.selectedTokenId === token.id && tokenStore.gameData?.roleInfo) {
          roleInfo = tokenStore.gameData.roleInfo
        } else {
          // 重新获取token数据（刷新后）
          const refreshedToken = tokenStore.gameTokens.find(t => t.id === token.id)
          if (refreshedToken) {
            roleInfo = refreshedToken.gameData?.roleInfo
          }
        }
        
        if (!roleInfo || !roleInfo.role) {
          results.push({
            nickname: token.name || token.id,
            diamond: '获取失败',
            recruit: '获取失败',
            goldRod: '获取失败',
            boxPoints: '获取失败'
          })
          continue
        }
        
        // 提取资源信息（根据api采集/黑市/role_getroleinfo.txt的结构）
        // diamond: role.diamond
        const diamond = roleInfo.role.diamond || 0
        
        // 招募令：从items[1001].quantity获取
        let recruit = 0
        if (roleInfo.role.items) {
          const items = roleInfo.role.items
          const recruitItem = items[String(1001)] || items[1001]
          if (recruitItem) {
            // 根据API文件，结构是 { itemId: 1001, quantity: number, ext: null }
            if (typeof recruitItem === 'object' && recruitItem !== null) {
              recruit = Number(recruitItem.quantity || 0)
            } else if (typeof recruitItem === 'number') {
              recruit = recruitItem
            }
          }
        }
        
        // 金竿：从items[1012].quantity获取
        let goldRod = 0
        if (roleInfo.role.items) {
          const items = roleInfo.role.items
          const rodItem = items[String(1012)] || items[1012]
          if (rodItem) {
            // 根据API文件，结构是 { itemId: 1012, quantity: number, ext: null }
            if (typeof rodItem === 'object' && rodItem !== null) {
              goldRod = Number(rodItem.quantity || 0)
            } else if (typeof rodItem === 'number') {
              goldRod = rodItem
            }
          }
        }
        
        // 宝箱总分：计算（木质*1 + 青铜*10 + 黄金*20 + 铂金*50）
        // 根据API文件，宝箱结构是 { itemId: 2001, quantity: number, ext: null }
        let boxPoints = 0
        if (roleInfo.role.items) {
          const items = roleInfo.role.items
          const getBoxCount = (itemId) => {
            const item = items[String(itemId)] || items[itemId]
            if (item) {
              if (typeof item === 'object' && item !== null) {
                return Number(item.quantity || 0)
              } else if (typeof item === 'number') {
                return item
              }
            }
            return 0
          }
          const wooden = getBoxCount(2001) // 木质宝箱
          const bronze = getBoxCount(2002) // 青铜宝箱
          const gold = getBoxCount(2003) // 黄金宝箱
          const platinum = getBoxCount(2004) // 铂金宝箱
          boxPoints = wooden * 1 + bronze * 10 + gold * 20 + platinum * 50
        }
        
        results.push({
          nickname: token.name || token.id,
          diamond: String(diamond),
          recruit: String(recruit),
          goldRod: String(goldRod),
          boxPoints: String(boxPoints)
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`导出Token ${token.name || token.id} 资源信息失败:`, error)
        results.push({
          nickname: token.name || token.id,
          diamond: '获取失败',
          recruit: '获取失败',
          goldRod: '获取失败',
          boxPoints: '获取失败'
        })
      }
    }
    
    // 生成TXT文件
    const header = '昵称\t金砖\t招募令\t金竿\t宝箱总分\n'
    const content = results.map(r => 
      `${r.nickname}\t${r.diamond}\t${r.recruit}\t${r.goldRod}\t${r.boxPoints}`
    ).join('\n')
    
    const fullContent = header + content
    const blob = new Blob(['\ufeff' + fullContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().split('T')[0]
    link.download = `资源信息_${date}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('资源信息导出完成')
  } catch (error) {
    console.error('导出资源信息失败:', error)
    message.error(`导出资源信息失败: ${error.message || '未知错误'}`)
  } finally {
    isExportingResourceInfo.value = false
  }
}
</script>

<style scoped>
.purchase-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
