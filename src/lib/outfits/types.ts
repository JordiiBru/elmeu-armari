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

/**
 * The committed day itself, as opposed to the outfit on it. It is the row
 * that owns the photo you took of yourself that morning: the same outfit
 * worn twice is two different days and two different photographs.
 */
export interface DayEvent {
  id: string;
  image: string | null;
  /** Only ever read to cache-bust the photo, whose filename is the id. */
  updatedAt: Date;
}

/** One cell of the weekly planner: a calendar day, whatever outfit
 * (if any) is assigned to it, and what it is worn with. */
export interface WeekDayPlan {
  date: string; // YYYY-MM-DD
  outfit: SavedOutfit | null;
  extras: GarmentWithColors[];
  /** null on an empty day: there is no day to photograph until one is
   * decided. */
  event: DayEvent | null;
}
