<template>
  <div class="status-card tower-status weird-tower">
    <div class="card-header">
      <img
        src="/icons/1733492491706152.png"
        alt="怪异塔图标"
        class="status-icon"
      />
      <div class="status-info">
        <h3>怪异塔</h3>
        <p>一个不小心就过了</p>
      </div>
      <div class="energy-display">
        <img src="/icons/xiaoyugan.png" alt="小鱼干" class="energy-icon" />
        <span class="energy-count">{{ towerEnergy }}</span>
        <button
          class="refresh-tower-button"
          :class="{ spinning: isRefreshing }"
          :disabled="isRefreshing"
          title="刷新怪异塔信息"
          @click="refreshTowerInfo"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path
              d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
        </button>
        <button
          class="buy-energy-button"
          :class="{
            disabled: isBuying || isClimbing || isUsingItems || isMerging,
          }"
          :disabled="isBuying || isClimbing || isUsingItems || isMerging"
          @click="openBuyEnergyDialog"
        >
          购买
        </button>
      </div>
    </div>

    <!-- 购买小鱼干弹窗：Teleport 到 body，脱离 n-tabs animated 的 transform 包含块，
         否则 position: fixed 会失效导致弹窗跟随鼠标移动 -->
    <Teleport to="body">
      <div
        v-if="showBuyEnergyDialog"
        class="buy-energy-mask"
        @click.self="closeBuyEnergyDialog"
      >
        <div class="buy-energy-dialog" @click.stop>
          <div class="dialog-header">
            <h3>购买小鱼干</h3>
            <button class="dialog-close" @click="closeBuyEnergyDialog">
              ×
            </button>
          </div>
          <div class="dialog-body">
            <div class="dialog-row">
              <span class="row-label">购买数量</span>
              <div class="num-selector">
                <button class="num-btn" @click="changeBuyNum(-1)">-</button>
                <input
                  v-model.number="buyEnergyNum"
                  type="number"
                  min="1"
                  max="100"
                  class="num-input"
                  @blur="clampBuyNum"
                />
                <button class="num-btn" @click="changeBuyNum(1)">+</button>
              </div>
            </div>
            <div class="dialog-row">
              <span class="row-label">快捷选择</span>
              <div class="quick-btns">
                <button
                  v-for="n in [1, 10, 50, 100]"
                  :key="n"
                  class="quick-btn"
                  @click="buyEnergyNum = n"
                >
                  {{ n }}
                </button>
              </div>
            </div>
            <div class="dialog-hint">
              消耗
              <svg class="gold-icon" viewBox="0 0 24 24" aria-hidden="true">
                <defs>
                  <linearGradient id="goldFace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#FFE082" />
                    <stop offset="55%" stop-color="#FFC107" />
                    <stop offset="100%" stop-color="#E6A117" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 1.6 22 6.2 12 10.8 2 6.2Z"
                  fill="url(#goldFace)"
                  stroke="#B07600"
                  stroke-width="1.1"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 6.2V17.8L12 22.4V10.8Z"
                  fill="#F9A825"
                  stroke="#B07600"
                  stroke-width="1.1"
                  stroke-linejoin="round"
                />
                <path
                  d="M22 6.2V17.8L12 22.4V10.8Z"
                  fill="#EFB218"
                  stroke="#B07600"
                  stroke-width="1.1"
                  stroke-linejoin="round"
                />
              </svg>
              金砖，每次购买 1-100 份小鱼干
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-cancel" @click="closeBuyEnergyDialog">
              取消
            </button>
            <button
              class="btn-confirm"
              :class="{ disabled: buyEnergyNum < 1 || buyEnergyNum > 100 }"
              :disabled="buyEnergyNum < 1 || buyEnergyNum > 100"
              @click="confirmBuyEnergy"
            >
              确认购买
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="card-content">
      <div class="tower-floor">
        <span class="label">当前层数</span>
        <span class="floor-number">{{ displayFloor }}</span>
      </div>
    </div>

    <div class="card-actions">
      <div class="climb-action-row">
        <input
          v-model.number="maxClimbInput"
          class="climb-limit-input"
          type="number"
          min="1"
          step="1"
          aria-label="怪异塔爬塔次数"
          :disabled="isClimbing || isUsingItems || isMerging"
        />
        <span class="climb-limit-unit">次</span>
        <button
          class="climb-button"
          :class="[
            {
              active: canClimb,
              disabled: !canClimb,
            },
          ]"
          :disabled="!canClimb"
          @click="startTowerClimb"
        >
          {{ isClimbing ? "爬塔中..." : "开始爬塔" }}
        </button>
      </div>

      <!-- 停止批量爬塔按钮，仅批量时显示 -->
      <button v-if="isClimbing" class="stop-button" @click="stopClimbing">
        停止爬塔
      </button>

      <button
        v-if="!isClimbing && !isUsingItems && !isMerging"
        class="climb-button active"
        @click="startUseItems"
      >
        一键使用道具
      </button>
      <button v-if="isUsingItems" class="stop-button" @click="stopUsingItems">
        停止使用
      </button>

      <button
        v-if="!isClimbing && !isUsingItems && !isMerging"
        class="climb-button active"
        @click="autoMergeItems"
      >
        {{ isMerging ? "合成中..." : "一键合成" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useMessage } from "naive-ui";

// 停止批量爬塔操作
import { computed, onMounted, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { isSameGameValue } from "@/utils/gameValue.js";
import {
  DEFAULT_WEIRD_TOWER_MAX_CLIMB,
  normalizeWeirdTowerMaxClimb,
} from "@/utils/towerClimbLimit.js";

let stopFlag = false;
let stopItemFlag = false;
let stopMergeFlag = false;

const stopClimbing = () => {
  stopFlag = true;
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value);
    climbTimeout.value = null;
  }
  isClimbing.value = false;
  message.info("已手动停止批量爬塔");
};

