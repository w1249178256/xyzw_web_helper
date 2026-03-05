<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Settings />
      </n-icon>
    </template>
    <template #title>
      <h3>十殿信息</h3>
    </template>
    <template #default>
      <!-- 十殿信息显示 - 使用一个CustomizedCard容器容纳主要操作按钮 -->
      <CustomizedCard mode="container">
        <!-- 名称信息 - 直接放在容器中，自动两个一行 -->
        <CustomizedCard 
          mode="name-count"
          name="十殿层数"
          :count="currentNightmareLevel + '层'"
        />
        <CustomizedCard 
          mode="name-count"
          name="转盘次数"
          :count="currentTurntableLeftCnt"
        />
        
        <!-- 操作按钮 - 直接放在容器中，自动两个一行 -->
        <CustomizedCard 
          mode="button-count"
          name="十殿枕头"
          button-text="获取"
          :count="pillowCount"
          :disabled="!selectedTokenId"
          @button-click="getPillowCount()"
        />
        

        
        <CustomizedCard 
          mode="button-placeholder"
          button-text="刷新信息"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId)"
          @button-click="selectedTokenId ? getNightmareRoleInfo(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="领取奖励"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId)"
          @button-click="selectedTokenId ? claimNightmareRewards(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="切换阵1"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId)"
          @button-click="selectedTokenId ? switchToTeam1(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-count"
          name="队伍号"
          button-text="队伍号"
          :count="displayTeamId"
          @button-click="selectedTokenId ? getTeamIdInfo(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-count"
          name="房间号"
          button-text="房间号"
          :count="displayRoomId"
          @button-click="selectedTokenId ? getRoomIdInfo(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-count"
          name="当前殿级"
          button-text="当前殿级"
          :count="displayNightmareLevel"
          @button-click="selectedTokenId ? getNightmareLevelInfo(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="创建房间"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId)"
          @button-click="selectedTokenId ? createNightmareRoom(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="加入房间"
          :disabled="!selectedTokenId || !displayTeamId || connectingTokens.has(selectedTokenId)"
          @button-click="selectedTokenId ? joinNightmareRoom(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="开始十殿"
          :disabled="!selectedTokenId || !displayTeamId"
          @button-click="selectedTokenId ? startNightmareFight(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <!-- 出战人员 -->
        <CustomizedCard 
          mode="button-with-select"
          button-text="出战人员"
          :disabled="!selectedFighterDian"
          :selectValue="selectedFighterDian"
          @update:selectValue="(value) => selectedFighterDian = value"
          :select-options="fighterDianOptions"
          placeholder="选择Token标签"
          @button-click="executeFighter()"
        />

        <!-- 踢出房间 -->
        <CustomizedCard 
          mode="button-with-select"
          button-text="踢出房间"
          :disabled="!selectedKickDian"
          :selectValue="selectedKickDian"
          @update:selectValue="(value) => selectedKickDian = value"
          :select-options="kickDianOptions"
          placeholder="选择Token标签"
          @button-click="executeKick()"
        />

        <!-- 转让房主 -->
        <CustomizedCard 
          mode="button-with-select"
          button-text="转让房主"
          :disabled="!selectedTransferDian"
          :selectValue="selectedTransferDian"
          @update:selectValue="(value) => selectedTransferDian = value"
          :select-options="transferDianOptions"
          placeholder="选择Token标签"
          @button-click="executeTransfer()"
        />

        <!-- 十殿恢复 -->
        <CustomizedCard 
          mode="button-with-select"
          button-text="十殿恢复"
          :disabled="!selectedRestoreDian"
          :selectValue="selectedRestoreDian"
          @update:selectValue="(value) => selectedRestoreDian = value"
          :select-options="restoreDianOptions"
          placeholder="选择Token标签"
          @button-click="executeRestore()"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="解散十殿"
          :disabled="!selectedTokenId || !displayTeamId"
          @button-click="selectedTokenId ? nightmareDismiss(tokenStore.gameTokens.find(t => t.id === selectedTokenId)) : null"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="重置枕头"
          :disabled="!selectedTokenId"
          @button-click="resetPillowCount"
        />

        <!-- 批量执行特定殿级 -->
        <CustomizedCard 
          mode="button-with-select"
          button-text="执行殿级"
          :loading="isExecutingSpecificDian"
          :disabled="!selectedDianLevelToExecute || tokenStore.gameTokens.length === 0"
          :selectValue="selectedDianLevelToExecute"
          @update:selectValue="(value) => selectedDianLevelToExecute = value"
          :select-options="dianLevelToExecuteOptions"
          placeholder="选择殿级"
          @button-click="executeSpecificDian()"
        />
      </CustomizedCard>
      
      <!-- 新增容器：执行范围、导出资源、批量领取、批量十殿 -->
      <CustomizedCard mode="container">
        <!-- 执行范围和导出资源 -->
        <CustomizedCard 
          mode="execution-range"
          name="执行范围"
          v-model:inputValue="resourceExportRange"
          placeholder="留空执行全部，或输入 1-20 或 1,2,3"
          @update:inputValue="handleResourceExportRangeInput"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="导出资源"
          :disabled="isExportingResources"
          @button-click="exportResources()"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="批量领取"
          :disabled="tokenStore.gameTokens.length === 0 || isBatchClaiming"
          @button-click="batchClaimNightmareRewards()"
        />
        <CustomizedCard 
          mode="button-placeholder"
          button-text="批量十殿"
          :disabled="tokenStore.gameTokens.length === 0"
          @button-click="batchNightmare()"
        />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="十殿信息"
        :filter-operations="['刷新信息', '领取奖励', '批量领取', '十殿恢复', '重置枕头', '解散十殿', '批量十殿', '创建房间', '加入房间', '开始十殿', '出战人员', '踢出房间', '转让房主', '导出资源']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { defineProps, defineEmits, defineExpose, ref, computed, toRaw, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useNightmareExecutionStore } from '@/stores/nightmareExecutionStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/ShiDian/OperationLogCard.vue'
import { Settings } from '@vicons/ionicons5'
import { logOperation } from '@/utils/operationLogger'
import ConnectionPoolManager from '@/utils/connectionPoolManager.js'

const tokenStore = useTokenStore()
const message = useMessage()
const logStore = useOperationLogStore()
const executionStore = useNightmareExecutionStore()

const emit = defineEmits(['reset-dian-labels'])

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  },
  teamId: {
    type: String,
    default: ''
  }
})

const isBatchClaiming = ref(false)
const connectingTokens = ref(new Set())
const isExportingNightmare = ref(false)
const isBatchNightmareRunning = ref(false)
const resourceExportRange = ref('')
const isExportingResources = ref(false)
const isOneClickNightmareRunning = ref(false)
const pillowCount = ref(0)
const displayRoomId = ref(0)
const displayTeamId = ref(0)
const displayNightmareLevel = ref(0)

// 存储各个token的roleId
const tokenRoleIds = ref({})

// 从本地存储加载队伍号和房间号
onMounted(() => {
  const savedTeamId = localStorage.getItem('shidian_teamId')
  if (savedTeamId) {
    displayTeamId.value = parseInt(savedTeamId)
  }
  const savedRoomId = localStorage.getItem('shidian_roomId')
  if (savedRoomId) {
    displayRoomId.value = parseInt(savedRoomId)
  }
})

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 30000,
  idleTimeout: 60000,
  queueTimeout: 120000,
  reconnectDelay: 1000,
  maxRetries: 3
})

// 计算属性：十殿层数
const currentNightmareLevel = computed(() => {
  return props.selectedTokenId ? getNightmareLevel(props.selectedTokenId) : 0
})

// 计算属性：转盘次数
const currentTurntableLeftCnt = computed(() => {
  return props.selectedTokenId ? getTurntableLeftCnt(props.selectedTokenId) : 0
})

// 新增：批量执行特定殿级
const selectedDianLevelToExecute = ref(null)
const isExecutingSpecificDian = ref(false)
const dianLevelToExecuteOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 }
]

// 出战人员下拉选项（Token标签）
const selectedFighterDian = ref(null)
const fighterDianOptions = [
  { label: '殿2', value: '殿2' },
  { label: '殿5', value: '殿5' },
  { label: '殿7', value: '殿7' }
]

// 踢出房间下拉选项（Token标签）
const selectedKickDian = ref(null)
const kickDianOptions = [
  { label: '殿2', value: '殿2' },
  { label: '殿5', value: '殿5' },
  { label: '殿7', value: '殿7' },
  { label: '殿0', value: '殿0' }
]

// 转让房主下拉选项（Token标签）
const selectedTransferDian = ref(null)
const transferDianOptions = [
  { label: '殿7', value: '殿7' }
]

// 十殿恢复下拉选项（Token标签）
const selectedRestoreDian = ref(null)
const restoreDianOptions = [
  { label: '殿2', value: '殿2' },
  { label: '殿5', value: '殿5' },
  { label: '殿7', value: '殿7' }
]

// 格式化数字（从ShiDian.vue复制）
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

// 处理null值（从ShiDian.vue复制）
const formatValue = (value) => {
  return value == null ? '-' : formatNumber(Number(value))
}

// 查找物品数量（从ShiDian.vue复制）
const findItemCount = (items, itemId) => {
  console.log('findItemCount - items:', items, 'itemId:', itemId)
  if (!items) {
    console.log('findItemCount - items is null/undefined')
    return 0
  }
  if (Array.isArray(items)) {
    const item = items.find(i => Number(i.id ?? i.itemId) === itemId)
    console.log('findItemCount - items is array, found item:', item)
    return item ? Number(item.num ?? item.count ?? item.quantity ?? 0) : 0
  }
  const item = items[String(itemId)] ?? items[itemId]
  console.log('findItemCount - items is object, item by key:', item)
  if (item == null) {
    const found = Object.values(items).find(i => Number(i?.itemId ?? i?.id) === itemId)
    console.log('findItemCount - item by key is null, found by values:', found)
    return found ? Number(found.num ?? found.count ?? found.quantity ?? 0) : 0
  }
  const result = typeof item === 'number' ? Number(item) : typeof item === 'object' ? Number(item.quantity ?? item.num ?? item.count ?? 0) : Number(item) || 0
  console.log('findItemCount - result:', result)
  return result
}

// 获取白玉数量（从ShiDian.vue复制最新实现）
const getWhiteJade = (tokenId) => {
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  console.log('getWhiteJade - token:', token)
  if (!token || !token.gameData) {
    console.log('getWhiteJade - token or gameData is missing')
    return '-'
  }
  const gameData = token.gameData
  const roleInfo = gameData?.roleInfo
  console.log('getWhiteJade - roleInfo:', roleInfo)
  if (!roleInfo) {
    console.log('getWhiteJade - roleInfo is missing')
    return '-'
  }
  const role = roleInfo.role
  console.log('getWhiteJade - role:', role)
  if (!role) {
    console.log('getWhiteJade - role is missing')
    return '-'
  }
  const items = role.items || role.itemList || role.bag?.items || role.inventory || roleInfo.items || roleInfo.itemList || roleInfo.bag?.items || roleInfo.inventory || null
  console.log('getWhiteJade - items:', items)
  const count = findItemCount(items, 1022)
  console.log('getWhiteJade - count for 1022:', count)
  return formatValue(count)
}

// 获取彩玉数量（从ShiDian.vue复制最新实现）
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

// 获取灵贝数量（从ShiDian.vue复制最新实现）
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

// 判断两个日期是否在同一周（周一到周日为一周）
const isSameWeek = (date1, date2) => {
  if (!date1 || !date2) return false
  
  // 获取周一的时间戳（周一00:00:00）
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay() // 0=周日, 1=周一, ..., 6=周六
    const diff = day === 0 ? -6 : 1 - day // 如果是周日，往前推6天；否则往前推到周一
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  
  const weekStart1 = getWeekStart(date1)
  const weekStart2 = getWeekStart(date2)
  
  return weekStart1 === weekStart2
}

// 将YYYYMMDD格式的字符串转换为Date对象
const parseDateString = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return null
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1 // 月份从0开始
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

// 获取十殿层数（根据最新逻辑：读取weekAward最后一个日期的maxLevel，判断当前日期和最后日期是否在同一周）
const getNightmareLevel = (tokenId) => {
  const gameTokens = toRaw(tokenStore.gameTokens)
  const token = gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return 0
  const gameData = token.gameData
  const nightmareData = gameData?.nightmareData
  if (!nightmareData) return 0
  
  let weekAward = null
  
  // 优先从nightMareData.weekAward获取（注意大小写）
  const nightMareData = nightmareData.nightMareData || nightmareData.nightmareData
  if (nightMareData && nightMareData.weekAward) {
    weekAward = nightMareData.weekAward
  } else if (nightmareData.weekAward) {
    // 兼容旧格式：直接从nightmareData.weekAward获取
    weekAward = nightmareData.weekAward
  }
  
  if (!weekAward || typeof weekAward !== 'object') {
    // 如果没有weekAward，尝试直接从nightMareData或nightmareData获取maxLevel
    if (nightMareData && nightMareData.maxLevel !== undefined && nightMareData.maxLevel !== null) {
      return nightMareData.maxLevel
    }
    return nightmareData.maxLevel || 0
  }
  
  // 获取weekAward中所有日期键，按日期排序（最新的在前）
  const dateKeys = Object.keys(weekAward).sort().reverse()
  if (dateKeys.length === 0) {
    return 0
  }
  
  // 获取最后一个日期（最新的日期）
  const latestDateKey = dateKeys[0]
  const latestDateData = weekAward[latestDateKey]
  if (!latestDateData || latestDateData.maxLevel === undefined || latestDateData.maxLevel === null) {
    return 0
  }
  
  // 解析最后日期和当前日期
  const latestDate = parseDateString(latestDateKey)
  const currentDate = new Date()
  
  if (!latestDate) {
    // 如果日期解析失败，直接返回maxLevel
    return latestDateData.maxLevel
  }
  
  // 判断当前日期和最后日期是否在同一周
  if (isSameWeek(currentDate, latestDate)) {
    // 在同一周，返回最后一个日期的maxLevel
    return latestDateData.maxLevel
  } else {
    // 不在同一周，返回0
    return 0
  }
}

