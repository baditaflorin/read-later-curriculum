# Security Policy

## Supported Versions

Only the latest tagged version is supported.

## Reporting a Vulnerability

Please report security issues privately by opening a GitHub security advisory or
emailing the repository owner through the contact information listed at:

https://github.com/baditaflorin

Do not include secrets, tokens, or private article content in public issues.

## Baseline

- No secrets are required by the frontend.
- User article content remains in browser storage unless the user exports it.
- Dependency audits should have no high or critical vulnerabilities before a
  release.
- Local hooks run linting, tests, builds, smoke checks, and secret scanning.
