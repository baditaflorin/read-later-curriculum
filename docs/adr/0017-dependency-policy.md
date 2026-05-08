# 0017 - Dependency Policy

## Status

Accepted

## Context

The app relies on local search, storage, parsing, AI adapters, and testing.

## Decision

Prefer production-ready libraries with active maintenance and browser support.
Run `npm audit --omit=dev` and avoid shipping high or critical vulnerabilities.
Heavy AI libraries must be lazy-loaded behind user action.

## Consequences

- Initial payload stays focused on the usable app.
- Vulnerable packages are replaced or removed before release.

## Alternatives Considered

- Custom search, clustering, or storage primitives. Rejected where proven
  browser libraries exist.
