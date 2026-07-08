"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "text" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "group relative inline-flex items-center justify-center whitespace-nowrap outline-none " +
  "transition-[background-color,border-color,color,opacity,transform] duration-[var(--duration-base)] " +
  "ease-[var(--ease-standard)] disabled:opacity-40 disabled:cursor-not-allowed " +
  "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background";

const SIZE_CLASS: Record<Size, string> = {
  sm: "type-caption-strong h-9 px-4",
  md: "type-small h-11 px-5",
  lg: "type-body h-12 px-6",
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-text-primary text-text-inverse border border-text-primary " +
    "hover:bg-interactive-hover hover:border-interactive-hover active:scale-[0.98]",
  secondary:
    "bg-transparent text-text-primary border border-border-strong " +
    "hover:bg-elevated active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-primary border border-transparent " +
    "hover:border-border active:scale-[0.98]",
  text:
    "bg-transparent text-text-primary border-0 px-0 h-auto " +
    "hover:text-text-secondary active:scale-[0.98]",
  danger:
    "bg-transparent text-danger border border-danger " +
    "hover:bg-danger hover:text-text-inverse active:scale-[0.98]",
};

type Props = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  loadingText,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  const sizeClass = variant === "text" ? "" : SIZE_CLASS[size];
  const classes = [BASE, sizeClass, VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
