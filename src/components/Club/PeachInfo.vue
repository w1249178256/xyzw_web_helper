<template>
  <div class="peach-info-card" ref="exportDom">
    <div class="toolbar">
      <div class="left">
        <span class="title">查询日期:</span>
        <a-date-picker v-model:value="queryDate" @change="fetchBattleRecordsByDate" valueFormat="YYYY/MM/DD"
          :disabled-date="disabledDate" :defaultValue="queryDate" format="YYYY/MM/DD" />
      </div>
      <div class="right">
        <n-button size="small" :disabled="!opponentMembers.length" @click="handleExportImage"
          class="action-btn export-btn" style="margin-right: 8px">
          <template #icon><n-icon>
              <Copy />
            </n-icon></template>导出图片
        </n-button>
        <n-button size="small" :disabled="loading" @click="fetchBattleRecordsByDate" class="refresh-btn">
          <template #icon>
            <n-icon>
              <Refresh />
            </n-icon>
          </template>
          刷新
        </n-button>
      </div>
    </div>

    <!-- Header Section -->
    <h2 class="main-title" v-if="battleInfo">{{ queryDate }} 蟠桃大会对战</h2>
    <div class="header-section" v-if="battleInfo">
      <div class="club-vs-container">
        <!-- Own Club (Left) -->
        <div class="club-info own">
          <n-avatar round :size="80" :src="battleInfo.ownClub?.logo || '/icons/xiaoyugan.png'" class="club-logo" />
          <div class="club-details">
            <div class="club-name">{{ battleInfo.ownClub.serverId }}服 {{ battleInfo.ownClub?.name || "未知" }}</div>
            <div class="club-stats">ID: {{ battleInfo.ownClub.id }}</div>
            <div class="club-stats">{{ battleInfo.ownClub.memberCount }}人 | {{ battleInfo.ownClub.quenchNum }}红 | {{
              formatPower(battleInfo.ownClub.power) }}</div>
            <div class="club-stats announcement">{{ battleInfo.ownClub.announcement }}</div>
          </div>
        </div>

        <!-- VS Badge -->
        <div class="vs-badge">
          <span class="vs-text">VS</span>
        </div>

        <!-- Opponent Club (Right) -->
        <div class="club-info opponent">
          <n-avatar round :size="80" :src="battleInfo.opponentClub?.logo || '/icons/xiaoyugan.png'" class="club-logo" />
          <div class="club-details">
            <div class="club-name">{{ battleInfo.opponentClub.serverId }}服 {{ battleInfo.opponentClub?.name || "未知" }}
            </div>
            <div class="club-stats">ID: {{ battleInfo.opponentClub.id }}</div>
            <div class="club-stats">
              {{ battleInfo.opponentClub.memberCount }}人 | {{ battleInfo.opponentClub.quenchNum }}红 | {{
                formatPower(battleInfo.opponentClub.power) }}
            </div>
            <div class="club-stats announcement">{{ battleInfo.opponentClub.announcement }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <n-spin size="large">
        <template #description>正在加载敌方数据...</template>
      </n-spin>
    </div>

    <!-- Data Table -->
    <div v-else-if="opponentMembers.length > 0" class="members-table">
      <div class="table-title">敌方信息</div>
      <n-data-table :columns="columns" :data="opponentMembers" :bordered="false" size="small" striped flex-height />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <n-empty description="暂无敌方数据" />
    </div>

    <!-- 玩家信息模态框 -->
    <n-modal v-model:show="showPlayerInfoModal" preset="card" title="对手信息" :style="{ width: '800px' }" :bordered="false"
      :segmented="{ content: 'soft', footer: 'soft' }" :show-close="false">
      <template #header-extra>
        <span v-if="playerInfo" class="player-id">ID: {{ playerInfo.id }}</span>
      </template>

      <div v-if="playerInfo" class="player-info-content">
        <div class="player-info-main">
          <n-avatar round :size="60" :src="playerInfo.headImg" class="player-avatar" />
          <div class="player-info-detail">
            <h3>
              {{ playerInfo.name }}
              <n-tag v-if="playerInfo.legacy > 0" :style="{
                color: '#fff',
                backgroundColor: legacycolor[playerInfo.legacy]?.value,
              }" size="small" style="margin-left: 8px">
                {{ legacycolor[playerInfo.legacy]?.name || "未知" }}
              </n-tag>
            </h3>
            <p>
              区服: {{ playerInfo.serverName || "未知" }} | 战力:
              {{ formatPower(playerInfo.power) }}
            </p>
            <p>俱乐部: {{ playerInfo.legionName || "无" }}</p>
            <p>
              总红数: {{ playerInfo.totalRedCount || 0 }} | 总开孔数:
              {{ playerInfo.totalHoleCount || 0 }} | 四圣数:
              {{ playerInfo.holyBeast || 0 }}
            </p>
          </div>
        </div>

        <div class="action-section">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1">
            <div class="fight-count-container">
              <label for="fightCount" class="fight-count-label">切磋次数:</label>
              <n-input id="fightCount" v-model:value="fightCount" type="number" placeholder="请输入切磋次数" min="1" max="100"
                :step="1" class="fight-count-input" size="small" @input="validateFightCount" />
              <div class="fight-count-hint">范围: 1-100</div>
            </div>
            <n-button type="tertiary" @click="showPlayerInfoModal = false" size="small" style="margin-right: 8px">
              关闭
            </n-button>
          </div>
          <n-button type="primary" @click="handleDuel" :disabled="!isFightCountValid">
            切磋
          </n-button>
        </div>

        <!-- 切磋进度和结果 -->
        <div v-if="fightProgress.visible" class="fight-progress">
          <div class="progress-info">
            <div class="progress-title">切磋进行中</div>
            <div class="progress-stats">
              <span>总次数: {{ fightProgress.totalCount }}</span>
              <span>已完成: {{ fightProgress.completedCount }}</span>
              <span>剩余: {{ fightProgress.remainingCount }}</span>
              <span>胜: {{ fightProgress.winCount }}</span>
              <span>负: {{ fightProgress.lossCount }}</span>
            </div>
          </div>
          <n-progress type="line" :percentage="fightProgress.percentage" :show-indicator="false" :stroke-width="8"
            status="processing" />
        </div>

        <!-- 最终结果统计 -->
        <div v-if="fightResult.visible" class="fight-result">
          <!-- 结果标题和统计信息 -->
          <div class="result-header">
            <h4 class="result-title">切磋结果</h4>
            <div class="result-summary">
              <div class="summary-item">
                <span class="summary-label">总次数：</span>
                <span class="summary-value">{{ fightResult.totalCount }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">胜：</span>
                <span class="summary-value win">{{
                  fightResult.winCount
                }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">负：</span>
                <span class="summary-value loss">{{
                  fightResult.lossCount
                }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">胜率：</span>
                <span class="summary-value">{{
                  (
                    (fightResult.winCount / fightResult.totalCount) *
                    100
                  ).toFixed(2)
                }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">我方掉将率：</span>
                <span class="summary-value">{{
                  (
                    (dieStats.ourDieHeroGameCount / fightResult.totalCount) *
                    100
                  ).toFixed(2)
                }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">敌方掉将率：</span>
                <span class="summary-value">{{
                  (
                    (dieStats.enemyDieHeroGameCount /
                      fightResult.totalCount) *
                    100
                  ).toFixed(2)
                }}%</span>
              </div>
            </div>
          </div>

          <!-- 战斗结果列表 -->
          <div class="result-list">
            <div v-for="(battle, index) in fightResult.resultCount" :key="index"
              :class="['battle-result-item', battle.isWin ? 'win' : 'loss']">
              <div class="battle-header">
                <span class="battle-index">第 {{ index + 1 }} 场</span>
                <n-tag :type="battle.isWin ? 'success' : 'error'" size="small">
                  {{ battle.isWin ? "胜利" : "失败" }}
                </n-tag>
              </div>

              <div class="battle-details">
                <div class="battle-side left-side">
                  <n-avatar round :size="32" :src="battle.leftheadImg" class="side-avatar" />
                  <div class="side-info">
                    <span class="side-name">{{
                      battle.leftName || "未知"
                    }}</span>
                    <span class="side-power">战力: {{ battle.leftpower }}</span>
                    <span class="side-die">掉将: {{ battle.leftDieHero }} 个</span>
                  </div>
                </div>

                <div class="battle-vs">VS</div>

                <div class="battle-side right-side">
                  <n-avatar round :size="32" :src="battle.rightheadImg" class="side-avatar" />
                  <div class="side-info">
                    <span class="side-name">{{
                      battle.rightName || "未知"
                    }}</span>
                    <span class="side-power">战力: {{ battle.rightpower }}</span>
                    <span class="side-die">掉将: {{ battle.rightDieHero }} 个</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <n-button type="primary" @click="resetFightResult">重新切磋</n-button>
            <n-button @click="fightResult.visible = false">关闭结果</n-button>
          </div>
        </div>

        <div class="player-heroes">
          <h4>武将阵容</h4>
          <!-- 添加调试信息 -->
          <div v-if="playerInfo.heroList" class="debug-info" style="font-size: 12px; color: #999; margin-bottom: 10px">
            武将数量: {{ playerInfo.heroList.length }}
          </div>
          <div class="hero-list" v-if="playerInfo.heroList && playerInfo.heroList.length > 0">
            <div v-for="(hero, index) in playerInfo.heroList" :key="hero.heroId || index" class="hero-item"
              @click="selectHeroInfo(hero)">
              <n-avatar round :size="40" :src="hero.heroAvate" style="cursor: pointer" />
              <div class="hero-info">
                <span class="hero-name">{{ hero.heroName }}</span>
                <div class="hero-stats">
                  <span>战力: {{ formatPower(hero.power || 0) }}</span>
                  <span>星级: {{ hero.star || 0 }}</span>
                  <span>红数: {{ hero.red || 0 }}</span>
                  <span>开孔: {{ hero.hole || 0 }}</span>
                  <span :class="hero.HolyBeast ? 'opened' : 'closed'">
                    {{ hero.HolyBeast ? "已开四圣" : "未开四圣" }}
                  </span>
                  <span v-if="hero.HolyBeast">四圣等级: {{ hero.HBlevel || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-heroes">
            <p>未查询到武将信息</p>
            <!-- 添加调试信息 -->
            <div v-if="playerInfo.heroList" style="font-size: 12px; color: #999; margin-top: 10px">
              武将列表为空
            </div>
            <div v-else style="font-size: 12px; color: #999; margin-top: 10px">
              武将列表未定义
            </div>
          </div>
        </div>
      </div>
    </n-modal>

    <!-- 武将详情模态框 -->
    <n-modal v-model:show="showHeroModal" class="hero-detail-modal" preset="card" title="武将详情"
      :style="{ width: '600px' }" :bordered="false" :segmented="{ content: 'soft', footer: 'soft' }">
      <div v-if="heroModealTemp" class="hero-modal-content">
        <div class="hero-modal-header">
          <n-avatar round :size="80" :src="heroModealTemp.heroAvate" class="hero-modal-avatar" />
          <div class="hero-modal-basic">
            <h3 class="hero-modal-name">{{ heroModealTemp.heroName }}</h3>
            <div class="hero-modal-stats">
              <span class="stat-item">{{ formatPower(heroModealTemp.power) }}</span>
              <span class="stat-item">等级: {{ heroModealTemp.level }}</span>
              <span class="stat-item">星级: {{ heroModealTemp.star }}</span>
              <n-tag :type="heroModealTemp.HolyBeast ? 'success' : 'warning'">
                {{ heroModealTemp.HolyBeast ? "已激活" : "未激活" }}
              </n-tag>
            </div>
          </div>
        </div>

        <div class="hero-modal-details">
          <n-descriptions label-placement="left" column="3" bordered>
            <n-descriptions-item label="战力">
              {{ formatPower(heroModealTemp.power) }}
            </n-descriptions-item>
            <n-descriptions-item label="等级">
              {{ heroModealTemp.level }}
            </n-descriptions-item>
            <n-descriptions-item label="星级">
              {{ heroModealTemp.star }}
            </n-descriptions-item>
            <n-descriptions-item label="开孔数">
              {{ heroModealTemp.hole }}
            </n-descriptions-item>
            <n-descriptions-item label="红孔数">
              {{ heroModealTemp.red }}
            </n-descriptions-item>
            <n-descriptions-item label="四圣状态">
              {{ heroModealTemp.HolyBeast ? "已激活" : "未激活" }}
            </n-descriptions-item>
            <n-descriptions-item label="四圣等级" v-if="heroModealTemp.HolyBeast">
              {{ heroModealTemp.HBlevel }}
            </n-descriptions-item>
            <n-descriptions-item label="鱼灵">
              {{
                heroModealTemp?.PearlInfo?.FishInfo?.name != undefined
                  ? heroModealTemp.PearlInfo?.FishInfo?.name
                  : "无"
              }}
            </n-descriptions-item>
            <n-descriptions-item label="鱼珠技能">
              {{
                heroModealTemp?.PearlInfo?.PearlSkill?.name != undefined
                  ? heroModealTemp.PearlInfo?.PearlSkill?.name
                  : "无"
              }}
            </n-descriptions-item>
            <n-descriptions-item label="鱼灵洗练">
              <div v-if="heroModealTemp?.PearlInfo?.slotMap?.length > 0">
                <div v-for="item in heroModealTemp.PearlInfo.slotMap" :key="item.id" class="ModalEquipment"
                  :style="'background-color:' + item.value"></div>
              </div>
              <div v-else>无</div>
            </n-descriptions-item>
          </n-descriptions>
        </div>

        <div class="hero-modal-equipment">
          <h4 class="section-title">装备详情</h4>
          <div class="equipment-grid">
            <div class="equipment-item">
              <span class="equipment-label">武器:</span>
              <div class="equipment-slots">
                <div v-for="(item, idx) in Object.values(
                  Object.values(heroModealTemp.equipment)[0]?.quenches || {},
                )" :key="idx" class="equipment-slot" :class="{ 'red-slot': item.colorId === 6 }"></div>
              </div>
            </div>
            <div class="equipment-item">
              <span class="equipment-label">衣服:</span>
              <div class="equipment-slots">
                <div v-for="(item, idx) in Object.values(
                  Object.values(heroModealTemp.equipment)[1]?.quenches || {},
                )" :key="idx" class="equipment-slot" :class="{ 'red-slot': item.colorId === 6 }"></div>
              </div>
            </div>
            <div class="equipment-item">
              <span class="equipment-label">头盔:</span>
              <div class="equipment-slots">
                <div v-for="(item, idx) in Object.values(
                  Object.values(heroModealTemp.equipment)[2]?.quenches || {},
                )" :key="idx" class="equipment-slot" :class="{ 'red-slot': item.colorId === 6 }"></div>
              </div>
            </div>
            <div class="equipment-item">
              <span class="equipment-label">坐骑:</span>
              <div class="equipment-slots">
                <div v-for="(item, idx) in Object.values(
                  Object.values(heroModealTemp.equipment)[3]?.quenches || {},
                )" :key="idx" class="equipment-slot" :class="{ 'red-slot': item.colorId === 6 }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <n-button @click="showHeroModal = false">关闭</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h, reactive } from "vue";
import {
  useMessage,
  NDataTable,
  NTag,
  NAvatar,
  NSpin,
  NEmpty,
  NDatePicker,
  NButton,
  NIcon,
  NModal,
  NInput,
  NProgress,
  NDescriptions,
  NDescriptionsItem,
  NInputNumber,
} from "naive-ui";
import { Refresh, Copy } from "@vicons/ionicons5";
import { useTokenStore } from "@/stores/tokenStore";
import html2canvas from "html2canvas";
import { downloadCanvasAsImage } from "@/utils/imageExport";
import { HERO_DICT, HeroFillInfo, legacycolor, getLineupType, LINEUP_RULES } from "@/utils/HeroList";
import {
  getLastSaturday,
  formatTimestamp,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard
} from '@/utils/clubBattleUtils'
const message = useMessage();
const tokenStore = useTokenStore();
const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);
const exportDom = ref(null);

const getLastSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const hour = today.getHours();

  let daysToSubtract = 0;
  if (dayOfWeek === 0) {
    // 今天是周日
    if (hour < 18) {
      // 18:00 之前，返回上周日
      daysToSubtract = 7;
    } else {
      // 18:00 之后，返回今天
      daysToSubtract = 0;
    }
  } else {
    // 周一到周六，计算距离上周日的天数
    daysToSubtract = dayOfWeek;
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() - daysToSubtract);

  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, "0");
  const targetDay = String(targetDate.getDate()).padStart(2, "0");

  return `${targetYear}/${targetMonth}/${targetDay}`;
};

