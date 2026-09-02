# Game2 多账号游戏页面设计

日期：2026-09-02

## 背景

项目现有 `/game` 路由只启动一个游戏实例。Token 管理页和 Dashboard 会从 IndexedDB 读取当前选中 Token 的 BIN 数据，将其同步到同源 `localStorage`，随后加载 `public/game/index.html`。

实际运行的 `public/game/sh1.js` 通过共享的 `localStorage.current_bin_id` 决定登录账号，并不读取 URL 中的 `bin_id`。因此，在同一页面直接并排创建多个现有游戏 iframe 会产生竞态：后启动的实例会覆盖先启动实例的账号标识，刷新、重登或重新初始化时可能串号。

## 目标

- 在 Token 管理页支持独立的多选，不改变现有用于控制台和单账号功能的 Token 单选状态。
- 用户勾选多个 Token 后，通过“批量进入游戏”一次准备并打开这些账号。
- 新增独立 `/game2` 路由，将成功准备的游戏实例横向排列并支持横向滚动。
- 每个游戏实例拥有独立的登录账号和 `localStorage` 命名空间；刷新或重登时仍绑定原账号。
- 复用现有 Cocos 游戏静态资源和登录注入能力，保持 `/game` 及单账号入口行为不变。

## 非目标

- 不重写 Cocos 游戏、通信协议或 `sh1.js` 内部登录注入实现。
- 不改变现有 Token 单选、WebSocket 连接或批量任务行为。
- 首版不支持在 `/game2` 页面内动态添加、删除、排序账号。
- 首版不引入后端会话、跨设备同步或新的远程服务。

## 方案选择

采用“父页面会话管理器 + 独立游戏启动页 + iframe 存储命名空间”方案。

不直接修改受保护的 `sh1.js`，因为其实现难以维护且游戏资源升级时容易失效；也不为每个实例配置独立域名，因为这会显著增加本地开发和部署复杂度。

## Token 管理页交互

Token 管理页新增一套仅用于批量登录的选择状态：

- 列表和卡片模式中的每个 Token 都提供复选框。
- 点击复选框不会触发或改变现有的 `selectedTokenId`。
- 页头显示已选择数量，并提供“全选”“清空”和“批量进入游戏”。
- 没有选择账号时，“批量进入游戏”不可用。
- 批量选择顺序以当前 Token 展示顺序为准，`/game2` 按此顺序排列窗口。

点击“批量进入游戏”后，页面一次读取全部所选 Token 的 BIN。可以成功读取并转换的账号被加入本次启动；缺少或无法解析 BIN 的账号被跳过，并在离开 Token 管理页前汇总提示。若没有任何账号准备成功，则停留在当前页。

## 启动会话与数据流

新增可独立测试的游戏启动服务，负责：

1. 接收按展示顺序排列的 Token 列表。
2. 并发调用现有 IndexedDB `getArrayBuffer(token.id)`。
3. 沿用现有 BIN 转换规则，将 `px` 格式转换为 `pl`，已是 `pl` 或其他格式时保持现有兼容行为。
4. 为本次批量启动生成唯一 `launchId`，并为每个成功账号生成形如 `g2-<32位十六进制随机数>` 的高熵 `scopeId`。
5. 将该账号所需的 `bin_data_<tokenId>`、`bin_file_list` 和 `current_bin_id` 写入 `game2:<scopeId>:` 命名空间。
6. 将仅含 launch ID、成功账号的 ID/名称/scope ID/排序信息，以及失败账号的名称和失败类别的启动描述写入 `sessionStorage.game2_active_launch_v1`。Token 原文和 BIN 内容不写入 URL。
7. 导航至 `/game2`。

所有隔离键都使用 `game2:<scopeId>:` 前缀。新的批量启动根据当前标签页上一份 `game2_active_launch_v1` 描述清理旧 scope。当前 launch 在会话期间保留，使 `/game2` 刷新后可以恢复。关闭浏览器标签后，`sessionStorage` 中的启动描述自然失效；异常关闭遗留的带前缀 localStorage 数据不会被任何新实例引用，也不会污染 `/game`，但只能随站点数据清理移除。

## 独立游戏启动页与存储隔离

新增 `public/game/game2.html`，保持现有 `index.html` 的 Cocos 脚本加载顺序和启动方式。Game2 存储桥必须是第一条同步、阻塞且不带 `async`/`defer` 的脚本，并位于现有第一条游戏脚本 `patch.decrypted_readable.js` 之前；桥安装成功后才允许加载其他游戏脚本。

每个 iframe 使用以下形式的地址：

```text
<base>/game/game2.html?scope=<scopeId>&bin_id=<tokenId>
```

`scopeId` 是存储隔离依据；`bin_id` 只用于标识、诊断以及兼容未来可能支持该参数的游戏脚本，不作为当前 `sh1.js` 的身份来源。

存储桥在当前 iframe 自己的 JavaScript realm 中包装 `localStorage`。安装前先捕获原始 storage 对象、原生方法和 `length` getter，避免包装器递归调用自己。仅当调用对象是捕获的 iframe `localStorage` 时，`getItem`、`setItem`、`removeItem`、`key`、`clear` 和 `length` 才映射到 `game2:<scopeId>:` 前缀；对 `sessionStorage` 的调用继续转发原生实现。`key` 只返回当前 scope 中去掉前缀后的键，`length` 只统计当前 scope，`clear` 逐项删除当前 scope，绝不调用会清空整个源的原生 `clear`。

