<template>
  <div class="admin-page">
    <!-- Simple header nav -->
    <div class="admin-nav">
      <div class="nav-left">
        <a-button type="text" @click="goBack">
          <template #icon><icon-arrow-left /></template>
          返回
        </a-button>
        <span class="nav-title">系统管理</span>
      </div>
      <div class="nav-right">
        <span class="current-user">{{ authStore.currentUser?.username }}</span>
        <a-button type="outline" size="small" @click="handleLogout">退出登录</a-button>
      </div>
    </div>

    <div class="admin-content" v-if="!accessDenied">
      <!-- Stats cards -->
      <div class="stats-row">
        <a-card class="stat-card" :loading="statsLoading">
          <a-statistic
            title="注册用户"
            :value="stats.userCount"
            :value-style="{ color: '#165DFF' }"
          >
            <template #suffix>人</template>
          </a-statistic>
        </a-card>
        <a-card class="stat-card" :loading="statsLoading">
          <a-statistic
            title="游戏Token总数"
            :value="stats.tokenCount"
            :value-style="{ color: '#00B42A' }"
          >
            <template #suffix>个</template>
          </a-statistic>
        </a-card>
        <a-card class="stat-card" :loading="statsLoading">
          <a-statistic
            title="近7天活跃用户"
            :value="stats.weeklyActiveUsers"
            :value-style="{ color: '#FF7D00' }"
          >
            <template #suffix>人</template>
          </a-statistic>
        </a-card>
        <a-card class="stat-card" :loading="statsLoading">
          <a-statistic
            title="可用邀请码"
            :value="stats.activeInvites"
            :value-style="{ color: '#722ED1' }"
          >
            <template #suffix>个</template>
          </a-statistic>
        </a-card>
      </div>

      <!-- Users table -->
      <a-card title="用户列表" class="section-card" :loading="usersLoading">
        <template #extra>
          <a-button type="text" @click="fetchUsers">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
        </template>

        <a-table
          :columns="userColumns"
          :data="users"
          :pagination="{ pageSize: 10 }"
          row-key="id"
          size="small"
        >
          <template #is_admin="{ record }">
            <a-tag v-if="record.is_admin" color="gold">管理员</a-tag>
            <a-tag v-else color="blue">普通用户</a-tag>
          </template>
          <template #last_login="{ record }">
            <span>{{ record.last_login ? formatDate(record.last_login) : '从未登录' }}</span>
          </template>
          <template #created_at="{ record }">
            <span>{{ formatDate(record.created_at) }}</span>
          </template>
          <template #actions="{ record }">
            <a-popconfirm
              v-if="!record.is_admin"
              content="确定要删除此用户吗？此操作不可撤销。"
              @ok="deleteUser(record.id)"
            >
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
            <span v-else class="protected-label">受保护</span>
          </template>
        </a-table>
      </a-card>

      <!-- Invite section -->
      <a-card title="邀请码管理" class="section-card">
        <div class="invite-actions">
          <a-space>
            <span>有效期：</span>
            <a-select v-model="inviteExpireDays" style="width: 120px">
              <a-option :value="1">1 天</a-option>
              <a-option :value="3">3 天</a-option>
              <a-option :value="7">7 天</a-option>
              <a-option :value="30">30 天</a-option>
              <a-option :value="90">90 天</a-option>
            </a-select>
            <a-button
              type="primary"
              :loading="inviteLoading"
              @click="generateInvite"
            >
              <template #icon><icon-plus /></template>
              生成邀请链接
            </a-button>
          </a-space>
        </div>

        <a-alert
          v-if="latestInvite"
          type="success"
          class="invite-result"
        >
          <template #content>
            <div class="invite-content">
              <strong>邀请码：{{ latestInvite.code }}</strong>
              <div class="invite-url">
                注册链接：<a-link :href="latestInvite.fullUrl" target="_blank">{{ latestInvite.fullUrl }}</a-link>
              </div>
              <div class="invite-expires">有效期至：{{ latestInvite.expires_at }}</div>
              <a-button
                type="text"
                size="small"
                @click="copyInviteLink(latestInvite.fullUrl)"
              >
                <template #icon><icon-copy /></template>
                复制链接
              </a-button>
            </div>
          </template>
        </a-alert>

        <!-- Recent invites list -->
        <div class="invites-section" v-if="invites.length > 0">
          <div class="section-subtitle">近期邀请码</div>
          <a-table
            :columns="inviteColumns"
            :data="invites"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #status="{ record }">
              <a-tag v-if="record.is_used" color="gray">已使用</a-tag>
              <a-tag v-else-if="record.is_expired" color="red">已过期</a-tag>
              <a-tag v-else color="green">可用</a-tag>
            </template>
            <template #expires_at="{ record }">
              <span>{{ formatDate(record.expires_at) }}</span>
            </template>
            <template #created_at="{ record }">
              <span>{{ formatDate(record.created_at) }}</span>
            </template>
          </a-table>
        </div>
      </a-card>
    </div>

    <!-- Access denied -->
    <div v-else class="access-denied">
      <a-result status="403" title="无权访问" sub-title="此页面仅限管理员访问">
        <template #extra>
          <a-button type="primary" @click="goBack">返回首页</a-button>
        </template>
      </a-result>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useUserAuthStore } from './store';
