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

/** Every garment of the outfit, primary and extra alike. */
export function garmentsOf(outfit: SavedOutfit): GarmentWithColors[] {
  return outfit.garments.map((og) => og.garment);
}

/**
 * Dirtiness is evaluated over every garment of the outfit, not only the
 * primary ones: extras happen to be non-washable today, but that is a
 * property of `WASHABLE_CATEGORIES`, not something to assume here.
 */
export function dirtyGarmentsOf(outfit: SavedOutfit): GarmentWithColors[] {
  return garmentsOf(outfit).filter(isDirty);
}

export type OutfitAvailability = "ready" | "almost" | "blocked";

/**
 * Strict: an outfit is wearable only when all of its washable pieces are
 * clean. Missing exactly one is "almost" — worth surfacing, since one
 * wash away. An outfit with no washable piece at all is trivially ready.
 */
export function outfitAvailability(outfit: SavedOutfit): {
  status: OutfitAvailability;
  blockedBy: GarmentWithColors[];
} {
  const blockedBy = dirtyGarmentsOf(outfit);
  const status: OutfitAvailability =
    blockedBy.length === 0 ? "ready" : blockedBy.length === 1 ? "almost" : "blocked";
  return { status, blockedBy };
}

/**
 * In season means *every* primary piece fits the current season. Asking
 * for just one match would let a wool jumper through in August because
 * the trousers are all-year.
 */
export function isInSeason(outfit: SavedOutfit, season: Season): boolean {
  return outfit.garments
    .filter((og) => og.role === "primary")
    .every((og) =>
      og.garment.seasons.some((s) => s.season === season || s.season === "ALL_YEAR"),
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
