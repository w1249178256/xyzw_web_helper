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
        
        <!-- 十殿信息卡片 -->
        <ShiDianInfoCard 
          ref="shidianInfoCardRef"
          :selected-token-id="selectedTokenId"
          :team-id="teamId"
          @update-pillow-count="handleUpdatePillowCount"
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
          @fetch-club-info="handleFetchClubInfo"
          @batch-fetch-club-info="handleBatchFetchClubInfo"
          @handle-legion-tokens-input="handleLegionTokensInput"
          @handle-legion-id-input="handleLegionIdInput"
          @join-legion="handleJoinLegion"
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

        <!-- 宝库助威卡片 -->
        <BossTowerCard />
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
            <div style="display: flex; align-items: center; gap: 8px; margin-left: 8px;">
              <label style="font-weight: 500; margin-right: 4px;">TeamId：</label>
              <n-input
                v-model:value="teamId"
                placeholder="输入TeamID"
                size="small"
                style="width: 200px;"
              />
            </div>
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
                  :count="tokenPillowCount[token.id] || 0"
                  :loading="connectingTokens.has(token.id)"
                  :disabled="false"
                  @button-click="getPillowCount(token.id)"
                  style="flex: 1;"
                />
                <CustomizedCard
                  mode="button"
                  name="加入十殿"
                  :loading="connectingTokens.has(token.id)"
                  :disabled="!teamId || connectingTokens.has(token.id)"
                  @button-click="joinShiDian(token)"
                  style="flex: 1;"
                />
              </div>
              
              <!-- 下拉框区域（第二行，换行显示） -->
              <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <n-select
                  v-model:value="tokenPassType[token.id]"
                  :options="passTypeOptions"
                  size="small"
                  style="width: 80px;"
                  placeholder="类型"
                  @update:value="(value) => handlePassTypeChange(token.id, value)"
                />
                <n-select
                  v-model:value="tokenTreasureType[token.id]"
                  :options="treasureTypeOptions"
                  size="small"
                  style="width: 80px;"
                  placeholder="宝库"
                  @update:value="(value) => handleTreasureTypeChange(token.id, value)"
                />
                <n-select
                  v-model:value="tokenTeamMember[token.id]"
                  :options="teamMemberOptions"
                  size="small"
                  style="width: 100px;"
                  placeholder="十殿队员"
                  @update:value="(value) => handleTeamMemberChange(token.id, value)"
                />
              </div>
              
              <!-- 显示十殿队员执行次数 -->
              <div v-if="tokenTeamMember[token.id] && [0, 2, 5, 7, 8].includes(tokenTeamMember[token.id])" style="font-size: 12px; color: #666; margin-top: 4px;">
                本周执行次数: {{ executionStore.getExecutionCount(token.id) }}
              </div>
              
            </template>
          </a-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTokenStore } from '@/stores/tokenStore'
import { useNightmareExecutionStore } from '@/stores/nightmareExecutionStore'
import { useMessage, useDialog } from 'naive-ui'
import { Add, Refresh, TrashBin, EllipsisHorizontal, Star, Home, Create, SyncCircle, Key, Gift } from '@vicons/ionicons5'
import ManualTokenForm from '@/views/TokenImport/manual.vue'
import UrlTokenForm from '@/views/TokenImport/url.vue'
import BinTokenForm from '@/views/TokenImport/bin.vue'

// 导入模块化卡片组件
import ShiDianInfoCard from '@/diy/ShiDian/ShiDianInfoCard.vue'
import LampGodInfoCard from '@/diy/ShiDian/LampGodInfoCard.vue'
import HeroInfoCard from '@/diy/ShiDian/HeroInfoCard.vue'
import ClubManagementCard from '@/diy/ShiDian/ClubManagementCard.vue'
import BossTowerCard from '@/diy/ShiDian/BossTowerCard.vue'
import SummerActivityCard from '@/diy/ShiDian/SummerActivityCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import { savePageTokenCards, loadPageTokenCards } from '@/utils/pageTokenStorage'

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
const shidianInfoCardRef = ref(null)

