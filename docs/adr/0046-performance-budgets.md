# 0046 - Performance Budgets

## Status

Accepted

## Context

Large real inputs should not make the app feel frozen.

## Decision

Budgets: import preview median under 1 second on fixtures, worst under 5 seconds
or rejected/cancellable; build progress visible after 300 ms; build cancellation
available while synthesis is running. Record fixture import timing in
`docs/phase2-substance/perf.md`.

## Consequences

- Performance becomes measurable per fixture.
- Unsupported huge binary inputs are rejected early.

## Alternatives Considered

- Optimize only after complaints. Rejected because real-data trust depends on
  responsiveness.
