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
          <div class="item" v-for="item in boxDataList" :key="item.type">
            <img :src="item.img" :alt="item.type" />
            <div class="box-info">
              <div class="box-type">{{ item.type }}</div>
              <div class="box-count">数量：{{ item.count }}</div>
            </div>
          </div>
        </div>
        <div class="selects">
          <n-select v-model:value="type" :options="typeOptions" />
          <n-select v-model:value="number" :options="numberOptions" />
        </div>
      </div>
    </template>
    <template #action>
      <a-button type="primary" :disabled="state.isRunning" secondary size="small" block @click="handleBoxHelper">
        {{ state.isRunning ? "运行中" : "开启宝箱" }}
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

const iconPath = computed(() => import.meta.env.BASE_URL + 'box/zsbx.png');

const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null);

const boxDataList = computed(() => {
  const getImgPath = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '');
  return [
    {
      type: "木质宝箱",
      img: getImgPath("/box/mzbx.png"),
      count: roleInfo.value?.role?.items?.[2001]?.quantity || 0,
    },
    {
      type: "青铜宝箱",
      img: getImgPath("/box/qtbx.png"),
      count: roleInfo.value?.role?.items?.[2002]?.quantity || 0,
    },
    {
      type: "黄金宝箱",
      img: getImgPath("/box/hjbx.png"),
      count: roleInfo.value?.role?.items?.[2003]?.quantity || 0,
    },
    {
      type: "铂金宝箱",
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

const handleBoxHelper = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }
  const tokenId = tokenStore.selectedToken.id;
  state.value.isRunning = true;
  message.info("宝箱开启中");
  if (number.value >= 10) {
    const batches = Math.floor(number.value / 10);
    const remainder = number.value % 10;
    for (let i = 0; i < batches; i++) {
      const result = await tokenStore.sendMessageWithPromise(tokenId, "item_openbox", { itemId: type.value, number: 10 });
    }
    if (remainder > 0) {
      const result = await tokenStore.sendMessageWithPromise(tokenId, "item_openbox", { itemId: type.value, number: remainder });
    }
    await tokenStore.sendMessage(tokenId, "role_getroleinfo");
    message.success("宝箱开启完毕");
    state.value.isRunning = false;
    return;
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

      >img {
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
