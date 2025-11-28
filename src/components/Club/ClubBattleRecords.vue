<template>
  <div>
    <!-- Inline 模式：卡片渲染 -->
    <div v-if="inline" class="inline-wrapper">
      <div class="inline-header">
        <div class="inline-title">俱乐部盐场战绩</div>
        <div class="header-actions">
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleExport">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            复制
          </n-button>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleDownload">
            <template #icon>
              <n-icon>
                <Download />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </div>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" class="records-list">
          <div class="records-info">
            <n-space>
              <n-select v-model:value="queryDate" :options="dateOptions" placeholder="选择查询日期" :disabled="loading"
                @update:value="handleDateChange" style="width: 200px" />
              <n-tag type="success">总成员: {{ battleRecords.roleDetailsList.length }}</n-tag>
            </n-space>
          </div>

          <div v-for="member in battleRecords.roleDetailsList" :key="member.roleId" class="member-card">
            <div class="member-header">
              <div class="member-info">
                <img v-if="member.headImg" :src="member.headImg" :alt="member.name" class="member-avatar"
                  @error="handleImageError">
                <div v-else class="member-avatar-placeholder">{{ member.name?.charAt(0) || '?' }}</div>
                <span class="member-name">{{ member.name }}</span>
              </div>
              <div class="member-stats-inline">
                <span class="stat-inline win">击杀 {{ member.winCnt || 0 }}</span>
                <span class="stat-inline loss">死亡 {{ member.loseCnt || 0 }}</span>
                <span class="stat-inline siege">攻城 {{ member.buildingCnt || 0 }}</span>
              </div>
              <n-button text size="small" class="details-button" @click="toggleMemberDetails(member.roleId)">
                <template #icon>
                  <n-icon>
                    <ChevronDown v-if="!expandedMembers.has(member.roleId)" />
                    <ChevronUp v-else />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <!-- 战斗详情（可展开） -->
            <n-collapse-transition :show="expandedMembers.has(member.roleId)">
              <div class="battle-details">
                <div v-if="member.targetRoleList && member.targetRoleList.length > 0" class="battles-list">
                  <div v-for="(battle, index) in member.targetRoleList" :key="index" class="battle-item"
                    :class="getBattleClass(battle)">
                    <div class="battle-participants">
                      <div class="participant attacker">
                        <img v-if="battle.roleInfo?.headImg" :src="battle.roleInfo.headImg" :alt="battle.roleInfo.name"
                          class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.roleInfo?.name || '未知' }}</span>
                      </div>
                      <div class="battle-vs">
                        <n-tag :type="battle.attackType === 0 ? 'warning' : 'info'" size="small">{{
                          parseAttackType(battle.attackType) }}</n-tag>
                        <n-tag :type="battle.newWinFlag === 2 ? 'success' : 'error'" size="small">{{
                          parseBattleResult(battle.newWinFlag) }}</n-tag>
                      </div>
                      <div class="participant defender">
                        <img v-if="battle.targetRoleInfo?.headImg" :src="battle.targetRoleInfo.headImg"
                          :alt="battle.targetRoleInfo.name" class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.targetRoleInfo?.name || '未知' }}</span>
                      </div>
                    </div>
                    <div class="battle-time">{{ formatTimestamp(battle.timestamp) }}</div>
                  </div>
                </div>
                <div v-else class="no-battles">
                  <n-empty description="暂无战斗记录" size="small" />
                </div>
              </div>
            </n-collapse-transition>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </div>

    <!-- Modal 模式 -->
    <n-modal v-else v-model:show="showModal" preset="card" title="俱乐部盐场战绩" style="width: 90%; max-width: 800px"
      @after-leave="handleClose">
      <template #header-extra>
        <div class="header-actions">
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleExport">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            复制
          </n-button>
          <n-button type="primary" size="small" :disabled="!battleRecords || loading" @click="handleDownload">
            <template #icon>
              <n-icon>
                <Download />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </template>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div v-else-if="battleRecords && battleRecords.roleDetailsList" class="records-list">
          <div class="records-info">
            <n-space>
              <n-select v-model:value="queryDate" :options="dateOptions" placeholder="选择查询日期" :disabled="loading"
                @update:value="handleDateChange" style="width: 200px" />
              <n-tag type="success">总成员: {{ battleRecords.roleDetailsList.length }}</n-tag>
            </n-space>
          </div>

          <div v-for="member in battleRecords.roleDetailsList" :key="member.roleId" class="member-card">
            <div class="member-header">
              <div class="member-info">
                <img v-if="member.headImg" :src="member.headImg" :alt="member.name" class="member-avatar"
                  @error="handleImageError">
                <div v-else class="member-avatar-placeholder">{{ member.name?.charAt(0) || '?' }}</div>
                <span class="member-name">{{ member.name }}</span>
              </div>
              <div class="member-stats-inline">
                <span class="stat-inline win">击杀 {{ member.winCnt || 0 }}</span>
                <span class="stat-inline loss">死亡 {{ member.loseCnt || 0 }}</span>
                <span class="stat-inline siege">攻城 {{ member.buildingCnt || 0 }}</span>
              </div>
              <n-button text size="small" class="details-button" @click="toggleMemberDetails(member.roleId)">
                <template #icon>
                  <n-icon>
                    <ChevronDown v-if="!expandedMembers.has(member.roleId)" />
                    <ChevronUp v-else />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <!-- 战斗详情（可展开） -->
            <n-collapse-transition :show="expandedMembers.has(member.roleId)">
              <div class="battle-details">
                <div v-if="member.targetRoleList && member.targetRoleList.length > 0" class="battles-list">
                  <div v-for="(battle, index) in member.targetRoleList" :key="index" class="battle-item"
                    :class="getBattleClass(battle)">
                    <div class="battle-participants">
                      <div class="participant attacker">
                        <img v-if="battle.roleInfo?.headImg" :src="battle.roleInfo.headImg" :alt="battle.roleInfo.name"
                          class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.roleInfo?.name || '未知' }}</span>
                      </div>
                      <div class="battle-vs">
                        <n-tag :type="battle.attackType === 0 ? 'warning' : 'info'" size="small">{{
                          parseAttackType(battle.attackType) }}</n-tag>
                        <n-tag :type="battle.newWinFlag === 2 ? 'success' : 'error'" size="small">{{
                          parseBattleResult(battle.newWinFlag) }}</n-tag>
                      </div>
                      <div class="participant defender">
                        <img v-if="battle.targetRoleInfo?.headImg" :src="battle.targetRoleInfo.headImg"
                          :alt="battle.targetRoleInfo.name" class="participant-avatar" @error="handleImageError">
                        <span class="participant-name">{{ battle.targetRoleInfo?.name || '未知' }}</span>
                      </div>
                    </div>
                    <div class="battle-time">{{ formatTimestamp(battle.timestamp) }}</div>
                  </div>
                </div>
                <div v-else class="no-battles">
                  <n-empty description="暂无战斗记录" size="small" />
                </div>
              </div>
            </n-collapse-transition>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText,
  Download
} from '@vicons/ionicons5'

