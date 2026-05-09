# Phase 3 Output Audit

Date: 2026-05-09

Legend:

- Green: works fully.
- Yellow: works partially or only through a narrow path.
- Red: missing.

| Output | Status | Current behavior | Gap |
| --- | --- | --- | --- |
| Curriculum JSON download | Yellow | Works after building a plan. | Exports the plan, not full app state, so it cannot fully restore the workspace. |
| Curriculum Markdown download | Green | Works after building a plan and includes provenance. | None. |
| Copy to clipboard | Red | Not implemented. | User cannot copy JSON/Markdown output directly. |
| Full library/app-state download | Red | Not implemented. | No complete save-and-restore artifact. |
| Import what you exported | Red | Only article-array style JSON is accepted. | Full state round-trip is impossible today. |
| Shareable URL | Red | Not implemented. | No lightweight sharing for small states or demo plans. |
| Print/PDF-friendly output | Red | Not implemented. | User must manually export Markdown and use Pandoc elsewhere. |
| Screenshot/export image | Red | Not implemented in product UI. | Demo screenshot exists only as a repo script. |
| API/automation-ready snippet | Red | Not implemented. | No copyable machine-consumable state sample besides raw plan JSON. |
| Version/commit visibility | Green | Live footer and summary strip show both. | None. |

Before implementation count:

- Green: 2
- Yellow: 1
- Red: 7