// 获取转盘次数（从ShiDian.vue复制最新实现）
const getTurntableLeftCnt = (tokenId) => {
  const gameTokens = toRaw(tokenStore.gameTokens)
  const token = gameTokens.find(t => t.id === tokenId)
  if (!token || !token.gameData) return 0
  const gameData = token.gameData
  const nightmareData = gameData?.nightmareData
  if (!nightmareData) return 0
  
  // 优先从nightMareData.weekAward获取（注意大小写）
  const nightMareData = nightmareData.nightMareData || nightmareData.nightmareData
  if (nightMareData) {
    const weekAward = nightMareData.weekAward
    if (weekAward && typeof weekAward === 'object') {
      const keys = Object.keys(weekAward).sort().reverse()
      if (keys.length > 0) {
        const latest = keys[0]
        const turntableLeftCnt = weekAward[latest]?.turntableLeftCnt
        if (turntableLeftCnt !== undefined && turntableLeftCnt !== null) {
          return turntableLeftCnt
        }
      }
    }
    // 如果weekAward中没有，尝试直接从nightMareData获取
    if (nightMareData.turntableLeftCnt !== undefined && nightMareData.turntableLeftCnt !== null) {
      return nightMareData.turntableLeftCnt
    }
  }
  
  // 兼容旧格式：直接从nightmareData.weekAward获取
  const weekAward = nightmareData.weekAward
  if (weekAward && typeof weekAward === 'object') {
    const keys = Object.keys(weekAward).sort().reverse()
    if (keys.length > 0) {
      const latest = keys[0]
      const turntableLeftCnt = weekAward[latest]?.turntableLeftCnt
      if (turntableLeftCnt !== undefined && turntableLeftCnt !== null) {
        return turntableLeftCnt
      }
    }
  }
  
  // 最后尝试直接从nightmareData获取
  return nightmareData.turntableLeftCnt || 0
}

// 获取十殿角色信息（从ShiDian.vue复制）
const getNightmareRoleInfo = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整，缺少roleId')
    return
  }

  try {
    message.info('正在获取十殿信息...')
    
    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    // 先获取roleId
    let roleId = null
    try {
      // 执行命令前等待400ms
      await new Promise(resolve => setTimeout(resolve, 400))
      const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
        roleId = roleInfo.role.roleId
        console.log('获取到的roleId:', roleId)
      } else {
        // 如果无法获取roleId，尝试使用token.id
        roleId = token.id
        console.warn('无法从roleInfo获取roleId，使用token.id:', roleId)
      }
    } catch (error) {
      console.warn('获取roleId失败，使用token.id:', error)
      roleId = token.id
    }

    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    // 使用获取到的roleId执行nightmare_getroleinfo操作
    const result = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
    
    if (result) {
      // 手动更新token的gameData.nightmareData
      if (!token.gameData) {
        token.gameData = {}
      }
      if (!token.gameData.nightmareData) {
        token.gameData.nightmareData = {}
      }
      
      // 如果返回的数据有nightmare字段，使用它；否则直接使用result
      if (result.nightmare) {
        token.gameData.nightmareData = { ...token.gameData.nightmareData, ...result.nightmare }
      } else if (result.nightMareData) {
        // 如果返回的数据有nightMareData字段（注意大小写），合并到nightmareData中
        token.gameData.nightmareData = { 
          ...token.gameData.nightmareData, 
          nightMareData: result.nightMareData,
          ...result 
        }
      } else {
        token.gameData.nightmareData = { ...token.gameData.nightmareData, ...result }
      }
      
      message.success('十殿信息获取成功')
      console.log('十殿信息:', result)
      console.log('已更新token.gameData.nightmareData:', token.gameData.nightmareData)
      logOperation('shidian', '刷新信息', {
        cardType: '十殿信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: '十殿信息获取成功'
      })
      
      // 调试：输出层数和转盘次数
      const level = getNightmareLevel(token.id)
      const turntableCnt = getTurntableLeftCnt(token.id)
      console.log('十殿层数:', level, '转盘次数:', turntableCnt)
      
      // 等待一下让数据更新生效
      await new Promise(resolve => setTimeout(resolve, 100))
    } else {
      message.warning('未获取到十殿信息')
    }
  } catch (error) {
    console.error('获取十殿信息失败:', error)
    
    // 检查是否是200020错误
    const errorMsg = String(error.message || error || '').toLowerCase()
    if (errorMsg.includes('200020')) {
      message.warning('获取十殿信息失败（错误200020）：可能是服务器暂时不可用或Token未在十殿界面，请稍后重试')
      console.warn('服务器错误200020: 这通常是由于参数无效、服务器暂时不可用或Token未在正确的游戏界面导致的')
    } else {
      message.error(`获取十殿信息失败: ${error.message || error}`)
      const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
      logOperation('shidian', '刷新信息', {
        cardType: '十殿信息',
        tokenId: props.selectedTokenId,
        tokenName: token?.name,
        status: 'error',
        message: `获取十殿信息失败: ${error.message || error}`
      })
    }
  }
}

// 领取十殿奖励（从ShiDian.vue复制）
const claimNightmareRewardsForCard = async (token) => {
  connectingTokens.value.add(token.id)
  try {
    tokenStore.selectToken(token.id)
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.info(`正在为 ${token.name || token.id} 连接游戏...`)
      tokenStore.selectToken(token.id)
      let count = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        count++
      }
      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.error('WebSocket连接失败，请稍后重试')
        return
      }
      message.success(`${token.name || token.id} 游戏连接成功`)
    } else {
      message.info(`${token.name || token.id} 已连接，跳过连接步骤`)
    }
    // 获取角色信息
    let roleId = null
    try {
      message.info(`正在为 ${token.name || token.id} 获取角色信息...`)
      // 执行命令前等待400ms
      await new Promise(resolve => setTimeout(resolve, 400))
      const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
      if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
        roleId = roleInfo.role.roleId
        console.log('获取到的roleId:', roleId)
        message.success(`${token.name || token.id} 角色信息获取成功，roleId: ${roleId}`)
      } else {
        message.warning(`${token.name || token.id} 获取角色信息失败，继续执行后续操作`)
      }
    } catch (error) {
      message.warning(`${token.name || token.id} 获取角色信息失败，继续执行后续操作`)
      console.error('获取角色信息失败:', error)
    }
// 获取十殿角色信息
    if (roleId) {
      try {
        message.info(`正在为 ${token.name || token.id} 获取十殿角色信息...`)
        // 执行命令前等待400ms
        await new Promise(resolve => setTimeout(resolve, 400))
        const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId })
        if (nightmareInfo) {
          message.success(`${token.name || token.id} 十殿角色信息获取成功`)
        } else {
          message.warning(`${token.name || token.id} 获取十殿角色信息失败，继续执行后续操作`)
        }
      } catch (error) {
        message.warning(`${token.name || token.id} 获取十殿角色信息失败，继续执行后续操作`)
        console.error('获取十殿角色信息失败:', error)
      }
    }
    // 领取十殿图鉴奖励
    try {
      message.info(`正在为 ${token.name || token.id} 领取十殿图鉴奖励...`)
      // 执行命令前等待400ms
      await new Promise(resolve => setTimeout(resolve, 400))
      await tokenStore.sendNightmareClaimBook(token.id)
      message.success(`${token.name || token.id} 十殿图鉴奖励领取成功`)
    } catch (error) {
      message.warning(`${token.name || token.id} 十殿图鉴奖励领取失败，继续执行后续操作`)
      console.error('十殿图鉴奖励领取失败:', error)
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    // 领取十殿周奖励
    try {
      message.info(`正在为 ${token.name || token.id} 领取十殿周奖励...`)
      // 执行命令前等待400ms
      await new Promise(resolve => setTimeout(resolve, 400))
      await tokenStore.sendNightmareClaimWeekReward(token.id)
      message.success(`${token.name || token.id} 十殿周奖励领取成功`)
    } catch (error) {
      message.warning(`${token.name || token.id} 十殿周奖励领取失败，继续执行后续操作`)
      console.error('十殿周奖励领取失败:', error)
    }
    
    // 转盘逻辑：在领取奖励后执行转盘
    if (roleId) {
      try {
        message.info(`正在为 ${token.name || token.id} 执行转盘操作...`)
        
        // 循环执行转盘直到 turntableLeftCnt = 0
        let maxIterations = 100 // 防止无限循环
        let iteration = 0
        
        while (iteration < maxIterations) {
          // 获取十殿信息以检查转盘次数和bookScore
          // 执行命令前等待400ms
          await new Promise(resolve => setTimeout(resolve, 400))
          const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId })
          
          if (!nightmareInfo) {
            message.warning(`${token.name || token.id} 无法获取十殿信息，停止转盘操作`)
            break
          }
          
          // 获取 turntableLeftCnt 和 bookScore
          // 从 nightmareInfo 中提取数据，可能需要根据实际返回结构调整
          const turntableLeftCnt = nightmareInfo.turntableLeftCnt || 
                                   nightmareInfo.weekAward?.turntableLeftCnt || 
                                   (nightmareInfo.weekAward && typeof nightmareInfo.weekAward === 'object' 
                                     ? Object.values(nightmareInfo.weekAward)[0]?.turntableLeftCnt 
                                     : 0) || 0
          
          const bookScore = nightmareInfo.bookScore || 
                           nightmareInfo.weekAward?.bookScore || 
                           (nightmareInfo.weekAward && typeof nightmareInfo.weekAward === 'object' 
                             ? Object.values(nightmareInfo.weekAward)[0]?.bookScore 
                             : 0) || 0
          
          // 如果转盘次数为0，退出循环
          if (turntableLeftCnt === 0) {
            message.success(`${token.name || token.id} 转盘次数已用完`)
            break
          }
          
          // 执行转盘
          try {
            // 执行命令前等待400ms
            await new Promise(resolve => setTimeout(resolve, 400))
            await tokenStore.sendNightmareClickTurntable(token.id, {})
            message.info(`${token.name || token.id} 转盘执行成功，剩余次数: ${turntableLeftCnt - 1}`)
          } catch (error) {
            message.warning(`${token.name || token.id} 转盘执行失败，继续检查`)
            console.error('转盘执行失败:', error)
          }
          
          // 等待一下再检查
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 重新获取十殿信息以更新数据
          // 执行命令前等待400ms
          await new Promise(resolve => setTimeout(resolve, 400))
          const updatedNightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId })
          
          if (updatedNightmareInfo) {
            const updatedTurntableLeftCnt = updatedNightmareInfo.turntableLeftCnt || 
                                            updatedNightmareInfo.weekAward?.turntableLeftCnt || 
                                            (updatedNightmareInfo.weekAward && typeof updatedNightmareInfo.weekAward === 'object' 
                                              ? Object.values(updatedNightmareInfo.weekAward)[0]?.turntableLeftCnt 
                                              : 0) || 0
            
            const updatedBookScore = updatedNightmareInfo.bookScore || 
                                    updatedNightmareInfo.weekAward?.bookScore || 
                                    (updatedNightmareInfo.weekAward && typeof updatedNightmareInfo.weekAward === 'object' 
                                      ? Object.values(updatedNightmareInfo.weekAward)[0]?.bookScore 
                                      : 0) || 0
            
            // 检查 bookScore 是否为5的倍数
            if (updatedBookScore > 0 && updatedBookScore % 5 === 0) {
              try {
                message.info(`${token.name || token.id} bookScore为${updatedBookScore}，是5的倍数，执行转盘奖励次数领取...`)
                // 执行两次 nightmare_claimturnrewardtimes
                // 执行命令前等待400ms
                await new Promise(resolve => setTimeout(resolve, 400))
                await tokenStore.sendNightmareClaimTurnRewardTimes(token.id, {})
                await new Promise(resolve => setTimeout(resolve, 300))
                // 执行命令前等待400ms
                await new Promise(resolve => setTimeout(resolve, 400))
                await tokenStore.sendNightmareClaimTurnRewardTimes(token.id, {})
                message.success(`${token.name || token.id} 转盘奖励次数领取成功（执行2次）`)
              } catch (error) {
                message.warning(`${token.name || token.id} 转盘奖励次数领取失败`)
                console.error('转盘奖励次数领取失败:', error)
              }
            }
            
            // 如果转盘次数为0，退出循环
            if (updatedTurntableLeftCnt === 0) {
              message.success(`${token.name || token.id} 转盘次数已用完`)
              break
            }
          }
          
          iteration++
        }
        
        if (iteration >= maxIterations) {
          message.warning(`${token.name || token.id} 转盘操作达到最大迭代次数，已停止`)
        }
      } catch (error) {
        message.warning(`${token.name || token.id} 转盘操作失败，继续执行后续操作`)
        console.error('转盘操作失败:', error)
      }
    }
    
    message.success(`🎉 ${token.name || token.id} 十殿奖励领取完成！`)
    logOperation('shidian', '领取奖励', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '十殿奖励领取完成'
    })
  } catch (error) {
    message.error(`领取十殿奖励失败: ${error.message}`)
    console.error('领取十殿奖励失败详细信息:', error)
    logOperation('shidian', '领取奖励', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `领取十殿奖励失败: ${error.message}`
    })
  } finally {
    connectingTokens.value.delete(token.id)
  }
}

