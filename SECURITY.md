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

The app is behind a login: every screen and every `/api/*` route requires a session, accounts are created by the admin with `npm run create-user` (there is no public sign-up, and no password recovery by e-mail), and passwords are hashed with Argon2id. Reports about authentication, session handling, the login throttling, path traversal, injection, secret leakage, or anything that could compromise the host running the container are in scope.

Two deliberate trade-offs, so they are not reported as findings: the Content-Security-Policy allows `'unsafe-inline'` for scripts, because Next and the theme switcher inline their own (tightening it means per-request nonces); and the per-IP throttle is secondary to the per-account one, because a tunnelled deployment can present every visitor with the same address.

## Response

This is a hobby project maintained in spare time — there is no SLA, but reports are read and taken seriously.
