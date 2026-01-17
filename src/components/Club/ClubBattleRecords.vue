<template>
  <div>
    <!-- Inline 模式：卡片渲染 -->
    <div v-if="inline" class="inline-wrapper">
      <div class="inline-header">
        <div class="inline-title">俱乐部盐场战绩</div>
        <div class="header-actions">
          <a-date-picker v-model:value="queryDate" @change="fetchBattleRecordsByDate" valueFormat="YYYY/MM/DD" :disabled-date="disabledDate"/>
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
        </div>
        <div class="header-actions">
          <n-checkbox-group v-model:value="exportmethod" name="group-exportmethod" size="small">
          <n-checkbox value="1">表格导出</n-checkbox>
          <n-checkbox value="2">图片导出</n-checkbox>
          </n-checkbox-group>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleExport">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </div>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" ref="exportDom" class="records-list">
          <!-- 头部对战信息 -->
          <div class="battle-header">
            <h2>{{ queryDate }}  {{ club.name || '俱乐部' }}盐场战绩</h2>
          </div>
          
          <!-- 总体数据统计 -->
          <div class="overall-stats">
            <div class="stats-side own">
              <div class="stats-title">俱乐部总体数据</div>
              <div class="stats-grid">
                <div class="stat-item stat-kills">
                  <div class="stat-label">总击杀</div>
                  <div class="stat-value">{{ totalKills }}</div>
                </div>
                <div class="stat-item stat-revives">
                  <div class="stat-label">总复活</div>
                  <div class="stat-value">{{ totalRevives }}</div>
                </div>
                <div class="stat-item stat-kd">
                  <div class="stat-label">总K/D</div>
                  <div class="stat-value">{{ totalKD }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 各种榜单 -->
          <div class="battle-rankings">
            <!-- 击杀榜 -->
            <div class="ranking-card">
              <div class="ranking-title">击杀榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">Top3</div>
                  <div v-for="(player, index) in killRank" :key="index" class="ranking-item">
                    <div class="rank-number">{{ index + 1 }}</div>
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-value">{{ player.winCnt || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- K/D榜 -->
            <div class="ranking-card">
              <div class="ranking-title">K/D榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">Top3</div>
                  <div v-for="(player, index) in kdRank" :key="index" class="ranking-item">
                    <div class="rank-number">{{ index + 1 }}</div>
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-value">{{ player.kd || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 复活榜 -->
            <div class="ranking-card">
              <div class="ranking-title">复活榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">Top3</div>
                  <div v-for="(player, index) in reviveRank" :key="index" class="ranking-item">
                    <div class="rank-number">{{ index + 1 }}</div>
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-value">{{ player.reviveCnt || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 战神榜 -->
          <div class="god-rankings">
            <div class="god-ranking own">
              <div class="god-ranking-title">俱乐部战神榜</div>
              <div class="god-ranking-content">
                <div class="god-ranking-header">
                  <div class="god-rank-number">排名</div>
                  <div class="header-avatar"></div>
                  <div class="header-player">玩家</div>
                  <div class="header-stat">击杀</div>
                  <div class="header-stat">死亡</div>
                  <div class="header-stat">攻城</div>
                  <div class="header-stat">复活</div>
                  <div class="header-stat">K/D</div>
                </div>
                <div v-for="(player, index) in battleRecords.roleDetailsList" :key="player.roleId" class="god-ranking-item">
                  <div class="god-rank-number">{{ index + 1 }}</div>
                  <div class="player-avatar-cell">
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                  </div>
                  <span class="header-player">{{ player.name }}</span>
                  <span class="player-stat">{{ player.winCnt || 0 }}</span>
                  <span class="player-stat">{{ player.loseCnt || 0 }}</span>
                  <span class="player-stat">{{ player.buildingCnt || 0 }}</span>
                  <span class="player-stat">{{ Math.max(player.loseCnt - 6, 0) || 0 }}</span>
                  <span class="player-stat">{{ parseFloat((player.winCnt && player.loseCnt ? player.winCnt/player.loseCnt : 0.00)).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </div>

    <!-- Modal 模式 -->
    <n-modal v-else v-model:show="showModal" preset="card" title="俱乐部盐场战绩" style="width: 90%; max-width: 800px"
      @after-leave="handleClose">
      <template #header-extra>
        <div class="header-actions">
          <a-date-picker v-model:value="queryDate" @change="fetchBattleRecordsByDate" valueFormat="YYYY/MM/DD" :disabled-date="disabledDate"/>
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleExport">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            导出
          </n-button>
          <n-checkbox-group v-model:value="exportmethod" name="group-exportmethod" size="small">
          <n-checkbox value="1">表格导出</n-checkbox>
          <n-checkbox value="2">图片导出</n-checkbox>
          </n-checkbox-group>
        </div>
      </template>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" ref="exportDom" class="records-list">
          <!-- 总体数据统计 -->
          <div class="overall-stats">
            <div class="stats-side own">
              <div class="stats-title">俱乐部总体数据</div>
              <div class="stats-grid">
                <div class="stat-item stat-kills">
                  <div class="stat-label">总击杀</div>
                  <div class="stat-value">{{ totalKills }}</div>
                </div>
                <div class="stat-item stat-revives">
                  <div class="stat-label">总复活</div>
                  <div class="stat-value">{{ totalRevives }}</div>
                </div>
                <div class="stat-item stat-kd">
                  <div class="stat-label">总K/D</div>
                  <div class="stat-value">{{ totalKD }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 各种榜单 -->
          <div class="battle-rankings">
            <!-- 击杀榜 -->
            <div class="ranking-card">
              <div class="ranking-title">击杀榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">Top3</div>
                  <div v-for="(player, index) in killRank" :key="index" class="ranking-item">
                    <div class="rank-number">{{ index + 1 }}</div>
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-value">{{ player.winCnt || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- K/D榜 -->
            <div class="ranking-card">
              <div class="ranking-title">K/D榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">Top3</div>
                  <div v-for="(player, index) in kdRank" :key="index" class="ranking-item">
                    <div class="rank-number">{{ index + 1 }}</div>
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-value">{{ player.kd || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 复活榜 -->
            <div class="ranking-card">
              <div class="ranking-title">复活榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">Top3</div>
                  <div v-for="(player, index) in reviveRank" :key="index" class="ranking-item">
                    <div class="rank-number">{{ index + 1 }}</div>
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                    <span class="player-name">{{ player.name }}</span>
                    <span class="player-value">{{ player.reviveCnt || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 战神榜 -->
          <div class="god-rankings">
            <div class="god-ranking own">
              <div class="god-ranking-title">俱乐部战神榜</div>
              <div class="god-ranking-content">
                <div class="god-ranking-header">
                  <div class="god-rank-number">排名</div>
                  <div class="header-avatar"></div>
                  <div class="header-player">玩家</div>
                  <div class="header-stat">击杀</div>
                  <div class="header-stat">死亡</div>
                  <div class="header-stat">攻城</div>
                  <div class="header-stat">复活</div>
                  <div class="header-stat">K/D</div>
                </div>
                <div v-for="(player, index) in battleRecords.roleDetailsList" :key="player.roleId" class="god-ranking-item">
                  <div class="god-rank-number">{{ index + 1 }}</div>
                  <div class="player-avatar-cell">
                    <img v-if="player.headImg" :src="player.headImg" :alt="player.name" class="player-avatar" @error="handleImageError">
                    <div v-else class="player-avatar-placeholder">{{ player.name?.charAt(0) || '?' }}</div>
                  </div>
                  <span class="player-name">{{ player.name }}</span>
                  <span class="player-stat">{{ player.winCnt || 0 }}</span>
                  <span class="player-stat">{{ player.loseCnt || 0 }}</span>
                  <span class="player-stat">{{ player.buildingCnt || 0 }}</span>
                  <span class="player-stat">{{ Math.max(player.loseCnt - 6, 0) || 0 }}</span>               
                  <span class="player-stat">{{ parseFloat((player.winCnt && player.loseCnt ? player.winCnt/player.loseCnt : 0.00)).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, NCheckboxGroup, NCheckbox } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from 'html2canvas';
import {
  Refresh,
  Copy,
  DocumentText
} from '@vicons/ionicons5'
import {
  getLastSaturday,
  formatBattleRecordsForExport,
  copyToClipboard
} from '@/utils/clubBattleUtils'

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

const exportmethod = ref(['2']);
const exportDom = ref(null);
const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()
const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);
const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading = ref(false)
const battleRecords = ref(null)
const expandedMembers = ref(new Set())
const queryDate = ref('')

const legionMatch = ref({
  isRegistered: false
})

// 计算属性：总击杀
const totalKills = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  return battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.winCnt || 0), 0)
})

// 计算属性：总复活
const totalRevives = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  return battleRecords.value.roleDetailsList.reduce((sum, member) => sum + Math.max((member.loseCnt || 0) - 6, 0), 0)
})

