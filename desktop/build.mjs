import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const desktop = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(desktop);
const work = path.join(desktop, ".work");
const target = process.argv[2];
if (target && !["mac", "win", "all"].includes(target)) {
  throw new Error("Usage: node desktop/build.mjs [mac|win|all]");
}
const rootRequire = createRequire(path.join(root, "package.json"));
const desktopRequire = createRequire(path.join(desktop, "package.json"));
// An exclusive build lock prevents two invocations from deleting each other's work.
const lock = await fs
  .open(path.join(desktop, ".build.lock"), "wx")
  .catch(() => {
    throw new Error(
      "Another desktop build is running. If it crashed, remove desktop/.build.lock and retry.",
    );
  });
try {
  await fs.rm(work, { recursive: true, force: true });
  await fs.mkdir(work, { recursive: true });
  for (const entry of [
    "src",
    "public",
    "index.html",
    "vite.config.js",
    "uno.config.ts",
    "worker.js",
    "package.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
  ]) {
    await fs.cp(path.join(root, entry), path.join(work, entry), {
      recursive: true,
    });
  }
  await fs.symlink(
    path.join(root, "node_modules"),
    path.join(work, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );

  // Only the isolated copy is adapted. Keep engine globals outside Rollup so their
  // initialization order and browser-global semantics survive production builds.
  const engines = ["cocos2d-js-min.js", "game-defines.js", "index.js"];
  let html = await fs.readFile(path.join(work, "index.html"), "utf8");
  for (const name of engines) {
    const tag = `<script type="module" src="/src/xyzw/${name}"></script>`;
    if (!html.includes(tag))
      throw new Error(
        `Original engine entry changed: ${name}; review the desktop adapter.`,
      );
    html = html.replace(tag, "");
  }
  const tags = engines
    .map((name) => `    <script src="/desktop-engine/${name}"></script>`)
    .join("\n");
  html = html.replace(
    '<script type="module" src="/src/main.js"></script>',
    `${tags}\n    <script type="module" src="/src/main.js"></script>`,
  );
  await fs.writeFile(path.join(work, "index.html"), html);
  await fs.mkdir(path.join(work, "public/desktop-engine"), { recursive: true });
  for (const name of engines)
    await fs.copyFile(
      path.join(work, "src/xyzw", name),
      path.join(work, "public/desktop-engine", name),
    );

  process.chdir(work);
  const vite = await import(
    pathToFileURL(
      path.join(
        path.dirname(rootRequire.resolve("vite/package.json")),
        "dist/node/index.js",
      ),
    )
  );
  const loaded = await vite.loadConfigFromFile(
    { command: "build", mode: "production" },
    path.join(work, "vite.config.js"),
  );
  if (!loaded) throw new Error("Could not load original Vite configuration");
  const config = loaded.config;
  const proxies = Object.entries(config.server?.proxy || {}).map(
    ([prefix, rule]) => {
      if (
        typeof rule !== "object" ||
        !rule.target?.startsWith("https://") ||
        !prefix.startsWith("/api/")
      ) {
        throw new Error(`Unsupported original proxy rule: ${prefix}`);
      }
      return `{ prefix: ${JSON.stringify(prefix)}, target: ${JSON.stringify(rule.target)}, headers: ${JSON.stringify(rule.headers || {})}, rewrite: ${rule.rewrite ? rule.rewrite.toString() : "undefined"} }`;
    },
  );
  await vite.build({
    ...config,
    root: work,
    configFile: false,
    base: "/",
    build: {
      ...config.build,
      outDir: path.join(work, "dist"),
      emptyOutDir: true,
    },
  });
  const web = path.join(desktop, "web");
  await fs.rm(web, { recursive: true, force: true });
  await fs.cp(path.join(work, "dist"), web, { recursive: true });
  await fs.rm(path.join(web, "_worker.js"), { force: true });
  await fs.writeFile(
    path.join(desktop, "proxies.cjs"),
    `// Generated from the original Vite proxy rules. Do not edit.\nmodule.exports = [\n${proxies.join(",\n")}\n];\n`,
  );
  console.log(
    "\nDesktop web build ready. Original src/, public/, config and dist/ were not written.",
  );
  if (target) {
    const cli = desktopRequire.resolve("electron-builder/cli.js");
    const flags = target === "all" ? ["--mac", "--win"] : [`--${target}`];
    const result = spawnSync(
      process.execPath,
      [cli, "--config", "electron-builder.cjs", ...flags],
      { cwd: desktop, stdio: "inherit", env: process.env },
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`electron-builder failed (${result.status})`);
  }
} finally {
  process.chdir(root);
  await lock.close();
  await fs.rm(path.join(desktop, ".build.lock"), { force: true });
}
