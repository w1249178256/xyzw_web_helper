<template>
  <MyCard class="lineup-saver" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img
        src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"
        alt="阵容图标"
      />
    </template>
    <template #title>
      <h3>阵容助手</h3>
      <p>保存阵容、快速切换</p>
    </template>
    <template #badge>
      <span>{{ state.isRunning ? "运行中" : "已停止" }}</span>
    </template>
    <template #default>
      <div class="lineup-container">
        <div class="toolbar">
          <n-button
            type="primary"
            size="small"
            @click="refreshTeamInfo"
            :loading="loading"
          >
            刷新数据
          </n-button>
          <n-button
            size="small"
            @click="saveCurrentLineup"
            :disabled="editingHeroes.length === 0"
          >
            保存阵容
          </n-button>
          <n-button
            type="success"
            size="small"
            @click="openAddHeroModal"
            :disabled="editingHeroes.length >= 5"
          >
            上阵英雄
          </n-button>
          <n-button
            type="info"
            size="small"
            @click="savedLineupsModalVisible = true"
          >
            已保存阵容 ({{ savedLineups.length }})
          </n-button>
        </div>

        <div class="quick-switch-section">
          <h4>阵容槽位</h4>
          <div class="team-selector">
            <n-button
              v-for="teamId in availableTeams"
              :key="teamId"
              :type="currentTeamId === teamId ? 'primary' : 'default'"
              size="small"
              @click="switchTeam(teamId)"
              :loading="switchingTeamId === teamId"
            >
              阵容{{ teamId }}
            </n-button>
          </div>
        </div>

        <div class="current-team-section" v-if="currentTeamInfo">
          <h4>
            编辑阵容 (阵容槽位{{ currentTeamId }})
            <span class="drag-tip">拖拽调整站位</span>
          </h4>
          <div class="heroes-grid">
            <div
              v-for="(hero, index) in editingHeroes"
              :key="hero.heroId + '-' + hero.position"
              class="hero-item"
              :class="{
                dragging: draggedHeroId === hero.heroId,
                'drag-over': dragOverPosition === hero.position,
              }"
              draggable="true"
              @dragstart="onDragStart($event, hero)"
              @dragend="onDragEnd"
              @dragover.prevent="onDragOver($event, hero)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, hero)"
            >
              <div class="hero-position">{{ hero.position + 1 }}</div>
              <div class="hero-left" @click="showHeroRefineModal(hero)">
                <div class="hero-avatar">
                  <img
                    v-if="getHeroAvatar(hero.heroId)"
                    :src="getHeroAvatar(hero.heroId)"
                    :alt="getHeroName(hero.heroId)"
                  />
                  <div v-else class="hero-placeholder">
                    {{ getHeroName(hero.heroId)?.substring(0, 2) || "?" }}
                  </div>
                </div>
                <div class="hero-avatar-info">
                  <div class="hero-name-small-inline">
                    {{ getHeroName(hero.heroId) || `武将${hero.heroId}` }}
                  </div>
                  <div class="hero-level-small-inline" v-if="hero.level">
                    Lv.{{ hero.level }}
                  </div>
                </div>
              </div>
              <div class="hero-info" @click="showHeroRefineModal(hero)">
                <div class="hero-fish" v-if="getFishInfo(hero.artifactId)">
                  {{ getFishInfo(hero.artifactId).name }}
                  <span
                    v-if="getPearlSkillNameByArtifactId(hero.artifactId)"
                    class="hero-fish-skill-inline"
                  >
                    {{ getPearlSkillNameByArtifactId(hero.artifactId) }}
                  </span>
                  <span
                    v-if="getSlotColorsByArtifactId(hero.artifactId)"
                    class="hero-fish-slots-inline"
                  >
                    <span
                      v-for="(color, idx) in getSlotColorsByArtifactId(
                        hero.artifactId,
                      )"
                      :key="idx"
                      class="slot-dot-small"
                      :style="{ backgroundColor: color }"
                    ></span>
                  </span>
                </div>
                <div class="hero-stats" v-if="hero.power">
                  <div class="stat-row">
                    <span class="stat-power"
                      >战力{{ formatPower(hero.power) }}</span
                    >
                    <span class="stat-speed" v-if="hero.speed"
                      >速度{{ hero.speed }}</span
                    >
                  </div>
                  <div class="stat-row">
                    <span class="stat-attack" v-if="hero.attack"
                      >攻击{{ formatPower(hero.attack) }}</span
                    >
                    <span class="stat-hp" v-if="hero.hp"
                      >血量{{ formatPower(hero.hp) }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="hero-actions">
                <n-button
                  class="exchange-btn"
                  size="tiny"
                  type="warning"
                  @click.stop="openExchangeModal(hero)"
                >
                  更换
                </n-button>
                <n-button
                  class="remove-btn"
                  size="tiny"
                  type="error"
                  @click.stop="removeHero(hero)"
                >
                  下阵
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <n-modal
        v-model:show="savedLineupsModalVisible"
        preset="card"
        title="已保存的阵容"
        style="width: 900px; max-width: 90vw"
        :bordered="false"
      >
        <div v-if="savedLineups.length === 0" class="empty-tip">
          暂无保存的阵容，点击"保存阵容"开始使用
        </div>
        <div v-else class="saved-lineups-modal-content">
          <div class="team-tabs">
            <div class="team-tabs-left">
              <div
                v-for="teamId in availableTeams"
                :key="teamId"
                class="team-tab"
                :class="{ active: selectedTeamTab === teamId }"
                @click="selectedTeamTab = teamId"
              >
                槽位{{ teamId }}
                <span class="tab-count"
                  >({{ getLineupsByTeamId(teamId).length }})</span
                >
              </div>
            </div>
            <div class="team-tabs-right">
              <n-button size="tiny" @click="exportLineups"> 导出 </n-button>
              <n-upload
                :show-file-list="false"
                :custom-request="importLineups"
                accept=".json"
              >
                <n-button size="tiny">导入</n-button>
              </n-upload>
            </div>
          </div>
          <div class="lineups-list">
            <div
              v-for="(lineup, index) in getLineupsByTeamId(selectedTeamTab)"
              :key="index"
              class="lineup-card"
            >
              <div class="lineup-title-bar" @click="toggleLineupExpand(lineup)">
                <div class="lineup-title-left">
                  <span class="expand-icon">{{
                    expandedLineup === lineup ? "▼" : "▶"
                  }}</span>
                  <span class="lineup-name">{{ lineup.name }}</span>
                  <span
                    v-if="
                      lineup.weaponId !== undefined && lineup.weaponId !== null
                    "
                    class="lineup-weapon-tag"
                  >
                    {{ weapon[lineup.weaponId] || lineup.weaponId }}
                  </span>
                  <span class="lineup-time">{{
                    formatTime(lineup.savedAt)
                  }}</span>
                </div>
                <div class="lineup-quick-actions">
                  <n-button
                    size="tiny"
                    @click.stop="renameLineup(savedLineups.indexOf(lineup))"
                  >
                    重命名
                  </n-button>
                  <n-button
                    size="tiny"
                    @click.stop="showTechModal(lineup)"
                    :disabled="
                      !lineup.legionResearch ||
                      Object.keys(lineup.legionResearch).length === 0
                    "
                  >
                    科技
                  </n-button>
                  <n-button
                    type="error"
                    size="tiny"
                    @click.stop="deleteLineup(savedLineups.indexOf(lineup))"
                  >
                    删除
                  </n-button>
                  <n-button
                    type="primary"
                    size="tiny"
                    @click.stop="
                      applyLineup(lineup);
                      savedLineupsModalVisible = false;
                    "
                    :loading="lineup.applying"
                    :disabled="lineup.teamId !== currentTeamId"
                  >
                    应用
                  </n-button>
                </div>
              </div>
              <div v-if="expandedLineup === lineup" class="lineup-detail">
                <div class="lineup-heroes-row">
                  <div
                    v-for="(hero, hIdx) in lineup.heroes"
                    :key="hIdx"
                    class="lineup-hero-card"
                  >
                    <img
                      v-if="getHeroAvatar(hero.heroId)"
                      :src="getHeroAvatar(hero.heroId)"
                      class="hero-avatar"
                    />
                    <div v-else class="hero-avatar-placeholder">
                      {{ getHeroName(hero.heroId)?.[0] || "?" }}
                    </div>
                    <div class="hero-info-small">
                      <div class="hero-header-small">
                        <div class="hero-name-small">
                          {{ getHeroName(hero.heroId) || `武将${hero.heroId}` }}
                        </div>
                        <div v-if="hero.level" class="hero-level-small">
                          Lv.{{ formatLevel(hero.level) }}
                        </div>
                      </div>
                      <div v-if="hero.fishId" class="hero-fish-info">
                        <div class="hero-fish-row">
                          <span class="hero-fish-name">
                            {{ getFishNameById(hero.fishId) }}
                            <span
                              v-if="hero.skillId"
                              class="hero-fish-skill-name"
                            >
                              {{ getPearlSkillNameById(hero.skillId) }}
                            </span>
                          </span>
                          <div
                            v-if="getSlotColors(hero.slotMap)"
                            class="hero-fish-slots"
                          >
                            <span
                              v-for="(color, idx) in getSlotColors(
                                hero.slotMap,
                              )"
                              :key="idx"
                              class="slot-dot"
                              :style="{ backgroundColor: color }"
                            ></span>
                          </div>
                        </div>
                      </div>
                      <div v-if="hero.power" class="hero-stats-small">
                        <div class="stat-row-small">
                          <span class="stat-power"
                            >战力{{ formatPower(hero.power) }}</span
                          >
                          <span class="stat-speed" v-if="hero.speed"
                            >速度{{ hero.speed }}</span
                          >
                        </div>
                        <div class="stat-row-small">
                          <span class="stat-attack" v-if="hero.attack"
                            >攻击{{ formatPower(hero.attack) }}</span
                          >
                          <span class="stat-hp" v-if="hero.hp"
                            >血量{{ formatPower(hero.hp) }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="getLineupsByTeamId(selectedTeamTab).length === 0"
              class="no-lineup-tip"
            >
              暂无保存的阵容
            </div>
          </div>
        </div>
      </n-modal>

      <n-modal
        v-model:show="techModalVisible"
        preset="card"
        title="俱乐部科技"
        style="width: 700px; max-width: 90vw"
        :bordered="false"
      >
        <div v-if="selectedTechData" class="tech-modal-content">
          <div
            v-for="type in [1, 2, 3, 4, 5, 6]"
            :key="type"
            class="tech-type-section"
          >
            <div class="tech-type-header">
              {{ LEGION_TECH_TYPE_NAME[type] }}
            </div>
            <div class="tech-items">
              <div
                v-for="techId in LEGION_TECH_TYPE_MAP[type]"
                :key="techId"
                class="tech-item"
              >
                <span class="tech-name">{{ LEGION_TECH_NAME[techId] }}</span>
                <span class="tech-level">
                  {{ selectedTechData[techId] || 0 }}/{{
                    LEGION_TECH_MAX_LEVEL[techId]
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-tech-data">暂无科技数据</div>
      </n-modal>

      <n-modal
        v-model:show="refineModalVisible"
        preset="card"
        :title="refineModalTitle"
        style="width: 600px; max-width: 90vw"
        :bordered="false"
      >
        <n-spin :show="refineModalLoading">
          <div v-if="selectedHeroEquipment" class="refine-modal-content">
            <div
              v-for="partId in [1, 2, 3, 4]"
              :key="partId"
              class="equip-refine-section"
            >
              <div class="equip-header">
                <span class="equip-name">{{ partMap[partId] }}</span>
                <span class="equip-level">
                  Lv.{{ selectedHeroEquipment[partId]?.level || 0 }}
                </span>
                <span class="equip-bonus" v-if="selectedHeroEquipment[partId]">
                  +{{ getEquipBonus(partId) }}
                  {{ partId === 1 ? "攻击" : partId === 3 ? "防御" : "血量" }}
                </span>
              </div>
              <div class="slots-container">
                <div
                  v-for="slot in getEquipSlots(partId)"
                  :key="slot.id"
                  class="slot-item"
                  :class="{
                    locked: slot.isLocked,
                    [`color-${slot.colorId}`]: slot.colorId > 0,
                  }"
                >
                  <span class="slot-label">孔{{ slot.id }}</span>
                  <div v-if="slot.attrId" class="slot-attr">
                    <span class="attr-name">{{
                      getAttrName(slot.attrId)
                    }}</span>
                    <span class="attr-value">+{{ slot.attrNum }}%</span>
                  </div>
                  <div v-else class="slot-empty">未淬炼</div>
                  <n-tag v-if="slot.isLocked" size="small" type="warning"
                    >锁定</n-tag
                  >
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-equipment">暂无装备数据</div>
        </n-spin>
      </n-modal>

      <n-modal
        v-model:show="exchangeModalVisible"
        preset="card"
        :title="exchangeMode === 'add' ? '上阵英雄' : '更换武将'"
        style="width: 700px; max-width: 90vw"
        :bordered="false"
      >
        <div class="exchange-modal-content">
          <div v-if="exchangeMode === 'exchange'" class="current-hero-info">
            <span>当前武将：</span>
            <n-tag type="primary" size="large">
              {{
                getHeroName(exchangeHero?.heroId) ||
                `武将${exchangeHero?.heroId}`
              }}
            </n-tag>
          </div>
          <div v-else class="current-hero-info">
            <span>上阵位置：</span>
            <n-tag type="success" size="large">
              位置 {{ getFirstEmptySlot() + 1 }}
            </n-tag>
          </div>
          <n-input
            v-model:value="heroSearchKeyword"
            placeholder="搜索武将名称..."
            clearable
            style="margin-bottom: 12px"
          />
          <div class="hero-filter-section">
            <div class="filter-label">品质：</div>
            <div class="filter-tags">
              <n-tag
                v-for="q in heroQualities"
                :key="q"
                :type="selectedQuality === q ? 'primary' : 'default'"
                :bordered="false"
                style="cursor: pointer; margin-right: 8px"
                @click="selectedQuality = selectedQuality === q ? '全部' : q"
              >
                {{ q }}
              </n-tag>
            </div>
          </div>
          <div class="hero-filter-section">
            <div class="filter-label">国家：</div>
            <div class="filter-tags">
              <n-tag
                v-for="t in heroCountries"
                :key="t"
                :type="selectedCountry === t ? 'primary' : 'default'"
                :bordered="false"
                style="cursor: pointer; margin-right: 8px"
                @click="selectedCountry = selectedCountry === t ? '全部' : t"
              >
                {{ t }}
              </n-tag>
            </div>
          </div>
          <n-spin :show="exchangeLoading">
            <div class="hero-select-grid">
              <div
                v-for="hero in filteredHeroList"
                :key="hero.id"
                class="hero-select-item"
                :class="{
                  selected: exchangeTargetHeroId === hero.id,
                  'quality-red': hero.quality === '红将',
                  'quality-orange': hero.quality === '橙将',
                  'quality-purple': hero.quality === '紫将',
                }"
                @click="selectExchangeHero(hero)"
              >
                <div class="hero-select-avatar">
                  <img v-if="hero.avatar" :src="hero.avatar" :alt="hero.name" />
                  <div v-else class="hero-placeholder">
                    {{ hero.name?.substring(0, 2) || "?" }}
                  </div>
                </div>
                <div class="hero-select-name">{{ hero.name }}</div>
                <div class="hero-select-tags">
                  <n-tag
                    size="small"
                    :bordered="false"
                    :type="
                      hero.quality === '红将'
                        ? 'error'
                        : hero.quality === '橙将'
                          ? 'warning'
                          : hero.quality === '紫将'
                            ? 'info'
                            : 'default'
                    "
                  >
                    {{ hero.quality }}
                  </n-tag>
                  <n-tag size="small" :bordered="false" type="default">
                    {{ hero.type }}
                  </n-tag>
                </div>
              </div>
            </div>
          </n-spin>
        </div>
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 8px">
            <n-button @click="exchangeModalVisible = false">取消</n-button>
            <n-button
              type="primary"
              @click="confirmHeroAction"
              :loading="exchangeLoading"
              :disabled="!exchangeTargetHeroId"
            >
              {{ exchangeMode === "add" ? "确认上阵" : "确认更换" }}
            </n-button>
          </div>
        </template>
      </n-modal>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from "vue";
import { useMessage, useDialog, NInput } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import MyCard from "../Common/MyCard.vue";
import {
  HERO_DICT,
  FishMap,
  PearlMap,
  LEGION_TECH_MAX_LEVEL,
  LEGION_TECH_TYPE_MAP,
  LEGION_TECH_RESET_TYPE_MAP,
  LEGION_TECH_TYPE_NAME,
  LEGION_TECH_NAME,
  getTechType,
  weapon,
  color,
} from "@/utils/HeroList.js";

const tokenStore = useTokenStore();
const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const switchingTeamId = ref(null);
const currentTeamId = ref(1);
const availableTeams = ref([1, 2, 3, 4, 5, 6]);
const currentTeamInfo = ref(null);
const presetTeamData = ref(null);
const savedLineups = ref([]);
const allHeroesData = ref({});
const roleHeroesData = ref({});
const editingTeamHeroes = ref({});
const artifactBooks = ref({});
const pearlMap = ref({});
let lastRefreshTime = 0;
const REFRESH_DEBOUNCE = 3000;
const COMMAND_DELAY = 500;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatPower = (power) => {
  if (!power) return "0";
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + "亿";
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + "万";
  }
  return power.toString();
};

