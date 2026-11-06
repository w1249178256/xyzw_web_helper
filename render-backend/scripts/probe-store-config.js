/**
 * 商店商品价格探测脚本
 *
 * 背景：store_goodslist 只返回 { buy_quantity, discount }，没有价格。
 *       游戏界面上显示的价格来自官方静态配置 config.json，需要先确认表名与字段名。
 *
 * 用法：
 *   node scripts/probe-store-config.js --token token.json
 *   node scripts/probe-store-config.js --token token.json --dump store-config.json
 *
 * 它会做四件事：
 *   1. 连上游戏，取 system_getdatabundlever 里的 dataBundleVer
 *   2. 下载 https://xxz-xyzw-res.hortorgames.com/data/<ver>/config.json
 *   3. 列出所有像「商店 / 商品 / 黑市」的配置表，并打印第一条样例
 *   4. 全局搜出所有带 goodsId 的条目，打印它们的字段结构
 *
 * 不写服务器，纯下载 + 打印。
 */
import fs from "node:fs";
import path from "node:path";
import { GameClient } from "../lib/gameClient.js";

const BASE = "https://xxz-xyzw-res.hortorgames.com";

/** 名字像商店 / 商品的配置表 */
const TABLE_HINT = /store|shop|goods|market|black|buy|price|item/i;

