# 0006 - WASM Modules

## Status

Accepted

## Context

Semantic embeddings and some AI runtimes use WASM. GitHub Pages cannot set
custom COOP/COEP headers, which affects high-performance threaded WASM.

## Decision

Use lazy-loaded browser WASM only when the user asks to build a curriculum with
semantic embeddings. The app uses `@huggingface/transformers` for
sentence-transformers in browser mode and falls back to deterministic local
hash embeddings if the model download or WASM runtime fails.

## Consequences

- Initial load stays small and does not require model downloads.
- The app remains usable on browsers without advanced WASM support.
- Native Tantivy is not loaded in v1 because no production browser package is
  available without adding a custom Rust build pipeline.

## Alternatives Considered

- Require COOP/COEP and threaded WASM. Rejected because Pages cannot configure
  those headers.
- Custom Tantivy WASM build. Deferred until the browser packaging risk is worth
  the complexity.
