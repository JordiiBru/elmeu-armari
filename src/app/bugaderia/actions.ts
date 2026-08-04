"use server";

import { revalidatePath } from "next/cache";
import { markGarmentsDirty, markGarmentsClean } from "@/lib/prendas/service";
import { assignOutfitToDay, findSavedOutfitById } from "@/lib/outfits/service";
import { washableGarmentsOf } from "@/lib/bugaderia/laundry";

export async function markDirtyAction(garmentIds: string[]): Promise<{ affected: number }> {
  const affected = await markGarmentsDirty(garmentIds);
  revalidatePath("/bugaderia");
  revalidatePath("/armari");
  return { affected };
}

export async function markCleanAction(garmentIds: string[]): Promise<{ affected: number }> {
  const affected = await markGarmentsClean(garmentIds);
  revalidatePath("/bugaderia");
  revalidatePath("/armari");
  return { affected };
}

/**
 * Wearing an outfit is one decision, so it is one action: today's calendar
 * slot gets the outfit and its washable pieces go to the basket.
 */
export async function wearOutfitTodayAction(outfitId: string): Promise<{ dirtied: number }> {
  const outfit = await findSavedOutfitById(outfitId);
  if (!outfit) throw new Error(`Outfit not found: ${outfitId}`);

  await assignOutfitToDay(outfitId, new Date());
  const dirtied = await markGarmentsDirty(washableGarmentsOf(outfit).map((g) => g.id));

  revalidatePath("/bugaderia");
  revalidatePath("/bugaderia/avui");
  revalidatePath("/armari");
  revalidatePath("/calendari");
  return { dirtied };
}
