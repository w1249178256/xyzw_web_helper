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
          <div class="records-info">
            <n-tag type="info">查询日期: {{ queryDate }}</n-tag>
            <n-tag type="success">总成员: {{ battleRecords.roleDetailsList.length }}</n-tag>
          </div>

          <div v-for="member in battleRecords.roleDetailsList" :key="member.roleId" class="member-card">
            <div class="member-header">
              <div class="member-info">
                <img v-if="member.headImg" :src="member.headImg" :alt="member.name" class="member-avatar"
                  @error="handleImageError">
                <div v-else class="member-avatar-placeholder">{{ member.name?.charAt(0) || '?' }}</div>
                <span class="member-name">{{ member.name }}</span>
              </div>
              <div class="member-stats-inline">
                <span class="stat-inline win">击杀 {{ member.winCnt || 0 }}</span>
                <span class="stat-inline loss">死亡 {{ member.loseCnt || 0 }}</span>
                <span class="stat-inline siege">攻城 {{ member.buildingCnt || 0 }}</span>
                <span class="stat-inline KD">K/D {{ parseFloat((member.winCnt/member.loseCnt)||0).toFixed(2)  }}</span>
              </div>
              <n-button text size="small" class="details-button" @click="toggleMemberDetails(member.roleId)">
                <template #icon>
                  <n-icon>
                    <ChevronDown v-if="!expandedMembers.has(member.roleId)" />
                    <ChevronUp v-else />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <!-- 战斗详情（可展开） -->
            <n-collapse-transition :show="expandedMembers.has(member.roleId)">
              <div class="battle-details">
                <div v-if="member.targetRoleList && member.targetRoleList.length > 0" class="battles-list">
                  <div v-for="(battle, index) in member.targetRoleList" :key="index" class="battle-item"
                    :class="getBattleClass(battle)">
                    <div class="battle-participants">
                      <div class="participant attacker">
                        <img v-if="battle.roleInfo?.headImg" :src="battle.roleInfo.headImg" :alt="battle.roleInfo.name"
                          class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.roleInfo?.name || '未知' }}</span>
                      </div>
                      <div class="battle-vs">
                        <n-tag :type="battle.attackType === 0 ? 'warning' : 'info'" size="small">{{
                          parseAttackType(battle.attackType) }}</n-tag>
                        <n-tag :type="battle.newWinFlag === 2 ? 'success' : 'error'" size="small">{{
                          parseBattleResult(battle.newWinFlag) }}</n-tag>
                      </div>
                      <div class="participant defender">
                        <img v-if="battle.targetRoleInfo?.headImg" :src="battle.targetRoleInfo.headImg"
                          :alt="battle.targetRoleInfo.name" class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.targetRoleInfo?.name || '未知' }}</span>
                      </div>
                    </div>
                    <div class="battle-time">{{ formatTimestamp(battle.timestamp) }}</div>
                  </div>
                </div>
                <div v-else class="no-battles">
                  <n-empty description="暂无战斗记录" size="small" />
                </div>
              </div>
            </n-collapse-transition>
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
          <div class="records-info">
            <n-tag type="info">查询日期: {{ queryDate }}</n-tag>
            <n-tag type="success">总成员: {{ battleRecords.roleDetailsList.length }}</n-tag>
          </div>

          <div v-for="member in battleRecords.roleDetailsList" :key="member.roleId" class="member-card">
            <div class="member-header">
              <div class="member-info">
                <img v-if="member.headImg" :src="member.headImg" :alt="member.name" class="member-avatar"
                  @error="handleImageError">
                <div v-else class="member-avatar-placeholder">{{ member.name?.charAt(0) || '?' }}</div>
                <span class="member-name">{{ member.name }}</span>
              </div>
              <div class="member-stats-inline">
                <span class="stat-inline win">击杀 {{ member.winCnt || 0 }}</span>
                <span class="stat-inline loss">死亡 {{ member.loseCnt || 0 }}</span>
                <span class="stat-inline siege">攻城 {{ member.buildingCnt || 0 }}</span>
                <span class="stat-inline KD">K/D {{ parseFloat((member.winCnt/member.loseCnt)||0).toFixed(2)  }}</span>
              </div>
              <n-button text size="small" class="details-button" @click="toggleMemberDetails(member.roleId)">
                <template #icon>
                  <n-icon>
                    <ChevronDown v-if="!expandedMembers.has(member.roleId)" />
                    <ChevronUp v-else />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <!-- 战斗详情（可展开） -->
            <n-collapse-transition :show="expandedMembers.has(member.roleId)">
              <div class="battle-details">
                <div v-if="member.targetRoleList && member.targetRoleList.length > 0" class="battles-list">
                  <div v-for="(battle, index) in member.targetRoleList" :key="index" class="battle-item"
                    :class="getBattleClass(battle)">
                    <div class="battle-participants">
                      <div class="participant attacker">
                        <img v-if="battle.roleInfo?.headImg" :src="battle.roleInfo.headImg" :alt="battle.roleInfo.name"
                          class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.roleInfo?.name || '未知' }}</span>
                      </div>
                      <div class="battle-vs">
                        <n-tag :type="battle.attackType === 0 ? 'warning' : 'info'" size="small">{{
                          parseAttackType(battle.attackType) }}</n-tag>
                        <n-tag :type="battle.newWinFlag === 2 ? 'success' : 'error'" size="small">{{
                          parseBattleResult(battle.newWinFlag) }}</n-tag>
                      </div>
                      <div class="participant defender">
                        <img v-if="battle.targetRoleInfo?.headImg" :src="battle.targetRoleInfo.headImg"
                          :alt="battle.targetRoleInfo.name" class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.targetRoleInfo?.name || '未知' }}</span>
                      </div>
                    </div>
                    <div class="battle-time">{{ formatTimestamp(battle.timestamp) }}</div>
                  </div>
                </div>
                <div v-else class="no-battles">
                  <n-empty description="暂无战斗记录" size="small" />
                </div>
              </div>
            </n-collapse-transition>
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
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from 'html2canvas';
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
  parseBattleResult,
  parseAttackType,
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