// 领取奖励
const claimNightmareRewards = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  await claimNightmareRewardsForCard(token)
}

// 批量领取十殿奖励
const batchClaimNightmareRewards = async () => {
  if (isBatchClaiming.value) {
    message.warning('批量领取正在进行中，请稍候...')
    return
  }
  
  const gameTokens = toRaw(tokenStore.gameTokens)
  if (gameTokens.length === 0) {
    message.warning('请先导入Token')
    return
  }

  isBatchClaiming.value = true
  message.info('开始单线程批量领取十殿奖励...')
  
  try {
    // 解析执行范围
    const gameTokens = toRaw(tokenStore.gameTokens)
    const tokenIds = parseExecutionRange(resourceExportRange.value) || gameTokens.map(t => t.id)
    let tokens = gameTokens.filter(t => tokenIds.includes(t.id))
    
    // 按照名称排序token顺序
    tokens.sort((a, b) => {
      const nameA = a.name || a.id || ''
      const nameB = b.name || b.id || ''
      return nameA.localeCompare(nameB, 'zh-CN')
    })
    
    if (tokens.length === 0) {
      message.warning('没有符合执行范围的Token')
      isBatchClaiming.value = false
      return
    }
    
    const results = []
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      try {
        await nextTick()
        message.info(`处理Token ${i + 1}/${tokens.length}: ${token.name || token.id}`)
        
        // 使用连接池管理器获取连接
        const connectionAcquired = await connectionPool.acquire(token.id, 5)
        
        if (!connectionAcquired) {
          throw new Error('连接游戏失败')
        }
        
        // 确保token已连接
        const connectionStatus = tokenStore.getWebSocketStatus(token.id)
        if (connectionStatus !== 'connected') {
          throw new Error('连接游戏失败')
        }
        
        message.success(`${token.name || token.id} 连接游戏成功`)
        
        // 执行十殿奖励领取
        message.info(`正在为 ${token.name || token.id} 执行十殿奖励领取操作...`)
        await claimNightmareRewardsForCard(token)
        
        results.push({
          tokenId: token.id,
          tokenName: token.name || token.id,
          success: true
        })
        
        message.success(`Token ${token.name || token.id} 领取成功 (${i + 1}/${tokens.length})`)
        logOperation('shidian', '批量领取', {
          cardType: '十殿信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: '十殿奖励领取成功'
        })
      } catch (error) {
        console.error(`Token ${token.name || token.id} 处理失败:`, error)
        results.push({
          tokenId: token.id,
          tokenName: token.name || token.id,
          success: false,
          error: error.message
        })
        message.warning(`Token ${token.name || token.id} 领取失败: ${error.message}`)
        logOperation('shidian', '批量领取', {
          cardType: '十殿信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `领取失败: ${error.message}`
        })
      } finally {
        // 释放连接
        await connectionPool.release(token.id, false)
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    message.success(`批量领取完成！成功: ${successCount}个，失败: ${failCount}个`)
    logOperation('shidian', '批量领取', {
      cardType: '十殿信息',
      status: 'success',
      message: `批量领取完成！成功: ${successCount}个，失败: ${failCount}个`
    })
    
    if (failCount > 0) {
      const failedTokens = results.filter(r => !r.success)
      console.warn('批量领取失败详情:', failedTokens)
      message.warning(`有 ${failCount} 个Token领取失败，请查看控制台获取详细信息`)
    }
  } catch (error) {
    console.error('批量领取过程中发生错误:', error)
    message.error(`批量领取失败: ${error.message}`)
    logOperation('shidian', '批量领取', {
      cardType: '十殿信息',
      status: 'error',
      message: `批量领取失败: ${error.message}`
    })
  } finally {
    isBatchClaiming.value = false
  }
}

// 辅助函数：通过remark查找token
const findTokensByRemark = (remarkLabel) => {
  const gameTokens = toRaw(tokenStore.gameTokens)
  return gameTokens.filter(t => {
    if (!t.remark) return false
    return t.remark.trim().includes(remarkLabel)
  })
}

// 辅助函数：模拟点击token昵称（连接token）
// 带重试机制的命令执行函数
const executeCommandWithRetry = async (commandFn, token, commandName = '') => {
  try {
    return await commandFn()
  } catch (error) {
    // 检查是否是连接失败错误
    if (error.message && (error.message.includes('WebSocket未连接') || error.message.includes('连接失败'))) {
      message.warning(`执行${commandName}时连接失败，等待6分钟后重新连接并重试...`)
      
      // 等待6分钟
      await new Promise(resolve => setTimeout(resolve, 6 * 60 * 1000))
      
      // 重新连接token
      const reconnected = await connectTokenByClick(token, 5)
      if (reconnected) {
        message.success(`${token.name} 重新连接成功，重试${commandName}...`)
        // 重试命令
        return await commandFn()
      } else {
        throw new Error(`重新连接${token.name}失败`)
      }
    } else {
      // 不是连接失败错误，直接抛出
      throw error
    }
  }
}

const connectTokenByClick = async (token, maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      tokenStore.selectToken(token.id)
      
      // 使用连接池管理器获取连接
      const connectionAcquired = await connectionPool.acquire(token.id, 5)
      
      if (!connectionAcquired) {
        console.log(`Token ${token.name} 连接池获取连接失败`)
        if (i < maxRetries - 1) {
          console.log(`等待6分钟后重试连接 ${token.name}...`)
          await new Promise(resolve => setTimeout(resolve, 6 * 60 * 1000))
        }
        continue
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
        return true
      } else {
        console.log(`Token ${token.name} 连接失败，状态: ${tokenStore.getWebSocketStatus(token.id)}`)
        // 释放连接
        await connectionPool.release(token.id, false)
        // 如果连接失败，等待6分钟后再重试
        if (i < maxRetries - 1) {
          console.log(`等待6分钟后重试连接 ${token.name}...`)
          await new Promise(resolve => setTimeout(resolve, 6 * 60 * 1000))
        }
      }
    } catch (error) {
      console.error(`连接token ${token.name} 失败 (尝试 ${i + 1}/${maxRetries}):`, error)
      // 释放连接
      await connectionPool.release(token.id, false)
      // 如果连接失败，等待6分钟后再重试
      if (i < maxRetries - 1) {
        console.log(`等待6分钟后重试连接 ${token.name}...`)
        await new Promise(resolve => setTimeout(resolve, 6 * 60 * 1000))
      }
    }
  }
  return false
}

// 辅助函数：获取token的十殿层数
const getTokenNightmareLevel = async (tokenId) => {
  try {
    const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(tokenId, { roleId: tokenId })
    if (!nightmareInfo) return 0
    
    const weekAward = nightmareInfo.weekAward
    if (weekAward && typeof weekAward === 'object') {
      const keys = Object.keys(weekAward).sort().reverse()
      if (keys.length > 0) {
        return weekAward[keys[0]]?.maxLevel || 0
      }
    }
    return nightmareInfo.maxLevel || 0
  } catch (error) {
    console.error('获取十殿层数失败:', error)
    return 0
  }
}

// 辅助函数：等待leaderComplete消息或超时
const waitForLeaderComplete = (timeout = 22000) => {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      // 这里需要根据实际的消息监听机制来实现
      // 暂时使用超时机制
      if (Date.now() - startTime >= timeout) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
    
    // 设置超时
    setTimeout(() => {
      clearInterval(checkInterval)
      resolve(false)
    }, timeout)
  })
}

// 十殿恢复
const nightmareRestore = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!displayTeamId.value) {
    message.warning('请先获取队伍号')
    return
  }

  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    message.info('正在执行十殿恢复...')
    
    // 执行nightmare_restore操作
    await tokenStore.sendGameMessage(token.id, 'nightmare_restore', {
      roomId: displayTeamId.value,
      roleId: parseInt(token.id)
    })
    
    message.success('十殿恢复执行成功')
    logOperation('shidian', '十殿恢复', {
      cardType: '十殿信息',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'success',
      message: '十殿恢复执行成功'
    })
  } catch (error) {
    console.error('十殿恢复失败:', error)
    message.error(`十殿恢复失败: ${error.message || error}`)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    logOperation('shidian', '十殿恢复', {
      cardType: '十殿信息',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `十殿恢复失败: ${error.message || error}`
    })
  }
}

// 重置枕头数量
const resetPillowCount = async () => {
  // 清空本地存储中的十殿枕头数量
  try {
    const key = 'pageTokenData_shidian'
    const valueStr = localStorage.getItem(key)
    if (valueStr) {
      const value = JSON.parse(valueStr)
      value.tokenPillowCount = {}
      localStorage.setItem(key, JSON.stringify(value))
      console.log('本地存储中的十殿枕头数量已清空')
      message.success('十殿枕头数量已重置')
      logOperation('shidian', '重置枕头', {
        cardType: '十殿信息',
        tokenId: props.selectedTokenId,
        tokenName: tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)?.name,
        status: 'success',
        message: '十殿枕头数量已重置'
      })
    }
  } catch (error) {
    console.error('清空本地存储中的十殿枕头数量失败:', error)
    message.error('重置十殿枕头数量失败')
    logOperation('shidian', '重置枕头', {
      cardType: '十殿信息',
      tokenId: props.selectedTokenId,
      tokenName: tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)?.name,
      status: 'error',
      message: `重置枕头失败: ${error.message || error}`
    })
  }
}

// 更新枕头数量
const updatePillowCount = async (tokenId, change) => {
  try {
    const key = 'pageTokenData_shidian'
    const valueStr = localStorage.getItem(key)
    let value = {}
    if (valueStr) {
      value = JSON.parse(valueStr)
    }
    if (!value.tokenPillowCount) {
      value.tokenPillowCount = {}
    }
    if (!value.tokenPillowCount[tokenId]) {
      value.tokenPillowCount[tokenId] = 0
    }
    value.tokenPillowCount[tokenId] += change
    if (value.tokenPillowCount[tokenId] < 0) {
      value.tokenPillowCount[tokenId] = 0
    }
    localStorage.setItem(key, JSON.stringify(value))
    console.log(`更新枕头数量: ${tokenId} +${change} = ${value.tokenPillowCount[tokenId]}`)
  } catch (error) {
    console.error('更新枕头数量失败:', error)
  }
}

