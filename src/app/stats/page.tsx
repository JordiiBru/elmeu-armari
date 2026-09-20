export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { findAllGarments } from "@/lib/prendas/service";
import { optionLabel } from "@/lib/prendas/labels";
import { CATEGORIES, SEASONS, ALL_FITS, TEXTURES } from "@/lib/prendas/types";
import { colourCounts } from "@/lib/prendas/stats";
import { colourName } from "@/lib/colors/names";
import { ColourStrip } from "@/components/ColourStrip";
import { PageRow } from "@/components/PageRow";
import {
  PageContainer,
  SectionHeader,
  Stack,
  Cluster,
  Text,
  EmptyState,
  TextLink,
} from "@/components/ui";

function pct(n: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

/** A label, its count and a hairline that fills to its share. `swatch`
 * puts the colour itself in front, for the rows that are colours. */
function Bar({
  label,
  count,
  total,
  swatch,
}: {
  label: string;
  count: number;
  total: number;
  swatch?: string;
}) {
  const width = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <Stack gap={2} className="py-2">
      <Cluster justify="between" align="baseline" gap={4}>
        <Cluster align="center" gap={3}>
          {swatch && (
            <span
              aria-hidden
              className="block h-4 w-4 flex-shrink-0 border border-border"
              style={{ backgroundColor: swatch }}
            />
          )}
          <Text as="span" className="font-serif">{label}</Text>
        </Cluster>
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

export default async function StatsPage() {
  const [t, tLabel, raw] = await Promise.all([
    getTranslations("stats"),
    getTranslations("labels"),
    findAllGarments(),
  ]);
  const total = raw.length;

  if (total === 0) {
    return (
      <PageContainer width="wide">
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} level="title-xl" />
        <EmptyState
          title={t("empty")}
          hint={t("emptyHint")}
          action={<TextLink href="/add">{t("addGarment")}</TextLink>}
        />
      </PageContainer>
    );
  }

  const perCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  const perSeason = Object.fromEntries(SEASONS.map((s) => [s, 0])) as Record<string, number>;
  const perFit = Object.fromEntries(ALL_FITS.map((f) => [f, 0])) as Record<string, number>;
  const perTexture = Object.fromEntries(TEXTURES.map((t) => [t, 0])) as Record<string, number>;

  for (const g of raw) {
    perCategory[g.category] = (perCategory[g.category] ?? 0) + 1;
    if (g.fit) perFit[g.fit] = (perFit[g.fit] ?? 0) + 1;
    if (g.texture) perTexture[g.texture] = (perTexture[g.texture] ?? 0) + 1;

    for (const s of g.seasons) {
      if (s.season in perSeason) perSeason[s.season]++;
    }
  }

  const colours = colourCounts(raw);

  return (
    <PageContainer width="wide">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} level="title-xl" />

      {/* The wardrobe, first as a number and then as itself: the strip is
          every colour it holds, as wide as how often it turns up. */}
      <Stack gap={5} className="pb-12 md:pb-16">
        <Cluster align="baseline" gap={3}>
          <span className="type-display tabular-nums leading-none">{total}</span>
          <Text variant="subtitle" tone="secondary" italic>
            {t("total")}
          </Text>
        </Cluster>
        <ColourStrip colours={colours} className="h-16 md:h-24" />
      </Stack>

      <PageRow number="01" title={t("sections.category")}>
        <Stack gap={3}>
          {CATEGORIES.filter((c) => perCategory[c] > 0).map((c) => (
            <Bar key={c} label={tLabel(`category.${c}`)} count={perCategory[c]} total={total} />
          ))}
        </Stack>
      </PageRow>

      <PageRow number="02" title={t("sections.season")}>
        <Stack gap={3}>
          {SEASONS.filter((s) => perSeason[s] > 0).map((s) => (
            <Bar key={s} label={tLabel(`season.${s}`)} count={perSeason[s]} total={total} />
          ))}
        </Stack>
      </PageRow>

      <PageRow number="03" title={t("sections.fit")}>
        <Stack gap={3}>
          {ALL_FITS.filter((f) => perFit[f] > 0).map((f) => (
            <Bar key={f} label={optionLabel(tLabel, "fit", f)} count={perFit[f]} total={total} />
          ))}
        </Stack>
      </PageRow>

      <PageRow number="04" title={t("sections.texture")}>
        <Stack gap={3}>
          {TEXTURES.filter((tex) => perTexture[tex] > 0).map((tex) => (
            <Bar key={tex} label={tLabel(`texture.${tex}`)} count={perTexture[tex]} total={total} />
          ))}
        </Stack>
      </PageRow>

      {colours.length > 0 && (
        <PageRow number="05" title={t("sections.topColors")}>
          <Stack gap={3}>
            {colours.slice(0, 8).map(({ hex, count }) => (
              <Bar
                key={hex}
                label={colourName(hex) ?? hex}
                count={count}
                total={total}
                swatch={hex}
              />
            ))}
          </Stack>
        </PageRow>
      )}
    </PageContainer>
  );
}
