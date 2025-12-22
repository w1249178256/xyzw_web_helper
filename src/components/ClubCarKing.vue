<template>
  <div class="status-card club-car-king">
    <div class="card-header">
      <img class="status-icon" src="/icons/疯狂赛车.png" alt="疯狂赛车">
      <div class="status-info">
        <h3>疯狂赛车</h3>
        <p>车辆仓库与品阶</p>
      </div>
      <div class="status-badge" :class="{ active: carList.length > 0 }">
        <div class="status-dot" />
        <span>{{ carList.length > 0 ? `共 ${carList.length} 辆` : '暂无数据' }}</span>
      </div>
    </div>

    <div class="card-content">
      <div class="car-toolbar">
        <n-space size="small">
          <n-button type="primary" size="small" :loading="carLoading" @click="fetchCarInfo">{{ carLoading ? '加载中...' :
            '刷新数据' }}</n-button>
          <n-button size="small" secondary :disabled="carLoading || !isConnected" @click="smartSendCar">智能发车</n-button>
          <n-button size="small" secondary :disabled="carLoading || !isConnected" @click="claimAllCars">一键收车</n-button>
          <n-tag size="small" :type="hasFreeRefresh ? 'success' : 'default'">
            {{ hasFreeRefresh ? `有 ${freeCarsCount} 辆可免费刷新` : '无免费刷新' }}
          </n-tag>
          <n-tag size="small" type="info">剩余车票: {{ refreshTickets }}</n-tag>
        </n-space>
      </div>

      <div v-if="!isConnected" class="hint">请先选择 Token 并建立连接</div>
      <div v-else-if="carList.length === 0 && !carLoading" class="hint">暂无车辆数据</div>

      <div v-if="carList.length > 0" class="car-grid">
        <div v-for="c in carList" :key="c.key" class="car-card">
          <div class="car-header">
            <img class="car-brand-icon" :src="gradeIcon(c.color)" :alt="gradeLabel(c.color)" />
            <div class="car-badge" :class="'grade-' + (c.color || 0)">{{ gradeLabel(c.color) }}</div>
            <div class="car-name">{{ c.name || c.carName || ('车辆 #' + (c.id || c.key)) }}</div>
          </div>
          <div class="car-meta">
            <div class="kv"><span class="k">品阶</span><span class="v"><span class="grade-dot"
                  :class="'grade-' + (c.color || 0)"></span>{{ gradeLabel(c.color) }}</span></div>
            <div class="kv" v-if="c.level != null"><span class="k">等级</span><span class="v">{{ c.level }}</span></div>
            <div class="kv" v-if="c.star != null"><span class="k">星级</span><span class="v">{{ c.star }}</span></div>
            <div class="kv"><span class="k">状态</span><span class="v">{{ Number(c.sendAt || 0) === 0 ? '未发车' : '已发车'
            }}</span></div>
            <div class="kv"><span class="k">帮手</span><span class="v">{{ Number(c.color || 0) >= 5 ? '可携带' : '—'
            }}</span></div>
            <div class="kv" v-if="isBigPrize(c.rewards)"><span class="k">奖励</span><span class="v"
                style="color:#f59e0b">包含大奖</span></div>
          </div>

          <div class="car-actions">
            <n-button size="small" :type="Number(c.refreshCount ?? 0) === 0 ? 'success' : 'warning'"
              :disabled="carLoading || Number(c.sendAt || 0) !== 0" @click="refreshCar(c)">
              {{ Number(c.refreshCount ?? 0) === 0 ? '免费刷新品阶' : '刷新品阶(需车票)' }}
            </n-button>
            <n-button size="small" type="primary" :disabled="carLoading || actionDisabled(c)" @click="handleAction(c)">
              {{ actionLabel(c) }}
            </n-button>
            <n-button size="small" quaternary
              :disabled="carLoading || Number(c.color || 0) < 5 || Number(c.sendAt || 0) !== 0"
              @click="openHelperDialog(c)">
              护卫
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 护卫选择弹窗（放置于同一模板中） -->
  <n-modal v-model:show="helperDialogVisible" preset="card" title="选择护卫" style="width: 520px;">
    <div class="helper-body">
      <div class="helper-row">
        <span class="label">护卫成员</span>
        <n-select v-model:value="helperSelection" :options="helperOptions" placeholder="选择俱乐部成员"
          :loading="helperLoading" filterable style="width: 320px;" />
      </div>
      <div class="tips">说明：次数满 4 的成员不可再被选择。</div>
    </div>
    <template #footer>
      <n-space>
        <n-button @click="cancelHelper">取消</n-button>
        <n-button type="primary" @click="confirmHelper">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'

