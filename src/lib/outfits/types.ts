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

export interface SavedOutfit {
  id: string;
  name: string | null;
  paletteId: number;
  favorite: boolean;
  createdAt: Date;
  /** Clothes only, no role wrapper — an outfit has nothing else in it. */
  garments: GarmentWithColors[];
  /** Most recent first, past days only, capped at 3. */
  wornEvents: WornDay[];
}

/** A day that has been committed: the outfit is in `SavedOutfit`, this is
 * everything else you put on that morning. */
export interface WornDay {
  id: string;
  date: Date;
  /** Shoes / socks / accessories worn that day. */
  extras: GarmentWithColors[];
}

/** One cell of the weekly planner: a calendar day, whatever outfit
 * (if any) is assigned to it, and what it is worn with. */
export interface WeekDayPlan {
  date: string; // YYYY-MM-DD
  outfit: SavedOutfit | null;
  extras: GarmentWithColors[];
}
