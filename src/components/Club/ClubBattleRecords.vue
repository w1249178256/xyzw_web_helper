<template>
  <div class="records-container">
    <!-- 头部信息区 -->
      <div class="header-section">
        <div class="header-left">
          <img
            src="/icons/moonPalace.png"
            alt="俱乐部图标"
            class="header-icon"
          />
          <div class="header-title">
            <h2>俱乐部盐场战绩</h2>
            <p>查看俱乐部成员的详细战绩数据</p>
          </div>
        </div>

        <!-- 数据统计区 -->
        <div class="stats-section" v-if="battleRecords && battleRecords.roleDetailsList">
          <div class="stat-item">
            <span class="stat-label">查询日期:</span>
            <n-tag type="info">{{ queryDate }}</n-tag>
          </div>
          <div class="stat-item">
            <span class="stat-label">总人数:</span>
            <n-tag type="success">{{ battleRecords.roleDetailsList.length }}</n-tag>
          </div>
        </div>
      </div>

      <!-- 功能操作区 -->
      <div class="function-section">
        <div class="function-left">
          <div class="export-options">
            <n-radio-group v-model:value="currentStyle" size="small">
              <n-radio-button value="style1">样式一</n-radio-button>
              <n-radio-button value="style2">样式二</n-radio-button>
            </n-radio-group>
            <n-checkbox-group v-model:value="exportmethod" name="group-exportmethod" size="small">
              <n-checkbox value="1">表格导出</n-checkbox>
              <n-checkbox value="2">图片导出</n-checkbox>
            </n-checkbox-group>
          </div>
        </div>

        <div class="function-right">
          <a-date-picker 
            v-model:value="queryDate" 
            :defaultValue="queryDate"
            @change="fetchBattleRecordsByDate" 
            valueFormat="YYYY/MM/DD" 
            format="YYYY/MM/DD"
            :disabled-date="disabledDate"
          />
          <n-button 
            size="small" 
            :disabled="loading" 
            @click="handleRefresh"
            class="action-btn refresh-btn"
          >
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button 
            type="primary" 
            size="small" 
            :disabled="!battleRecords || loading" 
            @click="handleExport"
            class="action-btn export-btn"
          >
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
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" class="records-wrapper">
         <!-- 样式一 -->
          <div v-if="currentStyle === 'style1'" ref="exportDom" class="records-list style-1">
             <!-- 头部信息 -->
             <div class="style1-header">
                <h2>{{ queryDate }} {{ club.name || '俱乐部' }}盐场周报</h2>
             </div>
             
             <div class="style1-content">
                <!-- 左侧表格 -->
                <div class="style1-table-container">
                  <table class="style1-table">
                    <thead>
                      <tr>
                        <th class="col-rank">排名</th>
                        <th class="col-name">成员</th>
                        <th class="col-kill">击杀</th>
                        <th class="col-death">死亡</th>
                        <th class="col-occupy">攻城</th>
                        <th class="col-revive">复活丹</th>
                        <th class="col-kd">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(player, index) in battleRecords.roleDetailsList" :key="player.roleId">
                         <td class="col-rank">
                            <div v-if="index < 3" class="rank-medal">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
                            <span v-else>{{ index + 1 }}</span>
                         </td>
                         <td class="col-name">
                            <div class="player-info">
                               <img v-if="player.headImg" :src="player.headImg" class="player-avatar-small" @error="handleImageError" />
                               <div v-else class="player-avatar-placeholder-small">{{ player.name?.charAt(0) || '?' }}</div>
                               <span>{{ player.name }}</span>
                            </div>
                         </td>
                         <td class="col-kill" :style="{ backgroundColor: getKillColor(player.winCnt) }">{{ player.winCnt || 0 }}</td>
                         <td class="col-death" :style="{ backgroundColor: getDeathColor(player.loseCnt) }">{{ player.loseCnt || 0 }}</td>
                         <td class="col-occupy" :style="{ backgroundColor: getOccupyColor(player.buildingCnt) }">{{ player.buildingCnt || 0 }}</td>
                         <td class="col-revive" :style="{ backgroundColor: getReviveColor(Math.max((player.loseCnt || 0) - 6, 0)) }">{{ Math.max((player.loseCnt || 0) - 6, 0) }}</td>
                         <td class="col-kd">{{ parseFloat((player.winCnt && player.loseCnt ? player.winCnt/player.loseCnt : 0.00)).toFixed(2) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 右侧统计 -->
                <div class="style1-summary">
                   <!-- 总体统计 -->
                   <div class="summary-card">
                      <div class="summary-title">总体统计</div>
                      <div class="summary-item"><span>总人数:</span> <span>{{ battleRecords.roleDetailsList.length }}</span></div>
                      <div class="summary-item"><span>总击杀:</span> <span>{{ totalKills }}</span></div>
                      <div class="summary-item"><span>总死亡:</span> <span>{{ battleRecords.roleDetailsList.reduce((sum, m) => sum + (m.loseCnt || 0), 0) }}</span></div>
                      <div class="summary-item"><span>总复活丹:</span> <span>{{ totalRevives }}</span></div>
                      <div class="summary-item"><span>总 K/D:</span> <span>{{ totalKD }}</span></div>
                   </div>

                   <!-- 击杀前3 -->
                   <div class="summary-card purple-header">
                      <div class="summary-title">击杀前3</div>
                      <div v-for="(player, index) in killRank" :key="'kill-'+index" class="top3-item">
                         <div class="top3-rank">
                            <div class="rank-medal-small">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
                         </div>
                         <div class="top3-info">
                            <img v-if="player.headImg" :src="player.headImg" class="player-avatar-xs" @error="handleImageError" />
                            <div v-else class="player-avatar-placeholder-xs">{{ player.name?.charAt(0) || '?' }}</div>
                            <span class="top3-name">{{ player.name }}</span>
                         </div>
                         <div class="top3-value">{{ player.winCnt }}</div>
                      </div>
                   </div>

                   <!-- 攻城前3 -->
                   <div class="summary-card purple-header">
                      <div class="summary-title">攻城前3</div>
                      <div v-for="(player, index) in occupyRank" :key="'occupy-'+index" class="top3-item">
                         <div class="top3-rank">
                            <div class="rank-medal-small">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
                         </div>
                         <div class="top3-info">
                            <img v-if="player.headImg" :src="player.headImg" class="player-avatar-xs" @error="handleImageError" />
                            <div v-else class="player-avatar-placeholder-xs">{{ player.name?.charAt(0) || '?' }}</div>
                            <span class="top3-name">{{ player.name }}</span>
                         </div>
                         <div class="top3-value">{{ player.buildingCnt }}</div>
                      </div>
                   </div>

                   <!-- KD前3 -->
                   <div class="summary-card purple-header">
                      <div class="summary-title">KD 前3</div>
                      <div v-for="(player, index) in kdRank" :key="'kd-'+index" class="top3-item">
                         <div class="top3-rank">
                            <div class="rank-medal-small">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
                         </div>
                         <div class="top3-info">
                            <img v-if="player.headImg" :src="player.headImg" class="player-avatar-xs" @error="handleImageError" />
                            <div v-else class="player-avatar-placeholder-xs">{{ player.name?.charAt(0) || '?' }}</div>
                            <span class="top3-name">{{ player.name }}</span>
                         </div>
                         <div class="top3-value">{{ player.kd }}</div>
                      </div>
                   </div>

                   <!-- 复活丹前3 -->
                   <div class="summary-card purple-header">
                      <div class="summary-title">复活丹前3</div>
                      <div v-for="(player, index) in reviveRank" :key="'revive-'+index" class="top3-item">
                         <div class="top3-rank">
                            <div class="rank-medal-small">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
                         </div>
                         <div class="top3-info">
                            <img v-if="player.headImg" :src="player.headImg" class="player-avatar-xs" @error="handleImageError" />
                            <div v-else class="player-avatar-placeholder-xs">{{ player.name?.charAt(0) || '?' }}</div>
                            <span class="top3-name">{{ player.name }}</span>
                         </div>
                         <div class="top3-value">{{ player.reviveCnt }}</div>
                      </div>
                   </div>

                </div>
             </div>
          </div>
          
          <!-- 样式二 -->
          <div v-else-if="currentStyle === 'style2'" ref="exportDom" class="records-list style-2">
             <div class="style2-header">
                <div class="style2-title">
                   <span class="trophy-icon">🏆</span>
                   <div class="title-text">
                      <h2>{{ club.name || '俱乐部' }} 盐场周报</h2>
                      <div class="date-text">{{ queryDate }}</div>
                   </div>
                </div>
             </div>
             
             <!-- 战绩总览 -->
             <div class="style2-dashboard">
                <div class="dashboard-stats">
                   <div class="stat-card-row">
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">总 K/D</div>
                         <div class="stat-value-mini">{{ totalKD }}</div>
                      </div>
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">总胜率</div>
                         <div class="stat-value-mini">{{ totalWinRate }}%</div>
                      </div>
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">参战人数</div>
                         <div class="stat-value-mini">{{ battleRecords.roleDetailsList.length }}</div>
                      </div>
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">总复活丹</div>
                         <div class="stat-value-mini warning-text">{{ totalRevives }}</div>
                      </div>
                   </div>
                   <div class="stat-card-row">
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">总击杀</div>
                         <div class="stat-value-mini danger-text">{{ totalKills }}</div>
                      </div>
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">总死亡</div>
                         <div class="stat-value-mini">{{ totalDeaths }}</div>
                      </div>
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">总攻城</div>
                         <div class="stat-value-mini warning-text">{{ totalBuilding }}</div>
                      </div>
                      <div class="stat-card-mini">
                         <div class="stat-label-mini">人均击杀</div>
                         <div class="stat-value-mini purple-text">{{ avgKills }}</div>
                      </div>
                   </div>
                </div>
                
                <div class="dashboard-mvp" v-if="mvpPlayer">
                   <img v-if="mvpPlayer.headImg" :src="mvpPlayer.headImg" class="mvp-avatar" @error="handleImageError" />
                   <div v-else class="mvp-avatar-placeholder">{{ mvpPlayer.name?.charAt(0) || '?' }}</div>
                   <div class="mvp-crown">👑</div>
                   <div class="mvp-name">{{ mvpPlayer.name }}</div>
                   <div class="mvp-label">本周 MVP</div>
                </div>
             </div>

             <!-- 前三展示 -->
             <div class="style2-rankings-grid">
                <div class="rank-card-s2 red-border">
                   <div class="rank-card-title-s2"><span class="icon">⚔️</span> 击杀前三</div>
                   <div class="rank-list-s2">
                      <div v-for="(player, index) in killRank" :key="'s2-kill-'+index" class="rank-item-s2">
                         <div class="rank-num-s2">{{ index + 1 }}</div>
                         <div class="rank-player-s2">
                            <img v-if="player.headImg" :src="player.headImg" class="avatar-xxs" />
                            <span class="name">{{ player.name }}</span>
                         </div>
                         <div class="rank-val-s2 red">{{ player.winCnt }}</div>
                      </div>
                   </div>
                </div>
                
                <div class="rank-card-s2 orange-border">
                   <div class="rank-card-title-s2"><span class="icon">💣</span> 攻城前三</div>
                   <div class="rank-list-s2">
                      <div v-for="(player, index) in occupyRank" :key="'s2-occupy-'+index" class="rank-item-s2">
                         <div class="rank-num-s2">{{ index + 1 }}</div>
                         <div class="rank-player-s2">
                            <img v-if="player.headImg" :src="player.headImg" class="avatar-xxs" />
                            <span class="name">{{ player.name }}</span>
                         </div>
                         <div class="rank-val-s2 orange">{{ player.buildingCnt }}</div>
                      </div>
                   </div>
                </div>

                <div class="rank-card-s2 green-border">
                   <div class="rank-card-title-s2"><span class="icon">📊</span> KD 前三</div>
                   <div class="rank-list-s2">
                      <div v-for="(player, index) in kdRank" :key="'s2-kd-'+index" class="rank-item-s2">
                         <div class="rank-num-s2">{{ index + 1 }}</div>
                         <div class="rank-player-s2">
                            <img v-if="player.headImg" :src="player.headImg" class="avatar-xxs" />
                            <span class="name">{{ player.name }}</span>
                         </div>
                         <div class="rank-val-s2 green">{{ player.kd }}</div>
                      </div>
                   </div>
                </div>

                <div class="rank-card-s2 gray-border">
                   <div class="rank-card-title-s2"><span class="icon">💀</span> 死亡前三</div>
                   <div class="rank-list-s2">
                      <div v-for="(player, index) in deathRank" :key="'s2-death-'+index" class="rank-item-s2">
                         <div class="rank-num-s2">{{ index + 1 }}</div>
                         <div class="rank-player-s2">
                            <img v-if="player.headImg" :src="player.headImg" class="avatar-xxs" />
                            <span class="name">{{ player.name }}</span>
                         </div>
                         <div class="rank-val-s2 gray">{{ player.loseCnt }}</div>
                      </div>
                   </div>
                </div>

                <div class="rank-card-s2 purple-border">
                   <div class="rank-card-title-s2"><span class="icon">💊</span> 复活丹前三</div>
                   <div class="rank-list-s2">
                      <div v-for="(player, index) in reviveRank" :key="'s2-revive-'+index" class="rank-item-s2">
                         <div class="rank-num-s2">{{ index + 1 }}</div>
                         <div class="rank-player-s2">
                            <img v-if="player.headImg" :src="player.headImg" class="avatar-xxs" />
                            <span class="name">{{ player.name }}</span>
                         </div>
                         <div class="rank-val-s2 purple">{{ player.reviveCnt }}</div>
                      </div>
                   </div>
                </div>
                
                 <!-- 占位，保持排版一致，或者放其他榜单 -->
                 <div class="rank-card-s2 blue-border">
                   <div class="rank-card-title-s2"><span class="icon">🛡️</span> 生存前三</div>
                    <div class="rank-list-s2">
                      <div v-for="(player, index) in survivalRank" :key="'s2-survival-'+index" class="rank-item-s2">
                         <div class="rank-num-s2">{{ index + 1 }}</div>
                         <div class="rank-player-s2">
                            <img v-if="player.headImg" :src="player.headImg" class="avatar-xxs" />
                            <span class="name">{{ player.name }}</span>
                         </div>
                         <div class="rank-val-s2 blue">{{ player.survivalCnt }}</div>
                      </div>
                   </div>
                </div>
             </div>

             <!-- 详细列表 -->
             <div class="style2-table-wrapper">
                <table class="style2-table">
                   <thead>
                      <tr>
                         <th>排名</th>
                         <th>成员</th>
                         <th>击杀</th>
                         <th>死亡</th>
                         <th>攻城</th>
                         <th>复活丹</th>
                         <th>K/D</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr v-for="(player, index) in battleRecords.roleDetailsList" :key="'s2-row-'+player.roleId">
                         <td>
                            <div v-if="index < 3" class="medal-icon">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</div>
                            <div v-else class="rank-num-plain">{{ index + 1 }}</div>
                         </td>
                         <td>
                            <div class="player-cell">
                               <img v-if="player.headImg" :src="player.headImg" class="avatar-xs" />
                               <div v-else class="avatar-placeholder-xs">{{ player.name?.charAt(0) || '?' }}</div>
                               <span class="player-name-s2">{{ player.name }}</span>
                            </div>
                         </td>
                         <td>
                            <div class="bar-cell">
                               <div class="bar-val red">{{ player.winCnt }}</div>
                               <div class="progress-bg"><div class="progress-fill red" :style="{width: getPercent(player.winCnt, maxKills) + '%'}"></div></div>
                            </div>
                         </td>
                         <td>
                            <div class="bar-cell">
                               <div class="bar-val gray">{{ player.loseCnt }}</div>
                               <div class="progress-bg"><div class="progress-fill gray" :style="{width: getPercent(player.loseCnt, maxDeaths) + '%'}"></div></div>
                            </div>
                         </td>
                         <td>
                            <div class="bar-cell">
                               <div class="bar-val orange">{{ player.buildingCnt }}</div>
                               <div class="progress-bg"><div class="progress-fill orange" :style="{width: getPercent(player.buildingCnt, maxOccupies) + '%'}"></div></div>
                            </div>
                         </td>
                         <td>{{ Math.max((player.loseCnt || 0) - 6, 0) }}</td>  
                         <td class="kd-val">{{ parseFloat((player.winCnt && player.loseCnt ? player.winCnt/player.loseCnt : 0.00)).toFixed(2) }}</td>
                      </tr>
                   </tbody>
                </table>
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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMessage, NCheckboxGroup, NCheckbox, NRadioGroup, NRadioButton } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from 'html2canvas';
import { downloadCanvasAsImage } from "@/utils/imageExport";
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

const currentStyle = ref(localStorage.getItem('club_battle_records_style') || 'style1')

watch(currentStyle, (newStyle) => {
  localStorage.setItem('club_battle_records_style', newStyle)
})

const exportmethod = ref(['2']);
const exportDom = ref(null);

const message = useMessage()
const tokenStore = useTokenStore()
const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);

