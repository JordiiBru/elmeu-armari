# elmeu-armari

Gestor personal de roba. Registra les teves peces, filtra per categoria i temporada, i troba combinacions de colors amb les paletes de Sanzo Wada.

## Stack

- **Next.js 16.2** (App Router, React Server Components) + TypeScript
- **Tailwind CSS v4** — sense preprocessor
- **Prisma 7** + SQLite via `@prisma/adapter-better-sqlite3`
- **React 19** — Server Actions, `useActionState`

## Estructura

```
src/
  app/
    /               Homepage
    /add            Formulari nova peça
    /armari         Grid de peces amb filtres
    /edit/[id]      Editar peça
    /paleta         348 paletes Sanzo Wada
  components/
    AddForm.tsx           Formulari client (useActionState + errors)
    EditForm.tsx          Formulari edició client
    ArmariGrid.tsx        Grid filtrable (categoria + temporada)
    ColorPickers.tsx      Selector de colors múltiple
    TemporadaCheckboxes.tsx
  lib/
    prendas/
      labels.ts     Labels localitzats (font única)
      types.ts      Enums, constants, PrendaConColores
      service.ts    Lògica de negoci
      repository.ts Accés a dades (Prisma)
    colores/
      sanzo-wada.json  348 combinacions reals
    prisma.ts       Singleton Prisma amb adapter SQLite
prisma/
  schema.prisma     Model de dades
  migrations/       Migracions SQL
```

## Model de dades

Cada peça: `categoria`, N colors (hex, taula `Color` separada), `textura`, `dibuix`, `temporada` (JSON array), `talla`, `fit`, `nota` opcional.

```
Prenda (1) ──── (*) Color
```

## Desenvolupament local

```bash
npm install
npx prisma migrate dev
npm run dev
# → http://localhost:3000
```

Per accedir des d'un altre dispositiu de la xarxa:

```bash
# Troba la teva IP local
ip route get 1 | awk '{print $7; exit}'
# → http://<ip>:3000
```

## Docker

### Una sola comanda (build local)

```bash
docker build -t elmeu-armari .

docker run -d \
  --name elmeu-armari \
  -p 3000:3000 \
  -v elmeu-armari-data:/data \
  elmeu-armari
# → http://localhost:3000
```

### Docker Compose (recomanat)

```bash
# Arrancar (build + migracions automàtiques)
docker compose up -d

# Logs
docker compose logs -f

# Aturar
docker compose down

# Aturar i esborrar dades (destructiu)
docker compose down -v

# Rebuild després de canvis
docker compose up -d --build
```

### Imatge prebuilt (GHCR)

```bash
docker run -d \
  --name elmeu-armari \
  -p 3000:3000 \
  -v elmeu-armari-data:/data \
  ghcr.io/jordiiibru/elmeu-armari:latest
```

### Variables d'entorn

| Variable | Defecte | Descripció |
|---|---|---|
| `DATABASE_URL` | `file:/data/prod.db` | Ruta del fitxer SQLite |
| `PORT` | `3000` | Port HTTP |

## Rutes

| Ruta | Descripció |
|---|---|
| `/` | Homepage |
| `/armari` | Grid de peces, filtre per categoria i temporada |
| `/add` | Nova peça |
| `/edit/[id]` | Editar peça |
| `/paleta` | 348 paletes Sanzo Wada |

## Issues oberts (post-MVP)

| # | Feature |
|---|---|
| [#13](https://github.com/JordiiBru/elmeu-armari/issues/13) | PWA manifest — instal·lable al mòbil |
| [#14](https://github.com/JordiiBru/elmeu-armari/issues/14) | Deploy k3s (Helm + ArgoCD) |
| [#15](https://github.com/JordiiBru/elmeu-armari/issues/15) | Pàgina de detall de peça |
| [#16](https://github.com/JordiiBru/elmeu-armari/issues/16) | Upload foto |
| [#17](https://github.com/JordiiBru/elmeu-armari/issues/17) | Outfit builder amb Sanzo Wada |
| [#18](https://github.com/JordiiBru/elmeu-armari/issues/18) | Estadístiques |
| [#19](https://github.com/JordiiBru/elmeu-armari/issues/19) | Filtres multi-select i cerca |
| [#20](https://github.com/JordiiBru/elmeu-armari/issues/20) | Export / import JSON |
