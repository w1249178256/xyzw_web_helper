<template>
  <MyCard class="summer-activity" status-class="active">
    <template #icon>
      <n-icon size="24">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </n-icon>
    </template>
    <template #title>
      <h3>暑期活动</h3>
    </template>
    <template #default>
      <!-- 塔数据表格 - 参照武将信息表格格式 -->
      <div class="team-table-container">
        <table class="team-table">
          <thead>
            <tr>
              <th>BOSS</th>
              <th v-for="n in 6" :key="n">{{ n }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>活动次数</td>
              <td v-for="n in 6" :key="n">{{ towerData[n] }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 暑期活动功能 - 使用一个CustomizedCard容器容纳所有内容 -->
      <CustomizedCard mode="container">
        <!-- 第一行：免费商品id + 输入框，使用免费 + 开关 -->
        <CustomizedCard
          mode="name-input"
          name="免费商品id"
          :input-value="freeGoodsId"
          placeholder="请输入免费商品id"
          @update:input-value="freeGoodsId = $event"
        />
        <CustomizedCard
          mode="name-switch"
          name="使用免费"
          :switch-value="useFree"
          @update:switch-value="useFree = $event"
        />

        <!-- 第二行：活动id + 输入框，道具id + 输入框 -->
        <CustomizedCard
          mode="name-input"
          name="活动id"
          :input-value="activityId"
          placeholder="请输入活动id"
          @update:input-value="activityId = $event"
        />
        <CustomizedCard
          mode="name-input"
          name="道具id"
          :input-value="itemId"
          placeholder="请输入道具id"
          @update:input-value="itemId = $event"
        />

        <!-- 第三行：已用道具数量按钮，剩余道具数量按钮 -->
        <CustomizedCard
          mode="button-count"
          :name="`已用道具数量`"
          :count="usedItemCount"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="getUsedItems()"
        />
        <CustomizedCard
          mode="button-count"
          :name="`剩余道具数量`"
          :count="remainingItemCount"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="getRemainingItems()"
        />

        <!-- 第四行：切换阵2按钮，设置队伍按钮，开始按钮，战斗按钮 -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="切换阵2"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="switchToTeam2()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="设置队伍"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="setTeam()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="开始"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="startTower()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="战斗"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="fightTower()"
        />
        <CustomizedCard
          mode="name-select"
          name="BOSS选择"
          :select-value="bossSelect"
          :select-options="bossOptions"
          @update:select-value="bossSelect = $event"
        />
        <CustomizedCard
          mode="button-count"
          :name="`活动详情`"
          :count="activityCount"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="getActivityCount()"
        />

        <!-- 第五行：一键战斗按钮 -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="一键战斗"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="oneKeyBattle()"
        />

        <!-- 第六行：使用道具按钮，领取道具奖励按钮 -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="使用道具"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning || !activityId"
          @button-click="useItem()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="领取道具奖励"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning || !activityId"
          @button-click="claimItemReward()"
        />

        <!-- 第六行：一键活动按钮 -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="一键活动"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="oneKeyActivity()"
        />

        <!-- 第七行：福币数量按钮 -->
        <CustomizedCard
          mode="button-count"
          :name="`福币数量`"
          :count="fuCoinCount"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="getFuCoinCount()"
        />

        <!-- 第八行：使用福币按钮 -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="使用福币"
          :disabled="!selectedTokenId || connectingTokens.has(selectedTokenId) || isRunning"
          @button-click="useFuCoin()"
        />
      </CustomizedCard>
      
      <!-- 新增容器：执行范围及批量操作 -->
      <CustomizedCard mode="container">
        <CustomizedCard
          mode="execution-range"
          name="执行范围"
          :input-value="executionRange"
          placeholder="请输入执行范围，如：1-20 或 3,4,5"
          @update:input-value="executionRange = $event"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="批量战斗"
          :disabled="isRunning"
          @button-click="batchBattle()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="批量活动"
          :disabled="isRunning"
          @button-click="batchActivity()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="批量使用福币"
          :disabled="isRunning"
          @button-click="batchUseFuCoin()"
        />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="暑期活动"
        :filter-operations="[]"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { logOperation, logCommand } from "@/utils/operationLogger";
import MyCard from "../../components/Common/MyCard.vue";
import CustomizedCard from "../../diy/CustomizedCard.vue";
import OperationLogCard from "@/diy/ShiDian/OperationLogCard.vue";
import ConnectionPoolManager from "@/utils/connectionPoolManager";

const tokenStore = useTokenStore();
const message = useMessage();

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 30000,
  reconnectDelay: 1000,
  maxRetries: 3
});

// Token选项列表（按名称排序）
const tokenOptions = computed(() => {
  return tokenStore.gameTokens
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((token) => ({
      label: token.name,
      value: token.id,
    }));
});

// 连接中的Token（只包含正在连接状态的token）
const connectingTokens = computed(() => {
  return new Set(
    Object.values(tokenStore.wsConnections)
      .filter((conn) => tokenStore.getWebSocketStatus(conn.tokenId) === 'connecting')
      .map((conn) => conn.tokenId)
  );
});

// 选中的Token ID
const selectedTokenId = ref("");

// 监听全局token选择变化
watch(() => tokenStore.selectedTokenId, (newSelectedId) => {
  if (newSelectedId) {
    selectedTokenId.value = newSelectedId;
  }
}, { immediate: true });

// 是否正在运行
const isRunning = ref(false);

// 输入框值
const freeGoodsId = ref("");
const useFree = ref(false);
const activityId = ref("");
const itemId = ref("5264"); // 默认道具id
const executionRange = ref(""); // 执行范围
const bossSelect = ref(1); // BOSS选择，默认为1

// BOSS选项
const bossOptions = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 }
];

// 根据当前日期设置BOSS选择
const setBossByDate = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
  
  switch (dayOfWeek) {
    case 4: // 周四
    case 5: // 周五
      bossSelect.value = 1;
      break;
    case 6: // 周六
      bossSelect.value = 2;
      break;
    case 0: // 周日
      bossSelect.value = 3;
      break;
    case 1: // 周一
      bossSelect.value = 4;
      break;
    case 2: // 周二
      bossSelect.value = 5;
      break;
    case 3: // 周三
      bossSelect.value = 6;
      break;
  }
  
  console.log(`当前是星期${dayOfWeek}，自动设置BOSS为${bossSelect.value}`);
};

// 组件挂载时设置BOSS
setBossByDate();

// 显示信息
const usedItemCount = ref(0);
const remainingItemCount = ref(0);
const fuCoinCount = ref(0);
const activityCount = ref(0);

// 塔数据 - 用于存储各BOSS的maxWinCnt
const towerData = ref({
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
  '6': 0
});

