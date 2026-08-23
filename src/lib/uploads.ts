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
      .resize(300, 300, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
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
