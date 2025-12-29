<template>
  <MyCard class="star-upgrade" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img src="/icons/ta.png" alt="升级图标" />
    </template>
    <template #title>
      <h3>武将升级</h3>
      <p>武将升级,方便卡速</p>
    </template>
    <template #badge>
      <span>{{ state.isRunning ? "运行中" : "已停止" }}</span>
    </template>
    <template #default>
      <div class="settings">
        <span class="label">武将选择</span>
        <n-select v-model:value="HeroValue" :options="HeroOptions" @update:value="handleUpdateValue"></n-select>
      </div>
    </template>
    <template #action>
      <div class="action-row" v-if="HeroItem != null">
        <div class="hero-item">
          <img  :src="HeroItem.avatar" :alt="HeroItem.name">
        </div>
        <div class="hero-property">
          <div class="current-property">
            <div>
              攻击：{{HeroItem.attack}}
            </div>
            <div>
              速度：{{HeroItem.speed}}
            </div>
          </div>
        </div>
        <div class="button-area">
          <div class="input-area">
            <span class="label">升级等级</span>
            <n-select v-model:value="levelNum" :options="levelOptions"></n-select>
          </div>
          <div class="button-group">
            <a-button type="primary" :disabled="state.isRunning"  size="small" @click="levelHeroUpgrade">升级</a-button>
            <a-button type="primary" :disabled="judgeLevelupgrade(HeroItem.level,1,HeroItem.order)==false"  size="small" @click="orderHeroUpgrade">进阶</a-button>
          </div>
        </div>
      </div>
    </template>
  </MyCard>
</template>
  
<script setup>
import { ref, computed,watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import MyCard from '../Common/MyCard.vue'
import { HERO_DICT } from '@/utils/HeroList'

const tokenStore = useTokenStore()
const message = useMessage()

const HeroOptions = computed(() => [
  ...Object.values(tokenStore.gameData.roleInfo.role.heroes).map(item => {
    return {
      label: HERO_DICT[item.heroId].name + "(" + item.level + "/6000)",
      value: item.heroId,
      disabled: item.level == 6000
    }
  })
])

const HeroValue = ref(null)
const HeroItem = ref(null)
const levelNum = ref(1)
const state = ref({ isRunning: false, showConfirm: false, progressText: '待开始', stopRequested: false, total: 0, done: 0 })

const handleUpdateValue = (value) => {
  HeroItem.value = Object.assign({}, tokenStore.gameData.roleInfo.role.heroes[value], HERO_DICT[value])
}

const levelOptions =[
  {
    label: "1",
    value: 1
  },
  {
    label: "5",
    value: 5
  },
  {
    label: "10",
    value: 10
  },
  {
    label: "50",
    value: 50
  }]

watch(
  () => tokenStore.gameData.roleInfo.heroes, 
  () => {
    if(HeroValue.value){
      if(tokenStore.gameData.roleInfo.role.heroes[HeroValue.value].level !=6000){
        HeroItem.value = Object.assign({}, tokenStore.gameData.roleInfo.role.heroes[HeroValue.value], HERO_DICT[HeroValue.value])
      }else{
        HeroItem.value=null;
      }
    }
  },
  { deep: true } // 深度监听内部变化
);

//英雄进阶
const orderHeroUpgrade = async () => { 
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法执行命令')
    return
  }
  state.value.isRunning=true;

  try {
    let judgement = judgeLevelupgrade(HeroItem.value.level,levelNum.value,HeroItem.value.order);
    if(judgement == HeroItem.value.level){
      const result = await tokenStore.sendMessageWithPromise(tokenId, 'hero_heroupgradeorder',
      {
        heroId: HeroValue.value
      }, 5000)
      if(result?.role.heroes){
        message.success('进阶成功');
        tokenStore.sendGetRoleInfo(tokenId)
      }
    }else{
      message.warning('进阶失败');
    }
  } catch (error) {
    message.error(`进阶失败: ${error.message}`);
    tokenStore.sendGetRoleInfo(tokenId)
  } finally {
    state.value.isRunning=false;
  }
}

//英雄升级
const levelHeroUpgrade = async () => { 
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法执行命令')
    return
  }
  state.value.isRunning=true;

  try {
    let judgement = judgeLevelupgrade(HeroItem.value.level,levelNum.value,HeroItem.value.order);
    if(judgement==false){
      const result = await tokenStore.sendMessageWithPromise(tokenId, 'hero_heroupgradelevel',
      {
        heroId: HeroValue.value,
        upgradeNum:levelNum.value
      }, 5000)
      if(result?.role.heroes){
        tokenStore.sendGetRoleInfo(tokenId)
      }
    }else{
      message.warning('请手动升级到'+judgement+"级,然后进行进阶")
    }
  } catch (error) {
    message.error(`升级失败: ${error.message}`);
    tokenStore.sendGetRoleInfo(tokenId)
  } finally {
    state.value.isRunning=false;
  }
}

/**
 * 判断是否需要进阶
 * @param {*} level 
 */
const levelArr = [
  {level:100,order:1},
  {level:200,order:2},
  {level:300,order:3},
  {level:500,order:4},
  {level:700,order:5},
  {level:900,order:6},
  {level:1100,order:7},
  {level:1300,order:8},
  {level:1500,order:9},
  {level:1800,order:10},
  {level:2100,order:11},
  {level:2400,order:12},
  {level:2800,order:13},
  {level:3200,order:14},
  {level:3600,order:15},
  {level:4000,order:16},
  {level:4500,order:17},
  {level:5000,order:18},
  {level:5500,order:19}
] //需要进阶的等级
const judgeLevelupgrade= (level,levelNum,order)=>{
  for (const item of levelArr) {
  console.log(level,levelNum,order,order != item.order,level<=item.level , item.level < (level+levelNum))
    if(order != item.order&&level<=item.level && item.level < (level+levelNum)){
      return item.level;
    }else{
      continue;
    }
  }
  return false
}

const formatTime = (ts) => new Date(ts).toLocaleTimeString('zh-CN')
</script>
  
<style scoped lang="scss">
.settings {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);

  .label {
    flex-shrink: 0;
  }
}

.action-row{
  margin: auto;
  width: 100%;
}
.hero-item{
  display: flex;
  flex-direction:column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}
.hero-property{
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  justify-content: center;

  .current-property{
    display: flex;
  flex-direction:column;
  gap: var(--spacing-md);
  }
}
.button-area{
  .input-area{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    margin: var(--spacing-sm);
    .label {
      flex-shrink: 0;
    }
  }
  .button-group{
    button{
      width: 100%;
      margin-top: var(--spacing-sm);
    }
  }
}
</style>
  