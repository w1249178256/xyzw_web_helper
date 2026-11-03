<template>
  <div class="camp-challenge-container" ref="exportDom">
    <!-- 顶部操作工具栏 -->
    <div class="toolbar">
      <div class="left">
        <NTag :type="isMatchDay ? 'success' : 'info'" round size="small">
          {{ scheduleText }}
        </NTag>
        <span class="match-title">营地挑战（30人俱乐部对决）</span>
        <n-radio-group
          v-model:value="selectedSide"
          size="small"
          style="margin-left: 12px"
        >
          <n-radio-button value="own">我方阵营阵容</n-radio-button>
          <n-radio-button value="opponent">敌方阵营阵容</n-radio-button>
        </n-radio-group>
      </div>
      <div class="right">
        <NButton
          size="small"
          :disabled="currentMemberList.length === 0 || exporting"
          :loading="exporting"
          @click="handleExportImage"
          class="action-btn"
        >
          <template #icon>
            <n-icon><CopyOutline /></n-icon>
          </template>
          导出长图
        </NButton>

        <NButton
          size="small"
          :disabled="loading"
          :loading="loading"
          @click="fetchCampChallengeData"
          class="action-btn refresh-btn"
        >
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          刷新战况
        </NButton>
      </div>
    </div>

    <!-- 双方俱乐部 VS 对决卡片 (参考蟠桃园科技倾角风) -->
    <div class="header-section" v-if="battleInfo">
      <div class="club-vs-container">
        <!-- 我方俱乐部 (左) -->
        <div
          class="club-info own"
          :class="{ 'highlight-side': selectedSide === 'own' }"
        >
          <div class="club-details">
            <div class="club-stats club-id-text">
              ID: {{ battleInfo.ownClub.id || "未知" }}
            </div>
            <div class="club-name-row">
              <span class="club-server own-server">{{
                battleInfo.ownClub.serverId
                  ? `${battleInfo.ownClub.serverId}服`
                  : "本服"
              }}</span>
              <NAvatar
                round
                :size="36"
                :src="battleInfo.ownClub.logo || '/icons/xiaoyugan.png'"
                class="club-logo-inline"
              />
              <span class="club-name own-name">{{
                battleInfo.ownClub.name || "我方俱乐部"
              }}</span>
            </div>
            <div class="club-stats club-power-text">
              {{ ownMembers.length }} 人 | {{ battleInfo.ownClub.quenchNum }} 红
              | {{ formatPower(battleInfo.ownClub.power) }} 战力
            </div>
            <div class="club-stats announcement club-announce-text">
              {{ battleInfo.ownClub.announcement || "暂无公会公告" }}
            </div>
          </div>
        </div>

        <!-- VS 徽章与排位赛况 -->
        <div class="vs-badge-container">
          <div class="vs-badge">
            <span class="vs-v">V</span><span class="vs-s">S</span>
          </div>
          <div class="rank-badge-text">
            <NTag type="warning" size="small" round :bordered="false">
              {{ rankText }}
            </NTag>
          </div>
        </div>

        <!-- 敌方俱乐部 (右) -->
        <div
          class="club-info opponent"
          :class="{ 'highlight-side': selectedSide === 'opponent' }"
        >
          <div class="club-details">
            <div class="club-stats club-id-text">
              ID: {{ battleInfo.opponentClub.id || "未知" }}
            </div>
            <div class="club-name-row">
              <span class="club-server opp-server">{{
                battleInfo.opponentClub.serverId
                  ? `${battleInfo.opponentClub.serverId}服`
                  : "跨服"
              }}</span>
              <NAvatar
                round
                :size="36"
                :src="battleInfo.opponentClub.logo || '/icons/xiaoyugan.png'"
                class="club-logo-inline"
              />
              <span class="club-name opp-name">{{
                battleInfo.opponentClub.name || "敌方对阵公会"
              }}</span>
            </div>
            <div class="club-stats club-power-text">
              {{ opponentMembers.length }} 人 |
              {{ battleInfo.opponentClub.quenchNum }} 红 |
              {{ formatPower(battleInfo.opponentClub.power) }} 战力
            </div>
            <div class="club-stats announcement club-announce-text">
              {{ battleInfo.opponentClub.announcement || "暂无对手公告" }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 营地挑战周期与双维度统计面板（当周对战信息周更新与当天对战信息） -->
    <div class="camp-statistics-section" v-if="battleInfo && rawClubData">
      <div class="stats-panels-grid">
        <!-- 左侧卡片：当周对战信息 (周更新机制，参考盐场月更新) -->
        <div class="stats-panel weekly-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <n-icon class="panel-icon"><CalendarOutline /></n-icon>
              <span class="panel-title">当周对战信息</span>
              <NTag
                size="tiny"
                type="info"
                round
                :bordered="false"
                class="cycle-tag"
              >
                周更新制 · 第 {{ weeklyStats.phase }} 期
              </NTag>
            </div>
            <div class="panel-subtitle">
              周期: {{ weeklyStats.cycleRange }} (每周一刷新重置)
            </div>
          </div>

          <div class="stat-metrics-grid">
            <div class="metric-card">
              <div class="metric-label">公会本周总积分</div>
              <div class="metric-value highlight">
                {{ weeklyStats.weekScore }}<span class="metric-unit">分</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">公会排位段位</div>
              <div class="metric-value dan-value">
                {{ weeklyStats.danText }}
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">个人本周战功</div>
              <div class="metric-value personal-score">
                {{ weeklyStats.personalScore
                }}<span class="metric-unit">分</span>
                <NTag
                  size="tiny"
                  type="warning"
                  :bordered="false"
                  class="level-tag"
                  >Lv.{{ weeklyStats.personalLevel }}</NTag
                >
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">个人本周战绩</div>
              <div class="metric-value win-stat">
                {{ weeklyStats.weekAttackCnt }}战{{ weeklyStats.weekWinCnt }}胜
                <span class="sub-rate">({{ weeklyStats.weekWinRate }}%)</span>
              </div>
            </div>
          </div>

          <!-- 本周赛程全景（周二/周三/周四对决公会与战力） -->
          <div class="weekly-schedule-bar" v-if="matchDayList.length > 0">
            <div class="schedule-title">本周排位赛程速览：</div>
            <div class="schedule-chips">
              <div
                v-for="item in matchDayList"
                :key="item.day"
                class="schedule-chip"
                :class="{ active: selectedMatchDay === item.day }"
                @click="handleMatchDayChange(item.day)"
              >
                <div class="chip-day">{{ item.label }}</div>
                <div class="chip-opp-name" :title="item.name">
                  {{ item.name }}
                </div>
                <div class="chip-power">{{ formatPower(item.power) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧卡片：当天对战信息 (今日对决战况统计) -->
        <div class="stats-panel daily-panel">
          <div class="panel-header">
            <div class="panel-title-group">
              <n-icon class="panel-icon flame"><FlameOutline /></n-icon>
              <span class="panel-title">当天公会对战信息</span>
              <NTag
                size="tiny"
                :type="isMatchDay ? 'success' : 'default'"
                round
                :bordered="false"
              >
                {{ isMatchDay ? "今日交战中" : "非排位日" }}
              </NTag>
            </div>
            <div class="panel-subtitle">
              今日对决对手:
              <span class="opp-highlight">{{
                weeklyStats.todayOpponentName
              }}</span>
            </div>
          </div>

          <div class="stat-metrics-grid">
            <div class="metric-card">
              <div class="metric-label">我方总体出手胜率</div>
              <div class="metric-value win-stat">
                {{ todayCombatStats.ourClub.winRate }}%
                <span class="sub-rate"
                  >({{ todayCombatStats.ourClub.wins }}胜/{{
                    todayCombatStats.ourClub.totalAttacks
                  }}刀)</span
                >
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">对手总体出手胜率</div>
              <div class="metric-value opp-stat">
                {{ todayCombatStats.oppClub.winRate }}%
                <span class="sub-rate"
                  >({{ todayCombatStats.oppClub.wins }}胜/{{
                    todayCombatStats.oppClub.totalAttacks
                  }}刀)</span
                >
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">今日公会比分</div>
              <div class="metric-value highlight">
                {{ weeklyStats.dayScore }}
                <span class="sub-rate">vs {{ currentOppoDayScore }}</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">据点攻防态势</div>
              <div class="metric-value progress-value">
                攻破敌方{{ weeklyStats.defeatedCount }} / 敌方攻破我方{{
                  ownDefendDefeatedCount
                }}
                <span class="sub-rate">({{ weeklyStats.defeatedRate }}%)</span>
              </div>
            </div>
          </div>

          <!-- 敌方击破进度条 -->
          <div class="defense-progress-box">
            <div class="progress-info">
              <span>{{ weeklyStats.todayOpponentName }} 阵型击破进度</span>
              <span
                >已攻破敌方 {{ weeklyStats.defeatedCount }} /
                {{ weeklyStats.totalDefenders }} 据点 ({{
                  weeklyStats.defeatedRate
                }}%)</span
              >
            </div>
            <n-progress
              type="line"
              :percentage="Number(weeklyStats.defeatedRate) || 0"
              :show-indicator="false"
              :stroke-width="8"
              status="error"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 4 大多维战术视图切换 Tab -->
    <div class="view-tabs-container" v-if="battleInfo && !loading">
      <n-tabs
        v-model:value="activeViewTab"
        type="segment"
        animated
        class="camp-main-tabs"
      >
        <n-tab name="battleMap">
          <div class="tab-item-content">
            <n-icon><ShieldOutline /></n-icon>
            <span>⚔️ 今日据点沙盘 (击破图表)</span>
          </div>
        </n-tab>
        <n-tab name="todayDetails">
          <div class="tab-item-content">
            <n-icon><FlameOutline /></n-icon>
            <span>🎯 今日公会对战详细 (催刀督战)</span>
          </div>
        </n-tab>
        <n-tab name="weekRoster">
          <div class="tab-item-content">
            <n-icon><TrophyOutline /></n-icon>
            <span>📊 当周全员战绩 & 排位天梯</span>
          </div>
        </n-tab>
        <n-tab name="lineupTable">
          <div class="tab-item-content">
            <n-icon><StatsChartOutline /></n-icon>
            <span>🥋 详细武将布阵大表</span>
          </div>
        </n-tab>
      </n-tabs>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="large">
        <template #description
          >正在加载{{
            selectedSide === "opponent" ? "敌方" : "我方"
          }}真实营地布阵数据 ({{ progressText }})...</template
        >
      </n-spin>
    </div>

    <!-- 视图内容区域 -->
    <div v-else-if="currentMemberList.length > 0" class="views-content-wrapper">
      <!-- ================= 视图 1：今日战场据点沙盘 (击破图表) ================= -->
      <div v-if="activeViewTab === 'battleMap'" class="battle-map-section">
        <!-- 控制栏与筛选器 -->
        <div class="map-control-bar">
          <div class="map-side-indicator">
            <span class="indicator-title">
              {{
                selectedSide === "opponent"
                  ? "💥 敌方防守据点沙盘"
                  : "🛡️ 我方防守据点沙盘"
              }}
            </span>
            <span class="indicator-sub">
              ({{
                selectedSide === "opponent"
                  ? "点击对手可查看其被攻击防守战报"
                  : "点击我方成员可查看其主动进攻与防守战报"
              }})
            </span>
          </div>
          <div class="map-metrics-summary">
            <NTag round size="small" type="info" :bordered="false">
              {{ positionsConfirmed ? "已布阵" : "已获取" }}:
              {{ mapStats.total }}/{{ CAMP_SLOT_COUNT }}
            </NTag>
            <NTag round size="small" :bordered="false">
              空位: {{ mapStats.emptyCount ?? "待核实" }}
            </NTag>
            <NTag round size="small" type="success" :bordered="false">
              坚守: {{ mapStats.aliveCount }} 据点
            </NTag>
            <NTag round size="small" type="error" :bordered="false">
              已被击破: {{ mapStats.defeatedCount }} 据点 ({{
                mapStats.defeatedRate
              }}%)
            </NTag>
          </div>
          <div class="map-filters-group">
            <n-radio-group size="small" v-model:value="mapFilter">
              <n-radio-button value="all">
                全部位置 ({{ CAMP_SLOT_COUNT }})
              </n-radio-button>
              <n-radio-button value="alive">
                🛡️ 突出坚守 ({{ mapStats.aliveCount }})
              </n-radio-button>
              <n-radio-button value="defeated">
                💥 突出击破 ({{ mapStats.defeatedCount }})
              </n-radio-button>
            </n-radio-group>
          </div>
        </div>

        <p class="map-layout-note">
          按游戏位置排列，每个区域两排、每排五个据点。筛选时保留全部位置。
          <span class="map-scroll-hint">窄屏可左右滑动查看完整五列。</span>
        </p>
        <div
          aria-label="营地三区据点沙盘"
          class="camp-regions-scroll"
          tabindex="0"
        >
          <div class="camp-regions">
            <section
              v-for="region in mapRegions"
              :key="region.id"
              class="camp-region"
              :aria-label="`${region.name}，${region.start}至${region.end}号据点`"
              :class="`camp-region-${region.id}`"
            >
              <div class="region-header">
                <div class="region-title">
                  <span class="region-number">{{ region.label }}</span>
                  <span class="region-name">{{ region.name }}</span>
                  <span class="region-range"
                    >#{{ region.start }}–{{ region.end }}</span
                  >
                </div>
                <div
                  class="region-progress"
                  title="缺刀按成功攻击计算：困难 3 次、炼狱 4 次、击破 5 次；空位不计入统计。"
                >
                  <template v-if="positionsConfirmed">
                    <span
                      class="region-defeated-count"
                      :class="{
                        'is-complete':
                          region.deployedCount > 0 &&
                          region.defeatedCount === region.deployedCount,
                      }"
                    >
                      已攻破
                      <strong
                        >{{ region.defeatedCount }} /
                        {{ region.deployedCount }}</strong
                      >
                    </span>
                    <template
                      v-if="region.defeatedCount < region.deployedCount"
                    >
                      <template v-if="region.remainingAttacks">
                        <span class="region-attacks-needed is-hard">
                          全部困难缺
                          <strong>{{ region.remainingAttacks.hard }}</strong> 刀
                        </span>
                        <span class="region-attacks-needed is-inferno">
                          全部炼狱缺
                          <strong>{{ region.remainingAttacks.inferno }}</strong>
                          刀
                        </span>
                        <span class="region-attacks-needed is-defeat">
                          全部击破缺
                          <strong>{{ region.remainingAttacks.defeat }}</strong>
                          刀
                        </span>
                      </template>
                      <span v-else class="region-progress-pending"
                        >缺刀数待核实</span
                      >
                    </template>
                  </template>
                  <span v-else class="region-progress-pending"
                    >区域统计待核实</span
                  >
                </div>
                <div class="region-summary">
                  {{ positionsConfirmed ? "已布阵" : "已定位" }}
                  <strong>{{ region.deployedCount }}/10</strong>
                  <span
                    >· 空位
                    {{
                      positionsConfirmed ? region.emptyCount : "待核实"
                    }}</span
                  >
                </div>
              </div>
              <div class="fortress-grid">
                <template
                  v-for="{ slot, member: item } in region.slots"
                  :key="`${selectedSide}_${slot}`"
                >
                  <div
                    v-if="item"
                    class="fortress-card"
                    role="button"
                    tabindex="0"
                    :aria-label="`查看 #${slot} 据点 ${item.name} 的战报`"
                    :class="{
                      'is-defeated': item.defeated,
                      'is-alive': !item.defeated,
                      'is-mirror': item.mirror,
                      'is-muted': isMapMemberMuted(item),
                    }"
                    :data-slot="slot"
                    @click="openDuelModal(item)"
                    @keydown.enter.prevent="openDuelModal(item)"
                    @keydown.space.prevent="openDuelModal(item)"
                  >
                    <div class="card-header-bar">
                      <span class="slot-badge">#{{ slot }} 据点</span>
                      <div class="stamp-wrapper">
                        <span v-if="item.defeated" class="stamp stamp-defeated"
                          >💥 已攻破</span
                        >
                        <span v-else class="stamp stamp-alive">🛡️ 坚守中</span>
                      </div>
                    </div>

                    <div class="card-body">
                      <div class="avatar-box">
                        <NAvatar
                          round
                          class="fortress-avatar"
                          :size="40"
                          :src="item.headImg || '/icons/xiaoyugan.png'"
                        ></NAvatar>
                        <NTag
                          round
                          class="red-quench-tag"
                          size="tiny"
                          :bordered="false"
                          :class="{ 'is-pending': item.redQuench == null }"
                          :title="
                            item.redQuenchReason ||
                            (item.lineupSource === 'role'
                              ? '普通阵容红淬，供参考'
                              : '营地布阵红淬')
                          "
                        >
                          {{
                            item.redQuench == null
                              ? "待核实"
                              : `${item.redQuench}红`
                          }}
                        </NTag>
                      </div>
                      <div class="member-detail">
                        <div class="member-name" :title="item.name">
                          {{ item.name }}
                        </div>
                        <div class="member-power">
                          {{ formatPower(item.power) }}
                        </div>
                        <div class="member-lineup">
                          <NTag
                            v-if="item.mirror"
                            size="tiny"
                            type="warning"
                            :bordered="false"
                            >镜像</NTag
                          >
                          <NTag
                            class="lineup-tag"
                            size="tiny"
                            :bordered="false"
                            :title="
                              item.lineupSource === 'unavailable'
                                ? '布阵详情未获取'
                                : item.lineupType
                            "
                            :type="
                              item.lineupSource === 'unavailable'
                                ? 'warning'
                                : 'info'
                            "
                          >
                            {{
                              item.lineupSource === "unavailable"
                                ? "布阵详情未获取"
                                : item.lineupType
                            }}
                          </NTag>
                        </div>
                      </div>
                    </div>

                    <div
                      class="card-footer-bar"
                      :class="getDefenseFooterClass(item)"
                    >
                      <div class="combat-stat-text">
                        遭遇
                        <span class="num">{{ item.challengeCnt ?? "—" }}</span>
                        次 | 防守成功
                        <span class="num error">{{ item.failCnt ?? "—" }}</span>
                        次
                      </div>
                      <div class="card-action-hint"><span>战报流水</span></div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="fortress-card is-empty"
                    :class="{ 'is-unknown': !positionsConfirmed }"
                    :data-slot="slot"
                  >
                    <div class="card-header-bar">
                      <span class="slot-badge">#{{ slot }} 据点</span>
                    </div>
                    <div class="empty-slot-content">
                      <span aria-hidden="true" class="empty-slot-symbol">{{
                        positionsConfirmed ? "—" : "?"
                      }}</span>
                      <span>{{
                        positionsConfirmed ? "未布阵" : "位置待核实"
                      }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </section>
          </div>
        </div>
      </div>

      <!-- ================= 视图 2：今日公会对战详细 (催刀督战) ================= -->
      <div
        v-else-if="activeViewTab === 'todayDetails'"
        class="today-details-section"
      >
        <!-- 双方公会今日比分与总体出手胜率对决横幅 -->
        <div class="today-versus-score-banner">
          <div class="banner-sides-row">
            <!-- 我方公会 -->
            <div class="side-score-box own-score-box">
              <div class="club-title">
                <NAvatar
                  round
                  :size="28"
                  :src="battleInfo.ownClub.logo || '/icons/xiaoyugan.png'"
                />
                <span>{{ battleInfo.ownClub.name }} (我方)</span>
              </div>
              <div class="score-display">
                <span class="score-num own-text">{{
                  weeklyStats.dayScore
                }}</span>
                <span class="score-label">今日积分</span>
              </div>
              <div class="combat-rate-display">
                <span class="rate-num"
                  >{{ todayCombatStats.ourClub.winRate }}% /
                  {{ todayCombatStats.ourClub.defWinRate }}%</span
                >
                <span class="rate-label">出手 / 防守胜率</span>
                <span class="rate-detail"
                  >(出{{ todayCombatStats.ourClub.wins }}胜{{
                    todayCombatStats.ourClub.losses
                  }}负·共{{ todayCombatStats.ourClub.totalAttacks }}刀 / 守{{
                    todayCombatStats.ourClub.defWins
                  }}胜{{ todayCombatStats.ourClub.defLosses }}负·共{{
                    todayCombatStats.ourClub.defTotal
                  }}次)</span
                >
              </div>
              <div class="sub-stat">
                攻破敌方: {{ weeklyStats.defeatedCount }} /
                {{ weeklyStats.totalDefenders }} 据点 ({{
                  weeklyStats.defeatedRate
                }}%)
              </div>
            </div>

            <!-- VS 分割线 -->
            <div class="vs-divider">
              <div class="vs-text-styled">VS</div>
              <div
                class="score-gap-badge"
                :class="{
                  lead:
                    Number(weeklyStats.dayScore) >= Number(currentOppoDayScore),
                  lag:
                    Number(weeklyStats.dayScore) < Number(currentOppoDayScore),
                }"
              >
                {{
                  Number(weeklyStats.dayScore) >= Number(currentOppoDayScore)
                    ? `领先 ${
                        Number(weeklyStats.dayScore) -
                        Number(currentOppoDayScore)
                      } 分`
                    : `落后 ${
                        Number(currentOppoDayScore) -
                        Number(weeklyStats.dayScore)
                      } 分`
                }}
              </div>
            </div>

            <!-- 对手公会 -->
            <div class="side-score-box oppo-score-box">
              <div class="club-title">
                <NAvatar
                  round
                  :size="28"
                  :src="battleInfo.opponentClub.logo || '/icons/xiaoyugan.png'"
                />
                <span>{{ battleInfo.opponentClub.name }} (对手)</span>
              </div>
              <div class="score-display">
                <span class="score-num oppo-text">{{
                  currentOppoDayScore
                }}</span>
                <span class="score-label">今日积分</span>
              </div>
              <div class="combat-rate-display oppo-rate">
                <span class="rate-num"
                  >{{ todayCombatStats.oppClub.winRate }}% /
                  {{ todayCombatStats.oppClub.defWinRate }}%</span
                >
                <span class="rate-label">出手 / 防守胜率</span>
                <span class="rate-detail"
                  >(出{{ todayCombatStats.oppClub.wins }}胜{{
                    todayCombatStats.oppClub.losses
                  }}负·共{{ todayCombatStats.oppClub.totalAttacks }}刀 / 守{{
                    todayCombatStats.oppClub.defWins
                  }}胜{{ todayCombatStats.oppClub.defLosses }}负·共{{
                    todayCombatStats.oppClub.defTotal
                  }}次)</span
                >
              </div>
              <div class="sub-stat">
                敌方攻破我方: {{ ownDefendDefeatedCount }} /
                {{ ownMembers.length }} 据点
              </div>
            </div>
          </div>

          <!-- 双方出手胜率对比对决条 -->
          <div class="combat-comparison-bar-container">
            <div class="comparison-bar-header">
              <span class="bar-left-text"
                >我方出手胜率 {{ todayCombatStats.ourClub.winRate }}% ({{
                  todayCombatStats.ourClub.totalAttacks
                }}刀)</span
              >
              <span class="bar-center-title">⚔️ 双方出刀总体胜率对比</span>
              <span class="bar-right-text"
                >对手出手胜率 {{ todayCombatStats.oppClub.winRate }}% ({{
                  todayCombatStats.oppClub.totalAttacks
                }}刀)</span
              >
            </div>
            <div class="comparison-progress-track">
              <div
                class="comparison-fill-left"
                :style="{
                  width: `${Number(todayCombatStats.ourClub.winRate) || 0}%`,
                }"
              ></div>
              <div
                class="comparison-fill-right"
                :style="{
                  width: `${Number(todayCombatStats.oppClub.winRate) || 0}%`,
                }"
              ></div>
            </div>
            <!-- 防守维度对比：复用现有对比条样式，不新增 CSS 类 -->
            <div class="comparison-bar-header">
              <span class="bar-left-text"
                >我方防守胜率 {{ todayCombatStats.ourClub.defWinRate }}% ({{
                  todayCombatStats.ourClub.defTotal
                }}次)</span
              >
              <span class="bar-center-title">🛡️ 双方防守总体胜率对比</span>
              <span class="bar-right-text"
                >对手防守胜率 {{ todayCombatStats.oppClub.defWinRate }}% ({{
                  todayCombatStats.oppClub.defTotal
                }}次)</span
              >
            </div>
            <div class="comparison-progress-track">
              <div
                class="comparison-fill-left"
                :style="{
                  width: `${Number(todayCombatStats.ourClub.defWinRate) || 0}%`,
                }"
              ></div>
              <div
                class="comparison-fill-right"
                :style="{
                  width: `${Number(todayCombatStats.oppClub.defWinRate) || 0}%`,
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 督战催刀大卡片 (真实 0/3次未动刀 与 1~2/3次未打满 精确统计) -->
        <div class="attendance-control-panel">
          <div class="attendance-header">
            <div class="att-title-group">
              <n-icon class="att-icon"><FlameOutline /></n-icon>
              <span class="att-title"
                >公会{{ attendanceDate.label }}出刀督促台</span
              >
              <NTag
                size="small"
                :type="
                  attendanceStats.unattackedCount === 0 &&
                  attendanceStats.incompleteCount === 0
                    ? 'success'
                    : 'warning'
                "
                round
                :bordered="false"
              >
                满刀率: {{ attendanceStats.completedRate }}% ({{
                  attendanceStats.completedCount
                }}/{{ attendanceStats.total }})
              </NTag>
            </div>
            <div class="att-actions">
              <NButton
                type="error"
                size="small"
                round
                @click="copyUnattackedList"
                :disabled="attendanceStats.unattackedCount === 0"
                style="margin-right: 8px"
              >
                <template #icon>
                  <n-icon><CopyOutline /></n-icon>
                </template>
                复制未动刀名单 (0/3次 · {{ attendanceStats.unattackedCount }}人)
              </NButton>
              <NButton
                type="warning"
                size="small"
                round
                @click="copyIncompleteList"
                :disabled="attendanceStats.incompleteCount === 0"
              >
                <template #icon>
                  <n-icon><CopyOutline /></n-icon>
                </template>
                复制未打满名单 (1~2/3次 ·
                {{ attendanceStats.incompleteCount }}人)
              </NButton>
            </div>
          </div>

          <div class="attendance-body">
            <!-- 0 刀未动成员 (0/3) -->
            <div
              class="unattacked-preview-box"
              v-if="attendanceStats.unattackedCount > 0"
              style="margin-bottom: 10px"
            >
              <span class="box-label error-label"
                >🛑 0 刀未动成员（{{
                  attendanceStats.unattackedCount
                }}人，急需催刀）：</span
              >
              <div class="attendance-table-scroll">
                <table
                  class="attendance-members-table is-unattacked"
                  aria-label="0 刀未动成员"
                >
                  <colgroup>
                    <col span="6" />
                  </colgroup>
                  <tbody>
                    <tr
                      v-for="(row, rowIndex) in unattackedRows"
                      :key="rowIndex"
                    >
                      <td v-for="m in row" :key="m.id">
                        <button
                          class="attendance-member-button"
                          type="button"
                          @click="openDuelModal(m, 'own')"
                        >
                          <span
                            class="attendance-member-name"
                            :title="m.name"
                            >{{ m.name }}</span
                          >
                          <span class="attendance-member-power"
                            >营地布阵：{{
                              formatAttendancePower(m.power)
                            }}</span
                          >
                          <span class="attendance-member-status">0/3次</span>
                          <span class="attendance-member-club-power"
                            >PVP布阵：{{
                              formatAttendancePower(m.clubPower)
                            }}</span
                          >
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 未打满成员 (1~2/3) -->
            <div
              class="unattacked-preview-box"
              v-if="attendanceStats.incompleteCount > 0"
              style="margin-bottom: 10px"
            >
              <span class="box-label warning-label"
                >⚠️ 未打满成员（{{
                  attendanceStats.incompleteCount
                }}人，仍有剩余免费挑战机会）：</span
              >
              <div class="attendance-table-scroll">
                <table
                  class="attendance-members-table is-incomplete"
                  aria-label="未打满成员"
                >
                  <colgroup>
                    <col span="6" />
                  </colgroup>
                  <tbody>
                    <tr
                      v-for="(row, rowIndex) in incompleteRows"
                      :key="rowIndex"
                    >
                      <td v-for="m in row" :key="m.id">
                        <button
                          class="attendance-member-button"
                          type="button"
                          @click="openDuelModal(m, 'own')"
                        >
                          <span
                            class="attendance-member-name"
                            :title="m.name"
                            >{{ m.name }}</span
                          >
                          <span class="attendance-member-power"
                            >营地布阵：{{
                              formatAttendancePower(m.power)
                            }}</span
                          >
                          <span class="attendance-member-status"
                            >出战{{ m.realAttackCnt }}/3次 · 剩{{
                              3 - m.realAttackCnt
                            }}次</span
                          >
                          <span class="attendance-member-club-power"
                            >PVP布阵：{{
                              formatAttendancePower(m.clubPower)
                            }}</span
                          >
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 全员打满提示 -->
            <div
              class="all-attacked-box"
              v-if="
                attendanceStats.total > 0 &&
                attendanceStats.unattackedCount === 0 &&
                attendanceStats.incompleteCount === 0
              "
            >
              <NTag size="medium" type="success" :bordered="false">
                🎉 太强了！我方
                {{ attendanceStats.total }}
                名成员在所选比赛日的免费挑战次数已全部打满！
              </NTag>
            </div>
          </div>
        </div>

        <!-- 30人今日出战详细大宽表 -->
        <div class="table-card">
          <div class="table-header-title">
            <div class="header-left">
              <span>我方俱乐部 30 人今日战绩详表</span>
              <span class="sub-hint"
                >点击角色名称或操作按钮可查看被挑战战报</span
              >
            </div>
            <div class="header-right-sort">
              <span class="sort-label">排序维度：</span>
              <n-radio-group v-model:value="todaySortBy" size="small">
                <n-radio-button value="score">🏆 贡献排名</n-radio-button>
                <n-radio-button value="attackWinRate"
                  >🎯 出手胜率排名</n-radio-button
                >
                <n-radio-button value="defWinRate"
                  >🛡️ 防守胜率排名</n-radio-button
                >
              </n-radio-group>
            </div>
          </div>
          <n-data-table
            :columns="todayTableColumns"
            :data="sortedTodayMembers"
            :row-key="
              (row: any) =>
                `slot_${row.slot || ''}_${row.id}_${row.mirror ? 'mirror' : 'real'}`
            "
            :bordered="false"
            size="small"
            striped
            :scroll-x="900"
            class="camp-data-table"
          />
        </div>
      </div>

      <!-- ================= 视图 3：当周全员战绩 & 排位天梯 ================= -->
      <div
        v-else-if="activeViewTab === 'weekRoster'"
        class="week-roster-section"
      >
        <!-- 4 公会排位天梯榜 -->
        <div class="group-rank-section" v-if="groupRankData.length > 0">
          <div class="section-title">
            <n-icon><TrophyOutline /></n-icon>
            <span>本组 4 俱乐部排位天梯榜 (周总积分天梯)</span>
          </div>
          <div class="group-rank-grid">
            <div
              v-for="(club, idx) in groupRankData"
              :key="club.id || idx"
              class="group-rank-card"
              :class="{
                'is-own-club': club.id === battleInfo.ownClub.id,
                'rank-1': idx === 0,
                'rank-2': idx === 1,
                'rank-3': idx === 2,
              }"
            >
              <div class="rank-badge-num">
                {{
                  idx === 0
                    ? "🥇 冠军位"
                    : idx === 1
                      ? "🥈 亚军位"
                      : idx === 2
                        ? "🥉 季军位"
                        : "第 4 名"
                }}
              </div>
              <div class="club-main-info">
                <div class="club-title-row">
                  <span class="club-name">{{ club.name }}</span>
                  <NTag
                    v-if="club.id === battleInfo.ownClub.id"
                    size="tiny"
                    type="success"
                    round
                    >我方</NTag
                  >
                </div>
                <div class="server-tag">
                  {{
                    club.serverName ||
                    (club.serverId ? `${club.serverId}服` : "跨服")
                  }}
                </div>
              </div>
              <div class="club-rank-score">
                <span class="score-val">{{ club.score }}</span>
                <span class="score-unit">本周积分</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 30人当周战功排行榜与防守胜率考核大宽表 -->
        <div class="table-card">
          <div class="table-header-title">
            <div class="header-left">
              <span>我方 30 人当周总战功与防守胜率考核大宽表</span>
              <span class="sub-hint"
                >统计本周累计战功、受击交战次数、防守守住次数与防守胜率</span
              >
            </div>
            <div class="header-right-sort">
              <span class="sort-label">排序维度：</span>
              <n-radio-group v-model:value="weeklySortBy" size="small">
                <n-radio-button value="score">🏆 贡献排名</n-radio-button>
                <n-radio-button value="defWinRate"
                  >🛡️ 防守胜率排名</n-radio-button
                >
              </n-radio-group>
            </div>
          </div>
          <n-data-table
            :columns="weeklyRosterColumns"
            :data="sortedWeeklyRoster"
            :row-key="
              (row: any) =>
                `slot_${row.slot || ''}_${row.id}_${row.mirror ? 'mirror' : 'real'}`
            "
            :bordered="false"
            size="small"
            striped
            :scroll-x="1000"
            class="camp-data-table"
          />
        </div>
      </div>

      <!-- ================= 视图 4：详细武将布阵大表 ================= -->
      <div
        v-else-if="activeViewTab === 'lineupTable'"
        class="members-table-section"
      >
        <!-- 阵容流派统计条 (参考蟠桃园) -->
        <div class="lineup-summary-bar" v-if="lineupStats.length">
          <span class="lineup-stats-label">
            {{ selectedSide === "opponent" ? "敌方" : "我方" }}阵容流派分布：
          </span>
          <NTag
            v-for="item in lineupStats"
            :key="item.name"
            :color="item.colorProps"
            size="small"
            :bordered="false"
            class="lineup-stats-tag"
          >
            {{ item.name }} ({{ item.count }}人)
          </NTag>
        </div>

        <!-- 30人真实布阵大宽表 -->
        <n-data-table
          :columns="columns"
          :data="currentMemberList"
          :row-key="
            (row: any) =>
              `slot_${row.slot || ''}_${row.id}_${row.mirror ? 'mirror' : 'real'}`
          "
          :bordered="false"
          size="small"
          striped
          :scroll-x="1500"
          class="camp-data-table"
        />
      </div>
    </div>

    <!-- 空数据展示 -->
    <div v-else class="empty-state">
      <n-empty :description="emptyHint" size="large">
        <template #extra>
          <NButton size="small" type="primary" @click="fetchCampChallengeData">
            点击重新查询
          </NButton>
        </template>
      </n-empty>
    </div>

    <!-- 成员攻防战况流水面板 -->
    <n-modal
      v-model:show="showDuelModal"
      preset="card"
      :title="`成员攻防战况流水 - ${targetPlayer?.name || ''}${targetPlayer?.mirror ? '（镜像据点）' : ''}`"
      :style="{ width: '740px' }"
      :bordered="false"
      :segmented="{ content: 'soft', footer: 'soft' }"
    >
      <template #header-extra>
        <span v-if="targetPlayer" class="player-id">
          <NTag
            v-if="targetPlayer.mirror"
            size="small"
            type="warning"
            round
            :bordered="false"
            style="margin-right: 8px"
          >
            镜像据点
          </NTag>
          ID: {{ targetPlayer.id }}
        </span>
      </template>

      <div v-if="targetPlayer" class="duel-content">
        <!-- 头部个人概览卡片 -->
        <div class="duel-player-header">
          <NAvatar
            round
            :size="56"
            :src="targetPlayer.headImg || '/icons/xiaoyugan.png'"
          />
          <div class="duel-player-info">
            <h3>
              {{ targetPlayer.name }}
              <NTag
                v-if="targetPlayer.mirror"
                size="small"
                type="warning"
                round
                :bordered="false"
                style="margin-left: 8px"
              >
                镜像
              </NTag>
            </h3>
            <p>
              真实战力: {{ formatPower(targetPlayer.power) }} | 总红淬:
              {{ targetPlayer.redQuench }}
            </p>
            <p>
              玩具: {{ targetPlayer.toyName || "无" }} | 流派:
              {{ targetPlayer.lineupType || "常规" }}
            </p>
          </div>
        </div>

        <div v-if="modalLoading" style="padding: 28px 0; text-align: center">
          <n-spin size="small">
            <template #description>正在拉取对战战报流水...</template>
          </n-spin>
        </div>

        <n-tabs
          v-else
          type="segment"
          animated
          size="small"
          class="player-modal-tabs"
        >
          <!-- 选项卡一：进攻流水（我方主动进攻敌方成员，attackType === 1） -->
          <n-tab-pane name="offense" tab="进攻流水">
            <div class="battle-records-tab">
              <!-- 进攻统计面板 -->
              <div class="personal-summary-grid">
                <div class="summary-box">
                  <span class="s-label">进攻次数</span>
                  <span class="s-val"
                    >{{ targetPlayerOffenseList.length }} 次</span
                  >
                </div>
                <div class="summary-box">
                  <span class="s-label">攻击成功</span>
                  <span class="s-val win-text"
                    >{{ targetPlayerOffenseWinCount }} 场</span
                  >
                </div>
                <div class="summary-box">
                  <span class="s-label">攻击失败</span>
                  <span class="s-val loss-text"
                    >{{ targetPlayerOffenseLossCount }} 场</span
                  >
                </div>
                <div class="summary-box">
                  <span class="s-label">进攻胜率</span>
                  <span class="s-val highlight-text"
                    >{{ targetPlayerOffenseWinRate }}%</span
                  >
                </div>
              </div>

              <!-- 进攻流水列表 -->
              <div
                class="combat-list-container"
                v-if="targetPlayerOffenseList.length > 0"
              >
                <div
                  v-for="(combat, cIdx) in targetPlayerOffenseList"
                  :key="`offense-${cIdx}`"
                  class="combat-item"
                  :class="combat.winFlag ? 'combat-win' : 'combat-loss'"
                >
                  <div class="combat-left">
                    <NTag size="tiny" round type="info" class="combat-type-tag"
                      >主动进攻</NTag
                    >
                    <span class="combat-time">{{
                      formatCombatTime(combat.timestamp)
                    }}</span>
                  </div>
                  <div class="combat-center">
                    <span class="vs-text">{{
                      targetPlayerSide === "opponent"
                        ? "我方进攻成员:"
                        : "进攻目标对手:"
                    }}</span>
                    <NAvatar
                      round
                      :size="24"
                      :src="
                        combat.targetRoleInfo?.headImg || '/icons/xiaoyugan.png'
                      "
                      class="enemy-avatar"
                    />
                    <span class="enemy-name">{{
                      combat.targetRoleInfo?.name || "未知玩家"
                    }}</span>
                    <NTag
                      size="tiny"
                      :bordered="false"
                      type="info"
                      style="margin-left: 4px"
                      v-if="combat.targetRoleInfo?.legionName"
                    >
                      {{ combat.targetRoleInfo.legionName }}
                    </NTag>
                    <span
                      class="enemy-power"
                      v-if="combat.targetRoleInfo?.power"
                    >
                      ({{ formatPower(combat.targetRoleInfo?.power) }})
                    </span>
                  </div>
                  <div class="combat-right">
                    <NTag
                      size="small"
                      :type="combat.winFlag ? 'success' : 'error'"
                      strong
                      round
                    >
                      {{ combat.winFlag ? "攻击成功" : "攻击失败" }}
                    </NTag>
                  </div>
                </div>
              </div>

              <div v-else class="empty-combat-state">
                <n-empty description="当前日期暂无进攻流水记录" size="small" />
              </div>
            </div>
          </n-tab-pane>

          <!-- 选项卡二：防守流水（敌方主动进攻我方成员，attackType === 0） -->
          <n-tab-pane name="defense" tab="防守流水">
            <div class="battle-records-tab">
              <!-- 防守统计面板 -->
              <div class="personal-summary-grid">
                <div class="summary-box">
                  <span class="s-label">遭遇进攻</span>
                  <span class="s-val"
                    >{{ targetPlayerDefenseList.length }} 次</span
                  >
                </div>
                <div class="summary-box">
                  <span class="s-label">防守成功</span>
                  <span class="s-val win-text"
                    >{{ targetPlayerDefenseWinCount }} 场</span
                  >
                </div>
                <div class="summary-box">
                  <span class="s-label">防守失败</span>
                  <span class="s-val loss-text"
                    >{{ targetPlayerDefenseLossCount }} 场</span
                  >
                </div>
                <div class="summary-box">
                  <span class="s-label">防守胜率</span>
                  <span class="s-val highlight-text"
                    >{{ targetPlayerDefenseWinRate }}%</span
                  >
                </div>
              </div>

              <!-- 防守流水列表 -->
              <div
                class="combat-list-container"
                v-if="targetPlayerDefenseList.length > 0"
              >
                <div
                  v-for="(combat, cIdx) in targetPlayerDefenseList"
                  :key="`defense-${cIdx}`"
                  class="combat-item"
                  :class="combat.winFlag ? 'combat-win' : 'combat-loss'"
                >
                  <div class="combat-left">
                    <NTag
                      size="tiny"
                      round
                      type="warning"
                      class="combat-type-tag"
                      >遭遇防守</NTag
                    >
                    <span class="combat-time">{{
                      formatCombatTime(combat.timestamp)
                    }}</span>
                  </div>
                  <div class="combat-center">
                    <span class="vs-text">{{
                      targetPlayerSide === "opponent"
                        ? "交战对手:"
                        : "敌方来袭对手:"
                    }}</span>
                    <NAvatar
                      round
                      :size="24"
                      :src="
                        combat.targetRoleInfo?.headImg || '/icons/xiaoyugan.png'
                      "
                      class="enemy-avatar"
                    />
                    <span class="enemy-name">{{
                      combat.targetRoleInfo?.name || "未知玩家"
                    }}</span>
                    <NTag
                      size="tiny"
                      :bordered="false"
                      type="warning"
                      style="margin-left: 4px"
                      v-if="combat.targetRoleInfo?.legionName"
                    >
                      {{ combat.targetRoleInfo.legionName }}
                    </NTag>
                    <span
                      class="enemy-power"
                      v-if="combat.targetRoleInfo?.power"
                    >
                      ({{ formatPower(combat.targetRoleInfo?.power) }})
                    </span>
                  </div>
                  <div class="combat-right">
                    <NTag
                      size="small"
                      :type="combat.winFlag ? 'success' : 'error'"
                      strong
                      round
                    >
                      {{ combat.winFlag ? "防守成功" : "防守失败" }}
                    </NTag>
                  </div>
                </div>
              </div>

              <div v-else class="empty-combat-state">
                <n-empty description="当前日期暂无防守流水记录" size="small" />
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 营地挑战（30人俱乐部排位对决）核心交互与可视化组件
 * 通过 role_gettargetteam 获取成员在营地挑战中真实生效的 1~5 号站位布阵阵容。
 */

