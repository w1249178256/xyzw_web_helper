<template>
  <div class="status-card daily-task">
    <div class="card-header">
      <img src="/icons/174023274867420.png" alt="每日任务" class="status-icon">
      <div class="status-info">
        <h3>每日任务</h3>
        <p>当前进度</p>
      </div>
      <div class="header-right">
        <div class="status-badge" :class="{ completed: isFull }" @click="showTaskDetails = true">
          <div class="status-dot" :class="{ completed: isFull }" />
          <span>任务详情</span>
        </div>

        <button class="settings-gear" @click="showSettings = true" title="任务设置">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.240.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 卡片内容区域（自适应填充高度，居中展示） -->
    <div class="card-content">
      <!-- 进度条 -->
      <div class="progress-container">
        <n-progress type="line" :percentage="dailyPoint" :height="8" :border-radius="4" :color="progressColor"
          rail-color="#f3f4f6" />
      </div>

      <!-- 提示信息 -->
      <div class="info-container">
        右上角小齿轮有惊喜
      </div>
    </div>

    <!-- 一键执行按钮 -->
    <div class="card-actions">
      <button class="action-button" :disabled="busy || !isConnected" @click="runDailyFix">
        <span v-if="busy" class="loading-text">
          <svg class="loading-icon" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z" />
          </svg>
          执行中...
        </span>
        <span v-else-if="!isConnected">WebSocket未连接</span>
        <span v-else>一键补差</span>
      </button>
    </div>

    <!-- 任务设置模态框 -->
    <n-modal v-model:show="showSettings" preset="card" title="任务设置" style="width: 400px">
      <template #header>
        <div class="modal-header">
          <n-icon>
            <Settings />
          </n-icon>
          <span>任务设置</span>
        </div>
      </template>

      <div class="settings-content">
        <div class="settings-grid">
          <!-- 竞技场设置 -->
          <div class="setting-item">
            <label class="setting-label">竞技场阵容</label>
            <n-select v-model:value="settings.arenaFormation" :options="formationOptions" size="small" />
          </div>

          <!-- BOSS设置 -->
          <div class="setting-item">
            <label class="setting-label">BOSS阵容</label>
            <n-select v-model:value="settings.bossFormation" :options="formationOptions" size="small" />
          </div>

          <!-- BOSS次数 -->
          <div class="setting-item">
            <label class="setting-label">BOSS次数</label>
            <n-select v-model:value="settings.bossTimes" :options="bossTimesOptions" size="small" />
          </div>

          <!-- 功能开关 -->
          <div class="setting-switches">
            <div class="switch-row">
              <span class="switch-label">领罐子</span>
              <n-switch v-model:value="settings.claimBottle" />
            </div>

            <div class="switch-row">
              <span class="switch-label">领挂机</span>
              <n-switch v-model:value="settings.claimHangUp" />
            </div>

            <div class="switch-row">
              <span class="switch-label">竞技场</span>
              <n-switch v-model:value="settings.arenaEnable" />
            </div>

            <div class="switch-row">
              <span class="switch-label">开宝箱</span>
              <n-switch v-model:value="settings.openBox" />
            </div>

            <div class="switch-row">
              <span class="switch-label">领取邮件奖励</span>
              <n-switch v-model:value="settings.claimEmail" />
            </div>
            <div class="switch-row">
              <span class="switch-label">黑市购买物品</span>
              <n-switch v-model:value="settings.blackMarketPurchase" />
            </div>

            <div class="switch-row">
              <span class="switch-label">付费招募</span>
              <n-switch v-model:value="settings.payRecruit" />
            </div>
          </div>
        </div>
      </div>
    </n-modal>

    <!-- 任务详情模态框 -->
    <n-modal v-model:show="showTaskDetails" preset="card" title="每日任务详情" style="width: 400px">
      <template #header>
        <div class="modal-header">
          <n-icon>
            <Calendar />
          </n-icon>
          <span>每日任务详情</span>
          <button class="refresh-button" :disabled="busy" @click="handleRefreshTaskStatus">
            <n-icon>
              <Refresh />
            </n-icon>
            刷新状态
          </button>
        </div>
      </template>

      <div class="task-list">
        <div v-for="task in tasks" :key="task.id" class="task-item">
          <div class="task-item-left">
            <n-icon class="task-status-icon" :class="{ completed: task.completed }">
              <CheckmarkCircle v-if="task.completed" />
              <EllipseOutline v-else />
            </n-icon>
            <span class="task-name">{{ task.name }}</span>
          </div>
          <n-tag :type="task.completed ? 'success' : 'default'" size="small">
            {{ task.completed ? '已完成' : '未完成' }}
          </n-tag>
        </div>
      </div>
    </n-modal>

    <!-- 执行日志模态框 -->
    <n-modal v-model:show="showLog" preset="card" title="任务执行日志" style="width: 500px">
      <template #header>
        <div class="modal-header">
          <n-icon>
            <DocumentText />
          </n-icon>
          <span>任务执行日志</span>
        </div>
      </template>

      <div ref="logContainer" class="log-container">
        <div v-for="logItem in logList" :key="logItem.time + logItem.message" class="log-item">
          <span class="log-time">{{ logItem.time }}</span>
          <span class="log-message" :class="{
            error: logItem.type === 'error',
            success: logItem.type === 'success',
            warning: logItem.type === 'warning'
          }">
            {{ logItem.message }}
          </span>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import {
  Settings,
  Calendar,
  CheckmarkCircle,
  EllipseOutline,
  DocumentText,
  Refresh
} from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const showSettings = ref(false)
const showTaskDetails = ref(false)
const showLog = ref(false)
const busy = ref(false)
const logContainer = ref(null)