// 获取已用道具数量
const getUsedItems = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  if (!activityId.value) {
    message.warning("请先输入活动id");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("获取已用道具数量...");
    const response = await logCommand(
      'shidian',
      '获取已用道具数量',
      selectedTokenId.value,
      tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
      'activity_getactegameinfo',
      { actId: Number(activityId.value) },
      tokenStore.sendActivityGetActeGameInfo(
        selectedTokenId.value,
        { actId: Number(activityId.value) }
      ),
      true,
      '暑期活动'
    );

    if (response && response.actEGame && response.actEGame.stageNum !== undefined) {
      usedItemCount.value = response.actEGame.stageNum;
      message.success(`已用道具数量: ${usedItemCount.value}`);
      console.log("已用道具数量:", usedItemCount.value);
    } else {
      message.warning("无法获取已用道具数量");
    }
  } catch (error) {
    console.error("获取已用道具数量失败:", error);
    message.error(`获取已用道具数量失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 获取剩余道具数量
const getRemainingItems = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  if (!itemId.value) {
    message.warning("请先输入道具id");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("获取剩余道具数量...");
    const response = await logCommand(
      'shidian',
      '获取剩余道具数量',
      selectedTokenId.value,
      tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
      'role_getroleinfo',
      {},
      tokenStore.sendGetRoleInfo(selectedTokenId.value),
      true,
      '暑期活动'
    );

    if (response && response.role && response.role.items) {
      const item = response.role.items[itemId.value];
      if (item) {
        remainingItemCount.value = item.quantity || 0;
        message.success(`剩余道具数量: ${remainingItemCount.value}`);
        console.log("剩余道具数量:", remainingItemCount.value);
      } else {
        remainingItemCount.value = 0;
        message.info("剩余道具数量: 0");
      }
    } else {
      message.warning("无法获取剩余道具数量");
    }
  } catch (error) {
    console.error("获取剩余道具数量失败:", error);
    message.error(`获取剩余道具数量失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 获取活动次数和BOSS信息
const getActivityCount = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("获取活动详情...");
    const response = await logCommand(
      'shidian',
      '获取活动详情',
      selectedTokenId.value,
      tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
      'towers_getinfo',
      {},
      tokenStore.sendTowersGetInfo(selectedTokenId.value),
      true,
      '暑期活动'
    );

    if (response && response.towerData) {
      // 更新活动次数
      if (response.towerData.todayUseTickCnt !== undefined) {
        activityCount.value = response.towerData.todayUseTickCnt;
      }
      
      // 更新各BOSS的maxWinCnt
      if (response.towerData.towerData) {
        for (let i = 1; i <= 6; i++) {
          const towerKey = i.toString();
          if (response.towerData.towerData[towerKey]) {
            towerData.value[towerKey] = response.towerData.towerData[towerKey].maxWinCnt || 0;
          } else {
            towerData.value[towerKey] = 0;
          }
        }
      }
      
      message.success(`活动次数: ${activityCount.value}`);
      console.log("活动详情:", { activityCount: activityCount.value, towerData: towerData.value });
    } else {
      message.warning("无法获取活动详情");
    }
  } catch (error) {
    console.error("获取活动详情失败:", error);
    message.error(`获取活动详情失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};



// 开始
const startTower = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("开始塔...");
    const response = await logCommand(
      'shidian',
      '开始塔',
      selectedTokenId.value,
      tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
      'towers_start',
      { towerType: bossSelect.value },
      tokenStore.sendTowersStart(selectedTokenId.value, { towerType: bossSelect.value }),
      true,
      '暑期活动'
    );
    message.success("开始成功");
    console.log("开始结果:", response);
  } catch (error) {
    console.error("开始失败:", error);
    message.error(`开始失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 战斗
const fightTower = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("战斗...");
    const response = await logCommand(
      'shidian',
      '战斗塔',
      selectedTokenId.value,
      tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
      'towers_fight',
      { towerType: bossSelect.value },
      tokenStore.sendTowersFight(selectedTokenId.value, { towerType: bossSelect.value }),
      true,
      '暑期活动'
    );
    
    // 检查是否有reward字段
    if (response && response.reward) {
      message.success("战斗胜利");
      console.log("战斗胜利，奖励:", response.reward);
    } else {
      message.warning("战斗失败");
      console.log("战斗失败");
    }
  } catch (error) {
    console.error("战斗失败:", error);
    message.error(`战斗失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 使用道具（内部函数，可以被一键活动调用）
const useItemInternal = async (tokenId, actId, itemIdValue) => {
  let currentQuantity = 0;
  
  // 先获取当前道具数量
  try {
    const roleInfo = await logCommand(
      'shidian',
      '使用道具-获取角色信息',
      tokenId,
      tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
      'role_getroleinfo',
      {},
      tokenStore.sendGetRoleInfo(tokenId),
      true,
      '暑期活动'
    );
    if (roleInfo && roleInfo.role && roleInfo.role.items && roleInfo.role.items[itemIdValue]) {
      currentQuantity = roleInfo.role.items[itemIdValue].quantity || 0;
    }
  } catch (error) {
    console.warn("获取道具数量失败:", error);
    return false;
  }

  console.log(`开始使用道具，当前数量: ${currentQuantity}`);

  while (currentQuantity > 0) {
    console.log(`当前道具数量: ${currentQuantity}，继续使用...`);
    
    try {
      const response = await logCommand(
        'shidian',
        '使用道具',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'activity_startegame',
        {
          actId: Number(actId),
          useItem: 1,
          itemId: Number(itemIdValue)
        },
        tokenStore.sendActivityStarteGame(
          tokenId,
          {
            actId: Number(actId),
            useItem: 1,
            itemId: Number(itemIdValue)
          }
        ),
        true,
        '暑期活动'
      );

      // 更新道具数量
      if (response && response.role && response.role.items && response.role.items[itemIdValue]) {
        currentQuantity = response.role.items[itemIdValue].quantity || 0;
        console.log(`使用后道具数量: ${currentQuantity}`);
      } else {
        // 如果响应中没有更新数量，尝试重新获取
        const roleInfo = await logCommand(
        'shidian',
        '一键活动-获取角色信息',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'role_getroleinfo',
        {},
        tokenStore.sendGetRoleInfo(tokenId),
        true,
        '暑期活动'
      );
        if (roleInfo && roleInfo.role && roleInfo.role.items && roleInfo.role.items[itemIdValue]) {
          currentQuantity = roleInfo.role.items[itemIdValue].quantity || 0;
        }
      }

      if (currentQuantity === 0) {
        console.log("道具数量为0，停止使用");
        break;
      }

      await new Promise((r) => setTimeout(r, 500)); // 间隔500ms
    } catch (error) {
      console.warn("使用道具失败:", error);
      break;
    }
  }

  return currentQuantity === 0;
};

// 使用道具
const useItem = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  if (!activityId.value) {
    message.warning("请先输入活动id");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    await useItemInternal(selectedTokenId.value, activityId.value, itemId.value);
    // 更新显示
    await getRemainingItems();
    message.success("使用道具完成");
  } catch (error) {
    console.error("使用道具失败:", error);
    message.error(`使用道具失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 领取道具奖励（内部函数，可以被一键活动调用）
const claimItemRewardInternal = async (tokenId, actId) => {
  // 先获取已用道具数量
  let usedCount = 0;
  try {
    const gameInfo = await logCommand(
      'shidian',
      '领取奖励-获取活动信息',
      tokenId,
      tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
      'activity_getactegameinfo',
      { actId: Number(actId) },
      tokenStore.sendActivityGetActeGameInfo(tokenId, { actId: Number(actId) }),
      true,
      '暑期活动'
    );
    if (gameInfo && gameInfo.actEGame && gameInfo.actEGame.stageNum !== undefined) {
      usedCount = gameInfo.actEGame.stageNum;
    }
  } catch (error) {
    console.warn("获取已用道具数量失败:", error);
    return false;
  }

  console.log(`开始领取道具奖励，已用道具数量: ${usedCount}`);

  while (true) {
    try {
      const response = await logCommand(
        'shidian',
        '领取奖励',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'activity_actegamestageclaim',
        {
          actId: Number(actId),
          stageNum: stageNum
        },
        tokenStore.sendActivityActeGameStageClaim(tokenId, {
          actId: Number(actId),
          stageNum: stageNum
        }),
        true,
        '暑期活动'
      );

      if (response && response.nextStageId) {
        // 去除前六位数字
        const nextStageIdStr = String(response.nextStageId);
        const stageNum = nextStageIdStr.length > 6 
          ? Number(nextStageIdStr.substring(6)) 
          : Number(nextStageIdStr);

        console.log(`nextStageId: ${response.nextStageId}, stageNum: ${stageNum}, usedCount: ${usedCount}`);

        if (stageNum < usedCount) {
          console.log(`stageNum (${stageNum}) < usedCount (${usedCount})，继续领取...`);
          await new Promise((r) => setTimeout(r, 500)); // 间隔500ms
        } else {
          console.log(`stageNum (${stageNum}) >= usedCount (${usedCount})，停止领取`);
          break;
        }
      } else {
        console.log("无法获取nextStageId，停止领取");
        break;
      }
    } catch (error) {
      console.warn("领取道具奖励失败:", error);
      break;
    }
  }

  return true;
};

// 领取道具奖励
const claimItemReward = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  if (!activityId.value) {
    message.warning("请先输入活动id");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    await claimItemRewardInternal(selectedTokenId.value, activityId.value);
    // 更新显示
    await getUsedItems();
    message.success("领取道具奖励完成");
  } catch (error) {
    console.error("领取道具奖励失败:", error);
    message.error(`领取道具奖励失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 一键活动（内部函数，可以被批量活动调用）
const oneKeyActivityInternal = async (tokenId, actId, itemIdValue, freeGoodsIdValue, useFreeValue, towerTypeValue) => {
  // 1. 如果使用免费打开，使用免费商品id作为goodsId，执行activity_commonbuygoods命令
  if (useFreeValue && freeGoodsIdValue) {
    try {
      console.log(`使用免费商品id: ${freeGoodsIdValue}`);
      await logCommand(
        'shidian',
        '一键活动-购买商品',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'activity_commonbuygoods',
        { goodsId: Number(freeGoodsIdValue) },
        tokenStore.sendActivityCommonBuyGoods(
          tokenId,
          { goodsId: Number(freeGoodsIdValue) }
        ),
        true,
        '暑期活动'
      );
      console.log("免费商品购买成功");
    } catch (error) {
      console.warn("免费商品购买失败，继续执行:", error);
    }
  }

  // 2. 模拟点击开始按钮，如果胜利，点击战斗按钮，如果失败点击开始按钮。连续失败4次，停止执行
  let consecutiveFailures = 0;
  const maxFailures = 4;

  while (consecutiveFailures < maxFailures) {
    console.log(`执行开始... (连续失败次数: ${consecutiveFailures})`);
    
    try {
      await logCommand(
        'shidian',
        '一键活动-开始塔',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'towers_start',
        { towerType: towerTypeValue },
        tokenStore.sendTowersStart(tokenId, { towerType: towerTypeValue }),
        true,
        '暑期活动'
      );
      await new Promise((r) => setTimeout(r, 500));

      // 模拟点击战斗按钮
      const fightResponse = await logCommand(
        'shidian',
        '一键活动-战斗塔',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'towers_fight',
        { towerType: towerTypeValue },
        tokenStore.sendTowersFight(tokenId, { towerType: towerTypeValue }),
        true,
        '暑期活动'
      );
      
      // 检查是否有reward字段
      if (fightResponse && fightResponse.reward) {
        console.log("战斗胜利");
        consecutiveFailures = 0; // 重置失败计数
        break; // 胜利后退出循环
      } else {
        console.log("战斗失败");
        consecutiveFailures++;
        if (consecutiveFailures >= maxFailures) {
          console.log(`连续失败${maxFailures}次，停止执行`);
          return false;
        }
      }
    } catch (error) {
      console.warn("开始/战斗失败:", error);
      consecutiveFailures++;
      if (consecutiveFailures >= maxFailures) {
        console.log(`连续失败${maxFailures}次，停止执行`);
        return false;
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  // 3. 循环执行模拟点击使用道具按钮，模拟点击领取道具奖励按钮，直到道具数量为0
  if (!actId || !itemIdValue) {
    console.log("活动id或道具id为空，跳过使用道具和领取奖励");
    return true;
  }

  while (true) {
    // 获取当前道具数量
    let currentQuantity = 0;
    try {
      const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
      if (roleInfo && roleInfo.role && roleInfo.role.items && roleInfo.role.items[itemIdValue]) {
        currentQuantity = roleInfo.role.items[itemIdValue].quantity || 0;

        if (currentQuantity === 0) {
          console.log("道具数量为0，停止执行");
          break;
        }
      } else {
        console.log("无法获取道具数量，停止执行");
        break;
      }
    } catch (error) {
      console.warn("获取道具数量失败:", error);
      break;
    }

    // 模拟点击使用道具按钮（使用内部函数）
    try {
      const useSuccess = await useItemInternal(tokenId, actId, itemIdValue);
      if (!useSuccess) {
        console.log("使用道具失败或道具已用完");
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.warn("使用道具失败:", error);
      break;
    }

    // 模拟点击领取道具奖励按钮（使用内部函数）
    try {
      await claimItemRewardInternal(tokenId, actId);
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.warn("领取道具奖励失败:", error);
      break;
    }
  }

  return true;
};

// 一键活动
const oneKeyActivity = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    const success = await oneKeyActivityInternal(
      selectedTokenId.value,
      activityId.value,
      itemId.value,
      freeGoodsId.value,
      useFree.value,
      bossSelect.value
    );
    
    if (success) {
      message.success("一键活动完成");
      const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value);
      logOperation('shidian', '一键活动', {
        cardType: '暑期活动',
        tokenId: selectedTokenId.value,
        tokenName: token?.name,
        status: 'success',
        message: '一键活动完成'
      });
    } else {
      message.warning("一键活动部分完成（连续失败4次）");
      const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value);
      logOperation('shidian', '一键活动', {
        cardType: '暑期活动',
        tokenId: selectedTokenId.value,
        tokenName: token?.name,
        status: 'warning',
        message: '一键活动部分完成（连续失败4次）'
      });
    }
  } catch (error) {
    console.error("一键活动失败:", error);
    message.error(`一键活动失败: ${error.message || error}`);
    const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value);
    logOperation('shidian', '一键活动', {
      cardType: '暑期活动',
      tokenId: selectedTokenId.value,
      tokenName: token?.name,
      status: 'error',
      message: `一键活动失败: ${error.message || error}`
    });
  } finally {
    isRunning.value = false;
  }
};

// 批量活动
// 一键战斗内部函数（供批量使用）
const oneKeyBattleInternal = async (tokenId, towerTypeValue) => {
  // 1. 切换到阵容2
  console.log("正在切换到阵容2...");
  await switchToTeam2(tokenId);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 2. 使用fight_startlevel获取当前阵容
  console.log("正在获取当前阵容信息...");
  const fightResult = await logCommand(
    'shidian',
    '一键战斗-开始关卡',
    tokenId,
    tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
    'fight_startlevel',
    {},
    tokenStore.sendFightStartLevel(tokenId, {}),
    true,
    '暑期活动'
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 3. 设置队伍
  console.log("正在设置队伍...");
  await setTeam(tokenId);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 4. 获取活动次数
  console.log("正在获取活动次数...");
  let todayUseTickCnt = 0;
  try {
    const towersInfo = await logCommand(
      'shidian',
      '一键战斗-获取活动次数',
      tokenId,
      tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
      'towers_getinfo',
      {},
      tokenStore.sendTowersGetInfo(tokenId),
      true,
      '暑期活动'
    );
    if (towersInfo && towersInfo.towerData && towersInfo.towerData.todayUseTickCnt !== undefined) {
      todayUseTickCnt = towersInfo.towerData.todayUseTickCnt;
      console.log(`活动次数: ${todayUseTickCnt}`);
    }
  } catch (error) {
    console.warn("获取活动次数失败:", error);
  }

  // 5. 检查活动次数，如果大于7次，跳过执行
  if (todayUseTickCnt > 7) {
    console.log(`活动次数(${todayUseTickCnt})大于7次，跳过执行开始、战斗循环`);
    return true;
  }

  // 6. 执行战斗逻辑
  let startClickCount = 0;
  const maxStartClicks = 8;

  while (startClickCount < maxStartClicks) {
    console.log(`执行开始... (点击次数: ${startClickCount + 1})`);
    
    try {
      // 发送 towers_start 命令开始挑战
      const startResponse = await logCommand(
        'shidian',
        '一键战斗-开始塔',
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'towers_start',
        { towerType: towerTypeValue },
        tokenStore.sendTowersStart(tokenId, { towerType: towerTypeValue }),
        true,
        '暑期活动'
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (startError) {
      // 开始按钮点击失败，但继续执行
      console.log("开始按钮点击失败，但继续执行");
    }

    // 无论开始按钮是否成功，都连续点击战斗按钮最多10次
    console.log("开始连续点击战斗按钮，最多10次");
    let fightAttempts = 0;
    const maxFightAttempts = 10;
    
    while (fightAttempts < maxFightAttempts) {
      try {
        // 发送 towers_fight 命令进行战斗
        const fightResponse = await logCommand(
          'shidian',
          '一键战斗-战斗塔',
          tokenId,
          tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
          'towers_fight',
          { towerType: towerTypeValue },
          tokenStore.sendTowersFight(tokenId, { towerType: towerTypeValue }),
          true,
          '暑期活动'
        );
        console.log(`战斗执行完成 (第${fightAttempts + 1}次)`);
        
        // 战斗成功后继续下一次战斗
        fightAttempts++;
        if (fightAttempts < maxFightAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // 每次操作间延迟500ms
        }
      } catch (fightError) {
        console.log(`战斗按钮点击失败，跳转到执行模拟点击开始按钮`);
        // 战斗按钮失败，跳转到执行开始按钮逻辑
        break; // 跳出战斗循环，进入下一个开始按钮循环
      }
    }

    // 如果是因为战斗失败跳出循环，增加开始按钮点击计数
    if (fightAttempts < maxFightAttempts) {
      startClickCount++;
    } else {
      // 如果是完成了所有战斗尝试，也增加开始按钮点击计数
      startClickCount++;
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // 每次操作间延迟500ms
  }

  return true;
};

const batchActivity = async () => {
  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase();
    const nameB = (b.name || '未命名').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  if (sortedTokensList.length === 0) {
    message.warning("没有可用的Token");
    return;
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value);
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices);
  
  if (targetTokens.length === 0) {
    message.warning("执行范围内没有有效的Token");
    return;
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id);
    return index + 1;
  };
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部";
  message.info(`开始批量活动（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`);
  logOperation('shidian', '批量活动', {
    cardType: '暑期活动',
    status: 'info',
    message: `开始批量活动，${rangeText}，共${targetTokens.length}个Token`
  });

  isRunning.value = true;
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token);
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行一键战斗...`);
          
          // 执行一键战斗（使用内部函数，避免isRunning冲突）
          const success = await oneKeyBattleInternal(token.id, bossSelect.value);
          
          if (success) {
            console.log(`Token ${token.name} 一键战斗成功`);
            logOperation('shidian', '批量活动', {
              cardType: '暑期活动',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '一键战斗完成'
            });
            return { success: true, token: token };
          } else {
            console.log(`Token ${token.name} 一键战斗部分失败`);
            logOperation('shidian', '批量活动', {
              cardType: '暑期活动',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: '一键战斗部分失败'
            });
            return { success: false, token: token, error: '一键战斗部分失败' };
          }
        } catch (error) {
          console.error(`Token ${token.name} 一键战斗失败:`, error);
          logOperation('shidian', '批量活动', {
            cardType: '暑期活动',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `一键战斗失败: ${error.message || error}`
          });
          return { success: false, token: token, error: error.message || error };
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`);
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`);
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`);
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`);
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`);
            }
          }
        }
      }
    );

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const failedTokens = results.filter(r => !r.success).map(r => r.token.name);

    if (failCount > 0) {
      const failedTokensStr = failedTokens.join('、');
      message.success(`批量活动完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`);
      logOperation('shidian', '批量活动', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量活动完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`
      });
    } else {
      message.success(`批量活动完成：成功${successCount}个，失败${failCount}个`);
      logOperation('shidian', '批量活动', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量活动完成：成功${successCount}个，失败${failCount}个`
      });
    }
  } catch (error) {
    console.error("批量活动失败:", error);
    message.error(`批量活动失败: ${error.message || error}`);
    logOperation('shidian', '批量活动', {
      cardType: '暑期活动',
      status: 'error',
      message: `批量活动失败: ${error.message || error}`
    });
  } finally {
    isRunning.value = false;
  }
};

// 获取福币数量
const getFuCoinCount = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("获取福币数量...");
    const response = await logCommand(
      'shidian',
      '获取福币数量',
      selectedTokenId.value,
      tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
      'role_getroleinfo',
      {},
      tokenStore.sendGetRoleInfo(selectedTokenId.value),
      true,
      '暑期活动'
    );

    if (response && response.role && response.role.items) {
      const itemId = "40004"; // 福币的物品ID
      const item = response.role.items[itemId];
      if (item) {
        fuCoinCount.value = item.quantity || 0;
        message.success(`福币数量: ${fuCoinCount.value}`);
        console.log("福币数量:", fuCoinCount.value);
      } else {
        fuCoinCount.value = 0;
        message.info("福币数量: 0");
      }
    } else {
      message.warning("无法获取福币数量");
    }
  } catch (error) {
    console.error("获取福币数量失败:", error);
    message.error(`获取福币数量失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 使用福币
const useFuCoin = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    console.log("使用福币...");
    
    // 首先获取当前福币数量
    await getFuCoinCount();
    
    // 循环使用福币直到数量为0
    while (fuCoinCount.value > 0) {
      // 检查连接状态
      const currentConnectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
      if (currentConnectionStatus !== 'connected') {
        message.error("连接已断开，停止使用福币");
        break;
      }
      
      let timesToUse = 0;
      
      // 如果福币数量大于等于10，使用times:10，否则使用times:1
      if (fuCoinCount.value >= 10) {
        timesToUse = 10;
      } else {
        timesToUse = 1;
      }
      
      try {
        console.log(`执行activity_maydaylottery，使用times: ${timesToUse}`);
        const response = await logCommand(
          'shidian',
          `使用福币-${timesToUse}次`,
          selectedTokenId.value,
          tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
          'activity_maydaylottery',
          { times: timesToUse },
          tokenStore.sendActivityMaydaylottery(
            selectedTokenId.value,
            { times: timesToUse }
          ),
          true,
          '暑期活动'
        );
        
        console.log(`福币抽奖结果:`, response);
        
        // 执行成功后，减少福币数量
        fuCoinCount.value = Math.max(0, fuCoinCount.value - timesToUse);
        
        // 显示当前福币数量
        message.info(`福币数量: ${fuCoinCount.value}`);
        
        // 等待一段时间避免请求过于频繁
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`使用福币${timesToUse}次失败:`, error);
        message.error(`使用福币失败: ${error.message || error}`);
        
        // 如果是服务器错误，可以尝试获取最新福币数量再决定是否继续
        try {
          await getFuCoinCount();
        } catch (refreshError) {
          console.error("刷新福币数量失败:", refreshError);
        }
        
        // 如果福币数量为0，跳出循环
        if (fuCoinCount.value <= 0) {
          break;
        }
      }
    }
    
    message.success(`福币使用完毕，最终福币数量: ${fuCoinCount.value}`);
  } catch (error) {
    console.error("使用福币失败:", error);
    message.error(`使用福币失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};



// 获取按名称排序的tokens列表
const getSortedTokens = () => {
  return tokenStore.gameTokens
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
};

// 解析执行范围字符串，支持两种格式：1-20 或 3,4,5
const parseExecutionRange = (rangeStr) => {
  if (!rangeStr) return [];
  
  // 检查是否为范围格式（如 "1-20"）
  const rangeMatch = rangeStr.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }
  
  // 检查是否为列表格式（如 "1,2,3"）
  const listMatch = rangeStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return listMatch.map(s => parseInt(s)).filter(n => !isNaN(n));
};

// 批量五一活动
const batchMayDayActivity = async () => {
  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  // 解析执行范围，如果留空则表示全部执行
  let rangeIndices = parseExecutionRange(executionRange.value);
  if (rangeIndices.length === 0) {
    // 如果执行范围为空，获取所有token的索引
    const allTokens = getSortedTokens();
    if (allTokens.length === 0) {
      message.warning("没有可用的Token");
      return;
    }
    rangeIndices = Array.from({ length: allTokens.length }, (_, i) => i + 1);
  }

  isRunning.value = true;
  try {
    console.log("开始批量五一活动（使用福币）...");
    const tokens = getSortedTokens(); // 使用按名称排序的tokens
    let successCount = 0;
    let failCount = 0;
    const failedTokens = []; // 存储失败的token昵称

    // 根据执行范围处理指定的tokens
    for (const index of rangeIndices) {
      // 检查索引是否有效
      if (index < 1 || index > tokens.length) {
        console.log(`Token索引 ${index} 超出范围，跳过`);
        continue;
      }
      
      const token = tokens[index - 1]; // 数组索引从0开始
      console.log(`处理Token: ${token.name} (${token.id})，索引: ${index}`);
      
      // 模拟点击token昵称，使用重试机制
      let retryCount = 0;
      const maxRetries = 5;
      let connected = false;

      while (retryCount < maxRetries && !connected) {
        try {
          tokenStore.selectToken(token.id);
          await new Promise((r) => setTimeout(r, 1000)); // 等待1秒

          const status = tokenStore.getWebSocketStatus(token.id);
          if (status === 'connected') {
            console.log(`Token ${token.name} 连接成功`);
            connected = true;
            
            // 等待一下确保连接稳定
            await new Promise((r) => setTimeout(r, 500));
            
            // 执行使用福币功能（使用内部函数，避免isRunning冲突）
            try {
              const success = await useFuCoinInternal(token.id);
              if (success) {
                successCount++;
                console.log(`Token ${token.name} 使用福币成功`);
                logOperation('shidian', '批量五一', {
                  cardType: '暑期活动',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: '使用福币完成'
                });
              } else {
                failCount++;
                failedTokens.push(token.name);
                console.log(`Token ${token.name} 使用福币部分失败`);
                logOperation('shidian', '批量五一', {
                  cardType: '暑期活动',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: '使用福币部分失败'
                });
              }
            } catch (error) {
              console.error(`Token ${token.name} 使用福币失败:`, error);
              failCount++;
              failedTokens.push(token.name);
              logOperation('shidian', '批量五一', {
                cardType: '暑期活动',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `使用福币失败: ${error.message || error}`
              });
            }
          } else {
            retryCount++;
            console.log(`Token ${token.name} 连接失败，重试 ${retryCount}/${maxRetries}`);
          }
        } catch (error) {
          retryCount++;
          console.error(`Token ${token.name} 连接错误，重试 ${retryCount}/${maxRetries}:`, error);
        }
      }

      if (!connected) {
        console.log(`Token ${token.name} 连接失败，跳过`);
        failCount++;
        failedTokens.push(token.name);
      }

      // 每个token之间间隔一下
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (failCount > 0) {
      const failedTokensStr = failedTokens.join('、');
      message.success(`批量五一活动完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`);
      logOperation('shidian', '批量五一', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量五一活动完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`
      });
    } else {
      message.success(`批量五一活动完成：成功${successCount}个，失败${failCount}个`);
      logOperation('shidian', '批量五一', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量五一活动完成：成功${successCount}个，失败${failCount}个`
      });
    }
  } catch (error) {
    console.error("批量五一活动失败:", error);
    message.error(`批量五一活动失败: ${error.message || error}`);
    logOperation('shidian', '批量五一', {
      cardType: '暑期活动',
      status: 'error',
      message: `批量五一活动失败: ${error.message || error}`
    });
  } finally {
    isRunning.value = false;
  }
};

// 使用福币内部函数（供批量使用）
const useFuCoinInternal = async (tokenId) => {
  console.log(`执行Token ${tokenId} 的使用福币...`);
  
  // 获取当前福币数量
  let currentFuCoinCount = 0;
  try {
    // 调用获取福币数量的逻辑
    const response = await tokenStore.sendGetRoleInfo(tokenId);
    if (response && response.role && response.role.items) {
      const fuCoinItem = response.role.items['5264']; // 假设福币的ID是5264
      currentFuCoinCount = fuCoinItem ? fuCoinItem.quantity || 0 : 0;
    }
  } catch (error) {
    console.error(`获取Token ${tokenId} 福币数量失败:`, error);
    return false;
  }
  
  // 循环使用福币直到数量为0
  while (currentFuCoinCount > 0) {
    // 检查连接状态
    const currentConnectionStatus = tokenStore.getWebSocketStatus(tokenId);
    if (currentConnectionStatus !== 'connected') {
      console.error(`Token ${tokenId} 连接已断开，停止使用福币`);
      return false;
    }
    
    let timesToUse = 0;
    
    // 如果福币数量大于等于10，使用times:10，否则使用times:1
    if (currentFuCoinCount >= 10) {
      timesToUse = 10;
    } else {
      timesToUse = 1;
    }
    
    try {
      console.log(`执行activity_maydaylottery，使用times: ${timesToUse}`);
      const response = await logCommand(
        'shidian',
        `使用福币-${timesToUse}次`,
        tokenId,
        tokenStore.gameTokens.find(t => t.id === tokenId)?.name || '',
        'activity_maydaylottery',
        { times: timesToUse },
        tokenStore.sendActivityMaydaylottery(tokenId, { times: timesToUse }),
        true,
        '暑期活动'
      );
      
      console.log(`Token ${tokenId} 使用福币成功`, response);
      
      // 更新福币数量
      currentFuCoinCount = Math.max(0, currentFuCoinCount - timesToUse);
      
      // 延迟一段时间再继续
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Token ${tokenId} 使用福币失败:`, error);
      // 如果是服务器错误，可以尝试获取最新福币数量再决定是否继续
      try {
        const refreshResponse = await tokenStore.sendGetRoleInfo(tokenId);
        if (refreshResponse && refreshResponse.role && refreshResponse.role.items) {
          const fuCoinItem = refreshResponse.role.items['5264'];
          currentFuCoinCount = fuCoinItem ? fuCoinItem.quantity || 0 : 0;
        }
      } catch (refreshError) {
        console.error("刷新福币数量失败:", refreshError);
      }
      
      // 如果福币数量为0，跳出循环
      if (currentFuCoinCount <= 0) {
        break;
      }
    }
  }
  
  console.log(`Token ${tokenId} 福币使用完毕，最终福币数量: ${currentFuCoinCount}`);
  return true;
};

