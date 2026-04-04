// ==UserScript==
// @name         洗练助手-智能流程版
// @namespace    http://tampermonkey.net/
// @version      3.5.1
// @description  洗练助手，智能判断洗练结果并自动选择点击
// @author       SharkKing
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('🎯 咸鱼之王洗练助手(智能流程版)开始加载...');
    
    // 配置管理
    const CONFIG = {
        interval: 200, // 洗练间隔（ms）
        count: 1000, // 默认次数
        redAttrInterval: 30, // 红色属性间隔限制
        noRedInterval: 150, // 无红暂停间隔
        limitQuenchTimes: 0, // 限定洗练次数
        pauseOnRedAttack: true, // 发现红色攻击属性时暂停洗练
        pauseOnConsecutiveRed: true, // 连续出红暂停开关
        pauseOnNoRed: false, // 无红暂停开关
        stopOnLimit: false, // 限定次数停止开关
        customPauseConditions: [], // 自定义暂停条件
        
        // 位置配置
        quenchBtnPos: { x: 224, y: 547 }, // 洗练按钮位置 {x, y}
        skipBtnPos: { x: 301, y: 452 }, // 跳过按钮位置 {x, y}
        
        // 流程控制
        autoSkipRedOrange: true, // 自动跳过红/橙色（非目标属性）
        skipCheckDelay: 200, // 跳过按钮检查延迟(ms)，与洗练间隔相同
        
        // 游戏参数（从游戏界面获取）
        heroId: 107, // 从游戏界面获取
        part: 1, // 从游戏界面获取
        
        // 自动切换部位配置
        autoSwitchPart: false, // 是否启用自动切换部位
        closeBtnPos: { x: 207, y: 666 }, // 关闭按钮位置
        armorPos: { x: 370, y: 350 }, // 铠甲打开位置
        helmetPos: { x: 370, y: 430 }, // 头盔打开位置
        mountPos: { x: 370, y: 500 }, // 坐骑打开位置
        closeClickTimes: 2, // 关闭按钮点击次数
        closeClickInterval: 1000, // 关闭按钮点击间隔(ms)
        partSwitchDelay: 1000, // 切换到下一部位的延迟(ms)
        customSwitchConditions: [] // 自定义切换条件（独立于暂停条件）
    };
    
    // 状态变量
    let isMinimized = true; // 默认最小化
    let isWorking = false;
    let isPaused = false; // 暂停状态
    let isDragging = false;
    let dragOffset = {x:0, y:0};
    let quenchTimer = null; // 不再使用setInterval，保留此变量用于兼容性检查
    let currentCount = 0;
    let totalCount = 0;
    let lastRedQuenchTimes = 0;
    let redAttrCount = 0;
    let currentQuenchTimes = 0;
    let firstRedOccurred = false;
    let remainingCount = 0;
    let customConditionsCollapsed = false;
    let customSwitchConditionsCollapsed = false; // 自定义切换条件折叠状态
    let retryCount = 0;
    
    // 最小化时的日志缓存
    let minimizedLogs = [];
    
    // 日志去重缓存：记录最近1秒内的日志，避免重复记录
    let logDedupeCache = new Map(); // key: msg+type, value: timestamp
    
    // 所有日志记录（用于导出）
    let allLogs = []; // { time, msg, type, isRed }
    
    // 监听quench方法调用的结果
    let lastQuenchResult = null;
    let quenchResultPromise = null;
    
    // 位置选择状态
    let isSelectingPosition = false;
    let selectingFor = ''; // 'quench' 或 'skip'
    
    // 洗练流程状态
    let currentStep = 'idle'; // idle, quench, check_result, skip, wait_next, first_quench_retry
    let skipNeeded = false;
    let firstQuenchRetryCount = 0; // 第一次洗练重试计数
    
    // 自动切换部位状态
    let isSwitchingPart = false; // 是否正在切换部位
    let partSwitchRetryCount = 0; // 部位切换重试计数
    const MAX_PART_SWITCH_RETRY = 3; // 最大重试次数
    
    // 部位完成状态跟踪
    let completedParts = new Set(); // 已完成洗练的部位集合
    let allPartsCompleted = false; // 所有部位是否已完成
    
    // 属性配置
    const ATTRIBUTES = [
        { id: 1, name: '攻击' },
        { id: 2, name: '血量' },
        { id: 3, name: '防御' },
        { id: 4, name: '速度' },
        { id: 5, name: '破甲' },
        { id: 6, name: '破甲抵抗' },
        { id: 7, name: '精准' },
        { id: 8, name: '格挡' },
        { id: 9, name: '减伤' },
        { id: 10, name: '暴击' },
        { id: 11, name: '暴击抵抗' },
        { id: 12, name: '爆伤' },
        { id: 13, name: '爆伤抵抗' },
        { id: 14, name: '技能伤害' },
        { id: 15, name: '免控' },
        { id: 16, name: '眩晕免疫' },
        { id: 17, name: '冰冻免疫' },
        { id: 18, name: '沉默免疫' },
        { id: 19, name: '流血免疫' },
        { id: 20, name: '中毒免疫' },
        { id: 21, name: '灼烧免疫' }
    ];
    
    // 颜色配置
    const COLORS = [
        { id: 1, name: '白色' },
        { id: 2, name: '绿色' },
        { id: 3, name: '蓝色' },
        { id: 4, name: '紫色' },
        { id: 5, name: '橙色' },
        { id: 6, name: '红色' }
    ];
    
    // 部位配置
    const PARTS = [
        { value: 1, text: '武器' },
        { value: 2, text: '铠甲' },
        { value: 3, text: '头盔' },
        { value: 4, text: '坐骑' }
    ];
    
    // 英雄配置
    const HEROES = {
        101: { name: "司马懿", type: "魏国" },
        102: { name: "郭嘉", type: "魏国" },
        103: { name: "关羽", type: "蜀国" },
        104: { name: "诸葛亮", type: "蜀国" },
        105: { name: "周瑜", type: "吴国" },
        106: { name: "太史慈", type: "吴国" },
        107: { name: "吕布", type: "群雄" },
        108: { name: "华佗", type: "群雄" },
        109: { name: "甄姬", type: "魏国" },
        110: { name: "黄月英", type: "蜀国" },
        111: { name: "孙策", type: "吴国" },
        112: { name: "贾诩", type: "魏国" },
        113: { name: "曹仁", type: "魏国" },
        114: { name: "姜维", type: "蜀国" },
        115: { name: "孙坚", type: "吴国" },
        116: { name: "公孙瓒", type: "群雄" },
        117: { name: "典韦", type: "魏国" },
        118: { name: "赵云", type: "蜀国" },
        119: { name: "大乔", type: "吴国" },
        120: { name: "张角", type: "群雄" }
    };
    
    // 基础工具函数
    function isGameLoaded() { 
        try { 
            return window.__require && window.__require('data-index'); 
        } catch (e) { 
            return false; 
        } 
    }
    
    // 从日志消息中提取方法名
    function extractMethodName(msg) {
        // 匹配模式1：ServiceName.methodName (如 EquipmentService.quench)
        const serviceMethodMatch = msg.match(/(\w+)\.(\w+)(?:\(|$|\s)/);
        if (serviceMethodMatch && serviceMethodMatch[2]) {
            return serviceMethodMatch[2];
        }
        
        // 匹配模式2：.methodName (如 .quench, .openBox)
        const dotMethodMatch = msg.match(/\.(\w+)(?:\(|$|\s)/);
        if (dotMethodMatch && dotMethodMatch[1]) {
            return dotMethodMatch[1];
        }
        
        // 匹配常见的方法名（如果消息中包含，且前后有单词边界）
        const commonMethods = ['openBox', 'recruit', 'lottery', 'quench', 'getEquipmentData', 'getRole'];
        for (const method of commonMethods) {
            // 使用单词边界匹配，避免匹配到包含这些字符串的其他词
            const methodRegex = new RegExp(`\\b${method}\\b`);
            if (methodRegex.test(msg)) {
                return method;
            }
        }
        
        return null;
    }
    
    function addLog(msg, type='info', isRed=false) {
        // 不记录最小化和最大化的操作
        if (msg.includes('最小化') || msg.includes('最大化') || msg.includes('已还原')) {
            return;
        }
        
        // 检查1秒内是否有相同的日志
        const now = Date.now();
        
        // 尝试提取方法名
        const methodName = extractMethodName(msg);
        
        // 如果提取到方法名，使用方法名作为去重键；否则使用完整消息
        const logKey = methodName ? `${methodName}|${type}` : `${msg}|${type}`;
        const lastLogTime = logDedupeCache.get(logKey);
        
        if (lastLogTime && (now - lastLogTime) < 1000) {
            // 1秒内有相同的方法调用（或相同的日志），不记录
            return;
        }
        
        // 更新缓存
        logDedupeCache.set(logKey, now);
        
        // 清理过期缓存（超过1秒的）
        for (const [key, timestamp] of logDedupeCache.entries()) {
            if (now - timestamp >= 1000) {
                logDedupeCache.delete(key);
            }
        }
        
        const logTime = new Date().toLocaleTimeString();
        const logData = { time: logTime, msg: msg, type: type, isRed: isRed };
        
        // 保存到所有日志数组（用于导出）
        allLogs.push(logData);
        // 限制日志数量（保留最近1000条）
        if (allLogs.length > 1000) {
            allLogs.shift();
        }
        
        // 如果最小化，缓存日志
        if (isMinimized) {
            minimizedLogs.push(logData);
            // 限制缓存数量
            if (minimizedLogs.length > 50) {
                minimizedLogs.shift();
            }
            return;
        }
        
        const container = document.getElementById('xy-quench-log-container');
        if (!container) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${logTime}]</span>
            <span class="log-msg">${msg}</span>
        `;
        container.insertBefore(logEntry, container.firstChild);
        
        // 限制日志数量
        if (container.children.length > 50) {
            container.removeChild(container.lastChild);
        }
    }
    
    // 解析洗练属性为字符串
    function parseQuenchAttributes(equipmentData) {
        if (!equipmentData || !equipmentData.quenches) return '';
        
        const quenches = equipmentData.quenches;
        const slots = Object.keys(quenches).sort((a, b) => parseInt(a) - parseInt(b));
        const attrStrings = [];
        
        slots.forEach(slot => {
            const quench = quenches[slot];
            if (quench) {
                const colorName = getColorName(quench.colorId);
                const attrName = getAttrName(quench.attrId);
                attrStrings.push(`${colorName}${attrName}`);
            }
        });
        
        return attrStrings.map((str, index) => `${index + 1}.${str}`).join('');
    }
    
    function updateStatus(msg) { 
        const el = document.getElementById('xy-quench-status'); 
        if (el) el.textContent = msg; 
    }
    
    function delay(ms) { 
        return new Promise(resolve => setTimeout(resolve, ms)); 
    }

    // ==================== 自动切换部位功能 ====================
    
    // 获取下一部位的位置
    function getNextPartPosition() {
        const currentPart = CONFIG.part || 1;
        // 部位顺序: 1武器 -> 2铠甲 -> 3头盔 -> 4坐骑
        switch(currentPart) {
            case 1: // 武器 -> 铠甲
                return CONFIG.armorPos;
            case 2: // 铠甲 -> 头盔
                return CONFIG.helmetPos;
            case 3: // 头盔 -> 坐骑
                return CONFIG.mountPos;
            case 4: // 坐骑 -> 武器(循环)
                return null; // 已经是最后一个部位
            default:
                return CONFIG.armorPos;
        }
    }
    
    // 获取下一部位的值
    function getNextPartValue() {
        const currentPart = CONFIG.part || 1;
        switch(currentPart) {
            case 1: return 2; // 武器 -> 铠甲
            case 2: return 3; // 铠甲 -> 头盔
            case 3: return 4; // 头盔 -> 坐骑
            case 4: return null; // 坐骑 -> 无下一部位(不循环)
            default: return 2;
        }
    }
    
    // 获取部位名称
    function getPartName(partValue) {
        const part = PARTS.find(p => p.value === partValue);
        return part ? part.text : `部位${partValue}`;
    }
    
    // 执行关闭按钮点击
    async function clickCloseButton() {
        if (!CONFIG.closeBtnPos) {
            addLog('未设置关闭按钮位置，无法切换部位', 'error');
            return false;
        }
        
        addLog(`点击关闭按钮 (${CONFIG.closeBtnPos.x}, ${CONFIG.closeBtnPos.y})`, 'info');
        
        // 点击3次关闭按钮
        for (let i = 0; i < CONFIG.closeClickTimes; i++) {
            simulateClickAtPosition(CONFIG.closeBtnPos.x, CONFIG.closeBtnPos.y);
            addLog(`关闭按钮点击 ${i + 1}/${CONFIG.closeClickTimes}`, 'info');
            await delay(CONFIG.closeClickInterval);
        }
        
        return true;
    }
    
    // 执行部位切换
    async function switchToNextPart() {
        if (isSwitchingPart) {
            addLog('正在切换部位中，请稍候...', 'warning');
            return false;
        }
        
        isSwitchingPart = true;
        partSwitchRetryCount = 0;
        
        try {
            const nextPartPos = getNextPartPosition();
            const nextPartValue = getNextPartValue();
            const currentPartName = getPartName(CONFIG.part);
            
            // 如果已经是最后一个部位且不需要循环，则停止
            if (!nextPartValue) {
                addLog(`已完成所有部位洗练 (当前: ${currentPartName})`, 'success');
                isSwitchingPart = false;
                return false;
            }
            
            const nextPartName = getPartName(nextPartValue);
            
            addLog(`准备从 ${currentPartName} 切换到 ${nextPartName}`, 'info');
            
            // 步骤1: 点击关闭按钮
            const closeSuccess = await clickCloseButton();
            if (!closeSuccess) {
                throw new Error('点击关闭按钮失败');
            }
            
            // 步骤2: 等待界面完全关闭（增加等待时间）
            addLog('等待洗练界面关闭...', 'info');
            await delay(CONFIG.partSwitchDelay + 1000);
            
            // 步骤3: 点击下一部位
            addLog(`点击 ${nextPartName} 位置 (${nextPartPos.x}, ${nextPartPos.y})`, 'info');
            simulateClickAtPosition(nextPartPos.x, nextPartPos.y);
            
            // 步骤4: 等待洗练界面完全打开（增加等待时间）
            addLog('等待洗练界面打开...', 'info');
            await delay(2000);
            
            // 步骤5: 更新配置
            CONFIG.part = nextPartValue;
            saveConfig();
            
            // 步骤5: 更新UI显示
            updateHeroPartDisplay();
            
            addLog(`已切换到 ${nextPartName}，准备开始洗练`, 'success');
            
            // 重置洗练状态
            currentCount = 0;
            lastRedQuenchTimes = 0;
            redAttrCount = 0;
            currentQuenchTimes = 0;
            firstRedOccurred = false;
            remainingCount = 0;
            retryCount = 0;
            firstQuenchRetryCount = 0;
            currentStep = 'idle';
            skipNeeded = false;
            
            isSwitchingPart = false;
            partSwitchRetryCount = 0;
            
            return true;
            
        } catch (error) {
            addLog(`切换部位失败: ${error.message}`, 'error');
            
            // 重试逻辑
            partSwitchRetryCount++;
            if (partSwitchRetryCount < MAX_PART_SWITCH_RETRY) {
                addLog(`第${partSwitchRetryCount}次重试切换部位...`, 'warning');
                await delay(2000);
                isSwitchingPart = false;
                return await switchToNextPart();
            } else {
                addLog(`切换部位重试${MAX_PART_SWITCH_RETRY}次后仍然失败`, 'error');
                isSwitchingPart = false;
                return false;
            }
        }
    }
    
    // 检查是否需要自动切换部位
    async function checkAndSwitchPart(stopReason) {
        if (!CONFIG.autoSwitchPart) {
            return false; // 未启用自动切换部位
        }
        
        // 只有在因为满足自定义切换条件而停止时，才切换部位
        // 其他停止原因（如红色攻击、连续出红、无红等）不切换部位
        if (!stopReason || !stopReason.includes('自定义切换条件')) {
            addLog(`停止原因"${stopReason}"不符合自动切换部位条件（仅自定义切换条件触发）`, 'info');
            return false;
        }
        
        // 检查当前部位是否已完成
        const currentPart = CONFIG.part || 1;
        if (completedParts.has(currentPart)) {
            addLog(`当前部位${getPartName(currentPart)}已完成，不再切换`, 'info');
            return false;
        }
        
        // 标记当前部位为已完成
        completedParts.add(currentPart);
        addLog(`部位${getPartName(currentPart)}已完成洗练，准备切换到下一部位`, 'success');
        
        // 检查是否所有部位都已完成
        if (completedParts.size >= 4) {
            allPartsCompleted = true;
            addLog('所有部位洗练已完成，停止洗练', 'success');
            return false;
        }
        
        addLog(`检测到有效停止原因: ${stopReason}，准备切换部位`, 'info');
        
        // 执行部位切换
        const switchSuccess = await switchToNextPart();
        
        if (switchSuccess) {
            // 切换成功，自动开始洗练
            addLog('部位切换成功，自动开始新部位的洗练', 'success');
            
            // 延迟一下再开始洗练，确保界面完全加载
            await delay(2000);
            
            // 自动开始洗练
            startQuench();
            return true;
        } else {
            addLog('部位切换失败或已完成所有部位', 'warning');
            return false;
        }
    }

    // 保存配置
    function saveConfig() {
        try {
            // 确保heroId和part是数字类型
            const configToSave = {
                ...CONFIG,
                heroId: parseInt(CONFIG.heroId) || 107,
                part: parseInt(CONFIG.part) || 1
            };
            localStorage.setItem('xy_quench_config', JSON.stringify(configToSave));
            // 保存自定义暂停条件的折叠状态
            localStorage.setItem('xy_quench_custom_collapsed', JSON.stringify(customConditionsCollapsed));
            // 保存自定义切换条件的折叠状态
            localStorage.setItem('xy_quench_custom_switch_collapsed', JSON.stringify(customSwitchConditionsCollapsed));
            console.log('配置已保存:', configToSave);
        } catch (e) {
            console.error('保存配置失败:', e);
        }
    }

    // 加载配置
    function loadConfig() {
        try {
            const saved = localStorage.getItem('xy_quench_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 确保heroId和part是数字类型
                if (parsed.heroId !== undefined) {
                    CONFIG.heroId = parseInt(parsed.heroId) || 107;
                }
                if (parsed.part !== undefined) {
                    CONFIG.part = parseInt(parsed.part) || 1;
                }
                // 加载其他配置
                if (parsed.interval !== undefined) CONFIG.interval = parsed.interval;
                if (parsed.count !== undefined) CONFIG.count = parsed.count;
                if (parsed.redAttrInterval !== undefined) CONFIG.redAttrInterval = parsed.redAttrInterval;
                if (parsed.noRedInterval !== undefined) CONFIG.noRedInterval = parsed.noRedInterval;
                if (parsed.limitQuenchTimes !== undefined) CONFIG.limitQuenchTimes = parsed.limitQuenchTimes;
                if (parsed.pauseOnRedAttack !== undefined) CONFIG.pauseOnRedAttack = parsed.pauseOnRedAttack;
                if (parsed.pauseOnConsecutiveRed !== undefined) CONFIG.pauseOnConsecutiveRed = parsed.pauseOnConsecutiveRed;
                if (parsed.pauseOnNoRed !== undefined) CONFIG.pauseOnNoRed = parsed.pauseOnNoRed;
                if (parsed.stopOnLimit !== undefined) CONFIG.stopOnLimit = parsed.stopOnLimit;
                if (parsed.autoSkipRedOrange !== undefined) CONFIG.autoSkipRedOrange = parsed.autoSkipRedOrange;
                if (parsed.skipCheckDelay !== undefined) CONFIG.skipCheckDelay = parsed.skipCheckDelay;
                // 加载自动切换部位配置
                if (parsed.autoSwitchPart !== undefined) CONFIG.autoSwitchPart = parsed.autoSwitchPart;
                if (parsed.closeBtnPos !== undefined && parsed.closeBtnPos !== null) {
                    CONFIG.closeBtnPos = parsed.closeBtnPos;
                }
                if (parsed.armorPos !== undefined && parsed.armorPos !== null) {
                    CONFIG.armorPos = parsed.armorPos;
                }
                if (parsed.helmetPos !== undefined && parsed.helmetPos !== null) {
                    CONFIG.helmetPos = parsed.helmetPos;
                }
                if (parsed.mountPos !== undefined && parsed.mountPos !== null) {
                    CONFIG.mountPos = parsed.mountPos;
                }
                if (parsed.closeClickTimes !== undefined) CONFIG.closeClickTimes = parsed.closeClickTimes;
                if (parsed.closeClickInterval !== undefined) CONFIG.closeClickInterval = parsed.closeClickInterval;
                if (parsed.partSwitchDelay !== undefined) CONFIG.partSwitchDelay = parsed.partSwitchDelay;
                // 加载位置配置（如果已保存则使用保存的值，否则使用默认值）
                if (parsed.quenchBtnPos !== undefined && parsed.quenchBtnPos !== null) {
                    CONFIG.quenchBtnPos = parsed.quenchBtnPos;
                }
                if (parsed.skipBtnPos !== undefined && parsed.skipBtnPos !== null) {
                    CONFIG.skipBtnPos = parsed.skipBtnPos;
                }
                if (parsed.customPauseConditions !== undefined) CONFIG.customPauseConditions = parsed.customPauseConditions;
                // 加载自定义切换条件配置
                if (parsed.customSwitchConditions !== undefined) CONFIG.customSwitchConditions = parsed.customSwitchConditions;
                
                // 加载自定义暂停条件的折叠状态
                try {
                    const collapsed = localStorage.getItem('xy_quench_custom_collapsed');
                    if (collapsed !== null) {
                        customConditionsCollapsed = JSON.parse(collapsed);
                    }
                } catch (e) {
                    console.warn('加载自定义暂停条件折叠状态失败:', e);
                }
                
                // 加载自定义切换条件的折叠状态
                try {
                    const switchCollapsed = localStorage.getItem('xy_quench_custom_switch_collapsed');
                    if (switchCollapsed !== null) {
                        customSwitchConditionsCollapsed = JSON.parse(switchCollapsed);
                    }
                } catch (e) {
                    console.warn('加载自定义切换条件折叠状态失败:', e);
                }
                
                console.log('配置已加载:', CONFIG);
            }
        } catch (e) {
            console.error('加载配置失败:', e);
        }
    }
    
    // 获取属性名称
    function getAttrName(attrId) {
        const attr = ATTRIBUTES.find(a => a.id === attrId);
        return attr ? attr.name : `属性${attrId}`;
    }
    
    // 获取颜色名称
    function getColorName(colorId) {
        const color = COLORS.find(c => c.id === colorId);
        return color ? color.name : `颜色${colorId}`;
    }
    
    // 添加自定义暂停条件
    function addCustomPauseCondition(attrId, colorId) {
        const condition = { attrId, colorId };
        if (!CONFIG.customPauseConditions.some(c => c.attrId === attrId && c.colorId === colorId)) {
            CONFIG.customPauseConditions.push(condition);
            saveConfig();
            updateCustomConditionsDisplay();
            addLog(`添加暂停条件: ${getAttrName(attrId)}(${getColorName(colorId)})`, 'success');
        }
    }
    
    // 移除自定义暂停条件
    function removeCustomPauseCondition(attrId, colorId) {
        const index = CONFIG.customPauseConditions.findIndex(c => c.attrId === attrId && c.colorId === colorId);
        if (index !== -1) {
            CONFIG.customPauseConditions.splice(index, 1);
            saveConfig();
            updateCustomConditionsDisplay();
            addLog(`移除暂停条件: ${getAttrName(attrId)}(${getColorName(colorId)})`, 'info');
        }
    }
    
    // 更新自定义条件显示
    function updateCustomConditionsDisplay() {
        const container = document.getElementById('xy-quench-custom-conditions');
        if (!container) return;
        
        if (CONFIG.customPauseConditions.length === 0) {
            container.innerHTML = '<div style="color:#95a5a6; text-align:center; padding:6px; font-size:10px;">暂无自定义暂停条件</div>';
            return;
        }
        
        container.innerHTML = CONFIG.customPauseConditions.map(condition => `
            <div class="xy-quench-custom-condition" data-attr="${condition.attrId}" data-color="${condition.colorId}"
                 style="display:flex; align-items:center; justify-content:space-between; padding:4px 6px; background:#2c3e50; border-radius:3px; margin-bottom:2px; font-size:10px;">
                <span>${getAttrName(condition.attrId)}(${getColorName(condition.colorId)})</span>
                <button class="xy-quench-remove-condition" data-attr="${condition.attrId}" data-color="${condition.colorId}"
                        style="background:#e74c3c; border:none; color:#fff; width:16px; height:16px; border-radius:50%; cursor:pointer; font-size:10px;">×</button>
            </div>
        `).join('');
        
        // 绑定移除事件
        container.querySelectorAll('.xy-quench-remove-condition').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const attrId = parseInt(btn.dataset.attr);
                const colorId = parseInt(btn.dataset.color);
                removeCustomPauseCondition(attrId, colorId);
            });
        });
    }
    
    // ==================== 自定义切换条件功能 ====================
    
    // 添加自定义切换条件
    function addCustomSwitchCondition(attrId, colorId) {
        console.log('添加自定义切换条件:', attrId, colorId);
        const condition = { attrId, colorId };
        if (!CONFIG.customSwitchConditions.some(c => c.attrId === attrId && c.colorId === colorId)) {
            CONFIG.customSwitchConditions.push(condition);
            saveConfig();
            updateCustomSwitchConditionsDisplay();
            addLog(`添加切换条件: ${getAttrName(attrId)}(${getColorName(colorId)})`, 'success');
            console.log('切换条件已添加，当前条件:', CONFIG.customSwitchConditions);
        } else {
            console.log('切换条件已存在');
        }
    }
    
    // 移除自定义切换条件
    function removeCustomSwitchCondition(attrId, colorId) {
        const index = CONFIG.customSwitchConditions.findIndex(c => c.attrId === attrId && c.colorId === colorId);
        if (index !== -1) {
            CONFIG.customSwitchConditions.splice(index, 1);
            saveConfig();
            updateCustomSwitchConditionsDisplay();
            addLog(`移除切换条件: ${getAttrName(attrId)}(${getColorName(colorId)})`, 'info');
        }
    }
    
    // 更新自定义切换条件显示
    function updateCustomSwitchConditionsDisplay() {
        const container = document.getElementById('xy-quench-custom-switch-conditions');
        if (!container) {
            console.log('未找到自定义切换条件容器');
            return;
        }
        
        console.log('更新自定义切换条件显示，条件数量:', CONFIG.customSwitchConditions.length);
        
        if (CONFIG.customSwitchConditions.length === 0) {
            container.innerHTML = '<div style="color:#95a5a6; text-align:center; padding:6px; font-size:10px;">暂无自定义切换条件</div>';
            return;
        }
        
        container.innerHTML = CONFIG.customSwitchConditions.map(condition => `
            <div class="xy-quench-custom-switch-condition" data-attr="${condition.attrId}" data-color="${condition.colorId}"
                 style="display:flex; align-items:center; justify-content:space-between; padding:4px 6px; background:#2c3e50; border-radius:3px; margin-bottom:2px; font-size:10px;">
                <span style="color:#fff;">${getAttrName(condition.attrId)}(${getColorName(condition.colorId)})</span>
                <button class="xy-quench-remove-switch-condition" data-attr="${condition.attrId}" data-color="${condition.colorId}"
                        style="background:#e74c3c; border:none; color:#fff; width:16px; height:16px; border-radius:50%; cursor:pointer; font-size:10px;">×</button>
            </div>
        `).join('');
        
        // 绑定移除事件
        container.querySelectorAll('.xy-quench-remove-switch-condition').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const attrId = parseInt(btn.dataset.attr);
                const colorId = parseInt(btn.dataset.color);
                removeCustomSwitchCondition(attrId, colorId);
            });
        });
    }
    
    // 获取游戏当前状态（英雄ID和部位）
    function getGameCurrentState() {
        try {
            // 优先使用配置中的heroId和part（用户选择的值）
            // 如果没有配置，尝试从游戏数据获取
            let heroId = CONFIG.heroId || 107;
            let part = CONFIG.part || 1;
            
            // 可选：从游戏数据自动获取当前英雄ID（如果用户没有手动设置）
            // 注释掉自动获取，因为用户可能想要手动选择
            /*
            if (window.__require) {
                const dataIndex = window.__require('data-index');
                if (dataIndex && dataIndex.RoleService) {
                    const roleData = dataIndex.RoleService.getRole();
                    if (roleData && roleData.currentHeroId) {
                        heroId = roleData.currentHeroId;
                        CONFIG.heroId = heroId;
                    }
                }
            }
            */
            
            console.log('当前游戏状态:', { heroId: heroId, part: part, heroName: HEROES[heroId] ? HEROES[heroId].name : '未知', partName: PARTS.find(p => p.value === part) ? PARTS.find(p => p.value === part).text : '未知' });
            return { heroId: heroId, part: part };
        } catch (e) {
            console.error('获取游戏状态失败:', e);
            return { heroId: CONFIG.heroId || 107, part: CONFIG.part || 1 };
        }
    }
    
    // 获取EquipmentService
    function getEquipmentService() {
        try {
            if (window.__require) {
                const dataIndex = window.__require('data-index');
                if (dataIndex && dataIndex.EquipmentService) {
                    return dataIndex.EquipmentService;
                }
            }
            
            if (window.game && window.game.services && window.game.services.EquipmentService) {
                return window.game.services.EquipmentService;
            }
            if (window.EquipmentService) {
                return window.EquipmentService;
            }
            
            return null;
        } catch (e) {
            console.error('获取EquipmentService失败:', e);
            return null;
        }
    }
    
    // 监听quench方法调用
    function setupQuenchListener() {
        try {
            const EquipmentService = getEquipmentService();
            if (!EquipmentService || !EquipmentService.quench) {
                console.warn('EquipmentService或quench方法不存在，无法设置监听');
                return;
            }
            
            // 保存原始方法
            const originalQuench = EquipmentService.quench;
            
            // 重写quench方法以监听调用
            EquipmentService.quench = function(...args) {
                console.log('🎯 监听到quench方法调用:', args);
                
                // 调用原始方法
                const result = originalQuench.apply(this, args);
                
                // 如果是Promise，监听结果
                if (result instanceof Promise) {
                    quenchResultPromise = result.then(resolvedValue => {
                        console.log('✅ quench方法返回结果:', resolvedValue);
                        lastQuenchResult = resolvedValue;
                        return resolvedValue;
                    }).catch(error => {
                        console.error('❌ quench方法调用失败:', error);
                        lastQuenchResult = null;
                        throw error;
                    });
                } else {
                    lastQuenchResult = result;
                }
                
                return result;
            };
            
            console.log('✅ quench方法监听已设置');
        } catch (e) {
            console.error('设置quench监听失败:', e);
        }
    }
    
    // 辅助函数：尝试从heroes对象中获取指定heroId的数据（支持字符串和数字键）
    function getHeroData(heroes, targetHeroId) {
        if (!heroes) return null;
        // 尝试数字键
        if (heroes[targetHeroId]) return heroes[targetHeroId];
        // 尝试字符串键
        if (heroes[String(targetHeroId)]) return heroes[String(targetHeroId)];
        return null;
    }
    
    // 辅助函数：尝试从equipment对象中获取指定part的数据（支持字符串和数字键）
    function getEquipmentDataFromMap(equipment, targetPart) {
        if (!equipment) return null;
        // 尝试数字键
        if (equipment[targetPart]) return equipment[targetPart];
        // 尝试字符串键
        if (equipment[String(targetPart)]) return equipment[String(targetPart)];
        return null;
    }
    
    // 获取洗练结果（优先从quench方法返回结果中获取）
    async function getQuenchResult() {
        try {
            // 获取游戏当前状态
            const gameState = getGameCurrentState();
            const heroId = gameState.heroId;
            const part = gameState.part;
            
            console.log(`🔍 开始获取洗练结果: heroId=${heroId}, part=${part}`);
            
            // 方法0：等待quench方法调用的结果（主要方法，最可靠）
            // 根据监控代码，quench返回的结果结构是：{ _rawData: { role: { heroes: { [heroId]: { equipment: { [part]: {...} } } } } } }
            if (quenchResultPromise) {
                try {
                    // 增加等待时间到500ms，确保数据可用（根据日志，quench返回结果是最可靠的）
                    const result = await Promise.race([
                        quenchResultPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('等待超时')), 500))
                    ]);
                    
                    if (result && result._rawData && result._rawData.role) {
                        const roleData = result._rawData.role;
                        if (roleData.heroes) {
                            const heroData = getHeroData(roleData.heroes, heroId);
                            if (heroData && heroData.equipment) {
                                const equipmentData = getEquipmentDataFromMap(heroData.equipment, part);
                                if (equipmentData) {
                                    const dataSource = 'quench返回结果 -> result._rawData.role.heroes[' + heroId + '].equipment[' + part + ']';
                                    console.log('✅ 成功从quench返回结果获取装备数据:', {
                                        quenchTimes: equipmentData.quenchTimes,
                                        quenchesCount: equipmentData.quenches ? Object.keys(equipmentData.quenches).length : 0,
                                        dataSource: dataSource
                                    });
                                    addLog(`[数据源] ${dataSource}`, 'info');
                                    // 清空Promise，准备下一次调用
                                    quenchResultPromise = null;
                                    return equipmentData;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn('等待quench结果失败:', e);
                    quenchResultPromise = null;
                }
            }
            
            // 如果已经有缓存的quench结果，尝试使用（备用方法）
            // 根据日志，有些洗练没有记录数据源，可能是使用了缓存的quench结果
            if (lastQuenchResult && lastQuenchResult._rawData && lastQuenchResult._rawData.role) {
                const roleData = lastQuenchResult._rawData.role;
                if (roleData.heroes) {
                    const heroData = getHeroData(roleData.heroes, heroId);
                    if (heroData && heroData.equipment) {
                        const equipmentData = getEquipmentDataFromMap(heroData.equipment, part);
                        if (equipmentData) {
                            const dataSource = '缓存的quench结果 -> lastQuenchResult._rawData.role.heroes[' + heroId + '].equipment[' + part + ']';
                            console.log('✅ 成功从缓存的quench结果获取装备数据');
                            addLog(`[数据源] ${dataSource}`, 'info');
                            return equipmentData;
                        }
                    }
                }
            }
            
            // 如果所有方法都失败，输出调试信息
            const debugInfo = {
                heroId: heroId,
                part: part,
                hasQuenchResult: !!lastQuenchResult,
                hasQuenchPromise: !!quenchResultPromise
            };
            console.error('❌ 无法获取洗练结果数据');
            console.error('调试信息:', debugInfo);
            addLog(`[数据源] 无法获取洗练结果，调试信息: ${JSON.stringify(debugInfo)}`, 'error');
            
            throw new Error('无法获取洗练结果数据：quench返回结果和缓存都不可用');
        } catch (e) {
            console.error('获取洗练结果失败:', e);
            throw e;
        }
    }
    
    // 检查洗练结果是否满足停止条件
    function checkQuenchResult(equipmentData) {
        if (!equipmentData) {
            return { shouldStop: false, shouldSkip: false, shouldSwitch: false, reason: '' };
        }
        
        const currentQuenches = equipmentData.quenches || {};
        let shouldStop = false;
        let shouldSkip = false;
        let shouldSwitch = false;
        let reason = '';
        
        // 1. 检查自定义切换条件（优先级最高，如果启用了自动切换部位）
        if (CONFIG.autoSwitchPart && CONFIG.customSwitchConditions.length > 0) {
            for (const slot in currentQuenches) {
                const quench = currentQuenches[slot];
                if (!quench) continue;
                
                // 检查自定义切换条件
                const isCustomSwitchCondition = CONFIG.customSwitchConditions.some(condition => 
                    condition.attrId === quench.attrId && condition.colorId === quench.colorId
                );
                
                if (isCustomSwitchCondition) {
                    shouldSwitch = true;
                    reason = `自定义切换条件: ${getAttrName(quench.attrId)}(${getColorName(quench.colorId)})`;
                    return { shouldStop, shouldSkip, shouldSwitch, reason };
                }
            }
        }
        
        // 2. 检查自定义暂停条件
        for (const slot in currentQuenches) {
            const quench = currentQuenches[slot];
            if (!quench) continue;
            
            // 检查自定义暂停条件
            const isCustomCondition = CONFIG.customPauseConditions.some(condition => 
                condition.attrId === quench.attrId && condition.colorId === quench.colorId
            );
            
            if (isCustomCondition) {
                shouldStop = true;
                reason = `自定义条件: ${getAttrName(quench.attrId)}(${getColorName(quench.colorId)})`;
                return { shouldStop, shouldSkip, shouldSwitch, reason };
            }
        }
        
        // 3. 检查红色攻击属性暂停
        if (CONFIG.pauseOnRedAttack) {
            for (const slot in currentQuenches) {
                const quench = currentQuenches[slot];
                if (quench && quench.colorId === 6 && quench.attrId === 1) {
                    shouldStop = true;
                    reason = '红色攻击属性';
                    return { shouldStop, shouldSkip, shouldSwitch, reason };
                }
            }
        }
        
        // 4. 检查是否有红色或橙色属性
        let hasRedOrange = false;
        for (const slot in currentQuenches) {
            const quench = currentQuenches[slot];
            if (quench && (quench.colorId === 6 || quench.colorId === 5)) {
                hasRedOrange = true;
                break;
            }
        }
        
        // 5. 如果出现红/橙色但不符合停止条件，需要跳过
        if (hasRedOrange && CONFIG.autoSkipRedOrange) {
            shouldSkip = true;
            reason = '出现红/橙色属性，需要跳过';
        }
        
        return { shouldStop, shouldSkip, shouldSwitch, reason };
    }
    
    // 模拟点击（穿透模式，不对UI生效）
    function simulateClickAtPosition(x, y) {
        try {
            console.log(`模拟点击位置: (${x}, ${y})`);
            
            // 最小化时显示点击特效
            if (isMinimized) {
                showClickEffect(x, y);
            }
            
            // 获取点击位置的元素（穿透UI）
            const element = document.elementFromPoint(x, y);
            if (!element) {
                console.warn('无法获取点击位置的元素');
                return false;
            }
            
            // 检查是否点击在UI上，如果是则穿透
            const uiContainer = document.getElementById('xy-quench-helper');
            let targetElement = element;
            
            // 检查是否点击在UI容器内
            if (uiContainer) {
                const rect = uiContainer.getBoundingClientRect();
                const isInsideUI = x >= rect.left && x <= rect.right && 
                                   y >= rect.top && y <= rect.bottom;
                
                if (isInsideUI) {
                    // 点击在UI上，临时禁用pointerEvents穿透到下层
                    const originalPointerEvents = uiContainer.style.pointerEvents;
                    uiContainer.style.pointerEvents = 'none';
                    
                    // 重新获取点击位置的元素（穿透UI后）
                    targetElement = document.elementFromPoint(x, y);
                    
                    // 恢复pointerEvents
                    uiContainer.style.pointerEvents = originalPointerEvents || '';
                    
                    // 如果穿透后还是UI元素，继续向上查找
                    if (targetElement && (targetElement === uiContainer || targetElement.closest('#xy-quench-helper'))) {
                        // 尝试获取UI后面的元素
                        const allElements = document.elementsFromPoint(x, y);
                        for (const el of allElements) {
                            if (el !== uiContainer && !el.closest('#xy-quench-helper')) {
                                targetElement = el;
                                break;
                            }
                        }
                    }
                }
            }
            
            // 创建鼠标事件
            const mouseEvents = [
                new MouseEvent('mousedown', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                }),
                new MouseEvent('mouseup', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                }),
                new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y
                })
            ];
            
            // 触发事件
            for (const event of mouseEvents) {
                targetElement.dispatchEvent(event);
            }
            
            return true;
        } catch (e) {
            console.error('模拟点击失败:', e);
            return false;
        }
    }
    
    // 显示点击特效（最小化时）
    function showClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            left: ${x - 10}px;
            top: ${y - 10}px;
            width: 20px;
            height: 20px;
            border: 2px solid #3498db;
            border-radius: 50%;
            background: rgba(52, 152, 219, 0.3);
            pointer-events: none;
            z-index: 999999;
            animation: clickEffect 0.5s ease-out forwards;
        `;
        
        // 添加动画样式（如果还没有）
        if (!document.getElementById('xy-quench-click-effect-style')) {
            const style = document.createElement('style');
            style.id = 'xy-quench-click-effect-style';
            style.textContent = `
                @keyframes clickEffect {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(3);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(effect);
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 500);
    }
    
    // 执行洗练流程
    async function executeQuenchStep() {
        try {
            switch(currentStep) {
                case 'idle':
                    // 开始新一轮洗练
                    currentStep = 'quench';
                    break;
                    
                case 'quench':
                    // 点击洗练按钮
                    if (!CONFIG.quenchBtnPos) {
                        throw new Error('请先设置洗练按钮位置');
                    }
                    
                    const clickSuccess = simulateClickAtPosition(
                        CONFIG.quenchBtnPos.x,
                        CONFIG.quenchBtnPos.y
                    );
                    
                    if (!clickSuccess) {
                        throw new Error('点击洗练按钮失败');
                    }
                    
                    addLog(`第${currentCount + 1}次洗练`, 'info');
                    currentStep = 'check_result';
                    currentCount++;
                    break;
                    
                case 'check_result':
                    // 等待洗练结果（200ms后开始解析）
                    await delay(200);
                    
                    // 获取洗练结果
                    let equipmentData = null;
                    try {
                        equipmentData = await getQuenchResult();
                    } catch (error) {
                        // 如果是第一次洗练且获取失败，尝试重试流程
                        if (currentCount === 1 && firstQuenchRetryCount === 0 && error.message.includes('无法获取洗练结果数据')) {
                            addLog(`第一次洗练无法获取结果，尝试点击跳过后再点击洗练`, 'warning');
                            firstQuenchRetryCount = 1;
                            currentStep = 'first_quench_retry';
                            return true; // 继续流程
                        }
                        // 如果已经重试过一次还是失败，或者不是第一次洗练，抛出错误
                        throw error;
                    }
                    
                    if (!equipmentData) {
                        // 如果是第一次洗练且获取失败，尝试重试流程
                        if (currentCount === 1 && firstQuenchRetryCount === 0) {
                            addLog(`第一次洗练无法获取结果，尝试点击跳过后再点击洗练`, 'warning');
                            firstQuenchRetryCount = 1;
                            currentStep = 'first_quench_retry';
                            return true; // 继续流程
                        }
                        throw new Error('无法获取洗练结果');
                    }
                    
                    // 如果成功获取结果，重置重试计数
                    if (firstQuenchRetryCount > 0) {
                        firstQuenchRetryCount = 0;
                        addLog(`重试后成功获取洗练结果`, 'success');
                    }
                    
                    // 更新当前quenchTimes
                    currentQuenchTimes = equipmentData.quenchTimes || 0;
                    
                    // 检查结果
                    const checkResult = checkQuenchResult(equipmentData);
                    
                    // 记录红色属性出现（只记录红色colorId=6，不记录橙色colorId=5）
                    const currentQuenches = equipmentData.quenches || {};
                    let hasRedAttr = false;
                    let hasOrangeAttr = false;
                    for (const slot in currentQuenches) {
                        const quench = currentQuenches[slot];
                        if (quench) {
                            if (quench.colorId === 6) {
                                hasRedAttr = true;
                            } else if (quench.colorId === 5) {
                                hasOrangeAttr = true;
                            }
                        }
                    }
                    
                    // 只有红色才计入lastRedQuenchTimes，橙色不计入
                    if (hasRedAttr) {
                        // 检查与上次红色属性的间隔（只在检测到新的红色属性时检查）
                        // 重要：如果currentQuenchTimes与lastRedQuenchTimes相同，说明使用的是缓存数据，不应该进行间隔检查
                        if (CONFIG.pauseOnConsecutiveRed && lastRedQuenchTimes > 0) {
                            // 如果quenchTimes相同，说明使用的是缓存数据，跳过间隔检查
                            if (currentQuenchTimes === lastRedQuenchTimes) {
                                addLog(`检测到红色属性，但quenchTimes=${currentQuenchTimes}与上次相同（使用缓存数据），跳过间隔检查`, 'info', true);
                            } else {
                                const timesDiff = currentQuenchTimes - lastRedQuenchTimes;
                                if (timesDiff < CONFIG.redAttrInterval) {
                                    addLog(`连续出红间隔${timesDiff}小于${CONFIG.redAttrInterval}，暂停洗练! (当前配置: redAttrInterval=${CONFIG.redAttrInterval})`, 'warning', true);
                                    pauseQuench('连续出红间隔过小');
                                    return false;
                                }
                            }
                        }
                        
                        // 只有quenchTimes不同时才更新lastRedQuenchTimes（避免使用缓存数据时重复更新）
                        if (currentQuenchTimes !== lastRedQuenchTimes) {
                            redAttrCount++;
                            lastRedQuenchTimes = currentQuenchTimes;
                            firstRedOccurred = true;
                            addLog(`检测到红色属性，更新lastRedQuenchTimes=${currentQuenchTimes}`, 'info', true);
                        }
                    } else if (hasOrangeAttr) {
                        // 橙色不计入红色间隔，只记录日志
                        addLog(`检测到橙色属性（不计入红色间隔）`, 'info', false);
                    }
                    
                    // 记录洗练完成时的红色属性状态
                    const attrStr = parseQuenchAttributes(equipmentData);
                    if (attrStr) {
                        addLog(`✅ 洗练完成 (quenchTimes: ${currentQuenchTimes}) ${attrStr}`, 'info', hasRedAttr);
                    } else {
                        addLog(`✅ 洗练完成 (quenchTimes: ${currentQuenchTimes})`, 'info', hasRedAttr);
                    }
                    
                    // 判断下一步
                    if (checkResult.shouldSwitch) {
                        // 满足切换条件，切换到下一部位（不暂停）
                        addLog(`🔄 ${checkResult.reason}，准备切换部位`, 'success');
                        pauseQuench(checkResult.reason);
                        return false;
                    } else if (checkResult.shouldStop) {
                        // 停止洗练
                        addLog(`🎯 ${checkResult.reason}，停止洗练`, 'success');
                        stopQuench(checkResult.reason);
                        return false;
                    } else if (checkResult.shouldSkip) {
                        // 需要跳过
                        addLog(`⚠️ ${checkResult.reason}，准备跳过`, 'warning');
                        skipNeeded = true;
                        currentStep = 'skip';
                    } else {
                        // 继续洗练（属性已在上面记录）
                        currentStep = 'wait_next';
                    }
                    break;
                    
                case 'skip':
                    // 点击跳过按钮
                    if (!CONFIG.skipBtnPos) {
                        addLog('未设置跳过按钮位置，跳过失败', 'error');
                        currentStep = 'wait_next';
                        skipNeeded = false;
                        break;
                    }
                    
                    // 等待跳过按钮出现（200ms）
                    await delay(200);
                    
                    const skipSuccess = simulateClickAtPosition(
                        CONFIG.skipBtnPos.x,
                        CONFIG.skipBtnPos.y
                    );
                    
                    if (skipSuccess) {
                        addLog('点击跳过按钮', 'info');
                    } else {
                        addLog('跳过失败', 'warning');
                    }
                    
                    skipNeeded = false;
                    currentStep = 'wait_next';
                    break;
                    
                case 'first_quench_retry':
                    // 第一次洗练重试流程：先点击跳过，再点击洗练
                    if (firstQuenchRetryCount === 1) {
                        // 第一步：点击跳过按钮
                        if (!CONFIG.skipBtnPos) {
                            addLog('未设置跳过按钮位置，无法重试', 'error');
                            stopQuench('第一次洗练获取结果失败且无法重试');
                            return false;
                        }
                        
                        await delay(200);
                        const skipSuccess = simulateClickAtPosition(
                            CONFIG.skipBtnPos.x,
                            CONFIG.skipBtnPos.y
                        );
                        
                        if (skipSuccess) {
                            addLog('点击跳过按钮（重试流程）', 'info');
                        } else {
                            addLog('跳过失败（重试流程）', 'warning');
                        }
                        
                        await delay(200);
                        
                        // 第二步：点击洗练按钮
                        if (!CONFIG.quenchBtnPos) {
                            addLog('未设置洗练按钮位置，无法重试', 'error');
                            stopQuench('第一次洗练获取结果失败且无法重试');
                            return false;
                        }
                        
                        const quenchClickSuccess = simulateClickAtPosition(
                            CONFIG.quenchBtnPos.x,
                            CONFIG.quenchBtnPos.y
                        );
                        
                        if (!quenchClickSuccess) {
                            addLog('点击洗练按钮失败（重试流程）', 'error');
                            stopQuench('第一次洗练重试失败');
                            return false;
                        }
                        
                        addLog('点击洗练按钮（重试流程）', 'info');
                        await delay(200);
                        
                        // 第三步：再次尝试获取洗练结果
                        try {
                            const retryEquipmentData = await getQuenchResult();
                            if (!retryEquipmentData) {
                                throw new Error('无法获取洗练结果');
                            }
                            
                            // 成功获取，重置状态并继续正常流程
                            firstQuenchRetryCount = 0;
                            addLog(`重试后成功获取洗练结果`, 'success');
                            
                            // 将获取到的数据赋值给equipmentData，然后继续执行check_result逻辑
                            // 通过设置currentStep为check_result，让下一次循环执行check_result分支
                            // 但我们需要直接处理数据，避免再次调用getQuenchResult
                            // 所以这里我们直接执行check_result的逻辑
                            
                            // 更新当前quenchTimes
                            currentQuenchTimes = retryEquipmentData.quenchTimes || 0;
                            
                            // 检查结果
                            const checkResult = checkQuenchResult(retryEquipmentData);
                            
                            // 记录红色属性出现（只记录红色colorId=6，不记录橙色colorId=5）
                            const currentQuenches = retryEquipmentData.quenches || {};
                            let hasRedAttr = false;
                            let hasOrangeAttr = false;
                            for (const slot in currentQuenches) {
                                const quench = currentQuenches[slot];
                                if (quench) {
                                    if (quench.colorId === 6) {
                                        hasRedAttr = true;
                                    } else if (quench.colorId === 5) {
                                        hasOrangeAttr = true;
                                    }
                                }
                            }
                            
                            // 只有红色才计入lastRedQuenchTimes，橙色不计入
                            if (hasRedAttr) {
                                // 如果上次洗练为红色属性，记录为基准（第一次洗练）
                                if (currentQuenchTimes > 0) {
                                    lastRedQuenchTimes = currentQuenchTimes;
                                    firstRedOccurred = true;
                                    redAttrCount++;
                                    addLog(`重试后检测到红色属性，quenchTimes=${currentQuenchTimes}，已记录为基准`, 'info', true);
                                } else {
                                    addLog(`重试后检测到红色属性`, 'info', true);
                                }
                            } else if (hasOrangeAttr) {
                                // 橙色不计入红色间隔，只记录日志
                                addLog(`重试后检测到橙色属性（不计入红色间隔）`, 'info', false);
                            } else {
                                addLog(`重试后未检测到红色属性`, 'info', false);
                            }
                            
                            // 记录洗练完成时的红色属性状态
                            const attrStr = parseQuenchAttributes(retryEquipmentData);
                            if (attrStr) {
                                addLog(`✅ 洗练完成 (quenchTimes: ${currentQuenchTimes}) ${attrStr}`, 'info', hasRedAttr);
                            } else {
                                addLog(`✅ 洗练完成 (quenchTimes: ${currentQuenchTimes})`, 'info', hasRedAttr);
                            }
                            
                            // 判断下一步
                            if (checkResult.shouldStop) {
                                // 停止洗练
                                addLog(`🎯 ${checkResult.reason}，停止洗练`, 'success');
                                stopQuench(checkResult.reason);
                                return false;
                            } else if (checkResult.shouldSkip) {
                                // 需要跳过
                                addLog(`⚠️ ${checkResult.reason}，准备跳过`, 'warning');
                                skipNeeded = true;
                                currentStep = 'skip';
                            } else {
                                // 继续洗练
                                currentStep = 'wait_next';
                            }
                            
                            return true;
                        } catch (retryError) {
                            // 重试后还是失败，停止洗练
                            addLog(`重试后仍然无法获取洗练结果: ${retryError.message}`, 'error');
                            stopQuench('第一次洗练重试后仍然失败');
                            return false;
                        }
                    }
                    break;
                    
                case 'wait_next':
                    // 检查是否完成
                    if (currentCount >= totalCount) {
                        stopQuench('洗练完成');
                        updateStatus('洗练完成');
                        addLog(`洗练完成! 完成${currentCount}次，红色属性${redAttrCount}次`, 'success');
                        
                        // 如果启用了自动切换部位，检查是否所有部位都已完成
                        if (CONFIG.autoSwitchPart && completedParts.size >= 4) {
                            addLog('所有部位洗练已完成，停止洗练', 'success');
                            return false;
                        }
                        return false;
                    }
                    
                    // 更新状态显示
                    updateStatus(`洗练中: ${currentCount}/${totalCount}`);
                    
                    // 检查无红暂停条件
                    if (CONFIG.pauseOnNoRed && firstRedOccurred) {
                        const timesDiff = currentQuenchTimes - lastRedQuenchTimes;
                        if (timesDiff >= CONFIG.noRedInterval) {
                            addLog(`${CONFIG.noRedInterval}次洗练未出现红色属性，暂停洗练!`, 'warning');
                            pauseQuench('长时间未出现红色属性');
                            return false;
                        }
                    }
                    
                    // 检查限定洗练次数
                    if (CONFIG.stopOnLimit && CONFIG.limitQuenchTimes > 0 && currentQuenchTimes >= CONFIG.limitQuenchTimes) {
                        addLog(`已达到限定洗练次数${CONFIG.limitQuenchTimes}，停止洗练`, 'success');
                        stopQuench(`已达到限定洗练次数${CONFIG.limitQuenchTimes}`);
                        return false;
                    }
                    
                    // 直接进入下一次洗练（不等待）
                    currentStep = 'quench';
                    break;
                    
                default:
                    currentStep = 'idle';
                    break;
            }
            
            return true; // 继续洗练
        } catch (error) {
            console.error('洗练步骤出错:', error);
            addLog(`洗练出错: ${error.message}`, 'error');
            
            // 重试逻辑
            if (CONFIG.retryOnFail && retryCount < CONFIG.maxRetries) {
                retryCount++;
                addLog(`第${retryCount}次重试...`, 'warning');
                await delay(CONFIG.interval); // 使用洗练间隔
                currentStep = 'quench'; // 重置到洗练步骤
                return true;
            } else {
                pauseQuench(`洗练出错: ${error.message}`);
                retryCount = 0;
                return false;
            }
        }
    }
    
    // 手动洗练函数
    async function manualQuench() {
        if (!isGameLoaded()) {
            addLog('游戏未加载完成', 'error');
            return;
        }
        
        addLog(`开始手动洗练`, 'info');
        
        // 禁用手动洗练按钮防止重复点击
        const manualBtn = document.getElementById('xy-quench-manual-btn');
        if (manualBtn) manualBtn.disabled = true;
        
        try {
            // 重置流程状态
            currentStep = 'quench';
            skipNeeded = false;
            
            // 执行一次完整流程
            await executeQuenchStep();
        } finally {
            // 重新启用手动洗练按钮
            if (manualBtn) {
                setTimeout(() => {
                    manualBtn.disabled = false;
                }, 500);
            }
        }
    }
    
    // 暂停洗练函数
    async function pauseQuench(reason) {
        // 如果启用了自动切换部位且停止原因是自定义切换条件，不暂停洗练，直接切换部位
        if (CONFIG.autoSwitchPart && reason && reason.includes('自定义切换条件')) {
            addLog(`检测到自定义切换条件，准备切换部位（不暂停洗练）`, 'info');
            
            // 停止当前洗练循环
            if (quenchTimer && quenchTimer.stop) {
                quenchTimer.stop();
            }
            quenchTimer = null;
            
            isWorking = false;
            isPaused = false;
            currentStep = 'idle';
            
            // 直接切换部位
            await checkAndSwitchPart(reason);
            return;
        }
        
        // 正常暂停逻辑
        // 暂停洗练
        if (quenchTimer && quenchTimer.stop) {
            quenchTimer.stop();
        }
        quenchTimer = null;
        
        isWorking = false;
        isPaused = true;
        currentStep = 'idle';
        
        // 计算剩余次数
        remainingCount = totalCount - currentCount;
        
        const startBtn = document.getElementById('xy-quench-start-btn');
        const stopBtn = document.getElementById('xy-quench-stop-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '继续洗练';
        }
        if (stopBtn) stopBtn.disabled = false;
        
        updateStatus(`已暂停: ${currentCount}/${totalCount}`);
        addLog(`洗练已暂停! ${reason}`, 'warning');
        
        // 显示暂停原因
        showStopReason(reason);
    }
    
    // 显示暂停原因
    function showStopReason(reason) {
        let reasonDiv = document.getElementById('xy-quench-stop-reason');
        if (!reasonDiv) {
            reasonDiv = document.createElement('div');
            reasonDiv.id = 'xy-quench-stop-reason';
            document.body.appendChild(reasonDiv);
        }
        
        // 暂停：橙色/黄色渐变
        reasonDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            color: #fff;
            padding: 12px 20px;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-bottom: 2px solid #d35400;
        `;
        reasonDiv.textContent = reason;
        reasonDiv.style.display = 'block';
    }
    
    // 隐藏停止原因
    function hideStopReason() {
        const reasonDiv = document.getElementById('xy-quench-stop-reason');
        if (reasonDiv) {
            reasonDiv.style.display = 'none';
        }
    }
    
    // 停止洗练函数
    async function stopQuench(reason = '') {
        // 停止洗练
        if (quenchTimer && quenchTimer.stop) {
            quenchTimer.stop();
        }
        quenchTimer = null;
        
        isWorking = false;
        isPaused = false;
        currentStep = 'idle';
        skipNeeded = false;
        
        // 停止时隐藏暂停原因
        hideStopReason();
        
        const startBtn = document.getElementById('xy-quench-start-btn');
        const stopBtn = document.getElementById('xy-quench-stop-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '开始洗练';
        }
        if (stopBtn) stopBtn.disabled = true;
        
        updateStatus(`已停止: ${currentCount}/${totalCount}`);
        addLog(`洗练已停止! 完成${currentCount}次，红色属性${redAttrCount}次`, 'info');
    }
    
    // 导出日志函数
    function exportLogs() {
        if (allLogs.length === 0) {
            addLog('没有日志可导出', 'warning');
            return;
        }
        
        // 获取当前配置信息
        const heroName = HEROES[CONFIG.heroId] ? HEROES[CONFIG.heroId].name : `未知英雄(ID:${CONFIG.heroId})`;
        const partName = PARTS.find(p => p.value == CONFIG.part) ? PARTS.find(p => p.value == CONFIG.part).text : `未知部位(${CONFIG.part})`;
        
        // 生成日志内容
        let logContent = '='.repeat(60) + '\n';
        logContent += '洗练助手日志导出\n';
        logContent += '='.repeat(60) + '\n';
        logContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
        logContent += `英雄: ${heroName}\n`;
        logContent += `部位: ${partName}\n`;
        logContent += `洗练次数: ${currentCount}/${totalCount}\n`;
        logContent += `红色属性次数: ${redAttrCount}\n`;
        logContent += `当前quenchTimes: ${currentQuenchTimes}\n`;
        logContent += `最后红色quenchTimes: ${lastRedQuenchTimes}\n`;
        logContent += '='.repeat(60) + '\n\n';
        
        // 添加日志条目（从旧到新）
        logContent += '日志记录:\n';
        logContent += '-'.repeat(60) + '\n';
        for (const log of allLogs) {
            const redMark = log.isRed ? '[红色]' : '';
            const typeMark = log.type === 'error' ? '[错误]' : 
                           log.type === 'warning' ? '[警告]' : 
                           log.type === 'success' ? '[成功]' : '';
            logContent += `[${log.time}] ${typeMark} ${redMark} ${log.msg}\n`;
        }
        
        // 创建下载链接
        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `洗练日志_${heroName}_${partName}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.txt`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog(`日志已导出: ${fileName} (共${allLogs.length}条)`, 'success');
    }
    
    // 开始洗练函数
    async function startQuench() {
        // 隐藏停止原因
        hideStopReason();
        
        // 如果是暂停状态，恢复洗练
        if (isPaused) {
            if (quenchTimer) {
                addLog('洗练正在进行中!', 'warning');
                return;
            }
            
            isWorking = true;
            isPaused = false;
            currentStep = 'quench';
            
            const startBtn = document.getElementById('xy-quench-start-btn');
            const stopBtn = document.getElementById('xy-quench-stop-btn');
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = '开始洗练';
            }
            if (stopBtn) stopBtn.disabled = false;
            
            updateStatus('洗练中...');
            addLog(`继续洗练，剩余次数: ${remainingCount}`, 'success');
            
            // 使用剩余次数继续
            totalCount = currentCount + remainingCount;
            remainingCount = 0;
            
            // 重新开始计时器（使用递归方式）
            const interval = CONFIG.interval;
            
            let currentTimeoutId = null;
            async function runQuenchLoop() {
                if (!isWorking) {
                    currentTimeoutId = null;
                    return;
                }
                
                const shouldContinue = await executeQuenchStep();
                if (!shouldContinue) {
                    currentTimeoutId = null;
                    stopQuench('洗练流程中断');
                    return;
                }
                
                // 等待间隔后执行下一次
                if (isWorking) {
                    currentTimeoutId = setTimeout(runQuenchLoop, interval);
                }
            }
            
            // 保存timeout ID以便停止
            quenchTimer = { timeoutId: null, stop: function() { 
                if (currentTimeoutId) {
                    clearTimeout(currentTimeoutId);
                    currentTimeoutId = null;
                }
            }};
            
            // 立即开始第一次执行
            runQuenchLoop();
            
            return;
        }
        
        // 正常开始洗练
        if (quenchTimer) {
            addLog('洗练正在进行中!', 'warning');
            return;
        }
        if (!isGameLoaded()) {
            addLog('游戏未加载完成', 'error');
            return;
        }
        
        // 检查位置设置
        if (!CONFIG.quenchBtnPos) {
            addLog('请先设置洗练按钮位置!', 'error');
            return;
        }

        const interval = CONFIG.interval;
        totalCount = CONFIG.count;

        // 重置状态
        currentCount = 0;
        lastRedQuenchTimes = 0;
        redAttrCount = 0;
        currentQuenchTimes = 0;
        firstRedOccurred = false;
        remainingCount = 0;
        retryCount = 0;
        firstQuenchRetryCount = 0;
        currentStep = 'idle';
        skipNeeded = false;
        
        // 如果启用了自动切换部位，重置部位完成状态
        if (CONFIG.autoSwitchPart) {
            completedParts.clear();
            allPartsCompleted = false;
            addLog('已重置部位完成状态，开始新的洗练流程', 'info');
        }

        if (interval < 200 || interval > 5000) {
            addLog('间隔时间必须在200-5000ms之间!', 'error');
            return;
        }

        if (totalCount < 1 || totalCount > 400000) {
            addLog('洗练次数必须在1-400000之间!', 'error');
            return;
        }

        if (CONFIG.redAttrInterval < 1 || CONFIG.redAttrInterval > 100) {
            addLog('红色属性间隔必须在1-100之间!', 'error');
            return;
        }

        if (CONFIG.noRedInterval < 1 || CONFIG.noRedInterval > 1000) {
            addLog('无红暂停间隔必须在1-1000之间!', 'error');
            return;
        }

        // 获取当前游戏状态
        const gameState = getGameCurrentState();
        addLog(`开始洗练，次数: ${totalCount}，洗练间隔: ${interval}ms，结果解析: 200ms，总间隔: 400ms`, 'success');
        addLog(`当前英雄ID: ${gameState.heroId}，部位: ${gameState.part}`, 'info');
        
        // 检查开始洗练时当前是否为红色属性
        // 根据日志，开始洗练时可能无法立即获取数据，需要等待一下
        try {
            // 等待一小段时间，确保quench结果可用
            await delay(100);
            const initialEquipmentData = await getQuenchResult();
            if (initialEquipmentData && initialEquipmentData.quenches) {
                const currentQuenches = initialEquipmentData.quenches || {};
                let hasInitialRed = false;
                for (const slot in currentQuenches) {
                    const quench = currentQuenches[slot];
                    if (quench && quench.colorId === 6) {
                        hasInitialRed = true;
                        break;
                    }
                }
                if (hasInitialRed) {
                    // 如果开始洗练时当前是红色属性，记录当前的quenchTimes作为基准
                    const initialQuenchTimes = initialEquipmentData.quenchTimes || 0;
                    if (initialQuenchTimes > 0) {
                        lastRedQuenchTimes = initialQuenchTimes;
                        firstRedOccurred = true;
                        addLog(`开始洗练时当前为红色属性，quenchTimes=${initialQuenchTimes}，已记录为基准`, 'info', true);
                    } else {
                        addLog(`开始洗练时当前为红色属性`, 'info', true);
                    }
                } else {
                    addLog(`开始洗练时当前非红色属性`, 'info', false);
                }
            }
        } catch (error) {
            // 如果获取失败，不阻止洗练开始，只记录警告
            addLog(`检查初始红色属性状态失败: ${error.message}，将继续洗练`, 'warning');
        }

        isWorking = true;
        const startBtn = document.getElementById('xy-quench-start-btn');
        const stopBtn = document.getElementById('xy-quench-stop-btn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = '开始洗练';
        }
        if (stopBtn) stopBtn.disabled = false;

        // 执行洗练（使用递归方式，确保上一次执行完成后再执行下一次）
        let currentTimeoutId = null;
        async function runQuenchLoop() {
            if (!isWorking) {
                currentTimeoutId = null;
                return;
            }
            
            const shouldContinue = await executeQuenchStep();
            if (!shouldContinue) {
                currentTimeoutId = null;
                stopQuench('洗练流程中断');
                return;
            }
            
            // 等待间隔后执行下一次
            if (isWorking) {
                currentTimeoutId = setTimeout(runQuenchLoop, interval);
            }
        }
        
        // 保存timeout ID以便停止
        quenchTimer = { timeoutId: null, stop: function() { 
            if (currentTimeoutId) {
                clearTimeout(currentTimeoutId);
                currentTimeoutId = null;
            }
        }};
        
        // 立即开始第一次执行
        runQuenchLoop();
    }
    
    // 拖动功能 - 只在最小化状态下可拖动
    function setupDragEvents() {
        const ui = document.getElementById('xy-quench-helper');
        if (!ui) return;

        // 移除所有现有的事件监听器
        ui.removeEventListener('mousedown', startDrag);
        
        // 只在最小化状态下可拖动
        if (isMinimized) {
            ui.addEventListener('mousedown', startDrag);
        }

        function startDrag(e) {
            // 最小化状态下才允许拖动
            if (!isMinimized) return;
            
            // 阻止点击事件触发（避免拖动时触发还原）
            e.stopPropagation();
            e.preventDefault();
            
            isDragging = true;
            const rect = ui.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        }
        
        function onDrag(e) {
            if (!isDragging || !isMinimized) return;
            e.preventDefault();
            e.stopPropagation();
            ui.style.left = `${e.clientX - dragOffset.x}px`;
            ui.style.top = `${e.clientY - dragOffset.y}px`;
            ui.style.transform = 'none';
            ui.style.right = 'auto';
            ui.style.bottom = 'auto';
            // 如果UI不是最小化状态，保持bottom定位
            if (!isMinimized) {
                const rect = ui.getBoundingClientRect();
                const bottom = window.innerHeight - rect.bottom;
                ui.style.top = 'auto';
                ui.style.bottom = `${bottom}px`;
            }
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }
    
    // 位置选择功能（UI变透明）
    function startPositionSelection(forWhat) {
        if (isSelectingPosition) {
            stopPositionSelection();
            return;
        }
        
        isSelectingPosition = true;
        selectingFor = forWhat;
        
        // 让UI变透明
        const ui = document.getElementById('xy-quench-helper');
        if (ui) {
            ui.style.opacity = '0.1';
            ui.style.pointerEvents = 'none';
        }
        
        // 创建覆盖层
        const overlay = document.createElement('div');
        overlay.id = 'xy-quench-position-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.3);
            z-index: 99999;
            cursor: crosshair;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        `;
        
        const text = forWhat === 'quench' ? '点击选择洗练按钮位置' : '点击选择跳过按钮位置';
        overlay.innerHTML = `
            <div style="text-align: center; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
                <div>${text}</div>
                <div style="font-size: 14px; margin-top: 10px; color: #ccc;">点击任意位置选择，右键取消</div>
            </div>
        `;
        
        // 点击事件
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const x = e.clientX;
            const y = e.clientY;
            
            if (selectingFor === 'quench') {
                CONFIG.quenchBtnPos = { x, y };
                addLog(`洗练按钮位置已记录: (${x}, ${y})`, 'success');
                updatePositionDisplay('quench');
            } else {
                CONFIG.skipBtnPos = { x, y };
                addLog(`跳过按钮位置已记录: (${x}, ${y})`, 'success');
                updatePositionDisplay('skip');
            }
            
            saveConfig();
            stopPositionSelection();
        });
        
        // 右键取消
        overlay.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addLog('位置选择已取消', 'info');
            stopPositionSelection();
            return false;
        });
        
        document.body.appendChild(overlay);
        
        // 更新状态
        addLog(`开始选择${forWhat === 'quench' ? '洗练' : '跳过'}按钮位置`, 'info');
    }
    
    function stopPositionSelection() {
        isSelectingPosition = false;
        selectingFor = '';
        
        // 恢复UI不透明
        const ui = document.getElementById('xy-quench-helper');
        if (ui) {
            ui.style.opacity = '';
            ui.style.pointerEvents = '';
        }
        
        const overlay = document.getElementById('xy-quench-position-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    function updatePositionDisplay(type) {
        const quenchPosDisplay = document.getElementById('xy-quench-pos-display');
        const skipPosDisplay = document.getElementById('xy-quench-skip-pos-display');
        
        if (type === 'quench' && quenchPosDisplay && CONFIG.quenchBtnPos) {
            quenchPosDisplay.textContent = `(${CONFIG.quenchBtnPos.x}, ${CONFIG.quenchBtnPos.y})`;
        }
        
        if (type === 'skip' && skipPosDisplay && CONFIG.skipBtnPos) {
            skipPosDisplay.textContent = `(${CONFIG.skipBtnPos.x}, ${CONFIG.skipBtnPos.y})`;
        }
    }
    
    // 更新英雄和部位显示
    function updateHeroPartDisplay() {
        const heroSelect = document.getElementById('xy-quench-hero-select');
        const partRadios = document.querySelectorAll('input[name="xy-quench-part"]');
        const currentDisplay = document.getElementById('xy-quench-current-hero-part');
        
        if (heroSelect) {
            heroSelect.value = CONFIG.heroId || 107;
        }
        
        // 更新部位单选按钮
        if (partRadios && partRadios.length > 0) {
            partRadios.forEach(radio => {
                const partValue = parseInt(radio.value);
                const isChecked = (CONFIG.part || 1) == partValue;
                radio.checked = isChecked;
                
                // 更新样式
                const label = radio.parentElement;
                if (label) {
                    if (isChecked) {
                        label.style.background = '#3498db';
                        label.style.borderColor = '#2980b9';
                    } else {
                        label.style.background = '#2c3e50';
                        label.style.borderColor = '#34495e';
                    }
                }
            });
        }
        
        if (currentDisplay) {
            const hero = HEROES[CONFIG.heroId];
            const part = PARTS.find(p => p.value == CONFIG.part);
            currentDisplay.textContent = `当前: ${hero ? hero.name : '未知'} - ${part ? part.text : '未知'}`;
        }
    }
    
    // 创建属性选择器
    function createAttributeSelector(prefix = '') {
        // 将属性分成3列，每列7个
        const columns = [[], [], []];
        ATTRIBUTES.forEach((attr, index) => {
            columns[index % 3].push(attr);
        });
        
        const attrPrefix = prefix ? `${prefix}-` : '';
        
        return `
            <div style="margin-bottom:10px;">
                <div style="margin-bottom:3px; color:#ecf0f1; font-size:11px;">选择属性:</div>
                <div style="display:flex; gap:6px;">
                    ${columns.map(column => `
                        <div style="flex:1; display:flex; flex-direction:column; gap:3px;">
                            ${column.map(attr => `
                                <label class="xy-quench-attr-checkbox ${attrPrefix}attr-checkbox" style="display:flex; align-items:center; gap:3px; cursor:pointer; font-size:10px;">
                                    <input type="checkbox" data-attr="${attr.id}" style="cursor:pointer; width:12px; height:12px;">
                                    <span>${attr.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 创建颜色选择器
    function createColorSelector(prefix = '') {
        const colorPrefix = prefix ? `${prefix}-` : '';
        
        return `
            <div style="margin-bottom:10px;">
                <div style="margin-bottom:3px; color:#ecf0f1; font-size:11px;">选择颜色:</div>
                <div style="display:flex; gap:10px;">
                    ${COLORS.slice(4).map(color => ` <!-- 只显示橙色、红色 -->
                        <label class="xy-quench-color-checkbox ${colorPrefix}color-checkbox" style="display:flex; align-items:center; gap:3px; cursor:pointer; font-size:10px;">
                            <input type="checkbox" data-color="${color.id}" style="cursor:pointer; width:12px; height:12px;">
                            <span>${color.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 创建完整的UI内容
    function createUIContent() {
        return `
            <!-- 头部 -->
            <div id="xy-quench-header" style="background:#2980b9; padding:6px 12px; border-radius:6px 6px 0 0; font-weight:bold; display:flex; align-items:center; justify-content:space-between; cursor:default; user-select:none; font-size:12px;">
                <span>⚔️ 洗练助手 v3.3.0</span>
                <div style="display:flex; gap:4px;">
                    <button class="xy-quench-minimize" style="background:rgba(255,255,255,0.2); border:none; color:#fff; width:20px; height:20px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px;">−</button>
                </div>
            </div>

            <!-- 主内容区 - 添加滚动条 -->
            <div id="xy-quench-content" style="flex:1; flex-direction:column; padding:12px; overflow-y:auto; font-size:11px;">
                <!-- 位置设置区域 -->
                <div style="background:#34495e; border-radius:6px; padding:12px; margin-bottom:10px;">
                    <div style="font-weight:bold; color:#3498db; text-align:center; margin-bottom:10px; font-size:12px;">位置设置</div>
                    
                    <!-- 洗练按钮位置（一行显示） -->
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                        <span style="color:#ecf0f1; font-size:11px; flex-shrink:0;">洗练按钮位置:</span>
                        <button id="xy-quench-select-quench" style="padding:4px 8px; border:none; border-radius:3px; background:#3498db; color:#fff; cursor:pointer; font-size:10px; flex-shrink:0;">
                            选择位置
                        </button>
                        <div id="xy-quench-pos-display" style="flex:1; padding:6px; background:#2c3e50; border-radius:3px; font-size:10px; text-align:center;">
                            ${CONFIG.quenchBtnPos ? `(${CONFIG.quenchBtnPos.x}, ${CONFIG.quenchBtnPos.y})` : '未设置'}
                        </div>
                    </div>
                    
                    <!-- 跳过按钮位置（一行显示） -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:#ecf0f1; font-size:11px; flex-shrink:0;">跳过按钮位置:</span>
                        <button id="xy-quench-select-skip" style="padding:4px 8px; border:none; border-radius:3px; background:#f39c12; color:#fff; cursor:pointer; font-size:10px; flex-shrink:0;">
                            选择位置
                        </button>
                        <div id="xy-quench-skip-pos-display" style="flex:1; padding:6px; background:#2c3e50; border-radius:3px; font-size:10px; text-align:center;">
                            ${CONFIG.skipBtnPos ? `(${CONFIG.skipBtnPos.x}, ${CONFIG.skipBtnPos.y})` : '未设置'}
                        </div>
                    </div>
                </div>
                
                <!-- 英雄和部位选择区域 -->
                <div style="background:#34495e; border-radius:6px; padding:12px; margin-bottom:10px;">
                    <div style="font-weight:bold; color:#3498db; text-align:center; margin-bottom:10px; font-size:12px;">英雄和部位设置</div>
                    
                    <!-- 英雄选择 -->
                    <div style="margin-bottom:10px;">
                        <div style="margin-bottom:3px; color:#ecf0f1; font-size:11px;">选择英雄:</div>
                        <select id="xy-quench-hero-select" style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #3498db; border-radius:3px; font-size:11px;">
                            ${Object.keys(HEROES).map(heroId => {
                                const hero = HEROES[heroId];
                                const heroIdNum = parseInt(heroId);
                                return `<option value="${heroIdNum}" ${(CONFIG.heroId || 107) == heroIdNum ? 'selected' : ''}>${hero.name} (${hero.type})</option>`;
                            }).join('')}
                        </select>
                    </div>
                    
                    <!-- 部位选择（四选一） -->
                    <div style="margin-bottom:10px;">
                        <div style="margin-bottom:5px; color:#ecf0f1; font-size:11px;">选择部位:</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                            ${PARTS.map(part => {
                                const isChecked = (CONFIG.part || 1) == part.value;
                                const bgColor = isChecked ? '#3498db' : '#2c3e50';
                                const borderColor = isChecked ? '#2980b9' : '#34495e';
                                const checkedAttr = isChecked ? 'checked' : '';
                                return '<label class="xy-quench-part-label" data-part="' + part.value + '" style="display:flex; align-items:center; gap:5px; padding:6px; background:' + bgColor + '; border:1px solid ' + borderColor + '; border-radius:3px; cursor:pointer; font-size:11px; transition:all 0.2s;"><input type="radio" name="xy-quench-part" value="' + part.value + '" ' + checkedAttr + ' style="cursor:pointer; width:14px; height:14px;"><span style="color:#ecf0f1;">' + part.text + '</span></label>';
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- 当前设置显示 -->
                    <div id="xy-quench-current-hero-part" style="padding:6px; background:#2c3e50; border-radius:3px; font-size:10px; text-align:center; color:#ecf0f1;">
                        当前: ${HEROES[CONFIG.heroId] ? HEROES[CONFIG.heroId].name : '未知'} - ${PARTS.find(p => p.value == CONFIG.part) ? PARTS.find(p => p.value == CONFIG.part).text : '未知'}
                    </div>
                </div>
                
                <!-- 控制区域 -->
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <button id="xy-quench-start-btn" style="flex:1; padding:8px; border:none; border-radius:4px; background:#27ae60; color:#fff; cursor:pointer; font-weight:bold; font-size:12px;">开始洗练</button>
                    <button id="xy-quench-stop-btn" style="flex:1; padding:8px; border:none; border-radius:4px; background:#e74c3c; color:#fff; cursor:pointer; font-weight:bold; font-size:12px;" disabled>停止洗练</button>
                    <button id="xy-quench-export-btn" style="flex:1; padding:8px; border:none; border-radius:4px; background:#3498db; color:#fff; cursor:pointer; font-weight:bold; font-size:12px;">导出日志</button>
                </div>
                
                <!-- 洗练设置区域 -->
                <div style="background:#34495e; border-radius:6px; padding:12px; margin-bottom:10px;">
                    <div style="font-weight:bold; color:#3498db; text-align:center; margin-bottom:10px; font-size:12px;">洗练设置</div>
                    
                    <!-- 洗练间隔和次数 -->
                    <div style="display:flex; gap:8px; margin-bottom:10px;">
                        <!-- 洗练间隔 -->
                        <div style="flex:1;">
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">洗练间隔(ms):</div>
                            <input type="number" id="xy-quench-interval" value="${CONFIG.interval}" min="200" max="5000" 
                                   style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #3498db; border-radius:3px; font-size:11px;">
                        </div>
                        
                        <!-- 洗练次数 -->
                        <div style="flex:1;">
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">洗练次数:</div>
                            <input type="number" id="xy-quench-count" value="${CONFIG.count}" min="1" max="400000" 
                                   style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #3498db; border-radius:3px; font-size:11px;">
                        </div>
                    </div>
                    
                    <!-- 红色属性间隔和无红暂停间隔 -->
                    <div style="display:flex; gap:8px; margin-bottom:10px;">
                        <!-- 红色属性检测 -->
                        <div style="flex:1;">
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">红色属性间隔限制(次数):</div>
                            <input type="number" id="xy-quench-red-interval" value="${CONFIG.redAttrInterval}" min="1" max="100" 
                                   style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #e74c3c; border-radius:3px; font-size:11px;">
                        </div>
                        
                        <!-- 无红暂停间隔 -->
                        <div style="flex:1;">
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">无红暂停间隔(次数):</div>
                            <input type="number" id="xy-quench-no-red-interval" value="${CONFIG.noRedInterval}" min="1" max="1000" 
                                   style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #f39c12; border-radius:3px; font-size:11px;">
                        </div>
                    </div>
                    
                    <!-- 限定洗练次数 -->
                    <div style="margin-bottom:10px;">
                        <div>
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">限定洗练次数:</div>
                            <input type="number" id="xy-quench-limit-times" value="${CONFIG.limitQuenchTimes}" min="0" max="999999" 
                                   style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #9b59b6; border-radius:3px; font-size:11px;">
                        </div>
                    </div>
                    
                    <!-- 跳过检查延迟 -->
                    <div style="margin-bottom:10px;">
                        <div>
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">跳过检查延迟(ms):</div>
                            <input type="number" id="xy-quench-skip-delay" value="${CONFIG.skipCheckDelay}" min="100" max="2000" 
                                   style="width:100%; padding:6px; background:#2c3e50; color:#ecf0f1; border:1px solid #f39c12; border-radius:3px; font-size:11px;">
                        </div>
                    </div>
                    
                    <!-- 各种开关 -->
                    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                        <!-- 红色攻击暂停 -->
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; min-width:120px;">
                            <input type="checkbox" id="xy-quench-pause-red-attack" ${CONFIG.pauseOnRedAttack ? 'checked' : ''} 
                                   style="cursor:pointer; width:12px; height:12px;">
                            <span style="color:#ecf0f1;">红色攻击暂停</span>
                        </label>
                        
                        <!-- 连续出红暂停 -->
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; min-width:120px;">
                            <input type="checkbox" id="xy-quench-pause-consecutive-red" ${CONFIG.pauseOnConsecutiveRed ? 'checked' : ''} 
                                   style="cursor:pointer; width:12px; height:12px;">
                            <span style="color:#ecf0f1;">连续出红暂停</span>
                        </label>
                        
                        <!-- 无红暂停 -->
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; min-width:100px;">
                            <input type="checkbox" id="xy-quench-pause-no-red" ${CONFIG.pauseOnNoRed ? 'checked' : ''} 
                                   style="cursor:pointer; width:12px; height:12px;">
                            <span style="color:#ecf0f1;">无红暂停</span>
                        </label>
                        
                        <!-- 限定次数停止 -->
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; min-width:120px;">
                            <input type="checkbox" id="xy-quench-stop-on-limit" ${CONFIG.stopOnLimit ? 'checked' : ''} 
                                   style="cursor:pointer; width:12px; height:12px;">
                            <span style="color:#ecf0f1;">限定次数停止</span>
                        </label>
                        
                        <!-- 自动跳过红橙 -->
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; min-width:120px;">
                            <input type="checkbox" id="xy-quench-auto-skip" ${CONFIG.autoSkipRedOrange ? 'checked' : ''} 
                                   style="cursor:pointer; width:12px; height:12px;">
                            <span style="color:#ecf0f1;">自动跳过红橙</span>
                        </label>
                        
                        <!-- 自动切换部位 -->
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:10px; min-width:120px;">
                            <input type="checkbox" id="xy-quench-auto-switch-part" ${CONFIG.autoSwitchPart ? 'checked' : ''} 
                                   style="cursor:pointer; width:12px; height:12px;">
                            <span style="color:#ecf0f1;">自动切换部位</span>
                        </label>
                    </div>
                </div>

                <!-- 自定义暂停条件 - 可折叠 -->
                <div style="background:#34495e; border-radius:6px; padding:0; margin-bottom:10px; overflow:hidden;">
                    <div id="xy-quench-custom-header" style="padding:10px; background:#f39c12; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <div style="font-weight:bold; color:#fff; font-size:12px;">自定义暂停条件</div>
                        <div id="xy-quench-custom-toggle" style="color:#fff; font-size:16px; user-select:none;">${customConditionsCollapsed ? '+' : '-'}</div>
                    </div>
                    <div id="xy-quench-custom-content" style="padding:12px; display:${customConditionsCollapsed ? 'none' : 'block'};">
                        ${createAttributeSelector()}
                        ${createColorSelector()}
                        
                        <!-- 添加条件按钮 -->
                        <div style="margin-bottom:10px;">
                            <button id="xy-quench-add-condition" style="width:100%; padding:6px; border:none; border-radius:3px; background:#f39c12; color:#fff; cursor:pointer; font-weight:bold; font-size:11px;">
                                添加暂停条件
                            </button>
                        </div>
                        
                        <!-- 已添加条件显示 -->
                        <div style="margin-bottom:8px;">
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">已添加条件:</div>
                            <div id="xy-quench-custom-conditions" style="min-height:60px; max-height:80px; overflow-y:auto; background:#2c3e50; border-radius:3px; padding:6px;"></div>
                        </div>
                        
                        <!-- 清空条件按钮 -->
                        <div>
                            <button id="xy-quench-clear-conditions" style="width:100%; padding:5px; border:none; border-radius:3px; background:#e74c3c; color:#fff; cursor:pointer; font-size:10px;">
                                清空所有条件
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 自定义切换条件 - 可折叠 -->
                <div style="background:#34495e; border-radius:6px; padding:0; margin-bottom:10px; overflow:hidden;">
                    <div id="xy-quench-custom-switch-header" style="padding:10px; background:#27ae60; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <div style="font-weight:bold; color:#fff; font-size:12px;">自定义切换条件</div>
                        <div id="xy-quench-custom-switch-toggle" style="color:#fff; font-size:16px; user-select:none;">${customSwitchConditionsCollapsed ? '+' : '-'}</div>
                    </div>
                    <div id="xy-quench-custom-switch-content" style="padding:12px; display:${customSwitchConditionsCollapsed ? 'none' : 'block'};">
                        ${createAttributeSelector('switch')}
                        ${createColorSelector('switch')}
                        
                        <!-- 添加条件按钮 -->
                        <div style="margin-bottom:10px;">
                            <button id="xy-quench-add-switch-condition" style="width:100%; padding:6px; border:none; border-radius:3px; background:#27ae60; color:#fff; cursor:pointer; font-weight:bold; font-size:11px;">
                                添加切换条件
                            </button>
                        </div>
                        
                        <!-- 已添加条件显示 -->
                        <div style="margin-bottom:8px;">
                            <div style="margin-bottom:3px; color:#ecf0f1; font-size:10px;">已添加条件:</div>
                            <div id="xy-quench-custom-switch-conditions" style="min-height:60px; max-height:120px; overflow-y:auto; background:#2c3e50; border-radius:3px; padding:6px;"></div>
                        </div>
                        
                        <!-- 清空条件按钮 -->
                        <div>
                            <button id="xy-quench-clear-switch-conditions" style="width:100%; padding:5px; border:none; border-radius:3px; background:#e74c3c; color:#fff; cursor:pointer; font-size:10px;">
                                清空所有条件
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 手动洗练区域 -->
                <div style="margin-bottom:10px;">
                    <button id="xy-quench-manual-btn" style="width:100%; padding:8px; border:none; border-radius:4px; background:#3498db; color:#fff; cursor:pointer; font-weight:bold; font-size:12px;">手动洗练一次</button>
                </div>
                
                <!-- 状态显示 -->
                <div id="xy-quench-status" style="padding:8px; background:#2c3e50; border-radius:4px; text-align:center; margin-bottom:10px; font-size:12px;">就绪</div>

                <!-- 日志区域 -->
                <div style="height:120px; background:#1a2530; border-radius:6px; display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:#2c3e50; font-weight:bold; font-size:11px;">
                        <span style="color:#3498db;">操作日志</span>
                        <button id="xy-quench-clear-logs" style="background:#e74c3c; border:none; color:#fff; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:10px;">清空</button>
                    </div>
                    <div id="xy-quench-log-container" style="flex:1; overflow-y:auto; padding:6px; line-height:1.3; font-size:10px;"></div>
                </div>
            </div>
        `;
    }
    
    // 最小化/还原切换
    function toggleMinimize() {
        const ui = document.getElementById('xy-quench-helper');
        if (!ui) return;

        isMinimized = !isMinimized;
        
        if (isMinimized) {
            // 最小化状态：圆形⚔️图标
            ui.innerHTML = '';
            ui.classList.add('minimized');
            
            // 设置圆形样式
            ui.style.cssText = `
                position: fixed;
                top: 5%;
                left: 80%;
                width: 40px;
                height: 40px;
                background: #2980b9;
                border: 2px solid #1f618d;
                border-radius: 50%;
                cursor: move;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
            
            // 重新设置拖动事件
            setupDragEvents();
            
            // 最小化时，保存当前DOM中的日志到缓存（不记录最小化操作本身）
            const container = document.getElementById('xy-quench-log-container');
            if (container && container.children.length > 0) {
                // 将当前DOM中的日志保存到缓存（保留在minimizedLogs前面）
                const existingLogs = [];
                for (let i = container.children.length - 1; i >= 0; i--) {
                    const logEntry = container.children[i];
                    const timeSpan = logEntry.querySelector('.log-time');
                    const msgSpan = logEntry.querySelector('.log-msg');
                    const logType = logEntry.className.match(/log-(\w+)/) ? logEntry.className.match(/log-(\w+)/)[1] : 'info';
                    if (timeSpan && msgSpan) {
                        existingLogs.unshift({
                            time: timeSpan.textContent.replace(/[\[\]]/g, ''),
                            msg: msgSpan.textContent,
                            type: logType
                        });
                    }
                }
                // 将现有日志添加到缓存前面（保留顺序）
                minimizedLogs = [...existingLogs, ...minimizedLogs];
                // 限制总缓存数量
                if (minimizedLogs.length > 50) {
                    minimizedLogs = minimizedLogs.slice(-50);
                }
            }
        } else {
            // 还原状态：长方形UI
            ui.classList.remove('minimized');
            
            // 最大化后UI设为上下各5%边距，宽度和高度90%
            ui.style.cssText = `
                position: fixed; 
                top: 5%;
                bottom: 5%;
                left: 5%; 
                width: 90%; 
                height: auto;
                min-height: 400px;
                background: #2c3e50; 
                border: 2px solid #2980b9; 
                border-radius: 8px;
                color: #fff; 
                font-family: Arial, sans-serif; 
                z-index: 10000; 
                box-shadow: 0 8px 30px rgba(0,0,0,0.5);
                display: flex; 
                flex-direction: column; 
                overflow: hidden; 
                font-size: 12px;
            `;
            
            // 重新创建UI内容
            ui.innerHTML = createUIContent();
            
            // 确保UI尺寸正确（使用!important覆盖可能的样式冲突）
            ui.style.setProperty('top', '5%', 'important');
            ui.style.setProperty('bottom', '5%', 'important');
            ui.style.setProperty('left', '5%', 'important');
            ui.style.setProperty('width', '90%', 'important');
            ui.style.setProperty('height', 'auto', 'important');
            ui.style.setProperty('max-height', 'none', 'important');
            
            // 重新绑定事件和更新显示
            setupEvents();
            updateCustomConditionsDisplay();
            updateCustomSwitchConditionsDisplay();
            updatePositionDisplay('quench');
            updatePositionDisplay('skip');
            updateHeroPartDisplay();
            
            // 根据当前状态恢复按钮状态
            const startBtn = document.getElementById('xy-quench-start-btn');
            const stopBtn = document.getElementById('xy-quench-stop-btn');
            if (startBtn && stopBtn) {
                if (isWorking) {
                    // 正在工作中
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                    if (isPaused) {
                        startBtn.textContent = '继续洗练';
                    } else {
                        startBtn.textContent = '开始洗练';
                    }
                } else {
                    // 未工作
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                    startBtn.textContent = '开始洗练';
                }
            }
            
            // 还原时，将缓存的日志添加到操作日志中（不记录还原操作本身）
            if (minimizedLogs.length > 0) {
                const container = document.getElementById('xy-quench-log-container');
                if (container) {
                    // 按时间顺序添加（最早的在前）
                    minimizedLogs.forEach(logData => {
                        const logEntry = document.createElement('div');
                        logEntry.className = `log-entry log-${logData.type}`;
                        logEntry.innerHTML = `
                            <span class="log-time">[${logData.time}]</span>
                            <span class="log-msg">${logData.msg}</span>
                        `;
                        container.insertBefore(logEntry, container.firstChild);
                    });
                    
                    // 限制日志数量
                    while (container.children.length > 50) {
                        container.removeChild(container.lastChild);
                    }
                }
                minimizedLogs = []; // 清空缓存
            }
            addLog(`当前配置: ${HEROES[CONFIG.heroId] ? HEROES[CONFIG.heroId].name : '未知英雄'} - ${PARTS.find(p => p.value == CONFIG.part) ? PARTS.find(p => p.value == CONFIG.part).text : '未知部位'}`, 'info');
        }
        setupDragEvents();
    }
    
    // 创建UI
    function createQuenchUI() {
        const oldUI = document.getElementById('xy-quench-helper');
        if (oldUI) oldUI.remove();

        try {
            // 在创建UI内容之前先加载配置，确保默认值正确
            loadConfig();
            
            // 主容器
            const ui = document.createElement('div');
            ui.id = 'xy-quench-helper';
            
            // 初始为最小化状态
            if (isMinimized) {
                ui.className = 'minimized';
                ui.style.cssText = `
                    position: fixed;
                    top: 5%;
                    left: 80%;
                    width: 40px;
                    height: 40px;
                    background: #2980b9;
                    border: 2px solid #1f618d;
                    border-radius: 50%;
                    cursor: move;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                `;
                // 最小化状态下内容为空
                ui.innerHTML = '';
            } else {
                // 最大化后UI设为上下各5%边距，宽度和高度90%
                ui.style.cssText = `
                    position: fixed; 
                    top: 5%;
                    bottom: 5%;
                    left: 5%; 
                    width: 90%; 
                    height: auto;
                    min-height: 400px;
                    background: #2c3e50; 
                    border: 2px solid #2980b9; 
                    border-radius: 8px;
                    color: #fff; 
                    font-family: Arial, sans-serif; 
                    z-index: 10000; 
                    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
                    display: flex; 
                    flex-direction: column; 
                    overflow: hidden; 
                    font-size: 12px;
                `;
                // 最大化状态下创建完整内容（此时配置已加载）
                ui.innerHTML = createUIContent();
            }

            // 样式补充
            const style = document.createElement('style');
            style.textContent = `
                /* 最小化圆形图标样式 */
                #xy-quench-helper.minimized {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: #2980b9 !important;
                    border-radius: 50% !important;
                    width: 40px !important;
                    height: 40px !important;
                    min-width: 40px !important;
                    min-height: 40px !important;
                    max-width: 40px !important;
                    max-height: 40px !important;
                    aspect-ratio: 1 / 1 !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                    cursor: move !important;
                    border: 2px solid #1f618d !important;
                    position: fixed !important;
                    top: 5% !important;
                    left: 80% !important;
                    z-index: 10000 !important;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
                }
                
                /* 使用伪元素显示⚔️图标 */
                #xy-quench-helper.minimized::before {
                    content: '⚔️' !important;
                    font-size: 20px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                    height: 100% !important;
                    line-height: 1 !important;
                }
                
                /* 移动设备特殊优化 */
                @media (max-width: 768px) {
                    #xy-quench-helper.minimized {
                        width: 40px !important;
                        height: 40px !important;
                        border-radius: 50% !important;
                    }
                    
                    #xy-quench-helper.minimized::before {
                        font-size: 20px !important;
                    }
                    
                    #xy-quench-helper:not(.minimized) {
                        position: fixed !important;
                        top: 5% !important;
                        bottom: 5% !important;
                        left: 5% !important;
                        width: 90% !important;
                        height: auto !important;
                        max-height: none !important;
                        min-height: 400px !important;
                    }
                }
                
                /* 按钮禁用样式 */
                #xy-quench-start-btn:disabled {
                    background: #7f8c8d !important;
                    cursor: not-allowed !important;
                }
                
                #xy-quench-stop-btn:disabled {
                    background: #7f8c8d !important;
                    cursor: not-allowed !important;
                }
                
                #xy-quench-manual-btn:disabled {
                    background: #7f8c8d !important;
                    cursor: not-allowed !important;
                }
                
                /* 输入框样式 */
                input[type="number"], input[type="text"] {
                    outline: none !important;
                }
                
                input[type="number"]:focus, input[type="text"]:focus {
                    border-color: #3498db !important;
                    box-shadow: 0 0 5px rgba(52, 152, 219, 0.5) !important;
                }
                
                /* 复选框样式 */
                input[type="checkbox"] {
                    accent-color: #3498db;
                }
                
                /* 单选按钮样式 */
                input[type="radio"] {
                    accent-color: #3498db;
                }
                
                /* 部位选择器标签悬停效果 */
                label.xy-quench-part-label:hover {
                    background: #34495e !important;
                    border-color: #3498db !important;
                }
                
                label.xy-quench-part-label:hover span {
                    color: #3498db !important;
                }
                
                /* 日志样式 */
                .log-entry { padding:3px 5px; margin:2px 0; border-radius:3px; display:flex; gap:6px; }
                .log-time { color:#95a5a6; min-width:55px; font-size:9px; }
                .log-msg { flex:1; word-break:break-word; font-size:10px; }
                .log-info .log-msg { color:#ecf0f1; }
                .log-success .log-msg { color:#2ecc71; }
                .log-warning .log-msg { color:#f39c12; }
                .log-error .log-msg { color:#e74c3c; }
                
                /* 滚动条样式 */
                #xy-quench-content::-webkit-scrollbar { width:8px; }
                #xy-quench-content::-webkit-scrollbar-track { background:#2c3e50; border-radius:4px; }
                #xy-quench-content::-webkit-scrollbar-thumb { background:#3498db; border-radius:4px; }
                #xy-quench-content::-webkit-scrollbar-thumb:hover { background:#2980b9; }
                
                #xy-quench-log-container::-webkit-scrollbar { width:5px; }
                #xy-quench-log-container::-webkit-scrollbar-track { background:#2c3e50; }
                #xy-quench-log-container::-webkit-scrollbar-thumb { background:#3498db; border-radius:3px; }
                
                #xy-quench-custom-conditions::-webkit-scrollbar { width:3px; }
                #xy-quench-custom-conditions::-webkit-scrollbar-track { background:#2c3e50; }
                #xy-quench-custom-conditions::-webkit-scrollbar-thumb { background:#f39c12; border-radius:3px; }
                
                #xy-quench-custom-switch-conditions::-webkit-scrollbar { width:3px; }
                #xy-quench-custom-switch-conditions::-webkit-scrollbar-track { background:#2c3e50; }
                #xy-quench-custom-switch-conditions::-webkit-scrollbar-thumb { background:#27ae60; border-radius:3px; }
            `;

            // 添加到页面
            document.head.appendChild(style);
            document.body.appendChild(ui);

            // 初始化事件绑定
            setupEvents();
            
            // 如果是最小化状态，设置拖动事件（必须在UI添加到DOM后）
            if (isMinimized) {
                setupDragEvents();
            } else {
                // 确保最大化时UI尺寸正确（使用!important覆盖可能的样式冲突）
                const uiEl = document.getElementById('xy-quench-helper');
                if (uiEl) {
                    uiEl.style.setProperty('top', '5%', 'important');
                    uiEl.style.setProperty('bottom', '5%', 'important');
                    uiEl.style.setProperty('left', '5%', 'important');
                    uiEl.style.setProperty('width', '90%', 'important');
                    uiEl.style.setProperty('height', 'auto', 'important');
                    uiEl.style.setProperty('max-height', 'none', 'important');
                }
            }

            // 初始状态设置和更新显示（配置已在函数开头加载）
            updateCustomConditionsDisplay();
            updateCustomSwitchConditionsDisplay();
            updatePositionDisplay('quench');
            updatePositionDisplay('skip');
            updateHeroPartDisplay();
            
            addLog('洗练助手 v3.3.0 加载完成', 'success');
            const hero = HEROES[CONFIG.heroId];
            const part = PARTS.find(p => p.value == CONFIG.part);
            addLog(`当前配置: ${hero ? hero.name : '未知英雄'} (ID:${CONFIG.heroId}) - ${part ? part.text : '未知部位'} (${CONFIG.part})`, 'info');
            console.log('✅ 洗练助手UI创建成功');
        } catch (e) {
            console.error('❌ 创建UI失败：', e);
        }
    }
    
    // 事件绑定
    function setupEvents() {
        // 最小化按钮
        const minBtn = document.querySelector('.xy-quench-minimize');
        if (minBtn) {
            minBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMinimize();
            });
        }

        // 最小化圆形点击还原（只在没有拖动的情况下）
        const ui = document.getElementById('xy-quench-helper');
        if (ui) {
            ui.addEventListener('click', (e) => {
                // 如果正在拖动，不触发还原
                if (isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                if (isMinimized && !e.target.classList.contains('xy-quench-minimize')) {
                    toggleMinimize();
                }
            });
        }

        // 自定义条件折叠按钮
        const customHeader = document.getElementById('xy-quench-custom-header');
        if (customHeader) {
            customHeader.addEventListener('click', () => {
                const content = document.getElementById('xy-quench-custom-content');
                const toggle = document.getElementById('xy-quench-custom-toggle');
                if (content && toggle) {
                    customConditionsCollapsed = !customConditionsCollapsed;
                    content.style.display = customConditionsCollapsed ? 'none' : 'block';
                    toggle.textContent = customConditionsCollapsed ? '+' : '-';
                    addLog(`自定义暂停条件${customConditionsCollapsed ? '已折叠' : '已展开'}`, 'info');
                }
            });
        }

        // 位置选择按钮
        const selectQuenchBtn = document.getElementById('xy-quench-select-quench');
        if (selectQuenchBtn) {
            selectQuenchBtn.addEventListener('click', () => {
                startPositionSelection('quench');
            });
        }
        
        const selectSkipBtn = document.getElementById('xy-quench-select-skip');
        if (selectSkipBtn) {
            selectSkipBtn.addEventListener('click', () => {
                startPositionSelection('skip');
            });
        }

        // 英雄和部位选择器事件
        const heroSelect = document.getElementById('xy-quench-hero-select');
        if (heroSelect) {
            heroSelect.addEventListener('change', (e) => {
                const heroId = parseInt(e.target.value);
                CONFIG.heroId = heroId;
                saveConfig();
                updateHeroPartDisplay();
                const hero = HEROES[heroId];
                addLog(`已选择英雄: ${hero ? hero.name : heroId}`, 'success');
            });
        }
        
        // 部位选择器事件（单选按钮组，四选一）
        const partRadios = document.querySelectorAll('input[name="xy-quench-part"]');
        if (partRadios && partRadios.length > 0) {
            partRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        const part = parseInt(e.target.value);
                        CONFIG.part = part;
                        saveConfig();
                        
                        const partInfo = PARTS.find(p => p.value === part);
                        addLog(`已选择部位: ${partInfo ? partInfo.text : part}`, 'success');
                        
                        // 更新所有单选按钮的样式
                        const allRadios = document.querySelectorAll('input[name="xy-quench-part"]');
                        allRadios.forEach(r => {
                            const label = r.parentElement;
                            if (label) {
                                if (r.checked) {
                                    label.style.background = '#3498db';
                                    label.style.borderColor = '#2980b9';
                                } else {
                                    label.style.background = '#2c3e50';
                                    label.style.borderColor = '#34495e';
                                }
                            }
                        });
                        
                        // 更新当前设置显示
                        updateHeroPartDisplay();
                    }
                });
            });
        }

        // 输入框变化事件
        const intervalInput = document.getElementById('xy-quench-interval');
        const countInput = document.getElementById('xy-quench-count');
        const redIntervalInput = document.getElementById('xy-quench-red-interval');
        const noRedIntervalInput = document.getElementById('xy-quench-no-red-interval');
        const limitTimesInput = document.getElementById('xy-quench-limit-times');
        const skipDelayInput = document.getElementById('xy-quench-skip-delay');
        const pauseRedAttackCheckbox = document.getElementById('xy-quench-pause-red-attack');
        const pauseConsecutiveRedCheckbox = document.getElementById('xy-quench-pause-consecutive-red');
        const pauseNoRedCheckbox = document.getElementById('xy-quench-pause-no-red');
        const stopOnLimitCheckbox = document.getElementById('xy-quench-stop-on-limit');
        const autoSkipCheckbox = document.getElementById('xy-quench-auto-skip');
        const autoSwitchPartCheckbox = document.getElementById('xy-quench-auto-switch-part');
        
        if (intervalInput) {
            intervalInput.addEventListener('change', (e) => {
                CONFIG.interval = parseInt(e.target.value);
                saveConfig();
            });
        }
        
        if (countInput) {
            countInput.addEventListener('change', (e) => {
                CONFIG.count = parseInt(e.target.value);
                saveConfig();
            });
        }
        
        if (redIntervalInput) {
            redIntervalInput.addEventListener('change', (e) => {
                CONFIG.redAttrInterval = parseInt(e.target.value);
                saveConfig();
            });
        }
        
        if (noRedIntervalInput) {
            noRedIntervalInput.addEventListener('change', (e) => {
                CONFIG.noRedInterval = parseInt(e.target.value);
                saveConfig();
            });
        }
        
        if (limitTimesInput) {
            limitTimesInput.addEventListener('change', (e) => {
                CONFIG.limitQuenchTimes = parseInt(e.target.value);
                saveConfig();
            });
        }
        
        if (skipDelayInput) {
            skipDelayInput.addEventListener('change', (e) => {
                CONFIG.skipCheckDelay = parseInt(e.target.value);
                saveConfig();
            });
        }
        
        if (pauseRedAttackCheckbox) {
            pauseRedAttackCheckbox.addEventListener('change', (e) => {
                CONFIG.pauseOnRedAttack = e.target.checked;
                saveConfig();
                addLog(`${CONFIG.pauseOnRedAttack ? '开启' : '关闭'}红色攻击属性暂停功能`, 'info');
            });
        }
        
        if (pauseConsecutiveRedCheckbox) {
            pauseConsecutiveRedCheckbox.addEventListener('change', (e) => {
                CONFIG.pauseOnConsecutiveRed = e.target.checked;
                saveConfig();
                addLog(`${CONFIG.pauseOnConsecutiveRed ? '开启' : '关闭'}连续出红暂停功能`, 'info');
            });
        }
        
        if (pauseNoRedCheckbox) {
            pauseNoRedCheckbox.addEventListener('change', (e) => {
                CONFIG.pauseOnNoRed = e.target.checked;
                saveConfig();
                addLog(`${CONFIG.pauseOnNoRed ? '开启' : '关闭'}无红暂停功能`, 'info');
            });
        }
        
        if (stopOnLimitCheckbox) {
            stopOnLimitCheckbox.addEventListener('change', (e) => {
                CONFIG.stopOnLimit = e.target.checked;
                saveConfig();
                addLog(`${CONFIG.stopOnLimit ? '开启' : '关闭'}限定次数停止功能`, 'info');
            });
        }
        
        if (autoSkipCheckbox) {
            autoSkipCheckbox.addEventListener('change', (e) => {
                CONFIG.autoSkipRedOrange = e.target.checked;
                saveConfig();
                addLog(`${CONFIG.autoSkipRedOrange ? '开启' : '关闭'}自动跳过红/橙色功能`, 'info');
            });
        }
        
        if (autoSwitchPartCheckbox) {
            autoSwitchPartCheckbox.addEventListener('change', (e) => {
                CONFIG.autoSwitchPart = e.target.checked;
                saveConfig();
                addLog(`${CONFIG.autoSwitchPart ? '开启' : '关闭'}自动切换部位功能`, 'info');
                if (CONFIG.autoSwitchPart) {
                    addLog('自动切换部位顺序: 武器→铠甲→头盔→坐骑', 'info');
                    addLog('切换条件: 仅自定义条件触发，不暂停洗练', 'info');
                    addLog('完成条件: 四个部位都出现指定结果或洗练次数用完', 'info');
                }
            });
        }

        // 添加自定义暂停条件按钮
        const addConditionBtn = document.getElementById('xy-quench-add-condition');
        if (addConditionBtn) {
            addConditionBtn.addEventListener('click', () => {
                const selectedAttrs = [];
                const selectedColors = [];
                
                // 获取选中的属性
                document.querySelectorAll('.xy-quench-attr-checkbox input:checked').forEach(checkbox => {
                    selectedAttrs.push(parseInt(checkbox.dataset.attr));
                });
                
                // 获取选中的颜色
                document.querySelectorAll('.xy-quench-color-checkbox input:checked').forEach(checkbox => {
                    selectedColors.push(parseInt(checkbox.dataset.color));
                });
                
                if (selectedAttrs.length === 0 || selectedColors.length === 0) {
                    addLog('请至少选择一个属性和一个颜色', 'warning');
                    return;
                }
                
                // 添加所有组合
                selectedAttrs.forEach(attrId => {
                    selectedColors.forEach(colorId => {
                        addCustomPauseCondition(attrId, colorId);
                    });
                });
                
                // 清空选择
                document.querySelectorAll('.xy-quench-attr-checkbox input:checked').forEach(checkbox => {
                    checkbox.checked = false;
                });
                document.querySelectorAll('.xy-quench-color-checkbox input:checked').forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }

        // 清空暂停条件按钮
        const clearConditionsBtn = document.getElementById('xy-quench-clear-conditions');
        if (clearConditionsBtn) {
            clearConditionsBtn.addEventListener('click', () => {
                CONFIG.customPauseConditions = [];
                saveConfig();
                updateCustomConditionsDisplay();
                addLog('已清空所有自定义暂停条件', 'info');
            });
        }

        // 自定义切换条件折叠按钮
        const customSwitchHeader = document.getElementById('xy-quench-custom-switch-header');
        if (customSwitchHeader) {
            customSwitchHeader.addEventListener('click', () => {
                const content = document.getElementById('xy-quench-custom-switch-content');
                const toggle = document.getElementById('xy-quench-custom-switch-toggle');
                if (content && toggle) {
                    customSwitchConditionsCollapsed = !customSwitchConditionsCollapsed;
                    content.style.display = customSwitchConditionsCollapsed ? 'none' : 'block';
                    toggle.textContent = customSwitchConditionsCollapsed ? '+' : '-';
                    saveConfig();
                    addLog(`自定义切换条件${customSwitchConditionsCollapsed ? '已折叠' : '已展开'}`, 'info');
                }
            });
        }

        // 添加自定义切换条件按钮
        const addSwitchConditionBtn = document.getElementById('xy-quench-add-switch-condition');
        if (addSwitchConditionBtn) {
            addSwitchConditionBtn.addEventListener('click', () => {
                console.log('点击添加切换条件按钮');
                const selectedAttrs = [];
                const selectedColors = [];
                
                // 获取选中的属性（使用switch-attr-checkbox类）
                document.querySelectorAll('.switch-attr-checkbox input:checked').forEach(checkbox => {
                    selectedAttrs.push(parseInt(checkbox.dataset.attr));
                });
                
                // 获取选中的颜色（使用switch-color-checkbox类）
                document.querySelectorAll('.switch-color-checkbox input:checked').forEach(checkbox => {
                    selectedColors.push(parseInt(checkbox.dataset.color));
                });
                
                console.log('选中的属性:', selectedAttrs);
                console.log('选中的颜色:', selectedColors);
                
                if (selectedAttrs.length === 0 || selectedColors.length === 0) {
                    addLog('请至少选择一个属性和一个颜色', 'warning');
                    return;
                }
                
                // 添加所有组合
                selectedAttrs.forEach(attrId => {
                    selectedColors.forEach(colorId => {
                        addCustomSwitchCondition(attrId, colorId);
                    });
                });
                
                // 清空选择
                document.querySelectorAll('.switch-attr-checkbox input:checked').forEach(checkbox => {
                    checkbox.checked = false;
                });
                document.querySelectorAll('.switch-color-checkbox input:checked').forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        } else {
            console.log('未找到添加切换条件按钮');
        }

        // 清空切换条件按钮
        const clearSwitchConditionsBtn = document.getElementById('xy-quench-clear-switch-conditions');
        if (clearSwitchConditionsBtn) {
            clearSwitchConditionsBtn.addEventListener('click', () => {
                CONFIG.customSwitchConditions = [];
                saveConfig();
                updateCustomSwitchConditionsDisplay();
                addLog('已清空所有自定义切换条件', 'info');
            });
        }

        // 开始洗练按钮
        const startBtn = document.getElementById('xy-quench-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startQuench);
        }

        // 停止洗练按钮
        const stopBtn = document.getElementById('xy-quench-stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', stopQuench);
        }

        // 导出日志按钮
        const exportBtn = document.getElementById('xy-quench-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportLogs);
        }

        // 手动洗练按钮
        const manualBtn = document.getElementById('xy-quench-manual-btn');
        if (manualBtn) {
            manualBtn.addEventListener('click', manualQuench);
        }

        // 清空日志按钮
        const clearBtn = document.getElementById('xy-quench-clear-logs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const container = document.getElementById('xy-quench-log-container');
                if (container) container.innerHTML = '';
                addLog('日志已清空', 'info');
            });
        }

        // 设置拖动事件
        setupDragEvents();
    }
    
    // 借鉴鲨鱼脚本的注入方式
    window.quenchHackTimer = setInterval(() => {
        try {
            if (!window.__require) {
                console.log('等待游戏环境加载...');
                return;
            }
            
            // 检查data-index模块是否可用
            try {
                window.__require('data-index');
            } catch (e) {
                console.log('等待data-index模块加载...');
                return;
            }
            
            clearInterval(window.quenchHackTimer);
            console.log('----------------洗练助手注入完成-----------------');
            
            // 加载配置并创建UI
            loadConfig();
            createQuenchUI();
            
            // 设置quench方法监听
            setTimeout(() => {
                setupQuenchListener();
            }, 1000);
            
        } catch (err) {
            console.log('注入出错:', err);
            return;
        }
    }, 100);
})();