// 批量十殿执行流程
// 第一步：十殿7准备
// 1. 查找十殿枕头数量不为0，并且标签为"殿7"的Token，模拟点击标签为"殿7"的Token昵称
// 2. 模拟点击"十殿枕头"按钮，重新获取十殿枕头，如果十殿枕头为0，跳转到1，否则跳转到3
// 3. 模拟点击"创建房间按钮"
// 4. 模拟点击"队伍号"按钮，获取teamid
// 
// 第二步：十殿2准备
// 1. 查找十殿枕头数量不为0，并且标签为"殿2"的Token，模拟点击标签为"殿2"的Token昵称
// 2. 模拟点击"十殿枕头"按钮，重新获取十殿枕头，如果十殿枕头为0，跳转到1，否则跳转到3
// 3. 模拟点击"加入房间"按钮，如果准备失败，再次点击"加入房间"按钮
// 
// 第三步：十殿5准备
// 1. 查找十殿枕头数量不为0，并且标签为"殿5"的Token，模拟点击标签为"殿5"的Token昵称
// 2. 模拟点击"十殿枕头"按钮，重新获取十殿枕头，如果十殿枕头为0，跳转到1，否则跳转到3
// 3. 模拟点击"加入房间"按钮，如果准备失败，再次点击"加入房间"按钮
// 
// 第四步：十殿0准备
// 1. 查找十殿枕头数量为5，并且标签为"殿0"的Token，模拟点击标签为"殿0"的Token昵称
// 2. 模拟点击"十殿枕头"按钮，重新获取十殿枕头，如果十殿枕头数量小于5，跳转到1，否则跳转到3
// 3. 模拟点击"加入房间"按钮，如果准备失败，再次点击"加入房间"按钮
// 重复执行1-3一次，加入两个十殿0
// 
// 第五步：开始十殿
// 模拟点击开始十殿按钮，等待18s
// 
// 第六步：殿1执行
// 流程：设置出战人员（殿1） -> 开始战斗（殿1）
// 执行的命令：
// 1. nightmare_setfighter - 设置出战人员（殿1）
// 2. nightmare_fight - 开始战斗（殿1）
// 
// 第七步：殿2执行
// 流程：殿7出战 -> 殿2出战 -> 检查层数（如果是2层，则殿0出战）
// 执行的命令：
// 1. nightmare_setfighter - 设置出战人员（殿7）
// 2. nightmare_fight - 开始战斗（殿7）
// 3. nightmare_setfighter - 设置出战人员（殿2）
// 4. nightmare_fight - 开始战斗（殿2）
// 5. nightmare_getroleinfo - 获取十殿信息（检查层数）
// 6. 如果层数为2，则殿0出战
// 
// 第八步：殿3执行
// 流程：殿7出战
// 执行的命令：
// 1. role_getroleinfo - 获取角色信息
// 2. nightmare_getroleinfo - 获取十殿信息（获取roomId）
// 3. nightmare_setfighter - 设置出战人员（殿7）
// 4. nightmare_fight - 开始战斗（殿7）
// 
// 第九步：殿4执行
// 流程：殿7出战
// 执行的命令：
// 1. role_getroleinfo - 获取角色信息
// 2. nightmare_getroleinfo - 获取十殿信息（获取roomId）
// 3. nightmare_setfighter - 设置出战人员（殿7）
// 4. nightmare_fight - 开始战斗（殿7）
// 
// 第十步：殿5执行
// 流程：殿5出战 -> 检查层数（如果是5层，则殿2出战） -> 检查层数（如果是5层，则殿7出战）
// 执行的命令：
// 1. role_getroleinfo - 获取角色信息
// 2. nightmare_getroleinfo - 获取十殿信息（获取roomId）
// 3. nightmare_setfighter - 设置出战人员（殿5）
// 4. nightmare_fight - 开始战斗（殿5）
// 5. nightmare_getroleinfo - 获取十殿信息（检查层数）
// 6. 如果层数为5，则殿2出战
// 7. nightmare_setfighter - 设置出战人员（殿2）
// 8. nightmare_fight - 开始战斗（殿2）
// 9. nightmare_getroleinfo - 获取十殿信息（检查层数）
// 10. 如果层数为5，则殿7出战
// 11. nightmare_setfighter - 设置出战人员（殿7）
// 12. nightmare_fight - 开始战斗（殿7）
// 
// 第十一步：殿6执行
// 流程：恢复殿2和殿7 -> 殿2出战 -> 殿7出战 -> 检查层数（如果是6层，则3个殿0依次出战）
// 执行的命令：
// 1. 恢复殿2和殿7（可能需要特定的实现）
// 2. role_getroleinfo - 获取角色信息
// 3. nightmare_getroleinfo - 获取十殿信息（获取roomId）
// 4. nightmare_setfighter - 设置出战人员（殿2）
// 5. nightmare_fight - 开始战斗（殿2）
// 6. nightmare_setfighter - 设置出战人员（殿7）
// 7. nightmare_fight - 开始战斗（殿7）
// 8. nightmare_getroleinfo - 获取十殿信息（检查层数）
// 9. 如果层数为6，则3个殿0依次出战
// 
// 第十二步：殿7执行
// 流程：恢复殿7 -> 设置出战人员（殿7） -> 开始战斗（殿7）
// 执行的命令：
// 1. 恢复殿7（可能需要特定的实现）
// 2. nightmare_setfighter - 设置出战人员（殿7）
// 3. nightmare_fight - 开始战斗（殿7）
// 
// 第十三步：使用两个"殿0"token，执行两次"踢出房间"按钮
// 
// 第十四步：殿2、殿5、殿7标签token十殿枕头数量各减1
// 如果"殿2"标签token,十殿枕头数量为0，使用"殿2"标签token，执行"踢出房间"按钮，执行第二步
// 如果"殿5"标签token,十殿枕头数量为0，使用"殿5"标签token，执行"踢出房间"按钮，执行第三步
// 如果"殿7"标签token,十殿枕头数量为0，执行第一步。使用"殿7"标签token，执行"转让房主"按钮。模拟点击新房主token，使用十殿枕头数量变为0的"殿7"标签token，执行"踢出房间"按钮
// 
// 第十五步：跳转到第四步
// 
// 循环结束与结果处理
// 1. 检查结束条件：如果第四步检查所有殿0，枕头数量都小于5，跳出循环，停止执行
// 2. 显示结果：显示批量十殿完成的成功消息，显示总共执行的轮数
// 3. 记录日志：记录批量执行完成的日志信息
const batchNightmare = async () => {
  if (isBatchNightmareRunning.value) {
    message.warning('批量十殿正在进行中，请稍候...')
    return
  }

  const gameTokens = toRaw(tokenStore.gameTokens)
  if (gameTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }

  isBatchNightmareRunning.value = true
  try {
    message.info('开始批量十殿...')
    
    // 按照名称排序token顺序
    let gameTokens = toRaw(tokenStore.gameTokens)
    gameTokens.sort((a, b) => {
      const nameA = a.name || a.id || ''
      const nameB = b.name || b.id || ''
      return nameA.localeCompare(nameB, 'zh-CN')
    })
    
    // 解析执行范围
    const tokenIds = parseExecutionRange(resourceExportRange.value) || gameTokens.map(t => t.id)
    const tokens = gameTokens.filter(t => tokenIds.includes(t.id))
    
    if (tokens.length === 0) {
      message.warning('没有符合执行范围的Token')
      isBatchNightmareRunning.value = false
      return
    }
    
    message.info(`执行范围: ${resourceExportRange.value || '全部Token'}，共${tokens.length}个Token`)

    let cycleCount = 0
    let continueLoop = true

    while (continueLoop) {
      cycleCount++
      message.info(`第${cycleCount}轮批量十殿循环开始...`)

      // 第一步：十殿7准备
      message.info('第一步：十殿7准备...')
      let dian7Token = null
      let dian7PillowCount = 0 // 记录殿7枕头数X
      while (!dian7Token) {
        // 1. 查找十殿枕头数量不为0，并且标签为"殿7"的Token
        const dian7Tokens = findTokensByRemark('殿7')
        let foundValidDian7 = false
        
        for (const token of dian7Tokens) {
          // 先检查本地存储枕头数量
          const localPillowCount = getLocalPillowCount(token.id)
          if (localPillowCount === 0) {
            message.warning(`${token.name} 本地存储枕头数量为0，跳过`)
            continue
          }
          
          // 连接Token
          await connectTokenByClick(token, 5)
          
          // 获取十殿枕头数量
          const pillowCount = await getPillowCountForToken(token)
          if (pillowCount === 0) {
            message.warning(`${token.name} 枕头数量为0，尝试下一个殿7Token`)
            continue
          } else {
            dian7Token = token
            dian7PillowCount = pillowCount // 记录枕头数X
            message.success(`${token.name} 枕头数量为${pillowCount}，符合条件`)
            foundValidDian7 = true
            break
          }
        }
        
        if (!foundValidDian7) {
          message.error('没有找到枕头数量不为0的殿7Token')
          continueLoop = false
          break
        }
      }
      
      if (!continueLoop) break
      
      // 3. 模拟点击"创建房间按钮"
      await executeCommandWithRetry(
        () => tokenStore.sendGameMessage(dian7Token.id, 'matchteam_createteam', { teamId: 0, extParam: 0 }), 
        dian7Token, 
        '创建房间'
      )
      
      // 4. 模拟点击"队伍号"按钮，获取teamid
      const teamInfo = await executeCommandWithRetry(
        () => tokenStore.sendMatchteamGetRoleTeamInfo(dian7Token.id, {}), 
        dian7Token, 
        '获取队伍信息'
      )
      if (teamInfo && teamInfo.teamId) {
        displayTeamId.value = teamInfo.teamId
        message.success(`获取队伍号成功: ${teamInfo.teamId}`)
      }

      // 第二步：十殿2准备
      message.info('第二步：十殿2准备...')
      let dian2Token = null
      let dian2PillowCount = 0 // 记录殿2枕头数Y
      while (!dian2Token) {
        // 1. 查找十殿枕头数量不为0，并且标签为"殿2"的Token
        const dian2Tokens = findTokensByRemark('殿2')
        let foundValidDian2 = false
        
        for (const token of dian2Tokens) {
          // 先检查本地存储枕头数量
          const localPillowCount = getLocalPillowCount(token.id)
          if (localPillowCount === 0) {
            message.warning(`${token.name} 本地存储枕头数量为0，跳过`)
            continue
          }
          
          // 连接Token
          await connectTokenByClick(token, 5)
          
          // 获取十殿枕头数量
          const pillowCount = await getPillowCountForToken(token)
          if (pillowCount === 0) {
            message.warning(`${token.name} 枕头数量为0，尝试下一个殿2Token`)
            continue
          } else {
            dian2Token = token
            dian2PillowCount = pillowCount // 记录枕头数Y
            message.success(`${token.name} 枕头数量为${pillowCount}，符合条件`)
            foundValidDian2 = true
            break
          }
        }
        
        if (!foundValidDian2) {
          message.error('没有找到枕头数量不为0的殿2Token')
          continueLoop = false
          break
        }
      }
      
      if (!continueLoop) break
      
      // 3. 模拟点击"加入房间"按钮，如果准备失败，再次点击"加入房间"按钮
      let joinSuccess = false
      let joinAttempts = 0
      while (!joinSuccess && joinAttempts < 3) {
        joinAttempts++
        try {
          await executeCommandWithRetry(
            () => tokenStore.sendGameMessage(dian2Token.id, 'matchteam_join', { teamId: displayTeamId.value }), 
            dian2Token, 
            '加入房间'
          )
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 检查准备状态
          const teamInfo = await executeCommandWithRetry(
            () => tokenStore.sendMatchteamGetRoleTeamInfo(dian2Token.id, {}), 
            dian2Token, 
            '获取队伍信息'
          )
          if (teamInfo && !teamInfo.isPrepare) {
            await executeCommandWithRetry(
              () => tokenStore.sendGameMessage(dian2Token.id, 'matchteam_memberprepare', { teamId: displayTeamId.value }), 
              dian2Token, 
              '准备'
            )
          }
          joinSuccess = true
          message.success(`${dian2Token.name} 加入房间成功`)
        } catch (error) {
          message.warning(`${dian2Token.name} 加入房间失败，尝试再次加入...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // 第三步：十殿0准备
      message.info('第三步：十殿0准备...')
      let dian0TokensJoined = []
      let dian0JoinCount = 0
      
      while (dian0JoinCount < 3) {
        // 1. 查找十殿枕头数量为5，并且标签为"殿0"的Token
        const dian0Tokens = findTokensByRemark('殿0').filter(token => 
          !dian0TokensJoined.includes(token.id)
        )
        
        let foundValidDian0 = false
        
        for (const token of dian0Tokens) {
          // 先检查本地存储枕头数量
          const localPillowCount = getLocalPillowCount(token.id)
          if (localPillowCount < 5) {
            message.warning(`${token.name} 本地存储枕头数量为${localPillowCount}，小于5，跳过`)
            continue
          }
          
          // 连接Token
          await connectTokenByClick(token, 5)
          
          // 获取十殿枕头数量
          const pillowCount = await getPillowCountForToken(token)
          if (pillowCount < 5) {
            message.warning(`${token.name} 枕头数量为${pillowCount}，小于5，跳过`)
            continue
          } else {
            // 3. 模拟点击"加入房间"按钮，如果准备失败，再次点击"加入房间"按钮
            let join0Success = false
            let join0Attempts = 0
            while (!join0Success && join0Attempts < 3) {
              join0Attempts++
              try {
                await executeCommandWithRetry(
                  () => tokenStore.sendGameMessage(token.id, 'matchteam_join', { teamId: displayTeamId.value }), 
                  token, 
                  '加入房间'
                )
                await new Promise(resolve => setTimeout(resolve, 500))
                
                // 检查准备状态
                const teamInfo = await executeCommandWithRetry(
                  () => tokenStore.sendMatchteamGetRoleTeamInfo(token.id, {}), 
                  token, 
                  '获取队伍信息'
                )
                if (teamInfo && !teamInfo.isPrepare) {
                  await executeCommandWithRetry(
                    () => tokenStore.sendGameMessage(token.id, 'matchteam_memberprepare', { teamId: displayTeamId.value }), 
                    token, 
                    '准备'
                  )
                }
                join0Success = true
                dian0TokensJoined.push(token.id)
                dian0JoinCount++
                message.success(`${token.name} 加入房间成功，已加入${dian0JoinCount}/3个殿0`)
                foundValidDian0 = true
                break
              } catch (error) {
                message.warning(`${token.name} 加入房间失败，尝试再次加入...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
            
            if (dian0JoinCount >= 3) break
          }
        }
        
        if (!foundValidDian0) {
          message.error('没有找到枕头数量为5的殿0Token')
          // 检查结束条件：所有殿0枕头数量都小于5
          const allDian0Tokens = findTokensByRemark('殿0')
          let allDian0PillowLessThan5 = true
          for (const token of allDian0Tokens) {
            const localPillowCount = getLocalPillowCount(token.id)
            if (localPillowCount >= 5) {
              allDian0PillowLessThan5 = false
              break
            }
          }
          
          if (allDian0PillowLessThan5) {
            message.success('所有殿0枕头数量都小于5，循环结束')
            continueLoop = false
          }
          break
        }
      }
      
      if (!continueLoop) break

      // 第四步：开始十殿
      message.info('第四步：开始十殿...')
      await executeCommandWithRetry(
        () => tokenStore.sendGameMessage(dian7Token.id, 'matchteam_start', { teamId: displayTeamId.value }), 
        dian7Token, 
        '开始十殿'
      )
      await new Promise(resolve => setTimeout(resolve, 20000)) // 等待20s
      message.success('十殿开始完成')

      // 获取roomid
      message.info('正在获取房间号...')
      const roomInfo = await tokenStore.sendMatchteamGetRoleTeamInfo(dian7Token.id, {})
      if (roomInfo) {
        displayTeamId.value = roomInfo.teamId || 0
        displayRoomId.value = roomInfo.roomId || 0
        message.success(`获取房间号成功: 队伍号${displayTeamId.value}, 房间号${displayRoomId.value}`)
      } else {
        message.warning('获取房间号失败')
      }

      // 第五步：殿1执行
      message.info('第五步：执行殿级1...')
      // 殿7出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '设置殿7出战'
      )
      // 开始战斗
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 1
        }),
        dian7Token,
        '开始殿1战斗'
      )

      // 第六步：殿2执行
      message.info('第六步：执行殿级2...')
      // 殿7出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '设置殿7出战'
      )
      // 殿2出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian2Token.id)
        }),
        dian7Token,
        '设置殿2出战'
      )
      // 检查层数，若为2层则殿0出战
      const dian0Tokens = findTokensByRemark('殿0')
      if (dian0Tokens.length > 0) {
        const dian0Token = dian0Tokens[0]
        const nightmareInfo = await executeCommandWithRetry(
          () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
          dian7Token,
          '获取十殿信息'
        )
        if (nightmareInfo && nightmareInfo.maxLevel === 2) {
          await executeCommandWithRetry(
            () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
              roomId: displayRoomId.value,
              roleId: parseInt(dian0Token.id)
            }),
            dian7Token,
            '设置殿0出战'
          )
        }
      }

      // 第七步：殿3执行
      message.info('第七步：执行殿级3...')
      // 获取角色信息
      await executeCommandWithRetry(
        () => tokenStore.sendGetRoleInfo(dian7Token.id),
        dian7Token,
        '获取角色信息'
      )
      // 获取十殿信息
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
        dian7Token,
        '获取十殿信息'
      )
      // 殿7出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '设置殿7出战'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 3
        }),
        dian7Token,
        '开始殿3战斗'
      )

      // 第八步：殿4执行
      message.info('第八步：执行殿级4...')
      // 获取角色信息
      await executeCommandWithRetry(
        () => tokenStore.sendGetRoleInfo(dian7Token.id),
        dian7Token,
        '获取角色信息'
      )
      // 获取十殿信息
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
        dian7Token,
        '获取十殿信息'
      )
      // 殿7出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '设置殿7出战'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 4
        }),
        dian7Token,
        '开始殿4战斗'
      )

      // 第九步：殿5执行
      message.info('第九步：执行殿级5...')
      // 获取角色信息
      await executeCommandWithRetry(
        () => tokenStore.sendGetRoleInfo(dian7Token.id),
        dian7Token,
        '获取角色信息'
      )
      // 获取十殿信息
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
        dian7Token,
        '获取十殿信息'
      )
      // 殿2出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian2Token.id)
        }),
        dian7Token,
        '设置殿2出战'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 5
        }),
        dian7Token,
        '开始殿5战斗'
      )
      // 检查层数，若为5层则殿0出战
      if (dian0Tokens.length > 0) {
        const dian0Token = dian0Tokens[0]
        const nightmareInfo = await executeCommandWithRetry(
          () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
          dian7Token,
          '获取十殿信息'
        )
        if (nightmareInfo && nightmareInfo.maxLevel === 5) {
          await executeCommandWithRetry(
            () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
              roomId: displayRoomId.value,
              roleId: parseInt(dian0Token.id)
            }),
            dian7Token,
            '设置殿0出战'
          )
          // 再次检查层数，若为5层则殿0出战
          const nightmareInfo2 = await executeCommandWithRetry(
            () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
            dian7Token,
            '获取十殿信息'
          )
          if (nightmareInfo2 && nightmareInfo2.maxLevel === 5) {
            if (dian0Tokens.length > 1) {
              const dian0Token2 = dian0Tokens[1]
              await executeCommandWithRetry(
                () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
                  roomId: displayRoomId.value,
                  roleId: parseInt(dian0Token2.id)
                }),
                dian7Token,
                '设置殿0出战'
              )
            }
          }
          // 再次检查层数，若为5层则殿7出战
          const nightmareInfo3 = await executeCommandWithRetry(
            () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
            dian7Token,
            '获取十殿信息'
          )
          if (nightmareInfo3 && nightmareInfo3.maxLevel === 5) {
            await executeCommandWithRetry(
              () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
                roomId: displayRoomId.value,
                roleId: parseInt(dian7Token.id)
              }),
              dian7Token,
              '设置殿7出战'
            )
            // 检查层数，若为5层,模拟点击解散十殿按钮
            const nightmareInfo4 = await executeCommandWithRetry(
              () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
              dian7Token,
              '获取十殿信息'
            )
            if (nightmareInfo4 && nightmareInfo4.maxLevel === 5) {
              await executeCommandWithRetry(
                () => tokenStore.sendGameMessage(dian7Token.id, 'nightmare_dismiss', {
                  roomId: displayRoomId.value
                }),
                dian7Token,
                '解散十殿'
              )
            }
          }
        }
      }

      // 第十步：殿6执行
      message.info('第十步：执行殿级6...')
      // 恢复殿2和殿7
      await executeCommandWithRetry(
        () => tokenStore.sendGameMessage(dian7Token.id, 'nightmare_restore', {
          roomId: displayRoomId.value,
          roleId: parseInt(dian2Token.id)
        }),
        dian7Token,
        '恢复殿2'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendGameMessage(dian7Token.id, 'nightmare_restore', {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '恢复殿7'
      )
      // 殿2出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian2Token.id)
        }),
        dian7Token,
        '设置殿2出战'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 6
        }),
        dian7Token,
        '开始殿6战斗'
      )
      // 殿7出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '设置殿7出战'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 6
        }),
        dian7Token,
        '开始殿6战斗'
      )
      // 检查层数，若为6层,模拟点击解散十殿按钮
      const nightmareInfo6 = await executeCommandWithRetry(
        () => tokenStore.sendNightmareGetRoleInfo(dian7Token.id, { roleId: parseInt(dian7Token.id) }),
        dian7Token,
        '获取十殿信息'
      )
      if (nightmareInfo6 && nightmareInfo6.maxLevel === 6) {
        await executeCommandWithRetry(
          () => tokenStore.sendGameMessage(dian7Token.id, 'nightmare_dismiss', {
            roomId: displayRoomId.value
          }),
          dian7Token,
          '解散十殿'
        )
      }

      // 第十一步：殿7执行
      message.info('第十一步：执行殿级7...')
      // 恢复殿7
      await executeCommandWithRetry(
        () => tokenStore.sendGameMessage(dian7Token.id, 'nightmare_restore', {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '恢复殿7'
      )
      // 殿7出战
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareSetFighter(dian7Token.id, {
          roomId: displayRoomId.value,
          roleId: parseInt(dian7Token.id)
        }),
        dian7Token,
        '设置殿7出战'
      )
      await executeCommandWithRetry(
        () => tokenStore.sendNightmareFight(dian7Token.id, {
          roomId: displayRoomId.value,
          dianLevel: 7
        }),
        dian7Token,
        '开始殿7战斗'
      )

      // 第十二步：踢出殿0
      message.info('第十二步：踢出三个殿0...')
      const dian0TokensToKick = findTokensByRemark('殿0').slice(0, 3)
      for (const token of dian0TokensToKick) {
        await executeCommandWithRetry(
          () => kickFromRoom(token), 
          token, 
          '踢出房间'
        )
        message.success(`踢出殿0: ${token.name}`)
      }

      // 第十三步：处理枕头数量
      message.info('第十三步：处理枕头数量...')
      
      // 殿2的枕头数量-1、殿7的枕头数量-1
      await updatePillowCount(dian2Token.id, -1)
      await updatePillowCount(dian7Token.id, -1)
      
      // 重新获取枕头数量
      const updatedDian2PillowCount = await getPillowCountForToken(dian2Token)
      const updatedDian7PillowCount = await getPillowCountForToken(dian7Token)
      
      message.info(`殿2枕头数量: ${updatedDian2PillowCount}, 殿7枕头数量: ${updatedDian7PillowCount}`)
      
      // 若X、Y枕头数量均大于0，跳转第三步，继续执行循环
      if (updatedDian2PillowCount > 0 && updatedDian7PillowCount > 0) {
        message.info('殿2和殿7枕头数量均大于0，跳转到第三步继续执行')
        // 跳转到第三步，继续执行循环
        continue
      } else {
        // 若X、Y有一个枕头数量为0，跳转到第一个步，继续执行循环
        message.info('殿2或殿7枕头数量为0，跳转到第一步继续执行')
        // 跳转到第一步，继续执行循环
        // 这里通过continue实现，会重新开始整个循环
        continue
      }
    }

    message.success(`🎉 批量十殿完成！总共执行了${cycleCount}轮`)
    
    // 记录批量执行完成日志
    logStore.addLog({
      page: 'shidian',
      operation: '批量十殿',
      status: 'success',
      message: `批量十殿完成，总共执行了${cycleCount}轮`
    })
  } catch (error) {
    console.error('批量十殿失败:', error)
    message.error(`批量十殿失败: ${error.message || error}`)
  } finally {
    isBatchNightmareRunning.value = false
  }
}

