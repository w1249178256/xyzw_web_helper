<template>
  <MyCard class="boss-tower" status-class="active">
    <template #icon>
      <n-icon size="24">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </n-icon>
    </template>
    <template #title>
      <h3>宝库助威</h3>
    </template>
    <template #default>
      <!-- 宝库功能 - 使用一个CustomizedCard容器容纳所有内容 -->
      <CustomizedCard mode="container">
        <!-- 第一行：昵称下拉框和助威连接游戏按钮 -->
        <CustomizedCard
          mode="select-only"
          :select-value="helperTokenId"
          :select-options="tokenOptions"
          @update:select-value="helperTokenId = $event"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="助威连接游戏"
          :disabled="!helperTokenId || connectingTokens.has(helperTokenId)"
          @button-click="connectHelperToken()"
        />

        <!-- 第二行：昵称下拉框和被助连接游戏按钮 -->
        <CustomizedCard
          mode="select-only"
          :select-value="helpedTokenId"
          :select-options="tokenOptions"
          @update:select-value="helpedTokenId = $event"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="被助连接游戏"
          :disabled="!helpedTokenId || connectingTokens.has(helpedTokenId)"
          @button-click="connectHelpedToken()"
        />

        <!-- 被助Token信息显示 -->
        <CustomizedCard
          mode="name-count"
          name="被助roleId"
          :count="helpedRoleId || '-'"
        />
        <CustomizedCard
          mode="name-count"
          name="被助名称"
          :count="helpedRoleName || '-'"
        />
        <!-- 宝库层数和队伍序号显示 -->
        <CustomizedCard
          mode="name-count"
          name="宝库层数"
          :count="towerLevel + '层'"
        />
        <CustomizedCard
          mode="name-count"
          name="队伍序号"
          :count="teamIndex"
        />

        <!-- 第三行：获取队伍，搜索队伍（助） -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="获取队伍"
          :disabled="!helpedTokenId || connectingTokens.has(helpedTokenId) || isRunning"
          @button-click="getTeam()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="搜索队伍（助）"
          :disabled="!helperTokenId || connectingTokens.has(helperTokenId) || isRunning"
          @button-click="searchTeam()"
        />

        <!-- 第四行：购买boom，创造队伍（助） -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="购买boom"
          :disabled="!helpedTokenId || connectingTokens.has(helpedTokenId) || isRunning"
          @button-click="buyBoom()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="创造队伍（助）"
          :disabled="!helperTokenId || connectingTokens.has(helperTokenId) || isRunning"
          @button-click="createTeam()"
        />

        <!-- 第五行：领取奖励，设置队伍（助） -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="领取奖励"
          :disabled="!helpedTokenId || connectingTokens.has(helpedTokenId) || isRunning"
          @button-click="claimReward()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="设置队伍（助）"
          :disabled="!helperTokenId || connectingTokens.has(helperTokenId) || isRunning"
          @button-click="setTeam()"
        />

        <!-- 第六行：使用钥匙和使用boom -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="使用钥匙"
          :disabled="!helpedTokenId || connectingTokens.has(helpedTokenId) || isRunning"
          @button-click="useKey()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="使用boom"
          :disabled="!helpedTokenId || connectingTokens.has(helpedTokenId) || isRunning"
          @button-click="useBoom()"
        />

        <!-- 第七行：一键5，一键14，批量5，批量14，执行范围 -->
        <CustomizedCard
          mode="button-placeholder"
          button-text="一键5"
          :disabled="!helpedTokenId || isRunning"
          @button-click="oneKey5()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="一键14"
          :disabled="!helpedTokenId || isRunning"
          @button-click="oneKey14()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="批量5"
          :disabled="isRunning"
          @button-click="batch5()"
        />
        <CustomizedCard
          mode="button-placeholder"
          button-text="批量14"
          :disabled="isRunning"
          @button-click="batch14()"
        />
        <CustomizedCard
          mode="execution-range"
          name="执行范围"
          :input-value="executionRange"
          placeholder="留空执行全部，或输入 1-20 或 1,2,3"
          @update:input-value="executionRange = $event"
        />
        <CustomizedCard
          mode="name-switch"
          name="跳过标签"
          :switch-value="skipLabelEnabled"
          @update:switch-value="skipLabelEnabled = $event"
        />
        <CustomizedCard
          mode="button"
          name="导出日志"
          :disabled="executionLogs.length === 0"
          @button-click="exportLogs()"
        />
      </CustomizedCard>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="BOSS塔"
        :filter-operations="['使用钥匙', '使用boom', '领取奖励', '一键5', '一键14', '批量5', '批量14']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { logOperation } from "@/utils/operationLogger";
import ConnectionPoolManager from "@/utils/connectionPoolManager";
import MyCard from "../../components/Common/MyCard.vue";
import CustomizedCard from "../../diy/CustomizedCard.vue";
import OperationLogCard from "@/diy/ShiDian/OperationLogCard.vue";

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
    .slice() // 创建副本避免修改原数组
    .sort((a, b) => a.name.localeCompare(b.name)) // 按名称排序
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

// 助威Token ID
const helperTokenId = ref("");

// 被助Token ID
const helpedTokenId = ref("");

// 是否正在运行
const isRunning = ref(false);

// 宝库层数
const towerLevel = ref(0);

// 队伍序号（可能是字符串，如 'R8i799013'）
const teamIndex = ref("");

// 被助Token的roleId
const helpedRoleId = ref("");

// 被助Token的角色名称
const helpedRoleName = ref("");

// 执行范围
const executionRange = ref("");

// 跳过标签开关
const skipLabelEnabled = ref(false);

// 执行日志
const executionLogs = ref([]);

// 添加日志（同时记录到本地日志和统一日志系统）
const addLog = (type, tokenName, message, success = true, command = null, response = null) => {
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // 如果有命令信息，添加到消息中
  let logMessage = message;
  if (command) {
    logMessage = `[命令: ${command.cmd}] ${message}`;
    if (command.params && Object.keys(command.params).length > 0) {
      logMessage += ` (参数: ${JSON.stringify(command.params)})`;
    }
  }
  
  executionLogs.value.push({
    timestamp,
    type,
    tokenName,
    message: logMessage,
    success,
    command: command ? command.cmd : null
  });
  
  // 同时记录到统一日志系统（十殿页面）
  const token = tokenStore.gameTokens.find(t => t.name === tokenName)
  logOperation('shidian', type, {
    cardType: 'BOSS塔',
    tokenId: token?.id,
    tokenName: tokenName,
    status: success ? 'success' : 'error',
    message: logMessage,
    details: command ? { command: command.cmd, params: command.params } : undefined,
    command: command ? command.cmd : undefined,
    commandParams: command ? command.params : undefined,
    response: response
  });
};

// 执行命令并记录日志的辅助函数
const executeCommandWithLog = async (type, tokenId, tokenName, cmd, params, timeout = 5000) => {
  const command = { cmd, params };
  try {
    addLog(type, tokenName, `执行命令: ${cmd}`, true, command);
    const response = await tokenStore.sendMessageWithPromise(tokenId, cmd, params, timeout);
    // 更新日志，添加响应结果
    addLog(type, tokenName, `执行命令: ${cmd} 成功`, true, command, response);
    return response;
  } catch (error) {
    // 记录错误响应
    addLog(type, tokenName, `执行命令: ${cmd} 失败: ${error.message || error}`, false, command, error.message || String(error));
    throw error;
  }
};

// 导出日志
const exportLogs = () => {
  if (executionLogs.value.length === 0) {
    message.warning("没有可导出的日志");
    return;
  }

  try {
    const lines = [];
    lines.push("=".repeat(60));
    lines.push("宝库助威执行日志");
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`总记录数: ${executionLogs.value.length}`);
    lines.push("=".repeat(60));
    lines.push("");

    executionLogs.value.forEach((log, index) => {
      lines.push(`[${index + 1}] ${log.timestamp}`);
      lines.push(`  操作类型: ${log.type}`);
      lines.push(`  Token名称: ${log.tokenName || '-'}`);
      lines.push(`  状态: ${log.success ? '成功' : '失败'}`);
      lines.push(`  消息: ${log.message}`);
      lines.push("");
    });

    const content = lines.join('\n');
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `宝库助威执行日志_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.txt`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`日志已导出，共 ${executionLogs.value.length} 条记录`);
  } catch (error) {
    console.error("导出日志失败:", error);
    message.error(`导出日志失败: ${error.message || error}`);
  }
};

// 暂存的rewardList（由使用钥匙或使用boom时记录）
const cachedRewardList = ref([]);

// 从bossTower响应中提取rewardList的辅助函数
// rewardList在levelInfoMap的特定层级下（3、6、9、12）
const extractRewardListFromBossTower = (bossTower) => {
  if (!bossTower) return null;
  
  // 先尝试直接从bossTower.rewardList获取（兼容旧格式）
  if (bossTower.rewardList && Array.isArray(bossTower.rewardList) && bossTower.rewardList.length > 0) {
    return bossTower.rewardList;
  }
  
  // 从levelInfoMap的特定层级中查找rewardList（3、6、9、12）
  const levelIds = ["3", "6", "9", "12"];
  if (bossTower.levelInfoMap && typeof bossTower.levelInfoMap === 'object') {
    for (const levelId of levelIds) {
      const levelInfo = bossTower.levelInfoMap[levelId];
      if (levelInfo && levelInfo.rewardList && Array.isArray(levelInfo.rewardList) && levelInfo.rewardList.length > 0) {
        return levelInfo.rewardList;
      }
    }
  }
  
  return null;
};

