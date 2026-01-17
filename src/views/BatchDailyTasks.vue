<template>
  <div class="batch-daily-tasks">
    <div class="main-layout">
      <!-- Left Column -->
      <div class="left-column">
        <!-- Header -->
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <h2>批量日常任务</h2>
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
              <div style="font-size: 14px; color: #495057;">
                共 {{ scheduledTasks.length }} 个定时任务
              </div>
              <div v-if="shortestCountdownTask" style="font-size: 14px; font-weight: 500; color: #1677ff;">
                即将执行：{{ shortestCountdownTask.task.name }} ({{ shortestCountdownTask.countdown.formatted }})
              </div>
              <div v-else style="font-size: 14px; color: #6c757d;">
                暂无定时任务
              </div>
              <div style="display: flex; gap: 8px;">
                <n-button type="primary" size="small" @click="openTaskModal">
                  新增定时任务
                </n-button>
                <n-button size="small" @click="showTasksModal = true">
                  查看定时任务
                </n-button>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
            <n-button type="primary" @click="startBatch" :disabled="isRunning || selectedTokens.length === 0" size="medium">
              {{ isRunning ? "执行中..." : "开始执行" }}
            </n-button>
            <n-button @click="stopBatch" :disabled="!isRunning" type="error" size="medium">
              停止
            </n-button>
            <n-button @click="openBatchSettings" size="medium">
              <template #icon>
                <n-icon>
                  <Settings />
                </n-icon>
              </template>
              设置
            </n-button>
          </div>
        </div>

        <!-- Token Selection -->
        <n-card title="账号列表" class="token-list-card">
          <n-space style="margin-bottom: 12px">
            <n-button size="small" @click="claimHangUpRewards" :disabled="isRunning || selectedTokens.length === 0">
              领取挂机
            </n-button>
            <n-button size="small" @click="batchAddHangUpTime" :disabled="isRunning || selectedTokens.length === 0">
              一键加钟
            </n-button>
            <n-button size="small" @click="resetBottles" :disabled="isRunning || selectedTokens.length === 0">
              重置罐子
            </n-button>
            <n-button size="small" @click="batchlingguanzi" :disabled="isRunning || selectedTokens.length === 0">
              一键领取罐子
            </n-button>
            <n-button size="small" @click="climbTower" :disabled="isRunning || selectedTokens.length === 0">
              一键爬塔
            </n-button>
            <n-button size="small" @click="batchStudy" :disabled="isRunning || selectedTokens.length === 0">
              一键答题
            </n-button>
            <n-button size="small" @click="batchSmartSendCar" :disabled="isRunning || selectedTokens.length === 0 || !isCarActivityOpen
              ">
              智能发车
            </n-button>
            <n-button size="small" @click="batchClaimCars" :disabled="isRunning || selectedTokens.length === 0 || !isCarActivityOpen
              ">
              一键收车
            </n-button>
            <n-button size="small" @click="openHelperModal('box')" :disabled="isRunning || selectedTokens.length === 0">
              批量开箱
            </n-button>
            <n-button size="small" @click="batchClaimBoxPointReward"
              :disabled="isRunning || selectedTokens.length === 0">
              领取宝箱积分
            </n-button>
            <n-button size="small" @click="openHelperModal('fish')"
              :disabled="isRunning || selectedTokens.length === 0">
              批量钓鱼
            </n-button>
            <n-button size="small" @click="openHelperModal('recruit')"
              :disabled="isRunning || selectedTokens.length === 0">
              批量招募
            </n-button>
            <n-button size="small" @click="batchbaoku13" :disabled="isRunning || selectedTokens.length === 0 || !isbaokuActivityOpen
              ">
              一键宝库前3层
            </n-button>
            <n-button size="small" @click="batchbaoku45" :disabled="isRunning || selectedTokens.length === 0 || !isbaokuActivityOpen
              ">
              一键宝库4,5层
            </n-button>
            <n-button size="small" @click="batchmengjing" :disabled="isRunning ||
              selectedTokens.length === 0 ||
              !ismengjingActivityOpen
              ">
              一键梦境
            </n-button>
            <n-button size="small" @click="batchclubsign" :disabled="isRunning || selectedTokens.length === 0">
              一键俱乐部签到
            </n-button>
            <n-button size="small" @click="batcharenafight" :disabled="isRunning || selectedTokens.length === 0 || !isarenaActivityOpen
              ">
              一键竞技场战斗3次
            </n-button>
            <n-button size="small" @click="batchTopUpFish" :disabled="isRunning || selectedTokens.length === 0">
              一键钓鱼补齐
            </n-button>
            <n-button size="small" @click="batchTopUpArena" :disabled="isRunning || selectedTokens.length === 0 || !isarenaActivityOpen
              ">
              一键竞技场补齐
            </n-button>
            <n-button size="small" @click="batchClaimFreeEnergy"
              :disabled="isRunning || selectedTokens.length === 0 || !isWeirdTowerActivityOpen">
              一键领取怪异塔免费道具
            </n-button>
            <n-button size="small" @click="legion_storebuygoods" :disabled="isRunning || selectedTokens.length === 0">
              一键购买四圣碎片
            </n-button>
            <n-button size="small" @click="legionStoreBuySkinCoins"
              :disabled="isRunning || selectedTokens.length === 0">
              一键购买俱乐部5皮肤币
            </n-button>
            <n-button size="small" @click="store_purchase" :disabled="isRunning || selectedTokens.length === 0">
              一键黑市采购
            </n-button>
            <n-button size="small" @click="collection_claimfreereward"
              :disabled="isRunning || selectedTokens.length === 0">
              免费领取珍宝阁
            </n-button>
            <n-button size="small" @click="batchLegacyClaim" :disabled="isRunning || selectedTokens.length === 0">
              批量功法残卷领取
            </n-button>
            <n-button size="small" @click="showLegacyGiftModal = true" :disabled="isRunning || selectedTokens.length === 0">
              批量功法残卷赠送
            </n-button>
          </n-space>
          <n-space vertical>
            <n-checkbox :checked="isAllSelected" :indeterminate="isIndeterminate" @update:checked="handleSelectAll">
              全选
            </n-checkbox>
            <n-checkbox-group v-model:value="selectedTokens">
              <n-grid :x-gap="12" :y-gap="8" :cols="batchSettings.tokenListColumns">
                <n-grid-item v-for="token in tokens" :key="token.id">
                  <div class="token-row">
                    <n-checkbox :value="token.id" :label="token.name" style="flex: 1">
                      <div class="token-item">
                        <span>{{ token.name }}</span>
                        <n-tag size="small" :type="getStatusType(token.id)" style="margin-left: 8px">
                          {{ getStatusText(token.id) }}
                        </n-tag>
                      </div>
                    </n-checkbox>
                    <n-button size="tiny" circle @click.stop="openSettings(token)">
                      <template #icon>
                        <n-icon>
                          <Settings />
                        </n-icon>
                      </template>
                    </n-button>
                  </div>
                </n-grid-item>
              </n-grid>
            </n-checkbox-group>
          </n-space>
        </n-card>

        <!-- Scheduled Tasks -->
        <n-card v-if="!batchSettings.hideScheduledTasksModule" title="定时任务" class="scheduled-tasks-card" style="margin-top: 16px">
          <n-space style="margin-bottom: 12px">
            <n-button type="primary" size="small" @click="openTaskModal">
              新增定时任务
            </n-button>
            <n-button size="small" @click="showTasksModal = true">
              查看定时任务
            </n-button>
          </n-space>

          <!-- 任务预告区域 -->
          <div class="task-preview" style="
            margin: 16px 0;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background-color: #fafafa;
          ">
            <h4 style="margin: 0 0 12px 0; color: #333;">即将执行的任务</h4>
            <div v-if="shortestCountdownTask" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 12px;
              background-color: white;
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            ">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">{{ shortestCountdownTask.task.name }}
              </div>
              <div style="
                  font-size: 24px;
                  font-weight: bold;
                  color: #1677ff;
                " :style="{ color: shortestCountdownTask.countdown.isNearExecution ? '#ff4d4f' : '#1677ff' }">
                {{ shortestCountdownTask.countdown.formatted }}
              </div>
            </div>
            <div v-else style="
              text-align: center;
              padding: 24px;
              color: #6b7280;
              font-style: italic;
            ">
              暂无定时任务
            </div>
          </div>

          <!-- 简单的任务统计 -->
          <div class="tasks-count" v-if="scheduledTasks.length > 0">
            <p>已保存 {{ scheduledTasks.length }} 个定时任务</p>
          </div>
          <div class="tasks-count" v-else>
            <p>暂无定时任务</p>
          </div>
        </n-card>
      </div>

      <!-- Right Column - Execution Log -->
      <div class="right-column">
        <n-card class="log-card">
          <template #header>
            <div class="custom-card-header">
              <div class="card-title">
                {{ currentRunningTokenName ? `正在执行: ${currentRunningTokenName}` : '执行日志' }}
              </div>
              <div class="log-header-controls">
                <n-checkbox v-model:checked="autoScrollLog" size="small">
                  自动滚动
                </n-checkbox>
                <n-checkbox v-model:checked="filterErrorsOnly" size="small">
                  只看错误
                </n-checkbox>
                <n-tag v-if="errorCount > 0" type="error" size="small">
                  {{ errorCount }} 个错误
                </n-tag>
                <n-button size="small" @click="copyLogs">
                  复制日志
                </n-button>
              </div>
            </div>
          </template>
          <n-progress type="line" :percentage="currentProgress" :indicator-placement="'inside'" processing />
          <div class="log-container" ref="logContainer">
            <div v-for="(log, index) in filteredLogs" :key="index" class="log-item" :class="log.type">
              <span class="time">{{ log.time }}</span>
              <span class="message">{{ log.message }}</span>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <!-- Settings Modal -->
    <n-modal v-model:show="showSettingsModal" preset="card" :title="`任务设置 - ${currentSettingsTokenName}`"
      style="width: 90%; max-width: 400px">
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">竞技场阵容</label>
            <n-select v-model:value="currentSettings.arenaFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">BOSS阵容</label>
            <n-select v-model:value="currentSettings.bossFormation" :options="formationOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">BOSS次数</label>
            <n-select v-model:value="currentSettings.bossTimes" :options="bossTimesOptions" size="small" />
          </div>
          <div class="setting-switches">
            <div class="switch-row">
              <span class="switch-label">领罐子</span><n-switch v-model:value="currentSettings.claimBottle" />
            </div>
            <div class="switch-row">
              <span class="switch-label">领挂机</span><n-switch v-model:value="currentSettings.claimHangUp" />
            </div>
            <div class="switch-row">
              <span class="switch-label">竞技场</span><n-switch v-model:value="currentSettings.arenaEnable" />
            </div>
            <div class="switch-row">
              <span class="switch-label">开宝箱</span><n-switch v-model:value="currentSettings.openBox" />
            </div>
            <div class="switch-row">
              <span class="switch-label">领取邮件奖励</span><n-switch v-model:value="currentSettings.claimEmail" />
            </div>
            <div class="switch-row">
              <span class="switch-label">黑市购买物品</span><n-switch v-model:value="currentSettings.blackMarketPurchase" />
            </div>
            <div class="switch-row">
              <span class="switch-label">付费招募</span><n-switch v-model:value="currentSettings.payRecruit" />
            </div>
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right">
          <n-button type="primary" @click="saveSettings">保存设置</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Legacy Gift Modal -->
    <n-modal v-model:show="showLegacyGiftModal" preset="card" title="批量功法残卷赠送" style="width: 90%; max-width: 600px">
      <div class="settings-content">
        <div class="settings-grid">
          <!-- 接收者ID输入 -->
          <div class="setting-item">
            <label class="setting-label">接收者ID</label>
            <n-space>
              <n-input 
                v-model:value="recipientIdInput" 
                placeholder="请输入接收者ID"
                type="number"
                @input="clearRecipientError"
                style="width: 180px"
              />
              <n-input 
                v-model:value="securityPassword" 
                placeholder="请输入安全密码"
                type="password"
                @input="clearRecipientError"
                style="width: 180px"
              />
              <n-button 
                type="primary" 
                @click="queryRecipientInfo" 
                :disabled="!recipientIdInput || isQueryingRecipient || !securityPassword"
              >
                查询
              </n-button>
            </n-space>
            <n-text v-if="recipientIdError" type="error" style="margin-top: 5px; display: block">
              {{ recipientIdError }}
            </n-text>
          </div>
          
          <!-- 接收者信息展示 -->
          <div class="setting-item" v-if="recipientInfo">
            <label class="setting-label">接收者信息</label>
            <div class="recipient-info" style="background: #f7f8fa; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; align-items: flex-start; gap: 16px; transition: all 0.3s ease;">
              <!-- 头像部分 -->
              <div class="avatar-container" style="
                position: relative;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                overflow: hidden;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
              ">
                <img 
                  v-if="recipientInfo.avatarUrl && !avatarLoadError" 
                  :src="recipientInfo.avatarUrl" 
                  alt="角色头像" 
                  style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: all 0.3s ease;
                  "
                  @error="handleAvatarError"
                  @load="handleAvatarLoad"
                />
                <!-- 头像加载失败或未设置时的 fallback -->
                <div 
                  v-else 
                  class="avatar-fallback" 
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                  "
                >
                  {{ (recipientInfo.name || '未知角色')[0] || '?' }}
                </div>
                <!-- 加载指示器 -->
                <div 
                  v-if="isAvatarLoading" 
                  class="avatar-loading" 
                  style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                  "
                >
                  <div class="loading-spinner" style="
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                  "></div>
                </div>
              </div>
              
              <!-- 角色信息部分 -->
              <div class="role-info" style="flex: 1; min-width: 0;">
                <div style="margin-bottom: 12px; font-size: 18px; font-weight: bold; color: #1d2129; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{ recipientInfo.name || '未知角色' }}</div>
                <div class="role-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div class="info-item">
                    <div class="info-label" style="font-size: 12px; color: #86909c; margin-bottom: 2px;">角色ID</div>
                    <div class="info-value" style="font-size: 14px; font-weight: 500; color: #1d2129;">{{ recipientInfo.roleId }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label" style="font-size: 12px; color: #86909c; margin-bottom: 2px;">服务器</div>
                    <div class="info-value" style="font-size: 14px; font-weight: 500; color: #1d2129;">{{ recipientInfo.serverName }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label" style="font-size: 12px; color: #86909c; margin-bottom: 2px;">战力</div>
                    <div class="info-value" style="font-size: 16px; font-weight: 600; color: #667eea;">{{ recipientInfo.power }} {{ recipientInfo.powerUnit }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label" style="font-size: 12px; color: #86909c; margin-bottom: 2px;">军团</div>
                    <div class="info-value" style="font-size: 14px; font-weight: 500; color: #1d2129;">{{ recipientInfo.legionName || '无' }}</div>
                  </div>
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label" style="font-size: 12px; color: #86909c; margin-bottom: 2px;">军团ID</div>
                    <div class="info-value" style="font-size: 14px; font-weight: 500; color: #1d2129;">{{ recipientInfo.legionId || '无' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 赠送数量 -->
          <div class="setting-item">
            <label class="setting-label">赠送数量</label>
            <n-input-number 
              v-model:value="giftQuantity" 
              :min="1" 
              :max="1000" 
              :step="1"
              placeholder="请输入赠送数量"
            />
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="modal-actions" style="margin-top: 20px; text-align: right">
          <n-button @click="showLegacyGiftModal = false" style="margin-right: 12px">取消</n-button>
          <n-button 
            type="primary" 
            @click="confirmLegacyGift" 
            :disabled="!recipientIdInput || !recipientInfo"
          >
            开始赠送
          </n-button>
        </div>
      </div>
    </n-modal>

    <!-- Helper Modal (开箱/钓鱼/招募) -->
    <n-modal v-model:show="showHelperModal" preset="card" :title="helperModalTitle"
      style="width: 90%; max-width: 400px">
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item" v-if="helperType === 'box'">
            <label class="setting-label">宝箱类型</label>
            <n-select v-model:value="helperSettings.boxType" :options="boxTypeOptions" size="small" />
          </div>
          <div class="setting-item" v-if="helperType === 'fish'">
            <label class="setting-label">鱼竿类型</label>
            <n-select v-model:value="helperSettings.fishType" :options="fishTypeOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">消耗数量（10的倍数）</label>
            <n-input-number v-model:value="helperSettings.count" :min="10" :max="10000" :step="10" size="small" />
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right">
          <n-button @click="showHelperModal = false" style="margin-right: 12px">取消</n-button>
          <n-button type="primary" @click="executeHelper">开始执行</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Tasks List Modal -->
    <n-modal v-model:show="showTasksModal" preset="card" title="定时任务列表" style="width: 90%; max-width: 800px">
      <div class="tasks-list" style="max-height: 600px; overflow-y: auto">
        <div v-for="task in scheduledTasks" :key="task.id" class="task-item" style="
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          ">
          <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            ">
            <div style="font-weight: bold">{{ task.name }}</div>
            <n-switch v-model:value="task.enabled" @update:value="toggleTaskEnabled(task.id, $event)">
            </n-switch>
          </div>
          <div style="margin-bottom: 4px">
            <span style="color: #6b7280">运行类型：</span>
            <span>{{
              task.runType === "daily" ? "每天固定时间" : "Cron表达式"
              }}</span>
          </div>
          <div style="margin-bottom: 4px">
            <span style="color: #6b7280">运行时间：</span>
            <span>{{
              task.runType === "daily" ? task.runTime : task.cronExpression
              }}</span>
          </div>
          <div style="margin-bottom: 4px">
            <span style="color: #6b7280">下次执行：</span>
            <span :style="{
              fontWeight: 'bold',
              color: taskCountdowns[task.id]?.isNearExecution ? '#ff4d4f' : '#1677ff'
            }">
              {{ taskCountdowns[task.id]?.formatted || '计算中...' }}
            </span>
          </div>
          <div style="margin-bottom: 4px">
            <span style="color: #6b7280">选中账号：</span>
            <span>{{ task.selectedTokens.length }} 个</span>
          </div>
          <div style="margin-bottom: 8px">
            <span style="color: #6b7280">选中任务：</span>
            <span>{{ task.selectedTasks.length }} 个</span>
          </div>
          <div style="display: flex; gap: 8px">
            <n-button size="tiny" @click="editTask(task)"> 编辑 </n-button>
            <n-button size="tiny" type="error" @click="deleteTask(task.id)">
              删除
            </n-button>
          </div>
        </div>
        <div v-if="scheduledTasks.length === 0" style="text-align: center; padding: 24px; color: #6b7280">
          暂无定时任务
        </div>
      </div>
    </n-modal>

    <!-- Task Modal -->
    <n-modal v-model:show="showTaskModal" preset="card" :title="editingTask ? '编辑定时任务' : '新增定时任务'"
      style="width: 90%; max-width: 600px">
      <div class="settings-content">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">任务名称</label>
            <n-input v-model:value="taskForm.name" placeholder="请输入任务名称" />
          </div>
          <div class="setting-item">
            <label class="setting-label">运行类型</label>
            <n-radio-group v-model:value="taskForm.runType" @update:value="resetRunType">
              <n-radio value="daily">每天固定时间</n-radio>
              <n-radio value="cron">Cron表达式</n-radio>
            </n-radio-group>
          </div>
          <div class="setting-item" v-if="taskForm.runType === 'daily'">
            <label class="setting-label">运行时间</label>
            <n-time-picker v-model:value="taskForm.runTime" format="HH:mm" />
          </div>
          <div class="setting-item" v-if="taskForm.runType === 'cron'">
            <label class="setting-label">Cron表达式</label>
            <n-input v-model:value="taskForm.cronExpression" placeholder="请输入Cron表达式" @input="parseCronExpression" />
            
            <!-- Cron表达式解析结果 -->
            <div class="cron-parser" v-if="taskForm.cronExpression">
              <div v-if="cronValidation.valid" class="cron-validation success">
                <n-text type="success">✓ {{ cronValidation.message }}</n-text>
              </div>
              <div v-else class="cron-validation error">
                <n-text type="error">✗ {{ cronValidation.message }}</n-text>
              </div>
              
              <!-- 未来执行时间 -->
              <div v-if="cronValidation.valid && cronNextRuns.length > 0" class="cron-next-runs">
                <h4>未来5次执行时间：</h4>
                <ul>
                  <li v-for="(run, index) in cronNextRuns" :key="index">
                    {{ run }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="setting-item">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
              ">
              <label class="setting-label">选择账号</label>
              <n-space size="small">
                <n-button size="small" @click="selectAllTokens">
                  全选
                </n-button>
                <n-button size="small" @click="deselectAllTokens">
                  全不选
                </n-button>
              </n-space>
            </div>
            <n-checkbox-group v-model:value="taskForm.selectedTokens">
              <n-grid :cols="2" :x-gap="12" :y-gap="8">
                <n-grid-item v-for="token in tokens" :key="token.id">
                  <n-checkbox :value="token.id">{{ token.name }}</n-checkbox>
                </n-grid-item>
              </n-grid>
            </n-checkbox-group>
          </div>
          <div class="setting-item">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
              ">
              <label class="setting-label">选择任务</label>
              <n-space size="small">
                <n-button size="small" @click="selectAllTasks"> 全选 </n-button>
                <n-button size="small" @click="deselectAllTasks">
                  全不选
                </n-button>
              </n-space>
            </div>
            <n-checkbox-group v-model:value="taskForm.selectedTasks">
              <n-grid :cols="2" :x-gap="12" :y-gap="8">
                <n-grid-item v-for="task in availableTasks" :key="task.value">
                  <n-checkbox :value="task.value">{{ task.label }}</n-checkbox>
                </n-grid-item>
              </n-grid>
            </n-checkbox-group>
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right">
          <n-button @click="showTaskModal = false" style="margin-right: 12px">取消</n-button>
          <n-button type="primary" @click="saveTask">保存</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Batch Settings Modal -->
    <n-modal v-model:show="showBatchSettingsModal" preset="card" title="定时任务设置"
      style="width: 90%; max-width: 400px">
      <div class="settings-content">
        <div style="margin-bottom: 20px; color: #6b7280; font-size: 14px">
          设置定时任务执行批量使用操作时的数量设置
        </div>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">定时批量开箱数量（10的倍数）</label>
            <n-input-number v-model:value="batchSettings.boxCount" :min="10" :max="10000" :step="10" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">定时批量钓鱼数量（10的倍数）</label>
            <n-input-number v-model:value="batchSettings.fishCount" :min="10" :max="10000" :step="10" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">定时批量招募数量（10的倍数）</label>
            <n-input-number v-model:value="batchSettings.recruitCount" :min="10" :max="10000" :step="10" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">默认宝箱类型</label>
            <n-select v-model:value="batchSettings.defaultBoxType" :options="boxTypeOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">默认鱼竿类型</label>
            <n-select v-model:value="batchSettings.defaultFishType" :options="fishTypeOptions" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">接收者ID</label>
            <n-input v-model:value="batchSettings.receiverId" type="text" placeholder="请输入接收者ID" size="small" />
          </div>
          <div class="setting-item">
            <label class="setting-label">密码设置</label>
            <n-input v-model:value="batchSettings.password" type="password" placeholder="请输入密码" size="small" />
          </div>
          <div class="setting-item" style="flex-direction: row; justify-content: space-between; align-items: center;">
            <label class="setting-label">隐藏底部定时任务模块</label>
            <n-switch v-model:value="batchSettings.hideScheduledTasksModule" />
          </div>
          <div class="setting-item" style="flex-direction: row; justify-content: space-between; align-items: center;">
            <label class="setting-label">账号列表每行显示数量</label>
            <n-input-number v-model:value="batchSettings.tokenListColumns" :min="1" :max="10" :step="1" size="small" style="width: 100px;" />
          </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px; text-align: right">
          <n-button @click="showBatchSettingsModal = false" style="margin-right: 12px">取消</n-button>
          <n-button type="primary" @click="saveBatchSettings">保存设置</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
// Import required dependencies
import { ref, computed, nextTick, reactive, watch, onMounted, onBeforeUnmount } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { DailyTaskRunner } from "@/utils/dailyTaskRunner";
import { preloadQuestions } from "@/utils/studyQuestionsFromJSON.js";
import { useMessage } from "naive-ui";
import { Settings } from "@vicons/ionicons5";

// Initialize token store, message service, and task runner
const tokenStore = useTokenStore();
const message = useMessage();
const runner = new DailyTaskRunner(tokenStore);

const tokens = computed(() => tokenStore.gameTokens);
const isCarActivityOpen = computed(() => {
  const day = new Date().getDay();
  // 1=Mon, 2=Tue, 3=Wed
  return day >= 1 && day <= 3;
});
const ismengjingActivityOpen = computed(() => {
  const day = new Date().getDay();
  return day === 0 || day === 1 || day === 3 || day === 4;
});
const isbaokuActivityOpen = computed(() => {
  const day = new Date().getDay();
  return day != 1 && day != 2;
});
const isarenaActivityOpen = computed(() => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 22;
});
const getCurrentActivityWeek = computed(() => {
  const now = new Date();
  const start = new Date('2025-12-12T12:00:00'); // 起始时间：黑市周开始
  const weekDuration = 7 * 24 * 60 * 60 * 1000; // 一周毫秒数
  const cycleDuration = 3 * weekDuration; // 三周期毫秒数

  const elapsed = now - start;
  if (elapsed < 0) return null; // 活动开始前

  const cyclePosition = elapsed % cycleDuration;

  if (cyclePosition < weekDuration) {
    return '黑市周';
  } else if (cyclePosition < 2 * weekDuration) {
    return '招募周';
  } else {
    return '宝箱周';
  }
});

const isWeirdTowerActivityOpen = computed(() => {
  return getCurrentActivityWeek.value === '黑市周';
});

const selectedTokens = ref([]);
const tokenStatus = ref({}); // { tokenId: 'waiting' | 'running' | 'completed' | 'failed' }
const isRunning = ref(false);
const shouldStop = ref(false);

// Settings Modal State
const showSettingsModal = ref(false);
const currentSettingsTokenId = ref(null);
const currentSettingsTokenName = ref("");
const currentSettings = reactive({
  arenaFormation: 1,
  bossFormation: 1,
  bossTimes: 2,
  claimBottle: true,
  payRecruit: true,
  openBox: true,
  arenaEnable: true,
  claimHangUp: true,
  claimEmail: true,
  blackMarketPurchase: true,
});

// Helper Modal State
const showHelperModal = ref(false);
const helperType = ref("box"); // 'box' | 'fish' | 'recruit'
const helperSettings = reactive({
  boxType: 2001,
  fishType: 1,
  count: 100,
});

const helperModalTitle = computed(() => {
  const titles = { box: "批量开宝箱", fish: "批量钓鱼", recruit: "批量招募" };
  return titles[helperType.value] || "批量助手";
});

// Batch Settings State
const showBatchSettingsModal = ref(false);
const batchSettings = reactive({
  boxCount: 100,
  fishCount: 100,
  recruitCount: 100,
  defaultBoxType: 2001,
  defaultFishType: 1,
  receiverId: '',
  password: '',
  hideScheduledTasksModule: false,
  tokenListColumns: 2,
});

// Load batch settings from localStorage
const loadBatchSettings = () => {
  try {
    const saved = localStorage.getItem("batchSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(batchSettings, parsed);
    }
  } catch (error) {
    console.error("Failed to load batch settings:", error);
  }
};

// Save batch settings to localStorage
const saveBatchSettings = () => {
  try {
    localStorage.setItem("batchSettings", JSON.stringify(batchSettings));
    message.success("定时批量任务设置已保存");
    showBatchSettingsModal.value = false;
  } catch (error) {
    console.error("Failed to save batch settings:", error);
    message.error("保存设置失败");
  }
};

// Open batch settings modal
const openBatchSettings = () => {
  loadBatchSettings();
  showBatchSettingsModal.value = true;
};

// Load settings on component mount
loadBatchSettings();

// ======================
// Legacy Gift Feature
// ======================

// Legacy Gift Modal State
const showLegacyGiftModal = ref(false);
const recipientIdInput = ref('');
const recipientIdError = ref('');
const recipientInfo = ref(null);
const isQueryingRecipient = ref(false);
const giftQuantity = ref(10);
const securityPassword = ref(''); // 安全密码
// 头像加载状态
const isAvatarLoading = ref(false);
const avatarLoadError = ref(false);

// ======================
// Scheduled Tasks Feature
// ======================

// Scheduled Tasks State Management
const scheduledTasks = ref([]); // List of all scheduled tasks
const showTaskModal = ref(false); // Control the visibility of the add/edit task modal
const showTasksModal = ref(false); // Control the visibility of the tasks list modal
const editingTask = ref(null); // Currently editing task
const taskForm = reactive({
  name: "", // Task name
  runType: "daily", // 'daily' or 'cron'
  runTime: null, // Daily run time (HH:mm format)
  cronExpression: "", // Cron expression for complex scheduling
  selectedTokens: [], // Selected token IDs
  selectedTasks: [], // Selected task function names
  enabled: true, // Whether the task is enabled
});

// Cron表达式解析相关变量
const cronValidation = ref({ valid: true, message: "" });
const cronNextRuns = ref([]);

// Available tasks for scheduling - Maps task function names to display labels
const availableTasks = [
  { label: "日常任务", value: "startBatch" },
  { label: "领取挂机", value: "claimHangUpRewards" },
  { label: "一键加钟", value: "batchAddHangUpTime" },
  { label: "重置罐子", value: "resetBottles" },
  { label: "一键领取罐子", value: "batchlingguanzi" },
  { label: "一键爬塔", value: "climbTower" },
  { label: "一键答题", value: "batchStudy" },
  { label: "智能发车", value: "batchSmartSendCar" },
  { label: "一键收车", value: "batchClaimCars" },
  { label: "批量开箱", value: "batchOpenBox" },
  { label: "领取宝箱积分", value: "batchClaimBoxPointReward" },
  { label: "批量钓鱼", value: "batchFish" },
  { label: "批量招募", value: "batchRecruit" },
  { label: "一键宝库前3层", value: "batchbaoku13" },
  { label: "一键宝库4,5层", value: "batchbaoku45" },
  { label: "一键梦境", value: "batchmengjing" },
  { label: "一键俱乐部签到", value: "batchclubsign" },
  { label: "一键竞技场战斗3次", value: "batcharenafight" },
  { label: "一键钓鱼补齐", value: "batchTopUpFish" },
  { label: "一键竞技场补齐", value: "batchTopUpArena" },
  { label: "一键领取怪异塔免费道具", value: "batchClaimFreeEnergy" },
  { label: "一键购买四圣碎片", value: "legion_storebuygoods" },
  { label: "一键黑市采购", value: "store_purchase" },
  { label: "免费领取珍宝阁", value: "collection_claimfreereward" },
  { label: "批量领取功法残卷", value: "batchLegacyClaim" },
  { label: "批量赠送功法残卷", value: "batchLegacyGiftSendEnhanced" },
];

const CarresearchItem = [
  20, 21, 22, 23, 24, 26, 28, 30, 32, 34,
  36, 38, 40, 42, 44, 47, 50, 53, 56, 59,
  62, 65, 68, 71, 74, 78, 82, 86, 90, 94,
  99, 104, 109, 114, 119, 126, 133, 140, 147, 154,
  163, 172, 181, 190, 199, 210, 221, 232, 243, 369,
  393, 422, 457, 498, 548, 607, 678, 763, 865, 1011
];

// Task table columns configuration for the tasks list modal
const taskColumns = [
  { title: "任务名称", key: "name", width: 150 },
  { title: "运行类型", key: "runType", width: 100 },
  {
    title: "运行时间",
    key: "runTime",
    width: 150,
    render: (row) => {
      // Display appropriate time format based on run type
      return row.runType === "daily" ? row.runTime : row.cronExpression;
    },
  },
  {
    title: "选中账号",
    key: "selectedTokens",
    width: 150,
    render: (row) => `${row.selectedTokens.length} 个`,
  },
  {
    title: "选中任务",
    key: "selectedTasks",
    width: 150,
    render: (row) => `${row.selectedTasks.length} 个`,
  },
  {
    title: "状态",
    key: "enabled",
    width: 80,
    render: (row) => (row.enabled ? "启用" : "禁用"),
  },
  { title: "操作", key: "actions", width: 150 },
];

// ======================
// Scheduled Tasks Storage
// ======================

// Load scheduled tasks from localStorage
const loadScheduledTasks = () => {
  try {
    const saved = localStorage.getItem("scheduledTasks");

    if (saved) {
      const parsed = JSON.parse(saved);


      // Ensure we have an array
      scheduledTasks.value = Array.isArray(parsed) ? parsed : [];


    } else {

      scheduledTasks.value = [];
    }
  } catch (error) {
    console.error("Failed to load scheduled tasks:", error);
    scheduledTasks.value = [];
  }
};

// Save scheduled tasks to localStorage
const saveScheduledTasks = () => {
  try {
    const dataToSave = JSON.stringify(scheduledTasks.value);

    localStorage.setItem("scheduledTasks", dataToSave);
    // Verify save was successful
    const saved = localStorage.getItem("scheduledTasks");



  } catch (error) {
    console.error("Failed to save scheduled tasks:", error);
  }
};

// Open task modal for adding new task
const openTaskModal = () => {
  editingTask.value = null;
  Object.assign(taskForm, {
    name: "",
    runType: "daily",
    runTime: undefined,
    cronExpression: "",
    selectedTokens: [],
    selectedTasks: [],
    enabled: true,
  });
  showTaskModal.value = true;
};

// Edit existing task
const editTask = (task) => {
  editingTask.value = task;
  const taskData = { ...task };
  if (task.runType === 'daily' && task.runTime && typeof task.runTime === 'string') {
    const [hours, minutes] = task.runTime.split(':').map(Number);
    const now = new Date();
    taskData.runTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  }
  Object.assign(taskForm, taskData);
  showTaskModal.value = true;
};

// Validate cron expression
const validateCronExpression = (expression) => {
  if (!expression) return { valid: false, message: "Cron表达式不能为空" };

  const cronParts = expression.split(" ").filter(Boolean);
  if (cronParts.length !== 5) {
    return { valid: false, message: "Cron表达式必须包含5个字段：分 时 日 月 周" };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;

  // 定义通用的cron字段验证函数，不使用正则表达式
  const validateCronField = (field, min, max, fieldName) => {
    // 处理星号
    if (field === '*') {
      return { valid: true };
    }
    
    // 处理步长格式，如 */5 或 0/1
    if (field.includes('/')) {
      const parts = field.split('/');
      if (parts.length !== 2) {
        return { valid: false, message: `${fieldName}字段步长格式错误` };
      }
      const [range, stepStr] = parts;
      const step = parseInt(stepStr);
      if (isNaN(step) || step <= 0) {
        return { valid: false, message: `${fieldName}字段步长必须是正整数` };
      }
      
      // 验证范围部分
      if (range !== '*') {
        // 范围部分可能是列表或单个范围
        if (range.includes(',')) {
          const rangeItems = range.split(',');
          for (const item of rangeItems) {
            if (item.includes('-')) {
              // 处理范围，如 1-5
              const rangeParts = item.split('-');
              if (rangeParts.length !== 2) {
                return { valid: false, message: `${fieldName}字段范围格式错误` };
              }
              const [start, end] = rangeParts.map(Number);
              if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
                return { valid: false, message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值` };
              }
            } else {
              // 处理单个数字
              const num = parseInt(item);
              if (isNaN(num) || num < min || num > max) {
                return { valid: false, message: `${fieldName}字段必须在${min}-${max}之间` };
              }
            }
          }
        } else if (range.includes('-')) {
          // 处理范围，如 1-5
          const rangeParts = range.split('-');
          if (rangeParts.length !== 2) {
            return { valid: false, message: `${fieldName}字段范围格式错误` };
          }
          const [start, end] = rangeParts.map(Number);
          if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
            return { valid: false, message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值` };
          }
        } else {
          // 处理单个数字
          const num = parseInt(range);
          if (isNaN(num) || num < min || num > max) {
            return { valid: false, message: `${fieldName}字段必须在${min}-${max}之间` };
          }
        }
      }
      return { valid: true };
    }
    
    // 处理列表格式，如 1,3,5 或 1-5,7-9
    if (field.includes(',')) {
      const items = field.split(',');
      for (const item of items) {
        const trimmedItem = item.trim();
        if (trimmedItem.includes('-')) {
          // 处理范围，如 1-5
          const rangeParts = trimmedItem.split('-');
          if (rangeParts.length !== 2) {
            return { valid: false, message: `${fieldName}字段范围格式错误` };
          }
          const [start, end] = rangeParts.map(Number);
          if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
            return { valid: false, message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值` };
          }
        } else {
          // 处理单个数字
          const num = parseInt(trimmedItem);
          if (isNaN(num) || num < min || num > max) {
            return { valid: false, message: `${fieldName}字段必须在${min}-${max}之间` };
          }
        }
      }
      return { valid: true };
    }
    
    // 处理范围格式，如 1-5
    if (field.includes('-')) {
      const rangeParts = field.split('-');
      if (rangeParts.length !== 2) {
        return { valid: false, message: `${fieldName}字段范围格式错误` };
      }
      const [start, end] = rangeParts.map(Number);
      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
        return { valid: false, message: `${fieldName}字段范围必须在${min}-${max}之间，且开始值小于等于结束值` };
      }
      return { valid: true };
    }
    
    // 处理单个数字
    const num = parseInt(field);
    if (isNaN(num) || num < min || num > max) {
      return { valid: false, message: `${fieldName}字段必须在${min}-${max}之间` };
    }
    
    return { valid: true };
  };

  // Validate minute (0-59)
  const minuteValidation = validateCronField(minute, 0, 59, "分钟");
  if (!minuteValidation.valid) {
    return minuteValidation;
  }

  // Validate hour (0-23)
  const hourValidation = validateCronField(hour, 0, 23, "小时");
  if (!hourValidation.valid) {
    return hourValidation;
  }

  // Validate dayOfMonth (1-31)
  const dayOfMonthValidation = validateCronField(dayOfMonth, 1, 31, "日期");
  if (!dayOfMonthValidation.valid) {
    return dayOfMonthValidation;
  }

  // Validate month (1-12)
  const monthValidation = validateCronField(month, 1, 12, "月份");
  if (!monthValidation.valid) {
    return monthValidation;
  }

  // Validate dayOfWeek (0-7, where 0 and 7 both represent Sunday)
  const dayOfWeekValidation = validateCronField(dayOfWeek, 0, 7, "星期");
  if (!dayOfWeekValidation.valid) {
    return dayOfWeekValidation;
  }

  return { valid: true, message: "Cron表达式格式正确" };
};

// Parse cron expression and calculate next execution times
const parseCronExpression = (expression) => {
  // Validate the expression first
  const validation = validateCronExpression(expression);
  cronValidation.value = validation;
  
  if (!validation.valid) {
    cronNextRuns.value = [];
    return;
  }
  
  // Parse the expression and calculate next runs
  const cronParts = expression.split(" ").filter(Boolean);
  const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = cronParts;
  
  // Calculate next 5 execution times
  const nextRuns = calculateNextRuns(minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField, 5);
  cronNextRuns.value = nextRuns;
};

// Calculate next execution times for a cron expression
const calculateNextRuns = (minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField, count = 5) => {
  const now = new Date();
  const nextRuns = [];
  let current = new Date(now);
  current.setMilliseconds(0);
  current.setSeconds(0);
  current.setMinutes(current.getMinutes() + 1); // Start from next minute
  
  // Limit the search to 1 year to prevent infinite loops
  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  while (nextRuns.length < count && current <= maxDate) {
    // Parse each field
    const possibleMinutes = parseCronField(minuteField, 0, 59);
    const possibleHours = parseCronField(hourField, 0, 23);
    const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
    const possibleMonths = parseCronField(monthField, 1, 12);
    const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);
    
    // Check if current time matches all fields
    const matchesMinute = possibleMinutes.includes(current.getMinutes());
    const matchesHour = possibleHours.includes(current.getHours());
    const matchesDayOfMonth = possibleDaysOfMonth.includes(current.getDate());
    const matchesMonth = possibleMonths.includes(current.getMonth() + 1); // months are 0-based in JS
    const matchesDayOfWeek = possibleDaysOfWeek.includes(current.getDay()); // 0 is Sunday
    
    // Special handling: if dayOfWeek is specified, it should match either dayOfMonth or dayOfWeek
    const isDayOfWeekSpecified = dayOfWeekField !== '*';
    const isDayOfMonthSpecified = dayOfMonthField !== '*';
    
    let matchesDay;
    if (isDayOfWeekSpecified && isDayOfMonthSpecified) {
      // If both are specified, match either
      matchesDay = matchesDayOfMonth || matchesDayOfWeek;
    } else {
      // If only one is specified, match that one
      matchesDay = matchesDayOfMonth && matchesDayOfWeek;
    }
    
    if (matchesMinute && matchesHour && matchesDay && matchesMonth) {
      // Format the date in a readable format with year, month, day, hour, minute, second
      const formatted = current.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      nextRuns.push(formatted);
      // Move to next minute for next iteration
      current.setMinutes(current.getMinutes() + 1);
    } else {
      // Move to next minute if no match
      current.setMinutes(current.getMinutes() + 1);
    }
  }
  
  return nextRuns;
};

// Save task (create or update)
const saveTask = () => {
  if (!taskForm.name) {
    message.warning("请输入任务名称");
    return;
  }

  if (taskForm.runType === "daily" && !taskForm.runTime) {
    message.warning("请选择运行时间");
    return;
  }

  if (taskForm.runType === "cron") {
    if (!taskForm.cronExpression) {
      message.warning("请输入Cron表达式");
      return;
    }

    // Validate cron expression
    const validation = validateCronExpression(taskForm.cronExpression);
    if (!validation.valid) {
      message.warning(validation.message);
      return;
    }
  }

  if (taskForm.selectedTokens.length === 0) {
    message.warning("请选择至少一个账号");
    return;
  }

  if (taskForm.selectedTasks.length === 0) {
    message.warning("请选择至少一个任务");
    return;
  }

  // Format runTime as string for storage
  let formattedRunTime = null;
  if (taskForm.runType === "daily" && taskForm.runTime) {
    const time = new Date(taskForm.runTime);
    formattedRunTime = time.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const taskData = {
    id: editingTask.value?.id || "task_" + Date.now(),
    name: taskForm.name,
    runType: taskForm.runType,
    runTime: formattedRunTime,
    cronExpression: taskForm.runType === "cron" ? taskForm.cronExpression : "",
    selectedTokens: [...taskForm.selectedTokens],
    selectedTasks: [...taskForm.selectedTasks],
    enabled: taskForm.enabled,
  };

  let isNew = !editingTask.value;

  if (editingTask.value) {
    // Update existing task
    const index = scheduledTasks.value.findIndex(
      (t) => t.id === editingTask.value.id,
    );
    if (index !== -1) {
      scheduledTasks.value[index] = taskData;
    }
  } else {
    // Add new task
    scheduledTasks.value.push(taskData);
  }

  saveScheduledTasks();

  // Add log entry for task save
  addTaskSaveLog(taskData, isNew);

  showTaskModal.value = false;
  message.success("定时任务已保存");
};

// Delete task
const deleteTask = (taskId) => {
  const task = scheduledTasks.value.find((t) => t.id === taskId);
  if (task) {
    scheduledTasks.value = scheduledTasks.value.filter((t) => t.id !== taskId);
    saveScheduledTasks();
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== 定时任务 ${task.name} 已删除 ===`,
      type: "info",
    });
    message.success("定时任务已删除");
  }
};

// Toggle task enabled state
const toggleTaskEnabled = (taskId, enabled) => {
  const task = scheduledTasks.value.find((t) => t.id === taskId);
  if (task) {
    task.enabled = enabled;
    saveScheduledTasks();
    message.success(`定时任务已${enabled ? "启用" : "禁用"}`);
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== 定时任务 ${task.name} 已${enabled ? "启用" : "禁用"} ===`,
      type: "info",
    });
  }
};

// Add log entry for task save
const addTaskSaveLog = (task, isNew) => {
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

// Reset run type related fields
const resetRunType = () => {
  if (taskForm.runType === "daily") {
    taskForm.cronExpression = "";
  } else {
    taskForm.runTime = undefined;
  }
};

// Select all tokens
const selectAllTokens = () => {
  taskForm.selectedTokens = tokens.value.map((token) => token.id);
};

// Deselect all tokens
const deselectAllTokens = () => {
  taskForm.selectedTokens = [];
};

// Select all tasks
const selectAllTasks = () => {
  taskForm.selectedTasks = availableTasks.map((task) => task.value);
};

// Deselect all tasks
const deselectAllTasks = () => {
  taskForm.selectedTasks = [];
};

// 一键购买四圣碎片
const legion_storebuygoods = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始购买四圣碎片: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Execute purchase command
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `发送购买请求...`,
        type: "info",
      });
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_storebuygoods",
        { "id": 6 },
        5000,
      );

      await new Promise((r) => setTimeout(r, 500));

      // Handle result
      if (result.error) {
        if (result.error.includes("俱乐部商品购买数量超出上限")) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `本周已购买过四圣碎片，跳过`,
            type: "info",
          });
        } else if (result.error.includes("物品不存在")) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `盐锭不足或未加入军团，购买失败`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `购买失败: ${result.error}`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
        }
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `购买成功，获得四圣碎片`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
      }

      currentProgress.value = 100;
    } catch (error) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `购买过程出错: ${error.message}`,
        type: "error",
      });
      tokenStatus.value[tokenId] = "failed";
    } finally {
      await new Promise((r) => setTimeout(r, 1000)); // Add a small delay between accounts
    }
  }

  currentRunningTokenId.value = null;
  isRunning.value = false;
  shouldStop.value = false;
};

// 一键购买俱乐部5皮肤币
const legionStoreBuySkinCoins = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始购买俱乐部5皮肤币: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Execute purchase command
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `发送购买请求...`,
        type: "info",
      });

      for (let i = 0; i < 5; i++) {
        const result = await tokenStore.sendMessageWithPromise(
          tokenId,
          "legion_storebuygoods",
          { "id": 1 },
          5000,
        );

        await new Promise((r) => setTimeout(r, 500));
      }

      // Handle result
      if (result.error) {
        if (result.error.includes("俱乐部商品购买数量超出上限")) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `本周已购买过皮肤币，跳过`,
            type: "info",
          });
        } else if (result.error.includes("物品不存在")) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `盐锭不足或未加入军团，购买失败`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `购买失败: ${result.error}`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
        }
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `购买成功，获得皮肤币`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
      }

      currentProgress.value = 100;
    } catch (error) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `购买过程出错: ${error.message}`,
        type: "error",
      });
      tokenStatus.value[tokenId] = "failed";
    } finally {
      await new Promise((r) => setTimeout(r, 1000)); // Add a small delay between accounts
    }
  }

  currentRunningTokenId.value = null;
  isRunning.value = false;
  shouldStop.value = false;
};

// 免费领取珍宝阁每日奖励
const collection_claimfreereward = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  selectedTokens.value.forEach((id) => { tokenStatus.value[id] = "waiting"; });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始免费领取珍宝阁: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Execute claim free reward command
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `发送珍宝阁免费领取请求...`,
        type: "info",
      });
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "collection_claimfreereward",
        {}, // Empty body as specified in the JSON template
        5000,
      );

      await new Promise((r) => setTimeout(r, 500));

      // Handle result
      if (result.error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `珍宝阁领取失败: ${result.error}`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `珍宝阁领取成功`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
      }

      currentProgress.value = 100;
    } catch (error) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `珍宝阁领取过程出错: ${error.message}`,
        type: "error",
      });
      tokenStatus.value[tokenId] = "failed";
    } finally {
      await new Promise((r) => setTimeout(r, 1000)); // Add a small delay between accounts
    }
  }

  currentRunningTokenId.value = null;
  isRunning.value = false;
  shouldStop.value = false;
};

// 黑市一键采购
const store_purchase = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始黑市一键采购: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Execute purchase command
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `发送黑市采购请求...`,
        type: "info",
      });
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "store_purchase",
        {}, // Empty body as specified in the JSON template
        5000,
      );

      await new Promise((r) => setTimeout(r, 500));

      // Handle result
      if (result.error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `黑市采购失败: ${result.error}`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `黑市采购成功`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
      }

      currentProgress.value = 100;
    } catch (error) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `黑市采购过程出错: ${error.message}`,
        type: "error",
      });
      tokenStatus.value[tokenId] = "failed";
    } finally {
      await new Promise((r) => setTimeout(r, 1000)); // Add a small delay between accounts
    }
  }

  currentRunningTokenId.value = null;
  isRunning.value = false;
  shouldStop.value = false;
};

// ======================
// Scheduled Tasks Countdown
// ======================

// Calculate next execution time for a task
// 解析cron字段，返回可能的值数组
const parseCronField = (field, min, max) => {
  const values = new Set();

  // 处理列表，如 1,3,5 或 1-3,5-7
  if (field.includes(',')) {
    const parts = field.split(',');
    for (const part of parts) {
      // 递归处理每个列表项
      const partValues = parseCronField(part.trim(), min, max);
      partValues.forEach(value => values.add(value));
    }
    return Array.from(values);
  }

  // 处理星号
  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return Array.from(values);
  }

  // 处理步长，如 */5 或 0/1 或 1-10/2
  if (field.includes('/')) {
    const [range, step] = field.split('/');
    const stepNum = parseInt(step);

    let start = min;
    let end = max;

    // 处理范围部分
    if (range !== '*') {
      if (range.includes('-')) {
        const [rangeStart, rangeEnd] = range.split('-').map(Number);
        start = rangeStart;
        end = rangeEnd;
      } else {
        start = parseInt(range);
        end = max;
      }
    }

    // 生成步长值
    for (let i = start; i <= end; i += stepNum) {
      values.add(i);
    }
    return Array.from(values);
  }

  // 处理范围，如 1-5
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    for (let i = start; i <= end; i++) {
      values.add(i);
    }
    return Array.from(values);
  }

  // 处理单个数字
  const num = parseInt(field);
  if (!isNaN(num)) {
    values.add(num);
  }
  return Array.from(values);
};

const calculateNextExecutionTime = (task) => {
  const now = new Date();

  if (task.runType === 'daily') {
    // For daily tasks, parse the runTime and calculate next execution
    const [hours, minutes] = task.runTime.split(':').map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If today's time has passed, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  } else if (task.runType === 'cron') {
    // For cron tasks, parse the cron expression
    const cronParts = task.cronExpression.split(' ').filter(Boolean);
    if (cronParts.length < 5) return null;

    const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = cronParts;

    // 解析各个字段的可能值
    const possibleMinutes = parseCronField(minuteField, 0, 59);
    const possibleHours = parseCronField(hourField, 0, 23);
    const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
    const possibleMonths = parseCronField(monthField, 1, 12);
    const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);

    // 从当前时间开始，寻找下一个匹配的时间
    let nextRun = new Date(now);
    nextRun.setSeconds(0, 0);
    nextRun.setMinutes(nextRun.getMinutes() + 1); // 从下一分钟开始检查

    // 最多检查未来一年
    const maxCheckTime = new Date(now);
    maxCheckTime.setFullYear(maxCheckTime.getFullYear() + 1);

    while (nextRun <= maxCheckTime) {
      const minutes = nextRun.getMinutes();
      const hours = nextRun.getHours();
      const dayOfMonth = nextRun.getDate();
      const month = nextRun.getMonth() + 1; // JavaScript月份是0-based
      const dayOfWeek = nextRun.getDay(); // 0是周日

      // 检查所有字段是否匹配
      const matchesMinute = possibleMinutes.includes(minutes);
      const matchesHour = possibleHours.includes(hours);
      const matchesDayOfMonth = possibleDaysOfMonth.includes(dayOfMonth);
      const matchesMonth = possibleMonths.includes(month);
      const matchesDayOfWeek = possibleDaysOfWeek.includes(dayOfWeek);
      
      // Special handling: if both dayOfMonth and dayOfWeek are specified, they are OR'ed
      const isDayOfWeekSpecified = dayOfWeekField !== '*';
      const isDayOfMonthSpecified = dayOfMonthField !== '*';
      
      let matchesDay;
      if (isDayOfWeekSpecified && isDayOfMonthSpecified) {
        // If both are specified, match either
        matchesDay = matchesDayOfMonth || matchesDayOfWeek;
      } else {
        // If only one is specified, match that one
        matchesDay = matchesDayOfMonth && matchesDayOfWeek;
      }
      
      if (matchesMinute && matchesHour && matchesDay && matchesMonth) {
        return nextRun;
      }

      // 检查下一分钟
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }

    return null;
  }

  return null;
};

// Format time difference as "X天X小时X分X秒"
const formatTimeDifference = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  let result = '';
  if (days > 0) result += `${days}天`;
  if (remainingHours > 0 || days > 0) result += `${remainingHours}小时`;
  if (remainingMinutes > 0 || remainingHours > 0 || days > 0) result += `${remainingMinutes}分`;
  result += `${remainingSeconds}秒`;

  return result;
};

// Task countdowns ref
const taskCountdowns = ref({});
const nextExecutionTimes = ref({});

// Update countdowns for all tasks
const updateCountdowns = () => {
  const now = Date.now();

  scheduledTasks.value.forEach(task => {
    if (!nextExecutionTimes.value[task.id] || nextExecutionTimes.value[task.id] <= now) {
      // Calculate next execution time if not set or passed
      nextExecutionTimes.value[task.id] = calculateNextExecutionTime(task);
    }

    if (nextExecutionTimes.value[task.id]) {
      const timeDiff = nextExecutionTimes.value[task.id] - now;
      taskCountdowns.value[task.id] = {
        remainingTime: Math.max(0, timeDiff),
        formatted: formatTimeDifference(Math.max(0, timeDiff)),
        isNearExecution: timeDiff < 5 * 60 * 1000 // Less than 5 minutes
      };
    }
  });
};

// 计算最短倒计时任务
const shortestCountdownTask = computed(() => {
  if (scheduledTasks.value.length === 0) return null;

  let shortestTask = null;
  let shortestTime = Infinity;

  // 遍历所有任务，找到倒计时最短的任务
  scheduledTasks.value.forEach(task => {
    const countdown = taskCountdowns.value[task.id];
    if (countdown && countdown.remainingTime < shortestTime) {
      shortestTime = countdown.remainingTime;
      shortestTask = {
        task,
        countdown
      };
    }
  });

  return shortestTask;
});

// Start countdown interval
let countdownInterval = null;

const startCountdown = () => {
  // Clear any existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Update countdowns immediately
  updateCountdowns();

  // Update countdowns every second
  countdownInterval = setInterval(updateCountdowns, 1000);
};

// ======================
// Scheduled Tasks Scheduler
// ======================

// Initialize scheduled tasks from localStorage
loadScheduledTasks();

// Watch for changes to scheduledTasks for debugging
watch(
  scheduledTasks,
  (newVal) => {
    
    // Reset countdowns when tasks change
    nextExecutionTimes.value = {};
    taskCountdowns.value = {};
    updateCountdowns();
  },
  { deep: true },
);

// 修复TimePicker的"Invalid time value"错误：确保runTime的初始值不是null
watch(
  () => showTaskModal.value,
  (isVisible) => {
    if (isVisible && !taskForm.runTime) {
      // 当模态框显示且runTime为null时，将其设置为undefined
      taskForm.runTime = undefined;
    }
  }
);

// Task scheduler variables - moved to component level scope
let schedulerIntervalId = null;
let lastTaskExecution = null;
let healthCheckInterval = null;

// Health check for the scheduler
const healthCheck = () => {
  // If interval is not running, restart it
  if (!schedulerIntervalId) {
    console.error(`[${new Date().toISOString()}] Task scheduler interval is not running, restarting...`);
    startScheduler();
  }

  // Add a safety mechanism to prevent isRunning from being stuck
  if (isRunning.value) {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000; // 10 minutes ago
    if (lastTaskExecution && lastTaskExecution < tenMinutesAgo) {
      console.error(`[${new Date().toISOString()}] isRunning has been true for more than 10 minutes, resetting to false`);
      isRunning.value = false;
      addLog({
        time: new Date().toLocaleTimeString(),
        message: "=== 检测到任务执行超时，已重置isRunning状态 ===",
        type: "warning",
      });
    }
  }
};

// Start the scheduler
const startScheduler = () => {
  // Clear any existing interval first
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
  }

  // Check every 10 seconds instead of 60 seconds for more timely task execution
  schedulerIntervalId = setInterval(() => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Don't skip all tasks if isRunning is true, just skip individual task execution if already running
      const tasksToRun = scheduledTasks.value.filter(task => task.enabled);

      if (tasksToRun.length === 0) {
        return;
      }

      tasksToRun.forEach((task) => {
        let shouldRun = false;
        let reason = '';

        if (task.runType === "daily") {
          // Check if current time matches the scheduled time
          const taskTime = task.runTime;
          const nowTime = now.toLocaleTimeString("zh-CN", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });
          shouldRun = nowTime === taskTime;
          reason = `currentTime=${nowTime}, taskTime=${taskTime}, match=${shouldRun}`;
        } else if (task.runType === "cron") {
          // Improved cron expression parsing
          try {
            const cronParts = task.cronExpression.split(" ").filter(Boolean);

            if (cronParts.length < 5) {
              console.error(`[${new Date().toISOString()}] Invalid cron expression: ${task.cronExpression}, must have at least 5 parts`);
              addLog({
                time: currentTime,
                message: `=== 定时任务 ${task.name} 的Cron表达式无效: ${task.cronExpression}，必须包含至少5个字段 ===`,
                type: "error",
              });
              return;
            }

            const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = cronParts;

            // 使用之前定义的parseCronField函数解析cron字段
            const possibleMinutes = parseCronField(minuteField, 0, 59);
            const possibleHours = parseCronField(hourField, 0, 23);
            const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
            const possibleMonths = parseCronField(monthField, 1, 12);
            const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);

            // 检查当前时间是否匹配cron表达式
            const matchesMinute = possibleMinutes.includes(now.getMinutes());
            const matchesHour = possibleHours.includes(now.getHours());
            const matchesDayOfMonth = possibleDaysOfMonth.includes(now.getDate());
            const matchesMonth = possibleMonths.includes(now.getMonth() + 1); // months are 0-based in JS
            const matchesDayOfWeek = possibleDaysOfWeek.includes(now.getDay()); // 0是周日

            // Special handling: if both dayOfMonth and dayOfWeek are specified, they are OR'ed
            const isDayOfWeekSpecified = dayOfWeekField !== '*';
            const isDayOfMonthSpecified = dayOfMonthField !== '*';
            
            let matchesDay;
            if (isDayOfWeekSpecified && isDayOfMonthSpecified) {
              // If both are specified, match either
              matchesDay = matchesDayOfMonth || matchesDayOfWeek;
            } else {
              // If only one is specified, match that one
              matchesDay = matchesDayOfMonth && matchesDayOfWeek;
            }

            shouldRun = matchesMinute && matchesHour && matchesDay && matchesMonth;
            reason = `minute=${matchesMinute}, hour=${matchesHour}, dayOfMonth=${matchesDayOfMonth}, dayOfWeek=${matchesDayOfWeek}, month=${matchesMonth}, matchesDay=${matchesDay}`;
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Error parsing cron expression ${task.cronExpression}:`, error);
            addLog({
              time: currentTime,
              message: `=== 解析定时任务 ${task.name} 的Cron表达式失败: ${error.message} ===`,
              type: "error",
            });
            return;
          }
        }

        if (shouldRun) {
          // Check if the task was already executed in the last minute to avoid duplicate execution
          const taskExecutionKey = `${task.id}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}`;
          const lastExecutionKey = localStorage.getItem(`lastTaskExecution_${task.id}`);

          if (lastExecutionKey !== taskExecutionKey) {
            // Update last execution time
            localStorage.setItem(`lastTaskExecution_${task.id}`, taskExecutionKey);

            // Execute the task
            lastTaskExecution = Date.now();
            executeScheduledTask(task);
          } else {
            addLog({
              time: currentTime,
              message: `=== 任务 ${task.name} 本分钟内已执行，跳过 ===`,
              type: "info",
            });
          }
        }
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in task scheduler:`, error);
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 定时任务调度服务发生错误: ${error.message} ===`,
        type: "error",
      });
    }
  }, 10000); // Check every 10 seconds
};

// Debug: Log initial state when component mounts
onMounted(() => {
  // Start the task scheduler after all functions are initialized
  scheduleTaskExecution();
  // Start countdown timer
  startCountdown();
});

// Cleanup countdown interval on unmount
onBeforeUnmount(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  // Cleanup task scheduler intervals
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
    addLog({
      time: new Date().toLocaleTimeString(),
      message: "=== 定时任务调度服务已停止 ===",
      type: "info",
    });
  }
  
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
});

