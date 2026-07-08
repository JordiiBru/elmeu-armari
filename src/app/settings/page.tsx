import { ImportForm } from "@/components/ImportForm";
import { findAllGarments } from "@/lib/prendas/service";
import { PageContainer, SectionHeader, Stack, Text } from "@/components/ui";

export default async function SettingsPage() {
  const garments = await findAllGarments();

  return (
    <PageContainer width="form">
      <SectionHeader eyebrow="arxiu" title="configuració" level="title-xl" />

      <div className="flex flex-col divide-y divide-border">
        <Stack as="section" gap={4} className="py-10">
          <Text variant="caption" as="h2">exportar</Text>
          <Text variant="subtitle" tone="secondary" as="p" className="max-w-md">
            descarrega totes les teves peces en format json. útil com a còpia de seguretat o per migrar a un altre dispositiu.
          </Text>
          <Text variant="caption" tabular>
            {garments.length} peces a l&apos;arxiu
          </Text>
          <a
            href="/api/export"
            download
            className="group relative self-start type-subtitle text-text-primary active:scale-[0.98]"
          >
            <span>→ descarregar json</span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 -bottom-1 h-px w-full bg-text-primary origin-left transition-transform duration-500 ease-out scale-x-0 group-hover:scale-x-100"
            />
          </a>
        </Stack>

        <Stack as="section" gap={4} className="py-10">
          <Text variant="caption" as="h2">importar</Text>
          <Text variant="subtitle" tone="secondary" as="p" className="max-w-md">
            puja un fitxer json exportat prèviament.
          </Text>
          <ImportForm />
        </Stack>
      </div>
    </PageContainer>
  );
}
