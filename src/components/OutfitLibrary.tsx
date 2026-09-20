"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setOutfitFavoriteAction } from "@/app/outfits/actions";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { isInSeason, isWearable } from "@/lib/bugaderia/laundry";
import { groupOutfitsBy } from "@/lib/outfits/grouping";
import { OutfitTile } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { DiscoverSheet } from "./DiscoverSheet";
import {
  Button,
  EmptyState,
  Grid,
  Icon,
  SegmentedControl,
  Stack,
  Text,
  useToast,
} from "@/components/ui";
import { TOAST_DURATION_MS } from "@/components/ui/toast";
import { InfoHint } from "@/components/ui";

/** The categories an outfit is made of — accessories still
 * belong to the day, not to the look, so filtering by them has nothing
 * to group on here. Shoes do belong to the outfit now. */
type Filter = "ALL" | "SWEATER" | "SHIRT" | "PANTS" | "SHOES";

const FILTERS: Filter[] = ["ALL", "SWEATER", "SHIRT", "PANTS", "SHOES"];

/** A caption above a control, set apart from the control's own labels
 * on purpose: both used to be the same small uppercase caps and read as
 * one continuous row of chips. Serif italic against sans-serif caps is
 * the same pairing the rest of the app already uses for a quiet label
 * over a louder value. */
function FilterLabel({
  children,
  className,
  hint,
}: {
  children: React.ReactNode;
  className?: string;
  /** An `InfoHint` for a control the label alone does not explain. */
  hint?: React.ReactNode;
}) {
  return (
    <Text variant="small" italic tone="secondary" className={`font-serif ${className ?? ""}`}>
      {children}
      {hint && <span className="ml-3">{hint}</span>}
    </Text>
  );
}

/**
 * "Què em poso?"'s whole answer, now that discovery lives in the
 * wardrobe: your favourited outfits, filterable by what you feel like
 * wearing, as a mosaic rather than a list. Tapping one opens it straight
 * onto today, because that is the only question this screen exists to
 * settle in the morning.
 *
 * A filter is also a sort order, not just a narrowing one: choosing
 * "pantalons" does not just hide outfits without trousers, it clusters
 * the rest by which trousers — one flat four-column mosaic, not a
 * colour-grouped list one row deep that made scrolling the whole point.
 *
 * "Descobreix" is the wardrobe's piece-by-piece rail, back as its own
 * sheet rather than a second tab fighting the mosaic for the top of the
 * screen: this page opens on Desats and should read as Desats, and
 * discovery is one explicit tap away, not the other half of the layout.
 */