const generateLineupId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const state = ref({
  isRunning: false,
});

const refineModalVisible = ref(false);
const refineModalLoading = ref(false);
const refineModalTitle = ref("");
const selectedHeroEquipment = ref(null);

const exchangeModalVisible = ref(false);
const exchangeLoading = ref(false);
const exchangeMode = ref("exchange");
const exchangeHero = ref(null);
const exchangeTargetHeroId = ref(null);
const heroSearchKeyword = ref("");
const selectedQuality = ref("全部");
const selectedCountry = ref("全部");
const savedLineupsModalVisible = ref(false);
const selectedTeamTab = ref(1);
const expandedLineup = ref(null);
const techModalVisible = ref(false);
const selectedTechData = ref(null);

const draggedHeroId = ref(null);
const dragOverPosition = ref(null);

const STORAGE_KEY = "saved_lineups";

const syncLegionResearch = async (tokenId, targetResearch) => {
  if (!targetResearch || Object.keys(targetResearch).length === 0) {
    return { success: true, message: "无科技数据需要同步" };
  }

  const roleInfo = await tokenStore.sendMessageWithPromise(
    tokenId,
    "role_getroleinfo",
    {},
  );
  await delay(COMMAND_DELAY);
  const role = roleInfo?.role || roleInfo;
  const currentResearch = role?.legionResearch || {};

  const typesToReset = new Set();
  const typesToResetResearch = new Set();

  for (const type of [1, 2, 3, 4, 5, 6]) {
    const techIds = LEGION_TECH_RESET_TYPE_MAP[type];
    for (const techId of techIds) {
      const currentLevel = currentResearch[techId] || 0;
      const targetLevel = targetResearch[techId] || 0;
      if (
        currentLevel !== targetLevel &&
        (currentLevel > 0 || targetLevel > 0)
      ) {
        typesToResetResearch.add(type);
        break;
      }
    }
    const techIds2 = LEGION_TECH_TYPE_MAP[type];
    for (const techId of techIds2) {
      const currentLevel = currentResearch[techId] || 0;
      const targetLevel = targetResearch[techId] || 0;
      if (
        currentLevel !== targetLevel &&
        (currentLevel > 0 || targetLevel > 0)
      ) {
        typesToReset.add(type);
        break;
      }
    }
  }

  if (typesToResetResearch.size === 0 && typesToReset.size === 0) {
    return { success: true, message: "科技配置已匹配，无需调整" };
  }

  const errors = [];

  for (const type of typesToResetResearch) {
    try {
      await tokenStore.sendMessageWithPromise(tokenId, "legion_resetresearch", {
        advanced: false,
        type: type,
      });
    } catch (err) {}
    await delay(COMMAND_DELAY);
  }

  const sortedTypes = [...typesToReset].sort((a, b) => a - b);
  console.log(sortedTypes);

  for (const type of sortedTypes) {
    const techIds2 = LEGION_TECH_TYPE_MAP[type];
    for (const techId of techIds2) {
      const targetLevel = targetResearch[techId] || 0;
      if (targetLevel > 0) {
        const maxLevel = LEGION_TECH_MAX_LEVEL[techId];
        const isMax = targetLevel >= maxLevel;
        if (isMax) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "legion_research",
              {
                isMax: true,
                researchId: techId,
              },
            );
          } catch (err) {}
          await delay(COMMAND_DELAY);
        } else {
          for (let i = 0; i < targetLevel; i++) {
            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "legion_research",
                {
                  isMax: false,
                  researchId: techId,
                },
              );
            } catch (err) {}
            await delay(COMMAND_DELAY);
          }
        }
      }
    }
  }

  return { success: true, message: "科技配置已同步" };
};

