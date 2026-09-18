import type { GarmentWithColors, Category, Texture, Season } from "./types";
import { CATEGORIES, SUBTYPES_BY_CATEGORY } from "./types";
import { perceptualDistance, OKLCH_DISTANCE_THRESHOLD } from "@/lib/outfits/color-matching";
import { isDirty } from "@/lib/bugaderia/laundry";

export type GarmentState = "clean" | "dirty";

export interface GarmentFilters {
  categories: Category[];
  seasons: Season[];
  fits: string[];
  textures: Texture[];
  lengths: string[];
  colors: string[];
  states: GarmentState[];
  query: string;
}

function matchesSeason(g: GarmentWithColors, seasons: Season[]): boolean {
  const garmentSeasons = g.seasons.map((s) => s.season);
  return garmentSeasons.includes("ALL_YEAR") || seasons.some((s) => garmentSeasons.includes(s));
}

// Shorts are summer-only by definition — there's no autumn/winter reading
// of a pair of shorts the way an all-year shirt has one. Excluding them
// outright the moment the season filter moves off summer would make them
// vanish from the wardrobe for three seasons a year, which reads as lost
// rather than seasonal. They stay visible and sink to the end instead —
// see the sort pass below.
function isSeasonExempt(g: GarmentWithColors): boolean {
  return g.category === "PANTS" && g.length === "SHORT";
}

export function filterGarments(
  garments: GarmentWithColors[],
  filters: GarmentFilters
): GarmentWithColors[] {
  const { categories, seasons, fits, textures, lengths, colors, states, query } = filters;
  const q = query.toLowerCase().trim();

  const filtered = garments.filter((g) => {
    if (categories.length > 0 && !categories.includes(g.category)) return false;
    if (fits.length > 0 && (!g.fit || !fits.includes(g.fit))) return false;
    if (textures.length > 0 && (!g.texture || !textures.includes(g.texture))) return false;
    if (lengths.length > 0 && (!g.length || !lengths.includes(g.length))) return false;
    if (states.length > 0 && !states.includes(isDirty(g) ? "dirty" : "clean")) return false;

    if (seasons.length > 0 && !matchesSeason(g, seasons) && !isSeasonExempt(g)) return false;

    if (colors.length > 0) {
      const passesColor = g.colors.some((c) =>
        colors.some((target) => perceptualDistance(c.hex, target) < OKLCH_DISTANCE_THRESHOLD)
      );
      if (!passesColor) return false;
    }

    if (q) {
      const inNotes = g.notes?.toLowerCase().includes(q) ?? false;
      const inSize = g.size?.toLowerCase().includes(q) ?? false;
      if (!inNotes && !inSize) return false;
    }

    return true;
  });

  if (seasons.length === 0) return filtered;

  // Stable partition, not a full re-sort: within "matches" and "doesn't"
  // everything keeps the order filtering already left it in.
  const inSeason = filtered.filter((g) => matchesSeason(g, seasons));
  const outOfSeason = filtered.filter((g) => !matchesSeason(g, seasons));
  return [...inSeason, ...outOfSeason];
}

/**
 * Wardrobe order: by category first, then by subtype, both in the order
 * the domain declares them rather than alphabetically — a rail goes
 * jerseis, samarretes, pantalons, not a dictionary. Creation date breaks
 * ties so the sequence never shuffles between renders.
 *
 * The laundry screen lives off this: a grid of thirty pieces in
 * insertion order is a pile, and a pile is what you are trying to sort
 * out when you open /bugaderia.
 */
export function sortByWardrobeOrder(garments: GarmentWithColors[]): GarmentWithColors[] {
  const categoryRank = new Map(CATEGORIES.map((c, i) => [c, i]));
  const subtypeRank = (g: GarmentWithColors): number => {
    if (!g.subtype) return -1;
    const i = SUBTYPES_BY_CATEGORY[g.category].indexOf(g.subtype);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  return [...garments].sort((a, b) => {
    const byCategory = (categoryRank.get(a.category) ?? 0) - (categoryRank.get(b.category) ?? 0);
    if (byCategory !== 0) return byCategory;
    const bySubtype = subtypeRank(a) - subtypeRank(b);
    if (bySubtype !== 0) return bySubtype;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
