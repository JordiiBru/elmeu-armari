import type { SavedOutfit } from "./types";

type WornEvent = SavedOutfit["wornEvents"][number];

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
