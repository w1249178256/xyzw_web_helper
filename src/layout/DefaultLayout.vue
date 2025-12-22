<template>
  <div class="default-layout">
    <!-- 顶部导航 -->
    <nav class="dashboard-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <img src="/icons/xiaoyugan.png" alt="XYZW" class="brand-logo">
          <div class="brand-toggle" @click="isMobileMenuOpen = true">
            <n-icon>
              <Menu />
            </n-icon>
            <span class="brand-text">XYZW 控制台</span>
          </div>
        </div>

        <div class="nav-menu">
          <router-link to="/admin/dashboard" class="nav-item" active-class="active">
            <n-icon>
              <Home />
            </n-icon>
            <span>首页</span>
          </router-link>
          <router-link to="/admin/game-features" class="nav-item" active-class="active">
            <n-icon>
              <Cube />
            </n-icon>
            <span>游戏功能</span>
          </router-link>
          <router-link to="/tokens" class="nav-item" active-class="active">
            <n-icon>
              <PersonCircle />
            </n-icon>
            <span>Token管理</span>
          </router-link>
          <router-link to="/admin/daily-tasks" class="nav-item" active-class="active">
            <n-icon>
              <Settings />
            </n-icon>
            <span>任务管理</span>
          </router-link>
          <router-link to="/admin/batch-daily-tasks" class="nav-item" active-class="active">
            <n-icon>
              <Layers />
            </n-icon>
            <span>批量日常</span>
          </router-link>
          <router-link to="/admin/message-test" class="nav-item" active-class="active">
            <n-icon>
              <ChatbubbleEllipsesSharp />
            </n-icon>
            <span>消息测试</span>
          </router-link>
          <router-link to="/admin/profile" class="nav-item" active-class="active">
            <n-icon>
              <Settings />
            </n-icon>
            <span>个人设置</span>
          </router-link>
        </div>

        <div class="nav-user">
          <!-- 主题切换按钮 -->
          <ThemeToggle />

          <n-dropdown :options="userMenuOptions" @select="handleUserAction">
            <div class="user-info">
              <n-avatar src="" size="medium" fallback-src="/icons/xiaoyugan.png" />
              <span class="username">{{ selectedToken?.name || '未选择Token' }}</span>
              <n-icon>
                <ChevronDown />
              </n-icon>
            </div>
          </n-dropdown>
        </div>
      </div>
    </nav>
    <n-drawer v-model:show="isMobileMenuOpen" placement="left" style="width: 260px">
      <div class="drawer-menu">
        <router-link to="/admin/dashboard" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <Home />
          </n-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/admin/game-features" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <Cube />
          </n-icon>
          <span>游戏功能</span>
        </router-link>
        <router-link to="/tokens" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <PersonCircle />
          </n-icon>
          <span>Token管理</span>
        </router-link>
        <router-link to="/admin/daily-tasks" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <Settings />
          </n-icon>
          <span>任务管理</span>
        </router-link>
        <router-link to="/admin/batch-daily-tasks" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <Layers />
          </n-icon>
          <span>批量日常</span>
        </router-link>
        <router-link to="/admin/message-test" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <ChatbubbleEllipsesSharp />
          </n-icon>
          <span>消息测试</span>
        </router-link>
        <router-link to="/admin/profile" class="drawer-item" @click="isMobileMenuOpen = false">
          <n-icon>
            <Settings />
          </n-icon>
          <span>个人设置</span>
        </router-link>
      </div>
    </n-drawer>
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useTokenStore, selectedToken, selectedTokenId } from '@/stores/tokenStore'
import ThemeToggle from '@/components/Common/ThemeToggle.vue'
import {
  Home,
  PersonCircle,
  Cube,
  Settings,
  ChevronDown,
  ChatbubbleEllipsesSharp,
  Menu,
  Layers
} from '@vicons/ionicons5'


import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ref } from 'vue'

const tokenStore = useTokenStore()
const router = useRouter()
const message = useMessage()

const isMobileMenuOpen = ref(false)

const userMenuOptions = [
  {
    label: '个人资料',
    key: 'profile'
  },
  {
    label: '账户设置',
    key: 'settings'
  },
  {
    type: 'divider'
  },
  {
    label: '退出登录',
    key: 'logout'
  }
]

// 方法
const handleUserAction = (key) => {
  switch (key) {
    case 'profile':
      router.push('/admin/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      tokenStore.clearAllTokens()
      message.success('已清除所有Token')
      router.push('/tokens')
      break
  }
}

</script>

<style scoped lang="scss">
// 导航栏
.dashboard-nav {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.nav-container {
  display: flex;
  align-items: center;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-right: var(--spacing-xl);
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-small);
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.brand-toggle {
  display: none;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-lg);
}

.brand-toggle .n-icon {
  font-size: inherit;
}

.nav-menu {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-medium);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-color-light);
    color: var(--primary-color);
  }
}

.nav-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
  }
}

.username {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .nav-item span {
    display: none;
  }

  .nav-menu {
    display: none;
  }

  .nav-item {
    padding: var(--spacing-sm);
    flex: 0 0 auto;
  }

  .nav-container {
    height: 56px;
  }

  .brand-logo {
    display: none;
  }

  .brand-toggle {
    display: inline-flex;
  }
}


.drawer-menu {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-medium);
  color: var(--text-secondary);
  text-decoration: none;
}

.drawer-item.router-link-active {
  background: var(--primary-color-light);
  color: var(--primary-color);
}
</style>