// 更新token的资源数据（模拟ShiDian页面的逻辑）
const updateTokenResourceData = async (tokenId) => {
  try {
    // 等待一下确保数据已更新
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 获取最新的角色信息和十殿信息
    await tokenStore.sendGetRoleInfo(tokenId)
    await tokenStore.sendNightmareGetRoleInfo(tokenId, { roleId: tokenId })

    // 等待数据更新
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log(`Token ${tokenId} 资源数据已更新`)
  } catch (error) {
    console.error(`更新Token ${tokenId} 资源数据失败:`, error)

    // 为特定的服务器错误提供诊断信息
    if (error.message && error.message.includes('200020')) {
      console.warn(`服务器错误200020: 这通常是由于参数无效或服务器暂时不可用导致的。请检查Token有效性和网络连接。`)
    } else if (error.message && error.message.includes('服务器错误')) {
      console.warn(`检测到服务器错误: ${error.message}。这可能是临时的服务器问题，请稍后重试。`)
    }
  }
};

// 连接助威Token（模拟点击token卡片昵称）
const connectHelperToken = async () => {
  if (!helperTokenId.value) {
    message.warning("请先选择助威Token");
    return;
  }

  try {
    // 查找对应的token对象
    const token = tokenStore.gameTokens.find(t => t.id === helperTokenId.value);
    if (!token) {
      message.error("找不到选中的助威Token");
      return;
    }

    // 模拟点击token卡片昵称，完全按照ShiDian页面的selectToken逻辑

    const isAlreadySelected = tokenStore.selectedToken?.id === token.id;
    const connectionStatus = tokenStore.getWebSocketStatus(token.id);

    // 如果已经选中且已连接，不执行任何操作（参照ShiDian页面逻辑）
    if (isAlreadySelected && connectionStatus === 'connected') {
      message.info(`${token.name} 已选中且已连接`);
      // 即使已连接，也更新一次资源数据（参照ShiDian页面）
      await updateTokenResourceData(token.id);
      return;
    }

    // 如果已经选中但正在连接，也不执行操作（参照ShiDian页面逻辑）
    if (isAlreadySelected && connectionStatus === 'connecting') {
      message.info(`${token.name} 正在连接中...`);
      return;
    }

    // 选择token并连接（参照ShiDian页面逻辑）
    const tokenIdToConnect = helperTokenId.value; // 保存要连接的token ID
    tokenStore.selectToken(tokenIdToConnect);
    message.info("正在建立助威Token连接...");

    // 等待连接建立并显示结果
    setTimeout(() => {
      const finalStatus = tokenStore.getWebSocketStatus(tokenIdToConnect);
      if (finalStatus === 'connected') {
        message.success(`助威Token ${token.name} 连接成功！`);
        // 连接成功后更新资源数据
        updateTokenResourceData(tokenIdToConnect).catch((error) => {
          console.error("更新资源数据失败:", error);
        });
      } else {
        message.error(`助威Token ${token.name} 连接失败，请稍后重试`);
      }
    }, 3000); // 3秒后检查连接状态
  } catch (error) {
    console.error("连接助威Token失败:", error);
    message.error("连接助威Token失败");
  }
};

// 连接被助Token（模拟点击token卡片昵称）
const connectHelpedToken = async () => {
  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  try {
    // 查找对应的token对象
    const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
    if (!token) {
      message.error("找不到选中的被助Token");
      return;
    }

    // 模拟点击token卡片昵称，完全按照ShiDian页面的selectToken逻辑

    const isAlreadySelected = tokenStore.selectedToken?.id === token.id;
    const connectionStatus = tokenStore.getWebSocketStatus(token.id);

    // 如果已经选中且已连接，不执行任何操作（参照ShiDian页面逻辑）
    if (isAlreadySelected && connectionStatus === 'connected') {
      message.info(`${token.name} 已选中且已连接`);
      // 即使已连接，也更新一次资源数据（参照ShiDian页面）
      await updateTokenResourceData(token.id);
      return;
    }

    // 如果已经选中但正在连接，也不执行操作（参照ShiDian页面逻辑）
    if (isAlreadySelected && connectionStatus === 'connecting') {
      message.info(`${token.name} 正在连接中...`);
      return;
    }

    // 选择token并连接（参照ShiDian页面逻辑）
    const tokenIdToConnect = helpedTokenId.value; // 保存要连接的token ID
    tokenStore.selectToken(tokenIdToConnect);
    message.info("正在建立被助Token连接...");

    // 等待连接建立并显示结果
    setTimeout(() => {
      const finalStatus = tokenStore.getWebSocketStatus(tokenIdToConnect);
      if (finalStatus === 'connected') {
        message.success(`被助Token ${token.name} 连接成功！`);
        // 连接成功后更新资源数据
        updateTokenResourceData(tokenIdToConnect).catch((error) => {
          console.error("更新资源数据失败:", error);
        });
      } else {
        message.error(`被助Token ${token.name} 连接失败，请稍后重试`);
      }
    }, 3000); // 3秒后检查连接状态
  } catch (error) {
    console.error("连接被助Token失败:", error);
    message.error("连接被助Token失败");
  }
};

// 获取队伍
const getTeam = async () => {
  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  // 检查被助Token的连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(helpedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接被助Token后再获取队伍信息");
    return;
  }

  try {
    // 获取被助Token的角色信息
    const helpedToken = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
    if (!helpedToken) {
      message.error("找不到被助Token");
      return;
    }

    // 获取角色信息（如果还没有）
    let roleId = null;
    let roleName = null;

    // 方式1：从 token.gameData.roleInfo.role 获取
    if (helpedToken.gameData?.roleInfo?.role) {
      const role = helpedToken.gameData.roleInfo.role;
      roleId = role.roleId;
      roleName = role.name;
    }
    // 方式2：从全局 gameData 获取（如果当前选中的是被助Token）
    else if (tokenStore.selectedTokenId === helpedTokenId.value && tokenStore.gameData?.roleInfo?.role) {
      const role = tokenStore.gameData.roleInfo.role;
      roleId = role.roleId;
      roleName = role.name;
    }

    // 如果仍然没有，尝试获取角色信息
    if (!roleId || !roleName) {
      await tokenStore.sendGetRoleInfo(helpedTokenId.value);
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待数据更新
      
      // 再次尝试获取
      if (helpedToken.gameData?.roleInfo?.role) {
        const role = helpedToken.gameData.roleInfo.role;
        roleId = role.roleId;
        roleName = role.name;
      } else if (tokenStore.selectedTokenId === helpedTokenId.value && tokenStore.gameData?.roleInfo?.role) {
        const role = tokenStore.gameData.roleInfo.role;
        roleId = role.roleId;
        roleName = role.name;
      }
    }

    // 更新被助Token的roleId和名称
    if (roleId) {
      helpedRoleId.value = String(roleId);
    } else {
      helpedRoleId.value = "";
      console.warn("无法获取被助Token的roleId");
    }

    if (roleName) {
      helpedRoleName.value = String(roleName);
    } else {
      helpedRoleName.value = helpedToken.name || "未知"; // 如果没有角色名称，使用Token名称
    }

    // 获取宝库信息
    const response = await tokenStore.sendBossTowerGetInfo(helpedTokenId.value);

    // 更新宝库层数和队伍序号
    if (response.bossTower) {
      towerLevel.value = response.bossTower.towerId || 0;
      // teamId 可能是字符串（如 'R8i799013'）或数字
      teamIndex.value = response.bossTower.teamId !== undefined && response.bossTower.teamId !== null 
        ? String(response.bossTower.teamId) 
        : "";
    }

    message.success("获取队伍信息成功");
    console.log("队伍信息:", response);
    console.log("被助Token信息:", {
      roleId: helpedRoleId.value,
      roleName: helpedRoleName.value,
      towerLevel: towerLevel.value,
      teamIndex: teamIndex.value
    });
  } catch (error) {
    console.error("获取队伍失败:", error);
    message.error(`获取队伍失败: ${error.message || error}`);
  }
};

// 搜索队伍（助）
const searchTeam = async () => {
  if (!helperTokenId.value) {
    message.warning("请先选择助威Token");
    return;
  }

  // 检查助威Token的连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(helperTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接助威Token后再搜索队伍");
    return;
  }

  if (!teamIndex.value || teamIndex.value === "" || teamIndex.value === "0") {
    message.warning("请先获取队伍信息以获取队伍序号");
    return;
  }

  try {
    // teamId 应该是字符串格式（如 'R8i799013'）
    const teamId = String(teamIndex.value);
    console.log("搜索队伍参数:", { teamId, teamIndex: teamIndex.value });
    
    // 使用 tokenStore 的 sendBossTowerSearchTeam 方法
    const response = await tokenStore.sendBossTowerSearchTeam(
      helperTokenId.value,
      { teamId: teamId }
    );
    message.success("搜索队伍成功");
    console.log("队伍列表:", response);
  } catch (error) {
    console.error("搜索队伍失败:", error);
    console.error("错误详情:", {
      message: error.message,
      teamIndex: teamIndex.value,
      helperTokenId: helperTokenId.value
    });
    
    // 为特定的服务器错误提供诊断信息
    if (error.message && error.message.includes('200020')) {
      message.error("搜索队伍失败：请确保助威Token在宝库界面，且队伍序号正确");
    } else {
      message.error(`搜索队伍失败: ${error.message || error}`);
    }
  }
};

