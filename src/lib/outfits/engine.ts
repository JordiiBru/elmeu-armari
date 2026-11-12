import type { GarmentWithColors } from "@/lib/prendas/types";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import type { SanzoPalette, PaletteMatch, OutfitGroup } from "./types";
import { namedColors } from "@/lib/colors";
import type { NamedColor } from "@/lib/colors";
import {
  perceptualDistance,
  VOCABULARY_THRESHOLD,
  TIGHT_MATCH_THRESHOLD,
  MEMBERSHIP_THRESHOLD,
  MAX_EXTRA_PALETTES,
  type RungSlack,
} from "./color-matching";

// The rungs of the grey ramp: Black, White, the three light Sanzo greys
// (C 0.008 to 0.02) and Plumbeous, which the published data makes a lead
// grey (#72737c, C 0.014). A piece that anchors to a rung reads as grey
// (`isGreyColour`), and the slack says how far, in OKLab L, a grey piece may
// sit from the rung on each side and still read as it (`RungSlack`). The
// ramp's one gap is between Black (L 0) and Plumbeous (L 0.56): a charcoal
// stretches up to Black, a dark grey down to Plumbeous. The light greys and
// White sit 0.04 to 0.18 apart and need no slack: plain distance already
// finds the nearest. Plumbeous does not stretch upwards, or it would pull
// light greys away from Warm Gray. Fawn (a pink) and the deep slates are not
// rungs. Keyed by slug, not hex, so new catalogue hex values cannot silently
// drop the slack.
const NO_SLACK: RungSlack = { darker: 0, lighter: 0 };
const GREY_RUNGS = new Map<string, RungSlack>([
  ["black", { darker: 0, lighter: 0.25 }],
  ["deep-violet-plumbeous", { darker: 0.15, lighter: 0 }],
  ["white", NO_SLACK],
  ["warm-gray", NO_SLACK],
  ["neutral-gray", NO_SLACK],
  ["mineral-gray", NO_SLACK],
]);

/**
 * Outfit engine — canonical + intersection.
 *
 * The Sanzo Wada catalogue exposes two related datasets:
 *   - 159 canonical colours (`namedColors`), each with a
 *     `combinations` array listing every palette id it appears in.
 *   - 348 combinations (`palettes`), each a set of 2–6 canonical
 *     hexes.
 *
 * Matching algorithm:
 *
 *   1. Snap every garment colour to its nearest canonical, with the one
 *      continuous `perceptualDistance` from color-matching.ts. Every
 *      canonical within VOCABULARY_THRESHOLD is a candidate; a
 *      colour with none takes the garment out of the vocabulary.
 *   2. A garment "lives in" the intersection of the `combinations`
 *      sets of its snapped canonicals — the palettes that contain
 *      every colour of the piece.
 *   3. A set of garments forms a valid outfit when the intersection
 *      of their palette sets is non-empty and the categorical
 *      constraints hold (≥ 1 pants + ≥ 1 top + ≥ 1 shoe, no repeated
 *      category). A shirt under a sweater is the one
 *      optional top: hidden, so any colour does, and the engine only
 *      surfaces one when it happens to match. A shoe is never
 *      optional — always visible, so no match means no suggestion,
 *      not an incomplete one.
 *
 * There is no palette-coverage requirement: if a palette contains a
 * colour the outfit doesn't wear, that's fine — you're just not
 * wearing that accent. This mirrors how a human reads the catalogue:
 * "these two garments are on the same page of the book, so they go
 * together."
 */

// The extra categories (accessories) never join an outfit: nobody
// picks a look around them, they are chosen when a day is worn. The set
// is the one the data model uses, so the two cannot drift apart. Shoes
// used to be excluded here too — the model has since changed to let the
// outfit commit to the shoes it was matched with, rather than picking
// them separately each time it's worn.
const MIN_PIECES = 2;

// A palette is a meaningful anchor for an outfit only if the outfit
// actually wears at least this many distinct palette slots. Otherwise
// the outfit is monochrome-ish (e.g. black shirt + black pants) and
// the palette shown next to it — a "black + accent" combination — is
// misleading because the accent is not worn.
const MIN_DISTINCT_PALETTE_COLORS = 2;

