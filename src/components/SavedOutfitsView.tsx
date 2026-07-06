"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteOutfitAction } from "@/app/outfits/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import { bucketOf } from "@/lib/outfits/buckets";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";

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

function GarmentThumb({ garment }: { garment: GarmentWithColors }) {
  return (
    <div
      className="relative h-16 w-16 flex-shrink-0 overflow-hidden"
      title={CATEGORY_LABELS[garment.category as keyof typeof CATEGORY_LABELS]}
    >
      {garment.image ? (
        <Image
          src={`/api/uploads/${garment.image}?v=${garment.updatedAt.getTime()}`}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full">
          {garment.colors.map((c) => (
            <div key={c.id} className="flex-1 h-full" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      )}
    </div>
  );
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

function buildEmprovadorHref(garments: SavedOutfit["garments"]): string {
  const params = new URLSearchParams();
  for (const og of garments) {
    const b = bucketOf(og.garment.category);
    if (b && !params.has(b)) params.set(b, og.garment.id);
  }
  const qs = params.toString();
  return qs ? `/emprovador?${qs}` : "/emprovador";
}

function SavedGroupCard({
  group,
  index,
}: {
  group: SavedGroup;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const emprovadorHref = buildEmprovadorHref(group.garments);

  return (
    <div className="py-8">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group w-full flex items-center gap-4 text-left outline-none"
        aria-expanded={expanded}
      >
        {/* Tiles de peces */}
        <div className="flex gap-2 flex-shrink-0">
          {group.garments.map((og) => (
            <GarmentThumb key={og.garment.id} garment={og.garment} />
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
        <div className="flex flex-col gap-4">
          <Link
            href={emprovadorHref}
            className="self-start font-serif italic text-sm text-foreground-secondary hover:text-foreground transition-colors duration-200 active:scale-[0.98] underline-offset-4 hover:underline"
          >
            emprovar
          </Link>
          {group.entries.map((entry) => (
            <SavedPaletteRow key={entry.outfitId} entry={entry} />
          ))}
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
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
      {entry.palette ? (
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
      ) : (
        <div />
      )}
      <span className="font-serif italic text-sm text-foreground-secondary min-w-0 truncate">
        {entry.palette?.nombre ?? `paleta #${entry.outfitId}`}
      </span>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-foreground-secondary hover:text-foreground disabled:opacity-40 transition-colors active:scale-95 shrink-0 h-6 w-6 flex items-center justify-center"
        aria-label="Eliminar outfit"
      >
        <span aria-hidden className="text-base leading-none">×</span>
      </button>
    </div>
  );
}
