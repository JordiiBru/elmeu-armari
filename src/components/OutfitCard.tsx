"use client";

import type { OutfitResult } from "@/lib/outfits/types";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";

export function OutfitCard({
  result,
  onSave,
  saved,
}: {
  result: OutfitResult;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="border rounded p-4 space-y-3">
      {/* Garment pieces */}
      <div className="flex gap-2 flex-wrap">
        {result.matches.map((m) => (
          <div key={m.garment.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-6 h-6 rounded border border-gray-200"
              style={{ backgroundColor: m.garment.colors[0]?.hex ?? "#ccc" }}
              title={m.garment.colors[0]?.hex}
            />
            <span className="text-xs text-gray-600">
              {CATEGORY_LABELS[m.garment.category]}
            </span>
          </div>
        ))}
      </div>

      {/* Palette */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{result.palette.nombre}</p>
        <div className="flex gap-1">
          {result.palette.colores.map((color, i) => {
            const isMatched = !result.unmatchedColors.includes(i);
            return (
              <span
                key={i}
                className={`inline-block w-6 h-6 rounded border ${
                  isMatched ? "border-gray-400" : "border-dashed border-gray-200"
                }`}
                style={{ backgroundColor: color }}
                title={`${color}${isMatched ? " (assignat)" : " (lliure)"}`}
              />
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saved}
        className="text-xs px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saved ? "Desat" : "Desar"}
      </button>
    </div>
  );
}
