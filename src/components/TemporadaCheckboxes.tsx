"use client";

import { TEMPORADAS } from "@/lib/prendas/types";

const LABELS: Record<string, string> = {
  PRIMAVERA: "Primavera",
  VERANO: "Estiu",
  OTONO: "Tardor",
  INVIERNO: "Hivern",
  TODO_EL_ANIO: "Tot l'any",
};

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
          {LABELS[t]}
        </label>
      ))}
    </div>
  );
}
