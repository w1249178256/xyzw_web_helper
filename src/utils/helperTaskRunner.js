export const HELPER_BATCH_SIZE = 10;
export const HELPER_BATCH_DELAY_MS = 300;
export const HELPER_COMMAND_TIMEOUT_MS = 5000;
export const HELPER_RETRY_DELAY_MS = 1000;
export const HELPER_MAX_RETRIES = 2;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function buildTenBatchPlan(total, batchSize = HELPER_BATCH_SIZE) {
  const safeTotal = Math.max(0, Math.trunc(Number(total) || 0));
  const safeBatchSize = Math.max(
    1,
    Math.trunc(Number(batchSize) || HELPER_BATCH_SIZE),
  );
  const fullBatches = Math.floor(safeTotal / safeBatchSize);
  const remainder = safeTotal % safeBatchSize;
  const plan = Array.from({ length: fullBatches }, () => safeBatchSize);

  if (remainder > 0) {
    plan.push(remainder);
  }

  return plan;
}

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || "未知错误");
}

export function isRateLimitError(error) {
  const message = getErrorMessage(error);

  return message.includes("400312") || message.includes("操作过快");
}

export function getItemQuantity(roleInfo, itemId) {
  const item =
    roleInfo?.role?.items?.[itemId] ??
    roleInfo?.role?.items?.[String(itemId)] ??
    roleInfo?.items?.[itemId] ??
    roleInfo?.items?.[String(itemId)];

  const quantity = item?.quantity ?? item?.count ?? 0;
  const numericQuantity = Number(quantity);

  return Number.isFinite(numericQuantity) ? numericQuantity : 0;
}

