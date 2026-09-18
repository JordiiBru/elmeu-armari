"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { OutfitGroup, PaletteMatch } from "@/lib/outfits/types";
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
  const t = useTranslations("labels");
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <PieceThumb garment={garment} className="h-20 w-20" />
      <span className="type-caption">
        {t(`category.${garment.category}`)}
      </span>
    </div>
  );
}

export function OutfitGroupCard({
  group,
  onSave,
  savedPaletteIds,
  pending = false,
}: {
  group: OutfitGroup;
  onSave: (paletteId: number) => void;
  savedPaletteIds: Set<number>;
  pending?: boolean;
}) {
  const t = useTranslations("combine");
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
            disabled={mainSaved || pending}
            className="font-serif italic text-sm text-text-primary disabled:text-text-secondary transition-colors active:scale-95 disabled:cursor-default"
          >
            {mainSaved ? t("saved") : pending ? t("savingOutfit") : t("save")}
          </button>
          {extraPalettes.length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="font-serif italic text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {expanded ? t("less") : t("morePalettes", { count: extraPalettes.length })}
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
                pending={pending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaletteHero({ pm }: { pm: PaletteMatch }) {
  const t = useTranslations("combine");
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
              title={isMatched ? color : `${color} (${t("unmatched")})`}
            />
          );
        })}
      </div>
      <span className="font-serif italic text-sm text-text-secondary">{pm.palette.nombre}</span>
    </div>
  );
}

function PaletteRow({
  pm,
  onSave,
  saved,
  pending = false,
}: {
  pm: PaletteMatch;
  onSave: () => void;
  saved: boolean;
  pending?: boolean;
}) {
  const t = useTranslations("combine");
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
      <span className="font-serif italic text-xs text-text-secondary min-w-0 truncate">
        {pm.palette.nombre}
      </span>
      <button
        onClick={onSave}
        disabled={saved || pending}
        className="font-serif italic text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors active:scale-95 shrink-0"
        aria-label={saved ? t("savedPaletteAria") : t("savePaletteAria")}
      >
        {saved ? t("saved") : t("savePalette")}
      </button>
    </div>
  );
}
