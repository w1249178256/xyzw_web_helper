<template>
  <div class="status-card team-formation-card">
    <div class="card-header">
      <img
        src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"
        alt="阵容"
        class="icon"
      />
      <div class="info">
        <h3>阵容</h3>
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

    <div class="card-content">
      <div class="current-team-info">
        <span class="label">当前阵容</span>
        <span class="team-number">
          <template v-if="!loading">阵容 {{ currentTeam }}</template>
          <template v-else>加载中…</template>
        </span>
      </div>

      <div class="heroes-container">
        <div v-if="!loading" class="heroes-formation">
          <!-- 前排 2个 -->
          <div class="formation-row front-row">
            <div
              v-for="hero in currentTeamHeroes.slice(0, 2)"
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
          <!-- 后排 3个 -->
          <div class="formation-row back-row">
            <div
              v-for="hero in currentTeamHeroes.slice(2)"
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
        </div>

        <div v-if="!loading && !currentTeamHeroes.length" class="empty-team">
          <p>暂无队伍信息</p>
        </div>
        <div v-if="loading" class="empty-team">
          <p>正在加载队伍信息…</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { useMessage } from "naive-ui";
import { HERO_DICT } from "@/utils/HeroList.js";

const tokenStore = useTokenStore();
const message = useMessage();

const loading = ref(false);
const switching = ref(false);
const currentTeam = ref(1);
const availableTeams = ref<number[]>([1, 2, 3, 4]);



const wsStatus = computed(() => {
  if (!tokenStore.selectedToken) return "disconnected";
  return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
});

const presetTeamRaw = computed(() => tokenStore.gameData?.presetTeam ?? null);

function normalizePresetTeam(raw: any) {
  if (!raw)
    return {
      useTeamId: 1,
      teams: {} as Record<number, { teamInfo: Record<string, any> }>,
    };
  const root = raw.presetTeamInfo ?? raw;
  const findUseIdRec = (obj: any): number | null => {
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
  const teams: Record<number, { teamInfo: Record<string, any> }> = {};
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
      node.heroes.forEach((h: any, idx: number) => {
        ti[String(idx + 1)] = h;
      });
      teams[id] = { teamInfo: ti };
    } else if (typeof node === "object") {
      const hasHero = Object.values(node).some(
        (v: any) => v && typeof v === "object" && "heroId" in v,
      );
      teams[id] = { teamInfo: hasHero ? node : {} };
    } else {
      teams[id] = { teamInfo: {} };
    }
  }
  return { useTeamId: Number(useTeamId) || 1, teams };
}

const presetTeam = computed(() => normalizePresetTeam(presetTeamRaw.value));

const currentTeamHeroes = computed(() => {
  const team = (presetTeam.value.teams as any)[currentTeam.value]?.teamInfo;
  console.log("🚀 ~ team:", team);
  if (!team) return [] as any[];
  const heroes: any[] = [];
  for (const [pos, hero] of Object.entries(team)) {
    const hid = (hero as any)?.heroId ?? (hero as any)?.id;
    if (!hid) continue;
    const meta = HERO_DICT[Number(hid)];
    const avatarPath = meta?.avatar;
    const fullAvatarPath = avatarPath
      ? import.meta.env.BASE_URL + avatarPath.replace(/^\//, "")
      : undefined;
    heroes.push({
      id: Number(hid),
      name: meta?.name ?? `英雄${hid}`,
      type: meta?.type ?? "",
      position: Number(pos),
      level: (hero as any)?.level ?? 1,
      avatar: fullAvatarPath,
    });
  }
  heroes.sort((a, b) => a.position - b.position);
  console.log("🚀 ~ heroes:", heroes);
  return heroes;
});

const executeGameCommand = async (
  tokenId: string | number,
  cmd: string,
  params = {},
  description = "",
  timeout = 8000,
) => {
  try {
    return await tokenStore.sendMessageWithPromise(
      String(tokenId),
      cmd,
      params,
      timeout,
    );
  } catch (error: any) {
    if (description)
      message.error(`${description}失败：${error?.message ?? error}`);
    throw error;
  }
};

const getTeamInfoWithCache = async (force = false) => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return null;
  }
  const tokenId = tokenStore.selectedToken.id;
  if (!force) {
    const cached = (tokenStore.gameData as any)?.presetTeam?.presetTeamInfo;
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
    tokenStore.$patch((state: any) => {
      state.gameData = { ...(state.gameData ?? {}), presetTeam: result };
    });
    return result?.presetTeamInfo ?? null;
  } catch (e) {
    console.error("获取阵容信息失败:", e);
    return null;
  } finally {
    loading.value = false;
  }
};

const updateAvailableTeams = () => {
  const ids = Object.keys(presetTeam.value.teams)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  availableTeams.value = ids.length ? ids : [1, 2, 3, 4];
};
const updateCurrentTeam = () => {
  currentTeam.value = (presetTeam.value as any).useTeamId || 1;
};

const selectTeam = async (teamId: number) => {
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

onMounted(async () => {
  if (tokenStore.selectedToken && wsStatus.value === "connected") {
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

watch(wsStatus, (newStatus, oldStatus) => {
  if (
    newStatus === "connected" &&
    oldStatus !== "connected" &&
    tokenStore.selectedToken
  ) {
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

watch(
  () => tokenStore.selectedToken,
  async (newToken, oldToken) => {
    if (newToken && newToken.id !== (oldToken as any)?.id) {
      const status = tokenStore.getWebSocketStatus(newToken.id);
      if (status === "connected") {
        await refreshTeamData(true);
        updateAvailableTeams();
        updateCurrentTeam();
      }
    }
  },
);

watch(
  () => presetTeamRaw.value,
  () => {
    updateAvailableTeams();
    updateCurrentTeam();
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.team-formation-card {
  min-height: 220px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.info h3 {
  margin: 0 0 2px 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
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
}

.team-button:hover {
  background: var(--bg-secondary);
}

.team-button.active {
  background: var(--primary-color);
  color: white;
}

.team-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}

.refresh-button:hover {
  background: var(--bg-secondary, #f9fafb);
  border-color: var(--border-hover, #d1d5db);
  color: var(--text-primary, #374151);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.refresh-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.refresh-icon {
  width: 14px;
  height: 14px;
  transition: transform var(--transition-fast, 0.15s ease);
}

.refresh-button:not(:disabled):hover .refresh-icon {
  transform: rotate(180deg);
}

.refresh-button:disabled .refresh-icon {
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

.card-content .current-team-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.card-content .label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.card-content .team-number {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.heroes-container {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heroes-formation {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: center;
  width: 100%;
}

.formation-row {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  width: 100%;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 64px;
}

.hero-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.hero-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  font-size: 12px;
  color: var(--text-secondary);
}

.hero-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  min-width: 90px;
  max-width: 140px;
  white-space: nowrap;
}

.empty-team {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
    align-items: center;
  }

  .team-selector {
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .heroes-container {
    padding: var(--spacing-sm);
  }

  .heroes-formation {
    gap: var(--spacing-sm);
  }

  .formation-row {
    gap: var(--spacing-sm);
  }

  .hero-item {
    min-width: 45px;
  }

  .hero-circle {
    width: 40px;
    height: 40px;
  }

  .hero-name {
    font-size: 10px;
    min-width: 0;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
