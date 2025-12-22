<template>
  <div class="batch-daily-tasks">
    <!-- Header -->
    <div class="page-header">
      <h2>批量日常任务</h2>
      <div class="actions">
        <n-button type="primary" @click="startBatch" :disabled="isRunning || selectedTokens.length === 0">
          {{ isRunning ? '执行中...' : '开始执行' }}
        </n-button>
        <n-button @click="stopBatch" :disabled="!isRunning" type="error" style="margin-left: 12px">
          停止
        </n-button>
      </div>
    </div>

    <!-- Token Selection -->
    <n-card title="账号列表" class="token-list-card">
      <template #header-extra>
        <n-space>
          <n-button size="small" @click="claimHangUpRewards" :disabled="isRunning || selectedTokens.length === 0">
            领取挂机
          </n-button>
          <n-button size="small" @click="resetBottles" :disabled="isRunning || selectedTokens.length === 0">
            重置罐子
          </n-button>
          <n-button size="small" @click="climbTower" :disabled="isRunning || selectedTokens.length === 0">
            一键爬塔
          </n-button>
        </n-space>
      </template>
      <n-space vertical>
        <n-checkbox :checked="isAllSelected" :indeterminate="isIndeterminate" @update:checked="handleSelectAll">
          全选
        </n-checkbox>
        <n-checkbox-group v-model:value="selectedTokens">
          <n-grid :x-gap="12" :y-gap="8" :cols="2">
            <n-grid-item v-for="token in tokens" :key="token.id">
              <div class="token-row">
                <n-checkbox :value="token.id" :label="token.name" style="flex: 1">
                  <div class="token-item">
                    <span>{{ token.name }}</span>
                    <n-tag size="small" :type="getStatusType(token.id)" style="margin-left: 8px">
                      {{ getStatusText(token.id) }}
                    </n-tag>
                  </div>
                </n-checkbox>
                <n-button size="tiny" circle @click.stop="openSettings(token)">
                  <template #icon>
                    <n-icon>
                      <Settings />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </n-grid-item>
          </n-grid>
        </n-checkbox-group>
      </n-space>
    </n-card>

    <!-- Settings Modal -->
    <n-modal v-model:show="showSettingsModal" preset="card" :title="`任务设置 - ${currentSettingsTokenName}`"
      style="width: 90%; max-width: 400px">
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">竞技场阵容</label>
            <n-select v-model:value="currentSettings.arenaFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">BOSS阵容</label>
            <n-select v-model:value="currentSettings.bossFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">BOSS次数</label>
            <n-select v-model:value="currentSettings.bossTimes" :options="bossTimesOptions" size="small" />
          </div>
          <div class="setting-switches">
            <div class="switch-row"><span class="switch-label">领罐子</span><n-switch
                v-model:value="currentSettings.claimBottle" /></div>
            <div class="switch-row"><span class="switch-label">领挂机</span><n-switch
                v-model:value="currentSettings.claimHangUp" /></div>
            <div class="switch-row"><span class="switch-label">竞技场</span><n-switch
                v-model:value="currentSettings.arenaEnable" /></div>
            <div class="switch-row"><span class="switch-label">开宝箱</span><n-switch
                v-model:value="currentSettings.openBox" /></div>
            <div class="switch-row"><span class="switch-label">领取邮件奖励</span><n-switch
                v-model:value="currentSettings.claimEmail" /></div>
            <div class="switch-row"><span class="switch-label">黑市购买物品</span><n-switch
                v-model:value="currentSettings.blackMarketPurchase" /></div>
            <div class="switch-row"><span class="switch-label">付费招募</span><n-switch
                v-model:value="currentSettings.payRecruit" /></div>
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right;">
          <n-button type="primary" @click="saveSettings">保存设置</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Progress & Logs -->
    <div class="execution-area" v-if="currentRunningTokenId || logs.length > 0">
      <n-card :title="currentRunningTokenName ? `正在执行: ${currentRunningTokenName}` : '执行日志'" style="margin-top: 16px">
        <n-progress type="line" :percentage="currentProgress" :indicator-placement="'inside'" processing />
        <div class="log-container" ref="logContainer">
          <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
            <span class="time">[{{ log.time }}]</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, reactive } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { DailyTaskRunner } from '@/utils/dailyTaskRunner'
