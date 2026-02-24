<template>
  <MyCard class="club-info" :statusClass="{ active: !!club }">
    <template #icon>
      <img src="/icons/1733492491706152.png" alt="俱乐部图标" />
    </template>
    <template #title>
      <h3>俱乐部信息</h3>
      <p>军团/俱乐部概览与成员</p>
    </template>
    <template #badge>
      <span>{{ club ? "已加入" : "暂无俱乐部" }}</span>
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
            <!-- 申请列表按钮 -->
            <n-button v-if="canKick" size="small" @click="getApplyList">申请列表</n-button>
            <n-button size="small" @click="refreshClub">刷新</n-button>
          </n-space>
        </div>

        <!-- 申请列表悬浮界面 -->
        <n-modal
          v-model:show="showApplyList"
          title="俱乐部申请列表"
          :mask-closable="true"
          :show-close-button="true"
          :close-on-esc="true"
          preset="card"
          :show-footer="false"
          :style="{ width: '700px', maxHeight: '80vh' }"
          :content-style="{ padding: '0', maxHeight: 'calc(80vh - 60px)', overflow: 'auto' }"
        >
          <template #header-extra>
            <n-space size="small">
              <n-button
                size="small"
                type="primary"
                @click="approveAll"
                :disabled="applyList.length === 0"
              >
                一键通过
              </n-button>
              <n-button
                size="small"
                type="error"
                @click="rejectAll"
                :disabled="applyList.length === 0"
              >
                一键拒绝
              </n-button>
            </n-space>
          </template>
          <div v-if="loadingApply" class="loading">
            <n-spin size="small" />
            <span style="margin-left: 8px">正在加载申请列表...</span>
          </div>
          <div v-else-if="applyList.length === 0" class="empty-apply">
            <n-empty description="暂无申请" />
          </div>
          <div v-else class="apply-list-container">
            <div
              class="apply-list"
              :style="{ maxHeight: '800px', overflowY: 'auto' }"
            >
              <div
                v-for="apply in applyList"
                :key="apply.roleId"
                class="apply-item"
                :class="{ 'apply-item-hover': hoveredItemId === apply.roleId }"
                @mouseenter="hoveredItemId = apply.roleId"
                @mouseleave="hoveredItemId = null"
              >
                <div class="apply-left">
                  <n-avatar
                    :size="28"
                    :src="apply.headImg || '/icons/xiaoyugan.png'"
                  />
                  <div class="apply-info">
                    <div class="apply-name">
                      {{ apply.name }}(ID:{{ apply.roleId }})
                    </div>
                    <div class="apply-details">
                      <span>等级: {{ apply.level || 0 }}</span>
                      <span class="apply-power">{{
                        formatNumber(apply.power || 0)
                      }}</span>
                      <span v-if="apply.serverId"
                        >服务器: {{ apply.serverId }}</span
                      >
                    </div>
                    <div v-if="apply.applyReason" class="apply-reason">
                      申请留言: {{ apply.applyReason }}
                    </div>
                  </div>
                </div>
                <div class="apply-right">
                  <n-space size="small">
                    <n-button
                      size="tiny"
                      type="primary"
                      @click="approveApply(apply.roleId)"
                    >
                      通过
                    </n-button>
                    <n-button size="tiny" @click="rejectApply(apply.roleId)">
                      拒绝
                    </n-button>
                  </n-space>
                </div>
              </div>
            </div>
          </div>
        </n-modal>

        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane name="overview" tab="概览" display-directive="show:lazy">
            <div class="overview">
              <n-grid x-gap="12" y-gap="12" cols="2" item-responsive>
                <!-- 头部信息 -->
                <n-gi span="2">
                  <n-card embedded :bordered="false" content-style="padding: 16px;">
                    <n-thing>
                      <template #avatar>
                        <n-avatar
                          :size="64"
                          :src="club.logo || '/icons/xiaoyugan.png'"
                          style="box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                        />
                      </template>
                      <template #header>
                        <span style="font-size: 18px; font-weight: bold;">{{ club.name }}</span>
                      </template>
                      <template #description>
                        <n-space size="small" style="margin-top: 4px;">
                          <n-tag size="small" :bordered="false" type="warning">ID: {{ club.id }}</n-tag>
                          <n-tag size="small" :bordered="false" type="info">服务器: {{ club.serverId - 27 }}</n-tag>
                          <n-tag size="small" :bordered="false" type="success">成员: {{ memberCount }}</n-tag>
                        </n-space>
                      </template>
                      <template #header-extra>
                        <n-button
                          size="small"
                          :type="legionSignedIn ? 'success' : 'primary'"
                          :secondary="legionSignedIn"
                          @click="signInLegion"
                          :disabled="legionSignedIn"
                        >
                          <template #icon>
                            <n-icon><ShieldCheckmark /></n-icon>
                          </template>
                          {{ legionSignedIn ? "已签到" : "俱乐部签到" }}
                        </n-button>
                      </template>
                    </n-thing>
                  </n-card>
                </n-gi>

                <!-- 统计数据 -->
                <n-gi>
                  <n-card size="small" embedded :bordered="false" style="height: 100%;">
                    <n-statistic label="战力">
                      <template #prefix>
                        <n-icon color="#18a058"><BarChart /></n-icon>
                      </template>
                      {{ formatNumber(clubOverview.power) }}
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small" embedded :bordered="false" style="height: 100%;">
                    <n-statistic label="红粹">
                      <template #prefix>
                        <n-icon color="#d03050"><Flame /></n-icon>
                      </template>
                      {{ clubOverview.redQuench }}
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small" embedded :bordered="false" style="height: 100%;">
                    <n-statistic label="当前BossId">
                      <template #prefix>
                        <n-icon color="#8a2be2"><Skull /></n-icon>
                      </template>
                      {{ clubOverview.currentBossId }}
                    </n-statistic>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card size="small" embedded :bordered="false" style="height: 100%;">
                    <n-statistic label="Boss剩余血量">
                      <template #prefix>
                        <n-icon color="#f0a020"><Skull /></n-icon>
                      </template>
                      {{ clubOverview.currentHP }}
                    </n-statistic>
                  </n-card>
                </n-gi>

                <!-- Boss 击杀情况 -->
                <n-gi span="2" v-if="clubOverview.unfoughtBosses && clubOverview.unfoughtBosses.length > 0">
                  <n-alert type="warning" :bordered="false">
                    <template #icon>
                      <n-icon><Skull /></n-icon>
                    </template>
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                      <div>
                        <span style="font-weight: bold;">Boss 击杀情况</span>
                        <div style="margin-top: 4px; font-size: 12px;">
                          已击杀: {{ 150 - clubOverview.unfoughtBosses.length }} / 150
                          <span style="margin-left: 12px; color: #d03050;">遗漏: {{ clubOverview.unfoughtBosses.length }}</span>
                        </div>
                      </div>
                    </div>
                    <n-collapse arrow-placement="right" style="margin-top: 8px;">
                      <n-collapse-item title="展开查看遗漏Boss列表" name="1">
                        <n-space size="small" style="margin-top: 8px;">
                          <n-tag v-for="boss in clubOverview.unfoughtBosses" :key="boss" type="error" size="small" :bordered="false">
                            {{ boss }}
                          </n-tag>
                        </n-space>
                      </n-collapse-item>
                    </n-collapse>
                  </n-alert>
                </n-gi>

                <!-- 公告 -->
                <n-gi span="2" v-if="club.announcement">
                  <n-card size="small" title="公告" embedded :bordered="false">
                    <template #header-extra>
                      <n-icon size="18" color="#f0a020"><Megaphone /></n-icon>
                    </template>
                    <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #666;">
                      {{ club.announcement }}
                    </div>
                  </n-card>
                </n-gi>

                <!-- 会长 -->
                <n-gi span="2" v-if="leader">
                  <n-card size="small" title="会长" embedded :bordered="false">
                    <template #header-extra>
                      <n-icon size="18" color="#2080f0"><Person /></n-icon>
                    </template>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <n-avatar
                        round
                        :size="40"
                        :src="leader.headImg || '/icons/xiaoyugan.png'"
                        style="border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                      />
                      <div>
                        <div style="font-weight: bold; font-size: 14px;">{{ leader.name }}</div>
                        <div style="font-size: 12px; color: #999;">ID: {{ leader.roleId }}</div>
                      </div>
                    </div>
                  </n-card>
                </n-gi>
              </n-grid>
            </div>
          </n-tab-pane>

          <n-tab-pane name="members" tab="成员" display-directive="show:lazy">
            <div class="members" ref="exportDom">
              <n-data-table
                :columns="memberColumns"
                :data="topMembers"
                :bordered="false"
                size="small"
                striped
                :row-key="(row) => row.roleId"
                flex-height
                :scroll-x="650"
                style="height: 600px"
              />
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="history"
            tab="俱乐部历史战绩"
            display-directive="show:lazy"
          >
            <ClubHistoryRecords inline />
          </n-tab-pane>

          <n-tab-pane
            name="weirdtower"
            tab="怪异塔信息"
            display-directive="show:lazy"
          >
            <ClubWeirdTowerInfo inline />
          </n-tab-pane>

          <n-tab-pane
            name="carsocre"
            tab="赛车积分信息"
            display-directive="show:lazy"
          >
            <CarScoreInfo inline />
          </n-tab-pane>
        </n-tabs>
      </div>
    </template>
  </MyCard>

  <!-- 玩家信息模态框 -->
  <n-modal
    v-model:show="showPlayerInfoModal"
    preset="card"
    title="成员信息"
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
        <n-avatar
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
          <div class="detail-row">
            <span
              >战力:
              <span class="highlight">{{
                formatNumber(playerInfo.power)
              }}</span></span
            >
            <span>服务器: {{ playerInfo.serverName }}</span>
          </div>
          <div class="detail-row">
            <span>俱乐部: {{ playerInfo.legionName }}</span>
          </div>
          <div class="detail-row">
            <span
              >总红数:
              <span class="red-text">{{ playerInfo.totalRedCount }}</span></span
            >
            <span
              >总开孔:
              <span class="blue-text">{{
                playerInfo.totalHoleCount
              }}</span></span
            >
            <span
              >四圣:
              <span class="green-text">{{ playerInfo.holyBeast }}</span></span
            >
          </div>
        </div>
      </div>

      <div class="hero-section">
        <h4>武将阵容</h4>
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
            v-for="(hero, index) in playerInfo.heroList"
            :key="hero.heroId || index"
            class="hero-item"
            @click="selectHeroInfo(hero)"
          >
            <n-avatar
              round
              :size="40"
              :src="hero.heroAvate"
              style="cursor: pointer"
            />
            <div class="hero-info">
              <span class="hero-name">{{ hero.heroName }}</span>
              <div class="hero-stats">
                <span>战力: {{ formatNumber(hero.power || 0) }}</span>
                <span>星级: {{ hero.star || 0 }}</span>
                <span>红数: {{ hero.red || 0 }}</span>
                <span>开孔: {{ hero.hole || 0 }}</span>
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
            武将列表未定义
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <n-button @click="showPlayerInfoModal = false">关闭</n-button>
    </template>
  </n-modal>

  <!-- 武将详情模态框 -->
  <n-modal
    v-model:show="showHeroModal"
    class="hero-detail-modal"
    preset="card"
    title="武将详情"
    :style="{ width: '600px' }"
    :bordered="false"
    :segmented="{ content: 'soft', footer: 'soft' }"
  >
    <div v-if="heroModealTemp" class="hero-modal-content">
      <div class="hero-modal-header">
        <n-avatar
          round
          :size="80"
          :src="heroModealTemp.heroAvate"
          class="hero-modal-avatar"
        />
        <div class="hero-modal-basic">
          <h3 class="hero-modal-name">{{ heroModealTemp.heroName }}</h3>
          <div class="hero-modal-stats">
            <span class="stat-item">{{
              formatNumber(heroModealTemp.power)
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
            {{ formatNumber(heroModealTemp.power) }}
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
              <div
                v-for="item in heroModealTemp.PearlInfo.slotMap"
                :key="item.id"
                class="ModalEquipment"
                :style="'background-color:' + item.value"
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
  </n-modal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, reactive, watch, nextTick } from "vue";
import { useMessage, useDialog, NDataTable, NModal, NAvatar, NTag, NDescriptions, NDescriptionsItem, NButton, NSpace, NIcon, NGrid, NGi, NStatistic, NThing, NAlert, NCollapse, NCollapseItem, NCard } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { Copy, Refresh, People, BarChart, Flame, Skull, Megaphone, Person, ShieldCheckmark } from "@vicons/ionicons5";
import ClubHistoryRecords from "./ClubHistoryRecords.vue";
import ClubWeirdTowerInfo from "./ClubWeirdTowerInfo.vue";
import CarScoreInfo from "./CarScoreInfo.vue";
import { $emit } from "@/stores/events";
import { HERO_DICT, legacycolor, HeroFillInfo, getLineupType, LINEUP_RULES } from "@/utils/HeroList";
import html2canvas from 'html2canvas';
import { downloadCanvasAsImage } from "@/utils/imageExport";

const tokenStore = useTokenStore();
const message = useMessage();
const dialog = useDialog();

const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);

