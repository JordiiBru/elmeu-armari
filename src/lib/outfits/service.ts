import {
  createOutfit,
  findAllOutfits,
  findOutfitByGarmentsAndPalette,
  deleteOutfit,
  countOutfits,
  addOutfitExtras,
  removeOutfitExtra,
  setOutfitFavorite,
  logWornEvent,
  undoLastWornEvent,
} from "./repository";
import { palettes } from "@/lib/colors";

export {
  findAllOutfits,
  deleteOutfit,
  addOutfitExtras,
  removeOutfitExtra,
  setOutfitFavorite,
  logWornEvent,
  undoLastWornEvent,
};

// Outfit.paletteId is an unchecked FK into sanzo-wada.json (no Palette
// table), so writes must validate it here or orphan palettes slip in.
const VALID_PALETTE_IDS = new Set(palettes.map((p) => p.id));

export async function saveOutfit(data: {
  paletteId: number;
  garmentIds: string[];
}) {
  if (!VALID_PALETTE_IDS.has(data.paletteId)) {
    throw new Error(`Unknown paletteId: ${data.paletteId}`);
  }

  const existing = await findOutfitByGarmentsAndPalette(data.garmentIds, data.paletteId);
  if (existing) return existing;

  const count = await countOutfits();
  const name = `Outfit #${count + 1}`;
  return createOutfit({ ...data, name });
}
