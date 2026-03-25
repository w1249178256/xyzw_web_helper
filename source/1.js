import {
    a as s
}
    from "./BUzHT0Ek.js";
import {
    i as e
}
    from "./CqBTH17V.js";
import {
    a as r
}
    from "./CTx_gHj7.js";
const a = async(a, c, t) = >{
    const d = r(),
        p = s(a.role.roleId);
    null == c || c("检查每日任务完成情况");
    const n = (s = >{
        const e = [{
            id: 1,
            name: "登录一次游戏",
            loading: !1,
            completed: !1,
            cmds: []
        },
            {
                id: 2,
                name: "分享一次游戏",
                loading: !1,
                completed: !1,
                cmds: ["system_mysharecallback"]
            },
            {
                id: 3,
                name: "赠送好友3次金币",
                loading: !1,
                completed: !1,
                cmds: ["friend_batch"]
            },
            {
                id: 4,
                name: "进行2次招募",
                loading: !1,
                completed: !1,
                cmds: ["hero_recruit"]
            },
            {
                id: 5,
                name: "领取5次挂机奖励",
                loading: !1,
                completed: !1,
                cmds: ["system_claimhangupreward"]
            },
            {
                id: 6,
                name: "进行3次点金",
                loading: !1,
                completed: !1,
                cmds: ["system_buygold"]
            },
            {
                id: 7,
                name: "开启3次宝箱",
                loading: !1,
                completed: !1,
                cmds: ["item_openbox"]
            },
            {
                id: 12,
                name: "黑市购买1次物品（请设置采购清单）",
                loading: !1,
                completed: !1,
                cmds: ["store_purchase"]
            },
            {
                id: 13,
                name: "进行1场竞技场战斗",
                loading: !1,
                completed: !1
            },
            {
                id: 14,
                name: "收获1个任意盐罐",
                loading: !1,
                completed: !1,
                cmds: ["bottlehelper_stop", "bottlehelper_start", "bottlehelper_claim"]
            }];
        return Object.keys(s).forEach((r = >{
            const a = s[r],
            c = e.findIndex((s = >s.id === Number(r)));
        c >= 0 && (e[c].completed = -1 === a)
})),
    e
})(a.role.dailyTask.complete).filter((s = >(s.completed && (null == c || c(`$ {
		s.name
	}完成`, "success")), s.completed))),
    m = [];
    n.forEach((s = >{ (null == s ? void 0 : s.cmds) && m.push(...s.cmds)
}))
    const i = (r = >{
        var a, c, t, d;
        const p = [9904, 9905, 9901, 9902, 9903, 9904, 9905],
        n = (new Date).getDay(),
        m = s(r.role.roleId),
        i = [];
        i.push({
            cmd: "presetteam_getinfo",
            respKey: "presetteam_getinforesp",
            sendMsg: "准备切换阵容",
            successMsg: ""
        }),
        i.push({
            cmd: "presetteam_saveteam",
            respKey: "presetteam_saveteamresp",
            params: {
                teamId: m.bossFormation
            },
            sendMsg: "切换攻打BOSS阵容中",
            successMsg: "成功切换阵容" + m.bossFormation
        });
        const l = Number(r.role.statistics["legion:boss"]),
        o = e(null == (a = r.role.statisticsTime) ? void 0 : a["legion:boss"]) ? m.bossTimes: m.bossTimes - l;
        if (o) for (let s = 0; s < o; s++) i.push({
        cmd: "fight_startlegionboss",
        respKey: "fight_startlegionbossresp",
        sendMsg: "攻打每日俱乐部BOSS",
        successMsg: "攻打每日俱乐部BOSS成功"
    });
    e(null == (c = r.role.statistics) ? void 0 : c["artifact:normal:lottery:time"]) && (i.push({
        cmd: "artifact_lottery",
        respKey: "syncrewardresp",
        sendMsg: "每日免费钓鱼",
        successMsg: "每日免费钓鱼成功"
    }), i.push({
        cmd: "artifact_lottery",
        respKey: "syncrewardresp",
        sendMsg: "每日免费钓鱼",
        successMsg: "每日免费钓鱼成功"
    }), i.push({
        cmd: "artifact_lottery",
        respKey: "syncrewardresp",
        sendMsg: "每日免费钓鱼",
        successMsg: "每日免费钓鱼成功"
    }));
    const g = ["魏国", "蜀国", "吴国", "群雄"];
    for (let s = 1; s <= 4; s++) e(null == (t = r.role.statisticsTime) ? void 0 : t[`genie: daily: free: $ {
			s
		}`]) && i.push({
        cmd: "genie_sweep",
        params: {
            genieId: s
        },
        respKey: "syncrewardresp",
        sendMsg: `领取$ {
				g[s - 1]
			}免费灯神扫荡`,
        successMsg: `领取$ {
				g[s - 1]
			}免费灯神扫荡成功`
    });
    m.claimBottle && i.push({
        cmd: "bottlehelper_claim",
        respKey: "syncrewardresp",
        sendMsg: "领取盐罐奖励",
        successMsg: "领取盐罐奖励成功"
    }),
    m.payRecruit && i.push({
        cmd: "hero_recruit",
        respKey: "hero_recruitresp",
        params: {
            recruitType: 1
        },
        sendMsg: "招募付费1次",
        successMsg: "招募1次成功"
    }),
    m.openBox && i.push({
        cmd: "item_openbox",
        respKey: "item_openboxresp",
        params: {
            itemId: 2001,
            number: 10
        },
        sendMsg: "开启木质宝箱10个",
        successMsg: "开启木质宝箱10个成功"
    }),
    e(null == (d = r.role.statisticsTime) ? void 0 : d["buy:gold"]) && (i.push({
        cmd: "system_buygold",
        respKey: "syncrewardresp",
        sendMsg: "免费点金",
        successMsg: "免费点金成功"
    }), i.push({
        cmd: "system_buygold",
        respKey: "syncrewardresp",
        sendMsg: "免费点金",
        successMsg: "免费点金成功"
    }), i.push({
        cmd: "system_buygold",
        respKey: "syncrewardresp",
        sendMsg: "免费点金",
        successMsg: "免费点金成功"
    })),
    m.claimHangUp && (i.push({
        cmd: "system_mysharecallback",
        respKey: "syncresp",
        params: {
            isSkipShareCard: !0,
            type: 2
        },
        sendMsg: "挂机加钟",
        successMsg: "加钟成功"
    }), i.push({
        cmd: "system_mysharecallback",
        respKey: "syncresp",
        params: {
            isSkipShareCard: !0,
            type: 2
        },
        sendMsg: "挂机加钟",
        successMsg: "加钟成功"
    }), i.push({
        cmd: "system_mysharecallback",
        respKey: "syncresp",
        params: {
            isSkipShareCard: !0,
            type: 2
        },
        sendMsg: "挂机加钟",
        successMsg: "加钟成功"
    }), i.push({
        cmd: "system_mysharecallback",
        respKey: "syncresp",
        params: {
            isSkipShareCard: !0,
            type: 2
        },
        sendMsg: "挂机加钟",
        successMsg: "加钟成功"
    }), i.push({
        cmd: "system_claimhangupreward",
        respKey: "system_claimhanguprewardresp",
        sendMsg: "领取挂机奖励",
        successMsg: "领取挂机奖励成功"
    }), i.push({
        cmd: "system_mysharecallback",
        respKey: "syncresp",
        params: {
            isSkipShareCard: !0,
            type: 2
        },
        sendMsg: "挂机加钟",
        successMsg: "加钟成功"
    })),
    m.claimEmail && i.push({
        cmd: "mail_claimallattachment",
        respKey: "mail_claimallattachmentresp",
        sendMsg: "领取邮件奖励",
        successMsg: "邮件奖励领取成功"
    });
    const y = [{
        cmd: "fight_startboss",
        respKey: "fight_startbossresp",
        params: {
            bossId: p[n]
        },
        sendMsg: "攻打每日BOSS",
        successMsg: "攻打每日BOSS成功"
    },
        {
            cmd: "fight_startboss",
            respKey: "fight_startbossresp",
            params: {
                bossId: p[n]
            },
            sendMsg: "攻打每日BOSS",
            successMsg: "攻打每日BOSS成功"
        },
        {
            cmd: "fight_startboss",
            respKey: "fight_startbossresp",
            params: {
                bossId: p[n]
            },
            sendMsg: "攻打每日BOSS",
            successMsg: "攻打每日BOSS成功"
        },
        {
            cmd: "genie_buysweep",
            respKey: "syncrewardresp",
            sendMsg: "领取每日免费扫荡卷",
            successMsg: "领取每日免费扫荡卷成功"
        },
        {
            cmd: "genie_buysweep",
            respKey: "syncrewardresp",
            sendMsg: "领取每日免费扫荡卷",
            successMsg: "领取每日免费扫荡卷成功"
        },
        {
            cmd: "genie_buysweep",
            respKey: "syncrewardresp",
            sendMsg: "领取每日免费扫荡卷",
            successMsg: "领取每日免费扫荡卷成功"
        },
        {
            cmd: "system_signinreward",
            respKey: "syncrewardresp",
            sendMsg: "福利签到",
            successMsg: "同步奖励"
        },
        {
            cmd: "discount_claimreward",
            respKey: "syncrewardresp",
            sendMsg: "领取每日礼包",
            successMsg: "同步奖励"
        },
        {
            cmd: "legion_signin",
            respKey: "legion_signinresp",
            sendMsg: "俱乐部签到",
            successMsg: "同步奖励"
        },
        {
            cmd: "card_claimreward",
            respKey: "syncrewardresp",
            sendMsg: "领取每日免费礼包",
            successMsg: "同步奖励"
        },
        {
            cmd: "card_claimreward",
            respKey: "syncrewardresp",
            params: {
                cardId: 4003
            },
            sendMsg: "领取永久卡礼包",
            successMsg: "同步奖励"
        },
        {
            cmd: "system_mysharecallback",
            respKey: "syncresp",
            sendMsg: "分享一次游戏",
            successMsg: "分享一次游戏成功"
        },
        {
            cmd: "friend_batch",
            respKey: "friend_batchresp",
            sendMsg: "赠送好友金币",
            successMsg: "赠送好友金币成功"
        },
        {
            cmd: "hero_recruit",
            respKey: "hero_recruitresp",
            sendMsg: "免费招募1次",
            successMsg: "招募1次成功"
        },
        {
            cmd: "store_purchase",
            respKey: "store_buyresp",
            sendMsg: "黑市清单采购",
            successMsg: "黑市清单采购成功"
        },
        {
            cmd: "bottlehelper_stop",
            respKey: "bottlehelper_stopresp",
            sendMsg: "停止盐罐机器人",
            successMsg: "停止盐罐机器人成功"
        },
        {
            cmd: "bottlehelper_start",
            respKey: "bottlehelper_startresp",
            sendMsg: "启动盐罐机器人",
            successMsg: "启动盐罐机器人成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 1
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 2
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 3
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 4
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 5
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 6
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 7
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 8
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 9
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailypoint",
            params: {
                taskId: 10
            },
            respKey: "syncresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimdailyreward",
            respKey: "syncrewardresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        },
        {
            cmd: "task_claimweekreward",
            respKey: "syncrewardresp",
            sendMsg: "领取任务奖励",
            successMsg: "领取任务奖励成功"
        }];
    return [...i, ...y]
})(a),
        l = i.filter((s = >!m.includes(s.cmd)))
    if (null == c || c("开始执行任务"), p.areanEnable || null == c || c("跳过竞技场战斗"), p.areanEnable && -1 !== a.role.dailyTask.complete[13]) {
        null == c || c("竞技场自动战斗"),
            await d.sendWithPromise({
                cmd: "presetteam_getinfo",
                respKey: "presetteam_getinforesp"
            }).then((async s = >{
            s.presetTeamInfo.useTeamId === p.arenaFormation ? null == c || c("当前阵容为阵容" + p.arenaFormation) : await d.sendWithPromise({
                cmd: "presetteam_saveteam",
                respKey: "presetteam_saveteamresp",
                params: {
                    teamId: p.arenaFormation
                }
            }).then((() = >{
                null == c || c("切换竞技场阵容为阵容" + p.arenaFormation)
        }))
        })),
        await d.sendWithPromise({
            cmd: "arena_startarea",
            respKey: "arena_startarearesp"
        });
        for (let s = 0; s < 3; s++) await d.sendWithPromise({
            cmd: "arena_getareatarget",
            respKey: "arena_getareatargetresp"
        }).then((async s = >{
            s && await d.sendWithPromise({
                cmd: "fight_startareaarena",
                respKey: "fight_startareaarenaresp",
                params: {
                    targetId: s.roleList[0].roleId
                }
            })
        }))
    } else null == c || c("今日竞技场任务已完成", "success");
    let o = 0;
    const g = Math.floor(100 / l.length);
    for (const s of l)(null == s ? void 0 : s.sendMsg) && (null == c || c(s.sendMsg)),
        await d.sendWithPromise({
            cmd: s.cmd,
            respKey: s.respKey,
            params: null == s ? void 0 : s.params
        }).then((e = >{
            e && (null == s ? void 0 : s.successMsg) && (null == c || c(s.successMsg, "success"))
})).
    catch((() = >null == c ? void 0 : c("任务执行失败", "error"))).
    finally((() = >{
        o += g,
        t && t(a.role.roleId, o)
}))
}
export {
    a as r
};
