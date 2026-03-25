<template>
  <div class="fight-pvp-container">
    <!-- 主卡片容器 -->
    <div class="status-card main-card">
      <!-- 卡片头部 -->
      <div class="card-header">
        <img
          src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"
          alt="切磋图标"
          class="status-icon"
        />
        <div class="status-info">
          <h3>切磋系统</h3>
          <p>查询对手信息并进行切磋</p>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="action-section">
        <div class="input-group">
          <n-input
            v-model:value="targetId"
            type="text"
            placeholder="请输入对手ID"
            class="target-input"
            size="medium"
          />
          <n-button
            type="primary"
            :disabled="loading1 || !targetId"
            @click="getTargetInfo"
            size="medium"
          >
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            查询对手
          </n-button>
        </div>

        <div class="fight-options">
          <div class="option-item">
            <span class="option-label">切磋次数：</span>
            <n-select
              v-model:value="fightNum"
              :options="options"
              size="medium"
              class="fight-count-select"
              filterable
              tag
              allow-create
              :placeholder="'请选择或输入切磋次数'"
              @update:value="handleFightNumChange"
            />
          </div>

          <div class="option-actions">
            <n-button
              type="success"
              :disabled="loading1 || !targetId || !memberData"
              @click="fightPVPRefresh"
              size="medium"
            >
              <template #icon>
                <n-icon>
                  <Trophy />
                </n-icon>
              </template>
              开始切磋
            </n-button>

            <n-button
              type="default"
              :disabled="loading1 || !memberData"
              @click="handleExport1"
              size="medium"
            >
              <template #icon>
                <n-icon>
                  <Copy />
                </n-icon>
              </template>
              导出数据
            </n-button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading1" class="loading-section">
        <n-spin size="large">
          <template #description>
            {{ loadingText }}
          </template>
        </n-spin>
      </div>

      <!-- 对手信息卡片 -->
      <div v-else-if="memberData" ref="exportDom" class="content-section">
        <!-- 对手信息和阵容左右布局 -->
        <div class="opponent-main-layout">
          <!-- 左侧对手信息 -->
          <div class="info-card opponent-card left-card">
            <div class="card-title">
              <h4>对手信息</h4>
            </div>

            <!-- 表格形式显示对手信息 -->
            <div class="opponent-info-table">
              <table class="info-table">
                <tbody>
                  <tr>
                    <td class="avatar-cell" rowspan="8">
                      <n-avatar
                        round
                        :size="60"
                        :src="memberData.headImg"
                        class="opponent-avatar"
                      />
                    </td>
                    <td class="label-cell">游戏名：</td>
                    <td class="value-cell">
                      {{ memberData.name }}
                      <n-tag
                        v-if="memberData.legacy > 0"
                        :style="{
                          color: '#fff',
                          backgroundColor:
                            legacyColorMap[memberData.legacy]?.value,
                        }"
                        size="small"
                        style="margin-left: 8px"
                      >
                        {{ legacyColorMap[memberData.legacy]?.name || "未知" }}
                      </n-tag>
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">区服：</td>
                    <td class="value-cell">{{ memberData.serverName }}</td>
                  </tr>
                  <tr class="highlight-row">
                    <td class="label-cell">战力：</td>
                    <td class="value-cell power-value">
                      {{ memberData.power }}
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">玩具：</td>
                    <td class="value-cell">{{ memberData.lordWeaponId }}</td>
                  </tr>
                  <tr class="highlight-row">
                    <td class="label-cell">阵容：</td>
                    <td class="value-cell lineup">
                      <span class="red-count">红数: {{ memberData.red }}</span>
                      <span class="separator">/</span>
                      <span class="hole-count"
                        >孔数: {{ memberData.hole }}</span
                      >
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">俱乐部：</td>
                    <td class="value-cell">{{ memberData.legionName }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">俱乐部战力：</td>
                    <td class="value-cell">{{ memberData.MaxPower }}</td>
                  </tr>
                  <tr>
                    <td class="label-cell">当前红数：</td>
                    <td class="value-cell">{{ memberData.legionRed }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 右侧对手阵容 -->
          <div class="info-card heroes-card right-card">
            <div class="card-title">
              <h4>对手阵容</h4>
              <div class="card-title-right">
                <span class="hero-count"
                  >{{ memberData.heroList.length }} 名武将</span
                >
                <span class="click-hint">（点击头像图片可看详情）</span>
              </div>
            </div>

            <div class="heroes-grid compact">
              <div
                v-for="hero in memberData.heroList"
                :key="hero.heroId || hero.heroName"
                class="hero-card compact"
                @click="selectHeroInfo(hero)"
              >
                <div class="hero-avatar-container">
                  <div class="hero-circle">
                    <img
                      v-if="hero.heroAvate"
                      :src="hero.heroAvate"
                      :alt="hero.heroName"
                      class="hero-avatar-img"
                    />
                    <div v-else class="hero-placeholder">
                      {{ hero.heroName?.substring(0, 2) || "?" }}
                    </div>
                  </div>
                </div>

                <div class="hero-info compact">
                  <div class="hero-name-row">
                    <h5 class="hero-name">{{ hero.heroName || "未知武将" }}</h5>
                    <n-tag
                      :type="hero.HolyBeast ? 'success' : 'warning'"
                      size="small"
                      class="holy-beast-tag"
                    >
                      {{ hero.HolyBeast ? "已开四圣" : "未开四圣" }}
                    </n-tag>
                  </div>
                  <div class="hero-stats">
                    <span class="stat-item">战力: {{ hero.power || "0" }}</span>
                    <span class="stat-item">星级: {{ hero.star || "0" }}</span>
                    <span class="stat-item">红数: {{ hero.red || "0" }}</span>
                    <span class="stat-item" v-if="hero.HolyBeast"
                      >四圣等级: {{ hero.HBlevel }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 切磋结果卡片 -->
        <div v-if="fightResult" class="info-card result-card">
          <div class="card-title">
            <h4>切磋结果</h4>
            <div class="result-summary">
              <div class="summary-item match-count">
                <span class="summary-label">总次数：</span>
                <span class="summary-value">{{ fightNum }}</span>
              </div>
              <div class="summary-item win-count">
                <span class="summary-label">胜：</span>
                <span class="summary-value">{{ fightResult.winCount }}</span>
              </div>
              <div class="summary-item loss-count">
                <span class="summary-label">负：</span>
                <span class="summary-value">{{
                  fightNum - fightResult.winCount
                }}</span>
              </div>

              <div class="summary-item win-rate">
                <span class="summary-label">胜率：</span>
                <span class="summary-value"
                  >{{
                    ((fightResult.winCount / fightNum) * 100).toFixed(2)
                  }}%</span
                >
              </div>
              <div class="summary-item die-rate">
                <span class="summary-label">我方掉将率：</span>
                <span class="summary-value"
                  >{{
                    (
                      (fightResult.ourTotalDieHeroCount / (fightNum * 5)) *
                      100
                    ).toFixed(2)
                  }}%</span
                >
              </div>
              <div class="summary-item die-rate">
                <span class="summary-label">敌方掉将率：</span>
                <span class="summary-value"
                  >{{
                    (
                      (fightResult.enemyTotalDieHeroCount / (fightNum * 5)) *
                      100
                    ).toFixed(2)
                  }}%</span
                >
              </div>
            </div>
          </div>

          <div class="result-list">
            <div
              v-for="(battle, index) in fightResult.resultCount"
              :key="index"
              :class="['battle-result-item', battle.isWin ? 'win' : 'loss']"
            >
              <div class="battle-header">
                <span class="battle-index">第 {{ index + 1 }} 场</span>
                <n-tag :type="battle.isWin ? 'success' : 'error'" size="small">
                  {{ battle.isWin ? "胜利" : "失败" }}
                </n-tag>
              </div>

              <div class="battle-details">
                <div class="battle-side left-side">
                  <n-avatar
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
                  <n-avatar
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
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <n-empty description="请输入对手ID并点击查询按钮获取对手信息" />
      </div>
    </div>

    <!-- 武将详情模态框 -->
    <n-modal
      v-model:show="showHeroModal"
      class="hero-detail-modal"
      preset="card"
      title="武将信息"
      size="large"
      :bordered="false"
      :segmented="{ content: 'soft', footer: 'soft' }"
      :style="{ width: '600px' }"
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
          </div>
          <div class="hero-modal-basic">
            <h3 class="hero-modal-name">{{ heroModealTemp.heroName }}</h3>
            <div class="hero-modal-stats">
              <span class="stat-item">{{ heroModealTemp.power }}</span>
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
              {{ heroModealTemp.power }}
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
        <div class="modal-footer">
          <n-button type="default" @click="showHeroModal = false"
            >关闭</n-button
          >
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useMessage, NDatePicker, NPagination } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText,
} from "@vicons/ionicons5";
import {
  getLastSaturday,
  formatTimestamp,
  formatTimestamp1,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard,
} from "@/utils/clubBattleUtils";
import {
  gettoday,
  formatWarrankRecordsForExport,
  allianceincludes,
} from "@/utils/goldWarrankUtils";
import {
  HERO_DICT,
  HeroFillInfo,
  formatWeapon,
  legacycolor,
} from "@/utils/HeroList";
import html2canvas from "html2canvas";
import { downloadCanvasAsImage } from "@/utils/imageExport";

// 确保legacycolor在模板中可用
const legacyColorMap = legacycolor;

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible"]);

const message = useMessage();
const tokenStore = useTokenStore();

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const exportDom = ref(null);
const loading1 = ref(false);
const loadingText = ref("正在查询对手信息...");
const topranklist = ref(null);
const expandedMembers = ref(new Set());
const roleIdinput = ref("");
const queryDate = ref("");
const targetId = ref("");
const teamArray = ref(null);
//切磋对手信息
const memberData = ref(null);
//批量数量
const fightNum = ref(1);
//战斗结果
const fightResult = ref(null);

// 监听targetId变化，清除之前的切磋结果
watch(targetId, (newId, oldId) => {
  if (newId !== oldId) {
    fightResult.value = null;
  }
});
// 模态框控制符
const showHeroModal = ref(false);
//选中的武将信息
const heroModealTemp = ref(null);
const options = [
  {
    label: "1",
    value: 1,
  },
  {
    label: "10",
    value: 10,
  },
  {
    label: "25",
    value: 25,
  },
  {
    label: "50",
    value: 50,
  },
];
let player_date = { name: "", power: "" };

// 分页状态
const currentPage = ref(1);
const pageSize = ref(20); // 每页20条，共5页

// 计算总页数
const totalPages = computed(() => {
  if (!topranklist.value) return 0;
  return Math.ceil(Object.keys(topranklist.value).length / pageSize.value);
});

const selectHeroInfo = (heroInfo) => {
  showHeroModal.value = true;
  heroModealTemp.value = heroInfo;
};

// 获取当前页的数据
const currentPageData = computed(() => {
  if (!topranklist.value) return {};

  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  const entries = Object.entries(topranklist.value);

  return Object.fromEntries(entries.slice(startIndex, endIndex));
});
// 格式化战力
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

// 获取战斗样式类
const getBattleClass = (battle) => {
  const classes = [];
  if (battle.isWin) {
    classes.push("battle-win");
  } else {
    classes.push("battle-loss");
  }
  return classes.join(" ");
};

const formatScore = (score) => {
  return score.toFixed(0).toString();
};

const formatServerId = (ServerId) => {
  return (ServerId - 27).toFixed(0).toString();
};

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = "none";
};