const partMap = {
  1: "武器",
  2: "铠甲",
  3: "头冠",
  4: "坐骑",
};

const attrMap = {
  1: "攻击",
  2: "血量",
  3: "防御",
  4: "速度",
  5: "破甲",
  6: "破甲抵抗",
  7: "精准",
  8: "格挡",
  9: "减伤",
  10: "暴击",
  11: "暴击抵抗",
  12: "爆伤",
  13: "爆伤抵抗",
  14: "技能伤害",
  15: "免控",
  16: "眩晕免疫",
  17: "冰冻免疫",
  18: "沉默免疫",
  19: "流血免疫",
  20: "中毒免疫",
  21: "灼烧免疫",
};

const heroQualities = computed(() => {
  return ["全部", "红将", "橙将", "紫将"];
});

const heroCountries = computed(() => {
  const countries = new Set(["全部"]);
  Object.values(HERO_DICT).forEach((hero) => {
    if (hero.type) countries.add(hero.type);
  });
  return Array.from(countries);
});

const getHeroQuality = (heroId) => {
  const prefix = Math.floor(heroId / 100);
  if (prefix === 1) return "红将";
  if (prefix === 2) return "橙将";
  if (prefix === 3) return "紫将";
  return "其他";
};

const getFishInfo = (artifactId) => {
  if (!artifactId || artifactId === -1) return null;

  for (const [fishId, book] of Object.entries(artifactBooks.value)) {
    if (book.artifactId === artifactId) {
      const fishData = FishMap[fishId];
      if (fishData) {
        return {
          fishId: Number(fishId),
          name: fishData.name,
          artifactId: book.artifactId,
          star: book.claimedStar || 0,
        };
      }
    }
  }
  return null;
};

const getFishNameByArtifactId = (artifactId) => {
  const fishInfo = getFishInfo(artifactId);
  return fishInfo ? fishInfo.name : null;
};

const getFishNameById = (fishId) => {
  if (!fishId) return null;
  const fishData = FishMap[fishId];
  return fishData ? fishData.name : `鱼灵${fishId}`;
};

const getPearlSkillNameById = (skillId) => {
  if (!skillId) return null;
  const skillData = PearlMap[skillId];
  return skillData ? skillData.name : null;
};

const getSlotColors = (slotMap) => {
  if (!slotMap) return null;
  const colors = [];
  for (const slot of Object.values(slotMap)) {
    if (slot.colorId) {
      const colorData = color[slot.colorId];
      colors.push(colorData ? colorData.value : "white");
    }
  }
  return colors.length > 0 ? colors : null;
};

const getPearlDataByArtifactId = (artifactId) => {
  if (!artifactId || artifactId === -1) return null;
  for (const [pearlId, pearlData] of Object.entries(pearlMap.value)) {
    if (pearlData.artifactId === artifactId) {
      return pearlData;
    }
  }
  return null;
};

const getPearlSkillNameByArtifactId = (artifactId) => {
  const pearlData = getPearlDataByArtifactId(artifactId);
  if (!pearlData || !pearlData.skillId) return null;
  const skillData = PearlMap[pearlData.skillId];
  return skillData ? skillData.name : null;
};

const getSlotColorsByArtifactId = (artifactId) => {
  const pearlData = getPearlDataByArtifactId(artifactId);
  if (!pearlData || !pearlData.slotMap) return null;
  const colors = [];
  for (const slot of Object.values(pearlData.slotMap)) {
    if (slot.colorId) {
      const colorData = color[slot.colorId];
      colors.push(colorData ? colorData.value : "white");
    }
  }
  return colors.length > 0 ? colors : null;
};

const allHeroList = computed(() => {
  const heroes = Object.entries(roleHeroesData.value).map(([id, hero]) => {
    const heroInfo = HERO_DICT[hero.heroId] || {};
    return {
      id: Number(hero.heroId),
      name: heroInfo.name || `武将${hero.heroId}`,
      type: heroInfo.type || "未知",
      avatar: heroInfo.avatar || null,
      quality: getHeroQuality(Number(hero.heroId)),
      artifactId: hero.artifactId || null,
      attachmentUid: hero.attachmentUid || null,
      heroData: hero,
    };
  });

  const countryOrder = { 魏国: 1, 蜀国: 2, 吴国: 3, 群雄: 4 };
  const qualityOrder = { 红将: 1, 橙将: 2, 紫将: 3, 其他: 4 };

  return heroes.sort((a, b) => {
    const countryA = countryOrder[a.type] || 99;
    const countryB = countryOrder[b.type] || 99;
    if (countryA !== countryB) return countryA - countryB;

    const qualityA = qualityOrder[a.quality] || 99;
    const qualityB = qualityOrder[b.quality] || 99;
    if (qualityA !== qualityB) return qualityA - qualityB;

    return a.id - b.id;
  });
});

const filteredHeroList = computed(() => {
  let list = allHeroList.value;

  if (selectedQuality.value !== "全部") {
    list = list.filter((hero) => hero.quality === selectedQuality.value);
  }

  if (selectedCountry.value !== "全部") {
    list = list.filter((hero) => hero.type === selectedCountry.value);
  }

  if (heroSearchKeyword.value) {
    const keyword = heroSearchKeyword.value.toLowerCase();
    list = list.filter((hero) => hero.name.toLowerCase().includes(keyword));
  }

  return list;
});

const currentTeamHeroes = computed(() => {
  if (!currentTeamInfo.value) return [];
  const teamInfo = currentTeamInfo.value;
  return Object.entries(teamInfo)
    .map(([key, hero]) => {
      const heroData = roleHeroesData.value[String(hero?.heroId || hero?.id)];
      return {
        position: hero?.battleTeamSlot ?? Number(key),
        heroId: hero?.heroId || hero?.id,
        level: hero?.level || null,
        artifactId: hero?.artifactId || null,
        attachmentUid: hero?.attachmentUid || null,
        power: heroData?.power || null,
        attack: heroData?.attack || null,
        hp: heroData?.hp || null,
        speed: heroData?.speed || null,
      };
    })
    .filter((h) => h.heroId)
    .sort((a, b) => a.position - b.position);
});

const editingHeroes = computed(() => {
  if (Object.keys(editingTeamHeroes.value).length > 0) {
    return Object.entries(editingTeamHeroes.value)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([pos, hero]) => {
        const heroData = roleHeroesData.value[String(hero?.heroId)];
        return {
          position: Number(pos),
          heroId: hero?.heroId,
          level: hero?.level || null,
          artifactId: hero?.artifactId || null,
          attachmentUid: hero?.attachmentUid || null,
          power: heroData?.power || null,
          attack: heroData?.attack || null,
          hp: heroData?.hp || null,
          speed: heroData?.speed || null,
        };
      })
      .filter((h) => h.heroId);
  }
  return currentTeamHeroes.value;
});

const getFirstEmptySlot = () => {
  for (let i = 0; i < 5; i++) {
    const hero = editingHeroes.value.find((h) => h.position === i);
    if (!hero) return i;
  }
  return 0;
};

