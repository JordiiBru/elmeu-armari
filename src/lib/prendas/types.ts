import type { Category, Pattern, Texture, Season } from "@/generated/prisma/enums";

export type { Category, Pattern, Texture, Season };

export const CATEGORIES: Category[] = ["SWEATER", "SHIRT", "PANTS", "SOCKS", "SHOES", "ACCESSORI"];
export const TEXTURES: Texture[] = ["KNIT", "DENIM", "LINEN", "COTTON", "POLYESTER", "LEATHER", "SYNTHETIC"];
export const PATTERNS: Pattern[] = ["PLAIN", "STRIPES", "CHECKS", "FLORAL", "PRINTED", "GEOMETRIC"];
export const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_YEAR"];

export const SUBTYPES_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER:   ["PULLOVER", "ZIP", "HOODIE", "CARDIGAN"],
  SHIRT:     ["TEE", "POLO", "CAMISA"],
  PANTS:     ["VAQUERS", "CHINO", "JOGGER", "CARGO"],
  SOCKS:     [],
  SHOES:     ["SNEAKER", "BOTA", "LOAFER", "SANDALIA", "OXFORD"],
  ACCESSORI: ["ANELL", "RELLOTGE", "CINTURO", "BOSSA", "BARRET", "BUFANDA", "ULLERES"],
};

// Length is orthogonal to subtype: a chino can be SHORT or LONG.
// Only defined for categories where it changes seasonal fit.
export const LENGTHS_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER:   [],
  SHIRT:     [],
  PANTS:     ["SHORT", "LONG"],
  SOCKS:     [],
  SHOES:     [],
  ACCESSORI: [],
};

export const ALL_LENGTHS: string[] = [
  ...new Set(Object.values(LENGTHS_BY_CATEGORY).flat()),
];

// Not applicable to ACCESSORI (a ring has no "fit"): empty list means the
// field is hidden and must stay unset, same convention as subtype/length.
export const FITS_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER:   ["REGULAR", "OVERSIZED", "CROPPED"],
  SHIRT:     ["REGULAR", "SLIM", "OVERSIZED", "CROPPED"],
  PANTS:     ["STRAIGHT", "SLIM", "SKINNY", "BAGGY", "BARREL", "WIDE_LEG"],
  SOCKS:     ["CURT", "TURMELL", "MITJA_CANYA", "GENOLLERA"],
  SHOES:     ["LOW_TOP", "MID", "HIGH_TOP"],
  ACCESSORI: [],
};

// Not applicable to ACCESSORI: sizing varies too much across rings, belts,
// hats etc. to fit one dropdown, so the field is hidden for this category.
export const SIZES_BY_CATEGORY: Record<Category, string[]> = {
  SWEATER:   ["XS", "S", "M", "L", "XL", "XXL"],
  SHIRT:     ["XS", "S", "M", "L", "XL", "XXL"],
  PANTS:     ["28", "29", "30", "31", "32", "33", "34", "36", "38"],
  SOCKS:     ["36-40", "40-46"],
  SHOES:     ["38", "39", "40", "41", "42", "43", "44", "45", "46"],
  ACCESSORI: [],
};

// Texture/pattern don't apply to ACCESSORI either — same empty-list
// convention as fit/size/subtype/length.
export const TEXTURES_BY_CATEGORY: Record<Category, Texture[]> = {
  SWEATER: TEXTURES,
  SHIRT: TEXTURES,
  PANTS: TEXTURES,
  SOCKS: TEXTURES,
  SHOES: TEXTURES,
  ACCESSORI: [],
};

export const PATTERNS_BY_CATEGORY: Record<Category, Pattern[]> = {
  SWEATER: PATTERNS,
  SHIRT: PATTERNS,
  PANTS: PATTERNS,
  SOCKS: PATTERNS,
  SHOES: PATTERNS,
  ACCESSORI: [],
};

// Colours are required for every category except ACCESSORI — a ring or a
// watch often doesn't have one worth recording.
export const CATEGORIES_WITH_OPTIONAL_COLOR = new Set<Category>(["ACCESSORI"]);

// Categories that are never part of a saved outfit: they sit outside the
// colour-matching engine and are picked when you commit a day, so they
// belong to the WornEvent and not to the Outfit.
export const EXTRA_CATEGORIES = new Set<Category>(["SHOES", "SOCKS", "ACCESSORI"]);

// The complement: what a saved outfit is made of. Used by the outfit
// builder and by the server-side validation of a worn day.
export const OUTFIT_CATEGORIES = CATEGORIES.filter((c) => !EXTRA_CATEGORIES.has(c));

// Categories that can be dirty at all. Shoes, socks and accessories are
// always available: they never block an outfit and never appear in the
// laundry lists.
export const WASHABLE_CATEGORIES = new Set<Category>(["SWEATER", "SHIRT", "PANTS"]);

// Categories a single wear is enough to soil, so a past day dirties them
// on its own. Trousers are washable but not here on purpose: nobody
// washes their jeans after one day, and having the app insist made the
// basket lie. They go to the basket when you say so, from Embrutar.
export const AUTO_SOIL_CATEGORIES = new Set<Category>(["SWEATER", "SHIRT"]);

export const ALL_FITS: string[] = [
  ...new Set(Object.values(FITS_BY_CATEGORY).flat()),
];

export const ALL_SUBTYPES: string[] = [
  ...new Set(Object.values(SUBTYPES_BY_CATEGORY).flat()),
];

export interface GarmentInput {
  category: Category;
  texture: Texture | null;
  pattern: Pattern | null;
  fit: string | null;
  subtype: string | null;
  length: string | null;
  size: string | null;
  seasons: Season[];
  hexColors: string[];
  notes?: string;
}

export interface GarmentWithColors {
  id: string;
  category: Category;
  texture: Texture | null;
  pattern: Pattern | null;
  size: string | null;
  subtype: string | null;
  length: string | null;
  fit: string | null;
  notes: string | null;
  image: string | null;
  /** null = clean. Set to the moment the garment was marked dirty. */
  dirtySince: Date | null;
  createdAt: Date;
  updatedAt: Date;
  colors: { id: string; hex: string }[];
  seasons: { id: string; season: Season }[];
}
