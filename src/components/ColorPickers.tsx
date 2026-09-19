"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { anchorFor } from "@/lib/outfits/engine";

// Where the native picker opens. Any pick that differs from it fires a
// change, so it is a mid grey rather than black or white, the two colours
// a garment is most often.
const PICKER_START = "#808080";

interface Props {
  initialColors?: string[];
  /** Called with the whole list after every change the person makes. */
  onChange?: (colors: string[]) => void;
  /** Shown under the list, e.g. where the colours came from. */
  note?: string;
}

export function ColorPickers({ initialColors, onChange, note }: Props) {
  const t = useTranslations("form");
  // Empty means empty: a default swatch would be saved as a colour the
  // person never chose (a garment silently black).
  const [colors, setColorsState] = useState<string[]>(initialColors ?? []);
  function setColors(update: (prev: string[]) => string[]) {
    const next = update(colors);
    setColorsState(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {colors.map((color, i) => (
        <div key={i} className="flex items-center gap-3">
          <label
            className="relative h-10 w-14 cursor-pointer overflow-hidden border border-border transition-colors hover:border-text-primary"
            style={{ backgroundColor: color }}
          >
            <input
              type="color"
              name="color"
              value={color}
              onChange={(e) =>
                setColors((prev) =>
                  prev.map((c, j) => (j === i ? e.target.value : c)),
                )
              }
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <span className="font-mono text-xs text-text-secondary tabular-nums">
            {color.toUpperCase()}
          </span>
          {/* The engine's own snap, so the name is the one the app will
              use for this piece. Sanzo Wada names stay English. */}
          <span className="type-caption truncate">{anchorFor(color)?.canonical.name}</span>
          <button
            type="button"
            onClick={() => setColors((prev) => prev.filter((_, j) => j !== i))}
            className="ml-auto type-caption hover:text-text-primary transition-colors active:scale-95"
          >
            {t("removeColor")}
          </button>
        </div>
      ))}
      {note && colors.length > 0 && <span className="type-caption">{note}</span>}
      {colors.length === 0 && (
        <span className="type-caption">{t("noColorYet")}</span>
      )}
      {/* The add button is the picker itself: a colour exists only once
          one has been picked, never as a placeholder to forget about. The
          value is remounted after each pick so the next one starts fresh. */}
      <label className="relative self-start font-serif italic text-sm text-text-secondary hover:text-text-primary transition-colors mt-1 cursor-pointer active:scale-[0.98]">
        <span>{t("addColor")}</span>
        <input
          key={colors.length}
          type="color"
          defaultValue={PICKER_START}
          onChange={(e) => setColors((prev) => [...prev, e.target.value])}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}
