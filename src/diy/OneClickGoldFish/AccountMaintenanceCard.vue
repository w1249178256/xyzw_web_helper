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
            name="领取宝箱奖励"
            @button-click="handleClaimBoxRewards"
            :disabled="!selectedTokenId || isClaimingBoxRewards"
            :loading="isClaimingBoxRewards"
          />
          <CustomizedCard 
            mode="button"
            name="领取邮件"
            @button-click="handleClaimEmails"
            :disabled="!selectedTokenId || isClaimingEmails"
            :loading="isClaimingEmails"
          />
          <CustomizedCard 
            mode="button"
            name="领取宝箱周奖励"
            @button-click="handleClaimBoxWeekReward"
            :disabled="!selectedTokenId || isClaimingBoxWeekReward"
            :loading="isClaimingBoxWeekReward"
          />
          <!-- 一键宝箱周详细流程：
          1. 准备阶段：使用 getroleinfo 获取宝箱数量(M,Q,H,B)，使用 activity_get 获取已用宝箱分Y
          2. 计算阶段：计算宝箱总分Z=(M+Q*10+H*20+B*50)+Y*0.43，开箱轮数l=1+floor((Z-J-4500)/3500)，最多4轮
          3. 开宝箱阶段：按铂金→黄金→青铜→木质顺序，使用 item_openbox 命令每次开10个宝箱
             每次开箱后计算YY=Y+MK*10+QK*100+HK*200+BK*500，超过目标则获取实际Y验证
          4. 领取奖励阶段（开宝箱阶段内）：
             - 使用 item_batchclaimboxpointreward 领取宝箱奖励
             - 使用 mail_claimallattachment 领取邮件
             - 使用 getroleinfo 重新获取宝箱数量
          5. 检查阶段：使用 activity_get 检查已用宝箱分，决定是否继续下一轮或进入最终阶段
          6. 最终阶段：领取邮件和宝箱周奖励(activity_claimweekactreward) l+1次
          使用命令：getroleinfo, item_openbox, item_batchclaimboxpointreward, mail_claimallattachment, activity_get, activity_claimweekactreward -->
          <CustomizedCard 
            mode="button"
            name="一键宝箱周"
            @button-click="handleOneClickBoxWeek"
            :disabled="!selectedTokenId || isBoxWeekRunning"
            :loading="isBoxWeekRunning"
          />
        </CustomizedCard>
        
        <!-- 宝箱分相关 -->
        <CustomizedCard mode="container">
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

