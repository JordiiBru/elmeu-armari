import { Suspense } from "react";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits, toSavedOutfit } from "@/lib/outfits/service";
import { getCurrentSeason } from "@/lib/prendas/season";
import { palettes } from "@/lib/colors";
import { ArmariTabs } from "@/components/ArmariTabs";
import { PageContainer, SectionHeader, GridSkeleton } from "@/components/ui";

/**
 * Shared body of `/armari`. Rendered both by the plain list route and by
 * `/armari/[id]` (the non-intercepted fallback for direct/deep links to a
 * garment) so a hard refresh on a garment URL shows the same list-behind-
 * modal layout as a client-side navigation into the intercepted route.
 */
export async function ArmariPageBody() {
  const [garments, outfits] = await Promise.all([
    findAllGarments(),
    findAllOutfits(),
  ]);

  const savedOutfits = outfits.map(toSavedOutfit);

  return (
    <PageContainer width="wide">
      <SectionHeader
        title="el meu armari"
        subtitle={
          garments.length === 0
            ? "encara no hi ha res desat."
            : `${garments.length} peces registrades.`
        }
      />

      <Suspense fallback={<GridSkeleton />}>
        <ArmariTabs
          garments={garments}
          palettes={palettes}
          savedOutfits={savedOutfits}
          defaultSeason={getCurrentSeason()}
        />
      </Suspense>
    </PageContainer>
  );
}
