# 0064 - DRY Consolidation Map

## Status

Accepted

## Decision

Consolidate around three single sources of truth:

1. Import workflow: parse input -> diagnostics -> normalized articles.
2. App-state serialization: export/import/share all use the same state schema.
3. UI persistence: draft/query/helper state lives behind one persistence API.

## Consequences

- `App.tsx` becomes thinner.
- Future input/output features reuse the same boundary code instead of
  diverging.
