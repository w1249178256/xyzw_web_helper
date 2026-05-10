<template>
  <div class="shidian-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1>十殿</h1>
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
        
        <!-- 十殿 TeamID 卡片 -->
        <ShiDianTeamIdCard 
          :selected-token-id="selectedTokenId"
          @update-pillow-count="handleUpdatePillowCount"
          @join-token="handleJoinTokenFromTeamIdCard"
          @auto-join-shidian="autoJoinShiDian"
          @clear-nightmare-labels="handleClearNightmareLabels"
        />

        <!-- 俱乐部管理卡片 -->
        <ClubManagementCard
          :selected-token-id="selectedTokenId"
          :is-running="isClubRunning"
          :has-club="hasClub"
          :club-name="clubName"
          :member-count="memberCount"
          :club-power="clubPower"
          :is-signed-in="isClubSignedIn"
          @refresh-club-info="handleRefreshClubInfo"
          @sign-in-club="handleSignInClub"
          @view-club-details="handleViewClubDetails"
          @batch-fetch-club-info="handleBatchFetchClubInfo"
          @handle-legion-tokens-input="handleLegionTokensInput"
          @handle-legion-id-input="handleLegionIdInput"
        />

        <!-- 暑期活动卡片 -->
        <SummerActivityCard />

        <!-- 灯神信息卡片 -->
        <LampGodInfoCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 武将信息卡片 -->
        <HeroInfoCard 
          :selected-token-id="selectedTokenId"
        />

        <!-- 十殿信息卡片 -->
        <ShiDianInfoCard 
          ref="shidianInfoCardRef"
          :selected-token-id="selectedTokenId"
          :team-id="teamId"
          @update-pillow-count="handleUpdatePillowCount"
        />
      </div>

      <!-- Token选择区域 -->
      <div class="tokens-section" v-if="tokenStore.hasTokens">
        <div class="section-header">
          <h2>选择Token</h2>
          <div class="header-actions">
            <n-input-number
              v-model:value="commandDelay"
              :min="100"
              :max="5000"
              :step="100"
              size="small"
              style="width: 120px; margin-right: 8px;"
              placeholder="执行间隔(ms)"
            >
              <template #prefix>
                <span>间隔</span>
              </template>
            </n-input-number>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon size="18" style="cursor: help; margin-right: 8px; color: #666;">
                  <HelpCircleOutline />
                </n-icon>
              </template>
              本页面所有命令均使用此间隔
            </n-tooltip>
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
                <a-badge v-if="getTokenStyle(token?.id)" :status="getTokenStyle(token?.id)" :text="getConnectionStatusText(token?.id)" />
                <span v-else class="connection-status">{{ getConnectionStatusText(token?.id) }}</span>
                <n-select
                  :value="getTokenNightmareTeamValue(token?.id)"
                  :options="nightmareTeamOptions"
                  size="small"
                  style="width: 60px; margin-left: 8px;"
                  placeholder="空"
                  clearable
                  :disabled="!token?.id"
                  @update:value="(value) => handleNightmareTeamChange(token?.id, value)"
                />
              </a-space>
            </template>
            <template #extra>
              <n-dropdown :options="getNightmareOptions(token)" @select="(key) => handleNightmareOption(key, token)">
                <n-button text size="small">
                  <template #icon>
                    <n-icon>
                      <EllipsisHorizontal />
                    </n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </template>
            <template #default>
              <!-- 按钮区域（第一行，换行显示） -->
              <div style="display: flex; gap: 8px; width: 100%; margin-bottom: 8px;">
                <CustomizedCard
                  mode="button-count"
                  name="十殿枕头"
                  :count="tokenPillowCount[token?.id] || 0"
                  :loading="connectingTokens.has(token?.id)"
                  :disabled="false"
                  @button-click="getPillowCount(token.id)"
                  style="flex: 1;"
                />
                <CustomizedCard
                  mode="button"
                  name="加入十殿"
                  :loading="connectingTokens.has(token?.id)"
                  :disabled="connectingTokens.has(token?.id)"
                  @button-click="() => joinShiDian(token, tokenNightmareTeam[token?.id])"
                  style="flex: 1;"
                />
              </div>
              
              <!-- 下拉框区域（第二行，换行显示） -->
              <!-- 已移除类型、宝库、十殿队员下拉框 -->
              
            </template>
          </a-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useTokenStore } from '@/stores/tokenStore'
import { useNightmareExecutionStore } from '@/stores/nightmareExecutionStore'
import { useMessage, useDialog } from 'naive-ui'
import { Add, Refresh, TrashBin, EllipsisHorizontal, Star, Home, Create, SyncCircle, Key, Gift, People, HelpCircleOutline } from '@vicons/ionicons5'
import ManualTokenForm from '@/views/TokenImport/manual.vue'
import UrlTokenForm from '@/views/TokenImport/url.vue'
import BinTokenForm from '@/views/TokenImport/bin.vue'

// 导入模块化卡片组件
import ShiDianInfoCard from '@/diy/ShiDian/ShiDianInfoCard.vue'
import ShiDianTeamIdCard from '@/diy/ShiDian/ShiDianTeamIdCard.vue'
import LampGodInfoCard from '@/diy/ShiDian/LampGodInfoCard.vue'
import HeroInfoCard from '@/diy/ShiDian/HeroInfoCard.vue'
import ClubManagementCard from '@/diy/ShiDian/ClubManagementCard.vue'
import SummerActivityCard from '@/diy/ShiDian/SummerActivityCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import { savePageTokenCards, loadPageTokenCards } from '@/utils/pageTokenStorage'
import { logOperation } from '@/utils/operationLogger'

const router = useRouter()
const tokenStore = useTokenStore()
const message = useMessage()
const dialog = useDialog()
const executionStore = useNightmareExecutionStore()

const showImportForm = ref(!tokenStore.hasTokens)
const importMethod = ref('manual')
const selectedTokenId = ref(null)
const connectingTokens = ref(new Set())
const refreshingTokens = ref(new Set())
const teamId = ref('')
const teamIds = ref(['', '', '', '', '']) // 五个十殿的 teamId
const shidianInfoCardRef = ref(null)
const commandDelay = ref(800) // 执行间隔（毫秒）

// 提供执行间隔给子组件
provide('commandDelay', commandDelay)

// 辅助函数：获取 token 的序号（基于名称排序后的顺序）
const getTokenIndex = (token) => {
  const index = sortedTokens.value.findIndex(t => t.id === token.id)
  return index + 1
}

