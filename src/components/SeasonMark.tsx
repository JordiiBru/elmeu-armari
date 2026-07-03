"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  SEASONS,
  applySeasonToDom,
  getSeasonSnapshot,
  getServerSeasonSnapshot,
  parseSeason,
  subscribeSeason,
} from "@/lib/season";

/**
 * Marca tipografica d'estacio — cantonada inferior dreta, rotada 90°.
 * Estil de numero d'edicio de revista japonesa (Shiseido / Popeye / An·An 90s).
 * Nomes visible quan hi ha estacio triada. Ni caixa, ni fons, ni animacio.
 */

const KANJI: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

export default function SeasonMark() {
  const raw = useSyncExternalStore(
    subscribeSeason,
    getSeasonSnapshot,
    getServerSeasonSnapshot,
  );
  const current = parseSeason(raw);

  useEffect(() => {
    applySeasonToDom(current);
  }, [current]);

  if (!current) return null;
  const meta = SEASONS.find((s) => s.id === current);
  if (!meta) return null;

  return (
    <div
      aria-hidden
      className="fixed right-4 md:right-6 bottom-8 md:bottom-12 pointer-events-none select-none"
      style={{
        writingMode: "vertical-rl",
        color: "var(--accent)",
      }}
    >
      <span className="font-serif text-[10px] tracking-[0.4em] uppercase">
        — {meta.label}
      </span>
      <span className="font-serif ml-1 text-[13px]" style={{ letterSpacing: 0 }}>
        {KANJI[current]}
      </span>
    </div>
  );
}
