"use client";

import { useState } from "react";

type ColorEntry = {
  index: number;
  name: string;
  hex: string;
  combinations: number;
};

type PaletteEntry = {
  id: number;
  nombre: string;
  colors: { hex: string; name: string | null }[];
};

const TABS = [
  { id: "colors", label: "Colors" },
  { id: "combinacions", label: "Combinacions" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PaletaTabs({
  colors,
  palettes,
  colorCount,
  paletteCount,
}: {
  colors: ColorEntry[];
  palettes: PaletteEntry[];
  colorCount: number;
  paletteCount: number;
}) {
  const [tab, setTab] = useState<TabId>("colors");

  return (
    <div className="flex flex-col gap-10">
      <nav className="flex items-center gap-8 border-b border-border pb-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="group relative font-serif text-base outline-none active:scale-[0.98]"
              aria-current={active}
            >
              <span
                className={
                  active
                    ? "text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }
              >
                {t.label}
              </span>
              <span className="ml-2 text-[10px] tracking-widest text-foreground-secondary align-super tabular-nums">
                {t.id === "colors" ? colorCount : paletteCount}
              </span>
              <span
                aria-hidden
                className={`pointer-events-none absolute left-0 -bottom-[13px] h-px bg-foreground transition-all duration-500 ease-out ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {tab === "colors" ? (
        <ColorsGrid colors={colors} />
      ) : (
        <CombinationsGrid palettes={palettes} />
      )}
    </div>
  );
}

function ColorsGrid({ colors }: { colors: ColorEntry[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
      {colors.map((c) => (
        <article key={c.index} className="group flex flex-col">
          <div
            className="aspect-square w-full transition-transform duration-500 ease-out group-hover:-translate-y-1"
            style={{ backgroundColor: c.hex }}
          />
          <div className="flex items-baseline justify-between pt-3">
            <span className="font-serif text-base leading-tight">{c.name}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
              n{String(c.index).padStart(3, "0")}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="font-mono text-xs text-foreground-secondary">
              {c.hex.toUpperCase()}
            </span>
            {c.combinations > 0 && (
              <span className="font-serif italic text-xs text-foreground-secondary">
                {c.combinations}{" "}
                {c.combinations === 1 ? "combinació" : "combinacions"}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function CombinationsGrid({ palettes }: { palettes: PaletteEntry[] }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {palettes.map((p) => (
        <PaletteRow key={p.id} palette={p} />
      ))}
    </div>
  );
}

function PaletteRow({ palette }: { palette: PaletteEntry }) {
  return (
    <article className="group flex flex-col gap-4 py-10 md:py-12">
      {/* Numero editorial */}
      <div className="flex items-baseline justify-end">
        <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary tabular-nums">
          n{String(palette.id).padStart(3, "0")}
        </span>
      </div>

      {/* Mostres altes com un mostrari textil */}
      <div className="flex w-full h-40 md:h-56 transition-transform duration-500 ease-out group-hover:-translate-y-1">
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: c.hex }}
            title={c.name ?? c.hex}
          />
        ))}
      </div>

      {/* Un peu per cada color */}
      <div className="flex w-full">
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col gap-0.5 pr-4"
          >
            <span className="font-serif text-sm md:text-base leading-tight text-foreground">
              {c.name ?? "sense nom"}
            </span>
            <span className="font-mono text-[11px] text-foreground-secondary">
              {c.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
