"use client";

import { useState, useMemo } from "react";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import type { SanzoPalette } from "@/lib/outfits/types";
import { SEASON_LABELS, CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { OutfitBottomSheet } from "./OutfitBottomSheet";

const EXCLUDED_CATEGORIES = new Set(["SOCKS", "SHOES"]);
const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];

function filterBySeason(garments: GarmentWithColors[], season: Season): GarmentWithColors[] {
  return garments.filter(
    (g) =>
      !EXCLUDED_CATEGORIES.has(g.category) &&
      g.seasons.some((s) => s.season === season || s.season === "ALL_YEAR")
  );
}

export function OutfitBuilder({
  garments,
  palettes,
}: {
  garments: GarmentWithColors[];
  palettes: SanzoPalette[];
}) {
  const [season, setSeason] = useState<Season>("SUMMER");
  const [selected, setSelected] = useState<GarmentWithColors | null>(null);

  const filtered = useMemo(() => filterBySeason(garments, season), [garments, season]);

  return (
    <div className="space-y-6">
      {/* Season selector */}
      <div>
        <p className="text-sm font-medium mb-2">Temporada</p>
        <div className="flex gap-2 flex-wrap">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`text-sm px-3 py-1.5 border rounded transition-colors ${
                season === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "hover:bg-gray-50"
              }`}
            >
              {SEASON_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Garment grid — same style as /armari */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hi ha peces per a aquesta temporada.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-400">{filtered.length} peces · toca una per veure combinacions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => setSelected(g)}
                className="rounded-lg border overflow-hidden flex flex-col text-left hover:shadow-md transition-shadow"
              >
                <div className="flex h-24 w-full">
                  {g.colors.map((c) => (
                    <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
                  ))}
                </div>
                <div className="p-2 flex flex-col gap-0.5 bg-white w-full">
                  <span className="text-xs font-medium">{CATEGORY_LABELS[g.category]}</span>
                  <span className="text-xs text-gray-500">{FIT_LABELS[g.fit]} · {g.size}</span>
                  {g.notes && (
                    <span className="text-xs text-gray-400 truncate">{g.notes}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Bottom sheet with combinations */}
      {selected && (
        <OutfitBottomSheet
          garment={selected}
          allGarments={filtered}
          palettes={palettes}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
