"use server";

import { saveOutfit, deleteOutfit } from "@/lib/outfits/service";
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
