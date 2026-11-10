const HOSTS = {
  "xxz-xyzw-res.hortorgames.com": "assets",
  "xxz-xyzw-alires.hortorgames.com": "ali-assets",
  "wxmini-resource.hortorgames.com": "wxmini",
  "xyzw11001.baby": "scripts",
};

export function gameResourcePath(value, method = "GET") {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new Error("不支持的游戏资源地址");
  }
  if (
    url.hostname === "xxz-xyzw.hortorgames.com" &&
    url.pathname === "/login/manifest" &&
    ["GET", "HEAD", "POST"].includes(method)
  ) {
    return `/api/link-games/manifest${url.search}`;
  }
  const host = HOSTS[url.hostname];
  if (!host || !["GET", "HEAD"].includes(method))
    throw new Error("不支持的游戏资源请求");
  return `/api/link-games/${host}${url.pathname}${url.search}`;
}

export async function proxyGameResource(request, signal) {
  const method = String(request.method || "GET").toUpperCase();
  const path = gameResourcePath(request.url, method);
  if ((request.body?.byteLength || 0) > 65536)
    throw new Error("游戏资源请求过大");
  const headers = new Headers();
  for (const key of ["accept", "content-type"]) {
    const value = request.headers?.[key];
    if (
      typeof value === "string" &&
      value.length < 1024 &&
      !/[\r\n]/.test(value)
    )
      headers.set(key, value);
  }
  const response = await fetch(path, {
    method,
    headers,
    signal,
    credentials: "omit",
    cache: "no-store",
    body: ["GET", "HEAD"].includes(method) ? undefined : request.body,
  });
  // A static server can return the SPA's index.html for an unconfigured API path.
  if (!response.headers.has("x-game-status")) {
    throw new Error(
      "游戏资源代理不可用，请确认当前部署支持 /api/link-games/，更新开发配置后需重启 dev",
    );
  }
  return {
    status: Number(response.headers.get("x-game-status")),
    redirect: response.headers.get("x-game-location"),
    headers: {
      "content-type":
        response.headers.get("content-type") || "application/octet-stream",
    },
    body: await response.arrayBuffer(),
    url: request.url,
  };
}
