"use server";

import { revalidatePath } from "next/cache";
import { markGarmentsDirty, markGarmentsClean } from "@/lib/prendas/service";

/**
 * "layout", not the default page scope: the picker stays open after
 * marking, so both piles and the layout that settles worn events have to
 * be refreshed, not just the current render. Without it the grid you are
 * looking at keeps the pieces you just marked.
 * /avui reads the same clean/dirty state to decide what you can wear.
 */
function revalidateLaundry() {
  revalidatePath("/bugaderia", "layout");
  revalidatePath("/armari");
  revalidatePath("/avui");
}

export async function markDirtyAction(garmentIds: string[]): Promise<{ affected: number }> {
  const affected = await markGarmentsDirty(garmentIds);
  revalidateLaundry();
  return { affected };
}

export async function markCleanAction(garmentIds: string[]): Promise<{ affected: number }> {
  const affected = await markGarmentsClean(garmentIds);
  revalidateLaundry();
  return { affected };
}
