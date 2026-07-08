"use client";

import { useState, useMemo } from "react";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, OutfitGroup } from "@/lib/outfits/types";
import { generateOutfitGroupsForGarment } from "@/lib/outfits/engine";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { SHEET_EASE, useSheetState } from "@/lib/useSheetState";
import { useSwipeToClose } from "@/lib/useSwipeToClose";
import { saveOutfitAction } from "@/app/outfits/actions";
import { OutfitGroupCard } from "./OutfitCard";

const PAGE_SIZE = 6;

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  onClose: () => void;
}

function computeInitial(
  garment: GarmentWithColors,
  allGarments: GarmentWithColors[],
  palettes: SanzoPalette[],
) {
  return generateOutfitGroupsForGarment(
    garment,
    allGarments,
    palettes,
    PAGE_SIZE,
    0,
  );
}

export function OutfitBottomSheet({
  garment,
  allGarments,
  palettes,
  onClose,
}: Props) {
  const [initial] = useState(() =>
    computeInitial(garment, allGarments, palettes),
  );
  const [groups, setGroups] = useState<OutfitGroup[]>(initial.groups);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [pieceFilter, setPieceFilter] = useState<number | null>(null);

  const { open, close } = useSheetState(onClose, 420);
  const swipe = useSwipeToClose(close);

  const availablePieceCounts = useMemo(
    () =>
      Array.from(new Set(groups.map((g) => g.garments.length))).sort(
        (a, b) => a - b,
      ),
    [groups],
  );

  const visibleGroups =
    pieceFilter == null
      ? groups
      : groups.filter((g) => g.garments.length === pieceFilter);

  const loadMore = (offset: number) => {
    setLoading(true);
    setTimeout(() => {
      const { groups: g, hasMore: hm } = generateOutfitGroupsForGarment(
        garment,
        allGarments,
        palettes,
        PAGE_SIZE,
        offset,
      );
      setGroups((prev) => [...prev, ...g]);
      setHasMore(hm);
      setLoading(false);
    }, 0);
  };

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
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-foreground/40"
        style={{
          opacity: open ? 1 : 0,
          transition: `opacity 300ms ${SHEET_EASE}`,
        }}
      />

      {/* Panell */}
      <div
        role="dialog"
        aria-modal
        className="relative bg-card w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        style={{
          transform: open
            ? `translate3d(0, ${swipe.dragY}px, 0)`
            : "translate3d(0, 100%, 0)",
          opacity: open ? 1 : 0,
          transition: swipe.dragging
            ? "none"
            : `transform 420ms ${SHEET_EASE}, opacity 300ms ${SHEET_EASE}`,
          willChange: "transform, opacity",
          contain: "layout paint",
        }}
      >
        {/* Handle mobil (swipe zone) */}
        <div
          className="sm:hidden pt-3 pb-2 flex justify-center touch-none"
          {...swipe.handlers}
        >
          <span className="block h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Franja de swatches — protagonista + swipe zone */}
        <div className="flex h-24 sm:h-32 flex-shrink-0 touch-none" {...swipe.handlers}>
          {garment.colors.map((c) => (
            <div
              key={c.id}
              className="flex-1"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
          ))}
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border">
          <div className="flex flex-col gap-1">
            <span className="type-caption">
              combinar
            </span>
            <h2 className="font-serif text-xl leading-tight">
              {CATEGORY_LABELS[garment.category]}
            </h2>
            <p className="font-serif italic text-xs text-foreground-secondary">
              {FIT_LABELS[garment.fit]} · talla {garment.size}
              {garment.notes && ` · ${garment.notes}`}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-foreground-secondary hover:text-foreground text-xl leading-none flex-shrink-0 -mr-1 -mt-1 h-8 w-8 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Tancar"
          >
            ×
          </button>
        </div>

        {/* Filtres per nombre de peces */}
        {availablePieceCounts.length > 1 && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-border flex gap-5 overflow-x-auto">
            <PieceFilterTag
              active={pieceFilter === null}
              onClick={() => setPieceFilter(null)}
            >
              totes
            </PieceFilterTag>
            {availablePieceCounts.map((n) => (
              <PieceFilterTag
                key={n}
                active={pieceFilter === n}
                onClick={() => setPieceFilter(n)}
              >
                {n} peces
              </PieceFilterTag>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="overflow-y-auto overscroll-contain px-6 pt-5 pb-8 flex flex-col gap-4">
          {visibleGroups.length === 0 && pieceFilter !== null ? (
            <div className="py-8 text-center flex flex-col gap-4 items-center">
              <p className="font-serif italic text-sm text-foreground-secondary">
                no hi ha combinacions de {pieceFilter} peces carregades.
              </p>
              {hasMore && !loading && (
                <LoadMoreButton onClick={() => loadMore(groups.length)}>
                  carregar més
                </LoadMoreButton>
              )}
            </div>
          ) : groups.length === 0 ? (
            <p className="font-serif italic text-foreground-secondary text-center py-8">
              cap combinació trobada per a aquesta peça.
            </p>
          ) : (
            <>
              <p className="type-caption tabular-nums">
                {visibleGroups.length}{" "}
                {visibleGroups.length === 1 ? "combinació" : "combinacions"}
                {pieceFilter !== null && ` · ${pieceFilter} peces`}
              </p>
              <div className="flex flex-col gap-4">
                {visibleGroups.map((group, i) => (
                  <OutfitGroupCard
                    key={
                      group.garments
                        .map((g) => g.id)
                        .sort()
                        .join(",") +
                      "-" +
                      i
                    }
                    group={group}
                    onSave={(paletteId) => handleSave(group, paletteId)}
                    savedPaletteIds={getSavedPaletteIds(group)}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex flex-col gap-3 pt-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-background-secondary/40 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {hasMore && !loading && (
                <LoadMoreButton onClick={() => loadMore(groups.length)}>
                  → mostrar més combinacions
                </LoadMoreButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PieceFilterTag({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-baseline whitespace-nowrap active:scale-[0.97]"
      aria-pressed={active}
    >
      <span
        className={`type-caption transition-colors ${
          active
            ? "text-foreground"
            : "text-foreground-secondary group-hover:text-foreground"
        }`}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-foreground origin-left transition-transform duration-300 ease-out will-change-transform ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </button>
  );
}

function LoadMoreButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative self-center font-serif italic text-sm text-foreground active:scale-[0.98] mt-4"
    >
      <span>{children}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-foreground origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out will-change-transform"
      />
    </button>
  );
}
