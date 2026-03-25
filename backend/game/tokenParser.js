'use strict';

/**
 * Parse a game token from the stored token data object.
 *
 * tokenData is one item from the tokens_json array stored in the DB.
 * It has a `token` field which is the base64-encoded game token string.
 *
 * For JSON tokens (those with sessId/connId), refreshes those fields
 * with new random values to avoid stale session conflicts.
 */
function parseGameToken(tokenData) {
  const base64Token = tokenData.token;

  // Try to base64 decode
  let decoded;
  try {
    decoded = Buffer.from(base64Token, 'base64').toString('utf-8');
  } catch {
    decoded = base64Token;
  }

  // Try JSON parse
  let parsed;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    parsed = null;
  }

  // For JSON tokens with sessId/connId, refresh those fields
  if (parsed && typeof parsed === 'object' && (parsed.sessId !== undefined || parsed.connId !== undefined)) {
    const now = Date.now();
    parsed.sessId = now * 100 + Math.floor(Math.random() * 100);
    parsed.connId = now + Math.floor(Math.random() * 10);
    return JSON.stringify(parsed);
  }

  // For plain string tokens: get the actual token string
  if (parsed && typeof parsed === 'object') {
    const actualToken = parsed.token || parsed.gameToken || decoded;
    return actualToken;
  }

  // Not valid JSON - return the decoded string directly
  return decoded;
}

module.exports = { parseGameToken };
