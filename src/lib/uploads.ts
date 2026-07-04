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

export async function saveGarmentImage(buffer: Buffer, id: string): Promise<string> {
  await ensureUploadDir();
  const filename = `${id}.webp`;
  const dest = path.join(getUploadDir(), filename);
  await sharp(buffer)
    .rotate()
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dest);
  return filename;
}

export async function deleteGarmentImage(id: string): Promise<void> {
  const filePath = path.join(getUploadDir(), `${id}.webp`);
  await fs.unlink(filePath).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
}
