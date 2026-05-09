# Phase 3 Controls Audit

Date: 2026-05-10

Scope: production UI controls in `src/App.tsx`.

| Control                         | Status | Notes                                                                        |
| ------------------------------- | ------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Star` link                     | Green  | Opens the repository URL.                                                    |
| `PayPal` link                   | Green  | Opens the support URL.                                                       |
| File import button              | Green  | Imports article files and full state files through the shared workflow.      |
| Drag/drop target                | Green  | Accepts the same file types as the picker and shows import feedback.         |
| Paste import textarea           | Green  | Accepts pasted text, HTML, and JSON state payloads.                          |
| `Import Paste`                  | Green  | Routes paste content through the validated import workflow.                  |
| `Read Clipboard`                | Green  | Reads clipboard text/HTML with browser permission handling.                  |
| Manual `Add`                    | Green  | Saves a normalized manual article draft.                                     |
| `Demo Set`                      | Green  | Loads sample fixtures.                                                       |
| `Start fresh`                   | Green  | Clears articles, plan, settings, draft state, paste buffer, and query state. |
| Search input                    | Green  | Filters articles and persists the query on reload.                           |
| Article `Toggle done`           | Green  | Persists status.                                                             |
| Article `Archive`               | Green  | Persists status.                                                             |
| Article `Delete`                | Green  | Deletes one article.                                                         |
| `Add slot`                      | Green  | Adds a schedule slot.                                                        |
| Slot weekday/time/minutes edits | Green  | Persist through settings.                                                    |
| Slot remove                     | Green  | Removes a schedule slot.                                                     |
| `Build`                         | Green  | Generates a plan with progress and cancellation.                             |
| `Cancel` during build           | Green  | Aborts curriculum generation.                                                |
| `Markdown`                      | Green  | Downloads Markdown.                                                          |
| `Plan JSON`                     | Green  | Downloads plan JSON with clear labeling.                                     |
| `State JSON`                    | Green  | Downloads the full reopenable workspace.                                     |
| `Copy MD`                       | Green  | Copies Markdown to the clipboard.                                            |
| `Copy State`                    | Green  | Copies full state JSON to the clipboard.                                     |
| `Share URL`                     | Green  | Copies a deep-link for small workspaces and honestly blocks oversize states. |
| `Print`                         | Green  | Opens the current plan in a print-friendly view.                             |
| Debug panel                     | Yellow | Works via `?debug=1` and now exposes UI state too.                           | Still intentionally power-user-facing rather than a mainstream control. |

Control gaps with real-user impact:

1. No production control remains as a stub.
2. The only intentionally non-mainstream surface left is the debug panel behind `?debug=1`.
