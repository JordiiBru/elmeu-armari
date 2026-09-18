"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { isDirty } from "@/lib/bugaderia/laundry";
import { filterGarments, sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { groupOutfitsBy } from "@/lib/outfits/grouping";
import { useViewTransition } from "@/lib/useViewTransition";
import { OutfitTile, pieceTint } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { OutfitBottomSheet } from "./OutfitBottomSheet";
import { PieceThumb } from "./PieceThumb";
import { Grid, Icon, SegmentedControl, Sheet, Stack, Text, TextButton } from "@/components/ui";

/** Only the categories an outfit is built from — same four axes the
 * favourites filter already indexes by, sabates included now that a
 * shoe is a full member of the outfit rather than a day-only pick. */
type DiscoverAxis = "SWEATER" | "SHIRT" | "PANTS" | "SHOES";
const DISCOVER_AXES: DiscoverAxis[] = ["SWEATER", "SHIRT", "PANTS", "SHOES"];

interface Props {
  allGarments: GarmentWithColors[];
  allOutfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  /** For the combine sheet's own dedupe — greys out a palette already
   * saved with the piece it is offered on. */
  savedOutfitKeys: string[];
  /** Shared with the app-wide catalogue numbering, computed once off
   * every saved outfit so a look keeps the same number here as it does
   * favourited in Desats. */
  numbers: Map<string, number>;
  todayISO: string;
  todayOutfitId: string | null;
  season: Season;
  /** Same toggles as the favourites list, read here rather than
   * duplicated: opening "descobreix" respects whatever you already set
   * Desats to, instead of starting the exploration over. */
  seasonOnly: boolean;
  cleanOnly: boolean;
  sweaterInSeason: boolean;
  shortsInSeason: boolean;
  onOutfitSaved: () => void;
  onClose: () => void;
}

type Step =
  | { kind: "rail" }
  | { kind: "detail"; outfit: SavedOutfit }
  | { kind: "combine"; garment: GarmentWithColors };

/**
 * The wardrobe rail, brought back as its own sheet rather than folded
 * into "què em poso?" itself: Desats is what this page opens on and
 * should read as, and a rail of every piece you own is a browsing tool,
 * not the answer. One piece at a time, expanded to what is already
 * saved with it, with the exact same "més combinacions" a step further
 * — reusing /armari's own combine sheet rather than a second engine
 * call site for the same question.
 *
 * Unlike Desats, a piece with nothing saved yet still gets a row: the
 * point of browsing by piece is finding the one nobody has combined
 * yet, and main once hid exactly those.
 */
export function DiscoverSheet({
  allGarments,
  allOutfits,
  palettes,
  extraCandidates,
  savedOutfitKeys,
  numbers,
  todayISO,
  todayOutfitId,
  season,
  seasonOnly,
  cleanOnly,
  sweaterInSeason,
  shortsInSeason,
  onOutfitSaved,
  onClose,
}: Props) {
  const t = useTranslations("outfits");
  const tLabel = useTranslations("labels");
  const [axis, setAxis] = useState<DiscoverAxis>(DISCOVER_AXES[0]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>({ kind: "rail" });
  // Saved during this visit, so reopening the combine sheet on the same
  // piece does not offer to save what you just saved — the sheet
  // unmounts on every step change and would otherwise forget.
  const [savedHere, setSavedHere] = useState<string[]>([]);
  const runViewTransition = useViewTransition();
  // The rail's own sheet slides up normally the first time — that is a
  // real open, triggered by the "descobreix" button. Only once a step
  // has taken you away from it does coming back count as stepping back
  // into a sibling sheet rather than opening one.
  const [steppedAway, setSteppedAway] = useState(false);
  const goToStep = (next: Step) => {
    setSteppedAway(true);
    runViewTransition(() => setStep(next));
  };

  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);

  const outfitsByPiece = useMemo(() => {
    const groups = groupOutfitsBy(allOutfits, axis);
    return new Map(groups.map((g) => [g.piece.id, g.outfits]));
  }, [allOutfits, axis]);

  // Pieces with something already saved lead the rail — they are the
  // proven starting points — and nothing saved yet is not the same as
  // filtered out: it still gets a row, just after the ones that already
  // have an answer.
  const axisGarments = useMemo(() => {
    const base = sortByWardrobeOrder(allGarments.filter((g) => g.category === axis));
    const filtered = filterGarments(base, {
      categories: [],
      seasons: seasonOnly ? [season] : [],
      fits: [],
      textures: [],
      lengths: [],
      colors: [],
      states: cleanOnly ? ["clean"] : [],
      query: "",
    });
    const withOutfits = filtered.filter((g) => (outfitsByPiece.get(g.id)?.length ?? 0) > 0);
    const withoutOutfits = filtered.filter((g) => (outfitsByPiece.get(g.id)?.length ?? 0) === 0);
    return [...withOutfits, ...withoutOutfits];
  }, [allGarments, axis, seasonOnly, season, cleanOnly, outfitsByPiece]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (step.kind === "combine") {
    return (
      <OutfitBottomSheet
        garment={step.garment}
        allGarments={allGarments}
        palettes={palettes}
        savedOutfitKeys={[...savedOutfitKeys, ...savedHere]}
        onOutfitSaved={(key) => {
          setSavedHere((prev) => [...prev, key]);
          onOutfitSaved();
        }}
        onBack={() => goToStep({ kind: "rail" })}
        onClose={onClose}
        sweaterInSeason={sweaterInSeason}
        shortsInSeason={shortsInSeason}
        skipEnter
      />
    );
  }

  if (step.kind === "detail") {
    return (
      <OutfitSheet
        outfit={step.outfit}
        palette={paletteMap.get(step.outfit.paletteId) ?? null}
        extraCandidates={extraCandidates}
        dayISO={todayISO}
        todayISO={todayISO}
        isCommitted={step.outfit.id === todayOutfitId}
        allowDelete
        onClose={() => goToStep({ kind: "rail" })}
        skipEnter
      />
    );
  }

  return (
    <Sheet
      onClose={onClose}
      size="xl"
      fill
      skipEnter={steppedAway}
      label={t("discoverSheetLabel", { category: tLabel(`category.${axis}`) })}
      header={
        <Stack gap={1}>
          <Text variant="caption">{t("discover")}</Text>
          <h2 className="type-title lowercase">{tLabel(`category.${axis}`)}</h2>
        </Stack>
      }
      headerBelow={
        // Four longer words than the season/clean toggles ever carry —
        // wrapping them wastes a whole row on a phone, so this scrolls
        // sideways instead, the same as the combine sheet's own piece
        // filter row just below it.
        <div className="px-6 py-3 overflow-x-auto">
          <SegmentedControl<DiscoverAxis>
            value={axis}
            onChange={setAxis}
            wrap={false}
            ariaLabel={t("discoverAxisAria")}
            options={DISCOVER_AXES.map((c) => ({ value: c, label: t(`axes.${c}`) }))}
          />
        </div>
      }
    >
      {axisGarments.length === 0 ? (
        <Text italic tone="secondary" className="font-serif text-center py-8">
          {t("discoverAxisEmpty")}
        </Text>
      ) : (
        <div key={axis} className="panel-enter flex flex-col">
          {axisGarments.map((piece) => {
            const isOpen = expanded.has(piece.id);
            const outfitsForPiece = outfitsByPiece.get(piece.id) ?? [];
            const dirty = isDirty(piece);
            return (
              <div key={piece.id} className="border-b border-border-subtle">
                <button
                  type="button"
                  onClick={() => toggle(piece.id)}
                  aria-expanded={isOpen}
                  className={`group flex w-full items-center gap-4 py-3 text-left outline-none transition-opacity duration-[var(--duration-base)] focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    dirty ? "opacity-50" : ""
                  }`}
                >
                  <PieceThumb
                    garment={piece}
                    thumb
                    sizes="48px"
                    className="h-12 w-12 flex-shrink-0"
                  />
                  <Text as="span" className="min-w-0 truncate font-serif lowercase">
                    {pieceTint(piece)}
                  </Text>
                  <Text variant="caption" tabular className="ml-auto flex-shrink-0">
                    {outfitsForPiece.length}
                  </Text>
                  <span
                    aria-hidden
                    className={`flex-shrink-0 text-text-secondary transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:text-text-primary ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <Icon name="chevron-down" size={14} />
                  </span>
                </button>

                <div className="collapse-panel" data-open={isOpen} inert={!isOpen}>
                  <div>
                    <Stack gap={5} className="pb-9 pt-1">
                      {outfitsForPiece.length > 0 ? (
                        <Grid cols="library" gapX={5} gapY={6}>
                          {outfitsForPiece.map((outfit) => (
                            <OutfitTile
                              key={outfit.id}
                              outfit={outfit}
                              palette={paletteMap.get(outfit.paletteId) ?? null}
                              index={numbers.get(outfit.id) ?? 0}
                              mark={outfit.id === todayOutfitId ? t("today") : null}
                              onOpen={() => goToStep({ kind: "detail", outfit })}
                            />
                          ))}
                        </Grid>
                      ) : (
                        <Text italic tone="secondary" className="font-serif">
                          {t("discoverPieceEmpty")}
                        </Text>
                      )}
                      {piece.colors.length > 0 && (
                        <TextButton
                          type="button"
                          tone="secondary"
                          onClick={() => goToStep({ kind: "combine", garment: piece })}
                          className="self-start"
                        >
                          {t("seeMore")}
                          <Icon name="arrow-right" size={12} />
                        </TextButton>
                      )}
                    </Stack>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
