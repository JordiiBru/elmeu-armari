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
| `UPLOAD_DIR` | `/data/uploads` | Directori on es guarden les fotos de les peces |
| `UPLOAD_MAX_MB` | `10` | Mida màxima del fitxer pujat (abans del resize) |
| `PORT` | `3000` | Port HTTP |

## Fotos de prenda (opcional)

Cada prenda pot tenir una foto que substitueix els quadres de color a la targeta. Es opcional: sense foto, la targeta mostra els colors com fins ara.

### Setup

Les imatges es guarden al filesystem, no dins la SQLite, per evitar que la db creixi. El volum `/data` ja inclou les fotos i la base de dades — cal fer-ne backup conjuntament.

### Formats

Nomes s'accepten `JPEG`, `PNG` i `WebP`. Els mobils iOS que pugen HEIC solen convertir a JPEG automaticament en usar el selector de fitxers; si no, converteix-la abans de pujar-la.

Les imatges es re-encoden a WebP 800px (costat major) amb qualitat 80. Les fotos originals no es guarden: metadata EXIF (GPS inclos) queda eliminada.

### Backup

Fer copia del volum `/data` sencer (conte db + uploads). Restaurar es copiar-lo de tornada.

### Prompt per retocar la foto amb IA abans de pujar-la

Si vols una foto neta i uniforme (fons blanc, prenda centrada), pots passar-la per ChatGPT/Claude/Gemini amb aquest prompt:

> Necessito preparar aquesta foto d'una peca de roba per catalogar-la al meu armari digital. Retoca-la amb aquests criteris:
> - Fons blanc o gris molt clar, uniforme, sense ombres fortes.
> - La peca centrada, ben plana o penjada, ocupant aproximadament el 80% del marc.
> - Colors fidels al original (no saturis).
> - Sense text, marques d'aigua, ni objectes al voltant.
> - Format quadrat 1:1.
> - Resolucio final entre 800 i 1200 px per costat.
> - Exporta com a JPEG o PNG.

Un cop retocada, puja-la des del formulari d'afegir/editar prenda.

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
