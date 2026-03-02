<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <GameController />
      </n-icon>
    </template>
    <template #title>
      <h3>定时任务</h3>
    </template>
    <template #default>
      <div class="scheduled-tasks">
        <!-- 定时任务按钮区域 -->
        <CustomizedCard mode="container">
          <CustomizedCard 
            mode="name-switch"
            name="领取挂机"
            v-model:switchValue="scheduledTasks.claimHangUp"
          />
          <CustomizedCard 
            mode="name-switch"
            name="重置罐子"
            v-model:switchValue="scheduledTasks.resetBottles"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键灯神扫荡"
            v-model:switchValue="scheduledTasks.genieSweep"
          />
          <CustomizedCard 
            mode="name-switch"
            name="领取罐子"
            v-model:switchValue="scheduledTasks.batchlingguanzi"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键俱乐部签到"
            v-model:switchValue="scheduledTasks.batchclubsign"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键竞技场战斗3次"
            v-model:switchValue="scheduledTasks.batcharenafight"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键黑市采购"
            v-model:switchValue="scheduledTasks.store_purchase"
          />

          <CustomizedCard 
            mode="execution-range" 
            name="执行范围" 
            v-model:inputValue="scheduledExecutionTokens" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            @update:inputValue="handleScheduledExecutionTokensInput" 
          />
          <CustomizedCard 
            mode="button"
            :name="isExecutingScheduledTasks ? '执行中...' : '执行'"
            @button-click="handleExecuteScheduledTasks"
            :disabled="isExecutingScheduledTasks"
            :loading="isExecutingScheduledTasks"
          />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        card-type="定时任务"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { ref } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { GameController } from '@vicons/ionicons5'
import ConnectionPoolManager from '@/utils/connectionPoolManager'
import * as tasksHangUp from '@/utils/batch/tasksHangUp'
import * as tasksBottle from '@/utils/batch/tasksBottle'
import * as tasksItem from '@/utils/batch/tasksItem'
import * as tasksArena from '@/utils/batch/tasksArena'
import * as tasksStore from '@/utils/batch/tasksStore'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 30000,
  reconnectDelay: 1000,
  maxRetries: 3
});

// 定时任务相关
const isExecutingScheduledTasks = ref(false)
const scheduledExecutionTokens = ref('')
const scheduledTasks = ref({
  claimHangUp: false,
  resetBottles: false,
  genieSweep: false,
  batchlingguanzi: false,
  batchclubsign: false,
  batcharenafight: false,
  store_purchase: false
})

// 处理定时任务执行范围输入
const handleScheduledExecutionTokensInput = (value) => {
  scheduledExecutionTokens.value = value
}

// 解析执行范围
const parseExecutionRange = (rangeStr) => {
  if (!rangeStr || rangeStr.trim() === '') {
    return null // 执行全部
  }
  
  const result = new Set()
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed === '') continue
    
    if (trimmed.includes('-')) {
      // 处理范围，如 1-5
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          result.add(i)
        }
      }
    } else {
      // 处理单个数字，如 1
      const num = Number(trimmed)
      if (!isNaN(num)) {
        result.add(num)
      }
    }
  }
  
  return Array.from(result).sort((a, b) => a - b)
}

// 执行定时任务
const handleExecuteScheduledTasks = async () => {
  const executionRange = parseExecutionRange(scheduledExecutionTokens.value)
  const targetTokens = executionRange 
    ? tokenStore.gameTokens.filter((token, index) => executionRange.includes(index + 1))
    : tokenStore.gameTokens
  
  if (targetTokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 检查是否有至少一个任务被打开
  const hasActiveTask = Object.values(scheduledTasks.value).some(value => value)
  if (!hasActiveTask) {
    message.warning('请至少打开一个任务开关')
    return
  }
  
  isExecutingScheduledTasks.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = targetTokens.findIndex(t => t.id === token.id) + 1
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行定时任务...`)
          
          // 按顺序执行打开的任务
          if (scheduledTasks.value.claimHangUp) {
            await tasksHangUp.claimHangUpRewardsForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '领取挂机',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '领取挂机成功'
            })
          }
          
          if (scheduledTasks.value.resetBottles) {
            await tasksBottle.resetBottlesForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '重置罐子',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '重置罐子成功'
            })
          }
          
          if (scheduledTasks.value.genieSweep) {
            await tasksItem.batchGenieSweepForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '一键灯神扫荡',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '一键灯神扫荡成功'
            })
          }
          
          if (scheduledTasks.value.batchlingguanzi) {
            await tasksBottle.batchlingguanziForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '领取罐子',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '领取罐子成功'
            })
          }
          
          if (scheduledTasks.value.batchclubsign) {
            await tasksHangUp.batchclubsignForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '一键俱乐部签到',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '一键俱乐部签到成功'
            })
          }
          
          if (scheduledTasks.value.batcharenafight) {
            await tasksArena.batcharenafightForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '一键竞技场战斗3次',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '一键竞技场战斗3次成功'
            })
          }
          
          if (scheduledTasks.value.store_purchase) {
            await tasksStore.store_purchaseForToken(token.id)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '一键黑市采购',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: '一键黑市采购成功'
            })
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 定时任务执行完成`)
          return { success: true, tokenId: token.id }
        } catch (error) {
          console.error(`执行定时任务失败: ${error.message}`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 定时任务执行失败: ${error.message}`)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '执行定时任务',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `定时任务执行失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    message.success(`定时任务执行完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '执行定时任务',
      status: 'success',
      message: `定时任务执行完成：成功 ${successCount} 个，失败 ${failureCount} 个`
    })
  } catch (error) {
    console.error('批量执行定时任务失败:', error)
    message.error(`批量执行定时任务失败: ${error.message}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '执行定时任务',
      status: 'error',
      message: `批量执行定时任务失败: ${error.message}`
    })
  } finally {
    isExecutingScheduledTasks.value = false
  }
}
</script>

<style scoped>
.scheduled-tasks {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>