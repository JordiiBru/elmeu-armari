import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { requireSession } from "@/lib/auth/api";
import { findAllGarments } from "@/lib/prendas/service";
import { findDayPhotoFilenames } from "@/lib/outfits/service";
import { getUploadDir } from "@/lib/uploads";
import { buildZip, type ZipEntry } from "@/lib/zip";

async function readImageFile(filename: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(getUploadDir(), filename));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** A photo and its thumbnail companion, when the files are still there. */
async function pushImage(entries: ZipEntry[], filename: string): Promise<void> {
  const thumbName = filename.replace(/\.webp$/, "-thumb.webp");
  const [full, thumb] = await Promise.all([
    readImageFile(filename),
    readImageFile(thumbName),
  ]);
  if (full) entries.push({ name: `images/${filename}`, data: full });
  if (thumb) entries.push({ name: `images/${thumbName}`, data: thumb });
}

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  const [garments, dayPhotos] = await Promise.all([
    findAllGarments(),
    findDayPhotoFilenames(),
  ]);

  const data = garments.map((g) => ({
    id: g.id,
    category: g.category,
    texture: g.texture,
    pattern: g.pattern,
    seasons: g.seasons.map((s) => s.season),
    size: g.size,
    subtype: g.subtype,
    length: g.length,
    fit: g.fit,
    notes: g.notes,
    colors: g.colors.map((c) => c.hex),
    image: g.image,
    createdAt: g.createdAt.toISOString(),
  }));

  const payload = { version: 3, exportedAt: new Date().toISOString(), garments: data };

  const entries: ZipEntry[] = [
    { name: "data.json", data: Buffer.from(JSON.stringify(payload, null, 2), "utf8") },
  ];

  for (const g of garments) {
    if (g.image) await pushImage(entries, g.image);
  }

  // Day photos have no row in `data.json` — the payload is garments only,
  // and neither outfits nor the calendar are exported. The files still
  // travel, because losing the pictures you took of yourself to a backup
  // that looked complete is the one failure this export cannot afford.
  for (const image of dayPhotos) {
    await pushImage(entries, image);
  }

  const zip = buildZip(entries);

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="elmeu-armari-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
