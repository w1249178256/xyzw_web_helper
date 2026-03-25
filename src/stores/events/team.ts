import { gameLogger } from "@/utils/logger";
import type { EVM, XyzwSession } from ".";

export const TeamPlugin = ({
  onSome,
  $emit
}: EVM) => {

  onSome(
    [
      "team_getteaminfo",
      "team_getteaminforesp",
      "role_gettargetteam",
      "role_gettargetteamresp",
    ],
    (data: XyzwSession) => {
      gameLogger.verbose(`收到队伍信息事件: ${data.tokenId}`, data);
      const { body, gameData, cmd } = data;
      if (!body) {
        gameLogger.debug("队伍信息响应为空");
        return;
      }
      // 更新队伍数据
      if (!gameData.value.presetTeam) {
        gameData.value.presetTeam = {};
      }
      gameData.value.presetTeam = { ...gameData.value.presetTeam, ...body };
      data.gameData.value.lastUpdated = new Date().toISOString();
    },
  );

  onSome(
    [
      "presetteam_setteam",
      "presetteam_setteamresp",
      "presetteam_saveteam",
      "presetteam_saveteamresp",
    ],
    (data: XyzwSession) => {
      gameLogger.verbose(`收到队伍信息事件: ${data.tokenId}`, data);
      const { body, gameData, cmd } = data;
      if (!body) {
        gameLogger.debug("队伍信息响应为空");
        return;
      }
      // 更新队伍数据
      if (!gameData.value.presetTeam) {
        gameData.value.presetTeam = {};
      }
      // 设置/保存队伍响应 - 可能只返回确认信息
      if (body.presetTeamInfo) {
        gameData.value.presetTeam.presetTeamInfo = body.presetTeamInfo;
      }
      // 合并其他队伍相关数据
      Object.keys(body).forEach((key) => {
        if (key.includes("team") || key.includes("Team")) {
          gameData.value.presetTeam[key] = body[key];
        }
      });
    },
  );

}