// 辅助函数：获取 token 的十殿队伍值
const getTokenNightmareTeamValue = (tokenId) => {
  if (!tokenId) return null
  const value = tokenNightmareTeam.value[tokenId]
  // 如果值不存在或为 null，返回 null（对应"空"选项）
  if (value === null || value === undefined) {
    return null
  }
  // 否则返回实际的值（包括 0）
  return value
}

// 十殿队伍选项（一到五 + 空 + 已打）
const nightmareTeamOptions = [
  { label: '空', value: null },
  { label: '已打', value: 0 },
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 }
]

// 每个 token 的下拉框选择值
const tokenNightmareTeam = ref({}) // tokenId -> nightmareTeam (1-5)
const tokenPillowCount = ref({}) // tokenId -> pillowCount (十殿枕头数量，保存到 localStorage)
const pillowCount = ref(0) // 十殿枕头数量

// 导出相关每个 token 的信息显示状态（加入十殿后显示）
const tokenInfoDisplay = ref({}) // tokenId -> boolean

// 自动加入十殿控制
const isAutoJoinRunning = ref(false) // 是否正在执行自动加入
const abortController = ref(null) // 用于中断操作

// 俱乐部相关状态
const isClubRunning = ref(false)
const legionTokens = ref('') // 批量执行范围（用于批量俱乐部和批量功法挂机）
const hasClub = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token || !token.gameData) return false
  const legionInfo = token.gameData.legionInfo
  return !!(legionInfo?.info)
})
const clubName = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token || !token.gameData) return '未加入'
  const legionInfo = token.gameData.legionInfo
  return legionInfo?.info?.name || '未加入'
})
const memberCount = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token || !token.gameData) return 0
  const legionInfo = token.gameData.legionInfo
  const members = legionInfo?.info?.members || {}
  return Object.keys(members).length
})
const clubPower = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token || !token.gameData) return 0
  const legionInfo = token.gameData.legionInfo
  const info = legionInfo?.info || {}
  return info.power || info.s_power || 0
})
const isClubSignedIn = computed(() => {
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token || !token.gameData) return false
  const roleInfo = token.gameData.roleInfo
  const ts = Number(roleInfo?.role?.statisticsTime?.['legion:sign:in'] || 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySec = Math.floor(today.getTime() / 1000)
  return ts > todaySec
})

// 更新token的资源数据（连接游戏后调用）
const updateTokenResourceData = async (tokenId) => {
  try {
    // 等待一下确保数据已更新
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 获取最新的角色信息和十殿信息
    await tokenStore.sendGetRoleInfo(tokenId)
    await tokenStore.sendNightmareGetRoleInfo(tokenId, { roleId: tokenId })
    
    // 等待数据更新
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 保存资源数据
    await saveDropdownSettings()
    
    console.log(`Token ${tokenId} 资源数据已更新`)
  } catch (error) {
    console.error(`更新Token ${tokenId} 资源数据失败:`, error)

    // 为特定的服务器错误提供诊断信息
    if (error.message && error.message.includes('200020')) {
      console.warn(`服务器错误200020: 这通常是由于参数无效或服务器暂时不可用导致的。请检查Token有效性和网络连接。`)
    } else if (error.message && error.message.includes('服务器错误')) {
      console.warn(`检测到服务器错误: ${error.message}。这可能是临时的服务器问题，请稍后重试。`)
    }
  }
}

