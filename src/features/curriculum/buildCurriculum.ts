import { SCHEMA_VERSION } from "../../shared/constants";
import type {
  Article,
  BuildProgress,
  CurriculumPlan,
  UserSettings,
} from "../../shared/types";
import {
  compactTitle,
  cosineSimilarity,
  normalizeVector,
  stableId,
  tokenize,
  topTerms,
} from "../../shared/text";
import { embedTexts } from "./embedding";
import { scheduleArticles } from "./scheduler";
import { summarizeCluster } from "./localSummary";

type ProgressCallback = (progress: BuildProgress) => void;

interface ClusterAssignment {
  article: Article;
  vector: number[];
  clusterIndex: number;
}

const FOUNDATION_TERMS = new Set([
  "beginner",
  "basics",
  "basic",
  "foundation",
  "foundations",
  "guide",
  "intro",
  "introduction",
  "overview",
  "primer",
  "start",
  "what",
]);

function chooseClusterCount(articleCount: number) {
  if (articleCount <= 3) {
    return 1;
  }
  return Math.min(12, Math.max(2, Math.round(Math.sqrt(articleCount / 2))));
}

function averageVector(vectors: number[][]) {
  if (vectors.length === 0) {
    return [];
  }
  const dimensions = vectors[0].length;
  const average = Array.from({ length: dimensions }, () => 0);
  for (const vector of vectors) {
    for (let index = 0; index < dimensions; index += 1) {
      average[index] += vector[index];
    }
  }
  return normalizeVector(average.map((value) => value / vectors.length));
}

