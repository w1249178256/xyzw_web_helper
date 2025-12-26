
//英雄字典
const HERO_DICT = {
    101: { name: "司马懿", type: "魏国", avatar: "/team/simayi.png" },
    102: { name: "郭嘉", type: "魏国", avatar: "/team/guojia.png" },
    103: { name: "关羽", type: "蜀国", avatar: "/team/guanyu.png" },
    104: { name: "诸葛亮", type: "蜀国", avatar: "/team/zhugeliang.png" },
    105: { name: "周瑜", type: "吴国", avatar: "/team/zhouyu.png" },
    106: { name: "太史慈", type: "吴国", avatar: "/team/taishici.png" },
    107: { name: "吕布", type: "群雄", avatar: "/team/lvbu.png" },
    108: { name: "华佗", type: "群雄", avatar: "/team/huatuo.png" },
    109: { name: "甄姬", type: "魏国", avatar: "/team/zhenji.png" },
    110: { name: "黄月英", type: "蜀国", avatar: "/team/huangyueying.png" },
    111: { name: "孙策", type: "吴国", avatar: "/team/sunce.png" },
    112: { name: "贾诩", type: "群雄", avatar: "/team/jiaxu.png" },
    113: { name: "曹仁", type: "魏国", avatar: "/team/caoren.png" },
    114: { name: "姜维", type: "蜀国", avatar: "/team/jiangwei.png" },
    115: { name: "孙坚", type: "吴国", avatar: "/team/sunjian.png" },
    116: { name: "公孙瓒", type: "群雄", avatar: "/team/gongsunzan.png" },
    117: { name: "典韦", type: "魏国", avatar: "/team/dianwei.png" },
    118: { name: "赵云", type: "蜀国", avatar: "/team/zhaoyun.png" },
    119: { name: "大乔", type: "吴国", avatar: "/team/daqiao.png" },
    120: { name: "张角", type: "群雄", avatar: "/team/zhangjiao.png" },
    201: { name: "徐晃", type: "魏国", avatar: "/team/xuhuang.png" },
    202: { name: "荀彧", type: "魏国", avatar: "/team/xunyu.png" },
    203: { name: "典韦", type: "魏国", avatar: "/team/xiaodianwei.png" },
    204: { name: "张飞", type: "蜀国", avatar: "/team/zhangfei.png" },
    205: { name: "赵云", type: "蜀国", avatar: "/team/xiaozhaoyun.png" },
    206: { name: "庞统", type: "蜀国", avatar: "/team/pangtong.png" },
    207: { name: "鲁肃", type: "吴国", avatar: "/team/lusu.png" },
    208: { name: "陆逊", type: "吴国", avatar: "/team/luxun.png" },
    209: { name: "甘宁", type: "吴国", avatar: "/team/ganning.png" },
    210: { name: "貂蝉", type: "群雄", avatar: "/team/diaochan.png" },
    211: { name: "董卓", type: "群雄", avatar: "/team/dongzhuo.png" },
    212: { name: "张角", type: "群雄", avatar: "/team/xiaozhangjiao.png" },
    213: { name: "张辽", type: "魏国", avatar: "/team/zhangliao.png" },
    214: { name: "夏侯惇", type: "魏国", avatar: "/team/xiahoudun.png" },
    215: { name: "许褚", type: "魏国", avatar: "/team/xuzhu.png" },
    216: { name: "夏侯渊", type: "魏国", avatar: "/team/xiahouyuan.png" },
    217: { name: "魏延", type: "蜀国", avatar: "/team/weiyan.png" },
    218: { name: "黄忠", type: "蜀国", avatar: "/team/huangzhong.png" },
    219: { name: "马超", type: "蜀国", avatar: "/team/machao.png" },
    220: { name: "马岱", type: "蜀国", avatar: "/team/madai.png" },
    221: { name: "吕蒙", type: "吴国", avatar: "/team/lvmeng.png" },
    222: { name: "黄盖", type: "吴国", avatar: "/team/huanggai.png" },
    223: { name: "蔡文姬", type: "魏国", avatar: "/team/caiwenji.png" },
    224: { name: "小乔", type: "吴国", avatar: "/team/xiaoqiao.png" },
    225: { name: "袁绍", type: "群雄", avatar: "/team/yuanshao.png" },
    226: { name: "华雄", type: "群雄", avatar: "/team/huaxiong.png" },
    227: { name: "颜良", type: "群雄", avatar: "/team/yanliang.png" },
    228: { name: "文丑", type: "群雄", avatar: "/team/wenchou.png" },
    301: { name: "周泰", type: "吴国", avatar: "/team/zhoutai.png" },
    302: { name: "许攸", type: "魏国", avatar: "/team/xuyou.png" },
    303: { name: "于禁", type: "魏国", avatar: "/team/yujin.png" },
    304: { name: "张星彩", type: "蜀国", avatar: "/team/zhangxingcai.png" },
    305: { name: "关银屏", type: "蜀国", avatar: "/team/guanyinping.png" },
    306: { name: "关平", type: "蜀国", avatar: "/team/guanping.png" },
    307: { name: "程普", type: "吴国", avatar: "/team/chengpu.png" },
    308: { name: "张昭", type: "吴国", avatar: "/team/zhangzhao.png" },
    309: { name: "陆绩", type: "吴国", avatar: "/team/luji.png" },
    310: { name: "吕玲绮", type: "群雄", avatar: "/team/lvlingqi.png" },
    311: { name: "潘凤", type: "群雄", avatar: "/team/panfeng.png" },
    312: { name: "邢道荣", type: "群雄", avatar: "/team/xingdaorong.png" },
    313: { name: "祝融夫人", type: "群雄", avatar: "/team/zhurongfuren.png" },
    314: { name: "孟获", type: "群雄", avatar: "/team/menghuo.png" },
};

