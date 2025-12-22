<template>
  <a-card>
    <template #extra>
      <div class="header-actions">
        <n-button size="small" @click="refreshTokens">
          <template #icon>
            <n-icon>
              <Refresh />
            </n-icon>
          </template>
          <span class="btn-text">刷新</span>
        </n-button>
        <n-button size="small" type="warning" @click="exportTokens">
          <template #icon>
            <i class="i-mdi:download"></i>
          </template>
          <span class="btn-text">导出</span>
        </n-button>
        <n-upload :show-file-list="false" accept=".json" @change="importTokens">
          <n-button size="small" type="info">
            <template #icon>
              <n-icon>
                <CloudUpload />
              </n-icon>
            </template>
            <span class="btn-text">导入</span>
          </n-button>
        </n-upload>
      </div>
    </template>
    <template #default>
      <!-- 用户Token -->
      <div class="token-section">
        <h4>用户认证Token</h4>
        <div v-if="localTokenStore.userToken" class="token-item">
          <div class="token-info">
            <span class="token-label">Token:</span>
            <span class="token-value">{{ maskToken(localTokenStore.userToken) }}</span>
          </div>
          <n-button size="tiny" type="error" @click="clearUserToken">
            清除
          </n-button>
        </div>
        <div v-else class="empty-token">
          <span>未设置用户Token</span>
        </div>
      </div>
      <!-- 游戏Token列表 -->
      <div class="token-section">
        <h4>游戏角色Token ({{ Object.keys(localTokenStore.gameTokens).length }}个)</h4>
        <div class="game-tokens-list">
          <div v-for="(tokenData, roleId) in gameTokens" :key="roleId" class="game-token-item">
            <div class="token-header">
              <div class="role-info">
                <span class="role-name">{{ tokenData.roleName }}</span>
                <span class="role-server">{{ tokenData.server }}</span>
              </div>
              <div class="token-actions">
                <n-button size="tiny" :type="getWSStatus(roleId) === 'connected' ? 'success' : 'default'"
                  @click="toggleWebSocket(roleId, tokenData)">
                  {{ getWSStatus(roleId) === 'connected' ? '断开WS' : '连接WS' }}
                </n-button>

                <n-dropdown :options="getTokenMenuOptions(tokenData)" trigger="click"
                  @select="handleTokenAction($event, roleId, tokenData)">
                  <n-button size="tiny" type="tertiary">
                    <template #icon>
                      <n-icon>
                        <EllipsisHorizontal />
                      </n-icon>
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
            </div>

            <div class="token-details">
              <div class="detail-item">
                <span class="detail-label">Token:</span>
                <span class="detail-value">{{ maskToken(tokenData.token) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">WebSocket URL:</span>
                <span class="detail-value">{{ tokenData.wsUrl }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">创建时间:</span>
                <span class="detail-value">{{ formatTime(tokenData.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">最后使用:</span>
                <span class="detail-value">{{ formatTime(tokenData.lastUsed) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">连接状态:</span>
                <n-tag size="small" :type="getWSStatusType(getWSStatus(roleId))">
                  {{ getWSStatusText(getWSStatus(roleId)) }}
                </n-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- 批量操作 -->
    <template #actions>
      <n-button type="warning" @click="cleanExpiredTokens">
        清理过期Token
      </n-button>
      <n-button type="error" @click="clearAllTokens">
        清除所有Token
      </n-button>
    </template>
  </a-card>
</template>

<script setup>
import { ref, h } from 'vue'
import { useMessage, useDialog, NIcon } from 'naive-ui'
import { gameTokens } from "@/stores/tokenStore";
import { useLocalTokenStore, } from '@/stores/localTokenManager'
import { useGameRolesStore } from '@/stores/gameRoles'
import {
  Refresh,
  Download,
  CloudUpload,
  EllipsisHorizontal,
  Create,
  TrashBin,
  SyncCircle,
  CopyOutline
} from '@vicons/ionicons5'

const message = useMessage()
const dialog = useDialog()
const localTokenStore = useLocalTokenStore()
const gameRolesStore = useGameRolesStore()

// 方法
const maskToken = (token) => {
  if (!token) return ''
  const len = token.length
  if (len <= 8) return token
  return token.substring(0, 8) + '***' + token.substring(len - 8)
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getWSStatus = (roleId) => {
  return localTokenStore.getWebSocketStatus(roleId)
}

const getWSStatusType = (status) => {
  switch (status) {
    case 'connected': return 'success'
    case 'error': return 'error'
    case 'connecting': return 'warning'
    default: return 'default'
  }
}

const getWSStatusText = (status) => {
  switch (status) {
    case 'connected': return '已连接'
    case 'error': return '连接错误'
    case 'connecting': return '连接中'
    default: return '未连接'
  }
}

// 获取Token菜单选项
const getTokenMenuOptions = (tokenData) => {
  const options = [
    {
      label: '编辑',
      key: 'edit',
      icon: () => h(NIcon, null, { default: () => h(Create) })
    },
    {
      label: '复制Token',
      key: 'copy',
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
    }
  ]

  // 如果是URL获取的Token，显示刷新选项
  if (tokenData.importMethod === 'url' && tokenData.sourceUrl) {
    options.unshift({
      label: '从URL刷新',
      key: 'refresh-url',
      icon: () => h(NIcon, null, { default: () => h(SyncCircle) })
    })
  } else {
    // 手动添加的Token显示重新生成选项
    options.unshift({
      label: '刷新Token',
      key: 'refresh',
      icon: () => h(NIcon, null, { default: () => h(Refresh) })
    })
  }

  options.push(
    { type: 'divider' },
    {
      label: '删除',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashBin) })
    }
  )

  return options
}

// 处理Token菜单操作
const handleTokenAction = (action, roleId, tokenData) => {
  switch (action) {
    case 'edit':
      editToken(roleId, tokenData)
      break
    case 'copy':
      copyToken(tokenData.token)
      break
    case 'refresh':
      regenerateToken(roleId)
      break
    case 'refresh-url':
      refreshTokenFromUrl(roleId, tokenData)
      break
    case 'delete':
      removeToken(roleId)
      break
  }
}

const refreshTokens = () => {
  localTokenStore.initTokenManager()
  message.success('Token数据已刷新')
}

const clearUserToken = () => {
  dialog.warning({
    title: '清除用户Token',
    content: '确定要清除用户认证Token吗？这将会退出登录。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      localTokenStore.clearUserToken()
      message.success('用户Token已清除')
    }
  })
}

const toggleWebSocket = (roleId, tokenData) => {
  const status = getWSStatus(roleId)

  if (status === 'connected') {
    localTokenStore.closeWebSocketConnection(roleId)
    message.info('WebSocket连接已断开')
  } else {
    try {
      localTokenStore.createWebSocketConnection(roleId, tokenData.token, tokenData.wsUrl)
      message.success('正在建立WebSocket连接...')
    } catch (error) {
      message.error('建立WebSocket连接失败')
    }
  }
}

const regenerateToken = (roleId) => {
  const oldTokenData = localTokenStore.getGameToken(roleId)
  if (!oldTokenData) {
    message.error('找不到对应的Token数据')
    return
  }

  // 检查是否有源URL可以重新获取
  if (!oldTokenData.sourceUrl) {
    message.warning('该Token没有配置源地址，无法重新生成。请手动重新导入Token。')
    return
  }

  dialog.info({
    title: '重新获取Token',
    content: '确定要从源地址重新获取此角色的Token吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 显示加载状态
        const loadingMsg = message.loading('正在重新获取Token...', { duration: 0 })

        // 从源URL重新获取token
        let response
        const sourceUrl = oldTokenData.sourceUrl

        // 使用与TokenImport相同的跨域处理逻辑
        const isLocalUrl = sourceUrl.startsWith(window.location.origin) ||
          sourceUrl.startsWith('/') ||
          sourceUrl.startsWith('http://localhost') ||
          sourceUrl.startsWith('http://127.0.0.1')

        if (isLocalUrl) {
          response = await fetch(sourceUrl)
        } else {
          try {
            response = await fetch(sourceUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              mode: 'cors'
            })
          } catch (corsError) {
            throw new Error(`跨域请求被阻止。请确保目标服务器支持CORS。错误详情: ${corsError.message}`)
          }
        }

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.token) {
          throw new Error('返回数据中未找到token字段')
        }

        // 更新token
        localTokenStore.updateGameToken(roleId, {
          token: data.token,
          server: data.server || oldTokenData.server,
          regeneratedAt: new Date().toISOString(),
          lastRefreshed: new Date().toISOString()
        })

        // 如果当前token有连接，需要重新连接
        if (localTokenStore.getWebSocketStatus(roleId) === 'connected') {
          localTokenStore.closeWebSocketConnection(roleId)
          setTimeout(() => {
            localTokenStore.createWebSocketConnection(roleId, data.token, oldTokenData.wsUrl)
          }, 500)
        }

        loadingMsg.destroy()
        message.success('Token已成功重新获取')
      } catch (error) {
        console.error('重新获取Token失败:', error)
        message.error(error.message || 'Token重新获取失败')
      }
    }
  })
}

const removeToken = (roleId) => {
  dialog.warning({
    title: '删除Token',
    content: '确定要删除此角色的游戏Token吗？这将断开相关的WebSocket连接。',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      localTokenStore.removeGameToken(roleId)
      message.success('Token已删除')
    }
  })
}

