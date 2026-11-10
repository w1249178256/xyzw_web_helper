# 十殿试炼（NightMare）自动化开发计划

> 状态：调研完成，等待协议实测验证（用户回家后执行 P0）
> 创建：2026-11-10
> 说明：本文档为临时开发计划，功能完成后删除

---

## 0. 一句话结论

技术可行。业务逻辑很薄（队长单连接循环派兵），**全部难点集中在协议命令名未知**。先用 `probe-nightmare.js` 探出 4 条命令，后面就是常规开发。

---

## 1. 玩法机制

### 1.1 配置表事实（已从官方 config.json 472 张表确认）

「十殿」在客户端里叫 **NightMare（十殿试炼）**。

**主参数表 `NightMare`（仅 2 条）**

| id | name | useItem | restoreHpLimit | battleRound | fightTimeLimit | fightIntervalTime | totalTime | BattleSpeed |
|---|---|---|---|---|---|---|---|---|
| 1 | 十殿试炼1-8 | 5054 | **1** | 15 | 600s | 15s | 7200s | 1.4x |
| 9 | 十殿试炼9-10 | 37009 | 0 | 15 | 600s | 15s | 7200s | 1.4x |

- `matchTeamType=1` → 走组队匹配
- `heroFightLimit=1` → 每个英雄只能出战 1 次
- `WeekSendNum=5` → 每周次数相关
- `useItemNum=[[0,2,1],[3,5,1],[6,9999,1]]` → 道具消耗随层数变化

**怪物表 `NightMareMonster`（10 条 = 10 个 boss）**

| 字段 | 值 |
|---|---|
| bossId | 1~10 |
| legionBossLv | 6000 |
| legionBossZhanLi | **90,337,477,527（约 903 亿）** |
| monsters | `[[10001,13,331001],[1000101,10,3310011],[1000102,11,3310011]]` |
| killReward | 5055×1、1022×5000、1020×10 |

**组队规则 `MatchTeam`（8 条，取 matchTeamType=1）**

| 字段 | 值 | 含义 |
|---|---|---|
| memberMin / memberMax | 2 / 5 | 队伍 2~5 人 |
| createExpendItemId / Cnt | 5054 / 0 | 建队免费 |
| duration | 3600 | 队伍存活 1 小时 |
| startNeedConfirm | 1 | 开始需队员确认 |
| startConfirmTime | 10 | 确认窗口 10 秒 |
| canMultiSearch | 1 | 支持多队匹配 |
| serverGroup | 500 | 跨服组 |

**其它相关表**：`NightMareStarConf`（8 条星级挑战，`challengeTime=5`）、`NightMareMonster`、`RoomNightmareMonster`（8 条房间怪物）、`NightMareBook`（图鉴）、`NightMareRace*`（竞速，疑似另一玩法）

### 1.2 用户实测确认的规则

| 规则 | 内容 |
|---|---|
| 出战限制 | **每个 boss，每个成员只能战斗 1 次**（即单 boss 最多 5 次机会） |
| 次数刷新 | **打过 boss 后，全队次数刷新**，进入下一个 boss 又是 5 次机会 |
| 控制方 | **只需队长操作**，指定谁出战即可；其他成员加入后可下线 |
| 恢复 | 打完 boss 后可按需恢复某成员状态；**初始 1 次，通关某关后增加** |
| 通关 | 打完第 8 层即通关 |
| 9 层 | 独立 boss，分 9-1 / 9-2 两阶段，**本次不做** |

### 1.3 由此推导的玩法本质

5 个成员把英雄池拼在一起（每人每 boss 出 1 个），队长按战力顺序派兵，用最少的机会击杀 boss；恢复次数是稀缺资源，用来救急。**核心是资源调度，不是操作速度。**

---

## 2. 技术现状

