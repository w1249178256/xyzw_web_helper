<template>
  <div class="fish-helper-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1>一键金鱼</h1>
        </div>
      </div>

      <!-- Token导入区域 -->
      <n-modal v-model:show="showImportForm" width="40rem" :default-visible="!tokenStore.hasTokens">
        <template #header>
          <h2>
            <n-icon>
              <Add />
            </n-icon>
            添加游戏Token
          </h2>
        </template>
        <div class="card-header">
          <!-- 导入方式选择 -->
          <n-radio-group v-model:value="importMethod" class="import-method-tabs" size="small">
            <n-radio-button value="manual">
              手动输入
            </n-radio-button>
            <n-radio-button value="url">
              URL获取
            </n-radio-button>
            <n-radio-button value="bin">
              BIN获取
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
        <!-- 黑市购买设置卡片 -->
        <BlackMarketPurchaseCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 养号卡片 -->
        <AccountMaintenanceCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 资源管理卡片 -->
        <ResourceManagementCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 金鱼资源信息卡片 -->
        <FishResourceCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 爬塔升星卡片 -->
        <TowerStarUpgradeCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 怪异塔卡片 -->
        <WeirdTowerCard 
          :selected-token-id="selectedTokenId"
        />
      </div>

      <!-- Token选择区域 -->
      <div class="tokens-section" v-if="tokenStore.hasTokens">
        <div class="section-header">
          <h2>选择Token</h2>
          <div class="header-actions">
            <n-button @click="showImportForm = true" type="primary" size="small">
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              添加Token
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { Add, Refresh, TrashBin, EllipsisHorizontal, Star, Home, Create, SyncCircle } from '@vicons/ionicons5'
import ManualTokenForm from '@/views/TokenImport/manual.vue'
import UrlTokenForm from '@/views/TokenImport/url.vue'
import BinTokenForm from '@/views/TokenImport/bin.vue'

// 导入模块化卡片组件
import BlackMarketPurchaseCard from '@/diy/OneClickGoldFish/BlackMarketPurchaseCard.vue'
import AccountMaintenanceCard from '@/diy/OneClickGoldFish/AccountMaintenanceCard.vue'
import ResourceManagementCard from '@/diy/OneClickGoldFish/ResourceManagementCard.vue'
import TowerStarUpgradeCard from '@/diy/OneClickGoldFish/TowerStarUpgradeCard.vue'
import FishResourceCard from '@/diy/OneClickGoldFish/FishResourceCard.vue'
import WeirdTowerCard from '@/diy/OneClickGoldFish/WeirdTowerCard.vue'

const router = useRouter()
const tokenStore = useTokenStore()
const message = useMessage()

const showImportForm = ref(!tokenStore.hasTokens)
const importMethod = ref('manual')
const selectedTokenId = ref(null)
const connectingTokens = ref(new Set())
const refreshingTokens = ref(new Set())

// 选择Token（采用token管理代码，自动连接游戏）
const selectToken = (token, forceReconnect = false) => {
  const isAlreadySelected = selectedTokenId.value === token.id
  const connectionStatus = tokenStore.getWebSocketStatus(token.id)

  // 如果已经选中且已连接，不执行任何操作
  if (
    isAlreadySelected &&
    connectionStatus === 'connected' &&
    !forceReconnect
  ) {
    message.info(`${token.name} 已选中且已连接`)
    return
  }

  // 如果已经选中但正在连接，也不执行操作
  if (
    isAlreadySelected &&
    connectionStatus === 'connecting' &&
    !forceReconnect
  ) {
    message.info(`${token.name} 正在连接中...`)
    return
  }

  // 选择token（带智能连接判断）
  selectedTokenId.value = token.id
  const result = tokenStore.selectToken(token.id, forceReconnect)

  if (result) {
    if (forceReconnect) {
      message.success(`强制重连：${token.name}`)
    } else if (isAlreadySelected) {
      message.success(`重新连接：${token.name}`)
    } else {
      message.success(`已选择：${token.name}`)
    }
  } else {
    message.warning(`选择Token失败：${token.name}`)
  }
}

