# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server-side logs. Browser console noise should be minimal.

## Decision

Production code avoids routine console logging. User-visible failures are shown
through inline status and toast messages. Development-only diagnostics may be
added behind `import.meta.env.DEV`.

## Consequences

- Public users are not asked to inspect devtools.
- Smoke tests can assert no obvious runtime console errors.

## Alternatives Considered

- Client log collection. Rejected to preserve privacy.
