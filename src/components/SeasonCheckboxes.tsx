"use client";

import { SEASONS } from "@/lib/prendas/types";
import { SEASON_LABELS } from "@/lib/prendas/labels";
import type { Season } from "@/lib/prendas/types";

interface Props {
  defaultValues?: Season[];
}

export function SeasonCheckboxes({ defaultValues = [] }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {SEASONS.map((s) => (
        <label key={s} className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="season"
            value={s}
            defaultChecked={defaultValues.includes(s)}
            className="rounded"
          />
          {SEASON_LABELS[s]}
        </label>
      ))}
    </div>
  );
}
