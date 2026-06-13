<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Fish />
      </n-icon>
    </template>
    <template #title>
      <h3>金鱼资源信息</h3>
    </template>
    <template #badge>
      <span>{{ isRefreshing ? '刷新中' : '已就绪' }}</span>
    </template>
    <template #default>
      <div class="resources-list">
        <!-- 资源信息显示 - 使用CustomizedCard容器模式，按指定行分组 -->
        <CustomizedCard mode="container">
          
          <!-- 第一行：金砖、招募 -->
          <CustomizedCard 
            mode="name-count"
            name="金砖"
            :count="getResourceCount('diamond')"
          />
          <CustomizedCard 
            mode="name-count"
            name="招募"
            :count="recruitDataList[0]?.count || 0"
          />
          
          <!-- 第二行：宝箱、金竿 -->
          <CustomizedCard 
            mode="name-count"
            name="宝箱"
            :count="boxPoints"
          />
          <CustomizedCard 
            mode="name-count"
            name="金竿"
            :count="getResourceCount('goldRod')"
          />
          
          <!-- 第三行：助威道具（数量+输入框） -->
          <CustomizedCard 
            mode="name-count"
            name="助威道具"
            :count="getItemCountById(1021)"
          />
          <CustomizedCard 
            mode="name-input"
            name="助威道具"
            v-model:inputValue="cheerItemId"
            placeholder="输入itemid"
          />
          
          <!-- 第四行：任务道具（数量+输入框） -->
          <CustomizedCard 
            mode="name-count"
            name="任务道具"
            :count="taskItemId ? getItemCountById(Number(taskItemId)) : 0"
          />
          <CustomizedCard 
            mode="name-input"
            name="任务道具"
            v-model:inputValue="taskItemId"
            placeholder="输入itemid"
          />
          
          <!-- 第五行：金鱼道具（数量+输入框） -->
          <CustomizedCard 
            mode="name-count"
            name="金鱼道具"
            :count="fishItemId ? getItemCountById(Number(fishItemId)) : 0"
          />
          <CustomizedCard 
            mode="name-input"
            name="金鱼道具"
            v-model:inputValue="fishItemId"
            placeholder="输入itemid"
          />
          
          <!-- 第六行：任务名称（输入框） -->
          <CustomizedCard 
            mode="name-input"
            name="任务名称"
            v-model:inputValue="taskName"
            placeholder="输入任务名称"
          />
          
        </CustomizedCard>
      </div>
        
        <!-- 执行范围及批量操作 -->
        <CustomizedCard mode="container">
          <CustomizedCard
            mode="execution-range"
            name="执行范围"
            v-model:inputValue="executionRange"
            placeholder="请输入执行范围，如：1-20 或 3,4,5"
          />
          <CustomizedCard
            :mode="boxWeekRunning ? 'button' : 'button-placeholder'"
            :name="boxWeekRunning ? '停止宝箱周' : ''"
            :button-text="boxWeekRunning ? '' : '批量宝箱'"
            :disabled="!boxWeekRunning && isAnyOperationRunning"
            @button-click="boxWeekRunning ? stopBatchBoxWeek : batchBoxWeek"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量金竿"
            :disabled="isAnyOperationRunning"
            @button-click="batchStartFishing"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量招募"
            :disabled="isAnyOperationRunning"
            @button-click="batchRecruitWeek"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量助威"
            :disabled="isAnyOperationRunning"
            @button-click="batchCheer"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量金鱼"
            :disabled="isAnyOperationRunning"
            @button-click="batchQuickFishing"
          />
        </CustomizedCard>
        
        <!-- 停止操作按钮 -->
        <div class="stop-section">
          <n-button 
            type="warning" 
            size="small" 
            @click="stopAllOperations"
            :disabled="!isAnyOperationRunning"
            block
          >
            停止所有操作
          </n-button>
        </div>
        
        <!-- 操作日志 -->
        <OperationLogCard 
          page="fish-helper" 
          :filter-operations="['一键金鱼']"
        />
    </template>
  </MyCard>
</template>

<script setup>
// @unocss-include
// uno-css-ignore-file
import { ref, computed, onMounted, watch } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { Fish } from '@vicons/ionicons5'
import { savePageTokenCards, loadPageTokenCards } from '@/utils/pageTokenStorage'
import ConnectionPoolManager from '@/utils/connectionPoolManager'

const tokenStore = useTokenStore()
const message = useMessage()

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 3000,
  reconnectDelay: 1000,
  maxRetries: 3
})

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 计算属性：从gameData中获取数据
const boxPoints = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.gameData) return 0
  return token.gameData.boxPoints || 0
})

const recruitDataList = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.gameData) return []
  return token.gameData.recruitDataList || []
})

const fishResourceLogs = ref([])
const isRefreshing = ref(false)

// 输入框状态
const taskItemId = ref('')
const fishItemId = ref('')
const cheerItemId = ref('')
const taskName = ref('')
const executionRange = ref('') // 执行范围

// 保存输入框状态到本地存储
const saveInputSettings = async () => {
  await savePageTokenCards('fish-helper-inputs', {
    taskItemId: taskItemId.value,
    fishItemId: fishItemId.value,
    cheerItemId: cheerItemId.value,
    taskName: taskName.value
  })
}

