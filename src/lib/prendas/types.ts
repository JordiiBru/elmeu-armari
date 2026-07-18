import type { Category, Pattern, Texture, Season } from "@/generated/prisma/enums";

export type { Category, Pattern, Texture, Season };

export const CATEGORIES: Category[] = ["SWEATER", "SHIRT", "PANTS", "SOCKS", "SHOES"];
export const TEXTURES: Texture[] = ["KNIT", "DENIM", "LINEN", "COTTON", "POLYESTER", "LEATHER", "SYNTHETIC"];
export const PATTERNS: Pattern[] = ["PLAIN", "STRIPES", "CHECKS", "FLORAL", "PRINTED", "GEOMETRIC"];
export const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_YEAR"];

export const SUBTYPES_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER: ["PULLOVER", "ZIP", "HOODIE", "CARDIGAN"],
  SHIRT:   ["TEE", "POLO", "CAMISA"],
  PANTS:   ["VAQUERS", "CHINO", "JOGGER", "CARGO"],
  SOCKS:   [],
  SHOES:   ["SNEAKER", "BOTA", "LOAFER", "SANDALIA", "OXFORD"],
};

// Length is orthogonal to subtype: a chino can be SHORT or LONG.
// Only defined for categories where it changes seasonal fit.
export const LENGTHS_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER: [],
  SHIRT:   [],
  PANTS:   ["SHORT", "LONG"],
  SOCKS:   [],
  SHOES:   [],
};

export const ALL_LENGTHS: string[] = [
  ...new Set(Object.values(LENGTHS_BY_CATEGORY).flat()),
];

export const FITS_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER: ["REGULAR", "OVERSIZED", "CROPPED"],
  SHIRT:   ["REGULAR", "SLIM", "OVERSIZED", "CROPPED"],
  PANTS:   ["STRAIGHT", "SLIM", "SKINNY", "BAGGY", "BARREL", "WIDE_LEG"],
  SOCKS:   ["CURT", "TURMELL", "MITJA_CANYA", "GENOLLERA"],
  SHOES:   ["LOW_TOP", "MID", "HIGH_TOP"],
};

export const SIZES_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER: ["XS", "S", "M", "L", "XL", "XXL"],
  SHIRT:   ["XS", "S", "M", "L", "XL", "XXL"],
  PANTS:   ["28", "29", "30", "31", "32", "33", "34", "36", "38"],
  SOCKS:   ["36-40", "40-46"],
  SHOES:   ["38", "39", "40", "41", "42", "43", "44", "45", "46"],
};

export const ALL_FITS: string[] = [
  ...new Set(Object.values(FITS_BY_CATEGORY).flat()),
];

export const ALL_SUBTYPES: string[] = [
  ...new Set(Object.values(SUBTYPES_BY_CATEGORY).flat()),
];

export interface GarmentInput {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  fit: string;
  subtype: string | null;
  length: string | null;
  size: string;
  seasons: Season[];
  hexColors: string[];
  notes?: string;
}

export interface GarmentWithColors {
  id: string;
  category: Category;
  texture: Texture;
  pattern: Pattern;
  size: string;
  subtype: string | null;
  length: string | null;
  fit: string;
  notes: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  colors: { id: string; hex: string }[];
  seasons: { id: string; season: Season }[];
}
