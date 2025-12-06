<template>
  <div class="game-roles-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-left">
            <h1>游戏角色</h1>
            <p>管理您的所有游戏角色</p>
          </div>
          <div class="header-actions">
            <n-button 
              type="primary" 
              size="large"
              @click="showAddModal = true"
            >
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              添加角色
            </n-button>
          </div>
        </div>
      </div>

      <!-- 角色列表 -->
      <div
        v-if="gameRolesStore.gameRoles.length"
        class="roles-grid"
      >
        <div 
          v-for="role in gameRolesStore.gameRoles"
          :key="role.id"
          class="role-card"
          :class="{ active: role.id === gameRolesStore.selectedRole?.id }"
          @click="selectRole(role)"
        >
          <div class="card-header">
            <div class="role-avatar">
              <img
                :src="role.avatar || '/icons/xiaoyugan.png'"
                :alt="role.name"
              >
            </div>
            <div class="role-actions">
              <n-dropdown 
                :options="roleMenuOptions" 
                @select="(key) => handleRoleAction(key, role)"
              >
                <n-button text>
                  <template #icon>
                    <n-icon><EllipsisHorizontal /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
          
          <div class="card-body">
            <h3 class="role-name">
              {{ role.name }}
            </h3>
            <p class="role-info">
              {{ role.server }} | {{ role.level }}级
            </p>
            <div class="role-tags">
              <n-tag 
                size="small" 
                :type="role.isActive ? 'success' : 'default'"
              >
                {{ role.isActive ? '活跃' : '离线' }}
              </n-tag>
              <n-tag
                v-if="role.vip"
                size="small"
              >
                VIP
              </n-tag>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="role-stats">
              <div class="stat-item">
                <span class="stat-label">经验</span>
                <span class="stat-value">{{ role.exp || '0' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">金币</span>
                <span class="stat-value">{{ formatNumber(role.gold || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="empty-state"
      >
        <n-empty 
          description="暂无游戏角色"
          size="large"
        >
          <template #icon>
            <n-icon size="64">
              <PersonCircle />
            </n-icon>
          </template>
          <template #extra>
            <n-button 
              type="primary"
              size="large"
              @click="showAddModal = true"
            >
              添加第一个角色
            </n-button>
          </template>
        </n-empty>
      </div>

      <!-- 添加/编辑角色模态框 -->
      <n-modal 
        v-model:show="showAddModal" 
        preset="card" 
        title="添加游戏角色"
        style="width: 500px"
      >
        <n-form
          ref="roleFormRef"
          :model="roleForm"
          :rules="roleRules"
          label-placement="left"
          label-width="80px"
        >
          <n-form-item
            label="角色名称"
            path="name"
          >
            <n-input 
              v-model:value="roleForm.name" 
              placeholder="请输入角色名称"
            />
          </n-form-item>
          
          <n-form-item
            label="服务器"
            path="server"
          >
            <n-select 
              v-model:value="roleForm.server" 
              :options="serverOptions"
              placeholder="请选择服务器"
            />
          </n-form-item>
          
          <n-form-item
            label="职业"
            path="profession"
          >
            <n-select 
              v-model:value="roleForm.profession" 
              :options="professionOptions"
              placeholder="请选择职业"
            />
          </n-form-item>
          
          <n-form-item
            label="等级"
            path="level"
          >
            <n-input-number 
              v-model:value="roleForm.level" 
              :min="1"
              :max="200"
              placeholder="角色等级"
            />
          </n-form-item>
          
          <n-form-item label="账号信息">
            <n-input 
              v-model:value="roleForm.account" 
              placeholder="游戏账号（可选）"
            />
          </n-form-item>
          
          <n-form-item label="备注">
            <n-input 
              v-model:value="roleForm.note" 
              type="textarea" 
              placeholder="角色备注信息（可选）"
              :rows="3"
            />
          </n-form-item>
        </n-form>
        
        <template #footer>
          <div class="modal-actions">
            <n-button @click="showAddModal = false">
              取消
            </n-button>
            <n-button 
              type="primary" 
              :loading="isSubmitting"
              @click="handleSubmit"
            >
              {{ editingRole ? '保存' : '添加' }}
            </n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useGameRolesStore } from '@/stores/gameRoles'
import { PersonCircle, Add, EllipsisHorizontal } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const gameRolesStore = useGameRolesStore()

// 响应式数据
const showAddModal = ref(false)
const isSubmitting = ref(false)
const editingRole = ref(null)
const roleFormRef = ref(null)

// 角色表单
const roleForm = reactive({
  name: '',
  server: '',
  profession: '',
  level: 1,
  account: '',
  note: ''
})

// 表单验证规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  server: [
    { required: true, message: '请选择服务器', trigger: 'change' }
  ],
  profession: [
    { required: true, message: '请选择职业', trigger: 'change' }
  ],
  level: [
    { required: true, type: 'number', message: '请输入角色等级', trigger: 'blur' }
  ]
}

// 选项数据
const serverOptions = [
  { label: '风云服', value: '风云服' },
  { label: '神话服', value: '神话服' },
  { label: '传奇服', value: '传奇服' },
  { label: '梦幻服', value: '梦幻服' },
  { label: '英雄服', value: '英雄服' }
]

const professionOptions = [
  { label: '战士', value: '战士' },
  { label: '法师', value: '法师' },
  { label: '道士', value: '道士' },
  { label: '刺客', value: '刺客' },
  { label: '弓手', value: '弓手' },
  { label: '牧师', value: '牧师' }
]

const roleMenuOptions = [
  { label: '编辑', key: 'edit' },
  { label: '设为主角色', key: 'set-primary' },
  { label: '查看详情', key: 'view-details' },
  { type: 'divider' },
  { label: '删除', key: 'delete' }
]

// 方法
const selectRole = (role) => {
  gameRolesStore.selectRole(role)
  message.success(`已切换到角色：${role.name}`)
}

const handleRoleAction = async (key, role) => {
  switch (key) {
    case 'edit':
      editRole(role)
      break
    case 'set-primary':
      selectRole(role)
      break
    case 'view-details':
      viewRoleDetails(role)
      break
    case 'delete':
      deleteRole(role)
      break
  }
}

const editRole = (role) => {
  editingRole.value = role
  Object.assign(roleForm, role)
  showAddModal.value = true
}

const viewRoleDetails = (role) => {
  message.info('角色详情功能开发中...')
}

const deleteRole = (role) => {
  dialog.warning({
    title: '删除角色',
    content: `确定要删除角色 "${role.name}" 吗？此操作无法恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const result = await gameRolesStore.deleteGameRole(role.id)
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    }
  })
}

const handleSubmit = async () => {
  if (!roleFormRef.value) return

  try {
    await roleFormRef.value.validate()
    isSubmitting.value = true

    let result
    if (editingRole.value) {
      // 编辑模式
      result = await gameRolesStore.updateGameRole(editingRole.value.id, roleForm)
    } else {
      // 添加模式
      result = await gameRolesStore.addGameRole(roleForm)
    }

    if (result.success) {
      message.success(result.message)
      showAddModal.value = false
      resetForm()
    } else {
      message.error(result.message)
    }
  } catch (error) {
    // 表单验证失败
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  Object.keys(roleForm).forEach(key => {
    roleForm[key] = key === 'level' ? 1 : ''
  })
  editingRole.value = null
}

const formatNumber = (num) => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 生命周期
onMounted(async () => {
  // 获取游戏角色列表
  if (gameRolesStore.gameRoles.length === 0) {
    await gameRolesStore.fetchGameRoles()
  }
})
</script>

<style scoped lang="scss">
.game-roles-page {
  min-height: 100dvh;
  background: var(--bg-secondary);
  padding: var(--spacing-xl) 0;
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-2xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-left {
  h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--text-secondary);
    font-size: var(--font-size-lg);
    margin: 0;
  }
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.role-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-light);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
  
  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
  
  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-lg) 0;
}

.role-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--border-light);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.role-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
  
  .role-card:hover & {
    opacity: 1;
  }
}

.card-body {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: center;
}

.role-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.role-info {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.role-tags {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

.card-footer {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.role-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .header-actions {
    width: 100%;
  }
  
  .roles-grid {
    grid-template-columns: 1fr;
  }
  
  .role-stats {
    grid-template-columns: 1fr;
  }
}
</style>
