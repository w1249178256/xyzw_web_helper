<template>
    <div>
        <div class="status-card club-warrank">
            <div class="card-header">
                <img src="/icons/1733492491706152.png"
                     alt="俱乐部图标"
                     class="status-icon">
                <div class="status-info">
                    <h3>盐场匹配信息详情</h3>
                    <p>俱乐部盐场匹配详情</p>
                </div>
            </div>
            <div class="inline-container">
            <a-date-picker 
            v-model:value="inputDate1" 
            @change="fetchBattleRecordsByDate" 
            valueFormat="YYYY/MM/DD" 
            :disabled-date="disabledDate" />
                <n-button size="small" :disabled="loading1" @click="handleRefresh1">
                    <template #icon>
                    <n-icon><Refresh /></n-icon>
                    </template>查询</n-button>
                <n-button type="primary" size="small" :disabled="!battleRecords1 || loading1" @click="handleExport1">
                    <template #icon>
                        <n-icon><Copy /></n-icon>
                    </template>导出</n-button>
            </div>


            <div class="battle-records-content">
                <!-- 加载状态 -->
                <div v-if="loading1" class="loading-state">
                    <n-spin size="large">
                        <template #description>
                            正在加载盐场匹配数据...
                        </template>
                    </n-spin>
                </div>

                <!-- 匹配列表 -->
                <div v-else-if="battleRecords1 && battleRecords1.legionRankList" ref="exportDom" class="records-list">
                    <div class="records-info">
                        <n-tag type="info">查询日期: {{ formatTimestamp1(inputDate1) }}</n-tag>
                    </div>

                    <div v-for="member in battleRecords1.legionRankList" :key="member.id" class="member-card">
                        <div class="member-header">
                            <div class="member-info">
                                <img v-if="member.logo" :src="member.logo" :alt="member.name" class="member-avatar" @error="handleImageError">
                                <div v-else class="member-avatar-placeholder">{{ member.name?.charAt(0) || '?' }}</div>
                                <span class="member-name">{{ member.name }}</span>
                            </div>
                            <div class="member-stats-inline">
                                <span class="stat-inline win">区服 {{ member.serverId || 0 }}</span>
                                <span class="stat-inline siege">战力 {{ formatPower(member.power) || 0 }}</span>
                                <span class="stat-inline Resurrectio">总红粹 {{ member.redQuench || 0 }}</span>
                                <span class="stat-inline rednumber">车头1 {{ member.redno1 || 0 }}/{{ member.hb1 }}四圣</span>
                                <span class="stat-inline rednumber">车头2 {{ member.redno2 || 0 }}/{{ member.hb2 }}四圣</span>
                                <span class="stat-inline rednumber">车头3 {{ member.redno3 || 0 }}/{{ member.hb3 }}四圣</span>
                                <!-- <span class="stat-inline Sscore">积分 {{ formatScore(member.sRScore) || 0 }}</span> -->
                                <span class="stat-inline alliance">所属联盟: {{ allianceincludes(member.announcement) || '' }}</span>
                                <span class="stat-inline tipsgg">公告: {{ member.announcement || '' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, NDatePicker } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from "html2canvas"
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
import { gettoday, formatWarrankRecordsForExport, allianceincludes} from '@/utils/clubWarrankUtils'

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
const battleRecords1 = ref(null)
const expandedMembers = ref(new Set())
const queryDate = ref('')
const exportDom = ref(null)
const inputDate1 = ref(getLastSaturday())

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

const formatScore = (Score) => {
  return Score.toFixed(0).toString()
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}


const disabledDate = current => {
    return (current.getDay() != 6 && current.getDay() != 0) || current > Date.now()
}

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = val => {
    if (undefined != val) {
        inputDate1.value = val
    } else {
        inputDate1.value = getLastSaturday()
    }
    fetchBattleRecords1()
}

// 查询战绩
   const fetchBattleRecords1 = async () => {
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
        queryDate.value = formatTimestamp1(inputDate1.value)


         if (gettoday() == queryDate.value && new Date().getHours()<20) {
            const getbattlefield = await tokenStore.sendMessageWithPromise(tokenId, 'legion_getbattlefield', {}, 10000)
            if (!getbattlefield.info) {
                battleRecords1.value = null;
                message.warning('未查询到盐场匹配数据');
                return;
            }
            try {
                const result = await tokenStore.sendMessageWithPromise(
                    tokenId,
                    'legion_getopponent',
                    {
                        phase: getbattlefield.info.phase,
                        battlefieldId: getbattlefield.info.battlefieldId
                    },
                    10000
                )

                if (!result?.opponentList) {
                    battleRecords1.value = null;
                    message.warning('未查询到盐场匹配数据');
                    return;
                }
                const detailPromises = result.opponentList.map(async (club) => {
                    try {
                        const detail = await tokenStore.sendMessageWithPromise(
                            tokenId,
                            'legion_getinfobyid',
                            { legionId: club.id },
                            5000
                        );
                        const redQuenchCounts = [];
                        const HolyBeastNum = [];
                        for (const [memberId, memberData] of Object.entries(detail?.legionData?.members)) {
                            if (memberData.custom?.red_quench_cnt !== undefined) {
                                redQuenchCounts.push(memberData.custom.red_quench_cnt + "红");
                            }
                        }
                        const tempRoleInfo = await tokenStore.sendMessageWithPromise(tokenId, 'rank_getroleinfo',
                          {
                              bottleType: 0,
                              includeBottleTeam: false,
                              isSearch: false,
                              roleId: memberId
                          }, 5000)
                          let holyBeast = 0;
                          for (const [heroId, heroData] of Object.entries(tempRoleInfo?.roleInfo?.heroes)) {
                            if(heroData.hB?.active !== undefined){
                              holyBeast++;
                            }
                          }
                          HolyBeastNum.push(holyBeast)


                        return {
                            ...club,
                            redQuench: detail?.legionData?.quenchNum || 0,
                            power: detail?.legionData?.power || 0,
                            announcement: detail?.legionData?.announcement || 0,
                            redno: redQuenchCounts || 0,
                            redno1: redQuenchCounts[0] || '0红',
                            redno2: redQuenchCounts[1] || '0红',
                            redno3: redQuenchCounts[2] || '0红',
                            hb1:HolyBeastNum[0]||0,
                            hb2:HolyBeastNum[1]||0,
                            hb3:HolyBeastNum[2]||0
                        };
                    } catch (error) {
                        console.error(`查询俱乐部${club.id}详情失败:`, error);
                        return {
                            ...club,
                            redQuench: 0
                        };
                    }
                });
                const processedClubs = await Promise.all(detailPromises);
                battleRecords1.value = {
                    ...result,
                    legionRankList: processedClubs
                };
                message.success('盐场匹配数据加载成功');
            } catch (error) {
                console.error('查询失败:', error);
                message.error(`查询失败: ${error.message}`);
                battleRecords1.value = null;
            } finally {
                loading1.value = false;
            }
        }
    
         else {
        try {
            const result = await tokenStore.sendMessageWithPromise(
                tokenId,
                'legion_getwarrank',
                { date: queryDate.value },
                10000
            )
            if (!result?.legionRankList) {
                battleRecords1.value = null;
                message.warning('未查询到盐场匹配数据');
                return;
            }
            const detailPromises = result.legionRankList.map(async (club) => {
                try {
                    const detail = await tokenStore.sendMessageWithPromise(
                        tokenId,
                        'legion_getinfobyid',
                        { legionId: club.id },
                        5000
                    );
                    const redQuenchCounts = [];
                    const HolyBeastNum = [];
                    for (const [memberId, memberData] of Object.entries(detail?.legionData?.members)) {
                        if (memberData.custom?.red_quench_cnt !== undefined) {
                            redQuenchCounts.push(memberData.custom.red_quench_cnt + "红");
                        }
                        
                        const tempRoleInfo = await tokenStore.sendMessageWithPromise(tokenId, 'rank_getroleinfo',
                          {
                              bottleType: 0,
                              includeBottleTeam: false,
                              isSearch: false,
                              roleId: memberId
                          }, 5000)
                          let holyBeast = 0;
                          for (const [heroId, heroData] of Object.entries(tempRoleInfo?.roleInfo?.heroes)) {
                            if(heroData.hB?.active !== undefined){
                              holyBeast++;
                            }
                          }
                          HolyBeastNum.push(holyBeast)
                    }
                    return {
                        ...club,
                        redQuench: detail?.legionData?.quenchNum || 0,
                        power: detail?.legionData?.power || 0,
                        announcement: detail?.legionData?.announcement || 0,
                        redno: redQuenchCounts || 0,
                        redno1: redQuenchCounts[0] || 0,
                        redno2: redQuenchCounts[1] || 0,
                        redno3: redQuenchCounts[2] || 0,
                        hb1:HolyBeastNum[0]||0,
                        hb2:HolyBeastNum[1]||0,
                        hb3:HolyBeastNum[2]||0
                    };
                } catch (error) {
                    console.error(`查询俱乐部${club.id}详情失败:`, error);
                    return {
                        ...club,
                        redQuench: 0
                    };
                }
            });
            const processedClubs = await Promise.all(detailPromises);
            battleRecords1.value = {
                ...result,
                legionRankList: processedClubs
            };
            message.success('盐场匹配数据加载成功');
        } catch (error) {
            console.error('查询失败:', error);
            message.error(`查询失败: ${error.message}`);
            battleRecords1.value = null;
        } finally {
            loading1.value = false;
        }
    }

    }
// 刷新战绩
const handleRefresh1 = () => {
  fetchBattleRecords1()
}

// 导出战绩
const handleExport1 = async () => {
  if (!battleRecords1.value || !battleRecords1.value.legionRankList) {
    message.warning('没有可导出的数据')
    return
  }

  try {
    //导出图片
    exportToImage() 
    //导出excel,俩种方式自选一种吧
    // const exportText = formatWarrankRecordsForExport(
    //   battleRecords1.value.legionRankList,
    //   queryDate.value
    // )
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}


const exportToImage = async () => {
    // 校验：确保DOM已正确绑定
    if (!exportDom.value) {
        alert("未找到要导出的DOM元素")
        return
    }

    try {
        // 5. 用html2canvas渲染DOM为Canvas
        const canvas = await html2canvas(exportDom.value, {
            scale: 2, // 放大2倍，解决图片模糊问题
            useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
            backgroundColor: "#ffffff", // 避免透明背景（默认透明）
            logging: false, // 关闭控制台日志
        })

        // 6. Canvas转图片链接（支持PNG/JPG）
        const imgUrl = canvas.toDataURL("image/png") 
        // 若要JPG，改为'image/jpeg'

        // 7. 创建下载链接，触发浏览器下载
        const link = document.createElement("a")
        link.href = imgUrl
        link.download = queryDate.value.replace("/", "年").replace("/", "月") + "日盐场匹配信息.png"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (err) {
        console.error("DOM转图片失败：", err)
        alert("导出图片失败，请重试")
    }
}

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords1
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    fetchBattleRecords1()
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
.inline-container {
  display: flex;
  align-items: center;
  gap: 8px;
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
.details-button {
  flex-shrink: 0;
  margin-left: auto;
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
    background: rgba(0, 204, 221, 0.1);
    color: #00BFFF;
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
</style>