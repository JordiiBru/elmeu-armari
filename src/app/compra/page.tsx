import { getTranslations } from "next-intl/server";
import { findAllGarments } from "@/lib/prendas/service";
import { sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { ShoppingAdvisor } from "@/components/ShoppingAdvisor";
import { InfoHint, PageContainer, SectionHeader } from "@/components/ui";
import { requireUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * A view, not a record: a piece you do not own yet is scored against the
 * whole wardrobe in the browser, and nothing is saved. Clean or dirty does
 * not matter, you are buying for every day, not for today.
 */
export default async function CompraPage() {
  const [t, tHelp] = await Promise.all([getTranslations("compra"), getTranslations("help")]);
  const garments = sortByWardrobeOrder(await findAllGarments(await requireUserId()));

  return (
    <PageContainer width="wide">
      <SectionHeader
        title={t("title")}
        subtitle={
          <>
            {t("subtitle")}
            <span className="ml-3">
              <InfoHint label={tHelp("hintLabel")} href="/ajuda#compra" moreLabel={tHelp("more")}>
                {tHelp("hints.compra")}
              </InfoHint>
            </span>
          </>
        }
      />
      <ShoppingAdvisor garments={garments} />
    </PageContainer>
  );
}
