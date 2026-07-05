import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, PaletteMatch, OutfitGroup } from "./types";
import {
  perceptualDistance,
  isNeutralHex,
  OKLCH_DISTANCE_THRESHOLD,
  OKLCH_TIGHT_MATCH_THRESHOLD,
  MAX_EXTRA_PALETTES,
} from "./color-matching";

const EXCLUDED_CATEGORIES = new Set(["SOCKS", "SHOES"]);
const MIN_PIECES = 2;

interface GarmentPaletteMatch {
  garment: GarmentWithColors;
  colorIndex: number;
  distance: number;
}

function isNeutralGarment(garment: GarmentWithColors): boolean {
  return garment.colors.length > 0 && garment.colors.every((c) => isNeutralHex(c.hex));
}

/**
 * Match d'una peça cromatica (amb almenys un color no-neutre) contra una
 * paleta. Es exigent: tots els colors de la peça han de tenir algun color
 * de la paleta a distancia < threshold, i el color principal genera els
 * matches indexats per assignacio al backtrack.
 */
function matchChromaticGarment(
  garment: GarmentWithColors,
  palette: SanzoPalette
): GarmentPaletteMatch[] {
  for (const c of garment.colors) {
    let bestDist = Infinity;
    for (const paletteHex of palette.colores) {
      const d = perceptualDistance(c.hex, paletteHex);
      if (d < bestDist) bestDist = d;
    }
    if (bestDist >= OKLCH_DISTANCE_THRESHOLD) return [];
  }

  const primaryHex = garment.colors[0].hex;
  const matches: GarmentPaletteMatch[] = [];
  for (let i = 0; i < palette.colores.length; i++) {
    const dist = perceptualDistance(primaryHex, palette.colores[i]);
    if (dist < OKLCH_DISTANCE_THRESHOLD) {
      matches.push({ garment, colorIndex: i, distance: dist });
    }
  }
  return matches;
}

/**
 * Threshold generos per acceptar una peça neutra sobre una paleta. El
 * corpus Sanzo Wada quasi no te grisos mid-tone; permetre distancies mes
 * altes per neutres compensa aixo mantenint el sentit visual (un gris fosc
 * sobre paleta clara segueix "funcionant" com a color universal).
 */
const NEUTRAL_ACCEPTANCE = OKLCH_DISTANCE_THRESHOLD * 2;

/**
 * Distancia mitjana d'una peça neutra a la paleta (millor color per cada
 * color de la peça). Infinity si algun color queda massa lluny.
 */
function neutralDistanceToPalette(
  garment: GarmentWithColors,
  palette: SanzoPalette
): number {
  let sum = 0;
  for (const c of garment.colors) {
    let best = Infinity;
    for (const p of palette.colores) {
      const d = perceptualDistance(c.hex, p);
      if (d < best) best = d;
    }
    if (best >= NEUTRAL_ACCEPTANCE) return Infinity;
    sum += best;
  }
  return sum / garment.colors.length;
}

