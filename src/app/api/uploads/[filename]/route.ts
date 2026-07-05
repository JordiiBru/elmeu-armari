import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getUploadDir } from "@/lib/uploads";

const SAFE_FILENAME = /^[a-z0-9]+(?:-thumb)?\.webp$/;

async function readOrNull(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const dir = getUploadDir();
  let data = await readOrNull(path.join(dir, filename));

  if (!data && filename.endsWith("-thumb.webp")) {
    const original = filename.replace("-thumb.webp", ".webp");
    data = await readOrNull(path.join(dir, original));
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
