<template>
  <div class="lab">
    <header class="lab-head">
      <h2>十殿组队实验台</h2>
      <span class="hint"
        >协议来自实机抓包：matchteam_create / join / memberprepare</span
      >
    </header>

    <section class="block">
      <div class="block-title">
        账号（点击勾选，<strong>第一个勾选的当队长</strong>）
      </div>
      <div class="token-list">
        <label
          v-for="token in tokens"
          :key="token.id"
          class="token-item"
          :class="{ active: selected.includes(token.id) }"
        >
          <n-checkbox
            :checked="selected.includes(token.id)"
            @update:checked="(v) => toggle(token.id, v)"
          />
          <span class="token-name">{{ token.name || token.id }}</span>
          <span v-if="selected[0] === token.id" class="badge">队长</span>
          <span class="ws-status">{{ wsStatus(token.id) }}</span>
        </label>
        <div v-if="!tokens.length" class="empty">还没有导入账号</div>
      </div>
    </section>

    <section class="block">
      <div class="row">
        <span class="label">队伍名称</span>
        <n-input v-model:value="teamName" size="small" style="width: 220px" />
        <span class="label">teamId</span>
        <n-input
          v-model:value="teamId"
          size="small"
          placeholder="可手动粘贴游戏里建好的队伍号"
          style="width: 220px"
        />
      </div>
      <div class="actions">
        <n-button type="primary" :loading="running" @click="runAll()"
          >一键组队（自动校正 → 准备）</n-button
        >
        <n-button :loading="connecting" @click="connectSelected()"
          >连接勾选账号</n-button
        >
        <n-button :disabled="running" @click="doCreate()">只建队</n-button>
        <n-button :disabled="running || !teamId" @click="doJoin()"
          >只加入</n-button
        >
        <n-button :disabled="running || !teamId" @click="doPrepare()"
          >只准备</n-button
        >
        <n-button :disabled="running || !teamId" @click="doQuery()"
          >查队伍</n-button
        >
        <n-button :disabled="running || !teamId" @click="loadLineup()"
          >查看阵容</n-button
        >
        <n-button :disabled="running" @click="doQueryMine()"
          >查我的队伍</n-button
        >
        <n-button
          type="info"
          :loading="openingTeam"
          :disabled="running || !teamId"
          @click="openTeam()"
          >开团（进房间）</n-button
        >
        <n-button
          type="warning"
          :loading="roomLoading"
          :disabled="running || !teamId"
          @click="refreshRoom()"
          >读取房间状态</n-button
        >
        <n-button
          type="primary"
          :loading="!!fightingRoleId"
          :disabled="running || !room.roomId || cdLeft > 0"
          @click="fightDefault()"
          >{{
            cdLeft > 0 ? `冷却中 ${cdLeft}s` : "开战（勾选的第一个）"
          }}</n-button
        >
        <n-button
          type="error"
          :disabled="running || !teamId"
          @click="doDismiss()"
          >解散</n-button
        >
      </div>
      <div class="fast-row">
        <n-switch v-model:value="fastMode" size="small">
          <template #checked>快速模式：开</template>
          <template #unchecked>快速模式：关</template>
        </n-switch>
        <span class="label">leadercomplete 延迟</span>
        <n-input-number
          v-model:value="fastWaitSec"
          size="small"
          :min="5"
          :max="60"
          :step="1"
          style="width: 96px"
        />
        <span class="hint">秒（最小 5，抓包实测播放完才发）</span>
        <n-button
          size="tiny"
          :disabled="!!fightingRoleId || !room.roomId"
          @click="sendLeaderComplete()"
          >手动发 leadercomplete</n-button
        >
        <span v-if="fastPhase" class="fast-phase">{{ fastPhase }}</span>
        <span v-if="cdLeft > 0" class="fast-cd">CD 剩余 {{ cdLeft }}s</span>
      </div>
      <div v-if="room.roomId" class="room-line">
        <span class="label">房间</span>
        <span class="team-id">{{ room.roomId }}</span>
        <span class="label">当前层</span>
        <span>{{ room.curMonsterCfgId ?? "—" }}</span>
        <span class="label">state</span>
        <span
          >{{ room.state ?? "—"
          }}<template v-if="room.state === 1"
            >（播放中<template v-if="stateLeft > 0"
              >，剩 {{ stateLeft }}s</template
            >）</template
          ></span
        >
        <span v-if="room.state === 1 && playingLayer" class="hint"
          >正在结算第 {{ playingLayer }} 层，房间层数已跳到
          {{ room.curMonsterCfgId }}</span
        >
        <span class="label">boss 剩余</span>
        <span>{{ bossHpText }}</span>
        <span class="label">复活/恢复/存档</span>
        <span
          >{{ room.reliveCnt ?? 0 }} / {{ room.restoreCnt ?? 0 }} /
          {{ room.saveCnt ?? 0 }}</span
        >
        <span class="label">更新于</span>
        <span>{{ roomUpdatedText }}</span>
        <span class="label">数据来源</span>
        <span
          >助手推送 {{ roomPushCount }} 帧 / 日志重放
          {{ replayFrames }} 帧</span
        >
      </div>
    </section>

    <section v-if="currentBoss" class="block">
      <div class="block-title row-between">
        <span>
          当前 boss：<strong>{{ currentBoss.name }}</strong
          >（第 {{ currentBoss.layer }} 层<template v-if="currentBoss.playing"
            >，播放结算中</template
          >）
        </span>
        <span class="hint">被攻击 {{ currentBoss.attacked }} 次</span>
      </div>
      <div class="boss-meta">
        <span>战力 {{ fmtPower(currentBoss.power) }}</span>
        <span v-if="currentBoss.hp !== null">
          剩余 {{ fmtHp(currentBoss.hp)
          }}<template v-if="currentBoss.maxHp"
            >/ {{ fmtHp(currentBoss.maxHp) }}</template
          >
        </span>
        <span v-else class="hint">血量未下发（这一层还没开打）</span>
        <span>积分 +{{ currentBoss.integral }}</span>
      </div>
      <div class="boss-units">
        <div
          v-for="unit in currentBoss.units"
          :key="`${unit.id}-${unit.pos}`"
          class="boss-unit"
        >
          <div class="bu-head">
            <span class="bu-label">{{ unit.label }}</span>
            <span v-if="unit.level" class="bu-lv">Lv{{ unit.level }}</span>
          </div>
          <div class="bu-name">怪物 {{ unit.id }}</div>
          <div class="bu-bar">
            <div class="bu-fill" :style="{ width: `${bossHpPct(unit)}%` }" />
          </div>
          <div class="bu-hp">
            {{
              unit.hp === null
                ? "未开打"
                : unit.hp > 0
                  ? fmtHp(unit.hp)
                  : "已击杀"
            }}
          </div>
        </div>
      </div>
    </section>

    <section v-if="bossLayers.length || memberStatus.length" class="block">
      <div class="block-title row-between">
        <span>房间 / boss 状态（只读）</span>
        <span v-if="lastFightText" class="hint">{{ lastFightText }}</span>
      </div>
      <div class="layer-list">
        <div
          v-for="layer in bossLayers"
          :key="layer.layer"
          class="layer-item"
          :class="{ current: layer.current, cleared: layer.cleared }"
        >
          <span class="layer-no">第 {{ layer.layer }} 层</span>
          <span class="layer-hp">
            <template v-if="layer.hp !== null">
              剩余 {{ fmtHp(layer.hp) }}
              <template v-if="layer.maxHp">/ {{ fmtHp(layer.maxHp) }}</template>
            </template>
            <template v-else>未开打</template>
          </span>
          <span class="layer-atk">被攻击 {{ layer.attacked }} 次</span>
          <span v-if="layer.cleared" class="prep on">已通过</span>
          <span v-else-if="layer.current" class="prep off">当前层</span>
        </div>
      </div>
      <div v-if="memberStatus.length" class="member-status">
        <div
          v-for="member in memberStatus"
          :key="member.roleId"
          class="member-line"
        >
          <span class="name-text">{{ member.name }}</span>
          <span class="alive" :class="{ low: member.alive === 0 }"
            >存活 {{ member.alive }}/{{ member.total }}</span
          >
          <span v-if="member.totalMaxHp" class="member-hp">
            总血 {{ fmtPower(member.totalHp) }}/{{
              fmtPower(member.totalMaxHp)
            }}
            <span class="member-bar"
              ><i :style="{ width: `${member.hpPct}%` }"
            /></span>
          </span>
          <span
            v-for="hero in member.heroes"
            :key="hero.id"
            class="hero-chip"
            :class="{ dead: hero.hp <= 0 }"
          >
            <span class="hc-name">{{ heroName(hero.id) }}</span>
            <span class="hc-bar"
              ><i :style="{ width: `${hero.hpPct}%` }"
            /></span>
            <span class="hc-hp">
              {{ fmtPower(hero.hp)
              }}<template v-if="hero.maxHp"
                >/{{ fmtPower(hero.maxHp) }}</template
              >
            </span>
            <em>{{
              hero.hp <= 0
                ? "阵亡"
                : hero.energy >= 0
                  ? `${hero.energy} 怒`
                  : "满怒"
            }}</em>
          </span>
        </div>
      </div>
    </section>

    <section v-if="battles.length" class="block">
      <div class="block-title row-between">
        <span>战报分析（最近 {{ battles.length }} 场）</span>
        <n-button size="tiny" @click="battles = []">清空</n-button>
      </div>
      <div class="battle-list">
        <div
          v-for="(battle, index) in battleRows"
          :key="`${battle.ts}-${index}`"
          class="battle-item"
        >
          <div class="battle-head">
            <span class="battle-layer">第 {{ battle.layer }} 层</span>
            <span class="prep" :class="battle.win ? 'on' : 'off'">{{
              battle.win ? "通过" : "未通过"
            }}</span>
            <span class="battle-meta"
              >{{ battle.round }}/{{ battle.maxRound }} 回合 · 全队
              {{ fmtHp(battle.total) }} ·
              <template v-if="battle.bossLeft !== null"
                >boss 剩 {{ fmtHp(battle.bossLeft)
                }}{{ battle.bossLeftFromRoom ? "（当前）" : "" }}</template
              >
              <template v-else
                >boss 本场承伤
                {{ fmtHp(battle.bossDamage) }}（战前血量未知）</template
              ></span
            >
            <span class="battle-role">{{ roleName(battle.roleId) }}</span>
          </div>
          <div class="battle-heroes">
            <div
              v-for="hero in battle.team"
              :key="hero.heroId"
              class="battle-hero"
            >
              <span class="bh-name">{{ heroName(hero.heroId) }}</span>
              <div class="bh-bar">
                <div
                  class="bh-fill"
                  :style="{ width: `${pct(hero.damage, battle.total)}%` }"
                />
              </div>
              <span class="bh-pct"
                >{{ pct(hero.damage, battle.total).toFixed(0) }}%</span
              >
              <span class="bh-num">{{ fmtHp(hero.damage) }}</span>
              <span class="bh-sub"
                >承伤 {{ fmtHp(hero.takeDamage) }} · 治疗
                {{ fmtHp(hero.treatment) }} · 怒 {{ hero.energy }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block-title row-between">
        <span>
          上阵阵容（{{ lineup.length }} 人<template v-if="leaderName"
            >，队长 {{ leaderName }}</template
          >）
        </span>
        <n-button
          size="tiny"
          :loading="lineupLoading"
          :disabled="running || !teamId"
          @click="loadLineup()"
          >刷新阵容</n-button
        >
      </div>
      <div v-if="!lineup.length" class="empty">
        先组队，或点右上角「刷新阵容」——这里会按队伍成员展示每个人的 5
        个上阵武将
      </div>
      <div v-else class="lineup-grid">
        <div
          v-for="member in lineup"
          :key="member.roleId"
          class="lineup-card"
          :class="{ leader: member.isLeader }"
        >
          <div
            class="card-head"
            title="点击查看该账号的完整上阵信息"
            @click="openDetail(member)"
          >
            <img
              v-if="member.headImg"
              :src="member.headImg"
              class="card-avatar"
              alt=""
            />
            <div v-else class="card-avatar placeholder" />
            <div class="card-meta">
              <div class="card-name">
                <span class="name-text">{{ member.name }}</span>
                <span v-if="member.isLeader" class="badge">队长</span>
                <span class="prep" :class="member.prepared ? 'on' : 'off'">{{
                  member.prepared ? "已准备" : "未准备"
                }}</span>
                <span v-if="!memberOnline(member)" class="prep off"
                  >本人未连接</span
                >
              </div>
              <div class="card-power">战力 {{ fmtPower(member.power) }}</div>
            </div>
          </div>
          <div class="hero-row">
            <div v-for="slot in 5" :key="slot" class="hero-slot">
              <template v-if="member.heroes[slot - 1]">
                <span class="hero-pos">{{ slot }}</span>
                <img
                  :src="heroAvatar(member.heroes[slot - 1].id)"
                  class="hero-img"
                  alt=""
                />
                <div class="hero-name">
                  {{ heroName(member.heroes[slot - 1].id) }}
                </div>
                <div class="hero-lv">
                  Lv{{ member.heroes[slot - 1].level }} ·
                  {{ member.heroes[slot - 1].star }}★
                </div>
              </template>
              <div v-else class="hero-empty">{{ slot }} 号位空</div>
            </div>
          </div>
          <div class="card-foot">
            <n-button
              size="small"
              type="primary"
              block
              :loading="fightingRoleId === member.roleId"
              :disabled="!!fightingRoleId || !room.roomId || cdLeft > 0"
              @click.stop="fightWith(member)"
            >
              {{
                cdLeft > 0
                  ? `冷却中 ${cdLeft}s`
                  : fightingRoleId === member.roleId
                    ? "开战中…"
                    : "开战"
              }}
            </n-button>
            <n-button
              size="small"
              tertiary
              block
              :loading="restoringRoleId === member.roleId"
              :disabled="!!fightingRoleId || !!restoringRoleId || !room.roomId"
              @click.stop="restoreMember(member)"
            >
              {{
                restoringRoleId === member.roleId ? "恢复中…" : "恢复（回满）"
              }}
            </n-button>
            <span v-if="member.source === 'battleData'" class="foot-hint"
              >阵容来自队伍数据</span
            >
          </div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block-title">日志</div>
      <div ref="logsBox" class="logs">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log" :class="[log.type]"
        >
          <span class="time">{{ log.time }}</span>
          <span class="who">{{ log.who }}</span>
          <span class="msg">{{ log.msg }}</span>
        </div>
        <div v-if="!logs.length" class="empty">还没有操作</div>
      </div>
    </section>

    <n-modal
      v-model:show="detailVisible"
      preset="card"
      style="width: 620px"
      :title="detailMember ? `${detailMember.name} 的上阵阵容` : ''"
    >
      <template v-if="detailMember">
        <div class="detail-meta">
          战力 {{ fmtPower(detailMember.power) }} ·
          {{ detailMember.isLeader ? "队长 · " : "" }}
          {{ detailMember.prepared ? "已准备" : "未准备" }} ·
          {{
            detailMember.source === "battleData"
              ? "队伍携带的布阵（battleData）"
              : "十殿布阵（role_gettargetteam teamType=3）"
          }}
        </div>
        <div class="detail-list">
          <div
            v-for="(hero, index) in detailMember.heroes"
            :key="index"
            class="detail-item"
          >
            <span class="detail-pos">{{ index + 1 }} 号位</span>
            <img :src="heroAvatar(hero.id)" class="detail-img" alt="" />
            <div class="detail-info">
              <div class="detail-name">{{ heroName(hero.id) }}</div>
              <div class="detail-sub">
                Lv{{ hero.level }} · {{ hero.star }}★{{
                  HERO_DICT[Number(hero.id)]?.type
                    ? ` · ${HERO_DICT[Number(hero.id)].type}`
                    : ""
                }}
              </div>
            </div>
            <div class="detail-stats">
              <span>攻 {{ fmtPower(hero.attack) }}</span>
              <span>血 {{ fmtPower(hero.hp) }}</span>
            </div>
          </div>
          <div v-if="!detailMember.heroes.length" class="empty">
            这个账号没有读到上阵阵容
          </div>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { useMessage } from "naive-ui";
import { computed, nextTick, onUnmounted, reactive, ref, watch } from "vue";
import { onSome } from "@/stores/events";
import { useTokenStore } from "@/stores/tokenStore";
import { g_utils } from "@/utils/bonProtocol";
import { HERO_DICT } from "@/utils/HeroList";
import { BOSS_POS_LABEL, getBossOfLayer } from "@/utils/nightmareBosses";

const tokenStore = useTokenStore();
const message = useMessage();

const tokens = computed(() => tokenStore.gameTokens || []);
const selected = ref([]);
const teamName = ref("123");
const teamId = ref("");
const logs = ref([]);
const running = ref(false);
const logsBox = ref(null);

// 上阵阵容卡片：每个队伍成员一张，展示 5 个位置的武将
const lineup = ref([]);
const lineupLoading = ref(false);
const detailVisible = ref(false);
const detailMember = ref(null);

function openDetail(member) {
  detailMember.value = member;
  detailVisible.value = true;
}

/* ================= 十殿房间状态（只读） ================= */

// nightmare_roominfo_notify 是增量 patch，必须逐次合并才能得到完整房间状态
const room = reactive({});
const lastFight = ref(null);
const roomLoading = ref(false);
// 从游戏页日志重放出来的房间帧数（与助手推送分开统计，便于判断数据从哪来）
const replayFrames = ref(0);
const roomUpdatedAt = ref("");

const roomUpdatedText = computed(() => roomUpdatedAt.value || "—");

function deepMerge(target, patch) {
  if (!patch || typeof patch !== "object") return target;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const base =
        target[key] && typeof target[key] === "object" ? target[key] : {};
      target[key] = deepMerge(base, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

// 助手自己的连接是否也能收到房间推送（决定"实时读"还是要靠游戏页日志重放）
const roomPushCount = ref(0);

onSome(["nightmare_roominfo_notify"], ({ body }) => {
  const info = body?.roomInfo;
  if (info) {
    roomPushCount.value += 1;
    deepMerge(room, info);
    roomUpdatedAt.value = now();
    syncRoomClock(info);
    if (roomPushCount.value === 1) {
      addLog(
        "系统",
        `助手连接收到房间推送（第 1 帧）：房间 ${room.roomId || "?"}｜第 ${room.curMonsterCfgId ?? "?"} 层｜state=${room.state ?? "?"}`,
        "success",
      );
    }
  }
});
// 战报留存：每场都记一条，用来分析输出结构与阵亡情况
onSome(["nightmare_fightnotify"], ({ body }) => {
  lastFight.value = body || null;
  pushBattle(body);
});

/* ---------------- 战报分析 ---------------- */

const battles = ref([]);

/** 把一帧战报整理成可读结构（最近 20 场） */
function pushBattle(data, ts, { live = true } = {}) {
  const result = data?.result;
  if (!result) return;

  const layer = Number(data.bossCfgId) || 0;
  const team = (data.sponsor?.teamInfo || []).map((hero) => ({
    heroId: Number(hero.heroId),
    level: Number(hero.level) || 0,
    star: Number(hero.star) || 0,
    slot: Number(hero.slot) || 0,
    damage: Number(hero.damage) || 0,
    takeDamage: Number(hero.takeDamage) || 0,
    treatment: Number(hero.treatment) || 0,
    energy: Number(hero.energy),
    hp: Number(hero.hp) || 0,
  }));
  const total = team.reduce((sum, hero) => sum + hero.damage, 0);
  const acceptUnits = result.accept?.teamInfo || [];
  const snap = layerHpSnap[layer];

  // 战报里 boss 的 hp / maxAttr 全是 0，唯一可信的是 takeDamage（本场承受伤害）；
  // 剩余血量 = 战前快照 − 本场承受伤害。没有快照（历史重放）就只报承伤。
  const bossUnits = acceptUnits.map((hero) => {
    const id = Number(hero.heroId);
    const taken = Number(hero.takeDamage) || 0;
    let before =
      snap?.units?.[String(id)] ?? (live ? bossUnitHp(layer, id) : null);
    // 0 往往是"未交战占位"，不是真血量
    if (before === 0 && taken > 0) before = null;
    return {
      id,
      taken,
      hp: before === null ? null : Math.max(0, before - taken),
      maxHp: before,
    };
  });
  const bossDamage = bossUnits.reduce((sum, unit) => sum + unit.taken, 0);
  const bossLeft =
    bossUnits.length && bossUnits.every((u) => u.hp !== null)
      ? bossUnits.reduce((sum, unit) => sum + unit.hp, 0)
      : null;
  team.sort((a, b) => b.damage - a.damage);

  battles.value.unshift({
    ts: ts || new Date().toISOString(),
    layer,
    win: Boolean(result.isWin),
    round: Number(result.round) || 0,
    maxRound: Number(data.battleData?.maxRound) || 15,
    roleId: Number(data.roleId) || 0,
    total,
    bossLeft,
    bossDamage,
    bossUnits,
    team,
  });
  if (battles.value.length > 20) battles.value.length = 20;
}

function pct(value, total) {
  return total ? (Number(value) / total) * 100 : 0;
}

/** boss 单位剩余血量百分比（血量为 null 表示未开打） */
function bossHpPct(unit) {
  if (unit?.hp === null || unit?.hp === undefined) return 0;
  if (!unit.maxHp) return unit.hp > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
}

/** roleId → 账号名（先找阵容卡片，再回落到 token 缓存） */
function roleName(roleId) {
  const id = Number(roleId);
  const card = lineup.value.find((c) => c.roleId === id);
  if (card) return card.name;
  const tokenId = Object.keys(roleIdCache).find(
    (key) => Number(roleIdCache[key]) === id,
  );
  return tokenId ? getName(tokenId) : String(roleId);
}

/** 该成员自己的连接（roleId 命中优先，其次按昵称猜） */
function memberTokenId(member) {
  const rid = Number(member?.roleId || 0);
  for (const [tokenId, id] of Object.entries(roleIdCache)) {
    if (Number(id) === rid) return tokenId;
  }
  return tokenGuessByName(member?.name);
}

/** 该成员是否能自己发 fight（没连接就只能由队长 setfighter，发不了 fight） */
function memberOnline(member) {
  const tokenId = memberTokenId(member);
  return Boolean(tokenId && isConnected(tokenId));
}

/**
 * 某层 boss 剩余总血量。
 *
 * 实机帧里 `monsterTeamInfo[layer].monsterTeam.team` 根本不下发（只有 teamInfo:null），
 * 真正的实时血量在 `curMonsterData[怪物id].curHp`，id 与配置表 10001/1000101 一致。
 */
function bossHpOf(layer) {
  const info = room.monsterTeamInfo?.[layer];
  const data = info?.curMonsterData;
  const list = data ? Object.values(data) : [];
  if (!list.length) return null;
  const sum = list.reduce(
    (total, unit) => total + (Number(unit.curHp) || 0),
    0,
  );
  // 未交战的层是全 0 占位；打过的层 0 才是真的清空
  if (!sum && !(Number(info?.totalAttacked) > 0)) return null;
  return sum;
}

/** 某个 boss 单位的实时血量；该层没下发数据时返回 null（≠0） */
function bossUnitHp(layer, id) {
  const data = room.monsterTeamInfo?.[layer]?.curMonsterData;
  if (!data) return null;
  const unit = data[String(id)] ?? data[id];
  if (!unit || unit.curHp === undefined) return null;
  return Number(unit.curHp) || 0;
}

/**
 * 每层"开战前"的 boss 血量快照。
 *
 * room 帧里只有当前血量，没有最大血量；战报 accept.teamInfo 的 hp/maxAttr 又恒为 0，
 * 所以最大血量只能靠开战前那一刻的快照反推（maxTotal 取历史最大值）。
 */
const layerHpSnap = reactive({});

function snapshotBossHp(layer) {
  const data = room.monsterTeamInfo?.[layer]?.curMonsterData;
  if (!data) return null;
  const units = {};
  for (const [id, unit] of Object.entries(data)) {
    units[id] = Number(unit.curHp) || 0;
  }
  const total = Object.values(units).reduce((sum, hp) => sum + hp, 0);
  // 未交战的层会被下发成全 0 占位，这不是真血量，别当快照用
  if (!Object.keys(units).length || !total) return null;
  const prev = layerHpSnap[layer];
  layerHpSnap[layer] = {
    at: Date.now(),
    units,
    total,
    maxTotal: Math.max(total, prev?.maxTotal || 0),
  };
  return layerHpSnap[layer];
}

function bossMaxTotalOf(layer) {
  const snap = layerHpSnap[layer];
  return snap ? snap.maxTotal : null;
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 从后端回吐的"游戏页原始帧"里重放房间状态。
 *
 * 为什么需要这样做：`nightmare_roominfo_notify` 只推送给游戏页那条 WS 连接，
 * 助手自己新建的连接收不到。所以读 `GET /frontend-log/recent`，
 * 用项目自带的 BON 解码器把这些帧解出来重放，重建房间状态。
 */
async function replayRoomFromHistory(limit = 6000) {
  const res = await fetch(`/frontend-log/recent?onlyGame=1&limit=${limit}`);
  const data = await res.json();
  const entries = (data.entries || []).filter(
    (entry) => (entry.meta || {}).kind === "bin" && (entry.meta || {}).b64,
  );
  entries.sort((a, b) => (a.meta?.t || 0) - (b.meta?.t || 0));

  // 重放前清空，避免重复点击时同一场战斗叠多份
  battles.value = [];

  let roomFrames = 0;
  let fightFrames = 0;
  let failed = 0;
  const originalLog = console.log;
  for (const entry of entries) {
    let cmd = "";
    let data = null;
    try {
      console.log = () => {}; // 解到坏帧时解码器会刷 "read eof"，压掉噪声
      const msg = g_utils.parse(base64ToBytes(entry.meta.b64), "auto");
      // 有些帧（心跳 ack 等）解出来 _raw 为 null，读 cmd 会抛异常
      if (!msg || !msg._raw) {
        failed += 1;
        continue;
      }
      cmd = msg.cmd || msg.resp || "";
      data = msg.rawData;
    } catch {
      failed += 1;
      continue;
    } finally {
      console.log = originalLog;
    }

    if (cmd === "nightmare_roominfo_notify") {
      const info = data?.roomInfo;
      if (info) {
        deepMerge(room, info);
        syncRoomClock(info);
        roomFrames += 1;
      }
    } else if (cmd === "nightmare_fightnotify") {
      lastFight.value = data || null;
      pushBattle(data, entry.ts, { live: false });
      fightFrames += 1;
    }
  }
  replayFrames.value = roomFrames;
  if (roomFrames) roomUpdatedAt.value = now();
  return { roomFrames, fightFrames, scanned: entries.length, failed };
}

/* ---------------- 开团（进入十殿房间） ---------------- */

const openingTeam = ref(false);

/**
 * 开团：队长 `matchteam_openteam { teamId }`，服务端创建房间并开始推送 roominfo。
 *
 * 抓包实测顺序（23:15:08）：
 *   matchteam_openteam { teamId } → matchteam_openteamresp { teamId }
 *   → nightmare_roominfo_notify（房间号只在这个推送里，不在返回值里）
 */
async function openTeam() {
  if (openingTeam.value) return;
  const target = teamId.value;
  if (!target) {
    message.warning("先建队或填 teamId");
    return;
  }
  const online = await connectAll(selected.value);
  if (!online.length) {
    message.error("没有可用账号");
    return;
  }

  openingTeam.value = true;
  try {
    // 由队长发；队长没连上就退回第一个在线账号（可能被服务端拒）
    const team = await analyzeTeam(online[0], target);
    const leaderId = Number(team?.leaderId || 0);
    let sender = online[0];
    if (leaderId) {
      const leaderToken = await findTokenOfRole(leaderId);
      if (leaderToken && isConnected(leaderToken)) sender = leaderToken;
    }
    if (leaderId && Number(roleIdCache[sender]) !== leaderId) {
      addLog(
        "系统",
        `队长(${leaderId}) 未连接，改由 ${getName(sender)} 发送，服务端可能拒绝`,
        "warning",
      );
    }

    const result = await send(sender, "matchteam_openteam", { teamId: target });
    if (!result.ok) return;
    addLog(getName(sender), "开团指令已发出，等待房间推送…", "success");

    // 队长要马上写进 room：后续 setfighter 靠它决定由谁发，
    // 只等房间帧的话，帧不全时 leaderId 会是 0 → 队员代发 → 服务端判无权限
    if (leaderId) room.leaderId = leaderId;
    room.matchTeamId = target;

    // 房间号只通过 roominfo 推送，助手连接可能收不到，先从游戏页帧重放
    await sleep(2500);
    await replayRoomFromHistory();

    // 重放没拿到房间号就主动问一遍 nightmare_getroleinfo，再取 getroominfo 全量
    if (!room.roomId) {
      for (const tokenId of online) {
        const rid = await getRoleId(tokenId);
        if (!rid) continue;
        const info = await send(tokenId, "nightmare_getroleinfo", {
          roleId: rid,
        });
        const data = info.body?.nightMareData || {};
        if (data.roomId) {
          room.roomId = String(data.roomId);
          addLog("系统", `roleinfo 显示房间 ${data.roomId}`, "info");
          break;
        }
        await sleep(120);
      }
    }

    if (room.roomId) {
      const snapshot = await fetchRoomInfo(sender, room.roomId);
      if (snapshot) {
        applyRoomLineup(snapshot);
        if (!room.leaderId)
          room.leaderId = Number(snapshot.leaderId || 0) || room.leaderId;
      }
      addLog(
        "系统",
        `房间 ${room.roomId} 已就绪，当前第 ${room.curMonsterCfgId ?? "?"} 层｜队长 ${room.leaderId ?? "?"}，可以选人开战了`,
        "success",
      );
    } else {
      addLog(
        "系统",
        "还没拿到房间号。确认游戏页开着，稍等几秒再点「读取房间状态」",
        "warning",
      );
    }
  } catch (error) {
    addLog("系统", `开团失败：${error?.message || error}`, "error");
  } finally {
    openingTeam.value = false;
  }
}

/* ---------------- 手动开战 ---------------- */

const fightingRoleId = ref(0);

/* ---------------- 快速模式（跳过战斗播放） ----------------
 * 抓包结论：nightmare_fight 0.2~0.3 秒就返回结果，之后几十秒全是客户端播动画，
 * 服务端按 totalFrame×24ms 估了个 stateEndTime，等到玩家（队长）发
 * nightmare_leadercomplete 才把 state 从 1 改 0。
 * 所以这里提前发 leadercomplete，用最小 5 秒等播放起帧，别一返回就发（怕被判非法）。
 */

const FAST_MODE_KEY = "nightmare-fast-mode";
const FAST_WAIT_KEY = "nightmare-fast-wait";
const FIGHT_INTERVAL_MS = 15000; // 配置表 fightIntervalTime = 15（两场之间的服务端 CD）
const FAST_MIN_WAIT = 5; // 提前发也不能太激进，至少等 5 秒

const fastMode = ref(localStorage.getItem(FAST_MODE_KEY) === "1");
const fastWaitSec = ref(
  Math.max(FAST_MIN_WAIT, Number(localStorage.getItem(FAST_WAIT_KEY)) || 5),
);
const fastPhase = ref("");
const cdLeft = ref(0);
const cdEndAt = ref(0);
const stateLeft = ref(0);

watch(fastMode, (value) => {
  localStorage.setItem(FAST_MODE_KEY, value ? "1" : "0");
  if (!value) fastPhase.value = "";
});
watch(fastWaitSec, (value) => {
  const safe = Math.max(FAST_MIN_WAIT, Number(value) || FAST_MIN_WAIT);
  if (safe !== value) fastWaitSec.value = safe;
  localStorage.setItem(FAST_WAIT_KEY, String(safe));
});

/** 统一时钟：同时刷新 CD 倒计时与播放剩余秒 */
function refreshClock() {
  const nowMs = Date.now();
  cdLeft.value =
    cdEndAt.value > nowMs ? Math.ceil((cdEndAt.value - nowMs) / 1000) : 0;
  const stateEnd = Number(room.stateEndTime || 0);
  stateLeft.value =
    Number(room.state) === 1 && stateEnd
      ? Math.max(0, Math.ceil(stateEnd - nowMs / 1000))
      : 0;
}
const clockTimer = setInterval(refreshClock, 250);
onUnmounted(() => clearInterval(clockTimer));

/**
 * 服务端 CD。实测唯一一条带 `fightLimitTime` 的帧：`stateEndTime + 15`，
 * 说明 15 秒是从"播放结束"算，不是从开战算。
 * leadercomplete 提前生效时，CD 也从那一刻开始计时。
 */
function setCdEnd(ts) {
  cdEndAt.value = Math.max(0, Number(ts) || 0);
  refreshClock();
}

function setCdAfter(ms) {
  setCdEnd(Date.now() + Math.max(0, ms));
}

/** 房间帧带了 state/stateEndTime 时，按「播放结束 + 15s」校准 CD */
function syncRoomClock(info) {
  if (!info) return;
  if (Number(info.state) === 1 && info.stateEndTime) {
    setCdEnd(Number(info.stateEndTime) * 1000 + FIGHT_INTERVAL_MS);
  } else if (info.fightLimitTime) {
    // getroominfo 的全量快照里没有 state/stateEndTime，但 fightLimitTime 就是
    // 「下次可战时刻」（实测 = stateEndTime + 15），直接拿来当 CD 终点
    setCdEnd(Number(info.fightLimitTime) * 1000);
  }
  refreshClock();
}

/** 队长发 leadercomplete（游戏里是播放完才发，这里可以提前） */
async function fireLeaderComplete(roomId, fallbackToken, tag = "") {
  const leaderId = await ensureLeaderId();
  const leaderToken = leaderId ? await resolveTokenOfRole(leaderId) : "";
  const by =
    leaderToken && isConnected(leaderToken) ? leaderToken : fallbackToken;
  if (!by) {
    addLog("系统", "没有可用连接发 leadercomplete", "error");
    return { ok: false };
  }
  if (room.leaderId && Number(roleIdCache[by]) !== Number(room.leaderId)) {
    addLog(
      "系统",
      `队长(${room.leaderId}) 未连接，改由 ${getName(by)} 发送，可能被拒`,
      "warning",
    );
  }
  addLog(
    getName(by),
    `→ leadercomplete { roomId: ${roomId} }${tag ? `（${tag}）` : ""}`,
    "send",
  );
  const result = await send(by, "nightmare_leadercomplete", { roomId }, 2500);
  // 这个命令不一定回包（setfighter 就没有），超时不算失败，最终看 state
  const noReply =
    !result.ok && /超时|timeout/i.test(String(result.error?.message || ""));
  if (noReply) {
    addLog(
      "系统",
      "leadercomplete 没有回执（该命令可能本来就不回包），以房间 state 为准",
      "warning",
    );
  }

  // 回读房间帧，确认 state 是否从 1（播放中）变 0。推送可能有延迟，最多看 3 次
  let replay = { scanned: 0, roomFrames: 0, fightFrames: 0 };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await sleep(500);
    replay = await replayRoomFromHistory();
    if (Number(room.state) === 0) break;
  }
  const accepted = result.ok || noReply;
  const stateText = room.state === undefined ? "?" : room.state;
  addLog(
    "系统",
    `leadercomplete ${result.ok ? "回执 ok" : noReply ? "无回执" : "失败"}｜state=${stateText}｜第 ${room.curMonsterCfgId ?? "?"} 层｜重放 ${replay.scanned} 帧（房间 ${replay.roomFrames} / 战报 ${replay.fightFrames}）`,
    accepted ? "success" : "error",
  );
  if (accepted && Number(room.state) === 1) {
    addLog(
      "系统",
      "state 还是 1：提前发没被采纳，服务端仍按播放时长计时，只能等播放完",
      "warning",
    );
  }

  // state 变 0 才是 CD 的起点（实测 fightLimitTime = stateEndTime + 15）
  if (accepted && Number(room.state) === 0) {
    setCdAfter(FIGHT_INTERVAL_MS);
    addLog("系统", "state 已变 0，服务端 CD 15 秒从现在开始", "info");
  }
  return { ...result, ok: accepted };
}

/** 工具栏「手动发 leadercomplete」：不依赖开战流程，随时可点 */
async function sendLeaderComplete() {
  const roomId = String(room.roomId || "");
  if (!roomId) {
    message.warning("还没拿到房间号，先点「读取房间状态」");
    return;
  }
  const tokenId = selected.value.find((id) => isConnected(id));
  if (!tokenId) {
    message.warning("先勾选并连接一个账号");
    return;
  }
  await fireLeaderComplete(roomId, tokenId, "手动");
  await sleep(600);
  const info = await syncRoomQuiet();
  if (!info) setCdAfter(FIGHT_INTERVAL_MS);
  addLog(
    "系统",
    `手动 leadercomplete 后刷新：CD 剩余 ${cdLeft.value}s`,
    "info",
  );
}

/**
 * 快速模式收尾：开战 → 等 N 秒（≥5）→ 队长发 leadercomplete → 提示 CD。
 * 返回 false 表示 leadercomplete 被拒，调用方可以回退到"等播放"。
 */
async function runFastFinish(fightAt, roomId, fighterToken) {
  const waitSec = Math.max(FAST_MIN_WAIT, Number(fastWaitSec.value) || 5);
  addLog(
    "系统",
    `快速模式：${waitSec} 秒后发 leadercomplete，跳过剩余播放动画`,
    "info",
  );
  try {
    for (let left = waitSec; left > 0; left -= 1) {
      fastPhase.value = `leadercomplete 倒计时 ${left}s`;
      await sleep(1000);
    }
    fastPhase.value = "发送 leadercomplete…";
    const result = await fireLeaderComplete(roomId, fighterToken, "快速模式");
    fastPhase.value = "";
    if (!result.ok) return false;

    const elapsed = Date.now() - fightAt;
    // leadercomplete 提前生效后，服务端会给出新的 fightLimitTime，重取一次才准
    await sleep(600);
    const info = await syncRoomQuiet();
    if (!info) setCdAfter(FIGHT_INTERVAL_MS);
    addLog(
      "系统",
      `本场从开战到 state 结束用时 ${(elapsed / 1000).toFixed(1)} 秒，CD 剩余 ${cdLeft.value}s`,
      "success",
    );
    return true;
  } finally {
    fastPhase.value = "";
  }
}

/**
 * roleId → 已连接的 tokenId（房内成员可能不在勾选列表里）。
 *
 * `setfighter` 与 `fight` 都可以由队长那条连接代发（fight 请求体里带 roleId），
 * 所以这里只返回真正连上的 token，连不上就回落到队长连接。
 */
async function findTokenOfRole(roleId) {
  const target = Number(roleId);
  if (!target) return "";
  for (const [tokenId, rid] of Object.entries(roleIdCache)) {
    if (Number(rid) === target && isConnected(tokenId)) return tokenId;
  }
  // 勾选过的优先，再扫其余已连接账号
  const order = [
    ...selected.value,
    ...tokens.value
      .map((item) => item.id)
      .filter((id) => !selected.value.includes(id)),
  ];
  for (const tokenId of order) {
    if (!isConnected(tokenId)) continue;
    const rid = await getRoleId(tokenId);
    if (rid === target) return tokenId;
  }
  return "";
}

/** 按账号名猜出对应的 token（导入时名字一般就是游戏内昵称） */
function tokenGuessByName(name) {
  const target = String(name || "").trim();
  if (!target) return "";
  const hit = tokens.value.find(
    (item) => String(item.name || "").trim() === target,
  );
  return hit?.id || "";
}

/** 开战前刷新单个成员的"真实当前阵容"（十殿布阵 = teamType 3） */
async function refreshMemberLineup(roleId, tokenId) {
  const result = await send(tokenId, "role_gettargetteam", {
    targetId: Number(roleId),
    teamType: 3,
    cCMonsterId: 0,
  });
  const info = result.body?.teamInfo || {};
  const heroes = Object.entries(info.team || {})
    .map(([pos, hero]) => ({ pos: Number(pos), ...hero }))
    .sort((a, b) => a.pos - b.pos);

  const card = lineup.value.find((item) => item.roleId === Number(roleId));
  if (card) {
    card.heroes = heroes;
    if (info.power) card.power = info.power;
    card.source = "targetteam";
  }
  return heroes;
}

/**
 * 用指定成员开战（手动触发，只发两条命令）。
 *
 * 与游戏抓包一致：队长先 `nightmare_setfighter` 指定上场者，
 * 再由该账号自己的连接发 `nightmare_fight`（服务端模拟战斗）。
 * 战报推送给游戏页那条连接，助手这边收不到，
 * 所以打完要点一次「读取房间状态」看结果。
 */
async function fightWith(member) {
  if (fightingRoleId.value) return;
  const roleId = Number(member?.roleId || 0);
  if (!roleId) return;

  const roomId = String(room.roomId || "");
  if (!roomId) {
    message.warning("还没拿到房间号，请先点「读取房间状态」");
    return;
  }

  // setfighter 必须由队长连接发（缺失会被判「无权限」）；
  // fight 用本人的连接更稳，本人没连才退回队长连接代发。
  const leaderId = await ensureLeaderId();
  const leaderToken = leaderId ? await resolveTokenOfRole(leaderId) : "";
  const ownToken = await findTokenOfRole(roleId);
  const sender = ownToken || leaderToken;
  if (!sender) {
    message.warning(
      `队长连接不在，${member.name} 也没连：先勾选队长账号点「连接勾选账号」`,
    );
    addLog(
      "系统",
      `开战需要一条连接：队长(${leaderId}) 和 ${member.name}(${roleId}) 都没连上`,
      "error",
    );
    return;
  }
  if (!(await ensureConnected(sender))) return;

  if (!leaderToken) {
    addLog(
      "系统",
      `没拿到队长连接（leaderId=${leaderId || "未知"}），setfighter 将由 ${getName(sender)} 代发，服务端可能回「无权限」`,
      "warning",
    );
  }

  const proxied = !ownToken;
  if (proxied) {
    addLog(
      "系统",
      `${member.name} 未连接，由队长连接代发 fight { roleId: ${roleId} }`,
      "warning",
    );
  }

  fightingRoleId.value = roleId;
  try {
    // 开战前先拉一次真实阵容，避免用的是过期快照
    const heroes = await refreshMemberLineup(roleId, sender);
    addLog(
      member.name,
      heroes.length
        ? `当前阵容：${heroes.map((hero) => heroName(hero.id)).join(" → ")}`
        : "没读到当前阵容（可能还没设十殿布阵）",
      heroes.length ? "info" : "warning",
    );

    // 队长下达上场指令；队长没连上就由当前发送连接自己发。
    // 注意：setfighter 没有响应包（抓包里只推 roominfo），不能用等响应的 send。
    const setBy =
      leaderToken && isConnected(leaderToken) ? leaderToken : sender;
    addLog(getName(setBy), `→ setfighter { roleId: ${roleId} }`, "send");
    try {
      tokenStore.sendMessage(setBy, "nightmare_setfighter", {
        roomId,
        roleId,
      });
    } catch (error) {
      addLog(
        getName(setBy),
        `setfighter 失败：${error?.message || error}`,
        "warning",
      );
    }
    await sleep(700);

    const layer = room.curMonsterCfgId ?? "?";
    addLog(
      getName(sender),
      `→ 开战：第 ${layer} 层（roomId=${roomId}，roleId=${roleId}）`,
      "info",
    );

    // 开战前快照本层 boss 血量：房间帧只有当前血量，
    // 最大血量与战报剩余都得靠"战前 − 本场承伤"反推
    const snap = snapshotBossHp(Number(room.curMonsterCfgId || 0));
    if (snap) {
      addLog(
        "系统",
        `战前快照：第 ${room.curMonsterCfgId} 层 boss 剩余 ${fmtHp(snap.total)}`,
        "info",
      );
    }

    const fightAt = Date.now();
    const result = await send(
      sender,
      "nightmare_fight",
      { roomId, roleId },
      30000,
    );
    if (!result.ok) return;

    if (fastMode.value) {
      await runFastFinish(fightAt, roomId, sender);
    } else {
      addLog(getName(sender), "开战指令已发出，正在刷新房间取 CD…", "success");
      await sleep(1200);
      const info = await syncRoomQuiet();
      if (info) {
        addLog(
          "系统",
          `已刷新：第 ${room.curMonsterCfgId ?? "?"} 层｜boss 剩余 ${bossHpText.value}｜CD 剩余 ${cdLeft.value}s（开战按钮已锁）`,
          "info",
        );
      } else {
        setCdAfter(FIGHT_INTERVAL_MS);
        addLog(
          "系统",
          "刷新房间失败，CD 先按 15 秒兜底（可手动点「读取房间状态」校准）",
          "warning",
        );
      }
    }
  } finally {
    fightingRoleId.value = 0;
  }
}

/* ---------------- 恢复（阵亡武将回满） ---------------- */

const restoringRoleId = ref(0);

/**
 * `nightmare_restore { roomId, roleId }` —— 队长可以替任意队员发（2026-11-12 23:14 实测）。
 *
 * 回执同参数；同时推一帧 roominfo patch：
 *   restoreCnt +1、playerTeamInfo[roleId].curHeroData 里该成员武将全部回满、curEnergy 变 -1。
 */
async function restoreMember(member) {
  if (restoringRoleId.value || fightingRoleId.value) return;
  const roleId = Number(member?.roleId || 0);
  const roomId = String(room.roomId || "");
  if (!roleId) return;
  if (!roomId) {
    message.warning("还没拿到房间号，先点「读取房间状态」");
    return;
  }

  const leaderId = await ensureLeaderId();
  const leaderToken = leaderId ? await resolveTokenOfRole(leaderId) : "";
  const ownToken = await findTokenOfRole(roleId);
  const sender = leaderToken || ownToken;
  if (!sender) {
    message.warning("需要队长连接（或本人连接）才能恢复");
    return;
  }
  if (!(await ensureConnected(sender))) return;

  restoringRoleId.value = roleId;
  try {
    addLog(
      getName(sender),
      `→ restore { roomId, roleId: ${roleId} }（${member.name}）`,
      "send",
    );
    const result = await send(sender, "nightmare_restore", { roomId, roleId });
    if (!result.ok) return;
    await sleep(500);
    const info = await syncRoomQuiet();
    const status = memberStatus.value.find((item) => item.roleId === roleId);
    addLog(
      "系统",
      `恢复完成：restoreCnt=${room.restoreCnt ?? "?"}｜${member.name} 存活 ${status ? `${status.alive}/${status.total}` : "?"}${info ? "" : "（快照刷新失败，可手动读取房间）"}`,
      "success",
    );
  } finally {
    restoringRoleId.value = 0;
  }
}

/** 工具栏「开战」：用第一个勾选账号 */
async function fightDefault() {
  const tokenId = selected.value[0];
  if (!tokenId) {
    message.warning("先勾选一个账号");
    return;
  }
  const roleId = await getRoleId(tokenId);
  const card = lineup.value.find((item) => item.roleId === Number(roleId));
  if (!card) {
    message.warning("还没读取到阵容，请先点「读取房间状态」");
    return;
  }
  await fightWith(card);
}

/**
 * 读取房间状态（只读，不触发任何战斗）。
 *
 * 房间详情（各人血量/怒气、boss 累计血量）只通过 `nightmare_roominfo_notify`
 * 推送，没有查询命令，所以这里做两件事：
 *   1. 对每个勾选账号发 `nightmare_getroleinfo`，拿 roomId / 剩余次数等
 *   2. roominfo 的推送由 onSome 持续合并进 room，页面上实时更新
 */
/**
 * 房间全量快照：`nightmare_getroominfo { roomId }` → `roomInfo`。
 *
 * 实机抓包（2026-11-12 22:50）：客户端从战斗返回房间时发的就是它，
 * 返回的是**全量**房间状态（含 monsterTeamInfo.curMonsterData 的真实 boss 血量、
 * playerTeamInfo、fightRoleBase 的 5 人布阵），不是增量 patch。
 */
async function fetchRoomInfo(tokenId, roomId) {
  const result = await send(
    tokenId,
    "nightmare_getroominfo",
    { roomId: String(roomId) },
    10000,
  );
  const info = result.body?.roomInfo;
  if (!result.ok || !info) return null;
  // 全量快照直接替换，避免上一轮房间的旧层数据残留
  for (const key of Object.keys(room)) delete room[key];
  deepMerge(room, info);
  syncRoomClock(info);
  roomUpdatedAt.value = now();
  return info;
}

/**
 * 静默刷新房间快照：开战成功 / leadercomplete 之后调用。
 * 目的是马上拿到新的 fightLimitTime（= 下次可战时刻）和 boss 血量，用来驱动 CD 倒计时。
 */
async function syncRoomQuiet() {
  const tokenId = selected.value.find((id) => isConnected(id));
  const roomId = String(room.roomId || "");
  if (!tokenId || !roomId) return null;
  const info = await fetchRoomInfo(tokenId, roomId);
  if (info) applyRoomLineup(info);
  return info;
}

/** 用 roomInfo.fightRoleBase 直接生成阵容卡片（不依赖每个号自己的连接） */
function applyRoomLineup(info) {
  const members = Array.isArray(info?.fightRoleBase) ? info.fightRoleBase : [];
  if (!members.length) return 0;
  const leaderId = Number(info.leaderId || 0);
  const cards = members.map((member) => {
    const team = member.battleData?.team || {};
    const heroes = Object.entries(team)
      .map(([pos, hero]) => ({ pos: Number(pos), ...hero }))
      .sort((a, b) => a.pos - b.pos);
    return {
      roleId: Number(member.roleId),
      name: member.name || String(member.roleId),
      headImg: member.headImg || "",
      power: Number(member.power || member.battleData?.power || 0),
      prepared: Number(member.prepared) === 1,
      isLeader: Number(member.roleId) === leaderId,
      heroes,
      source: "battleData",
    };
  });
  if (!cards.some((card) => card.heroes.length)) return 0;
  lineup.value = cards;
  return cards.length;
}

/**
 * 队长 roleId（setfighter 必须由队长发，缺失就会被服务端判「无权限」）。
 *
 * `room.leaderId` 只有收到房间帧（推送 / getroominfo）后才有；刚开团时如果
 * 只重放到半截帧、或者游戏页没开导致一帧都没有，这里就是 0，于是 setfighter
 * 会由队员自己发出去 → 服务端回无权限。
 * 所以缺失时依次从「队伍数据」和「getroominfo 快照」补。
 */
async function ensureLeaderId() {
  const known = Number(room.leaderId || 0);
  if (known) return known;

  const tokenId =
    selected.value.find((id) => isConnected(id)) ||
    tokens.value.find((item) => isConnected(item.id))?.id ||
    "";
  const target = teamId.value || String(room.matchTeamId || "");

  if (tokenId && target) {
    const team = await analyzeTeam(tokenId, target);
    const lid = Number(team?.leaderId || 0);
    if (lid) {
      room.leaderId = lid;
      addLog("系统", `房间帧里没有队长，已从队伍数据补上：${lid}`, "info");
      return lid;
    }
  }

  if (tokenId && room.roomId) {
    await syncRoomQuiet();
    const lid = Number(room.leaderId || 0);
    if (lid) return lid;
  }
  return 0;
}

/**
 * 找某个 roleId 的连接，没连就按房间帧里的昵称猜出 token 并连上。
 * 用于队长：setfighter 缺了队长连接必然被判「无权限」。
 */
async function resolveTokenOfRole(roleId) {
  const target = Number(roleId || 0);
  if (!target) return "";
  const existing = await findTokenOfRole(target);
  if (existing) return existing;

  const name = (room.fightRoleBase || []).find(
    (member) => Number(member.roleId) === target,
  )?.name;
  const guess = tokenGuessByName(name);
  if (!guess) return "";
  if (!(await ensureConnected(guess))) return "";
  const rid = await getRoleId(guess);
  if (Number(rid) !== target) return "";
  addLog(getName(guess), `按昵称匹配到队长（${name}），已连接`, "info");
  return guess;
}

async function refreshRoom() {
  if (roomLoading.value) return;
  roomLoading.value = true;
  try {
    const online = await connectAll(
      selected.value.length ? selected.value : tokens.value.map((t) => t.id),
    );
    if (!online.length) {
      message.error("没有可用账号");
      return;
    }

    // 1) roomId：先用已知的，再逐个问 nightmare_getroleinfo
    let roomId = String(room.roomId || "");
    let queryToken = online[0];
    for (const tokenId of online) {
      const roleId = await getRoleId(tokenId);
      if (!roleId) continue;
      const result = await send(tokenId, "nightmare_getroleinfo", { roleId });
      const data = result.body?.nightMareData || {};
      if (data.roomId && !roomId) {
        roomId = String(data.roomId);
        queryToken = tokenId;
      }
      addLog(
        getName(tokenId),
        `十殿数据：房间 ${data.roomId || "不在房间"}｜点数 ${data.love ?? 0}｜今日已打 ${data.todayFightCnt ?? 0} 次`,
        "info",
      );
      await sleep(120);
    }

    // 2) 全量快照：这才是"读房间"的正解（推送只到游戏客户端）
    if (roomId) {
      const info = await fetchRoomInfo(queryToken, roomId);
      if (info) {
        const cards = applyRoomLineup(info);
        addLog(
          "系统",
          `房间快照 ${info.roomId}｜第 ${info.curMonsterCfgId ?? "?"} 层｜boss 剩余 ${bossHpText.value}｜成员 ${info.fightRoleBase?.length ?? 0} 人${cards ? `（阵容已载入 ${cards} 张）` : ""}`,
          "success",
        );
      } else {
        addLog(
          "系统",
          `getroominfo 没返回房间 ${roomId} 的数据（可能已结算/房间已销毁），改看重放`,
          "warning",
        );
      }
    } else {
      addLog("系统", "所有账号都不在房间里，拿不到 roomId", "warning");
    }

    // 3) 兜底：从游戏页埋点日志重放（含战报，战报只有日志里有）
    const replay = await replayRoomFromHistory();
    addLog(
      "系统",
      `重放历史帧 ${replay.scanned} 条（解码失败 ${replay.failed}）：房间状态 ${replay.roomFrames} 次、战报 ${replay.fightFrames} 场`,
      "info",
    );

    if (!room.roomId && !room.curMonsterCfgId) {
      addLog(
        "系统",
        "完全没拿到房间数据：确认队伍还在房间里，或先点「开团」",
        "warning",
      );
    }
    roomUpdatedAt.value = now();
  } catch (error) {
    addLog("系统", `读取房间失败：${error?.message || error}`, "error");
  } finally {
    roomLoading.value = false;
  }
}

const leaderName = computed(
  () => lineup.value.find((m) => m.isLeader)?.name || "",
);
/** state=1 时正在播放结算的那一层（房间层数此时已经跳到下一层） */
const playingLayer = computed(() => {
  if (Number(room.state) !== 1) return 0;
  return Number(lastFight.value?.bossCfgId) || 0;
});

const bossHpText = computed(() => {
  const layer = Number(room.curMonsterCfgId || 0);
  const hp = bossHpOf(layer);
  return hp === null ? "—" : fmtHp(hp);
});

// 最近一场战报摘要（只读展示）
const lastFightText = computed(() => {
  const fight = lastFight.value;
  if (!fight?.result) return "";
  const result = fight.result;
  const dealt = (fight.sponsor?.teamInfo || []).reduce(
    (sum, h) => sum + (Number(h.damage) || 0),
    0,
  );
  return `最近一战：第 ${fight.bossCfgId} 层 ${result.isWin ? "✔ 通过" : "✘ 未通过"}（${result.round}/15 回合，输出 ${fmtHp(dealt)}）`;
});

/**
 * 当前 boss 详情。
 *
 * 血量只有 `curMonsterData[id].curHp` 一个可信来源；
 * 播放结算时房间层数已经跳到下一层，所以这时展示"正在结算的那层"。
 */
const currentBoss = computed(() => {
  const playing = Number(room.state) === 1;
  const layer = playing
    ? Number(lastFight.value?.bossCfgId) || Number(room.curMonsterCfgId || 0)
    : Number(room.curMonsterCfgId || 0);
  if (!layer) return null;

  const cfg = getBossOfLayer(layer);
  const info = room.monsterTeamInfo?.[layer] || {};
  const liveData = info.curMonsterData || {};
  const snap = layerHpSnap[layer];
  // 未交战的层 curMonsterData 是全 0 占位，不能当成"已击杀"
  const engaged =
    Number(info.totalAttacked) > 0 ||
    Object.values(liveData).some((unit) => Number(unit.curHp) > 0);

  // 配置表有就用配置表的单位顺序，否则退回房间下发的 curMonsterData
  const unitDefs = cfg?.units?.length
    ? cfg.units
    : Object.keys(liveData).map((id) => ({ id: Number(id), pos: 0 }));

  const units = unitDefs.map((def) => ({
    id: Number(def.id),
    pos: Number(def.pos),
    label: BOSS_POS_LABEL[def.pos] || (def.pos ? `${def.pos} 号位` : ""),
    level: 0,
    hp: engaged ? bossUnitHp(layer, def.id) : null,
    maxHp: snap?.units?.[String(def.id)] ?? null,
  }));
  const known = units.filter((unit) => unit.hp !== null);

  return {
    layer,
    playing,
    engaged,
    name: cfg?.name || `第 ${layer} 层`,
    power: Number(cfg?.power) || 0,
    integral: Number(cfg?.integral) || 0,
    attacked: Number(info.totalAttacked) || 0,
    units,
    hp: known.length ? known.reduce((sum, unit) => sum + unit.hp, 0) : null,
    maxHp: snap ? snap.maxTotal : null,
  };
});

// 各层 boss：剩余血 / 开战前快照的最大血 / 被攻击次数 / 是否通过
const bossLayers = computed(() => {
  const current = Number(room.curMonsterCfgId || 0);
  return Object.entries(room.monsterTeamInfo || {})
    .map(([layer, info]) => {
      const hp = bossHpOf(layer);
      const attacked = Number(info?.totalAttacked || 0);
      return {
        layer: Number(layer),
        hp,
        maxHp: bossMaxTotalOf(layer),
        attacked,
        current: Number(layer) === current,
        // 有数据且全部归零、且确实被打过 → 通过
        cleared: hp === 0 && attacked > 0,
      };
    })
    .sort((a, b) => a.layer - b.layer);
});

// 战报展示：每层"最新一场"的 boss 剩余用房间实时血量兜底
// （首次打某层时战前快照是 0 占位，靠战报算不出来）
const battleRows = computed(() => {
  const latest = {};
  for (const battle of battles.value) {
    if (!latest[battle.layer]) latest[battle.layer] = battle;
  }
  return battles.value.map((battle) => {
    if (battle.bossLeft !== null) return battle;
    if (latest[battle.layer] !== battle) return battle;
    const current = bossHpOf(battle.layer);
    return current === null
      ? battle
      : { ...battle, bossLeft: current, bossLeftFromRoom: true };
  });
});

/** roleId → { 武将id: 最大血量 }，来自 fightRoleBase.battleData.team[*].hp */
const heroMaxHpMap = computed(() => {
  const map = {};
  for (const member of room.fightRoleBase || []) {
    const team = member?.battleData?.team || {};
    const heroes = {};
    for (const hero of Object.values(team)) {
      if (hero && hero.id !== undefined) {
        heroes[Number(hero.id)] = Number(hero.hp) || 0;
      }
    }
    map[Number(member.roleId)] = heroes;
  }
  return map;
});

// 每个账号在房间里的武将血量/怒气（playerTeamInfo.curHeroData + 布阵里的最大血量）
const memberStatus = computed(() => {
  const list = [];
  const maxMap = heroMaxHpMap.value;
  for (const [roleId, info] of Object.entries(room.playerTeamInfo || {})) {
    const heroes = info?.curHeroData || {};
    const caps = maxMap[Number(roleId)] || {};
    const entries = Object.entries(heroes).map(([id, hero]) => {
      const hp = Number(hero.curHp) || 0;
      const maxHp = caps[Number(id)] || 0;
      return {
        id: Number(id),
        hp,
        maxHp,
        hpPct: maxHp
          ? Math.max(0, Math.min(100, (hp / maxHp) * 100))
          : hp > 0
            ? 100
            : 0,
        energy: Number(hero.curEnergy),
      };
    });
    const totalHp = entries.reduce((sum, hero) => sum + hero.hp, 0);
    const totalMaxHp = entries.reduce((sum, hero) => sum + hero.maxHp, 0);
    const card = lineup.value.find((c) => c.roleId === Number(roleId));
    list.push({
      roleId: Number(roleId),
      name: card?.name || String(roleId),
      total: entries.length,
      alive: entries.filter((hero) => hero.hp > 0).length,
      totalHp,
      totalMaxHp,
      hpPct: totalMaxHp ? (totalHp / totalMaxHp) * 100 : 0,
      heroes: entries.sort((a, b) => b.hp - a.hp),
    });
  }
  return list.sort((a, b) => b.alive - a.alive);
});

function heroName(id) {
  return HERO_DICT[Number(id)]?.name || `#${id}`;
}
function heroAvatar(id) {
  return HERO_DICT[Number(id)]?.avatar || "";
}
/**
 * 血量/伤害数值：≥ 1 亿才折成「亿」，其余原样显示整数。
 *
 * 第 6 层 boss 是特殊数值（正常一击只掉 1 点血，HP 只有几十/几百），
 * 折成「亿」会永远显示 0.0 亿看不出变化，所以小值必须原样显示，也不折「万」。
 */
function fmtHp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(1)} 亿`;
  return String(Math.round(n));
}

function fmtPower(value) {
  const n = Number(value) || 0;
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)} 万`;
  return String(n);
}

/**
 * 按队伍成员逐个取「出战阵容」，生成卡片。
 *
 * 数据来自 role_gettargetteam { targetId, teamType: 3 }：
 *   teamInfo.team 是 0~4 号位的真实站位（含 level/star/attack）
 *   teamInfo.power 是总战力，teamInfo.name/headImg 是账号信息
 * 优先用成员自己的连接查，没连上就借队长（owner）的连接。
 */
async function loadLineup(ownerId) {
  const target = teamId.value;
  if (!target) {
    message.warning("还没有 teamId，请先建队");
    return;
  }
  const owner = ownerId || selected.value[0];
  if (!owner || !(await ensureConnected(owner))) return;

  lineupLoading.value = true;
  try {
    const team = await analyzeTeam(owner, target);
    if (!team) {
      message.error("读取队伍失败");
      return;
    }

    const cards = [];
    for (const member of team.members.values()) {
      const roleId = Number(member.roleId);

      // 优先用队伍里携带的布阵（进战前后服务端会填 battleData.team），
      // 没有才去查该角色 teamType=3 的出战阵容——十殿的布阵就存在这一档。
      let heroes = [];
      let source = "";
      const battleTeam = member.battleData?.team;
      if (battleTeam && Object.keys(battleTeam).length) {
        heroes = Object.entries(battleTeam)
          .map(([pos, hero]) => ({ pos: Number(pos), ...hero }))
          .sort((a, b) => a.pos - b.pos);
        source = "battleData";
      }

      let info = {};
      if (!heroes.length) {
        let holder = owner;
        const ownToken = selected.value.find(
          (id) => Number(roleIdCache[id]) === roleId,
        );
        if (ownToken && ownToken !== owner && isConnected(ownToken)) {
          holder = ownToken;
        }

        const result = await send(holder, "role_gettargetteam", {
          targetId: roleId,
          teamType: 3,
          cCMonsterId: 0,
        });
        info = result.body?.teamInfo || {};
        heroes = Object.entries(info.team || {})
          .map(([pos, hero]) => ({ pos: Number(pos), ...hero }))
          .sort((a, b) => a.pos - b.pos);
        source = "targetteam";
        await sleep(150);
      }

      cards.push({
        roleId,
        name: info.name || member.name || String(roleId),
        headImg: info.headImg || member.headImg || "",
        isLeader: roleId === team.leaderId,
        prepared: Number(member.prepared) === 1,
        power: info.power || member.power || 0,
        heroes,
        source,
      });
    }

    // 队长排最前，其余按战力降序
    cards.sort(
      (a, b) =>
        Number(b.isLeader) - Number(a.isLeader) ||
        Number(b.power) - Number(a.power),
    );
    lineup.value = cards;
    addLog(
      "系统",
      `阵容已加载：${cards.length} 人（队长 ${team.leaderId}）`,
      "success",
    );
  } catch (error) {
    addLog("系统", `加载阵容失败：${error?.message || error}`, "error");
  } finally {
    lineupLoading.value = false;
  }
}

// 有新日志就自动滚到底部；用户手动往上翻时（离底部 > 80px）不打扰
watch(
  () => logs.value.length,
  async () => {
    await nextTick();
    const el = logsBox.value;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 80) el.scrollTop = el.scrollHeight;
  },
);

