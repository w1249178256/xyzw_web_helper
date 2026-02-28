<template>
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
        <!-- 单个操作按钮区域 -->
        <CustomizedCard mode="container">
          <CustomizedCard 
            mode="button"
            name="使用火把"
            @button-click="handleUseTorch"
            :disabled="!selectedTokenId || isUsingTorch"
            :loading="isUsingTorch"
          />
          <CustomizedCard 
            mode="button"
            name="升级水晶"
            @button-click="handleUpgradeCrystal"
            :disabled="!selectedTokenId || isUpgradingCrystal"
            :loading="isUpgradingCrystal"
          />
          <CustomizedCard 
            mode="button"
            name="一键宝箱周"
            @button-click="handleOneClickBoxWeek"
            :disabled="isBoxWeekRunning"
            :loading="isBoxWeekRunning"
          />
          <CustomizedCard 
            mode="button"
            name="一键招募周"
            @button-click="handleOneClickRecruitWeek"
            :disabled="isRecruitWeekRunning"
            :loading="isRecruitWeekRunning"
          />
        </CustomizedCard>
        
        <!-- 批量操作区域：执行范围及批量按钮 -->
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
            :name="isBatchRecruitWeekRunning ? '批量招募周中...' : '批量招募周'"
            @button-click="handleBatchRecruitWeek"
            :disabled="isBatchRecruitWeekRunning"
            :loading="isBatchRecruitWeekRunning"
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
import { ref } from 'vue'
import { useTokenStore, selectedTokenId } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { GameController } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 操作状态
const isUsingTorch = ref(false)
const isUpgradingCrystal = ref(false)
const isBoxWeekRunning = ref(false)
const isRecruitWeekRunning = ref(false)
const isExportingDetails = ref(false)
const isBatchBoxWeekRunning = ref(false)
const isBatchRecruitWeekRunning = ref(false)
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

// 使用火把
const handleUseTorch = async () => {
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
    isUsingTorch.value = true
    
    // TODO: 实现使用火把功能
    message.info('使用火把功能开发中...')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '使用火把',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: '功能开发中，敬请期待'
    })
  } catch (error) {
    console.error('使用火把失败:', error)
    message.error(`使用火把失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '使用火把',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `使用火把失败: ${error.message || '未知错误'}`
    })
  } finally {
    isUsingTorch.value = false
  }
}

// 升级水晶
const handleUpgradeCrystal = async () => {
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
    isUpgradingCrystal.value = true
    
    // TODO: 实现升级水晶功能
    message.info('升级水晶功能开发中...')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级水晶',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: '功能开发中，敬请期待'
    })
  } catch (error) {
    console.error('升级水晶失败:', error)
    message.error(`升级水晶失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '升级水晶',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `升级水晶失败: ${error.message || '未知错误'}`
    })
  } finally {
    isUpgradingCrystal.value = false
  }
}

// 一键宝箱周
const handleOneClickBoxWeek = async () => {
  try {
    isBoxWeekRunning.value = true
    
    // TODO: 实现一键宝箱周功能
    message.info('一键宝箱周功能开发中...')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键宝箱周',
      status: 'info',
      message: '功能开发中，敬请期待'
    })
  } catch (error) {
    console.error('一键宝箱周失败:', error)
    message.error(`一键宝箱周失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '一键宝箱周',
      status: 'error',
      message: `一键宝箱周失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBoxWeekRunning.value = false
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
          
          detailsList.push({
            序号: tokenIndex,
            Token名称: token.name || '未命名',
            推图层数: levelId,
            吕布星级: lvbuStarDisplay,
            宝箱总分: boxScore
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
      lines.push('序号,Token名称,推图层数,吕布星级,宝箱总分')
      detailsList.forEach(item => {
        lines.push(`${item.序号},${item.Token名称},${item.推图层数},${item.吕布星级},${item.宝箱总分}`)
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
      page: 'fish-helper',
      cardType: '养号',
      operation: '导出详情',
      status: 'error',
      message: `导出详情失败: ${error.message || '未知错误'}`
    })
  } finally {
    isExportingDetails.value = false
  }
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
      message: `功能开发中，敬请期待（${rangeText}，共${targetTokens.length}个Token）`
    })
    
    message.info('批量宝箱周功能开发中...')
    
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
</script>

<style scoped>
.account-maintenance {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
