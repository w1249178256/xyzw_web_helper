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
      <n-space style="margin-bottom: 12px">
        <n-button size="small" @click="claimHangUpRewards" :disabled="isRunning || selectedTokens.length === 0">
          领取挂机
        </n-button>
        <n-button size="small" @click="batchAddHangUpTime" :disabled="isRunning || selectedTokens.length === 0">
          一键加钟
        </n-button>
        <n-button size="small" @click="resetBottles" :disabled="isRunning || selectedTokens.length === 0">
          重置罐子
        </n-button>
        <n-button size="small" @click="batchlingguanzi" :disabled="isRunning || selectedTokens.length === 0">
          一键领取罐子
        </n-button>
        <n-button size="small" @click="climbTower" :disabled="isRunning || selectedTokens.length === 0">
          一键爬塔
        </n-button>
        <n-button size="small" @click="batchStudy" :disabled="isRunning || selectedTokens.length === 0">
          一键答题
        </n-button>
        <n-button size="small" @click="batchSmartSendCar"
          :disabled="isRunning || selectedTokens.length === 0 || !isCarActivityOpen">
          智能发车
        </n-button>
        <n-button size="small" @click="batchClaimCars"
          :disabled="isRunning || selectedTokens.length === 0 || !isCarActivityOpen">
          一键收车
        </n-button>
        <n-button size="small" @click="openHelperModal('box')" :disabled="isRunning || selectedTokens.length === 0">
          批量开箱
        </n-button>
        <n-button size="small" @click="batchClaimBoxPointReward" :disabled="isRunning || selectedTokens.length === 0">
          领取宝箱积分
        </n-button>
        <n-button size="small" @click="openHelperModal('fish')" :disabled="isRunning || selectedTokens.length === 0">
          批量钓鱼
        </n-button>
        <n-button size="small" @click="openHelperModal('recruit')" :disabled="isRunning || selectedTokens.length === 0">
          批量招募
        </n-button>
        <n-button size="small" @click="batchbaoku13" :disabled="isRunning || selectedTokens.length === 0 || !isbaokuActivityOpen">
          一键宝库前3层
        </n-button>
        <n-button size="small" @click="batchbaoku45" :disabled="isRunning || selectedTokens.length === 0 || !isbaokuActivityOpen">
          一键宝库4,5层
        </n-button>
        <n-button size="small" @click="batchmengjing" :disabled="isRunning || selectedTokens.length === 0 || !ismengjingActivityOpen">
          一键梦境
        </n-button>
        <n-button size="small" @click="batchclubsign" :disabled="isRunning || selectedTokens.length === 0">
          一键俱乐部签到
        </n-button>
        <n-button size="small" @click="batcharenafight" :disabled="isRunning || selectedTokens.length === 0 || !isarenaActivityOpen">
          一键竞技场战斗3次
        </n-button>
      </n-space>
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

    <!-- Helper Modal (开箱/钓鱼/招募) -->
    <n-modal v-model:show="showHelperModal" preset="card" :title="helperModalTitle"
      style="width: 90%; max-width: 400px">
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item" v-if="helperType === 'box'">
            <label class="setting-label">宝箱类型</label>
            <n-select v-model:value="helperSettings.boxType" :options="boxTypeOptions" size="small" />
          </div>
          <div class="setting-item" v-if="helperType === 'fish'">
            <label class="setting-label">鱼竿类型</label>
            <n-select v-model:value="helperSettings.fishType" :options="fishTypeOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">消耗数量（10的倍数）</label>
            <n-input-number v-model:value="helperSettings.count" :min="10" :max="10000" :step="10" size="small" />
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right;">
          <n-button @click="showHelperModal = false" style="margin-right: 12px">取消</n-button>
          <n-button type="primary" @click="executeHelper">开始执行</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Scheduled Tasks -->
    <n-card title="定时任务" class="scheduled-tasks-card" style="margin-top: 16px">
      <n-space style="margin-bottom: 12px">
        <n-button type="primary" size="small" @click="openTaskModal">
          新增定时任务
        </n-button>
        <n-button size="small" @click="showTasksModal = true">
          查看定时任务
        </n-button>
      </n-space>
      
      <!-- 简单的任务统计 -->
      <div class="tasks-count" v-if="scheduledTasks.length > 0">
        <p>已保存 {{ scheduledTasks.length }} 个定时任务</p>
      </div>
      <div class="tasks-count" v-else>
        <p>暂无定时任务</p>
      </div>
    </n-card>

    <!-- Tasks List Modal -->
    <n-modal v-model:show="showTasksModal" preset="card" title="定时任务列表" style="width: 90%; max-width: 800px">
      <div class="tasks-list" style="max-height: 600px; overflow-y: auto;">
        <div v-for="task in scheduledTasks" :key="task.id" class="task-item" style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: bold;">{{ task.name }}</div>
            <n-switch v-model:value="task.enabled" @update:value="toggleTaskEnabled(task.id, $event)">
            </n-switch>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #6b7280;">运行类型：</span>
            <span>{{ task.runType === 'daily' ? '每天固定时间' : 'Cron表达式' }}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #6b7280;">运行时间：</span>
            <span>{{ task.runType === 'daily' ? task.runTime : task.cronExpression }}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #6b7280;">选中账号：</span>
            <span>{{ task.selectedTokens.length }} 个</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #6b7280;">选中任务：</span>
            <span>{{ task.selectedTasks.length }} 个</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <n-button size="tiny" @click="editTask(task)">
              编辑
            </n-button>
            <n-button size="tiny" type="error" @click="deleteTask(task.id)">
              删除
            </n-button>
          </div>
        </div>
        <div v-if="scheduledTasks.length === 0" style="text-align: center; padding: 24px; color: #6b7280;">
          暂无定时任务
        </div>
      </div>
    </n-modal>

    <!-- Task Modal -->
    <n-modal v-model:show="showTaskModal" preset="card" :title="editingTask ? '编辑定时任务' : '新增定时任务'" style="width: 90%; max-width: 600px">
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">任务名称</label>
            <n-input v-model:value="taskForm.name" placeholder="请输入任务名称" />
          </div>
          <div class="setting-item">
            <label class="setting-label">运行类型</label>
            <n-radio-group v-model:value="taskForm.runType" @update:value="resetRunType">
              <n-radio value="daily">每天固定时间</n-radio>
              <n-radio value="cron">Cron表达式</n-radio>
            </n-radio-group>
          </div>
          <div class="setting-item" v-if="taskForm.runType === 'daily'">
            <label class="setting-label">运行时间</label>
            <n-time-picker v-model:value="taskForm.runTime" format="HH:mm" />
          </div>
          <div class="setting-item" v-if="taskForm.runType === 'cron'">
            <label class="setting-label">Cron表达式</label>
            <n-input v-model:value="taskForm.cronExpression" placeholder="请输入Cron表达式" />
          </div>
          <div class="setting-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label class="setting-label">选择账号</label>
              <n-space size="small">
                <n-button size="small" @click="selectAllTokens">
                  全选
                </n-button>
                <n-button size="small" @click="deselectAllTokens">
                  全不选
                </n-button>
              </n-space>
            </div>
            <n-checkbox-group v-model:value="taskForm.selectedTokens">
              <n-grid :cols="2" :x-gap="12" :y-gap="8">
                <n-grid-item v-for="token in tokens" :key="token.id">
                  <n-checkbox :value="token.id">{{ token.name }}</n-checkbox>
                </n-grid-item>
              </n-grid>
            </n-checkbox-group>
          </div>
          <div class="setting-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label class="setting-label">选择任务</label>
              <n-space size="small">
                <n-button size="small" @click="selectAllTasks">
                  全选
                </n-button>
                <n-button size="small" @click="deselectAllTasks">
                  全不选
                </n-button>
              </n-space>
            </div>
            <n-checkbox-group v-model:value="taskForm.selectedTasks">
              <n-grid :cols="2" :x-gap="12" :y-gap="8">
                <n-grid-item v-for="task in availableTasks" :key="task.value">
                  <n-checkbox :value="task.value">{{ task.label }}</n-checkbox>
                </n-grid-item>
              </n-grid>
            </n-checkbox-group>
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right;">
          <n-button @click="showTaskModal = false" style="margin-right: 12px">取消</n-button>
          <n-button type="primary" @click="saveTask">保存</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Progress & Logs -->
    <div class="execution-area" v-if="currentRunningTokenId || logs.length > 0">
      <n-card :title="currentRunningTokenName ? `正在执行: ${currentRunningTokenName}` : '执行日志'" style="margin-top: 16px">
        <template #extra>
          <n-button size="small" @click="copyLogs">
            复制日志
          </n-button>
        </template>
        <n-progress type="line" :percentage="currentProgress" :indicator-placement="'inside'" processing />
        <div class="log-container" ref="logContainer">
          <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
            <span class="time">{{ log.time }}</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup>
