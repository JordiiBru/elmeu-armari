import { notFound } from "next/navigation";
import { findGarmentById } from "@/lib/prendas/service";
import { EditForm } from "@/components/EditForm";
import { PageContainer, SectionHeader } from "@/components/ui";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const garment = await findGarmentById(id);
  if (!garment) notFound();

  return (
    <PageContainer width="narrow">
      <SectionHeader
        eyebrow="editar peça"
        title="revisar la fitxa"
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
