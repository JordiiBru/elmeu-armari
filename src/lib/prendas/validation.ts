import type { Category, Pattern, Fit, Texture } from "./types";
import { CATEGORIES, TEXTURES, PATTERNS, FITS, SEASONS } from "./types";

export interface GarmentFormData {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  fit: Fit;
  size: string;
  seasons: string[];
  hexColors: string[];
  notes?: string;
}

export type ValidationError = { error: string };
export type ValidationResult = { ok: true; data: GarmentFormData } | { ok: false; error: string };

function isHex(s: string) {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

export function validateGarmentForm(formData: FormData): ValidationResult {
  const category = formData.get("category") as Category;
  const texture = formData.get("texture") as Texture;
  const pattern = formData.get("pattern") as Pattern;
  const fit = formData.get("fit") as Fit;
  const size = (formData.get("size") as string)?.trim();
  const notes = (formData.get("notes") as string) || undefined;
  const seasons = formData.getAll("season") as string[];
  const hexColors = formData.getAll("color") as string[];

  if (!CATEGORIES.includes(category)) return { ok: false, error: "Omple tots els camps marcats amb *" };
  if (!TEXTURES.includes(texture)) return { ok: false, error: "Omple tots els camps marcats amb *" };
  if (!PATTERNS.includes(pattern)) return { ok: false, error: "Omple tots els camps marcats amb *" };
  if (!FITS.includes(fit)) return { ok: false, error: "Omple tots els camps marcats amb *" };
  if (!size) return { ok: false, error: "Omple tots els camps marcats amb *" };
  if (seasons.length === 0) return { ok: false, error: "Selecciona almenys una temporada" };
  if (!seasons.every((s) => SEASONS.includes(s as never))) return { ok: false, error: "Temporada invàlida" };
  if (hexColors.length === 0) return { ok: false, error: "Afegeix almenys un color" };
  if (!hexColors.every(isHex)) return { ok: false, error: "Format de color invàlid" };

  return { ok: true, data: { category, texture, pattern, fit, size, notes, seasons, hexColors } };
}
