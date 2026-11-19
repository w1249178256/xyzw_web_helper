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
> ~~试过了：BON 帧的 `parse(buf, enc)` 需要**会话密钥**（登录握手时交换），
> 浏览器抓到的原始帧离线解不开（报 `enc.decrypt is not a function`）。
> 而游戏自身的 WS 不经过本项目，项目日志也拿不到命令名。
> 所以只能靠「用合法连接主动试命令」这条路——也就是上面的消息测试页 / 探测脚本。~~

> **⚠️ 以上结论已被推翻（2026-11-10 复核）**
>
> 抓包解码是**可行**的，而且比猜命令名快得多。之前的失败是调用方式不对：
> `parse(buf, enc)` 的第二个参数必须传 `getEnc("auto")`（项目里 `g_utils.parse(bytes, "auto")`），
> 它内部会按帧头魔数（`pl` / `px` / `pt`）自动选通道并解密；
> `lx` / `x` 两个通道的算法在 `src/utils/bonProtocol.js` 里是**自包含实现**，
> 只有 `xtm` 需要 `globalThis.XXTEA`。游戏 H5 走的是 `e=x` 通道，离线完全解得开。
>
> 已验证：2026-11-05 抓游戏 H5 的帧，成功解出 `fight_endlevel` 的完整请求体
> （`levelId` / `battleTime` / `tapTimes` / `autoTapTimes` / `outputCode`）。
>
> 因此 P0 的推荐做法改为：**实机操作一次 → 抓包 → 解码 → 直接拿到命令名和字段**，
> 不再靠候选命令表逐个试。埋点实现见 `public/game/ws-trace.js`，
> 解码脚本见 `tools/decode-frontend-ws.mjs`。

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

## 4.5 P0 实测结果（2026-11-10，已确认）

通过游戏 H5 实机操作 + WS 报文抓包确认，**命令前缀不是 `team_` / `nightmare_`，而是 `matchteam_` 和 `nmext_`**。
抓包工具：`public/game/ws-trace.js` → `/frontend-log` → `render-backend/logs/`，
解码：`node tools/decode-frontend-ws.mjs`。

### 命令清单（已实测跑通）

| 命令 | 作用 | 请求体 |
|---|---|---|
| `matchteam_create` | 创建队伍 | 见下 |
| `matchteam_createresp` | 建队返回（含 teamId 与 teamInfo） | — |
| `matchteam_join` | 加入队伍 | `{ teamId }` |
| `matchteam_joinresp` | 加入返回（`joinType` + teamInfo） | — |
| `matchteam_memberprepare` | 队员准备 | `{ teamId }` |
| `matchteam_getteaminfo` | 查队伍 | `{ teamId }` |
| `matchteam_getroleteaminfo` | 查角色所在队伍 | `{}` |
| `matchteam_dismiss` | 解散/离开队伍 | `{ teamId }` |
| `matchteam_notify` | **服务端主动推送**队伍状态 | — |
| `matchteam_getrandteamlist` | 随机队伍列表（匹配用） | — |
| `queue_getinfo` | 匹配队列状态 | `{}` |
| `nmext_getinfo` | **十殿扩展状态**（`roleNMExt`） | `{}` |
| `nightmare_getroleinfo` | 十殿角色信息 | `{}` |

> `teamCfgId: 1` 就是 `MatchTeam` 表中 `matchTeamType=1` 的十殿组队配置（2~5 人、存活 3600s）。

### 创建队伍

请求：

```js
matchteam_create, {
  teamCfgId: 1,
  setting: {
    name: "♪Iain的队伍",
    notice: "",
    secret: 1,      // 1 = 需要申请/邀请才能进？实测设为 1 仍可直接 join，待确认
    apply: 0,
    applyList: [],
    star: 0,
  },
  param: 0,
  custom: {},
  extParam: 0,
}
```

返回 `matchteam_createresp`：