const MAX_LOGS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function now() {
  return new Date().toTimeString().slice(0, 8);
}

function getName(tokenId) {
  const token = tokens.value.find((item) => item.id === tokenId);
  return token?.name || tokenId;
}

function addLog(who, msg, type = "info") {
  logs.value.push({ time: now(), who, msg, type });
  if (logs.value.length > MAX_LOGS) logs.value.shift();
}

function wsStatus(tokenId) {
  return tokenStore.getWebSocketStatus(tokenId) || "disconnected";
}

function isConnected(tokenId) {
  return wsStatus(tokenId) === "connected";
}

function toggle(tokenId, checked) {
  if (checked) {
    if (!selected.value.includes(tokenId)) selected.value.push(tokenId);
  } else {
    selected.value = selected.value.filter((id) => id !== tokenId);
  }
}

async function waitConnected(tokenId, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (isConnected(tokenId)) return true;
    await sleep(200);
  }
  return isConnected(tokenId);
}

async function ensureConnected(tokenId, retries = 2) {
  if (isConnected(tokenId)) return true;

  const token = tokens.value.find((item) => item.id === tokenId);
  if (!token) {
    addLog(getName(tokenId), "未找到账号数据", "error");
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    addLog(
      getName(tokenId),
      attempt === 1 ? "连接中…" : `连接重试 ${attempt}/${retries}…`,
      "info",
    );
    try {
      await tokenStore.createWebSocketConnection(
        tokenId,
        token.token,
        token.wsUrl,
      );
      if (await waitConnected(tokenId)) {
        addLog(getName(tokenId), "连接成功", "success");
        return true;
      }
      addLog(getName(tokenId), `连接超时（第 ${attempt} 次）`, "error");
    } catch (error) {
      addLog(
        getName(tokenId),
        `连接失败（第 ${attempt} 次）：${error?.message || error}`,
        "error",
      );
    }
    if (attempt < retries) await sleep(1000);
  }
  return false;
}

