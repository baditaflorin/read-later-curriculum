import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../shared/constants";
import type { Article } from "../../shared/types";
import { normalizeDraft } from "../articles/articleSchema";
import { buildCurriculum } from "./buildCurriculum";

function article(title: string, content: string, tags: string[] = []): Article {
  return normalizeDraft(
    { title, content, tags },
    DEFAULT_SETTINGS.readingSpeedWpm,
  );
}

describe("buildCurriculum", () => {
  it("clusters, orders, and schedules saved articles", async () => {
    const articles = [
      article(
        "Introduction to local search",
        "This primer explains search indexes, inverted files, ranking, and why local search is useful for private reading libraries.",
        ["search", "foundation"],
      ),
      article(
        "Semantic embeddings for reading queues",
        "Sentence embeddings place related articles close together so a curriculum builder can cluster machine learning and knowledge work topics.",
        ["embeddings"],
      ),
      article(
        "Scheduling deep reading sessions",
        "Reading plans work better when long articles and short articles are mixed into realistic free time slots across a calendar.",
        ["schedule"],
      ),
    ];

    const plan = await buildCurriculum(articles, {
      ...DEFAULT_SETTINGS,
      embeddingMode: "fast",
    });

    expect(plan.articleCount).toBe(3);
    expect(plan.topics.length).toBeGreaterThan(0);
    expect(plan.sessions.length).toBeGreaterThan(0);
    expect(plan.orderedArticleIds).toHaveLength(3);
    expect(plan.embeddingProvider).toBe("hash-local");
  });
});
