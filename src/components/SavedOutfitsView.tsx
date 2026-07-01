"use client";

import { useTransition, useMemo } from "react";
import { deleteOutfitAction } from "@/app/outfits/actions";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";

interface SavedGroup {
  garmentKey: string;
  garments: SavedOutfit["garments"];
  entries: { outfitId: string; name: string | null; palette: SanzoPalette | null }[];
}

function groupOutfits(outfits: SavedOutfit[], palettes: SanzoPalette[]): SavedGroup[] {
  const paletteMap = new Map(palettes.map((p) => [p.id, p]));
  const groups = new Map<string, SavedGroup>();

  for (const outfit of outfits) {
    const key = outfit.garments.map((g) => g.garment.id).sort().join(",");
    const existing = groups.get(key);
    const entry = {
      outfitId: outfit.id,
      name: outfit.name,
      palette: paletteMap.get(outfit.paletteId) ?? null,
    };

    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(key, {
        garmentKey: key,
        garments: outfit.garments,
        entries: [entry],
      });
    }
  }

  return Array.from(groups.values());
}

export function SavedOutfitsView({
  outfits,
  palettes,
}: {
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
}) {
  const groups = useMemo(() => groupOutfits(outfits, palettes), [outfits, palettes]);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        Encara no has desat cap outfit. Ves a &quot;Combinar&quot; i desa les combinacions que t&apos;agradin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SavedGroupCard key={group.garmentKey} group={group} />
      ))}
    </div>
  );
}

function SavedGroupCard({ group }: { group: SavedGroup }) {
  return (
    <div className="border rounded p-4 space-y-4">
      {/* Garment pieces */}
      <div className="flex gap-3 flex-wrap">
        {group.garments.map((og) => (
          <div key={og.garment.id} className="flex items-center gap-1.5">
            <span
              className="inline-block w-7 h-7 rounded border border-gray-200"
              style={{ backgroundColor: og.garment.colors[0]?.hex ?? "#ccc" }}
            />
            <span className="text-sm text-gray-600">
              {CATEGORY_LABELS[og.garment.category as keyof typeof CATEGORY_LABELS]}
              {"fit" in og.garment && (
                <span className="text-xs text-gray-400 ml-1">
                  {FIT_LABELS[og.garment.fit as keyof typeof FIT_LABELS]}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Saved palettes */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          {group.entries.length} {group.entries.length === 1 ? "paleta desada" : "paletes desades"}
        </p>
        {group.entries.map((entry) => (
          <SavedPaletteRow key={entry.outfitId} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function SavedPaletteRow({
  entry,
}: {
  entry: { outfitId: string; name: string | null; palette: SanzoPalette | null };
}) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOutfitAction(entry.outfitId);
    });
  };

  return (
    <div className="flex items-center gap-3">
      {entry.palette && (
        <div className="flex gap-1">
          {entry.palette.colores.map((color, i) => (
            <span
              key={i}
              className="inline-block w-5 h-5 rounded border border-gray-200"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
      <span className="text-xs text-gray-400 min-w-0 truncate">
        {entry.palette?.nombre ?? `Paleta #${entry.outfitId}`}
      </span>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="ml-auto text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
      >
        {pending ? "..." : "Eliminar"}
      </button>
    </div>
  );
}