// 获取Token样式
const getTokenStyle = (tokenId) => {
  const connection = tokenStore.wsConnections[tokenId]
  if (connection?.status === 'connected') return 'success'
  if (connection?.status === 'connecting') return 'processing'
  return null // 返回 null 而不是 'default'，因为 a-badge 不接受 'default'
}

// 获取连接状态文本
const getConnectionStatusText = (tokenId) => {
  const connection = tokenStore.wsConnections[tokenId]
  if (connection?.status === 'connected') return '已连接'
  if (connection?.status === 'connecting') return '连接中'
  return '未连接'
}

// 获取连接状态类型（用于标签颜色）
const getConnectionStatusType = (tokenId) => {
  const connection = tokenStore.wsConnections[tokenId]
  if (connection?.status === 'connected') return 'success'
  if (connection?.status === 'connecting') return 'warning'
  return 'error'
}

// 按token昵称排序的token列表
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// 点击游戏昵称连接token（保留兼容性）
const connectToken = (token) => {
  selectToken(token, true)
}

// 掩码显示Token
const maskToken = (token) => {
  if (!token) return ''
  if (token.length <= 8) return token
  return token.substring(0, 8) + '***' + token.substring(token.length - 8)
}

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '未知'
  const date = new Date(timeString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// 获取Token操作菜单
const getTokenActions = (token) => {
  const options = [
    {
      label: '刷新',
      key: 'refresh',
      icon: () => h(NIcon, null, { default: () => h(Refresh) })
    },
    {
      label: '编辑',
      key: 'edit',
      icon: () => h(NIcon, null, { default: () => h(Create) })
    },
    {
      label: '删除',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashBin) })
    }
  ]

  // 如果是URL获取的Token，显示刷新选项
  if (token.importMethod === 'url' && token.sourceUrl) {
    options.unshift({
      label: '从URL刷新',
      key: 'refresh-url',
      icon: () => h(NIcon, null, { default: () => h(SyncCircle) })
    })
  }

  return options
}

// 处理Token菜单操作
const handleTokenAction = (action, token) => {
  switch (action) {
    case 'refresh':
      refreshToken(token)
      break
    case 'refresh-url':
      refreshTokenFromUrl(token)
      break
    case 'edit':
      editToken(token)
      break
    case 'delete':
      removeToken(token.id)
      break
  }
}

// 刷新单个Token
const refreshToken = async (token) => {
  try {
    refreshingTokens.value.add(token.id)
    await tokenStore.refreshToken(token.id)
    message.success(`Token ${token.name} 刷新成功`)
  } catch (error) {
    console.error('刷新Token失败:', error)
    message.error(`刷新Token失败: ${error.message}`)
  } finally {
    refreshingTokens.value.delete(token.id)
  }
}

// 从URL刷新Token
const refreshTokenFromUrl = async (token) => {
  if (!token.sourceUrl) {
    message.warning('该Token没有配置来源URL')
    return
  }
  
  try {
    refreshingTokens.value.add(token.id)
    // 这里需要实现从URL刷新Token的逻辑
    message.info(`正在从URL刷新Token: ${token.name}`)
  } catch (error) {
    console.error('从URL刷新Token失败:', error)
    message.error(`从URL刷新Token失败: ${error.message}`)
  } finally {
    refreshingTokens.value.delete(token.id)
  }
}

// 编辑Token
const editToken = (token) => {
  message.info(`编辑Token: ${token.name}`)
  // 这里需要实现编辑Token的逻辑
}

// 升级为长期有效
const upgradeTokenToPermanent = (token) => {
  tokenStore.upgradeTokenToPermanent(token.id)
  message.success('Token已升级为长期有效')
}

// 开始一键金鱼管理
const startFishHelperManagement = (token) => {
  selectedTokenId.value = token.id
  connectingTokens.value.add(token.id)
  setTimeout(() => {
    connectingTokens.value.delete(token.id)
  }, 1000)
}