// 切磋
const fetchfightPVP = async () => {
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

  loading1.value = true;
  loadingText.value = "正在进行切磋，请稍候...";
  queryDate.value = gettoday();

  try {
    let winCount = 0;
    let ourTotalDieHeroCount = 0; // 我方总掉落将领数
    let enemyTotalDieHeroCount = 0; // 敌方总掉落将领数
    let resultCount = [];
    for (var i = 0; i < fightNum.value; i++) {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "fight_startpvp",
        {
          targetId: targetId.value,
        },
        5000,
      );
      if (!result.battleData) {
        fightResult.value = null;
        message.warning("切磋错误");
        return;
      }
      //处理掉将情况
      let leftCount = 0;
      result.battleData.result.sponsor.teamInfo.forEach((item) => {
        if (item.hp == 0) {
          leftCount++;
        }
      });
      ourTotalDieHeroCount += leftCount;

      let rightCount = 0;
      result.battleData.result.accept.teamInfo.forEach((item) => {
        if (item.hp == 0) {
          rightCount++;
        }
      });
      enemyTotalDieHeroCount += rightCount;

      let tempObj = {
        leftName: result.battleData.leftTeam.name,
        leftheadImg: result.battleData.leftTeam.headImg,
        leftpower: formatPower(result.battleData.leftTeam.power),
        rightName: result.battleData.rightTeam.name,
        rightheadImg: result.battleData.rightTeam.headImg,
        rightpower: formatPower(result.battleData.rightTeam.power),
        //掉将情况
        leftDieHero: leftCount,
        rightDieHero: rightCount,
        isWin: result.battleData.result.isWin ? true : false, //对战结果
      };
      if (result.battleData.result.isWin) {
        winCount++;
      }
      resultCount.push(tempObj);
    }
    const teamData = {
      winCount,
      ourTotalDieHeroCount,
      enemyTotalDieHeroCount,
      resultCount,
    };
    fightResult.value = teamData;
    message.success("切磋完成");
    return teamData;
  } catch (error) {
    message.error(`查询失败: ${error.message}`);
    topranklist.value = null;
  } finally {
    loading1.value = false;
    loadingText.value = "正在查询对手信息...";
  }
};

