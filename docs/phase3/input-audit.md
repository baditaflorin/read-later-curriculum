# Phase 3 Input Audit

Date: 2026-05-10

Mode: A, unchanged.

Legend:

- Green: works fully for a stranger on the live app.
- Yellow: works partially, but has real-user friction or missing coverage.
- Red: claimed/expected pathway is missing or broken.

| Pathway                              | Status | Current behavior                                                                                                                                           | Gap                                                                                           |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| File upload                          | Green  | Multi-file picker imports supported text, HTML, CSV, XML, JSON, and full app-state `.json` exports. Unsupported PDFs fail with actionable recovery text.   | No visual progress bar for very large file batches.                                           |
| Drag and drop                        | Green  | The import panel accepts dragged files and uses the same validated import workflow as the picker.                                                          | None in normal desktop flows.                                                                 |
| Paste text                           | Green  | Raw pasted text can be imported in one step through the paste panel. The app infers title/content, normalizes text, and stores import diagnostics.         | None for text-sized inputs.                                                                   |
| Paste HTML                           | Green  | Raw pasted HTML routes through the same parser pipeline as uploaded `.html` files.                                                                         | None in supported browser environments.                                                       |
| Paste JSON export                    | Green  | Full workspace exports can be pasted back into the app and restored without using the filesystem.                                                          | Very large states are better handled as downloaded files.                                     |
| Clipboard read                       | Green  | `Read Clipboard` requests permission, reads available text/HTML, and drops it into the paste workflow.                                                     | Browser permission prompts can still be denied by the user.                                   |
| URL input                            | Yellow | Manual entry still accepts a source URL, and the import panel now explains that direct fetching is not attempted in Mode A because of browser CORS limits. | No direct URL fetch, by design. Users still need to paste content or import an exported file. |
| Multi-file batch                     | Green  | Batch imports work through picker and drag/drop and report a combined success/error summary.                                                               | Per-file progress is still summarized rather than streamed.                                   |
| Mobile picker                        | Yellow | Standard browser file inputs remain available, and the input copy now treats Files/share-sheet flows as first-class.                                       | Not device-lab tested on iOS/Android hardware during this phase.                              |
| Demo/sample import                   | Green  | `Demo Set` still loads sample data reliably as a first-run option, without blocking real-data pathways.                                                    | None.                                                                                         |
| Deep-link/shared state import        | Green  | Small workspace snapshots can be reopened from `#state=` URLs and hydrate the full workspace.                                                              | Large states intentionally fall back to state-file export instead of oversized URLs.          |
| Imported full app state              | Green  | State JSON restores articles, plan, settings, draft text, paste buffer, and query state in one operation.                                                  | None.                                                                                         |
| Restored unsaved draft               | Green  | Title, source URL, tags, article text, and paste buffer survive reload via IndexedDB-backed UI state.                                                      | None.                                                                                         |
| Restored last session query/UI state | Green  | Search query and editing context restore on reload and after browser restart.                                                                              | None.                                                                                         |

Before implementation count:

- Green: 1
- Yellow: 5
- Red: 8

After implementation count:

- Green: 11
- Yellow: 2
- Red: 0

Notes:

1. The two remaining yellow rows are intentional Mode A constraints, not hidden breakage.
2. Direct URL fetching stays out of scope because the app is static and keeps secrets out of the browser.
