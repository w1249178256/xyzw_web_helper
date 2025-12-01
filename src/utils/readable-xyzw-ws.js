// 解析后的XYZW WebSocket通信库
// 原文件: CTx_gHj7.js (混淆版本)

// 导入依赖模块
import {a$ as createRef, G as createApp} from "./DpD38Hq9.js";
import {c as useI18n, u as useState} from "./BUzHT0Ek.js";

// 字符串相似度计算函数 (Levenshtein Distance 算法)
const calculateStringSimilarity = (() => {
    let cache, isInitialized;

    return createRef(isInitialized ? cache : (isInitialized = 1, cache = function () {
        // 计算两个字符串之间的编辑距离
        function calculateDistance(a, b, c, d, e) {
            return a < b || c < b ? a > c ? c + 1 : a + 1 : d === e ? b : b + 1;
        }

        return function (str1, str2) {
            if (str1 === str2) return 0;

            // 确保str1是较短的字符串
            if (str1.length > str2.length) {
                [str1, str2] = [str2, str1];
            }

            let len1 = str1.length;
            let len2 = str2.length;

            // 去除相同的前缀和后缀
            while (len1 > 0 && str1.charCodeAt(len1 - 1) === str2.charCodeAt(len2 - 1)) {
                len1--;
                len2--;
            }

            let start = 0;
            while (start < len1 && str1.charCodeAt(start) === str2.charCodeAt(start)) {
                start++;
            }

            len2 -= start;
            len1 -= start;

            if (len1 === 0 || len2 < 3) return len2;

            // 动态规划计算编辑距离
            let row = [];
            for (let i = 0; i < len1; i++) {
                row.push(i + 1, str1.charCodeAt(start + i));
            }

            let currentRow = 0;
            let rowLength = row.length - 1;

            while (currentRow < len2 - 3) {
                let char1 = str2.charCodeAt(start + currentRow);
                let char2 = str2.charCodeAt(start + currentRow + 1);
                let char3 = str2.charCodeAt(start + currentRow + 2);
                let char4 = str2.charCodeAt(start + currentRow + 3);

                let newValue = currentRow += 4;

                for (let j = 0; j < rowLength; j += 2) {
                    let oldValue = row[j];
                    let charCode = row[j + 1];

                    char1 = calculateDistance(oldValue, char1, char2, char1, charCode);
                    char2 = calculateDistance(char1, char2, char3, char2, charCode);
                    char3 = calculateDistance(char2, char3, char4, char3, charCode);
                    newValue = calculateDistance(char3, char4, newValue, char4, charCode);

                    row[j] = newValue;
                    char4 = char3;
                    char3 = char2;
                    char2 = char1;
                    char1 = oldValue;
                }
            }

            // 处理剩余字符
            while (currentRow < len2) {
                let char = str2.charCodeAt(start + currentRow);
                let newValue = ++currentRow;

                for (let j = 0; j < rowLength; j += 2) {
                    let oldValue = row[j];
                    row[j] = newValue = calculateDistance(oldValue, char, newValue, char, row[j + 1]);
                    char = oldValue;
                }
            }

            return newValue;
        };
    }()));
})();

