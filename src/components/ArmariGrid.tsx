"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { GarmentModal } from "@/components/GarmentModal";
import { GarmentCard, AddGarmentCard } from "@/components/GarmentCard";
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

function FilterTag({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-baseline transition-colors active:scale-[0.97]"
      aria-pressed={active}
    >
      <span
        className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${
          active ? "text-foreground" : "text-foreground-secondary group-hover:text-foreground"
        }`}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-foreground origin-left transition-transform duration-300 ease-out ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </button>
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeCount =
    categories.length + seasons.length + fits.length + textures.length + (query ? 1 : 0);

  return (
    <>
      <div className="flex flex-col gap-3 mb-6">
        {/* Trigger de filtres */}
        <div className="flex items-baseline justify-between">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="group inline-flex items-baseline gap-3 text-[11px] tracking-[0.25em] uppercase text-foreground-secondary hover:text-foreground transition-colors"
            aria-expanded={filtersOpen}
          >
            <span>filtres</span>
            {activeCount > 0 && (
              <span className="text-[10px] text-foreground tabular-nums">
                {activeCount}
              </span>
            )}
            <span
              aria-hidden
              className={`inline-block transition-transform duration-500 ease-out ${
                filtersOpen ? "rotate-180" : ""
              }`}
            >
              ˅
            </span>
          </button>
          <span className="text-[11px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
            {filtered.length} / {garments.length}
          </span>
        </div>

        {/* Panell col·lapsable */}
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-out ${
            filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-5 pt-4 pb-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cerca per talla o nota"
                className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm placeholder:text-foreground-secondary focus:outline-none focus:border-foreground transition-colors"
              />

              <FilterRow label="categoria">
                {CATEGORIES.map((c) => (
                  <FilterTag
                    key={c}
                    active={categories.includes(c)}
                    onClick={() => toggle("cat", c)}
                  >
                    {CATEGORY_LABELS[c]}
                  </FilterTag>
                ))}
              </FilterRow>

              <FilterRow label="temporada">
                {SEASONS.map((s) => (
                  <FilterTag
                    key={s}
                    active={seasons.includes(s)}
                    onClick={() => toggle("season", s)}
                  >
                    {SEASON_LABELS[s]}
                  </FilterTag>
                ))}
              </FilterRow>

              <FilterRow label="fit">
                {ALL_FITS.map((f) => (
                  <FilterTag
                    key={f}
                    active={fits.includes(f)}
                    onClick={() => toggle("fit", f)}
                  >
                    {FIT_LABELS[f]}
                  </FilterTag>
                ))}
              </FilterRow>

              <FilterRow label="textura">
                {TEXTURES.map((t) => (
                  <FilterTag
                    key={t}
                    active={textures.includes(t)}
                    onClick={() => toggle("tex", t)}
                  >
                    {TEXTURE_LABELS[t]}
                  </FilterTag>
                ))}
              </FilterRow>

              {hasFilters && (
                <button
                  type="button"
                  onClick={() => router.replace(pathname, { scroll: false })}
                  className="self-start font-serif italic text-sm text-foreground-secondary hover:text-foreground"
                >
                  {UI.buttons.clearFilters}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 && !hasFilters ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
          <AddGarmentCard />
        </div>
      ) : filtered.length === 0 ? (
        <p className="font-serif italic text-foreground-secondary text-center py-16">
          {UI.grid.noResults}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
          <AddGarmentCard />
          {filtered.map((garment, i) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              index={i}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {selected && (
        <GarmentModal garment={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
