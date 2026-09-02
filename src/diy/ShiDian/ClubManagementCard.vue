<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <People />
      </n-icon>
    </template>
    <template #title>
      <h3>俱乐部</h3>
    </template>
    <template #badge>
      <span>{{ hasClub ? '已加入' : '未加入' }}</span>
    </template>
    <template #default>
      <div class="club-management-content">
        <!-- 俱乐部功能显示 - 使用一个CustomizedCard容器容纳主要操作按钮 -->
        <CustomizedCard mode="container">
          <!-- 功法图鉴功能区域 -->
          <CustomizedCard mode="button" name="刷新图鉴信息" :disabled="!selectedTokenId || isRefreshLegacyInfoRunning" @button-click="handleRefreshLegacyInfo" />
          <CustomizedCard mode="button" name="激活功法图鉴" :disabled="!selectedTokenId || isLegacyBookRunning" @button-click="handleLegacyBook" />
          <CustomizedCard mode="button" :name="isExportLegacyDetailsRunning ? '导出中...' : '导出功法详情'" :disabled="isExportLegacyDetailsRunning || !selectedTokenId" @button-click="handleExportLegacyDetails" />
          <CustomizedCard mode="button-count" :name="isGetFragmentCountRunning ? '获取中...' : '残卷数量'" :count="currentFragmentCount !== null ? `${(currentFragmentCount / 10000).toFixed(2)}万` : '0.00万'" :disabled="isGetFragmentCountRunning || !hasConnectedToken" @button-click="handleGetFragmentCount" />
          
          <!-- 俱乐部基本功能按钮 -->
          <CustomizedCard 
            mode="button" 
            name="获取俱乐部成员信息" 
            :disabled="isRunning || !hasConnectedToken"
            @button-click="batchFetchClubInfo"
          />
          <CustomizedCard 
            mode="button-number-input" 
            name="加入俱乐部" 
            v-model:inputValue="legionId" 
            placeholder="输入俱乐部 ID" 
            @update:inputValue="handleLegionIdInput" 
            @button-click="joinLegion" 
            :disabled="!legionId"
          />
        </CustomizedCard>
        
        <!-- 新增容器：执行范围及批量操作 -->
        <CustomizedCard mode="container">
          <CustomizedCard mode="execution-range" name="执行范围" v-model:inputValue="legionTokens" placeholder="留空执行全部，或输入 1-20 或 1,2,3" @update:inputValue="handleLegionTokensInput" />
          <CustomizedCard 
            mode="button" 
            :name="isExportClubInfoRunning ? '导出中...' : '导出俱乐部信息'" 
            :disabled="isExportClubInfoRunning"
            @button-click="handleExportClubInfo"
          />
          <CustomizedCard 
            mode="button-number-input" 
            :name="isLegacyClaimGiftRunning ? '批量赠送中...' : '批量赠送功法'" 
            v-model:inputValue="legacyTargetId" 
            placeholder="输入赠送目标ID" 
            @button-click="handleBatchLegacyClaimGift" 
            :disabled="isLegacyClaimGiftRunning"
          />
          <CustomizedCard 
            mode="button" 
            :name="isAcceptGiftRunning ? '批量加入中...' : '批量加入俱乐部'" 
            :disabled="isAcceptGiftRunning"
            @button-click="joinLegion"
          />
          <CustomizedCard mode="button" :name="isBatchLegacyBookRunning ? '批量功法图鉴中...' : '批量功法图鉴'" :disabled="isBatchLegacyBookRunning" @button-click="handleBatchLegacyBook" />
          <CustomizedCard mode="button" :name="isBatchLegacyBeginHangupRunning ? '批量开启功法挂机中...' : '批量开启功法挂机'" :disabled="isBatchLegacyBeginHangupRunning" @button-click="handleBatchLegacyBeginHangup" />
          <CustomizedCard 
            mode="button-number-input" 
            name="一键送功法" 
            v-model:inputValue="quickSendLegacyTargetId" 
            placeholder="输入接收目标ID" 
            @update:inputValue="handleQuickSendLegacyTargetIdInput" 
            @button-click="handleQuickSendLegacy" 
            :disabled="!quickSendLegacyTargetId || isQuickSendLegacyRunning"
          />
          <CustomizedCard 
            mode="button-number-input" 
            name="送功法次数" 
            v-model:inputValue="quickSendLegacyCount" 
            placeholder="输入次数" 
            @update:inputValue="handleQuickSendLegacyCountInput" 
          />
          <CustomizedCard mode="button" :name="isBatchCollectPrivilegeRunning ? '批量收集特权中...' : '批量收集特权'" :disabled="isBatchCollectPrivilegeRunning" @button-click="handleBatchCollectPrivilege" />
          <CustomizedCard mode="button" :name="isQuickAcceptGiftRunning ? '一键接受礼物中...' : '一键接受礼物'" :disabled="isQuickAcceptGiftRunning" @button-click="handleQuickAcceptGift" />
          <CustomizedCard mode="button" :name="isBatchPetEggRunning ? '批量宠物蛋中...' : '批量宠物蛋'" :disabled="isBatchPetEggRunning" @button-click="handleBatchPetEgg" />
          <CustomizedCard mode="button" :name="isBatchPetBookRunning ? '批量宠物图鉴中...' : '批量宠物图鉴'" :disabled="isBatchPetBookRunning" @button-click="handleBatchPetBook" />
          <CustomizedCard 
            mode="button-number-input" 
            :name="isCampSignupRunning ? '篝火营地报名中...' : '篝火营地报名'" 
            v-model:inputValue="campSignupRange" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            :disabled="isCampSignupRunning" 
            @button-click="handleCampSignup" 
          />
          <CustomizedCard mode="button" :name="isCampFightRunning ? '篝火营地上阵中...' : '篝火营地上阵'" :disabled="isCampFightRunning" @button-click="handleCampFight" />
          <CustomizedCard 
            mode="button-with-select" 
            :buttonText="isCampBattleRunning ? '篝火营地战斗中...' : '篝火营地战斗'" 
            :selectValue="campFightType"
            :selectOptions="[
              { label: '空投', value: 'monster' },
              { label: '战力', value: 'power' },
              { label: '清除缓存', value: 'clear' }
            ]"
            :disabled="isCampBattleRunning"
            @button-click="handleCampBattle"
            @update:selectValue="campFightType = $event"
          />
          <CustomizedCard mode="button" :name="isGetLegionLeaderRunning ? '获取团长中...' : '获取俱乐部团长'" :disabled="isGetLegionLeaderRunning" @button-click="handleGetLegionLeader" />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="shidian" 
        card-type="俱乐部管理"
        :filter-operations="['批量赠送功法', '导出功法详情', '导出俱乐部信息', '刷新图鉴信息', '激活功法图鉴', '批量功法图鉴', '加入俱乐部', '批量招募周', '批量开启功法挂机', '批量收集特权', '一键接受礼物', '批量宠物蛋', '批量宠物图鉴', '一键送功法', '一键领取', '批量功法挂机', '批量收集功法', '接受礼物', '批量接受礼物', '图鉴', '获取残卷数量', '篝火营地报名', '篝火营地上阵', '获取俱乐部团长']"
      />
    </template>
  </MyCard>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onBeforeUnmount, inject, watch } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { logOperation } from '@/utils/operationLogger'
import ConnectionPoolManager from '@/utils/connectionPoolManager.js'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/ShiDian/OperationLogCard.vue'
import { People } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()

// 注入执行间隔
const commandDelay = inject('commandDelay', ref(600))

// 辅助函数：等待执行间隔
const waitCommandDelay = () => new Promise(resolve => setTimeout(resolve, commandDelay.value))

const legionTokens = ref(localStorage.getItem('clubLegionTokens') || '')
const exportClubInfoTokens = ref('')
const legionId = ref('')
const legacyTargetId = ref(localStorage.getItem('legacyTargetId') || '111582820') // 默认赠送目标

// 监听赠送目标ID变化，持久化保存
watch(legacyTargetId, (newValue) => {
  localStorage.setItem('legacyTargetId', newValue)
})
const legacyPassword = ref('946215') // 默认密码
const quickSendLegacyTargetId = ref(localStorage.getItem('quickSendLegacyTargetId') || '') // 一键送功法目标ID
const quickSendLegacyCount = ref('10') // 一键送功法次数
const autoAcceptGiftTokenIndex = ref('13') // 一键领取的 Token 序号，默认 13
const campFightType = ref('power') // 篝火营地战斗类型：monster(空投) / power(战力) / clear(清除缓存)

// 对手战力缓存：从 localStorage 读取
const getDefenderPowerCache = () => {
  try {
    const cache = localStorage.getItem('defenderPowerCache')
    return cache ? JSON.parse(cache) : []
  } catch (e) {
    return []
  }
}

// 保存对手战力缓存到 localStorage
const saveDefenderPowerCache = (cache) => {
  try {
    // 按 legionId 和 power 排序
    cache.sort((a, b) => {
      if (a.legionId !== b.legionId) {
        return a.legionId.localeCompare(b.legionId)
      }
      return b.power - a.power
    })
    localStorage.setItem('defenderPowerCache', JSON.stringify(cache))
  } catch (e) {
    console.error('保存缓存失败:', e)
  }
}

// 清除对手战力缓存
const clearDefenderPowerCache = () => {
  localStorage.removeItem('defenderPowerCache')
  message.success('已清除对手战力缓存')
  logOperation('shidian', '篝火营地战斗', {
    cardType: '俱乐部管理',
    status: 'success',
    message: '已清除对手战力缓存'
  })
}

// 篝火营地战斗只在周2/周3/周4可执行
const isCampBattleDay = computed(() => {
  const dayOfWeek = new Date().getDay()
  return dayOfWeek >= 2 && dayOfWeek <= 4
})

const handleBatchCollectPrivilege = async () => {
  try {
    isBatchCollectPrivilegeRunning.value = true
    message.info('开始批量收集特权...')
    logOperation('shidian', '批量收集特权', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量收集特权...'
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量收集特权', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到${targetTokens.length}个Token（${rangeText}）`)
    logOperation('shidian', '批量收集特权', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `找到${targetTokens.length}个Token（${rangeText}）`
    })

    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const tokenIndex = globalIndex + 1

          try {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在收集特权...`)
            await tokenStore.sendLegacyClaimChargeReward(token.id, { id: 2 })
            logOperation('shidian', '批量收集特权', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `【序号${tokenIndex}】[${token.name || token.id}]收集特权成功`
            })
          } catch (error) {
            console.error(`[序号${tokenIndex}] ${token.name || token.id} 收集特权失败:`, error)
            logOperation('shidian', '批量收集特权', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `【序号${tokenIndex}】[${token.name || token.id}]收集特权失败，继续执行赠送流程`
            })
          }
          await waitCommandDelay()

          let legacyFragmentCount = 0
          try {
            const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
            legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
            console.info(`[序号${tokenIndex}] ${token.name || token.id} 当前功法残卷数量: ${legacyFragmentCount}`)
          } catch (error) {
            console.error(`[序号${tokenIndex}] ${token.name || token.id} 获取角色信息失败:`, error)
          }

          if (legacyFragmentCount < 100) {
            console.info(`[序号${tokenIndex}] ${token.name || token.id} 功法残卷数量(${legacyFragmentCount})小于100，跳过赠送`)
            logOperation('shidian', '批量收集特权', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]功法残卷数量(${legacyFragmentCount})小于100，跳过赠送`
            })
            return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount }
          }

          if (legacyFragmentCount > 0) {
            try {
              await tokenStore.sendRoleCommitPassword(token.id, {
                password: legacyPassword.value ? parseInt(legacyPassword.value) : 946215
              })
              console.info(`[序号${tokenIndex}] ${token.name || token.id} 提交密码成功`)
              await waitCommandDelay()
            } catch (error) {
              console.error(`[序号${tokenIndex}] ${token.name || token.id} 提交密码失败:`, error)
            }
            
            let totalSent = 0
            let currentFragmentCount = legacyFragmentCount
            
            // 第一次赠送前等待2秒
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            while (currentFragmentCount >= 9999 && isBatchCollectPrivilegeRunning.value) {
              try {
                const giftRes = await tokenStore.sendLegacySendGift(token.id, {
                  itemCnt: 9999,
                  targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820,
                  legacyUIds: []
                })
                
                if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
                  const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
                  console.error(`[序号${tokenIndex}] ${token.name || token.id} 赠送功法残卷失败: ${errorMsg}`)
                  logOperation('shidian', '批量收集特权', {
                    cardType: '俱乐部管理',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'error',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]赠送功法残卷失败: ${errorMsg}`
                  })
                  break
                } else {
                  totalSent += 9999
                  console.info(`[序号${tokenIndex}] ${token.name || token.id} 赠送功法残卷完成，已赠送 9999 个，累计 ${totalSent} 个`)
                  // 每次赠送后等待2秒
                  await new Promise(resolve => setTimeout(resolve, 2000))
                  
                  try {
                    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
                    currentFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
                    console.info(`[序号${tokenIndex}] ${token.name || token.id} 剩余功法残卷数量: ${currentFragmentCount}`)
                  } catch (error) {
                    console.error(`[序号${tokenIndex}] ${token.name || token.id} 获取角色信息失败:`, error)
                    break
                  }
                }
              } catch (error) {
                console.error(`[序号${tokenIndex}] ${token.name || token.id} 执行legacy_sendgift失败:`, error)
                logOperation('shidian', '批量收集特权', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'error',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]执行legacy_sendgift失败: ${error.message || error}`
                })
                break
              }
            }
            
            if (currentFragmentCount > 0 && currentFragmentCount < 9999 && isBatchCollectPrivilegeRunning.value) {
              try {
                const giftRes = await tokenStore.sendLegacySendGift(token.id, {
                  itemCnt: currentFragmentCount,
                  targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820,
                  legacyUIds: []
                })
                
                if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
                  const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
                  console.error(`[序号${tokenIndex}] ${token.name || token.id} 赠送功法残卷失败: ${errorMsg}`)
                  logOperation('shidian', '批量收集特权', {
                    cardType: '俱乐部管理',
                    tokenId: token.id,
                    tokenName: token.name,
                    status: 'error',
                    message: `【序号${tokenIndex}】[${token.name || token.id}]赠送功法残卷失败: ${errorMsg}`
                  })
                } else {
                  totalSent += currentFragmentCount
                  console.info(`[序号${tokenIndex}] ${token.name || token.id} 赠送功法残卷完成，赠送余数 ${currentFragmentCount} 个，累计 ${totalSent} 个`)
                }
              } catch (error) {
                console.error(`[序号${tokenIndex}] ${token.name || token.id} 执行legacy_sendgift失败:`, error)
                logOperation('shidian', '批量收集特权', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'error',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]执行legacy_sendgift失败: ${error.message || error}`
                })
              }
            }
            
            if (totalSent > 0) {
              logOperation('shidian', '批量收集特权', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `【序号${tokenIndex}】[${token.name || token.id}]赠送功法残卷完成，共赠送 ${totalSent} 个`
              })
              return { collected: true, sentGift: true, fragmentCount: legacyFragmentCount, sendCount: totalSent }
            } else {
              return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount }
            }
          } else {
            console.info(`[序号${tokenIndex}] ${token.name || token.id} 功法残卷数量为0，跳过`)
            logOperation('shidian', '批量收集特权', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]功法残卷数量为0，跳过`
            })
            return { collected: true, sentGift: false, fragmentCount: 0 }
          }
        } catch (error) {
          console.error(`[序号${globalIndex + 1}] ${token.name || token.id} 处理失败:`, error)
          logOperation('shidian', '批量收集特权', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${globalIndex + 1}】[${token.name || token.id}]处理失败: ${error.message || error}`
          })
          return { collected: false, sentGift: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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

    const successCount = results.filter(r => r.sentGift).length
    const skipCount = results.filter(r => !r.sentGift && r.fragmentCount < 100).length
    const errorCount = results.filter(r => r.error).length
    
    message.success(`批量收集特权完成，共处理${targetTokens.length}个Token，赠送成功${successCount}个，跳过${skipCount}个，失败${errorCount}个`)
    logOperation('shidian', '批量收集特权', {
      cardType: '俱乐部管理',
      status: 'success',
      message: `【批量】批量收集特权完成，共处理${targetTokens.length}个Token，赠送成功${successCount}个，跳过${skipCount}个，失败${errorCount}个`
    })
  } catch (error) {
    console.error('批量收集特权失败:', error)
    message.error(`批量收集特权失败：${error.message || error}`)
    logOperation('shidian', '批量收集特权', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量收集特权失败：${error.message || error}`
    })
  } finally {
    isBatchCollectPrivilegeRunning.value = false
  }
}

