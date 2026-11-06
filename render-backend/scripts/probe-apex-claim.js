/**
 * 逐鹿盐山（APEX）领奖命令探测脚本
 *
 * 用途：工程里目前只有 apex_getroleinfo / apex_guess / apex_vote 等读写命令，
 *       没有领奖命令。协议命令名无法从工程代码推断，必须实测确认。
 *       本脚本用已有的 Node 端客户端逐条试命令，并按错误码判断命令名是否猜对。
 *
 * 用法：
 *   node scripts/probe-apex-claim.js --token token.json              # 只读，看有哪些可领
 *   node scripts/probe-apex-claim.js --token token.json --probe      # 逐个试候选命令名
 *   node scripts/probe-apex-claim.js --token token.json --claim 1234 --cmd apex_claimguessreward
 *
 * token.json 格式（roleToken 等字段可从前端「复制 Token」拿到，整体是 JSON 或它的 base64）：
 *   { "roleToken": "…", "roleId": 123, "sessId": 1, "connId": 2, "isRestore": 0, "name": "测试号" }
 */
import fs from "node:fs";
import path from "node:path";
import { GameClient } from "../lib/gameClient.js";

/** 错误码 → 含义。用于判断「命令名是否猜对」，这是本脚本的核心判据。 */
const CODE_HINT = {
  700010: "任务未达成完成条件",
  700020: "已领取过（命令名正确）",
  1000020: "今天已领取（命令名正确）",
  12000116: "今日已领取免费奖励（命令名正确）",
  200330: "无效的ID（命令名正确，参数不对）",
  200400: "操作太快（命令名正确，触发了冷却）",
  12300080: "未达到解锁条件（命令名正确，时机不对）",
  2100010: "活动未开放（命令名正确，不在赛季内）",
};

/** 命中这些码说明命令存在，只是当前不该领或已领过。 */
const CMD_EXISTS_CODES = new Set([700020, 1000020, 12000116, 200330, 200400, 12300080, 2100010, 700010]);

/** 候选命令名，按可能性从高到低排列。可用 --cmd 覆盖。 */
const DEFAULT_CANDIDATES = [
  "apex_claimguessreward",
  "apex_claimreward",
  "apex_claim",
  "apex_claimguess",
  "apex_guessageclaim",
  "apex_claimvotereward",
  "apex_claimsupportreward",
  "apex_supportclaim",
];

function parseArgs(argv) {
  const out = { token: "", probe: false, claim: null, cmd: "", timeout: 8000 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--token") out.token = argv[++i] || "";
    else if (a === "--probe") out.probe = true;
    else if (a === "--claim") out.claim = Number(argv[++i]);
    else if (a === "--cmd") out.cmd = argv[++i] || "";
    else if (a === "--timeout") out.timeout = Number(argv[++i]) || 8000;
  }
  return out;
}

/** 读取 token：支持 JSON 文件、纯 base64（前端导出的 token 字段）、或直接一段 JSON 文本。 */
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

/** 从 apex_getroleinfo 的返回里挑出「已押中但没领」的场次。 */
function findClaimable(roleInfo) {
  const guessMap = roleInfo?.guessMap || {};
  const claimMap = roleInfo?.guessClaimMap || {};
  const rows = [];
  for (const [sid, teamIds] of Object.entries(guessMap)) {
    const claimedMap = claimMap[sid] || {};
    const claimed = Object.values(claimedMap).includes(true);
    rows.push({
      scheduleId: Number(sid),
      myTeamIds: Array.isArray(teamIds) ? teamIds : [teamIds],
      claimed,
      rawClaim: claimedMap,
    });
  }
  return rows;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.token) {
    console.log(`用法:
  node scripts/probe-apex-claim.js --token token.json            只读，列出押注与领取情况
  node scripts/probe-apex-claim.js --token token.json --probe    逐个试候选命令名（参数用 0，不会误领）
  node scripts/probe-apex-claim.js --token token.json --claim 1234 --cmd <命令名>
`);
    process.exit(1);
  }

  const token = loadToken(args.token);
  const client = new GameClient(token);
  await client.connect(20000);
  console.log("");

  try {
    const roleInfo = await client.sendWithPromise("apex_getroleinfo", {}, args.timeout);
    console.log("=== apex_getroleinfo 返回的顶层字段 ===");
    console.log(Object.keys(roleInfo || {}).join(", "));

    const rows = findClaimable(roleInfo);
    console.log("\n=== 本人押注的场次 ===");
    if (!rows.length) console.log("（没有押注记录，或不在赛季内）");
    for (const r of rows) {
      console.log(
        `  scheduleId=${r.scheduleId}  押的队伍=${r.myTeamIds.join(",")}  ${r.claimed ? "已领" : "未领"}`,
      );
    }
    const pending = rows.filter((r) => !r.claimed);
    console.log(`\n合计 ${rows.length} 场押注，其中 ${pending.length} 场未领。`);

    if (args.probe) {
      const candidates = args.cmd ? args.cmd.split(",").map((s) => s.trim()) : DEFAULT_CANDIDATES;
      console.log("\n=== 探测候选命令名（参数 scheduleId=0，正常不会真的领到东西）===");
      for (const cmd of candidates) {
        const started = Date.now();
        try {
          const res = await client.sendWithPromise(cmd, { scheduleId: 0 }, args.timeout);
          console.log(`  ${cmd}: 命令存在且返回成功  ${JSON.stringify(res).slice(0, 120)}`);
        } catch (e) {
          const msg = String(e.message || e);
          const m = msg.match(/服务器错误:\s*(-?\d+)/);
          const code = m ? Number(m[1]) : null;
          const exists = code !== null && CMD_EXISTS_CODES.has(code);
          const hint = code !== null ? CODE_HINT[code] || "" : "";
          const verdict = exists ? "命令存在（参数或时机不对）" : code !== null ? "命令存在，返回了业务错误" : "无响应/超时，疑似命令不存在";
          console.log(`  ${cmd}: ${verdict}  code=${code ?? "-"} ${hint}  (${Date.now() - started}ms)`);
          if (!code && !msg.includes("服务器错误")) console.log(`      原始信息: ${msg}`);
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      console.log("\n提示：出现 700020 / 1000020 / 200330 / 200400 这类码，说明命令名已经对了。");
    }

    if (args.claim !== null) {
      if (!args.cmd) throw new Error("真的要领奖必须同时给 --cmd <确认过的命令名>");
      if (!Number.isFinite(args.claim)) throw new Error("--claim 需要一个有效的 scheduleId");
      console.log(`\n=== 领奖：${args.cmd} scheduleId=${args.claim} ===`);
      const res = await client.sendWithPromise(args.cmd, { scheduleId: args.claim }, args.timeout);
      console.log("响应:", JSON.stringify(res).slice(0, 400));

      await new Promise((r) => setTimeout(r, 1500));
      const after = await client.sendWithPromise("apex_getroleinfo", {}, args.timeout);
      const afterRows = findClaimable(after).find((r) => r.scheduleId === args.claim);
      console.log(
        afterRows?.claimed
          ? "写后读校验：服务器确认已领取"
          : "写后读校验：服务器仍显示未领取，说明这条命令没生效",
      );
    }
  } finally {
    client.disconnect();
  }
}

main().catch((e) => {
  console.error("执行失败:", e?.message || e);
  process.exit(1);
});
