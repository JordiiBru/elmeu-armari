"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCenteredIndex } from "@/lib/useCenteredIndex";
import { CATEGORY_LABELS, SUBTYPE_LABELS } from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import type { GarmentWithColors, Category } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";
import { Icon, Text } from "@/components/ui";

interface Props {
  category: Category;
  garments: GarmentWithColors[];
  /** Fires with the settled (post-scroll) centred card, including on mount. */
  onSelectionChange: (garment: GarmentWithColors | null) => void;
  /** Ids that get a subtle compatibility dot — Sanzo hint from the other
   * rows' current picks, never a filter (see engine.ts `garmentPaletteIds`). */
  compatibleIds?: Set<string>;
  /** True when this category has pieces sitting in the laundry basket. An
   * empty row is a dead end otherwise: pointing at /rentar when the real
   * reason is "your only jumper is a winter one and it's August" sends
   * you somewhere that cannot help. */
  hasDirty?: boolean;
  className?: string;
}

function sameOrder(a: GarmentWithColors[], b: GarmentWithColors[]): boolean {
  return a.length === b.length && a.every((g, i) => g.id === b[i]?.id);
}

/** A wardrobe without photos renders as bare colour blocks, where a polo
 * and a shirt are indistinguishable — the subtype is what tells them
 * apart. Overlaid on the card so it costs no row height. */
function cardLabel(garment: GarmentWithColors): string {
  return garment.subtype
    ? SUBTYPE_LABELS[garment.subtype] ?? CATEGORY_LABELS[garment.category]
    : CATEGORY_LABELS[garment.category];
}

/**
 * One horizontal, snap-scrolling row of the "què em poso?" builder. The
 * centred card is the row's current pick; tapping a neighbour centres it,
 * so picking never requires a precise drag — the whole row is one thumb
 * target on a phone.
 *
 * The row's order can change from outside (a sibling row settling on a
 * new pick re-sorts this one by compatibility). That must never move
 * cards mid-scroll, so an incoming reorder that lands while this row is
 * still moving is queued and applied once it settles.
 */
export function GarmentRow({
  category,
  garments,
  onSelectionChange,
  compatibleIds,
  hasDirty = false,
  className,
}: Props) {
  const [displayGarments, setDisplayGarments] = useState(garments);

  const { scrollerRef, activeIndex, settledIndex, isScrolling, setItemRef, scrollToIndex } =
    useCenteredIndex(displayGarments.length);

  // React's sanctioned "adjust state when a prop changes" pattern: a
  // guarded setState during render, not in an effect, so the row never
  // paints one frame of the stale order. A re-sort that arrives while
  // this row is still moving is held back until it stops, so cards never
  // shift under a thumb mid-gesture.
  if (!isScrolling && !sameOrder(garments, displayGarments)) {
    setDisplayGarments(garments);
  }

  const onSelectionChangeRef = useRef(onSelectionChange);
  useLayoutEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });

  // Applying a reorder always returns the row to its first card: the
  // re-sort puts the most compatible piece there, and leaving the scroll
  // offset untouched would instead hand the user whichever card happened
  // to slide under that position — a pick they never made.
  const lastOrderRef = useRef(displayGarments);
  useEffect(() => {
    if (lastOrderRef.current === displayGarments) return;
    lastOrderRef.current = displayGarments;
    scrollToIndex(0);
    // scrollToIndex only reads refs; listing it would re-run this on
    // every render and fight the guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayGarments]);

  useEffect(() => {
    onSelectionChangeRef.current(displayGarments[settledIndex] ?? null);
  }, [settledIndex, displayGarments]);

  if (displayGarments.length === 0) {
    return (
      <div className={`flex min-h-0 flex-col gap-1 ${className ?? ""}`}>
        <Text variant="caption">{CATEGORY_LABELS[category]}</Text>
        <div className="flex flex-1 min-h-0 items-center justify-center border border-dashed border-border px-4 text-center">
          {hasDirty ? (
            <Link
              href="/bugaderia/rentar"
              className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors"
            >
              {UI.bugaderia.avui.emptyRowDirty}
            </Link>
          ) : (
            <Text variant="small" italic tone="secondary" className="font-serif">
              {UI.bugaderia.avui.emptyRowSeason}
            </Text>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-1 min-h-0 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <Text variant="caption">{CATEGORY_LABELS[category]}</Text>
        {displayGarments.length > 1 && (
          <Text variant="caption" tone="secondary" tabular>
            {activeIndex + 1}/{displayGarments.length}
          </Text>
        )}
      </div>
      <div
        ref={scrollerRef}
        className="flex flex-1 min-h-0 items-stretch snap-x snap-mandatory overflow-x-auto gap-3 scroll-smooth px-[calc(50%-var(--row-card-w)/2)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ ["--row-card-w" as string]: "min(38vw, 9rem)" }}
        tabIndex={0}
      >
        {displayGarments.map((garment, i) => {
          const isActive = i === activeIndex;
          return (
            /* No `h-full` anywhere in here: `height: 100%` needs an
               ancestor with a definite height, and the chain up to
               `body { min-height }` has none — the cards resolved to 0px
               tall and the rows rendered empty. Flex `align-items:
               stretch` sizes the card instead, and the photo fills it
               from an absolutely-positioned layer, so no percentage
               height is involved at any level. */
            <button
              key={garment.id}
              type="button"
              ref={setItemRef(i)}
              onClick={() => scrollToIndex(i)}
              aria-label={`${CATEGORY_LABELS[category]} ${i + 1} de ${displayGarments.length}`}
              aria-current={isActive}
              className={`relative w-[var(--row-card-w)] shrink-0 snap-center self-stretch outline-none transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)] focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isActive ? "opacity-100" : "opacity-40 scale-[0.94]"
              }`}
            >
              <span className="absolute inset-0">
                <PieceThumb garment={garment} className="h-full w-full" />
              </span>
              <span className="absolute inset-x-0 bottom-0 z-10 truncate bg-gradient-to-t from-background/85 to-transparent px-1.5 pb-1 pt-3 text-center font-serif type-caption text-text-primary">
                {cardLabel(garment)}
              </span>
              {compatibleIds?.has(garment.id) && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 z-10 h-1.5 w-1.5 rounded-full bg-text-primary ring-1 ring-background"
                />
              )}
            </button>
          );
        })}
      </div>

      {displayGarments.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label={`${CATEGORY_LABELS[category]} anterior`}
            className="hidden lg:inline-flex absolute -left-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center bg-elevated/90 text-text-primary transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated disabled:opacity-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          >
            <Icon name="chevron-left" size={14} />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === displayGarments.length - 1}
            aria-label={`${CATEGORY_LABELS[category]} següent`}
            className="hidden lg:inline-flex absolute -right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center bg-elevated/90 text-text-primary transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated disabled:opacity-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          >
            <Icon name="chevron-right" size={14} />
          </button>
        </>
      )}
    </div>
  );
}
