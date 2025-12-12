<template>
    <div v-if="embedded" class="identity-embedded">
        <div class="identity-card embedded">
            <div class="card-header">
                <img src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png" alt="身份牌" class="icon" />
                <div class="info">
                    <h3>身份牌</h3>
                    <p>角色与资源概览</p>
                </div>
            </div>

            <div v-if="hasRole" class="role-profile-header" :class="rankInfo?.class">
                <div class="role-profile-content">
                    <div class="avatar-container">
                        <img :src="roleAvatar" :alt="roleInfo.name || '角色'" class="role-avatar" @error="handleAvatarError" />
                    </div>
                    <div class="role-info-section">
                        <div class="role-name">{{ roleInfo.name || "未知角色" }}</div>
                        <div class="role-stats">
                            <span class="level-text">Lv.{{ roleInfo.level || 1 }}</span>
                            <span class="power-value">战力 {{ formatPower(roleInfo.power) }}</span>
                        </div>
                    </div>
                    <div class="rank-section">
                        <div class="rank-icon">{{ rankInfo?.icon }}</div>
                        <div class="rank-title">{{ rankInfo?.title }}</div>
                    </div>
                </div>
            </div>

            <div class="resources" :class="{ collapsed: !isExpanded }" v-if="hasRole">
                <div v-for="res in resList" :key="res.label" class="res-item">
                    <span class="label">{{ res.label }}</span>
                    <span class="value">{{ res.value }}</span>
                </div>
            </div>
            <div v-if="hasRole && showExpand" class="resources-toggle">
                <n-button text @click="isExpanded = !isExpanded">
                    {{ isExpanded ? "收起" : "展开全部" }}
                </n-button>
            </div>
            <div v-else class="loading">正在获取角色信息...</div>
        </div>
    </div>
    <transition v-else name="drop">
        <div v-show="visible" class="identity-overlay" @click.self="emit('close')">
            <div class="identity-card">
                <div class="strap">
                    <div class="strap-tape"></div>
                    <div class="strap-buckle"></div>
                </div>
                <div class="card-header">
                    <img src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png" alt="身份牌" class="icon" />
                    <div class="info">
                        <h3>身份牌</h3>
                        <p>角色与战力概览</p>
                    </div>
                    <button class="close-btn" @click="emit('close')">✕</button>
                </div>
                <div v-if="hasRole" class="role-profile-header" :class="rankInfo?.class">
                    <div class="role-profile-content">
                        <div class="avatar-container">
                            <img :src="roleAvatar" :alt="roleInfo.name || '角色'" class="role-avatar" @error="handleAvatarError" />
                        </div>
                        <div class="role-info-section">
                            <div class="role-name">{{ roleInfo.name || "未知角色" }}</div>
                            <div class="role-stats">
                                <span class="level-text">Lv.{{ roleInfo.level || 1 }}</span>
                                <span class="power-value">战力 {{ formatPower(roleInfo.power) }}</span>
                            </div>
                        </div>
                        <div class="rank-section">
                            <div class="rank-icon">{{ rankInfo?.icon }}</div>
                            <div class="rank-title">{{ rankInfo?.title }}</div>
                        </div>
                    </div>
                    <div class="glow-border" />
                </div>
                <div v-else class="loading">正在获取角色信息...</div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";

const tokenStore = useTokenStore();

const props = defineProps<{ visible?: boolean; embedded?: boolean }>();
const emit = defineEmits(["close"]);
const isExpanded = ref(false);

const wsStatus = computed(() => {
    if (!tokenStore.selectedToken) return "disconnected";
    return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
});

const roleInfo = computed(() => {
    const gameData = tokenStore.gameData as any;
    const role = gameData?.roleInfo?.role;
    if (!role) return {};
    return {
        roleId: role.roleId,
        name: role.name,
        headImg: role.headImg,
        level: role.level,
        power: role.power || role.fighting || 0,
        gold: role.gold ?? 0,
        diamond: role.diamond ?? 0,
        fishing: role.fishing || role.fish || null,
        items: role.items || role.itemList || role.bag?.items || role.inventory || null,
    };
});

