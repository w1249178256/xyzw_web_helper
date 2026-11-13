import {
  fillHangUpTime,
  getClaimablePointRewards,
  getDailyTaskStates,
  loadDailyTaskConfig,
  runWithDailyTaskLock,
} from "@/utils/dailyTaskState";

const taskLabels = {
  1: "登录游戏",
  2: "分享游戏",
  3: "赠送好友金币",
  4: "招募",
  5: "领取挂机奖励",
  6: "点金",
  7: "开启宝箱",
  12: "黑市购买",
  13: "竞技场战斗",
  14: "收获盐罐",
};

const getTodayBossId = (dailyTime) => {
  const DAY_BOSS_MAP = [9904, 9905, 9901, 9902, 9903, 9904, 9905]; // 周日~周六
  const dayOfWeek = new Date((dailyTime + 8 * 60 * 60) * 1000).getUTCDay();
  return DAY_BOSS_MAP[dayOfWeek];
};

export class DailyTaskRunner {
  constructor(tokenStore, delaySettings = null, options = {}) {
    this.loadConfig = options.loadConfig || loadDailyTaskConfig;
    this.sleep =
      options.sleep ||
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.tokenStore = tokenStore;
    this.delaySettings = delaySettings || {
      commandDelay: 500,
      taskDelay: 500,
    };
  }

  log(message, type = "info") {
    if (this.callbacks?.onLog) {
      this.callbacks.onLog({
        time: new Date().toLocaleTimeString(),
        message,
        type,
      });
    }
  }

  /**
   * Send once; uncertain results stop this run and require a fresh server snapshot.
   * @param {string} tokenId Account identity.
   * @param {Function} request Transport call without automatic retries.
   * @returns {Promise<*>} Server response.
   */
  async sendRequest(tokenId, request) {
    if (!this.restoringFormation) this.throwIfInterrupted(tokenId);
    const response = await request();
    if (!this.restoringFormation) this.throwIfInterrupted(tokenId);
    return response;
  }

  async executeGameCommand(
    tokenId,
    cmd,
    params = {},
    description = "",
    timeout = 8000,
  ) {
    try {
      if (description) this.log(`执行: ${description}`);
      this.roleStateDirty = true;
      const result = await this.sendRequest(tokenId, () =>
        this.tokenStore.sendMessageWithPromise(tokenId, cmd, params, timeout),
      );
      await this.sleep(this.delaySettings.commandDelay);
      if (description)
        this.log(
          `${description} - ${this.activeCondition !== undefined ? "请求成功，待服务器确认任务状态" : "成功"}`,
          this.activeCondition !== undefined ? "info" : "success",
        );
      return result;
    } catch (error) {
      if (description) {
        const token = this.tokenStore.gameTokens.find((t) => t.id === tokenId);
        const tokenName = token?.name || tokenId;
        this.log(
          `[${tokenName}] ${description} - 失败: ${error.message}`,
          "error",
        );
      }
      throw error;
    }
  }

  async switchToFormationIfNeeded(tokenId, targetFormation, formationName) {
    try {
      if (!Number.isInteger(targetFormation) || targetFormation <= 0)
        throw new Error("目标阵容无效，停止切换");
      this.log(`检查${formationName}配置...`);
      const teamInfo = await this.executeGameCommand(
        tokenId,
        "presetteam_getinfo",
        {},
        "获取阵容信息",
      );

      if (!teamInfo || !teamInfo.presetTeamInfo) {
        this.log(`阵容信息异常: ${JSON.stringify(teamInfo)}`, "warning");
      }

      const currentFormation = teamInfo?.presetTeamInfo?.useTeamId;
      if (!Number.isInteger(currentFormation))
        throw new Error("服务器未提供有效阵容，停止切换");
      if (this.originalFormation === undefined)
        this.originalFormation = currentFormation;
      this.log(`当前阵容: ${currentFormation}`);

      if (currentFormation === targetFormation) {
        this.log(
          `当前已是${formationName}${targetFormation}，无需切换`,
          "success",
        );
        return false;
      }

      this.log(
        `当前阵容: ${currentFormation}, 目标阵容: ${targetFormation}，开始切换...`,
      );
      // A lost acknowledgement can still follow a server-side switch.
      this.formationChanged = true;
      await this.executeGameCommand(
        tokenId,
        "presetteam_saveteam",
        { teamId: targetFormation },
        `切换到${formationName}${targetFormation}`,
      );

      this.log(`成功切换到${formationName}${targetFormation}`, "success");
      return true;
    } catch (error) {
      this.log(`阵容检查或切换失败: ${error.message}`, "error");
      throw error;
    }
  }

