<template>
  <div class="daily-tasks-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">
              日常任务
            </h1>
            <p class="page-subtitle">
              管理和执行您的日常游戏任务
            </p>
          </div>

          <div class="header-actions">
            <n-button type="primary" size="large" :loading="isRefreshing" @click="refreshTasks">
              <template #icon>
                <n-icon>
                  <Refresh />
                </n-icon>
              </template>
              刷新任务
            </n-button>

            <n-dropdown :options="bulkActionOptions" @select="handleBulkAction">
              <n-button size="large">
                批量操作
                <template #icon>
                  <n-icon>
                    <ChevronDown />
                  </n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色选择器 -->
    <div class="role-selector-section">
      <div class="container">
        <div class="role-selector">
          <span class="selector-label">选择角色：</span>
          <n-select v-model:value="selectedRoleId" :options="roleOptions" placeholder="请选择游戏角色" style="min-width: 200px"
            @update:value="onRoleChange" />

          <div v-if="selectedRole" class="role-stats">
            <div class="stat-item">
              <span class="stat-label">总任务：</span>
              <span class="stat-value">{{ taskStats.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已完成：</span>
              <span class="stat-value">{{ taskStats.completed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">进度：</span>
              <span class="stat-value">{{ taskStats.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务筛选 -->
    <div class="filter-section">
      <div class="container">
        <div class="filter-bar">
          <n-radio-group v-model:value="currentFilter" @update:value="onFilterChange">
            <n-radio-button value="all">
              全部任务
            </n-radio-button>
            <n-radio-button value="pending">
              待完成
            </n-radio-button>
            <n-radio-button value="completed">
              已完成
            </n-radio-button>
            <n-radio-button value="auto">
              自动执行
            </n-radio-button>
          </n-radio-group>

          <div class="search-box">
            <n-input v-model:value="searchKeyword" placeholder="搜索任务..." clearable @update:value="onSearch">
              <template #prefix>
                <n-icon>
                  <Search />
                </n-icon>
              </template>
            </n-input>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-section">
      <div class="container">
        <div v-if="filteredTasks.length" class="tasks-grid">
          <DailyTaskCard v-for="task in filteredTasks" :key="task.id" :task="task" @execute="executeTask"
            @toggle-status="toggleTaskStatus" @update:task="updateTask" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!isLoading" class="empty-state">
          <n-empty description="暂无任务数据" size="large">
            <template #icon>
              <n-icon>
                <Cube />
              </n-icon>
            </template>
            <template #extra>
              <n-button type="primary" @click="refreshTasks">
                刷新任务
              </n-button>
            </template>
          </n-empty>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <n-spin size="large">
            <template #description>
              正在加载任务数据...
            </template>
          </n-spin>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import DailyTaskCard from '@/components/Daily/DailyTaskCard.vue'
import {
  Refresh,
  ChevronDown,
  Search,
  Cube
} from '@vicons/ionicons5'
import { useGameRolesStore } from '@/stores/gameRoles'
import { useLocalTokenStore } from '@/stores/localTokenManager'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const tokenStore = useTokenStore()
const gameRolesStore = useGameRolesStore()
const localTokenStore = useLocalTokenStore()
const authStore = useAuthStore()

// 响应式数据
const isLoading = ref(false)
const isRefreshing = ref(false)
const selectedRoleId = ref(null)
const currentFilter = ref('all')
const searchKeyword = ref('')
const tasks = ref([])

// 计算属性
const selectedRole = computed(() => {
  return gameRolesStore.gameRoles.find(role => role.id === selectedRoleId.value)
})

const roleOptions = computed(() => {
  return gameRolesStore.gameRoles.map(role => ({
    label: `${role.name} (${role.server})`,
    value: role.id
  }))
})

const taskStats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(task => task.completed).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, percentage }
})

const filteredTasks = computed(() => {
  let filtered = tasks.value

  // 状态筛选
  switch (currentFilter.value) {
    case 'pending':
      filtered = filtered.filter(task => !task.completed)
      break
    case 'completed':
      filtered = filtered.filter(task => task.completed)
      break
    case 'auto':
      filtered = filtered.filter(task => task.settings?.autoExecute)
      break
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(keyword) ||
      task.subtitle?.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

const bulkActionOptions = [
  {
    label: '执行所有待完成任务',
    key: 'execute-all-pending'
  },
  {
    label: '标记所有为已完成',
    key: 'mark-all-completed'
  },
  {
    label: '重置所有任务状态',
    key: 'reset-all-tasks'
  }
]

// 等待WebSocket连接并加载阵容数据
const loadTeamDataWithConnection = async (tokenId, maxRetries = 3, retryDelay = 2000) => {
  // 降噪

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 检查WebSocket连接状态
      const wsStatus = tokenStore.getWebSocketStatus(tokenId)
      // 降噪

      if (wsStatus !== 'connected') {
        // 降噪

        // 尝试建立WebSocket连接
        const tokenData = tokenStore.gameTokens.find(t => t.id === tokenId)
        if (tokenData && tokenData.token) {
          // 触发WebSocket连接
          tokenStore.createWebSocketConnection(tokenId, tokenData.token, tokenData.wsUrl)

          // 等待连接建立
          await new Promise(resolve => setTimeout(resolve, retryDelay))

          // 再次检查连接状态
          const newStatus = tokenStore.getWebSocketStatus(tokenId)
          if (newStatus !== 'connected') {
            if (attempt < maxRetries) {
              // 降噪
              continue
            } else {
              throw new Error('WebSocket连接超时')
            }
          }
        } else {
          throw new Error('未找到有效的Token数据或WebSocket URL')
        }
      }

      // WebSocket已连接，开始加载阵容数据
      // 降噪
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        'presetteam_getinfo',
        {},
        8000
      )

      if (result) {
        // 更新到游戏数据缓存中
        tokenStore.$patch((state) => {
          state.gameData = { ...(state.gameData ?? {}), presetTeam: result }
        })
        // 降噪
        message.success('阵容数据已更新')
        return result
      }

    } catch (error) {
      console.error(`第${attempt}次尝试失败:`, error)

      if (attempt < maxRetries) {
        // 降噪
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        console.error('所有重试均失败，阵容数据加载失败')
        message.warning(`阵容数据加载失败: ${error.message || '未知错误'}`)
        return null
      }
    }
  }
}

// 方法
const refreshTasks = async () => {
  if (!selectedRoleId.value) {
    message.warning('请先选择游戏角色')
    return
  }

  try {
    isRefreshing.value = true
    isLoading.value = true

    // 使用本地模拟任务数据
    const mockTasks = generateMockTasks(selectedRoleId.value)
    tasks.value = mockTasks

    // 缓存到本地存储
    localStorage.setItem(`dailyTasks_${selectedRoleId.value}`, JSON.stringify(mockTasks))

    message.success('任务数据刷新成功')
  } catch (error) {
    console.error('刷新任务失败:', error)
    message.error('本地数据生成失败')
  } finally {
    isRefreshing.value = false
    isLoading.value = false
  }
}

// 生成模拟任务数据
const generateMockTasks = (roleId) => {
  const role = gameRolesStore.gameRoles.find(r => r.id === roleId)
  const roleName = role?.name || '未知角色'

  return [
    {
      id: `task_${roleId}_daily_signin`,
      title: '每日签到',
      subtitle: '登录游戏获取签到奖励',
      icon: '/icons/ta.png',
      completed: false,
      canExecute: true,
      progress: { current: 0, total: 1 },
      reward: '金币 x100, 经验 x50',
      nextReset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      settings: { autoExecute: false, delay: 0, notification: true },
      details: [
        { id: 1, name: '打开游戏客户端', completed: false },
        { id: 2, name: '点击签到按钮', completed: false }
      ],
      logs: []
    },
    {
      id: `task_${roleId}_daily_quest`,
      title: '完成日常任务',
      subtitle: '完成5个日常任务获得奖励',
      icon: '/icons/ta.png',
      completed: false,
      canExecute: true,
      progress: { current: 2, total: 5 },
      reward: '金币 x500, 装备碎片 x10',
      nextReset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      settings: { autoExecute: true, delay: 5, notification: true },
      details: [
        { id: 1, name: '击败10只怪物', completed: true },
        { id: 2, name: '收集20个材料', completed: true },
        { id: 3, name: '完成一次副本', completed: false },
        { id: 4, name: '参与公会活动', completed: false },
        { id: 5, name: '强化装备', completed: false }
      ],
      logs: [
        { id: 1, timestamp: Date.now() - 30 * 60 * 1000, type: 'success', message: '已完成击败怪物任务' },
        { id: 2, timestamp: Date.now() - 60 * 60 * 1000, type: 'success', message: '已完成材料收集任务' }
      ]
    },
    {
      id: `task_${roleId}_guild_contribution`,
      title: '公会贡献',
      subtitle: '为公会贡献资源获得贡献点',
      icon: '/icons/ta.png',
      completed: true,
      canExecute: false,
      progress: { current: 1, total: 1 },
      reward: '公会贡献点 x100',
      nextReset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      settings: { autoExecute: true, delay: 0, notification: true },
      details: [
        { id: 1, name: '捐献金币', completed: true }
      ],
      logs: [
        { id: 1, timestamp: Date.now() - 2 * 60 * 60 * 1000, type: 'success', message: '已完成公会贡献' }
      ]
    }
  ]
}

const onRoleChange = (roleId) => {
  selectedRoleId.value = roleId
  gameRolesStore.selectRole(
    gameRolesStore.gameRoles.find(role => role.id === roleId)
  )

  if (roleId) {
    refreshTasks()
  }
}

const onFilterChange = (filter) => {
  currentFilter.value = filter
}

const onSearch = (keyword) => {
  searchKeyword.value = keyword
}

const executeTask = async (taskId) => {
  if (!selectedRoleId.value) {
    message.error('请先选择游戏角色')
    return
  }

  try {
    // 检查WebSocket连接状态
    const wsStatus = localTokenStore.getWebSocketStatus(selectedRoleId.value)
    if (wsStatus !== 'connected') {
      // 尝试建立连接
      const tokenData = localTokenStore.getGameToken(selectedRoleId.value)
      if (tokenData) {
        localTokenStore.createWebSocketConnection(
          selectedRoleId.value,
          tokenData.token,
          tokenData.wsUrl
        )
        // 等待一秒让连接建立
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        throw new Error('未找到游戏token，请重新添加角色')
      }
    }

    // 模拟通过WebSocket执行任务
    // 降噪

    // 更新本地任务状态
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        completed: true,
        completedAt: new Date().toISOString()
      }

      // 添加执行日志
      if (!tasks.value[taskIndex].logs) {
        tasks.value[taskIndex].logs = []
      }
      tasks.value[taskIndex].logs.push({
        id: Date.now(),
        timestamp: Date.now(),
        type: 'success',
        message: `任务 "${tasks.value[taskIndex].title}" 执行成功`
      })

      // 保存到本地存储
      localStorage.setItem(`dailyTasks_${selectedRoleId.value}`, JSON.stringify(tasks.value))
    }

    message.success('任务执行成功')
  } catch (error) {
    console.error('执行任务失败:', error)

    // 添加错误日志
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      if (!tasks.value[taskIndex].logs) {
        tasks.value[taskIndex].logs = []
      }
      tasks.value[taskIndex].logs.push({
        id: Date.now(),
        timestamp: Date.now(),
        type: 'error',
        message: `任务执行失败: ${error.message}`
      })
    }

    throw error
  }
}

