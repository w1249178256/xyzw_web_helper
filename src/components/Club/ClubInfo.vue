<template>
  <MyCard class="club-info" :statusClass="{ active: !!club }">
    <template #icon>
      <img src="/icons/1733492491706152.png" alt="俱乐部图标" />
    </template>
    <template #title>
      <h3>俱乐部信息</h3>
      <p>军团/俱乐部概览与成员</p>
    </template>
    <template #badge>
      <span>{{ club ? "已加入" : "暂无俱乐部" }}</span>
    </template>
    <template #default>
      <div v-if="!club" class="empty-club">
        <n-empty description="暂无俱乐部" />
        <div class="actions">
          <n-button size="small" @click="refreshClub">刷新</n-button>
        </div>
      </div>
      <div v-else>
        <div class="toolbar">
          <n-space size="small">
            <!-- 申请列表按钮 -->
            <n-button size="small" @click="getApplyList">申请列表</n-button>
            <n-button size="small" @click="refreshClub">刷新</n-button>
          </n-space>
        </div>
        
        <!-- 申请列表悬浮界面 -->
        <n-modal
          v-model:show="showApplyList"
          title="俱乐部申请列表"
          :mask-closable="true"
          :show-close-button="true"
          :close-on-esc="true"
          preset="card"
          :show-footer="false"
          :style="{ width: '700px' }"
        >
          <template #header-extra>
            <n-space size="small">
              <n-button 
                size="small" 
                type="primary" 
                @click="approveAll" 
                :disabled="applyList.length === 0"
              >
                一键通过
              </n-button>
              <n-button 
                size="small" 
                type="error" 
                @click="rejectAll" 
                :disabled="applyList.length === 0"
              >
                一键拒绝
              </n-button>
            </n-space>
          </template>
          <div v-if="loadingApply" class="loading">
            <n-spin size="small" />
            <span style="margin-left: 8px;">正在加载申请列表...</span>
          </div>
          <div v-else-if="applyList.length === 0" class="empty-apply">
            <n-empty description="暂无申请" />
          </div>
          <div v-else class="apply-list-container">
            <div class="apply-list" :style="{ maxHeight: '800px', overflowY: 'auto' }">
              <div 
                v-for="apply in applyList" 
                :key="apply.roleId" 
                class="apply-item"
                :class="{ 'apply-item-hover': hoveredItemId === apply.roleId }"
                @mouseenter="hoveredItemId = apply.roleId"
                @mouseleave="hoveredItemId = null"
              >
                <div class="apply-left">
                  <n-avatar
                    :size="28"
                    :src="apply.headImg || '/icons/xiaoyugan.png'"
                  />
                  <div class="apply-info">
                    <div class="apply-name">{{ apply.name }}(ID:{{ apply.roleId }})</div>
                    <div class="apply-details">
                      <span>等级: {{ apply.level || 0 }}</span>
                      <span class="apply-power">{{ formatNumber(apply.power || 0) }}</span>
                      <span v-if="apply.serverId">服务区: {{ apply.serverId }}</span>
                    </div>
                    <div v-if="apply.applyReason" class="apply-reason">
                      申请留言: {{ apply.applyReason }}
                    </div>
                  </div>
                </div>
                <div class="apply-right">
                  <n-space size="small">
                    <n-button size="tiny" type="primary" @click="approveApply(apply.roleId)">
                      通过
                    </n-button>
                    <n-button size="tiny" @click="rejectApply(apply.roleId)">
                      拒绝
                    </n-button>
                  </n-space>
                </div>
              </div>
            </div>
          </div>
        </n-modal>

        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane name="overview" tab="概览" display-directive="show:lazy">
            <div class="overview">
              <div class="club-header">
                <n-avatar
                  :size="48"
                  :src="club.logo || '/icons/xiaoyugan.png'"
                />
                <div class="meta">
                  <div class="name">{{ club.name }}</div>
                  <div class="sub">
                    ID {{ club.id }} · Lv.{{ club.level }} · 服务器
                    {{ club.serverId - 27 }}
                  </div>
                </div>
              </div>
              <div class="overview-actions">
                <n-space size="small">
                  <n-button
                    size="small"
                    :disabled="legionSignedIn"
                    type="primary"
                    @click="signInLegion"
                  >
                    {{ legionSignedIn ? "已签到" : "俱乐部签到" }}
                  </n-button>
                </n-space>
              </div>
              <div class="grid">
                <div class="item">
                  <div class="label">战力</div>
                  <div class="value">
                    {{ formatNumber(clubOverview.power) }}
                  </div>
                </div>
                <div class="item">
                  <div class="label">成员数</div>
                  <div class="value">{{ memberCount }}</div>
                </div>
                <div class="item">
                  <div class="label">红粹</div>
                  <div class="value">{{ clubOverview.redQuench }}</div>
                </div>
                <div class="item">
                  <div class="label">Boss血量</div>
                  <div class="value">{{ clubOverview.currentHP }}</div>
                </div>
              </div>
              <div v-if="club.announcement" class="announcement">
                <div class="label">公告</div>
                <div class="text">{{ club.announcement }}</div>
              </div>
              <div class="leader" v-if="leader">
                <div class="label">会长</div>
                <div class="leader-info">
                  <n-avatar
                    :size="32"
                    :src="leader.headImg || '/icons/xiaoyugan.png'"
                  />
                  <span class="leader-name">{{ leader.name }}</span>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="members" tab="成员" display-directive="show:lazy">
            <div class="members">
              <div class="members-list">
                <div v-for="m in topMembers" :key="m.roleId" class="member-row">
                  <div class="left">
                    <n-avatar
                      :size="28"
                      :src="m.headImg || '/icons/xiaoyugan.png'"
                    />
                    <span class="name">{{ m.name }}(ID:{{ m.roleId }})</span>
                  </div>
                  <div class="right">
                    <span class="power">{{
                      formatNumber(m.power || m.custom?.s_power || 0)
                    }}</span>
                    <span class="red-quench">{{
                      redQuenchlabel(m.custom?.red_quench_cnt || 0)
                    }}</span>
                    <span class="tag">{{ jobLabel(m.job) }}</span>
                    <!-- 踢出按钮，只有会长或副会长可以看到 -->
                    <n-button
                      v-if="canKick && m.job !== 1"
                      size="tiny"
                      type="error"
                      @click="kickMember(m.roleId)"
                    >
                      踢出
                    </n-button>
                  </div>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="records"
            tab="盐场战绩"
            display-directive="show:lazy"
          >
            <ClubBattleRecords inline />
          </n-tab-pane>

          <n-tab-pane
            name="history"
            tab="俱乐部历史战绩"
            display-directive="show:lazy"
          >
            <ClubHistoryRecords inline />
          </n-tab-pane>

          <n-tab-pane
            name="weirdtower"
            tab="怪异塔信息"
            display-directive="show:lazy"
          >
            <ClubWeirdTowerInfo inline />
          </n-tab-pane>
          
          <n-tab-pane
            name="carsocre"
            tab="赛车积分信息"
            display-directive="show:lazy"
          >
            <CarScoreInfo inline />
          </n-tab-pane>
        </n-tabs>
      </div>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import ClubBattleRecords from "./ClubBattleRecords.vue";
