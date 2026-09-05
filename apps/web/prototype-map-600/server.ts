// Throwaway prototype server for issue #600 (branch prototype/map-600).
// Serves the dependency-free ./index.html + ./fells.js on a high loopback port.
// Usage: bun ./apps/web/prototype-map-600/server.ts
import { join } from "node:path";

const dir = import.meta.dir;
const port = Number(process.env.PROTOTYPE_MAP_PORT ?? 49627);

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

Bun.serve({
  port,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path === "/" || path === "") path = "/index.html";
    // Strip query; only serve the two known files, everything else -> index.html
    if (path !== "/index.html" && path !== "/fells.js") path = "/index.html";
    const file = Bun.file(join(dir, path.slice(1)));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    const ext = path.slice(path.lastIndexOf("."));
    return new Response(file, {
      headers: { "content-type": types[ext] ?? "application/octet-stream" },
    });
  },
});

console.log(`PID ${process.pid} · Prototype map-600 on http://localhost:${port}/?variant=A`);