function findCombinationsForPalette(
  garments: GarmentWithColors[],
  palette: SanzoPalette
): { key: string; garments: GarmentWithColors[]; paletteMatch: PaletteMatch }[] {
  const eligible = garments.filter((g) => !EXCLUDED_CATEGORIES.has(g.category));

  // Peces neutres actuen com a wildcards: sempre compatibles, no ocupen slot
  // de la paleta. Es "poden posar sobre" qualsevol outfit cromatic.
  const neutralGarments = eligible.filter(isNeutralGarment);
  const chromaticGarments = eligible.filter((g) => !isNeutralGarment(g));

  const colorToGarments = new Map<number, GarmentPaletteMatch[]>();
  for (const garment of chromaticGarments) {
    const matches = matchChromaticGarment(garment, palette);
    for (const m of matches) {
      const existing = colorToGarments.get(m.colorIndex) ?? [];
      existing.push(m);
      colorToGarments.set(m.colorIndex, existing);
    }
  }

  const matchedIndices = Array.from(colorToGarments.keys()).sort();
  const allIndices = Array.from({ length: palette.colores.length }, (_, i) => i);

  // Cores cromatics: possibles subconjunts de peces cromatiques amb colors
  // distints. Retornem "cores" (incloent el core buit) que despres extendrem
  // amb neutrals.
  interface Core {
    assignments: GarmentPaletteMatch[];
    usedCategories: Set<string>;
  }
  const cores: Core[] = [{ assignments: [], usedCategories: new Set() }];

  function backtrackChromatic(
    idx: number,
    current: GarmentPaletteMatch[],
    usedCategories: Set<string>
  ) {
    if (idx === matchedIndices.length) {
      if (current.length > 0) {
        cores.push({
          assignments: [...current],
          usedCategories: new Set(usedCategories),
        });
      }
      return;
    }
    const colorIdx = matchedIndices[idx];
    const candidates = colorToGarments.get(colorIdx) ?? [];
    backtrackChromatic(idx + 1, current, usedCategories);
    for (const candidate of candidates) {
      if (usedCategories.has(candidate.garment.category)) continue;
      usedCategories.add(candidate.garment.category);
      current.push(candidate);
      backtrackChromatic(idx + 1, current, usedCategories);
      current.pop();
      usedCategories.delete(candidate.garment.category);
    }
  }
  backtrackChromatic(0, [], new Set());

  const results: { key: string; garments: GarmentWithColors[]; paletteMatch: PaletteMatch }[] = [];
  const seen = new Set<string>();

  // Per cada core, generar variants afegint qualsevol subset de neutrals amb
  // categories no usades. Aixi outfits com "gris + negre + top saturat" o
  // "negre + negre" (2 neutres sense core cromatic) apareixen.
  const neutralDist = new Map<string, number>();
  const compatibleNeutrals: GarmentWithColors[] = [];
  for (const n of neutralGarments) {
    const d = neutralDistanceToPalette(n, palette);
    if (Number.isFinite(d)) {
      neutralDist.set(n.id, d);
      compatibleNeutrals.push(n);
    }
  }

  function finalize(
    core: Core,
    neutrals: GarmentWithColors[]
  ) {
    const allGarments = [...core.assignments.map((a) => a.garment), ...neutrals];
    if (allGarments.length < MIN_PIECES) return;
    const categories = new Set(allGarments.map((g) => g.category));
    const hasPants = categories.has("PANTS");
    const hasTop = categories.has("SHIRT") || categories.has("SWEATER");
    if (!hasPants || !hasTop) return;

    const ids = allGarments.map((g) => g.id).sort();
    const key = ids.join(",");
    if (seen.has(key)) return;
    seen.add(key);

    const colorAssignments = [
      ...core.assignments.map((a) => ({
        garmentId: a.garment.id,
        paletteColorIndex: a.colorIndex,
        distance: a.distance,
      })),
      ...neutrals.map((g) => ({
        garmentId: g.id,
        paletteColorIndex: -1,
        distance: neutralDist.get(g.id) ?? 0,
      })),
    ];
    const matchedColorIndices = new Set(
      core.assignments.map((a) => a.colorIndex)
    );
    const totalDistance = colorAssignments.reduce((s, a) => s + a.distance, 0);

    results.push({
      key,
      garments: allGarments,
      paletteMatch: {
        palette,
        colorAssignments,
        unmatchedColors: allIndices.filter((i) => !matchedColorIndices.has(i)),
        totalDistance,
      },
    });
  }

  function extendWithNeutrals(
    core: Core,
    startIdx: number,
    picked: GarmentWithColors[]
  ) {
    finalize(core, picked);
    for (let i = startIdx; i < compatibleNeutrals.length; i++) {
      const n = compatibleNeutrals[i];
      if (core.usedCategories.has(n.category)) continue;
      if (picked.some((p) => p.category === n.category)) continue;
      picked.push(n);
      extendWithNeutrals(core, i + 1, picked);
      picked.pop();
    }
  }

  for (const core of cores) extendWithNeutrals(core, 0, []);
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
    const [primary, ...rest] = group.palettes;
    const tightExtras = rest
      .filter((pm) =>
        pm.colorAssignments.every((a) => a.distance < OKLCH_TIGHT_MATCH_THRESHOLD)
      )
      .slice(0, MAX_EXTRA_PALETTES);
    group.palettes = [primary, ...tightExtras];
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
