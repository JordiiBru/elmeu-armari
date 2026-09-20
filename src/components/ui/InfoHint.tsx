"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

interface Props {
  /** What a screen reader calls the button: "What does this mean?". */
  label: string;
  /** The explanation: one or two sentences, in the user's language. */
  children: ReactNode;
  /** Where "more details" goes, e.g. `/ajuda#colours`. */
  href?: string;
  moreLabel?: string;
}

/** Keeps the bubble this far from the edge of the screen. */
const EDGE = 16;

/**
 * A small "i" that opens a mini speech bubble explaining a control whose
 * label alone does not say what it does.
 *
 * Touch first: it is a tap, never a hover, and the tap target is 44 px even
 * though the icon is 14. It is a disclosure button (`aria-expanded`,
 * `aria-controls`): Esc and a tap outside close it, and Esc hands the focus
 * back to the button. The bubble is nudged left when it would run off the
 * right edge of a phone.
 */
export function InfoHint({ label, children, href, moreLabel }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const id = useId();
  // The width of the screen, read on the tap, before the bubble exists. Read
  // later it can already include the bubble: a phone that lets an overflowing
  // element widen the layout viewport reports the widened width, and the bubble
  // would measure itself against its own overflow and conclude it fits.
  const screenWidth = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // Placed once it is on screen, before it paints, so it never flashes half
  // off the edge. Written straight to the element: it is a measurement of the
  // DOM, not state anything else reads. Worked out from the bubble's own
  // width and where the hint sits, not from a bounding box taken mid-entrance.
  useLayoutEffect(() => {
    const el = bubble.current;
    const anchor = root.current;
    if (!open || !el || !anchor) return;
    const anchorLeft = anchor.getBoundingClientRect().left;
    const fits = screenWidth.current - EDGE - el.offsetWidth - anchorLeft;
    const most = EDGE - anchorLeft;
    el.style.left = `${Math.max(most, Math.min(0, fits))}px`;
  }, [open]);

  return (
    <span ref={root} className="relative inline-flex align-middle">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          if (!open) screenWidth.current = document.documentElement.clientWidth;
          setOpen((v) => !v);
        }}
        // 44 px to tap, pulled back into the line with negative margins so a
        // row does not grow for a 14 px icon.
        className={`-my-3 -mx-2.5 inline-flex h-11 w-11 items-center justify-center outline-none transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] focus-visible:ring-1 focus-visible:ring-focus-ring ${
          open ? "text-text-primary" : "text-text-muted hover:text-text-primary"
        }`}
      >
        <Icon name="info" size={14} />
      </button>
      {open && (
        <span
          ref={bubble}
          id={id}
          role="note"
          className="panel-enter absolute top-full z-40 mt-1 block w-64 max-w-[calc(100vw-2rem)] border border-border bg-floating p-3 text-left shadow-[var(--shadow-2)]"
        >
          <span className="block font-serif text-sm normal-case not-italic leading-snug tracking-normal text-text-primary">
            {children}
          </span>
          {href && moreLabel && (
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className="mt-2 inline-block type-caption underline-offset-4 hover:underline"
            >
              {moreLabel}
            </Link>
          )}
        </span>
      )}
    </span>
  );
}
