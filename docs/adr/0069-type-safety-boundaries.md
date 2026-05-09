# 0069 - Type Safety at Boundaries

## Status

Accepted

## Decision

External data sources must cross a schema boundary before use:

- sample data fetch
- full-state import
- share URL decode
- clipboard/paste raw import where the type is ambiguous

Unsafe casts in the UI should be replaced with typed parsers or constrained
helper functions.
