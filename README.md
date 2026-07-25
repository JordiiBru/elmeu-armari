# elmeu-armari

A personal wardrobe manager. Catalogue your clothes with colours and photos, then discover which of the 348 Sanzo Wada colour palettes match combinations of the pieces you actually own.

> UI is in Catalan by design. Everything else in this repo — code, docs, comments — is in English.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black) ![React](https://img.shields.io/badge/React-19-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4)

---

## Features

- **Garment catalogue** (`/armari`) — grid with filters by category and season, tabs for pieces / combinations / saved outfits. Categories: sweater, shirt, pants, socks, shoes, accessory. Detail URLs are a slug (`/armari/bossa-zez4hi`), not the raw id — the "què hi combina" colour-matching action is hidden for shoes, socks and accessories since they don't take part in it.
- **Add & edit** (`/add`, `/edit/[id]`) — form with multi-colour picker, seasons multi-select, texture / pattern / fit / size, optional photo upload. Fields adapt to the category: an accessory (ring, watch, belt, bag, hat, scarf, glasses…) skips texture, pattern, fit and size, and its colour is optional.
- **Photo pipeline** — uploads re-encoded to WebP 800px @ q80 via `sharp`, EXIF stripped, thumbnails generated. Photos live on the filesystem, not in SQLite.
- **Outfit builder** (`/armari` → `Combinar`) — pick a piece, get Sanzo Wada palettes that contain its colours, browse matching pieces per palette colour, save the outfit.
- **Saved outfits** (`/armari` → `Desats`) — grouped by piece set, each entry linked to the palette it was saved with. Shoes, socks and accessories attach afterwards as "extras", outside the colour matching: shoes are a single slot (picking a new pair replaces the old one), accessories have no limit. The picker for extras is split into a section per kind, and an accessory shows its subtype (e.g. "bossa") instead of a generic label. Delete inline, or duplicate to try a different pair of shoes / set of accessories on the same core.
- **Sanzo Wada palettes** (`/paleta`) — browse all 348 historical palettes; opening one shows the pieces you own that match it.
- **Statistics** (`/stats`) — breakdown by category, season, fit and texture.
- **Import / export** (`/settings`) — download all garments as JSON, upload a previously exported file to restore.
- **PWA manifest** — installable on mobile, custom icon and theme.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2** | App Router, React Server Components, Turbopack. Read `AGENTS.md` — this is not the Next.js from your training data. |
| Runtime | **React 19** | Server Actions, `useActionState`. **No `useEffect` for data fetching.** |
| Styling | **Tailwind CSS v4** | No config file; theming via CSS custom properties and `@theme`. |
| DB | **SQLite** | Single file, mounted volume in prod. |
| ORM | **Prisma 7** | Uses `@prisma/adapter-better-sqlite3` driver adapter — **not** the standard Prisma client. |
| Language | **TypeScript 5** | Strict mode. |
| Images | **sharp** | Server-side WebP re-encoding + thumbnail generation. |

---

## Project layout

```
src/
  app/                       App Router routes
    page.tsx                 Home
    add/                     New garment
    armari/                  Wardrobe grid + tabs (pieces / combine / saved)
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
  components/                React components (kebab-cased UI role, PascalCase file)
  lib/
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
      labels.ts              Localised UI labels (single source of truth)
      filtering.ts           Grid filter predicates
      validation.ts          Form validation
      ui-strings.ts          Copy strings for forms/errors
      repository.ts          Prisma access (garments + colors + seasons)
      service.ts             Business logic
    prisma.ts                Prisma singleton (better-sqlite3 driver adapter)
    uploads.ts               Filesystem paths + sharp pipeline
    useSheetState.ts         Bottom-sheet open/close state hook
    useSwipeToClose.ts       Swipe-down gesture hook
    ui.ts                    Small UI utilities
prisma/
  schema.prisma              Data model
  migrations/                SQL migrations
```

### Data model

```
Garment ─┬─ (1..N) Color         hex per colour, separate row
         ├─ (1..N) GarmentSeason enum: SPRING | SUMMER | AUTUMN | WINTER | ALL_YEAR
         └─ (0..N) OutfitGarment link table

Outfit  ── (0..N) OutfitGarment  paletteId is a foreign key into the Sanzo Wada JSON, not a DB table
```

Photos are stored on disk under `UPLOAD_DIR`, referenced by the `Garment.image` filename column.

---

## How the colour engine picks outfits

The **Combinar** tab suggests outfits by matching a garment against the Sanzo Wada
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
npm run dev                   # http://localhost:3000
```

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
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run check` | Lint + typecheck + build. Run before opening a PR. |

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
  ghcr.io/jordiiibru/elmeu-armari:latest
```

The entrypoint runs `prisma migrate deploy` before starting the server.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
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

- **CI** (`.github/workflows/ci.yml`) — lint + typecheck, `npm audit`, Trivy filesystem scan, build, Lighthouse. Build requires `prisma migrate deploy` first because `/armari` reads the DB. Lighthouse runs against a local server with a migrated empty DB.
- **Release** (`.github/workflows/release.yml`) — pushing a `v*.*.*` tag builds a Docker image and pushes to `ghcr.io/jordiiibru/elmeu-armari` with semver tags.
- **Renovate** — weekly updates on Mondays before 07:00, immediate automerge for security advisories, grouped for the Next.js / Prisma / Tailwind / GitHub Actions ecosystems, digest pinning for base Docker images.

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, branch naming, PR flow and code conventions.

If you are (or run) an AI agent, read [`CLAUDE.md`](./CLAUDE.md) and [`AGENTS.md`](./AGENTS.md) first — they explain non-obvious constraints of this codebase.

---

## Licence

MIT — see [`LICENSE`](./LICENSE).
