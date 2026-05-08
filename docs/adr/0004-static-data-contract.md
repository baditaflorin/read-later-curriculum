# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no shared backend dataset. The app still needs stable contracts for
sample data, local exports, and future import compatibility.

## Decision

Use versioned JSON contracts:

- `docs/data/v1/sample-articles.json`
- `docs/data/v1/sample-articles.meta.json`
- user export file: `read-later-curriculum-v1.json`

Article records include `id`, `title`, `sourceUrl`, `content`, `tags`,
`readingMinutes`, `wordCount`, timestamps, and `status`. Curriculum exports
include `schemaVersion`, `generatedAt`, `topics`, `sessions`, and `settings`.

## Consequences

- The frontend can seed realistic sample articles without a server.
- Exported user data is portable and easy to inspect.
- Breaking schema changes require a new `/data/v2/` path.

## Alternatives Considered

- SQLite or Parquet static files. Rejected for v1 because there is no shared
  corpus and JSON is enough for sample data and exports.