// 刷新所有Token
const refreshAllTokens = async () => {
  try {
    message.info('开始刷新所有Token信息...')
    await tokenStore.refreshAllTokens()
    message.success('所有Token信息刷新完成')
  } catch (error) {
    console.error('刷新Token失败:', error)
    message.error('刷新Token失败')
  }
}

// 删除Token
const removeToken = (tokenId) => {
  tokenStore.removeToken(tokenId)
  message.success('Token已删除')
  
  // 如果删除的是当前选中的Token，清空选择
  if (selectedTokenId.value === tokenId) {
    selectedTokenId.value = null
  }
}

// 资源管理、爬塔升星、金鱼相关方法（业务逻辑已移至对应子卡片）
</script>

<style scoped lang="scss">
.token-import-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
  padding-top: 80px;
}

/* 深色主题下的页面背景 */
[data-theme="dark"] .token-import-page {
  background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
}

// 导航栏
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  padding: var(--spacing-md) 0;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-menu-button {
  display: none;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-small);
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: white;
}

.nav-menu {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex: 1;
  margin-right: var(--spacing-md);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-medium);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: all var(--transition-fast);
  font-size: var(--font-size-md);
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.router-link-active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .n-icon {
    font-size: var(--font-size-lg);
  }
}

.nav-actions {
  display: flex;
  gap: var(--spacing-sm);
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

.drawer-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .nav-actions {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
    margin-left: auto;
  }
}

/* CSS变量定义 */
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --border-radius-small: 4px;
  --border-radius-medium: 6px;
  --border-radius-large: 8px;
  --border-radius-xl: 12px;
  --border-radius-full: 50%;
  
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  --primary-color-rgb: 24, 144, 255;
  --primary-color: #1890ff;
  --text-primary: #000;
  --text-secondary: #666;
  --border-color: #d9d9d9;
  --background-color: #fff;
  
  --z-fixed: 1000;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-semibold: 600;
  --transition-fast: 0.15s ease;
  --primary-color-light: rgba(24, 144, 255, 0.1);
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
  margin-top: 1rem;

  .header-content {
    text-align: center;

    h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0;
      background: linear-gradient(135deg, #1890ff, #722ed1);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }
}

.card-header {
  margin-bottom: 1rem;
}

.import-method-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
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
        min-height: 240px; /* 增加卡片最小高度 */

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

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        &.active {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        .token-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .ant-card-head-title {
          padding: 12px 16px !important;
        }

        /* 去除卡片底部横线和空白 */
        &:deep(.ant-card-head) {
          border-bottom: none;
        }

        &:deep(.ant-card-body) {
          padding: 0;
          margin: 0;
        }

        /* 调整extra区域样式 */
        &:deep(.ant-card-extra) {
          padding: 12px 16px !important;
          min-height: 80px; /* 确保两行按钮有足够空间 */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      }
    }
  }

  /* Token按钮样式已集成到卡片标题栏 */

  /* 确保卡片没有额外的底部边距或内边距 */
  :deep(.ant-card) {
    border: none;
    box-shadow: none;
    margin-bottom: 0;
    overflow: hidden;
  }

  :deep(.ant-card-head) {
    min-height: auto;
    padding: 12px 16px;
    border-bottom: none;
  }

  :deep(.ant-card-body) {
    padding: 0;
    margin: 0;
  }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

:deep(.n-modal-header) {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

:deep(.n-modal-body) {
  padding: 1.5rem;
}

:deep(.n-card) {
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

:deep(.n-radio-group) {
  display: flex;
  justify-content: center;
  width: 100%;
}

:deep(.n-dropdown-option) {
  cursor: pointer;
}

:deep(.n-button) {
  transition: all 0.3s ease;
}

:deep(.a-badge) {
  margin-left: 0.5rem;
}

:deep(.n-empty) {
  margin: 4rem 0;
  color: var(--text-secondary);
}

.connection-status {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-left: 0.5rem;
}
</style>