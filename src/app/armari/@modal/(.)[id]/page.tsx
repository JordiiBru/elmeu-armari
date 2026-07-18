import { notFound } from "next/navigation";
import { findGarmentById } from "@/lib/prendas/service";
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
  const garment = await findGarmentById(id);
  if (!garment) notFound();

  return <GarmentModalRoute garment={garment} />;
}