const tokenStore = useTokenStore()
const message = useMessage()

const carLoading = ref(false)
const carRaw = ref(null)
const carFetched = ref(false)
const refreshTickets = ref(0)

// 每日 20:00 后禁止发车：每分钟刷新一次
const nowTs = ref(Date.now())
let nowTimer = null
onMounted(() => {
  nowTimer = setInterval(() => { nowTs.value = Date.now() }, 60000)
})
onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})
const isAfter20 = computed(() => {
  const d = new Date(nowTs.value)
  return d.getHours() >= 20
})

// 活动开放时间：周一至周三可发车
const isActivityOpen = computed(() => {
  const d = new Date(nowTs.value)
  const wd = d.getDay() // 0=周日
  return wd >= 1 && wd <= 3
})

const isConnected = computed(() => {
  const t = tokenStore.selectedToken
  if (!t) return false
  return tokenStore.getWebSocketStatus(t.id) === 'connected'
})

const normalizeCars = (raw) => {
  const r = raw || {}
  const body = r.body || r
  const roleCar = body.roleCar || body.rolecar || {}

  // 优先从 roleCar.carDataMap 解析（id -> info）
  const carMap = roleCar.carDataMap || roleCar.cardatamap
  if (carMap && typeof carMap === 'object') {
    return Object.entries(carMap).map(([id, info], idx) => ({ key: idx, id, ...(info || {}) }))
  }

  // 兜底
  let arr = body.cars || body.list || body.data || body.carList || body.vehicles || []
  if (!Array.isArray(arr) && typeof arr === 'object' && arr !== null) arr = Object.values(arr)
  if (Array.isArray(body) && arr.length === 0) arr = body
  return (Array.isArray(arr) ? arr : []).map((it, idx) => ({ key: idx, ...it }))
}

const carList = computed(() => normalizeCars(carRaw.value))

// 免费刷新信息：每辆车初次刷新免费（refreshCount === 0 表示可免费）
const freeCarsCount = computed(() => (carList.value || []).filter(c => Number(c.refreshCount ?? 0) === 0).length)
const hasFreeRefresh = computed(() => freeCarsCount.value > 0)

const gradeLabel = (color) => {
  const map = { 1: '绿·普通', 2: '蓝·稀有', 3: '紫·史诗', 4: '橙·传说', 5: '红·神话', 6: '金·传奇' }
  return map[color] || '未知'
}

const gradeIcon = (color) => {
  const map = {
    1: '/icons/大众.svg',
    2: '/icons/特斯拉.svg',
    3: '/icons/奥迪.svg',
    4: '/icons/奔驰.svg',
    5: '/icons/保时捷.svg',
    6: '/icons/兰博基尼.svg'
  }
  const path = map[color] || '/icons/大众.svg'
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}

// —— 奖励与发车策略 ——
const isBigPrize = (rewards) => {
  const bigPrizes = [
    { type: 3, itemId: 3201, value: 10 },
    { type: 3, itemId: 1001, value: 10 },
    { type: 3, itemId: 1022, value: 2000 },
    { type: 2, itemId: 0, value: 2000 },
    { type: 3, itemId: 1023, value: 5 },
    { type: 3, itemId: 1022, value: 2500 },
    { type: 3, itemId: 1001, value: 12 }
  ]
  if (!Array.isArray(rewards)) return false
  return bigPrizes.some(p => rewards.find(r => r.type === p.type && r.itemId === p.itemId && Number(r.value || 0) >= p.value))
}

const countRacingRefreshTickets = (rewards) => {
  if (!Array.isArray(rewards)) return 0
  return rewards.reduce((acc, r) => acc + ((r.type === 3 && r.itemId === 35002) ? Number(r.value || 0) : 0), 0)
}

const shouldSendCar = (car, tickets) => {
  const color = Number(car?.color || 0)
  const rewards = Array.isArray(car?.rewards) ? car.rewards : []
  const racingTickets = countRacingRefreshTickets(rewards)
  if (tickets >= 6) {
    return color >= 5 || racingTickets >= 4 || isBigPrize(rewards)
  }
  return color >= 4 || racingTickets >= 2 || isBigPrize(rewards)
}

