import type { GarmentWithColors } from "@/lib/prendas/types";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { namedColors, palettes as allPalettes } from "@/lib/colors";
import type { OutfitGroup, SanzoPalette } from "./types";
import { allOutfitGroupsForGarment, anchorFor, isWildcardGarment } from "./engine";
import { hexToOklch, MEMBERSHIP_THRESHOLD, perceptualDistance } from "./color-matching";

/**
 * "Què em compro?": a piece that does not exist yet, a category and a
 * colour, scored against the wardrobe by the same engine that builds the
 * outfits. A view, not a record: nothing here is saved.
 *
 * Only the categories that take part in colour matching. Outerwear and
 * accessories attach to the day (`EXTRA_CATEGORIES`), so the engine has
 * nothing to say about their colour.
 */
export const SHOPPING_CATEGORIES = ["PANTS", "SHIRT", "SWEATER", "SHOES"] as const;
export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

/** Colour families, by OKLCH hue, with the near-greys apart. */
export type Family = "neutral" | "earth" | "green" | "blue" | "purple" | "red";

/** Below this chroma a colour reads as a neutral whatever its hue: black,
 * white, the greys, Plumbeous. Measured on the 159 Sanzo colours: at 0.04
 * Glaucous Green, Nile Blue and Grayish Lavender counted as greys and were
 * offered as trousers, though each one reads as a pale tint. */
const NEUTRAL_MAX_CHROMA = 0.025;

/** Hue bands in degrees, read off the Sanzo colours sorted by hue: the
 * browns, camels and ochres run 40–100, olives 100–175, teals and blues
 * 175–275, violets 275–345, and the reds wrap round 0. */
const HUE_BANDS: { family: Exclude<Family, "neutral">; from: number; to: number }[] = [
  { family: "earth", from: 40, to: 100 },
  { family: "green", from: 100, to: 175 },
  { family: "blue", from: 175, to: 275 },
  { family: "purple", from: 275, to: 345 },
];

export function familyOf(hex: string): Family {
  const { C, h } = hexToOklch(hex);
  if (C < NEUTRAL_MAX_CHROMA) return "neutral";
  return HUE_BANDS.find((b) => h >= b.from && h < b.to)?.family ?? "red";
}

/** The chroma a top (shirt or sweater) can carry before it reads as
 * neon: keeps mustard and coral, drops Spectrum Red and Orange. */
const TOP_MAX_CHROMA = 0.16;

/**
 * Which colours a person actually buys in each category. Trousers and
 * shoes are where the dictionary's brights are least wearable, so they
 * get explicit families: neutrals, earth tones (camel, khaki, chocolate,
 * stone), dull dark greens (olive, bottle), blues from navy to a light
 * denim wash, and deep reds (burgundy). Pastels and brights stay out.
 * Each line is a rule a person would say out loud; tune it against the
 * named cases in `tests/unit/shopping.test.ts`, not by eye.
 */
const WEARABLE: Record<ShoppingCategory, (family: Family, L: number, C: number, h: number) => boolean> = {
  PANTS: (family, L, C, h) => {
    switch (family) {
      case "neutral":
        return true;
      case "earth":
        // Camel to chocolate, and the pale ones only as stone or ecru.
        return C <= 0.105 && (L <= 0.85 || C <= 0.075);
      case "green":
        return L <= 0.66 && C <= 0.09;
      case "blue":
        // Navy and denim; not the teals, not a bright mid blue.
        return h >= 205 && C <= 0.12 && L <= 0.8 && !(C > 0.1 && L > 0.45);
      case "red":
        return L <= 0.45 && C <= 0.15;
      case "purple":
        return false;
    }
  },
  SHOES: (family, L, C) => {
    switch (family) {
      case "neutral":
        return true;
      case "earth":
        return C <= 0.11 && L <= 0.8;
      case "green":
        return L <= 0.5 && C <= 0.07;
      case "blue":
        return L <= 0.45 && C <= 0.12;
      case "red":
        return L <= 0.45 && C <= 0.15;
      case "purple":
        return false;
    }
  },
  SHIRT: (_f, _L, C) => C <= TOP_MAX_CHROMA,
  SWEATER: (_f, _L, C) => C <= TOP_MAX_CHROMA,
};

export function isWearableIn(category: ShoppingCategory, hex: string): boolean {
  const { L, C, h } = hexToOklch(hex);
  return WEARABLE[category](familyOf(hex), L, C, h);
}

/** Closer than this to a piece you already own in the same category and
 * the new one is the same piece again. The membership threshold: inside
 * it, two colours live in the same palettes. */
const DUPLICATE_DISTANCE = MEMBERSHIP_THRESHOLD;

/** Verdict thresholds. `GREAT_NEW_PALETTES` palettes nobody in the
 * wardrobe reaches today is a new way of dressing; `GOOD_PARTNER_SHARE`
 * of the pieces it could be worn with is a piece that earns its place
 * even without opening anything new. */
