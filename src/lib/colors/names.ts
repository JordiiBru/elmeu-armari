import { anchorFor } from "@/lib/outfits/engine";

/**
 * The historic Sanzo Wada name shown for a garment colour, or `null` when
 * the colour is outside the vocabulary and has no honest name.
 *
 * It is the engine's own anchor (`anchorFor`), not a separate nearest-name
 * search: the interface used to rank all 157 colours by plain OKLCH
 * distance while the engine anchored with its own rules, so the same
 * garment could be named "Light Brownish Olive" on screen and matched as
 * "Deep Violet / Plumbeous". One function decides both now.
 *
 * Cached: the same handful of colours are asked for on every render.
 */
const cache = new Map<string, string | null>();

export function colourName(hex: string): string | null {
  const key = hex.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  const name = anchorFor(key)?.canonical.name ?? null;
  cache.set(key, name);
  return name;
}