const fetchCarInfo = async () => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) {
    message.warning('请先选择 Token 并建立连接')
    return
  }
  carLoading.value = true
  try {
    const res = await tokenStore.sendMessageWithPromise(token.id, 'car_getrolecar', {}, 10000)
    // 同步获取刷新券数量
    try {
      const roleRes = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 10000)
      const qty = roleRes?.role?.items?.[35002]?.quantity
      refreshTickets.value = Number(qty || 0)
    } catch (_) { }
    carRaw.value = res?.body ?? res
    carFetched.value = true
    if (!normalizeCars(carRaw.value).length) {
      message.info('未识别到车辆字段，已启用智能解析。如仍为空请提供返回示例')
    } else {
      message.success('疯狂赛车数据已更新')
    }
  } catch (e) {
    message.error('获取车辆数据失败：' + (e.message || '未知错误'))
  } finally {
    carLoading.value = false
  }
}

// 初次挂载时，若已连接则尝试拉取
watch(isConnected, (ok) => { if (ok && !carFetched.value) fetchCarInfo() })

// 刷新品阶（单车）
const refreshCar = async (car) => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) {
    message.warning('请先选择 Token 并建立连接')
    return
  }
  if (!car?.id) {
    message.warning('未找到车辆ID')
    return
  }
  if (Number(car.sendAt || 0) !== 0) {
    message.warning('仅未发车的车辆可刷新品阶')
    return
  }
  try {
    if (!(Number(car.refreshCount ?? 0) === 0)) {
      message.info('将消耗车票进行刷新')
    }
    const resp = await tokenStore.sendMessageWithPromise(token.id, 'car_refresh', { carId: String(car.id) }, 10000)
    const data = resp?.car || resp?.body?.car || resp
    // 就地更新：颜色与刷新次数
    if (data && typeof data === 'object') {
      if (data.color != null) {
        car.color = Number(data.color)
      }
      if (data.refreshCount != null) {
        // 优先按车级别的免费刷新次数
        car.refreshCount = Number(data.refreshCount)
        // 若服务端用全局刷新次数，也尽量同步到元信息
        const root = carRaw.value?.body || carRaw.value || {}
        if (root.roleCar && (root.roleCar.refreshCount != null)) {
          root.roleCar.refreshCount = Number(data.refreshCount)
        }
      }
      // 弹出奖励与结果摘要（可按需扩展）
      const newGrade = gradeLabel(car.color)
      message.success(`刷新完成：${newGrade}`)
    } else {
      // 回退：无法解析则整体刷新
      await fetchCarInfo()
      message.success('品阶刷新完成')
    }
    // 刷新后更新车票数量
    try {
      const roleRes = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {}, 8000)
      refreshTickets.value = Number(roleRes?.role?.items?.[35002]?.quantity || 0)
    } catch (_) { }
  } catch (e) {
    message.error('刷新失败：' + (e.message || '未知错误'))
  }
}

// 发车（未发车时可用）
const sendCar = async (car) => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) {
    message.warning('请先选择 Token 并建立连接')
    return
  }
  if (Number(car.sendAt || 0) !== 0) {
    message.info('该车辆已发车')
    return
  }
  if (!isActivityOpen.value) {
    message.warning('非活动时间不可发车（仅周一至周三开放）')
    return
  }
  if (!car?.id) {
    message.warning('未找到车辆ID')
    return
  }
  if (Number(car.sendAt || 0) !== 0) {
    message.info('该车辆已发车')
    return
  }
  try {
    message.info('发车中...')
    const resp = await tokenStore.sendMessageWithPromise(token.id, 'car_send', {
      carId: String(car.id),
      helperId: Number(car.helperId || 0),
      text: '',
      isUpgrade: false
    }, 10000)
    // 解析响应，优先就地更新
    const body = resp?.body || resp
    const roleCar = body?.roleCar || body?.rolecar
    const map = roleCar?.carDataMap || roleCar?.cardatamap
    if (map && map[car.id]) {
      const updated = map[car.id]
      // 更新底层 carRaw 数据源，确保后续计算一致
      const root = carRaw.value?.body || carRaw.value || {}
      if (root.roleCar && root.roleCar.carDataMap && root.roleCar.carDataMap[car.id]) {
        root.roleCar.carDataMap[car.id] = { ...root.roleCar.carDataMap[car.id], ...updated }
      }
      // 直接更新展示对象关键字段
      if (updated.sendAt != null) car.sendAt = updated.sendAt
      if (updated.color != null) car.color = updated.color
      if (updated.refreshCount != null) car.refreshCount = updated.refreshCount
      message.success('已发车')
    } else {
      // 回退到全量刷新
      await fetchCarInfo()
      message.success('已发车')
    }
  } catch (e) {
    message.error('发车失败：' + (e.message || '未知错误'))
  }
}

