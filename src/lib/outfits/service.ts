import {
  createOutfit,
  findAllOutfits,
  findOutfitByGarmentsAndPalette,
  findOutfitById,
  deleteOutfit,
  countOutfits,
  setOutfitFavorite,
  setWornDay,
  clearWornDay,
  findWornEventsInRange,
  findWornEventForDay,
  findUnsettledPastWornEvents,
  markWornEventSettled,
} from "./repository";
import { findGarmentCategories, markGarmentsDirty } from "@/lib/prendas/service";
import { AUTO_SOIL_CATEGORIES, EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { dirtyGarmentsOf } from "@/lib/bugaderia/laundry";
import { palettes } from "@/lib/colors";
import { dayKey, addDays, dayToISO } from "./week";
import type { SavedOutfit, WeekDayPlan } from "./types";
import type { GarmentWithColors } from "@/lib/prendas/types";

export {
  findAllOutfits,
  deleteOutfit,
  setOutfitFavorite,
};

interface WornEventWithGarments {
  id: string;
  date: Date;
  garments: { garment: GarmentWithColors }[];
}

interface OutfitWithGarments {
  id: string;
  name: string | null;
  paletteId: number;
  favorite: boolean;
  createdAt: Date;
  garments: { garment: GarmentWithColors }[];
  wornEvents?: WornEventWithGarments[];
}

export function toSavedOutfit(outfit: OutfitWithGarments): SavedOutfit {
  return {
    id: outfit.id,
    name: outfit.name,
    paletteId: outfit.paletteId,
    favorite: outfit.favorite,
    createdAt: outfit.createdAt,
    garments: outfit.garments.map((og) => og.garment),
    wornEvents: (outfit.wornEvents ?? []).map((w) => ({
      id: w.id,
      date: w.date,
      extras: w.garments.map((wg) => wg.garment),
    })),
  };
}

function outfitTop(outfit: SavedOutfit): GarmentWithColors | null {
  return (
    outfit.garments.find((g) => g.category === "SHIRT") ??
    outfit.garments.find((g) => g.category === "SWEATER") ??
    null
  );
}

// Groups saved outfits by the exact top (shirt/sweater) they're built
// around, so every outfit wearing the same piece sits together — closer
// to browsing a wardrobe rail than a chronological feed. Groups are
// ordered by the top's label; outfits within a group keep their incoming
// order (favourite first, then most recent — see `findAllOutfits`).
// `Array.prototype.sort` is stable, so returning 0 for a shared top
// preserves that incoming order.
export function sortOutfitsByTop(outfits: SavedOutfit[]): SavedOutfit[] {
  return [...outfits].sort((a, b) => {
    const topA = outfitTop(a);
    const topB = outfitTop(b);
    if (!topA && !topB) return 0;
    if (!topA) return 1;
    if (!topB) return -1;
    if (topA.id === topB.id) return 0;
    const labelA = topA.subtype ?? topA.category;
    const labelB = topB.subtype ?? topB.category;
    return labelA !== labelB ? labelA.localeCompare(labelB) : topA.id.localeCompare(topB.id);
  });
}

export async function findSavedOutfitById(id: string): Promise<SavedOutfit | null> {
  const outfit = await findOutfitById(id);
  return outfit ? toSavedOutfit(outfit) : null;
}

/**
 * A day is an outfit plus what you wore it with. The clean gate only
 * applies to today or a past day: a shirt in the basket on Monday can
 * perfectly well be clean by Thursday, so planning ahead is allowed.
 *
 * The extras are filtered here and not only in the picker, same spirit as
 * the washable filter in `markGarmentsDirty` — ids reach this from the
 * client, so the rules have to hold whatever the caller sends.
 */
export async function wearOutfit(
  outfitId: string,
  date: Date,
  extraIds: string[],
): Promise<void> {
  const outfit = await findSavedOutfitById(outfitId);
  if (!outfit) throw new Error(`Outfit not found: ${outfitId}`);

  const day = dayKey(date);
  if (day.getTime() <= dayKey(new Date()).getTime()) {
    const dirty = dirtyGarmentsOf(outfit);
    if (dirty.length > 0) {
      throw new Error(
        `Outfit ${outfitId} has dirty garments: ${dirty.map((g) => g.id).join(", ")}`,
      );
    }
  }

  const categories = new Map(
    (await findGarmentCategories(extraIds)).map((g) => [g.id, g.category]),
  );
  // Shoes are a single slot: you wear one pair a day. Everything else
  // accumulates. Walking `extraIds` rather than the query result keeps the
  // caller's order, which is what decides the surviving pair.
  let shoesTaken = false;
  const garmentIds: string[] = [];
  const seen = new Set<string>();
  for (const id of extraIds) {
    const category = categories.get(id);
    if (!category || !EXTRA_CATEGORIES.has(category) || seen.has(id)) continue;
    if (category === "SHOES") {
      if (shoesTaken) continue;
      shoesTaken = true;
    }
    seen.add(id);
    garmentIds.push(id);
  }

  await setWornDay(outfitId, day, garmentIds);
}

export async function unassignDay(date: Date) {
  return clearWornDay(dayKey(date));
}

/**
 * Wearing an outfit only assigns the day — dirtying is deferred to
 * whenever the app next notices that day has fully passed. Reconsidering
 * same-day (pick outfit A, change your mind, pick outfit B before you've
 * actually left the house) never soils A's pieces, since a day is only
 * ever settled once, strictly after it ends.
 */
export async function settlePastWornEvents(): Promise<number> {
  const events = await findUnsettledPastWornEvents(dayKey(new Date()));
  for (const event of events) {
    // Only what one wear actually soils. Trousers are washable but are
    // not dirtied by having been worn — that stays a manual decision.
    const washableIds = event.outfit.garments
      .map((og) => og.garment)
      .filter((g) => AUTO_SOIL_CATEGORIES.has(g.category))
      .map((g) => g.id);
    if (washableIds.length > 0) {
      await markGarmentsDirty(washableIds);
    }
    await markWornEventSettled(event.id);
  }
  return events.length;
}

/** The outfit assigned to today, if any — used to hide the "menys portat"
 * suggestion once today is already decided, and to let a saved outfit's
 * own sheet offer a one-click "portar-lo avui". */
export async function findTodayOutfitId(): Promise<string | null> {
  const event = await findWornEventForDay(dayKey(new Date()));
  return event?.outfitId ?? null;
}

/** Always returns exactly 7 entries, Monday first, one per day of the
 * week that `weekStart` falls in — empty days included as `outfit: null`. */
export async function findWeekPlan(weekStart: Date): Promise<WeekDayPlan[]> {
  const start = dayKey(weekStart);
  const end = addDays(start, 6);
  const events = await findWornEventsInRange(start, end);
  const byDay = new Map(events.map((e) => [dayToISO(e.date), e]));

  return Array.from({ length: 7 }, (_, i) => {
    const date = dayToISO(addDays(start, i));
    const event = byDay.get(date);
    return {
      date,
      outfit: event ? toSavedOutfit(event.outfit) : null,
      extras: event ? event.garments.map((wg) => wg.garment) : [],
    };
  });
}

// Outfit.paletteId is an unchecked FK into sanzo-wada.json (no Palette
// table), so writes must validate it here or orphan palettes slip in.
const VALID_PALETTE_IDS = new Set(palettes.map((p) => p.id));

export async function saveOutfit(data: {
  paletteId: number;
  garmentIds: string[];
}) {
  if (!VALID_PALETTE_IDS.has(data.paletteId)) {
    throw new Error(`Unknown paletteId: ${data.paletteId}`);
  }

  const existing = await findOutfitByGarmentsAndPalette(data.garmentIds, data.paletteId);
  if (existing) return existing;

  const count = await countOutfits();
  const name = `Outfit #${count + 1}`;
  return createOutfit({ ...data, name });
}
