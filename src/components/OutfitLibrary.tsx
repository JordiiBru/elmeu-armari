"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { isWearable } from "@/lib/bugaderia/laundry";
import { UI } from "@/lib/prendas/ui-strings";
import { OutfitTile } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { EmptyState, Grid, SegmentedControl, Stack } from "@/components/ui";

type Filter = "all" | "ready";

const FILTERS: Filter[] = ["all", "ready"];

const FILTER_LABELS: Record<Filter, string> = {
  all: UI.outfits.filters.all,
  ready: UI.outfits.filters.ready,
};

const EMPTY_FILTER: Record<Filter, string> = {
  all: UI.outfits.emptyNoOutfitsBrowse,
  ready: UI.outfits.emptyReady,
};

function matchesFilter(outfit: SavedOutfit, filter: Filter): boolean {
  return filter === "all" || isWearable(outfit);
}

/**
 * The whole collection of saved outfits, the bottom stratum of "què em
 * poso?". It only browses: the day's answer lives above it in
 * `TodayPlate`, and the week between the two.
 *
 * `outfits` arrives already ranked (in season first, least recently worn
 * first), so the order the grid shows is the order the question wants.
 * Filtering never reorders — the one filter narrows the same list.
 */
export function OutfitLibrary({
  outfits,
  palettes,
  extraCandidates,
  todayISO,
  todayOutfitId,
}: {
  /** Already ranked by the server. */
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
  todayOutfitId: string | null;
}) {
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const entries = FILTERS.map(
      (f) => [f, outfits.filter((o) => matchesFilter(o, f)).length] as const,
    );
    return new Map<Filter, number>(entries);
  }, [outfits]);

  const visible = useMemo(
    () => outfits.filter((o) => matchesFilter(o, filter)),
    [outfits, filter],
  );

  // The catalogue number belongs to the outfit's place in the collection,
  // not to its place in the current filter — renumbering the same card as
  // you narrow the list would make it read as a different outfit.
  const numbers = useMemo(
    () => new Map(outfits.map((o, i) => [o.id, i])),
    [outfits],
  );

  const openOutfit = outfits.find((o) => o.id === openOutfitId) ?? null;

  if (outfits.length === 0) {
    return (
      <EmptyState
        title={UI.outfits.emptyNoOutfitsBrowse}
        hint={UI.outfits.emptyNoOutfitsHint}
        action={
          <Link
            href="/armari"
            className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
          >
            {UI.outfits.goToArmari}
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
        ariaLabel={UI.outfits.filtersLabel}
        options={FILTERS.map((f) => ({
          value: f,
          label: (
            <>
              {FILTER_LABELS[f]}
              <span className="tabular-nums"> {counts.get(f) ?? 0}</span>
            </>
          ),
        }))}
      />

      {visible.length === 0 ? (
        <EmptyState title={EMPTY_FILTER[filter]} />
      ) : (
        <Grid cols="library" gapX={5} gapY={7} className="md:gap-y-16">
          {visible.map((outfit) => (
            <OutfitTile
              key={outfit.id}
              outfit={outfit}
              palette={paletteMap.get(outfit.paletteId) ?? null}
              index={numbers.get(outfit.id) ?? 0}
              mark={outfit.id === todayOutfitId ? UI.outfits.today : null}
              onOpen={() => setOpenOutfitId(outfit.id)}
            />
          ))}
        </Grid>
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