// 批量宠物蛋
const handleBatchPetEgg = async () => {
  try {
    isBatchPetEggRunning.value = true
    message.info('开始批量宠物蛋...')
    logOperation('shidian', '批量宠物蛋', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量宠物蛋...'
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量宠物蛋', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }

    for (const token of targetTokens) {
      if (!isBatchPetEggRunning.value) break

      const tokenIndex = getTokenIndex(token)
      message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在购买宠物蛋...`)
      logOperation('shidian', '批量宠物蛋', {
        cardType: '俱乐部管理',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `开始购买宠物蛋`
      })

      // 获取连接
      const connectionAcquired = await connectionPool.acquire(token.id)
      if (!connectionAcquired) {
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败`)
        logOperation('shidian', '批量宠物蛋', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: '连接失败，跳过'
        })
        failCount++
        continue
      }

      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} WebSocket未连接`)
        await connectionPool.release(token.id, false)
        logOperation('shidian', '批量宠物蛋', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'warning',
          message: 'WebSocket未连接，跳过'
        })
        failCount++
        continue
      }

      try {
        // 执行4次购买
        for (let i = 0; i < 4; i++) {
          try {
            await tokenStore.sendLegionStoreBuyGoods(token.id, { id: 205 })
            message.success(`[序号${tokenIndex}] ${token.name || token.id} 第 ${i + 1}/4 次购买宠物蛋成功`)
            logOperation('shidian', '批量宠物蛋', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `第 ${i + 1}/4 次购买成功`
            })
          } catch (buyError) {
            const errorMsg = buyError?.message || buyError || ''
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} 第 ${i + 1}/4 次购买失败:`, buyError)
            logOperation('shidian', '批量宠物蛋', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `第 ${i + 1}/4 次购买失败: ${errorMsg}`
            })
            // 如果是"物品不存在"错误，跳过其余次数
            if (errorMsg.includes('物品不存在')) {
              message.warning(`[序号${tokenIndex}] ${token.name || token.id} 物品不存在，跳过其余次数`)
              logOperation('shidian', '批量宠物蛋', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: '物品不存在，跳过其余次数'
              })
              break
            }
          }
          await waitCommandDelay()
        }

        message.success(`[序号${tokenIndex}] ${token.name || token.id} 宠物蛋完成`)
        logOperation('shidian', '批量宠物蛋', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]宠物蛋完成`
        })
        connectionPool.release(token.id, true)
      } catch (error) {
        message.error(`[序号${tokenIndex}] ${token.name || token.id} 宠物蛋失败: ${error.message || error}`)
        logOperation('shidian', '批量宠物蛋', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `宠物蛋失败: ${error.message || error}`
        })
        connectionPool.release(token.id, false)
      }
    }

    message.success('批量宠物蛋完成')
    logOperation('shidian', '批量宠物蛋', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量宠物蛋完成'
    })
  } catch (error) {
    message.error(`批量宠物蛋失败: ${error.message || error}`)
    logOperation('shidian', '批量宠物蛋', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量宠物蛋失败: ${error.message || error}`
    })
  } finally {
    isBatchPetEggRunning.value = false
  }
}

// 批量宠物图鉴
const handleBatchPetBook = async () => {
  try {
    isBatchPetBookRunning.value = true
    message.info('开始批量宠物图鉴...')
    logOperation('shidian', '批量宠物图鉴', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量宠物图鉴...'
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量宠物图鉴', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }

    for (const token of targetTokens) {
      if (!isBatchPetBookRunning.value) break

      const tokenIndex = getTokenIndex(token)
      message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在获取宠物信息...`)

      // 获取连接
      const connectionAcquired = await connectionPool.acquire(token.id)
      if (!connectionAcquired) {
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败`)
        failCount++
        continue
      }

      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.warning(`[序号${tokenIndex}] ${token.name || token.id} WebSocket未连接`)
        await connectionPool.release(token.id, false)
        failCount++
        continue
      }

      try {
        // 获取角色信息
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        const petData = roleInfo?.role?.petData

        if (!petData || !petData.books) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 未找到宠物图鉴数据`)
          await connectionPool.release(token.id, false)
          continue
        }

        // 找出所有未激活的图鉴（books值为0的）
        const unactivatedBooks = Object.entries(petData.books)
          .filter(([petId, status]) => status === 0)
          .map(([petId]) => parseInt(petId))

        if (unactivatedBooks.length === 0) {
          message.success(`[序号${tokenIndex}] ${token.name || token.id} 所有宠物图鉴已激活`)
          await connectionPool.release(token.id, true)
          continue
        }

        message.info(`[序号${tokenIndex}] ${token.name || token.id} 发现 ${unactivatedBooks.length} 个未激活图鉴: ${unactivatedBooks.join(', ')}`)

        // 依次执行激活和领取奖励
        for (const petId of unactivatedBooks) {
          if (!isBatchPetBookRunning.value) break

          try {
            // 激活图鉴
            await tokenStore.sendPetActivateBook(token.id, { petId })
            message.success(`[序号${tokenIndex}] ${token.name || token.id} 激活宠物图鉴 petId=${petId} 成功`)
            logOperation('shidian', '批量宠物图鉴', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `激活宠物图鉴 petId=${petId} 成功`
            })
          } catch (activateError) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} 激活宠物图鉴 petId=${petId} 失败:`, activateError)
            logOperation('shidian', '批量宠物图鉴', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `激活宠物图鉴 petId=${petId} 失败: ${activateError.message || activateError}`
            })
          }

          await waitCommandDelay()

          try {
            // 领取奖励
            await tokenStore.sendPetClaimBookReward(token.id, { petId })
            message.success(`[序号${tokenIndex}] ${token.name || token.id} 领取宠物图鉴奖励 petId=${petId} 成功`)
            logOperation('shidian', '批量宠物图鉴', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `领取宠物图鉴奖励 petId=${petId} 成功`
            })
          } catch (claimError) {
            console.warn(`[序号${tokenIndex}] ${token.name || token.id} 领取宠物图鉴奖励 petId=${petId} 失败:`, claimError)
            logOperation('shidian', '批量宠物图鉴', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `领取宠物图鉴奖励 petId=${petId} 失败: ${claimError.message || claimError}`
            })
          }

          await waitCommandDelay()
        }

        message.success(`[序号${tokenIndex}] ${token.name || token.id} 宠物图鉴完成`)
        logOperation('shidian', '批量宠物图鉴', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]宠物图鉴完成`
        })
        connectionPool.release(token.id, true)
      } catch (error) {
        message.error(`[序号${tokenIndex}] ${token.name || token.id} 宠物图鉴失败: ${error.message || error}`)
        logOperation('shidian', '批量宠物图鉴', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `宠物图鉴失败: ${error.message || error}`
        })
        connectionPool.release(token.id, false)
      }
    }

    message.success('批量宠物图鉴完成')
    logOperation('shidian', '批量宠物图鉴', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量宠物图鉴完成'
    })
  } catch (error) {
    message.error(`批量宠物图鉴失败: ${error.message || error}`)
    logOperation('shidian', '批量宠物图鉴', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量宠物图鉴失败: ${error.message || error}`
    })
  } finally {
    isBatchPetBookRunning.value = false
  }
}

// 篝火营地报名
const handleCampSignup = async () => {
  try {
    isCampSignupRunning.value = true
    message.info('开始篝火营地报名...')
    logOperation('shidian', '篝火营地报名', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始篝火营地报名...'
    })

    // 持久化保存输入范围
    localStorage.setItem('campSignupRange', campSignupRange.value)

    const tokenIndices = connectionPool.parseTokenRange(campSignupRange.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${campSignupRange.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '篝火营地报名', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }

    const rangeText = tokenIndices === null ? '全部' : `范围${campSignupRange.value}`
    message.info(`找到${targetTokens.length}个Token（${rangeText}）`)
    
    const successTokens = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = sortedTokens.value.findIndex(t => t.id === token.id) + 1
      
      try {
        const connected = await connectionPool.acquire(token.id)
        if (!connected) {
          logOperation('shidian', '篝火营地报名', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]连接失败，跳过`
          })
          continue
        }

        await tokenStore.sendClubSignup(token.id, {})
        successTokens.push(tokenIndex)
        
        logOperation('shidian', '篝火营地报名', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]篝火营地报名成功`
        })

        await connectionPool.release(token.id, true)
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 篝火营地报名失败:`, error)
        logOperation('shidian', '篝火营地报名', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]篝火营地报名失败: ${error.message || error}`
        })
        try {
          await connectionPool.release(token.id, true)
        } catch (e) {}
      }
      
      await waitCommandDelay()
    }

    // 汇总记录成功的token序号
    if (successTokens.length > 0) {
      logOperation('shidian', '篝火营地报名', {
        cardType: '俱乐部管理',
        status: 'success',
        message: `篝火营地报名完成，成功Token序号: ${successTokens.join(',')}（共${successTokens.length}个）`
      })
    }

    message.success(`篝火营地报名完成，成功${successTokens.length}/${targetTokens.length}个`)
  } catch (error) {
    console.error('篝火营地报名失败:', error)
    logOperation('shidian', '篝火营地报名', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `篝火营地报名失败: ${error.message || error}`
    })
  } finally {
    isCampSignupRunning.value = false
  }
}