const exportDom = ref(null);
const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()

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

// 获取战斗样式类
const getBattleClass = (battle) => {
  const classes = []
  if (battle.newWinFlag === 2) {
    classes.push('battle-win')
  } else {
    classes.push('battle-loss')
  }
  if (battle.attackType === 0) {
    classes.push('battle-attack')
  } else {
    classes.push('battle-defend')
  }
  return classes.join(' ')
}

// 切换成员详情展开状态
const toggleMemberDetails = (roleId) => {
  if (expandedMembers.value.has(roleId)) {
    expandedMembers.value.delete(roleId)
  } else {
    expandedMembers.value.add(roleId)
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const disabledDate = (current)=>{
  return current.getDay()!=6 || current>Date.now();
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
      battleRecords.value = result
      message.success('战绩加载成功')
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
    //导出成excel
    // const exportText = formatBattleRecordsForExport(
    //   battleRecords.value.roleDetailsList,
    //   queryDate.value
    // )
    // await copyToClipboard(exportText)
    //导出成图片,两种方式自选一吧
    exportToImage()
    message.success('战绩已复制到剪贴板')
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
    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: '#ffffff', // 避免透明背景（默认透明）
      logging: false // 关闭控制台日志
    });

    // 6. Canvas转图片链接（支持PNG/JPG）
    const imgUrl = canvas.toDataURL('image/png'); // 若要JPG，改为'image/jpeg'

    // 7. 创建下载链接，触发浏览器下载
    const link = document.createElement('a');
    link.href = imgUrl;
    console.log()
    link.download = queryDate.value.replace("/",'月').replace("/",'日')+'盐场战报.png'; // 下载文件名
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
}

.inline-title {
  font-weight: var(--font-weight-semibold);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.battle-records-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: 10px;
}

.records-info {
  display: flex;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
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

  &+& {
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
  
  &.KD {
    background: rgba(151, 151, 151, 0.1);
    color: #858585;
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

// 响应式设计
@media (max-width: 768px) {
  .member-stats {
    grid-template-columns: 1fr;
  }

  .battle-participants {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .battle-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .battle-time {
    align-self: flex-end;
  }
}
</style>
