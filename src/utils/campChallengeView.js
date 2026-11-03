// Presentation helpers for camp regions and attendance; no network requests.
export const CAMP_SLOT_COUNT = 30;
const REGIONS = [
  { id: "upper", name: "上方区域", label: "第一区域", start: 1, end: 10 },
  { id: "middle", name: "中间区域", label: "第二区域", start: 11, end: 20 },
  { id: "lower", name: "下方区域", label: "第三区域", start: 21, end: 30 },
];
const normalizeSlot = (value) => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const slot = Number(value);
  return Number.isInteger(slot) && slot >= 1 && slot <= CAMP_SLOT_COUNT
    ? slot
    : null;
};
const knownPower = (value) => {
  if (value == null || value === "") return null;
  const power = Number(value);
  return Number.isFinite(power) && power >= 0 ? power : null;
};

/** Preserve explicit game slots and empty slots; role-ID keys use the reference ordering. */
export function buildCampMap(members, rawMembers = {}) {
  const entries = Object.entries(rawMembers || {});
  const sequential =
    entries.length > 0 &&
    entries.length <= CAMP_SLOT_COUNT &&
    entries.every(
      ([key, member]) =>
        Number(key) > CAMP_SLOT_COUNT &&
        member?.nodeId == null &&
        member?.slot == null,
    );
  const bySlot = new Map();
  let positionsConfirmed = true;
  const duplicates = new Set();
  for (const member of members) {
    const index = entries.findIndex(
      ([key, raw]) =>
        Number(key) === Number(member.slot) &&
        String(raw?.roleId) === String(member.id),
    );
    const [key, raw] = entries[index] || [];
    const slot =
      normalizeSlot(key) ??
      normalizeSlot(raw?.nodeId) ??
      normalizeSlot(raw?.slot) ??
      (sequential && index >= 0 ? index + 1 : normalizeSlot(member.slot));
    if (slot == null || !member.id) {
      positionsConfirmed = false;
      continue;
    }
    if (bySlot.has(slot) || duplicates.has(slot)) {
      positionsConfirmed = false;
      bySlot.delete(slot);
      duplicates.add(slot);
      continue;
    }
    bySlot.set(slot, { ...member, slot });
  }
  const regions = REGIONS.map((region) => {
    const slots = Array.from({ length: 10 }, (_, index) => {
      const slot = region.start + index;
      return { slot, member: bySlot.get(slot) || null };
    });
    const deployed = slots.map((item) => item.member).filter(Boolean);
    const remainingAttacks = { hard: 0, inferno: 0, defeat: 0 };
    let countsKnown = true;
    for (const member of deployed) {
      if (member.defeated) continue;
      const losses =
        member.defLosses ??
        Math.max(
          0,
          Number(member.challengeCnt || 0) - Number(member.failCnt || 0),
        );
      if (!Number.isFinite(losses)) {
        countsKnown = false;
        continue;
      }
      remainingAttacks.hard += Math.max(0, 3 - losses);
      remainingAttacks.inferno += Math.max(0, 4 - losses);
      remainingAttacks.defeat += Math.max(0, 5 - losses);
    }
    return {
      ...region,
      slots,
      deployedCount: deployed.length,
      defeatedCount: deployed.filter((member) => member.defeated).length,
      emptyCount: 10 - deployed.length,
      remainingAttacks: countsKnown ? remainingAttacks : null,
    };
  });
  return { regions, positionsConfirmed };
}

/** Keep each real member once and keep PVP power separate from camp power. */
export function getAttendanceMembers(
  members,
  campMembers = {},
  clubMembers = {},
) {
  const powers = new Map();
  for (const [key, member] of Object.entries(clubMembers || {})) {
    const power = knownPower(member?.power ?? member?.custom?.s_power);
    if (power !== null)
      powers.set(String(member?.roleId ?? member?.id ?? key), power);
  }
  for (const member of Object.values(campMembers || {})) {
    const power = knownPower(member?.power ?? member?.custom?.s_power);
    if (power !== null && !powers.has(String(member?.roleId)))
      powers.set(String(member.roleId), power);
  }
  const unique = new Map();
  for (const member of members) {
    if (member.mirror || !member.id || unique.has(String(member.id))) continue;
    unique.set(String(member.id), {
      ...member,
      clubPower: powers.get(String(member.id)) ?? null,
    });
  }
  return [...unique.values()];
}

/** Label copied rosters with the selected match date in Beijing time. */
export function getAttendanceDate(phase, day, now = Date.now()) {
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const fallback = {
    label: `${weekDays[day] || "所选比赛日"}（日期未确定）`,
    isToday: false,
  };
  const value = String(phase ?? "");
  if (!/^\d{6}$/.test(value) || !Number.isInteger(day) || day < 0 || day > 6)
    return fallback;
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4)) - 1;
  const date = Number(value.slice(4, 6));
  const monday = new Date(Date.UTC(year, month, date));
  if (
    monday.getUTCFullYear() !== year ||
    monday.getUTCMonth() !== month ||
    monday.getUTCDate() !== date ||
    monday.getUTCDay() !== 1
  )
    return fallback;
  const selectedDate = new Date(
    monday.getTime() + (day === 0 ? 6 : day - 1) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  const today = new Date(now + 8 * 3600000).toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  return {
    label: isToday
      ? `今日（${selectedDate}）`
      : `${selectedDate}（${weekDays[day]}）`,
    isToday,
  };
}
