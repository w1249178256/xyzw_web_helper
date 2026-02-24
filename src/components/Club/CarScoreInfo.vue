<template>
  <div>
    <!-- Inline 模式：卡片渲染 -->
    <div v-if="inline" class="inline-wrapper">
      <!-- <div class="inline-header">
        <div class="header-actions" style="margin-left: auto;">
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" :disabled="!memberScores || loading" @click="handleExport" :loading="isExporting">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </div> -->

      <div class="weird-tower-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载赛车数据...</template>
          </n-spin>
        </div>

        <!-- 赛车列表 - 表格展示 -->
        <div v-else-if="memberScores.length > 0" ref="exportDom" class="records-list">
           <n-data-table
            :columns="columns"
            :data="memberScores"
            :bordered="false"
            size="small"
            striped
            :row-key="(row) => row.roleId"
            :max-height="isExporting ? undefined : 600"
          />
        </div>
        <div v-else class="empty-state">
           <n-empty description="暂无数据" />
        </div>
      </div>
    </div>

    <!-- Modal 模式 -->
    <n-modal v-else v-model:show="showModal" preset="card" title="俱乐部赛车信息" style="width: 90%; max-width: 800px"
      @after-leave="handleClose">
      <template #header-extra>
        <div class="header-actions">
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button type="primary" size="small" :disabled="!memberScores || loading" @click="handleExport" :loading="isExporting">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </template>

      <div class="weird-tower-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载赛车数据...</template>
          </n-spin>
        </div>

        <!-- 赛车列表 - 表格展示 -->
        <div v-else-if="memberScores.length > 0" ref="exportDom" class="records-list">
           <n-data-table
            :columns="columns"
            :data="memberScores"
            :bordered="false"
            size="small"
            striped
            :row-key="(row) => row.roleId"
            :max-height="isExporting ? undefined : 600"
          />
        </div>
        <div v-else class="empty-state">
           <n-empty description="暂无数据" />
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, nextTick } from 'vue'
import { useMessage, NDataTable, NAvatar, NEmpty, NButton, NIcon } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from 'html2canvas';
import { downloadCanvasAsImage } from "@/utils/imageExport";
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText
} from '@vicons/ionicons5'
import { gettoday } from '@/utils/clubWarrankUtils'
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const exportDom = ref(null)
const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()
const isExporting = ref(false)

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading = ref(false)
const memberScores = ref([])

