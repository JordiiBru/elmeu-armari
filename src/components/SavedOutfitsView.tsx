"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteOutfitAction,
  duplicateOutfitAction,
  addOutfitExtrasAction,
  removeOutfitExtraAction,
  setOutfitFavoriteAction,
  assignOutfitToDayAction,
} from "@/app/outfits/actions";
import { CATEGORY_LABELS, SUBTYPE_LABELS } from "@/lib/prendas/labels";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { dayToISO } from "@/lib/outfits/week";
import { wornRank, formatLastWorn } from "@/lib/outfits/worn";
import { PieceThumb } from "./PieceThumb";
import { Card, Icon, Sheet, Stack, Text, TextButton, useToast, EmptyState } from "@/components/ui";

function formatWornDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "avui";
  if (days === 1) return "ahir";
  return `fa ${days} dies`;
}

/** An accessory is more useful identified by its subtype ("bossa", "anell")
 * than by its category — every accessory shares the same category label. */
function pieceLabel(garment: GarmentWithColors): string {
  if (garment.category === "ACCESSORI" && garment.subtype) {
    return SUBTYPE_LABELS[garment.subtype] ?? CATEGORY_LABELS.ACCESSORI;
  }
  return CATEGORY_LABELS[garment.category];
}

/** Deduped piece labels of an outfit's extras — used to tell variants
 * of the same core+palette apart in the grid ("amb Sabates"). */
export function extraLabelsOf(outfit: SavedOutfit): string[] {
  const labels = outfit.garments
    .filter((g) => g.role === "extra")
    .map((g) => pieceLabel(g.garment));
  return Array.from(new Set(labels));
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
  const hidden = garments.length - shown.length;
  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        className={`grid h-full w-full grid-cols-2 gap-0.5 ${shown.length > 2 ? "grid-rows-2" : ""}`}
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
      {hidden > 0 && (
        <span className="absolute bottom-1.5 right-1.5 type-caption bg-elevated px-1.5 py-0.5">
          +{hidden}
        </span>
      )}
    </div>
  );
}

export function allGarmentsOf(outfit: SavedOutfit): GarmentWithColors[] {
  return outfit.garments.map((g) => g.garment);
}

