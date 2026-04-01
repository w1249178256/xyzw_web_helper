# XYZW Web Helper

<div align="center">

![XYZW Logo](public/xiaoyugan.png)

**🎮 咸鱼自动化web平台**

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Naive UI](https://img.shields.io/badge/Naive%20UI-2.38+-18A058?style=flat&logo=vue.js&logoColor=white)](https://www.naiveui.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-BON%20Protocol-FF6B6B?style=flat&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg?style=flat)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

基于Vue 3 + Vite的现代化XYZW游戏辅助工具，支持Token管理、WebSocket通信、游戏自动化等功能。

</div>

---

## ✨ 核心特性

### 🔐 Token管理系统
- **双重导入方式**：支持手动输入和URL接口获取两种Token导入方式
- **Base64解码支持**：自动识别和解析多种Base64格式的游戏Token
- **多角色管理**：同时管理多个游戏账号，支持角色信息展示
- **本地存储**：安全的本地数据存储，无需后端服务器
- **Token验证**：自动验证Token有效性和格式完整性
- **自动刷新**：支持URL获取的Token自动刷新功能

### 🌐 WebSocket通信
- **BON协议支持**：内置Binary Object Notation协议编解码
- **多重加密**：支持LX、X、XTM等多种加密方式
- **自动重连**：智能断线重连机制，确保连接稳定
- **消息队列**：内置消息队列系统，支持批量发送和响应处理

### 🎮 游戏功能
- **日常任务管理**：自动化日常任务执行和奖励领取
- **角色状态监控**：实时显示角色等级、职业、服务器等信息
- **团队管理**：队伍状态查看和管理功能
- **爬塔进度**：爬塔状态追踪和数据分析

### 🛠️ 开发工具
- **消息测试器**：BON协议消息编码/解码测试工具
- **WebSocket调试**：实时WebSocket连接和消息调试
- **协议验证**：游戏协议消息格式验证工具

### 🎨 主题系统
- **智能主题切换**：支持深浅主题无缝切换，自动适应系统主题偏好
- **实时响应**：主题切换立即生效，无需刷新页面
- **全组件覆盖**：完整支持Naive UI组件库的深色主题
- **记忆偏好**：自动保存用户主题选择，下次访问自动应用
- **统一设计**：所有页面使用统一的圆形主题切换按钮

---

## 🏗️ 技术架构

### 前端技术栈
```
Vue 3.4+          # 渐进式JavaScript框架
├── Composition API    # Vue 3组合式API
├── <script setup>     # 单文件组件语法糖
└── Reactive System    # 响应式数据系统

Vite 5.0+         # 现代化构建工具
├── HMR               # 热模块替换
├── ES6+             # 现代JavaScript支持
└── SCSS             # CSS预处理器

Naive UI 2.38+    # Vue 3组件库
├── Theme System     # 主题系统
├── Icon Library     # 图标库
└── Responsive      # 响应式设计

Pinia 2.1+        # 状态管理
├── Store Pattern    # 存储模式
├── DevTools        # 开发工具
└── Composition API  # 组合式API支持
```

### 核心架构设计

```
src/
├── 🎯 stores/              # Pinia状态管理
│   ├── tokenStore.js      # Token管理核心
│   ├── gameRoles.js       # 游戏角色数据
│   └── localTokenManager.js # 本地存储管理
│
├── 🔧 composables/         # Vue 3组合式函数
│   └── useTheme.js        # 主题管理系统
│
├── 🌐 utils/               # 核心工具库
│   ├── bonProtocol.js     # BON协议实现
│   ├── xyzwWebSocket.js   # WebSocket客户端
│   ├── gameCommands.js    # 游戏命令封装
│   └── wsAgent.js         # 连接代理
│
├── 📱 views/               # 主要页面
│   ├── TokenImport.vue    # Token导入管理
│   ├── Dashboard.vue      # 主控制台
│   ├── DailyTasks.vue     # 日常任务
│   ├── GameFeatures.vue   # 游戏功能
│   └── Profile.vue        # 用户设置
│
└── 🧩 components/         # 可复用组件
    ├── TokenManager.vue   # Token管理器
    ├── ThemeToggle.vue    # 主题切换按钮
    ├── GameStatus.vue     # 游戏状态组件
    ├── DailyTaskCard.vue  # 任务卡片
    ├── MessageTester.vue  # 消息测试器
    └── WebSocketTester.vue # WebSocket调试器
```

---

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 18.0.0
pnpm >= 9.0.0 (推荐)
```

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-repo/xyzw-web-helper.git
cd xyzw-web-helper

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview
```

### 开发命令

```bash
pnpm run dev      # 启动开发服务器 (端口3000)
pnpm run build    # 构建生产版本
pnpm run preview  # 预览生产构建
pnpm run lint     # 代码检查和修复
pnpm run format   # 代码格式化
```

### 部署代理服务 (Cloudflare Pages)

本项目推荐使用 Cloudflare Pages 进行部署，内置了对 API 代理的支持。

1. **准备代码**：https://github.com/w1249178256/xyzw_web_helper.git
2. **连接仓库**：在 Cloudflare Dashboard 中选择 "Pages" -> "Connect to Git"，选择本项目仓库。
3. **构建设置**：
    - **构建命令**: `npm run build`
    - **构建输出目录**: `dist`
4. **环境变量**（可选）：可以在 Cloudflare Pages 设置中添加环境变量。
5. **部署**：点击 "Save and Deploy"。

Cloudflare Pages 会自动识别 `dist/_worker.js` 并启用 Advanced Mode，无需额外配置即可实现 API 代理和静态资源托管。

### 本地预览 (Cloudflare Pages)

为了在本地模拟 Cloudflare Pages 环境（包括 `worker.js` 的代理功能），请使用 `wrangler`：

1. **安装 wrangler**: `npm install -g wrangler`
2. **构建项目**: `npm run build`
3. **启动预览**: `npx wrangler pages dev dist`
4. **访问**: 打开浏览器访问 `http://localhost:8787`

> 注意：`npm run preview` 仅提供静态文件预览，无法执行 `worker.js` 中的代理逻辑。请使用 `wrangler` 进行全功能预览。

### 部署TokenURL获取服务 (Python)

本项目提供了一个基于 Python Flask 的配套后端服务，用于管理游戏 bin 文件并提供 Token 获取接口。

**主要功能：**
*   **多用户管理**：支持用户注册、登录、注销，每个用户拥有独立的文件存储空间。
*   **Web 管理界面**：可视化管理 bin 文件，支持批量上传、删除。
*   **安全认证**：内置登录认证机制，保护接口安全。
*   **专属 Token**：为每个用户生成唯一的 Token，用于构建安全的访问链接。

#### 1. 环境准备

确保服务器安装了 Python 3.x，并安装依赖：

```bash
cd server
pip install -r requirements.txt
```

#### 2. 配置

服务启动时会自动检查 `server/config.json`，如果不存在则创建默认配置（包含默认管理员账号）。

> **注意**：默认管理员账号为 `admin`，密码为 `admin123`。建议首次登录后修改密码或创建新账号。

#### 3. 启动服务

```bash
python app.py
```

服务将在 `0.0.0.0:5000` 启动。

#### 4. 使用方式

1.  **注册/登录**：
    访问 `http://<你的服务器IP>:5000`。
    *   默认管理员：`admin` / `admin123`
    *   普通用户：点击“注册新账号”创建自己的账号。

2.  **上传 bin 文件**：
    登录后，点击“上传”按钮，选择一个或多个 `.bin` 文件进行上传。文件将存储在您的专属目录下。

3.  **获取 Token URL**：
    上传成功后，列表中会显示每个文件的 Token URL。点击“复制完整链接”按钮。

    URL 格式示例（包含用户专属 Token）：
    ```
    http://<你的服务器IP>:5000/<UserToken>/<bin文件名>/<base64编码>
    ```

4.  **账号管理**：
    *   **修改密码**：点击“修改密码”按钮，在弹出的窗口中输入新密码进行修改。
    *   **注销账号**：普通用户可以点击“注销账号”来永久删除账号及所有数据。管理员账号不可注销。

---

## 📖 使用指南

### 1. Token导入与管理

#### 支持的导入方式

##### 方式一：手动输入
支持多种Base64格式的Token字符串：

```javascript
// 纯Base64格式
"eyJ0b2tlbiI6ImFiY2QxMjM0In0="

// 带前缀格式
"token:eyJ0b2tlbiI6ImFiY2QxMjM0In0="
```

##### 方式二：URL接口获取
通过API接口自动获取Token，支持定时刷新：

```javascript
// API接口返回格式
{
  "token": "eyJ0b2tlbiI6ImFiY2QxMjM0In0=",  // 必需字段
  "server": "风云服"                        // 可选字段
}
```

##### 方式三：批量导入
支持通过bin文件或多行输入同时导入多个Token。

支持伏羲bin文件格式的Token批量导入。

#### 导入步骤
1. 进入 **Token管理** 页面
2. 选择导入方式：
   - **手动输入**：粘贴Base64编码的Token字符串
   - **URL获取**：输入Token获取接口地址
3. 系统自动解析和验证Token格式
4. 设置角色名称和基本信息
5. 保存到本地存储

#### Token刷新功能
- 通过URL方式导入的Token支持一键刷新
- 刷新时会重新请求原API接口获取最新Token
- 自动重新建立WebSocket连接
- 保持角色信息和配置不变

### 2. WebSocket连接配置

纯本地连接存储，不用担心封号及账号泄漏风险

### 3. BON协议消息处理

```javascript
import { bon, GameMessages } from '@/utils/bonProtocol.js';

// 编码消息
const message = GameMessages.getRoleInfo(0, 12345);
const encoded = bon.encode(message.body);

// 解码消息
const decoded = bon.decode(receivedData);
```

### 4. 主题系统使用

#### 主题切换功能
- **位置**：在页面右上角可以找到圆形的主题切换按钮
- **图标说明**：
  - ☀️ 太阳图标：当前为浅色主题，点击切换到深色主题
  - 🌙 月亮图标：当前为深色主题，点击切换到浅色主题
- **自动记忆**：用户的主题选择会自动保存，下次访问时自动应用
- **系统同步**：首次访问时会自动检测系统主题偏好

#### 技术实现特点
```javascript
// 使用主题切换组件
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
```

### 5. 游戏功能使用

#### 日常任务自动化
- 自动签到奖励领取
- 日常任务完成状态检查
- 奖励自动领取
- 任务进度实时追踪

#### 角色状态监控
- 实时等级和经验显示
- 职业和技能信息
- 服务器状态监控
- 在线时长统计

---

## 🔧 配置说明

### Vite配置 (vite.config.js)

```javascript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@stores': path.resolve(__dirname, 'src/stores')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://xyzw.my',
        changeOrigin: true
      }
    }
  }
});
```

### 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=wss://game.xyzw.my/ws

# .env.production
VITE_API_BASE_URL=https://api.xyzw.my
VITE_WS_URL=wss://game.xyzw.my/ws
```

---

## 🧪 测试与调试

### 内置测试工具

#### 1. 消息测试器 (MessageTester.vue)
- BON协议编码/解码测试
- 消息格式验证
- 加密/解密功能测试

#### 2. WebSocket调试器 (WebSocketTester.vue)
- 实时连接状态监控
- 消息发送和接收测试
- 连接参数配置

#### 3. 协议验证工具
```javascript
// 测试BON编码
const testData = { cmd: "test", data: { id: 123 } };
const encoded = bon.encode(testData);
const decoded = bon.decode(encoded);
console.log('编码测试:', decoded);

// 测试加密
const encrypted = getEnc('x').encrypt(encoded);
const decrypted = getEnc('x').decrypt(encrypted);
```

### 调试技巧

1. **浏览器开发工具**：使用Vue DevTools监控组件状态
2. **网络面板**：监控WebSocket消息传输
3. **控制台日志**：查看详细的协议处理日志
4. **本地存储检查**：验证Token和配置存储

---

## 📦 项目结构详解

### 状态管理架构

```javascript
// tokenStore.js - 核心Token管理
const useTokenStore = defineStore('tokens', () => {
  const gameTokens = ref([]);           // Token列表
  const selectedTokenId = ref(null);    // 当前选中Token
  const wsConnections = ref({});        // WebSocket连接池
  
  // Token管理方法
  const addToken = (tokenData) => { /* ... */ };
  const updateToken = (id, updates) => { /* ... */ };
  const removeToken = (id) => { /* ... */ };
  
  // WebSocket管理
  const connectWebSocket = (tokenId) => { /* ... */ };
  const disconnectWebSocket = (tokenId) => { /* ... */ };
  
  return { 
    gameTokens, selectedTokenId, wsConnections,
    addToken, updateToken, removeToken,
    connectWebSocket, disconnectWebSocket
  };
});
```

### 路由守卫系统

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  const tokenStore = useTokenStore();
  
  if (to.meta.requiresToken && !tokenStore.hasTokens) {
    next('/tokens'); // 重定向到Token管理页
  } else {
    next();
  }
});
```

### 组件通信模式

```javascript
// 父子组件通信
// Parent.vue
<TokenManager 
  :tokens="tokens" 
  @token-selected="handleTokenSelect"
  @token-updated="handleTokenUpdate" />

// 兄弟组件通信（通过Store）
const tokenStore = useTokenStore();
const gameData = computed(() => tokenStore.gameData);
```

---

## 🔐 安全特性

### 数据安全
- **本地存储**：所有敏感数据仅存储在浏览器本地
- **Token掩码**：界面显示时自动掩码处理（显示首尾4位）
- **加密传输**：WebSocket消息使用多重加密协议
- **会话隔离**：每个Tab页面独立的连接会话

### 协议安全
```javascript
// 多重加密支持
const encryptors = {
  lx: lzCompressionWithMask,      // LZ4压缩+头部掩码
  x: randomHeaderWithXOR,         // 随机头部+XOR加密
  xtm: xxteaEncryption           // XXTEA加密算法
};

// 自动加密检测和解密
const autoDecrypt = (data) => {
  if (isLXFormat(data)) return lx.decrypt(data);
  if (isXFormat(data)) return x.decrypt(data);
  if (isXTMFormat(data)) return xtm.decrypt(data);
  return data;
};
```

---

## 🚀 性能优化

### 前端优化
- **代码分割**：路由级别的懒加载
- **Tree Shaking**：自动删除未使用代码
- **资源压缩**：Gzip压缩和资源优化
- **缓存策略**：智能缓存Token和游戏数据

### WebSocket优化
- **连接池**：复用WebSocket连接
- **消息队列**：批量处理和发送优化
- **心跳机制**：智能心跳保持连接活跃
- **断线重连**：指数退避重连算法

### 内存优化
```javascript
// 响应式数据优化
const gameData = computed(() => {
  return tokenStore.gameData || {};
});

// 组件卸载时清理
onUnmounted(() => {
  if (wsClient.value) {
    wsClient.value.disconnect();
  }
});
```

---

## 🤝 贡献指南

### 开发规范
1. **代码风格**：使用ESLint + Prettier统一代码风格
2. **组件命名**：使用PascalCase命名Vue组件
3. **提交规范**：遵循Conventional Commits规范
4. **文档注释**：关键功能使用JSDoc注释

### 提交流程
```bash
# 1. Fork项目并克隆到本地
git clone https://github.com/your-username/xyzw-web-helper.git

# 2. 创建功能分支
git checkout -b feature/new-feature

# 3. 提交更改
git commit -m "feat: 添加新功能描述"

# 4. 推送分支
git push origin feature/new-feature

# 5. 创建Pull Request
```

### Issue反馈
- 🐛 **Bug报告**：描述问题复现步骤和环境信息
- 💡 **功能建议**：详细说明需求场景和预期效果
- 📖 **文档改进**：指出文档不准确或缺失的部分
- ❓ **使用问题**：提供详细的使用场景和问题描述

---

## 📋 更新日志

### v2.1.1 (Current - 2025.10.01)
- 🎮 **月度任务系统**
  - 新增月度任务进度跟踪面板，实时显示钓鱼和竞技场进度
  - 实现钓鱼自动补齐功能，智能优先使用免费次数
  - 添加竞技场自动补齐，采用贪心策略估算战斗次数
  - 支持一键完成月度任务和进度刷新功能

- 👥 **角色身份卡系统**
  - 新增角色身份卡组件，展示角色头像、等级、战力等详细信息
  - 实现完整的战力段位系统，包含10个段位等级和专属样式
  - 添加角色头像默认图片库和智能加载失败处理
  - 优化队伍状态展示，增加炫光边框动画效果

- ⚡ **性能与稳定性优化**
  - 优化WebSocket连接状态监听和错误处理机制
  - 移除大量调试日志输出，减少控制台噪音
  - 改进Token过期检测和用户友好提示机制
  - 调整游戏命令结构，统一消息响应格式

- 🎨 **界面体验提升**
  - 完善战力数值格式化显示（支持亿、万单位转换）
  - 实现段位进度条计算和可视化展示
  - 添加深色主题下的身份卡样式完美适配
  - 优化移动端显示效果，调整元素尺寸和间距

- 🐛 **Bug修复**
  - 修复若干已知问题和代码错误
  - 清理临时文档文件，保持项目结构整洁
  - 优化角色信息获取逻辑，提升数据获取可靠性

### v2.1.0 (2025.09.04)
- 🌓 **全新主题系统**
  - 全局深浅主题切换功能，支持系统主题自动检测
  - 优雅的圆形切换按钮，与界面设计完美融合
  - 实时热切换，无需刷新页面即可切换主题
  - 完整支持Naive UI组件的深色主题
  - 智能记忆用户主题偏好设置

- ⚡ **响应式体验优化**
  - 修复主题切换按钮状态不实时更新的问题
  - 解决弹框等Portal组件字体颜色不热切换的问题
  - 基于MutationObserver的DOM变化监听
  - 事件驱动的主题状态同步机制

- 🎨 **界面统一性提升**
  - 统一TokenImport和Dashboard页面的主题切换组件
  - 使用太阳/月亮图标直观表示主题状态
  - 添加按钮hover动画效果
  - 完善的CSS深色主题适配

- 🔧 **技术架构改进**
  - 重构useTheme composable，使用响应式ref替代computed
  - 双重DOM监听确保状态同步（html + body）
  - 支持data-theme属性和class类名双重主题检测
  - 优化的事件系统和状态管理

### v2.0.0 (Legacy)
- 🎉 重构Token管理系统，支持多角色管理
- 🔧 升级WebSocket客户端，支持更多游戏协议
- 🎨 全新UI设计，基于Naive UI组件库
- ⚡ 优化BON协议处理，提升消息编解码性能
- 🛡️ 增强安全性，支持多种加密方式
- 🧪 添加完整的测试和调试工具

### v1.x.x (Legacy)
- 基础Token管理功能
- 简单WebSocket连接
- 基础游戏功能支持

---

## 🗓️ 版本更新计划

### v2.2.0 (计划中 - Q1 2026)
- 🎯 **自动化增强**
  - [ ] 智能任务调度系统
  - [ ] 增加账号批量管理界面
  - [ ] 支持每日任务一键完成
  - [ ] 支持定时任务抢购符咒

- 🔧 **功能扩展**  
  - [ ] 支持自定义脚本生成
  - [ ] 添加数据统计面板
  - [ ] 增强游戏状态监控
  - [ ] 支持多服务器管理

### v2.1.0 已完成功能 ✅
- 🎨 **用户界面**
  - [x] 全局深浅主题切换系统
  - [x] 实时热切换，无需刷新页面
  - [x] 优雅的圆形主题切换按钮
  - [x] 完整的Naive UI深色主题支持
  - [x] 界面已有bug修复

- 🔧 **技术优化**
  - [x] 支持远端获取Token（URL接口方式）
  - [x] 支持Token自动刷新功能
  - [x] 响应式状态管理优化
  - [x] DOM变化监听和事件驱动更新

## 📄 许可证

本项目基于 [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](LICENSE) 许可证。

**⚠️ 重要声明：**
- ✅ **允许**：个人学习、研究、修改和分享
- ❌ **禁止**：商业用途、销售、商业化运营
- 📝 **要求**：署名、相同许可证分享、标注修改

详细许可条款请查看 [LICENSE](LICENSE) 文件。

---

## 📞 联系方式

- **项目主页**：[GitHub Repository](https://github.com/w1249178256/xyzw_web_helper)
- **问题反馈**：[GitHub Issues](https://github.com/w1249178256/xyzw_web_helper/issues)
- **联系邮箱**：[发邮件给我](mailto:stevefeng59@gmail.com)
- **TG群组**：[欢迎加入](https://t.me/+SEDhXWN_OpNiMGI1)

---

## 👏 赞赏
<img src="https://github.com/w1249178256/xyzw_web_helper/blob/main/public/IMG_8007.JPG" width="200" height="200">

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

Made with ❤️ by FF Team

</div>