const stopUsingItems = () => {
  stopItemFlag = true;
  if (itemTimeout.value) {
    clearTimeout(itemTimeout.value);
    itemTimeout.value = null;
  }
  isUsingItems.value = false;
  message.info("已手动停止使用道具");
};

const tokenStore = useTokenStore();
const message = useMessage();

// 响应式数据
const isClimbing = ref(false);
/** 手动刷新怪异塔信息中（防重复点击 + 转圈动画） */
const isRefreshing = ref(false);
const isUsingItems = ref(false);
const isMerging = ref(false);
const isBuying = ref(false); // 购买小鱼干状态
const showBuyEnergyDialog = ref(false); // 购买弹窗显示
const buyEnergyNum = ref(1); // 购买数量（1-100）
const maxClimbInput = ref(DEFAULT_WEIRD_TOWER_MAX_CLIMB);
const climbTimeout = ref(null); // 用于超时重置状态
const itemTimeout = ref(null); // 用于道具使用超时
const mergeTimeout = ref(null); // 用于合成超时
// 最后一次爬塔结果

// 计算属性 - 从gameData中获取塔相关信息
const evoTowerInfo = computed(() => {
  const data = tokenStore.gameData?.evoTowerInfo || null;
  return data;
});

const weirdTowerData = computed(() => {
  return evoTowerInfo.value?.evoTower || null;
});

const currentTowerId = computed(() => {
  return weirdTowerData.value?.towerId || 0;
});

// 已领取到的章号，与已通关章数不一致时游戏服会拒绝开战
const rewardTowerId = computed(() => {
  return weirdTowerData.value?.rewardTowerId || 0;
});

// 未领取的章节通关奖励数量：已通关章数(towerId / 10) - 已领章号
const pendingChapterRewards = computed(() => {
  const towerId = currentTowerId.value;
  if (!towerId) {
    return 0;
  }
  return Math.max(0, Math.floor(towerId / 10) - rewardTowerId.value);
});

