<template>
  <div class="team-status-card">
    <div class="card-header">
      <img
        src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"
        alt="队伍图标"
        class="team-icon"
      />
      <div class="team-info">
        <h3>身份牌</h3>
        <p>当前使用的战斗阵容</p>
      </div>

      <div class="team-selector">
        <button
          v-for="teamId in availableTeams"
          :key="teamId"
          :disabled="loading || switching"
          :class="['team-button', { active: currentTeam === teamId }]"
          @click="selectTeam(teamId)"
        >
          {{ teamId }}
        </button>
        <button
          class="refresh-button"
          :disabled="loading"
          title="刷新队伍数据"
          @click="refreshTeamData(true)"
        >
          <svg
            class="refresh-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          <span class="refresh-text">刷新</span>
        </button>
      </div>
    </div>

    <!-- 角色身份卡区域 -->
    <div
      v-if="roleInfo && Object.keys(roleInfo).length > 0"
      class="role-profile-header"
      :class="rankInfo.class"
    >
      <div class="role-profile-content">
        <!-- 头像区域 -->
        <div class="avatar-container">
          <img
            :src="roleAvatar"
            :alt="roleInfo.name || '角色'"
            class="role-avatar"
            @error="handleAvatarError"
          />
        </div>

        <!-- 角色信息区域 -->
        <div class="role-info-section">
          <div class="role-name">{{ roleInfo.name || "未知角色" }}</div>
          <div class="role-stats">
            <span class="level-text">Lv.{{ roleInfo.level || 1 }}</span>
            <span class="power-value"
              >战力 {{ formatPower(roleInfo.power) }}</span
            >
          </div>
        </div>

        <!-- 段位信息 -->
        <div class="rank-section">
          <div class="rank-icon">{{ rankInfo.icon }}</div>
          <div class="rank-title">{{ rankInfo.title }}</div>
        </div>
      </div>

      <!-- 炫光边框 -->
      <div class="glow-border"></div>
    </div>

    <div class="card-content">
      <div class="team-display">
        <div class="current-team-info">
          <span class="label">当前阵容</span>
          <span class="team-number">
            <template v-if="!loading">阵容 {{ currentTeam }}</template>
            <template v-else>加载中…</template>
          </span>
        </div>

        <div class="heroes-container">
          <div v-if="!loading" class="heroes-inline">
            <div
              v-for="hero in currentTeamHeroes"
              :key="hero.id || hero.name"
              class="hero-item"
            >
              <div class="hero-circle">
                <img
                  v-if="hero.avatar"
                  :src="hero.avatar"
                  :alt="hero.name"
                  class="hero-avatar"
                />
                <div v-else class="hero-placeholder">
                  {{ hero.name?.substring(0, 2) || "?" }}
                </div>
              </div>
              <span class="hero-name">{{ hero.name || "未知" }}</span>
            </div>
          </div>

          <div v-if="!loading && !currentTeamHeroes.length" class="empty-team">
            <p>暂无队伍信息</p>
          </div>

          <div v-if="loading" class="empty-team"><p>正在加载队伍信息…</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { useMessage, NTag } from "naive-ui";
import { HERO_DICT } from "@/utils/HeroList.js";

const tokenStore = useTokenStore();
const message = useMessage();

// 状态
const loading = ref(false);
const switching = ref(false);
const currentTeam = ref(1);
const availableTeams = ref([1, 2, 3, 4]);

// —— 角色身份卡相关状态 ——
// 默认头像列表（当角色头像为空时随机选择）
const defaultAvatars = [
  "/icons/1733492491706148.png",
  "/icons/1733492491706152.png",
  "/icons/1736425783912140.png",
  "/icons/173746572831736.png",
  "/icons/174023274867420.png",
];

const roleAvatar = ref("");
const selectedDefaultAvatar = ref("");

