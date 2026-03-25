'use strict';

const { GameClient } = require('./wsClient');
const { parseGameToken } = require('./tokenParser');

const COMMAND_DELAY = 500;

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Execute a single named task for a single game token.
 */
async function executeTaskForToken(taskName, tokenData, batchSettings, log) {
  const actualToken = parseGameToken(tokenData);
  const client = new GameClient(actualToken, {
    log,
    connectTimeout: (batchSettings && batchSettings.connectionTimeout) || 15000,
  });

  try {
    log(`连接游戏服务器: ${tokenData.name || tokenData.id}`);
    await client.connect();
    log(`已连接: ${tokenData.name || tokenData.id}`, 'success');

    await runTask(taskName, client, batchSettings, log);
  } finally {
    client.disconnect();
  }
}

/**
 * Execute multiple tasks for multiple tokens.
 * Tokens are processed in concurrent batches; tasks within each token run sequentially.
 */
async function executeScheduledTask(task, userTokens, batchSettings, log) {
  const selectedTokenIds = JSON.parse(task.selected_token_ids || '[]');
  const selectedTasks = JSON.parse(task.selected_tasks || '[]');

  const tokensToRun = userTokens.filter((t) => selectedTokenIds.includes(t.id));

  if (tokensToRun.length === 0) {
    log('没有可用的 token，请检查任务配置或重新保存 token', 'error');
    throw new Error('No tokens available for this task');
  }

  if (selectedTasks.length === 0) {
    log('没有选择任何子任务，请检查任务配置', 'error');
    throw new Error('No sub-tasks selected for this task');
  }

  const MAX_CONCURRENT = (batchSettings && batchSettings.maxActive) || 2;

  // Process tokens in batches of MAX_CONCURRENT
  for (let i = 0; i < tokensToRun.length; i += MAX_CONCURRENT) {
    const batch = tokensToRun.slice(i, i + MAX_CONCURRENT);
    await Promise.all(
      batch.map(async (tokenData) => {
        for (const taskName of selectedTasks) {
          try {
            await executeTaskForToken(taskName, tokenData, batchSettings, log);
            await delay((batchSettings && batchSettings.taskDelay) || COMMAND_DELAY);
          } catch (err) {
            log(`任务 ${taskName} 失败 [${tokenData.name || tokenData.id}]: ${err.message}`, 'error');
          }
        }
      }),
    );
  }
}

/**
 * Run a specific named task using an already-connected GameClient.
 */
async function runTask(taskName, client, settings, log) {
  const cmdDelay = (settings && settings.commandDelay) || COMMAND_DELAY;

  async function cmd(cmdName, params = {}) {
    const result = await client.sendWithPromise(cmdName, params, 10000);
    await delay(cmdDelay);
    return result;
  }

  switch (taskName) {
    case 'claimHangUpRewards':
      log('领取挂机奖励...');
      await cmd('system_claimhangupreward');
      for (let i = 0; i < 4; i++) {
        await cmd('system_mysharecallback', { isSkipShareCard: true, type: 2 });
      }
      log('挂机奖励领取完成', 'success');
      break;

    case 'batchAddHangUpTime':
      log('一键加钟...');
      for (let i = 0; i < 4; i++) {
        await cmd('system_mysharecallback', { isSkipShareCard: true, type: 2 });
      }
      log('加钟完成', 'success');
      break;

    case 'resetBottles':
      log('重置罐子...');
      await cmd('bottlehelper_stop', { bottleType: -1 });
      await cmd('bottlehelper_start', { bottleType: -1 });
      log('罐子重置完成', 'success');
      break;

    case 'batchlingguanzi':
      log('一键领取罐子...');
      await cmd('bottlehelper_claim');
      log('罐子领取完成', 'success');
      break;

    case 'batchLegacyClaim':
      log('领取功法残卷挂机奖励...');
      await cmd('legacy_claimhangup');
      log('功法残卷领取完成', 'success');
      break;

    case 'batchclubsign':
      log('俱乐部签到...');
      await cmd('legion_signin');
      log('俱乐部签到完成', 'success');
      break;

    case 'collection_claimfreereward':
      log('免费领取珍宝阁...');
      await cmd('collection_claimfreereward');
      log('珍宝阁领取完成', 'success');
      break;

    case 'startBatch':
      log('开始执行日常任务...');
      await runDailyBatch(client, settings, log);
      break;

    default:
      log(`未知任务: ${taskName}`, 'warning');
  }
}

/**
 * Run the full daily batch of common game tasks.
 */
async function runDailyBatch(client, settings, log) {
  const cmdDelay = (settings && settings.commandDelay) || COMMAND_DELAY;

  async function cmd(cmdName, params = {}, desc = '') {
    try {
      if (desc) log(`执行: ${desc}`);
      const result = await client.sendWithPromise(cmdName, params, 10000);
      await delay(cmdDelay);
      if (desc) log(`${desc} 完成`, 'success');
      return result;
    } catch (err) {
      if (desc) log(`${desc} 失败: ${err.message}`, 'warning');
      return null;
    }
  }

  // Get role info
  await cmd(
    'role_getroleinfo',
    {
      clientVersion: '2.10.3-f10a39eaa0c409f4-wx',
      inviteUid: 0,
      platform: 'hortor',
      platformExt: 'mix',
      scene: '',
    },
    '获取角色信息',
  );

  // Claim hangup rewards
  await cmd('system_claimhangupreward', {}, '领取挂机奖励');
  for (let i = 0; i < 4; i++) {
    await cmd('system_mysharecallback', { isSkipShareCard: true, type: 2 });
  }

  // Sign in
  await cmd('system_signinreward', {}, '签到');

  // Daily task rewards
  for (let rewardId = 1; rewardId <= 10; rewardId++) {
    await cmd('task_claimdailyreward', { rewardId }, `领取日常任务奖励${rewardId}`);
  }

  // Claim email attachments
  await cmd('mail_claimallattachment', { category: 0 }, '领取邮件附件');

  // Legion signin
  await cmd('legion_signin', {}, '俱乐部签到');

  // Collection free reward
  await cmd('collection_claimfreereward', {}, '珍宝阁免费领取');

  log('日常任务执行完成', 'success');
}

module.exports = { executeScheduledTask, executeTaskForToken };