// 生成随机数
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 时间格式化函数
function formatTime(seconds) {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const remainingSeconds = totalSeconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const secs = Math.floor(remainingSeconds % 60);

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = (secs < 10 ? "0" : "") + secs.toString();

    let formatTime = "00:00:00";
    if (seconds > 0) {
        formatTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    return {
        hours: formattedHours,
        minutes: formattedMinutes,
        seconds: formattedSeconds,
        formatTime: formatTime
    };
}

// 字符串相似度检查
function checkStringSimilarity(str1, str2, threshold) {
    if (!str1 || !str2) return false;
    return 1 - calculateStringSimilarity(str1, str2) / Math.max(str1.length, str2.length) >= threshold;
}

// 数值格式化函数 (支持万、亿单位)
function formatNumber(num, decimals = 2) {
    if (num === undefined || isNaN(num) || num <= 0) return "0";

    const billion = 100000000; // 1亿
    const tenThousand = 10000; // 1万

    const formatDecimal = (value) => {
        const str = value.toString();
        const [integer, decimal = ""] = str.split(".");
        return decimal.length >= decimals
            ? `${integer}.${decimal.slice(0, decimals)}`
            : `${integer}.${"0".repeat(decimals - decimal.length)}${decimal}`;
    };

    if (num >= billion) {
        return `${formatDecimal(num / billion)}亿`;
    } else if (num >= tenThousand) {
        return `${formatDecimal(num / tenThousand)}万`;
    } else if (num < 1) {
        return `0.${"0".repeat(decimals)}${num.toFixed(decimals + 1).slice(-decimals)}`;
    } else {
        return num.toString();
    }
}

// 延迟函数
function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// 游戏消息模板定义
const gameMessageTemplates = {
    // 心跳包
    heart_beat: (client, ack, seq, params) => ({
        ack: ack,
        body: undefined,
        c: undefined,
        cmd: "_sys/ack",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 获取角色信息
    role_getroleinfo: (client, ack, seq, params) => ({
        cmd: "role_getroleinfo",
        body: client.bon.encode({
            clientVersion: "2.1.5-wx",
            inviteUid: 0,
            platform: "hortor",
            platformExt: "mix",
            scene: "",
            ...params
        }),
        ack: ack || 0,
        seq: seq || 0,
        rtt: generateRandomNumber(0, 500),
        code: 0,
        time: Date.now()
    }),

    // 获取数据包版本
    system_getdatabundlever: (client, ack, seq, params) => ({
        cmd: "system_getdatabundlever",
        body: client.bon.encode({
            isAudit: false,
            ...params
        }),
        ack: ack || 0,
        seq: seq || 0,
        rtt: generateRandomNumber(0, 500),
        code: 0,
        time: Date.now()
    }),

    // 购买金币
    system_buygold: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            buyNum: 1,
            ...params
        }),
        c: undefined,
        cmd: "system_buygold",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 分享回调
    system_mysharecallback: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            type: 3,
            isSkipShareCard: true,
            ...params
        }),
        c: undefined,
        cmd: "system_mysharecallback",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 好友批处理
    friend_batch: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            friendId: 0,
            ...params
        }),
        c: undefined,
        cmd: "friend_batch",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 英雄招募
    hero_recruit: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            byClub: false,
            recruitNumber: 1,
            recruitType: 3,
            ...params
        }),
        c: undefined,
        cmd: "hero_recruit",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 领取挂机奖励
    system_claimhangupreward: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            ...params
        }),
        c: undefined,
        cmd: "system_claimhangupreward",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 开启宝箱
    item_openbox: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            itemId: 2001,
            number: 10,
            ...params
        }),
        c: undefined,
        cmd: "item_openbox",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    // 竞技场相关命令
    arena_startarea: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({...params}),
        c: undefined,
        cmd: "arena_startarea",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    arena_getareatarget: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            refresh: false,
            ...params
        }),
        c: undefined,
        cmd: "arena_getareatarget",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    fight_startareaarena: (client, ack, seq, params) => {
        if (params?.targetId === undefined || params?.targetId === null) {
            throw new Error("fight_startareaarena requires targetId in params")
        }
        return {
            ack: ack,
            body: client.bon.encode({
                battleVersion: 240475,
                ...params
            }),
            c: undefined,
            cmd: "fight_startareaarena",
            hint: undefined,
            seq: seq,
            time: Date.now()
        }
    },

    // 商店相关
    store_goodslist: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            storeId: 1,
            ...params
        }),
        c: undefined,
        cmd: "store_goodslist",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    store_buy: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({
            goodsId: 1,
            ...params
        }),
        c: undefined,
        cmd: "store_buy",
        hint: undefined,
        seq: seq,
        time: Date.now()
    }),

    store_refresh: (client, ack, seq, params) => ({
        ack: ack,
        body: client.bon.encode({...params}),
        c: undefined,
        cmd: "store_refresh",
        hint: undefined,
        seq: seq,
        time: Date.now()
    })
};

// 游戏逻辑处理函数 (从原始混淆代码中提取的核心逻辑)
function processGameLogic(client) {
    const app = createApp();
    const state = useState();
    const { message } = useI18n(["message", "dialog"]);

    // 处理问答逻辑
    const handleQuestionsLogic = (responseData) => {
        const questionList = responseData.body.questionList;
        let hasMatch = false;
        const config = useState();

        // 遍历问题列表寻找匹配
        for (let i = 0; i < questionList.length; i++) {
            const question = questionList[i];
            //todo
            // 这里应该有问题匹配逻辑，但在原代码中被混淆了
            // 原始逻辑涉及某个答案数组 v，可能需要根据实际需求补充
        }

        return hasMatch;
    };

    return {
        handleQuestionsLogic,
        // 其他游戏逻辑函数可以在这里添加
    };
}