// 战力段位配置
const powerRanks = [
  {
    min: 0,
    max: 1000000,
    title: "初出茅庐",
    description: "初登江湖，尚显青涩。",
    icon: "🌱",
    class: "rank-beginner",
    color: "#6b7280",
  },
  {
    min: 1000000,
    max: 10000000,
    title: "小有名气",
    description: "已有名声，立足江湖。",
    icon: "⚔️",
    class: "rank-known",
    color: "#10b981",
  },
  {
    min: 10000000,
    max: 100000000,
    title: "出入江湖",
    description: "身经百战，渐成人物。",
    icon: "🗡️",
    class: "rank-veteran",
    color: "#3b82f6",
  },
  {
    min: 100000000,
    max: 500000000,
    title: "纵横四方",
    description: "武艺精进，名震一域。",
    icon: "🏹",
    class: "rank-master",
    color: "#8b5cf6",
  },
  {
    min: 500000000,
    max: 2000000000,
    title: "盖世豪杰",
    description: "豪迈英勇，威震四方。",
    icon: "⚡",
    class: "rank-hero",
    color: "#f59e0b",
  },
  {
    min: 2000000000,
    max: 4000000000,
    title: "一方枭雄",
    description: "才智兼备，呼风唤雨。",
    icon: "👑",
    class: "rank-overlord",
    color: "#ef4444",
  },
  {
    min: 4000000000,
    max: 6000000000,
    title: "睥睨江湖",
    description: "实力深不可测，世人仰望。",
    icon: "🔱",
    class: "rank-supreme",
    color: "#ec4899",
  },
  {
    min: 6000000000,
    max: 9000000000,
    title: "独霸天下",
    description: "威势登峰造极，号令天下。",
    icon: "⚜️",
    class: "rank-emperor",
    color: "#dc2626",
  },
  {
    min: 9000000000,
    max: 15000000000,
    title: "不世之尊",
    description: "超凡入圣，江湖传说。",
    icon: "💎",
    class: "rank-legend",
    color: "#7c3aed",
  },
  {
    min: 15000000000,
    max: Infinity,
    title: "无极至尊",
    description: "超越传说，无人能及。",
    icon: "🌟",
    class: "rank-infinite",
    color: "#fbbf24",
  },
];

// WebSocket连接状态
const wsStatus = computed(() => {
  if (!tokenStore.selectedToken) return "disconnected";
  return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
});

// —— 角色身份卡计算属性 ——
// 角色信息计算属性
const roleInfo = computed(() => {
  const gameData = tokenStore.gameData;
  if (gameData && gameData.roleInfo && gameData.roleInfo.role) {
    const role = gameData.roleInfo.role;
    return {
      roleId: role.roleId,
      name: role.name,
      headImg: role.headImg,
      level: role.level,
      power: role.power || role.fighting || 0, // 使用power或fighting字段作为战力
      exp: role.exp,
      vip: role.vip,
      diamond: role.diamond,
      gold: role.gold,
      energy: role.energy,
      maxEnergy: role.maxEnergy,
    };
  }
  return {};
});

// 计算当前段位信息
const rankInfo = computed(() => {
  const power = roleInfo.value.power || 0;
  const rank = powerRanks.find((rank) => power >= rank.min && power < rank.max);
  return rank || powerRanks[0];
});

// 计算下一个段位门槛
const nextRankThreshold = computed(() => {
  const currentRankIndex = powerRanks.findIndex(
    (rank) => rank === rankInfo.value,
  );
  if (currentRankIndex >= 0 && currentRankIndex < powerRanks.length - 1) {
    return powerRanks[currentRankIndex + 1].min;
  }
  return null;
});

// 计算当前段位的进度百分比
const progressPercentage = computed(() => {
  const power = roleInfo.value.power || 0;
  const currentRank = rankInfo.value;

  if (!nextRankThreshold.value) {
    return 100; // 已达最高段位
  }

  const rangeSize = nextRankThreshold.value - currentRank.min;
  const currentProgress = power - currentRank.min;
  const percentage = Math.min(
    100,
    Math.max(0, (currentProgress / rangeSize) * 100),
  );

  return Math.round(percentage);
});

// —— 缓存优先的 presetTeam 原始数据 ——
const presetTeamRaw = computed(() => tokenStore.gameData?.presetTeam ?? null);

// 统一结构：输出 { useTeamId, teams }
function normalizePresetTeam(raw) {
  if (!raw) return { useTeamId: 1, teams: {} };
  const root = raw.presetTeamInfo ?? raw;
  const findUseIdRec = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.useTeamId === "number") return obj.useTeamId;
    for (const k of Object.keys(obj)) {
      const v = findUseIdRec(obj[k]);
      if (v) return v;
    }
    return null;
  };
  const useTeamId =
    root.useTeamId ?? root.presetTeamInfo?.useTeamId ?? findUseIdRec(root) ?? 1;

  const dict = root.presetTeamInfo ?? root;
  const teams = {};
  const ids = Object.keys(dict || {}).filter((k) => /^\d+$/.test(k));
  for (const idStr of ids) {
    const id = Number(idStr);
    const node = dict[idStr];
    if (!node) {
      teams[id] = { teamInfo: {} };
      continue;
    }
    if (node.teamInfo) {
      teams[id] = { teamInfo: node.teamInfo };
    } else if (node.heroes) {
      const ti: Record<string, any> = {};
      node.heroes.forEach((h, idx) => {
        ti[String(idx + 1)] = h;
      });
      teams[id] = { teamInfo: ti };
    } else if (typeof node === "object") {
      const hasHero = Object.values(node).some(
        (v) => v && typeof v === "object" && "heroId" in v,
      );
      teams[id] = { teamInfo: hasHero ? node : {} };
    } else {
      teams[id] = { teamInfo: {} };
    }
  }
  return { useTeamId: Number(useTeamId) || 1, teams };
}

