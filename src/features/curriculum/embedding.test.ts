import { describe, expect, it } from "vitest";
import { embedTexts, hashEmbeddings } from "./embedding";

describe("hashEmbeddings", () => {
  it("produces stable unit-norm vectors", () => {
    const [a, b] = hashEmbeddings([
      "the quick brown fox",
      "the quick brown fox",
    ]);
    expect(a).toEqual(b);
    const magnitude = Math.sqrt(
      a.reduce((sum, value) => sum + value * value, 0),
    );
    expect(magnitude).toBeCloseTo(1, 5);
  });
});

describe("embedTexts cancellation", () => {
  it("propagates abort errors from semantic mode instead of silently falling back", async () => {
    // Pre-aborted signal: the abort check at the top of embedTexts should
    // throw before the @huggingface/transformers dynamic import is even
    // reached. Previously, a bare catch swallowed this and returned hash
    // embeddings as if the model just failed to load.
    const controller = new AbortController();
    controller.abort();
    await expect(
      embedTexts(["hello world"], "semantic", undefined, controller.signal),
    ).rejects.toThrowError(/cancel/i);
  });

  it("uses fast hash embeddings when mode is 'fast'", async () => {
    const result = await embedTexts(["alpha beta", "gamma delta"], "fast");
    expect(result.provider).toBe("hash-local");
    expect(result.vectors).toHaveLength(2);
    expect(result.vectors[0]).toHaveLength(96);
  });
});
