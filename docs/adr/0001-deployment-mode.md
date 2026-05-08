# 0001 - Deployment Mode

## Status

Accepted

## Context

The application should end the read-later backlog by synthesizing saved
articles into a curriculum. The default architectural bias is GitHub Pages
first. A runtime backend would add hosting, secrets, auth, CORS, backups, and
operations before v1 proves the core behavior.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static Vite build served from `main/docs`. Article content,
search indexes, curriculum plans, progress, and free-time settings are stored
locally in the browser with IndexedDB. Expensive features are loaded behind
user action: semantic embeddings use a browser sentence-transformers package
when requested, with a deterministic local fallback. Summaries use an available
browser-local LLM API when present and otherwise use extractive local synthesis.

## Consequences

- The live site works without server hosting, auth, or secrets.
- User data stays local by default.
- Some websites cannot be fetched directly because of browser CORS; v1 supports
  pasted text and uploaded exports instead.
- Native Tantivy and Pandoc are not shipped as runtime server components in v1.
  The v1 equivalent is browser search plus Pandoc-ready Markdown export.

## Alternatives Considered

- Mode B: static frontend plus offline data generator. Rejected for v1 because
  each user has private article content and no shared corpus.
- Mode C: Pages frontend plus Docker backend. Rejected for v1 because runtime
  writes, auth, and server-side secrets are not needed.
