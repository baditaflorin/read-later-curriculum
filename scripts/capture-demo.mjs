import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const server = spawn(process.execPath, ["scripts/static-server.mjs", "docs", "4173"], {
  stdio: ["ignore", "inherit", "inherit"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:4173/read-later-curriculum/");
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("Timed out waiting for local Pages preview");
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:4173/read-later-curriculum/", {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("heading", { name: "Read Later Curriculum" }).waitFor();
  await page.getByRole("button", { name: /Demo Set/ }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("Curriculum generated.").waitFor({ timeout: 15_000 });
  await page.screenshot({ path: "docs/demo-screenshot.png", fullPage: false });
  await browser.close();
} finally {
  server.kill();
}
