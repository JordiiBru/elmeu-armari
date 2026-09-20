import { getTranslations } from "next-intl/server";
import { ImportForm } from "@/components/ImportForm";
import { findAllGarments } from "@/lib/prendas/service";
import { colourCounts } from "@/lib/prendas/stats";
import { ColourStrip } from "@/components/ColourStrip";
import { PageRow } from "@/components/PageRow";
import { PageContainer, SectionHeader, Stack, Text, Icon } from "@/components/ui";
import { requireUserId } from "@/lib/auth/session";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const garments = await findAllGarments(await requireUserId());

  return (
    <PageContainer width="wide">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} level="title-xl" />

      <div>
        <PageRow number="01" title={t("export.title")}>
          <Text variant="subtitle" tone="secondary" as="p" className="max-w-md">
            {t("export.description")}
          </Text>
          <Stack gap={3}>
            <Text variant="caption" tabular>
              {t("export.count", { count: garments.length })}
            </Text>
            {/* What is being taken along, as the colours it holds. */}
            {garments.length > 0 && (
              <ColourStrip colours={colourCounts(garments)} className="h-8" />
            )}
          </Stack>
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
        </PageRow>

        <PageRow number="02" title={t("import.title")}>
          <Text variant="subtitle" tone="secondary" as="p" className="max-w-md">
            {t("import.description")}
          </Text>
          <ImportForm />
        </PageRow>
      </div>
    </PageContainer>
  );
}