/** 并行连接一批账号，返回连上的账号 id 列表（连不上的直接排除，后面不再逐个等超时） */
async function connectAll(tokenIds) {
  addLog("系统", `并行连接 ${tokenIds.length} 个账号…`, "info");
  const results = await Promise.all(
    tokenIds.map(async (id) => ({ id, ok: await ensureConnected(id) })),
  );
  const online = results.filter((r) => r.ok).map((r) => r.id);
  const offline = results.filter((r) => !r.ok).map((r) => r.id);
  if (offline.length) {
    addLog(
      "系统",
      `连接失败将跳过：${offline.map((id) => getName(id)).join("、")}`,
      "warning",
    );
  }
  return online;
}

const connecting = ref(false);

/**
 * 手动连接勾选账号。
 * `nightmare_fight` 由本人连接发，所以每个要上场的账号都得有自己的 WS 连接；
 * 队长那条连接只能发 setfighter / leadercomplete。
 */
async function connectSelected() {
  if (connecting.value) return;
  const ids = selected.value.length
    ? [...selected.value]
    : tokens.value.map((item) => item.id);
  if (!ids.length) {
    message.warning("先勾选账号");
    return;
  }
  connecting.value = true;
  try {
    const online = await connectAll(ids);
    if (online.length === ids.length) {
      message.success(`已连接 ${online.length} 个账号`);
    } else {
      message.warning(`已连接 ${online.length}/${ids.length}，其余见日志`);
    }
  } finally {
    connecting.value = false;
  }
}

