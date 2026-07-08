"use client";

import { useState } from "react";
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

  return (
    <div className="flex flex-col gap-10">
      <nav className="flex items-center gap-8 border-b border-border pb-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="group relative font-serif text-base outline-none"
              aria-current={active}
            >
              <span
                className={active ? "text-foreground" : "text-foreground-secondary hover:text-foreground"}
              >
                {t.label}
              </span>
              {t.id === "desats" && savedOutfits.length > 0 && (
                <span className="type-caption ml-2 align-super">
                  {savedOutfits.length}
                </span>
              )}
              <span
                aria-hidden
                className={`pointer-events-none absolute left-0 right-0 -bottom-[13px] h-px bg-foreground origin-left transition-transform duration-500 ease-out will-change-transform ${
                  active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {tab === "peces" && <ArmariGrid garments={garments} />}
      {tab === "combinar" && <OutfitBuilder garments={garments} palettes={palettes} />}
      {tab === "desats" && <SavedOutfitsView outfits={savedOutfits} palettes={palettes} />}
    </div>
  );
}