// 查询
const fetchTargetInfo = async () => {
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

  // 清除之前的切磋结果
  fightResult.value = null;

  loading1.value = true;
  loadingText.value = "正在查询对手信息...";
  queryDate.value = gettoday();

  try {
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "rank_getroleinfo",
      {
        bottleType: 0,
        includeBottleTeam: false,
        isSearch: false,
        roleId: targetId.value,
      },
      5000,
    );

    if (!result.roleInfo && !result.legionInfo) {
      memberData.value = null;
      message.warning("未查询到对手信息");
      return;
    }
    const teamData = {};
    const heroAndholdAndRed = getHeroInfo(result.roleInfo.heroes);
    // 处理鱼灵信息
    const fishInfo = HeroFillInfo(result.roleInfo);
    // 将鱼灵信息添加到英雄列表中
    heroAndholdAndRed.heroList.forEach((hero) => {
      hero.PearlInfo = fishInfo[hero.artifactId] || {};
    });
    // 俱乐部名称
    teamData.legionName = result.legionInfo?.name || "无俱乐部";
    // 俱乐部当前红数
    teamData.legionRed =
      result.legionInfo?.statistics["battle:red:quench"] || "无";
    // 俱乐部历史最高红数
    teamData.legionMaxRed = result.legionInfo?.statistics["red:quench"] || "无";
    // 俱乐部历史最高战力
    teamData.MaxPower = formatPower(
      result.legionInfo?.statistics["max:power"] || "0",
    );
    // 切磋对手武将信息
    teamData.heroList = heroAndholdAndRed.heroList;
    // 切磋对手玩家头像
    teamData.headImg = result.roleInfo.headImg;
    teamData.lordWeaponId = formatWeapon(result.roleInfo.lordWeaponId);
    // 切磋对手玩家名称
    teamData.name = result.roleInfo.name;
    teamData.power = formatPower(result.roleInfo.power);
    teamData.serverName = result.roleInfo.serverName;
    teamData.hole = heroAndholdAndRed.holeCount;
    teamData.red = heroAndholdAndRed.redCount;
    teamData.legacy = result.roleInfo.legacy?.color || 0; // 功法等级
    memberData.value = teamData;
    message.success("对手信息加载成功");
    return teamData;
  } catch (error) {
    message.error(`查询失败: ${error.message}`);
    topranklist.value = null;
  } finally {
    loading1.value = false;
    loadingText.value = "正在查询对手信息...";
  }
};