// Import required dependencies
import { ref, computed, nextTick, reactive, watch, onMounted } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { DailyTaskRunner } from '@/utils/dailyTaskRunner'
import { preloadQuestions } from '@/utils/studyQuestionsFromJSON.js'
import { useMessage } from 'naive-ui'
import { Settings } from '@vicons/ionicons5'

// Initialize token store, message service, and task runner
const tokenStore = useTokenStore()
const message = useMessage()
const runner = new DailyTaskRunner(tokenStore)

const tokens = computed(() => tokenStore.gameTokens)
const isCarActivityOpen = computed(() => {
  const day = new Date().getDay()
  // 1=Mon, 2=Tue, 3=Wed
  return day >= 1 && day <= 3
})
const ismengjingActivityOpen = computed(() => {
  const day = new Date().getDay()
  return day === 0 || day === 1 || day === 3 || day === 4
})
const isbaokuActivityOpen = computed(() => {
  const day = new Date().getDay()
  return day != 1 && day != 2
})
const isarenaActivityOpen = computed(() => {
  const hour = new Date().getHours()
  return hour > 8 && hour < 22
})

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

// Helper Modal State
const showHelperModal = ref(false)
const helperType = ref('box') // 'box' | 'fish' | 'recruit'
const helperSettings = reactive({
  boxType: 2001,
  fishType: 1,
  count: 100
})

const helperModalTitle = computed(() => {
  const titles = { box: '批量开宝箱', fish: '批量钓鱼', recruit: '批量招募' }
  return titles[helperType.value] || '批量助手'
})

// ======================
// Scheduled Tasks Feature
// ======================

// Scheduled Tasks State Management
const scheduledTasks = ref([]) // List of all scheduled tasks
const showTaskModal = ref(false) // Control the visibility of the add/edit task modal
const showTasksModal = ref(false) // Control the visibility of the tasks list modal
const editingTask = ref(null) // Currently editing task
const taskForm = reactive({
  name: '', // Task name
  runType: 'daily', // 'daily' or 'cron'
  runTime: null, // Daily run time (HH:mm format)
  cronExpression: '', // Cron expression for complex scheduling
  selectedTokens: [], // Selected token IDs
  selectedTasks: [], // Selected task function names
  enabled: true // Whether the task is enabled
})

// Available tasks for scheduling - Maps task function names to display labels
const availableTasks = [
  { label: '领取挂机', value: 'claimHangUpRewards' },
  { label: '一键加钟', value: 'batchAddHangUpTime' },
  { label: '重置罐子', value: 'resetBottles' },
  { label: '一键领取罐子', value: 'batchlingguanzi' },
  { label: '一键爬塔', value: 'climbTower' },
  { label: '一键答题', value: 'batchStudy' },
  { label: '智能发车', value: 'batchSmartSendCar' },
  { label: '一键收车', value: 'batchClaimCars' },
  { label: '批量开箱', value: 'batchOpenBox' },
  { label: '领取宝箱积分', value: 'batchClaimBoxPointReward' },
  { label: '批量钓鱼', value: 'batchFish' },
  { label: '批量招募', value: 'batchRecruit' },
  { label: '一键宝库前3层', value: 'batchbaoku13' },
  { label: '一键宝库4,5层', value: 'batchbaoku45' },
  { label: '一键梦境', value: 'batchmengjing' },
  { label: '一键俱乐部签到', value: 'batchclubsign' },
  { label: '一键竞技场战斗3次', value: 'batcharenafight' }
]

