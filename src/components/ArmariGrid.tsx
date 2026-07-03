"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { GarmentModal } from "@/components/GarmentModal";
import { filterGarments } from "@/lib/prendas/filtering";
import type { GarmentWithColors, Category, Texture, Season } from "@/lib/prendas/types";
import { CATEGORIES, SEASONS, ALL_FITS, TEXTURES } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  SEASON_LABELS,
  FIT_LABELS,
  TEXTURE_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";

interface Props {
  garments: GarmentWithColors[];
}

const tag = (active: boolean) =>
  `inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase transition-colors cursor-pointer ${
    active ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
  }`;

function Dot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-1 w-1 rounded-full transition-colors ${
        active ? "bg-foreground" : "bg-border"
      }`}
    />
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-6 items-baseline">
      <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary pt-0.5">
        {label}
      </span>
      <div className="flex flex-wrap gap-x-5 gap-y-2">{children}</div>
    </div>
  );
}

export function ArmariGrid({ garments }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<GarmentWithColors | null>(null);

  const categories = searchParams.getAll("cat") as Category[];
  const seasons = searchParams.getAll("season") as Season[];
  const fits = searchParams.getAll("fit") as string[];
  const textures = searchParams.getAll("tex") as Texture[];
  const query = searchParams.get("q") ?? "";

  const hasFilters =
    categories.length > 0 || seasons.length > 0 || fits.length > 0 || textures.length > 0 || query !== "";

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    params.delete(key);
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      [...current, value].forEach((v) => params.append(key, v));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const filtered = useMemo(
    () => filterGarments(garments, { categories, seasons, fits, textures, query }),
    [garments, categories, seasons, fits, textures, query]
  );

  return (
    <>
      <div className="flex flex-col gap-6 mb-14">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="cerca per talla o nota"
          className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm placeholder:text-foreground-secondary focus:outline-none focus:border-foreground transition-colors"
        />

        <div className="flex flex-col gap-4">
          <FilterRow label="categoria">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggle("cat", c)}
                className={tag(categories.includes(c))}
              >
                <Dot active={categories.includes(c)} />
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </FilterRow>

          <FilterRow label="temporada">
            {SEASONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => toggle("season", s)}
                className={tag(seasons.includes(s))}
              >
                <Dot active={seasons.includes(s)} />
                {SEASON_LABELS[s]}
              </button>
            ))}
          </FilterRow>

          <FilterRow label="fit">
            {ALL_FITS.map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => toggle("fit", f)}
                className={tag(fits.includes(f))}
              >
                <Dot active={fits.includes(f)} />
                {FIT_LABELS[f]}
              </button>
            ))}
          </FilterRow>

          <FilterRow label="textura">
            {TEXTURES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggle("tex", t)}
                className={tag(textures.includes(t))}
              >
                <Dot active={textures.includes(t)} />
                {TEXTURE_LABELS[t]}
              </button>
            ))}
          </FilterRow>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className="font-serif italic text-sm text-foreground-secondary hover:text-foreground"
            >
              {UI.buttons.clearFilters}
            </button>
            <span className="text-[11px] tracking-[0.2em] uppercase text-foreground-secondary">
              {filtered.length} de {garments.length}
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="font-serif italic text-foreground-secondary text-center py-16">
          {UI.grid.noResults}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((garment, i) => (
            <button
              type="button"
              key={garment.id}
              onClick={() => setSelected(garment)}
              className="group flex flex-col text-left"
            >
              <div className="relative flex aspect-[3/4] w-full overflow-hidden transition-transform duration-500 ease-out group-hover:-translate-y-1">
                {garment.colors.map((c) => (
                  <div
                    key={c.id}
                    className="flex-1"
                    style={{ backgroundColor: c.hex }}
                    title={c.hex}
                  />
                ))}
              </div>
              <div className="flex items-baseline justify-between pt-3">
                <span className="font-serif text-base leading-tight">
                  {CATEGORY_LABELS[garment.category]}
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
                  n{String(i + 1).padStart(3, "0")}
                </span>
              </div>
              <span className="text-xs italic text-foreground-secondary mt-0.5">
                {FIT_LABELS[garment.fit] ?? garment.fit} · {garment.size}
              </span>
              {garment.notes && (
                <span className="text-xs text-foreground-secondary mt-0.5 truncate">
                  {garment.notes}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <GarmentModal garment={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
