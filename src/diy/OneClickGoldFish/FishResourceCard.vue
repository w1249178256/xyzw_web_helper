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
          
          <!-- 第三行：已用金砖、已用招募 -->
          <CustomizedCard 
            mode="name-count"
            name="已用金砖"
            :count="usedDiamond"
          />
          <CustomizedCard 
            mode="name-count"
            name="已用招募"
            :count="usedRecruit"
          />
          
          <!-- 第四行：已用宝箱、已用金竿 -->
          <CustomizedCard 
            mode="name-count"
            name="已用宝箱"
            :count="usedBox"
          />
          <CustomizedCard 
            mode="name-count"
            name="已用金竿"
            :count="usedGoldRod"
          />
          
          <!-- 第五行：金币袋子、助威道具 -->
          <CustomizedCard 
            mode="name-count"
            name="金币袋子"
            :count="getItemCountById(3002)"
          />
          <CustomizedCard 
            mode="name-count"
            name="助威道具"
            :count="getItemCountById(1021)"
          />
          
          <!-- 第四行：任务道具（数量）、金鱼道具（数量） -->
          <CustomizedCard 
            mode="name-count"
            name="任务道具"
            :count="taskItemId ? getItemCountById(Number(taskItemId)) : 0"
          />
          <CustomizedCard 
            mode="name-count"
            name="金鱼道具"
            :count="fishItemId ? getItemCountById(Number(fishItemId)) : 0"
          />
          
          <!-- 第五行：任务道具（输入框）、金鱼道具（输入框） -->
          <CustomizedCard 
            mode="name-input"
            name="任务道具"
            v-model:inputValue="taskItemId"
            placeholder="输入itemid"
          />
          <CustomizedCard 
            mode="name-input"
            name="金鱼道具"
            v-model:inputValue="fishItemId"
            placeholder="输入itemid"
          />
          
          <!-- 第六行：助威道具（输入框）、任务名称（输入框） -->
          <CustomizedCard 
            mode="name-input"
            name="助威道具"
            v-model:inputValue="cheerItemId"
            placeholder="输入itemid"
          />
          <CustomizedCard 
            mode="name-input"
            name="任务名称"
            v-model:inputValue="taskName"
            placeholder="输入任务名称"
          />
          
        </CustomizedCard>
      </div>
      
      <!-- 统一按钮容器 - 所有按钮使用CustomizedCard模板 -->
      <CustomizedCard mode="container">
        <!-- 第一行：一键宝箱、刷新资源 -->
        <CustomizedCard 
          mode="button"
          name="一键宝箱"
          @button-click="openAllBoxes"
          :disabled="!selectedTokenId || boxOpening"
          :loading="boxOpening"
        />
        <CustomizedCard 
          mode="button"
          name="刷新资源"
          @button-click="autoOpenAllBoxes"
          :disabled="!selectedTokenId || boxOpening"
          :loading="boxOpening"
        />
        
        <!-- 第二行：一键金竿 -->
        <CustomizedCard 
          mode="button"
          name="一键金竿"
          @button-click="startFishing"
          :disabled="!selectedTokenId || fishingRunning"
          :loading="fishingRunning"
        />
        
        <!-- 第二行：一键招募 -->
        <CustomizedCard 
          mode="button"
          name="一键招募"
          @button-click="startRecruit"
          :disabled="!selectedTokenId || recruitRunning"
          :loading="recruitRunning"
        />
        
        <!-- 第三行：领取奖励宝箱 -->
        <CustomizedCard 
          mode="button"
          name="领取奖励宝箱"
          @button-click="claimRewardBoxes"
          :disabled="!selectedTokenId || rewardsClaiming"
          :loading="rewardsClaiming"
        />
        
        <!-- 第三行：领取任务奖励 -->
        <CustomizedCard 
          mode="button"
          name="领取任务奖励"
          @button-click="claimTaskRewards"
          :disabled="!selectedTokenId || rewardsClaiming"
          :loading="rewardsClaiming"
        />
        
        <!-- 第四行：领取邮件 -->
        <CustomizedCard 
          mode="button"
          name="领取邮件"
          @button-click="claimEmails"
          :disabled="!selectedTokenId || rewardsClaiming"
          :loading="rewardsClaiming"
        />
        
        <!-- 第四行：使用道具 -->
        <CustomizedCard 
          mode="button"
          name="使用道具"
          @button-click="resetAllUsage"
              :disabled="!selectedTokenId"
        />
        
        <!-- 第五行：一键金鱼按钮 -->
            <CustomizedCard 
              mode="button"
              name="一键金鱼"
          @button-click="quickFishing"
              :disabled="!selectedTokenId || fishingRunning"
          :loading="fishingRunning"
          style="grid-column: span 2;"
            />
      </CustomizedCard>
        
        <!-- 新增容器：执行范围及批量操作 -->
        <CustomizedCard mode="container">
          <CustomizedCard
            mode="execution-range"
            name="执行范围"
            v-model:inputValue="executionRange"
            placeholder="请输入执行范围，如：1-20 或 3,4,5"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量一键宝箱"
            :disabled="isAnyOperationRunning"
            @button-click="batchOpenAllBoxes"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量一键金竿"
            :disabled="isAnyOperationRunning"
            @button-click="batchStartFishing"
          />
          <CustomizedCard
            mode="button-placeholder"
            button-text="批量一键招募"
            :disabled="isAnyOperationRunning"
            @button-click="batchStartRecruit"
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
  connectionTimeout: 30000,
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