const loading = ref(false)
const battleRecords = ref(null)
const expandedMembers = ref(new Set())
const queryDate = ref(getLastSaturday())

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

// --- 新增计算属性和方法 ---

// 攻城榜 Top3
const occupyRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
    .sort((a, b) => (b.buildingCnt || 0) - (a.buildingCnt || 0))
    .slice(0, 3)
})

// 死亡榜 Top3
const deathRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
    .sort((a, b) => (b.loseCnt || 0) - (a.loseCnt || 0))
    .slice(0, 3)
})

// 生存榜 Top3 (以死亡数少排序，且至少有1次击杀或攻城)
const survivalRank = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return []
  return [...battleRecords.value.roleDetailsList]
    .filter(p => (p.winCnt > 0 || p.buildingCnt > 0))
    .sort((a, b) => (a.loseCnt || 0) - (b.loseCnt || 0))
    .slice(0, 3)
    .map(p => ({...p, survivalCnt: p.loseCnt}))
})

const totalDeaths = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  return battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.loseCnt || 0), 0)
})

const totalBuilding = computed(() => {
  if (!battleRecords.value?.roleDetailsList) return 0
  return battleRecords.value.roleDetailsList.reduce((sum, member) => sum + (member.buildingCnt || 0), 0)
})

const totalWinRate = computed(() => {
    const kills = totalKills.value
    const deaths = totalDeaths.value
    if (kills + deaths === 0) return '0.0'
    return ((kills / (kills + deaths)) * 100).toFixed(1)
})

