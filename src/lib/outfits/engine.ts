import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, PaletteMatch, OutfitGroup } from "./types";
import { namedColors } from "@/lib/colors";
import type { NamedColor } from "@/lib/colors";
import {
  perceptualDistance,
  oklchDistance,
  isNeutralHex,
  hexToOklch,
  OKLCH_DISTANCE_THRESHOLD,
  OKLCH_TIGHT_MATCH_THRESHOLD,
  MAX_EXTRA_PALETTES,
} from "./color-matching";

// Sanzo Wada has no true achromatic grey: only Black and White are
// C=0. Warm Gray, Neutral Gray, Fawn and Mineral Gray all carry a
// small green / pink / cyan tint (C between 0.02 and 0.05). This
// whitelist is the set of canonical hexes that read as "grey" to a
// human — the set from which we choose an anchor for any garment
// whose colour is very close to achromatic. Explicitly excludes
// Plumbeous (#5c7287, blue), Slate Color and the deep slates, which
// are technically low-chroma but clearly hued.
const GREY_FAMILY_HEXES = new Set([
  "#000000", // Black
  "#ffffff", // White
  "#9cb29e", // Warm Gray
  "#b5d1cc", // Neutral Gray
  "#9fc2b2", // Mineral Gray
  "#d1b0b3", // Fawn
]);

const ACHROMATIC_CHROMA = 0.02;
function isAchromatic(hex: string): boolean {
  return hexToOklch(hex).C < ACHROMATIC_CHROMA;
}

/**
 * Outfit engine — canonical + intersection.
 *
 * The Sanzo Wada catalogue exposes two related datasets:
 *   - 157 canonical colours (`namedColors`), each with a
 *     `combinations` array listing every palette id it appears in.
 *   - 348 combinations (`palettes`), each a set of 2–6 canonical
 *     hexes.
 *
 * Matching algorithm:
 *
 *   1. Snap every garment colour to its nearest canonical (OKLCH
 *      perceptual distance, uses the neutral-vs-saturated penalty
 *      from color-matching.ts). A colour beyond
 *      OKLCH_DISTANCE_THRESHOLD from every canonical takes the
 *      garment out of the vocabulary.
 *   2. A garment "lives in" the intersection of the `combinations`
 *      sets of its snapped canonicals — the palettes that contain
 *      every colour of the piece.
 *   3. A set of garments forms a valid outfit when the intersection
 *      of their palette sets is non-empty and the categorical
 *      constraints hold (≥ 1 pants + ≥ 1 top, no repeated category,
 *      no socks or shoes).
 *
 * There is no palette-coverage requirement: if a palette contains a
 * colour the outfit doesn't wear, that's fine — you're just not
 * wearing that accent. This mirrors how a human reads the catalogue:
 * "these two garments are on the same page of the book, so they go
 * together."
 */

const EXCLUDED_CATEGORIES = new Set(["SOCKS", "SHOES"]);
const MIN_PIECES = 2;

// A palette is a meaningful anchor for an outfit only if the outfit
// actually wears at least this many distinct palette slots. Otherwise
// the outfit is monochrome-ish (e.g. black shirt + black pants) and
// the palette shown next to it — a "black + accent" combination — is
// misleading because the accent is not worn.
const MIN_DISTINCT_PALETTE_COLORS = 2;

// Order in which garments should be laid out in a rendered outfit.
const CATEGORY_LAYOUT_ORDER = ["SHIRT", "SWEATER", "PANTS"] as const;

/** A candidate canonical reading of one garment colour. */
interface Candidate {
  canonical: NamedColor;
  distance: number;
}

/**
 * All plausible canonical readings of one garment colour, ordered by
 * distance. The nearest is the display anchor; the rest widen the set
 * of palettes the colour is willing to live in.
 */
interface Snap {
  best: Candidate;
  candidates: Candidate[];
}

/**
 * Precomputed matching context for a single garment. `null` when at
 * least one of the garment's colours is too far from every canonical,
 * meaning the whole piece is outside the Sanzo Wada vocabulary and
 * cannot combine.
 */
interface Ctx {
  garment: GarmentWithColors;
  snaps: Snap[];
  paletteIds: Set<number>;
  totalDistance: number;
}

function collectCandidates(
  hex: string,
  filter: (c: NamedColor) => boolean,
  distanceOf: (c: NamedColor) => number,
  threshold: number,
): Snap | null {
  const found: Candidate[] = [];
  for (const c of namedColors) {
    if (!filter(c)) continue;
    const d = distanceOf(c);
    if (d < threshold) found.push({ canonical: c, distance: d });
  }
  if (found.length === 0) return null;
  found.sort((a, b) => a.distance - b.distance);
  return { best: found[0], candidates: found };
}

