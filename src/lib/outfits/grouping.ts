import type { Category, GarmentWithColors } from "@/lib/prendas/types";
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
 * sweaters. Groups keep the order their piece first appears in, and
 * outfits keep their incoming order inside a group.
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

  return [...groups.values()];
}
