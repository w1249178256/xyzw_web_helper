<template>
  <div class="legion-war-map-container">
    <div class="legion-war-map-card">
      <div v-if="!isAccessible" class="access-denied-container">
        <n-result
          status="403"
          title="暂未开放"
          description="该功能仅在特定时间开放"
        >
          <template #footer>
            <div class="access-denied-info">
              <p>开放时间：</p>
              <p>1. 每月前四周的周六 19:55 - 21:00</p>
              <p>2. 每月第四周的周日 19:55 - 21:30</p>
              <p>3. 2026年3月年赛特殊开放</p>
            </div>
          </template>
        </n-result>
      </div>
      <template v-else>
        <!-- 头部信息区 -->
        <div class="header-section">
          <div class="header-left">
            <img
              src="/icons/moonPalace.png"
              alt="盐场图标"
              class="header-icon"
            />
            <div class="header-title">
              <h2>盐场实时地图</h2>
              <p>获取盐场位置分布</p>
            </div>
          </div>

          <!-- 数据统计区 -->
          <div class="stats-section">
            <div class="stat-item">
              <span class="stat-label">连接状态:</span>
              <n-tag :type="isConnected ? 'success' : 'error'">
                {{ isConnected ? "已连接" : "未连接" }}
              </n-tag>
            </div>
            <div class="stat-item">
              <span class="stat-label">战场数据:</span>
              <n-tag :type="battlefieldId ? 'success' : 'error'">{{
                battlefieldId ? "已成功获取战场数据" : "未获取到战场数据"
              }}</n-tag>
            </div>
            <div class="stat-item">
              <n-button
                size="small"
                :type="isEntireBattlefield ? 'success' : 'warning'"
                :loading="connecting"
                @click="toggleBattlefieldEntry"
              >
                <template #icon>
                  <n-icon>
                    <LogInOutline />
                  </n-icon>
                </template>
                {{ isEntireBattlefield ? "已进入战场" : "进入战场" }}
              </n-button>
              <n-button
                size="small"
                type="primary"
                :disabled="!isConnected && !isEntireBattlefield"
                @click="refreshData"
                style="margin-right: 8px"
              >
                <template #icon>
                  <n-icon>
                    <RefreshOutline />
                  </n-icon>
                </template>
                刷新数据
              </n-button>
              <n-button
                size="small"
                type="info"
                :loading="exporting"
                @click="exportImage"
                :disabled="!validData"
              >
                <template #icon>
                  <n-icon>
                    <ImageOutline />
                  </n-icon>
                </template>
                导出图片
              </n-button>
            </div>
          </div>
        </div>

        <!-- 主要内容区：地图 + 侧边栏 -->
        <div class="main-content-layout">
          <!-- 地图区域 -->
          <div class="map-container-wrapper">
            <div class="map-container">
              <canvas ref="legionWarMapDom" class="mapCanvas"></canvas>
            </div>

            <div v-if="!validData" class="empty-state-overlay">
              <div class="empty-content">
                <template v-if="connecting">
                  <n-spin size="large" />
                  <p>正在连接战场...</p>
                </template>
                <template v-else-if="isConnected">
                  <n-spin size="large" />
                  <p>正在获取地图数据...</p>
                </template>
                <template v-else>
                  <n-icon size="48" color="#ccc">
                    <MapOutline />
                  </n-icon>
                  <p>暂无地图数据，请手动刷新数据</p>
                </template>
              </div>
            </div>
          </div>

          <!-- 右侧信息栏 -->
          <div
            class="side-info-panel"
            v-if="validData && sortedLegions.length > 0"
          >
            <div class="legion-list">
              <template
                v-for="(group, groupName) in allianceGroups"
                :key="groupName"
              >
                <div v-if="group.length > 0" class="alliance-group">
                  <div class="group-header">
                    <span class="group-name">{{ groupName }}</span>
                    <span class="group-count">({{ group.length }})</span>
                  </div>
                  <div
                    v-for="(legion, index) in group"
                    :key="legion.id"
                    class="legion-item"
                    :style="{ borderLeftColor: legion.color }"
                  >
                    <div class="rank-badge">
                      {{ sortedLegions.indexOf(legion) + 1 }}
                    </div>
                    <div class="legion-info">
                      <div class="legion-name" :title="legion.name">
                        <span class="legion-id">[{{ legion.serverId }}]</span>
                        {{ legion.name }}
                      </div>
                      <div class="legion-stats">
                        <span class="stat-red">红: {{ legion.redCount }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { useLegionWarStore } from "@/stores/legionWarStore";
import { extractValidData, HexGraph, roadPointList } from "@/utils/legionWar";
import { getCurrentTimeByFormat } from "@/utils/DateTimeUtils";
import {
  LogInOutline,
  MapOutline,
  RefreshOutline,
  ImageOutline,
} from "@vicons/ionicons5";
import { allianceincludes } from "@/utils/clubWarrankUtils";
import { isLegionWarAccessible } from "@/utils/clubBattleUtils";
import { storeToRefs } from "pinia";
import html2canvas from "html2canvas";

const message = useMessage();
const tokenStore = useTokenStore();
const legionWarStore = useLegionWarStore();

const isAccessible = ref(isLegionWarAccessible());

// Store 状态
const {
  isConnected,
  connecting,
  validData,
  battlefieldId,
  legionDetails,
  isJoined: isEntireBattlefield,
} = storeToRefs(legionWarStore);

// 本地状态
const legionWarMapDom = ref(null);
let ctx = null;
let resizeHandler = null;

const isJoined = isEntireBattlefield; // alias for compatibility if needed, but we use isEntireBattlefield in template

const exporting = ref(false);

const exportImage = async () => {
  const element = document.querySelector(
    ".legion-war-map-card .main-content-layout",
  );
  if (!element) {
    message.error("未找到导出内容");
    return;
  }

  exporting.value = true;
  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2, // Higher quality
      backgroundColor: "#ffffff",
      ignoreElements: (el) => el.classList.contains("no-export"),
    });

    const link = document.createElement("a");
    link.download = `盐场地图_${getCurrentTimeByFormat("yyyyMMdd_HHmmss")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    message.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败");
  } finally {
    exporting.value = false;
  }
};

// 俱乐部排序
const sortedLegions = computed(() => {
  if (!validData.value || !validData.value.legionInfo) return [];

  // 将对象转换为数组并排序
  // 排序规则：红度 > 战力 > ID
  const list = Object.values(validData.value.legionInfo).map((legion) => {
    // 尝试获取公告信息，如果还没有详情则为空
    const detail = legionDetails.value[legion.id] || {};
    // 根据公告判断联盟
    const alliance = detail.announcement
      ? allianceincludes(detail.announcement)
      : "未知联盟";

    // 优先使用详情中的红淬数据
    const redCount =
      detail.quenchNum !== undefined ? detail.quenchNum : legion.redCount;

    return {
      ...legion,
      announcement: detail.announcement || "",
      alliance: alliance,
      redCount: redCount,
    };
  });

  return list.sort((a, b) => {
    // 1. 红度降序
    if (b.redCount !== a.redCount) {
      return b.redCount - a.redCount;
    }
    // 2. 战力降序 (如果有)
    if (b.power && a.power && b.power !== a.power) {
      return b.power - a.power;
    }
    // 3. ID 升序
    return parseInt(a.id) - parseInt(b.id);
  });
});

// 监听数据变化以重绘地图
watch(
  validData,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        resizeAndRedraw();
      });
    }
  },
  { deep: true },
);

// 监听联盟详情数据变化以重绘地图（因为颜色依赖于详情中的公告）
watch(
  legionDetails,
  () => {
    nextTick(() => {
      resizeAndRedraw();
    });
  },
  { deep: true },
);

// 监听连接状态变化
watch(isConnected, (newVal) => {
  if (!newVal) {
    // 断开连接后，重新绘制基础地图
    nextTick(() => {
      resizeAndRedraw();
    });
  }
});

// 获取联盟分组的列表
const allianceGroups = computed(() => {
  const groups = {};

  // 初始化分组
  const allianceTypes = [
    "大联盟",
    "梦盟",
    "正义联盟",
    "龙盟",
    "曦盟",
    "未知联盟",
  ];
  allianceTypes.forEach((type) => {
    groups[type] = [];
  });

  // 分配俱乐部到对应分组
  sortedLegions.value.forEach((legion) => {
    const alliance = legion.alliance;
    if (groups[alliance]) {
      groups[alliance].push(legion);
    } else {
      // 如果有其他未定义的类型，归入未知
      groups["未知联盟"].push(legion);
    }
  });

  return groups;
});

// Canvas 相关配置
const dpr = window.devicePixelRatio || 1;
let hexSize = 15.5;
const gap = 3;
let hexWidth = 2 * hexSize;
let hexHeight = Math.sqrt(3) * hexSize;
const arr = Array.from({ length: 41 }, () =>
  Array.from({ length: 41 }, () => 0),
);
let leftMaxPoint = [0, 0];

// 颜色映射
const typeBg = (type) => {
  switch (type) {
    case 1:
      return "#4477CE"; // 30分 - 小 - 蓝色
    case 2:
      return "#D835D8"; // 50分 - 中 - 粉紫色
    case 3:
      return "#F9B500"; // 80分 - 大 - 金色
    case 4:
      return "#D21E1E"; // 大本营 - 本 - 红色
    case 5:
      return "#2B2B2B"; // 100分 - 城 - 深灰色
    case 6:
      return "#000000"; // 核心 - 黑
    case 9:
      return "#4477CE"; // 道路 - 蓝色
    default:
      return "#cccccc";
  }
};

// 标签映射
const typeLabel = (type) => {
  switch (type) {
    case 1:
      return "小";
    case 2:
      return "中";
    case 3:
      return "大";
    case 4:
      return "本";
    case 5:
      return "城";
    case 6:
      return "核";
    default:
      return "";
  }
};

// 绘制六边形
const drawHexagon = (x, y, color, type) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = ((2 * Math.PI) / 6) * i;
    const px = x + hexSize * Math.cos(angle);
    const py = y + hexSize * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);

    if (px >= leftMaxPoint[0]) leftMaxPoint[0] = px;
    if (py >= leftMaxPoint[1]) leftMaxPoint[1] = py;
  }
  ctx.closePath();

  // 填充背景
  ctx.fillStyle = color;
  ctx.fill();

  // 描边
  ctx.strokeStyle = "#ffffff"; // 白色边框
  ctx.lineWidth = 1;
  ctx.stroke();
};

// 联盟颜色映射
const allianceColors = {
  大联盟: "#667eea", // var(--primary-color)
  梦盟: "#18a058", // var(--success-color)
  正义联盟: "#2080f0", // var(--info-color)
  龙盟: "#d03050", // var(--error-color)
  曦盟: "#9c27b0", // 紫色
  未知联盟: "#f5a623", // var(--warning-color)
};

// 绘制文字
const drawText = (x, y, text, color = "#fff", fontSize = 10) => {
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Microsoft Yahei`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
};

