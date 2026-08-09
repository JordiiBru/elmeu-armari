"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks which item of a horizontal snap-scroller sits centred in the
 * viewport, from actual scroll position rather than IntersectionObserver
 * threshold crossings — with peeking neighbours several items can be
 * simultaneously "intersecting" at low ratios, which made a
 * threshold-based version stick on the first item. `getBoundingClientRect`
 * for both the container and each item, not `offsetLeft` vs `scrollLeft`:
 * those two are only comparable when the container happens to be a CSS
 * positioning context, which it usually isn't — mixing them silently
 * measures against the wrong origin and the index barely ever moves.
 *
 * Extracted from the "què em poso?" outfit carousel so the row builder's
 * per-category rows can reuse the same centring instead of reimplementing
 * it (and its bugs) from scratch.
 */
const SETTLE_DELAY_MS = 150;

export function useCenteredIndex(itemCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Mirrors activeIndex, but only once scrolling has actually stopped for
  // a beat — consumers that react to the pick (the builder's cross-row
  // reordering) must never fire mid-gesture, only once it settles.
  const [settledIndex, setSettledIndex] = useState(0);
  // Whether a scroll is in flight. Gating "may I reorder this row now?"
  // on this rather than on pointer events avoids a stuck state: a pointer
  // released outside the scroller never fires pointerup on it, which left
  // the row permanently believing it was still being touched.
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Truncated to the current length so a shrinking list (unticking the
    // sweater row, a reorder to fewer cards) leaves no detached nodes
    // behind for the centring pass to measure.
    itemRefs.current.length = itemCount;
    let raf = 0;
    let settleTimer = 0;
    const updateActive = () => {
      const containerRect = el.getBoundingClientRect();
      const viewportCenter = containerRect.left + containerRect.width / 2;
      let closest = 0;
      let closestDistance = Infinity;
      itemRefs.current.forEach((item, i) => {
        if (!item) return;
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      });
      setActiveIndex(closest);
      return closest;
    };
    const onScroll = () => {
      setIsScrolling(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const closest = updateActive();
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          setSettledIndex(closest);
          setIsScrolling(false);
        }, SETTLE_DELAY_MS);
      });
    };
    setSettledIndex(updateActive());
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
    };
  }, [itemCount]);

  const setItemRef = (index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  };

  const scrollToIndex = (index: number) => {
    itemRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  return { scrollerRef, activeIndex, settledIndex, isScrolling, setItemRef, scrollToIndex };
}