function parseArgs(argv) {
  const out = { token: "", dump: "", activity: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--token") out.token = argv[++i] || "";
    else if (a === "--dump") out.dump = argv[++i] || "";
    else if (a === "--activity") out.activity = true;
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

const brief = (value, max = 300) => {
  let text;
  try {
    text = JSON.stringify(value);
  } catch {
    text = String(value);
  }
  if (text === undefined) text = String(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/** 表可能是数组，也可能是以 id 为键的对象 */
function entriesOf(table) {
  if (Array.isArray(table)) return table;
  if (table && typeof table === "object") return Object.values(table);
  return [];
}

/** 深度优先找出所有「带 goodsId 的对象」，带上路径，便于判断结构 */
function findGoodsNodes(node, pathStack = [], found = [], depth = 0) {
  if (!node || typeof node !== "object" || depth > 4 || found.length >= 12) {
    return found;
  }
  if (!Array.isArray(node) && "goodsId" in node) {
    found.push({ path: pathStack.join("."), sample: node });
    return found;
  }
  const list = Array.isArray(node) ? node.slice(0, 3) : Object.values(node);
  const keys = Array.isArray(node)
    ? list.map((_, i) => String(i))
    : Object.keys(node).slice(0, 40);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    findGoodsNodes(node[key], [...pathStack, key], found, depth + 1);
  }
  return found;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.token) {
    console.log(`用法:
  node scripts/probe-store-config.js                     免 token，用 /data/version.json 取版本
  node scripts/probe-store-config.js --token token.json  用连接拿 dataBundleVer（更准）
  node scripts/probe-store-config.js --dump store-config.json
`);
  }

  let client = null;
  let version;

  try {
    if (args.activity) {
      if (!args.token) {
        throw new Error("--activity 需要一个真实 token（activity_get 要登录态）");
      }
      client = new GameClient(loadToken(args.token));
      await client.connect(20000);
      console.log("");
      const act = await client.sendWithPromise("activity_get", {}, 20000);
      console.log("=== activity_get 顶层字段 ===");
      console.log(Object.keys(act || {}).join(", ") || "(空)");

      // 扫一遍，找出带 itemId / price / merchandise 的节点
      const nodes = [];
      (function walk(node, pathStack, depth) {
        if (!node || typeof node !== "object" || depth > 5 || nodes.length >= 15) return;
        if (!Array.isArray(node)) {
          const keys = Object.keys(node);
          if (keys.some((k) => /merchandise|itemId|price|goodsId/i.test(k))) {
            nodes.push({ path: pathStack.join("."), sample: node });
            return;
          }
        }
        const entries = Array.isArray(node)
          ? node.slice(0, 3).map((v, i) => [String(i), v])
          : Object.entries(node).slice(0, 60);
        for (const [key, value] of entries) walk(value, [...pathStack, key], depth + 1);
      })(act, [], 0);

      console.log(`\n=== 疑似商品/价格节点 ${nodes.length} 个 ===`);
      for (const node of nodes) {
        console.log(`\n路径 ${node.path || "(根)"}`);
        console.log("  ", brief(node.sample, 600));
      }

      if (args.dump) {
        fs.writeFileSync(
          path.resolve(args.dump),
          JSON.stringify(act, null, 2),
          "utf8",
        );
        console.log(`\n完整响应已写入 ${args.dump}，发给我就能把名称和价格接进去。`);
      }
      return;
    }

    if (args.token) {
      client = new GameClient(loadToken(args.token));
      await client.connect(20000);
      console.log("");
      const verRes = await client.sendWithPromise("system_getdatabundlever", {}, 15000);
      version = verRes?.dataBundleVer;
      console.log("=== system_getdatabundlever ===");
      console.log(brief(verRes, 400));
    } else {
      const resp = await fetch(`${BASE}/data/version.json`);
      if (!resp.ok) throw new Error(`version.json 读取失败 HTTP ${resp.status}`);
      const meta = await resp.json();
      version = meta?.version;
      console.log("=== /data/version.json ===");
      console.log(brief(meta, 200));
    }
    if (!version) throw new Error("没拿到配置版本号");

    const url = `${BASE}/data/${version}/config.json`;
    console.log(`\n下载配置: ${url}`);
    const started = Date.now();
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`配置下载失败 HTTP ${resp.status}`);
    const text = await resp.text();
    const config = JSON.parse(text);
    console.log(
      `下载完成: ${(text.length / 1024 / 1024).toFixed(2)} MB，耗时 ${Date.now() - started}ms`,
    );

    const keys = Object.keys(config);
    console.log(`\n=== 顶层配置表 ${keys.length} 个 ===`);
    console.log(keys.join(", "));

    console.log("\n=== 疑似商店/商品相关的表 ===");
    const candidates = keys.filter((key) => TABLE_HINT.test(key));
    if (!candidates.length) console.log("（没有名字匹配的表，看下面 goodsId 扫描结果）");
    for (const key of candidates) {
      const rows = entriesOf(config[key]);
      console.log(`\n[${key}] 条目数 ${rows.length}`);
      if (rows.length) console.log("  样例:", brief(rows[0], 500));
    }

    console.log("\n=== 全局扫描：带 goodsId 的配置 ===");
    const nodes = findGoodsNodes(config);
    if (!nodes.length) {
      console.log("（没找到 goodsId，说明价格表可能用别的键名，把上面的表名列表发我）");
    }
    for (const node of nodes) {
      console.log(`\n路径 ${node.path || "(根)"}`);
      console.log("  样例:", brief(node.sample, 500));
    }

    if (args.dump) {
      const payload = {
        version,
        candidates: Object.fromEntries(
          candidates.map((key) => [key, entriesOf(config[key]).slice(0, 40)]),
        ),
        goodsNodes: nodes,
      };
      fs.writeFileSync(
        path.resolve(args.dump),
        JSON.stringify(payload, null, 2),
        "utf8",
      );
      console.log(`\n已把样例写入 ${args.dump}，可以直接发给我。`);
    }

    console.log(
      "\n提示：如果 [xxxStoreConf] 里有 itemId + price/cost，而商品表里另有 goodsId → itemId 的映射，",
    );
    console.log("      那么现价 = price × discount，页面上就能显示「原价 / 现价」。");
  } finally {
    client?.disconnect();
  }
}

main().catch((error) => {
  console.error("执行失败:", error?.message || error);
  process.exit(1);
});
