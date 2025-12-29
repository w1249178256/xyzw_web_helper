
import { gameLogger } from '@/utils/logger';
import { XyzwWebSocketClient } from '@/utils/xyzwWebSocket.js';
import { EventEmitter } from 'event-emitter3';

import { StudyPlugin } from './study.js';
import { useLocalStorage } from '@vueuse/core';

const chatMsgList = useLocalStorage<any>('xyzw_chat_msg_list', []);

export const $emit = new EventEmitter();
export const events: Set<string> = new Set<string>();

export const onSome = (event: string[], listener: (...args: any[]) => void) => {
  event.map((e) => events.add(e));
  event.forEach(evt => {
    $emit.on(evt, listener);
  })
}

export const emitPlus = (event: string | symbol, ...args: Array<any>): boolean => {
  if (events.has(event as string)) {
    return $emit.emit(event, ...args);
  } else {
    return $emit.emit('$any', event, ...args);
  }
}

export interface Session {
  id: string;
  tokenId: string;
  cmd: string;
  token: any;
  body: any;
  client: XyzwWebSocketClient | null;
  gameData: any;
}

export interface EVM {
  onSome: (event: string[], listener: (...args: any[]) => void) => void;
  emitPlus: (event: string | symbol, ...args: Array<any>) => boolean;
  $emit: EventEmitter;
}

$emit.on('$any', (cmd: string, data: Session) => {
  console.log(`收到未处理事件: ${cmd} TokenID: ${data.tokenId}`, data);
});

StudyPlugin({
  onSome,
  emitPlus,
  $emit
});

onSome(['_sys/ack'], (data: Session) => {
});

// omail_newmailnotify   邮件

onSome(['system_newchatmessagenotify', 'system_newchatmessagenotifyresp'], (data: Session) => {
  gameLogger.info(`收到新聊天消息事件: ${data.tokenId}`, data);
  const { body, gameData } = data;
  if (!body || !body.chatMessage) {
    gameLogger.debug('聊天消息响应为空或格式不正确');
    return;
  }
  chatMsgList.value.push(body.chatMessage);
});

onSome(['role_getroleinforesp', 'role_getroleinfo'], (data: Session) => {
  gameLogger.verbose(`收到角色信息事件: ${data.tokenId}`, data);
  const { body } = data;
  data.gameData.value.roleInfo = body;
  data.gameData.value.lastUpdated = new Date().toISOString()
  if (body.role?.study?.maxCorrectNum !== undefined) {
    $emit.emit('I-study', data);
  }
});

onSome(['legion_getinfo', 'legion_getinforesp', 'legion_getinfor', 'legion_getinforresp'], (data: Session) => {
  gameLogger.verbose(`收到军团信息事件: ${data.tokenId}`, data);
  const { body } = data;
  if (!body) {
    gameLogger.debug('军团信息响应为空');
    return;
  }
  data.gameData.value.legionInfo = body;
  data.gameData.value.lastUpdated = new Date().toISOString()
});

onSome(['activity_getresp', 'activity_get'], (data: Session) => {
  gameLogger.verbose(`收到活动信息事件: ${data.tokenId}`, data);
  const { body } = data;
  console.log("🚀 ~ body:", body)
  if (!body) {
    gameLogger.debug('活动信息响应为空');
    return;
  }
  // 假设 activity_get 返回的 body 就是活动信息对象，或者包含 activities 字段
  // 如果 body 是数组，可能需要转换。这里先按原样存储，后续根据实际数据调整
  data.gameData.value.commonActivityInfo = body;
  data.gameData.value.lastUpdated = new Date().toISOString()
});

onSome(['bosstower_getinforesp', 'bosstower_getinfo'], (data: Session) => {
  gameLogger.verbose(`收到咸王宝库信息事件: ${data.tokenId}`, data);
  const { body } = data;
  console.log("🚀 ~ body:", body)
  if (!body) {
    gameLogger.debug('咸王宝库响应为空');
    return;
  }

  data.gameData.value.bossTowerInfo = body;
  data.gameData.value.lastUpdated = new Date().toISOString()
});

