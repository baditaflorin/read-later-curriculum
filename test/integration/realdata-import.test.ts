import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseImportBytes } from "../../src/features/articles/importers";

interface ExpectedFixture {
  fixture: string;
  expectation: {
    status: "accepted" | "warned" | "rejected";
    shape: string;
    minArticleCount?: number;
    maxArticleCount?: number;
    titleIncludes?: string[];
    minConfidence?: number;
    maxConfidence?: number;
    maxErrorCount?: number;
    requiredWarnings?: string[];
    requiredErrors?: string[];
    expectedLanguage?: string;
  };
}

const fixtureDir = "test/fixtures/realdata";
const expectedFiles = readdirSync(fixtureDir).filter((file) =>
  file.endsWith(".expected.json"),
);

function readExpected(file: string) {
  return JSON.parse(
    readFileSync(join(fixtureDir, file), "utf8"),
  ) as ExpectedFixture;
}

function canonicalResult(filename: string) {
  const bytes = readFileSync(join(fixtureDir, filename));
  const first = parseImportBytes(new Uint8Array(bytes), filename);
  const second = parseImportBytes(new Uint8Array(bytes), filename);
  return { first, second };
}

describe("real-data import fixtures", () => {
  it("has exactly ten fixture expectations", () => {
    expect(expectedFiles).toHaveLength(10);
  });

  for (const expectedFile of expectedFiles) {
    const expected = readExpected(expectedFile);

    it(`${basename(expected.fixture)} matches expected import behavior`, () => {
      const { first, second } = canonicalResult(expected.fixture);
      const expectation = expected.expectation;

      expect(first.status).toBe(expectation.status);
      expect(first.shape).toBe(expectation.shape);
      expect(first.articles.length).toBeGreaterThanOrEqual(
        expectation.minArticleCount ?? 0,
      );
      if (expectation.maxArticleCount !== undefined) {
        expect(first.articles.length).toBeLessThanOrEqual(
          expectation.maxArticleCount,
        );
      }
      if (expectation.minConfidence !== undefined) {
        expect(first.confidence.score).toBeGreaterThanOrEqual(
          expectation.minConfidence,
        );
      }
      if (expectation.maxConfidence !== undefined) {
        expect(first.confidence.score).toBeLessThanOrEqual(
          expectation.maxConfidence,
        );
      }
      if (expectation.maxErrorCount !== undefined) {
        expect(first.errors.length).toBeLessThanOrEqual(
          expectation.maxErrorCount,
        );
      }
      for (const title of expectation.titleIncludes ?? []) {
        expect(
          first.articles.some((article) => article.title.includes(title)),
        ).toBe(true);
      }
      for (const warning of expectation.requiredWarnings ?? []) {
        expect(first.warnings.join(" ").toLowerCase()).toContain(
          warning.toLowerCase(),
        );
      }
      for (const error of expectation.requiredErrors ?? []) {
        expect(first.errors.join(" ").toLowerCase()).toContain(
          error.toLowerCase(),
        );
      }
      if (expectation.expectedLanguage) {
        expect(first.articles[0]?.importMeta?.language).toBe(
          expectation.expectedLanguage,
        );
      }

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    });
  }
});
