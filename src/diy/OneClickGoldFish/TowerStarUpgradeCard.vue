<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <TrendingUp />
      </n-icon>
    </template>
    <template #title>
      <h3>爬塔升星</h3>
    </template>
    <template #badge>
      <span>{{ isRunning ? '执行中' : '就绪' }}</span>
    </template>
    <template #default>
      <div class="tower-star-upgrade-content">
        <!-- 顶部和中部合并容器 -->
        <div class="main-actions-section" style="margin-bottom: 1rem;">
          <CustomizedCard mode="container">
            <!-- 爬塔信息显示 -->
            <CustomizedCard mode="name-count" name="当前层数" :count="currentFloor" />
            <CustomizedCard mode="name-count" name="爬塔能量" :count="String(towerEnergy)" />
            
            <!-- 爬塔操作按钮 -->
            <CustomizedCard 
              mode="button" 
              name="停止爬塔" 
              :disabled="!selectedTokenId || !isBatchTowerRunning"
              @button-click="stopBatchTower" 
            />
            <CustomizedCard 
              mode="button" 
              name="刷新信息" 
              :disabled="!selectedTokenId || isBatchTowerRunning"
              @button-click="refreshTowerInfo" 
            />
            <CustomizedCard 
              mode="button" 
              name="领取奖励" 
              :disabled="!selectedTokenId || isBatchTowerRunning"
              @button-click="claimTowerReward" 
            />
            
            <!-- 单个Token操作按钮 -->
            <CustomizedCard 
              mode="button" 
              name="英雄升星" 
              :disabled="!selectedTokenId || isRunning"
              :loading="isRunning"
              @button-click="startHeroUpgrade" 
            />
            <CustomizedCard 
              mode="button" 
              name="图鉴升星" 
              :disabled="!selectedTokenId || isRunning"
              :loading="isRunning"
              @button-click="startBookUpgrade" 
            />
            <CustomizedCard 
              mode="button" 
              name="领取图鉴奖励" 
              :disabled="!selectedTokenId || isRunning"
              :loading="isRunning"
              @button-click="claimBookReward" 
            />
          </CustomizedCard>
        </div>
        
        <!-- 批量操作容器 -->
        <div class="batch-execution-section">
          <CustomizedCard mode="container">
            <CustomizedCard 
              mode="execution-range" 
              name="执行范围" 
              v-model:inputValue="batchTokens" 
              placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
              @update:inputValue="handleBatchTokensInput" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isBatchRunning ? '批量升星图鉴中...' : '批量升星图鉴'" 
              :disabled="tokenStore.gameTokens.length === 0 || isBatchRunning" 
              @button-click="handleBatchUpgrade" 
            />
            <CustomizedCard 
              mode="button" 
              :name="isBatchTowerRunning ? '批量爬塔中...' : '批量爬塔'" 
              :disabled="tokenStore.gameTokens.length === 0 || isBatchTowerRunning" 
              @button-click="handleBatchTower" 
            />
          </CustomizedCard>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        :filter-operations="['开始爬塔', '停止爬塔', '刷新信息', '领取奖励', '英雄升星', '图鉴升星', '领取图鉴奖励', '批量执行', '批量升星图鉴', '批量爬塔']"
      />
    </template>
  </MyCard>
</template>

<script setup>
// @unocss-include
// uno-css-ignore-file
import { defineProps, ref, computed } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { TrendingUp } from '@vicons/ionicons5'

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
const isRunning = ref(false)
const isBatchRunning = ref(false)
const isBatchTowerRunning = ref(false)
const batchTokens = ref('')

// 爬塔相关状态
let stopFlag = false
const climbTimeout = ref(null)

// 辅助函数：获取token的序号（基于名称排序后的顺序）
const getTokenIndex = (token) => {
  const gameTokens = [...tokenStore.gameTokens]
  const sortedTokens = gameTokens.sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  const index = sortedTokens.findIndex(t => t.id === token.id)
  return index + 1
}

// 计算属性：当前层数（从 tokenStore.gameData 获取）
const currentFloor = computed(() => {
  const roleInfo = tokenStore.gameData.roleInfo
  if (!roleInfo || !roleInfo.role) return '0-0'
  const tower = roleInfo.role.tower
  if (!tower || tower.id === undefined) return '0-0'
  const floor = Math.floor(tower.id / 10)
  const layer = tower.id % 10
  return `${floor}-${layer}`
})

// 计算属性：爬塔能量（从 tokenStore.gameData 获取）
const towerEnergy = computed(() => {
  const roleInfo = tokenStore.gameData.roleInfo
  if (!roleInfo || !roleInfo.role) return 0
  const tower = roleInfo.role.tower
  return tower?.energy || 0
})

