"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCenteredIndex } from "@/lib/useCenteredIndex";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
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
  className?: string;
}

function sameOrder(a: GarmentWithColors[], b: GarmentWithColors[]): boolean {
  return a.length === b.length && a.every((g, i) => g.id === b[i]?.id);
}

/**
 * One horizontal, snap-scrolling row of the "què em poso?" builder. The
 * centred card is the row's current pick — there is no separate tap-to-
 * select, the same convention as the outfit carousel this was extracted
 * alongside (see `useCenteredIndex`).
 *
 * The row's order can change from outside (a sibling row settling on a
 * new pick re-sorts this one by compatibility) — that must never move
 * cards under a thumb that's mid-drag on THIS row, so an incoming reorder
 * while touching is queued and only applied once the touch ends and the
 * row itself settles.
 */
export function GarmentRow({
  category,
  garments,
  onSelectionChange,
  compatibleIds,
  className,
}: Props) {
  const [displayGarments, setDisplayGarments] = useState(garments);
  const touchingRef = useRef(false);
  const pendingRef = useRef<GarmentWithColors[] | null>(null);

  const { scrollerRef, activeIndex, settledIndex, setItemRef, scrollToIndex } = useCenteredIndex(
    displayGarments.length,
  );

  useEffect(() => {
    setDisplayGarments((current) => {
      if (sameOrder(garments, current)) return current;
      if (touchingRef.current) {
        pendingRef.current = garments;
        return current;
      }
      return garments;
    });
  }, [garments]);

  const flushPendingReorder = () => {
    if (touchingRef.current || !pendingRef.current) return;
    const next = pendingRef.current;
    pendingRef.current = null;
    setDisplayGarments(next);
    requestAnimationFrame(() => scrollToIndex(0));
  };

  const onSelectionChangeRef = useRef(onSelectionChange);
  useLayoutEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });

  useEffect(() => {
    onSelectionChangeRef.current(displayGarments[settledIndex] ?? null);
    flushPendingReorder();
    // flushPendingReorder reads refs only — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledIndex, displayGarments]);

  const handleTouchEnd = () => {
    touchingRef.current = false;
    flushPendingReorder();
  };

  if (displayGarments.length === 0) {
    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
        <Text variant="caption">{CATEGORY_LABELS[category]}</Text>
        <div className="flex flex-1 min-h-0 items-center justify-center border border-border">
          <Link
            href="/bugaderia/rentar"
            className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors"
          >
            {UI.bugaderia.avui.emptyRow}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-1 min-h-0 ${className ?? ""}`}>
      <Text variant="caption">{CATEGORY_LABELS[category]}</Text>
      <div
        ref={scrollerRef}
        className="flex flex-1 min-h-0 snap-x snap-mandatory overflow-x-auto gap-3 scroll-smooth"
        tabIndex={0}
        onPointerDown={() => {
          touchingRef.current = true;
        }}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchEnd}
      >
        {displayGarments.map((garment, i) => (
          <div
            key={garment.id}
            ref={setItemRef(i)}
            className={`relative h-full w-auto aspect-[3/4] shrink-0 snap-center transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
              i === activeIndex ? "opacity-100" : "opacity-50"
            }`}
          >
            <PieceThumb garment={garment} className="h-full w-full" />
            {compatibleIds?.has(garment.id) && (
              <span
                aria-hidden
                className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-text-primary"
              />
            )}
          </div>
        ))}
      </div>

      {displayGarments.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            aria-label={`${CATEGORY_LABELS[category]} anterior`}
            className="hidden lg:inline-flex absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center bg-elevated/90 text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Icon name="chevron-left" size={14} />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            aria-label={`${CATEGORY_LABELS[category]} següent`}
            className="hidden lg:inline-flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center bg-elevated/90 text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Icon name="chevron-right" size={14} />
          </button>
        </>
      )}
    </div>
  );
}
