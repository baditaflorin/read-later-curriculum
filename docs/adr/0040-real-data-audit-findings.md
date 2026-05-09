# 0040 - Real-Data Audit Findings and Substance Metrics

## Status

Accepted

## Context

The v1 app succeeds on curated demo articles but fails on common real read-later
inputs: CSV exports, feeds, PDFs, threads, large Markdown lists, partial clips,
empty files, and malformed JSON.

## Decision

Use the 10 inputs in `docs/phase2-substance/realdata-audit.md` as the Phase 2
grading rubric. Phase 2 succeeds when at least 7/10 complete the primary flow
without manual correction and 10/10 either produce useful output or actionable
errors.

## Consequences

- Every inference change must be tested against the fixture set.
- Wrong-confident output is a blocker.
- Unsupported inputs may be rejected, but only with domain-specific recovery.

## Alternatives Considered

- Continue from synthetic demo data. Rejected because it masks the product risk.
