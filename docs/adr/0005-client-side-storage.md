# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

User article content is private and must remain local by default.

## Decision

Use IndexedDB through Dexie for articles, curriculum plans, and settings.
Use localStorage only for small UI preferences where losing data is acceptable.

## Consequences

- Large article bodies do not block the main thread like localStorage would.
- Data remains available offline in the browser profile.
- Cross-device sync is intentionally absent in v1.

## Alternatives Considered

- OPFS. Useful for larger binary artifacts, but unnecessary for text-heavy v1.
- Runtime database. Rejected by ADR 0001.
