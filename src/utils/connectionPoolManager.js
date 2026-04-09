/**
 * WebSocket 连接池管理器（简化版）
 * 
 * 功能:
 * - 限制最大并发连接数
 * - 简化的连接管理机制
 * - 类似批量日常页面的高效连接管理
 * - 支持 Token 自动刷新
 */

import { useIndexedDB } from '@/hooks/useIndexedDB';

export class ConnectionPoolManager {
    constructor(tokenStore, options = {}) {
        this.tokenStore = tokenStore;
        
        // 初始化 IndexedDB 工具（懒加载）
        const { getArrayBuffer, storeArrayBuffer, deleteArrayBuffer } = useIndexedDB();
        this.getArrayBuffer = getArrayBuffer;
        this.storeArrayBuffer = storeArrayBuffer;
        this.deleteArrayBuffer = deleteArrayBuffer;

        // 配置参数 - 与批量日常页面一致
        this.config = {
            maxConnections: options.maxConnections || 20,           // 最大并发连接数
            connectionTimeout: options.connectionTimeout || 3000,   // 连接超时时间 (ms) - 3 秒
            reconnectDelay: options.reconnectDelay || 500,         // 初始重连延迟 (ms)
            maxReconnectDelay: options.maxReconnectDelay || 5000,  // 最大重连延迟 (ms)
            maxRetries: options.maxRetries || 3,                   // 最大重试次数
        };

        // 简化的连接槽位控制 - 使用计数器机制（类似批量日常页面）
        this.connectionSlots = { active: 0 };
        this.maxActive = this.config.maxConnections;
        
        // 重连状态跟踪 - 用于指数退避
        this.reconnectState = new Map(); // tokenId -> { retries, delay }

        console.log('[ConnectionPool] 连接池管理器已初始化（简化版）', this.config);
    }

    /**
     * 获取连接 - 使用类似批量日常页面的ensureConnection逻辑
     * @param {string} tokenId - Token ID
     * @returns {Promise<boolean>} 是否成功获取连接
     */
    async acquire(tokenId) {
        console.log(`[ConnectionPool] 请求获取连接: ${tokenId}`);
        return await this.ensureConnection(tokenId);
    }