import ClubHistoryRecords from "./ClubHistoryRecords.vue";
import ClubWeirdTowerInfo from './ClubWeirdTowerInfo.vue';
import CarScoreInfo from './CarScoreInfo.vue';
import { $emit } from '@/stores/events'

const tokenStore = useTokenStore();
const message = useMessage();

const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);

const membersObj = computed(() => club.value?.members || {});
const members = computed(() => Object.values(membersObj.value || {}));
const memberCount = computed(() => members.value.length);

const leader = computed(() => {
  const lid = club.value?.leaderId;
  if (!lid) return null;
  return members.value.find((m) => Number(m.roleId) === Number(lid)) || null;
});

const topMembers = computed(() => {
  return [...members.value]
    .sort(
      (a, b) =>
        Number(b.power || b.custom?.s_power || 0) -
        Number(a.power || a.custom?.s_power || 0),
    )
    .slice(0, 30);
});

// 获取当前角色在俱乐部中的职位
const currentMemberJob = computed(() => {
  const roleId = tokenStore.gameData?.roleInfo?.role?.roleId;
  if (!roleId) return 0;
  const currentMember = members.value.find(m => Number(m.roleId) === Number(roleId));
  return currentMember?.job || 0;
});

// 检查是否有踢人权限（会长或副会长）
const canKick = computed(() => {
  return [1, 2].includes(currentMemberJob.value);
});

