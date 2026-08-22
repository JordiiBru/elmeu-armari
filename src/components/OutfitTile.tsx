"use client";

import { useTranslations } from "next-intl";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { optionLabel, type LabelsTranslator } from "@/lib/prendas/labels";
import { isWearable } from "@/lib/bugaderia/laundry";
import { nameOf, namedColors } from "@/lib/colors";
import { oklchDistance } from "@/lib/outfits/color-matching";
import { PieceThumb } from "./PieceThumb";
import { Card, Text } from "@/components/ui";

/** A piece reads better by its subtype ("polo", "vaquers", "anell") than
 * by its category — every accessory shares the same category label.
 *
 * Takes the translator rather than calling the hook: the callers that
 * need it are already holding one, and this is used inside `.map()` and
 * inside `useMemo`, where a hook cannot go.
 */
export function pieceLabel(t: LabelsTranslator, garment: GarmentWithColors): string {
  return garment.subtype
    ? optionLabel(t, "subtype", garment.subtype)
    : t(`category.${garment.category}`);
}

/**
 * The historic name of the Sanzo Wada colour a hex is closest to.
 *
 * `nameOf` is an exact lookup, and clothes are almost never an exact
 * Sanzo hex — so naming a garment's colour that way printed raw hexes
 * into the interface most of the time. The nearest name is both honest
 * and the vocabulary this app already speaks everywhere else.
 *
 * Cached: 348 comparisons per colour, and the same handful of colours
 * are asked for on every render.
 */
const nearestNameCache = new Map<string, string>();

