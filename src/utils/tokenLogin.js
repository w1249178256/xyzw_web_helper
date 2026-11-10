function describeTokenError(error, text, errorCode) {
  // A message already formatted by this module may pass through another catch.
  if (/（错误码：\d+）$/.test(text)) return text;
  if (text.includes("其他标签页")) return text;
  if (/check\s+token\s+error/i.test(text)) {
    return "Token 校验失败，登录凭证可能已失效，请刷新 Token 或重新导入后再登录";
  }
  if (/token.*expir|token.*过期|凭证.*过期|登录.*过期/i.test(text)) {
    return "Token 已过期，请刷新 Token 或重新导入 BIN 文件后再登录";
  }
  if (
    [400340, 200400, 400312, 429].includes(errorCode) ||
    /频繁|限流|too many/i.test(text)
  ) {
    return "操作过于频繁，请稍后重试";
  }
  if (/timeout|timed out|超时/i.test(text) || error?.code === "ECONNABORTED") {
    return "登录超时，请检查网络后重试";
  }
  if (
    /invalid.*token|token.*invalid|token.*无效|凭证.*失效|认证.*失效/i.test(
      text,
    )
  ) {
    return "Token 无效，请重新导入后再登录";
  }
  if (/kick|other.*login|异地|其他.*登录|重复登录/i.test(text)) {
    return "账号已在其他地方登录，请退出其他连接后重试";
  }
  if ([401, 403].includes(errorCode)) {
    return "登录认证失败，请刷新 Token 或重新导入后再试";
  }
  if (
    !text ||
    /\[object (?:Event|Object)\]|network error|failed to fetch|websocket.*error/i.test(
      text,
    )
  ) {
    return "连接失败，请检查网络；若仍无法登录，请刷新 Token 后重试";
  }
  return text;
}

/** Translate login failures while preserving the actual server error code. */
export function getTokenErrorMessage(error, code = 0) {
  const text = String(
    error?.rawMessage ||
      error?.message ||
      error?.error ||
      error?.hint ||
      error ||
      "",
  );
  const errorCode = Number(code || error?.code || error?.response?.status);
  const message = describeTokenError(error, text, errorCode);
  if (!Number.isInteger(errorCode) || errorCode <= 0) return message;
  const withoutCode = message.replace(/\s*（错误码：\d+）$/, "");
  return `${withoutCode}（错误码：${errorCode}）`;
}

/** Reject missing credentials before an auth response can become a stored token. */
export function getAuthUserData(message) {
  const code = Number(message?.code) || 0;
  if (message?.error || code) {
    const rawMessage = message?.error || message?.hint || "认证失败";
    throw Object.assign(new Error(getTokenErrorMessage(rawMessage, code)), {
      code,
      rawMessage,
    });
  }
  const data = message?.getData?.();
  const credential = data?.roleToken || data?.token;
  if (typeof credential === "string" && credential.trim()) return data;
  throw new Error(
    "认证响应中没有有效 Token，BIN 文件可能已失效，请重新获取后导入",
  );
}
