import type { GarmentWithColors } from "./types";

/** Full-size uploaded image (WebP re-encoded by sharp on upload). */
export function garmentImageSrc(garment: Pick<GarmentWithColors, "image" | "updatedAt">): string | null {
  if (!garment.image) return null;
  return `/api/uploads/${garment.image}?v=${garment.updatedAt.getTime()}`;
}

/** Thumbnail companion (`<id>-thumb.webp`). Used in dense grids. */
export function garmentThumbSrc(garment: Pick<GarmentWithColors, "id" | "image" | "updatedAt">): string | null {
  if (!garment.image) return null;
  return `/api/uploads/${garment.id}-thumb.webp?v=${garment.updatedAt.getTime()}`;
}
