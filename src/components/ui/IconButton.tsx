"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "ghost" | "solid";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center outline-none " +
  "transition-[color,background-color,opacity,transform] duration-[var(--duration-base)] " +
  "ease-[var(--ease-standard)] active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed " +
  "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

const VARIANT_CLASS: Record<Variant, string> = {
  ghost: "bg-transparent text-text-secondary hover:text-text-primary",
  solid:
    "bg-text-primary text-text-inverse hover:bg-interactive-hover",
};

type Props = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
  label: string;
  children: ReactNode;
};

export function IconButton({
  variant = "ghost",
  size = "md",
  label,
  className,
  children,
  ...rest
}: Props) {
  const classes = [BASE, SIZE_CLASS[size], VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} aria-label={label} {...rest}>
      {children}
    </button>
  );
}
