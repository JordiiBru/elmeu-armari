"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import { ArmariGrid } from "./ArmariGrid";
import { OutfitBuilder } from "./OutfitBuilder";
import { SavedOutfitsView } from "./SavedOutfitsView";

const TABS = [
  { id: "peces", label: "Peces" },
  { id: "combinar", label: "Combinar" },
  { id: "desats", label: "Desats" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Minimum horizontal distance to count as an intentional swipe. */
const SWIPE_THRESHOLD_PX = 60;
/** Ignore the gesture if the vertical drift exceeded this ratio — user was
 *  scrolling, not swiping. */
const SWIPE_VERTICAL_TOLERANCE = 0.6;

export function ArmariTabs({
  garments,
  palettes,
  savedOutfits,
}: {
  garments: GarmentWithColors[];
  palettes: SanzoPalette[];
  savedOutfits: SavedOutfit[];
}) {
  const [tab, setTab] = useState<TabId>("peces");
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number }>({
    x: 0,
    w: 0,
  });

  useLayoutEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(
      `[data-tab-id="${tab}"] [data-tab-label]`,
    );
    if (!active) return;
    const containerRect = container.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({ x: rect.left - containerRect.left, w: rect.width });
  }, [tab]);

  const goToIndex = (i: number) => {
    if (i < 0 || i >= TABS.length) return;
    setTab(TABS[i].id);
  };

  // Touch gesture — swipe left goes forward, swipe right goes backward.
  // Only fires on touch devices; click keeps working everywhere.
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dy) > Math.abs(dx) * SWIPE_VERTICAL_TOLERANCE) return;
    const currentIndex = TABS.findIndex((t) => t.id === tab);
    goToIndex(currentIndex + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="flex flex-col gap-10">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Vistes de l'armari"
        className="relative flex items-center gap-8 border-b border-border pb-3"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              data-tab-id={t.id}
              className="group relative outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                data-tab-label
                className={`font-serif type-body inline-flex items-baseline gap-2 ${
                  active
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                } transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)]`}
              >
                {t.label}
                {t.id === "desats" && savedOutfits.length > 0 && (
                  <span className="type-caption align-super">
                    {savedOutfits.length}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-px h-px bg-text-primary"
          style={{
            width: indicator.w,
            transform: `translateX(${indicator.x}px)`,
            transition:
              "transform var(--duration-slow) var(--ease-spring), width var(--duration-slow) var(--ease-spring)",
            willChange: "transform, width",
          }}
        />
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {tab === "peces" && <ArmariGrid garments={garments} />}
        {tab === "combinar" && <OutfitBuilder garments={garments} palettes={palettes} />}
        {tab === "desats" && <SavedOutfitsView outfits={savedOutfits} palettes={palettes} />}
      </div>
    </div>
  );
}