// 计算属性：总K/D
const totalKD = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  const totalKills = battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.winCnt || 0), 0)
  const totalLosses = battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.loseCnt || 0), 0)
  if (totalLosses === 0) return 0
  return (totalKills / totalLosses).toFixed(2)
})

// 计算属性：击杀榜 Top3
const killRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
    .sort((a, b) => (b.winCnt || 0) - (a.winCnt || 0))
    .slice(0, 3)
})

// 计算属性：K/D榜 Top3
const kdRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
    .map(member => ({
      ...member,
      kd: parseFloat((member.winCnt && member.loseCnt ? member.winCnt/member.loseCnt : 0.00)).toFixed(2)
    }))
    .sort((a, b) => b.kd - a.kd)
    .slice(0, 3)
})

// 计算属性：复活榜 Top3
const reviveRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
    .map(member => ({
      ...member,
      reviveCnt: Math.max((member.loseCnt || 0) - 6, 0)
    }))
    .sort((a, b) => b.reviveCnt - a.reviveCnt)
    .slice(0, 3)
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



// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const disabledDate = current => {
  return (current.getDay() != 6 && current.getDay() != 0) || current > Date.now()
}

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = (val)=>{
  if(undefined != val){
    queryDate.value = val
  }else{
    queryDate.value = getLastSaturday();
  }
  fetchBattleRecords();
} 

