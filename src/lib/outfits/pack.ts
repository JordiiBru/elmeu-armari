// Trip planning ("fer la maleta"): which outfit each day of a trip, from a
// pool of pieces the person is willing to pack. Pure, no Prisma, no clock:
// the caller hands in the days, so it runs the same in a test and in the
// browser. Nothing here is saved, and the clean/dirty state of the wardrobe
// is ignored on purpose: the trip is in the future, everything will have
// been washed by then.

import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import type { OutfitGroup, SanzoPalette } from "./types";
import { generateOutfitGroups, isGreyColour } from "./engine";
import { suggestAccessories } from "./accessories";
import { perceptualDistance } from "./color-matching";
import { addDays, daysBetween, dayToISO } from "./week";

export type TripWeather = "hot" | "cold" | "mixed";

/** "minimize": as few pieces in the suitcase as the wear limits allow.
 * "noRepeat": a different look every day, fresh pieces first. */
export type PackMode = "minimize" | "noRepeat";

/** Longest trip the planner accepts: a month already means ~30 runs of the
 * engine, and nobody packs a suitcase for longer. */
export const MAX_TRIP_DAYS = 31;

/** With laundry on, a wash happens at the end of every second day of the
 * trip (after day 2, 4, ...), never after the last one. */
export const LAUNDRY_EVERY_DAYS = 2;

/** How many days a piece can be worn between two washes. Tops are worn
 * once; trousers three times. Without laundry the whole trip is one cycle,
 * so the same limits hold for the trip. */
export const MAX_WEARS_BETWEEN_WASHES: Partial<Record<Category, number>> = {
  SHIRT: 1,
  SWEATER: 1,
  PANTS: 3,
};

const CLOTHES = new Set<Category>(["SHIRT", "SWEATER", "PANTS"]);
const TOPS = new Set<Category>(["SHIRT", "SWEATER"]);

/** The engine never returns more than this many groups per call. */
const ENGINE_LIMIT = 60;

/** Weight of one extra (or repeated) piece against one place in the
 * engine's ranking: a piece always matters more than the colour order. */
const PIECE_WEIGHT = 1000;

export interface TripInput {
  /** First and last day of the trip, UTC-midnight day keys, inclusive. */
  start: Date;
  end: Date;
  weather: TripWeather;
  mode: PackMode;
  laundry: boolean;
  /** Shirts, sweaters, trousers and coats the plan may use. Other
   * categories are ignored. */
  pool: GarmentWithColors[];
  /** Shoes packed: one pair per day, repeated freely. */
  shoes: GarmentWithColors[];
  /** Accessories packed: suggested on the days they match. */
  accessories: GarmentWithColors[];
  palettes: SanzoPalette[];
}

/** Why a day has no outfit, most basic cause first. */
export type MissingPiece = "shoes" | "top" | "pants" | "colour";

export interface TripDay {
  /** YYYY-MM-DD */
  date: string;
  /** Shirt and/or sweater, trousers and shoes, in the engine's order;
   * null when no combination was possible. */
  outfit: GarmentWithColors[] | null;
  palette: SanzoPalette | null;
  /** Needed (cold, or a sweater day in mixed weather) and found. */
  coat: GarmentWithColors | null;
  /** True when the day called for a coat and the pool has none. */
  coatMissing: boolean;
  accessories: GarmentWithColors[];
  missing: MissingPiece | null;
}

export interface LaundrySession {
  /** The day the wash happens, at its end. YYYY-MM-DD */
  after: string;
  garments: GarmentWithColors[];
}

export interface TripPlan {
  days: TripDay[];
  laundry: LaundrySession[];
  /** Every piece that has to go in the suitcase, once. */
  packed: GarmentWithColors[];
  nights: number;
  /** Fewer pairs of shoes than days: some pair is worn twice. */
  shoesRepeat: boolean;
}

export type TripError = "range" | "tooLong";

