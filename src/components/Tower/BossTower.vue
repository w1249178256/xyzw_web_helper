<template>
  <MyCard class="hang-up" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png" alt="宝库图标">
    </template>
    <template #title>
      <h3>咸王功能</h3>
    </template>
    <template #default>
      <div class="time-display">
        宝库当前层数：{{ currentTower }}
      </div>
    </template>
    <template #action>
      <a-button type="primary" secondary size="small" block @click="extendbosstower">宝库战斗</a-button>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import MyCard from '../Common/MyCard.vue'

const tokenStore = useTokenStore()
const message = useMessage()
const roleInfo = computed(() => tokenStore.gameData?.roleInfo || null)
const dayOfWeek = new Date().getDay()

const bossTowerInfo = computed(() => {
  const data = tokenStore.gameData?.bossTowerInfo || null
  return data
})
const currentTower = computed(() => {
  const tower = bossTowerInfo.value?.bossTower
  return tower?.towerId ?? 1
})
const state = ref({
    isRunning: false,
})

const extendbosstower = async () => {
  if (!tokenStore.selectedToken) return message.warning('请先选择Token')
  const tokenId = tokenStore.selectedToken.id
  state.value.isRunning = true
  if (dayOfWeek != 1 && dayOfWeek != 2)
  {
    if (currentTower === 1 || currentTower === 2 || currentTower === 3)
    {
    try {
      state.value.isExtending = true
      message.info('正在战斗...')
      for (let i = 0; i < 2; i++) {
      tokenStore.sendMessage(tokenId, 'bosstower_startboss', {})
      }
      for (let j = 0; j < 9; j++) {
      tokenStore.sendMessage(tokenId, 'bosstower_startbox', {})
      }
      await tokenStore.sendMessageWithPromise(tokenId, "bosstower_getinfo", {}, 10000)
      message.success('战斗已完成，请上线手动领取奖励')
      } catch (e) {
      message.error('战斗失败: ' + (e?.message || '未知错误'))
      }
    }
    else if (currentTower === 4 || currentTower === 5)
    {
      try {
      state.value.isExtending = true
      message.info('正在战斗...')
      for (let i = 0; i < 2; i++) {
      tokenStore.sendMessage(tokenId, 'bosstower_startboss', {})
      }
      await tokenStore.sendMessageWithPromise(tokenId, "bosstower_getinfo", {}, 10000)
      message.success('战斗已完成')
      } catch (e) {
        message.error('战斗失败: ' + (e?.message || '未知错误'))
      }
    }
    else
    {
      message.error('当前层数暂不支持')
    }
  }
  else
  {
  message.error('未到活动开放时间')
  }
  state.value.isRunning = false;
}
</script>

<style scoped lang="scss">
/* 按钮改用 Naive UI；time-display 样式由 MyCard 统一提供 */
</style>