function responseBody(response) {
  if (response?.body && typeof response.body === "object") return response.body;
  return response || {};
}

function pickTeamId(body) {
  if (!body) return "";
  if (body.teamInfo?.teamId) return String(body.teamInfo.teamId);
  if (body.matchTeamData?.teamId) return String(body.matchTeamData.teamId);
  const map = body.roleMTData?.gDMTData;
  if (map && typeof map === "object") {
    const firstKey = Object.keys(map)[0];
    if (firstKey) return String(firstKey);
  }
  return "";
}

/** 在任意嵌套结构里按 key 找第一个值（用于兜底取 petUId 这类位置不固定的字段） */
function findKeyDeep(obj, key) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[key] !== undefined && obj[key] !== "") return obj[key];
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const hit = findKeyDeep(value, key);
      if (hit !== undefined && hit !== "") return hit;
    }
  }
  return undefined;
}

async function send(tokenId, cmd, params = {}, timeout = 10000) {
  addLog(getName(tokenId), `→ ${cmd} ${JSON.stringify(params)}`, "send");
  try {
    const response = await tokenStore.sendMessageWithPromise(
      tokenId,
      cmd,
      params,
      timeout,
    );
    const body = responseBody(response);
    addLog(getName(tokenId), `← ${cmd} ok`, "success");
    return { ok: true, body };
  } catch (error) {
    const code = error?.code;
    addLog(
      getName(tokenId),
      `← ${cmd} 失败${code ? ` [${code}]` : ""}：${error?.message || error}`,
      "error",
    );
    // 错误包原样落盘，便于离线看服务端回了哪些字段（hint / params / body）
    try {
      const detail = JSON.stringify({
        code,
        hint: error?.hint,
        rawBody: error?.rawBody,
        rawKeys: error?.rawPacket ? Object.keys(error.rawPacket) : null,
        rawPacket: (() => {
          try {
            return JSON.parse(JSON.stringify(error?.rawPacket || null));
          } catch {
            return String(error?.rawPacket);
          }
        })(),
      });
      fetch("/frontend-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: [
            {
              ts: new Date().toISOString(),
              level: "warn",
              message: `probe:error:${cmd}`,
              page: "/helper-probe",
              meta: { cmd, code, detail: detail.slice(0, 4000) },
            },
          ],
        }),
      }).catch(() => {});
    } catch {}
    return { ok: false, error, code };
  }
}

