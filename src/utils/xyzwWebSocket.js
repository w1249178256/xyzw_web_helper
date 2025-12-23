/**
 * XYZW WebSocket 客户端
 * 基于 readable-xyzw-ws.js 重构，适配本项目架构
 */

import { bonProtocol, g_utils } from './bonProtocol.js'
import { wsLogger, gameLogger } from './logger.js'

/** 生成 [min,max] 的随机整数 */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/** Promise 版 sleep */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/** 为日志生成安全的 body 预览，避免控制台再次解析原始对象 */
const formatBodyForLog = (body) => {
  if (!body) return ''

  if (body instanceof Uint8Array) {
    return `[BON:${body.length}b]`
  }

  if (Array.isArray(body)) {
    return `[Array:${body.length}]`
  }

  if (typeof body === 'object') {
    const isNumericObject = Object.keys(body).every((key) => !Number.isNaN(parseInt(key)))
    if (isNumericObject) {
      return `[BON:Object:${Object.keys(body).length}]`
    }
    try {
      return JSON.stringify(body)
    } catch {
      return '[Object]'
    }
  }

  return String(body)
}

/**
 * 命令注册器：保存每个 cmd 的默认体，发送时与 params 合并
 */
export class CommandRegistry {
  constructor(encoder, enc) {
    this.encoder = encoder
    this.enc = enc
    this.commands = new Map()
  }

  /** 注册命令 */
  register(cmd, defaultBody = {}) {
    this.commands.set(cmd, (ack = 0, seq = 0, params = {}) => ({
      cmd,
      ack,
      seq,
      time: Date.now(),
      body: this.encoder?.bon?.encode
        ? this.encoder.bon.encode({ ...defaultBody, ...params })
        : { ...defaultBody, ...params },
    }))
    return this
  }

  /** 特例：系统心跳的 ack 用的是 "_sys/ack" */
  registerHeartbeat() {
    this.commands.set("heart_beat", (ack, seq) => ({
      cmd: "_sys/ack",
      ack,
      seq,
      time: Date.now(),
      body: {},
    }))
    return this
  }

  /** 生成最终可发送的二进制 */
  encodePacket(raw) {
    if (this.encoder?.encode && this.enc) {
      // 使用加密编码
      return this.encoder.encode(raw, this.enc)
    } else {
      // 降级到JSON字符串
      return JSON.stringify(raw)
    }
  }

  /** 构造报文 */
  build(cmd, ack, seq, params) {
    const fn = this.commands.get(cmd)
    if (!fn) throw new Error(`Unknown cmd: ${cmd}`)
    return fn(ack, seq, params)
  }
}

