"use client";

import { useTranslations } from "next-intl";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { optionLabel, type LabelsTranslator } from "@/lib/prendas/labels";
import { isWearable } from "@/lib/bugaderia/laundry";
import { nameOf } from "@/lib/colors";
import { colourName } from "@/lib/colors/names";
import { PieceThumb } from "./PieceThumb";
import { Card, Icon, Text } from "@/components/ui";

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
 * What tells two pieces of the same kind apart at a glance. Every shirt
 * you own is a "samarreta"; only one of them is Salvia Blue.
 */
export function pieceTint(garment: GarmentWithColors): string | null {
  const hex = garment.colors[0]?.hex;
  return hex ? colourName(hex) : null;
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

/** One piece, whole, inside its box with a margin of the box's own
 * surface around it. */
export function BoxPiece({
  garment,
  sizes,
  thumb = true,
}: {
  garment: GarmentWithColors;
  sizes?: string;
  thumb?: boolean;
}) {
  return (
    <span className="absolute inset-[8%]">
      <PieceThumb garment={garment} thumb={thumb} sizes={sizes} fit="contain" flat className="h-full w-full" />
    </span>
  );
}

/** The accessories box: one fills it; two stand side by side; three put
 * the first one tall beside the other two; four share it two by two;
 * past four the last cell counts the rest. Every piece gets the largest
 * cell its count allows, never a quarter box beside an empty one. */
export function AccessoryGrid({ pieces, sizes = "6rem" }: { pieces: GarmentWithColors[]; sizes?: string }) {
  if (pieces.length === 0) return null;
  if (pieces.length === 1) return <BoxPiece garment={pieces[0]} sizes={sizes} />;
  const shown = pieces.length > 4 ? pieces.slice(0, 3) : pieces;
  const rest = pieces.length - shown.length;
  const layout = shown.length === 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-2 grid-rows-2";
  return (
    <div className={`absolute inset-[6%] grid gap-1 ${layout}`}>
      {shown.map((g, i) => (
        <PieceThumb
          key={g.id}
          garment={g}
          thumb
          sizes={sizes}
          fit="contain"
          flat
          className={`h-full min-h-0 w-full ${shown.length === 3 && rest === 0 && i === 0 ? "row-span-2" : ""}`}
        />
      ))}
      {rest > 0 && (
        <span className="flex items-center justify-center type-caption tabular-nums text-text-secondary">+{rest}</span>
      )}
    </div>
  );
}

/** The four boxes of an outfit, in reading order. A sweater over a shirt
 * shows the sweater: it is the one on top. */
export function outfitBoxes(garments: GarmentWithColors[], accessories: GarmentWithColors[]) {
  const top =
    garments.find((g) => g.category === "SWEATER") ?? garments.find((g) => g.category === "SHIRT");
  return {
    top,
    pants: garments.find((g) => g.category === "PANTS"),
    shoes: garments.find((g) => g.category === "SHOES"),
    accessories,
  };
}

/**
 * An outfit as four boxes of one size, two by two: top, trousers, shoes,
 * accessories. The same figure the builder fills in as you pick, so a
 * saved outfit, a day in the week and the one on the stage all read
 * alike. Each piece is whole, never cropped; an empty slot is just the
 * box.
 */
export function OutfitCollage({
  garments,
  accessories = [],
  className,
  thumb = true,
  sizes,
}: {
  garments: GarmentWithColors[];
  /** Accessories (and, on a day, the coat): the fourth box. */
  accessories?: GarmentWithColors[];
  className?: string;
  thumb?: boolean;
  sizes?: string;
}) {
  const boxes = outfitBoxes(garments, accessories);
  const cell = "relative min-h-0 min-w-0 overflow-hidden bg-surface";
  return (
    <div className={`grid grid-cols-2 grid-rows-2 gap-[3px] ${className ?? ""}`}>
      {[boxes.top, boxes.pants, boxes.shoes].map((g, i) => (
        <div key={i} className={cell}>
          {g && <BoxPiece garment={g} thumb={thumb} sizes={sizes} />}
        </div>
      ))}
      <div className={cell}>
        <AccessoryGrid pieces={boxes.accessories} />
      </div>
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

const TILE_SIZES = "(min-width: 1280px) 6vw, (min-width: 1024px) 8vw, (min-width: 640px) 11vw, 22vw";

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
  onToggleFavorite,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  index: number;
  /** Caption over the top-left corner: whose day this outfit already is
   * ("avui" in the collection, "planificat" in the week). */
  mark?: string | null;
  onOpen: () => void;
  /** Present only where curating the favourites list makes sense — the
   * calendar's day picker, for one, is choosing an outfit, not pruning
   * the collection, so it never passes this. */
  onToggleFavorite?: () => void;
}) {
  const favorite = outfit.favorite;
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
    // The favourite toggle is a real <button>, and HTML forbids nesting
    // one interactive control inside another (<button> in <button> is a
    // hydration error, not just invalid markup) — so it sits beside the
    // card's button as a sibling, positioned against this wrapper rather
    // than against the card itself.
    <div className="relative w-full">
      <Card
        as="button"
        type="button"
        interactive="clickable"
        onClick={onOpen}
        data-testid="saved-outfit-card"
        className="w-full"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0">
          <OutfitCollage
            garments={outfit.garments}
            accessories={outfit.accessories}
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
            className="mt-2 flex h-2 w-full overflow-hidden"
            title={palette.nombre}
          >
            {palette.colores.map((hex, i) => (
              <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
            ))}
          </div>
        )}
      </Card>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? tOutfits("unfavorite") : tOutfits("favorite")}
          aria-pressed={favorite}
          className="absolute top-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-text-primary"
        >
          {/* The tap target is the full 44px corner; the visual chip
              inside it stays the same small badge size as `Mark`, so the
              photograph is still what the eye reads. */}
          <span className="inline-flex bg-elevated p-1.5 transition-transform active:scale-90">
            <Icon name="star" size={14} className={favorite ? "fill-current" : ""} />
          </span>
        </button>
      )}
    </div>
  );
}