// 开始爬塔（从GameStatus.vue复制）
const startTowerClimb = async () => {
  if (!props.selectedTokenId) {
    message.warning("请先选择Token");
    return;
  }

  if (towerEnergy.value <= 0) {
    message.warning("体力不足或正在爬塔中");
    return;
  }

  // 清除之前的超时
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value);
    climbTimeout.value = null;
  }

  isRunning.value = true;
  stopFlag = false;
  let climbCount = 0;
  let maxClimb = 600; // 最多批量次数，防止死循环
  // 设置超时保护，60秒后自动重置状态
  climbTimeout.value = setTimeout(() => {
    isRunning.value = false;
    climbTimeout.value = null;
    stopFlag = true;
    message.info("批量爬塔已超时自动停止");
  }, 60000);

  try {
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (!token) {
      throw new Error('Token不存在')
    }
    const tokenId = token.id;
    
    // 记录开始爬塔日志
    const tokenIndex = getTokenIndex(token)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `${tokenIndex}、${token.name || token.id}、开始爬塔...`
    })
    message.info('开始爬塔...')
    
    // 检查并领取未领取的塔奖励
    const roleInfo = tokenStore.gameData.roleInfo
    if (roleInfo && roleInfo.role && roleInfo.role.tower) {
      const tower = roleInfo.role.tower
      if (tower && tower.reward) {
        let claimedCount = 0
        for (let i = 0; i < 100; i++) {
          if (!tower.reward[i]) {
            try {
              await tokenStore.sendMessageWithPromise(tokenId, 'tower_claimreward', { rewardId: i }, 10000)
              claimedCount++
              const tokenIndex = getTokenIndex(token)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '爬塔升星',
                operation: '领取塔奖励',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、成功领取第${i}章通关奖励`
              })
              message.success(`${token.name || token.id} 成功领取第${i}章通关奖励`)
            } catch (error) {
              const tokenIndex = getTokenIndex(token)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '爬塔升星',
                operation: '领取塔奖励',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、领取第${i}章通关奖励失败: ${error.message || '未知错误'}`
              })
            }
          }
        }
        if (claimedCount > 0) {
          message.info(`${token.name || token.id} 共领取了${claimedCount}个塔奖励`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '领取塔奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${token.name || token.id} 共领取了${claimedCount}个塔奖励`
          })
        }
      }
    }
    
    for (let i = 0; i < maxClimb; i++) {
      if (stopFlag) break;
      
      // 体力判断必须每次都刷新
      const roleInfo = tokenStore.gameData.roleInfo
      if (!roleInfo || !roleInfo.role) {
        throw new Error('角色信息不存在')
      }
      const tower = roleInfo.role.tower
      const energy = tower?.energy || 0;
      if (energy <= 0) {
        const tokenIndex = getTokenIndex(token)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '开始爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、体力已耗尽`
        })
        break;
      }
      
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_starttower",
        {},
        10000,
      );
      climbCount++;
      
      // 记录每次爬塔日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '开始爬塔',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `${token.name || token.id} 第${climbCount}次爬塔命令已发送`
      })
      message.success(`第${climbCount}次爬塔命令已发送`);
      await new Promise((res) => setTimeout(res, 1000)); // 每次间隔 1 秒
    }
    
    message.success(`已自动爬塔${climbCount}次，体力已耗尽或达到上限。`);
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${token.name || token.id} 已自动爬塔${climbCount}次，体力已耗尽或达到上限`
    })
  } catch (error) {
    console.error('爬塔失败:', error)
    message.error("批量爬塔失败: " + (error.message || "未知错误"));
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${token.name || token.id} 爬塔失败: ${error.message || '未知错误'}`
    })
  }

  // 清除超时并重置状态
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value);
    climbTimeout.value = null;
  }
  isRunning.value = false;
}

// 停止爬塔（从 FishHelper.vue 复制）
const stopTowerClimb = () => {
  isRunning.value = false
  message.info('已停止爬塔')
}

// 停止批量爬塔
const stopBatchTower = () => {
  isBatchTowerRunning.value = false
  message.info('已停止批量爬塔')
}

// 刷新爬塔信息（从FishHelper.vue复制）
const refreshTowerInfo = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择 Token')
    return
  }
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token 不存在')
    return
  }
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket 未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在刷新爬塔信息...')
    
    // 发送刷新命令
    await tokenStore.sendGameMessage(token.id, 'tower_getinfo', {})
    const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
    
    // 获取并显示详细信息
    if (roleInfo && roleInfo.role && roleInfo.role.tower) {
      const tower = roleInfo.role.tower
      const towerId = tower.id
      const energy = tower.energy || 0
      const currentFloor = Math.floor(towerId / 10)
      const smallFloor = towerId % 10
      
      console.log(`[刷新信息] Token: ${token.name || token.id}, 当前层数：${currentFloor}层${smallFloor}小层 (towerId: ${towerId}), 鱼干数：${energy}`)
      
      message.success(`刷新成功：${currentFloor}层${smallFloor}小层，鱼干数：${energy}`)
    } else {
      message.success('爬塔信息刷新成功')
    }
  } catch (error) {
    console.error('刷新爬塔信息失败:', error)
    message.error('刷新爬塔信息失败')
  }
}

