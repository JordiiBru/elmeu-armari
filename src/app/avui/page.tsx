import { findAllOutfits, findTodayOutfitId, toSavedOutfit } from "@/lib/outfits/service";
import { findAllGarments } from "@/lib/prendas/service";
import { getCurrentSeason } from "@/lib/prendas/season";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { dayToISO } from "@/lib/outfits/week";
import { palettes } from "@/lib/colors";
import { OutfitLibrary } from "@/components/OutfitLibrary";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AvuiPage() {
  const [outfits, garments, todayOutfitId] = await Promise.all([
    findAllOutfits(),
    findAllGarments(),
    findTodayOutfitId(),
  ]);

  return (
    <PageContainer width="wide">
      <SectionHeader title={UI.bugaderia.today} level="title-xl" />
      <OutfitLibrary
        mode="today"
        outfits={outfits.map(toSavedOutfit)}
        palettes={palettes}
        extraCandidates={garments.filter((g) => EXTRA_CATEGORIES.has(g.category))}
        season={getCurrentSeason()}
        todayISO={dayToISO(new Date())}
        todayOutfitId={todayOutfitId}
      />
    </PageContainer>
  );
}