const presetTeam = computed(() => normalizePresetTeam(presetTeamRaw.value));

// —— 英雄列表 ——
const currentTeamHeroes = computed(() => {
  const team = presetTeam.value.teams[currentTeam.value]?.teamInfo;
  if (!team) return [];
  const heroes = [];
  for (const [pos, hero] of Object.entries(team)) {
    const hid = (hero as any)?.heroId ?? (hero as any)?.id;
    if (!hid) continue;
    const meta = HERO_DICT[Number(hid)];
    heroes.push({
      id: Number(hid),
      name: meta?.name ?? `英雄${hid}`,
      type: meta?.type ?? "",
      position: Number(pos),
      level: (hero as any)?.level ?? 1,
      avatar: (hero as any)?.avatar,
    });
  }
  heroes.sort((a, b) => a.position - b.position);
  return heroes;
});

// —— 命令封装 ——
const executeGameCommand = async (
  tokenId,
  cmd,
  params = {},
  description = "",
  timeout = 8000,
) => {
  try {
    return await tokenStore.sendMessageWithPromise(
      tokenId,
      cmd,
      params,
      timeout,
    );
  } catch (error) {
    const msg = error?.message ?? String(error);
    if (description) message.error(`${description}失败：${msg}`);
    throw error;
  }
};

// —— 数据加载：缓存优先，可强制刷新 ——
const getTeamInfoWithCache = async (force = false) => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return null;
  }
  const tokenId = tokenStore.selectedToken.id;

  if (!force) {
    const cached = tokenStore.gameData?.presetTeam?.presetTeamInfo;
    if (cached) return cached;
  }

  loading.value = true;
  try {
    const result = await executeGameCommand(
      tokenId,
      "presetteam_getinfo",
      {},
      "获取阵容信息",
    );
    tokenStore.$patch((state) => {
      state.gameData = { ...(state.gameData ?? {}), presetTeam: result };
    });
    return result?.presetTeamInfo ?? null;
  } catch (error) {
    console.error("获取阵容信息失败:", error);
    return null;
  } finally {
    loading.value = false;
  }
};

// —— UI 同步 ——
const updateAvailableTeams = () => {
  const ids = Object.keys(presetTeam.value.teams)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  availableTeams.value = ids.length ? ids : [1, 2, 3, 4];
};
const updateCurrentTeam = () => {
  currentTeam.value = presetTeam.value.useTeamId || 1;
};

// —— 交互 ——
const selectTeam = async (teamId) => {
  if (switching.value || loading.value) return;
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }
  const prev = currentTeam.value;
  switching.value = true;
  try {
    await executeGameCommand(
      tokenStore.selectedToken.id,
      "presetteam_saveteam",
      { teamId },
      `切换到阵容 ${teamId}`,
    );
    currentTeam.value = teamId;
    message.success(`已切换到阵容 ${teamId}`);
    await refreshTeamData(true);
  } catch (e) {
    currentTeam.value = prev;
  } finally {
    switching.value = false;
  }
};

const refreshTeamData = async (force = false) => {
  await getTeamInfoWithCache(force);
};

// —— 角色身份卡方法 ——
// 格式化战力数值
const formatPower = (power) => {
  if (!power || power === 0) return "0";

  const yi = 100000000; // 1亿
  const wan = 10000; // 1万

  if (power >= yi) {
    const value = (power / yi).toFixed(1);
    return `${value}亿`;
  } else if (power >= wan) {
    const value = (power / wan).toFixed(1);
    return `${value}万`;
  } else {
    return power.toLocaleString();
  }
};

// 头像处理
const initializeAvatar = () => {
  if (roleInfo.value.headImg) {
    roleAvatar.value = roleInfo.value.headImg;
  } else {
    // 如果没有头像，生成一个稳定的随机头像
    if (!selectedDefaultAvatar.value) {
      const roleId = roleInfo.value.roleId || roleInfo.value.name || "default";
      const hash = Array.from(roleId.toString()).reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      const index = hash % defaultAvatars.length;
      selectedDefaultAvatar.value = defaultAvatars[index];
    }
    roleAvatar.value = selectedDefaultAvatar.value;
  }
};

