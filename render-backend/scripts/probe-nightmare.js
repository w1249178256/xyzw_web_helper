/**
 * 十殿试炼（NightMare）协议探测脚本
 *
 * 背景：
 *   - 配置表已确认十殿 = NightMare：1~8 层（id=1，道具 5054，初始恢复 1 次），
 *     9 层是独立 boss（id=9，道具 37009），本次不做。
 *   - 组队规则来自 MatchTeam：2~5 人、建队免费、队伍存活 3600s、开始需 10s 内确认。
 *   - 项目里没有任何 team_/room_/nightmare_ 命令，命令名只能实测确认。
 *
 * 安全设计（重要）：
 *   默认只跑「只读命令」，绝不建队、绝不开打。
 *   组队与战斗命令必须显式加开关，且运行前会二次提示。
 *
 * 用法：
 *   node scripts/probe-nightmare.js --token token.json
 *   node scripts/probe-nightmare.js --token token.json --probe-read        # 只读命令全试一遍
 *   node scripts/probe-nightmare.js --token token.json --probe-team --yes  # 试组队命令（会真的建队）
 *   node scripts/probe-nightmare.js --token token.json --probe-fight --yes # 试战斗命令（会消耗次数）
 *   node scripts/probe-nightmare.js --token token.json --cmd nightmare_getinfo   # 单条命令
 *
 * token.json 需要包含 { roleToken, roleId, sessId, connId }，可从项目「Token 管理」复制。
 */
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { GameClient } from "../lib/gameClient.js";

/** 只读候选：查状态，不改任何东西 */
const READ_CANDIDATES = [
  "nightmare_getinfo",
  "nightmare_getroleinfo",
  "nightmare_getprogress",
  "nightmare_getteam",
  "nightmare_getlist",
  "room_getinfo",
  "team_getinfo",
  "team_getmyteam",
  "team_getteamlist",
  "fight_getnightmareinfo",
];

/** 组队候选：会产生真实队伍，跑完需要解散 */
const TEAM_CANDIDATES = ["team_create", "team_createteam", "team_join", "team_jointeam", "team_leave"];

/** 战斗候选：会消耗次数，务必确认后再跑 */
const FIGHT_CANDIDATES = [
  "fight_startnightmare",
  "nightmare_fight",
  "nightmare_startfight",
  "room_fight",
  "nightmare_restorehp",
  "nightmare_recover",
  "team_recoverhp",
];

function parseArgs(argv) {
  const out = {
    token: "",
    probeRead: false,
    probeTeam: false,
    probeFight: false,
    cmd: "",
    yes: false,
    timeout: 8000,
    dump: "",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--token") out.token = argv[++i] || "";
    else if (a === "--probe-read") out.probeRead = true;
    else if (a === "--probe-team") out.probeTeam = true;
    else if (a === "--probe-fight") out.probeFight = true;
    else if (a === "--cmd") out.cmd = argv[++i] || "";
    else if (a === "--yes") out.yes = true;
    else if (a === "--timeout") out.timeout = Number(argv[++i]) || 8000;
    else if (a === "--dump") out.dump = argv[++i] || "";
  }
  return out;
}

function loadToken(spec) {
  const raw = fs.readFileSync(path.resolve(spec), "utf8").trim();
  let text = raw;
  if (!raw.startsWith("{")) {
    try {
      text = Buffer.from(raw, "base64").toString("utf8");
    } catch {
      /* 保持原文 */
    }
  }
  const data = JSON.parse(text);
  if (!data.roleToken) throw new Error("token 里缺少 roleToken 字段");
  return {
    roleToken: data.roleToken,
    roleId: Number(data.roleId) || 0,
    sessId: Number(data.sessId) || Date.now() * 100,
    connId: Number(data.connId) || Date.now(),
    isRestore: data.isRestore ?? 0,
    name: data.name || "probe",
  };
}

/** 打印对象结构：字段名 + 类型 + 样例（截断，避免刷屏） */
function describe(label, obj, maxFields = 30) {
  console.log(`\n===== ${label} =====`);
  if (!obj || typeof obj !== "object") {
    console.log("  ", obj);
    return;
  }
  const keys = Object.keys(obj);
  console.log(`  共 ${keys.length} 个字段`);
  for (const k of keys.slice(0, maxFields)) {
    const v = obj[k];
    let sample;
    try {
      sample = JSON.stringify(v);
    } catch {
      sample = String(v);
    }
    if (sample && sample.length > 80) sample = `${sample.slice(0, 80)}…`;
    console.log(`  ${k}: ${Array.isArray(v) ? "array" : typeof v} = ${sample}`);
  }
  if (keys.length > maxFields) console.log(`  …还有 ${keys.length - maxFields} 个字段`);
}

