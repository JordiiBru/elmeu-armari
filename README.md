# elmeu-armari

Gestor de armario personal. Base de datos de prendas con sistema de recomendacion de outfits basado en teoria del color (Sanzo Wada).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Prisma 7** ORM + SQLite (via `@prisma/adapter-better-sqlite3`)
- **Docker** + k3s (homelab)

## Estructura

```
src/
  app/              rutas Next.js (HTTP layer)
    /               homepage con 3 accesos
    /add            formulario nueva prenda
    /armari         grid de prendas con filtros
    /edit/[id]      editar prenda existente
    /paleta         paletas Sanzo Wada estaticas
  lib/
    prendas/        dominio prendas: repository, service, types
    colores/        dominio color: paletas Sanzo Wada, repository
    outfits/        dominio outfits: recomendador (post-MVP)
  components/       componentes client reutilizables
  generated/prisma  cliente Prisma generado (gitignore)
prisma/
  schema.prisma     modelo de datos
  migrations/       migraciones SQL
```

## Modelo de datos

Cada prenda tiene: categoria, N colores (hex), textura, dibujo, temporada (JSON array), talla, fit y una nota libre opcional.

Los colores se guardan en tabla separada (`Color`) vinculada a la prenda.

## Desarrollo local

```bash
npm install
npx prisma migrate dev
npm run dev
```

App en http://localhost:3000

## Con Docker

```bash
docker compose up
```

App en http://localhost:3000. La DB SQLite persiste en el volumen `sqlite_data`.

## Vistas

| Ruta | Descripcion |
|------|-------------|
| `/` | Homepage: acceso a armario, anadir prenda y paleta |
| `/armari` | Grid de prendas filtrable por categoria |
| `/add` | Formulario nueva prenda |
| `/edit/[id]` | Editar prenda existente |
| `/paleta` | Paletas de color del libro Sanzo Wada |

## Roadmap

- **MVP**: CRUD de prendas, vista armario con filtros, paleta Sanzo Wada
- **v2**: subida de imagenes (ficheros en PVC, path en DB)
- **v3**: vista outfit con carrusel por categoria
- **v4**: recomendador de outfits (Sanzo Wada + fit + temporada)
- **v5**: multiusuario + auth

Ver issues para el detalle de cada fase.
