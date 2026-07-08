import Image from "next/image";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { garmentImageSrc, garmentThumbSrc } from "@/lib/prendas/image";

interface Props {
  garment: GarmentWithColors;
  /** Use the `-thumb.webp` variant when true. Prefer for dense grids. */
  thumb?: boolean;
  /** `next/image` loading strategy. */
  loading?: "eager" | "lazy";
  /** Set `priority` on the underlying image when it is above the fold. */
  priority?: boolean;
  /** Pass through to `next/image` as `sizes`. */
  sizes?: string;
  /** Direction of the coloured-stripes fallback. */
  fallbackDirection?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Renders a garment's photo, or a fallback of vertical/horizontal colour
 * stripes when there is no photo. The wrapper is `relative` so the caller
 * only has to size it (`h-16 w-16`, `aspect-[3/4]`, etc.).
 */
export function PieceThumb({
  garment,
  thumb = false,
  loading,
  priority,
  sizes,
  fallbackDirection = "horizontal",
  className,
}: Props) {
  const src = thumb ? garmentThumbSrc(garment) : garmentImageSrc(garment);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`.trim()}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes={sizes}
          className="object-cover"
          loading={loading}
          priority={priority}
          draggable={false}
        />
      ) : (
        <div className={`flex h-full w-full ${fallbackDirection === "vertical" ? "flex-col" : ""}`}>
          {garment.colors.map((c) => (
            <div
              key={c.id}
              className="flex-1"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
