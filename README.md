# Read Later Curriculum

Live site: https://baditaflorin.github.io/read-later-curriculum/

Repository: https://github.com/baditaflorin/read-later-curriculum

Support: https://www.paypal.com/paypalme/florinbadita

![Version](https://img.shields.io/badge/version-0.1.0-126b6f)
![Deployment](https://img.shields.io/badge/deployment-GitHub%20Pages-7a3f98)
![License](https://img.shields.io/badge/license-MIT-171513)

Read Later Curriculum is a local-first browser app that turns saved article
backlogs into a topic-clustered, dependency-ordered, time-boxed reading plan.
The problem was never saving links. It was synthesis.

![Read Later Curriculum screenshot](docs/demo-screenshot.png)

## Quickstart

```sh
npm install
make data
make build
make pages-preview
make smoke
```

## What Works

- Add pasted article text or import `.txt`, `.md`, `.html`, and compatible
  `.json` exports.
- Store articles, reading state, settings, and generated plans in IndexedDB.
- Search locally with FlexSearch.
- Build topic clusters with fast local embeddings or lazy browser
  sentence-transformers.
- Dependency-order topics, mix short and long reads, and schedule sessions into
  free-time slots.
- Export curriculum JSON and Pandoc-ready Markdown.
- Show live version and commit in the GitHub Pages UI.

## Architecture

```mermaid
C4Context
title Read Later Curriculum - Mode A
Person(reader, "Reader", "Saves articles and follows a curriculum")
System_Boundary(pages, "GitHub Pages") {
  System(spa, "Static React App", "Vite build served from main/docs")
}
SystemDb(indexeddb, "IndexedDB", "Articles, plans, settings, progress")
System_Ext(hf, "Public model CDN", "Optional sentence-transformers assets")
Rel(reader, spa, "Uses in browser")
Rel(spa, indexeddb, "Reads/writes local data")
Rel(spa, hf, "Lazy-loads optional model")
```

More detail: docs/architecture.md

## Project Links

- Live Pages URL: https://baditaflorin.github.io/read-later-curriculum/
- GitHub repository: https://github.com/baditaflorin/read-later-curriculum
- PayPal: https://www.paypal.com/paypalme/florinbadita
- ADRs: docs/adr/
- Deploy notes: docs/deploy.md
- Data contract: docs/data.md
- Privacy: docs/privacy.md

## Local Hooks

```sh
make install-hooks
```

The hooks run formatting, linting, type checks, tests, Pages build validation,
smoke tests, Conventional Commit validation, and `gitleaks protect --staged`.

## Release

```sh
make release
git push origin main --tags
```

Version is sourced from `package.json`. Commit is embedded from
`git rev-parse --short HEAD` at build time.