// Task scheduler - ensure it runs properly
// 删除旧的scheduleTaskExecution函数，使用组件级别的实现
const scheduleTaskExecution = () => {
  // Log the start of the scheduler
  addLog({
    time: new Date().toLocaleTimeString(),
    message: "=== 定时任务调度服务已启动 ===",
    type: "info",
  });

  // Store interval ID for cleanup using ref to persist across component lifecycle
  const intervalId = ref(null);
  let lastTaskExecution = null;

  // Health check for the scheduler
  const healthCheck = () => {

    // If interval is not running, restart it
    if (!intervalId.value) {
      console.error(`[${new Date().toISOString()}] Task scheduler interval is not running, restarting...`);
      startScheduler();
    }

    // Add a safety mechanism to prevent isRunning from being stuck
    if (isRunning.value) {
      const now = Date.now();
      const tenMinutesAgo = now - 10 * 60 * 1000; // 10 minutes ago
      if (lastTaskExecution && lastTaskExecution < tenMinutesAgo) {
        console.error(`[${new Date().toISOString()}] isRunning has been true for more than 10 minutes, resetting to false`);
        isRunning.value = false;
        addLog({
          time: new Date().toLocaleTimeString(),
          message: "=== 检测到任务执行超时，已重置isRunning状态 ===",
          type: "warning",
        });
      }
    }
  };

  // Start the scheduler
  const startScheduler = () => {
    // Clear any existing interval first
    if (intervalId.value) {
      clearInterval(intervalId.value);
    }

    // Check every 10 seconds instead of 60 seconds for more timely task execution
    intervalId.value = setInterval(() => {
      try {
        const now = new Date();
        const currentTime = now.toLocaleTimeString("zh-CN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        // Log the current check time for debugging


        // Add detailed log about scheduler status (commented out for cleaner logs)
        // addLog({
        //   time: currentTime,
        //   message: `=== 定时任务调度服务检查中，isRunning: ${isRunning.value}，任务数量: ${scheduledTasks.value.length} ===`,
        //   type: "info",
        // });

        // Don't skip all tasks if isRunning is true, just skip individual task execution if already running
        const tasksToRun = scheduledTasks.value.filter(task => task.enabled);

        if (tasksToRun.length === 0) {
          return;
        }

        tasksToRun.forEach((task) => {
          let shouldRun = false;
          let reason = '';

          if (task.runType === "daily") {
            // Check if current time matches the scheduled time
            const taskTime = task.runTime;
            const nowTime = now.toLocaleTimeString("zh-CN", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            });
            shouldRun = nowTime === taskTime;
            reason = `currentTime=${nowTime}, taskTime=${taskTime}, match=${shouldRun}`;
          } else if (task.runType === "cron") {
            // Improved cron expression parsing
            try {
              const cronParts = task.cronExpression.split(" ").filter(Boolean);

              if (cronParts.length < 5) {
                console.error(`[${new Date().toISOString()}] Invalid cron expression: ${task.cronExpression}, must have at least 5 parts`);
                addLog({
                  time: currentTime,
                  message: `=== 定时任务 ${task.name} 的Cron表达式无效: ${task.cronExpression}，必须包含至少5个字段 ===`,
                  type: "error",
                });
                return;
              }

              const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = cronParts;

              // 使用之前定义的parseCronField函数解析cron字段
              const possibleMinutes = parseCronField(minuteField, 0, 59);
              const possibleHours = parseCronField(hourField, 0, 23);
              const possibleDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
              const possibleMonths = parseCronField(monthField, 1, 12);
              const possibleDaysOfWeek = parseCronField(dayOfWeekField, 0, 7);

              // 检查当前时间是否匹配cron表达式
              const matchesMinute = possibleMinutes.includes(now.getMinutes());
              const matchesHour = possibleHours.includes(now.getHours());
              const matchesDayOfMonth = possibleDaysOfMonth.includes(now.getDate());
              const matchesMonth = possibleMonths.includes(now.getMonth() + 1); // months are 0-based in JS
              const matchesDayOfWeek = possibleDaysOfWeek.includes(now.getDay()); // 0是周日

              shouldRun = matchesMinute && matchesHour && matchesDayOfMonth && matchesMonth && matchesDayOfWeek;
              reason = `minute=${matchesMinute}, hour=${matchesHour}, dayOfMonth=${matchesDayOfMonth}, month=${matchesMonth}, dayOfWeek=${matchesDayOfWeek}`;
            } catch (error) {
              console.error(`[${new Date().toISOString()}] Error parsing cron expression ${task.cronExpression}:`, error);
              addLog({
                time: currentTime,
                message: `=== 解析定时任务 ${task.name} 的Cron表达式失败: ${error.message} ===`,
                type: "error",
              });
              return;
            }
          }

          // Add detailed log about task check result (commented out for cleaner logs)

          // addLog({
          //   time: currentTime,
          //   message: `=== 检查任务 ${task.name}: 应该执行=${shouldRun}，原因=${reason} ===`,
          //   type: shouldRun ? "success" : "info",
          // });

          if (shouldRun) {
            // Check if the task was already executed in the last minute to avoid duplicate execution
            const taskExecutionKey = `${task.id}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}`;
            const lastExecutionKey = localStorage.getItem(`lastTaskExecution_${task.id}`);

            if (lastExecutionKey !== taskExecutionKey) {
              // Update last execution time
              localStorage.setItem(`lastTaskExecution_${task.id}`, taskExecutionKey);

              // Execute the task

              lastTaskExecution = Date.now();
              executeScheduledTask(task);
            } else {

              addLog({
                time: currentTime,
                message: `=== 任务 ${task.name} 本分钟内已执行，跳过 ===`,
                type: "info",
              });
            }
          }
        });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in task scheduler:`, error);
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 定时任务调度服务发生错误: ${error.message} ===`,
          type: "error",
        });
      }
    }, 10000); // Check every 10 seconds


  };

  // Start the scheduler
  startScheduler();

  // Health check every 5 minutes instead of 1 hour for more frequent safety checks
  setInterval(healthCheck, 5 * 60 * 1000);

  // Initial health check
  healthCheck();

  // Cleanup on component unmount
  onBeforeUnmount(() => {

    if (intervalId.value) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
    addLog({
      time: new Date().toLocaleTimeString(),
      message: "=== 定时任务调度服务已停止 ===",
      type: "info",
    });
  });
};