// 购买boom
const buyBoom = async () => {
  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  // 检查连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(helpedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  let successCount = 0;

  try {
    console.log("开始执行购买boom操作（3次）...");
    const goodsIds = [11, 12, 13];

    for (let i = 0; i < goodsIds.length; i++) {
      console.log(`购买第${i + 1}个商品（goodsId: ${goodsIds[i]}）...`);
      try {
        const response = await tokenStore.sendMessageWithPromise(
          helpedTokenId.value,
          "charge_createorder",
          { goodsId: goodsIds[i] },
          8000
        );
        successCount++;
        console.log(`第${i + 1}次购买成功:`, response);
        // 成功后的延迟时间稍长一些
        await new Promise((r) => setTimeout(r, 1000));
      } catch (singleError) {
        const errorMsg = singleError?.message || String(singleError);
        console.warn(`第${i + 1}次购买失败:`, singleError);
        
        // 对于错误200020，可能是商品已购买或服务器限制，继续执行下一个
        if (errorMsg.includes('200020')) {
          console.log(`商品 ${goodsIds[i]} 购买失败（错误200020），可能已购买或不可购买，跳过`);
        }
        
        // 单个失败不中断整个流程，继续执行
        // 失败后的延迟时间稍长一些，避免请求过快
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (successCount > 0) {
      message.success(`购买boom完成：成功${successCount}/3次`);
      console.log(`购买boom完成：成功${successCount}/3次`);
    } else {
      message.error("购买boom失败：全部操作均失败");
    }
  } catch (error) {
    console.error("购买boom失败:", error);
    if (successCount > 0) {
      message.warning(`购买boom部分失败：成功${successCount}/3次`);
    } else {
      message.error("购买boom失败");
    }
  } finally {
    isRunning.value = false;
  }
};

// 创造队伍（助）
const createTeam = async () => {
  if (!helperTokenId.value) {
    message.warning("请先选择助威Token");
    return;
  }

  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  // 检查连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(helperTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接助威Token后再执行操作");
    return;
  }

  // 检查被助Token的连接状态
  const helpedConnectionStatus = tokenStore.getWebSocketStatus(helpedTokenId.value);
  if (helpedConnectionStatus !== 'connected') {
    message.error("请先连接被助Token后再执行操作");
    return;
  }

  try {
    // 获取被助Token的roleId（优先使用已获取的值）
    let leaderId = helpedRoleId.value;
    
    // 如果还没有获取到，尝试从数据中获取
    if (!leaderId) {
      const helpedToken = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
      if (!helpedToken) {
        message.error("找不到被助Token");
        return;
      }

      // 方式1：从 token.gameData.roleInfo.role.roleId 获取
      if (helpedToken.gameData?.roleInfo?.role?.roleId) {
        leaderId = String(helpedToken.gameData.roleInfo.role.roleId);
      }
      // 方式2：从全局 gameData 获取（如果当前选中的是被助Token）
      else if (tokenStore.selectedTokenId === helpedTokenId.value && tokenStore.gameData?.roleInfo?.role?.roleId) {
        leaderId = String(tokenStore.gameData.roleInfo.role.roleId);
      }
      
      // 如果仍然没有，尝试获取角色信息
      if (!leaderId) {
        await tokenStore.sendGetRoleInfo(helpedTokenId.value);
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待数据更新
        
        // 再次尝试获取
        if (helpedToken.gameData?.roleInfo?.role?.roleId) {
          leaderId = String(helpedToken.gameData.roleInfo.role.roleId);
        } else if (tokenStore.selectedTokenId === helpedTokenId.value && tokenStore.gameData?.roleInfo?.role?.roleId) {
          leaderId = String(tokenStore.gameData.roleInfo.role.roleId);
        }
      }
    }

    if (!leaderId) {
      message.error("无法获取被助Token的角色ID，请先点击\"获取队伍\"按钮获取角色信息");
      return;
    }

    // teamId 已经是字符串格式（如 'R8i799013'）
    const teamId = teamIndex.value;

    if (!teamId || teamId === "0" || teamId === "") {
      message.warning("请先获取队伍信息以获取队伍序号");
      return;
    }

    console.log("创造队伍参数:", { 
      leaderId, 
      teamId, 
      helperTokenId: helperTokenId.value,
      helpedTokenId: helpedTokenId.value
    });

    // 记录WebSocket连接状态
    const wsStatus = tokenStore.getWebSocketStatus(helperTokenId.value);
    console.log("助威Token WebSocket状态:", wsStatus);

    // 记录当前选择的token信息
    const helperToken = tokenStore.gameTokens.find(t => t.id === helperTokenId.value);
    console.log("助威Token信息:", helperToken ? { id: helperToken.id, name: helperToken.name } : "未找到");

    // 检查是否已经在队伍中
    console.log("检查当前队伍状态...");
    try {
      const teamInfo = await tokenStore.sendMessageWithPromise(
        helperTokenId.value,
        "matchteam_getroleteaminfo",
        {},
        5000
      );
      console.log("当前队伍信息:", teamInfo);

      if (teamInfo && teamInfo.roleMTData && Object.keys(teamInfo.roleMTData).length > 0) {
        message.warning("助威Token已经在队伍中，请先退出当前队伍或使用其他Token");
        console.log("Token已在队伍中，取消创建操作");
        return;
      }
    } catch (checkError) {
      console.log("检查队伍状态失败，继续创建操作:", checkError);
    }

    // 使用宝库创建队伍命令，传入被助Token的roleId和队伍序号
    const response = await tokenStore.sendMessageWithPromise(
      helperTokenId.value,
      "matchteam_create_baoku",
      {
        leaderId: leaderId,
        teamId: teamId
      },
      5000
    );
    message.success("创造队伍成功");
    console.log("创造队伍结果:", response);
  } catch (error) {
    console.error("创造队伍失败:", error);
    console.error("错误详情:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // 为特定的服务器错误提供诊断信息
    if (error.message && error.message.includes('200020')) {
      console.warn(`服务器错误200020: 创造队伍失败`);
      console.warn(`可能的原因:`);
      console.warn(`1. 助威Token不在正确的游戏界面（需要进入宝库界面）`);
      console.warn(`2. teamCfgId: 6 在当前上下文中无效`);
      console.warn(`3. 助威功能需要在特定的游戏状态下才能使用`);
      console.warn(`4. 服务器暂时不可用或有其他限制`);
      console.warn(`建议:`);
      console.warn(`- 确保助威Token已进入宝库界面`);
      console.warn(`- 检查游戏状态是否正确`);
      console.warn(`- 尝试重新连接助威Token`);
      message.error("创造队伍失败：请确保在宝库界面中操作");
    } else if (error.message && error.message.includes('服务器错误')) {
      console.warn(`检测到服务器错误: ${error.message}`);
      message.error(`服务器错误，请稍后重试: ${error.message}`);
    } else {
      message.error(`创造队伍失败: ${error.message || error}`);
    }
  }
};

// 领取奖励（内部版本，不检查isRunning）
const claimRewardInternal = async (tokenIdParam, skipRunningCheck = false) => {
  if (!tokenIdParam) {
    console.warn("claimRewardInternal: tokenIdParam为空，跳过执行");
    return;
  }

  // 检查连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(tokenIdParam);
  if (connectionStatus !== 'connected') {
    const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
    const tokenName = token ? token.name : tokenIdParam;
    console.warn(`claimRewardInternal: Token ${tokenName} 连接状态为 ${connectionStatus}，跳过执行`);
    addLog("领取奖励", tokenName, `Token连接状态为 ${connectionStatus}，跳过执行`, false);
    return;
  }

  if (!skipRunningCheck && isRunning.value) {
    return;
  }

  const originalIsRunning = isRunning.value;
  if (!skipRunningCheck) {
    isRunning.value = true;
  }
  let successCount = 0;
  let claimCount = 5;

  try {
    const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
    const tokenName = token ? token.name : tokenIdParam;
    console.log(`开始执行领取奖励操作... Token: ${tokenName}`);
    addLog("领取奖励", tokenName, "开始执行领取奖励操作", true);

    // 使用暂存的rewardList
    const rewardList = cachedRewardList.value && cachedRewardList.value.length > 0 
      ? [...cachedRewardList.value] 
      : [];

    if (rewardList.length > 0) {
      console.log("使用暂存的rewardList:", rewardList);
      
      // 按照优先级排序奖励：招募令(1001)、白玉(1022)、彩玉(1023)、金砖(type=2,itemId=0)，其他的顺序选择
      // 相同itemId的，value高的优先
      const priorityItemIds = [1001, 1022, 1023]; // 招募令、白玉、彩玉
      const sortedRewards = rewardList.sort((a, b) => {
        // 获取优先级索引（-1表示不在优先列表中）
        const aPriority = priorityItemIds.indexOf(a.itemId);
        const bPriority = priorityItemIds.indexOf(b.itemId);
        
        // 判断是否为金砖（type=2, itemId=0）
        const aIsGold = a.type === 2 && a.itemId === 0;
        const bIsGold = b.type === 2 && b.itemId === 0;
        
        // 优先级1-3：招募令、白玉、彩玉
        if (aPriority !== -1 && bPriority !== -1) {
          // 都是优先物品，按优先级顺序，然后按value降序
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return b.value - a.value;
        }
        
        if (aPriority !== -1 && bPriority === -1) {
          // a是优先物品，b不是（可能是金砖或其他）
          if (bIsGold) {
            return -1; // 优先物品优先级高于金砖
          }
          return -1; // a是优先物品，排在前面
        }
        
        if (aPriority === -1 && bPriority !== -1) {
          // b是优先物品，a不是（可能是金砖或其他）
          if (aIsGold) {
            return 1; // 优先物品优先级高于金砖
          }
          return 1; // b是优先物品，排在前面
        }
        
        // 优先级4：金砖（type=2, itemId=0）
        if (aIsGold && !bIsGold) {
          return -1; // a是金砖，b不是，a排在前面
        }
        if (!aIsGold && bIsGold) {
          return 1; // b是金砖，a不是，b排在前面
        }
        if (aIsGold && bIsGold) {
          // 都是金砖，按value降序
          return b.value - a.value;
        }
        
        // 优先级5：其他物品
        // 优先扳手福袋（itemId === 3012）
        const aIsWrenchBag = a.itemId === 3012; // 扳手福袋
        const bIsWrenchBag = b.itemId === 3012;
        
        // 扳手福袋优先级最高
        if (aIsWrenchBag && !bIsWrenchBag) {
          return -1; // a是扳手福袋，b不是，a排在前面
        }
        if (!aIsWrenchBag && bIsWrenchBag) {
          return 1; // b是扳手福袋，a不是，b排在前面
        }
        if (aIsWrenchBag && bIsWrenchBag) {
          // 都是扳手福袋，按value降序
          return b.value - a.value;
        }
        
        // 其他物品，相同itemId的按value降序，不同itemId的按itemId升序
        if (a.itemId !== b.itemId) {
          return a.itemId - b.itemId;
        }
        return b.value - a.value;
      });

      console.log("排序后的奖励列表:", sortedRewards);

      // 开始领取奖励（执行5次）
      claimCount = Math.min(5, sortedRewards.length);
      console.log(`开始领取奖励（${claimCount}次）...`);

      for (let i = 0; i < claimCount; i++) {
        const reward = sortedRewards[i];
        // rewardList中的idx已经在前面添加了
        const idx = reward.idx !== undefined ? reward.idx : i;
        
        const rewardDesc = reward.type === 2 && reward.itemId === 0 
          ? `金砖(value: ${reward.value})`
          : `itemId: ${reward.itemId}, value: ${reward.value}`;
        
        console.log(`领取第${i + 1}个奖励（idx: ${idx}, ${rewardDesc}）...`);
        try {
          const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
          const tokenName = token ? token.name : tokenIdParam;
          const response = await executeCommandWithLog(
            "领取奖励",
            tokenIdParam,
            tokenName,
            "bosstower_claimreward",
            { idx: idx },
            5000
          );
          successCount++;
          console.log(`第${i + 1}次领取成功:`, response);
          await new Promise((r) => setTimeout(r, 300)); // 每次间隔300ms
        } catch (singleError) {
          console.warn(`第${i + 1}次领取失败:`, singleError);
          // 单个失败不中断整个流程，继续执行
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } else {
      // 如果没有暂存的rewardList，直接领取前5个（idx: 0-4）
      console.log("未找到暂存的rewardList，直接领取前5个奖励（idx: 0-4）...");
      if (!skipRunningCheck) {
        message.info("未找到暂存的rewardList，尝试领取前5个奖励");
      }
      
      for (let i = 0; i < 5; i++) {
        console.log(`领取第${i + 1}个奖励（idx: ${i}）...`);
        try {
          const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
          const tokenName = token ? token.name : tokenIdParam;
          const response = await executeCommandWithLog(
            "领取奖励",
            tokenIdParam,
            tokenName,
            "bosstower_claimreward",
            { idx: i },
            5000
          );
          successCount++;
          console.log(`第${i + 1}次领取成功:`, response);
          await new Promise((r) => setTimeout(r, 300)); // 每次间隔300ms
        } catch (singleError) {
          console.warn(`第${i + 1}次领取失败:`, singleError);
          // 单个失败不中断整个流程，继续执行
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }

    if (successCount > 0) {
      if (!skipRunningCheck) {
        message.success(`领取奖励完成：成功${successCount}/${claimCount}次`);
      }
      console.log(`领取奖励完成：成功${successCount}/${claimCount}次`);
    } else {
      if (!skipRunningCheck) {
        message.error("领取奖励失败：全部操作均失败");
      }
    }
  } catch (error) {
    console.error("领取奖励失败:", error);
    if (successCount > 0) {
      if (!skipRunningCheck) {
        message.warning(`领取奖励部分失败：成功${successCount}次`);
      }
    } else {
      if (!skipRunningCheck) {
        message.error("领取奖励失败");
      }
    }
  } finally {
    // 领取奖励后清空rewardList缓存
    cachedRewardList.value = [];
    console.log("已清空rewardList缓存");
    if (!skipRunningCheck) {
      isRunning.value = originalIsRunning;
    }
  }
};

// 领取奖励（公开版本，检查isRunning）
const claimReward = async () => {
  return await claimRewardInternal(helpedTokenId.value, false);
};

// 设置队伍（助）
const setTeam = async () => {
  if (!helperTokenId.value) {
    message.warning("请先选择助威Token");
    return;
  }

  // 检查连接状态
  const wsConnection = tokenStore.wsConnections[helperTokenId.value];
  if (!wsConnection || wsConnection.status !== "connected") {
    message.warning("助威Token未连接，请先连接");
    return;
  }

  try {
    // 1. 切换阵容1（如果失败，继续执行后续操作）
    console.log("切换阵容1...");
    try {
      await tokenStore.sendPresetteamSaveTeam(helperTokenId.value, { teamId: 1 });
      // 等待一下确保切换完成
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("切换阵容1成功");
    } catch (switchError) {
      console.warn("切换阵容1失败，继续执行后续操作:", switchError);
      // 切换失败时也等待一下，可能当前已经是阵容1
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 2. 获取当前阵容信息
    console.log("获取阵容信息...");
    const teamInfoResponse = await tokenStore.sendPresetteamGetInfo(helperTokenId.value);
    
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
    const response = await tokenStore.sendMessageWithPromise(
      helperTokenId.value,
      "team_setteam",
      {
        teamType: 11,
        battleTeam: battleTeam,
        lordWeaponId: 3,
        cCMonsterId: 0
      },
      5000
    );
    
    message.success("设置队伍成功");
    console.log("设置队伍结果:", response);
  } catch (error) {
    console.error("设置队伍失败:", error);
    message.error(`设置队伍失败: ${error.message || error}`);
  }
};

// 使用钥匙
const useKey = async () => {
  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  // 检查连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(helpedTokenId.value);
  if (connectionStatus !== 'connected') {
    message.error("请先连接游戏后再执行操作");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  let successCount = 0;
  let claimSuccessCount = 0;

  try {
    console.log("开始执行使用钥匙操作...");

    // 一直执行bosstower_startbox，直到boxCurHp为0且rewardList存在
    let rewardList = [];
    let boxCurHp = null;
    let attemptCount = 0;
    const maxAttempts = 10; // 最多尝试10次，避免无限循环

    console.log("开始获取奖励列表，持续执行bosstower_startbox直到boxCurHp为0...");

    while (attemptCount < maxAttempts) {
      attemptCount++;
      console.log(`第${attemptCount}次执行bosstower_startbox...`);
      
      try {
        const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
        const tokenName = token ? token.name : helpedTokenId.value;
        const boxResponse = await executeCommandWithLog(
          "使用钥匙",
          helpedTokenId.value,
          tokenName,
          "bosstower_startbox",
          {},
          8000
        );

        console.log(`第${attemptCount}次宝箱开启结果:`, boxResponse);

        // 检查响应中的bossTower信息
        if (boxResponse && boxResponse.bossTower) {
          const bossTower = boxResponse.bossTower;
          boxCurHp = bossTower.boxCurHp !== undefined ? bossTower.boxCurHp : null;
          
          // 从levelInfoMap中提取rewardList
          const rewardListData = extractRewardListFromBossTower(bossTower);

          console.log(`boxCurHp: ${boxCurHp}, rewardListData:`, rewardListData);
          console.log(`rewardListData类型: ${typeof rewardListData}, 是否为数组: ${Array.isArray(rewardListData)}, 长度: ${rewardListData?.length}`);

          // 如果boxCurHp为0且rewardList存在，获取rewardList并退出循环
          if (boxCurHp === 0 && rewardListData && Array.isArray(rewardListData) && rewardListData.length > 0) {
            rewardList = rewardListData.map((item, index) => ({ ...item, idx: index }));
            console.log("找到rewardList (boxCurHp=0):", rewardList);
            break;
          }
        }

        // 等待一下再继续下一次尝试
        await new Promise((r) => setTimeout(r, 500));
      } catch (boxError) {
        console.warn(`第${attemptCount}次执行bosstower_startbox失败:`, boxError);
        // 失败后也等待一下再继续
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log("获取到的奖励列表:", rewardList);

    // 保存rewardList到缓存
    if (rewardList.length > 0) {
      cachedRewardList.value = rewardList;
      console.log("已保存rewardList到缓存:", cachedRewardList.value);
    }

    if (rewardList.length === 0) {
      message.warning(`未获取到奖励列表（已尝试${attemptCount}次），无法执行领取操作`);
      return;
    }

    // 按照用户指定的优先级排序奖励
    // 优先级：招募令、白玉、彩玉、金砖（itemId顺序），相同itemId的value值高的优先
    const itemPriority = {
      // 假设的itemId映射，根据用户描述
      // 0: 招募令, 1: 白玉, 2: 彩玉, 3: 金砖
    };

    const sortedRewards = rewardList
      .filter(reward => reward.idx >= 0 && reward.idx <= 9) // 只处理0-9的奖励
      .sort((a, b) => {
        // 首先按itemId优先级排序
        const aPriority = itemPriority[a.itemId] || a.itemId;
        const bPriority = itemPriority[b.itemId] || b.itemId;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // 相同itemId的按value值高的优先
        return b.value - a.value;
      });

    console.log("排序后的奖励列表:", sortedRewards);

    // 执行5次bosstower_claimreward，使用排序后的前5个奖励
    const claimCount = Math.min(5, sortedRewards.length);
    console.log(`开始领取奖励（${claimCount}次）...`);

    for (let i = 0; i < claimCount; i++) {
      const reward = sortedRewards[i];
      console.log(`领取第${i + 1}个奖励（idx: ${reward.idx}, itemId: ${reward.itemId}, value: ${reward.value}）...`);

      try {
        const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
        const tokenName = token ? token.name : helpedTokenId.value;
        addLog("使用钥匙", tokenName, `执行命令: bosstower_claimreward (第${i + 1}次, idx: ${reward.idx})`, true, { cmd: "bosstower_claimreward", params: { idx: reward.idx } });
        const claimResponse = await tokenStore.sendMessageWithPromise(
          helpedTokenId.value,
          "bosstower_claimreward",
          { idx: reward.idx },
          5000
        );
        claimSuccessCount++;
        console.log(`第${i + 1}次奖励领取成功:`, claimResponse);
        await new Promise((r) => setTimeout(r, 300)); // 每次间隔300ms
      } catch (claimError) {
        console.warn(`第${i + 1}次奖励领取失败:`, claimError);
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    successCount = 1; // 使用钥匙本身算成功
    message.success(`使用钥匙完成：开启成功，奖励领取${claimSuccessCount}/${claimCount}次`);
    console.log(`使用钥匙完成：开启成功，奖励领取${claimSuccessCount}/${claimCount}次`);

  } catch (error) {
    console.error("使用钥匙失败:", error);
    message.error("使用钥匙失败");
  } finally {
    isRunning.value = false;
  }
};

// 使用boom（内部版本，不检查isRunning）
const useBoomInternal = async (tokenIdParam, skipRunningCheck = false) => {
  if (!tokenIdParam) {
    console.warn("useBoomInternal: tokenIdParam为空，跳过执行");
    return;
  }

  // 检查连接状态
  const connectionStatus = tokenStore.getWebSocketStatus(tokenIdParam);
  if (connectionStatus !== 'connected') {
    const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
    const tokenName = token ? token.name : tokenIdParam;
    console.warn(`useBoomInternal: Token ${tokenName} 连接状态为 ${connectionStatus}，跳过执行`);
    addLog("使用boom", tokenName, `Token连接状态为 ${connectionStatus}，跳过执行`, false);
    return;
  }

  if (!skipRunningCheck && isRunning.value) {
    return;
  }

  const originalIsRunning = isRunning.value;
  if (!skipRunningCheck) {
    isRunning.value = true;
  }
  let successCount = 0;
  let rewardListFound = false;

  try {
    const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
    const tokenName = token ? token.name : tokenIdParam;
    console.log(`开始执行使用boom操作（最多7次）... Token: ${tokenName}`);
    addLog("使用boom", tokenName, "开始执行使用boom操作", true);

    for (let i = 0; i < 7; i++) {
      console.log(`执行第${i + 1}次使用boom...`);
      try {
        const token = tokenStore.gameTokens.find(t => t.id === tokenIdParam);
        const tokenName = token ? token.name : tokenIdParam;
        const response = await executeCommandWithLog(
          "使用boom",
          tokenIdParam,
          tokenName,
          "bosstower_boom",
          { num: 1 },
          5000
        );
        successCount++;
        console.log(`第${i + 1}次使用boom成功:`, response);
        
        // 检查boxCurHp是否为0，且rewardList存在
        if (response && response.bossTower) {
          const bossTower = response.bossTower;
          const boxCurHp = bossTower.boxCurHp !== undefined ? bossTower.boxCurHp : null;
          
          // 从levelInfoMap中提取rewardList
          const rewardListData = extractRewardListFromBossTower(bossTower);
          
          if (boxCurHp === 0 && rewardListData && Array.isArray(rewardListData) && rewardListData.length > 0) {
            rewardListFound = true;
            // 保存rewardList到缓存
            const rewardListWithIdx = rewardListData.map((item, index) => ({ ...item, idx: index }));
            cachedRewardList.value = rewardListWithIdx;
            console.log("找到rewardList (boxCurHp=0):", rewardListData);
            console.log("已保存rewardList到缓存:", cachedRewardList.value);
            if (!skipRunningCheck) {
              message.success(`使用boom完成：成功${successCount}次，已找到rewardList`);
            }
            break;
          }
        }
        
        await new Promise((r) => setTimeout(r, 500)); // 每次间隔500ms
      } catch (singleError) {
        console.warn(`第${i + 1}次使用boom失败:`, singleError);
        // 单个失败不中断整个流程，继续执行
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (successCount > 0) {
      if (rewardListFound) {
        if (!skipRunningCheck) {
          message.success(`使用boom完成：成功${successCount}次，已找到rewardList`);
        }
      } else {
        if (!skipRunningCheck) {
          message.success(`使用boom完成：成功${successCount}/7次`);
        }
      }
      console.log(`使用boom完成：成功${successCount}次，rewardList: ${rewardListFound ? '已找到' : '未找到'}`);
    } else {
      if (!skipRunningCheck) {
        message.error("使用boom失败：全部操作均失败");
      }
    }
  } catch (error) {
    console.error("使用boom失败:", error);
    if (successCount > 0) {
      if (!skipRunningCheck) {
        message.warning(`使用boom部分失败：成功${successCount}次`);
      }
    } else {
      if (!skipRunningCheck) {
        message.error("使用boom失败");
      }
    }
  } finally {
    if (!skipRunningCheck) {
      isRunning.value = originalIsRunning;
    }
  }
};

// 使用boom（公开版本，检查isRunning）
const useBoom = async () => {
  return await useBoomInternal(helpedTokenId.value, false);
};

// 解析执行范围
const parseExecutionRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null; // 返回null表示执行全部
  }

  const trimmed = rangeStr.trim();
  const tokens = tokenStore.gameTokens.slice().sort((a, b) => a.name.localeCompare(b.name));
  
  // 处理范围格式 "1-20"
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
      return tokens.slice(start - 1, end).map(t => t.id);
    }
  }
  
  // 处理逗号分隔格式 "1,2,3"
  if (trimmed.includes(',')) {
    const indices = trimmed.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    return indices.map(idx => tokens[idx - 1]?.id).filter(Boolean);
  }
  
  // 单个数字
  const index = parseInt(trimmed);
  if (!isNaN(index) && index > 0 && tokens[index - 1]) {
    return [tokens[index - 1].id];
  }
  
  return null; // 解析失败，返回null表示执行全部
};

// 一键5（内部函数，可接受tokenId参数）
const oneKey5Internal = async (helpedTokenIdParam) => {
  const token = tokenStore.gameTokens.find(t => t.id === helpedTokenIdParam);
  const tokenName = token ? token.name : helpedTokenIdParam;

  // 1. 模拟点击被助连接游戏
  const originalHelpedTokenId = helpedTokenId.value;
  helpedTokenId.value = helpedTokenIdParam;
  await connectHelpedToken();
  await new Promise((r) => setTimeout(r, 2000)); // 等待连接
  
  const connectionStatus = tokenStore.getWebSocketStatus(helpedTokenIdParam);
  if (connectionStatus !== 'connected') {
    helpedTokenId.value = originalHelpedTokenId;
    addLog("一键5", tokenName, "被助Token连接失败", false);
    return false;
  }

  // 2. 模拟点击获取队伍
  await getTeam();
  await new Promise((r) => setTimeout(r, 500));

  // 3. 获取宝库层数
  const bosstowerinfo = await tokenStore.sendMessageWithPromise(
    helpedTokenIdParam,
    "bosstower_getinfo",
    {},
    5000
  );
  const towerId = bosstowerinfo.bossTower.towerId;
  addLog("一键5", tokenName, `当前宝库层数: ${towerId}`);

  // 4. 根据宝库层数执行
  if (towerId > 5) {
    helpedTokenId.value = originalHelpedTokenId;
    addLog("一键5", tokenName, `当前${towerId}层，大于5层，跳过执行`, false);
    return false;
  }

  if (towerId === 1) {
    // Boss战斗 2次
    for (let i = 0; i < 2; i++) {
      await tokenStore.sendMessageWithPromise(
        helpedTokenIdParam,
        "bosstower_startboss",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
    }
    addLog("一键5", tokenName, "第1层：Boss战斗2次完成");

    // 模拟点击使用钥匙按钮
    await useKey();
    await new Promise((r) => setTimeout(r, 1000));

    // Boss战斗 2次
    for (let i = 0; i < 2; i++) {
      await tokenStore.sendMessageWithPromise(
        helpedTokenIdParam,
        "bosstower_startboss",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
    }
    addLog("一键5", tokenName, "使用钥匙后：Boss战斗2次完成");
  }

  helpedTokenId.value = originalHelpedTokenId;
  return true;
};

// 一键5
const oneKey5 = async () => {
  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
    const tokenName = token ? token.name : helpedTokenId.value;
    addLog("一键5", tokenName, "开始执行");
    
    const success = await oneKey5Internal(helpedTokenId.value);
    
    if (success) {
      message.success("一键5完成");
      addLog("一键5", tokenName, "执行完成", true);
    } else {
      message.warning("一键5部分完成或跳过");
    }
  } catch (error) {
    console.error("一键5失败:", error);
    message.error("一键5失败");
    const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
    const tokenName = token ? token.name : helpedTokenId.value;
    addLog("一键5", tokenName, `执行失败: ${error.message || error}`, false);
  } finally {
    isRunning.value = false;
  }
};

// 一键14（内部函数，可接受tokenId参数）
const oneKey14Internal = async (helpedTokenIdParam, helperTokenIdParam = null) => {
  const token = tokenStore.gameTokens.find(t => t.id === helpedTokenIdParam);
  const tokenName = token ? token.name : helpedTokenIdParam;

  // 辅助函数：执行助威连接、搜索队伍、创造队伍
  const executeHelperSetup = async () => {
    if (!helperTokenIdParam) return;
    const originalHelperTokenId = helperTokenId.value;
    helperTokenId.value = helperTokenIdParam;
    
    await connectHelperToken();
    await new Promise((r) => setTimeout(r, 2000));
    
    await searchTeam();
    await new Promise((r) => setTimeout(r, 500));
    
    await createTeam();
    await new Promise((r) => setTimeout(r, 500));
    
    helperTokenId.value = originalHelperTokenId;
  };

  // 辅助函数：执行助威连接和设置队伍（单次）
  const executeHelperSetTeam = async () => {
    if (!helperTokenIdParam) return;
    const originalHelperTokenId = helperTokenId.value;
    helperTokenId.value = helperTokenIdParam;
    
    await connectHelperToken();
    await new Promise((r) => setTimeout(r, 2000));
    
    await setTeam();
    await new Promise((r) => setTimeout(r, 500));
    
    helperTokenId.value = originalHelperTokenId;
  };

  // 辅助函数：只设置队伍（不连接助威，假设已连接）
  const executeSetTeamOnly = async () => {
    if (!helperTokenIdParam) return;
    const originalHelperTokenId = helperTokenId.value;
    helperTokenId.value = helperTokenIdParam;
    
    // 检查连接状态，如果未连接则先连接
    const connectionStatus = tokenStore.getWebSocketStatus(helperTokenIdParam);
    if (connectionStatus !== 'connected') {
      await connectHelperToken();
      await new Promise((r) => setTimeout(r, 2000));
    }
    
    await setTeam();
    await new Promise((r) => setTimeout(r, 500));
    
    helperTokenId.value = originalHelperTokenId;
  };

  // 1. 模拟点击被助连接游戏
  const originalHelpedTokenId = helpedTokenId.value;
  helpedTokenId.value = helpedTokenIdParam;
  await connectHelpedToken();
  await new Promise((r) => setTimeout(r, 2000)); // 等待连接
  
  const connectionStatus = tokenStore.getWebSocketStatus(helpedTokenIdParam);
  if (connectionStatus !== 'connected') {
    helpedTokenId.value = originalHelpedTokenId;
    addLog("一键14", tokenName, "被助Token连接失败", false);
    return false;
  }

  // 2. 模拟点击获取队伍
  await getTeam();
  await new Promise((r) => setTimeout(r, 500));

  // 3. 获取宝库层数
  const bosstowerinfo = await executeCommandWithLog(
    "一键14",
    helpedTokenIdParam,
    tokenName,
    "bosstower_getinfo",
    {},
    5000
  );
  const towerId = bosstowerinfo.bossTower.towerId;
  addLog("一键14", tokenName, `当前宝库层数: ${towerId}`);

  // 4. 如果等于14，跳过执行
  if (towerId === 14) {
    helpedTokenId.value = originalHelpedTokenId;
    addLog("一键14", tokenName, "当前14层，跳过执行", false);
    return false;
  }

  // 5. 如果层数为5，7，8，10，11，13，14，先执行助威连接、搜索队伍、创造队伍
  if ([5, 7, 8, 10, 11, 13, 14].includes(towerId)) {
    addLog("一键14", tokenName, `第${towerId}层：先执行助威连接、搜索队伍、创造队伍`);
    await executeHelperSetup();
  }

  // 5.5. 如果初始层数为6、9、12，先执行该层流程（使用boom和领取奖励），然后执行助威连接、搜索队伍、创造队伍
  let hasExecutedHelperSetupFor6_9_12 = false;
  if (towerId === 6) {
    addLog("一键14", tokenName, `初始层数为6层，先执行第6层流程`);
    // 先执行第6层流程
    await connectHelpedToken();
    await new Promise((r) => setTimeout(r, 1000));
    await getTeam();
    await new Promise((r) => setTimeout(r, 500));
    await executeCommandWithLog(
      "一键14",
      helpedTokenIdParam,
      tokenName,
      "bosstower_getinfo",
      {},
      5000
    );
    await new Promise((r) => setTimeout(r, 500));
    await useBoomInternal(helpedTokenIdParam, true);
    await new Promise((r) => setTimeout(r, 1000));
    await claimRewardInternal(helpedTokenIdParam, true);
    await new Promise((r) => setTimeout(r, 500));
    addLog("一键14", tokenName, "第6层：使用boom和领取奖励完成");
    // 然后执行助威连接、搜索队伍、创造队伍
    await executeHelperSetup();
    hasExecutedHelperSetupFor6_9_12 = true;
    addLog("一键14", tokenName, "第6层：流程后执行助威连接、搜索队伍、创造队伍完成");
  } else if (towerId === 9) {
    addLog("一键14", tokenName, `初始层数为9层，先执行第9层流程`);
    // 先执行第9层流程
    await connectHelpedToken();
    await new Promise((r) => setTimeout(r, 1000));
    await getTeam();
    await new Promise((r) => setTimeout(r, 500));
    await executeCommandWithLog(
      "一键14",
      helpedTokenIdParam,
      tokenName,
      "bosstower_getinfo",
      {},
      5000
    );
    await new Promise((r) => setTimeout(r, 500));
    await useBoomInternal(helpedTokenIdParam, true);
    await new Promise((r) => setTimeout(r, 1000));
    await claimRewardInternal(helpedTokenIdParam, true);
    await new Promise((r) => setTimeout(r, 500));
    addLog("一键14", tokenName, "第9层：使用boom和领取奖励完成");
    // 然后执行助威连接、搜索队伍、创造队伍
    await executeHelperSetup();
    hasExecutedHelperSetupFor6_9_12 = true;
    addLog("一键14", tokenName, "第9层：流程后执行助威连接、搜索队伍、创造队伍完成");
  } else if (towerId === 12) {
    addLog("一键14", tokenName, `初始层数为12层，先执行第12层流程`);
    // 先执行第12层流程
    await connectHelpedToken();
    await new Promise((r) => setTimeout(r, 1000));
    await getTeam();
    await new Promise((r) => setTimeout(r, 500));
    await executeCommandWithLog(
      "一键14",
      helpedTokenIdParam,
      tokenName,
      "bosstower_getinfo",
      {},
      5000
    );
    await new Promise((r) => setTimeout(r, 500));
    await useBoomInternal(helpedTokenIdParam, true);
    await new Promise((r) => setTimeout(r, 1000));
    await claimRewardInternal(helpedTokenIdParam, true);
    await new Promise((r) => setTimeout(r, 500));
    addLog("一键14", tokenName, "第12层：使用boom和领取奖励完成");
    // 然后执行助威连接、搜索队伍、创造队伍
    await executeHelperSetup();
    hasExecutedHelperSetupFor6_9_12 = true;
    addLog("一键14", tokenName, "第12层：流程后执行助威连接、搜索队伍、创造队伍完成");
  }

  // 6. 循环执行直到达到14层
  let currentTowerId = towerId;
  let maxIterations = 20; // 防止无限循环
  let iterationCount = 0;
  
  while (currentTowerId < 14 && iterationCount < maxIterations) {
    iterationCount++;
    addLog("一键14", tokenName, `开始执行第${currentTowerId}层流程`);
    
    // 如果层数为5，7，8，10，11，13，14，先执行助威连接、搜索队伍、创造队伍
    if ([5, 7, 8, 10, 11, 13, 14].includes(currentTowerId)) {
      addLog("一键14", tokenName, `第${currentTowerId}层：先执行助威连接、搜索队伍、创造队伍`);
      await executeHelperSetup();
    }
    
    // 根据当前层数执行不同操作
    if (currentTowerId === 1) {
      // 第1层流程
      await executeCommandWithLog(
        "一键14",
        helpedTokenIdParam,
        tokenName,
        "bosstower_startboss",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第1层：Boss战斗1次完成");
    } else if (currentTowerId === 2) {
      // 第2层流程
      await executeCommandWithLog(
        "一键14",
        helpedTokenIdParam,
        tokenName,
        "bosstower_startboss",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第2层：Boss战斗1次完成");
    } else if (currentTowerId === 3) {
      // 第3层流程：使用钥匙（3层）
      await useKey();
      await new Promise((r) => setTimeout(r, 1000));
      addLog("一键14", tokenName, "第3层：使用钥匙完成");
      
      // 执行完使用钥匙后，模拟点击领取奖励
      await claimRewardInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第3层：领取奖励完成");
    } else if (currentTowerId === 4) {
      // 第4层流程：Boss战斗1次（4层）
      await executeCommandWithLog(
        "一键14",
        helpedTokenIdParam,
        tokenName,
        "bosstower_startboss",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第4层：Boss战斗1次完成");
    } else if (currentTowerId === 5) {
      // 第5层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 助威连接 + 设置队伍（5层）
      await executeHelperSetTeam();
      addLog("一键14", tokenName, "第5层：助威连接、设置队伍完成");
    } else if (currentTowerId === 6) {
      // 第6层流程
      await connectHelpedToken();
      await new Promise((r) => setTimeout(r, 1000));
      
      // 先获取宝库信息，确保游戏状态正确
      await getTeam();
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "执行命令: bosstower_getinfo", true, { cmd: "bosstower_getinfo", params: {} });
      await tokenStore.sendMessageWithPromise(
        helpedTokenIdParam,
        "bosstower_getinfo",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
      
      // 模拟点击使用boom（6层）
      await useBoomInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 1000));
      
      // 执行完使用boom后，模拟点击领取奖励
      await claimRewardInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第6层：领取奖励完成");
      
      // 执行流程后，执行助威连接、搜索队伍、创造队伍（只在第一次执行）
      if (!hasExecutedHelperSetupFor6_9_12) {
        await executeHelperSetup();
        hasExecutedHelperSetupFor6_9_12 = true;
        addLog("一键14", tokenName, "第6层：流程后执行助威连接、搜索队伍、创造队伍完成");
      } else {
        addLog("一键14", tokenName, "第6层：已执行过助威连接、搜索队伍、创造队伍，跳过");
      }
    } else if (currentTowerId === 7) {
      // 第7层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 助威连接 + 设置队伍（7层）
      await executeHelperSetTeam();
      addLog("一键14", tokenName, "第7层：助威连接、设置队伍完成");
    } else if (currentTowerId === 8) {
      // 第8层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 设置队伍（8层）
      await executeSetTeamOnly();
      addLog("一键14", tokenName, "第8层：设置队伍完成");
    } else if (currentTowerId === 9) {
      // 第9层流程
      await connectHelpedToken();
      await new Promise((r) => setTimeout(r, 1000));
      
      // 先获取宝库信息，确保游戏状态正确
      await getTeam();
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "执行命令: bosstower_getinfo", true, { cmd: "bosstower_getinfo", params: {} });
      await tokenStore.sendMessageWithPromise(
        helpedTokenIdParam,
        "bosstower_getinfo",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
      
      // 模拟点击使用boom（9层）
      await useBoomInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 1000));
      
      // 执行完使用boom后，模拟点击领取奖励
      await claimRewardInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第9层：领取奖励完成");
      
      // 执行流程后，执行助威连接、搜索队伍、创造队伍（只在第一次执行）
      if (!hasExecutedHelperSetupFor6_9_12) {
        await executeHelperSetup();
        hasExecutedHelperSetupFor6_9_12 = true;
        addLog("一键14", tokenName, "第9层：流程后执行助威连接、搜索队伍、创造队伍完成");
      } else {
        addLog("一键14", tokenName, "第9层：已执行过助威连接、搜索队伍、创造队伍，跳过");
      }
    } else if (currentTowerId === 10) {
      // 第10层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 助威连接 + 设置队伍（10层）
      await executeHelperSetTeam();
      addLog("一键14", tokenName, "第10层：助威连接、设置队伍完成");
    } else if (currentTowerId === 11) {
      // 第11层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 设置队伍（11层）
      await executeSetTeamOnly();
      addLog("一键14", tokenName, "第11层：设置队伍完成");
    } else if (currentTowerId === 12) {
      // 第12层流程
      await connectHelpedToken();
      await new Promise((r) => setTimeout(r, 1000));
      
      // 先获取宝库信息，确保游戏状态正确
      await getTeam();
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "执行命令: bosstower_getinfo", true, { cmd: "bosstower_getinfo", params: {} });
      await tokenStore.sendMessageWithPromise(
        helpedTokenIdParam,
        "bosstower_getinfo",
        {},
        5000
      );
      await new Promise((r) => setTimeout(r, 500));
      
      // 模拟点击使用boom（12层）
      await useBoomInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 1000));
      
      // 执行完使用boom后，模拟点击领取奖励
      await claimRewardInternal(helpedTokenIdParam, true);
      await new Promise((r) => setTimeout(r, 500));
      addLog("一键14", tokenName, "第12层：领取奖励完成");
      
      // 执行流程后，执行助威连接、搜索队伍、创造队伍（只在第一次执行）
      if (!hasExecutedHelperSetupFor6_9_12) {
        await executeHelperSetup();
        hasExecutedHelperSetupFor6_9_12 = true;
        addLog("一键14", tokenName, "第12层：流程后执行助威连接、搜索队伍、创造队伍完成");
      } else {
        addLog("一键14", tokenName, "第12层：已执行过助威连接、搜索队伍、创造队伍，跳过");
      }
    } else if (currentTowerId === 13) {
      // 第13层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 助威连接 + 设置队伍（13层）
      await executeHelperSetTeam();
      addLog("一键14", tokenName, "第13层：助威连接、设置队伍完成");
    } else if (currentTowerId === 14) {
      // 第14层流程（已在前面执行了助威连接、搜索队伍、创造队伍）
      // 设置队伍（14层）
      await executeSetTeamOnly();
      addLog("一键14", tokenName, "第14层：设置队伍完成");
    }

    // 执行完当前层后，重新获取宝库层数
    await connectHelpedToken();
    await new Promise((r) => setTimeout(r, 1000));
    await getTeam();
    await new Promise((r) => setTimeout(r, 500));
    
    let nextBosstowerinfo = await executeCommandWithLog(
      "一键14",
      helpedTokenIdParam,
      tokenName,
      "bosstower_getinfo",
      {},
      5000
    );
    let nextTowerId = nextBosstowerinfo.bossTower.towerId;
    addLog("一键14", tokenName, `执行完第${currentTowerId}层后，当前宝库层数: ${nextTowerId}`);
    
    // 如果层数已经达到14层，退出循环
    if (nextTowerId >= 14) {
      addLog("一键14", tokenName, `已达到14层，停止执行`);
      break;
    }
    
    // 如果层数没有变化，重复执行当前层流程最多3次
    if (nextTowerId === currentTowerId) {
      addLog("一键14", tokenName, `层数未变化（仍为${currentTowerId}层），重复执行当前层流程`);
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && nextTowerId === currentTowerId) {
        retryCount++;
        addLog("一键14", tokenName, `第${retryCount}次重复执行第${currentTowerId}层流程`);
        
        // 如果层数为5，7，8，10，11，13，14，先执行助威连接、搜索队伍、创造队伍
        if ([5, 7, 8, 10, 11, 13, 14].includes(currentTowerId)) {
          await executeHelperSetup();
        }
        
        // 根据当前层数执行不同操作（复用之前的逻辑）
        if (currentTowerId === 1) {
          addLog("一键14", tokenName, `执行命令: bosstower_startboss (重试第${retryCount}次)`, true, { cmd: "bosstower_startboss", params: {} });
          await tokenStore.sendMessageWithPromise(
            helpedTokenIdParam,
            "bosstower_startboss",
            {},
            5000
          );
          await new Promise((r) => setTimeout(r, 500));
        } else if (currentTowerId === 2) {
          addLog("一键14", tokenName, `执行命令: bosstower_startboss (重试第${retryCount}次)`, true, { cmd: "bosstower_startboss", params: {} });
          await tokenStore.sendMessageWithPromise(
            helpedTokenIdParam,
            "bosstower_startboss",
            {},
            5000
          );
          await new Promise((r) => setTimeout(r, 500));
        } else if (currentTowerId === 3) {
          await useKey();
          await new Promise((r) => setTimeout(r, 1000));
          await claimRewardInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 500));
        } else if (currentTowerId === 4) {
          addLog("一键14", tokenName, `执行命令: bosstower_startboss (重试第${retryCount}次)`, true, { cmd: "bosstower_startboss", params: {} });
          await tokenStore.sendMessageWithPromise(
            helpedTokenIdParam,
            "bosstower_startboss",
            {},
            5000
          );
          await new Promise((r) => setTimeout(r, 500));
        } else if (currentTowerId === 5) {
          await executeHelperSetTeam();
        } else if (currentTowerId === 6) {
          await connectHelpedToken();
          await new Promise((r) => setTimeout(r, 1000));
          // 先获取宝库信息，确保游戏状态正确
          await getTeam();
          await new Promise((r) => setTimeout(r, 500));
          await executeCommandWithLog(
            "一键14",
            helpedTokenIdParam,
            tokenName,
            "bosstower_getinfo",
            {},
            5000
          );
          await new Promise((r) => setTimeout(r, 500));
          await useBoomInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 1000));
          await claimRewardInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 500));
          // 只在第一次执行时执行助威连接、搜索队伍、创造队伍
          if (!hasExecutedHelperSetupFor6_9_12) {
            await executeHelperSetup();
            hasExecutedHelperSetupFor6_9_12 = true;
          }
        } else if (currentTowerId === 7) {
          await executeHelperSetTeam();
        } else if (currentTowerId === 8) {
          await executeSetTeamOnly();
        } else if (currentTowerId === 9) {
          await connectHelpedToken();
          await new Promise((r) => setTimeout(r, 1000));
          // 先获取宝库信息，确保游戏状态正确
          await getTeam();
          await new Promise((r) => setTimeout(r, 500));
          await executeCommandWithLog(
            "一键14",
            helpedTokenIdParam,
            tokenName,
            "bosstower_getinfo",
            {},
            5000
          );
          await new Promise((r) => setTimeout(r, 500));
          await useBoomInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 1000));
          await claimRewardInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 500));
          // 只在第一次执行时执行助威连接、搜索队伍、创造队伍
          if (!hasExecutedHelperSetupFor6_9_12) {
            await executeHelperSetup();
            hasExecutedHelperSetupFor6_9_12 = true;
          }
        } else if (currentTowerId === 10) {
          await executeHelperSetTeam();
        } else if (currentTowerId === 11) {
          await executeSetTeamOnly();
        } else if (currentTowerId === 12) {
          await connectHelpedToken();
          await new Promise((r) => setTimeout(r, 1000));
          // 先获取宝库信息，确保游戏状态正确
          await getTeam();
          await new Promise((r) => setTimeout(r, 500));
          await executeCommandWithLog(
            "一键14",
            helpedTokenIdParam,
            tokenName,
            "bosstower_getinfo",
            {},
            5000
          );
          await new Promise((r) => setTimeout(r, 500));
          
          // 模拟点击使用boom（12层）
          addLog("一键14", tokenName, `重试第${retryCount}次：开始使用boom（12层）`);
          await useBoomInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 1000));
          addLog("一键14", tokenName, `重试第${retryCount}次：使用boom完成`);
          
          // 执行完使用boom后，模拟点击领取奖励
          addLog("一键14", tokenName, `重试第${retryCount}次：开始领取奖励`);
          await claimRewardInternal(helpedTokenIdParam, true);
          await new Promise((r) => setTimeout(r, 500));
          addLog("一键14", tokenName, `重试第${retryCount}次：领取奖励完成`);
          
          // 只在第一次执行时执行助威连接、搜索队伍、创造队伍
          if (!hasExecutedHelperSetupFor6_9_12) {
            await executeHelperSetup();
            hasExecutedHelperSetupFor6_9_12 = true;
          }
        } else if (currentTowerId === 13) {
          await executeHelperSetTeam();
        } else if (currentTowerId === 14) {
          await executeSetTeamOnly();
        }
        
        // 重新获取宝库层数
        await connectHelpedToken();
        await new Promise((r) => setTimeout(r, 1000));
        await getTeam();
        await new Promise((r) => setTimeout(r, 500));
        
        nextBosstowerinfo = await executeCommandWithLog(
          "一键14",
          helpedTokenIdParam,
          tokenName,
          "bosstower_getinfo",
          {},
          5000
        );
        nextTowerId = nextBosstowerinfo.bossTower.towerId;
        addLog("一键14", tokenName, `第${retryCount}次重复执行后，当前宝库层数: ${nextTowerId}`);
        
        // 如果层数已经达到14层，退出循环
        if (nextTowerId >= 14) {
          addLog("一键14", tokenName, `已达到14层，停止执行`);
          break;
        }
        
        // 如果层数变化了，退出重试循环
        if (nextTowerId !== currentTowerId) {
          addLog("一键14", tokenName, `层数已变化（${currentTowerId}层 → ${nextTowerId}层），继续执行`);
          break;
        }
        
        // 如果还没达到最大重试次数，继续重试
        if (retryCount < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000)); // 重试前延迟
        }
      }
      
      // 如果3次重试后层数仍未变化，退出循环
      if (nextTowerId === currentTowerId && retryCount >= maxRetries) {
        addLog("一键14", tokenName, `重复执行${maxRetries}次后层数仍未变化（仍为${currentTowerId}层），停止执行`, false);
        break;
      }
    }
    
    // 如果层数已经达到14层，退出循环
    if (nextTowerId >= 14) {
      break;
    }
    
    // 更新当前层数，继续下一层
    currentTowerId = nextTowerId;
    await new Promise((r) => setTimeout(r, 1000)); // 层间延迟
  }

  // 最后：模拟点击被助连接游戏，模拟点击获取队伍，获取最终宝库层数
  await connectHelpedToken();
  await new Promise((r) => setTimeout(r, 1000));
  await getTeam();
  await new Promise((r) => setTimeout(r, 500));
  
  const finalBosstowerinfo = await executeCommandWithLog(
    "一键14",
    helpedTokenIdParam,
    tokenName,
    "bosstower_getinfo",
    {},
    5000
  );
  const finalTowerId = finalBosstowerinfo.bossTower.towerId;
  addLog("一键14", tokenName, `最终宝库层数: ${finalTowerId}`);

  helpedTokenId.value = originalHelpedTokenId;
  return true;
};

