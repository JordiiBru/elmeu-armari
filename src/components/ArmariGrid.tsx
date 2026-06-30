"use client";

import { useState } from "react";
import Link from "next/link";
import { deletePrendaAction } from "@/app/armari/actions";
import type { PrendaConColores, Categoria } from "@/lib/prendas/types";
import { CATEGORIAS } from "@/lib/prendas/types";

const CATEGORIA_LABELS: Record<Categoria, string> = {
  JERSEI: "Jersei",
  CAMISA: "Camisa",
  PANTALONES: "Pantalons",
  CALCETINES: "Calcetins",
  ZAPATOS: "Sabates",
};

interface Props {
  prendas: PrendaConColores[];
}

export function ArmariGrid({ prendas }: Props) {
  const [filtro, setFiltro] = useState<Categoria | "TOTES">("TOTES");

  const filtered =
    filtro === "TOTES" ? prendas : prendas.filter((p) => p.categoria === filtro);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFiltro("TOTES")}
          className={`px-3 py-1 text-sm border rounded ${
            filtro === "TOTES" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          Totes
        </button>
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-3 py-1 text-sm border rounded ${
              filtro === cat ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {CATEGORIA_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Cap peça en aquesta categoria.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((prenda) => {
            const bg = prenda.colores[0]?.hex ?? "#e5e7eb";
            return (
              <div
                key={prenda.id}
                className="rounded border overflow-hidden flex flex-col"
              >
                <div
                  className="h-24"
                  style={{ backgroundColor: bg }}
                  title={prenda.colores.map((c) => c.hex).join(", ")}
                />
                <div className="p-2 flex flex-col gap-1 bg-white">
                  <span className="text-xs font-medium">
                    {CATEGORIA_LABELS[prenda.categoria]}
                  </span>
                  <span className="text-xs text-gray-500">{prenda.fit}</span>
                  <div className="flex gap-2 mt-1">
                    <Link
                      href={`/edit/${prenda.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={deletePrendaAction}>
                      <input type="hidden" name="id" value={prenda.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:underline"
                        onClick={(e) => {
                          if (!confirm("Eliminar peça?")) e.preventDefault();
                        }}
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