/**
 * 提取数组中的英雄信息
 * @param {Object} heroObj
 */
const getHeroInfo = (heroObj) => {
  //统计总红数
  let redCount = 0;
  let holeCount = 0;
  let heroList = [];
  Object.values(heroObj).forEach((hero) => {
    let heroInfo = HERO_DICT[hero.heroId];
    let equipmentInfo = getEquipment(hero.equipment);
    let tempObj = {
      heroId: hero.heroId, //英雄ID
      heroSort: hero.battleTeamSlot, //阵容站位
      artifactId: hero.artifactId, //英雄装备ID，用于匹配鱼灵信息
      power: formatPower(hero.power), //英雄战力
      star: hero.star, //英雄星级
      equipment: hero.equipment, //英雄具体孔数和红数
      heroName: heroInfo.name, //英雄姓名
      heroAvate: heroInfo.avatar,
      level: hero.level, //英雄等级
      hole: equipmentInfo.holeCount, //英雄开孔数量
      red: equipmentInfo.redCount, //英雄红数
      HolyBeast: hero.hB?.active, //激活四圣
      HBlevel: hero.hB?.order || 0, //四圣等级
    };
    redCount += tempObj.red;
    holeCount += tempObj.hole;
    heroList.push(tempObj);
  });
  return {
    redCount,
    holeCount,
    heroList: heroList.sort((a, b) => {
      return a.heroSort - b.heroSort;
    }),
  };
};