// 一键14
const oneKey14 = async () => {
  if (!helpedTokenId.value) {
    message.warning("请先选择被助Token");
    return;
  }

  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
    const tokenName = token ? token.name : helpedTokenId.value;
    addLog("一键14", tokenName, "开始执行");
    
    const success = await oneKey14Internal(helpedTokenId.value, helperTokenId.value);
    
    if (success) {
      message.success("一键14完成");
      addLog("一键14", tokenName, "执行完成", true);
    } else {
      message.warning("一键14部分完成或跳过");
    }
  } catch (error) {
    console.error("一键14失败:", error);
    message.error("一键14失败");
    const token = tokenStore.gameTokens.find(t => t.id === helpedTokenId.value);
    const tokenName = token ? token.name : helpedTokenId.value;
    addLog("一键14", tokenName, `执行失败: ${error.message || error}`, false);
  } finally {
    isRunning.value = false;
  }
};

// 批量5
const batch5 = async () => {
  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(executionRange.value);
    const targetTokens = connectionPool.getTargetTokens(tokenStore.gameTokens, tokenIndices);
    const rangeText = executionRange.value ? `范围: ${executionRange.value}` : "全部Token";
    addLog("批量5", "系统", `开始批量执行，${rangeText}，共${targetTokens.length}个Token`);
    
    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          // 执行一键5（内部函数，避免isRunning冲突）
          const success = await oneKey5Internal(token.id);
          
          if (success) {
            console.log(`Token ${token.name} 一键5完成`);
            addLog("批量5", token.name, "执行完成", true);
            return { success: true, token: token };
          } else {
            addLog("批量5", token.name, "执行失败: 条件不满足", false);
            return { success: false, token: token, error: "条件不满足" };
          }
        } catch (error) {
          console.error(`Token ${token.name} 一键5失败:`, error);
          addLog("批量5", token.name, `执行失败: ${error.message || error}`, false);
          return { success: false, token: token, error: error.message || error };
        }
      },
      { batchSize: 20, delayBetween: 300 }
    );

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const summary = `批量5完成：成功${successCount}个，失败${failCount}个`;
    message.success(summary);
    addLog("批量5", "系统", summary, successCount > 0);
  } catch (error) {
    console.error("批量5失败:", error);
    message.error(`批量5失败: ${error.message || error}`);
    addLog("批量5", "系统", `批量执行失败: ${error.message || error}`, false);
  } finally {
    isRunning.value = false;
  }
};