// 选择Token（只保留连接websocket功能）
const selectToken = async (token, forceReconnect = false) => {
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

  // 如果已经选中但正在连接，也不执行任何操作
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
      message.success(`正在强制重连：${token.name}`)
    } else if (isAlreadySelected) {
      message.success(`正在重新连接：${token.name}`)
    } else {
      message.success(`正在连接：${token.name}`)
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

// 获取十殿枕头数量
const getPillowCount = async (targetTokenId) => {
  const tokenId = targetTokenId || selectedTokenId.value
  if (!tokenId) {
    message.warning('请先选择一个Token')
    return
  }

  try {
    const token = tokenStore.gameTokens.find(t => t.id === tokenId)
    if (!token) {
      message.error('未找到选中的Token')
      return
    }

    message.info(`正在为 ${token.name || token.id} 获取十殿枕头数量...`)
    
    // 确保token已连接
    const connectionStatus = tokenStore.getWebSocketStatus(tokenId)
    if (connectionStatus !== 'connected') {
      await selectToken(token, true)
    }

    // 使用role_getroleinfo获取角色信息
    const roleInfo = await tokenStore.sendGetRoleInfo(tokenId)
    
    if (roleInfo && roleInfo.role && roleInfo.role.items) {
      // 更新token的十殿数据
      if (!token.gameData) {
        token.gameData = {}
      }
      if (!token.gameData.nightmareData) {
        token.gameData.nightmareData = {}
      }
      
      // 查找itemId为5054的物品（十殿枕头）
      const pillowItem = roleInfo.role.items['5054']
      
      if (pillowItem && pillowItem.quantity !== undefined) {
        if (!targetTokenId) {
          pillowCount.value = pillowItem.quantity
        }
        // 更新 tokenPillowCount 并保存到本地存储
        // 使用展开运算符确保响应式更新
        tokenPillowCount.value = {
          ...tokenPillowCount.value,
          [tokenId]: pillowItem.quantity
        }
        
        // 如果枕头数量 < 5，自动将十殿队伍标签设置为已打
        if (pillowItem.quantity < 5) {
          tokenNightmareTeam.value[tokenId] = 0 // 0 表示"已打"
          console.log(`Token ${tokenId} 枕头数量 ${pillowItem.quantity} < 5，已自动设置为已打`)
        }
        
        await saveDropdownSettings()
        message.success(`十殿枕头数量：${pillowItem.quantity}`)
        console.log('十殿枕头数量:', pillowItem.quantity)
      } else {
        if (!targetTokenId) {
          pillowCount.value = 0
        }
        // 更新 tokenPillowCount 并保存到本地存储
        tokenPillowCount.value = {
          ...tokenPillowCount.value,
          [tokenId]: 0
        }
        await saveDropdownSettings()
        message.warning('未找到十殿枕头信息')
      }
    } else {
      if (!targetTokenId) {
        pillowCount.value = 0
      }
      // 更新 tokenPillowCount 并保存到本地存储
      tokenPillowCount.value = {
        ...tokenPillowCount.value,
        [tokenId]: 0
      }
      await saveDropdownSettings()
      message.warning('未获取到角色信息')
    }
  } catch (error) {
    console.error('获取十殿枕头数量失败:', error)
    message.error(`获取十殿枕头数量失败: ${error.message || error}`)
    if (!targetTokenId) {
      pillowCount.value = 0
    }
    // 注意：在token不连接时，不要覆盖之前保存的十殿枕头数量
    // 只有在成功获取到新的十殿枕头数量时，才更新本地存储
  }
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

// 获取十殿选项菜单
const getNightmareOptions = (token) => {
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
  
  return options
}

// 处理十殿选项选择
const handleNightmareOption = async (key, token) => {
  switch (key) {
    case 'refresh':
      refreshToken(token)
      break
    case 'edit':
      editToken(token)
      break
    case 'delete':
      removeToken(token.id)
      break
    default:
      message.warning('无效的选项')
      return
  }
}

// 删除Token
const removeToken = (tokenId) => {
  // 从tokenStore中移除token
  tokenStore.removeToken(tokenId)
  
  message.success('Token已删除')
  
  // 如果删除的是当前选中的Token，清空选择
  if (selectedTokenId.value === tokenId) {
    selectedTokenId.value = null
  }
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
    message.info(`正在刷新Token: ${token.name}`)
    
    // 重新连接token
    await selectToken(token, true)
    
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
const editToken = async (token) => {
  // 使用prompt作为临时解决方案，因为更复杂的输入需要额外的组件
  const newRemark = prompt(`编辑Token备注 (当前: ${token.remark || '无'}):`, token.remark || '');
  
  if (newRemark !== null) { // 用户点击了确定
    try {
      // 更新token的备注
      tokenStore.updateToken(token.id, { ...token, remark: newRemark });
      message.success('Token备注已更新');
    } catch (error) {
      console.error('更新Token备注失败:', error);
      message.error(`更新Token备注失败: ${error.message}`);
    }
  } else {
    message.info('编辑已取消');
  }
}

// 升级为长期有效
const upgradeTokenToPermanent = (token) => {
  tokenStore.upgradeTokenToPermanent(token.id)
  message.success('Token已升级为长期有效')
}

// 保存下拉框选择值和信息显示状态到 localStorage
const saveDropdownSettings = async () => {
  console.log('准备保存下拉框设置:', {
    tokenNightmareTeam: tokenNightmareTeam.value,
    tokenPillowCount: tokenPillowCount.value,
    teamIds: teamIds.value
  })
  await savePageTokenCards('shidian', {
    dropdownSettings: {
      tokenNightmareTeam: tokenNightmareTeam.value,
      tokenPillowCount: tokenPillowCount.value,
      teamIds: teamIds.value
    }
  })
  console.log('下拉框设置已保存')
}

// 从 token 的 remark 字段解析下拉框值
const parseRemarkToDropdowns = () => {
  tokenStore.gameTokens.forEach(token => {
    if (!token || !token.id) {
      console.warn('Invalid token:', token)
      return
    }
    // 如果 localStorage 中已有该 token 的十殿队伍设置，优先使用 localStorage 的值
    if (tokenNightmareTeam.value[token.id] !== undefined) {
      // localStorage 中已有设置，跳过从 remark 解析
      return
    }
    
    if (token.remark) {
      const remark = token.remark.trim()
      
      // 解析十殿队伍标签（格式：殿一、殿二、殿三、殿四、殿五）
      const teamMatch = remark.match(/殿 ([一二三四五])/)
      if (teamMatch) {
        const teamMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5 }
        tokenNightmareTeam.value[token.id] = teamMap[teamMatch[1]]
      }
    }
  })
}

// 从 localStorage 和服务器加载下拉框选择值和信息显示状态
const loadDropdownSettings = async () => {
  const data = await loadPageTokenCards('shidian')
  if (data.dropdownSettings) {
    // 加载 tokenNightmareTeam、tokenPillowCount 和 teamIds
    tokenNightmareTeam.value = data.dropdownSettings.tokenNightmareTeam || {}
    tokenPillowCount.value = data.dropdownSettings.tokenPillowCount || {}
    if (data.dropdownSettings.teamIds) {
      teamIds.value = data.dropdownSettings.teamIds
    }
    console.log('下拉框设置已加载:', { 
      tokenNightmareTeam: tokenNightmareTeam.value, 
      tokenPillowCount: tokenPillowCount.value,
      teamIds: teamIds.value
    })
  } else {
    console.log('没有保存的下拉框设置')
  }
  
  // 如果 teamIds 为空，尝试从 ShiDianTeamIdCard.vue 保存的 shidian_teamIds 加载
  if (!teamIds.value.some(id => id)) {
    try {
      const savedTeamIds = localStorage.getItem('shidian_teamIds')
      if (savedTeamIds) {
        const settings = JSON.parse(savedTeamIds)
        if (settings.teamIds && Array.isArray(settings.teamIds)) {
          teamIds.value = settings.teamIds
          console.log('从 shidian_teamIds 加载 TeamIDs:', teamIds.value)
        }
      }
    } catch (error) {
      console.error('加载 shidian_teamIds 失败:', error)
    }
  }
  
  // 从 token 的 remark 字段解析下拉框值（如果 localStorage 中没有该 token 的设置，则从 remark 读取）
  parseRemarkToDropdowns()
  console.log('最终 tokenNightmareTeam:', tokenNightmareTeam.value)
}



// 处理十殿队伍变化
const handleNightmareTeamChange = async (tokenId, value) => {
  if (!tokenId) {
    console.warn('Invalid tokenId:', tokenId)
    return
  }
  
  // 确保值被正确保存（包括 0）
  tokenNightmareTeam.value[tokenId] = value
  
  console.log(`Token ${tokenId} 十殿队伍选择:`, value)
  // 保存到 localStorage 和服务器（不依赖连接状态）
  try {
    await saveDropdownSettings()
  } catch (error) {
    console.error('保存下拉框设置失败:', error)
  }
}

// 处理 TeamID 输入变化
const handleTeamIdChange = async (index, value) => {
  // 确保保存的是字符串
  const stringValue = String(value || '')
  teamIds.value[index] = stringValue
  
  console.log(`TeamID[${index}] 变化：${stringValue}`)
  
  // 保存到 localStorage
  try {
    await saveDropdownSettings()
    console.log('TeamID 已保存到 localStorage')
  } catch (error) {
    console.error('保存 TeamID 失败:', error)
  }
}

// 清空单个 TeamID
const clearSingleTeamId = (index) => {
  teamIds.value[index] = ''
}

// 清空所有 TeamID
const clearAllTeamIds = () => {
  teamIds.value = ['', '', '', '', '']
}

// 开始十殿管理
const startShiDianManagement = (token) => {
  selectedTokenId.value = token.id
  connectingTokens.value.add(token.id)
  setTimeout(() => {
    connectingTokens.value.delete(token.id)
  }, 1000)
}

// 加入十殿
const joinShiDian = async (token, teamIndex = null) => {
  if (!token) {
    message.warning('请先选择 Token')
    return
  }
  
  if (!token.id) {
    message.error('Token 信息不完整')
    return
  }

  // 如果没有指定队伍索引，使用 token 选择的队伍
  const teamIdx = teamIndex || tokenNightmareTeam.value[token.id]
  
  if (!teamIdx) {
    message.warning('请先选择十殿队伍（一到五）')
    return
  }

  // 实时从 localStorage 读取 TeamID，确保获取最新值
  let currentTeamId = null
  try {
    const savedTeamIds = localStorage.getItem('shidian_teamIds')
    if (savedTeamIds) {
      const settings = JSON.parse(savedTeamIds)
      if (settings.teamIds && Array.isArray(settings.teamIds) && settings.teamIds[teamIdx - 1]) {
        currentTeamId = settings.teamIds[teamIdx - 1]
        // 同步到本地状态
        teamIds.value[teamIdx - 1] = currentTeamId
      }
    }
  } catch (error) {
    console.error('读取 shidian_teamIds 失败:', error)
  }
  
  if (!currentTeamId) {
    message.warning(`请先在十殿 TeamID 卡片中输入十殿${['一', '二', '三', '四', '五'][teamIdx - 1]}的 TeamID`)
    return
  }

  // 直接发送加入十殿消息
  await tokenStore.selectToken(token.id)
  await new Promise(resolve => setTimeout(resolve, 500))
  
  await tokenStore.sendGameMessage(token.id, 'matchteam_join', { 
    teamId: parseInt(currentTeamId) 
  })
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  await tokenStore.sendGameMessage(token.id, 'matchteam_memberprepare', { 
    teamId: parseInt(currentTeamId),
    isPrepare: 1
  })
  
  // 设置信息显示状态为 true
  tokenInfoDisplay.value[token.id] = true
  await saveDropdownSettings()
}

// 清空所有 Token 的十殿标签
const clearAllNightmareLabels = async () => {
  console.log('clearAllNightmareLabels 被调用')
  
  try {
    await dialog.warning({
      title: '确认清空',
      content: '确定要清空所有 Token 的十殿标签（一、二、三、四、五、已打）吗？此操作不可恢复。',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        console.log('用户确认清空')
        // 创建一个新的空对象来替换旧对象，确保触发响应式更新
        const newTeamData = {}
        tokenStore.gameTokens.forEach(token => {
          if (token && token.id) {
            newTeamData[token.id] = null
          }
        })
        
        // 替换整个对象
        tokenNightmareTeam.value = newTeamData
        
        // 保存到 localStorage
        await saveDropdownSettings()
        
        console.log('清空完成，新对象:', newTeamData)
        
        // 等待 DOM 更新
        await nextTick()
        
        message.success('已清空所有 Token 的十殿标签')
      }
    })
  } catch (error) {
    console.error('清空操作出错:', error)
  }
}

// 自动加入十殿
const autoJoinShiDian = async () => {
  console.log('autoJoinShiDian 被调用')
  
  // 实时从 localStorage 读取 TeamID，确保获取最新值
  try {
    const savedTeamIds = localStorage.getItem('shidian_teamIds')
    if (savedTeamIds) {
      const settings = JSON.parse(savedTeamIds)
      if (settings.teamIds && Array.isArray(settings.teamIds)) {
        teamIds.value = settings.teamIds
        console.log('从 shidian_teamIds 加载 TeamIDs:', teamIds.value)
      }
    }
  } catch (error) {
    console.error('读取 shidian_teamIds 失败:', error)
  }
  
  const hasTeamIds = teamIds.value.some(id => id)
  console.log('hasTeamIds:', hasTeamIds, 'teamIds:', teamIds.value)
  
  if (!hasTeamIds) {
    message.warning('请先在十殿 TeamID 卡片中输入至少一个 TeamID')
    return
  }
  
  console.log('准备显示确认对话框')
  
  try {
    // 使用 Promise 等待用户选择
    const userChoice = await new Promise((resolve) => {
      dialog.warning({
        title: '确认自动加入',
        content: '确定要自动分配 Token 加入十殿吗？这将根据枕头数量和现有标签自动分配。',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          console.log('用户点击了确定')
          resolve('positive')
        },
        onNegativeClick: () => {
          console.log('用户点击了取消')
          resolve('negative')
        },
        onClose: () => {
          // 如果对话框关闭（点击遮罩或 ESC），视为取消
          console.log('对话框关闭')
          resolve('negative')
        }
      })
    })
    
    console.log('用户选择:', userChoice)
    
    if (userChoice !== 'positive') {
      console.log('用户取消了操作')
      return
    }
    
    console.log('开始自动分配 Token 加入十殿...')
    message.info('开始自动分配 Token 加入十殿...')
    
    // 设置运行状态
    isAutoJoinRunning.value = true
    
    try {
      // 导入连接池管理器
      const { ConnectionPoolManager } = await import('@/utils/connectionPoolManager.js')
      const connectionPool = new ConnectionPoolManager(tokenStore, {
        maxConnections: 1,
        connectionTimeout: 5000,
        idleTimeout: 60000,
        queueTimeout: 120000,
        reconnectDelay: 1000,
        maxRetries: 3
      })
      
      // 获取所有 token，排除 02/05/07 前缀
      const tokens = tokenStore.gameTokens.filter(token => {
        const name = token.name || ''
        return !name.startsWith('02') && !name.startsWith('05') && !name.startsWith('07')
      })
      
      // 先检查所有 token 的枕头数量，只保留枕头=5 的 token
      const tokensWithPillow5 = []
      for (const token of tokens) {
        if (!token || !token.id) continue
        
        // 检查是否已加入十殿
        const currentTeam = tokenNightmareTeam.value[token.id]
        if (currentTeam !== null && currentTeam !== undefined) continue
        
        try {
          await connectionPool.acquire(token.id)
          
          const status = tokenStore.getWebSocketStatus(token.id)
          if (status !== 'connected') {
            await connectionPool.release(token.id, true)
            continue
          }
          
          // 等待初始化
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 获取枕头数量
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          const pillowItem = roleInfo?.role?.items?.['5054']
          const pillowCount = pillowItem?.quantity ?? 0
          
          console.log(`Token ${token.name} 枕头数量: ${pillowCount}`)
          
          if (pillowCount === 5) {
            tokensWithPillow5.push(token)
          }
          
          await connectionPool.release(token.id, true)
        } catch (error) {
          console.error(`检查 Token ${token.name} 枕头数量失败:`, error)
          try {
            await connectionPool.release(token.id, true)
          } catch (e) {}
        }
      }
      
      if (tokensWithPillow5.length === 0) {
        message.info('没有找到枕头数量为 5 的 Token')
        isAutoJoinRunning.value = false
        await connectionPool.destroy()
        return
      }
      
      console.log(`找到 ${tokensWithPillow5.length} 个枕头数量为 5 的 Token`)
      
      // 将枕头=5 的 token 分配到各殿（按殿五到殿一的顺序）
      const allTokensToProcess = []
      let tokenIndex = 0
      
      for (let teamIdx = 5; teamIdx >= 1; teamIdx--) {
        if (!teamIds.value[teamIdx - 1]) continue
        
        // 每殿分配 2 个 token
        for (let i = 0; i < 2 && tokenIndex < tokensWithPillow5.length; i++) {
          allTokensToProcess.push({ token: tokensWithPillow5[tokenIndex], teamIndex: teamIdx })
          tokenIndex++
        }
      }
      
      if (allTokensToProcess.length === 0) {
        message.info('没有需要处理的 Token')
        isAutoJoinRunning.value = false
        await connectionPool.destroy()
        return
      }
      
      // 使用连接池执行批量操作
      await connectionPool.batchOperate(
        allTokensToProcess.map(item => item.token),
        async (token, globalIndex) => {
          try {
            const item = allTokensToProcess[globalIndex]
            const teamIdx = item.teamIndex
            const teamId = teamIds.value[teamIdx - 1]
            
            if (!teamId) {
              return { success: false, message: 'TeamID 为空' }
            }
            
            // 发送加入十殿消息
            await tokenStore.sendGameMessage(token.id, 'matchteam_join', { 
              teamId: parseInt(teamId) 
            })
            
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // 发送准备消息
            await tokenStore.sendGameMessage(token.id, 'matchteam_memberprepare', { 
              teamId: parseInt(teamId),
              isPrepare: 1
            })
            
            // 设置信息显示状态
            tokenInfoDisplay.value[token.id] = true
            
            // 更新 tokenNightmareTeam
            tokenNightmareTeam.value[token.id] = teamIdx
            
            return { success: true, message: `已加入十殿${['一', '二', '三', '四', '五'][teamIdx - 1]}` }
          } catch (error) {
            return { success: false, error: error.message }
          }
        },
        {
          batchSize: 1,
          delayBetween: 1000,
          keepConnections: false,
          onProgress: (progress) => {
            if (progress.type === 'batch-start') {
              message.info(`正在处理第 ${progress.batchIndex} 个 Token（共 ${progress.totalBatches} 个）...`)
            } else if (progress.type === 'token-start') {
              message.info(`[${progress.globalIndex}/${progress.totalTokens}] ${progress.tokenName} 正在获取连接...`)
            } else if (progress.type === 'token-success') {
              message.success(`[${progress.globalIndex}] ${progress.tokenName} 连接成功`)
            } else if (progress.type === 'token-error') {
              if (progress.status === 'warning') {
                message.warning(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
              } else {
                message.error(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
              }
            }
          }
        }
      )
      
      // 保存设置
      await saveDropdownSettings()
      
      message.success('自动分配 Token 完成')
      
      // 销毁连接池
      await connectionPool.destroy()
    } catch (error) {
      if (error.message === '用户中断操作') {
        message.info('已停止自动加入十殿')
      } else {
        throw error
      }
    } finally {
      // 清除运行状态
      isAutoJoinRunning.value = false
      abortController.value = null
    }
  } catch (error) {
    console.error('自动加入十殿出错:', error)
    message.error(`自动分配失败：${error.message}`)
    isAutoJoinRunning.value = false
    abortController.value = null
  }
}

// 停止自动加入十殿
const stopAutoJoinShiDian = () => {
  console.log('停止自动加入十殿')
  if (abortController.value) {
    abortController.value.abort()
    message.info('正在停止自动加入十殿...')
  } else {
    isAutoJoinRunning.value = false
  }
}

// 处理指定十殿的 Token 分配
const processNightmareTeam = async (teamIndex, direction) => {
  const teamId = teamIds.value[teamIndex - 1]
  if (!teamId) return
  
  message.info(`开始处理十殿${['一', '二', '三', '四', '五'][teamIndex - 1]}...`)
  
  // 获取所有 token，根据方向排序
  const tokens = direction === 'forward' 
    ? [...sortedTokens.value] 
    : [...sortedTokens.value].reverse()
  
  // 排除昵称开头为 02/05/07 的 token
  const filteredTokens = tokens.filter(token => {
    const name = token.name || ''
    return !name.startsWith('02') && !name.startsWith('05') && !name.startsWith('07')
  })
  
  // 只处理十殿标签为空的 token（null 或 undefined）
  const availableTokens = filteredTokens.filter(token => {
    if (!token || !token.id) return false
    const currentTeam = tokenNightmareTeam.value[token.id]
    // 只处理标签为空（null 或 undefined）的 token
    return currentTeam === null || currentTeam === undefined
  })
  
  let joinedCount = 0
  const maxJoinCount = 2 // 每个 TeamID 最多加入 2 个 token
  
  for (const token of availableTokens) {
    // 检查是否被中断
    if (!isAutoJoinRunning.value) {
      throw new Error('用户中断操作')
    }
    
    if (joinedCount >= maxJoinCount) {
      break
    }
    
    if (!token || !token.id) {
      console.warn('Invalid token:', token)
      continue
    }
    
    console.log(`准备处理 Token: ${token.name || token.id}`)
    
    // 模拟点击十殿枕头按钮获取枕头数量
    try {
      // 选择 token
      console.log(`选择 Token: ${token.id}`)
      selectedTokenId.value = token.id
      tokenStore.selectToken(token.id, false)
      
      // 等待连接
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 检查是否被中断
      if (!isAutoJoinRunning.value) {
        throw new Error('用户中断操作')
      }
      
      // 获取枕头数量（传入 tokenId 字符串，而不是 token 对象）
      console.log(`获取 Token ${token.name || token.id} 的枕头数量`)
      await getPillowCount(token.id)
      
      // 等待数据更新
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 检查是否被中断
      if (!isAutoJoinRunning.value) {
        throw new Error('用户中断操作')
      }
      
      // 获取最新的枕头数量
      const pillowCount = tokenPillowCount.value?.[token.id] || 0
      
      console.log(`Token ${token.name || token.id} 枕头数量：${pillowCount}`)
      
      // 所有十殿（包括一到五）都需要枕头=5
      if (pillowCount !== 5) {
        console.log(`Token ${token.name || token.id} 枕头数量不为 5，跳过`)
        continue // 跳过枕头数量不为 5 的 token
      }
      
      // 设置该 token 的十殿队伍标签
      tokenNightmareTeam.value[token.id] = teamIndex
      
      // 保存设置
      await saveDropdownSettings()
      
      // 调用 joinShiDian 加入十殿
      console.log(`调用 joinShiDian, token:`, token, 'teamIndex:', teamIndex)
      await joinShiDian(token, teamIndex)
      joinedCount++
      message.success(`Token ${token.name || token.id} 已加入十殿${['一', '二', '三', '四', '五'][teamIndex - 1]}`)
      
      // 等待一下，避免过快
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Token ${token.name || token.id} 处理失败:`, error)
      message.error(`Token ${token.name || token.id} 处理失败：${error.message}`)
    }
  }
  
  message.info(`十殿${['一', '二', '三', '四', '五'][teamIndex - 1]}完成，加入 ${joinedCount}/${maxJoinCount} 个 Token`)
}

// 处理从十殿 TeamID 卡片触发的加入十殿请求
const handleJoinTokenFromTeamIdCard = async (token, teamIndex) => {
  try {
    await joinShiDian(token, teamIndex)
  } catch (error) {
    console.error(`${token.name || token.id} 加入十殿失败:`, error)
    message.error(`${token.name || token.id} 加入十殿失败：${error.message}`)
  }
}

// 格式化数字
const formatNumber = (num) => {
  const n = Number(num || 0)
  const billion = 1e8
  const tenThousand = 1e4
  if (n >= billion) {
    return (n / billion).toFixed(1) + '亿'
  } else if (n >= tenThousand) {
    return (n / tenThousand).toFixed(1) + '万'
  }
  return n.toLocaleString()
}

// 处理null值
const formatValue = (value) => {
  return value == null ? '-' : formatNumber(Number(value))
}

// 查找物品数量
const findItemCount = (items, itemId) => {
  if (!items) return 0
  if (Array.isArray(items)) {
    const item = items.find(i => Number(i.id ?? i.itemId) === itemId)
    return item ? Number(item.num ?? item.count ?? item.quantity ?? 0) : 0
  }
  const item = items[String(itemId)] ?? items[itemId]
  if (item == null) {
    const found = Object.values(items).find(i => Number(i?.itemId ?? i?.id) === itemId)
    return found ? Number(found.num ?? found.count ?? found.quantity ?? 0) : 0
  }
  return typeof item === 'number' ? Number(item) : typeof item === 'object' ? Number(item.num ?? item.count ?? item.quantity ?? 0) : Number(item) || 0
}

// 获取白玉数量
const getWhiteJade = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return '-'
  const gameData = token.gameData
  const roleInfo = gameData?.roleInfo
  if (!roleInfo) return '-'
  const role = roleInfo.role
  if (!role) return '-'
  const items = role.items || role.itemList || role.bag?.items || role.inventory || roleInfo.items || roleInfo.itemList || roleInfo.bag?.items || roleInfo.inventory || null
  return formatValue(findItemCount(items, 1022))
}

// 获取彩玉数量
const getColorJade = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return '-'
  const gameData = token.gameData
  const roleInfo = gameData?.roleInfo
  if (!roleInfo) return '-'
  const role = roleInfo.role
  if (!role) return '-'
  const items = role.items || role.itemList || role.bag?.items || role.inventory || roleInfo.items || roleInfo.itemList || roleInfo.bag?.items || roleInfo.inventory || null
  return formatValue(findItemCount(items, 1023))
}

// 获取灵贝数量
const getSpiritShell = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return '-'
  const gameData = token.gameData
  const roleInfo = gameData?.roleInfo
  if (!roleInfo) return '-'
  const role = roleInfo.role
  if (!role) return '-'
  const items = role.items || role.itemList || role.bag?.items || role.inventory || roleInfo.items || roleInfo.itemList || roleInfo.bag?.items || roleInfo.inventory || null
  return formatValue(findItemCount(items, 1033))
}

// 获取十殿层数
const getNightmareLevel = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return 0
  const gameData = token.gameData
  const nightmareData = gameData?.nightmareData
  if (!nightmareData) return 0
  const weekAward = nightmareData.weekAward
  if (weekAward && typeof weekAward === 'object') {
    const keys = Object.keys(weekAward).sort().reverse()
    if (keys.length > 0) {
      const latest = keys[0]
      return weekAward[latest]?.maxLevel || 0
    }
  }
  return nightmareData.maxLevel || nightmareData.weekAward?.maxLevel || 0
}

// 获取灯神层数文本
const getLampGodLevelText = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) {
    return '未获取'
  }
  const lampGodData = token.gameData.lampGodData || {}
  const levels = []
  if (lampGodData.wei) levels.push(`魏${lampGodData.wei}`)
  if (lampGodData.shu) levels.push(`蜀${lampGodData.shu}`)
  if (lampGodData.wu) levels.push(`吴${lampGodData.wu}`)
  if (lampGodData.qunxiong) levels.push(`群雄${lampGodData.qunxiong}`)
  if (lampGodData.deepsea) levels.push(`深海${lampGodData.deepsea}`)
  return levels.length > 0 ? levels.join(' ') : '未获取'
}

// 获取功法残卷数量（itemId: 37007）
const getLegacyFragmentCount = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return '-'
  const gameData = token.gameData
  const roleInfo = gameData?.roleInfo
  if (!roleInfo) return '-'
  const role = roleInfo.role
  if (!role) return '-'
  const items = role.items || role.itemList || role.bag?.items || role.inventory || roleInfo.items || roleInfo.itemList || roleInfo.bag?.items || roleInfo.inventory || null
  return formatValue(findItemCount(items, 37007))
}

// 获取宝库层数
const getBossTowerLevel = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return 0
  const gameData = token.gameData
  const bossTowerInfo = gameData?.bossTowerInfo
  if (!bossTowerInfo) return 0
  // 宝库层数从 bossTower.towerId 获取（参考 BossTower.vue）
  const bossTower = bossTowerInfo.bossTower
  if (bossTower && bossTower.towerId) {
    return bossTower.towerId
  }
  // 兼容其他可能的字段
  return bossTowerInfo.level || bossTowerInfo.maxLevel || bossTowerInfo.currentLevel || bossTowerInfo.floor || 0
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

// 灯神相关方法（业务逻辑已移至LampGodInfoCard.vue）

// 武将相关方法

// 俱乐部相关方法
const handleRefreshClubInfo = async () => {
  if (!selectedTokenId.value) {
    message.warning('请先选择Token')
    return
  }
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token) {
    message.error('Token不存在')
    return
  }
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  try {
    isClubRunning.value = true
    message.info('正在刷新俱乐部信息...')
    await tokenStore.sendGameMessage(token.id, 'legion_getinfo', {})
    message.success('俱乐部信息刷新成功')
  } catch (error) {
    console.error('刷新俱乐部信息失败:', error)
    message.error('刷新俱乐部信息失败')
  } finally {
    isClubRunning.value = false
  }
}

const handleSignInClub = async () => {
  if (!selectedTokenId.value) {
    message.warning('请先选择Token')
    return
  }
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token) {
    message.error('Token不存在')
    return
  }
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接游戏')
    return
  }
  
  if (isClubSignedIn.value) {
    message.warning('今日已签到')
    return
  }
  
  try {
    isClubRunning.value = true
    message.info('正在签到...')
    await tokenStore.sendGameMessage(token.id, 'legion_signin', {})
    await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    message.success('俱乐部签到成功')
  } catch (error) {
    console.error('俱乐部签到失败:', error)
    message.error('俱乐部签到失败')
  } finally {
    isClubRunning.value = false
  }
}

const handleViewClubDetails = () => {
  message.info('查看俱乐部详情功能待实现')
}

// 获取俱乐部成员信息（只对当前连接的Token执行）
const handleBatchFetchClubInfo = async () => {
  const connectedToken = tokenStore.gameTokens.find(t => tokenStore.getWebSocketStatus(t.id) === 'connected')
  
  if (!connectedToken) {
    return
  }
  
  isClubRunning.value = true
  message.info(`开始获取俱乐部成员信息：${connectedToken.name || connectedToken.id}...`)
  
  try {
    const legionInfo = await tokenStore.sendLegionGetInfo(connectedToken.id, {})
    
    const membersObj = legionInfo?.info?.members || {}
    const members = Object.values(membersObj)
    
    if (members.length === 0) {
      message.warning('未获取到俱乐部成员信息')
      return
    }
    
    const allMembers = members.map(member => {
      const sPower = member.custom?.s_power || 0
      const powerInYi = (sPower / 100000000).toFixed(2)
      
      return {
        name: member.name || '',
        power: powerInYi,
        red_quench_cnt: member.custom?.red_quench_cnt || 0,
        total_red_quench_cnt: member.custom?.total_red_quench_cnt || 0,
        battle_red_quench_cnt: member.custom?.battle_red_quench_cnt || 0
      }
    })
    
    const csvHeader = '名称,战力(亿),红数,总红数,盐场红数\n'
    const csvRows = allMembers.map(m => 
      `${m.name},${m.power},${m.red_quench_cnt},${m.total_red_quench_cnt},${m.battle_red_quench_cnt}`
    ).join('\n')
    const csvContent = '\uFEFF' + csvHeader + csvRows
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `俱乐部成员信息_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success(`俱乐部成员信息已导出成功，共 ${allMembers.length} 条记录`)
  } catch (error) {
    console.error('获取俱乐部成员信息失败:', error)
    message.error('获取俱乐部成员信息失败：' + (error.message || '未知错误'))
  } finally {
    isClubRunning.value = false
  }
}

// 解析执行范围（支持 1-20 或 1,2,3 格式，如果为空则返回 null 表示执行全部）
const parseTokenRange = (rangeStr, requireRange = false) => {
  if (!rangeStr || !rangeStr.trim()) {
    // 如果要求必须输入范围，返回空数组；否则返回 null 表示执行全部
    return requireRange ? [] : null
  }
  
  const tokens = []
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tokens.push(i)
        }
      }
    } else {
      const num = Number(trimmed)
      if (!isNaN(num)) {
        tokens.push(num)
      }
    }
  }
  
  return tokens.length > 0 ? tokens : (requireRange ? [] : null)
}

