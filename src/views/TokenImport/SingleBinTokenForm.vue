<template>
  <!-- BIN 批量导入 -->
  <NForm
    label-placement="top"
    size="large"
    :model="importForm"
    :show-label="true"
  >
    <NAlert style="margin-bottom: 16px" type="info" :show-icon="true">
      支持一次选择或拖入多个 BIN / DMP 文件，每个文件导入一个角色。
      文件会依次读取和认证，等待时自动显示进度；失败原因会保留在列表中。
    </NAlert>

    <NFormItem label="游戏角色名称" :show-label="true">
      <NInput
        :disabled="isBusy"
        clearable
        placeholder="例如：主号战士"
        v-model:value="importForm.name"
      ></NInput>
    </NFormItem>

    <NFormItem label="bin文件" :show-label="true">
      <div
        class="upload-dropzone"
        role="button"
        :tabindex="isBusy ? -1 : 0"
        :aria-disabled="isBusy"
        @keydown.enter.prevent="triggerFileInput"
        @keydown.space.prevent="triggerFileInput"
        :class="{ 'drag-over': isDragOver, 'is-disabled': isBusy }"
        @click="triggerFileInput"
        @dragleave="onDragLeave"
        @dragover.prevent="onDragOver"
        @drop.prevent="onDrop"
      >
        <input
          ref="fileInputRef"
          multiple
          accept=".bin,.dmp"
          style="display: none"
          type="file"
          :disabled="isBusy"
          @change="handleFileChange"
        />
        <NIcon class="upload-icon" :size="32">
          <CloudUpload></CloudUpload>
        </NIcon>
        <p>
          {{
            isReading ? "正在逐个读取，请稍候..." : "点击或拖拽文件到此处上传"
          }}
        </p>
        <p class="upload-hint">支持 .bin 和 .dmp 文件，可一次选择多个</p>
      </div>
    </NFormItem>

    <!-- 读取进度 -->
    <div v-if="progress.total > 0" class="process-panel">
      <div class="process-header">
        <span class="process-title">读取进度</span>
        <span class="process-count"
          >{{ progress.done + progress.error + progress.cancelled }}/{{
            progress.total
          }}</span
        >
      </div>
      <NProgress
        style="margin-bottom: 12px"
        type="line"
        :percentage="progressPercent"
        :status="progress.error > 0 ? 'warning' : 'success'"
      ></NProgress>
      <div ref="processListRef" class="process-list">
        <div
          :id="processItemId(index)"
          v-for="(item, index) in progress.items"
          :key="index"
          class="process-item"
          :class="`process-item--${item.status}`"
        >
          <span class="process-icon">{{ statusIcon(item.status) }}</span>
          <div class="process-info">
            <span class="process-name">{{
              item.roleName || item.fileName
            }}</span>
            <span v-if="item.status === 'error'" class="process-filename">{{
              item.fileName
            }}</span>
          </div>
          <span class="process-detail">{{ statusText(item) }}</span>
        </div>
      </div>
    </div>

    <div v-if="isReading" class="form-actions">
      <NButton block size="large" type="error" @click="abortReading">
        终止读取
      </NButton>
    </div>

    <!-- 读取完成后保留在进度区下方，避免角色详情过长导致需要滚动到底部 -->
    <div class="form-actions import-actions">
      <NButton
        block
        size="large"
        type="primary"
        :disabled="isBusy || roleList.length === 0"
        :loading="isImporting"
        @click="handleImport"
      >
        <template #icon>
          <NIcon>
            <CloudUpload></CloudUpload>
          </NIcon>
        </template>
        添加Token
      </NButton>

      <NButton block size="large" :disabled="isBusy" @click="cancel">
        关闭
      </NButton>
    </div>

    <div v-if="roleList.length > 0" class="role-list">
      <div class="role-list-header">已读取的角色 ({{ roleList.length }})</div>
      <div v-for="(role, index) in roleList" :key="index" class="role-item">
        <div class="role-info">
          <strong>角色名称:</strong> {{ role.name || "未命名角色" }}<br />
          <strong>认证状态:</strong> 已通过<br />
          <strong>服务器:</strong> {{ role.server || "未指定" }}
          <NAlert v-if="role.error" type="error" class="save-error">{{
            role.error
          }}</NAlert>
        </div>
      </div>
    </div>

    <!-- 角色详情 -->
    <NCollapse>
      <NCollapseItem name="optional" title="角色详情 (可选)">
        <div class="optional-fields">
          <NFormItem label="服务器">
            <NInput
              :disabled="isBusy"
              placeholder="服务器名称"
              v-model:value="importForm.server"
            ></NInput>
          </NFormItem>

          <NFormItem label="自定义连接地址">
            <NInput
              :disabled="isBusy"
              placeholder="留空使用默认连接"
              v-model:value="importForm.wsUrl"
            ></NInput>
          </NFormItem>
        </div>
      </NCollapseItem>
    </NCollapse>
  </NForm>