// 踢出成员
const kickMember = (roleId) => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  
  // 正确的发送方式：第一个参数是命令名称，第二个参数是命令体
  tokenStore.sendMessage(token.id, "legion_kickout", {
    roleId: Number(roleId)
  });
  
  // 乐观更新：立即从本地成员列表中移除该成员
  if (tokenStore.gameData?.legionInfo?.info?.members) {
    // 删除成员信息
    delete tokenStore.gameData.legionInfo.info.members[roleId];
    // 刷新俱乐部信息以确保数据同步
    setTimeout(() => {
      refreshClub();
    }, 1000);
  }
  
  message.info(`正在踢出成员 ID: ${roleId}`);
};

// 获取申请列表
const getApplyList = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  
  // 显示申请列表界面
  showApplyList.value = true;
  // 设置加载状态
  loadingApply.value = true;
  applyList.value = [];
  
  // 发送legion_applylist命令
  tokenStore.sendMessage(token.id, "legion_applylist", {});
  message.info("正在获取申请列表");
};

// 通过申请
const approveApply = (roleId) => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  
  // 发送通过申请命令
  tokenStore.sendMessage(token.id, "legion_agree", {
    roleId: Number(roleId)
  });
  
  // 从申请列表中移除该成员
  applyList.value = applyList.value.filter(apply => apply.roleId !== roleId);
  message.info(`已通过成员 ID: ${roleId} 的申请`);
};

// 拒绝申请
const rejectApply = (roleId) => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  
  // 发送拒绝申请命令
  tokenStore.sendMessage(token.id, "legion_ignore", {
    roleId: Number(roleId)
  });
  
  // 从申请列表中移除该成员
  applyList.value = applyList.value.filter(apply => apply.roleId !== roleId);
  message.info(`已拒绝成员 ID: ${roleId} 的申请`);
};

// 一键通过所有申请
const approveAll = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  
  const count = applyList.value.length;
  if (count === 0) return;
  
  // 遍历所有申请项，发送通过命令
  applyList.value.forEach(apply => {
    tokenStore.sendMessage(token.id, "legion_agree", {
      roleId: Number(apply.roleId)
    });
  });
  
  // 清空申请列表
  applyList.value = [];
  message.success(`已通过所有 ${count} 个申请`);
};

// 一键拒绝所有申请
const rejectAll = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  
  const count = applyList.value.length;
  if (count === 0) return;
  
  // 遍历所有申请项，发送拒绝命令
  applyList.value.forEach(apply => {
    tokenStore.sendMessage(token.id, "legion_ignore", {
      roleId: Number(apply.roleId)
    });
  });
  
  // 清空申请列表
  applyList.value = [];
  message.success(`已拒绝所有 ${count} 个申请`);
};



const activeTab = ref("overview");

// 申请列表状态
const showApplyList = ref(false);
const loadingApply = ref(false);
const applyList = ref([]);

// 选择状态
const hoveredItemId = ref(null);