const getLineupsByTeamId = (teamId) => {
  return savedLineups.value.filter((lineup) => lineup.teamId === teamId);
};

const toggleLineupExpand = (lineup) => {
  if (expandedLineup.value === lineup) {
    expandedLineup.value = null;
  } else {
    expandedLineup.value = lineup;
  }
};

const hasEditingChanges = computed(() => {
  if (Object.keys(editingTeamHeroes.value).length === 0) return false;
  const current = JSON.stringify(
    currentTeamHeroes.value
      .map((h) => `${h.position}:${h.heroId}`)
      .sort()
      .join(","),
  );
  const editing = JSON.stringify(
    editingHeroes.value
      .map((h) => `${h.position}:${h.heroId}`)
      .sort()
      .join(","),
  );
  return current !== editing;
});

const getHeroName = (heroId) => {
  if (!heroId) return null;
  return HERO_DICT[heroId]?.name || null;
};

const getHeroAvatar = (heroId) => {
  if (!heroId) return null;
  return HERO_DICT[heroId]?.avatar || null;
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const formatLevel = (level) => {
  if (!level) return "";
  return String(level);
};

const getAttrName = (attrId) => {
  return attrMap[attrId] || `属性${attrId}`;
};

const getEquipBonus = (partId) => {
  if (!selectedHeroEquipment.value || !selectedHeroEquipment.value[partId]) {
    return 0;
  }
  const equip = selectedHeroEquipment.value[partId];
  const bonusType =
    partId === 1
      ? "quenchAttackExt"
      : partId === 3
        ? "quenchDefenseExt"
        : "quenchHpExt";
  return equip[bonusType] || 0;
};

const getEquipSlots = (partId) => {
  if (!selectedHeroEquipment.value || !selectedHeroEquipment.value[partId]) {
    return [];
  }
  const quenches = selectedHeroEquipment.value[partId].quenches || {};
  const slotList = [];
  const slotKeys = Object.keys(quenches).sort((a, b) => Number(a) - Number(b));

  for (const key of slotKeys) {
    const slotId = Number(key);
    const slot = quenches[key];
    slotList.push({
      id: slotId,
      attrId: slot.attrId || null,
      attrNum: slot.attrNum || 0,
      isLocked: slot.isLocked || slot.locked || false,
      colorId: slot.colorId || 0,
    });
  }

  return slotList;
};

const showHeroRefineModal = async (hero) => {
  refineModalTitle.value = `${getHeroName(hero.heroId) || `武将${hero.heroId}`} - 装备洗练`;
  refineModalVisible.value = true;
  refineModalLoading.value = true;
  selectedHeroEquipment.value = null;

  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    refineModalLoading.value = false;
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法获取装备信息");
    refineModalLoading.value = false;
    return;
  }

  try {
    const heroData = allHeroesData.value[String(hero.heroId)];
    if (heroData?.equipment) {
      selectedHeroEquipment.value = heroData.equipment;
    } else {
      const roleInfo = await tokenStore.sendMessageWithPromise(
        tokenId,
        "role_getroleinfo",
        {},
      );
      const role = roleInfo?.role || roleInfo;
      const heroes = role?.heroes || {};
      allHeroesData.value = heroes;

      const currentHero = heroes[String(hero.heroId)];
      selectedHeroEquipment.value = currentHero?.equipment || null;
    }

    if (!selectedHeroEquipment.value) {
      message.warning("未找到该武将的装备数据");
    }
  } catch (error) {
  } finally {
    refineModalLoading.value = false;
  }
  await delay(COMMAND_DELAY);
};

const openExchangeModal = (hero) => {
  exchangeMode.value = "exchange";
  exchangeHero.value = hero;
  exchangeTargetHeroId.value = null;
  heroSearchKeyword.value = "";
  selectedQuality.value = "全部";
  selectedCountry.value = "全部";
  exchangeModalVisible.value = true;
};

const openAddHeroModal = () => {
  if (editingHeroes.value.length >= 5) {
    message.warning("阵容已满，无法上阵更多英雄");
    return;
  }
  exchangeMode.value = "add";
  exchangeHero.value = null;
  exchangeTargetHeroId.value = null;
  heroSearchKeyword.value = "";
  selectedQuality.value = "全部";
  selectedCountry.value = "全部";
  exchangeModalVisible.value = true;
};

const selectExchangeHero = (hero) => {
  exchangeTargetHeroId.value = hero.id;
};

const confirmHeroAction = () => {
  if (!exchangeTargetHeroId.value) {
    message.warning("请选择武将");
    return;
  }

  if (Object.keys(editingTeamHeroes.value).length === 0) {
    currentTeamHeroes.value.forEach((h) => {
      editingTeamHeroes.value[h.position] = {
        heroId: h.heroId,
        level: h.level || null,
        artifactId: h.artifactId || null,
        attachmentUid: h.attachmentUid || null,
      };
    });
  }

  if (exchangeMode.value === "add") {
    const slot = getFirstEmptySlot();
    const targetHeroData =
      roleHeroesData.value[String(exchangeTargetHeroId.value)];
    const currentTeamHeroInfo = currentTeamInfo.value?.[slot];
    editingTeamHeroes.value[slot] = {
      heroId: exchangeTargetHeroId.value,
      level: currentTeamHeroInfo?.level || targetHeroData?.level || null,
      artifactId: targetHeroData?.artifactId || null,
      attachmentUid: targetHeroData?.attachmentUid || null,
    };
    message.success(
      `${getHeroName(exchangeTargetHeroId.value)} 已上阵到位置 ${slot + 1}`,
    );
  } else {
    if (!exchangeHero.value) {
      message.warning("请选择要更换的武将");
      return;
    }
    const originalArtifactId = exchangeHero.value.artifactId;
    const originalAttachmentUid = exchangeHero.value.attachmentUid;
    const targetHeroData =
      roleHeroesData.value[String(exchangeTargetHeroId.value)];
    editingTeamHeroes.value[exchangeHero.value.position] = {
      heroId: exchangeTargetHeroId.value,
      level: targetHeroData?.level || null,
      artifactId: originalArtifactId,
      attachmentUid: originalAttachmentUid,
    };
    message.success(
      `已将 ${getHeroName(exchangeHero.value.heroId)} 更换为 ${getHeroName(exchangeTargetHeroId.value)}`,
    );
  }

  exchangeModalVisible.value = false;
};

const removeHero = (hero) => {
  if (Object.keys(editingTeamHeroes.value).length === 0) {
    currentTeamHeroes.value.forEach((h) => {
      editingTeamHeroes.value[h.position] = {
        heroId: h.heroId,
        level: h.level || null,
        artifactId: h.artifactId || null,
        attachmentUid: h.attachmentUid || null,
      };
    });
  }

  delete editingTeamHeroes.value[hero.position];
  message.success(`${getHeroName(hero.heroId)} 已下阵`);
};

const onDragStart = (event, hero) => {
  draggedHeroId.value = hero.heroId;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(hero));
};

const onDragEnd = () => {
  draggedHeroId.value = null;
  dragOverPosition.value = null;
};

const onDragOver = (event, hero) => {
  if (draggedHeroId.value !== hero.heroId) {
    dragOverPosition.value = hero.position;
  }
};

const onDragLeave = () => {
  dragOverPosition.value = null;
};

const onDrop = (event, targetHero) => {
  event.preventDefault();
  dragOverPosition.value = null;

  if (!draggedHeroId.value || draggedHeroId.value === targetHero.heroId) {
    return;
  }

  const draggedHero = editingHeroes.value.find(
    (h) => h.heroId === draggedHeroId.value,
  );
  if (!draggedHero) return;

  if (Object.keys(editingTeamHeroes.value).length === 0) {
    currentTeamHeroes.value.forEach((h) => {
      editingTeamHeroes.value[h.position] = {
        heroId: h.heroId,
        level: h.level || null,
        artifactId: h.artifactId || null,
        attachmentUid: h.attachmentUid || null,
      };
    });
  }

  const draggedPos = draggedHero.position;
  const targetPos = targetHero.position;

  const draggedHeroData = editingTeamHeroes.value[draggedPos];
  const targetHeroData = editingTeamHeroes.value[targetPos];

  editingTeamHeroes.value[draggedPos] = targetHeroData;
  editingTeamHeroes.value[targetPos] = draggedHeroData;

  message.success(
    `已将 ${getHeroName(draggedHero.heroId)} 与 ${getHeroName(targetHero.heroId)} 交换位置`,
  );

  draggedHeroId.value = null;
};

const loadSavedLineups = () => {
  try {
    const token = tokenStore.selectedToken;
    if (!token) return;
    const key = `${STORAGE_KEY}_${token.id}`;
    const data = localStorage.getItem(key);
    if (data) {
      savedLineups.value = JSON.parse(data);
    } else {
      savedLineups.value = [];
    }
  } catch (e) {
    console.error("加载保存的阵容失败:", e);
    savedLineups.value = [];
  }
};

const saveLineupsToStorage = () => {
  try {
    const token = tokenStore.selectedToken;
    if (!token) return;
    const key = `${STORAGE_KEY}_${token.id}`;
    localStorage.setItem(key, JSON.stringify(savedLineups.value));
  } catch (e) {
    console.error("保存阵容到缓存失败:", e);
    message.error("保存阵容失败");
  }
};

