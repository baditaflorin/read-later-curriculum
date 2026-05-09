import { expect, test, type Page } from "@playwright/test";

async function resetBrowserState(page: Page) {
  await page.goto("./");
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    }

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("read-later-curriculum");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });
  await page.reload();
}

test("builds and restores a local workspace from state export", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await resetBrowserState(page);
  await expect(
    page.getByRole("heading", { name: "Read Later Curriculum" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Demo Set" }).click();
  await expect(page.getByText("Library updated.")).toBeVisible();
  await page.getByRole("button", { name: "Build" }).click();
  await expect(page.getByText("Curriculum generated.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Next")).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "State JSON" }).click(),
  ]).then(([event]) => event);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  await page.getByTitle("Start fresh").click();
  await expect(page.getByText("Workspace reset.")).toBeVisible();
  await expect(page.getByText("No articles in this view.")).toBeVisible();

  await page
    .locator('input[type="file"][accept=".json"]')
    .setInputFiles(downloadPath!);
  await expect(
    page.getByText("Workspace restored from state export."),
  ).toBeVisible();
  await expect(page.getByText("Next")).toBeVisible();
  await expect(page.locator("footer").getByText("v0.2.0")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("persists draft text and search query across reload", async ({ page }) => {
  await resetBrowserState(page);

  await page.getByLabel("Title").fill("Persistent draft");
  await page
    .getByRole("textbox", { name: "Article text", exact: true })
    .fill(
      "This unsaved draft should survive a reload because Phase 3 treats session continuity as a real feature instead of a hope.",
    );
  await page.getByPlaceholder("Search title, text, or tag").fill("retrieval");

  await page.reload();

  await expect(page.getByLabel("Title")).toHaveValue("Persistent draft");
  await expect(
    page.getByRole("textbox", { name: "Article text", exact: true }),
  ).toHaveValue(/This unsaved draft should survive a reload/);
  await expect(page.getByPlaceholder("Search title, text, or tag")).toHaveValue(
    "retrieval",
  );
});