    /**
     * 确保连接可用（类似批量日常页面的ensureConnection函数）
     */
    async ensureConnection(tokenId, maxRetries = this.config.maxRetries) {
        const latestToken = this.tokenStore.gameTokens.find(t => t.id === tokenId);
        if (!latestToken) {
            throw new Error(`Token not found: ${tokenId}`);
        }

        let status = this.tokenStore.getWebSocketStatus(tokenId);
        let connected = status === "connected";

        if (!connected) {
            // 等待连接槽位，限制并发连接数（类似批量日常页面）
            await this.waitForConnectionSlot();

            console.log(`[ConnectionPool] 正在连接... (队列: ${this.connectionSlots.active}/${this.maxActive})`);

            this.tokenStore.createWebSocketConnection(
                tokenId,
                latestToken.token,
                latestToken.wsUrl,
            );
            connected = await this.waitForConnection(tokenId);

            if (!connected && maxRetries > 0) {
                console.log(`[ConnectionPool] 连接超时，尝试重连: ${tokenId}`);

                this.tokenStore.closeWebSocketConnection(tokenId);
                
                // 获取重连状态，实现指数退避
                const reconnectInfo = this.getReconnectInfo(tokenId);
                console.log(`[ConnectionPool] 重连信息：${tokenId} - 尝试次数：${reconnectInfo.retries}, 延迟：${reconnectInfo.delay}ms`);
                
                // 使用配置的重连延迟
                await new Promise((resolve) => setTimeout(resolve, reconnectInfo.delay));

                console.log(`[ConnectionPool] 正在重连: ${tokenId}`);

                const refreshedToken = this.tokenStore.gameTokens.find(t => t.id === tokenId);
                this.tokenStore.createWebSocketConnection(
                    tokenId,
                    refreshedToken.token,
                    refreshedToken.wsUrl,
                );

                connected = await this.waitForConnection(tokenId);
                
                if (!connected) {
                    // 更新重连状态，增加延迟
                    this.updateReconnectInfo(tokenId);
                } else {
                    // 连接成功，重置重连状态
                    this.resetReconnectInfo(tokenId);
                }
            } else if (connected) {
                // 连接成功，重置重连状态
                this.resetReconnectInfo(tokenId);
            }

            if (!connected) {
                console.error(`[ConnectionPool] 连接失败 (重试后仍超时): ${tokenId}`);
                // 连接失败，释放槽位
                this.releaseConnectionSlot();
                return false;
            }
        } else {
            // 连接状态显示为 connected，但需要验证是否真的可用
            // 等待连接槽位时持续监测连接状态
            const slotWaitStart = Date.now();
            await this.waitForConnectionSlot();
            
            // 检查等待槽位期间连接是否已断开
            const currentStatus = this.tokenStore.getWebSocketStatus(tokenId);
            if (currentStatus !== "connected") {
                console.log(`[ConnectionPool] 等待槽位期间连接断开：${tokenId}，重新尝试连接`);
                // 递归调用，重新连接
                return await this.ensureConnection(tokenId, maxRetries);
            }
            
            // 如果等待槽位时间超过 1 秒，发送心跳验证连接
            const waitTime = Date.now() - slotWaitStart;
            if (waitTime > 1000) {
                console.log(`[ConnectionPool] 等待槽位时间较长 (${waitTime}ms)，发送心跳验证连接`);
                try {
                    this.tokenStore.sendHeartbeat(tokenId);
                    // 等待短暂时间确认心跳响应
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const afterHeartbeatStatus = this.tokenStore.getWebSocketStatus(tokenId);
                    if (afterHeartbeatStatus !== "connected") {
                        console.log(`[ConnectionPool] 心跳验证失败，连接已断开：${tokenId}`);
                        return await this.ensureConnection(tokenId, maxRetries);
                    }
                } catch (error) {
                    console.log(`[ConnectionPool] 心跳发送失败，连接可能已断开：${tokenId}`);
                    return await this.ensureConnection(tokenId, maxRetries);
                }
            }
        }

        // 连接成功，初始化游戏数据（关键步骤，如战斗版本和会话）
        try {
            // 首先获取角色信息（标准流程）
            await this.tokenStore.sendMessageWithPromise(
                tokenId,
                "role_getroleinfo",
                {},
                5000,
            );

            // 获取战斗版本
            const res = await this.tokenStore.sendMessageWithPromise(
                tokenId,
                "fight_startlevel",
                {},
                5000,
            );
            if (res?.battleData?.version) {
                this.tokenStore.setBattleVersion(res.battleData.version);
            }
        } catch (e) {
            console.warn(`[ConnectionPool] 初始化数据失败：${tokenId}`, e.message);
            
            // 检查是否是 "check token error"
            if (e.message && e.message.includes('check token error')) {
                console.warn(`[ConnectionPool] 检测到 Token 失效：${tokenId}，尝试自动刷新...`);
                
                // 尝试刷新 Token
                const refreshed = await this.refreshToken(tokenId);
                
                if (refreshed) {
                    console.log(`[ConnectionPool] Token 刷新成功，重新初始化：${tokenId}`);
                    
                    // 刷新成功后，重新尝试初始化
                    try {
                        await this.tokenStore.sendMessageWithPromise(
                            tokenId,
                            "role_getroleinfo",
                            {},
                            5000,
                        );

                        const res = await this.tokenStore.sendMessageWithPromise(
                            tokenId,
                            "fight_startlevel",
                            {},
                            5000,
                        );
                        if (res?.battleData?.version) {
                            this.tokenStore.setBattleVersion(res.battleData.version);
                        }
                        
                        console.log(`[ConnectionPool] Token 刷新后初始化成功：${tokenId}`);
                    } catch (retryError) {
                        console.error(`[ConnectionPool] Token 刷新后初始化仍失败：${tokenId}`, retryError.message);
                    }
                } else {
                    console.error(`[ConnectionPool] Token 刷新失败，需要手动重新导入：${tokenId}`);
                }
            }
        }

        // 连接成功，槽位保持占用，直到任务完成后手动释放
        return true;
    }

