# 0047 - Error Taxonomy and Messaging

## Status

Accepted

## Context

Current failures leak parser internals or disappear.

## Decision

Each diagnostic has severity, code, what, why, now what, and optional field. A
recoverable error rejects only the problematic input and keeps existing work.
Fatal errors are reserved for platform/storage failures.

## Consequences

- Tests assert actionable error content.
- Users know whether to retry, replace, edit, or skip an input.

## Alternatives Considered

- Throw exceptions from parsers. Rejected except for truly unexpected failures at
  the UI boundary.
