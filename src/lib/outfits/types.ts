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
  garments: {
    id: string;
    garment: GarmentWithColors;
  }[];
}
