# Phase 3 Postmortem

Date: 2026-05-10

Version: v0.3.0

## Audit Grids: Before vs After

### Input Audit

- Before: 1 green / 5 yellow / 8 red
- After: 11 green / 2 yellow / 0 red

### Output Audit

- Before: 2 green / 1 yellow / 7 red
- After: 8 green / 2 yellow / 0 red

### Controls Audit

- Before: several production controls were missing, ambiguous, or partial.
- After: all production controls are wired end-to-end; the only intentional power-user surface is debug mode behind `?debug=1`.

## Half-Baked Feature Triage Outcomes

- JSON export: finished as two explicit pathways, `Plan JSON` and `State JSON`.
- Paste input: finished as a real importer rather than a manual-entry workaround.
- Clear/reset: finished as `Start fresh`, which clears full workspace and UI state.
- Debug mode: kept and documented, still intentionally low-profile.
- Broad "reading state" wording: narrowed in docs to match the persisted behavior the app actually has.

## Codebase Health: Before vs After

- DRY: repeated import/state logic consolidated into `importWorkflow.ts` and `appState.ts`.
- TODO / FIXME / XXX / HACK count: 0 before, 0 after.
- Unsafe UI cast count: reduced by removing the `embeddingMode` cast.
- Dead code: unused imports removed.
- Real-user path coverage: now includes draft persistence and full-state round-trip smoke coverage.

## Stranger-Test Findings

Top three issues found and fixed:

1. unclear export naming
2. weak confidence in reload persistence
3. no full reopen/share loop

Recorded in: [docs/phase3/stranger-test.md](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-read-later-that/docs/phase3/stranger-test.md)

## Documentation / Reality Mismatches Fixed

1. README now distinguishes plan export from full workspace export.
2. README no longer overclaims generic reading-state persistence.
3. Data contract now documents the app-state export format and its versioning.
4. Quickstart now maps to a real user loop rather than only a build/demo loop.

## What Surprised Me

1. The continuity gap was more important than any new feature. Once the app could reopen full workspaces and preserve drafts, it felt substantially more real.
2. The ambiguous old `JSON` label carried more confusion than expected. Naming turned out to matter because export intent is central to trust.
3. The biggest remaining technical drag is still `App.tsx`; the usability work is there, but the component wants another split in a future phase.

## Phase 4 Candidates

1. Split `App.tsx` into feature-owned panels and mutation hooks.
2. Add dedicated drag/drop browser-level e2e coverage.
3. Add richer print/share regression tests across browser engines.
4. Extract the mixed helper surface in `src/shared/text.ts`.
5. Decide whether image export belongs in-product or should stay out of scope.

## Honest Take

Could a stranger use this app for their own real work, end-to-end, with zero help?

Mostly yes, for the intended static, local-first workflow: import files or pasted content, build a plan, export or share it, leave, come back, and restore the workspace.

Where the answer is still not fully yes:

1. The app still does not fetch arbitrary URLs for you, so users must paste content or import files.
2. Very large workspaces cannot be encoded into a share URL and must use `State JSON`.
3. The debug surface is still maintainer-oriented rather than user-oriented.
