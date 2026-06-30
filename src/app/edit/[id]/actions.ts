"use server";

import { redirect } from "next/navigation";
import { editPrenda } from "@/lib/prendas/service";
import type { Categoria, Dibujo, Fit, Textura } from "@/lib/prendas/types";

export async function updatePrendaAction(id: string, formData: FormData) {
  const categoria = formData.get("categoria") as Categoria;
  const textura = formData.get("textura") as Textura;
  const dibujo = formData.get("dibujo") as Dibujo;
  const fit = formData.get("fit") as Fit;
  const talla = formData.get("talla") as string;
  const nota = formData.get("nota") as string | null;
  const temporada = formData.getAll("temporada") as string[];
  const hexColores = formData.getAll("color") as string[];

  if (!categoria || !textura || !dibujo || !fit || !talla || temporada.length === 0 || hexColores.length === 0) {
    throw new Error("Camps obligatoris buits");
  }

  await editPrenda(id, {
    categoria,
    textura,
    dibujo,
    fit,
    talla,
    nota: nota || undefined,
    temporada,
    hexColores,
  });

  redirect("/armari");
}
