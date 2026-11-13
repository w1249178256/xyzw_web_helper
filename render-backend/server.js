import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
/**
 * XYZW 游戏自动化后端 - Express + Supabase + Render
 */
import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
import { createApiKeyMiddleware } from "./lib/apiKeyAuth.js";
import { GameClient } from "./lib/gameClient.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== 工具函数 ====================
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const app = express();
app.use(cors());
app.use(express.json());

// ==================== Supabase 客户端 ====================
// 本地只跑「前端埋点日志」时不需要 Supabase；缺配置时置空，
// 相关路由统一返回 503，而不是让整个进程起不来。
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ==================== 任务定义 ====================
const TASK_DEFINITIONS = {
  signIn: {
    name: "签到",
    commands: [{ cmd: "system_signinreward", params: {} }],
  },
  claimHangup: {
    name: "领取挂机奖励",
    commands: [{ cmd: "system_claimhangupreward", params: {} }],
  },
  claimDaily: {
    name: "领取日常奖励",
    commands: [{ cmd: "task_claimdailyreward", params: { rewardId: 0 } }],
  },
  claimDailyPoint: {
    name: "领取每日积分",
    commands: [{ cmd: "task_claimdailypoint", params: { taskId: 1 } }],
  },
  climbTower: {
    name: "爬塔领奖励",
    commands: [
      { cmd: "tower_getinfo", params: {} },
      { cmd: "tower_claimreward", params: {} },
    ],
  },
  climbWeirdTower: {
    name: "怪异塔",
    commands: [
      { cmd: "evotower_getinfo", params: {} },
      { cmd: "evotower_claimreward", params: {} },
    ],
  },
  arenaFight: {
    name: "竞技场",
    commands: [
      { cmd: "arena_startarea", params: {} },
      { cmd: "arena_getareatarget", params: { refresh: false } },
    ],
  },
  claimMail: {
    name: "领取邮件附件",
    commands: [{ cmd: "mail_claimallattachment", params: { category: 0 } }],
  },
  legacyHangup: {
    name: "功法挂机",
    commands: [
      { cmd: "legacy_getinfo", params: {} },
      { cmd: "legacy_claimhangup", params: {} },
    ],
  },
  heroRecruit: {
    name: "武将招募",
    commands: [
      {
        cmd: "hero_recruit",
        params: { byClub: false, recruitNumber: 1, recruitType: 3 },
      },
    ],
  },
  studyGame: {
    name: "学习问答",
    commands: [{ cmd: "study_startgame", params: {} }],
  },
  genieSweep: {
    name: "灯神",
    commands: [{ cmd: "genie_sweep", params: { genieId: 1 } }],
  },
  openBox: {
    name: "开箱",
    commands: [{ cmd: "item_openbox", params: { itemId: 2001, number: 10 } }],
  },
  legionSignIn: {
    name: "军团签到",
    commands: [
      { cmd: "legion_getinfo", params: {} },
      { cmd: "legion_signin", params: {} },
    ],
  },
  bossTower: {
    name: "咸王宝库",
    commands: [
      { cmd: "bosstower_getinfo", params: {} },
      { cmd: "bosstower_startboss", params: {} },
      { cmd: "bosstower_startbox", params: {} },
    ],
  },
  mergeBox: {
    name: "合并魔盒",
    commands: [
      { cmd: "mergebox_getinfo", params: {} },
      { cmd: "mergebox_claimfreeenergy", params: {} },
      { cmd: "mergebox_openbox", params: {} },
    ],
  },
  dailyBundle: {
    name: "一键日常",
    commands: [
      { cmd: "system_signinreward", params: {} },
      { cmd: "system_claimhangupreward", params: {} },
      { cmd: "task_claimdailyreward", params: { rewardId: 0 } },
      { cmd: "tower_getinfo", params: {} },
      { cmd: "tower_claimreward", params: {} },
      { cmd: "mail_claimallattachment", params: { category: 0 } },
      { cmd: "legacy_getinfo", params: {} },
      { cmd: "legacy_claimhangup", params: {} },
    ],
  },
};

// ==================== 日志存储 ====================
const LOG_MAX = 500;
const logs = [];

// ==================== 日志落盘 ====================
// 全部日志按天写到 render-backend/logs/ 下，方便本地排查：
//   backend-YYYY-MM-DD.log   后端自身日志（JSONL）
//   frontend-YYYY-MM-DD.log  前端埋点日志（JSONL）
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "logs");
const FILE_LOG_ENABLED = process.env.FILE_LOG !== "0";

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function appendFileLine(name, payload) {
  if (!FILE_LOG_ENABLED) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(LOG_DIR, `${name}-${todayStr()}.log`),
      `${JSON.stringify(payload)}\n`,
      "utf8",
    );
  } catch (err) {
    // 写文件失败不能影响主流程，只在控制台提示
    console.error("[log] 写入日志文件失败:", err.message);
  }
}

