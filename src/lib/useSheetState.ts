"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Estat compartit per bottom sheets i dialegs modals:
 * - Entrada animada (shown després de raf per triggerar transicions).
 * - Body scroll bloquejat mentre esta obert.
 * - Tecla Escape tanca.
 * - Sortida animada (closing) que crida onClose despres de exitMs.
 *
 * Retorna:
 * - open: boolean que controla les transicions (true quan visible).
 * - close: funcio que engega el tancament animat.
 *
 * L'exitMs ha de coincidir amb la durada mes llarga de les transicions
 * del panell perque onClose s'invoqui just quan l'animacio acaba.
 */
export function useSheetState(onClose: () => void, exitMs = 420) {
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  const close = useCallback(() => {
    setClosing((wasClosing) => {
      if (wasClosing) return true;
      setShown(false);
      setTimeout(onClose, exitMs);
      return true;
    });
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

/** Easing spring tipus iOS. Compartit entre sheets. */
export const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