const toggleTaskStatus = (taskId) => {
  const taskIndex = tasks.value.findIndex(task => task.id === taskId)
  if (taskIndex !== -1) {
    tasks.value[taskIndex].completed = !tasks.value[taskIndex].completed
    message.info('任务状态已更新')
  }
}

const updateTask = (updatedTask) => {
  const taskIndex = tasks.value.findIndex(task => task.id === updatedTask.id)
  if (taskIndex !== -1) {
    tasks.value[taskIndex] = updatedTask
  }
}

const handleBulkAction = (key) => {
  switch (key) {
    case 'execute-all-pending':
      executeAllPendingTasks()
      break
    case 'mark-all-completed':
      markAllCompleted()
      break
    case 'reset-all-tasks':
      resetAllTasks()
      break
  }
}

const executeAllPendingTasks = async () => {
  const pendingTasks = tasks.value.filter(task => !task.completed && task.canExecute)

  if (pendingTasks.length === 0) {
    message.info('没有可执行的待完成任务')
    return
  }

  dialog.confirm({
    title: '批量执行任务',
    content: `确定要执行 ${pendingTasks.length} 个待完成任务吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      let successCount = 0
      let failCount = 0

      for (const task of pendingTasks) {
        try {
          await executeTask(task.id)
          successCount++
        } catch (error) {
          failCount++
        }
      }

      message.info(`批量执行完成：成功 ${successCount} 个，失败 ${failCount} 个`)
    }
  })
}

const markAllCompleted = () => {
  const pendingTasks = tasks.value.filter(task => !task.completed)

  if (pendingTasks.length === 0) {
    message.info('所有任务都已完成')
    return
  }

  dialog.confirm({
    title: '标记所有任务为已完成',
    content: `确定要将 ${pendingTasks.length} 个待完成任务标记为已完成吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      pendingTasks.forEach(task => {
        task.completed = true
        task.completedAt = new Date().toISOString()
      })
      message.success('所有任务已标记为完成')
    }
  })
}