    /**
     * 等待连接槽位（优化版本：添加超时和优先级）
     */
    async waitForConnectionSlot(timeout = 3000) {
        const startTime = Date.now();
        
        while (this.connectionSlots.active >= this.maxActive) {
            // 检查是否超时
            if (Date.now() - startTime > timeout) {
                console.warn('[ConnectionPool] 等待连接槽位超时，强制获取槽位');
                break;
            }
            // 缩短等待间隔，从 1 秒改为 100ms
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.connectionSlots.active++;
    }

    /**
     * 释放连接槽位（类似批量日常页面的逻辑）
     */
    releaseConnectionSlot() {
        if (this.connectionSlots.active > 0) {
            this.connectionSlots.active--;
        }
    }

    /**
     * 释放连接 - 简化版本，连接使用完后立即释放
     * @param {string} tokenId - Token ID
     * @param {boolean} disconnect - 是否断开WebSocket连接
     */
    async release(tokenId, disconnect = true) {
        console.log(`[ConnectionPool] 释放连接: ${tokenId}, 断开: ${disconnect}`);

        if (disconnect) {
            try {
                this.tokenStore.closeWebSocketConnection(tokenId);
                console.log(`[ConnectionPool] WebSocket已断开: ${tokenId}`);
            } catch (error) {
                console.error(`[ConnectionPool] 关闭WebSocket连接失败: ${tokenId}`, error);
            }
        }

        // 释放连接槽位
        this.releaseConnectionSlot();
        console.log(`[ConnectionPool] 连接已释放  (队列: ${this.connectionSlots.active}/${this.maxActive})`);
    }

    /**
     * 释放所有连接
     */
    async releaseAll() {
        console.log('[ConnectionPool] 释放所有连接');
        // 这里可以遍历所有活动连接并释放它们，但现在简化处理
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus(tokenId) {
        const status = this.tokenStore.getWebSocketStatus(tokenId);
        return {
            connected: status === 'connected',
            status: status
        };
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            activeConnections: this.connectionSlots.active,
            connectionSlots: {
                active: this.connectionSlots.active,
                max: this.maxActive
            }
        };
    }

    /**
     * 销毁连接池
     */
    async destroy() {
        console.log('[ConnectionPool] 销毁连接池...');
        await this.releaseAll();
        // 清空重连状态
        this.reconnectState.clear();
        console.log('[ConnectionPool] 连接池已销毁');
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 获取重连信息（指数退避）
     */
    getReconnectInfo(tokenId) {
        if (!this.reconnectState.has(tokenId)) {
            this.reconnectState.set(tokenId, {
                retries: 0,
                delay: this.config.reconnectDelay
            });
        }
        return this.reconnectState.get(tokenId);
    }

    /**
     * 更新重连信息（指数退避）
     */
    updateReconnectInfo(tokenId) {
        const info = this.getReconnectInfo(tokenId);
        info.retries++;
        // 指数退避：每次重连延迟翻倍，但不超过最大延迟
        info.delay = Math.min(info.delay * 2, this.config.maxReconnectDelay);
        this.reconnectState.set(tokenId, info);
        console.log(`[ConnectionPool] 更新重连信息: ${tokenId} - 尝试次数: ${info.retries}, 下次延迟: ${info.delay}ms`);
    }

    /**
     * 重置重连信息
     */
    resetReconnectInfo(tokenId) {
        this.reconnectState.set(tokenId, {
            retries: 0,
            delay: this.config.reconnectDelay
        });
        console.log(`[ConnectionPool] 重置重连信息: ${tokenId}`);
    }

    /**
     * 等待连接建立（类似批量日常页面的逻辑）
     */
    async waitForConnection(tokenId, timeout = this.config.connectionTimeout) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const status = this.tokenStore.getWebSocketStatus(tokenId);
            if (status === "connected") return true;
            // 缩短检查间隔，从 1 秒改为 100ms，更快响应连接状态变化
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return false;
    }

    /**
     * 解析Token范围字符串
     * @param {string} rangeStr - 范围字符串，如 "1,3,5-7,10"
     * @returns {number[]|null} 解析后的索引数组，如果为null表示选择全部
     */
    parseTokenRange(rangeStr) {
        if (!rangeStr || rangeStr.trim() === '') {
            return null; // null表示选择全部
        }

        const indices = new Set();

        // 按逗号分割
        const parts = rangeStr.split(',').map(part => part.trim());

        for (const part of parts) {
            if (part.includes('-')) {
                // 处理范围，如 "5-7"
                const [start, end] = part.split('-').map(num => parseInt(num.trim()));
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) {
                        if (i > 0) { // 确保索引大于0
                            indices.add(i);
                        }
                    }
                }
            } else {
                // 处理单个数字
                const num = parseInt(part);
                if (!isNaN(num) && num > 0) {
                    indices.add(num);
                }
            }
        }