// 计算是否可收车：已发车且超过4小时
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const canClaim = (car) => {
  const t = Number(car?.sendAt || 0)
  if (!t) return false
  const tsMs = t < 1e12 ? t * 1000 : t
  return nowTs.value - tsMs >= FOUR_HOURS_MS
}

// 收车
const claimCar = async (car) => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) return message.warning('请先选择 Token 并建立连接')
  if (!car?.id) return message.warning('未找到车辆ID')
  if (!canClaim(car)) return message.warning('未到可收车时间（需超过4小时）')
  try {
    message.info('收车中...')
    const resp = await tokenStore.sendMessageWithPromise(token.id, 'car_claim', { carId: String(car.id) }, 10000)
    // 成功后就地更新为未发车
    car.sendAt = 0
    // 同步底层 map（若存在）
    const root = carRaw.value?.body || carRaw.value || {}
    if (root.roleCar && root.roleCar.carDataMap && root.roleCar.carDataMap[car.id]) {
      root.roleCar.carDataMap[car.id] = { ...root.roleCar.carDataMap[car.id], sendAt: 0 }
    }
    message.success('收车完成')
  } catch (e) {
    message.error('收车失败：' + (e.message || '未知错误'))
  }
}

// 计算距可收车剩余时间（毫秒），负数代表已可收车
const msUntilClaim = (car) => {
  const t = Number(car?.sendAt || 0)
  if (!t) return 0
  const tsMs = t < 1e12 ? t * 1000 : t
  return (tsMs + FOUR_HOURS_MS) - nowTs.value
}

