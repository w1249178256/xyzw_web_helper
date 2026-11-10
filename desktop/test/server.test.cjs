const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { startServer, proxyOptions } = require("../server.cjs");

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "xyzw-server-"));
  await fs.writeFile(path.join(root, "index.html"), "<html>APP</html>");
  await fs.mkdir(path.join(root, "assets"));
  await fs.writeFile(path.join(root, "assets/main.js"), "console.log('ok')");
  const service = await startServer({ root, port: 0 });
  t.after(async () => {
    await service.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  return service;
}

test("History deep links use SPA fallback; assets retain correct MIME", async (t) => {
  const s = await fixture(t);
  const r = await fetch(s.origin + "/admin/dashboard", {
    headers: { accept: "text/html" },
  });
  assert.equal(r.status, 200);
  assert.match(await r.text(), /APP/);
  const js = await fetch(s.origin + "/assets/main.js");
  assert.match(js.headers.get("content-type"), /javascript/);
  const missing = await fetch(s.origin + "/assets/missing.js", {
    headers: { accept: "text/html" },
  });
  assert.equal(missing.status, 404);
  assert.equal((await fetch(s.origin + "/api/not-allowed")).status, 404);
});

test("reject foreign origins, hosts, traversal and non-GET static requests", async (t) => {
  const s = await fixture(t);
  assert.equal(
    (
      await fetch(s.origin + "/api/test", {
        headers: { origin: "https://example.com" },
      })
    ).status,
    403,
  );
  assert.equal((await fetch(s.origin + "/", { method: "POST" })).status, 405);
  const raw = (urlPath, host) =>
    new Promise((resolve, reject) => {
      const req = http.get(
        s.origin + "/",
        { path: urlPath, headers: { host } },
        (res) => {
          res.resume();
          res.on("end", () => resolve(res.statusCode));
        },
      );
      req.on("error", reject);
    });
  assert.equal(await raw("/", "foreign.example"), 403);
  assert.equal(await raw("/%2e%2e/package.json", new URL(s.origin).host), 403);
});

test("same port cannot silently switch origins when occupied", async (t) => {
  const s = await fixture(t);
  await assert.rejects(
    startServer({ root: __dirname, port: new URL(s.origin).port }),
    { code: "EADDRINUSE" },
  );
});

test("proxy matches longest complete prefix, preserves body path and Host routing", () => {
  const rules = [
    {
      prefix: "/api/weixin",
      target: "https://open.weixin.qq.com",
      headers: {},
    },
    {
      prefix: "/api/weixin-long",
      target: "https://long.open.weixin.qq.com",
      headers: {},
    },
    {
      prefix: "/api/hortor-ucenter",
      target: "https://comb-platform.hortorgames.com",
      headers: { Host: "ucenter-app-server.hortorgames.com" },
    },
  ];
  const p = proxyOptions("/api/weixin-long/poll?uuid=abc", {}, rules);
  assert.equal(p.hostname, "long.open.weixin.qq.com");
  assert.equal(p.path, "/poll?uuid=abc");
  assert.equal(proxyOptions("/api/weixin-evil/poll", {}, rules), null);
  const login = proxyOptions(
    "/api/hortor-ucenter/verify",
    { origin: "http://127.0.0.1:47831", cookie: "session=1" },
    rules,
  );
  assert.equal(login.hostname, "comb-platform.hortorgames.com");
  assert.equal(login.headers.host, "ucenter-app-server.hortorgames.com");
  assert.equal(login.headers.origin, undefined);
  assert.equal(login.headers.cookie, "session=1");
  assert.equal(login.rejectUnauthorized, true);
});

test("proxy streams POST body and forwards status, without opening cross-origin access", async (t) => {
  const https = require("node:https");
  const received = [];
  const upstream = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      received.push({
        path: req.url,
        method: req.method,
        body,
        host: req.headers.host,
      });
      res.writeHead(201, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end('{"ok":true}');
    });
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => upstream.close(resolve)));
  t.mock.method(https, "request", (options, callback) =>
    http.request(
      {
        ...options,
        protocol: "http:",
        hostname: "127.0.0.1",
        port: upstream.address().port,
      },
      callback,
    ),
  );
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "xyzw-proxy-"));
  const s = await startServer({
    root,
    port: 0,
    proxies: [
      { prefix: "/api/login", target: "https://fixed.invalid", headers: {} },
    ],
  });
  t.after(async () => {
    await s.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const res = await fetch(s.origin + "/api/login/verify?x=1", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: s.origin },
    body: '{"code":"test"}',
  });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await res.json(), { ok: true });
  assert.deepEqual(received, [
    {
      path: "/verify?x=1",
      method: "POST",
      body: '{"code":"test"}',
      host: "fixed.invalid",
    },
  ]);
});
