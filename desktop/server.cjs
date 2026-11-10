const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const { pipeline } = require("node:stream");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
};
const HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];
function cleanHeaders(input) {
  const headers = { ...input };
  const connection = String(headers.connection || "")
    .split(",")
    .map((h) => h.trim().toLowerCase());
  for (const key of [...HOP_HEADERS, ...connection]) delete headers[key];
  return headers;
}

function proxyOptions(url, requestHeaders, proxies) {
  const pathname = url.split("?")[0];
  const rule = [...proxies]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((p) => pathname === p.prefix || pathname.startsWith(p.prefix + "/"));
  if (!rule) return null;
  const target = new URL(rule.target);
  if (target.protocol !== "https:") throw new Error("API proxy requires HTTPS");
  const headers = cleanHeaders(requestHeaders);
  delete headers.origin;
  delete headers.referer;
  headers.host = target.host;
  for (const [key, value] of Object.entries(rule.headers || {}))
    headers[key.toLowerCase()] = value;
  // The upstream host is fixed by the build's allowlist, never by the request URL.
  return {
    protocol: "https:",
    hostname: target.hostname,
    port: target.port || 443,
    path: rule.rewrite
      ? rule.rewrite(url)
      : url.slice(rule.prefix.length) || "/",
    headers: cleanHeaders(headers),
    rejectUnauthorized: true,
  };
}

async function startServer({
  root,
  proxies = [],
  port = 47831,
  log = () => {},
}) {
  root = await fsp.realpath(root);
  let origin;
  const send = (res, status, text) => {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(text);
  };
  const server = http.createServer(async (req, res) => {
    try {
      if (
        req.headers.host !== new URL(origin).host ||
        (req.headers.origin && req.headers.origin !== origin) ||
        req.headers["sec-fetch-site"] === "cross-site"
      ) {
        return send(res, 403, "Local application requests only");
      }
      const rawPath = req.url.split("?")[0];
      const decoded = decodeURIComponent(rawPath);
      if (
        !decoded.startsWith("/") ||
        decoded.includes("\\") ||
        decoded.includes("\0") ||
        decoded.split("/").includes("..")
      )
        return send(res, 403, "Forbidden");
      if (decoded.startsWith("/api/")) {
        const options = proxyOptions(req.url, req.headers, proxies);
        if (!options) return send(res, 404, "Unknown API route");
        const upstream = https.request(
          { ...options, method: req.method },
          (response) => {
            const headers = cleanHeaders(response.headers);
            // Do not turn this private service into a cross-origin API endpoint.
            for (const name of Object.keys(headers))
              if (name.startsWith("access-control-")) delete headers[name];
            res.writeHead(response.statusCode, headers);
            pipeline(response, res, () => {});
          },
        );
        upstream.setTimeout(90000, () =>
          upstream.destroy(new Error("Upstream timeout")),
        );
        upstream.on("error", () => {
          log("API upstream connection failed");
          if (!res.headersSent) send(res, 502, "Upstream connection failed");
          else res.destroy();
        });
        res.on("close", () => upstream.destroy());
        req.on("aborted", () => upstream.destroy());
        req.pipe(upstream);
        return;
      }
      if (!["GET", "HEAD"].includes(req.method))
        return send(res, 405, "Method not allowed");
      let file = path.resolve(root, "." + decoded);
      if (
        decoded.split("/").some((p) => p.startsWith(".")) ||
        decoded === "/_worker.js"
      ) {
        return send(res, 403, "Forbidden");
      }
      let stat = await fsp.stat(file).catch(() => null);
      if (stat?.isDirectory()) {
        file = path.join(file, "index.html");
        stat = await fsp.stat(file).catch(() => null);
      }
      if (!stat?.isFile()) {
        if (path.extname(decoded) || !req.headers.accept?.includes("text/html"))
          return send(res, 404, "Not found");
        file = path.join(root, "index.html");
        stat = await fsp.stat(file);
      }
      const realFile = await fsp.realpath(file);
      if (!realFile.startsWith(root + path.sep))
        return send(res, 403, "Forbidden");
      res.writeHead(200, {
        "Content-Type":
          MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": stat.size,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "same-origin",
      });
      if (req.method === "HEAD") return res.end();
      pipeline(fs.createReadStream(realFile), res, () => {});
    } catch (error) {
      if (!res.headersSent)
        send(res, error instanceof URIError ? 400 : 500, "Request failed");
      else res.destroy();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(port), "127.0.0.1", () => {
      origin = `http://127.0.0.1:${server.address().port}`;
      server.removeListener("error", reject);
      resolve();
    });
  });
  server.on("error", () => log("Local HTTP service error"));
  return {
    origin,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
module.exports = { startServer, proxyOptions };
