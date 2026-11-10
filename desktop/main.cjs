const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, dialog, Menu, shell } = require("electron");
const { startServer } = require("./server.cjs");

const smoke = process.argv.includes("--desktop-smoke-test");
// A new profile avoids overwriting tokens from the previous file:// shell.
app.setPath("userData", path.join(app.getPath("appData"), "XYZW-Desktop-HTTP"));
let service;
let window;
let quitting = false;
function log(message) {
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.appendFileSync(
      path.join(app.getPath("userData"), "startup.log"),
      `${new Date().toISOString()} ${message}\n`,
    );
  } catch {
    /* Logging must not prevent the error dialog from appearing. */
  }
}
function fatal(error) {
  const code = error.code || "STARTUP_FAILED";
  // Do not write request URLs, response bodies or tokens to disk.
  log(`Startup failed: ${code}`);
  const detail =
    code === "EADDRINUSE"
      ? "本机端口 47831 已被其他程序占用。请关闭占用程序后重试。为避免丢失本地存储，不会自动切换端口。"
      : "本地服务或应用页面启动失败。请检查安装文件是否完整。";
  if (smoke) {
    console.error(`DESKTOP_SMOKE_FAILED ${code}`);
    app.exit(1);
    return;
  }
  dialog.showErrorBox(
    "XYZW 启动失败",
    `${detail}\n诊断日志：${path.join(app.getPath("userData"), "startup.log")}`,
  );
  app.quit();
}
async function createWindow() {
  window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: "XYZW 游戏管理系统",
    show: !smoke,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  const local = (url) => {
    try {
      return new URL(url).origin === service.origin;
    } catch {
      return false;
    }
  };
  window.webContents.on("will-navigate", (event, url) => {
    if (!local(url)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) && !local(url))
      shell.openExternal(url).catch(() => log("External browser failed"));
    return { action: "deny" };
  });
  window.webContents.on("render-process-gone", (_event, details) =>
    log(`Renderer stopped: ${details.reason}`),
  );
  window.on("closed", () => {
    window = null;
  });
  await window.loadURL(service.origin + (smoke ? "/tokens" : "/"));
  log("Local application page loaded");
  if (smoke) {
    // Deterministic readiness, not just a running Electron process.
    const result = await window.webContents
      .executeJavaScript(`new Promise((resolve, reject) => {
      const deadline = Date.now() + 20000;
      const check = () => {
        const mounted = document.querySelector('#app')?.__vue_app__;
        if (mounted && typeof window.__require === 'function') {
          const crypto = window.__require('13');
          const previous = localStorage.getItem('__desktop_smoke');
          localStorage.setItem('__desktop_smoke', 'ok');
          resolve({ mounted: !!mounted, path: location.pathname, hash: location.hash,
            crypto: typeof crypto.encMsg === 'function', previous,
            origin: location.origin, nodeIntegration: typeof window.require });
        } else if (Date.now() > deadline) reject(new Error('Renderer readiness timed out'));
        else setTimeout(check, 100);
      }; check();
    })`);
    console.log("DESKTOP_SMOKE " + JSON.stringify(result));
    if (
      !result.mounted ||
      !result.crypto ||
      result.path !== "/tokens" ||
      result.hash ||
      result.nodeIntegration !== "undefined"
    )
      throw new Error("Smoke assertions failed");
    await window.loadURL(service.origin + "/tokens");
    const stored = await window.webContents.executeJavaScript(
      "localStorage.getItem('__desktop_smoke')",
    );
    if (stored !== "ok")
      throw new Error("Storage was not preserved across page reload");
    app.quit();
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      Menu.setApplicationMenu(null);
      service = await startServer({
        root: path.join(__dirname, "web"),
        proxies: require("./proxies.cjs"),
        log,
      });
      log("Loopback service started on port 47831");
      await createWindow();
      app.on("activate", () => {
        if (!window) createWindow().catch(fatal);
      });
    })
    .catch(fatal);
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", (event) => {
    if (service && !quitting) {
      event.preventDefault();
      quitting = true;
      service.close().then(
        () => app.quit(),
        () => app.exit(1),
      );
    }
  });
}
