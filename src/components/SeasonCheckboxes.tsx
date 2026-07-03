"use client";

import { useState } from "react";
import { SEASONS } from "@/lib/prendas/types";
import { SEASON_LABELS } from "@/lib/prendas/labels";
import type { Season } from "@/lib/prendas/types";

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
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {SEASONS.map((s) => {
        const active = selected.has(s);
        return (
          <label
            key={s}
            className="group inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <input
              type="checkbox"
              name="season"
              value={s}
              checked={active}
              onChange={() => toggle(s)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                active
                  ? "bg-foreground border-foreground"
                  : "bg-transparent border-border group-hover:border-foreground"
              }`}
            />
            <span
              className={`font-serif text-base transition-colors ${
                active ? "text-foreground" : "text-foreground-secondary group-hover:text-foreground"
              }`}
            >
              {SEASON_LABELS[s]}
            </span>
          </label>
        );
      })}
    </div>
  );
}
