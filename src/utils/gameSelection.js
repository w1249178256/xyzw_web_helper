export function toggleTokenSelection(current, tokenId, checked) {
  const next = new Set(current);
  if (checked) next.add(tokenId);
  else next.delete(tokenId);
  return next;
}

export function selectAllTokenIds(tokens) {
  return new Set(tokens.map((token) => token.id));
}

export function pruneTokenSelection(current, tokens) {
  const available = new Set(tokens.map((token) => token.id));
  return new Set([...current].filter((tokenId) => available.has(tokenId)));
}
