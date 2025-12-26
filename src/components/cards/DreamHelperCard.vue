<template>
  <MyCard class="dream-helper" :statusClass="{ active: isRunning }">
    <template #icon>
      <img :src="iconPath" alt="梦境图标" />
    </template>
    <template #title>
      <h3>梦境助手</h3>
    </template>
    <template #badge>
      <span>{{ isRunning ? "运行中" : "已停止" }}</span>
    </template>
    <template #default>
      <div class="dream-helper-content">
        <div class="tabs">
          <div class="tab" :class="{ active: activeTab === 'battle' }" @click="activeTab = 'battle'">战斗模块</div>
          <div class="tab" :class="{ active: activeTab === 'buy' }" @click="activeTab = 'buy'">购买模块</div>
        </div>
        
        <!-- 战斗模块 -->
        <div v-if="activeTab === 'battle'" class="tab-content">
          <div class="team-info" v-if="teamHeroes.length > 0">
            <div class="team-title">当前队伍</div>
            <div class="team-list">
              <div class="hero-item" v-for="hero in teamHeroes" :key="hero.id">
                <div class="hero-name" :style="{ borderLeftColor: getTypeColor(hero.type) }">
                  {{ hero.name }}
                </div>
                <a-button 
                  type="primary" 
                  size="small" 
                  :class="{ 'stop-btn': continuousBattles[hero.id] }"
                  @click="toggleContinuousBattle(hero.id)"
                >
                  {{ continuousBattles[hero.id] ? '停止' : '连续战斗' }}
                </a-button>
              </div>
            </div>
          </div>
          <div class="team-actions">
            <a-button type="primary" size="small" @click="getDefaultTeam">获取队伍</a-button>
            <a-button type="primary" size="small" @click="selectDreamTeam">选择阵容</a-button>
            <a-button type="primary" size="small" @click="stopAllBattles">停止所有</a-button>
          </div>
        </div>
        
        <!-- 购买模块 -->
        <div v-if="activeTab === 'buy'" class="tab-content">
          <div class="merchant-info">
            <div class="merchant-title">商品列表</div>
            <div class="merchant-actions">
              <a-button type="primary" size="small" @click="refreshMerchantList">获取商品</a-button>
              <a-button type="primary" size="small" @click="buyAllGoldItems">一键购买金币商品</a-button>
              <a-button type="primary" size="small" @click="buyAllGoldFishItems">一键购买高级商人鱼竿</a-button>
            </div>
          </div>
          <div class="merchant-items" v-if="merchantDataLoaded">
            <div class="merchant-section" v-for="(items, merchantId) in merchantData" :key="merchantId">
              <div class="merchant-name">{{ merchantConfig[merchantId].name }}</div>
              <div class="items-list">
                <div class="item" v-for="(item, index) in items" :key="index">
                  <div class="item-name" :style="{ color: getItemColor(parseInt(merchantId), item) }">
                    {{ getItemName(parseInt(merchantId), item) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #action>
      <a-button type="primary" :disabled="isRunning" secondary size="small" block @click="startDreamHelper">
        {{ isRunning ? "运行中" : "启动梦境助手" }}
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

const iconPath = computed(() => import.meta.env.BASE_URL + '174061875626614.png');

// 状态管理
const isRunning = ref(false);
const activeTab = ref('battle');
const isLoading = ref(false);
const hasDefaultInfo = ref(false);
const teamHeroes = ref([]);
const continuousBattles = ref({});
const battleInterval = ref(null);

// 购买模块状态
const merchantData = ref({ 1: [], 2: [], 3: [] });
const levelId = ref(0);
const selectedItems = ref(new Set());
const merchantDataLoaded = ref(false);

// 英雄数据映射
const heroData = {
  "101": { name: "司马懿", type: "魏国" },
  "102": { name: "郭嘉", type: "魏国" },
  "103": { name: "关羽", type: "蜀国" },
  "104": { name: "诸葛亮", type: "蜀国" },
  "105": { name: "周瑜", type: "吴国" },
  "106": { name: "太史慈", type: "吴国" },
  "107": { name: "吕布", type: "群雄" },
  "108": { name: "华佗", type: "群雄" },
  "109": { name: "甄姬", type: "魏国" },
  "110": { name: "黄月英", type: "蜀国" },
  "111": { name: "孙策", type: "吴国" },
  "112": { name: "贾诩", type: "群雄" },
  "113": { name: "曹仁", type: "魏国" },
  "114": { name: "姜维", type: "蜀国" },
  "115": { name: "孙坚", type: "吴国" },
  "116": { name: "公孙瓒", type: "群雄" },
  "117": { name: "典韦", type: "魏国" },
  "118": { name: "赵云", type: "蜀国" },
  "119": { name: "大乔", type: "吴国" },
  "120": { name: "张角", type: "群雄" }
};

// 商人配置
const merchantConfig = {
  1: { name: '初级商人', items: ['进阶石', '精铁', '木质宝箱', '青铜宝箱', '普通鱼竿', '挑战票', '咸神火把'] },
  2: { name: '中级商人', items: ['梦魇晶石', '进阶石', '精铁', '黄金宝箱', '黄金鱼竿', '招募令', '橙将碎片', '紫将碎片'] },
  3: { name: '高级商人', items: ['梦魇晶石', '铂金宝箱', '黄金鱼竿', '招募令', '红将碎片', '橙将碎片', '红将碎片', '普通鱼竿'] }
};

// 金币购买的商品配置 [商人ID][商品索引]
const goldItemsConfig = {
  1: [5, 6], // 初级商人: 挑战票, 咸神火把
  2: [6, 7], // 中级商人: 橙将碎片, 紫将碎片
  3: [5, 6, 7]  // 高级商人: 橙将碎片, 红将碎片, 普通鱼竿
};

// 检查梦境开放时间（周三/周四/周日/周一）
function isDungeonOpen() {
  const now = new Date();
  const day = now.getDay(); // 0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
  return day === 0 || day === 1 || day === 3 || day === 4; // 周日、周一、周三、周四
}

// 延迟函数
function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// 获取类型颜色
function getTypeColor(type) {
  const colorMap = {
    '魏国': '#3b82f6',
    '蜀国': '#10b981', 
    '吴国': '#f59e0b',
    '群雄': '#ef4444'
  };
  return colorMap[type] || '#8b5cf6';
}

// 提取默认队伍信息
function extractDefaultInfoFromResponse(response) {
  try {
    if (!response || !response.presetTeamInfo.presetTeamInfo) {
      return false;
    }
    
    const useTeamId = response.presetTeamInfo.useTeamId.toString();
    const battleTeam = response.presetTeamInfo.presetTeamInfo[useTeamId].teamInfo;
    teamHeroes.value = [];
    
    for (let i = 0; i < 5; i++) {
      const heroKey = i.toString();
      if (battleTeam[heroKey]) {
        const heroInfo = battleTeam[heroKey];
        const heroId = heroInfo.heroId || heroInfo;
        if (heroId !== 0 && heroData[heroId]) {
          teamHeroes.value.push({
            id: heroId,
            name: heroData[heroId].name,
            type: heroData[heroId].type,
            position: i
          });
        }
      }
    }
    
    hasDefaultInfo.value = true;
    return true;
  } catch (error) {
    console.error('提取默认信息出错:', error);
    return false;
  }
}

// 获取默认队伍信息
async function getDefaultTeam() {
  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }

  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token');
    return;
  }

  isLoading.value = true;
  const tokenId = tokenStore.selectedToken.id;

  try {
    const roleInfo = await tokenStore.sendMessageWithPromise(tokenId, 'presetteam_getinfo', {}, 15000);
    
    if (roleInfo) {
      const extracted = extractDefaultInfoFromResponse(roleInfo);
      if (extracted) {
        message.success('队伍信息获取成功');
      } else {
        message.error('无法提取队伍数据');
      }
    }
  } catch (error) {
    message.error(`获取默认队伍信息出错: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
}

// 选择梦境阵容
async function selectDreamTeam() {
  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }

  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token');
    return;
  }

  if (!hasDefaultInfo.value) {
    const success = await getDefaultTeam();
    if (!success) {
      message.warning('请先获取默认队伍');
      return;
    }
  }

  isLoading.value = true;
  const tokenId = tokenStore.selectedToken.id;

  try {
    // 构造战斗队伍数据
    const battleTeam = {};
    let hasHero = false;
    
    for (let i = 0; i < 5; i++) {
      const hero = teamHeroes.value.find(h => h.position === i);
      if (hero) {
        battleTeam[i.toString()] = hero.id;
        hasHero = true;
      } else {
        battleTeam[i.toString()] = 0;
      }
    }

    if (!hasHero) {
      message.warning('队伍中没有英雄');
      return;
    }

    const response = await tokenStore.sendMessageWithPromise(tokenId, 'dungeon_selecthero', {
      battleTeam: battleTeam
    }, 15000);
    
    if (response) {
      message.success('梦境阵容选择成功');
    }
  } catch (error) {
    message.error(`选择梦境阵容出错: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
}

// 单个英雄战斗
async function startSingleBattle(heroId) {
  if (!tokenStore.selectedToken) {
    return false;
  }

  const tokenId = tokenStore.selectedToken.id;
  const heroName = heroData[heroId] ? heroData[heroId].name : `ID:${heroId}`;

  try {
    const response = await tokenStore.sendMessageWithPromise(tokenId, 'fight_startdungeon', {
      heroId: parseInt(heroId)
    }, 15000);
    
    if (response) {
      const rawData = response;
      if (rawData) {
        if (rawData.isWin) {
          console.log(`${heroName} 战斗胜利!`);
        } else {
          console.log(`${heroName} 战斗失败`);
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    // 检查是否是2600080或2600050错误码
    if (error.message.includes('2600080') || error.message.includes('2600050')) {
      return 'stop'; // 返回特殊值表示需要停止
    }
    console.error(`${heroName} 开始战斗出错:`, error);
    return false;
  }
}

// 连续战斗功能
async function startContinuousBattle(heroId) {
  const heroName = heroData[heroId] ? heroData[heroId].name : `ID:${heroId}`;
  
  continuousBattles.value[heroId] = true;
  message.info(`${heroName} 开始连续战斗`);
  
  // 连续战斗循环
  while (continuousBattles.value[heroId]) {
    const result = await startSingleBattle(heroId);
    
    // 如果返回stop，表示遇到2600080或2600050错误，停止战斗
    if (result === 'stop') {
      stopContinuousBattle(heroId);
      break;
    }
    
    // 等待0.1秒再进行下一次战斗
    if (continuousBattles.value[heroId]) {
      await delay(0.1);
    }
  }
}

// 停止连续战斗
function stopContinuousBattle(heroId) {
  const heroName = heroData[heroId] ? heroData[heroId].name : `ID:${heroId}`;
  
  continuousBattles.value[heroId] = false;
  message.info(`${heroName} 连续战斗已停止`);
}

// 切换连续战斗状态
function toggleContinuousBattle(heroId) {
  if (continuousBattles.value[heroId]) {
    stopContinuousBattle(heroId);
  } else {
    startContinuousBattle(heroId);
  }
}

// 停止所有战斗
function stopAllBattles() {
  continuousBattles.value = {};
  message.info('所有连续战斗已停止');
}

// 获取商品显示名称
function getItemName(merchantId, index) {
  const merchant = merchantConfig[merchantId];
  if (merchant && merchant.items[index] !== undefined) {
    return merchant.items[index];
  }
  return `未知商品(${index})`;
}

// 获取商品颜色
function getItemColor(merchantId, index) {
  const itemName = getItemName(merchantId, index);
  
  // 黄金鱼竿特殊颜色
  if (itemName.includes('黄金鱼竿')) {
    return '#ffd700';
  }
  
  // 金币商品颜色
  if (isGoldItem(merchantId, index)) {
    return '#ffa500';
  }
  
  // 其他商品颜色
  return '#F3BCD6';
}

// 检查是否为金币商品
function isGoldItem(merchantId, index) {
  return goldItemsConfig[merchantId] && goldItemsConfig[merchantId].includes(index);
}

// 获取角色信息（包含商品列表）
async function getRoleInfo() {
  if (!tokenStore.selectedToken) {
    return;
  }

  const tokenId = tokenStore.selectedToken.id;
  
  try {
    const response = await tokenStore.sendMessageWithPromise(tokenId, 'role_getroleinfo', {}, 15000);
    
    if (response && response && response.role) {
      // 获取商品列表
      if (response.role.dungeon && response.role.dungeon.merchant) {
        merchantData.value = response.role.dungeon.merchant;
      }
      
      // 获取关卡ID
      if (response.role.levelId) {
        levelId.value = response.role.levelId;
      }
      
      return { merchantData: merchantData.value, levelId: levelId.value };
    }
  } catch (error) {
    console.error('获取角色信息失败:', error);
    throw error;
  }
}

// 购买商品
async function buyItem(merchantId, index, pos) {
  if (!tokenStore.selectedToken) {
    return false;
  }

  const tokenId = tokenStore.selectedToken.id;
  
  try {
    const response = await tokenStore.sendMessageWithPromise(tokenId, 'dungeon_buymerchant', {
      id: merchantId,
      index: index,
      pos: pos
    }, 15000);
    
    return response && response.code === 0;
  } catch (error) {
    console.error('购买商品失败:', error);
    return false;
  }
}

// 批量购买选中的商品
async function batchBuySelected() {
  if (selectedItems.value.size === 0) {
    message.warning('请先选择要购买的商品');
    return;
  }

  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }

  if (levelId.value < 4000) {
    message.warning('关卡数小于4000，无法购买金币商品');
    return;
  }

  isRunning.value = true;
  const items = Array.from(selectedItems.value);
  let successCount = 0;
  let failCount = 0;

  // 按商人ID和位置排序，从大到小购买
  items.sort((a, b) => {
    const [aMerchant, aIndex, aPos] = a.split('-').map(Number);
    const [bMerchant, bIndex, bPos] = b.split('-').map(Number);
    
    if (aMerchant !== bMerchant) return bMerchant - aMerchant;
    return bPos - aPos;
  });

  for (const itemKey of items) {
    const [merchantId, index, pos] = itemKey.split('-').map(Number);
    
    try {
      const success = await buyItem(merchantId, index, pos);
      if (success) {
        selectedItems.value.delete(itemKey);
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      failCount++;
    }
    
    // 延迟避免请求过快
    await delay(0.5);
  }

  // 重新获取商品列表更新界面
  await refreshMerchantList();
  
  message.success(`批量购买完成: 成功 ${successCount} 件, 失败 ${failCount} 件`);
  isRunning.value = false;
}

// 一键购买所有金币商品
async function buyAllGoldItems() {
  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }

  if (levelId.value < 4000) {
    message.warning('关卡数小于4000，无法购买金币商品');
    return;
  }

  isRunning.value = true;
  let successCount = 0;
  let failCount = 0;

  // 遍历所有商人的商品
  for (const merchantId in merchantData.value) {
    const items = merchantData.value[merchantId];
    const numId = parseInt(merchantId);
    
    // 从后往前购买（pos从大到小）
    for (let pos = items.length - 1; pos >= 0; pos--) {
      const index = items[pos];
      
      if (isGoldItem(numId, index)) {
        try {
          const success = await buyItem(numId, index, pos);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
        
        // 延迟避免请求过快
        await delay(0.5);
      }
    }
  }

  // 重新获取商品列表更新界面
  await refreshMerchantList();
  
  message.success(`一键购买完成: 成功 ${successCount} 件, 失败 ${failCount} 件`);
  isRunning.value = false;
}

// 一键购买所有高级商人鱼竿
async function buyAllGoldFishItems() {
  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }

  if (levelId.value < 4000) {
    message.warning('关卡数小于4000，无法购买金币商品');
    return;
  }

  isRunning.value = true;
  let successCount = 0;
  let failCount = 0;

    const items = merchantData.value[3];
    // 从后往前购买（pos从大到小）
    for (let pos = items.length - 1; pos >= 0; pos--) {
      const index = items[pos];
      
      if (index === 2) {
        try {
          const success = await buyItem(3, index, pos);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
        
        // 延迟避免请求过快
        await delay(0.5);
      }
    }
  

  // 重新获取商品列表更新界面
  await refreshMerchantList();
  
  message.success(`一键购买完成: 成功 ${successCount} 件, 失败 ${failCount} 件`);
  isRunning.value = false;
}

// 获取商品列表（包含自动获取阵容）
async function refreshMerchantList() {
  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }

  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token');
    return;
  }

  try {
    message.info('开始自动获取商品列表流程...');
    
    // 第一步：获取默认队伍信息
    const teamSuccess = await getDefaultTeam();
    
    // 第二步：选择梦境阵容
    await selectDreamTeam();
    
    // 第三步：获取商品列表
    await getRoleInfo();
    merchantDataLoaded.value = true;
    
    message.success('商品列表获取完成');
  } catch (error) {
    message.error(`获取商品列表失败: ${error.message}`);
  }
}

// 启动梦境助手
const startDreamHelper = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token');
    return;
  }
  if (!isDungeonOpen()) {
    message.warning('当前不是梦境开放时间（周三/周四/周日/周一）');
    return;
  }
  
  isRunning.value = true;
  message.info('梦境助手运行中');
  
  // 这里可以根据需要实现自动运行逻辑
  // 例如：自动获取队伍 -> 选择阵容 -> 开始连续战斗 -> 购买商品
  
  // 暂时先简单实现，获取队伍信息
  await getDefaultTeam();
  
  isRunning.value = false;
  message.success('梦境助手运行完毕');
};
</script>

<style scoped lang="scss">
.dream-helper-content {
  padding: 10px 0;
  
  .tabs {
    display: flex;
    margin-bottom: 10px;
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-medium);
    overflow: hidden;
    
    .tab {
      flex: 1;
      padding: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: var(--font-size-sm);
      
      &.active {
        background: var(--color-primary);
        color: var(--text-light);
      }
    }
  }
  
  .tab-content {
    padding: 10px 0;
  }
  
  .team-info {
    margin-bottom: 15px;
    
    .team-title {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .team-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .hero-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-small);
    }
    
    .hero-name {
      padding: 4px 8px;
      border-left: 3px solid #8b5cf6;
      font-size: var(--font-size-sm);
    }
  }
  
  .team-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
  }
  
  .merchant-info {
    margin-bottom: 15px;
    
    .merchant-title {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .merchant-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }
  }
  
  .merchant-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .merchant-section {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-small);
    padding: 8px;
    
    .merchant-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      margin-bottom: 6px;
    }
    
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px;
      background: var(--bg-primary);
      border-radius: var(--border-radius-xs);
    }
    
    .item-name {
      font-size: var(--font-size-xs);
    }
  }
}

.stop-btn {
  background-color: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
}
</style>