```js
{
  roleMTData: { gDMTData: { "10005921": { teamId: "10005921", teamCfgId: 1, endTime: 0 } } },
  teamInfo: {
    teamId: "10005921",     // 字符串
    teamCfgId: 1,
    serverId: 7358,
    leaderId: 88983360,
    createAt: 1794319010,
    fightRoleBase: [ /* 成员列表，见下 */ ],
    extParam: 0,
  },
}
```

### 加入队伍

```js
matchteam_join, { teamId: "10005921" }
```

返回 `matchteam_joinresp`：

```js
{ joinType: 1, roleMTData: {...}, teamInfo: { /* 同 create，含全部成员 */ } }
```

要点：
- **只需 `teamId`，不需要邀请码**（队友把 ID 发给你就能加）
- `teamId` 是**字符串**，不是数字
- 加入后服务端会向所有成员推 `matchteam_notify`

### 队伍状态推送 `matchteam_notify`

```js
{ matchTeamData: { teamId, teamCfgId, state, stateEndTime, serverId, leaderId, createAt, fightRoleBase: [...] } }
```

实测到两种 `state`：

| state | 含义（推测） |
|---|---|
| 0 | 组队中 / 可准备 |
| 2 | 已结束或已解散（带 `fighting: false` 的简报形态） |

### 成员对象 `fightRoleBase[i]`（关键字段）

```js
{
  roleId, name, headImg, serverId,
  prepared: 0,          // 0 未准备 / 1 已准备（配合 matchteam_memberprepare）
  power: 13299852001,   // 战力
  legionName, legionId,
  battleData: null,     // 战斗时的上阵数据
  charmData, charmResetTime,
  extParam: {
    nightmareLove: 3866,  // 十殿相关计数
    redQuenchCnt: 46,
    totalPower: 13299852001,
    pass8: 1794153600,    // 通关第 8 层的时间戳（0/缺失=未通关）
    itemCnt: 4,           // 可用道具数（对应 useItem 5054）
    privilege5: 1,        // 特权标记
  },
  avatarFrame, customCard,
}
```

**`pass8` 是关键**：队长据此判断谁有资格/谁已通关；`itemCnt` 是本周剩余次数或门票。

### 组队流程：已验证的正确顺序（2026-11-10 22:49 实跑通过）

5 个账号（1 队长 + 4 队员）全流程跑通，最终 `prepared` 全部为 1。**顺序不能随便调**：

```
① 并行连接所有账号（15s 超时 + 1 次重试），连不上的直接排除
② 队长查 matchteam_getroleteaminfo → 已有 cfg=1 队伍就复用，没有才建
③ 分析队伍：matchteam_getteaminfo → 谁在队里 / 谁是 leaderId / 谁 prepared=1
④ 补齐未加入：不在成员列表里的才 join，已在的跳过
⑤ 加入后重新分析一次，拿到最新 prepared
⑥ 只给"在队里 + 非队长 + prepared=0"的人发 memberprepare
⑦ 再查一次，输出最终状态
```

#### 一键组队（自动校正版，2026-11-18）

实验台「一键组队」在旧流程上加了三步校正，逻辑按「服务端事实」而不是「本地勾选顺序」：

```
① 队长 roleId：房间帧 room.leaderId > 目标队伍 leaderId > 第一个勾选账号
② 队长连接：按房间帧昵称自动匹配 token 并连上；仍找不到 →
   直接报错「缺少队长连接：<昵称>(roleId)，请勾选并连接队长账号」并中止
③ 目标队伍：room.matchTeamId > 输入框 > 队长当前 cfg=1 队伍 > 新建
④ 逐个账号查 matchteam_getroleteaminfo：
     在别的 cfg=1 队伍 → matchteam_dismiss { teamId } 退出（仅非队长），再 join 队长队伍
     已在队长队伍       → 跳过加入
     队长本人           → 不退出、不准备（服务端不允许队长准备）
⑤ 重新 getteaminfo，只对 prepared=0 的队员发 memberprepare
⑥ 再查一次输出最终状态，并把 fightRoleBase 的 5 人布阵渲染成卡片
```

