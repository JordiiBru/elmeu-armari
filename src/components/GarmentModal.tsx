"use client";

import Link from "next/link";
import Image from "next/image";
import { SHEET_EASE, useSheetState } from "@/lib/useSheetState";
import { useSwipeToClose } from "@/lib/useSwipeToClose";
import { deleteGarmentAction } from "@/app/armari/actions";
import type { GarmentWithColors } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SUBTYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";

interface Props {
  garment: GarmentWithColors;
  onClose: () => void;
}

export function GarmentModal({ garment, onClose }: Props) {
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
        className="relative bg-card w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden"
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

        {/* Franja visual — foto o swatches. Swipe zone. */}
        <div className="relative flex h-40 flex-shrink-0 touch-none overflow-hidden" {...swipe.handlers}>
          {garment.image ? (
            <Image
              src={`/api/uploads/${garment.image}?v=${garment.updatedAt.getTime()}`}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            garment.colors.map((c) => (
              <div
                key={c.id}
                className="flex-1"
                style={{ backgroundColor: c.hex }}
                title={c.hex}
              />
            ))
          )}
        </div>

        <div className="overflow-y-auto overscroll-contain px-6 pt-6 pb-8 flex flex-col gap-6">
          {/* Titol */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary">
                peça
              </span>
              <h2 className="font-serif text-2xl leading-tight">
                {CATEGORY_LABELS[garment.category]}
                {garment.subtype && (
                  <span className="text-foreground-secondary italic">
                    {" "}
                    · {SUBTYPE_LABELS[garment.subtype]}
                  </span>
                )}
              </h2>
              <p className="font-serif italic text-sm text-foreground-secondary">
                {FIT_LABELS[garment.fit]} · talla {garment.size}
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

          {/* Meta */}
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <Meta label={UI.modal.texture} value={TEXTURE_LABELS[garment.texture]} />
            <Meta label={UI.modal.pattern} value={PATTERN_LABELS[garment.pattern]} />
          </dl>

          {/* Colors */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary">
              {UI.modal.colors}
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {garment.colors.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span
                    className="inline-block h-4 w-4"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-mono text-foreground-secondary">
                    {c.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estacions */}
          {garment.seasons.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary">
                {UI.modal.seasons}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-serif italic">
                {garment.seasons.map((s, i) => (
                  <span key={s.id} className="inline-flex items-center gap-4">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="inline-block h-1 w-1 rounded-full bg-border"
                      />
                    )}
                    {SEASON_LABELS[s.season]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {garment.notes && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary">
                nota
              </span>
              <p className="font-serif italic text-sm text-foreground">
                {garment.notes}
              </p>
            </div>
          )}

          {/* Accions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Link
              href={`/edit/${garment.id}`}
              className="font-serif italic text-sm text-foreground hover:text-foreground-secondary transition-colors"
              onClick={close}
            >
              editar
            </Link>
            <form action={deleteGarmentAction}>
              <input type="hidden" name="id" value={garment.id} />
              <button
                type="submit"
                className="font-serif italic text-sm text-foreground-secondary hover:text-foreground transition-colors active:scale-95"
                onClick={(e) => {
                  if (!confirm(`${UI.buttons.delete} peça?`)) e.preventDefault();
                }}
              >
                eliminar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="font-serif text-sm text-foreground">{value}</dd>
    </div>
  );
}
