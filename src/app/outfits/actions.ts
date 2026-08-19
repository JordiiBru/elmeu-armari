"use server";

import {
  saveOutfit,
  deleteOutfit,
  setOutfitFavorite,
  wearOutfit,
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

export async function setOutfitFavoriteAction(outfitId: string, favorite: boolean) {
  await setOutfitFavorite(outfitId, favorite);
  revalidatePath("/armari");
}

/**
 * Committing a day: the outfit plus the shoes and accessories you wear it
 * with. Lives here rather than next to a route because all three surfaces
 * that can decide a day (Desats, Què em poso, the calendar) call it, so
 * the revalidation list is the union of theirs.
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
  revalidatePath("/calendari");
}

export async function unassignDayAction(dayISO: string) {
  await unassignDay(new Date(dayISO));
  revalidatePath("/calendari");
  revalidatePath("/armari");
}
