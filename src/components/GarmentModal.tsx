"use client";

import { useEffect } from "react";
import Link from "next/link";
import { deleteGarmentAction } from "@/app/armari/actions";
import { parseSeasons } from "@/lib/prendas/service";
import type { GarmentWithColors } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SEASON_LABELS,
} from "@/lib/prendas/labels";

interface Props {
  garment: GarmentWithColors;
  onClose: () => void;
}

export function GarmentModal({ garment, onClose }: Props) {
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

  const seasons = parseSeasons(garment.season);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex h-20 flex-shrink-0">
          {garment.colors.map((c) => (
            <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
          ))}
        </div>

        <div className="overflow-y-auto overscroll-contain p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{CATEGORY_LABELS[garment.category]}</h2>
              <p className="text-sm text-gray-500">
                {FIT_LABELS[garment.fit]} · Talla {garment.size}
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

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Textura</span>
              {TEXTURE_LABELS[garment.texture]}
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Dibuix</span>
              {PATTERN_LABELS[garment.pattern]}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-400 block mb-1.5">Colors</span>
            <div className="flex flex-wrap gap-2">
              {garment.colors.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded border border-black/10" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs font-mono text-gray-600">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {seasons.length > 0 && (
            <div>
              <span className="text-xs text-gray-400 block mb-1.5">Temporada</span>
              <div className="flex flex-wrap gap-1.5">
                {seasons.map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full">
                    {SEASON_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {garment.notes && (
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Nota</span>
              <p className="text-sm text-gray-700">{garment.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1 pb-2">
            <Link
              href={`/edit/${garment.id}`}
              className="flex-1 h-9 flex items-center justify-center text-sm border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </Link>
            <form action={deleteGarmentAction} className="flex-1">
              <input type="hidden" name="id" value={garment.id} />
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