import {
  CalendarOutline,
  CopyOutline,
  FlameOutline,
  RefreshOutline,
  ShieldOutline,
  StatsChartOutline,
  TrophyOutline,
} from "@vicons/ionicons5";
import html2canvas from "html2canvas";
import { NAvatar, NButton, NTag, useMessage } from "naive-ui";
import { computed, h, onMounted, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import {
  buildCampMap,
  CAMP_SLOT_COUNT,
  getAttendanceDate,
  getAttendanceMembers,
} from "@/utils/campChallengeView";
import {
  formatWeapon,
  getLineupType,
  HERO_DICT,
  legacycolor,
  LINEUP_RULES,
} from "@/utils/HeroList";

/**
 * 格式化战力数值为可读的字符串（如 1.23亿、45.6万）
 *
 * @param {number | string | undefined | null} val 战力原始数值
 * @returns {string} 格式化后的战力字符串
 */
const formatPower = (val: number | string | undefined | null) => {
  if (!val) return "0";
  const num = typeof val === "string" ? Number.parseFloat(val) : val;
  if (Number.isNaN(+num)) return "0";
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString();
};

const tokenStore = useTokenStore();
const message = useMessage();
const exportDom = ref<HTMLElement | null>(null);

// 界面状态与视图切换
const selectedSide = ref<"own" | "opponent">("own");
const activeViewTab = ref<
  "battleMap" | "todayDetails" | "weekRoster" | "lineupTable"
>("battleMap");
const mapFilter = ref<"all" | "alive" | "defeated">("all");
// 今日与当周战绩详表多维排序维度 ('score' 贡献积分 | 'attackWinRate' 出手胜率 | 'defWinRate' 防守胜率)
const todaySortBy = ref<"score" | "attackWinRate" | "defWinRate">("score");
const weeklySortBy = ref<"score" | "attackWinRate" | "defWinRate">("score");

const groupRankData = ref<any[]>([]);
const loading = ref(false);
const exporting = ref(false);
const progressText = ref("0/0");

// 比赛日与对手公会映射
const matchDayList = ref<
  {
    day: number;
    label: string;
    name: string;
    legionId: number;
    power: number;
    viewId?: number;
    dayScore?: number;
    defenders: Record<string, any>;
    logo?: string;
  }[]
>([]);
const selectedMatchDay = ref<number>(2);
const rawClubData = ref<any>(null);
const rawSiegeData = ref<any>(null);
const cachedAttackRecords = ref<any[]>([]);
// Preserve the existing legion response for the attendance table's PVP power.
const ownClubMembers = ref<Record<string, any>>({});

// 防竞态标识（比赛日数据一律实时拉取接口，不做本地缓存）
let currentFetchToken = 0;

// 对战数据与公会概览
const battleInfo = ref<any>(null);
const ownMembers = ref<any[]>([]);
const opponentMembers = ref<any[]>([]);
const rankText = ref("营地挑战排位赛");
const emptyHint = ref("暂无营地挑战对阵数据");

// 对战详情模态框与状态
const showDuelModal = ref(false);
const targetPlayer = ref<any>(null);
const targetPlayerSide = ref<"own" | "opponent">("own");
const modalLoading = ref(false);
const playerAttackRecords = ref<any[]>([]);
const playerDefenseRecords = ref<any[]>([]);

// 双方公会今日总体出手战报与胜率统计
const todayCombatStats = ref({
  loaded: false,
  ourClub: {
    name: "我方俱乐部",
    totalAttacks: 0,
    wins: 0,
    losses: 0,
    winRate: "0.0",
    defTotal: 0,
    defWins: 0,
    defLosses: 0,
    defWinRate: "0.0",
  },
  oppClub: {
    name: "匹配俱乐部",
    totalAttacks: 0,
    wins: 0,
    losses: 0,
    winRate: "0.0",
    defTotal: 0,
    defWins: 0,
    defLosses: 0,
    defWinRate: "0.0",
  },
});

// 全员出刀进攻战报映射 (roleId -> 统计及主动出刀流水列表)
const memberAttackStatsMap = ref<
  Map<
    number,
    {
      roleId: number;
      name: string;
      attackCnt: number;
      winCnt: number;
      lossCnt: number;
      attacks: any[];
    }
  >
>(new Map());

// 全员防守战报映射 (roleId -> 遭遇敌方攻击流水列表)
const memberDefenseRecordsMap = ref<Map<number, any[]>>(new Map());

// 当周防守统计映射 (roleId -> 防守统计对象)
const weeklyDefenseStatsMap = ref<Map<number, any>>(new Map());

/**
 * 进攻流水（我方主动进攻敌方成员，attackType === 1）
 */
const targetPlayerOffenseList = computed(() => playerAttackRecords.value);

/**
 * 进攻流水胜场数
 */
const targetPlayerOffenseWinCount = computed(
  () =>
    targetPlayerOffenseList.value.filter(
      (c) => c.winFlag === true || c.winFlag === 1,
    ).length,
);

/**
 * 进攻流水败场数
 */
const targetPlayerOffenseLossCount = computed(
  () =>
    targetPlayerOffenseList.value.filter(
      (c) => c.winFlag === false || c.winFlag === 0,
    ).length,
);

/**
 * 进攻流水胜率
 */
const targetPlayerOffenseWinRate = computed(() => {
  const total = targetPlayerOffenseList.value.length;
  if (!total) return "0.0";
  return ((targetPlayerOffenseWinCount.value / total) * 100).toFixed(1);
});

/**
 * 防守流水（敌方主动进攻我方成员，attackType === 0）
 */
const targetPlayerDefenseList = computed(() => playerDefenseRecords.value);

/**
 * 防守流水胜场数（防守成功）
 */
const targetPlayerDefenseWinCount = computed(
  () =>
    targetPlayerDefenseList.value.filter(
      (c) => c.winFlag === true || c.winFlag === 1,
    ).length,
);

/**
 * 防守流水败场数（防守失败）
 */
const targetPlayerDefenseLossCount = computed(
  () =>
    targetPlayerDefenseList.value.filter(
      (c) => c.winFlag === false || c.winFlag === 0,
    ).length,
);

/**
 * 防守流水胜率
 */
const targetPlayerDefenseWinRate = computed(() => {
  const total = targetPlayerDefenseList.value.length;
  if (!total) return "0.0";
  return ((targetPlayerDefenseWinCount.value / total) * 100).toFixed(1);
});

/**
 * 格式化战斗记录时间
 *
 * @param {number} timestamp 秒级或毫秒级时间戳
 * @returns {string} 格式化时间字符串 MM-DD HH:mm:ss
 */
const formatCombatTime = (timestamp: number | undefined | null) => {
  if (!timestamp) return "—";
  const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 当前成员列表（根据单选框切换敌方/我方）
const currentMemberList = computed(() => {
  return selectedSide.value === "opponent"
    ? opponentMembers.value
    : ownMembers.value;
});

// 日程判断：当前星期几是否在营地挑战日程列表中
const isMatchDay = computed(() => {
  const day = new Date().getDay();
  return matchDayList.value.some((d) => d.day === day);
});

const scheduleText = computed(() => {
  const day = new Date().getDay();
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const currentDayName = dayNames[day];
  if (isMatchDay.value) {
    return `今日${currentDayName}（排位比赛日）`;
  }
  const matchDaysDesc = matchDayList.value.map((d) => d.label).join("、");
  return `今日${currentDayName}（非排位日${
    matchDaysDesc ? `，开放日：${matchDaysDesc}` : ""
  }）`;
});

// 阵容流派统计聚合
const lineupStats = computed(() => {
  const counts: Record<string, number> = {};
  for (const m of currentMemberList.value) {
    const type = m.lineupType || "其他阵容";
    counts[type] = (counts[type] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, count]) => {
      const rule = LINEUP_RULES.find((r) => r.name === name);
      return {
        name,
        count,
        colorProps: rule?.colorProps || { color: "#e8e8e8", textColor: "#444" },
      };
    })
    .sort((a, b) => b.count - a.count);
});

/**
 * 营地挑战周更新与双维度（当周+当天）对战统计数据
 */
const weeklyStats = computed(() => {
  const club = rawClubData.value || {};
  const siege = rawSiegeData.value || {};
  const phaseStr = String(club.phase || "");

  // 解析周更新周期 (如 "260907" -> 2026/09/07 ~ 2026/09/13)
  let cycleRange = "周更新周期";
  const phaseDates: string[] = [];
  if (phaseStr.length === 6) {
    const y = 2000 + Number.parseInt(phaseStr.slice(0, 2), 10);
    const m = Number.parseInt(phaseStr.slice(2, 4), 10) - 1;
    const d = Number.parseInt(phaseStr.slice(4, 6), 10);
    const monDate = new Date(y, m, d);
    const sunDate = new Date(y, m, d + 6);
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(
        2,
        "0",
      )}/${String(dt.getDate()).padStart(2, "0")}`;
    cycleRange = `${fmt(monDate)} ~ ${fmt(sunDate)}`;

    // 动态提取本周已排定的对战日期（按 oppoMap 实际包含的各比赛日偏移推算）
    for (const item of matchDayList.value) {
      const offset = item.day >= 1 ? item.day - 1 : item.day + 6;
      const matchDt = new Date(y, m, d + offset);
      const k = `${String(matchDt.getFullYear()).slice(-2)}${String(
        matchDt.getMonth() + 1,
      ).padStart(2, "0")}${String(matchDt.getDate()).padStart(2, "0")}`;
      phaseDates.push(k);
    }
  }

  const dan = club.dan || 0;
  const lastDan = club.lastDan || 0;
  const danDiff = dan - lastDan;
  const danDiffText =
    danDiff > 0 ? ` ↑+${danDiff}` : danDiff < 0 ? ` ↓${danDiff}` : " (持平)";
  const danText = `${dan}段 (上周${lastDan}段${danDiffText})`;

  const weekScore = club.weekScore || 0;
  const dayScore = club.dayScore || 0;

  // 个人本周战功：取 club.members 中自己 roleId 对应条目的 score（周累计值，Σmembers.score === club.weekScore 已实测证实）；
  // siege.score 是另一套口径（实测 siege.score=89 而成员条目 score=28），不能作为本周战功
  let personalScore = siege.score || 0;
  for (const m of Object.values(club.members || {}) as any[]) {
    if (Number(m.roleId) === Number(siege.roleId)) {
      personalScore = m.score || 0;
      break;
    }
  }

  // 个人本周统计 (从 siege.attackMap 中统计)
  const attackMap = siege.attackMap || {};
  let weekAttackCnt = 0;
  let weekWinCnt = 0;
  const targetKeys =
    phaseDates.length > 0 ? phaseDates : Object.keys(attackMap);
  for (const k of targetKeys) {
    if (attackMap[k]) {
      weekAttackCnt += attackMap[k].attackCnt || 0;
      weekWinCnt += attackMap[k].aSuccessCnt || 0;
    }
  }
  const weekWinRate =
    weekAttackCnt > 0 ? ((weekWinCnt / weekAttackCnt) * 100).toFixed(1) : "0.0";

  // 个人今日统计
  const now = new Date();
  const todayKey = `${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const todayData = attackMap[todayKey] || {};
  const todayAttackCnt = todayData.attackCnt || 0;
  const todayWinCnt = todayData.aSuccessCnt || 0;
  const todayWinRate =
    todayAttackCnt > 0
      ? ((todayWinCnt / todayAttackCnt) * 100).toFixed(1)
      : "0.0";

  // 当前选中对手公会信息与防守击破进度
  const currentOppo =
    matchDayList.value.find((d) => d.day === selectedMatchDay.value) ||
    matchDayList.value[0] ||
    {};
  const oppDefenders = Object.values(currentOppo.defenders || {}) as any[];
  const totalDefenders =
    oppDefenders.length || opponentMembers.value.length || 30;
  const defeatedCount = oppDefenders.filter((d) => d.defeated).length;
  const defeatedRate =
    totalDefenders > 0
      ? ((defeatedCount / totalDefenders) * 100).toFixed(1)
      : "0.0";

  return {
    phase: phaseStr,
    cycleRange,
    dan,
    lastDan,
    danText,
    weekScore,
    dayScore,
    personalScore,
    personalLevel: siege.level || 1,
    weekAttackCnt,
    weekWinCnt,
    weekWinRate,
    todayAttackCnt,
    todayWinCnt,
    todayWinRate,
    todayOpponentName: currentOppo.name || "匹配对战俱乐部",
    totalDefenders,
    defeatedCount,
    defeatedRate,
  };
});

// Fixed map slots preserve all three regions while filters highlight matching members.
const campMap = computed(() =>
  buildCampMap(
    currentMemberList.value,
    selectedSide.value === "own"
      ? rawClubData.value?.members
      : matchDayList.value.find((day) => day.day === selectedMatchDay.value)
          ?.defenders,
  ),
);
const mapRegions = computed(() => campMap.value.regions);
const positionsConfirmed = computed(() => campMap.value.positionsConfirmed);
const isMapMemberMuted = (member: any) =>
  mapFilter.value === "alive"
    ? member.defeated
    : mapFilter.value === "defeated" && !member.defeated;
const getDefenseFooterClass = (member: any) => {
  if (selectedSide.value !== "opponent" || member.defeated) return "";
  const losses = Math.max(
    0,
    Number(member.challengeCnt || 0) - Number(member.failCnt || 0),
  );
  return losses >= 4 ? "is-critical" : losses === 3 ? "is-weakened" : "";
};
const mapStats = computed(() => {
  const total = currentMemberList.value.length;
  const defeatedCount = currentMemberList.value.filter(
    (member) => member.defeated,
  ).length;
  return {
    total,
    defeatedCount,
    aliveCount: Math.max(0, total - defeatedCount),
    defeatedRate:
      total > 0 ? ((defeatedCount / total) * 100).toFixed(1) : "0.0",
    emptyCount: positionsConfirmed.value ? CAMP_SLOT_COUNT - total : null,
  };
});

// 我方防守状态统计
const ownDefendDefeatedCount = computed(
  () => ownMembers.value.filter((m) => m.defeated).length,
);

// 敌方防守状态统计

// 敌方今日得分
const currentOppoDayScore = computed(() => {
  const oppo = matchDayList.value.find((d) => d.day === selectedMatchDay.value);
  return oppo?.dayScore || 0;
});

// 督战催刀统计（按真实出刀 0/3次未动刀 与 1~2/3次未打满 精确统计）
const attendanceStats = computed(() => {
  const members = getAttendanceMembers(
    ownMembers.value,
    rawClubData.value?.members,
    ownClubMembers.value,
  );
  const total = members.length;

  // 1. 完全未动刀 (真实出刀 0 次，不论得分如何，必须催刀)
  const unattacked = members.filter((m: any) => (m.realAttackCnt || 0) === 0);
  // 2. 未打满 (真实出刀 1~2 次，仍有剩余免费挑战机会，不论打输打赢)
  const incomplete = members.filter(
    (m: any) => (m.realAttackCnt || 0) > 0 && (m.realAttackCnt || 0) < 3,
  );
  // 3. 已打满 / 战意高昂 (出战 >= 3 次，打满免费机会或买刀，即使打输也是打满)
  const completed = members.filter((m: any) => (m.realAttackCnt || 0) >= 3);

  const completedCount = completed.length;
  const completedRate =
    total > 0 ? ((completedCount / total) * 100).toFixed(1) : "0.0";

  return {
    total,
    unattackedCount: unattacked.length,
    incompleteCount: incomplete.length,
    completedCount,
    completedRate,
    unattacked,
    incomplete,
    completed,
  };
});

const getAttendanceRows = (members: any[]) =>
  Array.from({ length: Math.ceil(members.length / 6) }, (_, row) =>
    members.slice(row * 6, (row + 1) * 6),
  );
const unattackedRows = computed(() =>
  getAttendanceRows(attendanceStats.value.unattacked),
);
const incompleteRows = computed(() =>
  getAttendanceRows(attendanceStats.value.incomplete),
);
const attendanceDate = computed(() =>
  getAttendanceDate(rawClubData.value?.phase, selectedMatchDay.value),
);
const formatAttendancePower = (power: number | null | undefined) =>
  power == null ? "—" : formatPower(power);

// The copied roster uses the same members and values as the six-column tables.
const copyToClipboard = async (text: string, successMsg: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      try {
        input.select();
        if (!document.execCommand("copy")) throw new Error("浏览器未允许复制");
      } finally {
        input.remove();
      }
    }
    message.success(successMsg);
  } catch {
    message.error("复制失败，请检查浏览器剪贴板权限");
  }
};
const copyAttendanceList = async (kind: "unattacked" | "incomplete") => {
  const members = attendanceStats.value[kind];
  const description =
    kind === "unattacked" ? "0 刀未动成员" : "未打满 3 刀成员";
  if (!members.length) {
    message.info("当前没有可复制的名单");
    return;
  }
  const details = members.map((member: any) => {
    const count = member.realAttackCnt || 0;
    const status =
      kind === "unattacked" ? "0/3次" : `出战${count}/3次 · 剩${3 - count}次`;
    return `${member.name}（营地布阵：${formatAttendancePower(member.power)}  PVP布阵：${formatAttendancePower(member.clubPower)}）  ${status}`;
  });
  const text = [
    `【营地挑战${attendanceDate.value.label} · ${description}】`,
    `我方${description}（共${members.length}人）：`,
    ...details,
    attendanceDate.value.isToday
      ? "请以上成员及时上线补满免费挑战次数，助力俱乐部积分。"
      : "请结合对应比赛日的游戏记录核对后使用。",
  ].join("\n");
  await copyToClipboard(text, `名单已复制到剪贴板（共${members.length}人）`);
};
const copyUnattackedList = () => copyAttendanceList("unattacked");
const copyIncompleteList = () => copyAttendanceList("incomplete");