// 从本地存储加载输入框状态
const loadInputSettings = async () => {
  const data = await loadPageTokenCards('fish-helper-inputs')
  if (data) {
    taskItemId.value = data.taskItemId ?? ''
    fishItemId.value = data.fishItemId ?? ''
    cheerItemId.value = data.cheerItemId ?? ''
    taskName.value = data.taskName ?? ''
  }
}

// 监听输入框状态变化，自动保存（防抖）
let inputSaveTimer = null
watch([taskItemId, fishItemId, cheerItemId, taskName], () => {
  if (inputSaveTimer) {
    clearTimeout(inputSaveTimer)
  }
  inputSaveTimer = setTimeout(() => {
    saveInputSettings()
  }, 500) // 500ms后保存，避免频繁保存
})

// 页面加载时恢复输入框设置
onMounted(() => {
  loadInputSettings()
})

// 操作状态
const boxOpening = ref(false)
const fishingRunning = ref(false)
const recruitRunning = ref(false)
const cheerRunning = ref(false)
const quickFishingRunning = ref(false)
const boxWeekRunning = ref(false)
const boxWeekCancelled = ref(false)
const recruitWeekRunning = ref(false)

// 计算是否有任何操作正在运行
const isAnyOperationRunning = computed(() => {
  return boxOpening.value || fishingRunning.value || recruitRunning.value || cheerRunning.value || quickFishingRunning.value || boxWeekRunning.value || recruitWeekRunning.value
})

// 获取资源数量
const getResourceCount = (resourceType) => {
  // 优先从全局 gameData.roleInfo 获取（这是最新的数据源）
  const roleInfo = tokenStore.gameData?.roleInfo
  if (roleInfo && roleInfo.role) {
    switch (resourceType) {
      case 'diamond':
        return roleInfo.role.diamond || 0
      case 'goldRod':
        // 优先从 items 获取，其次从 fishing 获取
        const items = roleInfo.role.items
        if (items && typeof items === 'object') {
          const rodItem = items[String(1012)] || items[1012]
          if (rodItem) {
            if (typeof rodItem === 'object' && rodItem !== null) {
              return Number(rodItem.quantity || rodItem.count || rodItem.num || 0)
            }
            if (typeof rodItem === 'number') {
              return rodItem
            }
          }
        }
        // 从 fishing 获取
        return roleInfo.role.fishing?.goldRod || roleInfo.role.fishing?.vipRod || 0
      default:
        return 0
    }
  }
  
  // 兼容：从 token.gameData 获取（旧数据源）
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (token && token.gameData) {
    switch (resourceType) {
      case 'diamond':
        return token.gameData.diamond || 0
      case 'goldRod':
        return token.gameData.goldRod || 0
      default:
        return 0
    }
  }
  
  return 0
}

// 获取物品数量
// 根据 api采集/role_getinfo.txt 中的格式：
// items: {
//   "3001": { itemId: 3001, quantity: 127, ext: null },
//   "3002": { itemId: 3002, quantity: 2, ext: null }
// }
const getItemCountById = (itemId) => {
  // 优先从全局 gameData.roleInfo 获取（这是最新的数据源）
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
  
  // 兼容：从 token.gameData.roleInfo 获取（旧数据源）
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
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
  
  // 兼容旧格式：从 token.gameData.items 数组获取
  if (token && token.gameData && token.gameData.items && Array.isArray(token.gameData.items)) {
    const item = token.gameData.items.find(item => item.id === itemId)
    return item ? (item.count || 0) : 0
  }
  
  return 0
}

