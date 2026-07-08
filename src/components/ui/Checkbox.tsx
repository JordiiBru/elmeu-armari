"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface Props extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  label: ReactNode;
  labelClassName?: string;
}

/**
 * Editorial checkbox — hairline square that fills with foreground when
 * checked. No native input styling.
 */
export function Checkbox({ label, className, labelClassName, ...rest }: Props) {
  return (
    <label
      className={[
        "group inline-flex items-center gap-3 cursor-pointer select-none",
        "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)]",
        rest.disabled ? "opacity-40 cursor-not-allowed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="relative inline-block h-4 w-4 flex-shrink-0">
        <input type="checkbox" className="peer sr-only" {...rest} />
        <span
          aria-hidden
          className={[
            "absolute inset-0 border border-border",
            "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)]",
            "peer-checked:bg-text-primary peer-checked:border-text-primary",
            "peer-focus-visible:ring-1 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          ].join(" ")}
        />
      </span>
      <span
        className={[
          "font-serif text-base text-text-secondary",
          "group-hover:text-text-primary",
          "peer-checked:text-text-primary",
          labelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </span>
    </label>
  );
}
