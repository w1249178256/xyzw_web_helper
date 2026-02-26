/**
 * 游戏命令构造器
 * 基于mirror代码中的游戏指令实现完整的游戏功能
 */

import { g_utils } from "./bonProtocol.js";

// 生成随机数工具函数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 游戏命令构造器类
 * 每个命令方法返回标准的WebSocket消息格式
 */
export class GameCommands {
  constructor(g_utils_instance = g_utils) {
    this.g_utils = g_utils_instance;
  }

  /**
   * 心跳消息
   */
  heart_beat(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: {},
      cmd: "_sys/ack",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取角色信息
   */
  role_getroleinfo(ack = 0, seq = 0, params = {}) {
    return {
      cmd: "role_getroleinfo",
      body: this.g_utils.bon.encode({
        clientVersion: "2.10.3-f10a39eaa0c409f4-wx",
        inviteUid: 0,
        platform: "hortor",
        platformExt: "mix",
        scene: "",
        ...params,
      }),
      ack: ack || 0,
      seq: seq || 0,
      time: Date.now(),
    };
  }

  /**
   * 获取数据包版本
   */
  system_getdatabundlever(ack = 0, seq = 0, params = {}) {
    return {
      cmd: "system_getdatabundlever",
      body: this.g_utils.bon.encode({
        isAudit: false,
        ...params,
      }),
      ack: ack || 0,
      seq: seq || 0,
      time: Date.now(),
    };
  }

  /**
   * 购买金币
   */
  system_buygold(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        buyNum: 1,
        ...params,
      }),
      cmd: "system_buygold",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 分享回调
   */
  system_mysharecallback(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        type: 3,
        isSkipShareCard: true,
        ...params,
      }),
      cmd: "system_mysharecallback",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 好友批处理
   */
  friend_batch(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        friendId: 0,
        ...params,
      }),
      cmd: "friend_batch",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 英雄招募
   */
  hero_recruit(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        byClub: false,
        recruitNumber: 1,
        recruitType: 3,
        ...params,
      }),
      cmd: "hero_recruit",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取挂机奖励
   */
  system_claimhangupreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "system_claimhangupreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开宝箱
   */
  item_openbox(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        itemId: 2001,
        number: 10,
        ...params,
      }),
      cmd: "item_openbox",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开始竞技场
   */
  arena_startarea(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "arena_startarea",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取竞技场目标
   */
  arena_getareatarget(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        refresh: false,
        ...params,
      }),
      cmd: "arena_getareatarget",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开始竞技场战斗
   */
  fight_startareaarena(ack = 0, seq = 0, params = {}) {
    if (params?.targetId === undefined || params?.targetId === null) {
      throw new Error("fight_startareaarena requires targetId in params");
    }
    // battleVersion 应该由调用方通过 params 传入
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "fight_startareaarena",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取商店商品列表
   */
  store_goodslist(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        storeId: 1,
        ...params,
      }),
      cmd: "store_goodslist",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 商店购买
   */
  store_buy(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        goodsId: 1,
        ...params,
      }),
      cmd: "store_buy",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 军团商店购买商品
   */
  legion_storebuygoods(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "legion_storebuygoods",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 商店刷新
   */
  store_refresh(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        storeId: 1,
        ...params,
      }),
      cmd: "store_refresh",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取机器人助手奖励
   */
  bottlehelper_claim(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "bottlehelper_claim",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 启动机器人助手
   */
  bottlehelper_start(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        bottleType: -1,
        ...params,
      }),
      cmd: "bottlehelper_start",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 停止机器人助手
   */
  bottlehelper_stop(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        bottleType: -1,
        ...params,
      }),
      cmd: "bottlehelper_stop",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 钓鱼
   */
  artifact_lottery(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        lotteryNumber: 1,
        newFree: true,
        type: 1,
        ...params,
      }),
      cmd: "artifact_lottery",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取每日积分
   */
  task_claimdailypoint(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        taskId: 1,
        ...params,
      }),
      cmd: "task_claimdailypoint",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取周奖励
   */
  task_claimweekreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        rewardId: 0,
        ...params,
      }),
      cmd: "task_claimweekreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开始BOSS战
   */
  fight_startboss(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "fight_startboss",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 精灵扫荡
   */
  genie_sweep(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "genie_sweep",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 购买精灵扫荡
   */
  genie_buysweep(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "genie_buysweep",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 签到奖励
   */
  system_signinreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "system_signinreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取折扣奖励
   */
  discount_claimreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        discountId: 1,
        ...params,
      }),
      cmd: "discount_claimreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取卡片奖励
   */
  card_claimreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        cardId: 1,
        ...params,
      }),
      cmd: "card_claimreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 军团签到
   */
  legion_signin(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "legion_signin",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开始军团BOSS战
   */
  fight_startlegionboss(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "fight_startlegionboss",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取每日任务奖励
   */
  task_claimdailyreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        rewardId: 0,
        ...params,
      }),
      cmd: "task_claimdailyreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取军团信息
   */
  legion_getinfo(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({}),
      cmd: "legion_getinfo",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 军团匹配角色报名
   */
  legionmatch_rolesignup(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({}),
      cmd: "legionmatch_rolesignup",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开始爬塔
   */
  fight_starttower(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({}),
      cmd: "fight_starttower",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取爬塔奖励
   */
  tower_claimreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "tower_claimreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取爬塔信息
   */
  tower_getinfo(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "tower_getinfo",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 开始答题游戏
   */
  study_startgame(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({}),
      cmd: "study_startgame",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 答题
   */
  study_answer(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "study_answer",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取答题奖励
   */
  study_claimreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        rewardId: 1,
        ...params,
      }),
      cmd: "study_claimreward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取邮件列表
   */
  mail_getlist(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        category: [0, 4, 5],
        lastId: 0,
        size: 60,
        ...params,
      }),
      cmd: "mail_getlist",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取所有邮件附件
   */
  mail_claimallattachment(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        category: 0,
        ...params,
      }),
      cmd: "mail_claimallattachment",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 获取俱乐部战争详情
   */
  legionwar_getdetails(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        date: "2025/10/04",
        ...params,
      }),
      cmd: "legionwar_getdetails",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取珍宝阁每日免费奖励
   */
  collection_claimfreereward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params,
      }),
      cmd: "collection_claimfreereward",
      seq,
      time: Date.now(),
    };
  }

  /**
   * 领取功法挂机
   */
  legacy_claimhangup(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params
      }),
      cmd: "legacy_claimhangup",
      seq,
      time: Date.now()
    }
  }

  /**
   * 输入密码
   */
  role_commitpassword(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        passwordType:1,
        password: 946215,
        ...params
      }),
      cmd: "role_commitpassword",
      seq,
      time: Date.now()
    }
  }

  /**
   * 赠送功法
   */
  legacy_sendgift(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        targetId: 111582820,
        itemCnt: 0,
        legacyUIds: [],
        ...params
      }),
      cmd: "legacy_sendgift",
      seq,
      time: Date.now()
    }
  }

  /**
   * 功法赠送详情
   */
  legacy_getgifts(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        typ: 1,
        ...params
      }),
      cmd: "legacy_getgifts",
      seq,
      time: Date.now()
    }
  }

  /**
   * 功法详情
   */
  legacy_getinfo(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
                ...params
      }),
      cmd: "legacy_getinfo",
      seq,
      time: Date.now()
    }
  }

  /**
   * 功法收集
   */
  legacy_claimgift(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        id: params.id || "",
        ...params
      }),
      cmd: "legacy_claimgift",
      seq,
      time: Date.now()
    }
  }

  /**
   * 装备洗练
   */
  equipment_quench(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        heroId: params.heroId || 0,
        part: params.part || 0,
        quenches: params.quenches || {},
        quenchId: params.quenchId || 0,
        skipOrange: params.skipOrange || false,
        seed: params.seed || 0,
        ...params
      }),
      cmd: "equipment_quench",
      seq,
      time: Date.now()
    }
  }

  /**
   * 灯神扫荡
   */
  genie_sweep(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  genieId:params.genieId,
      	  sweepCnt:params.sweepCnt,
        ...params
      }),
      cmd: "genie_sweep",
      seq,
      time: Date.now()
    }
  }

  /**
   * 领取灯神招募券
   */
  genie_buysweep(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  genieId:4,
      	  sweepCnt:20,
        ...params
      }),
      cmd: "genie_buysweep",
      seq,
      time: Date.now()
    }
  }

  /**
   * 开始灯神挑战
   */
  fight_startgenie(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  battleTeam:{},
      	  genieId:params.genieId,
      	  lordWeaponId:3,
        ...params
      }),
      cmd: "fight_startgenie",
      seq,
      time: Date.now()
    }
  }

  /**
   * 开始梦境挑战
   */
  fight_startdungeon(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  heroId:107,
        ...params
      }),
      cmd: "fight_startdungeon",
      seq,
      time: Date.now()
    }
  }

  /**
   * 俱乐部-申请俱乐部
   */
  legion_applyjoin(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  legionId:params.legionId,
      	  reason:"",
        ...params
      }),
      cmd: "legion_applyjoin",
      seq,
      time: Date.now()
    }
  }

  /**
   * 开始爬塔
   */
  fight_startlevel(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({}),
      cmd: "fight_startlevel",
      seq,
      time: Date.now()
    }
  }

  /**
   * 购买咸鱼币
   */
  charge_createorder(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	        type:30,
      	       goodsId:params.goodsId,
      	       activityId:0,
      	       isQR:false,
      	       platformExt:mix,
      	       osType:others,
      	       notByCoin:false,
        ...params
      }),
      cmd: "charge_createorder",
      seq,
      time: Date.now()
    }
  }

  /**
   * 宝库战斗
   */
  bosstower_startboss(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params
      }),
      cmd: "bosstower_startboss",
      seq,
      time: Date.now()
    }
  }

  /**
   * 宝库详情
   */
  bosstower_getinfo(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
        ...params
      }),
      cmd: "bosstower_getinfo",
      seq,
      time: Date.now()
    }
  }

  /**
   * 宝库大厅
   */
  bosstower_gethall(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  teamId: params.teamId,
        ...params
      }),
      cmd: "bosstower_gethall",
      seq,
      time: Date.now()
    }
  }

  /**
   * 宝库搜索队伍
   */
  bosstower_searchteam(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  teamId: params.teamId,
        ...params
      }),
      cmd: "bosstower_searchteam",
      seq,
      time: Date.now()
    }
  }

  /**
   * 创建匹配队伍
   * @param {number} params.teamCfgId - 队伍配置ID：1=十殿，6=宝库
   * @param {string} params.leaderId - 队长ID（可直接传入，会自动填充到 custom）
   * @param {string} params.teamId - 队伍ID（可直接传入，会自动填充到 custom）
   */
  matchteam_create(ack = 0, seq = 0, params = {}) {
    // 支持从 params.leaderId 和 params.teamId 直接读取，或从 params.custom 读取
    const leaderId = params.leaderId !== undefined ? params.leaderId : (params.custom?.leaderId || "");
    const teamId = params.teamId !== undefined ? params.teamId : (params.custom?.teamId || "");

    return {
      ack,
      body: this.g_utils.bon.encode({
        teamCfgId: params.teamCfgId !== undefined ? params.teamCfgId : 6,
        setting: {
          name: params.setting?.name || "",
          notice: params.setting?.notice || "",
          secret: params.setting?.secret !== undefined ? params.setting.secret : (params.secret !== undefined ? params.secret : 0),
          apply: params.setting?.apply !== undefined ? params.setting.apply : 0,
          applyList: params.setting?.applyList || []
        },
        param: params.param !== undefined ? params.param : 0,
        custom: {
          leaderId: leaderId,
          teamId: teamId,
          ...params.custom  // 允许 custom 中的其他字段覆盖
        }
      }),
      cmd: "matchteam_create",
      seq,
      time: Date.now()
    }
  }

  /**
   * 创建十殿匹配队伍（teamCfgId=1）
   * 默认参数：name="相符的队伍", secret=1, custom={}
   * @param {string} params.leaderId - 队长ID（可直接传入，会填充到 custom.leaderId）
   * @param {string} params.teamId - 队伍ID（可直接传入，会填充到 custom.teamId）
   */
  matchteam_create_shidian(ack = 0, seq = 0, params = {}) {
    return this.matchteam_create(ack, seq, {
      teamCfgId: 1,
      param: 0,
      setting: {
        name: "相符的队伍",
        notice: "",
        secret: 1,
        apply: 0,
        applyList: [],
        ...params.setting
      },
      custom: {},
      leaderId: params.leaderId,
      teamId: params.teamId,
      ...params
    })
  }

  /**
   * 创建宝库匹配队伍（teamCfgId=6）
   * 默认参数：custom 使用 params.leaderId 和 params.teamId
   * @param {string} params.leaderId - 队长ID（会填充到 custom.leaderId）
   * @param {string} params.teamId - 队伍ID（会填充到 custom.teamId）
   */
  matchteam_create_baoku(ack = 0, seq = 0, params = {}) {
    // 提取 leaderId 和 teamId，确保它们被正确放入 custom
    const leaderId = params.leaderId !== undefined ? params.leaderId : (params.custom?.leaderId || "");
    const teamId = params.teamId !== undefined ? params.teamId : (params.custom?.teamId || "");

    // 构建参数，确保 custom 对象正确
    const finalParams = {
      teamCfgId: 6,
      param: 0,
      setting: {
        name: "",
        notice: "",
        secret: 0,
        apply: 0,
        applyList: [],
        ...params.setting
      },
      custom: {
        ...params.custom,  // 先合并 params.custom 中的其他字段
        leaderId: leaderId,  // 然后设置 leaderId，确保不被覆盖
        teamId: teamId      // 然后设置 teamId，确保不被覆盖
      },
      // 传递 leaderId 和 teamId 给 matchteam_create，让它也能正确处理
      leaderId: leaderId,
      teamId: teamId
    };

    // 合并其他参数（排除已处理的字段）
    Object.keys(params).forEach(key => {
      if (key !== 'leaderId' && key !== 'teamId' && key !== 'custom' && key !== 'setting' && key !== 'teamCfgId' && key !== 'param') {
        finalParams[key] = params[key];
      }
    });

    return this.matchteam_create(ack, seq, finalParams);
  }

  /**
   * 宝库领奖
   */
  bosstower_claimreward(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  idx: params.idx,
        ...params
      }),
      cmd: "bosstower_claimreward",
      seq,
      time: Date.now()
    }
  }

  /**
   * 宝库钥匙
   */
  bosstower_startbox(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
            ...params
      }),
      cmd: "bosstower_startbox",
      seq,
      time: Date.now()
    }
  }

  /**
   * 宝库炸弹
   */
  bosstower_boom(ack = 0, seq = 0, params = {}) {
    return {
      ack,
      body: this.g_utils.bon.encode({
      	  num: 1,
            ...params
      }),
      cmd: "bosstower_boom",
      seq,
      time: Date.now()
    }
  }
}