// 我方 30 人当周战功排行榜与防守胜率考核基础数据
const weeklyRosterRanked = computed(() => {
  // 结合当周累计贡献与周防守统计构建成员数据
  const members = [...ownMembers.value];
  return members.map((m) => {
    const w =
      weeklyDefenseStatsMap.value.get(`${Number(m.id)}_${!!m.mirror}`) ||
      weeklyDefenseStatsMap.value.get(Number(m.id)) ||
      weeklyDefenseStatsMap.value.get(m.id as any);
    return {
      ...m,
      challengeCnt: w ? w.challengeCnt : 0,
      defWins: w ? w.defWins : 0,
      defLosses: w ? w.defLosses : 0,
      defWinRate: w ? w.defWinRate : "—",
      defWinRateNum: w ? w.defWinRateNum : -1,
    };
  });
});

/**
 * 战绩表多维排序比较器工厂（今日/当周两表共用）
 *
 * @param {"score"|"attackWinRate"|"defWinRate"} sortBy 排序维度
 * @param {"score"|"todayScore"} scoreKey 贡献分字段：今日表用 todayScore（当日战功），当周表用 score（周累计）
 * @returns {(a: any, b: any) => number} 比较器
 */
const createRosterComparator =
  (
    sortBy: "score" | "attackWinRate" | "defWinRate",
    scoreKey: "score" | "todayScore" = "score",
  ) =>
  (a: any, b: any): number => {
    if (sortBy === "score") {
      return (
        (b[scoreKey] || 0) - (a[scoreKey] || 0) ||
        (b.power || 0) - (a.power || 0)
      );
    }
    if (sortBy === "attackWinRate") {
      // 优先：出过刀(realAttackCnt > 0)排在前面，0刀未出战排在后面
      const hasAtkA = (a.realAttackCnt || 0) > 0;
      const hasAtkB = (b.realAttackCnt || 0) > 0;
      if (hasAtkA && !hasAtkB) return -1;
      if (!hasAtkA && hasAtkB) return 1;
      if (!hasAtkA && !hasAtkB) return (b.power || 0) - (a.power || 0);

      // 出手胜率从大到小 (attackWins / realAttackCnt)
      const diffRate = (b.attackWinRateNum ?? -1) - (a.attackWinRateNum ?? -1);
      if (Math.abs(diffRate) > 0.001) return diffRate;

      // 胜率相同，出刀多的排前面
      const diffCnt = (b.realAttackCnt || 0) - (a.realAttackCnt || 0);
      if (diffCnt !== 0) return diffCnt;

      return (
        (b[scoreKey] || 0) - (a[scoreKey] || 0) ||
        (b.power || 0) - (a.power || 0)
      );
    }
    // defWinRate：优先遭遇过挑战(challengeCnt > 0)的排前面
    const hasDefA = (a.challengeCnt || 0) > 0;
    const hasDefB = (b.challengeCnt || 0) > 0;
    if (hasDefA && !hasDefB) return -1;
    if (!hasDefA && hasDefB) return 1;
    if (!hasDefA && !hasDefB) return (b.power || 0) - (a.power || 0);

    // 防守胜率从大到小 (守住次数defWins / challengeCnt)
    const diffRate = (b.defWinRateNum ?? -1) - (a.defWinRateNum ?? -1);
    if (Math.abs(diffRate) > 0.001) return diffRate;

    // 防守胜率相同，遭遇挑战次数多的排前面（经受更多进攻考验）
    const diffCnt = (b.challengeCnt || 0) - (a.challengeCnt || 0);
    if (diffCnt !== 0) return diffCnt;

    return (b.power || 0) - (a.power || 0);
  };

