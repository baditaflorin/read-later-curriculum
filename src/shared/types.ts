export type ArticleStatus =
  | "saved"
  | "scheduled"
  | "reading"
  | "done"
  | "archived";

export type EmbeddingMode = "fast" | "semantic";

export type InputShape =
  | "article-html"
  | "technical-doc-html"
  | "discussion-thread"
  | "markdown"
  | "markdown-resource-list"
  | "read-later-csv"
  | "feed-xml"
  | "json-export"
  | "plain-text"
  | "partial-html"
  | "empty"
  | "unsupported-pdf"
  | "unknown";

export type DiagnosticSeverity = "info" | "warning" | "error";

export interface ImportDiagnostic {
  severity: DiagnosticSeverity;
  code: string;
  what: string;
  why: string;
  nowWhat: string;
  field?: string;
}

export interface ImportConfidence {
  score: number;
  label: "low" | "medium" | "high";
  reasons: string[];
}

export interface ImportMetadata {
  shape: InputShape;
  parser: string;
  sourceFilename?: string;
  sourceUrl?: string;
  sourceIdentifier: string;
  language?: string;
  confidence: ImportConfidence;
  diagnostics: ImportDiagnostic[];
}

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
  importMeta?: ImportMetadata;
}

export interface ArticleDraft {
  title: string;
  sourceUrl?: string;
  author?: string;
  content: string;
  tags?: string[];
  importMeta?: ImportMetadata;
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
  lowConfidenceArticleIds: string[];
  inputWarnings: string[];
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
  status: "accepted" | "warned" | "rejected";
  shape: InputShape;
  confidence: ImportConfidence;
  diagnostics: ImportDiagnostic[];
  warnings: string[];
  errors: string[];
  sourceIdentifier: string;
}
