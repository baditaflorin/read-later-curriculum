# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The UI needs rich local state, forms, optimistic updates, error boundaries, and
fast static builds for GitHub Pages.

## Decision

Use Vite, React, TypeScript strict mode, Tailwind CSS, TanStack Query, zod,
Dexie, FlexSearch, lucide-react, and Playwright/Vitest.

## Consequences

- Vite keeps build and local preview fast.
- React ecosystem support is broad and production-ready.
- Strict TypeScript keeps curriculum and storage contracts explicit.

## Alternatives Considered

- SvelteKit static export. Good fit, but the React ecosystem around Query,
  testing, and local AI examples is broader.
- Vanilla TypeScript. Rejected because the interactive UI would grow harder to
  maintain.
