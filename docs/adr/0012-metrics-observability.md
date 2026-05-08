# 0012 - Metrics and Observability

## Status

Accepted

## Context

The prompt asks for privacy-respecting analytics only if usage insight matters.

## Decision

Ship no analytics in v1. Observable health is limited to local UI states,
build metadata, smoke tests, and user-reported issues.

## Consequences

- No PII or article metadata leaves the browser.
- There is no usage dashboard.

## Alternatives Considered

- Plausible analytics. Deferred until there is a clear product question.
