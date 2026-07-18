import {
  findAllGarments,
  findGarmentById,
  createGarment,
  updateGarment,
  deleteGarment,
} from "./repository";
import type { GarmentInput } from "./types";

export { findAllGarments, findGarmentById, deleteGarment };

export async function addGarment(data: GarmentInput) {
  return createGarment(data);
}

export async function editGarment(id: string, data: GarmentInput) {
  return updateGarment(id, data);
}
