/**
 * 怪异塔（evotower_*）跨账号限流。
 *
 * 服务器对 evotower_* 命令有频控，超限返回业务码 400340。多账号并行爬塔时，
 * 每轮战斗后每个账号会连发 getinfo/claimtask/claimreward，同秒齐发即触发
 * 400340 风暴（2026-10-13 13:26 批量爬塔日志：10 账号同一秒集中报 400340）。
 *
 * 模型与 apexRateLimit 同源（AIMD 自适应冷却 + 全局最小间隔）：
 *   · 被 400340 打回 → 间隔估计值「乘性放大」est *= EST_GROW
 *   · 连续成功 N 次  → 估计值「加性下调」est -= EST_SHRINK（有下限）
 * 估计值收敛到服务器真实冷却，既不更快（避免 400340）也不更慢（不浪费时间）。
 *
 * 战斗命令（evotower_readyfight / evotower_fight）不进限流：单场战斗服务端
 * 耗时数秒且天然把各账号错开，量级也远小于查询/领奖；战斗中的 400340 仍由
 * climbWeirdTower 既有的退避重试兜底。
 *
 * ⚠️ 排队耗时不计入响应超时：等待发生在 sendMessageWithPromise 调用之前，
 * 其超时只覆盖服务器响应本身。
 */

/** 命令分类 */
export const TowerAction = {
  /** evotower_getinfo（只读查询） */
  INFO: "info",
  /** evotower_claimtask / evotower_claimreward（领奖） */
  CLAIM: "claim",
};

/** 任意两条被限流命令之间的全局最小间隔（ms，跨账号） */
const MIN_CMD_GAP = { info: 250, claim: 300 };

/** 间隔估计值下限（ms）：低于此值基本必被打回 */
const EST_FLOOR = { info: 350, claim: 400 };

/** 间隔估计值上限（ms）：超过 10s 多为异常/全局限流，不再无脑拉长 */
const EST_CEIL = 10000;

/** 间隔估计初始值（ms） */
const EST_DEFAULT = { info: 450, claim: 500 };

/** 排期余量（ms）：避免贴边触发 400340 */
const EST_MARGIN = 150;

/** 400340 后的乘性放大系数 */
const EST_GROW = 1.5;

/** 连续成功后每次下调的步长（ms） */
const EST_SHRINK = 100;

/** 连续成功多少次才下调一次（避免在边界上反复抖动） */
const OK_BEFORE_SHRINK = 5;

/** 单条命令 400340 后的最大自动重试次数 */
const MAX_RETRY = 3;

/** 估计值持久化键（跨会话沿用学习结果） */
const STORE_KEY = "tower:estCooldown:v1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 判断错误是否为服务器限流（400340/200400）。
 * @param {unknown} e 捕获到的异常
 * @returns {boolean} 是限频错误时为 true
 */
export const isTowerRateLimited = (e) =>
  /400340|200400/.test(e && e.message ? e.message : String(e));

/** 读取持久化的间隔估计值；不可用时退回初始值 */
const loadEst = () => {
  const defaults = { ...EST_DEFAULT };
  try {
    if (typeof localStorage === "undefined") return defaults;
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    for (const key of Object.keys(defaults)) {
      if (Number.isFinite(saved[key])) {
        defaults[key] = clampEst(key, saved[key]);
      }
    }
  } catch {
    /* localStorage 不可用时退回初始值 */
  }
  return defaults;
};

const clampEst = (key, val) =>
  Math.min(EST_CEIL, Math.max(EST_FLOOR[key] ?? 300, Math.round(val)));

const persistEst = () => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...est }));
    }
  } catch {
    /* ignore */
  }
};

const est = loadEst();
/** 各排期键下一次允许发送的时刻（时间戳，ms） */
const nextAllowedAt = {};
/** 各排期键连续成功次数 */
const okStreak = {};
/** 最近一条被限流命令的发出时刻（全局最小间隔基准） */
let lastSentAt = 0;

/** 距下一次可发送还需等待的毫秒数 */
const cooldownLeft = (key) =>
  Math.max(
    0,
    (nextAllowedAt[key] ?? 0) - Date.now(),
    lastSentAt + (MIN_CMD_GAP[key] ?? 250) - Date.now(),
  );

const scheduleNext = (sk, key) => {
  nextAllowedAt[sk] = Date.now() + est[key] + EST_MARGIN;
};

/** 发送成功：连续成功达阈值则下调估计值，向服务器真实冷却收敛 */
const onSuccess = (sk, key) => {
  okStreak[sk] = (okStreak[sk] ?? 0) + 1;
  if (okStreak[sk] >= OK_BEFORE_SHRINK) {
    est[key] = clampEst(key, est[key] - EST_SHRINK);
    okStreak[sk] = 0;
    persistEst();
  }
};

/** 被限流（400340）：乘性放大估计值 */
const onRateLimited = (sk, key) => {
  okStreak[sk] = 0;
  est[key] = clampEst(key, est[key] * EST_GROW);
  persistEst();
};

/** 全局串行队列：同一时刻只允许一条被限流命令在途，杜绝并发突发 */
let chain = Promise.resolve();
const serialize = (task) => {
  const run = chain.then(task, task);
  chain = run.then(
    () => {},
    () => {},
  );
  return run;
};

/**
 * 发送一条怪异塔命令（自动排队 + 400340 自适应退避重试）。
 *
 * info 类全局串行（查询突发是 400340 风暴的主力）；claim 类按账号并行、
 * 跨账号仍受全局最小间隔约束。学习值按动作全局共享——任一账号被打回都会
 * 全局退避，自收敛。
 *
 * @param {string} kind 动作类型（TowerAction）
 * @param {Function} task 实际发送函数，返回 Promise
 * @param {object} [opt] 选项
 * @param {string} [opt.scope] 账号维度（tokenId），claim 类并行排期粒度
 * @param {Function} [opt.onLimited] 每次 400340 被打回时的回调（用于日志）
 * @returns {Promise<*>} task 的返回值
 * @throws {Error} 重试耗尽或遇到非限流错误时抛出原始异常
 */
export const runTowerCommand = async (
  kind,
  task,
  { scope = "", onLimited } = {},
) => {
  const sk = kind === TowerAction.CLAIM && scope ? `${kind}:${scope}` : kind;
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      const wait = cooldownLeft(kind);
      if (wait > 0) await sleep(wait);
      lastSentAt = Date.now();
      try {
        const res = await task();
        onSuccess(sk, kind);
        scheduleNext(sk, kind);
        return res;
      } catch (e) {
        if (!isTowerRateLimited(e)) {
          okStreak[sk] = 0;
          scheduleNext(sk, kind);
          throw e;
        }
        onRateLimited(sk, kind);
        scheduleNext(sk, kind);
        if (attempt >= MAX_RETRY) {
          throw e;
        }
        onLimited?.(Math.min(est[kind] + EST_MARGIN, EST_CEIL));
        await sleep(Math.min(est[kind] + EST_MARGIN, EST_CEIL));
      }
    }
  };
  if (kind === TowerAction.CLAIM && scope) return run();
  return serialize(run);
};