// 表格列定义
const columns = computed(() => {
  const baseColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, index) => index + 1
    },
    {
      title: '头像',
      key: 'headImg',
      width: 60,
      align: 'center',
      render: (row) => {
        if (row.headImg) {
          return h(NAvatar, {
            size: 32,
            src: row.headImg,
            round: true,
            fallbackSrc: '/icons/xiaoyugan.png'
          })
        }
        return h(
          "div",
          {
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "#999",
              margin: "0 auto"
            },
          },
          row.name?.charAt(0) || "?"
        )
      }
    },
    {
      title: '成员',
      key: 'name',
      align: 'left',
      render: (row) => {
        return h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              whiteSpace: "nowrap",
            },
          },
          [
            h(
              "span",
              { style: { fontWeight: "500", color: "#1890ff", lineHeight: "1.2" } },
              row.name,
            ),
            h(
              "span",
              { style: { fontSize: "12px", color: "#999", lineHeight: "1.2", marginTop: "2px" } },
              `ID: ${row.roleId}`,
            ),
          ],
        );
      },
    },
    {
      title: '赛车积分',
      key: 'score',
      align: 'center',
      render: (row) => row.score || '0'
    }
  ]

  // 如果是 Inline 模式，将标题作为表头分组
  if (props.inline) {
    return [
      {
        title: () => h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: "0 8px"
            },
          },
          [
              h("span", { style: { fontSize: "16px", fontWeight: "bold", color: "#333" } }, "俱乐部赛车信息"),
              !isExporting.value ? h(
                  'div',
                  { style: { display: 'flex', gap: '8px' } },
                  [
                      h(
                          NButton,
                          {
                              size: 'tiny',
                              type: 'primary',
                              secondary: true,
                              onClick: (e) => { e.stopPropagation(); handleRefresh(); },
                              disabled: loading.value
                          },
                          {
                              default: () => '刷新',
                              icon: () => h(NIcon, null, { default: () => h(Refresh) })
                          }
                      ),
                      h(
                          NButton,
                          {
                              size: 'tiny',
                              type: 'info',
                              secondary: true,
                              onClick: (e) => { e.stopPropagation(); handleExport(); },
                              disabled: isExporting.value
                          },
                          {
                              default: () => '导出图片',
                              icon: () => h(NIcon, null, { default: () => h(Copy) })
                          }
                      )
                  ]
              ) : null
          ]
        ),
        key: 'title_group',
        align: 'center',
        children: baseColumns
      }
    ]
  }

  return baseColumns
})

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 获取赛车数据
const fetchWeirdTowerInfo = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法查询爬塔数据')
    return
  }

  loading.value = true

  try {
    // 获取赛车数据
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      'car_getmemberrank',
      {},
      10000
    )

    // 获取所有俱乐部成员
    const clubMembers = tokenStore.gameData?.legionInfo?.info?.members || {};
    const allMembers = Object.values(clubMembers);

    let members = [];

    // 创建参与者映射
    const participantMap = new Map();
    if (result && result.list) {
      result.list.forEach(m => {
        participantMap.set(m.roleId, m);
      });
    }

    if (allMembers.length > 0) {
      // 合并数据：优先使用俱乐部成员列表，补充赛车数据
      members = allMembers.map(member => {
        const participant = participantMap.get(member.roleId);
        return {
          roleId: member.roleId,
          name: member.name,
          headImg: member.headImg,
          score: participant ? participant.score : 0,
          power: member.power,
          rank: participant ? participant.rank : 9999,
          serverId: member.serverId
        };
      });
    } else if (result && result.list) {
       // 如果没有俱乐部成员信息（异常情况），仅显示参与者
       members = result.list.map((member) => ({
        roleId: member.roleId,
        name: member.name,
        headImg: member.headImg?.replace(/`/g, '').trim(),
        score: member.score,
        power: member.power,
        rank: member.rank,
        serverId: member.serverId
      }))
    }

    // 按积分从高到低排序，积分相同按战力
    members.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return (b.power || 0) - (a.power || 0);
    });

    memberScores.value = members
    
    if (members.length > 0) {
      message.success('赛车数据加载成功，已按积分从高到低排序')
    } else {
      message.warning('未查询到数据')
    }
  } catch (error) {
      console.error('查询赛车数据失败:', error)
      message.error(`查询失败: ${error.message}`)
      memberScores.value = []
    } finally {
      loading.value = false
    }
}

// 刷新爬塔数据
const handleRefresh = () => {
  fetchWeirdTowerInfo()
}

// 导出数据
const handleExport = async () => {
  if (!memberScores.value) {
    message.warning('没有可导出的数据')
    return
  }

  try {
    isExporting.value = true
    await nextTick() // 等待 DOM 更新，取消高度限制
    // 稍微延迟一下，确保渲染完成
    await new Promise(resolve => setTimeout(resolve, 100))
    await exportToImage()
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

const exportToImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    throw new Error('未找到要导出的DOM元素');
  }

  // 5. 用html2canvas渲染DOM为Canvas
  const canvas = await html2canvas(exportDom.value, {
    scale: 2, // 放大2倍，解决图片模糊问题
    useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
    backgroundColor: '#ffffff', // 避免透明背景（默认透明）
    logging: false // 关闭控制台日志
  });

  // 6. Canvas转图片链接并下载
  const dateStr = gettoday();
  const filename = dateStr.replace("/",'年').replace("/",'月')+'日俱乐部赛车数据.png';
  downloadCanvasAsImage(canvas, filename);
};

// 关闭弹窗
const handleClose = () => {
  // 可以在这里清理资源
}

// 暴露方法给父组件
defineExpose({
  fetchWeirdTowerInfo
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    fetchWeirdTowerInfo()
  }
})
</script>

<style scoped lang="scss">
.inline-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
}

.inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.inline-title {
  font-weight: var(--font-weight-semibold);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.weird-tower-content {
  min-height: 200px;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.records-info {
  display: flex;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  align-items: center;
}

.member-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
  transition: all var(--transition-fast);

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  &+& {
    margin-top: var(--spacing-sm);
  }
}

.member-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 200px;
  max-width: 200px;
  flex-shrink: 0;
}

.ranking-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.member-stats-inline {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  flex: 1;
}

.stat-inline {
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tower-count {
  background: rgba(32, 192, 80, 0.1);
  color: var(--color-success);
}
</style>