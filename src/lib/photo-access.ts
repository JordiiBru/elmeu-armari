import { findGarmentById } from "@/lib/prendas/service";
import { findDayById } from "@/lib/outfits/service";

const PHOTO_FILENAME = /^([a-z0-9]+)(?:-thumb)?\.webp$/;

/**
 * Whether this account owns the photo behind `filename`.
 *
 * A photo is named after the garment or the worn day it belongs to, and
 * both are scoped by owner, so the filename is a claim about someone's
 * wardrobe: it is only served to the account whose wardrobe it is. The id
 * is a cuid, unguessable, but a link that leaks, or a file left behind by
 * an account that shares nothing else, must not open another person's
 * clothes.
 */
export async function ownsPhoto(userId: string, filename: string): Promise<boolean> {
  const id = PHOTO_FILENAME.exec(filename)?.[1];
  if (!id) return false;
  const [garment, day] = await Promise.all([findGarmentById(userId, id), findDayById(userId, id)]);
  return Boolean(garment || day);
}
