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

/**
 * A 10 MB PNG can declare a 16k x 16k canvas, about a gigabyte once
 * decoded, in a pod limited to 512 MiB. sharp's own default (268 MP) is far
 * above what any phone produces; 50 MP covers a 48 MP camera.
 */
const MAX_INPUT_PIXELS = 50_000_000;

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
  const full = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  const encode = (edge: number) =>
    full.clone().resize(edge, edge, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  // Encode both before writing either: a truncated file that fails halfway
  // must not leave a half-written photo or a thumbnail out of step with it.
  const [photo, thumb] = await Promise.all([encode(800), encode(THUMB_PX)]);
  await Promise.all([
    fs.writeFile(path.join(dir, filename), photo),
    fs.writeFile(path.join(dir, thumbName(id)), thumb),
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
