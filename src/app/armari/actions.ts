"use server";

import { revalidatePath } from "next/cache";
import { deletePrenda } from "@/lib/prendas/service";

export async function deletePrendaAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("ID requerit");
  await deletePrenda(id);
  revalidatePath("/armari");
}
