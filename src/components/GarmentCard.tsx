"use client";

import type { GarmentWithColors } from "@/lib/prendas/types";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { PieceThumb } from "./PieceThumb";
import { Card, Text } from "@/components/ui";

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
    <Card as="button" interactive="clickable" type="button" onClick={() => onClick(garment)}>
      <PieceThumb
        garment={garment}
        thumb
        loading={index < 4 ? "eager" : "lazy"}
        className="aspect-[3/4] w-full transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0"
      />
      <div className="flex items-baseline justify-between pt-3">
        <Text as="span" className="font-serif leading-tight">
          {CATEGORY_LABELS[garment.category]}
        </Text>
        <Text variant="caption" tabular>
          n{String(index + 1).padStart(3, "0")}
        </Text>
      </div>
      <Text variant="small" italic tone="secondary" className="font-serif mt-0.5">
        {FIT_LABELS[garment.fit] ?? garment.fit} · {garment.size}
      </Text>
      {garment.notes && (
        <Text variant="small" tone="secondary" truncate className="mt-0.5">
          {garment.notes}
        </Text>
      )}
    </Card>
  );
}

/** CTA visual: afegir peça al mateix ratio 3:4. */
export function AddGarmentCard({ href = "/add" }: { href?: string }) {
  return (
    <Card as="a" interactive="clickable" href={href}>
      <div className="relative flex aspect-[3/4] w-full items-center justify-center border border-dashed border-border transition-[border-color,transform,background-color] duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:border-text-primary group-hover:bg-elevated group-hover:-translate-y-1 group-active:translate-y-0">
        <span
          aria-hidden
          className="font-serif text-4xl text-text-secondary transition-colors duration-[var(--duration-slow)] group-hover:text-text-primary"
        >
          +
        </span>
      </div>
      <div className="flex items-baseline justify-between pt-3">
        <Text
          as="span"
          italic
          tone="secondary"
          className="font-serif leading-tight transition-colors duration-[var(--duration-slow)] group-hover:text-text-primary"
        >
          afegir una peça
        </Text>
      </div>
    </Card>
  );
}
