"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { isWearable } from "@/lib/bugaderia/laundry";
import { groupOutfitsBy } from "@/lib/outfits/grouping";
import { UI } from "@/lib/prendas/ui-strings";
import { OutfitTile, pieceTint } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { OutfitBottomSheet } from "./OutfitBottomSheet";
import { PieceThumb } from "./PieceThumb";
import {
  EmptyState,
  Grid,
  Icon,
  SegmentedControl,
  Stack,
  Text,
  TextButton,
} from "@/components/ui";

/** The three ways to index the collection. Shirts lead: that is the one
 * you have in your hand most mornings. Narrowed to these three because
 * they are the only categories an outfit is made of — shoes, socks and
 * accessories belong to the day, not to the look. */
type Axis = "SHIRT" | "PANTS" | "SWEATER";

const AXES: Axis[] = ["SHIRT", "PANTS", "SWEATER"];

/**
 * The whole collection, indexed by whichever piece you have decided on.
 * Every look built on one shirt sits under that shirt, and the tabs
 * re-index the same collection by trousers or by sweater — because some
 * mornings the decision starts at the other end.
 *
 * Collapsed by default, all of it. Open, this is a photograph of every
 * outfit you own, which is a lot of page to scroll past to reach one
 * shirt; closed it is a rail of pieces you take in at a glance. Hold as
 * many open as you like — it is a wardrobe, not an accordion that
 * resents you.
 *
 * A group ends in the way out of it: "veure'n més amb aquesta peça"
 * runs the matcher on the same piece. Your looks and every look the
 * engine can build with that piece used to live in different rooms —
 * these here, the other two hundred behind the piece over in the
 * wardrobe — which is the same question asked twice in two places. Now
 * the short list is on top and the long one is one tap under it, and
 * saving means exactly one thing: promoting something out of the long
 * list into the short one.
 *
 * The clean/dirty filter is gone. It was a third selector on a screen
 * that now has two, and a tile already says "per rentar" on its own
 * face. Instead the wearable ones come first inside each group, and a
 * piece with nothing wearable left reads dimmer in the rail — the same
 * information, no control.
 */
export function OutfitLibrary({
  outfits,
  allGarments,
  palettes,
  extraCandidates,
  savedOutfitKeys,
  todayISO,
  todayOutfitId,
}: {
  /** Already ranked by the server. */
  outfits: SavedOutfit[];
  /** The whole wardrobe, for the matcher behind "veure'n més". */
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  /** Combinations already owned, so the matcher greys them out. */
  savedOutfitKeys: string[];
  todayISO: string;
  todayOutfitId: string | null;
}) {
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [axis, setAxis] = useState<Axis>(AXES[0]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);
  const [combineFor, setCombineFor] = useState<GarmentWithColors | null>(null);
  // Held here rather than in the combiner, which unmounts every time you
  // close it — reopening it on the same piece would otherwise offer to
  // save what you had just saved.
  const [savedHere, setSavedHere] = useState<string[]>([]);
  const router = useRouter();

  const groups = useMemo(
    () =>
      groupOutfitsBy(outfits, axis).map((group) => ({
        ...group,
        outfits: [...group.outfits].sort(
          (a, b) => Number(isWearable(b)) - Number(isWearable(a)),
        ),
      })),
    [outfits, axis],
  );

  // Numbered off one fixed index — the shirt rail — rather than whichever
  // tab you are on, so an outfit keeps the same catalogue number however
  // you arrived at it.
  const numbers = useMemo(() => {
    const byShirt = groupOutfitsBy(outfits, "SHIRT").flatMap((g) => g.outfits);
    const seen = new Set(byShirt.map((o) => o.id));
    const rest = outfits.filter((o) => !seen.has(o.id));
    return new Map([...byShirt, ...rest].map((o, i) => [o.id, i]));
  }, [outfits]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
      <SegmentedControl<Axis>
        value={axis}
        onChange={setAxis}
        ariaLabel={UI.outfits.axisLabel}
        options={AXES.map((c) => ({ value: c, label: UI.outfits.axes[c] }))}
      />

      {groups.length === 0 ? (
        <EmptyState title={UI.outfits.axisEmpty} />
      ) : (
        // Keyed on the axis so switching tab re-enters instead of
        // swapping dry, the same way the shoe picker does.
        <div key={axis} className="panel-enter flex flex-col">
          {groups.map((group) => {
            const isOpen = expanded.has(group.piece.id);
            const anyWearable = group.outfits.some(isWearable);
            return (
              <div key={group.piece.id} className="border-b border-border-subtle">
                <button
                  type="button"
                  onClick={() => toggle(group.piece.id)}
                  aria-expanded={isOpen}
                  className={`group flex w-full items-center gap-4 py-3 text-left outline-none transition-opacity duration-[var(--duration-base)] focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    anyWearable ? "" : "opacity-50"
                  }`}
                >
                  <PieceThumb
                    garment={group.piece}
                    thumb
                    sizes="48px"
                    className="h-12 w-12 flex-shrink-0"
                  />
                  {/* The tab already said "samarretes", so the row does not
                      repeat it. What is left is the only thing that tells
                      one from another in words. */}
                  <Text as="span" className="min-w-0 truncate font-serif lowercase">
                    {pieceTint(group.piece)}
                  </Text>
                  <Text variant="caption" tabular className="ml-auto flex-shrink-0">
                    {group.outfits.length}
                  </Text>
                  {/* The whole affordance, and the same one the wardrobe
                      filters use: a chevron that turns over when it opens. */}
                  <span
                    aria-hidden
                    className={`flex-shrink-0 text-text-secondary transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:text-text-primary ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <Icon name="chevron-down" size={14} />
                  </span>
                </button>

                <div className="collapse-panel" data-open={isOpen}>
                  <div>
                    <Stack gap={5} className="pb-6 pt-1">
                      <Grid cols="library" gapX={5} gapY={6}>
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
                      {group.piece.colors.length > 0 && (
                        <TextButton
                          type="button"
                          tone="secondary"
                          onClick={() => setCombineFor(group.piece)}
                          className="self-start"
                        >
                          {UI.outfits.seeMore}
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

      {combineFor && (
        <OutfitBottomSheet
          garment={combineFor}
          allGarments={allGarments}
          palettes={palettes}
          savedOutfitKeys={[...savedOutfitKeys, ...savedHere]}
          onOutfitSaved={(key) => {
            setSavedHere((prev) => [...prev, key]);
            // A soft refresh, so the new look joins the rail underneath
            // without tearing down which groups you have open.
            router.refresh();
          }}
          onClose={() => setCombineFor(null)}
        />
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
