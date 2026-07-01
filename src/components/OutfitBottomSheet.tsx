"use client";

import { useEffect, useState } from "react";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, OutfitGroup } from "@/lib/outfits/types";
import { generateOutfitGroupsForGarment } from "@/lib/outfits/engine";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { saveOutfitAction } from "@/app/outfits/actions";
import { OutfitGroupCard } from "./OutfitCard";

const PAGE_SIZE = 10;

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  onClose: () => void;
}

function computeInitial(garment: GarmentWithColors, allGarments: GarmentWithColors[], palettes: SanzoPalette[]) {
  return generateOutfitGroupsForGarment(garment, allGarments, palettes, PAGE_SIZE, 0);
}

export function OutfitBottomSheet({ garment, allGarments, palettes, onClose }: Props) {
  const [initial] = useState(() => computeInitial(garment, allGarments, palettes));
  const [groups, setGroups] = useState<OutfitGroup[]>(initial.groups);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const loadMore = (offset: number) => {
    setLoading(true);
    setTimeout(() => {
      const { groups: g, hasMore: hm } = generateOutfitGroupsForGarment(
        garment, allGarments, palettes, PAGE_SIZE, offset
      );
      setGroups((prev) => [...prev, ...g]);
      setHasMore(hm);
      setLoading(false);
    }, 0);
  };

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

  const handleSave = async (group: OutfitGroup, paletteId: number) => {
    const garmentIds = group.garments.map((g) => g.id);
    const key = [...garmentIds].sort().join(",") + "|" + paletteId;
    await saveOutfitAction(paletteId, garmentIds);
    setSavedKeys((prev) => new Set(prev).add(key));
  };

  const getSavedPaletteIds = (group: OutfitGroup): Set<number> => {
    const garmentKey = group.garments.map((g) => g.id).sort().join(",");
    const ids = new Set<number>();
    for (const pm of group.palettes) {
      if (savedKeys.has(garmentKey + "|" + pm.palette.id)) {
        ids.add(pm.palette.id);
      }
    }
    return ids;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header: selected garment */}
        <div className="flex-shrink-0 border-b">
          <div className="flex h-16">
            {garment.colors.map((c) => (
              <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
            ))}
          </div>
          <div className="p-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-sm">{CATEGORY_LABELS[garment.category]}</h2>
              <p className="text-xs text-gray-500">
                {FIT_LABELS[garment.fit]} · Talla {garment.size}
                {garment.notes && ` · ${garment.notes}`}
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
        </div>

        {/* Results */}
        <div className="overflow-y-auto overscroll-contain p-4 space-y-4">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Cap combinacio trobada per a aquesta peca.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {groups.length} combinaci{groups.length === 1 ? "o" : "ons"}
              </p>
              <div className="space-y-4">
                {groups.map((group, i) => (
                  <OutfitGroupCard
                    key={group.garments.map((g) => g.id).sort().join(",") + "-" + i}
                    group={group}
                    onSave={(paletteId) => handleSave(group, paletteId)}
                    savedPaletteIds={getSavedPaletteIds(group)}
                  />
                ))}
              </div>

              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="border rounded p-4 animate-pulse bg-gray-50 h-24" />
                  ))}
                </div>
              )}

              {hasMore && !loading && (
                <button
                  onClick={() => loadMore(groups.length)}
                  className="w-full text-sm px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Mostra mes
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
