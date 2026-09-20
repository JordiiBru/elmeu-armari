import type { Category, Pattern, Texture, Season } from "@/generated/prisma/enums";

export type { Category, Pattern, Texture, Season };

// Outer layer first: it is the order of the rail, and a coat goes over the sweater.
export const CATEGORIES: Category[] = ["OUTERWEAR", "SWEATER", "SHIRT", "PANTS", "SHOES", "ACCESSORI"];
// "Texture" in the data, "fabric" on screen: knit, denim and corduroy are how
// a cloth is made, cotton and wool what it is made of, and a wardrobe mixes
// both. KNIT and SYNTHETIC stay for the pieces already filed under them.
export const TEXTURES: Texture[] = [
  "COTTON", "LINEN", "WOOL", "DENIM", "CORDUROY", "KNIT",
  "LEATHER", "SUEDE", "CANVAS", "POLYESTER", "NYLON", "SYNTHETIC",
];
const PATTERNS: Pattern[] = ["PLAIN", "STRIPES", "CHECKS", "DOTS", "FLORAL", "PRINTED", "GEOMETRIC", "CAMO"];
export const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_YEAR"];

// New entries go at the end and use English keys; the older ones are Catalan or
// Spanish and stay as they are, because the key is what an export carries.
// The order is also the order of the rail (`sortByWardrobeOrder`).
export const SUBTYPES_BY_CATEGORY: Record<Category, string[]> = {
  OUTERWEAR: ["JACKET", "BLAZER", "BOMBER", "DENIM_JACKET", "COAT", "TRENCH", "PARKA", "PUFFER", "WINDBREAKER"],
  SWEATER:   ["PULLOVER", "ZIP", "HOODIE", "CARDIGAN", "SWEATSHIRT", "TURTLENECK", "VEST"],
  SHIRT:     ["TEE", "POLO", "CAMISA", "TANK", "HENLEY", "OVERSHIRT"],
  PANTS:     ["VAQUERS", "CHINO", "JOGGER", "CARGO", "TROUSERS"],
  SHOES:     ["SNEAKER", "BOTA", "LOAFER", "SANDALIA", "OXFORD", "CHELSEA", "ESPADRILLE", "FLIP_FLOP", "RUNNING"],
  ACCESSORI: ["ANELL", "RELLOTGE", "CINTURO", "BOSSA", "BARRET", "BUFANDA", "ULLERES", "NECKLACE", "BRACELET", "EARRINGS", "CAP", "TIE", "GLOVES"],
};

// Length is orthogonal to subtype: a chino can be SHORT or LONG, a tee can
// have a short or a long sleeve. Only defined for categories where it changes
// seasonal fit. Sleeve values have their own keys so a filter chip never says
// "short" without saying of what.
export const LENGTHS_BY_CATEGORY: Record<Category, string[]> = {
  OUTERWEAR: [],
  SWEATER:   [],
  SHIRT:     ["SHORT_SLEEVE", "LONG_SLEEVE"],
  PANTS:     ["SHORT", "LONG"],
  SHOES:     [],
  ACCESSORI: [],
};

export const ALL_LENGTHS: string[] = [
  ...new Set(Object.values(LENGTHS_BY_CATEGORY).flat()),
];

// Not applicable to ACCESSORI (a ring has no "fit"): empty list means the
// field is hidden and must stay unset, same convention as subtype/length.
// CROPPED is not here: it is a body length, kept apart from the fit so that a
// boxy crop can be oversized and cropped (see `canBeCropped`).
export const FITS_BY_CATEGORY: Record<Category, string[]> = {
  OUTERWEAR: ["REGULAR", "SLIM", "OVERSIZED"],
  SWEATER:   ["REGULAR", "SLIM", "OVERSIZED"],
  SHIRT:     ["REGULAR", "SLIM", "OVERSIZED"],
  PANTS:     ["STRAIGHT", "SLIM", "SKINNY", "TAPERED", "RELAXED", "BAGGY", "BARREL", "WIDE_LEG"],
  SHOES:     ["LOW_TOP", "MID", "HIGH_TOP"],
  ACCESSORI: [],
};

