# Plan: fix regressió back button + rethink pestanya Combinar/Desats

Tres problemes independents. Els fixos 1 i 3 son trivials. El 2 es un redisseny que aprofita la feature de fotos ja implementada.

## 1. Back button (regressió del PR #42)

**Causa**: `src/components/AddForm.tsx:45,56` fa `router.push("/armari")` per redirigir despres del upload de la foto. `push()` afegeix entrada a l'historial → back button des de `/armari` torna a `/add` en lloc d'a la pagina previa.

Abans (sense foto), la accio del server feia `redirect("/armari")` que fa una redireccio HTTP i no afegeix `/add` a l'historial. Aquell comportament es correcte.

**Fix**: canviar els dos `router.push("/armari")` per `router.replace("/armari")` al `AddForm.tsx`. Zero canvis a la logica.

## 2. Rethink Combinar + Desats amb fotos

### Estat actual

- **Combinar** (`OutfitCard.tsx`): cada peca es un quadrat `h-14 w-14` amb tira vertical de colors. No es veu quina peca es, nomes els colors. Amb `pl-` gran s'aparta el text.
- **Desats** (`SavedOutfitsView.tsx`): cada grup es una fila plana amb tira mini de swatches `h-14 w-3`. Es veu encara pitjor: nomes columnes de colors sense contextualitzar quina peca es.

Ara que hi ha fotos opcionals per peca, s'ha d'aprofitar per fer aixo visual de veritat.

### Proposta

**Combinar (OutfitCard)**: cada peca ocupa un tile `aspect-square` mes gran (~72-96px). Si te foto → foto (object-cover). Si no → tira de colors com abans, dins el mateix tile. Text de categoria a sota. Layout: `flex-row gap-3` amb tots els tiles en fila (o wrap si son molts).

**Desats (SavedOutfitsView)**: mateixa idea que Combinar per la fila colapsada. Tiles petits (`h-16 w-16`) en fila, en lloc de la tira de columnes actual. Al expandir, la llista de paletes-desades queda sota.

**Botó eliminar**: en lloc de padding esquerre gegant + `flex items-center` on el boto queda escanyat, fer-lo un icona `×` petita a la dreta del row de paleta, sense `pl-*`. Alineacio via `grid-cols-[auto_1fr_auto]` (swatches | nom | boto).

### Fitxers a tocar

- `src/components/OutfitCard.tsx` — reescriure `PieceThumb` per usar foto o colors, tiles mes grans, layout horitzontal
- `src/components/SavedOutfitsView.tsx`:
  - `SavedGroupCard`: substituir la tira `h-14 w-3` per tiles `h-16 w-16` amb foto/colors
  - `SavedPaletteRow`: layout grid, boto icona `×`, treure el `pl-` gegant del contenidor pare
- `src/lib/outfits/types.ts` — assegurar que el tipus de `garment` dins `SavedOutfit`/`OutfitGroup` inclou `image`. Verificar-ho abans.

### Fora d'abast

- Canvi de layout tipus "maniqui" (siluetes apilades verticalment) — post-MVP.
- Zoom/lightbox de foto dins outfit — post-MVP.
- Reordre drag-and-drop de peces dins outfit — no forma part d'aquest fix.

## 3. Boto "eliminar" tallat

Vist al fix 2. Al `SavedPaletteRow` (`SavedOutfitsView.tsx:159-185`):
- Contenidor pare (`SavedGroupCard`, linia 135) fa `pl-[calc(0.375rem*4+3rem)]` → molt padding esquerre.
- El row te `flex items-center gap-4` amb 3 elements: swatches, nom truncat, boto `shrink-0`.
- El boto es text "eliminar" (~60px). A viewports estrets el nom empeny el boto contra la vora dreta o s'escurça pel `flex-1 min-w-0 truncate` no aplicat correctament.

**Fix** (dins el redisseny 2):
- Treure `pl-[calc(...)]` del contenidor pare.
- Row com a `grid grid-cols-[auto_1fr_auto] gap-3 items-center`.
- Boto amb icona `×` en lloc de text "eliminar" (mes robust a mobil, ja hi ha `aria-label` per accessibilitat).

## Validacions previes al push

1. `npx tsc --noEmit` net.
2. `npm run lint` net (no `<img>` sense `next/image`, no `setState` sincron dins effect).
3. `npx next build` OK.
4. Test manual back button: `/armari` → boto "afegir" → `/add` → guardar peca (amb i sense foto) → landing a `/armari` → back button torna al lloc anterior a `/add`, no a `/add`.
5. Test manual Combinar: peces amb foto es veuen amb foto al tile; peces sense foto veuen colors.
6. Test manual Desats: mateixa consistencia visual; boto eliminar visible i clicable a mobil (viewport 375px).

## Decisions preses (Jordi, 2026-07-04)

- **Combinar layout**: fila horitzontal de tiles quadrats (~80px), foto si en te, colors si no. Wrap si son mes de 4-5. Categoria a sota de cada tile.
- **Boto eliminar**: icona `×` amb `aria-label="Eliminar outfit"`. Layout grid `[auto_1fr_auto]`.
- **Peces sense foto**: franges de color com fallback (coherent amb `GarmentCard`).