注意：`matchteam_dismiss` 对队长是「解散」、对普通成员是「离队」，所以只在非队长身上调用。
目标队伍若已失效（analyzeTeam 拿不到队长），会回退到队长当前所在队伍，避免拿旧 teamId 白跑。

**三个必须注意的坑：**

| 坑 | 现象 | 处理 |
|---|---|---|
| `matchteam_memberprepare` 是**开关** | 对已准备的人再调一次会**取消准备**（实测 prepared 1→0，两次都返回 ok） | 必须先 `getteaminfo` 读 `prepared`，只对 0 的发 |
| 未加入就准备 | `7800320 不在队伍中` | 以服务端成员列表为准，只处理真实成员 |
| 重复加入 | `7100020 已经加入队伍`（幂等） | 当成成功，不要中断流程 |

**常见返回码**

| code | 服务端 error | 含义 |
|---|---|---|
| `7100020` | 已经加入队伍 | 幂等成功 |
| `7800320` | 不在队伍中 | 尚未加入就准备 / 已退出 |
| `200110` | 内容包含非法字符 | **队名**命中敏感词（「十殿测试」会被拒，改用「123」正常） |
| `200020` | 出了点小问题 | 服务端早期异常，多为请求体缺字段/编码错 |

> **重要**：错误包除 `code` 外还有 `error` 字段（如 `{"code":200110,"error":"内容包含非法字符"}`）。
> `xyzwWebSocket.js` 原来只读 `errorCodeMap[code] || packet.hint`，所以一直显示「未知错误」，
> 排查时务必把 `packet.error` 一并纳入，并把整个错误包挂到 `err.rawPacket`。

**建队前置（缺了会 200110 之外的失败，也不该省）**

```js
role_gettargetteam { targetId: <roleId>, teamType: 3, cCMonsterId: 0 }  // teamInfo.team 是真实站位
hero_calcpowerbyteam { battleTeam, lordWeaponId, petUId }
team_setteam { teamType: 3, battleTeam, lordWeaponId, petUId, cCMonsterId: 0 }
matchteam_getrandteamlist { teamCfgId: 1, param: 0, custom: {} }
// 等 4~6 秒（与游戏节奏一致）再 matchteam_create
```

- 站位必须用 `role_gettargetteam` 的 `team`（真实出战顺序），
  不能用 `presetteam_getinfo` 的预设阵容——两者顺序不同（2/4 号位会错位）
- `lordWeaponId` 取 `teamInfo.weaponId`
- `petUId`：`teamInfo` 里**没有**这个字段，`role_getroleinfo.petData.pets` 也是空的
  （宠物走独立命令）。实测传空串不影响建队，真要打战斗时再补

### 开战全链路（2026-11-10 23:15 实机抓包，已跑通第 1 层）

```
15:15:08 → matchteam_openteam   { teamId: "10006740" }                  // 队长开团，进入十殿房间
15:15:18 ← nightmare_roominfo_notify  14KB                               // 房间全量状态（全员布阵 + 血量）
15:15:23 → nightmare_setfighter { roomId: "33687645", roleId: 88983360 } // 指定上场者（自己）
15:15:24 → nightmare_fight      { roomId: "33687645", roleId: 88983360 } // 发起战斗
15:15:25 ← nightmare_fightnotify 7.5KB                                   // 战报（含 result.isWin）
15:15:25 ← nightmare_fightresp  { roomId, roleId }                       // 回执
15:16:28 → nightmare_leadercomplete { roomId }                           // 队长标记本层完成 → 进下一层
```

**最关键的一条：`nightmare_fight` 请求只有 `{ roomId, roleId }`，战斗由服务端模拟。**

这和主线推关完全不同——主线必须客户端跑出 `outputCode` 校验码，十殿**不需要**。
战报里的 `outputCode` 是服务端返回的结果，不是我们要算的东西。所以十殿可以全自动。

### 快速模式（实验台开关，跳过战斗播放）

时间账（抓包）：