const refreshTeamInfo = async () => {
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_DEBOUNCE) {
    return;
  }
  lastRefreshTime = now;

  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法获取数据");
    return;
  }

  loading.value = true;
  try {
    let presetTeamResult = await tokenStore.sendMessageWithPromise(
      tokenId,
      "presetteam_getinfo",
      {},
    );

    const teamsFromGame =
      presetTeamResult?.presetTeamInfo?.presetTeamInfo || {};
    const gameTeamIds = Object.keys(teamsFromGame)
      .filter((k) => /^\d+$/.test(k))
      .map(Number)
      .sort((a, b) => a - b);
    const availableTeamIds = gameTeamIds.length
      ? gameTeamIds
      : [1, 2, 3, 4, 5, 6];

    let targetTeamId = presetTeamResult?.presetTeamInfo?.useTeamId || 1;
    if (!availableTeamIds.includes(targetTeamId)) {
      targetTeamId = availableTeamIds[0];
    }

    const currentIndex = availableTeamIds.indexOf(targetTeamId);
    const otherTeamId =
      availableTeamIds[currentIndex === 0 ? 1 : currentIndex - 1] ||
      availableTeamIds[0];

    if (otherTeamId !== targetTeamId && availableTeamIds.length > 1) {
      await tokenStore.sendMessageWithPromise(tokenId, "presetteam_saveteam", {
        teamId: otherTeamId,
      });

      await delay(COMMAND_DELAY);

      await tokenStore.sendMessageWithPromise(tokenId, "presetteam_saveteam", {
        teamId: targetTeamId,
      });

      await delay(COMMAND_DELAY);
    }

    presetTeamResult = await tokenStore.sendMessageWithPromise(
      tokenId,
      "presetteam_getinfo",
      {},
    );
    await delay(COMMAND_DELAY);

    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
    );
    await delay(COMMAND_DELAY);
    const role = roleInfo?.role || roleInfo;
    roleHeroesData.value = role?.heroes || {};
    allHeroesData.value = role?.heroes || {};
    artifactBooks.value = role?.artifactBooks || {};
    pearlMap.value = role?.pearlMap || {};

    presetTeamData.value = presetTeamResult?.presetTeamInfo;

    if (presetTeamResult) {
      tokenStore.$patch((state) => {
        state.gameData = {
          ...(state.gameData ?? {}),
          presetTeam: presetTeamResult,
        };
      });
    }

    if (presetTeamData.value) {
      const updatedTeamsFromGame = presetTeamData.value.presetTeamInfo || {};
      currentTeamId.value = presetTeamData.value.useTeamId || 1;
      availableTeams.value = availableTeamIds;

      const currentTeam =
        updatedTeamsFromGame[currentTeamId.value] ||
        updatedTeamsFromGame[String(currentTeamId.value)];
      currentTeamInfo.value = currentTeam?.teamInfo || {};
      editingTeamHeroes.value = {};
    }

    message.success("数据已刷新");
  } catch (error) {
    message.error(`获取数据失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

const saveCurrentLineup = async () => {
  if (editingHeroes.value.length === 0) {
    message.warning("当前阵容为空，无法保存");
    return;
  }

  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法保存阵容");
    return;
  }

  loading.value = true;

  try {
    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
    );
    await delay(COMMAND_DELAY);

    const role = roleInfo?.role || roleInfo;
    const legionResearch = role?.legionResearch || {};
    const currentArtifactBooks = role?.artifactBooks || {};
    const currentHeroes = role?.heroes || {};
    const pearlMap = role?.pearlMap || {};

    const presetTeamResult = await tokenStore.sendMessageWithPromise(
      tokenId,
      "presetteam_getinfo",
      {},
    );
    await delay(COMMAND_DELAY);

    const presetInfo =
      presetTeamResult?.presetTeamInfo?.presetTeamInfo ||
      presetTeamResult?.presetTeamInfo ||
      {};
    const teamData =
      presetInfo[currentTeamId.value] ||
      presetInfo[String(currentTeamId.value)];
    const weaponId = teamData?.weapon?.weaponId || null;
    const teamInfo = teamData?.teamInfo || {};

    const lineupName = `阵容${currentTeamId.value} - ${new Date().toLocaleTimeString()}`;

    const fishAssignments = {};
    for (const [fishId, book] of Object.entries(currentArtifactBooks)) {
      if (book.artifactId && book.artifactId !== -1) {
        fishAssignments[book.artifactId] = Number(fishId);
      }
    }

    const heroesData = editingHeroes.value.map((hero) => {
      const heroData = currentHeroes[String(hero.heroId)];
      const artifactId = heroData?.artifactId || hero.artifactId || null;
      const teamHeroInfo = teamInfo[hero.position];
      const fishId = artifactId ? fishAssignments[artifactId] : null;
      const pearlId = teamHeroInfo?.pearlId || null;
      const pearlData = pearlMap[pearlId];
      const slotMap = pearlData?.slotMap || null;
      return {
        position: hero.position,
        heroId: hero.heroId,
        level: teamHeroInfo?.level || null,
        attachmentUid: hero.attachmentUid || null,
        fishId: fishId || null,
        pearlId: pearlId,
        skillId: pearlData?.skillId || null,
        slotMap: slotMap,
        power: heroData?.power || null,
        attack: heroData?.attack || null,
        hp: heroData?.hp || null,
        speed: heroData?.speed || null,
      };
    });

    savedLineups.value.unshift({
      id: generateLineupId(),
      name: lineupName,
      heroes: heroesData,
      teamId: currentTeamId.value,
      savedAt: Date.now(),
      applying: false,
      legionResearch: legionResearch,
      weaponId: weaponId,
    });

    saveLineupsToStorage();
    message.success(`阵容已保存: ${lineupName}`);
  } catch (error) {
    message.error(`保存阵容失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

const LEVEL_ORDER_THRESHOLDS = [
  { level: 100, order: 1 },
  { level: 200, order: 2 },
  { level: 300, order: 3 },
  { level: 500, order: 4 },
  { level: 700, order: 5 },
  { level: 900, order: 6 },
  { level: 1100, order: 7 },
  { level: 1300, order: 8 },
  { level: 1500, order: 9 },
  { level: 1800, order: 10 },
  { level: 2100, order: 11 },
  { level: 2400, order: 12 },
  { level: 2800, order: 13 },
  { level: 3200, order: 14 },
  { level: 3600, order: 15 },
  { level: 4000, order: 16 },
  { level: 4500, order: 17 },
  { level: 5000, order: 18 },
  { level: 5500, order: 19 },
];

const UPGRADE_OPTIONS = [50, 10, 5, 1];

const getNextOrderLevel = (currentLevel) => {
  for (const threshold of LEVEL_ORDER_THRESHOLDS) {
    if (currentLevel < threshold.level) {
      return threshold.level;
    }
  }
  return null;
};

const getOrder = (level) => {
  let order = 0;
  for (const threshold of LEVEL_ORDER_THRESHOLDS) {
    if (level >= threshold.level) {
      order = threshold.order;
    } else {
      break;
    }
  }
  return order;
};

const applyHeroLevel = async (
  tokenId,
  heroId,
  targetLevel,
  currentLevel,
  currentOrder = 0,
  slot = -1,
) => {
  if (!targetLevel || targetLevel <= 0)
    return { success: true, message: "无目标等级" };

  let actualCurrentLevel = currentLevel;
  let actualCurrentOrder = currentOrder;

  if (actualCurrentLevel > targetLevel) {
    if (slot >= 0) {
      try {
        await tokenStore.sendMessageWithPromise(tokenId, "hero_gobackbattle", {
          slot,
        });
      } catch (err) {}
      await delay(COMMAND_DELAY);
    }

    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "hero_rebirth",
        {
          heroId,
        },
      );
      if (result?.role?.heroes?.[heroId]?.level !== undefined) {
        actualCurrentLevel = result.role.heroes[heroId].level;
      } else {
        actualCurrentLevel = 1;
      }
      if (result?.role?.heroes?.[heroId]?.order !== undefined) {
        actualCurrentOrder = result.role.heroes[heroId].order;
      } else {
        actualCurrentOrder = 0;
      }
    } catch (err) {}
    await delay(COMMAND_DELAY);

    if (slot >= 0) {
      try {
        await tokenStore.sendMessageWithPromise(tokenId, "hero_gointobattle", {
          heroId,
          slot,
        });
      } catch (err) {}
      await delay(COMMAND_DELAY);
    }
  }

  const expectedOrder = getOrder(actualCurrentLevel);
  if (actualCurrentOrder < expectedOrder) {
    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "hero_heroupgradeorder",
        {
          heroId,
        },
      );
      if (result?.role?.heroes?.[heroId]?.order !== undefined) {
        actualCurrentOrder = result.role.heroes[heroId].order;
      } else {
        actualCurrentOrder = expectedOrder;
      }
    } catch (err) {}
    await delay(COMMAND_DELAY);
  }

  if (actualCurrentLevel >= targetLevel) {
    return { success: true, message: "等级已达标" };
  }

  while (actualCurrentLevel < targetLevel) {
    const nextOrderLevel = getNextOrderLevel(actualCurrentLevel);
    const maxAllowed = nextOrderLevel
      ? nextOrderLevel - actualCurrentLevel
      : targetLevel - actualCurrentLevel;
    const remaining = targetLevel - actualCurrentLevel;
    const stepLimit = Math.min(maxAllowed, remaining);

    let upgradeNum = 1;
    for (const num of UPGRADE_OPTIONS) {
      if (num <= stepLimit) {
        upgradeNum = num;
        break;
      }
    }

    try {
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "hero_heroupgradelevel",
        {
          heroId,
          upgradeNum,
        },
      );
      actualCurrentLevel += upgradeNum;
    } catch (err) {}
    await delay(COMMAND_DELAY);

    if (nextOrderLevel && actualCurrentLevel >= nextOrderLevel) {
      try {
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "hero_heroupgradeorder",
          {
            heroId,
          },
        );
        if (result?.role?.heroes?.[heroId]?.order !== undefined) {
          actualCurrentOrder = result.role.heroes[heroId].order;
        } else {
          actualCurrentOrder++;
        }
      } catch (err) {}
      await delay(COMMAND_DELAY);
    }
  }

  return { success: true, message: `等级已升至 ${actualCurrentLevel}` };
};

