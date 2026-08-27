export const DEFAULT_WEIRD_TOWER_MAX_CLIMB = 100;

export function normalizeWeirdTowerMaxClimb(
  value,
  fallback = DEFAULT_WEIRD_TOWER_MAX_CLIMB,
) {
  const raw = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  const numericValue = Number(raw);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const integerValue = Math.trunc(numericValue);

  return integerValue > 0 ? integerValue : fallback;
}