// Verify task dependencies with retry and fault tolerance
const verifyTaskDependencies = async (task) => {
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `=== 开始验证定时任务 ${task.name} 的依赖 ===`,
    type: "info",
  });

  // Verify localStorage is available
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    addLog({
      time: new Date().toLocaleTimeString(),
      message: "✅ localStorage可用",
      type: "info",
    });
  } catch (error) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `❌ localStorage不可用: ${error.message}`,
      type: "error",
    });
    return false;
  }

  // Verify token store is available
  if (!tokenStore || !tokenStore.gameTokens) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: "❌ Token存储不可用",
      type: "error",
    });
    return false;
  }

  // Verify task functions exist
  for (const taskName of task.selectedTasks) {
    const taskFunction = eval(taskName);
    if (typeof taskFunction !== "function") {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `❌ 任务函数不存在: ${taskName}`,
        type: "error",
      });
      return false;
    }
  }

  // WebSocket connection check with retry and manual connect mechanism
  const checkWebSocketWithRetry = async (tokenId, maxRetries = 3, retryDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      // 检查当前连接状态
      const status = tokenStore.getWebSocketStatus(tokenId);
      if (status === "connected") {
        return true;
      }

      // 尝试手动触发WebSocket连接
      if (i < maxRetries) {
        const tokenName = tokenStore.gameTokens.find(t => t.id === tokenId)?.name || tokenId;

        try {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `⏳ 账号 ${tokenName} WebSocket未连接，尝试手动连接... (${i + 1}/${maxRetries})`,
            type: "warning",
          });

          // 获取token的完整信息
          const token = tokenStore.gameTokens.find(t => t.id === tokenId);
          if (token && token.token) {
            // 尝试使用createWebSocketConnection方法手动连接
            if (typeof tokenStore.createWebSocketConnection === 'function') {
              tokenStore.createWebSocketConnection(tokenId, token.token);
            }
            // 如果createWebSocketConnection方法不存在，尝试使用selectToken方法
            else if (typeof tokenStore.selectToken === 'function') {
              tokenStore.selectToken(tokenId, true); // forceReconnect为true
            }

            // 等待一段时间让连接建立
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            // 如果token信息不完整，跳过连接尝试
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `⚠️  账号 ${tokenName} 缺少token信息，无法尝试手动连接`,
              type: "warning",
            });
            break;
          }
        } catch (error) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `❌ 账号 ${tokenName} 尝试手动连接失败: ${error.message}`,
            type: "error",
          });
          // 继续下一次重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // 最后再次检查连接状态
    return tokenStore.getWebSocketStatus(tokenId) === "connected";
  };

  // Check WebSocket connections with retry
  const connectedTokens = [];
  const disconnectedTokens = [];

  for (const tokenId of task.selectedTokens) {
    const tokenName = tokenStore.gameTokens.find(t => t.id === tokenId)?.name || tokenId;
    const isConnected = await checkWebSocketWithRetry(tokenId);

    if (isConnected) {
      connectedTokens.push({ id: tokenId, name: tokenName });
    } else {
      disconnectedTokens.push({ id: tokenId, name: tokenName });
    }
  }

  // Log connection status
  if (connectedTokens.length > 0) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `✅ 已连接账号: ${connectedTokens.map(t => t.name).join(", ")}`,
      type: "info",
    });
  }

  if (disconnectedTokens.length > 0) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `⚠️  未连接账号: ${disconnectedTokens.map(t => t.name).join(", ")}`,
      type: "warning",
    });
  }

  // If no tokens are connected, return false
  if (connectedTokens.length === 0) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== 定时任务 ${task.name} 没有可用的连接账号，取消执行 ===`,
      type: "error",
    });
    return false;
  }

  // Store connected tokens for execution
  task.connectedTokens = connectedTokens.map(t => t.id);

  addLog({
    time: new Date().toLocaleTimeString(),
    message: `=== 定时任务 ${task.name} 的依赖验证通过，将执行 ${connectedTokens.length} 个账号 ===`,
    type: "success",
  });
  return true;
};

// Execute a scheduled task with dependency verification
const executeScheduledTask = async (task) => {
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `=== 开始执行定时任务: ${task.name} ===`,
    type: "info",
  });

  try {
    // Verify dependencies before executing task
    const dependenciesValid = await verifyTaskDependencies(task);
    if (!dependenciesValid) {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 定时任务 ${task.name} 依赖验证失败，取消执行 ===`,
        type: "error",
      });
      return;
    }

    // Set selected tokens from the task - use selectedTokens if connectedTokens is not available
    selectedTokens.value = [...(task.connectedTokens || task.selectedTokens)];

    // Execute each selected task
    for (const taskName of task.selectedTasks) {
      if (shouldStop.value) break;

      addLog({
        time: new Date().toLocaleTimeString(),
        message: `执行任务: ${availableTasks.find((t) => t.value === taskName)?.label || taskName}`,
        type: "info",
      });

      // Call the task function dynamically
      const taskFunction = eval(taskName);
      if (typeof taskFunction === "function") {
        // For batch operations, pass isScheduledTask = true
        if (['batchOpenBox', 'batchFish', 'batchRecruit', 'batchLegacyGiftSendEnhanced'].includes(taskName)) {
          await taskFunction(true);
        } else {
          await taskFunction();
        }
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `任务函数不存在: ${taskName}`,
          type: "error",
        });
      }
    }

    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== 定时任务执行完成: ${task.name} ===`,
      type: "success",
    });
  } catch (error) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== 定时任务执行失败: ${error.message} ===`,
      type: "error",
    });
    console.error(`[${new Date().toISOString()}] Error executing scheduled task ${task.name}:`, error);
  }
};