// 头像加载失败处理
const handleAvatarError = () => {
  if (!selectedDefaultAvatar.value) {
    const index = Math.floor(Math.random() * defaultAvatars.length);
    selectedDefaultAvatar.value = defaultAvatars[index];
  }
  roleAvatar.value = selectedDefaultAvatar.value;
};

// —— 首次挂载：检查连接状态后获取数据 ——
onMounted(async () => {
  // 初始化角色头像
  initializeAvatar();

  // 组件挂载时获取队伍信息和角色信息
  if (tokenStore.selectedToken && wsStatus.value === "connected") {
    // 优先获取角色信息
    try {
      await tokenStore.sendMessage(
        tokenStore.selectedToken.id,
        "role_getroleinfo",
      );
    } catch (error) {
      console.warn("获取角色信息失败:", error);
    }

    await refreshTeamData(false);
    updateAvailableTeams();
    updateCurrentTeam();
    if (!presetTeamRaw.value) {
      await refreshTeamData(true);
      updateAvailableTeams();
      updateCurrentTeam();
    }
  }
});

// —— 监听WebSocket连接状态变化 ——
watch(wsStatus, (newStatus, oldStatus) => {
  if (
    newStatus === "connected" &&
    oldStatus !== "connected" &&
    tokenStore.selectedToken
  ) {
    // 延迟一点时间让WebSocket完全就绪
    setTimeout(async () => {
      await refreshTeamData(false);
      updateAvailableTeams();
      updateCurrentTeam();
      if (!presetTeamRaw.value) {
        await refreshTeamData(true);
        updateAvailableTeams();
        updateCurrentTeam();
      }
    }, 1000);
  }
});

// —— 监听Token变化 ——
watch(
  () => tokenStore.selectedToken,
  async (newToken, oldToken) => {
    if (newToken && newToken.id !== oldToken?.id) {
      // Token切换，刷新队伍信息
      // 检查WebSocket是否已连接
      const status = tokenStore.getWebSocketStatus(newToken.id);
      if (status === "connected") {
        await refreshTeamData(true); // 切换Token时强制刷新
        updateAvailableTeams();
        updateCurrentTeam();
      }
    }
  },
);

// —— 监听缓存变化（其他地方写入也能联动） ——
watch(
  () => presetTeamRaw.value,
  () => {
    updateAvailableTeams();
    updateCurrentTeam();
  },
  { deep: true },
);

// —— 监听角色信息变化 ——
watch(() => roleInfo.value, initializeAvatar, { deep: true, immediate: true });
</script>

<style scoped lang="scss">
.team-status-card {
  position: relative;
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);

    .glow-border {
      opacity: 1;
    }
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.team-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}
.team-info {
  flex: 1;
  h3 {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }
  p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }
}
.team-selector {
  display: flex;
  gap: var(--spacing-xs);
}
.team-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  &:hover {
    background: var(--bg-secondary);
  }
  &.active {
    background: var(--primary-color);
    color: white;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);

  &:hover {
    background: var(--bg-secondary, #f9fafb);
    border-color: var(--border-hover, #d1d5db);
    color: var(--text-primary, #374151);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;

    &:hover {
      background: var(--bg-primary, #ffffff);
      border-color: var(--border-color, #e5e7eb);
      color: var(--text-secondary, #6b7280);
      transform: none;
      box-shadow: none;
    }
  }

  .refresh-icon {
    width: 14px;
    height: 14px;
    transition: transform var(--transition-fast, 0.15s ease);
  }

  &:not(:disabled):hover .refresh-icon {
    transform: rotate(180deg);
  }

  &:disabled .refresh-icon {
    animation: spin 1s linear infinite;
  }

  .refresh-text {
    font-size: 13px;
    line-height: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.card-content .current-team-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  .label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
  .team-number {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
  }
}
.heroes-container {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heroes-inline {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 50px;
}

.hero-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--border-light);
  background: var(--bg-primary);
}

.hero-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: var(--font-weight-bold);
}

.hero-name {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  font-weight: var(--font-weight-medium);
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-team {
  text-align: center;
  color: var(--text-secondary);
  p {
    margin: 0;
    font-size: var(--font-size-sm);
  }
}
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
  .team-selector {
    justify-content: center;
  }
  .heroes-inline {
    justify-content: center;
    gap: var(--spacing-xs);
  }
  .hero-item {
    min-width: 45px;
  }
  .hero-circle {
    width: 35px;
    height: 35px;
  }
  .hero-name {
    font-size: 10px;
    max-width: 45px;
  }
}

// 角色身份卡区域
.role-profile-header {
  position: relative;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-large);
  background: linear-gradient(
    135deg,
    var(--bg-primary) 0%,
    rgba(102, 126, 234, 0.03) 100%
  );
  overflow: hidden;
}

.role-profile-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  z-index: 3;
  height: 60px;
  min-width: 0; // 确保弹性布局正确工作
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.role-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  object-fit: cover;
  background: var(--bg-tertiary);
}

.role-info-section {
  flex: 1;
  min-width: 0;
  max-width: 180px;
}

.role-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.role-stats {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.level-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  line-height: 1.2;
}

.power-value {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  line-height: 1.2;
  white-space: nowrap;
}

.rank-section {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius-medium);
  backdrop-filter: blur(10px);
  min-width: 90px;
  max-width: 140px;
  white-space: nowrap;
}

.rank-icon {
  font-size: 14px;
  line-height: 1;
}

.rank-title {
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: visible;
  line-height: 1.2;
}

// 炫光边框
.glow-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(102, 126, 234, 0.4),
    rgba(118, 75, 162, 0.4),
    rgba(254, 202, 87, 0.4),
    rgba(102, 126, 234, 0.4)
  );
  background-size: 300% 300%;
  border-radius: var(--border-radius-large);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
  animation: glowAnimation 3s ease-in-out infinite;

  &::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: var(--bg-primary);
    border-radius: calc(var(--border-radius-large) - 2px);
    z-index: 2;
  }
}