const displayFloor = computed(() => {
  const towerId = currentTowerId.value;

  if (towerId === 0) {
    return "1-1";
  } else {
    // 计算章节和层数
    // 每章10层，0-9为第1章，10-19为第2章，20-29为第3章，以此类推
    const chapter = Math.floor(towerId / 10) + 1;
    const floor = (towerId % 10) + 1;
    return `${chapter}-${floor}`;
  }
});

const towerEnergy = computed(() => {
  return weirdTowerData.value?.energy || 0;
});

const canClimb = computed(() => {
  const hasEnergy = towerEnergy.value > 0;
  const notClimbing = !isClimbing.value;
  const notUsingItems = !isUsingItems.value;
  const notMerging = !isMerging.value;
  return hasEnergy && notClimbing && notUsingItems && notMerging;
});

// ==================== 购买小鱼干 ====================
// 接口来源：逆向 game bundle (game/index.140bc.jsc) 解密后源码
//   EvoTowerService.buyEnergy({ energy: N })
// 对应 WebSocket 命令：evotower_buyenergy（命名规律 getInfo→evotower_getinfo）
// 价格：ConstantConf.config.evoTowerEnergyPrice，支付货币：金砖

const openBuyEnergyDialog = () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }
  if (
    isClimbing.value ||
    isUsingItems.value ||
    isMerging.value ||
    isBuying.value
  ) {
    message.warning("正在执行其他操作，请稍候");
    return;
  }
  buyEnergyNum.value = 1;
  showBuyEnergyDialog.value = true;
};

const closeBuyEnergyDialog = () => {
  if (isBuying.value) return;
  showBuyEnergyDialog.value = false;
};

const changeBuyNum = (delta) => {
  buyEnergyNum.value = Math.max(1, Math.min(100, buyEnergyNum.value + delta));
};

const clampBuyNum = () => {
  if (!buyEnergyNum.value || buyEnergyNum.value < 1) buyEnergyNum.value = 1;
  if (buyEnergyNum.value > 100) buyEnergyNum.value = 100;
};

/**
 * 确认购买小鱼干，发送购买指令并刷新怪异塔能量。
 *
 * @returns {Promise<void>} 无返回值，结果通过 message 提示
 */
const confirmBuyEnergy = async () => {
  clampBuyNum();
  const num = buyEnergyNum.value;
  if (num < 1 || num > 100) {
    message.error("购买数量必须在 1-100 之间");
    return;
  }
  const tokenId = tokenStore.selectedToken.id;
  const beforeEnergy = towerEnergy.value;

  isBuying.value = true;
  showBuyEnergyDialog.value = false;
  try {
    const res = await tokenStore.sendMessageWithPromise(
      tokenId,
      "evotower_buyenergy",
      { energy: num },
      8000,
    );
    // 刷新怪异塔信息
    await getTowerInfo();
    const afterEnergy = towerEnergy.value;
    const gain = afterEnergy - beforeEnergy;
    if (gain > 0) {
      message.success(`购买成功！小鱼干 +${gain}（当前 ${afterEnergy}）`);
    } else if (gain === 0) {
      message.warning(`购买已执行（当前 ${afterEnergy}）`);
    } else {
      message.warning(`购买已执行，能量变化 ${gain}（当前 ${afterEnergy}）`);
    }
    console.log("[购买小鱼干] 响应:", JSON.stringify(res).slice(0, 500));
  } catch (error) {
    console.error("[购买小鱼干] 失败:", error);
    const errMsg = error?.message || String(error);
    if (errMsg.includes("1300050") || errMsg.includes("购买数量")) {
      message.error("购买数量超出限制，请调整数量");
    } else if (errMsg.includes("金砖")) {
      message.error("金砖不足，无法购买");
    } else {
      message.error(`购买失败：${errMsg.slice(0, 80)}`);
    }
  } finally {
    isBuying.value = false;
  }
};