// 领取爬塔奖励（从FishHelper.vue复制）
const claimTowerReward = async () => {
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
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在领取爬塔奖励...')
    const roleInfo = token.gameData?.roleInfo
    const tower = roleInfo?.role?.tower
    if (tower && tower.reward) {
      // 遍历所有可领取的奖励
      for (let i = 0; i < 100; i++) {
        if (!tower.reward[i]) {
          await tokenStore.sendGameMessage(token.id, 'tower_claimreward', { rewardId: i })
          message.success(`成功领取第${i}章通关奖励`)
        }
      }
    } else {
      message.warning('没有可领取的奖励')
    }
  } catch (error) {
    console.error('领取爬塔奖励失败:', error)
    message.error('领取爬塔奖励失败')
  }
}

// 开始英雄升星
const startHeroUpgrade = async () => {
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
    isRunning.value = true
    
    // 检查连接状态，如果未连接则尝试连接
    let status = tokenStore.getWebSocketStatus(token.id)
    
    if (status !== 'connected') {
      message.info('Token未连接，正在尝试连接...')
      
      let retryCount = 0
      const maxRetries = 5
      
      while (status !== 'connected' && retryCount < maxRetries) {
        // 模拟点击token昵称（选择并连接token）
        tokenStore.selectToken(token.id, true)
        
        // 等待1秒
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 检查连接状态
        status = tokenStore.getWebSocketStatus(token.id)
        retryCount++
        
        if (status !== 'connected' && retryCount < maxRetries) {
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
    
    message.info('开始英雄升星...')
    
    // 添加开始日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '英雄升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `开始英雄升星...`
    })
    
    // 英雄ID列表（101-120, 201-228, 301-314）
    const heroIds = [
      ...Array.from({ length: 20 }, (_, i) => 101 + i),
      ...Array.from({ length: 28 }, (_, i) => 201 + i),
      ...Array.from({ length: 14 }, (_, i) => 301 + i),
    ]
    
    let totalUpgrades = 0
    let successCount = 0
    let failCount = 0
    
    for (let idx = 0; idx < heroIds.length; idx++) {
      const heroId = heroIds[idx]
      let heroUpgradeCount = 0
      
      // 每10个英雄更新一次进度日志
      if (idx % 10 === 0) {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '英雄升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `英雄升星进度: ${idx + 1}/${heroIds.length}，已升星 ${totalUpgrades} 次`
        })
      }
      
      // 对每个英雄尝试升星，最多10次
      for (let i = 1; i <= 10; i++) {
        let shouldBreak = false
        try {
          const res = await tokenStore.sendMessageWithPromise(
            token.id,
            'hero_heroupgradestar',
            { heroId },
            8000
          )
          
          // 检查响应结果
          if (res && (res.code === 0 || res.code === undefined || res.success === true)) {
            heroUpgradeCount++
            successCount++
            totalUpgrades++
          } else {
            // 升星失败（可能是已达到最大星级或其他原因）
            shouldBreak = true
          }
        } catch (err) {
          // 升星失败，跳过该英雄的剩余次数
          failCount++
          shouldBreak = true
        }
        
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (shouldBreak) {
          break
        }
      }
      
      if (heroUpgradeCount > 0) {
        console.log(`英雄ID ${heroId} 升星 ${heroUpgradeCount} 次`)
      }
    }
    
    message.success(`英雄升星完成！共升星 ${totalUpgrades} 次（成功: ${successCount}, 失败: ${failCount}）`)
    
    // 添加完成日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '英雄升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `英雄升星完成！共升星 ${totalUpgrades} 次（成功: ${successCount}, 失败: ${failCount}）`
    })
  } catch (error) {
    console.error('英雄升星失败:', error)
    message.error('英雄升星失败: ' + (error.message || '未知错误'))
    
    // 添加失败日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '英雄升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `英雄升星失败: ${error.message || '未知错误'}`
    })
  } finally {
    isRunning.value = false
  }
}

// 开始图鉴升星（从FishHelper.vue复制）
const startBookUpgrade = async () => {
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
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    isRunning.value = true
    message.info('开始图鉴升星...')
    
    // 添加开始日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '图鉴升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `开始图鉴升星...`
    })
    
    const heroIds = [
      ...Array.from({ length: 20 }, (_, i) => 101 + i),
      ...Array.from({ length: 28 }, (_, i) => 201 + i),
      ...Array.from({ length: 14 }, (_, i) => 301 + i),
    ]
    
    for (let idx = 0; idx < heroIds.length; idx++) {
      const heroId = heroIds[idx]
      
      // 每10个英雄更新一次进度日志
      if (idx % 10 === 0) {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '图鉴升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `图鉴升星进度: ${idx + 1}/${heroIds.length}`
        })
      }
      
      for (let i = 1; i <= 10; i++) {
        try {
          await tokenStore.sendMessageWithPromise(
            token.id,
            'book_upgrade',
            { heroId },
            8000
          )
        } catch (err) {
          // 失败后也执行延迟1秒
          await new Promise(resolve => setTimeout(resolve, 500))
          break
        }
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    message.success('图鉴升星完成')
    
    // 添加完成日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '图鉴升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `图鉴升星完成`
    })
  } catch (error) {
    console.error('图鉴升星失败:', error)
    message.error('图鉴升星失败')
    
    // 添加失败日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '图鉴升星',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `图鉴升星失败: ${error.message || '未知错误'}`
    })
  } finally {
    isRunning.value = false
  }
}

