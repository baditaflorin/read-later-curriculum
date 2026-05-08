import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "docs");
const port = Number(process.argv[3] ?? 4173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
]);

function resolvePath(url) {
  const parsed = new URL(url, `http://localhost:${port}`);
  const pathname = parsed.pathname.replace(/^\/read-later-curriculum\/?/, "/");
  const clean = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(root, clean);
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return join(candidate, "index.html");
  }
  if (existsSync(candidate)) {
    return candidate;
  }
  return join(root, "index.html");
}

const server = createServer((request, response) => {
  const filePath = resolvePath(request.url ?? "/");
  response.setHeader(
    "Content-Type",
    types.get(extname(filePath)) ?? "application/octet-stream",
  );
  createReadStream(filePath)
    .on("error", () => {
      response.writeHead(404);
      response.end("Not found");
    })
    .pipe(response);
});

server.listen(port, () => {
  console.log(
    `Serving ${root} at http://127.0.0.1:${port}/read-later-curriculum/`,
  );
});