// 一键战斗
const oneKeyBattle = async () => {
  if (!selectedTokenId.value) {
    message.warning("请先选择Token");
    return;
  }

  const connectionStatus = tokenStore.getWebSocketStatus(selectedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    // 获取当前日期，判断是否为周四
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日, 1=周一, ..., 4=周四, 5=周五, 6=周六
    
    if (dayOfWeek === 4) { // 周四
      console.log("今天是周四，执行周四特定逻辑");
      
      // 获取塔数据
      console.log("正在获取塔数据...");
      let towersInfo = null;
      try {
        towersInfo = await logCommand(
          'shidian',
          '一键战斗-获取塔数据(周四)',
          selectedTokenId.value,
          tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
          'towers_getinfo',
          {},
          tokenStore.sendTowersGetInfo(selectedTokenId.value),
          true,
          '暑期活动'
        );
      } catch (error) {
        console.error("获取塔数据失败:", error);
        message.error("获取塔数据失败");
        return;
      }

      if (!towersInfo || !towersInfo.towerData || !towersInfo.towerData.towerData) {
        message.error("无法获取塔数据");
        return;
      }

      // 计算X：BOSSes with maxWinCnt=0 的数量
      let x = 0; // 计数器
      for (let i = 1; i <= 6; i++) {
        const towerKey = i.toString();
        if (towersInfo.towerData.towerData[towerKey] && 
            towersInfo.towerData.towerData[towerKey].maxWinCnt === 0) {
          x++;
        }
      }
      
      if (x === 0) {
        message.warning("没有maxWinCnt为0的BOSS，跳过执行");
        return;
      }

      // 计算Y = Math.floor(11/X)
      const y = Math.floor(11 / x);
      
      console.log(`X(0胜场BOSS数): ${x}, Y(每BOSS执行次数): ${y}`);
      
      // 模拟点击暑期活动子卡片切换阵2按钮
      console.log("正在切换到阵容2...");
      await switchToTeam2(selectedTokenId.value);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 使用fight_startlevel获取当前阵容
      console.log("正在获取当前阵容信息...");
      const fightResult = await logCommand(
        'shidian',
        '一键战斗-开始关卡',
        selectedTokenId.value,
        tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
        'fight_startlevel',
        {},
        tokenStore.sendFightStartLevel(selectedTokenId.value, {}),
        true,
        '暑期活动'
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟点击设置队伍按钮，使用fight_startlevel获取的heroId
      console.log("正在设置队伍...");
      await setTeam(selectedTokenId.value);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 遍历每个BOSS，执行 towers_start 和 towers_fight
      for (let i = 1; i <= 6; i++) {
        const towerKey = i.toString();
        const isLastBoss = (i === 6);
        
        // 检查当前BOSS是否maxWinCnt为0
        if (towersInfo.towerData.towerData[towerKey] && 
            towersInfo.towerData.towerData[towerKey].maxWinCnt === 0) {
          
          let executions = y; // 默认执行Y次
          
          // 如果是最后一个BOSS，计算特殊执行次数
          if (isLastBoss) {
            executions = 11 - ((x - 1) * y);
            console.log(`最后一个BOSS ${i} 执行 ${executions} 次`);
          } else {
            console.log(`BOSS ${i} 执行 ${executions} 次`);
          }
          
          // 执行 towers_start 和 towers_fight 指定次数
          for (let j = 0; j < executions; j++) {
            console.log(`BOSS ${i} - 执行第 ${j + 1}/${executions} 次`);
            
            try {
              // 执行 towers_start
              await logCommand(
                'shidian',
                `一键战斗-开始塔-${i}`,
                selectedTokenId.value,
                tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
                'towers_start',
                { towerType: i },
                tokenStore.sendTowersStart(selectedTokenId.value, { towerType: i }),
                true,
                '暑期活动'
              );
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (startError) {
              console.log(`BOSS ${i} towers_start 失败，继续执行:`, startError);
            }
            
            try {
              // 执行 towers_fight
              await logCommand(
                'shidian',
                `一键战斗-战斗塔-${i}`,
                selectedTokenId.value,
                tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
                'towers_fight',
                { towerType: i },
                tokenStore.sendTowersFight(selectedTokenId.value, { towerType: i }),
                true,
                '暑期活动'
              );
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (fightError) {
              console.log(`BOSS ${i} towers_fight 失败，继续执行:`, fightError);
            }
          }
        }
      }
    } else {
      // 非周四逻辑 - 原有逻辑
      // 1. 模拟点击活动详情按钮
      console.log("正在获取活动详情...");
      let todayUseTickCnt = 0;
      try {
        const towersInfo = await logCommand(
          'shidian',
          '一键战斗-获取活动详情',
          selectedTokenId.value,
          tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
          'towers_getinfo',
          {},
          tokenStore.sendTowersGetInfo(selectedTokenId.value),
          true,
          '暑期活动'
        );
        if (towersInfo && towersInfo.towerData && towersInfo.towerData.todayUseTickCnt !== undefined) {
          todayUseTickCnt = towersInfo.towerData.todayUseTickCnt;
          activityCount.value = todayUseTickCnt;
          console.log(`活动详情: ${todayUseTickCnt}`);
        }
      } catch (error) {
        console.warn("获取活动详情失败:", error);
      }

      // 2. 检查活动次数，如果大于7次，跳过执行
      if (todayUseTickCnt > 7) {
        console.log(`活动详情(${todayUseTickCnt})大于7次，跳过执行开始、战斗循环`);
        message.info(`活动详情(${todayUseTickCnt})大于7次，跳过执行`);
        return;
      }

      // 3. 获取塔数据并检查当前BOSS的maxWinCnt
      console.log("正在获取塔数据...");
      let currentBossMaxWinCnt = 0;
      try {
        const towersInfo = await logCommand(
          'shidian',
          '一键战斗-获取塔数据',
          selectedTokenId.value,
          tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
          'towers_getinfo',
          {},
          tokenStore.sendTowersGetInfo(selectedTokenId.value),
          true,
          '暑期活动'
        );
        if (towersInfo && towersInfo.towerData && towersInfo.towerData.towerData) {
          const currentTowerKey = bossSelect.value.toString();
          if (towersInfo.towerData.towerData[currentTowerKey]) {
            currentBossMaxWinCnt = towersInfo.towerData.towerData[currentTowerKey].maxWinCnt || 0;
            console.log(`当前BOSS ${bossSelect.value} 的maxWinCnt: ${currentBossMaxWinCnt}`);
          }
        }
      } catch (error) {
        console.warn("获取塔数据失败:", error);
      }

      // 4. 检查当前BOSS的maxWinCnt，如果大于5，跳过执行
      if (currentBossMaxWinCnt > 5) {
        console.log(`当前BOSS ${bossSelect.value} 的maxWinCnt(${currentBossMaxWinCnt})大于5，跳过执行`);
        message.info(`当前BOSS ${bossSelect.value} 的maxWinCnt(${currentBossMaxWinCnt})大于5，跳过执行`);
        return;
      }

      // 5. 模拟点击暑期活动子卡片切换阵2按钮
      console.log("正在切换到阵容2...");
      await switchToTeam2(selectedTokenId.value);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. 使用fight_startlevel获取当前阵容
      console.log("正在获取当前阵容信息...");
      const fightResult = await logCommand(
        'shidian',
        '一键战斗-开始关卡',
        selectedTokenId.value,
        tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
        'fight_startlevel',
        {},
        tokenStore.sendFightStartLevel(selectedTokenId.value, {}),
        true,
        '暑期活动'
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. 模拟点击设置队伍按钮，使用fight_startlevel获取的heroId
      console.log("正在设置队伍...");
      await setTeam(selectedTokenId.value);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 6. 模拟点击开始按钮，如果提示服务器错误，不停止执行，一直模拟点击战斗按钮，最多执行10次。
      // 如果某一次战斗按钮提示服务器错误，跳转到执行模拟点击开始按钮，直到点击8次点击开始按钮，停止执行。
      // 不再判断HP
      let startClickCount = 0;
      const maxStartClicks = 8;

      while (startClickCount < maxStartClicks) {
        console.log(`执行开始... (点击次数: ${startClickCount + 1})`);
        
        try {
          // 发送 towers_start 命令开始挑战
          const startResponse = await logCommand(
              'shidian',
              '一键战斗-开始塔',
              selectedTokenId.value,
              tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
              'towers_start',
              { towerType: bossSelect.value },
              tokenStore.sendTowersStart(selectedTokenId.value, { towerType: bossSelect.value }),
              true,
              '暑期活动'
            );
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (startError) {
          // 开始按钮点击失败，但不停止执行
          console.log("开始按钮点击失败，但继续执行");
        }

        // 无论开始按钮是否成功，都连续点击战斗按钮最多10次
        console.log("开始连续点击战斗按钮，最多10次");
        let fightAttempts = 0;
        const maxFightAttempts = 10;
        
        while (fightAttempts < maxFightAttempts) {
          try {
            // 发送 towers_fight 命令进行战斗
            const fightResponse = await logCommand(
              'shidian',
              '一键战斗-战斗塔',
              selectedTokenId.value,
              tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)?.name || '',
              'towers_fight',
              { towerType: bossSelect.value },
              tokenStore.sendTowersFight(selectedTokenId.value, { towerType: bossSelect.value }),
              true,
              '暑期活动'
            );
            console.log(`战斗执行完成 (第${fightAttempts + 1}次)`);
            
            // 战斗成功后继续下一次战斗
            fightAttempts++;
            if (fightAttempts < maxFightAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 500)); // 每次操作间延迟500ms
            }
          } catch (fightError) {
            console.log(`战斗按钮点击失败，跳转到执行模拟点击开始按钮`);
            // 战斗按钮失败，跳转到执行开始按钮逻辑
            break; // 跳出战斗循环，进入下一个开始按钮循环
          }
        }

        // 如果是因为战斗失败跳出循环，增加开始按钮点击计数
        if (fightAttempts < maxFightAttempts) {
          startClickCount++;
        } else {
          // 如果是完成了所有战斗尝试，也增加开始按钮点击计数
          startClickCount++;
        }

        await new Promise((resolve) => setTimeout(resolve, 500)); // 每次操作间延迟500ms
      }
    }

    message.success("一键战斗完成");
  } catch (error) {
    console.error("一键战斗失败:", error);
    message.error(`一键战斗失败: ${error.message || error}`);
  } finally {
    isRunning.value = false;
  }
};

// 批量战斗（功能稍后添加）
const batchBattle = async () => {
  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase();
    const nameB = (b.name || '未命名').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  if (sortedTokensList.length === 0) {
    message.warning("没有可用的Token");
    return;
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value);
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices);
  
  if (targetTokens.length === 0) {
    message.warning("执行范围内没有有效的Token");
    return;
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id);
    return index + 1;
  };
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部";
  message.info(`开始批量战斗（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`);
  logOperation('shidian', '批量战斗', {
    cardType: '暑期活动',
    status: 'info',
    message: `开始批量战斗，${rangeText}，共${targetTokens.length}个Token`
  });

  isRunning.value = true;
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token);
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行一键战斗...`);
          
          // 执行一键战斗（使用内部函数，避免isRunning冲突）
          const success = await oneKeyBattleInternal(token.id, bossSelect.value);
          
          if (success) {
            console.log(`Token ${token.name} 一键战斗成功`);
            logOperation('shidian', '批量战斗', {
              cardType: '暑期活动',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '一键战斗完成'
            });
            return { success: true, token: token };
          } else {
            console.log(`Token ${token.name} 一键战斗部分失败`);
            logOperation('shidian', '批量战斗', {
              cardType: '暑期活动',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: '一键战斗部分失败'
            });
            return { success: false, token: token, error: '一键战斗部分失败' };
          }
        } catch (error) {
          console.error(`Token ${token.name} 一键战斗失败:`, error);
          logOperation('shidian', '批量战斗', {
            cardType: '暑期活动',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `一键战斗失败: ${error.message || error}`
          });
          return { success: false, token: token, error: error.message || error };
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`);
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`);
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`);
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`);
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`);
            }
          }
        }
      }
    );

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const failedTokens = results.filter(r => !r.success).map(r => r.token.name);

    if (failCount > 0) {
      const failedTokensStr = failedTokens.join('、');
      message.success(`批量战斗完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`);
      logOperation('shidian', '批量战斗', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量战斗完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`
      });
    } else {
      message.success(`批量战斗完成：成功${successCount}个，失败${failCount}个`);
      logOperation('shidian', '批量战斗', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量战斗完成：成功${successCount}个，失败${failCount}个`
      });
    }
  } catch (error) {
    console.error("批量战斗失败:", error);
    message.error(`批量战斗失败: ${error.message || error}`);
    logOperation('shidian', '批量战斗', {
      cardType: '暑期活动',
      status: 'error',
      message: `批量战斗失败: ${error.message || error}`
    });
  } finally {
    isRunning.value = false;
  }
};

