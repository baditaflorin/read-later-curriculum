# 0041 - Input Robustness and Normalization Policy

## Status

Accepted

## Context

Real imports include BOMs, CRLF, NBSP, smart quotes, XML, CSV, binary PDF bytes,
truncated HTML, and mixed whitespace.

## Decision

Decode files from bytes, not `File.text()` alone. Detect binary/PDF signatures
before text parsing. Normalize UTF-8 BOM, CRLF, NBSP, Unicode whitespace, and
smart quotes. Treat empty and tiny content as recoverable import rejections.

## Consequences

- Normalized text becomes deterministic across browsers.
- PDF is rejected in Phase 2 unless a real extractor is added later.
- Partial HTML can be saved only with low confidence and warnings.

## Alternatives Considered

- Let each parser handle raw input. Rejected because failures become silent and
  inconsistent.