const GREAT_NEW_PALETTES = 3;
const GOOD_PARTNER_SHARE = 0.5;

type Verdict = "great" | "good" | "weak" | "duplicate" | "none";

/** One example look with the new piece, as the card and the detail show it. */
export interface Example {
  group: OutfitGroup;
  palette: SanzoPalette;
  /** Which colour of the palette the new piece is worn as, if any. */
  candidateIndex: number | null;
  /** A palette no outfit of the current wardrobe reaches. */
  fresh: boolean;
}

export interface Assessment {
  hex: string;
  category: ShoppingCategory;
  /** The Sanzo name the app would give it, or null outside the vocabulary. */
  name: string | null;
  family: Family;
  wearable: boolean;
  /** Pieces of the same category already this colour. */
  duplicates: GarmentWithColors[];
  /** Every palette its outfits are cited on, most used first. */
  palettes: SanzoPalette[];
  /** The ones no outfit of the current wardrobe reaches. */
  newPalettes: SanzoPalette[];
  /** The pieces it would be worn with, most often first. */
  partners: GarmentWithColors[];
  /** How many pieces it could have been worn with (the other engine
   * categories), so `partners` reads as a share. */
  partnerPool: number;
  /** Example looks, one per palette: new palettes first, then the ones
   * built on pieces with a colour of their own rather than on black and
   * white, which go with anything and so say nothing. */
  examples: Example[];
  /** The coloured pieces of those looks (black and white only when there
   * is nothing else): a preview of the detail, never a piece the detail
   * does not show. */
  featured: GarmentWithColors[];
  verdict: Verdict;
}

/** The id the hypothetical piece carries inside the engine. */
export const CANDIDATE_ID = "__candidate__";

function hypothetical(category: ShoppingCategory, hex: string): GarmentWithColors {
  const epoch = new Date(0);
  return {
    id: CANDIDATE_ID,
    category,
    texture: null,
    pattern: null,
    size: null,
    subtype: null,
    // Long trousers: a short pair would sink out of season.
    length: category === "PANTS" ? "LONG" : null,
    fit: null,
    cropped: false,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: epoch,
    updatedAt: epoch,
    colors: [{ id: `${CANDIDATE_ID}-c0`, hex }],
    seasons: [],
  };
}

/**
 * The wardrobe, read once: the pieces the engine matches and the palettes
 * their outfits already reach. Building it runs the engine once per piece,
 * so callers keep it and pass it to every assessment.
 */
export interface WardrobeReach {
  pieces: GarmentWithColors[];
  reached: Set<number>;
}

export function wardrobeReach(
  garments: GarmentWithColors[],
  palettes: SanzoPalette[] = allPalettes,
): WardrobeReach {
  // Clean or dirty does not matter: you are buying for the whole wardrobe.
  const pieces = garments.filter((g) => !EXTRA_CATEGORIES.has(g.category) && g.colors.length > 0);
  const reached = new Set<number>();
  for (const g of pieces) {
    for (const group of allOutfitGroupsForGarment(g, pieces, palettes)) {
      reached.add(group.palettes[0].palette.id);
    }
  }
  return { pieces, reached };
}

/** Same piece again: one of its colours has the same Sanzo name, or sits
 * inside the duplicate distance. The name catches two olives the snap
 * reads alike even when their hexes are a little further apart. */
function isDuplicate(hex: string, anchor: string | null, garment: GarmentWithColors): boolean {
  return garment.colors.some(
    (c) =>
      perceptualDistance(hex, c.hex) < DUPLICATE_DISTANCE ||
      (anchor !== null && anchorFor(c.hex)?.canonical.name === anchor),
  );
}

function verdictFor(a: Omit<Assessment, "verdict">): Verdict {
  if (a.examples.length === 0) return "none";
  if (a.duplicates.length > 0) return "duplicate";
  if (a.newPalettes.length >= GREAT_NEW_PALETTES) return "great";
  const share = a.partnerPool === 0 ? 0 : a.partners.length / a.partnerPool;
  if (a.newPalettes.length > 0 || share >= GOOD_PARTNER_SHARE) return "good";
  return "weak";
}

/** How many example outfits an assessment keeps. */
const MAX_EXAMPLE_OUTFITS = 4;

