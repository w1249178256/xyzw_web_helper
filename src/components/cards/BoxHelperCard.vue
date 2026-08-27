<template>
  <MyCard class="bottle-helper" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img :src="iconPath" alt="宝箱图标" />
    </template>
    <template #title>
      <h3>宝箱助手</h3>
    </template>
    <template #badge>
      <span>{{ state.isRunning ? "运行中" : "已停止" }}</span>
    </template>
    <template #default>
      <div class="total-points">
        <span class="label">宝箱总积分：</span>
        <span class="value">{{ totalPoints }}</span>
      </div>
      <div class="container">
        <div class="list">
          <div
            class="item"
            v-for="item in boxDataList"
            :key="item.type"
            :data-testid="`box-count-${item.itemId}`"
          >
            <img :src="item.img" :alt="item.type" />
            <div class="box-info">
              <div class="box-type">{{ item.type }}</div>
              <div class="box-count">数量：{{ item.count }}</div>
            </div>
          </div>
        </div>
        <div class="selects">
          <n-select
            v-model:value="type"
            :options="typeOptions"
            :disabled="state.isRunning"
            data-testid="box-type-select"
          />
          <n-select
            v-model:value="number"
            :options="numberOptions"
            :disabled="state.isRunning"
            data-testid="box-number-select"
          />
        </div>
      </div>
    </template>
    <template #action>
      <a-button
        type="primary"
        :disabled="state.isRunning"
        secondary
        size="small"
        block
        data-testid="box-open-button"
        @click="handleBoxHelper"
      >
        {{ state.isRunning ? "运行中" : "开启宝箱" }}
      </a-button>
      <a-button
        type="primary"
        size="small"
        :disabled="state.isRunning"
        data-testid="box-claim-points-button"
        @click="batchclaimboxpointreward"
      >
        {{ claimBoxPointButtonText }}
      </a-button>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import {
  HELPER_BATCH_DELAY_MS,
  HELPER_COMMAND_TIMEOUT_MS,
  getClaimableBoxPoints,
  getErrorMessage,
  runInventoryVerifiedGameCommand,
} from "@/utils/helperTaskRunner";
import MyCard from "../Common/MyCard.vue";

const tokenStore = useTokenStore();
const message = useMessage();

const iconPath = computed(() => import.meta.env.BASE_URL + "box/zsbx.png");

const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null);

const boxDataList = computed(() => {
  const getImgPath = (path) =>
    import.meta.env.BASE_URL + path.replace(/^\//, "");
  return [
    {
      type: "木质宝箱",
      itemId: 2001,
      img: getImgPath("/box/mzbx.png"),
      count: roleInfo.value?.role?.items?.[2001]?.quantity || 0,
    },
    {
      type: "青铜宝箱",
      itemId: 2002,
      img: getImgPath("/box/qtbx.png"),
      count: roleInfo.value?.role?.items?.[2002]?.quantity || 0,
    },
    {
      type: "黄金宝箱",
      itemId: 2003,
      img: getImgPath("/box/hjbx.png"),
      count: roleInfo.value?.role?.items?.[2003]?.quantity || 0,
    },
    {
      type: "铂金宝箱",
      itemId: 2004,
      img: getImgPath("/box/bjbx.png"),
      count: roleInfo.value?.role?.items?.[2004]?.quantity || 0,
    },
  ];
});

const totalPoints = computed(() => {
  const wooden = roleInfo.value?.role?.items?.[2001]?.quantity || 0;
  const bronze = roleInfo.value?.role?.items?.[2002]?.quantity || 0;
  const gold = roleInfo.value?.role?.items?.[2003]?.quantity || 0;
  const platinum = roleInfo.value?.role?.items?.[2004]?.quantity || 0;

  return wooden * 1 + bronze * 10 + gold * 20 + platinum * 50;
});

const claimableBoxPoints = computed(() => getClaimableBoxPoints(roleInfo.value));
const claimBoxPointButtonText = computed(() =>
  claimableBoxPoints.value > 1000
    ? `领取${claimableBoxPoints.value}宝箱积分`
    : "领取宝箱积分",
);

const type = ref(2001);
const typeOptions = [
  { label: "木质宝箱", value: 2001 },
  { label: "青铜宝箱", value: 2002 },
  { label: "黄金宝箱", value: 2003 },
  { label: "铂金宝箱", value: 2004 },
];

const number = ref(10);
const numberOptions = [
  { label: "10", value: 10 },
  { label: "100", value: 100 },
  { label: "1000", value: 1000 },
  { label: "2000", value: 2000 },
  { label: "5000", value: 5000 },
  { label: "10000", value: 10000 },
];

const state = ref({
  isRunning: false,
});

const batchclaimboxpointreward = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }
  const tokenId = tokenStore.selectedToken.id;
  await tokenStore.sendMessage(tokenId, "item_batchclaimboxpointreward");
  await new Promise((r) => setTimeout(r, 500));
  await tokenStore.sendMessage(tokenId, "role_getroleinfo");
  message.success("宝箱积分领取完毕");
};

const handleBoxHelper = async () => {
  if (state.value.isRunning) {
    return;
  }

  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;
  const selectedType = type.value;
  const selectedNumber = number.value;

  state.value.isRunning = true;
  message.info("宝箱开启中");

  try {
    await runInventoryVerifiedGameCommand({
      tokenStore,
      tokenId,
      cmd: "item_openbox",
      itemId: selectedType,
      total: selectedNumber,
      timeout: HELPER_COMMAND_TIMEOUT_MS,
      delayMs: HELPER_BATCH_DELAY_MS,
      createParams: (amount) => ({ itemId: selectedType, number: amount }),
      queryInventory: () => tokenStore.sendGetRoleInfo(tokenId),
    });

    await tokenStore.sendMessage(tokenId, "role_getroleinfo");
    // 更新活动进度
    tokenStore.sendMessage(tokenId, "activity_get");
    message.success("宝箱开启完毕");
  } catch (error) {
    message.error(`宝箱开启失败：${getErrorMessage(error)}`);
  } finally {
    state.value.isRunning = false;
  }
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
    justify-content: space-between;

    .item {
      display: flex;
      flex-direction: column;
      align-items: center;

      > img {
        width: 40px;
        height: 40px;
      }

      .box-info {
        display: flex;
        flex-direction: column;
        align-items: center;

        .box-type {
          font-weight: bold;
          margin-top: 4px;
        }

        .box-count {
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
