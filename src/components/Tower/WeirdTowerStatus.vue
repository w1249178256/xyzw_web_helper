<template>
  <div class="status-card tower-status weird-tower">
    <div class="card-header">
      <img src="/icons/1733492491706152.png" alt="怪异塔图标" class="status-icon">
      <div class="status-info">
        <h3>怪异塔</h3>
        <p>一个不小心就过了</p>
      </div>
      <div class="energy-display">
        <img src="/icons/xiaoyugan.png" alt="小鱼干" class="energy-icon">
        <span class="energy-count">{{ towerEnergy }}</span>
      </div>
    </div>

    <div class="card-content">
      <div class="tower-floor">
        <span class="label">当前层数</span>
        <span class="floor-number">{{ displayFloor }}</span>
      </div>
    </div>

    <div class="card-actions">
      <button :class="[
        'climb-button',
        {
          'active': canClimb,
          'disabled': !canClimb
        }
      ]" :disabled="!canClimb" @click="startTowerClimb">
        {{ isClimbing.value ? '爬塔中...' : '开始爬塔' }}
      </button>

      <!-- 停止批量爬塔按钮，仅批量时显示 -->
      <button class="stop-button" @click="stopClimbing">
        停止爬塔
      </button>
    </div>
  </div>
</template>

<script setup>
// 停止批量爬塔操作
let stopFlag = false

const stopClimbing = () => {
  stopFlag = true
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }
  isClimbing.value = false
  message.info('已手动停止批量爬塔')
}
import { computed, onMounted, ref, watch } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const isClimbing = ref(false)
const climbTimeout = ref(null) // 用于超时重置状态
const lastClimbResult = ref(null) // 最后一次爬塔结果

// 计算属性 - 从gameData中获取塔相关信息
const roleInfo = computed(() => {
  const data = tokenStore.gameData?.roleInfo || null
  return data
})

const weirdTowerData = computed(() => {
  return roleInfo.value?.role?.evoTower || null
})

const currentTowerId = computed(() => {
  return weirdTowerData.value?.towerId || 0
})

const displayFloor = computed(() => {
  const towerId = currentTowerId.value
  
  if (towerId === 0) {
    return "1-1"
  } else {
    // 计算章节和层数
    // 每章10层，0-9为第1章，10-19为第2章，20-29为第3章，以此类推
    const chapter = Math.floor(towerId / 10) + 1
    const floor = (towerId % 10) + 1
    return `${chapter}-${floor}`
  }
})

const towerEnergy = computed(() => {
  return weirdTowerData.value?.energy || 0
})

const canClimb = computed(() => {
  const hasEnergy = towerEnergy.value > 0
  const notClimbing = !isClimbing.value
  return hasEnergy && notClimbing
})

// 方法
const startTowerClimb = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }

  if (!canClimb.value) {
    message.warning('体力不足或正在爬塔中')
    return
  }

  // 清除之前的超时
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }

  isClimbing.value = true
  stopFlag = false
  let climbCount = 0
  let maxClimb = 100 // 最多批量次数，防止死循环
  // 设置超时保护，60秒后自动重置状态
  climbTimeout.value = setTimeout(() => {
    isClimbing.value = false
    climbTimeout.value = null
    stopFlag = true
    message.info('批量爬塔已超时自动停止')
  }, 60000)

  try {
    const tokenId = tokenStore.selectedToken.id
    for (let i = 0; i < maxClimb; i++) {
      if (stopFlag) break
      
      // 检查当前能量
      await getTowerInfo()
      const currentEnergy = towerEnergy.value
      if (currentEnergy <= 0) break
      
      // 准备战斗
      await tokenStore.sendMessageWithPromise(tokenId, 'evotower_readyfight', {}, 5000)
      
      // 执行战斗
      const fightResult = await tokenStore.sendMessageWithPromise(tokenId, 'evotower_fight', {
        "battleNum": 1,
        "winNum": 1
      }, 10000)
      
      climbCount++
      message.success(`第${climbCount}次爬塔命令已发送`)
      
      // 更新爬塔信息
      await getTowerInfo()
      
      // 检查是否刚通关10层（即当前层是1-1, 2-1, 3-1等）
      const towerId = currentTowerId.value
      const floor = (towerId % 10) + 1
      if (fightResult && fightResult._rawData && fightResult._rawData.winList && fightResult._rawData.winList[0] === true && floor === 1) {
        // 领取通关奖励
        await tokenStore.sendMessageWithPromise(tokenId, 'evotower_claimreward', {}, 5000)
        message.success(`成功领取第${Math.floor(towerId / 10)}章通关奖励！`)
      }
      
      await new Promise(res => setTimeout(res, 400)) // 每次间隔400毫秒
    }
    message.success(`已自动爬塔${climbCount}次，体力已耗尽或达到上限。`)
  } catch (error) {
    message.error('批量爬塔失败: ' + (error.message || '未知错误'))
  }

  // 清除超时并重置状态
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }
  isClimbing.value = false
}

