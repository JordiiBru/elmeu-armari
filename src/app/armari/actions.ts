"use server";

import { revalidatePath } from "next/cache";
import { deleteGarment } from "@/lib/prendas/service";
import { deleteUploadImage } from "@/lib/uploads";

export async function deleteGarmentAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("ID required");
  await deleteGarment(id);
  await deleteUploadImage(id);
  revalidatePath("/armari");
  revalidatePath("/stats");
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/avui");
}