const roleIdCache = {};

async function getRoleId(tokenId) {
  if (roleIdCache[tokenId]) return roleIdCache[tokenId];

  const token = tokens.value.find((item) => item.id === tokenId);
  if (token?.roleId) {
    roleIdCache[tokenId] = Number(token.roleId);
    return roleIdCache[tokenId];
  }

  const result = await send(tokenId, "role_getroleinfo", {});
  const roleId = Number(result.body?.role?.roleId || result.body?.roleId || 0);
  if (roleId) roleIdCache[tokenId] = roleId;
  return roleId || 0;
}

/** 解析 roleMTData.gDMTData：一个角色可能同时属于多个玩法的队伍 */
function parseMyTeams(body) {
  const map = body?.roleMTData?.gDMTData;
  if (!map || typeof map !== "object") return [];
  return Object.values(map)
    .map((item) => ({
      teamId: String(item?.teamId ?? ""),
      teamCfgId: Number(item?.teamCfgId ?? 0),
    }))
    .filter((item) => item.teamId);
}

const NIGHTMARE_TEAM_CFG_ID = 1; // 普通十殿；星级试炼是 7（N 前缀），不要动
const CODE_ALREADY_IN_TEAM = "7100020"; // 已经加入队伍（幂等，视为成功）
const CODE_NOT_IN_TEAM = "7800320"; // 不在队伍中（未加入就准备时会报）

