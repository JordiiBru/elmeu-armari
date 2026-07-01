"use server";

import { revalidatePath } from "next/cache";
import { deleteGarment } from "@/lib/prendas/service";

export async function deleteGarmentAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("ID required");
  await deleteGarment(id);
  revalidatePath("/armari");
}