</template>

<script setup>
import { CloudUpload } from "@vicons/ionicons5";
import {
  NAlert,
  NButton,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NProgress,
  useMessage,
} from "naive-ui";
import { computed, nextTick, onBeforeUnmount, reactive, ref } from "vue";
import useIndexedDB from "@/hooks/useIndexedDB";
import { useTokenStore } from "@/stores/tokenStore";
import { prepareBinToken, saveBinToken } from "@/utils/binTokenImport";
import {
  getAuthUserRateLimiterCallback,
  getTokenId,
  setAuthUserRateLimiterCallback,
  transformToken,
} from "@/utils/token";
import { getTokenErrorMessage } from "@/utils/tokenLogin";

const emit = defineEmits(["cancel", "ok", "lock"]);
const tokenStore = useTokenStore();
const message = useMessage();
const { storeArrayBuffer, isReady } = useIndexedDB();
const fileInputRef = ref(null);
const processListRef = ref(null);
const isDragOver = ref(false);
const isReading = ref(false);
const isImporting = ref(false);
const isBusy = computed(() => isReading.value || isImporting.value);
const importForm = reactive({ name: "", server: "", wsUrl: "" });
const roleList = ref([]);
const progress = reactive({
  total: 0,
  done: 0,
  error: 0,
  cancelled: 0,
  items: [],
});
const progressPercent = computed(() =>
  progress.total
    ? Math.round(
        ((progress.done + progress.error + progress.cancelled) /
          progress.total) *
          100,
      )
    : 0,
);
let abortRequested = false;
let disposed = false;
let restoreWaitCallback = () => {};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const processItemId = (index) => `singlebin-process-item-${index}`;
const statusIcon = (status) =>
  ({
    queued: "⏸",
    pacing: "⏱",
    reading: "📖",
    authenticating: "🔄",
    waiting: "⏳",
    done: "✅",
    error: "❌",
    cancelled: "⏹",
  })[status];
const statusText = (item) =>
  ({
    queued: "排队中",
    pacing: "等待读取",
    reading: "读取文件中",
    authenticating: "正在认证",
    waiting: `等待 ${item.waitSeconds} 秒后继续`,
    done: item.willUpdate ? "读取成功（将更新已有账号）" : "读取成功",
    error: `失败：${item.errorMsg}`,
    cancelled: "已停止",
  })[item.status];
const scrollActiveIntoView = async () => {
  await nextTick();
  processListRef.value
    ?.querySelector(
      ".process-item--reading, .process-item--authenticating, .process-item--waiting, .process-item--pacing",
    )
    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
};
const resetProgress = () =>
  Object.assign(progress, {
    total: 0,
    done: 0,
    error: 0,
    cancelled: 0,
    items: [],
  });
