/**
 * 后台推关执行器（Node 常驻）。
 *
 * 为什么要有它：
 *   浏览器端的推关依赖页面定时器，标签页切到后台会被 Chrome 节流（心跳停发、
 *   等待被拉长），导致掉线或卡住。把循环搬到 Node 后，浏览器只负责展示，
 *   关掉页面也不影响继续推。
 *
 * 流程（与前端 runOneBattle 一致）：
 *   fight_calcleveltime 取本场战斗时长 → 等待 → fight_level 结算 → 胜利升级 / 失败重试
 *
 * 状态全部放在内存：进程重启即清空，不自动续推（避免异常后反复开打消耗次数）。
 */
import { Buffer } from "node:buffer";
import { GameClient } from "./gameClient.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 每个账号保留的日志条数 */
const LOG_KEEP = 500;

/** 连续异常达到这个次数就重连一次 */
const RECONNECT_AFTER_ERRORS = 5;

/** 默认推关参数（与前端一致） */
const DEFAULT_OPTIONS = {
  /** 战斗失败多少次暂停（服务器正常返回"打不过"不算异常，几乎不触发） */
  maxRetries: 999999,
  /** 连续连接异常多少次暂停（连不上/被踢/超时这类才算） */
  maxConsecutiveErrors: 10,
  /** 达到该关卡后停止；0 表示不限制 */
  maxLevel: 0,
};

/** 从响应里按候选字段名取数字 */
function pickNumber(...values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
}

/** 从各种嵌套结构里取消息体 */
function responseBody(response) {
  if (!response) return {};
  return response.body || response.data || response;
}

/** 把错误整理成一句人话 */
function sanitizeError(error) {
  return String(error?.message || error || "未知错误").slice(0, 200);
}

/**
 * 推关执行器。一个实例管理所有账号的推关任务。
 */
export class PushingRunner {
  /**
   * @param {object} deps
   * @param {(level: string, source: string, message: string, extra?: object) => void} deps.log 全局日志
   * @param {() => Promise<Array<object>>} deps.loadTokens 读取 token 列表
   */
  constructor({ log, loadTokens }) {
    this.log = log || (() => {});
    this.loadTokens = loadTokens;
    /** @type {Map<string, object>} tokenId → 运行态 */
    this.runs = new Map();
    /** 每个 token 的日志游标自增 */
    this.seq = 0;
  }

