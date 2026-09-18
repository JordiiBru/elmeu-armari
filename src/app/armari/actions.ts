"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SweaterMode } from "@/generated/prisma/enums";
import { deleteGarment } from "@/lib/prendas/service";
import { setSweaterMode } from "@/lib/auth/service";
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

export async function setSweaterModeAction(mode: SweaterMode) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await setSweaterMode(session.user.id, mode);
  revalidatePath("/armari");
}
