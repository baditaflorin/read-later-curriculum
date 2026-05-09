# Phase 2 Substance Plan

Ranking rule: user impact on the 10 real-data audit inputs, not implementation
novelty.

## Picklist

1. A1 - Fuzz parser with 10 real fixtures plus edge probes.
2. A2 - Normalize encodings, BOM, NBSP, CRLF, smart quotes, and Unicode
   whitespace.
3. A3 - Define huge-input budget and reject unsupported binary/PDF honestly.
4. A4 - Detect partial/truncated HTML and surface low confidence.
5. A5 - Tolerate common malformed JSON where safe; otherwise actionable error.
6. B6 - Auto-detect input structure: article, docs, markdown list, thread, CSV
   export, feed, PDF, empty, partial.
7. B7 - Auto-classify fields in CSV/feed imports: title, URL, tags, status,
   timestamp, body.
8. B8 - Produce useful first guess immediately after input: item count, titles,
   shape, confidence, warnings.
9. B9 - Normalize URLs, timestamps, tags, whitespace, and content by default.
10. B10 - Replace import-fail silence with inline recoverable warnings and
    correction-ready metadata.
11. C11 - Use read-later vocabulary: article, feed, thread, export, partial,
    unsupported PDF.
12. C12 - Domain-aware validation: empty, binary, partial, missing title, missing
    URL, suspicious title.
13. C13 - Recognize common shapes from the audit: article HTML, technical docs,
    HN thread, Markdown resource list, Pocket CSV, RSS/Atom, PDF.
14. C14 - Domain-aware export metadata: source, parser, shape, confidence,
    warnings, parameters.
15. C15 - Bake in conventions: semantic HTML first, delimiter sniffing, feed
    entry semantics, URL absolutization, whitespace policy.
16. D16 - Confidence score on every imported article and import batch.
17. D17 - Suggested fixes on failures and low-confidence imports.
18. D18 - Surface anomalies: CSV row mismatch, feed item missing title, tiny
    article, repeated-card/thread page, binary-looking text.
19. D19 - Explain decisions with confidence reasons carried into export/debug.
20. E21 - Lossless app JSON round-trip for articles and plans.
21. E22 - Stable deterministic article IDs from source/content.
22. F24 - Enumerate reachable states in `docs/phase2-substance/states.md`.
23. F25 - No stuck import/build states; every failure has an exit.
24. F26 - Build cancellation via AbortController for long synthesis.
25. F27 - Concurrency safety: import/build buttons disable or abort correctly.
26. G28 - Profile fixture imports and document median/p95/worst numbers.
27. G31 - Cache deterministic embedding inputs within a build run.
28. H32 - Actionable error strings: what, why, now what.
29. H33 - Validate at import boundaries with typed diagnostics.
30. H34 - Recoverable vs fatal failures explicit in result objects.
31. I35 - Deterministic normalized import outputs tested on all fixtures.
32. I37 - `?debug=1` inspectability for import confidence/provenance/state.
33. I38 - Output provenance in JSON/Markdown exports.

## Target Pass Rate

Baseline: 4/10 inputs are useful without manual intervention; 5/10 are
wrong-confident; 1/10 is hidden failure.

Target: at least 7/10 useful without manual correction, 10/10 either useful or
actionably rejected, and 0/10 wrong-confident.

## Implementation Order

1. Fixtures and expected outcomes.
2. Import result/diagnostic types and stable IDs.
3. Robust text decoding and normalization.
4. Shape detection and per-shape parsers.
5. Confidence model, warnings, and actionable errors.
6. UI surfacing for import confidence and batch diagnostics.
7. Export provenance and deterministic round-trip.
8. Curriculum input-quality handling and cancellation.
9. Debug overlay, states doc, perf notes, and postmortem.
