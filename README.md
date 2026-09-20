# elmeu-armari

A personal wardrobe manager. Catalogue your clothes with colours and photos, then find which of the 348 Sanzo Wada colour palettes match combinations of the pieces you actually own, and decide what to wear today.

The UI speaks Catalan, Spanish and English (header menu, Catalan by default). Code, comments and docs are in English.

## What it does

- **Wardrobe** (`/armari`): one grid with category and season filters. A piece holds its colours, seasons, texture, pattern, fit and size, an optional photo, and the action **què hi combina**: the palettes and pieces that go with it.
- **Què em poso?** (`/avui`): today's outfit, the week, and your saved outfits filed under the piece each is built on. A day holds one outfit; shoes and accessories attach to the day, and a day can carry a photo of you wearing it.
- **Laundry** (`/bugaderia`): clean and dirty state for sweaters, shirts and trousers. An outfit with a piece in the basket cannot be worn.
- **Palettes** (`/paleta`): the 348 historical Sanzo Wada palettes, browsable by colour name.
- **Colours from a photo**: adding a piece from a photo suggests its dominant colour, in the browser; nothing is sent anywhere.
- **Statistics, import and export** (`/stats`, `/settings`): export as JSON or as a ZIP with photos, import a JSON back.
- **Accounts**: the whole app is behind a login and there is no public sign-up; see [Accounts](#accounts). Each account has its own wardrobe, outfits, days and photos; a new account starts empty.

## Stack

Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, TypeScript (strict), Prisma 7 on SQLite through the better-sqlite3 driver adapter, Auth.js v5 with Argon2id, sharp for photos, next-intl for the three languages. The layering and the rules that keep the code coherent are in [`AGENTS.md`](./AGENTS.md).

## Run it

Node 24 and npm.

```bash
npm install
npx prisma migrate dev                     # creates dev.db and the Prisma client
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
npm run create-user -- --username you      # prints a temporary password
npm run dev                                # http://localhost:3000
```

### Accounts

No screen or route creates an account: one script does. Each account has its own wardrobe.

```bash
npm run create-user -- --username you            # prints a temporary password
npm run create-user -- --username you --reset    # a new temporary password for an existing account
pbpaste | npm run create-user -- --username you --stdin   # choose the password yourself
npm run create-user -- --list                    # who exists, last login, no hashes
npm run create-user -- --username you --delete --yes      # the account, its wardrobe and its photos
```

The first sign-in lands on `/change-password` and nothing else opens until the password is replaced. Choosing a password shows a **recovery code**, once: someone who forgets the password uses it on `/forgot-password` (the link is on the login screen) to choose a new one, and gets a new code. There is no e-mail behind it. A person who lost both the password and the code needs `--reset`, which clears the code. In production the script runs inside the container: `docker exec -it elmeu-armari node scripts/create-user.mjs --username you`, or `kubectl -n services exec -it deploy/elmeu-armari -- node scripts/create-user.mjs --username you --reset`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Development server, production build, serve the build (`build` needs `prisma migrate deploy` first). |
| `npm run check` | Lint, typecheck and build. Run before a PR. |
| `npm run lint` / `typecheck` | ESLint, `tsc --noEmit`. |
| `npm run test:unit` | Vitest, `tests/unit`. Runs in CI. |
| `npm run test:e2e` | Playwright, `tests/e2e`. Local only. |
| `npm run knip` | Unused files, exports and dependencies. |
| `npm run create-user` | Create an account or reset its password. |
| `npm run rebuild-thumbs` | Regenerate photo thumbnails after changing their size. |

## Docker

```bash
docker compose up -d              # build, run, migrate on boot
docker compose down               # stop (add -v to wipe the data volume)
```

Or the prebuilt image: `docker run -d -p 3000:3000 -v elmeu-armari-data:/data ghcr.io/jordiibru/elmeu-armari:latest`. The entrypoint runs `prisma migrate deploy` before starting the server. A fresh deployment has no accounts: create the first one as above.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `AUTH_SECRET` | none | **Required.** Signs and encrypts the session cookie (`openssl rand -base64 32`). Changing it signs everyone out. |
| `AUTH_URL` | none | Recommended in production: the public origin, e.g. `https://armari.example.com`. Marks the session cookie `Secure` without trusting a proxy's `X-Forwarded-Proto`. |
| `DATABASE_URL` | `file:/data/prod.db` | SQLite file. |
| `UPLOAD_DIR` | `/data/uploads` | Where photos are written. |
| `UPLOAD_MAX_MB` | `10` | Largest accepted upload. |
| `PORT` | `3000` | HTTP port. |

Photos are re-encoded by sharp to WebP (800 px, quality 80, EXIF dropped) under `UPLOAD_DIR`.

### Backups and restore

The database and the photos are one unit: a database restored without its photos points at images that are gone. The homelab CronJob writes both every day at 03:00 UTC into `/data/backups` (`prod-<timestamp>.db`, a consistent copy taken with SQLite's online backup, and `uploads-<timestamp>.tgz`), 14 of each. They sit on the same volume as the data, so they cover a bad migration or a bug, not the loss of the node; the JSON/ZIP export in `/settings` is the copy you can keep elsewhere.

To restore, stop the app, then from the volume (`/data`):

```bash
cp backups/prod-<timestamp>.db prod.db          # replaces the database
tar xzf backups/uploads-<timestamp>.tgz -C .    # puts uploads/ back
```

Start the app again: the entrypoint runs `prisma migrate deploy`. Sessions survive only if `AUTH_SECRET` is the same. Checked against a real backup: the database copy passes `PRAGMA integrity_check` and the tarball holds every photo the database names; replacing the live files was not rehearsed.

## CI and releases

- **CI** (`.github/workflows/ci.yml`, pull requests): lint, typecheck, unit tests and build.
- **Release** (`.github/workflows/release.yml`, push to `main`): tags the version from Conventional Commits, creates the GitHub Release, and pushes `ghcr.io/jordiibru/elmeu-armari`. Deploying is a separate bump of the image tag in the homelab repo.
- **Renovate** keeps dependencies current; see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## More

[`CONTRIBUTING.md`](./CONTRIBUTING.md) is the workflow, [`AGENTS.md`](./AGENTS.md) the rules for writing code (and how the colour engine works), [`DESIGN-BIBLE.md`](./DESIGN-BIBLE.md) the visual system, [`SECURITY.md`](./SECURITY.md) how to report a vulnerability. MIT licence, see [`LICENSE`](./LICENSE).