const boxTypeOptions = [
  { label: "木质宝箱", value: 2001 },
  { label: "青铜宝箱", value: 2002 },
  { label: "黄金宝箱", value: 2003 },
  { label: "铂金宝箱", value: 2004 },
];

const fishTypeOptions = [
  { label: "普通鱼竿", value: 1 },
  { label: "黄金鱼竿", value: 2 },
];

const openHelperModal = (type) => {
  helperType.value = type;
  showHelperModal.value = true;
};

// 批量功法残卷赠送相关方法
const clearRecipientError = () => {
  recipientIdError.value = '';
};

const validateRecipientId = (value) => {
  if (!value || value === '') {
    return true; // 允许为空，由按钮禁用控制
  }
  if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
    recipientIdError.value = '请输入有效的数字ID';
    return false;
  }
  return true;
};

// 头像处理方法
const handleAvatarLoad = () => {
  isAvatarLoading.value = false;
  avatarLoadError.value = false;
};

const handleAvatarError = () => {
  isAvatarLoading.value = false;
  avatarLoadError.value = true;
};

const resetAvatarState = () => {
  isAvatarLoading.value = true;
  avatarLoadError.value = false;
};

const queryRecipientInfo = async () => {
  // 1. 输入验证
  if (!recipientIdInput.value || recipientIdInput.value === '') {
    recipientIdError.value = '请输入接收者ID';
    return;
  }
  
  const recipientId = Number(recipientIdInput.value);
  if (!Number.isInteger(recipientId) || recipientId <= 0) {
    recipientIdError.value = '请输入有效的数字ID';
    return;
  }
  
  // 2. 检查选中账号
  if (selectedTokens.value.length === 0) {
    recipientIdError.value = '请先选择要操作的角色';
    return;
  }
  
  // 3. 初始化状态
  isQueryingRecipient.value = true;
  recipientIdError.value = '';
  recipientInfo.value = null;
  // 重置头像状态
  resetAvatarState();
  
  const firstTokenId = selectedTokens.value[0];
  const token = tokens.value.find((t) => t.id === firstTokenId);
  
  // 记录开始查询
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `=== 开始查询接收者信息: 使用账号 ${token.name} (ID: ${firstTokenId}) ===`,
    type: "info",
  });
  
  try {
    // 确保WebSocket连接
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `正在建立WebSocket连接...`,
      type: "info",
    });
    
    // 使用现有的ensureConnection函数，它已经包含了重连机制
    await ensureConnection(firstTokenId);
    
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `WebSocket连接成功`,
      type: "success",
    });
    
    // 发送查询命令
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `正在发送查询命令，接收者ID: ${recipientId}`,
      type: "info",
    });
    
    // 延长超时时间到10秒，确保有足够时间处理
    const resp = await tokenStore.sendMessageWithPromise(
      firstTokenId,
      'rank_getroleinfo',
      {
        bottleType: 0,
        includeBottleTeam: false,
        isSearch: false,
        roleId: recipientId,
      },
      10000
    );
    
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `查询命令发送成功，正在处理响应...`,
      type: "info",
    });
    
    // 处理查询结果
    console.log('rank_getroleinfo 响应结果:', resp);
    
    // 兼容不同的响应结构
    const roleData = resp?.role || resp?.roleInfo;
    
    if (roleData) {
      // 构建完整的角色信息，移除等级和VIP字段
      recipientInfo.value = {
        roleId: roleData.roleId || roleData.role?.roleId,
        name: roleData.name || roleData.role?.name,
        // 添加头像URL
        avatarUrl: resp?.roleInfo?.headImg || roleData?.headImg || roleData?.role?.headImg || '',
        // 战力转换为亿为单位
        power: (function(p) {
          const billion = 100000000;
          return (p / billion).toFixed(2);
        })(roleData.power || roleData.role?.power || 0),
        powerUnit: '亿',
        // 扩展更多角色信息
        serverName: roleData.serverName || roleData.role?.serverName || '',
        legionName: resp?.legionInfo?.name || '',
        legionId: resp?.legionInfo?.id || 0,
      };
      
      // 格式化角色名，处理特殊字符
      const displayName = recipientInfo.value.name || '未知角色';
      
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 查询成功: 找到角色 ${displayName} (ID: ${recipientInfo.value.roleId})，战力: ${recipientInfo.value.power}${recipientInfo.value.powerUnit} ===`,
        type: "success",
      });
      
      message.success('查询成功');
    } else {
      const errorMsg = '未找到该角色信息';
      recipientIdError.value = errorMsg;
      
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 查询失败: ${errorMsg} ===`,
        type: "error",
      });
      
      message.error(errorMsg);
    }
  } catch (error) {
    // 详细的错误处理
    console.error('查询接收者信息失败:', error);
    
    let errorMsg = '查询失败';
    let logType = 'error';
    
    // 根据错误类型提供更友好的错误信息
    if (error.message.includes('连接失败')) {
      errorMsg = 'WebSocket连接失败，请检查网络或账号状态';
    } else if (error.message.includes('timeout') || error.message.includes('超时')) {
      errorMsg = '查询超时，请稍后重试';
      logType = 'warning';
    } else if (error.message.includes('200160')) {
      errorMsg = '功法系统未开启';
    } else {
      errorMsg = `查询失败: ${error.message}`;
    }
    
    recipientIdError.value = errorMsg;
    
    // 记录错误日志
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== ${errorMsg} ===`,
      type: logType,
    });
    
    // 显示用户友好的错误提示
    message.error(errorMsg);
  } finally {
    isQueryingRecipient.value = false;
    
    // 记录查询完成
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `=== 查询操作完成 ===`,
      type: "info",
    });
  }
};

const confirmLegacyGift = async () => {
  if (!recipientIdInput.value || !recipientInfo.value) {
    message.error('请先查询并确认接收者信息');
    return;
  }
  
  if (!securityPassword.value) {
    message.error('请输入安全密码');
    return;
  }
  
  // 调用增强版批量赠送功能
  await batchLegacyGiftSendEnhanced();
  
  // 关闭模态框
  showLegacyGiftModal.value = false;
  // 清空安全密码
  securityPassword.value = '';
};

const executeHelper = () => {
  // 验证数量是10的倍数
  if (helperSettings.count % 10 !== 0 || helperSettings.count < 10) {
    message.warning("消耗数量必须是10的整数倍，最小为10");
    return;
  }
  showHelperModal.value = false;
  if (helperType.value === "box") {
    batchOpenBox();
  } else if (helperType.value === "fish") {
    batchFish();
  } else if (helperType.value === "recruit") {
    batchRecruit();
  }
};

const formationOptions = [1, 2, 3, 4, 5, 6].map((v) => ({
  label: `阵容${v}`,
  value: v,
}));
const bossTimesOptions = [0, 1, 2, 3, 4].map((v) => ({
  label: `${v}次`,
  value: v,
}));

const loadSettings = (tokenId) => {
  try {
    const raw = localStorage.getItem(`daily-settings:${tokenId}`);
    const defaultSettings = {
      arenaFormation: 1,
      bossFormation: 1,
      bossTimes: 2,
      claimBottle: true,
      payRecruit: true,
      openBox: true,
      arenaEnable: true,
      claimHangUp: true,
      claimEmail: true,
      blackMarketPurchase: true,
    };
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return null;
  }
};

const openSettings = (token) => {
  currentSettingsTokenId.value = token.id;
  currentSettingsTokenName.value = token.name;
  const saved = loadSettings(token.id);
  Object.assign(currentSettings, saved);
  showSettingsModal.value = true;
};

const saveSettings = () => {
  if (currentSettingsTokenId.value) {
    localStorage.setItem(
      `daily-settings:${currentSettingsTokenId.value}`,
      JSON.stringify(currentSettings),
    );
    message.success(`已保存 ${currentSettingsTokenName.value} 的设置`);
    showSettingsModal.value = false;
  }
};

const currentRunningTokenId = ref(null);
const currentProgress = ref(0);
const logs = ref([]);
const logContainer = ref(null);
const autoScrollLog = ref(true);
const filterErrorsOnly = ref(false);
const errorCount = computed(() => {
  return logs.value.filter(log => log.type === 'error').length;
});

const filteredLogs = computed(() => {
  if (filterErrorsOnly.value) {
    return logs.value.filter(log => log.type === 'error');
  }
  return logs.value;
});

const currentRunningTokenName = computed(() => {
  const t = tokens.value.find((x) => x.id === currentRunningTokenId.value);
  return t ? t.name : "";
});

// Selection logic
const isAllSelected = computed(
  () =>
    selectedTokens.value.length === tokens.value.length &&
    tokens.value.length > 0,
);
const isIndeterminate = computed(
  () =>
    selectedTokens.value.length > 0 &&
    selectedTokens.value.length < tokens.value.length,
);

const handleSelectAll = (checked) => {
  if (checked) {
    selectedTokens.value = tokens.value.map((t) => t.id);
  } else {
    selectedTokens.value = [];
  }
};

const getStatusType = (tokenId) => {
  const status = tokenStatus.value[tokenId];
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  return "default";
};

const getStatusText = (tokenId) => {
  const status = tokenStatus.value[tokenId];
  if (status === "completed") return "已完成";
  if (status === "failed") return "失败";
  if (status === "running") return "执行中";
  return "等待中";
};

const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0];

  if (candidate?.roleId) return candidate.roleId;
  if (candidate?.id) return candidate.id;
  return targets?.roleId || targets?.id;
};

// 月度任务常量
const FISH_TARGET = 320;
const ARENA_TARGET = 240;
// 日期辅助函数
const getTodayStartSec = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};
const isTodayAvailable = (lastTimeSec) => {
  if (!lastTimeSec || typeof lastTimeSec !== "number") return true;
  return lastTimeSec < getTodayStartSec();
};
// 计算月度任务进度
const calculateMonthProgress = () => {
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const dayOfMonth = now.getDate();
  return Math.min(1, Math.max(0, dayOfMonth / daysInMonth));
};

const addLog = (log) => {
  logs.value.push(log);
  nextTick(() => {
    if (logContainer.value && autoScrollLog.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

watch(autoScrollLog, (newValue) => {
  if (newValue && logContainer.value) {
    nextTick(() => {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    });
  }
});

const copyLogs = () => {
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

const waitForConnection = async (tokenId, timeout = 2000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const status = tokenStore.getWebSocketStatus(tokenId);
    if (status === "connected") return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const resetBottles = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始重置罐子: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Execute commands
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `停止计时...`,
        type: "info",
      });
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "bottlehelper_stop",
        {},
        5000,
      );

      await new Promise((r) => setTimeout(r, 500));

      addLog({
        time: new Date().toLocaleTimeString(),
        message: `开始计时...`,
        type: "info",
      });
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "bottlehelper_start",
        {},
        5000,
      );

      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 重置完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `重置失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量重置罐子结束");
};

