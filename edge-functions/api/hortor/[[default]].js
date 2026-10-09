// 把 /api/hortor/* 转发到 https://comb-platform.hortorgames.com/*
// 对应原 nginx: location /api/hortor/ { proxy_pass https://comb-platform.hortorgames.com/; }

const TARGET = 'https://comb-platform.hortorgames.com/';
const PREFIX = '/api/hortor/';

const UA = 'Mozilla/5.0 (Linux; Android 12; 23117RK66C Build/V417IR; wv) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Mobile Safari/537.36';

const EXTRA_HEADERS = {
  'User-Agent': UA,
  'Accept': '*/*',
  'Content-Type': 'text/plain; charset=utf-8',
  'Origin': 'https://open.weixin.qq.com',
  'Referer': 'https://open.weixin.qq.com/',
  // nginx 里还写了 Connection: keep-alive, 属于逐跳头, 由边缘侧与浏览器自行管理, 不建议在这里设置
};

async function proxy(request) {
  const url = new URL(request.url);
  const target = TARGET + url.pathname.slice(PREFIX.length) + url.search;

  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(EXTRA_HEADERS)) headers.set(key, value);
  headers.delete('Host');

  const init = { method: request.method, headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;

  return fetch(target, init);
}

export async function onRequest(context) {
  const request = context.request ?? context;
  return proxy(request);
}