// 篝火营地上阵
const handleCampFight = async () => {
  try {
    isCampFightRunning.value = true
    message.info('开始篝火营地上阵...')
    logOperation('shidian', '篝火营地上阵', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始篝火营地上阵...'
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '篝火营地上阵', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }

    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到${targetTokens.length}个Token（${rangeText}）`)
    
    const successTokens = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = sortedTokens.value.findIndex(t => t.id === token.id) + 1
      
      try {
        const connected = await connectionPool.acquire(token.id)
        if (!connected) {
          logOperation('shidian', '篝火营地上阵', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]连接失败，跳过`
          })
          continue
        }

        // 1. 执行fight_startlevel获取战斗数据
        const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
        const battleData = fightResult?.battleData?.leftTeam
        
        if (!battleData) {
          throw new Error('未获取到战斗数据')
        }

        // 2. 从battleData提取参数
        const team = battleData.team || {}
        const weaponId = battleData.weaponId
        const petUId = battleData.petUId

        // 3. 构建battleTeam参数 格式: {0: heroId, 1: heroId, ...}
        const battleTeam = {}
        for (let pos = 0; pos <= 4; pos++) {
          if (team[pos]) {
            battleTeam[pos] = team[pos].id
          }
        }

        // 4. 执行team_setteam
        await tokenStore.sendTeamSetTeam(token.id, {
          teamType: 16,
          battleTeam: battleTeam,
          lordWeaponId: weaponId,
          petUId: petUId,
          cCMonsterId: 0
        })

        successTokens.push(tokenIndex)
        
        logOperation('shidian', '篝火营地上阵', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]篝火营地上阵成功，队伍: ${JSON.stringify(battleTeam)}`
        })

        await connectionPool.release(token.id, true)
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 篝火营地上阵失败:`, error)
        logOperation('shidian', '篝火营地上阵', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]篝火营地上阵失败: ${error.message || error}`
        })
        try {
          await connectionPool.release(token.id, true)
        } catch (e) {}
      }
      
      await waitCommandDelay()
    }

    // 汇总记录成功的token序号
    if (successTokens.length > 0) {
      logOperation('shidian', '篝火营地上阵', {
        cardType: '俱乐部管理',
        status: 'success',
        message: `篝火营地上阵完成，成功Token序号: ${successTokens.join(',')}（共${successTokens.length}个）`
      })
    }

    message.success(`篝火营地上阵完成，成功${successTokens.length}/${targetTokens.length}个`)
  } catch (error) {
    console.error('篝火营地上阵失败:', error)
    logOperation('shidian', '篝火营地上阵', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `篝火营地上阵失败: ${error.message || error}`
    })
  } finally {
    isCampFightRunning.value = false
  }
}

// 篝火营地战斗
const handleCampBattle = async () => {
  // 清除缓存模式
  if (campFightType.value === 'clear') {
    clearDefenderPowerCache()
    campFightType.value = 'monster' // 重置为空投模式
    return
  }
  
  // 检查是否是周2/周3/周4
  if (!isCampBattleDay.value) {
    message.warning('篝火营地战斗只在周2/周3/周4可执行')
    logOperation('shidian', '篝火营地战斗', {
      cardType: '俱乐部管理',
      status: 'warning',
      message: '篝火营地战斗只在周2/周3/周4可执行'
    })
    return
  }
  
  // 从 localStorage 读取持久化缓存
  let defenderPowerCache = getDefenderPowerCache()
  
  try {
    isCampBattleRunning.value = true
    const fightTypeText = campFightType.value === 'monster' ? '空投' : '战力'
    message.info(`开始篝火营地战斗（${fightTypeText}）...`)
    logOperation('shidian', '篝火营地战斗', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `开始篝火营地战斗（${fightTypeText}）...`
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    
    if (targetTokens.length === 0) {
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '篝火营地战斗', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }

    message.info(`找到${targetTokens.length}个Token（${rangeText}）`)
    
    const successTokens = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = sortedTokens.value.findIndex(t => t.id === token.id) + 1
      
      logOperation('shidian', '篝火营地战斗', {
        cardType: '俱乐部管理',
        tokenId: token.id,
        tokenName: token.name,
        status: 'info',
        message: `【序号${tokenIndex}】[${token.name || token.id}]正在处理 (${i + 1}/${targetTokens.length})`
      })
      
      try {
        const connected = await connectionPool.acquire(token.id)
        if (!connected) {
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]连接失败，跳过`
          })
          continue
        }

        // 1. 执行fight_startlevel获取战斗数据
        const fightResult = await tokenStore.sendFightStartLevel(token.id, {})
        const battleData = fightResult?.battleData?.leftTeam
        
        if (!battleData) {
          throw new Error('未获取到战斗数据')
        }

        // 2. 从battleData提取参数
        const team = battleData.team || {}
        const weaponId = battleData.weaponId
        const petUId = battleData.petUId

        // 3. 构建battleTeam参数 格式: {0: heroId, 1: heroId, ...}
        const battleTeam = {}
        for (let pos = 0; pos <= 4; pos++) {
          if (team[pos]) {
            battleTeam[pos] = team[pos].id
          }
        }

        // 4. 根据选择的战斗类型执行不同命令
        if (campFightType.value === 'monster') {
          // 空投战斗，执行3次
          for (let fightCount = 1; fightCount <= 3; fightCount++) {
            await tokenStore.sendClubAttackMonster(token.id, {
              useItem: false,
              teamSetParams: {
                lordWeaponId: weaponId,
                petUId: petUId,
                battleTeam: battleTeam
              }
            })
            logOperation('shidian', '篝火营地战斗', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]空投战斗第${fightCount}/3次完成`
            })
            await waitCommandDelay()
          }
        } else {
          // 战力模式
          // 1. 切换阵容2（出错也继续）
          try {
            await tokenStore.sendPresetteamSaveTeam(token.id, { teamId: 2 })
            logOperation('shidian', '篝火营地战斗', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]已切换到阵容2`
            })
          } catch (e) {
            logOperation('shidian', '篝火营地战斗', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `【序号${tokenIndex}】[${token.name || token.id}]切换阵容2失败，继续执行`
            })
          }

          // 2. 获取当前战力
          const roleInfo = await tokenStore.sendMessageWithPromise(token.id, 'role_getroleinfo', {})
          const myPower = roleInfo?.role?.power || roleInfo?.power || 0
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]当前战力: ${myPower}`
          })

          // 3. 获取俱乐部信息
          await tokenStore.sendLegionGetInfo(token.id, {})

          // 4. 获取篝火营地信息
          const clubInfo = await tokenStore.sendClubGetInfo(token.id, {})
          const oppoMap = clubInfo?.club?.oppoMap
          if (!oppoMap) throw new Error('未获取到篝火营地对手信息')

          // 根据星期几获取对手: 只有周2、周3、周4
          const dayOfWeek = new Date().getDay()
          const dayToOppo = { 2: '2', 3: '3', 4: '4' }
          const oppoKey = dayToOppo[dayOfWeek]
          if (!oppoKey) {
            throw new Error(`今天星期${dayOfWeek}，篝火营地战力模式只在周2、周3、周4开放`)
          }
          const oppoData = oppoMap[oppoKey]
          if (!oppoData) throw new Error(`未找到星期${dayOfWeek}对应的对手(oppoKey=${oppoKey})`)

          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]对手俱乐部: ${oppoData.name}，星期${dayOfWeek}→oppoKey=${oppoKey}`
          })

          // 6. 提取defenders并获取每个targetId的战力（使用缓存）
          const legionId = oppoData.legionId
          
          const defenders = oppoData.defenders || {}
          const defenderList = []
          let cacheHitCount = 0
          
          for (const [nodeId, def] of Object.entries(defenders)) {
            const d = def
            try {
              let power
              let cachedChallengeCnt = d.challengeCnt || 0
              let cachedFailCnt = d.failCnt || 0
              
              // 检查缓存（按 legionId + roleId 查找）
              const cached = defenderPowerCache.find(c => c.legionId === legionId && c.roleId === d.roleId)
              if (cached) {
                power = cached.power
                cacheHitCount++
                // 使用 club_getinfo 返回的最新 challengeCnt 和 failCnt 更新缓存
                cached.challengeCnt = cachedChallengeCnt
                cached.failCnt = cachedFailCnt
              } else {
                // 缓存未命中，调用API获取战力
                const teamInfo = await tokenStore.sendClubGetTargetTeam(token.id, { targetId: d.roleId })
                power = teamInfo?.roleBattleTeam?.role?.power || 0
                // 存入缓存
                defenderPowerCache.push({
                  legionId: legionId,
                  roleId: d.roleId,
                  power: power,
                  challengeCnt: cachedChallengeCnt,
                  failCnt: cachedFailCnt
                })
                await waitCommandDelay()
              }
              
              defenderList.push({
                nodeId: parseInt(nodeId),
                targetId: d.roleId,
                challengeCnt: cachedChallengeCnt,
                failCnt: cachedFailCnt,
                power: power,
                name: d.name || ''
              })
            } catch (e) {
              logOperation('shidian', '篝火营地战斗', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'warning',
                message: `【序号${tokenIndex}】[${token.name || token.id}]获取对手${d.roleId}战力失败，跳过`
              })
            }
          }
          
          // 保存缓存到 localStorage
          saveDefenderPowerCache(defenderPowerCache)
          
          if (cacheHitCount > 0) {
            logOperation('shidian', '篝火营地战斗', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]对手战力缓存命中${cacheHitCount}次，已更新challengeCnt和failCnt`
            })
          }

          // 按战力从大到小排序
          defenderList.sort((a, b) => b.power - a.power)
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]获取到${defenderList.length}个对手，按战力排序完成`
          })

          // 7. 执行fight_startlevel获取当前阵容
          const fightResult2 = await tokenStore.sendFightStartLevel(token.id, {})
          const battleData2 = fightResult2?.battleData?.leftTeam
          if (!battleData2) {
            throw new Error('未获取到战斗数据')
          }
          const team2 = battleData2.team || {}
          const weaponId2 = battleData2.weaponId
          const petUId2 = battleData2.petUId
          const battleTeam2 = {}
          for (let pos = 0; pos <= 4; pos++) {
            if (team2[pos]) {
              battleTeam2[pos] = team2[pos].id
            }
          }
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]获取当前阵容完成`
          })

          // 8. 筛选对手：分两组，共7个
          const filterTargets = () => {
            // 第一组：challengeCnt<5 且 power<当前战力*1.5，取failCnt最小的前2个
            const group1 = defenderList
              .filter(d => d.challengeCnt < 5 && d.power < myPower * 1.5)
              .sort((a, b) => a.failCnt - b.failCnt)
              .slice(0, 2)
            
            // 第二组：challengeCnt<5 且 power<当前战力*1.3，取failCnt最小的前7个
            const group2 = defenderList
              .filter(d => d.challengeCnt < 5 && d.power < myPower * 1.3)
              .sort((a, b) => a.failCnt - b.failCnt)
              .slice(0, 7)
            
            // 合并两组（去重），取前7个
            const combined = [...group1]
            for (const d of group2) {
              if (!combined.find(c => c.nodeId === d.nodeId)) {
                combined.push(d)
              }
            }
            return combined.slice(0, 7)
          }
          
          let targets = filterTargets()
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]筛选出${targets.length}个可挑战对手（challengeCnt<5且战力<${myPower * 1.2}，最多7个）`
          })

          // 9. 循环挑战，直到执行7次或收到"今日成功挑战次数已用完"提示
          let challengeCount = 0
          const maxChallenges = 7
          
          while (challengeCount < maxChallenges) {
            // 如果没有可挑战的对手，重新获取 club_getinfo 更新缓存
            if (targets.length === 0) {
              logOperation('shidian', '篝火营地战斗', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]无可挑战对手，重新获取 club_getinfo 更新缓存`
              })
              
              try {
                const clubInfo2 = await tokenStore.sendClubGetInfo(token.id, {})
                const oppoMap2 = clubInfo2?.club?.oppoMap
                if (oppoMap2) {
                  const dayOfWeek = new Date().getDay()
                  const dayToOppo = { 2: '2', 3: '3', 4: '4' }
                  const oppoKey = dayToOppo[dayOfWeek]
                  const oppoData2 = oppoMap2[oppoKey]
                  
                  if (oppoData2) {
                    const defenders2 = oppoData2.defenders || {}
                    // 更新缓存中的 challengeCnt 和 failCnt
                    for (const [nodeId, def] of Object.entries(defenders2)) {
                      const cached = defenderPowerCache.find(c => c.legionId === legionId && c.roleId === def.roleId)
                      if (cached) {
                        cached.challengeCnt = def.challengeCnt || 0
                        cached.failCnt = def.failCnt || 0
                      }
                      // 同时更新 defenderList
                      const defInList = defenderList.find(d => d.roleId === def.roleId)
                      if (defInList) {
                        defInList.challengeCnt = def.challengeCnt || 0
                        defInList.failCnt = def.failCnt || 0
                      }
                    }
                    saveDefenderPowerCache(defenderPowerCache)
                    logOperation('shidian', '篝火营地战斗', {
                      cardType: '俱乐部管理',
                      tokenId: token.id,
                      tokenName: token.name,
                      status: 'info',
                      message: `【序号${tokenIndex}】[${token.name || token.id}]已更新缓存中的 challengeCnt 和 failCnt`
                    })
                  }
                }
              } catch (e) {
                logOperation('shidian', '篝火营地战斗', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]重新获取 club_getinfo 失败: ${e.message || e}`
                })
              }
              
              // 重新筛选
              targets = filterTargets()
              if (targets.length === 0) {
                logOperation('shidian', '篝火营地战斗', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'info',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]更新缓存后仍无可挑战对手，停止挑战`
                })
                break
              }
            }
            
            // 挑战第一个对手
            const target = targets[0]
            try {
              const attackResult = await tokenStore.sendClubAttack(token.id, {
                nodeId: target.nodeId,
                targetId: target.targetId,
                challengeCnt: target.challengeCnt,
                failCnt: target.failCnt,
                useItem: false,
                teamSetParams: {
                  lordWeaponId: weaponId2,
                  petUId: petUId2,
                  battleTeam: battleTeam2
                }
              })
              
              challengeCount++
              
              // 检查是否收到"今日成功挑战次数已用完"提示
              const resultStr = JSON.stringify(attackResult || {})
              if (resultStr.includes('今日成功挑战次数已用完') || resultStr.includes('请明日再来')) {
                logOperation('shidian', '篝火营地战斗', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]收到提示"今日成功挑战次数已用完，请明日再来"，停止挑战`
                })
                break
              }
              
              // 检查是否挑战失败（结果包含failCnt）
              if (resultStr.includes('failCnt')) {
                logOperation('shidian', '篝火营地战斗', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'warning',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]挑战${target.name}(nodeId=${target.nodeId})失败，failCnt=${target.failCnt} (${challengeCount}/${maxChallenges})`
                })
              } else {
                logOperation('shidian', '篝火营地战斗', {
                  cardType: '俱乐部管理',
                  tokenId: token.id,
                  tokenName: token.name,
                  status: 'success',
                  message: `【序号${tokenIndex}】[${token.name || token.id}]挑战${target.name}(nodeId=${target.nodeId})成功 (${challengeCount}/${maxChallenges})`
                })
              }
              
              // 更新该对手的 challengeCnt
              target.challengeCnt++
              const cached = defenderPowerCache.find(c => c.legionId === legionId && c.roleId === target.targetId)
              if (cached) {
                cached.challengeCnt = target.challengeCnt
              }
              saveDefenderPowerCache(defenderPowerCache)
              
            } catch (e) {
              logOperation('shidian', '篝火营地战斗', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `【序号${tokenIndex}】[${token.name || token.id}]挑战${target.name}异常: ${e.message || e}，继续挑战下一个`
              })
              // 挑战出错继续执行，不 break
              // 移除该对手，尝试下一个
              targets.shift()
              continue
            }
            
            await waitCommandDelay()
            
            // 重新筛选（因为 challengeCnt 已更新）
            targets = filterTargets()
          }
          
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]挑战完成，共执行${challengeCount}次`
          })

          // 执行3次空投战斗
          logOperation('shidian', '篝火营地战斗', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]战力模式完成，开始执行3次空投战斗`
          })
          for (let fightCount = 1; fightCount <= 3; fightCount++) {
            try {
              await tokenStore.sendClubAttackMonster(token.id, {
                useItem: false,
                teamSetParams: {
                  lordWeaponId: weaponId2,
                  petUId: petUId2,
                  battleTeam: battleTeam2
                }
              })
              logOperation('shidian', '篝火营地战斗', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'info',
                message: `【序号${tokenIndex}】[${token.name || token.id}]空投战斗第${fightCount}/3次完成`
              })
            } catch (e) {
              logOperation('shidian', '篝火营地战斗', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `【序号${tokenIndex}】[${token.name || token.id}]空投战斗第${fightCount}次失败: ${e.message || e}，停止空投`
              })
              break
            }
            await waitCommandDelay()
          }
        }

        successTokens.push(tokenIndex)
        
        logOperation('shidian', '篝火营地战斗', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]篝火营地战斗成功（${fightTypeText}），队伍: ${JSON.stringify(battleTeam)}`
        })

        await connectionPool.release(token.id, true)
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 篝火营地战斗失败:`, error)
        logOperation('shidian', '篝火营地战斗', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]篝火营地战斗失败: ${error.message || error}`
        })
        try {
          await connectionPool.release(token.id, true)
        } catch (e) {}
      }
      
      await waitCommandDelay()
    }

    // 汇总记录成功的token序号
    if (successTokens.length > 0) {
      logOperation('shidian', '篝火营地战斗', {
        cardType: '俱乐部管理',
        status: 'success',
        message: `篝火营地战斗完成，成功Token序号: ${successTokens.join(',')}（共${successTokens.length}个）`
      })
    }

    message.success(`篝火营地战斗完成，成功${successTokens.length}/${targetTokens.length}个`)
  } catch (error) {
    console.error('篝火营地战斗失败:', error)
    logOperation('shidian', '篝火营地战斗', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `篝火营地战斗失败: ${error.message || error}`
    })
  } finally {
    isCampBattleRunning.value = false
    // 缓存持久保存，不再清空
  }
}

