import type { GarmentWithColors, Category, Fit, Texture } from "./types";
import { parseSeasons } from "./service";

export interface GarmentFilters {
  categories: Category[];
  seasons: string[];
  fits: Fit[];
  textures: Texture[];
  query: string;
}

export function filterGarments(
  garments: GarmentWithColors[],
  filters: GarmentFilters
): GarmentWithColors[] {
  const { categories, seasons, fits, textures, query } = filters;
  const q = query.toLowerCase().trim();

  return garments.filter((g) => {
    if (categories.length > 0 && !categories.includes(g.category)) return false;
    if (fits.length > 0 && !fits.includes(g.fit)) return false;
    if (textures.length > 0 && !textures.includes(g.texture)) return false;

    if (seasons.length > 0) {
      const garmentSeasons = parseSeasons(g.season);
      if (!seasons.some((s) => garmentSeasons.includes(s as never))) return false;
    }

    if (q) {
      const inNotes = g.notes?.toLowerCase().includes(q) ?? false;
      const inSize = g.size.toLowerCase().includes(q);
      if (!inNotes && !inSize) return false;
    }

    return true;
  });
}
