<template>
  <div class="island-panel">
    <!-- 顶部工具条 -->
    <div class="ip-toolbar">
      <NSpace size="small" align="center">
        <NTag v-if="islandLabel" size="small" type="warning" :bordered="false">
          当前所在：{{ islandLabel }}
        </NTag>
        <span v-if="lastLoadAt" class="ip-dim">更新于 {{ lastLoadAt }}</span>
      </NSpace>
      <NSpace size="small">
        <NSwitch v-model:value="autoRefresh" size="small">
          <template #checked>自动 60s</template>
          <template #unchecked>手动</template>
        </NSwitch>
        <NButton size="small" secondary :loading="loading" @click="load">
          <template #icon
            ><NIcon><Refresh /></NIcon
          ></template>
          立即查询
        </NButton>
      </NSpace>
    </div>

    <div v-if="loading && !groupSelf" class="ip-state">
      <NSpin size="small" />
      <span>正在查询盐场小组积分…</span>
    </div>
    <NEmpty
      v-else-if="!groupSelf"
      description="暂无盐场小组积分"
      size="large"
      style="padding: 28px 0"
    >
      <template #extra>
        <span class="ip-dim">{{ emptyHint }}</span>
      </template>
    </NEmpty>

    <template v-else>
      <!-- ============ 所在岛屿 ============ -->
      <div class="ip-island">
        <div class="ip-island-name">
          {{ islandLabel }}
          <NTag v-if="mapLabel" size="tiny" type="warning" :bordered="false">{{
            mapLabel
          }}</NTag>
        </div>
        <NGrid x-gap="10" y-gap="10" cols="3" class="ip-stats">
          <NGi>
            <div class="ip-stat">
              <span class="ip-stat-label">小组排名</span>
              <span class="ip-stat-value">
                {{ groupSelf.rank
                }}<span class="ip-dim"> / {{ fmtNum(groupTotal) }}</span>
              </span>
            </div>
          </NGi>
          <NGi>
            <div class="ip-stat">
              <span class="ip-stat-label">本岛总榜</span>
              <span class="ip-stat-value">
                {{ selfTotal?.rank ?? "-"
                }}<span class="ip-dim"> / {{ fmtNum(rankCnt) }}</span>
              </span>
            </div>
          </NGi>
          <NGi>
            <div class="ip-stat">
              <span class="ip-stat-label">盐场积分</span>
              <span class="ip-stat-value ip-hot">{{
                fmtNum(groupSelf.score)
              }}</span>
            </div>
          </NGi>
        </NGrid>
      </div>

      <!-- ============ 所有岛屿 ============ -->
      <div class="ip-section-title">所有岛屿</div>
      <div class="ip-ladder">
        <div
          v-for="isl in islandLadder"
          :key="isl.type"
          class="ip-ladder-row"
          :class="{
            'ip-ladder-now': isl.type === islandType,
            'ip-ladder-dim': isl.type > islandType,
          }"
        >
          <div class="ip-ladder-head">
            <span class="ip-ladder-name">{{ isl.name }}</span>
            <NTag
              v-if="isl.type === islandType"
              size="tiny"
              type="warning"
              :bordered="false"
            >
              当前
            </NTag>
            <span v-else class="ip-dim ip-ladder-tip">
              {{ isl.type < islandType ? "已晋升" : "未解锁" }}
            </span>
          </div>
          <div class="ip-ladder-quota">{{ isl.quota }}</div>
        </div>
      </div>

      <!-- ============ 小组积分榜 ============ -->
      <div class="ip-section-title">小组积分榜 · {{ boardRows.length }} 条</div>
      <NEmpty
        v-if="!boardRows.length"
        description="该榜暂无数据"
        size="small"
        style="padding: 16px 0"
      />
      <div v-else class="ip-rank">
        <div
          v-for="item in boardRows"
          :key="item.rowKey"
          class="ip-row"
          :class="{ 'ip-row-me': isMe(item) }"
        >
          <span class="ip-rk" :class="rankClass(item.seq)">
            {{ item.seq }}
          </span>
          <span class="ip-nm">{{ item.name }}</span>
          <span class="ip-sc">{{ fmtNum(item.score) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { Refresh } from "@vicons/ionicons5";
import {
  NButton,
  NEmpty,
  NGi,
  NGrid,
  NIcon,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  useMessage,
} from "naive-ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { getRankQueryDate } from "@/utils/clubBattleUtils";

/** 服务端单次返回上限（实测 [1-1000] 实收 1000 条）；小组榜实际只有一组约 20 条 */
const TOP_LIMIT = 1000;

/**
 * 本岛总榜只用来读 `selfRankInfo`（我方在岛内的名次）与 `rankCnt`（本岛总人数），
 * 不展示该榜列表，因此只取极少条数即可，避免白拉 1000 条。
 */
const TOTAL_PROBE_RANGE = 3;

/**
 * 盐场岛屿体系。
 * - 阶位顺序取自客户端晋级路径 [grey, green, blue, purple, golden]；
 *   真实岛屿读 `legion_getinfo.islandType`（实测 1=灰盐岛、2=青铜岛）。
 *   ⚠️ 是「灰**盐**岛」不是「灰岩岛」——官方名称取自游戏 language bundle。
 * - `quota` 为各岛屿月度名额，取自配置表 `ConstantConf.config`（官方）。
 *   客户端 `_initMonthRankRuleMap` 中 month=9 的对应关系：
 *     grey  → autumnLegionWarGreyMonthUp[1]
 *     green → autumnLegionWarGreenMonthUp[1] / GreenMonthHold[1] / GreenMonthDown[1]
 *     blue  → BlueMonthUp1[0](晋级天宫) / BlueMonthUp2[0](晋级月宫) / BlueMonthHold[0] / BlueMonthDown[0]
 *     紫青月宫 → PurpleMonthDown[0]；黄金天宫 → 淘汰赛阶段
 *   ⚠️ 这些是**按月索引的数组**，换月后取值不同，需重新对照配置表。
 */
const islandLadder = [
  { type: 1, name: "灰盐岛", quota: "起始 2000 支 · 月晋级 1040" },
  { type: 2, name: "青铜岛", quota: "月晋级 344 · 保级 240 · 降级 616" },
  {
    type: 3,
    name: "秘蓝岛",
    quota: "晋级天宫 64 · 晋级月宫 160 · 保级 196 · 降级 120",
  },
  { type: 4, name: "紫青月宫", quota: "月降级 160" },
  { type: 5, name: "黄金天宫", quota: "淘汰赛：胜者赛 / 败者赛 / 决赛" },
];
const ISLAND_NAMES = Object.fromEntries(
  islandLadder.map((x) => [x.type, x.name]),
);

/**
 * 当前赛制：取自游戏配置表 `LegionWarMapConf`（对应 `legion_getinfo.emLegionWarMap`
 * 与 `legion_getbattlefield.info.legionWarMapType`）。
 * 注意：历史上有过一个基于 `legionWarType` 枚举且名称有误的映射（已删除），这里统一用配置表原文。
 */
const MAP_NAMES = {
  13: "灰盐岛周赛",
  14: "灰盐岛进阶赛",
  15: "灰盐岛月赛",
  16: "青铜岛周赛",
  17: "青铜岛月赛",
  18: "秘蓝岛周赛",
  19: "秘蓝岛月赛",
  20: "月宫周赛",
  21: "月宫月赛",
  22: "天宫胜者赛",
  23: "天宫败者赛",
  24: "天宫决赛",
  25: "青龙试炼",
  26: "白虎试炼",
  27: "朱雀试炼",
  28: "玄武试炼",
};

/** "YYYY/MM/DD" → "yyMMdd" */
const ymdToYymmdd = (s) => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(String(s || "").trim());
  return m ? m[1].slice(2) + m[2] + m[3] : "";
};

const tokenStore = useTokenStore();
const message = useMessage();

const loading = ref(false);
const islandType = ref(-1);
const mapType = ref(0);
const weekDate = ref("");
const groupResp = ref(null);
const totalResp = ref(null);
const rows = ref([]);
const lastLoadAt = ref("");
const autoRefresh = ref(false);
let timer = null;

/** 岛屿名称由 islandType 派生（islandType 为 -1 时视为未加载，返回空串隐藏标签） */
const islandLabel = computed(() =>
  islandType.value > 0
    ? ISLAND_NAMES[islandType.value] || `未知岛屿(${islandType.value})`
    : "",
);
/** 当前赛制名称，如「灰盐岛进阶赛」 */
const mapLabel = computed(() =>
  mapType.value ? MAP_NAMES[mapType.value] || `赛制 ${mapType.value}` : "",
);
const groupSelf = computed(() => groupResp.value?.selfRankInfo || null);
/** 本岛总榜的我方条目，仅用于统计卡「本岛总榜」一格 */
const selfTotal = computed(() => totalResp.value?.selfRankInfo || null);
const rankCnt = computed(() => Number(totalResp.value?.rankCnt || 0));
/** 小组榜无 rankCnt，退化为列表长度 */
const groupTotal = computed(() => {
  const list = groupResp.value?.legionList?.length || 0;
  return Number(groupResp.value?.rankCnt || 0) || list;
});

const emptyHint = computed(() =>
  tokenStore.selectedToken
    ? "可能未报名盐场，或当前小组无数据"
    : "请先在左侧选择游戏角色",
);

function rankClass(r) {
  const n = Number(r);
  if (n <= 3) return "ip-rk-top";
  if (n <= 10) return "ip-rk-ten";
  return "";
}

/** 统一数值格式化：大数转万/亿，小数保留 1 位 */
const fmtNum = (v) => {
  if (v == null || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return String(Math.round(n * 10) / 10);
};

const meIds = computed(() => {
  const s = new Set();
  const id = groupSelf.value?.id;
  if (id != null) s.add(Number(id));
  return s;
});
const isMe = (item) => item.id != null && meIds.value.has(Number(item.id));

/**
 * 小组积分榜展示行。
 * 序号**按行号重新编号**（第 1 行=1、第 2 行=2…）：服务端 `legionList` 已按名次升序返回
 * （实测下标与 rank 一致、积分严格非递增），行号即名次，且不受服务端字段异常影响。
 * 我方若不在返回区间内则补到末尾（同小组一般不会发生）。
 */
const boardRows = computed(() => {
  const list = [...rows.value];
  const mine = groupSelf.value;
  if (mine && !list.some((r) => Number(r.id) === Number(mine.id))) {
    list.push(mine);
  }
  return list.map((r, i) => ({
    ...r,
    rowKey: String(r.id ?? r.rank ?? r.name ?? i),
    seq: i + 1,
  }));
});

/**
 * 拉取积分数据：
 * ① legion_getinfo → islandType / emLegionWarMap / mapList
 * ② mapList 末项 warDate → 最近一场比赛日（yyMMdd）
 * ③ saltroad_getsaltroadwargrouprank → 小组榜 legionList / selfRankInfo
 * ④ saltroad_getsaltroadwartotalrank → 仅供统计卡读取我方本岛名次与总人数（不展示榜单）
 */
async function load() {
  const token = tokenStore.selectedToken;
  if (!token) return;
  const tokenId = token.id;
  const status = tokenStore.getWebSocketStatus?.(tokenId);
  if (status && status !== "connected") return;

  loading.value = true;
  try {
    const li = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfo",
      {},
      15000,
    );
    const it = Number(li?.islandType ?? -1);
    if (it < 0) {
      islandType.value = -1;
      groupResp.value = null;
      totalResp.value = null;
      rows.value = [];
      return;
    }
    islandType.value = it;
    mapType.value = Number(li?.emLegionWarMap || 0);

    const mapList = Array.isArray(li?.mapList) ? li.mapList : [];
    weekDate.value = ymdToYymmdd(
      mapList.length ? mapList[mapList.length - 1].warDate : "",
    );
    if (!weekDate.value) {
      groupResp.value = null;
      totalResp.value = null;
      rows.value = [];
      return;
    }

    const [g, t] = await Promise.all([
      // 小组榜：date = 最近一场比赛日
      tokenStore.sendMessageWithPromise(
        tokenId,
        "saltroad_getsaltroadwargrouprank",
        { date: weekDate.value, startRank: 1, endRank: TOP_LIMIT },
        20000,
      ),
      // 本岛总榜：date = 月赛日（仅取我方名次与总人数，故只拉极少条）
      tokenStore.sendMessageWithPromise(
        tokenId,
        "saltroad_getsaltroadwartotalrank",
        { date: getRankQueryDate(), startRank: 1, endRank: TOTAL_PROBE_RANGE },
        20000,
      ),
    ]);
    groupResp.value = g || null;
    totalResp.value = t || null;
    rows.value = g?.legionList || [];
    lastLoadAt.value = new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
    });
  } catch (e) {
    console.error("盐场小组积分加载失败:", e);
    if (!groupSelf.value)
      message.error(`读取盐场小组积分失败: ${e?.message || e}`);
  } finally {
    loading.value = false;
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
watch(autoRefresh, (on) => {
  stopTimer();
  if (on) timer = setInterval(load, 60000);
});
watch(
  () => tokenStore.selectedToken?.id,
  () => load(),
);

onMounted(load);
onUnmounted(stopTimer);
</script>

<style scoped>
.island-panel {
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.18));
  border-radius: 12px;
  padding: 14px;
  background: var(--n-color-modal, rgba(127, 127, 127, 0.04));
}
.ip-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.ip-dim {
  font-size: 12px;
  opacity: 0.55;
}
.ip-section-title {
  font-size: 13px;
  font-weight: 500;
  margin: 14px 0 8px;
  opacity: 0.85;
}
.ip-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  font-size: 13px;
  opacity: 0.7;
}

