import { existsSync, rmSync } from "node:fs";

for (const path of [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/version.json",
  "docs/favicon.svg",
  "docs/icons.svg",
  "docs/manifest.webmanifest",
  "docs/sw.js",
]) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}
