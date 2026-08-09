import {
  createOutfit,
  findAllOutfits,
  findOutfitByGarmentsAndPalette,
  findOutfitByExactGarments,
  createImprovisedOutfit,
  findLastWornByGarment,
  findOutfitById,
  deleteOutfit,
  countOutfits,
  createOutfitExtras,
  removeOutfitExtra,
  removeOutfitExtrasByCategory,
  setOutfitFavorite,
  setWornDay,
  clearWornDay,
  findWornEventsInRange,
  findWornEventForDay,
  findUnsettledPastWornEvents,
  markWornEventSettled,
} from "./repository";
import { findGarmentById, markGarmentsDirty } from "@/lib/prendas/service";
import { WASHABLE_CATEGORIES } from "@/lib/prendas/types";
import { palettes } from "@/lib/colors";
import { dayKey, addDays, dayToISO } from "./week";
import { resolvePaletteForOutfit } from "./engine";
import { paletteOf, isImprovised } from "./worn";
import type { SavedOutfit, WeekDayPlan, OutfitGarmentRole } from "./types";
import type { GarmentWithColors } from "@/lib/prendas/types";

// Re-exported from the pure `worn.ts` module so server call sites can keep
// pulling everything from `service.ts`; client components should import
// them from `worn.ts` directly to avoid dragging Prisma into the bundle.
export { findLastWornByGarment, paletteOf, isImprovised };

export {
  findAllOutfits,
  deleteOutfit,
  removeOutfitExtra,
  setOutfitFavorite,
};

// Shoes are a unique slot on an outfit: adding a new pair replaces
// whatever was there rather than stacking. Accessories (and everything
// else added as "extra") have no such cap — an outfit can carry any
// number of them.
export async function addOutfitExtras(outfitId: string, garmentIds: string[]) {
  if (garmentIds.length === 0) return;

  const incoming = await Promise.all(garmentIds.map((id) => findGarmentById(id)));
  const shoeIds = new Set(
    incoming.filter((g) => g?.category === "SHOES").map((g) => g!.id),
  );

  if (shoeIds.size > 0) {
    await removeOutfitExtrasByCategory(outfitId, "SHOES");
  }

  // If more than one pair was picked in the same batch, only the first
  // survives — the slot stays singular.
  let keptOneShoe = false;
  const toInsert = garmentIds.filter((id) => {
    if (!shoeIds.has(id)) return true;
    if (keptOneShoe) return false;
    keptOneShoe = true;
    return true;
  });

  await createOutfitExtras(outfitId, toInsert);
}

interface OutfitWithGarments {
  id: string;
  name: string | null;
  paletteId: number | null;
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

function outfitTop(outfit: SavedOutfit): GarmentWithColors | null {
  const primaries = outfit.garments.filter((g) => g.role === "primary").map((g) => g.garment);
  return (
    primaries.find((g) => g.category === "SHIRT") ??
    primaries.find((g) => g.category === "SWEATER") ??
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

export async function assignOutfitToDay(outfitId: string, date: Date) {
  return setWornDay(outfitId, dayKey(date));
}

export async function unassignDay(date: Date) {
  return clearWornDay(dayKey(date));
}

/**
 * Wears a combination assembled on the spot in the builder. Reuses the
 * exact-set match if it already exists (e.g. re-wearing the same rows
 * without changing a category), otherwise materialises a fresh
 * improvised `Outfit` row so `WornEvent`, `settlePastWornEvents`,
 * `/calendari` and stats keep working untouched. Never touches
 * `settlePastWornEvents` itself — the garments hang off the `Outfit`
 * like any other, so deferred soiling stays idempotent.
 */
export async function wearImprovisedOutfit(garmentIds: string[]): Promise<string> {
  const found = await Promise.all(garmentIds.map((id) => findGarmentById(id)));
  const garments = found.filter((g): g is NonNullable<typeof g> => g !== null);
  const paletteId = resolvePaletteForOutfit(garments, palettes);

  const existing = await findOutfitByExactGarments(garmentIds);
  const outfit = existing ?? (await createImprovisedOutfit({ garmentIds, paletteId }));

  await assignOutfitToDay(outfit.id, new Date());
  return outfit.id;
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
    const washableIds = event.outfit.garments
      .map((og) => og.garment)
      .filter((g) => WASHABLE_CATEGORIES.has(g.category))
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
  // Duplicating always produces a new saved (named) variant, which needs a
  // concrete palette — an improvised outfit whose garments share none has
  // nothing to carry over.
  if (source.paletteId === null) {
    throw new Error(`Cannot duplicate an improvised outfit with no shared palette: ${outfitId}`);
  }

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
