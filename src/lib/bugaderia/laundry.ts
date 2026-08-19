import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { WASHABLE_CATEGORIES } from "@/lib/prendas/types";
import type { SavedOutfit } from "@/lib/outfits/types";
import { wornRank } from "@/lib/outfits/worn";

/** Shoes, socks and accessories never go to the basket. */
export function isWashable(garment: GarmentWithColors): boolean {
  return WASHABLE_CATEGORIES.has(garment.category);
}

/**
 * A non-washable garment is always clean, even if a stale `dirtySince`
 * survived a category change — the category is the authority, not the
 * timestamp.
 */
export function isDirty(garment: GarmentWithColors): boolean {
  return isWashable(garment) && garment.dirtySince !== null;
}

export function isClean(garment: GarmentWithColors): boolean {
  return !isDirty(garment);
}

/** An outfit is clothes only, so this is all of it. */
export function garmentsOf(outfit: SavedOutfit): GarmentWithColors[] {
  return outfit.garments;
}

/** An outfit is blocked only by its own clothes — the shoes and
 * accessories you wear it with belong to the day, not to the outfit. */
export function dirtyGarmentsOf(outfit: SavedOutfit): GarmentWithColors[] {
  return garmentsOf(outfit).filter(isDirty);
}

/**
 * Available or not, nothing in between. There used to be a middle state
 * for "one wash away", but a state that is neither wearable nor
 * unwearable only ever raised the question of what it meant.
 */
export function isWearable(outfit: SavedOutfit): boolean {
  return dirtyGarmentsOf(outfit).length === 0;
}

/**
 * In season means *every* piece fits the current season. Asking for just
 * one match would let a wool jumper through in August because the
 * trousers are all-year.
 */
export function isInSeason(outfit: SavedOutfit, season: Season): boolean {
  return outfit.garments.every((g) =>
    g.seasons.some((s) => s.season === season || s.season === "ALL_YEAR"),
  );
}

/**
 * Season first, then least recently worn (never worn wins). `sort` is
 * stable, so outfits tied on both keep their incoming order.
 */
export function rankOutfitsForToday(outfits: SavedOutfit[], season: Season): SavedOutfit[] {
  return [...outfits].sort((a, b) => {
    const seasonalA = isInSeason(a, season);
    const seasonalB = isInSeason(b, season);
    if (seasonalA !== seasonalB) return seasonalA ? -1 : 1;
    const rankA = wornRank(a.wornEvents);
    const rankB = wornRank(b.wornEvents);
    // Compared, not subtracted: two never-worn outfits are both -Infinity
    // and the difference would be NaN.
    if (rankA === rankB) return 0;
    return rankA < rankB ? -1 : 1;
  });
}
