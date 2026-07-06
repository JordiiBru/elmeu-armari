# Plan: pestanya `emprovador` — carrusels d'outfit

Nova pestanya de primer nivell per explorar outfits movent 3 carrusels independents (top / bottom / shoes). Estil coherent amb la resta: serif editorial, animacions suaus, sense emojis.

## Decisions preses (Jordi, 2026-07-06)

- **Nom**: `emprovador`. Entrada nova al `PRIMARY` de la home.
- **3 fileres**: `top` (SHIRT + SWEATER), `bottom` (PANTS), `shoes` (SHOES). `SOCKS` fora. `jacket` no existeix com a categoria — no s'afegeix res.
- **Us dual**:
  - Normal: `/emprovador` obre els 3 carrusels amb la primera peca de cada bucket.
  - Contextual: `/emprovador?top=<id>&bottom=<id>&shoes=<id>` prefixa les tres peces (usat desde `SavedOutfitsView`).

## Model de dades i bucketing

Cap canvi d'schema. Nou helper:

`src/lib/outfits/buckets.ts`
```ts
import type { Category } from "@/lib/prendas/types";

export type Bucket = "top" | "bottom" | "shoes";

export function bucketOf(category: Category): Bucket | null {
  if (category === "SHIRT" || category === "SWEATER") return "top";
  if (category === "PANTS") return "bottom";
  if (category === "SHOES") return "shoes";
  return null; // SOCKS i futurs → fora
}
```

Filtre per temporada: reusar la logica de `OutfitBuilder.filterBySeason` — extreure-la a `src/lib/outfits/season.ts` si es reusa a mes d'un lloc, si no inline.

## Ruta

