import {
  findAllGarments,
  findGarmentById,
  findGarmentByIdSuffix,
  createGarment,
  updateGarment,
  deleteGarment,
  setGarmentImage,
  findGarmentCategories,
  setGarmentsDirtyState,
} from "./repository";
import type { GarmentInput } from "./types";
import { WASHABLE_CATEGORIES } from "./types";

export {
  findAllGarments,
  findGarmentById,
  findGarmentByIdSuffix,
  findGarmentCategories,
  deleteGarment,
  setGarmentImage,
};

export async function addGarment(data: GarmentInput) {
  return createGarment(data);
}

export async function editGarment(id: string, data: GarmentInput) {
  return updateGarment(id, data);
}

/**
 * Ids reach the laundry screens from the client, so the washable filter
 * lives here and not only in the views: shoes, socks and accessories must
 * never end up with a `dirtySince`, whatever the caller sends.
 */
async function washableIdsAmong(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await findGarmentCategories(ids);
  return rows.filter((g) => WASHABLE_CATEGORIES.has(g.category)).map((g) => g.id);
}

/** Returns how many garments actually moved into the basket. */
export async function markGarmentsDirty(ids: string[]): Promise<number> {
  const washable = await washableIdsAmong(ids);
  if (washable.length === 0) return 0;
  const { count } = await setGarmentsDirtyState(washable, true);
  return count;
}

export async function markGarmentsClean(ids: string[]): Promise<number> {
  const washable = await washableIdsAmong(ids);
  if (washable.length === 0) return 0;
  const { count } = await setGarmentsDirtyState(washable, false);
  return count;
}