const claimHangUpRewards = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始领取挂机: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Execute commands

      // 1. Claim reward
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `领取挂机奖励`,
        type: "info",
      });
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "system_claimhangupreward",
        {},
        5000,
      );
      await new Promise((r) => setTimeout(r, 500));

      // 2. Add time 4 times
      for (let i = 0; i < 4; i++) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `挂机加钟 ${i + 1}/4`,
          type: "info",
        });
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "system_mysharecallback",
          { isSkipShareCard: true, type: 2 },
          5000,
        );
        await new Promise((r) => setTimeout(r, 500));
      }

      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 领取完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `领取失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量领取挂机结束");
};

const batchbaoku13 = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键宝库: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      const bosstowerinfo = await tokenStore.sendMessageWithPromise(
        tokenId,
        "bosstower_getinfo",
        {},
      );
      const towerId = bosstowerinfo.bossTower.towerId;
      if (towerId >= 1 && towerId <= 3) {
        for (let i = 0; i < 2; i++) {
          if (shouldStop.value) break;
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "bosstower_startboss",
            {},
          );
          await new Promise((r) => setTimeout(r, 500));
        }
        for (let i = 0; i < 9; i++) {
          if (shouldStop.value) break;
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "bosstower_startbox",
            {},
          );
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 宝库战斗已完成，请上线手动领取奖励 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `宝库战斗失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量宝库结束");
};

