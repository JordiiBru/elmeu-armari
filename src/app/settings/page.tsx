import { getTranslations } from "next-intl/server";
import { ImportForm } from "@/components/ImportForm";
import { findAllGarments } from "@/lib/prendas/service";
import { PageContainer, SectionHeader, Stack, Text, Icon } from "@/components/ui";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const garments = await findAllGarments();

  return (
    <PageContainer width="form">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} level="title-xl" />

      <div className="flex flex-col divide-y divide-border">
        <Stack as="section" gap={4} className="py-10">
          <Text variant="caption" as="h2">{t("export.title")}</Text>
          <Text variant="subtitle" tone="secondary" as="p" className="max-w-md">
            {t("export.description")}
          </Text>
          <Text variant="caption" tabular>
            {t("export.count", { count: garments.length })}
          </Text>
          <div className="flex flex-col gap-3">
            <a
              href="/api/export"
              download
              className="group relative self-start type-subtitle text-text-primary inline-flex items-center gap-2 active:scale-[0.98]"
            >
              <span>{t("export.json")}</span>
              <Icon name="arrow-right" size={14} />
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 -bottom-1 h-px w-full bg-text-primary origin-left transition-transform duration-[var(--duration-slow)] ease-out scale-x-0 group-hover:scale-x-100"
              />
            </a>
            <a
              href="/api/export/zip"
              download
              className="group relative self-start type-subtitle text-text-primary inline-flex items-center gap-2 active:scale-[0.98]"
            >
              <span>{t("export.zip")}</span>
              <Icon name="arrow-right" size={14} />
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 -bottom-1 h-px w-full bg-text-primary origin-left transition-transform duration-[var(--duration-slow)] ease-out scale-x-0 group-hover:scale-x-100"
              />
            </a>
          </div>
        </Stack>

        <Stack as="section" gap={4} className="py-10">
          <Text variant="caption" as="h2">{t("import.title")}</Text>
          <Text variant="subtitle" tone="secondary" as="p" className="max-w-md">
            {t("import.description")}
          </Text>
          <ImportForm />
        </Stack>
      </div>
    </PageContainer>
  );
}
