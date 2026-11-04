import { notFound } from "next/navigation";
import { findGarmentByIdSuffix } from "@/lib/prendas/service";
import { idSuffixFromSlug } from "@/lib/prendas/slug";
import { GarmentModalRoute } from "@/components/GarmentModalRoute";
import { requireUserId } from "@/lib/auth/session";

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
  const userId = await requireUserId();
  const garment = await findGarmentByIdSuffix(userId, idSuffixFromSlug(slug));
  if (!garment) notFound();

  return <GarmentModalRoute garment={garment} />;
}
