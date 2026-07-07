"use client";

import type { GarmentWithColors } from "@/lib/prendas/types";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { PieceThumb } from "./PieceThumb";

/** Ratio 3:4 amb tira de swatches. Card editorial reusable. */
export function GarmentCard({
  garment,
  index,
  onClick,
}: {
  garment: GarmentWithColors;
  index: number;
  onClick: (g: GarmentWithColors) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(garment)}
      className="cv-auto group flex flex-col text-left outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <PieceThumb
        garment={garment}
        thumb
        loading={index < 4 ? "eager" : "lazy"}
        className="aspect-[3/4] w-full transition-transform duration-500 ease-out group-hover:-translate-y-1 group-active:translate-y-0 group-active:scale-[0.98]"
      />
      <div className="flex items-baseline justify-between pt-3">
        <span className="font-serif text-base leading-tight">
          {CATEGORY_LABELS[garment.category]}
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums">
          n{String(index + 1).padStart(3, "0")}
        </span>
      </div>
      <span className="text-xs italic text-foreground-secondary mt-0.5">
        {FIT_LABELS[garment.fit] ?? garment.fit} · {garment.size}
      </span>
      {garment.notes && (
        <span className="text-xs text-foreground-secondary mt-0.5 truncate">
          {garment.notes}
        </span>
      )}
    </button>
  );
}

/** CTA visual: afegir peça al mateix ratio 3:4. */
export function AddGarmentCard({ href = "/add" }: { href?: string }) {
  return (
    <a
      href={href}
      className="group flex flex-col text-left outline-none"
    >
      <div className="relative flex aspect-[3/4] w-full items-center justify-center border border-dashed border-border transition-[border-color,transform,background-color] duration-500 ease-out group-hover:border-foreground group-hover:bg-card group-hover:-translate-y-1 group-active:translate-y-0 group-active:scale-[0.98]">
        <span
          aria-hidden
          className="font-serif text-4xl text-foreground-secondary transition-colors duration-500 group-hover:text-foreground"
        >
          +
        </span>
      </div>
      <div className="flex items-baseline justify-between pt-3">
        <span className="font-serif italic text-base leading-tight text-foreground-secondary transition-colors duration-500 group-hover:text-foreground">
          afegir una peça
        </span>
      </div>
    </a>
  );
}
