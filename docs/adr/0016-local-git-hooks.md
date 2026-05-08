# 0016 - Local Git Hooks

## Status

Accepted

## Context

The prompt prohibits GitHub Actions and asks for local hooks.

## Decision

Use plain `.githooks/` scripts wired by `make install-hooks`.

## Consequences

- Checks run locally before commits and pushes.
- Hooks remain inspectable shell scripts.
- Contributors need local tools such as `gitleaks` for full secret scanning.

## Alternatives Considered

- Lefthook. Good option, but plain scripts are enough for v1.