//获取装备信息红数和孔数
const getEquipment = (equipment) => {
  let redCount = 0;
  let holeCount = 0;
  let equipArr = [];
  //此处遍历4件装备
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

// 处理分页大小改变
const handlePageSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
};
// 刷新战绩
const fightPVPRefresh = () => {
  fetchfightPVP();
};

//处理切磋次数变化
const handleFightNumChange = (value) => {
  // 确保输入的是有效的数字
  if (typeof value === "string") {
    // 如果是字符串，转换为数字
    const num = parseInt(value, 10);
    // 确保数字有效且大于0,尽量限制最大次数,万一谁请求打多了,可不是什么好事情
    if (!isNaN(num) && num > 0 && num <= 50) {
      fightNum.value = num;
    } else {
      // 否则重置为默认值1
      fightNum.value = 1;
    }
  } else {
    if (value > 0 && value <= 50) {
      // 如果已经是数字类型，直接使用
      fightNum.value = value;
    } else {
      fightNum.value = 1;
    }
  }
};

//获取对手信息
const getTargetInfo = () => {
  fetchTargetInfo();
};

const handleExport1 = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    alert("未找到要导出的DOM元素");
    return;
  }

  try {
    // 获取结果列表元素
    const resultList = exportDom.value.querySelector(".result-list");
    let originalMaxHeight = "";
    let originalOverflow = "";
    let originalPaddingRight = "";

    // 临时移除结果列表的高度限制，让所有结果都可见
    if (resultList) {
      originalMaxHeight = resultList.style.maxHeight;
      originalOverflow = resultList.style.overflowY;
      originalPaddingRight = resultList.style.paddingRight;

      resultList.style.maxHeight = "none";
      resultList.style.overflowY = "visible";
      resultList.style.paddingRight = "0";
    }

    // 等待DOM更新
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 生成canvas并导出
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: "#ffffff", // 避免透明背景（默认透明）
      logging: false, // 关闭控制台日志
      allowTaint: true, // 允许跨域图片
      taintTest: false, // 关闭跨域测试
    });

    // 恢复原始样式
    if (resultList) {
      resultList.style.maxHeight = originalMaxHeight;
      resultList.style.overflowY = originalOverflow;
      resultList.style.paddingRight = originalPaddingRight;
    }

    downloadCanvasAsImage(canvas, "切磋结果.png");
  } catch (err) {
    console.error("导出图片失败:", err);
    alert("导出图片失败，请重试");
  }
};

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear();
};

// 暴露方法给父组件
defineExpose({
  fetchfightPVP,
});

// Inline 模式：挂载后自动拉取
onMounted(() => {
  // if (props.inline) {
  //     topranklistRefresh()
  // }
});
</script>

<style scoped lang="scss">
.fight-pvp-container {
  width: 100%;
  // padding: 16px;
}

.main-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.main-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.card-header .status-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 12px;
  margin-right: 16px;
}

.card-header .status-info {
  flex: 1;
}

.card-header .status-info h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-header .status-info p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.action-section {
  margin-bottom: 24px;
}

