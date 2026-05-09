# Phase 2 State Taxonomy

## Import States

- `idle-empty`: no articles, no import in progress.
- `idle-some`: articles exist, no import in progress.
- `importing`: file/text is being decoded and classified.
- `imported-clean`: articles were accepted with high confidence.
- `imported-warned`: articles were accepted with visible warnings.
- `import-rejected-recoverable`: nothing was saved; user gets what/why/now what.
- `import-fatal`: browser storage or unexpected platform failure; existing data
  remains intact.

Every import state exits through one of: add/import another file, clear local
library, inspect warnings, or retry with corrected input.

## Curriculum States

- `not-ready`: no active articles.
- `ready`: active articles exist and build can start.
- `building`: deterministic local build is in progress.
- `cancelling`: abort requested, prior plan remains visible.
- `built-clean`: plan produced without low-confidence input warnings.
- `built-warned`: plan produced but contains low-confidence or non-article items.
- `build-rejected`: no plan produced because inputs are empty or all rejected.
- `build-fatal`: unexpected failure; prior plan remains intact.

Every build state exits through one of: build, cancel, retry, inspect warnings,
or edit/delete/archive input articles.
