# 0062 - Output Pathway Coverage Policy

## Status

Accepted

## Context

The app could export a generated plan, but not the workspace required to resume
work later.

## Decision

Treat outputs as two separate classes:

1. Human-readable plan outputs: Markdown, print, copy.
2. Reopenable state outputs: full app-state JSON and small share URLs.

Plan JSON alone is not enough for continuity and should not be the only machine
export.

## Consequences

- Output labels must be explicit about what they contain.
- Round-trip tests are required for reopenable outputs.
