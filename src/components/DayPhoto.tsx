"use client";

import Image from "next/image";
import { useState } from "react";
import type { DayEvent } from "@/lib/outfits/types";
import { dayPhotoSrc, dayPhotoThumbSrc } from "@/lib/outfits/image";

interface Props {
  event: DayEvent;
  /** Use the `-thumb.webp` variant. Prefer it in the week's small cells. */
  thumb?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * The photograph of a day: you, in what you wore, mirror-selfie shaped.
 *
 * `object-contain`, unlike every other photo in the app. A garment is
 * shot flat and crops well; a person does not, and this one is meant to
 * be a cut-out silhouette on the page's own ground — cropping it to a
 * square would behead the outfit it exists to show. The frame is left
 * transparent for the same reason.
 */
export function DayPhoto({ event, thumb = false, sizes, priority, className }: Props) {
  const src = thumb ? dayPhotoThumbSrc(event) : dayPhotoSrc(event);
  const [loaded, setLoaded] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Nothing to fall back to — a day photograph is of one thing only — so
  // a missing file leaves the frame to whatever is under it rather than
  // to a tile that never fades in.
  if (!src || src === failedSrc) return null;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`.trim()}>
      <Image
        src={src}
        alt=""
        fill
        unoptimized // sharp already produces final WebP; re-encoding would lose quality
        sizes={sizes}
        className={[
          "object-contain",
          "transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-standard)]",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
        priority={priority}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
