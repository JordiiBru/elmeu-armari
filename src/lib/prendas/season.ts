import type { Season } from "./types";
import { today } from "@/lib/outfits/week";

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
