"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { isWearable } from "@/lib/bugaderia/laundry";
import { UI } from "@/lib/prendas/ui-strings";
import { groupOutfitsByTop } from "@/lib/outfits/grouping";
import { OutfitTile, pieceLabel, pieceTint } from "./OutfitTile";
import { PieceThumb } from "./PieceThumb";
import { OutfitSheet } from "./OutfitSheet";
import { EmptyState, Grid, SegmentedControl, Stack, Text } from "@/components/ui";

type Filter = "all" | "ready";

// "a punt" first and selected: the screen asks what you can wear now, and
// an outfit whose shirt is in the basket is not an answer to that.
const FILTERS: Filter[] = ["ready", "all"];

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
 * Filed under the piece each look is built around, so it reads like a
 * wardrobe rail: pull a shirt off the pile in the morning, find it here,
 * and everything you have ever built with it is underneath.
 *
 * That also makes the catalogue numbers mean something. They used to
 * follow the day's ranking, which is partly "least recently worn" — so
 * the same outfit was n004 today and n007 tomorrow. Filed by top they
 * only move when the wardrobe does.
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

  const groups = useMemo(() => groupOutfitsByTop(visible), [visible]);

  // The catalogue number belongs to the outfit's place in the whole
  // collection, not to its place in the current filter — renumbering the
  // same card as you narrow the list would make it read as a different
  // outfit. So it is numbered off the unfiltered rail.
  const numbers = useMemo(() => {
    const all = groupOutfitsByTop(outfits).flatMap((g) => g.outfits);
    return new Map(all.map((o, i) => [o.id, i]));
  }, [outfits]);

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
        <Stack gap={8} className="md:gap-14">
          {groups.map((group) => (
            <Stack as="section" key={group.top?.id ?? "sense-top"} gap={5}>
              {/* The piece itself is the heading. A photograph of the
                  shirt is what you match against the one in your hand;
                  its name is only there to confirm it. */}
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                {group.top ? (
                  <PieceThumb
                    garment={group.top}
                    thumb
                    sizes="48px"
                    className="h-12 w-12 flex-shrink-0"
                  />
                ) : null}
                <h3 className="min-w-0 font-serif lowercase leading-tight">
                  {group.top ? pieceLabel(group.top) : UI.outfits.noTop}
                  {/* Every shirt is a "samarreta", so the kind alone
                      names eight headers the same. The colour is what
                      tells them apart on the page, next to the
                      photograph that tells them apart in your hand. */}
                  {group.top && pieceTint(group.top) && (
                    <Text as="span" variant="small" italic tone="secondary">
                      {" "}· {pieceTint(group.top)}
                    </Text>
                  )}
                </h3>
                <Text variant="caption" tabular className="ml-auto flex-shrink-0">
                  {group.outfits.length}
                </Text>
              </div>

              <Grid cols="library" gapX={5} gapY={7} className="md:gap-y-12">
                {group.outfits.map((outfit) => (
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
            </Stack>
          ))}
        </Stack>
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
