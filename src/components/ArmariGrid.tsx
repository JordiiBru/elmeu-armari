"use client";

import { useState } from "react";
import Link from "next/link";
import { deletePrendaAction } from "@/app/armari/actions";
import type { PrendaConColores, Categoria } from "@/lib/prendas/types";
import { CATEGORIAS, TEMPORADAS } from "@/lib/prendas/types";
import { CATEGORIA_LABELS, TEMPORADA_LABELS } from "@/lib/prendas/labels";

interface Props {
  prendas: PrendaConColores[];
}

const pill = (active: boolean) =>
  `px-3 py-1 text-xs border rounded-full transition-colors ${
    active ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
  }`;

export function ArmariGrid({ prendas }: Props) {
  const [filtrocat, setFiltrocat] = useState<Categoria | "TOTES">("TOTES");
  const [filtroTemp, setFiltroTemp] = useState<string>("TOTES");

  const filtered = prendas.filter((p) => {
    if (filtrocat !== "TOTES" && p.categoria !== filtrocat) return false;
    if (filtroTemp !== "TOTES") {
      try {
        const temps = JSON.parse(p.temporada) as string[];
        if (!temps.includes(filtroTemp)) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  return (
    <div>
      {/* Filtre categoria */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => setFiltrocat("TOTES")} className={pill(filtrocat === "TOTES")}>
          Totes
        </button>
        {CATEGORIAS.map((cat) => (
          <button type="button" key={cat} onClick={() => setFiltrocat(cat)} className={pill(filtrocat === cat)}>
            {CATEGORIA_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Filtre temporada */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button type="button" onClick={() => setFiltroTemp("TOTES")} className={pill(filtroTemp === "TOTES")}>
          Tot l'any
        </button>
        {TEMPORADAS.map((t) => (
          <button type="button" key={t} onClick={() => setFiltroTemp(t)} className={pill(filtroTemp === t)}>
            {TEMPORADA_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">Cap peça amb aquests filtres.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((prenda) => (
            <div key={prenda.id} className="rounded-lg border overflow-hidden flex flex-col">
              {/* Colors */}
              <div className="flex h-24">
                {prenda.colores.map((c) => (
                  <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
                ))}
              </div>

              {/* Info */}
              <div className="p-2 flex flex-col gap-0.5 bg-white">
                <span className="text-xs font-medium">{CATEGORIA_LABELS[prenda.categoria]}</span>
                <span className="text-xs text-gray-500">{prenda.fit} · {prenda.talla}</span>
                {prenda.nota && (
                  <span className="text-xs text-gray-400 truncate">{prenda.nota}</span>
                )}
                <div className="flex gap-2 mt-1">
                  <Link href={`/edit/${prenda.id}`} className="text-xs text-blue-600 hover:underline">
                    Editar
                  </Link>
                  <form action={deletePrendaAction}>
                    <input type="hidden" name="id" value={prenda.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                      onClick={(e) => { if (!confirm("Eliminar peça?")) e.preventDefault(); }}
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
