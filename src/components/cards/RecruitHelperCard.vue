<template>
  <MyCard class="helper" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img :src="iconPath" alt="招募图标" />
    </template>
    <template #title>
      <h3>招募助手</h3>
    </template>
    <template #badge>
      <span>{{ state.isRunning ? "运行中" : "已停止" }}</span>
    </template>
    <template #default>
      <div class="container">
        <div class="list">
          <div
            class="item"
            v-for="item in dataList"
            :key="item.type"
            :data-testid="`recruit-count-${item.itemId}`"
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
            v-model:value="number"
            :options="numberOptions"
            :disabled="state.isRunning"
            data-testid="recruit-number-select"
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
        data-testid="recruit-start-button"
        @click="handleHelper"
      >
        {{ state.isRunning ? "运行中" : "开始招募" }}
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
  getErrorMessage,
  runInventoryVerifiedGameCommand,
} from "@/utils/helperTaskRunner";
import MyCard from "../Common/MyCard.vue";

const tokenStore = useTokenStore();
const message = useMessage();

const iconPath = computed(() => import.meta.env.BASE_URL + "icons/zml.png");

const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null);

const dataList = computed(() => {
  const getImgPath = (path) =>
    import.meta.env.BASE_URL + path.replace(/^\//, "");
  return [
    {
      type: "招募令",
      itemId: 1001,
      img: getImgPath("/icons/zml.png"),
      count: roleInfo.value?.role?.items?.[1001]?.quantity || 0,
    },
  ];
});

const number = ref(10);
const numberOptions = [
  { label: "10", value: 10 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
  { label: "400", value: 400 },
];

const state = ref({
  isRunning: false,
});

const handleHelper = async () => {
  if (state.value.isRunning) {
    return;
  }

  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;
  const selectedNumber = number.value;

  state.value.isRunning = true;
  message.info("招募助手运行中");

  try {
    await runInventoryVerifiedGameCommand({
      tokenStore,
      tokenId,
      cmd: "hero_recruit",
      itemId: 1001,
      total: selectedNumber,
      timeout: HELPER_COMMAND_TIMEOUT_MS,
      delayMs: HELPER_BATCH_DELAY_MS,
      createParams: (amount) => ({ recruitType: 1, recruitNumber: amount }),
      queryInventory: () => tokenStore.sendGetRoleInfo(tokenId),
    });

    await tokenStore.sendMessage(tokenId, "role_getroleinfo");
    // 更新活动进度
    tokenStore.sendMessage(tokenId, "activity_get");
    message.success("招募完毕");
  } catch (error) {
    message.error(`招募失败：${getErrorMessage(error)}`);
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
    justify-content: space-around;

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
}
</style>
