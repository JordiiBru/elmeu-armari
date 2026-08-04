import { findAllOutfits, findTodayOutfitId, toSavedOutfit } from "@/lib/outfits/service";
import { rankOutfitsForToday, outfitAvailability } from "@/lib/bugaderia/laundry";
import { getCurrentSeason } from "@/lib/prendas/season";
import { palettes } from "@/lib/colors";
import { AvuiView } from "@/components/AvuiView";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AvuiPage() {
  const [outfits, todayOutfitId] = await Promise.all([findAllOutfits(), findTodayOutfitId()]);

  const savedOutfits = outfits.map(toSavedOutfit);
  const ranked = rankOutfitsForToday(savedOutfits, getCurrentSeason());

  const readyOutfits = ranked.filter((o) => outfitAvailability(o).status === "ready");
  const almostOutfits = ranked
    .map((outfit) => ({ outfit, availability: outfitAvailability(outfit) }))
    .filter(({ availability }) => availability.status === "almost")
    .map(({ outfit, availability }) => ({ outfit, blockedBy: availability.blockedBy }));

  return (
    <PageContainer width="narrow">
      <SectionHeader title={UI.bugaderia.today} level="title-xl" />
      <AvuiView
        readyOutfits={readyOutfits}
        almostOutfits={almostOutfits}
        palettes={palettes}
        todayOutfitId={todayOutfitId}
        hasAnyOutfits={savedOutfits.length > 0}
      />
    </PageContainer>
  );
}
