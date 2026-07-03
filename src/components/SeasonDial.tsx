"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Season = "spring" | "summer" | "autumn" | "winter";

type SeasonMeta = {
  id: Season;
  label: string;
  swatch: string;
  /** Angle en graus del centre del quadrant (0 = dalt) */
  angle: number;
};

// Ordre natural de l'any: Primavera dalt, Estiu dreta, Tardor baix, Hivern esquerra.
const SEASONS: SeasonMeta[] = [
  { id: "spring", label: "Primavera", swatch: "#f2a29a", angle: 0 },
  { id: "summer", label: "Estiu", swatch: "#a9bcc9", angle: 90 },
  { id: "autumn", label: "Tardor", swatch: "#b76e4a", angle: 180 },
  { id: "winter", label: "Hivern", swatch: "#2a3b5c", angle: 270 },
];

const STORAGE_KEY = "armari.season";

function parse(raw: string | null): Season | null {
  if (raw && ["spring", "summer", "autumn", "winter"].includes(raw)) {
    return raw as Season;
  }
  return null;
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
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
function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}
function getServerSnapshot(): string {
  return "";
}

export default function SeasonDial() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const season = parse(raw);
  const touched = raw !== "";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (season) document.documentElement.dataset.season = season;
    else delete document.documentElement.dataset.season;
  }, [season]);

  // Tanca al clicar fora o amb Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: Season) {
    window.localStorage.setItem(STORAGE_KEY, id);
    listeners.forEach((l) => l());
    setOpen(false);
  }

  const currentMeta = season ? SEASONS.find((s) => s.id === season) : null;
  const showHalo = !touched;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          currentMeta ? `Estació: ${currentMeta.label}` : "Tria una estació"
        }
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-10 w-10 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        {showHalo && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-border animate-[armari-halo_3s_ease-in-out_infinite]"
          />
        )}
        <span
          aria-hidden
          className="h-3 w-3 rounded-full border transition-colors duration-500"
          style={{
            backgroundColor: currentMeta ? currentMeta.swatch : "transparent",
            borderColor: currentMeta ? currentMeta.swatch : "var(--border)",
          }}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Selector d'estació"
          className="absolute right-0 mt-3 z-50 flex flex-col items-center gap-4 rounded p-5 bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(0,0,0,0.12)]"
          style={{ minWidth: 200 }}
        >
          <Dial season={season} onPick={pick} />
          <p className="text-[11px] tracking-wide uppercase text-foreground-secondary">
            {currentMeta ? currentMeta.label : "Tria una estació"}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes armari-halo {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function Dial({
  season,
  onPick,
}: {
  season: Season | null;
  onPick: (s: Season) => void;
}) {
  const size = 128;
  const r = size / 2;
  const hole = 32; // buit central

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {SEASONS.map((s, i) => {
          const start = i * 90 - 45; // primavera centrada a 0 (dalt)
          const end = start + 90;
          const active = season === s.id;
          return (
            <path
              key={s.id}
              d={sectorPath(r, r, r - 4, hole, start, end)}
              fill={active ? s.swatch : "var(--background-secondary)"}
              stroke="var(--card)"
              strokeWidth={2}
              className="cursor-pointer transition-[fill] duration-500"
              onClick={() => onPick(s.id)}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as SVGPathElement).style.fill = s.swatch;
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as SVGPathElement).style.fill =
                    "var(--background-secondary)";
              }}
            >
              <title>{s.label}</title>
            </path>
          );
        })}
        {/* buit central net */}
        <circle cx={r} cy={r} r={hole} fill="var(--card)" />
      </svg>
    </div>
  );
}

/**
 * Path d'un sector anular (donut slice).
 * Angles en graus, 0 = dalt (12 en punt), sentit horari.
 */
function sectorPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const large = endDeg - startDeg > 180 ? 1 : 0;

  const x1 = cx + rOuter * Math.cos(toRad(startDeg));
  const y1 = cy + rOuter * Math.sin(toRad(startDeg));
  const x2 = cx + rOuter * Math.cos(toRad(endDeg));
  const y2 = cy + rOuter * Math.sin(toRad(endDeg));

  const x3 = cx + rInner * Math.cos(toRad(endDeg));
  const y3 = cy + rInner * Math.sin(toRad(endDeg));
  const x4 = cx + rInner * Math.cos(toRad(startDeg));
  const y4 = cy + rInner * Math.sin(toRad(startDeg));

  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}
