import { getTranslations } from "next-intl/server";
import { EdgePage } from "@/components/EdgePage";
import { TextLink } from "@/components/ui";

/**
 * Anything under `/armari/` that is not a garment is a garment's link that
 * stopped working, so it says so and leads back to the list, which is the
 * screen's parent in `SiteHeader`.
 */
export default async function GarmentNotFound() {
  const t = await getTranslations("errorPages.garmentGone");

  return (
    <EdgePage title={t("title")} note={t("note")}>
      <TextLink href="/armari">{t("back")}</TextLink>
    </EdgePage>
  );
}
