"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";

/**
 * The three language flags, drawn rather than typed.
 *
 * Not emoji: flag emoji do not render as flags on Windows at all — they
 * fall back to two letters — and `Icon`'s contract is that the set never
 * uses Unicode glyphs. They live here and not in `Icon` because that
 * component is stroke-only, `currentColor`, never filled and never
 * coloured; a flag that is not its own colours is not a flag, and bending
 * the primitive to hold three exceptions costs more than a sibling one.
 *
 * Catalan gets the Senyera. There is no country flag for a language, so
 * this is the choice made deliberately rather than by default.
 *
 * A flag has no accessible text, so every one of these carries a title.
 */
export function Flag({ locale, label, size = 18 }: { locale: Locale; label: string; size?: number }) {
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 60 40"
      width={size}
      height={(size * 2) / 3}
      role="img"
      aria-label={label}
      className="block shrink-0"
    >
      {locale === "ca" && <Senyera />}
      {locale === "es" && <Spain />}
      {locale === "en" && <UnionJack clipId={clipId} />}
      {/* A hairline so a pale stripe still has an edge on a light ground. */}
      <rect
        x="0.5"
        y="0.5"
        width="59"
        height="39"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
      />
    </svg>
  );
}

/** Nine horizontal bars: five gold, four red. */
function Senyera() {
  return (
    <>
      <rect width="60" height="40" fill="#FCDD09" />
      {[1, 3, 5, 7].map((i) => (
        <rect key={i} y={(i * 40) / 9} width="60" height={40 / 9} fill="#DA121A" />
      ))}
    </>
  );
}

/** The civil flag: red, gold, red at 1:2:1, without the coat of arms —
 * at 18px the arms are a smudge. */
function Spain() {
  return (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </>
  );
}

/** Drawn at 3:2 rather than the official 2:1 so the three sit in one row
 * at the same size. */
function UnionJack({ clipId }: { clipId: string }) {
  return (
    <>
      <clipPath id={clipId}>
        <path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" />
      </clipPath>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      <path
        d="M0,0 L60,40 M60,0 L0,40"
        clipPath={`url(#${clipId})`}
        stroke="#C8102E"
        strokeWidth="5"
      />
      <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="13" />
      <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="8" />
    </>
  );
}
