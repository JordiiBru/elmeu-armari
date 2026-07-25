import type { GarmentWithColors } from "./types";

const ID_SUFFIX_LENGTH = 6;

/**
 * Human-readable identifier for a garment's detail URL: category (or, for
 * an accessory, its subtype — "bossa" reads better than "accessori" for
 * every single item) plus a short suffix of the cuid to keep the URL
 * unique. Category/subtype enum values are already ascii, so lowercasing
 * is the whole slug — no transliteration table needed.
 */
export function garmentSlug(garment: Pick<GarmentWithColors, "id" | "category" | "subtype">): string {
  const word = garment.category === "ACCESSORI" && garment.subtype ? garment.subtype : garment.category;
  return `${word.toLowerCase()}-${idSuffix(garment.id)}`;
}

export function idSuffix(id: string): string {
  return id.slice(-ID_SUFFIX_LENGTH);
}

/** Pulls the id suffix back out of a slug — the human-readable prefix is
 * cosmetic only and never consulted when resolving the garment. */
export function idSuffixFromSlug(slug: string): string {
  return slug.slice(slug.lastIndexOf("-") + 1);
}
