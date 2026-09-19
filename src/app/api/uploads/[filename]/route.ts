import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { requireSession } from "@/lib/auth/api";
import { getUploadDir } from "@/lib/uploads";

// A filename is an id plus at most one companion suffix. The id part has
// no `-`, `.` or `/`, so a suffix cannot be smuggled in twice and no path
// can be built out of it. `-cutout` was added with the background removal:
// same charset, same session guard, same private cache policy as a photo.
const SAFE_FILENAME = /^[a-z0-9]+(?:-thumb|-cutout)?\.webp$/;

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
  const denied = await requireSession();
  if (denied) return denied;

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
      // Private, not public: these are photographs of one person's
      // clothes, and a shared cache has no business holding a copy.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
