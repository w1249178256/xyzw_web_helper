<template>
  <div ref="listRootRef">
    <n-card v-if="data && data.length > 0" :title="title" class="server-role-list-card">
    <div class="server-role-list-search">
      <n-input
        v-model:value="serverSearchKeyword"
        placeholder="搜索区服（输入区服号，如 1）"
        clearable
        size="small"
        class="server-role-list-search__input"
      >
        <template #prefix>
          <n-icon :component="SearchIcon" />
        </template>
      </n-input>
    </div>
    <!-- 移动端：卡片列表 -->
    <div class="server-role-list server-role-list--mobile">
      <div
        v-for="(row, idx) in filteredData"
        :key="`${row.serverId}-${row.roleId}-${idx}`"
        class="server-role-card"
      >
        <div class="server-role-card__main">
          <div class="server-role-card__title">{{ row.name || "未命名" }}</div>
          <div class="server-role-card__meta">
            <span>{{ getServerIdDisplay(row) }}服</span>
            <span>序号{{ getRoleIndexDisplay(row) }}</span>
            <span>战力 {{ formatPower(row.power) }}</span>
          </div>
        </div>
        <div class="server-role-card__actions">
          <n-button type="primary" size="small" block @click="emit('add', row)">
            添加
          </n-button>
          <n-button type="info" size="small" block @click="emit('download', row)">
            下载
          </n-button>
        </div>
      </div>
    </div>
    <!-- 桌面端：表格 -->
    <div class="server-role-list server-role-list--desktop">
      <div class="server-role-list-scroll" :style="scrollStyle">
        <n-data-table
          :columns="columns"
          :data="filteredData"
          :pagination="{ pageSize: 5 }"
          :scroll-x="600"
        />
      </div>
    </div>
  </n-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watch, nextTick } from "vue";
import { NCard, NDataTable, NButton, NInput, NIcon } from "naive-ui";
import { Search } from "@vicons/ionicons5";
import { formatPower } from "@/utils/legionWar";

const SearchIcon = Search;
const serverSearchKeyword = ref("");
const listRootRef = ref<HTMLElement | null>(null);

const props = withDefaults(
  defineProps<{
    data: any[];
    title?: string;
    serverColumnTitle?: string;
    maxHeight?: string;
  }>(),
  {
    title: "服务器角色列表",
    serverColumnTitle: "区服",
    maxHeight: "",
  }
);

const emit = defineEmits<{
  add: [row: any];
  download: [row: any];
}>();

function getServerIdDisplay(row: any) {
  let sid = Number(row.serverId);
  if (sid >= 2000000) sid -= 2000000;
  else if (sid >= 1000000) sid -= 1000000;
  return sid - 27;
}

function getRoleIndexDisplay(row: any) {
  const sid = Number(row.serverId);
  if (sid >= 2000000) return 2;
  if (sid >= 1000000) return 1;
  return 0;
}

const filteredData = computed(() => {
  const keyword = (serverSearchKeyword.value || "").trim();
  if (!keyword) return props.data;
  const lower = keyword.toLowerCase();
  return props.data.filter((row: any) => {
    const serverNum = String(getServerIdDisplay(row));
    const name = (row.name || "").toLowerCase();
    const roleId = String(row.roleId || "");
    return serverNum.includes(keyword) || name.includes(lower) || roleId.includes(keyword);
  });
});

const scrollStyle = computed(() => {
  if (!props.maxHeight) return {};
  return {
    maxHeight: props.maxHeight,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
  };
});

/** 在模态等内部滚动容器中，将列表区域滚动到父容器可视区域的最顶部 */
function scrollListIntoView(el: HTMLElement) {
  function doScroll(scrollParent: HTMLElement) {
    const parentRect = scrollParent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offsetTop = elRect.top - parentRect.top + scrollParent.scrollTop;
    scrollParent.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
  }

  const modalBody = el.closest?.("[class*='modal-body' i], [class*='modal-content' i]");
  if (modalBody && modalBody instanceof HTMLElement && modalBody.scrollHeight > modalBody.clientHeight) {
    doScroll(modalBody);
    return;
  }

  let p: HTMLElement | null = el.parentElement;
  while (p) {
    const style = getComputedStyle(p);
    const overflowY = style.overflowY;
    const canScroll = p.scrollHeight > p.clientHeight && (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay");
    if (canScroll) {
      doScroll(p);
      return;
    }
    p = p.parentElement;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

watch(
  () => props.data.length,
  (len, prevLen) => {
    if (len > 0 && (prevLen === 0 || prevLen === undefined)) {
      nextTick(() => {
        requestAnimationFrame(() => {
          const el = listRootRef.value;
          if (el) scrollListIntoView(el);
        });
      });
    }
  }
);

const columns = computed(() => [
  {
    title: props.serverColumnTitle,
    key: "serverId",
    render(row: any) {
      return getServerIdDisplay(row);
    },
  },
  {
    title: "角色序号",
    key: "roleIndex",
    render(row: any) {
      return getRoleIndexDisplay(row);
    },
  },
  {
    title: "角色ID",
    key: "roleId",
  },
  {
    title: "角色名称",
    key: "name",
  },
  {
    title: "战力",
    key: "power",
    render(row: any) {
      return formatPower(row.power);
    },
    sorter: (row1: any, row2: any) => row1.power - row2.power,
  },
  {
    title: "操作",
    key: "actions",
    render(row: any) {
      return h(
        "div",
        { style: "display: flex; gap: 8px;" },
        [
          h(
            NButton,
            {
              size: "small",
              type: "primary",
              onClick: () => emit("add", row),
            },
            { default: () => "添加" }
          ),
          h(
            NButton,
            {
              size: "small",
              type: "info",
              onClick: () => emit("download", row),
            },
            { default: () => "下载" }
          ),
        ]
      );
    },
  },
]);
</script>

<style scoped lang="scss">
.server-role-list-card {
  margin-top: 16px;
  margin-bottom: 16px;
}

.server-role-list-search {
  margin-bottom: var(--spacing-md, 12px);
}

.server-role-list-search__input {
  max-width: 240px;
}

.server-role-list--desktop {
  display: none;
}

.server-role-list--mobile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
  max-height: 50vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.server-role-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 8px);
  padding: var(--spacing-md, 12px);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium, 8px);
  border: 1px solid var(--border-light);
}

.server-role-card__main {
  flex: 1;
  min-width: 0;
}

.server-role-card__title {
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary);
  font-size: var(--font-size-md, 14px);
  margin-bottom: var(--spacing-xs, 4px);
  word-break: break-all;
}

.server-role-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm, 8px);
  font-size: var(--font-size-sm, 12px);
  color: var(--text-secondary);
}

.server-role-card__meta span {
  white-space: nowrap;
}

.server-role-card__actions {
  display: flex;
  gap: var(--spacing-sm, 8px);
  flex-shrink: 0;
}

.server-role-card__actions .n-button {
  flex: 1;
}

.server-role-list-scroll {
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .server-role-list--mobile {
    display: none;
  }

  .server-role-list--desktop {
    display: block;
  }
}
</style>