// 导入本地 xlsx-js-style 库
import * as XLSX from 'xlsx-js-style'
import {
  getLastSaturday,
  formatTimestamp,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard
} from '@/utils/clubBattleUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 监听弹窗显示状态，初始化日期选择器
watch(() => props.visible, async (newVal) => {
  if (newVal && !props.inline) {
    // 生成日期选项
    generateDateOptions();
    // 弹窗显示时，如果还没有数据，先获取数据
    if (!battleRecords.value) {
      await fetchBattleRecords()
    }
  }
})

const loading = ref(false)
const battleRecords = ref(null)
const expandedMembers = ref(new Set())
const queryDate = ref('')


const legionMatch = ref({
  isRegistered: false
})

// 格式化战力
const formatPower = (power) => {
  if (!power) return '0'
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + '亿'
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + '万'
  }
  return power.toString()
}

// 生成盐场可选日期列表
const getSaltDates = () => {
  const result = [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  const todayTime = now.getTime();

  // 1号 → 当月天数循环
  const date = new Date(year, month, 1);

  let sundayWeek4 = null; // 第四周的周日

  while (date.getMonth() === month) {
    const weekday = date.getDay(); // 0=周日, 6=周六
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const dateStr = date.toLocaleDateString("zh-CN", options);; // YYYY/MM/DD

    // 只允许 <= 今天的日期
    if (date.getTime() <= todayTime) {

      // 周六加入
      if (weekday === 6) {
        result.push(dateStr);
      }

      // 记录第 4 周周日（0=周日）
      const dayOfMonth = date.getDate();
      if (weekday === 0) {
        const weekIndex = Math.ceil(dayOfMonth / 7);
        if (weekIndex === 4) {
          sundayWeek4 = dateStr;
        }
      }
    }

    // 下一天
    date.setDate(date.getDate() + 1);
  }

  // 加入第四周周日（如果存在）
  if (sundayWeek4) result.push(sundayWeek4);

  return result;
}

// 生成日期选项
const dateOptions = ref([]);
const generateDateOptions = () => {
  const dates = getSaltDates();
  dateOptions.value = dates.map(date => ({
    label: date,
    value: date
  }));
};

// 处理日期选择变化
const handleDateChange = () => {
  fetchBattleRecords();
};

// 获取战斗样式类
const getBattleClass = (battle) => {
  const classes = []
  if (battle.newWinFlag === 2) {
    classes.push('battle-win')
  } else {
    classes.push('battle-loss')
  }
  if (battle.attackType === 0) {
    classes.push('battle-attack')
  } else {
    classes.push('battle-defend')
  }
  return classes.join(' ')
}

// 切换成员详情展开状态
const toggleMemberDetails = (roleId) => {
  if (expandedMembers.value.has(roleId)) {
    expandedMembers.value.delete(roleId)
  } else {
    expandedMembers.value.add(roleId)
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 查询战绩
const fetchBattleRecords = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法查询战绩')
    return
  }

  loading.value = true
  // 如果 queryDate 为空，使用默认的上周六日期
  if (!queryDate.value) {
    queryDate.value = getLastSaturday()
  }

  try {
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      'legionwar_getdetails',
      { date: queryDate.value },
      10000
    )

    if (result && result.roleDetailsList) {
      battleRecords.value = result
      message.success('战绩加载成功')
    } else {
      battleRecords.value = null
      message.warning('未查询到战绩数据')
    }
  } catch (error) {
    console.error('查询战绩失败:', error)
    message.error(`查询失败: ${error.message}`)
    battleRecords.value = null
  } finally {
    loading.value = false
  }
}

