import {
  createOutfit,
  findAllOutfits,
  findOutfitByGarmentsAndPalette,
  deleteOutfit,
  countOutfits,
} from "./repository";

export { findAllOutfits, deleteOutfit };

export async function saveOutfit(data: {
  paletteId: number;
  garmentIds: string[];
}) {
  const existing = await findOutfitByGarmentsAndPalette(data.garmentIds, data.paletteId);
  if (existing) return existing;

  const count = await countOutfits();
  const name = `Outfit #${count + 1}`;
  return createOutfit({ ...data, name });
}
