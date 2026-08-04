"use server";

import { revalidatePath } from "next/cache";
import { markGarmentsDirty, markGarmentsClean } from "@/lib/prendas/service";
import { assignOutfitToDay, findSavedOutfitById } from "@/lib/outfits/service";

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
 * Wearing an outfit only assigns it to today — it does not dirty
 * anything yet. Reconsidering same-day and picking a different outfit
 * before you've actually left the house shouldn't soil clothes you
 * never wore; dirtying happens once this day has passed, lazily, via
 * `settlePastWornEvents` (see `src/app/bugaderia/layout.tsx`).
 */
export async function wearOutfitTodayAction(outfitId: string): Promise<void> {
  const outfit = await findSavedOutfitById(outfitId);
  if (!outfit) throw new Error(`Outfit not found: ${outfitId}`);

  await assignOutfitToDay(outfitId, new Date());

  revalidatePath("/bugaderia");
  revalidatePath("/bugaderia/avui");
  revalidatePath("/armari");
  revalidatePath("/calendari");
}
