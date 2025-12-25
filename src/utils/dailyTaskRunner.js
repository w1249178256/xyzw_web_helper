
import { useTokenStore } from '@/stores/tokenStore'

// 辅助函数
const pickArenaTargetId = (targets) => {
  if (!targets) return null

  // Handle if targets is an array directly
  if (Array.isArray(targets)) {
    const candidate = targets[0]
    return candidate?.roleId || candidate?.id || candidate?.targetId
  }

  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0]

  if (candidate) {
    if (candidate.roleId) return candidate.roleId
    if (candidate.id) return candidate.id
    if (candidate.targetId) return candidate.targetId
  }

  return targets?.roleId || targets?.id || targets?.targetId
}

const isTodayAvailable = (statisticsTime) => {
  if (!statisticsTime) return true

  // 如果有时间戳，检查是否为今天
  const today = new Date().toDateString()
  //系统返回得时间戳是秒，要转换成毫秒
  const recordDate = new Date(statisticsTime * 1000).toDateString()

  return today !== recordDate
}

const getTodayBossId = () => {
  const DAY_BOSS_MAP = [9904, 9905, 9901, 9902, 9903, 9904, 9905] // 周日~周六
  const dayOfWeek = new Date().getDay()
  return DAY_BOSS_MAP[dayOfWeek]
}

export class DailyTaskRunner {
  constructor(tokenStore) {
    this.tokenStore = tokenStore
  }

  log(message, type = 'info') {
    if (this.callbacks?.onLog) {
      this.callbacks.onLog({
        time: new Date().toLocaleTimeString(),
        message,
        type
      })
    }
  }

  async executeGameCommand(tokenId, cmd, params = {}, description = '', timeout = 8000) {
    try {
      if (description) this.log(`执行: ${description}`)
      const result = await this.tokenStore.sendMessageWithPromise(tokenId, cmd, params, timeout)
      await new Promise(resolve => setTimeout(resolve, 500))
      if (description) this.log(`${description} - 成功`, 'success')
      return result
    } catch (error) {
      if (description) this.log(`${description} - 失败: ${error.message}`, 'error')
      throw error
    }
  }

  async switchToFormationIfNeeded(tokenId, targetFormation, formationName) {
    try {
      // 尝试从本地缓存获取当前阵容信息
      // 注意：这里直接读取 store 中的 gameData 可能不是最新的，如果是批量跑，建议每次都获取最新的
      // 或者我们假设 tokenStore.gameData 会随着 sendMessage 更新（如果 store 有处理逻辑）
      // 安全起见，这里先从服务器获取

      this.log(`检查${formationName}配置...`)
      const teamInfo = await this.executeGameCommand(tokenId, 'presetteam_getinfo', {}, '获取阵容信息')

      if (!teamInfo || !teamInfo.presetTeamInfo) {
        this.log(`阵容信息异常: ${JSON.stringify(teamInfo)}`, 'warning')
      }

      const currentFormation = teamInfo?.presetTeamInfo?.useTeamId
      this.log(`当前阵容: ${currentFormation}`)

      if (currentFormation === targetFormation) {
        this.log(`当前已是${formationName}${targetFormation}，无需切换`, 'success')
        return false
      }

      this.log(`当前阵容: ${currentFormation}, 目标阵容: ${targetFormation}，开始切换...`)
      await this.executeGameCommand(tokenId, 'presetteam_saveteam',
        { teamId: targetFormation }, `切换到${formationName}${targetFormation}`)

      this.log(`成功切换到${formationName}${targetFormation}`, 'success')
      return true
    } catch (error) {
      this.log(`阵容检查失败，尝试强制切换: ${error.message}`, 'warning')
      try {
        await this.executeGameCommand(tokenId, 'presetteam_saveteam',
          { teamId: targetFormation }, `强制切换到${formationName}${targetFormation}`)
        return true
      } catch (fallbackError) {
        this.log(`强制切换也失败: ${fallbackError.message}`, 'error')
        throw fallbackError
      }
    }
  }