/** 预注册游戏命令 */
export function registerDefaultCommands(reg) {
  const registry = reg.registerHeartbeat()
    // 角色/系统
    .register("role_getroleinfo", {
      clientVersion: "2.1.5-wx",
      inviteUid: 0,
      platform: "hortor",
      platformExt: "mix",
      scene: "",
    })
    .register("system_getdatabundlever", { isAudit: false })
    .register("system_buygold", { buyNum: 1 })
    .register("system_claimhangupreward")
    .register("system_signinreward")
    .register("system_mysharecallback", { isSkipShareCard: true, type: 2 })
    .register("system_custom", { key: "", value: 0 })

    // 任务相关
    .register("task_claimdailypoint", { taskId: 1 })
    .register("task_claimdailyreward", { rewardId: 0 })
    .register("task_claimweekreward", { rewardId: 0 })

    // 好友/招募
    .register("friend_batch", { friendId: 0 })
    .register("hero_recruit", { byClub: false, recruitNumber: 1, recruitType: 3 })
    .register("item_openbox", { itemId: 2001, number: 10 })
	.register("item_batchclaimboxpointreward")

    // 竞技场
    .register("arena_startarea")
    .register("fight_startlevel") // 获取 battleVersion
    .register("arena_getareatarget", { refresh: false })
	.register("arena_getarearank")

    // 商店
    .register("store_goodslist", { storeId: 1 })
    .register("store_buy", { goodsId: 1 })
    .register("store_purchase", { goodsId: 1 })
    .register("store_refresh", { storeId: 1 })

    // 军团
    .register("legion_getinfo")
    .register("legion_signin")
    .register("legion_getwarrank")
    .register("legionwar_getdetails")
	
	//盐场
	.register("legion_getinfobyid")
    .register("legion_getarearank")
	.register("saltroad_getsaltroadwartotalrank")
    .register("legionwar_getgoldmonthwarrank")
    .register("legion_getopponent")
    .register("legion_getbattlefield")

    // 邮件
    .register("mail_getlist", { category: [0, 4, 5], lastId: 0, size: 60 })
    .register("mail_claimallattachment", { category: 0 })
    .register("mail_getmtlinfo" ) 
    .register("mail_getmtlshortinfo" ) 

    // 学习问答
    .register("study_startgame")
    .register("study_answer")
    .register("study_claimreward", { rewardId: 1 })

    // 战斗相关
    .register("fight_starttower")
    .register("fight_startboss")
    .register("fight_startlegionboss")
    .register("fight_startdungeon")
    .register("fight_startpvp")

    // 瓶子机器人
    .register("bottlehelper_claim")
    .register("bottlehelper_start", { bottleType: -1 })
    .register("bottlehelper_stop", { bottleType: -1 })

    // 军团匹配和签到
    .register("legionmatch_rolesignup")
    .register("legion_signin")

    // 神器抽奖
    .register("artifact_lottery", { lotteryNumber: 1, newFree: true, type: 1 })

    // 灯神相关
    .register("genie_sweep", { genieId: 1 })
    .register("genie_buysweep")

    // 礼包相关
    .register("discount_claimreward", { discountId: 1 })
    .register("collection_claimfreereward")
    .register("card_claimreward", { cardId: 1 })

    // 爬塔相关
    .register("tower_getinfo")
    .register("tower_claimreward")

    // 队伍相关
    .register("presetteam_getinfo")
    .register("presetteam_getinfo")
    .register("presetteam_setteam")
    .register("presetteam_saveteam", { teamId: 1 })
    .register("role_gettargetteam")

    // 升星相关
    .register("hero_heroupgradestar")
    .register("book_upgrade")
    .register("book_claimpointreward")

    // 排名相关
    .register("rank_getroleinfo")

    // 梦魇相关
    .register("nightmare_getroleinfo")
	.register("dungeon_selecthero")
    .register("bosstower_gethelprank")
    // 活动/任务
    .register("activity_get")
	.register("activity_recyclewarorderrewardclaim")
	
	// 珍宝阁相关
    .register("collection_claimfreereward")
    .register("collection_goodslist")

    // 车辆相关
    .register("car_getrolecar")
    .register("car_refresh", { carId: 0 })
    .register("car_claim", { carId: 0 })
    .register("car_send", { carId: 0, helperId: 0, text: "" })
    .register("car_getmemberhelpingcnt")

	// 咸王宝库
    .register("matchteam_getroleteaminfo")
    .register("bosstower_getinfo")
    .register("bosstower_startboss")
    .register("bosstower_startbox")
    .register("discount_getdiscountinfo")

  registry.commands.set("fight_startareaarena", (ack = 0, seq = 0, params = {}) => {
    if (params?.targetId === undefined || params?.targetId === null) {
      throw new Error("fight_startareaarena requires targetId in params")
    }
    // battleVersion 由调用方通过 params 传入
    const payload = { ...params }
    const body = registry.encoder?.bon?.encode
      ? registry.encoder.bon.encode(payload)
      : payload

    return {
      cmd: "fight_startareaarena",
      ack,
      seq,
      time: Date.now(),
      body
    }
  })

  registry.commands.set("fight_startpvp", (ack = 0, seq = 0, params = {}) => {
    // battleVersion 由调用方通过 params 传入
    const payload = { ...params }
    const body = registry.encoder?.bon?.encode
      ? registry.encoder.bon.encode(payload)
      : payload

    return {
      cmd: "fight_startpvp",
      ack,
      seq,
      time: Date.now(),
      body
    }
  })

  return registry
}

/**
 * XYZW WebSocket 客户端
 */
