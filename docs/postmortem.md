# Postmortem

## What Was Built

Read Later Curriculum v0.1.0 is a GitHub Pages app that lets a reader save or
import article text, search a local library, generate clustered reading topics,
dependency-order those topics, schedule sessions into free-time slots, track
done/archive state, and export JSON or Pandoc-ready Markdown.

## Was Mode A Correct?

Yes for v1. The core product risk was whether browser-local synthesis could turn
an unread pile into a usable plan. A runtime backend would have added auth,
secrets, server operations, and privacy questions before proving that loop.

The compromise is that v1 cannot use native Tantivy or native Pandoc at runtime
on GitHub Pages. It uses FlexSearch in-browser and Markdown export that Pandoc
can consume locally. Sentence-transformers are available as a lazy browser path
with a deterministic local fallback.

## What Worked

- GitHub Pages from `main/docs` kept deployment simple.
- IndexedDB/Dexie was enough for article bodies and generated plans.
- Lazy semantic embeddings kept the initial JavaScript payload under budget.
- The demo dataset made smoke testing realistic without external services.

## What Did Not Work

- Native Tantivy and Pandoc are not practical in Mode A without extra WASM build
  investment.
- Direct URL capture is limited by browser CORS; pasted text and file imports
  are the reliable v1 path.
- Browser-local LLM support is still uneven, so extractive synthesis remains the
  dependable fallback.

## Surprises

The original `@xenova/transformers` package pulled a critical vulnerable ONNX
dependency. The maintained Hugging Face package passed audit and became the
semantic embedding path.

## Accepted Tech Debt

- Cluster labels are keyword-based rather than LLM-written by default.
- Long articles are scheduled atomically instead of being split across multiple
  sessions.
- The service worker uses a small custom cache rather than a full Workbox setup.

## Next Improvements

1. Add article chunking so a 90-minute essay can span multiple sessions.
2. Add a browser extension or bookmarklet that extracts readable text client-side.
3. Add optional OPFS-backed model caching controls and clearer model download
   progress.

## Estimate

Estimated v1 scaffold and working app: 4-6 hours.

Actual implementation pass: one focused build session.
