"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  SEASONS,
  applySeasonToDom,
  getSeasonSnapshot,
  getServerSeasonSnapshot,
  parseSeason,
  setSeason,
  subscribeSeason,
} from "@/lib/season";

export default function SeasonSelector() {
  const raw = useSyncExternalStore(
    subscribeSeason,
    getSeasonSnapshot,
    getServerSeasonSnapshot,
  );
  const current = parseSeason(raw);

  useEffect(() => {
    applySeasonToDom(current);
  }, [current]);

  return (
    <div className="flex items-center gap-5 text-[11px] tracking-[0.15em] text-foreground-secondary">
      {SEASONS.map((s) => {
        const active = current === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setSeason(s.id)}
            className="group inline-flex items-center gap-1.5 outline-none"
            aria-pressed={active}
          >
            <span
              aria-hidden
              className="block h-1.5 w-1.5 rounded-full border transition-[background-color,border-color,transform] duration-500 ease-out group-hover:scale-125"
              style={{
                backgroundColor: active ? s.swatch : "transparent",
                borderColor: active ? s.swatch : "var(--border)",
              }}
            />
            <span
              className={`transition-colors duration-500 ${
                active
                  ? "text-foreground"
                  : "group-hover:text-foreground"
              }`}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
