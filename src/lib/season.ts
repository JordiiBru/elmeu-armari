"use client";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: {
  id: Season;
  label: string;
  swatch: string;
}[] = [
  { id: "spring", label: "primavera", swatch: "#f2a29a" },
  { id: "summer", label: "estiu", swatch: "#a9bcc9" },
  { id: "autumn", label: "tardor", swatch: "#b76e4a" },
  { id: "winter", label: "hivern", swatch: "#2a3b5c" },
];

const STORAGE_KEY = "armari.season";

const listeners = new Set<() => void>();

export function parseSeason(raw: string | null): Season | null {
  if (raw && ["spring", "summer", "autumn", "winter"].includes(raw)) {
    return raw as Season;
  }
  return null;
}

export function subscribeSeason(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSeasonSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function getServerSeasonSnapshot(): string {
  return "";
}

export function setSeason(id: Season) {
  window.localStorage.setItem(STORAGE_KEY, id);
  document.documentElement.dataset.season = id;
  listeners.forEach((l) => l());
}

export function applySeasonToDom(season: Season | null) {
  if (season) document.documentElement.dataset.season = season;
  else delete document.documentElement.dataset.season;
}