.action-section .input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-section .input-group .target-input {
  flex: 1;
}

.action-section .fight-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.action-section .fight-options .option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-section .fight-options .option-item .option-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.action-section .fight-options .option-item .fight-count-select {
  width: 120px;
}

.action-section .fight-options .option-actions {
  display: flex;
  gap: 12px;
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
}

.empty-state {
  padding: 40px 20px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  text-align: center;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-large);
  padding: 12px;
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.info-card .card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-light);
}

.info-card .card-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-card .card-title .card-title-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-card .card-title .hero-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-card .card-title .click-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
}

/* 左右卡片的额外优化 */
.info-card.left-card,
.info-card.right-card {
  padding: 10px;
  display: flex;
  flex-direction: column;
}

/* 确保对手信息卡片和对手阵容卡片高度完全一致 */
.info-card.left-card,
.info-card.right-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 调整对手信息表格的内部间距 */
.info-table {
  border-spacing: 0;
  border-collapse: collapse;
}

.info-table tr {
  display: table-row;
  height: 26px;
}

.info-card.left-card .card-title,
.info-card.right-card .card-title {
  margin-bottom: 6px;
  padding-bottom: 4px;
}

.info-card.left-card .opponent-info-table {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-card.left-card .info-table {
  flex: 1;
}

/* 对手信息表格样式 */
.opponent-info-table {
  width: 100%;
  overflow-x: auto;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto; /* 自动表格布局，根据内容调整宽度 */
}

.info-table td {
  padding: 2px 5px; /* 进一步减少内边距 */
  font-size: 13px; /* 略微减小字体大小 */
  vertical-align: middle;
  height: 24px; /* 进一步减小行高 */
  line-height: 24px; /* 确保行高与内容对齐 */
}

.info-table .avatar-cell {
  width: 70px;
  text-align: center;
  padding: 6px;
}

.info-table .opponent-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--primary-color-light);
}

.info-table .label-cell {
  width: 100px;
  color: var(--text-secondary);
  text-align: right;
  font-weight: 500;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  white-space: nowrap; /* 确保标签不换行 */
}

.info-table .value-cell {
  color: var(--text-primary);
  text-align: left;
  font-weight: 500;
  padding-left: 10px;
  white-space: nowrap; /* 防止文本自动换行 */
  min-width: 120px; /* 确保有足够宽度显示内容 */
}

.info-table .highlight-row .value-cell {
  color: var(--primary-color);
  font-weight: 600;
}

.info-table .lineup {
  display: flex;
  gap: 6px;
  align-items: center;
}

.info-table .lineup .red-count {
  color: #ef4444;
  font-weight: 600;
}

.info-table .lineup .separator {
  color: var(--text-secondary);
}

.info-table .lineup .hole-count {
  color: #10b981;
  font-weight: 600;
}

.opponent-main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .opponent-main-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
}

.opponent-main-layout .left-card {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
}

.opponent-main-layout .right-card {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .opponent-main-layout .left-card {
    grid-column: 1;
    grid-row: 1;
  }
  .opponent-main-layout .right-card {
    grid-column: 1;
    grid-row: 2;
  }
}

/* 英雄卡片样式 */
.heroes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
  justify-items: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 确保整个网格在容器中居中 */
  height: 100%;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .heroes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}

.heroes-grid.compact {
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  justify-items: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}

@media (max-width: 1200px) {
  .heroes-grid.compact {
    grid-template-columns: repeat(5, minmax(100px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .heroes-grid.compact {
    grid-template-columns: repeat(5, minmax(80px, 1fr));
    gap: 8px;
  }
}

.hero-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hero-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-color-light);
}

.hero-card.compact {
  padding: 12px;
  min-height: auto;
  width: 130px; /* 调整卡片宽度 */
  height: 190px; /* 调整卡片高度 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hero-avatar-container {
  position: relative;
  margin-bottom: 12px;
}

.hero-card.compact .hero-avatar-container {
  margin-bottom: 10px;
}

.hero-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.hero-card.compact .hero-circle {
  width: 64px;
  height: 64px;
}

.hero-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-secondary);
}

.hero-info {
  text-align: center;
}

.hero-name-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  height: 22px; /* 设置固定行高 */
}

.hero-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 22px; /* 与行高保持一致 */
  display: inline-flex;
  align-items: center;
  height: 100%;
}

