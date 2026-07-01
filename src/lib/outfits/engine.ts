import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, PaletteMatch, OutfitGroup } from "./types";
import { oklchDistance, OKLCH_DISTANCE_THRESHOLD } from "./color-matching";

const EXCLUDED_CATEGORIES = new Set(["SOCKS", "SHOES"]);
const MIN_PIECES = 2;

interface GarmentPaletteMatch {
  garment: GarmentWithColors;
  colorIndex: number;
  distance: number;
}

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

function findCombinationsForPalette(
  garments: GarmentWithColors[],
  palette: SanzoPalette
): { key: string; garments: GarmentWithColors[]; paletteMatch: PaletteMatch }[] {
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

  const matchedIndices = Array.from(colorToGarments.keys()).sort();
  if (matchedIndices.length < MIN_PIECES) return [];

  const allIndices = Array.from({ length: palette.colores.length }, (_, i) => i);
  const results: { key: string; garments: GarmentWithColors[]; paletteMatch: PaletteMatch }[] = [];
  const seen = new Set<string>();

  function backtrack(
    idx: number,
    current: { garment: GarmentWithColors; colorIndex: number; distance: number }[],
    usedCategories: Set<string>
  ) {
    if (idx === matchedIndices.length) {
      const categories = new Set(current.map((c) => c.garment.category));
      const hasPants = categories.has("PANTS");
      const hasTop = categories.has("SHIRT") || categories.has("SWEATER");
      if (current.length >= MIN_PIECES && hasPants && hasTop) {
        const ids = current.map((c) => c.garment.id).sort();
        const key = ids.join(",");
        if (seen.has(key)) return;
        seen.add(key);

        const matchedColorIndices = new Set(current.map((c) => c.colorIndex));
        const totalDistance = current.reduce((sum, c) => sum + c.distance, 0);

        results.push({
          key,
          garments: current.map((c) => c.garment),
          paletteMatch: {
            palette,
            colorAssignments: current.map((c) => ({
              garmentId: c.garment.id,
              paletteColorIndex: c.colorIndex,
              distance: c.distance,
            })),
            unmatchedColors: allIndices.filter((i) => !matchedColorIndices.has(i)),
            totalDistance,
          },
        });
      }
      return;
    }

    const colorIdx = matchedIndices[idx];
    const candidates = colorToGarments.get(colorIdx) ?? [];

    backtrack(idx + 1, current, usedCategories);

    for (const candidate of candidates) {
      if (usedCategories.has(candidate.garment.category)) continue;
      usedCategories.add(candidate.garment.category);
      current.push(candidate);
      backtrack(idx + 1, current, usedCategories);
      current.pop();
      usedCategories.delete(candidate.garment.category);
    }
  }

  backtrack(0, [], new Set());
  return results;
}

export function generateOutfitGroupsForGarment(
  targetGarment: GarmentWithColors,
  allGarments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0
): { groups: OutfitGroup[]; hasMore: boolean } {
  const garments = allGarments.filter((g) => g.id !== targetGarment.id);
  const garmentsWithTarget = [targetGarment, ...garments];

  const { groups: allGroups } = generateOutfitGroupsInternal(garmentsWithTarget, palettes);

  const filtered = allGroups.filter((group) =>
    group.garments.some((g) => g.id === targetGarment.id)
  );

  const paginated = filtered.slice(offset, offset + limit);
  return {
    groups: paginated,
    hasMore: filtered.length > offset + limit,
  };
}

function generateOutfitGroupsInternal(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[]
): { groups: OutfitGroup[] } {
  const groupMap = new Map<string, OutfitGroup>();

  for (const palette of palettes) {
    const combos = findCombinationsForPalette(garments, palette);
    for (const combo of combos) {
      const existing = groupMap.get(combo.key);
      if (existing) {
        existing.palettes.push(combo.paletteMatch);
        if (combo.paletteMatch.totalDistance < existing.bestDistance) {
          existing.bestDistance = combo.paletteMatch.totalDistance;
        }
      } else {
        groupMap.set(combo.key, {
          garments: combo.garments,
          palettes: [combo.paletteMatch],
          bestDistance: combo.paletteMatch.totalDistance,
        });
      }
    }
  }

  const allGroups = Array.from(groupMap.values());

  allGroups.sort((a, b) => {
    if (a.garments.length !== b.garments.length) return a.garments.length - b.garments.length;
    return a.bestDistance - b.bestDistance;
  });

  for (const group of allGroups) {
    group.palettes.sort((a, b) => a.totalDistance - b.totalDistance);
  }

  return { groups: allGroups };
}

export function generateOutfitGroups(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0
): { groups: OutfitGroup[]; hasMore: boolean } {
  const { groups: allGroups } = generateOutfitGroupsInternal(garments, palettes);
  const paginated = allGroups.slice(offset, offset + limit);
  return {
    groups: paginated,
    hasMore: allGroups.length > offset + limit,
  };
}