const sortedTodayMembers = computed(() => {
  const list = [...ownMembers.value];
  list.sort(createRosterComparator(todaySortBy.value, "todayScore"));
  return list.map((item, idx) => ({
    ...item,
    rankIndex: idx + 1,
  }));
});

/**
 * 当周全员战绩多维动态排序数据 (支持 贡献排名 | 出手胜率排名 | 防守胜率排名)
 */
const sortedWeeklyRoster = computed(() => {
  const list = [...weeklyRosterRanked.value];
  list.sort(createRosterComparator(weeklySortBy.value));
  return list.map((item, idx) => ({
    ...item,
    currentRank: idx + 1,
  }));
});

// 今日公会成员战报表格列
const todayTableColumns = [
  {
    title: "序号",
    key: "rankIndex",
    width: 60,
    align: "center",
    render: (row: any, index: number) => row.rankIndex || index + 1,
  },
  {
    title: "防守据点",
    key: "slot",
    width: 90,
    align: "center",
    render: (row: any) =>
      h(
        NTag,
        { size: "small", type: "info", round: true, bordered: false },
        { default: () => `#${row.slot || 1} 据点` },
      ),
  },
  {
    title: "头像",
    key: "headImg",
    width: 60,
    align: "center",
    render: (row: any) =>
      h(NAvatar, { round: true, size: 34, src: row.headImg }),
  },
  {
    title: "角色名称",
    key: "name",
    width: 140,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        {
          style: {
            fontWeight: "600",
            color: "#1890ff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          },
          onClick: () => openDuelModal(row),
        },
        [
          row.name,
          row.mirror
            ? h(
                NTag,
                { size: "tiny", type: "warning", round: true, bordered: false },
                { default: () => "镜像" },
              )
            : null,
        ],
      ),
  },
  {
    title: "真实战力",
    key: "power",
    width: 100,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { fontWeight: "600", color: "#fa8c16" } },
        formatPower(row.power),
      ),
  },
  {
    title: "今日战功贡献",
    key: "todayScore",
    width: 110,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        {
          style: {
            fontWeight: "700",
            color: row.todayScore > 0 ? "#10b981" : "#94a3b8",
            fontSize: "14px",
          },
        },
        row.todayScore > 0 ? `+${row.todayScore}分` : "0分",
      ),
  },
  {
    title: "据点防守态势",
    key: "defeated",
    width: 110,
    align: "center",
    render: (row: any) =>
      row.defeated
        ? h(
            NTag,
            { size: "small", type: "error", round: true },
            { default: () => "💥 已被攻破" },
          )
        : h(
            NTag,
            { size: "small", type: "success", round: true },
            { default: () => "🛡️ 坚守中" },
          ),
  },
  {
    title: "防守交战记录",
    key: "challengeCnt",
    width: 170,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { fontSize: "12px", color: "#64748b" } },
        `遭遇 ${row.challengeCnt || 0} 次 / 守住 ${row.defWins || 0} 次 (胜率 ${
          row.defWinRate || "—"
        })`,
      ),
  },
  {
    title: "今日出刀状态",
    key: "participation",
    width: 120,
    align: "center",
    render: (row: any) => {
      const cnt = row.realAttackCnt;
      if (cnt === undefined || cnt === 0) {
        return h(
          NTag,
          { size: "small", type: "error", bordered: false },
          { default: () => "0/3 未出战" },
        );
      }
      if (cnt < 3) {
        return h(
          NTag,
          { size: "small", type: "warning", bordered: false },
          { default: () => `${cnt}/3 未打满` },
        );
      }
      if (cnt === 3) {
        return h(
          NTag,
          { size: "small", type: "success", bordered: false },
          { default: () => "3/3 已打满" },
        );
      }
      return h(
        NTag,
        { size: "small", type: "info", bordered: false },
        { default: () => `${cnt}次 (满战)` },
      );
    },
  },
  {
    title: "今日出刀实绩",
    key: "realAttackRecord",
    width: 140,
    align: "center",
    render: (row: any) => {
      if ((row.realAttackCnt || 0) > 0) {
        return h(
          "span",
          {
            style: {
              fontSize: "12px",
              fontWeight: "600",
              color: "#10b981",
            },
          },
          `${row.attackWins || 0}胜 / ${row.attackLosses || 0}负 (胜率 ${
            row.attackWinRate || "—"
          })`,
        );
      }
      return h(
        "span",
        { style: { color: "#94a3b8", fontSize: "12px" } },
        "0刀",
      );
    },
  },
  {
    title: "操作",
    key: "action",
    width: 90,
    align: "center",
    render: (row: any) =>
      h(
        NButton,
        { size: "tiny", type: "primary", onClick: () => openDuelModal(row) },
        { default: () => "战报流水" },
      ),
  },
];