function addLog(level, category, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    category,
    message,
    ...meta,
  };
  logs.unshift(entry);
  if (logs.length > LOG_MAX) logs.pop();
  console.log(`[${level}] [${category}] ${message}`, meta);
  appendFileLine("backend", entry);
}

// ==================== Token 加载 ====================
async function loadTokens() {
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("enabled", true);
  if (error) {
    addLog("ERROR", "supabase", "加载tokens失败", { error: error.message });
    return [];
  }
  addLog("INFO", "supabase", `加载${data?.length || 0}个tokens`);
  return data || [];
}

// ==================== 任务执行引擎 ====================
async function executeTask(task) {
  addLog("INFO", "task", `开始执行任务: ${task.name}`, { taskId: task.id });

  // 兼容旧字段 token_ids 和新字段 selected_tokens
  let tokenIds = task.selected_tokens || task.token_ids;
  if (typeof tokenIds === "string") {
    try {
      tokenIds = JSON.parse(tokenIds);
    } catch {
      tokenIds = [];
    }
  }
  if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
    addLog("WARN", "task", "没有选中的token，跳过", { taskId: task.id });
    return;
  }

  // 支持多任务：selected_tasks 是数组，每个元素是 TASK_DEFINITIONS 的 key
  let taskKeys = task.selected_tasks;
  if (typeof taskKeys === "string") {
    try {
      taskKeys = JSON.parse(taskKeys);
    } catch {
      taskKeys = [];
    }
  }
  // 兼容旧字段 task_type（单个任务）
  if ((!Array.isArray(taskKeys) || taskKeys.length === 0) && task.task_type) {
    taskKeys = [task.task_type];
  }
  if (!Array.isArray(taskKeys) || taskKeys.length === 0) {
    addLog("ERROR", "task", "没有选择任何任务类型", { taskId: task.id });
    return;
  }

  // 收集所有需要执行的命令（去重）
  const allCommands = [];
  const seenCmds = new Set();
  for (const key of taskKeys) {
    const taskDef = TASK_DEFINITIONS[key];
    if (!taskDef) {
      addLog("WARN", "task", `未知任务类型: ${key}，跳过`, { taskId: task.id });
      continue;
    }
    for (const cmd of taskDef.commands) {
      const cmdKey = cmd.cmd + JSON.stringify(cmd.params);
      if (!seenCmds.has(cmdKey)) {
        seenCmds.add(cmdKey);
        allCommands.push(cmd);
      }
    }
  }
  if (allCommands.length === 0) {
    addLog("ERROR", "task", "没有有效的命令可执行", { taskId: task.id });
    return;
  }

  const allTokens = await loadTokens();
  const targetTokens = allTokens.filter((t) => tokenIds.includes(t.id));
  if (targetTokens.length === 0) {
    addLog("WARN", "task", "没有找到匹配的tokens", { taskId: task.id });
    return;
  }

  addLog("INFO", "task", `将执行于 ${targetTokens.length} 个角色`, {
    taskId: task.id,
  });

  for (const token of targetTokens) {
    let tokenData;
    try {
      tokenData =
        typeof token.token === "string" && token.token.startsWith("{")
          ? JSON.parse(token.token)
          : {
              roleToken: token.token,
              roleId: token.roleId,
              sessId: token.sessId,
              connId: token.connId,
              isRestore: token.isRestore,
            };
    } catch (err) {
      addLog("ERROR", "task", `Token解析失败: ${token.name}`, {
        error: err.message,
      });
      continue;
    }

    tokenData.name = token.name;
    const client = new GameClient(tokenData, token.ws_url);

    try {
      await client.connect(15000);
      try {
        await client.sendWithPromise("role_getroleinfo", {}, 8000);
        await sleep(500);
      } catch (e) {
        addLog("WARN", "task", `获取角色信息失败 (${token.name})`, {
          error: e.message,
        });
      }

      const cmdResults = await client.executeBatch(allCommands, 800);

      for (const r of cmdResults) {
        const logLevel = r.success ? "INFO" : "ERROR";
        addLog(
          logLevel,
          "task",
          `[${token.name}] ${r.cmd}: ${r.success ? "OK" : r.error}`,
          { taskId: task.id },
        );
        await logToDb(
          task.id,
          token.name,
          r.cmd,
          r.success ? "success" : "error",
          r.success ? undefined : r.error,
        );
      }
    } catch (err) {
      addLog("ERROR", "task", `执行失败 (${token.name}): ${err.message}`, {
        taskId: task.id,
      });
      await logToDb(
        task.id,
        token.name,
        taskKeys.join(","),
        "error",
        err.message,
      );
    } finally {
      client.disconnect();
    }
    await sleep(2000);
  }

  await supabase
    .from("cron_tasks")
    .update({ last_run_at: new Date().toISOString() })
    .eq("id", task.id);
  addLog("INFO", "task", `任务完成: ${task.name}`, { taskId: task.id });
}

