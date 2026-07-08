import type { SVGProps, ReactElement } from "react";

export type IconName =
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "arrow-right"
  | "plus"
  | "close"
  | "check";

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
};
