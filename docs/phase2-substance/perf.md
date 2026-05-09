# Phase 2 Substance Performance Notes

Measured on 2026-05-09 with the real-data fixture set in
`test/fixtures/realdata/`.

## Import Fixtures

Method: one jsdom-backed Vitest probe parsed each of the 10 real fixtures once
through `parseImportBytes`.

| Fixture                                  | Shape                    | Status   | Count | Time (ms) |
| ---------------------------------------- | ------------------------ | -------- | ----: | --------: |
| `arabic-wikipedia-ai.html`               | `article-html`           | accepted |     1 |   3920.69 |
| `arxiv-attention.pdf`                    | `unsupported-pdf`        | rejected |     0 |    117.10 |
| `empty.txt`                              | `empty`                  | rejected |     0 |      0.06 |
| `github-awesome-readme.md`               | `markdown-resource-list` | warned   |     1 |      4.82 |
| `hackernews-dropbox-thread.html`         | `discussion-thread`      | warned   |     1 |    653.31 |
| `mdn-using-fetch.html`                   | `technical-doc-html`     | warned   |     1 |   1622.56 |
| `pocket-export.csv`                      | `read-later-csv`         | accepted |     2 |      1.48 |
| `truncated-article.html`                 | `partial-html`           | warned   |     1 |      5.57 |
| `verge-rss.xml`                          | `feed-xml`               | accepted |    10 |      6.29 |
| `wikipedia-information-retrieval.html`   | `article-html`           | accepted |     1 |   1429.07 |

Summary:

- Median: 6.29 ms.
- p95: 3920.69 ms.
- Worst: 3920.69 ms.
- Total fixture parse time: 7760.95 ms.

The Arabic Wikipedia fixture measured 5165.43 ms before the HTML parser stopped
building two DOMs for the same input. Reusing the detected document brought the
worst fixture under the 5 second Phase 2 budget on this machine.

## Validation Runs

- `npm run test-integration`: 16 tests, 10 real fixtures, determinism checked
  fixture-by-fixture.
- `npm run smoke`: Playwright happy path completed in 367 ms inside the browser
  portion of the smoke run.
- `npm audit --omit=dev`: 0 vulnerabilities.

The remaining performance risk is very large article HTML. Phase 3 should move
HTML parsing into a Web Worker and expose import cancellation, matching the
build-curriculum cancellation already added in Phase 2.
