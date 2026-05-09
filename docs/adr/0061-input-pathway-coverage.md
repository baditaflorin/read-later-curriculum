# 0061 - Input Pathway Coverage Policy

## Status

Accepted

## Context

The app depended too heavily on file upload, even though real usage often
 starts with drag-drop, clipboard paste, or reopening a saved workspace.

## Decision

Support four primary input families in production UI:

1. File import
2. Drag-drop import
3. Paste / clipboard import
4. Full-state restore import

Unsupported direct URL fetch stays out of scope in Mode A; the UI should say so
 honestly and steer the user toward paste or exported files.

## Consequences

- Import flows share one normalization path.
- File-only assumptions are removed from the UI.