| 环节 | 耗时 | 谁决定 |
|---|---|---|
| `nightmare_fight` → `nightmare_fightnotify` | 0.2~0.3 s | 服务端计算 |
| 战报 → 可操作（`state=1`） | 帧数 × ~24 ms（实测 65~130 s） | 客户端播放动画（时长由服务端按帧数估） |
| 两场之间 CD | 15 s | 配置表 `fightIntervalTime` |

所以实验台加了「快速模式」：开战后**等 N 秒（最小 5）**直接由队长发
`nightmare_leadercomplete { roomId }`，把 `state` 从 1 改 0，跳过剩余播放。
发完立刻回读前端帧，检查 `room.state` 是否真的变成 0：

- `state=0` → 提前发被采纳，每场可压到 ~6 s + 剩余 CD
- `state=1` → 服务端仍按播放时长计时，只能等播放完（日志会明确提示）

等待秒数可在页面上调（默认 5，最小 5）。`leadercomplete` 的回执**不一定有**
（同 `setfighter` 可能不回包），所以发送后只等 2.5 秒，真正的判定是回读的
`room.state`；页面上的「手动发 leadercomplete」按钮走同一条路径，方便单点验证。
CD 倒计时只是显示提示，不阻塞操作。**基准是 state 结束**：实测唯一一条带
`fightLimitTime` 的帧为 `stateEndTime + 15`，所以普通模式用 `stateEndTime + 15s`，
快速模式在 leadercomplete 生效（state→0）那一刻起算 15s。

### 恢复：`nightmare_restore`（2026-11-12 23:14 实机抓包）

```
nightmare_restore { roomId, roleId }        // roleId = 被恢复的成员，队长可替任意队员发
← nightmare_roominfo_notify { roomInfo: { fightRoleBase, restoreCnt, playerTeamInfo } }
← nightmare_restoreresp { roomId, roleId }
```

- **队长可以替队员恢复**（实测页面登录的是队长 88983360，restore 的 roleId 是 89026144）
- 效果：该成员阵亡武将全部回满血，`curEnergy` 变 `-1`（满怒）
- `restoreCnt` 是**房间级**计数（第 1 次恢复后 1，换个人恢复后 2），不是每人一份
- 推送 patch 里 `playerTeamInfo` 只带变化的武将，缺字段 ≠ 血量为 0，别误判成阵亡
- `reliveCnt`（复活）仍是独立命令，尚未抓到

### 恢复：`nightmare_restore`（2026-11-12 23:14 实机抓包）

```
nightmare_restore { roomId, roleId }        // roleId = 被恢复的成员，队长可替任意队员发
← nightmare_roominfo_notify { roomInfo: { fightRoleBase, restoreCnt, playerTeamInfo } }
← nightmare_restoreresp { roomId, roleId }
```

- **队长可以替队员恢复**（实测页面登录的是队长 88983360，restore 的 roleId 是 89026144）
- 效果：该成员阵亡武将全部回满血，`curEnergy` 变 `-1`（满怒）
- `restoreCnt` 是**房间级**计数（第 1 次恢复后 1，换个人恢复后 2），不是每人一份
- 推送 patch 里 `playerTeamInfo` 只带变化的武将，缺字段 ≠ 血量为 0，别误判成阵亡
- `reliveCnt`（复活）仍是独立命令，尚未抓到

### 读取房间：`nightmare_getroominfo`（2026-11-12 实机补抓）

```
nightmare_getroominfo { roomId }  →  nightmare_getroominforesp { roomInfo }   // 全量，不是 patch
```

客户端从战斗**返回房间**时发的就是它。返回的 `roomInfo` 与推送结构一致，且一次性带全：

- `monsterTeamInfo[layer].curMonsterData[怪物id].curHp` —— **真实 boss 血量**（不再需要靠战报推算）
- `monsterTeamInfo[layer].fightSnapData[roleId]` —— 每人 `attackedNum / round / charmed`
- `playerTeamInfo[roleId].curHeroData` —— 每人 5 个武将的 `curHp / curEnergy`
- `fightRoleBase[]` —— 5 人 + `prepared` + `battleData.team`（布阵）
- `curMonsterCfgId` / `fighterId` / `fightLimitTime`（下次可战时刻）

