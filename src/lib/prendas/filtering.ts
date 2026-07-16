import type { GarmentWithColors, Category, Texture, Season } from "./types";

export interface GarmentFilters {
  categories: Category[];
  seasons: Season[];
  fits: string[];
  textures: Texture[];
  lengths: string[];
  query: string;
}

export function filterGarments(
  garments: GarmentWithColors[],
  filters: GarmentFilters
): GarmentWithColors[] {
  const { categories, seasons, fits, textures, lengths, query } = filters;
  const q = query.toLowerCase().trim();

  return garments.filter((g) => {
    if (categories.length > 0 && !categories.includes(g.category)) return false;
    if (fits.length > 0 && !fits.includes(g.fit)) return false;
    if (textures.length > 0 && !textures.includes(g.texture)) return false;
    if (lengths.length > 0 && (!g.length || !lengths.includes(g.length))) return false;

    if (seasons.length > 0) {
      const garmentSeasons = g.seasons.map((s) => s.season);
      const passesSeason =
        garmentSeasons.includes("ALL_YEAR") ||
        seasons.some((s) => garmentSeasons.includes(s));
      if (!passesSeason) return false;
    }

    if (q) {
      const inNotes = g.notes?.toLowerCase().includes(q) ?? false;
      const inSize = g.size.toLowerCase().includes(q);
      if (!inNotes && !inSize) return false;
    }

    return true;
  });
}