function snapColour(hex: string): Snap | null {
  // Achromatic pieces snap only within the grey family whitelist, so
  // a pure grey never routes through Plumbeous (blue) or Deep Slate
  // (green). No perceptual threshold — the nearest grey-family entry
  // always wins.
  if (isAchromatic(hex)) {
    return collectCandidates(
      hex,
      (c) => GREY_FAMILY_HEXES.has(c.hex.toLowerCase()),
      (c) => oklchDistance(hex, c.hex),
      Infinity,
    );
  }

  // Quasi-neutrals (0.02 ≤ C < 0.05, e.g. tinted greys, dusty
  // olives) snap among all neutral canonicals with raw OKLCH.
  if (isNeutralHex(hex)) {
    return collectCandidates(
      hex,
      (c) => isNeutralHex(c.hex),
      (c) => oklchDistance(hex, c.hex),
      Infinity,
    );
  }

  // Saturated pieces: gather every canonical inside the perceptual
  // threshold. Multiple plausible readings are all kept — the piece
  // then belongs to any palette containing any of them. The nearest
  // stays as the display anchor.
  return collectCandidates(
    hex,
    () => true,
    (c) => perceptualDistance(hex, c.hex),
    OKLCH_DISTANCE_THRESHOLD,
  );
}

function intersectSets(sets: Set<number>[]): Set<number> {
  if (sets.length === 0) return new Set();
  let smallestIdx = 0;
  for (let i = 1; i < sets.length; i++) {
    if (sets[i].size < sets[smallestIdx].size) smallestIdx = i;
  }
  const smallest = sets[smallestIdx];
  const out = new Set<number>();
  outer: for (const id of smallest) {
    for (let i = 0; i < sets.length; i++) {
      if (i === smallestIdx) continue;
      if (!sets[i].has(id)) continue outer;
    }
    out.add(id);
  }
  return out;
}

function buildContext(g: GarmentWithColors): Ctx | null {
  if (EXCLUDED_CATEGORIES.has(g.category)) return null;
  if (g.colors.length === 0) return null;

  const snaps: Snap[] = [];
  for (const c of g.colors) {
    const s = snapColour(c.hex);
    if (!s) return null;
    snaps.push(s);
  }

  // A garment lives in the intersection over its colours of the union
  // of palette sets of each plausible canonical for that colour.
  const perColour = snaps.map((s) => {
    const union = new Set<number>();
    for (const cand of s.candidates) {
      for (const pid of cand.canonical.combinations) union.add(pid);
    }
    return union;
  });
  const paletteIds = intersectSets(perColour);
  if (paletteIds.size === 0) return null;

  const totalDistance = snaps.reduce((sum, s) => sum + s.best.distance, 0);
  return { garment: g, snaps, paletteIds, totalDistance };
}

function hasTop(cats: Set<string>): boolean {
  return cats.has("SHIRT") || cats.has("SWEATER");
}
function hasBottom(cats: Set<string>): boolean {
  return cats.has("PANTS");
}

/**
 * Build a PaletteMatch (the shape the UI expects) from a set of
 * garments and a palette id, using the precomputed contexts.
 */
function paletteMatchFor(
  paletteId: number,
  palettes: SanzoPalette[],
  ctxs: Ctx[],
): PaletteMatch | null {
  const palette = palettes.find((p) => p.id === paletteId);
  if (!palette) return null;

  const paletteHexLower = palette.colores.map((h) => h.toLowerCase());
  const matchedIndices = new Set<number>();
  const colorAssignments: PaletteMatch["colorAssignments"] = [];
  let totalDistance = 0;

  for (const c of ctxs) {
    // Pick the candidate canonical that actually belongs to this
    // palette (closest first). That's the anchor for this garment
    // inside this palette.
    const primary = c.snaps[0];
    let anchor: Candidate | null = null;
    for (const cand of primary.candidates) {
      const i = paletteHexLower.indexOf(cand.canonical.hex.toLowerCase());
      if (i >= 0) {
        anchor = cand;
        matchedIndices.add(i);
        colorAssignments.push({
          garmentId: c.garment.id,
          paletteColorIndex: i,
          distance: cand.distance,
        });
        break;
      }
    }
    if (anchor) totalDistance += anchor.distance;
  }

  if (matchedIndices.size < MIN_DISTINCT_PALETTE_COLORS) return null;

  const unmatchedColors: number[] = [];
  for (let i = 0; i < palette.colores.length; i++) {
    if (!matchedIndices.has(i)) unmatchedColors.push(i);
  }

  return { palette, colorAssignments, unmatchedColors, totalDistance };
}

/**
 * Given a target garment context and a list of candidate contexts
 * (already filtered for category conflict with target and each
 * other's rules), enumerate every subset of candidates that yields
 * a valid outfit together with the target.
 */
function enumerateOutfits(
  target: Ctx,
  candidates: Ctx[],
  onOutfit: (ctxs: Ctx[], commonPalettes: Set<number>) => void,
) {
  const maxAddOn = Math.min(candidates.length, 4);
  const pick = (start: number, current: Ctx[], commonSets: Set<number>[]) => {
    if (current.length + 1 >= MIN_PIECES) {
      const common = intersectSets(commonSets);
      if (common.size > 0) {
        const cats = new Set([target.garment.category, ...current.map((c) => c.garment.category)]);
        if (hasBottom(cats) && hasTop(cats)) {
          onOutfit([target, ...current], common);
        }
      }
    }
    if (current.length >= maxAddOn) return;
    for (let i = start; i < candidates.length; i++) {
      const cand = candidates[i];
      // No two garments of the same category in an outfit.
      if (current.some((c) => c.garment.category === cand.garment.category)) continue;
      if (cand.garment.category === target.garment.category) continue;
      const nextSets = commonSets.concat(cand.paletteIds);
      const nextIntersection = intersectSets(nextSets);
      if (nextIntersection.size === 0) continue;
      current.push(cand);
      pick(i + 1, current, nextSets);
      current.pop();
    }
  };
  pick(0, [], [target.paletteIds]);
}