// Pure black and pure white go with everything: real styling does not wait
// for the Sanzo Wada catalogue to agree that a black shoe, or a white
// sweater, goes with a saturated outfit, and the catalogue is nearly blind
// to them (White is in one of its 348 palettes). A piece whose colours all
// anchor to one of these is a wildcard in the palette intersection. This was
// a shoe-only rule; a white sweater with black trousers matched nothing.
const NEUTRAL_SLUGS = new Set(["black", "white"]);

// A grey shoe goes with everything too, the way a black or white one does:
// it is never what a look is built around. Only shoes: a grey top or pair of
// trousers is a real part of the look and keeps narrowing the palettes (15
// of the 36 tops and trousers in the dev wardrobe are grey). Without this,
// 20 top and trouser pairs on the dev wardrobe shared a palette but had no
// shoe that fitted it, so the builder could never save them (#220).
function isWildcard(g: GarmentWithColors, snaps: Snap[]): boolean {
  if (snaps.every((s) => NEUTRAL_SLUGS.has(s.best.canonical.slug))) return true;
  return g.category === "SHOES" && snaps.every((s) => GREY_RUNGS.has(s.best.canonical.slug));
}
const ALL_PALETTE_IDS: Set<number> = new Set(namedColors.flatMap((c) => c.combinations));

// What a colour with no anchor inside a palette adds to that palette's
// score. An anchored colour is always closer than the vocabulary threshold
// (that is what makes it a candidate), so this can never be undercut: an
// unanchored piece never scores better than an anchored one.
const UNANCHORED_PENALTY = VOCABULARY_THRESHOLD;

// Order in which garments should be laid out in a rendered outfit.
const CATEGORY_LAYOUT_ORDER = ["SHIRT", "SWEATER", "PANTS", "SHOES"] as const;

// A well-stocked wardrobe with shoes mandatory and black/white riding
// in for free clears a thousand valid combinations without trying —
// mathematically real, but nobody is choosing among a thousand outfits
// for one shirt. Capped to the best of them (already sorted by piece
// count then colour distance before this runs) rather than left to
// pagination to hide the scale of it one page at a time.
const MAX_GROUPS = 60;

// What one shared piece costs a group against the most similar one already
// chosen, in the same units as `bestDistance`. On the dev wardrobe 6 is the
// first value at which no two of the top ten share two of their three
// pieces; 8 keeps a margin and costs half a point of mean distance over the
// top 60 (5.5 to 6.0).
const DIVERSITY_PENALTY: number = 8;

// Below this many groups at the strict membership threshold the result is
// topped up from the vocabulary threshold, so a small wardrobe still gets
// suggestions instead of an empty screen.
const LOOSE_FALLBACK_BELOW = 5;

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
  /** A wildcard: every colour anchors to Black or White, or the piece is a
   * shoe whose colours all anchor to a grey rung. See `isWildcard`. */
  neutral: boolean;
}

/**
 * The distance the snap ranks a canonical by: `perceptualDistance` with the
 * canonical's grey-ramp slack when it is a rung. Exported so tests can read
 * the same number the engine compares.
 */
export function snapDistance(hex: string, canonical: NamedColor): number {
  return perceptualDistance(hex, canonical.hex, GREY_RUNGS.get(canonical.slug));
}

function snapColour(hex: string, membership: number = MEMBERSHIP_THRESHOLD): Snap | null {
  // One measure for every colour, no branches by chroma: a piece the
  // engine cannot place is one that sits beyond the threshold from
  // every canonical, greys included. All the plausible readings are
  // kept, so the piece belongs to any palette containing any of them;
  // the nearest stays as the display anchor.
  const found: Candidate[] = [];
  for (const canonical of namedColors) {
    const distance = snapDistance(hex, canonical);
    if (distance < VOCABULARY_THRESHOLD) found.push({ canonical, distance });
  }
  if (found.length === 0) return null;
  found.sort((a, b) => a.distance - b.distance);
  // The nearest reading always stays (it is the display anchor and keeps
  // a piece that only fits loosely inside the vocabulary); the others must
  // be within the membership threshold to widen the palettes it lives in.
  return { best: found[0], candidates: found.filter((c, i) => i === 0 || c.distance < membership) };
}