// 领取图鉴奖励（从FishHelper.vue复制）
const claimBookReward = async () => {
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
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    message.info('正在领取图鉴奖励...')
    
    // 添加开始日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '领取图鉴奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `开始领取图鉴奖励...`
    })
    
    let successCount = 0
    for (let i = 1; i <= 10; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'book_claimpointreward',
          {},
          8000
        )
        successCount++
      } catch (err) {
        // 失败后也执行延迟1秒
        await new Promise(resolve => setTimeout(resolve, 500))
        break
      }
      // 每次领取后延迟1秒（无论成功还是失败）
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    message.success('图鉴奖励领取完成')
    
    // 添加完成日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '领取图鉴奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `图鉴奖励领取完成，共领取${successCount}次`
    })
  } catch (error) {
    console.error('领取图鉴奖励失败:', error)
    message.error('领取图鉴奖励失败')
    
    // 添加失败日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '领取图鉴奖励',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `领取图鉴奖励失败: ${error.message || '未知错误'}`
    })
  }
}

// 解析Token范围（如果为空则返回null，表示执行全部）
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null // null表示执行全部
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

// 按token昵称排序的token列表（与页面显示顺序一致）
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

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

// 处理批量执行范围输入
const handleBatchTokensInput = (value) => {
  batchTokens.value = value
}

// 连接Token（模拟点击token昵称，最多重试5次）
const connectTokenWithRetry = async (token, tokenIndex) => {
  let status = tokenStore.getWebSocketStatus(token.id)
  
  if (status === 'connected') {
    return true
  }
  
  message.info(`序号 ${tokenIndex} ${token.name || token.id} 正在连接...`)
  
  let retryCount = 0
  const maxRetries = 5
  
  while (status !== 'connected' && retryCount < maxRetries) {
    // 模拟点击token昵称（选择并连接token）
    tokenStore.selectToken(token.id, true)
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 检查连接状态
    status = tokenStore.getWebSocketStatus(token.id)
    retryCount++
    
    if (status !== 'connected' && retryCount < maxRetries) {
      message.info(`序号 ${tokenIndex} 连接尝试 ${retryCount}/${maxRetries}...`)
    }
  }
  
  if (status !== 'connected') {
    message.warning(`序号 ${tokenIndex} ${token.name || token.id} 连接失败`)
    return false
  }
  
  message.success(`序号 ${tokenIndex} ${token.name || token.id} 连接成功`)
  return true
}