// 获取俱乐部团长
const handleGetLegionLeader = async () => {
  try {
    isGetLegionLeaderRunning.value = true
    message.info('开始获取俱乐部团长...')
    logOperation('shidian', '获取俱乐部团长', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始获取俱乐部团长...'
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '获取俱乐部团长', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }

    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到${targetTokens.length}个Token（${rangeText}）`)

    const leaders = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = sortedTokens.value.findIndex(t => t.id === token.id) + 1

      try {
        const connected = await connectionPool.acquire(token.id)
        if (!connected) {
          logOperation('shidian', '获取俱乐部团长', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'warning',
            message: `【序号${tokenIndex}】[${token.name || token.id}]连接失败，跳过`
          })
          continue
        }

        // 执行 role_getroleinfo 获取 roleId
        const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
        const roleId = roleInfo?.role?.roleId

        if (!roleId) {
          throw new Error('未获取到roleId')
        }

        // 执行 legion_getinfo 获取 leaderId 和俱乐部名称
        const legionInfo = await tokenStore.sendLegionGetInfo(token.id)
        const leaderId = legionInfo?.info?.leaderId
        const legionName = legionInfo?.info?.name || ''

        if (!leaderId) {
          throw new Error('未获取到leaderId')
        }

        // 判断是否是团长
        if (roleId === leaderId) {
          leaders.push({
            roleId: roleId,
            tokenIndex: tokenIndex,
            name: token.name || token.id,
            legionName: legionName
          })

          logOperation('shidian', '获取俱乐部团长', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]是团长，俱乐部: ${legionName}，roleId: ${roleId}`
          })
        } else {
          logOperation('shidian', '获取俱乐部团长', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]不是团长，跳过`
          })
        }

        await connectionPool.release(token.id, true)
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 获取团长失败:`, error)
        logOperation('shidian', '获取俱乐部团长', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `【序号${tokenIndex}】[${token.name || token.id}]获取团长失败: ${error.message || error}`
        })
        try {
          await connectionPool.release(token.id, true)
        } catch (e) {}
      }

      await waitCommandDelay()
    }

    // 导出 CSV
    if (leaders.length > 0) {
      const csvContent = [
        '序号,Token名称,俱乐部名称,RoleId',
        ...leaders.map(l => `${l.tokenIndex},${l.name},${l.legionName},${l.roleId}`)
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `俱乐部团长_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      logOperation('shidian', '获取俱乐部团长', {
        cardType: '俱乐部管理',
        status: 'success',
        message: `获取俱乐部团长完成，找到${leaders.length}个团长，已导出CSV`
      })

      message.success(`获取俱乐部团长完成，找到${leaders.length}个团长，已导出CSV`)
    } else {
      logOperation('shidian', '获取俱乐部团长', {
        cardType: '俱乐部管理',
        status: 'info',
        message: '获取俱乐部团长完成，没有找到团长'
      })

      message.info('获取俱乐部团长完成，没有找到团长')
    }
  } catch (error) {
    console.error('获取俱乐部团长失败:', error)
    logOperation('shidian', '获取俱乐部团长', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `获取俱乐部团长失败: ${error.message || error}`
    })
  } finally {
    isGetLegionLeaderRunning.value = false
  }
}

// 一键领取的 Token 序号，默认 13
const isLegacyHangupRunning = ref(false)
const isLegacyCollectRunning = ref(false)
const isLegacyClaimGiftRunning = ref(false)
const isAcceptGiftRunning = ref(false)
const isAutoAcceptGiftRunning = ref(false)
const isBatchAcceptGiftRunning = ref(false)
const isBatchLegacyHangupRunning = ref(false)
const isBatchLegacyBeginHangupRunning = ref(false)
const isExportLegacyDetailsRunning = ref(false)
const isExportClubInfoRunning = ref(false)
const isLegacyBookRunning = ref(false)
const isBatchLegacyBookRunning = ref(false)
const isRefreshLegacyInfoRunning = ref(false)
const isBatchRecruitWeekRunning = ref(false)
const isQuickSendLegacyRunning = ref(false)
const isQuickAcceptGiftRunning = ref(false)
const isGetFragmentCountRunning = ref(false)
const currentFragmentCount = ref(null)
const isBatchCollectPrivilegeRunning = ref(false)
const isBatchPetEggRunning = ref(false)
const isBatchPetBookRunning = ref(false)
const isCampSignupRunning = ref(false)
const isCampFightRunning = ref(false)
const isCampBattleRunning = ref(false)
const campSignupRange = ref(localStorage.getItem('campSignupRange') || '')
const isGetLegionLeaderRunning = ref(false)
const legacyBookInfo = ref({
  books: {},
  storage: {}
})

// 一键接受礼物
const handleQuickAcceptGift = async () => {
  const connectedToken = tokenStore.gameTokens.find(t => tokenStore.getWebSocketStatus(t.id) === 'connected')
  
  if (!connectedToken) {
    message.warning('没有已连接的 Token')
    return
  }

  try {
    isQuickAcceptGiftRunning.value = true
    message.info(`开始一键接受礼物，Token: ${connectedToken.name || connectedToken.id}...`)
    logOperation('shidian', '一键接受礼物', {
      cardType: '俱乐部管理',
      tokenId: connectedToken.id,
      tokenName: connectedToken.name,
      status: 'info',
      message: `开始一键接受礼物`
    })

    for (let i = 0; i < 3; i++) {
      if (!isQuickAcceptGiftRunning.value) break

      try {
        await tokenStore.sendLegacyClaimGift(connectedToken.id, { targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820 })
        message.success(`[${connectedToken.name || connectedToken.id}] 第 ${i + 1}/3 次接受礼物成功`)
        logOperation('shidian', '一键接受礼物', {
          cardType: '俱乐部管理',
          tokenId: connectedToken.id,
          tokenName: connectedToken.name,
          status: 'success',
          message: `第 ${i + 1} 次接受礼物成功`
        })
      } catch (error) {
        console.error(`[${connectedToken.name || connectedToken.id}] 第 ${i + 1} 次接受礼物失败:`, error)
        message.error(`[${connectedToken.name || connectedToken.id}] 第 ${i + 1} 次接受礼物失败：${error.message || error}`)
        logOperation('shidian', '一键接受礼物', {
          cardType: '俱乐部管理',
          tokenId: connectedToken.id,
          tokenName: connectedToken.name,
          status: 'error',
          message: `第 ${i + 1} 次接受礼物失败：${error.message || error}`
        })
      }

      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }

    message.success('一键接受礼物完成，共执行 3 次')
    logOperation('shidian', '一键接受礼物', {
      cardType: '俱乐部管理',
      tokenId: connectedToken.id,
      tokenName: connectedToken.name,
      status: 'success',
      message: `【${connectedToken.name || connectedToken.id}】一键接受礼物完成，共执行 3 次`
    })
  } catch (error) {
    console.error('一键接受礼物失败:', error)
    message.error(`一键接受礼物失败：${error.message || error}`)
    logOperation('shidian', '一键接受礼物', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'error',
      message: `一键接受礼物失败：${error.message || error}`
    })
  } finally {
    isQuickAcceptGiftRunning.value = false
  }
}

// 获取残卷数量
const handleGetFragmentCount = async () => {
  const connectedToken = tokenStore.gameTokens.find(t => tokenStore.getWebSocketStatus(t.id) === 'connected')
  
  if (!connectedToken) {
    message.warning('没有已连接的 Token')
    return
  }

  try {
    isGetFragmentCountRunning.value = true
    message.info(`正在获取 ${connectedToken.name || connectedToken.id} 的功法残卷数量...`)
    
    const roleInfo = await tokenStore.sendGetRoleInfo(connectedToken.id)
    currentFragmentCount.value = roleInfo?.role?.items?.[37007]?.quantity || 0
    
    message.success(`${connectedToken.name || connectedToken.id} 功法残卷数量: ${currentFragmentCount.value}`)
    logOperation('shidian', '获取残卷数量', {
      cardType: '俱乐部管理',
      tokenId: connectedToken.id,
      tokenName: connectedToken.name,
      status: 'success',
      message: `功法残卷数量: ${currentFragmentCount.value}`
    })
  } catch (error) {
    console.error('获取残卷数量失败:', error)
    message.error(`获取残卷数量失败：${error.message || error}`)
    logOperation('shidian', '获取残卷数量', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'error',
      message: `获取残卷数量失败：${error.message || error}`
    })
  } finally {
    isGetFragmentCountRunning.value = false
  }
}

// 辅助函数：获取token的序号（基于名称排序后的顺序）
const getTokenIndex = (token) => {
  const gameTokens = [...tokenStore.gameTokens]
  const sortedTokens = gameTokens.sort((a, b) => {
    const nameA = (a.name || a.id || '').toLowerCase()
    const nameB = (b.name || b.id || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  const index = sortedTokens.findIndex(t => t.id === token.id)
  return index + 1
}

// 按token昵称排序的token列表（与页面显示顺序一致）
const sortedTokens = computed(() => {
  return [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// 是否有已连接的Token
const hasConnectedToken = computed(() => {
  return tokenStore.gameTokens.some(t => tokenStore.getWebSocketStatus(t.id) === 'connected')
})

// 初始化连接池管理器
const connectionPool = new ConnectionPoolManager(tokenStore, {
  maxConnections: 5,
  connectionTimeout: 3000,
  idleTimeout: 60000,
  queueTimeout: 120000,
  reconnectDelay: 1000,
  maxRetries: 3
})

// 组件卸载前清理连接池
onBeforeUnmount(async () => {
  try {
    await connectionPool.destroy()
    console.log('[ClubManagementCard] 连接池已清理')
  } catch (error) {
    console.error('[ClubManagementCard] 清理连接池失败:', error)
  }
})

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  hasClub: {
    type: Boolean,
    default: false
  },
  clubName: {
    type: String,
    default: '未加入'
  },
  memberCount: {
    type: Number,
    default: 0
  },
  clubPower: {
    type: [String, Number],
    default: 0
  },
  isSignedIn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'refresh-club-info',
  'sign-in-club',
  'view-club-details',
  'batch-fetch-club-info',
  'handle-legion-tokens-input',
  'handle-legion-id-input',
  'join-legion'
])


const refreshClubInfo = () => {
  emit('refresh-club-info')
}

const signInClub = () => {
  emit('sign-in-club')
}

const viewClubDetails = () => {
  emit('view-club-details')
}

const batchFetchClubInfo = () => {
  emit('batch-fetch-club-info')
}

// 处理俱乐部执行范围输入
const handleLegionTokensInput = (value) => {
  legionTokens.value = value
  localStorage.setItem('clubLegionTokens', value)
  emit('handle-legion-tokens-input', value)
}

// 处理俱乐部ID输入
const handleLegionIdInput = (value) => {
  legionId.value = value
  emit('handle-legion-id-input', value)
}

// 处理赠送目标ID输入
const handleLegacyTargetIdInput = (value) => {
  legacyTargetId.value = value
}

// 处理密码输入
const handleLegacyPasswordInput = (value) => {
  legacyPassword.value = value
}

// 处理一键领取 Token 序号输入
const handleAutoAcceptGiftTokenIndexInput = (value) => {
  autoAcceptGiftTokenIndex.value = value
}

// 处理一键送功法目标ID输入
const handleQuickSendLegacyTargetIdInput = (value) => {
  quickSendLegacyTargetId.value = value
  localStorage.setItem('quickSendLegacyTargetId', value)
}

// 处理送功法次数输入
const handleQuickSendLegacyCountInput = (value) => {
  quickSendLegacyCount.value = value
}

// 一键送功法
const handleQuickSendLegacy = async () => {
  if (!quickSendLegacyTargetId.value) {
    message.warning('请输入接收目标ID')
    return
  }

  const connectedToken = tokenStore.gameTokens.find(t => tokenStore.getWebSocketStatus(t.id) === 'connected')
  
  if (!connectedToken) {
    message.warning('没有已连接的 Token')
    return
  }

  const sendCount = parseInt(quickSendLegacyCount.value) || 10

  try {
    isQuickSendLegacyRunning.value = true
    message.info(`开始一键送功法，目标: ${quickSendLegacyTargetId.value}，次数: ${sendCount}...`)

    logOperation('shidian', '一键送功法', {
      cardType: '俱乐部管理',
      tokenId: connectedToken.id,
      tokenName: connectedToken.name,
      status: 'info',
      message: `开始一键送功法，目标: ${quickSendLegacyTargetId.value}，次数: ${sendCount}`
    })

    try {
      await tokenStore.sendRoleCommitPassword(connectedToken.id, {
        password: legacyPassword.value ? parseInt(legacyPassword.value) : 946215
      })
      console.info(`[${connectedToken.name || connectedToken.id}] 提交密码成功`)
      await waitCommandDelay()
    } catch (error) {
      console.error(`[${connectedToken.name || connectedToken.id}] 提交密码失败:`, error)
    }

    for (let i = 0; i < sendCount; i++) {
      if (!isQuickSendLegacyRunning.value) break

      try {
        await tokenStore.sendLegacySendGift(connectedToken.id, {
          itemCnt: 9999,
          targetId: parseInt(quickSendLegacyTargetId.value),
          legacyUIds: []
        })

        message.success(`[${connectedToken.name || connectedToken.id}] 第 ${i + 1}/${sendCount} 次送功法成功`)
        logOperation('shidian', '一键送功法', {
          cardType: '俱乐部管理',
          tokenId: connectedToken.id,
          tokenName: connectedToken.name,
          status: 'success',
          message: `第 ${i + 1} 次送功法成功`
        })
      } catch (error) {
        console.error(`[${connectedToken.name || connectedToken.id}] 第 ${i + 1} 次送功法失败:`, error)
        message.error(`[${connectedToken.name || connectedToken.id}] 第 ${i + 1} 次送功法失败：${error.message || error}`)
        logOperation('shidian', '一键送功法', {
          cardType: '俱乐部管理',
          tokenId: connectedToken.id,
          tokenName: connectedToken.name,
          status: 'error',
          message: `第 ${i + 1} 次送功法失败：${error.message || error}`
        })
      }

      if (i < sendCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    message.success(`一键送功法完成，共执行 ${sendCount} 次`)
    logOperation('shidian', '一键送功法', {
      cardType: '俱乐部管理',
      tokenId: connectedToken.id,
      tokenName: connectedToken.name,
      status: 'success',
      message: `一键送功法完成，共执行 ${sendCount} 次`
    })
  } catch (error) {
    console.error('一键送功法失败:', error)
    message.error(`一键送功法失败：${error.message || error}`)
    logOperation('shidian', '一键送功法', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'error',
      message: `一键送功法失败：${error.message || error}`
    })
  } finally {
    isQuickSendLegacyRunning.value = false
  }
}

// 一键领取
const handleAutoAcceptGift = async () => {
  const tokenIndex = autoAcceptGiftTokenIndex.value ? parseInt(autoAcceptGiftTokenIndex.value) : 13
  
  try {
    isAutoAcceptGiftRunning.value = true
    message.info(`开始一键领取（序号${tokenIndex}）...`)
    
    const token = sortedTokens.value[tokenIndex - 1]
    
    if (!token) {
      message.warning(`序号${tokenIndex}的 Token 不存在`)
      return
    }
    
    message.info(`[${tokenIndex}] ${token.name || token.id} 正在连接...`)
    
    // 连接 token
    let retryCount = 0
    const maxRetries = 5
    let status = tokenStore.getWebSocketStatus(token.id)
    
    while (status !== 'connected' && retryCount < maxRetries) {
      tokenStore.selectToken(token.id, true)
      await waitCommandDelay()
      status = tokenStore.getWebSocketStatus(token.id)
      retryCount++
      
      if (status !== 'connected' && retryCount < maxRetries) {
        message.info(`[${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
      }
    }
    
    if (status !== 'connected') {
      message.warning(`[${tokenIndex}] ${token.name || token.id} 连接失败`)
      return
    }
    
    message.success(`[${tokenIndex}] ${token.name || token.id} 连接成功`)
    
    // 模拟点击接受礼物按钮（调用 legacy_acceptgift），执行 5 次，每次间隔 8 秒
    message.info(`[${tokenIndex}] ${token.name || token.id} 开始执行接受礼物，共 5 次，每次间隔 8 秒...`)
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < 5; i++) {
      try {
        message.info(`[${tokenIndex}] ${token.name || token.id} - 第${i + 1}/5 次接受礼物...`)
        
        await tokenStore.sendLegacyAcceptGift(token.id, {})
        
        successCount++
        message.success(`[${tokenIndex}] ${token.name || token.id} - 第${i + 1}次接受礼物成功`)
        logOperation('shidian', '一键领取', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `第${i + 1}次接受礼物成功`
        })
      } catch (error) {
        failCount++
        console.error(`[${tokenIndex}] ${token.name || token.id} - 第${i + 1}次接受礼物失败:`, error)
        message.error(`[${tokenIndex}] ${token.name || token.id} - 第${i + 1}次接受礼物失败：${error.message || error}`)
        logOperation('shidian', '一键领取', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'error',
          message: `第${i + 1}次接受礼物失败：${error.message || error}`
        })
      }
      
      // 每次执行间隔 8 秒（最后一次不需要等待）
      if (i < 4) {
        message.info(`[${tokenIndex}] ${token.name || token.id} - 等待 8 秒后执行下一次...`)
        await new Promise(resolve => setTimeout(resolve, 8000))
      }
    }
    
    message.success(`[${tokenIndex}] ${token.name || token.id} - 一键领取完成，成功${successCount}次，失败${failCount}次`)
    logOperation('shidian', '一键领取', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `一键领取完成，成功${successCount}次，失败${failCount}次`
    })
    
  } catch (error) {
    console.error('一键领取失败:', error)
    message.error(`一键领取失败：${error.message || error}`)
    logOperation('shidian', '一键领取', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'error',
      message: `一键领取失败：${error.message || error}`
    })
  } finally {
    isAutoAcceptGiftRunning.value = false
  }
}

