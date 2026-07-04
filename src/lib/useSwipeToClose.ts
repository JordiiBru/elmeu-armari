"use client";

import { useRef, useState } from "react";

/**
 * Swipe-to-close per bottom sheets en mobil.
 * Retorna handlers per aplicar a la zona "handle" del sheet
 * (ex: capçalera + franja de swatches) i el translateY actual.
 *
 * Umbral: >100px de desplaçament OR velocitat >0.5px/ms → tanca.
 * Si no, snap back.
 */
export function useSwipeToClose(onClose: () => void) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handlers = {
    onTouchStart(e: React.TouchEvent) {
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      setDragging(true);
    },
    onTouchMove(e: React.TouchEvent) {
      const dy = e.touches[0].clientY - startY.current;
      // nomes cap avall
      setDragY(dy > 0 ? dy : 0);
    },
    onTouchEnd() {
      const elapsed = Math.max(1, Date.now() - startTime.current);
      const velocity = dragY / elapsed;
      setDragging(false);
      if (dragY > 100 || velocity > 0.5) {
        onClose();
      } else {
        setDragY(0);
      }
    },
    onTouchCancel() {
      setDragging(false);
      setDragY(0);
    },
  };

  return { handlers, dragY, dragging };
}