//鱼珠字典
const PearlMap = {
    1033007:{name:"碎盾"},
    1033008:{name:"冥想"},
    1033009:{name:"定心"},
    1033010:{name:"冰清"},
    1033011:{name:"攻心"},
    1033012:{name:"强权"},
    1033013:{name:"盾击"},
    1033014:{name:"合力"},
    1033015:{name:"仁心"},
    1033016:{name:"游龙"},
    1033017:{name:"回元"}
}

const FishMap = {
    1201:{name:"龙鱼·幽影"},
    1202:{name:"龙鱼·青龙"},
    1203:{name:"龙鱼·火镰"},
    1204:{name:"龙鱼·无双"},
    1205:{name:"龙鱼·永霜"},
    1206:{name:"龙鱼·八卦"},
    1207:{name:"龙鱼·紫电"},
    1208:{name:"龙鱼·青囊"},
    1209:{name:"龙鱼·洛神"},
    1210:{name:"龙鱼·机神"},
    1211:{name:"龙鱼·麒麟"},
    1212:{name:"龙鱼·蚀骨"},
    1213:{name:"龙鱼·坚盾"},
    1214:{name:"龙鱼·古锭"},
    1215:{name:"龙鱼·义从"},
    1216:{name:"龙鱼·恶来"},
    1217:{name:"龙鱼·龙胆"},
    1218:{name:"龙鱼·国色"},
    1219:{name:"龙鱼·天公"},

    1301:{name:"月尾"},
    1302:{name:"焰神"},
    1303:{name:"红蝶"},
    1304:{name:"赤羽"},
    1305:{name:"千年笛"},

    1401:{name:"四带胡椒"},
    1402:{name:"鬼狮子鱼"},
    1403:{name:"黑斑雀鲷"},
    1404:{name:"诅咒花椒"},
    1405:{name:"九斑刺豚"},
    1406:{name:"魔鬼刺镰"},
    1407:{name:"黄背刺鲷"},
    1408:{name:"黑鳍刺鲷"},
    1409:{name:"长棘刺鲷"},
    1410:{name:"粒突箱鲀"},
    1411:{name:"大跳跳鱼"},
    1412:{name:"蓝心胖头"},

    1501:{name:"钱胡椒"},
    1502:{name:"狮子鱼"},
    1503:{name:"塔雀鲷"},
    1504:{name:"紫斑鳅"},
    1505:{name:"密刺豚"},
    1506:{name:"长鳍镰"},

    1601:{name:"胖头鱼"},
    1602:{name:"青刺鲷"},
    1603:{name:"跳跳鱼"},
    1604:{name:"箱豚鱼"},

    1101:{name:"黄金锦鲤"},
    1102:{name:"利刃"},
    1103:{name:"惊涛"},
    1104:{name:"骇浪"},
    1105:{name:"星驰"},
    1106:{name:"公同心"},
    1107:{name:"母同心"},
    1108:{name:"公协力"},
    1109:{name:"母协力"},
    1110:{name:"月光"},
    1111:{name:"公铁血"},
    1112:{name:"母铁血"},
    1113:{name:"公丹心"},
    1114:{name:"母丹心"},
    1115:{name:"巨灵"},
    1116:{name:"公剑胆"},
    1117:{name:"母剑胆"},
    1118:{name:"璇玑"}
}

//洗练颜色
const color = {
    1:{color:"白色",value:"white"},
    2:{color:"绿色",value:"green"},
    3:{color:"蓝色",value:"blue"},
    4:{color:"紫色",value:"purple"},
    5:{color:"橙色",value:"orange"},
    6:{color:"红色",value:"red"}
}

/**
 * 提取传入对象中的鱼和鱼珠信息
 * @param {*} obj 
 * @returns 
 */
export const HeroFillInfo = (obj)=>{
    let temp = {}
    Object.values(obj.heroes).forEach(hero => {
        temp[hero.artifactId] = {
            FishInfo:FishMap[(hero.artifactId+"").substring(0,4)],
            artifactId:hero.artifactId
        }
        //获取鱼珠技能信息
        hero.appendSkill.forEach(item=>{
            if(PearlMap[item.skillId]){
               temp[hero.artifactId].PearlSkill = PearlMap[item.skillId]
            }
        })
    });
    Object.values(obj?.pearlMap).forEach(item=>{
        if(temp[item.artifactId]){
            temp[item.artifactId].slotMap = Object.values(item.slotMap).map(slot=>{
                return Object.assign({}, slot, color[slot.colorId]);
            });
        }
    })
    return temp;
}