async function fetchMyTeams(tokenId) {
  const roleId = await getRoleId(tokenId);
  if (!roleId) {
    addLog(getName(tokenId), "拿不到 roleId，跳过查询", "warning");
    return null;
  }
  const result = await send(tokenId, "matchteam_getroleteaminfo", {
    roleID: roleId,
  });
  if (!result.ok) return null;
  const teams = parseMyTeams(result.body);
  addLog(
    getName(tokenId),
    teams.length
      ? `所在队伍：${teams.map((t) => `${t.teamId}(cfg=${t.teamCfgId})`).join(" / ")}`
      : "所在队伍：无",
    "info",
  );
  return teams;
}

/**
 * 建队前置：把「当前出战阵容」同步给组队玩法（teamType=3）。
 *
 * 抓包实测，游戏在建队前会依次发三条：
 *   role_gettargetteam { targetId, teamType: 3, cCMonsterId: 0 }
 *     → teamInfo.team 是真实站位（0~4 的 heroId）、teamInfo.weaponId
 *   hero_calcpowerbyteam { battleTeam, lordWeaponId, petUId }
 *   team_setteam { teamType: 3, battleTeam, lordWeaponId, petUId, cCMonsterId }
 *
 * petUId：游戏会带上当前佩戴的宠物（形如 "130-hoX"），但 role_gettargetteam 的
 * teamInfo 里没有这个字段，role_getroleinfo 的 petData 也是空的（宠物走独立命令）。
 * 目前传空串，实测服务端不因此拒绝建队——200110 的真因是队名含非法字符，
 * 错误包里的 error 字段写着「内容包含非法字符」。
 */
async function prepareBattleTeam(tokenId) {
  const roleId = await getRoleId(tokenId);
  if (!roleId) {
    addLog(getName(tokenId), "拿不到 roleId，跳过阵容设置", "warning");
    return false;
  }

  const target = await send(tokenId, "role_gettargetteam", {
    targetId: roleId,
    teamType: 3,
    cCMonsterId: 0,
  });
  const teamInfo = target.body?.teamInfo || {};

  // 调试探针：把原始返回写到后端日志（page=/helper-probe），便于离线核对字段结构
  try {
    addLog(
      getName(tokenId),
      `gettargetteam 返回字段：${Object.keys(teamInfo).join(",") || "(空)"}`,
      "send",
    );
    fetch("/frontend-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logs: [
          {
            ts: new Date().toISOString(),
            level: "debug",
            message: "probe:role_gettargetteam",
            page: "/helper-probe",
            meta: {
              cmd: "role_gettargetteam",
              body: JSON.stringify(target.body).slice(0, 8000),
            },
          },
        ],
      }),
    }).catch(() => {});
  } catch {}

  const battleTeam = {};
  for (const [pos, hero] of Object.entries(teamInfo.team || {})) {
    const heroId = hero?.id ?? hero?.heroId;
    if (heroId) battleTeam[pos] = Number(heroId);
  }

  if (!Object.keys(battleTeam).length) {
    addLog(getName(tokenId), "没读到出战阵容，跳过 team_setteam", "warning");
    return false;
  }

  const lordWeaponId = Number(teamInfo.weaponId || teamInfo.lordWeaponId || 0);
  // petUId 位置不固定：优先 teamInfo.petUId，找不到就全量搜一遍
  const petUId = teamInfo.petUId || findKeyDeep(target.body, "petUId") || "";
  const cCMonsterId = 0;

  // 先按当前阵容算一次战力（游戏也是这个顺序），响应是 hero_calcpowerbyteamresp
  try {
    await send(tokenId, "hero_calcpowerbyteam", {
      battleTeam,
      lordWeaponId,
      petUId,
    });
  } catch (error) {
    addLog(
      getName(tokenId),
      `hero_calcpowerbyteam 失败（继续）：${error?.message || error}`,
      "warning",
    );
  }
  await sleep(300);

  // team_setteam 的响应是 syncteamresp（多命令共用），用不带 Promise 的发送
  try {
    addLog(
      getName(tokenId),
      `→ team_setteam ${JSON.stringify({
        teamType: 3,
        battleTeam,
        lordWeaponId,
        petUId,
      })}`,
      "send",
    );
    tokenStore.sendMessage(tokenId, "team_setteam", {
      teamType: 3,
      battleTeam,
      lordWeaponId,
      petUId,
      cCMonsterId,
    });
  } catch (error) {
    addLog(
      getName(tokenId),
      `team_setteam 发送失败：${error?.message || error}`,
      "warning",
    );
    return false;
  }

  addLog(
    getName(tokenId),
    `已同步出战阵容：${Object.values(battleTeam).join(",")}（weaponId=${lordWeaponId}，petUId=${petUId || "无"}）`,
    "info",
  );
  await sleep(800);
  return true;
}