.hero-card.compact .hero-name {
  font-size: 13px;
  margin: 0;
  line-height: 22px; /* 与行高保持一致 */
}

.holy-beast-tag {
  font-size: 10px;
  padding: 2px 6px;
  margin: 0;
  display: inline-flex;
  align-items: center;
  height: 22px; /* 与行高保持一致 */
  vertical-align: middle;
}

.hero-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-stats .stat-item {
  font-size: 12px;
  color: var(--text-secondary);
}

.hero-card.compact .hero-stats .stat-item {
  font-size: 11px;
  line-height: 16px;
}

/* 结果卡片样式 */
.result-card .card-title .result-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.result-summary .summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.result-summary .summary-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.result-summary .summary-value {
  font-size: 16px;
  font-weight: 600;
}

.result-summary .win-rate .summary-value {
  color: var(--success-color);
}

.result-summary .die-rate .summary-value {
  color: var(--warning-color);
}

.result-summary .win-count .summary-value {
  color: var(--success-color);
}

.result-summary .loss-count .summary-value {
  color: var(--error-color);
}

.result-list {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 1行显示2场战斗结果 */
  gap: 12px;
  max-height: 500px; /* 限制最大高度 */
  overflow-y: auto; /* 添加垂直滚动 */
  padding-right: 8px; /* 为滚动条预留空间 */
}

/* 自定义滚动条样式 */
.result-list::-webkit-scrollbar {
  width: 6px;
}

.result-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.result-list::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.result-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

.battle-result-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: 10px;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1200px) {
  .result-list {
    grid-template-columns: 1fr; /* 在小屏幕上恢复1行1场 */
  }
}

.battle-result-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.battle-result-item.win {
  border-left: 4px solid var(--success-color);
  background-color: rgba(16, 185, 129, 0.05);
}

.battle-result-item.loss {
  border-left: 4px solid var(--error-color);
  background-color: rgba(239, 68, 68, 0.05);
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.battle-index {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.battle-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 768px) {
  .battle-details {
    flex-direction: column;
    gap: 12px;
  }
}

.battle-side {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.battle-side.left-side {
  justify-content: flex-end;
  text-align: right;
}

.battle-side.right-side {
  justify-content: flex-start;
}

.side-avatar {
  flex-shrink: 0;
}

.side-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.side-power,
.side-die {
  font-size: 12px;
  color: var(--text-secondary);
}

.battle-vs {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* 英雄详情模态框样式 */
.hero-detail-modal .hero-modal-content {
  padding: 20px 0;
}

.hero-modal-header {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

@media (max-width: 768px) {
  .hero-modal-header {
    flex-direction: column;
    text-align: center;
  }
}

.hero-modal-avatar {
  flex-shrink: 0;
}

.hero-modal-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero-modal-basic {
  flex: 1;
}

.hero-modal-name {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
}

.hero-modal-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.hero-modal-stats .stat-item {
  font-size: 14px;
  color: var(--text-primary);
}

.hero-modal-stats .stat-item:first-child {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

.hero-modal-details {
  margin-bottom: 24px;
}

.hero-modal-equipment .section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.equipment-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.equipment-slots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.equipment-slot {
  width: 20px;
  height: 20px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.equipment-slot.red-slot {
  background-color: #ef4444;
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

/* 鱼珠洗练样式 */
.ModalEquipment {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 5px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .action-section .fight-options {
    flex-direction: column;
    align-items: stretch;
  }

  .heroes-card .heroes-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .main-card {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .action-section .input-group {
    flex-direction: column;
  }

  .result-card .card-title .result-summary {
    flex-direction: column;
    gap: 12px;
  }

  .result-card .battle-details {
    flex-direction: column;
    gap: 16px;
  }

  .result-card .battle-side {
    justify-content: center !important;
  }
}

@media (max-width: 480px) {
  .info-card {
    padding: 12px;
  }

  .heroes-card .heroes-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .heroes-card .hero-card {
    padding: 12px;
  }
}
</style>