// 任务设置
const settings = reactive({
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

// 每日任务列表
const tasks = ref([
  { id: 1, name: '登录一次游戏', completed: false, loading: false },
  { id: 2, name: '分享一次游戏', completed: false, loading: false },
  { id: 3, name: '赠送好友3次金币', completed: false, loading: false },
  { id: 4, name: '进行2次招募', completed: false, loading: false },
  { id: 5, name: '领取5次挂机奖励', completed: false, loading: false },
  { id: 6, name: '进行3次点金', completed: false, loading: false },
  { id: 7, name: '开启3次宝箱', completed: false, loading: false },
  { id: 12, name: '黑市购买1次物品（请设置采购清单）', completed: false, loading: false },
  { id: 13, name: '进行1场竞技场战斗', completed: false, loading: false },
  { id: 14, name: '收获1个任意盐罐', completed: false, loading: false }
])

// 选项配置
const formationOptions = [1, 2, 3, 4].map(v => ({ label: `阵容${v}`, value: v }))
const bossTimesOptions = [0, 1, 2, 3, 4].map(v => ({ label: `${v}次`, value: v }))

// 计算属性
const roleInfo = computed(() => {
  return tokenStore.selectedTokenRoleInfo
})

const roleDailyPoint = computed(() => {
  return roleInfo.value?.role?.dailyTask?.dailyPoint ?? 0
})

const dailyPoint = computed(() => Math.min(roleDailyPoint.value, 100))
const isFull = computed(() => dailyPoint.value >= 100)
const progressColor = computed(() => isFull.value ? '#10b981' : '#3b82f6')

// WebSocket连接状态
const isConnected = computed(() => {
  if (!tokenStore.selectedToken) return false
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
  return status === 'connected'
})

// 日志系统
const logList = ref([])
const LOG_MAX = 500

const log = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  logList.value.push({ time, message, type })

  if (logList.value.length > LOG_MAX) {
    logList.value.splice(0, logList.value.length - LOG_MAX)
  }

  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// 同步服务器任务完成状态
const syncCompleteFromServer = (resp) => {
  if (!resp?.role?.dailyTask?.complete) {
    log('角色信息中无任务完成数据', 'warning')
    return
  }

  const complete = resp.role.dailyTask.complete
  const isDone = (v) => v === -1

  log('开始同步任务完成状态...')
  log(`服务器返回的任务完成数据: ${JSON.stringify(complete)}`)

  let syncedCount = 0
  let completedCount = 0

  // 先重置所有任务为未完成，然后根据服务器数据更新
  tasks.value.forEach(task => {
    task.completed = false
  })

  // 同步服务器返回的完成状态
  Object.keys(complete).forEach(k => {
    const id = Number(k)
    const idx = tasks.value.findIndex(t => t.id === id)

    if (idx >= 0) {
      const isCompleted = isDone(complete[k])
      tasks.value[idx].completed = isCompleted
      syncedCount++

      if (isCompleted) {
        completedCount++
      }

      log(`任务${id} "${tasks.value[idx].name}": ${isCompleted ? '已完成' : '未完成'}`,
        isCompleted ? 'success' : 'info')
    } else {
      log(`服务器返回未知任务ID: ${id} (完成值: ${complete[k]})`, 'warning')
    }
  })



  log(`任务状态同步完成: ${completedCount}/${syncedCount} 已完成`)
  log(`当前进度: ${roleDailyPoint.value}/100`)
}

// 刷新角色信息
const refreshRoleInfo = async () => {
  if (!tokenStore.selectedToken) {
    throw new Error('没有选中的Token')
  }

  const tokenId = tokenStore.selectedToken.id
  log('正在获取角色信息...')

  try {
    const response = await tokenStore.sendGetRoleInfo(tokenId)
    log('角色信息获取成功', 'success')

    // 同步任务状态
    if (response) {
      syncCompleteFromServer(response)
    }

    return response
  } catch (error) {
    log(`获取角色信息失败: ${error.message}`, 'error')
    throw error
  }
}

// 执行单个游戏指令的封装
const executeGameCommand = async (tokenId, cmd, params = {}, description = '', timeout = 8000) => {
  try {
    if (description) log(`执行: ${description}`)

    const result = await tokenStore.sendMessageWithPromise(tokenId, cmd, params, timeout)
    // 让指令等待一点时间
    await new Promise(resolve => setTimeout(resolve, 500))
    if (description) log(`${description} - 成功`, 'success')
    return result
  } catch (error) {
    if (description) log(`${description} - 失败: ${error.message}`, 'error')
    throw error
  }
}

const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0]

  if (candidate?.roleId) return candidate.roleId
  if (candidate?.id) return candidate.id
  return targets?.roleId || targets?.id
}

