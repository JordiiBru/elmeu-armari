# Plan: foto opcional de la peca (substitueix quadres de color)

Feature per pujar una foto per prenda que substitueix els quadres de color a la targeta. Self-hosted friendly: imatges al filesystem local, mai surten del server. Opcional: prenda sense foto segueix mostrant colors.

## Decisions preses (Jordi, 2026-07-04)

- **Storage**: filesystem local a `./data/uploads/`. No base64 a SQLite.
- **Processing**: resize a 800px costat major, WebP q80, via `sharp`.
- **Display**: si hi ha foto, substitueix totalment els quadres de color a la targeta. Colors romanen al DB per queries/paleta.
- **Font mobile**: només galeria/fitxer (input estandard). Sense camera in-app de moment.
- **Formats acceptats**: nomes `image/jpeg`, `image/png`, `image/webp`. HEIC rebutjat amb 415 — simplifica dependencies (sharp sense libheif) i cobreix el 99% de casos (iOS converteix a JPEG quan puja via `<input type=file>` en la majoria de configs). Documentar-ho al README.
- **Layout targeta amb foto**: quan hi ha foto, ocupa tota l'area visual de `GarmentCard` (no nomes el forat dels quadres). Text/metadata a sota o sobreposats. Sense foto → layout actual sense canvis.
- **Ordre a la grid**: es mante l'ordre actual, cap canvi.
- **Opcional**: prenda sense foto continua mostrant colors. Cap migracio destructiva.

## Canvis de schema

`prisma/schema.prisma` — afegir camp opcional a `Garment`:

```prisma
model Garment {
  // ... camps existents
  image     String?          // filename dins ./data/uploads/, e.g. "clxyz123.webp"
  // ...
}
```

Migració: `npx prisma migrate dev --name garment-image`. NOT NULL evitat expressament perque el camp es opcional.

## Storage layout

- Directori: `./data/uploads/` (a la rel del projecte, ignorat per git — afegir a `.gitignore`).
- Nom fitxer: `<garmentId>.webp`. Simple, deterministic, sobreescrivible al re-upload.
- Docker: exposar com a volum al `docker-compose.yml` (`./data:/app/data`).
- Servit via ruta API `/api/uploads/[filename]` (no `public/` per no filtrar-ho al build i per poder aplicar autoritzacio en el futur).

Config d'entorn:
- `UPLOAD_DIR` (default `./data/uploads`) — permet a self-hosters muntar volum a un altre path.
- `UPLOAD_MAX_MB` (default `10`) — limit del fitxer pujat (abans de resize).

## API

### `POST /api/garments/[id]/image`
Puja/reemplaça la imatge d'una prenda.
- Content-type: `multipart/form-data` amb camp `file`.
- Validacions:
  - Mime type: nomes `image/jpeg`, `image/png`, `image/webp`. Altres (incl. HEIC) → 415.
  - Mida <= `UPLOAD_MAX_MB`.
- Processing: `sharp(buffer).rotate().resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path)`.
- `rotate()` respecta EXIF orientation (crucial per fotos de mobil).
- Actualitza `Garment.image = "<id>.webp"` a la db.
- Retorna `{ image: "<id>.webp" }`.

### `DELETE /api/garments/[id]/image`
Elimina la imatge:
- `unlink` del fitxer si existeix (silenciar ENOENT).
- `Garment.image = null` a la db.

### `GET /api/uploads/[filename]`
Serveix el fitxer:
- Validar filename amb regex `^[a-z0-9]+\.webp$` (evitar path traversal).
- `readFile` de `UPLOAD_DIR + filename`, retornar amb `Content-Type: image/webp` i `Cache-Control: public, max-age=31536000, immutable` (el filename canvia si es sobreescriu? no, es reutilitza — usar `max-age=0, must-revalidate` en canvi, o afegir `?v=<updatedAt>` als src).

Decisio: **cache curt (`max-age=60`) + query param `?v=<updatedAt.getTime()>` als `<img src>`** per invalidar quan es re-puja.

## Frontend

### `AddForm.tsx` i `EditForm.tsx`
Afegir camp opcional "Foto":
- `<input type="file" accept="image/jpeg,image/png,image/webp">`.
- Preview local via `URL.createObjectURL` abans de submit.
- Flux Add: primer crear la prenda (POST existent), després si hi ha foto pujar-la (`POST /api/garments/<newId>/image`). En cas d'error de pujada, mostrar toast pero mantenir la prenda creada.
- Flux Edit: si l'usuari canvia foto, upload. Boto "Treu foto" que crida DELETE.

### `GarmentCard.tsx`
Logica actual (linies 23-28): mapa de `garment.colors` amb `backgroundColor`.

Nova logica:
```tsx
{garment.image ? (
  <img
    src={`/api/uploads/${garment.image}?v=${garment.updatedAt.getTime()}`}
    alt=""
    className="..."  // ocupa tota l'area visual de la targeta
    loading="lazy"
  />
) : (
  garment.colors.map(...)  // codi actual
)}
```

