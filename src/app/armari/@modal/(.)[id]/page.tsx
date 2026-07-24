import { notFound } from "next/navigation";
import { findGarmentById, findAllGarments } from "@/lib/prendas/service";
import { palettes } from "@/lib/colors";
import { GarmentModalRoute } from "@/components/GarmentModalRoute";

export const dynamic = "force-dynamic";

/**
 * Intercepts client-side navigation from `/armari` to `/armari/[id]`
 * (the `(.)` marker matches the segment at the same level as `@modal`)
 * and renders the garment as an overlay instead of swapping the page.
 */
export default async function InterceptedGarmentModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [garment, allGarments] = await Promise.all([
    findGarmentById(id),
    findAllGarments(),
  ]);
  if (!garment) notFound();

  return (
    <GarmentModalRoute garment={garment} allGarments={allGarments} palettes={palettes} />
  );
}
