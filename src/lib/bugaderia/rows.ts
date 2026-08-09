import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { isClean } from "./laundry";

export type RowCategory = "SHIRT" | "PANTS" | "SHOES" | "SWEATER";

export const ROW_CATEGORIES: RowCategory[] = ["SHIRT", "PANTS", "SHOES", "SWEATER"];

/**
 * Per-category candidate lists for the "Què em poso?" row builder: clean,
 * in season (or ALL_YEAR), ordered least-recently-worn first (never worn
 * wins). Pure and Prisma-free, so it is unit-testable without mocking the DB.
 */
export function buildRows(
  garments: GarmentWithColors[],
  season: Season,
  lastWorn: Map<string, Date>,
): Record<RowCategory, GarmentWithColors[]> {
  const rows = {} as Record<RowCategory, GarmentWithColors[]>;
  for (const category of ROW_CATEGORIES) {
    rows[category] = garments
      .filter((g) => g.category === category)
      .filter(isClean)
      // No season recorded means "unconstrained", not "fits no season" —
      // shoes and accessories often carry none, and excluding them emptied
      // the shoes row for every season, which silently disabled the whole
      // builder (nothing to pick for a mandatory row).
      .filter(
        (g) =>
          g.seasons.length === 0 ||
          g.seasons.some((s) => s.season === season || s.season === "ALL_YEAR"),
      )
      .sort((a, b) => {
        const rankA = lastWorn.get(a.id)?.getTime() ?? -Infinity;
        const rankB = lastWorn.get(b.id)?.getTime() ?? -Infinity;
        return rankA - rankB;
      });
  }
  return rows;
}
