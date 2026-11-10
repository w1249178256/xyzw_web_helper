const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
async function snapshot() {
  const hashes = {};
  async function visit(relative) {
    const full = path.join(root, relative);
    const stat = await fs.lstat(full).catch(() => null);
    if (!stat) return;
    if (stat.isDirectory()) {
      for (const name of (await fs.readdir(full)).sort())
        await visit(path.join(relative, name));
    } else if (stat.isFile()) {
      hashes[relative] = createHash("sha256")
        .update(await fs.readFile(full))
        .digest("hex");
    }
  }
  for (const name of [
    "src",
    "public",
    "dist",
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "index.html",
    "vite.config.js",
    "uno.config.ts",
    "components.d.ts",
    "worker.js",
  ])
    await visit(name);
  return hashes;
}
test(
  "desktop build does not write original source, generated types, config or web dist",
  { timeout: 120000 },
  async () => {
    const before = await snapshot();
    const result = spawnSync(
      process.execPath,
      [path.join(root, "desktop/build.mjs")],
      {
        cwd: root,
        encoding: "utf8",
        timeout: 110000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    assert.equal(
      result.status,
      0,
      (result.stderr || "") + (result.stdout || "").slice(-3000),
    );
    assert.deepEqual(await snapshot(), before);
    const html = await fs.readFile(
      path.join(root, "desktop/web/index.html"),
      "utf8",
    );
    assert.match(html, /src="\/assets\//);
    assert.match(html, /src="\/desktop-engine\/index.js"/);
    const proxies = require("../proxies.cjs");
    assert.equal(proxies.length, 4);
  },
);