// 处理申请列表响应
const handleApplyListResp = (session) => {
  // 从session对象中提取响应内容
  const responseBody = session.body;
  
  if (responseBody) {
    if (typeof responseBody === 'object') {
      // 处理对象类型的响应
      
      // 检查是否有roleList数组字段（根据用户要求）
      if (Array.isArray(responseBody.roleList)) {
        // 从roleList数组中提取申请列表数据
        // 过滤掉无效的申请项（没有roleId的项）
        const validRoles = responseBody.roleList.filter(role => role.roleId && role.name);
        applyList.value = validRoles.map(role => ({
          headImg: role.headImg,
          level: role.level,
          name: role.name,
          power: role.power,
          roleId: role.roleId,
          serverId: role.ext?.['server_id'] || '',
          applyReason: role.ext?.['legion_apply_reason'] || ''
        }));
        // 停止加载状态
        loadingApply.value = false;
        message.success(`获取到 ${validRoles.length} 个申请`);
      } else if (Array.isArray(responseBody.applyList) || Array.isArray(responseBody.list) || Array.isArray(responseBody.data)) {
        // 兼容其他可能的数组字段
        const applyArray = responseBody.applyList || responseBody.list || responseBody.data;
        // 过滤掉无效的申请项，并提取服务区和申请留言信息
        applyList.value = applyArray.filter(apply => apply.roleId && apply.name).map(apply => ({
          ...apply,
          serverId: apply.ext?.['server_id'] || '',
          applyReason: apply.ext?.['legion_apply_reason'] || ''
        }));
        loadingApply.value = false;
        message.success(`获取到 ${applyList.value.length} 个申请`);
      } else if (Array.isArray(responseBody)) {
        // 直接是数组的情况
        // 过滤掉无效的申请项，并提取服务区和申请留言信息
        applyList.value = responseBody.filter(apply => apply.roleId && apply.name).map(apply => ({
          ...apply,
          serverId: apply.ext?.['server_id'] || '',
          applyReason: apply.ext?.['legion_apply_reason'] || ''
        }));
        loadingApply.value = false;
        message.success(`获取到 ${applyList.value.length} 个申请`);
      } else {
        // 没有有效的申请数据，设置为空数组
        applyList.value = [];
        loadingApply.value = false;
        message.info("暂无申请");
      }
    } else if (Array.isArray(responseBody)) {
      // 直接是数组的情况
      // 过滤掉无效的申请项，并提取服务区和申请留言信息
      applyList.value = responseBody.filter(apply => apply.roleId && apply.name).map(apply => ({
        ...apply,
        serverId: apply.ext?.['server_id'] || '',
        applyReason: apply.ext?.['legion_apply_reason'] || ''
      }));
      loadingApply.value = false;
      message.success(`获取到 ${applyList.value.length} 个申请`);
    } else {
      // 处理其他类型的响应
      applyList.value = [];
      loadingApply.value = false;
      message.info("暂无申请");
    }
  } else {
    // 没有申请数据或格式不正确
    applyList.value = [];
    loadingApply.value = false;
    message.info("暂无申请");
  }
};

// 组件挂载时添加事件监听器
onMounted(() => {
  // 监听申请列表响应事件（使用小写，与tokenStore保持一致）
  $emit.on("legion_applylistresp", handleApplyListResp);
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  // 移除申请列表响应事件监听（使用小写，与tokenStore保持一致）
  $emit.off("legion_applylistresp", handleApplyListResp);
});

