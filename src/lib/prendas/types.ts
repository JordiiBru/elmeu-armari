import type { Category, Pattern, Fit, Texture } from "@/generated/prisma/enums";

export type { Category, Pattern, Fit, Texture };

export const CATEGORIES: Category[] = ["SWEATER", "SHIRT", "PANTS", "SOCKS", "SHOES"];
export const TEXTURES: Texture[] = ["KNIT", "DENIM", "LINEN", "COTTON", "POLYESTER", "LEATHER", "SYNTHETIC"];
export const PATTERNS: Pattern[] = ["PLAIN", "STRIPES", "CHECKS", "FLORAL", "PRINTED", "GEOMETRIC"];
export const FITS: Fit[] = ["OVERSIZED", "STRAIGHT", "CROPPED", "SLIM", "BAGGY", "REGULAR"];
export const SEASONS = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_YEAR"] as const;
export type Season = (typeof SEASONS)[number];

export interface GarmentWithColors {
  id: string;
  category: Category;
  texture: Texture;
  pattern: Pattern;
  season: string;
  size: string;
  fit: Fit;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  colors: { id: string; hex: string }[];
}
