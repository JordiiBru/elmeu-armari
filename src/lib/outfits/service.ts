import {
  createOutfit,
  findAllOutfits,
  deleteOutfit,
  countOutfits,
} from "./repository";

export { findAllOutfits, deleteOutfit };

export async function saveOutfit(data: {
  paletteId: number;
  garmentIds: string[];
}) {
  const count = await countOutfits();
  const name = `Outfit #${count + 1}`;
  return createOutfit({ ...data, name });
}
