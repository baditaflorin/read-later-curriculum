# 0066 - Error Handling Convention

## Status

Accepted

## Decision

All user-triggered failures should surface as:

1. action-specific domain text
2. a toast or inline status
3. a preserved prior state when recovery is possible

Storage/import/export helpers throw typed `Error` messages; UI handlers convert
 them into one user-facing status pathway.