const getTowerInfo = async () => {
  if (!tokenStore.selectedToken) { return }

  try {
    const tokenId = tokenStore.selectedToken.id
    // 检查WebSocket连接状态
    const wsStatus = tokenStore.getWebSocketStatus(tokenId)

    if (wsStatus !== 'connected') {
      return
    }
    // 获取怪异塔信息
    await tokenStore.sendMessageWithPromise(tokenId, 'evotower_getinfo', {}, 5000)
    // 更新角色信息
    await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
  } catch (error) {
    // 获取塔信息失败：静默，避免噪声
  }
}

// 监听WebSocket连接状态变化
const wsStatus = computed(() => {
  if (!tokenStore.selectedToken) return 'disconnected'
  return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
})

// 监听WebSocket连接状态，连接成功后自动获取塔信息
watch(wsStatus, (newStatus, oldStatus) => {
  if (newStatus === 'connected' && oldStatus !== 'connected') {
    // 延迟一点时间让WebSocket完全就绪
    setTimeout(() => {
      getTowerInfo()
    }, 1000)
  }
})

// 监听选中Token变化
watch(() => tokenStore.selectedToken, (newToken, oldToken) => {
  if (newToken && newToken.id !== oldToken?.id) {
    // 检查WebSocket是否已连接
    const status = tokenStore.getWebSocketStatus(newToken.id)
    if (status === 'connected') {
      getTowerInfo()
    }
  }
})

// 生命周期
onMounted(() => {
  // 检查WebSocket客户端
  if (tokenStore.selectedToken) {
    const client = tokenStore.getWebSocketClient(tokenStore.selectedToken.id)
  }

  // 组件挂载时获取塔信息
  if (tokenStore.selectedToken && wsStatus.value === 'connected') {
    getTowerInfo()
  }
})
</script>

<style scoped lang="scss">
.stop-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: #fff;
  color: #e11d48;

  &:hover {
    background: #e11d48;
    color: white;
    border-color: #e11d48;
  }
}

// 使用GameStatus中的统一卡片样式
.weird-tower {
  border-left: 4px solid #8b5cf6; // 怪异塔专用颜色
  display: flex;
  flex-direction: column;
  min-height: 240px; // 继续缩小整体高度
  padding: var(--spacing-lg);
}

.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.energy-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--bg-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-medium);
  margin-left: auto; // 使小鱼干展示靠右
}

.energy-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.energy-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.card-content {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  flex: 1; // 占据可用空间，使上下分布更均衡
  display: flex;
  align-items: center; // 内容在中部更居中
}

.tower-floor {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .floor-number {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: auto;
  padding-top: var(--spacing-sm);
}


.climb-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &.active {
    background: #8b5cf6;
    color: white;

    &:hover {
      background: #7c3aed;
    }
  }

  &.disabled {
    background: var(--bg-secondary);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .energy-display {
    align-self: center;
  }
}
</style>