"use client";

import { useState } from "react";

interface Props {
  initialColors?: string[];
}

export function ColorPickers({ initialColors }: Props) {
  const [colors, setColors] = useState<string[]>(
    initialColors && initialColors.length > 0 ? initialColors : ["#000000"],
  );

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
          {colors.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setColors((prev) => prev.filter((_, j) => j !== i))
              }
              className="ml-auto type-caption hover:text-text-primary transition-colors active:scale-95"
            >
              eliminar
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setColors((prev) => [...prev, "#000000"])}
        className="group relative self-start font-serif italic text-sm text-text-secondary hover:text-text-primary transition-colors mt-1 active:scale-[0.98]"
      >
        <span>+ afegir color</span>
      </button>
    </div>
  );
}