// 编辑Token（暂时显示提示信息，后续可以实现编辑功能）
const editToken = (roleId, tokenData) => {
  message.info('编辑功能正在开发中')
}

// 复制Token到剪贴板
const copyToken = async (token) => {
  try {
    await navigator.clipboard.writeText(token)
    message.success('Token已复制到剪贴板')
  } catch (error) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = token
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    message.success('Token已复制到剪贴板')
  }
}

// 从URL刷新Token
const refreshTokenFromUrl = async (roleId, tokenData) => {
  if (!tokenData.sourceUrl) {
    message.warning('该Token没有配置源URL')
    return
  }

  dialog.info({
    title: '从URL刷新Token',
    content: `确定要从源URL重新获取Token吗？\n源地址：${tokenData.sourceUrl}`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const loadingMsg = message.loading('正在从URL获取新Token...', { duration: 0 })

        // 使用与TokenImport相同的逻辑获取Token
        let response
        const isLocalUrl = tokenData.sourceUrl.startsWith(window.location.origin) ||
          tokenData.sourceUrl.startsWith('/') ||
          tokenData.sourceUrl.startsWith('http://localhost') ||
          tokenData.sourceUrl.startsWith('http://127.0.0.1')

        if (isLocalUrl) {
          response = await fetch(tokenData.sourceUrl)
        } else {
          // 跨域请求，使用代理
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(tokenData.sourceUrl)}`
          response = await fetch(proxyUrl)
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        if (!data.token) {
          throw new Error('返回数据中未找到token字段')
        }

        // 更新Token
        localTokenStore.updateGameToken(roleId, {
          token: data.token,
          lastUsed: new Date().toISOString()
        })

        loadingMsg.destroy()
        message.success('Token刷新成功')
      } catch (error) {
        console.error('URL刷新Token失败:', error)
        message.error('刷新失败: ' + error.message)
      }
    }
  })
}

const exportTokens = () => {
  try {
    const tokenData = localTokenStore.exportTokens()
    const dataStr = JSON.stringify(tokenData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `tokens_backup_${new Date().toISOString().split('T')[0]}.json`
    link.click()

    message.success('Token数据已导出')
  } catch (error) {
    message.error('导出失败: ' + error.message)
  }
}

const importTokens = ({ file }) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const tokenData = JSON.parse(e.target.result)
      const result = localTokenStore.importTokens(tokenData)

      if (result.success) {
        message.success(result.message)
        // 刷新游戏角色数据
        gameRolesStore.fetchGameRoles()
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error('导入失败：文件格式错误')
    }
  }
  reader.readAsText(file.file)
}

const cleanExpiredTokens = () => {
  dialog.info({
    title: '清理过期Token',
    content: '确定要清理超过24小时未使用的Token吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      const cleanedCount = localTokenStore.cleanExpiredTokens()
      message.success(`已清理 ${cleanedCount} 个过期Token`)
    }
  })
}

const clearAllTokens = () => {
  dialog.error({
    title: '清除所有Token',
    content: '确定要清除所有游戏Token吗？这将断开所有WebSocket连接。此操作不可恢复！',
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: () => {
      localTokenStore.clearAllGameTokens()
      message.success('所有游戏Token已清除')
    }
  })
}
</script>

<style scoped lang="scss">
.token-manager {
  background: white;
  border-radius: var(--border-radius-large);
  padding: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
  }
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.token-section {
  margin-bottom: var(--spacing-lg);

  h4 {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--text-primary);
    font-size: var(--font-size-md);
  }
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.token-info {
  display: flex;
  gap: var(--spacing-md);
}

.token-label {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.token-value {
  font-family: monospace;
  color: var(--text-primary);
}

.empty-token {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.game-tokens-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.game-token-item {
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.role-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.role-server {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.token-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.token-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.detail-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-family: monospace;
  word-break: break-all;
}

.bulk-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 768px) {
  .header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn-text {
    display: none;
  }

  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .token-item {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .token-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .token-details {
    grid-template-columns: 1fr;
  }

  .bulk-actions {
    flex-direction: column;
  }
}
</style>