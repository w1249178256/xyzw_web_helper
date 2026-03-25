
import { gameLogger } from '@/utils/logger';
import { XyzwWebSocketClient } from '@/utils/xyzwWebSocket';
import { EventEmitter } from 'event-emitter3';

import { AckPlugin } from './ack.ts';
import { ChatPlugin } from './chat.ts';
import { HangupPlugin } from './hangup.ts';
import { LegionPlugin } from './legion.ts';
import { RolePlugin } from './role.ts';
import { StudyPlugin } from './study.ts';
import { TeamPlugin } from './team.ts';
import { TowerPlugin } from './tower.ts';

export const $emit = new EventEmitter();
export const events: Set<string> = new Set<string>();
$emit.on('$any', (cmd: string, data: XyzwSession) => {
  gameLogger.warn(`收到未处理事件: ${cmd} TokenID: ${data.tokenId}`, data);
});

export const onSome = (event: string[], listener: (...args: any[]) => void) => {
  event.map((e) => events.add(e));
  event.forEach(evt => {
    $emit.on(evt, listener);
  })
}

export const emitPlus = (
  event: string | symbol,
  ...args: Array<any>
): boolean => {
  // 先触发具体事件，然后触发$any事件
  const result = $emit.emit(event, ...args);
  if (!events.has(event as string)) {
    $emit.emit("$any", event, ...args);
  }
  return result;
};

export interface XyzwSession {
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

const evmInst: EVM = {
  onSome,
  emitPlus,
  $emit,
};

AckPlugin(evmInst);

RolePlugin(evmInst);

TeamPlugin(evmInst);

StudyPlugin(evmInst);

TowerPlugin(evmInst);

LegionPlugin(evmInst);

ChatPlugin(evmInst);

HangupPlugin(evmInst);







