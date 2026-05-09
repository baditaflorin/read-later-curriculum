# Phase 3 Plan

Ranking rule: unblock a stranger using their own data end-to-end before any
internal cleanup.

## Picklist

1. Add drag-and-drop import.
2. Add paste import from a dedicated raw-input box.
3. Add clipboard-read import with permission-aware fallback.
4. Add aggregate batch-import summaries.
5. Add full app-state export.
6. Add full app-state import.
7. Make export/import round-trip deterministic and tested.
8. Add shareable URL state for reasonably small workspaces.
9. Add print-friendly plan export.
10. Add copy Markdown to clipboard.
11. Add copy JSON/state to clipboard.
12. Persist unsaved manual draft across reload.
13. Persist search query across reload.
14. Persist import helper text/source mode across reload.
15. Add full reset/start-fresh, including settings and UI state.
16. Add IndexedDB migration policy for new persisted UI/app-state keys.
17. Extract a canonical app-state serialization module.
18. Extract a canonical import workflow module.
19. Remove `App.tsx` export/import duplication.
20. Remove unsafe `embeddingMode` cast.
21. Validate sample-data fetch through shared schemas.
22. Add README limitations and reality-aligned feature checklist.
23. Add output-path tests for full-state round-trip.
24. Add UI/session persistence tests.
25. Run a stranger-style private-browser test and fix the top three blockers.

## Implementation Order

1. ADRs for completeness, persistence, input/output policy, and boundaries.
2. App-state model plus storage migration.
3. Import surface expansion: drag-drop, paste, clipboard, state import.
4. Output surface expansion: full-state export, copy, share, print.
5. Session continuity: draft/query/UI persistence and start-fresh reset.
6. DRY cleanup around import/export/state.
7. Docs alignment, stranger test, postmortem, release.
