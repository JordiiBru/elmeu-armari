import type { SanzoPalette, SavedOutfit } from "./types";

type WornEvent = SavedOutfit["wornEvents"][number];

/** Resolves an outfit's palette through its (possibly null) paletteId —
 * route every lookup through here instead of `paletteMap.get(outfit.paletteId)`
 * directly, since that no longer typechecks once paletteId is nullable.
 * Pure (no Prisma), so client components can import it directly. */
export function paletteOf(
  outfit: SavedOutfit,
  paletteMap: Map<number, SanzoPalette>,
): SanzoPalette | null {
  return outfit.paletteId === null ? null : paletteMap.get(outfit.paletteId) ?? null;
}

/**
 * Whether the outfit was assembled on the spot in the builder rather than
 * deliberately saved. Reads an explicit column: `name === null` looked
 * free as a marker (no code path creates a nameless outfit) but existing
 * databases already held nameless *saved* outfits, and treating those as
 * improvised hid every one of them from /armari.
 */
export function isImprovised(outfit: SavedOutfit): boolean {
  return outfit.improvised;
}

/**
 * Never-worn outfits rank before any dated one; among dated ones the
 * oldest last-worn date wins. Used both to pick the "menys portat"
 * suggestion and to order the "què em poso?" carousel.
 */
export function wornRank(events: WornEvent[]): number {
  return events.length === 0 ? -Infinity : events[0].date.getTime();
}

/** Single source of the "fa X dies" / "mai portat" phrasing. */
export function formatLastWorn(events: WornEvent[]): string {
  if (events.length === 0) return "mai portat";
  const days = Math.floor((Date.now() - events[0].date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "portat avui";
  if (days === 1) return "portat fa 1 dia";
  return `portat fa ${days} dies`;
}
