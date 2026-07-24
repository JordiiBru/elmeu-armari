import { notFound } from "next/navigation";
import { findGarmentById, findAllGarments } from "@/lib/prendas/service";
import { palettes } from "@/lib/colors";
import { GarmentModalRoute } from "@/components/GarmentModalRoute";
import { ArmariPageBody } from "../ArmariPageBody";

export const dynamic = "force-dynamic";

/**
 * Non-intercepted fallback for `/armari/[id]`: hit on a hard navigation or
 * a direct/deep link (interception only applies to client-side transitions
 * from `/armari`). Renders the same list-behind-modal layout the
 * intercepted route shows, so the two entry points look identical.
 */
export default async function GarmentDirectPage({
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
    <>
      <ArmariPageBody />
      <GarmentModalRoute garment={garment} allGarments={allGarments} palettes={palettes} />
    </>
  );
}
