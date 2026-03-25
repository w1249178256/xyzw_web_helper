/**
 * 根据 GenRandomSeed 逻辑生成随机种子
 * 参考原始客户端在登录后推送 randomSeed 的实现
 */

const XOR_A = 2118920861;
const XOR_B = 797788954;
const XOR_C = 1513922175;

/**
 * 通过 last:login:time 计算 randomSeed
 * @param lastLoginTime seconds since epoch (可为 number / string)
 */
export function generateRandomSeed(lastLoginTime?: number | string | null) {
  if (lastLoginTime === undefined || lastLoginTime === null) {
    return 0;
  }

  const numericTime = Number(lastLoginTime);
  if (Number.isNaN(numericTime)) {
    return 0;
  }

  let seed = numericTime | 0;
  seed ^= XOR_A;
  seed = ((seed << 16) | (seed >>> 16)) >>> 0;
  seed ^= XOR_B;
  seed ^= XOR_C;
  return seed >>> 0;
}
