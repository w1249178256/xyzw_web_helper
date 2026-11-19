/**
 * 赛事（PK 房间）预约任务
 * 包含: batchAppointPkRoom
 *
 * 协议（2026-11-18 实机抓包，账号 89026144 / 23:58）：
 *   pkroom_getfightroominfo {}             → { roomId, roomName, curRoleNum, startTime, rule... }
 *   pkroom_appoint {}                      → code 11900050 "感谢您预约本场比赛，开赛后可领取奖励"
 *                                            + syncresp: statistics["pk:appoint:room:id"] = roomId
 *
 * 注意：预约目标由服务端决定（当前赛事房间），请求体是空对象；
 * 11900050 不是失败码，文案是正向的，必须当成功处理。
 */
import { runWithDailyTaskLock } from "@/utils/dailyTaskState";

/**
 * 创建赛事预约任务执行器
 * @param {object} deps - 依赖项
 * @returns {object} 任务函数集合
 */
export function createTasksPkRoom(deps) {
  const {
    selectedTokens,
    tokens,
    tokenStatus,
    isRunning,
    shouldStop,
    ensureConnection,
    releaseConnectionSlot,
    connectionQueue,
    batchSettings,
    tokenStore,
    addLog,
    message,
    currentRunningTokenId,
  } = deps;

  /** 预约返回的正向文案（"感谢您预约本场比赛…"）会被当成非 0 码抛出，这里判成成功 */
  const isAppointSuccessText = (text) =>
    /预约/.test(text) && !/失败|不足|异常/.test(text);
  const isAlreadyAppointed = (text) => /已预约|已经预约/.test(text);

  /**
   * 一键预约当前赛事房间。
   * 每个账号先查一次当前赛事（拿到房间名/开赛时间，便于日志核对），再发预约。
   * @returns {Promise<void>} 全部账号处理完或用户停止后 resolve
   */
  const batchAppointPkRoom = async () => {
    if (isRunning.value || selectedTokens.value.length === 0) return;
    isRunning.value = true;
    shouldStop.value = false;
    const label = "一键预约赛事";

    selectedTokens.value.forEach((id) => {
      tokenStatus.value[id] = "waiting";
    });

    const taskPromises = selectedTokens.value.map(async (tokenId) => {
      if (shouldStop.value) return;
      tokenStatus.value[tokenId] = "running";
      const token = tokens.value.find((t) => t.id === tokenId);
      if (!token) {
        tokenStatus.value[tokenId] = "failed";
        return;
      }

      try {
        await runWithDailyTaskLock(tokenId, async () => {
          let ownsSlot = false;
          const log = (text, type = "info") =>
            addLog({
              time: new Date().toLocaleTimeString(),
              message: `${token.name}: ${text}`,
              type,
            });
          const check = () => {
            if (
              shouldStop.value ||
              tokenStore.getWebSocketStatus(tokenId) !== "connected"
            ) {
              const error = new Error("任务已停止或连接已断开");
              error.interrupted = true;
              throw error;
            }
          };

          try {
            await ensureConnection(tokenId, 2, (owned) => {
              ownsSlot = owned;
            });
            check();

            // 1) 当前赛事信息（房间号/名称/开赛时间）
            let room = null;
            try {
              const info = await tokenStore.sendMessageWithPromise(
                tokenId,
                "pkroom_getfightroominfo",
                {},
                10000,
              );
              room = info?.roomInfo || info || null;
            } catch (error) {
              log(`查询当前赛事失败：${error.message || error}`, "warning");
            }
            check();

            if (room?.roomId) {
              const startTime = Number(room.startTime)
                ? new Date(Number(room.startTime) * 1000).toLocaleString()
                : "未知";
              log(
                `当前赛事：${room.roomName || room.roomId}｜开赛 ${startTime}｜已报名 ${room.curRoleNum ?? "?"}`,
              );
            }

            // 2) 预约（无参数，服务端按当前赛事处理）
            try {
              await tokenStore.sendMessageWithPromise(
                tokenId,
                "pkroom_appoint",
                {},
                10000,
              );
              tokenStatus.value[tokenId] = "completed";
              log("预约成功", "success");
            } catch (error) {
              const text = String(error.message || error);
              if (isAlreadyAppointed(text)) {
                tokenStatus.value[tokenId] = "completed";
                log("本场已预约过，跳过", "info");
              } else if (isAppointSuccessText(text)) {
                tokenStatus.value[tokenId] = "completed";
                log(
                  `预约成功（${text.replace(/^服务器错误:\s*\d+\s*-\s*/, "")}）`,
                  "success",
                );
              } else {
                throw error;
              }
            }
          } finally {
            if (ownsSlot) {
              try {
                tokenStore.closeWebSocketConnection(tokenId);
              } finally {
                releaseConnectionSlot();
              }
            }
            log(
              `连接清理结束 (队列: ${connectionQueue.active}/${batchSettings.maxActive})`,
            );
          }
        });
      } catch (error) {
        tokenStatus.value[tokenId] = error.interrupted ? "stopped" : "failed";
        addLog({
          time: new Date().toLocaleTimeString(),
          message: `${token.name} ${label}: ${error.message || "未知错误"}`,
          type: error.interrupted ? "warning" : "error",
        });
      }
    });

    try {
      await Promise.all(taskPromises);
    } finally {
      isRunning.value = false;
      currentRunningTokenId.value = null;
    }
    message.success(`批量${label}结束`);
  };

  return { batchAppointPkRoom };
}
