"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setOutfitFavoriteAction } from "@/app/outfits/actions";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { isWearable } from "@/lib/bugaderia/laundry";
import { groupOutfitsByColor } from "@/lib/outfits/grouping";
import { OutfitTile } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { EmptyState, Grid, SegmentedControl, Stack, Text, useToast } from "@/components/ui";
import { TOAST_DURATION_MS } from "@/components/ui/toast";

/** The three categories an outfit is made of — shoes, socks and
 * accessories belong to the day, not to the look, so filtering by them
 * has nothing to group on here. */
type Filter = "ALL" | "SWEATER" | "SHIRT" | "PANTS";

const FILTERS: Filter[] = ["ALL", "SWEATER", "SHIRT", "PANTS"];

/**
 * "Què em poso?"'s whole answer, now that discovery lives in the
 * wardrobe: your favourited outfits, filterable by what you feel like
 * wearing, as a mosaic rather than a list. Tapping one opens it straight
 * onto today, because that is the only question this screen exists to
 * settle in the morning.
 *
 * A filter is also a grouping axis, not just a narrowing one: choosing
 * "pantalons" does not just hide outfits without trousers, it blocks the
 * rest by trouser colour — grey together, then the next colour — because
 * "which trousers" is usually the decision that started the morning.
 */
export function OutfitLibrary({
  outfits,
  palettes,
  extraCandidates,
  todayISO,
  todayOutfitId,
}: {
  /** Already ranked by the server, already favourites-only. */
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
  todayOutfitId: string | null;
}) {
  const t = useTranslations("outfits");
  const toast = useToast();
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  // Tiles are dense and thumb-reachable, so a mistap on the star is the
  // likely failure mode, not the exception. The write is held for exactly
  // as long as the toast offering to undo it is on screen — see
  // TOAST_DURATION_MS — rather than committed the instant the star is hit.
  const pendingRemovals = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Stable across filters, so an outfit keeps the same catalogue number
  // however you arrived at it — the incoming order is already the one
  // ranking every other surface on this page agrees on.
  const numbers = useMemo(
    () => new Map(outfits.map((o, i) => [o.id, i])),
    [outfits],
  );

  // Wearable outfits first, same as the old rail: a tile you cannot
  // actually put on this morning shouldn't be the first thing you tap.
  // Stable, so it only ever breaks ties the server ranking left standing.
  const visible = useMemo(
    () =>
      outfits
        .filter((o) => !hiddenIds.has(o.id))
        .sort((a, b) => Number(isWearable(b)) - Number(isWearable(a))),
    [outfits, hiddenIds],
  );

  const colorGroups = useMemo(
    () => (filter === "ALL" ? null : groupOutfitsByColor(visible, filter)),
    [visible, filter],
  );

  const openOutfit = outfits.find((o) => o.id === openOutfitId) ?? null;

  const handleUnfavorite = (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
    const timer = setTimeout(() => {
      pendingRemovals.current.delete(id);
      startTransition(async () => {
        await setOutfitFavoriteAction(id, false);
      });
    }, TOAST_DURATION_MS);
    pendingRemovals.current.set(id, timer);

    toast.show(t("removedFromFavorites"), "neutral", {
      label: t("undo"),
      onClick: () => {
        const pending = pendingRemovals.current.get(id);
        if (pending) {
          clearTimeout(pending);
          pendingRemovals.current.delete(id);
        }
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  if (outfits.length === 0) {
    return (
      <EmptyState
        title={t("emptyNoOutfitsBrowse")}
        hint={t("emptyNoOutfitsHint")}
        action={
          <Link
            href="/armari"
            className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
          >
            {t("goToArmari")}
          </Link>
        }
      />
    );
  }

  return (
    <Stack gap={6}>
      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        ariaLabel={t("filtersLabel")}
        options={FILTERS.map((f) => ({
          value: f,
          label: f === "ALL" ? t("filterAll") : t(`axes.${f}`),
        }))}
      />

      {visible.length === 0 ? (
        <EmptyState title={t("axisEmpty")} />
      ) : colorGroups ? (
        <div key={filter} className="panel-enter flex flex-col gap-10">
          {colorGroups.length === 0 ? (
            <EmptyState title={t("axisEmpty")} />
          ) : (
            colorGroups.map((group) => (
              <Stack key={group.colorName} gap={4}>
                <div className="flex items-baseline gap-3 border-b border-border-subtle pb-2">
                  <Text as="span" className="font-serif lowercase">
                    {group.colorName}
                  </Text>
                  <Text variant="caption" tabular tone="secondary">
                    {group.outfits.length}
                  </Text>
                </div>
                <Grid cols="mosaic" gapX={5} gapY={8}>
                  {group.outfits.map((outfit) => (
                    <OutfitTile
                      key={outfit.id}
                      outfit={outfit}
                      palette={paletteMap.get(outfit.paletteId) ?? null}
                      index={numbers.get(outfit.id) ?? 0}
                      mark={outfit.id === todayOutfitId ? t("today") : null}
                      onOpen={() => setOpenOutfitId(outfit.id)}
                      onToggleFavorite={() => handleUnfavorite(outfit.id)}
                    />
                  ))}
                </Grid>
              </Stack>
            ))
          )}
        </div>
      ) : (
        <div key={filter} className="panel-enter">
          <Grid cols="mosaic" gapX={5} gapY={8}>
            {visible.map((outfit) => (
              <OutfitTile
                key={outfit.id}
                outfit={outfit}
                palette={paletteMap.get(outfit.paletteId) ?? null}
                index={numbers.get(outfit.id) ?? 0}
                mark={outfit.id === todayOutfitId ? t("today") : null}
                onOpen={() => setOpenOutfitId(outfit.id)}
                onToggleFavorite={() => handleUnfavorite(outfit.id)}
              />
            ))}
          </Grid>
        </div>
      )}

      {openOutfit && (
        <OutfitSheet
          outfit={openOutfit}
          palette={paletteMap.get(openOutfit.paletteId) ?? null}
          extraCandidates={extraCandidates}
          dayISO={todayISO}
          todayISO={todayISO}
          isCommitted={openOutfit.id === todayOutfitId}
          allowDelete
          onClose={() => setOpenOutfitId(null)}
        />
      )}
    </Stack>
  );
}
