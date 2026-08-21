"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Tone = "primary" | "secondary" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary hover:text-text-primary",
  danger: "text-text-secondary hover:text-danger",
};

const BASE =
  "group relative inline-flex items-baseline font-serif italic outline-none " +
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
      {/* The layout has to live on this span, not on the button: children
          are wrapped here, so a `gap` set on the button only ever saw one
          flex item and an icon beside a label broke onto its own line. */}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        {children}
      </span>
      {underline && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-current origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[var(--duration-slow)] ease-out will-change-transform"
        />
      )}
    </button>
  );
}