export function OutfitLibrary({
  outfits,
  allOutfits,
  allGarments,
  palettes,
  extraCandidates,
  savedOutfitKeys,
  todayISO,
  todayOutfitId,
  season,
  sweaterInSeason,
  shortsInSeason,
}: {
  /** Already ranked by the server, already favourites-only. */
  outfits: SavedOutfit[];
  /** Every saved outfit, favourited or not, ranked the same way — what
   * "descobreix" shows already exists for a piece, and where every
   * outfit's stable catalogue number comes from. */
  allOutfits: SavedOutfit[];
  /** The whole wardrobe, for "descobreix"'s rail and its combine sheet. */
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  /** Combinations already owned, so the combine sheet greys them out. */
  savedOutfitKeys: string[];
  todayISO: string;
  todayOutfitId: string | null;
  /** Today's season, for the in-season toggle below. */
  season: Season;
  sweaterInSeason: boolean;
  shortsInSeason: boolean;
}) {
  const t = useTranslations("outfits");
  const tHelp = useTranslations("help");
  // One place to build a hint, so each control only says what it means.
  const hint = (text: string, section: string) => (
    <InfoHint label={tHelp("hintLabel")} href={`/ajuda#${section}`} moreLabel={tHelp("more")}>
      {text}
    </InfoHint>
  );
  const toast = useToast();
  const router = useRouter();
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [filter, setFilter] = useState<Filter>("ALL");
  // On by default: a shorts outfit has no business being recommended in
  // November. Off is one tap away for whoever wants to see everything
  // they've favourited regardless of the calendar. Shared with
  // "descobreix" — opening it should not restart the exploration.
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
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  // Tiles are dense and thumb-reachable, so a mistap on the star is the
  // likely failure mode, not the exception. The write is held for exactly
  // as long as the toast offering to undo it is on screen — see
  // TOAST_DURATION_MS — rather than committed the instant the star is hit.
  const pendingRemovals = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Off the full saved collection, not just the favourites shown here —
  // an outfit discovered but not (yet) favourited still needs a number
  // the moment "descobreix" shows it, and it has to be the same number
  // if it is favourited later.
  const numbers = useMemo(
    () => new Map(allOutfits.map((o, i) => [o.id, i])),
    [allOutfits],
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

  // A category filter clusters by piece rather than narrowing to a
  // sparser list: every look built on the same trousers sits together,
  // wardrobe-ordered, still one dense four-column mosaic rather than a
  // heading per colour with two tiles under it.
  const ordered = useMemo(
    () => (filter === "ALL" ? visible : groupOutfitsBy(visible, filter).flatMap((g) => g.outfits)),
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

  const discoverButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setDiscoverOpen(true)}
      className="flex-shrink-0"
    >
      <Icon name="sparkle" size={13} className="mr-2" />
      {t("discover")}
    </Button>
  );

  return (
    <Stack gap={6}>
      {/* Column and horizontal scroll both tried and dropped: a column
          cost too much height (five rows to read past before the
          mosaic starts), scrolling hid half the options off-screen at
          all times. A three-column grid gives two balanced rows
          instead of either — nothing off-screen, nothing stranded
          alone on its own line. "descobreix" centres under it on a
          phone rather than floating to one side of a two-row block;
          sm: and up it goes back to sitting beside a single line. */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <Stack gap={1} className="w-full min-w-0 sm:w-auto">
          <FilterLabel hint={hint(tHelp("hints.pieceFilter"), "flow")}>
            {t("categoryFilterLabel")}
          </FilterLabel>
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            ariaLabel={t("filtersLabel")}
            grid
            options={FILTERS.map((f) => ({
              value: f,
              label: f === "ALL" ? t("filterAll") : t(`axes.${f}`),
            }))}
          />
        </Stack>
        <div className="flex items-center gap-3 self-center sm:self-auto">
          {discoverButton}
          {hint(tHelp("hints.discover"), "flow")}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <Stack gap={1}>
          <FilterLabel hint={hint(tHelp("hints.seasonFilter"), "rules")}>
            {t("seasonFilterLabel")}
          </FilterLabel>
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
        <Stack gap={1} className="sm:border-l sm:border-border-subtle sm:pl-10">
          <FilterLabel hint={hint(tHelp("hints.cleanFilter"), "rules")}>
            {t("cleanFilterLabel")}
          </FilterLabel>
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

      {visible.length === 0 ? (
        outfits.length === 0 ? (
          <EmptyState
            title={t("emptyNoOutfitsBrowse")}
            hint={t("emptyNoOutfitsHintDiscover")}
            action={
              allGarments.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDiscoverOpen(true)}
                  className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
                >
                  {t("discover")}
                </button>
              ) : (
                <Link
                  href="/armari"
                  className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
                >
                  {t("goToArmari")}
                </Link>
              )
            }
          />
        ) : (
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
        )
      ) : (
        <div key={filter} className="panel-enter">
          <Grid cols="mosaic" gapX={5} gapY={8}>
            {ordered.map((outfit) => (
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

      {discoverOpen && (
        <DiscoverSheet
          allGarments={allGarments}
          allOutfits={allOutfits}
          palettes={palettes}
          extraCandidates={extraCandidates}
          savedOutfitKeys={savedOutfitKeys}
          numbers={numbers}
          todayISO={todayISO}
          todayOutfitId={todayOutfitId}
          season={season}
          seasonOnly={seasonOnly}
          cleanOnly={cleanOnly}
          sweaterInSeason={sweaterInSeason}
          shortsInSeason={shortsInSeason}
          onOutfitSaved={() => router.refresh()}
          onClose={() => setDiscoverOpen(false)}
        />
      )}
    </Stack>
  );
}