由于每个 iframe realm 拥有独立的 `Storage.prototype`，不同实例会看到各自命名空间内的 `current_bin_id`、`actual_login_bin_id`、BIN 列表和其他 `localStorage` 游戏状态。安装过程必须检测重复安装、不可访问的 localStorage 及不可替换的原生描述符，任何失败都立即停止游戏启动。

桥接失败、scope 缺失或 scope 非法时，启动页不继续执行游戏脚本，而是显示明确错误，避免退回共享存储后产生串号。`scopeId` 只接受 `^g2-[a-f0-9]{32}$`，查询参数不能指定任意存储前缀；父页面也只为当前 `sessionStorage` 启动描述中的 scope 创建 iframe。

启动页通过同源 `postMessage` 向父页面发送 `{ channel: "game2", version: 1, type: "ready" | "fatal", scope, code? }`。消息不携带 Token、BIN 或错误堆栈。父页面同时校验 `event.origin`、`event.source` 和当前启动描述中的 scope ID，再更新对应面板。`ready` 仅表示隔离桥、静态脚本和游戏启动调用已完成，不宣称服务端登录已经成功。

隔离边界明确限定为 `localStorage`。现有 `xh.js` 还使用同源 `sessionStorage`、IndexedDB 和 BroadcastChannel；仓库证据未显示它们承担本功能的 BIN 身份选择，因此首版不虚拟化这些 API。浏览器验收必须确认它们没有破坏两个账号的独立登录；若发现登录身份依赖这些通道，则停止交付并扩展隔离设计，而不是降低隔离要求。

现有 `public/game/index.html` 不加载该桥，因此 `/game` 完全维持原行为。

## `/game2` 页面布局

`/game2` 是独立的全屏页面，不使用后台管理布局。

- 顶部工具栏提供返回 Token 管理页、已打开账号数和账号加载异常摘要。
- 主区域使用单行 flex 容器和 `overflow-x: auto`。
- 每个账号面板保持固定的窄屏游戏宽度，并包含账号名称、独立刷新按钮和 iframe。
- 面板不会自动换行；窗口超过可视宽度时通过横向滚动访问。
- 单个 iframe 加载或启动失败时只在对应面板显示错误和重试入口，不卸载其他实例。

首版不限制选择数量，但界面会提示同时运行多个 Cocos/WebGL 实例可能显著占用内存和 GPU；实际可运行数量取决于浏览器和设备。

## 错误处理

- Token 无 BIN：跳过该账号并汇总显示名称。
- BIN 读取或转换异常：记录该账号失败原因，继续准备其他账号。
- 全部账号失败：不导航到 `/game2`。
- 启动描述缺失或过期：`/game2` 显示空状态并提供返回 Token 管理页入口。
- scope 无效或存储桥安装失败：对应游戏启动页停止启动并显示错误。
- iframe 加载失败：只允许重试该面板。

## 测试与验证

使用现有 Node `node:test` 基础设施测试真实的纯函数、命名空间适配器和模拟 Storage realm 行为，不通过匹配源码字符串来伪造覆盖。Node 测试不宣称能够替代真实浏览器对原生 `Storage.prototype` 的验证：

- BIN 数据准备会按 Token ID 写入正确 scope，并保留输入顺序。
- 缺失 BIN 或单账号转换失败不会阻断其他账号。
- iframe URL 对 scope 和账号 ID 做正确编码，且不同账号地址不同。
- 两个命名空间适配器对相同的 `current_bin_id`、`actual_login_bin_id` 和普通游戏键读写互不影响。
- `key` 和 `length` 只暴露当前 scope；`clear` 只清理当前 scope，不删除其他账号或现有 `/game` 的键。
- scope 缺失或非法时拒绝安装桥。

集成验证包括：

- 执行新增测试与仓库现有全部 `test/*.test.js`。
- 执行生产构建，确认 Vue 路由、SFC 和 public 静态文件可打包。
- 真实本地浏览器验证 Token 管理页的列表/卡片多选、批量进入、横向滚动和单窗口刷新。
- 在两个真实同源 iframe 中写入同名键，验证各自读值、`key`、`length` 和 `clear` 均隔离，并确认桥脚本早于全部 Cocos 脚本执行。
- 使用两个有效账号验证首次登录、单窗口刷新和重登始终保持各自身份；无法在本地取得两个有效 BIN 时，明确报告这项人工验收未执行，不能把静态页面加载当作登录隔离已验证。

## 预计改动范围

- `src/views/TokenImport/index.vue`：批量选择及入口。
- `src/views/GameMultiPlayer.vue`：独立多实例页面。
- `src/router/index.js`：新增 `/game2` 路由。
- `src/utils/gameLauncher.js`：BIN 准备、启动描述和 iframe URL。
- `src/utils/gameSelection.js`：批量选择集合的无副作用操作。
- `public/game/game2.html`：独立游戏启动文档。
- `public/game/game2-storage-bridge.js`：iframe 存储命名空间桥。
- `test/gameLauncher.test.js`、`test/gameSelection.test.js`、`test/game2StorageBridge.test.js`：行为测试。

自动生成的声明文件若因构建工具更新，只接受与本功能直接相关且可解释的变化；不会覆盖用户已有修改。
