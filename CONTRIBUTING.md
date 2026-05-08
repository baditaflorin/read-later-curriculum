# Contributing

Thanks for helping improve Read Later Curriculum.

## Local Setup

```sh
npm install
make install-hooks
make dev
```

## Workflow

Use Conventional Commits for commit messages:

```text
feat: add curriculum scheduling
fix: keep imported HTML titles
docs: clarify Pages deployment
```

Before pushing, run:

```sh
make fmt
make lint
make test
make build
make smoke
```

## Boundaries

Version 1 is local-first and static-hosted on GitHub Pages. Do not add runtime
servers, account systems, or frontend secrets without writing a new ADR first.
