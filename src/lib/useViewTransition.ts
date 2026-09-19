"use client";

import { flushSync } from "react-dom";

/**
 * Runs a state update inside `document.startViewTransition` when the
 * browser has it, so a sheet swapping into another sheet of the same
 * kind (piece detail into "què hi combina", discover's rail into a
 * piece's combinations) morphs between the two instead of the second
 * one hard-cutting in and sliding up from the bottom as if it were a
 * fresh modal — see `Sheet`'s `skipEnter` prop, which this pairs with.
 *
 * `flushSync` is required: the transition's "after" snapshot is taken
 * the instant the callback returns, and without it React's own batching
 * would still be mid-render.
 *
 * Falls through to a plain update wherever the API is missing or the
 * visitor asked for less motion — nothing here is load-bearing, only
 * how the swap looks.
 */
export function useViewTransition() {
  return (update: () => void) => {
    const supported =
      typeof document !== "undefined" && "startViewTransition" in document;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supported || reduceMotion) {
      update();
      return;
    }

    document.startViewTransition(() => flushSync(update));
  };
}