// Not applicable to ACCESSORI: sizing varies too much across rings, belts,
// hats etc. to fit one dropdown, so the field is hidden for this category.
export const SIZES_BY_CATEGORY: Record<Category, string[]> = {
  OUTERWEAR: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  SWEATER:   ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  SHIRT:     ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  PANTS:     ["28", "29", "30", "31", "32", "33", "34", "35", "36", "38"],
  SHOES:     ["37", "38", "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5", "45", "46", "47"],
  ACCESSORI: [],
};

// Texture/pattern don't apply to ACCESSORI either — same empty-list
// convention as fit/size/subtype/length.
export const TEXTURES_BY_CATEGORY: Record<Category, Texture[]> = {
  OUTERWEAR: TEXTURES,
  SWEATER: TEXTURES,
  SHIRT: TEXTURES,
  PANTS: TEXTURES,
  SHOES: TEXTURES,
  ACCESSORI: [],
};

export const PATTERNS_BY_CATEGORY: Record<Category, Pattern[]> = {
  OUTERWEAR: PATTERNS,
  SWEATER: PATTERNS,
  SHIRT: PATTERNS,
  PANTS: PATTERNS,
  SHOES: PATTERNS,
  ACCESSORI: [],
};

// Colours are required for every category except ACCESSORI — a ring or a
// watch often doesn't have one worth recording.
export const CATEGORIES_WITH_OPTIONAL_COLOR = new Set<Category>(["ACCESSORI"]);

// Categories that are never part of a saved outfit: they sit outside the
// colour-matching engine and are picked when you commit a day, so they
// belong to the WornEvent and not to the Outfit. Shoes moved out of this
// set on purpose — the outfit now commits to the shoes it was matched
// with, the same way it commits to a shirt. Accessories stay flexible:
// nobody picks an outfit around its accessories. Outerwear is the same
// kind of choice: you pick the jacket for the weather once the look is
// decided, and a coat that had to share a palette with the rest would
// narrow every outfit for a layer that is on and off in a day.
export const EXTRA_CATEGORIES = new Set<Category>(["OUTERWEAR", "ACCESSORI"]);

// Body length is a flag of its own, apart from the fit. Only tops and the
// outer layer have one that means anything; everywhere else it stays false.
const CROPPABLE_CATEGORIES = new Set<Category>(["OUTERWEAR", "SWEATER", "SHIRT"]);
export function canBeCropped(category: Category): boolean {
  return CROPPABLE_CATEGORIES.has(category);
}

// The complement: what a saved outfit is made of. Used by the outfit
// builder and by the server-side validation of a worn day.

// Categories that can be dirty at all. Shoes and accessories are
// always available: they never block an outfit and never appear in the
// laundry lists.
export const WASHABLE_CATEGORIES = new Set<Category>(["SWEATER", "SHIRT", "PANTS"]);

// Categories a single wear is enough to soil, so a past day dirties them
// on its own. Trousers are washable but not here on purpose: nobody
// washes their jeans after one day, and having the app insist made the
// basket lie. They go to the basket when you say so, from the clean pile
// of /bugaderia.
export const AUTO_SOIL_CATEGORIES = new Set<Category>(["SWEATER", "SHIRT"]);

/** Trousers say short or long and that decides the season (see the shorts
 * rule in the outfit engine); for everything else the length is a detail the
 * person may not know or care about. */
export function lengthRequired(category: Category): boolean {
  return category === "PANTS";
}

export const ALL_FITS: string[] = [
  ...new Set(Object.values(FITS_BY_CATEGORY).flat()),
];

export interface GarmentInput {
  category: Category;
  texture: Texture | null;
  pattern: Pattern | null;
  fit: string | null;
  cropped: boolean;
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
  cropped: boolean;
  notes: string | null;
  image: string | null;
  /** null = clean. Set to the moment the garment was marked dirty. */
  dirtySince: Date | null;
  createdAt: Date;
  updatedAt: Date;
  colors: { id: string; hex: string }[];
  seasons: { id: string; season: Season }[];
}