/** Every day of the trip, or why the range cannot be planned. */
export function tripDays(start: Date, end: Date): Date[] | TripError {
  const span = daysBetween(start, end) + 1;
  if (span < 1) return "range";
  if (span > MAX_TRIP_DAYS) return "tooLong";
  return Array.from({ length: span }, (_, i) => addDays(start, i));
}

interface Candidate {
  clothes: GarmentWithColors[];
  shoes: GarmentWithColors;
  palette: SanzoPalette;
  /** Position in the engine's ranking: lower is a better look. */
  rank: number;
  key: string;
}

function clothesKey(garments: GarmentWithColors[]): string {
  return garments
    .map((g) => g.id)
    .sort()
    .join(",");
}

/**
 * The engine's groups, one per set of clothes. Shoes are part of a group,
 * but here they are a per-day choice among the pairs packed, so each set of
 * clothes keeps the pair with the closest colour match.
 */
function candidatesFrom(groups: OutfitGroup[]): Candidate[] {
  const byKey = new Map<string, Candidate & { distance: number }>();
  groups.forEach((group, rank) => {
    const shoes = group.garments.find((g) => g.category === "SHOES");
    const clothes = group.garments.filter((g) => CLOTHES.has(g.category));
    if (!shoes || clothes.length === 0) return;
    const key = clothesKey(clothes);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        clothes,
        shoes,
        palette: group.palettes[0].palette,
        rank,
        key,
        distance: group.bestDistance,
      });
    } else if (group.bestDistance < existing.distance) {
      existing.shoes = shoes;
      existing.palette = group.palettes[0].palette;
      existing.distance = group.bestDistance;
    }
  });
  return [...byKey.values()];
}

/** How far a coat sits from the day's palette: its worst coloured colour
 * against the nearest palette colour. Black, white and greys cost nothing,
 * they go with everything. */
function coatDistance(coat: GarmentWithColors, palette: SanzoPalette | null): number {
  if (!palette) return 0;
  let worst = 0;
  for (const { hex } of coat.colors) {
    if (isGreyColour(hex)) continue;
    const nearest = Math.min(...palette.colores.map((p) => perceptualDistance(hex, p)));
    worst = Math.max(worst, nearest);
  }
  return worst;
}

function pickCoat(
  coats: GarmentWithColors[],
  palette: SanzoPalette | null,
  mode: PackMode,
  used: Set<string>,
): GarmentWithColors | null {
  let best: GarmentWithColors | null = null;
  let bestCost = Infinity;
  for (const coat of coats) {
    // minimize: the coat already packed wins; noRepeat: a new one wins.
    const reuse = used.has(coat.id);
    const penalty = (mode === "minimize" ? !reuse : reuse) ? PIECE_WEIGHT : 0;
    const cost = penalty + coatDistance(coat, palette);
    if (cost < bestCost) {
      bestCost = cost;
      best = coat;
    }
  }
  return best;
}

/** No forecast, so in mixed weather a cold day is one whose outfit carries
 * a sweater: the engine already ranks sweaters for the weather. */
function needsCoat(weather: TripWeather, outfit: GarmentWithColors[] | null): boolean {
  if (weather === "cold") return true;
  if (weather === "hot") return false;
  return outfit?.some((g) => g.category === "SWEATER") ?? false;
}

