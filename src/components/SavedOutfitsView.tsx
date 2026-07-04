"use client";

import { useState, useTransition, useMemo } from "react";
import { deleteOutfitAction } from "@/app/outfits/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
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
      <p className="font-serif italic text-foreground-secondary text-center py-16 max-w-md mx-auto">
        Encara no hi ha res desat. Ves a <span className="text-foreground">combinar</span> i guarda les paletes que t&apos;agradin.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {groups.map((group, i) => (
        <SavedGroupCard key={group.garmentKey} group={group} index={i} />
      ))}
    </div>
  );
}

function SavedGroupCard({
  group,
  index,
}: {
  group: SavedGroup;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-8">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group w-full flex items-center gap-6 text-left outline-none"
        aria-expanded={expanded}
      >
        {/* Tira de swatches horitzontal (una tira per cada peça) */}
        <div className="flex gap-1.5 flex-shrink-0">
          {group.garments.map((og) => (
            <div
              key={og.garment.id}
              className="flex h-14 w-3 overflow-hidden flex-col"
              title={CATEGORY_LABELS[og.garment.category as keyof typeof CATEGORY_LABELS]}
            >
              {og.garment.colors.map((c) => (
                <div
                  key={c.id}
                  className="flex-1 w-full"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-base leading-tight text-foreground">
              {group.garments
                .map((og) => CATEGORY_LABELS[og.garment.category as keyof typeof CATEGORY_LABELS])
                .join(" · ")}
            </span>
            <span className="font-serif italic text-xs text-foreground-secondary">
              {group.entries.length}{" "}
              {group.entries.length === 1 ? "paleta desada" : "paletes desades"}
            </span>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums shrink-0">
            n{String(index + 1).padStart(3, "0")}
            <span
              aria-hidden
              className={`ml-3 inline-block transition-transform duration-500 ease-out ${
                expanded ? "rotate-180" : ""
              }`}
            >
              ˅
            </span>
          </span>
        </div>
      </button>

      {/* Panel expandit */}
      <div
        className={`collapse-panel ${expanded ? "mt-6" : ""}`}
        data-open={expanded}
      >
        <div>
          <div className="flex flex-col gap-4 pl-[calc(0.375rem*4+3rem)]">
            {group.entries.map((entry) => (
              <SavedPaletteRow key={entry.outfitId} entry={entry} />
            ))}
          </div>
        </div>
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
    <div className="flex items-center gap-4">
      {entry.palette && (
        <div className="flex gap-0 shrink-0">
          {entry.palette.colores.map((color, i) => (
            <span
              key={i}
              className="inline-block h-5 w-5"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
      <span className="flex-1 min-w-0 truncate font-serif italic text-sm text-foreground-secondary">
        {entry.palette?.nombre ?? `paleta #${entry.outfitId}`}
      </span>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary hover:text-foreground disabled:opacity-40 transition-colors active:scale-95 shrink-0"
      >
        {pending ? "…" : "eliminar"}
      </button>
    </div>
  );
}
