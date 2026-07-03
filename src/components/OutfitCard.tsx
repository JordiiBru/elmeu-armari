"use client";

import { useState } from "react";
import type { OutfitGroup, PaletteMatch } from "@/lib/outfits/types";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import type { Category } from "@/lib/prendas/types";

const CATEGORY_ORDER: Category[] = ["SHIRT", "SWEATER", "PANTS", "SOCKS", "SHOES"];

function sortedGarments(garments: OutfitGroup["garments"]) {
  return [...garments].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category as Category);
    const bi = CATEGORY_ORDER.indexOf(b.category as Category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function OutfitGroupCard({
  group,
  onSave,
  savedPaletteIds,
}: {
  group: OutfitGroup;
  onSave: (paletteId: number) => void;
  savedPaletteIds: Set<number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const mainPalette = group.palettes[0];
  const extraPalettes = group.palettes.slice(1);
  const ordered = sortedGarments(group.garments);
  const mainSaved = savedPaletteIds.has(mainPalette.palette.id);

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Outfit hero — prendas verticals */}
      <div className="p-4 space-y-3">
        {ordered.map((g) => (
          <div key={g.id} className="flex items-center gap-3">
            <div className="flex h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
              {g.colors.map((c) => (
                <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">{CATEGORY_LABELS[g.category]}</p>
              <p className="text-xs text-gray-400">
                {FIT_LABELS[g.fit]} · {g.size}
                {g.notes && ` · ${g.notes}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Paleta principal */}
      <div className="px-4 pb-4 space-y-3 border-t pt-3">
        <PaletteHero pm={mainPalette} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(mainPalette.palette.id)}
            disabled={mainSaved}
            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
              mainSaved
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {mainSaved ? "Desat ✓" : "Desar aquest outfit"}
          </button>
          {extraPalettes.length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs px-3 py-2 border rounded-lg text-gray-500 hover:bg-gray-50 shrink-0"
            >
              {expanded ? "Menys ▴" : `+${extraPalettes.length} paletes ▾`}
            </button>
          )}
        </div>

        {expanded && (
          <div className="space-y-2 pt-1">
            {extraPalettes.map((pm) => (
              <PaletteRow
                key={pm.palette.id}
                pm={pm}
                onSave={() => onSave(pm.palette.id)}
                saved={savedPaletteIds.has(pm.palette.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaletteHero({ pm }: { pm: PaletteMatch }) {
  const allIndices = pm.palette.colores.map((_, i) => i);
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5 flex-shrink-0">
        {pm.palette.colores.map((color, i) => {
          const isMatched = !pm.unmatchedColors.includes(i);
          return (
            <span
              key={i}
              className={`inline-block w-6 h-6 rounded-full border ${
                isMatched ? "border-gray-300" : "opacity-35 border-dashed border-gray-200"
              }`}
              style={{ backgroundColor: color }}
              title={`${color}${isMatched ? "" : " (lliure)"}`}
            />
          );
        })}
      </div>
      <span className="text-sm text-gray-700 min-w-0">{pm.palette.nombre}</span>
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
    <div className="flex items-center gap-3 py-1">
      <div className="flex gap-1 flex-shrink-0">
        {pm.palette.colores.map((color, i) => {
          const isMatched = !pm.unmatchedColors.includes(i);
          return (
            <span
              key={i}
              className={`inline-block w-5 h-5 rounded-full border ${
                isMatched ? "border-gray-300" : "border-dashed border-gray-200 opacity-40"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          );
        })}
      </div>
      <span className="text-xs text-gray-500 min-w-0 truncate">{pm.palette.nombre}</span>
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
