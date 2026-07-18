import type { GarmentInput, Category, Texture, Pattern, Season } from "./types";
import { CATEGORIES, TEXTURES, PATTERNS, SEASONS, FITS_BY_CATEGORY, SUBTYPES_BY_CATEGORY, SIZES_BY_CATEGORY, LENGTHS_BY_CATEGORY } from "./types";
import { UI } from "./ui-strings";

export type ValidationResult =
  | { ok: true; data: GarmentInput }
  | { ok: false; error: string; field?: keyof GarmentInput };

export function isHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

export function validateGarmentForm(formData: FormData): ValidationResult {
  const category = formData.get("category") as Category;
  const texture = formData.get("texture") as Texture;
  const pattern = formData.get("pattern") as Pattern;
  const fit = formData.get("fit") as string;
  const subtype = (formData.get("subtype") as string) || null;
  const length = (formData.get("length") as string) || null;
  const size = (formData.get("size") as string)?.trim();
  const notes = (formData.get("notes") as string) || undefined;
  const seasons = formData.getAll("season") as Season[];
  const hexColors = formData.getAll("color") as string[];

  if (!CATEGORIES.includes(category)) return { ok: false, error: UI.errors.requiredFields, field: "category" };
  if (!TEXTURES.includes(texture)) return { ok: false, error: UI.errors.requiredFields, field: "texture" };
  if (!PATTERNS.includes(pattern)) return { ok: false, error: UI.errors.requiredFields, field: "pattern" };
  if (!FITS_BY_CATEGORY[category]?.includes(fit)) return { ok: false, error: UI.errors.requiredFields, field: "fit" };
  if (!SIZES_BY_CATEGORY[category]?.includes(size)) return { ok: false, error: UI.errors.requiredFields, field: "size" };

  const validSubtypes = SUBTYPES_BY_CATEGORY[category];
  if (validSubtypes.length > 0 && !validSubtypes.includes(subtype ?? "")) {
    return { ok: false, error: UI.errors.requiredFields, field: "subtype" };
  }

  const validLengths = LENGTHS_BY_CATEGORY[category];
  if (validLengths.length > 0 && !validLengths.includes(length ?? "")) {
    return { ok: false, error: UI.errors.requiredFields, field: "length" };
  }
  if (validLengths.length === 0 && length !== null) {
    return { ok: false, error: UI.errors.requiredFields, field: "length" };
  }

  if (seasons.length === 0) return { ok: false, error: UI.errors.minOneSeason, field: "seasons" };
  if (!seasons.every((s) => SEASONS.includes(s))) return { ok: false, error: UI.errors.minOneSeason, field: "seasons" };
  if (hexColors.length === 0) return { ok: false, error: UI.errors.minOneColor, field: "hexColors" };
  if (!hexColors.every(isHex)) return { ok: false, error: UI.errors.invalidColor, field: "hexColors" };

  // Normalize + dedupe so the Color [garmentId, hex] unique constraint
  // can never fail at write time from picker duplicates or case variants.
  const uniqueHexColors = [...new Set(hexColors.map((h) => h.toLowerCase()))];

  return { ok: true, data: { category, texture, pattern, fit, subtype, length, size, notes, seasons, hexColors: uniqueHexColors } };
}
