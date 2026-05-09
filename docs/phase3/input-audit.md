# Phase 3 Input Audit

Date: 2026-05-09

Mode: A, unchanged.

Legend:

- Green: works fully for a stranger on the live app.
- Yellow: works partially, but has real-user friction or missing coverage.
- Red: claimed/expected pathway is missing or broken.

| Pathway | Status | Current behavior | Gap |
| --- | --- | --- | --- |
| File upload | Yellow | Multi-file file picker imports supported text, HTML, CSV, XML, JSON, rejects PDFs honestly. | No per-file summary, no drag target, no state-file import, no progress surface. |
| Drag and drop | Red | Not implemented. | Stranger cannot drag exports into the app. |
| Paste text | Yellow | Manual form can accept pasted text, but only after the user manually fills title/body fields. | No one-step paste import and no auto-detection from raw clipboard content. |
| Paste HTML | Red | Not implemented. | User must save HTML to disk first. |
| Paste JSON export | Red | Not implemented. | Export round-trip depends on filesystem only. |
| Clipboard read | Red | Not implemented. | No permission-aware "read from clipboard" path. |
| URL input | Yellow | Manual entry accepts a URL field alongside article text. | No URL import or even honest inline guidance for CORS-limited fetches. |
| Multi-file batch | Yellow | Works for file picker imports. | No aggregate success/error summary beyond a short toast. |
| Mobile picker | Yellow | Browser file input should work. | No explicit UI language or testing around camera/files/share-sheet flows. |
| Demo/sample import | Green | `Demo Set` loads sample data reliably. | None beyond being too prominent compared with "your data". |
| Deep-link/shared state import | Red | Not implemented. | No URL-based reopen/share path. |
| Imported full app state | Red | Not implemented. | No library/settings/plan round-trip import. |
| Restored unsaved draft | Red | Not implemented. | Typing in the form and reloading loses work. |
| Restored last session query/UI state | Red | Not implemented. | Search query and editing context reset on reload. |

Before implementation count:

- Green: 1
- Yellow: 5
- Red: 8
