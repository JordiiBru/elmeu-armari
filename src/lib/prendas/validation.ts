import type { GarmentInput, Category, Texture, Pattern, Season } from "./types";
import {
  CATEGORIES,
  SEASONS,
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  SIZES_BY_CATEGORY,
  LENGTHS_BY_CATEGORY,
  TEXTURES_BY_CATEGORY,
  PATTERNS_BY_CATEGORY,
  CATEGORIES_WITH_OPTIONAL_COLOR,
} from "./types";
import { UI } from "./ui-strings";

export type ValidationResult =
  | { ok: true; data: GarmentInput }
  | { ok: false; error: string; field?: keyof GarmentInput };

export function isHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

type PickResult<T extends string> =
  | { ok: true; value: T | null }
  | { ok: false; error: string; field: keyof GarmentInput };

// A field is "not applicable" for a category when its valid-values list is
// empty (e.g. fit for ACCESSORI): it must then be absent from the form.
// Otherwise the submitted value must be one of the listed options.
function pickOptional<T extends string>(
  value: string | null,
  validValues: readonly T[],
  field: keyof GarmentInput,
): PickResult<T> {
  if (validValues.length === 0) {
    return value === null
      ? { ok: true, value: null }
      : { ok: false, error: UI.errors.requiredFields, field };
  }
  return validValues.includes(value as T)
    ? { ok: true, value: value as T }
    : { ok: false, error: UI.errors.requiredFields, field };
}

export function validateGarmentForm(formData: FormData): ValidationResult {
  const category = formData.get("category") as Category;
  const texture = (formData.get("texture") as string) || null;
  const pattern = (formData.get("pattern") as string) || null;
  const fit = (formData.get("fit") as string) || null;
  const subtype = (formData.get("subtype") as string) || null;
  const length = (formData.get("length") as string) || null;
  const size = (formData.get("size") as string)?.trim() || null;
  const notes = (formData.get("notes") as string) || undefined;
  const seasons = formData.getAll("season") as Season[];
  const hexColors = formData.getAll("color") as string[];

  if (!CATEGORIES.includes(category)) return { ok: false, error: UI.errors.requiredFields, field: "category" };

  const textureResult = pickOptional<Texture>(texture, TEXTURES_BY_CATEGORY[category], "texture");
  if (!textureResult.ok) return textureResult;

  const patternResult = pickOptional<Pattern>(pattern, PATTERNS_BY_CATEGORY[category], "pattern");
  if (!patternResult.ok) return patternResult;

  const fitResult = pickOptional(fit, FITS_BY_CATEGORY[category], "fit");
  if (!fitResult.ok) return fitResult;

  const sizeResult = pickOptional(size, SIZES_BY_CATEGORY[category], "size");
  if (!sizeResult.ok) return sizeResult;

  const subtypeResult = pickOptional(subtype, SUBTYPES_BY_CATEGORY[category], "subtype");
  if (!subtypeResult.ok) return subtypeResult;

  const lengthResult = pickOptional(length, LENGTHS_BY_CATEGORY[category], "length");
  if (!lengthResult.ok) return lengthResult;

  if (seasons.length === 0) return { ok: false, error: UI.errors.minOneSeason, field: "seasons" };
  if (!seasons.every((s) => SEASONS.includes(s))) return { ok: false, error: UI.errors.minOneSeason, field: "seasons" };

  const colorRequired = !CATEGORIES_WITH_OPTIONAL_COLOR.has(category);
  if (colorRequired && hexColors.length === 0) return { ok: false, error: UI.errors.minOneColor, field: "hexColors" };
  if (!hexColors.every(isHex)) return { ok: false, error: UI.errors.invalidColor, field: "hexColors" };

  // Normalize + dedupe so the Color [garmentId, hex] unique constraint
  // can never fail at write time from picker duplicates or case variants.
  const uniqueHexColors = [...new Set(hexColors.map((h) => h.toLowerCase()))];

  return {
    ok: true,
    data: {
      category,
      texture: textureResult.value,
      pattern: patternResult.value,
      fit: fitResult.value,
      subtype: subtypeResult.value,
      length: lengthResult.value,
      size: sizeResult.value,
      notes,
      seasons,
      hexColors: uniqueHexColors,
    },
  };
}