// 执行英雄升星（单个token）
const executeHeroUpgrade = async (token) => {
  const heroIds = [
    ...Array.from({ length: 20 }, (_, i) => 101 + i),
    ...Array.from({ length: 28 }, (_, i) => 201 + i),
    ...Array.from({ length: 14 }, (_, i) => 301 + i),
  ]
  
  for (const heroId of heroIds) {
    for (let i = 1; i <= 10; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'hero_heroupgradestar',
          { heroId },
          8000
        )
        } catch (err) {
          // 失败后也执行延迟1秒
          await new Promise(resolve => setTimeout(resolve, 500))
          break
        }
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

// 执行图鉴升星（单个token）
const executeBookUpgrade = async (token) => {
  const heroIds = [
    ...Array.from({ length: 20 }, (_, i) => 101 + i),
    ...Array.from({ length: 28 }, (_, i) => 201 + i),
    ...Array.from({ length: 14 }, (_, i) => 301 + i),
  ]
  
  for (const heroId of heroIds) {
    for (let i = 1; i <= 10; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'book_upgrade',
          { heroId },
          8000
        )
        } catch (err) {
          // 失败后也执行延迟1秒
          await new Promise(resolve => setTimeout(resolve, 500))
          break
        }
        // 每次升星后延迟1秒（无论成功还是失败）
        await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

// 执行领取图鉴奖励（单个token）
const executeClaimBookReward = async (token) => {
  for (let i = 1; i <= 10; i++) {
    try {
      await tokenStore.sendMessageWithPromise(
        token.id,
        'book_claimpointreward',
        {},
        8000
      )
    } catch (err) {
      // 失败后也执行延迟1秒
      await new Promise(resolve => setTimeout(resolve, 500))
      break
    }
    // 每次领取后延迟1秒（无论成功还是失败）
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

// 批量执行升星操作
const handleBatchUpgrade = async () => {
  const tokens = sortedTokens.value // 使用排序后的token列表
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(batchTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示和排序，与页面显示序号一致）
  const getTokenIndex = (token) => {
    const index = tokens.findIndex(t => t.id === token.id)
    return index + 1 // 序号从1开始，与页面显示序号一致
  }
  
  // 按照token在sortedTokens中的序号排序（与页面显示顺序一致）
  const sortedTargetTokens = targetTokens
    .map(token => ({ token, index: getTokenIndex(token) }))
    .sort((a, b) => a.index - b.index)
    .map(item => item.token)
  
  // 记录失败的token列表
  const failedTokens = []
  
  try {
    isBatchRunning.value = true
    const rangeText = tokenIndices === null ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量升星操作（${rangeText}），共${sortedTargetTokens.length}个Token，按序号顺序执行...`)
    
    // 添加开始日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '批量执行',
      status: 'info',
      message: `开始批量升星操作（${rangeText}），共${sortedTargetTokens.length}个Token`
    })
    
    for (let i = 0; i < sortedTargetTokens.length; i++) {
      const token = sortedTargetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      // 添加进度日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '批量执行',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `正在处理 ${i + 1}/${sortedTargetTokens.length}: 序号 ${tokenIndex} ${token.name || token.id}`
      })
      
      try {
        // 1. 连接Token（模拟点击token昵称，最多重试5次）
        const connected = await connectTokenWithRetry(token, tokenIndex)
        if (!connected) {
          message.warning(`序号 ${tokenIndex} ${token.name || token.id} 连接失败，跳过`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '批量执行',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `序号 ${tokenIndex} ${token.name || token.id} 连接失败，跳过`
          })
          failedTokens.push({
            index: tokenIndex,
            name: token.name || token.id,
            reason: '连接失败'
          })
          continue
        }
        
        // 2. 执行英雄升星
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '英雄升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `序号 ${tokenIndex} ${token.name || token.id} 开始英雄升星...`
        })
        message.info(`序号 ${tokenIndex} ${token.name || token.id} 开始英雄升星...`)
        await executeHeroUpgrade(token)
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 英雄升星完成`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '英雄升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `序号 ${tokenIndex} ${token.name || token.id} 英雄升星完成`
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 3. 执行图鉴升星
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '图鉴升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `序号 ${tokenIndex} ${token.name || token.id} 开始图鉴升星...`
        })
        message.info(`序号 ${tokenIndex} ${token.name || token.id} 开始图鉴升星...`)
        await executeBookUpgrade(token)
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 图鉴升星完成`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '图鉴升星',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `序号 ${tokenIndex} ${token.name || token.id} 图鉴升星完成`
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 4. 执行领取图鉴奖励
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '领取图鉴奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `序号 ${tokenIndex} ${token.name || token.id} 开始领取图鉴奖励...`
        })
        message.info(`序号 ${tokenIndex} ${token.name || token.id} 开始领取图鉴奖励...`)
        await executeClaimBookReward(token)
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 图鉴奖励领取完成`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '领取图鉴奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `序号 ${tokenIndex} ${token.name || token.id} 图鉴奖励领取完成`
        })
        
        if (i < sortedTargetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Token 序号 ${tokenIndex} ${token.name || token.id} 批量升星失败:`, error)
        message.error(`序号 ${tokenIndex} ${token.name || token.id}: 批量升星失败`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '批量执行',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `序号 ${tokenIndex} ${token.name || token.id} 批量升星失败: ${error.message || '未知错误'}`
        })
        failedTokens.push({
          index: tokenIndex,
          name: token.name || token.id,
          reason: error.message || '批量升星失败'
        })
      }
    }
    
    // 批量执行完成，生成失败报告
    const successCount = sortedTargetTokens.length - failedTokens.length
    const failCount = failedTokens.length
    
    message.success(`批量升星操作完成，成功: ${successCount}个，失败: ${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '批量执行',
      status: 'success',
      message: `批量升星操作完成，成功: ${successCount}个，失败: ${failCount}个`
    })
    
    // 如果有失败的token，生成txt文档
    if (failedTokens.length > 0) {
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/[/:]/g, '-')
      
      const content = [
        `批量升星失败报告 - ${timestamp}`,
        `================================`,
        `总Token数: ${sortedTargetTokens.length}`,
        `成功: ${successCount}个`,
        `失败: ${failCount}个`,
        ``,
        `失败列表:`,
        ...failedTokens.map(t => `  [序号${t.index}] ${t.name} - ${t.reason}`),
        ``,
        `================================`
      ].join('\n')
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `升星失败报告_${timestamp}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.info(`已生成失败报告: 升星失败报告_${timestamp}.txt`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '批量执行',
        status: 'info',
        message: `已生成失败报告: 升星失败报告_${timestamp}.txt`
      })
    }
  } catch (error) {
    console.error('批量升星操作失败:', error)
    message.error('批量升星操作失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '批量执行',
      status: 'error',
      message: `批量升星操作失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchRunning.value = false
  }
}

// 批量爬塔
const handleBatchTower = async () => {
  const tokens = sortedTokens.value // 使用排序后的token列表
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(batchTokens.value)
  const targetTokens = getTargetTokens(tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示和排序，与页面显示序号一致）
  const getTokenIndex = (token) => {
    const index = tokens.findIndex(t => t.id === token.id)
    return index + 1 // 序号从1开始，与页面显示序号一致
  }
  
  // 按照token在sortedTokens中的序号排序（与页面显示顺序一致）
  const sortedTargetTokens = targetTokens
    .map(token => ({ token, index: getTokenIndex(token) }))
    .sort((a, b) => a.index - b.index)
    .map(item => item.token)
  
  // 记录失败的token列表
  const failedTokens = []
  
  try {
    isBatchTowerRunning.value = true
    const rangeText = tokenIndices === null ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量爬塔操作（${rangeText}），共${sortedTargetTokens.length}个Token，按序号顺序执行...`)
    
    // 添加开始日志
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '批量爬塔',
      status: 'info',
      message: `开始批量爬塔操作（${rangeText}），共${sortedTargetTokens.length}个Token`
    })
    
    for (let i = 0; i < sortedTargetTokens.length; i++) {
      // 检查是否被停止
      if (!isBatchTowerRunning.value) {
        message.info('批量爬塔已停止')
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '批量爬塔',
          status: 'info',
          message: '批量爬塔已停止'
        })
        break
      }
      
      const token = sortedTargetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      // 添加进度日志
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '批量爬塔',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `正在处理 ${i + 1}/${sortedTargetTokens.length}: 序号 ${tokenIndex} ${token.name || token.id}`
      })
      
      try {
        // 1. 连接 Token（模拟点击 token 昵称，最多重试 5 次）
        const connected = await connectTokenWithRetry(token, tokenIndex)
        if (!connected) {
          message.warning(`序号 ${tokenIndex} ${token.name || token.id} 连接失败，跳过`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '批量爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `序号 ${tokenIndex} ${token.name || token.id} 连接失败，跳过`
          })
          failedTokens.push({
            index: tokenIndex,
            name: token.name || token.id,
            reason: '连接失败'
          })
          continue
        }
        
        // 2. 执行爬塔操作（模拟点击开始爬塔按钮）
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '开始爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `序号 ${tokenIndex} ${token.name || token.id} 开始爬塔...`
        })
        message.info(`序号 ${tokenIndex} ${token.name || token.id} 开始爬塔...`)
        
        // 执行爬塔操作
        const climbResult = await startTowerClimbForToken(token)
        
        // 如果返回 false，说明 WebSocket 未连接，停止批量爬塔
        if (climbResult === false) {
          message.warning(`序号 ${tokenIndex} ${token.name || token.id} WebSocket 未连接，停止批量爬塔`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '批量爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `序号 ${tokenIndex} ${token.name || token.id} WebSocket 未连接，停止批量爬塔`
          })
          failedTokens.push({
            index: tokenIndex,
            name: token.name || token.id,
            reason: 'WebSocket 未连接'
          })
          // 停止整个批量爬塔
          break
        }
        
        message.success(`序号 ${tokenIndex} ${token.name || token.id} 爬塔完成`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '开始爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、爬塔完成`
        })
        
        // 清空该 Token 的爬塔过程日志，只保留最终完成日志
        logStore.clearLogsByToken(token.id, '开始爬塔')
        
        // 在每个 token 之间添加 500ms 间隔
        if (i < sortedTargetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        const errorMsg = error.message || ''
        
        // WebSocket 连接失败，停止批量爬塔
        if (error.isWebSocketError || errorMsg.includes('WebSocket') || errorMsg.includes('未连接')) {
          console.error(`Token 序号 ${tokenIndex} ${token.name || token.id} WebSocket 连接失败:`, error)
          message.warning(`序号 ${tokenIndex} ${token.name || token.id} WebSocket 未连接，停止批量爬塔`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '批量爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `序号 ${tokenIndex} ${token.name || token.id} WebSocket 未连接，停止批量爬塔`
          })
          failedTokens.push({
            index: tokenIndex,
            name: token.name || token.id,
            reason: 'WebSocket 未连接'
          })
          // 停止整个批量爬塔
          break
        }
        
        // 其他错误，记录后继续
        console.error(`Token 序号 ${tokenIndex} ${token.name || token.id} 批量爬塔失败:`, error)
        message.error(`序号 ${tokenIndex} ${token.name || token.id}: 批量爬塔失败`)
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '批量爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `序号 ${tokenIndex} ${token.name || token.id} 批量爬塔失败: ${error.message || '未知错误'}`
        })
        failedTokens.push({
          index: tokenIndex,
          name: token.name || token.id,
          reason: error.message || '批量爬塔失败'
        })
      }
    }
    
    // 批量执行完成，生成失败报告
    const successCount = sortedTargetTokens.length - failedTokens.length
    const failCount = failedTokens.length
    
    // 筛选出 WebSocket 未连接的 token
    const websocketFailedTokens = failedTokens.filter(t => 
      t.reason && (t.reason.includes('WebSocket') || t.reason.includes('未连接'))
    )
    
    message.success(`批量爬塔操作完成，成功：${successCount}个，失败：${failCount}个`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '批量爬塔',
      status: 'success',
      message: `批量爬塔操作完成，成功：${successCount}个，失败：${failCount}个`
    })
    
    // 如果有 WebSocket 未连接的 token，单独列出
    if (websocketFailedTokens.length > 0) {
      message.warning(`WebSocket 未连接的 Token 共 ${websocketFailedTokens.length} 个，请手动补充爬塔`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '批量爬塔',
        status: 'warning',
        message: `WebSocket 未连接的 Token 列表（共${websocketFailedTokens.length}个，请手动补充爬塔）：${websocketFailedTokens.map(t => `[序号${t.index}] ${t.name}`).join('、')}`
      })
    }
    
    // 如果有失败的 token，生成 txt 文档
    if (failedTokens.length > 0) {
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/[/:]/g, '-')
      
      const content = [
        `批量爬塔失败报告 - ${timestamp}`,
        `================================`,
        `总 Token 数：${sortedTargetTokens.length}`,
        `成功：${successCount}个`,
        `失败：${failCount}个`,
        ``,
        `失败列表:`,
        ...failedTokens.map(t => `  [序号${t.index}] ${t.name} - ${t.reason}`),
        ``,
        `================================`,
        ``,
        `WebSocket 未连接的 Token（需手动补充爬塔）:`,
        ...(websocketFailedTokens.length > 0 
          ? websocketFailedTokens.map(t => `  [序号${t.index}] ${t.name}`)
          : ['  无']),
        ``,
        `================================`
      ].join('\n')
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `爬塔失败报告_${timestamp}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.info(`已生成失败报告: 爬塔失败报告_${timestamp}.txt`)
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '批量爬塔',
        status: 'info',
        message: `已生成失败报告: 爬塔失败报告_${timestamp}.txt`
      })
    }
  } catch (error) {
    console.error('批量爬塔操作失败:', error)
    message.error('批量爬塔操作失败')
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '批量爬塔',
      status: 'error',
      message: `批量爬塔操作失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchTowerRunning.value = false
  }
}

