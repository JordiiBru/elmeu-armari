"use client";

import type { ReactNode } from "react";
import { SHEET_EASE, useSheetState } from "@/lib/useSheetState";
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
  children,
}: Props) {
  const { open, close } = useSheetState(onClose, 420);
  const swipe = useSwipeToClose(close);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        onClick={close}
        className="absolute inset-0 bg-overlay"
        style={{
          opacity: open ? 1 : 0,
          transition: `opacity 380ms ${SHEET_EASE}`,
        }}
      />

      <div
        role="dialog"
        aria-modal
        aria-label={label}
        className={`relative bg-elevated w-full ${PANEL_MAX[size]} max-h-[92vh] flex flex-col overflow-hidden shadow-[var(--shadow-3)]`}
        style={{
          transform: open
            ? `translate3d(0, ${swipe.dragY}px, 0)`
            : "translate3d(0, 100%, 0)",
          opacity: open ? 1 : 0,
          transition: swipe.dragging
            ? "none"
            : `transform 420ms ${SHEET_EASE}, opacity 300ms ${SHEET_EASE}`,
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
              size="sm"
              className="flex-shrink-0 -mr-1 -mt-1"
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

        <div className="overflow-y-auto overscroll-contain px-6 pt-6 pb-8 flex flex-col gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