// 检查是否今日可用（简化版本）
const isTodayAvailable = (statisticsTime) => {
  if (!statisticsTime) return true

  // 如果有时间戳，检查是否为今天
  const today = new Date().toDateString()
  const recordDate = new Date(statisticsTime).toDateString()

  return today !== recordDate
}

// 获取今日BOSS ID
const getTodayBossId = () => {
  const DAY_BOSS_MAP = [9904, 9905, 9901, 9902, 9903, 9904, 9905] // 周日~周六
  const dayOfWeek = new Date().getDay()
  return DAY_BOSS_MAP[dayOfWeek]
}

// 智能阵容切换辅助函数
const switchToFormationIfNeeded = async (tokenId, targetFormation, formationName, logFn) => {
  try {
    // 首先尝试从本地缓存获取当前阵容信息
    const cachedTeamInfo = tokenStore.gameData?.presetTeam?.presetTeamInfo
    let currentFormation = cachedTeamInfo?.useTeamId

    if (currentFormation) {
      logFn(`从缓存获取当前阵容: ${currentFormation}`)
    } else {
      // 缓存中没有数据，从服务器获取
      logFn(`缓存中无阵容信息，从服务器获取...`)
      const teamInfo = await executeGameCommand(tokenId, 'presetteam_getinfo', {}, '获取阵容信息')
      currentFormation = teamInfo?.presetTeamInfo?.useTeamId
      logFn(`从服务器获取当前阵容: ${currentFormation}`)
    }

    if (currentFormation === targetFormation) {
      logFn(`当前已是${formationName}${targetFormation}，无需切换`, 'success')
      return false // 不需要切换
    }

    logFn(`当前阵容: ${currentFormation}, 目标阵容: ${targetFormation}，开始切换...`)
    await executeGameCommand(tokenId, 'presetteam_saveteam',
      { teamId: targetFormation }, `切换到${formationName}${targetFormation}`)

    logFn(`成功切换到${formationName}${targetFormation}`, 'success')
    return true // 已切换
  } catch (error) {
    logFn(`阵容检查失败，直接切换: ${error.message}`, 'warning')
    // 如果检查失败，还是执行切换操作
    try {
      await executeGameCommand(tokenId, 'presetteam_saveteam',
        { teamId: targetFormation }, `强制切换到${formationName}${targetFormation}`)
      return true
    } catch (fallbackError) {
      logFn(`强制切换也失败: ${fallbackError.message}`, 'error')
      throw fallbackError
    }
  }
}

