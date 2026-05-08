# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app needs article ingestion, local persistence, search, synthesis,
curriculum planning, scheduling, export, and a polished browser UI.

## Decision

Use feature-oriented frontend modules under `src/features/`:

- `articles`: parsing, normalization, library operations.
- `curriculum`: embeddings, clustering, dependency ordering, scheduling.
- `settings`: free-time slots and local preferences.
- `storage`: IndexedDB repositories.
- `ui`: shared accessible components.

Shared constants, types, and utility functions live under `src/shared/`.

## Consequences

- Core synthesis logic can be unit-tested without React.
- Browser-only infrastructure stays out of pure logic modules.
- Future Mode B/C additions can reuse the domain contracts without rewriting
  the UI.

## Alternatives Considered

- A flat `components/` tree. Rejected because the domain logic is more important
  than presentational composition.
- Server-first modules. Rejected by ADR 0001.