const getCurrentActivityWeek = computed(() => {
  const now = new Date();
  const start = new Date("2025-12-12T12:00:00"); // 起始时间：黑市周开始
  const weekDuration = 7 * 24 * 60 * 60 * 1000; // 一周毫秒数
  const cycleDuration = 3 * weekDuration; // 三周期毫秒数

  const elapsed = now - start;
  if (elapsed < 0) return null; // 活动开始前

  const cyclePosition = elapsed % cycleDuration;

  if (cyclePosition < weekDuration) {
    return "黑市周";
  } else if (cyclePosition < 2 * weekDuration) {
    return "招募周";
  } else {
    return "宝箱周";
  }
});

const isWeirdTowerActivityOpen = computed(() => {
  return getCurrentActivityWeek.value === "黑市周";
});

// 方法
const startUseItems = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }

  if (isClimbing.value) {
    message.warning("正在爬塔中，请稍后再试");
    return;
  }

  if (isMerging.value) {
    message.warning("正在合成中，请稍后再试");
    return;
  }

  isUsingItems.value = true;
  stopItemFlag = false;

  // 设置超时保护，60秒后自动重置状态
  itemTimeout.value = setTimeout(() => {
    isUsingItems.value = false;
    itemTimeout.value = null;
    stopItemFlag = true;
    message.info("一键使用道具已超时自动停止");
  }, 60000);

  try {
    const tokenId = tokenStore.selectedToken.id;

    // 1. 获取活动信息
    const infoRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "mergebox_getinfo",
      { actType: 1 },
      5000,
    );

    // 获取怪异塔信息以读取剩余道具数量
    const towerInfoRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "evotower_getinfo",
      {},
      5000,
    );

    if (!infoRes || !infoRes.mergeBox) {
      throw new Error("获取活动信息失败");
    }

    let costTotalCnt = infoRes.mergeBox.costTotalCnt || 0;
    let lotteryLeftCnt = towerInfoRes?.evoTower?.lotteryLeftCnt || 0;

    if (lotteryLeftCnt <= 0) {
      message.info("没有剩余道具可使用");
      isUsingItems.value = false;
      if (itemTimeout.value) clearTimeout(itemTimeout.value);
      return;
    }

    message.success(
      `开始使用道具，剩余：${lotteryLeftCnt}，已用：${costTotalCnt}`,
    );
    let processedCount = 0;

    // eslint-disable-next-line no-unmodified-loop-condition -- The Stop button changes this flag while awaited requests yield.
    while (lotteryLeftCnt > 0 && !stopItemFlag) {
      let pos = {};
      if (costTotalCnt < 2) {
        pos = { gridX: 4, gridY: 5 };
      } else if (costTotalCnt < 102) {
        pos = { gridX: 7, gridY: 3 };
      } else {
        pos = { gridX: 6, gridY: 3 };
      }

      // 2. 使用道具
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "mergebox_openbox",
        {
          actType: 1,
          pos,
        },
        5000,
      );

      costTotalCnt++;
      lotteryLeftCnt--;
      processedCount++;

      await new Promise((res) => setTimeout(res, 500));
    }

    // 领取累计奖励
    await tokenStore
      .sendMessageWithPromise(
        tokenId,
        "mergebox_claimcostprogress",
        { actType: 1 },
        5000,
      )
      .catch(() => {});

    message.success(`已使用道具 ${processedCount} 次`);
    // 刷新一下
    await getTowerInfo();
  } catch (error) {
    message.error(`使用道具失败: ${error.message || "未知错误"}`);
  } finally {
    if (itemTimeout.value) {
      clearTimeout(itemTimeout.value);
      itemTimeout.value = null;
    }
    isUsingItems.value = false;
  }
};

