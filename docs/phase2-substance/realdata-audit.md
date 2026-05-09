# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Mode: A, unchanged from v1.

Method: downloaded/pasted real-world input shapes, then drove the current v1
GitHub Pages build through the actual file-import happy path. Observed saved
count, inferred first title, user-visible toast, and browser errors.

## Real-World Inputs

| #   | Input                                     | Shape                                       | Source                                                                                                                                    | What v1 did                                                                           | What it should have done                                                                                         | Failure mode                                                               | User work v1 forces                                                                               |
| --- | ----------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Wikipedia, Information retrieval          | clean semantic HTML article                 | https://en.wikipedia.org/wiki/Information_retrieval                                                                                       | Saved one article titled `Information retrieval`. Content was readable.               | Same, plus source URL/provenance and confidence.                                                                 | Mostly passes; metadata is thin.                                           | User must add/source-check URL manually after file import.                                        |
| 2   | MDN, Using the Fetch API                  | code-heavy docs HTML                        | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch                                                                    | Saved one article titled `Using the Fetch API - Web APIs \| MDN`.                     | Save as a technical article, preserve useful headings/code context, classify as docs.                            | Partially passes; code/example structure is flattened into prose.          | User must infer it is technical docs and later correct tags/topic.                                |
| 3   | GitHub `awesome` README                   | large Markdown list/resource index          | https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md                                                                     | Saved one article, but title became the filename `rlc_github`.                        | Detect the README title, recognize it as a resource list, preserve section structure, mark low article-likeness. | Wrong-but-confident title; list shape collapsed.                           | User must rename it and mentally compensate for lost structure.                                   |
| 4   | Hacker News Dropbox launch thread         | discussion/list page, repeated comment rows | https://news.ycombinator.com/item?id=8863                                                                                                 | Saved one article titled `My YC app: Dropbox - Throw away your USB drive`.            | Detect this is a discussion thread, summarize/list comments separately or warn that it is not an article.        | Wrong-but-confident shape interpretation.                                  | User must know the curriculum is mixing comments with article content.                            |
| 5   | Pocket CSV export shape                   | read-later export CSV                       | Format documented at https://github.com/karakeep-app/karakeep/issues/570 and https://support.mozilla.org/km/kb/exporting-your-pocket-list | Saved the whole CSV as one article titled `title,url,time_added,tags,status`.         | Detect CSV, create one saved item per row, normalize tags/status/time, preserve URLs.                            | Wrong-but-confident import.                                                | User must manually split rows or abandon import.                                                  |
| 6   | The Verge RSS feed                        | XML/Atom feed                               | https://www.theverge.com/rss/index.xml                                                                                                    | Saved one article titled `<?xml version="1.0" encoding="UTF-8"?><feed`.               | Detect feed, create one saved item per entry, preserve feed/source metadata.                                     | Wrong-but-confident import.                                                | User must manually copy individual entries.                                                       |
| 7   | arXiv Attention Is All You Need PDF       | large binary PDF, 2.2 MB                    | https://arxiv.org/pdf/1706.03762                                                                                                          | Saved one article titled `%PDF-1.5` with binary-looking text.                         | Reject unsupported PDF with a clear why/next step, or extract text if supported later.                           | Worst case: wrong-but-confident junk.                                      | User has to notice the article is garbage and delete it.                                          |
| 8   | Arabic Wikipedia, Artificial intelligence | RTL + non-Latin HTML                        | https://ar.wikipedia.org/wiki/ذكاء_اصطناعي                                                                                                | Saved one article titled `ذكاء اصطناعي`.                                              | Same, plus preserve language/direction metadata and handle tags/search/tokenization with language honesty.       | Partially passes; no language confidence or RTL-aware downstream behavior. | User must trust that later clustering/search understood the language, though it probably did not. |
| 9   | Empty text file                           | empty/broken input                          | real edge case from failed export or accidental upload                                                                                    | Saved nothing; browser console showed a zod validation error. No useful in-app error. | Show "This file is empty" with a next step; keep state coherent.                                                 | Hidden failure; user sees no saved article and no explanation.             | User must infer what happened from absence.                                                       |
| 10  | Truncated HTML clip                       | partial/broken article HTML                 | real edge case from interrupted copy/export                                                                                               | Saved one article titled `Half clipped article`; treated partial body as complete.    | Detect short/truncated article body, save as low-confidence partial or ask for replacement text.                 | Wrong-but-confident partial import.                                        | User must notice the curriculum is based on an incomplete article.                                |