function toFiniteNumber(value) {
  if (typeof value === "string") {
    value = value.replace(/,/g, "").trim();
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function pickNumericLeaf(value) {
  const directNumber = toFiniteNumber(value);

  if (directNumber !== null) {
    return directNumber;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const preferredKeys = [
    "canClaim",
    "claimable",
    "available",
    "value",
    "amount",
    "quantity",
    "count",
    "num",
    "points",
    "score",
  ];

  for (const key of preferredKeys) {
    const number = toFiniteNumber(value[key]);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

export function getClaimableBoxPoints(roleInfo) {
  const candidates = [
    roleInfo?.role?.boxPoint,
    roleInfo?.role?.boxPoints,
    roleInfo?.role?.box_point,
    roleInfo?.role?.box_points,
    roleInfo?.role?.boxPointReward,
    roleInfo?.role?.boxPointRewards,
    roleInfo?.role?.box_point_reward,
    roleInfo?.data?.role?.boxPoint,
    roleInfo?.data?.role?.boxPoints,
    roleInfo?.data?.role?.box_point,
    roleInfo?.data?.role?.box_points,
    roleInfo?.data?.role?.boxPointReward,
    roleInfo?.data?.role?.boxPointRewards,
    roleInfo?.data?.role?.box_point_reward,
    roleInfo?.boxPoint,
    roleInfo?.boxPoints,
    roleInfo?.box_point,
    roleInfo?.box_points,
    roleInfo?.boxPointReward,
    roleInfo?.boxPointRewards,
    roleInfo?.box_point_reward,
  ];

  for (const candidate of candidates) {
    const number = pickNumericLeaf(candidate);

    if (number !== null) {
      return Math.max(0, Math.trunc(number));
    }
  }

  const matches = [];
  const seen = new Set();
  const scan = (value, path = "", depth = 0) => {
    if (!value || typeof value !== "object" || depth > 5 || seen.has(value)) {
      return;
    }

    seen.add(value);

    for (const [key, child] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;

      if (/box[_-]?points?|box.*point|point.*box/i.test(key)) {
        const number = pickNumericLeaf(child);

        if (number !== null) {
          matches.push({ path: nextPath, number });
        }
      }

      scan(child, nextPath, depth + 1);
    }
  };

  scan(roleInfo);

  if (matches.length === 0) {
    return 0;
  }

  matches.sort((left, right) => {
    const leftClaimScore = /claim|available|reward/i.test(left.path) ? 1 : 0;
    const rightClaimScore = /claim|available|reward/i.test(right.path) ? 1 : 0;

    return rightClaimScore - leftClaimScore;
  });

  return Math.max(0, Math.trunc(matches[0].number));
}

export async function runBatchedGameCommand({
  tokenStore,
  tokenId,
  cmd,
  total,
  createParams,
  batchSize = HELPER_BATCH_SIZE,
  timeout = HELPER_COMMAND_TIMEOUT_MS,
  delayMs = HELPER_BATCH_DELAY_MS,
  retryDelayMs = HELPER_RETRY_DELAY_MS,
  maxRetries = HELPER_MAX_RETRIES,
  sleepFn = sleep,
  onProgress,
}) {
  const plan = buildTenBatchPlan(total, batchSize);
  let completed = 0;

  for (const [index, batchAmount] of plan.entries()) {
    for (let attempt = 0; ; attempt++) {
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          cmd,
          createParams(batchAmount),
          timeout,
        );
        break;
      } catch (error) {
        if (attempt >= maxRetries || !isRateLimitError(error)) {
          throw error;
        }

        await sleepFn(retryDelayMs * (attempt + 1));
      }
    }

    completed += batchAmount;
    onProgress?.({
      batchIndex: index + 1,
      batchCount: plan.length,
      batchAmount,
      completed,
      total: Math.max(0, Math.trunc(Number(total) || 0)),
    });

    if (delayMs > 0 && index < plan.length - 1) {
      await sleepFn(delayMs);
    }
  }

  return { batchCount: plan.length, completed };
}

export async function runInventoryVerifiedGameCommand({
  tokenStore,
  tokenId,
  cmd,
  itemId,
  total,
  createParams,
  queryInventory,
  batchSize = HELPER_BATCH_SIZE,
  timeout = HELPER_COMMAND_TIMEOUT_MS,
  delayMs = HELPER_BATCH_DELAY_MS,
  retryDelayMs = HELPER_RETRY_DELAY_MS,
  maxRetries = HELPER_MAX_RETRIES,
  sleepFn = sleep,
  onProgress,
}) {
  const targetTotal = Math.max(0, Math.trunc(Number(total) || 0));
  const initialRoleInfo = await queryInventory();
  let currentCount = getItemQuantity(initialRoleInfo, itemId);

  if (currentCount < targetTotal) {
    throw new Error(`库存不足：当前 ${currentCount}，需要 ${targetTotal}`);
  }

  const initialCount = currentCount;
  let verifiedConsumed = 0;
  let verificationIndex = 0;

  while (verifiedConsumed < targetTotal) {
    verificationIndex += 1;
    const remaining = targetTotal - verifiedConsumed;
    const beforeCount = currentCount;
    const plan = buildTenBatchPlan(remaining, batchSize);
    let attemptedAmount = 0;
    let lastStageError = null;

    for (const [index, batchAmount] of plan.entries()) {
      for (let attempt = 0; ; attempt++) {
        try {
          await tokenStore.sendMessageWithPromise(
            tokenId,
            cmd,
            createParams(batchAmount),
            timeout,
          );
          break;
        } catch (error) {
          lastStageError = error;

          if (attempt < maxRetries && isRateLimitError(error)) {
            await sleepFn(retryDelayMs * (attempt + 1));
            continue;
          }

          break;
        }
      }

      attemptedAmount += batchAmount;

      if (delayMs > 0 && index < plan.length - 1) {
        await sleepFn(delayMs);
      }
    }

    const roleInfo = await queryInventory();
    currentCount = getItemQuantity(roleInfo, itemId);
    const totalConsumed = Math.max(0, initialCount - currentCount);
    const consumed = totalConsumed - verifiedConsumed;

    if (consumed <= 0) {
      const errorSuffix = lastStageError
        ? `，最近错误：${getErrorMessage(lastStageError)}`
        : "";
      throw new Error(`库存未变化：${cmd} 本次没有消耗道具${errorSuffix}`);
    }

    verifiedConsumed = totalConsumed;
    onProgress?.({
      batchIndex: verificationIndex,
      batchAmount: attemptedAmount,
      consumed,
      completed: Math.min(verifiedConsumed, targetTotal),
      total: targetTotal,
      beforeCount,
      afterCount: currentCount,
    });

    if (verifiedConsumed < targetTotal && delayMs > 0) {
      await sleepFn(delayMs);
    }
  }

  return {
    completed: targetTotal,
    finalCount: currentCount,
    initialCount,
  };
}