export class XyzwWebSocketClient {
  constructor({ url, utils, heartbeatMs = 5000 }) {
    this.url = url
    this.utils = utils || g_utils
    this.enc = this.utils?.getEnc ? this.utils.getEnc("auto") : undefined

    this.socket = null
    this.ack = 0
    this.seq = 0
    this.sendQueue = []
    this.sendQueueTimer = null
    this.heartbeatTimer = null
    this.heartbeatInterval = heartbeatMs

    this.dialogStatus = false
    this.messageListener = null
    this.showMsg = false
    this.connected = false
    this.isReconnecting = false // 重连状态标志

    this.promises = Object.create(null)
    this.registry = registerDefaultCommands(new CommandRegistry(this.utils, this.enc))

    // WebSocket客户端初始化

    // 状态回调
    this.onConnect = null
    this.onDisconnect = null
    this.onError = null
  }

  /** 初始化连接 */
  init() {
    wsLogger.info(`连接: ${this.url.split('?')[0]}`)

    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      wsLogger.info('连接成功')
      this.connected = true
      // 启动心跳机制
      this._setupHeartbeat()
      // 启动消息队列处理
      this._processQueueLoop()
      if (this.onConnect) this.onConnect()
    }

    this.socket.onmessage = (evt) => {
      try {
        let packet
        if (typeof evt.data === "string") {
          packet = JSON.parse(evt.data)
        } else if (evt.data instanceof ArrayBuffer) {
          // 二进制数据需要自动检测并解码
          packet = this.utils?.parse ? this.utils.parse(evt.data, "auto") : evt.data

          // 移除特定命令的控制台直出日志，统一用 wsLogger/gameLogger 控制
        } else if (evt.data instanceof Blob) {
          // 处理Blob数据
          // 收到Blob数据
          evt.data.arrayBuffer().then(buffer => {
            try {
              packet = this.utils?.parse ? this.utils.parse(buffer, "auto") : buffer
              // Blob解析完成

              // 处理消息体解码（ProtoMsg会自动解码）
              if (packet instanceof Object && packet.rawData !== undefined) {
                gameLogger.verbose('ProtoMsg Blob消息，使用rawData:', packet.rawData)
              } else if (packet.body && this.shouldDecodeBody(packet.body)) {
                try {
                  if (this.utils && this.utils.bon && this.utils.bon.decode) {
                    // 转换body数据为Uint8Array
                    const bodyBytes = this.convertToUint8Array(packet.body)
                    if (bodyBytes) {
                      const decodedBody = this.utils.bon.decode(bodyBytes)
                      gameLogger.debug('BON Blob解码成功:', packet.cmd, decodedBody)
                      // 不修改packet.body，而是创建一个新的属性存储解码后的数据
                      packet.decodedBody = decodedBody
                    }
                  } else {
                    gameLogger.warn('BON解码器不可用 (Blob)')
                  }
                } catch (error) {
                  gameLogger.error('BON Blob消息体解码失败:', error.message, packet.cmd)
                }
              }

              // 更新 ack 为服务端最新的 seq（若存在）
              const actualPacket = packet._raw || packet
              const incomingSeq = (typeof actualPacket?.seq === 'number') ? actualPacket.seq :
                (typeof packet?.seq === 'number') ? packet.seq : undefined
              if (typeof incomingSeq === 'number' && incomingSeq >= 0) {
                this.ack = incomingSeq
              }

              if (this.showMsg) {
                // 收到Blob消息
              }

              // 回调处理
              if (this.messageListener) {
                this.messageListener(packet)
              }

              // Promise 响应处理
              this._handlePromiseResponse(packet)

            } catch (error) {
              gameLogger.error('Blob解析失败:', error.message)
            }
          })
          return // 异步处理，直接返回
        } else {
          gameLogger.warn('未知数据类型:', typeof evt.data, evt.data)
          packet = evt.data
        }

        if (this.showMsg) {
          gameLogger.verbose('收到消息:', packet)
        }

        // 处理消息体解码（ProtoMsg会自动解码）
        if (packet instanceof Object && packet.rawData !== undefined) {
          gameLogger.verbose('ProtoMsg消息，使用rawData:', packet.rawData)
        } else {
          // 处理可能存在_raw包装的情况
          const actualPacket = packet._raw || packet

          // 更新 ack 为服务端最新的 seq（若存在）
          const incomingSeq = (typeof actualPacket.seq === 'number') ? actualPacket.seq :
            (typeof packet.seq === 'number') ? packet.seq : undefined
          if (typeof incomingSeq === 'number' && incomingSeq >= 0) {
            this.ack = incomingSeq
          }

          if (actualPacket.body && this.shouldDecodeBody(actualPacket.body)) {
            try {
              if (this.utils && this.utils.bon && this.utils.bon.decode) {
                // 转换body数据为Uint8Array
                const bodyBytes = this.convertToUint8Array(actualPacket.body)
                if (bodyBytes) {
                  const decodedBody = this.utils.bon.decode(bodyBytes)
                  gameLogger.debug('BON解码成功:', actualPacket.cmd || packet.cmd, decodedBody)
                  // 将解码后的数据存储到原始packet中
                  packet.decodedBody = decodedBody
                  // 如果有_raw结构，也存储到_raw中
                  if (packet._raw) {
                    packet._raw.decodedBody = decodedBody
                  }
                }
              } else {
                gameLogger.warn('BON解码器不可用')
              }
            } catch (error) {
              gameLogger.error('BON消息体解码失败:', error.message, actualPacket.cmd || packet.cmd)
            }
          }
        }

        // 回调处理
        if (this.messageListener) {
          this.messageListener(packet)
        }

        // Promise 响应处理
        this._handlePromiseResponse(packet)

      } catch (error) {
        gameLogger.error('消息处理失败:', error.message)
      }
    }

