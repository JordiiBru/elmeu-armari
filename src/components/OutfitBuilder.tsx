"use client";

import { useState } from "react";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import type { SanzoPalette, OutfitResult } from "@/lib/outfits/types";
import { generateOutfits } from "@/lib/outfits/engine";
import { SEASON_LABELS, CATEGORY_LABELS } from "@/lib/prendas/labels";
import { saveOutfitAction } from "@/app/outfits/actions";
import { OutfitCard } from "./OutfitCard";

const SEASONS: Season[] = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];
const PAGE_SIZE = 10;

function filterBySeason(garments: GarmentWithColors[], season: Season): GarmentWithColors[] {
  return garments.filter((g) =>
    g.seasons.some((s) => s.season === season || s.season === "ALL_YEAR")
  );
}

export function OutfitBuilder({
  garments,
  palettes,
}: {
  garments: GarmentWithColors[];
  palettes: SanzoPalette[];
}) {
  const [season, setSeason] = useState<Season>("SUMMER");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<OutfitResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const filtered = filterBySeason(garments, season);
  const selected = filtered.filter((g) => !excluded.has(g.id));

  const toggleGarment = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generate = () => {
    setLoading(true);
    setGenerated(true);
    setSavedIds(new Set());
    setTimeout(() => {
      const { results: r, hasMore: hm } = generateOutfits(selected, palettes, PAGE_SIZE, 0);
      setResults(r);
      setHasMore(hm);
      setLoading(false);
    }, 0);
  };

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      const { results: r, hasMore: hm } = generateOutfits(
        selected,
        palettes,
        PAGE_SIZE,
        results.length
      );
      setResults((prev) => [...prev, ...r]);
      setHasMore(hm);
      setLoading(false);
    }, 0);
  };

  const handleSave = async (result: OutfitResult) => {
    const garmentIds = result.matches.map((m) => m.garment.id);
    const key = [...garmentIds].sort().join(",") + "|" + result.palette.id;
    await saveOutfitAction(result.palette.id, garmentIds);
    setSavedIds((prev) => new Set(prev).add(key));
  };

  const getResultKey = (result: OutfitResult) =>
    result.matches
      .map((m) => m.garment.id)
      .sort()
      .join(",") + "|" + result.palette.id;

  return (
    <div className="space-y-6">
      {/* Season selector */}
      <div>
        <p className="text-sm font-medium mb-2">Temporada</p>
        <div className="flex gap-2 flex-wrap">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSeason(s);
                setGenerated(false);
                setResults([]);
              }}
              className={`text-sm px-3 py-1.5 border rounded transition-colors ${
                season === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "hover:bg-gray-50"
              }`}
            >
              {SEASON_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Garment selection */}
      <div>
        <p className="text-sm font-medium mb-2">
          Peces disponibles ({selected.length}/{filtered.length})
        </p>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hi ha peces per a aquesta temporada.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-2 text-sm border rounded p-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={!excluded.has(g.id)}
                  onChange={() => toggleGarment(g.id)}
                  className="rounded"
                />
                <span className="flex items-center gap-1.5">
                  {g.colors[0] && (
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: g.colors[0].hex }}
                    />
                  )}
                  <span>{CATEGORY_LABELS[g.category]}</span>
                  {g.notes && (
                    <span className="text-gray-400 truncate max-w-[120px]">
                      — {g.notes}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || selected.length < 2}
        className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        Genera combinacions
      </button>

      {/* Results */}
      {generated && !loading && results.length === 0 && (
        <p className="text-sm text-gray-500">
          Cap combinacio trobada amb aquestes peces. Prova ampliant la seleccio.
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium">Resultats</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((result, i) => (
              <OutfitCard
                key={`${getResultKey(result)}-${i}`}
                result={result}
                onSave={() => handleSave(result)}
                saved={savedIds.has(getResultKey(result))}
              />
            ))}
          </div>

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border rounded p-4 animate-pulse bg-gray-50 h-32"
                />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <button
              onClick={loadMore}
              className="w-full text-sm px-4 py-2 border rounded hover:bg-gray-50"
            >
              Mostra mes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