const formatRemaining = (ms) => {
  if (ms <= 0) return '0分'
  const totalSec = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分`
}

// 单按钮动作与状态
const actionLabel = (car) => {
  const sent = Number(car?.sendAt || 0) !== 0
  if (!sent) return '发车'
  if (canClaim(car)) return '收车'
  return `收车(剩余${formatRemaining(msUntilClaim(car))})`
}

const actionDisabled = (car) => {
  const sent = Number(car?.sendAt || 0) !== 0
  if (!sent) {
    return isAfter20.value || !isActivityOpen.value
  }
  return !canClaim(car)
}

const handleAction = async (car) => {
  const sent = Number(car?.sendAt || 0) !== 0
  if (!sent) {
    return sendCar(car)
  }
  if (canClaim(car)) {
    return claimCar(car)
  } else {
    const left = formatRemaining(msUntilClaim(car))
    message.info(`未到可收车时间，剩余 ${left}`)
  }
}

// 一键收车
const claimAllCars = async () => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) return message.warning('请先选择 Token 并建立连接')
  try {
    const claimables = (carList.value || []).filter(c => canClaim(c))
    for (const c of claimables) {
      try { await claimCar(c) } catch (_) { }
      await new Promise(r => setTimeout(r, 300))
    }
    await fetchCarInfo()
    message.success('一键收车完成')
  } catch (e) {
    message.error('一键收车失败：' + (e.message || '未知错误'))
  }
}

// 智能发车
const smartSendCar = async () => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) return message.warning('请先选择 Token 并建立连接')
  try {
    await fetchCarInfo()
    let tickets = Number(refreshTickets.value || 0)
    for (const car of carList.value) {
      if (Number(car.sendAt || 0) !== 0) continue
      if (shouldSendCar(car, tickets)) {
        await sendCar(car)
        await new Promise(r => setTimeout(r, 500))
        continue
      }
      let shouldRefresh = false
      const free = Number(car.refreshCount ?? 0) === 0
      if (tickets >= 6) shouldRefresh = true
      else if (free) shouldRefresh = true
      else {
        await sendCar(car)
        await new Promise(r => setTimeout(r, 500))
        continue
      }
      while (shouldRefresh) {
        await refreshCar(car)
        tickets = Number(refreshTickets.value || 0)
        if (shouldSendCar(car, tickets)) {
          await sendCar(car)
          await new Promise(r => setTimeout(r, 500))
          break
        }
        const freeNow = Number(car.refreshCount ?? 0) === 0
        if (tickets >= 6) shouldRefresh = true
        else if (freeNow) shouldRefresh = true
        else {
          await sendCar(car)
          await new Promise(r => setTimeout(r, 500))
          break
        }
      }
    }
    await fetchCarInfo()
    message.success('智能发车完成')
  } catch (e) {
    message.error('智能发车失败：' + (e.message || '未知错误'))
  }
}

// ===== 护卫选择 =====
const helperDialogVisible = ref(false)
const helperLoading = ref(false)
const helperOptions = ref([])
const helperSelection = ref(null)
const currentCarForHelper = ref(null)

const legionInfo = computed(() => tokenStore.gameData?.legionInfo || null)
const clubInfo = computed(() => legionInfo.value?.info || {})
const legionMembersMap = computed(() => clubInfo.value?.members || {})
const legionMembers = computed(() => Object.values(legionMembersMap.value || {}))

const openHelperDialog = async (car) => {
  const token = tokenStore.selectedToken
  if (!token || !isConnected.value) return message.warning('请先选择 Token 并建立连接')
  if (Number(car.color || 0) < 5) return message.warning('仅品阶≥5的车辆可设置护卫')
  if (Number(car.sendAt || 0) !== 0) return message.warning('已发车车辆不可设置护卫')

  currentCarForHelper.value = car
  helperDialogVisible.value = true
  helperLoading.value = true
  helperSelection.value = car.helperId ? String(car.helperId) : null

  try {
    // 拉取俱乐部成员护卫可用次数
    const resp = await tokenStore.sendMessageWithPromise(token.id, 'car_getmemberhelpingcnt', {}, 10000)
    const map = resp?.body?.memberHelpingCntMap || resp?.memberHelpingCntMap || {}

    // 生成候选列表（v<4 可选）
    const opts = legionMembers.value.map(m => {
      const mid = String(m.roleId)
      const cnt = Number(map[mid] ?? 0)
      return {
        label: `${m.name || m.nickname || mid}（已护卫 ${cnt}/4）`,
        value: mid,
        disabled: cnt >= 4
      }
    })
    helperOptions.value = opts
  } catch (e) {
    message.error('获取护卫数据失败：' + (e.message || '未知错误'))
    helperOptions.value = []
  } finally {
    helperLoading.value = false
  }
}

const confirmHelper = () => {
  if (currentCarForHelper.value) {
    currentCarForHelper.value.helperId = helperSelection.value ? String(helperSelection.value) : null
  }
  helperDialogVisible.value = false
}
const cancelHelper = () => {
  helperDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.club-car-king {
  /* 与 ClubInfo 卡片格式保持一致（应用到当前根元素上） */
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  min-height: 200px;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-md);
  }

  .status-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: var(--border-radius-medium);
  }

  .status-info {
    flex: 1;
  }

  .status-info h3 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  .status-info p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .status-badge.active {
    background: rgba(24, 160, 88, 0.12);
    color: var(--success-color);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .car-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-sm);
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .car-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--spacing-md);
  }

  .car-card {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-large);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .car-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .car-brand-icon {
    width: 24px;
    height: 24px;
    border-radius: var(--border-radius-medium);
    background: var(--bg-primary);
  }

  .car-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    color: #fff;
  }

  .car-name {
    font-weight: var(--font-weight-medium);
  }

  .car-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .kv {
    display: flex;
    justify-content: space-between;
    background: var(--bg-primary);
    border-radius: var(--border-radius-medium);
    padding: 6px 8px;
  }

  .k {
    color: var(--text-tertiary);
  }

  .v {
    color: var(--text-primary);
  }

  .grade-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
  }

  .car-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .car-actions>* {
    flex: 1;
    min-width: 80px;
  }

  :deep(.n-button) {
    border-radius: var(--border-radius-medium);
  }

  @media (max-width: 768px) {
    .club-car-king {
      padding: var(--spacing-md);
    }

    .card-header {
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .status-info {
      min-width: 120px;
    }

    .status-badge {
      margin-left: auto;
    }

    .car-toolbar {
      justify-content: center;
    }

    .car-grid {
      grid-template-columns: 1fr;
    }
  }

  .grade-1 {
    background: #22c55e;
  }

  .grade-2 {
    background: #3b82f6;
  }

  .grade-3 {
    background: #a855f7;
  }

  .grade-4 {
    background: #f59e0b;
  }

  .grade-5 {
    background: #ef4444;
  }

  .grade-6 {
    background: #eab308;
    color: #000;
  }
}
</style>