// 绘制地图内容
const drawCanvasContent = () => {
  if (!ctx) return;

  // 清空画布
  ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);

  // 重置 arr 数组
  arr.forEach((row) => row.fill(0));

  // 获取图结构实例
  let graph = HexGraph.getInstance();
  graph.removeAllNode();

  // 计算需要绘制的行列数以铺满画布
  const canvasWidth = ctx.canvas.width / dpr;
  const canvasHeight = ctx.canvas.height / dpr;
  const horizontalStep = hexWidth * 0.75 + gap;
  const verticalStep = hexHeight + gap;

  const maxCols = Math.ceil(canvasWidth / horizontalStep) + 2;
  const maxRows = Math.ceil(canvasHeight / verticalStep) + 2;

  // 绘制背景网格
  ctx.strokeStyle = "#e0e0e0"; // 浅灰色边框
  ctx.lineWidth = 1;

  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxCols; col++) {
      // 背景网格从第0行开始绘制，铺满全屏
      const x = col * (hexWidth * 0.75) + hexSize + gap * col;
      const y =
        row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0) + gap * row;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = ((2 * Math.PI) / 6) * i;
        const px = x + hexSize * Math.cos(angle);
        const py = y + hexSize * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // 绘制坐标
      //drawText(x, y, `${col},${row}`, "#e0e0e0", 8);
    }
  }

  // 平移画布以居中显示有效区域
  // 假设有效区域左上角偏移约为 (-2, -3) 个六边形
  ctx.save();
  ctx.translate(2 * (hexWidth * 0.75 + gap), -1 * (hexHeight + gap));

  // 使用静态数据作为基础，结合 validData 处理颜色和状态
  // 1. 准备数据
  // 注意：即使 validData 为 null，也应该填充 graph，以显示基础地图
  graph.addNodeList(
    roadPointList.map((item) => {
      const realTimeNode = validData.value?.buildingData?.[item.id];
      // 优先使用实时数据中的 type，如果没有则使用静态 type
      const type = realTimeNode?.type || item.type;
      const belongsLegionId = realTimeNode ? realTimeNode.belongsLegionId : -1;

      return {
        id: item.id,
        type: type,
        belongsLegionId: belongsLegionId,
        hP: realTimeNode ? realTimeNode.hP : 0,
        maxHP: realTimeNode ? realTimeNode.maxHP : 0,
        point: realTimeNode ? realTimeNode.point : 0,
        belongsLegionInfo: validData.value?.legionInfo?.[belongsLegionId],
      };
    }),
  );

  // 2. 绘制所有网格节点
  // 使用 graph.getAllNodes() 获取 graph 中的节点，如果为空则使用 roadPointList
  const graphNodes = graph.getAllNodes();
  const nodesToDraw =
    graphNodes.length > 0
      ? graphNodes
      : roadPointList.map((item) => {
          // 确保静态数据也有正确的属性结构
          return {
            ...item,
            // 如果是静态数据，确保这些字段存在
            type: item.type,
            belongsLegionId: -1,
          };
        });

  nodesToDraw.forEach((node) => {
    const [colStr, rowStr] = node.id.split("_");
    const col = parseInt(colStr);
    const row = parseInt(rowStr);

    if (!isNaN(col) && !isNaN(row)) {
      const x = col * (hexWidth * 0.75) + hexSize + gap * col;
      const y =
        row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0) + gap * row;

      // 决定背景色：始终使用类型颜色，不依赖归属情况
      let bgColor = typeBg(node.type);

      // 核心周围特殊处理
      const coreSurroundingPoints = [
        "19_16",
        "19_17",
        "20_16",
        "20_18",
        "21_16",
        "21_17",
      ];
      if (coreSurroundingPoints.includes(node.id)) {
        bgColor = "#cccccc";
      }

      // 核心始终显示黑色 (根据类型6判断，不依赖归属)
      if (node.type === 6) {
        bgColor = "#000000";
      }

      drawHexagon(x, y, bgColor, node.type);

      // 绘制标签
      if (node.type !== 9) {
        const label = typeLabel(node.type);
        drawText(x, y, label, "#fff", 12);
      }
    }
  });

  // 绘制俱乐部名称 (独立逻辑)
  if (validData.value && validData.value.legionInfo) {
    Object.values(validData.value.legionInfo).forEach((legion) => {
      // 必须有大本营坐标
      if (legion.strongholdId) {
        const [colStr, rowStr] = legion.strongholdId.split("_");
        const col = parseInt(colStr);
        const row = parseInt(rowStr);

        if (!isNaN(col) && !isNaN(row)) {
          const x = col * (hexWidth * 0.75) + hexSize + gap * col;
          const y =
            row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0) + gap * row;

          // 格式：【区服】名称，使用 legionInfo 中的 legionID
          const sidStr = `【${legion.serverId}】`;
          const nameStr = `${sidStr}${legion.name}`;

          // 获取联盟信息
          const detail = legionDetails.value[legion.id] || {};
          const alliance = detail.announcement
            ? allianceincludes(detail.announcement)
            : "未知联盟";
          const allianceColor =
            allianceColors[alliance] || allianceColors["未知联盟"];

          // 绘制背景和文字
          ctx.font = "bold 12px Microsoft Yahei";
          const textWidth = ctx.measureText(nameStr).width;
          const padding = 10;
          const height = 24;
          const bgX = x - textWidth / 2 - padding / 2;
          const bgY = y - 32;
          const bgWidth = textWidth + padding;

          ctx.fillStyle = allianceColor;

          const r = 4;
          ctx.beginPath();
          ctx.moveTo(bgX + r, bgY);
          ctx.arcTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + height, r);
          ctx.arcTo(bgX + bgWidth, bgY + height, bgX, bgY + height, r);
          ctx.arcTo(bgX, bgY + height, bgX, bgY, r);
          ctx.arcTo(bgX, bgY, bgX + bgWidth, bgY, r);
          ctx.closePath();
          ctx.fill();

          drawText(x, bgY + height / 2, nameStr, "#fff", 12);
        }
      }
    });
  }
};
const resizeAndRedraw = () => {
  if (!legionWarMapDom.value) return;
  const canvas = legionWarMapDom.value;
  const container = canvas.parentElement;

  // 移除之前添加的 style 尺寸设置
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const w = container.clientWidth;
  const h = container.clientHeight;

  // 设置 Canvas 物理像素大小
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  // 根据容器大小动态计算合适的 hexSize
  // 地图尺寸: 41列 * 41行
  const cols = 41;
  const rows = 41;

  // 计算可用空间下最大的 hexSize
  // 宽度公式: w = cols * (1.5 * s + gap) + 0.5 * s
  // 高度公式: h = rows * (sqrt(3) * s + gap) + sqrt(3)/2 * s

  // 简化计算 (减少边距以最大化显示)
  const padding = 10;
  const availableW = w - padding * 2;
  const availableH = h - padding * 2;

  const sizeW = (availableW - (cols - 1) * gap) / (cols * 1.5 + 0.5);
  const sizeH =
    (availableH - (rows - 1) * gap) / (rows * Math.sqrt(3) + Math.sqrt(3) / 2);

  // 取较小值以确保完整显示
  hexSize = Math.min(sizeW, sizeH);

  // 限制最大最小尺寸，避免极端情况
  hexSize = Math.max(12, Math.min(hexSize, 30));

  // 更新依赖变量
  hexWidth = 2 * hexSize;
  hexHeight = Math.sqrt(3) * hexSize;

  if (ctx) {
    ctx.scale(dpr, dpr);
    drawCanvasContent();
  }
};