Quan hi ha foto: ocupa tota l'area visual de la targeta (no nomes la franja dels quadres actuals). Text/metadata queda a sota o sobreposat amb gradient per legibilitat. Sense foto: layout actual sense canvis. Mida global de la targeta a la grid inalterada (nomes canvia el que es pinta a dins).

### `GarmentModal.tsx`
Mostrar foto gran si existeix. Si no, quadres actuals. Al modal editar, permetre canviar/treure foto.

## Dependencies

Afegir a `package.json`:
- `sharp` (dep). Ja instalat? verificar. Si no, `npm i sharp`.

## Migracio / rollback

- Camp `image String?` opcional → prendes existents no afectades.
- Rollback: `prisma migrate resolve` + esborrar directori `data/uploads/`. Cap dada critica es perd (nomes fotos).

## Seguretat

- Validacio mime tant al client com al servidor.
- Sanititzar filename per evitar path traversal a `GET /api/uploads/[filename]`.
- `sharp` re-encoda a WebP → elimina EXIF sensible (GPS) i qualsevol payload amagat.
- Limit de mida al request body (Next.js: configurar `bodyParser` per aquesta ruta, o usar streaming).

## Deployment self-hosted

Afegir una seccio nova a `README.md` (titol suggerit: `## Fotos de prenda (opcional)`) amb aquest contingut literal:

````markdown
## Fotos de prenda (opcional)

Cada prenda pot tenir una foto que substitueix els quadres de color a la targeta. Es opcional: sense foto, la targeta mostra els colors com fins ara.

### Setup

Les imatges es guarden al filesystem, no dins la SQLite, per evitar que la db creixi. Necessites un volum persistent muntat a `/app/data`:

```yaml
# docker-compose.yml
services:
  app:
    # ...
    volumes:
      - ./data:/app/data
    environment:
      UPLOAD_DIR: /app/data/uploads   # opcional, default ja apunta aqui
      UPLOAD_MAX_MB: "10"             # opcional, limit fitxer abans de resize
```

### Formats

Nomes s'accepten `JPEG`, `PNG` i `WebP`. Els mobils iOS que pugen HEIC per defecte solen convertir a JPEG automaticament en usar el selector de fitxers; si no, converteix-la abans de pujar-la.

Les imatges es re-encoden a WebP 800px (costat major) amb qualitat 80. Les fotos originals no es guarden: metadata EXIF (GPS inclos) queda eliminada.

### Backup

Fer copia de `data/` sencera (conte db + uploads). Restaurar es copiar-la de tornada.

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
````

Backup general: copiar `data/` (db + uploads) juntes.

## Validacions previes al push (per Sonnet)

1. `npx tsc --noEmit` sense errors.
2. `npx next build` OK.
3. `npx prisma migrate dev` executat i migracio commitejada a `prisma/migrations/`.
4. Test manual: pujar JPG mobil (2-3MB), verificar que queda ~100KB WebP, orientacio correcta.
5. Test manual: prenda sense foto encara mostra quadres de color.
6. Test manual: DELETE foto → torna a quadres.
7. Verificar que `data/uploads/` esta a `.gitignore`.

## Fitxers a tocar

- `prisma/schema.prisma` — camp `image`.
- `prisma/migrations/<timestamp>_garment_image/` — generada.
- `src/app/api/garments/[id]/image/route.ts` — nou (POST + DELETE).
- `src/app/api/uploads/[filename]/route.ts` — nou (GET).
- `src/lib/uploads.ts` — nou. Helpers: `saveGarmentImage(buffer, id)`, `deleteGarmentImage(id)`, `getUploadDir()`.
- `src/components/AddForm.tsx` — camp foto + upload post-create.
- `src/components/EditForm.tsx` — camp foto + upload/delete.
- `src/components/GarmentCard.tsx` — render condicional img vs colors.
- `src/components/GarmentModal.tsx` — vista + edit foto.
- `.gitignore` — afegir `/data/`.
- `docker-compose.yml` — afegir volum.
- `README.md` — seccio "Fotos de prenda (opcional)" amb setup volum.
- `package.json` — `sharp` si no hi es.

## Fora d'abast (per issues separades)

- Multiples imatges per prenda.
- Camera in-app (`capture=environment`).
- Autoritzacio a `GET /api/uploads/*` (quan hi hagi auth — issue #11).
- Object storage S3-compatible.
- CDN / thumbnails multi-mida.

## Preguntes obertes

Cap ara mateix. Actualitzar aquesta seccio si sorgeixen dubtes durant la implementacio.

## Historial de decisions

- 2026-07-04: pla inicial redactat per Cosmo, resposes de Jordi via `AskUserQuestion` (storage=filesystem, processing=800px webp q80, display=substitueix quadres, font=galeria).
- 2026-07-04: fixat format d'entrada nomes JPEG/PNG/WebP (rebutja HEIC) per simplicitat. Confirmat que foto ocupa tota l'area visual de la targeta i que l'ordre de la grid no canvia.
- 2026-07-04: afegida seccio al README amb setup + prompt per retocar fotos amb IA abans de pujar.
