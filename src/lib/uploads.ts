import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { removeBackground } from "./background-removal";

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

/** The cut-out companion of a garment photo: the piece on a transparent
 * ground, trimmed to its edges. Absent when there is none, and the
 * garment then falls back to its photograph. */
export function cutoutName(id: string): string {
  return `${id}-cutout.webp`;
}

/** A cut-out that keeps less than this of its frame is a failed mask, not
 * a garment: better none than a sliver. */
const MIN_CUTOUT_COVERAGE = 0.03;

/** Alpha below this counts as "not opaque" when deciding whether a photo
 * already is a cut-out. */
const OPAQUE = 250;

async function hasTransparency(buffer: Buffer): Promise<boolean> {
  const { channels } = await sharp(buffer).metadata();
  if (!channels || channels < 4) return false;
  const alpha = await sharp(buffer).ensureAlpha().extractChannel(3).stats();
  return alpha.channels[0].min < OPAQUE;
}

/**
 * Turns a cut-out (PNG or WebP with alpha) into the stored file: trimmed
 * to the piece, WebP with alpha. Returns null when nothing sensible is
 * left of it.
 */
export async function encodeCutout(cutout: Buffer): Promise<Buffer | null> {
  const alpha = await sharp(cutout).ensureAlpha().extractChannel(3).stats();
  const coverage = alpha.channels[0].mean / 255;
  if (coverage < MIN_CUTOUT_COVERAGE) return null;
  return sharp(cutout)
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .webp({ quality: 80, alphaQuality: 90 })
    .toBuffer();
}

/**
 * Best-effort cut-out of a garment photo, stored next to it. Never
 * throws: a garment without one is a supported state. The sidecar is sent
 * the 800 px photo rather than the phone's original, since the model
 * works far below that resolution anyway. A photo that already has a
 * transparent ground (an iOS "lift subject") is its own cut-out.
 */
export async function saveGarmentCutout(buffer: Buffer, id: string): Promise<boolean> {
  try {
    await deleteCutout(id);
    const photo = await sharp(buffer)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const cutout = (await hasTransparency(photo)) ? photo : await removeBackground(photo);
    if (!cutout) return false;
    const encoded = await encodeCutout(cutout);
    if (!encoded) return false;
    await ensureUploadDir();
    await fs.writeFile(path.join(getUploadDir(), cutoutName(id)), encoded);
    return true;
  } catch (e) {
    console.error(`cut-out for ${id} failed:`, e);
    return false;
  }
}

/** Filenames of the cut-outs that exist, for callers deciding between a
 * cut-out and the photograph without a stat per garment. */
export async function listCutouts(): Promise<Set<string>> {
  try {
    const entries = await fs.readdir(getUploadDir());
    return new Set(entries.filter((f) => f.endsWith("-cutout.webp")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return new Set();
    throw e;
  }
}

export async function deleteCutout(id: string): Promise<void> {
  await fs.unlink(path.join(getUploadDir(), cutoutName(id))).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
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
    [`${id}.webp`, thumbName(id), cutoutName(id)].map((name) =>
      fs.unlink(path.join(dir, name)).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      })
    )
  );
}