const toggleBattlefieldEntry = async () => {
  if (isEntireBattlefield.value) {
    legionWarStore.disconnect(true); // 强制断开
  } else {
    try {
      await legionWarStore.connect();
    } catch (error) {
      message.error(error.message);
    }
  }
};

const refreshData = () => {
  try {
    legionWarStore.refreshData();
    message.success("已发送刷新请求");
  } catch (error) {
    message.warning(error.message);
  }
};

const initializeCanvas = async () => {
  await nextTick();
  const canvas = legionWarMapDom.value;
  if (!canvas) return false;

  const context = canvas.getContext("2d");
  if (!context) return false;
  ctx = context;

  if (!resizeHandler) {
    resizeHandler = () => resizeAndRedraw();
    window.addEventListener("resize", resizeHandler);
  }

  resizeAndRedraw();
  return true;
};

// 生命周期钩子
onMounted(async () => {
  await initializeCanvas();

  try {
    legionWarStore.connect().catch((e) => {
      console.error("Auto connect failed", e);
    });
  } catch (e) {}
});

watch(isAccessible, async (accessible) => {
  if (accessible) {
    await initializeCanvas();
  }
});

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  legionWarStore.disconnect();
});
</script>

<style scoped lang="scss">
.legion-war-map-container {
  padding: 8px;

  .legion-war-map-card {
    background: #fff;
    border-radius: 8px;
    box-shadow:
      0 1px 2px -2px rgba(0, 0, 0, 0.08),
      0 3px 6px 0 rgba(0, 0, 0, 0.06),
      0 5px 12px 4px rgba(0, 0, 0, 0.04);

    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 600px; /* 给个固定高度或者 min-height */
      padding: 40px;
    }

    .access-denied-info {
      margin-top: 16px;
      text-align: left;
      color: #666;

      p {
        margin: 4px 0;
      }
    }

    .header-section {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      flex-wrap: wrap;
      gap: 12px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          width: 40px;
          height: 40px;
        }

        .header-title {
          h2 {
            margin: 0;
            font-size: 18px;
            color: #333;
          }
          p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #999;
          }
        }
      }

      .stats-section {
        display: flex;
        gap: 16px;
        align-items: center;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .stat-label {
            font-size: 13px;
            color: #666;
          }
        }
      }
    }

    .main-content-layout {
      position: relative;
      width: 100%;
      height: 960px;
      display: flex;
      overflow: hidden;

      .map-container-wrapper {
        flex: 1;
        height: 100%;
        position: relative;
        background-color: #f5f5f5;
        overflow: hidden;

        .map-container {
          width: 100%;
          height: 100%;

          .mapCanvas {
            width: 100%;
            height: 100%;
            display: block;
          }
        }

        .empty-state-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.8);
          z-index: 10;

          .empty-content {
            text-align: center;
            color: #999;

            p {
              margin-top: 12px;
            }
          }
        }
      }

      .side-info-panel {
        width: 300px;
        height: 100%;
        background: #fff;
        border-left: 1px solid #eee;
        display: flex;
        flex-direction: column;
        z-index: 20;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);

        .panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          background: #f9f9f9;

          h3 {
            margin: 0;
            font-size: 16px;
            color: #333;
          }
        }

        .legion-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;

          .legion-item {
            display: flex;
            align-items: center;
            padding: 2px 4px; /* 进一步减小内边距 */
            margin-bottom: 2px; /* 进一步减小外边距 */
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid transparent;
            transition: all 0.2s;
            height: 32px; /* 进一步减小固定高度 */

            &:hover {
              background: #f0f0f0;
              transform: translateX(2px);
            }

            .rank-badge {
              width: 18px;
              height: 18px;
              background: #e0e0e0;
              color: #666;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              margin-right: 6px;
              flex-shrink: 0;
            }

            .legion-info {
              flex: 1;
              overflow: hidden;
              display: flex; /* 改为 flex 布局 */
              align-items: center; /* 垂直居中 */
              justify-content: space-between; /* 两端对齐 */

              .legion-name {
                font-size: 13px; /* 缩小字体 */
                color: #333;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 0; /* 移除底部边距 */
                margin-right: 8px; /* 添加右侧间距 */
                flex: 1; /* 占据剩余空间 */

                .legion-id {
                  color: #999;
                  font-size: 11px;
                  margin-right: 4px;
                  font-weight: normal;
                }
              }

              .legion-stats {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                flex-shrink: 0; /* 防止被压缩 */

                .stat-red {
                  color: #d03050;
                  background: rgba(208, 48, 80, 0.1);
                  padding: 1px 4px; /* 减小内边距 */
                  border-radius: 3px;
                }
              }
            }
          }

          .alliance-group {
            margin-bottom: 4px; /* 进一步减小分组间距 */

            .group-header {
              display: flex;
              align-items: center;
              padding: 2px 4px; /* 进一步减小标题内边距 */
              margin-bottom: 2px;

              .group-name {
                font-weight: bold;
                font-size: 13px; /* 缩小字体 */
                color: #333;
                margin-right: 6px;
              }

              .group-count {
                font-size: 11px;
                color: #999;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;

    .stats-section {
      width: 100%;
      justify-content: space-between;
    }
  }

  .map-container-wrapper {
    height: 400px !important;
  }
}
</style>
