<template>
  <div class="status-card consumption-progress">
    <div class="card-header">
      <div class="header-left">
        <span class="icon">📊</span>
        <span class="title">消耗活动进度</span>
      </div>
    </div>

    <div class="item-header">
      <div class="item-values">
        <div class="current">
          黄金道具数量:{{ ActivityGoldItem }}（还需: {{ remainingGoldNeeded }}）
          获取率:{{ Math.floor((1 / goldRateUsed) * 1000) / 1000 }}
        </div>
        <div class="current">
          普通道具已累计获取: {{ totalObtained }}(剩余:{{ ActivityItem }})
        </div>
        <div class="current">
          还需普通道具(库存 {{ ActivityItem }} 已计入): {{ remainingOrdNeeded }}
        </div>
        <div class="current">
          可行方案:
          <a-button
            type="primary"
            size="small"
            style="margin-left: 8px"
            @click="showCombosModal = true"
            >查看所有可行方案</a-button
          >
        </div>
        <div class="current" v-if="feasibleCombos.length === 0">
          暂无可行组合或已满足目标
        </div>
      </div>
    </div>
    <div class="setting-item">
      <span class="label">使用数量:</span>
      <n-input-number
        v-model:value="Activitynumber"
        :min="1"
        :step="1"
        size="small"
      />
      <a-button
        type="primary"
        size="small"
        :disabled="state.isRunning"
        @click="OpenActivityItem"
        >打开普通道具</a-button
      >
    </div>

    <div class="card-content">
      <div v-if="!hasActivityData" class="empty-state">暂无活动数据</div>
      <div v-else class="progress-list">
        <div v-for="item in progressList" :key="item.id" class="progress-item">
          <div class="item-header">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-values">
              <span class="current">{{ item.current }}</span>
              <span class="separator">/</span>
              <span class="target">{{ item.nextTarget }}</span>
            </span>
          </div>
          <n-progress
            type="line"
            :percentage="item.percentage"
            :color="item.isCompleted ? '#52c41a' : '#1890ff'"
            :rail-color="'rgba(0, 0, 0, 0.06)'"
            :height="8"
            :show-indicator="false"
          />
          <div class="item-footer">
            <span class="next-reward" v-if="!item.isCompleted">
              下一档: {{ item.nextTarget }} (还需
              {{ item.nextTarget - item.current }})
            </span>
            <span class="completed-text" v-else> 已完成所有档位 </span>
            <span class="obtained-items" v-if="item.obtainedItems > 0">
              已获得道具: {{ item.obtainedItems }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <!--显示可行方案-->
    <a-modal
      v-model:visible="showCombosModal"
      width="900px"
      height="600px"
      :footer="false"
    >
      <template #title>
        <h3>所有可行组合（按总普通道具升序）</h3>
      </template>
      <div class="cp-modal-scroll">
        <div v-if="feasibleCombos.length === 0">暂无可行组合或已满足目标</div>
        <div v-else>
          <div
            v-for="(combo, idx) in feasibleCombos"
            :key="idx"
            style="margin-bottom: 12px"
          >
            <div>
              <strong>方案 {{ idx + 1 }} : {{ combo.totalOrd }}档</strong>
            </div>
            <ol>
              <li
                v-for="step in combo.combo"
                :key="step.id + '-' + step.threshold"
              >
                {{ step.name }} -> 达到 {{ step.threshold }} (可得
                {{ step.delta }} 普通道具, 还需消耗 {{ step.cost }})
              </li>
            </ol>
          </div>
        </div>
      </div>
      <template #footer>
        <n-space align="center" justify="end">
          <n-button @click="showCombosModal = false">关闭</n-button>
        </n-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, watchEffect } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";

const tokenStore = useTokenStore();
const message = useMessage();
// 获取活动数据
const fetchActivityData = () => {
  if (tokenStore.selectedToken) {
    tokenStore.sendMessage(tokenStore.selectedToken.id, "activity_get");
  }
};

onMounted(() => {
  fetchActivityData();
});

watch(
  () => tokenStore.selectedToken,
  () => {
    fetchActivityData();
  },
);

const state = ref({
  isRunning: false,
});

const Activitynumber = ref(4);
// 消耗任务ID定义
const ConsumptionTaskID = {
  招募: 1,
  宝箱: 2,
  捕获: 3,
  盐罐: 4,
  金砖: 5,
};

// 任务名称映射
const TaskNames = {
  [ConsumptionTaskID.招募]: "招募",
  [ConsumptionTaskID.宝箱]: "宝箱",
  [ConsumptionTaskID.捕获]: "捕获",
  [ConsumptionTaskID.盐罐]: "盐罐",
  [ConsumptionTaskID.金砖]: "金砖",
};