const membersObj = computed(() => club.value?.members || {});
const members = computed(() => Object.values(membersObj.value || {}));
const memberCount = computed(() => members.value.length);

const leader = computed(() => {
  const lid = club.value?.leaderId;
  if (!lid) return null;
  return members.value.find((m) => Number(m.roleId) === Number(lid)) || null;
});

const topMembers = computed(() => {
  return [...members.value].sort((a, b) => {
    // 1. 职位排序：会长(1) > 副会长(2) > 成员(0)
    const jobA = a.job === 0 ? 99 : a.job;
    const jobB = b.job === 0 ? 99 : b.job;
    if (jobA !== jobB) return jobA - jobB;

    // 2. 红淬排序：降序
    const redA = Number(a.custom?.red_quench_cnt || 0);
    const redB = Number(b.custom?.red_quench_cnt || 0);
    if (redA !== redB) return redB - redA;

    // 3. 战力排序：降序（兜底）
    const powerA = Number(a.power || a.custom?.s_power || 0);
    const powerB = Number(b.power || b.custom?.s_power || 0);
    return powerB - powerA;
  });
});

const showPlayerInfoModal = ref(false);
const playerInfo = ref(null);
const queryLoading = ref(false);
const showHeroModal = ref(false);
const heroModealTemp = ref(null);
const batchLoading = ref(false);
const isExporting = ref(false);
const exportDom = ref(null);

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

      // 兼容 id 和 heroId
      const id = hero.heroId || hero.id;
      
      let heroInfo = HERO_DICT[id] || {};
      let equipmentInfo = hero.equipment
        ? getEquipment(hero.equipment)
        : { redCount: 0, holeCount: 0 };

      // 检查英雄基本信息
      const heroId = id || `unknown_${index}`;
      const heroName = hero.heroName || hero.name || heroInfo.name || `未知武将_${index}`;

      let tempObj = {
        heroId: heroId, //英雄ID
        artifactId: hero.artifactId || "", //英雄装备ID，用于匹配鱼灵信息
        power: hero.power || 0, //英雄战力
        star: hero.star || 0, //英雄星级
        equipment: hero.equipment, //英雄具体孔数和红数
        heroName: heroName, //英雄姓名
        heroAvate: hero.heroAvate || hero.headImg || heroInfo.avatar || "",
        level: hero.level || 0, //英雄等级
        hole: equipmentInfo.holeCount, //英雄开孔数量
        red: equipmentInfo.redCount, //英雄红数
        // 兼容 hB 和 fourBasest
        HolyBeast: (hero.hB?.active === true) || (hero.fourBasest?.level > 0), //激活四圣
        HBlevel: hero.hB?.order || hero.fourBasest?.level || 0, //四圣等级
        // 添加英雄详情信息
        skillList: hero.skillList || [],
        attributeList: hero.attributeList || [],
        battleTeamSlot: hero.battleTeamSlot, //阵容站位
      };

      // 只添加有效的英雄
      if (heroId) {
        redCount += tempObj.red;
        holeCount += tempObj.hole;
        heroList.push(tempObj);
      }
    });
  } catch (error) {
    console.error("处理英雄信息时发生错误:", error);
    heroList = [];
  }
  // 按站位排序
  heroList.sort((a, b) => a.battleTeamSlot - b.battleTeamSlot);
  
  return { redCount, holeCount, heroList };
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

