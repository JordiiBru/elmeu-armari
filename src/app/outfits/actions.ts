"use server";

import {
  saveOutfit,
  deleteOutfit,
  duplicateOutfit,
  addOutfitExtras,
  removeOutfitExtra,
  setOutfitFavorite,
  assignOutfitToDay,
  unassignDay,
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
  revalidatePath("/calendari");
}

export async function duplicateOutfitAction(outfitId: string) {
  const outfit = await duplicateOutfit(outfitId);
  revalidatePath("/armari");
  return { id: outfit.id };
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

export async function assignOutfitToDayAction(outfitId: string, dayISO: string) {
  await assignOutfitToDay(outfitId, new Date(dayISO));
  revalidatePath("/calendari");
  revalidatePath("/armari");
}

export async function unassignDayAction(dayISO: string) {
  await unassignDay(new Date(dayISO));
  revalidatePath("/calendari");
  revalidatePath("/armari");
}
