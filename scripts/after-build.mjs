import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, "docs");

function gitValue(command, fallback) {
  try {
    return execSync(command, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

mkdirSync(docs, { recursive: true });
copyFileSync(join(docs, "index.html"), join(docs, "404.html"));
writeFileSync(
  join(docs, "version.json"),
  `${JSON.stringify(
    {
      version: pkg.version,
      commit: gitValue("git rev-parse --short HEAD", "dev"),
      builtAt: new Date().toISOString(),
      repository: "https://github.com/baditaflorin/read-later-curriculum",
    },
    null,
    2,
  )}\n`,
);