const batchbaoku45 = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键宝库: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      const bosstowerinfo = await tokenStore.sendMessageWithPromise(
        tokenId,
        "bosstower_getinfo",
        {},
      );
      const towerId = bosstowerinfo.bossTower.towerId;
      if (towerId >= 4 && towerId <= 5) {
        for (let i = 0; i < 2; i++) {
          if (shouldStop.value) break;
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "bosstower_startboss",
            {},
          );
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 宝库战斗已完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `宝库战斗失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量宝库结束");
};

const batchmengjing = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键宝库: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      if (shouldStop.value) break;
      const mjbattleTeam = { 0: 107 };
      const dayOfWeek = new Date().getDay();
      if (
        (dayOfWeek === 0) |
        (dayOfWeek === 1) |
        (dayOfWeek === 3) |
        (dayOfWeek === 4)
      ) {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "dungeon_selecthero",
          { battleTeam: mjbattleTeam },
          5000,
        );
        await new Promise((r) => setTimeout(r, 500));
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 咸王梦境已完成 ===`,
          type: "success",
        });
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 当前未在开放时间 ===`,
          type: "error",
        });
        break;
      }
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `咸王梦境失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量梦境结束");
};

const batchlingguanzi = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键领取盐罐: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      if (shouldStop.value) break;
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "bottlehelper_claim",
        {},
        5000,
      );
      await new Promise((r) => setTimeout(r, 500));
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 领取盐罐已完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `领取盐罐失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量领取盐罐结束");
};

const batchclubsign = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键俱乐部签到: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      if (shouldStop.value) break;
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "legion_signin",
        {},
        5000,
      );
      await new Promise((r) => setTimeout(r, 500));
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 俱乐部签到已完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `俱乐部签到失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量俱乐部签到结束");
};

const batcharenafight = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键竞技场战斗: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      if (shouldStop.value) break;
      for (let i = 0; i < 3; i++) {
        // 开始竞技场
        await tokenStore.sendMessageWithPromise(tokenId, "arena_startarea", {});
        let targets;
        try {
          targets = await tokenStore.sendMessageWithPromise(
            tokenId,
            "arena_getareatarget",
            {},
          );
        } catch (err) {
          message.error(`获取竞技场目标失败：${err.message}`);
          break;
        }
        const targetId = pickArenaTargetId(targets);
        if (!targetId) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `未找到可用的竞技场目标: ${error.message || "未知错误"}`,
            type: "error",
          });
          break;
        }
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "fight_startareaarena",
            { targetId },
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `${token.name} 竞技场战斗 ${i + 1}/3`,
            type: "info",
          });
          await new Promise((r) => setTimeout(r, 500));
        } catch (e) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `竞技场对决失败: ${error.message || "未知错误"}`,
            type: "error",
          });
        }
      }
      await new Promise((r) => setTimeout(r, 500));
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 竞技场战斗已完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `竞技场战斗失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量竞技场战斗结束");
};

const batchAddHangUpTime = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键加钟: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      for (let i = 0; i < 4; i++) {
        if (shouldStop.value) break;
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `执行加钟 ${i + 1}/4`,
          type: "info",
        });
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "system_mysharecallback",
          { isSkipShareCard: true, type: 2 },
          5000,
        );
        await new Promise((r) => setTimeout(r, 500));
      }
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 加钟完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `加钟失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量加钟结束");
};

const ensureConnection = async (tokenId) => {
  // Always fetch the latest token data from the store
  const latestToken = tokens.value.find((t) => t.id === tokenId);

  // 1. Check current status
  let status = tokenStore.getWebSocketStatus(tokenId);
  let connected = status === "connected";

  // 2. If not connected, try to connect
  if (!connected) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `正在连接...`,
      type: "info",
    });
    tokenStore.createWebSocketConnection(
      tokenId,
      latestToken.token,
      latestToken.wsUrl,
    );
    connected = await waitForConnection(tokenId);

    if (!connected) {
      // First attempt failed
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `连接超时，尝试重连...`,
        type: "warning",
      });

      // 3. Retry connection (Force reconnect)
      tokenStore.closeWebSocketConnection(tokenId);
      await new Promise((r) => setTimeout(r, 2000)); // Wait longer for cleanup

      addLog({
        time: new Date().toLocaleTimeString(),
        message: `正在重连...`,
        type: "info",
      });

      // Re-fetch token again just in case it was updated during the wait
      const refreshedToken = tokens.value.find((t) => t.id === tokenId);
      tokenStore.createWebSocketConnection(
        tokenId,
        refreshedToken.token,
        refreshedToken.wsUrl,
      );

      connected = await waitForConnection(tokenId);
    }
  }

  if (!connected) {
    throw new Error("连接失败 (重试后仍超时)");
  }

  // Initialize Game Data (Critical for Battle Version and Session)
  try {
    // Fetch Role Info first (Standard flow)
    await tokenStore.sendMessageWithPromise(
      tokenId,
      "role_getroleinfo",
      {},
      5000,
    );

    // Fetch Battle Version
    const res = await tokenStore.sendMessageWithPromise(
      tokenId,
      "fight_startlevel",
      {},
      5000,
    );
    if (res?.battleData?.version) {
      tokenStore.setBattleVersion(res.battleData.version);
    }
  } catch (e) {
    addLog({
      time: new Date().toLocaleTimeString(),
      message: `初始化数据失败: ${e.message}`,
      type: "warning",
    });
  }

  return true;
};

