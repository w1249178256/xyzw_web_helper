<template>
  <div
    class="game-status-container"
    :class="{
      'full-grid': activeSection === 'fightPvp',
      'full-page-mode':
        activeSection === 'saltFieldGroup' ||
        activeSection === 'campChallengeGroup' ||
        activeSection === 'apexChallengeGroup' ||
        activeSection === 'peachGroup' ||
        activeSection === 'rankGroup',
      'club-mode': activeSection === 'club',
    }"
  >
    <!-- 身份牌常驻（嵌入式，Tabs 上方） -->
    <IdentityCard embedded />

    <!-- 下方选卡分区切换（Tabs）：日常｜俱乐部｜活动 -->
    <n-tabs
      class="section-tabs"
      v-model:value="activeSection"
      type="line"
      animated
      size="small"
    >
      <n-tab-pane name="daily" tab="日常" />
      <n-tab-pane name="club" tab="俱乐部" />
      <n-tab-pane name="activity" tab="活动" />
      <n-tab-pane v-if="ENABLE_TOOLS_TAB" name="tools" tab="工具" />
      <n-tab-pane name="apexChallengeGroup" tab="逐鹿盐山" />
      <n-tab-pane name="campChallengeGroup" tab="营地挑战" />
      <n-tab-pane name="saltFieldGroup" tab="盐场" />
      <n-tab-pane name="peachGroup" tab="蟠桃园" />
      <n-tab-pane name="rankGroup" tab="排行榜" />
      <n-tab-pane name="fightPvp" tab="切磋" />
    </n-tabs>

    <!-- 阵容（仅日常） -->
    <TeamFormation v-show="activeSection === 'daily'" />

    <!-- 每日任务状态（仅日常） -->
    <DailyTaskStatus v-show="activeSection === 'daily'" />

    <!-- 咸将塔状态 -->
    <TowerStatus v-show="activeSection === 'daily' && isShowTowerStatus" />

    <!-- 怪异塔状态 -->
    <WeirdTowerStatus v-show="activeSection === 'daily'" />

    <!-- 盐罐机器人状态（提取组件） -->
    <BottleHelperCard v-show="activeSection === 'daily'" />

    <!-- 挂机状态（提取组件） -->
    <HangUpStatusCard v-show="activeSection === 'daily'" />

    <!-- 无限阵容助手（提取组件） -->
    <Unlimitedlineup v-show="activeSection === 'tools'" />

    <!-- 宝箱助手（提取组件） -->
    <BoxHelperCard v-show="activeSection === 'tools'" />

    <!-- 钓鱼助手（提取组件） -->
    <FishHelperCard v-show="activeSection === 'tools'" />

    <!-- 招募助手（提取组件） -->
    <RecruitHelperCard v-show="activeSection === 'tools'" />

    <!-- 升星助手（提取组件） -->
    <StarUpgradeCard v-if="activeSection === 'tools'" />

    <!-- 竞技场助手（提取组件） -->
    <FightHelperCard v-if="activeSection === 'tools'" />

    <!-- 梦境助手（提取组件） -->
    <DreamHelperCard v-if="activeSection === 'tools'" />

    <!-- 武将升级助手（提取组件） -->
    <HeroUpgradeCard v-if="activeSection === 'tools'" />

    <!-- 洗练助手（提取组件） -->
    <RefineHelperCard v-if="activeSection === 'tools'" />

    <!-- 消耗活动进度（提取组件） -->
    <ConsumptionProgressCard v-if="activeSection === 'tools'" />
    <!-- 俱乐部排位（暂时隐藏） -->
    <div
      class="status-card legion-match"
      v-if="ENABLE_LEGION_MATCH && activeSection === 'club'"
    >
      <div class="card-header">
        <img
          src="/icons/1733492491706152.png"
          alt="俱乐部图标"
          class="status-icon"
        />
        <div class="status-info">
          <h3>俱乐部排位</h3>
          <p>赛事状态</p>
        </div>
        <div class="status-badge" :class="{ active: legionMatch.isRegistered }">
          <div class="status-dot" />
          <span>{{ legionMatch.isRegistered ? "已报名" : "未报名" }}</span>
        </div>
      </div>
      <div class="card-content">
        <p class="description">
          每逢周三周四周五有比赛<br />
          立即报名参与精彩对决！
        </p>
        <button
          class="action-button"
          :disabled="legionMatch.isRegistered"
          @click="registerLegionMatch"
        >
          {{ legionMatch.isRegistered ? "已报名" : "立即报名" }}
        </button>
      </div>
    </div>

    <!-- 俱乐部签到（已迁移到俱乐部信息-概览，故隐藏原卡片） -->
    <div
      class="status-card legion-signin"
      v-if="ENABLE_LEGION_SIGNIN_CARD && activeSection === 'club'"
    >
      <div class="card-header">
        <img
          src="/icons/1733492491706148.png"
          alt="签到图标"
          class="status-icon"
        />
        <div class="status-info">
          <h3>俱乐部签到</h3>
          <p>每日签到状态</p>
        </div>
        <div class="status-badge" :class="{ active: legionSignin.isSignedIn }">
          <div class="status-dot" />
          <span>{{ legionSignin.isSignedIn ? "已签到" : "待签到" }}</span>
        </div>
      </div>
      <div class="card-content">
        <p v-if="legionSignin.clubName" class="club-name">
          当前俱乐部<br />
          <strong>{{ legionSignin.clubName }}</strong>
        </p>
        <p v-else class="description">尚未加入任何俱乐部</p>
        <div class="action-row">
          <button
            class="action-button"
            :disabled="legionSignin.isSignedIn"
            @click="signInLegion"
          >
            {{ legionSignin.isSignedIn ? "已签到" : "立即签到" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 俱乐部信息（仅俱乐部分区） -->
    <ClubInfo v-if="activeSection === 'club'" />

    <!-- 月度任务进度（提取组件） -->
    <MonthlyTasksCard v-show="activeSection === 'activity'" />

    <!-- 咸鱼大冲关（提取组件） -->
    <StudyChallengeCard v-show="activeSection === 'activity'" />

    <!-- 换皮闯关 -->
    <SkinChallengeCard v-show="activeSection === 'activity'" />

    <!-- 逐鹿盐山分组 -->
    <div
      class="apex-challenge-group"
      v-if="activeSection === 'apexChallengeGroup'"
    >
      <ApexChallenge />
    </div>

    <!-- 营地挑战分组 -->
    <div
      class="camp-challenge-group"
      v-if="activeSection === 'campChallengeGroup'"
    >
      <CampChallenge />
    </div>

    <!-- 盐场分组（包含盐场、周战绩、月战绩） -->
    <div class="salt-field-group" v-if="activeSection === 'saltFieldGroup'">
      <div
        class="sub-nav"
        style="
          padding: 8px;
          background: var(--n-color);
          display: flex;
          justify-content: center;
        "
      >
        <n-tabs
          type="segment"
          animated
          v-model:value="saltFieldSubTab"
          size="small"
        >
          <n-tab-pane name="warrank" tab="盐场" />
          <n-tab-pane name="weekBattle" tab="本周盐场战绩" />
          <n-tab-pane name="monthBattle" tab="本月盐场战绩" />
          <n-tab-pane name="legionWarMap" tab="盐场地图" />
          <n-tab-pane name="legionWarStatistics" tab="盐场战况" />
        </n-tabs>
      </div>

      <!-- 盐场匹配信息详情 样式切换 -->
      <div
        class="style-switch-bar"
        v-if="saltFieldSubTab === 'warrank'"
        style="
          padding: 0 8px 8px;
          background: var(--n-color);
          display: flex;
          justify-content: center;
        "
      >
        <n-radio-group v-model:value="warrankStyle" size="small">
          <n-radio-button value="style1">样式一</n-radio-button>
          <n-radio-button value="style2">样式二</n-radio-button>
        </n-radio-group>
      </div>

      <div
        class="warrank-full-container"
        v-if="saltFieldSubTab === 'weekBattle'"
      >
        <ClubBattleRecords />
      </div>

      <div
        class="warrank-full-container"
        :class="{ 'style2-container': warrankStyle === 'style2' }"
        v-if="saltFieldSubTab === 'warrank'"
      >
        <ClubWarrankV2 v-if="warrankStyle === 'style2'" />
        <ClubWarrank v-else />
      </div>

      <div
        class="warrank-full-container"
        v-if="saltFieldSubTab === 'monthBattle'"
      >
        <ClubMonthBattleRecords />
      </div>

      <div
        class="warrank-full-container"
        v-if="saltFieldSubTab === 'legionWarMap'"
      >
        <LegionWarMap />
      </div>
      <div
        class="warrank-full-container"
        v-if="saltFieldSubTab === 'legionWarStatistics'"
      >
        <LegionWarStatistics />
      </div>
    </div>

    <!-- 蟠桃园分组 -->
    <div class="peach-group" v-if="activeSection === 'peachGroup'">
      <div
        class="sub-nav"
        style="
          padding: 8px;
          background: var(--n-color);
          display: flex;
          justify-content: center;
        "
      >
        <n-tabs
          type="segment"
          animated
          v-model:value="peachSubTab"
          size="small"
        >
          <n-tab-pane name="peach" tab="蟠桃园信息" />
          <n-tab-pane name="peachBattle" tab="蟠桃园战绩" />
        </n-tabs>
      </div>

      <!-- 蟠桃园信息 样式切换 -->
      <div
        class="style-switch-bar"
        v-if="peachSubTab === 'peach'"
        style="
          padding: 0 8px 8px;
          background: var(--n-color);
          display: flex;
          justify-content: center;
        "
      >
        <n-radio-group v-model:value="peachStyle" size="small">
          <n-radio-button value="style1">样式一</n-radio-button>
          <n-radio-button value="style2">样式二</n-radio-button>
        </n-radio-group>
      </div>

      <div class="warrank-full-container" v-if="peachSubTab === 'peachBattle'">
        <PeachBattleRecords />
      </div>

      <div
        class="warrank-full-container"
        :class="{ 'style2-container': peachStyle === 'style2' }"
        v-if="peachSubTab === 'peach'"
      >
        <PeachInfoV2 v-if="peachStyle === 'style2'" />
        <PeachInfo v-else />
      </div>
    </div>

    <!-- 排行榜分组 -->
    <div class="rank-group" v-if="activeSection === 'rankGroup'">
      <div
        class="sub-nav"
        style="
          padding: 8px;
          background: var(--n-color);
          display: flex;
          justify-content: center;
        "
      >
        <n-tabs type="segment" animated v-model:value="rankSubTab" size="small">
          <n-tab-pane name="serverrank" tab="区服榜" />
          <n-tab-pane name="toprank" tab="巅峰榜" />
          <n-tab-pane name="topclubrank" tab="俱乐部榜" />
          <n-tab-pane name="goldclubrank" tab="黄金积分榜" />
          <n-tab-pane name="greatRouteRank" tab="伟大航路积分榜" />
        </n-tabs>
      </div>

      <div class="warrank-full-container" v-if="rankSubTab === 'serverrank'">
        <ServerRankList />
      </div>

      <div class="warrank-full-container" v-if="rankSubTab === 'toprank'">
        <TopRankList />
      </div>

      <div class="warrank-full-container" v-if="rankSubTab === 'topclubrank'">
        <TopClubList />
      </div>

      <div class="warrank-full-container" v-if="rankSubTab === 'goldclubrank'">
        <GoldClubList />
      </div>

      <div
        class="warrank-full-container"
        v-if="rankSubTab === 'greatRouteRank'"
      >
        <GreatRouteRankList />
      </div>
    </div>
    <!-- 切磋（提取组件） -->
    <FightPvp v-if="activeSection === 'fightPvp'" />
  </div>
</template>

<script setup>
import { useMessage } from "naive-ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";

import ApexChallenge from "./Apex/ApexChallenge.vue";
import BottleHelperCard from "./cards/BottleHelperCard.vue";
import BoxHelperCard from "./cards/BoxHelperCard.vue";
import ConsumptionProgressCard from "./cards/ConsumptionProgressCard.vue";
import DreamHelperCard from "./cards/DreamHelperCard.vue";
import FightHelperCard from "./cards/FightHelperCard.vue";
import FightPvp from "./cards/FightPvp.vue";
import FishHelperCard from "./cards/FishHelperCard.vue";
import GoldClubList from "./cards/GoldRankListPageCard.vue";
import HangUpStatusCard from "./cards/HangUpStatusCard.vue";
import HeroUpgradeCard from "./cards/HeroUpgradeCard.vue";
import MonthlyTasksCard from "./cards/MonthlyTasksCard.vue";
import RecruitHelperCard from "./cards/RecruitHelperCard.vue";
import RefineHelperCard from "./cards/RefineHelperCard.vue";
import ServerRankList from "./cards/ServerRankListPageCard.vue";
import SkinChallengeCard from "./cards/SkinChallengeCard.vue";
import StarUpgradeCard from "./cards/StarUpgradeCard.vue";
import StudyChallengeCard from "./cards/StudyChallengeCard.vue";
import TopClubList from "./cards/TopClubListPageCard.vue";
import TopRankList from "./cards/TopRankListPageCard.vue";
import Unlimitedlineup from "./cards/Unlimitedlineup.vue";
import CampChallenge from "./Club/CampChallenge.vue";
import ClubBattleRecords from "./Club/ClubBattleRecords.vue";
import ClubMonthBattleRecords from "./Club/ClubMonthBattleRecords.vue";
import ClubWarrank from "./Club/ClubWarrank.vue";
import ClubWarrankV2 from "./Club/ClubWarrankV2.vue";
import GreatRouteRankList from "./Club/GreatRouteRankListPageCard.vue";
import LegionWarMap from "./Club/LegionWarMap.vue";
import LegionWarStatistics from "./Club/LegionWarStatistics.vue";
import PeachBattleRecords from "./Club/PeachBattleRecords.vue";
import PeachInfo from "./Club/PeachInfo.vue";
import PeachInfoV2 from "./Club/PeachInfoV2.vue";
import TowerStatus from "./Tower/TowerStatus.vue";
import WeirdTowerStatus from "./Tower/WeirdTowerStatus.vue";

const tokenStore = useTokenStore();
useMessage();

const legionMatch = ref({
  isRegistered: false,
});

// 响应式数据

const activeSection = ref("daily");
const saltFieldSubTab = ref("warrank");
const peachSubTab = ref("peach");
const rankSubTab = ref("serverrank");

// 盐场匹配信息详情 / 蟠桃园信息 界面样式选择（style1=原有样式，style2=移植样式）
const warrankStyle = ref(
  localStorage.getItem("club_warrank_style") || "style1",
);
const peachStyle = ref(localStorage.getItem("peach_info_style") || "style1");

watch(warrankStyle, (newStyle) => {
  localStorage.setItem("club_warrank_style", newStyle);
});
watch(peachStyle, (newStyle) => {
  localStorage.setItem("peach_info_style", newStyle);
});

// 活动开放时间：仅周一到周三可参与

const bottleHelper = ref({
  isRunning: false,
  remainingTime: 0,
  stopTime: 0,
});

const hangUp = ref({
  isActive: false,
  remainingTime: 0,
  elapsedTime: 0,
  lastTime: 0,
  hangUpTime: 0,
  isExtending: false, // 加钟状态
  isClaiming: false, // 领取奖励状态
});

const legionSignin = ref({
  isSignedIn: false,
  clubName: "",
});

// 使用 tokenStore 中的答题状态（仍用于 badge 状态等场景，如果仅在子组件中使用也可移除）

// 计算属性
const roleInfo = computed(() => {
  return tokenStore.gameData?.roleInfo || null;
});
const isShowTowerStatus = computed(() => {
  const tower = roleInfo.value?.role?.tower;
  const towerId = tower?.id;
  const floor = Math.floor(towerId / 10) + 1;
  if (floor > 450) {
    return false;
  }
  return true;
});

// WebSocket连接状态

// 格式化时间 - 确保显示到秒

// 更新数据
const updateGameStatus = () => {
  if (!roleInfo.value) return;

  const role = roleInfo.value.role;

  // 更新盐罐机器人状态
  if (role.bottleHelpers) {
    const now = Date.now() / 1000;
    bottleHelper.value.stopTime = role.bottleHelpers.helperStopTime;
    bottleHelper.value.isRunning = role.bottleHelpers.helperStopTime > now;
    // 确保剩余时间为整数秒
    bottleHelper.value.remainingTime = Math.max(
      0,
      Math.floor(role.bottleHelpers.helperStopTime - now),
    );
    // 控制台精简，避免频繁刷屏
  }

  // 更新挂机状态
  if (role.hangUp) {
    const now = Date.now() / 1000;
    hangUp.value.lastTime = role.hangUp.lastTime;
    hangUp.value.hangUpTime = role.hangUp.hangUpTime;

    const elapsed = now - hangUp.value.lastTime;
    if (elapsed <= hangUp.value.hangUpTime) {
      // 确保剩余时间为整数秒
      hangUp.value.remainingTime = Math.floor(
        hangUp.value.hangUpTime - elapsed,
      );
      hangUp.value.isActive = true;
    } else {
      hangUp.value.remainingTime = 0;
      hangUp.value.isActive = false;
    }
    // 确保已挂机时间为整数秒
    hangUp.value.elapsedTime = Math.floor(
      hangUp.value.hangUpTime - hangUp.value.remainingTime,
    );
    // 控制台精简
  }

  // 更新俱乐部排位状态
  if (role.statistics) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime() / 1000;

    legionMatch.value.isRegistered =
      Number(role.statistics["last:legion:match:sign:up:time"]) >
      todayTimestamp;
  }

  // 更新俱乐部签到状态
  if (role.statisticsTime) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime() / 1000;

    legionSignin.value.isSignedIn =
      role.statisticsTime["legion:sign:in"] > todayTimestamp;
  }
};