const selectHeroInfo = (heroInfo) => {
  showHeroModal.value = true;
  heroModealTemp.value = heroInfo;
};

const fetchAllMembersLineup = async () => {
  if (batchLoading.value) return;

  const token = tokenStore.selectedToken;
  if (!token) return;

  const wsStatus = tokenStore.getWebSocketStatus(token.id);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法获取阵容信息");
    return;
  }

  const memberList = members.value;
  if (!memberList.length) return;

  batchLoading.value = true;
  message.loading("正在获取成员阵容信息...");

  const memberIds = memberList.map((m) => m.roleId);
  const chunkSize = 5;

  try {
    for (let i = 0; i < memberIds.length; i += chunkSize) {
      const chunk = memberIds.slice(i, i + chunkSize);
      const promises = chunk.map(async (roleId) => {
        try {
          const roleRes = await tokenStore.sendMessageWithPromise(
            token.id,
            "rank_getroleinfo",
            {
              roleId: Number(roleId),
              includeBottleTeam: false,
              isSearch: false,
              bottleType: 0,
              includeHero: true,
              includeHeroDetail: true,
              includePearl: true,
            },
            5000
          );

          if (roleRes && roleRes.roleInfo) {
            let heroList = [];
            if (roleRes.roleInfo.heroes) {
              const res = getHeroInfo(roleRes.roleInfo.heroes);
              heroList = res.heroList;
            }
            
            const lineupType = getLineupType(heroList);

            if (
              tokenStore.gameData?.legionInfo?.info?.members &&
              tokenStore.gameData.legionInfo.info.members[roleId]
            ) {
              tokenStore.gameData.legionInfo.info.members[roleId].lineupType =
                lineupType;
            }
          }
        } catch (e) {
          console.error(`Failed to fetch info for ${roleId}`, e);
        }
      });

      await Promise.all(promises);
    }
    message.success("阵容信息获取完成");
  } catch (error) {
    message.error(`获取失败: ${error.message}`);
  } finally {
    batchLoading.value = false;
  }
};

const handleExportImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    message.error("未找到要导出的内容");
    return;
  }

  try {
    isExporting.value = true;
    message.loading("正在生成图片，请稍候...");

    // 等待Vue更新DOM（移除操作列等）
    await nextTick();

    // 获取 table-container
    const tableContainer = exportDom.value.querySelector('.n-data-table');
    
    // 临时调整表格容器高度，确保所有内容可见
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
      
      // 保存外层table容器的样式
      tableContainer.dataset.originalHeight = tableContainer.style.height;
      tableContainer.style.height = "auto";
    }

    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片
      backgroundColor: "#ffffff", // 避免透明背景
      logging: false, // 关闭控制台日志
      allowTaint: true, // 允许跨域图片污染画布
    });

    // 6. Canvas转图片链接并下载
    const dateStr = new Date().toLocaleDateString().replace(/\//g, "-");
    const filename = `俱乐部成员信息_${dateStr}.png`;
    downloadCanvasAsImage(canvas, filename);

    message.success("图片导出成功");
  } catch (err) {
    console.error("DOM转图片失败：", err);
    message.error("导出图片失败，请重试");
  } finally {
    // 恢复原始样式
    const tableContainer = exportDom.value?.querySelector('.n-data-table');
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
      
      // 恢复外层table容器样式
      if (tableContainer.dataset.originalHeight) {
        tableContainer.style.height = tableContainer.dataset.originalHeight;
      } else {
        tableContainer.style.removeProperty('height');
      }
      delete tableContainer.dataset.originalHeight;
    }
    
    isExporting.value = false;
  }
};

