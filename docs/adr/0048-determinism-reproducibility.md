# 0048 - Determinism and Reproducibility

## Status

Accepted

## Context

The same import should produce the same normalized drafts and IDs.

## Decision

Use deterministic parsing, stable ordering, normalized whitespace, stable IDs
from source/content hashes, and export provenance. Explicit timestamps remain
allowed but are isolated from deterministic fixture assertions.

## Consequences

- Fixture tests can compare normalized outputs.
- Re-importing exported app JSON preserves article IDs.

## Alternatives Considered

- Random UUIDs everywhere. Rejected because they break round-trip and
  reproducibility.
