import { z } from "zod";
import {
  APP_STATE_KIND,
  APP_STATE_SCHEMA_VERSION,
  APP_VERSION,
  COMMIT_SHA,
  DEFAULT_MANUAL_DRAFT,
  DEFAULT_UI_STATE,
  REPOSITORY_URL,
} from "../../shared/constants";
import type {
  AppStateExport,
  CurriculumPlan,
  UiState,
} from "../../shared/types";
import { base64UrlDecode, base64UrlEncode } from "../../shared/text";
import {
  articleSchema,
  exportedArticleSchema,
  reviveArticle,
} from "../articles/articleSchema";

const freeSlotSchema = z.object({
  id: z.string(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string(),
  minutes: z.number().int().positive(),
});

const userSettingsSchema = z.object({
  readingSpeedWpm: z.number().int().min(120).max(600),
  daysToPlan: z.number().int().min(1).max(365),
  embeddingMode: z.enum(["fast", "semantic"]),
  freeSlots: z.array(freeSlotSchema),
});

const curriculumPlanSchema: z.ZodType<CurriculumPlan> = z.object({
  id: z.string(),
  schemaVersion: z.literal("v1"),
  generatedAt: z.string(),
  articleCount: z.number().int().nonnegative(),
  totalReadingMinutes: z.number().int().nonnegative(),
  embeddingProvider: z.enum([
    "hash-local",
    "sentence-transformers",
    "sentence-transformers-fallback",
  ]),
  topics: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      summary: z.string(),
      articleIds: z.array(z.string()),
      prerequisiteTopicIds: z.array(z.string()),
      readingMinutes: z.number().int().nonnegative(),
      keywords: z.array(z.string()),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      topicId: z.string(),
      articleIds: z.array(z.string()),
      startsAt: z.string(),
      durationMinutes: z.number().int().positive(),
      loadMinutes: z.number().int().nonnegative(),
      label: z.string(),
      status: z.enum(["planned", "done"]),
    }),
  ),
  orderedArticleIds: z.array(z.string()),
  lowConfidenceArticleIds: z.array(z.string()),
  inputWarnings: z.array(z.string()),
  settings: userSettingsSchema,
});

const manualDraftSchema = z.object({
  title: z.string(),
  sourceUrl: z.string(),
  tags: z.string(),
  content: z.string(),
});

const uiStateSchema: z.ZodType<UiState> = z.object({
  query: z.string(),
  pastedContent: z.string(),
  pastedFilename: z.string(),
  manualDraft: manualDraftSchema,
});

const appStateExportSchema = z.object({
  kind: z.literal(APP_STATE_KIND),
  schemaVersion: z.literal(APP_STATE_SCHEMA_VERSION),
  exportedAt: z.string(),
  appVersion: z.string(),
  commit: z.string(),
  repository: z.string().url(),
  settings: userSettingsSchema,
  uiState: uiStateSchema,
  articles: z.array(articleSchema.or(exportedArticleSchema)),
  plan: curriculumPlanSchema.nullable(),
});

export function createAppStateExport(input: {
  settings: AppStateExport["settings"];
  uiState: UiState;
  articles: AppStateExport["articles"];
  plan: AppStateExport["plan"];
}): AppStateExport {
  return {
    kind: APP_STATE_KIND,
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    commit: COMMIT_SHA,
    repository: REPOSITORY_URL,
    settings: input.settings,
    uiState: {
      query: input.uiState.query,
      pastedContent: input.uiState.pastedContent,
      pastedFilename: input.uiState.pastedFilename,
      manualDraft: input.uiState.manualDraft,
    },
    articles: input.articles,
    plan: input.plan,
  };
}

export function serializeAppState(state: AppStateExport) {
  return JSON.stringify(state, null, 2);
}

export function parseAppStateJson(
  json: string,
  readingSpeedWpm: number,
): AppStateExport {
  const raw = JSON.parse(json) as unknown;
  const parsed = appStateExportSchema.parse(raw);
  return {
    ...parsed,
    uiState: {
      ...DEFAULT_UI_STATE,
      ...parsed.uiState,
      manualDraft: {
        ...DEFAULT_MANUAL_DRAFT,
        ...parsed.uiState.manualDraft,
      },
    },
    articles: parsed.articles.map((article) =>
      articleSchema.safeParse(article).success
        ? articleSchema.parse(article)
        : reviveArticle(article, readingSpeedWpm),
    ),
  };
}

export function encodeAppStateShare(state: AppStateExport) {
  return base64UrlEncode(serializeAppState(state));
}

export function decodeAppStateShare(encoded: string, readingSpeedWpm: number) {
  return parseAppStateJson(base64UrlDecode(encoded), readingSpeedWpm);
}
