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
            name="一键竞技场"
            v-model:switchValue="scheduledTasks.batcharenafight"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键黑市采购"
            v-model:switchValue="scheduledTasks.store_purchase"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键俱乐部 BOSS"
            v-model:switchValue="scheduledTasks.legion_boss"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键每日免费礼包"
            v-model:switchValue="scheduledTasks.freeGift"
          />
          <CustomizedCard 
            mode="name-switch"
            name="一键每日咸王"
            v-model:switchValue="scheduledTasks.dailyBoss"
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
          <CustomizedCard 
            mode="button"
            :name="isBatchBlackMarketRunning ? '批量黑市周中...' : '批量黑市周'"
            @button-click="handleBatchBlackMarket"
            :disabled="isBatchBlackMarketRunning"
            :loading="isBatchBlackMarketRunning"
          />
          <CustomizedCard 
            mode="button"
            :name="isBatchRecruitWeekRunning ? '批量招募周中...' : '批量招募周'"
            @button-click="handleBatchRecruitWeek"
            :disabled="isBatchRecruitWeekRunning"
            :loading="isBatchRecruitWeekRunning"
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

// 获取今日 BOSS ID 的函数（根据星期几返回不同的 BOSS ID）
const getTodayBossId = () => {
  const DAY_BOSS_MAP = [9904, 9905, 9901, 9902, 9903, 9904, 9905] // 周日~周六
  const dayOfWeek = new Date().getDay()
  return DAY_BOSS_MAP[dayOfWeek]
}

// 招募周活动 ID 常量
const RECRUIT_WEEK_ACTIVITY_ID = 2603132

