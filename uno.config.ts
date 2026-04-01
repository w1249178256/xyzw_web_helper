import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind,
} from "unocss";

export default defineConfig({
  shortcuts: [
    {
      // 按钮基础样式
      btn: "px-4 py-2 rounded inline-block",
      "btn-primary": "btn bg-blue-500 text-white hover:bg-blue-700",
      "btn-secondary": "btn bg-gray-500 text-white hover:bg-gray-700",
      "btn-danger": "btn bg-red-500 text-white hover:bg-red-700",

      // 布局组件
      "flex-center": "flex items-center justify-center",
      "grid-basic": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",

      // 卡片系列
      card: "bg-white rounded-lg shadow p-4",
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
    },
  },
  presets: [
    presetWind(),
    presetAttributify({
      /* preset options */
    }),
    presetIcons({
      scale: 1.25,
      autoInstall: false,
      extraProperties: {
        display: "inline-block",
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
});
