# Architecture

Read Later Curriculum is Mode A: Pure GitHub Pages.

## Context

```mermaid
C4Context
title System Context
Person(reader, "Reader", "Imports article text and follows scheduled readings")
System(app, "Read Later Curriculum", "Static local-first synthesis app")
System_Ext(github, "GitHub Pages", "Hosts static files from main/docs")
System_Ext(model, "Public model CDN", "Optional browser sentence-transformers")
Rel(reader, app, "Uses")
Rel(github, app, "Serves")
Rel(app, model, "Downloads model only when semantic mode is selected")
```

## Containers

```mermaid
C4Container
title Container Diagram
Person(reader, "Reader")
System_Boundary(browser, "Browser") {
  Container(spa, "React SPA", "TypeScript, Vite", "Article library, settings, curriculum UI")
  Container(search, "Search Index", "FlexSearch", "Local text search")
  Container(ai, "Synthesis Engine", "TypeScript + optional WASM", "Embeddings, clustering, ordering, scheduling")
  ContainerDb(db, "IndexedDB", "Dexie", "Articles, plans, settings")
  Container(sw, "Service Worker", "Browser API", "Offline shell cache")
}
System_Ext(pages, "GitHub Pages", "Static host")
System_Ext(model, "Model Assets", "Optional sentence-transformers")
Rel(reader, spa, "Uses")
Rel(pages, spa, "Serves static files")
Rel(spa, db, "Reads/writes")
Rel(spa, search, "Builds query index")
Rel(spa, ai, "Builds curriculum")
Rel(ai, model, "Lazy fetch")
Rel(sw, pages, "Caches shell")
```

## Module Boundaries

- `src/features/articles/`: importers, validation, normalization.
- `src/features/storage/`: Dexie database and persistence methods.
- `src/features/search/`: FlexSearch wrapper.
- `src/features/curriculum/`: embeddings, clustering, ordering, scheduling,
  export.
- `src/shared/`: constants, types, text utilities.

## GitHub Pages Boundary

GitHub Pages serves static files only from `main/docs`. It does not run server
code, set secrets, process article content, or expose runtime APIs.
