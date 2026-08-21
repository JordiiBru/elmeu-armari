import {
  createOutfit,
  findAllOutfits,
  findOutfitByGarmentsAndPalette,
  findOutfitById,
  deleteOutfit,
  countOutfits,
  setWornDay,
  clearWornDay,
  findWornEventsInRange,
  findWornEventForDay,
  findUnsettledPastWornEvents,
  markWornEventSettled,
} from "./repository";
import { findGarmentCategories, markGarmentsDirty } from "@/lib/prendas/service";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { AUTO_SOIL_CATEGORIES, EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { dirtyGarmentsOf } from "@/lib/bugaderia/laundry";
import { palettes } from "@/lib/colors";
import { dayKey, addDays, dayToISO } from "./week";
import { outfitKey } from "./key";
import type { SavedOutfit, WeekDayPlan } from "./types";
import type { GarmentWithColors } from "@/lib/prendas/types";

export { findAllOutfits, deleteOutfit };

interface WornEventWithGarments {
  id: string;
  date: Date;
  garments: { garment: GarmentWithColors }[];
}

interface OutfitWithGarments {
  id: string;
  name: string | null;
  paletteId: number;
  createdAt: Date;
  garments: { garment: GarmentWithColors }[];
  wornEvents?: WornEventWithGarments[];
}

/**
 * The join rows come back in insertion order, which is the order the
 * builder happened to pick the pieces in — so the same wardrobe read
 * differently on every card. Sorting here, at the single point every
 * surface goes through, makes a collage, a subtitle and a day cell all
 * read top-down: jersei, samarreta, pantalons, and then what you wore
 * them with.
 */
export function toSavedOutfit(outfit: OutfitWithGarments): SavedOutfit {
  return {
    id: outfit.id,
    name: outfit.name,
    paletteId: outfit.paletteId,
    createdAt: outfit.createdAt,
    garments: sortByWardrobeOrder(outfit.garments.map((og) => og.garment)),
    wornEvents: (outfit.wornEvents ?? []).map((w) => ({
      id: w.id,
      date: w.date,
      extras: sortByWardrobeOrder(w.garments.map((wg) => wg.garment)),
    })),
  };
}

/** Every combination already in the wardrobe, for the combiner to grey
 * out and sink to the bottom of its list. */
export async function findSavedOutfitKeys(): Promise<string[]> {
  const outfits = await findAllOutfits();
  return outfits.map((o) =>
    outfitKey(o.garments.map((og) => og.garment.id), o.paletteId),
  );
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

/**
 * Today's committed day: the outfit, and the shoes and accessories it is
 * being worn with.
 *
 * Read straight from today rather than off the week plan. The plate used
 * to pick its extras out of the seven days the planner had loaded, which
 * works right up until you page back a week — then the plan no longer
 * contains today and the plate silently lost everything it was worn with.
 */
export async function findTodayWorn(): Promise<{
  outfitId: string;
  extras: GarmentWithColors[];
} | null> {
  const event = await findWornEventForDay(dayKey(new Date()));
  if (!event) return null;
  return {
    outfitId: event.outfitId,
    extras: sortByWardrobeOrder(event.garments.map((wg) => wg.garment)),
  };
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
      extras: event ? sortByWardrobeOrder(event.garments.map((wg) => wg.garment)) : [],
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