const autoMergeItems = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }

  if (isClimbing.value || isUsingItems.value) {
    message.warning("正在执行其他操作，请稍后再试");
    return;
  }

  isMerging.value = true;
  stopMergeFlag = false;

  // 设置超时保护，60秒后自动重置状态
  mergeTimeout.value = setTimeout(() => {
    isMerging.value = false;
    mergeTimeout.value = null;
    stopMergeFlag = true;
    message.info("一键合成已超时自动停止");
  }, 60000);

  try {
    const tokenId = tokenStore.selectedToken.id;
    message.loading("正在执行一键合成...");

    let loopCount = 0;
    const MAX_LOOPS = 20;

    // eslint-disable-next-line no-unmodified-loop-condition -- The Stop button changes this flag while awaited requests yield.
    while (loopCount < MAX_LOOPS && !stopMergeFlag) {
      loopCount++;

      // 获取当前信息
      const infoRes = await tokenStore.sendMessageWithPromise(
        tokenId,
        "mergebox_getinfo",
        { actType: 1 },
        5000,
      );

      if (!infoRes || !infoRes.mergeBox) {
        throw new Error("返回数据缺少 mergeBox");
      }

      // 领取合成奖励
      if (infoRes.mergeBox.taskMap) {
        const taskMap = infoRes.mergeBox.taskMap;
        const taskClaimMap = infoRes.mergeBox.taskClaimMap || {};

        for (const taskId in taskMap) {
          if (stopMergeFlag) break;
          if (taskMap[taskId] !== 0 && !taskClaimMap[taskId]) {
            await tokenStore
              .sendMessageWithPromise(
                tokenId,
                "mergebox_claimmergeprogress",
                { actType: 1, taskId: Number.parseInt(taskId) },
                2000,
              )
              .catch(() => {});
            await new Promise((res) => setTimeout(res, 500));
          }
        }
      }

      // 解析 gridMap
      const gridMap = infoRes.mergeBox.gridMap || {};
      const items = [];

      // 收集所有 gridConfId === 0 的物品
      for (const xStr in gridMap) {
        for (const yStr in gridMap[xStr]) {
          const item = gridMap[xStr][yStr];
          if (
            isSameGameValue(item.gridConfId, 0) &&
            item.gridItemId > 0 &&
            !item.isLock
          ) {
            items.push({
              x: Number.parseInt(xStr),
              y: Number.parseInt(yStr),
              id: item.gridItemId,
            });
          }
        }
      }

      // 按 gridItemId 分组
      const groupedItems = {};
      items.forEach((item) => {
        if (!groupedItems[item.id]) {
          groupedItems[item.id] = [];
        }
        groupedItems[item.id].push(item);
      });

      // 检查是否有可合成项
      let hasPotentialMerge = false;
      for (const id in groupedItems) {
        if (groupedItems[id].length >= 2) {
          hasPotentialMerge = true;
          break;
        }
      }

      if (!hasPotentialMerge) {
        if (loopCount === 1) {
          message.info("当前没有可合成的物品");
        }
        break;
      }

      const isLevel8OrAbove =
        infoRes.mergeBox.taskMap &&
        infoRes.mergeBox.taskMap["251212208"] &&
        infoRes.mergeBox.taskMap["251212208"] !== 0;

      if (isLevel8OrAbove) {
        // 8级以上使用智能合成
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "mergebox_automergeitem",
          { actType: 1 },
          10000,
        );
        await new Promise((res) => setTimeout(res, 1500));
      } else {
        // 8级以下手动合成
        for (const id in groupedItems) {
          if (stopMergeFlag) break;
          const group = groupedItems[id];
          // 两两合成
          while (group.length >= 2) {
            if (stopMergeFlag) break;
            const source = group.shift();
            const target = group.shift();

            await tokenStore
              .sendMessageWithPromise(
                tokenId,
                "mergebox_mergeitem",
                {
                  actType: 1,
                  sourcePos: { gridX: source.x, gridY: source.y },
                  targetPos: { gridX: target.x, gridY: target.y },
                },
                1000,
              )
              .catch(() => {});
            await new Promise((res) => setTimeout(res, 300));
          }
        }
      }

      // 继续下一轮循环
      await new Promise((res) => setTimeout(res, 500));
    }

    message.success("一键合成操作完成");
    // 刷新一下
    await getTowerInfo();
  } catch (error) {
    message.error(`一键合成失败: ${error.message || "未知错误"}`);
  } finally {
    if (mergeTimeout.value) {
      clearTimeout(mergeTimeout.value);
      mergeTimeout.value = null;
    }
    isMerging.value = false;
  }
};

