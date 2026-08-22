import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { findGarmentById } from "@/lib/prendas/service";
import { EditForm } from "@/components/EditForm";
import { PageContainer, SectionHeader } from "@/components/ui";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, garment] = await Promise.all([
    getTranslations("edit"),
    findGarmentById(id),
  ]);
  if (!garment) notFound();

  return (
    <PageContainer width="narrow">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        level="title-xl"
      />
      <EditForm
        garment={garment}
        defaultSeasons={garment.seasons.map((s) => s.season)}
        defaultHexColors={garment.colors.map((c) => c.hex)}
      />
    </PageContainer>
  );
}