// 定时任务相关
const isExecutingScheduledTasks = ref(false)
const isBatchBlackMarketRunning = ref(false)
const isBatchRecruitWeekRunning = ref(false)
const scheduledExecutionTokens = ref('')
const scheduledTasks = ref({
  claimHangUp: false,
  resetBottles: false,
  genieSweep: false,
  batchlingguanzi: false,
  batchclubsign: false,
  batcharenafight: false,
  store_purchase: false,
  legion_boss: false,
  freeGift: false,
  dailyBoss: false
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
  // 按token昵称排序的token列表
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(scheduledExecutionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 检查是否有至少一个任务被打开
  const hasActiveTask = Object.values(scheduledTasks.value).some(value => value)
  if (!hasActiveTask) {
    message.warning('请至少打开一个任务开关')
    return
  }
  
  // 获取每个token在sortedTokens中的序号
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = scheduledExecutionTokens.value ? `范围${scheduledExecutionTokens.value}` : "全部"
  message.info(`开始执行定时任务（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  logStore.addLog({
    page: 'fish-helper',
    cardType: '定时任务',
    operation: '执行定时任务',
    status: 'info',
    message: `开始执行定时任务（${rangeText}），共${targetTokens.length}个Token`
  })
  
  isExecutingScheduledTasks.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始执行定时任务...`)
          
          // 按顺序执行打开的任务
          if (scheduledTasks.value.claimHangUp) {
            try {
              // 领取挂机奖励
              await tokenStore.sendMessageWithPromise(
                token.id,
                'system_claimhangupreward',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 1200))
              
              // 挂机加钟4次
              for (let i = 0; i < 4; i++) {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'system_mysharecallback',
                  { isSkipShareCard: true, type: 2 },
                  5000
                )
                await new Promise(resolve => setTimeout(resolve, 500))
              }
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '领取挂机',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、领取挂机成功`
              })
            } catch (error) {
              console.error(`领取挂机失败: ${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '领取挂机',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、领取挂机失败`
              })
            }
          }
          
          if (scheduledTasks.value.resetBottles) {
            try {
              // 重置罐子：先停止计时，再开始计时
              await tokenStore.sendMessageWithPromise(
                token.id,
                'bottlehelper_stop',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              await tokenStore.sendMessageWithPromise(
                token.id,
                'bottlehelper_start',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '重置罐子',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、重置罐子成功`
              })
            } catch (error) {
              console.error(`重置罐子失败: ${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '重置罐子',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、重置罐子失败`
              })
            }
          }
          
          if (scheduledTasks.value.genieSweep) {
            try {
              // 执行3次genie_buysweep命令
              for (let i = 0; i < 3; i++) {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'genie_buysweep',
                  {},
                  5000
                )
                await new Promise(resolve => setTimeout(resolve, 500))
              }
              
              // 灯神扫荡 - 循环执行4次，每次使用不同的genieId（1-4）
              for (let genieId = 1; genieId <= 4; genieId++) {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'genie_sweep',
                  { genieId: genieId, sweepCnt: 1 },
                  5000
                )
                await new Promise(resolve => setTimeout(resolve, 500))
              }
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键灯神扫荡',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、一键灯神扫荡成功`
              })
            } catch (error) {
              console.error(`一键灯神扫荡失败: ${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键灯神扫荡',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、一键灯神扫荡失败`
              })
            }
          }
          
          if (scheduledTasks.value.batchlingguanzi) {
            try {
              // 领取盐罐
              await tokenStore.sendMessageWithPromise(
                token.id,
                'bottlehelper_claim',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '领取罐子',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、领取罐子成功`
              })
            } catch (error) {
              console.error(`领取罐子失败: ${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '领取罐子',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、领取罐子失败`
              })
            }
          }
          
          if (scheduledTasks.value.batchclubsign) {
            try {
              // 俱乐部签到
              await tokenStore.sendMessageWithPromise(
                token.id,
                'legion_signin',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键俱乐部签到',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、一键俱乐部签到成功`
              })
            } catch (error) {
              console.error(`一键俱乐部签到失败: ${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键俱乐部签到',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、一键俱乐部签到失败`
              })
            }
          }
          
          if (scheduledTasks.value.batcharenafight) {
            try {
              // 一键竞技场：复制 dailyTaskRunner.js 中的竞技场逻辑
              const hour = new Date().getHours()
              
              // 时间检查
              if (hour < 6) {
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 当前时间未到 6 点，跳过竞技场`)
                return
              }
              if (hour > 22) {
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 当前时间已过 22 点，跳过竞技场`)
                return
              }
              
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 开始竞技场战斗流程`)
              
              // 开始竞技场
              await tokenStore.sendMessageWithPromise(
                token.id,
                'arena_startarea',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // 进行 3 次战斗
              for (let i = 1; i <= 3; i++) {
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 竞技场战斗 ${i}/3`)
                
                // 获取对手列表
                let targets
                try {
                  targets = await tokenStore.sendMessageWithPromise(
                    token.id,
                    'arena_getareatarget',
                    {},
                    5000
                  )
                } catch (err) {
                  console.error(`[序号${tokenIndex}] 竞技场战斗${i} - 获取对手失败：${err.message}`)
                  break
                }
                
                // 选择对手 ID - 参考 dailyTaskRunner.js 的 pickArenaTargetId 逻辑
                let targetId = null
                if (targets) {
                  if (Array.isArray(targets)) {
                    // Handle if targets is an array directly
                    const candidate = targets[0]
                    targetId = candidate?.roleId || candidate?.id || candidate?.targetId
                  } else {
                    // Try different possible structures
                    const candidate =
                      targets?.rankList?.[0] ||
                      targets?.roleList?.[0] ||
                      targets?.targets?.[0] ||
                      targets?.targetList?.[0] ||
                      targets?.list?.[0]
                    if (candidate) {
                      targetId = candidate?.roleId || candidate?.id || candidate?.targetId
                    }
                  }
                }
                
                if (targetId) {
                  // 开始战斗
                  await tokenStore.sendMessageWithPromise(
                    token.id,
                    'fight_startareaarena',
                    { targetId },
                    10000
                  )
                  message.info(`[序号${tokenIndex}] ${token.name || token.id} - 竞技场战斗${i}完成`)
                } else {
                  message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 竞技场战斗${i} - 未找到目标`)
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键竞技场',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、一键竞技场成功`
              })
            } catch (error) {
              console.error(`一键竞技场失败：${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键竞技场',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、一键竞技场失败`
              })
            }
          }
          
          if (scheduledTasks.value.store_purchase) {
            try {
              // 黑市采购
              await tokenStore.sendMessageWithPromise(
                token.id,
                'store_purchase',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键黑市采购',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、黑市采购成功`
              })
            } catch (error) {
              console.error(`黑市采购失败: ${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键黑市采购',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、黑市采购失败`
              })
            }
          }
          
          if (scheduledTasks.value.legion_boss) {
            try {
              // 一键俱乐部 BOSS
              await tokenStore.sendMessageWithPromise(
                token.id,
                'fight_startlegionboss',
                {},
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键俱乐部 BOSS',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、一键俱乐部 BOSS 成功`
              })
            } catch (error) {
              console.error(`一键俱乐部 BOSS 失败：${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键俱乐部 BOSS',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、一键俱乐部 BOSS 失败`
              })
            }
          }
          
          if (scheduledTasks.value.freeGift) {
            let signinSuccess = false
            let discountSuccess = false
            let signinMsg = ''
            let discountMsg = ''
            
            try {
              // 一键每日免费礼包：先签到，再领取折扣奖励
              // 签到失败不影响后续领取折扣奖励
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'system_signinreward',
                  {},
                  5000
                )
                signinSuccess = true
                signinMsg = '签到成功'
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 每日签到成功`)
              } catch (signinError) {
                // 签到失败（如已签到），记录日志但继续执行
                signinMsg = `签到跳过：${signinError.message}`
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 每日签到跳过：${signinError.message}`)
              }
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // 领取折扣奖励
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'discount_claimreward',
                  { discountId: 1 },
                  5000
                )
                discountSuccess = true
                discountMsg = '领取成功'
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 免费礼包领取成功`)
              } catch (discountError) {
                // 领取失败，记录日志但继续执行其他操作
                discountMsg = `领取失败：${discountError.message}`
                message.warning(`[序号${tokenIndex}] ${token.name || token.id} - 免费礼包领取失败：${discountError.message}，继续执行其他操作`)
              }
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // 根据执行结果记录日志
              const status = signinSuccess || discountSuccess ? 'success' : 'warning'
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键每日免费礼包',
                tokenId: token.id,
                tokenName: token.name,
                status: status,
                message: `${tokenIndex}、${token.name || token.id}、一键每日免费礼包完成（${signinMsg}；${discountMsg}）`
              })
            } catch (error) {
              console.error(`一键每日免费礼包执行异常：${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键每日免费礼包',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、一键每日免费礼包执行异常：${error.message}`
              })
            }
          }
          
          if (scheduledTasks.value.dailyBoss) {
            try {
              // 一键每日咸王：根据星期几获取今日 BOSS ID，挑战 3 次
              const todayBossId = getTodayBossId()
              message.info(`[序号${tokenIndex}] ${token.name || token.id} - 今日咸王 BOSS ID: ${todayBossId}`)
              
              for (let i = 0; i < 3; i++) {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'fight_startboss',
                  { bossId: todayBossId },
                  12000
                )
                message.info(`[序号${tokenIndex}] ${token.name || token.id} - 咸王挑战 ${i + 1}/3 完成`)
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
              
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键每日咸王',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、一键每日咸王成功（今日 BOSS: ${todayBossId}，挑战 3 次）`
              })
            } catch (error) {
              console.error(`一键每日咸王失败：${error.message}`, error)
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '一键每日咸王',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `${tokenIndex}、${token.name || token.id}、一键每日咸王失败`
              })
            }
          }
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 定时任务执行完成`)
          
          // 添加成功日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '执行定时任务',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、定时任务执行完成`
          })
          
          return { success: true, tokenId: token.id }
        } catch (error) {
          console.error(`执行定时任务失败: ${error.message}`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 定时任务执行失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '执行定时任务',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${tokenIndex}、${token.name || token.id}、定时任务执行失败: ${error.message}`
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

// 批量黑市周
const handleBatchBlackMarket = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = connectionPool.parseTokenRange(scheduledExecutionTokens.value)
  const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  const rangeText = scheduledExecutionTokens.value ? `范围${scheduledExecutionTokens.value}` : "全部"
  message.info(`开始批量黑市周（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  isBatchBlackMarketRunning.value = true
  
  try {
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = getTokenIndex(token)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始批量黑市周...`)
          
          let diamondCount = 0
          let goldenRodCount = 0
          
          try {
            const roleInfo = await tokenStore.sendMessageWithPromise(
              token.id,
              'role_getroleinfo',
              {},
              5000
            )
            
            if (roleInfo && roleInfo.role) {
              diamondCount = roleInfo.role.diamond || 0
              const items = roleInfo.role.items || roleInfo.role.itemList || roleInfo.role.bag?.items || roleInfo.role.inventory || []
              
              if (Array.isArray(items)) {
                const goldenRodItem = items.find(i => Number(i.id ?? i.itemId) === 1012)
                if (goldenRodItem) {
                  goldenRodCount = Number(goldenRodItem.num ?? goldenRodItem.count ?? goldenRodItem.quantity ?? 0)
                }
              } else if (typeof items === 'object' && items !== null) {
                const goldenRodItem = items['1012'] || items[1012]
                if (goldenRodItem) {
                  goldenRodCount = typeof goldenRodItem === 'number' ? goldenRodItem : Number(goldenRodItem.quantity ?? goldenRodItem.num ?? goldenRodItem.count ?? 0)
                }
              }
              
              message.info(`[序号${tokenIndex}] ${token.name || token.id} 金砖: ${diamondCount}, 金竿: ${goldenRodCount}`)
              
              // 添加获取角色信息成功日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '批量黑市周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `${tokenIndex}、${token.name || token.id}、获取角色信息成功（金砖: ${diamondCount}, 金竿: ${goldenRodCount}）`
              })
            }
          } catch (error) {
            console.error(`获取角色信息失败: ${error.message}`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取角色信息失败，继续执行`)
            
            // 添加获取角色信息失败日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '批量黑市周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `${tokenIndex}、${token.name || token.id}、获取角色信息失败，继续执行`
            })
          }
          
          try {
            await tokenStore.sendMessageWithPromise(
              token.id,
              'activity_buystoregoods',
              { activityId: 9, goodsIndex: 4, buyNum: 1 },
              5000
            )
            await new Promise(resolve => setTimeout(resolve, 500))
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 购买宝箱成功`)
            
            // 添加购买宝箱成功日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '批量黑市周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `${tokenIndex}、${token.name || token.id}、购买宝箱成功`
            })
          } catch (error) {
            console.error(`购买宝箱失败: ${error.message}`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 购买宝箱失败，继续执行`)
            
            // 添加购买宝箱失败日志
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '批量黑市周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `${tokenIndex}、${token.name || token.id}、购买宝箱失败，继续执行`
            })
          }
          
          if (goldenRodCount < 900) {
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'activity_buystoregoods',
                { activityId: 9, goodsIndex: 6, buyNum: 1 },
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              message.info(`[序号${tokenIndex}] ${token.name || token.id} 购买金竿成功`)
              
              // 添加购买金竿成功日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '批量黑市周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、购买金竿成功`
              })
            } catch (error) {
              console.error(`购买金竿失败: ${error.message}`, error)
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} 购买金竿失败，继续执行`)
              
              // 添加购买金竿失败日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '批量黑市周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `${tokenIndex}、${token.name || token.id}、购买金竿失败，继续执行`
              })
            }
          }
          
          if (diamondCount > 300000) {
            try {
              await tokenStore.sendMessageWithPromise(
                token.id,
                'activity_buystoregoods',
                { activityId: 9, goodsIndex: 8, buyNum: 1 },
                5000
              )
              await new Promise(resolve => setTimeout(resolve, 500))
              message.info(`[序号${tokenIndex}] ${token.name || token.id} 购买灵贝成功`)
              
              // 添加购买灵贝成功日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '批量黑市周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `${tokenIndex}、${token.name || token.id}、购买灵贝成功`
              })
            } catch (error) {
              console.error(`购买灵贝失败: ${error.message}`, error)
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} 购买灵贝失败，继续执行`)
              
              // 添加购买灵贝失败日志
              logStore.addLog({
                page: 'fish-helper',
                cardType: '定时任务',
                operation: '批量黑市周',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `${tokenIndex}、${token.name || token.id}、购买灵贝失败，继续执行`
              })
            }
          }
          
          // 添加批量黑市周完成日志
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '批量黑市周',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、批量黑市周执行完成（金砖: ${diamondCount}, 金竿: ${goldenRodCount}）`
          })
          
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 批量黑市周执行完成`)
          return { success: true, tokenId: token.id }
        } catch (error) {
          console.error(`批量黑市周失败: ${error.message}`, error)
          message.error(`[序号${globalIndex + 1}] ${token.name || token.id} 批量黑市周执行失败: ${error.message}`)
          const tokenIndex = getTokenIndex(token)
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '批量黑市周',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${tokenIndex}、${token.name || token.id}、批量黑市周执行失败: ${error.message}`
          })
          return { success: false, tokenId: token.id, error: error.message }
        }
      },
      {
        batchSize: 5,
        delayBetweenBatches: 1000
      }
    )
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    message.success(`批量黑市周执行完成：成功 ${successCount} 个，失败 ${failureCount} 个`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '批量黑市周',
      status: 'success',
      message: `批量黑市周执行完成：成功 ${successCount} 个，失败 ${failureCount} 个`
    })
  } catch (error) {
    console.error('批量黑市周失败:', error)
    message.error(`批量黑市周失败: ${error.message}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '批量黑市周',
      status: 'error',
      message: `批量黑市周失败: ${error.message}`
    })
  } finally {
    isBatchBlackMarketRunning.value = false
  }
}

