#!/usr/bin/env node
/**
 * Lists uploaded photos whose top rows were stored black.
 *
 * Some photos were written with a black band over their top (always whole
 * 16-row blocks) while the thumbnail made from the same upload is intact,
 * so the damage shows in sheets and the builder but not in the grid. The
 * thumbnail is the witness: a photo is listed when its dark band is much
 * taller than its thumbnail's, scaled to the same height. A photo that is
 * really dark at the top (a black coat on black) is dark in both and is
 * left out. Transparent rows (day cut-outs) count as white, not black.
 *
 * It only reads. The fix is to upload the listed photo again from the
 * piece's edit screen; the file name is the garment id (or the day's
 * worn-event id).
 *
 * Plain node, like `rebuild-thumbs.mjs`: it has to run inside the
 * production image, where nothing compiles TypeScript.
 *
 *   npm run find-banded-photos
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

/** Mean channel value under which a row counts as black. */
const DARK_ROW = 25;
/** Smallest band worth reporting: one macroblock row of an 800px photo. */
const MIN_BAND_FRACTION = 16 / 800;

const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

const entries = await fs.readdir(dir).catch((e) => {
  if (e.code === "ENOENT") {
    console.error(`No upload directory at ${dir}`);
    process.exit(1);
  }
  throw e;
});
const present = new Set(entries);

/** Share of the image height, from the top, made of black rows. */
async function darkTop(file) {
  const { data, info } = await sharp(file)
    .flatten({ background: "#ffffff" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let rows = 0;
  for (; rows < height; rows++) {
    let sum = 0;
    const start = rows * width * channels;
    for (let i = start; i < start + width * channels; i += channels) {
      sum += data[i] + data[i + 1] + data[i + 2];
    }
    if (sum / (3 * width) >= DARK_ROW) break;
  }
  return { rows, fraction: rows / height };
}

const originals = entries.filter((f) => f.endsWith(".webp") && !f.endsWith("-thumb.webp"));
let banded = 0;
let failed = 0;

for (const filename of originals) {
  try {
    const photo = await darkTop(path.join(dir, filename));
    if (photo.fraction < MIN_BAND_FRACTION) continue;
    const thumbName = filename.replace(/\.webp$/, "-thumb.webp");
    if (present.has(thumbName)) {
      const thumb = await darkTop(path.join(dir, thumbName));
      if (thumb.fraction >= photo.fraction / 2) continue;
      console.log(`${filename}: top ${photo.rows} rows black, thumbnail intact`);
    } else {
      console.log(`${filename}: top ${photo.rows} rows black, no thumbnail to compare`);
    }
    banded++;
  } catch (e) {
    failed++;
    console.error(`${filename}: ${e.message}`);
  }
}

console.log(`${banded} banded photo(s) of ${originals.length}, ${failed} unreadable — ${dir}`);