// 停止十殿（暂时空白）
const stopNightmare = async () => {
  message.info('停止十殿功能暂未实现')
  // TODO: 实现停止十殿功能
}

// 解散十殿
const nightmareDismiss = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }

  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!displayTeamId.value) {
    message.warning('请先获取队伍号')
    return
  }

  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    message.info('正在执行解散十殿...')
    
    // 执行nightmare_dismiss操作
    await tokenStore.sendGameMessage(token.id, 'nightmare_dismiss', {
      roomId: displayTeamId.value
    })
    
    message.success('解散十殿执行成功')
    logOperation('shidian', '解散十殿', {
      cardType: '十殿信息',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'success',
      message: '解散十殿执行成功'
    })
  } catch (error) {
    console.error('解散十殿失败:', error)
    message.error(`解散十殿失败: ${error.message || error}`)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    logOperation('shidian', '解散十殿', {
      cardType: '十殿信息',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `解散十殿失败: ${error.message || error}`
    })
  }
}

// 执行出战人员
const executeFighter = async () => {
  if (!selectedFighterDian.value) {
    message.warning('请先选择Token标签')
    return
  }

  if (!props.selectedTokenId) {
    message.warning('请先选择房主Token')
    return
  }

  const tokenLabel = selectedFighterDian.value
  const tokens = findTokensByRemark(tokenLabel)
  
  if (tokens.length === 0) {
    message.error(`未找到标记为"${tokenLabel}"的Token`)
    return
  }

  const token = tokens[0]
  
  // 检查是否已记录该token的roleId
  if (!tokenRoleIds.value[token.id]) {
    message.error(`未找到Token ${token.name} 的roleId，请先执行"加入房间"操作`)
    return
  }
  
  const ownerToken = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!ownerToken) {
    message.error('找不到房主Token')
    return
  }
  
  try {
    message.info(`正在为${token.name}执行出战人员...`)
    
    // 使用房主token执行出战人员命令
    await tokenStore.sendNightmareSetFighter(ownerToken.id, {
      roomId: displayTeamId.value,
      roleId: parseInt(tokenRoleIds.value[token.id])
    })
    
    message.success(`${token.name} 出战人员设置成功`)
    logOperation('shidian', '出战人员', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${token.name} 出战人员设置成功`
    })
  } catch (error) {
    console.error('执行出战人员失败:', error)
    message.error(`执行出战人员失败: ${error.message || error}`)
    logOperation('shidian', '出战人员', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `执行出战人员失败: ${error.message || error}`
    })
  }
}

// 执行踢出房间
const executeKick = async () => {
  if (!selectedKickDian.value) {
    message.warning('请先选择Token标签')
    return
  }

  if (!props.selectedTokenId) {
    message.warning('请先选择房主Token')
    return
  }

  const tokenLabel = selectedKickDian.value
  const tokens = findTokensByRemark(tokenLabel)
  
  if (tokens.length === 0) {
    message.error(`未找到标记为"${tokenLabel}"的Token`)
    return
  }

  const ownerToken = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!ownerToken) {
    message.error('找不到房主Token')
    return
  }

  try {
    if (tokenLabel === '殿0') {
      // 殿0需要依次使用两个token执行两次踢出房间
      const tokensToKick = tokens.slice(0, 2)
      for (const token of tokensToKick) {
        // 检查是否已记录该token的roleId
        if (!tokenRoleIds.value[token.id]) {
          message.error(`未找到Token ${token.name} 的roleId，请先执行"加入房间"操作`)
          continue
        }
        
        message.info(`正在踢出${token.name}...`)
        
        // 使用房主token执行踢出房间命令
        await tokenStore.sendMatchteamKick(ownerToken.id, {
          teamId: displayTeamId.value,
          kickRoleId: parseInt(tokenRoleIds.value[token.id])
        })
        message.success(`${token.name} 踢出房间成功`)
      }
    } else {
      // 其他标签使用一个token执行踢出房间
      const token = tokens[0]
      
      // 检查是否已记录该token的roleId
      if (!tokenRoleIds.value[token.id]) {
        message.error(`未找到Token ${token.name} 的roleId，请先执行"加入房间"操作`)
        return
      }
      
      message.info(`正在踢出${token.name}...`)
      
      // 使用房主token执行踢出房间命令
      await tokenStore.sendMatchteamKick(ownerToken.id, {
        teamId: displayTeamId.value,
        kickRoleId: parseInt(tokenRoleIds.value[token.id])
      })
      message.success(`${token.name} 踢出房间成功`)
    }
    
    message.success('踢出房间执行成功')
    logOperation('shidian', '踢出房间', {
      cardType: '十殿信息',
      status: 'success',
      message: `踢出房间执行成功`
    })
  } catch (error) {
    console.error('执行踢出房间失败:', error)
    message.error(`执行踢出房间失败: ${error.message || error}`)
    logOperation('shidian', '踢出房间', {
      cardType: '十殿信息',
      status: 'error',
      message: `执行踢出房间失败: ${error.message || error}`
    })
  }
}

// 执行转让房主
const executeTransfer = async () => {
  if (!selectedTransferDian.value) {
    message.warning('请先选择Token标签')
    return
  }

  if (!props.selectedTokenId) {
    message.warning('请先选择房主Token')
    return
  }

  const tokenLabel = selectedTransferDian.value
  const tokens = findTokensByRemark(tokenLabel)
  
  if (tokens.length === 0) {
    message.error(`未找到标记为"${tokenLabel}"的Token`)
    return
  }

  const token = tokens[0]
  
  // 检查是否已记录该token的roleId
  if (!tokenRoleIds.value[token.id]) {
    message.error(`未找到Token ${token.name} 的roleId，请先执行"加入房间"操作`)
    return
  }
  
  const ownerToken = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!ownerToken) {
    message.error('找不到房主Token')
    return
  }
  
  try {
    message.info(`正在为${token.name}执行转让房主...`)
    
    // 使用房主token执行转让房主命令
    // 先打开队伍
    await tokenStore.sendMatchteamOpenTeam(ownerToken.id, {
      teamId: displayTeamId.value,
      extParam: 0
    })
    
    // 转让房主给指定token（使用其roleId）
    await tokenStore.sendGameMessage(ownerToken.id, 'matchteam_transferowner', {
      teamId: displayTeamId.value,
      newOwnerId: parseInt(tokenRoleIds.value[token.id])
    })
    
    message.success(`${token.name} 转让房主成功`)
    logOperation('shidian', '转让房主', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${token.name} 转让房主成功`
    })
  } catch (error) {
    console.error('执行转让房主失败:', error)
    message.error(`执行转让房主失败: ${error.message || error}`)
    logOperation('shidian', '转让房主', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `执行转让房主失败: ${error.message || error}`
    })
  }
}

