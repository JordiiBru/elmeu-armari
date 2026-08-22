import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SavedOutfit, WornDay } from "./types";

/**
 * Never-worn outfits rank before any dated one; among dated ones the
 * oldest last-worn date wins. Used both to pick the "menys portat"
 * suggestion and to order the "què em poso?" grid.
 */
export function wornRank(events: WornDay[]): number {
  return events.length === 0 ? -Infinity : events[0].date.getTime();
}

/**
 * What this outfit was last worn with, used to preselect the picker.
 * This is what replaces the deleted outfit variants: the outfit
 * remembers its usual shoes without a second outfit row existing.
 */
export function lastWornExtras(outfit: SavedOutfit): GarmentWithColors[] {
  return outfit.wornEvents[0]?.extras ?? [];
}