**快照里没有 `state` / `stateEndTime`**（这两个只在战斗中的推送帧里出现），
所以判断"是不是在播动画"仍要看 `nightmare_roominfo_notify`；CD 则可以直接用 `fightLimitTime`。

> 这条命令解决了一个大问题：以前以为房间只能靠推送/日志重放，实际助手连接自己就能查。

### 房间状态 `nightmare_roominfo_notify.roomInfo`

**这个 notify 是增量 patch**，不是全量：多次推送里很多字段是 `undefined`，客户端必须自己合并。

| 字段 | 含义 |
|---|---|
| `roomId` / `roomName` / `matchTeamId` | 房间号 / 队名 / 对应队伍 |
| `state` | `1` = 战斗中，`0` = 结束/待开始 |
| `stateEndTime` | 当前状态结束时间 |
| `leaderId` | 队长 |
| `fighterId` | 当前上场者 roleId |
| `curMonsterCfgId` | **当前层数/boss**（实测 1 → 2） |
| `lastMonsterId` | 上一只怪 |
| `reliveCnt` / `restoreCnt` / `saveCnt` | 复活 / 恢复 / 存档已用次数 |
| `power` / `rank` / `season` | 战力 / 排行 / 赛季（48） |
| `fightLimitTime` | **下次可战时刻**（实测 = `stateEndTime + 15`，即 15 秒 CD 从播放结束算） |
| `auto` | 是否自动战斗 |
| `fightRoleBase[]` | 5 个成员，见下 |

> **两个关键坑（2026-11-10 帧实测）**
>
> 1. `monsterTeamInfo[layer].monsterTeam.team` **不存在**（只有 `teamInfo: null`），
>    boss 实时血量在 `monsterTeamInfo[layer].curMonsterData[怪物id].curHp`
>    （id 与配置表 `10001 / 1000101` 一致）。未交战的层会被下发成全 0 占位。
> 2. `fightSnapData[roleId]`（挂在每一层下）记录本层每人 `attackedNum / round / fightTime / charmed`，
>    而层上的 `totalAttacked` 只统计总次数。
> 3. `state=1` 的那帧里 `curMonsterCfgId` **已经跳到下一层**（首战 bossCfgId=1，同帧 layer=2），
>    所以"正在结算第几层"要看 `lastFight.bossCfgId`。

### 每个成员的上阵与实时状态：`roomInfo.fightRoleBase[i].battleData`

**注意：这个 `battleData` 只有在房间里（`openteam` 之后）才有值，`matchteam_getteaminfo` 里永远是 null。**

```js
battleData = {
  roleId, power, tapAttack,
  weaponId, weaponActiveLevelId,      // 武器（兵符）
  petId, petUId, petEvo, petActiveSkillId, petPassiveSkillIds,  // 宠物
  team: {                              // 0~4 号位
    0: {
      id: 110, level: 6000, star: 30, order: 19, skin: 11005, activeSkill: 1105,
      curHp: 9706155568, hp: 9706155568,   // 当前血量 / 最大血量
      curEnergy: -1,                        // 怒气（-1 = 未初始化/满怒）
      attack: 421056944, defense: 159295037, speed: 0,
      skill: [1106, 1107, 1108, 1033013, 112150],
      enchantMap: {}, attribute: {}, power: 0,
    },
    ...
  },
}
```

实测 5 个账号的十殿布阵（20 个武将全部 Lv6000 / 30★ 上下）：

