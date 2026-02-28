<template>
  <MyCard class="helper" status-class="active">
    <template #icon>
      <n-icon size="24">
        <Settings />
      </n-icon>
    </template>
    <template #title>
      <h3>资源管理</h3>
    </template>
    <template #badge>
      <span>已就绪</span>
    </template>
    <template #default>
      <div class="resource-management-list">
        <!-- 资源管理按钮区域 -->
        <CustomizedCard mode="container">
          <!-- 原有的资源管理按钮 -->
          <CustomizedCard mode="button" name="使用" @click="useAllResources" :loading="isUsingResources" />
          <CustomizedCard mode="button" name="批量使用" @click="batchUseResources" :loading="isBatchUsingResources" />
          <CustomizedCard mode="button" name="刷新" @click="refreshItemCounts" :loading="isRefreshingItems" />
          
          <!-- 执行范围输入框 -->
          <CustomizedCard 
            mode="execution-range" 
            name="执行范围" 
            v-model:inputValue="resourceTokens" 
            placeholder="留空执行全部，或输入 1-20 或 1,2,3" 
            @update:inputValue="handleResourceTokensInput" 
          />
        
          <!-- 资源项列表 -->
          <CustomizedCard 
            v-for="item in itemTypes" 
            :key="item.id" 
            mode="name-count" 
            :name="item.name" 
            :count="String(getItemCount(item.id))"
            @click="handleUseBag(item.id)"
            style="cursor: pointer;"
          />
        </CustomizedCard>

        <!-- 批量任务操作区域 -->
        <CustomizedCard mode="container">
          <!-- 任务多选区域 -->
          <div class="task-checkbox-container">
            <CustomizedCard 
              v-for="task in batchTasks" 
              :key="task.id"
              mode="name-switch"
              :name="task.name"
              v-model:switchValue="task.selected"
            />
          </div>

          <!-- 执行按钮 -->
          <CustomizedCard 
            mode="button" 
            name="执行选中任务" 
            @click="executeSelectedTasks" 
            :loading="isExecutingTasks" 
            :disabled="!hasSelectedTasks"
          />
        </CustomizedCard>

        <!-- 分组管理区域 -->
        <CustomizedCard mode="container">
          <!-- 分组管理按钮 -->
          <CustomizedCard 
            mode="button" 
            name="管理分组" 
            @click="showGroupManageModal = true" 
          />

          <!-- 执行范围按钮 -->
          <CustomizedCard 
            mode="button" 
            name="执行范围" 
            @click="showExecutionRangeModal = true" 
          />

          <!-- 分组名称下拉 -->
          <CustomizedCard 
            mode="name-select"
            name="选择分组"
            v-model:selectValue="selectedGroupId"
            :selectOptions="groupSelectOptions"
            placeholder="选择分组"
            @update:selectValue="handleGroupSelect"
          />

          <!-- 清空按钮 -->
          <CustomizedCard 
            mode="button" 
            name="清空分组" 
            @click="clearSelectedGroup" 
            :disabled="!selectedGroupId"
          />
        </CustomizedCard>
      </div>
      
      <!-- 操作日志 -->
      <OperationLogCard 
        page="fish-helper" 
        :filter-operations="[]"
      />
    </template>
  </MyCard>

  <!-- 分组管理模态框 -->
  <n-modal
    v-model:show="showGroupManageModal"
    preset="card"
    title="分组管理"
    style="width: 90%; max-width: 800px"
  >
    <div class="group-management-content">
      <!-- 创建新分组 -->
      <n-divider title-placement="left" style="margin: 0 0 16px 0">
        创建新分组
      </n-divider>
      <n-space style="margin-bottom: 24px">
        <n-input
          v-model:value="newGroupName"
          placeholder="输入分组名称"
          style="width: 200px"
          size="small"
        />
        <div style="display: flex; gap: 8px; align-items: center">
          <span style="font-size: 12px">选择颜色:</span>
          <div style="display: flex; gap: 6px">
            <div
              v-for="color in groupColors"
              :key="color"
              :style="{
                width: '24px',
                height: '24px',
                backgroundColor: color,
                borderRadius: '4px',
                border: newGroupColor === color ? '3px solid #000' : '2px solid #ddd',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }"
              @click="newGroupColor = color"
              @mouseover="$event.target.style.transform = 'scale(1.1)'"
              @mouseleave="$event.target.style.transform = 'scale(1)'"
            />
          </div>
        </div>
        <n-button type="primary" size="small" @click="createNewGroup">
          创建分组
        </n-button>
      </n-space>

      <!-- 分组列表 -->
      <n-divider title-placement="left" style="margin: 0 0 16px 0">
        分组列表
      </n-divider>
      <div
        style="
          max-height: 500px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
        "
      >
        <div
          v-for="group in tokenGroups"
          :key="group.id"
          style="
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 12px;
            background: #fafafa;
          "
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
            "
          >
            <div style="flex: 1">
              <!-- 编辑模式 -->
              <div
                v-if="editingGroupId === group.id"
                style="display: flex; gap: 8px"
              >
                <n-input
                  v-model:value="editingGroupName"
                  placeholder="分组名称"
                  size="small"
                  style="width: 150px"
                />
                <div style="display: flex; gap: 6px; align-items: center">
                  <div
                    v-for="color in groupColors"
                    :key="color"
                    :style="{
                      width: '20px',
                      height: '20px',
                      backgroundColor: color,
                      borderRadius: '4px',
                      border: editingGroupColor === color ? '3px solid #000' : '2px solid #ddd',
                      cursor: 'pointer',
                    }"
                    @click="editingGroupColor = color"
                  />
                </div>
                <n-button
                  size="small"
                  type="primary"
                  @click="saveEditGroup"
                  style="width: 60px"
                >
                  保存
                </n-button>
                <n-button
                  size="small"
                  @click="cancelEditGroup"
                  style="width: 60px"
                >
                  取消
                </n-button>
              </div>
              <!-- 显示模式 -->
              <div v-else>
                <div
                  style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                  "
                >
                  <div
                    :style="{
                      width: '16px',
                      height: '16px',
                      backgroundColor: group.color,
                      borderRadius: '3px',
                    }"
                  />
                  <span style="font-weight: 500; font-size: 14px">
                    {{ group.name }}
                  </span>
                  <n-tag size="small" type="info">
                    {{ getValidGroupTokenIds(group.id).length }} 个账号
                  </n-tag>
                </div>
                <div
                  style="
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                    margin-bottom: 8px;
                  "
                >
                  <div
                    v-for="tokenId in getValidGroupTokenIds(group.id)"
                    :key="tokenId"
                    style="
                      padding: 2px 8px;
                      background: white;
                      border: 1px solid #ddd;
                      border-radius: 4px;
                      font-size: 12px;
                      display: flex;
                      align-items: center;
                      gap: 4px;
                    "
                  >
                    {{ tokens.find((t) => t.id === tokenId)?.name }}
                    <n-button
                      size="tiny"
                      type="error"
                      text
                      @click="removeTokenFromGroup(group.id, tokenId)"
                    >
                      ×
                    </n-button>
                  </div>
                </div>
                <!-- 添加token到分组 -->
                <div style="margin-bottom: 8px">
                  <n-select
                    placeholder="添加账号到分组"
                    size="small"
                    filterable
                    :options="
                      tokens
                        .filter(
                          (t) =>
                            !getValidGroupTokenIds(group.id).includes(t.id),
                        )
                        .map((t) => ({ label: t.name, value: t.id }))
                    "
                    @update:value="
                      (tokenId) => {
                        if (tokenId) {
                          addTokenToGroup(group.id, tokenId);
                        }
                      }
                    "
                  />
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div
              style="display: flex; gap: 8px"
              v-if="editingGroupId !== group.id"
            >
              <n-button size="small" @click="startEditGroup(group.id)">
                编辑
              </n-button>
              <n-button
                size="small"
                type="error"
                @click="deleteGroup(group.id)"
              >
                删除
              </n-button>
            </div>
          </div>
        </div>

        <div
          v-if="tokenGroups.length === 0"
          style="text-align: center; padding: 24px; color: #86909c"
        >
          暂无分组，请创建一个新分组
        </div>
      </div>

      <!-- 关闭按钮 -->
      <div style="margin-top: 20px; text-align: right">
        <n-button @click="showGroupManageModal = false">关闭</n-button>
      </div>
    </div>
  </n-modal>

  <!-- 执行范围模态框 -->
  <n-modal
    v-model:show="showExecutionRangeModal"
    preset="card"
    title="执行范围设置"
    style="width: 90%; max-width: 600px"
  >
    <div class="execution-range-content">
      <n-space vertical style="width: 100%">
        <div>
          <label style="font-weight: 500; margin-bottom: 8px; display: block">
            按Token序号执行
          </label>
          <n-input
            v-model:value="executionRangeInput"
            placeholder="输入范围，如：1-30 或 1,2,3"
            size="medium"
            style="width: 100%"
          />
          <div style="font-size: 12px; color: #86909c; margin-top: 4px">
            按照Token名称顺序，输入1-30，将1-30加入执行范围
          </div>
        </div>

        <div>
          <label style="font-weight: 500; margin-bottom: 8px; display: block">
            当前Token列表（按名称排序）
          </label>
          <div
            style="
              max-height: 300px;
              overflow-y: auto;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
            "
          >
            <div
              v-for="(token, index) in sortedTokens"
              :key="token.id"
              style="
                padding: 6px 12px;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                align-items: center;
                gap: 8px;
              "
            >
              <span style="font-weight: 500; min-width: 40px">
                {{ index + 1 }}.
              </span>
              <span>{{ token.name }}</span>
            </div>
          </div>
        </div>

        <div style="text-align: right; margin-top: 16px">
          <n-button @click="showExecutionRangeModal = false" style="margin-right: 12px">
            取消
          </n-button>
          <n-button @click="applyExecutionRange" style="margin-right: 12px">
            应用
          </n-button>
          <n-button type="primary" @click="applyExecutionRangeAndAddToGroup" :disabled="!selectedGroupId">
            应用并添加到分组
          </n-button>
        </div>
      </n-space>
    </div>
  </n-modal>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
