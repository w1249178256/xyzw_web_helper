<template>
  <MyCard class="monthly-tasks" :statusClass="monthActivity ? 'active' : ''">
    <template #icon>
      <img src="/icons/1736425783912140.png" alt="月度任务" />
    </template>
    <template #title>
      <h3>月度任务</h3>
      <p>进度与一键补齐</p>
    </template>
    <template #badge>
      <span v-if="remainingDays > 0">剩余 {{ remainingDays }} 天</span>
      <span v-else>本月最后一天</span>
    </template>
    <template #default>
      <div class="monthly-row">
        <div class="row-title">钓鱼进度</div>
        <div class="row-value">
          {{ fishNum }} / {{ FISH_TARGET }}（{{ fishPercent }}%）
        </div>
      </div>
      <div class="monthly-row">
        <div class="row-title">竞技场进度</div>
        <div class="row-value">
          {{ arenaNum }} / {{ ARENA_TARGET }}（{{ arenaPercent }}%）
          <span v-if="!isArenaActivityOpen" class="status-indicator closed">(当前未在开放时间)</span>
        </div>
      </div>
      <div class="action-row">
        <button
          class="action-button secondary"
          :disabled="monthLoading || fishToppingUp || arenaToppingUp"
          @click="fetchMonthlyActivity"
        >
          {{ monthLoading ? "刷新中..." : "刷新进度" }}
        </button>

        <n-button-group>
          <n-button
            class="action-button"
            :disabled="monthLoading || fishToppingUp"
            @click="topUpMonthly('fish')"
          >
            {{ fishToppingUp ? "补齐中..." : "钓鱼补齐" }}
          </n-button>
          <n-dropdown
            :options="fishMoreOptions"
            trigger="click"
            @select="onFishMoreSelect"
          >
            <n-button :disabled="monthLoading || fishToppingUp">▾</n-button>
          </n-dropdown>
        </n-button-group>

        <n-button-group>
          <n-button
            class="action-button"
            :disabled="monthLoading || arenaToppingUp || !isArenaActivityOpen"
            @click="topUpMonthly('arena')"
          >
            {{ arenaToppingUp ? "补齐中..." : "竞技场补齐" }}
          </n-button>
          <n-dropdown
            :options="arenaMoreOptions"
            trigger="click"
            @select="onArenaMoreSelect"
          >
            <n-button :disabled="monthLoading || arenaToppingUp || !isArenaActivityOpen">▾</n-button>
          </n-dropdown>
        </n-button-group>
      </div>
      <p class="description muted">
        补齐规则：让“当前天数比例”和“完成比例”一致；若无剩余天数则按满额（{{
          FISH_TARGET
        }}/{{ ARENA_TARGET }}）计算。
      </p>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import MyCard from "../Common/MyCard.vue";

const tokenStore = useTokenStore();
const message = useMessage();

const FISH_TARGET = 320;
const ARENA_TARGET = 240;

const monthLoading = ref(false);
const fishToppingUp = ref(false);
const arenaToppingUp = ref(false);
const monthActivity = ref(null);

const now = new Date();
const daysInMonth = new Date(
  now.getFullYear(),
  now.getMonth() + 1,
  0,
).getDate();
const dayOfMonth = now.getDate();
const remainingDays = computed(() => Math.max(0, daysInMonth - dayOfMonth));
const monthProgress = computed(() =>
  Math.min(1, Math.max(0, dayOfMonth / daysInMonth)),
);

const myMonthInfo = computed(() => monthActivity.value?.myMonthInfo || {});
const myArenaInfo = computed(() => monthActivity.value?.myArenaInfo || {});

const fishNum = computed(() => Number(myMonthInfo.value?.["2"]?.num || 0));
const arenaNum = computed(() => Number(myArenaInfo.value?.num || 0));
const fishPercent = computed(() =>
  Math.min(100, Math.round((fishNum.value / FISH_TARGET) * 100)),
);
const arenaPercent = computed(() =>
  Math.min(100, Math.round((arenaNum.value / ARENA_TARGET) * 100)),
);

