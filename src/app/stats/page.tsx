export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { findAllGarments } from "@/lib/prendas/service";
import { optionLabel } from "@/lib/prendas/labels";
import { CATEGORIES, SEASONS, ALL_FITS, TEXTURES } from "@/lib/prendas/types";
import {
  PageContainer,
  SectionHeader,
  Stack,
  Cluster,
  Text,
} from "@/components/ui";

function pct(n: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function Row({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const width = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <Stack gap={2} className="py-2">
      <Cluster justify="between" align="baseline" gap={4}>
        <Text as="span" className="font-serif">{label}</Text>
        <Text variant="caption" tabular>
          {count} · {pct(count, total)}
        </Text>
      </Cluster>
      <div className="w-full h-px bg-border relative overflow-hidden">
        <div
          className="absolute inset-0 bg-text-primary origin-left transition-transform duration-[var(--duration-deliberate)] ease-out will-change-transform"
          style={{ transform: `scaleX(${width / 100})` }}
        />
      </div>
    </Stack>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack as="section" gap={2}>
      <Text variant="caption" as="h2" className="pb-2 border-b border-border">
        {title}
      </Text>
      <Stack gap={3} className="pt-2">{children}</Stack>
    </Stack>
  );
}

export default async function StatsPage() {
  const [t, tLabel, raw] = await Promise.all([
    getTranslations("stats"),
    getTranslations("labels"),
    findAllGarments(),
  ]);
  const total = raw.length;

  if (total === 0) {
    return (
      <PageContainer width="form">
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} level="title-xl" />
        <Text variant="subtitle" tone="secondary" italic as="p">
          {t("empty")}
        </Text>
      </PageContainer>
    );
  }

  const perCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  const perSeason = Object.fromEntries(SEASONS.map((s) => [s, 0])) as Record<string, number>;
  const perFit = Object.fromEntries(ALL_FITS.map((f) => [f, 0])) as Record<string, number>;
  const perTexture = Object.fromEntries(TEXTURES.map((t) => [t, 0])) as Record<string, number>;
  const hexCount: Record<string, number> = {};

  for (const g of raw) {
    perCategory[g.category] = (perCategory[g.category] ?? 0) + 1;
    if (g.fit) perFit[g.fit] = (perFit[g.fit] ?? 0) + 1;
    if (g.texture) perTexture[g.texture] = (perTexture[g.texture] ?? 0) + 1;

    for (const s of g.seasons) {
      if (s.season in perSeason) perSeason[s.season]++;
    }

    for (const c of g.colors) {
      hexCount[c.hex] = (hexCount[c.hex] ?? 0) + 1;
    }
  }

  const topColors = Object.entries(hexCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16);

  return (
    <PageContainer width="form">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} level="title-xl" />

      <Cluster align="baseline" gap={3} className="pb-10 border-b border-border">
        <span className="type-display tabular-nums leading-none">{total}</span>
        <Text variant="subtitle" tone="secondary" italic>
          {t("total")}
        </Text>
      </Cluster>

      <Stack gap={7} className="pt-10">
        <Section title={t("sections.category")}>
          {CATEGORIES.filter((c) => perCategory[c] > 0).map((c) => (
            <Row key={c} label={tLabel(`category.${c}`)} count={perCategory[c]} total={total} />
          ))}
        </Section>

        <Section title={t("sections.season")}>
          {SEASONS.filter((s) => perSeason[s] > 0).map((s) => (
            <Row key={s} label={tLabel(`season.${s}`)} count={perSeason[s]} total={total} />
          ))}
        </Section>

        <Section title={t("sections.fit")}>
          {ALL_FITS.filter((f) => perFit[f] > 0).map((f) => (
            <Row key={f} label={optionLabel(tLabel, "fit", f)} count={perFit[f]} total={total} />
          ))}
        </Section>

        <Section title={t("sections.texture")}>
          {TEXTURES.filter((tex) => perTexture[tex] > 0).map((tex) => (
            <Row key={tex} label={tLabel(`texture.${tex}`)} count={perTexture[tex]} total={total} />
          ))}
        </Section>

        {topColors.length > 0 && (
          <Stack as="section" gap={4}>
            <Text variant="caption" as="h2" className="pb-2 border-b border-border">
              {t("sections.topColors")}
            </Text>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-x-2 gap-y-4">
              {topColors.map(([hex, count]) => (
                <Stack key={hex} gap={2}>
                  <span
                    className="block aspect-square w-full"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <Text variant="caption" tabular>
                    {count}
                  </Text>
                </Stack>
              ))}
            </div>
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
}