import { useTokenStore, gameTokens, tokenGroups } from '@/stores/tokenStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useMessage } from 'naive-ui'
import MyCard from '@/components/Common/MyCard.vue'
import CustomizedCard from '@/diy/CustomizedCard.vue'
import OperationLogCard from '@/diy/OneClickGoldFish/OperationLogCard.vue'
import { Settings } from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const logStore = useOperationLogStore()
const message = useMessage()

const props = defineProps({
  selectedTokenId: {
    type: String,
    default: null
  }
})

// 操作状态
const isUsingResources = ref(false)
const isBatchUsingResources = ref(false)
const isRefreshingItems = ref(false)
const isExecutingTasks = ref(false)

// 执行范围
const resourceTokens = ref('')
const executionRangeInput = ref('')

// 分组管理状态
const showGroupManageModal = ref(false)
const showExecutionRangeModal = ref(false)
const newGroupName = ref('')
const newGroupColor = ref('#1677ff')
const editingGroupId = ref(null)
const editingGroupName = ref('')
const editingGroupColor = ref('')
const selectedGroupId = ref(null)

// 分组颜色
const groupColors = [
  '#1677ff',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
]

// 批量任务列表
const batchTasks = ref([
  { id: 'claimHangUp', name: '领取挂机', selected: false },
  { id: 'addHangUpTime', name: '一键加钟', selected: false },
  { id: 'resetBottles', name: '重置罐子', selected: false },
  { id: 'claimBottles', name: '一键领取罐子', selected: false },
  { id: 'climbTower', name: '一键爬塔', selected: false },
  { id: 'climbWeirdTower', name: '一键爬怪异塔', selected: false },
  { id: 'batchUseItems', name: '一键使用怪异塔道具', selected: false },
  { id: 'batchMergeItems', name: '一键怪异塔合成', selected: false },
  { id: 'batchStudy', name: '一键答题', selected: false },
  { id: 'batchSmartSendCar', name: '智能发车', selected: false },
  { id: 'batchClaimCars', name: '一键收车', selected: false },
  { id: 'batchOpenBox', name: '批量开箱', selected: false },
  { id: 'batchClaimBoxPointReward', name: '领取宝箱积分', selected: false },
  { id: 'batchFish', name: '批量钓鱼', selected: false },
  { id: 'batchRecruit', name: '批量招募', selected: false },
  { id: 'batchHeroUpgrade', name: '一键英雄升星', selected: false },
  { id: 'batchBookUpgrade', name: '一键图鉴升星', selected: false },
  { id: 'batchClaimStarRewards', name: '一键领取图鉴奖励', selected: false },
  { id: 'batchbaoku13', name: '一键宝库前3层', selected: false },
  { id: 'batchbaoku45', name: '一键宝库4,5层', selected: false },
  { id: 'batchmengjing', name: '一键梦境', selected: false },
  { id: 'batchclubsign', name: '一键俱乐部签到', selected: false },
  { id: 'batcharenafight', name: '一键竞技场战斗3次', selected: false },
  { id: 'batchTopUpFish', name: '一键钓鱼补齐', selected: false },
  { id: 'batchTopUpArena', name: '一键竞技场补齐', selected: false },
  { id: 'batchClaimFreeEnergy', name: '一键领取怪异塔免费道具', selected: false },
  { id: 'legion_storebuygoods', name: '一键购买四圣碎片', selected: false },
  { id: 'legionStoreBuySkinCoins', name: '一键购买俱乐部5皮肤币', selected: false },
  { id: 'store_purchase', name: '一键黑市采购', selected: false },
  { id: 'collection_claimfreereward', name: '免费领取珍宝阁', selected: false },
  { id: 'batchLegacyClaim', name: '批量功法残卷领取', selected: false },
  { id: 'skinChallenge', name: '一键换皮闯关', selected: false },
  { id: 'batchClaimPeachTasks', name: '一键领取蟠桃园任务', selected: false },
  { id: 'batchGenieSweep', name: '一键灯神扫荡', selected: false },
])

