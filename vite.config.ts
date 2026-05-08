import { execSync } from "node:child_process";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const version = process.env.npm_package_version ?? "0.1.0";

function gitValue(command: string, fallback: string) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

const commit =
  process.env.VITE_COMMIT_SHA ?? gitValue("git rev-parse --short HEAD", "dev");
const builtAt = process.env.VITE_BUILT_AT ?? new Date().toISOString();

// https://vite.dev/config/
export default defineConfig({
  base: "/read-later-curriculum/",
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT_SHA__: JSON.stringify(commit),
    __BUILT_AT__: JSON.stringify(builtAt),
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: false,
    modulePreload: {
      resolveDependencies(_url, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes("semantic-embeddings") &&
            !dep.endsWith(".wasm") &&
            !dep.includes("ort-wasm"),
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@huggingface/transformers")) {
            return "semantic-embeddings";
          }
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("scheduler")) {
              return "vendor-react";
            }
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
