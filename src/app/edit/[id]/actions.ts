"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { editGarment } from "@/lib/prendas/service";
import { validateGarmentForm } from "@/lib/prendas/validation";

export type ActionState = { error: string } | null;

export async function updateGarmentAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = validateGarmentForm(formData);
  if (!result.ok) return { error: result.error };

  await editGarment(id, result.data);

  revalidatePath("/armari");
  revalidatePath("/stats");
  revalidatePath("/settings");

  redirect("/armari");
}
