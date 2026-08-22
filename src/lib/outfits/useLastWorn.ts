"use client";

import { useTranslations } from "next-intl";
import type { WornDay } from "./types";
import { daysBetween, today } from "./week";

/**
 * Single source of the "fa X dies" / "mai portat" phrasing.
 *
 * Its own module rather than a function in `worn.ts`: that file is
 * imported from the server ranking, and a `"use client"` boundary there
 * would turn `wornRank` into a client reference nobody can call.
 *
 * Counted in whole calendar days in the wardrobe's zone, not in elapsed
 * milliseconds: an outfit worn yesterday evening reads "fa 1 dia" all of
 * today instead of turning over at some arbitrary hour.
 */
export function useFormatLastWorn(): (events: WornDay[]) => string {
  const t = useTranslations("outfits.lastWorn");

  return (events) => {
    if (events.length === 0) return t("never");
    const days = daysBetween(events[0].date, today());
    if (days <= 0) return t("today");
    return t("ago", { days });
  };
}