Extra probe: a JSON export with trailing commas failed with a browser-console
syntax error and no in-app recovery. It reinforces the same error taxonomy gap
as input #9.

## Top 5 Logic Gaps

1. Import shape detection is nearly absent. CSV, RSS/XML, PDF, discussion pages,
   resource lists, and truncated HTML are all treated as "one article-shaped
   blob" unless Readability happens to rescue them.
2. The importer has no confidence model. It saves binary PDF junk, CSV headers,
   XML declarations, and partial clips with the same confidence as a clean
   Wikipedia article.
3. Error handling is not localized to the input. Empty files and malformed JSON
   fail through console errors instead of domain messages attached to the file.
4. Metadata/provenance is too thin. File imports lose source URL, import shape,
   language, parser used, warnings, and confidence, so exports cannot explain
   where a plan came from.
5. Curriculum planning treats every saved item as equally article-like. Threads,
   feeds, resource indexes, PDFs, and incomplete clips all enter clustering and
   scheduling as if they were normal articles.

## Top 3 Intuition Failures

1. Uploading a Pocket CSV appears to work but creates one useless article from
   the header row. A read-later app should understand read-later exports.
2. Uploading a PDF appears to work but saves `%PDF-1.5` as the title. The user
   expects either extraction or an honest "PDF is unsupported" message.
3. Empty or malformed imports do not explain themselves in the UI. The user gets
   absence, not recovery.

## Top 3 "Feels Stupid" Moments

1. The user has to tell the app that `title,url,time_added,tags,status` is not an
   article title.
2. The user has to rename a GitHub README because the app misses the obvious
   document title.
3. The user has to manually decide whether an HN thread, RSS feed, or truncated
   clip belongs in a curriculum because the app never admits uncertainty.

## What "Smart" Means For This Product

1. Pasting or uploading common read-later inputs should first classify the shape:
   article, technical doc, resource list, discussion thread, feed, CSV export,
   unsupported binary, empty, or partial.
2. The app should make a useful first guess immediately: title, source URL,
   language, tags, item count, article-likeness, reading minutes, and import
   confidence.
3. Low-confidence imports should be saved only with visible warnings, or rejected
   with a domain-specific next step. No silent wrongness.
4. Curriculum generation should down-rank, quarantine, or annotate non-article
   and partial items instead of blindly scheduling them.
5. Exports should carry enough provenance and confidence metadata that a user can
   understand and reproduce why a reading plan looks the way it does.

## Phase 2 Substance Success Metrics

1. At least 7 of the 10 audit inputs complete the primary import -> preview ->
   build-curriculum flow without manual intervention and without wrong-confident
   output.
2. 100% of the 10 audit inputs produce either a useful article/item set or an
   actionable in-app error with what/why/now-what language.
3. 0 inputs save binary, XML, CSV headers, or empty content as confident articles.
4. Determinism: running the same input twice produces byte-identical normalized
   import output, excluding explicit run timestamp fields.
5. Median time from file selection to useful import preview is under 1 second on
   the fixture set; worst case under 5 seconds or cancellable.
6. Every generated plan/export includes schema version, app version, import
   parameters, source identifier, parser strategy, confidence, and warnings.

## Out Of Scope For Phase 2 Substance

- No runtime backend, auth, sync, accounts, or server-side scraping.
- No browser extension/bookmarklet.
- No visual polish, dark mode, command palette, OG images, or redesign.
- No new primary product surface beyond existing import, library, curriculum,
  schedule, and export flows.
- No paid/cloud LLM integration or frontend secrets.
- No full PDF feature unless the chosen substance plan explicitly treats PDF as
  an unsupported input with excellent recovery messaging.