export function assessColour(
  category: ShoppingCategory,
  hex: string,
  reach: WardrobeReach,
  palettes: SanzoPalette[] = allPalettes,
): Assessment {
  // Uncapped: the ranked list keeps 60 groups, and the palettes only a
  // larger look reaches would fall out of the count.
  const groups = allOutfitGroupsForGarment(hypothetical(category, hex), reach.pieces, palettes);

  const paletteUse = new Map<number, { palette: SanzoPalette; n: number }>();
  const partnerUse = new Map<string, { garment: GarmentWithColors; n: number }>();
  for (const group of groups) {
    const p = group.palettes[0].palette;
    paletteUse.set(p.id, { palette: p, n: (paletteUse.get(p.id)?.n ?? 0) + 1 });
    for (const g of group.garments) {
      if (g.id === CANDIDATE_ID) continue;
      partnerUse.set(g.id, { garment: g, n: (partnerUse.get(g.id)?.n ?? 0) + 1 });
    }
  }
  const byUse = <T extends { n: number }>(m: Map<unknown, T>) => [...m.values()].sort((a, b) => b.n - a.n);
  const usedPalettes = byUse(paletteUse).map((u) => u.palette);
  const newPalettes = usedPalettes.filter((p) => !reach.reached.has(p.id));
  const fresh = new Set(newPalettes.map((p) => p.id));

  // One example per palette, the new ones first, then the looks carried
  // by coloured pieces (a black tee and white trainers fit every palette,
  // so a look of them shows nothing), then fewest pieces and closest to
  // the book, the engine's own key. Four looks on one palette would show
  // one idea four times.
  const wild = new Map<string, boolean>();
  const isWild = (g: GarmentWithColors) => {
    if (!wild.has(g.id)) wild.set(g.id, isWildcardGarment(g));
    return wild.get(g.id)!;
  };
  const wildCount = (g: OutfitGroup) => g.garments.filter((x) => x.id !== CANDIDATE_ID && isWild(x)).length;
  const ordered = [...groups].sort(
    (a, b) =>
      Number(fresh.has(b.palettes[0].palette.id)) - Number(fresh.has(a.palettes[0].palette.id)) ||
      wildCount(a) - wildCount(b) ||
      a.garments.length - b.garments.length ||
      a.bestDistance - b.bestDistance,
  );
  const examples: Example[] = [];
  const shown = new Set<number>();
  for (const g of ordered) {
    const match = g.palettes[0];
    if (shown.has(match.palette.id)) continue;
    shown.add(match.palette.id);
    examples.push({
      group: g,
      palette: match.palette,
      candidateIndex: match.colorAssignments.find((c) => c.garmentId === CANDIDATE_ID)?.paletteColorIndex ?? null,
      fresh: fresh.has(match.palette.id),
    });
    if (examples.length === MAX_EXAMPLE_OUTFITS) break;
  }

  const seen = new Set<string>();
  const inExamples: GarmentWithColors[] = [];
  for (const ex of examples) {
    for (const g of ex.group.garments) {
      if (g.id === CANDIDATE_ID || seen.has(g.id)) continue;
      seen.add(g.id);
      inExamples.push(g);
    }
  }
  // Black and white only when the looks have nothing else to show.
  const coloured = inExamples.filter((g) => !isWild(g));
  const featured = coloured.length > 0 ? coloured : inExamples;

  const name = anchorFor(hex)?.canonical.name ?? null;
  const base = {
    hex,
    category,
    name,
    family: familyOf(hex),
    wearable: isWearableIn(category, hex),
    duplicates: reach.pieces.filter((g) => g.category === category && isDuplicate(hex, name, g)),
    palettes: usedPalettes,
    newPalettes,
    partners: byUse(partnerUse).map((u) => u.garment),
    partnerPool: reach.pieces.filter((g) => g.category !== category).length,
    examples,
    featured,
  };
  return { ...base, verdict: verdictFor(base) };
}

/**
 * The dictionary colours worth buying in a category, best first: wearable
 * there, not a piece you already own, and not a near twin of a colour
 * already on the list (three burgundies are one suggestion). Ranked by
 * the palettes it opens that the wardrobe does not reach, then by how
 * many pieces it goes with. Never by outfit count: the engine caps its
 * ranking, so that number saturates.
 */
export function recommendColours(
  category: ShoppingCategory,
  reach: WardrobeReach,
  palettes: SanzoPalette[] = allPalettes,
): Assessment[] {
  return rankRecommendations(
    candidateColours(category).map((hex) => assessColour(category, hex, reach, palettes)),
  );
}

/** The dictionary colours wearable in a category: what `recommendColours`
 * assesses. Exposed so the page can assess them a few at a time and keep
 * a phone responsive (about a second of engine work per category). */
export function candidateColours(category: ShoppingCategory): string[] {
  return namedColors.filter((c) => isWearableIn(category, c.hex)).map((c) => c.hex);
}

/** Drops duplicates and dead ends, sorts, and keeps one of each near twin. */
export function rankRecommendations(assessed: Assessment[]): Assessment[] {
  const scored = assessed
    .filter((a) => a.verdict !== "duplicate" && a.verdict !== "none")
    .sort(
      (a, b) =>
        b.newPalettes.length - a.newPalettes.length ||
        b.partners.length - a.partners.length ||
        b.palettes.length - a.palettes.length,
    );
  const picked: Assessment[] = [];
  for (const a of scored) {
    if (picked.some((p) => perceptualDistance(p.hex, a.hex) < DUPLICATE_DISTANCE)) continue;
    picked.push(a);
  }
  return picked;
}
