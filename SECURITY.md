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

The app is behind a login: every screen and every `/api/*` route requires a session (except Auth.js's own `/api/auth/*`, which is how you sign in), accounts are created by the admin with `npm run create-user` (there is no public sign-up, and no password recovery by e-mail), and passwords are hashed with Argon2id. Reports about authentication, session handling, the login throttling, path traversal, injection, secret leakage, or anything that could compromise the host running the container are in scope.

Two deliberate trade-offs, so they are not reported as findings: `style-src` keeps `'unsafe-inline'`, because `next/font` injects a `<style>` Next does not nonce and the app sets inline `style` attributes on colour swatches (inline styles cannot run script; `script-src` carries a per-request nonce and no `'unsafe-inline'`); and the per-IP throttle is secondary to the per-account one, because a tunnelled deployment can present every visitor with the same address.

Sessions are signed, encrypted cookies valid for seven days, tied to the password they were issued under: changing the password, or resetting it with `create-user --reset`, ends every other session at once, because the proxy compares a fingerprint of the password hash carried in the token with the account on every request. There is no "sign out everywhere" button and no session list; changing the password is the way.

## Checked and accepted

Reviewed in #155; each line says why it is not a finding.

- **`npm audit --omit=dev` lists 4 high advisories, all `mysql2` through the Prisma CLI.** The image ships the CLI to run `prisma migrate deploy` on boot; it never opens a MySQL connection (the database is SQLite), so the vulnerable protocol code is not reachable. `npm audit fix` would downgrade Prisma to 6, so Renovate moves it with the rest of Prisma instead.
- **Cross-site requests.** The session cookie is `HttpOnly`, `SameSite=Lax` and, over https, `Secure` (`__Secure-` prefix; `__Host-` for the CSRF token). `SameSite` separates sites, not subdomains, and this domain hosts other services, so every state-changing route handler (`/api/import`, garment and day photo upload and delete, garment delete) also refuses a request whose `Sec-Fetch-Site` is not `same-origin` (or, without that header, whose `Origin` is not the app's host): `requireSameOrigin` in `src/lib/auth/same-origin.ts`. Server Actions get Next's own origin check. The GET route handlers (`/api/uploads`, `/api/export`, `/api/export/zip`, and Auth.js's own `/api/auth/*`) only read.
- **`pwv` reaches the browser** through `/api/auth/session`: 16 hex characters of a SHA-256 of an Argon2 hash, which cannot forge a token or recover a password.
- **Forwarded headers are not trusted for anything that matters.** `clientIp()` reads `cf-connecting-ip`, then `x-forwarded-for`; a client that reaches the pod directly can set either. Only the secondary per-IP throttle uses it (see above).
- **Lockout and passwords**: 5 failures lock an account (an unattributable request is never locked by IP), and a password is 12 to 128 characters. Sensible for a single-owner login; revisit if accounts multiply.
- **Uploads**: the declared type is a first filter, `sharp` decoding is the real one (a file that is not an image answers 422), the body is refused from `Content-Length` before it is buffered, and a canvas over 50 megapixels is refused. Filenames served or zipped come from the database or the `[a-z0-9]+(?:-thumb)?\.webp` allowlist, never from the request. The zip export has no matching restore path, so entry names are never extracted.
- **`/api/import`** takes a session and nothing else (the old `IMPORT_SECRET` bearer path was unreachable behind the proxy and is gone) and refuses bodies over 5 MB.
- **Headers**: CSP built in the proxy, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin` and HSTS (`max-age` six months, no `includeSubDomains`: the domain hosts other services; Cloudflare does not add it).
- **Committed secrets**: a scan of the whole git history for tokens, private keys and `AUTH_SECRET` values found none.
- **`docker-compose.yml`** uses `:latest` and a non-secret `DATABASE_URL` build argument; it is the local convenience file, the cluster pins a tag.

## Response

This is a hobby project maintained in spare time — there is no SLA, but reports are read and taken seriously.