async function doCreate(leaderId) {
  const id =
    typeof leaderId === "string" && leaderId ? leaderId : selected.value[0];
  if (!id) {
    message.warning("请先勾选队长账号");
    return "";
  }
  if (!(await ensureConnected(id))) return "";

  // 已经在普通十殿队伍里时直接复用，不再解散重建——
  // 服务端并不禁止"已有队伍时建队"，之前的 200110 真因是队名含非法字符。
  // 自动解散会把队伍里的其他人踢掉，风险太大，需要时用「解散」按钮手动清。
  const teams = (await fetchMyTeams(id)) || [];
  const normalTeams = teams.filter(
    (team) => team.teamCfgId === NIGHTMARE_TEAM_CFG_ID,
  );
  if (normalTeams.length) {
    const reused = normalTeams[0].teamId;
    teamId.value = reused;
    addLog(getName(id), `已在十殿队伍 ${reused}，直接复用`, "info");
    return reused;
  }

  // 游戏客户端建队前一定会先设定组队玩法（teamType=3）的上阵阵容，
  // 再刷新一次组队列表，然后才发 create。
  await prepareBattleTeam(id);
  await send(id, "matchteam_getrandteamlist", {
    teamCfgId: NIGHTMARE_TEAM_CFG_ID,
    param: 0,
    custom: {},
  });
  // 抓包里游戏两次都在刷新列表后隔 4~6 秒才建队，紧贴着发会被拒
  await sleep(5000);

  const result = await send(id, "matchteam_create", {
    teamCfgId: 1,
    setting: {
      name: teamName.value || "123",
      notice: "",
      secret: 1,
      apply: 0,
      applyList: [],
      star: 0,
    },
    param: 0,
    custom: {},
    extParam: 0,
  });

  if (!result.ok) {
    if (String(result.code) === "200110") {
      // 实测服务端返回 error: "内容包含非法字符" —— 队名命中了敏感词表
      addLog(
        getName(id),
        `200110：队名不合法（${result.error?.hint || "内容包含非法字符"}），换一个名字再试`,
        "warning",
      );
    }
    return "";
  }
  const created = pickTeamId(result.body);
  if (created) {
    teamId.value = created;
    addLog(getName(id), `建队成功，teamId=${created}`, "success");
  } else {
    addLog(getName(id), "建队返回里没有 teamId，请看原始响应", "warning");
  }
  return created;
}

async function joinOne(tokenId, id) {
  if (!(await ensureConnected(tokenId)))
    return { ok: false, reason: "连接失败" };
  const result = await send(tokenId, "matchteam_join", { teamId: id });
  if (result.ok) {
    addLog(getName(tokenId), `已加入 ${id}`, "success");
    return { ok: true };
  }
  // 已经在队里时服务端会报 7100020，属于幂等成功，不要当成失败
  if (String(result.code) === CODE_ALREADY_IN_TEAM) {
    addLog(getName(tokenId), `已在队伍 ${id} 中，跳过`, "info");
    return { ok: true, already: true };
  }
  return { ok: false, reason: result.error?.message || "未知错误" };
}

async function prepareOne(tokenId, id) {
  if (!(await ensureConnected(tokenId)))
    return { ok: false, reason: "连接失败" };
  const result = await send(tokenId, "matchteam_memberprepare", {
    teamId: id,
  });
  if (result.ok) {
    addLog(getName(tokenId), "已准备", "success");
    return { ok: true };
  }
  if (String(result.code) === CODE_NOT_IN_TEAM) {
    addLog(getName(tokenId), `不在队伍 ${id} 里，跳过准备`, "warning");
    return { ok: false, reason: "不在队伍中" };
  }
  return { ok: false, reason: result.error?.message || "未知错误" };
}

async function doJoin(id, memberIds) {
  const target = typeof id === "string" && id ? id : teamId.value;
  if (!target) {
    message.warning("还没有 teamId，请先建队");
    return [];
  }
  const members = memberIds || selected.value.slice(1);
  if (!members.length) {
    message.warning("需要至少一个队员账号（勾选的第二个及之后）");
    return [];
  }
  const results = [];
  for (const tokenId of members) {
    const r = await joinOne(tokenId, target);
    results.push({ id: tokenId, ...r });
    await sleep(300);
  }
  return results;
}

/**
 * 读取队伍现状。
 *
 * `matchteam_memberprepare` 是**开关**：对已准备的成员再调一次会取消准备，
 * 所以任何"准备"动作之前都必须先分析一次成员状态，只对 prepared=0 的人发。
 */
async function analyzeTeam(ownerId, target) {
  const result = await send(ownerId, "matchteam_getteaminfo", {
    teamId: target,
  });
  if (!result.ok) return null;
  const info = result.body?.teamInfo || {};
  const members = new Map();
  for (const member of info.fightRoleBase || []) {
    members.set(Number(member.roleId), member);
  }

  // 调试探针：把原始 teamInfo 落盘，用来确认"十殿布阵"到底存在哪个字段
  try {
    fetch("/frontend-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logs: [
          {
            ts: new Date().toISOString(),
            level: "debug",
            message: "probe:matchteam_getteaminfo",
            page: "/helper-probe",
            meta: {
              cmd: "matchteam_getteaminfo",
              body: JSON.stringify(result.body).slice(0, 12000),
            },
          },
        ],
      }),
    }).catch(() => {});
  } catch {}

  return {
    teamId: String(info.teamId || target),
    leaderId: Number(info.leaderId || 0),
    members,
    raw: info,
  };
}

/** 把队伍分析结果打成一行，便于肉眼核对 */
function formatTeam(team) {
  if (!team) return "(读取队伍失败)";
  const list = [...team.members.values()].map((m) => {
    const isLeader = Number(m.roleId) === team.leaderId;
    return `${m.name}(prepared=${Number(m.prepared) || 0}${isLeader ? "，队长" : ""})`;
  });
  return list.length ? list.join(" / ") : "(空队伍)";
}

/**
 * 按队伍现状准备：只对"在队伍里、不是队长、且 prepared=0"的账号发 prepare。
 */
async function prepareByTeam(team, candidates, target) {
  const results = [];
  if (!team) return results;

  for (const tokenId of candidates) {
    const roleId = await getRoleId(tokenId);
    const name = getName(tokenId);
    const member = team.members.get(roleId);

    if (team.leaderId && roleId === team.leaderId) {
      addLog(name, "是队长，不需要准备", "info");
      results.push({ id: tokenId, ok: true, skipped: "leader" });
      continue;
    }
    if (!member) {
      addLog(name, `不在队伍 ${target} 里，跳过准备`, "warning");
      results.push({ id: tokenId, ok: false, reason: "不在队伍中" });
      continue;
    }
    if (Number(member.prepared) === 1) {
      addLog(name, "已经是准备状态，跳过（重复调用会取消准备）", "info");
      results.push({ id: tokenId, ok: true, skipped: "prepared" });
      continue;
    }

    const r = await prepareOne(tokenId, target);
    results.push({ id: tokenId, ...r });
    await sleep(300);
  }
  return results;
}

/** 「只准备」按钮：先分析再决定 */
async function doPrepare(id, memberIds, ownerId) {
  const target = typeof id === "string" && id ? id : teamId.value;
  if (!target) return [];
  const owner = ownerId || selected.value[0];
  if (!owner || !(await ensureConnected(owner))) return [];

  const team = await analyzeTeam(owner, target);
  addLog("系统", `队伍分析：${formatTeam(team)}`, "info");
  return prepareByTeam(team, memberIds || selected.value, target);
}

async function doQuery(ownerId) {
  const id = ownerId || selected.value[0];
  if (!id || !teamId.value) return;
  if (!(await ensureConnected(id))) return;
  const result = await send(id, "matchteam_getteaminfo", {
    teamId: teamId.value,
  });
  if (!result.ok) return;
  const info = result.body?.teamInfo || result.body?.matchTeamData;
  const list = info?.fightRoleBase || [];
  addLog(
    getName(id),
    `队伍 ${info?.teamId} state=${info?.state} 成员 ${list.length} 人：${ 
      list
        .map((m) => `${m.name}(prepared=${m.prepared},power=${m.power})`)
        .join(" / ")}`,
    "info",
  );
}

async function doQueryMine() {
  for (const tokenId of selected.value) {
    if (!(await ensureConnected(tokenId))) continue;
    const teams = (await fetchMyTeams(tokenId)) || [];
    const normal = teams.find(
      (team) => team.teamCfgId === NIGHTMARE_TEAM_CFG_ID,
    );
    if (normal) teamId.value = normal.teamId;
  }
}

async function doDismiss() {
  const id = selected.value[0];
  if (!id || !teamId.value) return;
  if (!(await ensureConnected(id))) return;
  const result = await send(id, "matchteam_dismiss", {
    teamId: teamId.value,
  });
  if (result.ok) {
    addLog(getName(id), `已解散 ${teamId.value}`, "success");
    teamId.value = "";
  }
}

/** 当前账号所在的十殿队伍（teamCfgId=1），没有则返回 null */
async function currentNightmareTeam(tokenId) {
  const teams = (await fetchMyTeams(tokenId)) || [];
  return (
    teams.find(
      (team) =>
        team.teamCfgId === NIGHTMARE_TEAM_CFG_ID && Boolean(team.teamId),
    ) || null
  );
}

/**
 * 退出队伍：`matchteam_dismiss { teamId }`。
 * 队长调用是「解散」，普通成员调用是「离队」——这里只对非队长使用。
 */
async function leaveTeam(tokenId, id) {
  if (!(await ensureConnected(tokenId))) {
    return { ok: false, reason: "连接失败" };
  }
  const result = await send(tokenId, "matchteam_dismiss", { teamId: id });
  if (result.ok) {
    addLog(getName(tokenId), `已退出队伍 ${id}`, "success");
    return { ok: true };
  }
  return { ok: false, reason: result.error?.message || "未知错误" };
}

async function runAll() {
  if (running.value) return;
  if (selected.value.length < 2) {
    message.warning("至少勾选 2 个账号：队长 + 至少 1 个队员");
    return;
  }
  running.value = true;
  try {
    addLog("系统", "开始一键组队（自动校正队伍归属）", "info");
    const online = await connectAll(selected.value);
    if (online.length < 2) {
      addLog("系统", `可用账号不足（连上 ${online.length} 个），中止`, "error");
      message.error("可用账号不足 2 个");
      return;
    }

    // 1) 队长：房间帧 > 目标队伍 > 第一个勾选账号
    let leaderId = Number(room.leaderId || 0);
    if (!leaderId && teamId.value) {
      const team = await analyzeTeam(online[0], teamId.value);
      leaderId = Number(team?.leaderId || 0);
    }
    if (!leaderId) {
      leaderId = Number(await getRoleId(online[0])) || 0;
      addLog(
        "系统",
        `没有房间/队伍信息，按勾选顺序把 ${getName(online[0])} 当队长`,
        "info",
      );
    }

    // 2) 队长连接必须在线（按房间帧昵称自动适配 token）
    const leaderToken = await resolveTokenOfRole(leaderId);
    const leaderName =
      (room.fightRoleBase || []).find(
        (member) => Number(member.roleId) === leaderId,
      )?.name || String(leaderId);
    if (!leaderToken) {
      message.error(
        `缺少队长连接：${leaderName}（roleId=${leaderId}），请勾选并连接队长账号`,
      );
      addLog(
        "系统",
        `缺少队长连接：队长 ${leaderName}(${leaderId}) 不在已连接账号里，中止`,
        "error",
      );
      return;
    }
    if (!online.includes(leaderToken)) {
      message.error(`缺少队长连接：${getName(leaderToken)} 未在本次连接列表`);
      addLog(
        "系统",
        `队长 ${getName(leaderToken)} 不在本次在线列表，中止`,
        "error",
      );
      return;
    }
    room.leaderId = leaderId;

    // 3) 目标队伍：优先当前房间的 matchTeamId，其次输入框，最后队长已有队伍
    let target = String(room.matchTeamId || teamId.value || "");
    const leaderTeam = await currentNightmareTeam(leaderToken);
    if (!target && leaderTeam) {
      target = leaderTeam.teamId;
      addLog("系统", `队长已在十殿队伍 ${target}，直接复用`, "info");
    }
    if (!target) {
      target = await doCreate(leaderToken);
      if (!target) {
        message.error("建队失败，流程中止");
        return;
      }
      await sleep(500);
    }
    teamId.value = target;
    room.matchTeamId = target;
    addLog(
      "系统",
      `目标队伍 ${target}｜队长 ${leaderName}(${leaderId})`,
      "info",
    );

    // 4) 队伍现状（目标队伍失效时回退到队长当前队伍）
    let team0 = await analyzeTeam(leaderToken, target);
    if (!team0 || !team0.members.has(leaderId)) {
      const fallback = await currentNightmareTeam(leaderToken);
      if (fallback && String(fallback.teamId) !== String(target)) {
        target = fallback.teamId;
        teamId.value = target;
        room.matchTeamId = target;
        addLog("系统", `目标队伍无效，改用队长当前队伍 ${target}`, "warning");
        team0 = await analyzeTeam(leaderToken, target);
      }
    }
    addLog("系统", `① 队伍现状：${formatTeam(team0)}`, "info");
    if (!team0 || !team0.members.has(leaderId)) {
      message.error("队长不在目标队伍里（队伍可能已解散），请重新开团/建队");
      addLog("系统", "队长不在目标队伍，中止", "error");
      return;
    }

    // 5) 逐个校正：在别的队伍先退出，再重新加入队长队伍
    const joinResults = [];
    for (const tokenId of online) {
      const roleId = Number(await getRoleId(tokenId));
      const name = getName(tokenId);
      if (!roleId) {
        joinResults.push({ id: tokenId, ok: false, reason: "拿不到 roleId" });
        continue;
      }
      if (roleId === leaderId) {
        addLog(name, "队长：不退出、不准备", "info");
        joinResults.push({ id: tokenId, ok: true, leader: true });
        continue;
      }

      const current = await currentNightmareTeam(tokenId);
      const inTarget = Boolean(
        current && String(current.teamId) === String(target),
      );
      let reopened = false;

      if (current && !inTarget) {
        addLog(
          name,
          `当前在队伍 ${current.teamId}，不是队长队伍，先退出`,
          "warning",
        );
        const left = await leaveTeam(tokenId, current.teamId);
        if (!left.ok) {
          joinResults.push({
            id: tokenId,
            ok: false,
            reason: `退出旧队失败：${left.reason}`,
          });
          continue;
        }
        reopened = true;
        await sleep(400);
      }

      if (inTarget) {
        addLog(name, `已在队长队伍 ${target}，跳过加入`, "info");
        joinResults.push({ id: tokenId, ok: true, already: true });
        continue;
      }

      const joined = await joinOne(tokenId, target);
      joinResults.push({ id: tokenId, ...joined, reopened });
      await sleep(400);
    }

    // 6) 重新分析，只为未准备的人准备（队长跳过）
    const team1 = await analyzeTeam(leaderToken, target);
    addLog("系统", `② 校正后：${formatTeam(team1)}`, "info");
    const prepareResults = await prepareByTeam(team1, online, target);

    // 7) 最终核对 + 拉阵容
    const team2 = await analyzeTeam(leaderToken, target);
    addLog("系统", `③ 最终状态：${formatTeam(team2)}`, "success");
    await loadLineup(leaderToken);

    // 8) 汇总
    const rows = [];
    for (const tokenId of online) {
      const join = joinResults.find((item) => item.id === tokenId);
      const prep = prepareResults.find((item) => item.id === tokenId);
      const joinText = !join
        ? "—"
        : join.leader
          ? "队长"
          : join.reopened
            ? join.ok
              ? "退队后重新加入"
              : `退队后加入失败(${join.reason})`
            : join.ok
              ? join.already
                ? "已在队伍"
                : "已加入"
              : `失败(${join.reason})`;
      const prepText = !prep
        ? "—"
        : prep.skipped === "leader"
          ? "队长不准备"
          : prep.skipped === "prepared"
            ? "已准备"
            : prep.ok
              ? "已准备"
              : `失败(${prep.reason})`;
      rows.push(`${getName(tokenId)}: ${joinText} / ${prepText}`);
    }
    const failed = [...joinResults, ...prepareResults].filter(
      (item) => !item.ok,
    );
    addLog(
      "系统",
      `组队结果（${online.length} 人）：${rows.join("；")}`,
      failed.length ? "warning" : "success",
    );
    if (failed.length) {
      message.warning(`有 ${failed.length} 个账号未成功，详见日志`);
    } else {
      message.success("组队完成（队伍已校正）");
    }
  } finally {
    running.value = false;
  }
}
</script>