// 各种操作函数（从FishHelper.vue复制业务逻辑）
const openAllBoxes = async () => {
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
    boxOpening.value = true
    
    // 宝箱配置：itemId, 每个宝箱的分数, 每次开10个的分数
    const boxConfigs = [
      { itemId: 2005, name: '钻石宝箱', pointsPerBox: 0, pointsPerBatch: 0 }, // 钻石宝箱分数未知，先设为0
      { itemId: 2004, name: '铂金宝箱', pointsPerBox: 50, pointsPerBatch: 500 },
      { itemId: 2003, name: '黄金宝箱', pointsPerBox: 20, pointsPerBatch: 200 },
      { itemId: 2002, name: '青铜宝箱', pointsPerBox: 10, pointsPerBatch: 100 },
      { itemId: 2001, name: '木质宝箱', pointsPerBox: 1, pointsPerBatch: 10 }
    ]
    
    // 获取已用宝箱分
    const currentUsedBox = usedBox.value || 0
    
    // 如果已用宝箱分已经大于等于10000，则不再开宝箱
    if (currentUsedBox >= 10000) {
      message.warning(`已用宝箱分已达上限（${currentUsedBox}）`)
      boxOpening.value = false
      return
    }
    
    message.info('开始执行一键宝箱...')
    
    let totalOpened = 0
    let currentUsedPoints = currentUsedBox // 当前已使用的宝箱分
    
    // 按顺序打开每种宝箱
    for (const boxConfig of boxConfigs) {
      // 获取该类型宝箱的数量
      const boxCount = getItemCountById(boxConfig.itemId)
      
      if (boxCount === 0) {
        console.log(`${boxConfig.name}数量为0，跳过`)
        continue
      }
      
      // 计算可以开多少次（每次10个）
      const canOpenBatches = Math.floor(boxCount / 10)
      
      if (canOpenBatches === 0) {
        console.log(`${boxConfig.name}数量不足10个，跳过`)
        continue
      }
      
      // 计算可以开多少批次（考虑宝箱分上限）
      let batchesToOpen = canOpenBatches
      if (boxConfig.pointsPerBatch > 0) {
        const remainingQuota = 10000 - currentUsedPoints
        const maxBatchesByPoints = Math.floor(remainingQuota / boxConfig.pointsPerBatch)
        batchesToOpen = Math.min(canOpenBatches, maxBatchesByPoints)
      }
      
      if (batchesToOpen <= 0) {
        console.log(`${boxConfig.name}已达到宝箱分上限，停止开宝箱`)
        break
      }
      
      console.log(`开始打开${boxConfig.name}，共${batchesToOpen}次（每次10个）...`)
      
      // 执行开宝箱
      for (let i = 0; i < batchesToOpen; i++) {
        // 检查是否达到上限
        if (currentUsedPoints + boxConfig.pointsPerBatch > 10000) {
          console.log(`已达到宝箱分上限，停止开${boxConfig.name}`)
          break
        }
        
        try {
          const result = await tokenStore.sendMessageWithPromise(
            token.id,
            'item_openbox',
            { itemId: boxConfig.itemId, number: 10 },
            10000
          )
          
          if (result && (result.code === 0 || result.code === undefined || result.success === true)) {
            totalOpened += 10
            currentUsedPoints += boxConfig.pointsPerBatch
            console.log(`[${boxConfig.name}] ${i + 1}/${batchesToOpen} 批次开启成功`)
            
            // 更新已用宝箱分
            usedBox.value = currentUsedPoints
            await saveSettings()
          } else {
            const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
            message.warning(`[${boxConfig.name}] ${i + 1}/${batchesToOpen} 批次开启失败: ${errorMsg}`)
            console.error(`[${boxConfig.name}] ${i + 1}/${batchesToOpen} 批次开启失败:`, result)
            break // 如果失败，停止该类型宝箱
          }
        } catch (error) {
          console.error(`[${boxConfig.name}] ${i + 1}/${batchesToOpen} 批次开启异常:`, error)
          message.error(`[${boxConfig.name}] ${i + 1}/${batchesToOpen} 批次开启异常: ${error.message || '未知错误'}`)
          break // 如果异常，停止该类型宝箱
        }
        
        // 每次间隔0.4s（最后一次不需要等待）
        if (i < batchesToOpen - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // 检查是否达到上限
        if (currentUsedPoints >= 10000) {
          console.log(`已达到宝箱分上限，停止开宝箱`)
          break
        }
      }
      
      // 如果已达到上限，停止所有宝箱
      if (currentUsedPoints >= 10000) {
        break
      }
    }
    
    // 刷新角色信息
    await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    
    message.success(`一键宝箱执行完成，共开启${totalOpened}个宝箱，已用宝箱分：${usedBox.value}`)
  } catch (error) {
    console.error('一键宝箱执行失败:', error)
    message.error('一键宝箱执行失败: ' + (error.message || '未知错误'))
  } finally {
    boxOpening.value = false
  }
}

const autoOpenAllBoxes = async () => {
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
    isRefreshing.value = true
    message.info('正在刷新资源...')
    
    // 调用 role_getroleinfo 获取最新的角色信息和物品数据
    await tokenStore.sendGetRoleInfo(token.id)
    
    // 等待一下确保数据已更新
    await new Promise(resolve => setTimeout(resolve, 500))
    
    message.success('刷新资源成功')
  } catch (error) {
    console.error('刷新资源失败:', error)
    message.error('刷新资源失败: ' + (error.message || '未知错误'))
  } finally {
    isRefreshing.value = false
  }
}

// 从任务名称中提取activityId（数字）
const extractActivityIdFromTaskName = (taskName) => {
  if (!taskName || !taskName.trim()) {
    return null
  }
  
  // 尝试从字符串中提取数字
  const match = taskName.match(/\d+/)
  if (match) {
    return Number(match[0])
  }
  
  return null
}

const claimTaskRewards = async () => {
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
  
  // 从任务名称中提取activityId
  const activityId = extractActivityIdFromTaskName(taskName.value)
  if (!activityId) {
    message.error('请先输入任务名称（包含活动ID数字）')
    return
  }
  
  try {
    rewardsClaiming.value = true
    message.info(`正在领取任务奖励（活动ID: ${activityId}）...`)
    
    // 按组执行：1-20, 21-40, 41-60, 61-80, 81-100
    const groups = [
      { start: 1, end: 20 },
      { start: 21, end: 40 },
      { start: 41, end: 60 },
      { start: 61, end: 80 },
      { start: 81, end: 100 }
    ]
    
    let totalSuccess = 0
    let totalFail = 0
    
    for (const group of groups) {
      message.info(`正在领取任务奖励 ${group.start}-${group.end}...`)
      
      for (let missionId = group.start; missionId <= group.end; missionId++) {
        try {
          await tokenStore.sendActivityClaimTaskReward(token.id, {
            activityId: activityId,
            missionid: missionId
          })
          totalSuccess++
          await new Promise(resolve => setTimeout(resolve, 500)) // 每次执行后等待200ms
        } catch (error) {
          console.error(`领取任务奖励失败 (missionId: ${missionId}):`, error)
          totalFail++
          // 继续执行下一个，不中断
        }
      }
      
      // 每组之间稍作延迟
      if (group.end < 100) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    message.success(`任务奖励领取完成（成功: ${totalSuccess}, 失败: ${totalFail}）`)
  } catch (error) {
    console.error('领取任务奖励失败:', error)
    message.error(`领取任务奖励失败: ${error.message || '未知错误'}`)
  } finally {
    rewardsClaiming.value = false
  }
}

const claimEmails = async () => {
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
    rewardsClaiming.value = true
    message.info('正在领取邮件...')
    
    await tokenStore.sendMailClaimAllAttachment(token.id, { category: 0 })
    
    message.success('邮件领取成功')
  } catch (error) {
    console.error('领取邮件失败:', error)
    message.error(`领取邮件失败: ${error.message || '未知错误'}`)
  } finally {
    rewardsClaiming.value = false
  }
}

