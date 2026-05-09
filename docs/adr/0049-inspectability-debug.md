# 0049 - Inspectability and Debug Surface

## Status

Accepted

## Context

Power users and maintainers need to see why imports and plans look the way they
do.

## Decision

Add `?debug=1` to reveal import metadata, confidence reasons, warnings, and
plan state. Keep it read-only and local.

## Consequences

- Support and future fixture work become easier.
- Debug data must not leave the browser.

## Alternatives Considered

- Console-only diagnostics. Rejected because production users should not need
  devtools.
