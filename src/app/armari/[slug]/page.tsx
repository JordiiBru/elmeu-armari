import { notFound } from "next/navigation";
import { findGarmentByIdSuffix, findAllGarments } from "@/lib/prendas/service";
import {
  findSavedOutfitKeys,
  findOutfitsWithGarment,
  findTodayWorn,
} from "@/lib/outfits/service";
import { getCurrentSeason } from "@/lib/prendas/season";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { dayToISO } from "@/lib/outfits/week";
import { idSuffixFromSlug } from "@/lib/prendas/slug";
import { palettes } from "@/lib/colors";
import { GarmentModalRoute } from "@/components/GarmentModalRoute";
import { ArmariPageBody } from "../ArmariPageBody";

export const dynamic = "force-dynamic";

/**
 * Non-intercepted fallback for `/armari/[slug]`: hit on a hard navigation or
 * a direct/deep link (interception only applies to client-side transitions
 * from `/armari`). Renders the same list-behind-modal layout the
 * intercepted route shows, so the two entry points look identical.
 */
export default async function GarmentDirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [garment, allGarments, savedOutfitKeys, todayWorn] = await Promise.all([
    findGarmentByIdSuffix(idSuffixFromSlug(slug)),
    findAllGarments(),
    findSavedOutfitKeys(),
    findTodayWorn(),
  ]);
  if (!garment) notFound();

  const outfitsWith = await findOutfitsWithGarment(garment.id, getCurrentSeason());

  return (
    <>
      <ArmariPageBody />
      <GarmentModalRoute
      garment={garment}
      allGarments={allGarments}
      palettes={palettes}
      savedOutfitKeys={savedOutfitKeys}
      outfitsWith={outfitsWith}
      extraCandidates={allGarments.filter((g) => EXTRA_CATEGORIES.has(g.category))}
      todayISO={dayToISO(new Date())}
      todayOutfitId={todayWorn?.outfitId ?? null}
    />
    </>
  );
}
