#!/usr/bin/env node
/**
 * Regenerates the `-thumb.webp` companion of every uploaded photo from
 * the photo itself.
 *
 * Two reasons to run it: the thumbnail size changed (see `THUMB_PX` in
 * `src/lib/uploads.ts`), or a companion went missing. A missing one is
 * not fatal — `/api/uploads/[filename]` serves the original in its place
 * — which is precisely why it is worth fixing: that fallback ships an
 * 800px photograph into a 165px tile, so the wardrobe ends up with some
 * pieces sharper than others for no reason anybody can see.
 *
 * Plain node, like `create-user.mjs`: it has to run inside the
 * production image, where nothing compiles TypeScript.
 *
 *   npm run rebuild-thumbs            # only the missing ones
 *   npm run rebuild-thumbs -- --all   # every one of them
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

const THUMB_PX = 480;

const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
const all = process.argv.includes("--all");

const entries = await fs.readdir(dir).catch((e) => {
  if (e.code === "ENOENT") {
    console.error(`No upload directory at ${dir}`);
    process.exit(1);
  }
  throw e;
});

const originals = entries.filter((f) => f.endsWith(".webp") && !f.endsWith("-thumb.webp"));
const present = new Set(entries);

let written = 0;
let skipped = 0;
let failed = 0;

for (const filename of originals) {
  const thumb = filename.replace(/\.webp$/, "-thumb.webp");
  if (!all && present.has(thumb)) {
    skipped++;
    continue;
  }
  try {
    await sharp(path.join(dir, filename))
      .resize(THUMB_PX, THUMB_PX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(dir, thumb));
    written++;
  } catch (e) {
    failed++;
    console.error(`${filename}: ${e.message}`);
  }
}

console.log(
  `${written} thumbnail(s) written, ${skipped} left alone, ${failed} failed — ${dir}`,
);
