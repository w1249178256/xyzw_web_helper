import { defineConfig, presetAttributify, presetIcons, presetWind } from "unocss";

export default defineConfig({
  shortcuts: [
    {
      // 按钮基础样式
      "btn": "px-4 py-2 rounded inline-block",
      "btn-primary": "btn bg-blue-500 text-white hover:bg-blue-700",
      "btn-secondary": "btn bg-gray-500 text-white hover:bg-gray-700",
      "btn-danger": "btn bg-red-500 text-white hover:bg-red-700",

      // 布局组件
      "flex-center": "flex items-center justify-center",
      "grid-basic": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",

      // 卡片系列
      "card": "bg-white rounded-lg shadow p-4",
    },
    [/^i-ad:(.*)$/, (p) => `i-ant-design:${p[1]}`],
    [/^i-c:(.*)$/, (p) => `i-carbon:${p[1]}`],
    [/^i-mat:(.*)$/, (p) => `i-material-symbols:${p[1]}`],
    [/^i-tw:(.*)$/, (p) => `i-tabler:${p[1]}`],
    [/^i-vsc:(.*)$/, (p) => `i-vscode-icons:${p[1]}`],
    [/^i-im:(.*)$/, (p) => `i-icomoon:${p[1]}`],
    [/^i-if:(.*)$/, (p) => `i-icofont:${p[1]}`],
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        "src/**.icon.json",
        "src/frames/menus.json",
      ],
      exclude: [
        // 排除 node_modules 和 dist 目录
        /node_modules/,
        /dist/,
        /\.git/,
        // 排除可能包含模板字符串的 JS/TS 文件内容
        /\.log$/,
        // 排除 JS/TS 文件中的模板字符串
        /\$\{/,
      ],
    },
  },
  // 忽略某些可能被误解析的选择器
  safelist: [
    // 添加可能被误解析但实际需要的类名
  ],
  presets: [
    presetWind(),
    presetAttributify({ 
      // 忽略某些属性，避免误解析模板字符串
      // 注意：ignoreAttributes 应该是数组，不是函数
    }),
    presetIcons({
      scale: 1.25,
      autoInstall: true,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "text-bottom",
      },
      processor(css, meta) {
        console.log("meta:", meta);
        console.log("css:", css);
        return css;
        // 解决图标前缀问题
        // if (meta.body.includes("i-")) {
        //   return css.replace(/i-([a-z]+):/g, "i-$1:");
        // }
        // return css;
      },
    }),
  ],
  theme: {
    colors: {
      xyzw: {
        DEFAULT: "#fa790f",
        text: "#fa790f",
        bg: "#fa790f",
        r: "#F50000",
        g: "#00F500",
        b: "#0000F5",
      },
    },
  },
  // 添加 transformers 来处理 Vue 文件中的模板字符串
  transformers: [
    // 如果有 transformer 可以处理模板字符串，可以在这里添加
  ],
});
