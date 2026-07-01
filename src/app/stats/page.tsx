import Link from "next/link";
import { findAllGarments, parseSeasons } from "@/lib/prendas/service";
import {
  CATEGORY_LABELS,
  SEASON_LABELS,
  FIT_LABELS,
  TEXTURE_LABELS,
} from "@/lib/prendas/labels";
import { CATEGORIES, SEASONS, FITS, TEXTURES } from "@/lib/prendas/types";

function pct(n: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function Bar({ n, total }: { n: number; total: number }) {
  const width = total === 0 ? 0 : Math.round((n / total) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className="bg-black h-1.5 rounded-full" style={{ width: `${width}%` }} />
    </div>
  );
}

export default async function StatsPage() {
  const raw = await findAllGarments();
  const total = raw.length;

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Inici</Link>
        <p className="mt-8 text-gray-400 text-sm">Encara no hi ha peces a l&apos;armari.</p>
      </div>
    );
  }

  const perCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  const perSeason = Object.fromEntries(SEASONS.map((s) => [s, 0])) as Record<string, number>;
  const perFit = Object.fromEntries(FITS.map((f) => [f, 0])) as Record<string, number>;
  const perTexture = Object.fromEntries(TEXTURES.map((t) => [t, 0])) as Record<string, number>;
  const hexCount: Record<string, number> = {};

  for (const g of raw) {
    perCategory[g.category] = (perCategory[g.category] ?? 0) + 1;
    perFit[g.fit] = (perFit[g.fit] ?? 0) + 1;
    perTexture[g.texture] = (perTexture[g.texture] ?? 0) + 1;

    for (const s of parseSeasons(g.season)) {
      if (s in perSeason) perSeason[s]++;
    }

    for (const c of g.colors) {
      hexCount[c.hex] = (hexCount[c.hex] ?? 0) + 1;
    }
  }

  const topColors = Object.entries(hexCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Inici</Link>
        <h1 className="text-xl font-semibold">Estadístiques</h1>
      </div>

      <p className="text-3xl font-bold">
        {total} <span className="text-base font-normal text-gray-500">peces en total</span>
      </p>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Per categoria</h2>
        <div className="space-y-3">
          {CATEGORIES.filter((c) => perCategory[c] > 0).map((c) => (
            <div key={c}>
              <div className="flex justify-between text-sm">
                <span>{CATEGORY_LABELS[c]}</span>
                <span className="text-gray-500">{perCategory[c]} · {pct(perCategory[c], total)}</span>
              </div>
              <Bar n={perCategory[c]} total={total} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Per temporada</h2>
        <div className="space-y-3">
          {SEASONS.filter((s) => perSeason[s] > 0).map((s) => (
            <div key={s}>
              <div className="flex justify-between text-sm">
                <span>{SEASON_LABELS[s]}</span>
                <span className="text-gray-500">{perSeason[s]} · {pct(perSeason[s], total)}</span>
              </div>
              <Bar n={perSeason[s]} total={total} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Per fit</h2>
        <div className="space-y-3">
          {FITS.filter((f) => perFit[f] > 0).map((f) => (
            <div key={f}>
              <div className="flex justify-between text-sm">
                <span>{FIT_LABELS[f]}</span>
                <span className="text-gray-500">{perFit[f]} · {pct(perFit[f], total)}</span>
              </div>
              <Bar n={perFit[f]} total={total} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Per textura</h2>
        <div className="space-y-3">
          {TEXTURES.filter((t) => perTexture[t] > 0).map((t) => (
            <div key={t}>
              <div className="flex justify-between text-sm">
                <span>{TEXTURE_LABELS[t]}</span>
                <span className="text-gray-500">{perTexture[t]} · {pct(perTexture[t], total)}</span>
              </div>
              <Bar n={perTexture[t]} total={total} />
            </div>
          ))}
        </div>
      </section>

      {topColors.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Colors dominants</h2>
          <div className="flex flex-wrap gap-2">
            {topColors.map(([hex, count]) => (
              <div key={hex} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded border border-gray-200 shrink-0"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
                <span className="text-xs text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
