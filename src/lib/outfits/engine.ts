import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, OutfitResult, GarmentMatch } from "./types";
import { oklchDistance, OKLCH_DISTANCE_THRESHOLD } from "./color-matching";

const EXCLUDED_CATEGORIES = new Set(["SOCKS", "SHOES"]);
const MIN_PIECES = 2;

interface GarmentPaletteMatch {
  garment: GarmentWithColors;
  colorIndex: number;
  distance: number;
}

/**
 * For each garment, find which palette colors it matches (using first color in garment.colors[]).
 */
function matchGarmentToPalette(
  garment: GarmentWithColors,
  palette: SanzoPalette
): GarmentPaletteMatch[] {
  if (garment.colors.length === 0) return [];
  const garmentHex = garment.colors[0].hex;
  const matches: GarmentPaletteMatch[] = [];

  for (let i = 0; i < palette.colores.length; i++) {
    const dist = oklchDistance(garmentHex, palette.colores[i]);
    if (dist < OKLCH_DISTANCE_THRESHOLD) {
      matches.push({ garment, colorIndex: i, distance: dist });
    }
  }

  return matches;
}

/**
 * Generate outfit combinations for a single palette.
 * Returns valid combinations sorted by total distance.
 */
function generateForPalette(
  garments: GarmentWithColors[],
  palette: SanzoPalette
): OutfitResult[] {
  // Build map: paletteColorIndex → list of matching garments
  const colorToGarments = new Map<number, GarmentPaletteMatch[]>();

  for (const garment of garments) {
    if (EXCLUDED_CATEGORIES.has(garment.category)) continue;
    const matches = matchGarmentToPalette(garment, palette);
    for (const m of matches) {
      const existing = colorToGarments.get(m.colorIndex) ?? [];
      existing.push(m);
      colorToGarments.set(m.colorIndex, existing);
    }
  }

  // Get palette color indices that have at least one garment match
  const matchedIndices = Array.from(colorToGarments.keys()).sort();
  if (matchedIndices.length < MIN_PIECES) return [];

  // Generate combinations: pick at most one garment per palette color,
  // ensuring different categories and min 2 pieces
  const results: OutfitResult[] = [];
  const allIndices = Array.from({ length: palette.colores.length }, (_, i) => i);

  function backtrack(
    idx: number,
    current: GarmentMatch[],
    usedCategories: Set<string>
  ) {
    // If we've checked all matched indices, evaluate
    if (idx === matchedIndices.length) {
      if (current.length >= MIN_PIECES) {
        const totalDistance = current.reduce((sum, m) => sum + m.distance, 0);
        const matchedColorIndices = new Set(current.map((m) => m.paletteColorIndex));
        const unmatchedColors = allIndices.filter((i) => !matchedColorIndices.has(i));
        results.push({
          palette,
          matches: [...current],
          totalDistance,
          unmatchedColors,
        });
      }
      return;
    }

    const colorIdx = matchedIndices[idx];
    const candidates = colorToGarments.get(colorIdx) ?? [];

    // Option: skip this palette color
    backtrack(idx + 1, current, usedCategories);

    // Option: pick one garment for this palette color
    for (const candidate of candidates) {
      if (usedCategories.has(candidate.garment.category)) continue;
      usedCategories.add(candidate.garment.category);
      current.push({
        garment: candidate.garment,
        paletteColorIndex: candidate.colorIndex,
        paletteColorHex: palette.colores[candidate.colorIndex],
        distance: candidate.distance,
      });
      backtrack(idx + 1, current, usedCategories);
      current.pop();
      usedCategories.delete(candidate.garment.category);
    }
  }

  backtrack(0, [], new Set());

  // Sort by total distance (best matches first)
  results.sort((a, b) => a.totalDistance - b.totalDistance);

  return results;
}

/**
 * Main entry point: generate outfit combinations across all palettes.
 * Returns results sorted by match quality, paginated.
 */
export function generateOutfits(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0
): { results: OutfitResult[]; hasMore: boolean } {
  const allResults: OutfitResult[] = [];

  for (const palette of palettes) {
    const paletteResults = generateForPalette(garments, palette);
    allResults.push(...paletteResults);
  }

  // Sort all results by total distance
  allResults.sort((a, b) => a.totalDistance - b.totalDistance);

  // Deduplicate: same set of garment IDs = same outfit
  const seen = new Set<string>();
  const unique: OutfitResult[] = [];
  for (const r of allResults) {
    const key = r.matches
      .map((m) => m.garment.id)
      .sort()
      .join(",") + "|" + r.palette.id;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  const paginated = unique.slice(offset, offset + limit);
  return {
    results: paginated,
    hasMore: unique.length > offset + limit,
  };
}
