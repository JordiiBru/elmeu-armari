import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SavedOutfit } from "./types";

export interface OutfitsByTop {
  /** The shirt or sweater every outfit in this group is built around.
   * `null` for outfits that have neither. */
  top: GarmentWithColors | null;
  outfits: SavedOutfit[];
}

/**
 * The piece an outfit is built around. A shirt wins over a sweater
 * because that is the one you reach for first in the morning; an outfit
 * with neither has no top to be filed under.
 */
export function outfitTop(outfit: SavedOutfit): GarmentWithColors | null {
  return (
    outfit.garments.find((g) => g.category === "SHIRT") ??
    outfit.garments.find((g) => g.category === "SWEATER") ??
    null
  );
}

/**
 * Files saved outfits under the piece they are built around, so the
 * collection reads like a wardrobe rail rather than a feed: every look
 * that uses one shirt sits together, under that shirt.
 *
 * It answers the morning question directly. You pull a shirt off the
 * pile, you find it here, and everything you have ever built with it is
 * underneath.
 *
 * Groups keep the order their top first appears in, and outfits keep
 * their incoming order inside a group. Topless outfits go last: they are
 * the exception, and leading with them would bury the rail.
 */
export function groupOutfitsByTop(outfits: SavedOutfit[]): OutfitsByTop[] {
  const groups = new Map<string, OutfitsByTop>();
  const topless: SavedOutfit[] = [];

  for (const outfit of outfits) {
    const top = outfitTop(outfit);
    if (!top) {
      topless.push(outfit);
      continue;
    }
    const group = groups.get(top.id);
    if (group) group.outfits.push(outfit);
    else groups.set(top.id, { top, outfits: [outfit] });
  }

  const ordered = [...groups.values()];
  if (topless.length > 0) ordered.push({ top: null, outfits: topless });
  return ordered;
}
