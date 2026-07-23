import { Suspense } from "react";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
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

  const savedOutfits = outfits.map((o) => ({
    id: o.id,
    name: o.name,
    paletteId: o.paletteId,
    favorite: o.favorite,
    createdAt: o.createdAt,
    garments: o.garments.map((og) => ({
      id: og.id,
      role: (og.role === "extra" ? "extra" : "primary") as "primary" | "extra",
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