const avgKills = computed(() => {
    if (!battleRecords.value?.roleDetailsList || battleRecords.value.roleDetailsList.length === 0) return 0
    return (totalKills.value / battleRecords.value.roleDetailsList.length).toFixed(1)
})

const mvpPlayer = computed(() => {
    if (!battleRecords.value?.roleDetailsList || battleRecords.value.roleDetailsList.length === 0) return null
    // 简单逻辑：击杀最多
    return battleRecords.value.roleDetailsList[0]
})

const maxKills = computed(() => Math.max(...(battleRecords.value?.roleDetailsList?.map(p => p.winCnt || 0) || [0])))
const maxDeaths = computed(() => Math.max(...(battleRecords.value?.roleDetailsList?.map(p => p.loseCnt || 0) || [0])))
const maxOccupies = computed(() => Math.max(...(battleRecords.value?.roleDetailsList?.map(p => p.buildingCnt || 0) || [0])))

const getPercent = (val, max) => {
    if (!max) return 0
    return Math.min(100, (val / max) * 100)
}

const getKillColor = (val) => {
    if (val >= 50) return 'rgba(76, 175, 80, 0.3)' 
    if (val >= 20) return 'rgba(139, 195, 74, 0.3)'
    return 'transparent'
}

const getOccupyColor = (val) => {
    if (val >= 100) return 'rgba(255, 204, 128, 0.3)'
    if (val >= 50) return 'rgba(255, 224, 178, 0.3)'
    return 'transparent'
}

