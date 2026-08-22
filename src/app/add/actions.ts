"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addGarment } from "@/lib/prendas/service";
import { validateGarmentForm } from "@/lib/prendas/validation";
import type { ValidationError } from "@/lib/prendas/validation";

export type ActionState = { error: ValidationError } | { newId: string } | null;

export async function createGarmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = validateGarmentForm(formData);
  if (!result.ok) return { error: result.error };

  const garment = await addGarment(result.data);

  revalidatePath("/armari");
  revalidatePath("/stats");
  revalidatePath("/settings");

  if (formData.get("_hasImage") === "1") {
    return { newId: garment.id };
  }
  redirect("/armari");
}
