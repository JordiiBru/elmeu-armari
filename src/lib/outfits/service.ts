import {
  createOutfit,
  findAllOutfits,
  findOutfitByGarmentsAndPalette,
  findOutfitById,
  deleteOutfit,
  countOutfits,
  addOutfitExtras,
  removeOutfitExtra,
  setOutfitFavorite,
  setWornDay,
  clearWornDay,
  findWornEventsInRange,
} from "./repository";
import { palettes } from "@/lib/colors";
import { dayKey, addDays, dayToISO } from "./week";
import type { SavedOutfit, WeekDayPlan, OutfitGarmentRole } from "./types";
import type { GarmentWithColors } from "@/lib/prendas/types";

export {
  findAllOutfits,
  deleteOutfit,
  addOutfitExtras,
  removeOutfitExtra,
  setOutfitFavorite,
};

interface OutfitWithGarments {
  id: string;
  name: string | null;
  paletteId: number;
  favorite: boolean;
  createdAt: Date;
  garments: { id: string; role: string; garment: GarmentWithColors }[];
  wornEvents?: { id: string; date: Date }[];
}

export function toSavedOutfit(outfit: OutfitWithGarments): SavedOutfit {
  return {
    id: outfit.id,
    name: outfit.name,
    paletteId: outfit.paletteId,
    favorite: outfit.favorite,
    createdAt: outfit.createdAt,
    wornEvents: (outfit.wornEvents ?? []).map((w) => ({ id: w.id, date: w.date })),
    garments: outfit.garments.map((og) => ({
      id: og.id,
      role: (og.role === "extra" ? "extra" : "primary") as OutfitGarmentRole,
      garment: og.garment,
    })),
  };
}

export async function assignOutfitToDay(outfitId: string, date: Date) {
  return setWornDay(outfitId, dayKey(date));
}

export async function unassignDay(date: Date) {
  return clearWornDay(dayKey(date));
}

/** Always returns exactly 7 entries, Monday first, one per day of the
 * week that `weekStart` falls in — empty days included as `outfit: null`. */
export async function findWeekPlan(weekStart: Date): Promise<WeekDayPlan[]> {
  const start = dayKey(weekStart);
  const end = addDays(start, 6);
  const events = await findWornEventsInRange(start, end);
  const byDay = new Map(events.map((e) => [dayToISO(e.date), e.outfit]));

  return Array.from({ length: 7 }, (_, i) => {
    const date = dayToISO(addDays(start, i));
    const outfit = byDay.get(date);
    return { date, outfit: outfit ? toSavedOutfit(outfit) : null };
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

// Same palette + primary garments as `saveOutfit` normally dedups into one
// row (extras don't distinguish an outfit) — this deliberately bypasses
// that dedup to let a saved outfit exist as several variants (e.g. same
// core with different shoes), each independently plannable in /calendari.
export async function duplicateOutfit(outfitId: string) {
  const source = await findOutfitById(outfitId);
  if (!source) throw new Error(`Outfit not found: ${outfitId}`);

  const garmentIds = source.garments
    .filter((g) => g.role === "primary")
    .map((g) => g.garmentId);
  const count = await countOutfits();
  return createOutfit({
    paletteId: source.paletteId,
    garmentIds,
    name: `Outfit #${count + 1}`,
  });
}
