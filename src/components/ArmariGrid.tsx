"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GarmentCard, AddGarmentCard } from "@/components/GarmentCard";
import { filterGarments } from "@/lib/prendas/filtering";
import type { GarmentWithColors, Category, Texture, Season } from "@/lib/prendas/types";
import { CATEGORIES, SEASONS, ALL_FITS, TEXTURES, ALL_LENGTHS } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  SEASON_LABELS,
  FIT_LABELS,
  TEXTURE_LABELS,
  LENGTH_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import { Input, Icon, EmptyState, TextButton } from "@/components/ui";

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
        className={`type-caption transition-colors ${
          active ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
        }`}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary origin-left transition-transform duration-[var(--duration-base)] ease-out ${
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
      <span className="type-caption pt-0.5">
        {label}
      </span>
      <div className="flex flex-wrap gap-x-5 gap-y-2">{children}</div>
    </div>
  );
}

export function ArmariGrid({ garments }: Props) {
  const initialParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>(
    () => initialParams.getAll("cat") as Category[]
  );
  const [seasons, setSeasons] = useState<Season[]>(
    () => initialParams.getAll("season") as Season[]
  );
  const [fits, setFits] = useState<string[]>(() => initialParams.getAll("fit"));
  const [textures, setTextures] = useState<Texture[]>(
    () => initialParams.getAll("tex") as Texture[]
  );
  const [lengths, setLengths] = useState<string[]>(
    () => initialParams.getAll("len")
  );
  const [query, setQuery] = useState<string>(() => initialParams.get("q") ?? "");

  const hasFilters =
    categories.length > 0 || seasons.length > 0 || fits.length > 0 || textures.length > 0 || lengths.length > 0 || query !== "";

  useEffect(() => {
    const params = new URLSearchParams();
    categories.forEach((c) => params.append("cat", c));
    seasons.forEach((s) => params.append("season", s));
    fits.forEach((f) => params.append("fit", f));
    textures.forEach((t) => params.append("tex", t));
    lengths.forEach((l) => params.append("len", l));
    if (query) params.set("q", query);
    const qs = params.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [categories, seasons, fits, textures, lengths, query]);

  const toggleIn = useCallback(
    <T extends string>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) => {
      setter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    setCategories([]);
    setSeasons([]);
    setFits([]);
    setTextures([]);
    setLengths([]);
    setQuery("");
  }, []);

  const filtered = useMemo(
    () => filterGarments(garments, { categories, seasons, fits, textures, lengths, query }),
    [garments, categories, seasons, fits, textures, lengths, query]
  );

  const activeCount =
    categories.length + seasons.length + fits.length + textures.length + lengths.length + (query ? 1 : 0);

  return (
    <>
      <div className="flex flex-col gap-3 mb-6">
        {/* Trigger de filtres */}
        <div className="flex items-baseline justify-between">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="group inline-flex items-baseline gap-3 type-caption hover:text-text-primary transition-colors"
            aria-expanded={filtersOpen}
          >
            <span>filtres</span>
            {activeCount > 0 && (
              <span className="type-caption-strong tabular-nums">
                {activeCount}
              </span>
            )}
            <span
              className={`inline-flex transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] ${
                filtersOpen ? "rotate-180" : ""
              }`}
            >
              <Icon name="chevron-down" size={12} />
            </span>
          </button>
          <span className="type-caption tabular-nums">
            {filtered.length} / {garments.length}
          </span>
        </div>

        {/* Panell col·lapsable */}
        <div className="collapse-panel" data-open={filtersOpen}>
          <div>
            <div className="flex flex-col gap-5 pt-4 pb-2">
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cerca per talla o nota"
              />

              <FilterRow label="categoria">
                {CATEGORIES.map((c) => (
                  <FilterTag
                    key={c}
                    active={categories.includes(c)}
                    onClick={() => toggleIn(setCategories, c)}
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
                    onClick={() => toggleIn(setSeasons, s)}
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
                    onClick={() => toggleIn(setFits, f)}
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
                    onClick={() => toggleIn(setTextures, t)}
                  >
                    {TEXTURE_LABELS[t]}
                  </FilterTag>
                ))}
              </FilterRow>

              <FilterRow label="llargada">
                {ALL_LENGTHS.map((l) => (
                  <FilterTag
                    key={l}
                    active={lengths.includes(l)}
                    onClick={() => toggleIn(setLengths, l)}
                  >
                    {LENGTH_LABELS[l]}
                  </FilterTag>
                ))}
              </FilterRow>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="self-start font-serif italic text-sm text-text-secondary hover:text-text-primary"
                >
                  {UI.buttons.clearFilters}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 && !hasFilters ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
          <AddGarmentCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={UI.grid.noResults}
          hint="prova a retirar algun filtre."
          action={
            hasFilters && (
              <TextButton type="button" onClick={clearAll} tone="secondary">
                netejar filtres
              </TextButton>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
          <AddGarmentCard />
          {filtered.map((garment, i) => (
            <GarmentCard key={garment.id} garment={garment} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