| 账号 | 战力 | 武器 | 宠物 | 0~4 号位武将 |
|---|---|---|---|---|
| ♪Iain（队长） | 128.66 亿 | 8 | 无 | 110 黄月英 / 113 曹仁 / 120 张角 / 104 诸葛亮 / 106 太史慈 |
| 罐子21 | 100.26 亿 | 8 | 501 `102-6cS` | 110 / 101 司马懿 / 113 / 106 / 104 |
| 罐子23 | 85.87 亿 | 2 | 601 `205-Tnf` | 107 吕布 / 116 公孙瓒 / 106 / 104 / 102 郭嘉 |
| ༺陆沉༻ | 86.03 亿 | 4 | 无 | 111 孙策 / 102 / 106 / 104 / 105 周瑜 |
| 罐子22 | 66.38 亿 | 3 | 601 `272-eTt` | 116 / 107 / 112 贾诩 / 104 / 106 |

> 这几个武将 id → 名字来自 `src/utils/HeroList.js` 的 `HERO_DICT`。
> 队长的 `petId=0 / petUId=""`，说明他没带宠物，服务端也不报错。

### 战报 `nightmare_fightnotify`

```js
{
  roleId, bossCfgId,          // 谁打的、打的第几层
  battleData: { id, mode: 13, randomSeed, version, maxRound: 15,
                leftTeam, rightTeam, outputCode, result, fightTime, statistic },
  result: {
    id, isWin, totalFrame, seed, version, battleVersion,
    type: 13, round: 7, isTimeout: 0, memoMode: 3,
    inputCode, outputCode, log,
    sponsor: { roleId, power, teamInfo: [ ... ] },   // 我方每个武将的战报
    accept:  { ... teamInfo }                        // 对手（怪）的
  }
}
```

**`result.sponsor.teamInfo[i]` 才是"每个角色的战斗数据"**：

| 字段 | 含义 |
|---|---|
| `heroId` / `level` / `star` / `slot` / `order` | 武将、站位 |
| `hp` / `energy` | 血量 / **结束时怒气**（实测 0 / 50 / 100） |
| `damage` | **造成伤害**（131.78 亿） |
| `takeDamage` | **承受伤害**（20.96 亿） |
| `treatment` | **治疗量**（195.29 亿） |
| `maxAttr` | `{2: 最大血量, 3: 最大防御, 4: 最大攻击}` |
| `skillDamage` / `skillTreatment` | 技能伤害/治疗明细（本次为空） |

**对手（boss）的 `accept.teamInfo` 是残缺的**：`hp` 恒为 0、`maxAttr` 全 0，
只有 `takeDamage` 有意义。所以：

- boss 当前血量 → 只能取房间帧的 `curMonsterData[*].curHp`
- boss 最大血量 → 只能靠"开战前快照"反推（`max(curHp)` 历史最大值）
- 单场"boss 还剩多少" → 战前快照 − 本场 `takeDamage`（首次打某层没有快照，只能报承伤）

实测两场：

| 层 | bossCfgId | isWin | totalFrame | round |
|---|---|---|---|---|
| 第 1 层 | 1 | **true** | 2484 | — |
| 第 2 层 | 2 | **false** | 5459 | 7 |

### 仍未抓到的（下一轮实机补）

| 待确认 | 说明 |
|---|---|
| 恢复 | `nightmare_recover` 之类未验证（`restoreCnt` 字段存在） |
| 复活 | `reliveCnt` 字段存在，命令未知 |
| 多人同时出战 | 本次只有队长 `setfighter`，其他成员是否需要各自 `setfighter` 未验证 |
| 星级挑战 | `nmext_getinfo` 里的 `starFightCntMap` 已看到，但触发命令未知 |

`nmext_getinforesp` 已解出的状态结构（可用于 P1 只读面板）：

```js
{ roleNMExt: {
    roleId, starResetTime,
    starFightCntMap: {},           // 各星级已打次数
    privilegeStarFightCntMap: {},  // 特权额外次数
    starBossCompleteMap: {},       // { 层: { 序号: true } } 通关标记
    starRewardsClaimedMap: {},
    hasKeyCntMap: {},
    weekAward: {},
    raceUnlockRaceId, raceFightCnt, raceTaskRewardsClaimedMap,
    topArriveRecord: {}, topJoinTimes: {},
    taskProgress: { "1": 0, "2": 0, "3": 0, "4": 0 },
    param: 0,
} }
```

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
