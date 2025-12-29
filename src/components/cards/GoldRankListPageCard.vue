<template>
    <div>
        <div class="status-card club-warrank">
            <div class="card-header">
                <img src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"
                     alt="队伍图标"
                     class="status-icon">
                <div class="status-info">
                    <h3>黄金积分俱乐部总览</h3>
                </div>
            </div>
            <div class="inline-container">
                <n-radio-group v-model:value="selectedGroup" name="group-radiogroup" size="small" class="radio-group">
                    <n-radio-button value="gold1">1-100</n-radio-button>
                    <n-radio-button value="gold2">101-200</n-radio-button>
                    <n-radio-button value="gold3">201-300</n-radio-button>
                    <n-radio-button value="gold4">301-400</n-radio-button>
                    <n-radio-button value="gold5">401-500</n-radio-button>
                </n-radio-group>
                <n-button size="small" :disabled="loading1" @click="topranklistRefresh">
                    <template #icon>
                    <n-icon><Refresh /></n-icon>
                    </template>查询</n-button>
                <n-button type="primary" size="small" :disabled="!topranklist || loading1" @click="handleExport1">
                    <template #icon>
                        <n-icon><Copy /></n-icon>
                    </template>导出</n-button>

            </div>


            <div class="battle-records-content">
                <!-- 加载状态 -->
                <div v-if="loading1" class="loading-state">
                    <n-spin size="large">
                        <template #description>
                            正在加载俱乐部数据...
                        </template>
                    </n-spin>
                </div>

                <!-- 俱乐部数据列表 -->
                <div v-else-if="topranklist" class="records-list">
                <div v-for="(memberData, memberId) in currentPageData" :key="memberId" class="member-card">
                    <div class="member-header">
                        <div class="member-info">
                        <span class="stat-inline Sscore">排名 {{ memberData.rank }}</span>
                        </div>
                        <div class="member-stats-inline">
                            <span class="stat-inline win">区服 {{ memberData.ServerId }}</span>
                            <span class="stat-inline loss">俱乐部名 {{ memberData.Clubname }}</span>
                            <span class="stat-inline Resurrectio">黄金积分 {{ memberData.score }}</span>
                            <span class="stat-inline rednumber">总红淬 {{ memberData.redQuench }}红</span>
                            <span class="stat-inline siege">战力 {{ memberData.power }}</span>
                            <span class="stat-inline tipsgg">玩家名称 {{ memberData.name1 }}</span>
                            <span class="stat-inline Sscore">玩家ID {{ memberData.roleID1 }}</span>
                            <span class="stat-inline tipsgg">玩家名称 {{ memberData.name2 }}</span>
                            <span class="stat-inline Sscore">玩家ID {{ memberData.roleID2 }}</span>
                            <span class="stat-inline tipsgg">玩家名称 {{ memberData.name3 }}</span>
                            <span class="stat-inline Sscore">玩家ID {{ memberData.roleID3 }}</span>

                        </div>
                    </div>
                </div>
                <!-- 分页控件 -->
                    <div class="pagination-container" v-if="totalPages > 1">
                        <n-pagination
                            class="pagination-item"
                            v-model:page="currentPage"
                            :page-count="totalPages"
                            :page-size="pageSize"
                            show-quick-jumper
                            show-size-changer
                            :page-sizes="[10, 20, 50, 100]"
                            @update:page-size="handlePageSizeChange"
                        />
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, NDatePicker, NPagination } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText
} from '@vicons/ionicons5'
import {
  getLastSaturday,
  formatTimestamp,
  formatTimestamp1,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard
} from '@/utils/clubBattleUtils'
import { gettoday, formatWarrankRecordsForExport, allianceincludes} from '@/utils/goldWarrankUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading1 = ref(false)
const topranklist = ref(null)
const expandedMembers = ref(new Set())
const roleIdinput = ref('')
const queryDate = ref('')
const selectedGroup = ref('')
const teamArray = ref(null)
let player_date = { name: '' , power: '' }