const getDeathColor = (val) => {
    if (val >= 20) return 'rgba(239, 154, 154, 0.3)'
    if (val >= 10) return 'rgba(255, 205, 210, 0.3)'
    return 'transparent'
}

const getReviveColor = (val) => {
    if (val >= 5) return 'rgba(200, 230, 201, 0.3)'
    return 'transparent'
}

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

    // 6. Canvas转图片链接并下载
    const filename = queryDate.value.replace("/",'年').replace("/",'月')+'日盐场战报.png';
    downloadCanvasAsImage(canvas, filename);
  } catch (err) {
    console.error('DOM转图片失败：', err);
    alert('导出图片失败，请重试');
  }
};

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords
})

// 初始化：挂载后自动拉取
onMounted(() => {
  fetchBattleRecords()
})
</script>

<style scoped lang="scss">
.records-container {
  background: var(--bg-primary);
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}

// 头部信息区
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .header-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    padding: var(--spacing-xs);
    box-sizing: border-box;
  }

  .header-title {
    h2 {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    p {
      margin: var(--spacing-xs) 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }

  // 数据统计区
  .stats-section {
    display: flex;
    gap: var(--spacing-lg);
    align-items: center;

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      :deep(.n-tag) {
        font-size: var(--font-size-sm);
        padding: 4px 8px;
      }
    }
  }
}