const resetAllUsage = async () => {
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
  
  // 检查任务道具ID是否已输入
  if (!taskItemId.value || !taskItemId.value.trim()) {
    message.error('请先输入任务道具ID')
    return
  }
  
  const itemId = Number(taskItemId.value.trim())
  if (isNaN(itemId) || itemId <= 0) {
    message.error('任务道具ID必须是有效的数字')
    return
  }
  
  try {
    rewardsClaiming.value = true
    message.info('正在使用道具...')
    
    let totalOpened = 0
    const openPackSize = 12 // 每次打开12个
    
    // 循环打开道具包，直到不足12个
    while (true) {
      // 获取当前道具数量
      const currentCount = getItemCountById(itemId)
      
      // 如果不足12个，停止循环
      if (currentCount < openPackSize) {
        if (currentCount > 0) {
          message.info(`剩余道具数量不足12个（${currentCount}个），停止打开`)
        } else {
          message.info('道具已用完，停止打开')
        }
        break
      }
      
      try {
        // 执行打开道具包命令
        await tokenStore.sendItemOpenPack(token.id, {
          itemId: itemId,
          number: openPackSize,
          index: 0
        })
        
        totalOpened += openPackSize
        
        // 刷新角色信息以获取最新道具数量
        await tokenStore.sendGetRoleInfo(token.id)
        await new Promise(resolve => setTimeout(resolve, 500)) // 等待数据更新
        
        // 等待一段时间再执行下一次
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`打开道具包失败 (itemId: ${itemId}, number: ${openPackSize}):`, error)
        // 如果打开失败，可能是道具不足或其他错误，停止循环
        message.warning(`打开道具包失败，已打开 ${totalOpened} 个`)
        break
      }
    }
    
    if (totalOpened > 0) {
      message.success(`使用道具完成，共打开 ${totalOpened} 个道具`)
    } else {
      message.info('没有可打开的道具')
    }
  } catch (error) {
    console.error('使用道具失败:', error)
    message.error(`使用道具失败: ${error.message || '未知错误'}`)
  } finally {
    rewardsClaiming.value = false
  }
}

const quickFishing = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  try {
    message.info('正在执行一键金鱼...')
    // 这里调用实际的API方法
    console.log('一键金鱼')
    message.success('一键金鱼执行成功')
  } catch (error) {
    console.error('一键金鱼执行失败:', error)
    message.error('一键金鱼执行失败')
  }
}

const stopAllOperations = () => {
  boxOpening.value = false
  fishingRunning.value = false
  recruitRunning.value = false
  cheerRunning.value = false
  quickFishingRunning.value = false
  boxWeekRunning.value = false
  recruitWeekRunning.value = false
  message.info('已停止所有操作')
}

