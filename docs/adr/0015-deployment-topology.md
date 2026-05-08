# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deploys only static assets.

## Decision

Deploy only through GitHub Pages from `main/docs`.

## Consequences

- There is no `deploy/` directory for Docker or nginx.
- Rollback is a git revert of the publishing commit.
- Custom domains can be added later with a `docs/CNAME` file.

## Alternatives Considered

- Docker backend and nginx. Rejected by ADR 0001.
