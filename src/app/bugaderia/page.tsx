import { Suspense } from "react";
import { findAllGarments } from "@/lib/prendas/service";
import { isWashable, isClean, isDirty } from "@/lib/bugaderia/laundry";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { LaundryBoard } from "@/components/LaundryBoard";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Both piles are served together: the screen is a toggle between them, and
 * sorting laundry means passing over the same two piles a few times in a
 * row. One fetch, no navigation between passes.
 */
export default async function BugaderiaPage() {
  const washable = (await findAllGarments()).filter(isWashable);

  return (
    <PageContainer width="narrow">
      <SectionHeader title={UI.bugaderia.title} subtitle={UI.bugaderia.subtitle} />

      <Suspense fallback={null}>
        <LaundryBoard
          clean={sortByWardrobeOrder(washable.filter(isClean))}
          basket={sortByWardrobeOrder(washable.filter(isDirty))}
        />
      </Suspense>
    </PageContainer>
  );
}
