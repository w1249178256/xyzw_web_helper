<template>
  <div class="register-container">
    <div class="register-wrapper">
      <a-card class="register-card" :bordered="false">
        <div class="register-header">
          <div class="logo-area">
            <span class="logo-icon">⚔</span>
            <h1 class="app-title">XYZW 游戏管理系统</h1>
          </div>
          <p class="app-subtitle">创建新账号</p>
        </div>

        <a-form
          ref="formRef"
          :model="form"
          layout="vertical"
          @submit.prevent="handleSubmit"
        >
          <a-form-item
            field="username"
            label="用户名"
            :rules="usernameRules"
            validate-trigger="blur"
          >
            <a-input
              v-model="form.username"
              placeholder="3-20位字母、数字或下划线"
              size="large"
              allow-clear
            >
              <template #prefix>
                <icon-user />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            field="password"
            label="密码"
            :rules="passwordRules"
            validate-trigger="blur"
          >
            <a-input-password
              v-model="form.password"
              placeholder="至少6位"
              size="large"
              allow-clear
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item
            field="confirmPassword"
            label="确认密码"
            :rules="confirmPasswordRules"
            validate-trigger="blur"
          >
            <a-input-password
              v-model="form.confirmPassword"
              placeholder="再次输入密码"
              size="large"
              allow-clear
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item
            field="invite_code"
            label="邀请码"
            :rules="[{ required: true, message: '请输入邀请码' }]"
            validate-trigger="blur"
          >
            <a-input
              v-model="form.invite_code"
              placeholder="请输入管理员提供的邀请码"
              size="large"
              allow-clear
            >
              <template #prefix>
                <icon-key />
              </template>
            </a-input>
          </a-form-item>

          <a-alert
            v-if="errorMessage"
            type="error"
            :content="errorMessage"
            class="form-alert"
            closable
            @close="errorMessage = ''"
          />

          <a-alert
            v-if="successMessage"
            type="success"
            :content="successMessage"
            class="form-alert"
          />

          <a-form-item>
            <a-button
              type="primary"
              :loading="loading"
              long
              size="large"
              @click="handleSubmit"
            >
              注册
            </a-button>
          </a-form-item>
        </a-form>

        <div class="login-link">
          <span>已有账号？</span>
          <a-link @click="goToLogin">立即登录</a-link>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserAuthStore } from './store';

const router = useRouter();
const route = useRoute();
const authStore = useUserAuthStore();

const formRef = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  invite_code: ''
});

const usernameRules = [
  { required: true, message: '请输入用户名' },
  { minLength: 3, maxLength: 20, message: '用户名必须是3-20个字符' },
  {
    validator: (value, cb) => {
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        cb('用户名只能包含字母、数字和下划线');
      } else {
        cb();
      }
    }
  }
];

const passwordRules = [
  { required: true, message: '请输入密码' },
  { minLength: 6, message: '密码至少6位' }
];

const confirmPasswordRules = [
  { required: true, message: '请确认密码' },
  {
    validator: (value, cb) => {
      if (value !== form.password) {
        cb('两次输入的密码不一致');
      } else {
        cb();
      }
    }
  }
];

onMounted(() => {
  // Pre-fill invite code from URL query param
  const codeFromUrl = route.query.code;
  if (codeFromUrl) {
    form.invite_code = codeFromUrl;
  }
});

async function handleSubmit() {
  if (!formRef.value) return;

  try {
    const errors = await formRef.value.validate();
    if (errors) return;
  } catch {
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const result = await authStore.register(
    form.username.trim(),
    form.password,
    form.invite_code.trim()
  );

  loading.value = false;

  if (result.ok) {
    successMessage.value = '注册成功！正在跳转到登录页...';
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  } else {
    errorMessage.value = result.error || '注册失败，请重试';
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}

.register-wrapper {
  width: 100%;
  max-width: 440px;
}

.register-card {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  background: var(--color-bg-1, #fff);
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 32px;
  line-height: 1;
}

.app-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-1);
  letter-spacing: 0.5px;
}

.app-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-3);
}

.form-alert {
  margin-bottom: 16px;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
