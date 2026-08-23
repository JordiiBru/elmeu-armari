import type { DayEvent } from "./types";

/**
 * The photograph of a day, served from the same route as a garment's.
 *
 * The filename is derived from the day's id, so replacing a photo leaves
 * the URL untouched — hence `updatedAt` in the query string, which is the
 * only reason that column exists.
 */
export function dayPhotoSrc(event: DayEvent | null | undefined): string | null {
  if (!event?.image) return null;
  return `/api/uploads/${event.image}?v=${event.updatedAt.getTime()}`;
}

/** Thumbnail companion (`<id>-thumb.webp`), for the week's small cells. */
export function dayPhotoThumbSrc(event: DayEvent | null | undefined): string | null {
  if (!event?.image) return null;
  return `/api/uploads/${event.id}-thumb.webp?v=${event.updatedAt.getTime()}`;
}