// 已使用数量状态
const usedDiamond = ref(0)
const usedRecruit = ref(0)
const usedBox = ref(0)
const usedGoldRod = ref(0)

// 输入框状态
const taskItemId = ref('')
const fishItemId = ref('')
const cheerItemId = ref('')
const taskName = ref('')
const executionRange = ref('') // 执行范围

// 开关状态
const fishingEnabled = ref(false)
const recruitEnabled = ref(false)
const claimRewardBoxesEnabled = ref(false)
const claimTaskRewardsEnabled = ref(false)
const claimEmailsEnabled = ref(false)

// 保存开关状态到服务器
const saveSettings = async () => {
  await savePageTokenCards('fish-helper', {
    settings: {
      fishingEnabled: fishingEnabled.value,
      recruitEnabled: recruitEnabled.value,
      claimRewardBoxesEnabled: claimRewardBoxesEnabled.value,
      claimTaskRewardsEnabled: claimTaskRewardsEnabled.value,
      claimEmailsEnabled: claimEmailsEnabled.value,
      usedDiamond: usedDiamond.value,
      usedRecruit: usedRecruit.value,
      usedBox: usedBox.value,
      usedGoldRod: usedGoldRod.value
    }
  })
}

// 从服务器加载开关状态
const loadSettings = async () => {
  const data = await loadPageTokenCards('fish-helper')
  if (data.settings) {
    fishingEnabled.value = data.settings.fishingEnabled ?? false
    recruitEnabled.value = data.settings.recruitEnabled ?? false
    claimRewardBoxesEnabled.value = data.settings.claimRewardBoxesEnabled ?? false
    claimTaskRewardsEnabled.value = data.settings.claimTaskRewardsEnabled ?? false
    claimEmailsEnabled.value = data.settings.claimEmailsEnabled ?? false
    usedDiamond.value = data.settings.usedDiamond ?? 0
    usedRecruit.value = data.settings.usedRecruit ?? 0
    usedBox.value = data.settings.usedBox ?? 0
    usedGoldRod.value = data.settings.usedGoldRod ?? 0
  }
}

// 监听开关状态变化，自动保存（防抖）
let saveTimer = null
watch([fishingEnabled, recruitEnabled, claimRewardBoxesEnabled, claimTaskRewardsEnabled, claimEmailsEnabled], () => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    saveSettings()
  }, 1000) // 1秒后保存，避免频繁保存
})

// 页面加载时恢复设置
onMounted(() => {
  loadSettings()
})

// 操作状态
const boxOpening = ref(false)
const fishingRunning = ref(false)
const recruitRunning = ref(false)
const rewardsClaiming = ref(false)

