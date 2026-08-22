# elmeu-armari

A personal wardrobe manager. Catalogue your clothes with colours and photos, then discover which of the 348 Sanzo Wada colour palettes match combinations of the pieces you actually own.

> The UI speaks **Catalan, Spanish and English**, switchable from the header menu and defaulting to Catalan. Catalan is the source language: keys are written there first and `npm run typecheck` fails if another locale is missing one. Everything else in this repo — code, docs, comments — is in English.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black) ![React](https://img.shields.io/badge/React-19-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4)

---

## Features

- **Garment catalogue** (`/armari`) — one grid, no tabs, with filters by category and season. Categories: sweater, shirt, pants, socks, shoes, accessory. Detail URLs are a slug (`/armari/bossa-zez4hi`), not the raw id. Opening a piece is the only place a piece lives: its data, "què hi combina", edit and delete. That colour-matching action is hidden for shoes, socks and accessories since they don't take part in it.
- **Add & edit** (`/add`, `/edit/[id]`) — form with multi-colour picker, seasons multi-select, texture / pattern / fit / size, optional photo upload. Fields adapt to the category: an accessory (ring, watch, belt, bag, hat, scarf, glasses…) skips texture, pattern, fit and size, and its colour is optional.
- **Photo pipeline** — uploads re-encoded to WebP 800px @ q80 via `sharp`, EXIF stripped, thumbnails generated. Photos live on the filesystem, not in SQLite.
- **Outfit builder** (`/armari` → a piece → `què hi combina`) — get the Sanzo Wada palettes that contain that piece's colours, browse matching pieces per palette colour, save the outfit. It is an action on a piece, not a place: the two sheets swap rather than nest, so closing the combinations returns to the piece.
- **Què em poso?** (`/avui`) — the one place outfits live, in three strata. **Today**: the look you have committed to, as one plate with what you are wearing it with beside it; an undecided day gets no plate, just the question, a primary action and `✦ tria per mi`, which is a dice roll over what is clean rather than a recommendation. **The week**: seven cells, `?start=` navigates weeks without moving the page. **Els teus outfits**: the collection filed under the piece each look is built on, re-indexed by shirt, trousers or sweater from the tabs, every group collapsed until you open it, and each open group ending in `més combinacions` — the matcher run on that same piece, since it generates around 190 per piece and this list holds the handful you chose. All three strata open the same sheet and commit a day through the same action.
- **Worn-event log** — a day holds at most one outfit. Shoes, socks and accessories attach to the *day*, not to the outfit: shoes are a single slot (picking a new pair replaces the old one), accessories have no limit, and the picker preselects whatever you last wore that outfit with. History drives the "least recently worn" ranking.
- **Laundry** (`/bugaderia`, one screen toggling between the clean pile and the basket via `?vista=cistell`) — clean/dirty state per garment for the washable categories (sweater, shirt, pants); shoes, socks and accessories are always available. Mark pieces dirty or clean in bulk from a one-tap grid. In "què em poso?" an outfit with a piece in the basket cannot be committed, sorts below the wearable ones in its group, and says so on its own face — picking a wearable one assigns it to today, and its pieces move to the basket once that day has passed, so changing your mind mid-day never soils clothes you didn't wear.
- **Sanzo Wada palettes** (`/paleta`) — browse all 348 historical palettes by colour name. Garment colours are named by their nearest Sanzo colour wherever the interface needs to tell two pieces of the same kind apart.
- **Home and menu** — the home is four doors on one axis (`Què em poso?`, `Armari`, `Bugaderia`, `Paletes`); everything *about* the app rather than in it lives behind the header's ellipsis: statistics, settings, your password, the light/dark switch, the language, and the account you are signed in as with the way out.
- **Languages** — català, castellà and english, picked from three flags in the header menu. The choice is a cookie, not a URL segment, so no link in the app changes and a saved PWA shortcut keeps working. Dates, weekday names and plurals follow the active locale; the Sanzo Wada colour names stay English in all three, the way a Pantone reference would.
- **Statistics** (`/stats`) — breakdown by category, season, fit and texture.
- **Import / export** (`/settings`) — download all garments as JSON, or as a ZIP bundle including garment photos; upload a previously exported file to restore.
- **Accounts** (`/login`) — the whole app is behind a login: every screen, every `/api/*` route, photos included. There is **no public sign-up** — the admin creates accounts with `npm run create-user`, which hands out a temporary password the app makes you replace on first use. Passwords are Argon2id; repeated failures throttle the account with an exponential backoff, counted from a table rather than from memory, so a restart is not a fresh set of guesses.
- **PWA manifest** — installable on mobile, custom icon and theme.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2** | App Router, React Server Components, Turbopack. |
| Runtime | **React 19** | Server Actions, `useActionState`. **No `useEffect` for data fetching.** |
| Styling | **Tailwind CSS v4** | No config file; theming via CSS custom properties and `@theme`. |
| DB | **SQLite** | Single file, mounted volume in prod. |
| ORM | **Prisma 7** | Uses `@prisma/adapter-better-sqlite3` driver adapter — **not** the standard Prisma client. |
| Language | **TypeScript 5** | Strict mode. |
| Images | **sharp** | Server-side WebP re-encoding + thumbnail generation. |
| Auth | **Auth.js v5** (`next-auth`) | Credentials provider, JWT session cookie. Hashing is `@node-rs/argon2` (Argon2id), prebuilt for musl so the Alpine image compiles nothing. |

---

## Project layout

```
src/
  app/                       App Router routes
    page.tsx                 Home
    add/                     New garment
    armari/                  Wardrobe grid (one grid, no tabs)
    login/                   Sign-in screen + its server action
    change-password/         Replacing a temporary (or any) password
    avui/                    "Què em poso?" — today, the week, the collection
    edit/[id]/               Edit garment
    outfits/actions.ts       Server actions: save / delete outfit
    paleta/                  Sanzo Wada browser
    settings/                Import / export
    stats/                   Aggregates
    api/
      export/                GET  JSON dump of all garments
      import/                POST JSON restore
      uploads/[filename]/    GET  serve stored garment photo
      garments/[id]/image/   PATCH/DELETE upload/remove photo
      auth/[...nextauth]/    Auth.js handlers (sign in / sign out / session)
  auth.ts                    Auth.js instance: the credentials provider
  auth.config.ts             The half of it with no database in it
  proxy.ts                   The gate: every request passes through here
  components/                React components (kebab-cased UI role, PascalCase file)
  i18n/
    config.ts                Locale list, default, cookie name
    messages.ts              Locale → messages map (the typecheck gate)
    request.ts               Per-request locale, read off the cookie
    actions.ts               Server action that writes the locale cookie
  lib/
    auth/
      access.ts              Who may see what, as a pure function
      lockout.ts             Failure counting and exponential backoff
      password.ts            Argon2id hashing and verification
      policy.ts              Length rules, safe for the client bundle
      request.ts             Reading the client IP off the headers
      repository.ts          Prisma access (users + login attempts)
      service.ts             Credential checking, throttling, password change
      api.ts                 Second lock for the route handlers
      actions.ts             Server action: sign out
    colors/
      index.ts               Sanzo Wada loader (348 palettes, named colours)
      sanzo-wada.json        Palette dataset (colour combinations)
      sanzo-colors.json      Individual named colours dataset
    outfits/
      types.ts               Domain types
      color-matching.ts      OKLCH perceptual distance, neutral-handling
      engine.ts              Outfit-generation algorithm
      repository.ts          Prisma access (outfits + outfit_garments)
      service.ts             Business logic
    prendas/
      types.ts               Enums, category constants, GarmentWithColors
      labels.ts              Label lookup for the free-string option fields
      filtering.ts           Grid filter predicates
      validation.ts          Form validation (returns message keys, not sentences)
      repository.ts          Prisma access (garments + colors + seasons)
      service.ts             Business logic
    prisma.ts                Prisma singleton (better-sqlite3 driver adapter)
    uploads.ts               Filesystem paths + sharp pipeline
    useSheetState.ts         Bottom-sheet open/close state hook
    useSwipeToClose.ts       Swipe-down gesture hook
    ui.ts                    Small UI utilities
messages/
  ca.json                    Catalan — the source of truth for keys
  es.json                    Castellà
  en.json                    English
prisma/
  schema.prisma              Data model
  migrations/                SQL migrations
scripts/
  create-user.mjs            The only way an account is created
```

### Data model

```
Garment ─┬─ (1..N) Color         hex per colour, separate row
         ├─ (1..N) GarmentSeason enum: SPRING | SUMMER | AUTUMN | WINTER | ALL_YEAR
         └─ (0..N) OutfitGarment link table

Outfit  ── (0..N) OutfitGarment  paletteId is a foreign key into the Sanzo Wada JSON, not a DB table

User                            username (lower-cased), Argon2id hash, mustChangePw
LoginAttempt                    username + ip + outcome; the lockout reads these rows
```

Photos are stored on disk under `UPLOAD_DIR`, referenced by the `Garment.image` filename column.

`User` has no relation to anything: the wardrobe is one household's, and a garment does not belong to an account. `LoginAttempt` never stores a password or a hash — only who was tried, from where, and whether it worked.

---

## How the colour engine picks outfits

The **què hi combina** action suggests outfits by matching a garment against the Sanzo Wada
_Dictionary of Color Combinations_ (348 curated palettes, 157 canonical colours). The
algorithm lives in [`src/lib/outfits/engine.ts`](src/lib/outfits/engine.ts) and is
_canonical-first_: it never invents a combination, it always cites a page of the book.

### 1 · Snap each garment colour to the catalogue

For every hex on a garment the engine finds **all** Sanzo Wada canonicals within an
OKLCH perceptual distance of `14` — not just the nearest. Two thousand plausible
readings beat one arbitrary pick: `#d4c48e` is close to Ecru **and** Ivory Buff, and
we keep both.

Two special cases keep the snap intuitive:

- **Pure achromatics** (chroma < 0.02 — pure greys, black, white, warm off-whites)
  snap only within a hand-picked whitelist of six "grey family" canonicals
  (Black, White, Warm Gray, Neutral Gray, Mineral Gray, Fawn). Otherwise a mid grey
  could route through Plumbeous (a blue-grey) and be labelled as a hue.
- **Quasi-neutrals** (chroma between 0.02 and 0.05) snap among all low-chroma
  canonicals so tinted greys and dusty olives don't jump into saturated territory.

Saturated colours use the full 157-colour vocabulary through `perceptualDistance`,
which applies a `×1.6` penalty when comparing a neutral against a saturated colour
to prevent hue collapse near the grey axis.

### 2 · Compute each garment's palette membership

Every canonical colour in `sanzo-colors.json` carries its own `combinations` array —
the ids of the Sanzo Wada palettes that include it. A garment "lives in" a palette
when, for every one of its colours, at least one plausible canonical is on that
palette's list.

Formally, `paletteIds = ⋂_i (⋃_c ∈ candidates_i  c.combinations)` — a garment's
palettes are the intersection over its colours of the union over its candidate
canonicals.

### 3 · Compose valid outfits

Two or more garments form a valid outfit when:

1. Their `paletteIds` sets intersect (they share at least one Sanzo Wada page).
2. The intersection contains at least one palette whose slots are covered by **≥ 2
   distinct canonicals** in the outfit. This rejects monochrome pairings like
   _black shirt + black pants_ that would otherwise inherit any "Black + accent"
   palette without wearing the accent.
3. Category constraints: exactly one bottom (`PANTS`) plus at least one top
   (`SHIRT` or `SWEATER`), no repeated categories. Socks, shoes and accessories
   are excluded from colour matching — they attach to a saved outfit
   afterwards as post-hoc extras instead (see issue #57).

There is **no coverage rule** requiring an outfit to wear every non-neutral accent
a palette suggests. If Sanzo Wada's Combination 190 lists five colours and you're
only wearing two, that's still a valid Combination 190 outfit — you're just not
wearing the other accents.

### 4 · Rank

Outfits are ordered by piece count ascending, then by total canonical distance
(the sum of how far each garment's anchor was from its Sanzo Wada canonical) —
so tighter matches surface first.

For each outfit the engine returns a primary palette plus up to four extra
palettes whose per-garment distance is **strictly** under `9` (a tighter threshold
than the initial snap), so alternative readings only appear when they're
noticeably close.

### Why greys, black and beiges combine again

A common failure mode of a purely per-palette matcher is: Sanzo Wada contains only
one entirely-neutral palette (Combination 69, warm-gray + black). Every other
palette carries a saturated accent. Under a strict coverage rule a grey garment
could never fill a saturated slot, so it never combined with anything. The
canonical-first model + the grey-family whitelist restore the intuition that
neutrals go with neutrals via Combination 69 (and its cousins 198, 221) while
still routing beige-yellows through Ivory Buff into Combination 190, and so on.

---

## Getting started

```bash
npm install
npx prisma migrate dev        # create dev.db + client

# The session cookie is signed with this; without it the app refuses to
# authenticate anyone.
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

npm run create-user -- --username jordi   # prints a temporary password
npm run dev                   # http://localhost:3000
```

There is no sign-up screen, by design: the account you just created is
how you get in, and the app asks you to replace that temporary password
the first time you use it.

To reach it from another device on the same network:

```bash
ip route get 1 | awk '{print $7; exit}'
# → open http://<ip>:3000 on your phone
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack). |
| `npm run build` | Production build. Requires `prisma migrate deploy` first. |
| `npm run start` | Serve the production build. |
| `npm run create-user` | Create an account (or `--reset` its password). Prints a temporary one, or reads it from stdin with `--stdin`. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run check` | Lint + typecheck + build. Run before opening a PR. |
| `npm run test:unit` | Vitest unit tests (`tests/unit`). Runs in CI. |
| `npm run test:e2e` | Playwright e2e tests (`tests/e2e`). Local only, not run in CI. |

---

## Docker

### One-shot local build

```bash
docker build -t elmeu-armari .

docker run -d \
  --name elmeu-armari \
  -p 3000:3000 \
  -v elmeu-armari-data:/data \
  elmeu-armari
```

### Docker Compose

```bash
docker compose up -d          # build + run + auto-migrate
docker compose logs -f
docker compose down           # stop
docker compose down -v        # stop + wipe volumes (destructive)
docker compose up -d --build  # rebuild after changes
```

### Prebuilt image (GHCR)

```bash
docker run -d \
  --name elmeu-armari \
  -p 3000:3000 \
  -v elmeu-armari-data:/data \
  ghcr.io/jordiibru/elmeu-armari:latest
```

The entrypoint runs `prisma migrate deploy` before starting the server.

A fresh deployment has no accounts and nothing but the login screen. Create the first one from inside the container:

```bash
docker exec -it elmeu-armari node scripts/create-user.mjs --username jordi
```

It prints a temporary password once. The same command with `--reset` is also the password-recovery flow: there is no e-mail, and no self-service.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `AUTH_SECRET` | — | **Required.** Signs and encrypts the session cookie. `openssl rand -base64 32`. Changing it signs everyone out. |
| `DATABASE_URL` | `file:/data/prod.db` | SQLite file path |
| `UPLOAD_DIR` | `/data/uploads` | Where garment photos are written |
| `UPLOAD_MAX_MB` | `10` | Max upload size (pre-resize) |
| `PORT` | `3000` | HTTP port |

---

## Garment photos

Each garment can carry an optional photo, replacing the coloured stripes on its card.

- **Accepted formats**: JPEG, PNG, WebP. iOS's HEIC is usually converted automatically by the file picker — if not, convert before upload.
- **Re-encoding**: on upload, `sharp` resizes to 800 px on the longest side and writes WebP at quality 80. EXIF (including GPS) is dropped.
- **Storage**: files under `UPLOAD_DIR`; the DB only stores the filename.
- **Backup**: copy the entire `/data` volume (DB + uploads) as one unit.

### Preparing a clean shot with an AI helper

Paste this into ChatGPT / Claude / Gemini with the raw photo to get a catalogue-ready render:

> I need to prepare this photo of a garment for cataloguing in my digital wardrobe. Please retouch it with these constraints:
> - Uniform white or very light grey background, no harsh shadows.
> - Garment centred, laid flat or hung, filling ~80% of the frame.
> - Colours faithful to the original (do not saturate).
> - No text, watermarks, or surrounding objects.
> - 1:1 square format.
> - 800–1200 px per side.
> - Export as JPEG or PNG.

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`, PRs only) — lint + typecheck + `npm run test:unit` + build. Build requires `prisma migrate deploy` first because `/armari` reads the DB. No Docker build, no Trivy/Lighthouse/e2e in CI — those run locally for now.
- **Release** (`.github/workflows/release.yml`, on push to `main`) — auto-tags semver from conventional commits, creates a GitHub Release, then builds a Docker image and pushes to `ghcr.io/jordiibru/elmeu-armari` tagged with that version and `latest`.
- **Renovate** — weekly updates on Mondays before 07:00, immediate automerge for security advisories, grouped for the Next.js / Prisma / Tailwind / GitHub Actions ecosystems, digest pinning for base Docker images.

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, branch naming, PR flow and code conventions.

If you are (or run) an AI agent, read [`AGENTS.md`](./AGENTS.md) first — it explains non-obvious constraints of this codebase.

Found a security issue? See [`SECURITY.md`](./SECURITY.md) — please don't open a public issue.

---

## Licence

MIT — see [`LICENSE`](./LICENSE).