// 功能操作区
.function-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;

  .function-left {
    .export-options {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      :deep(.n-checkbox-group) {
        display: flex;
        gap: var(--spacing-md);

        .n-checkbox {
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
      }
    }
  }

  .function-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    :deep(.n-date-picker) {
      font-size: var(--font-size-sm);
      width: 200px;

      .n-input-wrapper {
        font-size: var(--font-size-sm);
      }
    }

    .action-btn {
      font-size: var(--font-size-sm);
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

.battle-records-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    
    .stats-section {
      width: 100%;
      justify-content: space-between;
    }
  }
  
  .function-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    
    .function-left, .function-right {
      width: 100%;
      justify-content: space-between;
    }
  }
}

/* ================== 样式一 (Style 1) ================== */
.style-1 {
  background: #fff;
  padding: var(--spacing-md);
  color: #333;
  font-family: Arial, sans-serif;
}

.style1-header h2 {
  text-align: center;
  font-size: 20px;
  margin-bottom: 20px;
  font-weight: bold;
  padding: 10px;
  background: #f3f3f3;
  border-bottom: 3px solid #800080;
}

.style1-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.style1-table-container {
  flex: 2;
  overflow-x: auto;
}

.style1-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.style1-table th {
  background: #800080;
  color: #fff;
  padding: 8px;
  text-align: center;
  font-weight: bold;
}

