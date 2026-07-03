export const dynamic = "force-dynamic";

import { findAllGarments } from "@/lib/prendas/service";
import {
  CATEGORY_LABELS,
  SEASON_LABELS,
  FIT_LABELS,
  TEXTURE_LABELS,
} from "@/lib/prendas/labels";
import { CATEGORIES, SEASONS, ALL_FITS, TEXTURES } from "@/lib/prendas/types";

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
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-serif text-base text-foreground">{label}</span>
        <span className="text-[11px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
          {count} · {pct(count, total)}
        </span>
      </div>
      <div className="w-full h-px bg-border relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
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
    <section className="flex flex-col gap-2">
      <h2 className="text-[10px] tracking-[0.3em] uppercase text-foreground-secondary pb-2 border-b border-border">
        {title}
      </h2>
      <div className="flex flex-col gap-3 pt-2">{children}</div>
    </section>
  );
}

export default async function StatsPage() {
  const raw = await findAllGarments();
  const total = raw.length;

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto w-full px-6 md:px-10 pb-24">
        <header className="pt-2 pb-8 flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
            arxiu
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[0.95]">
            estadístiques
          </h1>
        </header>
        <p className="font-serif italic text-foreground-secondary">
          encara no hi ha peces a l&apos;armari.
        </p>
      </div>
    );
  }

  const perCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  const perSeason = Object.fromEntries(SEASONS.map((s) => [s, 0])) as Record<string, number>;
  const perFit = Object.fromEntries(ALL_FITS.map((f) => [f, 0])) as Record<string, number>;
  const perTexture = Object.fromEntries(TEXTURES.map((t) => [t, 0])) as Record<string, number>;
  const hexCount: Record<string, number> = {};

  for (const g of raw) {
    perCategory[g.category] = (perCategory[g.category] ?? 0) + 1;
    perFit[g.fit] = (perFit[g.fit] ?? 0) + 1;
    perTexture[g.texture] = (perTexture[g.texture] ?? 0) + 1;

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
    <div className="max-w-2xl mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-2 pb-8 flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
          arxiu
        </span>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[0.95]">
          estadístiques
        </h1>
      </header>

      <div className="flex items-baseline gap-3 pb-10 border-b border-border">
        <span className="font-serif text-6xl leading-none tabular-nums">{total}</span>
        <span className="font-serif italic text-base text-foreground-secondary">
          peces en total
        </span>
      </div>

      <div className="flex flex-col gap-12 pt-10">
        <Section title="categoria">
          {CATEGORIES.filter((c) => perCategory[c] > 0).map((c) => (
            <Row key={c} label={CATEGORY_LABELS[c]} count={perCategory[c]} total={total} />
          ))}
        </Section>

        <Section title="temporada">
          {SEASONS.filter((s) => perSeason[s] > 0).map((s) => (
            <Row key={s} label={SEASON_LABELS[s]} count={perSeason[s]} total={total} />
          ))}
        </Section>

        <Section title="fit">
          {ALL_FITS.filter((f) => perFit[f] > 0).map((f) => (
            <Row key={f} label={FIT_LABELS[f]} count={perFit[f]} total={total} />
          ))}
        </Section>

        <Section title="textura">
          {TEXTURES.filter((t) => perTexture[t] > 0).map((t) => (
            <Row key={t} label={TEXTURE_LABELS[t]} count={perTexture[t]} total={total} />
          ))}
        </Section>

        {topColors.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-foreground-secondary pb-2 border-b border-border">
              colors dominants
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-x-2 gap-y-4">
              {topColors.map(([hex, count]) => (
                <div key={hex} className="flex flex-col gap-1.5">
                  <span
                    className="block aspect-square w-full"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
