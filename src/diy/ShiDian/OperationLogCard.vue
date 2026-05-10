<template>
  <MyCard class="operation-log" status-class="active">
    <template #icon>
      <n-icon size="24">
        <DocumentText />
      </n-icon>
    </template>
    <template #title>
      <h3>操作日志</h3>
    </template>
    <template #badge>
      <span>{{ filteredLogs.length }}条</span>
    </template>
    <template #default>
      <div class="log-container">
        <CustomizedCard mode="container">
          <CustomizedCard
            mode="button"
            name="清空日志"
            :disabled="filteredLogs.length === 0"
            @button-click="handleClearLogs"
          />
          <CustomizedCard
            mode="button"
            name="导出日志"
            :disabled="filteredLogs.length === 0"
            @button-click="handleExportLogs"
          />
        </CustomizedCard>
        <div class="log-list" ref="logListRef">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            :class="['log-item', `log-${log.status}`]"
          >
            <div class="log-header">
              <span class="log-time">{{ log.timestamp }}</span>
              <span class="log-operation">{{ log.operation }}</span>
              <span :class="['log-status', `status-${log.status}`]">
                {{ getStatusText(log.status) }}
              </span>
            </div>
            <div class="log-content">
              <div v-if="log.tokenName" class="log-token">
                Token: {{ log.tokenName }}
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.details" class="log-details">
                <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
              </div>
            </div>
          </div>
          <div v-if="filteredLogs.length === 0" class="log-empty">
            暂无日志
          </div>
        </div>
      </div>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import { DocumentText } from '@vicons/ionicons5'

const props = defineProps({
  page: {
    type: String,
    required: true,
    validator: (value) => ['shidian', 'fish-helper'].includes(value)
  },
  cardType: {
    type: String,
    default: '' // 卡片类型，如"武将信息"、"灯神信息"、"暑期活动"等
  },
  filterOperations: {
    type: Array,
    default: () => [] // 如果为空数组，显示所有操作；否则只显示匹配的操作
  }
})

const logStore = useOperationLogStore()
const message = useMessage()
const logListRef = ref(null)

const pageLogs = computed(() => {
  if (props.cardType) {
    return logStore.getLogsByPageAndCardType(props.page, props.cardType).value
  }
  return logStore.getLogsByPage(props.page).value
})

const filteredLogs = computed(() => {
  if (props.filterOperations.length === 0) {
    return pageLogs.value
  }
  return pageLogs.value.filter(log => props.filterOperations.includes(log.operation))
})

const getStatusText = (status) => {
  const statusMap = {
    success: '成功',
    error: '失败',
    warning: '警告',
    info: '信息'
  }
  return statusMap[status] || status
}

const handleClearLogs = () => {
  if (props.filterOperations.length > 0) {
    // 如果指定了过滤操作，只清空这些操作的日志
    const allLogs = props.cardType 
      ? logStore.getLogsByPageAndCardType(props.page, props.cardType).value
      : logStore.getLogsByPage(props.page).value
    const logsToKeep = allLogs.filter(log => !props.filterOperations.includes(log.operation))
    logStore.logs = [...logsToKeep]
    message.success('日志已清空')
  } else {
    logStore.clearLogsByPage(props.page, props.cardType)
    message.success('日志已清空')
  }
}

const handleExportLogs = () => {
  if (props.filterOperations.length > 0) {
    // 如果指定了过滤操作，只导出这些操作的日志
    const allLogs = props.cardType 
      ? logStore.getLogsByPageAndCardType(props.page, props.cardType).value
      : logStore.getLogsByPage(props.page).value
    const logsToExport = allLogs.filter(log => props.filterOperations.includes(log.operation))
    
    const lines = []
    lines.push('='.repeat(60))
    lines.push('操作日志')
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`总记录数: ${logsToExport.length}`)
    lines.push('='.repeat(60))
    lines.push('')

    logsToExport.forEach((log, index) => {
      lines.push(`[${index + 1}] ${log.timestamp}`)
      lines.push(`  页面: ${log.page === 'shidian' ? '十殿' : '一键金鱼'}`)
      lines.push(`  操作: ${log.operation}`)
      if (log.tokenName) {
        lines.push(`  Token: ${log.tokenName}${log.tokenId ? ` (${log.tokenId})` : ''}`)
      }
      lines.push(`  状态: ${log.status === 'success' ? '成功' : log.status === 'error' ? '失败' : log.status === 'warning' ? '警告' : '信息'}`)
      lines.push(`  消息: ${log.message}`)
      if (log.command) {
        lines.push(`  命令: ${log.command}`)
        if (log.commandParams) {
          lines.push(`  命令参数: ${JSON.stringify(log.commandParams, null, 2)}`)
        }
        if (log.response) {
          lines.push(`  返回结果: ${JSON.stringify(log.response, null, 2)}`)
        }
      }
      if (log.details) {
        lines.push(`  详情: ${JSON.stringify(log.details, null, 2)}`)
      }
      lines.push('')
    })

    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const fileName = `操作日志_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.txt`
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('日志已导出')
  } else {
    logStore.exportLogs(props.page, props.cardType)
    message.success('日志已导出')
  }
}

// 自动滚动到底部（新日志添加时）
watch(filteredLogs, () => {
  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = 0 // 新日志在顶部，滚动到顶部
    }
  })
}, { deep: true })
</script>

<style scoped>
.log-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  padding: 8px;
  background: var(--card-bg, #fff);
}

.log-item {
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 3px solid;
  background: var(--item-bg, #f5f5f5);
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-item.log-success {
  border-left-color: #18a058;
  background: #f0f9ff;
}

.log-item.log-error {
  border-left-color: #d03050;
  background: #fff0f0;
}

.log-item.log-warning {
  border-left-color: #f0a020;
  background: #fffbf0;
}

.log-item.log-info {
  border-left-color: #2080f0;
  background: #f0f9ff;
}

.log-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.log-time {
  color: #666;
  font-family: monospace;
}

.log-operation {
  font-weight: 500;
  color: #333;
}

.log-status {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
}

.status-success {
  background: #18a058;
  color: white;
}

.status-error {
  background: #d03050;
  color: white;
}

.status-warning {
  background: #f0a020;
  color: white;
}

.status-info {
  background: #2080f0;
  color: white;
}

.log-content {
  font-size: 12px;
  color: #666;
}

.log-token {
  margin-bottom: 4px;
  font-weight: 500;
}

.log-message {
  margin-bottom: 4px;
}

.log-command {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  border-left: 2px solid #2080f0;
}

.log-command-header {
  font-weight: 500;
  color: #2080f0;
  margin-bottom: 4px;
  font-size: 12px;
}

.log-command-params,
.log-command-response {
  margin-top: 4px;
  font-size: 11px;
}

.log-command-params pre,
.log-command-response pre {
  margin: 4px 0 0 0;
  padding: 4px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  font-size: 10px;
  font-family: monospace;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-details {
  margin-top: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  font-size: 11px;
  font-family: monospace;
  max-height: 100px;
  overflow-y: auto;
}

.log-empty {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>