.style1-table td {
  padding: 6px;
  border-bottom: 1px solid #eee;
  text-align: center;
  vertical-align: middle;
  height: 36px;
}

.style1-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.col-rank { width: 50px; }
.col-name { text-align: left !important; padding-left: 10px !important; }

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.player-avatar-placeholder-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
}

.style1-summary {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 250px;
}

.summary-card {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.summary-title {
  background: #800080;
  color: #fff;
  padding: 8px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  font-weight: bold;
}

.top3-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.top3-rank {
  width: 25px;
  text-align: center;
  margin-right: 5px;
}

.rank-icon { width: 20px; height: 20px; vertical-align: middle; }
.rank-icon-small { width: 16px; height: 16px; vertical-align: middle; }

.rank-medal { font-size: 20px; line-height: 1; }
.rank-medal-small { font-size: 16px; line-height: 1; }

.top3-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}

.top3-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.player-avatar-xs {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.player-avatar-placeholder-xs {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
}

.top3-value {
  font-weight: bold;
  width: 40px;
  text-align: right;
}

/* ================== 样式二 (Style 2) ================== */
.style-2 {
  background: #eef2f7;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  border-radius: 8px;
}

.style2-header {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.style2-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.trophy-icon {
  font-size: 36px;
}

.title-text h2 {
  font-size: 22px;
  color: #333;
  margin: 0;
  font-weight: 800;
}

.date-text {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.style2-dashboard {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-card-row {
  display: flex;
  gap: 15px;
}

.stat-card-mini {
  flex: 1;
  background: #fff;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-label-mini {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value-mini {
  font-size: 18px;
  font-weight: 800;
  color: #333;
}

.warning-text { color: #ff9800; }
.danger-text { color: #f44336; }
.purple-text { color: #9c27b0; }

.dashboard-mvp {
  width: 160px;
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ffd700;
}

.mvp-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 8px;
  border: 2px solid #ffd700;
  object-fit: cover;
}

.mvp-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffd700 0%, #ffab40 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  font-weight: bold;
}

.mvp-crown {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 24px;
  transform: rotate(15deg);
}

.mvp-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.mvp-label {
  font-size: 12px;
  color: #ffab40;
  font-weight: bold;
  background: #fff8e1;
  padding: 2px 8px;
  border-radius: 10px;
}

.style2-rankings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.rank-card-s2 {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  border-top: 4px solid transparent;
}

.rank-card-s2.red-border { border-top-color: #ff5252; }
.rank-card-s2.orange-border { border-top-color: #ffab40; }
.rank-card-s2.green-border { border-top-color: #69f0ae; }
.rank-card-s2.gray-border { border-top-color: #9e9e9e; }
.rank-card-s2.purple-border { border-top-color: #e040fb; }
.rank-card-s2.blue-border { border-top-color: #448aff; }

.rank-card-title-s2 {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #444;
}

.rank-list-s2 {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-item-s2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.rank-num-s2 {
  width: 16px;
  height: 16px;
  background: #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  margin-right: 8px;
}

.rank-item-s2:nth-child(1) .rank-num-s2 { background: #ffd700; color: #fff; }
.rank-item-s2:nth-child(2) .rank-num-s2 { background: #c0c0c0; color: #fff; }
.rank-item-s2:nth-child(3) .rank-num-s2 { background: #cd7f32; color: #fff; }

.rank-player-s2 {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.rank-player-s2 .name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-xxs {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.rank-val-s2 { font-weight: bold; }
.rank-val-s2.red { color: #ff5252; }
.rank-val-s2.orange { color: #ffab40; }
.rank-val-s2.green { color: #4caf50; }
.rank-val-s2.gray { color: #757575; }
.rank-val-s2.purple { color: #9c27b0; }
.rank-val-s2.blue { color: #2196f3; }

.style2-table-wrapper {
  background: #fff;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
}

.style2-table {
  width: 100%;
  border-collapse: collapse;
}

.style2-table thead {
  background: #4285f4;
}

.style2-table th {
  color: #fff;
  padding: 12px 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
}

.style2-table th:nth-child(2) {
  text-align: left;
  padding-left: 20px;
}

.style2-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f1f1f1;
  vertical-align: middle;
  text-align: center;
  font-size: 13px;
  color: #444;
}

.style2-table tr:hover {
  background: #f8fbff;
}

.medal-icon { font-size: 16px; }
.rank-num-plain { font-weight: bold; color: #888; }

.player-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  padding-left: 10px;
}

.player-name-s2 {
  font-weight: 600;
  color: #333;
}

.avatar-xs {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder-xs {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
}

.bar-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 150px;
}

.bar-val {
  width: 30px;
  text-align: right;
  font-weight: bold;
  font-size: 12px;
}
.bar-val.red { color: #ff5252; }
.bar-val.gray { color: #9e9e9e; }
.bar-val.orange { color: #ffab40; }

.progress-bg {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
}
.progress-fill.red { background: #ff5252; }
.progress-fill.orange { background: #ffab40; }
.progress-fill.gray { background: #9e9e9e; }

.kd-val {
  font-weight: bold;
  color: #4caf50;
}

@media (max-width: 768px) {
  .style1-content { flex-direction: column; }
  .style1-table-container, .style1-summary { width: 100%; }
  
  .style2-dashboard { flex-direction: column; }
  .stat-card-row { flex-wrap: wrap; }
  .dashboard-mvp { width: 100%; flex-direction: row; justify-content: flex-start; gap: 15px; }
  .mvp-crown { right: auto; left: 50px; }
  
  .style2-rankings-grid { grid-template-columns: 1fr; }
}
</style>
