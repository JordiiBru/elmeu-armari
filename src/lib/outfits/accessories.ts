import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette } from "./types";
import { candidatesFor, isGreyColour } from "./engine";
import { OKLCH_TIGHT_MATCH_THRESHOLD, perceptualDistance } from "./color-matching";

export interface AccessorySuggestion {
  garment: GarmentWithColors;
  /** True when it matches a colour of the palette the outfit does not wear:
   * the natural accent, so it leads the list. */
  accent: boolean;
  /** Worst distance among the colours that were scored, for ordering. */
  distance: number;
}

/** Black, white and the greys go with everything, so recommending one is
 * noise. They stay in the normal picker. Whether a colour is one is the
 * engine's snap (a rung of the grey ramp), so a tinted Sanzo grey counts
 * and a dull pink or olive does not. */
const isNeutral = isGreyColour;

/**
 * Indices of the palette colours some piece of the outfit already wears,
 * the way the engine assigns them: each colour takes the nearest of its
 * readings that is in the palette, not every reading within reach.
 */
function wornPaletteIndices(outfit: GarmentWithColors[], palette: SanzoPalette): Set<number> {
  const worn = new Set<number>();
  const paletteHexes = palette.colores.map((h) => h.toLowerCase());
  for (const garment of outfit) {
    for (const colour of garment.colors) {
      for (const candidate of candidatesFor(colour.hex)) {
        const i = paletteHexes.indexOf(candidate.canonical.hex.toLowerCase());
        if (i >= 0) {
          worn.add(i);
          break;
        }
      }
    }
  }
  return worn;
}

/**
 * The accessories that complete a saved outfit: every colour of the
 * accessory that is not a neutral sits within the tight threshold of a
 * colour of the outfit's palette, scored with the engine's own distance.
 *
 * - All of them, not a top few: the person decides what to wear.
 * - An accessory with no colour, or only neutrals, is never suggested.
 * - One that matches a palette colour the outfit does not wear leads.
 */
export function suggestAccessories(
  outfit: GarmentWithColors[],
  palette: SanzoPalette | null,
  accessories: GarmentWithColors[],
): AccessorySuggestion[] {
  if (!palette) return [];
  const worn = wornPaletteIndices(outfit, palette);

  const suggestions: AccessorySuggestion[] = [];
  for (const garment of accessories) {
    if (garment.category !== "ACCESSORI") continue;
    const scored = garment.colors.map((c) => c.hex).filter((hex) => !isNeutral(hex));
    if (scored.length === 0) continue;

    let accent = false;
    let distance = 0;
    let matches = true;
    for (const hex of scored) {
      let best = Infinity;
      let bestIndex = -1;
      palette.colores.forEach((paletteHex, i) => {
        const d = perceptualDistance(hex, paletteHex);
        if (d < best) {
          best = d;
          bestIndex = i;
        }
      });
      if (best >= OKLCH_TIGHT_MATCH_THRESHOLD) {
        matches = false;
        break;
      }
      if (!worn.has(bestIndex)) accent = true;
      distance = Math.max(distance, best);
    }
    if (matches) suggestions.push({ garment, accent, distance });
  }

  return suggestions.sort(
    (a, b) => Number(b.accent) - Number(a.accent) || a.distance - b.distance,
  );
}