// Base64 编解码工具 (从原始代码第1部分提取)
const base64Utils = {
    // 字节长度计算
    byteLength: function (str) {
        const parsed = this.parseBase64(str);
        const validLength = parsed[0];
        const paddingLength = parsed[1];
        return validLength;
    },

    // 转换为字节数组
    toByteArray: function (str) {
        const parsed = this.parseBase64(str);
        const validLength = parsed[0];
        const paddingLength = parsed[1];
        const result = new Uint8Array(this.calculateLength(validLength, paddingLength, str.length));

        // 解码逻辑
        // ... 这里应该包含完整的Base64解码实现

        return result;
    },

    // 从字节数组转换
    fromByteArray: function (uint8Array) {
        const length = uint8Array.length;
        const remainder = length % 3;
        const chunks = [];
        const maxChunkLength = 16383;

        // 处理主要部分
        for (let i = 0; i < length - remainder; i += maxChunkLength) {
            const end = i + maxChunkLength > length - remainder ? length - remainder : i + maxChunkLength;
            chunks.push(this.encodeChunk(uint8Array, i, end));
        }

        // 处理剩余字节
        if (remainder === 1) {
            const byte = uint8Array[length - 1];
            chunks.push(this.chars[byte >> 2] + this.chars[byte << 4 & 63] + '==');
        } else if (remainder === 2) {
            const byte1 = uint8Array[length - 2];
            const byte2 = uint8Array[length - 1];
            chunks.push(
                this.chars[byte1 >> 2] +
                this.chars[byte1 << 4 & 63 | byte2 >> 4] +
                this.chars[byte2 << 2 & 63] +
                '='
            );
        }

        return chunks.join('');
    },

    // Base64字符表
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

    // 辅助函数
    parseBase64: function (str) {
        const length = str.length;
        let paddingIndex = str.indexOf('=');
        if (paddingIndex === -1) paddingIndex = length;

        const validLength = paddingIndex;
        const paddingLength = paddingIndex === length ? 0 : 4 - (paddingIndex % 4);

        return [validLength, paddingLength];
    },

    calculateLength: function (validLength, paddingLength, totalLength) {
        return Math.floor((validLength + paddingLength) * 3 / 4);
    },

    encodeChunk: function (uint8Array, start, end) {
        const chars = this.chars;
        const result = [];

        for (let i = start; i < end; i += 3) {
            const byte1 = uint8Array[i];
            const byte2 = i + 1 < end ? uint8Array[i + 1] : 0;
            const byte3 = i + 2 < end ? uint8Array[i + 2] : 0;

            const triplet = (byte1 << 16) + (byte2 << 8) + byte3;

            result.push(
                chars[triplet >> 18 & 63] +
                chars[triplet >> 12 & 63] +
                chars[triplet >> 6 & 63] +
                chars[triplet & 63]
            );
        }

        return result.join('');
    }
};

// 数据存储管理 (从文件末尾部分提取)
const createDataStore = () => {
    return {
        // 响应数据存储
        resp: {},

        // 更新军团信息
        updateLegioninfo: function(newData) {
            const currentLegionData = this.resp.legion_getinforesp;

            if (currentLegionData && currentLegionData.data) {
                this.resp.legion_getinforesp = {
                    loading: false,
                    data: Object.assign({}, currentLegionData.data, newData),
                    cmd: "legion_getinfor"
                };
            } else {
                this.resp.legion_getinforesp = {
                    loading: false,
                    data: newData,
                    cmd: "legion_getinfor"
                };
            }
        }
    };
};

// 导出的主要功能模块
export {
    useState as createGameState,           // b -> a
    formatNumber as formatGameNumber,      // h -> b
    gameMessageTemplates as gameCommands,  // m -> c
    processGameLogic as gameLogicHandler,  // y -> d
    createDataStore as dataStoreFactory,   // C -> e
    formatTime,                           // f
    base64Utils as encodingUtils,         // E -> g
    createDataStore as storeManager,      // S -> h
    delay as sleep,                       // g -> s
    createApp as appFactory               // A -> u
};
