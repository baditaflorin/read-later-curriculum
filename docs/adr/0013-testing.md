# 0013 - Testing Strategy

## Status

Accepted

## Context

The app has pure curriculum logic, browser storage, and user-facing flows.

## Decision

Use Vitest for pure logic and React component tests. Use Playwright for one
happy-path smoke flow against the built `docs/` output. `make test`,
`make build`, and `make smoke` are the local quality gates.

## Consequences

- Core ordering and scheduling can be tested quickly.
- The Pages build is verified through a real browser.
- Integration tests are available as a separate target.

## Alternatives Considered

- GitHub Actions. Rejected by the prompt.
