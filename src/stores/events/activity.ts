import { gameLogger } from "@/utils/logger";
import { type EVM, type XyzwSession } from "./index";

// 处理_ack事件，通常用于确认收到某些重要消息
export const AckPlugin = ({
  onSome,
  $emit
}: EVM) => {
  onSome(["activity_getresp", "activity_get"], (data: XyzwSession) => {
    gameLogger.verbose(`收到活动信息事件: ${data.tokenId}`, data);
    const { body } = data;
    gameLogger.debug("活动信息body:", body);
    if (!body) {
      gameLogger.debug("活动信息响应为空");
      return;
    }
    // 假设 activity_get 返回的 body 就是活动信息对象，或者包含 activities 字段
    // 如果 body 是数组，可能需要转换。这里先按原样存储，后续根据实际数据调整
    data.gameData.value.commonActivityInfo = body;
    data.gameData.value.lastUpdated = new Date().toISOString();
  });
};