const hasRole = computed(() => Object.keys(roleInfo.value || {}).length > 0);

const defaultAvatars = [
    "/icons/1733492491706148.png",
    "/icons/1733492491706152.png",
    "/icons/1736425783912140.png",
    "/icons/173746572831736.png",
    "/icons/174023274867420.png",
];
const roleAvatar = ref("");
const selectedDefaultAvatar = ref("");

const powerRanks = [
    { min: 0, max: 1_000_000, title: "初出茅庐", icon: "🌱", class: "rank-beginner" },
    { min: 1_000_000, max: 10_000_000, title: "小有名气", icon: "⚔️", class: "rank-known" },
    { min: 10_000_000, max: 100_000_000, title: "出入江湖", icon: "🗡️", class: "rank-veteran" },
    { min: 100_000_000, max: 500_000_000, title: "纵横四方", icon: "🏹", class: "rank-master" },
    { min: 500_000_000, max: 2_000_000_000, title: "盖世豪杰", icon: "⚡", class: "rank-hero" },
    { min: 2_000_000_000, max: 4_000_000_000, title: "一方枭雄", icon: "👑", class: "rank-overlord" },
    { min: 4_000_000_000, max: 6_000_000_000, title: "睥睨江湖", icon: "🔱", class: "rank-supreme" },
    { min: 6_000_000_000, max: 9_000_000_000, title: "独霸天下", icon: "⚜️", class: "rank-emperor" },
    { min: 9_000_000_000, max: 15_000_000_000, title: "不世之尊", icon: "💎", class: "rank-legend" },
    { min: 15_000_000_000, max: Infinity, title: "无极至尊", icon: "🌟", class: "rank-infinite" },
];

const rankInfo = computed(() => {
    const power = Number(roleInfo.value.power || 0);
    return powerRanks.find(r => power >= r.min && power < r.max) || powerRanks[0];
});

const formatPower = (power: number) => {
    if (!power) return "0";
    const yi = 100_000_000;
    const wan = 10_000;
    if (power >= yi) return (power / yi).toFixed(1) + "亿";
    if (power >= wan) return (power / wan).toFixed(1) + "万";
    return power.toLocaleString();
};

const formatNumber = (num: number) => {
    const n = Number(num || 0);
    const yi = 100_000_000;
    const wan = 10_000;
    if (n >= yi) return (n / yi).toFixed(1) + "亿";
    if (n >= wan) return (n / wan).toFixed(1) + "万";
    return n.toLocaleString();
};

const gold = computed(() => (roleInfo.value as any).gold ?? 0);
const diamond = computed(() => (roleInfo.value as any).diamond ?? 0);

// ——— 从 items 中解析数量（优先）———
const getItemCount = (items: any, id: number): number | null => {
    if (!items) return null;
    // 数组结构：[{id/ itemId, num/count/quantity}, ...]
    if (Array.isArray(items)) {
        const found = items.find(it => Number((it as any).id ?? (it as any).itemId) === id);
        if (!found) return 0;
        return Number((found as any).num ?? (found as any).count ?? (found as any).quantity ?? 0);
    }
    // 对象结构：{ '1011': 3 } 或 { '1011': { num:3 } }
    const node = (items as any)[String(id)] ?? (items as any)[id];
    if (node == null) {
        // 兼容值对象中含有 itemId/quantity 的结构：{ '2001': { itemId: 2001, quantity: 6821 } } 或 { 'X': { itemId: 2001 } }
        const match = Object.values(items as any).find((v: any) => Number(v?.itemId ?? v?.id) === id);
        if (match) return Number((match as any).num ?? (match as any).count ?? (match as any).quantity ?? 0);
        return 0;
    }
    if (typeof node === "number") return Number(node);
    if (typeof node === "object") return Number((node as any).num ?? (node as any).count ?? (node as any).quantity ?? 0);
    return Number(node) || 0;
};

