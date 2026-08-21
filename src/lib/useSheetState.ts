"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    const raf = requestAnimationFrame(() => setShown(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
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

