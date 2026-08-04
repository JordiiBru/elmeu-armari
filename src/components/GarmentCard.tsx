import Link from "next/link";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/prendas/labels";
import { garmentSlug } from "@/lib/prendas/slug";
import { isDirty } from "@/lib/bugaderia/laundry";
import { UI } from "@/lib/prendas/ui-strings";
import { PieceThumb } from "./PieceThumb";
import { Card, Text, Icon } from "@/components/ui";

/** Thumbnail + label block shared by every card ratio 3:4 in the catalog. */
function GarmentCardContent({ garment, index }: { garment: GarmentWithColors; index: number }) {
  return (
    <>
      <div className="relative">
        <PieceThumb
          garment={garment}
          thumb
          loading={index < 4 ? "eager" : "lazy"}
          className="aspect-[3/4] w-full transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0"
        />
        {isDirty(garment) && (
          <span className="absolute top-2 left-2 type-caption bg-elevated px-1.5 py-0.5">
            {UI.bugaderia.grid.badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between pt-3">
        <Text as="span" className="font-serif leading-tight">
          {CATEGORY_LABELS[garment.category]}
        </Text>
        <Text variant="caption" tabular>
          n{String(index + 1).padStart(3, "0")}
        </Text>
      </div>
      {(garment.fit || garment.size) && (
        <Text variant="small" italic tone="secondary" className="font-serif mt-0.5">
          {[garment.fit ? (FIT_LABELS[garment.fit] ?? garment.fit) : null, garment.size]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      )}
      {garment.notes && (
        <Text variant="small" tone="secondary" truncate className="mt-0.5">
          {garment.notes}
        </Text>
      )}
    </>
  );
}

/**
 * Ratio 3:4 amb tira de swatches. Card editorial reusable.
 * Server Component: a plain `Link` to `/armari/[slug]`. The garment modal
 * opens via that route (intercepted from `/armari`, see `@modal`) rather
 * than local client state, so this card doesn't need "use client".
 */
export function GarmentCard({
  garment,
  index,
}: {
  garment: GarmentWithColors;
  index: number;
}) {
  return (
    <Card
      as={Link}
      href={`/armari/${garmentSlug(garment)}`}
      scroll={false}
      interactive="clickable"
      data-testid="garment-card"
    >
      <GarmentCardContent garment={garment} index={index} />
    </Card>
  );
}

/**
 * Same visual card, but a click callback instead of navigation — used by
 * the outfit builder ("combinar" tab) to pick a garment and open the
 * palette-matching sheet, which is unrelated to the `/armari/[slug]` detail
 * modal. Kept client-only since it needs a real event handler.
 */
export function SelectableGarmentCard({
  garment,
  index,
  onClick,
}: {
  garment: GarmentWithColors;
  index: number;
  onClick: (g: GarmentWithColors) => void;
}) {
  return (
    <Card
      as="button"
      type="button"
      interactive="clickable"
      data-testid="garment-card"
      onClick={() => onClick(garment)}
    >
      <GarmentCardContent garment={garment} index={index} />
    </Card>
  );
}

/** CTA visual: afegir peça al mateix ratio 3:4. */
export function AddGarmentCard({ href = "/add" }: { href?: string }) {
  return (
    <Card as="a" interactive="clickable" href={href}>
      <div className="relative flex aspect-[3/4] w-full items-center justify-center border border-dashed border-border transition-[border-color,transform,background-color] duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:border-text-primary group-hover:bg-elevated group-hover:-translate-y-1 group-active:translate-y-0">
        <span className="text-text-secondary transition-colors duration-[var(--duration-slow)] group-hover:text-text-primary">
          <Icon name="plus" size={28} />
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