| 能力 | 状态 | 位置 |
|---|---|---|
| WS + BON 二进制协议 | ✅ 成熟 | `src/utils/xyzwWebSocket.js`、`render-backend/lib/gameClient.js` |
| 多账号管理 | ✅ 支持多 token 并行 | `src/stores/tokenStore.ts` |
| 战斗调用范式 | ✅ 有 `fight_startlevel/boss/tower/dungeon/legionboss` | `src/views/PushingLevels.vue` |
| 结算校验范式 | ✅ 「发送 → 等待 → 重读状态 → 对比」 | `runOneBattle()` |
| 协议探测方法 | ✅ 「猜命令名 + 错误码判定」 | `render-backend/scripts/probe-apex-claim.js` |
| 后台保活 | ✅ Worker 节拍器 + 静音音频 | `src/utils/bgTicker.js` |
| **十殿协议命令** | ❌ 完全没有 | — |

搜索结论：`src/` 与 `render-backend/` 中无任何 `team_` / `room_` / `nightmare_` 命令；游戏资源里也没有可提取的命令字符串。

---

## 3. 开发范围

**本次做**：1~8 层完整流程（建队 → 加入 → 逐层战斗 → 通关）

**本次不做**：9 层（9-1 / 9-2）、星级挑战、竞速玩法

**预留**：层组参数化，以后接 9 层只加配置：

```js
const NIGHTMARE_GROUPS = {
  normal: { id: 1, useItem: 5054, bosses: [1, 2, 3, 4, 5, 6, 7, 8], restoreBase: 1 },
  hard:   { id: 9, useItem: 37009, bosses: [9], restoreBase: 0 },  // 以后接
};
```

---

## 4. 待验证清单（回家后按顺序执行）

按优先级排列，每步都有明确的判断标准。

### V1. 协议命令是否存在（最高优先级）

**方式 A（推荐，最快，零准备）**：用项目内置的「消息测试」页

- 打开项目 → 左侧菜单「消息测试」（路由 `/admin/message-test`）
- 命令框里输入候选命令名，点发送，直接看返回结构
- 优点：不用准备 token.json、能看到完整返回、可以连续换命令试
- 建议顺序：先试 `nightmare_getinfo`，再试 `team_getmyteam`、`room_getinfo`

**方式 B（批量探测）**：跑脚本一次试完 10 条

```bash
cd D:/Demo/xyzw_web_helper
node render-backend/scripts/probe-nightmare.js --token token.json --probe-read
```

**判断标准**：看哪些命令判定为「✅ 存在」或「⚠️ 存在（参数/时机不对）」。

**命中的意义**：
- 命中 `nightmare_getinfo` 类 → 直接拿到十殿状态结构，P1 只读面板可定
- 全都没命中 → 命名风格不同，需扩候选（`trial_` / `hell_` / `purgatory_` / `tenhall_`）

> **为什么不建议抓包解码**
>
> 试过了：BON 帧的 `parse(buf, enc)` 需要**会话密钥**（登录握手时交换），
> 浏览器抓到的原始帧离线解不开（报 `enc.decrypt is not a function`）。
> 而游戏自身的 WS 不经过本项目，项目日志也拿不到命令名。
> 所以只能靠「用合法连接主动试命令」这条路——也就是上面的消息测试页 / 探测脚本。

### V2. 结算包结构（决定战斗循环怎么写）

**要确认**：
1. 怎么判断「boss 已击杀」？是 `bossHp <= 0`、`isKill=true`，还是返回 `nextBoss`？
2. 战斗是同步返回结算，还是先返回 `fightId` 再异步推结果？

**方式**：真实打一次，把返回结构 dump 下来

### V3. 次数刷新时机

打完 boss 后：
- 自动刷新（下发新状态），还是
- 需要调一次「进入下一层」？

### V4. 恢复的粒度与协议

- 恢复单个成员，还是整队一起？
- 剩余恢复次数从哪个字段读？
- 「通关增加次数」的触发时机

### V5. 队员下线的影响

- 成员加入队伍后下线，队长还能不能继续操作？
- 队伍 3600 秒过期会不会触发？

### V6. 建队/加入的真实参数

- 建队是否需要 `matchTeamType`、`serverGroup`
- 加入是按 `teamId` 还是 `邀请码`
- 是否需要队员「准备」(ready)

---

## 5. 分阶段计划

