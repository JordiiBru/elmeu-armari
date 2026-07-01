"use client";

import { TEMPORADAS } from "@/lib/prendas/types";
import { TEMPORADA_LABELS } from "@/lib/prendas/labels";

interface Props {
  defaultValues?: string[];
}

export function TemporadaCheckboxes({ defaultValues = [] }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {TEMPORADAS.map((t) => (
        <label key={t} className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="temporada"
            value={t}
            defaultChecked={defaultValues.includes(t)}
            className="rounded"
          />
          {TEMPORADA_LABELS[t]}
        </label>
      ))}
    </div>
  );
}
