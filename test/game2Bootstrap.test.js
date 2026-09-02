import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const game2Html = await readFile(
  new URL("../public/game/game2.html", import.meta.url),
  "utf8",
).catch(() => "");
const bootstrapScript = [
  ...game2Html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
]
  .map((match) => match[1])
  .find((script) => script.includes("loadGame2Runtime"));
const expectedRuntimeFiles = [
  "patch.decrypted_readable.js",
  "src/settings.da7ef.js",
  "game-defines.a175e.js",
  "main.2a00e.js",
  "cocos2d-js-min.a5841.js",
  "xh.js",
  "sh1.js",
  "diagnose_require.js",
];

function executeBootstrap(boot) {
  const messages = [];
  const loadedScripts = [];
  const splash = { style: {}, textContent: "" };
  const binToolClasses = new Set();
  const binTool = {
    classList: {
      add(...names) {
        names.forEach((name) => binToolClasses.add(name));
      },
      contains(name) {
        return binToolClasses.has(name);
      },
    },
  };
  const document = {
    head: {
      appendChild(script) {
        loadedScripts.push(script.src);
        queueMicrotask(() => script.onload());
      },
    },
    createElement() {
      return {};
    },
    getElementById(id) {
      if (id === "splash") return splash;
      if (id === "binTool") return binTool;
      return null;
    },
  };
  const window = {
    __GAME2_BRIDGE_READY__: {
      scope: "g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    boot() {
      return boot([...loadedScripts], { binTool });
    },
    document,
    location: { origin: "https://helper.example" },
    parent: {
      postMessage(payload, origin) {
        messages.push({ payload, origin });
      },
    },
  };
  window.window = window;

  vm.runInNewContext(bootstrapScript, {
    document,
    Error,
    Promise,
    queueMicrotask,
    window,
  });
  return { binTool, loadedScripts, messages, splash, window };
}

const flushBootstrap = () => new Promise((resolve) => setImmediate(resolve));

test("game2 bootstrap gates every game runtime behind the storage bridge", () => {
  assert.match(game2Html, /src="game2-storage-bridge\.js"/);
  assert.match(game2Html, /if \(!window\.__GAME2_BRIDGE_READY__\) return;/);

  const staticScriptSources = [...game2Html.matchAll(/<script\s+src="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(staticScriptSources, ["game2-storage-bridge.js"]);

  for (const runtimeFile of expectedRuntimeFiles) {
    assert.ok(game2Html.includes(`"${runtimeFile}"`), runtimeFile);
  }
});

test("game2 bootstrap waits for boot completion before reporting ready", async () => {
  let resolveBoot;
  let scriptsAtBoot;
  const { loadedScripts, messages } = executeBootstrap((scripts) => {
    scriptsAtBoot = scripts;
    return {
      then(resolve) {
        resolveBoot = resolve;
      },
    };
  });

  await flushBootstrap();
  assert.equal(typeof resolveBoot, "function");
  assert.deepEqual(loadedScripts, expectedRuntimeFiles);
  assert.deepEqual(scriptsAtBoot, expectedRuntimeFiles);
  assert.deepEqual(messages, []);

  resolveBoot();
  await flushBootstrap();
  assert.equal(messages.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(messages[0])), {
    payload: {
      channel: "game2",
      version: 1,
      type: "ready",
      scope: "g2-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    origin: "https://helper.example",
  });
});

test("game2 bootstrap leaves the account tool expanded before boot", async () => {
  let minimizedAtBoot = false;
  const { binTool } = executeBootstrap((_scripts, state) => {
    minimizedAtBoot = state.binTool.classList.contains("minimized");
    return Promise.resolve();
  });

  await flushBootstrap();

  assert.equal(minimizedAtBoot, false);
  assert.equal(binTool.classList.contains("minimized"), false);
});

test("game2 bootstrap reports boot rejection as fatal", async () => {
  let rejectBoot;
  const { messages, splash } = executeBootstrap(() => ({
    then(_resolve, reject) {
      rejectBoot = reject;
    },
  }));

  await flushBootstrap();
  assert.equal(typeof rejectBoot, "function");
  rejectBoot(new Error("bundle versions unavailable"));
  await flushBootstrap();

  assert.equal(splash.textContent, "游戏资源加载失败");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].payload.type, "fatal");
  assert.equal(messages[0].payload.code, "runtime-load-failed");
});