import { useMessage } from 'naive-ui'
import { Settings } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()
const runner = new DailyTaskRunner(tokenStore)

const tokens = computed(() => tokenStore.gameTokens)
const selectedTokens = ref([])
const tokenStatus = ref({}) // { tokenId: 'waiting' | 'running' | 'completed' | 'failed' }
const isRunning = ref(false)
const shouldStop = ref(false)

// Settings Modal State
const showSettingsModal = ref(false)
const currentSettingsTokenId = ref(null)
const currentSettingsTokenName = ref('')
const currentSettings = reactive({
  arenaFormation: 1,
  bossFormation: 1,
  bossTimes: 2,
  claimBottle: true,
  payRecruit: true,
  openBox: true,
  arenaEnable: true,
  claimHangUp: true,
  claimEmail: true,
  blackMarketPurchase: true
})

const formationOptions = [1, 2, 3, 4].map(v => ({ label: `阵容${v}`, value: v }))
const bossTimesOptions = [0, 1, 2, 3, 4].map(v => ({ label: `${v}次`, value: v }))

const loadSettings = (tokenId) => {
  try {
    const raw = localStorage.getItem(`daily-settings:${tokenId}`)
    const defaultSettings = {
      arenaFormation: 1,
      bossFormation: 1,
      bossTimes: 2,
      claimBottle: true,
      payRecruit: true,
      openBox: true,
      arenaEnable: true,
      claimHangUp: true,
      claimEmail: true,
      blackMarketPurchase: true
    }
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
  } catch (error) {
    console.error('Failed to load settings:', error)
    return null
  }
}

const openSettings = (token) => {
  currentSettingsTokenId.value = token.id
  currentSettingsTokenName.value = token.name
  const saved = loadSettings(token.id)
  Object.assign(currentSettings, saved)
  showSettingsModal.value = true
}

const saveSettings = () => {
  if (currentSettingsTokenId.value) {
    localStorage.setItem(`daily-settings:${currentSettingsTokenId.value}`, JSON.stringify(currentSettings))
    message.success(`已保存 ${currentSettingsTokenName.value} 的设置`)
    showSettingsModal.value = false
  }
}


const currentRunningTokenId = ref(null)
const currentProgress = ref(0)
const logs = ref([])
const logContainer = ref(null)

const currentRunningTokenName = computed(() => {
  const t = tokens.value.find(x => x.id === currentRunningTokenId.value)
  return t ? t.name : ''
})

// Selection logic
const isAllSelected = computed(() => selectedTokens.value.length === tokens.value.length && tokens.value.length > 0)
const isIndeterminate = computed(() => selectedTokens.value.length > 0 && selectedTokens.value.length < tokens.value.length)

const handleSelectAll = (checked) => {
  if (checked) {
    selectedTokens.value = tokens.value.map(t => t.id)
  } else {
    selectedTokens.value = []
  }
}

const getStatusType = (tokenId) => {
  const status = tokenStatus.value[tokenId]
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'running') return 'info'
  return 'default'
}

const getStatusText = (tokenId) => {
  const status = tokenStatus.value[tokenId]
  if (status === 'completed') return '已完成'
  if (status === 'failed') return '失败'
  if (status === 'running') return '执行中'
  return '等待中'
}

