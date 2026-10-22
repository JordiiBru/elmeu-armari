import { getTranslations } from "next-intl/server";
import { findAllGarments } from "@/lib/prendas/service";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { dayToISO, today } from "@/lib/outfits/week";
import { PackPlanner } from "@/components/PackPlanner";
import { PageContainer, SectionHeader } from "@/components/ui";
import { requireUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * A view, not a record: the plan is computed in the browser from the
 * whole wardrobe and nothing is saved. Clean or dirty does not matter,
 * the trip has not started yet.
 */
export default async function MaletaPage() {
  const t = await getTranslations("maleta");
  const garments = sortByWardrobeOrder(await findAllGarments(await requireUserId()));

  return (
    <PageContainer width="wide">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      <PackPlanner garments={garments} todayISO={dayToISO(today())} />
    </PageContainer>
  );
}
