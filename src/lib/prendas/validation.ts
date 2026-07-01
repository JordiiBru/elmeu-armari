import type { Category, Pattern, Fit, Texture, Season } from "./types";
import { CATEGORIES, TEXTURES, PATTERNS, FITS, SEASONS } from "./types";
import { UI } from "./ui-strings";

export interface GarmentFormData {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  fit: Fit;
  size: string;
  seasons: Season[];
  hexColors: string[];
  notes?: string;
}

export type ValidationError = { error: string };
export type ValidationResult = { ok: true; data: GarmentFormData } | { ok: false; error: string };

export function isHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

export function validateGarmentForm(formData: FormData): ValidationResult {
  const category = formData.get("category") as Category;
  const texture = formData.get("texture") as Texture;
  const pattern = formData.get("pattern") as Pattern;
  const fit = formData.get("fit") as Fit;
  const size = (formData.get("size") as string)?.trim();
  const notes = (formData.get("notes") as string) || undefined;
  const seasons = formData.getAll("season") as Season[];
  const hexColors = formData.getAll("color") as string[];

  if (!CATEGORIES.includes(category)) return { ok: false, error: UI.errors.requiredFields };
  if (!TEXTURES.includes(texture)) return { ok: false, error: UI.errors.requiredFields };
  if (!PATTERNS.includes(pattern)) return { ok: false, error: UI.errors.requiredFields };
  if (!FITS.includes(fit)) return { ok: false, error: UI.errors.requiredFields };
  if (!size) return { ok: false, error: UI.errors.requiredFields };
  if (seasons.length === 0) return { ok: false, error: UI.errors.minOneSeason };
  if (!seasons.every((s) => SEASONS.includes(s))) return { ok: false, error: UI.errors.minOneSeason };
  if (hexColors.length === 0) return { ok: false, error: UI.errors.minOneColor };
  if (!hexColors.every(isHex)) return { ok: false, error: UI.errors.invalidColor };

  return { ok: true, data: { category, texture, pattern, fit, size, notes, seasons, hexColors } };
}