| 阶段 | 内容 | 前置 | 估算 |
|---|---|---|---|
| **P0 协议探测** | 跑 V1~V6，产出命令清单 + 返回结构 | token | 1~2 天 |
| **P1 只读面板** | 查队伍、查十殿状态、显示 8 层进度 | P0 | 1 天 |
| **P2 组队** | 队长建队 → 多号加入 → 全员准备 | P0 | 2 天 |
| **P3 战斗循环** | 逐层派兵 → 结算 → 判定击杀 → 下一层 | P0 | 1~2 天 |
| **P4 恢复策略** | 状态检查 + 恢复次数分配 | P3 | 1~2 天 |
| **P5 UI** | 成员面板 / 进度 / 日志 / 自动模式 | P2~P4 | 2 天 |

**总计 8~11 天**（含 P0 的不确定性）

### P3 战斗循环（核心算法，已可先写）

```js
for (const boss of groups.normal.bosses) {          // 1 → 8
  let killed = false;

  for (const member of members.sort((a, b) => b.power - a.power)) {
    if (killed) break;                               // 打死了，机会留给下一个 boss

    if (member.hp < HP_THRESHOLD && restoreLeft > 0) {
      await recover(member);                         // 省着用，优先主力
      restoreLeft -= 1;
    }

    const res = await fightBoss(boss, member.id);    // 该成员本 boss 唯一一次
    if (res.bossKilled) {
      killed = true;                                 // 次数自动刷新
    }
  }

  if (!killed) {
    log(`第 ${boss} 层 5 次机会用完仍未击杀，停止`);
    break;
  }
  log(`第 ${boss} 层通关，进入第 ${boss + 1} 层`);
}
```

**策略要点**：
1. 成员按战力降序，最强先上（少回合、少消耗）
2. 恢复次数优先留给后段主力，前几层尽量不用
3. 任何一层没打死就整个停止（后面的层没意义）
4. 每次出战前后都重读状态，以服务端为准（不信任本地缓存）

---

## 6. 探测脚本用法

**文件**：`render-backend/scripts/probe-nightmare.js`（已写好，未提交）

**三级探测**：

| 级别 | 参数 | 副作用 |
|---|---|---|
| 只读 | `--probe-read` | 无 |
| 组队 | `--probe-team --yes` | 会真实建队 |
| 战斗 | `--probe-fight --yes` | 会消耗次数 |

**单条试命令**：

```bash
node render-backend/scripts/probe-nightmare.js --token token.json --cmd nightmare_getinfo
```

**候选命令清单**：

- 只读：`nightmare_getinfo` / `nightmare_getroleinfo` / `nightmare_getprogress` / `nightmare_getteam` / `nightmare_getlist` / `room_getinfo` / `team_getinfo` / `team_getmyteam` / `team_getteamlist` / `fight_getnightmareinfo`
- 组队：`team_create` / `team_createteam` / `team_join` / `team_jointeam` / `team_leave`
- 战斗：`fight_startnightmare` / `nightmare_fight` / `nightmare_startfight` / `room_fight` / `nightmare_restorehp` / `nightmare_recover` / `team_recoverhp`

**判定原理**：脚本先发一个故意不存在的命令做基线，后续返回同样错误码/文案的判定为「不存在」，否则为「存在但参数/时机不对」。不依赖硬编码错误码表。

**token 来源**：项目「Token 管理」里复制，存成 `token.json`（含 `roleToken` / `roleId` / `sessId` / `connId`）。

---

## 7. 代码结构设计

```
src/
├── utils/
│   ├── nightmareApi.js        # 协议封装（探测确认后填充实际命令名）
│   └── nightmareStrategy.js   # 派兵与恢复策略（纯函数，可单测）
├── components/cards/
│   └── NightmareCard.vue      # 主卡片（沿用 ShopGoodsCard 的视觉规范）
└── views/
    └── Nightmare.vue          # 如需要独立页面

render-backend/scripts/
└── probe-nightmare.js         # 探测脚本（已完成）
```

**nightmareApi.js 预设接口**（命令名待 P0 确认）：

```js
export async function getNightmareInfo(tokenId)      // 状态：层数、剩余次数、恢复次数、成员状态
export async function createTeam(tokenId)            // 建队 → teamId
export async function joinTeam(tokenId, teamId)      // 加入
export async function leaveTeam(tokenId)
export async function fightBoss(tokenId, bossId, memberId)  // 派成员出战
export async function recoverMember(tokenId, memberId)      // 恢复状态
```

