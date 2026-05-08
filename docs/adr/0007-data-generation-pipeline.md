# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B is not used, but the project still benefits from a tiny reproducible
sample-data generator for demos and smoke tests.

## Decision

Provide `make data`, which runs `scripts/generate-sample-data.mjs` and writes
small deterministic artifacts to `docs/data/v1/`.

## Consequences

- Demo data can be regenerated locally.
- There is no scheduled backend pipeline.
- The artifact contract follows ADR 0004.

## Alternatives Considered

- Commit hand-written sample JSON only. Rejected because metadata and checksums
  are useful for testing the contract.
