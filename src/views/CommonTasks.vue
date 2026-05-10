<template>
  <div class="common-tasks-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1>常用任务</h1>
        </div>
      </div>

      <!-- Token 导入区域 -->
      <n-modal v-model:show="showImportForm" width="40rem" :default-visible="!tokenStore.hasTokens">
        <template #header>
          <h2>
            <n-icon>
              <Add />
            </n-icon>
            添加游戏 Token
          </h2>
        </template>
        <div class="card-header">
          <!-- 导入方式选择 -->
          <n-radio-group v-model:value="importMethod" class="import-method-tabs" size="small">
            <n-radio-button value="manual">
              手动输入
            </n-radio-button>
            <n-radio-button value="url">
              URL 获取
            </n-radio-button>
            <n-radio-button value="bin">
              BIN 获取
            </n-radio-button>
          </n-radio-group>
        </div>
        <div class="card-body">
          <ManualTokenForm @cancel="() => showImportForm = false" @ok="() => showImportForm = false"
            v-if="importMethod === 'manual'" />
          <UrlTokenForm @cancel="() => showImportForm = false" @ok="() => showImportForm = false"
            v-if="importMethod === 'url'" />
          <BinTokenForm @cancel="() => showImportForm = false" @ok="() => showImportForm = false"
            v-if="importMethod === 'bin'" />
        </div>
      </n-modal>

      <!-- 功能卡片区域 -->
      <div class="feature-cards-container" v-if="tokenStore.hasTokens">
        <!-- 阵容助手卡片 -->
        <UnlimitedlineCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 怪异塔卡片 -->
        <WeirdTowerCard 
          :selected-token-id="selectedTokenId"
        />
      </div>

      <!-- Token 选择区域 -->
      <div class="tokens-section" v-if="tokenStore.hasTokens">
        <div class="section-header">
          <h2>选择 Token</h2>
          <div class="header-actions">
            <n-button @click="showImportForm = true" type="primary" size="small">
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              添加 Token
            </n-button>
            <n-button @click="refreshAllTokens" size="small">
              <template #icon>
                <n-icon><Refresh /></n-icon>
              </template>
              刷新所有
            </n-button>
          </div>
        </div>

        <div class="tokens-grid">
          <a-card v-for="(token, index) in sortedTokens" :key="token.id" :class="{
            'token-card': true,
            active: selectedTokenId === token.id
          }" @click="selectToken(token)">
            <template #title>
              <a-space class="token-name">
                <span class="token-index">{{ index + 1 }}.</span>
                <span class="token-name-text" @click.stop="selectToken(token)">{{ token.name || '未命名' }}</span>
                <a-tag color="red" v-if="token.server">{{ token.server }}</a-tag>
                <a-badge v-if="getTokenStyle(token.id)" :status="getTokenStyle(token.id)" :text="getConnectionStatusText(token.id)" />
                <span v-else class="connection-status">{{ getConnectionStatusText(token.id) }}</span>
              </a-space>
            </template>
            <template #extra>
              <n-dropdown :options="getTokenActions(token)" @select="(key) => handleTokenAction(key, token)">
                <n-button text>
                  <template #icon>
                    <n-icon>
                      <EllipsisHorizontal />
                    </n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </template>
          </a-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { Add, Refresh, TrashBin, EllipsisHorizontal, Star, Home, Create, SyncCircle } from '@vicons/ionicons5'
import ManualTokenForm from '@/views/TokenImport/manual.vue'
import UrlTokenForm from '@/views/TokenImport/url.vue'
import BinTokenForm from '@/views/TokenImport/bin.vue'

// 导入模块化卡片组件
import UnlimitedlineCard from '@/diy/ResourceManagement/Unlimitedline.vue'
import WeirdTowerCard from '@/diy/ResourceManagement/WeirdTowerCard.vue'

const router = useRouter()
const tokenStore = useTokenStore()
const message = useMessage()

const showImportForm = ref(!tokenStore.hasTokens)
const importMethod = ref('manual')
const selectedTokenId = ref(null)
const connectingTokens = ref(new Set())
const refreshingTokens = ref(new Set())

