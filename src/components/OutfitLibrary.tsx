"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setOutfitFavoriteAction } from "@/app/outfits/actions";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { isInSeason, isWearable } from "@/lib/bugaderia/laundry";
import { groupOutfitsByColor } from "@/lib/outfits/grouping";
import { OutfitTile } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { EmptyState, Grid, SegmentedControl, Stack, Text, useToast } from "@/components/ui";
import { TOAST_DURATION_MS } from "@/components/ui/toast";

/** The categories an outfit is made of — socks and accessories still
 * belong to the day, not to the look, so filtering by them has nothing
 * to group on here. Shoes do belong to the outfit now. */
type Filter = "ALL" | "SWEATER" | "SHIRT" | "PANTS" | "SHOES";

const FILTERS: Filter[] = ["ALL", "SWEATER", "SHIRT", "PANTS", "SHOES"];

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
  season,
}: {
  /** Already ranked by the server, already favourites-only. */
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
  todayOutfitId: string | null;
  /** Today's season, for the in-season toggle below. */
  season: Season;
}) {
  const t = useTranslations("outfits");
  const toast = useToast();
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [filter, setFilter] = useState<Filter>("ALL");
  // On by default: a shorts outfit has no business being recommended in
  // November. Off is one tap away for whoever wants to see everything
  // they've favourited regardless of the calendar.
  const [seasonFilter, setSeasonFilter] = useState<"SEASON" | "ALL">("SEASON");
  const seasonOnly = seasonFilter === "SEASON";
  // Also on by default, same reasoning: a dirty outfit is already blocked
  // from being worn today (see OutfitSheet), so offering it here as if it
  // were a real option is misleading. Its own toggle rather than folded
  // into the season one — season is a preference, this is a fact about
  // the wardrobe right now, and conflating the two names would hide which
  // one to turn off when a look goes missing.
  const [cleanFilter, setCleanFilter] = useState<"CLEAN" | "ALL">("CLEAN");
  const cleanOnly = cleanFilter === "CLEAN";
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
        .filter((o) => !seasonOnly || isInSeason(o, season))
        .filter((o) => !cleanOnly || isWearable(o))
        .sort((a, b) => Number(isWearable(b)) - Number(isWearable(a))),
    [outfits, hiddenIds, seasonOnly, season, cleanOnly],
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
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <Stack gap={1}>
          <Text variant="caption" tone="secondary">
            {t("categoryFilterLabel")}
          </Text>
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            ariaLabel={t("filtersLabel")}
            options={FILTERS.map((f) => ({
              value: f,
              label: f === "ALL" ? t("filterAll") : t(`axes.${f}`),
            }))}
          />
        </Stack>
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <Stack gap={1}>
            <Text variant="caption" tone="secondary">
              {t("seasonFilterLabel")}
            </Text>
            <SegmentedControl<"SEASON" | "ALL">
              value={seasonFilter}
              onChange={setSeasonFilter}
              wrap={false}
              ariaLabel={t("seasonFilterLabel")}
              options={[
                { value: "SEASON", label: t("seasonOnly") },
                { value: "ALL", label: t("allSeasons") },
              ]}
            />
          </Stack>
          <Stack gap={1}>
            <Text variant="caption" tone="secondary">
              {t("cleanFilterLabel")}
            </Text>
            <SegmentedControl<"CLEAN" | "ALL">
              value={cleanFilter}
              onChange={setCleanFilter}
              wrap={false}
              ariaLabel={t("cleanFilterLabel")}
              options={[
                { value: "CLEAN", label: t("cleanOnly") },
                { value: "ALL", label: t("allClean") },
              ]}
            />
          </Stack>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={t("axisEmpty")}
          action={
            (seasonOnly || cleanOnly) && (
              <Stack gap={2} align="center">
                {seasonOnly && (
                  <button
                    type="button"
                    onClick={() => setSeasonFilter("ALL")}
                    className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
                  >
                    {t("allSeasons")}
                  </button>
                )}
                {cleanOnly && (
                  <button
                    type="button"
                    onClick={() => setCleanFilter("ALL")}
                    className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
                  >
                    {t("allClean")}
                  </button>
                )}
              </Stack>
            )
          }
        />
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