// 下拉框选项数据
const dianLevelOptions = [
  { label: '空', value: null },
  { label: '空十殿0', value: 'empty_0' },
  { label: '殿0', value: 0 },
  { label: '殿2', value: 2 },
  { label: '殿5', value: 5 },
  { label: '殿7', value: 7 },
  { label: '殿8', value: 8 }
]

const passTypeOptions = [
  { label: '通行证', value: 'pass' },
  { label: '功法', value: 'legacy' },
  { label: '空', value: '' }
]

const treasureTypeOptions = [
  { label: '宝库', value: 'treasure' },
  { label: '跳过', value: 'skip' },
  { label: '空', value: '' }
]

const teamMemberOptions = [
  { label: '空', value: null },
  { label: '殿0', value: 0 },
  { label: '殿2', value: 2 },
  { label: '殿5', value: 5 },
  { label: '殿7', value: 7 },
  { label: '殿8', value: 8 }
]

// 每个token的下拉框选择值
const tokenPassType = ref({}) // tokenId -> passType
const tokenTreasureType = ref({}) // tokenId -> treasureType
const tokenTeamMember = ref({}) // tokenId -> teamMember (殿0/2/5/7/8)
const tokenPillowCount = ref({}) // tokenId -> pillowCount (十殿枕头数量，保存到localStorage)
const pillowCount = ref(0) // 十殿枕头数量

// 导出相关每个token的信息显示状态（加入十殿后显示）
const tokenInfoDisplay = ref({}) // tokenId -> boolean

