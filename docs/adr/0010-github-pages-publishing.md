# 0010 - GitHub Pages Publishing

## Status

Accepted

## Context

The live GitHub Pages URL is a first-class deliverable. The repository also
needs `docs/adr/` and related project documentation.

## Decision

Publish from `main/docs` at:

https://baditaflorin.github.io/read-later-curriculum/

Vite builds directly into `docs/` with `emptyOutDir: false` so ADRs and
documentation remain in place. The app uses base path
`/read-later-curriculum/`, hashed assets in `docs/assets/`, and a generated
`docs/404.html` SPA fallback copied from `docs/index.html`.

## Consequences

- Pages can be enabled immediately from `main/docs`.
- Built frontend files are committed because `docs/` is not gitignored.
- Documentation and app output share the same folder, so build scripts must
  avoid deleting markdown documentation.

## Alternatives Considered

- `gh-pages` branch. Rejected to keep publishing visible in one branch.
- `main /` root publishing. Rejected because root build output would clutter
  source files.
- `dist/` publishing. Rejected because branch Pages does not support arbitrary
  folders besides root and `/docs`.