// 处理俱乐部执行范围输入
const handleLegionTokensInput = (value) => {
  console.log('执行范围输入:', value)
  // 可以在这里添加验证逻辑
}

// 处理俱乐部 ID 输入
const handleLegionIdInput = (value) => {
  console.log('俱乐部 ID 输入:', value)
  // 可以在这里添加验证逻辑
}

// 加入俱乐部（使用连接池）
const handleJoinLegion = async (legionTokensStr, legionId) => {
  console.log('批量加入俱乐部 - 执行范围:', legionTokensStr, '俱乐部 ID:', legionId)
  
  if (!legionId) {
    message.warning('请输入俱乐部 ID')
    return
  }
  
  const tokenIndices = parseTokenRange(legionTokensStr)
  console.log('解析后的 Token 索引:', tokenIndices)
  
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的 Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const targetTokens = tokenIndices === null 
    ? tokens 
    : tokenIndices
        .map(index => {
          const arrayIndex = index - 1
          return tokens[arrayIndex]
        })
        .filter(token => token !== undefined)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的 Token')
    return
  }
  
  isClubRunning.value = true
  const rangeText = tokenIndices === null ? '全部' : `范围${legionTokensStr}`
  message.info(`开始批量加入俱乐部（${rangeText}），共${targetTokens.length}个 Token...`)
  
  try {
    // 导入连接池管理器
    const { ConnectionPoolManager } = await import('@/utils/connectionPoolManager.js')
    const connectionPool = new ConnectionPoolManager(tokenStore, {
      maxConnections: 5, // 减少并发数，改为顺序执行
      connectionTimeout: 5000, // 增加连接超时时间
      idleTimeout: 60000,
      queueTimeout: 120000,
      reconnectDelay: 1000,
      maxRetries: 3
    })
    
    // 使用连接池进行批量操作，改为逐个 Token 顺序执行
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          // 确保连接已建立
          const status = tokenStore.getWebSocketStatus(token.id)
          if (status !== 'connected') {
            throw new Error('连接未建立')
          }
          
          // 使用 sendMessageWithPromise 获取响应
          const response = await tokenStore.sendMessageWithPromise(
            token.id, 
            'legion_applyjoin', 
            { legionId: parseInt(legionId) },
            5000
          )
          
          let successMsg = ''
          let resultStatus = 'success'
          
          // 检查响应结果
          if (response && response.code !== undefined) {
            if (response.code === 0) {
              successMsg = `${token.name || token.id} 成功申请加入俱乐部 ${legionId}`
              message.success(successMsg)
            } else if (response.msg && response.msg.includes('已经加入')) {
              successMsg = `${token.name || token.id} 已经加入俱乐部`
              message.info(successMsg)
              resultStatus = 'info'
            } else if (response.msg && response.msg.includes('未找到俱乐部')) {
              successMsg = `${token.name || token.id} 加入失败：未找到俱乐部 ${legionId}`
              message.error(successMsg)
              resultStatus = 'error'
            } else {
              successMsg = `${token.name || token.id} 加入俱乐部失败：${response.msg || '未知错误'}`
              message.error(successMsg)
              resultStatus = 'error'
            }
          } else {
            successMsg = `${token.name || token.id} 已申请加入俱乐部 ${legionId}`
            message.success(successMsg)
          }
          
          // 记录操作日志
          const tokenIndex = getTokenIndex(token)
          logOperation('shidian', '加入俱乐部', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: resultStatus,
            message: `${tokenIndex}、${token.name || token.id}、${successMsg.replace(`${token.name || token.id} `, '')}`
          })
          
          return { 
            success: resultStatus !== 'error', 
            status: resultStatus,
            message: successMsg
          }
        } catch (error) {
          const errorMsg = `加入俱乐部失败: ${error.message || '未知错误'}`
          message.error(`${token.name || token.id}: ${errorMsg}`)
          
          // 记录操作日志
          const tokenIndex = getTokenIndex(token)
          logOperation('shidian', '加入俱乐部', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${tokenIndex}、${token.name || token.id}、加入俱乐部失败: ${error.message || '未知错误'}`
          })
          
          return { success: false, error: errorMsg }
        }
      },
      {
        batchSize: 1, // 每次只处理 1 个 Token，确保顺序执行
        delayBetween: 1000, // 每个 Token 之间的延迟
        keepConnections: false, // 不保持连接，每个 Token 执行完后断开
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 个 Token（共 ${progress.totalBatches} 个）...`)
          } else if (progress.type === 'token-start') {
            message.info(`[${progress.globalIndex}/${progress.totalTokens}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`[${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 销毁连接池
    await connectionPool.destroy()
    
    // 汇总统计结果
    const totalTokens = targetTokens.length
    const successCount = results.filter(r => r.success).length
    const alreadyJoinedCount = results.filter(r => r.status === 'info').length
    const errorCount = results.filter(r => r.status === 'error' || !r.success).length
    
    // 生成汇总消息
    let summaryMessage = `批量加入俱乐部完成，共处理${totalTokens}个Token`
    if (successCount > 0) {
      summaryMessage += `，成功申请${successCount}个`
    }
    if (alreadyJoinedCount > 0) {
      summaryMessage += `，已经加入${alreadyJoinedCount}个`
    }
    if (errorCount > 0) {
      summaryMessage += `，失败${errorCount}个`
    }
    
    message.success(summaryMessage)
    
    // 记录批量操作完成日志
    logOperation('shidian', '加入俱乐部', {
      cardType: '俱乐部管理',
      status: 'success',
      message: summaryMessage
    })
  } catch (error) {
    console.error('批量加入俱乐部失败:', error)
    message.error('批量加入俱乐部失败: ' + (error.message || '未知错误'))
    
    // 记录操作日志
    logOperation('shidian', '加入俱乐部', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `批量加入俱乐部失败: ${error.message || '未知错误'}`
    })
  } finally {
    isClubRunning.value = false
  }
}

// 监听 legion_getinforesp 事件来更新俱乐部名称
watch(() => tokenStore.gameTokens, (tokens) => {
  // 当 token 列表变化时，从 remark 字段解析下拉框值
  parseRemarkToDropdowns()
  
  // 当 gameData 更新时，自动保存资源数据（不依赖连接状态）
  tokens.forEach(token => {
    if (token.gameData) {
      // 延迟保存，避免频繁保存（移除连接状态检查，允许未连接时也保存）
      setTimeout(() => {
        saveDropdownSettings().catch(error => {
          console.error('自动保存下拉框设置失败:', error)
        })
      }, 2000)
    }
  })
}, { deep: true })

// 组件挂载时加载保存的数据
onMounted(async () => {
  // 加载下拉框设置
  await loadDropdownSettings()
})

// 处理十殿枕头数量更新事件
const handleUpdatePillowCount = async (tokenId, pillowCount) => {
  // 更新tokenPillowCount并保存到本地存储
  tokenPillowCount.value[tokenId] = pillowCount
  await saveDropdownSettings()
  console.log(`Token ${tokenId} 十殿枕头数量已更新为: ${pillowCount}`)
}

// 处理清空十殿标签事件
const handleClearNightmareLabels = async () => {
  console.log('收到清空十殿标签事件，重新加载下拉框设置')
  // 重新从 localStorage 加载下拉框设置，确保 tokenNightmareTeam 同步
  await loadDropdownSettings()
}

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
}