const climbTower = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始爬塔: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Initial check
      // 模仿 TowerStatus.vue 的逻辑，同时请求 tower_getinfo 和 role_getroleinfo
      await tokenStore
        .sendMessageWithPromise(tokenId, "tower_getinfo", {}, 5000)
        .catch(() => { });
      let roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
      let energy = roleInfo?.role?.tower?.energy || 0;
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `初始体力: ${energy}`,
        type: "info",
      });

      let count = 0;
      const MAX_CLIMB = 100;
      let consecutiveFailures = 0;

      while (energy > 0 && count < MAX_CLIMB) {
        if (shouldStop.value) break;

        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "fight_starttower",
            {},
            5000,
          );
          count++;
          consecutiveFailures = 0;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `爬塔第 ${count} 次`,
            type: "info",
          });

          // 增加等待时间，确保服务器数据更新
          await new Promise((r) => setTimeout(r, 2000));

          // Refresh energy - 同时发送 tower_getinfo 以确保数据最新
          tokenStore.sendMessage(tokenId, "tower_getinfo");
          roleInfo = await tokenStore.sendGetRoleInfo(tokenId);

          // 优先从 store 中获取最新的（虽然 sendGetRoleInfo 返回的也是最新的，但双重保险）
          const storeRoleInfo = tokenStore.gameData?.roleInfo;
          energy =
            storeRoleInfo?.role?.tower?.energy ??
            roleInfo?.role?.tower?.energy ??
            0;
        } catch (err) {
          // Check for specific error code indicating no energy/attempts left
          if (err.message && err.message.includes("200400")) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `爬塔次数已用完 (200400)`,
              type: "info",
            });
            break;
          }

          consecutiveFailures++;
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `战斗出错: ${err.message} (重试 ${consecutiveFailures}/3)`,
            type: "warning",
          });

          if (consecutiveFailures >= 3) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `连续失败次数过多，停止爬塔`,
              type: "error",
            });
            break;
          }

          await new Promise((r) => setTimeout(r, 2000));

          // 尝试刷新体力，防止因体力不足导致的错误死循环
          try {
            roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
            energy = roleInfo?.role?.tower?.energy || 0;
          } catch (e) {
            // 忽略刷新失败
          }
        }
      }

      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 爬塔结束，共 ${count} 次 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `爬塔失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量爬塔结束");
};

const batchStudy = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  // Preload questions
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `正在加载题库...`,
    type: "info",
  });
  await preloadQuestions();

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始答题: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // Reset local study status
      tokenStore.gameData.studyStatus = {
        isAnswering: false,
        questionCount: 0,
        answeredCount: 0,
        status: "",
        timestamp: null,
      };

      // Send start command
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "study_startgame",
        {},
        5000,
      );

      // Wait for completion
      let maxWait = 90; // 90 seconds timeout
      let completed = false;
      let lastStatus = "";

      while (maxWait > 0) {
        if (shouldStop.value) break;

        const status = tokenStore.gameData.studyStatus;

        if (status.status !== lastStatus) {
          lastStatus = status.status;
          if (status.status === "answering") {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `开始答题...`,
              type: "info",
            });
          } else if (status.status === "claiming_rewards") {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `正在领取奖励...`,
              type: "info",
            });
          }
        }

        if (status.status === "answering" && status.questionCount > 0) {
          // Update progress log occasionally or just rely on final success
          // addLog({ time: new Date().toLocaleTimeString(), message: `进度: ${status.answeredCount}/${status.questionCount}`, type: 'info' })
        }

        if (status.status === "completed") {
          completed = true;
          break;
        }

        await new Promise((r) => setTimeout(r, 1000));
        maxWait--;
      }

      if (completed) {
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 答题完成 ===`,
          type: "success",
        });
      } else {
        if (shouldStop.value) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `已停止`,
            type: "warning",
          });
        } else {
          tokenStatus.value[tokenId] = "failed";
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `答题超时或未开始`,
            type: "error",
          });
        }
      }
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `答题失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量答题结束");
};

// 批量钓鱼补齐
const batchTopUpFish = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始钓鱼补齐: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      // 获取月度任务进度
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `获取月度任务进度...`,
        type: "info",
      });
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "activity_get",
        {},
        10000,
      );
      const act = result?.activity || result?.body?.activity || result;

      if (!act) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `获取月度任务进度失败`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
        continue;
      }
      const myMonthInfo = act.myMonthInfo || {};
      const fishNum = Number(myMonthInfo?.["2"]?.num || 0);

      // 计算目标数量
      const monthProgress = calculateMonthProgress();
      const now = new Date();
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      const dayOfMonth = now.getDate();
      const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
      const shouldBe =
        remainingDays === 0
          ? FISH_TARGET
          : Math.min(FISH_TARGET, Math.ceil(monthProgress * FISH_TARGET));
      const need = Math.max(0, shouldBe - fishNum);
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `当前进度: ${fishNum}/${FISH_TARGET}，需要补齐: ${need}次`,
        type: "info",
      });
      if (need <= 0) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `当前进度已达标，无需补齐`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
        continue;
      }
      // 执行钓鱼补齐
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `开始执行钓鱼补齐...`,
        type: "info",
      });
      // 检查免费次数
      let role = tokenStore.gameData?.roleInfo?.role;
      if (!role) {
        try {
          const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
          role = roleInfo?.role;
        } catch { }
      }
      let freeUsed = 0;
      const lastFreeTime = Number(
        role?.statisticsTime?.["artifact:normal:lottery:time"] || 0,
      );
      if (isTodayAvailable(lastFreeTime)) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `检测到今日免费钓鱼次数，开始消耗 3 次`,
          type: "info",
        });
        for (let i = 0; i < 3 && need > freeUsed && !shouldStop.value; i++) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "artifact_lottery",
              { lotteryNumber: 1, newFree: true, type: 1 },
              8000,
            );
            freeUsed++;
            await new Promise((r) => setTimeout(r, 500));
          } catch (e) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `免费钓鱼失败: ${e.message}`,
              type: "error",
            });
            break;
          }
        }
      }
      // 获取最新进度
      const updatedResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        "activity_get",
        {},
        10000,
      );
      const updatedAct =
        updatedResult?.activity ||
        updatedResult?.body?.activity ||
        updatedResult;
      const updatedMyMonthInfo = updatedAct.myMonthInfo || {};
      const updatedFishNum = Number(updatedMyMonthInfo?.["2"]?.num || 0);
      let remaining = Math.max(0, shouldBe - updatedFishNum);
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `免费次数后进度: ${updatedFishNum}/${FISH_TARGET}，还需补齐: ${remaining}次`,
        type: "info",
      });
      if (remaining <= 0) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `已通过免费次数完成目标`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
        continue;
      }
      // 付费钓鱼
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `开始付费钓鱼补齐: 共需 ${remaining} 次（每次最多10）`,
        type: "info",
      });

      while (remaining > 0 && !shouldStop.value) {
        const batch = Math.min(10, remaining);
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "artifact_lottery",
            { lotteryNumber: batch, newFree: true, type: 1 },
            12000,
          );
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `完成 ${batch} 次付费钓鱼`,
            type: "info",
          });
          remaining -= batch;
          await new Promise((r) => setTimeout(r, 800));
        } catch (e) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `付费钓鱼失败: ${e.message}`,
            type: "error",
          });
          break;
        }
      }
      // 最终进度检查
      const finalResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        "activity_get",
        {},
        10000,
      );
      const finalAct =
        finalResult?.activity || finalResult?.body?.activity || finalResult;
      const finalMyMonthInfo = finalAct.myMonthInfo || {};
      const finalFishNum = Number(finalMyMonthInfo?.["2"]?.num || 0);
      if (finalFishNum >= shouldBe || finalFishNum >= FISH_TARGET) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `钓鱼补齐完成，最终进度: ${finalFishNum}/${FISH_TARGET}`,
          type: "success",
        });
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `钓鱼补齐已停止，未达到目标，最终进度: ${finalFishNum}/${FISH_TARGET}`,
          type: "warning",
        });
      }
      tokenStatus.value[tokenId] = "completed";
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `钓鱼补齐失败: ${error.message}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量钓鱼补齐结束");
};
// 批量竞技场补齐
const batchTopUpArena = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始竞技场补齐: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);
      // 获取月度任务进度
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `获取月度任务进度...`,
        type: "info",
      });
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        "activity_get",
        {},
        10000,
      );
      const act = result?.activity || result?.body?.activity || result;

      if (!act) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `获取月度任务进度失败`,
          type: "error",
        });
        tokenStatus.value[tokenId] = "failed";
        continue;
      }
      const myArenaInfo = act.myArenaInfo || {};
      const arenaNum = Number(myArenaInfo?.num || 0);

      // 计算目标数量
      const monthProgress = calculateMonthProgress();
      const now = new Date();
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      const dayOfMonth = now.getDate();
      const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
      const shouldBe =
        remainingDays === 0
          ? ARENA_TARGET
          : Math.min(ARENA_TARGET, Math.ceil(monthProgress * ARENA_TARGET));
      const need = Math.max(0, shouldBe - arenaNum);
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `当前进度: ${arenaNum}/${ARENA_TARGET}，需要补齐: ${need}次`,
        type: "info",
      });
      if (need <= 0) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `当前进度已达标，无需补齐`,
          type: "success",
        });
        tokenStatus.value[tokenId] = "completed";
        continue;
      }
      // 执行竞技场补齐
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `开始执行竞技场补齐...`,
        type: "info",
      });
      // 开始竞技场
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "arena_startarea",
          {},
          6000,
        );
      } catch (error) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `开始竞技场失败: ${error.message}`,
          type: "warning",
        });
        // 继续执行，可能已经在竞技场中
      }
      let safetyCounter = 0;
      const safetyMaxFights = 100;
      let round = 1;
      let remaining = need;
      while (
        remaining > 0 &&
        safetyCounter < safetyMaxFights &&
        !shouldStop.value
      ) {
        const planFights = Math.ceil(remaining / 2); // 估计每场战斗可能获得2次进度
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `第${round}轮：计划战斗 ${planFights} 场`,
          type: "info",
        });

        for (
          let i = 0;
          i < planFights &&
          safetyCounter < safetyMaxFights &&
          !shouldStop.value;
          i++
        ) {
          let targets;
          try {
            targets = await tokenStore.sendMessageWithPromise(
              tokenId,
              "arena_getareatarget",
              {},
              8000,
            );
          } catch (err) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `获取竞技场目标失败：${err.message}`,
              type: "error",
            });
            break;
          }

          const targetId = pickArenaTargetId(targets);
          if (!targetId) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `未找到可用的竞技场目标`,
              type: "warning",
            });
            break;
          }

          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "fight_startareaarena",
              { targetId },
              15000,
            );
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `竞技场战斗 ${i + 1}/${planFights} 完成`,
              type: "info",
            });
          } catch (e) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `竞技场对决失败：${e.message}`,
              type: "error",
            });
            // 继续尝试下一场战斗
          }

          safetyCounter++;
          await new Promise((r) => setTimeout(r, 1200));
        }

        // 获取最新进度
        const updatedResult = await tokenStore.sendMessageWithPromise(
          tokenId,
          "activity_get",
          {},
          10000,
        );
        const updatedAct =
          updatedResult?.activity ||
          updatedResult?.body?.activity ||
          updatedResult;
        const updatedMyArenaInfo = updatedAct.myArenaInfo || {};
        const updatedArenaNum = Number(updatedMyArenaInfo?.num || 0);
        remaining = Math.max(0, shouldBe - updatedArenaNum);

        addLog({
          time: new Date().toLocaleTimeString(),
          message: `第${round}轮后进度: ${updatedArenaNum}/${ARENA_TARGET}，还需补齐: ${remaining}次`,
          type: "info",
        });

        round++;
      }
      // 最终进度检查
      const finalResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        "activity_get",
        {},
        10000,
      );
      const finalAct =
        finalResult?.activity || finalResult?.body?.activity || finalResult;
      const finalMyArenaInfo = finalAct.myArenaInfo || {};
      const finalArenaNum = Number(finalMyArenaInfo?.num || 0);
      if (finalArenaNum >= shouldBe || finalArenaNum >= ARENA_TARGET) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `竞技场补齐完成，最终进度: ${finalArenaNum}/${ARENA_TARGET}`,
          type: "success",
        });
      } else if (safetyCounter >= safetyMaxFights) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `达到安全上限，竞技场补齐已停止，最终进度: ${finalArenaNum}/${ARENA_TARGET}`,
          type: "warning",
        });
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `竞技场补齐已停止，未达到目标，最终进度: ${finalArenaNum}/${ARENA_TARGET}`,
          type: "warning",
        });
      }
      tokenStatus.value[tokenId] = "completed";
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `竞技场补齐失败: ${error.message}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量竞技场补齐结束");
};

// --- Car Helper Functions ---
const normalizeCars = (raw) => {
  const r = raw || {};
  const body = r.body || r;
  const roleCar = body.roleCar || body.rolecar || {};

  // 优先从 roleCar.carDataMap 解析（id -> info）
  const carMap = roleCar.carDataMap || roleCar.cardatamap;
  if (carMap && typeof carMap === "object") {
    return Object.entries(carMap).map(([id, info], idx) => ({
      key: idx,
      id,
      ...(info || {}),
    }));
  }

  // 兜底
  let arr =
    body.cars || body.list || body.data || body.carList || body.vehicles || [];
  if (!Array.isArray(arr) && typeof arr === "object" && arr !== null)
    arr = Object.values(arr);
  if (Array.isArray(body) && arr.length === 0) arr = body;
  return (Array.isArray(arr) ? arr : []).map((it, idx) => ({
    key: idx,
    ...it,
  }));
};

const gradeLabel = (color) => {
  const map = {
    1: "绿·普通",
    2: "蓝·稀有",
    3: "紫·史诗",
    4: "橙·传说",
    5: "红·神话",
    6: "金·传奇",
  };
  return map[color] || "未知";
};

const isBigPrize = (rewards) => {
  const bigPrizes = [
    { type: 3, itemId: 3201, value: 10 },
    { type: 3, itemId: 1001, value: 10 },
    { type: 3, itemId: 1022, value: 2000 },
    { type: 2, itemId: 0, value: 2000 },
    { type: 3, itemId: 1023, value: 5 },
    { type: 3, itemId: 1022, value: 2500 },
    { type: 3, itemId: 1001, value: 12 },
  ];
  if (!Array.isArray(rewards)) return false;
  return bigPrizes.some((p) =>
    rewards.find(
      (r) =>
        r.type === p.type &&
        r.itemId === p.itemId &&
        Number(r.value || 0) >= p.value,
    ),
  );
};

const countRacingRefreshTickets = (rewards) => {
  if (!Array.isArray(rewards)) return 0;
  return rewards.reduce(
    (acc, r) =>
      acc + (r.type === 3 && r.itemId === 35002 ? Number(r.value || 0) : 0),
    0,
  );
};

const shouldSendCar = (car, tickets) => {
  const color = Number(car?.color || 0);
  const rewards = Array.isArray(car?.rewards) ? car.rewards : [];
  const racingTickets = countRacingRefreshTickets(rewards);
  if (tickets >= 6) {
    return color >= 5 || racingTickets >= 4 || isBigPrize(rewards);
  }
  return color >= 4 || racingTickets >= 2 || isBigPrize(rewards);
};

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const canClaim = (car) => {
  const t = Number(car?.sendAt || 0);
  if (!t) return false;
  const tsMs = t < 1e12 ? t * 1000 : t;
  return Date.now() - tsMs >= FOUR_HOURS_MS;
};

const batchSmartSendCar = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始智能发车: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // 1. Fetch Car Info
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `获取车辆信息...`,
        type: "info",
      });
      const res = await tokenStore.sendMessageWithPromise(
        tokenId,
        "car_getrolecar",
        {},
        10000,
      );
      let carList = normalizeCars(res?.body ?? res);

      // 2. Fetch Tickets
      let refreshTickets = 0;
      try {
        const roleRes = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_getroleinfo",
          {},
          10000,
        );
        const qty = roleRes?.role?.items?.[35002]?.quantity;
        refreshTickets = Number(qty || 0);
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `剩余车票: ${refreshTickets}`,
          type: "info",
        });
      } catch (_) { }

      // 3. Process Cars
      for (const car of carList) {
        if (shouldStop.value) break;

        if (Number(car.sendAt || 0) !== 0) continue; // Already sent

        // Check if we should send immediately
        if (shouldSendCar(car, refreshTickets)) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `车辆[${gradeLabel(car.color)}]满足条件，直接发车`,
            type: "info",
          });
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "car_send",
            {
              carId: String(car.id),
              helperId: 0,
              text: "",
              isUpgrade: false,
            },
            10000,
          );
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        // Try to refresh
        let shouldRefresh = false;
        const free = Number(car.refreshCount ?? 0) === 0;
        if (refreshTickets >= 6) shouldRefresh = true;
        else if (free) shouldRefresh = true;
        else {
          // No tickets and not free, just send
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `车辆[${gradeLabel(car.color)}]不满足条件且无刷新次数，直接发车`,
            type: "warning",
          });
          await tokenStore.sendMessageWithPromise(
            tokenId,
            "car_send",
            {
              carId: String(car.id),
              helperId: 0,
              text: "",
              isUpgrade: false,
            },
            10000,
          );
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        // Refresh loop
        while (shouldRefresh) {
          if (shouldStop.value) break;

          addLog({
            time: new Date().toLocaleTimeString(),
            message: `车辆[${gradeLabel(car.color)}]尝试刷新...`,
            type: "info",
          });
          const resp = await tokenStore.sendMessageWithPromise(
            tokenId,
            "car_refresh",
            { carId: String(car.id) },
            10000,
          );
          const data = resp?.car || resp?.body?.car || resp;

          // Update local car info
          if (data && typeof data === "object") {
            if (data.color != null) car.color = Number(data.color);
            if (data.refreshCount != null)
              car.refreshCount = Number(data.refreshCount);
            if (data.rewards != null) car.rewards = data.rewards;
          }

          // Update tickets
          try {
            const roleRes = await tokenStore.sendMessageWithPromise(
              tokenId,
              "role_getroleinfo",
              {},
              5000,
            );
            refreshTickets = Number(
              roleRes?.role?.items?.[35002]?.quantity || 0,
            );
          } catch (_) { }

          // Check if good enough now
          if (shouldSendCar(car, refreshTickets)) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `刷新后车辆[${gradeLabel(car.color)}]满足条件，发车`,
              type: "success",
            });
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "car_send",
              {
                carId: String(car.id),
                helperId: 0,
                text: "",
                isUpgrade: false,
              },
              10000,
            );
            await new Promise((r) => setTimeout(r, 500));
            break;
          }

          // Check if can continue refreshing
          const freeNow = Number(car.refreshCount ?? 0) === 0;
          if (refreshTickets >= 6) shouldRefresh = true;
          else if (freeNow) shouldRefresh = true;
          else {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `刷新后车辆[${gradeLabel(car.color)}]仍不满足条件且无刷新次数，发车`,
              type: "warning",
            });
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "car_send",
              {
                carId: String(car.id),
                helperId: 0,
                text: "",
                isUpgrade: false,
              },
              10000,
            );
            await new Promise((r) => setTimeout(r, 500));
            break;
          }

          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 智能发车完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `智能发车失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量智能发车结束");
};

const batchClaimCars = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始一键收车: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // 1. Fetch Car Info
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `获取车辆信息...`,
        type: "info",
      });
      const res = await tokenStore.sendMessageWithPromise(
        tokenId,
        "car_getrolecar",
        {},
        10000,
      );
      let carList = normalizeCars(res?.body ?? res);
      let refreshlevel = res?.roleCar?.research?.[1] || 0;
      
      // 2. Claim Cars
      let claimedCount = 0;
      for (const car of carList) {
        if (canClaim(car)) {
          try {
            await tokenStore.sendMessageWithPromise(
              tokenId,
              "car_claim",
              { carId: String(car.id) },
              10000,
            );
            claimedCount++;
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `收车成功: ${gradeLabel(car.color)}`,
              type: "success",
            });
            const roleRes = await tokenStore.sendMessageWithPromise(
              tokenId,
              "role_getroleinfo",
              {},
              5000,
            );
            let refreshpieces = Number(
              roleRes?.role?.items?.[35009]?.quantity || 0,
            );
            while (refreshlevel < CarresearchItem.length && refreshpieces >= CarresearchItem[refreshlevel]) {
              try {
                await tokenStore.sendMessageWithPromise(tokenId, 'car_research', { researchId: 1 }, 5000);
                refreshlevel++;
                
                // 更新refreshpieces数量
                const updatedRoleRes = await tokenStore.sendMessageWithPromise(
                  tokenId,
                  "role_getroleinfo",
                  {},
                  5000,
                );
                refreshpieces = Number(
                  updatedRoleRes?.role?.items?.[35009]?.quantity || 0,
                );
                
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `执行车辆改装升级，当前等级: ${refreshlevel}`,
                  type: "success",
                });

                await new Promise((r) => setTimeout(r, 300));
              } catch (e) {
                addLog({
                  time: new Date().toLocaleTimeString(),
                  message: `车辆改装升级失败: ${e.message}`,
                  type: "error",
                });
                break; // 升级失败时跳出循环
              }
            }
          } catch (e) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `收车失败: ${e.message}`,
              type: "warning",
            });
          }
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (claimedCount === 0) {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `没有可收取的车辆`,
          type: "info",
        });
      }

      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 收车完成，共收取 ${claimedCount} 辆 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `收车失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量一键收车结束");
};

const startBatch = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    let retryCount = 0;
    const MAX_RETRIES = 1;
    let success = false;

    while (retryCount <= MAX_RETRIES && !success) {
      const token = tokens.value.find((t) => t.id === tokenId);

      try {
        if (retryCount === 0) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== 开始执行: ${token.name} ===`,
            type: "info",
          });
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== 尝试重试: ${token.name} (第${retryCount}次) ===`,
            type: "info",
          });
        }

        await ensureConnection(tokenId);

        // Run tasks
        await runner.run(tokenId, {
          onLog: (log) => addLog(log),
          onProgress: (p) => {
            currentProgress.value = p;
          },
        });

        success = true;
        tokenStatus.value[tokenId] = "completed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 执行完成 ===`,
          type: "success",
        });
      } catch (error) {
        console.error(error);
        if (retryCount < MAX_RETRIES) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `执行出错: ${error.message}，等待3秒后重试...`,
            type: "warning",
          });
          // Wait for potential token refresh in store
          await new Promise((r) => setTimeout(r, 3000));
          retryCount++;
        } else {
          tokenStatus.value[tokenId] = "failed";
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `执行失败: ${error.message}`,
            type: "error",
          });
        }
      }
    }

    // Optional: Disconnect if it wasn't connected before?
    // For now, keep it connected or let the store manage it.
    // Maybe wait a bit before next
    await new Promise((r) => setTimeout(r, 1000));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量任务执行结束");
};

