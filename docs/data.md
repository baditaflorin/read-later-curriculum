# Data Contract

Schema version: `v1`

Sample artifacts:

- `docs/data/v1/sample-articles.json`
- `docs/data/v1/sample-articles.meta.json`

User export:

- `read-later-curriculum-v1.json`
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
}
```

## Freshness

Sample metadata includes generated time, source commit, checksum, schema
version, and count. User-owned IndexedDB data is not uploaded anywhere.

Regenerate sample data:

```sh
make data
```