// 分页状态
    const currentPage = ref(1)
    const pageSize = ref(20) // 每页20条，共5页
    
    // 计算总页数
    const totalPages = computed(() => {
        if (!topranklist.value) return 0
        return Math.ceil(Object.keys(topranklist.value).length / pageSize.value)
    })
    
    // 获取当前页的数据
    const currentPageData = computed(() => {
        if (!topranklist.value) return {}
        
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        const entries = Object.entries(topranklist.value)
        
        return Object.fromEntries(entries.slice(startIndex, endIndex))
    })
// 格式化战力
const formatPower = (power) => {
  if (!power) return '0'
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + '亿'
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + '万'
  }
  return power.toString()
}

const formatScore = (score) => {
    return score.toFixed(0).toString()
}

const formatServerId = (ServerId) => {
    return (ServerId-27).toFixed(0).toString()
}

const ProcessingstartRank = (selectgroup) => {
  switch(selectgroup) {
    case 'gold1':
      return 1
    case 'gold2':
      return 101
    case 'gold3':
      return 201
    case 'gold4':
      return 301
    case 'gold5':
      return 401
    default:
      return 1
  }
}

const ProcessingendRank = (selectgroup) => {
  switch(selectgroup) {
    case 'gold1':
      return 100
    case 'gold2':
      return 200
    case 'gold3':
      return 300
    case 'gold4':
      return 400
    case 'gold5':
      return 500
    default:
      return 100
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 查询
   const fetchtopranklist = async () => {
        if (!tokenStore.selectedToken) {
            message.warning('请先选择游戏角色')
            return
        }

        const tokenId = tokenStore.selectedToken.id

        // 检查WebSocket连接
        const wsStatus = tokenStore.getWebSocketStatus(tokenId)
        if (wsStatus !== 'connected') {
            message.error('WebSocket未连接，无法查询战绩')
            return
        }

        loading1.value = true
        queryDate.value = gettoday()
 

       try {
           const result = await tokenStore.sendMessageWithPromise(tokenId, 'legionwar_getgoldmonthwarrank', 
           { 
           startRank: ProcessingstartRank(selectedGroup.value), 
           endRank: ProcessingendRank(selectedGroup.value) 
           }, 5000)

           if (!result.legionList) {
               topranklist.value = null;
               message.warning('未查询到俱乐部数据');
               return;
           }
           const teamData = {};
           
           for (const [memberId, memberData] of Object.entries(result.legionList)) {
               const detail = await tokenStore.sendMessageWithPromise(
                   tokenId,
                   'legion_getinfobyid',
                   { legionId: memberData?.id },
                   5000
               );
               const roleIdCounts = [];
               const nameCounts = [];
               const redQuenchCounts = [];
               for (const [ClubId, ClubData] of Object.entries(detail?.legionData?.members)) {
                   if (ClubData.roleId !== undefined) {
                       roleIdCounts.push(ClubData.roleId);
                       nameCounts.push(ClubData.name);
                       if (ClubData.custom?.red_quench_cnt !== undefined) {
                                redQuenchCounts.push(ClubData.custom.red_quench_cnt + "红");
                        }
                   }
               }
               teamData[memberId] = {
                   rank: memberData.rank || 0,
                   id: memberData.id || 0,
                   ServerId: memberData.serverId || 0,
                   redQuench: detail.legionData.quenchNum || 0,
                   Clubname: memberData.name || '',
                   power: formatPower(memberData.power) || 0,
                   score: memberData.score || 0,
                   roleID1: roleIdCounts[0] || 0,
                   roleID2: roleIdCounts[1] || 0,
                   roleID3: roleIdCounts[2] || 0,
                   name1: nameCounts[0] || '',
                   name2: nameCounts[1] || '',
                   name3: nameCounts[2] || '',
                   announcement: detail.legionData.announcement || '',
                   redno: redQuenchCounts || 0,
                   redno1: redQuenchCounts[0] || '0红',
                   redno2: redQuenchCounts[1] || '0红',
                   redno3: redQuenchCounts[2] || '0红'
               };
               
           }

           topranklist.value = teamData;
           teamArray.value = Object.values(teamData);
           message.success('俱乐部数据加载成功');
           return teamData;

       } catch (error) {
           console.error('查询失败:', error);
           message.error(`查询失败: ${error.message}`);
           topranklist.value = null;
       } finally {
           loading1.value = false;
       }



   }

     
     
// 处理分页大小改变
const handlePageSizeChange = (size) => {
        pageSize.value = size
        currentPage.value = 1 // 重置到第一页
    }  
// 刷新战绩
const topranklistRefresh = () => {
  fetchtopranklist()
}

// 导出战绩
const handleExport1 = async () => {
  if (!topranklist.value) {
    message.warning('没有可导出的数据')
    return
  }
  

  try {
    const exportText = formatWarrankRecordsForExport(
      teamArray.value,
      queryDate.value	
    )
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchtopranklist
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    topranklistRefresh()
  }
})
</script>

<style scoped lang="scss">
.club-warrank {
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
.member-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
  transition: all var(--transition-fast);

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  & + & {
    margin-top: var(--spacing-sm);
  }
}
.member-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  max-width: 120px;
  flex-shrink: 0;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}
