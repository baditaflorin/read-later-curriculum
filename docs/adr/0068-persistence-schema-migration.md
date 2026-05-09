# 0068 - Persistence Schema and Migration Policy

## Status

Accepted

## Decision

Introduce a versioned app-state schema and move persisted UI/session state into
 IndexedDB alongside articles, plans, and settings. Dexie schema upgrades must
 preserve prior user data.

## Consequences

- Full reset can be precise and complete.
- Full-state export/import can be validated against one schema.