// 计算属性
const tokens = computed(() => tokenStore.gameTokens)

const sortedTokens = computed(() => {
  return [...tokens.value].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

const hasSelectedTasks = computed(() => {
  return batchTasks.value.some(task => task.selected)
})

const groupSelectOptions = computed(() => {
  return tokenGroups.value.map(group => ({
    label: group.name,
    value: group.id
  }))
})

// 处理执行范围输入
const handleResourceTokensInput = (value) => {
  resourceTokens.value = value
}

// 处理分组选择
const handleGroupSelect = (groupId) => {
  selectedGroupId.value = groupId
}

// 解析执行范围（如果为空则执行全部）
const parseTokenRange = (rangeStr) => {
  if (!rangeStr || !rangeStr.trim()) {
    return null
  }
  
  const tokens = []
  const parts = rangeStr.split(',')
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tokens.push(i)
        }
      }
    } else {
      const num = Number(trimmed)
      if (!isNaN(num)) {
        tokens.push(num)
      }
    }
  }
  
  return tokens.length > 0 ? tokens : null
}

// 应用执行范围
const applyExecutionRange = () => {
  const rangeStr = executionRangeInput.value.trim()
  if (!rangeStr) {
    message.warning('请输入执行范围')
    return
  }
  
  resourceTokens.value = rangeStr
  showExecutionRangeModal.value = false
  message.success('执行范围已应用')
}

