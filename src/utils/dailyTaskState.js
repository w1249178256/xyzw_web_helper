const configsByVersion = new Map();
const officialConfigBase = "https://xxz-xyzw-res.hortorgames.com";

async function fetchOfficialTaskConfig(version, fetchConfig) {
  const url = `${officialConfigBase}/data/${version}/config.json`;
  try {
    const response = await fetchConfig(url, {
      signal: AbortSignal.timeout(30000),
    });
    if (response.ok) {
      return {
        config: validateDailyTaskConfig(await response.json()),
        failures: [],
      };
    }
    return {
      config: null,
      failures: [
        { host: new URL(officialConfigBase).hostname, status: response.status },
      ],
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      config: null,
      failures: [{ host: new URL(officialConfigBase).hostname, reason }],
    };
  }
}

async function fetchLatestOfficialTaskConfigVersion(fetchConfig) {
  const host = new URL(officialConfigBase).hostname;
  try {
    const response = await fetchConfig(
      `${officialConfigBase}/data/version.json`,
      {
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!response.ok) throw new Error(`${host}: HTTP ${response.status}`);
    const version = (await response.json())?.version;
    if (typeof version === "string" && /^[\w-]+$/.test(version)) return version;
    throw new Error(`${host}: 版本格式无效`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`官方最新任务配置版本读取失败（${reason}）`);
  }
}

function formatOfficialConfigFailures(failures) {
  return failures
    .map(({ host, status, reason }) =>
      status === undefined ? `${host}: ${reason}` : `${host}: HTTP ${status}`,
    )
    .join("；");
}
const activeTokenRuns = new Set();

// The official HangUpInviteDialog exposes four help slots, independently of daily tasks.
const HANG_UP_HELP_SLOTS = 4;

/**
 * Keep daily and hang-up operations for one account from overlapping.
 * @param {string} tokenId Account identity.
 * @param {Function} execute Operation to execute once.
 * @returns {Promise<*>} The operation result; the lock is always released.
 */
export async function runWithDailyTaskLock(tokenId, execute) {
  if (activeTokenRuns.has(tokenId))
    throw new Error("该账号的日常或挂机任务正在执行中");
  activeTokenRuns.add(tokenId);
  try {
    return await execute();
  } finally {
    activeTokenRuns.delete(tokenId);
  }
}

/**
 * Count unexpired help slots using the official client's checkFriendTimeout order.
 * @param {object} role Fresh role_getroleinfo data, including hangUp.helpFriend.
 * @param {number} serverTime Server response timestamp in milliseconds.
 * @returns {{active: number, remaining: number}} Occupied slots and slots to fill.
 * @throws {Error} When the server snapshot or server clock cannot be trusted.
 */
export function getHangUpState(role, serverTime) {
  const hangUp = role?.hangUp;
  const helpers = hangUp?.helpFriend;
  if (
    !Number.isFinite(serverTime) ||
    serverTime <= 0 ||
    !Number.isFinite(hangUp?.checkTime) ||
    hangUp.checkTime < 0 ||
    !Array.isArray(helpers) ||
    helpers.length > HANG_UP_HELP_SLOTS ||
    helpers.some(
      (helper) =>
        !Number.isInteger(helper?.helpTime) ||
        helper.helpTime <= 0 ||
        !Number.isInteger(helper.slot) ||
        helper.slot < 0 ||
        helper.slot >= HANG_UP_HELP_SLOTS,
    ) ||
    new Set(helpers.map((helper) => helper.slot)).size !== helpers.length
  ) {
    const error = new Error("服务器挂机槽位或时间不完整，不能判断加钟状态");
    error.hangUpStateUnavailable = true;
    throw error;
  }
  let elapsed = Math.max(serverTime / 1000 - hangUp.checkTime, 0);
  let active = 0;
  for (const helper of helpers) {
    if (elapsed >= helper.helpTime) elapsed -= helper.helpTime;
    else active++;
  }
  return { active, remaining: HANG_UP_HELP_SLOTS - active };
}

/**
 * Fill only the server's empty help slots, then verify with one fresh snapshot.
 * No local completion cache or automatic write retry is used.
 * @param {object} options Transport, account, cancellation, logging and read/send hooks.
 * @param {object} options.tokenStore Live account transport and connection state.
 * @param {string} options.tokenId Account to query and extend.
 * @param {Function} [options.readRole] Read a fresh role snapshot without retries.
 * @param {Function} [options.sendCommand] Send one hang-up share command.
 * @param {Function} [options.check] Check cancellation before another operation.
 * @param {Function} [options.onLog] Report execution and server verification.
 * @param {Function} [options.sleep] Await the requested delay.
 * @param {number} [options.delay] Delay after each share acknowledgement.
 * @returns {Promise<object>} Sent request count and server-confirmed remaining slots.
 * @throws {Error} On unavailable state, disconnect, cancellation or command failure.
 */
export async function fillHangUpTime({
  tokenStore,
  tokenId,
  readRole = () =>
    tokenStore.sendMessageWithPromise(tokenId, "role_getroleinfo", {}, 15000),
  sendCommand = () =>
    tokenStore.sendMessageWithPromise(
      tokenId,
      "system_mysharecallback",
      { isSkipShareCard: true, type: 2 },
      8000,
    ),
  check = () => {},
  onLog = () => {},
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  delay = 500,
}) {
  let snapshotClient;
  const assertConnected = () => {
    check();
    const status = tokenStore.getWebSocketStatus?.(tokenId);
    if (
      (status && status !== "connected") ||
      (snapshotClient &&
        snapshotClient !== tokenStore.wsConnections?.[tokenId]?.client)
    ) {
      const error = new Error(
        "WebSocket 已断开，停止加钟并等待重新读取服务器状态",
      );
      error.interrupted = true;
      throw error;
    }
  };
  const readState = async () => {
    assertConnected();
    // role_getroleinfo is limited independently of the share command.
    await sleep(1000);
    assertConnected();
    const client = tokenStore.wsConnections?.[tokenId]?.client;
    const response = await readRole();
    assertConnected();
    if (client !== tokenStore.wsConnections?.[tokenId]?.client) {
      const error = new Error("连接会话已变化，请重新读取服务器挂机状态");
      error.interrupted = true;
      throw error;
    }
    snapshotClient = client;
    return getHangUpState(response?.role, client?.serverTime);
  };
  const before = await readState();
  if (!before.remaining) {
    onLog("跳过挂机加钟：服务器确认助力槽位已满");
    return { sent: 0, ...before };
  }
  onLog(
    `服务器挂机槽位 ${before.active}/${HANG_UP_HELP_SLOTS}，补加钟 ${before.remaining} 次`,
  );
  for (let i = 0; i < before.remaining; i++) {
    assertConnected();
    onLog(`执行挂机加钟 ${i + 1}/${before.remaining}`);
    await sendCommand();
    assertConnected();
    await sleep(delay);
  }
  const after = await readState();
  onLog(
    after.remaining
      ? `加钟后服务器仍有 ${after.remaining} 个空槽位，保留待继续`
      : "服务器确认挂机加钟已补满",
  );
  return { sent: before.remaining, ...after };
}

/**
 * Load task targets from the official data version returned by the game server.
 * Only immutable configuration is cached; role progress is never cached here.
 * @param {object} tokenStore Live command transport.
 * @param {string} tokenId Selected account identity.
 * @param {Function} [fetchConfig] Fetch implementation for the official CDN.
 * @returns {Promise<object>} Validated task definitions and point-reward thresholds.
 */
export async function loadDailyTaskConfig(
  tokenStore,
  tokenId,
  fetchConfig = globalThis.fetch,
) {
  const response = await tokenStore.sendMessageWithPromise(
    tokenId,
    "system_getdatabundlever",
    {},
    15000,
  );
  const version = response?.dataBundleVer;
  if (typeof version !== "string" || !/^[\w-]+$/.test(version))
    throw new Error("服务器未提供有效的任务配置版本");
  if (!configsByVersion.has(version)) {
    const loading = (async () => {
      const requested = await fetchOfficialTaskConfig(version, fetchConfig);
      if (requested.config) return requested.config;

      const requestedVersionUnavailable = requested.failures[0]?.status === 404;
      if (requestedVersionUnavailable) {
        const latestVersion =
          await fetchLatestOfficialTaskConfigVersion(fetchConfig);
        if (latestVersion !== version) {
          const latest = await fetchOfficialTaskConfig(
            latestVersion,
            fetchConfig,
          );
          if (latest.config) return latest.config;
          throw new Error(
            `官方任务配置读取失败（服务器版本 ${version} 已不存在；最新版本 ${latestVersion} 也不可用：${formatOfficialConfigFailures(latest.failures)}）`,
          );
        }
      }
      throw new Error(
        `官方任务配置读取失败（版本 ${version}；${formatOfficialConfigFailures(requested.failures)}）`,
      );
    })();
    configsByVersion.set(version, loading);
    loading.catch(() => {
      if (configsByVersion.get(version) === loading)
        configsByVersion.delete(version);
    });
    for (const key of configsByVersion.keys()) {
      if (key !== version) configsByVersion.delete(key);
    }
  }
  return configsByVersion.get(version);
}

/**
 * Validate official task IDs separately from their completion-condition IDs.
 * @param {object} config Official configuration response.
 * @returns {object} Minimal task and reward configuration.
 * @throws {Error} When targets or reward thresholds cannot be trusted.
 */
export function validateDailyTaskConfig(config) {
  const tasks = Object.values(config?.DailyTaskConf ?? {});
  const dailyRewards = Object.values(config?.DayLimitConf ?? {});
  const weeklyRewards = Object.values(config?.WeekLimitConf ?? {});
  if (
    !tasks.length ||
    !dailyRewards.length ||
    !weeklyRewards.length ||
    tasks.some(
      (task) =>
        !Number.isInteger(task.id) ||
        task.id <= 0 ||
        !Number.isInteger(task.completeCondition) ||
        task.completeCondition <= 0 ||
        !Number.isInteger(task.completeValue) ||
        task.completeValue <= 0,
    ) ||
    new Set(tasks.map((task) => task.id)).size !== tasks.length ||
    new Set(tasks.map((task) => task.completeCondition)).size !==
      tasks.length ||
    [dailyRewards, weeklyRewards].some(
      (rewards) =>
        new Set(rewards.map((reward) => reward.id)).size !== rewards.length,
    ) ||
    [...dailyRewards, ...weeklyRewards].some(
      (reward) =>
        !Number.isInteger(reward.id) ||
        reward.id <= 0 ||
        !Number.isFinite(reward.limit) ||
        reward.limit < 0,
    )
  )
    throw new Error("官方每日任务配置无效，停止执行");
  const claimSeconds = config?.ConstantConf?.stayRewardTime;
  return {
    tasks,
    dailyRewards,
    weeklyRewards,
    ...(Number.isFinite(claimSeconds) && claimSeconds > 0
      ? { hangUpClaimInterval: claimSeconds * 1000 }
      : {}),
  };
}

/**
 * Decode a freshly fetched role's daily progress, including unclaimed completion.
 * Missing counters in an otherwise valid server map represent zero progress.
 * @param {object} role Role returned by the live role_getroleinfo response.
 * @param {object} config Validated official definitions.
 * @returns {Array<object>} Pending, claimable or claimed tasks with remaining counts.
 * @throws {Error} When the server snapshot is incomplete or malformed.
 */
export function getDailyTaskStates(role, config) {
  const daily = role?.dailyTask;
  if (
    !Number.isFinite(daily?.dailyTime) ||
    daily.dailyTime <= 0 ||
    !daily.complete ||
    typeof daily.complete !== "object" ||
    Array.isArray(daily.complete)
  )
    throw new Error("服务器任务列表不完整，不能判断完成状态");
  return config.tasks.map((task) => {
    const value = Object.hasOwn(daily.complete, task.completeCondition)
      ? daily.complete[task.completeCondition]
      : 0;
    if (!Number.isInteger(value) || value < -1)
      throw new Error("服务器任务进度无效，停止执行");
    const claimed = value === -1;
    const progress = claimed ? task.completeValue : value;
    return {
      id: task.id,
      condition: task.completeCondition,
      required: task.completeValue,
      progress,
      remaining: Math.max(task.completeValue - progress, 0),
      status: claimed
        ? "claimed"
        : progress >= task.completeValue
          ? "claimable"
          : "pending",
    };
  });
}

/**
 * Determine point rewards from the server's point total and claimed-reward map.
 * @param {object} daily Server dailyTask data.
 * @param {Array<object>} definitions Official reward IDs and thresholds.
 * @param {boolean} [weekly] Select weekPoint/weekReward instead of daily fields.
 * @returns {Array<number>} Only eligible, unclaimed server reward IDs.
 */
export function getClaimablePointRewards(daily, definitions, weekly = false) {
  const points = daily?.[weekly ? "weekPoint" : "dailyPoint"];
  const claimed = daily?.[weekly ? "weekReward" : "dailyReward"];
  if (
    !Number.isFinite(points) ||
    !claimed ||
    typeof claimed !== "object" ||
    Array.isArray(claimed) ||
    Object.values(claimed).some((value) => typeof value !== "boolean")
  )
    throw new Error("服务器积分奖励状态不完整");
  return definitions
    .filter((reward) => points >= reward.limit && claimed[reward.id] !== true)
    .map((reward) => reward.id);
}
