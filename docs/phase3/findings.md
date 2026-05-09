# Phase 3 Findings

Date: 2026-05-09

## Top 5 Usability Gaps

1. A stranger cannot save and reopen their whole workspace. The app exports a
   plan, not the state needed to continue later.
2. The main import surface is still file-picker-centric. Drag/drop, paste, and
   clipboard-driven flows are absent.
3. Reloading loses unsaved work and view context. Draft text and search intent
   are not persisted.
4. The app offers no small-state sharing path, so collaboration and
   "send me what you see" debugging both stop at screenshots.
5. The README claims are slightly ahead of reality, especially around reading
   state and export completeness.

## Top 5 Half-Baked Features

1. JSON export: finish as a full state export, not just a plan dump.
2. Paste input: finish as a real importer, not just a manual-entry textarea.
3. Clear local library: finish as a full reset/start-fresh pathway.
4. Debug mode: keep, but make it documented and testable rather than hidden lore.
5. Reading state persistence: either finish session continuity or remove the
   broader claim.

## Top 5 Codebase Pain Points

1. `src/App.tsx` is carrying too much application logic.
2. Import handling is split between file-specific parser code and UI-only draft
   normalization logic.
3. Export and persistence policies are not represented by one canonical app
   state type.
4. UI/session state has no persistence layer.
5. Type-safe boundary parsing exists for many imports but not for sample data or
   future app-state restore.

## Top 5 Documentation / Reality Mismatches

1. README says "reading state" is stored, but only coarse article status exists.
2. Export documentation implies a stable user-owned format, but only the plan is
   exportable today.
3. "Add pasted article text" reads like a smart import path, but the product
   still expects manual field mapping.
4. Quickstart stops at demo/build and does not cover a user's real end-to-end
   save/restore loop.
5. Debug mode is documented only indirectly.

## Fully Usable Means

1. A stranger can import their own article files or pasted content without
   asking how to format it.
2. A stranger can leave and come back later without losing unsaved work,
   settings, or the current library.
3. A stranger can export the entire workspace, re-import it, and get back to
   the same place.
4. A stranger can share a small workspace snapshot or print a generated plan
   without editing files by hand.
5. The README describes only tested, visible behavior.

## Phase 3 Success Metrics

1. Input audit ends with at least 10 green rows and no red rows that remain in
   production without an ADR-backed out-of-scope reason.
2. Output audit ends with at least 7 green rows and no red rows for features
   exposed in production UI.
3. Full app-state export/import round-trip passes automated tests.
4. Unsaved draft and search query survive reload.
5. Stranger-test top three blockers are fixed before release.
6. Phase 2 real-data fixture suite remains green.

## Out Of Scope

- No new runtime backend.
- No new recommendation engine work.
- No visual polish phase, redesign, or animation spree.
- No PDF extraction engine.
- No sync/accounts/cross-device cloud storage.