// 查询战绩
  const fetchBattleRecords = async () => {
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

    loading.value = true

    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        'legionwar_getdetails',
        { date: queryDate.value },
        10000
      )

      if (result && result.roleDetailsList) {
        // 按击杀数从高到低排序
        const sortedRoleDetailsList = [...result.roleDetailsList].sort((a, b) => {
          return (b.winCnt || 0) - (a.winCnt || 0)
        })
        battleRecords.value = {
          ...result,
          roleDetailsList: sortedRoleDetailsList
        }
        message.success('战绩加载成功，已按击杀数从高到低排序')
      } else {
        battleRecords.value = null
        message.warning('未查询到战绩数据')
      }
    } catch (error) {
      console.error('查询战绩失败:', error)
      message.error(`查询失败: ${error.message}`)
      battleRecords.value = null
    } finally {
      loading.value = false
    }
  }

// 刷新战绩
const handleRefresh = () => {
  fetchBattleRecords()
}

// 导出战绩
const handleExport = async () => {
  if (!battleRecords.value || !battleRecords.value.roleDetailsList) {
    message.warning('没有可导出的数据')
    return
  }

  try {
    if (exportmethod.value.includes('1')) {
      const exportText = formatBattleRecordsForExport(battleRecords.value.roleDetailsList, queryDate.value)
    }
    if (exportmethod.value.includes('2')) {
      exportToImage()
    }
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

const exportToImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    alert('未找到要导出的DOM元素');
    return;
  }

  try {
    // 临时移除战神榜内容区域的最大高度限制，确保所有内容都可见
    const godRankingContents = exportDom.value.querySelectorAll('.god-ranking-content');
    const originalStyles = [];
    
    godRankingContents.forEach(content => {
      originalStyles.push({
        element: content,
        maxHeight: content.style.maxHeight,
        overflow: content.style.overflow
      });
      content.style.maxHeight = 'none';
      content.style.overflow = 'visible';
    });

    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: '#ffffff', // 避免透明背景（默认透明）
      logging: false // 关闭控制台日志
    });

    // 恢复战神榜内容区域的原始样式
    originalStyles.forEach(({ element, maxHeight, overflow }) => {
      element.style.maxHeight = maxHeight;
      element.style.overflow = overflow;
    });

    // 6. Canvas转图片链接（支持PNG/JPG）
    const imgUrl = canvas.toDataURL('image/png'); // 若要JPG，改为'image/jpeg'

    // 7. 创建下载链接，触发浏览器下载
    const link = document.createElement('a');
    link.href = imgUrl;
    console.log()
    link.download = queryDate.value.replace("/",'年').replace("/",'月')+'日盐场战报.png'; // 下载文件名
    document.body.appendChild(link);
    link.click(); // 触发点击下载
    document.body.removeChild(link); // 下载后清理DOM
  } catch (err) {
    console.error('DOM转图片失败：', err);
    alert('导出图片失败，请重试');
  }
};

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    queryDate.value = getLastSaturday()
    fetchBattleRecords()
  }
})
</script>