`src/app/emprovador/page.tsx` — Server Component:
1. `repository.listGarmentsWithColors()` (metode existent o afegir-lo si cal).
2. Agrupar per `bucketOf(g.category)` → `{ tops, bottoms, shoes }`.
3. Ordre estable per `createdAt` desc (mateix ordre que `armari`).
4. Passar a `<Provador tops={...} bottoms={...} shoes={...} />`.
5. Llegir `searchParams.top|bottom|shoes` per obtenir index inicial de cada carrusel (si l'id existeix al bucket; si no, index 0).

Sense metadata especial. Layout hereta del root — el `SiteHeader` ja mostra back button automatic.

## Component `Provador.tsx` (client)

Signatura:
```ts
interface Props {
  tops: GarmentWithColors[];
  bottoms: GarmentWithColors[];
  shoes: GarmentWithColors[];
  initial: { top: number; bottom: number; shoes: number };
  palettes: SanzoPalette[]; // per boto "quines paletes combinen"
}
```

Estat: `season`, `topIdx`, `bottomIdx`, `shoesIdx`, `sheetOpen`.

Layout:
- Contenidor full-height (`min-h-[calc(100vh-<header>)]`), 3 fileres apilades verticalment amb `grid-rows-3` o `flex-col` amb `flex-1` per filera.
- Cada filera es un `<CarouselRow items={bucket} index={idx} onChange={setIdx} label={CATEGORY_LABELS[…]} />`.
- Selector de temporada a dalt, mateix component visual que a `OutfitBuilder` (extreure `SeasonSelector.tsx` si es rendible; si no, duplicar per ara).
- Sota tot: barra fina discreta amb els colors de les 3 peces actuals + link "quines paletes hi combinen" que obre `OutfitBottomSheet` amb els colors combinats. + link "desar aquest outfit" (reusa server action existent de `SavedOutfits`).

Quan canvia `season`, resetejar cada `idx` a 0 si l'actual queda fora del bucket filtrat.

## Component `CarouselRow.tsx` (client)

Filera horitzontal amb snap i drag. Estil minimalista.

Props:
```ts
interface Props {
  items: GarmentWithColors[];
  index: number;
  onChange: (i: number) => void;
  label: string; // "Samarreta" | "Pantalons" | "Sabates"
}
```

Implementacio:
- Contenidor `relative overflow-hidden`.
- Track `flex` amb translate segons `index * itemWidth`. `transform: translateX(calc(-1 * var(--idx) * var(--tile)))`.
- Tiles: `aspect-square`, amplada `min(60vw, 320px)` centrats; veïns escala `0.9` opacitat `0.35`, central escala `1` opacitat `1`. Transicio `transition-[transform,opacity] duration-500 ease-out`.
- Drag: `pointerdown/move/up` (o touch nadiu). Al `pointerup` snap al mes proper. Umbral swipe: 25% de l'amplada del tile o velocitat > 0.5px/ms.
- Fletxes laterals `‹` `›` discretes (visibles a hover en desktop, sempre visibles compactes en mobil). Boto amb `active:scale-[0.96]`.
- Categoria label a l'esquerra amb `text-[11px] tracking-[0.25em] uppercase text-foreground-secondary`, mateix llenguatge que a `OutfitBuilder`.
- Comptador `n/total` a la dreta amb `tabular-nums`, tambe `[11px] tracking-[0.2em]`.
- Buit: filera amb text serif italic `No tens peces d'aquesta categoria`.

Peces sense foto: fallback amb franges verticals dels seus `colors` (mateixa logica que `GarmentCard` — extreure `PieceThumb` a `src/components/PieceThumb.tsx` si encara no existeix; el `plan-outfits.md` ja preveu unificar-ho).

Amb `next/image` (obligatori per `no-img-element` d'ESLint). `sizes="(max-width: 640px) 60vw, 320px"`. `priority` nomes al tile central inicial de cada filera.

Accessibilitat:
- `role="region"` amb `aria-roledescription="carrusel"` i `aria-label={label}`.
- Fletxes amb `aria-label="Anterior"` / `"Següent"`.
- Fletxes navegables per teclat i `←`/`→` quan el carrusel te focus (`tabIndex=0`).

## Integracio amb resta d'app

### Home (`src/app/page.tsx`)

Afegir entrada al `PRIMARY`:
```ts
const PRIMARY = [
  { href: "/armari", label: "El meu armari" },
  { href: "/emprovador", label: "Emprovador" },
  { href: "/paleta", label: "Paletes" },
];
```

### `SavedOutfitsView.tsx`

Al header de cada `SavedGroupCard`, afegir boto discret `emprovar` que fa `router.push` a `/emprovador?top=<id>&bottom=<id>&shoes=<id>` amb els ids de les peces del grup (si el grup te peces de mes d'una categoria — agafar la primera de cada bucket). Estil coherent amb el boto `eliminar` del `plan-outfits.md` (icona o text serif italic petit).

### `OutfitBottomSheet.tsx`

Fora d'abast d'aquest PR. Post-MVP: link "emprovar aquesta paleta" quan la sheet mostra una paleta amb prou colors per suggerir un outfit.

## Estil (recordatori)

- Serif per titulars/labels de peça, sans per meta.
- Uppercase tracking `[0.15em]–[0.25em]` per etiquetes small-caps.
- Transicions `duration-200`/`500`, `ease-out`, `will-change-transform` als carrusels.
- `active:scale-[0.96]` a botons.
- Colors: `foreground`, `foreground-secondary`, `border`. Res hardcoded.
- Zero emojis.

## Fitxers nous

- `src/app/emprovador/page.tsx`
- `src/components/Provador.tsx`
- `src/components/CarouselRow.tsx`
- `src/lib/outfits/buckets.ts`
- (opcional) `src/components/SeasonSelector.tsx` — extret si es reusa
- (opcional) `src/components/PieceThumb.tsx` — extret si es reusa

## Fitxers a tocar

- `src/app/page.tsx` — afegir entrada `emprovador` al `PRIMARY`
- `src/components/SavedOutfitsView.tsx` — boto `emprovar` per outfit desat (depen del rethink de `plan-outfits.md`; si aquest encara no s'ha aplicat, fer-ho despres)
- `src/components/OutfitBuilder.tsx` — si extraiem `SeasonSelector`, adaptar

## Fora d'abast (post-MVP)

- Guardar l'outfit muntat a l'emprovador com a `SavedOutfit` amb nom personalitzat (potser MVP si es trivial reusant l'action).
- Composicio d'imatge (screenshot dels 3 tiles junts) per compartir.
- Filtres addicionals (color, textura) dins l'emprovador.
- Boto "aleatori" que dispari els 3 carrusels a peces random.
- Drag vertical entre fileres.
- `jacket` com a 4a filera.

## Validacions previes al push

1. `npx tsc --noEmit` net.
2. `npm run lint` net (no `<img>`, no `useEffect` per fetch).
3. `npx next build` OK amb `prisma migrate deploy` previ.
4. Manual:
   - `/emprovador` carrega amb 3 carrusels, primera peca de cada bucket centrada.
   - Swipe touch a mobil (viewport 375px) canvia peca amb snap suau.
   - Drag mouse a desktop funciona.
   - Fletxes ← → naveguen amb teclat quan focus dins carrusel.
   - Selector `temporada` filtra i reseteja index.
   - Peca sense foto mostra franges de color.
   - Desde `/desats` (o el nom que quedi post rethink), boto `emprovar` navega a `/emprovador?top=…` amb les peces correctes centrades.
   - Back button de `SiteHeader` funciona (torna al lloc anterior).
5. Lighthouse: verificar que el carrusel no fa layout shift (CLS < 0.1).