const startTowerClimb = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    return;
  }

  if (!isWeirdTowerActivityOpen.value) {
    message.warning("怪异塔活动未开始或已结束");
    return;
  }

  if (!canClimb.value) {
    message.warning("体力不足或正在执行其他操作");
    return;
  }

  // 清除之前的超时
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value);
    climbTimeout.value = null;
  }

  isClimbing.value = true;
  stopFlag = false;
  let climbCount = 0;
  const maxClimb = normalizeWeirdTowerMaxClimb(maxClimbInput.value);
  maxClimbInput.value = maxClimb;
  // 设置超时保护，60秒后自动重置状态
  climbTimeout.value = setTimeout(() => {
    isClimbing.value = false;
    climbTimeout.value = null;
    stopFlag = true;
    message.info("批量爬塔已超时自动停止");
  }, 60000);

  try {
    const tokenId = tokenStore.selectedToken.id;
    // 爬塔前先补领未领取的章节奖励，否则 evotower_readyfight 会被拒绝（12200020）
    await claimPendingChapterRewards(tokenId);

    for (let i = 0; i < maxClimb; i++) {
      if (stopFlag) break;

      // 检查当前能量
      await getTowerInfo();
      const currentEnergy = towerEnergy.value;
      if (currentEnergy <= 0) break;

      // 准备战斗
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "evotower_readyfight",
        {},
        5000,
      );

      // 执行战斗
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "evotower_fight",
        {
          battleNum: 1,
          winNum: 1,
        },
        10000,
      );

      climbCount++;
      message.success(`第${climbCount}次爬塔命令已发送`);

      // 更新爬塔信息
      await getTowerInfo();

      // 检查并领取每日任务奖励
      const towerData = evoTowerInfo.value?.evoTower;
      if (towerData && towerData.taskClaimMap) {
        const now = new Date();
        const year = now.getFullYear().toString().slice(2);
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const dateKey = `${year}${month}${day}`;

        const dailyTasks = towerData.taskClaimMap[dateKey] || {};
        const taskIds = [1, 2, 3];

        for (const taskId of taskIds) {
          if (!dailyTasks[taskId]) {
            await tokenStore
              .sendMessageWithPromise(
                tokenId,
                "evotower_claimtask",
                { taskId },
                2000,
              )
              .then(() => {
                message.success(`领取每日任务奖励 ${taskId} 成功`);
              })
              .catch(() => {
                // 失败静默，可能是还没达到条件
              });
            // 稍微延时避免请求过快
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }

      // 通关章节奖励：以 rewardTowerId 为准判断是否有未领取的章节
      // （原按 (towerId % 10) + 1 === 1 判断，towerId 为 10 的整数倍时恒成立，
      //   会重复发送领奖命令，且无法感知历史未领取的章节）
      await claimPendingChapterRewards(tokenId);

      await new Promise((res) => setTimeout(res, 400)); // 每次间隔400毫秒
    }
    // 获取免费道具数量
    const freeEnergyResult = await tokenStore.sendMessageWithPromise(
      tokenId,
      "mergebox_getinfo",
      {
        actType: 1,
      },
      5000,
    );
    if (freeEnergyResult && freeEnergyResult.mergeBox.freeEnergy > 0) {
      // 领取免费道具
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "mergebox_claimfreeenergy",
        {
          actType: 1,
        },
        5000,
      );
      message.success(
        `成功领取免费道具${freeEnergyResult.mergeBox.freeEnergy}个！`,
      );
    }
    await new Promise((res) => setTimeout(res, 500));
    message.success(`已自动爬塔${climbCount}次，体力已耗尽或达到上限。`);
  } catch (error) {
    message.error(`批量爬塔失败: ${error.message || "未知错误"}`);
  }

  // 清除超时并重置状态
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value);
    climbTimeout.value = null;
  }
  isClimbing.value = false;
};