// 定时器更新
let timer = null;
const startTimer = () => {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    // 更新盐罐机器人剩余时间
    if (bottleHelper.value.isRunning && bottleHelper.value.remainingTime > 0) {
      bottleHelper.value.remainingTime = Math.max(
        0,
        bottleHelper.value.remainingTime - 1,
      );
      if (bottleHelper.value.remainingTime <= 0) {
        bottleHelper.value.isRunning = false;
      }
    }

    // 更新挂机剩余时间
    if (hangUp.value.isActive && hangUp.value.remainingTime > 0) {
      hangUp.value.remainingTime = Math.max(0, hangUp.value.remainingTime - 1);
      hangUp.value.elapsedTime = hangUp.value.elapsedTime + 1;
      if (hangUp.value.remainingTime <= 0) {
        hangUp.value.isActive = false;
      }
    }
  }, 1000);
};

// 盐罐机器人操作

// 挂机操作 - 参考HangUpStatus逻辑优化

// 功能开关：暂时隐藏俱乐部排位与旧签到卡片
const ENABLE_LEGION_MATCH = false;
const ENABLE_LEGION_SIGNIN_CARD = false;
const ENABLE_TOOLS_TAB = true; // 工具分区开关

// 盐场战绩入口已移动至俱乐部信息模块