@keyframes glowAnimation {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

// 段位特定样式
.rank-beginner {
  .role-profile-header {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  }
}

.rank-known {
  .role-profile-header {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  }
}

.rank-veteran {
  .role-profile-header {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  }
}

.rank-master {
  .role-profile-header {
    background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
  }
}

.rank-hero {
  .role-profile-header {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  }
}

.rank-overlord {
  .role-profile-header {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  }
}

.rank-supreme {
  .role-profile-header {
    background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  }
}

.rank-emperor {
  .role-profile-header {
    background: linear-gradient(135deg, #fee2e2 0%, #dc2626 20%);
  }
}

.rank-legend {
  .role-profile-header {
    background: linear-gradient(135deg, #ede9fe 0%, #7c3aed 30%);
  }
}

.rank-infinite {
  .role-profile-header {
    background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 30%, #f59e0b 100%);
    animation: shimmer 3s ease-in-out infinite;
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// 深色主题优化
[data-theme="dark"] .team-status-card {
  .role-profile-header {
    background: linear-gradient(
      135deg,
      var(--bg-secondary) 0%,
      rgba(102, 126, 234, 0.08) 100%
    );
  }

  .role-name {
    color: #ffffff;
  }

  .level-text {
    color: rgba(255, 255, 255, 0.7);
  }

  .power-value {
    color: #60a5fa;
  }

  .rank-title {
    color: #ffffff;
  }

  .rank-section {
    background: rgba(255, 255, 255, 0.05);
  }

  // 深色主题段位背景优化
  &.rank-beginner .role-profile-header {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  }

  &.rank-known .role-profile-header {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  }

  &.rank-veteran .role-profile-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
  }

  &.rank-master .role-profile-header {
    background: linear-gradient(135deg, #581c87 0%, #6b21a8 100%);
  }

  &.rank-hero .role-profile-header {
    background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
  }

  &.rank-overlord .role-profile-header {
    background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
  }

  &.rank-supreme .role-profile-header {
    background: linear-gradient(135deg, #be185d 0%, #db2777 100%);
  }

  &.rank-emperor .role-profile-header {
    background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%);
  }

  &.rank-legend .role-profile-header {
    background: linear-gradient(135deg, #581c87 0%, #6b21a8 100%);
  }

  &.rank-infinite .role-profile-header {
    background: linear-gradient(135deg, #92400e 0%, #d97706 50%, #f59e0b 100%);
  }
}

@media (max-width: 768px) {
  .role-profile-content {
    gap: var(--spacing-xs);
    height: 50px;
  }

  .role-avatar {
    width: 40px;
    height: 40px;
  }

  .role-info-section {
    max-width: 120px;
  }

  .role-name {
    font-size: 12px;
  }

  .level-text,
  .power-value {
    font-size: 10px;
  }

  .rank-section {
    max-width: 70px;
    padding: 2px 6px;
  }

  .rank-title {
    font-size: 10px;
  }
}
</style>
