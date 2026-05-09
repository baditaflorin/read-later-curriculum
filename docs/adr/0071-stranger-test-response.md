# 0071 - Stranger Test Findings and Response

## Status

Accepted

## Context

The private-window stranger test found three release-blocking continuity and labeling issues:

1. unclear distinction between plan export and state export
2. unreliable perception of draft persistence
3. no obvious reopen/share path for a whole workspace

## Decision

Address those findings before Phase 3 release by:

- splitting plan and state export controls
- persisting UI/session state alongside domain state
- adding full state restore and small-state share URLs

Keep direct URL fetching out of scope in Mode A and explain that choice in the input UI.

## Consequences

- Stranger workflows are now end-to-end instead of demo-only.
- The product remains honest about what a static Pages app can and cannot fetch directly.