  loadSettings(roleId) {
    try {
      const raw = localStorage.getItem(`daily-settings:${roleId}`)
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
        blackMarketPurchase: true
      }
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
    } catch (error) {
      console.error('Failed to load settings:', error)
      return null
    }
  }

  async run(tokenId, callbacks = {}, customSettings = null) {
    this.callbacks = callbacks
    const settings = customSettings || this.loadSettings(tokenId) // 优先使用传入的设置

    // 获取角色信息以确认 roleId 和 任务状态
    this.log('正在获取角色信息...')
    let roleInfoResp
    try {
      roleInfoResp = await this.tokenStore.sendGetRoleInfo(tokenId)
      this.log('角色信息获取成功', 'success')
    } catch (error) {
      this.log(`获取角色信息失败: ${error.message}`, 'error')
      throw error
    }

    const roleData = roleInfoResp?.role
    if (!roleData) {
      throw new Error('角色数据不存在')
    }

    // 重新加载设置，使用正确的 roleId (虽然通常 tokenId 就是 roleId 或者一一对应，但为了保险)
    // 在这个项目中，tokenId 似乎就是 roleId 或者用于标识
    // DailyTaskStatus.vue 中: const role = getCurrentRole() -> roleId: tokenStore.selectedToken.id
    // 所以 tokenId 就是 key

    this.log('开始执行每日任务补差')

    const completedTasks = roleData.dailyTask?.complete ?? {}
    const isTaskCompleted = (taskId) => completedTasks[taskId] === -1
    const statistics = roleData.statistics ?? {}
    const statisticsTime = roleData.statisticsTime ?? {}

    const taskList = []

    // 1. 基础任务
    if (!isTaskCompleted(2)) {
      taskList.push({
        name: '分享一次游戏',
        execute: () => this.executeGameCommand(tokenId, 'system_mysharecallback',
          { isSkipShareCard: true, type: 2 }, '分享游戏')
      })
    }

    if (!isTaskCompleted(3)) {
      taskList.push({
        name: '赠送好友金币',
        execute: () => this.executeGameCommand(tokenId, 'friend_batch', {}, '赠送好友金币')
      })
    }

    if (!isTaskCompleted(4)) {
      taskList.push({
        name: '免费招募',
        execute: () => this.executeGameCommand(tokenId, 'hero_recruit',
          { recruitType: 3, recruitNumber: 1 }, '免费招募')
      })

      if (settings.payRecruit) {
        taskList.push({
          name: '付费招募',
          execute: () => this.executeGameCommand(tokenId, 'hero_recruit',
            { recruitType: 1, recruitNumber: 1 }, '付费招募')
        })
      }
    }

    if (!isTaskCompleted(6) && isTodayAvailable(statisticsTime['buy:gold'])) {
      for (let i = 0; i < 3; i++) {
        taskList.push({
          name: `免费点金 ${i + 1}/3`,
          execute: () => this.executeGameCommand(tokenId, 'system_buygold',
            { buyNum: 1 }, `免费点金 ${i + 1}`)
        })
      }
    }

    if (!isTaskCompleted(5) && settings.claimHangUp) {
      for (let i = 0; i < 4; i++) {
        taskList.push({
          name: `挂机加钟 ${i + 1}/4`,
          execute: () => this.executeGameCommand(tokenId, 'system_mysharecallback',
            { isSkipShareCard: true, type: 2 }, `挂机加钟 ${i + 1}`)
        })
      }
      taskList.push({
        name: '领取挂机奖励',
        execute: () => this.executeGameCommand(tokenId, 'system_claimhangupreward', {}, '领取挂机奖励')
      })
      taskList.push({
        name: '挂机加钟 5/5',
        execute: () => this.executeGameCommand(tokenId, 'system_mysharecallback',
          { isSkipShareCard: true, type: 2 }, '挂机加钟 5')
      })
    }

    if (!isTaskCompleted(7) && settings.openBox) {
      taskList.push({
        name: '开启木质宝箱',
        execute: () => this.executeGameCommand(tokenId, 'item_openbox',
          { itemId: 2001, number: 10 }, '开启木质宝箱10个')
      })
    }

    taskList.push({
      name: '停止盐罐计时',
      execute: () => this.executeGameCommand(tokenId, 'bottlehelper_stop', {}, '停止盐罐计时')
    })
    taskList.push({
      name: '开始盐罐计时',
      execute: () => this.executeGameCommand(tokenId, 'bottlehelper_start', {}, '开始盐罐计时')
    })

    if (!isTaskCompleted(14) && settings.claimBottle) {
      taskList.push({
        name: '领取盐罐奖励',
        execute: () => this.executeGameCommand(tokenId, 'bottlehelper_claim', {}, '领取盐罐奖励')
      })
    }

    // 2. 竞技场
    if (!isTaskCompleted(13) && settings.arenaEnable) {
      taskList.push({
        name: '竞技场战斗',
        execute: async () => {
          this.log('开始竞技场战斗流程')
          const hour = new Date().getHours()
          if (hour < 8) {
            this.log('当前时间未到8点，跳过竞技场战斗', 'warning')
            return
          }
          if (hour > 22) {
            this.log('当前时间已过22点，跳过竞技场战斗', 'warning')
            return
          }

          await this.switchToFormationIfNeeded(tokenId, settings.arenaFormation, '竞技场阵容')
          await this.executeGameCommand(tokenId, 'arena_startarea', {}, '开始竞技场')

          for (let i = 1; i <= 3; i++) {
            this.log(`竞技场战斗 ${i}/3`)
            let targets
            try {
              targets = await this.executeGameCommand(tokenId, 'arena_getareatarget', {}, `获取竞技场目标${i}`)
            } catch (err) {
              this.log(`竞技场战斗${i} - 获取对手失败: ${err.message}`, 'error')
              break
            }

            const targetId = pickArenaTargetId(targets)
            if (targetId) {
              await this.executeGameCommand(tokenId, 'fight_startareaarena', { targetId }, `竞技场战斗${i}`, 10000)
            } else {
              this.log(`竞技场战斗${i} - 未找到目标: ${JSON.stringify(targets)}`, 'warning')
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      })
    }

    // 3. BOSS
    if (settings.bossTimes > 0) {
      let alreadyLegionBoss = statistics['legion:boss'] ?? 0
      if (isTodayAvailable(statisticsTime['legion:boss'])) {
        alreadyLegionBoss = 0
      }
      const remainingLegionBoss = Math.max(settings.bossTimes - alreadyLegionBoss, 0)

      if (remainingLegionBoss > 0) {
        taskList.push({
          name: '军团BOSS阵容检查',
          execute: () => this.switchToFormationIfNeeded(tokenId, settings.bossFormation, 'BOSS阵容')
        })
        for (let i = 0; i < remainingLegionBoss; i++) {
          taskList.push({
            name: `军团BOSS ${i + 1}/${remainingLegionBoss}`,
            execute: () => this.executeGameCommand(tokenId, 'fight_startlegionboss', {}, `军团BOSS ${i + 1}`, 12000)
          })
        }
      }
    }

    const todayBossId = getTodayBossId()
    taskList.push({
      name: '每日BOSS阵容检查',
      execute: () => this.switchToFormationIfNeeded(tokenId, settings.bossFormation, 'BOSS阵容')
    })
    for (let i = 0; i < 3; i++) {
      taskList.push({
        name: `每日BOSS ${i + 1}/3`,
        execute: () => this.executeGameCommand(tokenId, 'fight_startboss',
          { bossId: todayBossId }, `每日BOSS ${i + 1}`, 12000)
      })
    }

    // 4. 固定奖励
    const fixedRewards = [
      { name: '福利签到', cmd: 'system_signinreward' },
      { name: '俱乐部', cmd: 'legion_signin' },
      { name: '领取每日礼包', cmd: 'discount_claimreward' },
      { name: '领取每日免费奖励', cmd: 'collection_claimfreereward' },
      { name: '领取免费礼包', cmd: 'card_claimreward' },
      { name: '领取永久卡礼包', cmd: 'card_claimreward', params: { cardId: 4003 } }
    ]

    if (settings.claimEmail) {
      fixedRewards.push({ name: '领取邮件奖励', cmd: 'mail_claimallattachment' })
    }

    fixedRewards.forEach(reward => {
      taskList.push({
        name: reward.name,
        execute: () => this.executeGameCommand(tokenId, reward.cmd, reward.params || {}, reward.name)
      })
    })

    taskList.push(
      {
        name: '开始领取珍宝阁礼包',
        execute: () => this.executeGameCommand(tokenId, 'collection_goodslist', {}, '开始领取珍宝阁礼包')
      }
    )
    taskList.push(
      {
        name: '领取珍宝阁免费礼包',
        execute: () => this.executeGameCommand(tokenId, 'collection_claimfreereward', {}, '领取珍宝阁免费礼包')
      }
    )

    // 5. 免费活动
    if (isTodayAvailable(statistics['artifact:normal:lottery:time'])) {
      for (let i = 0; i < 3; i++) {
        taskList.push({
          name: `免费钓鱼 ${i + 1}/3`,
          execute: () => this.executeGameCommand(tokenId, 'artifact_lottery',
            { lotteryNumber: 1, newFree: true, type: 1 }, `免费钓鱼 ${i + 1}`)
        })
      }
    }

    const kingdoms = ['魏国', '蜀国', '吴国', '群雄']
    for (let gid = 1; gid <= 4; gid++) {
      if (isTodayAvailable(statisticsTime[`genie:daily:free:${gid}`])) {
        taskList.push({
          name: `${kingdoms[gid - 1]}灯神免费扫荡`,
          execute: () => this.executeGameCommand(tokenId, 'genie_sweep',
            { genieId: gid }, `${kingdoms[gid - 1]}灯神免费扫荡`)
        })
      }
    }

    for (let i = 0; i < 3; i++) {
      taskList.push({
        name: `领取免费扫荡卷 ${i + 1}/3`,
        execute: () => this.executeGameCommand(tokenId, 'genie_buysweep', {}, `领取免费扫荡卷 ${i + 1}`)
      })
    }

    // 6. 黑市
    if (!isTaskCompleted(12) && settings.blackMarketPurchase) {
      taskList.push({
        name: '黑市购买1次物品',
        execute: () => this.executeGameCommand(tokenId, 'store_purchase', { goodsId: 1 }, '黑市购买1次物品')
      })
    }

    // 咸王梦境
    const mengyandayOfWeek = new Date().getDay()
    if (mengyandayOfWeek === 0 | mengyandayOfWeek === 1 | mengyandayOfWeek === 3 | mengyandayOfWeek === 4) {
      const mjbattleTeam = { "0": 107 }
      taskList.push({
        name: '咸王梦境',
        execute: () => this.executeGameCommand(tokenId, 'dungeon_selecthero', { battleTeam: mjbattleTeam }, '咸王梦境')
      })
    }

    // 深海灯神
    if (mengyandayOfWeek === 1 && isTodayAvailable(statisticsTime[`genie:daily:free:5`])) {
      taskList.push({
        name: '深海灯神',
        execute: () => this.executeGameCommand(tokenId, 'genie_sweep', { genieId: 5, sweepCnt: 1 }, '深海灯神')
      })
    }

    // 7. 任务奖励
    for (let taskId = 1; taskId <= 10; taskId++) {
      taskList.push({
        name: `领取任务奖励${taskId}`,
        execute: () => this.executeGameCommand(tokenId, 'task_claimdailypoint',
          { taskId }, `领取任务奖励${taskId}`, 5000)
      })
    }

    taskList.push(
      {
        name: '领取日常任务奖励',
        execute: () => this.executeGameCommand(tokenId, 'task_claimdailyreward', {}, '领取日常任务奖励')
      },
      {
        name: '领取周常任务奖励',
        execute: () => this.executeGameCommand(tokenId, 'task_claimweekreward', {}, '领取周常任务奖励')
      }
    )

    // 执行
    const totalTasks = taskList.length
    this.log(`共有 ${totalTasks} 个任务待执行`)

    for (let i = 0; i < taskList.length; i++) {
      const task = taskList[i]
      try {
        await task.execute()
        const progress = Math.floor(((i + 1) / totalTasks) * 100)
        if (this.callbacks?.onProgress) this.callbacks.onProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        this.log(`任务执行失败: ${task.name} - ${error.message}`, 'error')
      }
    }

    if (this.callbacks?.onProgress) this.callbacks.onProgress(100)
    this.log('所有任务执行完成', 'success')
  }
}
