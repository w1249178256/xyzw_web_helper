<template>
  <MyCard class="club-info" :statusClass="{ active: !!club }">
    <template #icon>
      <img src="/icons/1733492491706152.png" alt="俱乐部图标">
    </template>
    <template #title>
      <h3>俱乐部信息</h3>
      <p>军团/俱乐部概览与成员</p>
    </template>
    <template #badge>
      <span>{{ club ? '已加入' : '暂无俱乐部' }}</span>
    </template>
    <template #default>
      <div v-if="!club" class="empty-club">
        <n-empty description="暂无俱乐部" />
        <div class="actions">
          <n-button size="small" @click="refreshClub">刷新</n-button>
        </div>
      </div>
      <div v-else>
        <div class="toolbar">
          <n-space size="small">
            <n-button size="small" @click="refreshClub">刷新</n-button>
          </n-space>
        </div>

        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane name="overview" tab="概览" display-directive="show:lazy">
            <div class="overview">
              <div class="club-header">
                <n-avatar :size="48" :src="club.logo || '/icons/xiaoyugan.png'" />
                <div class="meta">
                  <div class="name">{{ club.name }}</div>
                  <div class="sub">ID {{ club.id }} · Lv.{{ club.level }} · 服务器 {{ club.serverId - 27 }}</div>
                </div>
              </div>
              <div class="overview-actions">
                <n-space size="small">
                  <n-button size="small" :disabled="legionSignedIn" type="primary" @click="signInLegion">
                    {{ legionSignedIn ? '已签到' : '俱乐部签到' }}
                  </n-button>
                </n-space>
              </div>
              <div class="grid">
                <div class="item">
                  <div class="label">战力</div>
                  <div class="value">{{ formatNumber(clubOverview.power) }}</div>
                </div>
                <div class="item">
                  <div class="label">成员数</div>
                  <div class="value">{{ memberCount }}</div>
                </div>
                <div class="item">
                  <div class="label">红粹</div>
                  <div class="value">{{ clubOverview.redQuench }}</div>
                </div>
                <div class="item">
                  <div class="label">Boss血量</div>
                  <div class="value">{{ clubOverview.currentHP }}</div>
                </div>


              </div>
              <div v-if="club.announcement" class="announcement">
                <div class="label">公告</div>
                <div class="text">{{ club.announcement }}</div>
              </div>
              <div class="leader" v-if="leader">
                <div class="label">会长</div>
                <div class="leader-info">
                  <n-avatar :size="32" :src="leader.headImg || '/icons/xiaoyugan.png'" />
                  <span class="leader-name">{{ leader.name }}</span>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="members" tab="成员" display-directive="show:lazy">
            <div class="members">
              <div class="members-list">
                <div v-for="m in topMembers" :key="m.roleId" class="member-row">
                  <div class="left">
                    <n-avatar :size="28" :src="m.headImg || '/icons/xiaoyugan.png'" />
                    <span class="name">{{ m.name }}</span>
                  </div>
                  <div class="right">
                    <span class="power">{{ formatNumber(m.power || m.custom?.s_power || 0) }}</span>
                    <span class="red-quench">{{ redQuenchlabel(m.custom?.red_quench_cnt || 0) }}</span>
                    <span class="tag">{{ jobLabel(m.job) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="records" tab="盐场战绩" display-directive="show:lazy">
            <ClubBattleRecords inline />
          </n-tab-pane>

          <n-tab-pane name="history" tab="俱乐部历史战绩" display-directive="show:lazy">
            <ClubHistoryRecords inline />
          </n-tab-pane>


        </n-tabs>
      </div>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import ClubBattleRecords from './ClubBattleRecords.vue'
import ClubHistoryRecords from './ClubHistoryRecords.vue'

const tokenStore = useTokenStore()
const message = useMessage()

const info = computed(() => tokenStore.gameData?.legionInfo || null)
const club = computed(() => info.value?.info || null)

const membersObj = computed(() => club.value?.members || {})
const members = computed(() => Object.values(membersObj.value || {}))
const memberCount = computed(() => members.value.length)

const leader = computed(() => {
  const lid = club.value?.leaderId
  if (!lid) return null
  return members.value.find(m => Number(m.roleId) === Number(lid)) || null
})

const topMembers = computed(() => {
  return [...members.value]
    .sort((a, b) => (Number(b.power || b.custom?.s_power || 0) - Number(a.power || a.custom?.s_power || 0)))
    .slice(0, 30)
})

const activeTab = ref('overview')

// 今日是否已进行俱乐部签到
const legionSignedIn = computed(() => {
  const ts = Number(tokenStore.gameData?.roleInfo?.role?.statisticsTime?.['legion:sign:in'] || 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySec = Math.floor(today.getTime() / 1000)
  return ts > todaySec
})

const signInLegion = () => {
  const token = tokenStore.selectedToken
  if (!token || legionSignedIn.value) return
  tokenStore.sendMessage(token.id, 'legion_signin')
  tokenStore.sendMessage(token.id, 'role_getroleinfo')
  message.info('俱乐部签到')
}


// 兼容不同服务端字段：从 info.info 和顶层 info 以及 statistics 中聚合
const clubOverview = computed(() => {
  const i = info.value || {}
  const base = i.info || {}
  const boss = base.currentBoss || {}
  const stats = i.statistics || i.stat || {}

  const power = Number(
    base.power ?? i.power ?? base.s_power ?? i.s_power ?? 0
  )
  const dan = base.dan ?? i.dan ?? base.rank ?? i.rank ?? '-'
  const redQuench = Number(
    base.redQuenchCnt ?? i.redQuenchCnt ?? stats['red:quench'] ?? stats['red_quench'] ?? 0
  )
  const lastWarRank = (
    stats['last:war:rank'] ?? stats['lastWarRank'] ?? stats['legion:last:war:rank'] ?? '-'
  )
  const noApply = Boolean(base.noApply ?? i.noApply)

  const currentHP = formatNumber(boss.currentHP || 0)

  return { power, dan: dan ?? '-', redQuench, lastWarRank, noApply, currentHP }
})

const refreshClub = () => {
  const token = tokenStore.selectedToken
  if (!token) return
  tokenStore.sendMessage(token.id, 'legion_getinfo')
}

const jobLabel = (job) => {
  if (job === 1) return '会长'
  if (job === 2) return '副会长'
  return '成员'
}

const redQuenchlabel = (redQuenchl) => {
  return redQuenchl + '红'
}

const formatNumber = (num) => {
  const n = Number(num || 0)
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '兆';
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万'
  return String(n)
}
</script>

<style scoped lang="scss">
.club-info {
  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-sm);
  }

  .overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .overview-actions {
    display: flex;
    justify-content: flex-start;
  }

  .club-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .meta {
    .name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }

    .sub {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }

  @media (max-width: 768px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
    }

    .member-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .member-row .right {
      width: 100%;
      justify-content: space-between;
      font-size: 12px;
    }
  }

  .item {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-medium);
    padding: var(--spacing-sm);

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-bottom: 2px;
    }

    .value {
      font-weight: var(--font-weight-medium);
    }
  }

  .announcement .label,
  .leader .label {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: 4px;
  }

  .announcement .text {
    white-space: pre-wrap;
  }

  .leader .leader-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .member-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    border-radius: 8px;
    background: var(--bg-tertiary);
  }

  .member-row .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-row .right {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
  }

  .member-row .name {
    font-weight: var(--font-weight-medium);
  }

  .member-row .power {
    font-feature-settings: 'tnum' 1;
    font-variant-numeric: tabular-nums;
  }

  .member-row .red-quench {
    font-feature-settings: 'tnum' 1;
    font-variant-numeric: tabular-nums;
  }

  .hint {
    margin-top: 8px;
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);
  }

  .empty-club {
    text-align: center;
  }

  .empty-club .actions {
    margin-top: var(--spacing-sm);
  }
}


.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  margin-right: var(--spacing-md);
}

.status-info {
  flex: 1;

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);

  &.active {
    background: rgba(24, 160, 88, 0.12);
    color: var(--success-color);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
</style>
