import { AddForm } from "@/components/AddForm";
import { PageContainer, SectionHeader } from "@/components/ui";

export default function AddPage() {
  return (
    <PageContainer width="narrow">
      <SectionHeader
        eyebrow="nova peça"
        title="afegir al catàleg"
        level="title-xl"
      />
      <AddForm />
    </PageContainer>
  );
}
