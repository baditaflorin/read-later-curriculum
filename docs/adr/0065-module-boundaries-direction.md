# 0065 - Module Boundaries and Dependency Direction

## Status

Accepted

## Decision

Keep dependency direction as:

`App` UI -> feature workflows -> storage/import/export helpers -> shared
primitives.

App-state and import workflows should move out of `App.tsx`, but storage remains
a feature-level concern because this is still a small Mode A app.

## Consequences

- We avoid introducing overbuilt interfaces everywhere.
- Shared helpers become easier to test directly.