const items = computed(() => {
    return (roleInfo.value as any).items;
});

// 参考表：1011 普通鱼竿，1012 金鱼竿；补充：1013 珍珠、1001 招募令、1006 精铁、1023 彩玉、1003 进阶石、1017复活丹
const normalRodFromItems = computed(() => getItemCount(items.value, 1011));
const goldRodFromItems = computed(() => getItemCount(items.value, 1012));
const pearlFromItems = computed(() => getItemCount(items.value, 1013));
const recruitFromItems = computed(() => getItemCount(items.value, 1001));
const ironFromItems = computed(() => getItemCount(items.value, 1006));
const jadeFromItems = computed(() => getItemCount(items.value, 1023));
const advanceStoneFromItems = computed(() => getItemCount(items.value, 1003));
const DanFromItems = computed(() => getItemCount(items.value, 1017));
//10002蓝玉 10003红玉 10101四圣碎片
const blueJadeFromItems = computed(() => getItemCount(items.value, 10002));
const redJadeFromItems = computed(() => getItemCount(items.value, 10003));
const fourSaintFragmentFromItems = computed(() => getItemCount(items.value, 10101));

// 兼容旧字段（fishing.*）作为回退
const normalRod = computed(() => {
    const fromItems = normalRodFromItems.value;
    if (fromItems !== null && fromItems !== undefined) return fromItems;
    return (roleInfo.value as any)?.fishing?.normalRod ?? (roleInfo.value as any)?.fishing?.rod ?? null;
});
const goldRod = computed(() => {
    const fromItems = goldRodFromItems.value;
    if (fromItems !== null && fromItems !== undefined) return fromItems;
    return (roleInfo.value as any)?.fishing?.goldRod ?? (roleInfo.value as any)?.fishing?.vipRod ?? null;
});
const display = (n: number | null | undefined) => (n == null ? "-" : formatNumber(Number(n)));
const resList = computed(() => [
    { label: "金币", value: formatNumber(gold.value) },
    { label: "金砖", value: formatNumber(diamond.value) },
    { label: "普通鱼竿", value: display(normalRod.value as any) },
    { label: "金鱼竿", value: display(goldRod.value as any) },
    { label: "珍珠", value: display(pearlFromItems.value as any) },
    { label: "复活丹", value: display(DanFromItems.value as any) },
    { label: "招募令", value: display(recruitFromItems.value as any) },
    { label: "精铁", value: display(ironFromItems.value as any) },
    { label: "彩玉", value: display(jadeFromItems.value as any) },
    { label: "进阶石", value: display(advanceStoneFromItems.value as any) },
    { label: "蓝玉", value: display(blueJadeFromItems.value as any) },
    { label: "红玉", value: display(redJadeFromItems.value as any) },
    { label: "四圣碎片", value: display(fourSaintFragmentFromItems.value as any) },
]);

const showExpand = computed(() => resList.value.length > 6);

const initializeAvatar = () => {
    if (roleInfo.value && (roleInfo.value as any).headImg) {
        roleAvatar.value = (roleInfo.value as any).headImg;
    } else {
        if (!selectedDefaultAvatar.value) {
            const key = (roleInfo.value as any).roleId || (roleInfo.value as any).name || "default";
            const hash = Array.from(String(key)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            selectedDefaultAvatar.value = defaultAvatars[hash % defaultAvatars.length]!;
        }
        roleAvatar.value = selectedDefaultAvatar.value;
    }
};

const handleAvatarError = () => {
    if (!selectedDefaultAvatar.value) {
        const idx = Math.floor(Math.random() * defaultAvatars.length);
        selectedDefaultAvatar.value = defaultAvatars[idx] || defaultAvatars[0]!;
    }
    roleAvatar.value = selectedDefaultAvatar.value;
};

onMounted(async () => {
    initializeAvatar();
    if (tokenStore.selectedToken && wsStatus.value === "connected") {
        try {
            await tokenStore.sendMessage(tokenStore.selectedToken.id, "role_getroleinfo");
        } catch {}
    }
});

watch(() => roleInfo.value, initializeAvatar, { deep: true });
</script>

<style scoped lang="scss">
.loading {
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    height: 80px;
    line-height: 80px;
}

.identity-embedded {
    grid-column: 1 / -1;
}

.identity-card.embedded {
    width: 100%;
    position: relative;
    background: linear-gradient(180deg, var(--bg-primary), var(--bg-secondary));
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-lg);
    box-shadow: none;
    border: 1px solid var(--border-light);
}