// 查询玩家信息
const fetchTargetInfo = async (roleId) => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询信息");
    return;
  }

  queryLoading.value = true;

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
      message.warning("未查询到玩家信息");
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

    // 计算阵容类型
    const lineupType = getLineupType(heroAndholdAndRed.heroList);

    // 更新本地成员列表中的阵容信息（如果存在）
    if (
      tokenStore.gameData?.legionInfo?.info?.members &&
      tokenStore.gameData.legionInfo.info.members[roleId]
    ) {
      tokenStore.gameData.legionInfo.info.members[roleId].lineupType =
        lineupType;
    }

    const playerData = {
      id: roleId,
      name: result.roleInfo.name,
      headImg: result.roleInfo.headImg,
      power: result.roleInfo.power,
      level: result.roleInfo.level,
      serverName: result.roleInfo.serverName,
      legionName: result.legionInfo?.name || "无",
      redQuench: roleRedQuench,
      holyBeast: heroAndholdAndRed.heroList.filter((hero) => hero.HolyBeast)
        .length,
      maxPower: formatNumber(legionMaxPower),
      currentRedDrum: roleRedQuench,
      maxRedDrum: roleMaxRed,
      totalRedCount: totalRedCount,
      totalHoleCount: totalHoleCount,
      legionRedQuench: legionRedQuench,
      legionMaxRed: legionMaxRed,
      heroList: heroAndholdAndRed.heroList,
      legacy: result.roleInfo.legacy?.color || 0,
      lineupType: lineupType,
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

// 成员表格列定义
const memberColumns = computed(() => {
  const cols = [
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
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              objectFit: "cover",
            },
            alt: row.name,
          });
        }
        return h(
          "div",
          {
            class: "member-avatar-placeholder-cell",
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "#999",
            },
          },
          row.name?.charAt(0) || "?",
        );
      },
    },
    {
      title: "成员",
      key: "name",
      align: "left",
      minWidth: 150, // 增加最小宽度
      render: (row) => {
        return h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center", // 垂直居中
              cursor: "pointer",
              whiteSpace: "nowrap", // 防止换行
            },
            onClick: () => fetchTargetInfo(row.roleId),
          },
          [
            h(
              "span",
              { style: { fontWeight: "500", color: "#1890ff", lineHeight: "1.2" } },
              row.name,
            ),
            h(
              "span",
              { style: { fontSize: "12px", color: "#999", lineHeight: "1.2", marginTop: "2px" } },
              `ID: ${row.roleId}`,
            ),
          ],
        );
      },
    },
    {
      title: "战力",
      key: "power",
      width: 100,
      align: "center",
      render: (row) => formatNumber(row.power || row.custom?.s_power || 0),
    },
    {
      title: "红淬",
      key: "redQuench",
      width: 80,
      align: "center",
      render: (row) =>
        h(
          "span",
          { style: { color: "#ff4d4f" } },
          redQuenchlabel(row.custom?.red_quench_cnt || 0),
        ),
    },
    {
      title: "阵容",
      key: "lineupType",
      width: 80,
      align: "center",
      render: (row) => {
        if (!row.lineupType) return "-";
        const rule = LINEUP_RULES.find((r) => r.name === row.lineupType);
        const colorProps = rule ? rule.colorProps : {};
        return h(
          NTag,
          {
            size: "small",
            bordered: false,
            color: colorProps,
          },
          { default: () => row.lineupType },
        );
      },
    },
  ];

  if (!isExporting.value) {
    cols.push({
      title: "职位",
      key: "job",
      width: 80,
      align: "center",
      render: (row) => jobLabel(row.job),
    });
  }

  if (canKick.value && !isExporting.value) {
    cols.push({
      title: "操作",
      key: "actions",
      width: 80,
      align: "center",
      render: (row) => {
        if (row.job !== 1) {
          return h(
            NButton,
            {
              size: "tiny",
              type: "error",
              ghost: true,
              style: { fontSize: "12px" },
              onClick: () => kickMember(row.roleId, row.name),
            },
            { default: () => "踢出" },
          );
        }
        return null;
      },
    });
  }

  return [
    {
      title: () => h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            padding: "0 8px"
          },
        },
        [
            h("span", { style: { fontSize: "16px", fontWeight: "bold", color: "#333" } }, "俱乐部成员详情"),
            !isExporting.value ? h(
                'div',
                { style: { display: 'flex', gap: '8px' } },
                [
                    h(
                        NButton,
                        {
                            size: 'tiny',
                            type: 'primary',
                            secondary: true,
                            onClick: (e) => { e.stopPropagation(); fetchAllMembersLineup(); },
                            disabled: batchLoading.value
                        },
                        {
                            default: () => '获取阵容',
                            icon: () => h(NIcon, null, { default: () => h(Refresh) })
                        }
                    ),
                    h(
                        NButton,
                        {
                            size: 'tiny',
                            type: 'info',
                            secondary: true,
                            onClick: (e) => { e.stopPropagation(); handleExportImage(); },
                            disabled: isExporting.value
                        },
                        {
                            default: () => '导出图片',
                            icon: () => h(NIcon, null, { default: () => h(Copy) })
                        }
                    )
                ]
            ) : null
        ]
      ),
      key: "title_group",
      align: "center",
      children: cols,
    },
  ];
});