// Helper: Format Power
const formatPower = (power) => {
  if (!power) return "0";
  if (power >= 100000000) {
    return (power / 100000000).toFixed(1) + "亿";
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(1) + "万";
  }
  return power.toString();
};

// Helper: Disabled Date (Only Sundays)
const disabledDate = (ts) => {
  const date = new Date(ts);
  return date.getDay() !== 0 || date > Date.now();
};

const formatDateToShort = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  return year.slice(2) + month + day
}

// Helper: Check if Sunday 18:00 - 20:30
const isSundayBattleTime = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return (
    day === 0 &&
    ((hour >= 18 && hour < 20) || (hour === 20 && minute <= 30))
  );
};

// Helper: Check if date string is today
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${d}`;
};

// State
const loading = ref(false);
const battleInfo = ref(null); // Opponent Club Info
const opponentMembers = ref([]);
const queryDate = ref(getLastSunday());

// 新增查询对手相关状态
const queryLoading = ref(false);
const queryTargetId = ref("");
// 玩家信息模态框状态
const showPlayerInfoModal = ref(false);
const playerInfo = ref(null);

// 新增切磋次数相关状态
const fightCount = ref(1);
const isFightCountValid = ref(true);

// 切磋进度状态
const fightProgress = reactive({
  visible: false,
  totalCount: 0,
  completedCount: 0,
  remainingCount: 0,
  winCount: 0,
  lossCount: 0,
  percentage: 0,
});

// 最终结果状态
const fightResult = reactive({
  visible: false,
  totalCount: 0,
  winCount: 0,
  lossCount: 0,
  winRate: 0,
  ourDieRate: 0,
  enemyDieRate: 0,
  resultCount: [], // 存储每场战斗的详细结果
});

// 切磋历史记录
const fightHistory = ref([]);

// 掉将统计
const dieStats = reactive({
  ourDieHeroGameCount: 0,
  enemyDieHeroGameCount: 0,
});

// 武将详情模态框状态
const showHeroModal = ref(false);
// 选中的武将信息
const heroModealTemp = ref(null);

// 选择武将信息，显示详情模态框
const selectHeroInfo = (heroInfo) => {
  showHeroModal.value = true;
  heroModealTemp.value = heroInfo;
};

// 获取装备信息红数和孔数
const getEquipment = (equipment) => {
  let redCount = 0;
  let holeCount = 0;
  //遍历4件装备
  Object.values(equipment).forEach((equ) => {
    //遍历每件装备的属性
    Object.values(equ.quenches).forEach((item) => {
      holeCount++;
      if (item.colorId == 6) {
        redCount++;
      }
    });
  });
  return { redCount, holeCount };
};

// 提取英雄信息
const getHeroInfo = (heroObj) => {
  //统计总红数
  let redCount = 0;
  let holeCount = 0;
  let heroList = [];

  try {
    // 检查英雄数据结构，确保可以遍历
    let heroesToProcess = [];

    if (Array.isArray(heroObj)) {
      // 如果是数组，直接使用
      heroesToProcess = heroObj;
    } else if (typeof heroObj === "object" && heroObj !== null) {
      // 如果是对象，转换为数组
      heroesToProcess = Object.values(heroObj);
    } else {
      console.error("英雄数据格式错误:", typeof heroObj);
      return { redCount, holeCount, heroList };
    }

    heroesToProcess.forEach((hero, index) => {
      // 跳过无效英雄数据
      if (!hero) return;

      let heroInfo = HERO_DICT[hero.heroId] || {};
      let equipmentInfo = hero.equipment
        ? getEquipment(hero.equipment)
        : { redCount: 0, holeCount: 0 };

      // 检查英雄基本信息
      const heroId = hero.heroId || `unknown_${index}`;
      const heroName = hero.heroName || heroInfo.name || `未知武将_${index}`;

      let tempObj = {
        heroId: heroId, //英雄ID
        artifactId: hero.artifactId || "", //英雄装备ID，用于匹配鱼灵信息
        power: hero.power || 0, //英雄战力
        star: hero.star || 0, //英雄星级
        equipment: hero.equipment, //英雄具体孔数和红数
        heroName: heroName, //英雄姓名
        heroAvate: hero.heroAvate || heroInfo.avatar || "",
        level: hero.level || 0, //英雄等级
        hole: equipmentInfo.holeCount, //英雄开孔数量
        red: equipmentInfo.redCount, //英雄红数
        HolyBeast: hero.hB?.active === true, //激活四圣
        HBlevel: hero.hB?.order || 0, //四圣等级
        // 添加英雄详情信息
        skillList: hero.skillList || [],
        attributeList: hero.attributeList || [],
        battleTeamSlot: hero.battleTeamSlot, //阵容站位
      };

      // 只添加有效的英雄
      if (heroId && heroName) {
        redCount += tempObj.red;
        holeCount += tempObj.hole;
        heroList.push(tempObj);
      }
    });
  } catch (error) {
    console.error("处理英雄信息时发生错误:", error);
    heroList = [];
  }
  heroList.sort((a, b) => a.battleTeamSlot - b.battleTeamSlot);
  return { redCount, holeCount, heroList };
};

// 验证切磋次数
const validateFightCount = (value) => {
  const num = parseInt(value);
  isFightCountValid.value = !isNaN(num) && num >= 1 && num <= 100;
};

// 重置切磋结果
const resetFightResult = () => {
  fightResult.visible = false;
  fightProgress.visible = false;
  fightHistory.value = [];
  dieStats.ourDieHeroGameCount = 0;
  dieStats.enemyDieHeroGameCount = 0;
  fightCount.value = 1;
  validateFightCount(1);
};

// 更新切磋进度
const updateFightProgress = (completedCount, winCount, lossCount) => {
  fightProgress.completedCount = completedCount;
  fightProgress.winCount = winCount;
  fightProgress.lossCount = lossCount;
  fightProgress.remainingCount = fightProgress.totalCount - completedCount;
  fightProgress.percentage = Math.round(
    (completedCount / fightProgress.totalCount) * 100,
  );
};

// 计算最终结果
const calculateFinalResult = (winCount, lossCount, resultCount) => {
  fightResult.totalCount = fightProgress.totalCount;
  fightResult.winCount = winCount;
  fightResult.lossCount = lossCount;
  fightResult.winRate = Math.round((winCount / fightProgress.totalCount) * 100);
  fightResult.ourDieRate = Math.round(
    (dieStats.ourDieHeroGameCount / fightProgress.totalCount) * 100,
  );
  fightResult.enemyDieRate = Math.round(
    (dieStats.enemyDieHeroGameCount / fightProgress.totalCount) * 100,
  );
  fightResult.resultCount = resultCount; // 存储每场战斗的详细结果
  fightResult.visible = true;
  fightProgress.visible = false;
};

// 新增查询对手信息功能
const fetchTargetInfo = async (roleId) => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询战绩");
    return;
  }

  // 重置之前的切磋结果
  resetFightResult();

  queryLoading.value = true;
  queryTargetId.value = roleId;

  try {
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "rank_getroleinfo",
      {
        bottleType: 0,
        includeBottleTeam: false,
        isSearch: false,
        roleId: roleId,
        includeHero: true,
        includeHeroDetail: true,
        includePearl: true,
      },
      5000,
    );

    if (!result.roleInfo) {
      message.warning("未查询到对手信息");
      return;
    }

    // 处理鱼灵信息
    const fishInfo = HeroFillInfo(result.roleInfo);

    // 获取英雄信息
    let heroAndholdAndRed = { redCount: 0, holeCount: 0, heroList: [] };
    if (result.roleInfo.heroes) {
      try {
        heroAndholdAndRed = getHeroInfo(result.roleInfo.heroes);
      } catch (error) {
        console.error("处理英雄信息失败:", error);
        heroAndholdAndRed = { redCount: 0, holeCount: 0, heroList: [] };
      }
    }

    // 将鱼灵信息添加到英雄列表中
    heroAndholdAndRed.heroList.forEach((hero) => {
      hero.PearlInfo = fishInfo[hero.artifactId] || {};
    });

    // 计算总红数和总开孔数
    const totalRedCount = heroAndholdAndRed.redCount;
    const totalHoleCount = heroAndholdAndRed.holeCount;

    // 从角色信息中获取红淬数据
    const roleRedQuench = result.roleInfo.red || 0;
    const roleMaxRed = result.roleInfo.maxRed || 0;

    // 从俱乐部信息中获取红淬数据（如果有）
    const legionRedQuench =
      result.legionInfo?.statistics?.["battle:red:quench"] || roleRedQuench;
    const legionMaxRed =
      result.legionInfo?.statistics?.["red:quench"] || roleMaxRed;
    const legionMaxPower =
      result.legionInfo?.statistics?.["max:power"] ||
      result.roleInfo.maxPower ||
      0;

    const playerData = {
      id: roleId,
      name: result.roleInfo.name,
      headImg: result.roleInfo.headImg,
      power: result.roleInfo.power,
      level: result.roleInfo.level,
      serverName: result.roleInfo.serverName,
      legionName: result.legionInfo?.name || "无",
      // 显示角色的红淬数
      redQuench: roleRedQuench,
      // 四圣数统计
      holyBeast: heroAndholdAndRed.heroList.filter((hero) => hero.HolyBeast)
        .length,
      // 俱乐部历史最高战力
      maxPower: formatPower(legionMaxPower),
      // 当前红鼓和最大红鼓
      currentRedDrum: roleRedQuench,
      maxRedDrum: roleMaxRed,
      // 总红数和总开孔数
      totalRedCount: totalRedCount,
      totalHoleCount: totalHoleCount,
      // 俱乐部红淬数据
      legionRedQuench: legionRedQuench,
      legionMaxRed: legionMaxRed,
      // 英雄列表
      heroList: heroAndholdAndRed.heroList,
      legacy: result.roleInfo.legacy?.color || 0, // 功法等级
    };

    playerInfo.value = playerData;
    showPlayerInfoModal.value = true;
    message.success("查询成功");
  } catch (error) {
    message.error(`查询失败: ${error.message}`);
    console.error("查询失败详细信息:", error);
  } finally {
    queryLoading.value = false;
  }
};

// 车头头像点击处理
const handleHeroClick = (hero) => {
  if (hero.id && !queryLoading.value) {
    message.info(`正在查询车头信息: ${hero.name}`);
    fetchTargetInfo(hero.id);
  } else if (!hero.id) {
    message.error("车头ID不存在，无法查询信息");
    console.error("车头ID不存在", hero);
  }
};

// 切磋功能处理 - 支持连续切磋
const handleDuel = async () => {
  if (!playerInfo.value) return;

  // 验证切磋次数
  validateFightCount(fightCount.value);
  if (!isFightCountValid.value) {
    message.error("请输入有效的切磋次数 (1-100)");
    return;
  }

  const totalCount = parseInt(fightCount.value);
  message.info(`开始连续切磋: ${playerInfo.value.name}，共${totalCount}次`);

  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法发起切磋");
    return;
  }

  queryLoading.value = true;

  // 初始化切磋进度
  fightProgress.visible = true;
  fightProgress.totalCount = totalCount;
  fightProgress.completedCount = 0;
  fightProgress.remainingCount = totalCount;
  fightProgress.winCount = 0;
  fightProgress.lossCount = 0;
  fightProgress.percentage = 0;

  // 重置掉将统计
  dieStats.ourDieHeroGameCount = 0;
  dieStats.enemyDieHeroGameCount = 0;

  // 重置历史记录
  fightHistory.value = [];

  try {
    let winCount = 0;
    let lossCount = 0;
    let resultCount = []; // 存储每场战斗的详细结果

    // 重置掉将统计
    dieStats.ourDieHeroGameCount = 0;
    dieStats.enemyDieHeroGameCount = 0;

    // 执行连续切磋
    for (let i = 0; i < totalCount; i++) {
      message.info(`正在进行第 ${i + 1}/${totalCount} 场切磋`);

      // 调用实际的切磋API
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_startpvp",
        {
          targetId: playerInfo.value.id,
        },
        10000,
      );

      console.log(`第 ${i + 1} 场切磋结果:`, result);

      if (result && result.battleData) {
        // 处理掉将情况
        let leftCount = 0;
        let rightCount = 0;

        // 检查我方掉将情况
        if (result.battleData.result?.sponsor?.teamInfo) {
          result.battleData.result.sponsor.teamInfo.forEach((item) => {
            if (item.hp == 0) {
              leftCount++;
            }
          });
        }

        // 检查敌方掉将情况
        if (result.battleData.result?.accept?.teamInfo) {
          result.battleData.result.accept.teamInfo.forEach((item) => {
            if (item.hp == 0) {
              rightCount++;
            }
          });
        }

        // 构建战斗结果对象
        const battleResult = {
          isWin: result.battleData.result?.isWin || false,
          leftName: result.battleData.leftTeam?.name || "未知",
          leftheadImg: result.battleData.leftTeam?.headImg || "",
          leftpower: formatPower(result.battleData.leftTeam?.power || 0),
          leftDieHero: leftCount,
          rightName: result.battleData.rightTeam?.name || "未知",
          rightheadImg: result.battleData.rightTeam?.headImg || "",
          rightpower: formatPower(result.battleData.rightTeam?.power || 0),
          rightDieHero: rightCount,
        };

        // 保存到结果数组
        resultCount.push(battleResult);

        // 更新掉将统计
        if (leftCount > 0) {
          dieStats.ourDieHeroGameCount++;
        }
        if (rightCount > 0) {
          dieStats.enemyDieHeroGameCount++;
        }

        // 更新胜负计数
        if (battleResult.isWin) {
          winCount++;
        } else {
          lossCount++;
        }

        // 更新切磋进度
        updateFightProgress(i + 1, winCount, lossCount);

        // 短暂延迟，避免请求过于频繁
        if (i < totalCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        // 单场切磋失败，继续下一场
        message.warning(
          `第 ${i + 1} 场切磋失败: ${result?.message || "未返回战斗数据"}`,
        );
        lossCount++;
        updateFightProgress(i + 1, winCount, lossCount);
      }
    }

    // 所有切磋完成，计算最终结果
    calculateFinalResult(winCount, lossCount, resultCount);

    message.success(`连续切磋完成，共${totalCount}场`);
  } catch (error) {
    console.error("连续切磋失败:", error);
    message.error(`连续切磋失败: ${error.message || "网络错误"}`);
    fightProgress.visible = false;
  } finally {
    queryLoading.value = false;
    // 不关闭模态框，让用户可以继续查看或再次切磋
  }
};



// Columns Definition
const columns = [
  {
    title: "序号",
    key: "index",
    width: 60,
    align: "center",
    render: (_, index) => index + 1,
  },
  {
    title: "头像",
    key: "headImg",
    width: 60,
    align: "center",
    render: (row) => {
      if (row.headImg) {
        return h("img", {
          src: row.headImg,
          class: "member-avatar-cell",
          alt: row.name,
        });
      }
      return h(
        "div",
        {
          class: "member-avatar-placeholder-cell",
        },
        row.name?.charAt(0) || "?"
      );
    },
  },
  {
    title: "角色名称",
    key: "name",
    width: 150,
    align: "center",
    render: (row) => {
      return h(
        "span",
        {
          style: {
            cursor: "pointer",
            color: "#1890ff",
            textDecoration: "underline",
          },
          onClick: () => fetchTargetInfo(row.id),
        },
        row.name
      );
    },
  },
  {
    title: "战力",
    key: "power",
    width: 100,
    align: "center",
    render: (row) => formatPower(row.power),
  },
  {
    title: "红淬",
    key: "redQuench",
    width: 80,
    align: "center",
    render: (row) => h("span", { style: { color: "#ff4d4f" } }, row.redQuench),
  },
  {
    title: "阵容(红数)[四圣等级]",
    key: "lineup",
    align: "left",
    render: (row) => {
      const heroes = row.heroList || [];
      const nodes = [];

      heroes.forEach((hero, index) => {
        // 英雄名字
        nodes.push(h("span", { style: { color: "#40a9ff" } }, hero.heroName));

        // 红数 (红色)
        nodes.push(h("span", { style: { color: "#ff4d4f" } }, `(${hero.red})`));

        // 四圣等级 (绿色)
        if (hero.HolyBeast) {
          nodes.push(h("span", { style: { color: "#52c41a" } }, `[${hero.HBlevel}]`));
        }

        // 分隔符
        if (index < heroes.length - 1) {
          nodes.push(", ");
        }
      });

      return h("span", { style: { fontSize: "12px" } }, nodes);
    },
  },
  {
    title: "阵容类型",
    key: "lineupType",
    width: 100,
    align: "center",
    render: (row) => {
      const type = row.lineupType;
      // 从配置中查找对应的颜色，默认灰色
      const rule = LINEUP_RULES.find((r) => r.name === type);
      const colorProps = rule?.colorProps || {
        color: "#f5f5f5",
        textColor: "#666",
      };

      return h(
        NTag,
        { color: colorProps, size: "small", bordered: false },
        { default: () => type }
      );
    },
  },
];

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = (val) => {
  if (undefined != val) {
    queryDate.value = val
  } else {
    queryDate.value = getLastSunday();
  }
  fetchBattleInfo();
}

// Fetch Data
const fetchBattleInfo = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询");
    return;
  }

  loading.value = true;
  opponentMembers.value = [];
  try {
    let opponentLegionId;
    let ownLegionId;
    let memberIds = [];
    let killRes;
    const shortDate = formatDateToShort(queryDate.value);

    // Time-based Logic
    // If selected date is today AND it is currently battle time, fetch live data
    if (queryDate.value === getLastSunday() && isSundayBattleTime()) {
      // Sunday 18:00-20:30: Use legion_getpayloadbf
      const res = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getpayloadbf",
        {},
        10000
      );
      if (!res || !res.legions) {
        message.error("未获取到战场信息");
        loading.value = false;
        return;
      }
      ownLegionId = club.value.id;
      opponentLegionId = res.legions[0].id;
      if (ownLegionId === opponentLegionId) {
        opponentLegionId = res.legions[1].id;
      }
      if (!opponentLegionId) {
        message.error("未获取到对战俱乐部ID");
        return;
      }
    } else {
      // Other times: Use legion_getpayloadrecord + legion_getpayloadkillrecord
      // 1. Get Task (for own ID reference, though not strictly needed if we trust the map)
      const taskRes = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getpayloadtask",
        {},
        10000
      );

      // 2. Get Record Map
      ownLegionId = club.value.id;
      const res = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getpayloadrecord",
        {},
        10000
      );
      if (!res || !res.enemyLegionMap) {
        message.warning("未获取到历史对战记录");
        loading.value = false;
        return;
      }
      const record = res.enemyLegionMap[shortDate];
      if (record) {
        opponentLegionId = record.id;
      } else {
        message.warning(`未找到 ${queryDate.value} 的对战记录`);
        loading.value = false;
        return;
      }
      if (!opponentLegionId) {
        message.error("未获取到对战俱乐部ID");
        return;
      }
    }


    killRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getpayloadkillrecord",
      { date: shortDate },
      10000
    );

    if (killRes && killRes.recordsMap && killRes.recordsMap[opponentLegionId]) {
      const records = killRes.recordsMap[opponentLegionId];
      memberIds = records.map(r => r.roleInfo.roleId);
    }


    // Get Opponent Club Details (Name, Logo, etc.)
    const ownLegionIdInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfobyid",
      { legionId: ownLegionId },
      10000
    );
    const clubInfoRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfobyid",
      { legionId: opponentLegionId },
      10000
    );

    if (!clubInfoRes || !clubInfoRes.legionData) {
      message.error("无法获取对手俱乐部详情");
      loading.value = false;
      return;
    }
    // Set Battle Info (Header)
    battleInfo.value = {
      ownClub: {
        id: ownLegionId,
        name: ownLegionIdInfo?.legionData?.name || '我方俱乐部',
        level: ownLegionIdInfo?.legionData?.level || 0,
        power: ownLegionIdInfo?.legionData?.power || 0,
        serverId: ownLegionIdInfo?.legionData?.serverId || '',
        logo: ownLegionIdInfo?.legionData?.logo || '',
        quenchNum: ownLegionIdInfo?.legionData?.quenchNum || 0,
        announcement: ownLegionIdInfo?.legionData?.announcement || '',
        memberCount: killRes.recordsMap[ownLegionId]?.length || 0,
      },
      opponentClub: {
        id: opponentLegionId,
        name: clubInfoRes?.legionData?.name || '敌方俱乐部',
        level: clubInfoRes?.legionData?.level || 0,
        power: clubInfoRes?.legionData?.power || 0,
        serverId: clubInfoRes?.legionData?.serverId || '',
        logo: clubInfoRes?.legionData?.logo || '',
        quenchNum: clubInfoRes?.legionData?.quenchNum || 0,
        announcement: clubInfoRes?.legionData?.announcement || '',
        memberCount: killRes.recordsMap[opponentLegionId]?.length || 0,
      }
    }

    // Get Members List
    // If we didn't get memberIds from killrecord (e.g. Live mode or empty kill record), fallback to club info
    if (memberIds.length === 0) {
      const members = clubInfoRes.legionData.members || {};
      memberIds = Object.keys(members);
    }

    const totalMembers = memberIds.length;
    let processedCount = 0;

    // Fetch details for each member
    // We'll process them in chunks to avoid overwhelming the server/client
    const chunkSize = 5;
    for (let i = 0; i < totalMembers; i += chunkSize) {
      const chunk = memberIds.slice(i, i + chunkSize);
      const promises = chunk.map(async (roleId) => {
        try {
          const roleRes = await tokenStore.sendMessageWithPromise(
            tokenId,
            "rank_getroleinfo",
            {
              roleId: parseInt(roleId),
              includeBottleTeam: false,
              isSearch: false, // Need equipment for red count
              bottleType: 0,
              includeHero: true,
              includeHeroDetail: true,
              includePearl: true,
            },
            5000
          );

          if (roleRes && roleRes.roleInfo) {
            // Process Heroes
            let heroList = [];
            let totalRed = 0;

            if (roleRes.roleInfo.heroes) {
              const heroes = Object.values(roleRes.roleInfo.heroes);
              heroList = heroes
                .map((h) => {
                  // Calculate Red for this hero
                  let heroRed = 0;
                  if (h.equipment) {
                    Object.values(h.equipment).forEach((eq) => {
                      if (eq.quenches) {
                        Object.values(eq.quenches).forEach((q) => {
                          if (q.colorId === 6) heroRed++;
                        });
                      }
                    });
                  }
                  totalRed += heroRed;

                  return {
                    heroId: h.heroId,
                    heroName: HERO_DICT[h.heroId]?.name || "未知",
                    red: heroRed,
                    power: h.power,
                    battleTeamSlot: h.battleTeamSlot,
                    HolyBeast: h.hB?.active === true,
                    HBlevel: h.hB?.order || 0,
                  };
                })
                .sort((a, b) => a.battleTeamSlot - b.battleTeamSlot);
            }

            return {
              id: roleRes.roleInfo.roleId,
              name: roleRes.roleInfo.name,
              headImg: roleRes.roleInfo.headImg,
              power: roleRes.roleInfo.power,
              legacy: roleRes.roleInfo.legacy?.color || 0,
              redQuench: totalRed,
              heroList: heroList,
              lineupType: getLineupType(heroList),
            };
          }
        } catch (e) {
          console.error(`Failed to fetch info for ${roleId}`, e);
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach((r) => {
        if (r) opponentMembers.value.push(r);
      });
    }

    // Sort by redQuench Descending, then Power Descending
    opponentMembers.value.sort((a, b) => {
      if (b.redQuench !== a.redQuench) {
        return b.redQuench - a.redQuench;
      }
      return b.power - a.power;
    });
  } catch (error) {
    message.error(`获取数据失败: ${error.message}`);
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleExportImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    message.error("未找到要导出的内容");
    return;
  }

  // 获取 table-container
  const tableContainer = exportDom.value.querySelector('.n-data-table');
  // 保存滚动位置
  const scrollTop = tableContainer ? tableContainer.scrollTop : 0;

  try {
    message.loading("正在生成图片，请稍候...");

    // 临时调整表格容器高度，确保所有内容可见
    // 对于 n-data-table，我们需要处理它的内部滚动容器
    if (tableContainer) {
      // 尝试找到 n-data-table 的滚动容器
      const scrollContainer = tableContainer.querySelector('.n-data-table-base-table-body');
      if (scrollContainer) {
        // 保存原始样式
        scrollContainer.dataset.originalHeight = scrollContainer.style.height;
        scrollContainer.dataset.originalOverflow = scrollContainer.style.overflow;

        // 强制展开
        scrollContainer.style.height = "auto";
        scrollContainer.style.overflow = "visible";
      }
    }

    // 调整外层容器
    const originalHeight = exportDom.value.style.height;
    const originalOverflow = exportDom.value.style.overflow;
    exportDom.value.style.height = "auto";
    exportDom.value.style.overflow = "visible";

    // 等待DOM更新
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片
      backgroundColor: "#ffffff", // 避免透明背景
      logging: false, // 关闭控制台日志
      allowTaint: true, // 允许跨域图片污染画布
    });

    // 6. Canvas转图片链接并下载
    const filename = `蟠桃园敌方信息_${queryDate.value.replace(/\//g, "-")}.png`;
    downloadCanvasAsImage(canvas, filename);

    message.success("图片导出成功");
  } catch (err) {
    console.error("DOM转图片失败：", err);
    message.error("导出图片失败，请重试");
  } finally {
    // 恢复原始样式
    exportDom.value.style.height = "";
    exportDom.value.style.overflow = "";

    if (tableContainer) {
      const scrollContainer = tableContainer.querySelector('.n-data-table-base-table-body');
      if (scrollContainer) {
        if (scrollContainer.dataset.originalHeight) {
          scrollContainer.style.height = scrollContainer.dataset.originalHeight;
        } else {
          scrollContainer.style.removeProperty('height');
        }

        if (scrollContainer.dataset.originalOverflow) {
          scrollContainer.style.overflow = scrollContainer.dataset.originalOverflow;
        } else {
          scrollContainer.style.removeProperty('overflow');
        }

        delete scrollContainer.dataset.originalHeight;
        delete scrollContainer.dataset.originalOverflow;
      }
    }
  }
};