const fishShouldBe = computed(() =>
  remainingDays.value === 0
    ? FISH_TARGET
    : Math.min(FISH_TARGET, Math.ceil(monthProgress.value * FISH_TARGET)),
);
const arenaShouldBe = computed(() =>
  remainingDays.value === 0
    ? ARENA_TARGET
    : Math.min(ARENA_TARGET, Math.ceil(monthProgress.value * ARENA_TARGET)),
);

const fishMoreOptions = [{ label: "一键完成", key: "complete-fish" }];
const arenaMoreOptions = [{ label: "一键完成", key: "complete-arena" }];

const isConnected = computed(() => {
  if (!tokenStore.selectedToken) return false;
  return (
    tokenStore.getWebSocketStatus(tokenStore.selectedToken.id) === "connected"
  );
});

const isArenaActivityOpen = computed(() => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 22;
});

const fetchMonthlyActivity = async () => {
  if (!tokenStore.selectedToken) return message.warning("请先选择Token");
  if (!isConnected.value) return;
  monthLoading.value = true;
  try {
    const tokenId = tokenStore.selectedToken.id;
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "activity_get",
      {},
      10000,
    );
    const act = result?.activity || result?.body?.activity || result;
    monthActivity.value = act || null;
    if (act) message.success("月度任务进度已更新");
  } catch (e) {
    message.error(`获取月度任务失败：${e.message}`);
  } finally {
    monthLoading.value = false;
  }
};

const getTodayStartSec = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};
const isTodayAvailable = (lastTimeSec) => {
  if (!lastTimeSec || typeof lastTimeSec !== "number") return true;
  return lastTimeSec < getTodayStartSec();
};

const topUpMonthly = (type) => {
  const isFish = type === "fish";
  const target = isFish ? FISH_TARGET : ARENA_TARGET;
  const current = isFish ? fishNum.value : arenaNum.value;
  const shouldBe = isFish ? fishShouldBe.value : arenaShouldBe.value;
  const need = Math.max(0, shouldBe - current);
  if (need <= 0) return message.success("当前进度已达标，无需补齐");
  return isFish
    ? autoTopUpFish(need, shouldBe, target)
    : autoTopUpArena(need, shouldBe, target);
};

const completeMonthly = (type) => {
  const isFish = type === "fish";
  const target = isFish ? FISH_TARGET : ARENA_TARGET;
  const current = isFish ? fishNum.value : arenaNum.value;
  const need = Math.max(0, target - current);
  if (need <= 0) return message.success("已满额，无需完成");
  return isFish
    ? autoTopUpFish(need, target, target)
    : autoTopUpArena(need, target, target);
};

const onFishMoreSelect = (key) => {
  if (key === "complete-fish") completeMonthly("fish");
};
const onArenaMoreSelect = (key) => {
  if (key === "complete-arena") completeMonthly("arena");
};

const autoTopUpFish = async (need, shouldBe, target) => {
  if (!tokenStore.selectedToken) return message.warning("请先选择Token");
  if (!isConnected.value) return message.warning("请先建立WS连接");
  fishToppingUp.value = true;
  try {
    const tokenId = tokenStore.selectedToken.id;
    let role = tokenStore.gameData?.roleInfo?.role;
    if (!role) {
      try {
        await tokenStore.sendGetRoleInfo(tokenId);
      } catch {}
      role = tokenStore.gameData?.roleInfo?.role;
    }
    let freeUsed = 0;
    const lastFreeTime = Number(
      role?.statisticsTime?.["artifact:normal:lottery:time"] || 0,
    );
    if (isTodayAvailable(lastFreeTime)) {
      message.info("检测到今日免费钓鱼次数，开始消耗 3 次");
      for (let i = 0; i < 3; i++) {
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "artifact_lottery",
            { lotteryNumber: 1, newFree: true, type: 1 },
            8000,
          );
          freeUsed++;
          await new Promise((r) => setTimeout(r, 500));
        } catch {
          break;
        }
      }
      if (freeUsed > 0) await fetchMonthlyActivity();
    }
    let remaining = Math.max(0, shouldBe - fishNum.value);
    if (remaining <= 0) return message.success("已通过免费次数完成当日目标");
    message.info(`开始付费钓鱼补齐：共需 ${remaining} 次（每次最多10）`);
    while (remaining > 0) {
      const batch = Math.min(10, remaining);
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "artifact_lottery",
          { lotteryNumber: batch, newFree: true, type: 1 },
          12000,
        );
      } catch (e) {
        message.error(`钓鱼失败：${e.message}`);
        break;
      }
      remaining -= batch;
      await new Promise((r) => setTimeout(r, 800));
    }
    await fetchMonthlyActivity();
    if (fishNum.value >= shouldBe || fishNum.value >= target)
      message.success("钓鱼补齐完成");
    else message.warning("钓鱼补齐已停止，未达到目标");
  } finally {
    fishToppingUp.value = false;
  }
};

