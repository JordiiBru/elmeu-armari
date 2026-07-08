"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  id?: string;
  ariaLabel?: string;
}

/**
 * Editorial select — hairline underline, no native chevron, no OS
 * styling. Listbox popover on click / space / enter / arrows.
 * Emits a hidden <input> so it works inside form actions.
 */
export function Select({
  name,
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  disabled,
  required,
  invalid,
  id,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const i = options.findIndex((o) => o.value === value);
    return i < 0 ? 0 : i;
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const buttonId = id ?? `select-${generatedId}`;
  const listboxId = `${buttonId}-listbox`;

  const selected = options.find((o) => o.value === value) ?? null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector<HTMLLIElement>(
        `[data-index="${activeIndex}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      const opt = options[activeIndex];
      if (opt) {
        onChange(opt.value);
        close();
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}
      <button
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={[
          "w-full h-10 bg-transparent border-0 border-b px-0 pr-6",
          "font-serif text-base text-left",
          "focus:outline-none focus:border-text-primary",
          "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "flex items-center justify-between",
          invalid ? "border-danger" : "border-border",
          selected ? "text-text-primary" : "text-text-secondary italic",
        ].join(" ")}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <span
          aria-hidden
          className={[
            "ml-3 text-xs transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] text-text-secondary",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ˅
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto bg-floating border border-border shadow-[var(--shadow-2)]"
        >
          {options.map((opt, i) => {
            const selectedOpt = opt.value === value;
            const active = i === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={selectedOpt}
                data-index={i}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
                className={[
                  "px-4 py-2 font-serif text-base cursor-pointer",
                  "flex items-baseline justify-between gap-4",
                  active ? "bg-elevated text-text-primary" : "text-text-primary",
                  selectedOpt ? "font-medium" : "",
                ].join(" ")}
              >
                <span>{opt.label}</span>
                {selectedOpt && (
                  <span aria-hidden className="type-caption text-text-secondary">
                    ·
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