// Task table columns configuration for the tasks list modal
const taskColumns = [
  { title: '任务名称', key: 'name', width: 150 },
  { title: '运行类型', key: 'runType', width: 100 },
  { 
    title: '运行时间', 
    key: 'runTime', 
    width: 150,
    render: (row) => {
      // Display appropriate time format based on run type
      return row.runType === 'daily' ? row.runTime : row.cronExpression
    }
  },
  { title: '选中账号', key: 'selectedTokens', width: 150, render: (row) => `${row.selectedTokens.length} 个` },
  { title: '选中任务', key: 'selectedTasks', width: 150, render: (row) => `${row.selectedTasks.length} 个` },
  { title: '状态', key: 'enabled', width: 80, render: (row) => row.enabled ? '启用' : '禁用' },
  { title: '操作', key: 'actions', width: 150 }
]

// ======================
// Scheduled Tasks Storage
// ======================

// Load scheduled tasks from localStorage
const loadScheduledTasks = () => {
  try {
    const saved = localStorage.getItem('scheduledTasks')
    console.log('Raw localStorage data:', saved)
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log('Parsed data:', parsed)
      console.log('Is array:', Array.isArray(parsed))
      // Ensure we have an array
      scheduledTasks.value = Array.isArray(parsed) ? parsed : []
      console.log('Loaded scheduled tasks:', scheduledTasks.value)
      console.log('Loaded tasks count:', scheduledTasks.value.length)
    } else {
      console.log('No saved tasks in localStorage')
      scheduledTasks.value = []
    }
  } catch (error) {
    console.error('Failed to load scheduled tasks:', error)
    scheduledTasks.value = []
  }
}

// Save scheduled tasks to localStorage
const saveScheduledTasks = () => {
  try {
    const dataToSave = JSON.stringify(scheduledTasks.value)
    console.log('Saving to localStorage:', dataToSave)
    localStorage.setItem('scheduledTasks', dataToSave)
    // Verify save was successful
    const saved = localStorage.getItem('scheduledTasks')
    console.log('Verified saved data:', saved)
    console.log('Saved scheduled tasks:', scheduledTasks.value)
    console.log('Saved tasks count:', scheduledTasks.value.length)
  } catch (error) {
    console.error('Failed to save scheduled tasks:', error)
  }
}

// Open task modal for adding new task
const openTaskModal = () => {
  editingTask.value = null
  Object.assign(taskForm, {
    name: '',
    runType: 'daily',
    runTime: null,
    cronExpression: '',
    selectedTokens: [],
    selectedTasks: [],
    enabled: true
  })
  showTaskModal.value = true
}

// Edit existing task
const editTask = (task) => {
  editingTask.value = task
  Object.assign(taskForm, { ...task })
  showTaskModal.value = true
}

// Save task (create or update)
const saveTask = () => {
  if (!taskForm.name) {
    message.warning('请输入任务名称')
    return
  }
  
  if (taskForm.runType === 'daily' && !taskForm.runTime) {
    message.warning('请选择运行时间')
    return
  }
  
  if (taskForm.runType === 'cron' && !taskForm.cronExpression) {
    message.warning('请输入Cron表达式')
    return
  }
  
  if (taskForm.selectedTokens.length === 0) {
    message.warning('请选择至少一个账号')
    return
  }
  
  if (taskForm.selectedTasks.length === 0) {
    message.warning('请选择至少一个任务')
    return
  }
  
  // Format runTime as string for storage
  let formattedRunTime = null
  if (taskForm.runType === 'daily' && taskForm.runTime) {
    const time = new Date(taskForm.runTime)
    formattedRunTime = time.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
  }
  
  const taskData = {
    id: editingTask.value?.id || 'task_' + Date.now(),
    name: taskForm.name,
    runType: taskForm.runType,
    runTime: formattedRunTime,
    cronExpression: taskForm.runType === 'cron' ? taskForm.cronExpression : '',
    selectedTokens: [...taskForm.selectedTokens],
    selectedTasks: [...taskForm.selectedTasks],
    enabled: taskForm.enabled
  }
  
  if (editingTask.value) {
    // Update existing task
    const index = scheduledTasks.value.findIndex(t => t.id === editingTask.value.id)
    if (index !== -1) {
      scheduledTasks.value[index] = taskData
    }
  } else {
    // Add new task
    scheduledTasks.value.push(taskData)
  }
  
  saveScheduledTasks()
  console.log('After saving task, scheduledTasks.length:', scheduledTasks.value.length)
  console.log('Scheduled tasks:', scheduledTasks.value)
  showTaskModal.value = false
  message.success('定时任务已保存')
}

// Delete task
const deleteTask = (taskId) => {
  scheduledTasks.value = scheduledTasks.value.filter(t => t.id !== taskId)
  saveScheduledTasks()
  message.success('定时任务已删除')
}

// Toggle task enabled state
const toggleTaskEnabled = (taskId, enabled) => {
  const task = scheduledTasks.value.find(t => t.id === taskId)
  if (task) {
    task.enabled = enabled
    saveScheduledTasks()
    message.success(`定时任务已${enabled ? '启用' : '禁用'}`)
  }
}

// Reset run type related fields
const resetRunType = () => {
  if (taskForm.runType === 'daily') {
    taskForm.cronExpression = ''
  } else {
    taskForm.runTime = null
  }
}

// Select all tokens
const selectAllTokens = () => {
  taskForm.selectedTokens = tokens.value.map(token => token.id)
}

// Deselect all tokens
const deselectAllTokens = () => {
  taskForm.selectedTokens = []
}

