<template>
  <div>
    <!-- Inline 模式：卡片渲染 -->
    <div v-if="inline" class="inline-wrapper" ref="exportDom">
      <div class="battle-records-content">
        <n-data-table
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :bordered="false"
          size="small"
          :max-height="400"
        />
      </div>
    </div>

    <!-- Modal 模式 -->
    <n-modal
      v-else
      v-model:show="showModal"
      preset="card"
      title="俱乐部盐场战绩"
      style="width: 90%; max-width: 800px"
      @after-leave="handleClose"
    >
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
        </div>
      </template>

      <div class="battle-records-content">
        <n-data-table
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :bordered="false"
          size="small"
          :max-height="500"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, nextTick } from "vue";
import { useMessage, NDataTable, NTag, NButton, NIcon } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import html2canvas from 'html2canvas';
import { downloadCanvasAsImage } from "@/utils/imageExport";
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText,
} from "@vicons/ionicons5";
import {
  getLastSaturday,
  formatTimestamp,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard,
} from "@/utils/clubBattleUtils";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible"]);

const message = useMessage();
const tokenStore = useTokenStore();

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const loading = ref(false);
const battleRecords = ref(null);
const expandedMembers = ref(new Set());
const queryDate = ref("");

const legionMatch = ref({
  isRegistered: false,
});

const pagination = ref({
  pageSize: 10,
});

const tableData = computed(() => {
  if (!battleRecords.value || !battleRecords.value.warMap || !battleRecords.value.warRank) {
    return [];
  }
  
  return battleRecords.value.warMap.map((member, index) => ({
    key: index,
    legionWarType: member.legionWarType,
    warDate: member.warDate,
    rank: battleRecords.value.warRank[index],
  }));
});

const exportDom = ref(null);
const isExporting = ref(false);

const columns = computed(() => {
  const cols = [
    {
      title: () => h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            padding: "0 8px"
          },
        },
        [
            h("span", { style: { fontSize: "16px", fontWeight: "bold", color: "#333" } }, "俱乐部历史盐场战绩"),
            (props.inline && !isExporting.value) ? h(
                'div',
                { style: { display: 'flex', gap: '8px' } },
                [
                    h(
                        NButton,
                        {
                            size: 'tiny',
                            type: 'primary',
                            secondary: true,
                            onClick: (e) => { e.stopPropagation(); handleRefresh(); },
                            disabled: loading.value
                        },
                        {
                            default: () => '刷新',
                            icon: () => h(NIcon, null, { default: () => h(Refresh) })
                        }
                    ),
                    h(
                        NButton,
                        {
                            size: 'tiny',
                            type: 'info',
                            secondary: true,
                            onClick: (e) => { e.stopPropagation(); handleExportImage(); },
                            disabled: loading.value
                        },
                        {
                            default: () => '导出图片',
                            icon: () => h(NIcon, null, { default: () => h(Copy) })
                        }
                    )
                ]
            ) : null
        ]
      ),
      align: "center",
      children: [
        {
          title: "比赛类型",
          key: "legionWarType",
          align: "center",
          render: (row) => legionWarTypesw(row.legionWarType),
        },
        {
          title: "比赛日期",
          key: "warDate",
          align: "center",
        },
        {
          title: "名次",
          key: "rank",
          align: "center",
          render: (row) => {
            let color = "default";
            if (row.rank === 1) color = "warning"; // 金色/冠军
            else if (row.rank === 2) color = "info"; // 银色/亚军
            else if (row.rank === 3) color = "success"; // 铜色/季军
            else if (row.rank > 20) color = "error"; // 排名靠后
            
            return h(
              NTag,
              { type: color, bordered: false, size: "small" },
              { default: () => `第 ${row.rank} 名` }
            );
          },
        },
      ]
    }
  ];

  // 只有在 Inline 模式下且不在导出时，才添加操作列
  // if (props.inline && !isExporting.value) {
  //   // 找到顶层分组
  //   const topGroup = cols[0];
  //   if (topGroup && topGroup.children) {
  //     topGroup.children.push({
  //       title: () => h(
  //         'div',
  //         { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
  //         [
  //           h(
  //             NButton,
  //             {
  //               size: 'tiny',
  //               type: 'primary',
  //               secondary: true,
  //               onClick: handleRefresh,
  //               disabled: loading.value
  //             },
  //             { 
  //               default: () => '刷新',
  //               icon: () => h(NIcon, null, { default: () => h(Refresh) })
  //             }
  //           ),
  //           h(
  //             NButton,
  //             {
  //               size: 'tiny',
  //               type: 'info',
  //               secondary: true,
  //               onClick: handleExportImage,
  //               disabled: loading.value
  //             },
  //             { 
  //               default: () => '图片',
  //               icon: () => h(NIcon, null, { default: () => h(Copy) })
  //             }
  //           )
  //         ]
  //       ),
  //       key: "actions",
  //       align: "center",
  //       width: 140,
  //       render: () => null // 内容列为空
  //     });
  //   }
  // }

  return cols;
});

const handleExportImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    message.error("未找到要导出的内容");
    return;
  }

  try {
    isExporting.value = true;
    message.loading("正在生成图片，请稍候...");

    // 等待Vue更新DOM（移除操作列等）
    await nextTick();

    // 获取 table-container
    const tableContainer = exportDom.value.querySelector('.n-data-table');
    
    // 临时调整表格容器高度，确保所有内容可见
    if (tableContainer) {
      // 尝试找到 n-data-table 的滚动容器
      const scrollContainer = tableContainer.querySelector('.n-data-table-base-table-body');
      if (scrollContainer) {
        // 保存原始样式
        scrollContainer.dataset.originalHeight = scrollContainer.style.height;
        scrollContainer.dataset.originalOverflow = scrollContainer.style.overflow;

        // 强制展开
        scrollContainer.style.height = "auto";
        scrollContainer.style.overflow = "visible";
      }
      
      // 保存外层table容器的样式
      tableContainer.dataset.originalHeight = tableContainer.style.height;
      tableContainer.style.height = "auto";
    }

    // 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片
      backgroundColor: "#ffffff", // 避免透明背景
      logging: false, // 关闭控制台日志
      allowTaint: true, // 允许跨域图片污染画布
    });

    // Canvas转图片链接并下载
    const dateStr = new Date().toLocaleDateString().replace(/\//g, "-");
    const filename = `俱乐部历史战绩_${dateStr}.png`;
    downloadCanvasAsImage(canvas, filename);

    message.success("图片导出成功");
  } catch (err) {
    console.error("DOM转图片失败：", err);
    message.error("导出图片失败，请重试");
  } finally {
    // 恢复原始样式
    const tableContainer = exportDom.value?.querySelector('.n-data-table');
    if (tableContainer) {
      const scrollContainer = tableContainer.querySelector('.n-data-table-base-table-body');
      if (scrollContainer) {
        if (scrollContainer.dataset.originalHeight) {
          scrollContainer.style.height = scrollContainer.dataset.originalHeight;
        } else {
          scrollContainer.style.removeProperty('height');
        }

        if (scrollContainer.dataset.originalOverflow) {
          scrollContainer.style.overflow = scrollContainer.dataset.originalOverflow;
        } else {
          scrollContainer.style.removeProperty('overflow');
        }

        delete scrollContainer.dataset.originalHeight;
        delete scrollContainer.dataset.originalOverflow;
      }
      
      // 恢复外层table容器样式
      if (tableContainer.dataset.originalHeight) {
        tableContainer.style.height = tableContainer.dataset.originalHeight;
      } else {
        tableContainer.style.removeProperty('height');
      }
      delete tableContainer.dataset.originalHeight;
    }
    
    isExporting.value = false;
  }
};

// 格式化战力
const formatPower = (power) => {
  if (!power) return "0";
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + "亿";
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + "万";
  }
  return power.toString();
};

// 获取战斗样式类
const getBattleClass = (battle) => {
  const classes = [];
  if (battle.newWinFlag === 2) {
    classes.push("battle-win");
  } else {
    classes.push("battle-loss");
  }
  if (battle.attackType === 0) {
    classes.push("battle-attack");
  } else {
    classes.push("battle-defend");
  }
  return classes.join(" ");
};

const legionWarTypesw = (legionWarType) => {
  switch (legionWarType) {
    case 15:
      return "灰岩岛";
    case 16:
      return "进阶周赛";
    case 17:
      return "进阶月赛";
    case 18:
      return "青铜周赛";
    case 19:
      return "青铜月赛";
    case 20:
      return "秘蓝周赛";
    case 21:
      return "秘蓝月赛";
    case 22:
      return "月宫周赛";
    case 23:
      return "月宫月赛";
    case 24:
      return "天宫周赛";
    case 25:
      return "天宫月赛";
    case 6:
      return "夺旗赛";
    default:
      return "伟大航路";
  }
};

// 切换成员详情展开状态
const toggleMemberDetails = (roleId) => {
  if (expandedMembers.value.has(roleId)) {
    expandedMembers.value.delete(roleId);
  } else {
    expandedMembers.value.add(roleId);
  }
};

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = "none";
};

// 查询战绩
const fetchBattleRecords = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询战绩");
    return;
  }

  loading.value = true;
  queryDate.value = getLastSaturday();

  try {
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfo",
      10000,
    );
    if (result && result.info.warRank && result.info.warMap) {
      const warMapValueList = Object.values(result.info.warMap);
      battleRecords.value = {
        warMap: [].concat(...warMapValueList).reverse(),
        warRank: result.info.warRank.reverse(),
      };
      console.log(battleRecords.value);
      message.success("战绩加载成功");
    } else {
      battleRecords.value = null;
      message.warning("未查询到战绩数据");
    }
  } catch (error) {
    console.error("查询战绩失败:", error);
    message.error(`查询失败: ${error.message}`);
    battleRecords.value = null;
  } finally {
    loading.value = false;
  }
};

// 刷新战绩
const handleRefresh = () => {
  fetchBattleRecords();
};

// 导出战绩
const handleExport = async () => {
  if (!battleRecords.value || !battleRecords.value.roleDetailsList) {
    message.warning("没有可导出的数据");
    return;
  }

  try {
    const exportText = formatBattleRecordsForExport(
      battleRecords.value.roleDetailsList,
      queryDate.value,
    );
    await copyToClipboard(exportText);
    message.success("战绩已复制到剪贴板");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败，请重试");
  }
};

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear();
};

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords,
});

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    fetchBattleRecords();
  }
});
</script>

<style scoped lang="scss">
.inline-wrapper {
  background: var(--bg-primary);
  /* 移除外边框和内边距 */
  /* border-radius: var(--border-radius-medium); */
  /* border: 1px solid var(--border-light); */
  /* padding: var(--spacing-md); */
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
  max-height: 400px;
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

  & + & {
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
  min-width: 80px;
  max-width: 80px;
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
.ranking {
  white-space: nowrap;
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