.identity-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: transparent;
}

.identity-card {
    position: fixed;
    top: 0;
    width: 360px;
    background: var(--bg-primary);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-lg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 下落动画 */
.drop-enter-from .identity-card {
    transform: translateY(-120%);
}

.drop-enter-active .identity-card,
.drop-leave-active .identity-card {
    transition: transform 0.35s ease;
}

.drop-enter-to .identity-card {
    transform: translateY(0);
}

.drop-leave-to .identity-card {
    transform: translateY(-120%);
}

.strap {
    position: absolute;
    top: -64px;
    right: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.strap-tape {
    width: 22px;
    height: 56px;
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
    border-radius: 6px;
    box-shadow: inset 0 -4px rgba(0, 0, 0, 0.15);
}

.strap-buckle {
    width: 36px;
    height: 18px;
    background: #6b4f2a;
    border-radius: 9px;
    box-shadow: inset 0 -2px rgba(0, 0, 0, 0.2);
}

.card-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

.icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
}

.info h3 {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
}

.info p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.close-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--text-secondary);
}

.role-profile-header {
    position: relative;
    border-radius: var(--border-radius-large);
    padding: 16px;
    overflow: hidden;
}

.role-profile-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 3;
}

.avatar-container {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
}

.role-avatar {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.6);
}

.role-name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-md);
}

.role-stats {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    display: flex;
    gap: 12px;
}

.rank-section {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}

.rank-icon {
    font-size: 14px;
}

.rank-title {
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
}

@media (max-width: 768px) {
    .card-header {
        justify-content: center;
        text-align: center;
    }

    .role-profile-content {
        justify-content: center;
        flex-wrap: wrap;
        text-align: center;
    }

    .rank-section {
        margin-left: 0;
        justify-content: center;
    }
}

.glow-border {
    position: absolute;
    inset: 0;
    border-radius: var(--border-radius-large);
    background: linear-gradient(45deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4), rgba(254, 202, 87, 0.4), rgba(102, 126, 234, 0.4));
    background-size: 300% 300%;
    opacity: 0.6;
    z-index: 1;
    animation: glowAnimation 6s ease-in-out infinite;
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

.rank-beginner .role-profile-header {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.rank-known .role-profile-header {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.rank-veteran .role-profile-header {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.rank-master .role-profile-header {
    background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
}

.rank-hero .role-profile-header {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.rank-overlord .role-profile-header {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.rank-supreme .role-profile-header {
    background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
}

.rank-emperor .role-profile-header {
    background: linear-gradient(135deg, #fee2e2 0%, #dc2626 20%);
}

.rank-legend .role-profile-header {
    background: linear-gradient(135deg, #ede9fe 0%, #7c3aed 30%);
}

.rank-infinite .role-profile-header {
    background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 30%, #f59e0b 100%);
}

.resources {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    margin-top: 10px;
    --res-item-height: 44px;
}

.resources.collapsed {
    max-height: calc((var(--res-item-height) + 8px) * 2 + 8px);
    overflow: hidden;
}

.res-item {
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: 10px;
    padding: 8px 10px;
    min-height: var(--res-item-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.resources-toggle {
    margin-top: var(--spacing-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
}

.res-item .label {
    color: var(--text-secondary);
    font-size: 12px;
}

.res-item .value {
    font-weight: var(--font-weight-semibold);
}
</style>