// 获取当前角色在俱乐部中的职位
const currentMemberJob = computed(() => {
  const roleId = tokenStore.gameData?.roleInfo?.role?.roleId;
  if (!roleId) return 0;
  const currentMember = members.value.find(
    (m) => Number(m.roleId) === Number(roleId),
  );
  return currentMember?.job || 0;
});

// 检查是否有踢人权限（会长或副会长）
const canKick = computed(() => {
  return [1, 2].includes(currentMemberJob.value);
});

// 踢出成员
const kickMember = (roleId, name) => {
  const token = tokenStore.selectedToken;
  if (!token) return;

  dialog.warning({
    title: "确认踢出",
    content: `确定要踢出成员 ${name} ID: ${roleId} 吗？`,
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: () => {
      // 正确的发送方式：第一个参数是命令名称，第二个参数是命令体
      tokenStore.sendMessage(token.id, "legion_kickout", {
        roleId: Number(roleId),
      });

      // 乐观更新：立即从本地成员列表中移除该成员
      if (tokenStore.gameData?.legionInfo?.info?.members) {
        // 删除成员信息
        delete tokenStore.gameData.legionInfo.info.members[roleId];
        // 刷新俱乐部信息以确保数据同步
        setTimeout(() => {
          refreshClub();
        }, 1000);
      }

      message.info(`正在踢出成员 ID: ${roleId}`);
    },
  });
};

// 获取申请列表
const getApplyList = async () => {
  const token = tokenStore.selectedToken;
  if (!token) return;

  // 显示申请列表界面
  showApplyList.value = true;
  // 设置加载状态
  loadingApply.value = true;
  applyList.value = [];

  try {
    message.info("正在获取申请列表");
    // 使用 Promise 方式直接获取响应
    const responseBody = await tokenStore.sendMessageWithPromise(
      token.id,
      "legion_applylist",
      {},
      10000 // 10秒超时
    );
    
    // 直接处理响应数据
    handleApplyListResp({ body: responseBody });
  } catch (error) {
    loadingApply.value = false;
    message.error("获取申请列表失败: " + (error.message || "未知错误"));
    console.error("获取申请列表出错:", error);
  }
};

// 通过申请
const approveApply = (roleId) => {
  const token = tokenStore.selectedToken;
  if (!token) return;

  // 发送通过申请命令
  tokenStore.sendMessage(token.id, "legion_agree", {
    roleId: Number(roleId),
  });

  // 从申请列表中移除该成员
  applyList.value = applyList.value.filter((apply) => apply.roleId !== roleId);
  message.info(`已通过成员 ID: ${roleId} 的申请`);
  
  // 刷新俱乐部信息
  setTimeout(() => {
    refreshClub();
  }, 1000);
};

// 拒绝申请
const rejectApply = (roleId) => {
  const token = tokenStore.selectedToken;
  if (!token) return;

  // 发送拒绝申请命令
  tokenStore.sendMessage(token.id, "legion_ignore", {
    roleId: Number(roleId),
  });

  // 从申请列表中移除该成员
  applyList.value = applyList.value.filter((apply) => apply.roleId !== roleId);
  message.info(`已拒绝成员 ID: ${roleId} 的申请`);
};

// 一键通过所有申请
const approveAll = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;

  const count = applyList.value.length;
  if (count === 0) return;

  // 遍历所有申请项，发送通过命令
  applyList.value.forEach((apply) => {
    tokenStore.sendMessage(token.id, "legion_agree", {
      roleId: Number(apply.roleId),
    });
  });

  // 清空申请列表
  applyList.value = [];
  message.success(`已通过所有 ${count} 个申请`);
  
  // 刷新俱乐部信息
  setTimeout(() => {
    refreshClub();
  }, 1000);
};