// Select all tasks
const selectAllTasks = () => {
  taskForm.selectedTasks = availableTasks.map(task => task.value)
}

// Deselect all tasks
const deselectAllTasks = () => {
  taskForm.selectedTasks = []
}

// ======================
// Scheduled Tasks Scheduler
// ======================

// Initialize scheduled tasks from localStorage
loadScheduledTasks()

// Watch for changes to scheduledTasks for debugging
watch(scheduledTasks, (newVal) => {
  console.log('scheduledTasks changed:', newVal.length)
  console.log('New value:', newVal)
}, { deep: true })

// Debug: Log initial state when component mounts
onMounted(() => {
  console.log('Component mounted, initial scheduledTasks:', scheduledTasks.value)
  console.log('Initial scheduledTasks length:', scheduledTasks.value.length)
})

// Task scheduler
const scheduleTaskExecution = () => {
  // Check every minute
  setInterval(() => {
    if (isRunning.value) return // Don't run if already executing tasks
    
    const now = new Date()
    const currentTime = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    
    scheduledTasks.value.forEach(task => {
      if (!task.enabled) return
      
      let shouldRun = false
      
      if (task.runType === 'daily') {
        // Check if current time matches the scheduled time
        shouldRun = currentTime === task.runTime
      } else if (task.runType === 'cron') {
        // Simple cron expression parsing (minute hour * * *)
        try {
          const [minute, hour, , ,] = task.cronExpression.split(' ').map(Number)
          shouldRun = now.getMinutes() === minute && now.getHours() === hour
        } catch (error) {
          console.error('Invalid cron expression:', task.cronExpression, error)
          return
        }
      }
      
      if (shouldRun) {
        executeScheduledTask(task)
      }
    })
  }, 60000) // Check every minute
}

// Execute a scheduled task
const executeScheduledTask = async (task) => {
  addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始执行定时任务: ${task.name} ===`, type: 'info' })
  
  try {
    // Set selected tokens from the task
    selectedTokens.value = [...task.selectedTokens]
    
    // Execute each selected task
    for (const taskName of task.selectedTasks) {
      if (shouldStop.value) break
      
      addLog({ time: new Date().toLocaleTimeString(), message: `执行任务: ${availableTasks.find(t => t.value === taskName)?.label || taskName}`, type: 'info' })
      
      // Call the task function dynamically
      const taskFunction = eval(taskName)
      if (typeof taskFunction === 'function') {
        await taskFunction()
      } else {
        addLog({ time: new Date().toLocaleTimeString(), message: `任务函数不存在: ${taskName}`, type: 'error' })
      }
    }
    
    addLog({ time: new Date().toLocaleTimeString(), message: `=== 定时任务执行完成: ${task.name} ===`, type: 'success' })
  } catch (error) {
    addLog({ time: new Date().toLocaleTimeString(), message: `定时任务执行失败: ${error.message}`, type: 'error' })
  }
}

// Start the task scheduler
scheduleTaskExecution()

const boxTypeOptions = [
  { label: '木质宝箱', value: 2001 },
  { label: '青铜宝箱', value: 2002 },
  { label: '黄金宝箱', value: 2003 },
  { label: '铂金宝箱', value: 2004 }
]

const fishTypeOptions = [
  { label: '普通鱼竿', value: 1 },
  { label: '黄金鱼竿', value: 2 }
]

const openHelperModal = (type) => {
  helperType.value = type
  showHelperModal.value = true
}

const executeHelper = () => {
  // 验证数量是10的倍数
  if (helperSettings.count % 10 !== 0 || helperSettings.count < 10) {
    message.warning('消耗数量必须是10的整数倍，最小为10')
    return
  }
  showHelperModal.value = false
  if (helperType.value === 'box') {
    batchOpenBox()
  } else if (helperType.value === 'fish') {
    batchFish()
  } else if (helperType.value === 'recruit') {
    batchRecruit()
  }
}

const formationOptions = [1, 2, 3, 4, 5, 6].map(v => ({ label: `阵容${v}`, value: v }))
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

const addLog = (log) => {
  logs.value.push(log)
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const copyLogs = () => {
  if (logs.value.length === 0) {
    message.warning('没有可复制的日志')
    return
  }
  const logText = logs.value.map(log => `${log.time} ${log.message}`).join('\n')
  navigator.clipboard.writeText(logText)
    .then(() => {
      message.success('日志已复制到剪贴板')
    })
    .catch(err => {
      message.error('复制日志失败: ' + err.message)
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

      // 1. Claim reward
      addLog({ time: new Date().toLocaleTimeString(), message: `领取挂机奖励`, type: 'info' })
      await tokenStore.sendMessageWithPromise(tokenId, 'system_claimhangupreward', {}, 5000)
      await new Promise(r => setTimeout(r, 500))

      
      // 2. Add time 4 times
      for (let i = 0; i < 4; i++) {
        addLog({ time: new Date().toLocaleTimeString(), message: `挂机加钟 ${i + 1}/4`, type: 'info' })
        await tokenStore.sendMessageWithPromise(tokenId, 'system_mysharecallback', { isSkipShareCard: true, type: 2 }, 5000)
        await new Promise(r => setTimeout(r, 500))
      }

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

const batchbaoku13 = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键宝库: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      const bosstowerinfo = await tokenStore.sendMessageWithPromise(tokenId, "bosstower_getinfo", {})
      const towerId = bosstowerinfo.bossTower.towerId
      if (towerId >= 1 && towerId <=3 )
      {
      for (let i = 0; i < 2; i++) {
        if (shouldStop.value) break
        await tokenStore.sendMessageWithPromise(tokenId, 'bosstower_startboss', {})
        await new Promise(r => setTimeout(r, 500))
      }
      for (let i = 0; i < 9; i++) {
        if (shouldStop.value) break
        await tokenStore.sendMessageWithPromise(tokenId, 'bosstower_startbox', {})
        await new Promise(r => setTimeout(r, 500))
      }
      }
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 宝库战斗已完成，请上线手动领取奖励 ===`, type: 'success' })
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `宝库战斗失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量宝库结束')
}

const batchbaoku45 = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键宝库: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      const bosstowerinfo = await tokenStore.sendMessageWithPromise(tokenId, "bosstower_getinfo", {})
      const towerId = bosstowerinfo.bossTower.towerId
      if (towerId >= 4 && towerId <=5 )
      {
      for (let i = 0; i < 2; i++) {
        if (shouldStop.value) break
        await tokenStore.sendMessageWithPromise(tokenId, 'bosstower_startboss', {})
        await new Promise(r => setTimeout(r, 500))
      }
      }
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 宝库战斗已完成 ===`, type: 'success' })
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `宝库战斗失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量宝库结束')
}

const batchmengjing = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键宝库: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      if (shouldStop.value) break
      const mjbattleTeam = { "0": 107 }
      const dayOfWeek = new Date().getDay()
      if (dayOfWeek === 0 | dayOfWeek === 1 | dayOfWeek === 3 | dayOfWeek === 4)
      {
      await tokenStore.sendMessageWithPromise(tokenId, 'dungeon_selecthero', { battleTeam: mjbattleTeam }, 5000)
      await new Promise(r => setTimeout(r, 500))
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 咸王梦境已完成 ===`, type: 'success' })
      }
      else
      {
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 当前未在开放时间 ===`, type: 'error' })
      break
      }
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `咸王梦境失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量梦境结束')
}

