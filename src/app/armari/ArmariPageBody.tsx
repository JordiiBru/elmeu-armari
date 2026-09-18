import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { findAllGarments } from "@/lib/prendas/service";
import { getCurrentSeason } from "@/lib/prendas/season";
import { getSweaterMode } from "@/lib/auth/service";
import { ArmariGrid } from "@/components/ArmariGrid";
import { SweaterModeToggle } from "@/components/SweaterModeToggle";
import { PageContainer, SectionHeader, GridSkeleton } from "@/components/ui";

/**
 * Shared body of `/armari`. Rendered both by the plain list route and by
 * `/armari/[slug]` (the non-intercepted fallback for direct/deep links to a
 * garment) so a hard refresh on a garment URL shows the same list-behind-
 * modal layout as a client-side navigation into the intercepted route.
 *
 * One grid, no tabs. Combining used to be a tab here and is now an action
 * on a piece, inside its modal, which is the only place a piece lives;
 * saved outfits used to be another tab and now live in "què em poso?".
 */
export async function ArmariPageBody() {
  const t = await getTranslations("armari");
  const session = await auth();
  const [garments, sweaterMode] = await Promise.all([
    findAllGarments(),
    session?.user?.id ? getSweaterMode(session.user.id) : Promise.resolve("AUTO" as const),
  ]);

  return (
    <PageContainer width="wide">
      <SectionHeader
        title={t("title")}
        subtitle={
          garments.length === 0
            ? t("empty")
            : t("count", { count: garments.length })
        }
      />

      <div className="mb-6">
        <SweaterModeToggle initialMode={sweaterMode} />
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <ArmariGrid garments={garments} defaultSeason={getCurrentSeason()} />
      </Suspense>
    </PageContainer>
  );
}