/* 所在岛屿 */
.ip-island {
  border: 1px solid rgba(240, 160, 32, 0.35);
  border-radius: 10px;
  padding: 12px;
  background: rgba(240, 160, 32, 0.06);
}
.ip-island-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}
.ip-stats {
  margin: 0;
}
.ip-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ip-stat-label {
  font-size: 12px;
  opacity: 0.6;
}
.ip-stat-value {
  font-size: 18px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
.ip-hot {
  color: #d03050;
}

/* 所有岛屿 */
.ip-ladder {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ip-ladder-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 10px;
  border: 1px solid var(--n-border-color, rgba(127, 127, 127, 0.2));
  border-radius: 8px;
  font-size: 13px;
}
.ip-ladder-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ip-ladder-quota {
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.45;
}
.ip-ladder-now {
  border-color: #f0a020;
  background: rgba(240, 160, 32, 0.12);
}
.ip-ladder-dim {
  opacity: 0.45;
}
.ip-ladder-name {
  font-weight: 500;
}
.ip-ladder-tip {
  font-size: 12px;
}

/* 小组积分榜 */
.ip-rank {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 13px;
}
.ip-row-me {
  background: rgba(240, 160, 32, 0.14);
}
.ip-rk {
  /* 容得下 4 位数，并禁止换行 —— 否则会折行撑高行高，看起来像序号错乱 */
  width: 40px;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  flex-shrink: 0;
}
.ip-rk-top {
  color: #d03050;
  font-weight: 500;
}
.ip-rk-ten {
  color: #f0a020;
  font-weight: 500;
}
.ip-nm {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ip-sc {
  width: 62px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #d03050;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