// 应用执行范围并添加到分组
const applyExecutionRangeAndAddToGroup = () => {
  if (!selectedGroupId.value) {
    message.warning('请先选择分组')
    return
  }
  
  const rangeStr = executionRangeInput.value.trim()
  if (!rangeStr) {
    message.warning('请输入执行范围')
    return
  }
  
  const tokenIndices = parseTokenRange(rangeStr)
  if (!tokenIndices || tokenIndices.length === 0) {
    message.warning('执行范围无效')
    return
  }
  
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  let addedCount = 0
  const group = tokenGroups.value.find(g => g.id === selectedGroupId.value)
  
  for (const index of tokenIndices) {
    const arrayIndex = index - 1
    const token = sortedTokensList[arrayIndex]
    
    if (token) {
      const currentGroupTokens = getValidGroupTokenIds(selectedGroupId.value)
      if (!currentGroupTokens.includes(token.id)) {
        tokenStore.addTokenToGroup(selectedGroupId.value, token.id)
        addedCount++
      }
    }
  }
  
  resourceTokens.value = rangeStr
  showExecutionRangeModal.value = false
  
  if (group) {
    message.success(`已将${addedCount}个Token添加到分组"${group.name}"`)
  } else {
    message.success(`已将${addedCount}个Token添加到分组`)
  }
}

// 清空选中的分组
const clearSelectedGroup = () => {
  if (!selectedGroupId.value) {
    return
  }
  
  if (confirm('确定要清空该分组的所有Token吗？')) {
    const group = tokenGroups.value.find(g => g.id === selectedGroupId.value)
    if (group) {
      const tokenIds = getValidGroupTokenIds(group.id)
      tokenIds.forEach(tokenId => {
        tokenStore.removeTokenFromGroup(group.id, tokenId)
      })
      message.success(`已清空分组"${group.name}"的所有Token`)
    }
  }
}

