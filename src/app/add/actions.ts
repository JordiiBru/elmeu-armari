"use server";

import { redirect } from "next/navigation";
import { addGarment } from "@/lib/prendas/service";
import { validateGarmentForm } from "@/lib/prendas/validation";
import type { Season } from "@/lib/prendas/types";

export type ActionState = { error: string } | null;

export async function createGarmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = validateGarmentForm(formData);
  if (!result.ok) return { error: result.error };

  const { category, texture, pattern, fit, subtype, size, notes, seasons, hexColors } = result.data;
  await addGarment({ category, texture, pattern, fit, subtype, size, notes, seasons: seasons as Season[], hexColors });
  redirect("/armari");
}
