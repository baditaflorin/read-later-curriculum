import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify("0.1.0"),
    __COMMIT_SHA__: JSON.stringify("test"),
    __BUILT_AT__: JSON.stringify("2026-05-08T00:00:00.000Z"),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
