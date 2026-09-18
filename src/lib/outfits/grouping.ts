import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { nameOf, namedColors } from "@/lib/colors";
import { oklchDistance } from "./color-matching";
import type { SavedOutfit } from "./types";

export interface OutfitsByPiece {
  /** The piece every outfit in this group has in common. */
  piece: GarmentWithColors;
  outfits: SavedOutfit[];
}

/**
 * Files saved outfits under one of their pieces, so the collection reads
 * like a wardrobe rail rather than a feed: every look that uses one
 * shirt sits together, under that shirt.
 *
 * It answers the morning question directly, and from whichever end you
 * happen to start it. Some days you pull a shirt off the pile; some days
 * you have decided on the trousers. Same collection, indexed twice.
 *
 * An outfit with no piece of that category simply is not in that index —
 * a look with no sweater has nothing to say to someone browsing
 * sweaters.
 *
 * The rail is ordered by the wardrobe, not by the day. It used to follow
 * whatever order the outfits arrived in, which is ranked for today and
 * therefore puts never-worn outfits first — so saving a new look made
 * its shirt leap to the top of the rail and you lost the group you were
 * standing in. Wardrobe order is stable, and it means a piece sits in
 * the same relative place here as it does in /armari.
 *
 * Outfits keep their incoming order inside a group, so a look you have
 * just saved is the first thing in the group you saved it from.
 */
export function groupOutfitsBy(
  outfits: SavedOutfit[],
  category: Category,
): OutfitsByPiece[] {
  const groups = new Map<string, OutfitsByPiece>();

  for (const outfit of outfits) {
    const piece = outfit.garments.find((g) => g.category === category);
    if (!piece) continue;
    const group = groups.get(piece.id);
    if (group) group.outfits.push(outfit);
    else groups.set(piece.id, { piece, outfits: [outfit] });
  }

  const byPiece = new Map([...groups.values()].map((g) => [g.piece.id, g]));
  return sortByWardrobeOrder([...byPiece.values()].map((g) => g.piece)).map(
    (piece) => byPiece.get(piece.id)!,
  );
}

/** The nearest Sanzo Wada historic name for a hex — same lookup the
 * collage captions use, duplicated in this pure lib module rather than
 * imported from a "use client" component so this stays importable from a
 * plain Node test. */
const nearestNameCache = new Map<string, string>();
function nearestColorName(hex: string): string {
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

export interface OutfitsByColor {
  colorName: string;
  outfits: SavedOutfit[];
}

/**
 * Files saved outfits by the *colour* of their piece of `category`,
 * rather than by the exact piece — two different grey trousers land in
 * the same block. This is what a filter tap in "què em poso?" groups by:
 * "pantalons" doesn't ask which trousers, it asks which colour.
 *
 * Largest block first, so filtering by a category surfaces its most
 * common colour rather than whichever piece happened to be added first.
 */
export function groupOutfitsByColor(
  outfits: SavedOutfit[],
  category: Category,
): OutfitsByColor[] {
  const groups = new Map<string, SavedOutfit[]>();

  for (const outfit of outfits) {
    const piece = outfit.garments.find((g) => g.category === category);
    const hex = piece?.colors[0]?.hex;
    if (!hex) continue;
    const colorName = nearestColorName(hex);
    const existing = groups.get(colorName);
    if (existing) existing.push(outfit);
    else groups.set(colorName, [outfit]);
  }

  return [...groups.entries()]
    .map(([colorName, groupOutfits]) => ({ colorName, outfits: groupOutfits }))
    .sort((a, b) => b.outfits.length - a.outfits.length || a.colorName.localeCompare(b.colorName));
}
