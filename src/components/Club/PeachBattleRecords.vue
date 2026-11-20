<template>
  <div class="records-container">
    <!-- 头部信息区 -->
    <div class="header-section">
      <div class="header-left">
        <img
          src="/icons/1733492491706152.png"
          alt="蟠桃图标"
          class="header-icon"
        />
        <div class="header-title">
          <h2>蟠桃园战绩</h2>
          <p>查看蟠桃园对战详细数据</p>
        </div>
      </div>

      <!-- 数据统计区 -->
      <div class="stats-section" v-if="battleRecords && battleRecords.ownClub">
        <div class="stat-item">
          <span class="stat-label">查询日期:</span>
          <n-tag type="info">{{ queryDate }}</n-tag>
        </div>
      </div>
    </div>

    <!-- 功能操作区 -->
    <div class="function-section">
      <div class="function-left">
        <div class="export-options">
          <NRadioGroup v-model:value="currentStyle" size="small">
            <NRadioButton value="default">默认</NRadioButton>
            <NRadioButton value="style1">样式一</NRadioButton>
            <NRadioButton value="style2">样式二</NRadioButton>
          </NRadioGroup>
        </div>
      </div>

      <div class="function-right">
        <a-date-picker
          v-model:value="queryDate"
          @change="fetchBattleRecordsByDate"
          value-format="YYYY/MM/DD"
          :disabled-date="disabledDate"
          :default-value="queryDate"
          format="YYYY/MM/DD"
        />
        <n-button
          size="small"
          :disabled="loading"
          @click="handleRefresh"
          class="action-btn refresh-btn"
        >
          <template #icon>
            <n-icon>
              <Refresh />
            </n-icon>
          </template>
          刷新
        </n-button>
        <n-button
          type="primary"
          size="small"
          :disabled="!battleRecords || loading"
          @click="handleExport"
          class="action-btn export-btn"
        >
          <template #icon>
            <n-icon>
              <Copy />
            </n-icon>
          </template>
          导出
        </n-button>
      </div>
    </div>

    <div class="battle-records-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <n-spin size="large">
          <template #description>正在加载战绩数据...</template>
        </n-spin>
      </div>

      <!-- 战绩列表 -->
      <div
        v-else-if="
          battleRecords && battleRecords.ownClub && battleRecords.opponentClub
        "
        ref="exportDom"
        class="records-wrapper"
      >
        <div v-if="currentStyle === 'default'" class="style-default">
          <!-- 头部对战信息 -->
          <div class="battle-header">
            <h2>
              {{ queryDate }} {{ battleRecords.ownClub.name }} VS
              {{ battleRecords.opponentClub.name }} 蟠桃大会对战战绩
            </h2>
            <div class="club-info">
              <div class="club-side own">
                <img
                  v-if="battleRecords.ownClub.logo"
                  :src="battleRecords.ownClub.logo"
                  :alt="battleRecords.ownClub.name"
                  class="club-logo"
                />
                <div class="club-name">
                  {{ battleRecords.ownClub.serverId }}服
                  {{ battleRecords.ownClub.name }}
                </div>
                <div class="club-id">ID: {{ battleRecords.ownClub.id }}</div>
                <div class="club-power">
                  {{ battleRecords.ownClub.memberCount }}人 |
                  {{ battleRecords.ownClub.quenchNum }}红 |
                  {{ formatPower(battleRecords.ownClub.totalPower) }}
                </div>
              </div>
              <div class="vs">VS</div>
              <div class="club-side opponent">
                <img
                  v-if="battleRecords.opponentClub.logo"
                  :src="battleRecords.opponentClub.logo"
                  :alt="battleRecords.opponentClub.name"
                  class="club-logo"
                />
                <div class="club-name">
                  {{ battleRecords.opponentClub.serverId }}服
                  {{ battleRecords.opponentClub.name }}
                </div>
                <div class="club-id">
                  ID: {{ battleRecords.opponentClub.id }}
                </div>
                <div class="club-power">
                  {{ battleRecords.opponentClub.memberCount }}人 |
                  {{ battleRecords.opponentClub.quenchNum }}红 |
                  {{ formatPower(battleRecords.opponentClub.totalPower) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 总体数据统计 -->
          <div class="overall-stats">
            <div class="stats-side own">
              <div class="stats-title">我方总体数据</div>
              <div class="stats-grid">
                <div class="stat-item stat-kills">
                  <div class="stat-label">总击杀</div>
                  <div class="stat-value">
                    {{ battleRecords.ownClub.totalKills || 0 }}
                  </div>
                </div>
                <div class="stat-item stat-revives">
                  <div class="stat-label">总复活</div>
                  <div class="stat-value">
                    {{ battleRecords.ownClub.totalRevives || 0 }}
                  </div>
                </div>
                <div class="stat-item stat-kd">
                  <div class="stat-label">总K/D</div>
                  <div class="stat-value">
                    {{ battleRecords.ownClub.totalKD || 0 }}
                  </div>
                </div>
              </div>
            </div>
            <div class="stats-side opponent">
              <div class="stats-title">敌方总体数据</div>
              <div class="stats-grid">
                <div class="stat-item stat-kills">
                  <div class="stat-label">总击杀</div>
                  <div class="stat-value">
                    {{ battleRecords.opponentClub.totalKills || 0 }}
                  </div>
                </div>
                <div class="stat-item stat-revives">
                  <div class="stat-label">总复活</div>
                  <div class="stat-value">
                    {{ battleRecords.opponentClub.totalRevives || 0 }}
                  </div>
                </div>
                <div class="stat-item stat-kd">
                  <div class="stat-label">总K/D</div>
                  <div class="stat-value">
                    {{ battleRecords.opponentClub.totalKD || 0 }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 各种榜单 -->
          <div class="battle-rankings">
            <!-- 击杀榜 -->
            <div class="ranking-card">
              <div class="ranking-title">击杀榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">我方 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.killRank.slice(0, 3)"
                    :key="playerIndex"
                    class="ranking-item"
                  >
                    <div class="rank-number">{{ playerIndex + 1 }}</div>
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                    <span class="player-name">{{ player.roleInfo.name }}</span>
                    <span class="player-value">{{ player.killCnt || 0 }}</span>
                  </div>
                </div>
                <div class="ranking-side opponent">
                  <div class="ranking-subtitle">敌方 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.killRank.slice(0, 3)"
                    :key="playerIndex"
                    class="ranking-item"
                  >
                    <div class="rank-number">{{ playerIndex + 1 }}</div>
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                    <span class="player-name">{{ player.roleInfo.name }}</span>
                    <span class="player-value">{{ player.killCnt || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- K/D榜 -->
            <div class="ranking-card">
              <div class="ranking-title">K/D榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">我方 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.kdRank.slice(0, 3)"
                    :key="playerIndex"
                    class="ranking-item"
                  >
                    <div class="rank-number">{{ playerIndex + 1 }}</div>
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                    <span class="player-name">{{ player.roleInfo.name }}</span>
                    <span class="player-value">{{ player.kd || 0 }}</span>
                  </div>
                </div>
                <div class="ranking-side opponent">
                  <div class="ranking-subtitle">敌方 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.kdRank.slice(0, 3)"
                    :key="playerIndex"
                    class="ranking-item"
                  >
                    <div class="rank-number">{{ playerIndex + 1 }}</div>
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                    <span class="player-name">{{ player.roleInfo.name }}</span>
                    <span class="player-value">{{ player.kd || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 复活榜 -->
            <div class="ranking-card">
              <div class="ranking-title">复活榜</div>
              <div class="ranking-content">
                <div class="ranking-side own">
                  <div class="ranking-subtitle">我方 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.reviveRank.slice(0, 3)"
                    :key="playerIndex"
                    class="ranking-item"
                  >
                    <div class="rank-number">{{ playerIndex + 1 }}</div>
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                    <span class="player-name">{{ player.roleInfo.name }}</span>
                    <span class="player-value">{{
                      player.reviveCnt || 0
                    }}</span>
                  </div>
                </div>
                <div class="ranking-side opponent">
                  <div class="ranking-subtitle">敌方 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.reviveRank.slice(0, 3)"
                    :key="playerIndex"
                    class="ranking-item"
                  >
                    <div class="rank-number">{{ playerIndex + 1 }}</div>
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                    <span class="player-name">{{ player.roleInfo.name }}</span>
                    <span class="player-value">{{
                      player.reviveCnt || 0
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 战神榜 -->
          <div class="god-rankings">
            <div class="god-ranking own">
              <div class="god-ranking-title">我方战神榜</div>
              <div class="god-ranking-content">
                <div class="god-ranking-header">
                  <div class="god-rank-number">排名</div>
                  <div class="header-avatar"></div>
                  <div class="header-player">玩家</div>
                  <div class="header-stat">击杀</div>
                  <div class="header-stat">连杀</div>
                  <div class="header-stat">抢船</div>
                  <div class="header-stat">复活</div>
                  <div class="header-stat">K/D</div>
                </div>
                <div
                  v-for="(player, playerIndex) in battleRecords.ownClub.godRank"
                  :key="playerIndex"
                  class="god-ranking-item"
                >
                  <div class="god-rank-number">{{ playerIndex + 1 }}</div>
                  <div class="player-avatar-cell">
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                  </div>
                  <span class="header-player">{{ player.roleInfo.name }}</span>
                  <span class="player-stat">{{ player.killCnt || 0 }}</span>
                  <span class="player-stat">{{ player.mCKCnt || 0 }}</span>
                  <span class="player-stat">{{ player.carCnt || 0 }}</span>
                  <span class="player-stat">{{ player.reviveCnt || 0 }}</span>
                  <span class="player-stat">{{ player.kd || 0 }}</span>
                </div>
              </div>
            </div>
            <div class="god-ranking opponent">
              <div class="god-ranking-title">敌方战神榜</div>
              <div class="god-ranking-content">
                <div class="god-ranking-header">
                  <div class="god-rank-number">排名</div>
                  <div class="header-avatar"></div>
                  <div class="header-player">玩家</div>
                  <div class="header-stat">击杀</div>
                  <div class="header-stat">连杀</div>
                  <div class="header-stat">抢船</div>
                  <div class="header-stat">复活</div>
                  <div class="header-stat">K/D</div>
                </div>
                <div
                  v-for="(player, playerIndex) in battleRecords.opponentClub
                    .godRank"
                  :key="playerIndex"
                  class="god-ranking-item"
                >
                  <div class="god-rank-number">{{ playerIndex + 1 }}</div>
                  <div class="player-avatar-cell">
                    <img
                      v-if="player.roleInfo.headImg"
                      :src="player.roleInfo.headImg"
                      :alt="player.roleInfo.name"
                      class="player-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="player-avatar-placeholder">
                      {{ player.roleInfo.name?.charAt(0) || "?" }}
                    </div>
                  </div>
                  <span class="header-player">{{ player.roleInfo.name }}</span>
                  <span class="player-stat">{{ player.killCnt || 0 }}</span>
                  <span class="player-stat">{{ player.mCKCnt || 0 }}</span>
                  <span class="player-stat">{{ player.carCnt || 0 }}</span>
                  <span class="player-stat">{{ player.reviveCnt || 0 }}</span>
                  <span class="player-stat">{{ player.kd || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Style 1 -->
        <div v-if="currentStyle === 'style1'" class="style-1-wrapper">
          <div class="battle-header">
            <h2>
              {{ queryDate }} {{ battleRecords.ownClub.name }} VS
              {{ battleRecords.opponentClub.name }} 蟠桃大会对战战绩
            </h2>
            <div class="club-info">
              <div class="club-side own">
                <img
                  v-if="battleRecords.ownClub.logo"
                  :src="battleRecords.ownClub.logo"
                  :alt="battleRecords.ownClub.name"
                  class="club-logo"
                />
                <div class="club-name">
                  {{ battleRecords.ownClub.serverId }}服
                  {{ battleRecords.ownClub.name }}
                </div>
                <div class="club-id">ID: {{ battleRecords.ownClub.id }}</div>
                <div class="club-power">
                  {{ battleRecords.ownClub.memberCount }}人 |
                  {{ battleRecords.ownClub.quenchNum }}红 |
                  {{ formatPower(battleRecords.ownClub.totalPower) }}
                </div>
              </div>
              <div class="vs">VS</div>
              <div class="club-side opponent">
                <img
                  v-if="battleRecords.opponentClub.logo"
                  :src="battleRecords.opponentClub.logo"
                  :alt="battleRecords.opponentClub.name"
                  class="club-logo"
                />
                <div class="club-name">
                  {{ battleRecords.opponentClub.serverId }}服
                  {{ battleRecords.opponentClub.name }}
                </div>
                <div class="club-id">
                  ID: {{ battleRecords.opponentClub.id }}
                </div>
                <div class="club-power">
                  {{ battleRecords.opponentClub.memberCount }}人 |
                  {{ battleRecords.opponentClub.quenchNum }}红 |
                  {{ formatPower(battleRecords.opponentClub.totalPower) }}
                </div>
              </div>
            </div>
          </div>
          <div class="comparison-container">
            <!-- Own Club -->
            <div class="club-column own-column">
              <div class="style1-header own-header">
                <h3>{{ battleRecords.ownClub.name }}</h3>
              </div>
              <div class="style1-content">
                <!-- Summary -->
                <div class="style1-summary-block">
                  <div class="summary-card overall-card">
                    <div class="summary-title">总体统计</div>
                    <div class="overall-grid">
                      <div class="summary-item">
                        <span>总 K/D:</span>
                        <span>{{ battleRecords.ownClub.totalKD }}</span>
                      </div>
                      <div class="summary-item">
                        <span>总击杀:</span>
                        <span>{{ battleRecords.ownClub.totalKills }}</span>
                      </div>
                      <div class="summary-item">
                        <span>总复活:</span>
                        <span>{{ battleRecords.ownClub.totalRevives }}</span>
                      </div>
                      <div class="summary-item">
                        <span>人均击杀:</span>
                        <span>{{
                          (
                            battleRecords.ownClub.totalKills /
                            battleRecords.ownClub.memberCount
                          ).toFixed(1)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="style1-summary-row">
                  <div class="summary-card">
                    <div class="summary-title">击杀 Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.ownClub.killRank.slice(0, 3)"
                      :key="`kill-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.killCnt }}</span>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-title">KD Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.ownClub.kdRank.slice(0, 3)"
                      :key="`kd-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.kd }}</span>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-title">复活 Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.ownClub.reviveRank.slice(0, 3)"
                      :key="`revive-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.reviveCnt }}</span>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-title">连杀 Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.ownClub.killStreakRank.slice(0, 3)"
                      :key="`killstreak-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.mCKCnt }}</span>
                    </div>
                  </div>
                </div>

                <!-- Table -->
                <div class="style1-table-container">
                  <table class="style1-table">
                    <thead>
                      <tr>
                        <th class="col-rank">排名</th>
                        <th class="col-name">成员</th>
                        <th class="col-kill">击杀</th>
                        <th class="col-kill-streak">连杀</th>
                        <th class="col-car">抢船</th>
                        <th class="col-revive">复活</th>
                        <th class="col-kd">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(player, playerIndex) in battleRecords.ownClub
                          .killRank"
                        :key="playerIndex"
                      >
                        <td class="col-rank">
                          <div v-if="playerIndex < 3" class="rank-medal">
                            {{
                              playerIndex === 0
                                ? "🥇"
                                : playerIndex === 1
                                  ? "🥈"
                                  : "🥉"
                            }}
                          </div>
                          <span v-else>{{ playerIndex + 1 }}</span>
                        </td>
                        <td class="col-name">
                          <div class="player-info">
                            <img
                              v-if="player.roleInfo.headImg"
                              :src="player.roleInfo.headImg"
                              class="player-avatar-small"
                              @error="handleImageError"
                            />
                            <div v-else class="player-avatar-placeholder-small">
                              {{ player.roleInfo.name?.charAt(0) || "?" }}
                            </div>
                            <span>{{ player.roleInfo.name }}</span>
                          </div>
                        </td>
                        <td
                          class="col-kill"
                          :style="{
                            backgroundColor: getKillColor(player.killCnt),
                          }"
                        >
                          {{ player.killCnt || 0 }}
                        </td>
                        <td class="col-kill-streak">
                          {{ player.mCKCnt || 0 }}
                        </td>
                        <td class="col-car">{{ player.carCnt || 0 }}</td>
                        <td
                          class="col-revive"
                          :style="{
                            backgroundColor: getReviveColor(player.reviveCnt),
                          }"
                        >
                          {{ player.reviveCnt || 0 }}
                        </td>
                        <td class="col-kd">{{ player.kd }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!-- Summary -->
                <!-- Removed duplicate summary -->
              </div>
            </div>

            <!-- Opponent Club -->
            <div class="club-column opponent-column">
              <div class="style1-header opponent-header">
                <h3>{{ battleRecords.opponentClub.name }}</h3>
              </div>
              <div class="style1-content">
                <!-- Summary -->
                <div class="style1-summary-block">
                  <div class="summary-card overall-card">
                    <div class="summary-title">总体统计</div>
                    <div class="overall-grid">
                      <div class="summary-item">
                        <span>总 K/D:</span>
                        <span>{{ battleRecords.opponentClub.totalKD }}</span>
                      </div>
                      <div class="summary-item">
                        <span>总击杀:</span>
                        <span>{{ battleRecords.opponentClub.totalKills }}</span>
                      </div>
                      <div class="summary-item">
                        <span>总复活:</span>
                        <span>{{
                          battleRecords.opponentClub.totalRevives
                        }}</span>
                      </div>
                      <div class="summary-item">
                        <span>人均击杀:</span>
                        <span>{{
                          (
                            battleRecords.opponentClub.totalKills /
                            battleRecords.opponentClub.memberCount
                          ).toFixed(1)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="style1-summary-row">
                  <div class="summary-card">
                    <div class="summary-title">击杀 Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.opponentClub.killRank.slice(0, 3)"
                      :key="`kill-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.killCnt }}</span>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-title">KD Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.opponentClub.kdRank.slice(0, 3)"
                      :key="`kd-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.kd }}</span>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-title">复活 Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.opponentClub.reviveRank.slice(0, 3)"
                      :key="`revive-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.reviveCnt }}</span>
                    </div>
                  </div>

                  <div class="summary-card">
                    <div class="summary-title">连杀 Top3</div>
                    <div
                      v-for="(
                        player, playerIndex
                      ) in battleRecords.opponentClub.killStreakRank.slice(
                        0,
                        3,
                      )"
                      :key="`killstreak-${playerIndex}`"
                      class="top3-item"
                    >
                      <span class="top3-name">{{ player.roleInfo.name }}</span>
                      <span class="top3-value">{{ player.mCKCnt }}</span>
                    </div>
                  </div>
                </div>

                <!-- Table -->
                <div class="style1-table-container">
                  <table class="style1-table">
                    <thead>
                      <tr>
                        <th class="col-rank">排名</th>
                        <th class="col-name">成员</th>
                        <th class="col-kill">击杀</th>
                        <th class="col-kill-streak">连杀</th>
                        <th class="col-car">抢船</th>
                        <th class="col-revive">复活</th>
                        <th class="col-kd">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(player, playerIndex) in battleRecords
                          .opponentClub.killRank"
                        :key="playerIndex"
                      >
                        <td class="col-rank">
                          <div v-if="playerIndex < 3" class="rank-medal">
                            {{
                              playerIndex === 0
                                ? "🥇"
                                : playerIndex === 1
                                  ? "🥈"
                                  : "🥉"
                            }}
                          </div>
                          <span v-else>{{ playerIndex + 1 }}</span>
                        </td>
                        <td class="col-name">
                          <div class="player-info">
                            <img
                              v-if="player.roleInfo.headImg"
                              :src="player.roleInfo.headImg"
                              class="player-avatar-small"
                              @error="handleImageError"
                            />
                            <div v-else class="player-avatar-placeholder-small">
                              {{ player.roleInfo.name?.charAt(0) || "?" }}
                            </div>
                            <span>{{ player.roleInfo.name }}</span>
                          </div>
                        </td>
                        <td
                          class="col-kill"
                          :style="{
                            backgroundColor: getKillColor(player.killCnt),
                          }"
                        >
                          {{ player.killCnt || 0 }}
                        </td>
                        <td class="col-kill-streak">
                          {{ player.mCKCnt || 0 }}
                        </td>
                        <td class="col-car">{{ player.carCnt || 0 }}</td>
                        <td
                          class="col-revive"
                          :style="{
                            backgroundColor: getReviveColor(player.reviveCnt),
                          }"
                        >
                          {{ player.reviveCnt || 0 }}
                        </td>
                        <td class="col-kd">{{ player.kd }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!-- Summary -->
                <!-- Removed duplicate summary -->
              </div>
            </div>
          </div>
        </div>

        <!-- Style 2 -->
        <div v-if="currentStyle === 'style2'" class="style-2-wrapper">
          <div class="battle-header">
            <h2>
              {{ queryDate }} {{ battleRecords.ownClub.name }} VS
              {{ battleRecords.opponentClub.name }} 蟠桃大会对战战绩
            </h2>
            <div class="club-info">
              <div class="club-side own">
                <img
                  v-if="battleRecords.ownClub.logo"
                  :src="battleRecords.ownClub.logo"
                  :alt="battleRecords.ownClub.name"
                  class="club-logo"
                />
                <div class="club-name">
                  {{ battleRecords.ownClub.serverId }}服
                  {{ battleRecords.ownClub.name }}
                </div>
                <div class="club-id">ID: {{ battleRecords.ownClub.id }}</div>
                <div class="club-power">
                  {{ battleRecords.ownClub.memberCount }}人 |
                  {{ battleRecords.ownClub.quenchNum }}红 |
                  {{ formatPower(battleRecords.ownClub.totalPower) }}
                </div>
              </div>
              <div class="vs">VS</div>
              <div class="club-side opponent">
                <img
                  v-if="battleRecords.opponentClub.logo"
                  :src="battleRecords.opponentClub.logo"
                  :alt="battleRecords.opponentClub.name"
                  class="club-logo"
                />
                <div class="club-name">
                  {{ battleRecords.opponentClub.serverId }}服
                  {{ battleRecords.opponentClub.name }}
                </div>
                <div class="club-id">
                  ID: {{ battleRecords.opponentClub.id }}
                </div>
                <div class="club-power">
                  {{ battleRecords.opponentClub.memberCount }}人 |
                  {{ battleRecords.opponentClub.quenchNum }}红 |
                  {{ formatPower(battleRecords.opponentClub.totalPower) }}
                </div>
              </div>
            </div>
          </div>
          <div class="comparison-container">
            <!-- Own Club -->
            <div class="club-column own-column style-2">
              <div class="style2-header">
                <div class="style2-title">
                  <span class="trophy-icon">🏆</span>
                  <div class="title-text">
                    <h2>{{ battleRecords.ownClub.name }}</h2>
                    <div class="date-text">我方战绩</div>
                  </div>
                </div>
              </div>
              <!-- Stats -->
              <div class="style2-dashboard">
                <div class="dashboard-stats">
                  <div class="stat-card-row">
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">总 K/D</div>
                      <div class="stat-value-mini">
                        {{ battleRecords.ownClub.totalKD }}
                      </div>
                    </div>
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">总击杀</div>
                      <div class="stat-value-mini danger-text">
                        {{ battleRecords.ownClub.totalKills }}
                      </div>
                    </div>
                  </div>
                  <div class="stat-card-row">
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">总复活</div>
                      <div class="stat-value-mini warning-text">
                        {{ battleRecords.ownClub.totalRevives }}
                      </div>
                    </div>
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">人均击杀</div>
                      <div class="stat-value-mini purple-text">
                        {{
                          (
                            battleRecords.ownClub.totalKills /
                            battleRecords.ownClub.memberCount
                          ).toFixed(1)
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rankings -->
              <div class="style2-rankings-row">
                <div class="summary-card">
                  <div class="summary-title">击杀 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.killRank.slice(0, 3)"
                    :key="`kill-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.killCnt }}</span>
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-title">KD Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.kdRank.slice(0, 3)"
                    :key="`kd-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.kd }}</span>
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-title">复活 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.reviveRank.slice(0, 3)"
                    :key="`revive-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.reviveCnt }}</span>
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-title">连杀 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.ownClub.killStreakRank.slice(0, 3)"
                    :key="`killstreak-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.mCKCnt }}</span>
                  </div>
                </div>
              </div>

              <!-- Table -->
              <div class="style2-table-wrapper">
                <table class="style2-table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>成员</th>
                      <th>击杀</th>
                      <th>连杀</th>
                      <th>抢船</th>
                      <th>复活</th>
                      <th>K/D</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(player, playerIndex) in battleRecords.ownClub
                        .killRank"
                      :key="playerIndex"
                    >
                      <td>
                        <div v-if="playerIndex < 3" class="medal-icon">
                          {{
                            playerIndex === 0
                              ? "🥇"
                              : playerIndex === 1
                                ? "🥈"
                                : "🥉"
                          }}
                        </div>
                        <div v-else class="rank-num-plain">
                          {{ playerIndex + 1 }}
                        </div>
                      </td>
                      <td>
                        <div class="player-cell">
                          <img
                            v-if="player.roleInfo.headImg"
                            :src="player.roleInfo.headImg"
                            class="avatar-xs"
                          />
                          <div v-else class="avatar-placeholder-xs">
                            {{ player.roleInfo.name?.charAt(0) || "?" }}
                          </div>
                          <span class="player-name-s2">{{
                            player.roleInfo.name
                          }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="bar-cell">
                          <div class="bar-val red">{{ player.killCnt }}</div>
                          <div class="progress-bg">
                            <div
                              class="progress-fill red"
                              :style="{
                                width: `${getPercent(player.killCnt, getMaxKills(battleRecords.ownClub))}%`,
                              }"
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>{{ player.mCKCnt || 0 }}</td>
                      <td>{{ player.carCnt || 0 }}</td>
                      <td>{{ player.reviveCnt }}</td>
                      <td class="kd-val">{{ player.kd }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Opponent Club -->
            <div class="club-column opponent-column style-2">
              <div class="style2-header">
                <div class="style2-title">
                  <span class="trophy-icon">🏆</span>
                  <div class="title-text">
                    <h2>{{ battleRecords.opponentClub.name }}</h2>
                    <div class="date-text">敌方战绩</div>
                  </div>
                </div>
              </div>
              <!-- Stats -->
              <div class="style2-dashboard">
                <div class="dashboard-stats">
                  <div class="stat-card-row">
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">总 K/D</div>
                      <div class="stat-value-mini">
                        {{ battleRecords.opponentClub.totalKD }}
                      </div>
                    </div>
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">总击杀</div>
                      <div class="stat-value-mini danger-text">
                        {{ battleRecords.opponentClub.totalKills }}
                      </div>
                    </div>
                  </div>
                  <div class="stat-card-row">
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">总复活</div>
                      <div class="stat-value-mini warning-text">
                        {{ battleRecords.opponentClub.totalRevives }}
                      </div>
                    </div>
                    <div class="stat-card-mini">
                      <div class="stat-label-mini">人均击杀</div>
                      <div class="stat-value-mini purple-text">
                        {{
                          (
                            battleRecords.opponentClub.totalKills /
                            battleRecords.opponentClub.memberCount
                          ).toFixed(1)
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rankings -->
              <div class="style2-rankings-row">
                <div class="summary-card">
                  <div class="summary-title">击杀 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.killRank.slice(0, 3)"
                    :key="`kill-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.killCnt }}</span>
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-title">KD Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.kdRank.slice(0, 3)"
                    :key="`kd-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.kd }}</span>
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-title">复活 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.reviveRank.slice(0, 3)"
                    :key="`revive-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.reviveCnt }}</span>
                  </div>
                </div>

                <div class="summary-card">
                  <div class="summary-title">连杀 Top3</div>
                  <div
                    v-for="(
                      player, playerIndex
                    ) in battleRecords.opponentClub.killStreakRank.slice(0, 3)"
                    :key="`killstreak-${playerIndex}`"
                    class="top3-item"
                  >
                    <span class="top3-name">{{ player.roleInfo.name }}</span>
                    <span class="top3-value">{{ player.mCKCnt }}</span>
                  </div>
                </div>
              </div>

              <!-- Table -->
              <div class="style2-table-wrapper">
                <table class="style2-table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>成员</th>
                      <th>击杀</th>
                      <th>连杀</th>
                      <th>抢船</th>
                      <th>复活</th>
                      <th>K/D</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(player, playerIndex) in battleRecords.opponentClub
                        .killRank"
                      :key="playerIndex"
                    >
                      <td>
                        <div v-if="playerIndex < 3" class="medal-icon">
                          {{
                            playerIndex === 0
                              ? "🥇"
                              : playerIndex === 1
                                ? "🥈"
                                : "🥉"
                          }}
                        </div>
                        <div v-else class="rank-num-plain">
                          {{ playerIndex + 1 }}
                        </div>
                      </td>
                      <td>
                        <div class="player-cell">
                          <img
                            v-if="player.roleInfo.headImg"
                            :src="player.roleInfo.headImg"
                            class="avatar-xs"
                          />
                          <div v-else class="avatar-placeholder-xs">
                            {{ player.roleInfo.name?.charAt(0) || "?" }}
                          </div>
                          <span class="player-name-s2">{{
                            player.roleInfo.name
                          }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="bar-cell">
                          <div class="bar-val red">{{ player.killCnt }}</div>
                          <div class="progress-bg">
                            <div
                              class="progress-fill red"
                              :style="{
                                width: `${getPercent(player.killCnt, getMaxKills(battleRecords.opponentClub))}%`,
                              }"
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>{{ player.mCKCnt || 0 }}</td>
                      <td>{{ player.carCnt || 0 }}</td>
                      <td>{{ player.reviveCnt }}</td>
                      <td class="kd-val">{{ player.kd }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <n-empty description="暂无战绩数据" size="large">
          <template #icon>
            <n-icon>
              <DocumentText />
            </n-icon>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Copy, DocumentText, Refresh } from "@vicons/ionicons5";

import html2canvas from "html2canvas";
import { NRadioButton, NRadioGroup, useMessage } from "naive-ui";
import { onMounted, ref, watch } from "vue";
import { useTokenStore } from "@/stores/tokenStore";
import { isSameGameValue } from "@/utils/gameValue.js";

import { downloadCanvasAsImage } from "@/utils/imageExport";

// 获取最近的周日日期
// 如果今天是周日，返回今天的日期；否则返回上周日的日期
const getLastSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const hour = today.getHours();

  let daysToSubtract = 0;
  if (dayOfWeek === 0) {
    // 今天是周日
    if (hour < 18) {
      // 18:00 之前，返回上周日
      daysToSubtract = 7;
    } else {
      // 18:00 之后，返回今天
      daysToSubtract = 0;
    }
  } else {
    // 周一到周六，计算距离上周日的天数
    daysToSubtract = dayOfWeek;
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() - daysToSubtract);

  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, "0");
  const targetDay = String(targetDate.getDate()).padStart(2, "0");

  return `${targetYear}/${targetMonth}/${targetDay}`;
};

const currentStyle = ref(
  localStorage.getItem("peach_battle_records_style") || "default",
);

watch(currentStyle, (newStyle) => {
  localStorage.setItem("peach_battle_records_style", newStyle);
});

const exportDom = ref(null);

const message = useMessage();
const tokenStore = useTokenStore();

const loading = ref(false);
const battleRecords = ref(null);

const queryDate = ref(getLastSunday());

const formatDateToShort = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return year.slice(2) + month + day;
};

const disabledDate = (current) => {
  return !isSameGameValue(current.getDay(), 0) || current > Date.now();
};

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = (val) => {
  if (!isSameGameValue(undefined, val)) {
    queryDate.value = val;
  } else {
    queryDate.value = getLastSunday();
  }
  fetchBattleRecords();
};

// 查询战绩
const fetchBattleRecords = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }
  const tokenId = tokenStore.selectedToken.id;
  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询战绩");
    return;
  }
  loading.value = true;
  try {
    const payloadTaskRes = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getpayloadtask",
      {},
      10000,
    );
    if (!payloadTaskRes) {
      message.error("未获取到对战俱乐部");
      return;
    }
    const firstLegionId = payloadTaskRes.firstLegionId;
    const payloadrecord = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getpayloadrecord",
      {},
      10000,
    );
    if (!payloadrecord) {
      message.error("未获取到对战俱乐部");
      return;
    }
    const shortDate = formatDateToShort(queryDate.value);
    if (
      !payloadrecord.enemyLegionMap ||
      !payloadrecord.enemyLegionMap[shortDate]
    ) {
      message.warning(`未找到日期 ${queryDate.value} 的对战记录`);
      battleRecords.value = null;
      return;
    }
    const secondLegionId = payloadrecord.enemyLegionMap[shortDate].id;
    if (!firstLegionId || !secondLegionId) {
      message.error("未获取到对战俱乐部ID");
      return;
    }
    // 获取俱乐部的详细信息
    const firstLegionIdInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfobyid",
      { legionId: firstLegionId },
      10000,
    );
    const secondLegionIdInfo = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getinfobyid",
      { legionId: secondLegionId },
      10000,
    );
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legion_getpayloadkillrecord",
      { date: formatDateToShort(queryDate.value) },
      10000,
    );
    if (!result) {
      message.error("未获取到对战俱乐部战绩");
      return;
    }

    // 处理我方战绩
    const ownRecords =
      result.recordsMap && result.recordsMap[Number(firstLegionId)]
        ? [...result.recordsMap[Number(firstLegionId)]]
        : [];
    // 处理敌方战绩
    const opponentRecords =
      result.recordsMap && result.recordsMap[Number(secondLegionId)]
        ? [...result.recordsMap[Number(secondLegionId)]]
        : [];

    // 计算每个玩家的K/D值
    const calculateKD = (player) => {
      const killCnt = player.killCnt || 0;
      const reviveCnt = player.reviveCnt || 0;
      return reviveCnt > 0
        ? Number.parseFloat((killCnt / reviveCnt).toFixed(2))
        : 0;
    };

    // 处理我方数据
    const processedOwnRecords = ownRecords.map((player) => ({
      ...player,
      kd: calculateKD(player),
    }));

    // 处理敌方数据
    const processedOpponentRecords = opponentRecords.map((player) => ({
      ...player,
      kd: calculateKD(player),
    }));

    // 生成我方榜单
    const ownKillRank = [...processedOwnRecords].sort(
      (a, b) => (b.killCnt || 0) - (a.killCnt || 0),
    );
    const ownKdRank = [...processedOwnRecords].sort((a, b) => b.kd - a.kd);
    const ownReviveRank = [...processedOwnRecords].sort(
      (a, b) => (b.reviveCnt || 0) - (a.reviveCnt || 0),
    );
    const ownKillStreakRank = [...processedOwnRecords].sort(
      (a, b) => (b.mCKCnt || 0) - (a.mCKCnt || 0),
    );
    const ownGodRank = [...processedOwnRecords].sort(
      (a, b) => (b.killCnt || 0) - (a.killCnt || 0),
    );

    // 生成敌方榜单
    const opponentKillRank = [...processedOpponentRecords].sort(
      (a, b) => (b.killCnt || 0) - (a.killCnt || 0),
    );
    const opponentKdRank = [...processedOpponentRecords].sort(
      (a, b) => b.kd - a.kd,
    );
    const opponentReviveRank = [...processedOpponentRecords].sort(
      (a, b) => (b.reviveCnt || 0) - (a.reviveCnt || 0),
    );
    const opponentKillStreakRank = [...processedOpponentRecords].sort(
      (a, b) => (b.mCKCnt || 0) - (a.mCKCnt || 0),
    );
    const opponentGodRank = [...processedOpponentRecords].sort(
      (a, b) => (b.killCnt || 0) - (a.killCnt || 0),
    );

    // 计算我方总体数据
    const ownTotalKills = processedOwnRecords.reduce(
      (sum, player) => sum + (player.killCnt || 0),
      0,
    );
    const ownTotalRevives = processedOwnRecords.reduce(
      (sum, player) => sum + (player.reviveCnt || 0),
      0,
    );
    const ownTotalKD =
      ownTotalRevives > 0
        ? Number.parseFloat((ownTotalKills / ownTotalRevives).toFixed(2))
        : 0;
    const ownTotalPower = processedOwnRecords.reduce(
      (sum, player) => sum + (player.roleInfo.power || 0),
      0,
    );

    // 计算敌方总体数据
    const opponentTotalKills = processedOpponentRecords.reduce(
      (sum, player) => sum + (player.killCnt || 0),
      0,
    );
    const opponentTotalRevives = processedOpponentRecords.reduce(
      (sum, player) => sum + (player.reviveCnt || 0),
      0,
    );
    const opponentTotalKD =
      opponentTotalRevives > 0
        ? Number.parseFloat(
            (opponentTotalKills / opponentTotalRevives).toFixed(2),
          )
        : 0;
    const opponentTotalPower = processedOpponentRecords.reduce(
      (sum, player) => sum + (player.roleInfo.power || 0),
      0,
    );

    // 构建最终数据结构
    battleRecords.value = {
      ownClub: {
        id: firstLegionId,
        name: firstLegionIdInfo?.legionData?.name || "我方俱乐部",
        level: firstLegionIdInfo?.legionData?.level || 0,
        power: firstLegionIdInfo?.legionData?.power || 0,
        serverId: firstLegionIdInfo?.legionData?.serverId || "",
        logo: firstLegionIdInfo?.legionData?.logo || "",
        quenchNum: firstLegionIdInfo?.legionData?.quenchNum || 0,
        announcement: firstLegionIdInfo?.legionData?.announcement || "",
        memberCount: processedOwnRecords.length,
        totalPower: ownTotalPower,
        totalKills: ownTotalKills,
        totalRevives: ownTotalRevives,
        totalKD: ownTotalKD,
        killRank: ownKillRank,
        kdRank: ownKdRank,
        reviveRank: ownReviveRank,
        killStreakRank: ownKillStreakRank,
        godRank: ownGodRank,
      },
      opponentClub: {
        id: secondLegionId,
        name: secondLegionIdInfo?.legionData?.name || "敌方俱乐部",
        level: secondLegionIdInfo?.legionData?.level || 0,
        power: secondLegionIdInfo?.legionData?.power || 0,
        serverId: secondLegionIdInfo?.legionData?.serverId || "",
        logo: secondLegionIdInfo?.legionData?.logo || "",
        quenchNum: secondLegionIdInfo?.legionData?.quenchNum || 0,
        announcement: secondLegionIdInfo?.legionData?.announcement || "",
        memberCount: processedOpponentRecords.length,
        totalPower: opponentTotalPower,
        totalKills: opponentTotalKills,
        totalRevives: opponentTotalRevives,
        totalKD: opponentTotalKD,
        killRank: opponentKillRank,
        kdRank: opponentKdRank,
        reviveRank: opponentReviveRank,
        killStreakRank: opponentKillStreakRank,
        godRank: opponentGodRank,
      },
    };

    message.success("战绩加载成功");
  } catch (error) {
    console.error("查询战绩失败:", error);
    message.error(`查询失败: ${error.message}`);
    battleRecords.value = null;
  } finally {
    loading.value = false;
  }
};

// 刷新战绩
const handleRefresh = () => {
  fetchBattleRecords();
};

// 导出战绩
const handleExport = async () => {
  if (!battleRecords.value) {
    message.warning("没有可导出的数据");
    return;
  }

  try {
    exportToImage();
    message.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败，请重试");
  }
};

const exportToImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    // eslint-disable-next-line no-alert -- Preserve the existing native notification or confirmation flow.
    alert("未找到要导出的DOM元素");
    return;
  }

  try {
    // 临时移除战神榜内容区域的最大高度限制，确保所有内容都可见
    const godRankingContents = exportDom.value.querySelectorAll(
      ".god-ranking-content",
    );
    const originalStyles = [];

    godRankingContents.forEach((content) => {
      originalStyles.push({
        element: content,
        maxHeight: content.style.maxHeight,
        overflow: content.style.overflow,
      });
      content.style.maxHeight = "none";
      content.style.overflow = "visible";
    });

    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: "#ffffff", // 避免透明背景（默认透明）
      logging: false, // 关闭控制台日志
    });

    // 恢复战神榜内容区域的原始样式
    originalStyles.forEach(({ element, maxHeight, overflow }) => {
      element.style.maxHeight = maxHeight;
      element.style.overflow = overflow;
    });

    // 6. Canvas转图片链接并下载
    const filename = `${queryDate.value.replace("/", "年").replace("/", "月")}日蟠桃园战报.png`;
    downloadCanvasAsImage(canvas, filename);
  } catch (err) {
    console.error("DOM转图片失败：", err);
    // eslint-disable-next-line no-alert -- Preserve the existing native notification or confirmation flow.
    alert("导出图片失败，请重试");
  }
};

// 关闭弹窗

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords,
});