const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0];

  if (candidate?.roleId) return candidate.roleId;
  if (candidate?.id) return candidate.id;
  return targets?.roleId || targets?.id;
};

const autoTopUpArena = async (need, shouldBe, target) => {
  if (!tokenStore.selectedToken) return message.warning("请先选择Token");
  if (!isConnected.value) return message.warning("请先建立WS连接");
  if (!isArenaActivityOpen.value) return message.warning("竞技场活动已关闭，请在 6:00-22:00 时间段内操作");
  arenaToppingUp.value = true;
  try {
    const tokenId = tokenStore.selectedToken.id;
    try {
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "arena_startarea",
        {},
        6000,
      );
    } catch {}
    let safetyCounter = 0;
    const safetyMaxFights = 100;
    let round = 1;
    let remaining = need;
    while (remaining > 0 && safetyCounter < safetyMaxFights) {
      const planFights = Math.ceil(remaining / 2);
      message.info(
        `竞技场补齐 第${round}轮：计划战斗 ${planFights} 场（估算每胜+2）`,
      );
      for (let i = 0; i < planFights && safetyCounter < safetyMaxFights; i++) {
        let targets;
        try {
          targets = await tokenStore.sendMessageWithPromise(
            tokenId,
            "arena_getareatarget",
            {},
            8000,
          );
        } catch (err) {
          message.error(`获取竞技场目标失败：${err.message}`);
          break;
        }

        console.info("[Arena] 获取竞技场目标响应", targets);
        const targetId = pickArenaTargetId(targets);
        if (!targetId) {
          message.warning("未找到可用的竞技场目标，已停止此轮");
          break;
        }
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "fight_startareaarena",
            { targetId },
            15000,
          );
        } catch (e) {
          message.error(`竞技场对决失败：${e.message}`);
        }
        safetyCounter++;
        await new Promise((r) => setTimeout(r, 1200));
      }
      await fetchMonthlyActivity();
      remaining = Math.max(0, shouldBe - arenaNum.value);
      round++;
    }
    if (arenaNum.value >= shouldBe || arenaNum.value >= target)
      message.success("竞技场补齐完成");
    else if (safetyCounter >= safetyMaxFights)
      message.warning("达到安全上限，已停止竞技场补齐");
    else message.warning("竞技场补齐已停止，未达到目标");
  } finally {
    arenaToppingUp.value = false;
  }
};

const hasFetchedOnce = ref(false);
watch(
  () =>
    tokenStore.selectedToken
      ? tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
      : "disconnected",
  (status) => {
    if (status === "connected" && !hasFetchedOnce.value) {
      hasFetchedOnce.value = true;
      fetchMonthlyActivity();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (tokenStore.selectedToken && isConnected.value) fetchMonthlyActivity();
});

defineExpose({ fetchMonthlyActivity });
</script>

<style scoped lang="scss">
.monthly-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}
.description.muted {
  color: var(--text-tertiary);
  margin-top: var(--spacing-sm);
}
.action-row {
  display: flex;
  gap: var(--spacing-sm);
  .action-button {
    flex: 1;
  }
}

.action-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--primary-color);
  color: #fff;
  &:hover:not(:disabled) {
    background: var(--primary-color-hover);
    transform: translateY(-1px);
  }
  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
  &.secondary {
    background: var(--secondary-color);
    &:hover:not(:disabled) {
      background: var(--secondary-color-hover);
    }
  }
}

.status-indicator {
  font-size: var(--font-size-xs);
  margin-left: var(--spacing-xs);
  &.open {
    color: var(--success-color, #059669);
  }
  &.closed {
    color: var(--error-color, #dc2626);
  }
}
</style>
