"use client";

import { SHEET_EASE, useSheetState } from "@/lib/useSheetState";
import { useSwipeToClose } from "@/lib/useSwipeToClose";

type Palette = {
  id: number;
  colors: { hex: string; name: string | null }[];
};

type Color = {
  index: number;
  name: string;
  hex: string;
  combinations: number[];
};

export default function PaletteSheet({
  color,
  palettes,
  onClose,
}: {
  color: Color;
  palettes: Palette[];
  onClose: () => void;
}) {
  const { open, close } = useSheetState(onClose, 420);
  const swipe = useSwipeToClose(close);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-foreground/40"
        style={{
          opacity: open ? 1 : 0,
          transition: `opacity 380ms ${SHEET_EASE}`,
          // backdrop-filter blur eliminat: era font principal de jank a Safari Mac.
          // L'opacitat sola ja donava profunditat suficient.
        }}
      />

      {/* Panell */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Combinacions de ${color.name}`}
        className="relative bg-card w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
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
        {/* Handle mobil (swipe zone) */}
        <div
          className="sm:hidden pt-3 pb-2 flex justify-center touch-none"
          {...swipe.handlers}
        >
          <span className="block h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Franja del color triat + swipe zone */}
        <div
          className="h-24 sm:h-32 flex-shrink-0 touch-none"
          style={{ backgroundColor: color.hex }}
          {...swipe.handlers}
        />

        <div className="overflow-y-auto overscroll-contain px-6 md:px-10 pt-6 pb-10 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="type-caption">
                color
              </span>
              <h2 className="font-serif text-2xl md:text-3xl leading-tight">
                {color.name}
              </h2>
              <p className="font-serif italic text-sm text-foreground-secondary">
                <span className="font-mono not-italic">
                  {color.hex.toUpperCase()}
                </span>
                {" · "}
                {palettes.length}{" "}
                {palettes.length === 1 ? "combinació" : "combinacions"}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="text-foreground-secondary hover:text-foreground text-xl leading-none flex-shrink-0 -mr-1 -mt-1 h-8 w-8 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Tancar"
            >
              ×
            </button>
          </div>

          {palettes.length === 0 ? (
            <p className="font-serif italic text-foreground-secondary text-center py-8">
              aquest color no forma part de cap combinacio catalogada.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {palettes.map((p) => (
                <SheetPaletteRow
                  key={p.id}
                  palette={p}
                  highlightHex={color.hex}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SheetPaletteRow({
  palette,
  highlightHex,
}: {
  palette: Palette;
  highlightHex: string;
}) {
  const hi = highlightHex.toLowerCase();
  // Mostres de mida fixa — totes iguals, no s'estiren.
  const SWATCH = "w-16 sm:w-20";
  return (
    <article className="flex flex-col gap-3 py-6">
      <div className="flex items-baseline justify-end">
        <span className="type-caption tabular-nums">
          n{String(palette.id).padStart(3, "0")}
        </span>
      </div>
      <div className="flex h-24 md:h-28">
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className={`${SWATCH} shrink-0`}
            style={{ backgroundColor: c.hex }}
            title={c.name ?? c.hex}
          />
        ))}
      </div>
      <div className="flex">
        {palette.colors.map((c, i) => {
          const isHi = c.hex.toLowerCase() === hi;
          return (
            <div
              key={i}
              className={`${SWATCH} shrink-0 flex flex-col gap-0.5 pr-3`}
            >
              <span
                className={`font-serif text-xs sm:text-sm leading-tight ${
                  isHi ? "text-foreground" : "text-foreground-secondary"
                }`}
              >
                {c.name ?? "sense nom"}
              </span>
              <span className="type-mono text-text-secondary">
                {c.hex.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
