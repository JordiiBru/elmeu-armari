import type { SVGProps, ReactElement } from "react";

export type IconName =
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "arrow-right"
  | "plus"
  | "close"
  | "check"
  | "star"
  | "sparkle"
  | "ellipsis"
  | "sun"
  | "moon";

interface Props extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: IconName;
  size?: number;
}

/**
 * Editorial icon set. Stroke 1.25, currentColor, square viewBox,
 * `round` caps and joins so hairlines terminate cleanly next to
 * italic serif type. Never fills. Never coloured.
 *
 * The whole app draws from this component — never Unicode glyphs,
 * never emojis, never mixed weights.
 */
export function Icon({ name, size = 16, className, ...rest }: Props) {
  const path = PATHS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      className={className}
      {...rest}
    >
      {path}
    </svg>
  );
}

const PATHS: Record<IconName, ReactElement> = {
  "chevron-down": <polyline points="6 9 12 15 18 9" />,
  "chevron-left": <polyline points="15 6 9 12 15 18" />,
  "chevron-right": <polyline points="9 6 15 12 9 18" />,
  "arrow-right": (
    <>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  check: <polyline points="4 12 10 18 20 6" />,
  star: (
    <polygon points="12 3 14.7 9.2 21.5 9.9 16.4 14.5 17.8 21.2 12 17.8 6.2 21.2 7.6 14.5 2.5 9.9 9.3 9.2" />
  ),
  // Two four-pointed stars: the shape that has come to mean "the machine
  // chose this". Here it is honest about being a weighted shuffle, not a
  // model — but the gesture is the one people already read.
  sparkle: (
    <>
      <polygon points="10 4 11.3 11.2 18.5 12.5 11.3 13.8 10 21 8.7 13.8 1.5 12.5 8.7 11.2" />
      <polygon points="18.5 3 19 5.2 21.2 5.7 19 6.2 18.5 8.4 18 6.2 15.8 5.7 18 5.2" />
    </>
  ),
  // The way into everything that is about the app rather than in it.
  // Deliberately not a gear and not a hamburger: one reads as SaaS
  // settings, the other as primary navigation, and this is neither.
  ellipsis: (
    <>
      <circle cx="5" cy="12" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
      <circle cx="19" cy="12" r="1.1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.6" y2="6.6" />
      <line x1="17.4" y1="17.4" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.6" y2="17.4" />
      <line x1="17.4" y1="6.6" x2="19.1" y2="4.9" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />,
};