// 当周全员战功与胜率大宽表列
const weeklyRosterColumns = [
  {
    title: "当周排名",
    key: "rank",
    width: 80,
    align: "center",
    render: (row: any, index: number) => {
      const rank = row.currentRank || index + 1;
      const type =
        rank === 1
          ? "warning"
          : rank === 2
            ? "info"
            : rank === 3
              ? "success"
              : "default";
      return h(
        NTag,
        { size: "small", type, round: true },
        { default: () => `第 ${rank} 名` },
      );
    },
  },
  {
    title: "防守据点",
    key: "slot",
    width: 90,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { color: "#64748b", fontWeight: "600" } },
        `#${row.slot || 1} 据点`,
      ),
  },
  {
    title: "头像",
    key: "headImg",
    width: 60,
    align: "center",
    render: (row: any) =>
      h(NAvatar, { round: true, size: 34, src: row.headImg }),
  },
  {
    title: "成员姓名",
    key: "name",
    width: 140,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        {
          style: {
            fontWeight: "600",
            color: "#1890ff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          },
          onClick: () => openDuelModal(row),
        },
        [
          row.name,
          row.mirror
            ? h(
                NTag,
                { size: "tiny", type: "warning", round: true, bordered: false },
                { default: () => "镜像" },
              )
            : null,
        ],
      ),
  },
  {
    title: "真实战力",
    key: "power",
    width: 110,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { fontWeight: "600", color: "#fa8c16" } },
        formatPower(row.power),
      ),
  },
  {
    title: "红淬",
    key: "redQuench",
    width: 70,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { color: "#ff4d4f", fontWeight: "700" } },
        row.redQuench || 0,
      ),
  },
  {
    title: "当周总战功",
    key: "score",
    width: 110,
    align: "center",
    sorter: (a: any, b: any) => (a.score || 0) - (b.score || 0),
    render: (row: any) =>
      h(
        "span",
        {
          style: {
            fontWeight: "700",
            color: "#6366f1",
            fontSize: "14px",
          },
        },
        `${row.score || 0}分`,
      ),
  },
  {
    title: "本周遭遇挑战",
    key: "challengeCnt",
    width: 90,
    align: "center",
    render: (row: any) => h("span", `${row.challengeCnt || 0}次`),
  },
  {
    title: "本周防守守住",
    key: "defWins",
    width: 90,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { color: "#10b981", fontWeight: "600" } },
        `${row.defWins || 0}次`,
      ),
  },
  {
    title: "本周防守胜率",
    key: "defWinRate",
    width: 100,
    align: "center",
    sorter: (a: any, b: any) =>
      (a.defWinRateNum ?? -1) - (b.defWinRateNum ?? -1),
    render: (row: any) =>
      h(
        "span",
        {
          style: {
            fontWeight: "700",
            color:
              Number.parseFloat(row.defWinRate) >= 50 ? "#10b981" : "#f59e0b",
          },
        },
        row.defWinRate,
      ),
  },
  {
    title: "操作",
    key: "action",
    width: 90,
    align: "center",
    render: (row: any) =>
      h(
        NButton,
        { size: "tiny", type: "primary", onClick: () => openDuelModal(row) },
        { default: () => "对战详情" },
      ),
  },
];

/**
 * 解析并拉取单名成员的真实营地挑战布阵阵容
 *
 * @param {string} tokenId 当前账号 Token ID
 * @param {number} roleId 目标成员 Role ID
 * @param {object} [baseInfo] 目标成员基础信息
 * @returns {Promise<object>} 包含 1~5 号站位武将真实数据的成员对象
 */
const fetchMemberRealLineup = async (
  tokenId: string,
  roleId: number,
  baseInfo: any = {},
) => {
  try {
    // 1. 优先调用 club_gettargetteam 获取营地挑战专属布阵阵容 (0..4 站位)
    let targetTeamRes: any = null;
    try {
      targetTeamRes = await tokenStore.sendMessageWithPromise(
        tokenId,
        "club_gettargetteam",
        { targetId: roleId },
        4000,
      );
    } catch (e) {
      targetTeamRes = await tokenStore.sendMessageWithPromise(
        tokenId,
        "role_gettargetteam",
        { targetId: roleId },
        4000,
      );
    }

    const roleBattleTeam = targetTeamRes?.roleBattleTeam;
    const teamInfo = targetTeamRes?.teamInfo;
    const role = roleBattleTeam?.role || teamInfo;
    const battleTeam = roleBattleTeam?.battleTeam || teamInfo?.team;

    let totalRedCount = 0;
    const heroesInTeam: any[] = [];

    if (battleTeam) {
      const slotKeys = Object.keys(battleTeam).sort(
        (a, b) => Number(a) - Number(b),
      );
      for (const slotKey of slotKeys) {
        const slotData = battleTeam[slotKey];
        const heroId = slotData.heroId || slotData.id;
        const heroRed = slotData.redQuenchCnt || 0;
        totalRedCount += heroRed;

        heroesInTeam.push({
          slotIndex: Number(slotKey) + 1,
          slotName:
            Number(slotKey) < 2
              ? `前排${Number(slotKey) + 1}号位`
              : `后排${Number(slotKey) + 1}号位`,
          heroId,
          heroName: HERO_DICT[heroId]?.name || `武将${heroId}`,
          level: slotData.level || 6000,
          star: slotData.star || 30,
          attack: slotData.attack || 0,
          curHp: slotData.hp || slotData.curHp || 0,
          skin: slotData.useSkin || slotData.skin || 0,
          red: heroRed,
          battleTeamSlot: Number(slotKey),
        });
      }
    }

    const totalPower =
      heroesInTeam.reduce((sum, h) => sum + (h.attack || h.curHp || 0), 0) > 0
        ? role?.power || baseInfo?.power || 0
        : role?.power || baseInfo?.power || 0;

    return {
      slot: baseInfo?.slot || 1,
      id: roleId,
      name: role?.name || baseInfo?.name || `成员${roleId}`,
      headImg: role?.headImg || baseInfo?.headImg || "/icons/xiaoyugan.png",
      power: totalPower,
      legacy: baseInfo?.legacy || 0,
      redQuench: totalRedCount,
      toyName:
        formatWeapon(
          role?.weaponId || role?.lordWeaponId || baseInfo?.toyName,
        ) || "",
      petId: role?.petId || baseInfo?.petId || 0,
      legionName: role?.legionName || baseInfo?.legionName || "",
      heroList: heroesInTeam,
      lineupType: getLineupType(heroesInTeam),
      score: baseInfo?.score || 0,
      defeated: baseInfo?.defeated || false,
      challengeCnt: baseInfo?.challengeCnt || 0,
      failCnt: baseInfo?.failCnt || 0,
      mirror: !!baseInfo?.mirror,
    };
  } catch (e: any) {
    return {
      slot: baseInfo?.slot || 1,
      id: roleId,
      name: baseInfo?.name || `成员${roleId}`,
      headImg: baseInfo?.headImg || "/icons/xiaoyugan.png",
      power: baseInfo?.power || 0,
      legacy: 0,
      redQuench: 0,
      toyName: "",
      petId: baseInfo?.petId || 0,
      heroList: [],
      lineupType: "未知",
      score: baseInfo?.score || 0,
      defeated: baseInfo?.defeated || false,
      challengeCnt: baseInfo?.challengeCnt || 0,
      failCnt: baseInfo?.failCnt || 0,
      mirror: !!baseInfo?.mirror,
    };
  }
};

/**
 * 分块并发加载成员阵容
 *
 * @param {string} tokenId 当前账号 Token ID
 * @param {Array<{ id: number; base: any }>} items 成员 ID 与基础属性列表
 * @param {number} [chunkSize] 分批大小
 * @returns {Promise<Array<object>>} 已解析的成员列表
 */
const fetchMembersInChunks = async (
  tokenId: string,
  items: { id: number; base: any }[],
  chunkSize = 5,
) => {
  const results: any[] = [];
  const total = items.length;
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    progressText.value = `${Math.min(i + chunkSize, total)}/${total}`;
    const chunkResults = await Promise.all(
      chunk.map((it) => fetchMemberRealLineup(tokenId, it.id, it.base)),
    );
    results.push(...chunkResults);
  }
  return results;
};

/**
 * 获取营地挑战完整对战与阵容数据
 */
const fetchCampChallengeData = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先在上方选择一个已连接账号");
    return;
  }
  const tokenId = tokenStore.selectedToken.id;
  loading.value = true;
  emptyHint.value = "正在加载营地对阵信息...";

  try {
    // 1. 查询当前我方公会基础信息
    const ownClubRes: any = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfo",
      {},
      5000,
    );
    const ownClubData =
      ownClubRes?.info || ownClubRes?.legionData || ownClubRes || {};
    const ownLegionId = ownClubData.id;
    ownClubMembers.value = ownClubData.members || {};

    // 2. 调用 club_getinfo 获取营地挑战全量活动数据
    const clubInfoRes: any = await tokenStore.sendMessageWithPromise(
      tokenId,
      "club_getinfo",
      {},
      8000,
    );
    const clubData = clubInfoRes?.club || {};
    rawClubData.value = clubData;
    rawSiegeData.value = clubInfoRes?.siege || {};

    // 3. 动态解析比赛日列表（从接口 oppoMap 提取所有匹配的对手公会）
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const days: any[] = [];
    if (clubData.oppoMap) {
      for (const [dayKey, oppo] of Object.entries(clubData.oppoMap) as [
        string,
        any,
      ][]) {
        const dayNum = Number(dayKey);
        days.push({
          day: dayNum,
          label: dayNames[dayNum] || `周${dayKey}`,
          name: oppo.name || `俱乐部${oppo.legionId}`,
          legionId: oppo.legionId,
          power: oppo.power || 0,
          viewId: oppo.viewId,
          dayScore: oppo.dayScore || 0,
          defenders: oppo.defenders || {},
          logo: oppo.logo || "/icons/xiaoyugan.png",
        });
      }
    }
    days.sort((a, b) => a.day - b.day);
    matchDayList.value = days;

    // 确定当前选中的对战日（默认匹配今日星期几，不在列表中则选第一个）
    const currentDay = new Date().getDay();
    if (days.some((d) => d.day === currentDay)) {
      selectedMatchDay.value = currentDay;
    } else if (
      days.length > 0 &&
      !days.some((d) => d.day === selectedMatchDay.value)
    ) {
      selectedMatchDay.value = days[0].day;
    }

    // 4. 获取当前选定比赛日的对手俱乐部
    const currentOppo =
      days.find((d) => d.day === selectedMatchDay.value) || days[0] || {};
    const displayOppName = currentOppo.name || "匹配对战俱乐部";

    // 5. 设置双方公会对决 VS 看板
    battleInfo.value = {
      ownClub: {
        id: clubData.legionId || ownLegionId || "0",
        name: ownClubData.name || "我方俱乐部",
        serverId: ownClubData.serverId || "",
        logo: ownClubData.logo || "/icons/xiaoyugan.png",
        quenchNum: 0,
        power: clubData.power || ownClubData.power || 0,
        announcement:
          ownClubData.announcement || ownClubData.manifesto || "暂无公会公告",
      },
      opponentClub: {
        id: currentOppo.legionId || "未知",
        name: displayOppName,
        serverId: currentOppo.viewId ? `${currentOppo.viewId}` : "跨服",
        logo: currentOppo.logo || "/icons/xiaoyugan.png",
        quenchNum: 0,
        power: currentOppo.power || 0,
        announcement: "营地挑战匹配对战俱乐部",
      },
    };

    // 6. 构建敌我双方 30 名成员基础列表 (保留 slot 据点编号、镜像标记与受击数据)
    const oppDefendersEntries = Object.entries(currentOppo.defenders || {}) as [
      string,
      any,
    ][];
    opponentMembers.value = oppDefendersEntries.map(
      ([slotKey, d]: [string, any], idx: number) => ({
        slot: Number(slotKey) || idx + 1,
        id: d.roleId,
        name: d.name || `对手成员${idx + 1}`,
        headImg: d.headImg || "/icons/xiaoyugan.png",
        power: 0,
        score: d.score || 0,
        defeated: d.defeated || false,
        challengeCnt: d.challengeCnt || 0,
        failCnt: d.failCnt || 0,
        mirror: !!d.mirror,
        heroList: [],
        lineupType: "常规",
        redQuench: 0,
        legacy: 0,
        toyName: "",
        petId: d.petId || 0,
        legionName: displayOppName,
      }),
    );

    const ownMembersEntries = Object.entries(clubData.members || {}) as [
      string,
      any,
    ][];
    ownMembers.value = ownMembersEntries.map(
      ([slotKey, m]: [string, any], idx: number) => ({
        slot: Number(slotKey) || idx + 1,
        id: m.roleId,
        name: m.name || `我方成员${idx + 1}`,
        headImg: m.headImg || "/icons/xiaoyugan.png",
        power: 0,
        score: m.score || 0,
        defeated: m.defeated || false,
        challengeCnt: m.challengeCnt || 0,
        failCnt: m.failCnt || 0,
        mirror: !!m.mirror,
        heroList: [],
        lineupType: "常规",
        redQuench: 0,
        legacy: 0,
        toyName: "",
        petId: m.petId || 0,
        legionName: ownClubData.name || "我方俱乐部",
      }),
    );

    selectedSide.value = "own";
    rankText.value = `营地挑战对决 · VS ${displayOppName}`;

    // 7. 分批并发拉取真实布阵
    if (opponentMembers.value.length > 0) {
      const oppDetailed = await fetchMembersInChunks(
        tokenId,
        opponentMembers.value.map((o) => ({ id: o.id, base: o })),
      );
      opponentMembers.value = oppDetailed;
      const totalOppRed = oppDetailed.reduce(
        (s, m) => s + (m.redQuench || 0),
        0,
      );
      const totalOppPower = oppDetailed.reduce((s, m) => s + (m.power || 0), 0);
      battleInfo.value.opponentClub.quenchNum = totalOppRed;
      if (totalOppPower > 0) {
        battleInfo.value.opponentClub.power = totalOppPower;
      }
    }

    if (ownMembers.value.length > 0) {
      const ownDetailed = await fetchMembersInChunks(
        tokenId,
        ownMembers.value.map((o) => ({ id: o.id, base: o })),
      );
      ownMembers.value = ownDetailed;
      const totalOwnRed = ownDetailed.reduce(
        (s, m) => s + (m.redQuench || 0),
        0,
      );
      const totalOwnPower = ownDetailed.reduce((s, m) => s + (m.power || 0), 0);
      battleInfo.value.ownClub.quenchNum = totalOwnRed;
      if (totalOwnPower > 0) {
        battleInfo.value.ownClub.power = totalOwnPower;
      }
    }

    // 8. 预拉取个人进攻战报
    try {
      const atkRes: any = await tokenStore.sendMessageWithPromise(
        tokenId,
        "club_getattackrecord",
        {},
        5000,
      );
      if (Array.isArray(atkRes?.records)) {
        cachedAttackRecords.value = atkRes.records;
      }
    } catch (e) {
      console.warn("未能拉取个人进攻战报:", e);
    }

    // 9. 拉取本组 4 俱乐部排位天梯榜
    try {
      const grpRes: any = await tokenStore.sendMessageWithPromise(
        tokenId,
        "club_getgrouprank",
        {},
        5000,
      );
      if (Array.isArray(grpRes?.rankList)) {
        groupRankData.value = grpRes.rankList;
      }
    } catch (e) {
      console.warn("未能拉取排位天梯榜:", e);
    }

    // 10. 汇总全员出刀与防守战报
    try {
      await aggregateAllMemberAttacks(tokenId, selectedMatchDay.value);
    } catch (e) {
      console.warn("未能聚合全员进攻战报:", e);
    }

    message.success(`营地挑战(${displayOppName})数据加载完成`);
  } catch (err: any) {
    emptyHint.value = `查询失败: ${err.message || "网络异常"}`;
    message.error(emptyHint.value);
  } finally {
    loading.value = false;
  }
};

