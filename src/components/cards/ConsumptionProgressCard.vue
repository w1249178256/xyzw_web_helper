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
            <div class="current">黄金道具数量:{{ ActivityGoldItem }}</div>
            <div class="current">普通道具数量:{{ ActivityItem }}</div>
          </div>
        </div>
        <div class="setting-item">
          <span class="label">使用数量:</span>
          <n-input-number v-model:value="Activitynumber" :min="1" :step="1" size="small" />
          <a-button type="primary" size="small" :disabled="state.isRunning" @click="OpenActivityItem">打开普通道具</a-button>          
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
                        <span class="next-reward" v-if="!item.isCompleted"> 下一档: {{ item.nextTarget }} (还需 {{ item.nextTarget - item.current }}) </span>
                        <span class="completed-text" v-else> 已完成所有档位 </span>
                    </div>
                </div>
            </div>
        </div>
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
    }
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
// 消耗活动的ID (仅作参考，实际逻辑会自动查找)
const ACTIVITY_ID = 2512261;
const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null);
const ActivityItem = computed(() => roleInfo.value?.role?.items?.[5261]?.quantity || 0);
const ActivityGoldItem = computed(() => roleInfo.value?.role?.items?.[5262]?.quantity || 0);
const commonActivityInfo = computed(() => {
    const data = tokenStore.gameData?.commonActivityInfo;
    // 尝试获取活动列表对象，兼容可能的层级结构
    return data?.activity?.commonActivityInfo || data?.commonActivityInfo || {};
});

const hasActivityData = computed(() => {
    console.log("🚀 ~ commonActivityInfo.value:", commonActivityInfo.value);
    if (!commonActivityInfo.value) return false;

    // 查找包含有效任务ID (1-5) 的活动
    return Object.values(commonActivityInfo.value).some(activity => {
        if (!activity?.task) return false;
        return Object.keys(activity.task).some(key => {
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
    await tokenStore.sendMessageWithPromise(tokenId, "item_openpack", { itemId: 5261, index: 0, number: Activitynumber.value });
    await tokenStore.sendMessage(tokenId, "role_getroleinfo");
    message.success("道具开启完毕");
    state.value.isRunning = false;
};

const progressList = computed(() => {
    if (!commonActivityInfo.value) return [];

    // 查找包含有效任务ID (1-5) 的活动
    const activityData = Object.values(commonActivityInfo.value).find(activity => {
        if (!activity?.task) return false;
        return Object.keys(activity.task).some(key => {
            const id = Number(key);
            return id >= 1 && id <= 5;
        });
    });

    if (!activityData) return [];

    const tasks = activityData.task || {};

    return Object.keys(TaskNames).map(key => {
        const id = Number(key);
        const current = tasks[id] || 0;
        const configs = missionTypes[id] || [];

        // 找到下一个未完成的目标
        let nextTarget = 0;
        let isCompleted = false;

        const nextConfig = configs.find(c => c.num > current);
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
        };
    });
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
  
  .n-input-number { width: 80px; }

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
</style>