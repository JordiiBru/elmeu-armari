import type { Season } from "./types";
import type { SweaterMode } from "@/generated/prisma/enums";
import { today } from "@/lib/outfits/week";

export type { SweaterMode };

// Northern hemisphere, meteorological seasons (fixed month boundaries
// rather than equinox/solstice dates — good enough for a wardrobe default).
const SEASON_BY_MONTH: Season[] = [
  "WINTER", // Jan
  "WINTER", // Feb
  "SPRING", // Mar
  "SPRING", // Apr
  "SPRING", // May
  "SUMMER", // Jun
  "SUMMER", // Jul
  "SUMMER", // Aug
  "AUTUMN", // Sep
  "AUTUMN", // Oct
  "AUTUMN", // Nov
  "WINTER", // Dec
];

// `today()` hands back the Barcelona civil day as a UTC-midnight key, so
// the month is read in UTC on purpose — reading it locally would put the
// server's zone back in charge of when a season turns over.
export function getCurrentSeason(day: Date = today()): Season {
  return SEASON_BY_MONTH[day.getUTCMonth()];
}

// Sweaters read as in-season through autumn, winter and spring — summer
// is the one stretch of the year a jumper is out of place. Wider than
// `getCurrentSeason`'s four-way split on purpose: this is a single
// in/out-of-season boolean for one category, not a per-garment season tag.
const SWEATER_SEASONS = new Set<Season>(["AUTUMN", "WINTER", "SPRING"]);

/**
 * Whether a sweater-anchored outfit should rank normally right now.
 * `AUTO` follows the calendar; `ON`/`OFF` is the user's manual override
 * from /armari and ignores the date entirely.
 */
export function resolveSweaterInSeason(mode: SweaterMode, day: Date = today()): boolean {
  if (mode === "ON") return true;
  if (mode === "OFF") return false;
  return SWEATER_SEASONS.has(getCurrentSeason(day));
}