const batchlingguanzi = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键领取盐罐: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      if (shouldStop.value) break
      await tokenStore.sendMessageWithPromise(tokenId, 'bottlehelper_claim', {}, 5000)
      await new Promise(r => setTimeout(r, 500))
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 领取盐罐已完成 ===`, type: 'success' })
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `领取盐罐失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量领取盐罐结束')
}

const batchclubsign = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键俱乐部签到: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      if (shouldStop.value) break
      await tokenStore.sendMessageWithPromise(tokenId, 'legion_signin', {}, 5000)
      await new Promise(r => setTimeout(r, 500))
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 俱乐部签到已完成 ===`, type: 'success' })
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `俱乐部签到失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量俱乐部签到结束')
}

const batcharenafight = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键竞技场战斗: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      if (shouldStop.value) break
      for (let i = 0; i < 3; i++) {
      // 开始竞技场
      await tokenStore.sendMessageWithPromise(tokenId, "arena_startarea", {});
      let targets
      try {
      targets = await tokenStore.sendMessageWithPromise(tokenId, 'arena_getareatarget', {})
      } catch (err) {
      message.error(`获取竞技场目标失败：${err.message}`)
      break
      }        
      const targetId = pickArenaTargetId(targets)
      if (!targetId) 
      { 
      addLog({ time: new Date().toLocaleTimeString(), message: `未找到可用的竞技场目标: ${error.message || '未知错误'}`, type: 'error' })
      break
      }
      try { 
      await tokenStore.sendMessageWithPromise(tokenId, 'fight_startareaarena', {targetId})
      addLog({ time: new Date().toLocaleTimeString(), message: `${token.name} 竞技场战斗 ${i + 1}/3`, type: 'info' })
      await new Promise(r => setTimeout(r, 500))
      }
      catch (e) 
      { 
      addLog({ time: new Date().toLocaleTimeString(), message: `竞技场对决失败: ${error.message || '未知错误'}`, type: 'error' })
      }
      }
      await new Promise(r => setTimeout(r, 500))
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 竞技场战斗已完成 ===`, type: 'success' })
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `竞技场战斗失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量竞技场战斗结束')
}

const batchAddHangUpTime = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键加钟: ${token.name} ===`, type: 'info' })
      await ensureConnection(tokenId)
      for (let i = 0; i < 4; i++) {
        if (shouldStop.value) break
        addLog({ time: new Date().toLocaleTimeString(), message: `执行加钟 ${i + 1}/4`, type: 'info' })
        await tokenStore.sendMessageWithPromise(tokenId, 'system_mysharecallback', { isSkipShareCard: true, type: 2 }, 5000)
        await new Promise(r => setTimeout(r, 500))
      }
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 加钟完成 ===`, type: 'success' })
    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `加钟失败: ${error.message || '未知错误'}`, type: 'error' })
    }
    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }
  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量加钟结束')
}


