<template>
  <div class="legion-war-view-container">
    <n-card class="action-bar-card" size="small">
      <div class="action-bar-content">
        <div class="action-bar-left">
          <n-tabs v-model:value="activeTab" type="segment" size="small">
            <n-tab name="map">战场沙盘地图</n-tab>
            <n-tab name="statistics">实时战况统计</n-tab>
          </n-tabs>
        </div>

        <div class="action-bar-right">
          <n-space align="center">
            <n-tag :type="isConnected ? 'success' : 'error'" size="small">
              {{ isConnected ? "已连接" : "未连接" }}
            </n-tag>
            <n-tag :type="isEntireBattlefield ? 'info' : 'warning'" size="small">
              {{ isEntireBattlefield ? "已进入战场" : "未进入战场" }}
            </n-tag>
            <n-button
              type="primary"
              size="small"
              :disabled="!isEntireBattlefield || sendingBroadcast"
              :loading="sendingBroadcast"
              @click="sendMessageToLegion"
            >
              发送战队复活余量到战队频道
            </n-button>
          </n-space>
        </div>
      </div>
    </n-card>

    <div class="view-content-wrapper">
      <div v-show="activeTab === 'map'" class="tab-content">
        <LegionWarMap />
      </div>
      <div v-show="activeTab === 'statistics'" class="tab-content">
        <LegionWarStatistics />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMessage } from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import LegionWarMap from "@/components/Club/LegionWarMap.vue";
import LegionWarStatistics from "@/components/Club/LegionWarStatistics.vue";
import { useLegionWarStore } from "@/stores/legionWarStore";
import { useTokenStore } from "@/stores/tokenStore";
import { isSameGameValue } from "@/utils/gameValue.js";

const message = useMessage();
const tokenStore = useTokenStore();
const legionWarStore = useLegionWarStore();

const { isConnected, validData, isJoined: isEntireBattlefield } =
  storeToRefs(legionWarStore);

const activeTab = ref("map");
const sendingBroadcast = ref(false);

/**
 * 将各战队剩余复活次数汇总并推送到俱乐部聊天频道
 */
const sendMessageToLegion = async () => {
  if (!validData.value || !validData.value.legionInfo) {
    message.warning("尚未获取到战队数据，请等待战场数据加载");
    return;
  }

  const legionList = Object.values(validData.value.legionInfo);
  if (legionList.length === 0) {
    message.warning("战队列表为空");
    return;
  }

  sendingBroadcast.value = true;
  try {
    const messageList = [];
    for (let i = 0; i < 2; i++) {
      let content = "";
      for (let j = 0; j < 10; j++) {
        const item = legionList[j + i * 10];
        if (!item) continue;
        if (!isSameGameValue(j, 0) && content.length > 0) {
          content += "\n";
        }
        const remain = Math.max(0, 150 - (item.reviveCount || 0));
        content += `${item.name}:剩${remain}`;
      }
      if (content.trim()) {
        messageList.push(content);
      }
    }

    const tokenId = tokenStore.selectedToken?.id;
    if (!tokenId) {
      message.error("未找到当前选中账号 Token");
      return;
    }

    const sendInterval = 1500;
    for (let i = 0; i < messageList.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, sendInterval));
      try {
        await tokenStore.sendMessageToLegion(tokenId, messageList[i]);
      } catch (error) {
        if (error.message?.includes("频繁")) {
          await new Promise((resolve) => setTimeout(resolve, sendInterval * 2));
          await tokenStore.sendMessageToLegion(tokenId, messageList[i]);
        } else {
          throw error;
        }
      }
    }
    message.success("战队复活信息广播已发送");
  } catch (error) {
    message.error(`发送失败: ${error.message}`);
  } finally {
    sendingBroadcast.value = false;
  }
};

onMounted(() => {
  if (!isConnected.value) {
    legionWarStore.connect().catch((e) => {
      console.warn("战场自动连接提示:", e.message);
    });
  }
});
</script>

<style scoped lang="scss">
.legion-war-view-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;

  .action-bar-card {
    border-radius: 8px;

    .action-bar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
  }

  .view-content-wrapper {
    width: 100%;

    .tab-content {
      width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .legion-war-view-container {
    padding: 4px;

    .action-bar-card .action-bar-content {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