<style scoped lang="scss">
.inline-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--border-light);
  padding: var(--spacing-md);
}

.inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.inline-title {
  font-weight: var(--font-weight-semibold);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.battle-records-content {
  min-height: 200px;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 总体数据统计 */
.battle-header {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.battle-header h2 {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.overall-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stats-side {
  min-width: 400px;
}

.stats-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.stat-value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

/* 统计项颜色区分 */
.stat-kills {
  border-left: 4px solid var(--error-color);
}

.stat-kills .stat-value {
  color: var(--error-color);
}

.stat-revives {
  border-left: 4px solid var(--warning-color);
}

.stat-revives .stat-value {
  color: var(--warning-color);
}

.stat-kd {
  border-left: 4px solid var(--success-color);
}

.stat-kd .stat-value {
  color: var(--success-color);
}

/* 各种榜单 */
.battle-rankings {
  margin-bottom: var(--spacing-md);
}

.ranking-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ranking-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.ranking-content {
  display: flex;
  justify-content: center;
}

.ranking-side {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 300px;
}

.ranking-subtitle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.ranking-item:nth-of-type(2) .rank-number {
  background: #FFD700;
  color: #000;
}

.ranking-item:nth-of-type(3) .rank-number {
  background: #C0C0C0;
  color: #000;
}

.ranking-item:nth-of-type(4) .rank-number {
  background: #CD7F32;
  color: #000;
}

.player-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-avatar-placeholder {
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

.player-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

/* 战神榜 */
.god-rankings {
  display: flex;
  justify-content: center;
}

.god-ranking {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 600px;
}

.god-ranking-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.god-ranking-content {
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

.god-ranking-content::-webkit-scrollbar {
  width: 6px;
}

.god-ranking-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.header-avatar {
  width: 32px;
  flex-shrink: 0;
}

.player-avatar-cell {
  width: 32px;
  flex-shrink: 0;
}

.header-player {
  width: 140px;
  padding-left: var(--spacing-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.header-id {
  flex: 0 0 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-stat {
  width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.god-ranking-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.god-rank-number {
  width: 32px;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  background: #696969;
  color: #fff;
}

.god-ranking-header > .god-rank-number {
  background: transparent !important;
  color: var(--text-secondary) !important;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.god-ranking-item:nth-of-type(2) .god-rank-number {
  background: #FFD700;
  color: #000;
}

.god-ranking-item:nth-of-type(3) .god-rank-number {
  background: #C0C0C0;
  color: #000;
}

.god-ranking-item:nth-of-type(4) .god-rank-number {
  background: #CD7F32;
  color: #000;
}

.player-id {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  flex: 0 0 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-stat {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.god-ranking-content::-webkit-scrollbar-track {
  background: var(--bg-primary);
  border-radius: 3px;
}

.god-ranking-content::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.god-ranking-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .inline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .ranking-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .god-ranking-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .player-stat {
    min-width: auto;
    text-align: left;
  }
  
  .stats-side,
  .ranking-side,
  .god-ranking {
    min-width: auto;
    width: 100%;
  }
}
</style>
