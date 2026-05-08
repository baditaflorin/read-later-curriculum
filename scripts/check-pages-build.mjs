import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const required = [
  "docs/index.html",
  "docs/404.html",
  "docs/manifest.webmanifest",
];
const missing = required.filter((path) => !existsSync(path));

if (missing.length > 0) {
  throw new Error(`Missing Pages build files: ${missing.join(", ")}`);
}

const index = readFileSync("docs/index.html", "utf8");
if (!index.includes("/read-later-curriculum/assets/")) {
  throw new Error(
    "index.html does not reference the GitHub Pages base path assets",
  );
}

const assetsDir = join("docs", "assets");
if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) {
  throw new Error("docs/assets was not generated");
}

console.log("Pages build verified.");
