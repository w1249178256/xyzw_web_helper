/**
 * WebSocket连接池管理器（简化版）
 * 
 * 功能:
 * - 限制最大并发连接数
 * - 简化的连接管理机制
 * - 类似批量日常页面的高效连接管理
 */

export class ConnectionPoolManager {
    constructor(tokenStore, options = {}) {
        this.tokenStore = tokenStore;

        // 配置参数 - 与批量日常页面一致
        this.config = {
            maxConnections: options.maxConnections || 20,           // 最大并发连接数
            connectionTimeout: options.connectionTimeout || 10000,  // 连接超时时间(ms)
            reconnectDelay: options.reconnectDelay || 1000,        // 重连延迟(ms)
            maxRetries: options.maxRetries || 2,                   // 最大重试次数
        };

        // 简化的连接槽位控制 - 使用计数器机制（类似批量日常页面）
        this.connectionSlots = { active: 0 };
        this.maxActive = this.config.maxConnections;

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
                await new Promise((resolve) => setTimeout(resolve, this.config.reconnectDelay));

                console.log(`[ConnectionPool] 正在重连: ${tokenId}`);

                const refreshedToken = this.tokenStore.gameTokens.find(t => t.id === tokenId);
                this.tokenStore.createWebSocketConnection(
                    tokenId,
                    refreshedToken.token,
                    refreshedToken.wsUrl,
                );

                connected = await this.waitForConnection(tokenId);
            }

            if (!connected) {
                console.error(`[ConnectionPool] 连接失败 (重试后仍超时): ${tokenId}`);
                // 连接失败，释放槽位
                this.releaseConnectionSlot();
                return false;
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
            console.warn(`[ConnectionPool] 初始化数据失败: ${tokenId}`, e.message);
        }

        // 连接成功，槽位保持占用，直到任务完成后手动释放
        return true;
    }

    /**
     * 等待连接槽位（类似批量日常页面的逻辑）
     */
    async waitForConnectionSlot() {
        while (this.connectionSlots.active >= this.maxActive) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
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
        console.log('[ConnectionPool] 连接池已销毁');
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 等待连接建立（类似批量日常页面的逻辑）
     */
    async waitForConnection(tokenId, timeout = this.config.connectionTimeout) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const status = this.tokenStore.getWebSocketStatus(tokenId);
            if (status === "connected") return true;
            await new Promise((resolve) => setTimeout(resolve, 500));
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
            delayBetween = 300,  // 操作之间的延迟
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
                            tokenName: token.name || token.id,
                            message: `操作失败: ${error.message || error}`,
                            status: 'error'
                        });
                    }
                } finally {
                    // 释放连接
                    if (acquired) {
                        try {
                            await this.release(token.id);
                        } catch (releaseError) {
                            console.error(`释放连接失败:`, releaseError);
                        }
                    }
                }
            }
        }

        return results;
    }
}

export default ConnectionPoolManager;