// 学习答题逻辑已移动到 StudyChallengeCard 组件

// 监听角色信息变化
watch(
  roleInfo,
  (newValue) => {
    if (newValue) {
      updateGameStatus();
    }
  },
  { deep: true, immediate: true },
);

// 监听 WebSocket 连接状态（俱乐部信息）
const hasFetchedLegionOnce = ref(false);
watch(
  () =>
    tokenStore.selectedToken
      ? tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
      : "disconnected",
  (status) => {
    if (status === "connected") {
      if (!hasFetchedLegionOnce.value && tokenStore.selectedToken) {
        hasFetchedLegionOnce.value = true;
        const tokenId = tokenStore.selectedToken.id;
        tokenStore.sendMessage(tokenId, "legion_getinfo");
      }
    }
  },
);

// 战绩加载逻辑现由俱乐部信息模块负责

// 生命周期
onMounted(() => {
  updateGameStatus();
  startTimer();
  // 获取俱乐部信息
  if (
    tokenStore.selectedToken &&
    tokenStore.getWebSocketStatus(tokenStore.selectedToken.id) === "connected"
  ) {
    const tokenId = tokenStore.selectedToken.id;
    tokenStore.sendMessage(tokenId, "legion_getinfo");
    hasFetchedLegionOnce.value = true;
  }
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped lang="scss">
.game-status-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);

  // 在大屏幕上限制最大列数以确保卡片有足够宽度
  @media (min-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1400px;
    margin: 0 auto;
  }

  // 在中等屏幕上确保有足够空间
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  // 在较小屏幕上使用单列布局
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    padding: var(--spacing-sm);
    gap: var(--spacing-md);
  }
}

