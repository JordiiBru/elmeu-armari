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
  /**
   * Wrapping is right for a long rail of filter tags and wrong inside a
   * fixed-width row, where the control has an intrinsic width and it is
   * the label beside it that should give way. Cannot be overridden from
   * `className`: both utilities set the same property, so which one wins
   * is decided by their order in the stylesheet, not in the class list.
   */
  wrap?: boolean;
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
  wrap = true,
  className,
}: Props<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        "inline-flex gap-x-6 gap-y-2",
        wrap ? "flex-wrap" : "flex-nowrap",
        className,
      ]
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
              // The visible mark is the hairline under the label, but the
              // tap target is the whole button: a 13px strip of caption
              // text is not something a thumb can hit.
              "group relative inline-flex min-h-11 items-center outline-none",
              "type-caption",
              active ? "text-text-primary" : "hover:text-text-primary",
              "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] active:scale-[0.98]",
              "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
          >
            {/* inline-block, not inline-flex: the label is a text run
                ("tots 4") and flex would swallow the space between its
                parts. */}
            <span className="relative inline-block">
              {opt.label}
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary",
                  "origin-left transition-transform duration-[var(--duration-slow)] ease-out will-change-transform",
                  active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                ].join(" ")}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