const addLog = (log) => {
  logs.value.push(log)
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const waitForConnection = async (tokenId, timeout = 10000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const status = tokenStore.getWebSocketStatus(tokenId)
    if (status === 'connected') return true
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

const resetBottles = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  // Reset status
  selectedTokens.value.forEach(id => {
    tokenStatus.value[id] = 'waiting'
  })

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break

    currentRunningTokenId.value = tokenId
    tokenStatus.value[tokenId] = 'running'
    currentProgress.value = 0

    const token = tokens.value.find(t => t.id === tokenId)

    try {
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始重置罐子: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      // Execute commands
      addLog({ time: new Date().toLocaleTimeString(), message: `停止计时...`, type: 'info' })
      await tokenStore.sendMessageWithPromise(tokenId, 'bottlehelper_stop', {}, 5000)

      await new Promise(r => setTimeout(r, 500))

      addLog({ time: new Date().toLocaleTimeString(), message: `开始计时...`, type: 'info' })
      await tokenStore.sendMessageWithPromise(tokenId, 'bottlehelper_start', {}, 5000)

      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 重置完成 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `重置失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量重置罐子结束')
}

const claimHangUpRewards = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  // Reset status
  selectedTokens.value.forEach(id => {
    tokenStatus.value[id] = 'waiting'
  })

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break

    currentRunningTokenId.value = tokenId
    tokenStatus.value[tokenId] = 'running'
    currentProgress.value = 0

    const token = tokens.value.find(t => t.id === tokenId)

    try {
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始领取挂机: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      // Execute commands
      // 1. Add time 4 times
      for (let i = 0; i < 4; i++) {
        addLog({ time: new Date().toLocaleTimeString(), message: `挂机加钟 ${i + 1}/4`, type: 'info' })
        await tokenStore.sendMessageWithPromise(tokenId, 'system_mysharecallback', { isSkipShareCard: true, type: 2 }, 5000)
        await new Promise(r => setTimeout(r, 500))
      }

      // 2. Claim reward
      addLog({ time: new Date().toLocaleTimeString(), message: `领取挂机奖励`, type: 'info' })
      await tokenStore.sendMessageWithPromise(tokenId, 'system_claimhangupreward', {}, 5000)
      await new Promise(r => setTimeout(r, 500))

      // 3. Add time 1 more time
      addLog({ time: new Date().toLocaleTimeString(), message: `挂机加钟 5/5`, type: 'info' })
      await tokenStore.sendMessageWithPromise(tokenId, 'system_mysharecallback', { isSkipShareCard: true, type: 2 }, 5000)

      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 领取完成 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `领取失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量领取挂机结束')
}

const ensureConnection = async (tokenId) => {
  // Always fetch the latest token data from the store
  const latestToken = tokens.value.find(t => t.id === tokenId)

  // 1. Check current status
  let status = tokenStore.getWebSocketStatus(tokenId)

  // 2. If not connected, try to connect
  if (status !== 'connected') {
    addLog({ time: new Date().toLocaleTimeString(), message: `正在连接...`, type: 'info' })
    tokenStore.createWebSocketConnection(tokenId, latestToken.token, latestToken.wsUrl)
    const connected = await waitForConnection(tokenId)
    if (connected) return true

    // First attempt failed
    addLog({ time: new Date().toLocaleTimeString(), message: `连接超时，尝试重连...`, type: 'warning' })
  } else {
    // Already connected...
    return true
  }

  // 3. Retry connection (Force reconnect)
  // Close existing if any
  tokenStore.closeWebSocketConnection(tokenId)
  await new Promise(r => setTimeout(r, 2000)) // Wait longer for cleanup

  addLog({ time: new Date().toLocaleTimeString(), message: `正在重连...`, type: 'info' })

  // Re-fetch token again just in case it was updated during the wait
  const refreshedToken = tokens.value.find(t => t.id === tokenId)
  tokenStore.createWebSocketConnection(tokenId, refreshedToken.token, refreshedToken.wsUrl)

  const connected = await waitForConnection(tokenId)

  if (!connected) {
    throw new Error('连接失败 (重试后仍超时)')
  }

  return true
}

const climbTower = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  // Reset status
  selectedTokens.value.forEach(id => {
    tokenStatus.value[id] = 'waiting'
  })

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break

    currentRunningTokenId.value = tokenId
    tokenStatus.value[tokenId] = 'running'
    currentProgress.value = 0

    const token = tokens.value.find(t => t.id === tokenId)

    try {
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始爬塔: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      // Initial check
      let roleInfo = await tokenStore.sendGetRoleInfo(tokenId)
      let energy = roleInfo?.role?.tower?.energy || 0
      addLog({ time: new Date().toLocaleTimeString(), message: `初始体力: ${energy}`, type: 'info' })

      let count = 0
      const MAX_CLIMB = 100
      let consecutiveFailures = 0

      while (energy > 0 && count < MAX_CLIMB) {
        if (shouldStop.value) break

        try {
          await tokenStore.sendMessageWithPromise(tokenId, 'fight_starttower', {}, 5000)
          count++
          consecutiveFailures = 0
          addLog({ time: new Date().toLocaleTimeString(), message: `爬塔第 ${count} 次`, type: 'info' })

          await new Promise(r => setTimeout(r, 1500))

          // Refresh energy
          roleInfo = await tokenStore.sendGetRoleInfo(tokenId)
          energy = roleInfo?.role?.tower?.energy || 0
        } catch (err) {
          // Check for specific error code indicating no energy/attempts left
          if (err.message && err.message.includes('200400')) {
            addLog({ time: new Date().toLocaleTimeString(), message: `爬塔次数已用完 (200400)`, type: 'info' })
            break
          }

          consecutiveFailures++
          addLog({ time: new Date().toLocaleTimeString(), message: `战斗出错: ${err.message} (重试 ${consecutiveFailures}/3)`, type: 'warning' })

          if (consecutiveFailures >= 3) {
            addLog({ time: new Date().toLocaleTimeString(), message: `连续失败次数过多，停止爬塔`, type: 'error' })
            break
          }

          await new Promise(r => setTimeout(r, 2000))

          // 尝试刷新体力，防止因体力不足导致的错误死循环
          try {
            roleInfo = await tokenStore.sendGetRoleInfo(tokenId)
            energy = roleInfo?.role?.tower?.energy || 0
          } catch (e) {
            // 忽略刷新失败
          }
        }
      }

      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 爬塔结束，共 ${count} 次 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `爬塔失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量爬塔结束')
}

const startBatch = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  // Reset status
  selectedTokens.value.forEach(id => {
    tokenStatus.value[id] = 'waiting'
  })

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break

    currentRunningTokenId.value = tokenId
    tokenStatus.value[tokenId] = 'running'
    currentProgress.value = 0

    let retryCount = 0
    const MAX_RETRIES = 1
    let success = false

    while (retryCount <= MAX_RETRIES && !success) {
      const token = tokens.value.find(t => t.id === tokenId)

      try {
        if (retryCount === 0) {
          addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始执行: ${token.name} ===`, type: 'info' })
        } else {
          addLog({ time: new Date().toLocaleTimeString(), message: `=== 尝试重试: ${token.name} (第${retryCount}次) ===`, type: 'info' })
        }

        await ensureConnection(tokenId)

        // Run tasks
        await runner.run(tokenId, {
          onLog: (log) => addLog(log),
          onProgress: (p) => { currentProgress.value = p }
        })

        success = true
        tokenStatus.value[tokenId] = 'completed'
        addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 执行完成 ===`, type: 'success' })

      } catch (error) {
        console.error(error)
        if (retryCount < MAX_RETRIES) {
          addLog({ time: new Date().toLocaleTimeString(), message: `执行出错: ${error.message}，等待3秒后重试...`, type: 'warning' })
          // Wait for potential token refresh in store
          await new Promise(r => setTimeout(r, 3000))
          retryCount++
        } else {
          tokenStatus.value[tokenId] = 'failed'
          addLog({ time: new Date().toLocaleTimeString(), message: `执行失败: ${error.message}`, type: 'error' })
        }
      }
    }

    // Optional: Disconnect if it wasn't connected before? 
    // For now, keep it connected or let the store manage it.
    // Maybe wait a bit before next
    await new Promise(r => setTimeout(r, 1000))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量任务执行结束')
}

const stopBatch = () => {
  shouldStop.value = true
  addLog({ time: new Date().toLocaleTimeString(), message: '正在停止...', type: 'warning' })
}
</script>

<style scoped>
.batch-daily-tasks {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.token-item {
  display: flex;
  align-items: center;
}

.execution-area {
  margin-top: 20px;
}

.log-container {
  height: 300px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  font-family: monospace;
}

.log-item {
  margin-bottom: 4px;
  font-size: 12px;
}

.log-item.error {
  color: #d03050;
}

.log-item.success {
  color: #18a058;
}

.log-item.warning {
  color: #f0a020;
}

.log-item.info {
  color: #333;
}

.time {
  color: #999;
  margin-right: 8px;
}

.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

/* Settings Modal Styles */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: #666;
}

.setting-switches {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.switch-row:last-child {
  border-bottom: none;
}

.switch-label {
  font-size: 14px;
  color: #666;
}
</style>
