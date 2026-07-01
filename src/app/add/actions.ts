"use server";

import { redirect } from "next/navigation";
import { addPrenda } from "@/lib/prendas/service";
import type { Categoria, Dibujo, Fit, Textura } from "@/lib/prendas/types";

export type ActionState = { error: string } | null;

export async function createPrendaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const categoria = formData.get("categoria") as Categoria;
  const textura = formData.get("textura") as Textura;
  const dibujo = formData.get("dibujo") as Dibujo;
  const fit = formData.get("fit") as Fit;
  const talla = (formData.get("talla") as string)?.trim();
  const nota = formData.get("nota") as string | null;
  const temporada = formData.getAll("temporada") as string[];
  const hexColores = formData.getAll("color") as string[];

  if (!categoria || !textura || !dibujo || !fit || !talla) {
    return { error: "Omple tots els camps marcats amb *" };
  }
  if (temporada.length === 0) {
    return { error: "Selecciona almenys una temporada" };
  }
  if (hexColores.length === 0) {
    return { error: "Afegeix almenys un color" };
  }

  await addPrenda({ categoria, textura, dibujo, fit, talla, nota: nota || undefined, temporada, hexColores });
  redirect("/armari");
}
