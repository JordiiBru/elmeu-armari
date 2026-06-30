# elmeu-armari

Gestor de armario personal. Base de datos de prendas con sistema de recomendacion de outfits basado en teoria del color (Sanzo Wada).

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Prisma** ORM + SQLite
- **Docker** + k3s (homelab)

## Estructura

```
src/
  app/              rutas Next.js (HTTP layer)
  lib/
    prendas/        dominio prendas: repository, service, types
    colores/        dominio color: paletas Sanzo Wada, logica combinaciones
    outfits/        dominio outfits: recomendador (post-MVP)
prisma/
  schema.prisma     modelo de datos
```

## Modelo de datos

Cada prenda tiene: categoria, N colores (hex), textura, dibujo, temporada, talla, fit y una nota libre opcional.

Los colores se guardan en tabla separada (`Color`) vinculada a la prenda — esto permite al recomendador buscar combinaciones por paleta de color.

## Vistas

| Ruta | Descripcion |
|------|-------------|
| `/` | Homepage: acceso a armario, anadir prenda y paleta |
| `/armari` | Grid de prendas filtrable por categoria |
| `/add` | Formulario nueva prenda |
| `/edit/[id]` | Editar prenda existente |
| `/paleta` | Paletas de color del libro Sanzo Wada |

## Desarrollo local

```bash
npm install
npx prisma migrate dev
npm run dev
```

Con Docker:

```bash
docker compose up
```

## Roadmap

- **MVP**: CRUD de prendas, vista armario con filtros, paleta Sanzo Wada
- **v2**: subida de imagenes (ficheros en PVC, path en DB)
- **v3**: vista outfit con carrusel por categoria
- **v4**: recomendador de outfits (Sanzo Wada + fit + temporada)
- **v5**: multiusuario + auth

Ver issues para el detalle de cada fase.