/**
 * 计算指定比赛日的当日时间窗口（本地时区当天 00:00 ~ 次日 00:00，毫秒）
 * 依据 club_getinfo 返回的 phase（周更新周期周一日期，如 "260907"）推算每个比赛日的具体日期，
 * 与 weeklyStats 中 oppoMap 比赛日期的推算方式保持一致。
 *
 * @param {number} day 比赛日星期编号 (周日=0, 周一=1 ...)
 * @returns {{startMs: number, endMs: number} | null} 当日毫秒时间窗口；phase 缺失时返回 null（不过滤）
 */
const getMatchDayRange = (
  day: number,
): { startMs: number; endMs: number } | null => {
  const phaseStr = String(rawClubData.value?.phase || "");
  if (phaseStr.length !== 6) return null;
  const y = 2000 + Number.parseInt(phaseStr.slice(0, 2), 10);
  const m = Number.parseInt(phaseStr.slice(2, 4), 10) - 1;
  const d = Number.parseInt(phaseStr.slice(4, 6), 10);
  const offset = day >= 1 ? day - 1 : day + 6; // 周一为周期起点，周日跨到周末尾
  const matchDt = new Date(y, m, d + offset);
  const startMs = new Date(
    matchDt.getFullYear(),
    matchDt.getMonth(),
    matchDt.getDate(),
  ).getTime();
  return { startMs, endMs: startMs + 24 * 60 * 60 * 1000 };
};

/**
 * 判断战报 created 时间戳是否落在指定比赛日的当日时间窗口内（秒级/毫秒级均兼容）
 * 服务器接口不按查询日过滤历史记录，客户端按窗口过滤，避免历史数据累计到当天统计。
 *
 * @param {number|string} ts 战报 created 时间戳
 * @param {number} day 比赛日星期编号 (周日=0)
 * @returns {boolean} 是否属于该比赛日；phase 缺失时恒为 true（不过滤）
 */
const isRecordInMatchDay = (ts: any, day: number): boolean => {
  const range = getMatchDayRange(day);
  if (!range) return true;
  const n = Number(ts);
  const ms = n > 10000000000 ? n : n * 1000;
  return ms >= range.startMs && ms < range.endMs;
};

/**
 * 并发汇总双方公会出刀战报与防守数据
 *
 * 1. 遍历 oppoMap 对手据点 challengeCnt 与 failCnt 统计我方出刀数据；
 * 2. 调用 club_getdefenserecord 拉取据点战报，汇总出刀明细与防守流水；
 * 3. 按比赛日时间窗口过滤战报，计算胜负场次与胜率；
 * 4. 汇总当周防守数据并更新成员列表。
 *
 * @param {string} tokenId 账号凭证
 * @param {number} day 比赛日编号
 */
const aggregateAllMemberAttacks = async (tokenId: string, day: number) => {
  const oppo = matchDayList.value.find((d) => d.day === day);
  if (!oppo || !oppo.defenders) return;

  const oppDefenders = Object.values(oppo.defenders) as any[];
  const ourDefenders = ownMembers.value;

  // 全实时策略：每次聚合前清空上一轮的当周防守统计
  weeklyDefenseStatsMap.value = new Map();

  const ourStats = new Map<
    number,
    {
      roleId: number;
      name: string;
      attackCnt: number;
      winCnt: number;
      lossCnt: number;
      attacks: any[];
    }
  >();

  const defRecordsMap = new Map<number, any[]>();

  let ourTotalAttacks = 0;
  let ourTotalWins = 0;
  let ourTotalLosses = 0;

  let oppTotalAttacks = 0;
  let oppTotalWins = 0;
  let oppTotalLosses = 0;

  // 1. 统计我方出手：读取对手据点 challengeCnt 与 failCnt 计算出刀与胜负
  //    failCnt 语义已用 100 条今日战报逐成员比对钉死：failCnt = 攻击方挑战失败次数 = 该据点防守成功次数；
  //    故我方挑战成功(胜) = challengeCnt - failCnt，我方挑战失败 = failCnt
  for (const d of oppDefenders as any[]) {
    const cnt = d.challengeCnt || 0;
    const defSucc = d.failCnt || 0; // 对手据点防守成功次数 = 我方挑战失败次数
    ourTotalAttacks += cnt;
    ourTotalWins += Math.max(0, cnt - defSucc);
    ourTotalLosses += defSucc;
  }

  // 1b. 并发拉取对手防守据点战报（即我方出刀战报）：仅当前比赛日可查（往日返回 200020），
  //     用于补充每刀明细与成员归属，不重复累加总出手数（总数已由 challengeCnt 真值提供）
  const seenOppDefRecords = new Set<string>();
  const oppDefPromise = Promise.all(
    oppDefenders.map(async (d: any) => {
      try {
        const defRes: any = await tokenStore.sendMessageWithPromise(
          tokenId,
          "club_getdefenserecord",
          { targetId: d.roleId, targetIsMirror: !!d.mirror },
          5000,
        );
        if (Array.isArray(defRes?.records)) {
          for (const r of defRes.records) {
            // 过滤非指定比赛日的战报
            if (!isRecordInMatchDay(r.created, day)) continue;

            // 全局战报去重（根据全局唯一 recordName 或 特征键，避免镜像据点或同角色复用导致战报重复累计）
            const recordKey =
              r.recordName ||
              `${r.created}_${r.roleId}_${r.nodeId ?? d.slot ?? ""}_${r.isWin}`;
            if (seenOppDefRecords.has(recordKey)) continue;
            seenOppDefRecords.add(recordKey);

            // 挑战方攻破判定：对手据点记录中 isWin 为 false 表示攻破成功
            const attackerWon = r.isWin === false;

            const attackerRoleId = r.roleId;
            let cur = ourStats.get(attackerRoleId);
            if (!cur) {
              cur = {
                roleId: attackerRoleId,
                name: r.name,
                attackCnt: 0,
                winCnt: 0,
                lossCnt: 0,
                attacks: [],
              };
              ourStats.set(attackerRoleId, cur);
            }
            cur.attackCnt++;
            if (attackerWon) cur.winCnt++;
            else cur.lossCnt++;

            cur.attacks.push({
              attackType: 1,
              winFlag: attackerWon, // 我方进攻成功
              timestamp: r.created,
              difficulty: r.difficulty,
              nodeId: r.nodeId,
              targetRoleInfo: {
                roleId: d.roleId,
                name: d.name,
                legionName: oppo.name || "敌方俱乐部",
                headImg: d.headImg || "/icons/xiaoyugan.png",
                power: d.power,
              },
            });
          }
        }
      } catch (e) {
        // 忽略单据点拉取失败
      }
    }),
  );

  // 2. 并发拉取我方防守据点战报
  const seenOurDefRecords = new Set<string>();
  const ourDefPromise = Promise.all(
    ourDefenders.map(async (m: any) => {
      try {
        const defRes: any = await tokenStore.sendMessageWithPromise(
          tokenId,
          "club_getdefenserecord",
          { targetId: m.id || m.roleId, targetIsMirror: !!m.mirror },
          5000,
        );
        if (Array.isArray(defRes?.records)) {
          const list: any[] = [];
          // 累加当周防守数据
          const w = {
            challengeCnt: 0,
            defWins: 0,
            defLosses: 0,
            defWinRate: "—",
            defWinRateNum: -1,
          };
          for (const r of defRes.records) {
            // 当周防守统计累加
            w.challengeCnt++;
            if (r.isWin === true) w.defWins++;
            else w.defLosses++;

            // 过滤非指定比赛日的战报
            if (!isRecordInMatchDay(r.created, day)) continue;

            // 全局战报去重（避免镜像据点或同角色复用导致对手出刀数据被多次翻倍累计）
            const recordKey =
              r.recordName ||
              `${r.created}_${r.roleId}_${r.nodeId ?? m.slot ?? ""}_${r.isWin}`;
            if (!seenOurDefRecords.has(recordKey)) {
              seenOurDefRecords.add(recordKey);
              oppTotalAttacks++;
              // 防守记录判定：isWin 为 true 代表防守守住，false 代表失守
              const oppAttackerWon = r.isWin === false;
              if (oppAttackerWon) oppTotalWins++;
              else oppTotalLosses++;
            }

            const defenderWon = r.isWin === true;
            list.push({
              attackType: 0,
              winFlag: defenderWon, // 我方防守成功（对方挑战失败）
              timestamp: r.created,
              difficulty: r.difficulty,
              nodeId: r.nodeId,
              targetRoleInfo: {
                roleId: r.roleId,
                name: r.name,
                legionName: r.legionName || oppo.name || "敌方俱乐部",
                headImg: r.headImg || "/icons/xiaoyugan.png",
                power: r.power,
              },
            });
          }
          list.sort((a, b) => b.timestamp - a.timestamp);
          const memberRoleId = m.id || m.roleId;
          defRecordsMap.set(`${memberRoleId}_${!!m.mirror}`, list);
          if (!m.mirror || !defRecordsMap.has(memberRoleId)) {
            defRecordsMap.set(memberRoleId, list);
          }
          // 计算当周防守胜率并写入周统计
          w.defWinRate =
            w.challengeCnt > 0
              ? `${((w.defWins / w.challengeCnt) * 100).toFixed(1)}%`
              : "—";
          w.defWinRateNum =
            w.challengeCnt > 0 ? (w.defWins / w.challengeCnt) * 100 : -1;
          weeklyDefenseStatsMap.value.set(`${memberRoleId}_${!!m.mirror}`, w);
          if (!m.mirror || !weeklyDefenseStatsMap.value.has(memberRoleId)) {
            weeklyDefenseStatsMap.value.set(memberRoleId, w);
          }
        }
      } catch (e) {
        // 忽略单据点拉取失败
      }
    }),
  );

  await Promise.all([oppDefPromise, ourDefPromise]);

  // 对每个成员的主动出刀记录按时间倒序排序
  ourStats.forEach((entry) => {
    entry.attacks.sort((a, b) => b.timestamp - a.timestamp);
  });

  memberAttackStatsMap.value = ourStats;
  memberDefenseRecordsMap.value = defRecordsMap;

  // 计算双方总体出手胜率
  const ourWinRate =
    ourTotalAttacks > 0
      ? ((ourTotalWins / ourTotalAttacks) * 100).toFixed(1)
      : "0.0";
  const oppWinRate =
    oppTotalAttacks > 0
      ? ((oppTotalWins / oppTotalAttacks) * 100).toFixed(1)
      : "0.0";

  // 防守维度：从我方据点拉到的战报是"对手出手"，从对手据点拉到的战报是"我方出手"
  // 我方防守胜率 = 对手进攻失败(oppTotalLosses) / 对手进攻总次数(oppTotalAttacks)
  // 敌方防守胜率 = 我方进攻失败(ourTotalLosses) / 我方进攻总次数(ourTotalAttacks)
  const ourDefWinRate =
    oppTotalAttacks > 0
      ? ((oppTotalLosses / oppTotalAttacks) * 100).toFixed(1)
      : "0.0";
  const oppDefWinRate =
    ourTotalAttacks > 0
      ? ((ourTotalLosses / ourTotalAttacks) * 100).toFixed(1)
      : "0.0";

  todayCombatStats.value = {
    loaded: true,
    ourClub: {
      name: battleInfo.value?.ownClub?.name || "我方俱乐部",
      totalAttacks: ourTotalAttacks,
      wins: ourTotalWins,
      losses: ourTotalLosses,
      winRate: ourWinRate,
      // 我方防守维度（对手打我方据点的战报）
      defTotal: oppTotalAttacks,
      defWins: oppTotalLosses, // 对手进攻失败 = 我方守住
      defLosses: oppTotalWins, // 对手进攻成功 = 我方失守
      defWinRate: ourDefWinRate,
    },
    oppClub: {
      name: oppo.name || "匹配俱乐部",
      totalAttacks: oppTotalAttacks,
      wins: oppTotalWins,
      losses: oppTotalLosses,
      winRate: oppWinRate,
      // 敌方防守维度（我方打对手据点的战报）
      defTotal: ourTotalAttacks,
      defWins: ourTotalLosses, // 我方进攻失败 = 敌方守住
      defLosses: ourTotalWins, // 我方进攻成功 = 敌方失守
      defWinRate: oppDefWinRate,
    },
  };

  // 将精确出手信息与防守信息完整注入到 ownMembers 每一个成员对象中
  injectAttackStatsIntoOwnMembers();
};

/**
 * 检查今日比赛是否已开战
 *
 * 检查当前用户出刀数以及双方据点被挑战次数。
 */