// 刷新战绩
const handleRefresh = () => {
  fetchBattleRecords()
}

// 导出战绩
const handleExport = async () => {
  if (!battleRecords.value || !battleRecords.value.roleDetailsList) {
    message.warning('没有可复制的数据')
    return
  }

  try {
    const exportText = formatBattleRecordsForExport(
      battleRecords.value.roleDetailsList,
      queryDate.value
    )
    await copyToClipboard(exportText)
    message.success('战绩已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败，请重试')
  }
}

const handleDownload = async () => {
  if (!battleRecords.value || !battleRecords.value.roleDetailsList) {
    message.warning('没有可导出的数据')
    return
  }

  try {

    await executeLegionwarMapTask(queryDate.value, battleRecords.value.roleDetailsList)
    message.success('战绩已导出')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

async function executeLegionwarMapTask(dateSelect, roleDetailsList) {
  const date = dateSelect;

  try {
    /******************************************************
 * 提取盐场列表
 ******************************************************/
    let list = roleDetailsList;

    if (!Array.isArray(list) || list.length === 0) {
       message.error('[无数据]')
      console.log("[无数据] =>", list);
      return;
    }

    console.log("[盐场名单] =>", list);
    const data = list.map(
      ({ name, winCnt, loseCnt, buildingCnt }) => [
        name,
        winCnt,
        loseCnt,
        Math.max(loseCnt - 6, 0),
        buildingCnt,
        (winCnt / Math.max(loseCnt, 1)).toFixed(2),
      ]
    );

    const totalWin = data.reduce((sum, arr) => sum + arr[1], 0);
    const totalLose = data.reduce((sum, arr) => sum + arr[2], 0);
    const totalFuHuo = data.reduce((sum, arr) => sum + arr[3], 0);
    const totalBuilding = data.reduce((sum, arr) => sum + arr[4], 0);
    const totalKDA = (totalWin / totalLose).toFixed(2);
    const totalPeople = data.length; // 总人数

    // 计算总体统计数据
    const totalBattles = totalWin + totalLose; // 总战斗
    const totalWinRate =
      (totalBattles > 0
        ? ((totalWin * 100) / totalBattles).toFixed(1)
        : "0.0") + "%"; // 总胜率
    const avgWin = (totalWin / totalPeople).toFixed(2); // 平均击杀
    const avgLose = (totalLose / totalPeople).toFixed(2); // 平均死亡
    const avgBuilding = (totalBuilding / totalPeople).toFixed(2); // 平均刨地
    const avgFuHuo = (totalFuHuo / totalPeople).toFixed(2); // 平均用丹

    data.unshift([
      "总计 " + data.length + "人",
      totalWin,
      totalLose,
      totalFuHuo,
      totalBuilding,
      totalKDA,
    ]);
    data.unshift(["昵称", "击杀", "死亡", "复活", "刨地", "KDA"]);

    // --- 排行榜 Top3 ---
    function top3By(index, isKDA = false) {
      return [...data]
        .slice(2)
        .sort((a, b) =>
          isKDA
            ? parseFloat(b[index]) - parseFloat(a[index])
            : b[index] - a[index]
        )
        .slice(0, 3)
        .map((r, i) => [`第${i + 1}名`, r[0], r[index]]);
    }

    const topKills = top3By(1);
    const topFuHuo = top3By(3);
    const topBuilding = top3By(4);
    const topKDA = top3By(5, true);

    // --- 合并数据 ---
    const mainCols = data[0].length;
    let finalData = [...data];
    let colOffset = mainCols; // 右侧3列起始位置
    let startRow = 0;
    const merges = [];

    // 记录区域范围（精确到最右侧列）
    const regions = {
      main: { startRow: 0, endRow: 0, startCol: 0, endCol: mainCols - 1 },
      stats: {
        startRow: 0,
        endRow: 0,
        startCol: colOffset,
        endCol: colOffset + 2,
      },
      ranks: {
        startRow: 0,
        endRow: 0,
        startCol: colOffset,
        endCol: colOffset + 2,
      },
    };

    // 添加总体统计区域
    function addOverallStats() {
      regions.stats.startRow = startRow;

      // 标题行（跨3列合并）
      finalData[startRow] = finalData[startRow] || [];
      finalData[startRow][colOffset] = "📊 总体统计";
      merges.push({
        s: { r: startRow, c: colOffset },
        e: { r: startRow, c: colOffset + 2 },
      });

      // 统计数据
      const stats = [
        ["总体KDA", totalKDA],
        ["总战斗", totalBattles],
        ["总胜率", totalWinRate],
        ["总击杀", totalWin],
        ["平均击杀", avgWin],
        ["总死亡", totalLose],
        ["平均死亡", avgLose],
        ["总刨地", totalBuilding],
        ["平均刨地", avgBuilding],
        ["总用丹", totalFuHuo],
        ["平均用丹", avgFuHuo],
        ["总人数", totalPeople],
      ];

      stats.forEach((stat, i) => {
        const targetRow = startRow + 1 + i;
        finalData[targetRow] = finalData[targetRow] || [];
        merges.push({
          s: { r: targetRow, c: colOffset },
          e: { r: targetRow, c: colOffset + 2 },
        });
        finalData[targetRow][colOffset] = `${stat[0]}：${stat[1]}`;
      });

      regions.stats.endRow = startRow + stats.length;
      startRow += stats.length + 1;
    }

    addOverallStats();

    // 填充排行榜函数
    function appendTop3(topArray, title, valueName) {
      if (regions.ranks.startRow === 0) regions.ranks.startRow = startRow;

      // 标题行
      finalData[startRow] = finalData[startRow] || [];
      finalData[startRow][colOffset] = title;
      merges.push({
        s: { r: startRow, c: colOffset },
        e: { r: startRow, c: colOffset + 2 },
      });

      // 表头行
      finalData[startRow + 1] = finalData[startRow + 1] || [];
      finalData[startRow + 1][colOffset] = "排名";
      finalData[startRow + 1][colOffset + 1] = "昵称";
      finalData[startRow + 1][colOffset + 2] = valueName;

      // 数据行
      topArray.forEach((row, i) => {
        finalData[startRow + 2 + i] = finalData[startRow + 2 + i] || [];
        finalData[startRow + 2 + i][colOffset] = row[0];
        finalData[startRow + 2 + i][colOffset + 1] = row[1];
        finalData[startRow + 2 + i][colOffset + 2] = row[2];
      });

      startRow += topArray.length + 2;
      regions.ranks.endRow = startRow - 1;
    }

    // 添加四个排行榜
    appendTop3(topKills, "🔥击杀 Top3", "击杀");
    appendTop3(topFuHuo, "💀复活 Top3", "复活");
    appendTop3(topBuilding, "⛏️刨地 Top3", "刨地");
    appendTop3(topKDA, "⚔️ KDA Top3", "KDA");

    // -------------------------- 关键修改：底部对齐与边框优化 --------------------------
    // 1. 计算左侧主数据区和右侧统计区的总行数
    const mainDataRows = data.length; // 左侧原始行数：表头1 + 总计1 + 10玩家 = 12行
    const rightTotalRows = regions.ranks.endRow + 1; // 右侧总行数：从第0行到排行榜结束行，共34行
    const rowDiff = rightTotalRows - mainDataRows; // 高度差：34 - 12 = 22行

    // 2. 为左侧主数据区补充空白行，实现底部对齐
    for (let i = 0; i < rowDiff; i++) {
      const emptyRow = new Array(mainCols).fill(""); // 空白行（仅左侧有内容，右侧已自动填充）
      finalData.push(emptyRow);
    }

    // 3. 更新左侧主数据区的结束行（包含新增空白行）
    regions.main.endRow = rightTotalRows - 1; // 与右侧结束行一致，实现底部对齐
    // -----------------------------------------------------------------------------------

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    ws["!merges"] = merges;

    // 样式配置
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const theme = {
      primary: "3B7ADB", // 主蓝色（表头）
      primaryText: "FFFFFF", // 主色文字
      total: "A9D08E", // 总计行（淡绿）
      overallTitle: "F4B084", // 总体统计标题（暖橙）
      overallTitleText: "804000", // 总体统计文字
      topTitle: "FFD966", // 排行榜标题（浅黄）
      topTitleText: "9C4700", // 排行榜标题文字
      header: "D0E0F8", // 子表头（淡蓝）
      headerText: "003366", // 子表头文字
      rowAlt1: "F8FAFC", // 交替行1
      rowAlt2: "FFFFFF", // 交替行2
      border: "D0D7E3", // 内部边框色
      borderStrong: "8EA9DB", // 区域外边框色（稍深）
    };

    // 基础样式设置（新增空白行也会被赋予样式）
    for (let R = 0; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell_ref]) {
          // 为空白单元格创建基础样式（确保边框完整）
          ws[cell_ref] = { t: "s", v: "", s: {} };
        }
        const val = ws[cell_ref].v;

        // 区域标识
        const isTitle =
          val &&
          (String(val).includes("Top3") || String(val).includes("总体统计"));
        const isSubHeader =
          R > 0 &&
          C >= mainCols &&
          !isTitle &&
          finalData[R]?.[colOffset] === "排名";
        const isMainHeader = R === 0 && C < mainCols;
        const isTotalRow = val && String(val).startsWith("总计");
        const isStatItem = C >= mainCols && !isTitle && !isSubHeader;
        const isDataRow =
          !isTitle && !isSubHeader && !isMainHeader && !isTotalRow;

        // 填充色逻辑（空白行继承交替色）
        let fillColor;
        if (C < mainCols) {
          if (isMainHeader) fillColor = { fgColor: { rgb: theme.primary } };
          else if (isTotalRow) fillColor = { fgColor: { rgb: theme.total } };
          else
            fillColor = {
              fgColor: { rgb: R % 2 === 0 ? theme.rowAlt1 : theme.rowAlt2 },
            };
        } else {
          if (isTitle)
            fillColor = {
              fgColor: {
                rgb: String(val).includes("总体统计")
                  ? theme.overallTitle
                  : theme.topTitle,
              },
            };
          else if (isSubHeader) fillColor = { fgColor: { rgb: theme.header } };
          else
            fillColor = {
              fgColor: { rgb: R % 2 === 0 ? theme.rowAlt1 : theme.rowAlt2 },
            };
        }

        // 对齐逻辑
        let horizontalAlign = "center";
        if (C < mainCols && !isMainHeader && !isTotalRow) {
          horizontalAlign = C === 0 ? "center" : "right";
        } else if (isSubHeader) {
          horizontalAlign =
            C === colOffset ? "left" : C === colOffset + 1 ? "center" : "right";
        } else if (!isStatItem && !isTitle) {
          horizontalAlign =
            C === colOffset ? "left" : C === colOffset + 1 ? "center" : "right";
        }

        // 基础边框（细边框）
        ws[cell_ref].s = {
          alignment: {
            horizontal: horizontalAlign,
            vertical: "center",
            wrapText: true,
          },
          font: {
            name: "微软雅黑",
            sz: 11,
            bold: isTitle || isSubHeader || isMainHeader || isTotalRow,
            color: {
              rgb: isMainHeader
                ? theme.primaryText
                : isTitle
                  ? String(val).includes("总体统计")
                    ? theme.overallTitleText
                    : theme.topTitleText
                  : isSubHeader
                    ? theme.headerText
                    : "000000",
            },
          },
          fill: fillColor,
          border: {
            top: { style: "thin", color: { rgb: theme.border } },
            bottom: { style: "thin", color: { rgb: theme.border } },
            left: { style: "thin", color: { rgb: theme.border } },
            right: { style: "thin", color: { rgb: theme.border } },
          },
        };
      }
    }

    // 修复边框绘制逻辑（确保最右侧边框完整）
    function drawRegionBorder(region, style = "medium") {
      const { startRow, endRow, startCol, endCol } = region;

      // 顶部边框
      for (let c = startCol; c <= endCol; c++) {
        const cell = XLSX.utils.encode_cell({ r: startRow, c });
        if (ws[cell]) {
          ws[cell].s.border.top = { style, color: { rgb: theme.borderStrong } };
        }
      }

      // 底部边框（关键：与右侧结束行对齐）
      for (let c = startCol; c <= endCol; c++) {
        const cell = XLSX.utils.encode_cell({ r: endRow, c });
        if (ws[cell]) {
          ws[cell].s.border.bottom = {
            style,
            color: { rgb: theme.borderStrong },
          };
        }
      }

      // 左侧边框
      for (let r = startRow; r <= endRow; r++) {
        const cell = XLSX.utils.encode_cell({ r, c: startCol });
        if (ws[cell]) {
          ws[cell].s.border.left = {
            style,
            color: { rgb: theme.borderStrong },
          };
        }
      }

      // 右侧边框（重点修复：确保每一行最右侧都有边框）
      for (let r = startRow; r <= endRow; r++) {
        const cell = XLSX.utils.encode_cell({ r, c: endCol });
        if (ws[cell]) {
          ws[cell].s.border.right = {
            style,
            color: { rgb: theme.borderStrong },
          };
        } else {
          // 即使单元格为空，也添加边框
          ws[cell] = {
            t: "s",
            v: "",
            s: {
              border: {
                right: { style, color: { rgb: theme.borderStrong } },
              },
            },
          };
        }
      }
    }

    // 为两个核心区域添加外边框（底部已对齐）
    drawRegionBorder(regions.main); // 左侧玩家数据区（带完整边框）
    drawRegionBorder({
      // 右侧统计排行区（合并stats和ranks为一个区域）
      startRow: 0,
      endRow: regions.ranks.endRow,
      startCol: colOffset,
      endCol: colOffset + 2,
    });

    // 列宽优化
    ws["!cols"] = [
      { wch: 12 }, // 昵称
      { wch: 8 }, // 击杀
      { wch: 8 }, // 死亡
      { wch: 8 }, // 复活
      { wch: 8 }, // 刨地
      { wch: 8 }, // KDA
      { wch: 12 }, // 排行榜第1列
      { wch: 12 }, // 排行榜第2列
      { wch: 12 }, // 排行榜第3列（最右侧列）
    ];

    // === 创建工作簿并导出 ===
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "战报");
    XLSX.writeFile(wb, `${date}-战报-${new Date().toLocaleString()}.xlsx`);

    console.log("[盐场导出完成]");

  } catch (e) {
    console.error("[盐场异常] =>", e);
    message.error("导出失败，请查看控制台。");
  } 
}

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords
})