// 执行十殿恢复
const executeRestore = async () => {
  if (!selectedRestoreDian.value) {
    message.warning('请先选择Token标签')
    return
  }

  if (!props.selectedTokenId) {
    message.warning('请先选择房主Token')
    return
  }

  const tokenLabel = selectedRestoreDian.value
  const tokens = findTokensByRemark(tokenLabel)
  
  if (tokens.length === 0) {
    message.error(`未找到标记为"${tokenLabel}"的Token`)
    return
  }

  const token = tokens[0]
  
  // 检查是否已记录该token的roleId
  if (!tokenRoleIds.value[token.id]) {
    message.error(`未找到Token ${token.name} 的roleId，请先执行"加入房间"操作`)
    return
  }
  
  const ownerToken = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!ownerToken) {
    message.error('找不到房主Token')
    return
  }
  
  try {
    message.info(`正在为${token.name}执行十殿恢复...`)
    
    // 使用房主token执行十殿恢复命令
    await tokenStore.sendGameMessage(ownerToken.id, 'nightmare_restore', {
      roomId: displayTeamId.value,
      roleId: parseInt(tokenRoleIds.value[token.id])
    })
    
    message.success(`${token.name} 十殿恢复成功`)
    logOperation('shidian', '十殿恢复', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `${token.name} 十殿恢复成功`
    })
  } catch (error) {
    console.error('执行十殿恢复失败:', error)
    message.error(`执行十殿恢复失败: ${error.message || error}`)
    logOperation('shidian', '十殿恢复', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `执行十殿恢复失败: ${error.message || error}`
    })
  }
}

// 切换到阵容1
const switchToTeam1 = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  connectingTokens.value.add(token.id)
  try {
    message.info('正在切换到阵容1...')
    
    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 1 })
    
    // 执行命令前等待400ms
    await new Promise(resolve => setTimeout(resolve, 400))
    // 获取队伍信息
    const teamInfo = await tokenStore.sendMatchteamGetRoleTeamInfo(token.id, {})
    if (teamInfo) {
      displayTeamId.value = teamInfo.teamId || 0
      displayRoomId.value = teamInfo.roomId || 0
    }
    
    message.success('已切换到阵容1')
    logOperation('shidian', '切换阵1', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '已切换到阵容1'
    })
  } catch (error) {
    console.error('切换阵容1失败:', error)
    message.error(`切换阵容1失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '切换阵1', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `切换阵容1失败: ${error.message || '未知错误'}`
    })
  } finally {
    connectingTokens.value.delete(token.id)
  }
}

// 获取当前殿级
const getNightmareLevelInfo = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  try {
    message.info('正在获取当前殿级...')
    
    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    // 获取角色信息
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    let roleId = null
    if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
      roleId = roleInfo.role.roleId
    } else {
      roleId = token.id
    }

    // 获取十殿信息
    const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
    
    if (nightmareInfo && nightmareInfo.nightmare) {
      const level = nightmareInfo.nightmare.level || 0
      displayNightmareLevel.value = level
      
      message.success(`当前殿级：${level}`)
      logOperation('shidian', '当前殿级', {
        cardType: '十殿信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `当前殿级：${level}`
      })
    } else {
      displayNightmareLevel.value = 0
      message.warning('未获取到十殿信息')
    }
  } catch (error) {
    console.error('获取当前殿级失败:', error)
    message.error(`获取当前殿级失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '当前殿级', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `获取当前殿级失败: ${error.message || '未知错误'}`
    })
    displayNightmareLevel.value = 0
  }
}

// 获取房间号
const getRoomIdInfo = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  try {
    message.info('正在获取房间号...')
    
    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    // 获取角色信息
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    let roleId = null
    if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
      roleId = roleInfo.role.roleId
    } else {
      roleId = token.id
    }

    // 获取十殿信息
    const nightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
    
    if (nightmareInfo && nightmareInfo.nightMareData) {
      const roomId = nightmareInfo.nightMareData.roomId || 0
      displayRoomId.value = roomId
      
      // 保存到本地存储
      localStorage.setItem('shidian_roomId', roomId.toString())
      
      message.success(`房间号：${roomId}`)
      logOperation('shidian', '房间号', {
        cardType: '十殿信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `房间号：${roomId}`
      })
    } else {
      // 使用现有的房间号
      const existingRoomId = localStorage.getItem('shidian_roomId') || '0'
      displayRoomId.value = parseInt(existingRoomId)
      message.info(`使用已保存的房间号：${existingRoomId}`)
      logOperation('shidian', '房间号', {
        cardType: '十殿信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `使用已保存的房间号：${existingRoomId}`
      })
    }
  } catch (error) {
    console.error('获取房间号失败:', error)
    message.error(`获取房间号失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '房间号', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `获取房间号失败: ${error.message || '未知错误'}`
    })
    displayRoomId.value = 0
  }
}

// 获取队伍号
const getTeamIdInfo = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  try {
    message.info('正在获取队伍号...')
    
    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    // 获取角色信息
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    let roleId = null
    if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
      roleId = roleInfo.role.roleId
    } else {
      roleId = token.id
    }

    // 执行matchteam_getroleteaminfo命令
    const result = await tokenStore.sendMatchteamGetRoleTeamInfo(token.id, { roleID: parseInt(roleId) })
    
    if (result && result.roleMTData && result.roleMTData.gDMTData) {
      const gDMTData = result.roleMTData.gDMTData
      const keys = Object.keys(gDMTData)
      if (keys.length > 0) {
        const firstKey = keys[0]
        const teamData = gDMTData[firstKey]
        const teamId = teamData?.teamId || 0
        displayTeamId.value = teamId
        
        // 保存到本地存储
        localStorage.setItem('shidian_teamId', teamId.toString())
        
        message.success(`队伍号：${teamId}`)
        logOperation('shidian', '队伍号', {
          cardType: '十殿信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `队伍号：${teamId}`
        })
      } else {
        // 使用已保存的队伍号
        const existingTeamId = localStorage.getItem('shidian_teamId') || '0'
        displayTeamId.value = parseInt(existingTeamId)
        message.info(`使用已保存的队伍号：${existingTeamId}`)
        logOperation('shidian', '队伍号', {
          cardType: '十殿信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `使用已保存的队伍号：${existingTeamId}`
        })
      }
    } else {
      // 使用已保存的队伍号
      const existingTeamId = localStorage.getItem('shidian_teamId') || '0'
      displayTeamId.value = parseInt(existingTeamId)
      message.info(`使用已保存的队伍号：${existingTeamId}`)
      logOperation('shidian', '队伍号', {
        cardType: '十殿信息',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `使用已保存的队伍号：${existingTeamId}`
      })
    }
  } catch (error) {
    console.error('获取队伍号失败:', error)
    message.error(`获取队伍号失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '队伍号', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `获取队伍号失败: ${error.message || '未知错误'}`
    })
    displayTeamId.value = 0
  }
}

// 创建房间（从ShiDian.vue复制）
const createNightmareRoom = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  try {
    message.info('正在创建房间...')
    
    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    // 执行matchteam_create操作
    await tokenStore.sendGameMessage(token.id, 'matchteam_create', {
      teamCfgId: 1,
      setting: {
        name: '相符的队伍',
        notice: '',
        secret: 1,
        apply: 0,
        applyList: []
      }
    })
    
    message.success('房间创建成功')
    logOperation('shidian', '创建房间', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '房间创建成功'
    })
  } catch (error) {
    console.error('创建房间失败:', error)
    message.error(`创建房间失败: ${error.message || error}`)
    logOperation('shidian', '创建房间', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `创建房间失败: ${error.message || error}`
    })
  }
}

// 获取指定Token的枕头数量
const getPillowCountForToken = async (token) => {
  try {
    // 使用role_getroleinfo获取角色信息
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    
    if (roleInfo && roleInfo.role && roleInfo.role.items) {
      // 查找itemId为5054的物品（十殿枕头）
      const pillowItem = roleInfo.role.items['5054']
      
      if (pillowItem && pillowItem.quantity !== undefined) {
        return pillowItem.quantity
      }
    }
    return 0
  } catch (error) {
    console.error('获取枕头数量失败:', error)
    return 0
  }
}

// 更新Token备注信息
const updateTokenRemark = async (tokenId, newRemark) => {
  // 这里可以通过tokenStore或其他方式更新token的备注
  // 由于没有直接的API来更新备注，我们暂时记录在内存中
  // 在实际应用中，这可能需要通过其他方式实现
  console.log(`更新Token ${tokenId} 备注为: ${newRemark}`)
}

// 获取本地存储的枕头数量
const getLocalPillowCount = (tokenId) => {
  try {
    const tokenData = tokenStore.gameTokens.find(t => t.id === tokenId)
    if (tokenData && tokenData.gameData && tokenData.gameData.items) {
      const pillowItem = tokenData.gameData.items['5054']
      if (pillowItem && pillowItem.quantity !== undefined) {
        return pillowItem.quantity
      }
    }
    return 0
  } catch (error) {
    console.error('获取本地枕头数量失败:', error)
    return 0
  }
}

// 加入房间（从ShiDian.vue复制）
const joinNightmareRoom = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 确定使用哪个teamId：优先使用props.teamId（十殿页面输入的），如果为空则使用displayTeamId.value（从游戏获取的）
  const teamIdToUse = props.teamId || displayTeamId.value
  
  // 检查是否有有效的teamId
  if (!teamIdToUse) {
    message.warning('请先输入或获取队伍号')
    return
  }

  connectingTokens.value.add(token.id)
  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.info('正在连接游戏...')
      tokenStore.selectToken(token.id)
      let count = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        count++
      }
      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.error('WebSocket连接失败，请稍后重试')
        return
      }
      message.success('游戏连接成功')
    }

    // 第一步：切换阵1
    message.info('正在切换阵1...')
    try {
      await tokenStore.sendMessageWithPromise(
        token.id,
        'presetteam_saveteam',
        { teamId: 1 },
        10000
      )
      message.success('切换阵1成功')
    } catch (error) {
      console.error('切换阵1失败:', error)
      message.warning('切换阵1失败，继续执行加入房间操作')
    }
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 500))

    // 第二步：执行matchteam_join操作（加入房间）
    message.info(`正在加入房间，使用TeamID: ${teamIdToUse}...`)
    await tokenStore.sendGameMessage(token.id, 'matchteam_join', {
      teamId: teamIdToUse
    })
    message.success('成功加入房间')
    
    // 等待一下再执行准备操作
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 第三步：执行matchteam_memberprepare操作（准备十殿）
    message.info('正在准备十殿...')
    await tokenStore.sendGameMessage(token.id, 'matchteam_memberprepare', {
      teamId: teamIdToUse
    })
    message.success('十殿准备完成！')
    
    // 第四步：获取所有token的roleId
    message.info('正在获取所有token的roleId...')
    const gameTokens = toRaw(tokenStore.gameTokens)
    for (const t of gameTokens) {
      try {
        const roleInfo = await tokenStore.sendGetRoleInfo(t.id)
        if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
          tokenRoleIds.value[t.id] = roleInfo.role.roleId
          console.log(`Token ${t.name} (${t.id}) 的roleId: ${roleInfo.role.roleId}`)
        }
      } catch (error) {
        console.error(`获取Token ${t.name} (${t.id}) 的roleId失败:`, error)
      }
    }
    message.success('所有token的roleId获取完成！')
    message.success('🎉 成功加入十殿并准备完成！')
    logOperation('shidian', '加入房间', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `成功加入十殿并准备完成，使用TeamID: ${teamIdToUse}`
    })
  } catch (error) {
    console.error('加入十殿失败:', error)
    message.error(`加入十殿失败: ${error.message || error}`)
    logOperation('shidian', '加入房间', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `加入十殿失败: ${error.message || error}`
    })
  } finally {
    connectingTokens.value.delete(token.id)
  }
}

