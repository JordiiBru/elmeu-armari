"use client";

import { useState, useMemo } from "react";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import type { SanzoPalette } from "@/lib/outfits/types";
import { SEASON_LABELS } from "@/lib/prendas/labels";
import { GarmentCard } from "./GarmentCard";
import { OutfitBottomSheet } from "./OutfitBottomSheet";

const EXCLUDED_CATEGORIES = new Set(["SOCKS", "SHOES"]);
const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];

function filterBySeason(garments: GarmentWithColors[], season: Season): GarmentWithColors[] {
  return garments.filter(
    (g) =>
      !EXCLUDED_CATEGORIES.has(g.category) &&
      g.seasons.some((s) => s.season === season || s.season === "ALL_YEAR"),
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
    <div className="flex flex-col gap-10">
      {/* Selector de temporada — mateix llenguatge que els filtres */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span className="type-caption">
            temporada
          </span>
          <span className="type-caption tabular-nums">
            {filtered.length} peces
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {SEASONS.map((s) => {
            const active = season === s;
            return (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`inline-flex items-center gap-1.5 type-caption transition-colors active:scale-[0.98] ${
                  active
                    ? "text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                <span
                  aria-hidden
                  className={`inline-block h-1 w-1 rounded-full transition-colors ${
                    active ? "bg-foreground" : "bg-border"
                  }`}
                />
                {SEASON_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ajuda breu */}
      <p className="font-serif italic text-sm text-foreground-secondary">
        Tria una peça per veure les paletes de Sanzo Wada que hi combinen.
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="font-serif italic text-foreground-secondary text-center py-16">
          No hi ha peces per a aquesta temporada.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
          {filtered.map((g, i) => (
            <GarmentCard
              key={g.id}
              garment={g}
              index={i}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

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
