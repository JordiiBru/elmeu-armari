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

export async function addGarment(userId: string, data: GarmentInput) {
  return createGarment(userId, data);
}

export async function editGarment(userId: string, id: string, data: GarmentInput) {
  return updateGarment(userId, id, data);
}

/**
 * Ids reach the laundry screens from the client, so the washable filter
 * lives here and not only in the views: shoes and accessories must
 * never end up with a `dirtySince`, whatever the caller sends.
 */
async function washableIdsAmong(userId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await findGarmentCategories(userId, ids);
  return rows.filter((g) => WASHABLE_CATEGORIES.has(g.category)).map((g) => g.id);
}

/** Returns how many garments actually moved into the basket. */
export async function markGarmentsDirty(userId: string, ids: string[]): Promise<number> {
  const washable = await washableIdsAmong(userId, ids);
  if (washable.length === 0) return 0;
  const { count } = await setGarmentsDirtyState(userId, washable, true);
  return count;
}

export async function markGarmentsClean(userId: string, ids: string[]): Promise<number> {
  const washable = await washableIdsAmong(userId, ids);
  if (washable.length === 0) return 0;
  const { count } = await setGarmentsDirtyState(userId, washable, false);
  return count;
}
