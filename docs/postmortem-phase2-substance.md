# Phase 2 Substance Postmortem

Version: v0.2.0

Mode: A, unchanged. The app is still a GitHub Pages static app with browser
storage and browser computation only.

## Real-Data Pass Rate

Before:

- 4/10 audit inputs were useful without manual intervention.
- 5/10 were wrong-confident.
- 1/10 failed silently or nearly silently.

After:

- 8/10 inputs produce a useful import that can continue into preview/build.
- 10/10 inputs are either useful or actionably rejected.
- 0/10 inputs produce wrong-confident output.

Per fixture:

| Fixture               | Before                         | After                                   |
| --------------------- | ------------------------------ | --------------------------------------- |
| Wikipedia article     | Useful, thin metadata          | Useful with provenance/confidence       |
| MDN docs              | Flattened docs, no honesty     | Warned `technical-doc-html` import      |
| GitHub awesome README | Wrong filename title           | Warned resource-list with correct title |
| Hacker News thread    | Wrong-confident article        | Warned discussion thread                |
| Pocket CSV            | Wrong-confident header article | Two normalized read-later items         |
| The Verge RSS         | Wrong-confident XML article    | Ten feed-entry items                    |
| arXiv PDF             | Wrong-confident binary junk    | Actionably rejected unsupported PDF     |
| Arabic Wikipedia      | Useful, no language honesty    | Useful with Arabic language metadata    |
| Empty file            | Hidden failure                 | Actionably rejected empty input         |
| Truncated HTML        | Wrong-confident full article   | Warned partial clip with low confidence |

## Top Logic Gaps

1. Import shape detection was absent.
   Closed with explicit shape detection for article HTML, technical docs,
   discussion threads, Markdown resource lists, read-later CSV, RSS/Atom feeds,
   unsupported PDFs, empty files, partial HTML, JSON exports, and plain text.

2. There was no confidence model.
   Closed with batch and per-article confidence scores, labels, reasons, and
   diagnostics.

3. Errors were not localized to the input.
   Closed with import result statuses, visible warnings/errors, and
   what/why/now-what messaging.

4. Metadata/provenance was too thin.
   Closed with import metadata on articles and provenance in JSON/Markdown
   curriculum exports.

5. Curriculum planning treated every item as equally article-like.
   Improved by carrying low-confidence article IDs and input warnings into the
   plan. Non-article shapes are now visible rather than silently blended in.

## Smart Behaviors

- Common real-world inputs are classified before import.
- The first guess includes article count, shape, confidence, source identity,
  parser, language when available, and warnings.
- Low-confidence imports are visibly marked instead of silently accepted as
  normal articles.
- Unsupported PDFs and empty files are rejected with next steps.
- Exports carry enough metadata to explain how the plan was generated.

Evidence: the 10 real-data fixtures are committed under
`test/fixtures/realdata/`, and `test/integration/realdata-import.test.ts`
asserts shape, status, counts, warnings/errors, language, and determinism.

## Determinism

Pass: 10/10 fixtures.

Each fixture is parsed twice in the integration suite and compared with
`JSON.stringify(first) === JSON.stringify(second)`. Stable IDs are derived from
source/content instead of timestamps.

## Performance

Measured fixture import timings:

- Median: 6.29 ms.
- p95: 3920.69 ms.
- Worst: 3920.69 ms.
- Total: 7760.95 ms.

The worst path was Arabic Wikipedia HTML. It initially crossed the 5 second
budget at 5165.43 ms, then dropped under budget after reusing the already parsed
HTML document instead of parsing twice.

## What Surprised Me

Read-later exports are more heterogeneous than the app assumed. A CSV export,
an RSS feed, a GitHub README, and a discussion thread all look like "text" if
the importer is lazy, but users experience each as a different domain object.
The biggest quality jump came from admitting those shapes, not from adding new
UI.

The other surprise was how valuable rejection is. The PDF and empty-file cases
feel much smarter when the app refuses honestly than when it pretends it saved
something.

## Still Open

1. Real PDF text extraction, probably through a lazy PDF.js worker.
2. Import parsing in a Web Worker with true cancellation for huge HTML.
3. Better discussion-thread handling, such as extracting top comments instead
   of importing one large thread reading.
4. Stronger multilingual clustering/search beyond language metadata.
5. A committed performance regression test with per-fixture budgets.

## Honest Take

It no longer feels like a toy at the import boundary. A stranger can bring a
Pocket CSV, RSS feed, docs page, README, truncated clip, non-English article, or
bad file and get a useful first guess or a clear refusal.

It is still not a fully grown read-later intelligence layer. PDF extraction is
missing, browser imports can still be expensive for huge HTML, and the planning
engine only annotates low-confidence items instead of deeply adapting the
curriculum around them. But the app now behaves like it understands the shape of
real inputs, which was the core Phase 2 bar.