function seedCentroids(vectors: number[][], count: number) {
  const centroids = [vectors[0]];
  while (centroids.length < count) {
    let bestIndex = 0;
    let bestDistance = -Infinity;
    vectors.forEach((vector, index) => {
      const nearest = Math.max(
        ...centroids.map((centroid) => cosineSimilarity(vector, centroid)),
      );
      const distance = 1 - nearest;
      if (distance > bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    centroids.push(vectors[bestIndex]);
  }
  return centroids;
}

function assignClusters(
  articles: Article[],
  vectors: number[][],
  clusterCount: number,
) {
  let centroids = seedCentroids(vectors, clusterCount);
  let assignments: ClusterAssignment[] = [];

  for (let iteration = 0; iteration < 8; iteration += 1) {
    assignments = articles.map((article, index) => {
      const vector = vectors[index];
      const clusterIndex = centroids
        .map((centroid, centroidIndex) => ({
          centroidIndex,
          score: cosineSimilarity(vector, centroid),
        }))
        .sort((a, b) => b.score - a.score)[0].centroidIndex;
      return { article, vector, clusterIndex };
    });

    centroids = centroids.map((centroid, centroidIndex) => {
      const members = assignments
        .filter((assignment) => assignment.clusterIndex === centroidIndex)
        .map((assignment) => assignment.vector);
      return members.length > 0 ? averageVector(members) : centroid;
    });
  }

  return assignments;
}

function foundationScore(article: Article) {
  const tokens = tokenize(`${article.title} ${article.excerpt}`);
  const termScore =
    tokens.filter((token) => FOUNDATION_TERMS.has(token)).length * 4;
  const shortBonus = Math.max(0, 8 - article.readingMinutes) * 0.3;
  const titleBonus = article.title.endsWith("?") ? 1 : 0;
  return termScore + shortBonus + titleBonus;
}

function buildTopics(assignments: ClusterAssignment[]) {
  const grouped = new Map<number, ClusterAssignment[]>();
  for (const assignment of assignments) {
    const list = grouped.get(assignment.clusterIndex) ?? [];
    list.push(assignment);
    grouped.set(assignment.clusterIndex, list);
  }

  const topics = [...grouped.entries()].map(([clusterIndex, members]) => {
    const articles = members.map((member) => member.article);
    const keywords = topTerms(
      articles.map(
        (article) =>
          `${article.title} ${article.excerpt} ${article.tags.join(" ")}`,
      ),
      6,
    );
    const label =
      keywords.length > 0
        ? keywords.slice(0, 3).map(capitalize).join(" / ")
        : "Reading Path";
    const articleIds = articles
      .sort(
        (a, b) =>
          foundationScore(b) - foundationScore(a) ||
          a.readingMinutes - b.readingMinutes,
      )
      .map((article) => article.id);
    return {
      id: `topic_${clusterIndex + 1}`,
      label,
      summary: summarizeCluster(articles, keywords),
      articleIds,
      prerequisiteTopicIds: [],
      readingMinutes: articles.reduce(
        (sum, article) => sum + article.readingMinutes,
        0,
      ),
      keywords,
      foundation:
        articles.reduce((sum, article) => sum + foundationScore(article), 0) /
        articles.length,
    };
  });

  return topics
    .sort(
      (a, b) =>
        b.foundation - a.foundation || a.readingMinutes - b.readingMinutes,
    )
    .map((topic, index, orderedTopics) => ({
      id: topic.id,
      label: topic.label,
      summary: topic.summary,
      articleIds: topic.articleIds,
      prerequisiteTopicIds: index === 0 ? [] : [orderedTopics[index - 1].id],
      readingMinutes: topic.readingMinutes,
      keywords: topic.keywords,
    }));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function interleaveShortAndLong(articles: Article[]) {
  const sorted = [...articles].sort(
    (a, b) =>
      foundationScore(b) - foundationScore(a) ||
      a.readingMinutes - b.readingMinutes,
  );
  const short = sorted.filter((article) => article.readingMinutes <= 8);
  const long = sorted.filter((article) => article.readingMinutes > 8);
  const mixed: Article[] = [];

  while (short.length > 0 || long.length > 0) {
    const nextShort = short.shift();
    if (nextShort) {
      mixed.push(nextShort);
    }
    const nextLong = long.shift();
    if (nextLong) {
      mixed.push(nextLong);
    }
  }

  return mixed;
}

export async function buildCurriculum(
  articles: Article[],
  settings: UserSettings,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
): Promise<CurriculumPlan> {
  const activeArticles = articles.filter(
    (article) => article.status !== "archived",
  );
  if (activeArticles.length === 0) {
    throw new Error("Add at least one article before building a curriculum.");
  }
  if (signal?.aborted) {
    throw new Error("Build cancelled before it started.");
  }

  onProgress?.({
    phase: "embedding",
    detail: "Preparing article text",
    completed: 0,
    total: activeArticles.length,
  });

  const texts = activeArticles.map(
    (article) =>
      `${article.title}\n${article.tags.join(", ")}\n${article.excerpt}\n${article.content.slice(0, 3000)}`,
  );
  const embedding = await embedTexts(
    texts,
    settings.embeddingMode,
    (progress) => onProgress?.({ phase: "embedding", ...progress }),
    signal,
  );

  if (signal?.aborted) {
    throw new Error("Build cancelled before clustering.");
  }

  onProgress?.({
    phase: "clustering",
    detail: "Clustering nearby ideas",
    completed: activeArticles.length,
    total: activeArticles.length,
  });
  const clusterCount = chooseClusterCount(activeArticles.length);
  const assignments = assignClusters(
    activeArticles,
    embedding.vectors,
    clusterCount,
  );

  if (signal?.aborted) {
    throw new Error("Build cancelled before ordering.");
  }

  onProgress?.({
    phase: "ordering",
    detail: "Dependency-ordering topics",
    completed: 0,
    total: clusterCount,
  });
  const topics = buildTopics(assignments);
  const articlesById = new Map(
    activeArticles.map((article) => [article.id, article]),
  );
  const orderedArticles = topics.flatMap((topic) =>
    interleaveShortAndLong(
      topic.articleIds
        .map((id) => articlesById.get(id))
        .filter(Boolean) as Article[],
    ),
  );

  if (signal?.aborted) {
    throw new Error("Build cancelled before scheduling.");
  }

  onProgress?.({
    phase: "scheduling",
    detail: "Packing readings into free time",
    completed: 0,
    total: orderedArticles.length,
  });
  const sessions = scheduleArticles(
    orderedArticles,
    topics,
    settings.freeSlots,
    settings.daysToPlan,
  );

  onProgress?.({
    phase: "done",
    detail: "Curriculum ready",
    completed: orderedArticles.length,
    total: orderedArticles.length,
  });

  return {
    id: stableId("plan"),
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    articleCount: activeArticles.length,
    totalReadingMinutes: activeArticles.reduce(
      (sum, article) => sum + article.readingMinutes,
      0,
    ),
    embeddingProvider: embedding.provider,
    topics,
    sessions,
    orderedArticleIds: orderedArticles.map((article) => article.id),
    lowConfidenceArticleIds: activeArticles
      .filter((article) => (article.importMeta?.confidence.score ?? 1) < 0.55)
      .map((article) => article.id)
      .sort(),
    inputWarnings: activeArticles
      .flatMap((article) =>
        (article.importMeta?.diagnostics ?? [])
          .filter((item) => item.severity !== "info")
          .map((item) => `${article.title}: ${item.what}`),
      )
      .sort(),
    settings,
  };
}

export function previewNextReading(
  plan: CurriculumPlan | null,
  articles: Article[],
) {
  if (!plan) {
    return null;
  }
  const articlesById = new Map(
    articles.map((article) => [article.id, article]),
  );
  const nextSession =
    plan.sessions.find((session) => session.status === "planned") ??
    plan.sessions[0];
  if (!nextSession) {
    return null;
  }
  return {
    session: nextSession,
    articles: nextSession.articleIds
      .map((id) => articlesById.get(id))
      .filter((article): article is Article => Boolean(article)),
    title: compactTitle(nextSession.label),
  };
}