// 一键拒绝所有申请
const rejectAll = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;

  const count = applyList.value.length;
  if (count === 0) return;

  // 遍历所有申请项，发送拒绝命令
  applyList.value.forEach((apply) => {
    tokenStore.sendMessage(token.id, "legion_ignore", {
      roleId: Number(apply.roleId),
    });
  });

  // 清空申请列表
  applyList.value = [];
  message.success(`已拒绝所有 ${count} 个申请`);
};

const activeTab = ref("overview");

// 申请列表状态
const showApplyList = ref(false);
const loadingApply = ref(false);
const applyList = ref([]);

// 选择状态
const hoveredItemId = ref(null);

// 处理申请列表响应
const handleApplyListResp = (session) => {
  // 从session对象中提取响应内容
  const responseBody = session.body;

  if (responseBody) {
    // 检查是否为空对象
    if (Object.keys(responseBody).length === 0) {
      applyList.value = [];
      loadingApply.value = false;
      message.info("暂无申请");
      return;
    }
    
    if (typeof responseBody === "object") {
      // 处理对象类型的响应

      // 检查是否有roleList数组字段（根据用户要求）
      if (Array.isArray(responseBody.roleList)) {
        // 从roleList数组中提取申请列表数据
        // 过滤掉无效的申请项（没有roleId的项）
        const validRoles = responseBody.roleList.filter(
          (role) => role.roleId && role.name,
        );
        applyList.value = validRoles.map((role) => ({
          headImg: role.headImg,
          level: role.level,
          name: role.name,
          power: role.power,
          roleId: role.roleId,
          serverId: role.ext?.["server_id"] || "",
          applyReason: role.ext?.["legion_apply_reason"] || "",
        }));
        // 停止加载状态
        loadingApply.value = false;
        message.success(`获取到 ${validRoles.length} 个申请`);
      } else if (
        Array.isArray(responseBody.applyList) ||
        Array.isArray(responseBody.list) ||
        Array.isArray(responseBody.data)
      ) {
        // 兼容其他可能的数组字段
        const applyArray =
          responseBody.applyList || responseBody.list || responseBody.data;
        // 过滤掉无效的申请项，并提取服务区和申请留言信息
        applyList.value = applyArray
          .filter((apply) => apply.roleId && apply.name)
          .map((apply) => ({
            ...apply,
            serverId: apply.ext?.["server_id"] || "",
            applyReason: apply.ext?.["legion_apply_reason"] || "",
          }));
        loadingApply.value = false;
        message.success(`获取到 ${applyList.value.length} 个申请`);
      } else if (Array.isArray(responseBody)) {
        // 直接是数组的情况
        // 过滤掉无效的申请项，并提取服务区和申请留言信息
        applyList.value = responseBody
          .filter((apply) => apply.roleId && apply.name)
          .map((apply) => ({
            ...apply,
            serverId: apply.ext?.["server_id"] || "",
            applyReason: apply.ext?.["legion_apply_reason"] || "",
          }));
        loadingApply.value = false;
        message.success(`获取到 ${applyList.value.length} 个申请`);
      } else {
        // 没有有效的申请数据，设置为空数组
        applyList.value = [];
        loadingApply.value = false;
        message.info("暂无申请");
      }
    } else if (Array.isArray(responseBody)) {
      // 直接是数组的情况
      // 过滤掉无效的申请项，并提取服务区和申请留言信息
      applyList.value = responseBody
        .filter((apply) => apply.roleId && apply.name)
        .map((apply) => ({
          ...apply,
          serverId: apply.ext?.["server_id"] || "",
          applyReason: apply.ext?.["legion_apply_reason"] || "",
        }));
      loadingApply.value = false;
      message.success(`获取到 ${applyList.value.length} 个申请`);
    } else {
      // 处理其他类型的响应
      applyList.value = [];
      loadingApply.value = false;
      message.info("暂无申请");
    }
  } else {
    // 没有申请数据或格式不正确
    applyList.value = [];
    loadingApply.value = false;
    message.info("暂无申请");
  }
};

// 组件挂载时添加事件监听器
onMounted(() => {
  // 监听申请列表响应事件（已改为Promise直接处理，不再监听）
  // $emit.on("legion_applylistresp", handleApplyListResp);
});

watch(activeTab, (val) => {
  if (val === "members" && !batchLoading.value) {
    const hasLineup = members.value.some((m) => m.lineupType);
    if (!hasLineup) {
      fetchAllMembersLineup();
    }
  }
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  // 移除申请列表响应事件监听（已改为Promise直接处理，不再监听）
  // $emit.off("legion_applylistresp", handleApplyListResp);
});

