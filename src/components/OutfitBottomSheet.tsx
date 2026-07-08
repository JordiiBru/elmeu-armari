"use client";

import { useState, useMemo } from "react";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, OutfitGroup } from "@/lib/outfits/types";
import { generateOutfitGroupsForGarment } from "@/lib/outfits/engine";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { saveOutfitAction } from "@/app/outfits/actions";
import { OutfitGroupCard } from "./OutfitCard";
import { Sheet, TextButton, Text, Stack, useToast, Icon } from "@/components/ui";

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
  const toast = useToast();

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
    toast.show("outfit desat", "success");
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
    <Sheet
      onClose={onClose}
      size="lg"
      label={`Combinacions per ${CATEGORY_LABELS[garment.category]}`}
      media={
        <div className="flex h-full w-full">
          {garment.colors.map((c) => (
            <div
              key={c.id}
              className="flex-1"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
          ))}
        </div>
      }
      mediaHeight="h-24 sm:h-32"
      header={
        <Stack gap={1}>
          <Text variant="caption">combinar</Text>
          <h2 className="type-title leading-tight">
            {CATEGORY_LABELS[garment.category]}
          </h2>
          <Text variant="small" italic tone="secondary" className="font-serif">
            {FIT_LABELS[garment.fit]} · talla {garment.size}
            {garment.notes && ` · ${garment.notes}`}
          </Text>
        </Stack>
      }
      headerBelow={
        availablePieceCounts.length > 1 && (
          <div className="px-6 py-3 flex gap-5 overflow-x-auto">
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
        )
      }
    >
      {visibleGroups.length === 0 && pieceFilter !== null ? (
        <div className="py-8 text-center flex flex-col gap-4 items-center">
          <Text italic tone="secondary" className="font-serif">
            no hi ha combinacions de {pieceFilter} peces carregades.
          </Text>
          {hasMore && !loading && (
            <TextButton
              type="button"
              onClick={() => loadMore(groups.length)}
              className="self-center mt-4"
            >
              carregar més
            </TextButton>
          )}
        </div>
      ) : groups.length === 0 ? (
        <Text italic tone="secondary" className="font-serif text-center py-8">
          cap combinació trobada per a aquesta peça.
        </Text>
      ) : (
        <>
          <Text variant="caption" tabular as="p">
            {visibleGroups.length}{" "}
            {visibleGroups.length === 1 ? "combinació" : "combinacions"}
            {pieceFilter !== null && ` · ${pieceFilter} peces`}
          </Text>
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
                  className="h-24 bg-surface/60 animate-pulse"
                />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <TextButton
              type="button"
              onClick={() => loadMore(groups.length)}
              className="self-center mt-4 inline-flex items-center gap-2"
            >
              <span>mostrar més combinacions</span>
              <Icon name="arrow-right" size={14} />
            </TextButton>
          )}
        </>
      )}
    </Sheet>
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
      className={[
        "group relative inline-flex items-baseline whitespace-nowrap outline-none",
        "type-caption transition-colors active:scale-[0.97]",
        active ? "text-text-primary" : "hover:text-text-primary",
        "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      ].join(" ")}
      aria-pressed={active}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary",
          "origin-left transition-transform duration-[var(--duration-base)] ease-out will-change-transform",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        ].join(" ")}
      />
    </button>
  );
}