async function logToDb(taskId, tokenName, taskType, status, message) {
  try {
    await supabase.from("task_logs").insert({
      task_id: taskId,
      token_name: tokenName,
      task_type: taskType,
      status,
      message: message || null,
    });
  } catch (e) {
    console.error("写入日志失败:", e.message);
  }
}

// ==================== 定时任务调度 ====================
const cronJobs = new Map();

async function registerAllCrons() {
  for (const job of cronJobs.values()) job.stop();
  cronJobs.clear();

  const { data: tasks } = await supabase
    .from("cron_tasks")
    .select("*")
    .eq("enabled", true);
  if (!tasks) return;

  for (const task of tasks) {
    registerCron(task);
  }
  addLog("INFO", "cron", `已注册 ${tasks.length} 个定时任务`);
}

function registerCron(task) {
  if (cronJobs.has(task.id)) {
    cronJobs.get(task.id).stop();
  }
  // 兼容旧字段 cron_expression 和新字段 cron_expr
  const cronExpr = task.cron_expr || task.cron_expression;
  if (!task.enabled || !cronExpr) return;

  try {
    const job = cron.schedule(
      cronExpr,
      () => {
        executeTask(task).catch((err) => {
          addLog("ERROR", "cron", `任务执行异常: ${task.name}`, {
            error: err.message,
          });
        });
      },
      { timezone: "Asia/Shanghai" },
    );
    cronJobs.set(task.id, job);
    addLog(
      "INFO",
      "cron",
      `注册定时任务: ${task.name} (${cronExpr} Asia/Shanghai)`,
    );
  } catch (err) {
    addLog("ERROR", "cron", `注册失败: ${task.name}`, { error: err.message });
  }
}

async function init() {
  addLog("INFO", "server", "服务器启动中...");
  addLog(
    "INFO",
    "server",
    supabase
      ? `Supabase: ${process.env.SUPABASE_URL}`
      : "Supabase: 未配置（仅启用前端日志与本地接口）",
  );
  addLog("INFO", "server", `日志目录: ${LOG_DIR}`);

  if (!supabase) {
    addLog("WARN", "server", "跳过定时任务注册（需要 Supabase）");
    return;
  }

  await registerAllCrons();

  // 每天中午12点清理前一天的任务日志
  cron.schedule(
    "0 12 * * *",
    async () => {
      addLog("INFO", "cron", "执行每日日志清理...");
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const { error } = await supabase
          .from("task_logs")
          .delete()
          .lt("created_at", yesterday.toISOString());
        if (error) {
          addLog("ERROR", "cron", "日志清理失败", { error: error.message });
        } else {
          addLog("INFO", "cron", "已清理前一天及更早的任务日志");
        }
      } catch (err) {
        addLog("ERROR", "cron", "日志清理异常", { error: err.message });
      }
    },
    { timezone: "Asia/Shanghai" },
  );

  setInterval(
    async () => {
      addLog("INFO", "cron", "重新加载定时任务配置...");
      await registerAllCrons();
    },
    5 * 60 * 1000,
  );

  addLog("INFO", "server", "服务器就绪");
}

// ==================== API 路由 ====================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    activeCrons: cronJobs.size,
    logsInMemory: logs.length,
  });
});

// ==================== 前端埋点日志（公开，不需要 API Key）====================
// 前端 src/utils/frontendLog.js 批量上报到这里，落盘为 logs/frontend-YYYY-MM-DD.log
const FRONTEND_LOG_MAX_BATCH = 50;
const FRONTEND_LOG_MAX_LEN = 2000;

