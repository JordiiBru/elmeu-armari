import { notFound } from "next/navigation";
import { findGarmentByIdSuffix } from "@/lib/prendas/service";
import { idSuffixFromSlug } from "@/lib/prendas/slug";
import { GarmentModalRoute } from "@/components/GarmentModalRoute";
import { ArmariPageBody } from "../ArmariPageBody";
import { requireUserId } from "@/lib/auth/session";

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
  const userId = await requireUserId();
  const garment = await findGarmentByIdSuffix(userId, idSuffixFromSlug(slug));
  if (!garment) notFound();

  return (
    <>
      <ArmariPageBody />
      <GarmentModalRoute garment={garment} />
    </>
  );
}
