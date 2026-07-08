"use client";

import type { ReactNode } from "react";

interface Option<V extends string> {
  value: V;
  label: ReactNode;
}

interface Props<V extends string> {
  value: V;
  onChange: (value: V) => void;
  options: Option<V>[];
  ariaLabel?: string;
  className?: string;
}

/**
 * Mutually-exclusive selector, editorial hairline style: labels with
 * a hairline underline that slides under the active one. Radio-group
 * semantics via role=radiogroup.
 */
export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: Props<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={["inline-flex flex-wrap gap-x-6 gap-y-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={[
              "group relative inline-flex items-baseline outline-none",
              "type-caption",
              active ? "text-text-primary" : "hover:text-text-primary",
              "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] active:scale-[0.98]",
              "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
          >
            <span>{opt.label}</span>
            <span
              aria-hidden
              className={[
                "pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary",
                "origin-left transition-transform duration-500 ease-out will-change-transform",
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
