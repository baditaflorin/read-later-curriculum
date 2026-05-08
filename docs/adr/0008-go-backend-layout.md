# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap prompt defines Go backend requirements for Modes B/C.

## Decision

Skip Go backend scaffolding in v1 because ADR 0001 selects Mode A. If Mode B/C
is introduced later, use the requested layout: `cmd/`, `internal/`, `pkg/`,
`api/`, `configs/`, `scripts/`, and `test/`.

## Consequences

- The repository stays focused on the static app.
- No unused Docker, Go, or server code is committed.

## Alternatives Considered

- Scaffold empty Go directories. Rejected because empty architecture is noise.