/** 手动刷新：拉一次 tower_getinfo，不影响正在进行的爬塔/合成 */
const refreshTowerInfo = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await getTowerInfo();
  } finally {
    isRefreshing.value = false;
  }
};

const getTowerInfo = async () => {
  if (!tokenStore.selectedToken) {
    return;
  }

  try {
    const tokenId = tokenStore.selectedToken.id;
    // 检查WebSocket连接状态
    const wsStatus = tokenStore.getWebSocketStatus(tokenId);

    if (wsStatus !== "connected") {
      return;
    }
    // 获取怪异塔信息
    await tokenStore.sendMessageWithPromise(
      tokenId,
      "evotower_getinfo",
      {},
      5000,
    );
    // 更新角色信息
    await tokenStore.sendMessage(tokenId, "role_getroleinfo");
  } catch (error) {
    // 获取塔信息失败：静默，避免噪声
  }
};

/**
 * 补领未领取的章节通关奖励
 *
 * towerId 是层号（如 240 表示已通关第 24 章），rewardTowerId 是已领取到的章号。
 * 两者不一致时 evotower_readyfight 会被游戏服拒绝并返回 12200020，导致爬塔无法开始，
 * 因此需在爬塔前先补齐。
 *
 * @param {string} tokenId - token id
 * @returns {Promise<number>} 实际补领的章节数
 */
const claimPendingChapterRewards = async (tokenId) => {
  let pending = pendingChapterRewards.value;
  if (pending <= 0) {
    return 0;
  }

  message.info(`检测到 ${pending} 个未领取的章节奖励，先行补领`);
  let claimed = 0;
  while (pending > 0) {
    try {
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "evotower_claimreward",
        {},
        5000,
      );
      claimed++;
      pending--;
      await new Promise((r) => setTimeout(r, 300));
    } catch (error) {
      message.error(`领取章节奖励失败：${error?.message || error}`);
      break;
    }
  }

  if (claimed > 0) {
    message.success(`已补领 ${claimed} 个章节通关奖励`);
    await getTowerInfo();
  }
  return claimed;
};

// 监听WebSocket连接状态变化
const wsStatus = computed(() => {
  if (!tokenStore.selectedToken) return "disconnected";
  return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
});

// 监听WebSocket连接状态，连接成功后自动获取塔信息
watch(wsStatus, (newStatus, oldStatus) => {
  if (newStatus === "connected" && oldStatus !== "connected") {
    // 延迟一点时间让WebSocket完全就绪
    setTimeout(() => {
      getTowerInfo();
    }, 1000);
  }
});

// 监听选中Token变化
watch(
  () => tokenStore.selectedToken,
  (newToken, oldToken) => {
    if (newToken && newToken.id !== oldToken?.id) {
      // 检查WebSocket是否已连接
      const status = tokenStore.getWebSocketStatus(newToken.id);
      if (status === "connected") {
        getTowerInfo();
      }
    }
  },
);

// 生命周期
onMounted(() => {
  // 检查WebSocket客户端
  if (tokenStore.selectedToken) {
    tokenStore.getWebSocketClient(tokenStore.selectedToken.id);
  }

  // 组件挂载时获取塔信息
  if (tokenStore.selectedToken && wsStatus.value === "connected") {
    getTowerInfo();
  }
});
</script>

<style scoped lang="scss">
.stop-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: #fff;
  color: #e11d48;

  &:hover {
    background: #e11d48;
    color: white;
    border-color: #e11d48;
  }
}

// 使用GameStatus中的统一卡片样式
.weird-tower {
  border-left: 4px solid #8b5cf6; // 怪异塔专用颜色
  display: flex;
  flex-direction: column;
  min-height: 240px; // 继续缩小整体高度
  padding: var(--spacing-lg);
}

.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.energy-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--bg-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-medium);
  margin-left: auto; // 使小鱼干展示靠右
}

