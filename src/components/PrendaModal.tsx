"use client";

import { useEffect } from "react";
import Link from "next/link";
import { deletePrendaAction } from "@/app/armari/actions";
import type { PrendaConColores } from "@/lib/prendas/types";
import type { Temporada } from "@/lib/prendas/types";
import {
  CATEGORIA_LABELS,
  TEXTURA_LABELS,
  DIBUJO_LABELS,
  FIT_LABELS,
  TEMPORADA_LABELS,
} from "@/lib/prendas/labels";

interface Props {
  prenda: PrendaConColores;
  onClose: () => void;
}

export function PrendaModal({ prenda, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  let temporades: string[] = [];
  try {
    temporades = JSON.parse(prenda.temporada);
  } catch {}

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel: bottom sheet on mobile, centered modal on desktop */}
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        {/* Color strip */}
        <div className="flex h-20 flex-shrink-0">
          {prenda.colores.map((c) => (
            <div
              key={c.id}
              className="flex-1"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">
                {CATEGORIA_LABELS[prenda.categoria]}
              </h2>
              <p className="text-sm text-gray-500">
                {FIT_LABELS[prenda.fit]} · Talla {prenda.talla}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0"
              aria-label="Tancar"
            >
              ×
            </button>
          </div>

          {/* Atributs */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Textura</span>
              {TEXTURA_LABELS[prenda.textura]}
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Dibuix</span>
              {DIBUJO_LABELS[prenda.dibujo]}
            </div>
          </div>

          {/* Colors */}
          <div>
            <span className="text-xs text-gray-400 block mb-1.5">Colors</span>
            <div className="flex flex-wrap gap-2">
              {prenda.colores.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-mono text-gray-600">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temporada */}
          {temporades.length > 0 && (
            <div>
              <span className="text-xs text-gray-400 block mb-1.5">Temporada</span>
              <div className="flex flex-wrap gap-1.5">
                {temporades.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 bg-gray-100 rounded-full"
                  >
                    {TEMPORADA_LABELS[t as Temporada] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nota */}
          {prenda.nota && (
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Nota</span>
              <p className="text-sm text-gray-700">{prenda.nota}</p>
            </div>
          )}

          {/* Accions */}
          <div className="flex gap-2 pt-1 pb-2">
            <Link
              href={`/edit/${prenda.id}`}
              className="flex-1 h-9 flex items-center justify-center text-sm border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </Link>
            <form action={deletePrendaAction} className="flex-1">
              <input type="hidden" name="id" value={prenda.id} />
              <button
                type="submit"
                className="w-full h-9 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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
    </div>
  );
}