onMounted(() => {
  queryDate.value = getLastSunday()
  fetchBattleInfo()
});
</script>

<style scoped lang="scss">
.peach-info-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  min-height: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 8px;
  flex-shrink: 0;

  .left {
    display: flex;
    align-items: center;
    gap: 8px;

    .title {
      font-size: 14px;
      color: #666;
    }
  }
}

.main-title {
  text-align: center;
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.header-section {
  text-align: center;
  margin-bottom: 20px;
  background: linear-gradient(to bottom, #fff5f5, #fff);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #ffccc7;
  flex-shrink: 0;
}

.club-vs-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  width: 100%;
}

.club-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.club-info.own {
  justify-self: end;
}

.club-info.opponent {
  justify-self: start;
}

.club-logo {
  border: 4px solid #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    border-color: #1890ff;
  }
}

.club-details {
  text-align: center;
}

.club-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.club-stats {
  font-size: 14px;
  color: #ff4d4f;

  &.announcement {
    white-space: pre-wrap;
    word-break: break-all;
    max-width: 300px;
    line-height: 1.5;
  }
}

.vs-badge {
  font-size: 32px;
  font-weight: 900;
  color: #ff7875;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  font-style: italic;
}

.battle-title {
  font-size: 16px;
  color: #666;
  margin-top: 10px;
  font-weight: bold;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.members-table {
  margin-top: 20px;
  flex: 1;
  overflow: hidden;
  /* Use NDataTable's scroll or auto here */
  display: flex;
  flex-direction: column;
}

.table-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}

