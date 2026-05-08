export type ArticleStatus =
  | "saved"
  | "scheduled"
  | "reading"
  | "done"
  | "archived";

export type EmbeddingMode = "fast" | "semantic";

export interface Article {
  id: string;
  title: string;
  sourceUrl?: string;
  author?: string;
  content: string;
  excerpt: string;
  tags: string[];
  wordCount: number;
  readingMinutes: number;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ArticleDraft {
  title: string;
  sourceUrl?: string;
  author?: string;
  content: string;
  tags?: string[];
}

export interface FreeSlot {
  id: string;
  weekday: number;
  startTime: string;
  minutes: number;
}

export interface UserSettings {
  readingSpeedWpm: number;
  daysToPlan: number;
  embeddingMode: EmbeddingMode;
  freeSlots: FreeSlot[];
}

export interface TopicCluster {
  id: string;
  label: string;
  summary: string;
  articleIds: string[];
  prerequisiteTopicIds: string[];
  readingMinutes: number;
  keywords: string[];
}

export interface ReadingSession {
  id: string;
  topicId: string;
  articleIds: string[];
  startsAt: string;
  durationMinutes: number;
  loadMinutes: number;
  label: string;
  status: "planned" | "done";
}

export interface CurriculumPlan {
  id: string;
  schemaVersion: "v1";
  generatedAt: string;
  articleCount: number;
  totalReadingMinutes: number;
  embeddingProvider:
    | "hash-local"
    | "sentence-transformers"
    | "sentence-transformers-fallback";
  topics: TopicCluster[];
  sessions: ReadingSession[];
  orderedArticleIds: string[];
  settings: UserSettings;
}

export interface BuildProgress {
  phase:
    | "idle"
    | "embedding"
    | "clustering"
    | "ordering"
    | "scheduling"
    | "summarizing"
    | "done";
  detail: string;
  completed: number;
  total: number;
}

export interface ImportResult {
  articles: ArticleDraft[];
  warnings: string[];
}
