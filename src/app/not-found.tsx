import { getTranslations } from "next-intl/server";
import { EdgePage } from "@/components/EdgePage";
import { TextLink } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("errorPages.notFound");

  return (
    <EdgePage title={t("title")} note={t("note")}>
      <TextLink href="/">{t("home")}</TextLink>
    </EdgePage>
  );
}