const todayBattleStarted = computed(() => {
  const now = new Date();
  const todayKey = `${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  if ((rawSiegeData.value?.attackMap?.[todayKey]?.attackCnt || 0) > 0) {
    return true;
  }
  return (
    ownMembers.value.some((m: any) => (m.challengeCnt || 0) > 0) ||
    opponentMembers.value.some((m: any) => (m.challengeCnt || 0) > 0)
  );
});

/**
 * 将出刀与防守统计注入到 ownMembers 列表中
 */
const injectAttackStatsIntoOwnMembers = () => {
  ownMembers.value = ownMembers.value.map((m: any) => {
    const isMirror = !!m.mirror;
    // 镜像据点为系统填充的虚拟防守据点，作为独立个体本身无出战行为，不继承本体的主动出刀统计
    const stats = isMirror
      ? null
      : memberAttackStatsMap.value.get(Number(m.id)) ||
        memberAttackStatsMap.value.get(m.id as any);

    // 1. 出手信息
    const realAttackCnt = stats ? stats.attackCnt : 0;
    const attackWins = stats ? stats.winCnt : 0;
    const attackLosses = stats ? stats.lossCnt : 0;
    const attackWinRateNum =
      realAttackCnt > 0 ? (attackWins / realAttackCnt) * 100 : -1;
    const attackWinRate =
      realAttackCnt > 0 ? `${attackWinRateNum.toFixed(1)}%` : "—";

    // 判定成员出战状态与出刀次数文本
    let attackStatusText = "0/3 未出战";
    let attackStatusType: "error" | "warning" | "success" | "info" = "error";
    if (realAttackCnt === 0) {
      attackStatusText = "0/3 未出战";
      attackStatusType = "error";
    } else if (realAttackCnt < 3) {
      attackStatusText = `${realAttackCnt}/3 未打满`;
      attackStatusType = "warning";
    } else if (realAttackCnt === 3) {
      attackStatusText = "3/3 已打满";
      attackStatusType = "success";
    } else {
      attackStatusText = `${realAttackCnt}次 (满战)`;
      attackStatusType = "info";
    }

    // 2. 防守信息：计算防守守住次数、失守次数与防守胜率
    //    failCnt 语义已用 100 条今日战报逐成员比对钉死：failCnt = 攻击方挑战失败次数 = 我方防守成功(守住)次数；
    //    我方失守次数 = 遭遇挑战次数 - failCnt
    const challengeCnt = m.challengeCnt || 0;
    const defWins = m.failCnt || 0;
    const defLosses = Math.max(0, challengeCnt - defWins);
    const defWinRateNum =
      challengeCnt > 0 ? (defWins / challengeCnt) * 100 : -1;
    const defWinRate = challengeCnt > 0 ? `${defWinRateNum.toFixed(1)}%` : "—";

    // 3. 今日未开战时将今日战功归 0，开战后读取各自据点的 score
    const todayScore = todayBattleStarted.value ? m.score || 0 : 0;

    return {
      ...m,
      realAttackCnt,
      attackWins,
      attackLosses,
      attackWinRate,
      attackWinRateNum,
      attackStatusText,
      attackStatusType,
      challengeCnt,
      defLosses,
      defWins,
      defWinRate,
      defWinRateNum,
      todayScore,
    };
  });
};

/**
 * 切换比赛日（周二/周三/周四）
 * 实时拉取对应比赛日的据点布阵与战报数据。
 *
 * @param {number} day 比赛日编号 (2, 3, 4)
 */
const handleMatchDayChange = async (day: number) => {
  selectedMatchDay.value = day;

  const oppo = matchDayList.value.find((d) => d.day === day);
  if (!oppo || !oppo.defenders) return;

  const tokenId = tokenStore.selectedToken?.id;
  if (!tokenId) return;

  const fetchId = ++currentFetchToken;
  loading.value = true;

  try {
    // 1. 实时重拉 club_getinfo，刷新我方成员当日 challengeCnt/failCnt/score/defeated
    const clubInfoRes: any = await tokenStore.sendMessageWithPromise(
      tokenId,
      "club_getinfo",
      {},
      8000,
    );
    if (currentFetchToken !== fetchId || selectedMatchDay.value !== day) return;
    const clubData = clubInfoRes?.club || {};
    rawClubData.value = clubData;
    rawSiegeData.value = clubInfoRes?.siege || {};
    const freshOwn = clubData.members || {};
    ownMembers.value = ownMembers.value.map((m: any) => {
      const fresh = freshOwn[m.id] || freshOwn[String(m.id)];
      if (!fresh) return m;
      return {
        ...m,
        score: fresh.score ?? m.score,
        defeated: fresh.defeated ?? m.defeated,
        challengeCnt: fresh.challengeCnt ?? 0,
        failCnt: fresh.failCnt ?? 0,
        mirror: fresh.mirror !== undefined ? !!fresh.mirror : m.mirror,
      };
    });

    // 2. 实时重建对手据点列表
    const oppDefendersEntries = Object.entries(oppo.defenders || {}) as [
      string,
      any,
    ][];
    const initialMembers = oppDefendersEntries.map(
      ([slotKey, d]: [string, any], idx: number) => ({
        slot: Number(slotKey) || idx + 1,
        id: d.roleId,
        name: d.name || `对手成员${idx + 1}`,
        headImg: d.headImg || "/icons/xiaoyugan.png",
        power: 0,
        score: d.score || 0,
        defeated: d.defeated || false,
        challengeCnt: d.challengeCnt || 0,
        failCnt: d.failCnt || 0,
        mirror: !!d.mirror,
        heroList: [],
        lineupType: "常规",
        redQuench: 0,
        legacy: 0,
        toyName: "",
        petId: d.petId || 0,
        legionName: oppo.name,
      }),
    );
    const oppClubObj = {
      id: oppo.legionId || "未知",
      name: oppo.name,
      serverId: oppo.viewId ? `${oppo.viewId}` : "跨服",
      logo: oppo.logo || "/icons/xiaoyugan.png",
      quenchNum: 0,
      power: oppo.power || 0,
      announcement: "营地挑战匹配对战俱乐部",
    };
    battleInfo.value.opponentClub = oppClubObj;
    opponentMembers.value = initialMembers;
    rankText.value = `营地挑战对决 · VS ${oppo.name}`;

    // 3. 实时拉取对手据点布阵与全量战报聚合
    if (initialMembers.length > 0) {
      const detailed = await fetchMembersInChunks(
        tokenId,
        initialMembers.map((o) => ({ id: o.id, base: o })),
      );
      if (currentFetchToken !== fetchId || selectedMatchDay.value !== day)
        return;
      const totalOppRed = detailed.reduce((s, m) => s + (m.redQuench || 0), 0);
      const totalOppPower = detailed.reduce((s, m) => s + (m.power || 0), 0);
      oppClubObj.quenchNum = totalOppRed;
      if (totalOppPower > 0) {
        oppClubObj.power = totalOppPower;
      }
      opponentMembers.value = detailed;
    }
    await aggregateAllMemberAttacks(tokenId, day);
  } catch (e) {
    console.warn("切换比赛日加载失败:", e);
  } finally {
    if (currentFetchToken === fetchId) {
      loading.value = false;
    }
  }
};

/**
 * 呼出成员对战战报流水对话框
 *
 * @param {object} player 目标玩家对象
 */
const openDuelModal = async (player: any, side = selectedSide.value) => {
  targetPlayer.value = player;
  targetPlayerSide.value = side;
  showDuelModal.value = true;
  modalLoading.value = true;
  playerAttackRecords.value = [];
  playerDefenseRecords.value = [];

  try {
    const tokenId = tokenStore.selectedToken?.id;
    if (!tokenId) return;

    const isOpponent = side === "opponent";

    if (isOpponent) {
      // 目标是匹配敌方据点守军：
      // 其防守流水：拉取 club_getdefenserecord 查看我方哪些成员攻打了他
      const defRes: any = await tokenStore.sendMessageWithPromise(
        tokenId,
        "club_getdefenserecord",
        { targetId: player.id, targetIsMirror: !!player.mirror },
        5000,
      );
      if (Array.isArray(defRes?.records)) {
        playerDefenseRecords.value = defRes.records
          .filter((r: any) =>
            isRecordInMatchDay(r.created, selectedMatchDay.value),
          )
          .map((r: any) => ({
            attackType: 0,
            winFlag: r.isWin === true, // 严格事实（isWin 为记录归属者=防守方视角）：true=对手守军防守成功
            timestamp: r.created,
            difficulty: r.difficulty,
            nodeId: r.nodeId,
            targetRoleInfo: {
              roleId: r.roleId,
              name: r.name, // 进攻的我方成员
              legionName:
                r.legionName || battleInfo.value?.ownClub?.name || "我方俱乐部",
              headImg: r.headImg || "/icons/xiaoyugan.png",
              power: r.power,
            },
          }));
      }
      playerAttackRecords.value = [];
    } else {
      // 目标是我方俱乐部成员：
      const isMirror = !!player.mirror;
      const roleIdNum = Number(player.id);
      // 1. 出手信息（我方进攻）：镜像据点为系统填充的虚拟防守据点，作为独立个体无主动出战出刀记录
      if (isMirror) {
        playerAttackRecords.value = [];
      } else {
        const s =
          memberAttackStatsMap.value.get(roleIdNum) ||
          memberAttackStatsMap.value.get(player.id);
        if (s && s.attacks.length > 0) {
          playerAttackRecords.value = s.attacks;
        } else if (
          roleIdNum === Number(tokenStore.selectedToken?.roleId) &&
          cachedAttackRecords.value.length > 0
        ) {
          playerAttackRecords.value = cachedAttackRecords.value
            .filter((r: any) =>
              isRecordInMatchDay(r.created, selectedMatchDay.value),
            )
            .map((r: any) => ({
              attackType: 1,
              winFlag: r.isWin === true, // 进攻信息：挑战成功就是挑战成功！
              timestamp: r.created,
              difficulty: r.difficulty,
              nodeId: r.nodeId,
              targetRoleInfo: {
                roleId: r.roleId,
                name: r.name,
                legionName:
                  r.legionName ||
                  battleInfo.value?.opponentClub?.name ||
                  "敌方俱乐部",
                headImg: r.headImg || "/icons/xiaoyugan.png",
                power: r.power,
              },
            }));
        } else {
          playerAttackRecords.value = [];
        }
      }

      // 2. 防守信息（匹配俱乐部打我们）：防守信息中对方挑战成功我们就是失败了！
      const cachedDef =
        memberDefenseRecordsMap.value.get(`${roleIdNum}_${!!player.mirror}`) ||
        memberDefenseRecordsMap.value.get(roleIdNum) ||
        memberDefenseRecordsMap.value.get(player.id);
      if (cachedDef && cachedDef.length > 0) {
        playerDefenseRecords.value = cachedDef;
      } else {
        const defRes: any = await tokenStore.sendMessageWithPromise(
          tokenId,
          "club_getdefenserecord",
          { targetId: player.id, targetIsMirror: !!player.mirror },
          5000,
        );
        if (Array.isArray(defRes?.records)) {
          playerDefenseRecords.value = defRes.records
            .filter((r: any) =>
              isRecordInMatchDay(r.created, selectedMatchDay.value),
            )
            .map((r: any) => ({
              attackType: 0,
              winFlag: r.isWin === true, // 严格事实（isWin 为记录归属者=防守方视角）：true=我方守军防守成功
              timestamp: r.created,
              difficulty: r.difficulty,
              nodeId: r.nodeId,
              targetRoleInfo: {
                roleId: r.roleId,
                name: r.name, // 来袭的敌方对手
                legionName:
                  r.legionName ||
                  battleInfo.value?.opponentClub?.name ||
                  "敌方俱乐部",
                headImg: r.headImg || "/icons/xiaoyugan.png",
                power: r.power,
              },
            }));
        }
      }
    }
  } catch (e) {
    console.warn("拉取对战战报流水异常:", e);
  } finally {
    modalLoading.value = false;
  }
};

/**
 * 导出全景长图
 */
const handleExportImage = async () => {
  if (!exportDom.value) return;
  exporting.value = true;
  message.loading("正在渲染长图，请稍候...");

  try {
    const canvas = await html2canvas(exportDom.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f5f7fa",
      logging: false,
    });

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `营地挑战阵容_${
      selectedSide.value === "opponent" ? "敌方" : "我方"
    }.png`;
    link.click();
    message.success("长图导出成功！");
  } catch (err: any) {
    message.error(`导出长图失败: ${err.message}`);
  } finally {
    exporting.value = false;
  }
};

// 表格列定义 (包含核心真实 1~5 号位布阵卡片列)
const columns = [
  {
    title: "序号",
    key: "index",
    width: 60,
    align: "center",
    render: (_: any, index: number) => index + 1,
  },
  {
    title: "头像",
    key: "headImg",
    width: 64,
    align: "center",
    render: (row: any) =>
      h(NAvatar, {
        round: true,
        size: 38,
        src: row.headImg,
      }),
  },
  {
    title: "ID",
    key: "id",
    width: 100,
    align: "center",
    render: (row: any) => h("span", { class: "member-id-cell" }, row.id),
  },
  {
    title: "角色名称",
    key: "name",
    width: 130,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        {
          style: { cursor: "pointer", color: "#1890ff", fontWeight: "600" },
          onClick: () => openDuelModal(row),
        },
        row.name,
      ),
  },
  {
    title: "真实战力",
    key: "power",
    width: 100,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { fontWeight: "600", color: "#fa8c16" } },
        formatPower(row.power),
      ),
  },
  {
    title: "红淬",
    key: "redQuench",
    width: 70,
    align: "center",
    render: (row: any) =>
      h(
        "span",
        { style: { color: "#ff4d4f", fontWeight: "700" } },
        row.redQuench,
      ),
  },
  {
    title: "珍卡",
    key: "legacy",
    width: 80,
    align: "center",
    render: (row: any) => {
      const cfg = legacycolor[row.legacy];
      if (!row.legacy || !cfg) return h("span", { class: "text-muted" }, "—");
      return h(
        NTag,
        {
          size: "small",
          bordered: false,
          color: { color: cfg.value, textColor: "#fff" },
        },
        { default: () => cfg.name },
      );
    },
  },
  {
    title: "玩具",
    key: "toyName",
    width: 100,
    align: "center",
    render: (row: any) => h("span", { class: "toy-cell" }, row.toyName || "—"),
  },
  {
    title: "真实营地挑战布阵 (1~5号站位)",
    key: "lineup",
    width: 620,
    align: "left",
    render: (row: any) => {
      const heroes = row.heroList || [];
      if (!heroes.length)
        return h("span", { class: "text-muted" }, "暂无出战布阵");

      // 横向并排渲染 5 张真实站位小卡片
      const cards = heroes.map((hero: any) => {
        const titleLine = [
          h("span", { class: "hero-slot-badge" }, `${hero.slotIndex}号位`),
          h("span", { class: "hero-name" }, hero.heroName),
          h("span", { class: "hero-red" }, `(${hero.red}红)`),
        ];

        if (hero.HolyBeast) {
          titleLine.push(h("span", { class: "hb-badge" }, `圣${hero.HBlevel}`));
        }

        const fishName = hero.PearlInfo?.FishInfo?.name || "";
        const pearlParts = [];
        if (fishName)
          pearlParts.push(h("span", { class: "fish-name" }, fishName));

        return h("div", { class: "hero-lineup-card" }, [
          h("div", { class: "hero-card-header" }, titleLine),
          h(
            "div",
            { class: "hero-card-pearl" },
            pearlParts.length
              ? pearlParts
              : h("span", { class: "text-muted" }, "专属鱼灵"),
          ),
        ]);
      });

      return h("div", { class: "lineup-cards-wrapper" }, cards);
    },
  },
  {
    title: "阵容流派",
    key: "lineupType",
    width: 100,
    align: "center",
    render: (row: any) => {
      const type = row.lineupType || "其他";
      const rule = LINEUP_RULES.find((r) => r.name === type);
      const colorProps = rule?.colorProps || {
        color: "#e8e8e8",
        textColor: "#444",
      };
      return h(
        NTag,
        { size: "small", bordered: false, color: colorProps },
        { default: () => type },
      );
    },
  },
  {
    title: "操作",
    key: "action",
    width: 80,
    align: "center",
    render: (row: any) =>
      h(
        NButton,
        { size: "tiny", type: "primary", onClick: () => openDuelModal(row) },
        { default: () => "对战详情" },
      ),
  },
];

// 监听 Token 切换自动查询
watch(
  () => tokenStore.selectedToken?.id,
  (newId) => {
    if (newId) fetchCampChallengeData();
  },
);

onMounted(() => {
  if (tokenStore.selectedToken) {
    fetchCampChallengeData();
  }
});
</script>

<style scoped>
.camp-challenge-container {
  padding: 16px;
  background: var(--n-color);
  min-height: calc(100vh - 120px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--n-text-color);
}

.toolbar .right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 俱乐部 VS 阵营对比卡片 (参考蟠桃园) */
.header-section {
  margin-bottom: 16px;
}

.club-vs-container {
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  color: #fff;
}

.club-info {
  flex: 1;
  padding: 16px 20px;
  transition: all 0.3s;
}

.club-info.highlight-side {
  background: rgba(255, 255, 255, 0.05);
}

.club-details .club-id-text {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.club-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.club-server {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #3b82f6;
  color: #fff;
}

.club-name {
  font-size: 17px;
  font-weight: 700;
}

.club-power-text {
  font-size: 13px;
  color: #fbbf24;
  margin-bottom: 4px;
}

.club-announce-text {
  font-size: 12px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* VS 徽章 */
.vs-badge-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.2);
}

.vs-badge {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 2px;
}

.vs-v {
  color: #ef4444;
}

.vs-s {
  color: #3b82f6;
}

.rank-badge-text {
  margin-top: 4px;
}

/* 营地挑战周期与双维度统计面板（当周与当天） */
.camp-statistics-section {
  margin-bottom: 16px;
}

.stats-panels-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 960px) {
  .stats-panels-grid {
    grid-template-columns: 1fr;
  }
}

.stats-panel {
  background: var(--n-card-color, #ffffff);
  border: 1px solid var(--n-border-color, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
}

.stats-panel:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.weekly-panel {
  border-top: 3px solid #3b82f6;
}

.daily-panel {
  border-top: 3px solid #ef4444;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 18px;
  color: #3b82f6;
}

.panel-icon.flame {
  color: #ef4444;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--n-text-color);
}

.panel-subtitle {
  font-size: 12px;
  color: #64748b;
}

.opp-highlight {
  font-weight: 700;
  color: #ef4444;
}

.stat-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 600px) {
  .stat-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  background: var(--n-color-embedded, rgba(0, 0, 0, 0.02));
  border: 1px solid var(--n-border-color, #f1f5f9);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.metric-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--n-text-color);
}

.metric-value.highlight {
  color: #6366f1;
}

.metric-value.personal-score {
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-value.win-stat {
  color: #10b981;
}

.metric-value.dan-value {
  font-size: 12px;
  color: #3b82f6;
}

.metric-value.progress-value {
  font-size: 12px;
  color: #ef4444;
}

.metric-unit {
  font-size: 11px;
  font-weight: normal;
  color: #94a3b8;
  margin-left: 2px;
}

.sub-rate {
  font-size: 11px;
  font-weight: normal;
  color: #64748b;
  margin-left: 2px;
}

.level-tag {
  font-size: 10px;
}

/* 本周排位赛程速览卡片 */
.weekly-schedule-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--n-color-embedded, rgba(0, 0, 0, 0.02));
  padding: 8px 10px;
  border-radius: 8px;
}

.schedule-title {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.schedule-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.schedule-chip {
  flex: 1;
  min-width: 100px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  background: var(--n-card-color, #ffffff);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schedule-chip:hover {
  border-color: #3b82f6;
}

.schedule-chip.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.06);
}

.chip-day {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
}

.chip-opp-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-power {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
}

/* 敌方击破进度条 */
.defense-progress-box {
  background: var(--n-color-embedded, rgba(0, 0, 0, 0.02));
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

/* 阵容流派统计条 */
.lineup-summary-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.lineup-stats-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
}

.lineup-stats-tag {
  font-weight: 600;
}

/* 真实布阵 1~5 号位卡片 */
.lineup-cards-wrapper {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.hero-lineup-card {
  flex: 1;
  min-width: 110px;
  padding: 4px 6px;
  background: var(--n-card-color, rgba(0, 0, 0, 0.03));
  border: 1px solid var(--n-border-color, #e2e8f0);
  border-radius: 6px;
  font-size: 11px;
}

.hero-card-header {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.hero-slot-badge {
  font-size: 10px;
  padding: 1px 4px;
  background: #6366f1;
  color: #fff;
  border-radius: 3px;
}

.hero-name {
  font-weight: 700;
  color: var(--n-text-color);
}

.hero-red {
  color: #ef4444;
  font-weight: 600;
}

.hb-badge {
  font-size: 10px;
  padding: 1px 4px;
  background: #f59e0b;
  color: #fff;
  border-radius: 3px;
}

.hero-card-pearl {
  margin-top: 2px;
  font-size: 10px;
  color: #059669;
}

.text-muted {
  color: #94a3b8;
}

.loading-state,
.empty-state {
  padding: 60px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 成员对战战报流水模态框 */
.duel-content {
  padding: 10px;
}

.duel-player-header {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 16px;
}

.duel-player-info h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.duel-player-info p {
  margin: 2px 0;
  font-size: 12px;
  color: #64748b;
}

/* 战报明细选项卡与交战流水列表 */
.player-modal-tabs {
  margin-top: 10px;
}

.battle-records-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.personal-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 6px;
}

.summary-box {
  background: var(--n-card-color, rgba(0, 0, 0, 0.03));
  border: 1px solid var(--n-border-color, #e2e8f0);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.summary-box .s-label {
  font-size: 11px;
  color: #64748b;
}

.summary-box .s-val {
  font-size: 16px;
  font-weight: 700;
}

.highlight-text {
  color: #6366f1;
}

.combat-list-container {
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.combat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  background: var(--n-card-color, rgba(0, 0, 0, 0.01));
  transition: all 0.2s ease;
}

.combat-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.combat-item.combat-win {
  border-left: 4px solid #10b981;
  background: rgba(16, 185, 129, 0.03);
}

.combat-item.combat-loss {
  border-left: 4px solid #ef4444;
  background: rgba(239, 68, 68, 0.03);
}

.combat-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 170px;
}

.combat-type-tag {
  font-weight: 600;
}

.combat-time {
  font-size: 12px;
  color: #94a3b8;
}

.combat-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  margin: 0 12px;
}

.vs-text {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.enemy-avatar {
  flex-shrink: 0;
}

.enemy-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
}

.enemy-power {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
}

.combat-right {
  display: flex;
  align-items: center;
}

.empty-combat-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.date-picker-input {
  width: 130px;
}

/* ================= 4 大战术视图 Tab 与容器 ================= */
.view-tabs-container {
  margin-bottom: 16px;
}

.camp-main-tabs :deep(.n-tabs-rail) {
  padding: 4px;
  border-radius: 8px;
}

.tab-item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}

.views-content-wrapper {
  margin-top: 8px;
}

/* ================= 视图 1：30 人据点沙盘与卡片网格 ================= */
.battle-map-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.map-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--n-card-color, #ffffff);
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  flex-wrap: wrap;
  gap: 12px;
}

.map-side-indicator {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.indicator-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--n-text-color);
}

.indicator-sub {
  font-size: 12px;
  color: #64748b;
}

.map-metrics-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-filters-group {
  display: flex;
  align-items: center;
}

.map-layout-note {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.map-scroll-hint {
  color: #2563eb;
}

.camp-regions-scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  padding-bottom: 6px;
}

.camp-regions {
  display: flex;
  flex-direction: column;
  min-width: 1100px;
  gap: 14px;
}

.camp-region {
  --region-accent: #2563eb;
  --region-tint: #eff6ff;
  border: 1px solid var(--n-border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--n-card-color, #fff);
  padding: 12px;
}

.camp-region-middle {
  --region-accent: #7c3aed;
  --region-tint: #f5f3ff;
}

.camp-region-lower {
  --region-accent: #0f766e;
  --region-tint: #f0fdfa;
}

.region-title,
.region-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.region-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.region-title,
.region-summary {
  white-space: nowrap;
}

.region-summary {
  justify-self: end;
}

.region-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.region-defeated-count,
.region-attacks-needed {
  padding: 3px 6px;
  border-radius: 5px;
}

.region-defeated-count {
  background: #f1f5f9;
  color: #475569;
}

.region-defeated-count.is-complete,
.region-attacks-needed.is-defeat {
  background: #fee2e2;
  color: #991b1b;
}

.region-attacks-needed.is-hard {
  background: #f3e8ff;
  color: #6b21a8;
}

.region-attacks-needed.is-inferno {
  background: #fff1f2;
  color: #be123c;
}

.region-progress-pending {
  color: #64748b;
}

.region-number {
  border-radius: 6px;
  background: var(--region-tint);
  color: var(--region-accent);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}

.region-name {
  color: var(--n-text-color, #334155);
  font-size: 16px;
  font-weight: 700;
}

.region-range,
.region-summary {
  color: #64748b;
  font-size: 12px;
}

.region-summary strong {
  color: var(--region-accent);
  font-size: 14px;
}

.fortress-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-rows: minmax(140px, 1fr);
  gap: 10px;
}

.fortress-card {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  background: var(--n-card-color, #ffffff);
  border-radius: 10px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  padding: 9px 10px 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 7px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.fortress-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.fortress-card:focus-visible,
.camp-regions-scroll:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.fortress-card.is-muted {
  opacity: 0.4;
}

.fortress-card.is-muted:hover,
.fortress-card.is-muted:focus-visible {
  opacity: 0.85;
}

.fortress-card.is-empty,
.fortress-card.is-empty:hover {
  background: rgba(148, 163, 184, 0.05);
  border: 1px dashed #cbd5e1;
  box-shadow: none;
  cursor: default;
  transform: none;
}

.empty-slot-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-bottom: 10px;
  color: #94a3b8;
  font-size: 13px;
}

.empty-slot-symbol {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px dashed #cbd5e1;
  border-radius: 50%;
  font-size: 16px;
}

.fortress-card.is-unknown .empty-slot-content {
  color: #b45309;
}

.fortress-card.is-defeated {
  background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
  border-color: #f87171;
}

.fortress-card.is-defeated .slot-badge {
  background: rgba(185, 28, 28, 0.1);
  color: #991b1b;
}

.fortress-card.is-defeated .member-name {
  color: #7f1d1d;
}

.fortress-card.is-defeated .card-footer-bar {
  border-top-color: #fca5a5;
  color: #991b1b;
}

.fortress-card.is-alive {
  background: linear-gradient(
    180deg,
    rgba(16, 185, 129, 0.04) 0%,
    rgba(16, 185, 129, 0.01) 100%
  );
  border-color: rgba(16, 185, 129, 0.3);
}

.fortress-card.is-mirror {
  border-style: dashed;
}

.card-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.slot-badge {
  font-size: 12px;
  line-height: 18px;
  font-weight: 700;
  color: #64748b;
  background: rgba(100, 116, 139, 0.1);
  padding: 1px 6px;
  border-radius: 6px;
}

.stamp-wrapper {
  display: flex;
  align-items: center;
}

.stamp {
  font-size: 11px;
  line-height: 16px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.stamp-defeated {
  color: #fff;
  background: #dc2626;
  border: 1px solid #b91c1c;
}

.stamp-alive {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid #10b981;
}

.card-body {
  display: flex;
  align-items: center;
  gap: 9px;
}

.avatar-box {
  position: relative;
  flex-shrink: 0;
}

.red-quench-tag {
  position: absolute;
  bottom: -4px;
  right: -5px;
  height: 16px;
  font-size: 10px;
  font-weight: 800;
  background: #ff4d4f;
  color: #fff;
  padding: 0 4px;
}

.red-quench-tag.is-pending {
  background: #d97706;
}

.member-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.member-name {
  font-size: 14px;
  line-height: 19px;
  font-weight: 700;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 1px;
}

.member-power {
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  color: #b45309;
  margin-bottom: 3px;
}

.member-lineup {
  display: flex;
  gap: 4px;
}

.member-lineup :deep(.n-tag) {
  flex-shrink: 0;
}

.member-lineup .lineup-tag {
  min-width: 0;
  flex-shrink: 1;
}

.lineup-tag :deep(.n-tag__content) {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin: auto -10px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0 0 9px 9px;
  padding: 6px 8px;
  font-size: 11px;
  line-height: 16px;
}

.combat-stat-text {
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.combat-stat-text .num {
  font-weight: 700;
  color: #1e293b;
}

.combat-stat-text .num.error {
  color: #dc2626;
}

.card-action-hint {
  flex-shrink: 0;
  color: #2563eb;
  font-weight: 600;
}

.card-footer-bar.is-weakened {
  background: #f3e8ff;
  border-top-color: #e9d5ff;
  color: #6b21a8;
}

.card-footer-bar.is-critical {
  background: #fee2e2;
  border-top-color: #fecaca;
  color: #991b1b;
}

.card-footer-bar:is(.is-weakened, .is-critical)
  :is(.combat-stat-text, .num, .card-action-hint),
.fortress-card.is-defeated
  .card-footer-bar
  :is(.combat-stat-text, .num, .card-action-hint) {
  color: inherit;
}

/* ================= 视图 2：今日公会对战详细 (催刀督战) ================= */
.today-details-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.today-versus-score-banner {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%);
  border-radius: 12px;
  padding: 18px 24px;
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  gap: 14px;
}

.banner-sides-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.side-score-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.side-score-box .club-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.score-num {
  font-size: 38px;
  font-weight: 900;
  font-family: "DIN Alternate", "Arial Black", sans-serif;
}

.score-num.own-text {
  color: #10b981;
}

.score-num.oppo-text {
  color: #f43f5e;
}

.score-label {
  font-size: 13px;
  color: #94a3b8;
}

.combat-rate-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 12px;
  border-radius: 20px;
  margin: 2px 0;
}

.combat-rate-display .rate-num {
  font-size: 16px;
  font-weight: 800;
  color: #38bdf8;
}

.combat-rate-display.oppo-rate .rate-num {
  color: #fb7185;
}

.combat-rate-display .rate-label {
  font-size: 12px;
  color: #e2e8f0;
}

.combat-rate-display .rate-detail {
  font-size: 11px;
  color: #94a3b8;
}

.sub-stat {
  font-size: 12px;
  color: #cbd5e1;
}

.vs-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0 20px;
}

.vs-text-styled {
  font-size: 26px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 2px;
  color: #f59e0b;
}

.score-gap-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
}

.score-gap-badge.lead {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid #10b981;
}

.score-gap-badge.lag {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid #ef4444;
}

.combat-comparison-bar-container {
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comparison-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.bar-left-text {
  color: #38bdf8;
  font-weight: 700;
}

.bar-center-title {
  color: #cbd5e1;
  font-size: 11px;
}

.bar-right-text {
  color: #fb7185;
  font-weight: 700;
}

.comparison-progress-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.comparison-fill-left {
  background: linear-gradient(90deg, #38bdf8, #10b981);
  height: 100%;
  transition: width 0.4s ease;
}

.comparison-fill-right {
  background: linear-gradient(90deg, #f43f5e, #fb7185);
  height: 100%;
  margin-left: auto;
  transition: width 0.4s ease;
}

.attendance-control-panel {
  background: var(--n-card-color, #ffffff);
  border-radius: 10px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  padding: 14px 18px;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.att-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.att-icon {
  color: #f59e0b;
  font-size: 20px;
}

.att-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--n-text-color);
}

.attendance-body .unattacked-preview-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.box-label {
  font-size: 13px;
  font-weight: 600;
  color: #d97706;
}

.box-label.error-label {
  color: #ef4444;
}

.box-label.warning-label {
  color: #d97706;
}

.unattacked-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-reminder-tag {
  cursor: pointer;
  transition: transform 0.15s;
}

.member-reminder-tag:hover {
  transform: scale(1.05);
}

.attendance-table-scroll {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.attendance-members-table {
  --attendance-accent: #ef4444;
  --attendance-hover: rgba(239, 68, 68, 0.08);
  width: 100%;
  min-width: 1080px;
  table-layout: fixed;
  border-collapse: collapse;
}

.attendance-members-table.is-incomplete {
  --attendance-accent: #b45309;
  --attendance-hover: rgba(245, 158, 11, 0.08);
}

.attendance-members-table td {
  padding: 0;
  border: 1px solid var(--n-border-color, #e2e8f0);
  vertical-align: top;
}

.attendance-member-button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 2px 8px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  color: var(--n-text-color, #334155);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}

.attendance-member-button:hover,
.attendance-member-button:focus-visible {
  background: var(--attendance-hover);
}

.attendance-member-button:focus-visible {
  outline: 2px solid var(--attendance-accent);
  outline-offset: -2px;
}

.attendance-member-name {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attendance-member-power,
.attendance-member-status {
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.attendance-member-power {
  color: var(--n-text-color-3, #64748b);
}

.attendance-member-status {
  color: var(--attendance-accent);
}

.attendance-member-club-power {
  color: var(--n-text-color-3, #64748b);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  text-align: right;
}

.table-card {
  background: var(--n-card-color, #ffffff);
  border-radius: 10px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  padding: 14px 16px;
}

.table-header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 15px;
  font-weight: 700;
  color: var(--n-text-color);
  margin-bottom: 12px;
}

.table-header-title .header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.table-header-title .sub-hint {
  font-size: 12px;
  color: #64748b;
  font-weight: normal;
}

.table-header-title .header-right-sort {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: normal;
  color: #64748b;
}

/* ================= 视图 3：当周全员战绩 & 排位天梯 ================= */
.week-roster-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-rank-section {
  background: var(--n-card-color, #ffffff);
  border-radius: 10px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  padding: 14px 18px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--n-text-color);
  margin-bottom: 14px;
}

.group-rank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.group-rank-card {
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid var(--n-border-color, #e2e8f0);
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  transition: all 0.2s;
}

.group-rank-card.is-own-club {
  border: 2px solid #10b981;
  background: rgba(16, 185, 129, 0.04);
}

.group-rank-card.rank-1 {
  border-left: 4px solid #f59e0b;
}

.group-rank-card.rank-2 {
  border-left: 4px solid #94a3b8;
}

.group-rank-card.rank-3 {
  border-left: 4px solid #b45309;
}

.rank-badge-num {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.club-main-info .club-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.club-main-info .club-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--n-text-color);
}

.club-main-info .server-tag {
  font-size: 11px;
  color: #94a3b8;
}

.club-rank-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 4px;
}

.club-rank-score .score-val {
  font-size: 22px;
  font-weight: 800;
  color: #6366f1;
}

.club-rank-score .score-unit {
  font-size: 12px;
  color: #94a3b8;
}
</style>
