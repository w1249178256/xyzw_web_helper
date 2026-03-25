import {
    u as e,
    a as s,
    f as t
}
    from "./CTx_gHj7.js";
import {
    C as l,
    d as a,
    r as n,
    D as o,
    t as i,
    v as r,
    x as d,
    E as c,
    F as m,
    B as u,
    y as p,
    G as g,
    j as v,
    H as f,
    z as b,
    I as y,
    A as x,
    o as h,
    J as w,
    K as _,
    L as j,
    M as k,
    _ as S,
    N as T,
    O as K,
    P as C
}
    from "./DpD38Hq9.js";
import I from "./BANbGyBU.js";
import {
    r as U
}
    from "./Cc81Y5Ws.js";
import {
    g as R,
    a as H,
    s as B
}
    from "./BUzHT0Ek.js";
import {
    u as D
}
    from "./AE7psNvX.js";
import {
    _ as z
}
    from "./C0XUvHtU.js";
import {
    _ as E
}
    from "./BaIp519D.js";
import {
    _ as P
}
    from "./NrJhUoqS.js";
import {
    _ as F
}
    from "./MJhzGfyV.js";
import {
    _ as M
}
    from "./BCo6x5W8.js";
import {
    H as O
}
    from "./C8hpIBoG.js";
import {
    _ as L
}
    from "./CR7-GpTB.js";
import {
    u as N
}
    from "./DnjT7zNg.js";
/* empty css        */
import {
    I as $
}
    from "./Cq52t4ZK.js";
import {
    _ as J,
    a as q
}
    from "./BInuzmN5.js";
