<template>
  <div class="club-warrank-container">
    <div class="club-warrank-card">
      <!-- 头部信息区 -->
      <div class="header-section">
        <div class="header-left">
          <img
            src="/icons/moonPalace.png"
            alt="俱乐部图标"
            class="header-icon"
          />
          <div class="header-title">
            <h2>盐场匹配信息详情</h2>
            <p>俱乐部盐场匹配详情</p>
          </div>
        </div>

        <!-- 数据统计区 -->
        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-label">查询日期:</span>
            <div class="stat-date-dropdown">
              <n-tag
                type="info"
                class="stat-date-tag"
                @click="toggleStatCalendar"
              >
                {{ formatTimestamp1(inputDate1) }}
              </n-tag>
              <div v-if="statCalendarOpen" class="stat-calendar-panel">
                <div class="stat-calendar-header">
                  <button type="button" @click="changeStatCalendarMonth(-1)">
                    &lt;
                  </button>
                  <span>{{ statCalendarTitle }}</span>
                  <button type="button" @click="changeStatCalendarMonth(1)">
                    &gt;
                  </button>
                </div>
                <div class="stat-calendar-weekdays">
                  <span v-for="day in statCalendarWeekdays" :key="day">{{
                    day
                  }}</span>
                </div>
                <div class="stat-calendar-grid">
                  <button
                    v-for="day in statCalendarDays"
                    :key="day.key"
                    type="button"
                    :class="{
                      selected: day.value === inputDate1,
                      disabled: day.disabled,
                      outside: day.outside,
                    }"
                    :disabled="day.disabled"
                    @click="selectStatCalendarDate(day.value)"
                  >
                    {{ day.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">总俱乐部数:</span>
            <n-tag type="success">{{
              battleRecords1?.legionRankList?.length || 0
            }}</n-tag>
          </div>
        </div>
      </div>

      <!-- 功能操作区 -->
      <div class="function-section">
        <div class="function-left">
          <div class="export-options">
            <NCheckboxGroup
              v-model:value="exportmethod"
              name="group-exportmethod"
              size="small"
            >
              <NCheckbox value="1">表格导出</NCheckbox>
              <NCheckbox value="2">图片导出</NCheckbox>
            </NCheckboxGroup>
          </div>
        </div>

        <div class="function-right">
          <a-date-picker
            v-model:value="inputDate1"
            :default-value="inputDate1"
            value-format="YYYY/MM/DD"
            format="YYYY/MM/DD"
            :allow-clear="false"
            :disabled-date="disabledDate"
            @change="fetchBattleRecordsByDate"
          />
          <n-button
            size="small"
            :disabled="loading1"
            @click="handleRefresh1"
            class="action-btn refresh-btn"
          >
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon> </template
            >刷新</n-button
          >
          <n-button
            type="primary"
            size="small"
            :disabled="!battleRecords1 || loading1"
            @click="handleExport1"
            class="action-btn export-btn"
          >
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon> </template
            >导出</n-button
          >
          <n-button
            :type="isEditMode ? 'warning' : 'default'"
            size="small"
            :disabled="!battleRecords1 || loading1"
            @click="toggleEditMode"
            class="action-btn edit-btn"
          >
            <template #icon>
              <n-icon>
                <CreateOutline />
              </n-icon>
            </template>
            {{ isEditMode ? "退出编辑" : "调整排名" }}
          </n-button>
          <n-button
            type="info"
            size="small"
            :disabled="!battleRecords1 || loading1"
            @click="hcSort"
            class="action-btn sort-btn"
          >
            红淬排序</n-button
          >
          <n-button
            type="info"
            size="small"
            :disabled="!battleRecords1 || loading1"
            @click="scoreSort"
            class="action-btn sort-btn"
            v-if="ScoreShow === 1"
          >
            积分排序</n-button
          >
        </div>
      </div>

      <!-- 表格内容区 -->
      <div ref="exportDom" class="table-content">
        <!-- 公告区域 -->
        <div
          v-if="battleRecords1 && battleRecords1.legionRankList"
          class="announcement-section"
        >
          <div class="announcement-content">
            <span class="announcement-text">
              {{ saltAnnouncementText }}
            </span>
            <span class="announcement-fetch-time">
              {{ saltFetchTimeText }}
            </span>
          </div>
        </div>

        <!-- 联盟分类标签栏 -->
        <div
          v-if="battleRecords1 && battleRecords1.legionRankList"
          class="alliance-tabs-section"
        >
          <div
            class="alliance-tab alliance-dalianmeng"
            :class="{ active: activeAlliance === '大联盟' }"
            @click="setActiveAlliance('大联盟')"
          >
            <span class="tab-text">大联盟</span>
            <span class="tab-count">{{
              getActiveAllianceCount("大联盟")
            }}</span>
          </div>
          <div
            class="alliance-tab alliance-mengmeng"
            :class="{ active: activeAlliance === '梦盟' }"
            @click="setActiveAlliance('梦盟')"
          >
            <span class="tab-text">梦盟</span>
            <span class="tab-count">{{ getActiveAllianceCount("梦盟") }}</span>
          </div>
          <div
            class="alliance-tab alliance-zhengyi"
            :class="{ active: activeAlliance === '正义联盟' }"
            @click="setActiveAlliance('正义联盟')"
          >
            <span class="tab-text">正义联盟</span>
            <span class="tab-count">{{
              getActiveAllianceCount("正义联盟")
            }}</span>
          </div>
          <div
            class="alliance-tab alliance-longmeng"
            :class="{ active: activeAlliance === '龙盟' }"
            @click="setActiveAlliance('龙盟')"
          >
            <span class="tab-text">龙盟</span>
            <span class="tab-count">{{ getActiveAllianceCount("龙盟") }}</span>
          </div>
          <div
            class="alliance-tab alliance-ximeng"
            :class="{ active: activeAlliance === '曦盟' }"
            @click="setActiveAlliance('曦盟')"
          >
            <span class="tab-text">曦盟</span>
            <span class="tab-count">{{ getActiveAllianceCount("曦盟") }}</span>
          </div>
          <div
            class="alliance-tab alliance-unknown"
            :class="{ active: activeAlliance === '未知联盟' }"
            @click="setActiveAlliance('未知联盟')"
          >
            <span class="tab-text">未知联盟</span>
            <span class="tab-count">{{
              getActiveAllianceCount("未知联盟")
            }}</span>
          </div>
          <div
            class="alliance-tab alliance-all"
            :class="{ active: activeAlliance === 'all' }"
            @click="setActiveAlliance('all')"
          >
            <span class="tab-text">全部</span>
            <span class="tab-count">{{
              battleRecords1.legionRankList.length
            }}</span>
          </div>
        </div>
        <!-- 加载状态 -->
        <div v-if="loading1" class="loading-state">
          <n-spin size="large">
            <template #description> 正在加载盐场匹配数据... </template>
          </n-spin>
        </div>

        <!-- 匹配列表 -->
        <div
          v-else-if="battleRecords1 && battleRecords1.legionRankList"
          class="table-container"
        >
          <n-data-table
            :columns="saltTableColumns"
            :data="groupedSaltTableData"
            :bordered="true"
            class="salt-table"
            :row-class-name="getSaltTableRowClassName"
            size="small"
            :scroll-x="1380"
          />
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading1" class="empty-state">
          <n-empty description="暂无盐场匹配数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </div>

    <!-- 玩家信息模态框 -->
    <NModal
      v-model:show="showPlayerInfoModal"
      preset="card"
      title="对手信息"
      :style="{ width: '800px' }"
      :bordered="false"
      :segmented="{ content: 'soft', footer: 'soft' }"
      :show-close="false"
    >
      <template #header-extra>
        <span v-if="playerInfo" class="player-id">ID: {{ playerInfo.id }}</span>
      </template>

      <div v-if="playerInfo" class="player-info-content">
        <div class="player-info-main">
          <NAvatar
            round
            :size="60"
            :src="playerInfo.headImg"
            class="player-avatar"
          />
          <div class="player-info-detail">
            <h3>
              {{ playerInfo.name }}
              <n-tag
                v-if="playerInfo.legacy > 0"
                :style="{
                  color: '#fff',
                  backgroundColor: legacycolor[playerInfo.legacy]?.value,
                }"
                size="small"
                style="margin-left: 8px"
              >
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
              <label for="fightCount" class="fight-count-label"
                >切磋次数:</label
              >
              <NInput
                id="fightCount"
                v-model:value="fightCount"
                type="number"
                placeholder="请输入切磋次数"
                min="1"
                max="100"
                :step="1"
                class="fight-count-input"
                size="small"
                @input="validateFightCount"
              />
              <div class="fight-count-hint">范围: 1-100</div>
            </div>
            <n-button
              type="tertiary"
              @click="showPlayerInfoModal = false"
              size="small"
              style="margin-right: 8px"
            >
              关闭
            </n-button>
          </div>
          <n-button
            type="primary"
            @click="handleDuel"
            :disabled="!isFightCountValid"
          >
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
          <n-progress
            type="line"
            :percentage="fightProgress.percentage"
            :show-indicator="false"
            :stroke-width="8"
            status="processing"
          />
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
                <span class="summary-value"
                  >{{
                    (
                      (fightResult.winCount / fightResult.totalCount) *
                      100
                    ).toFixed(2)
                  }}%</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">我方掉将率：</span>
                <span class="summary-value"
                  >{{
                    (
                      (dieStats.ourDieHeroGameCount / fightResult.totalCount) *
                      100
                    ).toFixed(2)
                  }}%</span
                >
              </div>
              <div class="summary-item">
                <span class="summary-label">敌方掉将率：</span>
                <span class="summary-value"
                  >{{
                    (
                      (dieStats.enemyDieHeroGameCount /
                        fightResult.totalCount) *
                      100
                    ).toFixed(2)
                  }}%</span
                >
              </div>
            </div>
          </div>

          <!-- 战斗结果列表 -->
          <div class="result-list">
            <div
              v-for="(battle, battleIndex) in fightResult.resultCount"
              :key="battleIndex"
              class="battle-result-item"
              :class="[battle.isWin ? 'win' : 'loss']"
            >
              <div class="battle-header">
                <span class="battle-index">第 {{ battleIndex + 1 }} 场</span>
                <n-tag :type="battle.isWin ? 'success' : 'error'" size="small">
                  {{ battle.isWin ? "胜利" : "失败" }}
                </n-tag>
              </div>

              <div class="battle-details">
                <div class="battle-side left-side">
                  <NAvatar
                    round
                    :size="32"
                    :src="battle.leftheadImg"
                    class="side-avatar"
                  />
                  <div class="side-info">
                    <span class="side-name">{{
                      battle.leftName || "未知"
                    }}</span>
                    <span class="side-power">战力: {{ battle.leftpower }}</span>
                    <span class="side-die"
                      >掉将: {{ battle.leftDieHero }} 个</span
                    >
                  </div>
                </div>

                <div class="battle-vs">VS</div>

                <div class="battle-side right-side">
                  <NAvatar
                    round
                    :size="32"
                    :src="battle.rightheadImg"
                    class="side-avatar"
                  />
                  <div class="side-info">
                    <span class="side-name">{{
                      battle.rightName || "未知"
                    }}</span>
                    <span class="side-power"
                      >战力: {{ battle.rightpower }}</span
                    >
                    <span class="side-die"
                      >掉将: {{ battle.rightDieHero }} 个</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <n-button type="primary" @click="resetFightResult"
              >重新切磋</n-button
            >
            <n-button @click="fightResult.visible = false">关闭结果</n-button>
          </div>
        </div>

        <div class="player-heroes">
          <h4>武将阵容</h4>
          <!-- 添加调试信息 -->
          <div
            v-if="playerInfo.heroList"
            class="debug-info"
            style="font-size: 12px; color: #999; margin-bottom: 10px"
          >
            武将数量: {{ playerInfo.heroList.length }}
          </div>
          <div
            class="hero-list"
            v-if="playerInfo.heroList && playerInfo.heroList.length > 0"
          >
            <div
              v-for="(hero, heroIndex) in playerInfo.heroList"
              :key="hero.heroId || heroIndex"
              class="hero-item"
              @click="selectHeroInfo(hero)"
            >
              <NAvatar
                round
                :size="40"
                :src="hero.heroAvate"
                style="cursor: pointer"
              />
              <div class="hero-info">
                <span class="hero-name">{{ hero.heroName }}</span>
                <div class="hero-stats">
                  <span>战力: {{ formatPower(hero.power || 0) }}</span>
                  <span>星级: {{ hero.star || 0 }}</span>
                  <span>红数: {{ hero.red || 0 }}</span>
                  <span>开�? {{ hero.hole || 0 }}</span>
                  <span :class="hero.HolyBeast ? 'opened' : 'closed'">
                    {{ hero.HolyBeast ? "已开四圣" : "未开四圣" }}
                  </span>
                  <span v-if="hero.HolyBeast"
                    >四圣等级: {{ hero.HBlevel || 0 }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-heroes">
            <p>未查询到武将信息</p>
            <!-- 添加调试信息 -->
            <div
              v-if="playerInfo.heroList"
              style="font-size: 12px; color: #999; margin-top: 10px"
            >
              武将列表为空
            </div>
            <div v-else style="font-size: 12px; color: #999; margin-top: 10px">
              武将列表未定�?
            </div>
          </div>
        </div>
      </div>
    </NModal>

    <!-- 武将详情模态框 -->
    <NModal
      v-model:show="showHeroModal"
      class="hero-detail-modal"
      preset="card"
      title="武将信息"
      size="large"
      :bordered="false"
      :segmented="{ content: 'soft', footer: 'soft' }"
      :style="{ width: '600px' }"
      :show-close="true"
    >
      <template #header-extra>
        <span class="hero-id">武将ID: {{ heroModealTemp?.heroId }}</span>
      </template>

      <div v-if="heroModealTemp" class="hero-modal-content">
        <div class="hero-modal-header">
          <div class="hero-modal-avatar">
            <img
              v-if="heroModealTemp.heroAvate"
              :src="heroModealTemp.heroAvate"
              :alt="heroModealTemp.heroName"
            />
            <div v-else class="hero-placeholder">
              {{ heroModealTemp.heroName?.substring(0, 2) || "?" }}
            </div>
          </div>
          <div class="hero-modal-basic">
            <h3 class="hero-modal-name">{{ heroModealTemp.heroName }}</h3>
            <div class="hero-modal-stats">
              <span class="stat-item">{{
                formatPower(heroModealTemp.power)
              }}</span>
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
            <n-descriptions-item
              label="四圣等级"
              v-if="heroModealTemp.HolyBeast"
            >
              {{ heroModealTemp.HBlevel }}
            </n-descriptions-item>
            <n-descriptions-item label="鱼灵">
              {{
                !isSameGameValue(
                  heroModealTemp?.PearlInfo?.FishInfo?.name,
                  undefined,
                )
                  ? heroModealTemp.PearlInfo?.FishInfo?.name
                  : "无"
              }}
            </n-descriptions-item>
            <n-descriptions-item label="鱼珠技能">
              {{
                !isSameGameValue(
                  heroModealTemp?.PearlInfo?.PearlSkill?.name,
                  undefined,
                )
                  ? heroModealTemp.PearlInfo?.PearlSkill?.name
                  : "无"
              }}
            </n-descriptions-item>
            <n-descriptions-item label="鱼灵洗练">
              <div v-if="heroModealTemp?.PearlInfo?.slotMap?.length > 0">
                <div
                  v-for="item in heroModealTemp.PearlInfo.slotMap"
                  :key="item.id"
                  class="ModalEquipment"
                  :style="`background-color:${item.value}`"
                ></div>
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
                <div
                  v-for="(item, idx) in Object.values(
                    Object.values(heroModealTemp.equipment)[0]?.quenches || {},
                  )"
                  :key="idx"
                  class="equipment-slot"
                  :class="{ 'red-slot': item.colorId === 6 }"
                ></div>
              </div>
            </div>
            <div class="equipment-item">
              <span class="equipment-label">衣服:</span>
              <div class="equipment-slots">
                <div
                  v-for="(item, idx) in Object.values(
                    Object.values(heroModealTemp.equipment)[1]?.quenches || {},
                  )"
                  :key="idx"
                  class="equipment-slot"
                  :class="{ 'red-slot': item.colorId === 6 }"
                ></div>
              </div>
            </div>
            <div class="equipment-item">
              <span class="equipment-label">头盔:</span>
              <div class="equipment-slots">
                <div
                  v-for="(item, idx) in Object.values(
                    Object.values(heroModealTemp.equipment)[2]?.quenches || {},
                  )"
                  :key="idx"
                  class="equipment-slot"
                  :class="{ 'red-slot': item.colorId === 6 }"
                ></div>
              </div>
            </div>
            <div class="equipment-item">
              <span class="equipment-label">坐骑:</span>
              <div class="equipment-slots">
                <div
                  v-for="(item, idx) in Object.values(
                    Object.values(heroModealTemp.equipment)[3]?.quenches || {},
                  )"
                  :key="idx"
                  class="equipment-slot"
                  :class="{ 'red-slot': item.colorId === 6 }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <n-button @click="showHeroModal = false">关闭</n-button>
      </template>
    </NModal>
  </div>
