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
    <div className="w-full flex flex-col items-center gap-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-secondary">
        esculli l&apos;estació
      </p>
      <div className="flex items-start gap-10 md:gap-14">
        {SEASONS.map((s) => {
          const active = current === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeason(s.id)}
              className="group flex flex-col items-center gap-3 outline-none"
              aria-pressed={active}
            >
              <span
                aria-hidden
                className="block h-3 w-3 rounded-full border transition-[background-color,border-color,transform] duration-500 ease-out group-hover:scale-[1.15]"
                style={{
                  backgroundColor: active ? s.swatch : "transparent",
                  borderColor: active ? s.swatch : "var(--border)",
                }}
              />
              <span
                className={`font-serif text-sm transition-colors duration-500 ${
                  active
                    ? "text-foreground"
                    : "text-foreground-secondary group-hover:text-foreground"
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
