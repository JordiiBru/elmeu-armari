"use server";

import {
  saveOutfit,
  deleteOutfit,
  addOutfitExtras,
  removeOutfitExtra,
  setOutfitFavorite,
} from "@/lib/outfits/service";
import { revalidatePath } from "next/cache";

export async function saveOutfitAction(paletteId: number, garmentIds: string[]) {
  const outfit = await saveOutfit({ paletteId, garmentIds });
  revalidatePath("/armari");
  return { id: outfit.id, name: outfit.name };
}

export async function deleteOutfitAction(id: string) {
  await deleteOutfit(id);
  revalidatePath("/armari");
}

export async function addOutfitExtrasAction(outfitId: string, garmentIds: string[]) {
  await addOutfitExtras(outfitId, garmentIds);
  revalidatePath("/armari");
}

export async function removeOutfitExtraAction(outfitId: string, garmentId: string) {
  await removeOutfitExtra(outfitId, garmentId);
  revalidatePath("/armari");
}

export async function setOutfitFavoriteAction(outfitId: string, favorite: boolean) {
  await setOutfitFavorite(outfitId, favorite);
  revalidatePath("/armari");
}
