import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
}

export function getUploadMaxMb(): number {
  return Number(process.env.UPLOAD_MAX_MB ?? "10");
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(getUploadDir(), { recursive: true });
}

/**
 * The long edge of the thumbnail companion, and the reason it is not
 * smaller: the app's densest grid draws a tile about 165 CSS px wide,
 * which is 330 device pixels on a 2x screen and 495 on a phone. At the
 * old 300 the same photograph was visibly softer in a grid than in a
 * sheet — and softer in some grids than in others, because a garment
 * whose thumbnail was missing fell through to the 800px original and
 * looked better than its neighbours.
 *
 * `scripts/rebuild-thumbs.mjs` regenerates existing files against this
 * number. Changing it means running that script.
 */
const THUMB_PX = 480;

function thumbName(id: string): string {
  return `${id}-thumb.webp`;
}

/**
 * Writes an uploaded photo and its thumbnail companion under `id`, and
 * returns the filename to store on the row.
 *
 * Not garment-specific: a day's photo goes through the same pipeline
 * (WebP 800px, EXIF stripped, `-thumb` companion) under its worn-event
 * id, and `/api/uploads/[filename]` already serves any cuid-named file.
 */
export async function saveUploadImage(buffer: Buffer, id: string): Promise<string> {
  await ensureUploadDir();
  const filename = `${id}.webp`;
  const dir = getUploadDir();
  const full = sharp(buffer).rotate();
  await Promise.all([
    full
      .clone()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(dir, filename)),
    full
      .clone()
      .resize(THUMB_PX, THUMB_PX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(dir, thumbName(id))),
  ]);
  return filename;
}

export async function deleteUploadImage(id: string): Promise<void> {
  const dir = getUploadDir();
  await Promise.all(
    [`${id}.webp`, thumbName(id)].map((name) =>
      fs.unlink(path.join(dir, name)).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      })
    )
  );
}