**nightmareStrategy.js 预设**（不依赖协议，可先写 + 单测）：

```js
export function pickNextMember(members, bossRound)   // 选下一个出战成员
export function shouldRecover(member, restoreLeft, bossIndex)  // 是否该用恢复次数
```

---

## 8. UI 设计草案

**位置**：游戏功能页新增卡片（参考 ShopGoodsCard 的卡片规范）

**布局**：

```
┌─ 十殿试炼 ───────────────────────────────┐
│ 第 3/8 层 · 幽冥殿 · Boss 剩余 42%        │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  进度条            │
├──────────────────────────────────────────┤
│ 队员   战力     本层次数   状态   恢复   │
│ ① 主号  12.3亿   可用      100%   —     │
│ ② 小号1 8.7亿    已出战     68%   [恢复] │
│ ③ 小号2 8.1亿    可用       92%   —     │
│ ④ 小号3 7.5亿    已出战     41%   [恢复] │
│ ⑤ 小号4 6.9亿    可用      100%   —     │
├──────────────────────────────────────────┤
│ 剩余恢复次数：1                           │
│ [ 指定出战 ] [ 自动挑战 1-8 ] [ 停止 ]     │
├──────────────────────────────────────────┤
│ 日志：第 2 层 主号 出战 → 击杀 → 次数刷新  │
└──────────────────────────────────────────┘
```

**交互要点**：
- 每行的 `[恢复]` 在次数为 0 时置灰
- 成员「本层次数」用完显示「已出战」
- 自动挑战时按钮变「停止」，日志实时滚动
- 未组队时整卡显示「先组队」引导

---

## 9. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| 命令名猜不中 | 阻塞全部开发 | 扩候选范围；若仍失败，考虑抓包（浏览器 DevTools 抓一次手动操作的真实请求） |
| 未知命令静默超时 | 探测慢（每条 8s） | 加 `--timeout 3000` |
| 战斗异步推送 | 循环写不下去 | 先探明是同步返回还是推 `fightId` 异步结果 |
| 队员下线后队伍失效 | 组队方案不可行 | V5 专门验证；若失效则改为「队员保持在线但只挂连接」 |
| 900 亿战力打不过 | 工具跑通但没结果 | 数值问题，非工具问题；UI 里显示预计伤害/剩余血量供判断 |
| 多账号同 IP 风控 | 可能被限制 | 各号加随机延迟（沿用现有自动化功能的做法） |
| 队伍 3600s 过期 | 长时间挂机中断 | 战斗中定期检查队伍状态，过期则自动重建 |

---

## 10. 回家后的执行顺序（Checklist）

- [ ] 1. 打开项目 → 菜单「消息测试」，输入 `nightmare_getinfo` 发一次，看返回
- [ ] 2. 依次试 `nightmare_getroleinfo` / `nightmare_getprogress` / `team_getmyteam` / `room_getinfo`
- [ ] 3. 把每次的返回结构（截图或复制 JSON）发我
- [ ] 4. 命中后，再试组队类：`team_create`、`team_join`（这一步会真的建队，注意别再手动建）
- [ ] 5. 确认 V2~V6（结算包、刷新时机、恢复粒度、队员下线、真实参数）
- [ ] 6. 信息齐了我开始写 `nightmareApi.js` 与战斗循环

> **顺序建议**：只读命令 → 组队命令 → 战斗命令，逐级推进，每步确认后再下一步。
> 战斗命令一旦发出去可能真的开打并消耗次数，务必先确认前两级。

---

## 附：相关文件索引

| 文件 | 用途 |
|---|---|
| `render-backend/scripts/probe-nightmare.js` | 探测脚本（本次新增，未提交） |
| `render-backend/scripts/probe-apex-claim.js` | 探测方法的参考实现 |
| `src/views/PushingLevels.vue` | 战斗调用与结算校验的参考实现 |
| `src/utils/xyzwWebSocket.js` | WS 客户端与心跳 |
| `src/stores/tokenStore.ts` | 多账号管理 |