  loadSettings(roleId) {
    try {
      const raw = localStorage.getItem(`daily-settings:${roleId}`);
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
        freeGachaEnable: true,
      };
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch (error) {
      console.error("Failed to load settings:", error);
      return null;
    }
  }

  /** Check cancellation and live connection before starting another operation. */
  throwIfInterrupted(tokenId) {
    const stopped = this.callbacks?.shouldStop?.();
    const status = this.tokenStore.getWebSocketStatus?.(tokenId);
    if (stopped || (status && status !== "connected")) {
      const error = new Error(
        stopped
          ? "任务已停止，再次执行将根据服务器任务列表补差"
          : "WebSocket 已断开，停止执行并等待重新查询服务器状态",
      );
      error.interrupted = true;
      throw error;
    }
  }

  /**
   * Read uncached server progress; a response after disconnect is not accepted.
   * @param {string} tokenId Account to query.
   * @returns {Promise<object>} Validated current role snapshot.
   * @throws {Error} On missing task data, a changed task day or disconnected transport.
   */
  async refreshServerRole(tokenId) {
    try {
      this.throwIfInterrupted(tokenId);
      const response = await this.sendRequest(tokenId, () =>
        this.tokenStore.sendGetRoleInfo(tokenId, {}, 2),
      );
      await this.sleep(this.delaySettings.commandDelay);
      this.throwIfInterrupted(tokenId);
      const role = response?.role;
      const states = getDailyTaskStates(role, this.taskConfig);
      if (
        this.taskDay !== undefined &&
        role.dailyTask.dailyTime !== this.taskDay
      ) {
        const error = new Error(
          "服务器每日任务已重置，请重新开始获取当日任务列表",
        );
        error.interrupted = true;
        throw error;
      }
      this.roleData = role;
      this.roleStateDirty = false;
      for (const state of states) {
        const signature = `${state.status}:${state.progress}/${state.required}`;
        if (this.loggedTaskStates?.get(state.condition) === signature) continue;
        this.loggedTaskStates?.set(state.condition, signature);
        const label = taskLabels[state.condition] || `任务${state.id}`;
        const status =
          state.status === "claimed"
            ? "已完成并领奖，跳过"
            : state.status === "claimable"
              ? "已完成，待领奖，跳过重复操作"
              : `未完成，剩余 ${state.remaining}`;
        this.log(
          `${label}: ${state.progress}/${state.required} · ${status}`,
          state.status === "pending" ? "info" : "success",
        );
      }
      const progress = Math.floor(
        (states.filter((state) => state.status === "claimed").length /
          states.length) *
          100,
      );
      if (progress !== this.reportedProgress) {
        this.reportedProgress = progress;
        this.callbacks?.onProgress?.(progress);
      }
      return role;
    } catch (error) {
      if (error.interrupted) throw error;
      const failure = new Error(error.message || "读取服务器任务列表失败");
      failure.serverStateUnavailable = true;
      throw failure;
    }
  }

  getTaskState(condition) {
    const task = getDailyTaskStates(this.roleData, this.taskConfig).find(
      (task) => task.condition === condition,
    );
    if (!task) throw new Error(`官方任务配置中未找到完成条件 ${condition}`);
    return task;
  }

  /**
   * Fill remaining server task counters and claim only eligible unclaimed rewards.
   * @param {string} tokenId Account identity.
   * @param {object} callbacks Log, progress and cancellation hooks.
   * @param {object|null} customSettings Optional task settings.
   * @returns {Promise<object>} Execution counts without any local completion record.
   */
  async run(tokenId, callbacks = {}, customSettings = null) {
    return runWithDailyTaskLock(tokenId, () =>
      this.runTasks(tokenId, callbacks, customSettings),
    );
  }

