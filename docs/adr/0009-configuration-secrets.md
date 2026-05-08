# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

The frontend must never contain secrets.

## Decision

Use no secrets in v1. Build metadata may be provided by environment variables
`VITE_COMMIT_SHA` and `VITE_BUILT_AT`, with placeholders in `.env.example`.

## Consequences

- `.env*` files are gitignored except `.env.example`.
- No OAuth, API keys, or private endpoints are needed.
- Optional browser AI features use user-local browser capabilities only.

## Alternatives Considered

- BYO API keys. Rejected for v1 because the project is about local synthesis.
