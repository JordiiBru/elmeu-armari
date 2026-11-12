import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import type { PaletteMatch, SanzoPalette, SavedOutfit } from "./types";
import { matchPieces, matchPiecesOn, paletteSetFor as enginePaletteSetFor } from "./engine";
import { VOCABULARY_THRESHOLD } from "./color-matching";

// Every tap rescores every option, and snapping a colour walks the whole
// vocabulary: a piece's palettes are read once per colour set, not once
// per render.
//
// Read at the vocabulary threshold, the looser of the generator's two
// tiers: which palettes are still open must never close on a set that
// `matchPieces` would match from its loose tier, so the counts here are
// the widest the engine allows and the match decides the rest.
const setCache = new Map<string, Set<number> | "any" | null>();
function paletteSetFor(g: GarmentWithColors): Set<number> | "any" | null {
  const key = `${g.id}:${g.colors.map((c) => c.hex).join(",")}`;
  if (!setCache.has(key)) setCache.set(key, enginePaletteSetFor(g, VOCABULARY_THRESHOLD));
  return setCache.get(key)!;
}

/**
 * The outfit builder on "què em poso?": one piece per slot, tried and
 * swapped by hand, with the palette recomputed on every tap.
 *
 * Pure on purpose. The component only holds the picks; everything it
 * shows (which options still fit, how many palettes each keeps, the
 * palette the pieces are worn in, the saved outfits that already contain
 * them) comes from here, through the engine's own measure — the builder
 * never runs a second colour search that could drift from the generator.
 *
 * A jersei and a samarreta share one slot: on top, the sweater covers
 * the shirt, so the top is one decision. Accessories are optional and
 * many, and they do take part in the palette: a green bag on an outfit
 * whose palette has a green is that outfit, and the same clothes without
 * it are another one.
 */
export type Slot = "TOP" | "PANTS" | "SHOES" | "ACCESSORIES";
export const SLOTS: Slot[] = ["TOP", "PANTS", "SHOES", "ACCESSORIES"];
/** What an outfit cannot be saved without. */
const REQUIRED_SLOTS: Slot[] = ["TOP", "PANTS", "SHOES"];

export function slotOf(category: Category | string): Slot | null {
  switch (category) {
    case "SHIRT":
    case "SWEATER":
      return "TOP";
    case "PANTS":
      return "PANTS";
    case "SHOES":
      return "SHOES";
    case "ACCESSORI":
      return "ACCESSORIES";
    default:
      // Outerwear is chosen for the weather once the look is decided.
      return null;
  }
}

export interface Picks {
  TOP?: GarmentWithColors;
  PANTS?: GarmentWithColors;
  SHOES?: GarmentWithColors;
  ACCESSORIES: GarmentWithColors[];
}

export const EMPTY_PICKS: Picks = { ACCESSORIES: [] };

/** Top to bottom, then what you carry: the order the stage draws. */
export function pickedPieces(picks: Picks): GarmentWithColors[] {
  return [picks.TOP, picks.PANTS, picks.SHOES, ...picks.ACCESSORIES].filter(
    (g): g is GarmentWithColors => g !== undefined,
  );
}

export function isPicked(picks: Picks, garment: GarmentWithColors): boolean {
  return pickedPieces(picks).some((g) => g.id === garment.id);
}

/**
 * Toggles a piece into its slot. A single slot swaps (tapping the same
 * piece again empties it); accessories add and remove one by one.
 */
export function togglePick(picks: Picks, garment: GarmentWithColors): Picks {
  const slot = slotOf(garment.category);
  if (!slot) return picks;
  if (slot === "ACCESSORIES") {
    const has = picks.ACCESSORIES.some((g) => g.id === garment.id);
    return {
      ...picks,
      ACCESSORIES: has
        ? picks.ACCESSORIES.filter((g) => g.id !== garment.id)
        : [...picks.ACCESSORIES, garment],
    };
  }
  const next = { ...picks };
  if (picks[slot]?.id === garment.id) delete next[slot];
  else next[slot] = garment;
  return next;
}

/** The first required slot still empty, or accessories once all are in. */
export function nextSlot(picks: Picks): Slot {
  return REQUIRED_SLOTS.find((s) => !picks[s as Exclude<Slot, "ACCESSORIES">]) ?? "ACCESSORIES";
}

/**
 * The palettes every coloured piece in `pieces` can share. `null` while
 * nothing narrows it (no piece yet, or only wildcards and colourless
 * ones): every palette is still open. An empty set is a dead end.
 */
export function alivePalettes(pieces: GarmentWithColors[]): Set<number> | null {
  const sets: Set<number>[] = [];
  for (const g of pieces) {
    if (g.colors.length === 0) continue;
    const set = paletteSetFor(g);
    if (set === "any") continue;
    if (set === null) return new Set();
    sets.push(set);
  }
  if (sets.length === 0) return null;
  const [first, ...rest] = sets;
  return new Set([...first].filter((id) => rest.every((s) => s.has(id))));
}

export interface OptionScore {
  garment: GarmentWithColors;
  /** Palettes still open with this piece in its slot; `null` = it does
   * not narrow anything (a wildcard or a colourless accessory). */
  palettes: number | null;
  /** False when it leaves no shared palette at all. */
  fits: boolean;
  /** Black or white: it goes with every palette, so its count says
   * nothing about it. */
  wildcard: boolean;
}

