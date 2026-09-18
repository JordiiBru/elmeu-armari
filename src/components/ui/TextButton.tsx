"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Tone = "primary" | "secondary" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary hover:text-text-primary",
  // Red at rest, not only on hover: a delete action is exactly the one
  // place this component should not read as quiet — see `Button`'s own
  // danger variant, which was already red by default and left this one
  // as the odd inconsistent pairing next to it.
  danger: "text-danger hover:text-danger/70",
};

const BASE =
  // min-h-11: the visible mark is the text line and its underline, but
  // the tap target is the full 44px row — SegmentedControl's own
  // buttons already carry this, this one never did, and it shows most
  // where two of these now sit pinned side by side in a sheet footer.
  "group relative inline-flex min-h-11 items-center font-serif italic outline-none " +
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] " +
  "active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed " +
  "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Props = ComponentPropsWithoutRef<"button"> & {
  tone?: Tone;
  underline?: boolean;
  children?: ReactNode;
};

/**
 * Editorial italic-link button. The app's canonical "quiet action":
 * "editar", "eliminar", "desar outfit", "→ mostrar més…".
 * Renders as <button>; use a plain anchor for real navigation.
 */
export function TextButton({
  tone = "primary",
  underline = true,
  className,
  children,
  ...rest
}: Props) {
  const classes = [BASE, TONE_CLASS[tone], className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {/* Both the layout and the underline live on this span, not the
          button: a `gap` set on the button only ever saw one flex item
          and an icon beside a label broke onto its own line, and once
          the button grew a 44px tap target the underline needed its own
          anchor too — glued to the button's own box it drifted to the
          bottom of that taller row instead of staying under the text. */}
      <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
        {children}
        {underline && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-current origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[var(--duration-slow)] ease-out will-change-transform"
          />
        )}
      </span>
    </button>
  );
}
