"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSheetState } from "@/lib/useSheetState";
import { useSwipeToClose } from "@/lib/useSwipeToClose";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

type Size = "md" | "lg" | "xl" | "2xl";

const PANEL_MAX: Record<Size, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  // Only for `split`: two columns need the width of two columns.
  "2xl": "sm:max-w-4xl",
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
  /**
   * Stands the media up as a column beside the content instead of a band
   * above it. For a tall photograph: stacked, a standing figure either
   * gets a strip of itself or eats the panel, and everything that
   * explains it is pushed under the fold. A phone has one column and
   * falls back to stacked, which is why `mediaHeight` still applies
   * there.
   */
  split?: boolean;
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
  split = false,
  children,
}: Props) {
  const tCommon = useTranslations("common");
  const { open, close } = useSheetState(onClose, 420);
  const swipe = useSwipeToClose(close);
  const panel = useRef<HTMLDivElement>(null);

  /**
   * A dialog has to own the keyboard while it is open: focus moves into
   * the panel, Tab cycles inside it, and it returns to whatever opened
   * the sheet on close. Without this, tabbing walks the page behind the
   * overlay, which for a screen reader means the sheet barely exists.
   *
   * The panel itself takes the focus, not its first control. Moving it
   * to the close button drew a focus ring around the X on every sheet
   * that opened — on a phone, where nobody is tabbing, an outlined box
   * over the corner of a photograph reads as a rendering fault.
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

    el.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      // Focus starts on the panel itself, which is not in the list: from
      // there Tab would enter the sheet on its own but Shift+Tab would
      // walk straight out into the page behind the overlay.
      if (document.activeElement === el) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
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

  const mediaBox = media && (
    <div
      className={`${mediaHeight} flex-shrink-0 touch-none ${
        split ? "sm:h-auto sm:w-[45%]" : ""
      }`}
      {...swipe.handlers}
    >
      {media}
    </div>
  );

  const content = (
    <>
      {header && (
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border">
          <div className="flex-1 min-w-0">{header}</div>
          <IconButton
            type="button"
            onClick={close}
            label={tCommon("close")}
            className="flex-shrink-0 -mr-2 -mt-2"
          >
            <Icon name="close" size={18} />
          </IconButton>
        </div>
      )}

      {headerBelow && (
        <div className="flex-shrink-0 border-b border-border">{headerBelow}</div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-8 flex flex-col gap-6">
        {children}
      </div>

      {footer && (
        <div className="flex-shrink-0 border-t border-border px-6 py-4">{footer}</div>
      )}
    </>
  );

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
        tabIndex={-1}
        // outline-none: the panel takes focus on open so the keyboard is
        // trapped inside it, and a browser's default ring around a whole
        // sheet is not a focus indicator anybody asked for. The controls
        // inside keep theirs.
        className={`relative bg-elevated w-full ${PANEL_MAX[size]} ${heightClass} flex flex-col overflow-hidden outline-none shadow-[var(--shadow-3)]`}
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

        {/* Split lays the media out as a column beside the content and
            needs a row to do it in. Stacked must stay exactly what it
            was: a flex item with `flex-1` contributes nothing to a
            panel that sizes itself to its content, and wrapping the
            sheets that hug their content (a garment, a palette) in one
            left their pinned footer outside the panel. */}
        {split ? (
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            {mediaBox}
            <div className="flex min-h-0 flex-1 flex-col sm:border-l sm:border-border">
              {content}
            </div>
          </div>
        ) : (
          <>
            {mediaBox}
            {content}
          </>
        )}
      </div>
    </div>
  );
}
