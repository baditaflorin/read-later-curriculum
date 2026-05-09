# Phase 3 Stranger Test

Date: 2026-05-10

Method:

- Private browser session.
- Fresh IndexedDB state.
- Real workflow: load sample data, build a curriculum, export state, reset, restore, reload, then try a paste-based import path.

## Findings

1. The old product shape forced a stranger to guess whether `JSON` meant "plan export" or "save my whole workspace."
   Fixed:
   - Separate `Plan JSON` and `State JSON` controls.
   - Dedicated state import path.

2. Reloading too quickly after typing draft text could feel risky because session continuity was not guaranteed.
   Fixed:
   - Draft fields, paste buffer, and query state now persist immediately into IndexedDB-backed UI state.

3. Reopening work across devices or browser profiles was awkward because there was no honest continuity artifact.
   Fixed:
   - Full workspace export/import and small-state share URLs.

4. The app still expects the user to understand that direct URL fetch is not part of a static GitHub Pages product.
   Accepted:
   - The import UI now says so plainly and points the user toward paste or exported files.

## Top 3 Issues Addressed Before Release

1. Full workspace round-trip.
2. Reliable draft/query persistence.
3. Clear export labeling and recovery paths.

## Remaining Confusions

1. `?debug=1` is still something a power user or maintainer will use, not a first-run user.
2. Share URLs intentionally stop working for larger workspaces, which is correct but still a point of education.
