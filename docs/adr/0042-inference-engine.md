# 0042 - Inference Engine

## Status

Accepted

## Context

The v1 importer assumes one file equals one article. Real read-later inputs have
shapes the app can infer.

## Decision

Add a deterministic input inference layer that classifies files into article
HTML, technical docs, discussion thread, Markdown article, Markdown resource
list, read-later CSV, RSS/Atom feed, JSON export, plain text, partial HTML,
empty, unsupported PDF, or unknown. Each parser emits article drafts,
diagnostics, confidence, parser name, and provenance.

## Consequences

- UI can show useful first guesses and warnings.
- Tests can assert shape and confidence instead of only article count.
- Unsupported/broken inputs stop before becoming saved junk.

## Alternatives Considered

- Add format-specific buttons. Rejected because the app should infer first and
  let the user correct.
