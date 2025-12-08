<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 登录表单卡片 -->
      <div class="login-card glass">
        <div class="card-header">
          <div class="brand">
            <img src="/icons/xiaoyugan.png" alt="XYZW" class="brand-logo">
            <h1 class="brand-title">
              XYZW 游戏管理系统
            </h1>
          </div>
          <p class="welcome-text">
            欢迎回来，请登录您的账户
          </p>
        </div>

        <div class="card-body">
          <n-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large" :show-label="false">
            <n-form-item path="username">
              <n-input v-model:value="loginForm.username" placeholder="用户名或邮箱"
                :input-props="{ autocomplete: 'username' }">
                <template #prefix>
                  <n-icon>
                    <PersonCircle />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <n-form-item path="password">
              <n-input v-model:value="loginForm.password" type="password" placeholder="密码"
                :input-props="{ autocomplete: 'current-password' }" @keydown.enter="handleLogin">
                <template #prefix>
                  <n-icon>
                    <Lock />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <div class="form-options">
              <n-checkbox v-model:checked="loginForm.rememberMe">
                记住我
              </n-checkbox>
              <n-button text type="primary" @click="router.push('/forgot-password')">
                忘记密码？
              </n-button>
            </div>

            <n-button type="primary" size="large" block :loading="authStore.isLoading" class="login-button"
              @click="handleLogin">
              登录
            </n-button>
          </n-form>

          <n-divider>
            <span class="divider-text">其他登录方式</span>
          </n-divider>

          <div class="social-login">
            <n-button size="large" class="social-button" @click="handleSocialLogin('qq')">
              <template #icon>
                <n-icon>
                  <PersonCircle />
                </n-icon>
              </template>
              QQ登录
            </n-button>

            <n-button size="large" class="social-button" @click="handleSocialLogin('wechat')">
              <template #icon>
                <n-icon>
                  <PersonCircle />
                </n-icon>
              </template>
              微信登录
            </n-button>
          </div>

          <div class="register-prompt">
            <span>还没有账户？</span>
            <n-button text type="primary" @click="router.push('/register')">
              立即注册
            </n-button>
          </div>
        </div>
      </div>

      <!-- 功能展示 -->
      <div class="features-showcase">
        <div class="showcase-header">
          <h2>为什么选择 XYZW？</h2>
          <p>专业的游戏管理平台，让游戏变得更轻松</p>
        </div>

        <div class="features-list">
          <div v-for="feature in features" :key="feature.id" class="feature-item">
            <div class="feature-icon">
              <component :is="feature.icon" />
            </div>
            <div class="feature-content">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1" />
      <div class="decoration-circle circle-2" />
      <div class="decoration-circle circle-3" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { PersonCircle, Cube, Ribbon, Settings } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const loginFormRef = ref(null)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const loginRules = {
  username: [
    {
      required: true,
      message: '请输入用户名或邮箱',
      trigger: ['input', 'blur']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['input', 'blur']
    },
    {
      min: 6,
      message: '密码长度不能少于6位',
      trigger: ['input', 'blur']
    }
  ]
}

// 功能特性数据
const features = [
  {
    id: 1,
    icon: PersonCircle,
    title: '多角色管理',
    description: '统一管理多个游戏角色，随时切换查看'
  },
  {
    id: 2,
    icon: Cube,
    title: '任务自动化',
    description: '智能执行日常任务，解放双手节省时间'
  },
  {
    id: 3,
    icon: Ribbon,
    title: '数据统计',
    description: '详细的进度统计，让游戏数据一目了然'
  },
  {
    id: 4,
    icon: Settings,
    title: '个性化配置',
    description: '灵活的设置选项，打造专属管理方案'
  }
]

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    const result = await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
      rememberMe: loginForm.rememberMe
    })

    if (result.success) {
      message.success('登录成功')

      // 跳转到dashboard或之前访问的页面
      const redirect = router.currentRoute.value.query.redirect || '/admin/dashboard'
      router.push(redirect)
    } else {
      message.error(result.message)
    }
  } catch (error) {
    // 表单验证失败
    console.error('Login validation failed:', error)
  }
}

// 处理社交登录
const handleSocialLogin = (provider) => {
  message.info(`${provider === 'qq' ? 'QQ' : '微信'}登录功能开发中...`)
}

onMounted(() => {
  // 如果已经登录，直接跳转
  if (authStore.isAuthenticated) {
    router.push('/admin/dashboard')
  }
})
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100dvh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
}

/* 深色主题下背景 */
[data-theme="dark"] .login-page {
  background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  max-width: 1200px;
  width: 100%;
  padding: var(--spacing-lg);
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 深色主题下登录卡片 */
[data-theme="dark"] .login-card {
  background: rgba(17, 24, 39, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius-large);
}

.brand-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.welcome-text {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  margin: 0;
}

.card-body {
  .n-form {
    .n-form-item {
      margin-bottom: var(--spacing-lg);
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.login-button {
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-lg);
}

.divider-text {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.social-login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.social-button {
  height: 44px;
  border: 1px solid var(--border-light);

  &:hover {
    border-color: var(--primary-color);
  }
}

.register-prompt {
  text-align: center;
  color: var(--text-secondary);

  span {
    margin-right: var(--spacing-sm);
  }
}

// 功能展示区域
.features-showcase {
  color: white;
  padding: var(--spacing-xl);
}

.showcase-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);

  h2 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: var(--font-size-lg);
    opacity: 0.9;
    margin: 0;
  }
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.feature-item {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-large);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-normal);

  &:hover {
    transform: translateX(8px);
    background: rgba(255, 255, 255, 0.15);
  }
}

.feature-icon {
  width: 48px;
  height: 48px;
  color: white;
  flex-shrink: 0;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.feature-content {
  flex: 1;

  h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-sm);
  }

  p {
    opacity: 0.8;
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
}

// 背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 60%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 500px;
  }

  .features-showcase {
    order: -1;
  }

  .showcase-header h2 {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 640px) {
  .login-container {
    padding: var(--spacing-md);
  }

  .login-card {
    padding: var(--spacing-xl);
  }

  .brand-title {
    font-size: var(--font-size-xl);
  }

  .social-login {
    grid-template-columns: 1fr;
  }

  .feature-item {
    flex-direction: column;
    text-align: center;
  }

  .decoration-circle {
    display: none;
  }
}
</style>
