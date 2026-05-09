# Phase 3 Feature Claims Audit

Date: 2026-05-09

Sources checked:

- `README.md`
- `docs/data.md`
- `docs/architecture.md`
- `docs/postmortem-phase2-substance.md`

| Claim | Status | Evidence | Mismatch |
| --- | --- | --- | --- |
| "Add pasted article text" | Partial | Manual form supports pasted text only after manual field mapping. | No one-step paste import. |
| "Import `.txt`, `.md`, `.html`, `.csv`, `.xml`, `.json` exports" | Shipped | File picker + importer support these. | None. |
| "Store articles, reading state, settings, and generated plans in IndexedDB" | Partial | Articles, settings, and plans are stored. | No real in-progress reading state beyond `done`; no draft/session state. |
| "Export curriculum JSON and Pandoc-ready Markdown" | Shipped | Export buttons work. | JSON export is plan-only and not round-trippable as app state. |
| "Inspect import decisions with `?debug=1`" | Shipped | Debug panel exists. | Hidden affordance, not discoverable. |
| `docs/data.md` implies user export is stable and versioned | Partial | Plan JSON is versioned. | No full workspace export format yet. |
| "Quickstart" reaches a canonical user story | Partial | Build + preview works. | README does not explain how a stranger gets their own exports back into the app after working. |

Highest-priority documentation drift:

1. `README.md` overstates "reading state" persistence.
2. `README.md` and `docs/data.md` imply export completeness that the current product does not actually offer.