  async runTasks(tokenId, callbacks = {}, customSettings = null) {
    this.callbacks = callbacks;
    this.taskDay = undefined;
    this.activeCondition = undefined;
    this.originalFormation = undefined;
    this.formationChanged = false;
    this.roleStateDirty = true;
    this.reportedProgress = undefined;
    this.loggedTaskStates = new Map();
    this.throwIfInterrupted(tokenId);
    const settings = customSettings || this.loadSettings(tokenId);
    if (!settings) throw new Error("每日任务设置无法读取");
    this.log("读取服务器任务配置与当前任务列表...");
    this.taskConfig = await this.loadConfig(
      {
        sendMessageWithPromise: (id, cmd, params, timeout) =>
          this.sendRequest(id, () =>
            this.tokenStore.sendMessageWithPromise(id, cmd, params, timeout),
          ),
      },
      tokenId,
    );
    const roleData = await this.refreshServerRole(tokenId);
    this.taskDay = roleData.dailyTask.dailyTime;

    this.log("开始执行每日任务补差");

    // A reached target is completed even when its points are not yet claimed.
    const isTaskCompleted = (condition) =>
      this.getTaskState(condition).remaining === 0;
    const statistics = roleData.statistics ?? {};
    const statisticsTime = roleData.statisticsTime ?? {};
    // Server dailyTime defines the reset boundary; browser dates are not completion evidence.
    const isTodayAvailable = (stamp) =>
      !Number.isFinite(stamp) || stamp < roleData.dailyTask.dailyTime;

    // 官方字段：area:arena:last 记录今日竞技场战斗次数，上限 3 次
    const getArenaRemainingFree = (role = this.roleData) => {
      const statKey = "area:arena:last";
      const statsTime = role.statisticsTime?.[statKey] ?? 0;
      const isToday =
        Number.isFinite(statsTime) &&
        statsTime >= (role.dailyTask?.dailyTime || 0);
      const usedToday = isToday ? Number(role.statistics?.[statKey]) || 0 : 0;
      return Math.max(0, 3 - usedToday);
    };

    const taskList = [];

    // 1. 基础任务
    if (!isTaskCompleted(2)) {
      taskList.push({
        name: "分享一次游戏",
        condition: 2,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "system_mysharecallback",
            { isSkipShareCard: true, type: 3 },
            "分享游戏",
          ),
      });
    }

    if (!isTaskCompleted(3)) {
      taskList.push({
        name: "赠送好友金币",
        condition: 3,
        execute: () =>
          this.executeGameCommand(tokenId, "friend_batch", {}, "赠送好友金币"),
      });
    }

    if (!isTaskCompleted(4)) {
      const freeRecruit = isTodayAvailable(statistics["recruit:one:free"]);
      const paidRecruit =
        this.getTaskState(4).remaining - (freeRecruit ? 1 : 0);
      if (freeRecruit)
        taskList.push({
          name: "免费招募",
          condition: 4,
          execute: () =>
            this.executeGameCommand(
              tokenId,
              "hero_recruit",
              { recruitType: 3, recruitNumber: 1 },
              "免费招募",
            ),
        });

      if (settings.payRecruit && paidRecruit > 0) {
        taskList.push({
          name: "付费招募",
          condition: 4,
          execute: () =>
            this.executeGameCommand(
              tokenId,
              "hero_recruit",
              { recruitType: 1, recruitNumber: paidRecruit },
              "付费招募补足服务器任务进度",
            ),
        });
      }
    }

    if (!isTaskCompleted(6)) {
      const remaining = this.getTaskState(6).remaining;
      for (let i = 0; i < remaining; i++) {
        taskList.push({
          name: `免费点金 ${i + 1}/${remaining}`,
          condition: 6,
          execute: () =>
            this.executeGameCommand(
              tokenId,
              "system_buygold",
              { buyNum: 1 },
              `免费点金 ${i + 1}`,
            ),
        });
      }
    }

    if (!isTaskCompleted(5) && settings.claimHangUp) {
      const remaining = this.getTaskState(5).remaining;
      for (let i = 0; i < remaining; i++) {
        taskList.push({
          name: `领取挂机奖励 ${i + 1}/${remaining}`,
          condition: 5,
          execute: async () => {
            const interval = this.taskConfig.hangUpClaimInterval;
            if (interval) {
              const serverTime =
                this.tokenStore.wsConnections?.[tokenId]?.client?.serverTime;
              const lastTime = roleData.hangUp?.lastTime;
              const wait =
                i === 0 &&
                Number.isFinite(serverTime) &&
                Number.isFinite(lastTime)
                  ? Math.max(lastTime * 1000 + interval - serverTime, 0)
                  : interval;
              await this.sleep(wait);
            }
            return this.executeGameCommand(
              tokenId,
              "system_claimhangupreward",
              {},
              `领取挂机奖励 ${i + 1}/${remaining}`,
            );
          },
        });
      }
    }

