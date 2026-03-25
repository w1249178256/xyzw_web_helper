<template>
  <!-- 俱乐部签到 -->
  <MyCard class="legion-match" :statusClass="{ active: isSignedIn }">
    <template #icon>
      <img src="/icons/1733492491706148.png" alt="签到图标" />
    </template>
    <template #title>
      <h3>俱乐部签到</h3>
      <p>每日签到状态</p>
    </template>
    <template #badge>
      <span>{{ isSignedIn ? "已签到" : "待签到" }}</span>
    </template>
    <template #default>
      <p v-if="clubInfo.name" class="club-name">
        当前俱乐部<br />
        <strong>{{ clubInfo.name }}</strong>
      </p>
      <p v-else>尚未加入任何俱乐部</p>
    </template>
    <template #action>
      <button
        class="action-button"
        :disabled="isSignedIn"
        @click="signInLegion"
      >
        {{ isSignedIn ? "已签到" : "立即签到" }}
      </button>
    </template>
  </MyCard>
</template>

<script setup lang="ts">
import { useTokenStore } from "@/stores/tokenStore";
import { useMessage } from "naive-ui";

const tokenStore = useTokenStore();
const message = useMessage();

// 计算属性
const roleInfo = computed(() => {
  return tokenStore.gameData?.roleInfo || null;
});

const isSignedIn = computed(() => {
  const role = roleInfo.value?.role;

  if (!role || !role.statisticsTime) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime() / 1000;

  return role.statisticsTime["legion:sign:in"] > todayTimestamp;
});

const clubInfo = computed(() => {
  return tokenStore.gameData?.legionInfo?.info || {};
});

onMounted(() => {
  console.log("clubInfo", tokenStore.gameData);
});

// 俱乐部签到
const signInLegion = () => {
  if (!tokenStore.selectedToken || isSignedIn.value) return;
  const tokenId = tokenStore.selectedToken.id;
  tokenStore.sendMessage(tokenId, "legion_signin");
  tokenStore.sendMessage(tokenId, "role_getroleinfo");
  message.info("俱乐部签到");
};
</script>

<style lang="scss" scoped>
.club-name {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);

  strong {
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
  }
}
</style>