// 批量一键宝箱
const batchOpenAllBoxes = async () => {
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
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
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
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  message.info(`开始批量一键宝箱（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行一键宝箱...`)
          
          // 宝箱配置：itemId, 每个宝箱的分数, 每次开10个的分数
          const boxConfigs = [
            { itemId: 2005, name: '钻石宝箱', pointsPerBox: 0, pointsPerBatch: 0 }, // 钻石宝箱分数未知，先设为0
            { itemId: 2004, name: '铂金宝箱', pointsPerBox: 50, pointsPerBatch: 500 },
            { itemId: 2003, name: '黄金宝箱', pointsPerBox: 20, pointsPerBatch: 200 },
            { itemId: 2002, name: '青铜宝箱', pointsPerBox: 10, pointsPerBatch: 100 },
            { itemId: 2001, name: '木质宝箱', pointsPerBox: 1, pointsPerBatch: 10 }
          ]
          
          let totalOpened = 0
          
          // 按顺序打开每种宝箱
          for (const boxConfig of boxConfigs) {
            // 获取该类型宝箱的数量
            const boxCount = getItemCountById(boxConfig.itemId)
            
            if (boxCount === 0) {
              console.log(`${boxConfig.name}数量为0，跳过`)
              continue
            }
            
            // 计算可以开多少次（每次10个）
            const canOpenBatches = Math.floor(boxCount / 10)
            
            if (canOpenBatches === 0) {
              console.log(`${boxConfig.name}数量不足10个，跳过`)
              continue
            }
            
            // 执行开宝箱
            for (let i = 0; i < canOpenBatches; i++) {
              try {
                const result = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'item_openbox',
                  { itemId: boxConfig.itemId, number: 10 },
                  10000
                )
                
                if (result && (result.code === 0 || result.code === undefined || result.success === true)) {
                  totalOpened += 10
                  console.log(`[${boxConfig.name}] ${i + 1}/${canOpenBatches} 批次开启成功`)
                } else {
                  const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
                  console.warn(`[${boxConfig.name}] ${i + 1}/${canOpenBatches} 批次开启失败: ${errorMsg}`)
                  break // 如果失败，停止该类型宝箱
                }
              } catch (error) {
                console.error(`[${boxConfig.name}] ${i + 1}/${canOpenBatches} 批次开启异常:`, error)
                break // 如果异常，停止该类型宝箱
              }
              
              // 每次间隔0.4s（最后一次不需要等待）
              if (i < canOpenBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
          }
          
          // 刷新角色信息
          await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 一键宝箱执行完成，共开启${totalOpened}个宝箱`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 一键宝箱执行失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 一键宝箱执行失败: ${error.message || '未知错误'}`)
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
    
    message.success(`批量一键宝箱完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量一键宝箱失败:', error)
    message.error(`批量一键宝箱失败: ${error.message || '未知错误'}`)
  }
}

// 批量一键金竿
const batchStartFishing = async () => {
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
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value)
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
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部"
  message.info(`开始批量一键金竿（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行一键金竿...`)
          
          // 获取现有金竿数量
          const currentGoldRod = getResourceCount('goldRod')
          if (currentGoldRod < 10) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 金竿数量不足10，无法执行`)
            return { success: false, token: token, error: '金竿数量不足10' }
          }
          
          // 执行钓鱼（每次10竿）
          const executeCount = Math.floor(currentGoldRod / 10)
          
          if (executeCount <= 0) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 金竿数量不足`)
            return { success: false, token: token, error: '金竿数量不足' }
          }
          
          for (let i = 0; i < executeCount; i++) {
            try {
              const result = await tokenStore.sendMessageWithPromise(
                token.id,
                'artifact_lottery',
                { type: 2, lotteryNumber: 10, newFree: true },
                10000
              )
              
              if (!(result && (result.code === 0 || result.code === undefined || result.success === true))) {
                const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
                console.warn(`[序号${tokenIndex}] 一键金竿执行失败: ${errorMsg}`)
                break // 如果失败，停止执行
              }
            } catch (error) {
              console.error(`[序号${tokenIndex}] 一键金竿执行异常:`, error)
              break // 如果异常，停止执行
            }
            
            // 每次间隔0.5s（最后一次不需要等待）
            if (i < executeCount - 1) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
          
          // 刷新角色信息
          await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 一键金竿执行完成`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 一键金竿执行失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 一键金竿执行失败: ${error.message || '未知错误'}`)
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
    
    message.success(`批量一键金竿完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量一键金竿失败:', error)
    message.error(`批量一键金竿失败: ${error.message || '未知错误'}`)
  }
}

// 停止批量宝箱周
const stopBatchBoxWeek = () => {
  boxWeekCancelled.value = true
  message.info('已停止批量宝箱周')
}