/** 从错误对象里提取错误码与文本 */
function readError(error) {
  const msg = String(error?.message || error);
  const code = error?.code ?? error?.errCode ?? null;
  return { code, msg };
}

/** 单条命令：成功返回 {ok:true,data}，失败返回 {ok:false,code,msg} */
async function tryCommand(client, cmd, timeout) {
  try {
    const data = await client.sendWithPromise(cmd, {}, timeout);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, ...readError(error) };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.token) {
    console.error("缺少 --token <token.json>");
    process.exit(1);
  }

  const token = loadToken(args.token);
  console.log(`连接角色：${token.name}  roleId=${token.roleId}`);
  const client = new GameClient(token);
  await client.connect(20000);
  console.log("已连接\n");

  const results = [];
  const dumpAll = {};

  try {
    // ---------- 基线：先发一个肯定不存在的命令，拿到「未知命令」的标准响应 ----------
    const baseline = await tryCommand(client, "zzz_nonexistent_probe_cmd", args.timeout);
    console.log("=== 基线（故意不存在的命令）===");
    console.log("  ", baseline.ok ? "居然成功了？" : `code=${baseline.code} msg=${baseline.msg.slice(0, 120)}`);
    console.log("  说明：后续命令如果返回同样的 code/msg，就判定为「命令不存在」\n");

    const isUnknown = (r) => {
      if (r.ok) return false;
      if (baseline.ok) return false;
      if (baseline.code != null && r.code === baseline.code) return true;
      return r.msg === baseline.msg;
    };

    const run = async (cmd) => {
      const r = await tryCommand(client, cmd, args.timeout);
      let verdict;
      if (r.ok) verdict = "✅ 存在（返回成功）";
      else if (isUnknown(r)) verdict = "❌ 不存在";
      else verdict = `⚠️ 存在（参数/时机不对）code=${r.code}`;
      const line = `  ${cmd.padEnd(26)} ${verdict}${r.ok ? "" : `  ${r.msg.slice(0, 80)}`}`;
      console.log(line);
      results.push({ cmd, ok: r.ok, verdict, code: r.code, msg: r.msg });
      if (r.ok) dumpAll[cmd] = r.data;
      return r;
    };

    // ---------- 单条命令 ----------
    if (args.cmd) {
      console.log(`=== 单条：${args.cmd} ===`);
      const r = await run(args.cmd);
      if (r.ok) describe(args.cmd, r.data);
    }

    // ---------- 只读探测 ----------
    if (args.probeRead) {
      console.log("=== 只读命令探测 ===");
      for (const cmd of READ_CANDIDATES) {
        const r = await run(cmd);
        if (r.ok) describe(cmd, r.data);
      }
    }

    // ---------- 组队探测（会真实建队） ----------
    if (args.probeTeam) {
      if (!args.yes) {
        console.log("\n⚠️  --probe-team 会真实创建队伍，需要加 --yes 确认后才会执行。");
      } else {
        console.log("\n=== 组队命令探测（会真实建队/退队）===");
        for (const cmd of TEAM_CANDIDATES) {
          const r = await run(cmd);
          if (r.ok) describe(cmd, r.data);
        }
      }
    }

    // ---------- 战斗探测（会消耗次数） ----------
    if (args.probeFight) {
      if (!args.yes) {
        console.log("\n⚠️  --probe-fight 会真实发起战斗并消耗次数，需要加 --yes 确认后才会执行。");
      } else {
        console.log("\n=== 战斗命令探测（会消耗十殿次数）===");
        for (const cmd of FIGHT_CANDIDATES) {
          const r = await run(cmd);
          if (r.ok) describe(cmd, r.data);
        }
      }
    }

    // ---------- 汇总 ----------
    console.log("\n================ 汇总 ================");
    const exists = results.filter((r) => !r.verdict.startsWith("❌"));
    if (!exists.length) console.log("没有命中任何候选命令，需要扩大候选范围（可能命名风格不同）。");
    for (const r of exists) console.log(`  ${r.cmd.padEnd(26)} ${r.verdict}`);

    if (args.dump && Object.keys(dumpAll).length) {
      fs.writeFileSync(path.resolve(args.dump), JSON.stringify(dumpAll, null, 2), "utf8");
      console.log(`\n返回内容已写入 ${args.dump}`);
    }
  } finally {
    client.close?.();
  }
}

main().catch((error) => {
  console.error("探测失败：", error?.message || error);
  process.exit(1);
});
