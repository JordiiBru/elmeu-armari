#!/usr/bin/env node
/**
 * Gives every garment photo that has none a cut-out, by sending it to the
 * background removal sidecar (`sidecars/rembg`).
 *
 * New uploads get theirs on upload (`saveGarmentCutout` in
 * `src/lib/uploads.ts`); this is for the photos that were there before,
 * and for a re-run after the sidecar or its model changed.
 *
 * Plain node, like `rebuild-thumbs.mjs` and `create-user.mjs`: it has to
 * run inside the production image, where nothing compiles TypeScript. The
 * garment photos are read from the database rather than by looking at the
 * directory, because day photos live in the same folder and are already
 * cut-outs of a different kind. The steps after the sidecar answers
 * mirror `saveGarmentCutout`; keep them in step.
 *
 *   BG_REMOVAL_URL=http://rembg:7000 npm run backfill-cutouts
 *   npm run backfill-cutouts -- --all      # redo the ones that exist
 *   npm run backfill-cutouts -- --dry-run  # only say what it would do
 *
 * The original photograph is never touched.
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import Database from "better-sqlite3";

const MIN_CUTOUT_COVERAGE = 0.03;
const OPAQUE = 250;
const TIMEOUT_MS = 30_000;

const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
const all = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");
const base = process.env.BG_REMOVAL_URL?.trim().replace(/\/+$/, "");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("file:")) {
  console.error("DATABASE_URL must be a file: URL");
  process.exit(1);
}
if (!base && !dryRun) {
  console.error("BG_REMOVAL_URL is not set: nothing to send the photos to");
  process.exit(1);
}

const db = new Database(databaseUrl.replace(/^file:/, ""), { readonly: true, fileMustExist: true });
const images = db
  .prepare("SELECT image FROM Garment WHERE image IS NOT NULL")
  .all()
  .map((row) => row.image);
db.close();

async function exists(file) {
  return fs.stat(file).then(
    () => true,
    () => false,
  );
}

async function hasTransparency(buffer) {
  const { channels } = await sharp(buffer).metadata();
  if (!channels || channels < 4) return false;
  const alpha = await sharp(buffer).ensureAlpha().extractChannel(3).stats();
  return alpha.channels[0].min < OPAQUE;
}

async function askSidecar(png) {
  const body = new FormData();
  body.append("file", new Blob([png], { type: "image/png" }), "photo.png");
  const res = await fetch(`${base}/remove`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`sidecar answered ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function encode(cutout) {
  const alpha = await sharp(cutout).ensureAlpha().extractChannel(3).stats();
  if (alpha.channels[0].mean / 255 < MIN_CUTOUT_COVERAGE) return null;
  return sharp(cutout)
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .webp({ quality: 80, alphaQuality: 90 })
    .toBuffer();
}

let written = 0;
let skipped = 0;
let missing = 0;
let rejected = 0;
let failed = 0;

for (const image of images) {
  const source = path.join(dir, image);
  const target = path.join(dir, image.replace(/\.webp$/, "-cutout.webp"));

  if (!(await exists(source))) {
    missing++;
    continue;
  }
  if (!all && (await exists(target))) {
    skipped++;
    continue;
  }
  if (dryRun) {
    console.log(`would cut out ${image}`);
    written++;
    continue;
  }

  try {
    const photo = await sharp(source)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const cutout = (await hasTransparency(photo)) ? photo : await askSidecar(photo);
    const encoded = await encode(cutout);
    if (!encoded) {
      rejected++;
      console.error(`${image}: the mask kept almost nothing, no cut-out written`);
      continue;
    }
    await fs.writeFile(target, encoded);
    written++;
  } catch (e) {
    failed++;
    console.error(`${image}: ${e.message}`);
  }
}

console.log(
  `${written} cut-out(s) ${dryRun ? "to write" : "written"}, ${skipped} already there, ` +
    `${missing} photo file(s) missing, ${rejected} rejected, ${failed} failed — ${dir}`,
);
process.exit(failed > 0 ? 1 : 0);
