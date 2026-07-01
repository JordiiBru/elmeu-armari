@AGENTS.md

# elmeu-armari — context per a agents IA

## Stack

- **Next.js 16.2** (App Router, React Server Components, Turbopack per defecte)
- **React 19** — Server Actions, `useActionState`. No usar `useEffect` per fetch de dades.
- **Tailwind CSS v4** — sense fitxer de configuració, tot via CSS custom properties i `@theme`.
- **Prisma 7** + SQLite via `@prisma/adapter-better-sqlite3` (driver adapter, no el client estàndard).
- **TypeScript 5** strict.

## Estructura de carpetes

```
src/
  app/              Routes (App Router)
  components/       Només components React
  lib/
    prendas/
      labels.ts     Font única de labels localitzats — sempre llegir aquí abans de mostrar textos
      types.ts      Enums, constants, tipus derivats (PrendaConColores, etc.)
      service.ts    Lògica de negoci
      repository.ts Accés a dades (Prisma) — únic lloc on s'importa `prisma`
    colores/
      sanzo-wada.json  348 paletes reals de Sanzo Wada
    prisma.ts       Singleton Prisma amb adapter SQLite — no crear instàncies noves
prisma/
  schema.prisma
  migrations/
```

## Convencions

- **Accés a dades**: sempre a través de `repository.ts`. No importar `prisma` directament a components ni a `service.ts`.
- **Labels**: textos de l'UI (categories, textures, fits…) sempre des de `lib/prendas/labels.ts`. No duplicar.
- **Server Actions**: definir a l'arxiu del component o a `lib/prendas/service.ts` si es reutilitzen.
- **Client components**: mínim necessari. Si un component no necessita interactivitat, ha de ser Server Component.
- **Colors**: s'emmagatzemen com a hex a la taula `Color` (relació 1:N amb `Prenda`). No com a array a `Prenda`.

## Base de dades

`DATABASE_URL` apunta a un fitxer SQLite:
- Dev: `file:./dev.db` (definit a `.env`)
- Prod/CI: `file:/data/prod.db` o `file:/tmp/ci.db`

El client Prisma usa el driver adapter de better-sqlite3, **no** el client estàndard de Prisma. El singleton és a `src/lib/prisma.ts`.

Quan s'afegeix un model o es modifica l'schema:
```bash
npx prisma migrate dev --name <nom>   # dev
npx prisma migrate deploy             # prod/CI (sense interactivitat)
npx prisma generate                   # regenera el client a src/generated/prisma/
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): lint+typecheck, npm audit, Trivy fs scan, build, Lighthouse.
  - El build necessita `prisma migrate deploy` previ (SSG de `/armari` llegeix la DB).
  - Lighthouse corre contra un servidor local amb DB migrada i buida.
- **CD** (`.github/workflows/cd.yml`): push de tag `v*.*.*` → build Docker → push a `ghcr.io/jordiiibru/elmeu-armari` amb tags semver.

## Entorn local

```bash
npm install
npx prisma migrate dev
npm run dev          # http://localhost:3000
```

```bash
npm run lint         # ESLint
npx tsc --noEmit     # Typecheck
npm run build        # Build de producció
```

## Docker

```bash
docker build -t elmeu-armari .
docker run -p 3000:3000 -v sqlite_data:/data elmeu-armari
```

L'entrypoint executa `prisma migrate deploy` automàticament abans d'arrencar el servidor.

## Renovate

`renovate.json` configurat per:
- Actualitzacions setmanals (dilluns < 7am)
- Automerge immediat d'alertes de seguretat
- Grups: Next.js ecosystem, Prisma, Tailwind, GitHub Actions
- Digest pinning per imatges Docker de base