// 新增状态
const isClaimingBoxRewards = ref(false)
const isClaimingEmails = ref(false)
const isCalculatingBoxScore = ref(false)
const isCalculatingUsedBoxScore = ref(false)
const isClaimingBoxWeekReward = ref(false)
const baseBoxScore = ref('')
const boxTotalScore = ref('0')
const usedBoxScore = ref('0')

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
        await new Promise(resolve => setTimeout(resolve, 1000))
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
    if (Z - J > 4500) {
      l = 1 + Math.floor((Z - J - 4500) / 3500)
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
      
      // 木质宝箱，每次10个
      const woodTimes = Math.floor(M / 10)
      for (let i = 0; i < woodTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2001, count: 10 })
        M -= 10
        MK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
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
    
    // 记录每个Token的执行结果
    const executionResults = []
    
    // 逐个处理Token
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      message.info(`处理第 ${i + 1}/${targetTokens.length} 个Token: ${token.name}`)
      
      const result = await executeBoxWeekForToken(token)
      executionResults.push({
        tokenName: token.name,
        tokenId: token.id,
        boxWeekRounds: result.boxWeekRounds,
        successfulClaimCount: result.successfulClaimCount
      })
      
      // 处理完一个Token后，等待一段时间再处理下一个
      if (i < targetTokens.length - 1) {
        message.info(`等待3秒后处理下一个Token...`)
        await new Promise(resolve => setTimeout(resolve, 3000))
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
    
    // 记录执行轮次不为0的token的执行情况
    const nonZeroRoundsResults = executionResults.filter(result => result.boxWeekRounds > 0)
    
    if (nonZeroRoundsResults.length > 0) {
      const summaryMessage = nonZeroRoundsResults.map(result => 
        `Token: ${result.tokenName}，轮次: ${result.boxWeekRounds}，成功领取次数: ${result.successfulClaimCount}`
      ).join('; ')
      
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量宝箱周执行总结',
        status: 'info',
        message: `批量宝箱周执行总结：${summaryMessage}`,
        details: {
          totalTokens: targetTokens.length,
          nonZeroRoundsTokens: nonZeroRoundsResults.length,
          executionResults: nonZeroRoundsResults
        }
      })
      
      // 自动导出为txt文件
      try {
        const lines = [
          '批量宝箱周执行总结',
          `执行时间: ${new Date().toLocaleString()}`,
          `总Token数: ${targetTokens.length}`,
          `执行轮次不为0的Token数: ${nonZeroRoundsResults.length}`,
          '',
          'Token名称,执行轮次,成功领取次数',
          ...nonZeroRoundsResults.map(result => 
            `${result.tokenName},${result.boxWeekRounds},${result.successfulClaimCount}`
          )
        ]
        
        const content = lines.join('\n')
        const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        const fileName = `批量宝箱周执行总结_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.txt`
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        message.success(`导出执行总结完成: ${fileName}`)
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '导出执行总结',
          status: 'success',
          message: `导出执行总结完成: ${fileName}`
        })
      } catch (error) {
        console.error('导出执行总结失败:', error)
        message.warning(`导出执行总结失败: ${error.message || '未知错误'}`)
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '养号',
          operation: '导出执行总结',
          status: 'warning',
          message: `导出执行总结失败: ${error.message || '未知错误'}`
        })
      }
    } else {
      logStore.addLog({
        page: 'fish-helper',
        cardType: '养号',
        operation: '批量宝箱周执行总结',
        status: 'info',
        message: '批量宝箱周执行总结：没有执行轮次不为0的token',
        details: {
          totalTokens: targetTokens.length,
          nonZeroRoundsTokens: 0
        }
      })
    }
    
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

// 领取宝箱奖励
const handleClaimBoxRewards = async () => {
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
    isClaimingBoxRewards.value = true
    
    const result = await tokenStore.sendBatchClaimBoxPointReward(token.id)
    
    message.success('领取宝箱奖励成功')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取宝箱奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '领取宝箱奖励成功'
    })
  } catch (error) {
    console.error('领取宝箱奖励失败:', error)
    message.error(`领取宝箱奖励失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取宝箱奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `领取宝箱奖励失败: ${error.message || '未知错误'}`
    })
  } finally {
    isClaimingBoxRewards.value = false
  }
}

// 领取邮件
const handleClaimEmails = async () => {
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
    isClaimingEmails.value = true
    
    const result = await tokenStore.sendMessageWithPromise(token.id, 'mail_claimallattachment', { category: 0 })
    
    message.success('领取邮件成功')
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取邮件',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '领取邮件成功'
    })
  } catch (error) {
    console.error('领取邮件失败:', error)
    message.error(`领取邮件失败: ${error.message || '未知错误'}`)
    
    // 添加操作日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '养号',
      operation: '领取邮件',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `领取邮件失败: ${error.message || '未知错误'}`
    })
  } finally {
    isClaimingEmails.value = false
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
    if (Z - J > 4500) {
      l = 1 + Math.floor((Z - J - 4500) / 3500)
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
      
      // 木质宝箱，每次10个
      const woodTimes = Math.floor(M / 10)
      for (let i = 0; i < woodTimes; i++) {
        await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2001, count: 10 })
        M -= 10
        MK++
        // 计算剩余宝箱数量
        const remainingM = M - MK * 10
        const remainingQ = Q - QK * 10
        const remainingH = H - HK * 10
        const remainingB = B - BK * 10
        // 计算已用宝箱分YY
        const YY = Y + MK * 10 + QK * 100 + HK * 200 + BK * 500
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
</script>

<style scoped>
.account-maintenance {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
