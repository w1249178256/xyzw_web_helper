/**
 * 只读探测：黑市刷新规则到底从哪个字段拿。
 *
 * 背景：
 *   - 客户端配置 config.json 里 blackMarketMerchandiseConf 是空的，说明商品由服务端随机生成；
 *     ConstantConf 里也只有军团商店 / 梦魇等其它系统的刷新配置，没有黑市。
 *   - 所以「这次刷新免费还是要花金砖、花多少、还能刷几次」只能从接口返回里判断。
 *
 * 本脚本只发两条只读命令（store_goodslist / role_getroleinfo），
 * **绝不发送 store_refresh**，不会消耗任何资源。
 *
 * 用法：
 *   node scripts/probe-store-refresh.js --token token.json
 *   node scripts/probe-store-refresh.js --token token.json --dump store-raw.json
 *
 * token.json 需要包含 { roleToken, roleId, sessId, connId }，
 * 可以从项目「Token 管理」里复制。
 */
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { GameClient } from "../lib/gameClient.js";

function parseArgs(argv) {
  const out = { token: "", dump: "" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--token") out.token = argv[++i] || "";
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

/** 打印一个对象的结构：字段名 + 类型 + 简短样例 */
function describe(label, obj, maxFields = 40) {
  console.log(`\n===== ${label} =====`);
  if (!obj || typeof obj !== "object") {
    console.log("  (非对象)", obj);
    return;
  }
  const keys = Object.keys(obj);
  console.log(`  顶层字段 ${keys.length} 个: ${keys.join(", ")}`);
  for (const k of keys.slice(0, maxFields)) {
    const v = obj[k];
    let text;
    try {
      text = JSON.stringify(v);
    } catch {
      text = String(v);
    }
    if (text && text.length > 220) text = `${text.slice(0, 220)}…`;
    const type = Array.isArray(v) ? `array(${v.length})` : typeof v;
    console.log(`  - ${k} (${type}): ${text}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.token) {
    console.log("用法: node scripts/probe-store-refresh.js --token token.json [--dump out.json]");
    process.exit(1);
  }

  const client = new GameClient(loadToken(args.token));
  try {
    await client.connect(20000);
    console.log("已连接");

    // 1) 读列表：看返回里除了 goodsList 还有没有刷新相关字段
    const goods = await client.sendWithPromise("store_goodslist", { storeId: 1 }, 15000);
    describe("store_goodslist 返回", goods);

    const goodsList = goods?.goodsList;
    if (goodsList && typeof goodsList === "object") {
      const firstKey = Object.keys(goodsList)[0];
      console.log("\n  goodsList 第一条样例:", JSON.stringify(goodsList[firstKey]));
    }

    // 2) 角色信息：找刷新相关的计数 / 时间字段
    let roleRes = null;
    try {
      roleRes = await client.sendWithPromise("role_getroleinfo", {}, 15000);
      const role = roleRes?.roleInfo?.role || roleRes?.role || roleRes;
      const keys = Object.keys(role || {});
      const hit = keys.filter((k) => /refresh|store|market|free|reset|shop|cnt|count|time/i.test(k));
      console.log(`\n===== role 里可能相关的字段（共 ${keys.length} 个字段中筛出 ${hit.length} 个）=====`);
      for (const k of hit) {
        const v = role[k];
        let text = JSON.stringify(v);
        if (text && text.length > 200) text = `${text.slice(0, 200)}…`;
        console.log(`  - ${k}: ${text}`);
      }
      if (!hit.length) {
        console.log("  （没有匹配字段，下面打印全部字段名供人工看）");
        console.log(`  ${keys.join(", ")}`);
      }
    } catch (err) {
      console.log("\nrole_getroleinfo 读取失败:", err.message);
    }

    if (args.dump) {
      fs.writeFileSync(
        path.resolve(args.dump),
        JSON.stringify({ goods, roleRes }, null, 2),
        "utf8",
      );
      console.log(`\n完整返回已写入 ${args.dump}`);
    }

    console.log("\n注意：本脚本没有发送 store_refresh，商店未被刷新。");
  } finally {
    client.disconnect?.();
  }
}

main().catch((err) => {
  console.error("探测失败:", err.message);
  process.exit(1);
});
