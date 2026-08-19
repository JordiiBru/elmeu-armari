"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { isWearable, rankOutfitsForToday } from "@/lib/bugaderia/laundry";
import { UI } from "@/lib/prendas/ui-strings";
import { OutfitTile } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { EmptyState, Grid, Icon, SegmentedControl, Stack, TextButton } from "@/components/ui";

type Mode = "browse" | "today";
type Filter = "all" | "ready" | "favorites";

/** Desats browses what you own, so it filters. Què em poso answers one
 * question and shows one answer: the outfits you can actually wear. */
const FILTERS: Filter[] = ["all", "favorites", "ready"];

const FILTER_LABELS: Record<Filter, string> = {
  all: UI.outfits.filters.all,
  ready: UI.outfits.filters.ready,
  favorites: UI.outfits.filters.favorites,
};

const EMPTY_FILTER: Record<Filter, string> = {
  all: UI.outfits.emptyNoOutfitsBrowse,
  ready: UI.outfits.emptyReady,
  favorites: UI.outfits.emptyFavorites,
};

function matchesFilter(outfit: SavedOutfit, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "favorites") return outfit.favorite;
  return isWearable(outfit);
}

function QuietLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
    >
      {children}
    </Link>
  );
}

export function OutfitLibrary({
  outfits,
  palettes,
  extraCandidates,
  season,
  todayISO,
  todayOutfitId,
  mode,
}: {
  /** Already ordered by the server for `browse`; `today` re-ranks. */
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  season: Season;
  todayISO: string;
  todayOutfitId: string | null;
  mode: Mode;
}) {
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);

  // In season first, least recently worn first — the order the question
  // "què em poso avui?" actually wants.
  const ordered = useMemo(
    () => (mode === "today" ? rankOutfitsForToday(outfits, season) : outfits),
    [mode, outfits, season],
  );

  const counts = useMemo(() => {
    const entries = FILTERS.map(
      (f) => [f, ordered.filter((o) => matchesFilter(o, f)).length] as const,
    );
    return new Map<Filter, number>(entries);
  }, [ordered]);

  const visible = useMemo(
    () =>
      mode === "today"
        ? ordered.filter(isWearable)
        : ordered.filter((o) => matchesFilter(o, filter)),
    [mode, ordered, filter],
  );

  // The catalogue number belongs to the outfit's place in the collection,
  // not to its place in the current filter — renumbering the same card as
  // you switch tabs would make it read as a different outfit.
  const numbers = useMemo(
    () => new Map(ordered.map((o, i) => [o.id, i])),
    [ordered],
  );

  // Only the first wearable outfit of the day view carries the mark, and
  // only while today is still undecided.
  const suggestedId =
    mode === "today" && !todayOutfitId ? (visible[0]?.id ?? null) : null;

  const openOutfit = outfits.find((o) => o.id === openOutfitId) ?? null;

  // The screen is called "what do I wear?", so it should be able to just
  // answer. Anything but the one you wore last, weighted towards what you
  // have not worn in a while — the ranking already put those first.
  const pickForMe = () => {
    const pool = visible.slice(0, Math.max(3, Math.ceil(visible.length / 2)));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) setOpenOutfitId(pick.id);
  };

  if (outfits.length === 0) {
    return mode === "today" ? (
      <EmptyState
        title={UI.outfits.emptyNoOutfits}
        action={<QuietLink href="/armari">{UI.outfits.goToArmari}</QuietLink>}
      />
    ) : (
      <EmptyState
        title={UI.outfits.emptyNoOutfitsBrowse}
        hint={UI.outfits.emptyNoOutfitsHint}
      />
    );
  }

  return (
    <Stack gap={6}>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        {mode === "browse" ? (
          <>
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
            <QuietLink href="/calendari">
              {UI.outfits.seeCalendar}
              <Icon name="arrow-right" size={12} />
            </QuietLink>
          </>
        ) : (
          visible.length > 1 && (
            <TextButton type="button" onClick={pickForMe} className="ml-auto">
              {UI.outfits.pickForMe}
            </TextButton>
          )
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={mode === "today" ? UI.outfits.emptyNoneReady : EMPTY_FILTER[filter]}
          action={
            mode === "today" ? (
              <QuietLink href="/bugaderia/rentar">{UI.outfits.goToRentar}</QuietLink>
            ) : undefined
          }
        />
      ) : (
        <Grid cols="library" gapX={5} gapY={7} className="md:gap-y-16">
          {visible.map((outfit) => (
            <OutfitTile
              key={outfit.id}
              outfit={outfit}
              palette={paletteMap.get(outfit.paletteId) ?? null}
              index={numbers.get(outfit.id) ?? 0}
              suggested={outfit.id === suggestedId}
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
