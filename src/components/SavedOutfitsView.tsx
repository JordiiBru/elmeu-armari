"use client";

import { useState, useTransition, useMemo } from "react";
import {
  deleteOutfitAction,
  addOutfitExtrasAction,
  removeOutfitExtraAction,
  setOutfitFavoriteAction,
  logWornEventAction,
} from "@/app/outfits/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";
import { IconButton, Sheet, TextButton, Text, useToast, Icon, EmptyState } from "@/components/ui";

// Categories whose pieces are excluded from the colour engine but that
// the user still wants to record on a saved outfit.
const EXTRA_CATEGORIES = new Set(["SHOES", "SOCKS"]);

type SavedGarment = SavedOutfit["garments"][number];

interface SavedEntry {
  outfitId: string;
  name: string | null;
  palette: SanzoPalette | null;
  extras: SavedGarment[];
  favorite: boolean;
  lastWornAt: Date | null;
}

/**
 * Never-worn outfits rank before any dated one; among dated ones the
 * oldest date wins. Used both to pick the "menys portat" suggestion
 * and to render "fa X dies" / "mai portat".
 */
function wornRank(date: Date | null): number {
  return date === null ? -Infinity : date.getTime();
}

function formatLastWorn(date: Date | null): string {
  if (date === null) return "mai portat";
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "portat avui";
  if (days === 1) return "portat fa 1 dia";
  return `portat fa ${days} dies`;
}

interface SavedGroup {
  garmentKey: string;
  primaryGarments: SavedGarment[];
  entries: SavedEntry[];
  favorite: boolean;
}

function groupOutfits(outfits: SavedOutfit[], palettes: SanzoPalette[]): SavedGroup[] {
  const paletteMap = new Map(palettes.map((p) => [p.id, p]));
  const groups = new Map<string, SavedGroup>();

  for (const outfit of outfits) {
    const primary = outfit.garments.filter((g) => g.role === "primary");
    const extras = outfit.garments.filter((g) => g.role === "extra");
    const key = primary.map((g) => g.garment.id).sort().join(",");
    const existing = groups.get(key);
    const entry: SavedEntry = {
      outfitId: outfit.id,
      name: outfit.name,
      palette: paletteMap.get(outfit.paletteId) ?? null,
      extras,
      favorite: outfit.favorite,
      lastWornAt: outfit.lastWornAt,
    };

    if (existing) {
      existing.entries.push(entry);
      existing.favorite = existing.favorite || entry.favorite;
    } else {
      groups.set(key, {
        garmentKey: key,
        primaryGarments: primary,
        entries: [entry],
        favorite: entry.favorite,
      });
    }
  }

  for (const group of groups.values()) {
    group.entries.sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }

  return Array.from(groups.values()).sort(
    (a, b) => Number(b.favorite) - Number(a.favorite),
  );
}

function GarmentThumb({
  garment,
  muted = false,
}: {
  garment: GarmentWithColors;
  muted?: boolean;
}) {
  return (
    <PieceThumb
      garment={garment}
      className={`h-16 w-16 flex-shrink-0 ${muted ? "opacity-60" : ""}`}
    />
  );
}

