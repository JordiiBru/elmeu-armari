"use client";

import { useMemo, useState } from "react";
import PaletteSheet from "@/components/PaletteSheet";

type ColorEntry = {
  index: number;
  name: string;
  hex: string;
  combinations: number[];
};

type Palette = {
  id: number;
  colors: { hex: string; name: string | null }[];
};

export default function PaletaBrowser({
  colors,
  palettesById,
}: {
  colors: ColorEntry[];
  palettesById: Record<number, Palette>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ColorEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter(
      (c) => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q),
    );
  }, [colors, query]);

  return (
    <>
      <div className="mb-10">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search a color — english (pink, ochre, cerulian…)"
          className="w-full bg-transparent border-0 border-b border-border pb-2 text-sm placeholder:text-foreground-secondary placeholder:italic placeholder:font-serif focus:outline-none focus:border-foreground transition-colors"
        />
        <div className="flex items-baseline justify-between pt-2">
          <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary tabular-nums">
            {filtered.length} / {colors.length} colors
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-serif italic text-foreground-secondary text-center py-16">
          cap color coincideix.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((c) => (
            <button
              key={c.index}
              type="button"
              onClick={() => setSelected(c)}
              className="cv-auto group flex flex-col text-left outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <div
                className="aspect-square w-full transition-transform duration-500 ease-out group-hover:-translate-y-1 group-active:translate-y-0 group-active:scale-[0.98]"
                style={{ backgroundColor: c.hex }}
              />
              <div className="flex items-baseline justify-between pt-3">
                <span className="font-serif text-base leading-tight">
                  {c.name}
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
                  n{String(c.index).padStart(3, "0")}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="font-mono text-xs text-foreground-secondary">
                  {c.hex.toUpperCase()}
                </span>
                {c.combinations.length > 0 && (
                  <span className="font-serif italic text-xs text-foreground-secondary">
                    {c.combinations.length}{" "}
                    {c.combinations.length === 1 ? "combinació" : "combinacions"}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <PaletteSheet
          color={selected}
          palettes={selected.combinations
            .map((id) => palettesById[id])
            .filter(Boolean)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