// 执行选中的任务
const executeSelectedTasks = async () => {
  const selectedTasks = batchTasks.value.filter(task => task.selected)
  if (selectedTasks.length === 0) {
    message.warning('请至少选择一个任务')
    return
  }
  
  // 按token昵称排序的token列表（与页面显示顺序一致）
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  // 解析执行范围（如果为空则执行全部）
  const tokenIndices = parseTokenRange(resourceTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  // 获取每个token在sortedTokens中的序号（用于显示）
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  try {
    isExecutingTasks.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    const taskNames = selectedTasks.map(t => t.name).join('、')
    message.info(`开始执行选中任务（${rangeText}），共${targetTokens.length}个Token，${selectedTasks.length}个任务...`)
    
    logStore.addLog({
      page: 'fish-helper',
      cardType: '资源管理',
      operation: `批量执行任务(${taskNames})`,
      status: 'info',
      message: `开始执行选中任务（${rangeText}），共${targetTokens.length}个Token，${selectedTasks.length}个任务`
    })
    
    let successCount = 0
    let failCount = 0
    const failedTokens = []
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      try {
        // 连接Token
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在连接...`)
        tokenStore.selectToken(token.id, true)
        
        // 等待连接，最多重试5次
        let retryCount = 0
        const maxRetries = 5
        let status = tokenStore.getWebSocketStatus(token.id)
        
        while (status !== 'connected' && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          status = tokenStore.getWebSocketStatus(token.id)
          retryCount++
          
          if (status !== 'connected' && retryCount < maxRetries) {
            message.info(`[序号${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
            tokenStore.selectToken(token.id, true)
          }
        }
        
        if (status !== 'connected') {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          failedTokens.push(token.name || token.id)
          failCount++
          continue
        }
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 连接成功`)
        
        // 执行选中的任务
        for (const task of selectedTasks) {
          try {
            message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在执行：${task.name}`)
            await executeTask(token.id, task.id)
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (error) {
            console.error(`[序号${tokenIndex}] ${token.name || token.id} 执行${task.name}失败:`, error)
            message.warning(`[序号${tokenIndex}] ${token.name || token.id}: ${task.name}失败`)
          }
        }
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 所有任务执行完成`)
        successCount++
        
        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 执行任务失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 执行失败 - ${error.message || '未知错误'}`)
        failCount++
      }
    }
    
    message.success(`任务执行完成（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('执行任务失败:', error)
    message.error('执行任务失败: ' + (error.message || '未知错误'))
  } finally {
    isExecutingTasks.value = false
  }
}

// 执行单个任务
const executeTask = async (tokenId, taskId) => {
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接')
  }
  
  // 根据任务ID执行不同的操作
  switch (taskId) {
    case 'claimHangUp':
      await tokenStore.sendMessageWithPromise(tokenId, 'hangup_claim', {}, 5000)
      break
    case 'addHangUpTime':
      await tokenStore.sendMessageWithPromise(tokenId, 'hangup_addtime', {}, 5000)
      break
    case 'resetBottles':
      await tokenStore.sendMessageWithPromise(tokenId, 'bottle_reset', {}, 5000)
      break
    case 'claimBottles':
      await tokenStore.sendMessageWithPromise(tokenId, 'bottle_claim', {}, 5000)
      break
    case 'climbTower':
      await tokenStore.sendMessageWithPromise(tokenId, 'tower_climb', {}, 5000)
      break
    case 'climbWeirdTower':
      await tokenStore.sendMessageWithPromise(tokenId, 'weirdtower_climb', {}, 5000)
      break
    case 'batchUseItems':
      await tokenStore.sendMessageWithPromise(tokenId, 'weirdtower_useitems', {}, 5000)
      break
    case 'batchMergeItems':
      await tokenStore.sendMessageWithPromise(tokenId, 'weirdtower_mergeitems', {}, 5000)
      break
    case 'batchStudy':
      await tokenStore.sendMessageWithPromise(tokenId, 'study_answer', {}, 5000)
      break
    case 'batchSmartSendCar':
      await tokenStore.sendMessageWithPromise(tokenId, 'car_smartsend', {}, 5000)
      break
    case 'batchClaimCars':
      await tokenStore.sendMessageWithPromise(tokenId, 'car_claim', {}, 5000)
      break
    case 'batchOpenBox':
      await tokenStore.sendMessageWithPromise(tokenId, 'box_open', {}, 5000)
      break
    case 'batchClaimBoxPointReward':
      await tokenStore.sendMessageWithPromise(tokenId, 'box_claimreward', {}, 5000)
      break
    case 'batchFish':
      await tokenStore.sendMessageWithPromise(tokenId, 'fish_fish', {}, 5000)
      break
    case 'batchRecruit':
      await tokenStore.sendMessageWithPromise(tokenId, 'recruit_recruit', {}, 5000)
      break
    case 'batchHeroUpgrade':
      await tokenStore.sendMessageWithPromise(tokenId, 'hero_upgrade', {}, 5000)
      break
    case 'batchBookUpgrade':
      await tokenStore.sendMessageWithPromise(tokenId, 'book_upgrade', {}, 5000)
      break
    case 'batchClaimStarRewards':
      await tokenStore.sendMessageWithPromise(tokenId, 'book_claimreward', {}, 5000)
      break
    case 'batchbaoku13':
      await tokenStore.sendMessageWithPromise(tokenId, 'baoku_sweep13', {}, 5000)
      break
    case 'batchbaoku45':
      await tokenStore.sendMessageWithPromise(tokenId, 'baoku_sweep45', {}, 5000)
      break
    case 'batchmengjing':
      await tokenStore.sendMessageWithPromise(tokenId, 'mengjing_sweep', {}, 5000)
      break
    case 'batchclubsign':
      await tokenStore.sendMessageWithPromise(tokenId, 'club_sign', {}, 5000)
      break
    case 'batcharenafight':
      await tokenStore.sendMessageWithPromise(tokenId, 'arena_fight', {}, 5000)
      break
    case 'batchTopUpFish':
      await tokenStore.sendMessageWithPromise(tokenId, 'fish_topup', {}, 5000)
      break
    case 'batchTopUpArena':
      await tokenStore.sendMessageWithPromise(tokenId, 'arena_topup', {}, 5000)
      break
    case 'batchClaimFreeEnergy':
      await tokenStore.sendMessageWithPromise(tokenId, 'weirdtower_claimfree', {}, 5000)
      break
    case 'legion_storebuygoods':
      await tokenStore.sendMessageWithPromise(tokenId, 'legion_storebuygoods', {}, 5000)
      break
    case 'legionStoreBuySkinCoins':
      await tokenStore.sendMessageWithPromise(tokenId, 'legion_storebuyskincoins', {}, 5000)
      break
    case 'store_purchase':
      await tokenStore.sendMessageWithPromise(tokenId, 'store_purchase', {}, 5000)
      break
    case 'collection_claimfreereward':
      await tokenStore.sendMessageWithPromise(tokenId, 'collection_claimfreereward', {}, 5000)
      break
    case 'batchLegacyClaim':
      await tokenStore.sendMessageWithPromise(tokenId, 'legacy_claim', {}, 5000)
      break
    case 'skinChallenge':
      await tokenStore.sendMessageWithPromise(tokenId, 'skin_challenge', {}, 5000)
      break
    case 'batchClaimPeachTasks':
      await tokenStore.sendMessageWithPromise(tokenId, 'peach_claimtasks', {}, 5000)
      break
    case 'batchGenieSweep':
      await tokenStore.sendMessageWithPromise(tokenId, 'genie_sweep', {}, 5000)
      break
    default:
      throw new Error(`未知任务: ${taskId}`)
  }
}

// 分组管理方法
const createNewGroup = () => {
  if (!newGroupName.value.trim()) {
    message.warning('请输入分组名称')
    return
  }

  tokenStore.createTokenGroup(newGroupName.value.trim(), newGroupColor.value)
  message.success('分组创建成功')
  newGroupName.value = ''
  newGroupColor.value = '#1677ff'
}

const deleteGroup = (groupId) => {
  if (confirm('确定要删除这个分组吗？分组中的token不会被删除。')) {
    tokenStore.deleteTokenGroup(groupId)
    message.success('分组已删除')
  }
}

const saveEditGroup = () => {
  if (!editingGroupId.value) return

  if (!editingGroupName.value.trim()) {
    message.warning('请输入分组名称')
    return
  }

  tokenStore.updateTokenGroup(editingGroupId.value, {
    name: editingGroupName.value.trim(),
    color: editingGroupColor.value,
  })

  message.success('分组已更新')
  editingGroupId.value = null
  editingGroupName.value = ''
  editingGroupColor.value = ''
}

const startEditGroup = (groupId) => {
  const group = tokenGroups.value.find((g) => g.id === groupId)
  if (group) {
    editingGroupId.value = groupId
    editingGroupName.value = group.name
    editingGroupColor.value = group.color
  }
}

const cancelEditGroup = () => {
  editingGroupId.value = null
  editingGroupName.value = ''
  editingGroupColor.value = ''
}

const addTokenToGroup = (groupId, tokenId) => {
  tokenStore.addTokenToGroup(groupId, tokenId)
  message.success('已将token添加到分组')
}

const removeTokenFromGroup = (groupId, tokenId) => {
  tokenStore.removeTokenFromGroup(groupId, tokenId)
  message.success('已将token从分组移除')
}

const getValidGroupTokenIds = (groupId) => {
  return tokenStore.getValidGroupTokenIds(groupId)
}

// 资源类型定义（袋子类型）
const itemTypes = ref([
  { id: 3001, name: '金币袋子' },
  { id: 3002, name: '金砖袋子' },
  { id: 3005, name: '紫色随机碎片' },
  { id: 3006, name: '橙色随机碎片' },
  { id: 3007, name: '红色随机碎片' },
  { id: 3008, name: '精铁袋子' },
  { id: 3009, name: '进阶袋子' },
  { id: 3010, name: '梦魇袋子' },
  { id: 3011, name: '白玉袋子' },
  { id: 3012, name: '扳手袋子' },
  { id: 35011, name: '赛车礼盒' }
])

// 获取指定token的物品数量（用于批量操作）
const getItemCountForToken = (tokenId, itemId) => {
  if (tokenStore.selectedTokenId === tokenId) {
    const roleInfo = tokenStore.gameData?.roleInfo
    if (roleInfo && roleInfo.role && roleInfo.role.items) {
      const items = roleInfo.role.items
      if (items && typeof items === 'object') {
        const item = items[String(itemId)] || items[itemId]
        if (item) {
          if (typeof item === 'object' && item !== null) {
            return Number(item.quantity || item.count || item.num || 0)
          }
          if (typeof item === 'number') {
            return item
          }
        }
      }
    }
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === tokenId)
  if (token && token.gameData && token.gameData.roleInfo) {
    const tokenRoleInfo = token.gameData.roleInfo
    if (tokenRoleInfo.role && tokenRoleInfo.role.items) {
      const items = tokenRoleInfo.role.items
      if (items && typeof items === 'object') {
        const item = items[String(itemId)] || items[itemId]
        if (item) {
          if (typeof item === 'object' && item !== null) {
            return Number(item.quantity || item.count || item.num || 0)
          }
          if (typeof item === 'number') {
            return item
          }
        }
      }
    }
  }
  
  return 0
}

// 获取物品数量（用于当前选中的token）
const getItemCount = (itemId) => {
  if (!props.selectedTokenId) {
    return 0
  }
  return getItemCountForToken(props.selectedTokenId, itemId)
}

// 处理点击使用袋子
const handleUseBag = async (itemId) => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  
  const count = getItemCount(itemId)
  if (count === 0) {
    message.warning('该袋子数量为0')
    return
  }
  
  const itemName = getItemName(itemId)
  try {
    isUsingResources.value = true
    message.info(`正在使用 ${itemName}...`)
    await useBag(itemId, count)
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (token && token.id) {
      await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    }
    message.success(`${itemName} 使用完成`)
  } catch (error) {
    console.error(`使用 ${itemName} 失败:`, error)
    message.error(`使用 ${itemName} 失败`)
  } finally {
    isUsingResources.value = false
  }
}

// 使用袋子（支持分多次使用，每次最多999）
const useBag = async (itemId, count) => {
  const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
  if (!token || !token.id) return
  
  const status = tokenStore.getWebSocketStatus(token.id)
  if (status !== 'connected') {
    message.warning('WebSocket未连接，请先连接Token')
    return
  }
  
  if (count > 999) {
    const batches = Math.floor(count / 999)
    const remainder = count % 999
    
    for (let i = 0; i < batches; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'item_openpack',
          { itemId: itemId || 0, number: 999, index: 0 },
          5000
        )
        message.info(`使用 ${getItemName(itemId)}: ${(i + 1) * 999}/${count}`)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (批次 ${i + 1}):`, error)
        message.error(`使用 ${getItemName(itemId)} 失败 (批次 ${i + 1})`)
      }
    }
    
    if (remainder > 0) {
      try {
        await tokenStore.sendMessageWithPromise(
          token.id,
          'item_openpack',
          { itemId: itemId || 0, number: remainder, index: 0 },
          5000
        )
        message.info(`使用 ${getItemName(itemId)}: ${count}/${count}`)
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (剩余):`, error)
        message.error(`使用 ${getItemName(itemId)} 失败 (剩余)`)
      }
    }
  } else {
    try {
      await tokenStore.sendMessageWithPromise(
        token.id,
        'item_openpack',
        { itemId: itemId || 0, number: count || 0, index: 0 },
        5000
      )
      message.success(`使用 ${getItemName(itemId)}: ${count} 个`)
    } catch (error) {
      console.error(`使用 ${getItemName(itemId)} 失败:`, error)
      message.error(`使用 ${getItemName(itemId)} 失败`)
    }
  }
}

// 获取物品名称
const getItemName = (itemId) => {
  const item = itemTypes.value.find(item => item.id === itemId)
  return item ? item.name : `物品${itemId}`
}

// 使用所有资源（使用所有袋子）
const useAllResources = async () => {
  if (!props.selectedTokenId) {
    message.warning('请先选择Token')
    return
  }
  try {
    isUsingResources.value = true
    message.info('正在使用所有袋子...')
    const token = tokenStore.gameTokens.find(t => t.id === props.selectedTokenId)
    if (token && token.id) {
      const status = tokenStore.getWebSocketStatus(token.id)
      if (status !== 'connected') {
        message.warning('WebSocket未连接，请先连接Token')
        return
      }
      
      for (const itemType of itemTypes.value) {
        const count = getItemCount(itemType.id)
        if (count > 0) {
          await useBag(itemType.id, count)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      await tokenStore.sendGameMessage(token.id, 'role_getroleinfo', {})
    }
    message.success('所有袋子使用完成')
  } catch (error) {
    console.error('使用资源失败:', error)
    message.error('使用资源失败')
  } finally {
    isUsingResources.value = false
  }
}

// 批量使用资源（按照执行范围执行）
const batchUseResources = async () => {
  const sortedTokensList = [...tokenStore.gameTokens].sort((a, b) => {
    const nameA = (a.name || '未命名').toLowerCase()
    const nameB = (b.name || '未命名').toLowerCase()
    return nameA.localeCompare(nameB)
  })
  
  if (sortedTokensList.length === 0) {
    message.warning('没有可用的Token')
    return
  }
  
  const tokenIndices = parseTokenRange(resourceTokens.value)
  let targetTokens = []
  
  if (tokenIndices === null || tokenIndices.length === 0) {
    targetTokens = sortedTokensList
  } else {
    targetTokens = tokenIndices
      .map(index => {
        const arrayIndex = index - 1
        const token = sortedTokensList[arrayIndex]
        return token ? { token, index } : null
      })
      .filter(item => item !== null)
      .sort((a, b) => a.index - b.index)
      .map(item => item.token)
  }
  
  if (targetTokens.length === 0) {
    message.warning('执行范围内没有有效的Token')
    return
  }
  
  const getTokenIndex = (token) => {
    const index = sortedTokensList.findIndex(t => t.id === token.id)
    return index + 1
  }
  
  try {
    isBatchUsingResources.value = true
    const rangeText = tokenIndices === null || tokenIndices.length === 0 ? '全部' : `范围${tokenIndices.join(',')}`
    message.info(`开始批量使用资源（${rangeText}），共${targetTokens.length}个Token，按序号顺序执行...`)
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < targetTokens.length; i++) {
      const token = targetTokens[i]
      const tokenIndex = getTokenIndex(token)
      
      try {
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在连接...`)
        tokenStore.selectToken(token.id, true)
        
        let retryCount = 0
        const maxRetries = 5
        let status = tokenStore.getWebSocketStatus(token.id)
        
        while (status !== 'connected' && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          status = tokenStore.getWebSocketStatus(token.id)
          retryCount++
          
          if (status !== 'connected' && retryCount < maxRetries) {
            message.info(`[序号${tokenIndex}] 连接尝试 ${retryCount}/${maxRetries}...`)
            tokenStore.selectToken(token.id, true)
          }
        }
        
        if (status !== 'connected') {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} 连接失败，跳过`)
          failCount++
          continue
        }
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 连接成功`)
        
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在刷新物品信息...`)
        await tokenStore.sendGetRoleInfo(token.id)
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const refreshedToken = tokenStore.gameTokens.find(t => t.id === token.id)
        if (!refreshedToken) {
          message.warning(`[序号${tokenIndex}] ${token.name || token.id} Token不存在，跳过`)
          failCount++
          continue
        }
        
        message.info(`[序号${tokenIndex}] ${token.name || token.id} 正在使用所有袋子...`)
        for (const itemType of itemTypes.value) {
          const currentToken = tokenStore.gameTokens.find(t => t.id === token.id)
          if (!currentToken) {
            continue
          }
          
          let count = 0
          const tokenRoleInfo = currentToken.gameData?.roleInfo
          if (tokenRoleInfo && tokenRoleInfo.role && tokenRoleInfo.role.items) {
            const items = tokenRoleInfo.role.items
            if (items && typeof items === 'object') {
              const item = items[String(itemType.id)] || items[itemType.id]
              if (item) {
                if (typeof item === 'object' && item !== null) {
                  count = Number(item.quantity || item.count || item.num || 0)
                } else if (typeof item === 'number') {
                  count = item
                }
              }
            }
          }
          
          if (count === 0) {
            count = getItemCountForToken(token.id, itemType.id)
          }
          
          if (count > 0) {
            try {
              message.info(`[序号${tokenIndex}] 使用 ${getItemName(itemType.id)}: ${count} 个`)
              await useBagForToken(token.id, itemType.id, count)
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              console.error(`[序号${tokenIndex}] 使用 ${getItemName(itemType.id)} 失败:`, error)
              message.warning(`[序号${tokenIndex}] 使用 ${getItemName(itemType.id)} 失败: ${error.message || '未知错误'}`)
            }
          }
        }
        
        await tokenStore.sendGetRoleInfo(token.id)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        message.success(`[序号${tokenIndex}] ${token.name || token.id} 资源使用完成`)
        successCount++
        
        if (i < targetTokens.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[序号${tokenIndex}] ${token.name || token.id} 批量使用资源失败:`, error)
        message.error(`[序号${tokenIndex}] ${token.name || token.id}: 使用失败 - ${error.message || '未知错误'}`)
        failCount++
      }
    }
    
    message.success(`批量使用资源完成（成功: ${successCount}, 失败: ${failCount}）`)
  } catch (error) {
    console.error('批量使用资源失败:', error)
    message.error('批量使用资源失败: ' + (error.message || '未知错误'))
  } finally {
    isBatchUsingResources.value = false
  }
}

