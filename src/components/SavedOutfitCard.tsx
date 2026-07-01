"use client";

import { useTransition } from "react";
import { deleteOutfitAction } from "@/app/outfits/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import type { SanzoPalette } from "@/lib/outfits/types";

interface SavedOutfit {
  id: string;
  name: string | null;
  paletteId: number;
  createdAt: Date;
  garments: {
    id: string;
    garment: {
      id: string;
      category: string;
      colors: { id: string; hex: string }[];
    };
  }[];
}

export function SavedOutfitCard({
  outfit,
  palette,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
}) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOutfitAction(outfit.id);
    });
  };

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{outfit.name ?? "Outfit"}</p>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {pending ? "Eliminant..." : "Eliminar"}
        </button>
      </div>

      {/* Garment pieces */}
      <div className="flex gap-2 flex-wrap">
        {outfit.garments.map((og) => (
          <div key={og.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-6 h-6 rounded border border-gray-200"
              style={{ backgroundColor: og.garment.colors[0]?.hex ?? "#ccc" }}
            />
            <span className="text-xs text-gray-600">
              {CATEGORY_LABELS[og.garment.category as keyof typeof CATEGORY_LABELS]}
            </span>
          </div>
        ))}
      </div>

      {/* Palette */}
      {palette && (
        <div>
          <p className="text-xs text-gray-400 mb-1">{palette.nombre}</p>
          <div className="flex gap-1">
            {palette.colores.map((color, i) => (
              <span
                key={i}
                className="inline-block w-6 h-6 rounded border border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