// 批量加入俱乐部（使用连接池，支持执行范围）
const joinLegion = async () => {
  try {
    isAcceptGiftRunning.value = true
    
    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    
    // 获取目标 Token 列表（根据执行范围过滤）
    const targetTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)
    
    if (targetTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到 Token`)
      isAcceptGiftRunning.value = false
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`开始批量加入俱乐部（${rangeText}），共${targetTokens.length}个 Token...`)
    console.log(`[批量加入俱乐部] 执行范围：${legionTokens.value || '全部'}，目标 Token 数量：${targetTokens.length}`)
    console.log(`[批量加入俱乐部] 目标 Token:`, targetTokens.map(t => `${t.id}(${t.name || ''})`))
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          console.log(`[批量加入俱乐部] [${globalIndex + 1}/${targetTokens.length}] 开始处理 ${token.name || token.id}`)
          
          // 根据昵称关键字确定俱乐部ID
          const tokenName = token.name || ''
          let clubId = null
          let clubSource = ''
          
          // 输入框参数为"00"时，查找昵称包含"蟠桃"的token
          if (legionId.value === '00') {
            if (tokenName.includes('蟠桃')) {
              clubId = 2781636
              clubSource = '蟠桃(00)'
            }
            // 不包含"蟠桃"则跳过
          } else if (tokenName.includes('锦衣')) {
            clubId = 2781636
            clubSource = '锦衣'
          } else if (tokenName.includes('空山')) {
            clubId = 6482066
            clubSource = '空山'
          } else if (tokenName.includes('天气')) {
            clubId = 7413993
            clubSource = '天气'
          } else if (tokenName.includes('明月')) {
            clubId = 6482115
            clubSource = '明月'
          } else if (legionId.value) {
            clubId = parseInt(legionId.value)
            clubSource = '输入框'
          }
          
          // 没有匹配到任何俱乐部ID，跳过
          if (!clubId) {
            const skipMsg = `${token.name || token.id} 昵称未匹配关键字且输入框无参数，跳过`
            console.warn(`[批量加入俱乐部] ${skipMsg}`)
            message.warning(skipMsg)
            
            const tokenIndex = getTokenIndex(token)
            logOperation('shidian', '加入俱乐部', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `【序号${tokenIndex}】[${token.name || token.id}]${skipMsg.replace(`${token.name || token.id} `, '')}`
            })
            
            return { success: false, status: 'skip', message: skipMsg }
          }
          
          console.log(`[批量加入俱乐部] ${token.name || token.id} 使用俱乐部ID ${clubId}（来源：${clubSource}）`)
          
          // 使用 sendMessageWithPromise 获取响应
          const response = await tokenStore.sendMessageWithPromise(
            token.id, 
            'legion_applyjoin', 
            { legionId: clubId },
            5000
          )
          
          let successMsg = ''
          let resultStatus = 'success'
          
          // 检查响应结果
          if (response && response.code !== undefined) {
            if (response.code === 0) {
              successMsg = `${token.name || token.id} 成功申请加入俱乐部 ${clubId}（来源：${clubSource}）`
              message.success(successMsg)
            } else if (response.msg && response.msg.includes('已经加入')) {
              successMsg = `${token.name || token.id} 已经加入俱乐部 ${clubId}`
              message.info(successMsg)
              resultStatus = 'info'
            } else if (response.msg && response.msg.includes('未找到俱乐部')) {
              successMsg = `${token.name || token.id} 加入失败：未找到俱乐部 ${clubId}`
              message.error(successMsg)
              resultStatus = 'error'
            } else {
              successMsg = `${token.name || token.id} 加入俱乐部失败：${response.msg || '未知错误'}`
              message.error(successMsg)
              resultStatus = 'error'
            }
          } else {
            successMsg = `${token.name || token.id} 已申请加入俱乐部 ${clubId}（来源：${clubSource}）`
            message.success(successMsg)
          }
          
          // 记录操作日志
          const tokenIndex = getTokenIndex(token)
          logOperation('shidian', '加入俱乐部', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: resultStatus,
            message: `【序号${tokenIndex}】[${token.name || token.id}]${successMsg.replace(`${token.name || token.id} `, '')}`
          })
          
          return { 
            success: resultStatus !== 'error', 
            status: resultStatus,
            message: successMsg
          }
        } catch (error) {
          const errorMsg = `${token.name || token.id}: 加入失败 - ${error.message || '未知错误'}`
          console.error(`[批量加入俱乐部] [${globalIndex + 1}]`, errorMsg)
          message.error(errorMsg)
          
          // 记录操作日志
          const tokenIndex = getTokenIndex(token)
          logOperation('shidian', '加入俱乐部', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `【序号${tokenIndex}】[${token.name || token.id}]加入俱乐部失败：${error.message || '未知错误'}`
          })
          
          return { success: false, error: error.message }
        }
      },
      {
        batchSize: 1,
        delayBetween: 1000,
        keepConnections: false,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            console.log(`[批量加入俱乐部] 正在处理第 ${progress.batchIndex} 批（共 ${progress.totalBatches} 批）`)
          } else if (progress.type === 'token-start') {
            console.log(`[批量加入俱乐部] [${progress.globalIndex}/${progress.totalTokens}] ${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            console.log(`[批量加入俱乐部] [${progress.globalIndex}] ${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              console.warn(`[批量加入俱乐部] [${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            } else {
              console.error(`[批量加入俱乐部] [${progress.globalIndex}] ${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 汇总统计结果
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    message.success(`批量加入俱乐部完成，成功${successCount}个，失败${errorCount}个`)
    console.log(`[批量加入俱乐部] 完成 - 成功：${successCount}, 失败：${errorCount}`)
  } catch (error) {
    console.error('[批量加入俱乐部] 失败:', error)
    message.error('批量加入俱乐部失败：' + (error.message || '未知错误'))
  } finally {
    isAcceptGiftRunning.value = false
  }
}

// 解析Token范围（如果为空则返回null，表示执行全部）
// 支持两种输入方式：
// 1. 逗号分隔：1,2,3 -> [1, 2, 3]
// 2. 范围：1-3 -> [1, 2, 3]
// 3. 混合使用：1,3-5 -> [1, 3, 4, 5] 或 1-3,5 -> [1, 2, 3, 5]
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null // null表示执行全部
  }
  
  const tokens = []
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      // 处理范围格式：1-3
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tokens.push(i)
        }
      }
    } else {
      // 处理单个数字：1
      const num = Number(trimmed)
      if (!isNaN(num)) {
        tokens.push(num)
      }
    }
  }
  
  return tokens.length > 0 ? tokens : null
}

// 获取目标Token列表（根据执行范围或全部）
const getTargetTokens = (tokenIndices) => {
  const tokens = sortedTokens.value // 使用排序后的token列表（与页面显示顺序一致）
  if (tokens.length === 0) {
    return []
  }
  
  // 如果tokenIndices为null，返回所有token（已按sortedTokens顺序排序）
  if (tokenIndices === null) {
    return tokens // sortedTokens已经是按名称排序的
  }
  
  // 否则根据索引范围返回指定token（按sortedTokens中的序号排序）
  return tokenIndices
    .map(index => {
      const arrayIndex = index - 1
      const token = tokens[arrayIndex]
      return token ? { token, index } : null
    })
    .filter(item => item !== null)
    .sort((a, b) => a.index - b.index)
    .map(item => item.token)
}

// 功法挂机（单个）
const handleLegacyHangup = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  try {
    isLegacyHangupRunning.value = true
    
    // 检查连接状态
    let status = tokenStore.getWebSocketStatus(token.id)
    
    // 如果未连接，尝试连接（最多5次）
    if (status !== 'connected') {
      message.info('Token未连接，正在尝试连接...')
      
      let retryCount = 0
      const maxRetries = 5
      
      while (status !== 'connected' && retryCount < maxRetries) {
        // 模拟点击token昵称（选择并连接token）
        tokenStore.selectToken(token.id, true)
        
        // 等待执行间隔
        await waitCommandDelay()
        
        // 检查连接状态
        status = tokenStore.getWebSocketStatus(token.id)
        retryCount++
        
        if (status !== 'connected') {
          message.info(`连接尝试 ${retryCount}/${maxRetries}...`)
        }
      }
      
      // 如果仍未连接，提示错误
      if (status !== 'connected') {
        message.error('连接失败，请手动连接Token后再试')
        return
      }
      
      message.success('Token连接成功')
    }
    
    // 执行领取挂机命令
    message.info('正在领取功法挂机奖励...')
    
    try {
      // 执行命令前等待执行间隔
      await waitCommandDelay()
      const res = await tokenStore.sendMessageWithPromise(
        token.id,
        'legacy_claimhangup',
        {},
        5000
      )
      
      // 检查响应结果
      console.log('功法挂机响应:', res)
      
      // 检查是否有错误码
      if (res && res.code !== undefined && res.code !== 0) {
        const errorMsg = res.msg || res.message || `错误码: ${res.code}`
        console.error('功法挂机失败 - 错误码:', res.code, '错误信息:', errorMsg)
        message.error(`功法挂机失败: ${errorMsg} (错误码: ${res.code})`)
        return
      }
      
      // 检查响应数据
      if (!res) {
        console.error('功法挂机失败 - 响应为空')
        message.error('功法挂机失败: 服务器未返回响应')
        return
      }
      
      // 检查是否成功领取
      if (res.reward && res.reward.length > 0) {
        const rewardInfo = res.reward.map(r => {
          // 如果奖励是功法残卷（itemId: 37007），显示为"功法残卷"
          const itemName = (r.itemId === 37007 || r.id === 37007) ? '功法残卷' : (r.name || '未知')
          return `${itemName} x${r.value || r.count || 0}`
        }).join(', ')
        console.log('功法挂机成功 - 奖励:', rewardInfo)
        message.success(`功法挂机奖励领取成功: ${rewardInfo}`)
        const tokenIndex = getTokenIndex(token)
      logOperation('shidian', '功法挂机', {
        cardType: '俱乐部管理',
        tokenId: token.id,
        tokenName: token.name,
        status: 'success',
        message: `【序号${tokenIndex}】[${token.name || token.id}]功法挂机奖励领取成功: ${rewardInfo}`
      })
      } else if (res.role && res.role.items) {
        // 检查是否有物品更新
        const item37007 = res.role.items[37007]
        if (item37007) {
          console.log('功法挂机成功 - 功法残卷数量:', item37007.quantity)
          message.success(`功法挂机奖励领取成功，功法残卷: ${item37007.quantity}`)
          const tokenIndex = getTokenIndex(token)
          logOperation('shidian', '功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]功法挂机奖励领取成功，功法残卷: ${item37007.quantity}`
          })
        } else {
          console.log('功法挂机成功 - 但无奖励信息')
          message.success('功法挂机奖励领取成功')
          const tokenIndex = getTokenIndex(token)
          logOperation('shidian', '功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${tokenIndex}】[${token.name || token.id}]功法挂机奖励领取成功`
          })
        }
      } else {
        console.log('功法挂机成功 - 但响应格式异常:', res)
        message.success('功法挂机奖励领取成功')
        const tokenIndex = getTokenIndex(token)
        logOperation('shidian', '功法挂机', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]功法挂机奖励领取成功`
        })
      }
      
      // 刷新角色信息
      await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    } catch (error) {
      console.error('功法挂机失败 - 异常详情:', {
        error,
        message: error.message,
        stack: error.stack,
        response: error.response || error.data
      })
      
      // 检查错误类型
      let errorMessage = '未知错误'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.code) {
        errorMessage = `错误码: ${error.code}`
        if (error.msg) {
          errorMessage += ` - ${error.msg}`
        }
      } else if (error.response) {
        errorMessage = `响应错误: ${JSON.stringify(error.response)}`
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // 常见错误提示
      if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接'
      } else if (errorMessage.includes('未连接') || errorMessage.includes('disconnected')) {
        errorMessage = 'WebSocket未连接，请先连接Token'
      } else if (errorMessage.includes('已领取') || errorMessage.includes('already')) {
        errorMessage = '今日已领取功法挂机奖励'
      } else if (errorMessage.includes('没有') || errorMessage.includes('不足')) {
        errorMessage = '没有可领取的功法挂机奖励'
      }
      
      message.error(`功法挂机失败: ${errorMessage}`)
      const tokenIndex = getTokenIndex(token)
      logOperation('shidian', '功法挂机', {
        cardType: '俱乐部管理',
        tokenId: token.id,
        tokenName: token.name,
        status: 'error',
        message: `【序号${tokenIndex}】[${token.name || token.id}]功法挂机失败: ${errorMessage}`
      })
    } finally {
      isLegacyHangupRunning.value = false
    }
  } catch (error) {
    console.error('功法挂机失败 - 外层异常:', error)
    message.error('功法挂机失败: ' + (error.message || '未知错误'))
    const tokenIndex = token ? getTokenIndex(token) : '?'
    logOperation('shidian', '功法挂机', {
      cardType: '俱乐部管理',
      tokenId: token?.id,
      tokenName: token?.name,
      status: 'error',
      message: `【序号${tokenIndex}】[${token?.name || '未知'}]功法挂机失败: ${error.message || '未知错误'}`
    })
    isLegacyHangupRunning.value = false
  }
}

// 批量功法挂机
const handleBatchLegacyHangup = async () => {
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
  // 获取目标Token列表（根据执行范围过滤）
  const targetTokens = connectionPool.getTargetTokens(tokens, tokenIndices)
  
  if (targetTokens.length === 0) {
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.warning(`执行范围${rangeText}内没有找到Token`)
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
  message.info(`开始批量功法挂机（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
  
  try {
    isLegacyHangupRunning.value = true
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          const res = await tokenStore.sendMessageWithPromise(
            token.id,
            'legacy_claimhangup',
            {},
            5000
          )
          
          console.log(`[${globalIndex + 1}] 功法挂机响应:`, res)
          
          if (res && res.code !== undefined && res.code !== 0) {
            const errorMsg = res.msg || res.message || `错误码: ${res.code}`
            console.error(`[${globalIndex + 1}] 功法挂机失败 - 错误码:`, res.code, '错误信息:', errorMsg)
            message.error(`[${globalIndex + 1}] ${token.name || token.id}: ${errorMsg} (错误码: ${res.code})`)
            logOperation('shidian', '批量功法挂机', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `${errorMsg} (错误码: ${res.code})`
            })
            return { success: false, error: errorMsg }
          }
          
          if (!res) {
            console.error(`[${globalIndex + 1}] 功法挂机失败 - 响应为空`)
            message.error(`[${globalIndex + 1}] ${token.name || token.id}: 服务器未返回响应`)
            logOperation('shidian', '批量功法挂机', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `服务器未返回响应`
            })
            return { success: false, error: '服务器未返回响应' }
          }
          
          let successMsg = `[${globalIndex + 1}] ${token.name || token.id} 功法挂机奖励领取成功`
          if (res.reward && res.reward.length > 0) {
            const rewardInfo = res.reward.map(r => {
              const itemName = (r.itemId === 37007 || r.id === 37007) ? '功法残卷' : (r.name || '未知')
              return `${itemName} x${r.value || r.count || 0}`
            }).join(', ')
            successMsg += `: ${rewardInfo}`
          } else if (res.role && res.role.items && res.role.items[37007]) {
            const item37007 = res.role.items[37007]
            successMsg += `，功法残卷: ${item37007.quantity}`
          }
          
          await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
          
          message.success(successMsg)
          logOperation('shidian', '批量功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: successMsg.replace(`[${globalIndex + 1}] `, '')
          })
          
          return { success: true, result: res }
        } catch (error) {
          console.error(`[${globalIndex + 1}] 功法挂机失败 - 异常详情:`, {
            token: token.name || token.id,
            error,
            message: error.message,
            stack: error.stack,
            response: error.response || error.data
          })
          
          let errorMessage = '未知错误'
          
          if (error.message) {
            errorMessage = error.message
          } else if (error.code) {
            errorMessage = `错误码: ${error.code}`
            if (error.msg) {
              errorMessage += ` - ${error.msg}`
            }
          } else if (error.response) {
            errorMessage = `响应错误: ${JSON.stringify(error.response)}`
          } else if (typeof error === 'string') {
            errorMessage = error
          }
          
          if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
            errorMessage = '请求超时，请检查网络连接'
          } else if (errorMessage.includes('未连接') || errorMessage.includes('disconnected')) {
            errorMessage = 'WebSocket未连接'
          } else if (errorMessage.includes('已领取') || errorMessage.includes('already')) {
            errorMessage = '今日已领取功法挂机奖励'
          } else if (errorMessage.includes('没有') || errorMessage.includes('不足')) {
            errorMessage = '没有可领取的功法挂机奖励'
          }
          
          message.error(`[${globalIndex + 1}] ${token.name || token.id}: ${errorMessage}`)
          logOperation('shidian', '批量功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `${errorMessage}`
          })
          
          return { success: false, error: errorMessage }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量功法挂机完成')
    logOperation('shidian', '批量功法挂机', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量功法挂机完成'
    })
  } catch (error) {
    console.error('批量功法挂机失败:', error)
    message.error('批量功法挂机失败')
  } finally {
    isLegacyHangupRunning.value = false
  }
}

