"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State shared by bottom sheets and modal dialogs:
 * - Animated entrance (shown after a rAF, to trigger the transitions).
 * - Body scroll locked while open.
 * - Escape closes.
 * - Animated exit (closing) that calls onClose after exitMs.
 *
 * Returns:
 * - open: boolean that drives the transitions (true while visible).
 * - close: function that starts the animated close.
 *
 * exitMs must match the longest of the panel's transitions so onClose runs
 * just as the animation ends.
 *
 * `prefers-reduced-motion` already collapses the CSS transitions to ~0 (a
 * global rule in globals.css), but this timeout is independent of the CSS:
 * without that guard, onClose (which now often triggers a navigation,
 * `router.back()`) would take the same 420ms even when the user sees no
 * animation.
 *
 * `skipEnter` starts the panel already open instead of sliding it up
 * from the bottom on the next frame. For a sheet replacing a sibling
 * sheet inside `useViewTransition` — the panel's "after" DOM snapshot
 * has to already read as open, or the browser morphs into the closed
 * position and the panel's own entrance transition then fights it a
 * frame later.
 */
export function useSheetState(onClose: () => void, exitMs = 420, skipEnter = false) {
  const [shown, setShown] = useState(skipEnter);
  const [closing, setClosing] = useState(false);
  // The guard has to be a ref, not the `closing` state. It used to live
  // inside the `setClosing` updater, which made scheduling `onClose` a
  // side effect of a state updater — and React double-invokes updaters
  // under StrictMode to check they are pure. So every close fired
  // `onClose` twice in development. On a sheet that closes with
  // `router.back()` that is two history steps: closing a garment landed
  // on the home page before the fallback pulled it back to /armari,
  // which is the flash you could see.
  const closingRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (skipEnter) return () => { document.body.style.overflow = ""; };
    const raf = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
    // Read once, at mount: which sheet instance this is never changes
    // after it exists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setShown(false);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onClose, reduceMotion ? 0 : exitMs);
  }, [onClose, exitMs]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  return { open: shown && !closing, close };
}

