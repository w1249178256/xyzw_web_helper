// 把 /api/hortor-ucenter/* 转发到 https://comb-platform.hortorgames.com/*
// 对应原 nginx: location /api/hortor-ucenter/ { proxy_pass https://comb-platform.hortorgames.com/;
//                proxy_set_header Host ucenter-app-server.hortorgames.com; }
//
// 注意: nginx 里 TLS 握手目标是 comb-platform.hortorgames.com, 但 Host 头写的是
//       ucenter-app-server.hortorgames.com, 属于 HOST 头与目标域名不一致的用法。
//       普通请求规范下 Host 是受限请求头, Makers 函数能否显式指定上游 Host 尚无明确资料,
//       这条请在 Functions 文档 / 工单确认后再启用, 不要和其它三条一起排查。

const TARGET = 'https://comb-platform.hortorgames.com/';
const PREFIX = '/api/hortor-ucenter/';
const UPSTREAM_HOST = 'ucenter-app-server.hortorgames.com';

const UA = 'Mozilla/5.0 (Linux; Android 12; ALN-AL80 Build/HUAWEIALN-AL80; wv) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36';

const EXTRA_HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/json',
  'Content-Type': 'application/json; charset=utf-8',
  // 'Host': UPSTREAM_HOST, // ← 确认函数支持改写上游 Host 后再打开这一行
};

async function proxy(request) {
  const url = new URL(request.url);
  const target = TARGET + url.pathname.slice(PREFIX.length) + url.search;

  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(EXTRA_HEADERS)) headers.set(key, value);
  if (!('Host' in EXTRA_HEADERS)) headers.delete('Host');

  const init = { method: request.method, headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;

  return fetch(target, init);
}

export async function onRequest(context) {
  const request = context.request ?? context;
  return proxy(request);
}
