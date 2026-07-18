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
 *
 * `prefers-reduced-motion` ja col·lapsa les transicions CSS a ~0 (regla
 * global a globals.css), pero aquest timeout és independent del CSS —
 * sense aquest guard, onClose (que ara sovint dispara una navegació,
 * `router.back()`) trigaria els mateixos 420ms encara que l'usuari no
 * vegi cap animació.
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
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(onClose, reduceMotion ? 0 : exitMs);
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

