<template>
    <MyCard class="bottle-helper" :statusClass="{ active: state.isRunning }">
        <template #icon>
            <img src="/icons/1736425783912140.png" alt="竞技场" />
        </template>
        <template #title>
            <h3>竞技场助手</h3>
        </template>
        <template #badge>
            <span>{{ state.isRunning ? "运行中" : "已停止" }}</span>
        </template>
        <template #default>
        <div class="total-points">
            <span class="label">当前咸神门票数量：</span>
            <span class="value">{{ itemcount }}</span>
            </div>
            <div class="container">
                <div class="selects">
                    <n-select v-model:value="number" :options="numberOptions" />
                </div>
            </div>
        </template>
        <template #action>
            <a-button type="primary" :disabled="state.isRunning" secondary size="small" block @click="handleFightHelper">
                {{ state.isRunning ? "运行中" : "开始战斗" }}
            </a-button>
        </template>
    </MyCard>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, watchEffect } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import MyCard from "../Common/MyCard.vue";

const tokenStore = useTokenStore();
const message = useMessage();

const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null);
const itemcount = computed(() => roleInfo.value?.role?.items?.[1007]?.quantity || 0);

const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0]

  if (candidate?.roleId) return candidate.roleId
  if (candidate?.id) return candidate.id
  return targets?.roleId || targets?.id
}

const number = ref(10);
const numberOptions = [
    { label: "10", value: 10 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
    { label: "500", value: 500 },
    { label: "1000", value: 1000 },
    { label: "2000", value: 2000 },
    { label: "5000", value: 5000 },
    { label: "10000", value: 10000 },
];
const state = ref({
    isRunning: false,
});

const handleFightHelper = async () => {
    if (!tokenStore.selectedToken) {
        message.warning("请先选择Token");
        return;
    }
    if (itemcount.value < number.value) 
    {
    message.warning("咸神门票不足以完成该战斗次数");
    return;
    }
    const tokenId = tokenStore.selectedToken.id;
    state.value.isRunning = true;
    message.info("竞技场战斗中");
    for (let i = 0; i < number.value; i++) {
    // 开始竞技场
    await tokenStore.sendMessageWithPromise(tokenId, "arena_startarea", {});
    let targets
    try {
      targets = await tokenStore.sendMessageWithPromise(tokenId, 'arena_getareatarget', {})
    } catch (err) {
      message.error(`获取竞技场目标失败：${err.message}`)
      break
    }
        
    const targetId = pickArenaTargetId(targets)
    if (!targetId) { message.warning('未找到可用的竞技场目标，已停止'); break }
    try { await tokenStore.sendMessageWithPromise(tokenId, 'fight_startareaarena', {targetId}) }
    catch (e) { message.error(`竞技场对决失败：${e.message}`) }
    }

    await tokenStore.sendMessage(tokenId, "role_getroleinfo");
    message.success("竞技场战斗完毕");
    state.value.isRunning = false;
    return;
        
    
};
</script>

<style scoped lang="scss">
.container {
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    .list {
        display: flex;
        align-items: center;
        justify-content: center;
        .item {
            display: flex;
            flex-direction: column;
            align-items: center;
            > img {
                width: 40px;
                height: 40px;
            }
            .fight-info {
                display: flex;
                flex-direction: column;
                align-items: center;
                .fight-type {
                    font-weight: bold;
                    margin-top: 4px;
                }
                .fight-count {
                    margin-top: 2px;
                    color: #666;
                }
            }
        }
    }
    .selects {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
    }
    .total-points {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 2px;
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-medium);

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .value {
      color: var(--text-primary);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
    }
  }
}
</style>
