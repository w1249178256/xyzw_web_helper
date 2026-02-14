/**
 * 日志管理工具
 */

/**
 * 创建日志管理器
 * @param {object} options - 配置选项
 * @param {object} options.logs - 日志数组ref
 * @param {object} options.logContainer - 日志容器ref
 * @param {object} options.autoScrollLog - 自动滚动ref
 * @param {object} options.batchSettings - 批量设置
 * @param {function} options.nextTick - Vue nextTick函数
 * @returns {object} - 日志管理器对象
 */
export function createLogManager({ logs, logContainer, autoScrollLog, batchSettings, nextTick }) {
  /**
   * 添加日志
   * @param {object} log - 日志对象 {time: string, message: string, type: string}
   */
  const addLog = (log) => {
    // 添加日志数据到数组
    logs.value.push(log);

    // 限制logs数组大小，防止内存占用过大
    const maxLogEntries = batchSettings.maxLogEntries || 1000;
    if (logs.value.length > maxLogEntries) {
      logs.value = logs.value.slice(-maxLogEntries);
    }

    // 尝试DOM操作，但不依赖nextTick确保日志显示
    // 在后台运行时，浏览器可能会限制DOM操作
    try {
      if (logContainer.value && autoScrollLog.value) {
        // 直接尝试滚动，不使用nextTick
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    } catch (error) {
      // 忽略DOM操作错误，确保日志数据仍然被记录
      console.warn("Failed to scroll log container:", error);
    }

    // 同时使用nextTick作为后备，确保在页面回到前台时能正确滚动
    nextTick(() => {
      try {
        if (logContainer.value && autoScrollLog.value) {
          logContainer.value.scrollTop = logContainer.value.scrollHeight;
        }
      } catch (error) {
        // 忽略错误
      }
    });
  };

  /**
   * 清空日志
   */
  const clearLogs = () => {
    logs.value = [];
  };

  /**
   * 复制日志
   * @param {function} message - NaiveUI message函数
   */
  const copyLogs = (message) => {
    if (logs.value.length === 0) {
      message.warning("没有可复制的日志");
      return;
    }
    const logText = logs.value
      .map((log) => `${log.time} ${log.message}`)
      .join("\n");
    navigator.clipboard
      .writeText(logText)
      .then(() => {
        message.success("日志已复制到剪贴板");
      })
      .catch((err) => {
        message.error("复制日志失败: " + err.message);
      });
  };

  return {
    addLog,
    clearLogs,
    copyLogs,
  };
}

/**
 * 添加任务保存日志
 * @param {object} task - 任务对象
 * @param {boolean} isNew - 是否是新增
 * @param {function} addLog - 日志添加函数
 */
export const addTaskSaveLog = (task, isNew, addLog) => {
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `=== ${isNew ? "新增" : "修改"}定时任务: ${task.name} ===`,
    type: "info",
  });
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `运行类型: ${task.runType === "daily" ? "每天固定时间" : "Cron表达式"}`,
    type: "info",
  });
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `运行时间: ${task.runType === "daily" ? task.runTime : task.cronExpression}`,
    type: "info",
  });
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `选中账号: ${task.selectedTokens.length} 个`,
    type: "info",
  });
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `选中任务: ${task.selectedTasks.length} 个`,
    type: "info",
  });
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `状态: ${task.enabled ? "启用" : "禁用"}`,
    type: "info",
  });
};