// 批量14
const batch14 = async () => {
  if (isRunning.value) {
    message.warning("操作正在进行中，请稍后再试");
    return;
  }

  isRunning.value = true;
  try {
    // 获取标签为"宝库"的token作为助威token
    const helperTokens = tokenStore.gameTokens.filter(t => t.remark && t.remark.includes("宝库"));
    if (helperTokens.length === 0) {
      message.warning("未找到标签为'宝库'的Token，请先设置助威Token的备注为'宝库'");
      addLog("批量14", "系统", "未找到标签为'宝库'的Token", false);
      return;
    }

    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(executionRange.value);
    let targetTokens = connectionPool.getTargetTokens(tokenStore.gameTokens, tokenIndices);
    
    // 如果跳过标签开关打开，过滤掉标签为"跳过"的token
    if (skipLabelEnabled.value) {
      const originalCount = targetTokens.length;
      targetTokens = targetTokens.filter(token => {
        // 检查remark字段是否包含"跳过"
        const hasSkipLabel = token.remark && token.remark.includes("跳过");
        return !hasSkipLabel;
      });
      const skippedCount = originalCount - targetTokens.length;
      if (skippedCount > 0) {
        addLog("批量14", "系统", `跳过标签已启用，已跳过${skippedCount}个Token`);
      }
    }
    
    const rangeText = executionRange.value ? `范围: ${executionRange.value}` : "全部Token";
    addLog("批量14", "系统", `开始批量执行，${rangeText}，共${targetTokens.length}个Token，助威Token: ${helperTokens.length}个`);
    
    let successCount = 0;
    let failCount = 0;
    let helperTokenIndex = 0;
    let executionCount = 0;

    // 使用连接池执行批量操作
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          // 每执行6次一键14，更换宝库标签的token
          if (executionCount > 0 && executionCount % 6 === 0) {
            // 将当前助威token的标签更改为空
            if (helperTokenIndex < helperTokens.length) {
              const currentHelperToken = helperTokens[helperTokenIndex];
              tokenStore.updateToken(currentHelperToken.id, { remark: (currentHelperToken.remark || "").replace("宝库", "").trim() });
              addLog("批量14", "系统", `更换助威Token：${currentHelperToken.name}，标签已清空`);
            }
            
            helperTokenIndex++;
            if (helperTokenIndex >= helperTokens.length) {
              helperTokenIndex = 0; // 循环使用
            }
          }

          // 获取当前助威token
          const currentHelperToken = helperTokens[helperTokenIndex];
          if (!currentHelperToken) {
            addLog("批量14", token.name, "无可用助威Token", false);
            return { success: false, token: token, error: "无可用助威Token" };
          }

          // 执行一键14
          const success = await oneKey14Internal(token.id, currentHelperToken.id);
          
          if (success) {
            successCount++;
            executionCount++;
            console.log(`Token ${token.name} 一键14完成，使用助威Token: ${currentHelperToken.name}`);
            addLog("批量14", token.name, `执行完成，使用助威Token: ${currentHelperToken.name}`, true);
            return { success: true, token: token, helperToken: currentHelperToken };
          } else {
            failCount++;
            return { success: false, token: token, error: "执行失败" };
          }
        } catch (error) {
          console.error(`Token ${token.name} 一键14失败:`, error);
          addLog("批量14", token.name, `执行失败: ${error.message || error}`, false);
          failCount++;
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
            message.info(`[${progress.globalIndex}/${progress.totalTokens}] ${progress.tokenName} 正在获取连接...`);
          } else if (progress.type === 'token-success') {
            message.success(`[${progress.globalIndex}] ${progress.tokenName} 连接成功`);
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`);
            } else {
              message.error(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`);
            }
          }
        }
      }
    );

    // 最后清空所有助威token的标签
    helperTokens.forEach(helperToken => {
      tokenStore.updateToken(helperToken.id, { remark: (helperToken.remark || "").replace("宝库", "").trim() });
    });

    const summary = `批量14完成：成功${successCount}个，失败${failCount}个`;
    message.success(summary);
    addLog("批量14", "系统", summary, successCount > 0);
  } catch (error) {
    console.error("批量14失败:", error);
    message.error(`批量14失败: ${error.message || error}`);
    addLog("批量14", "系统", `批量执行失败: ${error.message || error}`, false);
  } finally {
    isRunning.value = false;
  }
};
</script>

<style scoped>
.boss-tower {
  /* 可以添加一些自定义样式 */
}
</style>