<style scoped>
.lab {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 页面铺一层自己的底色，避免直接压在紫色主色背景上 */
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #333333);
  min-height: calc(100vh - 80px);
  box-sizing: border-box;
}
.lab-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.lab-head h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary, #333333);
}
.hint {
  color: var(--text-tertiary, #999999);
  font-size: 12px;
}
.block {
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: var(--border-radius-medium, 8px);
  padding: 12px;
  background: var(--bg-secondary, #f5f7fa);
}
.block-title {
  font-size: 13px;
  color: var(--text-secondary, #666666);
  margin-bottom: 8px;
}
.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.token-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: var(--border-radius-small, 4px);
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #333333);
  cursor: pointer;
  font-size: 13px;
  user-select: none;
}
.token-item.active {
  border-color: var(--success-color, #18a058);
  background: rgba(24, 160, 88, 0.1);
}
.token-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge {
  background: var(--success-color, #18a058);
  color: #fff;
  border-radius: 4px;
  padding: 0 5px;
  font-size: 11px;
}
.ws-status {
  color: var(--text-tertiary, #999999);
  font-size: 11px;
}

/* ---------- 上阵阵容卡片 ---------- */
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.room-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-light, #e5e7eb);
  font-size: 12px;
  color: var(--text-primary, #333333);
}

/* ---------- 当前 boss 预览 ---------- */
.boss-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary, #666666);
  margin-bottom: 10px;
}
.boss-units {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}
.boss-unit {
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--bg-secondary, #fafafa);
}
.bu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.bu-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #333333);
}
.bu-lv {
  font-size: 11px;
  color: var(--text-tertiary, #999999);
}
.bu-name {
  font-size: 11px;
  color: var(--text-secondary, #888888);
  margin: 2px 0 6px;
}
.bu-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--bg-primary, #eeeeee);
  overflow: hidden;
}
.bu-fill {
  height: 100%;
  background: var(--error-color, #d03050);
  border-radius: 4px;
  transition: width 0.3s;
}
.bu-hp {
  font-size: 11px;
  color: var(--text-secondary, #666666);
  margin-top: 4px;
  text-align: right;
}

/* ---------- 层数 / boss 状态 ---------- */
.layer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #333333);
}
.layer-item.current {
  border-color: var(--warning-color, #f0a020);
  background: rgba(240, 160, 32, 0.08);
}
.layer-item.cleared {
  opacity: 0.6;
}
.layer-no {
  font-weight: 600;
}
.layer-hp,
.layer-atk {
  color: var(--text-secondary, #666666);
}
.member-status {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.member-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary, #333333);
}
.member-line .alive {
  color: var(--success-color, #18a058);
  margin-right: 4px;
}
.member-line .alive.low {
  color: var(--error-color, #d03050);
}
.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid var(--border-light, #e5e7eb);
}
.hero-chip em {
  font-style: normal;
  font-size: 11px;
  color: var(--text-tertiary, #999999);
}
.hero-chip.dead {
  opacity: 0.45;
  text-decoration: line-through;
}

.member-hp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary, #666666);
}
.member-bar {
  display: inline-block;
  width: 72px;
  height: 5px;
  border-radius: 3px;
  background: var(--border-light, #e5e7eb);
  overflow: hidden;
}
.member-bar i {
  display: block;
  height: 100%;
  background: var(--success-color, #18a058);
  transition: width 0.2s ease;
}
.hero-chip .hc-name {
  font-size: 11px;
}
.hero-chip .hc-bar {
  display: inline-block;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-light, #e5e7eb);
  overflow: hidden;
}
.hero-chip .hc-bar i {
  display: block;
  height: 100%;
  background: var(--success-color, #18a058);
  transition: width 0.2s ease;
}
.hero-chip.dead .hc-bar i {
  background: var(--text-tertiary, #bbbbbb);
}
.hero-chip .hc-hp {
  font-size: 10px;
  color: var(--text-tertiary, #999999);
}

.member-hp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary, #666666);
}
.member-bar {
  display: inline-block;
  width: 72px;
  height: 5px;
  border-radius: 3px;
  background: var(--border-light, #e5e7eb);
  overflow: hidden;
}
.member-bar i {
  display: block;
  height: 100%;
  background: var(--success-color, #18a058);
  transition: width 0.2s ease;
}
.hero-chip .hc-name {
  font-size: 11px;
}
.hero-chip .hc-bar {
  display: inline-block;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-light, #e5e7eb);
  overflow: hidden;
}
.hero-chip .hc-bar i {
  display: block;
  height: 100%;
  background: var(--success-color, #18a058);
  transition: width 0.2s ease;
}
.hero-chip.dead .hc-bar i {
  background: var(--text-tertiary, #bbbbbb);
}
.hero-chip .hc-hp {
  font-size: 10px;
  color: var(--text-tertiary, #999999);
}

/* ---------- 战报分析 ---------- */
.battle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}
.battle-item {
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--bg-secondary, #fafafa);
}
.battle-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 6px;
}
.battle-layer {
  font-weight: 600;
  color: var(--text-primary, #333333);
}
.battle-meta {
  color: var(--text-secondary, #666666);
}
.battle-role {
  margin-left: auto;
  color: var(--primary-color, #1677ff);
}
.battle-heroes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.battle-hero {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary, #333333);
}
.bh-name {
  width: 56px;
  flex: none;
}
.bh-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-primary, #eeeeee);
  overflow: hidden;
  min-width: 60px;
}
.bh-fill {
  height: 100%;
  background: var(--primary-color, #1677ff);
  border-radius: 4px;
}
.bh-pct {
  width: 40px;
  text-align: right;
  color: var(--text-secondary, #666666);
}
.bh-num {
  width: 70px;
  text-align: right;
}
.bh-sub {
  width: 190px;
  text-align: right;
  color: var(--text-tertiary, #999999);
  font-size: 11px;
}
.lineup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  margin-top: 10px;
}
.lineup-card {
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 8px;
  padding: 10px;
  background: var(--bg-secondary, #fafafa);
}
.lineup-card.leader {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 0 0 1px var(--primary-color, #1677ff) inset;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 6px;
}
.card-head:hover {
  background: rgba(22, 119, 255, 0.06);
}
.card-head:hover .name-text {
  color: var(--primary-color, #1677ff);
}
.card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-primary, #ffffff);
  flex: none;
}
.card-avatar.placeholder {
  border: 1px dashed var(--border-light, #e5e7eb);
}
.card-meta {
  min-width: 0;
  flex: 1;
}
.card-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-primary, #333333);
  font-weight: 600;
}
.name-text {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prep {
  font-size: 11px;
  font-weight: 400;
  padding: 0 5px;
  border-radius: 4px;
  line-height: 17px;
}
.prep.on {
  color: var(--success-color, #18a058);
  background: rgba(24, 160, 88, 0.12);
}
.prep.off {
  color: var(--warning-color, #f0a020);
  background: rgba(240, 160, 32, 0.12);
}
.card-power {
  font-size: 12px;
  color: var(--text-secondary, #666666);
  margin-top: 2px;
}
.card-foot {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.foot-hint {
  font-size: 11px;
  color: var(--text-tertiary, #999999);
  text-align: center;
}
.hero-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.hero-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 2px;
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-light, #e5e7eb);
  min-height: 92px;
  justify-content: center;
}
.hero-pos {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  color: var(--text-tertiary, #999999);
  line-height: 1;
}
.hero-img {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
}
.hero-name {
  font-size: 12px;
  color: var(--text-primary, #333333);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-lv {
  font-size: 10px;
  color: var(--text-tertiary, #999999);
  line-height: 1.2;
}
.hero-empty {
  font-size: 12px;
  color: var(--text-tertiary, #cccccc);
}

/* ---------- 单账号阵容详情弹窗 ---------- */
.detail-meta {
  font-size: 12px;
  color: var(--text-secondary, #666666);
  margin-bottom: 10px;
}
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 8px;
  background: var(--bg-secondary, #fafafa);
}
.detail-pos {
  font-size: 12px;
  color: var(--text-tertiary, #999999);
  min-width: 48px;
}
.detail-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-primary, #ffffff);
}
.detail-info {
  flex: 1;
  min-width: 0;
}
.detail-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #333333);
}
.detail-sub {
  font-size: 12px;
  color: var(--text-secondary, #888888);
  margin-top: 2px;
}
.detail-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 12px;
  color: var(--text-secondary, #666666);
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.label {
  font-size: 13px;
  color: var(--text-secondary, #666666);
}
.team-id {
  font-family: monospace;
  font-size: 13px;
  color: var(--primary-color, #667eea);
  font-weight: 600;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fast-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-light, #e5e7eb);
}
.fast-phase {
  font-size: 12px;
  color: var(--primary-color, #667eea);
  font-weight: 600;
}
.fast-cd {
  font-size: 12px;
  color: var(--warning-color, #f0a020);
  font-weight: 600;
}
.logs {
  /* 上面新增了阵容卡片区，日志固定占窗口 38%（最小 260px），可手动拖高 */
  height: 38vh;
  min-height: 260px;
  overflow: auto;
  resize: vertical;
  font-size: 12px;
  line-height: 1.7;
  background: var(--bg-primary, #ffffff);
  border-radius: var(--border-radius-small, 4px);
  padding: 8px;
}
.log {
  display: flex;
  gap: 8px;
  color: var(--text-primary, #333333);
  word-break: break-all;
}
.log .time {
  color: var(--text-tertiary, #999999);
  font-family: monospace;
  flex: 0 0 auto;
}
.log .who {
  color: var(--primary-color, #667eea);
  min-width: 110px;
  flex: 0 0 auto;
}
.log.error .msg {
  color: var(--error-color, #d03050);
}
.log.success .msg {
  color: var(--success-color, #18a058);
}
.log.warning .msg {
  color: var(--warning-color, #f5a623);
}
.log.send .msg {
  color: var(--text-secondary, #666666);
}
.empty {
  color: var(--text-tertiary, #999999);
  font-size: 12px;
}
</style>