// 为指定token使用袋子（支持分多次使用，每次最多999）
const useBagForToken = async (tokenId, itemId, count) => {
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    throw new Error('WebSocket未连接')
  }
  
  if (count > 999) {
    const batches = Math.floor(count / 999)
    const remainder = count % 999
    
    for (let i = 0; i < batches; i++) {
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'item_openpack',
          { itemId: itemId || 0, number: 999, index: 0 },
          5000
        )
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (批次 ${i + 1}):`, error)
        throw error
      }
    }
    
    if (remainder > 0) {
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'item_openpack',
          { itemId: itemId || 0, number: remainder, index: 0 },
          5000
        )
      } catch (error) {
        console.error(`使用 ${getItemName(itemId)} 失败 (剩余):`, error)
        throw error
      }
    }
  } else {
    try {
      await tokenStore.sendMessageWithPromise(
        tokenId,
        'item_openpack',
        { itemId: itemId || 0, number: count || 0, index: 0 },
        5000
      )
    } catch (error) {
      console.error(`使用 ${getItemName(itemId)} 失败:`, error)
      throw error
    }
  }
}

// 刷新物品数量
const refreshItemCounts = async () => {
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
    isRefreshingItems.value = true
    message.info('正在刷新物品数量...')
    
    await tokenStore.sendGetRoleInfo(token.id)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    message.success('刷新物品数量成功')
  } catch (error) {
    console.error('刷新物品数量失败:', error)
    message.error('刷新物品数量失败: ' + (error.message || '未知错误'))
  } finally {
    isRefreshingItems.value = false
  }
}
</script>

<style scoped>
.resource-management-list {
  width: 100%;
}

.task-checkbox-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.1rem;
  margin-bottom: 1rem;
}

.group-management-content {
  padding: 1rem;
}

.execution-range-content {
  padding: 1rem;
}
</style>
