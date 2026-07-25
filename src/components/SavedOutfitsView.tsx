"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteOutfitAction,
  addOutfitExtrasAction,
  removeOutfitExtraAction,
  setOutfitFavoriteAction,
} from "@/app/outfits/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";
import { Card, Icon, Sheet, Stack, Text, TextButton, useToast, EmptyState } from "@/components/ui";

// Categories whose pieces are excluded from the colour engine but that
// the user still wants to record on a saved outfit.
const EXTRA_CATEGORIES = new Set(["SHOES", "SOCKS"]);

type WornEvent = SavedOutfit["wornEvents"][number];

/**
 * Never-worn outfits rank before any dated one; among dated ones the
 * oldest last-worn date wins. Used both to pick the "menys portat"
 * suggestion and to render "fa X dies" / "mai portat".
 */
function wornRank(events: WornEvent[]): number {
  return events.length === 0 ? -Infinity : events[0].date.getTime();
}

function formatLastWorn(events: WornEvent[]): string {
  if (events.length === 0) return "mai portat";
  const days = Math.floor((Date.now() - events[0].date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "portat avui";
  if (days === 1) return "portat fa 1 dia";
  return `portat fa ${days} dies`;
}

function formatWornDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "avui";
  if (days === 1) return "ahir";
  return `fa ${days} dies`;
}

function pickableExtras(
  outfit: SavedOutfit,
  extraCandidates: GarmentWithColors[],
): GarmentWithColors[] {
  const existingIds = new Set(
    outfit.garments.filter((g) => g.role === "extra").map((g) => g.garment.id),
  );
  return extraCandidates.filter((g) => !existingIds.has(g.id));
}

/** Tiled photo composite: the outfit's own garments, not swatches/icons. */
export function OutfitCollage({
  garments,
  className,
  thumb = true,
}: {
  garments: GarmentWithColors[];
  className?: string;
  thumb?: boolean;
}) {
  if (garments.length === 0) {
    return <div className={`bg-surface ${className ?? ""}`} />;
  }
  if (garments.length === 1) {
    return <PieceThumb garment={garments[0]} thumb={thumb} className={className} />;
  }
  const shown = garments.slice(0, 4);
  return (
    <div
      className={`grid grid-cols-2 gap-0.5 ${shown.length > 2 ? "grid-rows-2" : ""} ${className ?? ""}`}
    >
      {shown.map((g, i) => (
        <PieceThumb
          key={g.id}
          garment={g}
          thumb={thumb}
          className={`h-full w-full ${shown.length === 3 && i === 0 ? "row-span-2" : ""}`}
        />
      ))}
    </div>
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
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);

  const extraCandidates = useMemo(
    () => allGarments.filter((g) => EXTRA_CATEGORIES.has(g.category)),
    [allGarments],
  );

  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);
  const [extrasPickerOpen, setExtrasPickerOpen] = useState(false);

  // "Menys portat": the outfit most overdue for a rewear, surfaced as a
  // gentle daily-use nudge. Only worth a banner once there's a choice.
  const suggestedOutfitId = useMemo(() => {
    if (outfits.length < 2) return null;
    return outfits.reduce((least, o) =>
      wornRank(o.wornEvents) < wornRank(least.wornEvents) ? o : least,
    ).id;
  }, [outfits]);

  if (outfits.length === 0) {
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

  const openOutfit = outfits.find((o) => o.id === openOutfitId) ?? null;
  const suggestedOutfit = outfits.find((o) => o.id === suggestedOutfitId) ?? null;

  return (
    <div className="flex flex-col gap-10">
      {suggestedOutfit && (
        <SuggestionBanner
          outfit={suggestedOutfit}
          palette={paletteMap.get(suggestedOutfit.paletteId) ?? null}
          onOpen={() => setOpenOutfitId(suggestedOutfit.id)}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
        {outfits.map((outfit, i) => (
          <SavedOutfitCard
            key={outfit.id}
            outfit={outfit}
            palette={paletteMap.get(outfit.paletteId) ?? null}
            index={i}
            suggested={outfit.id === suggestedOutfitId}
            onOpen={() => setOpenOutfitId(outfit.id)}
          />
        ))}
      </div>

      {openOutfit && (
        <SavedOutfitSheet
          outfit={openOutfit}
          palette={paletteMap.get(openOutfit.paletteId) ?? null}
          onClose={() => {
            setOpenOutfitId(null);
            setExtrasPickerOpen(false);
          }}
          onOpenExtras={() => setExtrasPickerOpen(true)}
        />
      )}

      {/* Sibling of SavedOutfitSheet, not nested inside it — the detail
          sheet's panel has a transform (containing block for fixed
          descendants) and clips overflow, so a Sheet mounted inside it
          gets visually broken on the second open. */}
      {openOutfit && extrasPickerOpen && (
        <ExtrasPicker
          outfitId={openOutfit.id}
          candidates={pickableExtras(openOutfit, extraCandidates)}
          onClose={() => setExtrasPickerOpen(false)}
        />
      )}
    </div>
  );
}

function SuggestionBanner({
  outfit,
  palette,
  onOpen,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  onOpen: () => void;
}) {
  const primaryGarments = outfit.garments
    .filter((g) => g.role === "primary")
    .map((g) => g.garment);
  const title = primaryGarments.map((g) => CATEGORY_LABELS[g.category]).join(" · ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-4 border border-border p-4 text-left outline-none transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:border-text-primary focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <OutfitCollage garments={primaryGarments} className="h-16 w-16 flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <Text variant="caption">suggerit — el que fa més temps que no portes</Text>
        <Text as="span" className="font-serif truncate">
          {title || (palette?.nombre ?? "outfit")}
        </Text>
        <Text variant="small" italic tone="secondary" className="font-serif">
          {formatLastWorn(outfit.wornEvents)}
        </Text>
      </div>
      <span className="flex-shrink-0 text-text-secondary transition-colors group-hover:text-text-primary">
        <Icon name="arrow-right" size={14} />
      </span>
    </button>
  );
}

function SavedOutfitCard({
  outfit,
  palette,
  index,
  suggested,
  onOpen,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  index: number;
  suggested: boolean;
  onOpen: () => void;
}) {
  const primaryGarments = outfit.garments
    .filter((g) => g.role === "primary")
    .map((g) => g.garment);
  const title = primaryGarments.map((g) => CATEGORY_LABELS[g.category]).join(" · ");
  const subtitle = palette?.nombre ?? outfit.name ?? `outfit #${index + 1}`;

  return (
    <Card
      as="button"
      type="button"
      interactive="clickable"
      onClick={onOpen}
      data-testid="saved-outfit-card"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0">
        <OutfitCollage garments={primaryGarments} className="h-full w-full" />
        {outfit.favorite && (
          <span className="absolute top-2 right-2 inline-flex bg-elevated p-1">
            <Icon name="star" size={12} className="fill-current text-text-primary" />
          </span>
        )}
        {suggested && (
          <span className="absolute bottom-2 left-2 type-caption bg-elevated px-1.5 py-0.5">
            suggerit
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between pt-3">
        <Text as="span" className="font-serif leading-tight">
          {title}
        </Text>
        <Text variant="caption" tabular>
          n{String(index + 1).padStart(3, "0")}
        </Text>
      </div>
      <Text variant="small" italic tone="secondary" className="font-serif mt-0.5 truncate">
        {subtitle}
      </Text>
    </Card>
  );
}

function SavedOutfitSheet({
  outfit,
  palette,
  onClose,
  onOpenExtras,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  onClose: () => void;
  onOpenExtras: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const toast = useToast();

  const primary = outfit.garments.filter((g) => g.role === "primary");
  const extras = outfit.garments.filter((g) => g.role === "extra");
  const title = primary.map((og) => CATEGORY_LABELS[og.garment.category]).join(" · ");

  const handleToggleFavorite = () => {
    startTransition(async () => {
      await setOutfitFavoriteAction(outfit.id, !outfit.favorite);
      toast.show(outfit.favorite ? "tret de preferits" : "afegit a preferits");
    });
  };

  const handleRemoveExtra = (garmentId: string) => {
    startTransition(async () => {
      await removeOutfitExtraAction(outfit.id, garmentId);
      toast.show("extra tret");
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOutfitAction(outfit.id);
      toast.show("outfit eliminat");
      onClose();
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label={`Outfit ${title}`}
      media={
        <OutfitCollage
          garments={primary.map((og) => og.garment)}
          thumb={false}
          className="h-full w-full"
        />
      }
      mediaHeight="h-40"
      header={
        <Stack gap={1}>
          <Text variant="caption">outfit desat</Text>
          <h2 className="type-title">{title}</h2>
          {palette && (
            <Text variant="small" italic tone="secondary" className="font-serif">
              {palette.nombre}
            </Text>
          )}
        </Stack>
      }
    >
      {palette && (
        <Stack gap={2}>
          <Text variant="caption">paleta</Text>
          <div className="flex gap-1">
            {palette.colores.map((color, i) => (
              <span
                key={i}
                className="inline-block h-6 w-6"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </Stack>
      )}

      <Stack gap={2}>
        <Text variant="caption">peces</Text>
        <div className="flex flex-wrap gap-3">
          {primary.map((og) => (
            <div key={og.garment.id} className="flex w-16 flex-col items-center gap-1">
              <PieceThumb garment={og.garment} className="h-16 w-16" />
              <Text
                variant="small"
                tone="secondary"
                className="font-serif text-center leading-tight"
              >
                {CATEGORY_LABELS[og.garment.category]}
              </Text>
            </div>
          ))}
        </div>
      </Stack>

      <Stack gap={2}>
        <div className="flex items-baseline justify-between">
          <Text variant="caption">sabates i accessoris</Text>
          <TextButton type="button" tone="secondary" onClick={onOpenExtras} disabled={pending}>
            + afegir
          </TextButton>
        </div>
        {extras.length === 0 ? (
          <Text variant="small" italic tone="secondary" className="font-serif">
            cap.
          </Text>
        ) : (
          <div className="flex flex-wrap gap-3">
            {extras.map((og) => (
              <div
                key={og.garment.id}
                className="group/extra relative flex w-16 flex-col items-center gap-1"
              >
                <PieceThumb garment={og.garment} className="h-16 w-16" />
                <button
                  type="button"
                  onClick={() => handleRemoveExtra(og.garment.id)}
                  disabled={pending}
                  aria-label={`Treure ${CATEGORY_LABELS[og.garment.category]}`}
                  className="absolute -top-1 -right-1 rounded-full border border-border bg-background p-0.5 opacity-0 transition-opacity focus:opacity-100 group-hover/extra:opacity-100"
                >
                  <Icon name="close" size={10} />
                </button>
                <Text
                  variant="small"
                  tone="secondary"
                  className="font-serif text-center leading-tight"
                >
                  {CATEGORY_LABELS[og.garment.category]}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Stack>

      <Stack gap={2}>
        <Text variant="caption">portat</Text>
        {outfit.wornEvents.length === 0 ? (
          <Text variant="small" italic tone="secondary" className="font-serif">
            mai portat.
          </Text>
        ) : (
          <ul className="flex flex-col gap-1">
            {outfit.wornEvents.map((ev) => (
              <li key={ev.id}>
                <Text as="span" italic tone="secondary" className="font-serif text-sm">
                  {formatWornDate(ev.date)}
                </Text>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/calendari"
          className="self-start font-serif italic type-small text-text-primary hover:text-text-secondary transition-colors"
        >
          planificar a la setmana
        </Link>
      </Stack>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <TextButton
          type="button"
          tone="secondary"
          onClick={handleToggleFavorite}
          disabled={pending}
        >
          {outfit.favorite ? "treure de preferits" : "afegir a preferits"}
        </TextButton>
        {confirmingDelete ? (
          <div className="flex items-center gap-4">
            <TextButton
              type="button"
              tone="secondary"
              onClick={() => setConfirmingDelete(false)}
              disabled={pending}
            >
              cancel·lar
            </TextButton>
            <TextButton type="button" tone="danger" onClick={handleDelete} disabled={pending}>
              {pending ? "eliminant…" : "sí, eliminar"}
            </TextButton>
          </div>
        ) : (
          <TextButton type="button" tone="danger" onClick={() => setConfirmingDelete(true)}>
            eliminar
          </TextButton>
        )}
      </div>
    </Sheet>
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