// 收集功法（单个）
const handleLegacyCollect = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  try {
    isLegacyCollectRunning.value = true
    
    // 检查连接状态
    let status = tokenStore.getWebSocketStatus(token.id)
    
    // 如果未连接，尝试连接（最多5次）
    if (status !== 'connected') {
      message.info('Token未连接，正在尝试连接...')
      
      let retryCount = 0
      const maxRetries = 5
      
      while (status !== 'connected' && retryCount < maxRetries) {
        tokenStore.selectToken(token.id, true)
        await waitCommandDelay()
        status = tokenStore.getWebSocketStatus(token.id)
        retryCount++
        
        if (status !== 'connected' && retryCount < maxRetries) {
          message.info(`连接尝试 ${retryCount}/${maxRetries}...`)
        }
      }
      
      if (status !== 'connected') {
        message.error('连接失败，请手动连接Token后再试')
        return
      }
      
      message.success('Token连接成功')
    }
    
    // 1. 使用 role_getroleinfo 获取 items:37007 数量
    message.info('正在获取功法残卷数量...')
    await waitCommandDelay()
    const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
    const legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
    
    if (legacyFragmentCount === 0) {
      message.warning('功法残卷数量为0，无法收集')
      return
    }
    
    console.log(`功法残卷数量: ${legacyFragmentCount}`)
    message.success(`获取到功法残卷数量: ${legacyFragmentCount}`)
    
    // 2. 使用 role_commitpassword 命令
    message.info('正在提交密码...')
    try {
      await waitCommandDelay()
      await tokenStore.sendRoleCommitPassword(token.id, {
        password: legacyPassword.value ? parseInt(legacyPassword.value) : 946215
      })
      message.success('密码提交成功')
      
      // 提交密码后需要等待一段时间使其生效
      await waitCommandDelay()
    } catch (error) {
      console.error('提交密码失败:', error)
      message.warning('提交密码失败，但继续执行')
    }
    
    // 3. 使用 legacy_sendgift 命令，itemCnt 设为获取的 items:37007 数量
    message.info(`正在赠送功法残卷，数量: ${legacyFragmentCount}...`)
    try {
      await waitCommandDelay()
      const giftRes = await tokenStore.sendLegacySendGift(token.id, {
        itemCnt: legacyFragmentCount,
        targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820
      })
      
      console.log('赠送功法残卷响应:', giftRes)
      
      if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
        const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
        message.error(`收集功法失败: ${errorMsg} (错误码: ${giftRes.code})`)
        return
      }
      
      message.success(`收集功法成功，已赠送 ${legacyFragmentCount} 个功法残卷`)
    } catch (error) {
      console.error('赠送功法残卷失败:', error)
      let errorMessage = error.message || '未知错误'
      
      if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接'
      } else if (errorMessage.includes('未连接') || errorMessage.includes('disconnected')) {
        errorMessage = 'WebSocket未连接，请先连接Token'
      }
      
      message.error(`收集功法失败: ${errorMessage}`)
    }
  } catch (error) {
    console.error('收集功法失败:', error)
    message.error('收集功法失败: ' + (error.message || '未知错误'))
  } finally {
    isLegacyCollectRunning.value = false
  }
}

// 批量收集功法
const handleBatchLegacyCollect = async () => {
  // 查找标签为"功法"的token（通过remark字段判断）
  // 支持格式：包含"功法"的remark，如"殿0 功法"、"功法"等
  const allLegacyTokens = sortedTokens.value.filter(t => {
    if (!t.remark) return false
    const remark = t.remark.trim()
    // 检查是否包含"功法"
    return remark.includes('功法')
  })
  
  // 调试信息：显示所有token的remark
  console.log('所有Token的remark:', sortedTokens.value.map(t => ({
    id: t.id,
    name: t.name,
    remark: t.remark || '(无)'
  })))
  console.log('找到的功法Token:', allLegacyTokens.map(t => ({
    id: t.id,
    name: t.name,
    remark: t.remark
  })))
  
  if (allLegacyTokens.length === 0) {
    const allRemarks = sortedTokens.value.map(t => t.remark || '(无)').join(', ')
    message.warning(`没有找到标签为"功法"的Token。当前所有Token的标签: ${allRemarks}`)
    return
  }
  
  try {
    isLegacyCollectRunning.value = true
    message.info(`开始批量收集功法，找到${allLegacyTokens.length}个标签为"功法"的Token...`)
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      allLegacyTokens,
      async (token, globalIndex) => {
        try {
          message.info(`[${globalIndex + 1}] ${token.name || token.id} 正在获取功法残卷数量...`)
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          const legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
          
          if (legacyFragmentCount === 0) {
            message.warning(`[${globalIndex + 1}] ${token.name || token.id}: 功法残卷数量为0，跳过`)
            logOperation('shidian', '批量收集功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'info',
              message: `功法残卷数量为0，跳过`
            })
            return { collected: false, fragmentCount: 0 }
          }
          
          console.log(`[${globalIndex + 1}] ${token.name || token.id} 功法残卷数量: ${legacyFragmentCount}`)
          
          try {
            await tokenStore.sendRoleCommitPassword(token.id, {})
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 提交密码失败:`, error)
          }
          
          try {
            message.info(`[${globalIndex + 1}] ${token.name || token.id} 正在赠送功法残卷，数量: ${legacyFragmentCount}...`)
            const giftRes = await tokenStore.sendLegacySendGift(token.id, {
              itemCnt: legacyFragmentCount
            })
            
            if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
              const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
              message.error(`[${globalIndex + 1}] ${token.name || token.id}: ${errorMsg}`)
              logOperation('shidian', '批量收集功法', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `收集功法失败: ${errorMsg}`
              })
              return { collected: false, error: errorMsg }
            }
            
            message.success(`[${globalIndex + 1}] ${token.name || token.id}: 收集功法成功，已赠送 ${legacyFragmentCount} 个功法残卷`)
            logOperation('shidian', '批量收集功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'success',
              message: `收集功法成功，已赠送 ${legacyFragmentCount} 个功法残卷`
            })
            return { collected: true, fragmentCount: legacyFragmentCount }
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 赠送功法残卷失败:`, error)
            message.error(`[${globalIndex + 1}] ${token.name || token.id}: 赠送失败 - ${error.message || '未知错误'}`)
            logOperation('shidian', '批量收集功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `赠送功法失败: ${error.message || '未知错误'}`
            })
            return { collected: false, error: error.message || '未知错误' }
          }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 收集功法失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id}: 收集功法失败`)
          logOperation('shidian', '批量收集功法', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `收集功法失败: ${error.message || '未知错误'}`
          })
          return { collected: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量收集功法完成')
  } catch (error) {
    console.error('批量收集功法失败:', error)
    message.error('批量收集功法失败')
  } finally {
    isLegacyCollectRunning.value = false
  }
}

// 批量赠送功法
const handleBatchLegacyClaimGift = async () => {
  try {
    isLegacyClaimGiftRunning.value = true
    message.info('开始批量赠送功法...')
    logOperation('shidian', '批量赠送功法', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量赠送功法...'
    })

    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    
    // 获取目标Token列表（根据执行范围过滤）
    const legacyTokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (legacyTokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量赠送功法', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到${legacyTokens.length}个Token（${rangeText}）`)
    logOperation('shidian', '批量赠送功法', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `找到${legacyTokens.length}个Token（${rangeText}）`
    })

    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      legacyTokens,
      async (token, globalIndex) => {
        const tokenIndex = getTokenIndex(token)
        
        // 执行领取功法操作
        await tokenStore.sendLegacyClaimHangup(token.id, {})
        logOperation('shidian', '批量赠送功法', {
          cardType: '俱乐部管理',
          tokenId: token.id,
          tokenName: token.name,
          status: 'success',
          message: `【序号${tokenIndex}】[${token.name || token.id}]收集功法成功`
        })
        await waitCommandDelay()

        let legacyFragmentCount = 0
        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
          console.info(`[${globalIndex + 1}] ${token.name || token.id} 当前功法残卷数量: ${legacyFragmentCount}`)
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 获取角色信息失败:`, error)
        }

        if (legacyFragmentCount < 100) {
          console.info(`[${globalIndex + 1}] ${token.name || token.id} 功法残卷数量(${legacyFragmentCount})小于100，跳过收集功法按钮`)
          logOperation('shidian', '批量赠送功法', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]功法残卷数量(${legacyFragmentCount})小于100，跳过收集功法按钮`
          })
          return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount }
        }

        if (legacyFragmentCount > 0) {
          const sendCount = legacyFragmentCount > 9999 ? 9999 : legacyFragmentCount
          
          try {
            await tokenStore.sendRoleCommitPassword(token.id, {
              password: legacyPassword.value ? parseInt(legacyPassword.value) : 946215
            })
            console.info(`[${globalIndex + 1}] ${token.name || token.id} 提交密码成功`)
            
            // 提交密码后需要等待一段时间使其生效
            await waitCommandDelay()
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 提交密码失败:`, error)
            console.info(`[${globalIndex + 1}] ${token.name || token.id} 提交密码失败，但继续执行`)
          }
          
          try {
            const giftRes = await tokenStore.sendLegacySendGift(token.id, {
              itemCnt: sendCount,
              targetId: legacyTargetId.value ? parseInt(legacyTargetId.value) : 111582820,
              legacyUIds: []
            })
            
            if (giftRes && giftRes.code !== undefined && giftRes.code !== 0) {
              const errorMsg = giftRes.msg || giftRes.message || `错误码: ${giftRes.code}`
              console.error(`[${globalIndex + 1}] ${token.name || token.id} 赠送功法残卷失败: ${errorMsg}`)
              logOperation('shidian', '批量赠送功法', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'error',
                message: `【序号${tokenIndex}】[${token.name || token.id}]赠送功法残卷失败: ${errorMsg}`
              })
              return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount, error: errorMsg }
            } else {
              console.info(`[${globalIndex + 1}] ${token.name || token.id} 模拟点击收集功法按钮完成，已赠送 ${sendCount} 个功法残卷`)
              logOperation('shidian', '批量赠送功法', {
                cardType: '俱乐部管理',
                tokenId: token.id,
                tokenName: token.name,
                status: 'success',
                message: `【序号${tokenIndex}】[${token.name || token.id}]模拟点击收集功法按钮完成，已赠送 ${sendCount} 个功法残卷`
              })
              return { collected: true, sentGift: true, fragmentCount: legacyFragmentCount, sendCount: sendCount }
            }
          } catch (error) {
            console.error(`[${globalIndex + 1}] ${token.name || token.id} 执行legacy_sendgift失败:`, error)
            logOperation('shidian', '批量赠送功法', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'error',
              message: `【序号${tokenIndex}】[${token.name || token.id}]执行legacy_sendgift失败: ${error.message || error}`
            })
            return { collected: true, sentGift: false, fragmentCount: legacyFragmentCount, error: error.message || error }
          }
        } else {
          console.info(`[${globalIndex + 1}] ${token.name || token.id} 功法残卷数量为0，跳过`)
          logOperation('shidian', '批量赠送功法', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'info',
            message: `【序号${tokenIndex}】[${token.name || token.id}]功法残卷数量为0，跳过`
          })
          return { collected: true, sentGift: false, fragmentCount: 0 }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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

    message.success('批量赠送功法已完成')
    logOperation('shidian', '批量赠送功法', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量赠送功法已完成'
    })
  } catch (error) {
    console.error('批量赠送功法失败:', error)
    message.error(`批量赠送功法失败: ${error.message || error}`)
    logOperation('shidian', '批量赠送功法', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量赠送功法失败: ${error.message || error}`
    })
  } finally {
    isLegacyClaimGiftRunning.value = false
  }
}

// 接受礼物（执行legacy_claimgift）
const handleAcceptGift = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }

  try {
    isAcceptGiftRunning.value = true
    message.info('正在接受礼物...')

    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.info('正在连接游戏...')
      tokenStore.selectToken(token.id, true)

      let count = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
        await waitCommandDelay()
        count++
      }

      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.error('WebSocket连接失败，请稍后重试')
        return
      }
      message.success('游戏连接成功')
    }

    // 执行legacy_claimgift
    await waitCommandDelay()
    await tokenStore.sendLegacyClaimGift(token.id, {})
    message.success('接受礼物成功')
    logOperation('shidian', '接受礼物', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【序号${tokenIndex}】[${token.name || token.id}]接受礼物成功`
    })
  } catch (error) {
    console.error('接受礼物失败:', error)
    message.error(`接受礼物失败: ${error.message || error}`)
    logOperation('shidian', '接受礼物', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'error',
      message: `接受礼物失败: ${error.message || error}`
    })
  } finally {
    isAcceptGiftRunning.value = false
  }
}

// 批量接受礼物
const handleBatchAcceptGift = async () => {
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围
  const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
  // 获取目标Token列表（根据执行范围过滤）
  const targetTokens = connectionPool.getTargetTokens(tokens, tokenIndices)
  
  if (targetTokens.length === 0) {
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.warning(`执行范围${rangeText}内没有找到Token`)
    return
  }
  
  const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
  message.info(`开始批量接受礼物（${rangeText}），共${targetTokens.length}个Token...`)
  
  try {
    isBatchAcceptGiftRunning.value = true
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      targetTokens,
      async (token, globalIndex) => {
        try {
          await tokenStore.sendLegacyClaimGift(token.id, {})
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 接受礼物成功`)
          logOperation('shidian', '批量接受礼物', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `接受礼物成功`
          })
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 接受礼物失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 接受礼物失败: ${error.message || error}`)
          logOperation('shidian', '批量接受礼物', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `接受礼物失败: ${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量接受礼物完成')
    logOperation('shidian', '批量接受礼物', {
      cardType: '俱乐部管理',
      status: 'success',
      message: '批量接受礼物完成'
    })
  } catch (error) {
    console.error('批量接受礼物失败:', error)
    message.error('批量接受礼物失败')
    logOperation('shidian', '批量接受礼物', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量接受礼物失败: ${error.message || error}`
    })
  } finally {
    isBatchAcceptGiftRunning.value = false
  }
}

// 导出功法详情
const handleExportLegacyDetails = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }

  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }

  try {
    isExportLegacyDetailsRunning.value = true
    message.info('正在导出功法详情...')

    // 检查WebSocket连接状态
    const connectionStatus = tokenStore.getWebSocketStatus(token.id)
    if (connectionStatus !== 'connected') {
      message.info('正在连接游戏...')
      tokenStore.selectToken(token.id, true)

      let count = 0
      while (tokenStore.getWebSocketStatus(token.id) !== 'connected' && count < 10) {
        await waitCommandDelay()
        count++
      }

      if (tokenStore.getWebSocketStatus(token.id) !== 'connected') {
        message.error('WebSocket连接失败，请稍后重试')
        return
      }
      message.success('游戏连接成功')
    }

    // 获取赠送数据（typ=1）
    const sendData = await tokenStore.sendLegacyGetGifts(token.id, { typ: 1 })
    console.log('赠送数据:', sendData)

    // 获取接受数据（typ=2）
    const receiveData = await tokenStore.sendLegacyGetGifts(token.id, { typ: 2 })
    console.log('接受数据:', receiveData)

    // 统计函数：根据legacyId判断卡片类型
    const getCardType = (legacyId) => {
      if (legacyId === 501) return '金卡'
      if ([401, 402, 403].includes(legacyId)) return '红卡'
      if ([301, 302].includes(legacyId)) return '橙卡'
      if ([201, 202].includes(legacyId)) return '蓝卡'
      if ([101, 102].includes(legacyId)) return '紫卡'
      if ([1, 2].includes(legacyId)) return '绿卡'
      return '未知'
    }

    // 统计结果，按roleId分组，分开统计赠送和接收
    const sendStats = {}   // 赠送数据统计
    const receiveStats = {} // 接收数据统计

    // 处理赠送数据（typ=1）
    // 赠送数据中的targetInfo是接收方的信息，legacyList是赠送的卡片，itemCnt是赠送的功法残卷数量
    // 注意：同一roleId的多次赠送会累加计算（功法残卷累加，卡片数量累加）
    if (sendData && sendData.gifts && Array.isArray(sendData.gifts)) {
      sendData.gifts.forEach(gift => {
        const targetInfo = gift.targetInfo
        const roleId = targetInfo?.roleId || '未知'
        const name = targetInfo?.name || '未知'
        const itemCnt = gift.itemCnt || 0 // 功法残卷数量
        
        // 如果该roleId第一次出现，初始化统计对象
        if (!sendStats[roleId]) {
          sendStats[roleId] = {
            name,
            roleId,
            金卡: 0,
            红卡: 0,
            橙卡: 0,
            蓝卡: 0,
            紫卡: 0,
            绿卡: 0,
            功法残卷: 0
          }
        }

        // 累加功法残卷数量（同一roleId多次赠送会累加）
        sendStats[roleId].功法残卷 += itemCnt

        // 统计卡片数量（同一roleId多次赠送会累加）
        if (gift.legacyList && Array.isArray(gift.legacyList)) {
          gift.legacyList.forEach(legacy => {
            let legacyId = null
            if (legacy.legacyId) {
              legacyId = legacy.legacyId
            } else {
              const numericKeys = Object.keys(legacy).filter(k => {
                const num = parseInt(k)
                return !isNaN(num) && num > 0 && num < 1000
              })
              if (numericKeys.length > 0) {
                legacyId = parseInt(numericKeys[0])
              }
            }
            
            if (legacyId) {
              const cardType = getCardType(legacyId)
              if (cardType !== '未知' && sendStats[roleId][cardType] !== undefined) {
                // 累加卡片数量（同一roleId多次赠送会累加）
                sendStats[roleId][cardType]++
              }
            }
          })
        }
      })
    }

    // 处理接受数据（typ=2）
    // 注意：接收数据中的targetInfo是发送方的信息，itemCnt是接收到的功法残卷数量
    // 注意：同一roleId的多次接收会累加计算（功法残卷累加，卡片数量累加）
    if (receiveData && receiveData.gifts && Array.isArray(receiveData.gifts)) {
      receiveData.gifts.forEach(gift => {
        const targetInfo = gift.targetInfo
        const roleId = targetInfo?.roleId || '未知'
        const name = targetInfo?.name || '未知'
        const itemCnt = gift.itemCnt || 0 // 功法残卷数量
        
        // 如果该roleId第一次出现，初始化统计对象
        if (!receiveStats[roleId]) {
          receiveStats[roleId] = {
            name,
            roleId,
            金卡: 0,
            红卡: 0,
            橙卡: 0,
            蓝卡: 0,
            紫卡: 0,
            绿卡: 0,
            功法残卷: 0
          }
        }

        // 累加功法残卷数量（同一roleId多次接收会累加）
        receiveStats[roleId].功法残卷 += itemCnt

        // 如果legacyList存在，也统计卡片（虽然接收数据中legacyList通常为null）
        // 同一roleId多次接收会累加卡片数量
        if (gift.legacyList && Array.isArray(gift.legacyList)) {
          gift.legacyList.forEach(legacy => {
            let legacyId = null
            if (legacy.legacyId) {
              legacyId = legacy.legacyId
            } else {
              const numericKeys = Object.keys(legacy).filter(k => {
                const num = parseInt(k)
                return !isNaN(num) && num > 0 && num < 1000
              })
              if (numericKeys.length > 0) {
                legacyId = parseInt(numericKeys[0])
              }
            }
            
            if (legacyId) {
              const cardType = getCardType(legacyId)
              if (cardType !== '未知' && receiveStats[roleId][cardType] !== undefined) {
                // 累加卡片数量（同一roleId多次接收会累加）
                receiveStats[roleId][cardType]++
              }
            }
          })
        }
      })
    }

    // 生成导出内容
    const lines = []
    
    // 赠送数据部分
    lines.push('========== 赠送数据 ==========')
    lines.push('昵称,roleId,金卡数量,红卡数量,橙卡数量,蓝卡数量,紫卡数量,绿卡数量,功法残卷数量')
    Object.values(sendStats).forEach(stat => {
      lines.push(
        `${stat.name},${stat.roleId},${stat.金卡},${stat.红卡},${stat.橙卡},${stat.蓝卡},${stat.紫卡},${stat.绿卡},${stat.功法残卷}`
      )
    })
    
    // 空行分隔
    lines.push('')
    
    // 接收数据部分
    lines.push('========== 接收数据 ==========')
    lines.push('昵称,roleId,金卡数量,红卡数量,橙卡数量,蓝卡数量,紫卡数量,绿卡数量,功法残卷数量')
    Object.values(receiveStats).forEach(stat => {
      lines.push(
        `${stat.name},${stat.roleId},${stat.金卡},${stat.红卡},${stat.橙卡},${stat.蓝卡},${stat.紫卡},${stat.绿卡},${stat.功法残卷}`
      )
    })

    // 导出文件
    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `功法详情_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('功法详情已导出成功')
  } catch (error) {
    console.error('导出功法详情失败:', error)
    message.error(`导出功法详情失败: ${error.message || error}`)
  } finally {
    isExportLegacyDetailsRunning.value = false
  }
}

