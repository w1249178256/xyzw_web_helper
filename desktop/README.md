# 独立桌面打包

通过 Electron 窗口加载内置 HTTP 服务提供的原版网页，支持 Windows 和 macOS。
桌面依赖、配置和产物均独立管理，不修改原版 `src/`、`index.html`、路由或 Vite 配置。

## 使用

建议使用 Node.js 22 LTS。在项目根目录执行：

```bash
pnpm install                  # 原版项目依赖
npm ci --prefix desktop       # 独立桌面依赖

node desktop/build.mjs win    # Windows x64 / ia32 合并安装程序
node desktop/build.mjs mac    # macOS arm64 / x64 DMG
node desktop/build.mjs all    # 同时构建两个平台
```

也可以双击 `pack-windows.cmd` 或 `pack-macos.command`。安装包输出到
`desktop/release/`，不应提交到 Git。macOS 包需在 macOS 上构建；Windows 原生构建
最可靠，macOS 交叉构建会使用 Wine。Electron、NSIS、Wine 等工具首次使用时需要联网下载。
可按本机网络环境设置代理或 `ELECTRON_MIRROR`，无需修改原版配置。

默认未配置代码签名与 Apple 公证，Windows/macOS 可能显示安全提示。

## 启动和测试

```bash
node desktop/build.mjs          # 仅构建桌面网页
npm --prefix desktop start      # 启动桌面应用
npm --prefix desktop test       # 服务、API 转发及构建隔离测试
npm --prefix desktop run smoke  # 真实 Electron 页面与存储冒烟测试
```

测试覆盖 History 深链接、静态资源、代理请求体与状态码转发、跨站请求防护、
端口冲突和构建前后原版文件一致性。冒烟测试检查 Vue 挂载、游戏加密模块、
渲染层 Node 隔离和刷新后的存储保留；重复执行时 `previous: "ok"` 表示跨重启存储保持。
不会使用真实 Token 或执行游戏任务。Windows 安装与运行仍需实机验证，
真实账号登录、短信、扫码和自动任务仍需授权账号下的联网测试。

## 实现与隔离

- `build.mjs`：复制原版构建所需文件到 `.work/`，链接原版依赖后执行 Vite 构建。
  桌面网页输出到 `web/`，不写原版源码、自动生成类型或根目录 `dist/`。
- 三个游戏引擎脚本仅在构建副本中改为按顺序加载的普通脚本，以保留全局对象与加载顺序。
  原版 HTML 与业务代码不修改；如果原版入口结构变化，需检查这个适配步骤。
- `proxies.cjs`：构建时从原版 `server.proxy` 提取四条 HTTPS API 规则、请求头和路径重写。
  不需要手工维护另一份上游地址；若原版新增复杂代理配置，需检查适配逻辑。
- `server.cjs`：提供静态资源、History 回退和 API 代理；只监听 `127.0.0.1:47831`，
  拒绝跨站请求、陌生 Host、路径穿越与未知 API，并保留上游 TLS 证书校验。
- `main.cjs`：管理单实例窗口与服务生命周期。启用沙箱和上下文隔离，关闭渲染层 Node 权限。
  关闭最后一个窗口即退出并关闭服务；启动失败时显示错误弹窗。
- `electron-builder.cjs`：打包网页与外壳代码，不携带原版前端整套 node_modules。

固定端口保证 localStorage/IndexedDB 来源不变；端口被占用时明确报错，不自动换端口。
本地存储与原版浏览器数据独立，已有 Token 需重新导入。数据及 `startup.log` 位于：

- Windows：`%APPDATA%\XYZW-Desktop-HTTP`
- macOS：`~/Library/Application Support/XYZW-Desktop-HTTP`

日志不记录 Token、请求 URL、请求体或响应内容。`.work/`、`web/`、`proxies.cjs`、
`node_modules/` 和 `release/` 均为可再生成的本地产物，由本目录 `.gitignore` 排除。
