# Data Contract

Schema version: `v1`

Sample artifacts:

- `docs/data/v1/sample-articles.json`
- `docs/data/v1/sample-articles.meta.json`

User export:

- `read-later-curriculum-plan-v1.json`
- `read-later-curriculum-state-v1.json`
- `curriculum.md`

## Article

```ts
interface Article {
  id: string;
  title: string;
  sourceUrl?: string;
  author?: string;
  content: string;
  excerpt: string;
  tags: string[];
  wordCount: number;
  readingMinutes: number;
  status: "saved" | "scheduled" | "reading" | "done" | "archived";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  importMeta?: ImportMetadata;
}

interface ImportMetadata {
  shape:
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
  parser: string;
  sourceFilename?: string;
  sourceUrl?: string;
  sourceIdentifier: string;
  language?: string;
  confidence: ImportConfidence;
  diagnostics: ImportDiagnostic[];
}
```

## Curriculum Plan

```ts
interface CurriculumPlan {
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
  lowConfidenceArticleIds: string[];
  inputWarnings: string[];
}
```

## Full App State Export

```ts
interface AppStateExport {
  kind: "read-later-curriculum-state";
  schemaVersion: "v1";
  appVersion: string;
  commit: string;
  exportedAt: string;
  settings: UserSettings;
  plan: CurriculumPlan | null;
  uiState: {
    query: string;
    pastedContent: string;
    pastedFilename: string;
    manualDraft: {
      title: string;
      sourceUrl: string;
      tags: string;
      content: string;
    };
  };
  articles: Article[];
}
```

State exports are the reopenable artifact. They are accepted by the dedicated
state import control and by paste import when the payload is text-safe.

## User Export Provenance

Plan JSON, state JSON, and Markdown exports include:

- app name
- app version
- commit
- schema version
- repository URL
- source identifiers
- parser names
- import shapes
- confidence labels/scores/reasons
- diagnostics and plan warnings

## Freshness

Sample metadata includes generated time, source commit, checksum, schema
version, and count. User-owned IndexedDB data is not uploaded anywhere.

Regenerate sample data:

```sh
make data
```
