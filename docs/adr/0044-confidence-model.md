# 0044 - Confidence Model

## Status

Accepted

## Context

Wrong-confident imports are the worst Phase 2 failure.

## Decision

Every import batch and article carries a confidence score from 0 to 1, a label
of low/medium/high, and reasons. Low confidence is visible in the UI and
included in exports. Unsupported inputs emit errors instead of articles.

## Consequences

- Users can tell when the app is unsure.
- Curriculum planning can annotate or down-rank dubious items.
- Tests can assert "not wrong-confident" even for judgmental inputs.

## Alternatives Considered

- Boolean valid/invalid. Rejected because many real inputs are usable but risky.
