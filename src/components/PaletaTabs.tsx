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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
      {palettes.map((p) => (
        <article key={p.id} className="group flex flex-col">
          <div className="flex h-24 w-full transition-transform duration-500 ease-out group-hover:-translate-y-1">
            {p.colors.map((c, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: c.hex }}
                title={c.name ?? c.hex}
              />
            ))}
          </div>
          <div className="flex items-baseline justify-between pt-3">
            <span className="font-serif text-base leading-tight text-foreground">
              {p.colors
                .map((c) => c.name)
                .filter((n): n is string => Boolean(n))
                .join(" · ") || "sense nom"}
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
              n{String(p.id).padStart(3, "0")}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {p.colors.map((c, i) => (
              <span
                key={i}
                className="font-mono text-[11px] text-foreground-secondary"
              >
                {c.hex.toUpperCase()}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