onSome([
  'team_getteaminfo',
  'team_getteaminforesp',
  'role_gettargetteam',
  'role_gettargetteamresp'
], (data: Session) => {
  gameLogger.verbose(`收到队伍信息事件: ${data.tokenId}`, data);
  const { body, gameData, cmd } = data;
  if (!body) {
    gameLogger.debug('队伍信息响应为空');
    return;
  }
  // 更新队伍数据
  if (!gameData.value.presetTeam) {
    gameData.value.presetTeam = {}
  }
  gameData.value.presetTeam = { ...gameData.value.presetTeam, ...body }
  data.gameData.value.lastUpdated = new Date().toISOString()
});

onSome([
  'presetteam_setteam',
  'presetteam_setteamresp',
  'presetteam_saveteam',
  'presetteam_saveteamresp',
], (data: Session) => {
  gameLogger.verbose(`收到队伍信息事件: ${data.tokenId}`, data);
  const { body, gameData, cmd } = data;
  if (!body) {
    gameLogger.debug('队伍信息响应为空');
    return;
  }
  // 更新队伍数据
  if (!gameData.value.presetTeam) {
    gameData.value.presetTeam = {}
  }
  // 设置/保存队伍响应 - 可能只返回确认信息
  if (body.presetTeamInfo) {
    gameData.value.presetTeam.presetTeamInfo = body.presetTeamInfo
  }
  // 合并其他队伍相关数据
  Object.keys(body).forEach(key => {
    if (key.includes('team') || key.includes('Team')) {
      gameData.value.presetTeam[key] = body[key]
    }
  })
});

onSome(['tower_getinfo', 'tower_getinforesp'], (data: Session) => {
  gameLogger.verbose(`收到查询塔事件: ${data.tokenId}`, data);
  const { body, gameData, client } = data;
  // 保存爬塔结果到gameData中，供组件使用
  if (!gameData.value.towerResult) {
    gameData.value.towerResult = {}
  }
  if (!body) {
    gameLogger.warn('爬塔战斗开始响应为空');
    return;
  }
});

onSome(['fight_starttower', 'fight_starttowerresp'], (data: Session) => {
  gameLogger.verbose(`收到爬塔战斗开始事件: ${data.tokenId}`, data);
  const { body, gameData, client } = data;
  // 保存爬塔结果到gameData中，供组件使用
  if (!gameData.value.towerResult) {
    gameData.value.towerResult = {}
  }
  if (!body) {
    gameLogger.warn('爬塔战斗开始响应为空');
    return;
  }
  const battleData = body.battleData
  if (!battleData) {
    gameLogger.warn('爬塔战斗数据为空');
    return;
  }

  // 判断爬塔结果
  const towerId = battleData.options?.towerId
  const curHP = battleData.result?.sponsor?.ext?.curHP
  const isSuccess = curHP > 0
  gameData.value.towerResult = {
    success: isSuccess,
    curHP,
    towerId,
    timestamp: Date.now()
  }
  gameData.value.lastUpdated = new Date().toISOString()

  // 检查是否需要自动领取奖励
  if (!isSuccess && towerId == undefined) {
    return;
  }

  const layer = towerId % 10
  const rewardFloor = Math.floor(towerId / 10)

  // 如果是新层数的第一层(layer=0)，检查是否有奖励可领取
  if (layer === 0) {
    setTimeout(() => {
      const roleInfo = gameData.value.roleInfo
      const towerRewards = roleInfo?.role?.tower?.reward

      if (towerRewards && !towerRewards[rewardFloor]) {
        // 保存奖励信息
        gameData.value.towerResult.autoReward = true
        gameData.value.towerResult.rewardFloor = rewardFloor
        client?.send('tower_claimreward', { rewardId: rewardFloor })
      }
    }, 1500)
  }

  // 爬塔后立即更新角色信息和塔信息
  setTimeout(() => {
    try {
      client?.send('role_getroleinfo', {})
    } catch (error) {
      // 忽略更新数据错误
    }
  }, 1000)
});


onSome(['tower_claimreward', 'tower_claimrewardresp'], (data: Session) => {
  const { body, gameData, client } = data;
  if (!body) {
    gameLogger.warn('爬塔战斗开始响应为空');
    return;
  }
  // 奖励领取成功后更新角色信息
  setTimeout(() => {
    client?.send('role_getroleinfo', {})
  }, 500)
});