const applyLineup = async (lineup) => {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法应用阵容");
    return;
  }

  if (lineup.teamId !== currentTeamId.value) {
    message.warning(
      `此阵容仅适用于阵容槽位 ${lineup.teamId}，当前槽位为 ${currentTeamId.value}`,
    );
    return;
  }

  lineup.applying = true;
  state.value.isRunning = true;
  const errors = [];

  const getTeamHeroes = (teamInfo) => {
    if (!teamInfo) return [];
    return Object.entries(teamInfo)
      .map(([key, hero]) => ({
        position: hero?.battleTeamSlot ?? Number(key),
        heroId: hero?.heroId || hero?.id,
        artifactId: hero?.artifactId || null,
        attachmentUid: hero?.attachmentUid || null,
      }))
      .filter((h) => h.heroId)
      .sort((a, b) => a.position - b.position);
  };

  const fetchLatestData = async (teamId = null) => {
    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
    );
    await delay(COMMAND_DELAY);
    const presetTeam = await tokenStore.sendMessageWithPromise(
      tokenId,
      "presetteam_getinfo",
      {},
    );
    await delay(COMMAND_DELAY);
    const heroes = roleInfo?.role?.heroes || roleInfo?.heroes || {};
    const pearlMapData = roleInfo?.role?.pearlMap || roleInfo?.pearlMap || {};
    const artifactBooksData =
      roleInfo?.role?.artifactBooks || roleInfo?.artifactBooks || {};
    roleHeroesData.value = heroes;
    const targetTeamId = teamId || currentTeamId.value;
    const team =
      presetTeam?.presetTeamInfo?.presetTeamInfo?.[targetTeamId] ||
      presetTeam?.presetTeamInfo?.presetTeamInfo?.[String(targetTeamId)];
    return {
      heroes,
      teamInfo: team?.teamInfo || {},
      pearlMap: pearlMapData,
      artifactBooks: artifactBooksData,
    };
  };

  const isIgnorableError = (err) => {
    const msg = err.message || "";
    return msg.includes("200020");
  };

  try {
    const targetHeroes = [...lineup.heroes];

    let { heroes, teamInfo } = await fetchLatestData();
    let currentHeroes = getTeamHeroes(teamInfo);

    const attachmentToHero = {};
    for (const [id, hero] of Object.entries(heroes)) {
      if (hero.attachmentUid && hero.attachmentUid !== -1) {
        attachmentToHero[hero.attachmentUid] = Number(id);
      }
    }

    const currentHeroIds = new Set(currentHeroes.map((h) => h.heroId));
    const targetHeroIds = new Set(targetHeroes.map((h) => h.heroId));

    for (const targetHero of targetHeroes) {
      if (!targetHero.attachmentUid || targetHero.attachmentUid === -1)
        continue;

      const currentHolderId = attachmentToHero[targetHero.attachmentUid];

      if (currentHolderId && currentHolderId !== targetHero.heroId) {
        const holderInTeam = currentHeroIds.has(currentHolderId);
        const targetInTeam = currentHeroIds.has(targetHero.heroId);

        if (!holderInTeam && !targetInTeam) {
          const emptySlot = currentHeroes.length < 5 ? currentHeroes.length : 0;
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "hero_gointobattle",
              {
                heroId: currentHolderId,
                slot: emptySlot,
              },
            );
          } catch (err) {
            continue;
          }
          await delay(COMMAND_DELAY);

          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "hero_gointobattle",
              {
                heroId: targetHero.heroId,
                slot: emptySlot + 1,
              },
            );
          } catch (err) {}
          await delay(COMMAND_DELAY);
        }

        try {
          await tokenStore.sendMessageWithPromise(tokenId, "hero_exchange", {
            heroId: currentHolderId,
            targetHeroId: targetHero.heroId,
          });
        } catch (err) {}
        await delay(COMMAND_DELAY);
      }
    }

    await delay(COMMAND_DELAY);
    const data1 = await fetchLatestData();
    await delay(COMMAND_DELAY);
    heroes = data1.heroes;
    for (const [id, hero] of Object.entries(heroes)) {
      if (hero.attachmentUid && hero.attachmentUid !== -1) {
        attachmentToHero[hero.attachmentUid] = Number(id);
      }
    }
    currentHeroes = getTeamHeroes(data1.teamInfo);
    currentHeroIds.clear();
    currentHeroes.forEach((h) => currentHeroIds.add(h.heroId));

    for (const hero of [...currentHeroes]) {
      if (!targetHeroIds.has(hero.heroId)) {
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "hero_gobackbattle",
            {
              slot: hero.position,
            },
          );
        } catch (err) {}
        await delay(COMMAND_DELAY);
      }
    }

    await delay(COMMAND_DELAY);
    const data2 = await fetchLatestData();
    await delay(COMMAND_DELAY);
    currentHeroes = getTeamHeroes(data2.teamInfo);

    for (const targetHero of targetHeroes) {
      const currentHero = currentHeroes.find(
        (h) => h.heroId === targetHero.heroId,
      );
      if (!currentHero) {
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "hero_gointobattle",
            {
              heroId: targetHero.heroId,
              slot: targetHero.position,
            },
          );
        } catch (err) {}
        await delay(COMMAND_DELAY);
      } else if (currentHero.position !== targetHero.position) {
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "hero_gobackbattle",
            {
              slot: currentHero.position,
            },
          );
          await delay(COMMAND_DELAY);
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "hero_gointobattle",
              {
                heroId: targetHero.heroId,
                slot: targetHero.position,
              },
            );
          } catch (err) {}
          await delay(COMMAND_DELAY);
        } catch (err) {}
        await delay(COMMAND_DELAY);
      }
    }

    const hasLevelData = lineup.heroes.some((h) => h.level && h.level > 0);
    if (hasLevelData) {
      const levelData = await fetchLatestData();
      const currentHeroesData = levelData.heroes;

      let levelApplied = 0;
      for (const targetHero of targetHeroes) {
        if (!targetHero.level || targetHero.level <= 0) continue;

        const heroData = currentHeroesData[String(targetHero.heroId)];
        const currentLevel = heroData?.level || 1;
        const currentOrder = heroData?.order || 0;

        if (currentLevel !== targetHero.level) {
          const result = await applyHeroLevel(
            tokenId,
            targetHero.heroId,
            targetHero.level,
            currentLevel,
            currentOrder,
            targetHero.position,
          );

          if (result.success) {
            levelApplied++;
          } else {
          }
        }
      }

      if (levelApplied > 0) {
        message.success(`已应用 ${levelApplied} 个武将等级配置`);
      }
    }

    if (errors.length > 0) {
      message.warning(`阵容已应用，但有部分错误:\n${errors.join("\n")}`);
    } else {
      message.success(`阵容 "${lineup.name}" 已应用`);
    }

    const hasFishData = lineup.heroes.some((h) => h.pearlId || h.fishId);
    if (hasFishData) {
      const fishData = await fetchLatestData();
      const currentHeroes = fishData.heroes;
      const pearlMap = fishData.pearlMap || {};
      const artifactBooks = fishData.artifactBooks || {};

      const artifactToHero = {};
      for (const [heroId, hero] of Object.entries(currentHeroes)) {
        if (hero.artifactId && hero.artifactId !== -1) {
          artifactToHero[hero.artifactId] = Number(heroId);
        }
      }

      const fishToArtifact = {};
      for (const [fishId, book] of Object.entries(artifactBooks)) {
        if (book.artifactId && book.artifactId !== -1) {
          fishToArtifact[Number(fishId)] = book.artifactId;
        }
      }

      let fishApplied = 0;
      for (const targetHero of targetHeroes) {
        if (!targetHero.fishId && !targetHero.pearlId) continue;

        let artifactId = null;
        let pearlId = targetHero.pearlId || 0;

        if (targetHero.fishId) {
          artifactId = fishToArtifact[targetHero.fishId];
        }

        if (!artifactId && targetHero.pearlId) {
          const pearlData = pearlMap[targetHero.pearlId];
          if (pearlData?.artifactId && pearlData.artifactId !== -1) {
            artifactId = pearlData.artifactId;
          }
        }

        if (!artifactId) continue;

        const currentHolderId = artifactToHero[artifactId];

        if (currentHolderId === targetHero.heroId) {
          continue;
        }

        if (currentHolderId) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "artifact_unload",
              {
                heroId: currentHolderId,
              },
            );
          } catch (err) {}
          await delay(COMMAND_DELAY);
        }

        try {
          await tokenStore.sendMessageWithPromise(tokenId, "artifact_load", {
            heroId: targetHero.heroId,
            itemId: artifactId,
            pearlId: pearlId,
          });
          fishApplied++;
        } catch (err) {}
        await delay(COMMAND_DELAY);
      }

      if (fishApplied > 0) {
        message.success(`已应用 ${fishApplied} 个鱼灵配置`);
      }

      let skillApplied = 0;
      const skillData = await fetchLatestData();
      const latestPearlMap = skillData.pearlMap || {};

      const processedPearlIds = new Set();
      const pearlIdsToHandle = targetHeroes
        .filter((h) => h.pearlId)
        .map((h) => h.pearlId);

      for (const pearlId of pearlIdsToHandle) {
        if (processedPearlIds.has(pearlId)) continue;

        const targetHero = targetHeroes.find((h) => h.pearlId === pearlId);
        const currentPearlData = latestPearlMap[pearlId];
        const currentSkillId = currentPearlData?.skillId || null;
        const targetSkillId = targetHero?.skillId || null;

        if (!targetSkillId) {
          if (currentSkillId) {
            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "pearl_unloadskill",
                {
                  pearlId: pearlId,
                },
              );
              skillApplied++;
              processedPearlIds.add(pearlId);
            } catch (err) {}
            await delay(COMMAND_DELAY);
          }
          continue;
        }

        if (currentSkillId === targetSkillId) {
          continue;
        }

        const holderPearlId = Object.keys(latestPearlMap).find((pid) => {
          if (Number(pid) === pearlId) return false;
          const data = latestPearlMap[pid];
          return data?.skillId === targetSkillId;
        });

        if (holderPearlId && !processedPearlIds.has(Number(holderPearlId))) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "pearl_exchangeskill",
              {
                pearlId1: pearlId,
                pearlId2: Number(holderPearlId),
              },
            );
            skillApplied += 2;
            processedPearlIds.add(pearlId);
            processedPearlIds.add(Number(holderPearlId));
          } catch (err) {}
          await delay(COMMAND_DELAY);
        } else {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "pearl_replaceskill",
              {
                pearlId: pearlId,
                skillId: targetSkillId,
              },
            );
            skillApplied++;
            processedPearlIds.add(pearlId);
          } catch (err) {}
          await delay(COMMAND_DELAY);
        }
      }

      if (skillApplied > 0) {
        message.success(`已切换 ${skillApplied} 个鱼珠技能`);
      }
    }

    if (
      lineup.legionResearch &&
      Object.keys(lineup.legionResearch).length > 0
    ) {
      const syncResult = await syncLegionResearch(
        tokenId,
        lineup.legionResearch,
      );
      if (syncResult.success) {
        if (syncResult.message !== "科技配置已匹配，无需调整") {
          message.success(syncResult.message);
        }
      } else {
      }
    }

    if (lineup.weaponId !== undefined && lineup.weaponId !== null) {
      const currentPresetTeam = await tokenStore.sendMessageWithPromise(
        tokenId,
        "presetteam_getinfo",
        {},
      );
      const currentPresetInfo =
        currentPresetTeam?.presetTeamInfo?.presetTeamInfo ||
        currentPresetTeam?.presetTeamInfo ||
        {};
      const currentTeamData =
        currentPresetInfo[currentTeamId.value] ||
        currentPresetInfo[String(currentTeamId.value)];
      const currentWeaponId = currentTeamData?.weapon?.weaponId || null;

      if (currentWeaponId !== lineup.weaponId) {
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "lordweapon_changedefaultweapon",
            {
              weaponId: lineup.weaponId,
            },
          );
          message.success(
            `玩具已切换为: ${weapon[lineup.weaponId] || lineup.weaponId}`,
          );
        } catch (err) {}
        await delay(COMMAND_DELAY);
      }
    }

    lastRefreshTime = 0;
    await refreshTeamInfo();
  } catch (error) {
    message.error(`应用阵容失败: ${error.message}`);
  } finally {
    lineup.applying = false;
    state.value.isRunning = false;
  }
};

