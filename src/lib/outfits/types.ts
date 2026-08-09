import type { GarmentWithColors } from "@/lib/prendas/types";

export interface SanzoPalette {
  id: number;
  nombre: string;
  colores: string[];
}

export interface GarmentMatch {
  garment: GarmentWithColors;
  paletteColorIndex: number;
  paletteColorHex: string;
  distance: number;
}

export interface PaletteMatch {
  palette: SanzoPalette;
  colorAssignments: { garmentId: string; paletteColorIndex: number; distance: number }[];
  unmatchedColors: number[];
  totalDistance: number;
}

export interface OutfitGroup {
  garments: GarmentWithColors[];
  palettes: PaletteMatch[];
  bestDistance: number;
}

export interface OutfitResult {
  palette: SanzoPalette;
  matches: GarmentMatch[];
  totalDistance: number;
  unmatchedColors: number[];
}

export type OutfitGarmentRole = "primary" | "extra";

export interface SavedOutfit {
  id: string;
  name: string | null;
  /** null for an improvised outfit whose garments share no Sanzo palette. */
  paletteId: number | null;
  favorite: boolean;
  /** Most recent first, capped to a handful of entries. */
  wornEvents: { id: string; date: Date }[];
  createdAt: Date;
  garments: {
    id: string;
    role: OutfitGarmentRole;
    garment: GarmentWithColors;
  }[];
}

/** One cell of the weekly planner: a calendar day and whatever outfit
 * (if any) is assigned to it. */
export interface WeekDayPlan {
  date: string; // YYYY-MM-DD
  outfit: SavedOutfit | null;
}
