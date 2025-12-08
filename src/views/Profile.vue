<template>
  <div class="profile-page">
    <div class="container">
      <div class="page-header">
        <h1>个人资料</h1>
        <p>管理您的账户信息和偏好设置</p>
      </div>

      <h2>基本信息</h2>
      <a-card>
        <a-form :model="userInfo" label-placement="left" label-width="80px">
          <a-form-item label="用户名">
            <a-input v-model:value="userInfo.username" readonly />
          </a-form-item>
          <a-form-item label="邮箱">
            <a-input v-model:value="userInfo.email" />
          </a-form-item>
          <a-form-item label="昵称">
            <a-input v-model:value="userInfo.nickname" placeholder="请输入昵称" />
          </a-form-item>
          <a-form-item label="手机">
            <a-input v-model:value="userInfo.phone" placeholder="请输入手机号" />
          </a-form-item>
        </a-form>

        <template #actions>
          <a-button type="primary" @click="saveProfile">
            保存更改
          </a-button>
        </template>
      </a-card>

      <h2>密码修改</h2>
      <a-card>
        <a-form :model="passwordForm" ref="passwordFormRef" label-placement="left" label-width="100px">
          <a-form-item label="当前密码" prop="currentPassword">
            <a-input v-model:value="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" />
          </a-form-item>
          <a-form-item label="新密码" prop="newPassword">
            <a-input v-model:value="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
          </a-form-item>
          <a-form-item label="确认新密码" prop="confirmPassword">
            <a-input v-model:value="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
          </a-form-item>
        </a-form>
        <template #actions>
          <a-button type="primary" @click="changePassword">
            修改密码
          </a-button>
        </template>
      </a-card>

      <h2>系统偏好</h2>
      <a-card>
        <a-form>
          <a-form-item label="主题设置">
            <n-select v-model:value="preferences.theme" :options="themeOptions" @update:value="updateTheme" />
            <template #extra>
              选择您喜欢的界面主题
            </template>
          </a-form-item>
          <a-form-item label="语言设置">
            <n-select v-model:value="preferences.language" :options="languageOptions" />
            <template #extra>
              选择界面显示语言
            </template>
          </a-form-item>
          <a-form-item label="通知设置">
            <n-switch v-model:value="preferences.notifications" />
            <template #extra>
              接收任务完成通知
            </template>
          </a-form-item>
          <a-form-item label="自动执行">
            <n-switch v-model:value="preferences.autoExecute" />
            <template #extra>
              默认开启任务自动执行
            </template>
          </a-form-item>
        </a-form>
      </a-card>

      <h2>Token管理</h2>
      <TokenManager />

      <h2>账户安全</h2>
      <a-card>
        <div class="security-items">
          <div class="security-item">
            <div class="security-info">
              <h3>两步验证</h3>
              <p>为您的账户添加额外的安全保护</p>
            </div>
            <n-button @click="setupTwoFactor">
              设置
            </n-button>
          </div>

          <div class="security-item">
            <div class="security-info">
              <h3>登录历史</h3>
              <p>查看最近的登录记录</p>
            </div>
            <n-button @click="viewLoginHistory">
              查看
            </n-button>
          </div>

          <div class="security-item">
            <div class="security-info">
              <h3>数据导出</h3>
              <p>导出您的所有数据</p>
            </div>
            <n-button @click="exportData">
              导出
            </n-button>
          </div>

          <div class="security-item danger">
            <div class="security-info">
              <h3>删除账户</h3>
              <p>永久删除您的账户和所有数据</p>
            </div>
            <n-button type="error" @click="deleteAccount">
              删除
            </n-button>
          </div>
        </div>
      </a-card>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const passwordFormRef = ref(null)

// 用户信息
const userInfo = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  avatar: ''
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 系统偏好
const preferences = reactive({
  theme: 'auto',
  language: 'zh-CN',
  notifications: true,
  autoExecute: false
})

// 密码验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value) => value === passwordForm.newPassword,
      message: '两次输入的密码不一致',
      trigger: 'blur'
    }
  ]
}

// 选项数据
const themeOptions = [
  { label: '跟随系统', value: 'auto' },
  { label: '浅色主题', value: 'light' },
  { label: '深色主题', value: 'dark' }
]

const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

// 方法
const saveProfile = async () => {
  try {
    // 这里应该调用API保存用户信息
    message.success('个人信息保存成功')
  } catch (error) {
    message.error('保存失败，请稍后重试')
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()

    // 这里应该调用API修改密码
    message.success('密码修改成功')

    // 清空表单
    Object.keys(passwordForm).forEach(key => {
      passwordForm[key] = ''
    })
  } catch (error) {
    // 验证失败
  }
}

const savePreferences = () => {
  // 保存偏好设置
  localStorage.setItem('userPreferences', JSON.stringify(preferences))
  message.success('偏好设置保存成功')
}

const updateTheme = (theme) => {
  preferences.theme = theme
  localStorage.setItem('theme', theme)
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
  }
}

const changeAvatar = () => {
  message.info('头像更换功能开发中...')
}

const setupTwoFactor = () => {
  message.info('两步验证设置功能开发中...')
}

const viewLoginHistory = () => {
  message.info('登录历史查看功能开发中...')
}

const exportData = () => {
  message.info('数据导出功能开发中...')
}

const deleteAccount = () => {
  dialog.warning({
    title: '删除账户',
    content: '此操作将永久删除您的账户和所有数据，且无法恢复。确定要继续吗？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      message.error('账户删除功能暂未开放')
    }
  })
}

// 生命周期
onMounted(() => {
  // 加载用户信息
  if (authStore.userInfo) {
    Object.assign(userInfo, authStore.userInfo)
  }

  // 加载用户偏好
  const savedPreferences = localStorage.getItem('userPreferences')
  if (savedPreferences) {
    try {
      Object.assign(preferences, JSON.parse(savedPreferences))
    } catch (error) {
      console.error('解析用户偏好失败:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100dvh;
  background: var(--bg-secondary);
  padding: var(--spacing-xl) 0;
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);

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

h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.profile-section {
  margin-bottom: var(--spacing-2xl);

}

.security-items {
  display: flex;
  gap: var(--spacing-lg);
  flex-direction: column;

  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-medium);
    transition: all var(--transition-fast);

    &:hover {
      box-shadow: var(--shadow-light);
    }

    &.danger {
      border-color: var(--error-color);
      background: rgba(208, 48, 80, 0.05);
    }

    .security-info {
      flex: 1;

      h3 {
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        margin-bottom: var(--spacing-xs);
      }

      p {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        margin: 0;
      }
    }
  }
}


@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .info-card {
    padding: var(--spacing-lg);
  }

  .preference-item,
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .preference-item .n-select,
  .preference-item .n-switch {
    width: 100%;
  }
}
</style>
