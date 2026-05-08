import { expect, test } from "@playwright/test";

test("builds a local curriculum from the demo set", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Read Later Curriculum" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Demo Set" }).click();
  await expect(page.getByText("Library updated.")).toBeVisible();
  await page.getByRole("button", { name: "Build" }).click();
  await expect(page.getByText("Curriculum generated.")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Next")).toBeVisible();
  await expect(page.locator("footer").getByText("v0.1.0")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
