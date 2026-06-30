"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ColorPickers() {
  const [colors, setColors] = useState<string[]>(["#000000"]);

  function addColor() {
    setColors((prev) => [...prev, "#000000"]);
  }

  function removeColor(index: number) {
    setColors((prev) => prev.filter((_, i) => i !== index));
  }

  function updateColor(index: number, value: string) {
    setColors((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  return (
    <div className="space-y-2">
      {colors.map((color, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            name="color"
            value={color}
            onChange={(e) => updateColor(i, e.target.value)}
            className="h-9 w-16 cursor-pointer rounded border border-gray-300"
          />
          <span className="text-sm font-mono text-gray-600">{color}</span>
          {colors.length > 1 && (
            <button
              type="button"
              onClick={() => removeColor(i)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Eliminar
            </button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addColor}>
        + Afegir color
      </Button>
    </div>
  );
}