// 挂载后自动拉取
onMounted(() => {
  queryDate.value = getLastSunday();
  fetchBattleRecords();
});
</script>

<style scoped lang="scss">
/* Removed inline styles */

.records-container {
  background: var(--bg-primary);
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}

// 头部信息区
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .header-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    padding: var(--spacing-xs);
    box-sizing: border-box;
  }

  .header-title {
    h2 {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    p {
      margin: var(--spacing-xs) 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }

  // 数据统计区
  .stats-section {
    display: flex;
    gap: var(--spacing-lg);
    align-items: center;

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      :deep(.n-tag) {
        font-size: var(--font-size-sm);
        padding: 4px 8px;
      }
    }
  }
}

// 功能操作区
.function-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;

  .function-left {
    .export-options {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      :deep(.n-checkbox-group) {
        display: flex;
        gap: var(--spacing-md);

        .n-checkbox {
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
      }
    }
  }

  .function-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    :deep(.n-date-picker) {
      font-size: var(--font-size-sm);
      width: 200px;

      .n-input-wrapper {
        font-size: var(--font-size-sm);
      }
    }

    .action-btn {
      font-size: var(--font-size-sm);
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

.battle-records-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
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
  gap: var(--spacing-md);
}

/* 头部对战信息 */
.battle-header {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.battle-header h2 {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.club-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  margin-top: var(--spacing-md);
}

/* 确保VS图标垂直居中 */
.vs {
  align-self: center;
}

.club-side {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.club-side.own {
  align-items: flex-end;
  text-align: right;
}

.club-side.opponent {
  align-items: flex-start;
  text-align: left;
}

/* 确保logo和文字对齐 */
.club-side.own .club-logo {
  align-self: flex-end;
}

.club-side.opponent .club-logo {
  align-self: flex-start;
}

.club-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
}

.club-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: var(--spacing-sm);
}

.club-id {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.club-power {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.vs {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  margin: 0 var(--spacing-lg);
}

/* 总体数据统计 */
.overall-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.stats-side {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stats-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.stat-value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

/* 统计项颜色区分 */
.stat-kills {
  border-left: 4px solid var(--error-color);
}

.stat-kills .stat-value {
  color: var(--error-color);
}

.stat-revives {
  border-left: 4px solid var(--warning-color);
}

.stat-revives .stat-value {
  color: var(--warning-color);
}

.stat-kd {
  border-left: 4px solid var(--success-color);
}

.stat-kd .stat-value {
  color: var(--success-color);
}

/* 各种榜单 */
.battle-rankings {
  margin-bottom: var(--spacing-md);
}

.ranking-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ranking-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.ranking-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.ranking-side {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ranking-subtitle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.ranking-item:nth-of-type(2) .rank-number {
  background: #ffd700;
  color: #000;
}

.ranking-item:nth-of-type(3) .rank-number {
  background: #c0c0c0;
  color: #000;
}

.ranking-item:nth-of-type(4) .rank-number {
  background: #cd7f32;
  color: #000;
}

.player-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-avatar-placeholder {
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

.player-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

/* 战神榜 */
.god-rankings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.god-ranking {
  background: var(--bg-secondary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.god-ranking-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.god-ranking-content {
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

.god-ranking-content::-webkit-scrollbar {
  width: 6px;
}

.god-ranking-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.header-avatar {
  width: 32px;
  flex-shrink: 0;
}

.player-avatar-cell {
  width: 32px;
  flex-shrink: 0;
}

.header-player {
  width: 140px;
  padding-left: var(--spacing-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.header-id {
  flex: 0 0 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-stat {
  width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.god-ranking-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.god-rank-number {
  width: 32px;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  background: #696969;
  color: #fff;
}

.god-ranking-header > .god-rank-number {
  background: transparent !important;
  color: var(--text-secondary) !important;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.god-ranking-item:nth-of-type(2) .god-rank-number {
  background: #ffd700;
  color: #000;
}

.god-ranking-item:nth-of-type(3) .god-rank-number {
  background: #c0c0c0;
  color: #000;
}

.god-ranking-item:nth-of-type(4) .god-rank-number {
  background: #cd7f32;
  color: #000;
}

.player-id {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  flex: 0 0 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-name {
  width: 140px;
  padding-left: var(--spacing-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.player-stat {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.god-ranking-content::-webkit-scrollbar-track {
  background: var(--bg-primary);
  border-radius: 3px;
}

.god-ranking-content::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.god-ranking-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overall-stats {
    grid-template-columns: 1fr;
  }

  .ranking-content {
    grid-template-columns: 1fr;
  }

  .god-rankings {
    grid-template-columns: 1fr;
  }

  .club-info {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .club-side.own {
    align-items: center;
  }

  .club-side.opponent {
    align-items: center;
  }
}

@media (max-width: 768px) {
  .inline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .ranking-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .god-ranking-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .player-stat {
    min-width: auto;
    text-align: left;
  }
}

/* Comparison Layout */
.comparison-header {
  text-align: center;
  margin-bottom: 20px;
}
.comparison-header h2 {
  font-size: 20px;
  font-weight: bold;
}

.comparison-container {
  display: flex;
  gap: 20px;
}

.club-column {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.own-column {
  border: 1px solid #e0e0e0;
}

.opponent-column {
  border: 1px solid #e0e0e0;
}

/* Style 1 */
.style-1-wrapper {
  background: #fff;
  padding: 20px;
  color: #333;
  font-family: Arial, sans-serif;
}

.style1-header {
  padding: 10px;
  text-align: center;
  color: #fff;
}

.own-header {
  background: #800080;
}

.opponent-header {
  background: #d32f2f; /* Red for opponent */
}

.style1-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.style1-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
}

.style1-table-container {
  width: 100%;
  overflow-x: auto;
}

.style1-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.style1-table th {
  background: #f0f0f0;
  color: #333;
  padding: 6px;
  text-align: center;
  font-weight: bold;
  border-bottom: 2px solid #ddd;
}

.own-column .style1-table th {
  background: #aa50aa;
  color: #fff;
  border-bottom: none;
}

.opponent-column .style1-table th {
  background: #e55555;
  color: #fff;
  border-bottom: none;
}

.style1-table td {
  padding: 5px;
  border-bottom: 1px solid #eee;
  text-align: center;
  vertical-align: middle;
  height: 32px;
}

.style1-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.col-rank {
  width: 40px;
}
.col-name {
  text-align: left !important;
  padding-left: 5px !important;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.player-avatar-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.player-avatar-placeholder-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
}

.style1-summary-block {
  margin-bottom: 15px;
}

.overall-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.overall-card .summary-item {
  border-right: 1px solid #f0f0f0;
}

.overall-card .summary-item:nth-child(2n) {
  border-right: none;
}

.style1-summary-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.summary-card {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.summary-title {
  padding: 6px;
  text-align: center;
  font-weight: bold;
  font-size: 13px;
  color: #fff;
}

.own-column .summary-title {
  background: #aa50aa;
}
.opponent-column .summary-title {
  background: #e55555;
}

/* Lighter ranking titles for Style 1 */
.own-column .style1-summary-row .summary-title {
  background: #aa50aa;
}
.opponent-column .style1-summary-row .summary-title {
  background: #e55555;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  font-weight: bold;
}

.top3-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.top3-name {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 5px;
}

.top3-value {
  font-weight: bold;
}

.col-kill-streak,
.col-car {
  width: 60px;
}

.rank-medal {
  font-size: 16px;
  line-height: 1;
}

/* Style 1 */
.style-1-wrapper {
  background: #eef2f7;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  border-radius: 8px;
}

.style-1-wrapper .battle-header {
  background: #fff;
  border-bottom: 1px solid #ddd;
}

/* Style 2 */
.style-2-wrapper {
  background: #eef2f7;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  border-radius: 8px;
}

.style-2-wrapper .battle-header {
  background: #fff;
  border-bottom: 1px solid #ddd;
}

.style2-header {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  background: #fff;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.style2-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trophy-icon {
  font-size: 24px;
}

.title-text h2 {
  font-size: 16px;
  color: #333;
  margin: 0;
  font-weight: 800;
}

.date-text {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.style2-dashboard {
  margin-bottom: 15px;
  padding: 0 10px;
}

.dashboard-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-card-row {
  display: flex;
  gap: 10px;
}

.stat-card-mini {
  flex: 1;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-label-mini {
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
}

.stat-value-mini {
  font-size: 14px;
  font-weight: 800;
  color: #333;
}

.warning-text {
  color: #ff9800;
}
.danger-text {
  color: #f44336;
}
.purple-text {
  color: #9c27b0;
}

.style2-table-wrapper {
  background: #fff;
  padding: 0;
  overflow-x: auto;
}

.style2-table {
  width: 100%;
  border-collapse: collapse;
}

.style2-table thead {
  background: #4285f4;
}

.opponent-column .style2-table thead {
  background: #e53935;
}

.style2-table th {
  color: #fff;
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.style2-table th:nth-child(2) {
  text-align: left;
  padding-left: 10px;
}

.style2-table td {
  padding: 6px 4px;
  border-bottom: 1px solid #f1f1f1;
  vertical-align: middle;
  text-align: center;
  font-size: 12px;
  color: #444;
}

.style2-table tr:hover {
  background: #f8fbff;
}

.medal-icon {
  font-size: 14px;
}
.rank-num-plain {
  font-weight: bold;
  color: #888;
}

.player-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: flex-start;
  padding-left: 5px;
}

.player-name-s2 {
  font-weight: 600;
  color: #333;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.avatar-xs {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder-xs {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
}

.bar-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
}

.bar-val {
  width: 20px;
  text-align: right;
  font-weight: bold;
  font-size: 11px;
}
.bar-val.red {
  color: #ff5252;
}
.bar-val.gray {
  color: #9e9e9e;
}
.bar-val.orange {
  color: #ffab40;
}

.progress-bg {
  flex: 1;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  min-width: 30px;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
}
.progress-fill.red {
  background: #ff5252;
}
.progress-fill.orange {
  background: #ffab40;
}
.progress-fill.gray {
  background: #9e9e9e;
}

.kd-val {
  font-weight: bold;
  color: #4caf50;
}

@media (max-width: 768px) {
  .comparison-container {
    flex-direction: column;
  }
}

.style2-rankings-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 15px;
}

/* Style 2 Color Overrides */
.own-column.style-2 .summary-title {
  background: #4285f4;
}

.opponent-column.style-2 .summary-title {
  background: #e53935;
}
</style>