  /** 记录一条账号级日志，同时写进全局日志 */
  #appendLog(run, text, level = "info") {
    this.seq += 1;
    run.logs.push({ seq: this.seq, time: Date.now(), level, text });
    if (run.logs.length > LOG_KEEP) run.logs.splice(0, run.logs.length - LOG_KEEP);
    this.log(level === "error" ? "ERROR" : "INFO", "pushing", `[${run.name}] ${text}`, {
      tokenId: run.tokenId,
    });
  }

  /**
   * 对外：开始推关。
   * token 有两种来源：
   *   1. 传 tokens（前端直传完整 token 数据）—— 本地/未配置 Supabase 时用
   *   2. 只传 tokenIds —— 后端从 token 库读取（生产环境）
   * @param {{tokenIds?: string[], tokens?: object[], options?: object}} payload 启动参数
   * @returns {Promise<{ok: boolean, started?: object[], error?: string}>} ok 表示是否至少启动了一个账号
   */
  async start(payload = {}) {
    const { tokenIds = [], tokens = [], options = {} } = payload;
    const opts = { ...DEFAULT_OPTIONS, ...options };

    let targets = [];
    if (Array.isArray(tokens) && tokens.length) {
      targets = tokens;
    } else {
      const all = await this.loadTokens();
      targets = all.filter((token) => tokenIds.map(String).includes(String(token.id)));
    }
    if (!targets.length) {
      return { ok: false, error: "没有找到匹配的 token" };
    }

    const started = [];
    for (const token of targets) {
      const existing = this.runs.get(token.id);
      if (existing && (existing.status === "running" || existing.status === "connecting")) {
        started.push({ tokenId: token.id, name: token.name, skipped: true });
        continue;
      }

      const run = {
        tokenId: token.id,
        name: token.name || token.id,
        status: "connecting",
        level: 0,
        bossName: "",
        battles: 0,
        wins: 0,
        losses: 0,
        retries: 0,
        consecutiveErrors: 0,
        startedAt: Date.now(),
        stoppedAt: null,
        lastError: "",
        /** 本场预计时长（秒） */
        battleTime: 0,
        /** 本场开始时间戳；0 表示当前不在战斗中 */
        battleStartedAt: 0,
        options: opts,
        stopFlag: false,
        logs: [],
        client: null,
        /** 启动时的原始 token 记录，重连直接复用，不再去查 token 库 */
        rawToken: token,
        /** 连接级心跳定时器 */
        heartbeatTimer: null,
      };
      this.runs.set(token.id, run);
      this.#appendLog(run, `开始后台推关（最多失败 ${opts.maxRetries} 次）`, "info");

      // 后台跑，不阻塞接口返回
      this.#runLoop(run, token).catch((error) => {
        // #runLoop 内部已记录并收尾，这里只兜底未捕获的情况
        run.status = "error";
        run.stoppedAt = run.stoppedAt || Date.now();
        run.lastError = sanitizeError(error);
      });

      started.push({ tokenId: token.id, name: run.name });
    }

    return { ok: true, started };
  }

  /** 对外：停止某个账号 */
  stop(tokenId) {
    const run = this.runs.get(tokenId);
    if (!run) return { ok: false, error: "该账号没有推关任务" };
    if (run.status !== "running" && run.status !== "connecting") {
      return { ok: false, error: "该账号当前未在推关" };
    }
    run.stopFlag = true;
    this.#appendLog(run, "收到停止指令，当前这场结束后退出", "warning");
    return { ok: true };
  }

  /** 对外：停止全部 */
  stopAll() {
    let count = 0;
    for (const run of this.runs.values()) {
      if (run.status === "running" || run.status === "connecting") {
        run.stopFlag = true;
        this.#appendLog(run, "收到停止指令，当前这场结束后退出", "warning");
        count += 1;
      }
    }
    return { ok: true, count };
  }

  /** 对外：状态列表（不含日志，避免响应过大） */
  getStatus() {
    const rows = [];
    for (const run of this.runs.values()) {
      rows.push({
        tokenId: run.tokenId,
        name: run.name,
        status: run.status,
        level: run.level,
        bossName: run.bossName,
        battles: run.battles,
        wins: run.wins,
        losses: run.losses,
        lastError: run.lastError,
        battleTime: run.battleTime,
        battleStartedAt: run.battleStartedAt,
        startedAt: run.startedAt,
        stoppedAt: run.stoppedAt,
        elapsedMs: (run.stoppedAt || Date.now()) - run.startedAt,
        logCount: run.logs.length,
      });
    }
    // 运行中的排前面，其次按开始时间倒序
    rows.sort((a, b) => {
      const rank = (s) => (s === "running" || s === "connecting" ? 0 : 1);
      return rank(a.status) - rank(b.status) || b.startedAt - a.startedAt;
    });
    return rows;
  }

  /** 对外：增量拉日志（after 为上次拿到的 seq） */
  getLogs(tokenId, after = 0) {
    const run = this.runs.get(tokenId);
    if (!run) return { ok: false, error: "该账号没有推关任务", logs: [] };
    return {
      ok: true,
      status: run.status,
      logs: run.logs.filter((item) => item.seq > after),
    };
  }

  /**
   * 解析 token：前端存的是 base64（解出来可能是 JSON，也可能是纯文�� token）。
   * 同时兼容已解析好的对象（roleToken 直接给出）。
   * @param {object} token 前端传来的 token 记录
   * @returns {{tokenData: object, wsUrl: string|null}} 可直接用于 GameClient 的参数
   */
  #resolveToken(token) {
    let actualToken = token.token || token.roleToken || "";
    let meta = {};

    // 前端导入时已经把 base64 解开、把明文 token 存进 token 字段了，
    // 这里默认按明文处理；只有明确是 JSON / base64(JSON) 时才二次解析，
    // 否则会把明文当 base64 解出乱码，连上后立刻被服务端关掉。
    if (typeof actualToken === "string" && actualToken.startsWith("{")) {
      try {
        meta = JSON.parse(actualToken);
        actualToken = meta.token || meta.gameToken || actualToken;
      } catch {
        /* 保持原值 */
      }
    } else if (
      typeof actualToken === "string" &&
      actualToken.length > 40 &&
      /^[a-z0-9+/=]+$/i.test(actualToken)
    ) {
      // 兼容手动粘贴 base64 的场景：只有能解成 JSON 才认为有意义
      try {
        const decoded = Buffer.from(actualToken, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        meta = parsed || {};
        actualToken = meta.token || meta.gameToken || actualToken;
      } catch {
        /* 解不出来就是明文，保持原值 */
      }
    }

    const tokenData = {
      roleToken: actualToken,
      roleId: token.roleId ?? meta.roleId,
      sessId: token.sessId ?? meta.sessId ?? Date.now() * 100,
      connId: token.connId ?? meta.connId ?? Date.now(),
      isRestore: token.isRestore ?? meta.isRestore ?? 0,
      name: token.name,
    };

    const wsUrl =
      token.wsUrl ||
      token.ws_url ||
      `wss://xxz-xyzw.hortorgames.com/agent?p=${encodeURIComponent(actualToken)}&e=x&lang=chinese`;

    return { tokenData, wsUrl };
  }

  /** 建连接（失败抛错） */
  async #connect(run, token) {
    const { tokenData, wsUrl } = this.#resolveToken(token);
    const client = new GameClient(tokenData, wsUrl);
    await client.connect(15000);
    run.client = client;
    this.#startHeartbeat(run);
    const fp = String(tokenData.roleToken || "");
    this.#appendLog(
      run,
      `WebSocket 已连接（token ${fp.slice(0, 6)}…${fp.slice(-4)}，长 ${fp.length}）`,
      "info",
    );

    // 取角色信息，顺便拿到当前关卡（失败不阻止，后面 calcleveltime 还会同步）
    try {
      const info = await client.sendWithPromise("role_getroleinfo", {}, 8000);
      const body = responseBody(info);
      const level = pickNumber(body.currLevel, body.levelId, body.role?.level);
      if (level) run.level = level;
    } catch (error) {
      this.#appendLog(run, `获取角色信息失败：${sanitizeError(error)}`, "warning");
    }
    return client;
  }

  /**
   * 连接级心跳：每 25 秒发一次，避免「战斗间隙/空闲」时服务端超时把连接踢掉。
   * 心跳自己失败不影响主流程，真断了由下一次请求暴露出来。
   * @param {object} run 运行态
   */
  #startHeartbeat(run) {
    this.#stopHeartbeat(run);
    run.heartbeatTimer = setInterval(() => {
      try {
        run.client?.send("heart_beat", {}, { respKey: "_sys/ack" });
      } catch {
        /* 忽略，交给业务请求暴露问题 */
      }
    }, 25000);
  }

  /** 停掉心跳定时器 */
  #stopHeartbeat(run) {
    if (run.heartbeatTimer) {
      clearInterval(run.heartbeatTimer);
      run.heartbeatTimer = null;
    }
  }

  /** 断开连接（静默） */
  #disconnect(run) {
    this.#stopHeartbeat(run);
    try {
      run.client?.close?.();
    } catch {
      /* 忽略 */
    }
    run.client = null;
  }

  /** 主循环 */
  async #runLoop(run, token) {
    try {
      await this.#connect(run, token);
      run.status = "running";
      this.#appendLog(run, `当前关卡 ${run.level || "未知"}，开始推关`, "info");

      while (!run.stopFlag) {
        const result = await this.#fightOnce(run);
        if (result.stopped) break;

        // 达到关卡上限
        if (run.options.maxLevel > 0 && run.level >= run.options.maxLevel) {
          this.#appendLog(run, `已达到关卡上限 ${run.options.maxLevel}，停止`, "success");
          run.status = "done";
          break;
        }

        if (!result.success) {
          // 连接异常（连不上/被踢/超时）连续到上限 → 暂停，等着人工排查
          if (run.consecutiveErrors >= run.options.maxConsecutiveErrors) {
            run.status = "paused";
            run.lastError = `连续连接异常 ${run.consecutiveErrors} 次`;
            this.#appendLog(
              run,
              `连续连接异常 ${run.consecutiveErrors} 次，已暂停该账号（请检查网络/token/是否被其他端占用）`,
              "error",
            );
            break;
          }
          // 战斗失败（服务器正常判定打不过）：不计入异常，继续打
          if (run.retries >= run.options.maxRetries) {
            run.status = "paused";
            run.lastError = `连续战斗失败 ${run.retries} 次`;
            this.#appendLog(run, `连续战斗失败 ${run.retries} 次，已暂停`, "warning");
            break;
          }
          await sleep(3000);
        } else {
          await sleep(2000);
        }
      }

      if (run.status === "running") run.status = "stopped";
    } catch (error) {
      run.status = "error";
      run.lastError = sanitizeError(error);
      this.#appendLog(run, `推关异常退出：${run.lastError}`, "error");
    } finally {
      this.#disconnect(run);
      run.stoppedAt = Date.now();
      const elapsed = Math.round((run.stoppedAt - run.startedAt) / 1000);
      this.#appendLog(
        run,
        `推关结束：${run.wins} 胜 ${run.losses} 负，共 ${run.battles} 场，耗时 ${elapsed}s`,
        run.wins > 0 ? "success" : "warning",
      );
    }
  }

  /**
   * 打一场：
   *   calcleveltime 取时长 → 等待 → fight_level 结算。
   * @returns {Promise<{success?: boolean, stopped?: boolean, error?: string}>} success 表示本场是否胜利，stopped 表示被手动停止
   */
  async #fightOnce(run) {
    if (!run.client) {
      try {
        const token = run.rawToken || (await this.#findToken(run.tokenId));
        if (!token) throw new Error("token 已不存在");
        await this.#connect(run, token);
      } catch (error) {
        run.consecutiveErrors += 1;
        run.lastError = sanitizeError(error);
        this.#appendLog(
          run,
          `重连失败（连续异常 ${run.consecutiveErrors} 次）：${run.lastError}`,
          "error",
        );
        return { success: false, error: run.lastError };
      }
    }
    const client = run.client;

    // 1) 取战斗时长（顺带同步关卡）
    let battleTime = 0;
    try {
      const response = await client.sendWithPromise("fight_calcleveltime", {}, 15000);
      const body = responseBody(response);
      battleTime = pickNumber(body.battleTime, body.body?.battleTime) || 0;
      const level = pickNumber(body.currLevel, body.levelId, body.body?.currLevel);
      const bossName = body.bossName || body.body?.bossName || "";
      if (level && level !== run.level) {
        run.level = level;
        this.#appendLog(run, `关卡同步：第 ${level} 关`, "info");
      }
      if (bossName && bossName !== run.bossName) {
        run.bossName = bossName;
        this.#appendLog(run, `BOSS：${bossName}`, "info");
      }
    } catch (error) {
      run.losses += 1;
      run.retries += 1;
      run.consecutiveErrors += 1;
      run.lastError = sanitizeError(error);
      const hint = /未连接|关闭|closed/i.test(run.lastError)
        ? "（连接被断开：同账号可能正在浏览器或其他客户端在线，请先断开那边）"
        : "";
      this.#appendLog(
        run,
        `计算战斗时长失败（连续异常 ${run.consecutiveErrors} 次）：${run.lastError}${hint}`,
        "error",
      );
      await this.#maybeReconnect(run);
      return { success: false, error: run.lastError };
    }

    if (battleTime <= 0) {
      run.losses += 1;
      run.retries += 1;
      run.consecutiveErrors += 1;
      run.lastError = "服务器未返回战斗时长";
      this.#appendLog(
        run,
        `服务器未返回战斗时长（连续异常 ${run.consecutiveErrors} 次）`,
        "error",
      );
      await this.#maybeReconnect(run);
      return { success: false, error: run.lastError };
    }

    run.battles += 1;
    run.battleTime = battleTime;
    run.battleStartedAt = Date.now();
    this.#appendLog(run, `第 ${run.level || "?"} 关开打，预计 ${battleTime}s`, "info");

    // 2) 等待战斗结束（每秒检查停止标记，每 25 秒补一次心跳）
    const startedAt = Date.now();
    let tick = 0;
    while (!run.stopFlag) {
      const remain = battleTime * 1000 - (Date.now() - startedAt);
      if (remain <= 0) break;
      await sleep(1000);
      tick += 1;
      if (tick % 25 === 0) {
        try {
          client.send("heart_beat", {}, { respKey: "_sys/ack" });
        } catch {
          /* 心跳失败不阻塞战斗等待 */
        }
      }
    }
    if (run.stopFlag) {
      run.battleStartedAt = 0;
      return { stopped: true };
    }

    // 3) 结算
    try {
      const response = await client.sendWithPromise("fight_level", {}, 15000);
      const body = responseBody(response);
      const success = Boolean(body.success || body.isWin);
      const nextLevel = pickNumber(body.currLevel, body.nextLevel, body.levelId);
      const bossName = body.bossName || body.body?.bossName || body.role?.bossName || "";

      run.battleStartedAt = 0;
      if (success) {
        run.wins += 1;
        run.retries = 0;
        run.consecutiveErrors = 0;
        if (nextLevel) run.level = nextLevel;
        else run.level = run.level + 1;
        if (bossName) run.bossName = bossName;
        this.#appendLog(
          run,
          `胜利 → 第 ${run.level} 关${run.bossName ? `（BOSS：${run.bossName}）` : ""}`,
          "success",
        );
        return { success: true };
      }

      run.battleStartedAt = 0;
      run.losses += 1;
      run.retries += 1;
      run.lastError = body.code || body.msg || "服务器判定失败";
      this.#appendLog(run, `失败（连续 ${run.retries} 次）：${run.lastError}`, "warning");
      return { success: false, error: run.lastError };
    } catch (error) {
      run.losses += 1;
      run.retries += 1;
      run.consecutiveErrors += 1;
      run.lastError = sanitizeError(error);
      this.#appendLog(run, `结算异常（连续 ${run.consecutiveErrors} 次）：${run.lastError}`, "error");
      await this.#maybeReconnect(run);
      return { success: false, error: run.lastError };
    }
  }

  /** 连续异常到阈值就重连一次（接近上限时不再折腾，直接让主循环暂停） */
  async #maybeReconnect(run) {
    if (run.consecutiveErrors < RECONNECT_AFTER_ERRORS) return;
    if (run.consecutiveErrors >= run.options.maxConsecutiveErrors) return;
    this.#appendLog(run, `连续异常 ${run.consecutiveErrors} 次，尝试重连`, "warning");
    this.#disconnect(run);
    try {
      const token = run.rawToken || (await this.#findToken(run.tokenId));
      if (!token) throw new Error("token 已不存在");
      await this.#connect(run, token);
      // 注意：这里不清零计数。重连成功不代表链路稳定，
      // 只有真正打赢一场（或正常结算）才清零，否则会永远到不了 10 次上限。
      this.#appendLog(run, "重连成功，继续推关", "success");
    } catch (error) {
      run.lastError = sanitizeError(error);
      this.#appendLog(run, `重连失败：${run.lastError}`, "error");
    }
  }

  /**
   * 按 id 找 token（仅在没拿到 rawToken 时兜底）。
   * 注意：本地没配 Supabase 时 loadTokens 会失败，这里必须兜住，
   * 否则会冒出「Cannot read properties of null (reading 'from')」这种无从下手的报错。
   * @param {string} tokenId 账号 id
   * @returns {Promise<object|null>} 找到的 token 记录，没有则 null
   */
  async #findToken(tokenId) {
    try {
      const all = await this.loadTokens();
      return all.find((token) => token.id === tokenId) || null;
    } catch {
      this.log("WARN", "pushing", "token 库不可用（未配置 Supabase），重连只能用启动时的 token");
      return null;
    }
  }
}
