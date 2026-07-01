"use client";

import type { OutfitGroup, PaletteMatch } from "@/lib/outfits/types";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";

export function OutfitGroupCard({
  group,
  onSave,
  savedPaletteIds,
}: {
  group: OutfitGroup;
  onSave: (paletteId: number) => void;
  savedPaletteIds: Set<number>;
}) {
  return (
    <div className="border rounded p-4 space-y-4">
      {/* Garment pieces */}
      <div className="flex gap-3 flex-wrap">
        {group.garments.map((g) => (
          <div key={g.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-7 h-7 rounded border border-gray-200"
              style={{ backgroundColor: g.colors[0]?.hex ?? "#ccc" }}
              title={g.colors[0]?.hex}
            />
            <span className="text-sm text-gray-600">
              {CATEGORY_LABELS[g.category]}
              {g.notes && (
                <span className="text-gray-400 text-xs ml-1">({g.notes})</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Matching palettes */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          {group.palettes.length} {group.palettes.length === 1 ? "paleta" : "paletes"}
        </p>
        <div className="space-y-2">
          {group.palettes.map((pm) => (
            <PaletteRow
              key={pm.palette.id}
              pm={pm}
              onSave={() => onSave(pm.palette.id)}
              saved={savedPaletteIds.has(pm.palette.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PaletteRow({
  pm,
  onSave,
  saved,
}: {
  pm: PaletteMatch;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {pm.palette.colores.map((color, i) => {
          const isMatched = !pm.unmatchedColors.includes(i);
          return (
            <span
              key={i}
              className={`inline-block w-5 h-5 rounded border ${
                isMatched ? "border-gray-400" : "border-dashed border-gray-200 opacity-50"
              }`}
              style={{ backgroundColor: color }}
              title={`${color}${isMatched ? "" : " (lliure)"}`}
            />
          );
        })}
      </div>
      <span className="text-xs text-gray-400 min-w-0 truncate">
        {pm.palette.nombre}
      </span>
      <button
        onClick={onSave}
        disabled={saved}
        className="ml-auto text-xs px-2 py-0.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {saved ? "Desat" : "Desar"}
      </button>
    </div>
  );
}