const cancel = () => {
  if (isBusy.value) return;
  roleList.value = [];
  resetProgress();
  emit("cancel");
};
const triggerFileInput = () => {
  if (!isBusy.value) fileInputRef.value?.click();
};
const handleFileChange = (event) => {
  void processFiles(Array.from(event.target.files || []));
  event.target.value = "";
};
const onDragOver = () => {
  if (!isBusy.value) isDragOver.value = true;
};
const onDragLeave = () => {
  isDragOver.value = false;
};
const onDrop = (event) => {
  isDragOver.value = false;
  void processFiles(Array.from(event.dataTransfer?.files || []));
};
const abortReading = () => {
  abortRequested = true;
  message.info("当前文件处理完成后停止，已读取的角色仍可添加");
};

const processFiles = async (files) => {
  if (!files.length || isBusy.value) return;
  isReading.value = true;
  abortRequested = false;
  emit("lock", true);
  resetProgress();
  progress.total = files.length;
  progress.items = files.map((file) => ({
    fileName: file.name,
    roleName: file.name,
    status: "queued",
    waitSeconds: 0,
    willUpdate: false,
    errorMsg: "",
  }));
  const options = {
    ...importForm,
    pendingIds: new Set(roleList.value.map((role) => role.id)),
  };
  const previous = getAuthUserRateLimiterCallback();
  const onWait = (waitTimeMs, queueSize) => {
    const active = progress.items.find((item) =>
      ["authenticating", "waiting"].includes(item.status),
    );
    if (active && !disposed) {
      active.status = waitTimeMs > 0 ? "waiting" : "authenticating";
      active.waitSeconds = Math.ceil(waitTimeMs / 1000);
    }
    previous?.(waitTimeMs, queueSize);
  };
  setAuthUserRateLimiterCallback(onWait);
  restoreWaitCallback = () => {
    if (getAuthUserRateLimiterCallback() === onWait)
      setAuthUserRateLimiterCallback(previous);
  };
  try {
    for (let i = 0; i < files.length; i++) {
      if (abortRequested || disposed) break;
      const item = progress.items[i];
      if (i > 0) {
        item.status = "pacing";
        void scrollActiveIntoView();
        await sleep(500 + Math.floor(Math.random() * 301));
        if (abortRequested || disposed) break;
      }
      try {
        item.status = "reading";
        void scrollActiveIntoView();
        const role = await prepareBinToken(files[i], options, {
          getTokenId,
          transformToken,
          onAuthenticating: () => {
            item.status = "authenticating";
          },
        });
        if (disposed) break;
        item.roleName = role.name;
        item.willUpdate = tokenStore.gameTokens.some(
          (token) => token.id === role.id,
        );
        roleList.value.push(role);
        options.pendingIds.add(role.id);
        item.status = "done";
        progress.done++;
      } catch (error) {
        if (disposed) break;
        item.status = "error";
        item.errorMsg = getTokenErrorMessage(error);
        progress.error++;
      }
    }
  } finally {
    for (const item of progress.items) {
      if (!["done", "error"].includes(item.status)) {
        item.status = "cancelled";
        progress.cancelled++;
      }
    }
    restoreWaitCallback();
    isReading.value = false;
    emit("lock", false);
  }
  if (disposed) return;
  const summary = `读取成功 ${progress.done} 个，失败 ${progress.error} 个`;
  if (abortRequested) message.info(`已停止：${summary}`);
  else if (progress.error) message.warning(`${summary}，失败原因见文件列表`);
  else message.success(`${summary}，请核对后点击「添加Token」`);
};