const showTechModal = (lineup) => {
  selectedTechData.value = lineup.legionResearch || null;
  techModalVisible.value = true;
};

const renameLineup = (index) => {
  const currentName = savedLineups.value[index].name;
  let newName = currentName;
  dialog.create({
    title: "重命名阵容",
    content: () =>
      h(NInput, {
        defaultValue: currentName,
        onInput: (val) => {
          newName = val;
        },
        placeholder: "请输入阵容名称",
      }),
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: () => {
      if (newName && newName.trim()) {
        savedLineups.value[index].name = newName.trim();
        saveLineupsToStorage();
        message.success("阵容名称已更新");
      }
    },
  });
};

const deleteLineup = (index) => {
  dialog.warning({
    title: "删除阵容",
    content: `确定要删除阵容 "${savedLineups.value[index].name}" 吗？`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: () => {
      savedLineups.value.splice(index, 1);
      saveLineupsToStorage();
      message.success("阵容已删除");
    },
  });
};

const exportLineups = async () => {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法导出");
    return;
  }

  try {
    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
    );
    const role = roleInfo?.role || roleInfo;
    const roleId = role?.roleId || role?.id;

    if (!roleId) {
      message.error("无法获取角色ID");
      return;
    }

    const exportData = {
      roleId: roleId,
      exportTime: Date.now(),
      lineups: savedLineups.value,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `阵容配置_${roleId}_${new Date().toLocaleDateString().replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    message.success(`已导出 ${savedLineups.value.length} 个阵容`);
  } catch (error) {
    message.error(`导出失败: ${error.message}`);
  }
};

const importLineups = async ({ file }) => {
  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法导入");
    return;
  }

  try {
    const roleInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
    );
    const role = roleInfo?.role || roleInfo;
    const currentRoleId = role?.roleId || role?.id;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        if (!importData.roleId || !importData.lineups) {
          message.error("无效的阵容文件格式");
          return;
        }

        const processImport = (lineupsToImport) => {
          const existingIds = new Set(savedLineups.value.map((l) => l.id));
          const newLineups = [];
          const duplicateLineups = [];

          for (const lineup of lineupsToImport) {
            if (lineup.id && existingIds.has(lineup.id)) {
              duplicateLineups.push(lineup);
            } else {
              newLineups.push({
                ...lineup,
                id: lineup.id || generateLineupId(),
                savedAt: Date.now(),
                applying: false,
              });
            }
          }

          if (duplicateLineups.length > 0) {
            dialog.warning({
              title: "发现重复阵容",
              content: `发现 ${duplicateLineups.length} 个已存在的阵容，是否覆盖？`,
              positiveText: "覆盖",
              negativeText: "跳过重复",
              onPositiveClick: () => {
                for (const dupLineup of duplicateLineups) {
                  const index = savedLineups.value.findIndex(
                    (l) => l.id === dupLineup.id,
                  );
                  if (index !== -1) {
                    savedLineups.value[index] = {
                      ...dupLineup,
                      savedAt: Date.now(),
                      applying: false,
                    };
                  }
                }
                savedLineups.value = [...savedLineups.value, ...newLineups];
                saveLineupsToStorage();
                message.success(
                  `已导入 ${newLineups.length + duplicateLineups.length} 个阵容`,
                );
              },
              onNegativeClick: () => {
                savedLineups.value = [...savedLineups.value, ...newLineups];
                saveLineupsToStorage();
                message.success(
                  `已导入 ${newLineups.length} 个阵容，跳过 ${duplicateLineups.length} 个重复`,
                );
              },
            });
          } else {
            savedLineups.value = [...savedLineups.value, ...newLineups];
            saveLineupsToStorage();
            message.success(`已导入 ${newLineups.length} 个阵容`);
          }
        };

        if (importData.roleId !== currentRoleId) {
          dialog.warning({
            title: "角色不匹配",
            content: `该阵容文件来自其他角色，是否继续导入？`,
            positiveText: "导入",
            negativeText: "取消",
            onPositiveClick: () => {
              processImport(importData.lineups);
            },
          });
        } else {
          processImport(importData.lineups);
        }
      } catch (parseError) {
        message.error("解析文件失败，请检查文件格式");
      }
    };
    reader.readAsText(file.file);
  } catch (error) {
    message.error(`导入失败: ${error.message}`);
  }
};

const switchTeam = async (teamId) => {
  if (teamId === currentTeamId.value) return;

  const token = tokenStore.selectedToken;
  if (!token) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus(tokenId);
  if (status !== "connected") {
    message.error("WebSocket未连接，无法切换阵容");
    return;
  }

  switchingTeamId.value = teamId;
  state.value.isRunning = true;

  try {
    await tokenStore.sendMessageWithPromise(tokenId, "presetteam_saveteam", {
      teamId,
    });

    await delay(500);

    currentTeamId.value = teamId;
    message.success(`已切换到阵容 ${teamId}`);

    await refreshTeamInfo();
  } catch (error) {
    message.error(`切换阵容失败: ${error.message}`);
  } finally {
    switchingTeamId.value = null;
    state.value.isRunning = false;
  }
};

watch(
  () => tokenStore.selectedToken,
  (newToken, oldToken) => {
    if (newToken && newToken.id !== oldToken?.id) {
      loadSavedLineups();
      currentTeamInfo.value = null;
      presetTeamData.value = null;
      allHeroesData.value = {};
      currentTeamId.value = 1;

      const status = tokenStore.getWebSocketStatus(newToken.id);
      if (status === "connected") {
        refreshTeamInfo();
      }
    }
  },
);

watch(
  () =>
    tokenStore.selectedToken
      ? tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
      : null,
  (newStatus, oldStatus) => {
    if (
      newStatus === "connected" &&
      oldStatus !== "connected" &&
      tokenStore.selectedToken
    ) {
      setTimeout(() => {
        refreshTeamInfo();
      }, 500);
    }
  },
);

onMounted(() => {
  loadSavedLineups();

  const token = tokenStore.selectedToken;
  if (token) {
    const status = tokenStore.getWebSocketStatus(token.id);
    if (status === "connected") {
      refreshTeamInfo();
    }
  }
});
</script>

<style scoped lang="scss">
.lineup-saver {
  min-height: 300px;
}

.lineup-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.toolbar {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.current-team-section {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);

  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .drag-tip {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: normal;
  }
}

.heroes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.hero-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--bg-primary);
  border-radius: var(--border-radius-small);
  padding: var(--spacing-xs) var(--spacing-sm);
  width: 100%;
  transition: all 0.2s;
  cursor: grab;
  border: 2px solid transparent;

  &:hover {
    background: var(--primary-color-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  &.drag-over {
    border-color: var(--primary-color);
    background: var(--primary-color-light);
  }
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-left: auto;
  min-width: 60px;
  justify-content: center;
}

.hero-position {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-placeholder {
  font-size: 12px;
  color: var(--text-secondary);
}

.hero-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  cursor: pointer;
}

.hero-avatar-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.hero-name-small-inline {
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-level-small-inline {
  font-size: 10px;
  color: white;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 2px 6px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(240, 147, 251, 0.3);
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  flex: 1;
}

.hero-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.hero-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.hero-level {
  font-size: var(--font-size-xs);
  color: var(--text-accent);
  font-weight: 500;
}

.hero-fish {
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  background: linear-gradient(
    135deg,
    rgba(114, 46, 209, 0.15) 0%,
    rgba(114, 46, 209, 0.08) 100%
  );
  border: 1px solid rgba(114, 46, 209, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  align-self: flex-start;
  margin-bottom: 6px;
  font-weight: 500;
}

.hero-stats {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 3px;

  .stat-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  span {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
    white-space: nowrap;
    min-width: 90px;
    text-align: center;
  }

  .stat-power {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
    font-size: 12px;
  }

  .stat-attack {
    background: linear-gradient(135deg, #ffa940 0%, #fa8c16 100%);
    color: white;
  }

  .stat-hp {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    color: white;
  }

  .stat-speed {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
  }
}

.hero-fish-skill-inline {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.hero-fish-slots-inline {
  display: inline-flex;
  gap: 3px;
  margin-left: 4px;
  padding-left: 6px;
  border-left: 1px solid rgba(114, 46, 209, 0.2);
}

.slot-dot-small {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.hero-artifact {
  font-size: var(--font-size-xs);
}

.exchange-btn {
  flex-shrink: 0;
  width: 100%;
}

.remove-btn {
  flex-shrink: 0;
  width: 100%;
}

.saved-lineups-section {
  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.empty-tip {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.saved-lineups-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.saved-lineup-item {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
}

.lineup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.lineup-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.lineup-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.lineup-heroes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.lineup-heroes-row {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-sm);
}

.lineup-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 110px;
  padding: 8px 6px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-small);
}

.hero-avatar {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius-small);
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.hero-avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius-small);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.hero-info-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.hero-header-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 4px;
}

.hero-name-small {
  font-size: 13px;
  color: var(--text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-level-small {
  font-size: 12px;
  color: white;
  font-weight: 600;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 2px 6px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(240, 147, 251, 0.3);
}

.hero-fish-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4px;
  gap: 2px;
  background: linear-gradient(
    135deg,
    rgba(114, 46, 209, 0.12) 0%,
    rgba(114, 46, 209, 0.06) 100%
  );
  border: 1px solid rgba(114, 46, 209, 0.18);
  border-radius: 6px;
  padding: 4px 8px;
  width: 100%;
}

.hero-fish-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.hero-stats-small {
  font-size: 10px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;

  .stat-row-small {
    display: flex;
    justify-content: center;
    gap: 4px;
  }

  span {
    padding: 3px 5px;
    border-radius: 4px;
    font-weight: 500;
    white-space: nowrap;
    min-width: 70px;
    text-align: center;
  }

  .stat-power {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
  }

  .stat-attack {
    background: linear-gradient(135deg, #ffa940 0%, #fa8c16 100%);
    color: white;
  }

  .stat-hp {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    color: white;
  }

  .stat-speed {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
  }
}

.hero-fish-name {
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 500;
}

.hero-fish-skill-name {
  font-size: 10px;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 4px;
  font-weight: 500;
}

.hero-fish-slots {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding-top: 3px;
}

.lineup-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.quick-switch-section {
  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.team-selector {
  display: flex;
  gap: var(--spacing-xs);
}

.refine-modal-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.equip-refine-section {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
}

.equip-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-light);
}

.equip-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.equip-level {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.equip-bonus {
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  margin-left: auto;
}

.slots-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.slot-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-small);
  border-left: 3px solid var(--border-light);

  &.locked {
    border-left-color: var(--primary-color);
    background: var(--primary-color-light);
  }

  &.color-1 {
    border-left-color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  &.color-2 {
    border-left-color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
  }

  &.color-3 {
    border-left-color: #2196f3;
    background: rgba(33, 150, 243, 0.1);
  }

  &.color-4 {
    border-left-color: #9c27b0;
    background: rgba(156, 39, 176, 0.1);
  }

  &.color-5 {
    border-left-color: #ff9800;
    background: rgba(255, 152, 0, 0.1);
  }

  &.color-6 {
    border-left-color: #f44336;
    background: rgba(244, 67, 54, 0.1);
  }
}

.slot-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  min-width: 30px;
}

.slot-attr {
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.attr-name {
  color: var(--text-primary);
}

.attr-value {
  color: var(--primary-color);
  font-weight: var(--font-weight-medium);
}

.slot-empty {
  flex: 1;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

.no-equipment {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--spacing-lg);
}

.exchange-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.current-hero-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.hero-filter-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);

  .filter-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
}

.hero-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-sm);
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-xs);
}

.hero-select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    background: var(--bg-secondary);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: var(--primary-color);
    background: var(--primary-color-light);
  }

  &.quality-red {
    border-color: rgba(245, 34, 45, 0.3);

    &:hover {
      border-color: rgba(245, 34, 45, 0.6);
      background: rgba(245, 34, 45, 0.1);
    }

    &.selected {
      border-color: #f5222d;
      background: rgba(245, 34, 45, 0.15);
    }
  }

  &.quality-orange {
    border-color: rgba(250, 173, 20, 0.3);

    &:hover {
      border-color: rgba(250, 173, 20, 0.6);
      background: rgba(250, 173, 20, 0.1);
    }

    &.selected {
      border-color: #faad14;
      background: rgba(250, 173, 20, 0.15);
    }
  }

  &.quality-purple {
    border-color: rgba(114, 46, 209, 0.3);

    &:hover {
      border-color: rgba(114, 46, 209, 0.6);
      background: rgba(114, 46, 209, 0.1);
    }

    &.selected {
      border-color: #722ed1;
      background: rgba(114, 46, 209, 0.15);
    }
  }
}

.hero-select-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-select-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-align: center;
}

.hero-select-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.hero-artifact-id {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.saved-lineups-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.team-tabs {
  display: flex;
  gap: var(--spacing-xs);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-sm);
  justify-content: space-between;
  align-items: center;
}

.team-tabs-left {
  display: flex;
  gap: var(--spacing-xs);
}

.team-tabs-right {
  display: flex;
  gap: var(--spacing-xs);
}

.team-tab {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  transition: all 0.2s;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-color);
    color: white;
  }
}

.tab-count {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.lineups-list {
  max-height: 50vh;
  overflow-y: auto;
}

.lineup-card {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  margin-bottom: var(--spacing-sm);
  overflow: hidden;
}

.lineup-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--bg-secondary);
  }
}

.lineup-title-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.expand-icon {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  width: 12px;
}

.lineup-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.lineup-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.lineup-weapon-tag {
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 0, 122, 255), 0.1);
  padding: 1px 6px;
  border-radius: var(--border-radius-small);
  margin-left: var(--spacing-xs);
}

.lineup-quick-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.lineup-detail {
  padding: var(--spacing-sm);
  padding-top: 0;
  border-top: 1px solid var(--border-color);
}

.lineup-heroes-detail {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.lineup-hero-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
}

.hero-pos {
  color: var(--text-tertiary);
}

.hero-name {
  color: var(--text-primary);
}

.hero-artifact {
  color: var(--primary-color);
  font-size: var(--font-size-xs);
}

.hero-fish-tag {
  color: var(--success-color);
  font-size: var(--font-size-xs);
  background: rgba(var(--success-color-rgb, 0, 128, 0), 0.1);
  padding: 1px 4px;
  border-radius: var(--border-radius-small);
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hero-fish-skill {
  color: var(--primary-color);
  font-weight: normal;
}

.hero-fish-slots {
  display: inline-flex;
  gap: 2px;
  margin-left: 4px;
}

.slot-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.tech-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tech-type-section {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.tech-type-header {
  background: var(--bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-weight: bold;
  color: var(--primary-color);
}

.tech-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--border-color);
}

.tech-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-primary);
  font-size: var(--font-size-sm);
}

.tech-name {
  color: var(--text-secondary);
}

.tech-level {
  color: var(--text-primary);
  font-weight: 500;
}

.no-tech-data {
  text-align: center;
  color: var(--text-tertiary);
  padding: var(--spacing-lg);
}

.lineup-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.no-lineup-tip {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--spacing-lg);
}
</style>
