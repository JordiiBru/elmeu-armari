import {
  findAllGarments,
  findGarmentById,
  createGarment,
  updateGarment,
  deleteGarment,
} from "./repository";
import type { Category, Pattern, Fit, Texture, Season } from "./types";

export { findAllGarments, findGarmentById, deleteGarment };

export async function addGarment(data: {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  seasons: Season[];
  size: string;
  fit: Fit;
  notes?: string;
  hexColors: string[];
}) {
  return createGarment({
    ...data,
    season: JSON.stringify(data.seasons),
  });
}

export async function editGarment(
  id: string,
  data: {
    category: Category;
    texture: Texture;
    pattern: Pattern;
    seasons: Season[];
    size: string;
    fit: Fit;
    notes?: string;
    hexColors: string[];
  }
) {
  return updateGarment(id, {
    ...data,
    season: JSON.stringify(data.seasons),
  });
}

export function parseSeasons(raw: string): Season[] {
  try {
    return JSON.parse(raw) as Season[];
  } catch {
    return [];
  }
}