// 每日任务执行器
const executeDailyTasks = async (roleInfoResp, logFn, progressFn) => {
  const tokenId = tokenStore.selectedToken.id
  const roleData = roleInfoResp?.role

  if (!roleData) {
    throw new Error('角色数据不存在')
  }

  logFn('开始执行每日任务补差')

  // 检查已完成的任务
  const completedTasks = roleData.dailyTask?.complete ?? {}
  const isTaskCompleted = (taskId) => completedTasks[taskId] === -1

  // 统计数据
  const statistics = roleData.statistics ?? {}
  const statisticsTime = roleData.statisticsTime ?? {}

  // 构建任务列表
  const taskList = []

  // 1. 基础任务（根据完成状态决定是否执行）

  // 分享游戏 (任务ID: 2)
  if (!isTaskCompleted(2)) {
    taskList.push({
      name: '分享一次游戏',
      execute: () => executeGameCommand(tokenId, 'system_mysharecallback',
        { isSkipShareCard: true, type: 2 }, '分享游戏')
    })
  }

  // 赠送好友金币 (任务ID: 3)
  if (!isTaskCompleted(3)) {
    taskList.push({
      name: '赠送好友金币',
      execute: () => executeGameCommand(tokenId, 'friend_batch', {}, '赠送好友金币')
    })
  }

  // 招募 (任务ID: 4)
  if (!isTaskCompleted(4)) {
    taskList.push({
      name: '免费招募',
      execute: () => executeGameCommand(tokenId, 'hero_recruit',
        { recruitType: 3, recruitNumber: 1 }, '免费招募')
    })

    if (settings.payRecruit) {
      taskList.push({
        name: '付费招募',
        execute: () => executeGameCommand(tokenId, 'hero_recruit',
          { recruitType: 1, recruitNumber: 1 }, '付费招募')
      })
    }
  }

  // 点金 (任务ID: 6)
  if (!isTaskCompleted(6) && isTodayAvailable(statisticsTime['buy:gold'])) {
    for (let i = 0; i < 3; i++) {
      taskList.push({
        name: `免费点金 ${i + 1}/3`,
        execute: () => executeGameCommand(tokenId, 'system_buygold',
          { buyNum: 1 }, `免费点金 ${i + 1}`)
      })
    }
  }

  // 挂机奖励 (任务ID: 5)
  if (!isTaskCompleted(5) && settings.claimHangUp) {
    // 先加钟4次
    for (let i = 0; i < 4; i++) {
      taskList.push({
        name: `挂机加钟 ${i + 1}/4`,
        execute: () => executeGameCommand(tokenId, 'system_mysharecallback',
          { isSkipShareCard: true, type: 2 }, `挂机加钟 ${i + 1}`)
      })
    }

    // 然后领取奖励
    taskList.push({
      name: '领取挂机奖励',
      execute: () => executeGameCommand(tokenId, 'system_claimhangupreward', {}, '领取挂机奖励')
    })

    // 最后再加1次钟
    taskList.push({
      name: '挂机加钟 5/5',
      execute: () => executeGameCommand(tokenId, 'system_mysharecallback',
        { isSkipShareCard: true, type: 2 }, '挂机加钟 5')
    })
  }

  // 开宝箱 (任务ID: 7)
  if (!isTaskCompleted(7) && settings.openBox) {
    taskList.push({
      name: '开启木质宝箱',
      execute: () => executeGameCommand(tokenId, 'item_openbox',
        { itemId: 2001, number: 10 }, '开启木质宝箱10个')
    })
  }

  // 盐罐 (任务ID: 14)
  if (!isTaskCompleted(14) && settings.claimBottle) {
    taskList.push({
      name: '领取盐罐奖励',
      execute: () => executeGameCommand(tokenId, 'bottlehelper_claim', {}, '领取盐罐奖励')
    })
  }

  // 2. 竞技场 (任务ID: 13)
  if (!isTaskCompleted(13) && settings.arenaEnable) {
    taskList.push({
      name: '竞技场战斗',
      execute: async () => {
        logFn('开始竞技场战斗流程')

        if (new Date().getHours() < 8) {
          logFn('当前时间未到8点，跳过竞技场战斗', 'warning')
          return
        }

        if (new Date().getHours() > 22) {
          logFn('当前时间已过22点，跳过竞技场战斗', 'warning')
          return
        }

        // 智能切换到竞技场阵容
        await switchToFormationIfNeeded(tokenId, settings.arenaFormation, '竞技场阵容', logFn)

        // 开始竞技场
        await executeGameCommand(tokenId, 'arena_startarea', {}, '开始竞技场')

        // 进行3场战斗
        for (let i = 1; i <= 3; i++) {
          logFn(`竞技场战斗 ${i}/3`)

          // 获取目标
          let targets
          try {
            targets = await executeGameCommand(tokenId, 'arena_getareatarget',
              {}, `获取竞技场目标${i}`)
          } catch (err) {
            logFn(`竞技场战斗${i} - 获取对手失败: ${err.message}`, 'error')
            break
          }

          const targetId = pickArenaTargetId(targets)
          if (targetId) {
            await executeGameCommand(tokenId, 'fight_startareaarena',
              { targetId }, `竞技场战斗${i}`, 10000)
          } else {
            logFn(`竞技场战斗${i} - 未找到目标`, 'warning')
          }

          // 战斗间隔
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    })
  }

  // 3. 俱乐部BOSS战斗
  if (settings.bossTimes > 0) {
    // 军团BOSS
    let alreadyLegionBoss = statistics['legion:boss'] ?? 0

    // 如果上次挑战时间不是今天，说明今天还没打过，视为0次
    if (isTodayAvailable(statisticsTime['legion:boss'])) {
      alreadyLegionBoss = 0
    }

    const remainingLegionBoss = Math.max(settings.bossTimes - alreadyLegionBoss, 0)

    if (remainingLegionBoss > 0) {
      // 为军团BOSS智能切换阵容
      taskList.push({
        name: '军团BOSS阵容检查',
        execute: () => switchToFormationIfNeeded(tokenId, settings.bossFormation, 'BOSS阵容', logFn)
      })

      for (let i = 0; i < remainingLegionBoss; i++) {
        taskList.push({
          name: `军团BOSS ${i + 1}/${remainingLegionBoss}`,
          execute: () => executeGameCommand(tokenId, 'fight_startlegionboss', {}, `军团BOSS ${i + 1}`, 12000)
        })
      }
    }
  }

  // 日常BOSS
  const todayBossId = getTodayBossId()
  // 为每日BOSS切换阵容
  taskList.push({
    name: '每日BOSS阵容检查',
    execute: () => switchToFormationIfNeeded(tokenId, settings.bossFormation, 'BOSS阵容', logFn)
  })
  for (let i = 0; i < 3; i++) {
    taskList.push({
      name: `每日BOSS ${i + 1}/3`,
      execute: () => executeGameCommand(tokenId, 'fight_startboss',
        { bossId: todayBossId }, `每日BOSS ${i + 1}`, 12000)
    })
  }

  // 4. 固定奖励领取
  const fixedRewards = [
    { name: '福利签到', cmd: 'system_signinreward' },
    { name: '俱乐部', cmd: 'legion_signin' },
    { name: '领取每日礼包', cmd: 'discount_claimreward' },
    { name: '领取每日免费奖励', cmd: 'collection_claimfreereward' },
    { name: '领取免费礼包', cmd: 'card_claimreward' },
    { name: '领取永久卡礼包', cmd: 'card_claimreward', params: { cardId: 4003 } }
  ]

  if (settings.claimEmail) {
    fixedRewards.push({ name: '领取邮件奖励', cmd: 'mail_claimallattachment' })
  }

  fixedRewards.forEach(reward => {
    taskList.push({
      name: reward.name,
      execute: () => executeGameCommand(tokenId, reward.cmd, reward.params || {}, reward.name)
    })
  })

  // 珍宝阁免费礼包
  taskList.push(
    {
      name: '开始领取珍宝阁礼包',
      execute: () => executeGameCommand(tokenId, 'collection_goodslist', {}, '开始领取珍宝阁礼包')
    }
  )
  taskList.push(
    {
      name: '领取珍宝阁免费礼包',
      execute: () => executeGameCommand(tokenId, 'collection_claimfreereward', {}, '领取珍宝阁免费礼包')
    }
  )

  // 5. 免费活动
  // 免费钓鱼
  if (isTodayAvailable(statisticsTime['artifact:normal:lottery:time'])) {
    for (let i = 0; i < 3; i++) {
      taskList.push({
        name: `免费钓鱼 ${i + 1}/3`,
        execute: () => executeGameCommand(tokenId, 'artifact_lottery',
          { lotteryNumber: 1, newFree: true, type: 1 }, `免费钓鱼 ${i + 1}`)
      })
    }
  }

  // 灯神免费扫荡
  const kingdoms = ['魏国', '蜀国', '吴国', '群雄']
  for (let gid = 1; gid <= 4; gid++) {
    if (isTodayAvailable(statisticsTime[`genie:daily:free:${gid}`])) {
      taskList.push({
        name: `${kingdoms[gid - 1]}灯神免费扫荡`,
        execute: () => executeGameCommand(tokenId, 'genie_sweep',
          { genieId: gid }, `${kingdoms[gid - 1]}灯神免费扫荡`)
      })
    }
  }

  // 灯神免费扫荡卷
  for (let i = 0; i < 3; i++) {
    taskList.push({
      name: `领取免费扫荡卷 ${i + 1}/3`,
      execute: () => executeGameCommand(tokenId, 'genie_buysweep', {}, `领取免费扫荡卷 ${i + 1}`)
    })
  }

  // 6. 黑市购买任务 (任务ID: 12)
  if (!isTaskCompleted(12) && settings.blackMarketPurchase) {
    taskList.push({
      name: '黑市购买1次物品',
      execute: () => executeGameCommand(tokenId, 'store_purchase', { goodsId: 1 }, '黑市购买1次物品')
    })
  }

  // 咸王梦境领取
  const mengyandayOfWeek = new Date().getDay()
  if (mengyandayOfWeek === 0 | mengyandayOfWeek === 1 | mengyandayOfWeek === 3 | mengyandayOfWeek === 4) {
    const mjbattleTeam = { "0": 107 }
    taskList.push({
      name: '咸王梦境',
      execute: () => executeGameCommand(tokenId, 'dungeon_selecthero', { battleTeam: mjbattleTeam }, '咸王梦境')
    })
  }

  // 深海灯神领取
  if (mengyandayOfWeek === 1 && isTodayAvailable(statisticsTime[`genie:daily:free:5`])) {
    taskList.push({
      name: '深海灯神',
      execute: () => executeGameCommand(tokenId, 'genie_sweep', { genieId: 5, sweepCnt: 1 }, '深海灯神')
    })
  }

  // 7. 任务奖励领取
  for (let taskId = 1; taskId <= 10; taskId++) {
    taskList.push({
      name: `领取任务奖励${taskId}`,
      execute: () => executeGameCommand(tokenId, 'task_claimdailypoint',
        { taskId }, `领取任务奖励${taskId}`, 5000)
    })
  }

  // 日常和周常奖励
  taskList.push(
    {
      name: '领取日常任务奖励',
      execute: () => executeGameCommand(tokenId, 'task_claimdailyreward', {}, '领取日常任务奖励')
    },
    {
      name: '领取周常任务奖励',
      execute: () => executeGameCommand(tokenId, 'task_claimweekreward', {}, '领取周常任务奖励')
    }
  )

  // 执行任务列表
  const totalTasks = taskList.length
  logFn(`共有 ${totalTasks} 个任务待执行`)

  for (let i = 0; i < taskList.length; i++) {
    const task = taskList[i]

    try {
      await task.execute()

      // 更新进度
      const progress = Math.floor(((i + 1) / totalTasks) * 100)
      if (progressFn) progressFn(tokenId, progress)

      // 任务间隔
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      logFn(`任务执行失败: ${task.name} - ${error.message}`, 'error')
      // 继续执行下一个任务
    }
  }

  // 确保进度为100%
  if (progressFn) progressFn(tokenId, 100)
  logFn('所有任务执行完成', 'success')

  // 最后刷新一次角色信息
  await new Promise(resolve => setTimeout(resolve, 2000))
  await refreshRoleInfo()
}

// 一键补差主函数
const runDailyFix = async () => {
  if (!tokenStore.selectedToken || busy.value) {
    message.warning('没有选中Token或正在执行中')
    return
  }

  if (!isConnected.value) {
    message.error('WebSocket连接未建立，请检查连接状态')
    return
  }

  busy.value = true
  showLog.value = true
  logList.value = []

  try {
    log('=== 开始执行一键补差任务 ===')


    // 1. 获取角色信息
    const roleInfo = await refreshRoleInfo()

    if (!roleInfo?.role) {
      throw new Error('获取角色信息失败或数据异常')
    }


    log(`当前每日任务进度: ${roleInfo.role.dailyTask?.dailyPoint || 0}/100`)

    // 2. 执行任务
    log('第二步: 开始执行每日任务...')
    await executeDailyTasks(roleInfo, log, (tokenId, progress) => {
      log(`任务进度: ${progress}%`)
    })

    log('=== 任务执行完成 ===', 'success')
    message.success('每日任务补差执行完成')

    // 3. 最终刷新角色信息
    setTimeout(async () => {
      try {
        await refreshRoleInfo()
        log('最终角色信息刷新完成', 'success')
      } catch (error) {
        log(`最终刷新失败: ${error.message}`, 'warning')
      }
    }, 3000)

  } catch (error) {
    log(`任务执行失败: ${error.message}`, 'error')
    console.error('详细错误信息:', error)
    message.error(`任务执行失败: ${error.message}`)
  } finally {
    busy.value = false
  }
}

// 刷新任务状态
const handleRefreshTaskStatus = async () => {
  if (!isConnected.value) {
    message.warning('WebSocket未连接，无法刷新任务状态')
    return
  }

  try {
    log('手动刷新任务状态...')
    await refreshRoleInfo()
    message.success('任务状态刷新成功')
  } catch (error) {
    log(`刷新失败: ${error.message}`, 'error')
    message.error(`刷新失败: ${error.message}`)
  }
}

// 辅助函数
const getCurrentRole = () => {
  return tokenStore.selectedToken ? { roleId: tokenStore.selectedToken.id } : null
}

const loadSettings = (roleId) => {
  try {
    const raw = localStorage.getItem(`daily-settings:${roleId}`)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Failed to load settings:', error)
    return null
  }
}

const saveSettings = (roleId, s) => {
  try {
    localStorage.setItem(`daily-settings:${roleId}`, JSON.stringify(s))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// 监听设置变化
watch(settings, (cur) => {
  const role = getCurrentRole()
  if (role) saveSettings(role.roleId, cur)
}, { deep: true })

// 监听token选择变化
watch(() => tokenStore.selectedToken, async (newToken, oldToken) => {
  if (newToken && newToken !== oldToken) {
    log(`切换到Token: ${newToken.name}`)

    // 加载新token的设置
    const saved = loadSettings(newToken.id)
    if (saved) Object.assign(settings, saved)

    // 如果WebSocket已连接，尝试获取最新角色信息
    if (isConnected.value) {
      try {
        await refreshRoleInfo()
      } catch (error) {
        console.warn('切换token后获取角色信息失败:', error.message)
      }
    }
  }
}, { immediate: true })

// 监听角色信息变化，自动同步任务状态
watch(() => tokenStore.selectedTokenRoleInfo, (newRoleInfo) => {
  if (newRoleInfo?.role?.dailyTask?.complete) {
    log('角色信息更新，同步任务状态')
    syncCompleteFromServer(newRoleInfo)
  }
}, { immediate: true, deep: true })

// 生命周期
onMounted(async () => {
  log('组件初始化完成')

  // 首次拉取角色信息（如果有选中的token且已连接）
  if (tokenStore.selectedToken && isConnected.value) {
    try {
      await refreshRoleInfo()
    } catch (error) {
      console.warn('初始化时获取角色信息失败:', error.message)
    }
  }

  const role = getCurrentRole()
  if (role) {
    const saved = loadSettings(role.roleId)
    if (saved) Object.assign(settings, saved)
  }

  // 初始化时的任务状态同步会通过 watch selectedTokenRoleInfo 自动处理
})

onBeforeUnmount(() => {
  log('组件即将卸载')
})
</script>

<style scoped lang="scss">
// 使用GameStatus中的统一卡片样式
.daily-task {
  border-left: 4px solid #f0a020; // 每日任务专用颜色
  display: flex;
  flex-direction: column;
  min-height: 240px; // 继续缩小整体高度
  padding: var(--spacing-lg);
  gap: var(--spacing-md);

  .status-badge {
    &.completed {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-color);

      .status-dot {
        background: var(--success-color);
      }
    }
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.daily-task .card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; // 使进度和提示在可用空间内居中
}

.progress-container {
  margin-bottom: var(--spacing-md);
}

.info-container {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}

// 使用GameStatus中的统一按钮样式
.card-actions {
  margin-top: auto;
  padding-top: var(--spacing-sm);
}

.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: auto;
}

.settings-gear {
  width: 28px;
  height: 28px;
  padding: var(--spacing-xs);
  border: none;
  border-radius: var(--border-radius-medium);
  background: rgba(107, 114, 128, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: var(--primary-color);
    color: white;
    transform: rotate(90deg);
  }
}

.action-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--primary-color);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--primary-color-hover);
  }

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// 模态框样式
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  width: 100%;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.settings-content {
  padding: var(--spacing-sm) 0;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.setting-switches {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.switch-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.task-item-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.task-status-icon {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);

  &.completed {
    color: var(--success-color);
  }
}

.task-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.log-container {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}

.log-time {
  color: var(--text-tertiary);
  min-width: 80px;
  flex-shrink: 0;
}

.log-message {
  color: var(--text-secondary);

  &.error {
    color: var(--error-color);
  }

  &.success {
    color: var(--success-color);
  }

  &.warning {
    color: #f59e0b;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .header-right {
    justify-content: center;
  }
}
</style>
