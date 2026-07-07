"use client";

import { useState } from "react";
import type { OutfitGroup, PaletteMatch } from "@/lib/outfits/types";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";

const CATEGORY_ORDER: Category[] = ["SHIRT", "SWEATER", "PANTS", "SOCKS", "SHOES"];

function sortedGarments(garments: OutfitGroup["garments"]) {
  return [...garments].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function GarmentTile({ garment }: { garment: GarmentWithColors }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <PieceThumb garment={garment} className="h-20 w-20" />
      <span className="text-[10px] tracking-[0.15em] uppercase text-foreground-secondary">
        {CATEGORY_LABELS[garment.category]}
      </span>
    </div>
  );
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
    <div className="flex flex-col gap-6 py-8 border-b border-border">
      {/* Tiles de peces */}
      <div className="flex flex-wrap gap-4">
        {ordered.map((g) => (
          <GarmentTile key={g.id} garment={g} />
        ))}
      </div>

      {/* Paleta principal */}
      <div className="flex flex-col gap-3">
        <PaletteHero pm={mainPalette} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSave(mainPalette.palette.id)}
            disabled={mainSaved}
            className="font-serif italic text-sm text-foreground disabled:text-foreground-secondary transition-colors active:scale-95 disabled:cursor-default"
          >
            {mainSaved ? "desat" : "desar outfit"}
          </button>
          {extraPalettes.length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="font-serif italic text-xs text-foreground-secondary hover:text-foreground transition-colors"
            >
              {expanded ? "menys" : `+${extraPalettes.length} paletes`}
            </button>
          )}
        </div>

        {expanded && (
          <div className="flex flex-col gap-2 pt-1">
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
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 flex-shrink-0">
        {pm.palette.colores.map((color, i) => {
          const isMatched = !pm.unmatchedColors.includes(i);
          return (
            <span
              key={i}
              className={`inline-block w-5 h-5 ${isMatched ? "" : "opacity-35"}`}
              style={{ backgroundColor: color }}
              title={`${color}${isMatched ? "" : " (lliure)"}`}
            />
          );
        })}
      </div>
      <span className="font-serif italic text-sm text-foreground-secondary">{pm.palette.nombre}</span>
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
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
      <div className="flex gap-0.5 flex-shrink-0">
        {pm.palette.colores.map((color, i) => {
          const isMatched = !pm.unmatchedColors.includes(i);
          return (
            <span
              key={i}
              className={`inline-block w-4 h-4 ${isMatched ? "" : "opacity-40"}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          );
        })}
      </div>
      <span className="font-serif italic text-xs text-foreground-secondary min-w-0 truncate">
        {pm.palette.nombre}
      </span>
      <button
        onClick={onSave}
        disabled={saved}
        className="font-serif italic text-xs text-foreground-secondary hover:text-foreground disabled:opacity-40 transition-colors active:scale-95 shrink-0"
        aria-label={saved ? "Ja desat" : "Desar paleta"}
      >
        {saved ? "desat" : "desar"}
      </button>
    </div>
  );
}