export function planTrip(input: TripInput): TripPlan | TripError {
  const dates = tripDays(input.start, input.end);
  if (typeof dates === "string") return dates;

  const clothes = input.pool.filter((g) => CLOTHES.has(g.category));
  const coats = input.pool.filter((g) => g.category === "OUTERWEAR");
  const shoes = input.shoes.filter((g) => g.category === "SHOES");
  const accessories = input.accessories.filter((g) => g.category === "ACCESSORI");
  const sweaterInSeason = input.weather !== "hot";
  const shortsInSeason = input.weather !== "cold";

  const wears = new Map<string, number>();
  const used = new Set<string>();
  const usedKeys = new Set<string>();
  const usedCoats = new Set<string>();
  const usedShoes = new Set<string>();
  const sinceWash = new Map<string, GarmentWithColors>();
  const cache = new Map<string, Candidate[]>();

  const available = (g: GarmentWithColors) =>
    (wears.get(g.id) ?? 0) < (MAX_WEARS_BETWEEN_WASHES[g.category] ?? Infinity);

  // The engine caps its answer, so it runs on what is still wearable today
  // rather than once for the whole trip: a combination outside the first
  // run's cap is not lost when the pieces in it are all that is left.
  const candidatesFor = (pieces: GarmentWithColors[]): Candidate[] => {
    const key = clothesKey(pieces);
    let found = cache.get(key);
    if (!found) {
      const { groups } = generateOutfitGroups(
        [...pieces, ...shoes],
        input.palettes,
        ENGINE_LIMIT,
        0,
        sweaterInSeason,
        shortsInSeason,
      );
      found = candidatesFrom(groups);
      cache.set(key, found);
    }
    return found;
  };

  const cost = (c: Candidate): number => {
    const fresh = c.clothes.filter((g) => !used.has(g.id)).length;
    const pieces = input.mode === "minimize" ? fresh : c.clothes.length - fresh;
    return pieces * PIECE_WEIGHT + c.rank;
  };

  const days: TripDay[] = [];
  const laundry: LaundrySession[] = [];

  dates.forEach((date, i) => {
    const wearable = clothes.filter(available);
    let options = shoes.length > 0 ? candidatesFor(wearable) : [];
    if (input.mode === "noRepeat") {
      const unseen = options.filter((c) => !usedKeys.has(c.key));
      if (unseen.length > 0) options = unseen;
    }
    const chosen = options.reduce<Candidate | null>(
      (best, c) => (best === null || cost(c) < cost(best) ? c : best),
      null,
    );

    let missing: MissingPiece | null = null;
    if (!chosen) {
      if (shoes.length === 0) missing = "shoes";
      else if (!wearable.some((g) => TOPS.has(g.category))) missing = "top";
      else if (!wearable.some((g) => g.category === "PANTS")) missing = "pants";
      else missing = "colour";
    }

    const outfit = chosen ? [...chosen.clothes, chosen.shoes] : null;
    const palette = chosen?.palette ?? null;
    const wantsCoat = chosen !== null && needsCoat(input.weather, outfit);
    const coat = wantsCoat ? pickCoat(coats, palette, input.mode, usedCoats) : null;

    if (chosen) {
      usedKeys.add(chosen.key);
      usedShoes.add(chosen.shoes.id);
      for (const g of chosen.clothes) {
        used.add(g.id);
        wears.set(g.id, (wears.get(g.id) ?? 0) + 1);
        sinceWash.set(g.id, g);
      }
    }
    if (coat) usedCoats.add(coat.id);

    days.push({
      date: dayToISO(date),
      outfit,
      palette,
      coat,
      coatMissing: wantsCoat && coat === null,
      accessories: outfit
        ? suggestAccessories(outfit, palette, accessories).map((s) => s.garment)
        : [],
      missing,
    });

    const dayNumber = i + 1;
    const isLast = dayNumber === dates.length;
    if (input.laundry && dayNumber % LAUNDRY_EVERY_DAYS === 0 && !isLast && sinceWash.size > 0) {
      laundry.push({ after: dayToISO(date), garments: [...sinceWash.values()] });
      sinceWash.clear();
      wears.clear();
    }
  });

  const packed = [
    ...input.pool.filter((g) => used.has(g.id) || usedCoats.has(g.id)),
    ...shoes.filter((g) => usedShoes.has(g.id)),
    ...accessories.filter((g) => days.some((d) => d.accessories.includes(g))),
  ];

  return {
    days,
    laundry,
    packed,
    nights: dates.length - 1,
    shoesRepeat: shoes.length > 0 && shoes.length < dates.length,
  };
}
