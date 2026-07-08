import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
import { palettes } from "@/lib/colors";
import { ArmariTabs } from "@/components/ArmariTabs";
import { PageContainer, SectionHeader, GridSkeleton } from "@/components/ui";

export default async function ArmariPage() {
  const [garments, outfits] = await Promise.all([
    findAllGarments(),
    findAllOutfits(),
  ]);

  const savedOutfits = outfits.map((o) => ({
    id: o.id,
    name: o.name,
    paletteId: o.paletteId,
    createdAt: o.createdAt,
    garments: o.garments.map((og) => ({
      id: og.id,
      garment: og.garment,
    })),
  }));

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
        />
      </Suspense>
    </PageContainer>
  );
}