.energy-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.energy-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* ==================== 购买小鱼干按钮 ==================== */
.refresh-tower-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin-left: 6px;
  color: #86909c;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition:
    color 0.2s,
    background 0.2s;
  flex-shrink: 0;
}

.refresh-tower-button:hover:not(:disabled) {
  color: #18a058;
  background: rgba(24, 160, 88, 0.1);
}

.refresh-tower-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.refresh-tower-button.spinning svg {
  animation: tower-refresh-spin 0.8s linear infinite;
}

@keyframes tower-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

.buy-energy-button {
  padding: 2px 10px;
  margin-left: 4px;
  font-size: var(--font-size-xs, 12px);
  font-weight: var(--font-weight-medium);
  color: #fff;
  background: linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%);
  border: none;
  border-radius: var(--border-radius-small, 6px);
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.15s;
  white-space: nowrap;
  line-height: 20px;
}

.buy-energy-button:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(252, 74, 26, 0.35);
}

.buy-energy-button:active:not(.disabled) {
  transform: translateY(0);
}

.buy-energy-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 购买小鱼干弹窗 ==================== */
.buy-energy-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-md);
}

.buy-energy-dialog {
  width: 100%;
  max-width: 360px;
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-large, 12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.buy-energy-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.buy-energy-dialog .dialog-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.buy-energy-dialog .dialog-close {
  width: 28px;
  height: 28px;
  font-size: 20px;
  line-height: 1;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-small, 6px);
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.buy-energy-dialog .dialog-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.buy-energy-dialog .dialog-body {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.buy-energy-dialog .dialog-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.buy-energy-dialog .row-label {
  flex-shrink: 0;
  width: 76px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.num-selector {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.num-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  font-size: 18px;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-small, 6px);
  cursor: pointer;
  transition: background 0.2s;
}

.num-btn:hover {
  background: var(--bg-secondary);
}

.num-input {
  flex: 1;
  height: 36px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  text-align: center;
  color: var(--text-primary);
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-small, 6px);
  outline: none;
}

.num-input:focus {
  border-color: #fc4a1a;
  box-shadow: 0 0 0 2px rgba(252, 74, 26, 0.15);
}

.quick-btns {
  flex: 1;
  display: flex;
  gap: var(--spacing-xs);
}

.quick-btn {
  flex: 1;
  padding: 6px 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-small, 6px);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  color: #fc4a1a;
  border-color: #fc4a1a;
}

.dialog-hint {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-secondary);
  text-align: center;
  padding-top: var(--spacing-xs);
  border-top: 1px dashed var(--border-color, #e5e7eb);
}

.dialog-hint .gold-icon {
  width: 15px;
  height: 15px;
  vertical-align: -2px;
  margin: 0 2px;
}

.buy-energy-dialog .dialog-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-small, 6px);
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.15s;
}

.btn-cancel {
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color, #e5e7eb);
}

.btn-cancel:hover {
  background: var(--bg-secondary);
}

.btn-confirm {
  color: #fff;
  background: linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%);
  border: none;
}

.btn-confirm:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(252, 74, 26, 0.4);
}

.btn-confirm.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-content {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  flex: 1; // 占据可用空间，使上下分布更均衡
  display: flex;
  align-items: center; // 内容在中部更居中
}

.tower-floor {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .floor-number {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
  }
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: auto;
  padding-top: var(--spacing-sm);
}

.climb-action-row {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-sm);
  width: 100%;

  .climb-button {
    flex: 1;
    min-width: 0;
  }
}

.climb-limit-input {
  flex: 0 0 86px;
  width: 86px;
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--border-radius-medium);
  outline: none;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: #8b5cf6;
  }

  &:disabled {
    color: var(--text-tertiary);
    cursor: not-allowed;
    background: var(--bg-secondary);
  }
}

.climb-limit-unit {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.climb-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &.active {
    background: #8b5cf6;
    color: white;

    &:hover {
      background: #7c3aed;
    }
  }

  &.disabled {
    background: var(--bg-secondary);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .energy-display {
    align-self: center;
  }
}
</style>
