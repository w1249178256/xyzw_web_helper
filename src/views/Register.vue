<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card glass">
        <div class="card-header">
          <div class="brand">
            <img src="/icons/xiaoyugan.png" alt="XYZW" class="brand-logo">
            <h1 class="brand-title">
              注册 XYZW 账户
            </h1>
          </div>
          <p class="welcome-text">
            加入我们，开始您的游戏管理之旅
          </p>
        </div>

        <div class="card-body">
          <n-form ref="registerFormRef" :model="registerForm" :rules="registerRules" size="large" :show-label="false">
            <n-form-item path="username">
              <n-input v-model:value="registerForm.username" placeholder="用户名"
                :input-props="{ autocomplete: 'username' }">
                <template #prefix>
                  <n-icon>
                    <PersonCircle />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <n-form-item path="email">
              <n-input v-model:value="registerForm.email" placeholder="邮箱地址" :input-props="{ autocomplete: 'email' }">
                <template #prefix>
                  <n-icon>
                    <Mail />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <n-form-item path="password">
              <n-input v-model:value="registerForm.password" type="password" placeholder="密码"
                :input-props="{ autocomplete: 'new-password' }">
                <template #prefix>
                  <n-icon>
                    <Lock />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <n-form-item path="confirmPassword">
              <n-input v-model:value="registerForm.confirmPassword" type="password" placeholder="确认密码"
                :input-props="{ autocomplete: 'new-password' }" @keydown.enter="handleRegister">
                <template #prefix>
                  <n-icon>
                    <Lock />
                  </n-icon>
                </template>
              </n-input>
            </n-form-item>

            <div class="form-options">
              <n-checkbox v-model:checked="registerForm.agreeTerms">
                我已阅读并同意
                <n-button text type="primary" @click="showTerms = true">
                  服务条款
                </n-button>
                和
                <n-button text type="primary" @click="showPrivacy = true">
                  隐私政策
                </n-button>
              </n-checkbox>
            </div>

            <n-button type="primary" size="large" block :loading="authStore.isLoading"
              :disabled="!registerForm.agreeTerms" class="register-button" @click="handleRegister">
              注册账户
            </n-button>
          </n-form>

          <div class="login-prompt">
            <span>已有账户？</span>
            <n-button text type="primary" @click="router.push('/login')">
              立即登录
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { PersonCircle, Mail } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const registerFormRef = ref(null)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 表单验证规则
const registerRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: ['input', 'blur']
    },
    {
      min: 3,
      max: 20,
      message: '用户名长度应在3-20个字符之间',
      trigger: ['input', 'blur']
    }
  ],
  email: [
    {
      required: true,
      message: '请输入邮箱地址',
      trigger: ['input', 'blur']
    },
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
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
  ],
  confirmPassword: [
    {
      required: true,
      message: '请确认密码',
      trigger: ['input', 'blur']
    },
    {
      validator: (rule, value) => {
        return value === registerForm.password
      },
      message: '两次输入的密码不一致',
      trigger: ['input', 'blur']
    }
  ]
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()

    if (!registerForm.agreeTerms) {
      message.warning('请先同意服务条款和隐私政策')
      return
    }

    const result = await authStore.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })

    if (result.success) {
      message.success('注册成功，请登录')
      router.push('/login')
    } else {
      message.error(result.message)
    }
  } catch (error) {
    console.error('Registration validation failed:', error)
  }
}
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100dvh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
}

/* 深色主题下背景 */
[data-theme="dark"] .register-page {
  background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
}

.register-container {
  max-width: 500px;
  width: 100%;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 深色主题下注册卡片 */
[data-theme="dark"] .register-card {
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
  margin-bottom: var(--spacing-xl);

  :deep(.n-checkbox) {
    line-height: var(--line-height-relaxed);
  }
}

.register-button {
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-lg);
}

.login-prompt {
  text-align: center;
  color: var(--text-secondary);

  span {
    margin-right: var(--spacing-sm);
  }
}

@media (max-width: 640px) {
  .register-card {
    padding: var(--spacing-xl);
  }

  .brand-title {
    font-size: var(--font-size-xl);
  }
}
</style>
