# Phase 3 Codebase Audit

Date: 2026-05-10

This is the post-implementation measurement pass.

## DRY Improvements

1. Import normalization and article conversion now flow through one shared workflow.
   Files:
   - [src/features/articles/importWorkflow.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/features/articles/importWorkflow.ts:1)
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:1)
     The UI no longer hand-rolls separate file, paste, and manual-import branches.

2. App-state serialization and validation are centralized.
   Files:
   - [src/features/storage/appState.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/features/storage/appState.ts:1)
   - [src/features/storage/db.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/features/storage/db.ts:1)
     Full export, share-link encode/decode, and restore all use one versioned schema.

3. Session continuity now uses a single persistence pathway.
   Files:
   - [src/features/storage/db.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/features/storage/db.ts:1)
   - [src/shared/constants.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/shared/constants.ts:1)
     Query, draft fields, and paste buffer defaults are no longer scattered through the component.

Remaining DRY debt:

1. [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:1) still owns a broad slice of mutation orchestration and rendering.
2. [src/shared/text.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/shared/text.ts:1) still mixes text processing, hash helpers, IDs, and browser export utilities.

## SOLID Snapshot

1. `App.tsx` is still the biggest module, but core workflow logic moved into dedicated import and app-state helpers.
2. `db.ts` now models UI state alongside domain state, so persistence concerns no longer leak back into UI handlers.
3. `appState.ts` forms a clean seam for full-workspace serialization, restore, and share-link behavior.

## Dead Code

- The unused imports called out in the audit were removed.
- No dormant feature flags were found.
- No commented-out blocks or TODO markers remain in source files.

## TODO / FIXME / XXX / HACK Count

- `0` in source files.

## Type Safety

1. The unsafe `embeddingMode` cast in the UI was removed.
2. Sample-data loading now validates JSON through shared schemas before use.
3. App-state imports validate through a dedicated zod schema before they touch runtime state.
4. Remaining `unknown` usage is boundary-oriented parser code that narrows through schema checks or parser branches.

## Inconsistent Patterns

1. Import, state export, and restore flows now use one status/reporting pattern.
2. Persistence for domain state and UI state now both live in IndexedDB.
3. The largest remaining inconsistency is that `App.tsx` still renders and orchestrates a lot of behavior in one place.

## Real-User Test Coverage

Added in Phase 3:

1. Draft persistence across reload.
2. Full-state export/import round-trip.
3. State restore from production UI controls rather than direct helper calls.

Still thin:

1. Drag/drop is exercised indirectly through the shared import workflow, but not yet through a dedicated browser drag event test.
2. Print and share-link flows rely on helper behavior and smoke-level interaction rather than browser-engine matrix tests.
