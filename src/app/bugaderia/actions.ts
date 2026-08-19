"use server";

import { revalidatePath } from "next/cache";
import { markGarmentsDirty, markGarmentsClean } from "@/lib/prendas/service";

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