export function SavedOutfitsView({
  outfits,
  palettes,
  allGarments,
}: {
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  allGarments: GarmentWithColors[];
}) {
  const groups = useMemo(() => groupOutfits(outfits, palettes), [outfits, palettes]);

  const extraCandidates = useMemo(
    () => allGarments.filter((g) => EXTRA_CATEGORIES.has(g.category)),
    [allGarments],
  );

  // "Menys portat": the outfit most overdue for a rewear, surfaced as a
  // gentle daily-use nudge rather than a strict ranking of the whole list.
  const suggestedOutfitId = useMemo(() => {
    if (outfits.length === 0) return null;
    return outfits.reduce((least, o) =>
      wornRank(o.lastWornAt) < wornRank(least.lastWornAt) ? o : least,
    ).id;
  }, [outfits]);

  if (groups.length === 0) {
    return (
      <EmptyState
        title="encara no hi ha res desat."
        hint={
          <>
            passa per <span className="text-text-primary">combinar</span> i guarda les
            paletes que t&apos;agradin.
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {groups.map((group, i) => (
        <SavedGroupCard
          key={group.garmentKey}
          group={group}
          index={i}
          extraCandidates={extraCandidates}
          suggestedOutfitId={suggestedOutfitId}
        />
      ))}
    </div>
  );
}

function SavedGroupCard({
  group,
  index,
  extraCandidates,
  suggestedOutfitId,
}: {
  group: SavedGroup;
  index: number;
  extraCandidates: GarmentWithColors[];
  suggestedOutfitId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-8">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group w-full flex items-center gap-4 text-left outline-none"
        aria-expanded={expanded}
      >
        <div className="flex gap-2 flex-shrink-0">
          {group.primaryGarments.map((og) => (
            <GarmentThumb key={og.garment.id} garment={og.garment} />
          ))}
        </div>

        <div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-base leading-tight text-text-primary">
              {group.primaryGarments
                .map((og) => CATEGORY_LABELS[og.garment.category])
                .join(" · ")}
            </span>
            <span className="font-serif italic text-xs text-text-secondary">
              {group.entries.length}{" "}
              {group.entries.length === 1 ? "paleta desada" : "paletes desades"}
            </span>
          </div>
          <span className="inline-flex items-center gap-3 shrink-0">
            <span className="type-caption tabular-nums">
              n{String(index + 1).padStart(3, "0")}
            </span>
            <span
              className={`inline-flex text-text-secondary transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] ${
                expanded ? "rotate-180" : ""
              }`}
            >
              <Icon name="chevron-down" size={12} />
            </span>
          </span>
        </div>
      </button>

      <div
        className={`collapse-panel ${expanded ? "mt-6" : ""}`}
        data-open={expanded}
      >
        <div className="flex flex-col gap-4">
          {group.entries.map((entry) => (
            <SavedPaletteRow
              key={entry.outfitId}
              entry={entry}
              extraCandidates={extraCandidates}
              suggested={entry.outfitId === suggestedOutfitId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedPaletteRow({
  entry,
  extraCandidates,
  suggested,
}: {
  entry: SavedEntry;
  extraCandidates: GarmentWithColors[];
  suggested: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const toast = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOutfitAction(entry.outfitId);
      toast.show("outfit eliminat");
    });
  };

  const handleToggleFavorite = () => {
    startTransition(async () => {
      await setOutfitFavoriteAction(entry.outfitId, !entry.favorite);
      toast.show(entry.favorite ? "tret de preferits" : "afegit a preferits");
    });
  };

  const handleLogWorn = () => {
    startTransition(async () => {
      await logWornEventAction(entry.outfitId);
      toast.show("marcat com portat avui", "success");
    });
  };

  const handleRemoveExtra = (garmentId: string) => {
    startTransition(async () => {
      await removeOutfitExtraAction(entry.outfitId, garmentId);
      toast.show("extra tret");
    });
  };

  const existingExtraIds = new Set(entry.extras.map((e) => e.garment.id));
  const pickableCandidates = extraCandidates.filter(
    (g) => !existingExtraIds.has(g.id),
  );

  return (
    <div className="flex flex-col gap-2">
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
        <span className="font-serif italic text-sm text-text-secondary min-w-0 truncate">
          {entry.palette?.nombre ?? `paleta #${entry.outfitId}`}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <IconButton
            onClick={handleLogWorn}
            disabled={pending}
            label="Marcar com portat avui"
            size="sm"
          >
            <Icon name="check" size={14} />
          </IconButton>
          <IconButton
            onClick={handleToggleFavorite}
            disabled={pending}
            label={entry.favorite ? "Treure de preferits" : "Afegir a preferits"}
            aria-pressed={entry.favorite}
            size="sm"
            className={entry.favorite ? "text-text-primary" : ""}
          >
            <Icon
              name="star"
              size={14}
              className={entry.favorite ? "fill-current" : "fill-none"}
            />
          </IconButton>
          <IconButton
            onClick={handleDelete}
            disabled={pending}
            label="Eliminar outfit"
            size="sm"
          >
            <Icon name="close" size={14} />
          </IconButton>
        </span>
      </div>

      <div className="flex items-center gap-3 pl-1">
        <span className="font-serif italic text-xs text-text-secondary">
          {formatLastWorn(entry.lastWornAt)}
        </span>
        {suggested && (
          <span className="type-caption text-text-primary">
            suggerit — el que fa més temps que no portes
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 pl-1">
        <div className="flex flex-wrap gap-2">
          {entry.extras.map((og) => (
            <div key={og.garment.id} className="relative group/extra">
              <GarmentThumb garment={og.garment} muted />
              <button
                type="button"
                onClick={() => handleRemoveExtra(og.garment.id)}
                disabled={pending}
                aria-label={`Treure ${CATEGORY_LABELS[og.garment.category]}`}
                className="absolute -top-1 -right-1 bg-background border border-border rounded-full p-0.5 opacity-0 group-hover/extra:opacity-100 focus:opacity-100 transition-opacity"
              >
                <Icon name="close" size={10} />
              </button>
            </div>
          ))}
        </div>
        <TextButton
          type="button"
          tone="secondary"
          onClick={() => setPickerOpen(true)}
          disabled={pending || pickableCandidates.length === 0}
        >
          + sabates / accessoris
        </TextButton>
      </div>

      {pickerOpen && (
        <ExtrasPicker
          outfitId={entry.outfitId}
          candidates={pickableCandidates}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function ExtrasPicker({
  outfitId,
  candidates,
  onClose,
}: {
  outfitId: string;
  candidates: GarmentWithColors[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    startTransition(async () => {
      await addOutfitExtrasAction(outfitId, Array.from(selected));
      toast.show("extras afegits", "success");
      onClose();
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label="Afegir sabates o accessoris"
      header={
        <div className="flex flex-col gap-1">
          <Text variant="caption">extres</Text>
          <h2 className="type-title">sabates i accessoris</h2>
          <Text variant="small" italic tone="secondary" className="font-serif">
            no participen al matching cromàtic.
          </Text>
        </div>
      }
    >
      {candidates.length === 0 ? (
        <Text variant="small" italic tone="secondary" className="font-serif">
          no queden peces d&apos;aquest tipus per afegir.
        </Text>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {candidates.map((g) => {
            const isSelected = selected.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                aria-pressed={isSelected}
                className={`flex flex-col gap-1 p-2 border transition-colors text-left ${
                  isSelected
                    ? "border-text-primary bg-elevated"
                    : "border-border hover:border-text-secondary"
                }`}
              >
                <PieceThumb garment={g} className="aspect-square w-full" />
                <span className="font-serif text-xs leading-tight">
                  {CATEGORY_LABELS[g.category]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <TextButton type="button" tone="secondary" onClick={onClose} disabled={pending}>
          cancel·lar
        </TextButton>
        <TextButton
          type="button"
          onClick={handleConfirm}
          disabled={pending || selected.size === 0}
        >
          {pending ? "afegint…" : `afegir (${selected.size})`}
        </TextButton>
      </div>
    </Sheet>
  );
}
