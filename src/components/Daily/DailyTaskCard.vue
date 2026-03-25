<template>
  <div class="daily-task-card" :class="{ completed: task.completed }">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-left">
        <img
          :src="task.icon || '/icons/ta.png'"
          :alt="task.title"
          class="task-icon"
        />
        <div class="title-container">
          <h3 class="title">
            {{ task.title }}
          </h3>
          <p v-if="task.subtitle" class="subtitle">
            {{ task.subtitle }}
          </p>
        </div>
      </div>

      <div class="header-right">
        <div
          class="status-indicator"
          :class="{ completed: task.completed }"
          @click="toggleStatus"
        >
          <span class="status-dot" :class="{ completed: task.completed }" />
          <span>{{ task.completed ? "已完成" : "待完成" }}</span>
        </div>

        <n-button text class="settings-button" @click="showSettings = true">
          <template #icon>
            <n-icon class="settings-icon">
              <Settings />
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 进度信息 -->
    <div v-if="task.progress" class="progress-container">
      <div class="info-container">
        <div class="info-item">
          <span class="info-label">当前进度</span>
          <span class="info-value"
            >{{ task.progress.current }}/{{ task.progress.total }}</span
          >
        </div>
        <div v-if="task.reward" class="info-item">
          <span class="info-label">奖励</span>
          <span class="info-value">{{ task.reward }}</span>
        </div>
        <div v-if="task.nextReset" class="info-item">
          <span class="info-label">重置时间</span>
          <span class="info-value">{{ formatResetTime(task.nextReset) }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="!task.completed" class="actions-container">
      <n-button
        type="primary"
        block
        :loading="isExecuting"
        :disabled="!task.canExecute"
        class="complete-button"
        @click="executeTask"
      >
        {{ getButtonText() }}
      </n-button>
    </div>

    <!-- 设置模态框 -->
    <n-modal
      v-model:show="showSettings"
      preset="card"
      title="任务设置"
      style="width: 480px"
    >
      <template #header>
        <div class="modal-header">
          <n-icon class="modal-icon">
            <Settings />
          </n-icon>
          <span>{{ task.title }} - 设置</span>
        </div>
      </template>

      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <n-checkbox
              v-model:checked="taskSettings.autoExecute"
              @update:checked="updateSetting('autoExecute', $event)"
            >
              自动执行
            </n-checkbox>
          </div>

          <div class="setting-item">
            <label class="setting-label">执行延迟 (秒)</label>
            <n-input-number
              v-model:value="taskSettings.delay"
              :min="0"
              :max="300"
              @update:value="updateSetting('delay', $event)"
            />
          </div>

          <div class="setting-item">
            <n-checkbox
              v-model:checked="taskSettings.notification"
              @update:checked="updateSetting('notification', $event)"
            >
              完成通知
            </n-checkbox>
          </div>
        </div>

        <!-- 任务详情 -->
        <div v-if="task.details" class="task-details">
          <h4>任务详情</h4>
          <div class="task-list">
            <div
              v-for="detail in task.details"
              :key="detail.id"
              class="task-item"
            >
              <div class="task-item-left">
                <n-icon
                  class="task-status-icon"
                  :class="{ completed: detail.completed }"
                >
                  <CheckCircle v-if="detail.completed" />
                  <Clock v-else />
                </n-icon>
                <span class="task-name">{{ detail.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 执行日志 -->
        <div v-if="task.logs && task.logs.length" class="execution-log">
          <h4>执行日志</h4>
          <div class="log-container">
            <div
              v-for="log in task.logs.slice(-5)"
              :key="log.id"
              class="log-item"
            >
              <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
              <span
                class="log-message"
                :class="{
                  error: log.type === 'error',
                  success: log.type === 'success',
                }"
              >
                {{ log.message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useMessage } from "naive-ui";
import {
  Settings,
  Checkmark as CheckCircle,
  Time as Clock,
} from "@vicons/ionicons5";

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:task", "execute", "toggle-status"]);

const message = useMessage();
const showSettings = ref(false);
const isExecuting = ref(false);

// 任务设置
const taskSettings = ref({
  autoExecute: props.task.settings?.autoExecute || false,
  delay: props.task.settings?.delay || 0,
  notification: props.task.settings?.notification || true,
});

// 计算属性
const getButtonText = () => {
  if (isExecuting.value) return "执行中...";
  if (!props.task.canExecute) return "不可执行";
  return "立即执行";
};

// 方法
const toggleStatus = () => {
  emit("toggle-status", props.task.id);
};

const executeTask = async () => {
  if (isExecuting.value || !props.task.canExecute) return;

  try {
    isExecuting.value = true;
    await emit("execute", props.task.id);

    if (taskSettings.value.notification) {
      message.success(`任务 "${props.task.title}" 执行成功`);
    }
  } catch (error) {
    message.error(`任务执行失败: ${error.message}`);
  } finally {
    isExecuting.value = false;
  }
};

const updateSetting = (key, value) => {
  taskSettings.value[key] = value;

  // 发出设置更新事件
  emit("update:task", {
    ...props.task,
    settings: { ...taskSettings.value },
  });
};

const formatResetTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLogTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 监听任务设置变化
watch(
  () => props.task.settings,
  (newSettings) => {
    if (newSettings) {
      taskSettings.value = { ...taskSettings.value, ...newSettings };
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.daily-task-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-light);
  min-height: 184px;
  padding: var(--spacing-lg);
  position: relative;
  transition: all var(--transition-normal);
  border-left: 4px solid var(--primary-color);

  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }

  &.completed {
    border-left-color: var(--success-color);
    opacity: 0.8;
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.task-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: var(--border-radius-small);
}

.title-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-xs) 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--bg-tertiary);
  border-radius: 9999px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--bg-secondary);
  }

  &.completed {
    background-color: rgba(24, 160, 88, 0.1);
    color: var(--success-color);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: var(--text-secondary);
  border-radius: 50%;
  transition: background-color var(--transition-fast);

  &.completed {
    background-color: var(--success-color);
  }
}

.settings-button {
  padding: var(--spacing-xs);

  &:hover {
    background-color: var(--bg-tertiary);
  }
}

.settings-icon {
  color: var(--text-secondary);
  width: 16px;
  height: 16px;
}

.progress-container {
  margin-bottom: var(--spacing-md);
}

.info-container {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.info-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.info-value {
  color: var(--text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.actions-container {
  margin-top: var(--spacing-md);
}

.complete-button {
  width: 100%;
  height: 40px;
  font-weight: var(--font-weight-medium);

  &.n-button--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

// 模态框样式
.modal-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
}

.modal-icon {
  width: 20px;
  height: 20px;
}

.settings-content {
  padding: var(--spacing-md) 0;
}

.settings-grid {
  display: grid;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.task-details,
.execution-log {
  margin-top: var(--spacing-xl);

  h4 {
    color: var(--text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-md);
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
}

.task-item-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.task-status-icon {
  color: var(--text-tertiary);
  width: 20px;
  height: 20px;

  &.completed {
    color: var(--success-color);
  }
}

.task-name {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.log-container {
  background-color: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.log-item {
  display: flex;
  font-size: var(--font-size-sm);
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
}

.log-time {
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 60px;
}

.log-message {
  color: var(--text-secondary);

  &.error {
    color: var(--error-color);
  }

  &.success {
    color: var(--success-color);
  }
}

// 响应式设计
@media (max-width: 640px) {
  .daily-task-card {
    padding: var(--spacing-md);
  }

  .header-right {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-end;
  }

  .info-container {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
