"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { PrendaModal } from "@/components/PrendaModal";
import type { PrendaConColores, Categoria, Fit, Textura } from "@/lib/prendas/types";
import { CATEGORIAS, TEMPORADAS, FITS, TEXTURAS } from "@/lib/prendas/types";
import {
  CATEGORIA_LABELS,
  TEMPORADA_LABELS,
  FIT_LABELS,
  TEXTURA_LABELS,
} from "@/lib/prendas/labels";

interface Props {
  prendas: PrendaConColores[];
}

const pill = (active: boolean) =>
  `px-3 py-1 text-xs border rounded-full transition-colors cursor-pointer ${
    active
      ? "bg-black text-white border-black"
      : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
  }`;

export function ArmariGrid({ prendas }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<PrendaConColores | null>(null);

  const cats = searchParams.getAll("cat") as Categoria[];
  const temps = searchParams.getAll("temp");
  const fits = searchParams.getAll("fit") as Fit[];
  const texs = searchParams.getAll("tex") as Textura[];
  const q = searchParams.get("q") ?? "";

  const hasFilters =
    cats.length > 0 || temps.length > 0 || fits.length > 0 || texs.length > 0 || q !== "";

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

  function setSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return prendas.filter((p) => {
      if (cats.length > 0 && !cats.includes(p.categoria)) return false;
      if (fits.length > 0 && !fits.includes(p.fit)) return false;
      if (texs.length > 0 && !texs.includes(p.textura)) return false;
      if (temps.length > 0) {
        try {
          const pTemps = JSON.parse(p.temporada) as string[];
          if (!temps.some((t) => pTemps.includes(t))) return false;
        } catch {
          return false;
        }
      }
      if (query) {
        const inNota = p.nota?.toLowerCase().includes(query) ?? false;
        const inTalla = p.talla.toLowerCase().includes(query);
        if (!inNota && !inTalla) return false;
      }
      return true;
    });
  }, [prendas, cats, temps, fits, texs, q]);

  return (
    <>
      <div className="space-y-3 mb-6">
        <input
          type="search"
          value={q}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per talla o nota..."
          className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-black"
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((cat) => (
            <button type="button" key={cat} onClick={() => toggle("cat", cat)} className={pill(cats.includes(cat))}>
              {CATEGORIA_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TEMPORADAS.map((t) => (
            <button type="button" key={t} onClick={() => toggle("temp", t)} className={pill(temps.includes(t))}>
              {TEMPORADA_LABELS[t]}
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
          {TEXTURAS.map((t) => (
            <button type="button" key={t} onClick={() => toggle("tex", t)} className={pill(texs.includes(t))}>
              {TEXTURA_LABELS[t]}
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
              {filtered.length} de {prendas.length} peces
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">Cap peça amb aquests filtres.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((prenda) => (
            <button
              type="button"
              key={prenda.id}
              onClick={() => setSelected(prenda)}
              className="rounded-lg border overflow-hidden flex flex-col text-left hover:shadow-md transition-shadow"
            >
              <div className="flex h-24 w-full">
                {prenda.colores.map((c) => (
                  <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
                ))}
              </div>
              <div className="p-2 flex flex-col gap-0.5 bg-white w-full">
                <span className="text-xs font-medium">{CATEGORIA_LABELS[prenda.categoria]}</span>
                <span className="text-xs text-gray-500">{prenda.fit} · {prenda.talla}</span>
                {prenda.nota && (
                  <span className="text-xs text-gray-400 truncate">{prenda.nota}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <PrendaModal prenda={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
