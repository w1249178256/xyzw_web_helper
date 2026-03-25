<template>
  <!-- 俱乐部排位 -->
  <div class="status-card legion-match">
    <div class="card-header">
      <img
        src="/icons/1733492491706152.png"
        alt="俱乐部图标"
        class="status-icon"
      />
      <div class="status-info">
        <h3>俱乐部排位</h3>
        <p>赛事状态</p>
      </div>
      <div class="status-badge" :class="{ active: legionMatch.isRegistered }">
        <span>{{ legionMatch.isRegistered ? "已报名" : "未报名" }}</span>
      </div>
    </div>
    <div class="card-content">
      <p class="description">
        每逢周三周四周五有比赛<br />
        立即报名参与精彩对决！
      </p>
      <button
        class="action-button"
        :disabled="legionMatch.isRegistered"
        @click="registerLegionMatch"
      >
        {{ legionMatch.isRegistered ? "已报名" : "立即报名" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTokenStore } from "@/stores/tokenStore";
import { useMessage } from "naive-ui";
import { ref } from "vue";

const tokenStore = useTokenStore();
const message = useMessage();

const legionMatch = ref({
  isRegistered: false,
});

// 俱乐部排位报名
const registerLegionMatch = () => {
  if (!tokenStore.selectedToken || legionMatch.value.isRegistered) return;

  const tokenId = tokenStore.selectedToken.id;
  tokenStore.sendMessage(tokenId, "legionmatch_rolesignup");

  message.info("报名俱乐部排位");
};
</script>
