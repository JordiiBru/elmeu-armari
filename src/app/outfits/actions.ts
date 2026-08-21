"use server";

import {
  saveOutfit,
  deleteOutfit,
  wearOutfit,
  unassignDay,
} from "@/lib/outfits/service";
import { revalidatePath } from "next/cache";

export async function saveOutfitAction(paletteId: number, garmentIds: string[]) {
  const outfit = await saveOutfit({ paletteId, garmentIds });
  revalidatePath("/avui");
  return { id: outfit.id, name: outfit.name };
}

export async function deleteOutfitAction(id: string) {
  await deleteOutfit(id);
  revalidatePath("/avui");
}

/**
 * Committing a day: the outfit plus the shoes and accessories you wear it
 * with. Lives here rather than next to a route because the three strata
 * of "què em poso?" (the day's plate, the week, the collection) all call
 * it, and so does the piece grid's laundry badge.
 *
 * It does not dirty anything yet: reconsidering same-day, before you've
 * actually left the house, shouldn't soil clothes you never wore.
 * Dirtying happens once the day has passed, lazily, via
 * `settlePastWornEvents` (see `src/app/bugaderia/layout.tsx`).
 */
export async function wearOutfitAction(
  outfitId: string,
  dayISO: string,
  extraIds: string[],
): Promise<void> {
  await wearOutfit(outfitId, new Date(dayISO), extraIds);

  revalidatePath("/bugaderia");
  revalidatePath("/avui");
  revalidatePath("/armari");
}

export async function unassignDayAction(dayISO: string) {
  await unassignDay(new Date(dayISO));
  revalidatePath("/avui");
}
