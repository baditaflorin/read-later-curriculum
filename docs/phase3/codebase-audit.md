# Phase 3 Codebase Audit

Date: 2026-05-09

This is a measurement pass before refactoring.

## DRY Violations

1. Import normalization and article conversion are repeated in the UI layer.
   Files:
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:188)
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:229)
   The app converts drafts to normalized articles in several handler-specific ways instead of using one import workflow.

2. Export guard logic is duplicated.
   Files:
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:288)
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:300)
   Both exports repeat the same "plan required" check and download plumbing.

3. Status-to-toast mutation patterns repeat across save, update, settings, build, delete, and clear flows.
   Files:
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:129)
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:275)

## SOLID Violations

1. [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:83) is a god module.
   It owns data queries, mutation orchestration, import flow, manual drafting, scheduling controls, export logic, and most UI rendering.

2. [src/features/storage/db.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/features/storage/db.ts:1) currently models only articles/plans/settings, so any new persistence need pushes UI concerns back into `App.tsx`.

3. [src/shared/text.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/shared/text.ts:1) mixes domain text processing, vector math, ID generation, and browser download helpers.

## Dead Code

- `CalendarClock`, `BookOpenCheck`, and `Download` are imported in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:3) but not used in the rendered UI.
- No dormant feature flags were found.
- No commented-out blocks or TODO markers were found.

## TODO / FIXME / XXX / HACK Count

- `0` in source files.

## Type Safety Holes

1. Unsafe cast in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:543) for `embeddingMode`.
2. Several `unknown` object casts inside [src/features/articles/importers.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/features/articles/importers.ts:389) and neighboring helpers are boundary code, but not all are isolated behind schema parsing yet.
3. `handleLoadSample` trusts fetched JSON shape in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/src/App.tsx:236) instead of reusing a shared schema.

## Inconsistent Patterns

1. Errors are surfaced as toasts in some paths, thrown directly in others, and silently implied by UI state in others.
2. Persistence uses IndexedDB for domain data but no persisted store for drafts, view state, or session continuity.
3. Imports are file-based and schema-aware, while manual input is handled ad hoc in the component.

## Real-User Test Coverage Holes

1. No coverage for draft persistence across reload.
2. No coverage for full-state export/import round-trip.
3. No coverage for drag/drop or paste flows.
4. No coverage for share/deep-link reopening.