// 批量宝箱周
const batchBoxWeek = async () => {
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
  message.info(`开始批量宝箱周（${rangeText}），共${targetTokens.length}个Token...`)
  
  boxWeekRunning.value = true
  boxWeekCancelled.value = false
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        // 检查是否已取消
        if (boxWeekCancelled.value) {
          message.info(`[序号${getTokenIndex(token)}] ${token.name || token.id} - 批量宝箱周已停止`)
          return { success: false, token, error: '批量宝箱周已停止' }
        }
        
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行宝箱周...`)
          
          // 获取角色信息
          const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
          if (!roleInfo || !roleInfo.role || !roleInfo.role.items) {
            return { success: false, token, error: '获取角色信息失败' }
          }
          
          const items = roleInfo.role.items
          let M = items['2001']?.quantity || 0 // 木质宝箱
          let Q = items['2002']?.quantity || 0 // 青铜宝箱
          let H = items['2003']?.quantity || 0 // 黄金宝箱
          let B = items['2004']?.quantity || 0 // 铂金宝箱
          
          // 获取已用宝箱分Y
          let Y = 0
          const activityInfo = await tokenStore.sendMessageWithPromise(token.id, 'activity_get', {}, 10000)
          if (activityInfo?.activity?.myTotalInfo?.['2']) {
            const info = activityInfo.activity.myTotalInfo['2']
            const rounds = info.rounds || 1
            const num = info.num || 0
            Y = (rounds - 1) * 8000 + num
          }
          
          // 计算宝箱总分Z
          const Z = (M + Q * 10 + H * 20 + B * 50) + Y * 0.43
          const J = 0 // 基准宝箱分
          
          // 计算开箱轮数l
          let l = 0
          if (Z - J > 4200) {
            l = 1 + Math.floor((Z - J - 4200) / 3500)
          }
          if (l > 4) l = 4
          if (l < 0) l = 0
          
          const ZY = 8000 * l
          message.info(`[序号${tokenIndex}] ${token.name} - 开箱轮数: ${l}, 目标分数ZY: ${ZY}`)
          
          if (l === 0) {
            message.warning(`[序号${tokenIndex}] ${token.name} 不需要开箱`)
            return { success: true, token, rounds: 0 }
          }
          
          // 初始化开箱数量
          let MK = 0, QK = 0, HK = 0, BK = 0
          
          // 辅助函数：动态计算开箱数量（根据目标分数和当前宝箱数量，只输出10/50/100的组合）
          const calculateBoxOpenCount = (targetScore) => {
            const remainingScore = Math.max(0, targetScore - Y)
            let needBK = 0, needHK = 0, needQK = 0, needMK = 0
            
            // 优先使用高价值宝箱
            // 铂金宝箱：50分/个
            let maxBK = Math.floor(B / 10) * 10
            let needScoreBK = Math.floor(remainingScore / 50)
            needBK = Math.min(maxBK, needScoreBK)
            // 转换为10/50/100的组合
            needBK = convertToValidCount(needBK)
            let remaining = remainingScore - needBK * 50
            
            // 黄金宝箱：20分/个
            let maxHK = Math.floor(H / 10) * 10
            let needScoreHK = Math.floor(remaining / 20)
            needHK = Math.min(maxHK, needScoreHK)
            needHK = convertToValidCount(needHK)
            remaining -= needHK * 20
            
            // 青铜宝箱：10分/个
            let maxQK = Math.floor(Q / 10) * 10
            let needScoreQK = Math.floor(remaining / 10)
            needQK = Math.min(maxQK, needScoreQK)
            needQK = convertToValidCount(needQK)
            remaining -= needQK * 10
            
            // 木质宝箱：1分/个
            needMK = Math.min(M, remaining)
            needMK = convertToValidCount(needMK)
            
            return { BK: needBK, HK: needHK, QK: needQK, MK: needMK }
          }
          
          // 辅助函数：将数量转换为10的倍数（最多100个）
          const convertToValidCount = (count) => {
            if (count <= 0) return 0
            const roundedCount = Math.floor(count / 10) * 10
            return Math.min(Math.max(roundedCount, 10), 100)
          }
          
          // 辅助函数：计算已用宝箱分YY（木质宝箱1分/个）
          const calculateYY = () => {
            return Y + MK * 1 + QK * 10 + HK * 20 + BK * 50
          }
          
          // 辅助函数：获取服务器真实Y值
          const fetchRealY = async () => {
            try {
              const actInfo = await tokenStore.sendMessageWithPromise(token.id, 'activity_get', {}, 10000)
              if (actInfo && actInfo.activity && actInfo.activity.myTotalInfo && actInfo.activity.myTotalInfo['2']) {
                const info = actInfo.activity.myTotalInfo['2']
                const rounds = info.rounds || 1
                const num = info.num || 0
                Y = (rounds - 1) * 8000 + num
                message.info(`${token.name} - 已用宝箱分Y=${Y} (轮数:${rounds}, 当前轮分数:${num})`)
              }
            } catch (error) {
              console.error('获取Y值失败:', error)
            }
            return Y
          }
          
          // 辅助函数：计算铂金宝箱开箱数量（1-10个或10的倍数，最多100个）
          const calculatePlatinumOpenCount = (boxCount, diff) => {
            if (diff <= 0) return 0
            const scorePerBox = 50
            const needBoxes = Math.ceil(diff / scorePerBox)
            const maxCount = Math.min(needBoxes, boxCount, 100)
            
            if (maxCount <= 10) {
              return maxCount >= 1 ? maxCount : 0
            }
            
            const roundedCount = Math.floor(maxCount / 10) * 10
            return roundedCount >= 10 ? roundedCount : 0
          }
          
          // 辅助函数：计算青铜/黄金/木质宝箱开箱数量（10的倍数，最多100个）
          const calculateNormalOpenCount = (boxCount, diff, scorePerBox) => {
            if (diff <= 0) return 0
            const maxCount = Math.min(Math.floor(boxCount / 10) * 10, 100)
            if (maxCount === 0) return 0
            
            const needBoxes = Math.ceil(diff / scorePerBox)
            const needBoxesRounded = Math.ceil(needBoxes / 10) * 10
            
            const count = Math.min(needBoxesRounded, maxCount)
            return count >= 10 ? count : 0
          }
          
          // 辅助函数：开箱并检查分数
          const openBoxAndCheck = async (itemId, count, boxTypeName) => {
            await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId, number: count })
            
            const YY = calculateYY()
            const diff = ZY - YY
            
            const openBoxLog = `${token.name} - 开${boxTypeName}宝箱${count}个，已用宝箱积分YY: ${YY}，距离目标差值: ${diff}，累计开箱：木质${MK}个，青铜${QK}个，黄金${HK}个，铂金${BK}个`
            message.info(openBoxLog)
            
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // ZY-YY<1000时，检查服务器真实Y值
            if (diff < 1000) {
              await fetchRealY()
              if (Y >= ZY || Y > 32000) {
                message.info(`${token.name} - 已用宝箱分Y ${Y} 达到目标${Y > 32000 ? '或超过最大限制' : ''}，停止开箱`)
                return 'break'
              }
              // Y小于ZY，领取宝箱奖励后继续开箱
              message.info(`${token.name} - 已用宝箱分Y ${Y} 小于目标 ${ZY}，领取宝箱奖励后继续开箱`)
              await tokenStore.sendMessageWithPromise(token.id, 'item_batchclaimboxpointreward', {})
              await new Promise(resolve => setTimeout(resolve, 500))
              return 'continue'
            }
            
            // YY超过目标时，获取Y验证
            if (YY > ZY) {
              await fetchRealY()
              if (Y >= ZY || Y > 32000) {
                message.info(`${token.name} - 已用宝箱分Y ${Y} 达到目标${Y > 32000 ? '或超过最大限制' : ''}，停止开箱`)
                return 'break'
              }
            }
            
            return 'continue'
          }
          
          // 开宝箱阶段
          let shouldBreak = false
          
          while (!shouldBreak) {
            // 检查是否已经超过目标分数
            const currentYY = calculateYY()
            if (currentYY >= ZY) {
              message.info(`${token.name} - 已达到目标分数 ${ZY}`)
              break
            }
            
            // 动态计算本轮需要开的宝箱数量
            const targetCount = calculateBoxOpenCount(ZY)
            
            message.info(`${token.name} - 动态计算开箱数量：铂金${targetCount.BK}个，黄金${targetCount.HK}个，青铜${targetCount.QK}个，木质${targetCount.MK}个`)
            
            // 如果计算结果都是0，说明无法达到目标，退出循环
            if (targetCount.BK === 0 && targetCount.HK === 0 && targetCount.QK === 0 && targetCount.MK === 0) {
              message.info(`${token.name} - 宝箱数量不足，无法达到目标分数`)
              break
            }
            
            // 铂金宝箱开箱（itemId: 2004，50分/个）
            while (BK < targetCount.BK && B >= 10) {
              const diff = ZY - calculateYY()
              if (diff <= 0) {
                message.info(`${token.name} - 已超过目标分数，停止开箱`)
                shouldBreak = true
                break
              }
              const count = calculatePlatinumOpenCount(B, diff)
              if (count === 0) break
              
              const result = await openBoxAndCheck(2004, count, '铂金')
              B -= count
              BK += count
              if (result === 'break') {
                shouldBreak = true
                break
              }
            }
            if (shouldBreak) break
            
            // 黄金宝箱开箱（itemId: 2003，20分/个）
            while (HK < targetCount.HK && H >= 10) {
              const diff = ZY - calculateYY()
              if (diff <= 0) {
                message.info(`${token.name} - 已超过目标分数，停止开箱`)
                shouldBreak = true
                break
              }
              const count = calculateNormalOpenCount(H, diff, 20)
              if (count === 0) break
              
              const result = await openBoxAndCheck(2003, count, '黄金')
              H -= count
              HK += count
              if (result === 'break') {
                shouldBreak = true
                break
              }
            }
            if (shouldBreak) break
            
            // 青铜宝箱开箱（itemId: 2002，10分/个）
            while (QK < targetCount.QK && Q >= 10) {
              const diff = ZY - calculateYY()
              if (diff <= 0) {
                message.info(`${token.name} - 已超过目标分数，停止开箱`)
                shouldBreak = true
                break
              }
              const count = calculateNormalOpenCount(Q, diff, 10)
              if (count === 0) break
              
              const result = await openBoxAndCheck(2002, count, '青铜')
              Q -= count
              QK += count
              if (result === 'break') {
                shouldBreak = true
                break
              }
            }
            if (shouldBreak) break
            
            // 木质宝箱开箱（itemId: 2001，1分/个）
            while (MK < targetCount.MK && M >= 10) {
              const diff = ZY - calculateYY()
              if (diff <= 0) {
                message.info(`${token.name} - 已超过目标分数，停止开箱`)
                shouldBreak = true
                break
              }
              const count = calculateNormalOpenCount(M, diff, 1)
              if (count === 0) break
              
              const result = await openBoxAndCheck(2001, count, '木质')
              M -= count
              MK += count
              if (result === 'break') {
                shouldBreak = true
                break
              }
            }
            
            // 领取宝箱奖励后继续计算
            await tokenStore.sendMessageWithPromise(token.id, 'item_batchclaimboxpointreward', {})
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // 重新获取宝箱数量
            const newRoleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
            M = newRoleInfo?.role?.items?.['2001']?.quantity || 0
            Q = newRoleInfo?.role?.items?.['2002']?.quantity || 0
            H = newRoleInfo?.role?.items?.['2003']?.quantity || 0
            B = newRoleInfo?.role?.items?.['2004']?.quantity || 0
            
            // 重新获取Y值
            await fetchRealY()
          }
          
          // 领取宝箱奖励
          await tokenStore.sendMessageWithPromise(token.id, 'item_batchclaimboxpointreward', {})
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 领取邮件
          await tokenStore.sendMessageWithPromise(token.id, 'mail_claimallattachment', { category: 0 })
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 开钻石宝箱
          const diamondRoleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
          let D = diamondRoleInfo?.role?.items?.['2005']?.quantity || 0
          while (D >= 10) {
            await tokenStore.sendMessageWithPromise(token.id, 'item_openbox', { itemId: 2005, count: 10 })
            D -= 10
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          // 领取宝箱周奖励
          for (let i = 0; i < l + 1; i++) {
            try {
              await tokenStore.sendMessageWithPromise(token.id, 'activity_claimweekactreward', {})
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (e) {
              // 继续执行
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name} 宝箱周完成，执行${l}轮`)
          return { success: true, token, rounds: l }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name} 宝箱周失败:`, error)
          return { success: false, token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    message.success(`批量宝箱周完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量宝箱周失败:', error)
    message.error(`批量宝箱周失败: ${error.message || '未知错误'}`)
  } finally {
    boxWeekRunning.value = false
  }
}