// 今日是否已进行俱乐部签到
const legionSignedIn = computed(() => {
  const ts = Number(
    tokenStore.gameData?.roleInfo?.role?.statisticsTime?.["legion:sign:in"] ||
      0,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySec = Math.floor(today.getTime() / 1000);
  return ts > todaySec;
});

const signInLegion = () => {
  const token = tokenStore.selectedToken;
  if (!token || legionSignedIn.value) return;
  tokenStore.sendMessage(token.id, "legion_signin");
  tokenStore.sendMessage(token.id, "role_getroleinfo");
  message.info("俱乐部签到");
};

// 兼容不同服务端字段：从 info.info 和顶层 info 以及 statistics 中聚合
const clubOverview = computed(() => {
  const i = info.value || {};
  const base = i.info || {};
  const boss = base.currentBoss || {};
  const stats = i.statistics || i.stat || {};

  const power = Number(base.power ?? i.power ?? base.s_power ?? i.s_power ?? 0);
  const dan = base.dan ?? i.dan ?? base.rank ?? i.rank ?? "-";
  const redQuench = Number(
    base.redQuenchCnt ??
      i.redQuenchCnt ??
      stats["red:quench"] ??
      stats["red_quench"] ??
      0,
  );
  const lastWarRank =
    stats["last:war:rank"] ??
    stats["lastWarRank"] ??
    stats["legion:last:war:rank"] ??
    "-";
  const noApply = Boolean(base.noApply ?? i.noApply);

  const currentHP = formatNumber(boss.currentHP || 0);
  const currentBossId = boss.bossId || 0;
  const unfoughtBosses = [];
  for (let k = 1; k <= 150; k++) {
    if (!tokenStore.gameData?.roleInfo?.role?.statistics[`lb:${k}`]) {
      unfoughtBosses.push(k);
    }
  }

  return {
    power,
    dan: dan ?? "-",
    redQuench,
    lastWarRank,
    noApply,
    currentHP,
    currentBossId,
    unfoughtBosses,
  };
});

const refreshClub = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  tokenStore.sendMessage(token.id, "legion_getinfo");
  
  // 如果当前在成员页，也刷新阵容信息
  if (activeTab.value === "members") {
    fetchAllMembersLineup();
  }
};

const jobLabel = (job) => {
  if (job === 1) return "会长";
  if (job === 2) return "副会长";
  return "成员";
};

const redQuenchlabel = (redQuenchl) => {
  return redQuenchl + "红";
};

const formatNumber = (num) => {
  const n = Number(num || 0);
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "兆";
  if (n >= 1e8) return (n / 1e8).toFixed(2) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(2) + "万";
  return String(n);
};
</script>

<style scoped lang="scss">
.club-info {
  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-sm);
  }

  .overview {
    /* No specific styles needed for grid layout */
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .member-row {
    display: flex;
    align-items: flex-start;
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
    font-feature-settings: "tnum" 1;
    font-variant-numeric: tabular-nums;
  }

  .member-row .red-quench {
    font-feature-settings: "tnum" 1;
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

/* 申请列表样式 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.empty-apply {
  padding: 30px 0;
}

.apply-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apply-list {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.apply-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-item:last-child {
  border-bottom: none;
}

/* 悬停效果 */
.apply-item-hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 选中状态 */
.apply-item-selected {
  background: var(--primary-color-light);
  border-left: 3px solid var(--primary-color);
}

.apply-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.apply-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.apply-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.apply-details {
  display: flex;
  gap: 12px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.apply-power {
  font-feature-settings: "tnum" 1;
  font-variant-numeric: tabular-nums;
}

.apply-reason {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}

.apply-right {
  display: flex;
  gap: 8px;
}

/* 批量操作栏样式 */
.apply-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.selected-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: auto;
}

/* 滚动条样式 */
.apply-list::-webkit-scrollbar {
  width: 6px;
}

.apply-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.apply-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.apply-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* 玩家信息模态框样式 */
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

.player-info-detail .detail-row {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
  font-size: var(--font-size-sm, 14px);
  color: var(--text-secondary, #666);
}

.red-text { color: #ff4d4f; }
.green-text { color: #52c41a; }
.blue-text { color: #1890ff; }
.highlight { color: #1890ff; font-weight: bold; }

/* 武将列表样式 */
.hero-section {
  margin-top: 20px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: var(--font-size-base, 14px);
    font-weight: var(--font-weight-bold, bold);
  }
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
  cursor: pointer;

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

  span {
    padding: 2px 6px;
    background: var(--bg-primary, #fff);
    border-radius: var(--border-radius-full, 99px);
    border: 1px solid var(--border-light, #eee);
  }

  span.opened {
    background: rgba(82, 196, 26, 0.1);
    color: var(--success-color, #52c41a);
    border-color: var(--success-color, #52c41a);
  }

  span.closed {
    background: rgba(250, 173, 20, 0.1);
    color: var(--warning-color, #faad14);
    border-color: var(--warning-color, #faad14);
  }
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
</style>