// 排序后的 Token 列表
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// 选择 Token
const selectToken = (token) => {
  if (selectedTokenId.value === token.id) return
  
  selectedTokenId.value = token.id
  tokenStore.selectToken(token.id, true)
}

// 刷新所有 Token
const refreshAllTokens = async () => {
  try {
    const refreshPromises = tokenStore.gameTokens.map(token => 
      tokenStore.refreshToken(token.id).then(() => {
        refreshingTokens.value.delete(token.id)
      }).catch(error => {
        console.error(`Token 刷新失败 [${token.id}]:`, error)
        refreshingTokens.value.delete(token.id)
      })
    )
    
    await Promise.all(refreshPromises)
    message.success('所有 Token 刷新完成')
  } catch (error) {
    message.error('刷新 Token 时发生错误')
  }
}

// 获取 Token 样式
const getTokenStyle = (tokenId) => {
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status === 'connected') return 'success'
  if (status === 'connecting') return 'processing'
  if (status === 'disconnected') return 'error'
  return 'warning'
}

// 获取连接状态文本
const getConnectionStatusText = (tokenId) => {
  const status = tokenStore.getWebSocketStatus(tokenId)
  const statusMap = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '已断开',
    closed: '已关闭'
  }
  return statusMap[status] || '未知'
}

// 获取 Token 操作菜单
const getTokenActions = (token) => {
  return [
    {
      label: '编辑',
      key: 'edit',
      icon: () => h('n-icon', null, { default: () => h(Create) })
    },
    {
      label: '刷新',
      key: 'refresh',
      icon: () => h('n-icon', null, { default: () => h(SyncCircle) })
    },
    {
      label: '删除',
      key: 'delete',
      icon: () => h('n-icon', null, { default: () => h(TrashBin) }),
      props: {
        style: 'color: #ff4d4f;'
      }
    }
  ]
}

// 处理 Token 操作
const handleTokenAction = async (key, token) => {
  switch (key) {
    case 'edit':
      // TODO: 实现编辑功能
      message.info('编辑功能开发中')
      break
    case 'refresh':
      refreshingTokens.value.add(token.id)
      try {
        await tokenStore.refreshToken(token.id)
        message.success('Token 刷新成功')
      } catch (error) {
        message.error(`Token 刷新失败：${error.message}`)
      } finally {
        refreshingTokens.value.delete(token.id)
      }
      break
    case 'delete':
      tokenStore.removeToken(token.id)
      message.success('Token 已删除')
      if (selectedTokenId.value === token.id) {
        selectedTokenId.value = null
      }
      break
  }
}

// 监听 Token 变化
watch(() => tokenStore.gameTokens.length, (newLength) => {
  if (newLength === 0) {
    showImportForm.value = true
  }
})
</script>

<style scoped>
/* CSS 变量定义 */
.common-tasks-page {
  --spacing-lg: 1.5rem;
  --border-radius-large: 12px;
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.08);
  --border-color: #d9d9d9;
  --background-color: #fff;
  --text-secondary: #666;
  --primary-color: #1890ff;
  --primary-color-hover: #40a9ff;
  --transition-fast: 0.15s ease;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-semibold: 600;
  
  min-height: 100vh;
  background: linear-gradient(135deg, #1890ff, #722ed1);
  padding: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  margin-top: 1rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(135deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 功能卡片容器样式 */
.feature-cards-container {
  margin-bottom: var(--spacing-lg);
  display: grid;
  grid-template-columns: repeat(2, minmax(320px, 1fr));
  gap: 1rem;
  
  > * {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-large);
    box-shadow: var(--shadow-light);
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.tokens-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;

    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .tokens-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .token-card {
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      min-height: 240px;

      .token-index {
        font-weight: bold;
        color: var(--text-secondary);
        min-width: 20px;
      }

      .token-name-text {
        cursor: pointer;
        color: var(--primary-color);
        text-decoration: none;
        transition: color var(--transition-fast);

        &:hover {
          color: var(--primary-color-hover);
          text-decoration: underline;
        }
      }

      .connection-status {
        font-size: 12px;
        color: #999;
      }

      .token-name {
        font-weight: 600;
        font-size: 1.1rem;
      }
    }

    .token-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .token-card.active {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
}
</style>
