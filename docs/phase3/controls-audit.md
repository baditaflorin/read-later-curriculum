# Phase 3 Controls Audit

Date: 2026-05-09

Scope: production UI controls in `src/App.tsx`.

| Control | Status | Notes |
| --- | --- | --- |
| `Star` link | Green | Opens repository. |
| `PayPal` link | Green | Opens support URL. |
| File import button | Yellow | Imports files, but only via picker, with no drag/drop or state import path. |
| Manual `Add` | Green | Saves a normalized article. |
| `Demo Set` | Green | Loads sample fixtures. |
| `Clear local library` | Yellow | Clears articles and plan, but leaves settings and draft state untouched because draft state does not exist yet. |
| Search input | Green | Filters articles. |
| Article `Toggle done` | Green | Persists status. |
| Article `Archive` | Green | Persists status. |
| Article `Delete` | Green | Deletes one article. |
| `Add slot` | Green | Adds a schedule slot. |
| Slot weekday/time/minutes edits | Green | Persist through settings. |
| Slot remove | Green | Removes a schedule slot. |
| `Build` | Green | Generates a plan with progress and cancellation. |
| `Cancel` during build | Green | Aborts curriculum generation. |
| `MD` export | Green | Downloads Markdown. |
| `JSON` export | Yellow | Downloads plan JSON, but label suggests a general export rather than a plan-only export. |
| Debug panel | Yellow | Works via `?debug=1`. | No in-app hint, no structured stranger-facing help, and debug state is not persisted. |

Control gaps with real-user impact:

1. No control exists for paste import, clipboard read, drag/drop, full-state export/import, share, print, or reset settings.
2. `JSON` export label is underspecified for a stranger because it exports only the generated plan.
