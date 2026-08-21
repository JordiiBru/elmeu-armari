import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
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
