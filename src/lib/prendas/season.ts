import type { Season } from "./types";

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

export function getCurrentSeason(date: Date = new Date()): Season {
  return SEASON_BY_MONTH[date.getMonth()];
}