// 为单个 token 执行爬塔操作（新逻辑）
const startTowerClimbForToken = async (token) => {
  const tokenIndex = getTokenIndex(token)
  
  try {
    // 检查 WebSocket 连接状态
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      console.warn(`[爬塔] Token: ${token.name || token.id} WebSocket 未连接，跳过`)
      message.warning(`序号 ${tokenIndex} ${token.name || token.id} WebSocket 未连接，跳过`)
      return false
    }
    
    // 步骤 1：使用 role_getroleinfo 获取当前层数和鱼干数
    const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
    if (!roleInfo || !roleInfo.role) {
      throw new Error('角色信息不存在')
    }
    
    const tower = roleInfo.role.tower
    if (!tower) {
      throw new Error('爬塔信息不存在')
    }
    
    const towerId = tower.id
    const energy = tower.energy || 0
    let currentFloor = Math.floor(towerId / 10)  // 使用 let 以便后续更新
    
    // 在 console 显示获取的层数
    console.log(`[爬塔] Token: ${token.name || token.id}, 当前层数：${currentFloor}层${towerId % 10}小层 (towerId: ${towerId}), 鱼干数：${energy}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'info',
      message: `${tokenIndex}、${token.name || token.id}、当前层数：${currentFloor}层${towerId % 10}小层，鱼干数：${energy}`
    })
    message.info(`${token.name || token.id} 当前层数：${currentFloor}层${towerId % 10}小层，鱼干数：${energy}`)
    
    // 步骤 2：判断是否为 xx0 层
    const isX0Floor = (towerId % 10 === 0)
    
    if (isX0Floor) {
      // 是 xx0 层，先执行 tower_claimreward，参数 { rewardId: currentFloor }
      logStore.addLog({
        page: 'fish-helper',
        cardType: '爬塔升星',
        operation: '领取塔奖励',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `${tokenIndex}、${token.name || token.id}、当前是 xx0 层，执行领取第${currentFloor}章奖励`
      })
      message.info(`${token.name || token.id} 当前是 xx0 层，执行领取第${currentFloor}章奖励`)
      
      try {
        await tokenStore.sendMessageWithPromise(token.id, 'tower_claimreward', { rewardId: currentFloor }, 10000)
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '领取塔奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、成功领取第${currentFloor}章通关奖励`
        })
        message.success(`${token.name || token.id} 成功领取第${currentFloor}章通关奖励`)
        
        // 领取成功后更新 currentFloor
        currentFloor = currentFloor + 1
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '领取塔奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、更新当前层数为：${currentFloor}`
        })
      } catch (claimError) {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '领取塔奖励',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: `${tokenIndex}、${token.name || token.id}、领取第${currentFloor}章奖励失败：${claimError.message}`
        })
      }
    }
    
    // 步骤 3：循环执行 fight_starttower，最多 600 次
    let climbCount = 0
    const maxClimb = 600
    
    while (climbCount < maxClimb) {
      // 检查是否被停止（批量爬塔时）
      if (isBatchTowerRunning.value === false && climbCount > 0) {
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '开始爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'info',
          message: `${tokenIndex}、${token.name || token.id}、批量爬塔已停止，当前爬塔次数：${climbCount}`
        })
        message.info(`${token.name || token.id} 批量爬塔已停止`)
        break
      }
      
      try {
        // 执行爬塔命令
        await tokenStore.sendMessageWithPromise(token.id, 'fight_starttower', {}, 10000)
        climbCount++
        
        // 计算当前层数
        const currentClimbFloor = currentFloor + climbCount
        
        logStore.addLog({
          page: 'fish-helper',
          cardType: '爬塔升星',
          operation: '开始爬塔',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `${tokenIndex}、${token.name || token.id}、第${climbCount}次爬塔成功，当前层数：${currentClimbFloor}层`
        })
        message.success(`${token.name || token.id} 第${climbCount}次爬塔成功，当前层数：${currentClimbFloor}层`)
        
        // 每次爬塔后等待 1000ms，避免操作过快
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        const errorMsg = error.message || ''
        
        // 包含"操作过快"或"未知错误" → 等待 5 分钟后继续
        if (errorMsg.includes('操作过快') || (errorMsg.includes('未知错误') && errorMsg.includes('400340'))) {
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '开始爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、操作过快 (400340)，等待 5 分钟后继续`
          })
          message.warning(`${token.name || token.id} 操作过快 (400340)，等待 5 分钟后继续`)
          
          // 等待 5 分钟 (300000ms)
          await new Promise(resolve => setTimeout(resolve, 300000))
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '开始爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${tokenIndex}、${token.name || token.id}、等待完成，继续爬塔`
          })
          message.info(`${token.name || token.id} 等待完成，继续爬塔`)
          continue
        }
        
        // 包含"奖励/未领取" → 执行 tower_claimreward({ rewardId: currentFloor+1 }) → continue
        if (errorMsg.includes('奖励') || errorMsg.includes('未领取')) {
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '领取塔奖励',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${tokenIndex}、${token.name || token.id}、检测到当前层数奖励未领取，执行领取`
          })
          message.info(`${token.name || token.id} 检测到当前层数奖励未领取，执行领取`)
          
          // 尝试领取奖励，从 currentFloor + 1 开始
          let rewardClaimed = false
          for (let rId = currentFloor + 1; rId <= currentFloor + 5; rId++) {
            try {
              await tokenStore.sendMessageWithPromise(token.id, 'tower_claimreward', { rewardId: rId }, 10000)
              
              // 领取奖励后等待 1000ms，避免操作过快
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '爬塔升星',
                operation: '领取塔奖励',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、成功领取第${rId}章通关奖励`
              })
              message.success(`${token.name || token.id} 成功领取第${rId}章通关奖励`)
              rewardClaimed = true
              
              // 领取成功后更新 currentFloor
              currentFloor = rId
              logStore.addLog({
                page: 'fish-helper',
                cardType: '爬塔升星',
                operation: '领取塔奖励',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${tokenIndex}、${token.name || token.id}、更新当前层数为：${currentFloor}`
              })
              
              break
              
            } catch (claimError) {
              // 如果领取失败（已领取或其他错误），继续尝试下一个
              logStore.addLog({
                page: 'fish-helper',
                cardType: '爬塔升星',
                operation: '领取塔奖励',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `${tokenIndex}、${token.name || token.id}、第${rId}章奖励领取失败，继续尝试：${claimError.message}`
              })
              
              // 领取失败后也等待 1000ms，避免操作过快
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
          
          if (rewardClaimed) {
            // 领取成功后继续爬塔
            continue
          } else {
            // 所有奖励都领取失败，继续爬塔
            logStore.addLog({
              page: 'fish-helper',
              cardType: '爬塔升星',
              operation: '领取塔奖励',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `${tokenIndex}、${token.name || token.id}、无法领取奖励，继续爬塔`
            })
            continue
          }
        } else if (errorMsg.includes('能量不足')) {
          // 包含"能量不足" → break 停止
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '开始爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `${tokenIndex}、${token.name || token.id}、错误提示能量不足，停止爬塔`
          })
          message.warning(`${token.name || token.id} 错误提示能量不足，停止爬塔`)
          break
        } else if (error.isWebSocketError || errorMsg.includes('WebSocket') || errorMsg.includes('未连接')) {
          // WebSocket 未连接 → break 停止，不再重试
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '开始爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、WebSocket 未连接，停止爬塔，不再重试`
          })
          message.warning(`${token.name || token.id} WebSocket 未连接，停止爬塔`)
          // 抛出错误，让上层捕获并停止批量爬塔
          error.isWebSocketError = true
          throw error
        } else {
          // 其他错误 → 等待后继续执行
          logStore.addLog({
            page: 'fish-helper',
            cardType: '爬塔升星',
            operation: '开始爬塔',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `${tokenIndex}、${token.name || token.id}、爬塔失败：${errorMsg}，等待 1 秒后继续执行`
          })
          
          // 等待 1000ms 后继续，避免操作过快
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    // 计算最终层数
    const finalFloor = currentFloor + climbCount
    
    message.success(`${token.name || token.id} 爬塔完成，共执行${climbCount}次，当前层数：${finalFloor}层`)
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${tokenIndex}、${token.name || token.id}、爬塔完成，共执行${climbCount}次，当前层数：${finalFloor}层`
    })
    
  } catch (error) {
    console.error('爬塔失败:', error)
    
    // 标记 WebSocket 错误
    const errorMsg = error.message || ''
    if (error.isWebSocketError || errorMsg.includes('WebSocket') || errorMsg.includes('未连接') || errorMsg.includes('连接')) {
      error.isWebSocketError = true
    }
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '爬塔升星',
      operation: '开始爬塔',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `${tokenIndex}、${token.name || token.id}、爬塔失败：${error.message}`
    })
    message.error(`${token.name || token.id} 爬塔失败：${error.message}`)
  }
}

</script>

<style scoped>
.tower-star-upgrade-content {
  width: 100%;
}

.tower-info-section {
  margin-bottom: 1rem;
}

.tower-actions-section,
.star-upgrade-actions-section {
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