// 前端埋点：公开接口，不放 /api 下（/api 全部要求 x-api-key，浏览器端没有）
app.post("/frontend-log", (req, res) => {
  const items = Array.isArray(req.body?.logs) ? req.body.logs : [req.body];
  if (!items.length || items.length > FRONTEND_LOG_MAX_BATCH) {
    return res.status(400).json({ error: "logs 需为 1~50 条的数组" });
  }

  const receivedAt = new Date().toISOString();
  let written = 0;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    appendFileLine("frontend", {
      receivedAt,
      ts: typeof item.ts === "string" ? item.ts : receivedAt,
      level: String(item.level || "info").slice(0, 10),
      message: String(item.message ?? "").slice(0, FRONTEND_LOG_MAX_LEN),
      page: item.page ? String(item.page).slice(0, 300) : undefined,
      sessionId: item.sessionId ? String(item.sessionId).slice(0, 64) : undefined,
      userAgent: item.userAgent ? String(item.userAgent).slice(0, 300) : undefined,
      meta: item.meta ?? undefined,
    });
    written += 1;
  }
  res.json({ ok: true, written });
});

// Every API route uses the same credentials; /health remains public.
app.use("/api", createApiKeyMiddleware());

// 未配置 Supabase 时（例如本地只想收前端日志），业务接口直接给出明确原因。
// 不依赖数据库的接口（内存日志、任务定义、前端日志文件）放行。
const NO_DB_ROUTES = ["/logs", "/task-definitions"];
app.use("/api", (req, res, next) => {
  if (supabase) return next();
  if (NO_DB_ROUTES.some((p) => req.path === p || req.path.startsWith(`${p}/`))) {
    return next();
  }
  return res
    .status(503)
    .json({ error: "未配置 SUPABASE_URL / SUPABASE_KEY，该接口不可用" });
});

app.get("/api/tokens", async (req, res) => {
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .order("created_at");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/tokens", async (req, res) => {
  const { data, error } = await supabase
    .from("tokens")
    .insert(req.body)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete("/api/tokens/:id", async (req, res) => {
  const { error } = await supabase
    .from("tokens")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

app.get("/api/tasks", async (req, res) => {
  const { data, error } = await supabase
    .from("cron_tasks")
    .select("*")
    .order("created_at");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/tasks", async (req, res) => {
  const { data, error } = await supabase
    .from("cron_tasks")
    .insert(req.body)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  if (data && data[0]) registerCron(data[0]);
  res.json(data);
});

app.patch("/api/tasks/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("cron_tasks")
    .update(req.body)
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  await registerAllCrons();
  res.json(data);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const { error } = await supabase
    .from("cron_tasks")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await registerAllCrons();
  res.json({ ok: true });
});

app.post("/api/tasks/:id/run", async (req, res) => {
  const { data: task } = await supabase
    .from("cron_tasks")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (!task) return res.status(404).json({ error: "任务不存在" });
  executeTask(task).catch((err) =>
    addLog("ERROR", "api", `手动执行失败: ${err.message}`),
  );
  res.json({ status: "running", task: task.name });
});

app.get("/api/logs", (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit) || 100, LOG_MAX);
  res.json(logs.slice(0, limit));
});

/**
 * 读取落盘的日志文件，便于不开服务器也能在页面/终端排查。
 * GET /api/logs/file?type=frontend|backend&date=YYYY-MM-DD&limit=200&q=关键字
 */
app.get("/api/logs/file", (req, res) => {
  const type = req.query.type === "backend" ? "backend" : "frontend";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "")
    ? req.query.date
    : todayStr();
  const limit = Math.min(Number.parseInt(req.query.limit) || 200, 2000);
  const keyword = (req.query.q || "").toString();
  const file = path.join(LOG_DIR, `${type}-${date}.log`);

  if (!fs.existsSync(file)) {
    return res.json({ type, date, total: 0, lines: [] });
  }
  try {
    const raw = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    const filtered = keyword
      ? raw.filter((line) => line.includes(keyword))
      : raw;
    const tail = filtered.slice(-limit).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
    res.json({ type, date, total: filtered.length, lines: tail });
  } catch (err) {
    res.status(500).json({ error: `读取日志失败: ${err.message}` });
  }
});

app.get("/api/logs/db", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: "未配置 Supabase，该接口不可用" });
  }
  const limit = Math.min(Number.parseInt(req.query.limit) || 100, 500);
  const { data, error } = await supabase
    .from("task_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/task-definitions", (req, res) => {
  const list = Object.entries(TASK_DEFINITIONS).map(([key, val]) => ({
    key,
    name: val.name,
    commands: val.commands.map((c) => c.cmd),
  }));
  res.json(list);
});

// 本地默认 3001：3000 被 Vite dev server 占用（见 vite.config.js）
const PORT = process.env.PORT || 3001;
init().then(() => {
  app.listen(PORT, () => {
    addLog("INFO", "server", `监听端口 ${PORT}`);
  });
});
