"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useSheetState } from "@/lib/useSheetState";
import { useSwipeToClose } from "@/lib/useSwipeToClose";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

type Size = "md" | "lg" | "xl";

const PANEL_MAX: Record<Size, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
};

interface Props {
  onClose: () => void;
  size?: Size;
  /**
   * Renders inside the top-of-panel swipe zone (mobile). Typical use:
   * hero color strip, thumbnail, or coloured swatches. Fills the
   * height provided by `mediaHeight`.
   */
  media?: ReactNode;
  mediaHeight?: string;
  /**
   * Sheet accessible label.
   */
  label: string;
  /**
   * Header content rendered under the media. Should include title.
   */
  header?: ReactNode;
  /**
   * Body content scrolls independently.
   */
  children?: ReactNode;
  /**
   * Optional slot after the body (filters, tabs). Not scrollable —
   * stays visible.
   */
  headerBelow?: ReactNode;
  /**
   * Pinned under the scrolling body: the sheet's primary action stays
   * reachable however long the content is.
   */
  footer?: ReactNode;
  /**
   * Fixes the panel to its full height instead of letting it hug its
   * content. For sheets whose body swaps between panels of different
   * sizes: hugging makes the whole sheet jump every time you switch tab,
   * and on a bottom sheet it jumps under your thumb.
   */
  fill?: boolean;
}

/**
 * Bottom sheet on mobile, centered modal on desktop. Backdrop, swipe,
 * escape and body-scroll-lock are handled internally.
 * All three of the app's sheets (garment, outfit, palette) compose
 * their content into this one shell.
 */
export function Sheet({
  onClose,
  size = "md",
  media,
  mediaHeight = "h-40",
  label,
  header,
  headerBelow,
  footer,
  fill = false,
  children,
}: Props) {
  const { open, close } = useSheetState(onClose, 420);
  const swipe = useSwipeToClose(close);
  const panel = useRef<HTMLDivElement>(null);

  /**
   * A dialog has to own the keyboard while it is open: focus moves into
   * the panel, Tab cycles inside it, and it returns to whatever opened
   * the sheet on close. Without this, tabbing walks the page behind the
   * overlay, which for a screen reader means the sheet barely exists.
   */
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((n) => n.offsetParent !== null);

    focusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, []);

  // dvh, not vh: on a phone the address bar counts towards vh, so a
  // 92vh bottom sheet parks its own footer under it.
  const heightClass = fill
    ? "h-[92dvh] sm:h-[min(48rem,92dvh)]"
    : "max-h-[92dvh]";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        onClick={close}
        className="absolute inset-0 bg-overlay"
        style={{
          opacity: open ? 1 : 0,
          transition:
            "opacity var(--duration-slow) var(--ease-spring)",
        }}
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal
        aria-label={label}
        className={`relative bg-elevated w-full ${PANEL_MAX[size]} ${heightClass} flex flex-col overflow-hidden shadow-[var(--shadow-3)]`}
        style={{
          transform: open
            ? `translate3d(0, ${swipe.dragY}px, 0)`
            : "translate3d(0, 100%, 0)",
          opacity: open ? 1 : 0,
          transition: swipe.dragging
            ? "none"
            : "transform var(--duration-slow) var(--ease-spring), opacity var(--duration-base) var(--ease-spring)",
          willChange: "transform, opacity",
          contain: "layout paint",
        }}
      >
        <div
          className="sm:hidden pt-3 pb-2 flex justify-center touch-none"
          {...swipe.handlers}
        >
          <span className="block h-1 w-10 rounded-full bg-border" />
        </div>

        {media && (
          <div
            className={`${mediaHeight} flex-shrink-0 touch-none`}
            {...swipe.handlers}
          >
            {media}
          </div>
        )}

        {header && (
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border">
            <div className="flex-1 min-w-0">{header}</div>
            <IconButton
              type="button"
              onClick={close}
              label="Tancar"
              className="flex-shrink-0 -mr-2 -mt-2"
            >
              <Icon name="close" size={18} />
            </IconButton>
          </div>
        )}

        {headerBelow && (
          <div className="flex-shrink-0 border-b border-border">
            {headerBelow}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-8 flex flex-col gap-6">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