    this.socket.onclose = (evt) => {
      wsLogger.info(`WebSocket 连接关闭: ${evt.code} ${evt.reason || ''}`)
      wsLogger.debug('关闭详情:', {
        code: evt.code,
        reason: evt.reason || '未提供原因',
        wasClean: evt.wasClean,
        timestamp: new Date().toISOString()
      })
      this.connected = false
      this._clearTimers()
      if (this.onDisconnect) this.onDisconnect(evt)
    }

    this.socket.onerror = (error) => {
      wsLogger.error('WebSocket 错误:', error)
      this.connected = false
      this._clearTimers()
      if (this.onError) this.onError(error)
    }
  }

  /** 注册消息回调 */
  setMessageListener(fn) {
    this.messageListener = fn
  }

  /** 控制台消息开关 */
  setShowMsg(val) {
    this.showMsg = !!val
  }

  /** 判断是否需要解码body */
  shouldDecodeBody(body) {
    if (!body) return false

    // Uint8Array或Array格式
    if (body instanceof Uint8Array || Array.isArray(body)) {
      return true
    }

    // 对象格式的数字数组（从图片中看到的格式）
    if (typeof body === 'object' && body.constructor === Object) {
      // 检查是否是数字键的对象（例如 {"0": 8, "1": 2, ...}）
      const keys = Object.keys(body)
      return keys.length > 0 && keys.every(key => !isNaN(parseInt(key)))
    }

    return false
  }

  /** 转换body为Uint8Array */
  convertToUint8Array(body) {
    if (!body) return null

    if (body instanceof Uint8Array) {
      return body
    }

    if (Array.isArray(body)) {
      return new Uint8Array(body)
    }

    // 对象格式的数字数组转换为Uint8Array
    if (typeof body === 'object' && body.constructor === Object) {
      const keys = Object.keys(body).map(k => parseInt(k)).sort((a, b) => a - b)
      if (keys.length > 0) {
        const maxIndex = Math.max(...keys)
        const arr = new Array(maxIndex + 1).fill(0)
        for (const [key, value] of Object.entries(body)) {
          const index = parseInt(key)
          if (!isNaN(index) && typeof value === 'number') {
            arr[index] = value
          }
        }
        gameLogger.debug('转换对象格式body为Uint8Array:', arr.length, 'bytes')
        return new Uint8Array(arr)
      }
    }

    return null
  }

  /** 尝试为日志解码BON体，成功返回对象 */
  decodeBodyForLog(body) {
    if (!body) return null
    const decoder = this.utils?.bon?.decode
    if (typeof decoder !== 'function') return null

    let bytes = null
    if (body instanceof Uint8Array) {
      bytes = body
    } else if (Array.isArray(body)) {
      bytes = new Uint8Array(body)
    } else if (this.shouldDecodeBody(body)) {
      bytes = this.convertToUint8Array(body)
    }

    if (!bytes) return null

    try {
      return decoder(bytes)
    } catch (error) {
      gameLogger.warn('日志解析BON失败:', error.message)
      return null
    }
  }

  /** 重连（防重复连接版本） */
  reconnect() {
    // 防止重复重连
    if (this.isReconnecting) {
      wsLogger.debug('重连已在进行中，跳过此次重连请求')
      return
    }

    this.isReconnecting = true
    wsLogger.info('开始WebSocket重连...')

    // 先断开现有连接
    this.disconnect()

    // 延迟重连，避免过于频繁
    setTimeout(() => {
      try {
        this.init()
      } finally {
        // 无论成功或失败都重置重连状态
        setTimeout(() => {
          this.isReconnecting = false
        }, 2000) // 2秒后允许下次重连
      }
    }, 1000)
  }

  /** 断开连接 */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.connected = false
    this._clearTimers()
  }

  /** 发送消息 */
  send(cmd, params = {}, options = {}) {
    if (!this.connected) {
      wsLogger.warn(`WebSocket 未连接，消息已入队: ${cmd}`)
      // 防止频繁重连
      if (!this.dialogStatus && !this.isReconnecting) {
        this.dialogStatus = true
        wsLogger.info('自动触发重连...')
        this.reconnect()
        setTimeout(() => { this.dialogStatus = false }, 2000)
      }
    }

    // 移除特定命令的控制台直出日志，统一用 wsLogger 控制

    // 统一在入队时分配 seq，避免与 Promise 版本竞争导致重复
    const assignedSeq = (options.seq !== undefined)
      ? options.seq
      : (cmd === 'heart_beat' ? 0 : ++this.seq)

    const task = {
      cmd,
      params,
      seq: assignedSeq,
      respKey: options.respKey || cmd,
      sleep: options.sleep || 0,
      onSent: options.onSent
    }

    this.sendQueue.push(task)
    return task
  }

  /** Promise 版发送 */
  sendWithPromise(cmd, params = {}, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.connected && !this.socket) {
        return reject(new Error("WebSocket 连接已关闭"))
      }

      // 为此请求生成唯一的seq值
      const requestSeq = ++this.seq

      // 设置 Promise 状态，使用seq作为键
      this.promises[requestSeq] = { resolve, reject, originalCmd: cmd }

      // 超时处理
      const timer = setTimeout(() => {
        delete this.promises[requestSeq]
        reject(new Error(`请求超时: ${cmd} (${timeoutMs}ms)`))
      }, timeoutMs)

      // 发送消息，直接传递seq
      this.send(cmd, params, {
        seq: requestSeq,
        onSent: () => {
          // 消息发送成功后，不要清除超时器，让它继续等待响应
          // 只有在收到响应或超时时才清除
        }
      })
    })
  }

  /** 发送心跳 */
  sendHeartbeat() {
    wsLogger.verbose('发送心跳消息')
    this.send("heart_beat", {}, { respKey: "_sys/ack" })
  }

  /** 获取角色信息 */
  getRoleInfo(params = {}) {
    return this.sendWithPromise("role_getroleinfo", params)
  }

  /** 获取数据版本 */
  getDataBundleVersion(params = {}) {
    return this.sendWithPromise("system_getdatabundlever", params)
  }

  /** 签到 */
  signIn() {
    return this.sendWithPromise("system_signinreward")
  }

  /** 领取日常任务奖励 */
  claimDailyReward(rewardId = 0) {
    return this.sendWithPromise("task_claimdailyreward", { rewardId })
  }

  /** =============== 内部方法 =============== */

  /** 设置心跳 */
  _setupHeartbeat() {
    // 延迟3秒后开始发送第一个心跳，避免连接刚建立就发送
    setTimeout(() => {
      if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
        wsLogger.debug('开始发送首次心跳')
        this.sendHeartbeat()
      }
    }, 3000)

    // 设置定期心跳
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
        this.sendHeartbeat()
      } else {
        wsLogger.warn('心跳检查失败: 连接状态异常')
      }
    }, this.heartbeatInterval)
  }

  /** 队列处理循环 */
  _processQueueLoop() {
    if (this.sendQueueTimer) clearInterval(this.sendQueueTimer)

    this.sendQueueTimer = setInterval(async () => {
      if (!this.sendQueue.length) return
      if (!this.connected || this.socket?.readyState !== WebSocket.OPEN) return

      const task = this.sendQueue.shift()
      if (!task) return

      try {
        // 直接使用任务指定的 seq（已在入队时分配）
        const raw = this.registry.build(task.cmd, this.ack, task.seq, task.params)

        // 发送前日志（仅标准五段）
        if (raw && raw.cmd !== '_sys/ack') {
          const decodedBody = this.decodeBodyForLog(raw.body)
          wsLogger.info('📤 发送报文', {
            cmd: raw.cmd,
            ack: raw.ack ?? 0,
            seq: raw.seq ?? 0,
            time: raw.time,
            body: decodedBody ?? formatBodyForLog(raw.body)
          })
        }

        // 自增逻辑已在入队时统一处理，这里不再修改 this.seq

        // 编码并发送
        const bin = this.registry.encodePacket(raw)
        this.socket?.send(bin)

        if (this.showMsg || task.cmd === "heart_beat") {
          wsLogger.wsMessage('local', task.cmd, false)
          if (this.showMsg) {
            wsLogger.verbose('原始数据:', raw)
            wsLogger.verbose('编码后数据:', bin)
            wsLogger.verbose('编码类型:', typeof bin, bin instanceof Uint8Array ? 'Uint8Array (加密)' : 'String (明文)')
            if (bin instanceof Uint8Array && bin.length > 0) {
              wsLogger.verbose(`加密验证: 前8字节 [${Array.from(bin.slice(0, 8)).join(', ')}]`)
            }
          }
        }

        // 触发发送回调
        if (task.onSent) {
          try {
            const meta = {
              respKey: task.respKey,
              cmd: task.cmd,
              seq: raw?.seq ?? task.seq,
              ack: raw?.ack ?? this.ack,
              time: raw?.time ?? Date.now()
            }
            task.onSent(meta)
          } catch (error) {
            wsLogger.warn('发送回调执行失败:', error)
          }
        }

        // 可选延时
        if (task.sleep) await sleep(task.sleep)

      } catch (error) {
        wsLogger.error(`发送消息失败: ${task.cmd}`, error)
      }
    }, 50)
  }

  /** 处理 Promise 响应 */
  _handlePromiseResponse(packet) {
    // 优先使用resp字段进行响应匹配（新的正确方式）
    if (packet.resp !== undefined && this.promises[packet.resp]) {
      const promiseData = this.promises[packet.resp]
      delete this.promises[packet.resp]

      // 获取响应数据，优先使用 rawData（ProtoMsg 自动解码），然后 decodedBody（手动解码），最后 body
      const responseBody = packet.rawData !== undefined ? packet.rawData :
        packet.decodedBody !== undefined ? packet.decodedBody :
          packet.body

      if (packet.code === 0 || packet.code === undefined) {
        promiseData.resolve(responseBody || packet)
      } else {
        promiseData.reject(new Error(`服务器错误: ${packet.code} - ${packet.hint || '未知错误'}`))
      }
      return
    }

    // 兼容旧的基于cmd名称的匹配方式（保留为向后兼容）
    const cmd = packet.cmd
    if (!cmd) return
    const respCmdKey = typeof cmd === 'string' ? cmd.toLowerCase() : cmd

    // 命令到响应的映射 - 处理响应命令与原始命令不匹配的情况
    const responseToCommandMap = {
      // 1:1 响应映射（优先级高）
	  'fight_startpvpresp': 'fight_startpvp',
      'activity_getresp': 'activity_get',
      'collection_goodslistresp': 'collection_goodslist',
      'collection_claimfreerewardresp': 'collection_claimfreereward',
      'legion_getarearankresp': 'legion_getarearank',
      'legionwar_getgoldmonthwarrankresp': 'legionwar_getgoldmonthwarrank',
      'nightmare_getroleinforesp': 'nightmare_getroleinfo',
      'studyresp': 'study_startgame',
      'role_getroleinforesp': 'role_getroleinfo',
      'hero_recruitresp': 'hero_recruit',
      'friend_batchresp': 'friend_batch',
      'system_claimhanguprewardresp': 'system_claimhangupreward',
      'item_openboxresp': ['item_openbox', 'item_batchclaimboxpointreward'],
      'bottlehelper_claimresp': 'bottlehelper_claim',
      'bottlehelper_startresp': 'bottlehelper_start',
      'bottlehelper_stopresp': 'bottlehelper_stop',
      'legion_signinresp': 'legion_signin',
      'fight_startbossresp': 'fight_startboss',
      'fight_startlegionbossresp': 'fight_startlegionboss',
      'fight_startareaarenaresp': 'fight_startareaarena',
      'arena_startarearesp': 'arena_startarea',
      'arena_getareatargetresp': 'arena_getareatarget',
      'arena_getarearankresp': 'arena_getarearank',
      'presetteam_saveteamresp': 'presetteam_saveteam',
      'presetteam_getinforesp': 'presetteam_getinfo',
      'mail_claimallattachmentresp': 'mail_claimallattachment',
      'store_buyresp': 'store_purchase',
      'system_getdatabundleverresp': 'system_getdatabundlever',
      'tower_claimrewardresp': 'tower_claimreward',
      'fight_starttowerresp': 'fight_starttower',
      'evotowerinforesp': 'evotower_getinfo',
      'evotower_fightresp': 'evotower_fight',
      // 咸王宝库
      'matchteam_getroleteaminforesp': 'matchteam_getroleteaminfo',
      'bosstower_getinforesp': 'bosstower_getinfo',
      'bosstower_startbossreso': 'bosstower_startboss',
      'bosstower_startboxresp': 'bosstower_startbox',
      'discount_getdiscountinforesp': 'discount_getdiscountinfo',
      // 升星相关响应映射
      'hero_heroupgradestarresp': 'hero_heroupgradestar',
      'book_upgraderesp': 'book_upgrade',
      'book_claimpointrewardresp': 'book_claimpointreward',
      // 军团信息
      'legion_getinforesp': 'legion_getinfo',
      'legion_getinforresp': 'legion_getinfo',
      // 车辆相关响应映射
      'car_getrolecarresp': 'car_getrolecar',
      'car_refreshresp': 'car_refresh',
      'car_claimresp': 'car_claim',
      'car_sendresp': 'car_send',
      'car_getmemberhelpingcntresp': 'car_getmemberhelpingcnt',
      'role_gettargetteamresp': 'role_gettargetteam',
      'activity_warorderclaimresp': 'activity_recyclewarorderrewardclaim',
      'arena_getarearankresp': 'arena_getarearank',
      'bosstower_gethelprankresp': 'bosstower_gethelprank',
      // 特殊响应映射 - 有些命令有独立响应，有些用同步响应
      'task_claimdailyrewardresp': 'task_claimdailyreward',
      'task_claimweekrewardresp': 'task_claimweekreward',

      // 同步响应映射（优先级低）
      'syncresp': ['system_mysharecallback', 'task_claimdailypoint'],
      'syncrewardresp': ['system_buygold', 'discount_claimreward', 'card_claimreward',
                        'artifact_lottery', 'genie_sweep', 'genie_buysweep','system_signinreward','dungeon_selecthero']
    }

    // 获取原始命令名（支持一对一和一对多映射）
    // 使用小写进行映射匹配，兼容服务端大小写差异
    let originalCmds = responseToCommandMap[respCmdKey]
    if (!originalCmds) {
      originalCmds = [respCmdKey] // 如果没有映射，使用响应命令本身（小写）
    } else if (typeof originalCmds === 'string') {
      originalCmds = [originalCmds] // 转换为数组
    }

    // 查找对应的 Promise - 遍历所有等待中的 Promise（向后兼容）
    for (const [requestId, promiseData] of Object.entries(this.promises)) {
      // 检查 Promise 是否匹配当前响应的任一原始命令
      if (originalCmds.includes(promiseData.originalCmd)) {
        delete this.promises[requestId]

        // 获取响应数据，优先使用 rawData（ProtoMsg 自动解码），然后 decodedBody（手动解码），最后 body
        const responseBody = packet.rawData !== undefined ? packet.rawData :
          packet.decodedBody !== undefined ? packet.decodedBody :
            packet.body

        if (packet.code === 0 || packet.code === undefined) {
          promiseData.resolve(responseBody || packet)
        } else {
          promiseData.reject(new Error(`服务器错误: ${packet.code} - ${packet.hint || '未知错误'}`))
        }
        break
      }
    }
  }

  /** 清理定时器 */
  _clearTimers() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.sendQueueTimer) {
      clearInterval(this.sendQueueTimer)
      this.sendQueueTimer = null
    }
  }
}

/** 默认导出 */
export default XyzwWebSocketClient
