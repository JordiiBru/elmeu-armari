"use client";

import { usePathname } from "next/navigation";
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
 * Petit punt de color al costat del wordmark. Nomes apareix fora de la home,
 * indica quina estacio esta activa. No es clicable — per canviar-la,
 * l'usuari torna a la home.
 */
export default function SeasonIndicator() {
  const pathname = usePathname();
  const raw = useSyncExternalStore(
    subscribeSeason,
    getSeasonSnapshot,
    getServerSeasonSnapshot,
  );
  const current = parseSeason(raw);

  useEffect(() => {
    applySeasonToDom(current);
  }, [current]);

  if (pathname === "/") return null;
  if (!current) return null;

  const meta = SEASONS.find((s) => s.id === current);
  if (!meta) return null;

  return (
    <span
      aria-label={`estació activa: ${meta.label}`}
      title={meta.label}
      className="inline-block h-1.5 w-1.5 rounded-full transition-colors duration-500"
      style={{ backgroundColor: meta.swatch }}
    />
  );
}
