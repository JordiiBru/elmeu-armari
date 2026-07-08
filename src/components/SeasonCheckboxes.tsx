"use client";

import { useState } from "react";
import { SEASONS } from "@/lib/prendas/types";
import { SEASON_LABELS } from "@/lib/prendas/labels";
import type { Season } from "@/lib/prendas/types";
import { Checkbox } from "@/components/ui";

interface Props {
  defaultValues?: Season[];
}

export function SeasonCheckboxes({ defaultValues = [] }: Props) {
  const [selected, setSelected] = useState<Set<Season>>(new Set(defaultValues));

  function toggle(s: Season) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {SEASONS.map((s) => (
        <Checkbox
          key={s}
          name="season"
          value={s}
          checked={selected.has(s)}
          onChange={() => toggle(s)}
          label={SEASON_LABELS[s]}
        />
      ))}
    </div>
  );
}
