# Phase 3 Output Audit

Date: 2026-05-10

Legend:

- Green: works fully.
- Yellow: works partially or only through a narrow path.
- Red: missing.

| Output                          | Status | Current behavior                                                                                         | Gap                                                                                      |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Curriculum plan JSON download   | Green  | `Plan JSON` exports the generated curriculum with provenance, warnings, confidence, version, and commit. | None.                                                                                    |
| Curriculum Markdown download    | Green  | `Markdown` exports a Pandoc-ready reading plan with the same provenance fields.                          | None.                                                                                    |
| Copy to clipboard               | Green  | `Copy MD`, `Copy State`, and share-link copy flows all confirm success in-product.                       | Browser clipboard permissions can still be denied by the user.                           |
| Full library/app-state download | Green  | `State JSON` exports the full reopenable workspace, including plan, settings, draft, and query state.    | None.                                                                                    |
| Import what you exported        | Green  | State JSON round-trips through the dedicated import control and through paste for text-safe payloads.    | None.                                                                                    |
| Shareable URL                   | Green  | Small states can be encoded into a `#state=` deep link and reopened in another browser session.          | Large states intentionally refuse share-link export and steer the user to `State JSON`.  |
| Print/PDF-friendly output       | Green  | `Print` renders a stripped-down plan view suitable for browser print or Save as PDF.                     | Browser print styling can vary slightly by engine.                                       |
| Screenshot/export image         | Yellow | The repo still contains scripted screenshot capture, but there is no in-product image export button.     | Left out of the production UI because it is not required for the core stranger workflow. |
| API/automation-ready snippet    | Yellow | `Plan JSON` and `State JSON` are machine-consumable and versioned.                                       | The UI does not yet emit language-specific curl or SDK snippets.                         |
| Version/commit visibility       | Green  | The footer, stats strip, JSON exports, and `docs/version.json` all surface version and commit.           | None.                                                                                    |

Before implementation count:

- Green: 2
- Yellow: 1
- Red: 7

After implementation count:

- Green: 8
- Yellow: 2
- Red: 0
