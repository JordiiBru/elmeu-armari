"use client";

import Image from "next/image";
import { useState } from "react";
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
  /** `contain` shows the whole piece, uncropped: how an outfit figure
   * lays its pieces out, one above the other. */
  fit?: "cover" | "contain";
  /** No backdrop of its own, and the photo multiplied onto whatever is
   * behind it (light mode only): for pieces laid out on one surface. */
  flat?: boolean;
  className?: string;
}

/**
 * Renders a garment's photo, or a fallback of vertical/horizontal colour
 * stripes when there is no photo. The wrapper is `relative` so the caller
 * only has to size it (`h-16 w-16`, `aspect-[3/4]`, etc.).
 *
 * Photos below the fold crossfade in on load via `opacity`; the ones above it
 * are simply there, because gating them on JavaScript delays the page.
 */
export function PieceThumb({
  garment,
  thumb = false,
  loading,
  priority,
  sizes,
  fallbackDirection = "horizontal",
  fit = "cover",
  flat = false,
  className,
}: Props) {
  const src = thumb ? garmentThumbSrc(garment) : garmentImageSrc(garment);
  // A photo above the fold starts visible. The crossfade waits for React to
  // hydrate and for `onLoad` to fire, so a photo that arrives first stays
  // invisible until then and the largest paint of the page is delayed by
  // the whole hydration (measured: about 3 s on a slow phone against under
  // 1 s). Only what loads lazily, below the fold, fades in.
  const [loaded, setLoaded] = useState(priority === true || loading === "eager");
  /**
   * Which src failed, rather than a boolean: the flag has to clear
   * itself when this tile is handed a different garment, and a list that
   * reorders does exactly that.
   *
   * A photo can go missing — a file lost to a restore, an upload that
   * never landed — and the tile then stayed empty forever, because the
   * crossfade only ever runs on `load`. An empty tile in a grid reads as
   * a broken app; the colours read as a garment nobody has photographed
   * yet, which is what it is.
   */
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const broken = src !== null && src === failedSrc;

  return (
    <div className={`relative overflow-hidden ${flat ? "" : "bg-surface"} ${className ?? ""}`.trim()}>
      {src && !broken ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized // sharp already produces final WebP; re-encoding would lose quality
          sizes={sizes}
          className={[
            fit === "contain" ? "object-contain" : "object-cover",
            flat ? "mix-blend-multiply dark:mix-blend-normal" : "",
            "transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-standard)]",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          loading={loading}
          priority={priority}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div
          className={`flex ${
            fit === "contain" ? "mx-auto aspect-square h-full max-w-full" : "h-full w-full"
          } ${fallbackDirection === "vertical" ? "flex-col" : ""}`}
        >
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