// 开始十殿战斗（从ShiDian.vue复制）
const startNightmareFight = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!displayTeamId.value) {
    message.warning('请先获取队伍号')
    return
  }

  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    message.info('正在开始十殿战斗...')
    
    // 执行matchteam_openteam操作
    await tokenStore.sendMatchteamOpenTeam(token.id, {
      teamId: displayTeamId.value,
      extParam: 0
    })
    
    message.success('十殿战斗开始成功')
    logOperation('shidian', '开始十殿', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '十殿战斗开始成功'
    })
  } catch (error) {
    console.error('开始十殿战斗失败:', error)
    message.error(`开始十殿战斗失败: ${error.message || error}`)
    logOperation('shidian', '开始十殿', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `开始十殿战斗失败: ${error.message || error}`
    })
  }
}

// 设置出战人员（从ShiDian.vue复制）
const setNightmareFighter = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!displayTeamId.value) {
    message.warning('请先获取队伍号')
    return
  }

  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    message.info('正在设置出战人员...')
    
    // 执行nightmare_setfighter操作
    await tokenStore.sendNightmareSetFighter(token.id, {
      roomId: displayTeamId.value,
      roleId: parseInt(token.id)
    })
    
    message.success('出战人员设置成功')
    logOperation('shidian', '出战人员', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '出战人员设置成功'
    })
  } catch (error) {
    console.error('设置出战人员失败:', error)
    message.error(`设置出战人员失败: ${error.message || error}`)
    logOperation('shidian', '出战人员', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `设置出战人员失败: ${error.message || error}`
    })
  }
}

// 踢出房间（从ShiDian.vue复制）
const kickFromRoom = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!displayTeamId.value) {
    message.warning('请先获取队伍号')
    return
  }

  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    message.info('正在踢出房间...')
    
    // 执行matchteam_kick操作
    await tokenStore.sendMatchteamKick(token.id, {
      teamId: displayTeamId.value,
      kickRoleId: parseInt(token.id)
    })
    
    message.success('踢出房间成功')
    logOperation('shidian', '踢出房间', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '踢出房间成功'
    })
  } catch (error) {
    console.error('踢出房间失败:', error)
    message.error(`踢出房间失败: ${error.message || error}`)
    logOperation('shidian', '踢出房间', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `踢出房间失败: ${error.message || error}`
    })
  }
}

// 转让房主（从ShiDian.vue复制）
const transferRoomOwner = async (token) => {
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  
  if (!token.id) {
    message.error('Token信息不完整')
    return
  }

  // 检查是否输入了teamId
  if (!displayTeamId.value) {
    message.warning('请先获取队伍号')
    return
  }

  try {
    // 检查WebSocket连接状态
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      message.warning('WebSocket未连接，请先连接Token')
      return
    }

    message.info('正在转让房主...')
    
    // 执行matchteam_openteam操作（打开队伍，允许转让房主）
    await tokenStore.sendMatchteamOpenTeam(token.id, {
      teamId: displayTeamId.value,
      extParam: 0
    })
    
    message.success('转让房主成功')
    logOperation('shidian', '转让房主', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '转让房主成功'
    })
  } catch (error) {
    console.error('转让房主失败:', error)
    message.error(`转让房主失败: ${error.message || error}`)
    logOperation('shidian', '转让房主', {
      cardType: '十殿信息',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `转让房主失败: ${error.message || error}`
    })
  }
}

// 处理资源导出范围输入
const handleResourceExportRangeInput = (value) => {
  resourceExportRange.value = value
}

// 解析执行范围（从BossTowerCard复制）
const parseExecutionRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null // 返回null表示执行全部
  }

  const trimmed = rangeStr.trim()
  const gameTokens = toRaw(tokenStore.gameTokens)
  const tokens = gameTokens.slice().sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  // 处理范围格式 "1-20"
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()))
    if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
      return tokens.slice(start - 1, end).map(t => t.id)
    }
  }
  
  // 处理逗号分隔格式 "1,2,3"
  if (trimmed.includes(',')) {
    const indices = trimmed.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0)
    return indices.map(idx => tokens[idx - 1]?.id).filter(Boolean)
  }
  
  // 单个数字
  const index = parseInt(trimmed)
  if (!isNaN(index) && index > 0 && tokens[index - 1]) {
    return [tokens[index - 1].id]
  }
  
  return null
}

// 导出资源
const exportResources = async () => {
  if (isExportingResources.value) {
    message.warning('导出正在进行中，请稍候...')
    return
  }

  isExportingResources.value = true
  try {
    // 解析执行范围
    const gameTokens = toRaw(tokenStore.gameTokens)
    const tokenIds = parseExecutionRange(resourceExportRange.value) || gameTokens.map(t => t.id)
    
    if (tokenIds.length === 0) {
      message.warning('没有可导出的Token')
      return
    }

    message.info(`开始导出资源，共${tokenIds.length}个Token...`)

    const results = []
    const sortedTokens = tokenStore.gameTokens.slice().sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i]
      const token = sortedTokens.find(t => t.id === tokenId)
      
      if (!token) {
        console.warn(`Token ${tokenId} 不存在，跳过`)
        continue
      }

      try {
        message.info(`正在处理Token ${i + 1}/${tokenIds.length}: ${token.name || token.id}`)

        // 连接token
        const connectionStatus = tokenStore.getWebSocketStatus(token.id)
        if (connectionStatus !== 'connected') {
          message.info(`正在连接Token: ${token.name || token.id}`)
          tokenStore.selectToken(token.id)
          
          // 等待连接，最多10秒
          let retryCount = 0
          while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && retryCount < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            retryCount++
          }
          
          if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
            message.warning(`Token ${token.name || token.id} 连接失败，跳过`)
            results.push({
          tokenId: token.id,
          tokenName: token.name || token.id,
          whiteJade: '-',
          colorJade: '-',
          spiritShell: '-',
          goldBrick: '-',
          chestScore: '-',
          recruitOrder: '-',
          roleId: '连接失败',
          success: false,
          error: '连接失败'
        })
            continue
          }
        }

        // 执行getroleinfo获取资源
        await new Promise(resolve => setTimeout(resolve, 500))
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        
        // 直接使用返回的roleInfo获取资源，不依赖token.gameData
        const items = roleInfo?.role?.items || null
        const whiteJade = formatValue(findItemCount(items, 1022))
        const colorJade = formatValue(findItemCount(items, 1023))
        const spiritShell = formatValue(findItemCount(items, 1033))
        // 增加金砖、招募令数量
        const goldBrick = formatValue(findItemCount(items, 1024)) // 假设金砖的物品ID是1024
        const recruitOrder = formatValue(findItemCount(items, 1044)) // 假设招募令的物品ID是1044
        // 宝箱总分数：这里假设从roleInfo的其他字段获取，或者设置为'-'如果无法获取
        const chestScore = roleInfo?.role?.chestScore || '-' // 假设宝箱总分数存储在role.chestScore中
        
        // 获取roleId
        const roleId = roleInfo?.role?.roleId || '未获取到'

        results.push({
          tokenId: token.id,
          tokenName: token.name || token.id,
          whiteJade: whiteJade,
          colorJade: colorJade,
          spiritShell: spiritShell,
          goldBrick: goldBrick,
          chestScore: chestScore,
          recruitOrder: recruitOrder,
          roleId: roleId,
          success: true
        })

        message.success(`Token ${token.name || token.id} 资源获取成功 (${i + 1}/${tokenIds.length})`)
        logOperation('shidian', '导出资源', {
          cardType: '十殿信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `资源获取成功: 白玉${whiteJade}, 彩玉${colorJade}, 灵贝${spiritShell}, 金砖${goldBrick}, 宝箱总分数${chestScore}, 招募令${recruitOrder}`
        })
      } catch (error) {
        console.error(`Token ${token.name || token.id} 处理失败:`, error)
        
        // 即使处理失败，也尝试获取roleId
        let roleId = '获取失败'
        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          roleId = roleInfo?.role?.roleId || '未获取到'
        } catch (roleError) {
          console.error(`Token ${token.name || token.id} 获取roleId失败:`, roleError)
        }
        
        results.push({
          tokenId: token.id,
          tokenName: token.name || token.id,
          whiteJade: '-',
          colorJade: '-',
          spiritShell: '-',
          goldBrick: '-',
          chestScore: '-',
          recruitOrder: '-',
          roleId: roleId,
          success: false,
          error: error.message || '未知错误'
        })
        message.warning(`Token ${token.name || token.id} 处理失败: ${error.message || '未知错误'}`)
        logOperation('shidian', '导出资源', {
          cardType: '十殿信息',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `资源获取失败: ${error.message || '未知错误'}`
        })
      }

      // 每个token之间间隔一下
      if (i < tokenIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // 生成导出文件
    const lines = []
    lines.push("=".repeat(80))
    lines.push("资源导出")
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`执行范围: ${resourceExportRange.value || '全部Token'}`)
    lines.push(`Token数量: ${tokenIds.length}`)
    lines.push("=".repeat(80))
    lines.push("")
    lines.push("序号\tToken名称\troleId\t白玉\t彩玉\t灵贝\t金砖\t宝箱总分数\t招募令\t状态")
    lines.push("-".repeat(80))

    results.forEach((result, index) => {
      const status = result.success ? '成功' : `失败: ${result.error || '未知错误'}`
      lines.push(`${index + 1}\t${result.tokenName}\t${result.roleId || '未获取到'}\t${result.whiteJade}\t${result.colorJade}\t${result.spiritShell}\t${result.goldBrick}\t${result.chestScore}\t${result.recruitOrder}\t${status}`)
    })

    lines.push("")
    lines.push("=".repeat(80))
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    lines.push(`总计: 成功 ${successCount} 个，失败 ${failCount} 个`)
    lines.push("=".repeat(80))

    // 导出文件
    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const fileName = `资源导出_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.csv`
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success(`资源导出完成！成功: ${successCount}个，失败: ${failCount}个`)
    logOperation('shidian', '导出资源', {
      cardType: '十殿信息',
      status: 'success',
      message: `资源导出完成！成功: ${successCount}个，失败: ${failCount}个`
    })
  } catch (error) {
    console.error('导出资源失败:', error)
    message.error(`导出资源失败: ${error.message || error}`)
    logOperation('shidian', '导出资源', {
      cardType: '十殿信息',
      status: 'error',
      message: `导出资源失败: ${error.message || error}`
    })
  } finally {
    isExportingResources.value = false
  }
}

// 获取十殿枕头数量
const getPillowCount = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.id) {
    message.error('Token信息不完整')
    return
  }

  try {
    message.info('正在获取十殿枕头数量...')
    
    // 使用role_getroleinfo获取角色信息
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    
    if (roleInfo && roleInfo.role && roleInfo.role.items) {
      // 查找itemId为5054的物品（十殿枕头）
      const pillowItem = roleInfo.role.items['5054']
      
      if (pillowItem && pillowItem.quantity !== undefined) {
        pillowCount.value = pillowItem.quantity
        message.success(`获取成功！十殿枕头数量: ${pillowItem.quantity}`)
        // 通知父组件更新十殿枕头数量
        emit('update-pillow-count', props.selectedTokenId, pillowItem.quantity)
      } else {
        pillowCount.value = 0
        message.warning('未找到十殿枕头信息')
        // 通知父组件更新十殿枕头数量
        emit('update-pillow-count', props.selectedTokenId, 0)
      }
    } else {
      pillowCount.value = 0
      message.warning('未获取到角色物品信息')
      // 通知父组件更新十殿枕头数量
      emit('update-pillow-count', props.selectedTokenId, 0)
    }
  } catch (error) {
    console.error('获取十殿枕头数量失败:', error)
    message.error(`获取十殿枕头数量失败: ${error.message || '未知错误'}`)
    pillowCount.value = 0
    // 通知父组件更新十殿枕头数量
    emit('update-pillow-count', props.selectedTokenId, 0)
  }
}

// 重置十殿标签，将空十殿标签改回正常标签
const resetDianLabels = () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }

  message.info('正在重置十殿标签...')
  
  // 触发事件通知父组件处理重置操作
  emit('reset-dian-labels', props.selectedTokenId)
  
  message.success('十殿标签重置完成！空十殿标签已改为正常标签')
}

// 执行选定的殿级
const executeSpecificDian = async () => {
  if (!selectedDianLevelToExecute.value) {
    message.warning('请选择要执行的殿级')
    return
  }

  const dianLevel = selectedDianLevelToExecute.value
  isExecutingSpecificDian.value = true

  try {
    message.info(`开始执行殿${dianLevel}战斗流程...`)
    
    // 根据不同殿级执行相应战斗流程
    switch (dianLevel) {
      case 1:
        await executeDian1Fight()
        break
      case 2:
        await executeDian2Fight()
        break
      case 3:
        await executeDian3Fight()
        break
      case 4:
        await executeDian4Fight()
        break
      case 5:
        await executeDian5Fight()
        break
      case 6:
        await executeDian6Fight()
        break
      case 7:
        await executeDian7Fight()
        break
      default:
        message.error(`不支持的殿级: ${dianLevel}`)
        return
    }

    message.success(`殿${dianLevel}战斗流程执行完成！`)
  } catch (error) {
    console.error(`执行殿${dianLevel}战斗流程失败:`, error)
    message.error(`执行殿${dianLevel}战斗流程失败: ${error.message || '未知错误'}`)
  } finally {
    isExecutingSpecificDian.value = false
  }
}