import { authApi } from './api';

const router = useRouter();
const authStore = useUserAuthStore();

const accessDenied = computed(() => !authStore.isAdmin);

const statsLoading = ref(false);
const usersLoading = ref(false);
const inviteLoading = ref(false);

const stats = reactive({
  userCount: 0,
  tokenCount: 0,
  weeklyActiveUsers: 0,
  activeInvites: 0
});

const users = ref([]);
const invites = ref([]);
const latestInvite = ref(null);
const inviteExpireDays = ref(7);

const userColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username' },
  { title: '角色', dataIndex: 'is_admin', slotName: 'is_admin', width: 90 },
  { title: 'Token数', dataIndex: 'token_count', width: 80 },
  { title: '注册时间', dataIndex: 'created_at', slotName: 'created_at', width: 160 },
  { title: '最后登录', dataIndex: 'last_login', slotName: 'last_login', width: 160 },
  { title: '操作', slotName: 'actions', width: 90, align: 'center' }
];

const inviteColumns = [
  { title: '邀请码', dataIndex: 'code', width: 170 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '创建者', dataIndex: 'created_by_username', width: 100 },
  { title: '使用者', dataIndex: 'used_by_username', width: 100 },
  { title: '过期时间', dataIndex: 'expires_at', slotName: 'expires_at', width: 160 },
  { title: '创建时间', dataIndex: 'created_at', slotName: 'created_at', width: 160 }
];

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

async function fetchStats() {
  statsLoading.value = true;
  try {
    const { data } = await authApi.admin.getStats();
    Object.assign(stats, data);
  } catch (err) {
    Message.error('获取统计数据失败');
  } finally {
    statsLoading.value = false;
  }
}

async function fetchUsers() {
  usersLoading.value = true;
  try {
    const { data } = await authApi.admin.getUsers();
    users.value = data.users;
  } catch (err) {
    Message.error('获取用户列表失败');
  } finally {
    usersLoading.value = false;
  }
}

async function fetchInvites() {
  try {
    const { data } = await authApi.admin.getInvites();
    invites.value = data.invites;
  } catch (err) {
    // Silently fail for invite list
  }
}

async function deleteUser(userId) {
  try {
    await authApi.admin.deleteUser(userId);
    Message.success('用户已删除');
    await fetchUsers();
    await fetchStats();
  } catch (err) {
    Message.error(err.response?.data?.error || '删除用户失败');
  }
}

async function generateInvite() {
  inviteLoading.value = true;
  try {
    const { data } = await authApi.admin.createInvite(inviteExpireDays.value);
    const baseUrl = window.location.origin;
    latestInvite.value = {
      ...data,
      fullUrl: `${baseUrl}${data.url}`
    };
    await fetchInvites();
    await fetchStats();
    Message.success('邀请码已生成');
  } catch (err) {
    Message.error(err.response?.data?.error || '生成邀请码失败');
  } finally {
    inviteLoading.value = false;
  }
}

async function copyInviteLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    Message.success('链接已复制到剪贴板');
  } catch {
    Message.error('复制失败，请手动复制');
  }
}

function goBack() {
  router.push('/admin/dashboard');
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}

onMounted(() => {
  if (!accessDenied.value) {
    fetchStats();
    fetchUsers();
    fetchInvites();
  }
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: var(--color-bg-2, #f2f3f5);
}

.admin-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--color-bg-1, #fff);
  border-bottom: 1px solid var(--color-border, #e5e6eb);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-user {
  font-size: 14px;
  color: var(--color-text-2);
}

.admin-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
}

.section-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.invite-actions {
  margin-bottom: 16px;
}

.invite-result {
  margin-bottom: 16px;
}

.invite-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.invite-url {
  font-size: 13px;
  word-break: break-all;
}

.invite-expires {
  font-size: 12px;
  color: var(--color-text-3);
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 12px;
  margin-top: 16px;
}

.protected-label {
  font-size: 12px;
  color: var(--color-text-4);
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
}
</style>
