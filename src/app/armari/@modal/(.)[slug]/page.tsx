import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { findGarmentByIdSuffix, findAllGarments } from "@/lib/prendas/service";
import { findSavedOutfitKeys } from "@/lib/outfits/service";
import { getSweaterMode } from "@/lib/auth/service";
import { resolveSweaterInSeason } from "@/lib/prendas/season";
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
  const session = await auth();
  const [garment, allGarments, savedOutfitKeys, sweaterMode] = await Promise.all([
    findGarmentByIdSuffix(idSuffixFromSlug(slug)),
    findAllGarments(),
    findSavedOutfitKeys(),
    session?.user?.id ? getSweaterMode(session.user.id) : Promise.resolve("AUTO" as const),
  ]);
  if (!garment) notFound();

  return (
    <GarmentModalRoute
      garment={garment}
      allGarments={allGarments}
      palettes={palettes}
      savedOutfitKeys={savedOutfitKeys}
      sweaterInSeason={resolveSweaterInSeason(sweaterMode)}
    />
  );
}
