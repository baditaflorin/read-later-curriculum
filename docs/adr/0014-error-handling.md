# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Local browser work can fail due to storage limits, model downloads, malformed
imports, or unsupported AI APIs.

## Decision

Use typed `Result`-style return values for pure parsing utilities where useful,
throw ordinary `Error` objects for unexpected async failures, and convert them
to user-visible messages at UI boundaries. Never panic or leave failures silent.

## Consequences

- Users see actionable import/build failures.
- Tests can assert failure messages without relying on console output.

## Alternatives Considered

- Global catch-all only. Rejected because feature-specific errors need context.
