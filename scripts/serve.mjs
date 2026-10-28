// Serves dist/ the way Vercel will: headers, 301 redirects, no trailing slashes, 404 page.
// Used only for local verification: `node scripts/serve.mjs [port]`.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const port = Number(process.argv[2] ?? 4321);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const headersFor = (path) =>
  config.headers
    .filter((rule) => new RegExp(`^${rule.source.replace("(.*)", ".*")}$`).test(path))
    .flatMap((rule) => rule.headers);

async function findFile(path) {
  const candidates = [path, join(path, "index.html"), `${path}.html`];
  for (const candidate of candidates) {
    const full = normalize(join(root, candidate));
    if (!full.startsWith(root)) return null;
    try {
      if ((await stat(full)).isFile()) return full;
    } catch {
      // try next candidate
    }
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = decodeURIComponent(url.pathname);
  for (const { key, value } of headersFor(path)) {
    // Local server is plain http; upgrading requests to https would break every asset in Safari.
    res.setHeader(key, value.replace("; upgrade-insecure-requests", ""));
  }

  const redirect = config.redirects.find((rule) => rule.source === path);
  if (redirect) {
    res.writeHead(redirect.statusCode, { Location: redirect.destination }).end();
    return;
  }
  if (path.length > 1 && path.endsWith("/")) {
    res.writeHead(308, { Location: path.slice(0, -1) + url.search }).end();
    return;
  }

  const file = await findFile(path);
  const status = file ? 200 : 404;
  const body = await readFile(file ?? join(root, "404.html"));
  res.writeHead(status, {
    "Content-Type": types[extname(file ?? "404.html")] ?? "application/octet-stream",
  });
  res.end(body);
}).listen(port, () => console.log(`http://localhost:${port}`));
