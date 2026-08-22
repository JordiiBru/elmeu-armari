"use client";

import { useCallback, useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, OutfitGroup } from "@/lib/outfits/types";
import { generateOutfitGroupsForGarment } from "@/lib/outfits/engine";
import { optionLabel } from "@/lib/prendas/labels";
import { saveOutfitAction } from "@/app/outfits/actions";
import { outfitKey } from "@/lib/outfits/key";
import { OutfitGroupCard } from "./OutfitCard";
import { Sheet, TextButton, Text, Stack, Icon } from "@/components/ui";

const PAGE_SIZE = 6;

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  /** Every combination already in the wardrobe, as `outfitKey`s. Without
   * it the sheet kept offering to save outfits you already own: the save
   * deduped server-side and nothing happened, which read as a dead
   * button. */
  savedOutfitKeys: string[];
  /** Reported upward so the mark survives this sheet being closed and
   * reopened on the same piece — the state below unmounts with it. */
  onOutfitSaved: (key: string) => void;
  /** Up one level, back to the piece. Absent when the combiner was
   * opened from a page rather than from another sheet — then dismissing
   * is the only way out and there is nothing to go back to. */
  onBack?: () => void;
  /** Out of the whole thing, back to the wardrobe. */
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
  savedOutfitKeys,
  onOutfitSaved,
  onBack,
  onClose,
}: Props) {
  const t = useTranslations("combine");
  const tLabel = useTranslations("labels");
  const tModal = useTranslations("modal");
  const tOutfits = useTranslations("outfits");
  const [initial] = useState(() =>
    computeInitial(garment, allGarments, palettes),
  );
  const [groups, setGroups] = useState<OutfitGroup[]>(initial.groups);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  // What was already saved when this opened, and what you saved while it
  // was open. Both grey the button out; only the first decides the order,
  // so the list never reshuffles under your thumb as you save.
  const [savedAtOpen] = useState(() => new Set(savedOutfitKeys));
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [pieceFilter, setPieceFilter] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const isSaved = useCallback(
    (garmentIds: string[], paletteId: number) => {
      const key = outfitKey(garmentIds, paletteId);
      return savedAtOpen.has(key) || savedKeys.has(key);
    },
    [savedAtOpen, savedKeys],
  );

  // Combinations you already own sink to the bottom: the point of this
  // list is what you have not thought of yet.
  const ordered = useMemo(() => {
    const already = (g: OutfitGroup) =>
      savedAtOpen.has(
        outfitKey(g.garments.map((x) => x.id), g.palettes[0].palette.id),
      );
    return [...groups].sort((a, b) => Number(already(a)) - Number(already(b)));
  }, [groups, savedAtOpen]);

  const availablePieceCounts = useMemo(
    () =>
      Array.from(new Set(ordered.map((g) => g.garments.length))).sort(
        (a, b) => a - b,
      ),
    [ordered],
  );

  const visibleGroups =
    pieceFilter == null
      ? ordered
      : ordered.filter((g) => g.garments.length === pieceFilter);

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

  // Calling the action outside a transition let its revalidatePath race
  // the client-side promise, which never resolved — the save always
  // succeeded server-side but the button never flipped to "desat".
  const handleSave = (group: OutfitGroup, paletteId: number) => {
    const garmentIds = group.garments.map((g) => g.id);
    const key = outfitKey(garmentIds, paletteId);
    startTransition(async () => {
      await saveOutfitAction(paletteId, garmentIds);
      setSavedKeys((prev) => new Set(prev).add(key));
      onOutfitSaved(key);
    });
  };

  const getSavedPaletteIds = (group: OutfitGroup): Set<number> => {
    const garmentIds = group.garments.map((g) => g.id);
    const ids = new Set<number>();
    for (const pm of group.palettes) {
      if (isSaved(garmentIds, pm.palette.id)) ids.add(pm.palette.id);
    }
    return ids;
  };

  return (
    <Sheet
      onClose={onClose}
      size="lg"
      label={t("sheetLabel", { category: tLabel(`category.${garment.category}`) })}
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
        // Dismissing means leaving; going back to the piece is its own
        // control. Without it the close button did both jobs badly: you
        // pressed it to get out and landed on the piece you had already
        // left, which reads as the popup reopening on you.
        <div className="flex items-start justify-between gap-3">
          <Stack gap={1}>
            <Text variant="caption">{t("eyebrow")}</Text>
            <h2 className="type-title leading-tight">
              {tLabel(`category.${garment.category}`)}
            </h2>
            <Text variant="small" italic tone="secondary" className="font-serif">
              {[
                garment.fit ? optionLabel(tLabel, "fit", garment.fit) : null,
                garment.size ? tModal("size", { size: garment.size }) : null,
                garment.notes,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </Stack>
          {onBack && (
            <TextButton type="button" tone="secondary" onClick={onBack}>
              {tOutfits("back")}
            </TextButton>
          )}
        </div>
      }
      headerBelow={
        availablePieceCounts.length > 1 && (
          <div className="px-6 py-3 flex gap-5 overflow-x-auto">
            <PieceFilterTag
              active={pieceFilter === null}
              onClick={() => setPieceFilter(null)}
            >
              {t("all")}
            </PieceFilterTag>
            {availablePieceCounts.map((n) => (
              <PieceFilterTag
                key={n}
                active={pieceFilter === n}
                onClick={() => setPieceFilter(n)}
              >
                {t("pieces", { count: n })}
              </PieceFilterTag>
            ))}
          </div>
        )
      }
    >
      {visibleGroups.length === 0 && pieceFilter !== null ? (
        <div className="py-8 text-center flex flex-col gap-4 items-center">
          <Text italic tone="secondary" className="font-serif">
            {t("emptyFiltered", { count: pieceFilter })}
          </Text>
          {hasMore && !loading && (
            <TextButton
              type="button"
              onClick={() => loadMore(groups.length)}
              className="self-center mt-4"
            >
              {t("loadMore")}
            </TextButton>
          )}
        </div>
      ) : ordered.length === 0 ? (
        <Text italic tone="secondary" className="font-serif text-center py-8">
          {t("empty")}
        </Text>
      ) : (
        <>
          <Text variant="caption" tabular as="p">
            {t("count", { count: visibleGroups.length })}
            {pieceFilter !== null && ` · ${t("pieces", { count: pieceFilter })}`}
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
                pending={pending}
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
              <span>{t("showMore")}</span>
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