import "./CqBTH17V.js";
import "./l2rsThpR.js";
import "./DjN1tzHg.js";
import "./CYSlBwxp.js";
import "./CLmcmnGu.js";
import "./DiJwGkuW.js";
import "./B4ZxnYc8.js";
import "./BOzaSZwJ.js";
import "./Bz3-pLFH.js";
import "./BUIvzWMC.js";
import "./Cap6sGiE.js";
import "./DeVOemtc.js";
import "./D3ikBJ7G.js";
import "./BjAOOWF7.js";
import "./F3BADSHd.js";
const A = l("/icons/173746572831736.png"),
    G = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    V = {
        class: "flex items-start justify-between"
    },
    W = {
        class: "mt-4 flex items-baseline gap-2"
    },
    Z = {
        class: "text-2xl font-bold text-gray-900"
    },
    Q = a({
        __name: "BottleHelperStatus",
        setup(l) {
            const a = e(),
                v = s(),
                f = n(!1),
                b = n(0),
                y = n(),
                x = () = >{
                v.send({
                    cmd: "bottlehelper_stop",
                    respKey: "bottlehelper_stopresp"
                }),
                    v.send({
                        cmd: "bottlehelper_start",
                        respKey: "bottlehelper_startresp"
                    }),
                    v.send({
                        cmd: "role_getroleinfo",
                        respKey: "role_getroleinforesp"
                    })
            }
            return o((() = >{
                var e, s, t, l; (null == (s = null == (e = a.getRoleinfo) ? void 0 : e.role.bottleHelpers) ? void 0 : s.helperStopTime) && (f.value = (null == (l = null == (t = a.getRoleinfo) ? void 0 : t.role.bottleHelpers) ? void 0 : l.helperStopTime) > Date.now() / 1e3, clearInterval(y.value), y.value = g((() = >{
                var e, s;
                b.value = (null == (s = null == (e = a.getRoleinfo) ? void 0 : e.role.bottleHelpers) ? void 0 : s.helperStopTime) - Date.now() / 1e3
            }), 1e3))
        })),
            (e, s) = >(r(), i("div", G, [d("div", V, [s[0] || (s[0] = d("div", {
                    class: "flex items-center gap-3"
                },
                [d("img", {
                    class: "w-8 h-8 object-contain",
                    src: A,
                    alt: "盐罐图标"
                }), d("div", null, [d("h3", {
                        class: "text-base font-semibold text-gray-900"
                    },
                    "盐罐机器人"), d("p", {
                        class: "text-sm text-gray-500"
                    },
                    "剩余时间")])], -1)), d("div", {
                    class: c(["flex items-center gap-2 px-3 py-1 rounded-full text-sm", m(f) ? "bg-blue-100 text-blue-800": "bg-orange-100 text-orange-800"])
                },
                [d("div", {
                        class: c(["w-2 h-2 rounded-full", m(f) ? "bg-blue-500": "bg-orange-500"])
                    },
                    null, 2), u(" " + p(m(f) ? "运行中": "已停止"), 1)], 2)]), d("div", W, [d("div", Z, p(("formatSeconds" in e ? e.formatSeconds: m(t))(m(b)).formatTime), 1)]), d("button", {
                    onClick: x,
                    class: c(["mt-4 w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors", m(f) ? "bg-blue-600 text-white hover:bg-blue-700": "bg-orange-600 text-white hover:bg-orange-700"])
                },
                p(m(f) ? "重启服务": "启动服务"), 3)]))
        }
    }),
    X = l("/icons/174061875626614.png"),
    Y = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    ee = {
        class: "flex items-start justify-between"
    },
    se = {
        class: "flex items-center gap-3"
    },
    te = {
        class: "text-sm text-gray-500"
    },
    le = {
        class: "mt-4 flex flex-col gap-2"
    },
    ae = {
        class: "flex items-center justify-between"
    },
    ne = {
        class: "flex items-center gap-2"
    },
    oe = {
        class: "text-2xl font-bold text-gray-900"
    },
    ie = a({
        __name: "HangUpStatus",
        setup(l) {
            const a = e(),
                o = s(),
                h = n(0),
                w = n(0),
                _ = n(0),
                j = n(),
                k = v((() = >_.value > 0)),
            S = () = >{
                o.send({
                    cmd: "system_mysharecallback",
                    respKey: "syncresp"
                }),
                    o.send({
                        cmd: "system_claimhangupreward",
                        respKey: "system_claimhanguprewardresp"
                    }),
                    o.send({
                        cmd: "system_mysharecallback",
                        respKey: "syncresp",
                        params: {
                            isSkipShareCard: !0,
                            type: 2
                        }
                    }),
                    o.send({
                        cmd: "role_getroleinfo",
                        respKey: "role_getroleinforesp"
                    })
            },
            T = () = >{
                o.send({
                    cmd: "system_mysharecallback",
                    respKey: "syncresp",
                    params: {
                        isSkipShareCard: !0,
                        type: 2
                    }
                }),
                    o.send({
                        cmd: "system_mysharecallback",
                        respKey: "syncresp",
                        params: {
                            isSkipShareCard: !0,
                            type: 2
                        }
                    }),
                    o.send({
                        cmd: "system_mysharecallback",
                        respKey: "syncresp",
                        params: {
                            isSkipShareCard: !0,
                            type: 2
                        }
                    }),
                    o.send({
                        cmd: "system_mysharecallback",
                        respKey: "syncresp",
                        params: {
                            isSkipShareCard: !0,
                            type: 2
                        }
                    })
            }
            return f((() = >{
                var e;
                return null == (e = null == a ? void 0 : a.getRoleinfo) ? void 0 : e.role.hangUp
            }), (e = >{
                if (e) {
                    clearInterval(j.value),
                        w.value = e.lastTime,
                        h.value = e.hangUpTime;
                    const s = (new Date).getTime() / 1e3 - w.value;
                    s <= h.value ? _.value = h.value - s: _.value = 0,
                        j.value = g((() = >{
                            const e = (new Date).getTime() / 1e3 - w.value;
                            e < h.value ? _.value = h.value - e: (_.value = 0, clearInterval(j.value))
                }), 1e3)
                }
            }), {
                !0,
                    deep: !0
            }),
            (e, s) = >{
                const l = y;
                return r(),
                    i("div", Y, [d("div", ee, [d("div", se, [s[1] || (s[1] = d("img", {
                            class: "w-8 h-8 object-contain",
                            src: X,
                            alt: "挂机图标"
                        },
                        null, -1)), d("div", null, [s[0] || (s[0] = d("h3", {
                            class: "text-base font-semibold text-gray-900"
                        },
                        "挂机时间", -1)), d("p", te, " 已挂机：" + p(("formatSeconds" in e ? e.formatSeconds: m(t))(m(h) - m(_)).formatTime), 1)])]), d("div", {
                            class: c(["flex items-center gap-2 px-3 py-1 rounded-full text-sm", m(k) ? "bg-green-100 text-green-800": "bg-gray-100 text-gray-600"])
                        },
                        [d("div", {
                                class: c(["w-2 h-2 rounded-full", m(k) ? "bg-green-500": "bg-gray-500"])
                            },
                            null, 2), u(" " + p(m(k) ? "挂机中": "已完成"), 1)], 2)]), d("div", le, [d("div", ae, [d("div", ne, [d("div", oe, p(("formatSeconds" in e ? e.formatSeconds: m(t))(m(_)).formatTime), 1)]), b(l, {
                            secondary: "",
                            size: "small",
                            type: "success",
                            onClick: T
                        },
                        {
                            default:
                                x((() = >s[2] || (s[2] = [u("加钟")]))),
                        _: 1
            })])]), d("button", {
                        class: "mt-4 w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700",
                        onClick: S
                    },
                    " 领取奖励 ")])
            }
        }
    }),
    re = l("/icons/1733492491706152.png"),
    de = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    ce = {
        class: "flex items-start justify-between"
    },
    me = ["disabled"],
    ue = a({
        __name: "LegionMatchStatus",
        setup(t) {
            const l = e(),
                a = s(),
                n = v((() = >{
                    var e, s;
                    if (! (null == l ? void 0 : l.getRoleinfo)) return ! 1;
            const t = new Date;
            t.setHours(0, 0, 0, 0);
            const a = t.getTime() / 1e3;
            return Number(null == (s = null == (e = l.getRoleinfo) ? void 0 : e.role.statistics) ? void 0 : s["last:legion:match:sign:up:time"]) > a
        })),
            o = () = >{
                a.send({
                    cmd: "legionmatch_rolesignup",
                    respKey: "legionmatch_rolesignupresp"
                })
            }
            return h((() = >{
                a.send({
                    cmd: "legion_getinfo",
                    respKey: "legion_getinforesp"
                })
            })),
            (e, s) = >(r(), i("div", de, [d("div", ce, [s[0] || (s[0] = d("div", {
                    class: "flex items-center gap-3"
                },
                [d("img", {
                    class: "w-8 h-8 object-contain",
                    src: re,
                    alt: "俱乐部图标"
                }), d("div", null, [d("h3", {
                        class: "text-base font-semibold text-gray-900"
                    },
                    "俱乐部排位"), d("p", {
                        class: "text-sm text-gray-500"
                    },
                    "赛事状态")])], -1)), d("div", {
                    class: c(["flex items-center gap-2 px-3 py-1 rounded-full text-sm", m(n) ? "bg-green-100 text-green-800": "bg-amber-100 text-amber-800"])
                },
                [d("div", {
                        class: c(["w-2 h-2 rounded-full", m(n) ? "bg-green-500": "bg-amber-500"])
                    },
                    null, 2), u(" " + p(m(n) ? "已报名": "未报名"), 1)], 2)]), s[1] || (s[1] = d("div", {
                    class: "mt-4 text-sm text-gray-600 leading-relaxed"
                },
                [u(" 每逢周三周四周五有比赛"), d("br"), u("立即报名参与精彩对决！ ")], -1)), d("button", {
                    onClick: o,
                    class: c(["mt-4 w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors", m(n) ? "bg-gray-200 text-gray-500 cursor-not-allowed": "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90"]),
                    disabled: m(n)
                },
                p(m(n) ? "已报名": "立即报名"), 11, me)]))
        }
    }),
    pe = l("/icons/1733492491706148.png"),
    ge = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    ve = {
        class: "flex items-start justify-between"
    },
    fe = {
        class: "mt-4 text-sm"
    },
    be = {
        class: "mt-1 font-medium text-gray-900 truncate"
    },
    ye = {
        key: 1,
        class: "text-gray-500 text-sm"
    },
    xe = ["disabled"],
    he = a({
        __name: "LegionSignStatus",
        setup(t) {
            const l = e(),
                a = s(),
                n = v((() = >l.getLegion)),
            o = v((() = >{
                var e;
                if (! (null == l ? void 0 : l.getRoleinfo)) return ! 1;
            const s = new Date;
            s.setHours(0, 0, 0, 0);
            const t = s.getTime() / 1e3;
            return (null == (e = l.getRoleinfo) ? void 0 : e.role.statisticsTime["legion:sign:in"]) > t
        })) (new Date).getDay();
            const g = () = >{
                a.send({
                    cmd: "legion_signin",
                    respKey: "legion_signinresp"
                }),
                    a.send({
                        cmd: "role_getroleinfo",
                        respKey: "role_getroleinforesp"
                    })
            }
            return h((() = >{
                a.send({
                    cmd: "legion_getinfo",
                    respKey: "legion_getinforesp"
                })
            })),
            (e, s) = >{
                var t;
                return r(),
                    i("div", ge, [d("div", ve, [s[0] || (s[0] = d("div", {
                            class: "flex items-center gap-3"
                        },
                        [d("img", {
                            class: "w-8 h-8 object-contain",
                            src: pe,
                            alt: "签到图标"
                        }), d("div", null, [d("h3", {
                                class: "text-base font-semibold text-gray-900"
                            },
                            "俱乐部签到"), d("p", {
                                class: "text-sm text-gray-500"
                            },
                            "每日签到状态")])], -1)), m(n) ? (r(), i("div", {
                            key: 0,
                            class: c(["flex items-center gap-2 px-3 py-1 rounded-full text-sm", m(o) ? "bg-green-100 text-green-800": "bg-amber-100 text-amber-800"])
                        },
                        [d("div", {
                                class: c(["w-2 h-2 rounded-full", m(o) ? "bg-green-500": "bg-amber-500"])
                            },
                            null, 2), u(" " + p(m(o) ? "已签到": "待签到"), 1)], 2)) : w("", !0)]), d("div", fe, [(null == (t = m(n)) ? void 0 : t.info.name) ? (r(), i(_, {
                            key: 0
                        },
                        [s[1] || (s[1] = d("p", {
                                class: "text-gray-600"
                            },
                            "当前俱乐部", -1)), d("p", be, p(m(n).info.name), 1)], 64)) : (r(), i("div", ye, "尚未加入任何俱乐部"))]), d("button", {
                            class: c(["mt-4 w-full py-2 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors", m(o) ? "bg-gray-300 hover:bg-gray-300": "bg-blue-600"]),
                            onClick: g,
                            disabled: m(o)
                        },
                        p(m(o) ? "已签到": "立即签到"), 11, xe)])
            }
        }
    }),
    we = l("/icons/1736425783912140.png"),
    _e = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    je = ["disabled"],
    ke = {
        key: 0
    },
    Se = {
        key: 1,
        class: "flex items-center justify-center gap-2"
    },
    Te = a({
        __name: "StudyStatus",
        setup(e) {
            const t = n(!1),
                l = s(),
                a = () = >{
                l.send({
                    cmd: "study_startgame",
                    respKey: "studyresp"
                })
            }
            return (e, s) = >(r(), i("div", _e, [s[1] || (s[1] = j('<div class="flex items-start justify-between"><div class="flex items-center gap-4"><img class="w-10 h-10 object-contain" src="' + we + '" alt="学习图标"><div><h3 class="text-lg font-bold text-gray-900">咸鱼大冲关</h3><p class="text-sm text-gray-500">每日知识挑战</p></div></div><div class="flex items-center gap-2 text-sm text-blue-600"><div class="w-2 h-2 rounded-full bg-blue-500"></div> 每周任务 </div></div><div class="mt-4 text-gray-600 leading-relaxed"> 没有什么可以阻挡我求知的欲望！ </div>', 2)), d("button", {
                    onClick: a,
                    disabled: m(t),
                    class: c(["mt-5 w-full py-2 px-4 text-sm rounded-lg transition-all", m(t) ? "bg-blue-400 cursor-wait": "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"])
                },
                [m(t) ? (r(), i("span", Se, s[0] || (s[0] = [d("svg", {
                        class: "w-4 h-4 animate-spin",
                        viewBox: "0 0 24 24"
                    },
                    [d("path", {
                        class: "fill-current text-blue-100",
                        d: "M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
                    })], -1), u(" 答题中... ")]))) : (r(), i("span", ke, "一键答题"))], 10, je)]))
        }
    }),
    Ke = l("/icons/174023274867420.png"),
    Ce = {
        class: "daily-task-card"
    },
    Ie = {
        class: "card-header"
    },
    Ue = {
        class: "header-right"
    },
    Re = {
        class: "progress-container"
    },
    He = {
        class: "modal-header"
    },
    Be = {
        class: "settings-content"
    },
    De = {
        class: "settings-grid"
    },
    ze = {
        class: "setting-item"
    },
    Ee = {
        class: "setting-item"
    },
    Pe = {
        class: "setting-item"
    },
    Fe = {
        class: "setting-item justify-between",
        style: {
            "flex-direction": "row"
        }
    },
    Me = {
        class: "setting-item justify-between",
        style: {
            "flex-direction": "row"
        }
    },
    Oe = {
        class: "setting-item justify-between",
        style: {
            "flex-direction": "row"
        }
    },
    Le = {
        class: "setting-item justify-between",
        style: {
            "flex-direction": "row"
        }
    },
    Ne = {
        class: "setting-item justify-between",
        style: {
            "flex-direction": "row"
        }
    },
    $e = {
        class: "setting-item justify-between",
        style: {
            "flex-direction": "row"
        }
    },
    Je = {
        class: "modal-header"
    },
    qe = {
        class: "task-list"
    },
    Ae = {
        class: "task-item-left"
    },
    Ge = {
        class: "task-name"
    },
    Ve = {
        class: "modal-header"
    },
    We = {
        class: "log-time"
    },
    Ze = M(a({
        __name: "DayliTaskStatus",
        setup(t) {
            const l = s(),
                a = e(),
                m = D(),
                g = n(!1),
                y = n(!1),
                w = n(!1),
                M = n([]),
                O = n(),
                L = k({
                    arenaFormation: 1,
                    bossFormation: 1,
                    bossTimes: 4,
                    claimBottle: !0,
                    payRecruit: !0,
                    openBox: !0,
                    areanEnable: !0,
                    claimHangUp: !0,
                    claimEmail: !0
                }),
                N = [{
                    label: "阵容1",
                    value: 1
                },
                    {
                        label: "阵容2",
                        value: 2
                    },
                    {
                        label: "阵容3",
                        value: 3
                    },
                    {
                        label: "阵容4",
                        value: 4
                    }],
                $ = [{
                    label: "0次",
                    value: 0
                },
                    {
                        label: "1次",
                        value: 1
                    },
                    {
                        label: "2次",
                        value: 2
                    },
                    {
                        label: "3次",
                        value: 3
                    },
                    {
                        label: "4次",
                        value: 4
                    }];
            f(L, (e = >{
                const s = R();
                s && B(s.roleId, e)
        }))
            const J = n([{
                    id: 1,
                    name: "登录一次游戏",
                    loading: !1,
                    completed: !1
                },
                    {
                        id: 2,
                        name: "分享一次游戏",
                        loading: !1,
                        completed: !1
                    },
                    {
                        id: 3,
                        name: "赠送好友3次金币",
                        loading: !1,
                        completed: !1
                    },
                    {
                        id: 4,
                        name: "进行2次招募",
                        loading: !1,
                        completed: !1
                    },
                    {
                        id: 5,
                        name: "领取5次挂机奖励",
                        loading: !1,
                        completed: !1
                    },
                    {
                        id: 6,
                        name: "进行3次点金",
                        loading: !1,
                        completed: !1
                    },
                    {
                        id: 7,
                        name: "开启3次宝箱",
                        loading: !1,
                        completed: !1
                    },
                    {
                        id: 12,
                        name: "黑市购买1次物品（请设置采购清单）",
                        loading: !1,
                        completed: !1
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
                        completed: !1
                    }]),
                q = v((() = >{
                    var e;
                    const s = (null == (e = a.getRoleinfo) ? void 0 : e.role.dailyTask.dailyPoint) || 0;
                    return s > 100 ? 100 : s
                })),
            A = v((() = >{
                var e;
                return ((null == (e = a.getRoleinfo) ? void 0 : e.role.dailyTask.dailyPoint) || 0) > 100
        })),
            G = v((() = >100 === q.value ? "#10b981": "#3b82f6")),
            V = e = >{
                var s; (null == (s = e._raw) ? void 0 : s.error) && W(e._raw.error, "error")
            },
            W = (e, s = "info") = >{
                const t = (new Date).toLocaleTimeString();
                M.value.push({
                    time: t,
                    message: e,
                    type: s
                }),
                    C((() = >{
                        O.value && (O.value.scrollTop = O.value.scrollHeight)
                    }))
            },
            Z = async() = >{
                l.setMessageListener(V),
                    l.setShowMsg(!1),
                    w.value = !0,
                    M.value = [],
                    W("开始执行任务...");
                try {
                    const e = await l.sendWithPromise({
                        cmd: "role_getroleinfo",
                        respKey: "role_getroleinforesp"
                    });
                    W("获取角色信息成功"),
                        await U(e, W),
                        W("任务执行完成", "success"),
                        m.success("任务处理完成")
                } catch(e) {
                    W(`任务执行失败: $ {
					e.message
				}`, "error"),
                        m.error("任务执行失败")
                } finally {
                    l.setShowMsg(!0)
                }
            }
            return o((() = >{
                var e;
                const s = null == (e = a.getRoleinfo) ? void 0 : e.role;
                s && Object.keys(s.dailyTask.complete).forEach((e = >{
                const t = s.dailyTask.complete[e],
                l = J.value.findIndex((s = >s.id === Number(e)));
            l >= 0 && (J.value[l].completed = -1 === t)
        }))
        })),
            h((() = >{
                l.send({
                    cmd: "role_getroleinfo",
                    respKey: "role_getroleinforesp"
                });
                const e = R();
                if (e) {
                    const s = H(e.roleId);
                    s && Object.assign(L, s)
                }
            })),
            (e, s) = >{
                const t = I,
                    l = z,
                    a = E,
                    n = P,
                    o = S,
                    m = F;
                return r(),
                    i("div", Ce, [d("div", Ie, [s[15] || (s[15] = j('<div class="header-left" data-v-f25d94fe><img class="task-icon" src="' + Ke + '" alt="每日任务" data-v-f25d94fe><div class="title-container" data-v-f25d94fe><h3 class="title" data-v-f25d94fe>每日任务</h3><p class="subtitle" data-v-f25d94fe>当前进度</p></div></div>', 1)), d("div", Ue, [d("div", {
                        class: "status-indicator",
                        onClick: s[0] || (s[0] = e = >y.value = !0)
            },
                [d("div", {
                        class: c(["status-dot", {
                            completed: A.value
                        }])
                    },
                    null, 2), s[14] || (s[14] = u(" 任务详情 "))]), d("button", {
                    class: "settings-button",
                    onClick: s[1] || (s[1] = e = >g.value = !0)
            },
                [b(t, {
                    name: "ion:settings-outline",
                    class: "settings-icon"
                })])])]), d("div", Re, [b(l, {
                        type: "line",
                        percentage: q.value,
                        height: 8,
                        "border-radius": 4,
                        color: G.value,
                        "rail-color": "#f3f4f6"
                    },
                    null, 8, ["percentage", "color"])]), s[28] || (s[28] = d("div", {
                        class: "info-container my-2"
                    },
                    "右上角小齿轮有惊喜", -1)), d("button", {
                        class: "complete-button",
                        onClick: Z
                    },
                    "一键补差"), b(o, {
                    show: g.value,
                    "onUpdate:show": s[11] || (s[11] = e = >g.value = e),
                    "mask-closable": !0,
                    preset: "card",
                    class: "settings-modal",
                    style: {
                    "300px"
                },
                "任务设置"
            },
                {
                    x((() = >[d("div", He, [b(t, {
                        name: "ion:settings",
                        class: "modal-icon"
                    }), s[16] || (s[16] = d("span", null, "任务设置", -1))])])),
                default:
                    x((() = >[d("div", Be, [d("div", De, [d("div", ze, [s[17] || (s[17] = d("p", {
                            class: "setting-label"
                        },
                        "竞技场阵容", -1)), b(a, {
                        value: L.arenaFormation,
                        "onUpdate:value": s[2] || (s[2] = e = >L.arenaFormation = e),
                        options: N,
                    size: "small"
                },
                    null, 8, ["value"])]), d("div", Ee, [s[18] || (s[18] = d("p", {
                        class: "setting-label"
                    },
                    "BOSS阵容", -1)), b(a, {
                    value: L.bossFormation,
                    "onUpdate:value": s[3] || (s[3] = e = >L.bossFormation = e),
                    options: N,
                    size: "small"
                },
                    null, 8, ["value"])]), d("div", Pe, [s[19] || (s[19] = d("p", {
                        class: "setting-label"
                    },
                    "BOSS次数", -1)), b(a, {
                    value: L.bossTimes,
                    "onUpdate:value": s[4] || (s[4] = e = >L.bossTimes = e),
                    options: $,
                    size: "small"
                },
                    null, 8, ["value"])]), d("div", Fe, [s[20] || (s[20] = d("p", {
                        class: "setting-label"
                    },
                    "领罐子", -1)), b(n, {
                    value: L.claimBottle,
                    "onUpdate:value": s[5] || (s[5] = e = >L.claimBottle = e)
                },
                    null, 8, ["value"])]), d("div", Me, [s[21] || (s[21] = d("p", {
                        class: "setting-label"
                    },
                    "领挂机", -1)), b(n, {
                    value: L.claimHangUp,
                    "onUpdate:value": s[6] || (s[6] = e = >L.claimHangUp = e)
                },
                    null, 8, ["value"])]), d("div", Oe, [s[22] || (s[22] = d("p", {
                        class: "setting-label"
                    },
                    "竞技场", -1)), b(n, {
                    value: L.areanEnable,
                    "onUpdate:value": s[7] || (s[7] = e = >L.areanEnable = e)
                },
                    null, 8, ["value"])]), d("div", Le, [s[23] || (s[23] = d("p", {
                        class: "setting-label"
                    },
                    "开宝箱", -1)), b(n, {
                    value: L.openBox,
                    "onUpdate:value": s[8] || (s[8] = e = >L.openBox = e)
                },
                    null, 8, ["value"])]), d("div", Ne, [s[24] || (s[24] = d("p", {
                        class: "setting-label"
                    },
                    "领取邮件奖励", -1)), b(n, {
                    value: L.claimEmail,
                    "onUpdate:value": s[9] || (s[9] = e = >L.claimEmail = e)
                },
                    null, 8, ["value"])]), d("div", $e, [s[25] || (s[25] = d("p", {
                        class: "setting-label"
                    },
                    "付费招募", -1)), b(n, {
                    value: L.payRecruit,
                    "onUpdate:value": s[10] || (s[10] = e = >L.payRecruit = e)
                },
                    null, 8, ["value"])])])])])),
                    1
                },
                8, ["show"]), b(o, {
                    show: y.value,
                    "onUpdate:show": s[12] || (s[12] = e = >y.value = e),
                    "mask-closable": !0,
                    preset: "card",
                    class: "task-modal",
                    style: {
                    "300px"
                },
                "每日任务详情"
            },
                {
                    x((() = >[d("div", Je, [b(t, {
                        name: "ion:calendar",
                        class: "modal-icon"
                    }), s[26] || (s[26] = d("span", null, "每日任务详情", -1))])])),
                default:
                    x((() = >[d("div", qe, [(r(!0), i(_, null, T(J.value, ((e, s) = >(r(), i("div", {
                            key: s,
                            class: "task-item"
                        },
                        [d("div", Ae, [b(t, {
                                name: e.completed ? "ion:checkmark-circle": "ion:ellipse-outline",
                                class: c(["task-status-icon", {
                                    completed: e.completed
                                }])
                            },
                            null, 8, ["name", "class"]), d("span", Ge, p(e.name), 1)]), e.loading ? (r(), K(t, {
                            key: 0,
                            name: "ion:load-c",
                            class: "loading-icon"
                        })) : (r(), K(m, {
                                key: 1,
                                type: e.completed ? "success": "default",
                                size: "small"
                            },
                            {
                                default:
                                    x((() = >[u(p(e.completed ? "已完成": "未完成"), 1)])),
                            _: 2
                },
                    1032, ["type"]))])))), 128))])])),
                    1
                },
                8, ["show"]), b(o, {
                    show: w.value,
                    "onUpdate:show": s[13] || (s[13] = e = >w.value = e),
                    "mask-closable": !0,
                    preset: "card",
                    class: "log-modal",
                    title: "任务执行日志"
            },
                {
                    x((() = >[d("div", Ve, [b(t, {
                        name: "ion:document-text",
                        class: "modal-icon"
                    }), s[27] || (s[27] = d("span", null, "任务执行日志", -1))])])),
                default:
                    x((() = >[d("div", {
                            class: "log-container",
                            ref_key: "logContainer",
                            ref: O
                        },
                        [(r(!0), i(_, null, T(M.value, ((e, s) = >(r(), i("div", {
                                key: s,
                                class: "log-item"
                            },
                            [d("span", We, p(e.time), 1), d("span", {
                                    class: c(["log-message", {
                                        error: "error" === e.type,
                                        success: "success" === e.type
                                    }])
                                },
                                p(e.message), 3)])))), 128))], 512)])),
                    1
                },
                8, ["show"])])
            }
        }
    }), [["__scopeId", "data-v-f25d94fe"]]),
    Qe = l("/icons/ta.png"),
    Xe = l("/icons/xiaoyugan.png"),
    Ye = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    es = {
        class: "flex items-start justify-between"
    },
    ss = {
        class: "flex items-center gap-2 px-3 py-1 rounded-full text-amber-600",
        style: {
            "background-color": "#f6d6b5"
        }
    },
    ts = {
        class: "mt-4 space-y-3"
    },
    ls = {
        class: "flex items-center justify-between"
    },
    as = {
        class: "text-md font-bold text-gray-900"
    },
    ns = a({
        __name: "TowerStatus",
        setup(t) {
            const l = s(),
                a = e(),
                o = v((() = >{
                    var e;
                    const s = null == (e = a.getRoleinfo) ? void 0 : e.role.tower.id;
                    return s ? `$ {
				Math.floor(s / 10) + 1
			} - $ {
				s % 10 + 1
			}`: "0 - 0"
                })),
            g = v((() = >{
                var e;
                return (null == (e = a.getRoleinfo) ? void 0 : e.role.tower.energy) || 0
        })),
            f = n(!0),
                b = () = >{
                l.send({
                    cmd: "fight_starttower",
                    respKey: "fight_starttowerresp"
                })
            }
            return h((() = >{
                l.send({
                    cmd: "tower_getinfo",
                    respKey: "tower_getinforesp"
                })
            })),
            (e, s) = >(r(), i("div", Ye, [d("div", es, [s[1] || (s[1] = d("div", {
                    class: "flex items-center gap-3"
                },
                [d("img", {
                    class: "w-8 h-8 object-contain",
                    src: Qe,
                    alt: "爬塔图标"
                }), d("div", null, [d("h3", {
                        class: "text-base font-semibold text-gray-900"
                    },
                    "咸将塔"), d("p", {
                        class: "text-sm text-gray-500"
                    },
                    "一个不小心就过了")])], -1)), d("div", ss, [s[0] || (s[0] = d("img", {
                    class: "w-5 h-5 object-contain",
                    src: Xe,
                    alt: "小鱼干"
                },
                null, -1)), u(" " + p(m(g)), 1)])]), d("div", ts, [d("div", ls, [s[2] || (s[2] = d("span", {
                    class: "text-sm text-gray-600"
                },
                "当前层数", -1)), d("span", as, p(m(o)), 1)])]), d("button", {
                    class: c(["mt-5 w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors", m(f) ? "bg-blue-600 text-white hover:bg-blue-700": "bg-gray-300 text-gray-600 cursor-not-allowed"]),
                    onClick: b
                },
                " 开始爬塔 ", 2)]))
        }
    }),
    os = l("/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"),
    is = {
        class: "group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md min-h-46"
    },
    rs = {
        class: "flex items-start justify-between"
    },
    ds = {
        class: "flex items-center gap-2"
    },
    cs = ["onClick"],
    ms = {
        class: "mt-4"
    },
    us = {
        class: "flex items-center justify-between mb-3"
    },
    ps = {
        class: "text-lg font-bold text-gray-900"
    },
    gs = {
        class: "bg-gray-100 rounded-lg p-3 flex items-center justify-center mh-15"
    },
    vs = {
        class: "text-center"
    },
    fs = a({
        __name: "TeamStatus",
        setup(t) {
            const l = e(),
                a = s(),
                n = v((() = >{
                    var e;
                    return (null == (e = l.getPresetTeam) ? void 0 : e.presetTeamInfo.useTeamId) || 1
        })),
            o = v((() = >{
                var e, s, t, a;
                return (null == (e = l.getPresetTeam) ? void 0 : e.presetTeamInfo) ? null == (a = Object.keys((null == (t = null == (s = l.getPresetTeam) ? void 0 : s.presetTeamInfo) ? void 0 : t.presetTeamInfo) || {})) ? void 0 : a.length: 1
        })),
            g = v((() = >{
                var e, s, t, a;
                const o = null == (a = null == (t = null == (s = null == (e = l.getPresetTeam) ? void 0 : e.presetTeamInfo) ? void 0 : s.presetTeamInfo) ? void 0 : t[n.value]) ? void 0 : a.teamInfo;
                if (!o) return [];
            const i = [];
            for (const l in o) i.push(O[o[l].heroId].name);
            return i || []
        }))
            return (e, s) = >{
                const t = F,
                    l = L;
                return r(),
                    i("div", is, [d("div", rs, [s[0] || (s[0] = d("div", {
                            class: "flex items-center gap-3"
                        },
                        [d("img", {
                            class: "w-8 h-8 object-contain",
                            src: os,
                            alt: "队伍图标"
                        }), d("div", null, [d("h3", {
                                class: "text-base font-semibold text-gray-900"
                            },
                            "队伍阵容"), d("p", {
                                class: "text-sm text-gray-500"
                            },
                            "当前使用的战斗阵容")])], -1)), d("div", ds, [(r(!0), i(_, null, T(m(o), (e = >(r(), i("button", {
                        key: e,
                        onClick: s = >(e = >{
                        a.send({
                            cmd: "presetteam_saveteam",
                            respKey: "presetteam_saveteamresp",
                            params: {
                                teamId: e
                            }
                        })
                    })(e),
                        class: c(["w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", m(n) === e ? "bg-blue-600 text-white": "bg-gray-200 text-gray-700 hover:bg-gray-300"])
            },
                p(e), 11, cs)))), 128))])]), d("div", ms, [d("div", us, [s[1] || (s[1] = d("span", {
                        class: "text-sm text-gray-600"
                    },
                    "当前阵容", -1)), d("span", ps, "阵容 " + p(m(n)), 1)]), d("div", gs, [d("div", vs, [b(l, null, {
                        default:
                            x((() = >[(r(!0), i(_, null, T(m(g), (e = >(r(), K(t, {
                                    key: e,
                                    type: "primary",
                                    bordered: !1
                                },
                                {
                                    default:
                                        x((() = >[u(p(e), 1)])),
                                _: 2
                    },
                    1024)))), 128))])),
                1
            })])])])])
            }
        }
    }),
    bs = a({
        __name: "home",
        setup: e = >(N({
        title: "首页"
    }), (e, s) = >{
        const t = J,
        l = q;
        return r(),
        i("div", null, [b(l, {
                "x-gap": "12",
                "y-gap": "12",
                cols: "1 s:2 m:2 l:2 xl:4",
                responsive: "screen",
                class: "p-4"
            },
            {
                default:
                    x((() = >[b(t, {
                            span: "24"
                        },
                        {
                            default:
                                x((() = >[b($)])),
                        _: 1
    }), b(t, null, {
    default:
        x((() = >[b(fs)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(Ze)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(Q)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(ie)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(ns)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(Te)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(ue)])),
    _: 1
}), b(t, null, {
    default:
        x((() = >[b(he)])),
    _: 1
})])),
1
})])
})
})
export {
    bs as
        default
};
