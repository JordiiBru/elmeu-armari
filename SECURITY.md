# Security Policy

elmeu-armari is a small, self-hosted personal project. That said, if you find a security issue, please report it responsibly.

## Reporting a vulnerability

**Do not open a public issue.** Instead:

- Open a [private security advisory](https://github.com/JordiiBru/elmeu-armari/security/advisories/new) on this repository, or
- Contact [@JordiiBru](https://github.com/JordiiBru) directly via GitHub.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (a minimal repro is very helpful).
- The version / commit you tested against.

## Scope

This app has no user accounts — it is designed to run as a single-tenant instance behind a network you control. Reports about "no authentication on X" are welcome as hardening suggestions but are a known, accepted design trade-off rather than a vulnerability in isolation. Reports involving path traversal, injection, secret leakage, or issues that could compromise the host running the container are always in scope.

## Response

This is a hobby project maintained in spare time — there is no SLA, but reports are read and taken seriously.