/**
 * Every candidate for `slot`, scored against what is picked in the other
 * slots: a piece already in this slot is judged as its replacement, not
 * on top of itself. Fitting pieces that narrow the most open palettes
 * lead, wildcards after them, and the ones that close every palette
 * last: still offered, because trying is the point, never hidden.
 */
export function scoreOptions(
  candidates: GarmentWithColors[],
  picks: Picks,
  slot: Slot,
  totalPalettes: number,
): OptionScore[] {
  const pieces = pickedPieces(picks);
  const shared = alivePalettes(
    pieces.filter((p) => (slot === "ACCESSORIES" ? true : slotOf(p.category) !== slot)),
  );
  const scored = candidates.map((garment) => {
    // A picked accessory is judged without itself; nothing else changes.
    const base =
      slot === "ACCESSORIES" && pieces.some((p) => p.id === garment.id)
        ? alivePalettes(pieces.filter((p) => p.id !== garment.id))
        : shared;
    const own = garment.colors.length === 0 ? "free" : paletteSetFor(garment);
    let palettes: number | null;
    if (own === "free" || own === "any") {
      palettes = own === "any" ? (base?.size ?? totalPalettes) : null;
    } else if (own === null) {
      palettes = 0;
    } else {
      palettes = base === null ? own.size : [...own].filter((id) => base.has(id)).length;
    }
    const fits = palettes === null || palettes > 0;
    const wildcard = own === "any";
    const free = own === "free";
    return { garment, palettes, fits, wildcard, free };
  });
  const rank = (s: (typeof scored)[number]) => (!s.fits ? 2 : s.wildcard || s.free ? 1 : 0);
  return scored
    .map((s, i) => ({ s, i }))
    .sort(
      (a, b) =>
        rank(a.s) - rank(b.s) ||
        (b.s.palettes ?? 0) - (a.s.palettes ?? 0) ||
        a.i - b.i,
    )
    .map(({ s }) => ({ garment: s.garment, palettes: s.palettes, fits: s.fits, wildcard: s.wildcard }));
}

export interface BuildState {
  /** Required slots still empty. */
  missing: Slot[];
  /** Primary palette first; empty until two coloured pieces share one. */
  matches: PaletteMatch[];
  /** Palettes still open, for the line under the stage. */
  open: number | null;
}

/**
 * `prefer` is a palette to keep in the list even when the engine would
 * not lead with it: the one a saved outfit was saved with, loaded back
 * into the builder. It goes first, so the outfit reads as it was saved.
 */
export function buildState(picks: Picks, palettes: SanzoPalette[], prefer?: number | null): BuildState {
  const pieces = pickedPieces(picks);
  const missing = REQUIRED_SLOTS.filter((s) => !picks[s as Exclude<Slot, "ACCESSORIES">]);
  const open = alivePalettes(pieces);
  let matches = pieces.length >= 2 ? matchPieces(pieces, palettes) : [];
  if (prefer != null && !matches.some((m) => m.palette.id === prefer)) {
    const kept = matchPiecesOn(pieces, palettes, prefer);
    if (kept) matches = [kept, ...matches];
  }
  return { missing, matches, open: open?.size ?? null };
}

/**
 * Accessories that wear a colour of `match`'s palette the outfit does
 * not wear yet: the bag that brings the palette's green in. Read off the
 * engine's own assignment of the outfit with and without the piece.
 */
export function completingAccessories(
  picks: Picks,
  match: PaletteMatch | undefined,
  accessories: GarmentWithColors[],
  palettes: SanzoPalette[],
): Set<string> {
  const out = new Set<string>();
  if (!match) return out;
  const pieces = pickedPieces(picks);
  const worn = new Set(match.colorAssignments.map((a) => a.paletteColorIndex));
  for (const acc of accessories) {
    if (acc.colors.length === 0 || pieces.some((p) => p.id === acc.id)) continue;
    const withIt = matchPieces([...pieces, acc], palettes).find(
      (m) => m.palette.id === match.palette.id,
    );
    if (!withIt) continue;
    const added = withIt.colorAssignments.some(
      (a) => a.garmentId === acc.id && !worn.has(a.paletteColorIndex),
    );
    if (added) out.add(acc.id);
  }
  return out;
}

/** Saved outfits wearing every picked piece: the collection, narrowed by
 * the same taps that build a new one. */
export function savedContaining(outfits: SavedOutfit[], picks: Picks): SavedOutfit[] {
  const ids = pickedPieces(picks).map((g) => g.id);
  if (ids.length === 0) return outfits;
  return outfits.filter((o) => {
    const own = new Set([...o.garments, ...o.accessories].map((g) => g.id));
    return ids.every((id) => own.has(id));
  });
}

/** Picks rebuilt from a saved outfit, to keep trying from it. */
export function picksFromOutfit(outfit: SavedOutfit): Picks {
  const picks: Picks = { ACCESSORIES: [] };
  for (const g of [...outfit.garments, ...outfit.accessories]) {
    const slot = slotOf(g.category);
    if (!slot) continue;
    if (slot === "ACCESSORIES") picks.ACCESSORIES.push(g);
    // A rare layered outfit keeps the sweater: it is the one on show.
    else if (slot !== "TOP" || !picks.TOP || g.category === "SWEATER") picks[slot] = g;
  }
  return picks;
}
