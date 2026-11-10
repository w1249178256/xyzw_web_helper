export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/link-games/")) {
      return handleGameResource(request);
    }

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
    };

    // Handle OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Proxy configuration
    const proxies = [
      {
        prefix: "/api/hortor-ucenter",
        target: "https://comb-platform.hortorgames.com",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12; ALN-AL80 Build/HUAWEIALN-AL80; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36",
          Accept: "application/json",
          Host: "ucenter-app-server.hortorgames.com",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
      {
        prefix: "/api/weixin-long",
        target: "https://long.open.weixin.qq.com",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/WIFI Language/zh_CN",
          Accept: "*/*",
          Referer: "https://open.weixin.qq.com/",
        },
      },
      {
        prefix: "/api/weixin",
        target: "https://open.weixin.qq.com",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/WIFI Language/zh_CN",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          Referer: "https://open.weixin.qq.com/",
        },
      },
      {
        prefix: "/api/hortor",
        target: "https://comb-platform.hortorgames.com",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 12; 23117RK66C Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Mobile Safari/537.36",
          Accept: "*/*",
          Host: "comb-platform.hortorgames.com",
          Connection: "keep-alive",
          "Content-Type": "text/plain; charset=utf-8",
          Origin: "https://open.weixin.qq.com",
          Referer: "https://open.weixin.qq.com/",
        },
      },
    ].sort((a, b) => b.prefix.length - a.prefix.length); // Sort by length descending to match longest prefix first

    // Find matching proxy
    const proxy = proxies.find((p) => url.pathname.startsWith(p.prefix));

    if (proxy) {
      // Construct new URL
      const targetUrl = new URL(proxy.target);
      targetUrl.pathname = url.pathname.replace(proxy.prefix, "") || "/";
      targetUrl.search = url.search;

      // Prepare request headers
      const newHeaders = new Headers(request.headers);

      // Override headers based on proxy config
      Object.entries(proxy.headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      // Special handling for Host header (Cloudflare might override it, but good to set intention)
      if (proxy.headers.Host) {
        newHeaders.set("Host", proxy.headers.Host);
      }

      // Create new request
      const newRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: "follow",
      });

      try {
        const response = await fetch(newRequest);

        // Re-create response to add CORS headers
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });

        return newResponse;
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Serve static assets (Cloudflare Pages)
    // If env.ASSETS is available (e.g. in Cloudflare Pages Functions), use it to fetch static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // Default response for non-proxy paths
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};

// Fixed public game origins. No account, cookie or authorization headers are forwarded.
export function gameResourceTarget(value, method) {
  const url = new URL(value);
  const prefix = "/api/link-games/";
  if (!url.pathname.startsWith(prefix))
    throw new Error("Unsupported resource path");
  const path = url.pathname.slice(prefix.length);
  if (path === "manifest" && ["GET", "HEAD", "POST"].includes(method)) {
    return new URL(
      `https://xxz-xyzw.hortorgames.com/login/manifest${url.search}`,
    );
  }
  const hosts = {
    assets: "xxz-xyzw-res.hortorgames.com",
    "ali-assets": "xxz-xyzw-alires.hortorgames.com",
    wxmini: "wxmini-resource.hortorgames.com",
    scripts: "xyzw11001.baby",
  };
  const slash = path.indexOf("/");
  const alias = path.slice(0, slash);
  if (
    slash < 0 ||
    !Object.hasOwn(hosts, alias) ||
    !["GET", "HEAD"].includes(method)
  )
    throw new Error("Unsupported resource request");
  const target = new URL(`https://${hosts[alias]}`);
  target.pathname = path.slice(slash);
  target.search = url.search;
  return target;
}

export async function handleGameResource(request, fetcher = fetch) {
  let target;
  try {
    target = gameResourceTarget(request.url, request.method);
  } catch {
    return new Response("Unsupported game resource", { status: 400 });
  }
  const headers = new Headers();
  for (const key of ["accept", "content-type"]) {
    const value = request.headers.get(key);
    if (value && value.length < 1024) headers.set(key, value);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  if (request.signal.aborted) abort();
  const timeout = setTimeout(abort, 65000);
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abort);
  };
  try {
    let body;
    if (request.method === "POST") {
      if (Number(request.headers.get("content-length")) > 65536)
        throw new Error("Request too large");
      const chunks = [];
      let size = 0;
      const input = request.body?.getReader();
      if (input) {
        while (true) {
          const { value, done } = await input.read();
          if (done) break;
          size += value.byteLength;
          if (size > 65536) {
            await input.cancel();
            throw new Error("Request too large");
          }
          chunks.push(value);
        }
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
    }
    const upstream = await fetcher(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal,
    });
    const responseHeaders = new Headers({
      "x-game-status": String(upstream.status),
      "cache-control": "no-store",
      "content-type":
        upstream.headers.get("content-type") || "application/octet-stream",
    });
    if (upstream.headers.has("location"))
      responseHeaders.set("x-game-location", upstream.headers.get("location"));
    if (!upstream.body || request.method === "HEAD") {
      await upstream.body?.cancel();
      cleanup();
      return new Response(null, { headers: responseHeaders });
    }
    const reader = upstream.body.getReader();
    let bytes = 0;
    const stream = new ReadableStream({
      async pull(output) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            cleanup();
            output.close();
            return;
          }
          bytes += value.byteLength;
          if (bytes > 32 * 1024 * 1024) {
            controller.abort();
            await reader.cancel();
            throw new Error("Game resource too large");
          }
          output.enqueue(value);
        } catch (error) {
          cleanup();
          output.error(error);
        }
      },
      async cancel() {
        cleanup();
        controller.abort();
        await reader.cancel();
      },
    });
    return new Response(stream, { headers: responseHeaders });
  } catch {
    cleanup();
    return new Response("Game resource request failed", {
      status: 502,
      headers: { "x-game-status": "502" },
    });
  }
}