function nearestSanzoName(hex: string): string {
  const key = hex.toLowerCase();
  const cached = nearestNameCache.get(key);
  if (cached) return cached;

  const exact = nameOf(key);
  if (exact) {
    nearestNameCache.set(key, exact);
    return exact;
  }

  let best = namedColors[0];
  let bestDistance = Infinity;
  for (const candidate of namedColors) {
    const distance = oklchDistance(key, candidate.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  nearestNameCache.set(key, best.name);
  return best.name;
}

/**
 * What tells two pieces of the same kind apart at a glance. Every shirt
 * you own is a "samarreta"; only one of them is Salvia Blue.
 */
export function pieceTint(garment: GarmentWithColors): string | null {
  const hex = garment.colors[0]?.hex;
  return hex ? nearestSanzoName(hex) : null;
}

/** The pieces an outfit is made of: "polo · vaquers". No extras — they
 * belong to the day, not to the outfit. */
export function outfitSubtitle(t: LabelsTranslator, outfit: SavedOutfit): string {
  return outfit.garments.map((g) => pieceLabel(t, g)).join(" · ");
}

/**
 * A Sanzo combination is stored as "Combination 141", which tells the user
 * nothing. Its colours do have historic names, and those are how a palette
 * is actually recognised ("Vermilion · Sage"), so the line is built from
 * them and falls back to the combination number only when no hex is named.
 *
 * It is the outfit's second line, never its first: palettes repeat across
 * outfits, so two different looks would otherwise carry the same title.
 */
export function paletteName(palette: SanzoPalette | null): string | null {
  if (!palette) return null;
  const names = palette.colores
    .map(nameOf)
    .filter((n): n is string => n !== null)
    // Two names is what fits a column of the grid; a third only ever
    // arrives as an ellipsis.
    .slice(0, 2);
  return names.length > 0 ? names.join(" · ") : palette.nombre;
}

/** Tiled photo composite: the outfit's own garments, not swatches/icons. */
export function OutfitCollage({
  garments,
  className,
  thumb = true,
  sizes,
  max = 3,
}: {
  garments: GarmentWithColors[];
  className?: string;
  thumb?: boolean;
  sizes?: string;
  /** Past this the collage reads as a wall of thumbnails rather than a
   * look. The calendar raises it: a day is the whole outfit plus what you
   * wore it with, and hiding half of it behind a "+2" defeats the point. */
  max?: number;
}) {
  if (garments.length === 0) {
    return <div className={`bg-surface ${className ?? ""}`} />;
  }
  if (garments.length === 1) {
    return (
      <PieceThumb garment={garments[0]} thumb={thumb} sizes={sizes} className={className} />
    );
  }
  const shown = garments.slice(0, max);
  const hidden = garments.length - shown.length;
  // Two columns up to four pieces, three beyond that, so the tiles stay
  // as square as the frame allows instead of turning into slivers.
  const cols = shown.length > 4 ? "grid-cols-3" : "grid-cols-2";
  const rows = shown.length > 2 ? "grid-rows-2" : "";
  return (
    <div className={`relative ${className ?? ""}`}>
      <div className={`grid h-full w-full gap-0.5 ${cols} ${rows}`}>
        {shown.map((g, i) => (
          <PieceThumb
            key={g.id}
            garment={g}
            thumb={thumb}
            sizes={sizes}
            className={`h-full w-full ${shown.length === 3 && i === 0 ? "row-span-2" : ""}`}
          />
        ))}
      </div>
      {hidden > 0 && (
        <span className="absolute bottom-1.5 right-1.5 type-caption bg-elevated px-1.5 py-0.5">
          +{hidden}
        </span>
      )}
    </div>
  );
}

/** One caption laid over the photograph. Never more than two at a time
 * (one per corner) — the photograph is the content. */
function Mark({
  children,
  position,
}: {
  children: React.ReactNode;
  position: "top-left" | "bottom-left";
}) {
  return (
    <span
      className={`absolute ${
        position === "top-left" ? "top-2 left-2" : "bottom-2 left-2"
      } type-caption whitespace-nowrap bg-elevated px-1.5 py-0.5`}
    >
      {children}
    </span>
  );
}

const TILE_SIZES = "(min-width: 1280px) 12vw, (min-width: 1024px) 15vw, (min-width: 640px) 22vw, 45vw";

/**
 * The one card for a saved outfit, shared by Desats, Què em poso and the
 * calendar's day picker. Title is the palette, subtitle is the clothes,
 * and the only overlays are the ones that change what you can do today.
 */
export function OutfitTile({
  outfit,
  palette,
  index,
  mark,
  onOpen,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  index: number;
  /** Caption over the top-left corner: whose day this outfit already is
   * ("avui" in the collection, "planificat" in the week). */
  mark?: string | null;
  onOpen: () => void;
}) {
  const t = useTranslations("labels");
  const tOutfits = useTranslations("outfits");

  // The clothes name the outfit: they are what tells two looks apart at a
  // glance, and with subtypes they read as a garment rail ("polo · vaquers")
  // rather than as a taxonomy.
  const title = outfitSubtitle(t, outfit) || outfit.name || "";

  // Which piece is missing is a detail for the sheet: spelled out here it
  // wrapped the caption onto two lines over the photograph.
  const stateMark = isWearable(outfit) ? null : tOutfits("inBasket");

  return (
    <Card
      as="button"
      type="button"
      interactive="clickable"
      onClick={onOpen}
      data-testid="saved-outfit-card"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0">
        <OutfitCollage
          garments={outfit.garments}
          sizes={TILE_SIZES}
          className="h-full w-full"
        />
        {mark && <Mark position="top-left">{mark}</Mark>}
        {stateMark && <Mark position="bottom-left">{stateMark}</Mark>}
      </div>
      <div className="flex items-baseline justify-between gap-2 pt-3">
        <Text as="span" className="font-serif lowercase leading-tight line-clamp-2">
          {title}
        </Text>
        <Text variant="caption" tabular className="flex-shrink-0">
          n{String(index + 1).padStart(3, "0")}
        </Text>
      </div>
      {/* The harmony this outfit was built on, as itself. It used to be
          its name in italics, which is a paint chip described in words. */}
      {palette && (
        <div
          aria-hidden
          className="mt-2 flex h-1 w-full overflow-hidden"
          title={palette.nombre}
        >
          {palette.colores.map((hex, i) => (
            <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
          ))}
        </div>
      )}
    </Card>
  );
}
