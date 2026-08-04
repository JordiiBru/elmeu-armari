import { findAllGarments } from "@/lib/prendas/service";
import { isWashable, isClean } from "@/lib/bugaderia/laundry";
import { LaundryPicker } from "@/components/LaundryPicker";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EmbrutarPage() {
  const garments = await findAllGarments();
  const clean = garments.filter((g) => isWashable(g) && isClean(g));

  return (
    <PageContainer width="narrow">
      <SectionHeader
        title={UI.bugaderia.picker.soil.title}
        subtitle={UI.bugaderia.picker.soil.subtitle}
        level="title-xl"
      />
      <LaundryPicker mode="soil" garments={clean} />
    </PageContainer>
  );
}