// 批量招募周
const handleBatchRecruitWeek = async () => {
  try {
    isBatchRecruitWeekRunning.value = true
    message.info('开始批量招募周...')
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '批量招募周',
      status: 'info',
      message: '开始批量招募周'
    })

    // 按 token 昵称排序的 token 列表
    const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
      const nameA = (a.name || '未命名').toLowerCase()
      const nameB = (b.name || '未命名').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    if (sortedTokensList.length === 0) {
      message.warning('没有可用的 Token')
      return
    }
    
    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(scheduledExecutionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokensList, tokenIndices)
    
    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${scheduledExecutionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到 Token`)
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${scheduledExecutionTokens.value}`
    message.info(`开始批量招募周，共 ${targetTokens.length} 个 Token（${rangeText}）`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '批量招募周',
      status: 'info',
      message: `开始批量招募周，共 ${targetTokens.length} 个 Token（${rangeText}）`
    })

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在获取活动详情...`)
          
          // 1. 使用 activity_get 获取已用招募令数量 X
          let usedRecruitCount = 0
          try {
            const activityInfo = await tokenStore.sendMessageWithPromise(
              token.id,
              'activity_get',
              { actId: RECRUIT_WEEK_ACTIVITY_ID },
              5000
            )
            
            // 从 myTotalInfo[1].num 获取已用招募令数量
            if (activityInfo?.body?.myTotalInfo?.['1']?.num !== undefined) {
              usedRecruitCount = activityInfo.body.myTotalInfo['1'].num
            }
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 已用招募令数量：${usedRecruitCount}`)
          } catch (error) {
            console.error(`获取活动详情失败：${error.message}`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取活动详情失败，继续执行`)
          }
          
          // 2. 使用 role_getroleinfo 获取现有招募令数量 Y
          let currentRecruitCount = 0
          try {
            const roleInfo = await tokenStore.sendMessageWithPromise(
              token.id,
              'role_getroleinfo',
              {},
              5000
            )
            
            const items = roleInfo?.role?.items || {}
            if (items['1001']) {
              currentRecruitCount = items['1001'].quantity || items['1001'].num || 0
            }
            
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 现有招募令数量：${currentRecruitCount}`)
          } catch (error) {
            console.error(`获取角色信息失败：${error.message}`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 获取角色信息失败，继续执行`)
          }
          
          // 3. 计算总招募令数量 Z = (X * 0.8 + Y) 取整
          const totalRecruitCount = Math.floor(usedRecruitCount * 0.8 + currentRecruitCount)
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 总招募令数量：${totalRecruitCount} (公式：${usedRecruitCount} * 0.8 + ${currentRecruitCount})`)
          
          // 4. 计算招募周轮数（每轮需要 400 个招募令）
          const maxRounds = Math.floor(totalRecruitCount / 400)
          
          if (maxRounds === 0) {
            message.warning(`[序号${tokenIndex}] ${token.name || token.id} 招募令数量不足，无法完成一轮招募周（需要 400 个）`)
            logStore.addLog({
              page: 'fish-helper',
              cardType: '定时任务',
              operation: '批量招募周',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `${tokenIndex}、${token.name || token.id}、招募令数量不足，无法完成一轮招募周`
            })
            return { success: false, reason: 'insufficient_recruits' }
          }
          
          message.info(`[序号${tokenIndex}] ${token.name || token.id} 计划执行 ${maxRounds} 轮招募周`)
          
          // 5. 执行招募
          let completedRounds = 0
          let totalRecruits = 0
          let mailClaimCount = 0
          let remainingRecruits = currentRecruitCount
          
          for (let round = 0; round < maxRounds; round++) {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 开始第 ${round + 1} 轮招募周`)
            
            // 每轮招募 400 次
            for (let recruit = 0; recruit < 400; recruit += 10) {
              try {
                await tokenStore.sendMessageWithPromise(
                  token.id,
                  'hero_recruit',
                  {
                    recruitNumber: 10,
                    recruitType: 3,
                    byClub: false
                  },
                  5000
                )
                
                totalRecruits += 10
                remainingRecruits -= 10
                
                // 每 100 次招募领取一次邮件
                if (totalRecruits % 100 === 0) {
                  try {
                    await tokenStore.sendMessageWithPromise(
                      token.id,
                      'mail_claimallattachment',
                      {},
                      5000
                    )
                    mailClaimCount++
                    message.success(`[序号${tokenIndex}] ${token.name || token.id} 领取邮件附件成功（第${mailClaimCount}次）`)
                  } catch (mailError) {
                    console.error(`领取邮件失败：${mailError.message}`, mailError)
                  }
                }
                
                await new Promise(resolve => setTimeout(resolve, 200))
              } catch (recruitError) {
                console.error(`招募失败：${recruitError.message}`, recruitError)
                message.error(`[序号${tokenIndex}] ${token.name || token.id} 招募失败：${recruitError.message}`)
                break
              }
            }
            
            // 每轮完成后领取 40 个招募令奖励
            completedRounds++
            remainingRecruits += 40
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 完成第 ${completedRounds} 轮招募周，获得 40 招募令奖励`)
            
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          const successMsg = `${token.name || token.id} 招募周完成，计划${maxRounds}轮，完成${completedRounds}轮，共招募${totalRecruits}个，领取邮件${mailClaimCount}次，剩余招募令${remainingRecruits}个`
          message.success(successMsg)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '批量招募周',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `${tokenIndex}、${token.name || token.id}、${successMsg}`
          })
          
          return { 
            success: true, 
            plannedRounds: maxRounds,
            completedRounds, 
            totalRecruits, 
            mailClaimCount,
            remainingRecruits
          }
        } catch (error) {
          console.error(`招募周失败：${error.message}`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 招募周失败：${error.message}`)
          
          logStore.addLog({
            page: 'fish-helper',
            cardType: '定时任务',
            operation: '批量招募周',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${globalIndex + 1}、${token.name || token.id}、招募周失败：${error.message}`
          })
          
          return { success: false, error: error.message }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        keepConnections: false,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
          } else if (progress.type === 'token-start') {
            message.info(`[${progress.globalIndex}/${progress.totalTokens}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`[${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`[${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 统计结果
    const totalTokens = results.length
    const successCount = results.filter(r => r.success).length
    const failureCount = totalTokens - successCount
    const totalCompletedRounds = results.reduce((sum, r) => sum + (r.completedRounds || 0), 0)
    const totalRecruits = results.reduce((sum, r) => sum + (r.totalRecruits || 0), 0)
    const totalMailClaims = results.reduce((sum, r) => sum + (r.mailClaimCount || 0), 0)
    
    let summaryMessage = `批量招募周完成，共处理${totalTokens}个 Token，成功${successCount}个，失败${failureCount}个`
    if (totalCompletedRounds > 0) {
      summaryMessage += `，共完成${totalCompletedRounds}轮`
    }
    if (totalRecruits > 0) {
      summaryMessage += `，共招募${totalRecruits}个`
    }
    if (totalMailClaims > 0) {
      summaryMessage += `，领取邮件${totalMailClaims}次`
    }
    
    message.success(summaryMessage)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '批量招募周',
      status: 'success',
      message: summaryMessage
    })
  } catch (error) {
    console.error('批量招募周失败:', error)
    message.error(`批量招募周失败：${error.message}`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '定时任务',
      operation: '批量招募周',
      status: 'error',
      message: `批量招募周失败：${error.message}`
    })
  } finally {
    isBatchRecruitWeekRunning.value = false
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