</template>

<script setup>
import { Copy, CreateOutline, DocumentText, Refresh } from "@vicons/ionicons5";

import html2canvas from "html2canvas";
import {
  NAvatar,
  NCheckbox,
  NCheckboxGroup,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  useMessage,
} from "naive-ui";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { formatTimestamp1, getLastSaturday } from "@/utils/clubBattleUtils";
import {
  allianceincludes,
  formatWarrankRecordsForExport,
  gettoday,
} from "@/utils/clubWarrankUtils";
import { isSameGameValue } from "@/utils/gameValue.js";
import {
  getLineupType,
  HERO_DICT,
  HeroFillInfo,
  legacycolor,
  LINEUP_RULES,
} from "@/utils/HeroList";
import { downloadCanvasAsImage } from "@/utils/imageExport";
import { formatPower } from "@/utils/legionWar";

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
});

const ScoreShow = ref(1);

const exportmethod = ref(["2"]);
const exportDom = ref(null);
const message = useMessage();
const tokenStore = useTokenStore();
const selectedTokenId = computed(() => tokenStore.selectedToken?.id || "");
const currentClubInfo = ref(null);
const currentLegionInfo = computed(() => currentClubInfo.value?.info || null);

const loading1 = ref(false);
const battleRecords1 = ref(null);
const expandedMembers = ref(new Set());
const queryDate = ref("");
const inputDate1 = ref(getLastSaturday());
const saltFetchStartTime = ref(null);
const statCalendarOpen = ref(false);
const statCalendarMonth = ref(inputDate1.value.slice(0, 7));
const statCalendarWeekdays = ["日", "一", "二", "三", "四", "五", "六"];

// 新增联盟筛选功�?
const activeAlliance = ref("all");
// 排序模式：manual-手动/默认，redQuench-红淬，score-积分
const currentSortType = ref("manual");

// 手动调整功能
const isEditMode = ref(false);
const manualRankings = ref({});
const manualAlliances = ref({});
const editingSortOrder = ref([]); // 编辑模式下的固定排序顺序
const tempOldRanks = ref({}); // 暂存编辑前的排名

const allianceOptions = [
  { label: "大联盟", value: "大联盟" },
  { label: "梦盟", value: "梦盟" },
  { label: "正义联盟", value: "正义联盟" },
  { label: "龙盟", value: "龙盟" },
  { label: "曦盟", value: "曦盟" },
  { label: "未知联盟", value: "未知联盟" },
];

const toggleEditMode = () => {
  if (!isEditMode.value) {
    // 进入编辑模式
    if (battleRecords1.value?.legionRankList) {
      // 1. 初始化手动数据（如果未初始化�?
      battleRecords1.value.legionRankList.forEach((member) => {
        if (manualRankings.value[member.id] === undefined) {
          manualRankings.value[member.id] = redQuenchRankings.value[member.id];
        }
        if (manualAlliances.value[member.id] === undefined) {
          manualAlliances.value[member.id] =
            allianceincludes(member.announcement) || "未知联盟";
        }
      });

      // 2. 锁定当前排序顺序
      // 获取当前完整列表并按当前规则排序
      const currentList = [...battleRecords1.value.legionRankList].sort(
        (a, b) => {
          if (currentSortType.value === "manual") {
            return getMemberRank(a) - getMemberRank(b);
          } else if (currentSortType.value === "redQuench") {
            return (b.redQuench || 0) - (a.redQuench || 0);
          } else if (currentSortType.value === "score") {
            return (b.sRScore || 0) - (a.sRScore || 0);
          }
          return 0;
        },
      );
      // 保存 ID 顺序
      editingSortOrder.value = currentList.map((m) => m.id);
    }
  } else {
    // 退出编辑模�?
    // 可以在这里执行额外的清理或确认逻辑
    message.success("已保存调整");
    // 强制刷新列表排序（通过 filteredLegionList 的响应式依赖�?
  }
  isEditMode.value = !isEditMode.value;
};

const handleRankFocus = (member) => {
  tempOldRanks.value[member.id] = manualRankings.value[member.id];
};

const handleRankBlur = (member) => {
  const newRank = manualRankings.value[member.id];
  const oldRank = tempOldRanks.value[member.id];

  // 清理暂存
  delete tempOldRanks.value[member.id];

  // 验证有效性，如果无效则恢�?
  if (!newRank || newRank < 1 || newRank > 20) {
    manualRankings.value[member.id] = oldRank;
    if (newRank !== null && newRank !== undefined) {
      // 只有当用户输入了无效值时才提示，清空不提示（虽然 NInputNumber min=1 通常不会清空�?
      message.warning("排名必须在 1-20 之间");
    }
    return;
  }

  if (newRank === oldRank) return;

  // 查找占用新排名的俱乐�?
  const targetMemberId = Object.keys(manualRankings.value).find(
    (id) =>
      String(id) !== String(member.id) && manualRankings.value[id] === newRank,
  );

  if (targetMemberId) {
    // 交换排名: 把占用者的排名设为我的旧排�?
    manualRankings.value[targetMemberId] = oldRank;
    const targetName = getMemberName(targetMemberId);
    message.success(`排名已交换：${member.name} 与 ${targetName}`);
  }

  // 只要手动调整了排名，就切换回 manual 排序模式
  currentSortType.value = "manual";
};

// 获取成员名称辅助函数
const getMemberName = (id) => {
  const member = battleRecords1.value?.legionRankList.find(
    (m) => String(m.id) === String(id),
  );
  return member ? member.name : "未知俱乐部";
};

const getMemberAlliance = (member) => {
  if (manualAlliances.value[member.id] !== undefined) {
    return manualAlliances.value[member.id];
  }
  return allianceincludes(member.announcement) || "未知联盟";
};

const getSaltTableRowClassName = (row) => {
  if (row.__isFetchTimeFooter) {
    return "salt-fetch-time-footer-row";
  }
  if (row.__isGroupHeader) {
    const index = allianceOptions.findIndex(
      (option) => option.value === row.alliance,
    );
    return `salt-alliance-group-row salt-alliance-group-row-${index === -1 ? 5 : index}`;
  }
  const alliance = getMemberAlliance(row);
  const index = allianceOptions.findIndex(
    (option) => option.value === alliance,
  );
  return `salt-alliance-row salt-alliance-row-${index === -1 ? 5 : index}`;
};

const getMemberRank = (member) => {
  if (manualRankings.value[member.id] !== undefined) {
    return manualRankings.value[member.id];
  }
  return redQuenchRankings.value[member.id];
};

// 新增查询对手相关状�?
const queryLoading = ref(false);
const queryTargetId = ref("");
// 玩家信息模态框状�?
const showPlayerInfoModal = ref(false);
const playerInfo = ref(null);

// 新增切磋次数相关状�?
const fightCount = ref(1);
const isFightCountValid = ref(true);

// 切磋进度状�?
const fightProgress = reactive({
  visible: false,
  totalCount: 0,
  completedCount: 0,
  remainingCount: 0,
  winCount: 0,
  lossCount: 0,
  percentage: 0,
});

// 最终结果状�?
const fightResult = reactive({
  visible: false,
  totalCount: 0,
  winCount: 0,
  lossCount: 0,
  winRate: 0,
  ourDieRate: 0,
  enemyDieRate: 0,
  resultCount: [], // 存储每场战斗的详细结�?
});

// 切磋历史记录
const fightHistory = ref([]);

// 掉将统计
const dieStats = reactive({
  ourDieHeroGameCount: 0,
  enemyDieHeroGameCount: 0,
});

// 武将详情模态框状�?
const showHeroModal = ref(false);
// 选中的武将信�?
const heroModealTemp = ref(null);

// 选择武将信息，显示详情模态框
const selectHeroInfo = (heroInfo) => {
  showHeroModal.value = true;
  heroModealTemp.value = heroInfo;
};

// 获取装备信息红数和孔�?
const getEquipment = (equipment) => {
  let redCount = 0;
  let holeCount = 0;
  //遍历4件装�?
  Object.values(equipment).forEach((equ) => {
    //遍历每件装备的属�?
    Object.values(equ.quenches).forEach((item) => {
      holeCount++;
      if (isSameGameValue(item.colorId, 6)) {
        redCount++;
      }
    });
  });
  return { redCount, holeCount };
};

// 盐场表格列定义
const getMergedTableRowColSpan = (row) =>
  row.__isGroupHeader || row.__isFetchTimeFooter ? 9 : 1;
const getHiddenMergedTableCellColSpan = (row) =>
  row.__isGroupHeader || row.__isFetchTimeFooter ? 0 : 1;
const formatDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${[
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-")} ${[
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":")}`;
};
const getSaltFetchTimeText = () => {
  const fetchTime = saltFetchStartTime.value || new Date();
  return `数据获取时间：${formatDateTime(fetchTime)}`;
};

const parseDateText = (value) => {
  const [year, month, day] = String(value || getLastSaturday())
    .split("/")
    .map(Number);
  return new Date(year, month - 1, day || 1);
};

const formatDateForPicker = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
};

const statCalendarTitle = computed(() => {
  const [year, month] = statCalendarMonth.value.split("/");
  return `${year}年${month}月`;
});

const statCalendarDays = computed(() => {
  const [year, month] = statCalendarMonth.value.split("/").map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const day = date.getDay();
    const value = formatDateForPicker(date);
    return {
      key: `${value}-${index}`,
      label: date.getDate(),
      value,
      disabled: day !== 0 && day !== 6,
      outside: date.getMonth() !== month - 1,
    };
  });
});

const fetchCurrentClubInfo = async (tokenId = selectedTokenId.value) => {
  if (!tokenId) return null;

  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") return null;

  try {
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfo",
      {},
      10000,
    );

    if (selectedTokenId.value === tokenId && result) {
      currentClubInfo.value = result;
    }
    return result;
  } catch (error) {
    if (selectedTokenId.value === tokenId) {
      console.error("查询俱乐部信息失败:", error);
    }
    return null;
  }
};

const isCurrentAccountClub = (row) => {
  if (!row || row.__isGroupHeader || row.__isFetchTimeFooter) return false;

  const clubInfo = currentLegionInfo.value;
  if (!clubInfo) return false;

  const currentId = clubInfo.id ?? clubInfo.legionId;
  const rowId = row.id ?? row.legionId;
  if (
    !isSameGameValue(currentId, null) &&
    !isSameGameValue(rowId, null) &&
    String(currentId) === String(rowId)
  ) {
    return true;
  }

  return Boolean(clubInfo.name && row.name && clubInfo.name === row.name);
};

const saltTableColumns = [
  {
    title: "红淬排名",
    key: "rank",
    width: 72,
    align: "center",
    colSpan: getMergedTableRowColSpan,
    render: (row) => {
      if (row.__isGroupHeader) {
        const redQuenchLabel = row.count > 1 ? "平均红淬" : "红淬";
        return h("div", { class: "salt-alliance-group-title" }, [
          h("span", { class: "salt-alliance-group-line" }, "|"),
          h(
            "span",
            { class: "salt-alliance-group-label" },
            `${row.alliance}（${row.count}家） ${redQuenchLabel} ${row.avgRedQuench}红`,
          ),
        ]);
      }
      if (row.__isFetchTimeFooter) {
        return h("div", { class: "salt-fetch-time-footer" }, row.fetchTimeText);
      }
      if (isEditMode.value) {
        return h(NInputNumber, {
          "v-model:value": manualRankings.value[row.id],
          size: "small",
          min: 1,
          max: 20,
          style: { width: "70px" },
          showButton: false,
          onFocus: () => handleRankFocus(row),
          onBlur: () => handleRankBlur(row),
          onKeydownenter: (e) => e.target.blur(),
        });
      }
      const rank = getMemberRank(row);
      return h("span", { class: "rank-badge" }, rank);
    },
  },
  {
    title: "俱乐部名称",
    key: "name",
    width: 180,
    colSpan: getHiddenMergedTableCellColSpan,
    render: (row) => {
      if (row.__isGroupHeader || row.__isFetchTimeFooter) return null;
      const isCurrentClub = isCurrentAccountClub(row);
      return h(
        "div",
        {
          class: [
            "salt-club-name-cell",
            isCurrentClub ? "is-current-club" : "",
          ],
        },
        [
          h("div", { class: "salt-club-main-row" }, [
            row.logo
              ? h("img", {
                  src: row.logo,
                  alt: row.name,
                  style: {
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                  },
                })
              : h(
                  "div",
                  {
                    style: {
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "white",
                      background:
                        "linear-gradient(135deg, #1677ff 0%, #4096ff 100%)",
                      border: "2px solid #e5e7eb",
                    },
                  },
                  row.name?.charAt(0) || "?",
                ),
            h("span", { class: "salt-club-name-text" }, row.name),
          ]),
          isCurrentClub
            ? h("div", { class: "current-club-badge-row" }, [
                h("span", { class: "current-club-badge" }, "本俱乐部"),
              ])
            : null,
        ],
      );
    },
  },
  {
    title: "服务器",
    key: "serverId",
    width: 56,
    align: "center",
    colSpan: getHiddenMergedTableCellColSpan,
  },
  {
    title: "战力",
    key: "power",
    width: 80,
    align: "center",
    colSpan: getHiddenMergedTableCellColSpan,
    render: (row) =>
      row.__isGroupHeader || row.__isFetchTimeFooter
        ? null
        : formatPower(row.power) || 0,
  },
  {
    title: "红淬",
    key: "redQuench",
    width: 52,
    align: "center",
    colSpan: getHiddenMergedTableCellColSpan,
  },
  {
    title: "联盟",
    key: "alliance",
    width: 72,
    align: "center",
    colSpan: getHiddenMergedTableCellColSpan,
    render: (row) => {
      if (row.__isGroupHeader || row.__isFetchTimeFooter) return null;
      if (isEditMode.value) {
        return h(NSelect, {
          "v-model:value": manualAlliances.value[row.id],
          options: allianceOptions.value,
          size: "small",
          style: { width: "90px" },
        });
      }
      const alliance = getMemberAlliance(row);
      return h(
        "span",
        { class: ["salt-alliance-tag", getAllianceTagClass(alliance)] },
        alliance,
      );
    },
  },
  {
    title: "前三车头",
    key: "topHeroes",
    width: 528,
    colSpan: getHiddenMergedTableCellColSpan,
    render: (row) => {
      if (row.__isGroupHeader || row.__isFetchTimeFooter) return null;
      return h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            gap: "9px",
            justifyContent: "center",
            alignItems: "flex-start",
            width: "calc(100% + 8px)",
            minWidth: "528px",
            margin: "0 -4px",
          },
        },
        row.topHeroes.map((hero) =>
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "6px",
                width: "170px",
                padding: "5px 5px 5px 5px",
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                flexShrink: "0",
              },
            },
            [
              h(
                "div",
                {
                  style: {
                    width: "36px",
                    height: "36px",
                    minWidth: "36px",
                    minHeight: "36px",
                    flexShrink: "0",
                    cursor: "pointer",
                  },
                  onClick: () => handleHeroClick(hero),
                },
                [
                  hero.headImg
                    ? h("img", {
                        src: hero.headImg,
                        alt: hero.name,
                        style: {
                          width: "36px",
                          height: "36px",
                          minWidth: "36px",
                          minHeight: "36px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #e5e7eb",
                          display: "block",
                          flexShrink: "0",
                        },
                      })
                    : h(
                        "div",
                        {
                          style: {
                            width: "36px",
                            height: "36px",
                            minWidth: "36px",
                            minHeight: "36px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "white",
                            background:
                              "linear-gradient(135deg, #1677ff 0%, #4096ff 100%)",
                            border: "2px solid #e5e7eb",
                            flexShrink: "0",
                          },
                        },
                        hero.name?.charAt(0) || "?",
                      ),
                ],
              ),
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    flex: "1 1 auto",
                    minWidth: "0",
                  },
                },
                [
                  h(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        width: "100%",
                        minWidth: "0",
                        whiteSpace: "nowrap",
                      },
                    },
                    [
                      h(
                        "span",
                        {
                          style: {
                            fontSize: "11px",
                            fontWeight: "500",
                            color: "#1f2937",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: "0",
                          },
                        },
                        hero.name || "未知",
                      ),
                      h(
                        "span",
                        {
                          style: {
                            fontSize: "9px",
                            color: "white",
                            background:
                              "linear-gradient(135deg, #ff6b6b, #ee5a24)",
                            padding: "1px 3px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            marginLeft: "auto",
                            flexShrink: "0",
                          },
                        },
                        `圣${hero.holyBeast}`,
                      ),
                    ],
                  ),
                  h(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        width: "100%",
                        minWidth: "0",
                        whiteSpace: "nowrap",
                      },
                    },
                    [
                      h(
                        "span",
                        {
                          style: {
                            fontSize: "11px",
                            color: "#6b7280",
                            whiteSpace: "nowrap",
                            minWidth: "50px",
                            flexShrink: "0",
                          },
                        },
                        formatPower(hero.power),
                      ),
                      h(
                        "span",
                        { style: getLineupTagStyle(hero.lineupType) },
                        hero.lineupType || "其他",
                      ),
                      h(
                        "span",
                        {
                          style: {
                            fontSize: "11px",
                            fontWeight: "500",
                            marginLeft: "auto",
                            flexShrink: "0",
                            color: "#ef4444",
                          },
                        },
                        `${hero.redQuench}红`,
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  },
  {
    title: "等级",
    key: "level",
    width: 40,
    align: "center",
    colSpan: getHiddenMergedTableCellColSpan,
  },
  {
    title: "公告",
    key: "announcement",
    width: 300,
    colSpan: getHiddenMergedTableCellColSpan,
  },
];

// 提取英雄信息
const getHeroInfo = (heroObj) => {
  //统计总红�?
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
      // 如果是对象，转换为数�?
      heroesToProcess = Object.values(heroObj);
    } else {
      console.error("英雄数据格式错误:", typeof heroObj);
      return { redCount, holeCount, heroList };
    }

    console.log("待处理的英雄数量:", heroesToProcess.length);

    heroesToProcess.forEach((hero, index) => {
      console.log(`处理第${index + 1} 个英雄`, hero);

      // 跳过无效英雄数据
      if (!hero) return;

      const heroInfo = HERO_DICT[hero.heroId] || {};
      const equipmentInfo = hero.equipment
        ? getEquipment(hero.equipment)
        : { redCount: 0, holeCount: 0 };

      // 检查英雄基本信�?
      const heroId = hero.heroId || `unknown_${index}`;
      const heroName = hero.heroName || heroInfo.name || `未知武将_${index}`;

      const tempObj = {
        heroId, //英雄ID
        artifactId: hero.artifactId || "", //英雄装备ID，用于匹配鱼灵信�?
        power: hero.power || 0, //英雄战力
        star: hero.star || 0, //英雄星级
        equipment: hero.equipment, //英雄具体孔数和红�?
        heroName, //英雄姓名
        heroAvate: hero.heroAvate || heroInfo.avatar || "",
        level: hero.level || 0, //英雄等级
        hole: equipmentInfo.holeCount, //英雄开孔数�?
        red: equipmentInfo.redCount, //英雄红数
        HolyBeast: hero.hB?.active === true, //激活四�?
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
        console.log(
          `添加英雄: ${tempObj.heroName}, 战力: ${tempObj.power}, 红数: ${tempObj.red}, 开孔数: ${tempObj.hole}`,
        );
      }
    });

    console.log("处理完成的英雄列表", heroList);
  } catch (error) {
    console.error("处理英雄信息时发生错误", error);
    heroList = [];
  }
  heroList.sort((a, b) => a.battleTeamSlot - b.battleTeamSlot);
  return { redCount, holeCount, heroList };
};

const getLineupTagStyle = (lineupType) => {
  const rule = LINEUP_RULES.find((item) => item.name === lineupType);
  const colorProps = rule?.colorProps || {
    color: "#f5f5f5",
    textColor: "#666",
  };

  return {
    maxWidth: "46px",
    padding: "1px 4px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: "600",
    lineHeight: "14px",
    color: colorProps.textColor,
    background: colorProps.color,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexShrink: "0",
  };
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

  // 重置之前的切磋结�?
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
        roleId,
        includeHero: true,
        includeHeroDetail: true,
        includePearl: true,
      },
      5000,
    );

    // 调试信息
    console.log("rank_getroleinfo API返回结果:", result);

    if (!result.roleInfo) {
      message.warning("未查询到对手信息");
      console.log("未查询到roleInfo");
      return;
    }

    // 构建玩家信息对象
    console.log("构建玩家信息 - result.roleInfo:", result.roleInfo);
    console.log(
      "构建玩家信息 - result.roleInfo.heroes:",
      result.roleInfo.heroes,
    );
    console.log("构建玩家信息 - result.legionInfo:", result.legionInfo);

    // 检查英雄数据类型和结构
    console.log("英雄数据类型:", typeof result.roleInfo.heroes);
    if (result.roleInfo.heroes) {
      console.log("英雄数据是否为数组", Array.isArray(result.roleInfo.heroes));
      console.log(
        "英雄数据是否为对象",
        typeof result.roleInfo.heroes === "object",
      );
      console.log("英雄数据键名:", Object.keys(result.roleInfo.heroes));
    }

    // 处理鱼灵信息
    const fishInfo = HeroFillInfo(result.roleInfo);
    console.log("处理后的鱼灵信息:", fishInfo);

    // 获取英雄信息
    let heroAndholdAndRed = { redCount: 0, holeCount: 0, heroList: [] };
    if (result.roleInfo.heroes) {
      try {
        heroAndholdAndRed = getHeroInfo(result.roleInfo.heroes);
        console.log("处理后的英雄信息:", heroAndholdAndRed);
      } catch (error) {
        console.error("处理英雄信息失败:", error);
        heroAndholdAndRed = { redCount: 0, holeCount: 0, heroList: [] };
      }
    }

    // 将鱼灵信息添加到英雄列表�?
    heroAndholdAndRed.heroList.forEach((hero) => {
      hero.PearlInfo = fishInfo[hero.artifactId] || {};
    });

    // 调试英雄列表
    console.log("最终英雄列表", heroAndholdAndRed.heroList);
    console.log("英雄列表长度:", heroAndholdAndRed.heroList.length);

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
      // 四圣数统�?
      holyBeast: heroAndholdAndRed.heroList.filter((hero) => hero.HolyBeast)
        .length,
      // 俱乐部历史最高战�?
      maxPower: formatPower(legionMaxPower),
      // 当前红鼓和最大红�?
      currentRedDrum: roleRedQuench,
      maxRedDrum: roleMaxRed,
      // 总红数和总开孔数
      totalRedCount,
      totalHoleCount,
      // 俱乐部红淬数�?
      legionRedQuench,
      legionMaxRed,
      // 英雄列表
      heroList: heroAndholdAndRed.heroList,
      legacy: result.roleInfo.legacy?.color || 0, // 功法等级
    };

    console.log("构建完成的玩家数据", playerData);

    // 更新状态并显示模态框
    playerInfo.value = playerData;
    console.log("设置playerInfo后的值", playerInfo.value);

    showPlayerInfoModal.value = true;
    console.log("设置showPlayerInfoModal后的值", showPlayerInfoModal.value);

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

// 验证切磋次数
const validateFightCount = (value) => {
  const num = Number.parseInt(value);
  isFightCountValid.value = !Number.isNaN(+num) && num >= 1 && num <= 100;
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

// 计算最终结�?
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
  fightResult.resultCount = resultCount; // 存储每场战斗的详细结�?
  fightResult.visible = true;
  fightProgress.visible = false;
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

  const totalCount = Number.parseInt(fightCount.value);
  message.info(`开始连续切磋 ${playerInfo.value.name}，共${totalCount}次`);

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

  // 初始化切磋进�?
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
    const resultCount = []; // 存储每场战斗的详细结�?

    // 重置掉将统计
    dieStats.ourDieHeroGameCount = 0;
    dieStats.enemyDieHeroGameCount = 0;

    // 执行连续切磋
    for (let i = 0; i < totalCount; i++) {
      message.info(`正在进行第${i + 1}/${totalCount} 场切磋`);

      // 调用实际的切磋API
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_startpvp",
        {
          targetId: playerInfo.value.id,
        },
        10000,
      );

      console.log(`第${i + 1} 场切磋结果`, result);

      if (result && result.battleData) {
        // 处理掉将情况
        let leftCount = 0;
        let rightCount = 0;

        // 检查我方掉将情�?
        if (result.battleData.result?.sponsor?.teamInfo) {
          result.battleData.result.sponsor.teamInfo.forEach((item) => {
            if (isSameGameValue(item.hp, 0)) {
              leftCount++;
            }
          });
        }

        // 检查敌方掉将情�?
        if (result.battleData.result?.accept?.teamInfo) {
          result.battleData.result.accept.teamInfo.forEach((item) => {
            if (isSameGameValue(item.hp, 0)) {
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

        // 保存到结果数�?
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

        // 短暂延迟，避免请求过于频�?
        if (i < totalCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        // 单场切磋失败，继续下一�?
        message.warning(
          `第${i + 1} 场切磋失败: ${result?.message || "未返回战斗数据"}`,
        );
        lossCount++;
        updateFightProgress(i + 1, winCount, lossCount);
      }
    }

    // 所有切磋完成，计算最终结�?
    calculateFinalResult(winCount, lossCount, resultCount);

    message.success(`连续切磋完成，共${totalCount}场`);
  } catch (error) {
    console.error("连续切磋失败:", error);
    message.error(`连续切磋失败: ${error.message || "网络错误"}`);
    fightProgress.visible = false;
  } finally {
    queryLoading.value = false;
    // 不关闭模态框，让用户可以继续查看或再次切�?
  }
};

// 联盟筛选计算属�?
const filteredLegionList = computed(() => {
  if (!battleRecords1.value?.legionRankList) {
    return [];
  }

  if (activeAlliance.value === "all") {
    return [...battleRecords1.value.legionRankList].sort((a, b) => {
      if (isEditMode.value) {
        // 编辑模式下，按照快照顺序排序
        return (
          editingSortOrder.value.indexOf(a.id) -
          editingSortOrder.value.indexOf(b.id)
        );
      }
      if (currentSortType.value === "manual") {
        return getMemberRank(a) - getMemberRank(b);
      } else if (currentSortType.value === "redQuench") {
        return (b.redQuench || 0) - (a.redQuench || 0);
      } else if (currentSortType.value === "score") {
        return (b.sRScore || 0) - (a.sRScore || 0);
      }
      return 0;
    });
  }

  const filtered = battleRecords1.value.legionRankList.filter((member) => {
    const memberAlliance = getMemberAlliance(member);
    if (activeAlliance.value === "空白") {
      return (
        !member.announcement ||
        member.announcement === 0 ||
        member.announcement === "0"
      );
    }
    return memberAlliance === activeAlliance.value;
  });

  return filtered.sort((a, b) => {
    if (isEditMode.value) {
      // 编辑模式下，按照快照顺序排序
      return (
        editingSortOrder.value.indexOf(a.id) -
        editingSortOrder.value.indexOf(b.id)
      );
    }
    if (currentSortType.value === "manual") {
      return getMemberRank(a) - getMemberRank(b);
    } else if (currentSortType.value === "redQuench") {
      return (b.redQuench || 0) - (a.redQuench || 0);
    } else if (currentSortType.value === "score") {
      return (b.sRScore || 0) - (a.sRScore || 0);
    }
    return 0;
  });
});

const groupedSaltTableData = computed(() => {
  const list = filteredLegionList.value;
  if (!list.length) {
    return [];
  }

  const allianceOrder = allianceOptions.map((option) => option.value);
  const groups = new Map();

  list.forEach((member) => {
    const alliance = getMemberAlliance(member) || "未知联盟";
    if (!groups.has(alliance)) {
      groups.set(alliance, []);
    }
    groups.get(alliance).push(member);
  });

  const orderedAlliances = [
    ...allianceOrder.filter((alliance) => groups.has(alliance)),
    ...Array.from(groups.keys()).filter(
      (alliance) => !allianceOrder.includes(alliance),
    ),
  ];

  const groupedRows = orderedAlliances.flatMap((alliance) => {
    const members = groups.get(alliance);
    const totalRedQuench = members.reduce((sum, member) => {
      return sum + (Number(member.redQuench) || 0);
    }, 0);
    const avgRedQuench = members.length
      ? Math.round(totalRedQuench / members.length)
      : 0;

    return [
      {
        id: `group-${alliance}`,
        __isGroupHeader: true,
        alliance,
        count: members.length,
        avgRedQuench,
        rank: "",
        name: "",
        serverId: "",
        power: "",
        redQuench: "",
        topHeroes: [],
        level: "",
        announcement: "",
      },
      ...members,
    ];
  });

  return groupedRows;
});

const saltAverageRedQuench = computed(() => {
  const list = battleRecords1.value?.legionRankList || [];
  const total = list.reduce(
    (sum, member) => sum + Number(member.redQuench || 0),
    0,
  );
  return Math.round(total / 20);
});

const saltAnnouncementText = computed(() => {
  const dateText = formatTimestamp1(inputDate1.value).replace(/\//g, "-");
  return `${dateText} 盐场分组 平均红淬：${saltAverageRedQuench.value}红`;
});

const saltFetchTimeText = computed(() => getSaltFetchTimeText());

// 计算所有俱乐部的红淬排�?
const redQuenchRankings = computed(() => {
  if (!battleRecords1.value?.legionRankList) return {};

  // 按红淬数量降序排序所有俱乐部，获取真实排�?
  const sortedByRedQuench = [...battleRecords1.value.legionRankList].sort(
    (a, b) => (b.redQuench || 0) - (a.redQuench || 0),
  );

  // 创建俱乐部ID到红淬排名的映射�?-based�?
  const rankMap = {};
  sortedByRedQuench.forEach((club, index) => {
    rankMap[club.id] = index + 1;
  });

  return rankMap;
});

// 设置当前选中联盟
const setActiveAlliance = (alliance) => {
  activeAlliance.value = alliance;
};

// 获取联盟数量
const getActiveAllianceCount = (alliance) => {
  if (!battleRecords1.value?.legionRankList) {
    return 0;
  }

  return battleRecords1.value.legionRankList.filter((member) => {
    const memberAlliance = getMemberAlliance(member);
    if (alliance === "空白") {
      return (
        !member.announcement ||
        member.announcement === 0 ||
        member.announcement === "0"
      );
    }
    return memberAlliance === alliance;
  }).length;
};

// 格式化战�?
// 处理图片加载错误

const disabledDate = (current) => {
  const date =
    typeof current?.toDate === "function"
      ? current.toDate()
      : new Date(current);
  const day = date.getDay();
  return day !== 6 && day !== 0;
};

const toggleStatCalendar = () => {
  statCalendarMonth.value = inputDate1.value.slice(0, 7);
  statCalendarOpen.value = !statCalendarOpen.value;
};

const changeStatCalendarMonth = (offset) => {
  const date = parseDateText(`${statCalendarMonth.value}/01`);
  date.setMonth(date.getMonth() + offset);
  statCalendarMonth.value = formatDateForPicker(date).slice(0, 7);
};

const selectStatCalendarDate = (value) => {
  statCalendarOpen.value = false;
  fetchBattleRecordsByDate(value);
};

// 联盟样式�?

// 红淬样式�?

//日期选择时调用查询战绩方�?
const fetchBattleRecordsByDate = (val) => {
  if (!isSameGameValue(undefined, val)) {
    inputDate1.value = val;
  } else {
    inputDate1.value = getLastSaturday();
  }
  clearSaltTableState();
  fetchBattleRecords1();
};

const clearSaltTableState = () => {
  battleRecords1.value = null;
  activeAlliance.value = "all";
  currentSortType.value = "manual";
  isEditMode.value = false;
  manualRankings.value = {};
  manualAlliances.value = {};
  editingSortOrder.value = [];
};

// 查询战绩
const fetchBattleRecords1 = async (requestTokenId = selectedTokenId.value) => {
  if (!inputDate1.value) {
    inputDate1.value = getLastSaturday();
  }

  if (!requestTokenId) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = requestTokenId;

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询战绩");
    return;
  }

  loading1.value = true;
  saltFetchStartTime.value = new Date();
  queryDate.value = formatTimestamp1(inputDate1.value);
  await fetchCurrentClubInfo(tokenId);
  if (selectedTokenId.value !== tokenId) return;

  if (
    isSameGameValue(gettoday(), queryDate.value) &&
    new Date().getHours() < 21
  ) {
    let getbattlefield;
    try {
      getbattlefield = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getbattlefield",
        {},
        10000,
      );
    } catch (error) {
      console.error("查询失败:", error);
      message.error(`查询失败: ${error.message || "网络错误"}`);
      battleRecords1.value = null;
      loading1.value = false;
      return;
    }
    if (!getbattlefield.info) {
      battleRecords1.value = null;
      message.warning(getbattlefield?.message || "未查询到盐场匹配数据");
      loading1.value = false;
      return;
    }
    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getopponent",
        {
          phase: getbattlefield.info.phase,
          battlefieldId: getbattlefield.info.battlefieldId,
        },
        10000,
      );

      if (!result?.opponentList) {
        battleRecords1.value = null;
        message.warning(result?.message || "未查询到盐场匹配数据");
        loading1.value = false;
        return;
      }
      ScoreShow.value = 1;
      const detailPromises = result.opponentList.map(async (club) => {
        try {
          const detail = await tokenStore.sendMessageWithPromise(
            tokenId,
            "legion_getinfobyid",
            { legionId: club.id },
            5000,
          );
          if (!detail) {
            return {
              ...club,
              redQuench: 0,
              power: 0,
              announcement: "未知",
              redno: 0,
              redno1: "0红",
              redno2: "0红",
              redno3: "0红",
              hb1: 0,
              hb2: 0,
              hb3: 0,
              topHeroes: [],
              level: 30,
            };
          }
          const topHeroes = [];

          for (const [roleId, memberData] of Object.entries(
            detail?.legionData?.members,
          )) {
            const tempRoleInfo = await tokenStore.sendMessageWithPromise(
              tokenId,
              "rank_getroleinfo",
              {
                bottleType: 0,
                includeBottleTeam: false,
                isSearch: false,
                roleId,
              },
              5000,
            );

            let holyBeast = 0;
            for (const [, heroData] of Object.entries(
              tempRoleInfo?.roleInfo?.heroes,
            )) {
              if (heroData.hB?.active !== undefined) {
                holyBeast++;
              }
            }

            topHeroes.push({
              id: roleId,
              name: memberData.name || memberData.custom?.name || "未知",
              headImg: memberData.headImg || memberData.custom?.headImg || "",
              power: tempRoleInfo?.roleInfo?.power || 0,
              redQuench: memberData.custom?.red_quench_cnt || 0,
              holyBeast,
              lineupType: getLineupType(
                getHeroInfo(tempRoleInfo?.roleInfo?.heroes || {}).heroList ||
                  [],
              ),
            });
          }

          // 按红淬数量降序排序，取前�?
          topHeroes.sort((a, b) => b.redQuench - a.redQuench);
          const top3Heroes = topHeroes.slice(0, 3);

          // 提取红淬数量数组
          const redQuenchCounts = top3Heroes.map(
            (hero) => `${hero.redQuench}红`,
          );
          // 提取圣物数量数组
          const HolyBeastNum = top3Heroes.map((hero) => hero.holyBeast);

          return {
            ...club,
            redQuench: detail?.legionData?.quenchNum || 0,
            power: detail?.legionData?.power || 0,
            announcement: detail?.legionData?.announcement || 0,
            redno: redQuenchCounts || 0,
            redno1: redQuenchCounts[0] || "0红",
            redno2: redQuenchCounts[1] || "0红",
            redno3: redQuenchCounts[2] || "0红",
            hb1: HolyBeastNum[0] || 0,
            hb2: HolyBeastNum[1] || 0,
            hb3: HolyBeastNum[2] || 0,
            topHeroes: top3Heroes,
            level: 30,
          };
        } catch (error) {
          console.error(`查询俱乐部${club.id}详情失败:`, error);
          return {
            ...club,
            redQuench: 0,
            power: 0,
            announcement: "未知",
            redno: 0,
            redno1: "0红",
            redno2: "0红",
            redno3: "0红",
            hb1: 0,
            hb2: 0,
            hb3: 0,
            topHeroes: [],
            level: 30,
          };
        }
      });
      const processedClubs = await Promise.all(detailPromises);

      // 1. 为每个俱乐部添加联盟信息
      const clubsWithAlliance = processedClubs.map((club) => ({
        ...club,
        alliance: allianceincludes(club.announcement),
      }));

      // 2. 统计每个联盟的俱乐部数量
      const allianceStats = {};
      clubsWithAlliance.forEach((club) => {
        const alliance = club.alliance;
        allianceStats[alliance] = (allianceStats[alliance] || 0) + 1;
      });

      // 3. 找出联盟数量最多的联盟
      let maxAlliance = "";
      let maxCount = 0;
      for (const [alliance, count] of Object.entries(allianceStats)) {
        if (count > maxCount) {
          maxCount = count;
          maxAlliance = alliance;
        }
      }

      // 4. 按照联盟分组，并优先显示数量最多的联盟
      // 先将所有俱乐部按联盟分�?
      const allianceGroups = {};
      clubsWithAlliance.forEach((club) => {
        const alliance = club.alliance;
        if (!allianceGroups[alliance]) {
          allianceGroups[alliance] = [];
        }
        allianceGroups[alliance].push(club);
      });

      // 5. 在每个联盟内部按照红粹数从高到低排序
      for (const alliance in allianceGroups) {
        allianceGroups[alliance].sort(
          (a, b) => (b.redQuench || 0) - (a.redQuench || 0),
        );
      }

      // 6. 构建最终排序后的列表：先显示最大联盟，然后按联盟名称排�?
      const sortedLegionList = [];

      // 先添加最大联盟的俱乐�?
      if (maxAlliance && allianceGroups[maxAlliance]) {
        sortedLegionList.push(...allianceGroups[maxAlliance]);
        delete allianceGroups[maxAlliance];
      }

      // 然后添加其他联盟的俱乐部，按联盟名称排序
      const otherAlliances = Object.keys(allianceGroups).sort();
      for (const alliance of otherAlliances) {
        sortedLegionList.push(...allianceGroups[alliance]);
      }

      if (selectedTokenId.value !== tokenId) return;

      battleRecords1.value = {
        ...result,
        legionRankList: sortedLegionList,
      };
      message.success("盐场匹配数据加载成功");
    } catch (error) {
      if (selectedTokenId.value !== tokenId) return;

      console.error("查询失败:", error);
      message.error(`查询失败: ${error.message}`);
      battleRecords1.value = null;
    } finally {
      if (selectedTokenId.value === tokenId) {
        loading1.value = false;
      }
    }
  } else {
    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_getwarrank",
        { date: queryDate.value },
        10000,
      );

      if (!result?.legionRankList) {
        battleRecords1.value = null;
        message.warning(result?.message || "未查询到盐场匹配数据");
        return;
      }
      ScoreShow.value = 0;
      const detailPromises = result.legionRankList.map(async (club) => {
        try {
          const detail = await tokenStore.sendMessageWithPromise(
            tokenId,
            "legion_getinfobyid",
            { legionId: club.id },
            5000,
          );
          club.sRScore = -1;
          if (!detail) {
            return {
              ...club,
              redQuench: 0,
              power: 0,
              announcement: "未知",
              redno: 0,
              redno1: "0红",
              redno2: "0红",
              redno3: "0红",
              hb1: 0,
              hb2: 0,
              hb3: 0,
              topHeroes: [],
              level: 30,
            };
          }
          const topHeroes = [];

          for (const [roleId, memberData] of Object.entries(
            detail?.legionData?.members,
          )) {
            const tempRoleInfo = await tokenStore.sendMessageWithPromise(
              tokenId,
              "rank_getroleinfo",
              {
                bottleType: 0,
                includeBottleTeam: false,
                isSearch: false,
                roleId,
              },
              5000,
            );

            let holyBeast = 0;
            for (const [, heroData] of Object.entries(
              tempRoleInfo?.roleInfo?.heroes,
            )) {
              if (heroData.hB?.active !== undefined) {
                holyBeast++;
              }
            }

            topHeroes.push({
              id: roleId,
              name: memberData.name || memberData.custom?.name || "未知",
              headImg: memberData.headImg || memberData.custom?.headImg || "",
              power: tempRoleInfo?.roleInfo?.power || 0,
              redQuench: memberData.custom?.red_quench_cnt || 0,
              holyBeast,
              lineupType: getLineupType(
                getHeroInfo(tempRoleInfo?.roleInfo?.heroes || {}).heroList ||
                  [],
              ),
            });
          }

          // 按红淬数量降序排序，取前�?
          topHeroes.sort((a, b) => b.redQuench - a.redQuench);
          const top3Heroes = topHeroes.slice(0, 3);

          // 提取红淬数量数组
          const redQuenchCounts = top3Heroes.map(
            (hero) => `${hero.redQuench}红`,
          );
          // 提取圣物数量数组
          const HolyBeastNum = top3Heroes.map((hero) => hero.holyBeast);

          return {
            ...club,
            redQuench: detail?.legionData?.quenchNum || 0,
            power: detail?.legionData?.power || 0,
            announcement: detail?.legionData?.announcement || 0,
            redno: redQuenchCounts || 0,
            redno1: redQuenchCounts[0] || "0红",
            redno2: redQuenchCounts[1] || "0红",
            redno3: redQuenchCounts[2] || "0红",
            hb1: HolyBeastNum[0] || 0,
            hb2: HolyBeastNum[1] || 0,
            hb3: HolyBeastNum[2] || 0,
            topHeroes: top3Heroes,
            level: 30,
          };
        } catch (error) {
          console.error(`查询俱乐部${club.id}详情失败:`, error);
          return {
            ...club,
            redQuench: 0,
            power: 0,
            announcement: "未知",
            redno: 0,
            redno1: "0红",
            redno2: "0红",
            redno3: "0红",
            hb1: 0,
            hb2: 0,
            hb3: 0,
            topHeroes: [],
            level: 30,
          };
        }
      });
      const processedClubs = await Promise.all(detailPromises);

      // 1. 为每个俱乐部添加联盟信息
      const clubsWithAlliance = processedClubs.map((club) => ({
        ...club,
        alliance: allianceincludes(club.announcement),
      }));

      // 2. 统计每个联盟的俱乐部数量
      const allianceStats = {};
      clubsWithAlliance.forEach((club) => {
        const alliance = club.alliance;
        allianceStats[alliance] = (allianceStats[alliance] || 0) + 1;
      });

      // 3. 找出联盟数量最多的联盟
      let maxAlliance = "";
      let maxCount = 0;
      for (const [alliance, count] of Object.entries(allianceStats)) {
        if (count > maxCount) {
          maxCount = count;
          maxAlliance = alliance;
        }
      }

      // 4. 按照联盟分组，并优先显示数量最多的联盟
      // 先将所有俱乐部按联盟分�?
      const allianceGroups = {};
      clubsWithAlliance.forEach((club) => {
        const alliance = club.alliance;
        if (!allianceGroups[alliance]) {
          allianceGroups[alliance] = [];
        }
        allianceGroups[alliance].push(club);
      });

      // 5. 在每个联盟内部按照红粹数从高到低排序
      for (const alliance in allianceGroups) {
        allianceGroups[alliance].sort(
          (a, b) => (b.redQuench || 0) - (a.redQuench || 0),
        );
      }

      // 6. 构建最终排序后的列表：先显示最大联盟，然后按联盟名称排�?
      const sortedLegionList = [];

      // 先添加最大联盟的俱乐�?
      if (maxAlliance && allianceGroups[maxAlliance]) {
        sortedLegionList.push(...allianceGroups[maxAlliance]);
        delete allianceGroups[maxAlliance];
      }

      // 然后添加其他联盟的俱乐部，按联盟名称排序
      const otherAlliances = Object.keys(allianceGroups).sort();
      for (const alliance of otherAlliances) {
        sortedLegionList.push(...allianceGroups[alliance]);
      }

      if (selectedTokenId.value !== tokenId) return;

      battleRecords1.value = {
        ...result,
        legionRankList: sortedLegionList,
      };
      message.success("盐场匹配数据加载成功");
    } catch (error) {
      if (selectedTokenId.value !== tokenId) return;

      console.error("查询失败:", error);
      message.error(`查询失败: ${error.message}`);
      battleRecords1.value = null;
    } finally {
      if (selectedTokenId.value === tokenId) {
        loading1.value = false;
      }
    }
  }
};
// 刷新战绩
const handleRefresh1 = () => {
  fetchBattleRecords1();
};

const hcSort = async () => {
  if (!battleRecords1.value?.legionRankList) return;

  // 1. 按红淬数量排�?
  const sortedList = [...battleRecords1.value.legionRankList].sort(
    (a, b) => (b.redQuench || 0) - (a.redQuench || 0),
  );

  // 2. 更新排名数据
  sortedList.forEach((member, index) => {
    manualRankings.value[member.id] = index + 1;
  });

  // 3. 切换到手动排序模式（使用更新后的排名�?
  currentSortType.value = "manual";

  // 4. 如果在编辑模式，更新快照顺序以立即刷新视�?
  if (isEditMode.value) {
    editingSortOrder.value = sortedList.map((m) => m.id);
  }

  message.success("已按红淬数量重置排名");
};

const scoreSort = async () => {
  if (!battleRecords1.value?.legionRankList) return;

  // 1. 按积分排�?
  const sortedList = [...battleRecords1.value.legionRankList].sort(
    (a, b) => (b.sRScore || 0) - (a.sRScore || 0),
  );

  // 2. 更新排名数据
  sortedList.forEach((member, index) => {
    manualRankings.value[member.id] = index + 1;
  });

  // 3. 切换到手动排序模式（使用更新后的排名�?
  currentSortType.value = "manual";

  // 4. 如果在编辑模式，更新快照顺序以立即刷新视�?
  if (isEditMode.value) {
    editingSortOrder.value = sortedList.map((m) => m.id);
  }

  message.success("已按积分重置排名");
};
// 导出战绩
const handleExport1 = async () => {
  if (!battleRecords1.value || !battleRecords1.value.legionRankList) {
    message.warning("没有可导出的数据");
    return;
  }

  try {
    if (exportmethod.value.includes("1")) {
      formatWarrankRecordsForExport(
        battleRecords1.value.legionRankList,
        queryDate.value,
      );
    }
    if (exportmethod.value.includes("2")) {
      await exportToImage();
    }
    message.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败，请重试");
  }
};

const exportToImage = async () => {
  // 校验：确保DOM已正确绑�?
  if (!exportDom.value) {
    // eslint-disable-next-line no-alert -- Preserve the existing native notification or confirmation flow.
    alert("未找到要导出的DOM元素");
    return;
  }

  // 获取 table-container
  const tableContainer = exportDom.value.querySelector(".table-container");
  const expandNodes = [
    exportDom.value,
    tableContainer,
    ...exportDom.value.querySelectorAll(
      ".n-data-table, .n-data-table-wrapper, .n-data-table-base-table, .n-data-table-base-table-body, .n-data-table-table-wrapper",
    ),
  ].filter(Boolean);

  const originalNodeState = expandNodes.map((node) => ({
    node,
    height: node.style.height,
    maxHeight: node.style.maxHeight,
    width: node.style.width,
    minWidth: node.style.minWidth,
    overflow: node.style.overflow,
    overflowX: node.style.overflowX,
    overflowY: node.style.overflowY,
    scrollTop: node.scrollTop,
    scrollLeft: node.scrollLeft,
  }));

  try {
    exportDom.value.classList.add("salt-image-exporting");

    const exportWidth = 1380;

    expandNodes.forEach((node) => {
      node.style.height = "auto";
      node.style.maxHeight = "none";
      node.style.width = `${exportWidth}px`;
      node.style.minWidth = `${exportWidth}px`;
      node.style.overflow = "visible";
      node.style.overflowX = "visible";
      node.style.overflowY = "visible";
      node.scrollTop = 0;
      node.scrollLeft = 0;
    });

    exportDom.value.style.width = `${exportWidth}px`;
    exportDom.value.style.minWidth = `${exportWidth}px`;

    // 等待DOM更新
    await new Promise((resolve) => setTimeout(resolve, 200));

    const exportRootRect = exportDom.value.getBoundingClientRect();
    const exportContentNodes = [
      exportDom.value.querySelector(".announcement-section"),
      exportDom.value.querySelector(".alliance-tabs-section"),
      tableContainer,
    ].filter(Boolean);
    const contentBottom = exportContentNodes.reduce((bottom, node) => {
      const rect = node.getBoundingClientRect();
      return Math.max(bottom, rect.bottom - exportRootRect.top);
    }, 0);
    const exportHeight = Math.ceil(contentBottom + 2);

    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: "#ffffff", // 避免透明背景（默认透明�?
      logging: false, // 关闭控制台日�?
      height: exportHeight, // 确保捕获完整高度
      width: exportWidth, // 确保捕获完整宽度
      windowWidth: exportWidth, // 设置窗口宽度
      windowHeight: exportHeight, // 设置窗口高度
      allowTaint: true, // 允许跨域图片污染画布
    });

    // 6. Canvas转图片链接并下载
    const filename = `${queryDate.value
      .replace("/", "年")
      .replace("/", "月")}日盐场匹配信息.png`;
    downloadCanvasAsImage(canvas, filename);
  } catch (err) {
    console.error("DOM转图片失败：", err);
    // eslint-disable-next-line no-alert -- Preserve the existing native notification or confirmation flow.
    alert("导出图片失败，请重试");
  } finally {
    exportDom.value.classList.remove("salt-image-exporting");
    originalNodeState.forEach(
      ({
        node,
        height,
        maxHeight,
        width,
        minWidth,
        overflow,
        overflowX,
        overflowY,
        scrollTop,
        scrollLeft,
      }) => {
        node.style.height = height;
        node.style.maxHeight = maxHeight;
        node.style.width = width;
        node.style.minWidth = minWidth;
        node.style.overflow = overflow;
        node.style.overflowX = overflowX;
        node.style.overflowY = overflowY;
        node.scrollTop = scrollTop;
        node.scrollLeft = scrollLeft;
      },
    );
  }
};

const getAllianceTagClass = (alliance) => {
  switch (alliance) {
    case "大联盟":
      return "alliance-tag-dalianmeng";
    case "梦盟":
      return "alliance-tag-mengmeng";
    case "正义联盟":
      return "alliance-tag-zhengyi";
    case "龙盟":
      return "alliance-tag-longmeng";
    case "曦盟":
      return "alliance-tag-ximeng";
    case "未知联盟":
      return "alliance-tag-unknown";
    default:
      return "alliance-tag-other";
  }
};

// 关闭弹窗

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords1,
});

// Inline 模式：挂载后自动拉取
onMounted(() => {
  fetchCurrentClubInfo();
  fetchBattleRecords1();
});

watch(selectedTokenId, (newTokenId, oldTokenId) => {
  if (!newTokenId || newTokenId === oldTokenId) return;

  currentClubInfo.value = null;
  battleRecords1.value = null;
  expandedMembers.value = new Set();
  fetchCurrentClubInfo(newTokenId);
  fetchBattleRecords1(newTokenId);
});
</script>

<style scoped lang="scss">
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
  border-bottom: 1px solid var(--border-light);
}

.player-avatar {
  border: 2px solid var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-info-detail h3 {
  margin: 0 0 8px 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.player-info-detail p {
  margin: 0 0 4px 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
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
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.fight-count-input {
  width: 100px;
}

.fight-count-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.fight-count-error {
  font-size: var(--font-size-xs);
  color: var(--error-color);
  margin-left: 4px;
}

.fight-progress {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.progress-stats {
  display: flex;
  gap: 15px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.fight-result {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
}

.fight-result h4 {
  margin: 0 0 12px 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
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
  font-size: var(--font-size-sm);
}

.result-label {
  color: var(--text-secondary);
}

.result-value {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.result-value.win {
  color: var(--success-color);
}

.result-value.loss {
  color: var(--error-color);
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
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
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
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 2px solid var(--border-light);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-placeholder {
      font-size: 36px;
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
    }
  }

  .hero-modal-basic {
    flex: 1;
  }

  .hero-modal-name {
    margin: 0 0 10px 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }

  .hero-modal-stats {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);

    .stat-item {
      padding: 4px 8px;
      background: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-light);
    }
  }

  .hero-modal-details {
    margin-bottom: 20px;

    :deep(.n-descriptions) {
      font-size: var(--font-size-sm);

      .n-descriptions-item-label {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .n-descriptions-item-content {
        color: var(--text-secondary);
      }
    }
  }

  .hero-modal-equipment {
    margin-top: 20px;
  }

  .section-title {
    margin: 0 0 15px 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
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
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
    width: 60px;
  }

  .equipment-slots {
    display: flex;
    gap: 6px;
  }

  .equipment-slot {
    width: 20px;
    height: 20px;
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-sm);
    background: var(--bg-secondary);
  }

  .equipment-slot.red-slot {
    background: var(--error-color);
    border-color: var(--error-color);
  }

  /* 鱼灵洗练颜色�?*/
  .ModalEquipment {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 4px;
    display: inline-block;
    vertical-align: middle;
  }
}

/* 响应式设�?*/
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
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
}

.result-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.result-summary {
  display: flex;
  gap: 15px;
  font-size: var(--font-size-sm);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.summary-value.win {
  color: var(--success-color);
}

.summary-value.loss {
  color: var(--error-color);
}

.result-list {
  margin-bottom: 15px;
}

.battle-result-item {
  margin-bottom: 10px;
  padding: 12px;
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
  border-left: 4px solid var(--border-light);
  transition: all var(--transition-fast);
}

.battle-result-item.win {
  border-left-color: var(--success-color);
  background: rgba(var(--success-color-rgb), 0.03);
}

.battle-result-item.loss {
  border-left-color: var(--error-color);
  background: rgba(var(--error-color-rgb), 0.03);
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.battle-index {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
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
  font-size: var(--font-size-sm);
}

.side-name {
  display: block;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 3px;
}

.side-power {
  display: block;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.side-die {
  display: block;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.battle-vs {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
  margin: 0 10px;
}

/* 响应式设�?*/
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
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
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
  background: var(--bg-secondary);
  padding: 12px 16px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
    border-color: var(--primary-color);
  }
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.hero-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.hero-stats span {
  padding: 2px 6px;
  background: var(--bg-primary);
  border-radius: var(--border-radius-full);
  border: 1px solid var(--border-light);
}

.hero-stats span.opened {
  background: rgba(var(--success-color-rgb), 0.1);
  color: var(--success-color);
  border-color: var(--success-color);
}

.hero-stats span.closed {
  background: rgba(var(--warning-color-rgb), 0.1);
  color: var(--warning-color);
  border-color: var(--warning-color);
}

.empty-heroes {
  background: var(--bg-secondary);
  padding: 30px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.player-id {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

// 主容器样�?
// 主容器样�?
.club-warrank-container {
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

// 卡片样式
.club-warrank-card {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 头部信息�?
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

  // 数据统计�?
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

      :deep(.stat-date-picker) {
        width: 132px;
        border-color: #91caff;
        background: #ffffff;
      }

      .stat-date-dropdown {
        position: relative;
        display: inline-flex;
        align-items: center;
      }

      :deep(.stat-date-tag) {
        min-width: 96px;
        justify-content: center;
        cursor: pointer;
        user-select: none;
      }

      .stat-calendar-panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 30;
        width: 238px;
        padding: 10px;
        background: #ffffff;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      .stat-calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;

        button {
          width: 26px;
          height: 26px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          background: #ffffff;
          cursor: pointer;
        }
      }

      .stat-calendar-weekdays,
      .stat-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }

      .stat-calendar-weekdays {
        margin-bottom: 4px;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      }

      .stat-calendar-grid button {
        height: 28px;
        border: 1px solid transparent;
        border-radius: 4px;
        background: #ffffff;
        color: #1f2937;
        cursor: pointer;

        &.outside {
          color: #c0c4cc;
        }

        &.selected {
          background: #1677ff;
          color: #ffffff;
        }

        &.disabled {
          color: #c0c4cc;
          background: #f5f5f5;
          cursor: not-allowed;
        }
      }
    }
  }
}

// 功能操作�?
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
        box-shadow: var(--shadow-medium);
      }

      &.refresh-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-medium);
      }

      &.export-btn {
        background: var(--primary-color);
        color: white;

        &:hover {
          background: var(--primary-color-hover);
        }
      }

      &.sort-btn {
        background: var(--info-color-light);
        color: var(--info-color);
        border: 1px solid var(--info-color);

        &:hover {
          background: var(--info-color-hover);
          color: white;
        }
      }
    }
  }
}

// 公告区域
.announcement-section {
  background: #bae0ff;
  border: 1px solid #1677ff;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;

  .announcement-content {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;

    .announcement-text {
      color: #8b4513;
      font-size: 22px !important;
      font-weight: var(--font-weight-bold);
      text-align: center;
      line-height: 1.5;
      max-width: 800px;
    }

    .announcement-fetch-time {
      color: rgba(139, 69, 19, 0.7);
      font-size: 12px !important;
      font-weight: var(--font-weight-bold);
      text-align: center;
      line-height: 1;
      white-space: nowrap;
    }
  }
}

// 联盟分类标签�?
.alliance-tabs-section {
  display: flex;
  background: var(--bg-secondary);
  padding: var(--spacing-xs);
  gap: var(--spacing-xs);
  flex-shrink: 0;

  .alliance-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    box-sizing: border-box;
    height: 34px;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    line-height: 1;
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid transparent;

    &:hover {
      transform: translateY(-1px);
    }

    &.active {
      box-shadow: var(--shadow-medium);
    }

    // 全部 - 蓝色
    &.alliance-all {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: #374151;

      &:hover {
        background: #e5e7eb;
      }

      &.active {
        background: #e5e7eb;
        color: #111827;
        border-color: #9ca3af;
      }
    }

    // 大联�?- 绿色
    &.alliance-dalianmeng {
      background: rgba(82, 196, 26, 0.18);
      border-color: rgba(82, 196, 26, 0.2);
      color: #237804;

      &:hover {
        background: rgba(82, 196, 26, 0.22);
      }

      &.active {
        background: rgba(82, 196, 26, 0.26);
        color: #135200;
        border-color: rgba(82, 196, 26, 0.38);
      }
    }

    // 梦盟 - 橙色
    &.alliance-mengmeng {
      background: rgba(250, 173, 20, 0.2);
      border-color: rgba(250, 173, 20, 0.22);
      color: #ad6800;

      &:hover {
        background: rgba(250, 173, 20, 0.24);
      }

      &.active {
        background: rgba(250, 173, 20, 0.28);
        color: #873800;
        border-color: rgba(250, 173, 20, 0.4);
      }
    }

    // 正义联盟 - 红色
    &.alliance-zhengyi {
      background: rgba(245, 34, 45, 0.18);
      border-color: rgba(245, 34, 45, 0.2);
      color: #cf1322;

      &:hover {
        background: rgba(245, 34, 45, 0.22);
      }

      &.active {
        background: rgba(245, 34, 45, 0.26);
        color: #a8071a;
        border-color: rgba(245, 34, 45, 0.36);
      }
    }

    // 龙盟 - 紫色
    &.alliance-longmeng {
      background: rgba(114, 46, 209, 0.18);
      border-color: rgba(114, 46, 209, 0.2);
      color: #531dab;

      &:hover {
        background: rgba(114, 46, 209, 0.22);
      }

      &.active {
        background: rgba(114, 46, 209, 0.26);
        color: #391085;
        border-color: rgba(114, 46, 209, 0.36);
      }
    }

    // 曦盟 - 青色
    &.alliance-ximeng {
      background: rgba(19, 194, 194, 0.18);
      border-color: rgba(19, 194, 194, 0.2);
      color: #08979c;

      &:hover {
        background: rgba(19, 194, 194, 0.22);
      }

      &.active {
        background: rgba(19, 194, 194, 0.26);
        color: #006d75;
        border-color: rgba(19, 194, 194, 0.38);
      }
    }

    // 未知联盟 - 默认白色
    &.alliance-unknown {
      background: #ffffff;
      border-color: #d9d9d9;
      color: #4b5563;

      &:hover {
        background: #f9fafb;
      }

      &.active {
        background: #f3f4f6;
        color: #111827;
        border-color: #d1d5db;
      }
    }

    .tab-text {
      font-size: var(--font-size-sm);
      line-height: 1;
    }

    .tab-count {
      font-size: var(--font-size-xs);
      line-height: 1;
      background: rgba(255, 255, 255, 0.62);
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: var(--font-weight-bold);

      .alliance-tab.active & {
        background: rgba(255, 255, 255, 0.3);
        color: white;
      }
    }
  }
}

// 表格内容�?
.table-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);

  // 加载状�?
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: var(--bg-primary);
    height: 100%;

    :deep(.n-spin) {
      font-size: var(--font-size-lg);

      .n-spin-description {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
  }

  // 空状�?
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: var(--bg-primary);
    height: 100%;

    :deep(.n-empty) {
      font-size: var(--font-size-sm);

      .n-empty-description {
        color: var(--text-secondary);
      }
    }
  }

  // 表格容器
  .table-container {
    flex: 1;
    overflow: auto;
    background: var(--bg-primary);
    height: 100%;

    // 滚动条样�?
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: var(--border-radius-sm);

      &:hover {
        background: var(--border-dark);
      }
    }

    // 表格标题�?
    .table-header {
      display: flex;
      background: linear-gradient(
        180deg,
        var(--bg-secondary) 0%,
        var(--bg-primary) 100%
      );
      border-bottom: 2px solid var(--border-medium);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      padding: var(--spacing-xs) var(--spacing-sm);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      // 确保所有标题头居中对齐
      .table-cell {
        justify-content: center;
        display: flex;
        align-items: center;

        &.rank {
          width: 90px;
          min-width: 90px;
        }

        &.name {
          width: 150px;
          min-width: 150px;
        }

        &.server {
          width: 70px;
          min-width: 70px;
        }

        &.power {
          width: 100px;
          min-width: 100px;
        }

        &.red-quench {
          width: 80px;
          min-width: 80px;
        }

        &.alliance {
          width: 90px;
          min-width: 90px;
        }

        &.first-3 {
          width: 350px;
          min-width: 350px;
        }

        &.level {
          width: 70px;
          min-width: 70px;
        }

        &.announcement {
          min-width: 150px;
          flex: 1;
        }
      }
    }

    // 表格数据�?
    .table-row {
      display: flex;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-bottom: 1px solid var(--border-light);
      transition: all var(--transition-fast);
      background: var(--bg-primary);

      &:hover {
        background: var(--bg-secondary);
        transform: translateX(2px);
        box-shadow: inset 3px 0 0 var(--primary-color);
      }

      &:last-child {
        border-bottom: none;
      }

      // 联盟样式�?
      &.alliance-large {
        .alliance-tag {
          background: #52c41a;
        }
      }

      &.alliance-dream {
        .alliance-tag {
          background: #faad14;
        }
      }

      &.alliance-xin-justice {
        .alliance-tag {
          background: #f5222d;
        }
      }

      &.alliance-dragon {
        .alliance-tag {
          background: #722ed1;
        }
      }

      &.alliance-xi {
        .alliance-tag {
          background: #13c2c2;
        }
      }

      &.alliance-unknown {
        .alliance-tag {
          background: #f3f4f6;
          color: #4b5563;
        }
      }

      &.alliance-other {
        .alliance-tag {
          background: #1677ff;
        }
      }

      &.alliance-all {
        .alliance-tag {
          background: #1677ff;
        }
      }
    }

    // 表格单元�?
    .table-cell {
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--text-primary);

      // 单元格宽度分�?
      &.rank {
        width: 90px;
        min-width: 90px;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        padding: 4px 8px;

        .rank-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 4px 0;
        }

        .rank-medal {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: var(--font-size-base);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          margin: 0 6px;

          &::before {
            content: attr(data-rank);
          }

          &.gold {
            background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);

            &::before {
              content: "1";
            }
          }

          &.silver {
            background: linear-gradient(135deg, #c0c0c0 0%, #a9a9a9 100%);

            &::before {
              content: "2";
            }
          }

          &.bronze {
            background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);

            &::before {
              content: "3";
            }
          }
        }

        .rank-number {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0 6px;
        }
      }

      &.alliance {
        width: 90px;
        min-width: 90px;

        .alliance-tag {
          display: inline-block;
          padding: 3px 8px;
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          transition: all var(--transition-fast);

          &:hover {
            transform: scale(1.05);
            box-shadow: var(--shadow-medium);
          }
        }
      }

      &.score {
        width: 80px;
        min-width: 80px;
        justify-content: center;
        color: var(--warning-color);
        font-weight: var(--font-weight-bold);
        font-size: var(--font-size-base);
        text-align: center;
      }

      &.red-quench {
        width: 80px;
        min-width: 80px;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        text-align: center;

        &::before {
          content: "";
          display: inline-block;
          width: 12px;
          height: 12px;
          background: var(--error-color);
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
      }

      &.first-3 {
        width: 350px;
        min-width: 405px;

        .hero-avatars {
          display: flex;
          gap: var(--spacing-xs);
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          flex-wrap: nowrap;
          padding: var(--spacing-xs) 0;
          overflow: hidden;
        }

        .hero-card {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--spacing-xs);
          padding: calc(var(--spacing-xs) / 2);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-light);
          transition: all var(--transition-fast);
          width: 200px !important;
          height: 50px !important;
          min-width: 200px !important;
          max-width: 200px !important;
          min-height: 50px !important;
          max-height: 50px !important;
          cursor: pointer;

          &:hover {
            background: var(--bg-primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
            border-color: var(--primary-color);
          }

          &:active {
            transform: translateY(0);
            box-shadow: var(--shadow-sm);
          }

          .hero-avatar-container {
            width: 32px;
            height: 32px;
            max-width: 32px;
            max-height: 32px;
            min-width: 32px;
            min-height: 32px;
            flex-shrink: 0;
          }

          .hero-avatar,
          .hero-avatar-placeholder {
            width: 32px !important;
            height: 32px !important;
            max-width: 32px !important;
            max-height: 32px !important;
            min-width: 32px;
            min-height: 32px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--border-light);
            flex-shrink: 0;
          }

          .hero-avatar-placeholder {
            background: linear-gradient(
              135deg,
              var(--primary-color) 0%,
              var(--primary-color-light) 100%
            );
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: var(--font-weight-bold);
          }
        }

        /* 覆盖全局hero-stats span样式，确保战力和红数正常显示 */
        .hero-stats span {
          padding: 0;
          background: none;
          border: none;
          border-radius: 0;
        }

        .hero-name {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-stats {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
        }

        .hero-power,
        .hero-redquench {
          display: inline-block;
        }

        .hero-power {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        .hero-redquench {
          font-weight: var(--font-weight-bold);
          padding: 1px 6px;
          border-radius: var(--border-radius-full);

          &.redquench-high {
            color: var(--error-color);
            background: rgba(var(--error-color-rgb), 0.1);
          }

          &.redquench-medium {
            color: var(--warning-color);
            background: rgba(var(--warning-color-rgb), 0.1);
          }

          &.redquench-low {
            color: var(--success-color);
            background: rgba(var(--success-color-rgb), 0.1);
          }
        }
      }

      &.power {
        width: 100px;
        min-width: 100px;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        color: var(--primary-color);
        font-size: var(--font-size-base);
        text-align: center;
      }

      &.level {
        width: 70px;
        min-width: 70px;
        justify-content: center;

        &::before {
          content: "Lv.";
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          margin-right: 2px;
        }

        span {
          display: inline-block;
          padding: 2px 8px;
          background: linear-gradient(
            135deg,
            var(--primary-color-light) 0%,
            var(--primary-color) 100%
          );
          color: white;
          border-radius: var(--border-radius-full);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
        }
      }

      &.server {
        width: 80px;
        min-width: 80px;
        justify-content: center;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        text-align: center;
      }

      &.announcement {
        flex: 1;
        min-width: 150px;
        color: var(--text-secondary);
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
        font-size: var(--font-size-xs);
        line-height: 1.4;
        min-height: 24px;
        word-break: break-all;
      }
    }
  }
}

// 按钮样式调整
:deep(.n-button) {
  font-size: var(--font-size-sm);
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 输入框样式调�?
:deep(.n-input-wrapper) {
  font-size: var(--font-size-sm);
}

.salt-table {
  :deep(.n-data-table-th),
  :deep(.n-data-table-td),
  :deep(.n-data-table-cell) {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }

  :deep(.n-data-table-th) {
    background: #f3f4f6 !important;
    border-color: #d1d5db !important;
    color: #374151 !important;
    text-align: center !important;
    white-space: nowrap !important;
  }

  :deep(.n-data-table-th .n-data-table-th__title) {
    justify-content: center !important;
    font-weight: 700 !important;
  }

  :deep(.n-data-table-th:not(:last-child)),
  :deep(.n-data-table-td:not(:last-child)) {
    border-right: 1px dashed #d1d5db !important;
  }

  :deep(.n-data-table-table) {
    width: 100% !important;
    min-width: 1380px !important;
    table-layout: fixed !important;
  }

  :deep(.n-data-table-th:last-child),
  :deep(.n-data-table-td:last-child),
  :deep(.n-data-table-td:last-child .n-data-table-cell) {
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    word-break: break-all !important;
    overflow-wrap: anywhere !important;
  }

  :deep(.rank-badge) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #60a5fa;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }

  :deep(.salt-alliance-tag) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    height: 24px;
    padding: 0 6px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
  }

  :deep(.salt-club-name-cell) {
    width: 100%;
    min-width: 146px;
    min-height: 42px;
    padding: 3px 6px;
    border-radius: 8px;
    border: 1px solid transparent;
  }

  :deep(.salt-club-name-cell.is-current-club) {
    background: #fff0f6;
    border-color: #eb2f96;
    box-shadow: inset 0 0 0 1px rgba(235, 47, 150, 0.16);
  }

  :deep(.salt-club-main-row) {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  :deep(.salt-club-name-text) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1f2937;
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.current-club-badge-row) {
    display: flex;
    justify-content: flex-end;
    margin-top: -8px;
    padding-right: 2px;
  }

  :deep(.current-club-badge) {
    padding: 2px 5px;
    border-radius: 999px;
    background: #eb2f96;
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
  }

  :deep(.alliance-tag-dalianmeng) {
    background: rgba(82, 196, 26, 0.18);
    border-color: rgba(82, 196, 26, 0.2);
    color: #237804;
  }

  :deep(.alliance-tag-mengmeng) {
    background: rgba(250, 173, 20, 0.2);
    border-color: rgba(250, 173, 20, 0.22);
    color: #ad6800;
  }

  :deep(.alliance-tag-zhengyi) {
    background: rgba(245, 34, 45, 0.18);
    border-color: rgba(245, 34, 45, 0.2);
    color: #cf1322;
  }

  :deep(.alliance-tag-longmeng) {
    background: rgba(114, 46, 209, 0.18);
    border-color: rgba(114, 46, 209, 0.2);
    color: #531dab;
  }

  :deep(.alliance-tag-ximeng) {
    background: rgba(19, 194, 194, 0.18);
    border-color: rgba(19, 194, 194, 0.2);
    color: #08979c;
  }

  :deep(.alliance-tag-unknown) {
    background: #ffffff;
    border-color: #d9d9d9;
    color: #4b5563;
  }

  :deep(.alliance-tag-other) {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  :deep(img) {
    max-width: none;
  }

  :deep(.salt-alliance-row) {
    border-bottom: 1px solid var(--border-light);
    transition: all 0.2s ease;
  }

  :deep(.salt-alliance-group-row),
  :deep(.salt-fetch-time-footer-row),
  :deep(.salt-alliance-group-row > td),
  :deep(.salt-fetch-time-footer-row > td),
  :deep(.salt-alliance-group-row .n-data-table-td),
  :deep(.salt-fetch-time-footer-row .n-data-table-td),
  :deep(.salt-fetch-time-footer-row .n-data-table-cell),
  :deep(.salt-alliance-group-row .n-data-table-cell) {
    background: #ffffff !important;
  }

  :deep(.salt-alliance-group-row > td),
  :deep(.salt-fetch-time-footer-row > td) {
    border-right: none !important;
    border-left: none !important;
    height: 38px !important;
  }

  :deep(.salt-alliance-group-row .n-data-table-td:not(:last-child)),
  :deep(.salt-fetch-time-footer-row .n-data-table-td:not(:last-child)),
  :deep(.salt-fetch-time-footer-row > td:not(:last-child)),
  :deep(.salt-alliance-group-row > td:not(:last-child)) {
    border-right: none !important;
  }

  :deep(.salt-fetch-time-footer) {
    width: 100%;
    padding-right: 8px;
    text-align: right;
    color: #4b5563;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  :deep(.salt-alliance-group-title) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    padding: 0 8px;
    font-size: 15px;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
  }

  :deep(.salt-alliance-group-line) {
    display: inline-flex;
    align-items: center;
    align-self: center;
    justify-content: center;
    width: 4px;
    height: 24px;
    font-size: 0;
    font-weight: 900;
    line-height: 0;
  }

  :deep(.salt-alliance-group-line::before) {
    content: "";
    display: block;
    width: 4px;
    height: 20px;
    border-radius: 2px;
    background: currentColor;
    transform: translateY(-2px);
  }

  :deep(.salt-alliance-group-label) {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
  }

  :deep(.salt-alliance-group-row-0 .salt-alliance-group-line) {
    color: #237804;
  }

  :deep(.salt-alliance-group-row-0 .salt-alliance-group-label) {
    background: rgba(82, 196, 26, 0.18);
    border-color: rgba(82, 196, 26, 0.2);
    color: #237804;
  }

  :deep(.salt-alliance-group-row-1 .salt-alliance-group-line) {
    color: #ad6800;
  }

  :deep(.salt-alliance-group-row-1 .salt-alliance-group-label) {
    background: rgba(250, 173, 20, 0.2);
    border-color: rgba(250, 173, 20, 0.22);
    color: #ad6800;
  }

  :deep(.salt-alliance-group-row-2 .salt-alliance-group-line) {
    color: #cf1322;
  }

  :deep(.salt-alliance-group-row-2 .salt-alliance-group-label) {
    background: rgba(245, 34, 45, 0.18);
    border-color: rgba(245, 34, 45, 0.2);
    color: #cf1322;
  }

  :deep(.salt-alliance-group-row-3 .salt-alliance-group-line) {
    color: #531dab;
  }

  :deep(.salt-alliance-group-row-3 .salt-alliance-group-label) {
    background: rgba(114, 46, 209, 0.18);
    border-color: rgba(114, 46, 209, 0.2);
    color: #531dab;
  }

  :deep(.salt-alliance-group-row-4 .salt-alliance-group-line) {
    color: #08979c;
  }

  :deep(.salt-alliance-group-row-4 .salt-alliance-group-label) {
    background: rgba(19, 194, 194, 0.18);
    border-color: rgba(19, 194, 194, 0.2);
    color: #08979c;
  }

  :deep(.salt-alliance-group-row-5 .salt-alliance-group-line) {
    color: #9ca3af;
  }

  :deep(.salt-alliance-group-row-5 .salt-alliance-group-label) {
    background: #ffffff;
    border-color: #d9d9d9;
    color: #4b5563;
  }

  :deep(.salt-alliance-row-0),
  :deep(.salt-alliance-row-0 > td),
  :deep(.salt-alliance-row-0 .n-data-table-td),
  :deep(.salt-alliance-row-0 .n-data-table-cell) {
    background-color: rgba(82, 196, 26, 0.035) !important;
  }

  :deep(.salt-alliance-row-0:hover),
  :deep(.salt-alliance-row-0:hover > td),
  :deep(.salt-alliance-row-0:hover .n-data-table-td),
  :deep(.salt-alliance-row-0:hover .n-data-table-cell) {
    background-color: rgba(82, 196, 26, 0.07) !important;
  }

  :deep(.salt-alliance-row-1),
  :deep(.salt-alliance-row-1 > td),
  :deep(.salt-alliance-row-1 .n-data-table-td),
  :deep(.salt-alliance-row-1 .n-data-table-cell) {
    background-color: rgba(250, 173, 20, 0.04) !important;
  }

  :deep(.salt-alliance-row-1:hover),
  :deep(.salt-alliance-row-1:hover > td),
  :deep(.salt-alliance-row-1:hover .n-data-table-td),
  :deep(.salt-alliance-row-1:hover .n-data-table-cell) {
    background-color: rgba(250, 173, 20, 0.075) !important;
  }

  :deep(.salt-alliance-row-2),
  :deep(.salt-alliance-row-2 > td),
  :deep(.salt-alliance-row-2 .n-data-table-td),
  :deep(.salt-alliance-row-2 .n-data-table-cell) {
    background-color: rgba(245, 34, 45, 0.03) !important;
  }

  :deep(.salt-alliance-row-2:hover),
  :deep(.salt-alliance-row-2:hover > td),
  :deep(.salt-alliance-row-2:hover .n-data-table-td),
  :deep(.salt-alliance-row-2:hover .n-data-table-cell) {
    background-color: rgba(245, 34, 45, 0.065) !important;
  }

  :deep(.salt-alliance-row-3),
  :deep(.salt-alliance-row-3 > td),
  :deep(.salt-alliance-row-3 .n-data-table-td),
  :deep(.salt-alliance-row-3 .n-data-table-cell) {
    background-color: rgba(114, 46, 209, 0.03) !important;
  }

  :deep(.salt-alliance-row-3:hover),
  :deep(.salt-alliance-row-3:hover > td),
  :deep(.salt-alliance-row-3:hover .n-data-table-td),
  :deep(.salt-alliance-row-3:hover .n-data-table-cell) {
    background-color: rgba(114, 46, 209, 0.065) !important;
  }

  :deep(.salt-alliance-row-4),
  :deep(.salt-alliance-row-4 > td),
  :deep(.salt-alliance-row-4 .n-data-table-td),
  :deep(.salt-alliance-row-4 .n-data-table-cell) {
    background-color: rgba(19, 194, 194, 0.035) !important;
  }

  :deep(.salt-alliance-row-4:hover),
  :deep(.salt-alliance-row-4:hover > td),
  :deep(.salt-alliance-row-4:hover .n-data-table-td),
  :deep(.salt-alliance-row-4:hover .n-data-table-cell) {
    background-color: rgba(19, 194, 194, 0.07) !important;
  }

  :deep(.salt-alliance-row-5),
  :deep(.salt-alliance-row-5 > td),
  :deep(.salt-alliance-row-5 .n-data-table-td),
  :deep(.salt-alliance-row-5 .n-data-table-cell) {
    background-color: #ffffff !important;
  }

  :deep(.salt-alliance-row-5:hover),
  :deep(.salt-alliance-row-5:hover > td),
  :deep(.salt-alliance-row-5:hover .n-data-table-td),
  :deep(.salt-alliance-row-5:hover .n-data-table-cell) {
    background-color: #f9fafb !important;
  }
}

.salt-image-exporting {
  width: 1380px !important;
  min-width: 1380px !important;
  max-width: none !important;
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
  flex: 0 0 auto !important;

  &.table-content {
    flex: 0 0 auto !important;
    height: auto !important;
    min-height: 0 !important;
  }

  .announcement-section,
  .alliance-tabs-section,
  .table-container,
  :deep(.n-data-table),
  :deep(.n-data-table-wrapper),
  :deep(.n-data-table-base-table),
  :deep(.n-data-table-base-table-body),
  :deep(.n-data-table-base-table-body .n-scrollbar-container),
  :deep(.n-data-table-base-table-body .n-scrollbar-content),
  :deep(.n-data-table-table-wrapper),
  :deep(.n-data-table-table) {
    width: 1380px !important;
    min-width: 1380px !important;
    max-width: none !important;
    overflow: visible !important;
  }

  .alliance-tabs-section {
    display: flex !important;
    width: 1380px !important;
    min-width: 1380px !important;
    max-width: none !important;
    overflow: visible !important;
    justify-content: center !important;
    flex-wrap: nowrap !important;
  }

  .table-container {
    flex: 0 0 auto !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }

  :deep(.n-data-table-th:last-child),
  :deep(.n-data-table-td:last-child),
  :deep(.n-data-table-td:last-child .n-data-table-cell) {
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    word-break: break-all !important;
    overflow-wrap: anywhere !important;
  }
}

// 响应式设置
@media (max-width: 1200px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);

    .stats-section {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .function-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);

    .function-right {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
  }

  .alliance-tabs-section {
    overflow-x: auto;
    justify-content: flex-start;

    .alliance-tab {
      flex: 0 0 auto;
      white-space: nowrap;
    }
  }

  .table-container {
    overflow-x: auto;
  }

  .salt-table {
    :deep(.n-data-table-th),
    :deep(.n-data-table-td),
    :deep(.n-data-table-cell) {
      padding-left: 4px !important;
      padding-right: 4px !important;
    }

    :deep(.n-data-table-th) {
      background: #f3f4f6 !important;
      border-color: #d1d5db !important;
      color: #374151 !important;
      text-align: center !important;
      white-space: nowrap !important;
    }

    :deep(.n-data-table-th .n-data-table-th__title) {
      justify-content: center !important;
      font-weight: 700 !important;
    }

    :deep(.n-data-table-th:not(:last-child)),
    :deep(.n-data-table-td:not(:last-child)) {
      border-right: 1px dashed #d1d5db !important;
    }

    :deep(.n-data-table-table) {
      width: 100% !important;
      min-width: 1380px !important;
      table-layout: fixed !important;
    }

    :deep(.salt-alliance-row) {
      border-bottom: 1px solid var(--border-light);
      transition: all 0.2s ease;
    }

    :deep(.salt-alliance-group-row),
    :deep(.salt-fetch-time-footer-row),
    :deep(.salt-alliance-group-row > td),
    :deep(.salt-fetch-time-footer-row > td),
    :deep(.salt-alliance-group-row .n-data-table-td),
    :deep(.salt-fetch-time-footer-row .n-data-table-td),
    :deep(.salt-fetch-time-footer-row .n-data-table-cell),
    :deep(.salt-alliance-group-row .n-data-table-cell) {
      background: #ffffff !important;
    }

    :deep(.salt-alliance-group-row > td),
    :deep(.salt-fetch-time-footer-row > td) {
      border-right: none !important;
      border-left: none !important;
      height: 38px !important;
    }

    :deep(.salt-alliance-group-row .n-data-table-td:not(:last-child)),
    :deep(.salt-fetch-time-footer-row .n-data-table-td:not(:last-child)),
    :deep(.salt-fetch-time-footer-row > td:not(:last-child)),
    :deep(.salt-alliance-group-row > td:not(:last-child)) {
      border-right: none !important;
    }

    :deep(.salt-fetch-time-footer) {
      width: 100%;
      padding-right: 8px;
      text-align: right;
      color: #4b5563;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
    }

    :deep(.salt-alliance-group-title) {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 100%;
      padding: 0 8px;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
    }

    :deep(.salt-alliance-group-line) {
      display: inline-flex;
      align-items: center;
      align-self: center;
      justify-content: center;
      width: 4px;
      height: 24px;
      font-size: 0;
      font-weight: 900;
      line-height: 0;
    }

    :deep(.salt-alliance-group-line::before) {
      content: "";
      display: block;
      width: 4px;
      height: 20px;
      border-radius: 2px;
      background: currentColor;
      transform: translateY(-2px);
    }

    :deep(.salt-alliance-group-label) {
      display: inline-flex;
      align-items: center;
      height: 24px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
    }

    :deep(.salt-alliance-group-row-0 .salt-alliance-group-line) {
      color: #237804;
    }

    :deep(.salt-alliance-group-row-0 .salt-alliance-group-label) {
      background: rgba(82, 196, 26, 0.18);
      border-color: rgba(82, 196, 26, 0.2);
      color: #237804;
    }

    :deep(.salt-alliance-group-row-1 .salt-alliance-group-line) {
      color: #ad6800;
    }

    :deep(.salt-alliance-group-row-1 .salt-alliance-group-label) {
      background: rgba(250, 173, 20, 0.2);
      border-color: rgba(250, 173, 20, 0.22);
      color: #ad6800;
    }

    :deep(.salt-alliance-group-row-2 .salt-alliance-group-line) {
      color: #cf1322;
    }

    :deep(.salt-alliance-group-row-2 .salt-alliance-group-label) {
      background: rgba(245, 34, 45, 0.18);
      border-color: rgba(245, 34, 45, 0.2);
      color: #cf1322;
    }

    :deep(.salt-alliance-group-row-3 .salt-alliance-group-line) {
      color: #531dab;
    }

    :deep(.salt-alliance-group-row-3 .salt-alliance-group-label) {
      background: rgba(114, 46, 209, 0.18);
      border-color: rgba(114, 46, 209, 0.2);
      color: #531dab;
    }

    :deep(.salt-alliance-group-row-4 .salt-alliance-group-line) {
      color: #08979c;
    }

    :deep(.salt-alliance-group-row-4 .salt-alliance-group-label) {
      background: rgba(19, 194, 194, 0.18);
      border-color: rgba(19, 194, 194, 0.2);
      color: #08979c;
    }

    :deep(.salt-alliance-group-row-5 .salt-alliance-group-line) {
      color: #9ca3af;
    }

    :deep(.salt-alliance-group-row-5 .salt-alliance-group-label) {
      background: #ffffff;
      border-color: #d9d9d9;
      color: #4b5563;
    }

    :deep(.salt-alliance-row-0),
    :deep(.salt-alliance-row-0 > td),
    :deep(.salt-alliance-row-0 .n-data-table-td),
    :deep(.salt-alliance-row-0 .n-data-table-cell) {
      background-color: rgba(82, 196, 26, 0.035) !important;
    }

    :deep(.salt-alliance-row-0:hover),
    :deep(.salt-alliance-row-0:hover > td),
    :deep(.salt-alliance-row-0:hover .n-data-table-td),
    :deep(.salt-alliance-row-0:hover .n-data-table-cell) {
      background-color: rgba(82, 196, 26, 0.07) !important;
    }

    :deep(.salt-alliance-row-1),
    :deep(.salt-alliance-row-1 > td),
    :deep(.salt-alliance-row-1 .n-data-table-td),
    :deep(.salt-alliance-row-1 .n-data-table-cell) {
      background-color: rgba(250, 173, 20, 0.04) !important;
    }

    :deep(.salt-alliance-row-1:hover),
    :deep(.salt-alliance-row-1:hover > td),
    :deep(.salt-alliance-row-1:hover .n-data-table-td),
    :deep(.salt-alliance-row-1:hover .n-data-table-cell) {
      background-color: rgba(250, 173, 20, 0.075) !important;
    }

    :deep(.salt-alliance-row-2),
    :deep(.salt-alliance-row-2 > td),
    :deep(.salt-alliance-row-2 .n-data-table-td),
    :deep(.salt-alliance-row-2 .n-data-table-cell) {
      background-color: rgba(245, 34, 45, 0.03) !important;
    }

    :deep(.salt-alliance-row-2:hover),
    :deep(.salt-alliance-row-2:hover > td),
    :deep(.salt-alliance-row-2:hover .n-data-table-td),
    :deep(.salt-alliance-row-2:hover .n-data-table-cell) {
      background-color: rgba(245, 34, 45, 0.065) !important;
    }

    :deep(.salt-alliance-row-3),
    :deep(.salt-alliance-row-3 > td),
    :deep(.salt-alliance-row-3 .n-data-table-td),
    :deep(.salt-alliance-row-3 .n-data-table-cell) {
      background-color: rgba(114, 46, 209, 0.03) !important;
    }

    :deep(.salt-alliance-row-3:hover),
    :deep(.salt-alliance-row-3:hover > td),
    :deep(.salt-alliance-row-3:hover .n-data-table-td),
    :deep(.salt-alliance-row-3:hover .n-data-table-cell) {
      background-color: rgba(114, 46, 209, 0.065) !important;
    }

    :deep(.salt-alliance-row-4),
    :deep(.salt-alliance-row-4 > td),
    :deep(.salt-alliance-row-4 .n-data-table-td),
    :deep(.salt-alliance-row-4 .n-data-table-cell) {
      background-color: rgba(19, 194, 194, 0.035) !important;
    }

    :deep(.salt-alliance-row-4:hover),
    :deep(.salt-alliance-row-4:hover > td),
    :deep(.salt-alliance-row-4:hover .n-data-table-td),
    :deep(.salt-alliance-row-4:hover .n-data-table-cell) {
      background-color: rgba(19, 194, 194, 0.07) !important;
    }

    :deep(.salt-alliance-row-5),
    :deep(.salt-alliance-row-5 > td),
    :deep(.salt-alliance-row-5 .n-data-table-td),
    :deep(.salt-alliance-row-5 .n-data-table-cell) {
      background-color: #ffffff !important;
    }

    :deep(.salt-alliance-row-5:hover),
    :deep(.salt-alliance-row-5:hover > td),
    :deep(.salt-alliance-row-5:hover .n-data-table-td),
    :deep(.salt-alliance-row-5:hover .n-data-table-cell) {
      background-color: #f9fafb !important;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-weight: bold;
      color: white;
      font-size: 12px;

      &.gold {
        background: linear-gradient(135deg, #ffd700, #ffb700);
        box-shadow: 0 2px 4px rgba(255, 215, 0, 0.4);
      }

      &.silver {
        background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
        box-shadow: 0 2px 4px rgba(192, 192, 192, 0.4);
      }

      &.bronze {
        background: linear-gradient(135deg, #cd7f32, #b87333);
        box-shadow: 0 2px 4px rgba(205, 127, 50, 0.4);
      }
    }

    .rank-number {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .member-info {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .hero-avatars {
      display: flex !important;
      flex-direction: row !important;
      gap: 12px !important;
      justify-content: flex-start !important;
      align-items: flex-start !important;
      width: 100% !important;
    }

    .hero-card {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 8px !important;
      width: 140px !important;
      padding: 8px !important;
      background: #f3f4f6 !important;
      border-radius: 8px !important;
      border: 1px solid #e5e7eb !important;
      flex-shrink: 0 !important;
    }

    .hero-avatar-container {
      flex-shrink: 0 !important;
      cursor: pointer !important;
      width: 30px !important;
      height: 30px !important;
    }

    .hero-avatar,
    .hero-avatar-placeholder {
      width: 30px !important;
      height: 30px !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      border: 2px solid #e5e7eb !important;
    }

    .hero-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      flex-shrink: 1 !important;
    }

    .hero-top {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      white-space: nowrap !important;
    }

    .hero-bottom {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      white-space: nowrap !important;
    }

    .table-header {
      background: linear-gradient(
        135deg,
        var(--primary-color) 0%,
        var(--primary-color-light) 100%
      );
      color: white;

      .table-cell {
        padding: var(--spacing-sm) var(--spacing-md);
        font-weight: var(--font-weight-bold);
        text-align: center;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
        white-space: nowrap;

        &:last-child {
          border-right: none;
        }
      }
    }

    .table-row {
      transition: background-color var(--transition-fast);

      &:hover {
        background-color: var(--bg-hover);
      }

      &:nth-child(even) {
        background-color: var(--bg-secondary);
      }

      &:nth-child(odd) {
        background-color: var(--bg-primary);
      }

      .table-cell {
        padding: var(--spacing-sm) var(--spacing-md);
        border-right: 1px solid var(--border-light);
        border-bottom: 1px solid var(--border-light);
        vertical-align: middle;
        text-align: center;

        &:last-child {
          border-right: none;
        }

        &.rank {
          width: 70px;
          min-width: 70px;
        }

        &.name {
          width: 180px;
          min-width: 180px;
          text-align: left;

          .member-info {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);

            .member-avatar,
            .member-avatar-placeholder {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid var(--border-light);
            }

            .member-avatar-placeholder {
              background: linear-gradient(
                135deg,
                var(--primary-color) 0%,
                var(--primary-color-light) 100%
              );
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: var(--font-weight-bold);
            }

            .member-name {
              font-weight: var(--font-weight-medium);
              color: var(--text-primary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }

        &.server {
          width: 80px;
          min-width: 80px;
        }

        &.power {
          width: 100px;
          min-width: 100px;
          font-weight: var(--font-weight-bold);
          color: var(--primary-color);
        }

        &.red-quench {
          width: 80px;
          min-width: 80px;
        }

        &.alliance {
          width: 100px;
          min-width: 100px;
        }

        &.first-3 {
          width: 500px;
          min-width: 450px;
          padding: 4px;

          .hero-avatars {
            display: flex;
            gap: 12px;
            justify-content: flex-start;
            align-items: flex-start;
          }

          .hero-card {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 140px;
            padding: 8px;
            background: var(--bg-secondary);
            border-radius: 8px;
            border: 1px solid var(--border-light);
            flex-shrink: 0;

            .hero-avatar-container {
              flex-shrink: 0;
              cursor: pointer;
              width: 30px;
              height: 30px;
            }

            .hero-avatar,
            .hero-avatar-placeholder {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid var(--border-light);
            }

            .hero-avatar-placeholder {
              background: linear-gradient(
                135deg,
                var(--primary-color) 0%,
                var(--primary-color-light) 100%
              );
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: var(--font-weight-bold);
            }

            .hero-info {
              display: flex;
              flex-direction: column;
              gap: 2px;
              flex-shrink: 1;

              .hero-top {
                display: flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;

                .hero-name {
                  font-size: var(--font-size-xs);
                  font-weight: var(--font-weight-medium);
                  color: var(--text-primary);
                }

                .hero-holy-beast {
                  font-size: 10px;
                  color: white;
                  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                  padding: 1px 4px;
                  border-radius: var(--border-radius-full);
                  font-weight: var(--font-weight-bold);
                  flex-shrink: 0;
                }
              }

              .hero-bottom {
                display: flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;

                .hero-power {
                  font-size: var(--font-size-xs);
                  color: var(--text-secondary);
                }

                .hero-redquench {
                  font-size: var(--font-size-xs);
                  font-weight: var(--font-weight-medium);
                }
              }
            }
          }
        }
      }

      &.power {
        width: 100px;
        min-width: 100px;
      }

      &.level,
      &.server {
        width: 70px;
        min-width: 70px;
      }

      &.announcement {
        min-width: 150px;
      }
    }
  }
}

@media (max-width: 768px) {
  .club-warrank-container {
    padding: var(--spacing-xs);
  }

  .header-section {
    padding: var(--spacing-md);
  }

  .function-section {
    padding: var(--spacing-xs) var(--spacing-md);
  }

  .alliance-tabs-section {
    padding: var(--spacing-xs) var(--spacing-xs);
  }

  .table-content {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .announcement-section,
  .alliance-tabs-section,
  .table-container {
    width: 1380px;
    min-width: 1380px;
    max-width: none;
  }

  .alliance-tabs-section {
    overflow: visible;
    justify-content: center;

    .alliance-tab {
      flex: 1 1 0;
      min-width: 0;
      white-space: nowrap;
    }
  }

  .table-container {
    overflow-x: visible;
    overflow-y: auto;
  }

  :deep(.n-date-picker) {
    width: 180px !important;
  }
}
</style>