/**
 * The canonical colour a garment hex is displayed as: the nearest of
 * its plausible readings, or `null` when the colour is outside the
 * Sanzo Wada vocabulary. Exported so the reference set in
 * `anchor-reference.ts` can judge the snap without going through a
 * whole outfit.
 */
export function anchorFor(hex: string): Candidate | null {
  return snapColour(hex)?.best ?? null;
}

/**
 * True when a colour reads as a grey to the engine: it snaps to a rung of
 * the grey ramp (Black, White, a Sanzo grey). This is the snap deciding,
 * not a chroma line, so a tinted grey is neutral and a dull pink is not.
 */
export function isGreyColour(hex: string): boolean {
  const anchor = anchorFor(hex);
  return anchor !== null && GREY_RUNGS.has(anchor.canonical.slug);
}

/**
 * Every canonical a garment hex is willing to live in, nearest first.
 * These decide palette membership, so a piece that is only willing to be
 * what it looks like is a property worth testing on its own.
 */
export function candidatesFor(hex: string): Candidate[] {
  return snapColour(hex)?.candidates ?? [];
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

function buildContext(
  g: GarmentWithColors,
  membership: number = MEMBERSHIP_THRESHOLD,
  /** The builder reads accessories through the same measure; the
   * generator never does (see `EXTRA_CATEGORIES` above). */
  allowExtras = false,
): Ctx | null {
  if (!allowExtras && EXTRA_CATEGORIES.has(g.category)) return null;
  if (g.colors.length === 0) return null;

  const snaps: Snap[] = [];
  for (const c of g.colors) {
    const s = snapColour(c.hex, membership);
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
  // A wildcard (black or white, or a grey shoe) lives in every palette, so it
  // never narrows the ones an outfit can be cited on. Its own colours are
  // still anchored where the palette has them (and cost a penalty where it
  // does not, see `paletteMatchFor`), which ranks a palette that really
  // contains the wildcard's colour above one that merely tolerates it.
  const neutral = isWildcard(g, snaps);
  const paletteIds = neutral ? ALL_PALETTE_IDS : intersectSets(perColour);
  if (paletteIds.size === 0) return null;

  const totalDistance = snaps.reduce((sum, s) => sum + s.best.distance, 0);
  return { garment: g, snaps, paletteIds, totalDistance, neutral };
}

function hasTop(cats: Set<string>): boolean {
  return cats.has("SHIRT") || cats.has("SWEATER");
}
function hasBottom(cats: Set<string>): boolean {
  return cats.has("PANTS");
}
// A shirt under a sweater stays optional — it's hidden, so any colour
// does, and the engine already only surfaces one when it happens to
// match. Shoes are the opposite: always visible, so a suggestion with
// none isn't an incomplete outfit, it's a wrong one.
function hasShoes(cats: Set<string>): boolean {
  return cats.has("SHOES");
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

  let unanchored = 0;
  // A wildcard piece the palette has no colour for rides along: it is not
  // worn *in* the palette, but it does not make the outfit monochrome either.
  let ridesFree = false;

  // Every colour of every piece gets its own anchor inside this palette,
  // not just the first colour of each: membership already required all of
  // them, so scoring only one let a two-colour shirt look as good as its
  // better-matching half.
  for (const c of ctxs) {
    for (const snap of c.snaps) {
      // The candidate canonical that actually belongs to this palette,
      // closest first, is this colour's anchor inside it.
      let anchor: Candidate | null = null;
      for (const cand of snap.candidates) {
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
      if (anchor) {
        totalDistance += anchor.distance;
      } else {
        // Reachable through a wildcard piece (see `isWildcard`), which
        // rides along in a palette that lacks its colour. It used to add
        // nothing, so an incomplete match scored better than a complete
        // one; it now pays a fixed price no anchored colour can undercut.
        totalDistance += UNANCHORED_PENALTY;
        unanchored++;
        if (c.neutral) ridesFree = true;
      }
    }
  }

  if (matchedIndices.size + (ridesFree ? 1 : 0) < MIN_DISTINCT_PALETTE_COLORS) return null;

  const unmatchedColors: number[] = [];
  for (let i = 0; i < palette.colores.length; i++) {
    if (!matchedIndices.has(i)) unmatchedColors.push(i);
  }

  return { palette, colorAssignments, unmatchedColors, totalDistance, unanchored };
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
        if (hasBottom(cats) && hasTop(cats) && hasShoes(cats)) {
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

      const withCandSets = commonSets.concat(cand.paletteIds);
      const withCandIntersection = intersectSets(withCandSets);

      if (withCandIntersection.size === 0) continue;

      current.push(cand);
      pick(i + 1, current, withCandSets);
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

/**
 * Push sweater-anchored groups to the very end when the sweater is out of
 * season — never dropped, only deprioritised, per the product rule. A
 * pure post-sort: it never touches which groups exist, only their order,
 * so it composes with whatever the caller already sorted by.
 */
function sortBySweaterSeason(groups: OutfitGroup[], sweaterInSeason: boolean): OutfitGroup[] {
  if (sweaterInSeason) return groups;
  const inSeason: OutfitGroup[] = [];
  const outOfSeason: OutfitGroup[] = [];
  for (const g of groups) {
    (g.garments.some((garment) => garment.category === "SWEATER") ? outOfSeason : inSeason).push(g);
  }
  return [...inSeason, ...outOfSeason];
}

/**
 * Same idea as `sortBySweaterSeason`, for the one category with exactly
 * one season: a group built around shorts only sinks — it's still the
 * most literal answer to "what goes with this", just not the one worth
 * leading with in November. Independent of the sweater sink: summer
 * (shorts out) and sweater-season (autumn/winter/spring) never overlap,
 * so the two sinks never fight over the same group.
 */
function sortByShortsSeason(groups: OutfitGroup[], shortsInSeason: boolean): OutfitGroup[] {
  if (shortsInSeason) return groups;
  const inSeason: OutfitGroup[] = [];
  const outOfSeason: OutfitGroup[] = [];
  for (const g of groups) {
    const hasShorts = g.garments.some(
      (garment) => garment.category === "PANTS" && garment.length === "SHORT",
    );
    (hasShorts ? outOfSeason : inSeason).push(g);
  }
  return [...inSeason, ...outOfSeason];
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
      pm.colorAssignments.every((a) => a.distance < TIGHT_MATCH_THRESHOLD),
    )
    .slice(0, MAX_EXTRA_PALETTES);
  return [primary, ...tightExtras];
}

function groupKey(g: OutfitGroup): string {
  return g.garments
    .map((x) => x.id)
    .sort()
    .join(",");
}

/** How many groups are considered for the diversified selection. The rest
 * are worse on the plain ranking and would only make the greedy pass slow on
 * a big wardrobe; `MAX_GROUPS` of them are kept. */
const DIVERSITY_POOL = 400;

/**
 * Greedy diversification: picks the next group by the plain ranking key
 * (fewest pieces, then distance) with a price on similarity, the number of
 * pieces it shares with the most similar group already chosen times
 * `DIVERSITY_PENALTY`. Without it the top of the list is one look with a
 * different shirt: on a wardrobe where 11 of 45 colours are black, the same
 * black trousers and shoes carried every result.
 *
 * `anchorId` is a piece every group already has (the one "què hi combina"
 * was asked about): it says nothing about how alike two groups are, so it
 * is left out of the count.
 */
function diversify(sorted: OutfitGroup[], anchorId?: string): OutfitGroup[] {
  if (DIVERSITY_PENALTY === 0) return sorted;
  const pool = sorted.slice(0, DIVERSITY_POOL).map((group) => ({
    group,
    ids: new Set(group.garments.map((g) => g.id).filter((id) => id !== anchorId)),
    // Highest count of pieces shared with anything chosen so far.
    maxShared: 0,
  }));
  const chosen: OutfitGroup[] = [];
  while (pool.length > 0 && chosen.length < MAX_GROUPS) {
    let best = 0;
    for (let i = 1; i < pool.length; i++) {
      const a = pool[i];
      const b = pool[best];
      if (a.group.garments.length !== b.group.garments.length) {
        if (a.group.garments.length < b.group.garments.length) best = i;
        continue;
      }
      const costA = a.group.bestDistance + DIVERSITY_PENALTY * a.maxShared;
      const costB = b.group.bestDistance + DIVERSITY_PENALTY * b.maxShared;
      if (costA < costB) best = i;
    }
    const [picked] = pool.splice(best, 1);
    chosen.push(picked.group);
    for (const other of pool) {
      let shared = 0;
      for (const id of picked.ids) if (other.ids.has(id)) shared++;
      if (shared > other.maxShared) other.maxShared = shared;
    }
  }
  return [...chosen, ...sorted.slice(DIVERSITY_POOL)];
}

/** Fewest pieces first, then closest to the catalogue, diversified so the
 * top is not one look; out-of-season sweaters and shorts sink to the end
 * without leaving. */
function rankGroups(
  groups: OutfitGroup[],
  sweaterInSeason: boolean,
  shortsInSeason: boolean,
  anchorId?: string,
): OutfitGroup[] {
  const sorted = [...groups].sort((a, b) => {
    if (a.garments.length !== b.garments.length) {
      return a.garments.length - b.garments.length;
    }
    return a.bestDistance - b.bestDistance;
  });
  return sortByShortsSeason(
    sortBySweaterSeason(diversify(sorted, anchorId), sweaterInSeason),
    shortsInSeason,
  );
}

/**
 * Runs a generation at the strict membership threshold and, only when that
 * leaves fewer than `LOOSE_FALLBACK_BELOW` groups (a small wardrobe, where
 * being strict would empty the screen), tops it up with what the vocabulary
 * threshold allows. Strict groups always rank first; the loose ones follow,
 * ranked the same way. A well-stocked wardrobe never sees the second tier.
 */
function generateTiered(
  collect: (membership: number) => OutfitGroup[],
  sweaterInSeason: boolean,
  shortsInSeason: boolean,
  anchorId?: string,
): OutfitGroup[] {
  const strict = rankGroups(collect(MEMBERSHIP_THRESHOLD), sweaterInSeason, shortsInSeason, anchorId);
  if (strict.length >= LOOSE_FALLBACK_BELOW) return strict.slice(0, MAX_GROUPS);
  const seen = new Set(strict.map(groupKey));
  const loose = rankGroups(
    collect(VOCABULARY_THRESHOLD).filter((g) => !seen.has(groupKey(g))),
    sweaterInSeason,
    shortsInSeason,
    anchorId,
  );
  return [...strict, ...loose].slice(0, MAX_GROUPS);
}

function collectGroups(
  targets: Ctx[],
  candidatesOf: (target: Ctx) => Ctx[],
  palettes: SanzoPalette[],
): OutfitGroup[] {
  const groupsByKey = new Map<string, OutfitGroup>();
  for (const target of targets) {
    enumerateOutfits(target, candidatesOf(target), (ctxs, commonPalettes) => {
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
  return Array.from(groupsByKey.values());
}

/**
 * The palettes one piece can be worn in, by the same rule the generator
 * uses to enumerate: `"any"` for a black or white wildcard, `null` when a
 * colour sits outside the vocabulary (it can never be matched) or the
 * piece has no colour at all. Accessories are read too: the outfit
 * builder lets them narrow the palette, the generator still does not.
 */
export function paletteSetFor(
  g: GarmentWithColors,
  membership: number = MEMBERSHIP_THRESHOLD,
): Set<number> | "any" | null {
  const ctx = buildContext(g, membership, true);
  if (!ctx) return null;
  return ctx.neutral ? "any" : ctx.paletteIds;
}

/**
 * The palettes a hand-picked set of pieces is worn in, scored and
 * refined exactly as a generated group's are: the builder's live palette
 * and a generated card can never disagree about the same pieces.
 * Colourless pieces (a silver ring) ride along without a say. Empty when
 * a coloured piece is out of the vocabulary or no palette is shared.
 *
 * Strict membership first and the vocabulary threshold only when that
 * finds nothing, the same two tiers as `generateTiered`: a set the
 * generator offered from its loose tier (and that was saved from it) must
 * still have its palette here.
 */
export function matchPieces(garments: GarmentWithColors[], palettes: SanzoPalette[]): PaletteMatch[] {
  const at = (membership: number): PaletteMatch[] => {
    const ctxs: Ctx[] = [];
    for (const g of garments) {
      if (g.colors.length === 0) continue;
      const ctx = buildContext(g, membership, true);
      if (!ctx) return [];
      ctxs.push(ctx);
    }
    if (ctxs.length < 2) return [];
    const common = intersectSets(ctxs.map((c) => c.paletteIds));
    return refinePalettes([...common], ctxs, palettes);
  };
  const strict = at(MEMBERSHIP_THRESHOLD);
  return strict.length > 0 ? strict : at(VOCABULARY_THRESHOLD);
}

/**
 * The pieces scored on one given palette, or `null` when they do not all
 * live in it. For a saved outfit whose palette is not among the ones
 * `matchPieces` leads with (an extra the refinement cut, or one saved
 * from the loose tier): the builder still shows the palette it was
 * saved with.
 */
export function matchPiecesOn(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[],
  paletteId: number,
): PaletteMatch | null {
  const ctxs: Ctx[] = [];
  for (const g of garments) {
    if (g.colors.length === 0) continue;
    const ctx = buildContext(g, VOCABULARY_THRESHOLD, true);
    if (!ctx || !ctx.paletteIds.has(paletteId)) return null;
    ctxs.push(ctx);
  }
  if (ctxs.length < 2) return null;
  return paletteMatchFor(paletteId, palettes, ctxs);
}

export function generateOutfitGroupsForGarment(
  targetGarment: GarmentWithColors,
  allGarments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0,
  /** Whether sweater-anchored groups should rank normally (true, the
   * default — jersey season, or the user forced it on) or sink to the end
   * (false — out of season, or forced off). Never excludes them. */
  sweaterInSeason: boolean = true,
  /** Same, for groups built around shorts. */
  shortsInSeason: boolean = true,
): { groups: OutfitGroup[]; hasMore: boolean } {
  const collect = (membership: number): OutfitGroup[] => {
    const targetCtx = buildContext(targetGarment, membership);
    if (!targetCtx) return [];

    const candidates: Ctx[] = [];
    for (const g of allGarments) {
      if (g.id === targetGarment.id) continue;
      if (g.category === targetGarment.category) continue;
      const ctx = buildContext(g, membership);
      if (!ctx) continue;
      // Prune: if target + candidate share no palette, we can drop early
      // because deeper sets can only shrink. A black or white piece never
      // triggers it: its set is every palette.
      const shared = intersectSets([targetCtx.paletteIds, ctx.paletteIds]);
      if (shared.size === 0) continue;
      candidates.push(ctx);
    }
    return collectGroups([targetCtx], () => candidates, palettes);
  };

  const ranked = generateTiered(collect, sweaterInSeason, shortsInSeason, targetGarment.id);
  return { groups: ranked.slice(offset, offset + limit), hasMore: ranked.length > offset + limit };
}

export function generateOutfitGroups(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[],
  limit: number = 10,
  offset: number = 0,
  sweaterInSeason: boolean = true,
  shortsInSeason: boolean = true,
): { groups: OutfitGroup[]; hasMore: boolean } {
  const collect = (membership: number): OutfitGroup[] => {
    const contexts: Ctx[] = [];
    for (const g of garments) {
      const ctx = buildContext(g, membership);
      if (ctx) contexts.push(ctx);
    }
    // Use each garment as an anchor in turn — same enumeration as the
    // targeted variant, deduped by garment set.
    return collectGroups(
      contexts,
      (target) =>
        contexts.filter(
          (c) =>
            c.garment.id !== target.garment.id && c.garment.category !== target.garment.category,
        ),
      palettes,
    );
  };

  const ranked = generateTiered(collect, sweaterInSeason, shortsInSeason);
  return { groups: ranked.slice(offset, offset + limit), hasMore: ranked.length > offset + limit };
}