// 今日是否已进行俱乐部签到
const legionSignedIn = computed(() => {
  const ts = Number(
    tokenStore.gameData?.roleInfo?.role?.statisticsTime?.["legion:sign:in"] ||
      0,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySec = Math.floor(today.getTime() / 1000);
  return ts > todaySec;
});

const signInLegion = () => {
  const token = tokenStore.selectedToken;
  if (!token || legionSignedIn.value) return;
  tokenStore.sendMessage(token.id, "legion_signin");
  tokenStore.sendMessage(token.id, "role_getroleinfo");
  message.info("俱乐部签到");
};

// 兼容不同服务端字段：从 info.info 和顶层 info 以及 statistics 中聚合
const clubOverview = computed(() => {
  const i = info.value || {};
  const base = i.info || {};
  const boss = base.currentBoss || {};
  const stats = i.statistics || i.stat || {};

  const power = Number(base.power ?? i.power ?? base.s_power ?? i.s_power ?? 0);
  const dan = base.dan ?? i.dan ?? base.rank ?? i.rank ?? "-";
  const redQuench = Number(
    base.redQuenchCnt ??
      i.redQuenchCnt ??
      stats["red:quench"] ??
      stats["red_quench"] ??
      0,
  );
  const lastWarRank =
    stats["last:war:rank"] ??
    stats["lastWarRank"] ??
    stats["legion:last:war:rank"] ??
    "-";
  const noApply = Boolean(base.noApply ?? i.noApply);

  const currentHP = formatNumber(boss.currentHP || 0);

  return { power, dan: dan ?? "-", redQuench, lastWarRank, noApply, currentHP };
});

const refreshClub = () => {
  const token = tokenStore.selectedToken;
  if (!token) return;
  tokenStore.sendMessage(token.id, "legion_getinfo");
};

const jobLabel = (job) => {
  if (job === 1) return "会长";
  if (job === 2) return "副会长";
  return "成员";
};

const redQuenchlabel = (redQuenchl) => {
  return redQuenchl + "红";
};

const formatNumber = (num) => {
  const n = Number(num || 0);
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "兆";
  if (n >= 1e8) return (n / 1e8).toFixed(2) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(2) + "万";
  return String(n);
};
</script>

<style scoped lang="scss">
.club-info {
  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-sm);
  }

  .overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .overview-actions {
    display: flex;
    justify-content: flex-start;
  }

  .club-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .meta {
    .name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }

    .sub {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }

  @media (max-width: 768px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
    }

    .member-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .member-row .right {
      width: 100%;
      justify-content: space-between;
      font-size: 12px;
    }
  }

  .item {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-medium);
    padding: var(--spacing-sm);

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-bottom: 2px;
    }

    .value {
      font-weight: var(--font-weight-medium);
    }
  }

  .announcement .label,
  .leader .label {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: 4px;
  }

  .announcement .text {
    white-space: pre-wrap;
  }

  .leader .leader-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .member-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 8px;
    border-radius: 8px;
    background: var(--bg-tertiary);
  }

  .member-row .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-row .right {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
  }

  .member-row .name {
    font-weight: var(--font-weight-medium);
  }

  .member-row .power {
    font-feature-settings: "tnum" 1;
    font-variant-numeric: tabular-nums;
  }

  .member-row .red-quench {
    font-feature-settings: "tnum" 1;
    font-variant-numeric: tabular-nums;
  }

  .hint {
    margin-top: 8px;
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);
  }

  .empty-club {
    text-align: center;
  }

  .empty-club .actions {
    margin-top: var(--spacing-sm);
  }
}

.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  margin-right: var(--spacing-md);
}

.status-info {
  flex: 1;

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);

  &.active {
    background: rgba(24, 160, 88, 0.12);
    color: var(--success-color);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* 申请列表样式 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.empty-apply {
  padding: 30px 0;
}

.apply-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apply-list {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.apply-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-item:last-child {
  border-bottom: none;
}

/* 悬停效果 */
.apply-item-hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 选中状态 */
.apply-item-selected {
  background: var(--primary-color-light);
  border-left: 3px solid var(--primary-color);
}

.apply-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.apply-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.apply-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.apply-details {
  display: flex;
  gap: 12px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.apply-power {
  font-feature-settings: "tnum" 1;
  font-variant-numeric: tabular-nums;
}

.apply-reason {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}

.apply-right {
  display: flex;
  gap: 8px;
}

/* 批量操作栏样式 */
.apply-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.selected-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: auto;
}

/* 滚动条样式 */
.apply-list::-webkit-scrollbar {
  width: 6px;
}

.apply-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.apply-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.apply-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}


</style>