    // Help slots can be empty even after the daily goal and its points were claimed.
    if (settings.claimHangUp) {
      taskList.push({
        name: "按服务器槽位补足挂机加钟",
        execute: async () => {
          try {
            const result = await fillHangUpTime({
              tokenStore: this.tokenStore,
              tokenId,
              readRole: async () => ({
                role: await this.refreshServerRole(tokenId),
              }),
              sendCommand: () =>
                this.executeGameCommand(
                  tokenId,
                  "system_mysharecallback",
                  { isSkipShareCard: true, type: 2 },
                  "挂机加钟",
                ),
              check: () => this.throwIfInterrupted(tokenId),
              onLog: (message) => this.log(message),
              sleep: this.sleep,
              delay: 0,
            });
            return result.remaining === 0;
          } catch (error) {
            if (!error.hangUpStateUnavailable) throw error;
            this.log(`${error.message}，加钟保留待继续`, "warning");
            return false;
          }
        },
      });
    }

    if (!isTaskCompleted(7) && settings.openBox) {
      taskList.push({
        name: "开启木质宝箱",
        condition: 7,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "item_openbox",
            { itemId: 2001, number: 10 },
            "开启木质宝箱10个",
          ),
      });
    }

    if (!isTaskCompleted(14) && settings.claimBottle) {
      taskList.push({
        name: "停止盐罐计时",
        condition: 14,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "bottlehelper_stop",
            {},
            "停止盐罐计时",
          ),
      });
      taskList.push({
        name: "开始盐罐计时",
        condition: 14,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "bottlehelper_start",
            {},
            "开始盐罐计时",
          ),
      });

      taskList.push({
        name: "领取盐罐奖励",
        condition: 14,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "bottlehelper_claim",
            {},
            "领取盐罐奖励",
          ),
      });
    }

    // 2. 竞技场 (根据官方 area:arena:last 动态判断免费，循环打满免费)
    if (
      settings.arenaEnable &&
      (getArenaRemainingFree() > 0 || !isTaskCompleted(13))
    ) {
      taskList.push({
        name: "竞技场免费挑战",
        execute: async () => {
          this.log("开始竞技场免费战斗流程");
          const hour = new Date().getHours();
          if (hour < 6) {
            this.log("当前时间未到6点，跳过竞技场战斗", "warning");
            return false;
          }
          if (hour > 22) {
            this.log("当前时间已过22点，跳过竞技场战斗", "warning");
            return false;
          }

          await this.switchToFormationIfNeeded(
            tokenId,
            settings.arenaFormation,
            "竞技场阵容",
          );
          try {
            await this.executeGameCommand(
              tokenId,
              "arena_startarea",
              {},
              "开始竞技场",
            );
          } catch (e) {
            this.log(`进入竞技场提示: ${e.message}`, "info");
          }

          let battleCount = 0;
          const maxSafetyLimit = 5;
          while (
            (getArenaRemainingFree() > 0 || !isTaskCompleted(13)) &&
            battleCount < maxSafetyLimit
          ) {
            const leftFree = getArenaRemainingFree();
            battleCount++;
            this.log(
              `竞技场战斗 第${battleCount}场 (当前剩余免费: ${leftFree}次)`,
            );

            const targets = await this.executeGameCommand(
              tokenId,
              "arena_getareatarget",
              {},
              `获取竞技场目标${battleCount}`,
            );

            const targetId = targets?.roleList?.[0]?.roleId;
            if (targetId) {
              await this.executeGameCommand(
                tokenId,
                "fight_startareaarena",
                { targetId },
                `竞技场战斗第${battleCount}场`,
                10000,
              );
            } else {
              this.log(
                `竞技场战斗第${battleCount}场 - 未找到可用目标: ${JSON.stringify(targets)}`,
                "warning",
              );
              return false;
            }

            await this.refreshServerRole(tokenId);
            await this.sleep(1000);
          }

          this.log(`竞技场战斗流程结束，共执行 ${battleCount} 场`);
          return true;
        },
      });
    }

    // 3. BOSS
    if (settings.bossTimes > 0) {
      let alreadyLegionBoss = statistics["legion:boss"] ?? 0;
      if (isTodayAvailable(statisticsTime["legion:boss"])) {
        alreadyLegionBoss = 0;
      }
      const remainingLegionBoss = Math.max(
        settings.bossTimes - alreadyLegionBoss,
        0,
      );

      if (remainingLegionBoss > 0) {
        taskList.push({
          name: "军团BOSS阵容检查",
          checkOnly: true,
          execute: () =>
            this.switchToFormationIfNeeded(
              tokenId,
              settings.bossFormation,
              "BOSS阵容",
            ),
        });
        for (let i = 0; i < remainingLegionBoss; i++) {
          taskList.push({
            name: `军团BOSS ${i + 1}/${remainingLegionBoss}`,
            execute: () =>
              this.executeGameCommand(
                tokenId,
                "fight_startlegionboss",
                {},
                `军团BOSS ${i + 1}`,
                12000,
              ),
          });
        }
      }
    }

    const todayBossId = getTodayBossId(roleData.dailyTask.dailyTime);
    taskList.push({
      name: "每日BOSS阵容检查",
      checkOnly: true,
      execute: () =>
        this.switchToFormationIfNeeded(
          tokenId,
          settings.bossFormation,
          "BOSS阵容",
        ),
    });
    for (let i = 0; i < 3; i++) {
      taskList.push({
        name: `每日BOSS ${i + 1}/3`,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "fight_startboss",
            { bossId: todayBossId },
            `每日BOSS ${i + 1}`,
            12000,
          ),
      });
    }

    // 4. 固定奖励
    const fixedRewards = [
      ...(Object.values(roleData.signInReward ?? {}).some(
        (stamp) => !isTodayAvailable(stamp),
      )
        ? []
        : [{ name: "福利签到", cmd: "system_signinreward" }]),
      ...(isTodayAvailable(statisticsTime["legion:sign:in"])
        ? [{ name: "俱乐部", cmd: "legion_signin" }]
        : []),
      { name: "领取每日礼包", cmd: "discount_claimreward" },
      ...(isTodayAvailable(roleData.cardTime?.[1]?.lastClaimTime)
        ? [{ name: "领取免费礼包", cmd: "card_claimreward" }]
        : []),
      ...(isTodayAvailable(roleData.cardTime?.[4003]?.lastClaimTime)
        ? [
            {
              name: "领取永久卡礼包",
              cmd: "card_claimreward",
              params: { cardId: 4003 },
            },
          ]
        : []),
    ];

    if (settings.claimEmail) {
      fixedRewards.push({
        name: "领取邮件奖励",
        cmd: "mail_claimallattachment",
      });
    }

    fixedRewards.forEach((reward) => {
      taskList.push({
        name: reward.name,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            reward.cmd,
            reward.params || {},
            reward.name,
          ),
      });
    });

    taskList.push({
      name: "开始领取珍宝阁礼包",
      execute: () =>
        this.executeGameCommand(
          tokenId,
          "collection_goodslist",
          {},
          "开始领取珍宝阁礼包",
        ),
    });
    taskList.push({
      name: "领取珍宝阁免费礼包",
      execute: () =>
        this.executeGameCommand(
          tokenId,
          "collection_claimfreereward",
          {},
          "领取珍宝阁免费礼包",
        ),
    });

    if (
      settings.freeGachaEnable !== false &&
      isTodayAvailable(statistics["gacha:free"])
    ) {
      taskList.push({
        name: "免费扭蛋",
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "gacha_drawreward",
            { num: 1, isGroup: false },
            "免费扭蛋",
          ),
      });
    }

    // 5. 免费活动
    if (isTodayAvailable(statistics["artifact:normal:lottery:time"])) {
      for (let i = 0; i < 3; i++) {
        taskList.push({
          name: `免费钓鱼 ${i + 1}/3`,
          execute: () =>
            this.executeGameCommand(
              tokenId,
              "artifact_lottery",
              { lotteryNumber: 1, newFree: true, type: 1 },
              `免费钓鱼 ${i + 1}`,
            ),
        });
      }
    }

    const kingdoms = ["魏国", "蜀国", "吴国", "群雄"];
    for (let gid = 1; gid <= 4; gid++) {
      if (isTodayAvailable(statisticsTime[`genie:daily:free:${gid}`])) {
        taskList.push({
          name: `${kingdoms[gid - 1]}灯神免费扫荡`,
          execute: () =>
            this.executeGameCommand(
              tokenId,
              "genie_sweep",
              { genieId: gid },
              `${kingdoms[gid - 1]}灯神免费扫荡`,
            ),
        });
      }
    }

    const claimedSweepTickets = isTodayAvailable(
      statisticsTime["genie:sweep:buy"],
    )
      ? 0
      : Math.max(Number(statistics["genie:sweep:buy"]) || 0, 0);
    for (let i = claimedSweepTickets; i < 3; i++) {
      taskList.push({
        name: `领取免费扫荡卷 ${i + 1}/3`,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "genie_buysweep",
            {},
            `领取免费扫荡卷 ${i + 1}`,
          ),
      });
    }

    // 6. 黑市
    if (!isTaskCompleted(12) && settings.blackMarketPurchase) {
      taskList.push({
        name: "黑市购买1次物品",
        condition: 12,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "store_purchase",
            { goodsId: 1 },
            "黑市购买1次物品",
          ),
      });
    }

    // 咸王梦境
    const mengyandayOfWeek = new Date(
      (roleData.dailyTask.dailyTime + 8 * 60 * 60) * 1000,
    ).getUTCDay();
    if ([0, 1, 3, 4].includes(mengyandayOfWeek)) {
      const mjbattleTeam = { 0: 107 };
      taskList.push({
        name: "咸王梦境",
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "dungeon_selecthero",
            { battleTeam: mjbattleTeam },
            "咸王梦境",
          ),
      });
    }

    // 深海灯神
    if (
      mengyandayOfWeek === 1 &&
      isTodayAvailable(statisticsTime[`genie:daily:free:5`])
    ) {
      taskList.push({
        name: "深海灯神",
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "genie_sweep",
            { genieId: 5, sweepCnt: 1 },
            "深海灯神",
          ),
      });
    }

    // Task IDs are mapped by the official config, not by completion-condition IDs.
    for (const definition of this.taskConfig.tasks) {
      taskList.push({
        name: `领取任务积分${definition.id}`,
        claimCondition: definition.completeCondition,
        execute: () =>
          this.executeGameCommand(
            tokenId,
            "task_claimdailypoint",
            { taskId: definition.id },
            `领取任务积分${definition.id}`,
            5000,
          ),
      });
    }

    let pointRewardsStarted = false;
    for (const weekly of [false, true]) {
      taskList.push({
        name: weekly ? "领取周常任务奖励" : "领取日常任务奖励",
        execute: async () => {
          if (!pointRewardsStarted && this.roleStateDirty)
            await this.refreshServerRole(tokenId);
          pointRewardsStarted = true;
          const definitions = weekly
            ? this.taskConfig.weeklyRewards
            : this.taskConfig.dailyRewards;
          const ids = getClaimablePointRewards(
            this.roleData.dailyTask,
            definitions,
            weekly,
          );
          for (const rewardId of ids) {
            this.throwIfInterrupted(tokenId);
            await this.executeGameCommand(
              tokenId,
              weekly ? "task_claimweekreward" : "task_claimdailyreward",
              { rewardId },
              `领取${weekly ? "周常" : "日常"}积分奖励${rewardId}`,
            );
          }
        },
      });
    }
    taskList.push({
      name: "领取通行证奖励",
      execute: () =>
        this.executeGameCommand(
          tokenId,
          "activity_recyclewarorderrewardclaim",
          { actId: 1 },
          "领取通行证奖励",
        ),
    });

    const summary = { completed: 0, skipped: 0, failed: 0, deferred: 0 };
    let supplementalIncomplete = 0;
    const attemptedConditions = new Set();
    const attemptedClaims = new Set();
    const totalTasks = taskList.length;
    this.log(`共有 ${totalTasks} 个步骤；每日任务按本轮服务器详情补差`);
    let claimsStarted = false;
    try {
      for (let i = 0; i < taskList.length; i++) {
        this.throwIfInterrupted(tokenId);
        const task = taskList[i];
        this.activeCondition = task.condition ?? task.claimCondition;
        try {
          if (task.claimCondition !== undefined && !claimsStarted) {
            if (this.roleStateDirty) await this.refreshServerRole(tokenId);
            claimsStarted = true;
          }
          if (this.activeCondition !== undefined) {
            const previous = this.getTaskState(this.activeCondition);
            if (
              task.claimCondition !== undefined
                ? previous.status !== "claimable"
                : previous.status !== "pending"
            ) {
              this.log(`跳过 ${task.name}: 服务器任务列表确认无需执行`);
              summary.skipped++;
              continue;
            }
          }
          if (task.condition !== undefined)
            attemptedConditions.add(task.condition);
          if (task.claimCondition !== undefined)
            attemptedClaims.add(task.claimCondition);
          this.log(`执行中: ${task.name}`);
          const result = await task.execute();
          if (
            result === false &&
            this.activeCondition === undefined &&
            !task.checkOnly
          ) {
            summary.deferred++;
            supplementalIncomplete++;
          } else summary.completed++;
          this.log(
            `${task.name}: ${result === false && !task.checkOnly ? "待继续" : task.condition !== undefined || task.claimCondition !== undefined ? "已执行，等待集中核对服务器状态" : "已处理"}`,
            "info",
          );
          await this.sleep(this.delaySettings.taskDelay);
        } catch (error) {
          if (error.interrupted) throw error;
          summary.failed++;
          if (this.activeCondition === undefined) supplementalIncomplete++;
          this.log(`任务执行失败: ${task.name} - ${error.message}`, "error");
          // Match the original runner: a business rejection fails this step only.
          if (
            !error.serverStateUnavailable &&
            /服务器错误:\s*\d+/.test(error.message || "") &&
            !/\b(?:200400|12400000)\b/.test(error.message || "")
          ) {
            this.throwIfInterrupted(tokenId);
            continue;
          }
          throw error;
        } finally {
          this.activeCondition = undefined;
          this.log(
            `本轮步骤处理进度: ${i + 1}/${totalTasks}（${Math.floor(((i + 1) / totalTasks) * 100)}%），跳过 ${summary.skipped} 项，失败 ${summary.failed} 项`,
          );
        }
      }
    } finally {
      if (
        this.formationChanged &&
        this.originalFormation !== undefined &&
        (!this.tokenStore.getWebSocketStatus ||
          this.tokenStore.getWebSocketStatus(tokenId) === "connected")
      ) {
        this.restoringFormation = true;
        try {
          await this.switchToFormationIfNeeded(
            tokenId,
            this.originalFormation,
            "初始阵容",
          );
        } catch (error) {
          this.log(`阵容还原失败: ${error.message}`, "warning");
        } finally {
          this.restoringFormation = false;
        }
      }
    }
    await this.refreshServerRole(tokenId);
    const serverTasks = getDailyTaskStates(this.roleData, this.taskConfig);
    for (const state of serverTasks) {
      if (
        (attemptedConditions.has(state.condition) &&
          state.status === "pending") ||
        (attemptedClaims.has(state.condition) && state.status !== "claimed")
      )
        summary.deferred++;
    }
    summary.remainingTasks = serverTasks.filter(
      (task) => task.status === "pending",
    ).length;
    summary.unclaimedTasks = serverTasks.filter(
      (task) => task.status === "claimable",
    ).length;
    summary.remainingRewards = [false, true].reduce(
      (count, weekly) =>
        count +
        getClaimablePointRewards(
          this.roleData.dailyTask,
          weekly ? this.taskConfig.weeklyRewards : this.taskConfig.dailyRewards,
          weekly,
        ).length,
      0,
    );
    summary.incomplete =
      summary.remainingTasks +
      summary.unclaimedTasks +
      summary.remainingRewards +
      supplementalIncomplete;
    this.log(
      summary.incomplete
        ? `本轮结束，${summary.incomplete} 个步骤未确认完成；下次重新读取服务器任务列表`
        : "本轮服务器任务补差结束",
      summary.incomplete ? "warning" : "success",
    );
    return summary;
  }
}