// 处理导出俱乐部信息执行范围输入
const handleExportClubInfoTokensInput = (value) => {
  exportClubInfoTokens.value = value
}

// 导出俱乐部信息
const handleExportClubInfo = async () => {
  try {
    isExportClubInfoRunning.value = true
    message.info('开始导出俱乐部信息...')

    const tokenIndices = parseTokenRange(legionTokens.value)
    const targetTokens = getTargetTokens(tokenIndices)
    
    if (targetTokens.length === 0) {
      message.warning('执行范围内没有有效的Token')
      return
    }

    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`找到 ${targetTokens.length} 个Token（${rangeText}），开始处理...`)

    const clubInfoList = []

    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = i + 1

      try {
        message.info(`[${tokenIndex}/${targetTokens.length}] ${token.name || token.id} 正在连接...`)

        let retryCount = 0
        const maxRetries = 5
        let status = tokenStore.getWebSocketStatus(token.id)

        while (status !== 'connected' && retryCount < maxRetries) {
          tokenStore.selectToken(token.id, true)
          await waitCommandDelay()
          status = tokenStore.getWebSocketStatus(token.id)
          retryCount++

          if (status !== 'connected' && retryCount < maxRetries) {
            message.info(`[${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
          }
        }

        if (status !== 'connected') {
          message.warning(`[${tokenIndex}] ${token.name || token.id} 连接失败，保留昵称`)
          clubInfoList.push({
            nickname: token.name || token.id,
            clubName: '',
            serverId: '',
            roleId: '',
            combined: '',
            legacyFragmentCount: '',
            vipLevel: ''
          })
          continue
        }

        message.success(`[${tokenIndex}] ${token.name || token.id} 连接成功`)

        let nickname = token.name || token.id
        let clubName = ''
        let serverId = ''
        let roleId = ''
        let combined = ''
        let legacyFragmentCount = ''
        let vipLevel = ''

        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id, {})
          nickname = roleInfo?.role?.name || token.name || token.id
          serverId = roleInfo?.role?.realServerId || 0
          roleId = roleInfo?.role?.roleId || 0
          legacyFragmentCount = roleInfo?.role?.items?.[37007]?.quantity || 0
          vipLevel = roleInfo?.role?.vip || 0
          const A = serverId - 27
          combined = String(A) + '+' + String(roleId)
        } catch (error) {
          console.warn(`[${tokenIndex}] ${token.name || token.id} 获取角色信息失败:`, error)
        }

        try {
          const legionInfoRes = await tokenStore.sendLegionGetInfo(token.id, {})
          await waitCommandDelay()
          const legionInfo = legionInfoRes?.legion || legionInfoRes
          clubName = legionInfo?.info?.name || ''
        } catch (error) {
          console.warn(`[${tokenIndex}] ${token.name || token.id} 获取俱乐部信息失败:`, error)
        }

        clubInfoList.push({
          nickname,
          clubName,
          serverId,
          roleId,
          combined,
          legacyFragmentCount,
          vipLevel
        })

        message.success(`[${tokenIndex}] ${nickname} 导出完成`)

        await waitCommandDelay()
      } catch (error) {
        console.error(`[${tokenIndex}] ${token.name || token.id} 处理失败:`, error)
      }
    }

    const lines = []
    lines.push('昵称,俱乐部名称,服务器号,角色号,综合,残卷数量,VIP等级')
    
    clubInfoList.forEach(info => {
      lines.push(`${info.nickname},${info.clubName},${info.serverId},${info.roleId},${info.combined},${info.legacyFragmentCount},${info.vipLevel}`)
    })

    const content = lines.join('\n')
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `俱乐部信息_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success(`俱乐部信息已导出成功，共 ${clubInfoList.length} 条记录`)
    
    logOperation('shidian', '导出俱乐部信息', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'success',
      message: `导出俱乐部信息成功，共 ${clubInfoList.length} 条记录（${rangeText}）`
    })
  } catch (error) {
    console.error('导出俱乐部信息失败:', error)
    message.error(`导出俱乐部信息失败: ${error.message || error}`)
    
    logOperation('shidian', '导出俱乐部信息', {
      cardType: '俱乐部管理',
      tokenId: null,
      tokenName: null,
      status: 'error',
      message: `导出俱乐部信息失败: ${error.message || error}`
    })
  } finally {
    isExportClubInfoRunning.value = false
  }
}

// 图鉴升星和领取奖励（单个）
const handleBookUpgrade = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  try {
    isBookUpgradeRunning.value = true
    message.info('正在执行图鉴升星和领取奖励...')
    
    // 英雄ID列表（101-120, 201-228, 301-314）
    const heroIds = [
      ...Array.from({ length: 20 }, (_, i) => 101 + i),
      ...Array.from({ length: 28 }, (_, i) => 201 + i),
      ...Array.from({ length: 14 }, (_, i) => 301 + i)
    ]
    
    // 1. 图鉴升星：对每个英雄执行10次
    for (const heroId of heroIds) {
      for (let i = 1; i <= 10; i++) {
        try {
          const res = await tokenStore.sendMessageWithPromise(
            token.id,
            'book_upgrade',
            { heroId },
            8000
          )
          const ok = res && (res.code === 0 || res.success === true || res.result === 0)
          if (!ok) break
        } catch (err) {
          break
        }
        await waitCommandDelay()
      }
    }
    
    // 2. 领取图鉴奖励：执行10次
    for (let i = 1; i <= 10; i++) {
      try {
        const res = await tokenStore.sendMessageWithPromise(
          token.id,
          'book_claimpointreward',
          {},
          8000
        )
        const ok = res && (res.code === 0 || res.success === true || res.result === 0)
        if (!ok) break
      } catch (err) {
        break
      }
      await waitCommandDelay()
    }
    
    message.success('图鉴升星和领取奖励完成')
    logOperation('shidian', '图鉴', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `【${token.name || token.id}】图鉴升星和领取奖励完成`
    })
  } catch (error) {
    console.error('图鉴升星失败:', error)
    message.error(`图鉴升星失败: ${error.message || '未知错误'}`)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    logOperation('shidian', '图鉴', {
      cardType: '俱乐部管理',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `图鉴升星失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBookUpgradeRunning.value = false
  }
}

// 批量图鉴升星和领取奖励
const handleBatchBookUpgrade = async () => {
  const tokens = sortedTokens.value
  if (tokens.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  try {
    isBatchBookUpgradeRunning.value = true
    message.info(`开始批量图鉴，共 ${tokens.length} 个Token`)
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          const heroIds = [
            ...Array.from({ length: 20 }, (_, i) => 101 + i),
            ...Array.from({ length: 28 }, (_, i) => 201 + i),
            ...Array.from({ length: 14 }, (_, i) => 301 + i)
          ]
          
          for (const heroId of heroIds) {
            for (let j = 1; j <= 10; j++) {
              try {
                const res = await tokenStore.sendMessageWithPromise(
                  token.id,
                  'book_upgrade',
                  { heroId },
                  8000
                )
                const ok = res && (res.code === 0 || res.success === true || res.result === 0)
                if (!ok) break
              } catch (err) {
                break
              }
              await waitCommandDelay()
            }
          }
          
          for (let j = 1; j <= 10; j++) {
            try {
              const res = await tokenStore.sendMessageWithPromise(
                token.id,
                'book_claimpointreward',
                {},
                8000
              )
              const ok = res && (res.code === 0 || res.success === true || res.result === 0)
              if (!ok) break
            } catch (err) {
              break
            }
            await waitCommandDelay()
          }
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 图鉴完成`)
          logOperation('shidian', '批量图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `【序号${globalIndex + 1}】[${token.name || token.id}]图鉴升星和领取奖励完成`
          })
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 图鉴失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 图鉴失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `图鉴失败: ${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量图鉴完成')
  } catch (error) {
    console.error('批量图鉴失败:', error)
    message.error(`批量图鉴失败: ${error.message || '未知错误'}`)
  } finally {
    isBatchBookUpgradeRunning.value = false
  }
}

// 刷新图鉴信息
const handleRefreshLegacyInfo = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  try {
    isRefreshLegacyInfoRunning.value = true
    message.info('正在刷新图鉴信息...')
    
    await waitCommandDelay()
    const legacyInfo = await tokenStore.sendLegacyGetInfo(token.id, {})
    
    if (!legacyInfo) {
      message.warning('获取功法信息失败')
      return
    }
    
    const roleLegacy = legacyInfo.roleLegacy || {}
    const books = roleLegacy.books || {}
    const legacyStorage = roleLegacy.legacyStorage || {}
    
    const booksCount = {}
    const storageCount = {}
    
    const allLegacyIds = [1, 2, 101, 102, 201, 202, 301, 302, 401, 402, 403, 501]
    
    for (const legacyId of allLegacyIds) {
      const legacyIdStr = String(legacyId)
      booksCount[legacyIdStr] = 0
      storageCount[legacyIdStr] = 0
    }
    
    for (const key of Object.keys(books)) {
      const legacyId = books[key].legacyId
      const legacyIdStr = String(legacyId)
      if (booksCount[legacyIdStr] !== undefined) {
        booksCount[legacyIdStr]++
      }
    }
    
    for (const key of Object.keys(legacyStorage)) {
      const legacyId = legacyStorage[key].legacyId
      const legacyIdStr = String(legacyId)
      if (storageCount[legacyIdStr] !== undefined) {
        storageCount[legacyIdStr]++
      }
    }
    
    legacyBookInfo.value = {
      books: booksCount,
      storage: storageCount
    }
    
    message.success('图鉴信息刷新成功')
    logOperation('shidian', '刷新图鉴信息', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: '图鉴信息刷新成功'
    })
  } catch (error) {
    console.error('刷新图鉴信息失败:', error)
    message.error(`刷新图鉴信息失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '刷新图鉴信息', {
      cardType: '俱乐部管理',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `刷新图鉴信息失败: ${error.message || '未知错误'}`
    })
  } finally {
    isRefreshLegacyInfoRunning.value = false
  }
}

// 功法图鉴激活
const handleLegacyBook = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token) {
    message.error('Token不存在')
    return
  }
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.error('WebSocket未连接，请先连接Token')
    return
  }
  
  try {
    isLegacyBookRunning.value = true
    message.info('正在执行功法图鉴激活...')
    
    // 获取功法信息
    const legacyInfo = await tokenStore.sendLegacyGetInfo(token.id, {})
    
    if (!legacyInfo) {
      message.warning('获取功法信息失败')
      return
    }
    
    const roleLegacy = legacyInfo.roleLegacy || {}
    const legacyStorage = roleLegacy.legacyStorage || {}
    const books = roleLegacy.books || {}
    
    console.log('获取到的功法信息:', {
      books,
      legacyStorage
    })
    
    // 所有可能的legacyId列表
    const allLegacyIds = [1, 2, 101, 102, 201, 202, 301, 302, 401, 402, 403, 501]
    
    let activatedCount = 0
    
    // 遍历所有legacyId
    for (const legacyId of allLegacyIds) {
      // 检查books中是否已有该legacyId
      const bookKeys = Object.keys(books)
      let hasInBooks = false
      for (const key of bookKeys) {
        if (books[key].legacyId === legacyId) {
          hasInBooks = true
          break
        }
      }
      
      console.log(`检查legacyId ${legacyId}: hasInBooks = ${hasInBooks}`)
      
      // 如果books中已有，跳过
      if (hasInBooks) {
        continue
      }
      
      // 检查legacyStorage中是否有该legacyId
      const storageKeys = Object.keys(legacyStorage)
      let foundUId = null
      for (const key of storageKeys) {
        if (legacyStorage[key].legacyId === legacyId) {
          foundUId = legacyStorage[key].uId
          break
        }
      }
      
      console.log(`检查legacyId ${legacyId}: foundUId = ${foundUId}`)
      
      // 如果legacyStorage中有，执行激活
      if (foundUId) {
        try {
          console.log(`执行激活: legacyId = ${legacyId}, uId = ${foundUId}`)
          const res = await tokenStore.sendLegacyActivate(token.id, {
            uId: foundUId
          })
          
          console.log(`激活响应: legacyId = ${legacyId}, res =`, res)
          
          if (res && (res.code === 0 || res.success === true || res.role || res.roleLegacy)) {
            activatedCount++
            message.success(`激活图鉴 ${legacyId} 成功`)
          } else {
            message.warning(`激活图鉴 ${legacyId} 失败: ${res?.message || '未知错误'}`)
          }
        } catch (err) {
          console.error(`激活图鉴 ${legacyId} 失败:`, err)
          message.error(`激活图鉴 ${legacyId} 失败: ${err.message || '未知错误'}`)
        }
        
        // 添加延迟避免请求过快
        await waitCommandDelay()
      }
    }
    
    message.success(`功法图鉴激活完成，共激活 ${activatedCount} 个图鉴`)
    logOperation('shidian', '激活功法图鉴', {
      cardType: '俱乐部管理',
      tokenId: token.id,
      tokenName: token.name,
      status: 'success',
      message: `功法图鉴激活完成，共激活 ${activatedCount} 个图鉴`
    })
  } catch (error) {
    console.error('功法图鉴激活失败:', error)
    message.error(`功法图鉴激活失败: ${error.message || '未知错误'}`)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    logOperation('shidian', '激活功法图鉴', {
      cardType: '俱乐部管理',
      tokenId: props.selectedTokenId,
      tokenName: token?.name,
      status: 'error',
      message: `功法图鉴激活失败: ${error.message || '未知错误'}`
    })
  } finally {
    isLegacyBookRunning.value = false
  }
}

