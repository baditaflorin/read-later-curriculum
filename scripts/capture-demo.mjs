import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { chromium } from "@playwright/test";

const port = Number(process.env.SCREENSHOT_PORT ?? 4288);

const server = spawn(
  process.execPath,
  ["scripts/static-server.mjs", "docs", String(port)],
  {
    stdio: ["ignore", "inherit", "inherit"],
  },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await new Promise((resolve) => {
      const socket = createConnection(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.end();
        resolve(true);
      });
      socket.once("error", () => resolve(false));
      socket.setTimeout(200, () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (ready) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
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
  await page.goto(`http://127.0.0.1:${port}/read-later-curriculum/`, {
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
