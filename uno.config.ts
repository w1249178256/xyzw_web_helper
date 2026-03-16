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
        // 只包含明确的 CSS 类和属性
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
        // 排除包含模板字符串的内容
        /\$\{.*\}/,
        // 排除包含序号的模板字符串
        /\[序号.*\$\{.*\}\]/,
        // 排除包含模板字符串的属性选择器
        /\[.*\$\{.*\}.*\]/,
        // 排除包含 tokenIndex 的内容
        /tokenIndex/,
        // 排除包含模板字符串的文件
        /SummerActivityCard\.vue/,
        /ShiDianInfoCard\.vue/,
        /LampGodInfoCard\.vue/,
        /HeroInfoCard\.vue/,
      ],
    },
  },
  // 忽略某些可能被误解析的选择器
  safelist: [
    // 添加可能被误解析但实际需要的类名
  ],
  presets: [
    presetWind(),
    presetIcons({
      scale: 1.25,
      autoInstall: true,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "text-bottom",
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
  // 添加 transformers 来处理模板字符串
  transformers: [],
});
