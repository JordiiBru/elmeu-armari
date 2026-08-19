"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import { ArmariGrid } from "./ArmariGrid";
import { OutfitBuilder } from "./OutfitBuilder";
import { OutfitLibrary } from "./OutfitLibrary";

const TABS = [
  { id: "peces", label: "Peces" },
  { id: "combinar", label: "Combinar" },
  { id: "desats", label: "Desats" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ArmariTabs({
  garments,
  palettes,
  savedOutfits,
  todayISO,
  todayOutfitId,
  season,
}: {
  garments: GarmentWithColors[];
  palettes: SanzoPalette[];
  savedOutfits: SavedOutfit[];
  todayISO: string;
  todayOutfitId: string | null;
  season: Season;
}) {
  const [tab, setTab] = useState<TabId>("peces");
  const extraCandidates = useMemo(
    () => garments.filter((g) => EXTRA_CATEGORIES.has(g.category)),
    [garments],
  );
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

      {tab === "peces" && <ArmariGrid garments={garments} defaultSeason={season} />}
      {tab === "combinar" && <OutfitBuilder garments={garments} palettes={palettes} />}
      {tab === "desats" && (
        <OutfitLibrary
          mode="browse"
          outfits={savedOutfits}
          palettes={palettes}
          extraCandidates={extraCandidates}
          season={season}
          todayISO={todayISO}
          todayOutfitId={todayOutfitId}
        />
      )}
    </div>
  );
}