// 任务档位配置 (参考 ConsumptionTask.ts)
const missionTypes = {
  [ConsumptionTaskID.招募]: [
    { num: 80 },
    { num: 160 },
    { num: 240 },
    { num: 320 },
    { num: 400 },
    { num: 560 },
    { num: 720 },
    { num: 880 },
    { num: 1040 },
    { num: 1200 },
    { num: 1440 },
    { num: 1680 },
    { num: 1920 },
    { num: 2160 },
    { num: 2400 },
    { num: 2720 },
    { num: 3040 },
    { num: 3360 },
    { num: 3680 },
    { num: 4000 },
  ],
  [ConsumptionTaskID.宝箱]: [
    { num: 2000 },
    { num: 4000 },
    { num: 6000 },
    { num: 8000 },
    { num: 10000 },
    { num: 14000 },
    { num: 18000 },
    { num: 22000 },
    { num: 26000 },
    { num: 30000 },
    { num: 36000 },
    { num: 42000 },
    { num: 48000 },
    { num: 54000 },
    { num: 60000 },
    { num: 68000 },
    { num: 76000 },
    { num: 84000 },
    { num: 92000 },
    { num: 100000 },
  ],
  [ConsumptionTaskID.捕获]: [
    { num: 25 },
    { num: 50 },
    { num: 75 },
    { num: 125 },
    { num: 175 },
    { num: 225 },
    { num: 300 },
    { num: 375 },
    { num: 450 },
    { num: 525 },
    { num: 625 },
    { num: 725 },
    { num: 825 },
    { num: 925 },
    { num: 1050 },
    { num: 1175 },
    { num: 1300 },
    { num: 1450 },
    { num: 1600 },
    { num: 1750 },
  ],
  [ConsumptionTaskID.盐罐]: [
    { num: 3 },
    { num: 6 },
    { num: 9 },
    { num: 12 },
    { num: 15 },
    { num: 18 },
    { num: 21 },
    { num: 24 },
    { num: 27 },
    { num: 30 },
    { num: 33 },
    { num: 36 },
    { num: 39 },
    { num: 42 },
    { num: 45 },
    { num: 48 },
    { num: 51 },
    { num: 54 },
    { num: 57 },
    { num: 60 },
  ],
  [ConsumptionTaskID.金砖]: [
    { num: 10000 },
    { num: 20000 },
    { num: 30000 },
    { num: 40000 },
    { num: 50000 },
    { num: 70000 },
    { num: 90000 },
    { num: 110000 },
    { num: 130000 },
    { num: 150000 },
    { num: 180000 },
    { num: 210000 },
    { num: 240000 },
    { num: 270000 },
    { num: 300000 },
    { num: 340000 },
    { num: 380000 },
    { num: 420000 },
    { num: 460000 },
    { num: 500000 },
  ],
};

const rewardConfigs = {
  [ConsumptionTaskID.招募]: [
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 24 },
    { num: 24 },
    { num: 24 },
    { num: 24 },
    { num: 24 },
    { num: 32 },
    { num: 32 },
    { num: 32 },
    { num: 32 },
    { num: 32 },
  ],
  [ConsumptionTaskID.宝箱]: [
    { num: 4 },
    { num: 4 },
    { num: 4 },
    { num: 4 },
    { num: 4 },
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
  ],
  [ConsumptionTaskID.捕获]: [
    { num: 4 },
    { num: 4 },
    { num: 4 },
    { num: 8 },
    { num: 8 },
    { num: 8 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 16 },
    { num: 20 },
    { num: 20 },
    { num: 20 },
    { num: 24 },
    { num: 24 },
    { num: 24 },
  ],
  [ConsumptionTaskID.盐罐]: [
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
    { num: 1 },
  ],
  [ConsumptionTaskID.金砖]: [
    { num: 3 },
    { num: 3 },
    { num: 3 },
    { num: 3 },
    { num: 3 },
    { num: 6 },
    { num: 6 },
    { num: 6 },
    { num: 6 },
    { num: 6 },
    { num: 9 },
    { num: 9 },
    { num: 9 },
    { num: 9 },
    { num: 9 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
    { num: 12 },
  ],
};

// 消耗活动的ID (仅作参考，实际逻辑会自动查找)
const ACTIVITY_ID = 2512261;
const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null);
const ActivityItem = computed(
  () => roleInfo.value?.role?.items?.[5261]?.quantity || 0,
);
const ActivityGoldItem = computed(
  () => roleInfo.value?.role?.items?.[5262]?.quantity || 0,
);
const commonActivityInfo = computed(() => {
  const data = tokenStore.gameData?.commonActivityInfo;
  // 尝试获取活动列表对象，兼容可能的层级结构
  return data?.activity?.commonActivityInfo || data?.commonActivityInfo || {};
});

