import {
  findAllOutfits,
  findTodayOutfitId,
  toSavedOutfit,
  findLastWornByGarment,
} from "@/lib/outfits/service";
import { findAllGarments } from "@/lib/prendas/service";
import { rankOutfitsForToday, outfitAvailability, isDirty } from "@/lib/bugaderia/laundry";
import { buildRows, ROW_CATEGORIES, type RowCategory } from "@/lib/bugaderia/rows";
import { getCurrentSeason } from "@/lib/prendas/season";
import { palettes } from "@/lib/colors";
import { AvuiBuilder } from "@/components/AvuiBuilder";

export const dynamic = "force-dynamic";

export default async function AvuiPage() {
  const [outfits, todayOutfitId, garments, lastWorn] = await Promise.all([
    findAllOutfits(),
    findTodayOutfitId(),
    findAllGarments(),
    findLastWornByGarment(),
  ]);

  const season = getCurrentSeason();
  const savedOutfits = outfits.map(toSavedOutfit);
  const ranked = rankOutfitsForToday(savedOutfits, season);

  const readyOutfits = ranked.filter((o) => outfitAvailability(o).status === "ready");
  const almostOutfits = ranked
    .map((outfit) => ({ outfit, availability: outfitAvailability(outfit) }))
    .filter(({ availability }) => availability.status === "almost")
    .map(({ outfit, availability }) => ({ outfit, blockedBy: availability.blockedBy }));

  const rows = buildRows(garments, season, lastWorn);
  // Lets an empty row say whether the pieces are in the basket (offer the
  // laundry) or simply out of season (no link would help).
  const hasDirtyByRow = Object.fromEntries(
    ROW_CATEGORIES.map((category) => [
      category,
      garments.some((g) => g.category === category && isDirty(g)),
    ]),
  ) as Record<RowCategory, boolean>;
  // Computed server-side and passed as a prop so the initial client render
  // matches — flipping this from a client-only `useEffect` would hydrate
  // unchecked and then jump, or mismatch entirely.
  const defaultSweater = season === "AUTUMN" || season === "WINTER";

  return (
    <AvuiBuilder
      rows={rows}
      hasDirtyByRow={hasDirtyByRow}
      defaultSweater={defaultSweater}
      readyOutfits={readyOutfits}
      almostOutfits={almostOutfits}
      palettes={palettes}
      todayOutfitId={todayOutfitId}
      hasAnyOutfits={savedOutfits.length > 0}
    />
  );
}
