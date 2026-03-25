import { gameLogger } from "@/utils/logger";
import type { EVM, XyzwSession } from ".";

export const TowerPlugin = ({
  onSome,
  $emit
}: EVM) => {

  onSome(["bosstower_getinforesp", "bosstower_getinfo"], (data: XyzwSession) => {
    gameLogger.verbose(`收到咸王宝库信息事件: ${data.tokenId}`, data);
    const { body } = data;
    gameLogger.debug("咸王宝库body:", body);
    if (!body) {
      gameLogger.debug("咸王宝库响应为空");
      return;
    }

    data.gameData.value.bossTowerInfo = body;
    data.gameData.value.lastUpdated = new Date().toISOString();
  });

  onSome(
    ["evotowerinforesp", "evotower_getinforesp", "evotower_getinfo"],
    (data: XyzwSession) => {
      gameLogger.verbose(`收到怪异塔信息事件: ${data.tokenId}`, data);
      const { body } = data;
      gameLogger.debug("怪异塔body:", body);
      if (!body) {
        gameLogger.debug("怪异塔响应为空");
        return;
      }

      data.gameData.value.evoTowerInfo = body;
      data.gameData.value.lastUpdated = new Date().toISOString();
    },
  );

  onSome(["tower_getinfo", "tower_getinforesp"], (data: XyzwSession) => {
    gameLogger.verbose(`收到查询塔事件: ${data.tokenId}`, data);
    const { body, gameData, client } = data;
    // 保存爬塔结果到gameData中，供组件使用
    if (!gameData.value.towerResult) {
      gameData.value.towerResult = {};
    }
    if (!body) {
      gameLogger.warn("爬塔战斗开始响应为空");
      return;
    }
  });


  onSome(["fight_starttower", "fight_starttowerresp"], (data: XyzwSession) => {
    gameLogger.verbose(`收到爬塔战斗开始事件: ${data.tokenId}`, data);

    // 处理"上座塔奖励未领取"错误 (1500040)
    if ((data as any).code === 1500040) {
      gameLogger.warn(`爬塔失败: 上座塔奖励未领取 (Code: 1500040) - 尝试自动领取`);
      const { gameData, client } = data;
      const roleInfo = gameData.value.roleInfo;
      // 尝试从角色信息获取当前塔层数
      const towerId = roleInfo?.role?.tower?.id;

      if (towerId !== undefined) {
        // 计算应该领取的奖励层数 (例如11层时，towerId=11，应领第1层奖励)
        const rewardFloor = Math.floor(towerId / 10);
        if (rewardFloor > 0) {
          gameLogger.info(`发起自动领取奖励请求: 第${rewardFloor}层奖励`);
          client?.send("tower_claimreward", { rewardId: rewardFloor });
          
          // 领取后刷新数据
          setTimeout(() => {
            client?.send("role_getroleinfo", {});
          }, 1000);
        }
      }
      return;
    }

    const { body, gameData, client } = data;
    // 保存爬塔结果到gameData中，供组件使用
    if (!gameData.value.towerResult) {
      gameData.value.towerResult = {};
    }
    if (!body) {
      gameLogger.warn("爬塔战斗开始响应为空");
      return;
    }
    const battleData = body.battleData;
    if (!battleData) {
      gameLogger.warn("爬塔战斗数据为空");
      return;
    }

    // 判断爬塔结果
    const towerId = battleData.options?.towerId;
    const curHP = battleData.result?.sponsor?.ext?.curHP;
    const isSuccess = curHP > 0;
    gameData.value.towerResult = {
      success: isSuccess,
      curHP,
      towerId,
      timestamp: Date.now(),
    };
    gameData.value.lastUpdated = new Date().toISOString();

    // 检查是否需要自动领取奖励
    if (!isSuccess && towerId == undefined) {
      return;
    }

    const layer = towerId % 10;
    const rewardFloor = Math.floor(towerId / 10);

    // 如果是新层数的第一层(layer=0)，检查是否有奖励可领取
    if (layer === 0) {
      setTimeout(() => {
        const roleInfo = gameData.value.roleInfo;
        const towerRewards = roleInfo?.role?.tower?.reward;

        if (towerRewards && !towerRewards[rewardFloor]) {
          // 保存奖励信息
          gameData.value.towerResult.autoReward = true;
          gameData.value.towerResult.rewardFloor = rewardFloor;
          try {
            client?.send("tower_claimreward", { rewardId: rewardFloor });
          } catch (error) {
            gameLogger.error(`领取奖励失败: ${error}`);
          }
        }
      }, 1500);
    }

  });

  onSome(["tower_claimreward", "tower_claimrewardresp"], (data: XyzwSession) => {
    const { body, gameData, client } = data;
    if (!body) {
      gameLogger.warn("爬塔战斗开始响应为空");
      return;
    }
    // 奖励领取成功后更新角色信息
    setTimeout(() => {
      client?.send("role_getroleinfo", {});
    }, 500);
  });

}