// 三国答题题库（基于mirror代码中的题目）
export const studyQuestions = [
  { name: "", value: 2 },
  { name: "《三国演义》中，「大意失街亭」的是马谩？", value: 1 },
  { name: "《三国演义》中，「挥泪斩马谩」的是孙权？", value: 2 },
  { name: "《三国演义》中，「火烧博望坡」的是庞统？", value: 2 },
  { name: "《三国演义》中，「火烧藤甲兵」的是徐庶？", value: 2 },
  { name: "《三国演义》中，「千里走单骑」的是赵云？", value: 2 },
  { name: "《三国演义》中，「温酒斩华雄」的是张飞？", value: 2 },
  { name: "《三国演义》中，关羽在长坂坡「七进七出」？", value: 2 },
  { name: "《三国演义》中，刘备三顾茅庐请诸葛亮出山？", value: 1 },
  { name: "《三国演义》中，孙权与曹操「煮酒论英雄」？", value: 2 },
  { name: "《三国演义》中，提出「隆中对」的是诸葛亮？", value: 1 },
  { name: "《三国演义》中，夏侯杰在当阳桥被张飞吓死？", value: 1 },
  { name: "《三国演义》中，张飞在当阳桥厉吼吓退曹军？", value: 1 },
  { name: "《三国演义》中，赵云参与了「三英战吕布」？", value: 2 },
  { name: "《三国演义》中，赵云参与了「桃园三结义」？", value: 2 },
  // 更多题目可以从原始数据中添加...
];

// 创建命令实例
export const gameCommands = new GameCommands();
export default GameCommands;