const ensureConnection = async (tokenId) => {
  // Always fetch the latest token data from the store
  const latestToken = tokens.value.find(t => t.id === tokenId)

  // 1. Check current status
  let status = tokenStore.getWebSocketStatus(tokenId)
  let connected = status === 'connected'

  // 2. If not connected, try to connect
  if (!connected) {
    addLog({ time: new Date().toLocaleTimeString(), message: `正在连接...`, type: 'info' })
    tokenStore.createWebSocketConnection(tokenId, latestToken.token, latestToken.wsUrl)
    connected = await waitForConnection(tokenId)

    if (!connected) {
      // First attempt failed
      addLog({ time: new Date().toLocaleTimeString(), message: `连接超时，尝试重连...`, type: 'warning' })

      // 3. Retry connection (Force reconnect)
      tokenStore.closeWebSocketConnection(tokenId)
      await new Promise(r => setTimeout(r, 2000)) // Wait longer for cleanup

      addLog({ time: new Date().toLocaleTimeString(), message: `正在重连...`, type: 'info' })

      // Re-fetch token again just in case it was updated during the wait
      const refreshedToken = tokens.value.find(t => t.id === tokenId)
      tokenStore.createWebSocketConnection(tokenId, refreshedToken.token, refreshedToken.wsUrl)

      connected = await waitForConnection(tokenId)
    }
  }

  if (!connected) {
    throw new Error('连接失败 (重试后仍超时)')
  }

  // Initialize Game Data (Critical for Battle Version and Session)
  try {
    // Fetch Role Info first (Standard flow)
    await tokenStore.sendMessageWithPromise(tokenId, "role_getroleinfo", {}, 5000);

    // Fetch Battle Version
    const res = await tokenStore.sendMessageWithPromise(tokenId, "fight_startlevel", {}, 5000);
    if (res?.battleData?.version) {
      tokenStore.setBattleVersion(res.battleData.version);
    }
  } catch (e) {
    addLog({ time: new Date().toLocaleTimeString(), message: `初始化数据失败: ${e.message}`, type: 'warning' })
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
      // 模仿 TowerStatus.vue 的逻辑，同时请求 tower_getinfo 和 role_getroleinfo
      await tokenStore.sendMessageWithPromise(tokenId, 'tower_getinfo', {}, 5000).catch(() => { })
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

          // 增加等待时间，确保服务器数据更新
          await new Promise(r => setTimeout(r, 2000))

          // Refresh energy - 同时发送 tower_getinfo 以确保数据最新
          tokenStore.sendMessage(tokenId, 'tower_getinfo')
          roleInfo = await tokenStore.sendGetRoleInfo(tokenId)

          // 优先从 store 中获取最新的（虽然 sendGetRoleInfo 返回的也是最新的，但双重保险）
          const storeRoleInfo = tokenStore.gameData?.roleInfo
          energy = storeRoleInfo?.role?.tower?.energy ?? roleInfo?.role?.tower?.energy ?? 0

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

const batchStudy = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  // Reset status
  selectedTokens.value.forEach(id => {
    tokenStatus.value[id] = 'waiting'
  })

  // Preload questions
  addLog({ time: new Date().toLocaleTimeString(), message: `正在加载题库...`, type: 'info' })
  await preloadQuestions()

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break

    currentRunningTokenId.value = tokenId
    tokenStatus.value[tokenId] = 'running'
    currentProgress.value = 0

    const token = tokens.value.find(t => t.id === tokenId)

    try {
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始答题: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      // Reset local study status
      tokenStore.gameData.studyStatus = {
        isAnswering: false,
        questionCount: 0,
        answeredCount: 0,
        status: '',
        timestamp: null
      }

      // Send start command
      await tokenStore.sendMessageWithPromise(tokenId, 'study_startgame', {}, 5000)

      // Wait for completion
      let maxWait = 90 // 90 seconds timeout
      let completed = false
      let lastStatus = ''

      while (maxWait > 0) {
        if (shouldStop.value) break

        const status = tokenStore.gameData.studyStatus

        if (status.status !== lastStatus) {
          lastStatus = status.status
          if (status.status === 'answering') {
            addLog({ time: new Date().toLocaleTimeString(), message: `开始答题...`, type: 'info' })
          } else if (status.status === 'claiming_rewards') {
            addLog({ time: new Date().toLocaleTimeString(), message: `正在领取奖励...`, type: 'info' })
          }
        }

        if (status.status === 'answering' && status.questionCount > 0) {
          // Update progress log occasionally or just rely on final success
          // addLog({ time: new Date().toLocaleTimeString(), message: `进度: ${status.answeredCount}/${status.questionCount}`, type: 'info' })
        }

        if (status.status === 'completed') {
          completed = true
          break
        }

        await new Promise(r => setTimeout(r, 1000))
        maxWait--
      }

      if (completed) {
        tokenStatus.value[tokenId] = 'completed'
        addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 答题完成 ===`, type: 'success' })
      } else {
        if (shouldStop.value) {
          addLog({ time: new Date().toLocaleTimeString(), message: `已停止`, type: 'warning' })
        } else {
          tokenStatus.value[tokenId] = 'failed'
          addLog({ time: new Date().toLocaleTimeString(), message: `答题超时或未开始`, type: 'error' })
        }
      }

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `答题失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量答题结束')
}

// --- Car Helper Functions ---
const normalizeCars = (raw) => {
  const r = raw || {}
  const body = r.body || r
  const roleCar = body.roleCar || body.rolecar || {}

  // 优先从 roleCar.carDataMap 解析（id -> info）
  const carMap = roleCar.carDataMap || roleCar.cardatamap
  if (carMap && typeof carMap === 'object') {
    return Object.entries(carMap).map(([id, info], idx) => ({ key: idx, id, ...(info || {}) }))
  }

  // 兜底
  let arr = body.cars || body.list || body.data || body.carList || body.vehicles || []
  if (!Array.isArray(arr) && typeof arr === 'object' && arr !== null) arr = Object.values(arr)
  if (Array.isArray(body) && arr.length === 0) arr = body
  return (Array.isArray(arr) ? arr : []).map((it, idx) => ({ key: idx, ...it }))
}

const gradeLabel = (color) => {
  const map = { 1: '绿·普通', 2: '蓝·稀有', 3: '紫·史诗', 4: '橙·传说', 5: '红·神话', 6: '金·传奇' }
  return map[color] || '未知'
}

const isBigPrize = (rewards) => {
  const bigPrizes = [
    { type: 3, itemId: 3201, value: 10 },
    { type: 3, itemId: 1001, value: 10 },
    { type: 3, itemId: 1022, value: 2000 },
    { type: 2, itemId: 0, value: 2000 },
    { type: 3, itemId: 1023, value: 5 },
    { type: 3, itemId: 1022, value: 2500 },
    { type: 3, itemId: 1001, value: 12 }
  ]
  if (!Array.isArray(rewards)) return false
  return bigPrizes.some(p => rewards.find(r => r.type === p.type && r.itemId === p.itemId && Number(r.value || 0) >= p.value))
}

const countRacingRefreshTickets = (rewards) => {
  if (!Array.isArray(rewards)) return 0
  return rewards.reduce((acc, r) => acc + ((r.type === 3 && r.itemId === 35002) ? Number(r.value || 0) : 0), 0)
}

const shouldSendCar = (car, tickets) => {
  const color = Number(car?.color || 0)
  const rewards = Array.isArray(car?.rewards) ? car.rewards : []
  const racingTickets = countRacingRefreshTickets(rewards)
  if (tickets >= 6) {
    return color >= 5 || racingTickets >= 4 || isBigPrize(rewards)
  }
  return color >= 4 || racingTickets >= 2 || isBigPrize(rewards)
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const canClaim = (car) => {
  const t = Number(car?.sendAt || 0)
  if (!t) return false
  const tsMs = t < 1e12 ? t * 1000 : t
  return Date.now() - tsMs >= FOUR_HOURS_MS
}

const batchSmartSendCar = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始智能发车: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      // 1. Fetch Car Info
      addLog({ time: new Date().toLocaleTimeString(), message: `获取车辆信息...`, type: 'info' })
      const res = await tokenStore.sendMessageWithPromise(tokenId, 'car_getrolecar', {}, 10000)
      let carList = normalizeCars(res?.body ?? res)

      // 2. Fetch Tickets
      let refreshTickets = 0
      try {
        const roleRes = await tokenStore.sendMessageWithPromise(tokenId, 'role_getroleinfo', {}, 10000)
        const qty = roleRes?.role?.items?.[35002]?.quantity
        refreshTickets = Number(qty || 0)
        addLog({ time: new Date().toLocaleTimeString(), message: `剩余车票: ${refreshTickets}`, type: 'info' })
      } catch (_) { }

      // 3. Process Cars
      for (const car of carList) {
        if (shouldStop.value) break

        if (Number(car.sendAt || 0) !== 0) continue // Already sent

        // Check if we should send immediately
        if (shouldSendCar(car, refreshTickets)) {
          addLog({ time: new Date().toLocaleTimeString(), message: `车辆[${gradeLabel(car.color)}]满足条件，直接发车`, type: 'info' })
          await tokenStore.sendMessageWithPromise(tokenId, 'car_send', {
            carId: String(car.id),
            helperId: 0,
            text: '',
            isUpgrade: false
          }, 10000)
          await new Promise(r => setTimeout(r, 500))
          continue
        }

        // Try to refresh
        let shouldRefresh = false
        const free = Number(car.refreshCount ?? 0) === 0
        if (refreshTickets >= 6) shouldRefresh = true
        else if (free) shouldRefresh = true
        else {
          // No tickets and not free, just send
          addLog({ time: new Date().toLocaleTimeString(), message: `车辆[${gradeLabel(car.color)}]不满足条件且无刷新次数，直接发车`, type: 'warning' })
          await tokenStore.sendMessageWithPromise(tokenId, 'car_send', {
            carId: String(car.id),
            helperId: 0,
            text: '',
            isUpgrade: false
          }, 10000)
          await new Promise(r => setTimeout(r, 500))
          continue
        }

        // Refresh loop
        while (shouldRefresh) {
          if (shouldStop.value) break

          addLog({ time: new Date().toLocaleTimeString(), message: `车辆[${gradeLabel(car.color)}]尝试刷新...`, type: 'info' })
          const resp = await tokenStore.sendMessageWithPromise(tokenId, 'car_refresh', { carId: String(car.id) }, 10000)
          const data = resp?.car || resp?.body?.car || resp

          // Update local car info
          if (data && typeof data === 'object') {
            if (data.color != null) car.color = Number(data.color)
            if (data.refreshCount != null) car.refreshCount = Number(data.refreshCount)
            if (data.rewards != null) car.rewards = data.rewards
          }

          // Update tickets
          try {
            const roleRes = await tokenStore.sendMessageWithPromise(tokenId, 'role_getroleinfo', {}, 5000)
            refreshTickets = Number(roleRes?.role?.items?.[35002]?.quantity || 0)
          } catch (_) { }

          // Check if good enough now
          if (shouldSendCar(car, refreshTickets)) {
            addLog({ time: new Date().toLocaleTimeString(), message: `刷新后车辆[${gradeLabel(car.color)}]满足条件，发车`, type: 'success' })
            await tokenStore.sendMessageWithPromise(tokenId, 'car_send', {
              carId: String(car.id),
              helperId: 0,
              text: '',
              isUpgrade: false
            }, 10000)
            await new Promise(r => setTimeout(r, 500))
            break
          }

          // Check if can continue refreshing
          const freeNow = Number(car.refreshCount ?? 0) === 0
          if (refreshTickets >= 6) shouldRefresh = true
          else if (freeNow) shouldRefresh = true
          else {
            addLog({ time: new Date().toLocaleTimeString(), message: `刷新后车辆[${gradeLabel(car.color)}]仍不满足条件且无刷新次数，发车`, type: 'warning' })
            await tokenStore.sendMessageWithPromise(tokenId, 'car_send', {
              carId: String(car.id),
              helperId: 0,
              text: '',
              isUpgrade: false
            }, 10000)
            await new Promise(r => setTimeout(r, 500))
            break
          }

          await new Promise(r => setTimeout(r, 1000))
        }
      }

      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 智能发车完成 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `智能发车失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量智能发车结束')
}

const batchClaimCars = async () => {
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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始一键收车: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      // 1. Fetch Car Info
      addLog({ time: new Date().toLocaleTimeString(), message: `获取车辆信息...`, type: 'info' })
      const res = await tokenStore.sendMessageWithPromise(tokenId, 'car_getrolecar', {}, 10000)
      let carList = normalizeCars(res?.body ?? res)

      // 2. Claim Cars
      let claimedCount = 0
      for (const car of carList) {
        if (canClaim(car)) {
          try {
            await tokenStore.sendMessageWithPromise(tokenId, 'car_claim', { carId: String(car.id) }, 10000)
            await tokenStore.sendMessageWithPromise(token.id, 'car_research', { researchId: 1 }, 5000)
            claimedCount++
            addLog({ time: new Date().toLocaleTimeString(), message: `收车成功: ${gradeLabel(car.color)}`, type: 'success' })
          } catch (e) {
            addLog({ time: new Date().toLocaleTimeString(), message: `收车失败: ${e.message}`, type: 'warning' })
          }
          await new Promise(r => setTimeout(r, 300))
        }
      }

      if (claimedCount === 0) {
        addLog({ time: new Date().toLocaleTimeString(), message: `没有可收取的车辆`, type: 'info' })
      }

      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 收车完成，共收取 ${claimedCount} 辆 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `收车失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量一键收车结束')
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

// --- 批量助手函数 ---
const batchClaimBoxPointReward = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始领取宝箱积分: ${token.name} ===`, type: 'info' })

      await ensureConnection(tokenId)

      await tokenStore.sendMessageWithPromise(tokenId, 'item_batchclaimboxpointreward', {}, 5000)
      addLog({ time: new Date().toLocaleTimeString(), message: `宝箱积分领取成功`, type: 'success' })

      await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
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
  message.success('批量领取宝箱积分结束')
}

const batchOpenBox = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  const boxType = helperSettings.boxType
  const totalCount = helperSettings.count
  const batches = Math.floor(totalCount / 10)
  const remainder = totalCount % 10
  const boxNames = { 2001: '木质宝箱', 2002: '青铜宝箱', 2003: '黄金宝箱', 2004: '铂金宝箱' }

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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始批量开箱: ${token.name} ===`, type: 'info' })
      addLog({ time: new Date().toLocaleTimeString(), message: `宝箱类型: ${boxNames[boxType]}, 数量: ${totalCount}`, type: 'info' })

      await ensureConnection(tokenId)

      for (let i = 0; i < batches; i++) {
        if (shouldStop.value) break
        await tokenStore.sendMessageWithPromise(tokenId, 'item_openbox', { itemId: boxType, number: 10 }, 5000)
        currentProgress.value = Math.floor(((i + 1) / (batches + (remainder > 0 ? 1 : 0))) * 100)
        addLog({ time: new Date().toLocaleTimeString(), message: `开箱进度: ${(i + 1) * 10}/${totalCount}`, type: 'info' })
        await new Promise(r => setTimeout(r, 300))
      }

      if (remainder > 0 && !shouldStop.value) {
        await tokenStore.sendMessageWithPromise(tokenId, 'item_openbox', { itemId: boxType, number: remainder }, 5000)
        addLog({ time: new Date().toLocaleTimeString(), message: `开箱进度: ${totalCount}/${totalCount}`, type: 'info' })
      }
	  await tokenStore.sendMessageWithPromise(tokenId, 'item_batchclaimboxpointreward')
	  await new Promise(r => setTimeout(r, 500))
      await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 开箱完成 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `开箱失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量开箱结束')
}

const batchFish = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  const fishType = helperSettings.fishType
  const totalCount = helperSettings.count
  const batches = Math.floor(totalCount / 10)
  const remainder = totalCount % 10
  const fishNames = { 1: '普通鱼竿', 2: '黄金鱼竿' }

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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始批量钓鱼: ${token.name} ===`, type: 'info' })
      addLog({ time: new Date().toLocaleTimeString(), message: `鱼竿类型: ${fishNames[fishType]}, 数量: ${totalCount}`, type: 'info' })

      await ensureConnection(tokenId)

      for (let i = 0; i < batches; i++) {
        if (shouldStop.value) break
        await tokenStore.sendMessageWithPromise(tokenId, 'artifact_lottery', { type: fishType, lotteryNumber: 10, newFree: true }, 5000)
        currentProgress.value = Math.floor(((i + 1) / (batches + (remainder > 0 ? 1 : 0))) * 100)
        addLog({ time: new Date().toLocaleTimeString(), message: `钓鱼进度: ${(i + 1) * 10}/${totalCount}`, type: 'info' })
        await new Promise(r => setTimeout(r, 300))
      }

      if (remainder > 0 && !shouldStop.value) {
        await tokenStore.sendMessageWithPromise(tokenId, 'artifact_lottery', { type: fishType, lotteryNumber: remainder, newFree: true }, 5000)
        addLog({ time: new Date().toLocaleTimeString(), message: `钓鱼进度: ${totalCount}/${totalCount}`, type: 'info' })
      }

      await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 钓鱼完成 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `钓鱼失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量钓鱼结束')
}

const batchRecruit = async () => {
  if (selectedTokens.value.length === 0) return

  isRunning.value = true
  shouldStop.value = false
  logs.value = []

  const totalCount = helperSettings.count
  const batches = Math.floor(totalCount / 10)
  const remainder = totalCount % 10

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
      addLog({ time: new Date().toLocaleTimeString(), message: `=== 开始批量招募: ${token.name} ===`, type: 'info' })
      addLog({ time: new Date().toLocaleTimeString(), message: `招募数量: ${totalCount}`, type: 'info' })

      await ensureConnection(tokenId)

      for (let i = 0; i < batches; i++) {
        if (shouldStop.value) break
        await tokenStore.sendMessageWithPromise(tokenId, 'hero_recruit', { recruitType: 1, recruitNumber: 10 }, 5000)
        currentProgress.value = Math.floor(((i + 1) / (batches + (remainder > 0 ? 1 : 0))) * 100)
        addLog({ time: new Date().toLocaleTimeString(), message: `招募进度: ${(i + 1) * 10}/${totalCount}`, type: 'info' })
        await new Promise(r => setTimeout(r, 300))
      }

      if (remainder > 0 && !shouldStop.value) {
        await tokenStore.sendMessageWithPromise(tokenId, 'hero_recruit', { recruitType: 1, recruitNumber: remainder }, 5000)
        addLog({ time: new Date().toLocaleTimeString(), message: `招募进度: ${totalCount}/${totalCount}`, type: 'info' })
      }

      await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
      tokenStatus.value[tokenId] = 'completed'
      addLog({ time: new Date().toLocaleTimeString(), message: `=== ${token.name} 招募完成 ===`, type: 'success' })

    } catch (error) {
      console.error(error)
      tokenStatus.value[tokenId] = 'failed'
      addLog({ time: new Date().toLocaleTimeString(), message: `招募失败: ${error.message}`, type: 'error' })
    }

    currentProgress.value = 100
    await new Promise(r => setTimeout(r, 500))
  }

  isRunning.value = false
  currentRunningTokenId.value = null
  message.success('批量招募结束')
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