// 批量功法图鉴激活
const handleBatchLegacyBook = async () => {
  try {
    isBatchLegacyBookRunning.value = true
    message.info('开始批量功法图鉴...')
    logOperation('shidian', '批量功法图鉴', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量功法图鉴...'
    })

    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    
    // 获取目标Token列表（根据执行范围过滤）
    const tokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (tokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量功法图鉴', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`开始批量功法图鉴，共 ${tokens.length} 个Token（${rangeText}）`)
    logOperation('shidian', '批量功法图鉴', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `开始批量功法图鉴，共 ${tokens.length} 个Token（${rangeText}）`
    })
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          message.info(`[${globalIndex + 1}/${tokens.length}] ${token.name || token.id} 正在刷新图鉴信息...`)
          
          const legacyInfo = await tokenStore.sendLegacyGetInfo(token.id, {})
          
          if (!legacyInfo) {
            message.warning(`[${globalIndex + 1}] ${token.name || token.id} 获取功法信息失败，跳过`)
            logOperation('shidian', '批量功法图鉴', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `获取功法信息失败，跳过`
            })
            return { success: false, error: '获取功法信息失败' }
          }
          
          const roleLegacy = legacyInfo.roleLegacy || {}
          const books = roleLegacy.books || {}
          const legacyStorage = roleLegacy.legacyStorage || {}
          
          const booksCount = {}
          const storageCount = {}
          
          const allLegacyIds = [1, 2, 101, 102, 201, 202, 301, 302, 401, 402, 403, 501]
          
          for (const legacyId of allLegacyIds) {
            const legacyIdStr = String(legacyId)
            booksCount[legacyIdStr] = 0
            storageCount[legacyIdStr] = 0
          }
          
          for (const key of Object.keys(books)) {
            const legacyId = books[key].legacyId
            const legacyIdStr = String(legacyId)
            if (booksCount[legacyIdStr] !== undefined) {
              booksCount[legacyIdStr]++
            }
          }
          
          for (const key of Object.keys(legacyStorage)) {
            const legacyId = legacyStorage[key].legacyId
            const legacyIdStr = String(legacyId)
            if (storageCount[legacyIdStr] !== undefined) {
              storageCount[legacyIdStr]++
            }
          }
          
          legacyBookInfo.value = {
            books: booksCount,
            storage: storageCount
          }
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 图鉴信息刷新成功`)
          
          message.info(`[${globalIndex + 1}] ${token.name || token.id} 正在激活功法图鉴...`)
          
          let activatedCount = 0
          
          for (const legacyId of allLegacyIds) {
            const legacyIdStr = String(legacyId)
            
            const bookKeys = Object.keys(books)
            let hasInBooks = false
            for (const key of bookKeys) {
              if (books[key].legacyId === legacyId) {
                hasInBooks = true
                break
              }
            }
            
            if (hasInBooks) {
              continue
            }
            
            const storageKeys = Object.keys(legacyStorage)
            let foundUId = null
            for (const key of storageKeys) {
              if (legacyStorage[key].legacyId === legacyId) {
                foundUId = legacyStorage[key].uId
                break
              }
            }
            
            if (foundUId) {
              try {
                const res = await tokenStore.sendLegacyActivate(token.id, {
                  legacyId: legacyId,
                  uId: foundUId
                })
                
                if (res && (res.code === 0 || res.success === true)) {
                  activatedCount++
                }
              } catch (err) {
                console.error(`[${globalIndex + 1}] 激活图鉴 ${legacyId} 失败:`, err)
              }
              
              await waitCommandDelay()
            }
          }
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 功法图鉴完成，激活 ${activatedCount} 个`)
          logOperation('shidian', '批量功法图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `功法图鉴激活完成，共激活 ${activatedCount} 个图鉴`
          })
          return { success: true, activatedCount }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 功法图鉴失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 功法图鉴失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量功法图鉴', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `功法图鉴失败: ${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    message.success('批量功法图鉴完成')
  } catch (error) {
    console.error('批量功法图鉴失败:', error)
    message.error(`批量功法图鉴失败: ${error.message || '未知错误'}`)
  } finally {
    isBatchLegacyBookRunning.value = false
  }
}

// 批量招募周
const handleBatchRecruitWeek = async () => {
  try {
    isBatchRecruitWeekRunning.value = true
    message.info('开始批量招募周...')
    logOperation('shidian', '批量招募周', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量招募周...'
    })

    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    const tokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (tokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到Token`)
      logOperation('shidian', '批量招募周', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`开始批量招募周，共 ${tokens.length} 个Token（${rangeText}）`)
    logOperation('shidian', '批量招募周', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `开始批量招募周，共 ${tokens.length} 个Token（${rangeText}）`
    })

    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          message.info(`[${globalIndex + 1}/${tokens.length}] ${token.name || token.id} 正在获取招募令数量...`)
          
          const roleInfo = await tokenStore.sendGetRoleInfo(token.id)
          const recruitCount = roleInfo?.role?.items?.[1001]?.quantity || roleInfo?.role?.items?.[1001]?.num || 0
          
          if (recruitCount < 10) {
            message.warning(`[${globalIndex + 1}] ${token.name || token.id} 招募令数量不足（${recruitCount}），跳过`)
            logOperation('shidian', '批量招募周', {
              cardType: '俱乐部管理',
              tokenId: token.id,
              tokenName: token.name,
              status: 'warning',
              message: `招募令数量不足（${recruitCount}），跳过`
            })
            return { success: false, recruitCount, rounds: 0 }
          }
          
          message.info(`[${globalIndex + 1}] ${token.name || token.id} 当前招募令数量: ${recruitCount}`)
          
          let currentRecruitCount = recruitCount
          let totalRounds = 0
          let totalRecruits = 0
          let mailClaimCount = 0
          
          while (currentRecruitCount >= 10) {
            const recruitNumber = Math.min(10, currentRecruitCount)
            
            try {
              await tokenStore.sendGameMessage(token.id, 'hero_recruit', {
                recruitNumber: recruitNumber,
                recruitType: 3,
                byClub: false
              })
              
              currentRecruitCount -= recruitNumber
              totalRecruits += recruitNumber
              
              message.success(`[${globalIndex + 1}] ${token.name || token.id} 使用${recruitNumber}个招募令进行招募`)
              
              await waitCommandDelay()
              
              if (totalRecruits > 0 && totalRecruits % 100 === 0) {
                try {
                  await tokenStore.sendGameMessage(token.id, 'mail_claimallattachment', {})
                  mailClaimCount++
                  message.success(`[${globalIndex + 1}] ${token.name || token.id} 领取邮件附件成功`)
                  
                  await waitCommandDelay()
                } catch (mailError) {
                  console.error(`[${globalIndex + 1}] ${token.name || token.id} 领取邮件失败:`, mailError)
                }
              }
              
              if (totalRecruits > 0 && totalRecruits % 400 === 0) {
                totalRounds++
                currentRecruitCount += 40
                message.info(`[${globalIndex + 1}] ${token.name || token.id} 完成第${totalRounds}轮招募周，获得40招募令奖励`)
              }
            } catch (recruitError) {
              console.error(`[${globalIndex + 1}] ${token.name || token.id} 招募失败:`, recruitError)
              message.error(`[${globalIndex + 1}] ${token.name || token.id} 招募失败: ${recruitError.message || '未知错误'}`)
              break
            }
          }
          
          const successMsg = `${token.name || token.id} 招募周完成，共招募${totalRecruits}个，完成${totalRounds}轮，领取邮件${mailClaimCount}次，剩余招募令${currentRecruitCount}个`
          message.success(successMsg)
          logOperation('shidian', '批量招募周', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `招募周完成，共招募${totalRecruits}个，完成${totalRounds}轮，领取邮件${mailClaimCount}次，剩余招募令${currentRecruitCount}个`
          })
          
          return { 
            success: true, 
            recruitCount, 
            rounds: totalRounds, 
            totalRecruits, 
            mailClaimCount,
            remainingRecruit: currentRecruitCount
          }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 招募周失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 招募周失败: ${error.message || '未知错误'}`)
          logOperation('shidian', '批量招募周', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `招募周失败: ${error.message || '未知错误'}`
          })
          return { success: false, error: error.message || '未知错误' }
        }
      },
      {
        batchSize: 20,
        delayBetween: 500,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个Token）...`)
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
    
    const totalTokens = results.length
    const successCount = results.filter(r => r.success).length
    const totalRounds = results.reduce((sum, r) => sum + (r.rounds || 0), 0)
    const totalRecruits = results.reduce((sum, r) => sum + (r.totalRecruits || 0), 0)
    const totalMailClaims = results.reduce((sum, r) => sum + (r.mailClaimCount || 0), 0)
    
    let summaryMessage = `批量招募周完成，共处理${totalTokens}个Token`
    if (successCount > 0) {
      summaryMessage += `，成功${successCount}个`
    }
    if (totalRounds > 0) {
      summaryMessage += `，共完成${totalRounds}轮`
    }
    if (totalRecruits > 0) {
      summaryMessage += `，共招募${totalRecruits}个`
    }
    if (totalMailClaims > 0) {
      summaryMessage += `，领取邮件${totalMailClaims}次`
    }
    
    message.success(summaryMessage)
    logOperation('shidian', '批量招募周', {
      cardType: '俱乐部管理',
      status: 'success',
      message: summaryMessage
    })
  } catch (error) {
    console.error('批量招募周失败:', error)
    message.error(`批量招募周失败: ${error.message || '未知错误'}`)
    logOperation('shidian', '批量招募周', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量招募周失败: ${error.message || '未知错误'}`
    })
  } finally {
    isBatchRecruitWeekRunning.value = false
  }
}

// 批量开启功法挂机
const handleBatchLegacyBeginHangup = async () => {
  try {
    isBatchLegacyBeginHangupRunning.value = true
    message.info('开始批量开启功法挂机...')
    logOperation('shidian', '批量开启功法挂机', {
      cardType: '俱乐部管理',
      status: 'info',
      message: '开始批量开启功法挂机...'
    })

    // 解析执行范围
    const tokenIndices = connectionPool.parseTokenRange(legionTokens.value)
    
    // 获取目标 Token 列表（根据执行范围过滤）
    const tokens = connectionPool.getTargetTokens(sortedTokens.value, tokenIndices)

    if (tokens.length === 0) {
      const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
      message.warning(`执行范围${rangeText}内没有找到 Token`)
      logOperation('shidian', '批量开启功法挂机', {
        cardType: '俱乐部管理',
        status: 'warning',
        message: `执行范围${rangeText}内没有找到 Token`
      })
      return
    }
    
    const rangeText = tokenIndices === null ? '全部' : `范围${legionTokens.value}`
    message.info(`开始批量开启功法挂机，共 ${tokens.length} 个 Token（${rangeText}）`)
    logOperation('shidian', '批量开启功法挂机', {
      cardType: '俱乐部管理',
      status: 'info',
      message: `开始批量开启功法挂机，共 ${tokens.length} 个 Token（${rangeText}）`
    })
    
    // 使用连接池的批量操作功能
    const results = await connectionPool.batchOperate(
      tokens,
      async (token, globalIndex) => {
        try {
          message.info(`[${globalIndex + 1}/${tokens.length}] ${token.name || token.id} 正在开启功法挂机...`)
          
          // 等待执行间隔后执行
          await waitCommandDelay()
          
          // 先发送 legacy_getinfo 获取功法信息
          console.log(`[${globalIndex + 1}] ${token.name || token.id} 正在获取功法信息...`);
          await tokenStore.sendLegacyGetInfo(token.id, {});
          await waitCommandDelay();
          
          // 发送 legacy_beginhangup 开始挂机
          await tokenStore.sendLegacyBeginHangup(token.id, {})
          
          message.success(`[${globalIndex + 1}] ${token.name || token.id} 开启功法挂机成功`)
          logOperation('shidian', '批量开启功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'success',
            message: `开启功法挂机成功`
          })
          
          return { success: true }
        } catch (error) {
          console.error(`[${globalIndex + 1}] ${token.name || token.id} 开启功法挂机失败:`, error)
          message.error(`[${globalIndex + 1}] ${token.name || token.id} 开启功法挂机失败：${error.message || error}`)
          logOperation('shidian', '批量开启功法挂机', {
            cardType: '俱乐部管理',
            tokenId: token.id,
            tokenName: token.name,
            status: 'error',
            message: `开启功法挂机失败：${error.message || error}`
          })
          return { success: false, error: error.message || error }
        }
      },
      {
        batchSize: 20,
        delayBetween: 300,
        onProgress: (progress) => {
          if (progress.type === 'batch-start') {
            message.info(`正在处理第 ${progress.batchIndex} 组（${progress.batchSize}个 Token）...`)
          } else if (progress.type === 'token-start') {
            message.info(`${progress.tokenName} 正在获取连接...`)
          } else if (progress.type === 'token-success') {
            message.success(`${progress.tokenName} 连接成功`)
          } else if (progress.type === 'token-error') {
            if (progress.status === 'warning') {
              message.warning(`${progress.tokenName} ${progress.message}`)
            } else {
              message.error(`${progress.tokenName} ${progress.message}`)
            }
          }
        }
      }
    )
    
    // 统计结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const failedTokens = results.filter(r => !r.success).map(r => r.token.name)
    
    if (failCount > 0) {
      const failedTokensStr = failedTokens.join('、')
      message.success(`批量开启功法挂机完成：成功${successCount}个，失败${failCount}个。失败的 Token：${failedTokensStr}`)
      logOperation('shidian', '批量开启功法挂机', {
        cardType: '俱乐部管理',
        status: 'success',
        message: `【批量】批量开启功法挂机完成：成功${successCount}个，失败${failCount}个。失败的 Token：${failedTokensStr}`
      })
    } else {
      message.success(`批量开启功法挂机完成：成功${successCount}个，失败${failCount}个`)
      logOperation('shidian', '批量开启功法挂机', {
        cardType: '俱乐部管理',
        status: 'success',
        message: `【批量】批量开启功法挂机完成：成功${successCount}个，失败${failCount}个`
      })
    }
  } catch (error) {
    console.error('批量开启功法挂机失败:', error)
    message.error(`批量开启功法挂机失败：${error.message || error}`)
    logOperation('shidian', '批量开启功法挂机', {
      cardType: '俱乐部管理',
      status: 'error',
      message: `【批量】批量开启功法挂机失败：${error.message || error}`
    })
  } finally {
    isBatchLegacyBeginHangupRunning.value = false
  }
}
</script>

<style scoped>
.club-management-content {
  width: 100%;
}

.legacy-book-table-container {
  margin-bottom: 16px;
  width: 100%;
  overflow-x: auto;
}

.legacy-book-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.legacy-book-table th,
.legacy-book-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: center;
  min-width: 60px;
}

.legacy-book-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.legacy-book-table td {
  background-color: white;
}
</style>
