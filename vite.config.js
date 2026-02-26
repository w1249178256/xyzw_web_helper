import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
  import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function safeImport(moduleName, humanName) {
  try {
    return await import(moduleName);
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") {
      console.warn(
        `[vite] Optional dependency "${moduleName}" (${humanName}) not found; continuing without it.`,
      );
      return null;
    }
    throw error;
  }
}

export default defineConfig(async () => {
  let basicSsl;
  try {
    ({ default: basicSsl } = await import("@vitejs/plugin-basic-ssl"));
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") {
      throw error;
    }
    console.warn(
      "[vite] '@vitejs/plugin-basic-ssl' not found, starting without HTTPS support.",
    );
  }

  const routerModule = await safeImport(
    "unplugin-vue-router/vite",
    "file-based routing",
  );
  const autoImportModule = await safeImport(
    "unplugin-auto-import/vite",
    "auto-imports",
  );
  const componentsModule = await safeImport(
    "unplugin-vue-components/vite",
    "component auto-registration",
  );
  const componentsResolversModule = componentsModule
    ? await safeImport(
        "unplugin-vue-components/resolvers",
        "component resolvers",
      )
    : null;
  const unoCssModule = await safeImport("unocss/vite", "UnoCSS");
  const vueDevToolsModule = await safeImport(
    "vite-plugin-vue-devtools",
    "Vue DevTools",
  );
  const vueI18nModule = await safeImport(
    "@intlify/unplugin-vue-i18n/vite",
    "Vue I18n pre-compiler",
  );

  const routerPlugin = routerModule?.default?.({
    routesFolder: "src/views",
    logs: true,
    exclude: ["**/components/**", "**/test**.vue", "**/**Modal.vue"],
    importMode: "async",
    dts: "src/typed-router.d.ts",
  });

  const autoImportPlugin = autoImportModule?.default?.({
    imports: ["vue", "vue-router", "vue-i18n"],
    dts: "src/auto-imports.d.ts",
  });

  const { ArcoResolver } = componentsResolversModule ?? {};
  const componentsPlugin = componentsModule?.default?.({
    dirs: ["src/components"],
    resolvers: ArcoResolver
      ? [
          ArcoResolver({
            importStyle: false,
          }),
        ]
      : [],
  });

  const unoCssPlugin = unoCssModule?.default?.();
  const vueDevToolsPlugin = vueDevToolsModule?.default?.();
  const vueI18nPlugin = vueI18nModule?.default?.({
    module: "vue-i18n",
    include: path.resolve(__dirname, "./src/locales/**"),
  });

  const plugins = [
    routerPlugin && { ...routerPlugin, enforce: "pre" },
    vue(),
    vueDevToolsPlugin,
    basicSsl && basicSsl(),
    unoCssPlugin,
    autoImportPlugin,
    componentsPlugin,
    vueI18nPlugin,
    {
      name: "copy-worker",
      closeBundle() {
        try {
          const src = path.resolve(__dirname, "worker.js");
          // Cloudflare Pages Advanced Mode expects _worker.js
          const dest = path.resolve(__dirname, "dist/_worker.js");
          if (fs.existsSync(src)) {
            if (!fs.existsSync(path.dirname(dest))) {
              fs.mkdirSync(path.dirname(dest), { recursive: true });
            }
            fs.copyFileSync(src, dest);
            console.log("\n[copy-worker] worker.js copied to dist/_worker.js");
          } else {
            console.warn("\n[copy-worker] worker.js not found at " + src);
          }
        } catch (e) {
          console.error("\n[copy-worker] Error copying worker.js:", e);
        }
      },
    },
  ].filter(Boolean);

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@views": path.resolve(__dirname, "src/views"),
        "@assets": path.resolve(__dirname, "src/assets"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@api": path.resolve(__dirname, "src/api"),
        "@stores": path.resolve(__dirname, "src/stores"),
      },
    },
    server: {
      port: 3000,
      open: true,
      host: true,
      proxy: {
        // 微信登录接口代理
        "/api/weixin": {
          target: "https://open.weixin.qq.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/weixin/, ""),
          secure: true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/WIFI Language/zh_CN",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            Referer: "https://open.weixin.qq.com/",
          },
        },
        // 微信扫码状态轮询代理
        "/api/weixin-long": {
          target: "https://long.open.weixin.qq.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/weixin-long/, ""),
          secure: true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/WIFI Language/zh_CN",
            Accept: "*/*",
            Referer: "https://open.weixin.qq.com/",
          },
        },
        // Hortor登录接口代理
        "/api/hortor": {
          target: "https://comb-platform.hortorgames.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/hortor/, ""),
          secure: true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 12; 23117RK66C Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Mobile Safari/537.36",
            Accept: "*/*",
            Host: "comb-platform.hortorgames.com",
            Connection: "keep-alive",
            "Content-Type": "text/plain; charset=utf-8",
            Origin: "https://open.weixin.qq.com",
            Referer: "https://open.weixin.qq.com/",
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/variables.scss" as vars;',
        },
      },
    },
  };
});