// 切换到阵容2
const switchToTeam2 = async (tokenId = null) => {
  const actualTokenId = tokenId || selectedTokenId.value;
  if (!actualTokenId) {
    message.warning('请先选择Token');
    return;
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === actualTokenId);
  if (!token) {
    message.error('Token不存在');
    return;
  }
  
  const status = tokenStore.getWebSocketStatus(actualTokenId);
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token');
    return;
  }
  
  try {
    message.info('正在切换阵容2...');
    
    await logCommand(
      'shidian',
      '一键战斗-设置队伍',
      actualTokenId,
      tokenStore.gameTokens.find(t => t.id === actualTokenId)?.name || '',
      'presetteam_saveteam',
      { teamId: 2 },
      tokenStore.sendPresetteamSaveTeam(actualTokenId, { teamId: 2 }),
      true,
      '暑期活动'
    );
    
    // 如果需要更新当前使用的阵容ID，可以在这里设置
    // currentUseTeamId.value = 2;  // 如果有这个变量的话
    
    message.success('已切换到阵容2');
  } catch (error) {
    console.error('切换阵容失败:', error);
    message.error(`切换阵容失败: ${error.message || '未知错误'}`);
  }
};

// 设置队伍（助）
const setTeam = async (tokenId = null) => {
  const actualTokenId = tokenId || selectedTokenId.value;
  if (!actualTokenId) {
    message.warning("请先选择Token");
    return;
  }

  const status = tokenStore.getWebSocketStatus(actualTokenId);
  if (status !== 'connected') {
    message.error("WebSocket未连接，请先连接Token");
    return;
  }

  try {
    // 1. 切换阵容2（如果失败，继续执行后续操作）
    console.log("切换阵容2...");
    try {
      await logCommand(
      'shidian',
      '切换阵2',
      actualTokenId,
      tokenStore.gameTokens.find(t => t.id === actualTokenId)?.name || '',
      'presetteam_saveteam',
      { teamId: 2 },
      tokenStore.sendPresetteamSaveTeam(actualTokenId, { teamId: 2 }),
      true,
      '暑期活动'
    );
      // 等待一下确保切换完成
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("切换阵容2成功");
    } catch (switchError) {
      console.warn("切换阵容2失败，继续执行后续操作:", switchError);
      // 切换失败时也等待一下，可能当前已经是阵容1
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 2. 获取当前阵容信息
    console.log("获取阵容信息...");
    const teamInfoResponse = await logCommand(
      'shidian',
      '设置队伍-获取阵容信息',
      actualTokenId,
      tokenStore.gameTokens.find(t => t.id === actualTokenId)?.name || '',
      'presetteam_getinfo',
      {},
      tokenStore.sendPresetteamGetInfo(actualTokenId),
      true,
      '暑期活动'
    );
    
    if (!teamInfoResponse || !teamInfoResponse.presetTeamInfo) {
      message.error("无法获取阵容信息");
      return;
    }

    // 3. 提取当前阵容的 heroId（位置 0-5）
    const presetTeamInfo = teamInfoResponse.presetTeamInfo.presetTeamInfo || teamInfoResponse.presetTeamInfo;
    // 优先尝试获取阵容1，如果失败则尝试获取当前使用的阵容
    let team1Info = presetTeamInfo["1"] || presetTeamInfo[1];
    if (!team1Info) {
      // 尝试获取当前使用的阵容
      const useTeamId = teamInfoResponse.presetTeamInfo.useTeamId || teamInfoResponse.useTeamId || 1;
      team1Info = presetTeamInfo[useTeamId.toString()] || presetTeamInfo[useTeamId];
    }
    
    if (!team1Info) {
      message.error("无法找到阵容信息");
      return;
    }

    const teamInfo = team1Info.teamInfo || team1Info;
    const battleTeam = {};

    // 从 teamInfo 中提取位置 0-4 的 heroId
    // 位置键可能是 "0"-"4" 或 "1"-"5"，需要兼容处理
    for (let i = 0; i < 5; i++) {
      // 尝试 "0"-"4" 格式
      let heroData = teamInfo[i.toString()];
      if (!heroData) {
        // 尝试 "1"-"5" 格式（位置偏移1）
        heroData = teamInfo[(i + 1).toString()];
      }
      
      if (heroData) {
        // heroData 可能是对象（包含 heroId）或直接是 heroId
        const heroId = heroData.heroId || heroData.id || heroData;
        if (heroId && heroId !== 0) {
          battleTeam[i.toString()] = Number(heroId);
        }
      }
    }

    console.log("提取的 battleTeam:", battleTeam);

    if (Object.keys(battleTeam).length === 0) {
      message.warning("当前阵容没有英雄，无法设置队伍");
      return;
    }

    // 4. 设置队伍
    console.log("设置队伍...");
    const response = await logCommand(
      'shidian',
      '设置队伍',
      actualTokenId,
      tokenStore.gameTokens.find(t => t.id === actualTokenId)?.name || '',
      'team_setteam',
      {
        teamType: 11,
        battleTeam: battleTeam,
        lordWeaponId: 3,
        cCMonsterId: 0
      },
      tokenStore.sendMessageWithPromise(
        actualTokenId,
        "team_setteam",
        {
          teamType: 11,
          battleTeam: battleTeam,
          lordWeaponId: 3,
          cCMonsterId: 0
        },
        5000
      ),
      true,
      '暑期活动'
    );
    
    message.success("设置队伍成功");
    console.log("设置队伍结果:", response);
  } catch (error) {
    console.error("设置队伍失败:", error);
    message.error(`设置队伍失败: ${error.message || error}`);
  }
};

// 批量使用福币
const batchUseFuCoin = async () => {
  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase();
    const nameB = (b.name || '未命名').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  if (sortedTokensList.length === 0) {
    message.warning("没有可用的Token");
    return;
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = connectionPool.parseTokenRange(executionRange.value);
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices);
  
  if (targetTokens.length === 0) {
    message.warning("执行范围内没有有效的Token");
    return;
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id);
    return index + 1;
  };
  
  const rangeText = executionRange.value ? `范围${executionRange.value}` : "全部";
  message.info(`开始批量使用福币（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`);
  logOperation('shidian', '批量使用福币', {
    cardType: '暑期活动',
    status: 'info',
    message: `开始批量使用福币，${rangeText}，共${targetTokens.length}个Token`
  });

  isRunning.value = true;
  try {
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token);
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行使用福币...`);
          
          // 执行使用福币（使用内部函数，避免isRunning冲突）
          const success = await useFuCoinInternal(token.id);
          
          if (success) {
            console.log(`Token ${token.name} 使用福币成功`);
            logOperation('shidian', '批量使用福币', {
              cardType: '暑期活动',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '使用福币完成'
            });
            return { success: true, token: token };
          } else {
            console.log(`Token ${token.name} 使用福币失败`);
            logOperation('shidian', '批量使用福币', {
              cardType: '暑期活动',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: '使用福币失败'
            });
            return { success: false, token: token, error: '使用福币失败' };
          }
        } catch (error) {
          console.error(`Token ${token.name} 使用福币失败:`, error);
          logOperation('shidian', '批量使用福币', {
            cardType: '暑期活动',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `使用福币失败: ${error.message || error}`
          });
          return { success: false, token: token, error: error.message || error };
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`);
          } else if (progress.type === 'token-start') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            message.info(`[序号${tokenIndex}] ${progress.tokenName} 正在获取连接...`);
          } else if (progress.type === 'token-success') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            message.success(`[序号${tokenIndex}] ${progress.tokenName} 连接成功`);
          } else if (progress.type === 'token-error') {
            const token = sortedTokensList.find(t => t.id === progress.tokenId);
            const tokenIndex = token ? getTokenIndex(token) : progress.globalIndex + 1;
            if (progress.status === 'warning') {
              message.warning(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`);
            } else {
              message.error(`[序号${tokenIndex}] ${progress.tokenName} ${progress.message}`);
            }
          }
        }
      }
    );

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const failedTokens = results.filter(r => !r.success).map(r => r.token.name);

    if (failCount > 0) {
      const failedTokensStr = failedTokens.join('、');
      message.success(`批量使用福币完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`);
      logOperation('shidian', '批量使用福币', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量使用福币完成：成功${successCount}个，失败${failCount}个。失败的Token：${failedTokensStr}`
      });
    } else {
      message.success(`批量使用福币完成：成功${successCount}个，失败${failCount}个`);
      logOperation('shidian', '批量使用福币', {
        cardType: '暑期活动',
        status: 'success',
        message: `批量使用福币完成：成功${successCount}个，失败${failCount}个`
      });
    }
  } catch (error) {
    console.error("批量使用福币失败:", error);
    message.error(`批量使用福币失败: ${error.message || error}`);
    logOperation('shidian', '批量使用福币', {
      cardType: '暑期活动',
      status: 'error',
      message: `批量使用福币失败: ${error.message || error}`
    });
  } finally {
    isRunning.value = false;
  }
};
</script>

<style scoped>
.summer-activity {
  /* 可以添加一些自定义样式 */
}

.team-table-container {
  margin-bottom: 16px;
  width: 100%;
}

.team-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.team-table th,
.team-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: center;
}

.team-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.team-table td {
  background-color: white;
}
</style>