function sortOutfitGarments(garments: GarmentWithColors[]): GarmentWithColors[] {
  const rank = (cat: string) => {
    const i = CATEGORY_LAYOUT_ORDER.indexOf(cat as (typeof CATEGORY_LAYOUT_ORDER)[number]);
    return i === -1 ? 99 : i;
  };
  return [...garments].sort((a, b) => rank(a.category) - rank(b.category));
}

function refinePalettes(
  paletteIds: number[],
  ctxs: Ctx[],
  palettes: SanzoPalette[],
): PaletteMatch[] {
  const matches: PaletteMatch[] = [];
  for (const id of paletteIds) {
    const pm = paletteMatchFor(id, palettes, ctxs);
    if (pm) matches.push(pm);
  }
  matches.sort((a, b) => a.totalDistance - b.totalDistance);
  const [primary, ...rest] = matches;
  if (!primary) return matches;
  const tightExtras = rest
    .filter((pm) =>
      pm.colorAssignments.every((a) => a.distance < OKLCH_TIGHT_MATCH_THRESHOLD),
    )
    .slice(0, MAX_EXTRA_PALETTES);
  return [primary, ...tightExtras];
}

export function generateOutfitGroupsForGarment(
  targetGarment: GarmentWithColors,
  allGarments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0,
): { groups: OutfitGroup[]; hasMore: boolean } {
  const targetCtx = buildContext(targetGarment);
  if (!targetCtx) return { groups: [], hasMore: false };

  const candidates: Ctx[] = [];
  for (const g of allGarments) {
    if (g.id === targetGarment.id) continue;
    if (g.category === targetGarment.category) continue;
    const ctx = buildContext(g);
    if (!ctx) continue;
    // Prune: if target + candidate share no palette, we can drop
    // early because deeper sets can only shrink.
    const shared = intersectSets([targetCtx.paletteIds, ctx.paletteIds]);
    if (shared.size === 0) continue;
    candidates.push(ctx);
  }

  const groupsByKey = new Map<string, OutfitGroup>();
  enumerateOutfits(targetCtx, candidates, (ctxs, commonPalettes) => {
    const ids = ctxs.map((c) => c.garment.id).sort();
    const key = ids.join(",");
    if (groupsByKey.has(key)) return;
    const paletteMatches = refinePalettes([...commonPalettes], ctxs, palettes);
    if (paletteMatches.length === 0) return;
    groupsByKey.set(key, {
      garments: sortOutfitGarments(ctxs.map((c) => c.garment)),
      palettes: paletteMatches,
      bestDistance: paletteMatches[0].totalDistance,
    });
  });

  const groups = Array.from(groupsByKey.values());
  groups.sort((a, b) => {
    if (a.garments.length !== b.garments.length) {
      return a.garments.length - b.garments.length;
    }
    return a.bestDistance - b.bestDistance;
  });

  const paginated = groups.slice(offset, offset + limit);
  return { groups: paginated, hasMore: groups.length > offset + limit };
}

export function generateOutfitGroups(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0,
): { groups: OutfitGroup[]; hasMore: boolean } {
  const groupsByKey = new Map<string, OutfitGroup>();
  const contexts: Ctx[] = [];
  for (const g of garments) {
    const ctx = buildContext(g);
    if (ctx) contexts.push(ctx);
  }

  // Use each garment as an anchor in turn — same enumeration as the
  // targeted variant, deduped by garment set.
  for (const target of contexts) {
    const candidates = contexts.filter(
      (c) =>
        c.garment.id !== target.garment.id &&
        c.garment.category !== target.garment.category,
    );
    enumerateOutfits(target, candidates, (ctxs, commonPalettes) => {
      const ids = ctxs.map((c) => c.garment.id).sort();
      const key = ids.join(",");
      if (groupsByKey.has(key)) return;
      const paletteMatches = refinePalettes([...commonPalettes], ctxs, palettes);
      if (paletteMatches.length === 0) return;
      groupsByKey.set(key, {
        garments: sortOutfitGarments(ctxs.map((c) => c.garment)),
        palettes: paletteMatches,
        bestDistance: paletteMatches[0].totalDistance,
      });
    });
  }

  const all = Array.from(groupsByKey.values());
  all.sort((a, b) => {
    if (a.garments.length !== b.garments.length) {
      return a.garments.length - b.garments.length;
    }
    return a.bestDistance - b.bestDistance;
  });

  return { groups: all.slice(offset, offset + limit), hasMore: all.length > offset + limit };
}