// --- 批量助手函数 ---
const batchClaimBoxPointReward = async () => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始领取宝箱积分: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      await tokenStore.sendMessageWithPromise(
        tokenId,
        "item_batchclaimboxpointreward",
        {},
        5000,
      );
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `宝箱积分领取成功`,
        type: "success",
      });

      await tokenStore.sendMessage(tokenId, "role_getroleinfo");
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 领取完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `领取失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量领取宝箱积分结束");
};

const batchOpenBox = async (isScheduledTask = false) => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  const boxType = isScheduledTask ? batchSettings.defaultBoxType : helperSettings.boxType;
  const totalCount = isScheduledTask ? batchSettings.boxCount : helperSettings.count;
  const batches = Math.floor(totalCount / 10);
  const remainder = totalCount % 10;
  const boxNames = {
    2001: "木质宝箱",
    2002: "青铜宝箱",
    2003: "黄金宝箱",
    2004: "铂金宝箱",
  };

  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始批量开箱: ${token.name} ===`,
        type: "info",
      });
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `宝箱类型: ${boxNames[boxType]}, 数量: ${totalCount}`,
        type: "info",
      });

      await ensureConnection(tokenId);

      for (let i = 0; i < batches; i++) {
        if (shouldStop.value) break;
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "item_openbox",
          { itemId: boxType, number: 10 },
          5000,
        );
        currentProgress.value = Math.floor(
          ((i + 1) / (batches + (remainder > 0 ? 1 : 0))) * 100,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `开箱进度: ${(i + 1) * 10}/${totalCount}`,
          type: "info",
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      if (remainder > 0 && !shouldStop.value) {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "item_openbox",
          { itemId: boxType, number: remainder },
          5000,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `开箱进度: ${totalCount}/${totalCount}`,
          type: "info",
        });
      }
      await tokenStore.sendMessageWithPromise(
        tokenId,
        "item_batchclaimboxpointreward",
      );
      await new Promise((r) => setTimeout(r, 500));
      await tokenStore.sendMessage(tokenId, "role_getroleinfo");
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 开箱完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `开箱失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量开箱结束");
};

const batchFish = async (isScheduledTask = false) => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  const fishType = isScheduledTask ? batchSettings.defaultFishType : helperSettings.fishType;
  const totalCount = isScheduledTask ? batchSettings.fishCount : helperSettings.count;
  const batches = Math.floor(totalCount / 10);
  const remainder = totalCount % 10;
  const fishNames = { 1: "普通鱼竿", 2: "黄金鱼竿" };

  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始批量钓鱼: ${token.name} ===`,
        type: "info",
      });
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `鱼竿类型: ${fishNames[fishType]}, 数量: ${totalCount}`,
        type: "info",
      });

      await ensureConnection(tokenId);

      for (let i = 0; i < batches; i++) {
        if (shouldStop.value) break;
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "artifact_lottery",
          { type: fishType, lotteryNumber: 10, newFree: true },
          5000,
        );
        currentProgress.value = Math.floor(
          ((i + 1) / (batches + (remainder > 0 ? 1 : 0))) * 100,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `钓鱼进度: ${(i + 1) * 10}/${totalCount}`,
          type: "info",
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      if (remainder > 0 && !shouldStop.value) {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "artifact_lottery",
          { type: fishType, lotteryNumber: remainder, newFree: true },
          5000,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `钓鱼进度: ${totalCount}/${totalCount}`,
          type: "info",
        });
      }

      await tokenStore.sendMessage(tokenId, "role_getroleinfo");
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 钓鱼完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `钓鱼失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量钓鱼结束");
};

const batchRecruit = async (isScheduledTask = false) => {
  if (selectedTokens.value.length === 0) return;

  isRunning.value = true;
  shouldStop.value = false;
  // 不再重置logs数组，保留之前的日志
  // logs.value = [];

  const totalCount = isScheduledTask ? batchSettings.recruitCount : helperSettings.count;
  const batches = Math.floor(totalCount / 10);
  const remainder = totalCount % 10;

  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;

    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);

    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始批量招募: ${token.name} ===`,
        type: "info",
      });
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `招募数量: ${totalCount}`,
        type: "info",
      });

      await ensureConnection(tokenId);

      for (let i = 0; i < batches; i++) {
        if (shouldStop.value) break;
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "hero_recruit",
          { recruitType: 1, recruitNumber: 10 },
          5000,
        );
        currentProgress.value = Math.floor(
          ((i + 1) / (batches + (remainder > 0 ? 1 : 0))) * 100,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `招募进度: ${(i + 1) * 10}/${totalCount}`,
          type: "info",
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      if (remainder > 0 && !shouldStop.value) {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "hero_recruit",
          { recruitType: 1, recruitNumber: remainder },
          5000,
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `招募进度: ${totalCount}/${totalCount}`,
          type: "info",
        });
      }

      await tokenStore.sendMessage(tokenId, "role_getroleinfo");
      tokenStatus.value[tokenId] = "completed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 招募完成 ===`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `招募失败: ${error.message}`,
        type: "error",
      });
    }

    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量招募结束");
};

const batchClaimFreeEnergy = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;

  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });

  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;

    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始领取怪异塔免费道具: ${token.name} ===`,
        type: "info",
      });

      await ensureConnection(tokenId);

      // 获取免费道具数量
      const freeEnergyResult = await tokenStore.sendMessageWithPromise(
        tokenId,
        'mergebox_getinfo',
        {
          actType: 1
        },
        5000
      );

      if (freeEnergyResult && freeEnergyResult.mergeBox.freeEnergy > 0) {
        // 领取免费道具
        await tokenStore.sendMessageWithPromise(
          tokenId,
          'mergebox_claimfreeenergy',
          {
            actType: 1
          },
          5000
        );
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 成功领取免费道具${freeEnergyResult.mergeBox.freeEnergy}个`,
          type: "success"
        });
      } else {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `===  ${token.name} 暂无免费道具可领取`,
          type: "success"
        });
      }

      tokenStatus.value[tokenId] = "completed";
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 领取免费道具失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }

  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量领取怪异塔免费道具结束");
};

const batchLegacyClaim = async () => {
  if (selectedTokens.value.length === 0) return;
  isRunning.value = true;
  shouldStop.value = false;
  
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    
    const token = tokens.value.find((t) => t.id === tokenId);
    try {
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== 开始领取功法残卷: ${token.name} ===`,
        type: "info",
      });
      await ensureConnection(tokenId);

      const LegacyClaimHangUpResp = await tokenStore.sendMessageWithPromise(
        tokenId,
        "legacy_claimhangup",
        {},
        5000
      );
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 成功领取功法残卷${LegacyClaimHangUpResp.reward[0].value}，共有${LegacyClaimHangUpResp.role.items[37007].quantity}个`,
        type: "success"
      });
      tokenStatus.value[tokenId] = "completed";
    } catch (error) {
      console.error(error);
      tokenStatus.value[tokenId] = "failed";
      addLog({
        time: new Date().toLocaleTimeString(),
        message: `=== ${token.name} 领取功法残卷失败: ${error.message || "未知错误"}`,
        type: "error",
      });
    }
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  
  isRunning.value = false;
  currentRunningTokenId.value = null;
  message.success("批量领取功法残卷结束");
};

// 增强版批量赠送功法残卷（含完善的验证和错误处理）
const batchLegacyGiftSendEnhanced = async (isScheduledTask = false) => {
  if (selectedTokens.value.length === 0) {
    message.warning("请先选择要操作的角色");
    return;
  }
  
  // 根据是否是定时任务选择配置源
  const recipientId = isScheduledTask ? batchSettings.receiverId : recipientIdInput.value;
  const password = isScheduledTask ? batchSettings.password : securityPassword.value;
  
  const giftConfig = {
    recipientId: Number(recipientId), // 接收者ID
    itemId: 37007, // 功法残卷物品ID
    quantity: giftQuantity.value || 0, // 赠送数量
    serverName: recipientInfo.value?.serverName || '', // 接收者服务器名称
    name: recipientInfo.value?.name || '', // 接收者名称
  };
  
  if(!isScheduledTask){
    // 基本配置验证
    if (!giftConfig.recipientId || giftConfig.recipientId <= 0) {
      message.error("请输入有效的接收者ID");
      return;
    }
    
    if (giftConfig.quantity <= 0 || giftConfig.quantity > 1000) {
      message.error("赠送数量必须在1-1000之间");
      return;
    }
  }
  
  isRunning.value = true;
  shouldStop.value = false;
  
  // Reset status
  selectedTokens.value.forEach((id) => {
    tokenStatus.value[id] = "waiting";
  });
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const tokenId of selectedTokens.value) {
    if (shouldStop.value) break;
    currentRunningTokenId.value = tokenId;
    tokenStatus.value[tokenId] = "running";
    currentProgress.value = 0;
    
    const token = tokens.value.find((t) => t.id === tokenId);
    let consecutiveErrors = 0;
    const maxRetries = 2;
    
    while (consecutiveErrors <= maxRetries) {
      try {
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始赠送功法残卷: ${token.name} (尝试 ${consecutiveErrors + 1}/${maxRetries + 1}) ===`,
          type: "info",
        });
        
        // 1. 确保WebSocket连接正常
        await ensureConnection(tokenId);
        
        // 2. 获取角色信息，验证是否有足够的残卷
        const roleInfo = await tokenStore.sendGetRoleInfo(tokenId);
        const legacyFragmentCount = roleInfo?.role?.items?.[giftConfig.itemId]?.quantity || 0;
        if (isScheduledTask) {
          if (legacyFragmentCount === 0) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `=== ${token.name} 功法残卷不足，当前拥有: 0 ===`,
              type: "error",
            });
            tokenStatus.value[tokenId] = "failed";
            totalFailed++;
            break;
          }
          const rankroleinfo = await tokenStore.sendMessageWithPromise(
            tokenId,
            'rank_getroleinfo',
            {
              bottleType: 0,
              includeBottleTeam: false,
              isSearch: false,
              roleId: giftConfig.recipientId,
            },
            5000
          ); 
          giftConfig.serverName = rankroleinfo?.roleInfo?.serverName || '';
          giftConfig.name = rankroleinfo?.roleInfo?.name || '';
          if (!rankroleinfo?.roleInfo?.roleId) {
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `=== ${token.name} 赠送功法残卷失败: 接收者${giftConfig.recipientId}不存在`,
              type: 'error',
            });
            tokenStatus.value[tokenId] = 'failed';
            totalFailed++;
            break;
          }
          giftConfig.quantity = legacyFragmentCount;
        }
        
        if (legacyFragmentCount < giftConfig.quantity) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 功法残卷不足，当前拥有: ${legacyFragmentCount}，需要: ${giftConfig.quantity} ===`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
          totalFailed++;
          break;
        }
        
        // 3. 发送role_commitpassword命令，用于解除验证安全密码
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始解除安全密码验证 ===`,
          type: "info"
        });
        
        // 构建并发送role_commitpassword命令
        const commitPasswordResp = await tokenStore.sendMessageWithPromise(
          tokenId,
          "role_commitpassword",
          {
            password: password,
            passwordType: 1
          },
          5000
        );
        
        // 验证响应
        if (!commitPasswordResp) {
          throw new Error("安全密码验证请求无响应");
        }
        if (!commitPasswordResp.role?.statistics?.['que:wh:tm']) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: '=== 密码解除失败,请检查密码是否配置正确',
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
          totalFailed++;
          break;
        }
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 安全密码验证成功 ===`,
          type: "success"
        });
        
        // 4. 发送legacy_sendgift命令
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== 开始赠送功法残卷${giftConfig.quantity}个,目标:[${giftConfig.serverName}] ID:${giftConfig.recipientId} ${giftConfig.name} ===`,
          type: "info"
        });
        
        // 构建并发送legacy_sendgift命令
        const legacySendGiftResp = await tokenStore.sendMessageWithPromise(
          tokenId,
          "legacy_sendgift",
          {
            itemCnt: giftConfig.quantity,
            legacyUIds: [],
            targetId: giftConfig.recipientId
          },
          5000
        );
        
        // 验证响应
        if (!legacySendGiftResp) {
          throw new Error("赠送请求无响应");
        }
        
        // 5. 更新角色信息
        await tokenStore.sendMessage(tokenId, "role_getroleinfo");
        
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `=== ${token.name} 成功赠送功法残卷${giftConfig.quantity}个给[${giftConfig.serverName}] ID:${giftConfig.recipientId} ${giftConfig.name} ===`,
          type: "success"
        });
        
        tokenStatus.value[tokenId] = "completed";
        totalSuccess++;
        break;
      } catch (error) {
        consecutiveErrors++;
        console.error(`赠送失败: ${error.message}`);
        
        // 特殊错误处理
        let errorMsg = error.message || "未知错误";
        let errorType = "error";
        
        if (errorMsg.includes("200160")) {
          errorMsg = "模块未开启";
        } else if (errorMsg.includes("timeout")) {
          errorMsg = "请求超时";
          errorType = "warning";
        } else if (errorMsg.includes("网络")) {
          errorMsg = "网络错误";
          errorType = "warning";
        }
        
        if (consecutiveErrors <= maxRetries) {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 赠送功法残卷失败: ${errorMsg}，将在3秒后重试 ===`,
            type: "warning",
          });
          await new Promise((r) => setTimeout(r, 3000));
        } else {
          addLog({
            time: new Date().toLocaleTimeString(),
            message: `=== ${token.name} 赠送功法残卷失败: ${errorMsg}，已达最大重试次数 ===`,
            type: "error",
          });
          tokenStatus.value[tokenId] = "failed";
          totalFailed++;
          break;
        }
      }
    }
    
    currentProgress.value = 100;
    await new Promise((r) => setTimeout(r, 500));
  }
  
  isRunning.value = false;
  currentRunningTokenId.value = null;
  
  // 总结报告
  addLog({
    time: new Date().toLocaleTimeString(),
    message: `=== 批量赠送功法残卷完成: 成功 ${totalSuccess} 个，失败 ${totalFailed} 个 ===`,
    type: "success",
  });
  
  message.success(`批量赠送功法残卷结束，成功 ${totalSuccess} 个，失败 ${totalFailed} 个`);
};

const stopBatch = () => {
  shouldStop.value = true;
  addLog({
    time: new Date().toLocaleTimeString(),
    message: "正在停止...",
    type: "warning",
  });
};
</script>

<style scoped>
.batch-daily-tasks {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}

.main-layout {
  display: flex;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

.left-column {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
  padding-right: 8px;
}

.right-column {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 700px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.token-item {
  display: flex;
  align-items: center;
}

.log-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.custom-card-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: nowrap;
}

/* Cron Parser Styles */
.cron-parser {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--bg-tertiary);
  border-radius: 8px;
}

.cron-validation {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
}

.cron-validation.success {
  background-color: rgba(24, 160, 88, 0.12);
}

.cron-validation.error {
  background-color: rgba(235, 87, 87, 0.12);
}

.cron-next-runs h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.cron-next-runs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cron-next-runs li {
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.cron-next-runs li:last-child {
  border-bottom: none;
}

.log-card :deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  font-family: monospace;
  min-height: 200px;
}

.log-item {
  margin-bottom: 4px;
  font-size: 12px;
}

.log-item.error {
  color: #d03050;
}

.log-item.success {
  color: #18a058;
}

.log-item.warning {
  color: #f0a020;
}

.log-item.info {
  color: #333;
}

.time {
  color: #999;
  margin-right: 8px;
}

.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

/* Settings Modal Styles */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: #666;
}

.setting-switches {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.switch-row:last-child {
  border-bottom: none;
}

.switch-label {
  font-size: 14px;
  color: #666;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .right-column {
    width: 380px;
  }
}

@media (max-width: 992px) {
  .batch-daily-tasks {
    height: auto;
    overflow: visible;
  }

  .main-layout {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  .left-column {
    overflow-y: visible;
    padding-right: 0;
  }

  .right-column {
    width: 100%;
    height: auto;
    flex-shrink: 0;
  }

  .log-container {
    height: 300px;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .batch-daily-tasks {
    padding: 12px;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .main-layout {
    height: auto;
    overflow: visible;
    flex-direction: column;
  }

  .left-column {
    overflow: visible;
    padding-right: 0;
    flex: none;
    height: auto;
  }

  .right-column {
    height: auto;
    width: 100%;
    flex: none;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .page-header .actions {
    display: flex;
    gap: 8px;
  }

  .log-card {
    height: auto !important;
  }

  .log-card :deep(.n-card__content) {
    flex: none !important;
    overflow: visible !important;
    display: block !important;
  }

  .log-container {
    height: 300px;
    min-height: 300px;
    flex: none !important;
  }

  .log-header-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  /* 批量功法残卷赠送样式 */
  .recipient-info:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  
  /* 头像悬停效果 */
  .avatar-container:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
  }
  
  /* 加载动画 */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* 响应式设计 */
  @media (max-width: 600px) {
    .recipient-info {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .avatar-container {
      margin-bottom: 12px;
    }
  }
}
</style>
