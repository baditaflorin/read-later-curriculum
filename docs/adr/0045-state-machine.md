# 0045 - State Taxonomy and State Machine

## Status

Accepted

## Context

Real imports and long builds need coherent recoverable states.

## Decision

Use the states in `docs/phase2-substance/states.md`. Import and build operations
must expose pending, success, warned, recoverable rejection, and fatal states.
Build cancellation preserves the prior plan.

## Consequences

- No silent empty outcomes.
- Double-click build/import becomes deterministic.
- Future UI work can polish known states instead of inventing them.

## Alternatives Considered

- Keep implicit React mutation states only. Rejected because domain recovery
  needs richer state.