// 批量招募周
const batchRecruitWeek = async () => {
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
  message.info(`开始批量招募周（${rangeText}），共${targetTokens.length}个Token...`)
  
  recruitWeekRunning.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行招募周...`)
          
          // 获取已用招募令
          let usedRecruitCount = 0
          try {
            const activityInfo = await tokenStore.sendMessageWithPromise(token.id, 'activity_get', {}, 10000)
            if (activityInfo?.activity?.myTotalInfo?.['1']?.num !== undefined) {
              usedRecruitCount = activityInfo.activity.myTotalInfo['1'].num
            }
          } catch (e) {}
          
          // 获取角色信息
          const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
          const items = roleInfo?.role?.items || {}
          const currentRecruitCount = items['1001']?.quantity || 0
          
          // 获取爬塔层数
          const tower = roleInfo?.role?.tower
          const towerFloor = tower && tower.id ? Math.floor(tower.id / 10) : 0
          
          if (towerFloor > 100) {
            message.info(`[序号${tokenIndex}] ${token.name} 爬塔层数${towerFloor}超过100层，跳过`)
            return { success: false, token, reason: 'tower_floor_exceeded' }
          }
          
          const totalRecruitCount = Math.floor(usedRecruitCount * 0.8 + currentRecruitCount)
          const maxRounds = Math.floor(totalRecruitCount / 400)
          
          if (maxRounds === 0) {
            message.warning(`[序号${tokenIndex}] ${token.name} 招募令不足`)
            return { success: false, token, reason: 'insufficient_recruits' }
          }
          
          const SY = maxRounds * 400
          message.info(`[序号${tokenIndex}] ${token.name} 计划执行${maxRounds}轮，目标已用${SY}`)
          
          // 执行招募
          let currentUsedCount = usedRecruitCount
          while (currentUsedCount < SY) {
            const diff = SY - currentUsedCount
            const recruitCount = Math.min(40 * maxRounds, Math.max(10, Math.floor(diff / 10) + 1))
            
            await tokenStore.sendMessageWithPromise(token.id, 'hero_recruit', { recruitType: 1, recruitNumber: recruitCount }, 10000)
            currentUsedCount += recruitCount
            message.info(`[序号${tokenIndex}] 招募${recruitCount}个，已用${currentUsedCount}/${SY}`)
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          // 领取奖励
          for (let i = 0; i < maxRounds; i++) {
            try {
              await tokenStore.sendMessageWithPromise(token.id, 'activity_claimweekactreward', {})
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (e) {}
          }
          
          // 领取邮件
          await tokenStore.sendMessageWithPromise(token.id, 'mail_claimallattachment', { category: 0 })
          
          message.success(`[序号${tokenIndex}] ${token.name} 招募周完成，执行${maxRounds}轮`)
          return { success: true, token, rounds: maxRounds }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name} 招募周失败:`, error)
          return { success: false, token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    message.success(`批量招募周完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量招募周失败:', error)
    message.error(`批量招募周失败: ${error.message || '未知错误'}`)
  } finally {
    recruitWeekRunning.value = false
  }
}

// 批量助威
const batchCheer = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const cheerId = Number(cheerItemId.value)
  if (!cheerId) {
    message.warning('请先输入助威道具ID')
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
  message.info(`开始批量助威（${rangeText}），共${targetTokens.length}个Token...`)
  
  cheerRunning.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          const cheerCount = getItemCountById(cheerId)
          
          if (cheerCount <= 0) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 助威道具数量不足`)
            return { success: false, token: token, error: '助威道具数量不足' }
          }
          
          await tokenStore.sendMessageWithPromise(
            token.id,
            'item_consume',
            { itemId: cheerId, quantity: cheerCount },
            10000
          )
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 助威完成，使用道具${cheerId} x${cheerCount}`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 助威失败:`, error)
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    message.success(`批量助威完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量助威失败:', error)
    message.error(`批量助威失败: ${error.message || '未知错误'}`)
  } finally {
    cheerRunning.value = false
  }
}

// 批量金鱼
const batchQuickFishing = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const fishId = Number(fishItemId.value)
  if (!fishId) {
    message.warning('请先输入金鱼道具ID')
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
  message.info(`开始批量金鱼（${rangeText}），共${targetTokens.length}个Token...`)
  
  quickFishingRunning.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          const fishCount = getItemCountById(fishId)
          
          if (fishCount <= 0) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 金鱼道具数量不足`)
            return { success: false, token: token, error: '金鱼道具数量不足' }
          }
          
          await tokenStore.sendMessageWithPromise(
            token.id,
            'item_consume',
            { itemId: fishId, quantity: fishCount },
            10000
          )
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 金鱼完成，使用道具${fishId} x${fishCount}`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 金鱼失败:`, error)
          return { success: false, token: token, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
          }
        }
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    message.success(`批量金鱼完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量金鱼失败:', error)
    message.error(`批量金鱼失败: ${error.message || '未知错误'}`)
  } finally {
    quickFishingRunning.value = false
  }
}
</script>

<style scoped>
.unified-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.unified-buttons-row {
  display: flex;
  gap: 0.5rem;
}

.unified-button-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.unified-button-full-width {
  flex: 2;
}

.unified-button {
  flex: 1;
}

.full-width {
  width: 100%;
}

.switch-placeholder {
  width: 32px;
  height: 20px;
  visibility: hidden;
}

.button-with-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  grid-column: span 1;
}

.button-with-switch :deep(.customized-card-item) {
  flex: 1;
}

.stop-section {
  margin-top: 1rem;
}

.log-section {
  margin-top: 1rem;
}

.log-container {
  height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5rem;
  background: var(--background-color);
}

.log-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border-color);
}
</style>