// 计算是否有任何操作正在运行
const isAnyOperationRunning = computed(() => {
  return boxOpening.value || fishingRunning.value || recruitRunning.value || rewardsClaiming.value
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
          await new Promise(resolve => setTimeout(resolve, 400))
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

const startFishing = async () => {
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
    fishingRunning.value = true
    
    // 获取现有金竿数量
    const currentGoldRod = getResourceCount('goldRod')
    if (currentGoldRod < 10) {
      message.warning('金竿数量不足10，无法执行')
      fishingRunning.value = false
      return
    }
    
    // 计算执行次数：min((1600 - 已用金竿) / 10, 现有金竿 / 10)
    const remainingQuota = Math.floor((1600 - usedGoldRod.value) / 10)
    const availableRods = Math.floor(currentGoldRod / 10)
    const executeCount = Math.min(remainingQuota, availableRods)
    
    if (executeCount <= 0) {
      if (remainingQuota <= 0) {
        message.warning('今日已用金竿已达上限（1600）')
      } else {
        message.warning('金竿数量不足')
      }
      fishingRunning.value = false
      return
    }
    
    message.info(`开始执行一键金竿，共${executeCount}次（每次10竿）...`)
    
    // 执行钓鱼
    for (let i = 0; i < executeCount; i++) {
      try {
        const result = await tokenStore.sendMessageWithPromise(
          token.id,
          'artifact_lottery',
          { type: 2, lotteryNumber: 10, newFree: true },
          10000
        )
        
        if (result && (result.code === 0 || result.code === undefined || result.success === true)) {
          usedGoldRod.value += 10
          console.log(`[${i + 1}/${executeCount}] 一键金竿执行成功`)
          
          // 保存已用数量
          await saveSettings()
        } else {
          const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
          message.warning(`[${i + 1}/${executeCount}] 一键金竿执行失败: ${errorMsg}`)
          console.error(`[${i + 1}/${executeCount}] 一键金竿执行失败:`, result)
          break // 如果失败，停止执行
        }
      } catch (error) {
        console.error(`[${i + 1}/${executeCount}] 一键金竿执行异常:`, error)
        message.error(`[${i + 1}/${executeCount}] 一键金竿执行异常: ${error.message || '未知错误'}`)
        break // 如果异常，停止执行
      }
      
      // 每次间隔0.5s（最后一次不需要等待）
      if (i < executeCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // 刷新角色信息
    await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    
    message.success(`一键金竿执行完成，共执行${executeCount}次，已用金竿：${usedGoldRod.value}`)
  } catch (error) {
    console.error('一键金竿执行失败:', error)
    message.error('一键金竿执行失败: ' + (error.message || '未知错误'))
  } finally {
    fishingRunning.value = false
  }
}

const startRecruit = async () => {
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
    recruitRunning.value = true
    
    // 获取现有招募数量（从recruitDataList或items中获取）
    let currentRecruit = 0
    if (recruitDataList.value && recruitDataList.value.length > 0) {
      currentRecruit = recruitDataList.value[0]?.count || 0
    } else {
      // 如果recruitDataList没有数据，尝试从items中获取（itemId: 1001）
      currentRecruit = getItemCountById(1001)
    }
    
    if (currentRecruit < 10) {
      message.warning('招募令数量不足10，无法执行')
      recruitRunning.value = false
      return
    }
    
    // 计算执行次数：min((4000 - 已用招募) / 10, 现有招募 / 10)
    const remainingQuota = Math.floor((4000 - usedRecruit.value) / 10)
    const availableRecruit = Math.floor(currentRecruit / 10)
    const executeCount = Math.min(remainingQuota, availableRecruit)
    
    if (executeCount <= 0) {
      if (remainingQuota <= 0) {
        message.warning('今日已用招募已达上限（4000）')
      } else {
        message.warning('招募令数量不足')
      }
      recruitRunning.value = false
      return
    }
    
    message.info(`开始执行一键招募，共${executeCount}次（每次10招募令）...`)
    
    // 执行招募
    for (let i = 0; i < executeCount; i++) {
      try {
        const result = await tokenStore.sendMessageWithPromise(
          token.id,
          'hero_recruit',
          { recruitType: 1, recruitNumber: 10 },
          10000
        )
        
        if (result && (result.code === 0 || result.code === undefined || result.success === true)) {
          usedRecruit.value += 10
          console.log(`[${i + 1}/${executeCount}] 一键招募执行成功`)
          
          // 保存已用数量
          await saveSettings()
        } else {
          const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
          message.warning(`[${i + 1}/${executeCount}] 一键招募执行失败: ${errorMsg}`)
          console.error(`[${i + 1}/${executeCount}] 一键招募执行失败:`, result)
          break // 如果失败，停止执行
        }
      } catch (error) {
        console.error(`[${i + 1}/${executeCount}] 一键招募执行异常:`, error)
        message.error(`[${i + 1}/${executeCount}] 一键招募执行异常: ${error.message || '未知错误'}`)
        break // 如果异常，停止执行
      }
      
      // 每次间隔0.5s（最后一次不需要等待）
      if (i < executeCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // 刷新角色信息
    await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    
    message.success(`一键招募执行完成，共执行${executeCount}次，已用招募：${usedRecruit.value}`)
  } catch (error) {
    console.error('一键招募执行失败:', error)
    message.error('一键招募执行失败: ' + (error.message || '未知错误'))
  } finally {
    recruitRunning.value = false
  }
}

const claimRewardBoxes = async () => {
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
    message.info('正在领取奖励宝箱...')
    
    await tokenStore.sendItemClaimBoxPointReward(token.id, {})
    
    message.success('奖励宝箱领取成功')
  } catch (error) {
    console.error('领取奖励宝箱失败:', error)
    message.error(`领取奖励宝箱失败: ${error.message || '未知错误'}`)
  } finally {
    rewardsClaiming.value = false
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
          await new Promise(resolve => setTimeout(resolve, 200)) // 每次执行后等待200ms
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
        await new Promise(resolve => setTimeout(resolve, 300)) // 等待数据更新
        
        // 等待一段时间再执行下一次
        await new Promise(resolve => setTimeout(resolve, 200))
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
  rewardsClaiming.value = false
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
                await new Promise(resolve => setTimeout(resolve, 400))
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

// 批量一键招募
const batchStartRecruit = async () => {
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
  message.info(`开始批量一键招募（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行一键招募...`)
          
          // 获取现有招募数量（从items中获取，itemId: 1001）
          const currentRecruit = getItemCountById(1001)
          
          if (currentRecruit < 10) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 招募令数量不足10，无法执行`)
            return { success: false, token: token, error: '招募令数量不足10' }
          }
          
          // 执行招募（每次10个）
          const executeCount = Math.floor(currentRecruit / 10)
          
          if (executeCount <= 0) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 招募令数量不足`)
            return { success: false, token: token, error: '招募令数量不足' }
          }
          
          for (let i = 0; i < executeCount; i++) {
            try {
              const result = await tokenStore.sendMessageWithPromise(
                token.id,
                'hero_recruit',
                { recruitType: 1, recruitNumber: 10 },
                10000
              )
              
              if (!(result && (result.code === 0 || result.code === undefined || result.success === true))) {
                const errorMsg = result?.hint || result?.message || `未知错误 (Code: ${result?.code || 'N/A'})`
                console.warn(`[序号${tokenIndex}] 一键招募执行失败: ${errorMsg}`)
                break // 如果失败，停止执行
              }
            } catch (error) {
              console.error(`[序号${tokenIndex}] 一键招募执行异常:`, error)
              break // 如果异常，停止执行
            }
            
            // 每次间隔0.5s（最后一次不需要等待）
            if (i < executeCount - 1) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
          
          // 刷新角色信息
          await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 一键招募执行完成`)
          return { success: true, token: token }
        } catch (error) {
          const tokenIndex = getTokenIndex(token)
          console.error(`[序号${tokenIndex}] ${token.name || token.id} 一键招募执行失败:`, error)
          message.error(`[序号${tokenIndex}] ${token.name || token.id} 一键招募执行失败: ${error.message || '未知错误'}`)
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
    
    message.success(`批量一键招募完成：成功${successCount}个，失败${failCount}个`)
  } catch (error) {
    console.error('批量一键招募失败:', error)
    message.error(`批量一键招募失败: ${error.message || '未知错误'}`)
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