const hasActivityData = computed(() => {
  console.log("🚀 ~ commonActivityInfo.value:", commonActivityInfo.value);
  if (!commonActivityInfo.value) return false;

  // 查找包含有效任务ID (1-5) 的活动
  return Object.values(commonActivityInfo.value).some((activity) => {
    if (!activity?.task) return false;
    return Object.keys(activity.task).some((key) => {
      const id = Number(key);
      return id >= 1 && id <= 5;
    });
  });
});

const OpenActivityItem = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }
  const tokenId = tokenStore.selectedToken.id;
  state.value.isRunning = true;
  message.info("道具开启中");
  await tokenStore.sendMessageWithPromise(tokenId, "item_openpack", {
    itemId: 5261,
    index: 0,
    number: Activitynumber.value,
  });
  await tokenStore.sendMessage(tokenId, "role_getroleinfo");
  message.success("道具开启完毕");
  state.value.isRunning = false;
};

const progressList = computed(() => {
  if (!commonActivityInfo.value) return [];

  // 查找包含有效任务ID (1-5) 的活动
  const activityData = Object.values(commonActivityInfo.value).find(
    (activity) => {
      if (!activity?.task) return false;
      return Object.keys(activity.task).some((key) => {
        const id = Number(key);
        return id >= 1 && id <= 5;
      });
    },
  );

  if (!activityData) return [];

  const tasks = activityData.task || {};

  // 现在 current 表示已消耗量（不是轮数）。
  // 使用 missionTypes[id] 找到 current 所处的轮次（即 missionTypes 中 num <= current 的数量），
  // 然后按照 rewardConfigs[id] 的逐轮奖励累加前 N 轮的奖励。
  const calcObtainedForTask = (id, consumed) => {
    const rewardCfg = rewardConfigs[id];
    if (!rewardCfg || !rewardCfg.length || !consumed || consumed <= 0) return 0;

    const missionCfg = missionTypes[id] || [];

    // missionCfg 中每一项的 num 表示达到该小轮的累计消耗阈值。
    // 计算已完成的小轮数：missionCfg 中 num <= consumed 的数量
    let completedRounds = 0;
    for (let i = 0; i < missionCfg.length; i++) {
      const threshold = missionCfg[i]?.num || 0;
      if (consumed >= threshold) completedRounds++;
      else break;
    }

    // 累加 rewardCfg 前 completedRounds 项，超出部分使用最后一项补齐
    const len = rewardCfg.length;
    const lastVal = rewardCfg[len - 1]?.num || 0;
    let total = 0;
    for (let i = 0; i < completedRounds; i++) {
      if (i < len) total += rewardCfg[i]?.num || 0;
      else total += lastVal;
    }

    return total;
  };

  return Object.keys(TaskNames).map((key) => {
    const id = Number(key);
    const current = tasks[id] || 0;
    const configs = missionTypes[id] || [];

    // 找到下一个未完成的目标
    let nextTarget = 0;
    let isCompleted = false;

    const nextConfig = configs.find((c) => c.num > current);
    if (nextConfig) {
      nextTarget = nextConfig.num;
    } else {
      // 如果都完成了，取最后一个作为目标
      if (configs.length > 0) {
        nextTarget = configs[configs.length - 1].num;
        isCompleted = true;
      }
    }

    // 计算百分比
    let percentage = 0;
    if (isCompleted) {
      percentage = 100;
    } else if (nextTarget > 0) {
      percentage = Math.min(100, (current / nextTarget) * 100);
    }

    return {
      id,
      name: TaskNames[id],
      current,
      nextTarget,
      percentage,
      isCompleted,
      // 通用计算：若该任务在 rewardConfigs 中有配置，则计算已获得的道具数
      obtainedItems: calcObtainedForTask(id, current),
    };
  });
});

// 控制模态框显示
const showCombosModal = ref(false);

// 所有类别累计已获得的普通道具数
const totalObtained = computed(() => {
  return progressList.value.reduce((s, it) => s + (it.obtainedItems || 0), 0);
});

// 预测相关
const targetGold = ref(250);
// 默认黄金产出率（普通道具 -> 1 黄金），当观测数据不可用时使用
const defaultGoldRate = 4;

// 当前已获得黄金
const currentGold = computed(() => ActivityGoldItem.value || 0);
const remainingGoldNeeded = computed(() =>
  Math.max(0, targetGold.value - currentGold.value),
);

// 基于观测的黄金产出率：使用 当前已获得黄金 / 普通道具 已累计获取 计算金率（普通道具/黄金）
const goldRateObserved = computed(() => {
  const g = currentGold.value || 0;
  const o = totalObtained.value || 0;
  const s = ActivityItem.value || 0;
  if (g > 0 && o > 0 && o > s) {
    // 返回使用的普通道具/黄金（即平均需要多少普通道具产出 1 个黄金）
    return (o - s) / g;
  }
  return null;
});

