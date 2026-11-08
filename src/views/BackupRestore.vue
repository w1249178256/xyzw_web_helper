<template>
  <div class="backup-page">
    <div class="container">
      <div class="page-header">
        <h1>备份 / 恢复</h1>
        <p>导出或恢复全部账号与配置，用于换浏览器 / 换设备</p>
      </div>

      <a-card>
        <div class="backup-items">
          <!-- Export: download all data as a single JSON file -->
          <div class="backup-item">
            <div class="backup-info">
              <h3>一键备份</h3>
              <p>
                导出全部账号 Token、BIN
                登录凭据、批量设置、定时任务、任务模板及所有本地配置
              </p>
            </div>
            <div class="backup-action">
              <n-button
                type="primary"
                :loading="backingUp"
                @click="handleBackup"
              >
                备份
              </n-button>
            </div>
          </div>

          <!-- Restore: pick a backup file, then choose replace or merge -->
          <div class="backup-item">
            <div class="backup-info">
              <h3>一键恢复</h3>
              <p>从备份文件恢复全部数据（换浏览器 / 换设备后使用）</p>
            </div>
            <div class="backup-action">
              <n-upload
                :show-file-list="false"
                accept=".json"
                :custom-request="handleRestoreFile"
              >
                <n-button type="info" :loading="restoring">恢复</n-button>
              </n-upload>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { useDialog, useMessage } from "naive-ui";
import { ref } from "vue";
import { useGameRolesStore } from "@/stores/gameRoles";
import { useLocalTokenStore } from "@/stores/localTokenManager";
import {
  collectFullBackup,
  downloadBackupFile,
  restoreFullBackup,
  validateBackup,
} from "@/utils/fullBackup";

const message = useMessage();
const dialog = useDialog();
const gameRolesStore = useGameRolesStore();
const localTokenStore = useLocalTokenStore();

const backingUp = ref(false);
const restoring = ref(false);

// Export the full backup (localStorage config + IndexedDB incl. BIN data)
// and trigger a file download.
const handleBackup = async () => {
  backingUp.value = true;
  try {
    const backup = await collectFullBackup();
    const accountCount =
      backup.indexedDB?.xyzw_token_db?.gameTokens?.length ?? 0;
    const binCount = backup.indexedDB?.xyzw?.tokens?.length ?? 0;
    downloadBackupFile(backup);
    message.success(
      `备份已下载：账号记录 ${accountCount} 条，BIN 凭据 ${binCount} 份`,
    );
  } catch (error) {
    console.error("备份失败:", error);
    message.error(`备份失败：${error.message}`);
  } finally {
    backingUp.value = false;
  }
};

// Refresh in-memory stores after a restore so the UI reflects the new data.
const reloadAllStores = async () => {
  await localTokenStore.initTokenManager();
  await gameRolesStore.fetchGameRoles();
};

// Read the picked file, validate it, then ask the user for the restore mode.
const handleRestoreFile = ({ file }) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (error) {
      message.error("备份文件解析失败，请确认文件未损坏");
      return;
    }

    const invalid = validateBackup(data);
    if (invalid) {
      message.error(invalid);
      return;
    }

    dialog.warning({
      title: "恢复备份",
      content:
        "覆盖模式会先清空当前浏览器里的所有账号与配置，再写入备份数据；合并模式只补充本地不存在的条目。请选择恢复方式：",
      positiveText: "覆盖",
      negativeText: "合并",
      onPositiveClick: () => runRestore(data, "replace"),
      onNegativeClick: () => runRestore(data, "merge"),
    });
  };
  reader.readAsText(file.file);
};

// Execute the restore and reload the page so every store re-reads fresh data.
const runRestore = async (data, mode) => {
  restoring.value = true;
  try {
    const result = await restoreFullBackup(data, mode);
    const idbSummary = Object.entries(result.indexedDB)
      .map(([name, count]) => `${name} ${count} 条`)
      .join("，");
    await reloadAllStores();
    message.success(
      `恢复完成：localStorage ${result.localStorageKeys} 项${
        idbSummary ? `，IndexedDB ${idbSummary}` : ""
      }。页面将刷新以生效`,
    );
    window.setTimeout(() => window.location.reload(), 800);
  } catch (error) {
    console.error("恢复失败:", error);
    message.error(`恢复失败：${error.message}`);
  } finally {
    restoring.value = false;
  }
};
</script>

<style scoped lang="scss">
.backup-page {
  min-height: 100dvh;
  background: var(--bg-secondary);
  padding: var(--spacing-xl) 0;
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);

  h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--text-secondary);
    font-size: var(--font-size-lg);
    margin: 0;
  }
}

.backup-items {
  display: flex;
  gap: var(--spacing-lg);
  flex-direction: column;

  .backup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-medium);
    transition: all var(--transition-fast);

    &:hover {
      box-shadow: var(--shadow-light);
    }

    .backup-info {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        margin-bottom: var(--spacing-xs);
      }

      p {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        margin: 0;
        line-height: 1.6;
      }
    }

    .backup-action {
      flex: 0 0 auto;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .backup-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);

    .backup-action {
      width: 100%;
    }
  }
}
</style>
