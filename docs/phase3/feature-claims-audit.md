# Phase 3 Feature Claims Audit

Date: 2026-05-10

Sources checked:

- `README.md`
- `docs/data.md`
- `docs/architecture.md`
- `docs/postmortem-phase2-substance.md`

| Claim                                                                             | Status  | Evidence                                                                                     | Mismatch                                                                                                          |
| --------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "Add pasted article text"                                                         | Shipped | The paste import panel accepts raw text and stores it through the shared importer.           | None.                                                                                                             |
| "Import `.txt`, `.md`, `.html`, `.csv`, `.xml`, `.json` exports"                  | Shipped | File picker and drag/drop use the same import workflow for these types.                      | None.                                                                                                             |
| "Store articles, settings, generated plans, and session draft state in IndexedDB" | Shipped | Articles, settings, plans, manual draft fields, paste buffer, and query state are persisted. | README wording was narrowed away from implying richer in-progress reading telemetry than the app actually tracks. |
| "Export curriculum JSON and Pandoc-ready Markdown"                                | Shipped | `Plan JSON` and `Markdown` exports both work.                                                | None.                                                                                                             |
| "Export and restore the full workspace as State JSON"                             | Shipped | `State JSON` plus state import restore the full workspace and are covered by smoke tests.    | None.                                                                                                             |
| "Share small workspace snapshots by URL"                                          | Shipped | `Share URL` emits a `#state=` link for small states and blocks large ones honestly.          | None.                                                                                                             |
| "Inspect import decisions with `?debug=1`"                                        | Shipped | Debug panel exists and now includes UI-state context too.                                    | Still intentionally low-discoverability for power users.                                                          |
| `docs/data.md` describes stable, versioned user export formats                    | Shipped | Plan JSON and app-state JSON both carry kind/schema/version metadata.                        | None.                                                                                                             |
| "Quickstart" reaches a canonical user story                                       | Shipped | README now covers import, build, state export, reload/restore, and smoke validation.         | None.                                                                                                             |

Highest-priority documentation drift fixed in Phase 3:

1. The README no longer overclaims generic "reading state" beyond what the product persists.
2. Export documentation now distinguishes plan output from full workspace state.
3. Quickstart now describes the real save/restore loop instead of stopping at the demo.
