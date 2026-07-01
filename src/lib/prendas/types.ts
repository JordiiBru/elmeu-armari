import type { Category, Pattern, Fit, Texture, Season } from "@/generated/prisma/enums";

export type { Category, Pattern, Fit, Texture, Season };

export const CATEGORIES: Category[] = ["SWEATER", "SHIRT", "PANTS", "SOCKS", "SHOES"];
export const TEXTURES: Texture[] = ["KNIT", "DENIM", "LINEN", "COTTON", "POLYESTER", "LEATHER", "SYNTHETIC"];
export const PATTERNS: Pattern[] = ["PLAIN", "STRIPES", "CHECKS", "FLORAL", "PRINTED", "GEOMETRIC"];
export const FITS: Fit[] = ["OVERSIZED", "STRAIGHT", "CROPPED", "SLIM", "BAGGY", "REGULAR"];
export const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_YEAR"];

export interface GarmentWithColors {
  id: string;
  category: Category;
  texture: Texture;
  pattern: Pattern;
  size: string;
  fit: Fit;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  colors: { id: string; hex: string }[];
  seasons: { id: string; season: Season }[];
}
