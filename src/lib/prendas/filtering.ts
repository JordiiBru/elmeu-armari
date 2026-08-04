import type { GarmentWithColors, Category, Texture, Season } from "./types";
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

export function filterGarments(
  garments: GarmentWithColors[],
  filters: GarmentFilters
): GarmentWithColors[] {
  const { categories, seasons, fits, textures, lengths, colors, states, query } = filters;
  const q = query.toLowerCase().trim();

  return garments.filter((g) => {
    if (categories.length > 0 && !categories.includes(g.category)) return false;
    if (fits.length > 0 && (!g.fit || !fits.includes(g.fit))) return false;
    if (textures.length > 0 && (!g.texture || !textures.includes(g.texture))) return false;
    if (lengths.length > 0 && (!g.length || !lengths.includes(g.length))) return false;
    if (states.length > 0 && !states.includes(isDirty(g) ? "dirty" : "clean")) return false;

    if (seasons.length > 0) {
      const garmentSeasons = g.seasons.map((s) => s.season);
      const passesSeason =
        garmentSeasons.includes("ALL_YEAR") ||
        seasons.some((s) => garmentSeasons.includes(s));
      if (!passesSeason) return false;
    }

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
}
