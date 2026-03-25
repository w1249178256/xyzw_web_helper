import { gameLogger } from "@/utils/logger";
import type { EVM, XyzwSession } from ".";

export const LegionPlugin = ({
  onSome,
  $emit
}: EVM) => {
  onSome(
    [
      "legion_getinfo",
      "legion_getinforesp",
      "legion_getinfor",
      "legion_getinforresp",
    ],
    (data: XyzwSession) => {
      gameLogger.verbose(`收到军团信息事件: ${data.tokenId}`, data);
      const { body } = data;
      if (!body) {
        gameLogger.debug("军团信息响应为空");
        return;
      }
      data.gameData.value.legionInfo = body;
      data.gameData.value.lastUpdated = new Date().toISOString();
    },
  );

  // 俱乐部申请列表响应
  onSome(["legion_applylistresp"], (data: XyzwSession) => {
    gameLogger.debug(`收到俱乐部申请列表响应: ${data.tokenId}`, data.body);
  });
}