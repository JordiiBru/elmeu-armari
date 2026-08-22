import { getTranslations } from "next-intl/server";
import { AddForm } from "@/components/AddForm";
import { PageContainer, SectionHeader } from "@/components/ui";

export default async function AddPage() {
  const t = await getTranslations("add");

  return (
    <PageContainer width="narrow">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        level="title-xl"
      />
      <AddForm />
    </PageContainer>
  );
}