export function SavedOutfitsView({
  outfits,
  palettes,
  allGarments,
  todayOutfitId,
}: {
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  allGarments: GarmentWithColors[];
  todayOutfitId: string | null;
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
      <div className="flex items-center justify-end">
        <Link
          href="/calendari"
          className="inline-flex items-center gap-1 font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors"
        >
          veure calendari
          <Icon name="arrow-right" size={12} />
        </Link>
      </div>

      {/* Only worth surfacing if today isn't already decided — once an
          outfit is assigned to today, the nudge has done its job. */}
      {suggestedOutfit && !todayOutfitId && (
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
          isToday={openOutfit.id === todayOutfitId}
          onClose={() => {
            setOpenOutfitId(null);
            setExtrasPickerOpen(false);
          }}
          onOpenExtras={() => setExtrasPickerOpen(true)}
          onDuplicated={(newOutfitId) => {
            setOpenOutfitId(newOutfitId);
            setExtrasPickerOpen(false);
          }}
        />
      )}

      {/* Sibling of SavedOutfitSheet, not nested inside it — the detail
          sheet's panel has a transform (containing block for fixed
          descendants) and clips overflow, so a Sheet mounted inside it
          gets visually broken on the second open. */}
      {openOutfit && extrasPickerOpen && (
        <ExtrasPicker
          outfitId={openOutfit.id}
          candidates={extraCandidates}
          currentExtraIds={openOutfit.garments
            .filter((g) => g.role === "extra")
            .map((g) => g.garment.id)}
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
  const title = outfit.garments
    .filter((g) => g.role === "primary")
    .map((g) => CATEGORY_LABELS[g.garment.category])
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-4 border border-border p-4 text-left outline-none transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:border-text-primary focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <OutfitCollage garments={allGarmentsOf(outfit)} className="h-16 w-16 flex-shrink-0" />
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
  const title = outfit.garments
    .filter((g) => g.role === "primary")
    .map((g) => CATEGORY_LABELS[g.garment.category])
    .join(" · ");
  const base = palette?.nombre ?? outfit.name ?? `outfit #${index + 1}`;
  const extraLabels = extraLabelsOf(outfit);
  const subtitle = extraLabels.length > 0 ? `${base} · ${extraLabels.join(", ")}` : base;

  return (
    <Card
      as="button"
      type="button"
      interactive="clickable"
      onClick={onOpen}
      data-testid="saved-outfit-card"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0">
        <OutfitCollage garments={allGarmentsOf(outfit)} className="h-full w-full" />
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
  isToday,
  onClose,
  onOpenExtras,
  onDuplicated,
}: {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  isToday: boolean;
  onClose: () => void;
  onOpenExtras: () => void;
  onDuplicated: (newOutfitId: string) => void;
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

  const handleDuplicate = () => {
    startTransition(async () => {
      const variant = await duplicateOutfitAction(outfit.id);
      toast.show("variant creada — afegeix-hi altres sabates o accessoris", "success");
      onDuplicated(variant.id);
    });
  };

  const handleWearToday = () => {
    startTransition(async () => {
      await assignOutfitToDayAction(outfit.id, dayToISO(new Date()));
      toast.show("assignat per avui", "success");
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label={`Outfit ${title}`}
      media={<OutfitCollage garments={allGarmentsOf(outfit)} thumb={false} className="h-full w-full" />}
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
            editar
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
                  aria-label={`Treure ${pieceLabel(og.garment)}`}
                  className="absolute -top-1 -right-1 rounded-full border border-border bg-background p-0.5 opacity-0 transition-opacity focus:opacity-100 group-hover/extra:opacity-100"
                >
                  <Icon name="close" size={10} />
                </button>
                <Text
                  variant="small"
                  tone="secondary"
                  className="font-serif text-center leading-tight"
                >
                  {pieceLabel(og.garment)}
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
        {isToday ? (
          <Text variant="small" italic tone="secondary" className="font-serif">
            ja el portes avui.
          </Text>
        ) : (
          <TextButton
            type="button"
            onClick={handleWearToday}
            disabled={pending}
            className="self-start"
          >
            {pending ? "assignant…" : "portar-lo avui"}
          </TextButton>
        )}
      </Stack>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4">
          <TextButton
            type="button"
            tone="secondary"
            onClick={handleToggleFavorite}
            disabled={pending}
          >
            {outfit.favorite ? "treure de preferits" : "afegir a preferits"}
          </TextButton>
          <TextButton
            type="button"
            tone="secondary"
            onClick={handleDuplicate}
            disabled={pending}
          >
            duplicar
          </TextButton>
        </div>
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

function PickableCard({
  garment,
  selected,
  onClick,
}: {
  garment: GarmentWithColors;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col gap-1 p-2 border transition-colors text-left ${
        selected
          ? "border-text-primary bg-elevated"
          : "border-border hover:border-text-secondary"
      }`}
    >
      <PieceThumb garment={garment} className="aspect-square w-full" />
      <span className="font-serif text-xs leading-tight">
        {pieceLabel(garment)}
      </span>
    </button>
  );
}

function ExtrasSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={3}>
      <div className="flex flex-col gap-0.5">
        <Text variant="caption">{title}</Text>
        {hint && (
          <Text variant="small" italic tone="secondary" className="font-serif">
            {hint}
          </Text>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">{children}</div>
    </Stack>
  );
}

function ExtrasPicker({
  outfitId,
  candidates,
  currentExtraIds,
  onClose,
}: {
  outfitId: string;
  candidates: GarmentWithColors[];
  currentExtraIds: string[];
  onClose: () => void;
}) {
  const shoes = candidates.filter((g) => g.category === "SHOES");
  const accessories = candidates.filter((g) => g.category === "ACCESSORI");
  // SOCKS today — any other future EXTRA_CATEGORIES member that isn't
  // shoes or accessories lands here, unlimited like accessories.
  const others = candidates.filter(
    (g) => g.category !== "SHOES" && g.category !== "ACCESSORI",
  );

  const currentIds = useMemo(() => new Set(currentExtraIds), [currentExtraIds]);

  const [selectedShoe, setSelectedShoe] = useState<string | null>(
    () => shoes.find((g) => currentIds.has(g.id))?.id ?? null,
  );
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(
    () => new Set(accessories.filter((g) => currentIds.has(g.id)).map((g) => g.id)),
  );
  const [selectedOthers, setSelectedOthers] = useState<Set<string>>(
    () => new Set(others.filter((g) => currentIds.has(g.id)).map((g) => g.id)),
  );
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedIds = new Set([
    ...(selectedShoe ? [selectedShoe] : []),
    ...selectedAccessories,
    ...selectedOthers,
  ]);
  const toAdd = [...selectedIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !selectedIds.has(id));
  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const handleConfirm = () => {
    if (!hasChanges) return;
    startTransition(async () => {
      await Promise.all([
        toAdd.length > 0 ? addOutfitExtrasAction(outfitId, toAdd) : null,
        ...toRemove.map((id) => removeOutfitExtraAction(outfitId, id)),
      ]);
      toast.show("canvis desats", "success");
      onClose();
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label="Editar sabates i accessoris"
      header={
        <div className="flex flex-col gap-1">
          <Text variant="caption">extres</Text>
          <h2 className="type-title">sabates i accessoris</h2>
          <Text variant="small" italic tone="secondary" className="font-serif">
            no participen al matching cromàtic. desmarca per treure&apos;ls.
          </Text>
        </div>
      }
    >
      {candidates.length === 0 ? (
        <Text variant="small" italic tone="secondary" className="font-serif">
          encara no tens cap sabata, mitjó o accessori al catàleg.
        </Text>
      ) : (
        <Stack gap={6}>
          {shoes.length > 0 && (
            <ExtrasSection title="sabates" hint="només pots triar-ne un parell.">
              {shoes.map((g) => (
                <PickableCard
                  key={g.id}
                  garment={g}
                  selected={selectedShoe === g.id}
                  onClick={() =>
                    setSelectedShoe((prev) => (prev === g.id ? null : g.id))
                  }
                />
              ))}
            </ExtrasSection>
          )}

          {accessories.length > 0 && (
            <ExtrasSection title="accessoris">
              {accessories.map((g) => (
                <PickableCard
                  key={g.id}
                  garment={g}
                  selected={selectedAccessories.has(g.id)}
                  onClick={() => toggleIn(setSelectedAccessories, g.id)}
                />
              ))}
            </ExtrasSection>
          )}

          {others.length > 0 && (
            <ExtrasSection title="mitjons">
              {others.map((g) => (
                <PickableCard
                  key={g.id}
                  garment={g}
                  selected={selectedOthers.has(g.id)}
                  onClick={() => toggleIn(setSelectedOthers, g.id)}
                />
              ))}
            </ExtrasSection>
          )}
        </Stack>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <TextButton type="button" tone="secondary" onClick={onClose} disabled={pending}>
          cancel·lar
        </TextButton>
        <TextButton
          type="button"
          onClick={handleConfirm}
          disabled={pending || !hasChanges}
        >
          {pending ? "desant…" : "desar canvis"}
        </TextButton>
      </div>
    </Sheet>
  );
}