// Inline 模式：挂载后自动拉取
onMounted(async () => {
  if (props.inline) {
    // 生成日期选项
    generateDateOptions();
    await fetchBattleRecords()
  }
})
</script>

<style scoped lang="scss">
.inline-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--border-light);
  padding: var(--spacing-md);
}

.inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.inline-title {
  font-weight: var(--font-weight-semibold);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.battle-records-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.records-info {
  display: flex;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.member-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
  transition: all var(--transition-fast);

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  &+& {
    margin-top: var(--spacing-sm);
  }
}

.member-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  max-width: 120px;
  flex-shrink: 0;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.member-stats-inline {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  flex: 1;
}

.details-button {
  flex-shrink: 0;
  margin-left: auto;
}

.stat-inline {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
  white-space: nowrap;
  min-width: 52px;
  text-align: center;

  &.win {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &.loss {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  &.siege {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }
}

.battle-details {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.battles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.battle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  border-left: 3px solid transparent;

  &.battle-win {
    border-left-color: #10b981;
  }

  &.battle-loss {
    border-left-color: #ef4444;
  }
}

.battle-participants {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex: 1;
}

.participant {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.participant-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.battle-vs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.battle-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.no-battles {
  padding: var(--spacing-xl);
  text-align: center;
}

// 响应式设计
@media (max-width: 768px) {
  .member-stats {
    grid-template-columns: 1fr;
  }

  .battle-participants {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .battle-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .battle-time {
    align-self: flex-end;
  }
}
</style>
