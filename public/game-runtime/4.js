// ==UserScript==
// @name         摸鱼No.1-本地脚本
// @namespace    moyu-no1-local
// @version      1.2.2
// @description  游戏内 JS 入口，点击后加载本地脚本
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  if (window.__gsjcLocalLauncher) return;
  window.__gsjcLocalLauncher = true;

  var scriptBase = new URL("./", document.currentScript && document.currentScript.src || location.href).href;
  var fetchLocal = window.fetch.bind(window);
  var localScripts = [
    { name: "老版本岚山", file: "3.js", group: "lanshan", versionName: "旧版本" },
    { name: "新版本岚山", file: "5.js", group: "lanshan", versionName: "新版本" },
    { name: "盐场开战列表不关闭", file: "6.js" },
    { name: "战斗实时数值", file: "7.js" },
    { name: "自动桃子", file: "8自适应版.js" }
  ];
  var pendingScripts = Object.create(null);
  var activeGroups = Object.create(null);
  if (!window._gsjcFreeLoaded) window._gsjcFreeLoaded = {};
  localScripts.forEach(function (script) {
    if (script.group && window._gsjcFreeLoaded[scriptBase + script.file]) {
      activeGroups[script.group] = { script: script, started: true, failed: false };
    }
  });

  /* ==================== UI: 嵌入式按钮 ==================== */
  var LAUNCHER_ID = "gsjc-launcher";
  var PANEL_ID = "gsjc-panel";
  var _fguiBtnInjected = false;

  function injectGameButton() {
    var checkCount = 0;
    var maxChecks = 120;
    // onShow may already have fired before the hook is installed.
    setTimeout(function () {
      if (!_fguiBtnInjected) createDomLauncher();
    }, 5000);
    var injectionInterval = setInterval(function () {
      checkCount++;
      if (checkCount >= maxChecks) {
        clearInterval(injectionInterval);
        if (!_fguiBtnInjected) createDomLauncher();
        return;
      }
      if (typeof window.__require !== "function" || typeof fgui !== "object") {
        return;
      }
      try {
        var MainPanel = window.__require("MainPanel");
        if (MainPanel && MainPanel.MainPanel) {
          var originalOnShow = MainPanel.MainPanel.prototype.onShow;
          var originalOnHide = MainPanel.MainPanel.prototype.onHide;

          MainPanel.MainPanel.prototype.onShow = function () {
            if (typeof originalOnShow === "function") originalOnShow.apply(this, arguments);
            if (!this._gsjcEmbedBtn) {
              try {
                var btn = fgui.UIPackage.createObject("ui_common", "BtnInfo2");
                if (!btn) return;
                btn.title = "";
                btn.icon = "";

                if (btn.numChildren > 0) {
                  for (var i = 0; i < btn.numChildren; i++) {
                    var child = btn.getChildAt(i);
                    if (child && child.name === "n0") {
                      child.visible = false;
                    }
                  }
                }

                var textField = new fgui.GTextField();
                textField.name = "customLabel";
                textField.text = "JS";
                textField.fontSize = 28;
                textField.bold = true;
                textField.color = "#FFFFFF";
                textField.singleLine = true;
                if (typeof cc !== "undefined") {
                  textField.shadowOffset = new cc.Vec2(0, 2);
                  textField.shadowColor = new cc.Color(122, 69, 48, 200);
                }

                var textX = (btn.width - textField.width) / 2;
                var textY = (btn.height - textField.height) / 2;
                textField.setPosition(textX, textY);
                textField.visible = true;
                textField.touchable = false;
                btn.addChild(textField);

                btn.onClick(function () {
                  onLauncherClick();
                });

                var paddingX = 130;
                var paddingY = 120;
                btn.setPosition(paddingX, paddingY);

                this.ui.addChild(btn);
                this._gsjcEmbedBtn = btn;
                _fguiBtnInjected = true;
                var fallback = document.getElementById(LAUNCHER_ID);
                if (fallback) fallback.remove();
              } catch (e) {
                console.warn("内嵌按钮创建失败:", e);
                createDomLauncher();
              }
            }
          };

          MainPanel.MainPanel.prototype.onHide = function () {
            if (this._gsjcEmbedBtn) {
              this._gsjcEmbedBtn.dispose();
              this._gsjcEmbedBtn = null;
            }
            if (typeof originalOnHide === "function") originalOnHide.apply(this, arguments);
          };

          clearInterval(injectionInterval);
        }
      } catch (error) {}
    }, 800);
  }

  function createDomLauncher() {
    if (window.__multi && window.__multi.disposed) return;
    var old = document.getElementById(LAUNCHER_ID);
    if (old) return;
    var btn = document.createElement("div");
    btn.id = LAUNCHER_ID;
    btn.textContent = "JS";
    btn.style.cssText = [
      "position:fixed", "left:10px", "top:10px", "z-index:2147483640",
      "width:48px", "height:36px", "border-radius:8px",
      "background:rgba(20,28,42,.72)",
      "border:1px solid rgba(218,196,120,.35)",
      "display:flex", "align-items:center", "justify-content:center",
      "cursor:pointer", "user-select:none",
      "backdrop-filter:blur(6px)", "-webkit-backdrop-filter:blur(6px)",
      "box-shadow:0 2px 10px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)",
      "font-family:'Microsoft YaHei',system-ui,sans-serif",
      "font-size:13px", "font-weight:600", "color:#dac478",
      "transition:transform .15s ease, border-color .15s ease"
    ].join(";") + ";";

    btn.addEventListener("mouseenter", function () {
      btn.style.transform = "scale(1.06)";
      btn.style.borderColor = "rgba(218,196,120,.6)";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.transform = "scale(1)";
      btn.style.borderColor = "rgba(218,196,120,.35)";
    });
    btn.addEventListener("click", function () {
      onLauncherClick();
    });

    document.body.appendChild(btn);
  }

  function onLauncherClick() {
    showScriptDialog();
  }

  function loadLocalScript(script) {
    var src = scriptBase + script.file;
    if (window._gsjcFreeLoaded[src]) return Promise.resolve();
    if (pendingScripts[src]) return pendingScripts[src];

    var active = script.group && activeGroups[script.group];
    if (active) {
      var message = active.failed
        ? active.script.versionName + "执行异常，请重新打开游戏窗口后选择岚山版本。"
        : (active.started ? "已经加载" : "正在加载") + active.script.versionName + "，" + script.versionName + "暂不加载。";
      var conflict = new Error(message);
      conflict.scriptConflict = true;
      return Promise.reject(conflict);
    }

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    // Reserve synchronously so rapid clicks cannot fetch both versions.
    var group = script.group ? { script: script, started: false, failed: false } : null;
    if (group) activeGroups[script.group] = group;
    var work = Promise.resolve().then(function () {
      if (window.__multi && window.__multi.disposed) throw new Error("游戏窗口已关闭");
      return fetchLocal(src, { cache: "no-store", signal: controller.signal });
    }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status + "：" + script.file);
      return response.text();
    }).then(function (code) {
      if (controller.signal.aborted) throw new Error("加载超时，请检查本地服务后重试");
      if (!code.trim()) throw new Error("脚本文件为空：" + script.file);
      if (/^\s*</.test(code)) throw new Error("返回了网页内容，无法加载脚本：" + script.file);
      if (window.__multi && window.__multi.disposed) throw new Error("游戏窗口已关闭");
      var execute = new Function(code + "\n//# sourceURL=" + encodeURI(src));
      if (group) group.started = true;
      execute();
      window._gsjcFreeLoaded[src] = true;
    }).catch(function (error) {
      if (group) {
        // A runtime error can leave hooks installed; keep the other version blocked.
        if (group.started) group.failed = true;
        else delete activeGroups[script.group];
      }
      if (error && error.name === "AbortError") throw new Error("加载超时，请检查本地服务后重试");
      if (group && group.failed) {
        throw new Error(String(error && error.message || error) + "；请重新打开游戏窗口后选择岚山版本。");
      }
      throw error instanceof Error ? error : new Error(String(error));
    });
    pendingScripts[src] = work;
    function finish() {
      clearTimeout(timeout);
      delete pendingScripts[src];
    }
    work.then(finish, finish);
    return work;
  }

  function ensureAnimStyle() {
    if (document.getElementById("gsjc-anim-style")) return;
    var s = document.createElement("style");
    s.id = "gsjc-anim-style";
    s.textContent =
      ".gsjc-panel{transform:scale(.85);opacity:0;transition:transform .18s ease,opacity .18s ease}" +
      ".gsjc-panel.show{transform:scale(1);opacity:1}" +
      ".gsjc-drag{cursor:move;user-select:none}";
    document.head.appendChild(s);
  }

  var _dragData = null;
  function makeDraggable(handle, panel) {
    handle.classList.add("gsjc-drag");
    handle.addEventListener("mousedown", function (e) {
      if (e.target.closest("button, .gsjc-close")) return;
      _dragData = { sx: e.clientX, sy: e.clientY, px: panel.offsetLeft, py: panel.offsetTop };
      e.preventDefault();
    });
    handle.addEventListener("touchstart", function (e) {
      if (e.target.closest("button, .gsjc-close")) return;
      var t = e.touches[0];
      _dragData = { sx: t.clientX, sy: t.clientY, px: panel.offsetLeft, py: panel.offsetTop };
      e.preventDefault();
    }, { passive: false });
  }
  document.addEventListener("mousemove", function (e) {
    if (!_dragData) return;
    var p = document.querySelector(".gsjc-panel.show");
    if (!p) return;
    p.style.left = (_dragData.px + e.clientX - _dragData.sx) + "px";
    p.style.top = (_dragData.py + e.clientY - _dragData.sy) + "px";
  });
  document.addEventListener("mouseup", function () { _dragData = null; });
  document.addEventListener("touchmove", function (e) {
    if (!_dragData) return;
    var p = document.querySelector(".gsjc-panel.show");
    if (!p) return;
    var t = e.touches[0];
    p.style.left = (_dragData.px + t.clientX - _dragData.sx) + "px";
    p.style.top = (_dragData.py + t.clientY - _dragData.sy) + "px";
    e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", function () { _dragData = null; });

  function createCenterPanel(width) {
    ensureAnimStyle();
    var panel = document.createElement("div");
    panel.className = "gsjc-panel";
    var left = Math.max(10, (window.innerWidth - width) / 2);
    var top = 10;
    panel.style.cssText = "position:fixed;left:" + left + "px;top:" + top + "px;z-index:2147483641;background:rgba(255,255,255,0.72);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(255,255,255,0.5);border-radius:15px;padding:16px 18px;width:" + width + "px;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.08);box-sizing:border-box";
    document.body.appendChild(panel);
    requestAnimationFrame(function () { panel.classList.add("show"); });
    return panel;
  }

  function closePanelAnim(el) {
    if (!el || !el.parentNode) return;
    el.classList.remove("show");
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
  }

  /* ==================== UI: 本地脚本弹窗 ==================== */
  function showScriptDialog() {
    var old = document.getElementById(PANEL_ID);
    if (old) old.remove();

    var panel = createCenterPanel(240);
    panel.id = PANEL_ID;
    panel.style.maxHeight = "90vh";
    panel.style.overflowY = "auto";
    panel.innerHTML =
      '<div id="gsjc-drag-handle" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
        '<span style="font-size:13px;color:#1a1a2e;font-weight:600;letter-spacing:0.5px">脚本模式</span>' +
        '<span id="gsjc-cancel" class="gsjc-close" style="cursor:pointer;color:#9ca3af;font-size:17px;line-height:1">&times;</span>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:5px;font-size:11px;color:#4b5563;letter-spacing:0.5px">点击下方按钮加载</div>' +
      '<div id="gsjc-script-list"></div>';

    makeDraggable(panel.querySelector("#gsjc-drag-handle"), panel);
    panel.querySelector("#gsjc-cancel").onclick = function () { closePanelAnim(panel); };

    var list = panel.querySelector("#gsjc-script-list");
    localScripts.forEach(function (script) {
      var src = scriptBase + script.file;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.style.cssText = "margin-top:5px;width:100%;padding:8px;border:1px solid rgba(0,0,0,0.08);border-radius:9px;background:rgba(255,255,255,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#2d3748;font-size:12px;cursor:pointer;font-weight:500;letter-spacing:0.3px;transition:all 0.2s";
      function renderButton() {
        var loaded = !!window._gsjcFreeLoaded[src];
        var loading = !!pendingScripts[src];
        btn.disabled = loaded || loading;
        btn.textContent = script.name + (loaded ? " · 已加载" : loading ? " · 加载中..." : "");
        btn.style.background = loaded ? "#2d3748" : "rgba(255,255,255,0.5)";
        btn.style.color = loaded ? "#fff" : "#2d3748";
        btn.style.borderColor = loaded ? "#2d3748" : "rgba(0,0,0,0.08)";
      }
      btn.onmouseover = function () {
        if (btn.disabled) return;
        btn.style.background = "rgba(255,255,255,0.8)";
        btn.style.borderColor = "#2d3748";
      };
      btn.onmouseout = renderButton;
      btn.onclick = function () {
        if (btn.disabled) return;
        var work = loadLocalScript(script);
        renderButton();
        work.then(renderButton, function (error) {
          renderButton();
          if (window.__multi && window.__multi.disposed) return;
          alert(error.scriptConflict ? error.message : script.name + "加载失败：" + error.message);
        });
      };
      renderButton();
      if (pendingScripts[src]) pendingScripts[src].then(renderButton, renderButton);
      list.appendChild(btn);
    });
  }

  /* ==================== 启动 ==================== */
  function bootstrap() {
    if (window.__multi && (window.__multi.loginOnly || window.__multi.disposed)) return;
    injectGameButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    setTimeout(bootstrap, 0);
  }
})();