const goldRateUsed = computed(() => {
  return goldRateObserved.value || defaultGoldRate;
});

// 估算需要的普通道具数量（简单线性估算）：需要 remainingGoldNeeded * goldRateUsed 个普通道具
const neededOrd = computed(
  () => remainingGoldNeeded.value * (goldRateUsed.value || defaultGoldRate),
);

// 当前库存普通道具
const currentOrdStock = computed(() => ActivityItem.value || 0);
// 对于显示，向上取整剩余所需的普通道具数，确保提示为整数
const remainingOrdNeeded = computed(() =>
  Math.max(0, Math.ceil(neededOrd.value - currentOrdStock.value)),
);

// 构造可选升级项分组：对每个类别列出未来每个档位的选项
const groupedUpgradeOptions = computed(() => {
  const groups = [];
  for (const k of Object.keys(TaskNames)) {
    const id = Number(k);
    const name = TaskNames[id];
    const current = progressList.value.find((p) => p.id === id)?.current || 0;
    const configs = missionTypes[id] || [];
    const rewards = rewardConfigs[id] || [];
    const beforeRounds = configs.filter((c) => c.num <= current).length;
    const opts = [];
    for (let j = beforeRounds; j < configs.length; j++) {
      const threshold = configs[j].num;
      const completedRounds = j + 1;
      let delta = 0;
      for (let r = beforeRounds; r < completedRounds; r++) {
        delta += rewards[r]?.num || rewards[rewards.length - 1]?.num || 0;
      }
      const cost = Math.max(0, threshold - current);
      if (delta > 0 && cost > 0) {
        opts.push({
          id,
          name,
          threshold,
          delta,
          cost,
          roundsIndex: completedRounds,
        });
      }
    }
    groups.push({ id, name, current, options: opts });
  }
  return groups;
});

// 列出所有可行组合（供用户查看不同组合方案），按总消耗升序排列
const feasibleCombos = computed(() => {
  const target = Math.ceil(remainingOrdNeeded.value || 0);
  const groups = groupedUpgradeOptions.value || [];
  const combos = [];
  const m = groups.length;
  // recursive enumeration: for each group pick 0 or one option
  const MAX_COMBOS = 1e6;
  let count = 0;

  const recurse = (idx, chosen, sumDelta, sumCost) => {
    if (count > MAX_COMBOS) return;
    if (idx === m) {
      if (sumDelta >= target) {
        // chosen is array of option objects
        combos.push({
          sumDelta,
          sumCost,
          combo: chosen.slice(),
          totalOrd: (totalObtained.value || 0) + sumDelta,
        });
      }
      count++;
      return;
    }
    const group = groups[idx];
    // option: pick none
    recurse(idx + 1, chosen, sumDelta, sumCost);
    // option: pick one of group's options
    for (const opt of group.options) {
      chosen.push(opt);
      recurse(idx + 1, chosen, sumDelta + opt.delta, sumCost + opt.cost);
      chosen.pop();
      if (count > MAX_COMBOS) return;
    }
  };

  recurse(0, [], 0, 0);
  combos.sort((a, b) => a.sumDelta - b.sumDelta || a.sumCost - b.sumCost);
  return combos;
});
</script>

<style scoped lang="scss">
.status-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .icon {
      font-size: 1.2rem;
    }

    .title {
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.settings {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.setting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .n-input-number {
    width: 80px;
  }

  .label {
    color: var(--primary-color);
    font-weight: 600;
    font-size: var(--font-size-sm);
  }
}
.status-row {
  display: flex;
  gap: var(--spacing-lg);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);

  .item-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .item-values {
    font-family: var(--font-mono);

    .current {
      color: var(--primary-color);
      font-weight: 600;
    }

    .separator {
      margin: 0 2px;
      color: var(--text-tertiary);
    }

    .target {
      color: var(--text-secondary);
    }
  }
}

.item-footer {
  display: flex;
  justify-content: flex-end;
  font-size: 11px;

  .next-reward {
    color: var(--text-tertiary);
  }

  .completed-text {
    color: #52c41a;
  }
}
.obtained-items {
  margin-left: 12px;
  color: var(--primary-color);
  font-weight: 600;
}
/* 模态内部可滚动容器，确保在内容过多时显示滚动条且标题/底部可见 */
.cp-modal-scroll {
  max-height: 60vh; /* 不超过视口高度 */
  overflow-y: auto;
  padding-right: 8px; /* 给滚动条留出空间，避免文字遮挡 */
}
.cp-modal-scroll::-webkit-scrollbar {
  width: 10px;
}
.cp-modal-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 6px;
}
.cp-modal-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>