:deep(.n-data-table) {
  height: 100%;
}

:deep(.n-data-table .n-data-table-th) {
  background-color: #fafafa;
  font-weight: bold;
}

:deep(.member-avatar-cell) {
  width: 32px;
  height: 32px;
  border-radius: 50% !important;
  object-fit: cover;
  border: 2px solid #eee;
  transition: all 0.2s;
  display: block;
  margin: 0 auto;

  &:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #1890ff;
  }
}

:deep(.member-avatar-placeholder-cell) {
  width: 32px;
  height: 32px;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #1890ff 0%, #69c0ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid #eee;
  margin: 0 auto;
}

// 模态框样式
.player-info-content {
  padding: 20px;
}

.player-info-main {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-light, #eee);
}

.player-avatar {
  border: 2px solid var(--primary-color, #1890ff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-info-detail h3 {
  margin: 0 0 8px 0;
  font-size: var(--font-size-lg, 16px);
  font-weight: var(--font-weight-bold, bold);
}

.player-info-detail p {
  margin: 0 0 4px 0;
  font-size: var(--font-size-sm, 14px);
  color: var(--text-secondary, #666);
}

.action-section {
  margin: 15px 0;
  display: flex;
  justify-content: flex-start;
}

.fight-count-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.fight-count-label {
  font-size: var(--font-size-sm, 14px);
  color: var(--text-primary, #333);
  font-weight: var(--font-weight-medium, 500);
  white-space: nowrap;
}

.fight-count-input {
  width: 100px;
}

.fight-count-hint {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-secondary, #999);
}

.fight-count-error {
  font-size: var(--font-size-xs, 12px);
  color: var(--error-color, #ff4d4f);
  margin-left: 4px;
}

.fight-progress {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-secondary, #f9f9f9);
  border-radius: var(--border-radius-sm, 4px);
  border: 1px solid var(--border-light, #eee);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-title {
  font-size: var(--font-size-sm, 14px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #333);
}

.progress-stats {
  display: flex;
  gap: 15px;
  font-size: var(--font-size-xs, 12px);
  color: var(--text-secondary, #666);
}

.fight-result {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-secondary, #f9f9f9);
  border-radius: var(--border-radius-sm, 4px);
  border: 1px solid var(--border-light, #eee);
}

.fight-result h4 {
  margin: 0 0 12px 0;
  font-size: var(--font-size-base, 14px);
  font-weight: var(--font-weight-bold, bold);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm, 14px);
}

.result-label {
  color: var(--text-secondary, #666);
}

.result-value {
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #333);
}

.result-value.win {
  color: var(--success-color, #52c41a);
}

.result-value.loss {
  color: var(--error-color, #ff4d4f);
}

.result-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-secondary, #f9f9f9);
  border-top: 1px solid var(--border-light, #eee);
}

/* 武将详情模态框样式 */
.hero-detail-modal {
  .hero-modal-content {
    padding: 20px 0;
  }

  .hero-modal-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .hero-modal-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--bg-secondary, #f9f9f9);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 2px solid var(--border-light, #eee);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-placeholder {
      font-size: 36px;
      font-weight: var(--font-weight-bold, bold);
      color: var(--text-secondary, #999);
    }
  }

  .hero-modal-basic {
    flex: 1;
  }

  .hero-modal-name {
    margin: 0 0 10px 0;
    font-size: var(--font-size-lg, 16px);
    font-weight: var(--font-weight-bold, bold);
  }

  .hero-modal-stats {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: var(--font-size-sm, 14px);
    color: var(--text-secondary, #666);

    .stat-item {
      padding: 4px 8px;
      background: var(--bg-secondary, #f9f9f9);
      border-radius: var(--border-radius-sm, 4px);
      border: 1px solid var(--border-light, #eee);
    }
  }

  .hero-modal-details {
    margin-bottom: 20px;

    :deep(.n-descriptions) {
      font-size: var(--font-size-sm, 14px);

      .n-descriptions-item-label {
        font-weight: var(--font-weight-medium, 500);
        color: var(--text-primary, #333);
      }

      .n-descriptions-item-content {
        color: var(--text-secondary, #666);
      }
    }
  }

  .hero-modal-equipment {
    margin-top: 20px;
  }

  .section-title {
    margin: 0 0 15px 0;
    font-size: var(--font-size-base, 14px);
    font-weight: var(--font-weight-bold, bold);
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .equipment-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .equipment-label {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-primary, #333);
    font-weight: var(--font-weight-medium, 500);
    width: 60px;
  }

  .equipment-slots {
    display: flex;
    gap: 6px;
  }

  .equipment-slot {
    width: 20px;
    height: 20px;
    border: 1px solid var(--border-light, #eee);
    border-radius: var(--border-radius-sm, 4px);
    background: var(--bg-secondary, #f9f9f9);
  }

  .equipment-slot.red-slot {
    background: var(--error-color, #ff4d4f);
    border-color: var(--error-color, #ff4d4f);
  }

  /* 鱼灵洗练颜色块 */
  .ModalEquipment {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 4px;
    display: inline-block;
    vertical-align: middle;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-detail-modal {
    :deep(.n-modal-content) {
      padding: 0 !important;
    }

    .hero-modal-header {
      flex-direction: column;
      text-align: center;
    }

    .equipment-grid {
      grid-template-columns: 1fr;
    }
  }
}

/* 切磋结果显示样式 */
.fight-result {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-secondary, #f9f9f9);
  border-radius: var(--border-radius-sm, 4px);
  border: 1px solid var(--border-light, #eee);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light, #eee);
}

.result-title {
  margin: 0;
  font-size: var(--font-size-base, 14px);
  font-weight: var(--font-weight-bold, bold);
  color: var(--text-primary, #333);
}

.result-summary {
  display: flex;
  gap: 15px;
  font-size: var(--font-size-sm, 14px);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.summary-label {
  color: var(--text-secondary, #666);
}

.summary-value {
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #333);
}

.summary-value.win {
  color: var(--success-color, #52c41a);
}

.summary-value.loss {
  color: var(--error-color, #ff4d4f);
}

.result-list {
  margin-bottom: 15px;
}

.battle-result-item {
  margin-bottom: 10px;
  padding: 12px;
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-sm, 4px);
  border: 1px solid var(--border-light, #eee);
  border-left: 4px solid var(--border-light, #eee);
  transition: all var(--transition-fast, 0.3s ease);
}

.battle-result-item.win {
  border-left-color: var(--success-color, #52c41a);
  background: rgba(82, 196, 26, 0.03);
}

.battle-result-item.loss {
  border-left-color: var(--error-color, #ff4d4f);
  background: rgba(255, 77, 79, 0.03);
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.battle-index {
  font-size: var(--font-size-sm, 14px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #333);
}

.battle-details {
  display: flex;
  align-items: center;
  gap: 15px;
}

.battle-side {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.side-avatar {
  flex-shrink: 0;
}

.side-info {
  flex: 1;
  font-size: var(--font-size-sm, 14px);
}

.side-name {
  display: block;
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #333);
  margin-bottom: 3px;
}

.side-power {
  display: block;
  color: var(--text-secondary, #666);
  margin-bottom: 2px;
}

.side-die {
  display: block;
  color: var(--text-secondary, #666);
  font-size: var(--font-size-xs, 12px);
}

.battle-vs {
  font-size: var(--font-size-sm, 14px);
  font-weight: var(--font-weight-bold, bold);
  color: var(--text-secondary, #999);
  margin: 0 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .result-summary {
    gap: 10px;
  }

  .battle-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .battle-side {
    width: 100%;
  }

  .battle-vs {
    align-self: center;
    margin: 5px 0;
    transform: rotate(90deg);
  }
}

.player-heroes {
  margin-top: 20px;
}

.player-heroes h4 {
  margin: 0 0 12px 0;
  font-size: var(--font-size-base, 14px);
  font-weight: var(--font-weight-bold, bold);
}

.hero-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.hero-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-secondary, #f9f9f9);
  padding: 12px 16px;
  border-radius: var(--border-radius-sm, 4px);
  border: 1px solid var(--border-light, #eee);
  transition: all var(--transition-fast, 0.3s ease);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.1));
    border-color: var(--primary-color, #1890ff);
  }
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.hero-name {
  font-size: var(--font-size-sm, 14px);
  font-weight: var(--font-weight-medium, 500);
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--font-size-xs, 12px);
  color: var(--text-secondary, #666);
}

.hero-stats span {
  padding: 2px 6px;
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-full, 99px);
  border: 1px solid var(--border-light, #eee);
}

.hero-stats span.opened {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color, #52c41a);
  border-color: var(--success-color, #52c41a);
}

.hero-stats span.closed {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-color, #faad14);
  border-color: var(--warning-color, #faad14);
}

.empty-heroes {
  background: var(--bg-secondary, #f9f9f9);
  padding: 30px;
  border-radius: var(--border-radius-sm, 4px);
  border: 1px solid var(--border-light, #eee);
  text-align: center;
  color: var(--text-secondary, #666);
  font-size: var(--font-size-sm, 14px);
}
</style>