        return Array.from(indices).sort((a, b) => a - b);
    }

    /**
     * 根据范围获取目标Token列表
     * @param {Array} tokens - 所有Token列表
     * @param {number[]|null} tokenIndices - 指定的Token索引数组，null表示全部
     * @returns {Array} 目标Token列表
     */
    getTargetTokens(tokens, tokenIndices) {
        if (!tokens || tokens.length === 0) {
            return [];
        }

        // 如果tokenIndices为null，返回所有token
        if (tokenIndices === null) {
            return tokens;
        }

        // 根据索引范围返回指定token
        return tokenIndices
            .map(index => {
                const arrayIndex = index - 1; // 转换为0基索引
                const token = tokens[arrayIndex];
                // 检查token是否存在
                if (token) {
                    return { token, index };
                }
                return null;
            })
            .filter(item => item !== null)
            .sort((a, b) => a.index - b.index)
            .map(item => item.token);
    }

    /**
     * 批量连接tokens并执行操作
     * @param {Array} tokens - 要连接的Token列表
     * @param {Function} operationFn - 操作函数，接收(token, index)参数
     * @param {Object} options - 选项配置
     * @returns {Promise<Array>} 结果数组
     */
    async batchOperate(tokens, operationFn, options = {}) {
        const {
            batchSize = 20,
            delayBetween = 1000,  // 操作之间的延迟（1 秒）
            keepConnections = true,  // 保持连接，不频繁断开
            onProgress = null    // 进度回调函数
        } = options;

        const results = [];
        let currentIndex = 0;

        for (let batchStart = 0; batchStart < tokens.length; batchStart += batchSize) {
            if (batchStart > 0) {
                // 批次之间的延迟
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const batchTokens = tokens.slice(batchStart, batchStart + batchSize);
            
            if (onProgress) {
                onProgress({
                    type: 'batch-start',
                    batchIndex: Math.floor(batchStart / batchSize) + 1,
                    batchSize: batchTokens.length,
                    totalBatches: Math.ceil(tokens.length / batchSize),
                    totalTokens: tokens.length
                });
            }

            for (let i = 0; i < batchTokens.length; i++) {
                const token = batchTokens[i];
                const globalIndex = batchStart + i;
                let acquired = false;
                
                try {
                    if (onProgress) {
                        onProgress({
                            type: 'token-start',
                            globalIndex: globalIndex + 1,
                            tokenId: token.id,
                            tokenName: token.name || token.id,
                            totalTokens: tokens.length
                        });
                    }

                    // 获取连接
                    await this.acquire(token.id);
                    acquired = true;

                    const status = this.tokenStore.getWebSocketStatus(token.id);

                    if (status !== 'connected') {
                        if (onProgress) {
                            onProgress({
                                type: 'token-error',
                                globalIndex: globalIndex + 1,
                                tokenId: token.id,
                                tokenName: token.name || token.id,
                                message: '连接失败，跳过',
                                status: 'warning'
                            });
                        }
                        continue;
                    }

                    if (onProgress) {
                        onProgress({
                            type: 'token-success',
                            globalIndex: globalIndex + 1,
                            tokenId: token.id,
                            tokenName: token.name || token.id,
                            message: '连接成功',
                            status: 'success'
                        });
                    }

                    // 执行操作
                    const result = await operationFn(token, globalIndex);
                    
                    results.push({
                        token: token,
                        index: globalIndex,
                        success: true,
                        result: result
                    });

                    if (delayBetween > 0) {
                        await new Promise(resolve => setTimeout(resolve, delayBetween));
                    }

                } catch (error) {
                    results.push({
                        token: token,
                        index: globalIndex,
                        success: false,
                        error: error.message || error
                    });

                    if (onProgress) {
                        onProgress({
                            type: 'token-error',
                            globalIndex: globalIndex + 1,
                            tokenId: token.id,
                            tokenName: token.name || token.id,
                            message: `操作失败: ${error.message || error}`,
                            status: 'error'
                        });
                    }
                } finally {
                    // 释放连接（如果keepConnections为true，则不断开连接）
                    if (acquired) {
                        try {
                            await this.release(token.id, !keepConnections);
                        } catch (releaseError) {
                            console.error(`释放连接失败:`, releaseError);
                        }
                    }
                }
            }
        }

        // 如果保持连接，最后统一断开所有连接
        if (keepConnections) {
            for (const token of tokens) {
                try {
                    const status = this.tokenStore.getWebSocketStatus(token.id);
                    if (status === 'connected') {
                        await this.release(token.id, true);
                    }
                } catch (error) {
                    console.error(`最终释放连接失败:`, error);
                }
            }
        }

        return results;
    }

    /**
     * 刷新 Token - 当遇到 "check token error" 时自动刷新 Token
     * 支持多种导入方式的 Token 刷新
     * @param {string} tokenId - Token ID
     * @returns {Promise<boolean>} 是否刷新成功
     */
    async refreshToken(tokenId) {
        console.log(`[ConnectionPool] 开始刷新 Token: ${tokenId}`);
        
        try {
            const token = this.tokenStore.gameTokens.find(t => t.id === tokenId);
            if (!token) {
                console.error(`[ConnectionPool] Token 不存在：${tokenId}`);
                return false;
            }

            // 检查 Token 的导入方式
            if (token.importMethod === 'url' && token.sourceUrl) {
                // 从 URL 重新获取 Token
                console.log(`[ConnectionPool] 从 URL 刷新 Token: ${token.sourceUrl}`);
                
                const response = await fetch(token.sourceUrl, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                    mode: 'cors',
                });

                if (!response.ok) {
                    throw new Error(`请求失败：${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (!data.token) {
                    throw new Error('返回数据中未找到 token 字段');
                }

                // 更新 Token
                this.tokenStore.updateToken(tokenId, {
                    token: data.token,
                    server: data.server || token.server,
                    lastRefreshed: Date.now(),
                });

                console.log(`[ConnectionPool] Token 刷新成功 (URL 方式): ${tokenId}`);
                return true;

            } else if (token.importMethod === 'wxQrcode' || token.importMethod === 'bin') {
                // 从 IndexedDB 刷新 Token（微信二维码或二进制导入）
                console.log(`[ConnectionPool] 从 IndexedDB 刷新 Token: ${tokenId}`);
                
                // 使用实例方法获取 ArrayBuffer
                let userToken = await this.getArrayBuffer(tokenId);
                let usedOldKey = false;
                
                if (!userToken) {
                    userToken = await this.getArrayBuffer(token.name);
                    usedOldKey = true;
                }

                if (userToken) {
                    // 转换 Token
                    const newToken = await this.transformToken(userToken);
                    
                    this.tokenStore.updateToken(tokenId, {
                        token: newToken,
                        lastRefreshed: Date.now(),
                    });

                    // 如果使用旧 key 获取的，迁移到新 key
                    if (usedOldKey) {
                        await this.storeArrayBuffer(tokenId, userToken);
                        await this.deleteArrayBuffer(token.name);
                        console.log(`[ConnectionPool] 已迁移 IndexedDB 数据：${token.name} -> ${tokenId}`);
                    }

                    console.log(`[ConnectionPool] Token 刷新成功 (IndexedDB 方式): ${tokenId}`);
                    return true;
                } else {
                    throw new Error('未找到缓存的 Token 数据');
                }

            } else {
                // 手动导入的 Token，无法自动刷新
                console.warn(`[ConnectionPool] Token 为手动导入，无法自动刷新：${tokenId}`);
                return false;
            }

        } catch (error) {
            console.error(`[ConnectionPool] 刷新 Token 失败：${tokenId}`, error.message);
            return false;
        }
    }

    /**
     * 转换 Token（从 ArrayBuffer 解码）
     * 复制自 TokenImport/index.vue 中的 transformToken 函数
     */
    async transformToken(arrayBuffer) {
        try {
            const decoder = new TextDecoder('utf-8');
            const jsonStr = decoder.decode(arrayBuffer);
            const data = JSON.parse(jsonStr);
            
            if (data.token) {
                return data.token;
            } else if (data.sessId) {
                return data.sessId;
            } else {
                throw new Error('Token 数据格式无效');
            }
        } catch (error) {
            console.error('[ConnectionPool] Token 转换失败:', error);
            throw error;
        }
    }

    /**
     * 批量刷新 Token - 用于批量操作中遇到 "check token error" 时
     * @param {Array} tokenIds - 需要刷新的 Token ID 列表
     * @returns {Promise<Object>} 刷新结果
     */
    async batchRefreshTokens(tokenIds) {
        console.log(`[ConnectionPool] 开始批量刷新 Token: ${tokenIds.length} 个`);
        
        const results = {
            success: [],
            failed: [],
        };

        for (const tokenId of tokenIds) {
            const success = await this.refreshToken(tokenId);
            if (success) {
                results.success.push(tokenId);
            } else {
                results.failed.push(tokenId);
            }
        }

        console.log(`[ConnectionPool] 批量刷新完成：成功 ${results.success.length}, 失败 ${results.failed.length}`);
        return results;
    }
}

export default ConnectionPoolManager;
