"use client";

import { useState } from "react";

interface Props {
  initialColors?: string[];
}

export function ColorPickers({ initialColors }: Props) {
  const [colors, setColors] = useState<string[]>(
    initialColors && initialColors.length > 0 ? initialColors : ["#000000"]
  );

  return (
    <div className="space-y-2">
      {colors.map((color, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            name="color"
            value={color}
            onChange={(e) =>
              setColors((prev) => prev.map((c, j) => (j === i ? e.target.value : c)))
            }
            className="h-9 w-16 cursor-pointer rounded border border-gray-300"
          />
          <span className="text-sm font-mono text-gray-600">{color}</span>
          {colors.length > 1 && (
            <button
              type="button"
              onClick={() => setColors((prev) => prev.filter((_, j) => j !== i))}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Eliminar
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setColors((prev) => [...prev, "#000000"])}
        className="px-2.5 py-1 text-sm border rounded hover:bg-gray-50"
      >
        + Afegir color
      </button>
    </div>
  );
}