.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.member-stats-inline {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  flex: 1;
}

@media (max-width: 768px) {
  .member-stats-inline {
      display: flex;
      gap: var(--spacing-xs);
      align-items: flex-start;
      flex: 1;
      flex-direction: column;
      .tipsgg {
      background: rgba(194, 166, 248, 0.1);
      color: #AE86F9;
      white-space:normal
      }
  }
  }

.stat-inline {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
  white-space: nowrap;
  min-width: 52px;
  text-align: center;

  &.win {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &.loss {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  &.siege {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }

  &.Resurrectio {
    background: rgba(250, 76, 44, 0.1);
    color: #F96F19;
  }
  &.rednumber {
    background: rgba(249, 203, 35, 0.1);
    color: #F99D19;
  }
  &.alliance {
    background: rgba(166, 211, 248, 0.1);
    color: #7AC1F9;
  }
  &.tipsgg {
    background: rgba(194, 166, 248, 0.1);
    color: #AE86F9;
  }
  &.Sscore {
    background: rgba(244, 162, 216, 0.1);
    color: #FA79CE;
  }

}

.battle-details {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.battles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.battle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  border-left: 3px solid transparent;

  &.battle-win {
    border-left-color: #10b981;
  }

  &.battle-loss {
    border-left-color: #ef4444;
  }
}

.battle-participants {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex: 1;
}
.participant {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.participant-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.battle-vs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.battle-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.no-battles {
  padding: var(--spacing-xl);
  text-align: center;
}
  .meta {
    .name { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
    .sub { color: var(--text-secondary); font-size: var(--font-size-sm); }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }

  .item {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-medium);
    padding: var(--spacing-sm);
    .label { color: var(--text-secondary); font-size: var(--font-size-xs); margin-bottom: 2px; }
    .value { font-weight: var(--font-weight-medium); }
  }

  .announcement .label, .leader .label { color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 4px; }
  .announcement .text { white-space: pre-wrap; }
  .leader .leader-info { display: flex; align-items: center; gap: var(--spacing-sm); }

  .members-list { display: flex; flex-direction: column; gap: 8px; }
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 8px; border-radius: 8px; background: var(--bg-tertiary); }
  .member-row .left { display: flex; align-items: center; gap: 8px; }
  .member-row .right { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); }
  .member-row .name { font-weight: var(--font-weight-medium); }
  .member-row .power { font-feature-settings: 'tnum' 1; font-variant-numeric: tabular-nums; }
  .hint { margin-top: 8px; color: var(--text-tertiary); font-size: var(--font-size-xs); }

  .empty-club { text-align: center; }
  .empty-club .actions { margin-top: var(--spacing-sm); }
}

/* 卡片基础样式，保持与 GameStatus 一致 */
.status-card {
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
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.card-content {
  .time-display {
    font-size: 1rem; /* text-2xl */
    font-weight: 600; /* font-bold */
    color: var(--text-primary);
    text-align: center;
    margin-bottom: var(--spacing-md);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    letter-spacing: 0.1em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    background: var(--bg-tertiary);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease-in-out;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    }
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
  h3 { margin: 0; font-size: var(--font-size-lg); }
  p { margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm); }
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

  .pagination-item{
    flex-wrap: wrap;
  }
  @media (max-width:768px){
    .radio-group{
      white-space: normal;
    }
  }
</style>