const resetAllTasks = () => {
  dialog.confirm({
    title: '重置所有任务状态',
    content: '确定要重置所有任务状态吗？此操作将清除所有完成记录。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      tasks.value.forEach(task => {
        task.completed = false
        task.completedAt = null
      })
      message.success('所有任务状态已重置')
    }
  })
}

// 生命周期
onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 初始化游戏角色数据
  if (gameRolesStore.gameRoles.length === 0) {
    await gameRolesStore.fetchGameRoles()
  }

  // 页面进入时手动调用阵容加载接口，确保WebSocket连接后再调用
  if (tokenStore.selectedToken) {
    await loadTeamDataWithConnection(tokenStore.selectedToken.id)
  }

  // 设置默认选中的角色
  if (gameRolesStore.selectedRole) {
    selectedRoleId.value = gameRolesStore.selectedRole.id
    // 尝试从本地存储加载任务数据
    const savedTasks = localStorage.getItem(`dailyTasks_${selectedRoleId.value}`)
    if (savedTasks) {
      try {
        tasks.value = JSON.parse(savedTasks)
      } catch (error) {
        console.error('解析任务数据失败:', error)
        refreshTasks()
      }
    } else {
      refreshTasks()
    }
  } else if (gameRolesStore.gameRoles.length > 0) {
    selectedRoleId.value = gameRolesStore.gameRoles[0].id
    onRoleChange(selectedRoleId.value)
  }
})

// 监听选中角色变化
watch(() => gameRolesStore.selectedRole, (newRole) => {
  if (newRole && newRole.id !== selectedRoleId.value) {
    selectedRoleId.value = newRole.id
  }
})
</script>

<style scoped lang="scss">
.daily-tasks-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 深色主题下背景 */
[data-theme="dark"] .daily-tasks-page {
  background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-xl) 0;
  color: white;
}

/* 深色主题下头部渐变 */
[data-theme="dark"] .page-header {
  background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-lg);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: var(--font-size-lg);
  opacity: 0.9;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.role-selector-section {
  background: var(--bg-primary);
  padding: var(--spacing-lg) 0;
  border-bottom: 1px solid var(--border-light);
}

.role-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.selector-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
}

.role-stats {
  display: flex;
  gap: var(--spacing-lg);
  margin-left: auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.stat-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.filter-section {
  background: var(--bg-primary);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-light);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.search-box {
  width: 280px;
}

.tasks-section {
  padding: var(--spacing-xl) 0;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.empty-state,
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// 响应式设计
@media (max-width: 1024px) {
  .tasks-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-bar {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .role-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .role-stats {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .tasks-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .search-box {
    width: 100%;
  }
}
</style>
