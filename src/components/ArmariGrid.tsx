"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { GarmentModal } from "@/components/GarmentModal";
import { filterGarments } from "@/lib/prendas/filtering";
import type { GarmentWithColors, Category, Fit, Texture } from "@/lib/prendas/types";
import { CATEGORIES, SEASONS, FITS, TEXTURES } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  SEASON_LABELS,
  FIT_LABELS,
  TEXTURE_LABELS,
} from "@/lib/prendas/labels";

interface Props {
  garments: GarmentWithColors[];
}

const pill = (active: boolean) =>
  `px-3 py-1 text-xs border rounded-full transition-colors cursor-pointer ${
    active
      ? "bg-black text-white border-black"
      : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
  }`;

export function ArmariGrid({ garments }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<GarmentWithColors | null>(null);

  const categories = searchParams.getAll("cat") as Category[];
  const seasons = searchParams.getAll("season");
  const fits = searchParams.getAll("fit") as Fit[];
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
      <div className="space-y-3 mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per talla o nota..."
          className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-black"
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button type="button" key={c} onClick={() => toggle("cat", c)} className={pill(categories.includes(c))}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button type="button" key={s} onClick={() => toggle("season", s)} className={pill(seasons.includes(s))}>
              {SEASON_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {FITS.map((f) => (
            <button type="button" key={f} onClick={() => toggle("fit", f)} className={pill(fits.includes(f))}>
              {FIT_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TEXTURES.map((t) => (
            <button type="button" key={t} onClick={() => toggle("tex", t)} className={pill(textures.includes(t))}>
              {TEXTURE_LABELS[t]}
            </button>
          ))}
        </div>

        {hasFilters && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className="text-xs text-gray-500 underline hover:text-black"
            >
              Neteja filtres
            </button>
            <span className="text-xs text-gray-400">
              {filtered.length} de {garments.length} peces
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">Cap peça amb aquests filtres.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((garment) => (
            <button
              type="button"
              key={garment.id}
              onClick={() => setSelected(garment)}
              className="rounded-lg border overflow-hidden flex flex-col text-left hover:shadow-md transition-shadow"
            >
              <div className="flex h-24 w-full">
                {garment.colors.map((c) => (
                  <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
                ))}
              </div>
              <div className="p-2 flex flex-col gap-0.5 bg-white w-full">
                <span className="text-xs font-medium">{CATEGORY_LABELS[garment.category]}</span>
                <span className="text-xs text-gray-500">{garment.fit} · {garment.size}</span>
                {garment.notes && (
                  <span className="text-xs text-gray-400 truncate">{garment.notes}</span>
                )}
              </div>
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
