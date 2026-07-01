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
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-b-2 border-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.id === "desats" && savedOutfits.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">{savedOutfits.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "peces" && <ArmariGrid garments={garments} />}
      {tab === "combinar" && <OutfitBuilder garments={garments} palettes={palettes} />}
      {tab === "desats" && <SavedOutfitsView outfits={savedOutfits} palettes={palettes} />}
    </div>
  );
}
