import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { articleDraftSchema } from "../../src/features/articles/articleSchema";

describe("sample data artifact", () => {
  it("matches the v1 article draft contract", () => {
    const raw = JSON.parse(readFileSync("docs/data/v1/sample-articles.json", "utf8")) as unknown[];
    expect(raw.length).toBeGreaterThanOrEqual(10);
    for (const item of raw) {
      expect(articleDraftSchema.safeParse(item).success).toBe(true);
    }
  });
});
