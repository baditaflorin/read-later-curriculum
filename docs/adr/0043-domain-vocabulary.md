# 0043 - Domain Vocabulary and UI Language

## Status

Accepted

## Context

Errors like zod validation objects or "Unexpected token" do not help readers.

## Decision

Use read-later domain words: article, source URL, saved item, read-later export,
feed, thread, partial clip, unsupported PDF, import confidence, and next step.

## Consequences

- Diagnostics become user-facing and testable.
- Internal parser names stay in debug/provenance, not primary error copy.

## Alternatives Considered

- Surface raw parser errors. Rejected as toy-like.
