import { Suspense } from "react";
import { findAllGarments } from "@/lib/prendas/service";
import { isWashable, isClean, isDirty } from "@/lib/bugaderia/laundry";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { getTranslations } from "next-intl/server";
import { LaundryBoard } from "@/components/LaundryBoard";
import { PageContainer, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Both piles are served together: the screen is a toggle between them, and
 * sorting laundry means passing over the same two piles a few times in a
 * row. One fetch, no navigation between passes.
 */
export default async function BugaderiaPage() {
  const t = await getTranslations("bugaderia");
  const washable = (await findAllGarments()).filter(isWashable);

  return (
    // Wide, not narrow. This is a wall of photographs you scan standing in
    // front of the wardrobe; at max-w-lg a desktop showed a phone-sized
    // column stranded in the middle of the screen.
    <PageContainer width="wide">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <Suspense fallback={null}>
        <LaundryBoard
          clean={sortByWardrobeOrder(washable.filter(isClean))}
          basket={sortByWardrobeOrder(washable.filter(isDirty))}
        />
      </Suspense>
    </PageContainer>
  );
}
