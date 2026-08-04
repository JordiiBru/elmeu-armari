import { findAllGarments } from "@/lib/prendas/service";
import { isDirty } from "@/lib/bugaderia/laundry";
import { LaundryPicker } from "@/components/LaundryPicker";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RentarPage() {
  const garments = await findAllGarments();
  const dirty = garments.filter(isDirty);

  return (
    <PageContainer width="narrow">
      <SectionHeader
        title={UI.bugaderia.picker.wash.title}
        subtitle={UI.bugaderia.picker.wash.subtitle}
        level="title-xl"
      />
      <LaundryPicker mode="wash" garments={dirty} />
    </PageContainer>
  );
}
