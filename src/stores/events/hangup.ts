import { gameLogger } from "@/utils/logger";
import type { EVM, XyzwSession } from ".";

export const HangupPlugin = ({ onSome, $emit }: EVM) => {
  onSome(
    ["system_claimhangupreward", "system_claimhanguprewardresp"],
    async (data: XyzwSession) => {
      gameLogger.verbose(`收到加钟/时钟信息事件: ${data.tokenId}`, data);
      const { client } = data;
      client?.debounceSend("role_getroleinfo", {});
    },
  );

  onSome(["syncresp", "system_mysharecallback"], async (data: XyzwSession) => {
    const { client, body } = data;
    if (body?.role?.battleTeam || body?.role?.heroes || body?.role?.custom) {
      return;
    }
    gameLogger.verbose(`收到加钟/时钟信息事件: ${data.tokenId}`, data);
    client?.debounceSend("role_getroleinfo", {});
  });
};
