import { notFound } from "next/navigation";
import { findGarmentByIdSuffix, findAllGarments } from "@/lib/prendas/service";
import { findSavedOutfitKeys } from "@/lib/outfits/service";
import { idSuffixFromSlug } from "@/lib/prendas/slug";
import { palettes } from "@/lib/colors";
import { GarmentModalRoute } from "@/components/GarmentModalRoute";

export const dynamic = "force-dynamic";

/**
 * Intercepts client-side navigation from `/armari` to `/armari/[slug]`
 * (the `(.)` marker matches the segment at the same level as `@modal`)
 * and renders the garment as an overlay instead of swapping the page.
 */
export default async function InterceptedGarmentModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [garment, allGarments, savedOutfitKeys] = await Promise.all([
    findGarmentByIdSuffix(idSuffixFromSlug(slug)),
    findAllGarments(),
    findSavedOutfitKeys(),
  ]);
  if (!garment) notFound();

  return (
    <GarmentModalRoute
      garment={garment}
      allGarments={allGarments}
      palettes={palettes}
      savedOutfitKeys={savedOutfitKeys}
    />
  );
}