.full-grid {
  grid-template-columns: repeat(1, 1fr);
}

.game-status-container.full-page-mode {
  max-width: 100% !important;
  grid-template-columns: 1fr;
  padding: var(--spacing-sm);

  @media (min-width: 1400px) {
    max-width: 100% !important;
  }
}

.game-status-container.club-mode {
  @media (min-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 100% !important;
  }
}

.section-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px var(--spacing-sm);
}

.identity-toggle {
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  border-radius: 999px;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.section-tabs {
  margin: 0 var(--spacing-sm) var(--spacing-md) var(--spacing-sm);
  grid-column: 1 / -1;
  border-bottom: 1px solid var(--border-light);
  overflow: auto;
}

.section-tabs :deep(.n-tabs-pane-wrapper) {
  display: none;
}

.warrank-full-container {
  grid-column: 1 / -1;
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 600px;
  overflow: hidden;

  @media (max-width: 768px) {
    height: calc(100vh - 180px);
    min-height: 500px;
  }
}

/* 样式二（移植版）容器尺寸，不影响样式一 */
.warrank-full-container.style2-container {
  position: relative;
  z-index: 1;
  height: calc(100vh - 180px);
  min-height: 700px;

  @media (max-width: 768px) {
    height: calc(100vh - 180px);
    min-height: 500px;
  }
}

.salt-field-group,
.peach-group,
.rank-group {
  grid-column: 1 / -1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.monthly-tasks .description.muted {
  color: var(--text-tertiary);
  margin-top: var(--spacing-sm);
}

.monthly-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.status-dot {
  &.completed {
    background: var(--success-color);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
}

.energy-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.card-content {
  .time-display {
    font-size: 1.5rem;
    /* text-2xl */
    font-weight: 700;
    /* font-bold */
    color: var(--text-primary);
    text-align: center;
    margin-bottom: var(--spacing-md);
    font-family:
      "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Consolas", monospace;
    letter-spacing: 0.1em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    background: var(--bg-tertiary);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-light);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease-in-out;

    &:hover {
      transform: translateY(-1px);
      box-shadow:
        0 4px 6px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.06);
    }
  }

  .description {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    margin-bottom: var(--spacing-lg);
  }

  .club-name {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-lg);

    strong {
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }
  }

  .tower-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .tower-level {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }
  }
}

.action-row {
  display: flex;
  gap: var(--spacing-sm);

  .action-button {
    flex: 1;
  }
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .game-status-container {
    grid-template-columns: 1fr;
    padding: var(--spacing-sm);
  }

  .status-card {
    padding: var(--spacing-md);
  }

  .card-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);

    .status-info {
      flex: 1;
      min-width: 120px;
    }

    .status-badge {
      margin-left: auto;
    }
  }
}
</style>
