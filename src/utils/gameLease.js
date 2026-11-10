export const GAME_LEASE_TTL = 120000;

export function claimGameLease(
  leases,
  tokenId,
  owner,
  identity,
  now = Date.now(),
) {
  const active = Object.fromEntries(
    Object.entries(leases).filter(([, lease]) => lease?.expiresAt > now),
  );
  if (
    Object.entries(active).some(
      ([id, lease]) =>
        (id === tokenId || lease.identity === identity) &&
        lease.owner !== owner,
    )
  ) {
    throw new Error("该角色已在其他游戏窗口运行，请先关闭已有窗口");
  }
  return {
    // Keep unrelated leases so suspended windows can renew after the browser resumes.
    ...leases,
    [tokenId]: { owner, identity, expiresAt: now + GAME_LEASE_TTL },
  };
}

export function renewGameLease(leases, tokenId, owner, now = Date.now()) {
  const lease = leases[tokenId];
  if (!lease || lease.owner !== owner) return null;
  return claimGameLease(leases, tokenId, owner, lease.identity, now);
}

export function removeGameLease(leases, tokenId, owner) {
  if (!owner || leases[tokenId]?.owner !== owner) return leases;
  const next = { ...leases };
  delete next[tokenId];
  return next;
}