// 俱乐部相关状态
const isClubRunning = ref(false)
const clubNamesCache = ref({}) // tokenId -> clubName 缓存
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
    await new Promise(resolve => setTimeout(resolve, 1000))
    
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
        // 更新tokenPillowCount并保存到本地存储
        tokenPillowCount.value[tokenId] = pillowItem.quantity
        await saveDropdownSettings()
        message.success(`十殿枕头数量：${pillowItem.quantity}`)
        console.log('十殿枕头数量:', pillowItem.quantity)
      } else {
        if (!targetTokenId) {
          pillowCount.value = 0
        }
        // 更新tokenPillowCount并保存到本地存储
        tokenPillowCount.value[tokenId] = 0
        await saveDropdownSettings()
        message.warning('未找到十殿枕头信息')
      }
    } else {
      if (!targetTokenId) {
        pillowCount.value = 0
      }
      // 更新tokenPillowCount并保存到本地存储
      tokenPillowCount.value[tokenId] = 0
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

// 保存下拉框选择值和信息显示状态到localStorage
const saveDropdownSettings = async () => {
  await savePageTokenCards('shidian', {
    dropdownSettings: {
      tokenPassType: tokenPassType.value,
      tokenTreasureType: tokenTreasureType.value,
      tokenTeamMember: tokenTeamMember.value,
      tokenInfoDisplay: tokenInfoDisplay.value,
      tokenPillowCount: tokenPillowCount.value
    }
  })
}

// 从token的remark字段解析下拉框值
const parseRemarkToDropdowns = () => {
  tokenStore.gameTokens.forEach(token => {
    // 如果localStorage中已有该token的设置，优先使用localStorage的值
    if (tokenPassType.value[token.id] !== undefined || 
        tokenTreasureType.value[token.id] !== undefined) {
      // localStorage中已有设置，跳过从remark解析
      return
    }
    
    if (token.remark) {
      const remark = token.remark.trim()
      
      // 解析通行证类型（格式：通行证、功法、空）
      if (remark.includes('通行证')) {
        tokenPassType.value[token.id] = 'pass'
      } else if (remark.includes('功法')) {
        tokenPassType.value[token.id] = 'legacy'
      } else if (remark.includes('空') && !remark.includes('宝库') && !remark.includes('跳过')) {
        // 如果只有"空"且不包含"宝库"和"跳过"，则可能是通行证类型的空
        // 但需要检查是否已经有宝库类型设置
        if (!tokenTreasureType.value[token.id]) {
          tokenPassType.value[token.id] = ''
        }
      }
      
      // 解析宝库类型（格式：宝库、跳过、空）
      if (remark.includes('宝库')) {
        tokenTreasureType.value[token.id] = 'treasure'
      } else if (remark.includes('跳过')) {
        tokenTreasureType.value[token.id] = 'skip'
      } else if (remark.includes('空') && !tokenPassType.value[token.id]) {
        // 如果只有"空"且通行证类型未设置，则可能是宝库类型的空
        tokenTreasureType.value[token.id] = ''
      }
    }
  })
}

// 从localStorage和服务器加载下拉框选择值和信息显示状态
const loadDropdownSettings = async () => {
  const data = await loadPageTokenCards('shidian')
  if (data.dropdownSettings) {
    // 确保null值也能正确加载（JSON.parse会保留null）
    tokenPassType.value = data.dropdownSettings.tokenPassType || {}
    tokenTreasureType.value = data.dropdownSettings.tokenTreasureType || {}
    tokenTeamMember.value = data.dropdownSettings.tokenTeamMember || {}
    tokenInfoDisplay.value = data.dropdownSettings.tokenInfoDisplay || {}
    tokenPillowCount.value = data.dropdownSettings.tokenPillowCount || {}
    console.log('下拉框设置已加载:', { tokenPassType: tokenPassType.value, tokenTreasureType: tokenTreasureType.value, tokenTeamMember: tokenTeamMember.value, tokenInfoDisplay: tokenInfoDisplay.value, tokenPillowCount: tokenPillowCount.value })
  }
  // 注意：tokenResourceData 不需要加载，因为数据会从 gameData 实时获取
  
  // 从token的remark字段解析下拉框值（如果localStorage中没有该token的设置，则从remark读取）
  parseRemarkToDropdowns()
}

// 更新token的remark标签
const updateTokenRemark = (tokenId) => {
  const passType = tokenPassType.value[tokenId]
  const treasureType = tokenTreasureType.value[tokenId]
  
  // 构建remark标签
  const remarkParts = []
  if (passType && passType !== '') {
    const passLabel = passTypeOptions.find(opt => opt.value === passType)?.label || passType
    remarkParts.push(passLabel)
  }
  if (treasureType && treasureType !== '') {
    const treasureLabel = treasureTypeOptions.find(opt => opt.value === treasureType)?.label || treasureType
    remarkParts.push(treasureLabel)
  }
  
  // 如果宝库类型为"跳过"，确保remark中包含"跳过"
  if (treasureType === 'skip' && !remarkParts.includes('跳过')) {
    remarkParts.push('跳过')
  }
  
  const remark = remarkParts.join(' ')
  
  // 更新token的remark字段
  if (tokenStore.updateToken) {
    tokenStore.updateToken(tokenId, { remark })
    console.log(`Token ${tokenId} 标签已更新:`, remark || '(空)')
    // 确保更新立即生效
    const token = tokenStore.gameTokens.find(t => t.id === tokenId)
    if (token) {
      token.remark = remark
    }
  }
}

// 处理通行证类型变化
const handlePassTypeChange = async (tokenId, value) => {
  tokenPassType.value[tokenId] = value
  console.log(`Token ${tokenId} 通行证类型选择:`, value)
  // 更新token标签（不依赖连接状态）
  updateTokenRemark(tokenId)
  // 保存到localStorage（不依赖连接状态）
  try {
    await saveDropdownSettings()
  } catch (error) {
    console.error('保存下拉框设置失败:', error)
  }
}

// 处理宝库类型变化
const handleTreasureTypeChange = async (tokenId, value) => {
  tokenTreasureType.value[tokenId] = value
  console.log(`Token ${tokenId} 宝库类型选择:`, value)
  // 更新token标签（不依赖连接状态）
  updateTokenRemark(tokenId)
  // 保存到localStorage（不依赖连接状态）
  try {
    await saveDropdownSettings()
  } catch (error) {
    console.error('保存下拉框设置失败:', error)
  }
}

// 处理十殿队员变化
const handleTeamMemberChange = async (tokenId, value) => {
  if (value === null || value === undefined) {
    tokenTeamMember.value[tokenId] = null
  } else {
    tokenTeamMember.value[tokenId] = value
  }
  console.log(`Token ${tokenId} 十殿队员选择:`, value)
  // 保存到localStorage和服务器（不依赖连接状态）
  try {
    await saveDropdownSettings()
  } catch (error) {
    console.error('保存下拉框设置失败:', error)
  }
}

// 开始十殿管理
const startShiDianManagement = (token) => {
  selectedTokenId.value = token.id
  connectingTokens.value.add(token.id)
  setTimeout(() => {
    connectingTokens.value.delete(token.id)
  }, 1000)
}

// 加入十殿（调用子卡片的方法）
const joinShiDian = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!teamId.value) {
    message.warning('请先输入TeamID')
    return
  }

  // 调用子卡片的方法
  if (shidianInfoCardRef.value && shidianInfoCardRef.value.joinNightmareRoom) {
    await shidianInfoCardRef.value.joinNightmareRoom(token)
    // 设置信息显示状态为true
    tokenInfoDisplay.value[token.id] = true
    await saveDropdownSettings()
  } else {
    message.error('无法调用十殿信息卡片的方法')
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

// 获取俱乐部名称
const getClubName = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return ''
  const legionInfo = token.gameData.legionInfo
  return legionInfo?.info?.name || ''
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

// 获取单个token的俱乐部信息
const handleFetchClubInfo = async () => {
  if (!selectedTokenId.value) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  try {
    const status = tokenStore.getWebSocketStatus(token.id)
    if (status !== 'connected') {
      selectedTokenId.value = token.id
      tokenStore.selectToken(token.id, false)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    await tokenStore.sendGameMessage(token.id, 'legion_getinfo', {})
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const tokenData = tokenStore.gameTokens.find(t => t.id === token.id)
    if (tokenData && tokenData.gameData && tokenData.gameData.legionInfo) {
      const legionInfo = tokenData.gameData.legionInfo
      const clubName = legionInfo?.info?.name || null
      
      if (clubName) {
        clubNamesCache.value[token.id] = clubName
        await saveClubNameToServer(token.id, clubName)
        message.success(`获取成功: ${clubName}`)
      } else {
        message.warning('未加入俱乐部')
      }
    } else {
      message.warning('未获取到俱乐部信息')
    }
  } catch (error) {
    console.error('获取俱乐部信息失败:', error)
    message.error('获取俱乐部信息失败')
  }
}

// 批量获取俱乐部信息
const handleBatchFetchClubInfo = async () => {
  if (!tokenStore.hasTokens) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokens = tokenStore.gameTokens
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(legionTokens.value)
  const targetTokens = tokenIndices === null 
    ? tokens 
    : tokenIndices
        .map(index => {
          const arrayIndex = index - 1
          return tokens[arrayIndex]
        })
        .filter(token => token !== undefined)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  isClubRunning.value = true
  const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
  message.info(`开始批量获取俱乐部信息（${rangeText}），共${targetTokens.length}个Token...`)
  
  try {
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      try {
        selectedTokenId.value = token.id
        tokenStore.selectToken(token.id, false)
        await new Promise(resolve => setTimeout(resolve, 2000))
        await handleFetchClubInfo()
      } catch (error) {
        console.error(`获取Token ${token.name} 俱乐部信息失败:`, error)
        message.error(`${token.name}: 获取失败`)
      }
      
      if (i < targetTokens.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    message.success('批量获取俱乐部信息完成')
  } finally {
    isClubRunning.value = false
  }
}

// 保存俱乐部名称到服务器（已禁用，只使用localStorage）
const saveClubNameToServer = async (tokenId, clubName) => {
  // 不再保存到服务器，只使用localStorage
  console.log('俱乐部名称已保存到localStorage:', tokenId, clubName)
}

// 从服务器加载俱乐部名称（已禁用，只使用localStorage）
const loadClubNamesFromServer = async () => {
  // 不再从服务器加载，只使用localStorage
  console.log('俱乐部名称从localStorage加载')
}

// 解析执行范围（支持 1-20 或 1,2,3 格式，如果为空则返回null表示执行全部）
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null // null表示执行全部
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
  
  return tokens.length > 0 ? tokens : null
}

// 处理俱乐部执行范围输入
const handleLegionTokensInput = (value) => {
  // 可以在这里添加验证逻辑
}

// 处理俱乐部ID输入
const handleLegionIdInput = (value) => {
  // 可以在这里添加验证逻辑
}

// 加入俱乐部（带重试机制）
const handleJoinLegion = async (legionTokensStr, legionId) => {
  if (!legionId) {
    message.warning('请输入俱乐部ID')
    return
  }
  
  const tokenIndices = parseTokenRange(legionTokensStr)
  if (tokenIndices === null) {
    message.warning('加入俱乐部需要指定执行范围（如：1-20 或 1,2,3）')
    return
  }
  
  if (tokenIndices.length === 0) {
    message.warning('请输入有效的执行范围（如：1-20 或 1,2,3）')
    return
  }
  
  const tokens = tokenStore.gameTokens
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const targetTokens = tokenIndices
    .map(index => {
      const arrayIndex = index - 1
      return tokens[arrayIndex]
    })
    .filter(token => token !== undefined)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  isClubRunning.value = true
  message.info(`开始批量加入俱乐部，共${targetTokens.length}个Token...`)
  
  try {
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      
      try {
        let connected = false
        let retryCount = 0
        const maxRetries = 5
        
        while (!connected && retryCount < maxRetries) {
          selectedTokenId.value = token.id
          tokenStore.selectToken(token.id, true)
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const status = tokenStore.getWebSocketStatus(token.id)
          if (status === 'connected') {
            connected = true
            message.success(`${token.name || token.id} 连接成功`)
          } else {
            retryCount++
            if (retryCount < maxRetries) {
              message.warning(`${token.name || token.id} 连接失败，重试 ${retryCount}/${maxRetries}...`)
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }
        
        if (!connected) {
          message.error(`${token.name || token.id} 连接失败，已重试${maxRetries}次`)
          continue
        }
        
        await tokenStore.sendGameMessage(token.id, 'legion_applyjoin', {
          legionId: parseInt(legionId)
        })
        
        message.success(`${token.name || token.id} 已申请加入俱乐部 ${legionId}`)
        
        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Token ${token.name || token.id} 加入俱乐部失败:`, error)
        message.error(`${token.name || token.id}: 加入失败`)
      }
    }
    
    message.success('批量加入俱乐部完成')
  } finally {
    isClubRunning.value = false
  }
}

// 监听legion_getinforesp事件来更新俱乐部名称
watch(() => tokenStore.gameTokens, (tokens) => {
  // 当token列表变化时，从remark字段解析下拉框值
  parseRemarkToDropdowns()
  tokens.forEach(token => {
    if (token.gameData && token.gameData.legionInfo) {
      const legionInfo = token.gameData.legionInfo
      const clubName = legionInfo?.info?.name || null
      if (clubName && clubName !== clubNamesCache.value[token.id]) {
        clubNamesCache.value[token.id] = clubName
        saveClubNameToServer(token.id, clubName)
      }
    }
  })
  
  // 当gameData更新时，自动保存资源数据（不依赖连接状态）
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
  loadClubNamesFromServer()
})

// 处理十殿枕头数量更新事件
const handleUpdatePillowCount = async (tokenId, pillowCount) => {
  // 更新tokenPillowCount并保存到本地存储
  tokenPillowCount.value[tokenId] = pillowCount
  await saveDropdownSettings()
  console.log(`Token ${tokenId} 十殿枕头数量已更新为: ${pillowCount}`)
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