// 殿1战斗流程
const executeDian1Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：设置出战人员（殿7） -> 开始战斗（殿7）
  // 执行的命令：
  // 1. nightmare_setfighter - 设置出战人员（殿7）
  // 2. nightmare_fight - 开始战斗（殿7）

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 查找殿7Token
  const dian7Tokens = findTokensByRemark('殿7')
  if (dian7Tokens.length === 0) {
    throw new Error('没有找到殿7Token')
  }
  const dian7Token = dian7Tokens[0]

  // 设置出战人员（殿7）
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian7Token.id) })

  // 开始战斗（殿7）
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))
}

// 殿2战斗流程
const executeDian2Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：殿7出战 -> 殿2出战 -> 检查层数（如果是2层，则殿5出战）
  // 执行的命令：
  // 1. 殿7出战
  // 2. 殿2出战
  // 3. 检查层数
  // 4. 如果层数为2，殿5出战

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 殿7出战
  // 查找殿7Token
  const dian7Tokens = findTokensByRemark('殿7')
  if (dian7Tokens.length === 0) {
    throw new Error('没有找到殿7Token')
  }
  const dian7Token = dian7Tokens[0]
  
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))

  // 殿2出战
  // 查找殿2Token
  const dian2Tokens = findTokensByRemark('殿2')
  if (dian2Tokens.length === 0) {
    throw new Error('没有找到殿2Token')
  }
  const dian2Token = dian2Tokens[0]
  
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian2Token.id) })
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian2Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))

  // 检查层数
  const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
  let roleId = token.id
  if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
    roleId = roleInfo.role.roleId
  }
  const updatedNightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
  const currentLevel = updatedNightmareInfo?.nightMareData?.level || updatedNightmareInfo?.level

  if (currentLevel === 2) {
    // 殿5出战
    // 查找殿5Token
    const dian5Tokens = findTokensByRemark('殿5')
    if (dian5Tokens.length === 0) {
      throw new Error('没有找到殿5Token')
    }
    const dian5Token = dian5Tokens[0]
    
    await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian5Token.id) })
    await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian5Token.id) })
    
    // 等待22秒
    await new Promise(resolve => setTimeout(resolve, 22000))
  }
}

// 殿3战斗流程
const executeDian3Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：殿7出战
  // 执行的命令：
  // 1. role_getroleinfo - 获取角色信息
  // 2. nightmare_getroleinfo - 获取十殿信息（获取roomId）
  // 3. nightmare_setfighter - 设置出战人员（殿7）
  // 4. nightmare_fight - 开始战斗（殿7）

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 殿7出战
  // 查找殿7Token
  const dian7Tokens = findTokensByRemark('殿7')
  if (dian7Tokens.length === 0) {
    throw new Error('没有找到殿7Token')
  }
  const dian7Token = dian7Tokens[0]
  
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))
}

// 殿4战斗流程
const executeDian4Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：殿7出战
  // 执行的命令：
  // 1. 殿7出战

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 殿7出战
  // 查找殿7Token
  const dian7Tokens = findTokensByRemark('殿7')
  if (dian7Tokens.length === 0) {
    throw new Error('没有找到殿7Token')
  }
  const dian7Token = dian7Tokens[0]
  
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))
}

// 殿5战斗流程
const executeDian5Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：殿5出战 -> 检查层数（如果是5层，执行殿2出战） -> 再次检查层数（如果是5层，执行殿7出战）
  // 执行的命令：
  // 1. 殿5出战
  // 2. 检查层数
  // 3. 如果层数为5，执行殿2出战
  // 4. 再次检查层数
  // 5. 如果层数为5，执行殿7出战

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 殿5出战
  // 查找殿5Token
  const dian5Tokens = findTokensByRemark('殿5')
  if (dian5Tokens.length === 0) {
    throw new Error('没有找到殿5Token')
  }
  const dian5Token = dian5Tokens[0]
  
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian5Token.id) })
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian5Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))

  // 检查层数
  const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
  let roleId = token.id
  if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
    roleId = roleInfo.role.roleId
  }
  const updatedNightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
  const currentLevel = updatedNightmareInfo?.nightMareData?.level || updatedNightmareInfo?.level

  if (currentLevel === 5) {
    // 殿2出战
    // 查找殿2Token
    const dian2Tokens = findTokensByRemark('殿2')
    if (dian2Tokens.length === 0) {
      throw new Error('没有找到殿2Token')
    }
    const dian2Token = dian2Tokens[0]
    
    await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian2Token.id) })
    await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian2Token.id) })
    
    // 等待22秒
    await new Promise(resolve => setTimeout(resolve, 22000))

    // 再次检查层数
    const updatedNightmareInfo2 = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
    const currentLevel2 = updatedNightmareInfo2?.nightMareData?.level || updatedNightmareInfo2?.level

    if (currentLevel2 === 5) {
      // 殿7出战
      // 查找殿7Token
      const dian7Tokens = findTokensByRemark('殿7')
      if (dian7Tokens.length === 0) {
        throw new Error('没有找到殿7Token')
      }
      const dian7Token = dian7Tokens[0]
      
      await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian7Token.id) })
      await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian7Token.id) })
      
      // 等待22秒
      await new Promise(resolve => setTimeout(resolve, 22000))

      // 再次检查层数
      const updatedNightmareInfo3 = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
      const currentLevel3 = updatedNightmareInfo3?.nightMareData?.level || updatedNightmareInfo3?.level

      if (currentLevel3 === 5) {
        // 模拟点击解散十殿按钮
        message.info('当前层数仍为5，执行解散十殿...')
        await tokenStore.sendNightmareDismiss(token.id, { roomId })
      }
    }
  }
}

// 殿6战斗流程
const executeDian6Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：恢复殿2和殿7 -> 殿2出战 -> 殿7出战 -> 检查层数（如果是6层，则3个殿0依次出战）
  // 执行的命令：
  // 1. 恢复殿2和殿7（可能需要特定的实现）
  // 2. role_getroleinfo - 获取角色信息
  // 3. nightmare_getroleinfo - 获取十殿信息（获取roomId）
  // 4. nightmare_setfighter - 设置出战人员（殿2）
  // 5. nightmare_fight - 开始战斗（殿2）
  // 6. nightmare_setfighter - 设置出战人员（殿7）
  // 7. nightmare_fight - 开始战斗（殿7）
  // 8. nightmare_getroleinfo - 获取十殿信息（检查层数）
  // 9. 如果层数为6，则3个殿0依次出战

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 恢复殿2和殿7
  // 查找殿2和殿7的token
  const dian2Tokens = findTokensByRemark('殿2')
  const dian7Tokens = findTokensByRemark('殿7')

  if (dian2Tokens.length > 0) {
    const dian2Token = dian2Tokens[0]
    // 检查是否已记录该token的roleId
    if (tokenRoleIds.value[dian2Token.id]) {
      // 使用房主token执行恢复殿2命令
      await tokenStore.sendGameMessage(token.id, 'nightmare_restore', {
        roomId: displayTeamId.value,
        roleId: parseInt(tokenRoleIds.value[dian2Token.id])
      })
      console.log('恢复殿2成功，使用roleId:', tokenRoleIds.value[dian2Token.id])
    } else {
      console.warn('未找到殿2的roleId，跳过恢复')
    }
  }

  if (dian7Tokens.length > 0) {
    const dian7Token = dian7Tokens[0]
    // 检查是否已记录该token的roleId
    if (tokenRoleIds.value[dian7Token.id]) {
      // 使用房主token执行恢复殿7命令
      await tokenStore.sendGameMessage(token.id, 'nightmare_restore', {
        roomId: displayTeamId.value,
        roleId: parseInt(tokenRoleIds.value[dian7Token.id])
      })
      console.log('恢复殿7成功，使用roleId:', tokenRoleIds.value[dian7Token.id])
    } else {
      console.warn('未找到殿7的roleId，跳过恢复')
    }
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 殿2出战
  // 查找殿2Token
  const dian2TokensForFight = findTokensByRemark('殿2')
  if (dian2TokensForFight.length === 0) {
    throw new Error('没有找到殿2Token')
  }
  const dian2Token = dian2TokensForFight[0]
  
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian2Token.id) })
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian2Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))

  // 检查层数
  const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
  let roleId = token.id
  if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
    roleId = roleInfo.role.roleId
  }
  const updatedNightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
  const currentLevel = updatedNightmareInfo?.nightMareData?.level || updatedNightmareInfo?.level

  if (currentLevel === 6) {
    // 殿5出战
    // 查找殿5Token
    const dian5Tokens = findTokensByRemark('殿5')
    if (dian5Tokens.length === 0) {
      throw new Error('没有找到殿5Token')
    }
    const dian5Token = dian5Tokens[0]
    
    await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian5Token.id) })
    await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian5Token.id) })
    
    // 等待22秒
    await new Promise(resolve => setTimeout(resolve, 22000))

    // 再次检查层数
    const updatedNightmareInfo2 = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
    const currentLevel2 = updatedNightmareInfo2?.nightMareData?.level || updatedNightmareInfo2?.level

    if (currentLevel2 === 6) {
      // 模拟点击解散十殿按钮
      message.info('当前层数仍为6，执行解散十殿...')
      await tokenStore.sendNightmareDismiss(token.id, { roomId })
    }
  }
}

// 殿7战斗流程
const executeDian7Fight = async () => {
  if (!props.selectedTokenId) {
    throw new Error('请先选择Token')
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    throw new Error('找不到对应的Token')
  }

  // 流程：恢复殿7 -> 设置出战人员（殿7） -> 开始战斗（殿7）
  // 执行的命令：
  // 1. 恢复殿7（可能需要特定的实现）
  // 2. nightmare_setfighter - 设置出战人员（殿7）
  // 3. nightmare_fight - 开始战斗（殿7）

  // 检查WebSocket连接状态
  if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
    message.info(`正在为 ${token.name || token.id} 连接游戏...`)
    tokenStore.selectToken(token.id)
    let count = 0
    while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      count++
    }
    if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
      throw new Error('WebSocket连接失败，请稍后重试')
    }
    message.success(`${token.name || token.id} 游戏连接成功`)
  }

  // 恢复殿7
  // 查找殿7的token
  const dian7Tokens = findTokensByRemark('殿7')

  if (dian7Tokens.length > 0) {
    const dian7Token = dian7Tokens[0]
    // 检查是否已记录该token的roleId
    if (tokenRoleIds.value[dian7Token.id]) {
      // 使用房主token执行恢复殿7命令
      await tokenStore.sendGameMessage(token.id, 'nightmare_restore', {
        roomId: displayTeamId.value,
        roleId: parseInt(tokenRoleIds.value[dian7Token.id])
      })
      console.log('恢复殿7成功，使用roleId:', tokenRoleIds.value[dian7Token.id])
    } else {
      console.warn('未找到殿7的roleId，跳过恢复')
    }
  }

  // 使用本地存储的 roomId
  const roomId = displayRoomId.value

  if (!roomId) {
    throw new Error('未能获取到房间ID，请先点击"房间号"按钮获取')
  }

  // 查找殿7Token
  const dian7TokensForFight = findTokensByRemark('殿7')
  if (dian7TokensForFight.length === 0) {
    throw new Error('没有找到殿7Token')
  }
  const dian7Token = dian7TokensForFight[0]

  // 设置出战人员（殿7）
  await tokenStore.sendNightmareSetFighter(token.id, { roomId, roleId: parseInt(dian7Token.id) })

  // 开始战斗（殿7）
  await tokenStore.sendNightmareFight(token.id, { roomId, roleId: parseInt(dian7Token.id) })
  
  // 等待22秒
  await new Promise(resolve => setTimeout(resolve, 22000))

  // 检查层数
  const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
  let roleId = token.id
  if (roleInfo && roleInfo.role && roleInfo.role.roleId) {
    roleId = roleInfo.role.roleId
  }
  const updatedNightmareInfo = await tokenStore.sendNightmareGetRoleInfo(token.id, { roleId: parseInt(roleId) })
  const currentLevel = updatedNightmareInfo?.nightMareData?.level || updatedNightmareInfo?.level

  if (currentLevel === 7) {
    // 模拟点击解散十殿按钮
    message.info('当前层数为7，执行解散十殿...')
    await tokenStore.sendNightmareDismiss(token.id, { roomId })
  }
}

// 组件卸载前清理连接池
onBeforeUnmount(async () => {
  try {
    await connectionPool.destroy()
    console.log('[ShiDianInfoCard] 连接池已清理')
  } catch (error) {
    console.error('[ShiDianInfoCard] 清理连接池失败:', error)
  }
})

// 暴露方法供父组件调用
defineExpose({
  joinNightmareRoom,
  getPillowCount,
  resetDianLabels,
  executeSpecificDian,
  nightmareRestore,
  nightmareDismiss,
  executeFighter,
  executeKick,
  executeTransfer,
  executeRestore
})
</script>

<style scoped>
/* 组件样式 */
</style>