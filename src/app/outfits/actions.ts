"use server";

import { saveOutfit, deleteOutfit } from "@/lib/outfits/service";
import { findGarmentById } from "@/lib/prendas/service";
import { palettes } from "@/lib/colors";
import { bestPaletteFor } from "@/lib/outfits/best-palette";
import { revalidatePath } from "next/cache";

export async function saveOutfitAction(paletteId: number, garmentIds: string[]) {
  const outfit = await saveOutfit({ paletteId, garmentIds });
  revalidatePath("/armari");
  return { id: outfit.id, name: outfit.name };
}

/** Desa un outfit muntat a l'emprovador triant la paleta Sanzo que millor
 *  hi combina automaticament. */
export async function saveProvadorOutfitAction(garmentIds: string[]) {
  const garments = await Promise.all(garmentIds.map((id) => findGarmentById(id)));
  const hexes = garments.flatMap((g) => g?.colors.map((c) => c.hex) ?? []);
  const palette = bestPaletteFor(hexes, palettes);
  const outfit = await saveOutfit({ paletteId: palette.id, garmentIds });
  revalidatePath("/armari");
  return { id: outfit.id, name: outfit.name, paletteName: palette.nombre };
}

export async function deleteOutfitAction(id: string) {
  await deleteOutfit(id);
  revalidatePath("/armari");
}
