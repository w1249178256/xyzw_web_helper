<template>
  <div class="login-container">
    <div class="login-wrapper">
      <a-card class="login-card" :bordered="false">
        <div class="login-header">
          <div class="logo-area">
            <span class="logo-icon">⚔</span>
            <h1 class="app-title">XYZW 游戏管理系统</h1>
          </div>
          <p class="app-subtitle">请登录以继续使用</p>
        </div>

        <a-form
          ref="formRef"
          :model="form"
          layout="vertical"
          @submit="handleSubmit"
        >
          <a-form-item
            field="username"
            label="用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          >
            <a-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              allow-clear
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <icon-user />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            field="password"
            label="密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password
              v-model="form.password"
              placeholder="请输入密码"
              size="large"
              allow-clear
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>

          <a-alert
            v-if="errorMessage"
            type="error"
            :content="errorMessage"
            class="error-alert"
            closable
            @close="errorMessage = ''"
          />

          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              :loading="loading"
              long
              size="large"
              @click="handleSubmit"
            >
              登录
            </a-button>
          </a-form-item>
        </a-form>

        <div class="register-link">
          <span class="hint-text">还没有账号？</span>
          <a-link @click="goToRegister">立即注册</a-link>
          <span class="hint-text">(需要邀请码)</span>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserAuthStore } from './store';

const router = useRouter();
const route = useRoute();
const authStore = useUserAuthStore();

const formRef = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  username: '',
  password: ''
});

async function handleSubmit() {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
  } catch {
    return;
  }

  if (!form.username.trim() || !form.password) {
    errorMessage.value = '请填写用户名和密码';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  const result = await authStore.login(form.username.trim(), form.password);

  loading.value = false;

  if (result.ok) {
    const redirect = route.query.redirect;
    if (redirect && redirect !== '/login') {
      router.push(redirect);
    } else {
      router.push('/');
    }
  } else {
    errorMessage.value = result.error || '登录失败，请重试';
  }
}

function goToRegister() {
  router.push('/register');
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 420px;
}

.login-card {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  background: var(--color-bg-1, #fff);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
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

.error-alert {
  margin-bottom: 16px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.hint-text {
  color: var(--color-text-3);
}
</style>