const handleImport = async () => {
  if (isBusy.value || !roleList.value.length) return;
  if (!isReady.value) {
    message.error("浏览器存储尚未就绪，请稍后重试");
    return;
  }
  isImporting.value = true;
  emit("lock", true);
  let added = 0;
  let updated = 0;
  const failed = [];
  try {
    for (const role of roleList.value) {
      try {
        const result = await saveBinToken(role, tokenStore, storeArrayBuffer);
        if (result === "updated") updated++;
        else added++;
      } catch (error) {
        role.error = getTokenErrorMessage(error);
        failed.push(role);
      }
    }
    roleList.value = failed;
  } finally {
    isImporting.value = false;
    emit("lock", false);
  }
  if (failed.length) {
    message.warning(
      `新增 ${added} 个，更新 ${updated} 个，失败 ${failed.length} 个；可查看原因后重试`,
    );
  } else {
    message.success(`导入完成：新增 ${added} 个，更新 ${updated} 个`);
    // Keep authentication failures visible until the user closes the dialog.
    if (!progress.error) {
      resetProgress();
      emit("ok");
    }
  }
};

onBeforeUnmount(() => {
  disposed = true;
  abortRequested = true;
  restoreWaitCallback();
  emit("lock", false);
});
</script>

<style scoped lang="scss">
.optional-fields {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  n-form-item {
    flex: 1;
    min-width: 200px;
  }
}

.form-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dropzone-content {
  width: 100%;
  border: 1px dashed #fcc;
  border-radius: 8px;
  text-align: center;
  color: #888;
  padding: 40px 20px;
  font-size: 12px;
}

.upload-dropzone {
  width: 100%;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;

  &:hover,
  &.drag-over {
    border-color: #4f46e5;
    background: #f0f0ff;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      border-color: #d9d9d9;
      background: #fafafa;
    }
  }

  .upload-icon {
    color: #8c8c8c;
    margin-bottom: 8px;
  }

  p {
    margin: 4px 0;
    color: #666;
  }

  .upload-hint {
    font-size: 12px;
    color: #999;
  }
}

.process-panel {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;

  .process-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .process-title {
      font-weight: 600;
      color: #374151;
    }

    .process-count {
      font-size: 13px;
      color: #6b7280;
    }
  }

  .process-list {
    max-height: 240px;
    overflow-y: auto;
  }

  .process-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 13px;
    background: #fff;
    border: 1px solid #f0f0f0;

    & + .process-item {
      margin-top: 6px;
    }

    .process-icon {
      flex: none;
      width: 20px;
      text-align: center;
    }

    .process-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .process-name {
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .process-filename {
        font-size: 11px;
        color: #9ca3af;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .process-detail {
      flex: 0 1 60%;
      min-width: 0;
      overflow-wrap: anywhere;
      color: #6b7280;
      font-size: 12px;
    }

    &--waiting,
    &--pacing {
      border-color: #fcd34d;
      background: #fffbeb;
    }

    &--done {
      border-color: #a7f3d0;
      background: #f0fdf4;
    }

    &--error {
      border-color: #fecaca;
      background: #fef2f2;

      .process-detail {
        color: #dc2626;
      }
    }
  }
}

.role-list {
  margin: 16px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;

  .role-list-header {
    background: #f3f4f6;
    padding: 8px 12px;
    font-weight: 600;
    color: #374151;
  }

  .role-item {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: none;
    }

    .role-info {
      font-size: 13px;
      line-height: 1.6;

      strong {
        color: #374151;
      }
    }
  }
}

.save-error {
  margin-top: 8px;
}
:global([data-theme="dark"]) .upload-dropzone,
:global([data-theme="dark"]) .process-panel,
:global([data-theme="dark"]) .process-item,
:global([data-theme="dark"]) .role-list-header {
  background: #25252a;
  border-color: #484850;
}
:global([data-theme="dark"]) .upload-dropzone p,
:global([data-theme="dark"]) .process-title,
:global([data-theme="dark"]) .process-name,
:global([data-theme="dark"]) .role-list-header,
:global([data-theme="dark"]) .role-info strong {
  color: #e5e7eb;
}
:global([data-theme="dark"]) .process-detail,
:global([data-theme="dark"]) .process-count {
  color: #b8b8c2;
}
:global([data-theme="dark"]) .process-item--error .process-detail {
  color: #fca5a5;
}
</style>