/* 功能卡片容器样式 */
.feature-cards-container {
  margin-top: 2rem;
  margin-bottom: var(--spacing-lg);
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  gap: 1.5rem;
  
  > * {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-large);
    box-shadow: var(--shadow-light);
    margin-bottom: 0;
    background: var(--background-color);
    overflow: hidden;
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
        border: 2px solid var(--border-light);
        border-radius: var(--border-radius-large);
        padding: var(--spacing-lg);
        cursor: pointer;
        transition: all var(--transition-normal);

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
          box-shadow: var(--shadow-medium);
          transform: translateY(-2px);
        }

        &.active {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        &.connected {
          border-left: 4px solid var(--success-color);
        }

        .token-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .token-display {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-sm);
          background: var(--bg-tertiary);
          border-radius: var(--border-radius-medium);
        }

        .token-label {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .token-value {
          font-family: monospace;
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          flex: 1;
        }

        .token-timestamps {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-md);
        }

        .timestamp-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timestamp-label {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        }

        .timestamp-value {
          color: var(--text-primary);
          font-size: var(--font-size-sm);
        }

        .storage-info {
          margin-bottom: var(--spacing-md);
        }

        .storage-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
        }

        .storage-label {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        }

        .storage-upgrade {
          margin-top: var(--spacing-sm);
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

/* 工具栏样式 */
.toolbar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
}
</style>